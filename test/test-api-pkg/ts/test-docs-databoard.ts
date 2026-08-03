/**
 * Mirrors website/public/sdk/databoard.md against @imbrace/sdk@1.0.4 (npm)
 * — API-key auth.
 *
 * Sections: Board CRUD · Items · Search · Fields/Segments/Export.
 *
 * Doc-gaps the test calls out:
 *   - `boards.createItem` doc shape  `{ fields: { name, status, value } }`
 *     fails 400; canonical is `{ fields: [{ board_field_id, value }] }`.
 *   - `boards.updateItem` same — doc `{ fields: { status } }`, canonical
 *     `{ data: [{ key, value }] }`.
 *   - `boards.createField type: "number"` lowercase — backend wants `Number`
 *     (capitalised). Doc shows lowercase.
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const apiKey         = process.env.IMBRACE_API_KEY
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!apiKey || !organizationId) {
  console.error("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
  process.exit(1)
}

const client = new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 15_000 })

let pass = 0, fail = 0, skip = 0
const fails: string[] = []
const docGaps: string[] = []

async function step(label: string, fn: () => Promise<unknown>, expectFail = false) {
  process.stdout.write(`  • ${label} ... `)
  try {
    const t0 = Date.now()
    const r = await fn()
    const dt = Date.now() - t0
    const summary = JSON.stringify(r ?? {}).slice(0, 90)
    if (expectFail) { console.log(`unexpected pass [${dt}ms]: ${summary}`); fail++; fails.push(`${label} → unexpected pass`) }
    else { console.log(`✓ [${dt}ms] ${summary}`); pass++ }
  } catch (err: any) {
    const code = err?.statusCode ?? err?.message ?? "ERR"
    if (expectFail) { console.log(`✓ (expected fail [${code}])`); pass++ }
    else { console.log(`✗ [${code}]`); fail++; fails.push(`${label} → ${code}`) }
  }
}

function skipped(label: string, reason: string) { console.log(`  - ${label}  ⏭ ${reason}`); skip++ }
function section(title: string) { console.log(`\n══ ${title} ══`) }
function note(msg: string) { console.log(`  ℹ ${msg}`); docGaps.push(msg) }

console.log(`\n━━━ DOCS: databoard.md — auth: API KEY (npm @imbrace/sdk@1.0.4) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}\n`)

const ts = Date.now()
const state: { boardId: string | null; itemId: string | null; identifierFieldId: string | null; numberFieldId: string | null; segmentId: string | null } =
  { boardId: null, itemId: null, identifierFieldId: null, numberFieldId: null, segmentId: null }

// ── §1. Board CRUD ────────────────────────────────────────────────────────

section("§1. Board CRUD")

await step("boards.list", () => client.boards.list({ limit: 5 } as any))

await step("boards.create", async () => {
  const b: any = await client.boards.create({ name: `Enterprise Leads ${ts}` } as any)
  state.boardId = b?._id ?? b?.id ?? null
  return { id: state.boardId }
})

if (state.boardId) {
  await step("boards.get(boardId)", () => client.boards.get(state.boardId!))
  await step("boards.update(boardId, { name })", () =>
    client.boards.update(state.boardId!, { name: `Enterprise Leads 2025 ${ts}` } as any),
  )
} else {
  skipped("boards.get / boards.update", "no board fixture")
}

// ── §2. Items ─────────────────────────────────────────────────────────────

section("§2. Items (doc-gap: doc shows { fields: { name, status, value } } — not iterable)")
note("doc-gap: databoard.md §2 createItem shape `{ fields: { name, status, value } }` returns 400 — canonical is `{ fields: [{ board_field_id, value }] }`")
note("doc-gap: databoard.md §2 updateItem shape `{ fields: { status } }` returns 400 — canonical is `{ data: [{ key, value }] }`")

if (state.boardId) {
  await step("boards.listItems (limit 100, empty)",
    () => client.boards.listItems(state.boardId!, { limit: 100 } as any))

  // Need a field so we can populate the identifier
  await step("boards.createField (canonical Type=ShortText) — find identifier", async () => {
    const u: any = await client.boards.createField(state.boardId!, {
      name: "Company", type: "ShortText",
    } as any)
    const idf = (u?.fields ?? []).find((f: any) => f?.is_identifier)
    state.identifierFieldId = idf?._id ?? null
    return { fields: u?.fields?.length, identifierId: state.identifierFieldId }
  })

  // Doc-shape createItem (expected to fail 400)
  await step("boards.createItem (doc shape — expected fail)",
    () => client.boards.createItem(state.boardId!, { fields: { name: "Acme", status: "new", value: 50000 } } as any),
    /* expectFail */ true)

  // Canonical createItem
  if (state.identifierFieldId) {
    await step("boards.createItem (canonical shape)", async () => {
      const it: any = await client.boards.createItem(state.boardId!, {
        fields: [{ board_field_id: state.identifierFieldId!, value: `Acme Corp ${ts}` }],
      } as any)
      state.itemId = it?._id ?? it?.id ?? null
      return { id: state.itemId }
    })
  } else {
    skipped("boards.createItem (canonical)", "no identifier field")
  }

  if (state.itemId) {
    await step("boards.getItem", () => (client.boards as any).getItem(state.boardId!, state.itemId!))
    // Doc-shape updateItem (expected to fail 400)
    await step("boards.updateItem (doc shape — expected fail)",
      () => (client.boards as any).updateItem(state.boardId!, state.itemId!, { fields: { status: "qualified" } }),
      /* expectFail */ true)
    // Canonical updateItem
    if (state.identifierFieldId) {
      await step("boards.updateItem (canonical shape)", () =>
        (client.boards as any).updateItem(state.boardId!, state.itemId!, {
          data: [{ key: state.identifierFieldId!, value: `Acme Corp — qualified ${ts}` }],
        }),
      )
    }
    await step("boards.deleteItem", () => (client.boards as any).deleteItem(state.boardId!, state.itemId!))
    state.itemId = null
  } else {
    skipped("boards.getItem / updateItem / deleteItem", "no item fixture")
  }

  // bulkDeleteItems needs real ids; backend rejects empty list with 400.
  skipped("boards.bulkDeleteItems", "needs real item ids — backend rejects empty list with 400")
} else {
  skipped("§2 items lifecycle", "no board fixture")
}

// ── §3. Search ────────────────────────────────────────────────────────────

section("§3. Search")
if (state.boardId) {
  await step("boards.search (q='enterprise')",
    () => (client.boards as any).search(state.boardId!, { q: "enterprise" }))
} else {
  skipped("boards.search", "no board fixture")
}

// ── §4. Fields, Segments & Export ────────────────────────────────────────

section("§4. Fields, Segments & Export")
note("doc-gap: databoard.md §4 createField uses `type: \"number\"` (lowercase) — SDK 1.0.4 backend expects `\"Number\"` (capitalised). Same for `ShortText`, `LongText`, etc.")

if (state.boardId) {
  // Doc-shape lowercase type — likely fails 400
  await step("boards.createField (doc shape — type='number' lowercase)",
    () => client.boards.createField(state.boardId!, { name: "Deal Value", type: "number" } as any),
    /* expectFail */ true)

  // Canonical capitalised type
  await step("boards.createField (canonical — Number)", async () => {
    const f: any = await client.boards.createField(state.boardId!, { name: "Contract Value", type: "Number" } as any)
    const newField = (f?.fields ?? []).find((x: any) => x?.name === "Contract Value")
    state.numberFieldId = newField?._id ?? null
    return { id: state.numberFieldId }
  })

  if (state.numberFieldId) {
    await step("boards.updateField (rename)",
      () => (client.boards as any).updateField(state.boardId!, state.numberFieldId!, { name: "Contract Value v2" }))
    await step("boards.deleteField",
      () => (client.boards as any).deleteField(state.boardId!, state.numberFieldId!))
    state.numberFieldId = null
  } else {
    skipped("boards.updateField / deleteField", "no field fixture")
  }

  // Segments
  await step("boards.listSegments",
    () => (client.boards as any).listSegments(state.boardId!))
  await step("boards.createSegment", async () => {
    const s: any = await (client.boards as any).createSegment(state.boardId!, {
      name: `High Value Leads ${ts}`,
      filter: { field: "value", op: "gt", value: 10000 },
    })
    state.segmentId = s?._id ?? s?.id ?? null
    return { id: state.segmentId }
  })

  await step("boards.exportCsv",
    () => (client.boards as any).exportCsv(state.boardId!))
}

// ── Cleanup ───────────────────────────────────────────────────────────────

section("cleanup")
if (state.boardId) {
  await step("boards.delete (cleanup)", () => client.boards.delete(state.boardId!))
}

// ── Summary ───────────────────────────────────────────────────────────────

console.log(`\n━━━ Summary (databoard / API key) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
if (docGaps.length) { console.log("Doc gaps to fix:"); docGaps.forEach(g => console.log(`  - ${g}`)) }
process.exit(fail > 0 ? 1 : 0)
