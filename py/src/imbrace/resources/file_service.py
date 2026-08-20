from typing import Any, Dict, List, Literal
from ..http import HttpTransport, AsyncHttpTransport


Context = Literal[
    "boards", "board", "teams", "users", "contacts",
    "conversation_messages", "messages", "floor_plans", "account",
]


class FileServiceResource:
    """File-service microservice client — Sync.

    The file-service is context-aware: every upload targets a specific
    context (boards, teams, users, contacts, conversation_messages,
    floor_plans, account). There is no flat "upload a file" endpoint.

    Gateway path: ``{gw}/files/v1`` → service ``/v1/...``.
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    # --- Context uploads ---
    def upload_for_context(self, context: Context, file: Any) -> Dict[str, Any]:
        """Upload a file scoped to a single context."""
        return self._http.request(
            "POST", f"{self._base}/{context}/_fileupload",
            files={"file": file},
        ).json()

    def upload_board_attachments(self, files: Any) -> List[Dict[str, Any]]:
        """Upload multiple files as a board attachment (up to 10)."""
        return self._http.request("POST", f"{self._base}/boards/upload", files=files).json()

    def upload_form_file(self, file: Any) -> Dict[str, Any]:
        """Public form-file upload (no auth required)."""
        return self._http.request("POST", f"{self._base}/form-files", files={"file": file}).json()

    def get_static_file(self, sub_path: str) -> Any:
        """Get a static file by sub-path; returns the raw Response."""
        return self._http.request("GET", f"{self._base}/files/{sub_path}")

    # --- Financial files ---
    def upload_financial_file(self, file: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/financial/upload", files={"file": file}).json()

    def get_financial_file(self, file_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/financial/{file_id}").json()

    def delete_financial_file(self, file_id: str) -> None:
        self._http.request("DELETE", f"{self._base}/financial/{file_id}")

    # --- Floor plan presigned S3 upload URL ---
    def get_floor_plan_presign_url(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/floor_plans/_presign_url", json=body).json()

    # --- Contact files ---
    def list_contact_files(self, contact_id: str) -> List[Dict[str, Any]]:
        return self._http.request("GET", f"{self._base}/contact/{contact_id}/files").json()


class AsyncFileServiceResource:
    """File-service microservice client — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def upload_for_context(self, context: Context, file: Any) -> Dict[str, Any]:
        res = await self._http.request(
            "POST", f"{self._base}/{context}/_fileupload",
            files={"file": file},
        )
        return res.json()

    async def upload_board_attachments(self, files: Any) -> List[Dict[str, Any]]:
        res = await self._http.request("POST", f"{self._base}/boards/upload", files=files)
        return res.json()

    async def upload_form_file(self, file: Any) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/form-files", files={"file": file})
        return res.json()

    async def get_static_file(self, sub_path: str) -> Any:
        return await self._http.request("GET", f"{self._base}/files/{sub_path}")

    async def upload_financial_file(self, file: Any) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/financial/upload", files={"file": file})
        return res.json()

    async def get_financial_file(self, file_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/financial/{file_id}")
        return res.json()

    async def delete_financial_file(self, file_id: str) -> None:
        await self._http.request("DELETE", f"{self._base}/financial/{file_id}")

    async def get_floor_plan_presign_url(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/floor_plans/_presign_url", json=body)
        return res.json()

    async def list_contact_files(self, contact_id: str) -> List[Dict[str, Any]]:
        res = await self._http.request("GET", f"{self._base}/contact/{contact_id}/files")
        return res.json()
