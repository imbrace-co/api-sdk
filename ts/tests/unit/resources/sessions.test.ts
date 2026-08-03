import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SessionsResource } from "../../../src/resources/sessions.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const BASE = "https://app-gatewayv2.imbrace.co"

function makeResource() {
  const tm = new TokenManager()
  const http = new HttpTransport({ timeout: 5000, tokenManager: tm })
  return new SessionsResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status })
  )
}

describe("SessionsResource", () => {
  let originalFetch: typeof fetch

  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("list() calls GET /session", async () => {
    mockFetch([{ id: "s1" }])
    const res = await makeResource().list()
    expect(res).toEqual([{ id: "s1" }])
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL).toString())
    expect(url.pathname).toBe("/session")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("list() passes directory param", async () => {
    mockFetch([])
    await makeResource().list({ directory: "/my/path" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL).toString())
    expect(url.searchParams.get("directory")).toBeTruthy()
  })

  it("get() calls GET /session/:id", async () => {
    mockFetch({ id: "s1" })
    const res = await makeResource().get("s1")
    expect(res).toEqual({ id: "s1" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/session/s1")
  })

  it("create() calls POST /session", async () => {
    mockFetch({ id: "s_new" })
    const res = await makeResource().create({})
    expect(res).toEqual({ id: "s_new" })
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })

  it("delete() calls DELETE /session/:id", async () => {
    mockFetch({ deleted: true })
    const res = await makeResource().delete("s1")
    expect(res).toEqual({ deleted: true })
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })
})
