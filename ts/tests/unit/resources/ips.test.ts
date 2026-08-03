import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { IpsResource } from "../../../src/resources/ips.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const BASE = "https://app-gatewayv2.imbrace.co/ips/v1"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new IpsResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("IpsResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  // ─── Profiles   

  it("getProfile() calls GET /ips/v1/profiles/:userId", async () => {
    mockFetch({ _id: "u_1", displayName: "Alice" })
    await makeResource().getProfile("u_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/ips/v1/profiles/u_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("getMyProfile() calls GET /ips/v1/profiles/me", async () => {
    mockFetch({ _id: "me", displayName: "Me" })
    await makeResource().getMyProfile()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/ips/v1/profiles/me")
  })

  it("updateProfile() calls PATCH /ips/v1/profiles/:userId", async () => {
    mockFetch({ _id: "u_1", displayName: "Bob" })
    await makeResource().updateProfile("u_1", { displayName: "Bob" } as any)
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/ips/v1/profiles/u_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("PATCH")
  })

  it("searchProfiles() calls GET /ips/v1/profiles with query param", async () => {
    mockFetch({ data: [], total: 0 })
    await makeResource().searchProfiles("alice")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL))
    expect(url.pathname).toBe("/ips/v1/profiles")
    expect(url.searchParams.get("q")).toBe("alice")
  })

  it("searchProfiles() includes pagination params", async () => {
    mockFetch({ data: [], total: 0 })
    await makeResource().searchProfiles("alice", { page: 2, limit: 10 })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL))
    expect(url.searchParams.get("page")).toBe("2")
    expect(url.searchParams.get("limit")).toBe("10")
  })

  // ─── Follow   

  it("follow() calls POST /ips/v1/profiles/:userId/follow", async () => {
    mockFetch({})
    await makeResource().follow("u_2")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/ips/v1/profiles/u_2/follow")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })

  it("unfollow() calls DELETE /ips/v1/profiles/:userId/follow", async () => {
    mockFetch({})
    await makeResource().unfollow("u_2")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/ips/v1/profiles/u_2/follow")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("getFollowers() calls GET /ips/v1/profiles/:userId/followers", async () => {
    mockFetch({ data: [], total: 0 })
    await makeResource().getFollowers("u_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL))
    expect(url.pathname).toBe("/ips/v1/profiles/u_1/followers")
  })

  it("getFollowing() calls GET /ips/v1/profiles/:userId/following", async () => {
    mockFetch({ data: [], total: 0 })
    await makeResource().getFollowing("u_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL))
    expect(url.pathname).toBe("/ips/v1/profiles/u_1/following")
  })

  // ─── Identities   

  it("listIdentities() calls GET /ips/v1/identities/:userId", async () => {
    mockFetch([{ provider: "google", sub: "sub_1" }])
    await makeResource().listIdentities("u_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/ips/v1/identities/u_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("unlinkIdentity() calls DELETE /ips/v1/identities/:userId/:provider", async () => {
    mockFetch({})
    await makeResource().unlinkIdentity("u_1", "google")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/ips/v1/identities/u_1/google")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("sends x-api-key header", async () => {
    mockFetch({})
    await makeResource().getMyProfile()
    const headers = new Headers(vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit)
    expect(headers.get("x-api-key")).toBe("test_key")
  })

})
