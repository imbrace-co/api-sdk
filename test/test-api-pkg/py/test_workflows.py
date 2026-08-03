"""Exhaustive workflows resource verification — pulls imbrace from PyPI.

Auth: API Key.

Covers (Workflow Engine = ActivePieces under the hood):
  - Channel automation: list_channel_automation
  - Flows:              list_flows, get_flow, create_flow, delete_flow, apply_flow_operation
  - Runs:               list_runs (+ get_run skipped — needs run id fixture)
  - Folders:            list_folders, get_folder, create_folder, update_folder, delete_folder
  - Connections:        list_connections (+ upsert/delete skipped)
  - Pieces & status:    list_pieces, get_trigger_run_status
  - Tables:             list_tables (+ get_table/list_records skipped — needs table fixture)
  - MCP:                list_mcp_servers (+ create/delete/rotate skipped — destructive)
  - Invitations:        list_invitations(type='PROJECT')
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
w = client.workflows

passed = 0
failed = 0
skipped_n = 0
failures: list[str] = []


def step(label, fn):
    global passed, failed
    sys.stdout.write(f"  - {label} ... ")
    sys.stdout.flush()
    try:
        t0 = time.time()
        result = fn()
        dt = int((time.time() - t0) * 1000)
        summary = json.dumps(result, default=str)[:120] if result is not None else ""
        print(f"OK [{dt}ms] {summary}")
        passed += 1
    except Exception as e:
        detail = str(e)[:300]
        print(f"FAIL {detail}")
        failed += 1
        failures.append(f"{label} -> {detail}")


def skip(label, reason):
    global skipped_n
    print(f"  - {label}  SKIP: {reason}")
    skipped_n += 1


def section(title):
    print(f"\n== {title} ==")


print(f"\n=== workflows - auth: API KEY (PyPI imbrace) ===")
print(f"gateway={GATEWAY}\norg={ORG_ID}")

# ── 1. Read-only listings ───────────────────────────────────────────────────
section("Read-only listings")
project_id: str | None = None
first_flow_id: str | None = None
first_folder_id: str | None = None

step("list_channel_automation", lambda: w.list_channel_automation())

def _list_flows():
    global project_id, first_flow_id
    r = w.list_flows(limit=3)
    flows = r.get("data", [])
    if flows:
        first_flow_id = flows[0].get("id")
        project_id = flows[0].get("projectId") or flows[0].get("project_id")
    return {"count": len(flows), "first_flow_id": first_flow_id, "project_id": project_id}
step("list_flows (limit=3)", _list_flows)

if first_flow_id:
    step("get_flow(first_flow_id)", lambda: w.get_flow(first_flow_id))

def _list_folders():
    global first_folder_id
    r = w.list_folders(limit=3)
    folders = r.get("data", [])
    if folders:
        first_folder_id = folders[0].get("id")
    return {"count": len(folders), "first_folder_id": first_folder_id}
step("list_folders (limit=3)", _list_folders)

if first_folder_id:
    step("get_folder(first_folder_id)", lambda: w.get_folder(first_folder_id))

step("list_connections (limit=3)",  lambda: w.list_connections(limit=3))
step("list_pieces (limit=3)",       lambda: w.list_pieces(limit=3))
step("list_tables (limit=3)",       lambda: w.list_tables(limit=3))
step("list_runs (limit=3)",         lambda: w.list_runs(limit=3))
step("get_trigger_run_status",      lambda: w.get_trigger_run_status())

if project_id:
    step("list_mcp_servers(project_id)", lambda: w.list_mcp_servers(project_id))
else:
    skip("list_mcp_servers", "no project_id fixture (no flows in workspace)")

step("list_invitations(type='PROJECT')", lambda: w.list_invitations(type="PROJECT", limit=3))

# ── 2. Flow lifecycle ───────────────────────────────────────────────────────
section("Flow lifecycle")
stamp = int(time.time() * 1000)
created_flow_id: str | None = None

if project_id:
    def _create_flow():
        global created_flow_id
        r = w.create_flow(display_name=f"sdk-test-flow-{stamp}", project_id=project_id)
        created_flow_id = r.get("id")
        return {"id": created_flow_id, "name": r.get("displayName")}
    step("create_flow", _create_flow)

    if created_flow_id:
        step("get_flow(created_id)", lambda: w.get_flow(created_flow_id))
        step("apply_flow_operation (CHANGE_NAME)",
             lambda: w.apply_flow_operation(created_flow_id, {
                 "type": "CHANGE_NAME",
                 "request": {"displayName": f"sdk-test-flow-{stamp}-renamed"},
             }))
        step("delete_flow(created_id)",
             lambda: w.delete_flow(created_flow_id) or {"deleted": created_flow_id})
else:
    skip("create_flow / get_flow / apply_flow_operation / delete_flow", "no project_id fixture")

# ── 3. Folder lifecycle ─────────────────────────────────────────────────────
section("Folder lifecycle")
created_folder_id: str | None = None
if project_id:
    def _create_folder():
        global created_folder_id
        r = w.create_folder(display_name=f"sdk-test-folder-{stamp}", project_id=project_id)
        created_folder_id = r.get("id")
        return {"id": created_folder_id, "name": r.get("displayName")}
    step("create_folder", _create_folder)

    if created_folder_id:
        step("get_folder(created_id)", lambda: w.get_folder(created_folder_id))
        step("update_folder (rename)",
             lambda: w.update_folder(created_folder_id, display_name=f"sdk-test-folder-{stamp}-renamed"))
        step("delete_folder(created_id)",
             lambda: w.delete_folder(created_folder_id) or {"deleted": created_folder_id})
else:
    skip("create_folder / update_folder / delete_folder", "no project_id fixture")

# ── 4. Skipped ──────────────────────────────────────────────────────────────
section("Skipped")
skip("trigger_flow / trigger_flow_sync", "needs published flow with trigger config")
skip("test_trigger",                       "needs trigger piece config")
skip("upsert_connection / delete_connection", "needs piece-specific OAuth payload")
skip("create_mcp_server / delete_mcp_server / rotate_mcp_token", "destructive")
skip("get_run(run_id)",                    "needs run id fixture")
skip("get_mcp_server(id)",                 "needs mcp server id fixture")
skip("get_table(id) / list_records",       "needs table id fixture")
skip("delete_invitation",                  "destructive — needs invitation id")

print(f"\n=== Summary ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures:
        print(f"  - {f}")
sys.exit(1 if failed > 0 else 0)
