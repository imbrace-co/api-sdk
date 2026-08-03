"""Tests for AiResource — AI completion and streaming."""
import json
import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient
from imbrace.types.ai import CompletionInput, EmbeddingInput

GW = "https://app-gatewayv2.imbrace.co"
AI = f"{GW}/v3/ai"

@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")

def test_complete(httpx_mock: HTTPXMock, client):
    payload = {
        "id": "chat_123",
        "model": "gpt-4o",
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": "Hello!"},
                "finish_reason": "stop"
            }
        ],
        "usage": {"prompt_tokens": 10, "completion_tokens": 5, "total_tokens": 15}
    }
    httpx_mock.add_response(url=f"{AI}/completions", method="POST", json=payload)
    
    result = client.ai.complete(CompletionInput(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Hi"}]
    ))
    assert result.choices[0].message.content == "Hello!"

def test_embed(httpx_mock: HTTPXMock, client):
    payload = {
        "model": "text-embedding-3-small",
        "data": [{"index": 0, "embedding": [0.1, 0.2], "object": "embedding"}]
    }
    httpx_mock.add_response(url=f"{AI}/embeddings", method="POST", json=payload)

    result = client.ai.embed(EmbeddingInput(model="text-embedding-3-small", input=["hello"]))
    assert result.data[0].embedding == [0.1, 0.2]


def test_list_providers_returns_raw_array(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{AI}/providers",
        json=[
            {
                "_id": "p1", "name": "test", "type": "vllm",
                "config": {"vllm": {"host": "http://x"}},
                "source": "custom", "is_shown": True,
                "models": [
                    {"name": "qwen3.5-27b", "provider": "vllm", "is_vision_available": False},
                ],
                "provider_id": "p1-uuid",
                "organization_id": "org_x",
            },
        ],
    )
    res = client.ai.list_providers(include_system=False)
    assert isinstance(res, list)
    assert len(res) == 1
    assert res[0]["name"] == "test"
    assert res[0]["models"][0]["name"] == "qwen3.5-27b"


def test_list_providers_includes_system_by_default(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AI}/providers", json=[
        {"_id": "p1", "name": "test", "type": "vllm", "models": [{"name": "qwen"}]},
    ])
    httpx_mock.add_response(
        url=f"{AI}/workflow-agent/models",
        json={"success": True, "data": [{"name": "Default", "is_toolCall_available": True}]},
    )
    res = client.ai.list_providers()
    assert len(res) == 2
    # System provider prepended
    assert res[0]["provider_id"] == "system"
    assert res[0]["name"] == "System Default"
    assert res[1]["name"] == "test"


def test_get_llm_models_returns_wrapped_data(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{AI}/workflow-agent/models",
        json={
            "success": True,
            "message": "Models retrieved successfully",
            "data": [
                {"name": "Default", "is_toolCall_available": True, "is_vision_available": True},
            ],
        },
    )
    res = client.ai.get_llm_models()
    assert res["success"] is True
    assert len(res["data"]) == 1
    assert res["data"][0]["name"] == "Default"
    assert res["data"][0]["is_vision_available"] is True
