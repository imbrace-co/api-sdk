"""Tests for IpsResource — Identity and Profile Service (Automation/Schedulers)."""
import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

def test_list_ap_workflows_develop(httpx_mock: HTTPXMock):
    client = ImbraceClient(env="develop", api_key="test_key")
    ips_url = "https://app-gateway.dev.imbrace.co/ips/v1"
    httpx_mock.add_response(url=f"{ips_url}/ap-workflows/all", json={"data": [{"id": "wf_1"}]})
    
    result = client.ips.list_ap_workflows()
    assert result["data"][0]["id"] == "wf_1"

def test_list_schedulers_stable(httpx_mock: HTTPXMock):
    client = ImbraceClient(env="stable", api_key="test_key")
    # IPS URL on stable is through gateway
    ips_url = "https://app-gatewayv2.imbrace.co/ips/v1"
    httpx_mock.add_response(url=f"{ips_url}/schedulers", json={"data": []})
    
    result = client.ips.list_schedulers()
    assert isinstance(result["data"], list)

def test_delete_scheduler(httpx_mock: HTTPXMock):
    client = ImbraceClient(env="develop", api_key="test_key")
    ips_url = "https://app-gateway.dev.imbrace.co/ips/v1"
    httpx_mock.add_response(url=f"{ips_url}/schedulers/sch_1", method="DELETE", json={"success": True})
    
    result = client.ips.delete_scheduler("sch_1")
    assert result["success"] is True

IPS = "https://app-gatewayv2.imbrace.co/ips/v1"


@pytest.fixture
def client():
    return ImbraceClient(env="stable", api_key="test_key")


def test_get_scheduler_filter_options(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/schedulers/filter_options", json={"data": []})
    assert client.ips.get_scheduler_filter_options() == {"data": []}


def test_list_external_data_sync(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/external-data-sync", json={"data": []})
    assert client.ips.list_external_data_sync() == {"data": []}


def test_enable_external_data_sync(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{IPS}/external-data-sync/enable", method="POST", json={"enabled": True}
    )
    res = client.ips.enable_external_data_sync({"board_id": "b_1"})
    assert res["enabled"] is True


def test_delete_external_data_sync(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{IPS}/external-data-sync/sync_1", method="DELETE", json={"success": True}
    )
    assert client.ips.delete_external_data_sync("sync_1")["success"] is True


def test_sends_api_key_header(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/schedulers", json={"data": []})
    client.ips.list_schedulers()
    assert httpx_mock.get_request().headers["x-api-key"] == "test_key"


# ── profiles ──────────────────────────────────────────────────────────────────

def test_get_profile(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/profiles/u_1", json={"id": "u_1"})
    assert client.ips.get_profile("u_1")["id"] == "u_1"


def test_get_my_profile(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/profiles/me", json={"id": "me"})
    assert client.ips.get_my_profile()["id"] == "me"


def test_update_profile(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/profiles/u_1", method="PATCH", json={"id": "u_1"})
    client.ips.update_profile("u_1", {"display_name": "Ann"})
    assert httpx_mock.get_request().method == "PATCH"


def test_search_profiles_sends_query(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/profiles?q=ann", json={"data": []})
    client.ips.search_profiles("ann")
    assert httpx_mock.get_request().url.params["q"] == "ann"


def test_search_profiles_includes_pagination(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/profiles?q=ann&page=2&limit=50", json={"data": []})
    client.ips.search_profiles("ann", page=2, limit=50)
    q = httpx_mock.get_request().url.params
    assert q["page"] == "2" and q["limit"] == "50"


# ── follow graph ──────────────────────────────────────────────────────────────

def test_follow(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/profiles/u_2/follow", method="POST", json={})
    client.ips.follow("u_2")
    assert httpx_mock.get_request().method == "POST"


def test_unfollow(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/profiles/u_2/follow", method="DELETE", json={})
    client.ips.unfollow("u_2")
    assert httpx_mock.get_request().method == "DELETE"


def test_get_followers(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/profiles/u_1/followers", json={"data": []})
    assert client.ips.get_followers("u_1") == {"data": []}


def test_get_following(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/profiles/u_1/following", json={"data": []})
    assert client.ips.get_following("u_1") == {"data": []}


# ── identities ────────────────────────────────────────────────────────────────

def test_list_identities(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/identities/u_1", json=[{"provider": "google"}])
    assert client.ips.list_identities("u_1")[0]["provider"] == "google"


def test_unlink_identity(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/identities/u_1/google", method="DELETE", json={})
    client.ips.unlink_identity("u_1", "google")
    assert httpx_mock.get_request().url.path.endswith("/identities/u_1/google")


def test_list_workflows(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{IPS}/workflows/all", json=[{"id": "wf_1"}])
    assert client.ips.list_workflows()[0]["id"] == "wf_1"
