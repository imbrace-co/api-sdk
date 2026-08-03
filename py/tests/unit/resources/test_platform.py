import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

BASE = "https://app-gatewayv2.imbrace.co"
PL = f"{BASE}/platform"

@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")

def test_list_users(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/users", json={"data": []})
    res = client.platform.list_users()
    assert res == {"data": []}

def test_get_user(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/users/u_123", json={"id": "u_123"})
    res = client.platform.get_user("u_123")
    assert res["id"] == "u_123"

def test_get_me(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/users/me", json={"id": "me"})
    res = client.platform.get_me()
    assert res["id"] == "me"

def test_update_user(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/users/u_123", method="PUT", json={"success": True})
    res = client.platform.update_user("u_123", {"display_name": "New Name"})
    assert res["success"] is True

def test_list_orgs(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/organizations", json={"data": []})
    res = client.platform.list_orgs()
    assert res == {"data": []}

def test_create_org(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/organizations", method="POST", json={"id": "org_1"})
    res = client.platform.create_org({"name": "New Org"})
    assert res["id"] == "org_1"

def test_list_teams(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/teams", json={"data": []})
    res = client.platform.list_teams()
    assert res == {"data": []}

def test_grant_permission(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/users/u_1/permissions", method="POST", json={"id": "p_1"})
    res = client.platform.grant_permission("u_1", "resource", "action")
    assert res["id"] == "p_1"

def test_revoke_permission(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/users/u_1/permissions/p_1", method="DELETE", status_code=204)
    client.platform.revoke_permission("u_1", "p_1")
