from typing import Any, Dict
from ..http import HttpTransport, AsyncHttpTransport


class MessageSuggestionResource:
    """Message suggestion domain — Sync.

    Endpoint: ``POST {gateway}/ai-agent/suggestions``.

    @param base - suggestions endpoint (``{gateway}/ai-agent/suggestions``)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    def get_suggestions(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Get follow-up message suggestions for a chat thread.

        ``body`` requires ``thread_id`` (chat thread UUID); optional
        ``assistant_id``, ``provider_id``, ``model_id``, ``custom_instructions``.
        Returns ``{success, follow_up_message, suggestions: [...]}``.
        """
        return self._http.request("POST", self._base, json=body).json()


class AsyncMessageSuggestionResource:
    """Message suggestion domain — Async. Endpoint: ``POST {gateway}/ai-agent/suggestions``."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def get_suggestions(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Get follow-up message suggestions for a chat thread. ``body`` requires ``thread_id``."""
        res = await self._http.request("POST", self._base, json=body)
        return res.json()
