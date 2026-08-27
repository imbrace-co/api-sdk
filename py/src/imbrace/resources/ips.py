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

    # --- Workflows ---
    def list_workflows(self, params: Optional[Dict[str, str]] = None) -> Any:
        return self._http.request("GET", f"{self._base}/workflows/all", params=params or {}).json()

    # --- Profiles ---
    def get_profile(self, user_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/profiles/{user_id}").json()

    def get_my_profile(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._base}/profiles/me").json()

    def update_profile(self, user_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PATCH", f"{self._base}/profiles/{user_id}", json=body).json()

    def search_profiles(self, query: str, page: Optional[int] = None,
                        limit: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {"q": query}
        if page:
            params["page"] = page
        if limit:
            params["limit"] = limit
        return self._http.request("GET", f"{self._base}/profiles", params=params).json()

    # --- Follow graph ---
    def follow(self, target_user_id: str) -> None:
        self._http.request("POST", f"{self._base}/profiles/{target_user_id}/follow")

    def unfollow(self, target_user_id: str) -> None:
        self._http.request("DELETE", f"{self._base}/profiles/{target_user_id}/follow")

    def get_followers(self, user_id: str, page: Optional[int] = None,
                      limit: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if page:
            params["page"] = page
        if limit:
            params["limit"] = limit
        return self._http.request(
            "GET", f"{self._base}/profiles/{user_id}/followers", params=params
        ).json()

    def get_following(self, user_id: str, page: Optional[int] = None,
                      limit: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if page:
            params["page"] = page
        if limit:
            params["limit"] = limit
        return self._http.request(
            "GET", f"{self._base}/profiles/{user_id}/following", params=params
        ).json()

    # --- Identities ---
    def list_identities(self, user_id: str) -> Any:
        return self._http.request("GET", f"{self._base}/identities/{user_id}").json()

    def unlink_identity(self, user_id: str, provider: str) -> None:
        self._http.request("DELETE", f"{self._base}/identities/{user_id}/{provider}")


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

    # --- Workflows ---
    async def list_workflows(self, params: Optional[Dict[str, str]] = None) -> Any:
        res = await self._http.request("GET", f"{self._base}/workflows/all", params=params or {})
        return res.json()

    # --- Profiles ---
    async def get_profile(self, user_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/profiles/{user_id}")
        return res.json()

    async def get_my_profile(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._base}/profiles/me")
        return res.json()

    async def update_profile(self, user_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PATCH", f"{self._base}/profiles/{user_id}", json=body)
        return res.json()

    async def search_profiles(self, query: str, page: Optional[int] = None,
                              limit: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {"q": query}
        if page:
            params["page"] = page
        if limit:
            params["limit"] = limit
        res = await self._http.request("GET", f"{self._base}/profiles", params=params)
        return res.json()

    # --- Follow graph ---
    async def follow(self, target_user_id: str) -> None:
        await self._http.request("POST", f"{self._base}/profiles/{target_user_id}/follow")

    async def unfollow(self, target_user_id: str) -> None:
        await self._http.request("DELETE", f"{self._base}/profiles/{target_user_id}/follow")

    async def get_followers(self, user_id: str, page: Optional[int] = None,
                            limit: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if page:
            params["page"] = page
        if limit:
            params["limit"] = limit
        res = await self._http.request(
            "GET", f"{self._base}/profiles/{user_id}/followers", params=params
        )
        return res.json()

    async def get_following(self, user_id: str, page: Optional[int] = None,
                            limit: Optional[int] = None) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if page:
            params["page"] = page
        if limit:
            params["limit"] = limit
        res = await self._http.request(
            "GET", f"{self._base}/profiles/{user_id}/following", params=params
        )
        return res.json()

    # --- Identities ---
    async def list_identities(self, user_id: str) -> Any:
        res = await self._http.request("GET", f"{self._base}/identities/{user_id}")
        return res.json()

    async def unlink_identity(self, user_id: str, provider: str) -> None:
        await self._http.request("DELETE", f"{self._base}/identities/{user_id}/{provider}")
