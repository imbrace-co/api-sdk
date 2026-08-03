from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class IpsResource:
    """IPS — Automation workflows, schedulers, external data sync — Sync.

    @param base - ips base URL (ips-host/ips/v1)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    # --- AP Workflows ---
    def list_ap_workflows(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/ap-workflows/all").json()

    # --- External Data Sync ---
    def list_external_data_sync(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/external-data-sync").json()

    def delete_external_data_sync(self, sync_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._base}/external-data-sync/{sync_id}").json()

    def enable_external_data_sync(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._base}/external-data-sync/enable", json=body).json()

    # --- Schedulers ---
    def list_schedulers(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/schedulers", params=params or {}).json()

    def delete_scheduler(self, scheduler_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._base}/schedulers/{scheduler_id}").json()

    def get_scheduler_filter_options(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/schedulers/filter_options").json()


class AsyncIpsResource:
    """IPS — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def list_ap_workflows(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/ap-workflows/all")
        return res.json()

    async def list_external_data_sync(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/external-data-sync")
        return res.json()

    async def delete_external_data_sync(self, sync_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._base}/external-data-sync/{sync_id}")
        return res.json()

    async def enable_external_data_sync(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._base}/external-data-sync/enable", json=body)
        return res.json()

    async def list_schedulers(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/schedulers", params=params or {})
        return res.json()

    async def delete_scheduler(self, scheduler_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._base}/schedulers/{scheduler_id}")
        return res.json()

    async def get_scheduler_filter_options(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/schedulers/filter_options")
        return res.json()
