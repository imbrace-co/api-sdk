import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PlatformResource } from "../../../src/resources/platform.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

// base = gateway/platform (no version — resource adds /v1 or /v2)
const BASE = "https://app-gatewayv2.imbrace.co/platform"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new PlatformResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("PlatformResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  // ─── Users  

  it("listUsers() calls GET /platform/v1/users", async () => {
    mockFetch({ data: [], total: 0 })
    await makeResource().listUsers()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL))
    expect(url.pathname).toBe("/platform/v1/users")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("listUsers() includes search param", async () => {
    mockFetch({ data: [] })
    await makeResource().listUsers({ page: 1, limit: 5, search: "alice" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL))
    expect(url.searchParams.get("search")).toBe("alice")
    expect(url.searchParams.get("page")).toBe("1")
    expect(url.searchParams.get("limit")).toBe("5")
  })

  it("getUser() calls GET /platform/v1/users/:id", async () => {
    mockFetch({ _id: "u_1", email: "alice@test.com" })
    const res = await makeResource().getUser("u_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v1/users/u_1")
    expect(res.email).toBe("alice@test.com")
  })

  it("getMe() calls GET /platform/v1/users/_me", async () => {
    mockFetch({ _id: "me", email: "me@test.com" })
    await makeResource().getMe()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v1/users/_me")
  })

  it("updateUser() calls PUT /platform/v1/users/:id", async () => {
    mockFetch({ _id: "u_1" })
    await makeResource().updateUser("u_1", { email: "new@test.com" } as any)
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v1/users/u_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("PUT")
  })

  it("archiveUser() calls POST /platform/v1/users/_archive", async () => {
    mockFetch({})
    await makeResource().archiveUser({ user_id: "u_1" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v1/users/_archive")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })

  // ─── Organizations  

  it("listOrgs() delegates to /platform/v2/organizations/_all (paged endpoint requires login_acc_)", async () => {
    mockFetch({ data: [{ _id: "org_1" }] })
    await makeResource().listOrgs()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL))
    expect(url.pathname).toBe("/platform/v2/organizations/_all")
  })

  it("createOrg() calls POST /platform/v1/organizations", async () => {
    mockFetch({ _id: "org_new" })
    await makeResource().createOrg({ name: "New Org" } as any)
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v1/organizations")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })

  it("listAllOrgs() calls GET /platform/v2/organizations/_all", async () => {
    mockFetch([])
    await makeResource().listAllOrgs()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL))
    expect(url.pathname).toBe("/platform/v2/organizations/_all")
  })

  // ─── Permissions  

  it("listPermissions() calls GET /platform/v1/users/:userId/permissions", async () => {
    mockFetch([{ _id: "perm_1", resource: "agents", action: "read" }])
    await makeResource().listPermissions("u_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v1/users/u_1/permissions")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("grantPermission() calls POST /platform/v1/users/:userId/permissions", async () => {
    mockFetch({ _id: "perm_new", resource: "agents", action: "write" })
    await makeResource().grantPermission("u_1", "agents", "write")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v1/users/u_1/permissions")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })

  it("revokePermission() calls DELETE /platform/v1/users/:userId/permissions/:permissionId", async () => {
    mockFetch({})
    await makeResource().revokePermission("u_1", "perm_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v1/users/u_1/permissions/perm_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("sends x-api-key header", async () => {
    mockFetch({})
    await makeResource().listUsers()
    const headers = new Headers(vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit)
    expect(headers.get("x-api-key")).toBe("test_key")
  })

})
