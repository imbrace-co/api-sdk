from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class CategoriesResource:
    """Categories domain — Sync.

    @param base - gateway base URL (categories live in platform-service)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/platform/categories"

    def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List categories — returns ``{"data": [...]}``."""
        return self._http.request("GET", self._base, params=params or {}).json()

    def get(self, category_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/{category_id}").json()

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", self._base, json=body).json()

    def update(self, category_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._base}/{category_id}", json=body).json()

    def delete(self, category_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._base}/{category_id}").json()


class AsyncCategoriesResource:
    """Categories domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/platform/categories"

    async def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """List categories — returns ``{"data": [...]}``."""
        res = await self._http.request("GET", self._base, params=params or {})
        return res.json()

    async def get(self, category_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/{category_id}")
        return res.json()

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", self._base, json=body)
        return res.json()

    async def update(self, category_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._base}/{category_id}", json=body)
        return res.json()

    async def delete(self, category_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._base}/{category_id}")
        return res.json()
