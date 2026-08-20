/**
 * Mirrors website/public/sdk/workflows.md against @imbrace/sdk@1.0.4 (npm)
 * — Access Token auth. See test-api-pkg/ts/test-docs-workflows.ts for
 * doc-gap commentary (TS doc still uses `client.activepieces.*`).
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const accessToken    = process.env.IMBRACE_ACCESS_TOKEN
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!accessToken || !organizationId) {
  console.error("Missing IMBRACE_ACCESS_TOKEN or IMBRACE_ORGANIZATION_ID")
  process.exit(1)
}

const client = new ImbraceClient({ accessToken, organizationId, baseUrl, timeout: 30_000 })

let pass = 0, fail = 0, skip = 0
const fails: string[] = []
const docGaps: string[] = []

async function step(label: string, fn: () => Promise<unknown>, expectFail = false) {
  process.stdout.write(`  • ${label} ... `)
  try {
    const t0 = Date.now()
    const r = await fn()
    const dt = Date.now() - t0
    const summary = JSON.stringify(r ?? {}).slice(0, 90)
    if (expectFail) { console.log(`unexpected pass [${dt}ms]: ${summary}`); fail++; fails.push(`${label} → unexpected pass`) }
    else { console.log(`✓ [${dt}ms] ${summary}`); pass++ }
  } catch (err: any) {
    const code = err?.statusCode ?? err?.message ?? "ERR"
    if (expectFail) { console.log(`✓ (expected fail [${code}])`); pass++ }
    else { console.log(`✗ [${code}]`); fail++; fails.push(`${label} → ${code}`) }
  }
}

function skipped(label: string, reason: string) { console.log(`  - ${label}  ⏭ ${reason}`); skip++ }
function section(title: string) { console.log(`\n══ ${title} ══`) }
function note(msg: string) { console.log(`  ℹ ${msg}`); docGaps.push(msg) }

console.log(`\n━━━ DOCS: workflows.md — auth: ACCESS TOKEN (npm @imbrace/sdk@1.0.4) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}\n`)

const ts = Date.now()
const state: { projectId: string | null; flowId: string | null; runId: string | null; folderId: string | null } =
  { projectId: null, flowId: null, runId: null, folderId: null }

note("doc-gap: workflows.md TS snippets call `client.activepieces.*` everywhere — SDK 1.0.4 only exposes `client.workflows.*`. Py snippets already use `workflows`.")

section("§1. Flows (list / get / create / delete)")
await step("workflows.listFlows + capture projectId", async () => {
  const r: any = await client.workflows.listFlows({ limit: 5 })
  state.projectId = r?.data?.[0]?.projectId ?? null
  return { count: r?.data?.length, projectId: state.projectId }
})
if (state.projectId) {
  await step("workflows.createFlow", async () => {
    const f: any = await client.workflows.createFlow({ displayName: `New Lead Notification ${ts}`, projectId: state.projectId! } as any)
    state.flowId = f?.id ?? f?._id ?? null
    return { id: state.flowId }
  })
} else {
  skipped("workflows.createFlow", "no projectId fixture")
}
if (state.flowId) {
  await step("workflows.getFlow", () => (client.workflows as any).getFlow(state.flowId!))
} else {
  skipped("workflows.getFlow", "no flow fixture")
}

section("§2. Trigger a flow (async + sync)")
if (state.flowId) {
  await step("workflows.applyFlowOperation UPDATE_TRIGGER (Webhook)", () =>
    (client.workflows as any).applyFlowOperation(state.flowId!, {
      type: "UPDATE_TRIGGER",
      request: {
        name: "trigger", type: "PIECE_TRIGGER", valid: true,
        displayName: "Webhook",
        settings: {
          pieceName: "@activepieces/piece-webhook", pieceVersion: "0.1.24",
          triggerName: "catch_webhook",
          input: { authType: "none" }, propertySettings: {},
        },
      },
    }))
  await step("workflows.applyFlowOperation LOCK_AND_PUBLISH",
    () => (client.workflows as any).applyFlowOperation(state.flowId!, { type: "LOCK_AND_PUBLISH", request: {} }))
  await step("workflows.triggerFlow (async)",
    () => (client.workflows as any).triggerFlow(state.flowId!, { contactId: "contact_xxx", event: "lead_qualified" }))
  await step("workflows.triggerFlowSync (expected timeout — no Return Response action)",
    () => (client.workflows as any).triggerFlowSync(state.flowId!, { contactId: "contact_xxx", event: "lead_qualified" }),
    /* expectFail */ true)
} else {
  skipped("triggerFlow / triggerFlowSync", "no flow fixture")
}

section("§3. Runs, folders, connections, tables")
if (state.flowId) {
  await step("workflows.listRuns ({ flowId, limit: 20 })", async () => {
    const r: any = await (client.workflows as any).listRuns({ flowId: state.flowId!, limit: 20 })
    state.runId = r?.data?.[0]?.id ?? null
    return { count: r?.data?.length, sampleRunId: state.runId }
  })
  if (state.runId) {
    await step("workflows.getRun(runId)", () => (client.workflows as any).getRun(state.runId!))
  } else {
    skipped("workflows.getRun", "no run fixture")
  }
} else {
  skipped("workflows.listRuns / getRun", "no flow fixture")
}

await step("workflows.listFolders", async () => {
  const r: any = await (client.workflows as any).listFolders()
  return { count: (r?.data ?? r ?? []).length }
})
if (state.projectId) {
  await step("workflows.createFolder", async () => {
    const f: any = await (client.workflows as any).createFolder({ displayName: `CRM Automations ${ts}`, projectId: state.projectId! })
    state.folderId = f?.id ?? f?._id ?? null
    return { id: state.folderId }
  })
} else {
  skipped("workflows.createFolder", "no projectId fixture")
}
await step("workflows.listConnections", async () => {
  const r: any = await (client.workflows as any).listConnections()
  return { count: (r?.data ?? r ?? []).length }
})
skipped("workflows.upsertConnection",
  "destructive — would create a Slack connection in the org. Doc payload uses `xoxb-xxx` placeholder")
await step("workflows.listTables", async () => {
  const r: any = await (client.workflows as any).listTables()
  return { count: (r?.data ?? r ?? []).length }
})
skipped("workflows.listRecords", "needs a real table_id from listTables — fixture-dependent")

section("§4. Channel automation")
await step("workflows.listChannelAutomation", async () => {
  const r: any = await (client.workflows as any).listChannelAutomation()
  return { count: (r?.data ?? r ?? []).length }
})
await step("workflows.listChannelAutomation ({ channelType: 'whatsapp' })", async () => {
  const r: any = await (client.workflows as any).listChannelAutomation({ channelType: "whatsapp" })
  return { count: (r?.data ?? r ?? []).length }
})

section("cleanup")
if (state.flowId) {
  await step("workflows.deleteFlow (cleanup)", () => (client.workflows as any).deleteFlow(state.flowId!))
}
if (state.folderId) {
  await step("workflows.deleteFolder (cleanup; best-effort)",
    () => (client.workflows as any).deleteFolder?.(state.folderId!) ?? Promise.resolve())
}

console.log(`\n━━━ Summary (workflows / Access Token) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
if (docGaps.length) { console.log("Doc gaps to fix:"); docGaps.forEach(g => console.log(`  - ${g}`)) }
process.exit(fail > 0 ? 1 : 0)
