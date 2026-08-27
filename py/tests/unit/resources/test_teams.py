import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
PL = f"{GW}/platform"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_teams(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/teams", json={"data": []})
    res = client.teams.list()
    assert isinstance(res["data"], list)


def test_list_my_teams(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/teams/my", json={"data": []})
    res = client.teams.list_my()
    assert isinstance(res["data"], list)


def test_create_team(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/teams", method="POST", json={"id": "t_1"})
    res = client.teams.create({"name": "Support"})
    assert res["id"] == "t_1"


def test_update_team(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/teams/t_1", method="PUT", json={"id": "t_1", "name": "New"})
    res = client.teams.update("t_1", {"name": "New"})
    assert res["id"] == "t_1"


def test_delete_team(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/teams/t_1", method="DELETE", json={"success": True})
    res = client.teams.delete("t_1")
    assert res["success"] is True


# ── membership actions ────────────────────────────────────────────────────────

def test_get_workflows(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/teams/t_1/workflows", json=[{"id": "wf_1"}])
    assert client.teams.get_workflows("t_1")[0]["id"] == "wf_1"


def test_join(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/teams/_join_team", method="POST", json={"ok": True})
    assert client.teams.join({"team_id": "t_1"})["ok"] is True


def test_leave(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/teams/_leave", method="POST", json={"ok": True})
    assert client.teams.leave({"team_id": "t_1"})["ok"] is True


def test_request_join(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{PL}/v2/teams/t_1/join_request", method="POST", json={"ok": True}
    )
    assert client.teams.request_join("t_1", {"user_id": "u_1"})["ok"] is True


def test_approve_join_request(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{PL}/v2/teams/t_1/user/tu_1/approve", method="POST", json={"ok": True}
    )
    assert client.teams.approve_join_request("t_1", "tu_1")["ok"] is True


def test_update_user_role(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{PL}/v2/teams/t_1/user/tu_1/role", method="PUT", json={"ok": True}
    )
    client.teams.update_user_role("t_1", "tu_1", {"role": "admin"})
    assert httpx_mock.get_request().method == "PUT"
