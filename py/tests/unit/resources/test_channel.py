"""Tests for ChannelResource — channel-service/v1/channels."""
import pytest
from pytest_httpx import HTTPXMock

from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
CH = f"{GW}/channel-service"
CHANNELS = f"{CH}/v1/channels"


@pytest.fixture
def client():
    c = ImbraceClient(api_key="test_key")
    yield c
    c.close()


def test_list_channels(httpx_mock: HTTPXMock, client):
    payload = {
        "success": True,
        "data": [{"id": "ch_1", "name": "Web", "type": "support"}],
        "pagination": {
            "page": 1, "limit": 10, "total": 1, "total_pages": 1, 
            "has_next": False, "has_prev": False
        }
    }
    httpx_mock.add_response(url=CHANNELS, json=payload)
    result = client.channel.list()
    assert len(result.data) == 1
    assert result.data[0].id == "ch_1"


def test_list_channels_with_type(httpx_mock: HTTPXMock, client):
    payload = {
        "success": True,
        "data": [],
        "pagination": {
            "page": 1, "limit": 10, "total": 0, "total_pages": 0, 
            "has_next": False, "has_prev": False
        }
    }
    httpx_mock.add_response(json=payload)
    client.channel.list(type="web")
    req = httpx_mock.get_requests()[0]
    assert "type=web" in str(req.url)


def test_get_channel(httpx_mock: HTTPXMock, client):
    payload = {"id": "ch_1", "name": "Web Channel", "type": "support"}
    httpx_mock.add_response(url=f"{CHANNELS}/ch_1", json=payload)
    result = client.channel.get("ch_1")
    assert result.name == "Web Channel"


def test_get_count(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CHANNELS}/_count", json={"count": 5})
    result = client.channel.get_count()
    assert result["count"] == 5
    req = httpx_mock.get_requests()[0]
    assert req.method == "GET"


def test_get_conv_count(httpx_mock: HTTPXMock, client):
    payload = {"web": 757, "facebook": 46, "all": 975}
    httpx_mock.add_response(url=f"{CHANNELS}/_conv_count?view=all", json=payload)
    result = client.channel.get_conv_count(view="all")
    assert result["all"] == 975


def test_create_web(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CHANNELS}/_web", json={"id": "ch_new", "type": "support"})
    client.channel.create_web("My Widget")
    req = httpx_mock.get_requests()[0]
    assert req.method == "POST"


def test_create_web_v3(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CH}/v3/channels/_web", json={"id": "ch_new", "type": "support"})
    client.channel.create_web_v3("My Widget")
    req = httpx_mock.get_requests()[0]
    assert req.method == "POST"


def test_delete_channel(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CHANNELS}/ch_1", json={"success": True})
    client.channel.delete("ch_1")
    req = httpx_mock.get_requests()[0]
    assert req.method == "DELETE"
