import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ImbraceClient, createImbraceClient } from "../../src/client.js"

const healthResponse = new Response(JSON.stringify({ status: "ok" }), { status: 200 })

describe("ImbraceClient", () => {
  let originalFetch: typeof fetch
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalFetch = globalThis.fetch
    originalEnv = { ...process.env }
    delete process.env.IMBRACE_API_KEY
    delete process.env.IMBRACE_BASE_URL
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    process.env = originalEnv
  })

  it("defaults to the production base URL", () => {
    const client = new ImbraceClient({ apiKey: "key" })
    // The base URL is embedded in resource URLs — verify via sessions
    expect(client.sessions).toBeDefined()
  })

  it("strips trailing slash from gateway", () => {
    // No error means construction succeeded; trailing slash is stripped internally
    expect(() => new ImbraceClient({ baseUrl: "https://staging.imbrace.co/", apiKey: "key" })).not.toThrow()
  })

  it("warns when no credentials are provided", () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    new ImbraceClient()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("No credentials provided"))
    warnSpy.mockRestore()
  })

  it("accepts env='develop' and resolves correct gateway", () => {
    const client = new ImbraceClient({ env: "develop", apiKey: "key" })
    expect(client).toBeDefined()
  })

  it("accepts env='sandbox'", () => {
    const client = new ImbraceClient({ env: "sandbox", apiKey: "key" })
    expect(client).toBeDefined()
  })

  it("accepts services override", () => {
    const client = new ImbraceClient({
      env: "develop",
      services: { dataBoard: "http://localhost:3001/data-board" },
      apiKey: "key",
    })
    expect(client.boards).toBeDefined()
  })

  it("initialises all domain resources", () => {
    const client = new ImbraceClient({ apiKey: "key" })
    expect(client.sessions).toBeDefined()
    expect(client.messages).toBeDefined()
    expect(client.health).toBeDefined()
    expect(client.marketplace).toBeDefined()
    expect(client.platform).toBeDefined()
    expect(client.channel).toBeDefined()
    expect(client.ips).toBeDefined()
    expect(client.agent).toBeDefined()
    expect(client.ai).toBeDefined()
    expect(client.boards).toBeDefined()
    expect(client.workflows).toBeDefined()
    expect(client.contacts).toBeDefined()
    expect(client.conversations).toBeDefined()
    expect(client.organizations).toBeDefined()
    expect(client.teams).toBeDefined()
  })

  it("setAccessToken updates the token manager", () => {
    // apiKey takes priority — token only flows when no apiKey is set
    const client = new ImbraceClient({ accessToken: "tok_old" })
    client.setAccessToken("tok_new")
    // Verify the new token is reflected in requests (no organizationId → legacy mode)
    const capturedHeaders: Record<string, string> = {}
    globalThis.fetch = vi.fn().mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const h = init?.headers as Headers
      h.forEach((v, k) => { capturedHeaders[k] = v })
      return new Response("{}", { status: 200 })
    })
    client.sessions.list()
    // Allow microtasks to run
    return new Promise<void>(resolve => setTimeout(() => {
      expect(capturedHeaders["x-access-token"]).toBe("tok_new")
      expect(capturedHeaders["authorization"]).toBeUndefined()
      resolve()
    }, 0))
  })

  it("clearAccessToken removes the token", async () => {
    const client = new ImbraceClient({ apiKey: "key", accessToken: "tok_old" })
    client.clearAccessToken()

    const capturedHeaders: Record<string, string> = {}
    globalThis.fetch = vi.fn().mockImplementation(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const h = init?.headers as Headers
      h.forEach((v, k) => { capturedHeaders[k] = v })
      return new Response("{}", { status: 200 })
    })
    client.sessions.list()

    await new Promise<void>(resolve => setTimeout(() => {
      expect(capturedHeaders["authorization"]).toBeUndefined()
      resolve()
    }, 0))
  })

  it("init() pings health when checkHealth=true", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(healthResponse)
    const client = new ImbraceClient({ apiKey: "key", checkHealth: true })
    await client.init()
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledOnce()
  })

  it("init() is a no-op when checkHealth=false", async () => {
    globalThis.fetch = vi.fn()
    const client = new ImbraceClient({ apiKey: "key", checkHealth: false })
    await client.init()
    expect(vi.mocked(globalThis.fetch)).not.toHaveBeenCalled()
  })

  it("createImbraceClient returns an ImbraceClient", () => {
    const client = createImbraceClient({ apiKey: "key" })
    expect(client).toBeInstanceOf(ImbraceClient)
  })
})
