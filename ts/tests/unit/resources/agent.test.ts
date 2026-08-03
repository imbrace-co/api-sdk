import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AgentResource } from "../../../src/resources/agent.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const GW   = "https://app-gatewayv2.imbrace.co"
const BASE = `${GW}/marketplaces/v2`

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new AgentResource(http, BASE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("AgentResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("list() calls GET /marketplaces/v2/market-places/v2/templates", async () => {
    mockFetch([{ _id: "uc_1", title: "Agent A" }])
    await makeResource().list()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/marketplaces/v2/market-places/v2/templates")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("get() calls GET /marketplaces/v2/market-places/v2/templates/:id", async () => {
    mockFetch({ data: { _id: "uc_1", title: "Agent A" } })
    const res = await makeResource().get("uc_1")
    expect(res.data.title).toBe("Agent A")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/marketplaces/v2/market-places/v2/templates/uc_1")
  })

  it("update() calls PATCH /marketplaces/v2/market-places/v2/templates/:id", async () => {
    mockFetch({ _id: "uc_1" })
    await makeResource().update("uc_1", { usecase: { title: "Updated" } })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/marketplaces/v2/market-places/v2/templates/uc_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("PATCH")
  })

  it("delete() calls DELETE /marketplaces/v2/market-places/v2/templates/:id", async () => {
    mockFetch({})
    await makeResource().delete("uc_1")
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/marketplaces/v2/market-places/v2/templates/uc_1")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("DELETE")
  })

  it("listUseCases() calls GET /marketplaces/v2/use-cases", async () => {
    mockFetch([])
    await makeResource().listUseCases()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/marketplaces/v2/use-cases")
  })

  it("createUseCase() calls POST /marketplaces/v2/use-cases/v2/custom with {assistant, usecase}", async () => {
    mockFetch({ _id: "uc_new" })
    await makeResource().createUseCase({
      usecase: { title: "New" },
      assistant: { name: "Helper", model_id: "gpt-4o", provider_id: "system" },
    })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as string))
    expect(url.pathname).toBe("/marketplaces/v2/use-cases/v2/custom")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("POST")
    const body = JSON.parse(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body as string)
    expect(body.usecase.title).toBe("New")
    expect(body.assistant.name).toBe("Helper")
  })

  it("sends x-api-key header", async () => {
    mockFetch([])
    await makeResource().list()
    const headers = new Headers(vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit)
    expect(headers.get("x-api-key")).toBe("test_key")
  })
})
