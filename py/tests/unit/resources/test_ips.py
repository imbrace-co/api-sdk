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
