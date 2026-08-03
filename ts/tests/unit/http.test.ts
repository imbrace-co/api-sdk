import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { HttpTransport } from "../../src/http.js"
import { TokenManager } from "../../src/auth/token-manager.js"
import { AuthError, ApiError, NetworkError } from "../../src/errors.js"

const BASE = "https://app-gatewayv2.imbrace.co"

function makeTransport(opts: { apiKey?: string; token?: string; organizationId?: string } = {}) {
  const tokenManager = new TokenManager(opts.token)
  return new HttpTransport({ apiKey: opts.apiKey, timeout: 5000, tokenManager, organizationId: opts.organizationId })
}

describe("HttpTransport", () => {
  let originalFetch: typeof fetch

  beforeEach(() => {
    originalFetch = globalThis.fetch
    vi.useFakeTimers()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it("sets X-Api-Key header when apiKey provided", async () => {
    const transport = makeTransport({ apiKey: "key_test" })
    const capturedHeaders: Record<string, string> = {}

    globalThis.fetch = vi.fn().mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const h = init?.headers as Headers
      h.forEach((v, k) => { capturedHeaders[k] = v })
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })

    await transport.getFetch()(BASE + "/health", { method: "GET" })
    expect(capturedHeaders["x-api-key"]).toBe("key_test")
    expect(capturedHeaders["x-access-token"]).toBeUndefined()
  })

  it("sets x-access-token when token set without organizationId (legacy mode)", async () => {
    const transport = makeTransport({ token: "tok_test" })
    const capturedHeaders: Record<string, string> = {}

    globalThis.fetch = vi.fn().mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const h = init?.headers as Headers
      h.forEach((v, k) => { capturedHeaders[k] = v })
      return new Response("{}", { status: 200 })
    })

    await transport.getFetch()(BASE + "/health", { method: "GET" })
    expect(capturedHeaders["x-access-token"]).toBe("tok_test")
    expect(capturedHeaders["authorization"]).toBeUndefined()
  })

  it("does not set Authorization header when no token", async () => {
    const transport = makeTransport()
    const capturedHeaders: Record<string, string> = {}

    globalThis.fetch = vi.fn().mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const h = init?.headers as Headers
      h.forEach((v, k) => { capturedHeaders[k] = v })
      return new Response("{}", { status: 200 })
    })

    await transport.getFetch()(BASE + "/health", { method: "GET" })
    expect(capturedHeaders["authorization"]).toBeUndefined()
  })

  it("sends x-api-key + x-access-token in parallel when both credentials are set", async () => {
    // The transport always forwards x-api-key when set, AND forwards
    // x-access-token (or Authorization for JWTs) when a token is set —
    // they are independent. The gateway's authRouter then dispatches
    // based on which header is present (api-key takes priority).
    const transport = makeTransport({ apiKey: "key_test", token: "tok_test" })
    const capturedHeaders: Record<string, string> = {}

    globalThis.fetch = vi.fn().mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const h = init?.headers as Headers
      h.forEach((v, k) => { capturedHeaders[k] = v })
      return new Response("{}", { status: 200 })
    })

    await transport.getFetch()(BASE + "/health", { method: "GET" })
    expect(capturedHeaders["x-api-key"]).toBe("key_test")
    expect(capturedHeaders["x-access-token"]).toBe("tok_test")
    // No JWT (and no organizationId), so Authorization Bearer is NOT set.
    expect(capturedHeaders["authorization"]).toBeUndefined()
  })

  it("JWT Bearer mode: token + organizationId sends Authorization + x-organization-id", async () => {
    const fakeJwt = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyXzEifQ.signature"
    const transport = makeTransport({ token: fakeJwt, organizationId: "org_123" })
    const capturedHeaders: Record<string, string> = {}

    globalThis.fetch = vi.fn().mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const h = init?.headers as Headers
      h.forEach((v, k) => { capturedHeaders[k] = v })
      return new Response("{}", { status: 200 })
    })

    await transport.getFetch()(BASE + "/health", { method: "GET" })
    expect(capturedHeaders["authorization"]).toBe(`Bearer ${fakeJwt}`)
    expect(capturedHeaders["x-organization-id"]).toBe("org_123")
    expect(capturedHeaders["x-access-token"]).toBeUndefined()
    expect(capturedHeaders["x-api-key"]).toBeUndefined()
  })

  it("throws AuthError on 401", async () => {
    const transport = makeTransport()
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("Unauthorized", { status: 401 }))

    await expect(transport.getFetch()(BASE + "/session")).rejects.toBeInstanceOf(AuthError)
  })

  it("throws AuthError on 403", async () => {
    const transport = makeTransport()
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("Forbidden", { status: 403 }))

    await expect(transport.getFetch()(BASE + "/session")).rejects.toBeInstanceOf(AuthError)
  })

  it("throws ApiError on 404", async () => {
    const transport = makeTransport()
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("Not Found", { status: 404 })
    )

    await expect(transport.getFetch()(BASE + "/missing")).rejects.toBeInstanceOf(ApiError)
  })

  it("retries on 500 and throws after max retries", async () => {
    const transport = makeTransport()
    const fetchMock = vi.fn().mockResolvedValue(new Response("Server Error", { status: 500 }))
    globalThis.fetch = fetchMock

    // Attach rejection handler before advancing timers to avoid unhandled rejection warning
    const captured = transport.getFetch()(BASE + "/session").catch((e: unknown) => e)
    await vi.runAllTimersAsync()

    const err = await captured
    expect(err).toBeInstanceOf(ApiError)
    // 1 initial + 3 retries = 4 total calls
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it("throws NetworkError when fetch throws", async () => {
    const transport = makeTransport()
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))

    const captured = transport.getFetch()(BASE + "/session").catch((e: unknown) => e)
    await vi.runAllTimersAsync()

    const err = await captured
    expect(err).toBeInstanceOf(NetworkError)
  })

  it("returns response on 200", async () => {
    const transport = makeTransport()
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "ok" }), { status: 200 }))

    const res = await transport.getFetch()(BASE + "/health")
    const data = await res.json()
    expect(data.status).toBe("ok")
  })
})
