import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { HttpTransport, parseRetryAfter } from "../../src/http.js"
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

describe("HttpTransport retry and cancellation options", () => {
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

  function transportWith(extra: { maxRetries?: number; fetch?: typeof fetch } = {}) {
    return new HttpTransport({ timeout: 5000, tokenManager: new TokenManager(), ...extra })
  }

  it("maxRetries: 0 makes exactly one attempt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("Server Error", { status: 500 }))
    globalThis.fetch = fetchMock

    const captured = transportWith({ maxRetries: 0 }).getFetch()(BASE + "/session").catch((e: unknown) => e)
    await vi.runAllTimersAsync()

    expect(await captured).toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("maxRetries caps retries on 429", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => new Response("slow down", { status: 429 }))
    globalThis.fetch = fetchMock

    const captured = transportWith({ maxRetries: 1 }).getFetch()(BASE + "/x", { method: "POST" }).catch((e: unknown) => e)
    await vi.runAllTimersAsync()

    expect(await captured).toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("waits for Retry-After seconds instead of the backoff", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 429, headers: { "Retry-After": "5" } }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
    globalThis.fetch = fetchMock

    const pending = transportWith().getFetch()(BASE + "/x")
    await vi.advanceTimersByTimeAsync(4999)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect((await pending).status).toBe(200)
  })

  it("waits until a Retry-After HTTP-date", async () => {
    vi.setSystemTime(new Date("2026-10-30T00:00:00Z"))
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("", { status: 503, headers: { "Retry-After": "Fri, 30 Oct 2026 00:00:10 GMT" } }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
    globalThis.fetch = fetchMock

    const pending = transportWith().getFetch()(BASE + "/x")
    await vi.advanceTimersByTimeAsync(9999)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect((await pending).status).toBe(200)
  })

  it("surfaces the error when Retry-After is longer than 60s", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("busy", { status: 429, headers: { "Retry-After": "120" } }))
    globalThis.fetch = fetchMock

    const err = await transportWith().getFetch()(BASE + "/x").catch((e: unknown) => e)

    expect(err).toBeInstanceOf(ApiError)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("parseRetryAfter ignores values it cannot read", () => {
    expect(parseRetryAfter(null)).toBeUndefined()
    expect(parseRetryAfter("soon")).toBeUndefined()
    expect(parseRetryAfter("3")).toBe(3000)
  })

  it("uses the configured fetch for every request", async () => {
    const globalMock = vi.fn()
    globalThis.fetch = globalMock
    const custom = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))

    await transportWith({ fetch: custom }).getFetch()(BASE + "/health")

    expect(custom).toHaveBeenCalledTimes(1)
    expect(globalMock).not.toHaveBeenCalled()
  })

  it("an abort during the retry wait rejects at once without another attempt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 503 }))
    globalThis.fetch = fetchMock
    const ac = new AbortController()

    const captured = transportWith().getFetch()(BASE + "/x", { signal: ac.signal }).catch((e: unknown) => e)
    await vi.advanceTimersByTimeAsync(10)
    ac.abort()
    const err = await captured

    expect(err).toBeInstanceOf(NetworkError)
    expect((err as Error).message).toBe("Request aborted by user")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("an abort after the headers arrive still cancels the response body", async () => {
    let requestSignal: AbortSignal | undefined
    globalThis.fetch = vi.fn().mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestSignal = init?.signal ?? undefined
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("data: first\n\n"))
          requestSignal?.addEventListener("abort", () => controller.error(new DOMException("aborted", "AbortError")))
        },
      })
      return new Response(body, { status: 200 })
    })
    const ac = new AbortController()

    const res = await transportWith().getFetch()(BASE + "/v2/chat", { method: "POST", signal: ac.signal })
    const reader = res.body!.getReader()
    await reader.read()
    ac.abort()

    expect(requestSignal?.aborted).toBe(true)
    await expect(reader.read()).rejects.toMatchObject({ name: "AbortError" })
  })
})
