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
