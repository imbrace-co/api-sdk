"""Mirrors every snippet in website/public/sdk/full-flow-guide.md against
the published `imbrace==1.0.4` (PyPI), authenticated via API key.

Each `step(...)` call corresponds to one snippet block in the doc. Lines
flagged via `note(...)` indicate the doc shows the wrong API surface; we
call the real SDK 1.0.4 surface and record the mismatch.

Sections follow the doc:
  1. Assistant + stream_chat
  2. Workflow create + publish + trigger + bind  (doc says `activepieces`,
     SDK 1.0.4 exposes `workflows`)
  3. Knowledge Hub (folders, files, attach to assistant)
  4. Boards & items (CRM)
"""
from __future__ import annotations
import json
import os
import sys
import time
import uuid

from dotenv import load_dotenv
load_dotenv()

from imbrace import ImbraceClient

API_KEY = os.environ.get("IMBRACE_API_KEY")
ORG_ID  = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

if not API_KEY or not ORG_ID:
    print("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
    sys.exit(1)

client = ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=30)

passed = failed = skipped_n = 0
failures: list[str] = []
doc_gaps: list[str] = []


def step(label, fn, expect_fail=False):
    global passed, failed
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


def skip(label, reason):
    global skipped_n
    print(f"  - {label}  SKIP: {reason}"); skipped_n += 1


def section(title): print(f"\n== {title} ==")
def note(msg): print(f"  i {msg}"); doc_gaps.append(msg)


print(f"\n=== DOCS: full-flow-guide.md - auth: API KEY (PyPI imbrace==1.0.4) ===")
print(f"gateway={GATEWAY}\norg={ORG_ID}\n")

ts = int(time.time() * 1000)
state = {
    "assistantId": None, "flowId": None, "projectId": None, "folderId": None,
    "boardId": None, "identifierFieldId": None, "itemId": None,
}


# 1. AI Assistant + stream_chat ----------------------------------------------

section("§1. AI Assistant + stream_chat")

note("doc-gap: full-flow-guide.md §1 says `chat_ai.create_assistant` / `update_assistant` / `delete_assistant`; SDK 1.0.4 exposes `create_ai_agent` / `update_ai_agent` / `delete_ai_agent` (commit 7662405)")


def _create_agent():
    a = client.chat_ai.create_ai_agent({
        "name": f"SupportBot{ts}",
        "workflow_name": f"support_bot_v1_{ts}",
        "description": "Handles tier-1 customer support queries",
        "instructions": "You are a helpful support agent. Be concise and friendly.",
        "provider_id": "system",
        "model_id": "Default",
    })
    state["assistantId"] = a.get("id") if isinstance(a, dict) else getattr(a, "id", None)
    return {"id": state["assistantId"]}


step("chat_ai.create_ai_agent (doc says create_assistant)", _create_agent)


def _stream_single():
    res = client.ai_agent.stream_chat({
        "assistant_id": state["assistantId"],
        "organization_id": ORG_ID,
        "messages": [{"role": "user", "content": "How do I reset my password?"}],
    })
    n = 0
    t0 = time.time()
    for line in res.iter_lines():
        if time.time() - t0 > 8:
            break
        if isinstance(line, bytes):
            line = line.decode(errors="replace")
        if line.startswith("data: "):
            n += 1
            if n >= 4:
                break
    try: res.close()
    except Exception: pass
    return {"drainedChunks": n}


if state["assistantId"]:
    step("stream_chat (single)", _stream_single)
else:
    skip("stream_chat (single)", "no assistant fixture")


def _stream_multi():
    session_id = str(uuid.uuid4())
    for content in ["What's your refund policy?", "How long does it take?"]:
        res = client.ai_agent.stream_chat({
            "assistant_id": state["assistantId"],
            "organization_id": ORG_ID,
            "id": session_id,
            "messages": [{"role": "user", "content": content}],
        })
        n = 0
        t0 = time.time()
        for line in res.iter_lines():
            if time.time() - t0 > 5: break
            if isinstance(line, bytes):
                line = line.decode(errors="replace")
            if line.startswith("data: "):
                n += 1
                if n >= 2: break
        try: res.close()
        except Exception: pass
    return {"sessionId": session_id}


if state["assistantId"]:
    step("stream_chat (multi-turn, same session id)", _stream_multi)
else:
    skip("stream_chat (multi-turn)", "no assistant fixture")


# 2. Workflows ---------------------------------------------------------------

section("§2. Workflows + binding (doc-gap: `activepieces` -> SDK 1.0.4 uses `workflows`)")
note("doc-gap: full-flow-guide.md §2 uses `client.activepieces.*` everywhere - SDK 1.0.4 only exposes `client.workflows.*`")


def _list_flows():
    r = client.workflows.list_flows(limit=5)
    data = r.get("data", []) if isinstance(r, dict) else (r or [])
    state["projectId"] = data[0].get("projectId") if data else None
    return {"count": len(data), "projectId": state["projectId"]}


step("workflows.list_flows (limit 5) + extract projectId", _list_flows)


def _create_flow():
    f = client.workflows.create_flow(
        display_name=f"CRM Update on New Lead {ts}",
        project_id=state["projectId"],
    )
    state["flowId"] = f.get("id") if isinstance(f, dict) else getattr(f, "id", None)
    return {"id": state["flowId"]}


if state["projectId"]:
    step("workflows.create_flow", _create_flow)
else:
    skip("workflows.create_flow", "no projectId fixture")

if state["flowId"]:
    step("workflows.apply_flow_operation UPDATE_TRIGGER (Webhook)", lambda: client.workflows.apply_flow_operation(state["flowId"], {
        "type": "UPDATE_TRIGGER",
        "request": {
            "name": "trigger",
            "type": "PIECE_TRIGGER",
            "valid": True,
            "displayName": "Webhook",
            "settings": {
                "pieceName": "@activepieces/piece-webhook",
                "pieceVersion": "0.1.24",
                "triggerName": "catch_webhook",
                "input": {"authType": "none"},
                "propertySettings": {},
            },
        },
    }))
    step("workflows.apply_flow_operation LOCK_AND_PUBLISH", lambda: client.workflows.apply_flow_operation(state["flowId"], {
        "type": "LOCK_AND_PUBLISH",
        "request": {},
    }))
else:
    skip("apply_flow_operation x 2", "no flow fixture")

if state["flowId"]:
    step("workflows.trigger_flow (async)", lambda: client.workflows.trigger_flow(state["flowId"], {
        "contact_name": "Jane Smith", "email": "jane@example.com",
    }))
    step("workflows.trigger_flow_sync (expected timeout; no Return Response action)",
         lambda: client.workflows.trigger_flow_sync(state["flowId"], {
             "contact_name": "Jane Smith", "email": "jane@example.com",
         }),
         expect_fail=True)
else:
    skip("trigger_flow / trigger_flow_sync", "no flow fixture")

if state["assistantId"] and state["flowId"]:
    step("chat_ai.update_ai_agent (bind workflow; doc says update_assistant)",
         lambda: client.chat_ai.update_ai_agent(state["assistantId"], {
             "name": f"SupportBot{ts}",
             "workflow_name": f"support_bot_v1_{ts}",
             "workflow_function_call": [{"flow_id": state["flowId"], "description": "Update CRM on new lead"}],
         }))
else:
    skip("chat_ai.update_ai_agent (bind workflow)", "missing assistant or flow fixture")

if state["flowId"]:
    step("workflows.list_runs (limit 10)", lambda: client.workflows.list_runs(flow_id=state["flowId"], limit=10))
else:
    skip("workflows.list_runs", "no flow fixture")


# 3. Knowledge Hub -----------------------------------------------------------

section("§3. Knowledge Hub (folders, files, attach to assistant)")


def _create_folder():
    f = client.boards.create_folder({
        "name": f"Product Docs {ts}",
        "organization_id": ORG_ID,
        "parent_folder_id": "root",
        "source_type": "upload",
    })
    state["folderId"] = f.get("_id") if isinstance(f, dict) else getattr(f, "_id", None)
    return {"id": state["folderId"]}


step("boards.create_folder", _create_folder)
skip("boards.upload_file", "needs binary file fixture (covered elsewhere)")

if state["assistantId"] and state["folderId"]:
    step("chat_ai.update_ai_agent (folder_ids; doc says update_assistant)",
         lambda: client.chat_ai.update_ai_agent(state["assistantId"], {
             "name": f"SupportBot{ts}",
             "workflow_name": f"support_bot_v1_{ts}",
             "folder_ids": [state["folderId"]],
         }))
else:
    skip("chat_ai.update_ai_agent (folder_ids)", "missing assistant or folder fixture")

step("boards.search_folders (q='Product')", lambda: client.boards.search_folders(q="Product"))
if state["folderId"]:
    step("boards.get_folder_contents", lambda: client.boards.get_folder_contents(state["folderId"]))
    step("boards.update_folder (rename)", lambda: client.boards.update_folder(state["folderId"], {"name": f"Product Docs v2 {ts}"}))
    step("boards.search_files", lambda: client.boards.search_files(folder_id=state["folderId"]))
else:
    skip("get_folder_contents / update_folder / search_files", "no folder fixture")


# 4. Boards & items ----------------------------------------------------------

section("§4. Boards & items (CRM)")


def _create_board():
    b = client.boards.create(name=f"Sales Pipeline {ts}", description="Track all active deals")
    state["boardId"] = b.get("_id") if isinstance(b, dict) else getattr(b, "_id", None)
    return {"id": state["boardId"]}


step("boards.create", _create_board)


def _create_field():
    u = client.boards.create_field(state["boardId"], {"name": "Company", "type": "ShortText"})
    fields = u.get("fields", []) if isinstance(u, dict) else []
    identifier = next((f for f in fields if f.get("is_identifier")), None)
    state["identifierFieldId"] = identifier.get("_id") if identifier else None
    return {"fields": len(fields), "identifierId": state["identifierFieldId"]}


if state["boardId"]:
    step("boards.create_field + find identifier", _create_field)
else:
    skip("boards.create_field", "no board fixture")


def _create_item():
    it = client.boards.create_item(state["boardId"], {
        "fields": [{"board_field_id": state["identifierFieldId"], "value": f"Acme Corp {ts}"}],
    })
    state["itemId"] = it.get("_id") if isinstance(it, dict) else getattr(it, "_id", None)
    return {"id": state["itemId"]}


if state["boardId"] and state["identifierFieldId"]:
    step("boards.create_item", _create_item)
else:
    skip("boards.create_item", "no identifier field fixture")

if state["boardId"]:
    step("boards.list_items (limit 20)", lambda: client.boards.list_items(state["boardId"], limit=20, skip=0))
    step("boards.search (q='Acme')", lambda: client.boards.search(state["boardId"], q="Acme", limit=10))
else:
    skip("boards.list_items / search", "no board fixture")

if state["boardId"] and state["itemId"]:
    step("boards.update_item (doc-shape - expected to fail validation)",
         lambda: client.boards.update_item(state["boardId"], state["itemId"], {"fields": {"name": "Acme Corp - Closed Won"}}),
         expect_fail=True)
    if state["identifierFieldId"]:
        step("boards.update_item (canonical shape)",
             lambda: client.boards.update_item(state["boardId"], state["itemId"], {
                 "data": [{"key": state["identifierFieldId"], "value": f"Acme Corp - Closed Won {ts}"}],
             }))
    else:
        skip("boards.update_item (canonical)", "no identifierFieldId")
    step("boards.delete_item", lambda: client.boards.delete_item(state["boardId"], state["itemId"]))
else:
    skip("boards.update_item / delete_item", "no item fixture")

if state["boardId"]:
    step("boards.export_csv", lambda: client.boards.export_csv(state["boardId"]))
else:
    skip("boards.export_csv", "no board fixture")


# Cleanup --------------------------------------------------------------------

section("cleanup")
if state["boardId"]:
    step("boards.delete (cleanup)", lambda: client.boards.delete(state["boardId"]))
if state["folderId"]:
    step("boards.delete_folders (cleanup)", lambda: client.boards.delete_folders([state["folderId"]]))
if state["flowId"]:
    step("workflows.delete_flow (cleanup)", lambda: client.workflows.delete_flow(state["flowId"]))
if state["assistantId"]:
    step("chat_ai.delete_ai_agent (cleanup; doc says delete_assistant)",
         lambda: client.chat_ai.delete_ai_agent(state["assistantId"]))


print(f"\n=== Summary (full-flow-guide / API key) ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures:
        print(f"  - {f}")
if doc_gaps:
    print("Doc gaps to fix:")
    for g in doc_gaps:
        print(f"  - {g}")
sys.exit(1 if failed > 0 else 0)
