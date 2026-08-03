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

  it("list() calls GET /platform/v2/teams", async () => {
    mockFetch({ data: [{ id: "t_1", name: "general" }] })
    const res = await makeResource().list()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v2/teams")
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
    expect(body.team_id).toBe("t_1")
    expect(body.user_ids).toEqual(["u_1", "u_2"])
  })
})
