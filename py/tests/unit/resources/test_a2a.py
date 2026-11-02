import json

import pytest
from pytest_httpx import HTTPXMock

from imbrace import A2AClient, ImbraceClient, ImbraceError, agent_card_url, extract_a2a_text

GW = "https://app-gatewayv2.imbrace.co"
AI_AGENT = f"{GW}/ai-agent"
AGENT_ID = "6100fbba-6312-474d-b2f5-e7cf655c3215"
REMOTE = "https://cc-a2a.example.com"

CARD = {
    "protocolVersion": "0.3.0",
    "name": "QA Test Agent",
    "url": f"{AI_AGENT}/a2a/agents/{AGENT_ID}",
    "skills": [{"id": "chat", "name": "General assistance"}],
}


def completed_task(text):
    return {
        "jsonrpc": "2.0",
        "id": "1",
        "result": {
            "id": "task_1",
            "kind": "task",
            "status": {
                "state": "completed",
                "message": {"role": "agent", "kind": "message", "messageId": "m", "parts": [{"kind": "text", "text": text}]},
            },
        },
    }


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_agents_unwraps_envelope(httpx_mock: HTTPXMock, client):
    agents = [{"id": AGENT_ID, "name": "QA Test Agent", "url": "u", "cardUrl": "c"}]
    httpx_mock.add_response(url=f"{AI_AGENT}/a2a/agents", json={"success": True, "data": {"agents": agents}})
    assert client.a2a.list_agents() == agents


def test_get_agent_card(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AI_AGENT}/a2a/agents/{AGENT_ID}/.well-known/agent-card.json", json=CARD)
    assert client.a2a.get_agent_card(AGENT_ID)["name"] == "QA Test Agent"


def test_send_message_posts_json_rpc(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AI_AGENT}/a2a/agents/{AGENT_ID}", json=completed_task("hello"))
    task = client.a2a.send_message(AGENT_ID, "hi there")

    sent = json.loads(httpx_mock.get_requests()[0].content)
    assert sent["jsonrpc"] == "2.0"
    assert sent["method"] == "message/send"
    assert sent["params"]["message"]["parts"] == [{"kind": "text", "text": "hi there"}]
    assert task["kind"] == "task"


def test_ask_returns_text(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AI_AGENT}/a2a/agents/{AGENT_ID}", json=completed_task("A2A OK"))
    assert client.a2a.ask(AGENT_ID, "ping") == "A2A OK"


def test_json_rpc_error_raises(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{AI_AGENT}/a2a/agents/{AGENT_ID}",
        json={"jsonrpc": "2.0", "id": "1", "error": {"code": -32601, "message": "Method not found"}},
    )
    with pytest.raises(ImbraceError):
        client.a2a.send_message(AGENT_ID, "ping")


def test_discover(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AI_AGENT}/a2a/discover", json={"success": True, "data": {"healthy": True}})
    assert client.a2a.discover(REMOTE, "secret")["healthy"] is True
    assert json.loads(httpx_mock.get_requests()[0].content) == {"url": REMOTE, "key": "secret"}


def test_agent_card_url():
    assert agent_card_url("https://a.example.com/agents/x/") == "https://a.example.com/agents/x/.well-known/agent-card.json"
    assert agent_card_url("https://a.example.com/card.json") == "https://a.example.com/card.json"


def test_standalone_client_sends_key_both_ways(httpx_mock: HTTPXMock):
    httpx_mock.add_response(url=f"{REMOTE}/.well-known/agent-card.json", json=CARD)
    httpx_mock.add_response(url=CARD["url"], json=completed_task("from the remote"))

    assert A2AClient(REMOTE, api_key="k1").ask("review this diff") == "from the remote"

    card_req = httpx_mock.get_requests()[0]
    assert card_req.headers["x-api-key"] == "k1"
    assert card_req.headers["authorization"] == "Bearer k1"


def test_standalone_client_sends_no_credential_when_none_given(httpx_mock: HTTPXMock):
    httpx_mock.add_response(url=f"{REMOTE}/.well-known/agent-card.json", json=CARD)
    A2AClient(REMOTE).get_card()
    headers = httpx_mock.get_requests()[0].headers
    assert "x-api-key" not in headers
    assert "authorization" not in headers


def test_standalone_client_rejects_bad_card(httpx_mock: HTTPXMock):
    httpx_mock.add_response(url=f"{REMOTE}/.well-known/agent-card.json", status_code=401, text="nope")
    with pytest.raises(ImbraceError, match="HTTP 401"):
        A2AClient(REMOTE).get_card()


def test_standalone_client_caches_card(httpx_mock: HTTPXMock):
    httpx_mock.add_response(url=f"{REMOTE}/.well-known/agent-card.json", json=CARD)
    agent = A2AClient(REMOTE)
    agent.get_card()
    agent.list_skills()
    assert len(httpx_mock.get_requests()) == 1


def test_extract_text_prefers_status_then_artifacts():
    assert extract_a2a_text(completed_task("primary")["result"]) == "primary"
    assert (
        extract_a2a_text(
            {"kind": "task", "status": {"state": "completed"}, "artifacts": [{"parts": [{"kind": "text", "text": "from artifact"}]}]}
        )
        == "from artifact"
    )
    assert extract_a2a_text({"kind": "message", "parts": [{"kind": "text", "text": "msg"}]}) == "msg"
