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

  it("archiveUser() is retired and makes no request", async () => {
    globalThis.fetch = vi.fn()
    await expect(makeResource().archiveUser({ user_id: "u_1" })).rejects.toThrow("platform.archiveUser() is no longer available")
    await expect(makeResource().archiveUser({ user_id: "u_1" })).rejects.toThrow("deactivateUser")
    expect(globalThis.fetch).not.toHaveBeenCalled()
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

  it("listPermissions() is retired and makes no request", async () => {
    globalThis.fetch = vi.fn()
    await expect(makeResource().listPermissions("u_1")).rejects.toThrow("platform.listPermissions() is no longer available")
    await expect(makeResource().listPermissions("u_1")).rejects.toThrow("getEffectivePermissions")
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("grantPermission() is retired and makes no request", async () => {
    globalThis.fetch = vi.fn()
    await expect(makeResource().grantPermission("u_1", "agents", "write")).rejects.toThrow("platform.grantPermission() is no longer available")
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("revokePermission() is retired and makes no request", async () => {
    globalThis.fetch = vi.fn()
    await expect(makeResource().revokePermission("u_1", "perm_1")).rejects.toThrow("platform.revokePermission() is no longer available")
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it("sends x-api-key header", async () => {
    mockFetch({})
    await makeResource().listUsers()
    const headers = new Headers(vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit)
    expect(headers.get("x-api-key")).toBe("test_key")
  })

})

// Routes that moved off the retired backend (verified against develop)
describe("PlatformResource — moved and retired routes", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })
  const calledUrl = (i = 0) => new URL(String(vi.mocked(globalThis.fetch).mock.calls[i][0]))
  const calledInit = (i = 0) => vi.mocked(globalThis.fetch).mock.calls[i][1]!

  it("getContactV2() / updateContactV2() use channel-service and unwrap { data }", async () => {
    mockFetch({ data: { _id: "con_1", name: "Jane" } })
    const got = await makeResource().getContactV2("con_1")
    expect(calledUrl().toString()).toBe("https://app-gatewayv2.imbrace.co/channel-service/v1/contacts/con_1")
    expect(got._id).toBe("con_1")
    mockFetch({ data: { _id: "con_1", name: "Joan" } })
    const upd = await makeResource().updateContactV2("con_1", { name: "Joan" })
    expect(calledInit().method).toBe("PUT")
    expect(upd.name).toBe("Joan")
  })

  it("listCredentials() uses channel-service and returns the array", async () => {
    mockFetch({ data: [{ id: "cr_1", name: "x", type: "web" }] })
    const res = await makeResource().listCredentials()
    expect(calledUrl().pathname).toBe("/channel-service/v1/credentials")
    expect(res[0].id).toBe("cr_1")
  })

  it("listProcessedCredentialTypes() flattens { channel, integration }", async () => {
    mockFetch({ channel: [{ name: "web", displayName: "Web" }], integration: [{ name: "x", displayName: "X" }] })
    const res = await makeResource().listProcessedCredentialTypes()
    expect(calledUrl().pathname).toBe("/channel-service/v1/workflow/processed-credential-types")
    expect(res.map(t => t.name)).toEqual(["web", "x"])
  })

  it("getCredentialTypeByName() uses _credentialParam?type=", async () => {
    mockFetch({ name: "web", displayName: "Web" })
    await makeResource().getCredentialTypeByName("web")
    expect(calledUrl().pathname).toBe("/channel-service/v1/workflow/_credentialParam")
    expect(calledUrl().searchParams.get("type")).toBe("web")
  })

  it("initChannel() uses channel-service and unwraps the channel", async () => {
    mockFetch({ data: { id: "ch_1", type: "web" } })
    const res = await makeResource().initChannel({ type: "web" })
    expect(calledUrl().pathname).toBe("/channel-service/v1/init_channel")
    expect(res.id).toBe("ch_1")
  })

  it("uploadUserAvatar() uses /platform/v1/account/_fileupload", async () => {
    mockFetch({ url: "https://x/a.png" })
    await makeResource().uploadUserAvatar(new FormData())
    expect(calledUrl().pathname).toBe("/platform/v1/account/_fileupload")
  })

  it("listTeams() / listTeamUsers() send the required type + q", async () => {
    mockFetch({ data: [], count: 0, total: 0 })
    await makeResource().listTeams({ q: "bu_1" })
    expect(calledUrl().searchParams.get("type")).toBe("business_unit_id")
    expect(calledUrl().searchParams.get("q")).toBe("bu_1")
    mockFetch({ data: [], count: 0, total: 0 })
    await makeResource().listTeamUsersV2({ q: "t_1", search: "ann" })
    expect(calledUrl().pathname).toBe("/platform/v2/team_users")
    expect(calledUrl().searchParams.get("type")).toBe("team_id")
    expect(calledUrl().searchParams.get("search")).toBe("ann")
  })

  it("listTeamInvites() sends type=team_id and team_id", async () => {
    mockFetch({ data: [], count: 0, total: 0 })
    await makeResource().listTeamInvites("t_1")
    expect(calledUrl().pathname).toBe("/platform/v2/team_users/_invite_list")
    expect(calledUrl().searchParams.get("team_id")).toBe("t_1")
  })

  it("addTeamUsers() / removeTeamUsers() send the body platform-service expects", async () => {
    mockFetch({ success: true })
    await makeResource().addTeamUsers({ team_id: "t_1", user_ids: ["u_1"], role: "admin" })
    expect(JSON.parse(calledInit().body as string)).toEqual({ team_id: "t_1", users: [{ user_id: "u_1", role: "admin" }] })
    mockFetch({ success: true })
    await makeResource().removeTeamUsers({ team_id: "t_1", user_ids: ["u_1"] })
    expect(JSON.parse(calledInit().body as string)).toEqual({ team_id: "t_1", user_ids: ["u_1"] })
  })

  it("listBusinessUnits() and getTeamLabels() return arrays", async () => {
    mockFetch({ object_name: "list", data: [{ _id: "bu_1", name: "BU" }] })
    expect((await makeResource().listBusinessUnits())[0]._id).toBe("bu_1")
    mockFetch({ items: [{ _id: "lb_1", name: "VIP" }], count: 1 })
    expect((await makeResource().getTeamLabels("t_1"))[0].name).toBe("VIP")
  })

  it("getEffectivePermissions() calls /platform/v1/roles/_effective", async () => {
    mockFetch({ user_id: "u_1", organization_id: "o", role: "owner", is_owner: true, permissions: ["users:read"] })
    const res = await makeResource().getEffectivePermissions("u_1")
    expect(calledUrl().pathname).toBe("/platform/v1/roles/_effective")
    expect(calledUrl().searchParams.get("user_id")).toBe("u_1")
    expect(res.permissions).toContain("users:read")
  })

  it.each([
    ["listRooms", (r: PlatformResource) => r.listRooms()],
    ["listStores", (r: PlatformResource) => r.listStores()],
    ["listKnowledge", (r: PlatformResource) => r.listKnowledge()],
    ["listResources", (r: PlatformResource) => r.listResources()],
    ["getFacebookPages", (r: PlatformResource) => r.getFacebookPages()],
    ["getMailChannel", (r: PlatformResource) => r.getMailChannel("m_1")],
    ["getUserWorkflows", (r: PlatformResource) => r.getUserWorkflows("u_1")],
    ["getTeamWorkflows", (r: PlatformResource) => r.getTeamWorkflows("t_1")],
    ["getCredentialTypes", (r: PlatformResource) => r.getCredentialTypes()],
    ["suspendUser", (r: PlatformResource) => r.suspendUser({ user_id: "u_1" })],
  ])("%s() is retired and makes no request", async (name, call) => {
    globalThis.fetch = vi.fn()
    await expect(call(makeResource())).rejects.toThrow(`platform.${name}() is no longer available`)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})

describe("PlatformResource — deleteTeam", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("tolerates the empty 200 body platform-service returns", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response("", { status: 200 }))
    await expect(makeResource().deleteTeam("t_1")).resolves.toEqual({ success: true })
  })
})
