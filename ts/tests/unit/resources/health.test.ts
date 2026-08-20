import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { HealthResource } from "../../../src/resources/health.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const BASE = "https://app-gatewayv2.imbrace.co"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new HealthResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("HealthResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("check() calls GET / on gateway root", async () => {
    mockFetch({ name: "App Gateway Public Server", version: "1.0.0" })
    await makeResource().check()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("check() returns response data", async () => {
    mockFetch({ name: "App Gateway Public Server", version: "1.0.0" })
    const res = await makeResource().check()
    expect(res.name).toBe("App Gateway Public Server")
  })

  it("sends x-api-key header", async () => {
    mockFetch({})
    await makeResource().check()
    const headers = new Headers(vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit)
    expect(headers.get("x-api-key")).toBe("test_key")
  })

})
