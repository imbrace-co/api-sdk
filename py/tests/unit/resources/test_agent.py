import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
# AgentResource is wired to urls.marketplaces. Agents live under the
# market-places template routes; use cases have their own /use-cases routes.
MP = f"{GW}/marketplaces/v2"
TEMPLATES = f"{MP}/market-places/v2/templates"
USE_CASES = f"{MP}/use-cases"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_agents(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=TEMPLATES, json={"data": []})
    res = client.agent.list_agents()
    assert isinstance(res["data"], list)


def test_get_agent(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{TEMPLATES}/tpl_1", json={"id": "tpl_1"})
    res = client.agent.get("tpl_1")
    assert res["id"] == "tpl_1"


def test_list_use_cases(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=USE_CASES, json={"data": []})
    res = client.agent.list_use_cases()
    assert isinstance(res["data"], list)


def test_get_use_case(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{USE_CASES}/uc_1", json={"id": "uc_1"})
    res = client.agent.get_use_case("uc_1")
    assert res["id"] == "uc_1"


def test_create_use_case(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{USE_CASES}/v2/custom", method="POST", json={"id": "uc_2"})
    res = client.agent.create_use_case({"name": "new"})
    assert res["id"] == "uc_2"


def test_update_agent(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{TEMPLATES}/tpl_1", method="PATCH", json={"id": "tpl_1"})
    res = client.agent.update("tpl_1", {"name": "renamed"})
    assert res["id"] == "tpl_1"


def test_delete_agent(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{TEMPLATES}/tpl_1", method="DELETE", json={})
    client.agent.delete("tpl_1")
    assert httpx_mock.get_request().method == "DELETE"


def test_create_use_case_fills_assistant_defaults(httpx_mock: HTTPXMock, client):
    """The SDK auto-fills provider_id and model_id when the caller omits them."""
    import json
    httpx_mock.add_response(url=f"{USE_CASES}/v2/custom", method="POST", json={"id": "uc_3"})
    client.agent.create_use_case({"usecase": {"title": "T"}, "assistant": {"name": "A"}})
    body = json.loads(httpx_mock.get_request().content)
    assert body["assistant"]["provider_id"] == "system"
    assert body["assistant"]["model_id"] == "gpt-4o"


def test_sends_api_key_header(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=TEMPLATES, json={"data": []})
    client.agent.list_agents()
    assert httpx_mock.get_request().headers["x-api-key"] == "test_key"
