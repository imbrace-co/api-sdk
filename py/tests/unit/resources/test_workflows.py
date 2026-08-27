import json

import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
CHANNEL = f"{GW}/channel-service/v1"
# The ActivePieces-backed routes go to urls.workflow_engine.
AP = f"{GW}/activepieces"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


# ── channel automation ────────────────────────────────────────────────────────

def test_list_channel_automation(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CHANNEL}/workflows/channel_automation", json={"data": []})
    res = client.workflows.list_channel_automation()
    assert isinstance(res["data"], list)


def test_list_channel_automation_with_type(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{CHANNEL}/workflows/channel_automation?channelType=whatsapp",
        json={"data": [{"id": "wf_1"}]},
    )
    res = client.workflows.list_channel_automation(channel_type="whatsapp")
    assert res["data"][0]["id"] == "wf_1"


# ── flows ─────────────────────────────────────────────────────────────────────

def test_list_flows(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AP}/v1/flows?limit=10", json={"data": []})
    res = client.workflows.list_flows()
    assert res == {"data": []}


def test_list_flows_drops_unset_params(httpx_mock: HTTPXMock, client):
    """None-valued params are stripped, so only limit and folderId are sent."""
    httpx_mock.add_response(url=f"{AP}/v1/flows?limit=5&folderId=f_1", json={"data": []})
    client.workflows.list_flows(limit=5, folder_id="f_1")
    q = httpx_mock.get_request().url.params
    assert set(q.keys()) == {"limit", "folderId"}


def test_get_flow(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AP}/v1/flows/fl_1", json={"id": "fl_1"})
    assert client.workflows.get_flow("fl_1")["id"] == "fl_1"


def test_create_flow(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AP}/v1/flows", method="POST", json={"id": "fl_2"})
    res = client.workflows.create_flow("My Flow", "proj_1")
    assert res["id"] == "fl_2"
    assert json.loads(httpx_mock.get_request().content)["displayName"] == "My Flow"


def test_delete_flow(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AP}/v1/flows/fl_1", method="DELETE", json={})
    client.workflows.delete_flow("fl_1")
    assert httpx_mock.get_request().method == "DELETE"


# ── folders / runs / connections ──────────────────────────────────────────────

def test_list_folders(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AP}/v1/folders?limit=10", json={"data": []})
    assert client.workflows.list_folders() == {"data": []}


def test_get_run(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AP}/v1/flow-runs/run_1", json={"id": "run_1"})
    assert client.workflows.get_run("run_1")["id"] == "run_1"


def test_list_pieces(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AP}/v1/pieces?limit=10", json=[{"name": "slack"}])
    res = client.workflows.list_pieces()
    assert res[0]["name"] == "slack"


# ── auth header ───────────────────────────────────────────────────────────────

def test_sends_api_key_header(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CHANNEL}/workflows/channel_automation", json={"data": []})
    client.workflows.list_channel_automation()
    assert httpx_mock.get_request().headers["x-api-key"] == "test_key"
