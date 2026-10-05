import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient
from imbrace.exceptions import ImbraceError

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
    httpx_mock.add_response(url=f"{PL}/v1/users/_me", json={"id": "me"})
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
    httpx_mock.add_response(url=f"{PL}/v2/teams?type=business_unit_id&q=bu_1", json={"data": []})
    res = client.platform.list_teams("bu_1")
    assert res == {"data": []}

def test_grant_permission_is_retired(httpx_mock: HTTPXMock, client):
    with pytest.raises(ImbraceError, match="use platform.change_role"):
        client.platform.grant_permission("u_1", "resource", "action")
    assert httpx_mock.get_requests() == []

def test_revoke_permission_is_retired(httpx_mock: HTTPXMock, client):
    with pytest.raises(ImbraceError, match="use platform.change_role"):
        client.platform.revoke_permission("u_1", "p_1")


def test_list_users_includes_search_param(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/users?search=ann", json={"data": []})
    client.platform.list_users({"search": "ann"})
    assert httpx_mock.get_request().url.params["search"] == "ann"


def test_archive_user_is_retired(httpx_mock: HTTPXMock, client):
    with pytest.raises(ImbraceError, match=r"platform\.archive_user\(\) is no longer available: .*Use platform\.deactivate_user\(\) instead\."):
        client.platform.archive_user("u_1")
    assert httpx_mock.get_requests() == []


def test_list_all_orgs(httpx_mock: HTTPXMock, client):
    """The paged /v2/organizations/_all endpoint, distinct from list_orgs."""
    httpx_mock.add_response(url=f"{PL}/v2/organizations/_all", json={"data": []})
    assert client.platform.list_all_orgs() == {"data": []}


def test_list_permissions_is_retired(httpx_mock: HTTPXMock, client):
    with pytest.raises(ImbraceError, match="get_effective_permissions"):
        client.platform.list_permissions("u_1")


def test_sends_api_key_header(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/users", json={"data": []})
    client.platform.list_users()
    assert httpx_mock.get_request().headers["x-api-key"] == "test_key"
