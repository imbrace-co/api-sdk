from typing import Any, Dict
from ..http import HttpTransport, AsyncHttpTransport


class MessageSuggestionResource:
    """Message suggestion domain — Sync.

    Endpoint: /v1/message-suggestion
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    def get_suggestions(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("POST", self._base, json=body).json()


class AsyncMessageSuggestionResource:
    """Message suggestion domain — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def get_suggestions(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", self._base, json=body)
        return res.json()
