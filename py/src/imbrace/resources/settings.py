from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class SettingsResource:
    """Settings domain — Sync. Message templates, WhatsApp templates, Users.

    @param channel_base - channel-service base URL (gateway/channel-service)
    @param platform_base - platform service base URL (gateway/platform)
    """

    def __init__(self, http: HttpTransport, channel_base: str, platform_base: str):
        self._http = http
        self._cs = channel_base.rstrip("/")
        self._platform = platform_base.rstrip("/")

    # --- Message Templates ---
    def list_message_templates(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._cs}/v1/message_templates", params=params or {}).json()

    def create_message_template(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._cs}/v1/message_templates", json=body).json()

    def get_message_template(self, template_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._cs}/v1/message_templates/{template_id}").json()

    def update_message_template(self, template_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._cs}/v1/message_templates/{template_id}", json=body).json()

    def delete_message_template(self, template_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._cs}/v1/message_templates/{template_id}").json()

    def search_message_templates(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._cs}/v1/message_templates/_search", params=params or {}).json()

    def list_message_templates_v2(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._cs}/v2/message_templates", params=params or {}).json()

    # --- WhatsApp Templates ---
    def list_whatsapp_templates(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._cs}/v1/whatsapp_templates", params=params or {}).json()

    def list_whatsapp_templates_v2(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._cs}/v2/whatsapp_templates", params=params or {}).json()

    # --- Users ---
    def list_users(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._platform}/v1/users", params=params or {}).json()

    def get_user_roles_count(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._platform}/v1/users/_roles_count").json()

    def bulk_invite_users(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._platform}/v1/users/_bulk_invite", json=body).json()


class AsyncSettingsResource:
    """Settings domain — Async.

    @param channel_base - channel-service base URL (gateway/channel-service)
    @param platform_base - platform service base URL (gateway/platform)
    """

    def __init__(self, http: AsyncHttpTransport, channel_base: str, platform_base: str):
        self._http = http
        self._cs = channel_base.rstrip("/")
        self._platform = platform_base.rstrip("/")

    async def list_message_templates(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._cs}/v1/message_templates", params=params or {})
        return res.json()

    async def create_message_template(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._cs}/v1/message_templates", json=body)
        return res.json()

    async def get_message_template(self, template_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._cs}/v1/message_templates/{template_id}")
        return res.json()

    async def update_message_template(self, template_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._cs}/v1/message_templates/{template_id}", json=body)
        return res.json()

    async def delete_message_template(self, template_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._cs}/v1/message_templates/{template_id}")
        return res.json()

    async def search_message_templates(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._cs}/v1/message_templates/_search", params=params or {})
        return res.json()

    async def list_message_templates_v2(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._cs}/v2/message_templates", params=params or {})
        return res.json()

    async def list_whatsapp_templates(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._cs}/v1/whatsapp_templates", params=params or {})
        return res.json()

    async def list_whatsapp_templates_v2(self, params: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._cs}/v2/whatsapp_templates", params=params or {})
        return res.json()

    async def list_users(self, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._platform}/v1/users", params=params or {})
        return res.json()
