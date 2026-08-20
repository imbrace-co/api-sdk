from typing import Any, Dict, List, Optional
from ..http import HttpTransport, AsyncHttpTransport


class FoldersResource:
    """Data-board Folders — Sync.

    @param base - data-board base URL (gateway/data-board)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/folders"

    def search(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/search", params=params or {}).json()

    def get(self, folder_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/{folder_id}").json()

    def get_contents(self, folder_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/{folder_id}/contents").json()

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", self._base, json=body).json()

    def update(self, folder_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._base}/{folder_id}", json=body).json()

    def delete(self, folder_ids: List[str]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/delete", json={"ids": folder_ids}).json()


class AsyncFoldersResource:
    """Data-board Folders — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/folders"

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
        res = await self._http.request("POST", self._base, json=body)
        return res.json()

    async def update(self, folder_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._base}/{folder_id}", json=body)
        return res.json()

    async def delete(self, folder_ids: List[str]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/delete", json={"ids": folder_ids})
        return res.json()
