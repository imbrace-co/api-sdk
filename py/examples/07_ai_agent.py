"""
AiAgent resource test — exercises the AiAgent surface against a live gateway.

Usage:
    export IMBRACE_ACCESS_TOKEN=...     # required
    export IMBRACE_ORG_ID=...           # optional, needed for multi-org accounts
    export IMBRACE_ASSISTANT_ID=...     # optional, assistant-specific checks are
                                        # skipped when unset
    python examples/07_ai_agent.py
"""

import os
import uuid
import time
from imbrace import ImbraceClient

ACCESS_TOKEN = os.environ["IMBRACE_ACCESS_TOKEN"]
GATEWAY      = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")
ORG_ID       = os.environ.get("IMBRACE_ORG_ID")
ASSISTANT_ID = os.environ.get("IMBRACE_ASSISTANT_ID")

client   = ImbraceClient(access_token=ACCESS_TOKEN, gateway=GATEWAY)
ai_agent = client.ai_agent

passed, failed, skipped = 0, 0, 0

def ok(label, detail=""):
    global passed
    print(f"  ✓ {label}{f'  →  {str(detail)[:120]}' if detail else ''}")
    passed += 1

def fail(label, err):
    global failed
    print(f"  ✗ {label}: {str(err)[:120]}")
    failed += 1

def skip(label, reason):
    global skipped
    print(f"  - {label}  (skipped: {reason})")
    skipped += 1

# ─────────────────────────────────────────────────────────────────────────────
# [1] System
# ─────────────────────────────────────────────────────────────────────────────

print("\n[1] System")

try:
    cfg = ai_agent.get_config()
    ok("get_config()", str(cfg)[:100])
except Exception as e:
    fail("get_config()", e)

try:
    h = ai_agent.get_health()
    ok("get_health()", str(h)[:100])
except Exception as e:
    fail("get_health()", e)

try:
    v = ai_agent.get_version()
    ok("get_version()", str(v)[:100])
except Exception as e:
    fail("get_version()", e)

# ─────────────────────────────────────────────────────────────────────────────
# [2] Chat v1
# ─────────────────────────────────────────────────────────────────────────────

print("\n[2] Chat v1")

first_chat_id = None
try:
    res = ai_agent.list_chats(organization_id=ORG_ID, limit=5)
    chats = res.get("chats", res) if isinstance(res, dict) else res
    first_chat_id = chats[0].get("id") if isinstance(chats, list) and chats else None
    ok("list_chats()", f"count={res.get('count', len(chats) if isinstance(chats, list) else '?')}")
except Exception as e:
    fail("list_chats()", e)

if first_chat_id:
    try:
        chat = ai_agent.get_chat(first_chat_id)
        ok("get_chat()", f"id={chat.get('id')}")
    except Exception as e:
        fail("get_chat()", e)
else:
    skip("get_chat()", "no chats found")

# ─────────────────────────────────────────────────────────────────────────────
# [3] Prompt suggestions
# ─────────────────────────────────────────────────────────────────────────────

print("\n[3] Prompt suggestions")

if ASSISTANT_ID:
    try:
        res = ai_agent.get_agent_prompt_suggestion(ASSISTANT_ID)
        suggestions = res.get("data", res) if isinstance(res, dict) else res
        ok("get_agent_prompt_suggestion()", f"{len(suggestions) if isinstance(suggestions, list) else '?'} suggestions")
    except Exception as e:
        fail("get_agent_prompt_suggestion()", e)
else:
    skip("get_agent_prompt_suggestion()", "set IMBRACE_ASSISTANT_ID")

# ─────────────────────────────────────────────────────────────────────────────
# [4] Embeddings
# ─────────────────────────────────────────────────────────────────────────────

print("\n[4] Embeddings")

try:
    res = ai_agent.list_embedding_files()
    files = res if isinstance(res, list) else res.get("files", res.get("data", []))
    ok("list_embedding_files()", f"{len(files) if isinstance(files, list) else '?'} files")
except Exception as e:
    fail("list_embedding_files()", e)

try:
    res = ai_agent.classify_file(url="https://example.com/test.pdf", mime_type="application/pdf")
    ok("classify_file()", str(res)[:100])
except Exception as e:
    fail("classify_file()", e)

# ─────────────────────────────────────────────────────────────────────────────
# [5] Data Board
# ─────────────────────────────────────────────────────────────────────────────

print("\n[5] Data Board")

skip("suggest_field_types()", "route not wired in this app-gateway build (POST / path stripped)")

# ─────────────────────────────────────────────────────────────────────────────
# [6] Parquet
# ─────────────────────────────────────────────────────────────────────────────

print("\n[6] Parquet")

try:
    res = ai_agent.list_parquet_files()
    ok("list_parquet_files()", str(res)[:100])
except Exception as e:
    fail("list_parquet_files()", e)

generated_file_name = None
try:
    res = ai_agent.generate_parquet(
        data=[{"id": 1, "name": "test", "value": 42}],
        file_name=f"sdk_test_{int(time.time())}",
    )
    generated_file_name = res.get("fileName") if isinstance(res, dict) else None
    ok("generate_parquet()", str(res)[:100])
except Exception as e:
    fail("generate_parquet()", e)

if generated_file_name:
    try:
        ai_agent.delete_parquet_file(generated_file_name)
        ok("delete_parquet_file()")
    except Exception as e:
        fail("delete_parquet_file()", e)
else:
    skip("delete_parquet_file()", "generate_parquet failed or returned no fileName")

# ─────────────────────────────────────────────────────────────────────────────
# [7] Trace
# ─────────────────────────────────────────────────────────────────────────────

print("\n[7] Trace")

skip("get_trace_services()", "Grafana Tempo URL not configured on this deployment")
skip("get_trace_tags()",    "Grafana Tempo URL not configured on this deployment")
skip("get_traces()",        "Grafana Tempo URL not configured on this deployment")

# ─────────────────────────────────────────────────────────────────────────────
# [8] Admin guides
# ─────────────────────────────────────────────────────────────────────────────

print("\n[8] Admin guides")

first_guide = None
try:
    res = ai_agent.list_admin_guides()
    guides = res if isinstance(res, list) else res.get("guides", res.get("data", []))
    first_guide = (guides[0].get("filename") or guides[0].get("name")) if isinstance(guides, list) and guides else None
    ok("list_admin_guides()", f"{len(guides) if isinstance(guides, list) else '?'} guides")
except Exception as e:
    fail("list_admin_guides()", e)

if first_guide:
    try:
        r = ai_agent.get_admin_guide(first_guide)
        ok("get_admin_guide()", f"status={r.status_code}")
    except Exception as e:
        fail("get_admin_guide()", e)
else:
    skip("get_admin_guide()", "no guides listed")

# ─────────────────────────────────────────────────────────────────────────────
# [9] Chat Client — CRUD cycle
# ─────────────────────────────────────────────────────────────────────────────

print("\n[9] Chat Client")

try:
    res = ai_agent.list_client_chats(limit=5)
    chats = res.get("chats", res.get("data", res)) if isinstance(res, dict) else res
    ok("list_client_chats()", f"count={len(chats) if isinstance(chats, list) else '?'}")
except Exception as e:
    fail("list_client_chats()", e)

new_chat_id = str(uuid.uuid4())
created_chat = None
try:
    created_chat = ai_agent.create_client_chat({
        "id": new_chat_id,
        "message": {"id": str(uuid.uuid4()), "role": "user", "parts": [{"type": "text", "text": "SDK test message"}]},
        "selectedVisibilityType": "private",
        "assistantId": ASSISTANT_ID,
    })
    ok("create_client_chat()", f"id={created_chat.get('id', new_chat_id)}")
except Exception as e:
    fail("create_client_chat()", e)

if created_chat:
    try:
        chat = ai_agent.get_client_chat(new_chat_id)
        ok("get_client_chat()", f"id={chat.get('id')}")
    except Exception as e:
        fail("get_client_chat()", e)

    try:
        msgs = ai_agent.list_client_messages(new_chat_id)
        msg_list = msgs.get("messages", msgs.get("data", msgs)) if isinstance(msgs, dict) else msgs
        ok("list_client_messages()", f"{len(msg_list) if isinstance(msg_list, list) else '?'} messages")
    except Exception as e:
        fail("list_client_messages()", e)

    try:
        ai_agent.delete_client_chat(new_chat_id)
        ok("delete_client_chat()")
    except Exception as e:
        fail("delete_client_chat()", e)
else:
    skip("get_client_chat()", "create_client_chat failed")
    skip("list_client_messages()", "create_client_chat failed")
    skip("delete_client_chat()", "create_client_chat failed")

# ─────────────────────────────────────────────────────────────────────────────

client.close()
print(f"\n{'─' * 55}")
print(f"  {passed} passed  |  {failed} failed  |  {skipped} skipped")
if failed > 0:
    raise SystemExit(1)
