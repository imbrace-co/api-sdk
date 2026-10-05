import re
from typing import Any, Dict, List, Optional
from ..http import HttpTransport, AsyncHttpTransport


def _v3_base(root: str, gateway: Optional[str]) -> str:
    gw = gateway or re.sub(r"/marketplaces/v\d+$", "", root)
    return f"{gw.rstrip('/')}/v3/marketplaces"


def _data(res: Any) -> Any:
    return res.get("data") if isinstance(res, dict) else res


class MarketplaceResource:
    """Marketplace domain — Sync.

    Base URL is the marketplace service (`{gateway}/marketplaces/v2`).
    Routes hit the marketplace microservice's own router (NOT legacy backend).
    Apps and team defaults use marketplace v3 (`{gateway}/v3/marketplaces`).
    """

    def __init__(self, http: HttpTransport, base: str, gateway: Optional[str] = None):
        self._http = http
        self._root = base.rstrip("/")
        self._gateway = gateway.rstrip("/") if gateway else None
        self._v3 = _v3_base(self._root, self._gateway)

    # --- Templates ---
    def list_use_case_templates(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._root}/market-places/v2/templates").json()

    def install_from_json(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._root}/market-places/templates/install-from-json", json=body).json()

    # --- Files ---
    def upload_file(self, files: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._root}/files", files=files).json()

    def delete_file(self, file_id: str) -> None:
        self._http.request("DELETE", f"{self._root}/files/{file_id}")

    def get_file_details(self, file_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._root}/file-details/{file_id}").json()

    def download_market_place_file(self, short_path: str) -> Any:
        return self._http.request("GET", f"{self._root}/files/{short_path}")

    # --- Email Templates ---
    def list_email_templates(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._root}/email-templates/search", params=params or {}).json()

    def create_email_template(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._root}/email-templates", json=body).json()

    # --- Channel workflows ---
    def post_channel_workflows(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._root}/market-places/channel-workflows", json=body).json()

    # --- Apps (marketplace v3) ---
    def list_app_catalog(self) -> List[Dict[str, Any]]:
        """Apps that can be installed."""
        return _data(self._http.request("GET", f"{self._v3}/apps/catalog").json())

    def list_installed_apps(self) -> List[Dict[str, Any]]:
        """Apps installed in the org."""
        return _data(self._http.request("GET", f"{self._v3}/apps/installed").json())

    def get_app_install(self, install_id: str) -> Dict[str, Any]:
        return _data(self._http.request("GET", f"{self._v3}/apps/installs/{install_id}").json())

    def install_app(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Install by ``{"package_id"}``, or by ``{"app_key", "version"?}``. Returns ``{install, setup?}``."""
        return _data(self._http.request("POST", f"{self._v3}/apps/install", json=body).json())

    def uninstall_app(self, install_id: str) -> Dict[str, Any]:
        return _data(self._http.request("DELETE", f"{self._v3}/apps/installs/{install_id}").json())

    def install_team_defaults(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Install the default team agents for the given teams (matched by team name).

        ``body``: ``teams=[{id, name}]`` (``[]`` installs only the org-wide
        ones), optional ``reset``, ``source`` (package|builtin), ``kind``
        (sync|create). Runs synchronously and can take minutes; ``reset=True``
        removes them first. Returns ``{installed, skipped, failed}``.
        """
        return _data(self._http.request(
            "POST", f"{self._v3}/market-places/v2/templates/_install_team_defaults", json=body
        ).json())


class AsyncMarketplaceResource:
    """Marketplace domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str, gateway: Optional[str] = None):
        self._http = http
        self._root = base.rstrip("/")
        self._gateway = gateway.rstrip("/") if gateway else None
        self._v3 = _v3_base(self._root, self._gateway)

    async def list_use_case_templates(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._root}/market-places/v2/templates")
        return res.json()

    async def install_from_json(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._root}/market-places/templates/install-from-json", json=body)
        return res.json()

    async def upload_file(self, files: Any) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._root}/files", files=files)
        return res.json()

    async def delete_file(self, file_id: str) -> None:
        await self._http.request("DELETE", f"{self._root}/files/{file_id}")

    async def get_file_details(self, file_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._root}/file-details/{file_id}")
        return res.json()

    async def download_market_place_file(self, short_path: str) -> Any:
        return await self._http.request("GET", f"{self._root}/files/{short_path}")

    async def list_email_templates(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._root}/email-templates/search", params=params or {})
        return res.json()

    async def create_email_template(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._root}/email-templates", json=body)
        return res.json()

    async def post_channel_workflows(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._root}/market-places/channel-workflows", json=body)
        return res.json()

    # --- Apps (marketplace v3) ---
    async def list_app_catalog(self) -> List[Dict[str, Any]]:
        """Apps that can be installed."""
        res = await self._http.request("GET", f"{self._v3}/apps/catalog")
        return _data(res.json())

    async def list_installed_apps(self) -> List[Dict[str, Any]]:
        """Apps installed in the org."""
        res = await self._http.request("GET", f"{self._v3}/apps/installed")
        return _data(res.json())

    async def get_app_install(self, install_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v3}/apps/installs/{install_id}")
        return _data(res.json())

    async def install_app(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Install by ``{"package_id"}``, or by ``{"app_key", "version"?}``."""
        res = await self._http.request("POST", f"{self._v3}/apps/install", json=body)
        return _data(res.json())

    async def uninstall_app(self, install_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._v3}/apps/installs/{install_id}")
        return _data(res.json())

    async def install_team_defaults(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Install the default team agents for the given teams. See the sync method."""
        res = await self._http.request(
            "POST", f"{self._v3}/market-places/v2/templates/_install_team_defaults", json=body
        )
        return _data(res.json())
