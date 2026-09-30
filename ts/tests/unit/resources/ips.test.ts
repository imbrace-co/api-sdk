import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { IpsResource } from "../../../src/resources/ips.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"
import { ImbraceError } from "../../../src/errors.js"

const GW = "https://app-gatewayv2.imbrace.co"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new IpsResource(http, `${GW}/ips/v1`, `${GW}/data-board`, `${GW}/channel-service`)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

function calledUrl(i = 0): URL {
  const arg = vi.mocked(globalThis.fetch).mock.calls[i][0]
  return arg instanceof URL ? arg : new URL(String(arg))
}

// IPS is retired: schedulers moved to data-board, external data sync to channel-service.
describe("IpsResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  // ─── Schedulers → data-board

  it("listSchedulers() calls GET /data-board/v1/schedulers with query params", async () => {
    mockFetch({ data: [{ _id: "s_1" }], count: 1, total: 1, has_more: false })
    const res = await makeResource().listSchedulers({ limit: 5, event_type: "is:email_campaign" })
    const url = calledUrl()
    expect(url.pathname).toBe("/data-board/v1/schedulers")
    expect(url.searchParams.get("limit")).toBe("5")
    expect(url.searchParams.get("event_type")).toBe("is:email_campaign")
    expect(res.data[0]._id).toBe("s_1")
  })

  it("deleteScheduler() calls DELETE /data-board/v1/schedulers/:id", async () => {
    mockFetch({ message: "schedule s_1 is deleted successfully" })
    await makeResource().deleteScheduler("s_1")
    expect(calledUrl().pathname).toBe("/data-board/v1/schedulers/s_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("getSchedulerFilterOptions() calls GET /data-board/v1/schedulers/filter_options", async () => {
    mockFetch([{ event_type: "board_automation" }])
    const res = await makeResource().getSchedulerFilterOptions("event_type")
    const url = calledUrl()
    expect(url.pathname).toBe("/data-board/v1/schedulers/filter_options")
    expect(url.searchParams.get("filter")).toBe("event_type")
    expect(res[0].event_type).toBe("board_automation")
  })

  // ─── External data sync → channel-service

  it("listExternalDataSync() calls GET /channel-service/v1/external-data-sync", async () => {
    mockFetch({ data: [{ id: "eds_1", provider: "clickup" }], count: 1 })
    const res = await makeResource().listExternalDataSync()
    expect(calledUrl().pathname).toBe("/channel-service/v1/external-data-sync")
    expect(res.data[0].id).toBe("eds_1")
  })

  it("enableExternalDataSync() calls POST /channel-service/v1/external-data-sync/enable", async () => {
    mockFetch({ message: "Sync enabled successfully.", subscription_id: "eds_1", provider: "clickup", is_active: true })
    const res = await makeResource().enableExternalDataSync({ provider: "clickup", connection_id: "conn_1" })
    expect(calledUrl().pathname).toBe("/channel-service/v1/external-data-sync/enable")
    const init = vi.mocked(globalThis.fetch).mock.calls[0][1]!
    expect(init.method).toBe("POST")
    expect(JSON.parse(init.body as string)).toEqual({ provider: "clickup", connection_id: "conn_1" })
    expect(res.subscription_id).toBe("eds_1")
  })

  it("deleteExternalDataSync() calls DELETE /channel-service/v1/external-data-sync/:id", async () => {
    mockFetch({})
    await makeResource().deleteExternalDataSync("eds_1")
    expect(calledUrl().pathname).toBe("/channel-service/v1/external-data-sync/eds_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("derives data-board and channel-service from the IPS base when not given", async () => {
    mockFetch({ data: [], count: 0 })
    const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
    await new IpsResource(http, `${GW}/ips/v1`).listExternalDataSync()
    expect(calledUrl().toString()).toBe(`${GW}/channel-service/v1/external-data-sync`)
  })

  it("sends x-api-key header", async () => {
    mockFetch({ data: [], count: 0 })
    await makeResource().listExternalDataSync()
    const headers = new Headers(vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit)
    expect(headers.get("x-api-key")).toBe("test_key")
  })

  // ─── Retired: no replacement service

  const retired: Array<[string, (r: IpsResource) => Promise<unknown>]> = [
    ["getProfile", r => r.getProfile("u_1")],
    ["getMyProfile", r => r.getMyProfile()],
    ["updateProfile", r => r.updateProfile("u_1", {})],
    ["searchProfiles", r => r.searchProfiles("alice")],
    ["follow", r => r.follow("u_1")],
    ["unfollow", r => r.unfollow("u_1")],
    ["getFollowers", r => r.getFollowers("u_1")],
    ["getFollowing", r => r.getFollowing("u_1")],
    ["listIdentities", r => r.listIdentities("u_1")],
    ["unlinkIdentity", r => r.unlinkIdentity("u_1", "google")],
    ["listWorkflows", r => r.listWorkflows()],
    ["listApWorkflows", r => r.listApWorkflows()],
  ]

  it.each(retired)("%s() rejects with ImbraceError and makes no request", async (name, call) => {
    globalThis.fetch = vi.fn()
    await expect(call(makeResource())).rejects.toThrow(ImbraceError)
    await expect(call(makeResource())).rejects.toThrow(`ips.${name}() is no longer available`)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
