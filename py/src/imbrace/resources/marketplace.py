from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class MarketplaceResource:
    """Marketplace domain — Sync.

    Base URL is the marketplace service (`{gateway}/marketplaces/v2`).
    Routes hit the marketplace microservice's own router (NOT legacy backend).
    """

    def __init__(self, http: HttpTransport, base: str, gateway: Optional[str] = None):
        self._http = http
        self._root = base.rstrip("/")
        # `gateway` kept for back-compat; unused after v1.1.0.
        self._gateway = gateway.rstrip("/") if gateway else None

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


class AsyncMarketplaceResource:
    """Marketplace domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str, gateway: Optional[str] = None):
        self._http = http
        self._root = base.rstrip("/")
        self._gateway = gateway.rstrip("/") if gateway else None

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
