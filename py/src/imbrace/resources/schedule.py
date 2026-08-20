from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class ScheduleResource:
    """Schedule domain — Sync. Alias to IPS schedulers for convenience.

    @param base - ips base URL (ips-host/ips/v1)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/schedulers"

    def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", self._base, params=params or {}).json()

    def delete(self, scheduler_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._base}/{scheduler_id}").json()

    def get_filter_options(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/filter_options").json()


class AsyncScheduleResource:
    """Schedule domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = f"{base.rstrip('/')}/schedulers"

    async def list(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", self._base, params=params or {})
        return res.json()

    async def delete(self, scheduler_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._base}/{scheduler_id}")
        return res.json()

    async def get_filter_options(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/filter_options")
        return res.json()
