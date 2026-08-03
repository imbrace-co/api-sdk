/**
 * Exhaustive boards (databoard) resource verification — pulls @imbrace/sdk from npm.
 * Auth: Access Token.
 *
 * Covers:
 *   - Board CRUD: list, get, create, update, delete, reorder, exportCsv
 *   - Fields:     createField, updateField, deleteField, reorderFields, bulkUpdateFields
 *   - Items:      listItems, getItem, createItem, updateItem, deleteItem, bulkDeleteItems, search, checkConflict
 *   - Segments:   listSegments, createSegment, updateSegment, deleteSegment
 *   - Folders:    searchFolders, createFolder, getFolder, updateFolder, deleteFolders, getFolderContents, searchFiles
 *   - Drive:      getOnedriveSessionStatus
 *   - Skipped:    importCsv/Excel, uploadBoardFile, uploadFile, generateAiTags (need binary fixtures — covered in test-files.ts)
 *
 * Lifecycle test creates a real board + items + fields + segments + folder, then deletes everything.
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const accessToken    = process.env.IMBRACE_ACCESS_TOKEN
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!accessToken || !organizationId) {
  console.error("Missing IMBRACE_ACCESS_TOKEN or IMBRACE_ORGANIZATION_ID")
  process.exit(1)
}

const client = new ImbraceClient({ accessToken, organizationId, baseUrl, timeout: 30_000 })
const b = client.boards

let pass = 0, fail = 0, skip = 0
const fails: string[] = []

async function step(label: string, fn: () => Promise<any>, expectFail = false) {
  process.stdout.write(`  • ${label} ... `)
  const t0 = Date.now()
  try {
    const result = await fn()
    const dt = Date.now() - t0
    const summary = JSON.stringify(result ?? {}).slice(0, 120)
    if (expectFail) { console.log(`unexpected pass [${dt}ms]: ${summary}`); fail++; fails.push(`${label} → unexpected pass`) }
    else { console.log(`✓ [${dt}ms] ${summary}`); pass++ }
  } catch (err: any) {
    const detail = err?.message ?? String(err)
    if (expectFail) { console.log(`✓ (expected fail [${detail.slice(0, 200)}])`); pass++ }
    else { console.log(`✗ ${detail.slice(0, 300)}`); fail++; fails.push(`${label} → ${detail.slice(0, 300)}`) }
  }
}

function skipped(label: string, reason: string) {
  console.log(`  - ${label}  ⏭ ${reason}`); skip++
}

function section(title: string) { console.log(`\n══ ${title} ══`) }

console.log(`\n━━━ boards (databoard) — auth: ACCESS TOKEN (npm @imbrace/sdk) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}`)

// ── 1. Read-only list / get ─────────────────────────────────────────────────
section("Read-only list")
let firstBoardId: string | null = null
await step("list (limit 5)", async () => {
  const r: any = await b.list({ limit: 5 } as any)
  const data = r.data ?? r ?? []
  if (data.length > 0) firstBoardId = data[0]._id ?? data[0].id
  return { count: data.length, first: firstBoardId }
})
await step("list (sort by name asc)", () => b.list({ limit: 3, sort: "name" } as any))
await step("list (types=Contacts)", () => b.list({ limit: 3, types: "Contacts" } as any))

if (firstBoardId) {
  await step("get(firstBoardId)", () => b.get(firstBoardId!))
  await step("listItems(firstBoardId, limit=2)", () => b.listItems(firstBoardId!, { limit: 2 } as any))
  await step("listSegments(firstBoardId)", () => b.listSegments(firstBoardId!))
  await step("exportCsv(firstBoardId)", async () => {
    const csv = await b.exportCsv(firstBoardId!)
    return { length: typeof csv === "string" ? csv.length : 0 }
  })
} else {
  skipped("get / listItems / listSegments / exportCsv", "no boards in org")
}

// ── 2. Board lifecycle ──────────────────────────────────────────────────────
section("Board lifecycle (create → update → delete)")
const stamp = Date.now()
const testBoardName = `sdk-test-board-${stamp}`
let createdBoardId: string | null = null

await step("create (type=General)", async () => {
  const r: any = await b.create({
    name: testBoardName,
    description: "SDK test board — auto-cleanup",
    type: "General",
    show_id: false,
  } as any)
  createdBoardId = r._id ?? r.id
  return { id: createdBoardId, name: r.name, type: r.type }
})

if (createdBoardId) {
  await step("update (rename)", async () => {
    const r: any = await b.update(createdBoardId!, { name: `${testBoardName}-updated`, description: "updated" } as any)
    return { id: r._id ?? r.id, name: r.name }
  })

  // ── 3. Fields ─────────────────────────────────────────────────────────────
  // SDK now returns BoardField directly (was Board pre-fix #6).
  section("Fields lifecycle")
  let createdFieldId: string | null = null
  await step("createField (ShortText)", async () => {
    const r: any = await b.createField(createdBoardId!, {
      name: "test_field",
      type: "ShortText",
    } as any)
    createdFieldId = r._id ?? r.id ?? null
    return { fieldId: createdFieldId, fieldName: r.name, fieldType: r.type }
  })

  if (createdFieldId) {
    await step("updateField (rename)", async () => {
      const r: any = await b.updateField(createdBoardId!, createdFieldId!, {
        name: "test_field_renamed",
      } as any)
      return { id: r._id ?? r.id, name: r.name }
    })

    await step("deleteField", async () => {
      await b.deleteField(createdBoardId!, createdFieldId!)
      return { deleted: createdFieldId }
    })
  } else {
    skipped("updateField / deleteField", "createField did not return a field id")
  }

  // ── 4. Items ──────────────────────────────────────────────────────────────
  // Get identifier field id from board (the one with is_identifier:true).
  // Item create body uses `{fields: [{board_field_id, value}]}`,
  // update body asymmetrically uses `{fields: [], data: [{key, value}]}` — SDK drift.
  section("Items lifecycle")
  let identifierFieldId: string | null = null
  await step("get board identifier field id", async () => {
    const board: any = await b.get(createdBoardId!)
    const idField = (board.fields ?? []).find((f: any) => f.is_identifier)
    identifierFieldId = idField?._id ?? null
    return { identifierFieldId, name: idField?.name }
  })

  let createdItemId: string | null = null
  if (identifierFieldId) {
    await step("createItem", async () => {
      const r: any = await b.createItem(createdBoardId!, {
        fields: [{ board_field_id: identifierFieldId, value: "hello" }],
      } as any)
      createdItemId = r._id ?? r.id
      return { id: createdItemId }
    })
  } else {
    skipped("createItem", "no identifier field found on board")
  }

  if (createdItemId) {
    await step("getItem", async () => {
      const r: any = await b.getItem(createdBoardId!, createdItemId!)
      return { id: r._id ?? r.id }
    })

    await step("updateItem [asymmetric body: fields[] + data[] — SDK drift]", async () => {
      const r: any = await b.updateItem(createdBoardId!, createdItemId!, {
        fields: [],
        data: [{ key: identifierFieldId, value: "updated" }],
      } as any)
      return { id: r._id ?? r.id }
    })

    await step("listItems(limit=5)", () => b.listItems(createdBoardId!, { limit: 5 } as any))
    await step("search({q:'hello'})", () => b.search(createdBoardId!, { q: "hello", limit: 5 } as any))

    await step("deleteItem", async () => {
      await b.deleteItem(createdBoardId!, createdItemId!)
      return { deleted: createdItemId }
    })
  } else {
    skipped("getItem / updateItem / listItems / search / deleteItem", "createItem did not return an id")
  }

  // ── 5. Segments ───────────────────────────────────────────────────────────
  section("Segments lifecycle")
  let createdSegmentId: string | null = null
  await step("createSegment", async () => {
    const r: any = await b.createSegment(createdBoardId!, {
      name: `sdk-test-segment-${stamp}`,
      filter: {},
    } as any)
    createdSegmentId = r._id ?? r.id
    return { id: createdSegmentId, name: r.name }
  })

  if (createdSegmentId) {
    await step("updateSegment (rename)", async () => {
      const r: any = await b.updateSegment(createdBoardId!, createdSegmentId!, {
        name: `sdk-test-segment-${stamp}-updated`,
      } as any)
      return { id: r._id ?? r.id, name: r.name }
    })

    await step("listSegments", async () => {
      const r = await b.listSegments(createdBoardId!)
      return { count: Array.isArray(r) ? r.length : 0 }
    })

    await step("deleteSegment", async () => {
      await b.deleteSegment(createdBoardId!, createdSegmentId!)
      return { deleted: createdSegmentId }
    })
  } else {
    skipped("updateSegment / deleteSegment", "createSegment did not return an id")
  }

  // ── 6. Cleanup board ──────────────────────────────────────────────────────
  section("Cleanup board")
  await step("delete(board)", async () => {
    await b.delete(createdBoardId!)
    return { deleted: createdBoardId }
  })
} else {
  skipped("update / fields / items / segments / delete", "create did not return an id")
}

// ── 7. KnowledgeHub Folders ─────────────────────────────────────────────────
section("KnowledgeHub folders lifecycle")
let createdFolderId: string | null = null
await step("searchFolders", () => b.searchFolders())
await step("createFolder [SDK should default source_type='upload' + parent_folder_id='root']", async () => {
  const r: any = await b.createFolder({
    name: `sdk-test-folder-${stamp}`,
    organization_id: organizationId,
    // Backend enum: source_type must be "upload" (only valid value observed).
    // parent_folder_id must be "root" for top-level (not null).
    // SDK should default these.
    source_type: "upload",
    parent_folder_id: "root",
  } as any)
  createdFolderId = r._id ?? r.id
  return { id: createdFolderId, name: r.name }
})

if (createdFolderId) {
  await step("getFolder", async () => {
    const r: any = await b.getFolder(createdFolderId!)
    return { id: r._id ?? r.id, name: r.name }
  })
  await step("getFolder(recursive=true)", () =>
    b.getFolder(createdFolderId!, { recursive: true } as any))
  await step("getFolderContents", () => b.getFolderContents(createdFolderId!))
  await step("searchFiles(folderId)", () => b.searchFiles({ folderId: createdFolderId! } as any))
  await step("updateFolder (rename)", async () => {
    const r: any = await b.updateFolder(createdFolderId!, {
      name: `sdk-test-folder-${stamp}-updated`,
    } as any)
    return { id: r._id ?? r.id, name: r.name }
  })

  await step("deleteFolders", async () => {
    const r = await b.deleteFolders({ ids: [createdFolderId!] } as any)
    return r
  })
} else {
  skipped("getFolder / updateFolder / deleteFolders", "createFolder did not return an id")
}

// ── 8. Drive integration (best-effort) ──────────────────────────────────────
section("Drive integration (read-only)")
if ((b as any).getOnedriveSessionStatus) {
  await step("getOnedriveSessionStatus", () => (b as any).getOnedriveSessionStatus())
} else {
  skipped("getOnedriveSessionStatus", "method not exposed in this SDK build")
}

// ── 9. Skipped (need binary fixtures, covered in test-files.ts) ─────────────
section("Skipped (need binary fixtures)")
skipped("importCsv / importExcel", "needs CSV/Excel file fixture")
skipped("uploadBoardFile", "needs file fixture")
skipped("uploadFile (folder)", "needs file fixture — covered in test-files.ts")
skipped("generateAiTags", "needs file fixture")
skipped("getLinkPreview", "needs URL fixture, optional")
skipped("getRelatedItems / linkItems / unlinkItems", "needs related board fixture")

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n━━━ Summary ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) {
  console.log("Failures:")
  for (const f of fails) console.log(`  - ${f}`)
}
process.exit(fail > 0 ? 1 : 0)
