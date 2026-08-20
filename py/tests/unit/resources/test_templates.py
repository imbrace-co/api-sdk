import json
import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
TPL = f"{GW}/v2/backend/templates"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def test_list_templates(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=TPL,
        json={
            "data": [
                {"_id": "uc_1", "doc_name": "UseCase", "title": "Receipt Extractor", "agent_type": "document_ai"},
                {"_id": "uc_2", "doc_name": "UseCase", "title": "Hospital KB", "agent_type": "rag"},
            ]
        },
    )
    res = client.templates.list()
    assert len(res["data"]) == 2
    assert res["data"][0]["title"] == "Receipt Extractor"


def test_create_custom_posts_full_payload(httpx_mock: HTTPXMock, client):
    """Document AI flow: usecase + assistant nested with document_ai config."""
    httpx_mock.add_response(
        url=f"{TPL}/v2/custom",
        method="POST",
        json={
            "data": {
                "_id": "uc_new",
                "doc_name": "UseCase",
                "title": "DEMO1",
                "type": "custom",
                "agent_type": "document_ai",
                "channel_id": "ch_xxx",
                "assistant_id": "fa445273-c150-4ec5-bbf0-41d5e6f5c0ec",
            }
        },
    )

    usecase = {
        "title": "DEMO1",
        "short_description": "Receipt extractor",
        "demo_url": "https://chat-widget.imbrace.co",
        "agent_type": "document_ai",
    }
    assistant = {
        "name": "DEMO1",
        "mode": "advanced",
        "model_id": "qwen3.5:27b",
        "provider_id": "8cc8769a-uuid",
        "core_task": "Step 1: Extract Data...",
        "agent_type": "document_ai",
        "channel": "web",
        "temperature": 0.1,
        "version": 2,
        "document_ai": {
            "vlm_provider_id": "8cc8769a-uuid",
            "vlm_model": "qwen3.5:27b",
            "source_languages": ["English"],
            "handwriting_support": True,
            "board_id": "brd_xxx",
            "continue_on_failure": False,
            "retry_time": 2,
        },
    }

    res = client.templates.create_custom(usecase=usecase, assistant=assistant)
    assert res["data"]["_id"] == "uc_new"
    assert res["data"]["assistant_id"] == "fa445273-c150-4ec5-bbf0-41d5e6f5c0ec"
    assert res["data"]["channel_id"] == "ch_xxx"

    req = httpx_mock.get_request()
    assert req is not None
    body = json.loads(req.content)
    assert body["usecase"]["title"] == "DEMO1"
    assert body["usecase"]["agent_type"] == "document_ai"
    assert body["assistant"]["model_id"] == "qwen3.5:27b"
    assert body["assistant"]["document_ai"]["board_id"] == "brd_xxx"
    assert body["assistant"]["document_ai"]["source_languages"] == ["English"]


def test_create_custom_routes_to_v2_custom(httpx_mock: HTTPXMock, client):
    """Verify the path is /v2/backend/templates/v2/custom — not /templates/custom."""
    httpx_mock.add_response(url=f"{TPL}/v2/custom", method="POST", json={"data": {}})
    client.templates.create_custom(usecase={"title": "X"}, assistant={"name": "X"})
    req = httpx_mock.get_request()
    assert req is not None
    assert req.url.path == "/v2/backend/templates/v2/custom"
