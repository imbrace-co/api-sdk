import re
from typing import Any, Dict, NoReturn, Optional, Tuple
from ..exceptions import ImbraceError
from ..http import HttpTransport, AsyncHttpTransport

_NO_REPLACEMENT = "There is no replacement."


def _retired(method: str, hint: str = _NO_REPLACEMENT) -> NoReturn:
    raise ImbraceError(
        f"ips.{method}() is no longer available: the IPS service has been retired. {hint}"
    )


def _service_bases(base: str, data_board: Optional[str],
                   channel_service: Optional[str]) -> Tuple[str, str]:
    gateway = re.sub(r"/ips/v\d+/?$", "", base.rstrip("/"))
    return (
        (data_board or f"{gateway}/data-board").rstrip("/"),
        (channel_service or f"{gateway}/channel-service").rstrip("/"),
    )


def _filter_params(filter: Optional[str]) -> Dict[str, Any]:
    return {"filter": filter} if filter else {}


class IpsResource:
    """Former IPS surface — Sync.

    The IPS service is retired: schedulers now live in data-board and external
    data sync in channel-service. Everything else has no replacement and raises
    :class:`ImbraceError`.

    @param base            - IPS base URL (gateway/ips/v1), kept for compatibility
    @param data_board      - data-board base URL (gateway/data-board)
    @param channel_service - channel-service base URL (gateway/channel-service)
    """

    def __init__(self, http: HttpTransport, base: str,
                 data_board: Optional[str] = None, channel_service: Optional[str] = None):
        self._http = http
        self._data_board, self._channel_service = _service_bases(base, data_board, channel_service)

    # --- AP Workflows (retired) ---
    def list_ap_workflows(self) -> Dict[str, Any]:
        """Deprecated — raises. Use ``client.workflows.list_flows()``."""
        _retired("list_ap_workflows", "Use client.workflows.list_flows() instead.")

    # --- External Data Sync → channel-service ---
    def list_external_data_sync(self) -> Dict[str, Any]:
        """List sync subscriptions — returns ``{"data": [...], "count": n}``."""
        return self._http.request("GET", f"{self._channel_service}/v1/external-data-sync").json()

    def delete_external_data_sync(self, sync_id: str) -> Dict[str, Any]:
        return self._http.request(
            "DELETE", f"{self._channel_service}/v1/external-data-sync/{sync_id}"
        ).json()

    def enable_external_data_sync(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """``body`` needs ``provider`` and ``connection_id``."""
        return self._http.request(
            "POST", f"{self._channel_service}/v1/external-data-sync/enable", json=body
        ).json()

    # --- Schedulers → data-board ---
    def list_schedulers(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Paged list — returns ``{"data": [...], "count", "total", "has_more"}``."""
        return self._http.request(
            "GET", f"{self._data_board}/v1/schedulers", params=params or {}
        ).json()

    def delete_scheduler(self, scheduler_id: str) -> Dict[str, Any]:
        return self._http.request(
            "DELETE", f"{self._data_board}/v1/schedulers/{scheduler_id}"
        ).json()

    def get_scheduler_filter_options(self, filter: Optional[str] = None) -> Any:
        """Distinct values of ``filter`` (event_type | channel_source | sender)."""
        return self._http.request(
            "GET", f"{self._data_board}/v1/schedulers/filter_options", params=_filter_params(filter)
        ).json()

    # --- Workflows (retired) ---
    def list_workflows(self, params: Optional[Dict[str, str]] = None) -> Any:
        """Deprecated — raises. Use ``client.workflows.list_channel_automation()``."""
        _retired("list_workflows", "Use client.workflows.list_channel_automation() instead.")

    # --- Profiles, follow graph, identities (retired, no replacement) ---
    def get_profile(self, user_id: str) -> Dict[str, Any]:
        _retired("get_profile")

    def get_my_profile(self) -> Dict[str, Any]:
        _retired("get_my_profile")

    def update_profile(self, user_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        _retired("update_profile")

    def search_profiles(self, query: str, page: Optional[int] = None,
                        limit: Optional[int] = None) -> Dict[str, Any]:
        _retired("search_profiles")

    def follow(self, target_user_id: str) -> None:
        _retired("follow")

    def unfollow(self, target_user_id: str) -> None:
        _retired("unfollow")

    def get_followers(self, user_id: str, page: Optional[int] = None,
                      limit: Optional[int] = None) -> Dict[str, Any]:
        _retired("get_followers")

    def get_following(self, user_id: str, page: Optional[int] = None,
                      limit: Optional[int] = None) -> Dict[str, Any]:
        _retired("get_following")

    def list_identities(self, user_id: str) -> Any:
        _retired("list_identities")

    def unlink_identity(self, user_id: str, provider: str) -> None:
        _retired("unlink_identity")


class AsyncIpsResource:
    """Former IPS surface — Async. See :class:`IpsResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str,
                 data_board: Optional[str] = None, channel_service: Optional[str] = None):
        self._http = http
        self._data_board, self._channel_service = _service_bases(base, data_board, channel_service)

    async def list_ap_workflows(self) -> Dict[str, Any]:
        _retired("list_ap_workflows", "Use client.workflows.list_flows() instead.")

    async def list_external_data_sync(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._channel_service}/v1/external-data-sync")
        return res.json()

    async def delete_external_data_sync(self, sync_id: str) -> Dict[str, Any]:
        res = await self._http.request(
            "DELETE", f"{self._channel_service}/v1/external-data-sync/{sync_id}"
        )
        return res.json()

    async def enable_external_data_sync(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request(
            "POST", f"{self._channel_service}/v1/external-data-sync/enable", json=body
        )
        return res.json()

    async def list_schedulers(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request(
            "GET", f"{self._data_board}/v1/schedulers", params=params or {}
        )
        return res.json()

    async def delete_scheduler(self, scheduler_id: str) -> Dict[str, Any]:
        res = await self._http.request(
            "DELETE", f"{self._data_board}/v1/schedulers/{scheduler_id}"
        )
        return res.json()

    async def get_scheduler_filter_options(self, filter: Optional[str] = None) -> Any:
        res = await self._http.request(
            "GET", f"{self._data_board}/v1/schedulers/filter_options", params=_filter_params(filter)
        )
        return res.json()

    async def list_workflows(self, params: Optional[Dict[str, str]] = None) -> Any:
        _retired("list_workflows", "Use client.workflows.list_channel_automation() instead.")

    async def get_profile(self, user_id: str) -> Dict[str, Any]:
        _retired("get_profile")

    async def get_my_profile(self) -> Dict[str, Any]:
        _retired("get_my_profile")

    async def update_profile(self, user_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        _retired("update_profile")

    async def search_profiles(self, query: str, page: Optional[int] = None,
                              limit: Optional[int] = None) -> Dict[str, Any]:
        _retired("search_profiles")

    async def follow(self, target_user_id: str) -> None:
        _retired("follow")

    async def unfollow(self, target_user_id: str) -> None:
        _retired("unfollow")

    async def get_followers(self, user_id: str, page: Optional[int] = None,
                            limit: Optional[int] = None) -> Dict[str, Any]:
        _retired("get_followers")

    async def get_following(self, user_id: str, page: Optional[int] = None,
                            limit: Optional[int] = None) -> Dict[str, Any]:
        _retired("get_following")

    async def list_identities(self, user_id: str) -> Any:
        _retired("list_identities")

    async def unlink_identity(self, user_id: str, provider: str) -> None:
        _retired("unlink_identity")
