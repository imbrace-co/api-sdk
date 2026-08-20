import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { BoardsResource } from "../../../src/resources/boards.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const GW      = "https://app-gatewayv2.imbrace.co"
const BASE    = `${GW}/data-board`
const BACKEND = `${GW}/v1/backend`

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new BoardsResource(http, BASE, BACKEND)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("BoardsResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("list() calls GET /data-board/boards", async () => {
    mockFetch({ data: [{ id: "b_1", name: "CRM" }] })
    const res = await makeResource().list()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/boards")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
    expect(res.data[0].name).toBe("CRM")
  })

  it("get() calls GET /data-board/boards/:id", async () => {
    mockFetch({ id: "b_1" })
    await makeResource().get("b_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/boards/b_1")
  })

  it("create() calls POST /data-board/boards with body", async () => {
    mockFetch({ id: "b_new", name: "My Board" })
    const res = await makeResource().create({ name: "My Board", description: "Test" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/boards")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body.name).toBe("My Board")
    expect(res.id).toBe("b_new")
  })

  it("create() with type='DocumentAI' + fields embeds extraction schema", async () => {
    mockFetch({ _id: "brd_x", name: "DEMO", type: "DocumentAI" })
    const fields = [
      { name: "invoice_number", type: "ShortText", is_identifier: true, data: [] },
      { name: "total_amount", type: "Number", data: [] },
    ]
    await makeResource().create({
      name: "DEMO",
      description: "Receipt extractor",
      type: "DocumentAI",
      fields,
      team_ids: [],
      show_id: false,
    })
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body.name).toBe("DEMO")
    expect(body.description).toBe("Receipt extractor")
    expect(body.type).toBe("DocumentAI")
    expect(body.fields).toEqual(fields)
    expect(body.team_ids).toEqual([])
    expect(body.show_id).toBe(false)
  })

  it("create() forwards arbitrary extra fields", async () => {
    mockFetch({ id: "b_3" })
    await makeResource().create({ name: "X", workflow_id: "wf_1", managers: ["u1"] })
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body.workflow_id).toBe("wf_1")
    expect(body.managers).toEqual(["u1"])
  })

  it("delete() calls DELETE /data-board/boards/:id", async () => {
    mockFetch({ success: true })
    await makeResource().delete("b_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/boards/b_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("listItems() calls GET /data-board/boards/:id/items", async () => {
    mockFetch({ data: [{ id: "bi_1" }] })
    const res = await makeResource().listItems("b_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/boards/b_1/items")
    expect(res.data.length).toBe(1)
  })

  it("createItem() calls POST /data-board/boards/:id/items", async () => {
    mockFetch({ id: "bi_new" })
    await makeResource().createItem("b_1", { fields: { name: "Test" } })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/boards/b_1/items")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })

  it("deleteItem() calls DELETE /data-board/boards/:id/items/:itemId", async () => {
    mockFetch({})
    await makeResource().deleteItem("b_1", "bi_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/boards/b_1/items/bi_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("createField() calls POST /data-board/boards/:id/fields", async () => {
    mockFetch({ _id: "f_1", name: "Status", type: "select" })
    await makeResource().createField("b_1", { name: "Status", type: "select" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/boards/b_1/fields")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })

  it("search() calls POST /data-board/search/:id and returns the meili envelope", async () => {
    mockFetch({ success: true, message: { hits: [{ id: "i_1" }], estimatedTotalHits: 1 } })
    const res = await makeResource().search("b_1", { q: "test" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/search/b_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
    expect(res.success).toBe(true)
    expect(res.message.hits).toHaveLength(1)
  })

  it("bulkDeleteItems() calls DELETE /data-board/boards/:id/items/bulk-delete", async () => {
    mockFetch({ success: true })
    await makeResource().bulkDeleteItems("b_1", { ids: ["bi_1", "bi_2"] })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/boards/b_1/items/bulk-delete")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("linkItems() calls POST /data-board/boards/:id/items/:itemId/related with relatedBoardId+relatedItemIds", async () => {
    mockFetch({ success: true })
    await makeResource().linkItems("b_1", "bi_1", "b_2", { relatedItemIds: ["bi_2"] })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/boards/b_1/items/bi_1/related")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body.relatedBoardId).toBe("b_2")
    expect(body.relatedItemIds).toEqual(["bi_2"])
  })

  it("searchFolders() calls GET /data-board/folders/search (KnowledgeHub)", async () => {
    mockFetch([])
    await makeResource().searchFolders({ organizationId: "org_1", q: "docs" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/data-board/folders/search")
    expect(url.searchParams.get("organization_id")).toBe("org_1")
  })
})
