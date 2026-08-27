from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport

class LicenseResource:
    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    def get_license(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/license").json()

    def activate(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/license", json=body).json()

    # Alias matching the TypeScript SDK's license.get().
    def get(self) -> Dict[str, Any]:
        return self.get_license()


class AsyncLicenseResource:
    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def get_license(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/license")
        return res.json()

    async def activate(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/license", json=body)
        return res.json()

    async def get(self) -> Dict[str, Any]:
        return await self.get_license()
