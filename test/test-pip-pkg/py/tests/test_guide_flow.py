"""
Mirrors every snippet from
https://imbraceltd.github.io/api-sdk/typescript/full-flow-guide/
using the published `imbrace` Python SDK.

Run mode is selected via AUTH_MODE=apikey | token (default: apikey).
Required env: IMBRACE_API_KEY, IMBRACE_ACCESS_TOKEN, IMBRACE_GATEWAY_URL.
"""
from __future__ import annotations

import io
import json
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Callable, List, Optional

from dotenv import load_dotenv
from imbrace import ImbraceClient

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

AUTH_MODE = os.environ.get("AUTH_MODE", "apikey").lower()
API_KEY = os.environ.get("IMBRACE_API_KEY")
ACCESS_TOKEN = os.environ.get("IMBRACE_ACCESS_TOKEN")
BASE_URL = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

if AUTH_MODE == "apikey" and not API_KEY:
    raise SystemExit("IMBRACE_API_KEY required for AUTH_MODE=apikey")
if AUTH_MODE == "token" and not ACCESS_TOKEN:
    raise SystemExit("IMBRACE_ACCESS_TOKEN required for AUTH_MODE=token")

client = ImbraceClient(
    base_url=BASE_URL,
    api_key=API_KEY if AUTH_MODE == "apikey" else None,
    access_token=ACCESS_TOKEN if AUTH_MODE == "token" else None,
    timeout=60.0,
)

results: List[dict] = []


def step(label: str, fn: Callable[[], Any]) -> Any:
    t0 = time.time()
    sys.stdout.write(f"  [{label}] ... ")
    sys.stdout.flush()
    try:
        out = fn()
        ms = int((time.time() - t0) * 1000)
        print(f"OK ({ms}ms)")
        results.append({"step": label, "status": "ok", "ms": ms})
        return out
    except Exception as err:
        ms = int((time.time() - t0) * 1000)
        status_code = getattr(err, "status_code", "?")
        msg = str(err)
        body = getattr(err, "body", None)
        body_s = f" body={json.dumps(body)[:300]}" if body else ""
        print(f"FAIL ({ms}ms) status={status_code} {msg}{body_s}")
        results.append(
            {"step": label, "status": "fail", "ms": ms, "error": f"{status_code} {msg}"}
        )
        return None


def consume_sse(response: Any, label: str) -> dict:
    """
    Consume an SSE response from stream_chat. Returns {"events": int, "text": str}.
    """
    events = 0
    text = ""
    for line in response.iter_lines():
        # httpx may yield str or bytes depending on version; normalise.
        if isinstance(line, bytes):
            line = line.decode("utf-8", errors="replace")
        if not line.startswith("data: "):
            continue
        data = line[6:].strip()
        if not data or data == "[DONE]":
            continue
        events += 1
        try:
            chunk = json.loads(data)
            text += chunk.get("delta") or chunk.get("content") or ""
        except Exception:
            pass
    if events == 0:
        raise RuntimeError(f"No SSE events received for {label}")
    return {"events": events, "text": text}


def main() -> None:
    print(f"\n========== AUTH_MODE={AUTH_MODE} | base={BASE_URL} ==========")
    ts = int(time.time() * 1000)
    state: dict = {}

    # ---------------- SECTION 1 ----------------
    print("\n[Section 1] Assistant + Chat")

    def s12():
        a = client.chat_ai.create_ai_agent({
            "name": f"Support Bot {ts}",
            "workflow_name": f"support_bot_v1_{ts}",
            "description": "Handles tier-1 customer support queries",
            "instructions": "You are a helpful support agent. Be concise and friendly.",
            "provider_id": "system",
            "model_id": "gpt-4o",
        })
        state["assistant_id"] = a["id"]
        return a["id"]

    step("1.2 createAiAgent", s12)

    if state.get("assistant_id"):
        def s13():
            r = client.ai_agent.stream_chat({
                "assistant_id": state["assistant_id"],
                "organization_id": os.environ["IMBRACE_ORGANIZATION_ID"],
                "messages": [{"role": "user", "content": "How do I reset my password?"}],
            })
            out = consume_sse(r, "single")
            return f"{out['events']} events, {len(out['text'])} chars"

        step("1.3 streamChat (single turn)", s13)

        def s14():
            session_id = str(uuid.uuid4())
            r1 = client.ai_agent.stream_chat({
                "id": session_id,
                "assistant_id": state["assistant_id"],
                "organization_id": os.environ["IMBRACE_ORGANIZATION_ID"],
                "messages": [{"role": "user", "content": "What's your refund policy?"}],
            })
            consume_sse(r1, "turn1")
            r2 = client.ai_agent.stream_chat({
                "id": session_id,
                "assistant_id": state["assistant_id"],
                "organization_id": os.environ["IMBRACE_ORGANIZATION_ID"],
                "messages": [{"role": "user", "content": "How long does it take?"}],
            })
            consume_sse(r2, "turn2")

        step("1.4 streamChat (multi-turn w/ session)", s14)

    # ---------------- SECTION 2 ----------------
    print("\n[Section 2] Workflow")

    def s21():
        res = client.workflows.list_flows(limit=5)
        flows = res.get("data", []) if isinstance(res, dict) else []
        state["flows"] = flows
        state["project_id"] = flows[0].get("projectId") if flows else None
        return f"{len(flows)} flows, project_id={state.get('project_id')}"

    step("2.1 listFlows", s21)

    if state.get("project_id"):
        def s22():
            f = client.workflows.create_flow(
                display_name=f"CRM Update on New Lead {ts}",
                project_id=state["project_id"],
            )
            state["flow_id"] = f.get("id")
            return state["flow_id"]

        step("2.2 createFlow", s22)
    else:
        results.append({"step": "2.2 createFlow", "status": "fail", "error": "skipped: no projectId"})
        print("  [2.2 createFlow] SKIP (no projectId)")

    if state.get("flow_id"):
        def s23a():
            client.workflows.apply_flow_operation(state["flow_id"], {
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
            })

        step("2.3 UPDATE_TRIGGER (catch_webhook)", s23a)

        def s23b():
            client.workflows.apply_flow_operation(state["flow_id"], {
                "type": "LOCK_AND_PUBLISH",
                "request": {},
            })

        step("2.3 LOCK_AND_PUBLISH", s23b)

        def s23c():
            client.workflows.trigger_flow(
                state["flow_id"],
                {"contact_name": "Jane Smith", "email": "jane@example.com"},
            )

        step("2.3 triggerFlow (async)", s23c)

        # triggerFlowSync deliberately skipped — the published guide notes it
        # requires an ADD_ACTION (Return Response) to actually return data.

        if state.get("assistant_id"):
            def s25():
                client.chat_ai.update_ai_agent(state["assistant_id"], {
                    "name": f"Support Bot {ts}",
                    "workflow_name": f"support_bot_v1_{ts}",
                    "workflow_function_call": [
                        {"flow_id": state["flow_id"], "description": "Update CRM on new lead"}
                    ],
                })

            step("2.5 updateAiAgent w/ workflow_function_call", s25)

        def s26():
            r = client.workflows.list_runs(limit=10, flow_id=state["flow_id"])
            data = r.get("data", []) if isinstance(r, dict) else []
            return f"{len(data)} runs"

        step("2.6 listRuns", s26)
    else:
        print("  [2.3-2.6] SKIP (no flow_id)")

    # ---------------- SECTION 3 ----------------
    print("\n[Section 3] Knowledge Hub")

    def s31():
        f = client.boards.create_folder({
            "name": f"Product Documentation {ts}",
            "organization_id": os.environ["IMBRACE_ORGANIZATION_ID"],
            "parent_folder_id": "root",
            "source_type": "upload",
        })
        state["folder_id"] = f.get("_id") or f.get("id")
        return state["folder_id"]

    step("3.1 createFolder", s31)

    if state.get("folder_id"):
        def s32():
            tmp = Path("/tmp/imbrace-sdk-test")
            tmp.mkdir(parents=True, exist_ok=True)
            path = tmp / f"faq-{ts}.txt"
            path.write_text(f"IMBRACE FAQ {ts}\nThe magic word is BANANA-{ts}.\n")

            files = {
                "file": (path.name, path.read_bytes(), "text/plain"),
                "folder_id": (None, state["folder_id"]),
                "organization_id": (None, os.environ["IMBRACE_ORGANIZATION_ID"]),
            }
            uploaded = client.boards.upload_file(files)
            state["uploaded_file_id"] = uploaded.get("file_id") or uploaded.get("_id")
            return state["uploaded_file_id"]

        step("3.2 uploadFile", s32)

        if state.get("assistant_id"):
            def s33():
                client.chat_ai.update_ai_agent(state["assistant_id"], {
                    "name": f"Support Bot {ts}",
                    "workflow_name": f"support_bot_v1_{ts}",
                    "folder_ids": [state["folder_id"]],
                })

            step("3.3 updateAiAgent w/ folder_ids", s33)

        def s34a():
            res = client.boards.search_folders(q="Product")
            return f"{len(res) if isinstance(res, list) else len(res.get('data', []))} folders"

        step("3.4 searchFolders", s34a)

        def s34b():
            c = client.boards.get_folder_contents(state["folder_id"])
            files = c.get("files") if isinstance(c, dict) else None
            return f"files={len(files) if files else 0}"

        step("3.4 getFolderContents", s34b)

        def s34c():
            client.boards.update_folder(state["folder_id"], {"name": f"Product Docs v2 {ts}"})

        step("3.4 updateFolder", s34c)

        def s34d():
            files = client.boards.search_files(folder_id=state["folder_id"])
            return f"{len(files) if isinstance(files, list) else len(files.get('data', []))} files"

        step("3.4 searchFiles by folderId", s34d)

        def s34e():
            client.boards.delete_folders([state["folder_id"]])
            state["folder_id"] = None

        step("3.4 deleteFolders", s34e)
    else:
        print("  [3.2-3.4] SKIP (no folder)")

    # ---------------- SECTION 4 ----------------
    print("\n[Section 4] Boards & Items")

    def s41():
        b = client.boards.create(name=f"Sales Pipeline {ts}", description="Track all active deals")
        state["board_id"] = b.get("_id") or b.get("id")
        return state["board_id"]

    step("4.1 boards.create", s41)

    if state.get("board_id"):
        def s42():
            u = client.boards.create_field(state["board_id"], {"name": "Company", "type": "ShortText"})
            id_field = next((f for f in u.get("fields", []) if f.get("is_identifier")), None)
            if not id_field:
                raise RuntimeError("No identifier field on board after create_field")
            state["id_field"] = id_field
            return id_field["_id"]

        step("4.2 createField + find identifier", s42)

        if state.get("id_field"):
            def s43():
                it = client.boards.create_item(state["board_id"], {
                    "fields": [{"board_field_id": state["id_field"]["_id"], "value": "Acme Corp"}],
                })
                state["item_id"] = it.get("_id") or it.get("id")
                return state["item_id"]

            step("4.3 createItem", s43)

            def s44a():
                r = client.boards.list_items(state["board_id"], limit=20, skip=0)
                data = r.get("data", []) if isinstance(r, dict) else []
                return f"{len(data)} items"

            step("4.4 listItems", s44a)

            def s44b():
                r = client.boards.search(state["board_id"], q="Acme", limit=10)
                data = r.get("data", []) if isinstance(r, dict) else []
                return f"{len(data)} matches"

            step("4.4 search", s44b)

            if state.get("item_id"):
                def s45a():
                    client.boards.update_item(state["board_id"], state["item_id"], {
                        "data": [{"key": state["id_field"]["_id"], "value": "Acme Corp — Closed Won"}],
                    })

                step("4.5 updateItem", s45a)

                def s45b():
                    client.boards.delete_item(state["board_id"], state["item_id"])

                step("4.5 deleteItem", s45b)

            def s46():
                csv = client.boards.export_csv(state["board_id"])
                if not isinstance(csv, str):
                    raise RuntimeError(f"export_csv returned {type(csv)}, not str")
                return f"{len(csv)} bytes"

            step("4.6 exportCsv", s46)

    # ---------------- CLEANUP ----------------
    print("\n[Cleanup]")
    if state.get("folder_id"):
        step("cleanup.deleteFolders", lambda: client.boards.delete_folders([state["folder_id"]]))
    if state.get("board_id"):
        step("cleanup.boards.delete", lambda: client.boards.delete(state["board_id"]))
    if state.get("flow_id"):
        def cflow():
            try:
                client.workflows.delete_flow(state["flow_id"])
            except Exception:
                pass
        step("cleanup.flow", cflow)
    if state.get("assistant_id"):
        step("cleanup.deleteAiAgent", lambda: client.chat_ai.delete_ai_agent(state["assistant_id"]))

    # ---------------- SUMMARY ----------------
    ok = sum(1 for r in results if r["status"] == "ok")
    fail = sum(1 for r in results if r["status"] == "fail")
    print(f"\n========== SUMMARY [AUTH_MODE={AUTH_MODE}] ==========")
    print(f"PASS={ok}  FAIL={fail}")
    for r in results:
        if r["status"] == "fail":
            print(f"  FAIL  {r['step']}  -- {r['error']}")
    print("==================================================\n")

    if fail > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
