from typing import Any, Dict
from ..http import HttpTransport, AsyncHttpTransport


class OutboundsResource:
    """Outbound messaging — Sync.

    @param base - channel-service base URL (gateway/channel-service)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/outbounds"

    def send_whatsapp(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/whatsapp", json=body).json()

    def send_email(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/email", json=body).json()


class AsyncOutboundsResource:
    """Outbound messaging — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/v1/outbounds"

    async def send_whatsapp(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/whatsapp", json=body)
        return res.json()

    async def send_email(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/email", json=body)
        return res.json()
