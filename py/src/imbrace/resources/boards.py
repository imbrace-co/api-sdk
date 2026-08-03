from typing import Any, Dict, List, Optional
from ..http import HttpTransport, AsyncHttpTransport


class BoardsResource:
    """Boards / Knowledge Hub / External Drive — Sync.

    All board CRUD/items/fields/segments/search/link-unlink now hit data-board.
    `backend` is kept for the one remaining call (link preview) and for
    forward-compat with new follow-up migrations.

    @param http     - HTTP transport
    @param base     - data-board base URL (`{gateway}/data-board`)
    @param backend  - legacy backend base URL (`{gateway}/v1/backend`)
    """

    def __init__(self, http: HttpTransport, base: str, backend: str):
        self._http = http
        self._base = base.rstrip("/")
        self._backend = backend.rstrip("/")

    # --- Boards ---
    def list(self, limit: int = 20, skip: int = 0) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/boards", params={"limit": limit, "skip": skip}).json()

    def get(self, board_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/boards/{board_id}").json()

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
        return self._http.request("POST", f"{self._base}/boards", json=body).json()

    def update(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PATCH", f"{self._base}/boards/{board_id}", json=body).json()

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
        return self._http.request("POST", f"{self._base}/boards/{board_id}/fields", json=body).json()

    def update_field(self, board_id: str, field_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PATCH", f"{self._base}/boards/{board_id}/fields/{field_id}", json=body).json()

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
        return self._http.request("GET", f"{self._base}/boards/{board_id}/items/{item_id}").json()

    def create_item(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/boards/{board_id}/items", json=body).json()

    def update_item(self, board_id: str, item_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        """Update a board item. data-board accepts both `{fields: {fieldId: value}}` and `{data: [{key, value}]}`."""
        return self._http.request("PATCH", f"{self._base}/boards/{board_id}/items/{item_id}", json=body).json()

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
        wire: Dict[str, Any] = {
            "source_type": "upload",
            "parent_folder_id": "root",
            **body,
        }
        r = self._http.request("POST", f"{self._base}/folders", json=wire).json()
        return r.get("data", r)

    def update_folder(self, folder_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        r = self._http.request("PUT", f"{self._base}/folders/{folder_id}", json=body).json()
        return r.get("data", r)

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

    # --- External Drive ---
    def initiate_drive_auth(self, drive_type: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/auth/{drive_type}/initiate").json()

    def list_drive_folders(self, drive_type: str, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/{drive_type}/folders", params=params or {}).json()

    def list_drive_files(self, drive_type: str, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/{drive_type}/files", params=params or {}).json()

    def download_drive_file(self, drive_type: str, params: Optional[Dict[str, str]] = None) -> Any:
        return self._http.request("GET", f"{self._base}/{drive_type}/files/download", params=params or {})

    def get_onedrive_session_status(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/auth/onedrive/files/session/status").json()


class AsyncBoardsResource:
    """Boards / Knowledge Hub / External Drive — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str, backend: str):
        self._http = http
        self._base = base.rstrip("/")
        self._backend = backend.rstrip("/")

    async def list(self, limit: int = 20, skip: int = 0) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/boards", params={"limit": limit, "skip": skip})
        return res.json()

    async def get(self, board_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/boards/{board_id}")
        return res.json()

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
        return res.json()

    async def update(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PATCH", f"{self._base}/boards/{board_id}", json=body)
        return res.json()

    async def delete(self, board_id: str) -> None:
        await self._http.request("DELETE", f"{self._base}/boards/{board_id}")

    async def list_items(self, board_id: str, limit: int = 20, skip: int = 0) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/boards/{board_id}/items",
                                       params={"limit": limit, "skip": skip})
        return res.json()

    async def get_item(self, board_id: str, item_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/boards/{board_id}/items/{item_id}")
        return res.json()

    async def create_item(self, board_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/boards/{board_id}/items", json=body)
        return res.json()

    async def update_item(self, board_id: str, item_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PATCH", f"{self._base}/boards/{board_id}/items/{item_id}", json=body)
        return res.json()

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
        wire: Dict[str, Any] = {"source_type": "upload", "parent_folder_id": "root", **body}
        res = await self._http.request("POST", f"{self._base}/folders", json=wire)
        r = res.json()
        return r.get("data", r)

    async def update_folder(self, folder_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._base}/folders/{folder_id}", json=body)
        r = res.json()
        return r.get("data", r)

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
        res = await self._http.request("POST", f"{self._base}/files/upload", files=files)
        r = res.json()
        return r.get("data", r)
