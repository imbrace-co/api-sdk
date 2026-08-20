from typing import Any, Dict
from ..http import HttpTransport, AsyncHttpTransport


def _with_defaults(body: Dict[str, Any]) -> Dict[str, Any]:
    """Auto-default empty provider_id/model_id on the assistant block.

    Without these, marketplace creates the assistant but ai-agent later
    returns 500 "Assistant is missing model_id/provider_id configuration"
    on chat. Mirrors the TS SDK behavior.
    """
    asst = dict(body.get("assistant") or {})
    if not asst.get("provider_id"):
        asst["provider_id"] = "system"
    if not asst.get("model_id"):
        asst["model_id"] = "gpt-4o"
    return {**body, "assistant": asst}


class AgentResource:
    """Agent / UseCase templates — Sync.

    Base URL is the marketplace service (`{gateway}/marketplaces/v2`).
    """

    def __init__(self, http: HttpTransport, base: str):
        self._http = http
        root = base.rstrip("/")
        self._templates = f"{root}/market-places/v2/templates"
        self._use_cases = f"{root}/use-cases"

    # ── Marketplace Templates ──────────────────────────────────────────────

    def list(self) -> Dict[str, Any]:
        return self._http.request("GET", self._templates).json()

    def list_agents(self) -> Dict[str, Any]:
        return self.list()

    def get(self, template_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._templates}/{template_id}").json()

    def get_agent(self, agent_id: str) -> Dict[str, Any]:
        return self.get(agent_id)

    def update(self, template_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PATCH", f"{self._templates}/{template_id}", json=body).json()

    def update_agent(self, agent_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self.update(agent_id, body)

    def delete(self, template_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._templates}/{template_id}").json()

    def delete_agent(self, agent_id: str) -> Dict[str, Any]:
        return self.delete(agent_id)

    # ── Use-cases ──────────────────────────────────────────────────────────

    def list_use_cases(self) -> Dict[str, Any]:
        return self._http.request("GET", self._use_cases).json()

    def get_use_case(self, use_case_id: str) -> Dict[str, Any]:
        return self._http.request("GET", f"{self._use_cases}/{use_case_id}").json()

    def create_use_case(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """Create a use-case (atomic — usecase + assistant + workflow + channel).

        Expected body shape: `{"usecase": {"title": ...}, "assistant": {"name": ...}}`.
        SDK auto-fills `assistant.provider_id = "system"` and `assistant.model_id = "gpt-4o"`
        when empty/missing.
        """
        return self._http.request("POST", f"{self._use_cases}/v2/custom", json=_with_defaults(body)).json()

    def update_use_case(self, use_case_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._http.request("PATCH", f"{self._use_cases}/{use_case_id}", json=body).json()

    def delete_use_case(self, use_case_id: str) -> Dict[str, Any]:
        return self._http.request("DELETE", f"{self._use_cases}/{use_case_id}").json()


class AsyncAgentResource:
    """Agent / UseCase templates — Async."""

    def __init__(self, http: AsyncHttpTransport, base: str):
        self._http = http
        root = base.rstrip("/")
        self._templates = f"{root}/market-places/v2/templates"
        self._use_cases = f"{root}/use-cases"

    async def list(self) -> Dict[str, Any]:
        res = await self._http.request("GET", self._templates)
        return res.json()

    async def list_agents(self) -> Dict[str, Any]:
        return await self.list()

    async def get(self, template_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._templates}/{template_id}")
        return res.json()

    async def get_agent(self, agent_id: str) -> Dict[str, Any]:
        return await self.get(agent_id)

    async def update(self, template_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PATCH", f"{self._templates}/{template_id}", json=body)
        return res.json()

    async def update_agent(self, agent_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return await self.update(agent_id, body)

    async def delete(self, template_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._templates}/{template_id}")
        return res.json()

    async def delete_agent(self, agent_id: str) -> Dict[str, Any]:
        return await self.delete(agent_id)

    async def list_use_cases(self) -> Dict[str, Any]:
        res = await self._http.request("GET", self._use_cases)
        return res.json()

    async def get_use_case(self, use_case_id: str) -> Dict[str, Any]:
        res = await self._http.request("GET", f"{self._use_cases}/{use_case_id}")
        return res.json()

    async def create_use_case(self, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("POST", f"{self._use_cases}/v2/custom", json=_with_defaults(body))
        return res.json()

    async def update_use_case(self, use_case_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        res = await self._http.request("PATCH", f"{self._use_cases}/{use_case_id}", json=body)
        return res.json()

    async def delete_use_case(self, use_case_id: str) -> Dict[str, Any]:
        res = await self._http.request("DELETE", f"{self._use_cases}/{use_case_id}")
        return res.json()
