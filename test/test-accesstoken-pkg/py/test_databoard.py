"""Exhaustive boards (databoard) resource verification — pulls imbrace from PyPI.

Auth: Access Token.

Covers:
  - Board CRUD: list, get, create, update, delete, export_csv
  - Fields:     create_field, update_field, delete_field
  - Items:      list_items, get_item, create_item, update_item, delete_item, search
  - Segments:   list_segments, create_segment, update_segment, delete_segment
  - Folders:    search_folders, create_folder, get_folder, update_folder,
                delete_folders, get_folder_contents, search_files
  - Skipped:    import_csv/excel, upload_*, generate_ai_tags (need binary fixtures — covered in test_files.py)

Lifecycle test creates real resources then deletes them.
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

ACCESS_TOKEN = os.environ.get("IMBRACE_ACCESS_TOKEN")
ORG_ID       = os.environ.get("IMBRACE_ORGANIZATION_ID")
GATEWAY      = os.environ.get("IMBRACE_GATEWAY_URL", "https://app-gatewayv2.imbrace.co")

if not ACCESS_TOKEN or not ORG_ID:
    print("Missing IMBRACE_ACCESS_TOKEN or IMBRACE_ORGANIZATION_ID")
    sys.exit(1)

client = ImbraceClient(access_token=ACCESS_TOKEN, organization_id=ORG_ID, gateway=GATEWAY, timeout=30)
b = client.boards

passed = 0
failed = 0
skipped_n = 0
failures: list[str] = []


def step(label: str, fn) -> None:
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


def skip(label: str, reason: str) -> None:
    global skipped_n
    print(f"  - {label}  SKIP: {reason}")
    skipped_n += 1


def section(title: str) -> None:
    print(f"\n== {title} ==")


print(f"\n=== boards (databoard) - auth: ACCESS TOKEN (PyPI imbrace) ===")
print(f"gateway={GATEWAY}\norg={ORG_ID}")

# ── 1. Read-only list ───────────────────────────────────────────────────────
section("Read-only list")
first_board_id: str | None = None

def _list_boards():
    global first_board_id
    r = b.list(limit=5)
    data = r.get("data") if isinstance(r, dict) else r
    if data:
        first_board_id = data[0].get("_id") or data[0].get("id")
    return {"count": len(data) if data else 0, "first": first_board_id}
step("list (limit 5)", _list_boards)

if first_board_id:
    step("get(first_board_id)",        lambda: {"id": (b.get(first_board_id) or {}).get("_id")})
    step("list_items(first, limit=2)", lambda: b.list_items(first_board_id, limit=2))
    step("list_segments(first)",       lambda: b.list_segments(first_board_id))
    step("export_csv(first)",          lambda: {"length": len(b.export_csv(first_board_id) or "")})
else:
    skip("get / list_items / list_segments / export_csv", "no boards in org")

# ── 2. Board lifecycle ──────────────────────────────────────────────────────
section("Board lifecycle (create -> update -> delete)")
stamp = int(time.time() * 1000)
test_board_name = f"sdk-test-board-{stamp}"
created_board_id: str | None = None

def _create():
    global created_board_id
    r = b.create(name=test_board_name, description="SDK test board", type="General", show_id=False)
    created_board_id = r.get("_id") or r.get("id")
    return {"id": created_board_id, "name": r.get("name"), "type": r.get("type")}
step("create (type=General)", _create)

if created_board_id:
    step("update (rename)",
         lambda: {"id": (b.update(created_board_id, {"name": f"{test_board_name}-updated", "description": "updated"}) or {}).get("_id")})

    # ── 3. Fields ─────────────────────────────────────────────────────────────
    # createField returns Board not BoardField — extract last field from board.fields[]
    section("Fields lifecycle")
    created_field_id: str | None = None

    def _create_field():
        global created_field_id
        # SDK now returns BoardField directly (was Board pre-fix #6).
        r = b.create_field(created_board_id, {"name": "test_field", "type": "ShortText"})
        created_field_id = r.get("_id") or r.get("id")
        return {"fieldId": created_field_id, "fieldName": r.get("name"), "fieldType": r.get("type")}
    step("create_field (ShortText)", _create_field)

    if created_field_id:
        step("update_field (rename)",
             lambda: b.update_field(created_board_id, created_field_id, {"name": "test_field_renamed"}))
        step("delete_field",
             lambda: b.delete_field(created_board_id, created_field_id) or {"deleted": created_field_id})
    else:
        skip("update_field / delete_field", "create_field did not return a field id")

    # ── 4. Items ──────────────────────────────────────────────────────────────
    # createItem body: {fields: [{board_field_id, value}]}
    # updateItem body: {fields: [], data: [{key, value}]}  — asymmetric, SDK drift
    section("Items lifecycle")
    identifier_field_id: str | None = None

    def _get_id_field():
        global identifier_field_id
        board = b.get(created_board_id)
        for f in (board.get("fields") or []):
            if f.get("is_identifier"):
                identifier_field_id = f.get("_id")
                return {"identifierFieldId": identifier_field_id, "name": f.get("name")}
        return {"identifierFieldId": None}
    step("get board identifier field id", _get_id_field)

    created_item_id: str | None = None
    if identifier_field_id:
        def _create_item():
            global created_item_id
            r = b.create_item(created_board_id,
                              {"fields": [{"board_field_id": identifier_field_id, "value": "hello"}]})
            created_item_id = r.get("_id") or r.get("id")
            return {"id": created_item_id}
        step("create_item", _create_item)
    else:
        skip("create_item", "no identifier field on board")

    if created_item_id:
        step("get_item",
             lambda: {"id": (b.get_item(created_board_id, created_item_id) or {}).get("_id")})
        step("update_item [asymmetric body: fields[] + data[] — SDK drift]",
             lambda: b.update_item(created_board_id, created_item_id,
                                   {"fields": [], "data": [{"key": identifier_field_id, "value": "updated"}]}))
        step("list_items(limit=5)", lambda: b.list_items(created_board_id, limit=5))
        step("search(q='hello')",   lambda: b.search(created_board_id, q="hello", limit=5))
        step("delete_item",
             lambda: b.delete_item(created_board_id, created_item_id) or {"deleted": created_item_id})
    else:
        skip("get_item / update_item / list_items / search / delete_item", "create_item did not return an id")

    # ── 5. Segments ───────────────────────────────────────────────────────────
    section("Segments lifecycle")
    created_segment_id: str | None = None
    def _create_seg():
        global created_segment_id
        r = b.create_segment(created_board_id, {"name": f"sdk-test-segment-{stamp}", "filter": {}})
        created_segment_id = r.get("_id") or r.get("id")
        return {"id": created_segment_id, "name": r.get("name")}
    step("create_segment", _create_seg)

    if created_segment_id:
        step("update_segment (rename)",
             lambda: b.update_segment(created_board_id, created_segment_id,
                                      {"name": f"sdk-test-segment-{stamp}-updated"}))
        step("list_segments",
             lambda: {"count": len(b.list_segments(created_board_id) or [])})
        step("delete_segment",
             lambda: b.delete_segment(created_board_id, created_segment_id) or {"deleted": created_segment_id})
    else:
        skip("update_segment / delete_segment", "create_segment did not return an id")

    section("Cleanup board")
    step("delete(board)",
         lambda: b.delete(created_board_id) or {"deleted": created_board_id})
else:
    skip("update / fields / items / segments / delete", "create did not return an id")

# ── 6. KnowledgeHub Folders ────────────────────────────────────────────────
# SDK should default source_type="upload" + parent_folder_id="root"
section("KnowledgeHub folders lifecycle")
step("search_folders", lambda: {"count": len(b.search_folders() or [])})

created_folder_id: str | None = None
def _create_folder():
    global created_folder_id
    r = b.create_folder({
        "name": f"sdk-test-folder-{stamp}",
        "organization_id": ORG_ID,
        "source_type": "upload",
        "parent_folder_id": "root",
    })
    created_folder_id = r.get("_id") or r.get("id")
    return {"id": created_folder_id, "name": r.get("name")}
step("create_folder [SDK should default source_type+parent_folder_id]", _create_folder)

if created_folder_id:
    step("get_folder",            lambda: {"id": (b.get_folder(created_folder_id) or {}).get("_id")})
    step("get_folder(recursive)", lambda: b.get_folder(created_folder_id, recursive=True))
    step("get_folder_contents",   lambda: b.get_folder_contents(created_folder_id))
    step("search_files",          lambda: {"count": len(b.search_files(created_folder_id) or [])})
    step("update_folder (rename)",
         lambda: b.update_folder(created_folder_id, {"name": f"sdk-test-folder-{stamp}-updated"}))
    step("delete_folders",
         lambda: b.delete_folders([created_folder_id]))
else:
    skip("get_folder / update_folder / delete_folders", "create_folder did not return an id")

# ── 7. Skipped (need binary fixtures) ───────────────────────────────────────
section("Skipped (need binary fixtures)")
skip("import_csv / import_excel", "needs CSV/Excel file fixture")
skip("upload_board_file",          "needs file fixture")
skip("upload_file (folder)",       "needs file fixture — covered in test_files.py")
skip("generate_ai_tags",           "needs file fixture")
skip("get_link_preview",           "needs URL fixture")
skip("get_related_items / link_items / unlink_items", "needs related board")

print(f"\n=== Summary ===")
print(f"pass={passed}  fail={failed}  skip={skipped_n}")
if failures:
    print("Failures:")
    for f in failures:
        print(f"  - {f}")
sys.exit(1 if failed > 0 else 0)
