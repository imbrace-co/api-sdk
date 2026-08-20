from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class CampaignsResource:
    """Campaigns domain — Sync.

    @param base - channel-service base URL (gateway/channel-service)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._v1 = f"{base.rstrip('/')}/v1"

    def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/campaign", params=params or {}).json()

    def get(self, campaign_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/campaign/{campaign_id}").json()

    def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/campaign", json=body).json()

    def delete(self, campaign_id: str) -> None:
        self._http.request("DELETE", f"{self._v1}/campaign/{campaign_id}")

    def list_touchpoints(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/touchpoints", params=params or {}).json()

    def get_touchpoint(self, touchpoint_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/touchpoints/{touchpoint_id}").json()

    def create_touchpoint(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/touchpoints", json=body).json()

    def update_touchpoint(self, touchpoint_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v1}/touchpoints/{touchpoint_id}", json=body).json()

    def delete_touchpoint(self, touchpoint_id: str) -> None:
        self._http.request("DELETE", f"{self._v1}/touchpoints/{touchpoint_id}")

    def validate_touchpoint(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/touchpoints/_validate", json=body).json()


class AsyncCampaignsResource:
    """Campaigns domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._v1 = f"{base.rstrip('/')}/v1"

    async def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/campaign", params=params or {})
        return res.json()

    async def get(self, campaign_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/campaign/{campaign_id}")
        return res.json()

    async def create(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/campaign", json=body)
        return res.json()

    async def delete(self, campaign_id: str) -> None:
        await self._http.request("DELETE", f"{self._v1}/campaign/{campaign_id}")

    async def list_touchpoints(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/touchpoints", params=params or {})
        return res.json()

    async def get_touchpoint(self, touchpoint_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/touchpoints/{touchpoint_id}")
        return res.json()

    async def create_touchpoint(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/touchpoints", json=body)
        return res.json()

    async def update_touchpoint(self, touchpoint_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._v1}/touchpoints/{touchpoint_id}", json=body)
        return res.json()

    async def delete_touchpoint(self, touchpoint_id: str) -> None:
        await self._http.request("DELETE", f"{self._v1}/touchpoints/{touchpoint_id}")

    async def validate_touchpoint(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/touchpoints/_validate", json=body)
        return res.json()
