import { describe, it, expect, vi, afterEach } from "vitest"
import { ImbraceClient } from "../../../src/client.js"
import { DataIqError } from "../../../src/resources/dataiq.js"

const v2 = "https://app-gateway.dev.imbrace.co/data-board/v2"
type Call = { url: string; method: string; body?: any }

function mockFetch(route: (c: Call) => { status?: number; body?: unknown }) {
  const calls: Call[] = []
  globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const c: Call = { url: String(input), method: init?.method ?? "GET", body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined }
    calls.push(c)
    const r = route(c)
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status ?? 200 })
  })
  return calls
}

const client = () => new ImbraceClient({ env: "develop", apiKey: "key" })
const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

describe("dataiq (DataIQ v2)", () => {
  it("calls /data-board/v2 and unwraps { data }", async () => {
    const calls = mockFetch(() => ({ body: { data: { id: "b1", fields: [] } } }))
    const board = await client().dataiq.boards.get("b1")
    expect(calls[0].url).toBe(`${v2}/boards/b1`)
    expect(board.id).toBe("b1")
  })

  it("repeats array filters and joins id lists", async () => {
    const calls = mockFetch(() => ({ body: { data: {}, count: 2 } }))
    const c = client()
    await c.dataiq.boards.list({ types: ["General", "CRM"], limit: 5 })
    await c.dataiq.boards.stats(["a", "b"])
    await c.dataiq.items.deleteMany("b1", ["i1", "i2"])
    expect(calls.map(x => decodeURIComponent(x.url))).toEqual([
      `${v2}/boards?types=General&types=CRM&limit=5`,
      `${v2}/boards/stats?ids=a,b`,
      `${v2}/boards/b1/items/bulk-delete?ids=i1,i2`,
    ])
  })

  it("sends typed filters and SQL in the body", async () => {
    const calls = mockFetch(() => ({ body: { data: [], total: 0 } }))
    const c = client()
    await c.dataiq.items.query("b1", { filter: { match: "and", rules: [{ fieldId: "f1", op: "gte", value: 100 }] }, limit: 10 })
    await c.dataiq.sql.run("select 1", { limit: 5 })
    expect(calls[0]).toMatchObject({ method: "POST", url: `${v2}/boards/b1/items/query`, body: { filter: { match: "and" }, limit: 10 } })
    expect(calls[1]).toMatchObject({ method: "POST", url: `${v2}/sql`, body: { sql: "select 1", limit: 5 } })
  })

  it("fields.add returns the new field from the board", async () => {
    mockFetch(() => ({ body: { data: { id: "b1", fields: [{ id: "f1", name: "Title" }, { id: "f2", name: "Status" }] } } }))
    expect((await client().dataiq.fields.add("b1", { name: "Status", type: "SingleSelection" })).id).toBe("f2")
  })

  it("returns undefined on 204", async () => {
    mockFetch(() => ({ status: 204 }))
    await expect(client().dataiq.sql.deleteQuery("q1")).resolves.toBeUndefined()
  })

  it("maps the plan limit (402) to DataIqError", async () => {
    mockFetch(() => ({ status: 402, body: { error: "records_per_board" } }))
    const err = await client().dataiq.items.create("b1", { fields: {} }).catch(e => e)
    expect(err).toBeInstanceOf(DataIqError)
    expect(err.code).toBe("plan_limit")
  })

  it("maps View-Only (403 read_only) to DataIqError", async () => {
    mockFetch(() => ({ status: 403, body: { code: "read_only" } }))
    const err = await client().dataiq.items.update("b1", "i1", {}).catch(e => e)
    expect(err).toBeInstanceOf(DataIqError)
    expect(err.code).toBe("read_only")
  })
})
