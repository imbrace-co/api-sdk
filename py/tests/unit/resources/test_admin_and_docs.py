"""New resources and behaviour from SDK 1.5.2 (mirrors ts/tests/unit/resources/admin-and-docs.test.ts)."""
import json

import pytest
from pytest_httpx import HTTPXMock

from imbrace import ImbraceClient, AsyncImbraceClient
from imbrace.exceptions import ApiError

GW = "https://app-gatewayv2.imbrace.co"
PL = f"{GW}/platform"
DB = f"{GW}/data-board"
AP = f"{GW}/activepieces"
AI = f"{GW}/v3/ai"
MP3 = f"{GW}/v3/marketplaces"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key")


def _body(request):
    return json.loads(request.content)


# --- New resources -------------------------------------------------------------

def test_wires_new_resources(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(json={"data": []}, is_reusable=True)
    client.document_models.list()
    client.document_models.list_categories(type="schema")
    client.crm_automation.list()
    client.api_keys.list()
    client.roles.list()
    client.audit_logs.list({"limit": 5})
    assert [str(r.url) for r in httpx_mock.get_requests()] == [
        f"{DB}/schemas",
        f"{DB}/categories?type=schema",
        f"{DB}/v1/crmboard/organization/board",
        f"{PL}/v1/api_key_token",
        f"{PL}/v1/roles",
        f"{PL}/v1/audit-logs?limit=5",
    ]


def test_crm_list_404_is_an_empty_list(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(status_code=404, json={"message": "CRMBoard not found"})
    assert client.crm_automation.list() == []


def test_api_keys_delete_accepts_404_after_deleting(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(method="DELETE", url=f"{PL}/v1/third_party_token/k1", status_code=404, json={"code": 40004})
    httpx_mock.add_response(method="GET", url=f"{PL}/v1/api_key_token", json=[])
    assert client.api_keys.delete("k1") is None
    assert [f"{r.method} {r.url}" for r in httpx_mock.get_requests()] == [
        f"DELETE {PL}/v1/third_party_token/k1",
        f"GET {PL}/v1/api_key_token",
    ]


def test_api_keys_delete_fails_when_key_still_listed(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(method="DELETE", url=f"{PL}/v1/third_party_token/k1", status_code=404, json={})
    httpx_mock.add_response(method="GET", url=f"{PL}/v1/api_key_token", json=[{"_id": "k1"}])
    with pytest.raises(ApiError, match=r"\[404\]"):
        client.api_keys.delete("k1")


async def test_async_api_keys_delete_accepts_404(httpx_mock: HTTPXMock):
    aclient = AsyncImbraceClient(api_key="test_key")
    httpx_mock.add_response(method="DELETE", url=f"{PL}/v1/third_party_token/k1", status_code=404, json={})
    httpx_mock.add_response(method="GET", url=f"{PL}/v1/api_key_token", json=[])
    assert await aclient.api_keys.delete("k1") is None
    await aclient.close()


def test_api_keys_create_unwraps_api_key(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(method="POST", url=f"{PL}/v1/third_party_token", json={"apiKey": {"_id": "k1", "token": "t"}})
    assert client.api_keys.create({"name": "ci"}) == {"_id": "k1", "token": "t"}


def test_document_models_update_attribute_returns_the_attribute(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(method="PUT", url=f"{DB}/schemas/s1/attributes/a1",
                            json={"data": {"id": "a1", "name": "Total", "type": "Number"}})
    assert client.document_models.update_attribute("s1", "a1", {"type": "Number"}) == {
        "id": "a1", "name": "Total", "type": "Number"}


def test_document_models_delete_tolerates_204(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(method="DELETE", url=f"{DB}/schemas/s1", status_code=204)
    assert client.document_models.delete("s1") is None


def test_roles_assign_many_and_audit_summary(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(method="POST", url=f"{PL}/v1/users/_bulk_change_role", json={"success": True})
    httpx_mock.add_response(method="GET", url=f"{PL}/v1/audit-logs/summary?from=2026-01-01", json={"data": {"total": 3}})
    client.roles.assign_many(["u1", "u2"], "agent")
    assert _body(httpx_mock.get_requests()[0]) == {"user_ids": ["u1", "u2"], "role": "agent"}
    assert client.audit_logs.summary({"from": "2026-01-01"}) == {"total": 3}


# --- Knowledge hub ---------------------------------------------------------------

def test_create_folder_maps_parent_id_and_fills_org(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(method="GET", url=f"{PL}/v1/account", json={"organization_id": "org_1"})
    httpx_mock.add_response(method="POST", url=f"{DB}/folders", status_code=201, json={"data": {"_id": "f2"}})
    assert client.boards.create_folder({"name": "child", "parent_id": "f1"}) == {"_id": "f2"}
    post = httpx_mock.get_requests()[-1]
    assert _body(post) == {"name": "child", "source_type": "upload", "parent_folder_id": "f1", "organization_id": "org_1"}


def test_create_folder_uses_client_org_without_lookup(httpx_mock: HTTPXMock):
    c = ImbraceClient(api_key="test_key", organization_id="org_9")
    httpx_mock.add_response(method="POST", url=f"{DB}/folders", json={"data": {"_id": "f3"}})
    c.boards.create_folder({"name": "top"})
    assert _body(httpx_mock.get_request()) == {
        "name": "top", "source_type": "upload", "parent_folder_id": "root", "organization_id": "org_9"}


def test_folders_resource_create_applies_same_fixes(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(method="GET", url=f"{PL}/v1/account", json={"data": {"organization_id": "org_2"}})
    httpx_mock.add_response(method="POST", url=f"{DB}/folders", json={"data": {"_id": "f4"}})
    client.folders.create({"name": "x", "parent_id": "p1"})
    assert _body(httpx_mock.get_requests()[-1]) == {
        "name": "x", "source_type": "upload", "parent_folder_id": "p1", "organization_id": "org_2"}


def test_drive_session_status_before_sign_in(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(status_code=404, json={"message": "Session not found"})
    assert client.boards.get_drive_session_status("google-drive", "s1") == {"connected": False, "session_id": "s1"}


def test_drive_calls_unwrap_and_initiate_sends_org(httpx_mock: HTTPXMock):
    c = ImbraceClient(api_key="test_key", organization_id="org_1")
    httpx_mock.add_response(url=f"{DB}/providers", json={"data": [{"provider": "google-drive", "configured": True}]})
    httpx_mock.add_response(url=f"{DB}/auth/google-drive/initiate?organizationId=org_1",
                            json={"data": {"auth_url": "https://x", "session_id": "s1"}})
    httpx_mock.add_response(url=f"{DB}/google-drive/folders?sessionId=s1", json={"data": [{"id": "d1"}]})
    httpx_mock.add_response(url=f"{DB}/google-drive/sync/status", json={"data": {"running": False}})
    assert c.boards.list_drive_providers() == [{"provider": "google-drive", "configured": True}]
    assert c.boards.initiate_drive_auth("google-drive")["session_id"] == "s1"
    assert c.boards.list_drive_folders("google-drive", {"sessionId": "s1"}) == [{"id": "d1"}]
    assert c.boards.get_drive_sync_status("google-drive") == {"running": False}


def test_list_folders_and_set_folder_sync(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/folders?ignore_assistant=true", json={"data": [{"_id": "f1"}]})
    httpx_mock.add_response(method="PATCH", url=f"{DB}/folders/f1/sync", json={"data": {"_id": "f1", "is_sync_enabled": True}})
    assert client.boards.list_folders(ignore_assistant=True) == [{"_id": "f1"}]
    assert client.boards.set_folder_sync("f1", True)["is_sync_enabled"] is True
    assert _body(httpx_mock.get_requests()[-1]) == {"is_sync_enabled": True}


# --- Orchestrator / tool servers -------------------------------------------------

_CURRENT = {"id": "a1", "name": "Lead", "workflow_name": "lead_wf", "agent_type": "team_lead",
            "sub_agents": [{"assistant_id": "s1", "name": "Sub"}], "metadata": {"color": "red"}}


def test_update_ai_agent_resends_core_fields(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(json=_CURRENT, is_reusable=True)
    client.chat_ai.update_ai_agent("a1", {"description": "new"})
    put = next(r for r in httpx_mock.get_requests() if r.method == "PUT")
    assert str(put.url) == f"{AI}/assistant_apps/a1"
    assert _body(put) == {"name": "Lead", "workflow_name": "lead_wf", "agent_type": "team_lead",
                          "sub_agents": ["s1"], "description": "new"}


def test_create_orchestrator_marks_team_lead(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(json={"id": "a1"})
    client.chat_ai.create_orchestrator({"name": "Lead", "workflow_name": "lead_wf", "sub_agents": ["s1"]})
    body = _body(httpx_mock.get_request())
    assert body["agent_type"] == "team_lead"
    assert body["sub_agents"] == ["s1"]
    assert (body["provider_id"], body["model_id"]) == ("default", "Default")


def test_set_sub_agents_uses_partial_assistant_update(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(json=_CURRENT, is_reusable=True)
    client.chat_ai.set_sub_agents("a1", ["s2"])
    put = next(r for r in httpx_mock.get_requests() if r.method == "PUT")
    assert str(put.url) == f"{AI}/assistants/a1"
    assert _body(put) == {"name": "Lead", "agent_type": "team_lead", "sub_agents": ["s2"]}


def test_tool_servers_merge_metadata(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(json=_CURRENT, is_reusable=True)
    servers = [{"enabled": True, "url": "https://mcp/sse", "type": "mcp"}]
    client.chat_ai.set_tool_servers("a1", servers)
    put = next(r for r in httpx_mock.get_requests() if r.method == "PUT")
    assert _body(put)["metadata"] == {"color": "red", "tool_servers": servers}


def test_list_tool_servers_falls_back_to_single_server(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(json={"id": "a1", "metadata": {"tool_server": {"url": "u"}}})
    assert client.chat_ai.list_tool_servers("a1") == [{"url": "u"}]


async def test_async_update_ai_agent_resends_core_fields(httpx_mock: HTTPXMock):
    aclient = AsyncImbraceClient(api_key="test_key")
    httpx_mock.add_response(json=_CURRENT, is_reusable=True)
    await aclient.chat_ai.update_ai_agent("a1", {"description": "new"})
    put = next(r for r in httpx_mock.get_requests() if r.method == "PUT")
    assert _body(put)["sub_agents"] == ["s1"]
    await aclient.close()


# --- Workflows MCP / schedule -------------------------------------------------------

def test_mcp_resolves_project_and_updates_with_post(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AP}/v1/users/projects/current", json={"id": "p1"})
    httpx_mock.add_response(method="POST", url=f"{AP}/v1/mcp-servers", json={"id": "m1"})
    httpx_mock.add_response(method="POST", url=f"{AP}/v1/mcp-servers/m1", json={"id": "m1"})
    client.workflows.create_mcp_server({"name": "tools"})
    client.workflows.update_mcp_server("m1", {"name": "tools2"})
    reqs = httpx_mock.get_requests()
    assert [f"{r.method} {r.url}" for r in reqs] == [
        f"GET {AP}/v1/users/projects/current",
        f"POST {AP}/v1/mcp-servers",
        f"POST {AP}/v1/mcp-servers/m1",
    ]
    assert _body(reqs[1]) == {"name": "tools", "projectId": "p1"}


def test_resolve_project_id_falls_back_to_first_flow(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AP}/v1/users/projects/current", status_code=404, json={})
    httpx_mock.add_response(url=f"{AP}/v1/flows?limit=1", json={"data": [{"projectId": "p9"}]})
    assert client.workflows.resolve_project_id() == "p9"


async def test_async_create_mcp_server_fills_project(httpx_mock: HTTPXMock):
    aclient = AsyncImbraceClient(api_key="test_key")
    httpx_mock.add_response(url=f"{AP}/v1/users/projects/current", json={"id": "p1"})
    httpx_mock.add_response(method="POST", url=f"{AP}/v1/mcp-servers", json={"id": "m1"})
    await aclient.workflows.create_mcp_server({"name": "tools"})
    assert _body(httpx_mock.get_requests()[-1]) == {"name": "tools", "projectId": "p1"}
    await aclient.close()


def test_schedule_get_create_update(httpx_mock: HTTPXMock, client):
    base = f"{DB}/v1/schedulers"
    httpx_mock.add_response(method="GET", url=f"{base}/sc1", json={"_id": "sc1"})
    httpx_mock.add_response(method="POST", url=base, json={"_id": "sc2"})
    httpx_mock.add_response(method="PUT", url=f"{base}/sc2", json={"_id": "sc2"})
    body = {"name": "n", "event_type": "e", "job": {"type": "webhook", "url": "https://x"}}
    assert client.schedule.get("sc1")["_id"] == "sc1"
    assert client.schedule.create(body)["_id"] == "sc2"
    assert client.schedule.update("sc2", body)["_id"] == "sc2"


# --- Contacts / marketplace ---------------------------------------------------------

def test_contacts_create_and_delete(httpx_mock: HTTPXMock, client):
    cs = f"{GW}/channel-service/v1/contacts"
    httpx_mock.add_response(method="POST", url=cs, json={"_id": "c1"})
    httpx_mock.add_response(method="DELETE", url=f"{cs}/c1", json={"message": "deleted"})
    assert client.contacts.create({"display_name": "Ann"})["_id"] == "c1"
    assert client.contacts.delete("c1")["message"] == "deleted"


def test_marketplace_v3_apps(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{MP3}/apps/catalog", json={"data": [{"app_key": "crm"}]})
    httpx_mock.add_response(method="POST", url=f"{MP3}/apps/install", json={"data": {"install": {"id": "i1"}}})
    httpx_mock.add_response(method="DELETE", url=f"{MP3}/apps/installs/i1", json={"data": {"id": "i1"}})
    httpx_mock.add_response(method="POST", url=f"{MP3}/market-places/v2/templates/_install_team_defaults",
                            json={"data": {"installed": [], "skipped": [], "failed": []}})
    assert client.marketplace.list_app_catalog() == [{"app_key": "crm"}]
    assert client.marketplace.install_app({"app_key": "crm"})["install"]["id"] == "i1"
    assert client.marketplace.uninstall_app("i1") == {"id": "i1"}
    assert client.marketplace.install_team_defaults({"teams": []})["installed"] == []
