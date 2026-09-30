import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { TeamsResource } from "../../../src/resources/teams.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

// base = gateway/platform (no version — resource adds /v1 or /v2)
const BASE = "https://app-gatewayv2.imbrace.co/platform"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new TeamsResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("TeamsResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("list() calls GET /platform/v2/teams with type=business_unit_id and q", async () => {
    mockFetch({ data: [{ id: "t_1", name: "general" }], count: 1, total: 1 })
    const res = await makeResource().list({ q: "bu_1", limit: 5 })
    const url = new URL(String(vi.mocked(globalThis.fetch).mock.calls[0][0]))
    expect(url.pathname).toBe("/platform/v2/teams")
    expect(url.searchParams.get("type")).toBe("business_unit_id")
    expect(url.searchParams.get("q")).toBe("bu_1")
    expect(url.searchParams.get("limit")).toBe("5")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
    expect(res.data[0].name).toBe("general")
  })

  it("listMy() calls GET /platform/v2/teams/my", async () => {
    mockFetch({ data: [] })
    await makeResource().listMy()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v2/teams/my")
  })

  it("delete() calls DELETE /platform/v2/teams/:id", async () => {
    mockFetch({ success: true })
    await makeResource().delete("t_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v2/teams/t_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("addUsers() calls POST /platform/v2/teams/_add_users with correct body", async () => {
    mockFetch({ success: true })
    await makeResource().addUsers({ team_id: "t_1", user_ids: ["u_1", "u_2"] })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v2/teams/_add_users")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body).toEqual({ team_id: "t_1", users: [{ user_id: "u_1", role: "member" }, { user_id: "u_2", role: "member" }] })
  })

  it("addUsers() passes explicit users/roles through", async () => {
    mockFetch({ success: true })
    await makeResource().addUsers({ team_id: "t_1", users: [{ user_id: "u_1", role: "admin" }] })
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body.users).toEqual([{ user_id: "u_1", role: "admin" }])
  })

  it("removeUsers() sends team_id", async () => {
    mockFetch({ success: true })
    await makeResource().removeUsers({ team_id: "t_1", user_ids: ["u_1"] })
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body).toEqual({ team_id: "t_1", user_ids: ["u_1"] })
  })

  it("getWorkflows() is retired and makes no request", async () => {
    globalThis.fetch = vi.fn()
    await expect(makeResource().getWorkflows("t_1")).rejects.toThrow("teams.getWorkflows() is no longer available")
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
