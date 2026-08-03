"""Exhaustive document_ai resource verification — pulls imbrace from PyPI.

Auth: API Key.

Covers every method on the DocumentAIResource:
  - Agent CRUD: list_agents, get_agent, create_agent, update_agent, delete_agent
  - Process: process (with sample document URL)
  - Schema auto-learn: suggest_schema
  - Orchestrator: create_full (board + usecase + ai_agent)

Lifecycle test creates real resources on the org then cleans up after itself.
Sample document URL must be reachable from the iMBRACE Document AI worker.
"""
from __future__ import annotations
import json
import os
import sys
import time
from typing import Any

from dotenv import load_dotenv

load_dotenv()

from imbrace import ImbraceClient

API_KEY        = os.environ.get("IMBRACE_API_KEY")
ORG_ID         = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY        = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")
SAMPLE_DOC_URL = os.environ.get("IMBRACE_SAMPLE_DOC_URL", "")
MODEL_ID       = os.environ.get("IMBRACE_DOC_MODEL_ID", "qwen3.5-27b")
PROVIDER_ID    = os.environ.get("IMBRACE_DOC_PROVIDER_ID", "c95e63ad-3c48-4b6a-8ed1-49cf8408088d")

if not API_KEY or not ORG_ID:
    print("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
    sys.exit(1)

client = ImbraceClient(api_key=API_KEY, organization_id=ORG_ID, gateway=GATEWAY, timeout=60)
da = client.document_ai

passed = 0
failed = 0
skipped_n = 0
failures: list[str] = []


def step(label: str, fn, expect_fail: bool = False) -> None:
    global passed, failed
    sys.stdout.write(f"  - {label} ... ")
    sys.stdout.flush()
    try:
        t0 = time.time()
        result = fn()
        dt = int((time.time() - t0) * 1000)
        summary = json.dumps(result, default=str)[:120] if result is not None else ""
        if expect_fail:
            print(f"unexpected pass [{dt}ms]: {summary}")
            failed += 1
            failures.append(f"{label} -> unexpected pass")
        else:
            print(f"OK [{dt}ms] {summary}")
            passed += 1
    except Exception as e:
        detail = str(e)[:300]
        if expect_fail:
            print(f"OK (expected fail [{detail[:100]}])")
            passed += 1
        else:
            print(f"FAIL {detail}")
            failed += 1
            failures.append(f"{label} -> {detail}")


def skip(label: str, reason: str) -> None:
    global skipped_n
    print(f"  - {label}  SKIP: {reason}")
    skipped_n += 1


def section(title: str) -> None:
    print(f"\n== {title} ==")


print(f"\n=== document_ai resource - auth: API KEY (PyPI imbrace) ===")
print(f"gateway={GATEWAY}")
print(f"org={ORG_ID}")
print(f"sampleDoc={SAMPLE_DOC_URL or '(unset — process tests will skip)'}")
print(f"modelId={MODEL_ID}  providerId={PROVIDER_ID}")

# ── 1. List ─────────────────────────────────────────────────────────────────
section("List")
step("list_agents()",                            lambda: da.list_agents())
step("list_agents(document_ai_only=True)",       lambda: da.list_agents(document_ai_only=True))
step("list_agents(name_contains='test')",        lambda: da.list_agents(name_contains="test"))

# ── 2. CRUD lifecycle ───────────────────────────────────────────────────────
section("CRUD lifecycle")
stamp = int(time.time() * 1000)
test_agent_name = f"sdk-test-doc-{stamp}"

created_agent_id: str | None = None

def _create_agent() -> dict:
    global created_agent_id
    res = da.create_agent(
        name=test_agent_name,
        instructions="Extract invoice fields. Return JSON: {invoice_number, total, date}.",
        model_id=MODEL_ID,
        provider_id=PROVIDER_ID,
        schema={
            "invoice_number": {"type": "string", "description": "Invoice ID"},
            "total":          {"type": "number", "description": "Total amount"},
            "date":           {"type": "string", "format": "date"},
        },
        description="SDK test agent — auto-cleanup",
    )
    created_agent_id = res.get("_id") or res.get("id")
    return {"id": created_agent_id, "name": res.get("name")}

step("create_agent (lifecycle)", _create_agent)

if created_agent_id:
    def _get_agent() -> dict:
        a = da.get_agent(created_agent_id)
        return {"id": a.get("_id") or a.get("id"), "name": a.get("name"), "model_id": a.get("model_id")}
    step("get_agent(created_id)", _get_agent)

    def _update_agent() -> dict:
        existing = da.get_agent(created_agent_id)
        merged: dict[str, Any] = {**existing, "description": "SDK test agent — updated"}
        for k in ("_id", "id", "assistant_id", "created_at", "updated_at"):
            merged.pop(k, None)
        a = da.update_agent(created_agent_id, merged)
        return {"id": a.get("_id") or a.get("id"), "description": a.get("description")}
    step("update_agent — get-merge-put (backend requires full replacement)", _update_agent)
else:
    skip("get_agent / update_agent", "create_agent did not return an id")

# ── 3. Process (needs sample document URL) ──────────────────────────────────
section("Process")
if not SAMPLE_DOC_URL:
    skip("process / suggest_schema", "set IMBRACE_SAMPLE_DOC_URL to a public PDF/image to enable")
else:
    if created_agent_id:
        step("process(agent_id, url)",
             lambda: da.process(agent_id=created_agent_id, url=SAMPLE_DOC_URL, organization_id=ORG_ID))
    else:
        skip("process(agent_id)", "no created_agent_id fixture")
    step("process(model_name, url) [direct]",
         lambda: da.process(model_name=MODEL_ID, url=SAMPLE_DOC_URL, organization_id=ORG_ID,
                            instructions="Extract any visible text fields as JSON."))
    step("suggest_schema(url)",
         lambda: da.suggest_schema(url=SAMPLE_DOC_URL, organization_id=ORG_ID, model_name=MODEL_ID))

# ── 4. Cleanup created agent ────────────────────────────────────────────────
section("Cleanup")
if created_agent_id:
    def _delete_agent() -> dict:
        da.delete_agent(created_agent_id)
        return {"deleted": created_agent_id}
    step("delete_agent(created_id)", _delete_agent)
else:
    skip("delete_agent", "no created_agent_id fixture")

# ── 5. create_full orchestrator ─────────────────────────────────────────────
#
# KNOWN ISSUE — SDK uses board `type: "DocumentAI"` but backend enum rejects it.
# Backend valid types: Contacts, Companies, Opportunities, OptOut, Tasks,
# Products, General, KnowledgeHub. The board's real Document AI marker is
# stored elsewhere. This is an SDK contract drift to fix.
section("create_full orchestrator")
full_name = f"sdk-test-docfull-{stamp}"
full_result: dict | None = None

def _create_full() -> dict:
    global full_result
    r = da.create_full(
        name=full_name,
        description="SDK test — auto-cleanup",
        instructions="Extract invoice fields. Return JSON.",
        schema_fields=[
            {"name": "invoice_number", "label": "Invoice Number", "type": "ShortText"},
            {"name": "total",          "label": "Total",          "type": "Number"},
        ],
        model_id=MODEL_ID,
        provider_id=PROVIDER_ID,
        extra_ai_agent={"agent_type": "agent"},
    )
    full_result = r
    return {"board_id": r.get("board_id"), "ai_agent_id": r.get("ai_agent_id"), "usecase_id": r.get("usecase_id")}

step("create_full (board+usecase+aiAgent) [known SDK drift: board type 'DocumentAI' invalid]", _create_full)

# Cleanup create_full artifacts (best-effort)
if full_result:
    if full_result.get("ai_agent_id"):
        def _cleanup_agent() -> dict:
            da.delete_agent(full_result["ai_agent_id"])
            return {"deleted": full_result["ai_agent_id"]}
        step("cleanup: delete_agent(full.ai_agent_id)", _cleanup_agent)
    if full_result.get("board_id"):
        def _cleanup_board() -> dict:
            client.boards.delete(full_result["board_id"])
            return {"deleted": full_result["board_id"]}
        step("cleanup: boards.delete(full.board_id)", _cleanup_board)

# ── Summary ─────────────────────────────────────────────────────────────────
print(f"\n=== Summary ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures:
        print(f"  - {f}")
sys.exit(1 if failed > 0 else 0)
