import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ContactsResource } from "../../../src/resources/contacts.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

// base = gateway/channel-service (no version — resource adds /v1)
const BASE = "https://app-gateway.dev.imbrace.co/channel-service"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new ContactsResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("ContactsResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("list() calls GET /channel-service/v1/contacts", async () => {
    mockFetch({ data: [{ _id: "c_1", name: "Alice" }] })
    await makeResource().list()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/contacts")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("list() passes pagination params", async () => {
    mockFetch({ data: [] })
    await makeResource().list({ limit: 10, skip: 5 })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.searchParams.get("limit")).toBe("10")
    expect(url.searchParams.get("skip")).toBe("5")
  })

  it("search() calls GET /channel-service/v1/contacts/_search with query object", async () => {
    mockFetch({ data: [] })
    await makeResource().search({ q: "alice" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/contacts/_search")
    expect(url.searchParams.get("q")).toBe("alice")
  })

  it("update() calls PUT /channel-service/v1/contacts/:id", async () => {
    mockFetch({ _id: "c_1" })
    await makeResource().update("c_1", { name: "Bob" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/contacts/c_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("PUT")
  })

  it("getConversations() calls GET /channel-service/v1/contacts/:id/conversations", async () => {
    mockFetch({ data: [] })
    await makeResource().getConversations("c_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/contacts/c_1/conversations")
  })

  it("listNotifications() calls GET /channel-service/v1/notifications", async () => {
    mockFetch({ data: [] })
    await makeResource().listNotifications()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/notifications")
  })

  it("markNotificationsRead() calls PUT /channel-service/v1/notifications/read", async () => {
    mockFetch({ success: true })
    await makeResource().markNotificationsRead(["n_1", "n_2"])
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/notifications/read")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("PUT")
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body.notification_id).toEqual(["n_1", "n_2"])
  })
})
