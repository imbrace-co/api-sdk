import { describe, it, expect, vi, afterEach } from "vitest"
import { ImbraceClient } from "../../../src/client.js"

const gw = "https://app-gateway.dev.imbrace.co"
const base = `${gw}/ai-agent/dociq`
type Call = { url: string; method: string; body?: any }

function mockFetch(route: (c: Call) => { status?: number; body?: unknown }) {
  const calls: Call[] = []
  globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const c: Call = { url: String(input), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined }
    calls.push(c)
    const r = route(c)
    return new Response(r.body === undefined ? "" : JSON.stringify(r.body), { status: r.status ?? 200 })
  })
  return calls
}

const client = () => new ImbraceClient({ env: "develop", apiKey: "key" })
const wrap = (data: unknown) => ({ success: true, data, timestamp: "2026-11-11T00:00:00Z" })
const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

describe("dociq", () => {
  it("ingest posts the files and unwraps the submissions", async () => {
    const calls = mockFetch(() => ({ status: 202, body: wrap({ submissions: [{ id: "s1", correlationId: "dociq-page-1", status: "pending" }] }) }))
    const res = await client().dociq.ingest({
      files: [{ url: "files/download/abc.pdf", mime_type: "application/pdf", name: "invoice.pdf" }],
      assistant_id: "asst_1",
      source: { channel: "whatsapp", conversation_id: "conv_1" },
    })
    expect(calls[0]).toMatchObject({ method: "POST", url: `${base}/ingest` })
    expect(calls[0].body).toEqual({
      files: [{ url: "files/download/abc.pdf", mime_type: "application/pdf", name: "invoice.pdf" }],
      assistant_id: "asst_1",
      source: { channel: "whatsapp", conversation_id: "conv_1" },
    })
    expect(res.submissions[0].id).toBe("s1")
  })

  it("listSubmissions builds the query: comma-joined ids, ISO dates, nothing for unset keys", async () => {
    const calls = mockFetch(() => ({ body: wrap({ submissions: [], total: 0, limit: 5, skip: 0 }) }))
    await client().dociq.listSubmissions({
      limit: 5, status: "succeeded", documentModelIds: ["m1", "m2"],
      from: new Date("2026-11-01T00:00:00Z"), search: undefined,
    })
    const url = new URL(calls[0].url)
    expect(url.pathname).toBe("/ai-agent/dociq/submissions")
    expect(Object.fromEntries(url.searchParams)).toEqual({
      limit: "5", status: "succeeded", documentModelIds: "m1,m2", from: "2026-11-01T00:00:00.000Z",
    })
  })

  it("listSubmissions without params has no query string", async () => {
    const calls = mockFetch(() => ({ body: wrap({ submissions: [], total: 0, limit: 10, skip: 0 }) }))
    const res = await client().dociq.listSubmissions()
    expect(calls[0].url).toBe(`${base}/submissions`)
    expect(res.total).toBe(0)
  })

  it("getSubmission, getSubmissionByFile, deleteSubmission and createModelFromSubmission hit their paths", async () => {
    const calls = mockFetch(c => {
      if (c.method === "DELETE") return { body: wrap({ id: "s1", deleted: true }) }
      if (c.url.endsWith("/create-model")) return { status: 201, body: wrap({ schema: { id: "m9" } }) }
      return { body: wrap({ id: "s1", status: "succeeded", outcome: "saved", extractedData: { total: 10 } }) }
    })
    const c = client()
    const detail = await c.dociq.getSubmission("s1")
    await c.dociq.getSubmissionByFile("INV-2026/001")
    const del = await c.dociq.deleteSubmission("s1")
    const created = await c.dociq.createModelFromSubmission("s1", { name: "Invoice", category: "cat1" })
    expect(calls.map(x => `${x.method} ${x.url}`)).toEqual([
      `GET ${base}/submissions/s1`,
      `GET ${base}/submissions/by-file/INV-2026%2F001`,
      `DELETE ${base}/submissions/s1`,
      `POST ${base}/submissions/s1/create-model`,
    ])
    expect(detail.extractedData).toEqual({ total: 10 })
    expect(del.deleted).toBe(true)
    expect(calls[3].body).toEqual({ name: "Invoice", category: "cat1" })
    expect(created.schema.id).toBe("m9")
  })

  it("surfaces a 400 from the service as an error", async () => {
    mockFetch(() => ({ status: 400, body: { success: false, error: "Missing x-user-id — required for the automatic board write" } }))
    await expect(client().dociq.ingest({ files: [{ url: "u", mime_type: "application/pdf" }] })).rejects.toThrow("400")
  })
})
