import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { WorkflowsResource } from "../../../src/resources/workflows.js"
import { HttpTransport } from "../../../src/http.js"
import { TokenManager } from "../../../src/auth/token-manager.js"

const GW              = "https://app-gatewayv2.imbrace.co"
const BACKEND         = `${GW}/v1/backend`
const WORKFLOW_ENGINE = `${GW}/activepieces`
const CHANNEL_SERVICE = `${GW}/channel-service`

function makeResource() {
  const http = new HttpTransport({ apiKey: "test_key", timeout: 5000, tokenManager: new TokenManager() })
  return new WorkflowsResource(http, BACKEND, WORKFLOW_ENGINE, CHANNEL_SERVICE)
}

function mockFetch(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

// A Response body can only be read once; buildFlow issues many calls, so hand out
// a FRESH Response per call.
function mockFetchEach(data: unknown, status = 200) {
  globalThis.fetch = vi.fn().mockImplementation(async () =>
    new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } })
  )
}

describe("WorkflowsResource", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  it("listChannelAutomation() calls GET /channel-service/v1/workflows/channel_automation", async () => {
    mockFetch({ data: [] })
    await makeResource().listChannelAutomation()
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL))
    expect(url.pathname).toBe("/channel-service/v1/workflows/channel_automation")
    expect(vi.mocked(globalThis.fetch).mock.calls[0][1]?.method).toBe("GET")
  })

  it("listChannelAutomation() includes channelType param", async () => {
    mockFetch({ data: [] })
    await makeResource().listChannelAutomation({ channelType: "whatsapp" })
    const url = new URL((vi.mocked(globalThis.fetch).mock.calls[0][0] as URL))
    expect(url.searchParams.get("channelType")).toBe("whatsapp")
  })

  it("sends x-api-key header", async () => {
    mockFetch({ data: [] })
    await makeResource().listChannelAutomation()
    const headers = new Headers(vi.mocked(globalThis.fetch).mock.calls[0][1]?.headers as HeadersInit)
    expect(headers.get("x-api-key")).toBe("test_key")
  })
})

describe("WorkflowsResource.buildFlow", () => {
  let originalFetch: typeof fetch
  beforeEach(() => { originalFetch = globalThis.fetch })
  afterEach(() => { globalThis.fetch = originalFetch })

  // trigger + [ code, loop[ code, piece ], piece ]  →  steps 1..5:
  //   step_1 code, step_2 loop, step_3 code (in loop), step_4 piece (in loop), step_5 piece (after loop)
  const spec: any = {
    displayName: "T",
    trigger: { kind: "piece", pieceName: "@activepieces/piece-schedule", pieceVersion: "0.1.13", triggerName: "every_hour", displayName: "Sched", input: { hour_of_the_day: 9 } },
    steps: [
      { kind: "code", displayName: "A", code: "x" },
      { kind: "loop", displayName: "L", items: "{{ step_1.items }}", steps: [
        { kind: "code", displayName: "B", code: "y" },
        { kind: "piece", displayName: "C", pieceName: "@activepieces/piece-store", pieceVersion: "0.6.10", actionName: "put", input: { k: 1 } },
      ] },
      { kind: "piece", displayName: "D", pieceName: "@activepieces/piece-store", pieceVersion: "0.6.10", actionName: "get", input: { x: 1, y: 2 } },
    ],
  }

  // Every POST body buildFlow sent (create has no `type`; trigger/actions do).
  const postBodies = () =>
    vi.mocked(globalThis.fetch).mock.calls
      .filter((c) => (c[1] as RequestInit)?.method === "POST" && (c[1] as RequestInit)?.body)
      .map((c) => JSON.parse((c[1] as RequestInit).body as string))

  it("sets the trigger and adds one action per step (incl. nested)", async () => {
    mockFetchEach({ id: "flow_1", version: { trigger: {} } })
    await makeResource().buildFlow(spec)
    const bodies = postBodies()
    expect(bodies.filter((b) => b.type === "UPDATE_TRIGGER")).toHaveLength(1)
    expect(bodies.filter((b) => b.type === "ADD_ACTION")).toHaveLength(5)
  })

  it("auto-fills propertySettings on the trigger and every piece action", async () => {
    mockFetchEach({ id: "flow_1", version: { trigger: {} } })
    await makeResource().buildFlow(spec)
    const bodies = postBodies()
    const trigger = bodies.find((b) => b.type === "UPDATE_TRIGGER").request
    expect(trigger.settings.propertySettings).toEqual({ hour_of_the_day: { type: "MANUAL" } })
    const pieceC = bodies.find((b) => b.request?.action?.name === "step_4").request.action
    expect(pieceC.settings.propertySettings).toEqual({ k: { type: "MANUAL" } })
    const pieceD = bodies.find((b) => b.request?.action?.name === "step_5").request.action
    expect(pieceD.settings.propertySettings).toEqual({ x: { type: "MANUAL" }, y: { type: "MANUAL" } })
  })

  it("passes stepLocationRelativeToParent on every added action", async () => {
    mockFetchEach({ id: "flow_1", version: { trigger: {} } })
    await makeResource().buildFlow(spec)
    const adds = postBodies().filter((b) => b.type === "ADD_ACTION")
    expect(adds.every((b) => typeof b.request.stepLocationRelativeToParent === "string")).toBe(true)
  })

  it("nests loop children INSIDE_LOOP and attaches the next sibling AFTER the loop", async () => {
    mockFetchEach({ id: "flow_1", version: { trigger: {} } })
    await makeResource().buildFlow(spec)
    const adds = postBodies().filter((b) => b.type === "ADD_ACTION")
    expect(adds.find((b) => b.request.action.name === "step_3").request)
      .toMatchObject({ parentStep: "step_2", stepLocationRelativeToParent: "INSIDE_LOOP" })
    expect(adds.find((b) => b.request.action.name === "step_5").request)
      .toMatchObject({ parentStep: "step_2", stepLocationRelativeToParent: "AFTER" })
  })

  it("auto-numbers step names in document order", async () => {
    mockFetchEach({ id: "flow_1", version: { trigger: {} } })
    await makeResource().buildFlow(spec)
    const names = postBodies().filter((b) => b.type === "ADD_ACTION").map((b) => b.request.action.name)
    expect(names).toEqual(["step_1", "step_2", "step_3", "step_4", "step_5"])
  })

  it("addSteps attaches under the given parent/location and continues numbering", async () => {
    mockFetchEach({ id: "flow_1", version: { trigger: {} } })
    await makeResource().addSteps("flow_1", [{ kind: "code", displayName: "X", code: "z" } as any], { parentStep: "step_9", location: "AFTER", startIndex: 9 })
    const add = postBodies().find((b) => b.type === "ADD_ACTION").request
    expect(add).toMatchObject({ parentStep: "step_9", stepLocationRelativeToParent: "AFTER" })
    expect(add.action.name).toBe("step_10")
  })
})
