from typing import Any, AsyncIterator, Dict, Iterator, List, Optional, Union
from ..http import HttpTransport, AsyncHttpTransport
from ..types.channel import Channel
from ..types.common import PagedResponse


class ChannelResource:
    """Channel domain — Sync.

    @param base - channel-service base URL (gateway/channel-service)
      Version (v1/v2/v3) is appended per method.
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    @property
    def _v2(self) -> str:
        return f"{self._base}/v2"

    @property
    def _v3(self) -> str:
        return f"{self._base}/v3"

    def list(self, type: Optional[str] = None) -> PagedResponse[Channel]:
        """List channels."""
        params = {}
        if type:
            params["type"] = type
        res = self._http.request("GET", f"{self._v1}/channels", params=params).json()
        return PagedResponse[Channel](**res)

    def list_all(self, type: Optional[str] = None) -> Iterator[Channel]:
        """Automatically iterate through all channels (Smart Pagination)."""
        params = {}
        if type:
            params["type"] = type
        return self._http.iterate_paged("GET", f"{self._v1}/channels", model=Channel, params=params)

    def get(self, channel_id: str) -> Channel:
        """Get detailed information for a single channel."""
        res = self._http.request("GET", f"{self._v1}/channels/{channel_id}").json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create(self, body: Dict[str, Any]) -> Channel:
        """Create a new channel."""
        res = self._http.request("POST", f"{self._v1}/channels", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def update(self, channel_id: str, body: Dict[str, Any]) -> Channel:
        """Update channel information."""
        res = self._http.request("PUT", f"{self._v1}/channels/{channel_id}", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def delete(self, channel_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._v1}/channels/{channel_id}").json()

    def delete_v3(self, channel_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._v3}/channels/{channel_id}").json()

    def get_count(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/channels/_count").json()

    def get_conv_count(self, view: Optional[str] = None, team_id: Optional[str] = None) -> Dict[str, Any]:
        params = {}
        if view:
            params["view"] = view
        if team_id:
            params["team_id"] = team_id
        return self._http.request("GET", f"{self._v1}/channels/_conv_count", params=params).json()

    def replace(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("POST", f"{self._v1}/channels/_replace", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create_web(self, name: str) -> Channel:
        res = self._http.request("POST", f"{self._v1}/channels/_web", json={"name": name}).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create_web_v3(self, name: str) -> Channel:
        res = self._http.request("POST", f"{self._v3}/channels/_web", json={"name": name}).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create_facebook(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("POST", f"{self._v3}/channels/_facebook", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def update_facebook(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("PUT", f"{self._v2}/channels/_facebook", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create_instagram(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("POST", f"{self._v1}/channels/_instagram", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create_instagram_v2(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("POST", f"{self._v1}/channels/_instagramV2", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create_email(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("POST", f"{self._v1}/channels/_email", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create_wechat(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("POST", f"{self._v1}/channels/_wechat", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create_line(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("POST", f"{self._v1}/channels/_line", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create_whatsapp(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("POST", f"{self._v1}/channels/_whatsapp", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create_whatsapp_v2(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("POST", f"{self._v2}/channels/_whatsapp", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def create_whatsapp_v3(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("POST", f"{self._v3}/channels/_whatsapp", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def update_whatsapp(self, body: Dict[str, Any]) -> Channel:
        res = self._http.request("PUT", f"{self._v2}/channels/_whatsapp", json=body).json()
        if "data" in res and "success" in res:
            return Channel(**res["data"])
        return Channel(**res)

    def get_facebook_pages(self, credential_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/channels/_facebook/credential/{credential_id}").json()

    def get_credential(self, credential_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/channels/credentials/{credential_id}").json()

    def update_credential(self, credential_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v1}/channels/credentials/{credential_id}", json=body).json()

    def delete_credential(self, credential_id: str) -> None:
        self._http.request("DELETE", f"{self._v1}/channels/credentials/{credential_id}")

    def update_channel_workflow(self, workflow_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v1}/channels/workflows/{workflow_id}", json=body).json()

    def delete_channel_workflow(self, workflow_id: str) -> None:
        self._http.request("DELETE", f"{self._v1}/channels/workflows/{workflow_id}")

    def list_assignable_teams(self) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/assign/teams/all").json()

    def list_team_observers(self, team_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/assign/team/{team_id}/observers").json()


class AsyncChannelResource:
    """Channel domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    @property
    def _v2(self) -> str:
        return f"{self._base}/v2"

    @property
    def _v3(self) -> str:
        return f"{self._base}/v3"

    async def list(self, type: Optional[str] = None) -> PagedResponse[Channel]:
        params = {}
        if type:
            params["type"] = type
        res = await self._http.request("GET", f"{self._v1}/channels", params=params)
        return PagedResponse[Channel](**res.json())

    async def list_all(self, type: Optional[str] = None) -> AsyncIterator[Channel]:
        """Automatically iterate through all channels (Async Smart Pagination)."""
        params = {}
        if type:
            params["type"] = type
        async for channel in self._http.iterate_paged("GET", f"{self._v1}/channels", model=Channel, params=params):
            yield channel

    async def get(self, channel_id: str) -> Channel:
        res = await self._http.request("GET", f"{self._v1}/channels/{channel_id}")
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def create(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("POST", f"{self._v1}/channels", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def update(self, channel_id: str, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("PUT", f"{self._v1}/channels/{channel_id}", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def delete(self, channel_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._v1}/channels/{channel_id}")
        return res.json()

    async def get_count(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/channels/_count")
        return res.json()

    async def get_conv_count(self, view: Optional[str] = None, team_id: Optional[str] = None) -> Dict[str, Any]:
        params = {}
        if view:
            params["view"] = view
        if team_id:
            params["team_id"] = team_id
        res = await self._http.request("GET", f"{self._v1}/channels/_conv_count", params=params)
        return res.json()

    async def create_web(self, name: str) -> Channel:
        res = await self._http.request("POST", f"{self._v1}/channels/_web", json={"name": name})
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def create_web_v3(self, name: str) -> Channel:
        res = await self._http.request("POST", f"{self._v3}/channels/_web", json={"name": name})
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def create_facebook(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("POST", f"{self._v3}/channels/_facebook", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def create_whatsapp(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("POST", f"{self._v1}/channels/_whatsapp", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def create_whatsapp_v2(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("POST", f"{self._v2}/channels/_whatsapp", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def create_whatsapp_v3(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("POST", f"{self._v3}/channels/_whatsapp", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def update_whatsapp(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("PUT", f"{self._v2}/channels/_whatsapp", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def update_facebook(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("PUT", f"{self._v2}/channels/_facebook", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def create_instagram(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("POST", f"{self._v1}/channels/_instagram", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def create_instagram_v2(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("POST", f"{self._v1}/channels/_instagramV2", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def create_email(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("POST", f"{self._v1}/channels/_email", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def create_wechat(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("POST", f"{self._v1}/channels/_wechat", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def create_line(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("POST", f"{self._v1}/channels/_line", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def delete_v3(self, channel_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._v3}/channels/{channel_id}")
        return res.json()

    async def replace(self, body: Dict[str, Any]) -> Channel:
        res = await self._http.request("POST", f"{self._v1}/channels/_replace", json=body)
        data = res.json()
        if "data" in data and "success" in data:
            return Channel(**data["data"])
        return Channel(**data)

    async def get_credential(self, credential_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/channels/credentials/{credential_id}")
        return res.json()

    async def update_credential(self, credential_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._v1}/channels/credentials/{credential_id}", json=body)
        return res.json()

    async def delete_credential(self, credential_id: str) -> None:
        await self._http.request("DELETE", f"{self._v1}/channels/credentials/{credential_id}")

    async def get_facebook_pages(self, credential_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/channels/_facebook/credential/{credential_id}")
        return res.json()

    async def update_channel_workflow(self, workflow_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._v1}/channels/workflows/{workflow_id}", json=body)
        return res.json()

    async def delete_channel_workflow(self, workflow_id: str) -> None:
        await self._http.request("DELETE", f"{self._v1}/channels/workflows/{workflow_id}")

    async def list_assignable_teams(self) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/assign/teams/all")
        return res.json()

    async def list_team_observers(self, team_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/assign/team/{team_id}/observers")
        return res.json()
