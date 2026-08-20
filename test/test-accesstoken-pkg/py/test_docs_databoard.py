"""Mirrors website/public/sdk/databoard.md against `imbrace==1.0.4` (PyPI)
— Access Token auth. See test-api-pkg/py/test_docs_databoard.py for
doc-gap commentary.
"""
from __future__ import annotations
import json
import os
import sys
import time

from dotenv import load_dotenv
load_dotenv()

from imbrace import ImbraceClient

ACCESS_TOKEN = os.environ.get("IMBRACE_ACCESS_TOKEN")
ORG_ID       = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY      = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

if not ACCESS_TOKEN or not ORG_ID:
    print("Missing IMBRACE_ACCESS_TOKEN or IMBRACE_ORGANIZATION_ID")
    sys.exit(1)

client = ImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=15)

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


print(f"\n=== DOCS: databoard.md - auth: ACCESS TOKEN (PyPI imbrace==1.0.4) ===")
print(f"gateway={GATEWAY}\norg={ORG_ID}\n")

ts = int(time.time() * 1000)
state = {"boardId": None, "itemId": None, "identifierFieldId": None, "numberFieldId": None, "segmentId": None}


section("§1. Board CRUD")
note("doc-gap: databoard.md §1 Py shows `client.boards.create(\"Enterprise Leads\")` (positional str); SDK 1.0.4 takes keyword args (`name=..., description=...`)")

step("boards.list", lambda: client.boards.list(limit=5))


def _create_board():
    b = client.boards.create(name=f"Enterprise Leads {ts}")
    state["boardId"] = b.get("_id") if isinstance(b, dict) else getattr(b, "_id", None)
    return {"id": state["boardId"]}


step("boards.create (canonical: name=...)", _create_board)
if state["boardId"]:
    step("boards.get(board_id)", lambda: client.boards.get(state["boardId"]))
    step("boards.update(board_id, { name })",
         lambda: client.boards.update(state["boardId"], {"name": f"Enterprise Leads 2025 {ts}"}))
else:
    skip("boards.get / update", "no board fixture")


section("§2. Items (doc-gap: { fields: { ... } } shape — not iterable)")
note("doc-gap: databoard.md §2 create_item shape `{ \"fields\": { \"name\", \"status\", \"value\" } }` returns 400")
note("doc-gap: databoard.md §2 update_item shape `{ \"fields\": { \"status\" } }` returns 400")

if state["boardId"]:
    step("boards.list_items (limit 100, empty)",
         lambda: client.boards.list_items(state["boardId"], limit=100))


    def _create_field():
        u = client.boards.create_field(state["boardId"], {"name": "Company", "type": "ShortText"})
        fields = u.get("fields", []) if isinstance(u, dict) else []
        idf = next((f for f in fields if f.get("is_identifier")), None)
        state["identifierFieldId"] = idf.get("_id") if idf else None
        return {"fields": len(fields), "identifierId": state["identifierFieldId"]}

    step("boards.create_field (canonical Type=ShortText) — find identifier", _create_field)

    step("boards.create_item (doc shape — expected fail)",
         lambda: client.boards.create_item(state["boardId"], {"fields": {"name": "Acme", "status": "new", "value": 50000}}),
         expect_fail=True)

    if state["identifierFieldId"]:
        def _create_item():
            it = client.boards.create_item(state["boardId"], {
                "fields": [{"board_field_id": state["identifierFieldId"], "value": f"Acme Corp {ts}"}],
            })
            state["itemId"] = it.get("_id") if isinstance(it, dict) else getattr(it, "_id", None)
            return {"id": state["itemId"]}
        step("boards.create_item (canonical shape)", _create_item)
    else:
        skip("boards.create_item (canonical)", "no identifier field")

    if state["itemId"]:
        step("boards.get_item", lambda: client.boards.get_item(state["boardId"], state["itemId"]))
        step("boards.update_item (doc shape — expected fail)",
             lambda: client.boards.update_item(state["boardId"], state["itemId"], {"fields": {"status": "qualified"}}),
             expect_fail=True)
        if state["identifierFieldId"]:
            step("boards.update_item (canonical shape)",
                 lambda: client.boards.update_item(state["boardId"], state["itemId"], {
                     "data": [{"key": state["identifierFieldId"], "value": f"Acme Corp - qualified {ts}"}],
                 }))
        step("boards.delete_item", lambda: client.boards.delete_item(state["boardId"], state["itemId"]))
        state["itemId"] = None
    else:
        skip("boards.get_item / update_item / delete_item", "no item fixture")

    skip("boards.bulk_delete_items", "needs real item ids")
else:
    skip("§2 items lifecycle", "no board fixture")


section("§3. Search")
if state["boardId"]:
    step("boards.search (q='enterprise')", lambda: client.boards.search(state["boardId"], q="enterprise"))
else:
    skip("boards.search", "no board fixture")


section("§4. Fields, Segments & Export")
note("doc-gap: databoard.md §4 create_field uses `type: \"number\"` lowercase — SDK 1.0.4 backend expects `\"Number\"` capitalised")

if state["boardId"]:
    step("boards.create_field (doc shape — type='number' lowercase)",
         lambda: client.boards.create_field(state["boardId"], {"name": "Deal Value", "type": "number"}),
         expect_fail=True)


    def _create_number_field():
        f = client.boards.create_field(state["boardId"], {"name": "Contract Value", "type": "Number"})
        fields = f.get("fields", []) if isinstance(f, dict) else []
        new_field = next((x for x in fields if x.get("name") == "Contract Value"), None)
        state["numberFieldId"] = new_field.get("_id") if new_field else None
        return {"id": state["numberFieldId"]}

    step("boards.create_field (canonical — Number)", _create_number_field)

    if state["numberFieldId"]:
        step("boards.update_field (rename)",
             lambda: client.boards.update_field(state["boardId"], state["numberFieldId"], {"name": "Contract Value v2"}))
        step("boards.delete_field",
             lambda: client.boards.delete_field(state["boardId"], state["numberFieldId"]))
        state["numberFieldId"] = None
    else:
        skip("boards.update_field / delete_field", "no field fixture")

    step("boards.list_segments", lambda: client.boards.list_segments(state["boardId"]))


    def _create_segment():
        s = client.boards.create_segment(state["boardId"], {
            "name": f"High Value Leads {ts}",
            "filter": {"field": "value", "op": "gt", "value": 10000},
        })
        state["segmentId"] = s.get("_id") if isinstance(s, dict) else getattr(s, "_id", None)
        return {"id": state["segmentId"]}

    step("boards.create_segment", _create_segment)
    step("boards.export_csv", lambda: client.boards.export_csv(state["boardId"]))


section("cleanup")
if state["boardId"]:
    step("boards.delete (cleanup)", lambda: client.boards.delete(state["boardId"]))


print(f"\n=== Summary (databoard / Access Token) ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures: print(f"  - {f}")
if doc_gaps:
    print("Doc gaps to fix:")
    for g in doc_gaps: print(f"  - {g}")
sys.exit(1 if failed > 0 else 0)
