import json
import pytest
from pytest_httpx import HTTPXMock
from imbrace import ImbraceClient

GW = "https://app-gatewayv2.imbrace.co"
BASE = f"{GW}/v3/ai"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


# ── listAgents ────────────────────────────────────────────────────────────────

def test_list_agents_returns_all_by_default(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{BASE}/accounts/assistants",
        json=[
            {"_id": "a1", "name": "Receipt"},
            {"_id": "a2", "name": "Chat"},
            {"_id": "a3", "name": "BC Form"},
        ],
    )
    agents = client.document_ai.list_agents()
    assert len(agents) == 3


def test_list_agents_filters_by_name_contains(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{BASE}/accounts/assistants",
        json=[
            {"_id": "a1", "name": "Receipt Extractor"},
            {"_id": "a2", "name": "Chat Bot"},
            {"_id": "a3", "name": "BC Form Mapper"},
        ],
    )
    agents = client.document_ai.list_agents(name_contains="extract")
    assert len(agents) == 1
    assert agents[0]["_id"] == "a1"


def test_list_agents_handles_wrapped_data(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{BASE}/accounts/assistants",
        json={"data": [{"_id": "a1", "name": "X", "agent_type": "document_ai"}]},
    )
    agents = client.document_ai.list_agents()
    assert len(agents) == 1


# ── getAgent ──────────────────────────────────────────────────────────────────

def test_get_agent(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{BASE}/assistants/a1",
        json={"_id": "a1", "name": "Receipt", "agent_type": "document_ai"},
    )
    a = client.document_ai.get_agent("a1")
    assert a["name"] == "Receipt"


# ── createAgent ───────────────────────────────────────────────────────────────

def test_create_agent_posts_with_defaults(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{BASE}/assistant_apps",
        method="POST",
        json={"_id": "new", "name": "X"},
    )
    client.document_ai.create_agent(name="X", instructions="i", model_id="gpt-4o")
    req = httpx_mock.get_request()
    assert req is not None
    body = json.loads(req.content)
    assert body["provider_id"] == "system"
    assert body["workflow_name"] == "document_extraction"
    assert body["name"] == "X"
    assert body["instructions"] == "i"
    assert body["model_id"] == "gpt-4o"


def test_create_agent_renames_schema_to_data_schema(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BASE}/assistant_apps", method="POST", json={})
    client.document_ai.create_agent(
        name="X", instructions="i", model_id="m",
        schema={"invoice_number": {"type": "string"}},
    )
    body = json.loads(httpx_mock.get_request().content)
    assert body["data_schema"] == {"invoice_number": {"type": "string"}}
    assert "schema" not in body


def test_create_agent_respects_custom_provider(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BASE}/assistant_apps", method="POST", json={})
    client.document_ai.create_agent(
        name="X", instructions="i", model_id="m",
        provider_id="custom-uuid", workflow_name="wf",
    )
    body = json.loads(httpx_mock.get_request().content)
    assert body["provider_id"] == "custom-uuid"
    assert body["workflow_name"] == "wf"


# ── updateAgent ───────────────────────────────────────────────────────────────

def test_update_agent_puts(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BASE}/assistant_apps/a1", method="PUT", json={})
    client.document_ai.update_agent("a1", {"name": "renamed"})


def test_update_agent_renames_schema(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BASE}/assistant_apps/a1", method="PUT", json={})
    client.document_ai.update_agent("a1", {"schema": {"x": {"type": "string"}}})
    body = json.loads(httpx_mock.get_request().content)
    assert body["data_schema"] == {"x": {"type": "string"}}
    assert "schema" not in body


# ── deleteAgent ───────────────────────────────────────────────────────────────

def test_delete_agent(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BASE}/assistant_apps/a1", method="DELETE", json={})
    client.document_ai.delete_agent("a1")


# ── process ───────────────────────────────────────────────────────────────────

def test_process_with_explicit_model_name(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{BASE}/document", method="POST",
        json={"success": True, "data": {}},
    )
    res = client.document_ai.process(url="u", organization_id="o", model_name="gpt-4o")
    assert res["success"] is True
    body = json.loads(httpx_mock.get_request().content)
    assert body["modelName"] == "gpt-4o"
    assert body["url"] == "u"
    assert body["organizationId"] == "o"


def test_process_with_agent_id_looks_up_agent(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{BASE}/assistants/a1",
        json={"_id": "a1", "model_id": "claude-3-5", "instructions": "extract X"},
    )
    httpx_mock.add_response(
        url=f"{BASE}/document", method="POST",
        json={"success": True, "data": {"x": 1}},
    )
    res = client.document_ai.process(url="u", organization_id="o", agent_id="a1")
    assert res["success"] is True
    requests = httpx_mock.get_requests()
    process_req = [r for r in requests if r.method == "POST" and r.url.path.endswith("/document")][0]
    body = json.loads(process_req.content)
    assert body["modelName"] == "claude-3-5"
    assert body["additionalInstructions"] == "extract X"


def test_process_explicit_model_overrides_agent(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(
        url=f"{BASE}/assistants/a1",
        json={"_id": "a1", "model_id": "claude", "instructions": "X"},
    )
    httpx_mock.add_response(url=f"{BASE}/document", method="POST", json={"success": True})
    client.document_ai.process(
        url="u", organization_id="o", agent_id="a1", model_name="gpt-4o",
    )
    process_req = [r for r in httpx_mock.get_requests() if r.method == "POST"][0]
    assert json.loads(process_req.content)["modelName"] == "gpt-4o"


def test_process_raises_when_no_model_or_agent(client):
    with pytest.raises(ValueError, match="agent_id or model_name"):
        client.document_ai.process(url="u", organization_id="o")


def test_process_forwards_extra_fields(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BASE}/document", method="POST", json={"success": True})
    client.document_ai.process(
        url="u", organization_id="o", model_name="gpt-4o",
        maxRetries=3, chunkSize=1024,
    )
    body = json.loads(httpx_mock.get_request().content)
    assert body["maxRetries"] == 3
    assert body["chunkSize"] == 1024


# ── suggestSchema ─────────────────────────────────────────────────────────────

def test_suggest_schema_uses_meta_prompt(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BASE}/document", method="POST", json={"success": True})
    client.document_ai.suggest_schema(url="https://x.com/sample.pdf", organization_id="o")
    body = json.loads(httpx_mock.get_request().content)
    assert body["modelName"] == "gpt-4o"
    assert "JSON schema" in body["additionalInstructions"]


def test_suggest_schema_respects_custom_model(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BASE}/document", method="POST", json={})
    client.document_ai.suggest_schema(
        url="u", organization_id="o", model_name="claude-3-5",
    )
    assert json.loads(httpx_mock.get_request().content)["modelName"] == "claude-3-5"


# ── createFull (orchestrator) ─────────────────────────────────────────────────

BACKEND = f"{GW}/v1/backend"
TPL = f"{GW}/v2/backend/templates"


def test_create_full_runs_full_flow(httpx_mock: HTTPXMock, client):
    """Verify create_full posts to /board with type=DocumentAI then /templates/v2/custom."""
    httpx_mock.add_response(
        url=f"{BACKEND}/board", method="POST",
        json={"_id": "brd_xxx", "name": "DEMO", "type": "DocumentAI"},
    )
    httpx_mock.add_response(
        url=f"{TPL}/v2/custom", method="POST",
        json={"data": {
            "_id": "uc_xxx",
            "title": "DEMO",
            "agent_type": "document_ai",
            "channel_id": "ch_xxx",
            "assistant_id": "fa445273-aaaa",
        }},
    )

    result = client.document_ai.create_full(
        name="DEMO",
        instructions="Step 1: Extract Data...",
        schema_fields=[
            {"name": "invoice_number", "type": "ShortText", "is_identifier": True, "data": []},
            {"name": "total_amount", "type": "Number", "data": []},
        ],
        model_id="qwen3.5:27b",
        provider_id="prov-uuid",
        description="Receipt extractor",
        source_languages=["English"],
        handwriting_support=True,
    )

    assert result["board_id"] == "brd_xxx"
    assert result["ai_agent_id"] == "fa445273-aaaa"
    assert result["channel_id"] == "ch_xxx"
    assert result["usecase_id"] == "uc_xxx"

    # Verify board POST body
    requests = httpx_mock.get_requests()
    board_req = [r for r in requests if str(r.url).endswith("/v1/backend/board") and r.method == "POST"][0]
    board_body = json.loads(board_req.content)
    assert board_body["name"] == "DEMO"
    assert board_body["type"] == "DocumentAI"
    assert len(board_body["fields"]) == 2
    assert board_body["fields"][0]["name"] == "invoice_number"

    # Verify templates POST body — assistant.document_ai.board_id linked to created board
    tpl_req = [r for r in requests if r.url.path.endswith("/v2/custom") and r.method == "POST"][0]
    tpl_body = json.loads(tpl_req.content)
    assert tpl_body["usecase"]["title"] == "DEMO"
    assert tpl_body["usecase"]["agent_type"] == "document_ai"
    assert tpl_body["assistant"]["agent_type"] == "document_ai"
    assert tpl_body["assistant"]["workflow_name"] == "document_extraction"
    assert tpl_body["assistant"]["model_id"] == "qwen3.5:27b"
    assert tpl_body["assistant"]["core_task"] == "Step 1: Extract Data..."
    assert tpl_body["assistant"]["document_ai"]["board_id"] == "brd_xxx"
    assert tpl_body["assistant"]["document_ai"]["vlm_model"] == "qwen3.5:27b"  # defaults to model_id
    assert tpl_body["assistant"]["document_ai"]["vlm_provider_id"] == "prov-uuid"
    assert tpl_body["assistant"]["document_ai"]["handwriting_support"] is True


def test_create_full_default_vlm_falls_back_to_model_id(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BACKEND}/board", method="POST", json={"_id": "brd_y"})
    httpx_mock.add_response(url=f"{TPL}/v2/custom", method="POST", json={"data": {}})

    client.document_ai.create_full(
        name="X", instructions="i",
        schema_fields=[{"name": "f", "type": "ShortText"}],
        model_id="gpt-4o", provider_id="p1",
    )
    tpl_req = [r for r in httpx_mock.get_requests() if r.url.path.endswith("/v2/custom")][0]
    body = json.loads(tpl_req.content)
    assert body["assistant"]["document_ai"]["vlm_model"] == "gpt-4o"
    assert body["assistant"]["document_ai"]["vlm_provider_id"] == "p1"
    assert body["assistant"]["document_ai"]["source_languages"] == ["English"]


def test_create_full_extra_ai_agent_overrides(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{BACKEND}/board", method="POST", json={"_id": "brd_z"})
    httpx_mock.add_response(url=f"{TPL}/v2/custom", method="POST", json={"data": {}})

    client.document_ai.create_full(
        name="X", instructions="i",
        schema_fields=[{"name": "f", "type": "ShortText"}],
        model_id="m", provider_id="p",
        extra_ai_agent={
            "workflow_function_call": ["wf_id_1"],
            "metadata": {"max_token_limit": 100},
        },
    )
    tpl_req = [r for r in httpx_mock.get_requests() if r.url.path.endswith("/v2/custom")][0]
    body = json.loads(tpl_req.content)
    assert body["assistant"]["workflow_function_call"] == ["wf_id_1"]
    assert body["assistant"]["metadata"] == {"max_token_limit": 100}


def test_create_full_raises_when_no_deps():
    """Direct construction without boards+templates should raise."""
    from imbrace.resources.document_ai import DocumentAIResource
    from imbrace.http import HttpTransport
    from imbrace.auth.token_manager import TokenManager
    bare = DocumentAIResource(
        HttpTransport(api_key="k", timeout=5, token_manager=TokenManager()),
        f"{GW}/v3/ai",
    )
    with pytest.raises(RuntimeError, match="boards \\+ templates"):
        bare.create_full(
            name="X", instructions="i",
            schema_fields=[], model_id="m", provider_id="p",
        )
