import { describe, it, expect, vi, afterEach } from "vitest"
import { ImbraceClient } from "../../../src/client.js"

const gw = "https://app-gateway.dev.imbrace.co"
type Call = { url: string; method: string; body?: any }

/** Route each request to a canned response; record what was sent. */
function mockFetch(route: (c: Call) => { status?: number; body?: unknown }) {
  const calls: Call[] = []
  globalThis.fetch = vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const c: Call = { url: String(input), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined }
    calls.push(c)
    const r = route(c)
    return new Response(r.body === undefined ? "" : JSON.stringify(r.body), { status: r.status ?? 200 })
  })
  return calls
}

const client = () => new ImbraceClient({ env: "develop", apiKey: "key" })
const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

describe("new resources", () => {
  it("wires document models, CRM automation, api keys, roles and audit logs", async () => {
    const calls = mockFetch(() => ({ body: { data: [] } }))
    const c = client()
    await c.documentModels.list()
    await c.documentModels.listCategories({ type: "schema" })
    await c.crmAutomation.list()
    await c.apiKeys.list()
    await c.roles.list()
    await c.auditLogs.list({ limit: 5 })
    expect(calls.map(x => x.url)).toEqual([
      `${gw}/data-board/schemas`,
      `${gw}/data-board/categories?type=schema`,
      `${gw}/data-board/v1/crmboard/organization/board`,
      `${gw}/platform/v1/api_key_token`,
      `${gw}/platform/v1/roles`,
      `${gw}/platform/v1/audit-logs?limit=5`,
    ])
  })

  it("treats the CRM list 404 as an empty list", async () => {
    mockFetch(() => ({ status: 404, body: { message: "CRMBoard not found" } }))
    expect(await client().crmAutomation.list()).toEqual([])
  })

  it("apiKeys.delete accepts the 404 platform sends after deleting", async () => {
    const calls = mockFetch(c => (c.method === "DELETE" ? { status: 404, body: { code: 40004 } } : { body: [] }))
    await expect(client().apiKeys.delete("k1")).resolves.toBeUndefined()
    expect(calls.map(x => `${x.method} ${x.url}`)).toEqual([
      `DELETE ${gw}/platform/v1/third_party_token/k1`,
      `GET ${gw}/platform/v1/api_key_token`,
    ])
  })

  it("apiKeys.delete still fails when the key is still listed", async () => {
    mockFetch(c => (c.method === "DELETE" ? { status: 404, body: {} } : { body: [{ _id: "k1" }] }))
    await expect(client().apiKeys.delete("k1")).rejects.toThrow("[404]")
  })
})

describe("knowledge hub", () => {
  it("createFolder sends parent_id as parent_folder_id and fills the org", async () => {
    const calls = mockFetch(c => (c.url.endsWith("/platform/v1/account") ? { body: { organization_id: "org_1" } } : { status: 201, body: { data: { _id: "f2" } } }))
    await client().boards.createFolder({ name: "child", parent_id: "f1" })
    const post = calls.find(x => x.method === "POST")!
    expect(post.body).toEqual({ name: "child", source_type: "upload", parent_folder_id: "f1", organization_id: "org_1" })
  })

  it("getDriveSessionStatus reports connected=false before sign-in", async () => {
    mockFetch(() => ({ status: 404, body: { message: "Session not found" } }))
    expect(await client().boards.getDriveSessionStatus("google-drive", "s1")).toEqual({ connected: false, session_id: "s1" })
  })
})

describe("orchestrator", () => {
  it("updateAiAgent re-sends name, workflow_name, agent_type and sub_agents", async () => {
    const current = { id: "a1", name: "Lead", workflow_name: "lead_wf", agent_type: "team_lead", sub_agents: [{ assistant_id: "s1", name: "Sub" }] }
    const calls = mockFetch(c => (c.method === "GET" ? { body: current } : { body: current }))
    await client().chatAi.updateAiAgent("a1", { description: "new" })
    const put = calls.find(x => x.method === "PUT")!
    expect(put.url).toBe(`${gw}/v3/ai/assistant_apps/a1`)
    expect(put.body).toEqual({ name: "Lead", workflow_name: "lead_wf", agent_type: "team_lead", sub_agents: ["s1"], description: "new" })
  })

  it("createOrchestrator marks the agent as team lead", async () => {
    const calls = mockFetch(() => ({ body: { id: "a1" } }))
    await client().chatAi.createOrchestrator({ name: "Lead", workflow_name: "lead_wf", sub_agents: ["s1"] } as any)
    expect(calls[0].body).toMatchObject({ agent_type: "team_lead", sub_agents: ["s1"], provider_id: "default", model_id: "Default" })
  })
})

describe("workflows MCP", () => {
  it("resolves the org project and updates with POST", async () => {
    const calls = mockFetch(c => (c.url.includes("/users/projects/current") ? { body: { id: "p1" } } : { body: { id: "m1" } }))
    const c = client()
    await c.workflows.createMcpServer({ name: "tools" })
    await c.workflows.updateMcpServer("m1", { name: "tools2" })
    expect(calls.map(x => `${x.method} ${x.url}`)).toEqual([
      `GET ${gw}/activepieces/v1/users/projects/current`,
      `POST ${gw}/activepieces/v1/mcp-servers`,
      `POST ${gw}/activepieces/v1/mcp-servers/m1`,
    ])
    expect(calls[1].body).toEqual({ name: "tools", projectId: "p1" })
  })
})
