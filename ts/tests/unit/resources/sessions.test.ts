import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { SessionsResource } from "../../../src/resources/sessions.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"
import { ImbraceError } from "../../../src/errors.js"

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new SessionsResource(http, "https://app-gatewayv2.imbrace.co")
}

// The gateway no longer serves /session; every method throws without a request.
describe("SessionsResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch; globalThis.fetch = vi.fn() })
  afterEach(() => { globalThis.fetch = originalFetch })

  it.each([
    ["list", (r: SessionsResource) => r.list()],
    ["get", (r: SessionsResource) => r.get("s_1")],
    ["create", (r: SessionsResource) => r.create({ directory: "/tmp" })],
    ["delete", (r: SessionsResource) => r.delete("s_1")],
  ])("%s() rejects with ImbraceError and makes no request", async (name, call) => {
    await expect(call(makeResource())).rejects.toThrow(ImbraceError)
    await expect(call(makeResource())).rejects.toThrow(`sessions.${name}() is no longer available`)
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
})
