"""Routes moved off the retired backend / IPS / /v2/ai, response-shape fixes, and retired methods.

Mirrors the TS tests added with SDK 1.5.1.
"""
import json

import pytest
from pytest_httpx import HTTPXMock

from imbrace import ImbraceClient, AsyncImbraceClient
from imbrace.exceptions import ImbraceError

GW = "https://app-gatewayv2.imbrace.co"
PL = f"{GW}/platform"
CS = f"{GW}/channel-service/v1"
DB = f"{GW}/data-board"
AA = f"{GW}/ai-agent"


@pytest.fixture
def client():
    return ImbraceClient(api_key="test_key", organization_id="org_1")


def _body(request):
    return json.loads(request.content)


# --- Platform: moved routes -------------------------------------------------

def test_contacts_v2_use_channel_service_and_unwrap(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/contacts/c_1", method="GET", json={"data": {"_id": "c_1"}})
    httpx_mock.add_response(url=f"{CS}/contacts/c_1", method="PUT", json={"data": {"_id": "c_1", "name": "N"}})
    assert client.platform.get_contact_v2("c_1") == {"_id": "c_1"}
    assert client.platform.update_contact_v2("c_1", {"name": "N"})["name"] == "N"


def test_list_credentials_uses_channel_service(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/credentials", json={"data": [{"id": "cr_1"}]})
    assert client.platform.list_credentials() == [{"id": "cr_1"}]


def test_list_processed_credential_types_flattens_groups(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/workflow/processed-credential-types",
                            json={"channel": [{"name": "a"}], "integration": [{"name": "b"}]})
    assert client.platform.list_processed_credential_types() == [{"name": "a"}, {"name": "b"}]


def test_get_credential_type_by_name_uses_credential_param(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/workflow/_credentialParam?type=smtp", json={"name": "smtp"})
    assert client.platform.get_credential_type_by_name("smtp")["name"] == "smtp"


def test_init_channel_uses_channel_service_and_unwraps(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{CS}/init_channel", method="POST", json={"data": {"id": "ch_1", "type": "web"}})
    assert client.platform.init_channel({}) == {"id": "ch_1", "type": "web"}


def test_upload_user_avatar_uses_account_route(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/account/_fileupload", method="POST", json={"url": "u"})
    assert client.platform.upload_user_avatar({"file": ("a.png", b"x")})["url"] == "u"


def test_team_lists_send_type_and_q(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/teams?type=business_unit_id&q=bu_1", json={"data": []})
    httpx_mock.add_response(url=f"{PL}/v1/team_users?type=team_id&q=t_1&limit=10", json={"data": []})
    httpx_mock.add_response(url=f"{PL}/v2/team_users?type=team_id&q=t_1&sort=name", json={"data": []})
    client.platform.list_teams("bu_1")
    client.platform.list_team_users("t_1", limit=10)
    client.platform.list_team_users_v2("t_1", sort="name")


def test_list_team_invites_sends_team_id(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/team_users/_invite_list?type=team_id&team_id=t_1", json={"data": []})
    assert client.platform.list_team_invites("t_1") == {"data": []}


def test_add_and_remove_team_users_bodies(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/teams/_add_users", method="POST", json={"success": True})
    httpx_mock.add_response(url=f"{PL}/v2/teams/_remove_users", method="POST", json={"success": True})
    client.platform.add_team_users({"team_id": "t_1", "user_ids": ["u_1", "u_2"]})
    client.platform.remove_team_users({"team_id": "t_1", "user_ids": ["u_1"]})
    add, remove = httpx_mock.get_requests()
    assert _body(add) == {"team_id": "t_1", "users": [
        {"user_id": "u_1", "role": "member"}, {"user_id": "u_2", "role": "member"}]}
    assert _body(remove) == {"team_id": "t_1", "user_ids": ["u_1"]}


def test_business_units_and_team_labels_return_lists(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/business_units", json={"data": [{"_id": "bu_1"}]})
    httpx_mock.add_response(url=f"{PL}/v1/teams/t_1/team_labels", json={"items": [{"_id": "l_1"}]})
    assert client.platform.list_business_units() == [{"_id": "bu_1"}]
    assert client.platform.get_team_labels("t_1") == [{"_id": "l_1"}]


def test_get_effective_permissions(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v1/roles/_effective?user_id=u_1", json={"role": "admin", "permissions": ["*"]})
    assert client.platform.get_effective_permissions("u_1")["role"] == "admin"


def test_delete_team_tolerates_empty_body(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/teams/t_1", method="DELETE", content=b"")
    httpx_mock.add_response(url=f"{PL}/v2/teams/t_2", method="DELETE", content=b"")
    assert client.platform.delete_team("t_1") == {"success": True}
    assert client.teams.delete("t_2") == {"success": True}


@pytest.mark.parametrize("call,match", [
    (lambda c: c.platform.archive_user("u_1"), "deactivate_user"),
    (lambda c: c.platform.suspend_user("u_1"), "deactivate_user"),
    (lambda c: c.platform.list_permissions("u_1"), "get_effective_permissions"),
    (lambda c: c.platform.grant_permission("u_1", "r", "read"), "change_role"),
    (lambda c: c.platform.revoke_permission("u_1", "p_1"), "change_role"),
    (lambda c: c.platform.get_user_workflows("u_1"), "There is no replacement"),
    (lambda c: c.platform.get_team_workflows("t_1"), "There is no replacement"),
    (lambda c: c.platform.get_credential_types(), "list_processed_credential_types"),
    (lambda c: c.platform.list_knowledge(), "Knowledge Hub"),
    (lambda c: c.platform.upload_knowledge({}), "upload_file"),
    (lambda c: c.platform.list_resources(), "There is no replacement"),
    (lambda c: c.platform.list_rooms(), "There is no replacement"),
    (lambda c: c.platform.list_stores(), "There is no replacement"),
    (lambda c: c.platform.get_facebook_pages(), "client.channel"),
    (lambda c: c.platform.create_mail_channel({}), "client.channel"),
    (lambda c: c.teams.get_workflows("t_1"), "There is no replacement"),
    (lambda c: c.ai_agent.process_embedding("f_1"), "upload_rag_file"),
    (lambda c: c.ai_agent.list_embedding_files(), "list_rag_files"),
    (lambda c: c.ai_agent.classify_file(), "There is no replacement"),
])
def test_retired_methods_raise_without_a_request(httpx_mock: HTTPXMock, client, call, match):
    with pytest.raises(ImbraceError, match=match) as exc:
        call(client)
    assert "() is no longer available: " in str(exc.value)
    assert httpx_mock.get_requests() == []


def test_retired_message_format(client):
    with pytest.raises(ImbraceError) as exc:
        client.platform.archive_user("u_1")
    assert str(exc.value) == (
        "platform.archive_user() is no longer available: its route was removed when the "
        "legacy backend was retired. Use platform.deactivate_user() instead."
    )


# --- Teams -------------------------------------------------------------------

def test_teams_add_users_passes_explicit_roles(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/teams/_add_users", method="POST", json={"success": True})
    client.teams.add_users("t_1", users=[{"user_id": "u_1", "role": "admin"}], reserve_leave=True)
    assert _body(httpx_mock.get_request()) == {
        "team_id": "t_1", "users": [{"user_id": "u_1", "role": "admin"}], "reserve_leave": True}


def test_teams_remove_users_sends_team_id(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{PL}/v2/teams/_remove_users", method="POST", json={"success": True})
    client.teams.remove_users("t_1", ["u_1"])
    assert _body(httpx_mock.get_request()) == {"team_id": "t_1", "user_ids": ["u_1"]}


# --- AI / AI agent ------------------------------------------------------------

def test_list_ai_agents_v2_uses_v3_and_wraps_array(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{GW}/v3/ai/assistants", json=[{"id": "a"}, {"id": "b"}])
    assert client.ai.list_ai_agents_v2() == {"data": [{"id": "a"}, {"id": "b"}], "total": 2}


def test_ai_agent_v2_writes_use_v3(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{GW}/v3/ai/assistants", method="POST", json={"id": "a"})
    httpx_mock.add_response(url=f"{GW}/v3/ai/assistants/a", method="PUT", json={"id": "a"})
    httpx_mock.add_response(url=f"{GW}/v3/ai/assistants/a", method="DELETE", json={})
    httpx_mock.add_response(url=f"{GW}/v3/ai/assistant_apps", method="POST", json={"id": "app"})
    client.ai.create_ai_agent_v2({"name": "A"})
    client.ai.update_ai_agent_v2("a", {"name": "B"})
    client.ai.delete_ai_agent_v2("a")
    client.ai.create_ai_agent_app_v2({"name": "A"})


def test_ai_agent_chats_use_chat_client_store(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AA}/chat-client/chats?organization_id=org_1&limit=5", json={"data": []})
    httpx_mock.add_response(url=f"{AA}/chat-client/chats/c_1", method="GET", json={"id": "c_1"})
    httpx_mock.add_response(url=f"{AA}/chat-client/chats/c_1", method="DELETE", json={"success": True})
    client.ai_agent.list_chats(limit=5)
    assert client.ai_agent.get_chat("c_1", include_messages=True)["id"] == "c_1"
    assert client.ai_agent.delete_chat("c_1")["success"] is True


_SSE_OK = (
    'data: {"type":"start"}\n\n'
    'data: {"type":"text-delta","delta":"Hel"}\n\n'
    'data: {"type":"text-delta","delta":"lo"}\n\n'
    "data: [DONE]\n\n"
)
_SSE_ERR = 'data: {"type":"start"}\n\ndata: {"type":"error","errorText":"Invalid model"}\n\n'


def test_stream_chat_text_yields_deltas(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AA}/v2/chat", method="POST", text=_SSE_OK)
    chunks = list(client.ai_agent.stream_chat_text({"assistant_id": "a", "messages": [], "user_id": "u"}))
    assert chunks == ["Hel", "lo"]


def test_stream_chat_text_raises_on_error_event(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{AA}/v2/chat", method="POST", text=_SSE_ERR)
    with pytest.raises(ImbraceError, match="stream_chat_text: Invalid model"):
        list(client.ai_agent.stream_chat_text({"assistant_id": "a", "messages": [], "user_id": "u"}))


async def test_async_stream_chat_text_raises_on_error_event(httpx_mock: HTTPXMock):
    aclient = AsyncImbraceClient(api_key="test_key", organization_id="org_1")
    httpx_mock.add_response(url=f"{AA}/v2/chat", method="POST", text=_SSE_ERR)
    with pytest.raises(ImbraceError, match="Invalid model"):
        async for _ in aclient.ai_agent.stream_chat_text({"assistant_id": "a", "messages": [], "user_id": "u"}):
            pass
    await aclient.close()


# --- Boards: response unwrapping ----------------------------------------------

def test_boards_unwrap_data(httpx_mock: HTTPXMock, client):
    httpx_mock.add_response(url=f"{DB}/boards/b_1", method="GET", json={"data": {"_id": "b_1"}})
    httpx_mock.add_response(url=f"{DB}/boards/b_1/items/i_1", method="GET", json={"data": {"_id": "i_1"}})
    assert client.boards.get("b_1") == {"_id": "b_1"}
    assert client.boards.get_item("b_1", "i_1") == {"_id": "i_1"}


def test_create_field_returns_the_new_field(httpx_mock: HTTPXMock, client):
    board = {"data": {"_id": "b_1", "fields": [{"id": "f_0", "name": "Amount"}, {"id": "f_1", "name": "Amount"}]}}
    httpx_mock.add_response(url=f"{DB}/boards/b_1/fields", method="POST", json=board)
    assert client.boards.create_field("b_1", {"name": "Amount", "type": "Number"}) == {"id": "f_1", "name": "Amount"}


def test_update_field_returns_the_updated_field(httpx_mock: HTTPXMock, client):
    board = {"_id": "b_1", "fields": [{"_id": "f_0", "name": "A"}, {"_id": "f_1", "name": "B"}]}
    httpx_mock.add_response(url=f"{DB}/boards/b_1/fields/f_1", method="PATCH", json=board)
    assert client.boards.update_field("b_1", "f_1", {"name": "B"}) == {"_id": "f_1", "name": "B"}


async def test_async_create_field_returns_the_new_field(httpx_mock: HTTPXMock):
    aclient = AsyncImbraceClient(api_key="test_key")
    httpx_mock.add_response(url=f"{DB}/boards/b_1/fields", method="POST",
                            json={"data": {"fields": [{"id": "f_1", "name": "X"}]}})
    assert await aclient.boards.create_field("b_1", {"name": "X"}) == {"id": "f_1", "name": "X"}
    await aclient.close()
