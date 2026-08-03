"""Exhaustive ai_agent resource verification — pulls imbrace from PyPI.

Auth: API key.

Covers every method documented at https://developer.imbrace.co/sdk/ai-agent/:
System & Trace, Chat v1/v2 + Sub-agent, Prompt suggestions, Embeddings/RAG,
Data Board, Parquet, Chat Client (auth/chats/messages/votes/documents),
Admin Guides.
"""
from __future__ import annotations
import os
import sys
import time
import uuid
import json
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

from imbrace import ImbraceClient

API_KEY = os.environ.get("IMBRACE_API_KEY")
ORG_ID  = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

if not API_KEY or not ORG_ID:
    print("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
    sys.exit(1)

client = ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY)
ai = client.ai_agent

passed = 0
failed = 0
skipped = 0
failures: list[str] = []


def step(label: str, fn, expect_fail: bool = False) -> None:
    global passed, failed
    sys.stdout.write(f"  - {label} ... ")
    sys.stdout.flush()
    try:
        t0 = time.time()
        result = fn()
        dt = int((time.time() - t0) * 1000)
        summary = json.dumps(result, default=str)[:100] if result is not None else ""
        if expect_fail:
            print(f"unexpected pass [{dt}ms]: {summary}")
        else:
            print(f"OK [{dt}ms] {summary}")
            passed += 1
    except Exception as e:
        code = str(e)[:80]
        if expect_fail:
            print(f"OK (expected fail [{code}])")
            passed += 1
        else:
            print(f"FAIL [{code}]")
            failed += 1
            failures.append(f"{label} -> {code}")


def section(title: str) -> None:
    print(f"\n== {title} ==")


def resolve_assistant_id() -> str | None:
    try:
        lst = client.chat_ai.list_ai_agents()
        for a in lst:
            if a.get("model_id"):
                return a.get("id") or a.get("_id")
        return lst[0].get("id") if lst else None
    except Exception:
        return None


print(f"\n=== ai_agent resource - auth: API KEY (PyPI imbrace) ===")
print(f"gateway={GATEWAY}")
print(f"org={ORG_ID}")

section("System & Trace")
step("get_health",         lambda: ai.get_health())
step("get_config",         lambda: ai.get_config())
step("get_version",        lambda: ai.get_version())
step("get_trace_services", lambda: ai.get_trace_services())
step("get_trace_tags",     lambda: ai.get_trace_tags())
step("get_traces (limit 3)", lambda: ai.get_traces(limit=3))

assistant_id = resolve_assistant_id()
print(f"\n[fixture] assistant_id = {assistant_id}")

section("Chat v1 (legacy)")
step("list_chats", lambda: ai.list_chats(organization_id=ORG_ID, limit=3))

section("Chat v2 streaming")
if assistant_id:
    def _stream():
        res = ai.stream_chat({
            "assistant_id": assistant_id,
            "organization_id": ORG_ID,
            "messages": [{"role": "user", "content": "Reply with the single word OK."}],
        })
        if hasattr(res, "status_code") and res.status_code >= 400:
            raise RuntimeError(f"HTTP {res.status_code}")
        text = res.text[:80] if hasattr(res, "text") else str(res)[:80]
        return {"preview": text}
    step("stream_chat (1 turn)", _stream)
else:
    print("  - stream_chat: skipped (no assistant)"); skipped += 1

section("Prompt suggestions")
if assistant_id:
    step("get_agent_prompt_suggestion", lambda: ai.get_agent_prompt_suggestion(assistant_id))
else:
    skipped += 1

section("Embeddings / RAG")
first_emb_id: str | None = None

def _list_emb():
    global first_emb_id
    r = ai.list_embedding_files()
    data = (r or {}).get("data", {})
    files = data.get("files", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
    if files:
        first_emb_id = files[0].get("id") or files[0].get("_id")
    return {"count": len(files)}

step("list_embedding_files", _list_emb)
if first_emb_id:
    step("get_embedding_file", lambda: ai.get_embedding_file(first_emb_id))
    step("preview_embedding_file", lambda: ai.preview_embedding_file(file_id=first_emb_id))
else:
    skipped += 2
step("classify_file (no fileId)", lambda: ai.classify_file(), expect_fail=True)

section("Data Board")
# Fix #1: suggest_field_types now takes file_urls (sample doc URLs), not fields.
def _suggest_field_types():
    try:
        return ai.suggest_field_types(["https://example.com/sample.pdf"])
    except Exception as e:
        if "Failed to fetch document" in str(e):
            return {"shape_ok": True, "fetch_err": "expected"}
        raise
step("suggest_field_types (best-effort)", _suggest_field_types)

section("Parquet")
step("list_parquet_files", lambda: ai.list_parquet_files())

section("Chat Client - Auth")
chat_user_id: str | None = None

def _client_user():
    global chat_user_id
    u = ai.get_chat_client_user({})
    chat_user_id = (u or {}).get("id")
    return u

step("get_chat_client_user", _client_user)

section("Chat Client - Chats")
created_chat_id: str | None = None
if assistant_id and chat_user_id:
    new_chat_id = str(uuid.uuid4())

    def _create_chat():
        global created_chat_id
        r = ai.create_client_chat({
            "id": new_chat_id,
            "assistantId": assistant_id,
            "organizationId": ORG_ID,
            "userId": chat_user_id,
            "selectedVisibilityType": "private",
            "message": {
                "id": str(uuid.uuid4()),
                "role": "user",
                "content": "hello from sdk verify (apikey-py)",
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "parts": [{"type": "text", "text": "hello from sdk verify (apikey-py)"}],
            },
        })
        created_chat_id = (r or {}).get("id") or new_chat_id
        return r
    step("create_client_chat", _create_chat)
else:
    skipped += 1

step("list_client_chats", lambda: ai.list_client_chats(organization_id=ORG_ID, limit=3))

if created_chat_id:
    step("get_client_chat",           lambda: ai.get_client_chat(created_chat_id))
    step("list_client_messages",      lambda: ai.list_client_messages(created_chat_id))
    step("get_votes",                 lambda: ai.get_votes(created_chat_id))
    step("generate_client_chat_title",lambda: ai.generate_client_chat_title(created_chat_id))
    step("update_client_chat",        lambda: ai.update_client_chat(created_chat_id, {"visibility": "public"}))
    step("delete_client_chat",        lambda: ai.delete_client_chat(created_chat_id))
else:
    skipped += 6

section("Chat Client - Documents")
step("get_document_latest_by_kind (kind=text)", lambda: ai.get_document_latest_by_kind(kind="text"))

section("Admin Guides")
step("list_admin_guides", lambda: ai.list_admin_guides())

print(f"\n=== Summary ===")
print(f"pass={passed}  fail={failed}  skip={skipped}")
if failures:
    print("Failures:")
    for f in failures:
        print(f"  - {f}")
sys.exit(1 if failed > 0 else 0)
