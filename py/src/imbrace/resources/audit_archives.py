import re
from typing import Any, Dict, List, Optional, cast
from urllib.parse import quote

from ..http import AsyncHttpTransport, HttpTransport

# Archive statuses: archived (out of the live feed), restoring (being copied back, do not read
# yet), restored (back in the live feed until restoreExpiresAt), failed (error says why),
# purged (deleted at the end of the retention period).
#
# Retention outcomes: unchanged, increased (applied at once), scheduled (a shorter retention,
# applied after a grace period, see retention.pending), cancelled (a pending decrease called off).


def _data(res: Any) -> Dict[str, Any]:
    body = res.json()
    return cast(Dict[str, Any], body.get("data") if isinstance(body, dict) else body)


def _change(res: Any) -> Dict[str, Any]:
    body = res.json()
    return {
        "policy": body.get("data"),
        "outcome": body.get("outcome"),
        "retention": body.get("retention"),
    }


def _download(res: Any, month: str) -> Dict[str, Any]:
    disposition = res.headers.get("content-disposition", "")
    m = re.search(r'filename="?([^";]+)"?', disposition)
    return {
        "data": res.content,
        "filename": m.group(1) if m else f"audit-{month}.jsonl.gz",
        "sha256": res.headers.get("x-archive-sha256"),
        "filtered": res.headers.get("x-archive-filtered") == "resource",
    }


def _download_params(resource: Optional[List[str]]) -> Dict[str, Any]:
    return {"resource": ",".join(resource)} if resource else {}


def _restore_body(from_month: str, to_month: Optional[str]) -> Dict[str, Any]:
    body: Dict[str, Any] = {"from": from_month}
    if to_month is not None:
        body["to"] = to_month
    return body


def _q(month: str) -> str:
    return quote(month, safe="")


class AuditArchivesResource:
    """Audit log months past the live window, kept as files — Sync.

    Platform ``/v1/audit-archives``.

    Reading the list and the retention is open to members. Downloading, restoring, extending
    and releasing need an admin; changing the retention needs the organization's owner or an
    admin. A legal hold is placed or lifted by iMBrace only.

    @param base - platform base URL (``{gateway}/platform``)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/audit-archives"

    def list(self) -> Dict[str, Any]:
        """``{hotFrom, store, restore: {defaultDays, maxDays, maxMonths}, retention, archives}``.

        Each archive: ``{id, month, status, rows, bytes, sha256, prevSha256, archivedAt,
        restoredAt, restoreExpiresAt, restoredBy, error, stats}``.
        """
        return _data(self._http.request("GET", self._base))

    def get_policy(self) -> Dict[str, Any]:
        """How long the audit log is kept: ``{hotMonths, totalMonths, isDefault, minTotalMonths,
        maxTotalMonths, policy, pending, canEdit, ...}``."""
        return _data(self._http.request("GET", f"{self._base}/policy"))

    def set_policy(self, total_months: int) -> Dict[str, Any]:
        """Keep the audit log for ``total_months`` in all (live + archived), e.g. 12 for a year.

        A longer retention applies at once; a shorter one is scheduled after a grace period and
        can be called off with :meth:`cancel_pending_policy`.
        Returns ``{policy, outcome, retention}``.
        """
        return _change(
            self._http.request("PUT", f"{self._base}/policy", json={"totalMonths": total_months})
        )

    def cancel_pending_policy(self) -> Dict[str, Any]:
        """Call off a scheduled decrease. Returns ``{policy, outcome, retention}``."""
        return _change(self._http.request("DELETE", f"{self._base}/policy/pending"))

    def download(self, month: str, resource: Optional[List[str]] = None) -> Dict[str, Any]:
        """One archived month (``YYYY-MM``) as gzip-compressed JSON Lines.

        ``resource`` keeps only those entry types, e.g. ``["user", "role"]``.
        Returns ``{data: bytes, filename, sha256, filtered}``.
        """
        res = self._http.request(
            "GET", f"{self._base}/{_q(month)}/download", params=_download_params(resource)
        )
        return _download(res, month)

    def restore(self, from_month: str, to_month: Optional[str] = None) -> Dict[str, Any]:
        """Bring archived months back into the live feed so ``audit_logs.list()`` reads them again.

        Runs in the background.
        Returns ``{status: "accepted", months, alreadyRestored, expiresAt}``.
        """
        return _data(
            self._http.request(
                "POST", f"{self._base}/restore", json=_restore_body(from_month, to_month)
            )
        )

    def extend(self, month: str, days: int) -> Dict[str, Any]:
        """Keep a restored month ``days`` longer. Returns ``{status, month, expiresAt, capped}``."""
        return _data(
            self._http.request("POST", f"{self._base}/{_q(month)}/extend", json={"days": days})
        )

    def release(self, month: str) -> Dict[str, Any]:
        """Send a restored month back to the archive before it expires.

        Returns ``{status, month}``.
        """
        return _data(self._http.request("POST", f"{self._base}/{_q(month)}/release"))


class AsyncAuditArchivesResource:
    """Audit log archives — Async. See :class:`AuditArchivesResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/audit-archives"

    async def list(self) -> Dict[str, Any]:
        return _data(await self._http.request("GET", self._base))

    async def get_policy(self) -> Dict[str, Any]:
        return _data(await self._http.request("GET", f"{self._base}/policy"))

    async def set_policy(self, total_months: int) -> Dict[str, Any]:
        return _change(
            await self._http.request(
                "PUT", f"{self._base}/policy", json={"totalMonths": total_months}
            )
        )

    async def cancel_pending_policy(self) -> Dict[str, Any]:
        return _change(await self._http.request("DELETE", f"{self._base}/policy/pending"))

    async def download(self, month: str, resource: Optional[List[str]] = None) -> Dict[str, Any]:
        res = await self._http.request(
            "GET", f"{self._base}/{_q(month)}/download", params=_download_params(resource)
        )
        return _download(res, month)

    async def restore(self, from_month: str, to_month: Optional[str] = None) -> Dict[str, Any]:
        return _data(
            await self._http.request(
                "POST", f"{self._base}/restore", json=_restore_body(from_month, to_month)
            )
        )

    async def extend(self, month: str, days: int) -> Dict[str, Any]:
        return _data(
            await self._http.request(
                "POST", f"{self._base}/{_q(month)}/extend", json={"days": days}
            )
        )

    async def release(self, month: str) -> Dict[str, Any]:
        return _data(await self._http.request("POST", f"{self._base}/{_q(month)}/release"))
