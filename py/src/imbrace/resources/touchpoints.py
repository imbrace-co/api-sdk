from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class TouchpointsResource:
    """Touchpoints domain — Sync.

    @param base - channel-service base URL (gateway/channel-service)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/touchpoints"

    def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", self._base, params=params or {}).json()

    def get(self, touchpoint_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/{touchpoint_id}").json()

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", self._base, json=body).json()

    def update(self, touchpoint_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._base}/{touchpoint_id}", json=body).json()

    def delete(self, touchpoint_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._base}/{touchpoint_id}").json()

    def validate(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/_validate", json=body).json()


class AsyncTouchpointsResource:
    """Touchpoints domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/touchpoints"

    async def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", self._base, params=params or {})
        return res.json()

    async def get(self, touchpoint_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/{touchpoint_id}")
        return res.json()

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", self._base, json=body)
        return res.json()

    async def update(self, touchpoint_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._base}/{touchpoint_id}", json=body)
        return res.json()

    async def delete(self, touchpoint_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._base}/{touchpoint_id}")
        return res.json()

    async def validate(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/_validate", json=body)
        return res.json()
