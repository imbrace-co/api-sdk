import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ChannelResource } from "../../../src/resources/channel.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const BASE = "https://app-gatewayv2.imbrace.co"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new ChannelResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("ChannelResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("list() calls GET /v1/channels", async () => {
    mockFetch({ data: [{ _id: "ch_1", name: "Web" }] })
    await makeResource().list()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/v1/channels")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("list() passes type query param", async () => {
    mockFetch({ data: [] })
    await makeResource().list({ type: "web" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.searchParams.get("type")).toBe("web")
  })

  it("getCount() calls GET /v1/channels/_count", async () => {
    mockFetch({ count: 5 })
    await makeResource().getCount()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/v1/channels/_count")
  })

  it("get() calls GET /v1/channels/:id", async () => {
    mockFetch({ _id: "ch_1" })
    await makeResource().get("ch_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/v1/channels/ch_1")
  })

  it("delete() calls DELETE /v1/channels/:id", async () => {
    mockFetch({})
    await makeResource().delete("ch_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("getConvCount() calls GET /v1/channels/_conv_count", async () => {
    mockFetch({ total: 10 })
    await makeResource().getConvCount({ view: "all" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/v1/channels/_conv_count")
    expect(url.searchParams.get("view")).toBe("all")
  })
})
