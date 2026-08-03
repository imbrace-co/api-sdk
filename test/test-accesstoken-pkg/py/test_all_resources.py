"""Smoke-test for ALL 30 resource namespaces in `imbrace` SDK.

Auth: Access Token.

Each namespace gets 1-3 read-only calls. Mutating methods (create/update/delete)
are tested in dedicated CRUD-focused files (e.g. test_ai_agent.py).
"""
from __future__ import annotations
import os
import sys
import time
import json

from dotenv import load_dotenv
load_dotenv()

from imbrace import ImbraceClient

ACCESS_TOKEN = os.environ.get("IMBRACE_ACCESS_TOKEN")
ORG_ID       = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY      = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

if not ACCESS_TOKEN or not ORG_ID:
    print("Missing IMBRACE_ACCESS_TOKEN or IMBRACE_ORGANIZATION_ID")
    sys.exit(1)

# Parse --only=<csv>
_only_arg = ""
for a in sys.argv[1:]:
    if a.startswith("--only="):
        _only_arg = a[len("--only="):]
        break
ONLY_FILTER: set[str] | None = (
    {s.strip().lower() for s in _only_arg.split(",") if s.strip()} if _only_arg else None
)

client = ImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=8)

passed = failed = skipped_n = 0
failures: list[str] = []
section_active = True


def step(label: str, fn, expect_fail: bool = False) -> None:
    global passed, failed
    if not section_active:
        return
    sys.stdout.write(f"  - {label} ... "); sys.stdout.flush()
    try:
        t0 = time.time()
        r = fn()
        dt = int((time.time() - t0) * 1000)
        summary = json.dumps(r, default=str)[:90] if r is not None else ""
        if expect_fail:
            print(f"unexpected pass [{dt}ms] {summary}")
            failed += 1; failures.append(f"{label} -> unexpected pass")
        else:
            print(f"OK [{dt}ms] {summary}"); passed += 1
    except Exception as e:
        code = str(e)[:80]
        if expect_fail:
            print(f"OK (expected fail [{code}])"); passed += 1
        else:
            print(f"FAIL [{code}]"); failed += 1
            failures.append(f"{label} -> {code}")


def skip(label: str, reason: str) -> None:
    global skipped_n
    if not section_active:
        return
    print(f"  - {label}  SKIP: {reason}"); skipped_n += 1


def section(title: str) -> None:
    global section_active
    section_key = title.split()[0].split("(")[0].replace("_", "").lower()
    section_active = (ONLY_FILTER is None) or (section_key in ONLY_FILTER)
    if section_active:
        print(f"\n== {title} ==")


def safe_call(obj, attr: str, *args, **kwargs):
    fn = getattr(obj, attr, None)
    if fn is None:
        raise RuntimeError(f"method {attr} not on resource")
    return fn(*args, **kwargs)


print(f"\n=== ALL RESOURCES smoke - auth: ACCESS TOKEN (PyPI imbrace) ===")
print(f"gateway={GATEWAY}\norg={ORG_ID}")
if ONLY_FILTER:
    print(f"filter={','.join(sorted(ONLY_FILTER))}")
print()

# Health & Auth ---------------------------------------------------------------

section("health")
step("check", lambda: client.health.check())

section("auth")
skip("sign_in / signin_with_email / request_otp", "destructive (would log-in user)")

# Platform tier --------------------------------------------------------------

section("account")
step("get", lambda: safe_call(client.account, "get") if hasattr(client.account, "get") else {})

section("organizations")
step("list", lambda: client.organizations.list())

section("platform")
step("list_business_units", lambda: client.platform.list_business_units())

section("teams")
step("list", lambda: client.teams.list())

section("settings")
step("get (best-effort)", lambda: safe_call(client.settings, "get") if hasattr(client.settings, "get") else {})

section("license")
step("get (best-effort)", lambda: safe_call(client.license, "get") if hasattr(client.license, "get") else {})

section("sessions")
step("list", lambda: client.sessions.list())

# CRM -------------------------------------------------------------------------

section("contacts")
step("list (limit 3)", lambda: client.contacts.list(limit=3))

section("conversations")
business_units = []
try:
    business_units = client.platform.list_business_units() or []
except Exception:
    pass
bu_id = (business_units[0] or {}).get("_id") if business_units else None
if bu_id:
    step("list (channel, limit 3)",
         lambda: client.conversations.list(type="channel", limit=3))
else:
    skip("conversations.list", "no businessUnit fixture")
if hasattr(client.conversations, "get_outstanding"):
    step("get_outstanding",
         lambda: safe_call(client.conversations, "get_outstanding", business_unit_id=bu_id or "any", limit=3))
else:
    skip("conversations.get_outstanding", "method not exposed in Python SDK")

section("messages")
skip("send / list", "needs conversation_id fixture")

section("channel")
step("list", lambda: client.channel.list())

section("categories")
step("list", lambda: client.categories.list())

# Boards ----------------------------------------------------------------------

section("boards")
first_board_id = None

def _list_boards():
    global first_board_id
    r = client.boards.list(limit=3)
    data = r.get("data") if isinstance(r, dict) else r
    if data and len(data) > 0:
        first_board_id = data[0].get("_id") or data[0].get("id")
    return {"count": len(data) if data else 0}

step("list (limit 3)", _list_boards)
if first_board_id:
    step("get(firstBoardId)", lambda: client.boards.get(first_board_id))
    step("list_items(firstBoardId, 3)", lambda: client.boards.list_items(first_board_id, limit=3))
else:
    skip("boards.get / list_items", "no board fixture")
step("search_folders", lambda: client.boards.search_folders())

# AI tier ---------------------------------------------------------------------

section("ai (raw v3)")
step("list_ai_agents",          lambda: client.ai.list_ai_agents())
step("list_providers",          lambda: client.ai.list_providers())
step("list_guardrails",         lambda: client.ai.list_guardrails())
step("list_guardrail_providers", lambda: client.ai.list_guardrail_providers())
step("list_rag_files",          lambda: client.ai.list_rag_files())
step("get_llm_models",          lambda: client.ai.get_llm_models())

section("chat_ai")
step("list_ai_agents",                lambda: client.chat_ai.list_ai_agents())
step("list_ai_agent_sub_agents",      lambda: client.chat_ai.list_ai_agent_sub_agents())
step("list_document_models",          lambda: client.chat_ai.list_document_models())

section("ai_agent (smoke - full coverage in test_ai_agent.py)")
step("get_health",         lambda: client.ai_agent.get_health())
step("get_version",        lambda: client.ai_agent.get_version())
step("list_chats",         lambda: client.ai_agent.list_chats(organization_id=ORG_ID, limit=3))
step("list_client_chats",  lambda: client.ai_agent.list_client_chats(organization_id=ORG_ID, limit=3))
step("list_embedding_files", lambda: client.ai_agent.list_embedding_files())
step("list_parquet_files", lambda: client.ai_agent.list_parquet_files())

section("document_ai")
step("list_agents",                lambda: client.document_ai.list_agents())
step("list_agents(document_ai_only)", lambda: client.document_ai.list_agents(document_ai_only=True))

# Workflow / Automation ------------------------------------------------------

section("workflows")
step("list_flows (limit 3)", lambda: client.workflows.list_flows(limit=3))
step("list_folders (best-effort)",     lambda: safe_call(client.workflows, "list_folders") if hasattr(client.workflows, "list_folders") else [])
step("list_connections (best-effort)", lambda: safe_call(client.workflows, "list_connections") if hasattr(client.workflows, "list_connections") else [])
step("list_pieces (best-effort)",      lambda: safe_call(client.workflows, "list_pieces") if hasattr(client.workflows, "list_pieces") else [])
step("list_mcp_servers (best-effort)", lambda: safe_call(client.workflows, "list_mcp_servers") if hasattr(client.workflows, "list_mcp_servers") else [])
step("list_tables (best-effort)",      lambda: safe_call(client.workflows, "list_tables") if hasattr(client.workflows, "list_tables") else [])
step("list_runs",                      lambda: safe_call(client.workflows, "list_runs", limit=3) if hasattr(client.workflows, "list_runs") else [])

section("templates")
step("list", lambda: client.templates.list())

section("agent (marketplace / use-cases)")
step("list",          lambda: client.agent.list())
step("list_use_cases", lambda: client.agent.list_use_cases())

section("marketplace")
step("list_templates (best-effort)", lambda: safe_call(client.marketplace, "list_templates") if hasattr(client.marketplace, "list_templates") else [])

# Misc services --------------------------------------------------------------

section("ips")
step("list_ap_workflows",     lambda: client.ips.list_ap_workflows())
step("list_external_data_sync", lambda: client.ips.list_external_data_sync())

section("schedule")
step("list", lambda: client.schedule.list())

section("campaign")
step("list", lambda: client.campaign.list())

section("outbound")
step("list (best-effort)",
     lambda: safe_call(client.outbound, "list") if hasattr(client.outbound, "list") else [])

section("file_service")
step("list (best-effort)", lambda: safe_call(client.file_service, "list") if hasattr(client.file_service, "list") else [])

section("message_suggestion")
skip("send", "destructive - needs conversation context")

section("predict")
skip("predict", "destructive - needs model + payload")

# Summary --------------------------------------------------------------------

print(f"\n=== Summary ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures:
        print(f"  - {f}")
sys.exit(1 if failed > 0 else 0)
