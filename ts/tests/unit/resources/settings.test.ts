import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SettingsResource } from "../../../src/resources/settings.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const BASE = "https://app-gatewayv2.imbrace.co"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new SettingsResource(http, BASE + "/channel-service", BASE + "/platform")
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("SettingsResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("listMessageTemplates() calls GET /channel-service/v1/message_templates", async () => {
    mockFetch({ data: [{ _id: "tpl_1", name: "Welcome" }] })
    await makeResource().listMessageTemplates()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/message_templates")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("listMessageTemplates() passes businessUnitId param", async () => {
    mockFetch({ data: [] })
    await makeResource().listMessageTemplates({ businessUnitId: "bu_1" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.searchParams.get("type")).toBe("business_unit_id")
    expect(url.searchParams.get("q")).toBe("bu_1")
  })

  it("createMessageTemplate() calls POST /channel-service/v1/message_templates", async () => {
    mockFetch({ _id: "tpl_new" })
    await makeResource().createMessageTemplate({ name: "My Template", body: "Hello {{name}}" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/message_templates")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })

  it("deleteMessageTemplate() calls DELETE /channel-service/v1/message_templates/:id", async () => {
    mockFetch({})
    await makeResource().deleteMessageTemplate("tpl_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/channel-service/v1/message_templates/tpl_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("listUsers() calls GET /v1/users", async () => {
    mockFetch({ data: [{ id: "u_1", email: "user@example.com" }] })
    await makeResource().listUsers()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v1/users")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("listUsers() passes search params", async () => {
    mockFetch({ data: [] })
    await makeResource().listUsers({ search: "alice", limit: 10 })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.searchParams.get("search")).toBe("alice")
    expect(url.searchParams.get("limit")).toBe("10")
  })

  it("getUserRolesCount() calls GET /v1/users/_roles_count", async () => {
    mockFetch({ admin: 2, agent: 10 })
    await makeResource().getUserRolesCount()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v1/users/_roles_count")
  })

  it("bulkInviteUsers() calls POST /v1/users/_bulk_invite", async () => {
    mockFetch({ success: true })
    await makeResource().bulkInviteUsers({ emails: ["a@b.com"], role: "agent" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/platform/v1/users/_bulk_invite")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })
})
