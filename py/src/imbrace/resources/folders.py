from typing import Any, Dict, List, Optional
from ..http import HttpTransport, AsyncHttpTransport
from .boards import default_platform_base, folder_create_body, org_from_account


class FoldersResource:
    """Data-board Folders — Sync.

    @param base     - data-board base URL (gateway/data-board)
    @param platform - platform base URL (gateway/platform), used to look up the caller's org
    """

    def __init__(self, http: HttpTransport, base: str, platform: Optional[str] = None):
        self._http = http
        self._base = f"{base.rstrip('/')}/folders"
        self._platform = (platform or default_platform_base(base.rstrip('/')) or "").rstrip("/") or None
        self._org_id: Optional[str] = None

    def _resolve_org_id(self) -> Optional[str]:
        if self._org_id:
            return self._org_id
        self._org_id = self._http.organization_id
        if not self._org_id and self._platform:
            self._org_id = org_from_account(self._http.request("GET", f"{self._platform}/v1/account").json())
        return self._org_id

    def search(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/search", params=params or {}).json()

    def get(self, folder_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/{folder_id}").json()

    def get_contents(self, folder_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/{folder_id}/contents").json()

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a folder.

        ``organization_id``, ``source_type`` and ``parent_folder_id`` default to
        the caller's org, ``"upload"`` and ``"root"``; ``parent_id`` is sent as
        ``parent_folder_id``.
        """
        org = None if body.get("organization_id") else self._resolve_org_id()
        return self._http.request("POST", self._base, json=folder_create_body(body, org)).json()

    def update(self, folder_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._base}/{folder_id}", json=body).json()

    def delete(self, folder_ids: List[str]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/delete", json={"ids": folder_ids}).json()


class AsyncFoldersResource:
    """Data-board Folders — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str, platform: Optional[str] = None):
        self._http = http
        self._base = f"{base.rstrip('/')}/folders"
        self._platform = (platform or default_platform_base(base.rstrip('/')) or "").rstrip("/") or None
        self._org_id: Optional[str] = None

    async def _resolve_org_id(self) -> Optional[str]:
        if self._org_id:
            return self._org_id
        self._org_id = self._http.organization_id
        if not self._org_id and self._platform:
            res = await self._http.request("GET", f"{self._platform}/v1/account")
            self._org_id = org_from_account(res.json())
        return self._org_id

    async def search(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/search", params=params or {})
        return res.json()

    async def get(self, folder_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/{folder_id}")
        return res.json()

    async def get_contents(self, folder_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/{folder_id}/contents")
        return res.json()

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a folder. See :meth:`FoldersResource.create`."""
        org = None if body.get("organization_id") else await self._resolve_org_id()
        res = await self._http.request("POST", self._base, json=folder_create_body(body, org))
        return res.json()

    async def update(self, folder_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._base}/{folder_id}", json=body)
        return res.json()

    async def delete(self, folder_ids: List[str]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/delete", json={"ids": folder_ids})
        return res.json()
