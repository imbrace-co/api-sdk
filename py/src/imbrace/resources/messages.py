from typing import Any, Dict, Optional
from ..http import HttpTransport, AsyncHttpTransport


class MessagesResource:
    """Messages domain — Sync.

    @param base         - channel-service base URL (gateway/channel-service)
    @param backend_base - backend base URL (gateway/v1/backend) for file upload
    """

    def __init__(self, http: HttpTransport, base: str, backend_base: Optional[str] = None):
        self._http = http
        self._base = base.rstrip("/")
        self._backend_base = backend_base.rstrip("/") if backend_base else None

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    def list(self, limit: int = 10, skip: int = 0) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._v1}/conversation_messages", params={"limit": limit, "skip": skip}).json()

    def send(self, type: str, text: Optional[str] = None, url: Optional[str] = None,
             caption: Optional[str] = None, title: Optional[str] = None,
             payload: Optional[str] = None) -> Dict[str, Any]:
        body: Dict[str, Any] = {"type": type}
        if text:
            body["text"] = text
        if url:
            body["url"] = url
        if caption:
            body["caption"] = caption
        if title:
            body["title"] = title
        if payload:
            body["payload"] = payload
        return self._http.request("POST", f"{self._v1}/conversation_messages", json=body).json()

    def upload_file(self, files: Any) -> Dict[str, Any]:
        """Upload message file. Endpoint: /v1/backend/conversation_messages/_fileupload"""
        base = self._backend_base or f"{self._v1.replace('/channel-service/v1', '')}/v1/backend"
        return self._http.request("POST", f"{base}/conversation_messages/_fileupload", files=files).json()


class AsyncMessagesResource:
    """Messages domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str, backend_base: Optional[str] = None):
        self._http = http
        self._base = base.rstrip("/")
        self._backend_base = backend_base.rstrip("/") if backend_base else None

    @property
    def _v1(self) -> str:
        return f"{self._base}/v1"

    async def list(self, limit: int = 10, skip: int = 0) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._v1}/conversation_messages", params={"limit": limit, "skip": skip})
        return res.json()

    async def send(self, type: str, text: Optional[str] = None, url: Optional[str] = None,
                   caption: Optional[str] = None, title: Optional[str] = None,
                   payload: Optional[str] = None) -> Dict[str, Any]:
        body: Dict[str, Any] = {"type": type}
        if text:
            body["text"] = text
        if url:
            body["url"] = url
        if caption:
            body["caption"] = caption
        if title:
            body["title"] = title
        if payload:
            body["payload"] = payload
        res = await self._http.request("POST", f"{self._v1}/conversation_messages", json=body)
        return res.json()

    async def upload_file(self, files: Any) -> Dict[str, Any]:
        """Upload message file (async). Endpoint: /v1/backend/conversation_messages/_fileupload"""
        base = self._backend_base or f"{self._v1.replace('/channel-service/v1', '')}/v1/backend"
        res = await self._http.request("POST", f"{base}/conversation_messages/_fileupload", files=files)
        return res.json()
