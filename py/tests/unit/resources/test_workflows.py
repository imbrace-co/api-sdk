import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
BACKEND_V2 = f"{GW}/v2/backend"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_channel_automation(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BACKEND_V2}/workflows/channel_automation", json={"data": []})
    res = client.workflows.list_channel_automation()
    assert isinstance(res["data"], list)


def test_list_channel_automation_with_type(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{BACKEND_V2}/workflows/channel_automation?channelType=whatsapp",
        json={"data": [{"id": "wf_1"}]},
    )
    res = client.workflows.list_channel_automation(channel_type="whatsapp")
    assert res["data"][0]["id"] == "wf_1"
