import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { CategoriesResource } from "../../../src/resources/categories.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const GW = "https://app-gatewayv2.imbrace.co"
const URL_BASE = `${GW}/v1/platform/categories`

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new CategoriesResource(http, GW)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } }),
  )
}

function getCalledUrl(callIndex = 0): string {
  const arg = vi.mocked(globalThis.fetch).mock.calls[callIndex][0]
  return arg instanceof URL ? arg.toString() : String(arg)
}

// Response shapes mirror platform-service CategoryController.
describe("CategoriesResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("list() hits GET /v1/platform/categories and returns { data }", async () => {
    mockFetch({ data: [{ _id: "cat_1", name: "Sales" }] })
    const res = await makeResource().list("org_1")
    expect(getCalledUrl()).toBe(`${URL_BASE}?organization_id=org_1`)
    expect(res.data[0]._id).toBe("cat_1")
  })

  it("get() returns the category object", async () => {
    mockFetch({ _id: "cat_1", name: "Sales" })
    const res = await makeResource().get("cat_1")
    expect(getCalledUrl()).toBe(`${URL_BASE}/cat_1`)
    expect(res.name).toBe("Sales")
  })

  it("delete() returns { message, id }", async () => {
    mockFetch({ message: "Category deleted successfully", id: "cat_1" })
    const res = await makeResource().delete("cat_1")
    expect(getCalledUrl()).toBe(`${URL_BASE}/cat_1`)
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]!.method).toBe("DELETE")
    expect(res.id).toBe("cat_1")
  })
})
