"""Agent-to-Agent (A2A) support — protocol version 0.3.0.

Two entry points:

* :class:`A2AResource` / :class:`AsyncA2AResource` — this organization's agents,
  reached through the platform (``client.a2a``).
* :class:`A2AClient` / :class:`AsyncA2AClient` — any agent that speaks A2A,
  on this platform or not. These hold no Imbrace credential, so pointing one at
  a third-party host cannot leak your platform token.
"""

import json
import uuid
from typing import Any, Dict, List, Optional

import httpx

from ..exceptions import ImbraceError
from ..http import HttpTransport, AsyncHttpTransport

#: A remote agent runs a full agentic loop, so a blocking send can take a minute+.
DEFAULT_TIMEOUT = 120.0


def agent_card_url(url: str) -> str:
    """Where an agent's card lives: a card URL is used as-is, anything else is the agent base."""
    trimmed = url.strip()
    if trimmed.lower().endswith(".json"):
        return trimmed
    return f"{trimmed.rstrip('/')}/.well-known/agent-card.json"


def text_message(text: str, context_id: Optional[str] = None) -> Dict[str, Any]:
    """A minimal text user Message for ``message/send``."""
    message: Dict[str, Any] = {
        "role": "user",
        "parts": [{"kind": "text", "text": text}],
        "messageId": str(uuid.uuid4()),
        "kind": "message",
    }
    if context_id:
        message["contextId"] = context_id
    return message


def extract_a2a_text(result: Any) -> str:
    """Readable text out of a Task or Message: status message first, then artifacts."""

    def parts_text(parts: Any) -> str:
        if not isinstance(parts, list):
            return ""
        return "\n".join(
            p["text"] for p in parts
            if isinstance(p, dict) and p.get("kind") == "text" and isinstance(p.get("text"), str)
        )

    if isinstance(result, dict):
        if result.get("kind") == "task":
            status = result.get("status") or {}
            from_status = parts_text((status.get("message") or {}).get("parts"))
            if from_status:
                return from_status
            from_artifacts = "\n".join(
                t for t in (parts_text(a.get("parts")) for a in result.get("artifacts") or [] if isinstance(a, dict)) if t
            )
            if from_artifacts:
                return from_artifacts
        if result.get("kind") == "message":
            text = parts_text(result.get("parts"))
            if text:
                return text
    return result if isinstance(result, str) else json.dumps(result)


def _json_rpc_body(message: Dict[str, Any], metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    params: Dict[str, Any] = {"message": message}
    if metadata:
        params["metadata"] = metadata
    return {"jsonrpc": "2.0", "id": str(uuid.uuid4()), "method": "message/send", "params": params}


def _unwrap_json_rpc(body: Any, endpoint: str) -> Any:
    if isinstance(body, dict) and body.get("error"):
        err = body["error"]
        raise ImbraceError(f"A2A agent error {err.get('code')}: {err.get('message')}")
    if isinstance(body, dict) and "result" in body:
        return body["result"]
    raise ImbraceError(f"Invalid JSON-RPC response from {endpoint}: no result or error")


def _unwrap_agents(res: Any) -> List[Dict[str, Any]]:
    if isinstance(res, dict):
        data = res.get("data")
        if isinstance(data, dict) and isinstance(data.get("agents"), list):
            return data["agents"]
        if isinstance(res.get("agents"), list):
            return res["agents"]
    return []


class A2AResource:
    """A2A access to this organization's agents — Sync.

    @param base - ai-agent base URL (``{gateway}/ai-agent``)
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    def list_agents(self) -> List[Dict[str, Any]]:
        """This org's agents, each with the URL a peer needs (``id``, ``name``, ``url``, ``cardUrl``)."""
        return _unwrap_agents(self._http.request("GET", f"{self._base}/a2a/agents").json())

    def get_agent_card(self, assistant_id: str) -> Dict[str, Any]:
        """One agent's Agent Card — its identity, skills and auth scheme."""
        return self._http.request(
            "GET", f"{self._base}/a2a/agents/{assistant_id}/.well-known/agent-card.json"
        ).json()

    def send_message(
        self,
        assistant_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        context_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Run an agent to a final answer and return the raw A2A Task (or Message)."""
        endpoint = f"{self._base}/a2a/agents/{assistant_id}"
        body = self._http.request(
            "POST", endpoint, json=_json_rpc_body(text_message(text, context_id), metadata)
        ).json()
        return _unwrap_json_rpc(body, endpoint)

    def ask(
        self,
        assistant_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        context_id: Optional[str] = None,
    ) -> str:
        """:meth:`send_message`, reduced to the answer text."""
        return extract_a2a_text(self.send_message(assistant_id, text, metadata, context_id))

    def discover(self, url: str, key: Optional[str] = None) -> Dict[str, Any]:
        """Probe a remote agent's card from the platform and report its skills.

        Runs server-side, so it also answers "can the platform reach this agent",
        which a probe from your own machine does not. ``key`` is forwarded to
        that agent only, never stored.
        """
        body: Dict[str, Any] = {"url": url}
        if key:
            body["key"] = key
        res = self._http.request("POST", f"{self._base}/a2a/discover", json=body).json()
        return res.get("data", res) if isinstance(res, dict) else res


class AsyncA2AResource:
    """A2A access to this organization's agents — Async. See :class:`A2AResource`."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        self._base = base.rstrip("/")

    async def list_agents(self) -> List[Dict[str, Any]]:
        """This org's agents, each with the URL a peer needs."""
        res = await self._http.request("GET", f"{self._base}/a2a/agents")
        return _unwrap_agents(res.json())

    async def get_agent_card(self, assistant_id: str) -> Dict[str, Any]:
        """One agent's Agent Card."""
        res = await self._http.request(
            "GET", f"{self._base}/a2a/agents/{assistant_id}/.well-known/agent-card.json"
        )
        return res.json()

    async def send_message(
        self,
        assistant_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        context_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Run an agent to a final answer and return the raw A2A Task (or Message)."""
        endpoint = f"{self._base}/a2a/agents/{assistant_id}"
        res = await self._http.request(
            "POST", endpoint, json=_json_rpc_body(text_message(text, context_id), metadata)
        )
        return _unwrap_json_rpc(res.json(), endpoint)

    async def ask(
        self,
        assistant_id: str,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        context_id: Optional[str] = None,
    ) -> str:
        """:meth:`send_message`, reduced to the answer text."""
        return extract_a2a_text(await self.send_message(assistant_id, text, metadata, context_id))

    async def discover(self, url: str, key: Optional[str] = None) -> Dict[str, Any]:
        """Probe a remote agent's card from the platform and report its skills."""
        body: Dict[str, Any] = {"url": url}
        if key:
            body["key"] = key
        res = await self._http.request("POST", f"{self._base}/a2a/discover", json=body)
        parsed = res.json()
        return parsed.get("data", parsed) if isinstance(parsed, dict) else parsed


class _A2AClientBase:
    """Shared card parsing and header assembly for the standalone clients."""

    def __init__(
        self,
        url: str,
        api_key: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: float = DEFAULT_TIMEOUT,
    ):
        self._url = url
        self._api_key = api_key
        self._extra_headers = headers or {}
        self._timeout = timeout
        self._card: Optional[Dict[str, Any]] = None

    def _auth_headers(self) -> Dict[str, str]:
        # Agents differ on which header they read, so send the key both ways.
        auth: Dict[str, str] = {}
        if self._api_key:
            auth["x-api-key"] = self._api_key
            auth["Authorization"] = f"Bearer {self._api_key}"
        auth.update(self._extra_headers)
        return auth

    def _parse_card(self, res: httpx.Response, target: str) -> Dict[str, Any]:
        if res.status_code >= 400:
            raise ImbraceError(
                f"A2A agent-card fetch failed: HTTP {res.status_code} from {target}. {res.text[:300]}"
            )
        try:
            card = res.json()
        except ValueError:
            raise ImbraceError(f"Non-JSON agent card from {target}: {res.text[:120]}") from None
        if not isinstance(card, dict) or not card.get("name"):
            raise ImbraceError(f'Malformed agent card from {target}: missing "name"')
        self._card = card
        return card

    def _parse_send(self, res: httpx.Response, endpoint: str) -> Dict[str, Any]:
        if res.status_code >= 400:
            raise ImbraceError(
                f"A2A message/send failed: HTTP {res.status_code} from {endpoint}. {res.text[:300]}"
            )
        try:
            body = res.json()
        except ValueError:
            raise ImbraceError(f"Non-JSON JSON-RPC response from {endpoint}: {res.text[:120]}") from None
        return _unwrap_json_rpc(body, endpoint)

    def _endpoint(self, card: Dict[str, Any]) -> str:
        return card.get("url") or self._url.rstrip("/")


class A2AClient(_A2AClientBase):
    """Talk to ANY A2A agent — Sync.

    Independent of :class:`ImbraceClient`: it sends only the key passed here.

    >>> agent = A2AClient("https://cc-a2a.example.com", api_key="secret")
    >>> agent.ask("Review the diff on branch feat/x")
    """

    def get_card(self, refresh: bool = False) -> Dict[str, Any]:
        """Fetch the Agent Card (cached for the life of this client)."""
        if self._card is not None and not refresh:
            return self._card
        target = agent_card_url(self._url)
        with httpx.Client(timeout=self._timeout) as client:
            res = client.get(target, headers={"Accept": "application/json", **self._auth_headers()})
        return self._parse_card(res, target)

    def list_skills(self) -> List[Dict[str, Any]]:
        """The agent's skills, as named on its card."""
        return self.get_card().get("skills") or []

    def send_message(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        context_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send one task and return the raw A2A Task (or Message)."""
        endpoint = self._endpoint(self.get_card())
        with httpx.Client(timeout=self._timeout) as client:
            res = client.post(
                endpoint,
                json=_json_rpc_body(text_message(text, context_id), metadata),
                headers={"Accept": "application/json", **self._auth_headers()},
            )
        return self._parse_send(res, endpoint)

    def ask(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        context_id: Optional[str] = None,
    ) -> str:
        """:meth:`send_message`, reduced to the answer text."""
        return extract_a2a_text(self.send_message(text, metadata, context_id))


class AsyncA2AClient(_A2AClientBase):
    """Talk to ANY A2A agent — Async. See :class:`A2AClient`."""

    async def get_card(self, refresh: bool = False) -> Dict[str, Any]:
        """Fetch the Agent Card (cached for the life of this client)."""
        if self._card is not None and not refresh:
            return self._card
        target = agent_card_url(self._url)
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            res = await client.get(target, headers={"Accept": "application/json", **self._auth_headers()})
        return self._parse_card(res, target)

    async def list_skills(self) -> List[Dict[str, Any]]:
        """The agent's skills, as named on its card."""
        return (await self.get_card()).get("skills") or []

    async def send_message(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        context_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send one task and return the raw A2A Task (or Message)."""
        endpoint = self._endpoint(await self.get_card())
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            res = await client.post(
                endpoint,
                json=_json_rpc_body(text_message(text, context_id), metadata),
                headers={"Accept": "application/json", **self._auth_headers()},
            )
        return self._parse_send(res, endpoint)

    async def ask(
        self,
        text: str,
        metadata: Optional[Dict[str, Any]] = None,
        context_id: Optional[str] = None,
    ) -> str:
        """:meth:`send_message`, reduced to the answer text."""
        return extract_a2a_text(await self.send_message(text, metadata, context_id))
