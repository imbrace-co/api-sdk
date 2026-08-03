import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
BACKEND = f"{GW}/v2/backend"
TP = f"{BACKEND}/templates"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_agents(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=TP, json={"data": []})
    res = client.agent.list_agents()
    assert isinstance(res["data"], list)


def test_get_agent(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{TP}/tpl_1", json={"id": "tpl_1"})
    res = client.agent.get("tpl_1")
    assert res["id"] == "tpl_1"


def test_list_use_cases(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=TP, json={"data": []})
    res = client.agent.list_use_cases()
    assert isinstance(res["data"], list)


def test_get_use_case(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{TP}/uc_1", json={"id": "uc_1"})
    res = client.agent.get_use_case("uc_1")
    assert res["id"] == "uc_1"


def test_create_use_case(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{TP}/v2/custom", method="POST", json={"id": "uc_2"})
    res = client.agent.create_use_case({"name": "new"})
    assert res["id"] == "uc_2"
