from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


def _query(params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in (params or {}).items():
        if v is None:
            continue
        out[k] = str(v).lower() if isinstance(v, bool) else v
    return out


def _data(res: Any) -> Any:
    return res.get("data") if isinstance(res, dict) else res


class AuditLogsResource:
    """The organization's audit trail (platform ``/v1/audit-logs``) — Sync. Needs the ``audit_trail`` feature.

    @param base - platform base URL (``{gateway}/platform``)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/audit-logs"

    def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Filtered page of entries: ``{data, pagination}``.

        Filters (multi-value ones take comma-separated values): ``userId``,
        ``resource``, ``resourceId``, ``action``, ``boardId``, ``from`` / ``to``
        (ISO dates), ``q`` (text search), ``imports`` (only|exclude), ``page``,
        ``limit`` (max 100, default 25), ``cursor``, ``includeArchive``.
        """
        return self._http.request("GET", self._base, params=_query(params)).json()

    def summary(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Counts by action, resource and user over a date range (``from`` / ``to``)."""
        return _data(self._http.request("GET", f"{self._base}/summary", params=_query(params)).json())

    def get(self, entry_id: str) -> Dict[str, Any]:
        return _data(self._http.request("GET", f"{self._base}/{entry_id}").json())

    def revert(self, entry_id: str) -> Dict[str, Any]:
        """Undo the change an entry records, when ``revertable``. Returns ``{revertEntry, restoredResourceId?}``."""
        return _data(self._http.request("POST", f"{self._base}/{entry_id}/revert").json())


class AsyncAuditLogsResource:
    """The organization's audit trail — Async. See :class:`AuditLogsResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/audit-logs"

    async def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", self._base, params=_query(params))
        return res.json()

    async def summary(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/summary", params=_query(params))
        return _data(res.json())

    async def get(self, entry_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/{entry_id}")
        return _data(res.json())

    async def revert(self, entry_id: str) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/{entry_id}/revert")
        return _data(res.json())
