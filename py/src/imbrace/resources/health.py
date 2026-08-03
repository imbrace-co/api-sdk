from typing import Any
from ..http import HttpTransport, AsyncHttpTransport


class HealthResource:
    """Health domain — Sync. 1 file = 1 domain."""
    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base

    def check(self) -> Any:
        return self._http.request("GET", f"{self._base}/").json()


class AsyncHealthResource:
    """Health domain — Async. 1 file = 1 domain."""
    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base

    async def check(self) -> Any:
        res = await self._http.request("GET", f"{self._base}/")
        return res.json()
