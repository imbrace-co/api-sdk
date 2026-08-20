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
