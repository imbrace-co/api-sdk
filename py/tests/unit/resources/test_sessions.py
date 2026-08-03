import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_sessions(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{GW}/session", json={"data": []})
    res = client.sessions.list()
    assert isinstance(res["data"], list)


def test_get_session(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{GW}/session/s_1", json={"id": "s_1"})
    res = client.sessions.get("s_1")
    assert res["id"] == "s_1"


def test_create_session(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{GW}/session", method="POST", json={"id": "s_2"})
    res = client.sessions.create()
    assert res["id"] == "s_2"


def test_delete_session(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{GW}/session/s_1", method="DELETE", json={"success": True})
    res = client.sessions.delete("s_1")
    assert res["success"] is True
