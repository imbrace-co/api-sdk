import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AuthResource } from "../../../src/resources/auth.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const BASE = "https://app-gatewayv2.imbrace.co"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new AuthResource(http, BASE, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("AuthResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("getThirdPartyToken() calls POST /private/backend/v1/third_party_token", async () => {
    mockFetch({ apiKey: { _id: "key_1", apiKey: "abc123", is_active: true }, expires_in: 864000 })
    await makeResource().getThirdPartyToken()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/private/backend/v1/third_party_token")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })

  it("getThirdPartyToken() sends default expirationDays=10", async () => {
    mockFetch({ apiKey: {}, expires_in: 864000 })
    await makeResource().getThirdPartyToken()
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body.expirationDays).toBe(10)
  })

  it("getThirdPartyToken() accepts custom expirationDays", async () => {
    mockFetch({ apiKey: {}, expires_in: 2592000 })
    await makeResource().getThirdPartyToken(30)
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body.expirationDays).toBe(30)
  })

  it("sends x-api-key header", async () => {
    mockFetch({})
    await makeResource().getThirdPartyToken()
    const headers = new Headers(vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit)
    expect(headers.get("x-api-key")).toBe("test_key")
  })

  it("authenticate() POSTs /v1/login/authenticate (the membership-scoped login)", async () => {
    mockFetch({ token: "login_acc_x", organizations: [{ organization_id: "org_1", display_name: "A" }] })
    await makeResource().authenticate({ email: "u@x.co", password: "p" })
    const url = new URL(vi.mocked(globalThis.fetch).mock.calls[0][0] as string)
    expect(url.pathname).toBe("/v1/login/authenticate")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
  })

  it("authenticate() returns membership-scoped organizations from the response", async () => {
    mockFetch({
      token: "login_acc_x",
      organizations: [
        { organization_id: "org_1", display_name: "Mine", role: "owner", status: "active" },
      ],
    })
    const res = await makeResource().authenticate({ email: "u@x.co", password: "p" })
    expect(res.organizations).toHaveLength(1)
    expect(res.organizations[0].organization_id).toBe("org_1")
  })

  it("authenticate() defaults organizations to [] when the field is absent", async () => {
    mockFetch({ token: "login_acc_x" })
    const res = await makeResource().authenticate({ email: "u@x.co", otp: "123456" })
    expect(res.organizations).toEqual([])
  })

})
