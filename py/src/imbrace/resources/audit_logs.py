from typing import Any, AsyncIterator, Dict, Iterator, Optional
from urllib.parse import quote

from ..http import AsyncHttpTransport, HttpTransport

# Filters (shared by list and summary). Multi-value ones take a list or a comma-separated string:
#   userId, resource, resourceId, action, boardId, runId, caseId
#   categoryId (every board in the category), from / to (ISO dates), q (text search),
#   imports ("only" | "exclude"), includeArchive (also read archived months)
# Paging (list only): page, limit (max 100, default 25), cursor.
#
# action: create, update, delete, upload, login, login_failed, revert, export, download, connect.
# resource: board_item, file, board, folder, session, integration, segmentation, doc_schema,
#   doc_category, doc_settings, dociq_extraction, scheduler, automation, channel, contact, campaign,
#   message_template, team, team_user, user, role, api_key, sso_config, oidc_role_mapping,
#   business_unit, organization, assistant, llm_provider, file_object, financial_file, app_install,
#   app_package, marketplace_template, use_case, email_template, form, marketplace_file, flow,
#   tool_server, audit_retention, audit_retention_purge.


def _query(params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in (params or {}).items():
        if v is None:
            continue
        if isinstance(v, bool):
            out[k] = str(v).lower()
        elif isinstance(v, (list, tuple, set)):
            if v:
                out[k] = ",".join(str(x) for x in v)
        else:
            out[k] = v
    return out


def _data(res: Any) -> Any:
    return res.get("data") if isinstance(res, dict) else res


def _next_cursor(page: Dict[str, Any]) -> Optional[str]:
    pagination = page.get("pagination") or {}
    cursor = pagination.get("nextCursor")
    return cursor if pagination.get("hasMore") and cursor else None


def _iter_params(params: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    out = {k: v for k, v in (params or {}).items() if k not in ("page", "cursor")}
    out.setdefault("limit", 100)
    return out


class AuditLogsResource:
    """The organization's audit trail (platform ``/v1/audit-logs``) — Sync.

    Needs the ``audit_trail`` feature.

    @param base - platform base URL (``{gateway}/platform``)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/audit-logs"

    def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """One page of entries, newest first: ``{data, pagination}``.

        Filters: ``userId``, ``resource``, ``resourceId``, ``action``, ``boardId``, ``runId``,
        ``caseId`` (a list or comma-separated), ``categoryId``, ``from`` / ``to`` (ISO dates),
        ``q`` (text search), ``imports`` (only|exclude), ``includeArchive``. Paging: ``page``,
        ``limit`` (max 100, default 25), ``cursor`` (``pagination.nextCursor``).
        """
        return self._http.request("GET", self._base, params=_query(params)).json()

    def iterate(self, params: Optional[Dict[str, Any]] = None) -> Iterator[Dict[str, Any]]:
        """Every entry that matches, newest first, page by page (same filters as :meth:`list`)."""
        query = _iter_params(params)
        while True:
            page = self.list(query)
            yield from page.get("data") or []
            cursor = _next_cursor(page)
            if not cursor:
                return
            query = {**query, "cursor": cursor}

    def summary(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Counts by action, resource and user for the entries that match.

        Same filters as :meth:`list`.
        """
        return _data(
            self._http.request("GET", f"{self._base}/summary", params=_query(params)).json()
        )

    def get(self, entry_id: str) -> Dict[str, Any]:
        return _data(self._http.request("GET", f"{self._base}/{quote(entry_id, safe='')}").json())

    def revert(self, entry_id: str) -> Dict[str, Any]:
        """Undo the change an entry records, when ``revertable``.

        Returns ``{revertEntry, restoredResourceId?}``.

        Needs the ``audit_trail:write`` permission.
        """
        return _data(
            self._http.request("POST", f"{self._base}/{quote(entry_id, safe='')}/revert").json()
        )


class AsyncAuditLogsResource:
    """The organization's audit trail — Async. See :class:`AuditLogsResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/audit-logs"

    async def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", self._base, params=_query(params))
        return res.json()

    async def iterate(
        self, params: Optional[Dict[str, Any]] = None
    ) -> AsyncIterator[Dict[str, Any]]:
        """See :meth:`AuditLogsResource.iterate`."""
        query = _iter_params(params)
        while True:
            page = await self.list(query)
            for entry in page.get("data") or []:
                yield entry
            cursor = _next_cursor(page)
            if not cursor:
                return
            query = {**query, "cursor": cursor}

    async def summary(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/summary", params=_query(params))
        return _data(res.json())

    async def get(self, entry_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/{quote(entry_id, safe='')}")
        return _data(res.json())

    async def revert(self, entry_id: str) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/{quote(entry_id, safe='')}/revert")
        return _data(res.json())
