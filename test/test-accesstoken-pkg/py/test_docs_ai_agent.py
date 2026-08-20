"""Mirrors website/public/sdk/ai-agent.md against `imbrace==1.0.4` (PyPI),
authenticated via Access Token. See test-api-pkg/py/test_docs_ai_agent.py
for section commentary.
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
from imbrace.types.ai import CompletionInput, EmbeddingInput

ACCESS_TOKEN = os.environ.get("IMBRACE_ACCESS_TOKEN")
ORG_ID       = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY      = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

if not ACCESS_TOKEN or not ORG_ID:
    print("Missing IMBRACE_ACCESS_TOKEN or IMBRACE_ORGANIZATION_ID")
    sys.exit(1)

client = ImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=30)

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


print(f"\n=== DOCS: ai-agent.md - auth: ACCESS TOKEN (PyPI imbrace==1.0.4) ===")
print(f"gateway={GATEWAY}\norg={ORG_ID}\n")

ts = int(time.time() * 1000)
state = {"assistantId": None, "folderId": None, "chatId": None, "documentId": None}


# 1 ---- assistant CRUD ------------------------------------------------------

section("§1. Assistant CRUD (chat_ai)")
note("doc-gap: ai-agent.md §1 uses *_assistant names; SDK 1.0.4 exposes *_ai_agent (commit 7662405)")

step("chat_ai.list_ai_agents (doc says list_assistants)", lambda: client.chat_ai.list_ai_agents())


def _create_agent():
    a = client.chat_ai.create_ai_agent({
        "name": f"SupportBot{ts}", "workflow_name": f"support_bot_v1_{ts}",
        "provider_id": "system", "model_id": "Default",
        "description": "Handles tier-1 support queries",
    })
    state["assistantId"] = a.get("id") if isinstance(a, dict) else getattr(a, "id", None)
    return {"id": state["assistantId"]}


step("chat_ai.create_ai_agent (doc says create_assistant)", _create_agent)

if state["assistantId"]:
    step("chat_ai.get_ai_agent (doc says get_assistant)", lambda: client.chat_ai.get_ai_agent(state["assistantId"]))
    step("chat_ai.update_ai_agent (doc says update_assistant)",
         lambda: client.chat_ai.update_ai_agent(state["assistantId"], {
             "name": f"SupportBot v2 {ts}", "workflow_name": f"support_bot_v1_{ts}",
         }))
    step("chat_ai.update_ai_agent_instructions (doc says update_assistant_instructions)",
         lambda: client.chat_ai.update_ai_agent_instructions(state["assistantId"], "You are a helpful support agent."))
else:
    skip("chat_ai.get_ai_agent / update_ai_agent / update_ai_agent_instructions", "no assistant fixture")


# 2 ---- completions ---------------------------------------------------------

section("§2. Completions (client.ai.complete)")
note("doc-gap: Py docs show `ai.complete(model=..., messages=...)` kwargs; SDK 1.0.4 actually requires a `CompletionInput` Pydantic model — `from imbrace.types.ai import CompletionInput`; `ai.complete(CompletionInput(model=..., messages=...))`")
step("ai.complete (gpt-4o; canonical CompletionInput model)", lambda: client.ai.complete(CompletionInput(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful CRM assistant."},
        {"role": "user", "content": "Summarize: customer reports app crash on launch."},
    ],
)))


# 3 ---- document AI ---------------------------------------------------------

section("§3. Document AI models / processing / file extraction")
step("chat_ai.list_document_models", lambda: client.chat_ai.list_document_models())
skip("chat_ai.process_document", "needs a publicly fetchable PDF/image URL")
skip("chat_ai.upload_agent_file / extract_file", "needs binary file fixture")


# 4 ---- knowledge hub (Py uses client.folders) ------------------------------

section("§4. Knowledge Hub — Py uses client.folders for folder CRUD, client.boards for files")
step("folders.search", lambda: client.folders.search())


def _create_folder():
    f = client.folders.create({"name": f"Q1 Reports {ts}"})
    state["folderId"] = f.get("_id") if isinstance(f, dict) else getattr(f, "_id", None)
    return {"id": state["folderId"]}


step("folders.create ({ name })", _create_folder)
if state["folderId"]:
    step("folders.update (rename)",
         lambda: client.folders.update(state["folderId"], {"name": f"Q1 2025 Reports {ts}"}))
    step("boards.search_files (folder_id=)",
         lambda: client.boards.search_files(folder_id=state["folderId"]))
    skip("boards.upload_file / get_file / create_file / delete_files", "needs a real file fixture")
    step("folders.delete ([id])", lambda: client.folders.delete([state["folderId"]]))
    state["folderId"] = None
else:
    skip("folders.update / search_files / delete", "no folder fixture")


# 5 ---- OpenAI-compatible client.ai -----------------------------------------

section("§5. OpenAI-compatible client.ai (complete + stream + embed)")
step("ai.complete (with temperature 0.7; CompletionInput)", lambda: client.ai.complete(CompletionInput(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful CRM assistant."},
        {"role": "user", "content": "Draft a follow-up."},
    ],
    temperature=0.7,
)))


def _stream_ai():
    n = 0
    for chunk in client.ai.stream(CompletionInput(
        model="gpt-4o",
        messages=[{"role": "user", "content": "One short sentence about CRM."}],
    )):
        n += 1
        if n >= 4: break
        _ = chunk
    return {"chunks": n}


step("ai.stream (drain <=4 chunks)", _stream_ai)
step("ai.embed (EmbeddingInput)", lambda: client.ai.embed(EmbeddingInput(
    model="text-embedding-ada-002",
    input=["customer complained about billing", "billing issue escalated"],
)))


# 6 ---- chat v2 streaming ---------------------------------------------------

section("§6. Chat v2 streaming (ai_agent.stream_chat)")


def _stream_chat():
    res = client.ai_agent.stream_chat({
        "assistant_id": state["assistantId"],
        "organization_id": ORG_ID,
        "messages": [{"role": "user", "content": "What can you do?"}],
    })
    n = 0
    t0 = time.time()
    for line in res.iter_lines():
        if time.time() - t0 > 8: break
        if isinstance(line, bytes):
            line = line.decode(errors="replace")
        if line.startswith("data: "):
            n += 1
            if n >= 4: break
    try: res.close()
    except Exception: pass
    return {"drainedChunks": n}


if state["assistantId"]:
    step("ai_agent.stream_chat (drain <=4 chunks)", _stream_chat)
else:
    skip("ai_agent.stream_chat", "no assistant fixture")


# 7 ---- sub-agent -----------------------------------------------------------

section("§7. Sub-agent chat + history")
if state["assistantId"]:
    sess = str(uuid.uuid4()); chat = str(uuid.uuid4())

    def _stream_sub():
        res = client.ai_agent.stream_sub_agent_chat({
            "assistant_id": state["assistantId"], "organization_id": ORG_ID,
            "session_id": sess, "chat_id": chat,
            "messages": [{"role": "user", "content": "Hi"}],
        })
        n = 0; t0 = time.time()
        for line in res.iter_lines():
            if time.time() - t0 > 5: break
            if isinstance(line, bytes):
                line = line.decode(errors="replace")
            if line.startswith("data: "):
                n += 1
                if n >= 2: break
        try: res.close()
        except Exception: pass
        return {"ok": True}
    step("ai_agent.stream_sub_agent_chat", _stream_sub)
    step("ai_agent.get_sub_agent_history",
         lambda: client.ai_agent.get_sub_agent_history(session_id=sess, chat_id=chat))
else:
    skip("ai_agent.stream_sub_agent_chat / get_sub_agent_history", "no assistant fixture")


# 8 ---- prompt suggestions --------------------------------------------------

section("§8. Prompt suggestions")
if state["assistantId"]:
    step("ai_agent.get_agent_prompt_suggestion",
         lambda: client.ai_agent.get_agent_prompt_suggestion(state["assistantId"]))
else:
    skip("ai_agent.get_agent_prompt_suggestion", "no assistant fixture")


# 9 ---- embeddings ----------------------------------------------------------

section("§9. Embeddings & Knowledge Base (RAG)")
step("ai_agent.list_embedding_files", lambda: client.ai_agent.list_embedding_files(page=1, limit=20))
skip("ai_agent.process_embedding / get_embedding_file / preview_embedding_file / update_embedding_file_status / delete_embedding_file / classify_file",
     "all need an existing embedding file_id")


# 10 ---- data board ---------------------------------------------------------

section("§10. Data Board (ai_agent.suggest_field_types)")
step("ai_agent.suggest_field_types", lambda: client.ai_agent.suggest_field_types(fields=[
    {"name": "created_at", "samples": ["2024-01-01", "2024-02-15"]},
    {"name": "amount", "samples": [100, 200.5, 999]},
    {"name": "is_active", "samples": [True, False, True]},
]))


# 11 ---- parquet ------------------------------------------------------------

section("§11. Parquet")
step("ai_agent.generate_parquet", lambda: client.ai_agent.generate_parquet(
    data=[{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}],
    file_name=f"users_{ts}", folder_name="exports",
))
step("ai_agent.list_parquet_files", lambda: client.ai_agent.list_parquet_files())
step("ai_agent.delete_parquet_file (cleanup)",
     lambda: client.ai_agent.delete_parquet_file(f"exports/users_{ts}.parquet"))


# 12 ---- tracing ------------------------------------------------------------

section("§12. Distributed Tracing (Tempo) — backend may 500 if Tempo URL misconfigured")
note("backend-known-issue: Tempo URL config bug -> these methods 500 on app-gatewayv2 (per FIX_PLAN_v1.0.6 §A.1)")
step("ai_agent.get_traces", lambda: client.ai_agent.get_traces(
    service="ai-agent", limit=50, time_range=3600, org_id=ORG_ID, details=True,
))
step("ai_agent.get_trace_services", lambda: client.ai_agent.get_trace_services())
step("ai_agent.get_trace_tags", lambda: client.ai_agent.get_trace_tags())
step("ai_agent.get_trace_tag_values ('http.status_code')",
     lambda: client.ai_agent.get_trace_tag_values("http.status_code"))
step("ai_agent.search_traceql",
     lambda: client.ai_agent.search_traceql('{ .service.name = "ai-agent" && .http.status = 500 }'))
skip("ai_agent.get_trace", "needs a real trace_id")


# 13 ---- chat client --------------------------------------------------------

section("§13. Chat Client — auth")
skip("verify_chat_client_credentials / register_chat_client / get_chat_client_user",
     "destructive — would register/verify against external chat-client identity")

section("§13. Chat Client — chats lifecycle")
chat_id = str(uuid.uuid4()); msg_id = str(uuid.uuid4())


def _create_client_chat():
    r = client.ai_agent.create_client_chat({
        "id": chat_id,
        "message": {"id": msg_id, "role": "user", "parts": [{"type": "text", "text": "Hello!"}]},
        "assistantId": state["assistantId"] or "00000000-0000-0000-0000-000000000000",
        "organizationId": ORG_ID,
    })
    state["chatId"] = chat_id
    return r or {"id": chat_id}


step("ai_agent.create_client_chat", _create_client_chat)
step("ai_agent.list_client_chats (limit 20)",
     lambda: client.ai_agent.list_client_chats(organization_id=ORG_ID, limit=20))

if state["chatId"]:
    step("ai_agent.get_client_chat", lambda: client.ai_agent.get_client_chat(state["chatId"]))
    step("ai_agent.update_client_chat (visibility=private)",
         lambda: client.ai_agent.update_client_chat(state["chatId"], {"visibility": "private"}))
    step("ai_agent.generate_client_chat_title",
         lambda: client.ai_agent.generate_client_chat_title(state["chatId"]))

    def _stream_status():
        res = client.ai_agent.stream_client_chat_status(state["chatId"])
        n = 0; t0 = time.time()
        for line in res.iter_lines():
            if time.time() - t0 > 5: break
            if line:
                n += 1
                if n >= 2: break
        try: res.close()
        except Exception: pass
        return {"drainedChunks": n}
    step("ai_agent.stream_client_chat_status (drain <=2 chunks)", _stream_status)
else:
    skip("get_client_chat / update_client_chat / generate_client_chat_title / stream_client_chat_status", "no chat fixture")

section("§13. Chat Client — messages")
if state["chatId"]:
    step("ai_agent.persist_client_message",
         lambda: client.ai_agent.persist_client_message({"chatId": state["chatId"], "content": "Hello again"}))
    step("ai_agent.list_client_messages",
         lambda: client.ai_agent.list_client_messages(state["chatId"]))
    skip("ai_agent.delete_trailing_messages", "needs a real message_id")
else:
    skip("persist_client_message / list_client_messages", "no chat fixture")

section("§13. Chat Client — votes")
if state["chatId"]:
    step("ai_agent.get_votes", lambda: client.ai_agent.get_votes(state["chatId"]))
    skip("ai_agent.update_vote", "needs a real message_id from a generated assistant reply")
else:
    skip("get_votes / update_vote", "no chat fixture")

section("§13. Chat Client — documents")


def _create_doc():
    d = client.ai_agent.create_document({"kind": "text", "content": f"Draft {ts}"})
    state["documentId"] = d.get("id") if isinstance(d, dict) else getattr(d, "id", None)
    return {"id": state["documentId"]}


step("ai_agent.create_document (kind=text)", _create_doc)
if state["documentId"]:
    step("ai_agent.get_document", lambda: client.ai_agent.get_document(state["documentId"]))
    step("ai_agent.get_document_latest", lambda: client.ai_agent.get_document_latest(state["documentId"]))
    step("ai_agent.get_document_public", lambda: client.ai_agent.get_document_public(state["documentId"]))
    step("ai_agent.get_document_suggestions", lambda: client.ai_agent.get_document_suggestions(state["documentId"]))
    step("ai_agent.delete_document (cleanup)", lambda: client.ai_agent.delete_document(state["documentId"]))
else:
    skip("get_document / get_document_latest / get_document_public / get_document_suggestions / delete_document", "no document fixture")

step("ai_agent.get_document_latest_by_kind (kind='text')",
     lambda: client.ai_agent.get_document_latest_by_kind(kind="text"))


# 14 ---- admin guides -------------------------------------------------------

section("§14. Admin Guides — backend may 500 if assets/guides bundle missing")
note("backend-known-issue: Admin Guides 500 'Guides asset directory missing' on app-gatewayv2 (per FIX_PLAN_v1.0.6 §A.1)")
step("ai_agent.list_admin_guides", lambda: client.ai_agent.list_admin_guides())
skip("ai_agent.get_admin_guide", "needs a known guide filename")


# 15 ---- legacy v1 ----------------------------------------------------------

section("§15. Legacy v1 chat")
step("ai_agent.list_chats (limit 20)",
     lambda: client.ai_agent.list_chats(organization_id=ORG_ID, limit=20))
skip("ai_agent.get_chat / delete_chat", "needs a real legacy v1 chat_id")


# cleanup --------------------------------------------------------------------

section("cleanup")
if state["chatId"]:
    step("ai_agent.delete_client_chat (cleanup)",
         lambda: client.ai_agent.delete_client_chat(state["chatId"]))
if state["assistantId"]:
    step("chat_ai.delete_ai_agent (cleanup; doc says delete_assistant)",
         lambda: client.chat_ai.delete_ai_agent(state["assistantId"]))


print(f"\n=== Summary (ai-agent / Access Token) ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
if doc_gaps:
    print("Doc / backend gaps:")
    for g in doc_gaps: print(f"  - {g}")
sys.exit(1 if failed > 0 else 0)
