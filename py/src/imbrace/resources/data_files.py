from typing import Any, Dict, List, Optional
from ..http import HttpTransport, AsyncHttpTransport


class DataFilesResource:
    """Data-board Files — Sync.

    @param base - data-board base URL (gateway/data-board)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/files"

    def search(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/search", params=params or {}).json()

    def get(self, file_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/{file_id}").json()

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", self._base, json=body).json()

    def update(self, file_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._base}/{file_id}", json=body).json()

    def delete(self, file_ids: List[str]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/delete", json={"ids": file_ids}).json()

    def upload(self, files: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/upload", files=files).json()

    def download(self, file_id: str) -> Any:
        return self._http.request("GET", f"{self._base}/{file_id}/download")


class AsyncDataFilesResource:
    """Data-board Files — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/files"

    async def search(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/search", params=params or {})
        return res.json()

    async def get(self, file_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/{file_id}")
        return res.json()

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", self._base, json=body)
        return res.json()

    async def update(self, file_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._base}/{file_id}", json=body)
        return res.json()

    async def delete(self, file_ids: List[str]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/delete", json={"ids": file_ids})
        return res.json()

    async def upload(self, files: Any) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/upload", files=files)
        return res.json()
