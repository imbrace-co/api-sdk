from typing import Any, Callable, Dict, List, Optional
from ..exceptions import ApiError
from ..http import HttpTransport, AsyncHttpTransport
from .retired import unwrap_data


def _unwrap(res: Any) -> Any:
    """data-board wraps single boards, items, folders and drive results in ``{data}``."""
    return unwrap_data(res)


def _pick_field(res: Any, find: Callable[[List[Dict[str, Any]]], Optional[Dict[str, Any]]]) -> Any:
    """Field endpoints return the parent board; pick the field out of ``board.fields``."""
    if isinstance(res, dict) and isinstance(res.get("fields"), list):
        found = find(res["fields"])
        return found if found is not None else res
    return res


def _find_created_field(name: Any) -> Callable[[List[Dict[str, Any]]], Optional[Dict[str, Any]]]:
    return lambda fields: next((f for f in reversed(fields) if f.get("name") == name), None)


def _find_field_by_id(field_id: str) -> Callable[[List[Dict[str, Any]]], Optional[Dict[str, Any]]]:
    return lambda fields: next((f for f in fields if (f.get("id") or f.get("_id")) == field_id), None)


def org_from_account(me: Any) -> Optional[str]:
    """``organization_id`` from a ``GET /platform/v1/account`` response."""
    if not isinstance(me, dict):
        return None
    data = me.get("data")
    return me.get("organization_id") or (data.get("organization_id") if isinstance(data, dict) else None)


def folder_create_body(body: Dict[str, Any], organization_id: Optional[str]) -> Dict[str, Any]:
    """Wire body for ``POST /folders``.

    The server needs ``organization_id``, ``source_type`` and ``parent_folder_id``;
    ``parent_id`` is accepted as an alias of ``parent_folder_id``.
    """
    rest = {k: v for k, v in body.items() if k != "parent_id"}
    wire: Dict[str, Any] = {"source_type": "upload", **rest}
    wire["parent_folder_id"] = body.get("parent_folder_id") or body.get("parent_id") or "root"
    org = body.get("organization_id") or organization_id
    if org is not None:
        wire["organization_id"] = org
    return wire


def default_platform_base(data_board: str) -> Optional[str]:
    if data_board.endswith("/data-board"):
        return data_board[: -len("/data-board")] + "/platform"
    return None


class BoardsResource:
    """Boards / Knowledge Hub / External Drive — Sync.

    Everything hits data-board. Single boards, items, folders and drive results
    are unwrapped from data-board's ``{data}`` envelope.

    @param http     - HTTP transport
    @param base     - data-board base URL (`{gateway}/data-board`)
    @param backend  - legacy backend base URL (`{gateway}/v1/backend`), unused, kept for callers
    @param platform - platform base URL (`{gateway}/platform`), used to look up the caller's org
    """

    def __init__(self, http: HttpTransport, base: str, backend: str = "", platform: Optional[str] = None):
        self._http = http
        self._base = base.rstrip("/")
        self._backend = backend.rstrip("/")
        self._platform = (platform or default_platform_base(self._base) or "").rstrip("/") or None
        self._org_id: Optional[str] = None

    def _resolve_org_id(self) -> Optional[str]:
        """The caller's organization: the client's configured org, else the account's."""
        if self._org_id:
            return self._org_id
        self._org_id = self._http.organization_id
        if not self._org_id and self._platform:
            self._org_id = org_from_account(self._http.request("GET", f"{self._platform}/v1/account").json())
        return self._org_id

    # --- Boards ---
    def list(self, limit: int = 20, skip: int = 0) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/boards", params={"limit": limit, "skip": skip}).json()

    def get(self, board_id: str) -> Dict[str, Any]:
        return _unwrap(self._http.request("GET", f"{self._base}/boards/{board_id}").json())

    def create(
        self,
        name: str,
        description: Optional[str] = None,
        *,
        type: Optional[str] = None,
        fields: Optional[List[Dict[str, Any]]] = None,
        team_ids: Optional[List[str]] = None,
        show_id: Optional[bool] = None,
        **extra: Any,
    ) -> Dict[str, Any]:
        """Create a board.

        Pass ``type="DocumentAI"`` + ``fields=[{name, type, ...}]`` for a
        Document AI board with extraction schema embedded.
        """
        body: Dict[str, Any] = {"name": name}
        if description is not None:
            body["description"] = description
        if type is not None:
            body["type"] = type
        if fields is not None:
            body["fields"] = fields
        if team_ids is not None:
            body["team_ids"] = team_ids
        if show_id is not None:
            body["show_id"] = show_id
        body.update(extra)
        return _unwrap(self._http.request("POST", f"{self._base}/boards", json=body).json())

    def update(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return _unwrap(self._http.request("PATCH", f"{self._base}/boards/{board_id}", json=body).json())

    def delete(self, board_id: str) -> None:
        self._http.request("DELETE", f"{self._base}/boards/{board_id}")

    def reorder(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/boards/reorder", json=body).json()

    def export_csv(self, board_id: str, params: Optional[Dict[str, str]] = None) -> str:
        return self._http.request("GET", f"{self._base}/boards/{board_id}/export_csv", params=params or {}).text

    def import_csv(self, board_id: str, files: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/boards/{board_id}/import_csv", files=files).json()

    def import_excel(self, board_id: str, files: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/boards/{board_id}/import", files=files).json()

    def get_import_progress(self, board_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/boards/{board_id}/import_progress").json()

    def upload_board_file(self, files: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/boards/_fileupload", files=files).json()

    def upload_board_file_v2(self, files: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/boards/upload", files=files).json()

    # --- Fields ---
    def create_field(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Add a field. data-board responds with the whole board; the new field is returned."""
        res = self._http.request("POST", f"{self._base}/boards/{board_id}/fields", json=body).json()
        return _pick_field(_unwrap(res), _find_created_field(body.get("name")))

    def update_field(self, board_id: str, field_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Update a field. data-board responds with the whole board; the updated field is returned."""
        res = self._http.request("PATCH", f"{self._base}/boards/{board_id}/fields/{field_id}", json=body).json()
        return _pick_field(_unwrap(res), _find_field_by_id(field_id))

    def delete_field(self, board_id: str, field_id: str) -> None:
        self._http.request("DELETE", f"{self._base}/boards/{board_id}/fields/{field_id}")

    def reorder_fields(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/boards/{board_id}/fields/reorder", json=body).json()

    def bulk_update_fields(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PATCH", f"{self._base}/boards/{board_id}/fields/bulk", json=body).json()

    # --- Items ---
    def list_items(self, board_id: str, limit: int = 20, skip: int = 0) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/boards/{board_id}/items",
                                  params={"limit": limit, "skip": skip}).json()

    def get_item(self, board_id: str, item_id: str) -> Dict[str, Any]:
        return _unwrap(self._http.request("GET", f"{self._base}/boards/{board_id}/items/{item_id}").json())

    def create_item(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return _unwrap(self._http.request("POST", f"{self._base}/boards/{board_id}/items", json=body).json())

    def update_item(self, board_id: str, item_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Update a board item. data-board accepts both `{fields: {fieldId: value}}` and `{data: [{key, value}]}`."""
        return _unwrap(self._http.request("PATCH", f"{self._base}/boards/{board_id}/items/{item_id}", json=body).json())

    def delete_item(self, board_id: str, item_id: str) -> None:
        self._http.request("DELETE", f"{self._base}/boards/{board_id}/items/{item_id}")

    def bulk_delete_items(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._base}/boards/{board_id}/items/bulk-delete", json=body).json()

    def get_related_items(self, board_id: str, item_id: str, related_board_id: str) -> Dict[str, Any]:
        r = self._http.request("GET", f"{self._base}/boards/{board_id}/items/{item_id}/related/{related_board_id}").json()
        return r.get("data", r) if isinstance(r, dict) else r

    def link_items(self, board_id: str, item_id: str, related_board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Link related board items. Body must include `relatedItemIds: [...]`."""
        return self._http.request(
            "POST", f"{self._base}/boards/{board_id}/items/{item_id}/related",
            json={"relatedBoardId": related_board_id, "relatedItemIds": body.get("relatedItemIds", [])},
        ).json()

    def unlink_items(self, board_id: str, item_id: str, related_board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request(
            "DELETE", f"{self._base}/boards/{board_id}/items/{item_id}/related",
            json={"relatedBoardId": related_board_id, "relatedItemIds": body.get("relatedItemIds", [])},
        ).json()

    # --- Search ---
    def search(self, board_id: str, q: Optional[str] = None, limit: int = 100, offset: int = 0) -> Dict[str, Any]:
        body: Dict[str, Any] = {"limit": limit, "offset": offset}
        if q:
            body["q"] = q
        return self._http.request("POST", f"{self._base}/search/{board_id}", json=body).json()

    # --- Segmentation ---
    def list_segments(self, board_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/boards/{board_id}/segmentation").json()

    def create_segment(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/boards/{board_id}/segmentation", json=body).json()

    def update_segment(self, board_id: str, segment_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PATCH", f"{self._base}/boards/{board_id}/segmentation/{segment_id}", json=body).json()

    def delete_segment(self, board_id: str, segment_id: str) -> None:
        self._http.request("DELETE", f"{self._base}/boards/{board_id}/segmentation/{segment_id}")

    # --- Folders (KnowledgeHub) ---
    def list_folders(self, ignore_assistant: Optional[bool] = None) -> List[Dict[str, Any]]:
        """All Knowledge Hub folders of the org."""
        params: Dict[str, str] = {}
        if ignore_assistant is not None:
            params["ignore_assistant"] = str(ignore_assistant).lower()
        return _unwrap(self._http.request("GET", f"{self._base}/folders", params=params).json())

    def search_folders(self, organization_id: Optional[str] = None, q: Optional[str] = None) -> list:
        params: Dict[str, str] = {}
        if organization_id:
            params["organization_id"] = organization_id
        if q:
            params["q"] = q
        r = self._http.request("GET", f"{self._base}/folders/search", params=params).json()
        return r.get("data", r)

    def get_folder(self, folder_id: str, recursive: Optional[bool] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if recursive is not None:
            params["recursive"] = str(recursive).lower()
        r = self._http.request("GET", f"{self._base}/folders/{folder_id}", params=params).json()
        data = r.get("data", r)
        return data.get("folder", data) if isinstance(data, dict) else data

    def create_folder(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Knowledge Hub folder.

        The server needs ``organization_id``, ``source_type`` and
        ``parent_folder_id``; they default to the caller's org, ``"upload"`` and
        ``"root"``. ``parent_id`` is sent as ``parent_folder_id``.
        """
        org = None if body.get("organization_id") else self._resolve_org_id()
        r = self._http.request("POST", f"{self._base}/folders", json=folder_create_body(body, org)).json()
        return _unwrap(r)

    def update_folder(self, folder_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        r = self._http.request("PUT", f"{self._base}/folders/{folder_id}", json=body).json()
        return r.get("data", r)

    def set_folder_sync(self, folder_id: str, enabled: bool) -> Dict[str, Any]:
        """Turn syncing of an external (Drive) folder on or off."""
        r = self._http.request("PATCH", f"{self._base}/folders/{folder_id}/sync",
                               json={"is_sync_enabled": enabled}).json()
        return _unwrap(r)

    def delete_folders(self, ids: list) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/folders/delete", json={"ids": ids}).json()

    def get_folder_contents(self, folder_id: str) -> Dict[str, Any]:
        r = self._http.request("GET", f"{self._base}/folders/{folder_id}/contents").json()
        return r.get("data", r)

    # --- Files (KnowledgeHub) ---
    def search_files(self, folder_id: str) -> list:
        r = self._http.request("GET", f"{self._base}/files/search", params={"folder_id": folder_id}).json()
        return r.get("data", r)

    def get_file(self, file_id: str) -> Dict[str, Any]:
        r = self._http.request("GET", f"{self._base}/files/{file_id}").json()
        return r.get("data", r)

    def create_file(self, body: Dict[str, Any]) -> Dict[str, Any]:
        r = self._http.request("POST", f"{self._base}/files", json=body).json()
        return r.get("data", r)

    def upload_file(self, files: Any) -> Dict[str, Any]:
        """Upload a Knowledge Hub file.

        Returns the file record (``id``, ``_id``, ``name``, ``folder_id``, ``key``).
        data-board does not return ``url`` or ``file_id``; use ``id``.
        """
        r = self._http.request("POST", f"{self._base}/files/upload", files=files).json()
        return r.get("data", r)

    def download_file(self, file_id: str) -> Any:
        return self._http.request("GET", f"{self._base}/files/{file_id}/download")

    def update_file(self, file_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        r = self._http.request("PUT", f"{self._base}/files/{file_id}", json=body).json()
        return r.get("data", r)

    def delete_files(self, ids: list) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/files/delete", json={"ids": ids}).json()

    def generate_ai_tags(self, body: Dict[str, Any]) -> Dict[str, Any]:
        r = self._http.request("POST", f"{self._base}/ai/tag-generation", json=body).json()
        return r.get("data", r)

    def get_link_preview(self, url: str) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/link_preview/getWebsiteInfo", json={"url": url}).json()

    # --- External Drive (drive_type: "google-drive" or "onedrive") ---
    def list_drive_providers(self) -> List[Dict[str, Any]]:
        """Which drive providers are configured on the server (``[{provider, configured}]``)."""
        return _unwrap(self._http.request("GET", f"{self._base}/providers").json())

    def initiate_drive_auth(self, drive_type: str) -> Dict[str, Any]:
        """Start the OAuth flow for a drive; returns ``auth_url`` and ``session_id``."""
        org = self._resolve_org_id()
        params = {"organizationId": org} if org else {}
        return _unwrap(self._http.request("GET", f"{self._base}/auth/{drive_type}/initiate", params=params).json())

    def get_drive_session_status(self, drive_type: str, session_id: str) -> Dict[str, Any]:
        """Whether the user finished the OAuth flow for ``session_id`` (``connected: False`` until they do)."""
        try:
            r = self._http.request("GET", f"{self._base}/auth/{drive_type}/session/status",
                                   params={"sessionId": session_id}).json()
        except ApiError as e:
            # the server only stores the session once the user has signed in
            if e.status_code == 404:
                return {"connected": False, "session_id": session_id}
            raise
        return {"connected": True, **_unwrap(r)}

    def list_drive_folders(self, drive_type: str, params: Optional[Dict[str, str]] = None) -> Any:
        """Folders in the drive. Params: ``sessionId`` (required), ``parentId`` (Google) or ``folderId`` (OneDrive), ``q``, ``skip``, ``limit``."""
        return _unwrap(self._http.request("GET", f"{self._base}/{drive_type}/folders", params=params or {}).json())

    def list_drive_files(self, drive_type: str, params: Optional[Dict[str, str]] = None) -> Any:
        """Files in the drive. Params: ``sessionId`` (required), ``parentId`` (Google) or ``folderId`` (OneDrive), ``recursive``."""
        return _unwrap(self._http.request("GET", f"{self._base}/{drive_type}/files", params=params or {}).json())

    def get_drive_sync_status(self, drive_type: str) -> Dict[str, Any]:
        """Background sync state of a drive."""
        return _unwrap(self._http.request("GET", f"{self._base}/{drive_type}/sync/status").json())

    def download_drive_file(self, drive_type: str, params: Optional[Dict[str, str]] = None) -> Any:
        return self._http.request("GET", f"{self._base}/{drive_type}/files/download", params=params or {})

    def get_onedrive_session_status(self, session_id: str) -> Dict[str, Any]:
        """Deprecated alias of ``get_drive_session_status("onedrive", session_id)``."""
        return self.get_drive_session_status("onedrive", session_id)

    def export_csv_via_mail(self, board_id: str, params: Optional[Dict[str, str]] = None) -> Any:
        return self._http.request(
            "POST", f"{self._base}/boards/{board_id}/export_csv", params=params or {}
        ).json()

    def get_one_drive_session_status(self, session_id: str) -> Dict[str, Any]:
        """Deprecated alias of ``get_drive_session_status("onedrive", session_id)``."""
        return self.get_drive_session_status("onedrive", session_id)


class AsyncBoardsResource:
    """Boards / Knowledge Hub / External Drive — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str, backend: str = "", platform: Optional[str] = None):
        self._http = http
        self._base = base.rstrip("/")
        self._backend = backend.rstrip("/")
        self._platform = (platform or default_platform_base(self._base) or "").rstrip("/") or None
        self._org_id: Optional[str] = None

    async def _resolve_org_id(self) -> Optional[str]:
        """The caller's organization: the client's configured org, else the account's."""
        if self._org_id:
            return self._org_id
        self._org_id = self._http.organization_id
        if not self._org_id and self._platform:
            res = await self._http.request("GET", f"{self._platform}/v1/account")
            self._org_id = org_from_account(res.json())
        return self._org_id

    async def list(self, limit: int = 20, skip: int = 0) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/boards", params={"limit": limit, "skip": skip})
        return res.json()

    async def get(self, board_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/boards/{board_id}")
        return _unwrap(res.json())

    async def create(
        self,
        name: str,
        description: Optional[str] = None,
        *,
        type: Optional[str] = None,
        fields: Optional[List[Dict[str, Any]]] = None,
        team_ids: Optional[List[str]] = None,
        show_id: Optional[bool] = None,
        **extra: Any,
    ) -> Dict[str, Any]:
        body: Dict[str, Any] = {"name": name}
        if description is not None:
            body["description"] = description
        if type is not None:
            body["type"] = type
        if fields is not None:
            body["fields"] = fields
        if team_ids is not None:
            body["team_ids"] = team_ids
        if show_id is not None:
            body["show_id"] = show_id
        body.update(extra)
        res = await self._http.request("POST", f"{self._base}/boards", json=body)
        return _unwrap(res.json())

    async def update(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PATCH", f"{self._base}/boards/{board_id}", json=body)
        return _unwrap(res.json())

    async def delete(self, board_id: str) -> None:
        await self._http.request("DELETE", f"{self._base}/boards/{board_id}")

    async def list_items(self, board_id: str, limit: int = 20, skip: int = 0) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/boards/{board_id}/items",
                                       params={"limit": limit, "skip": skip})
        return res.json()

    async def get_item(self, board_id: str, item_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/boards/{board_id}/items/{item_id}")
        return _unwrap(res.json())

    async def create_item(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/boards/{board_id}/items", json=body)
        return _unwrap(res.json())

    async def update_item(self, board_id: str, item_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PATCH", f"{self._base}/boards/{board_id}/items/{item_id}", json=body)
        return _unwrap(res.json())

    async def delete_item(self, board_id: str, item_id: str) -> None:
        await self._http.request("DELETE", f"{self._base}/boards/{board_id}/items/{item_id}")

    async def search(self, board_id: str, q: Optional[str] = None, limit: int = 100, offset: int = 0) -> Dict[str, Any]:
        body: Dict[str, Any] = {"limit": limit, "offset": offset}
        if q:
            body["q"] = q
        res = await self._http.request("POST", f"{self._base}/search/{board_id}", json=body)
        return res.json()

    async def export_csv(self, board_id: str) -> str:
        res = await self._http.request("GET", f"{self._base}/boards/{board_id}/export_csv")
        return res.text

    async def list_folders(self, ignore_assistant: Optional[bool] = None) -> List[Dict[str, Any]]:
        """All Knowledge Hub folders of the org."""
        params: Dict[str, str] = {}
        if ignore_assistant is not None:
            params["ignore_assistant"] = str(ignore_assistant).lower()
        res = await self._http.request("GET", f"{self._base}/folders", params=params)
        return _unwrap(res.json())

    async def search_folders(self, organization_id: Optional[str] = None, q: Optional[str] = None) -> list:
        params: Dict[str, str] = {}
        if organization_id:
            params["organization_id"] = organization_id
        if q:
            params["q"] = q
        res = await self._http.request("GET", f"{self._base}/folders/search", params=params)
        r = res.json()
        return r.get("data", r)

    async def get_folder(self, folder_id: str, recursive: Optional[bool] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if recursive is not None:
            params["recursive"] = str(recursive).lower()
        res = await self._http.request("GET", f"{self._base}/folders/{folder_id}", params=params)
        r = res.json()
        data = r.get("data", r)
        return data.get("folder", data) if isinstance(data, dict) else data

    async def create_folder(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Knowledge Hub folder. See :meth:`BoardsResource.create_folder`."""
        org = None if body.get("organization_id") else await self._resolve_org_id()
        res = await self._http.request("POST", f"{self._base}/folders", json=folder_create_body(body, org))
        return _unwrap(res.json())

    async def update_folder(self, folder_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._base}/folders/{folder_id}", json=body)
        r = res.json()
        return r.get("data", r)

    async def set_folder_sync(self, folder_id: str, enabled: bool) -> Dict[str, Any]:
        """Turn syncing of an external (Drive) folder on or off."""
        res = await self._http.request("PATCH", f"{self._base}/folders/{folder_id}/sync",
                                       json={"is_sync_enabled": enabled})
        return _unwrap(res.json())

    async def delete_folders(self, ids: list) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/folders/delete", json={"ids": ids})
        return res.json()

    async def get_folder_contents(self, folder_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/folders/{folder_id}/contents")
        r = res.json()
        return r.get("data", r)

    async def search_files(self, folder_id: str) -> list:
        res = await self._http.request("GET", f"{self._base}/files/search", params={"folder_id": folder_id})
        r = res.json()
        return r.get("data", r)

    async def get_file(self, file_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/files/{file_id}")
        r = res.json()
        return r.get("data", r)

    async def update_file(self, file_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._base}/files/{file_id}", json=body)
        r = res.json()
        return r.get("data", r)

    async def delete_files(self, ids: list) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/files/delete", json={"ids": ids})
        return res.json()

    async def upload_file(self, files: Any) -> Dict[str, Any]:
        """Upload a Knowledge Hub file. Returns the file record (``id``, ``name``, ``folder_id``, ``key``)."""
        res = await self._http.request("POST", f"{self._base}/files/upload", files=files)
        r = res.json()
        return r.get("data", r)

    async def export_csv_via_mail(self, board_id: str, params: Optional[Dict[str, str]] = None) -> Any:
        res = await self._http.request(
            "POST", f"{self._base}/boards/{board_id}/export_csv", params=params or {}
        )
        return res.json()

    async def get_one_drive_session_status(self, session_id: str) -> Dict[str, Any]:
        """Deprecated alias of ``get_drive_session_status("onedrive", session_id)``."""
        return await self.get_drive_session_status("onedrive", session_id)

    async def reorder(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._base}/boards/reorder", json=body)
        return _r.json()

    async def import_csv(self, board_id: str, files: Any) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._base}/boards/{board_id}/import_csv", files=files)
        return _r.json()

    async def import_excel(self, board_id: str, files: Any) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._base}/boards/{board_id}/import", files=files)
        return _r.json()

    async def get_import_progress(self, board_id: str) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._base}/boards/{board_id}/import_progress")
        return _r.json()

    async def upload_board_file(self, files: Any) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._base}/boards/_fileupload", files=files)
        return _r.json()

    async def upload_board_file_v2(self, files: Any) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._base}/boards/upload", files=files)
        return _r.json()

    async def create_field(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Add a field; the new field is picked out of the board the server returns."""
        _r = await self._http.request("POST", f"{self._base}/boards/{board_id}/fields", json=body)
        return _pick_field(_unwrap(_r.json()), _find_created_field(body.get("name")))

    async def update_field(self, board_id: str, field_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Update a field; the updated field is picked out of the board the server returns."""
        _r = await self._http.request("PATCH", f"{self._base}/boards/{board_id}/fields/{field_id}", json=body)
        return _pick_field(_unwrap(_r.json()), _find_field_by_id(field_id))

    async def delete_field(self, board_id: str, field_id: str) -> None:
        await self._http.request("DELETE", f"{self._base}/boards/{board_id}/fields/{field_id}")

    async def reorder_fields(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._base}/boards/{board_id}/fields/reorder", json=body)
        return _r.json()

    async def bulk_update_fields(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("PATCH", f"{self._base}/boards/{board_id}/fields/bulk", json=body)
        return _r.json()

    async def bulk_delete_items(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("DELETE", f"{self._base}/boards/{board_id}/items/bulk-delete", json=body)
        return _r.json()

    async def get_related_items(self, board_id: str, item_id: str, related_board_id: str) -> Dict[str, Any]:
        _res = await self._http.request("GET", f"{self._base}/boards/{board_id}/items/{item_id}/related/{related_board_id}")
        r = _res.json()
        return r.get("data", r) if isinstance(r, dict) else r

    async def link_items(self, board_id: str, item_id: str, related_board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Link related board items. Body must include `relatedItemIds: [...]`."""
        _r = await self._http.request(
            "POST", f"{self._base}/boards/{board_id}/items/{item_id}/related",
            json={"relatedBoardId": related_board_id, "relatedItemIds": body.get("relatedItemIds", [])},
        )
        return _r.json()

    async def unlink_items(self, board_id: str, item_id: str, related_board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request(
            "DELETE", f"{self._base}/boards/{board_id}/items/{item_id}/related",
            json={"relatedBoardId": related_board_id, "relatedItemIds": body.get("relatedItemIds", [])},
        )
        return _r.json()

    async def list_segments(self, board_id: str) -> Dict[str, Any]:
        _r = await self._http.request("GET", f"{self._base}/boards/{board_id}/segmentation")
        return _r.json()

    async def create_segment(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._base}/boards/{board_id}/segmentation", json=body)
        return _r.json()

    async def update_segment(self, board_id: str, segment_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        _r = await self._http.request("PATCH", f"{self._base}/boards/{board_id}/segmentation/{segment_id}", json=body)
        return _r.json()

    async def delete_segment(self, board_id: str, segment_id: str) -> None:
        await self._http.request("DELETE", f"{self._base}/boards/{board_id}/segmentation/{segment_id}")

    async def create_file(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _res = await self._http.request("POST", f"{self._base}/files", json=body)
        r = _res.json()
        return r.get("data", r)

    async def download_file(self, file_id: str) -> Any:
        return await self._http.request("GET", f"{self._base}/files/{file_id}/download")

    async def generate_ai_tags(self, body: Dict[str, Any]) -> Dict[str, Any]:
        _res = await self._http.request("POST", f"{self._base}/ai/tag-generation", json=body)
        r = _res.json()
        return r.get("data", r)

    async def get_link_preview(self, url: str) -> Dict[str, Any]:
        _r = await self._http.request("POST", f"{self._base}/link_preview/getWebsiteInfo", json={"url": url})
        return _r.json()

    async def list_drive_providers(self) -> List[Dict[str, Any]]:
        """Which drive providers are configured on the server."""
        _r = await self._http.request("GET", f"{self._base}/providers")
        return _unwrap(_r.json())

    async def initiate_drive_auth(self, drive_type: str) -> Dict[str, Any]:
        """Start the OAuth flow for a drive; returns ``auth_url`` and ``session_id``."""
        org = await self._resolve_org_id()
        params = {"organizationId": org} if org else {}
        _r = await self._http.request("GET", f"{self._base}/auth/{drive_type}/initiate", params=params)
        return _unwrap(_r.json())

    async def get_drive_session_status(self, drive_type: str, session_id: str) -> Dict[str, Any]:
        """Whether the user finished the OAuth flow for ``session_id`` (``connected: False`` until they do)."""
        try:
            _r = await self._http.request("GET", f"{self._base}/auth/{drive_type}/session/status",
                                          params={"sessionId": session_id})
        except ApiError as e:
            if e.status_code == 404:
                return {"connected": False, "session_id": session_id}
            raise
        return {"connected": True, **_unwrap(_r.json())}

    async def list_drive_folders(self, drive_type: str, params: Optional[Dict[str, str]] = None) -> Any:
        _r = await self._http.request("GET", f"{self._base}/{drive_type}/folders", params=params or {})
        return _unwrap(_r.json())

    async def list_drive_files(self, drive_type: str, params: Optional[Dict[str, str]] = None) -> Any:
        _r = await self._http.request("GET", f"{self._base}/{drive_type}/files", params=params or {})
        return _unwrap(_r.json())

    async def get_drive_sync_status(self, drive_type: str) -> Dict[str, Any]:
        """Background sync state of a drive."""
        _r = await self._http.request("GET", f"{self._base}/{drive_type}/sync/status")
        return _unwrap(_r.json())

    async def download_drive_file(self, drive_type: str, params: Optional[Dict[str, str]] = None) -> Any:
        return await self._http.request("GET", f"{self._base}/{drive_type}/files/download", params=params or {})

    async def get_onedrive_session_status(self, session_id: str) -> Dict[str, Any]:
        """Deprecated alias of ``get_drive_session_status("onedrive", session_id)``."""
        return await self.get_drive_session_status("onedrive", session_id)
