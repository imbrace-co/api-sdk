import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AccountResource } from "../../../src/resources/account.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const BASE = "https://app-gatewayv2.imbrace.co"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new AccountResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("AccountResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("getAccount() calls GET /v1/account", async () => {
    mockFetch({ id: "acc_1", name: "Test Account" })
    const res = await makeResource().getAccount()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/v1/account")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
    expect(res.name).toBe("Test Account")
  })

  it("sends x-api-key header", async () => {
    mockFetch({})
    await makeResource().getAccount()
    const headers = new Headers(vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit)
    expect(headers.get("x-api-key")).toBe("test_key")
  })
})
