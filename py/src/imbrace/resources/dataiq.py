"""DataIQ v2 (``/data-board/v2``).

Boards with relations, rollups and formulas, typed record filters, read-only SQL
across the org, sources, and AI values a person confirms (human in the loop).

v2 keeps its own data, separate from ``client.boards`` (v1); the two do not sync
and can be used side by side. Knowledge Hub folders, files and drives stay on
``client.boards``.

Shapes follow v1: boards and records carry ``_id`` and ``id``; a record's values
go in ``fields`` keyed by field id. Request bodies are passed through as given,
with the server's key names (``itemIds``, ``valueIds``, ``fieldId``...).

Query parameters come in two kinds on the server: ``types`` / ``teamIds`` on
``GET /boards`` repeat the key (``types=A&types=B``), while ``ids``,
``board_ids`` and ``tables`` take one comma-joined string. The methods here
build each the right way.
"""
import re
from typing import Any, Dict, List, Optional, Union

from ..exceptions import ApiError, AuthError, DataIqError, ImbraceError
from ..http import AsyncHttpTransport, HttpTransport

_READ_ONLY = re.compile(r'"code"\s*:\s*"read_only"')


def _clean(values: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in values.items() if v is not None}


def _parse(res: Any) -> Any:
    if res.status_code == 204 or not res.content:
        return None
    return res.json()


def _data(res: Any) -> Any:
    return res.get("data") if isinstance(res, dict) else res


def _join(ids: Optional[List[str]]) -> Optional[str]:
    return ",".join(ids) if ids is not None else None


def _to_dataiq_error(e: Exception) -> Optional[DataIqError]:
    """Map v2's documented refusals to DataIqError; anything else stays as is."""
    if isinstance(e, ApiError):
        if e.status_code == 503:
            return DataIqError("disabled", 503, f"DataIQ v2 is not available in this environment. {e}")
        if e.status_code == 402:
            return DataIqError("plan_limit", 402, f"The plan's DataIQ limit is reached. {e}")
    # the transport turns every 401/403 into AuthError; View-Only is told apart by the body
    if isinstance(e, AuthError) and e.status_code == 403 and _READ_ONLY.search(e.body or ""):
        return DataIqError("read_only", 403, f"Your team has View-Only access to this board. {e.body}")
    return None


def _unavailable(e: Exception) -> Optional[Dict[str, Any]]:
    """health() answer for an environment without v2: 404 (no v2 code) or 503 (switched off)."""
    if (isinstance(e, ApiError) and e.status_code == 404) or (
        isinstance(e, DataIqError) and e.code == "disabled"
    ):
        return {"status": "unavailable", "enabled": False, "ready": False, "error": str(e)}
    return None


def _pick_new_field(board: Dict[str, Any], name: str) -> Dict[str, Any]:
    """Field routes return the whole board; find the field just added by name (last match wins)."""
    matches = [f for f in (board or {}).get("fields") or [] if f.get("name") == name]
    if not matches:
        raise ImbraceError(
            f'DataIQ: field "{name}" not found on board {(board or {}).get("id")} after adding it'
        )
    return matches[-1]


def _kwargs(params: Optional[Dict[str, Any]], body: Any, files: Any) -> Dict[str, Any]:
    kwargs: Dict[str, Any] = {}
    query = _clean(params or {})
    if query:
        kwargs["params"] = query
    if files is not None:
        kwargs["files"] = files
    elif body is not None:
        kwargs["json"] = body
    return kwargs


class _Fetcher:
    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    def __call__(self, method: str, path: str, params: Optional[Dict[str, Any]] = None,
                 body: Any = None, files: Any = None) -> Any:
        try:
            res = self._http.request(method, f"{self._base}{path}", **_kwargs(params, body, files))
        except (ApiError, AuthError) as e:
            mapped = _to_dataiq_error(e)
            if mapped is not None:
                raise mapped from e
            raise
        return _parse(res)


class _AsyncFetcher:
    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def __call__(self, method: str, path: str, params: Optional[Dict[str, Any]] = None,
                       body: Any = None, files: Any = None) -> Any:
        try:
            res = await self._http.request(method, f"{self._base}{path}", **_kwargs(params, body, files))
        except (ApiError, AuthError) as e:
            mapped = _to_dataiq_error(e)
            if mapped is not None:
                raise mapped from e
            raise
        return _parse(res)


def _boards_list_params(search: Optional[str], types: Optional[List[str]], team_ids: Optional[List[str]],
                        hidden: Optional[bool], category_id: Optional[str], from_schema_id: Optional[str],
                        limit: Optional[int], skip: Optional[int]) -> Dict[str, Any]:
    # types / teamIds repeat the key: a list value makes httpx send types=A&types=B
    return {"search": search, "types": types, "teamIds": team_ids, "hidden": hidden,
            "category_id": category_id, "from_schema_id": from_schema_id, "limit": limit, "skip": skip}


# ── Groups (sync) ────────────────────────────────────────────────────────────


class DataIqBoards:
    """Boards (``/boards``)."""

    def __init__(self, f: _Fetcher):
        self._f = f

    def list(self, search: Optional[str] = None, types: Optional[List[str]] = None,
             team_ids: Optional[List[str]] = None, hidden: Optional[bool] = None,
             category_id: Optional[str] = None, from_schema_id: Optional[str] = None,
             limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        """Boards of the org: ``{data, total, count}``. ``limit`` max 500."""
        return self._f("GET", "/boards", params=_boards_list_params(
            search, types, team_ids, hidden, category_id, from_schema_id, limit, skip))

    def get(self, board_id: str) -> Dict[str, Any]:
        return _data(self._f("GET", f"/boards/{board_id}"))

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a board, with its columns if given (``{name, fields?: [{name, type}], ...}``).

        ``type`` defaults to ``General``.
        """
        return _data(self._f("POST", "/boards", body={"type": "General", **body}))

    def update(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """``icon`` / ``color`` are validated by the server (bad format → 400)."""
        return _data(self._f("PATCH", f"/boards/{board_id}", body=body))

    def delete(self, board_id: str) -> None:
        """Deletes the board and its records."""
        self._f("DELETE", f"/boards/{board_id}")

    def stats(self, board_ids: List[str]) -> Dict[str, Dict[str, int]]:
        """Record count per board, by board id: ``{board_id: {count}}``."""
        return _data(self._f("GET", "/boards/stats", params={"ids": _join(board_ids)}))


class DataIqFields:
    """Columns (``/boards/:id/fields``)."""

    def __init__(self, f: _Fetcher):
        self._f = f

    def add(self, board_id: str, field: Dict[str, Any]) -> Dict[str, Any]:
        """Add a column (``{name, type, ...}``). Returns the new field."""
        board = _data(self._f("POST", f"/boards/{board_id}/fields", body=field))
        return _pick_new_field(board, field.get("name", ""))

    def update(self, board_id: str, field_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
        """Change a column. Returns the board with all its fields."""
        return _data(self._f("PATCH", f"/boards/{board_id}/fields/{field_id}", body=patch))

    def delete(self, board_id: str, field_id: str) -> None:
        self._f("DELETE", f"/boards/{board_id}/fields/{field_id}")


class DataIqItems:
    """Records (``/boards/:id/items``)."""

    def __init__(self, f: _Fetcher):
        self._f = f

    def list(self, board_id: str, skip: Optional[int] = None, limit: Optional[int] = None,
             sort: Optional[str] = None, include_parent: Optional[bool] = None) -> Dict[str, Any]:
        """``{data, count, skip, limit, totalPages?}``. ``limit`` max 1000."""
        return self._f("GET", f"/boards/{board_id}/items", params={
            "skip": skip, "limit": limit, "sort": sort, "include_parent": include_parent})

    def query(self, board_id: str, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Filter with typed rules.

        ``body``: ``{filter?: {match: "and", rules: [{fieldId, op: "gte", value: 100}]}, sort?, skip?, limit?, timeZone?}``.
        Returns ``{data, total, totalCapped, skip, limit, hasMore}``. The gateway counts every
        POST as a write, so the API key needs write permission.
        """
        return self._f("POST", f"/boards/{board_id}/items/query", body=body or {})

    def count(self, board_id: str) -> int:
        return self._f("GET", f"/boards/{board_id}/items/count")["count"]

    def get(self, board_id: str, item_id: str) -> Dict[str, Any]:
        return _data(self._f("GET", f"/boards/{board_id}/items/{item_id}"))

    def create(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """``body``: ``{fields: {field_id: value}, created_type?}``.

        Computed columns (formula, rollup, auto id, back-links) are refused.
        """
        return _data(self._f("POST", f"/boards/{board_id}/items", body=body))

    def create_many(self, board_id: str, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return _data(self._f("POST", f"/boards/{board_id}/items/bulk", body={"items": items}))

    def update(self, board_id: str, item_id: str, fields: Dict[str, Any]) -> Dict[str, Any]:
        """Only the fields given (by field id) change."""
        return _data(self._f("PATCH", f"/boards/{board_id}/items/{item_id}", body={"fields": fields}))

    def delete(self, board_id: str, item_id: str) -> None:
        """Moves the record to the trash (kept 30 days)."""
        self._f("DELETE", f"/boards/{board_id}/items/{item_id}")

    def delete_many(self, board_id: str, item_ids: List[str]) -> int:
        """Moves the records to the trash. Returns how many."""
        return self._f("DELETE", f"/boards/{board_id}/items/bulk-delete",
                       params={"ids": _join(item_ids)})["count"]

    def lookup(self, board_id: str, q: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search records by title, to pick one to link: ``[{id, title}]``."""
        return _data(self._f("GET", f"/boards/{board_id}/lookup", params={"q": q, "limit": limit}))


class DataIqRelations:
    """Relation columns and the links between records."""

    def __init__(self, f: _Fetcher):
        self._f = f

    def create(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Add a relation column linking to another board, optionally with a back-link column there."""
        return _data(self._f("POST", f"/boards/{board_id}/relations", body=body))

    def update(self, board_id: str, field_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
        return _data(self._f("PATCH", f"/boards/{board_id}/relations/{field_id}", body=patch))

    def usage(self, board_id: str, field_id: str) -> Dict[str, Any]:
        return _data(self._f("GET", f"/boards/{board_id}/relations/{field_id}/usage"))

    def set_links(self, board_id: str, item_id: str, field_id: str,
                  linked_item_ids: List[str]) -> Dict[str, Any]:
        """Replace the records one record links to through a relation column (max 1000)."""
        return _data(self._f("PUT", f"/boards/{board_id}/items/{item_id}/relations/{field_id}",
                             body={"ids": linked_item_ids}))

    def add_backlink(self, board_id: str, field_id: str, name: Optional[str] = None) -> Dict[str, Any]:
        """Add the back-link column on the target board."""
        return _data(self._f("POST", f"/boards/{board_id}/fields/{field_id}/backlink",
                             body=_clean({"name": name})))


class DataIqViews:
    """Saved views of a board."""

    def __init__(self, f: _Fetcher):
        self._f = f

    def list(self, board_id: str) -> List[Dict[str, Any]]:
        return _data(self._f("GET", f"/boards/{board_id}/views"))

    def create(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """``body``: ``{name, layout, config?}``; ``config`` defaults to ``{}``."""
        return _data(self._f("POST", f"/boards/{board_id}/views", body={"config": {}, **body}))

    def update(self, board_id: str, view_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
        return _data(self._f("PATCH", f"/boards/{board_id}/views/{view_id}", body=patch))

    def delete(self, board_id: str, view_id: str) -> None:
        self._f("DELETE", f"/boards/{board_id}/views/{view_id}")


class DataIqHistory:
    """Change history of a record. History ids are numbers."""

    def __init__(self, f: _Fetcher):
        self._f = f

    def list(self, board_id: str, item_id: str, limit: Optional[int] = None,
             before: Optional[str] = None) -> List[Dict[str, Any]]:
        """Changes to one record, newest first."""
        return _data(self._f("GET", f"/boards/{board_id}/items/{item_id}/history",
                             params={"limit": limit, "before": before}))

    def revert(self, board_id: str, item_id: str, history_id: Union[str, int]) -> Dict[str, Any]:
        """Undo one change; refused when a cell no longer holds the value that change wrote."""
        return _data(self._f("POST", f"/boards/{board_id}/items/{item_id}/history/{history_id}/revert"))


class DataIqTrash:
    """Deleted records (kept 30 days)."""

    def __init__(self, f: _Fetcher):
        self._f = f

    def list(self, board_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        return _data(self._f("GET", f"/boards/{board_id}/trash", params={"limit": limit}))

    def restore(self, board_id: str, item_ids: List[str]) -> Dict[str, Any]:
        """Restores the records with their links and files: ``{restored, alsoRestored, ids}``."""
        return _data(self._f("POST", f"/boards/{board_id}/trash/restore", body={"itemIds": item_ids}))

    def forget(self, board_id: str, item_ids: List[str]) -> int:
        """Deletes the records for good. Returns how many."""
        return _data(self._f("POST", f"/boards/{board_id}/trash/forget",
                             body={"itemIds": item_ids}))["deleted"]


class DataIqSql:
    """Read-only SQL. Each board is a table; its columns are named by the fields' ``key``."""

    def __init__(self, f: _Fetcher):
        self._f = f

    def schema(self, tables: Optional[List[str]] = None) -> Dict[str, Any]:
        """Tables and columns the org can query."""
        return self._f("GET", "/sql/schema", params={"tables": _join(tables), "format": "json"})

    def run(self, sql: str, limit: Optional[int] = None, offset: Optional[int] = None) -> Dict[str, Any]:
        """Run one read-only SELECT across the org (max 5000 rows).

        The gateway counts every POST as a write, so the API key needs write permission.
        """
        return self._f("POST", "/sql", body=_clean({"sql": sql, "limit": limit, "offset": offset}))

    def board_schema(self, board_id: str) -> Dict[str, Any]:
        """The schema of one board; query it by the returned ``root`` table name."""
        return self._f("GET", f"/boards/{board_id}/sql-schema")

    def run_on_board(self, board_id: str, sql: str, limit: Optional[int] = None,
                     offset: Optional[int] = None) -> Dict[str, Any]:
        """Run a SELECT on one board and the boards it links to (max 200 rows).

        Use the ``root`` table name from :meth:`board_schema`; other names are refused.
        """
        return self._f("POST", f"/boards/{board_id}/sql",
                       body=_clean({"sql": sql, "limit": limit, "offset": offset}))

    def list_queries(self) -> List[Dict[str, Any]]:
        return _data(self._f("GET", "/sql/queries"))

    def create_query(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """``body``: ``{name, description?, sql, visibility}``."""
        return _data(self._f("POST", "/sql/queries", body=body))

    def update_query(self, query_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
        return _data(self._f("PATCH", f"/sql/queries/{query_id}", body=patch))

    def delete_query(self, query_id: str) -> None:
        self._f("DELETE", f"/sql/queries/{query_id}")


class DataIqSources:
    """What came in (emails, chats, files) and which records it fed."""

    def __init__(self, f: _Fetcher):
        self._f = f

    def list(self, origin: Optional[str] = None, group: Optional[str] = None,
             format: Optional[str] = None, q: Optional[str] = None, parent_id: Optional[str] = None,
             nested: Optional[bool] = None, cursor: Optional[str] = None,
             limit: Optional[int] = None) -> Dict[str, Any]:
        """Newest first, by cursor. ``nested`` also returns attachments and messages."""
        return self._f("GET", "/sources/items", params={
            "origin": origin, "group": group, "format": format, "q": q, "parent_id": parent_id,
            "nested": nested, "cursor": cursor, "limit": limit})

    def get(self, source_id: str) -> Dict[str, Any]:
        return _data(self._f("GET", f"/sources/items/{source_id}"))

    def summary(self) -> Dict[str, Any]:
        """``{total, byOrigin}``."""
        return _data(self._f("GET", "/sources/summary"))

    def connections(self) -> Dict[str, Any]:
        """``{channels: [{id, name}], drives}``."""
        return _data(self._f("GET", "/sources/connections"))

    def upload(self, files: Any) -> Dict[str, Any]:
        """Upload files as sources (max 10 files, 25 MB), as httpx ``files`` under the ``files`` field,
        e.g. ``[("files", ("a.pdf", data, "application/pdf"))]``. Returns ``{data, added}``.
        """
        return self._f("POST", "/sources/uploads", files=files)

    def delete(self, source_id: str) -> None:
        self._f("DELETE", f"/sources/items/{source_id}")

    def came_from(self, board_id: str, item_id: str) -> List[Dict[str, Any]]:
        """The sources a record came from."""
        return _data(self._f("GET", f"/boards/{board_id}/items/{item_id}/sources"))

    def set_came_from(self, board_id: str, item_id: str, source_ids: List[str],
                      role: Optional[str] = None) -> List[Dict[str, Any]]:
        """Replace the sources a record came from (max 200).

        ``role``: ``created`` | ``updated`` | ``matched`` | ``mentioned``.
        """
        return _data(self._f("PUT", f"/boards/{board_id}/items/{item_id}/sources",
                             body=_clean({"ids": source_ids, "role": role})))


class DataIqRuns:
    """AI extraction runs and the values a person confirms or rejects (human in the loop)."""

    def __init__(self, f: _Fetcher):
        self._f = f

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Ask AI to fill values: ``{trigger, boardId?, fieldId?, itemIds?, sourceItemIds?, mode?, ...}``.

        ``mode: "dry_run"`` proposes values without writing them.
        """
        return _data(self._f("POST", "/extraction-runs", body=body))

    def list(self, board_id: Optional[str] = None, status: Optional[str] = None,
             trigger: Optional[str] = None, source_item_id: Optional[str] = None,
             cursor: Optional[str] = None, limit: Optional[int] = None) -> Dict[str, Any]:
        return self._f("GET", "/extraction-runs", params={
            "board_id": board_id, "status": status, "trigger": trigger,
            "source_item_id": source_item_id, "cursor": cursor, "limit": limit})

    def get(self, run_id: str) -> Dict[str, Any]:
        return _data(self._f("GET", f"/extraction-runs/{run_id}"))

    def values(self, run_id: str) -> List[Dict[str, Any]]:
        """Proposed values with the quotes they came from."""
        return _data(self._f("GET", f"/extraction-runs/{run_id}/values"))

    def confirm(self, run_id: str, value_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """Confirm the given values, or all of the run's when omitted. Returns ``{confirmed}``."""
        return _data(self._f("POST", f"/extraction-runs/{run_id}/values/confirm",
                             body=_clean({"valueIds": value_ids})))

    def reject(self, run_id: str, value_ids: List[str]) -> Dict[str, Any]:
        """Reject values: the cells get their previous values back. Returns ``{undone, skipped}``."""
        return _data(self._f("POST", f"/extraction-runs/{run_id}/values/reject",
                             body={"valueIds": value_ids}))

    def undo(self, run_id: str) -> Dict[str, Any]:
        """Put back everything the run wrote that nobody has confirmed or edited since."""
        return _data(self._f("POST", f"/extraction-runs/{run_id}/undo"))

    def cancel(self, run_id: str) -> Dict[str, Any]:
        return _data(self._f("POST", f"/extraction-runs/{run_id}/cancel"))

    def to_confirm(self, board_ids: Optional[List[str]] = None) -> Dict[str, int]:
        """How many AI values wait for a person, per board."""
        return _data(self._f("GET", "/ai/to-confirm", params={"board_ids": _join(board_ids)}))

    def board_summary(self, board_id: str) -> Dict[str, Any]:
        """``{toConfirm: {total, byField}, suggestions, runningRuns}``."""
        return _data(self._f("GET", f"/boards/{board_id}/ai-summary"))

    def item(self, board_id: str, item_id: str) -> Dict[str, Any]:
        """AI state of each cell of a record, the runs that touched it and pending suggestions."""
        return _data(self._f("GET", f"/boards/{board_id}/items/{item_id}/ai"))

    def resolve_suggestion(self, board_id: str, item_id: str, field_id: str, accept: bool) -> None:
        """Answer an AI suggestion on a cell a person had filled: ``accept`` uses the new value."""
        self._f("POST", f"/boards/{board_id}/items/{item_id}/fields/{field_id}/suggestion",
                body={"accept": accept})


class DataIqResource:
    """DataIQ v2 — Sync. See the module docstring.

    Groups: ``boards``, ``fields``, ``items``, ``relations``, ``views``, ``history``,
    ``trash``, ``sql``, ``sources``, ``runs``. Call :meth:`health` first in an
    environment that may not have v2.

    Refusals with a known reason raise :class:`~imbrace.exceptions.DataIqError`
    (``disabled`` / ``plan_limit`` / ``read_only``); 404 (board of another org) and
    409 (write to a v1 board that was moved) stay ``ApiError``.

    @param base - DataIQ v2 base URL (``{gateway}/data-board/v2``)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._f = _Fetcher(http, base)
        self.boards = DataIqBoards(self._f)
        self.fields = DataIqFields(self._f)
        self.items = DataIqItems(self._f)
        self.relations = DataIqRelations(self._f)
        self.views = DataIqViews(self._f)
        self.history = DataIqHistory(self._f)
        self.trash = DataIqTrash(self._f)
        self.sql = DataIqSql(self._f)
        self.sources = DataIqSources(self._f)
        self.runs = DataIqRuns(self._f)

    def health(self) -> Dict[str, Any]:
        """Whether v2 is switched on and ready here: ``{status, enabled, ready, error}``.

        Never raises for a missing v2: a data-board without v2 (404) or with v2
        switched off (503) answers ``{"status": "unavailable", "enabled": False, ...}``.
        """
        try:
            return self._f("GET", "/health")
        except (ApiError, DataIqError) as e:
            answer = _unavailable(e)
            if answer is None:
                raise
            return answer

    def routing(self) -> str:
        """Which side serves this org's old ``/data-board`` routes: ``v1`` or ``v2``. v2 routes work either way."""
        return self._f("GET", "/routing/self")["data"]["serves"]

    def members(self, q: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """People in the org, to fill people columns."""
        return _data(self._f("GET", "/members", params={"q": q, "limit": limit}))


# ── Groups (async) ───────────────────────────────────────────────────────────


class AsyncDataIqBoards:
    """Boards — Async. See :class:`DataIqBoards`."""

    def __init__(self, f: _AsyncFetcher):
        self._f = f

    async def list(self, search: Optional[str] = None, types: Optional[List[str]] = None,
                   team_ids: Optional[List[str]] = None, hidden: Optional[bool] = None,
                   category_id: Optional[str] = None, from_schema_id: Optional[str] = None,
                   limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        return await self._f("GET", "/boards", params=_boards_list_params(
            search, types, team_ids, hidden, category_id, from_schema_id, limit, skip))

    async def get(self, board_id: str) -> Dict[str, Any]:
        return _data(await self._f("GET", f"/boards/{board_id}"))

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("POST", "/boards", body={"type": "General", **body}))

    async def update(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("PATCH", f"/boards/{board_id}", body=body))

    async def delete(self, board_id: str) -> None:
        await self._f("DELETE", f"/boards/{board_id}")

    async def stats(self, board_ids: List[str]) -> Dict[str, Dict[str, int]]:
        return _data(await self._f("GET", "/boards/stats", params={"ids": _join(board_ids)}))


class AsyncDataIqFields:
    """Columns — Async. See :class:`DataIqFields`."""

    def __init__(self, f: _AsyncFetcher):
        self._f = f

    async def add(self, board_id: str, field: Dict[str, Any]) -> Dict[str, Any]:
        board = _data(await self._f("POST", f"/boards/{board_id}/fields", body=field))
        return _pick_new_field(board, field.get("name", ""))

    async def update(self, board_id: str, field_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("PATCH", f"/boards/{board_id}/fields/{field_id}", body=patch))

    async def delete(self, board_id: str, field_id: str) -> None:
        await self._f("DELETE", f"/boards/{board_id}/fields/{field_id}")


class AsyncDataIqItems:
    """Records — Async. See :class:`DataIqItems`."""

    def __init__(self, f: _AsyncFetcher):
        self._f = f

    async def list(self, board_id: str, skip: Optional[int] = None, limit: Optional[int] = None,
                   sort: Optional[str] = None, include_parent: Optional[bool] = None) -> Dict[str, Any]:
        return await self._f("GET", f"/boards/{board_id}/items", params={
            "skip": skip, "limit": limit, "sort": sort, "include_parent": include_parent})

    async def query(self, board_id: str, body: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return await self._f("POST", f"/boards/{board_id}/items/query", body=body or {})

    async def count(self, board_id: str) -> int:
        return (await self._f("GET", f"/boards/{board_id}/items/count"))["count"]

    async def get(self, board_id: str, item_id: str) -> Dict[str, Any]:
        return _data(await self._f("GET", f"/boards/{board_id}/items/{item_id}"))

    async def create(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("POST", f"/boards/{board_id}/items", body=body))

    async def create_many(self, board_id: str, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        return _data(await self._f("POST", f"/boards/{board_id}/items/bulk", body={"items": items}))

    async def update(self, board_id: str, item_id: str, fields: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("PATCH", f"/boards/{board_id}/items/{item_id}", body={"fields": fields}))

    async def delete(self, board_id: str, item_id: str) -> None:
        await self._f("DELETE", f"/boards/{board_id}/items/{item_id}")

    async def delete_many(self, board_id: str, item_ids: List[str]) -> int:
        return (await self._f("DELETE", f"/boards/{board_id}/items/bulk-delete",
                              params={"ids": _join(item_ids)}))["count"]

    async def lookup(self, board_id: str, q: str, limit: int = 20) -> List[Dict[str, Any]]:
        return _data(await self._f("GET", f"/boards/{board_id}/lookup", params={"q": q, "limit": limit}))


class AsyncDataIqRelations:
    """Relations — Async. See :class:`DataIqRelations`."""

    def __init__(self, f: _AsyncFetcher):
        self._f = f

    async def create(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("POST", f"/boards/{board_id}/relations", body=body))

    async def update(self, board_id: str, field_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("PATCH", f"/boards/{board_id}/relations/{field_id}", body=patch))

    async def usage(self, board_id: str, field_id: str) -> Dict[str, Any]:
        return _data(await self._f("GET", f"/boards/{board_id}/relations/{field_id}/usage"))

    async def set_links(self, board_id: str, item_id: str, field_id: str,
                        linked_item_ids: List[str]) -> Dict[str, Any]:
        return _data(await self._f("PUT", f"/boards/{board_id}/items/{item_id}/relations/{field_id}",
                                   body={"ids": linked_item_ids}))

    async def add_backlink(self, board_id: str, field_id: str, name: Optional[str] = None) -> Dict[str, Any]:
        return _data(await self._f("POST", f"/boards/{board_id}/fields/{field_id}/backlink",
                                   body=_clean({"name": name})))


class AsyncDataIqViews:
    """Views — Async. See :class:`DataIqViews`."""

    def __init__(self, f: _AsyncFetcher):
        self._f = f

    async def list(self, board_id: str) -> List[Dict[str, Any]]:
        return _data(await self._f("GET", f"/boards/{board_id}/views"))

    async def create(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("POST", f"/boards/{board_id}/views", body={"config": {}, **body}))

    async def update(self, board_id: str, view_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("PATCH", f"/boards/{board_id}/views/{view_id}", body=patch))

    async def delete(self, board_id: str, view_id: str) -> None:
        await self._f("DELETE", f"/boards/{board_id}/views/{view_id}")


class AsyncDataIqHistory:
    """History — Async. See :class:`DataIqHistory`."""

    def __init__(self, f: _AsyncFetcher):
        self._f = f

    async def list(self, board_id: str, item_id: str, limit: Optional[int] = None,
                   before: Optional[str] = None) -> List[Dict[str, Any]]:
        return _data(await self._f("GET", f"/boards/{board_id}/items/{item_id}/history",
                                   params={"limit": limit, "before": before}))

    async def revert(self, board_id: str, item_id: str, history_id: Union[str, int]) -> Dict[str, Any]:
        return _data(await self._f("POST", f"/boards/{board_id}/items/{item_id}/history/{history_id}/revert"))


class AsyncDataIqTrash:
    """Trash — Async. See :class:`DataIqTrash`."""

    def __init__(self, f: _AsyncFetcher):
        self._f = f

    async def list(self, board_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        return _data(await self._f("GET", f"/boards/{board_id}/trash", params={"limit": limit}))

    async def restore(self, board_id: str, item_ids: List[str]) -> Dict[str, Any]:
        return _data(await self._f("POST", f"/boards/{board_id}/trash/restore", body={"itemIds": item_ids}))

    async def forget(self, board_id: str, item_ids: List[str]) -> int:
        return _data(await self._f("POST", f"/boards/{board_id}/trash/forget",
                                   body={"itemIds": item_ids}))["deleted"]


class AsyncDataIqSql:
    """SQL — Async. See :class:`DataIqSql`."""

    def __init__(self, f: _AsyncFetcher):
        self._f = f

    async def schema(self, tables: Optional[List[str]] = None) -> Dict[str, Any]:
        return await self._f("GET", "/sql/schema", params={"tables": _join(tables), "format": "json"})

    async def run(self, sql: str, limit: Optional[int] = None, offset: Optional[int] = None) -> Dict[str, Any]:
        return await self._f("POST", "/sql", body=_clean({"sql": sql, "limit": limit, "offset": offset}))

    async def board_schema(self, board_id: str) -> Dict[str, Any]:
        return await self._f("GET", f"/boards/{board_id}/sql-schema")

    async def run_on_board(self, board_id: str, sql: str, limit: Optional[int] = None,
                           offset: Optional[int] = None) -> Dict[str, Any]:
        return await self._f("POST", f"/boards/{board_id}/sql",
                             body=_clean({"sql": sql, "limit": limit, "offset": offset}))

    async def list_queries(self) -> List[Dict[str, Any]]:
        return _data(await self._f("GET", "/sql/queries"))

    async def create_query(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("POST", "/sql/queries", body=body))

    async def update_query(self, query_id: str, patch: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("PATCH", f"/sql/queries/{query_id}", body=patch))

    async def delete_query(self, query_id: str) -> None:
        await self._f("DELETE", f"/sql/queries/{query_id}")


class AsyncDataIqSources:
    """Sources — Async. See :class:`DataIqSources`."""

    def __init__(self, f: _AsyncFetcher):
        self._f = f

    async def list(self, origin: Optional[str] = None, group: Optional[str] = None,
                   format: Optional[str] = None, q: Optional[str] = None, parent_id: Optional[str] = None,
                   nested: Optional[bool] = None, cursor: Optional[str] = None,
                   limit: Optional[int] = None) -> Dict[str, Any]:
        return await self._f("GET", "/sources/items", params={
            "origin": origin, "group": group, "format": format, "q": q, "parent_id": parent_id,
            "nested": nested, "cursor": cursor, "limit": limit})

    async def get(self, source_id: str) -> Dict[str, Any]:
        return _data(await self._f("GET", f"/sources/items/{source_id}"))

    async def summary(self) -> Dict[str, Any]:
        return _data(await self._f("GET", "/sources/summary"))

    async def connections(self) -> Dict[str, Any]:
        return _data(await self._f("GET", "/sources/connections"))

    async def upload(self, files: Any) -> Dict[str, Any]:
        return await self._f("POST", "/sources/uploads", files=files)

    async def delete(self, source_id: str) -> None:
        await self._f("DELETE", f"/sources/items/{source_id}")

    async def came_from(self, board_id: str, item_id: str) -> List[Dict[str, Any]]:
        return _data(await self._f("GET", f"/boards/{board_id}/items/{item_id}/sources"))

    async def set_came_from(self, board_id: str, item_id: str, source_ids: List[str],
                            role: Optional[str] = None) -> List[Dict[str, Any]]:
        return _data(await self._f("PUT", f"/boards/{board_id}/items/{item_id}/sources",
                                   body=_clean({"ids": source_ids, "role": role})))


class AsyncDataIqRuns:
    """AI runs (human in the loop) — Async. See :class:`DataIqRuns`."""

    def __init__(self, f: _AsyncFetcher):
        self._f = f

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return _data(await self._f("POST", "/extraction-runs", body=body))

    async def list(self, board_id: Optional[str] = None, status: Optional[str] = None,
                   trigger: Optional[str] = None, source_item_id: Optional[str] = None,
                   cursor: Optional[str] = None, limit: Optional[int] = None) -> Dict[str, Any]:
        return await self._f("GET", "/extraction-runs", params={
            "board_id": board_id, "status": status, "trigger": trigger,
            "source_item_id": source_item_id, "cursor": cursor, "limit": limit})

    async def get(self, run_id: str) -> Dict[str, Any]:
        return _data(await self._f("GET", f"/extraction-runs/{run_id}"))

    async def values(self, run_id: str) -> List[Dict[str, Any]]:
        return _data(await self._f("GET", f"/extraction-runs/{run_id}/values"))

    async def confirm(self, run_id: str, value_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        return _data(await self._f("POST", f"/extraction-runs/{run_id}/values/confirm",
                                   body=_clean({"valueIds": value_ids})))

    async def reject(self, run_id: str, value_ids: List[str]) -> Dict[str, Any]:
        return _data(await self._f("POST", f"/extraction-runs/{run_id}/values/reject",
                                   body={"valueIds": value_ids}))

    async def undo(self, run_id: str) -> Dict[str, Any]:
        return _data(await self._f("POST", f"/extraction-runs/{run_id}/undo"))

    async def cancel(self, run_id: str) -> Dict[str, Any]:
        return _data(await self._f("POST", f"/extraction-runs/{run_id}/cancel"))

    async def to_confirm(self, board_ids: Optional[List[str]] = None) -> Dict[str, int]:
        return _data(await self._f("GET", "/ai/to-confirm", params={"board_ids": _join(board_ids)}))

    async def board_summary(self, board_id: str) -> Dict[str, Any]:
        return _data(await self._f("GET", f"/boards/{board_id}/ai-summary"))

    async def item(self, board_id: str, item_id: str) -> Dict[str, Any]:
        return _data(await self._f("GET", f"/boards/{board_id}/items/{item_id}/ai"))

    async def resolve_suggestion(self, board_id: str, item_id: str, field_id: str, accept: bool) -> None:
        await self._f("POST", f"/boards/{board_id}/items/{item_id}/fields/{field_id}/suggestion",
                      body={"accept": accept})


class AsyncDataIqResource:
    """DataIQ v2 — Async. See :class:`DataIqResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._f = _AsyncFetcher(http, base)
        self.boards = AsyncDataIqBoards(self._f)
        self.fields = AsyncDataIqFields(self._f)
        self.items = AsyncDataIqItems(self._f)
        self.relations = AsyncDataIqRelations(self._f)
        self.views = AsyncDataIqViews(self._f)
        self.history = AsyncDataIqHistory(self._f)
        self.trash = AsyncDataIqTrash(self._f)
        self.sql = AsyncDataIqSql(self._f)
        self.sources = AsyncDataIqSources(self._f)
        self.runs = AsyncDataIqRuns(self._f)

    async def health(self) -> Dict[str, Any]:
        """See :meth:`DataIqResource.health`; never raises for a missing v2."""
        try:
            return await self._f("GET", "/health")
        except (ApiError, DataIqError) as e:
            answer = _unavailable(e)
            if answer is None:
                raise
            return answer

    async def routing(self) -> str:
        return (await self._f("GET", "/routing/self"))["data"]["serves"]

    async def members(self, q: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        return _data(await self._f("GET", "/members", params={"q": q, "limit": limit}))
