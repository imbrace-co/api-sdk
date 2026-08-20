import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
CS = f"{GW}/channel-service"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_conversations(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v1/conversations", json={"data": []})
    res = client.conversations.list()
    assert isinstance(res["data"], list)


def test_list_conversations_with_params(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v2/team_conversations?type=open&limit=10", json={"data": []})
    res = client.conversations.list(type="open", limit=10)
    assert isinstance(res["data"], list)


def test_get_conversation(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v1/team_conversations/conv_1", json={"id": "conv_1"})
    res = client.conversations.get("conv_1")
    assert res["id"] == "conv_1"


def test_create_conversation(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v1/conversations", method="POST", json={"id": "conv_2"})
    res = client.conversations.create()
    assert res["id"] == "conv_2"


def test_join_conversation(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/v1/team_conversations/_join", method="POST", json={"success": True})
    res = client.conversations.join({"conversation_id": "conv_1"})
    assert res["success"] is True
