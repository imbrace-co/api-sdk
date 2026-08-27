import json

import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
# MarketplaceResource is wired to urls.marketplaces — the marketplace
# microservice's own router, not the legacy backend.
MP = f"{GW}/marketplaces/v2"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


# ── templates ─────────────────────────────────────────────────────────────────

def test_list_use_case_templates(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/market-places/v2/templates", json={"data": []})
    res = client.marketplace.list_use_case_templates()
    assert res == {"data": []}


def test_install_from_json(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{MP}/market-places/templates/install-from-json",
        method="POST",
        json={"installed": True},
    )
    res = client.marketplace.install_from_json({"template": "t1"})
    assert res["installed"] is True
    assert json.loads(httpx_mock.get_request().content) == {"template": "t1"}


def test_post_channel_workflows(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{MP}/market-places/channel-workflows",
        method="POST",
        json={"id": "cw_1"},
    )
    res = client.marketplace.post_channel_workflows({"channel_id": "ch_1"})
    assert res["id"] == "cw_1"


# ── files ─────────────────────────────────────────────────────────────────────

def test_upload_file(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/files", method="POST", json={"id": "file_1"})
    res = client.marketplace.upload_file({"file": ("a.txt", b"hello")})
    assert res["id"] == "file_1"


def test_delete_file(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/files/file_1", method="DELETE", json={})
    client.marketplace.delete_file("file_1")
    req = httpx_mock.get_request()
    assert req.method == "DELETE"
    assert req.url.path.endswith("/files/file_1")


def test_get_file_details(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{MP}/file-details/file_1", json={"id": "file_1", "size": 12}
    )
    res = client.marketplace.get_file_details("file_1")
    assert res["size"] == 12


def test_download_market_place_file(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/files/short_1", json={"url": "https://x/y"})
    res = client.marketplace.download_market_place_file("short_1")
    assert httpx_mock.get_request().url.path.endswith("/files/short_1")
    assert res is not None


# ── email templates ───────────────────────────────────────────────────────────

def test_list_email_templates(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/email-templates/search", json={"data": []})
    res = client.marketplace.list_email_templates()
    assert res == {"data": []}


def test_create_email_template(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{MP}/email-templates", method="POST", json={"id": "et_1"}
    )
    res = client.marketplace.create_email_template({"name": "Welcome"})
    assert res["id"] == "et_1"
    assert json.loads(httpx_mock.get_request().content)["name"] == "Welcome"


# ── auth header ───────────────────────────────────────────────────────────────

def test_sends_api_key_header(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP}/market-places/v2/templates", json={"data": []})
    client.marketplace.list_use_case_templates()
    assert httpx_mock.get_request().headers["x-api-key"] == "test_key"
