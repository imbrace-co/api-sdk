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


# ── team conversation actions ─────────────────────────────────────────────────

V1 = f"{CS}/v1"


def test_update_name(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{V1}/team_conversations/_update_name", method="POST", json={"success": True}
    )
    assert client.conversations.update_name({"id": "c_1", "name": "New"})["success"] is True


def test_get_conversation(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{V1}/conversations/c_1", json={"id": "c_1"})
    assert client.conversations.get_conversation("c_1")["id"] == "c_1"


def test_get_by_conversation_id(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{V1}/team_conversations?conversationId=c_1", json={"data": []}
    )
    client.conversations.get_by_conversation_id("c_1")
    assert httpx_mock.get_request().url.params["conversationId"] == "c_1"


def test_get_outstanding(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{V1}/team_conversations/_outstanding?businessUnitId=bu_1", json={"data": []}
    )
    assert client.conversations.get_outstanding("bu_1") == {"data": []}


def test_get_outstanding_with_pagination(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{V1}/team_conversations/_outstanding?businessUnitId=bu_1&limit=10&skip=5",
        json={"data": []},
    )
    client.conversations.get_outstanding("bu_1", limit=10, skip=5)
    q = httpx_mock.get_request().url.params
    assert q["limit"] == "10" and q["skip"] == "5"


def test_get_invitable_users(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{V1}/team_conversations/tc_1/users", json=[{"id": "u_1"}])
    assert client.conversations.get_invitable_users("tc_1")[0]["id"] == "u_1"


def test_init_video_call(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{V1}/team_conversations/_init_jaas_conference", method="POST", json={"room": "r_1"}
    )
    assert client.conversations.init_video_call({"id": "c_1"})["room"] == "r_1"


def test_join_request(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{V1}/team_conversations/_join_request", method="POST", json={"success": True}
    )
    assert client.conversations.join_request({"id": "c_1"})["success"] is True


def test_assign_team_member(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{V1}/team_conversations/assign_team_member", method="POST", json={"success": True}
    )
    assert client.conversations.assign_team_member({"userId": "u_1"})["success"] is True


def test_remove_team_member(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{V1}/team_conversations/remove_team_member", method="POST", json={"success": True}
    )
    assert client.conversations.remove_team_member({"userId": "u_1"})["success"] is True
