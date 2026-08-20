from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport

class LicenseResource:
    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    def get_license(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/license").json()

class AsyncLicenseResource:
    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def get_license(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/license")
        return res.json()
