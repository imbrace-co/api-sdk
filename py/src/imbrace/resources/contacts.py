from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class ContactsResource:
    """Contacts domain — Sync.

    @param base - channel-service base URL (gateway/channel-service)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    def list(self, limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        params = {}
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip
        return self._http.request("GET", f"{self._v1}/contacts",
                                  params=params).json()

    def get(self, contact_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/contacts/{contact_id}").json()

    def search(self, query: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/contacts/_search",
                                  params={"q": query}).json()

    def update(self, contact_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v1}/contacts/{contact_id}", json=body).json()

    def get_conversations(self, contact_id: str, channel_types: Optional[str] = None) -> Dict[str, Any]:
        params = {}
        if channel_types:
            params["channel_types"] = channel_types
        return self._http.request("GET", f"{self._v1}/contacts/{contact_id}/conversations",
                                  params=params).json()

    def get_comments(self, contact_id: str, channel_type: Optional[str] = None,
                     skip: Optional[int] = None, limit: Optional[int] = None) -> Dict[str, Any]:
        params: dict = {}
        if channel_type:
            params["channel_types"] = channel_type
        if skip is not None:
            params["skip"] = skip
        if limit is not None:
            params["limit"] = limit
        return self._http.request("GET", f"{self._v1}/contacts/{contact_id}/comments",
                                  params=params).json()

    def get_files(self, contact_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/contact/{contact_id}/files").json()

    def get_activities(self, conversation_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/conversations_activities/{conversation_id}").json()

    def list_notifications(self, limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        params = {}
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip
        return self._http.request("GET", f"{self._v1}/notifications",
                                  params=params).json()

    def mark_notifications_read(self) -> Dict[str, Any]:
        return self._http.request("PUT", f"{self._v1}/notifications/read").json()

    def dismiss_notification(self, notification_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._v1}/notifications/dismiss",
                                  json={"notification_id": notification_id}).json()

    def dismiss_all_notifications(self) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._v1}/notifications/dismiss/all").json()

    def export_csv(self, sort: Optional[str] = None) -> Any:
        params = {}
        if sort:
            params["sort"] = sort
        return self._http.request("GET", f"{self._v1}/contacts/_export_csv", params=params).content

    def upload_contacts(self, files: Any) -> Dict[str, Any]:
        return self._http.request("POST", f"{self._v1}/contacts/_fileupload", files=files).json()


class AsyncContactsResource:
    """Contacts domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    async def list(self, limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        params = {}
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip
        res = await self._http.request("GET", f"{self._v1}/contacts",
                                       params=params)
        return res.json()

    async def get(self, contact_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/contacts/{contact_id}")
        return res.json()

    async def search(self, query: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/contacts/_search", params={"q": query})
        return res.json()

    async def update(self, contact_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._v1}/contacts/{contact_id}", json=body)
        return res.json()

    async def get_conversations(self, contact_id: str, channel_types: Optional[str] = None) -> Dict[str, Any]:
        params = {}
        if channel_types:
            params["channel_types"] = channel_types
        res = await self._http.request("GET", f"{self._v1}/contacts/{contact_id}/conversations", params=params)
        return res.json()

    async def get_comments(self, contact_id: str, channel_type: Optional[str] = None,
                           skip: Optional[int] = None, limit: Optional[int] = None) -> Dict[str, Any]:
        params: dict = {}
        if channel_type:
            params["channel_types"] = channel_type
        if skip is not None:
            params["skip"] = skip
        if limit is not None:
            params["limit"] = limit
        res = await self._http.request("GET", f"{self._v1}/contacts/{contact_id}/comments", params=params)
        return res.json()

    async def get_files(self, contact_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/contact/{contact_id}/files")
        return res.json()

    async def get_activities(self, conversation_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/conversations_activities/{conversation_id}")
        return res.json()

    async def list_notifications(self, limit: Optional[int] = None, skip: Optional[int] = None) -> Dict[str, Any]:
        params = {}
        if limit is not None:
            params["limit"] = limit
        if skip is not None:
            params["skip"] = skip
        res = await self._http.request("GET", f"{self._v1}/notifications", params=params)
        return res.json()

    async def mark_notifications_read(self) -> Dict[str, Any]:
        res = await self._http.request("PUT", f"{self._v1}/notifications/read")
        return res.json()

    async def dismiss_notification(self, notification_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._v1}/notifications/dismiss",
                                       json={"notification_id": notification_id})
        return res.json()

    async def dismiss_all_notifications(self) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._v1}/notifications/dismiss/all")
        return res.json()

    async def export_csv(self, sort: Optional[str] = None) -> Any:
        params = {}
        if sort:
            params["sort"] = sort
        res = await self._http.request("GET", f"{self._v1}/contacts/_export_csv", params=params)
        return res.content

    async def upload_contacts(self, files: Any) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._v1}/contacts/_fileupload", files=files)
        return res.json()
