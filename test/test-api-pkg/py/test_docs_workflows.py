"""Mirrors website/public/sdk/workflows.md against `imbrace==1.0.4` (PyPI)
— API-key auth.

Note: workflows.md Py snippets already use `client.workflows.*`, so there's
no rename gap on the Py side (TS only).
"""
from __future__ import annotations
import json
import os
import sys
import time

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


print(f"\n=== DOCS: workflows.md - auth: API KEY (PyPI imbrace==1.0.4) ===")
print(f"gateway={GATEWAY}\norg={ORG_ID}\n")

ts = int(time.time() * 1000)
state = {"projectId": None, "flowId": None, "runId": None, "folderId": None}

note("note: workflows.md Py snippets correctly use `client.workflows.*` (no rename needed). TS doc-gap is `client.activepieces.*` -> `client.workflows.*`.")


section("§1. Flows (list / get / create / delete)")


def _list_flows():
    r = client.workflows.list_flows(limit=5)
    data = r.get("data", []) if isinstance(r, dict) else (r or [])
    state["projectId"] = data[0].get("projectId") if data else None
    return {"count": len(data), "projectId": state["projectId"]}


step("workflows.list_flows + capture projectId", _list_flows)


def _create_flow():
    f = client.workflows.create_flow(display_name=f"New Lead Notification {ts}", project_id=state["projectId"])
    state["flowId"] = f.get("id") if isinstance(f, dict) else getattr(f, "id", None)
    return {"id": state["flowId"]}


if state["projectId"]:
    step("workflows.create_flow", _create_flow)
else:
    skip("workflows.create_flow", "no projectId fixture")

if state["flowId"]:
    step("workflows.get_flow", lambda: client.workflows.get_flow(state["flowId"]))
else:
    skip("workflows.get_flow", "no flow fixture")


section("§2. Trigger a flow (async + sync)")
if state["flowId"]:
    step("workflows.apply_flow_operation UPDATE_TRIGGER (Webhook)",
         lambda: client.workflows.apply_flow_operation(state["flowId"], {
             "type": "UPDATE_TRIGGER",
             "request": {
                 "name": "trigger", "type": "PIECE_TRIGGER", "valid": True,
                 "displayName": "Webhook",
                 "settings": {
                     "pieceName": "@activepieces/piece-webhook", "pieceVersion": "0.1.24",
                     "triggerName": "catch_webhook",
                     "input": {"authType": "none"}, "propertySettings": {},
                 },
             },
         }))
    step("workflows.apply_flow_operation LOCK_AND_PUBLISH",
         lambda: client.workflows.apply_flow_operation(state["flowId"], {"type": "LOCK_AND_PUBLISH", "request": {}}))
    step("workflows.trigger_flow (async)",
         lambda: client.workflows.trigger_flow(state["flowId"], {"contactId": "contact_xxx", "event": "lead_qualified"}))
    step("workflows.trigger_flow_sync (expected timeout — no Return Response action)",
         lambda: client.workflows.trigger_flow_sync(state["flowId"], {"contactId": "contact_xxx", "event": "lead_qualified"}),
         expect_fail=True)
else:
    skip("trigger_flow / trigger_flow_sync", "no flow fixture")


section("§3. Runs, folders, connections, tables")
if state["flowId"]:
    def _list_runs():
        r = client.workflows.list_runs(flow_id=state["flowId"], limit=20)
        data = r.get("data", []) if isinstance(r, dict) else (r or [])
        state["runId"] = data[0].get("id") if data else None
        return {"count": len(data), "sampleRunId": state["runId"]}
    step("workflows.list_runs ({ flow_id, limit: 20 })", _list_runs)
    if state["runId"]:
        step("workflows.get_run(run_id)", lambda: client.workflows.get_run(state["runId"]))
    else:
        skip("workflows.get_run", "no run fixture")
else:
    skip("workflows.list_runs / get_run", "no flow fixture")


def _list_folders():
    r = client.workflows.list_folders()
    data = r.get("data", []) if isinstance(r, dict) else (r or [])
    return {"count": len(data)}


step("workflows.list_folders", _list_folders)

if state["projectId"]:
    def _create_folder():
        f = client.workflows.create_folder(display_name=f"CRM Automations {ts}", project_id=state["projectId"])
        state["folderId"] = f.get("id") if isinstance(f, dict) else getattr(f, "id", None)
        return {"id": state["folderId"]}
    step("workflows.create_folder", _create_folder)
else:
    skip("workflows.create_folder", "no projectId fixture")


def _list_connections():
    r = client.workflows.list_connections()
    data = r.get("data", []) if isinstance(r, dict) else (r or [])
    return {"count": len(data)}


step("workflows.list_connections", _list_connections)
skip("workflows.upsert_connection",
     "destructive — would create a Slack connection in the org. Doc payload uses `xoxb-xxx` placeholder")


def _list_tables():
    r = client.workflows.list_tables()
    data = r.get("data", []) if isinstance(r, dict) else (r or [])
    return {"count": len(data)}


step("workflows.list_tables", _list_tables)
skip("workflows.list_records", "needs a real table_id from list_tables — fixture-dependent")


section("§4. Channel automation")


def _list_ca():
    r = client.workflows.list_channel_automation()
    data = r.get("data", []) if isinstance(r, dict) else (r or [])
    return {"count": len(data)}


step("workflows.list_channel_automation", _list_ca)


def _list_ca_wa():
    r = client.workflows.list_channel_automation(channel_type="whatsapp")
    data = r.get("data", []) if isinstance(r, dict) else (r or [])
    return {"count": len(data)}


step("workflows.list_channel_automation (channel_type='whatsapp')", _list_ca_wa)


section("cleanup")
if state["flowId"]:
    step("workflows.delete_flow (cleanup)", lambda: client.workflows.delete_flow(state["flowId"]))
if state["folderId"] and hasattr(client.workflows, "delete_folder"):
    step("workflows.delete_folder (cleanup; best-effort)",
         lambda: client.workflows.delete_folder(state["folderId"]))


print(f"\n=== Summary (workflows / API key) ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
if doc_gaps:
    print("Doc gaps:")
    for g in doc_gaps: print(f"  - {g}")
sys.exit(1 if failed > 0 else 0)
