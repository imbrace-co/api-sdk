import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
PL = f"{GW}/platform"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_organizations(httpx_mock: HTTPXMock, client):
    # With an api_key (no login_acc_ token), list() routes to /_all.
    httpx_mock.add_response(url=f"{PL}/v2/organizations/_all", json={"data": []})
    res = client.organizations.list()
    assert isinstance(res["data"], list)


def test_list_organizations_post_otp(httpx_mock: HTTPXMock):
    # With a login_acc_ token, list() hits the paged /v1 endpoint (the /v2 route
    # rejects login_acc_ with 401 on prod-v2).
    client = ImbraceClient(access_token="login_acc_test_123")
    httpx_mock.add_response(url=f"{PL}/v1/organizations?limit=10&skip=0", json={"data": []})
    res = client.organizations.list()
    assert isinstance(res["data"], list)


def test_list_for_login(httpx_mock: HTTPXMock):
    client = ImbraceClient(access_token="login_acc_test_123")
    httpx_mock.add_response(url=f"{PL}/v1/organizations?limit=5&skip=0", json={"data": [{"_id": "org_1"}]})
    res = client.organizations.list_for_login(limit=5)
    assert res["data"][0]["_id"] == "org_1"



def test_create_organization(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/organizations", method="POST", json={"id": "org_1"})
    res = client.organizations.create({"name": "Acme"})
    assert res["id"] == "org_1"


def test_list_all_organizations(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/organizations/_all", json={"data": []})
    res = client.organizations.list_all()
    assert isinstance(res["data"], list)
