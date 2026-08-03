import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
PL = f"{GW}/platform/v1"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_get_account(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/account", json={"id": "u_1", "email": "a@b.com"})
    res = client.account.get()
    assert res.id == "u_1"


def test_update_account(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/account", method="PUT", json={"id": "u_1", "display_name": "New"})
    res = client.account.update({"display_name": "New"})
    assert res.display_name == "New"
