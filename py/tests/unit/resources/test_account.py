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


def test_upload_avatar(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/account/_fileupload", method="POST", json={"url": "u"})
    assert client.account.upload_avatar({"file": ("a.png", b"x")})["url"] == "u"


def test_get_account_alias(httpx_mock: HTTPXMock, client):
    """get_account mirrors the TypeScript name and delegates to get()."""
    httpx_mock.add_response(url=f"{PL}/account", json={"id": "u_1", "email": "a@b.co"})
    assert client.account.get_account().id == "u_1"
