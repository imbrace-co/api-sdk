import { describe, it, expect, vi, afterEach } from "vitest"
import { ImbraceClient } from "../../../src/client.js"

const gw = "https://app-gateway.dev.imbrace.co"
const logs = `${gw}/platform/v1/audit-logs`
const archives = `${gw}/platform/v1/audit-archives`
type Call = { url: string; method: string; body?: any }

function mockFetch(route: (c: Call) => Response) {
  const calls: Call[] = []
  globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const c: Call = { url: String(input), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined }
    calls.push(c)
    return route(c)
  })
  return calls
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const client = () => new ImbraceClient({ env: "develop", apiKey: "key" })
const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

describe("auditLogs", () => {
  it("list sends the new filters and joins multi-value ones", async () => {
    const calls = mockFetch(() => json({ data: [], pagination: { hasMore: false } }))
    await client().auditLogs.list({
      resource: ["user", "role"], action: "login_failed", categoryId: "cat1", runId: "run1", caseId: ["c1", "c2"],
      includeArchive: true, limit: 10,
    })
    const url = new URL(calls[0].url)
    expect(url.origin + url.pathname).toBe(logs)
    expect(Object.fromEntries(url.searchParams)).toEqual({
      resource: "user,role", action: "login_failed", categoryId: "cat1", runId: "run1", caseId: "c1,c2",
      includeArchive: "true", limit: "10",
    })
  })

  it("summary takes the same filters", async () => {
    const calls = mockFetch(() => json({ data: { total: 3 } }))
    const res = await client().auditLogs.summary({ from: "2026-11-01", resource: ["board", "board_item"], boardId: "b1" })
    expect(Object.fromEntries(new URL(calls[0].url).searchParams)).toEqual({ from: "2026-11-01", resource: "board,board_item", boardId: "b1" })
    expect(res).toEqual({ total: 3 })
  })

  it("iterate follows nextCursor until hasMore is false", async () => {
    const calls = mockFetch(c => {
      const cursor = new URL(c.url).searchParams.get("cursor")
      if (!cursor) return json({ data: [{ id: "a" }, { id: "b" }], pagination: { hasMore: true, nextCursor: "cur2" } })
      return json({ data: [{ id: "c" }], pagination: { hasMore: false, nextCursor: null } })
    })
    const ids: string[] = []
    for await (const e of client().auditLogs.iterate({ resource: "user" })) ids.push(e.id)
    expect(ids).toEqual(["a", "b", "c"])
    expect(calls.map(x => new URL(x.url).searchParams.get("cursor"))).toEqual([null, "cur2"])
    expect(new URL(calls[0].url).searchParams.get("limit")).toBe("100")
  })
})

describe("auditArchives", () => {
  it("list, getPolicy and setPolicy unwrap their bodies", async () => {
    const retention = { hotMonths: 3, totalMonths: 12, canEdit: true }
    const calls = mockFetch(c => {
      if (c.method === "PUT") return json({ data: { archiveMonths: 9 }, outcome: "increased", retention })
      if (c.url.endsWith("/policy")) return json({ data: retention })
      return json({ data: { hotFrom: "2026-09", archives: [{ month: "2026-05", status: "archived" }], retention } })
    })
    const c = client()
    const listing = await c.auditArchives.list()
    const policy = await c.auditArchives.getPolicy()
    const change = await c.auditArchives.setPolicy({ totalMonths: 12 })
    expect(calls.map(x => `${x.method} ${x.url}`)).toEqual([`GET ${archives}`, `GET ${archives}/policy`, `PUT ${archives}/policy`])
    expect(calls[2].body).toEqual({ totalMonths: 12 })
    expect(listing.archives[0].month).toBe("2026-05")
    expect(policy.totalMonths).toBe(12)
    expect(change).toEqual({ policy: { archiveMonths: 9 }, outcome: "increased", retention })
  })

  it("cancelPendingPolicy, restore, extend and release hit their paths", async () => {
    const calls = mockFetch(c => {
      if (c.method === "DELETE") return json({ data: { archiveMonths: 12 }, outcome: "cancelled", retention: {} })
      if (c.url.endsWith("/restore")) return json({ data: { status: "accepted", months: ["2026-05"], alreadyRestored: [], expiresAt: "x" } }, 202)
      if (c.url.endsWith("/extend")) return json({ data: { status: "ok", month: "2026-05", expiresAt: "y", capped: false } })
      return json({ data: { status: "ok", month: "2026-05" } })
    })
    const c = client()
    expect((await c.auditArchives.cancelPendingPolicy()).outcome).toBe("cancelled")
    expect((await c.auditArchives.restore({ from: "2026-05", to: "2026-06" })).months).toEqual(["2026-05"])
    expect((await c.auditArchives.extend("2026-05", 7)).capped).toBe(false)
    expect((await c.auditArchives.release("2026-05")).status).toBe("ok")
    expect(calls.map(x => `${x.method} ${x.url}`)).toEqual([
      `DELETE ${archives}/policy/pending`,
      `POST ${archives}/restore`,
      `POST ${archives}/2026-05/extend`,
      `POST ${archives}/2026-05/release`,
    ])
    expect(calls[1].body).toEqual({ from: "2026-05", to: "2026-06" })
    expect(calls[2].body).toEqual({ days: 7 })
  })

  it("download returns the bytes, the file name and the hash", async () => {
    const bytes = new Uint8Array([31, 139, 8, 0])
    const calls = mockFetch(() => new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": 'attachment; filename="audit-org-2026-05.jsonl.gz"',
        "X-Archive-Sha256": "abc123",
        "X-Archive-Filtered": "resource",
      },
    }))
    const file = await client().auditArchives.download("2026-05", { resource: ["user", "role"] })
    expect(calls[0].url).toBe(`${archives}/2026-05/download?resource=user%2Crole`)
    expect(new Uint8Array(file.data)).toEqual(bytes)
    expect(file).toMatchObject({ filename: "audit-org-2026-05.jsonl.gz", sha256: "abc123", filtered: true })
  })

  it("surfaces a refusal (409) as an error", async () => {
    mockFetch(() => json({ error: "2026-11 is still in the live window", code: "live_month" }, 409))
    await expect(client().auditArchives.restore({ from: "2026-11" })).rejects.toThrow("409")
  })
})
