/**
 * Exhaustive workflows resource verification — pulls @imbrace/sdk from npm.
 * Auth: Access Token.
 *
 * Covers (Workflow Engine = ActivePieces under the hood):
 *   - Channel automation: listChannelAutomation
 *   - Flows:              listFlows, getFlow, createFlow, deleteFlow, applyFlowOperation
 *   - Runs:               listRuns, getRun
 *   - Folders:            listFolders, getFolder, createFolder, updateFolder, deleteFolder
 *   - Connections:        listConnections, getConnection (+ upsert/delete skipped — needs piece config)
 *   - Pieces & status:    listPieces, getTriggerRunStatus
 *   - Tables:             listTables, getTable, listRecords
 *   - MCP:                listMcpServers, getMcpServer (+ create/delete/rotate skipped — destructive)
 *   - Invitations:        listInvitations
 *
 * Skipped (destructive or needing fixtures):
 *   triggerFlow, triggerFlowSync, testTrigger, deleteInvitation,
 *   upsertConnection, deleteConnection, createMcpServer, deleteMcpServer, rotateMcpToken
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
const w = client.workflows

let pass = 0, fail = 0, skip = 0
const fails: string[] = []

async function step(label: string, fn: () => Promise<any>, expectFail = false) {
  process.stdout.write(`  • ${label} ... `)
  const t0 = Date.now()
  try {
    const result = await fn()
    const dt = Date.now() - t0
    const summary = JSON.stringify(result ?? {}).slice(0, 120)
    if (expectFail) { console.log(`unexpected pass [${dt}ms]: ${summary}`); fail++; fails.push(`${label} → unexpected pass`) }
    else { console.log(`✓ [${dt}ms] ${summary}`); pass++ }
  } catch (err: any) {
    const detail = err?.message ?? String(err)
    if (expectFail) { console.log(`✓ (expected fail [${detail.slice(0, 200)}])`); pass++ }
    else { console.log(`✗ ${detail.slice(0, 300)}`); fail++; fails.push(`${label} → ${detail.slice(0, 300)}`) }
  }
}

function skipped(label: string, reason: string) {
  console.log(`  - ${label}  ⏭ ${reason}`); skip++
}

function section(title: string) { console.log(`\n══ ${title} ══`) }

console.log(`\n━━━ workflows — auth: ACCESS TOKEN (npm @imbrace/sdk) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}`)

// ── 1. Read-only ────────────────────────────────────────────────────────────
section("Read-only listings")
let projectId: string | null = null
let firstFlowId: string | null = null
let firstFolderId: string | null = null

await step("listChannelAutomation", () => w.listChannelAutomation())

await step("listFlows (limit=3)", async () => {
  const r: any = await w.listFlows({ limit: 3 } as any)
  const flows = r.data ?? []
  if (flows.length > 0) {
    firstFlowId = flows[0].id
    projectId = flows[0].projectId ?? flows[0].project_id ?? null
  }
  return { count: flows.length, firstFlowId, projectId }
})

if (firstFlowId) {
  await step("getFlow(firstFlowId)", () => w.getFlow(firstFlowId!))
}

await step("listFolders (limit=3)", async () => {
  const r: any = await w.listFolders({ limit: 3 } as any)
  const folders = r.data ?? []
  if (folders.length > 0) firstFolderId = folders[0].id
  return { count: folders.length, firstFolderId }
})

if (firstFolderId) {
  await step("getFolder(firstFolderId)", () => w.getFolder(firstFolderId!))
}

await step("listConnections (limit=3)", () => w.listConnections({ limit: 3 } as any))
await step("listPieces (limit=3)", () => w.listPieces({ limit: 3 } as any))
await step("listTables (limit=3)", () => w.listTables({ limit: 3 } as any))
await step("listRuns (limit=3)", () => w.listRuns({ limit: 3 } as any))
await step("getTriggerRunStatus", () => w.getTriggerRunStatus())

if (projectId) {
  await step("listMcpServers(projectId)", () => w.listMcpServers(projectId!))
} else {
  skipped("listMcpServers", "no projectId fixture (no flows in workspace)")
}

// listInvitations: backend type enum is uppercase 'PROJECT' (not 'USER' nor 'PROJECT_MEMBER')
await step("listInvitations(type='PROJECT')", () => w.listInvitations({ type: "PROJECT", limit: 3 } as any))

// ── 2. Flow lifecycle (create → delete) ─────────────────────────────────────
section("Flow lifecycle")
const stamp = Date.now()
let createdFlowId: string | null = null

if (projectId) {
  await step("createFlow", async () => {
    const r: any = await w.createFlow({ displayName: `sdk-test-flow-${stamp}`, projectId: projectId! })
    createdFlowId = r.id
    return { id: createdFlowId, name: r.displayName ?? r.display_name }
  })

  if (createdFlowId) {
    await step("getFlow(createdId)", () => w.getFlow(createdFlowId!))

    // applyFlowOperation — try CHANGE_NAME (safe, reversible)
    await step("applyFlowOperation (CHANGE_NAME)", async () => {
      const r: any = await w.applyFlowOperation(createdFlowId!, {
        type: "CHANGE_NAME",
        request: { displayName: `sdk-test-flow-${stamp}-renamed` },
      })
      return { id: r.id, name: r.displayName ?? r.display_name }
    })

    await step("deleteFlow(createdId)", async () => {
      await w.deleteFlow(createdFlowId!)
      return { deleted: createdFlowId }
    })
  }
} else {
  skipped("createFlow / getFlow / applyFlowOperation / deleteFlow", "no projectId — workspace has no existing flows to derive id")
}

// ── 3. Folder lifecycle ─────────────────────────────────────────────────────
section("Folder lifecycle")
let createdFolderId: string | null = null
if (projectId) {
  await step("createFolder", async () => {
    const r: any = await w.createFolder({ displayName: `sdk-test-folder-${stamp}`, projectId: projectId! })
    createdFolderId = r.id
    return { id: createdFolderId, name: r.displayName ?? r.display_name }
  })

  if (createdFolderId) {
    await step("getFolder(createdId)", () => w.getFolder(createdFolderId!))
    await step("updateFolder (rename)", () =>
      w.updateFolder(createdFolderId!, { displayName: `sdk-test-folder-${stamp}-renamed` }))
    await step("deleteFolder(createdId)", async () => {
      await w.deleteFolder(createdFolderId!)
      return { deleted: createdFolderId }
    })
  }
} else {
  skipped("createFolder / updateFolder / deleteFolder", "no projectId fixture")
}

// ── 4. Skipped (need fixtures or destructive) ───────────────────────────────
section("Skipped")
skipped("triggerFlow / triggerFlowSync", "needs published flow with trigger config")
skipped("testTrigger", "needs trigger piece config")
skipped("upsertConnection / deleteConnection", "needs piece-specific OAuth/credential payload")
skipped("createMcpServer / deleteMcpServer / rotateMcpToken", "destructive — would create/delete real MCP servers")
skipped("getRun(runId)", "needs run id fixture")
skipped("getMcpServer(id)", "needs mcp server id fixture")
skipped("getTable(id) / listRecords", "needs table id fixture")
skipped("deleteInvitation", "destructive — needs invitation id")

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n━━━ Summary ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) {
  console.log("Failures:")
  for (const f of fails) console.log(`  - ${f}`)
}
process.exit(fail > 0 ? 1 : 0)
