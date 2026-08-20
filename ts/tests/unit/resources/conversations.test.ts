import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ConversationsResource } from "../../../src/resources/conversations.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

// base = gateway/channel-service (no version — resource adds /v1 or /v2)
const BASE = "https://app-gateway.dev.imbrace.co/channel-service"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new ConversationsResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("ConversationsResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("getViewsCount() — no args calls GET /channel-service/v1/team_conversations/_views_count (org-scoped)", async () => {
    mockFetch({ all: 975, yours: 293, closed: 61 })
    const res = await makeResource().getViewsCount()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/team_conversations/_views_count")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
    expect(res.all).toBe(975)
  })

  it("getViewsCount({ businessUnitId }) calls v2 with type+q query", async () => {
    mockFetch({ all: 10 })
    await makeResource().getViewsCount({ businessUnitId: "bu_1" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL))
    expect(url.pathname).toBe("/channel-service/v2/team_conversations/_views_count")
    expect(url.searchParams.get("type")).toBe("business_unit_id")
    expect(url.searchParams.get("q")).toBe("bu_1")
  })

  it("list() calls GET /channel-service/v2/team_conversations", async () => {
    mockFetch({ data: [], total: 0 })
    await makeResource().list()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v2/team_conversations")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("get() calls GET /channel-service/v1/team_conversations/:id", async () => {
    mockFetch({ id: "conv_123", status: "active" })
    const res = await makeResource().get("conv_123")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/team_conversations/conv_123")
    expect(res.id).toBe("conv_123")
  })

  it("search() calls GET /channel-service/v1/team_conversations/_search with params", async () => {
    mockFetch({ data: [] })
    await makeResource().search({ businessUnitId: "bu_1", q: "hello", limit: 20 })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/team_conversations/_search")
    expect(url.searchParams.get("q")).toBe("hello")
    expect(url.searchParams.get("limit")).toBe("20")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("create() calls POST /channel-service/v1/conversations", async () => {
    mockFetch({ id: "conv_new" })
    await makeResource().create()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/conversations")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })
})
