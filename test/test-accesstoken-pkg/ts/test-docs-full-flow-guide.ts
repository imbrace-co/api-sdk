/**
 * Mirrors every snippet in website/public/sdk/full-flow-guide.md against
 * the published @imbrace/sdk@1.0.4 (npm), authenticated via Access Token.
 *
 * See test-api-pkg/ts/test-docs-full-flow-guide.ts for the API-key twin.
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"
import { randomUUID } from "node:crypto"

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
    if (expectFail) {
      console.log(`unexpected pass [${dt}ms]: ${summary}`); fail++
      fails.push(`${label} → unexpected pass`)
    } else {
      console.log(`✓ [${dt}ms] ${summary}`); pass++
    }
  } catch (err: any) {
    const code = err?.statusCode ?? err?.message ?? "ERR"
    if (expectFail) { console.log(`✓ (expected fail [${code}])`); pass++ }
    else { console.log(`✗ [${code}]`); fail++; fails.push(`${label} → ${code}`) }
  }
}

function skipped(label: string, reason: string) {
  console.log(`  - ${label}  ⏭ ${reason}`); skip++
}

function section(title: string) { console.log(`\n══ ${title} ══`) }
function note(msg: string) { console.log(`  ℹ ${msg}`); docGaps.push(msg) }

console.log(`\n━━━ DOCS: full-flow-guide.md — auth: ACCESS TOKEN (npm @imbrace/sdk@1.0.4) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}\n`)

const ts = Date.now()
const state: {
  assistantId: string | null
  flowId: string | null
  projectId: string | null
  folderId: string | null
  boardId: string | null
  identifierFieldId: string | null
  itemId: string | null
} = { assistantId: null, flowId: null, projectId: null, folderId: null, boardId: null, identifierFieldId: null, itemId: null }

// ── §1. AI Assistant + streamChat ─────────────────────────────────────────

section("§1. AI Assistant + streamChat")

note("doc-gap: full-flow-guide.md §1 says `chatAi.createAssistant` / `updateAssistant` / `deleteAssistant`; SDK 1.0.4 exposes `createAiAgent` / `updateAiAgent` / `deleteAiAgent` (commit 7662405)")
await step("chatAi.createAiAgent (doc says createAssistant)", async () => {
  const a = await client.chatAi.createAiAgent({
    name: `SupportBot${ts}`,
    workflow_name: `support_bot_v1_${ts}`,
    description: "Handles tier-1 customer support queries",
    instructions: "You are a helpful support agent. Be concise and friendly.",
    provider_id: "system",
    model_id: "Default",
  } as any)
  state.assistantId = (a as any)?.id ?? (a as any)?._id ?? null
  return { id: state.assistantId }
})

if (state.assistantId) {
  await step("streamChat (single)", async () => {
    const res = await client.aiAgent.streamChat({
      assistant_id: state.assistantId!,
      organization_id: organizationId!,
      messages: [{ role: "user", content: "How do I reset my password?" }],
    } as any)
    const reader = (res as any).body?.getReader?.()
    if (!reader) return { drained: 0, kind: typeof res }
    const decoder = new TextDecoder()
    let n = 0, t0 = Date.now()
    while (n < 4 && Date.now() - t0 < 8000) {
      const { done, value } = await reader.read()
      if (done) break
      decoder.decode(value); n++
    }
    try { reader.cancel() } catch {}
    return { drainedChunks: n }
  })
} else {
  skipped("streamChat (single)", "no assistant fixture")
}

if (state.assistantId) {
  await step("streamChat (multi-turn, same session id)", async () => {
    const sessionId = randomUUID()
    for (const content of ["What's your refund policy?", "How long does it take?"]) {
      const res = await client.aiAgent.streamChat({
        assistant_id: state.assistantId!,
        organization_id: organizationId!,
        id: sessionId,
        messages: [{ role: "user", content }],
      } as any)
      const reader = (res as any).body?.getReader?.()
      if (reader) {
        let n = 0, t0 = Date.now()
        while (n < 2 && Date.now() - t0 < 5000) {
          const { done, value } = await reader.read()
          if (done) break
          n++
        }
        try { reader.cancel() } catch {}
      }
    }
    return { sessionId }
  })
} else {
  skipped("streamChat (multi-turn)", "no assistant fixture")
}

// ── §2. Workflows ─────────────────────────────────────────────────────────

section("§2. Workflows + binding (doc-gap: `activepieces` → SDK 1.0.4 uses `workflows`)")
note("doc-gap: full-flow-guide.md §2 uses `client.activepieces.*` everywhere — SDK 1.0.4 only exposes `client.workflows.*`")

await step("workflows.listFlows (limit 5) + extract projectId", async () => {
  const r: any = await client.workflows.listFlows({ limit: 5 })
  state.projectId = r?.data?.[0]?.projectId ?? null
  return { count: r?.data?.length ?? 0, projectId: state.projectId }
})

if (state.projectId) {
  await step("workflows.createFlow", async () => {
    const f: any = await client.workflows.createFlow({
      displayName: `CRM Update on New Lead ${ts}`,
      projectId: state.projectId!,
    } as any)
    state.flowId = f?.id ?? f?._id ?? null
    return { id: state.flowId }
  })
} else {
  skipped("workflows.createFlow", "no projectId fixture")
}

if (state.flowId) {
  await step("workflows.applyFlowOperation UPDATE_TRIGGER (Webhook)", () =>
    (client.workflows as any).applyFlowOperation(state.flowId!, {
      type: "UPDATE_TRIGGER",
      request: {
        name: "trigger",
        type: "PIECE_TRIGGER",
        valid: true,
        displayName: "Webhook",
        settings: {
          pieceName: "@activepieces/piece-webhook",
          pieceVersion: "0.1.24",
          triggerName: "catch_webhook",
          input: { authType: "none" },
          propertySettings: {},
        },
      },
    }),
  )
  await step("workflows.applyFlowOperation LOCK_AND_PUBLISH", () =>
    (client.workflows as any).applyFlowOperation(state.flowId!, {
      type: "LOCK_AND_PUBLISH",
      request: {},
    }),
  )
} else {
  skipped("applyFlowOperation × 2", "no flow fixture")
}

if (state.flowId) {
  await step("workflows.triggerFlow (async)", () =>
    (client.workflows as any).triggerFlow(state.flowId!, {
      contact_name: "Jane Smith", email: "jane@example.com",
    }),
  )
  await step("workflows.triggerFlowSync (expected timeout; flow has no Return Response action)", () =>
    (client.workflows as any).triggerFlowSync(state.flowId!, {
      contact_name: "Jane Smith", email: "jane@example.com",
    }),
    /* expectFail */ true,
  )
} else {
  skipped("triggerFlow / triggerFlowSync", "no flow fixture")
}

if (state.assistantId && state.flowId) {
  await step("chatAi.updateAiAgent (bind workflow; doc says updateAssistant)", () =>
    client.chatAi.updateAiAgent(state.assistantId!, {
      name: `SupportBot${ts}`,
      workflow_name: `support_bot_v1_${ts}`,
      workflow_function_call: [{ flow_id: state.flowId!, description: "Update CRM on new lead" }],
    } as any),
  )
} else {
  skipped("chatAi.updateAiAgent (bind workflow)", "missing assistant or flow fixture")
}

if (state.flowId) {
  await step("workflows.listRuns (limit 10)", () =>
    (client.workflows as any).listRuns({ flowId: state.flowId!, limit: 10 }),
  )
} else {
  skipped("workflows.listRuns", "no flow fixture")
}

// ── §3. Knowledge Hub ─────────────────────────────────────────────────────

section("§3. Knowledge Hub (folders, files, attach to assistant)")

await step("boards.createFolder", async () => {
  const f: any = await client.boards.createFolder({
    name: `Product Docs ${ts}`,
    organization_id: organizationId!,
    parent_folder_id: "root",
    source_type: "upload",
  } as any)
  state.folderId = f?._id ?? f?.id ?? null
  return { id: state.folderId }
})

skipped("boards.uploadFile", "needs binary file fixture (covered in test-files.ts)")

if (state.assistantId && state.folderId) {
  await step("chatAi.updateAiAgent (folder_ids; doc says updateAssistant)", () =>
    client.chatAi.updateAiAgent(state.assistantId!, {
      name: `SupportBot${ts}`,
      workflow_name: `support_bot_v1_${ts}`,
      folder_ids: [state.folderId!],
    } as any),
  )
} else {
  skipped("chatAi.updateAiAgent (folder_ids)", "missing assistant or folder fixture")
}

await step("boards.searchFolders (q='Product')",
  () => client.boards.searchFolders({ q: "Product" } as any))
if (state.folderId) {
  await step("boards.getFolderContents",
    () => (client.boards as any).getFolderContents(state.folderId!))
  await step("boards.updateFolder (rename)",
    () => (client.boards as any).updateFolder(state.folderId!, { name: `Product Docs v2 ${ts}` }))
  await step("boards.searchFiles",
    () => (client.boards as any).searchFiles({ folderId: state.folderId! }))
} else {
  skipped("getFolderContents / updateFolder / searchFiles", "no folder fixture")
}

// ── §4. Boards & items ───────────────────────────────────────────────────

section("§4. Boards & items (CRM)")

await step("boards.create", async () => {
  const b: any = await client.boards.create({
    name: `Sales Pipeline ${ts}`,
    description: "Track all active deals",
  } as any)
  state.boardId = b?._id ?? b?.id ?? null
  return { id: state.boardId }
})

if (state.boardId) {
  await step("boards.createField + find identifier", async () => {
    const u: any = await client.boards.createField(state.boardId!, {
      name: "Company", type: "ShortText",
    } as any)
    const identifier = (u?.fields ?? []).find((f: any) => f?.is_identifier)
    state.identifierFieldId = identifier?._id ?? identifier?.id ?? null
    return { fields: u?.fields?.length ?? 0, identifierId: state.identifierFieldId }
  })
} else {
  skipped("boards.createField", "no board fixture")
}

if (state.boardId && state.identifierFieldId) {
  await step("boards.createItem", async () => {
    const it: any = await client.boards.createItem(state.boardId!, {
      fields: [{ board_field_id: state.identifierFieldId!, value: `Acme Corp ${ts}` }],
    } as any)
    state.itemId = it?._id ?? it?.id ?? null
    return { id: state.itemId }
  })
} else {
  skipped("boards.createItem", "no identifier field fixture")
}

if (state.boardId) {
  await step("boards.listItems (limit 20)",
    () => client.boards.listItems(state.boardId!, { limit: 20, skip: 0 } as any))
  await step("boards.search (q='Acme')",
    () => (client.boards as any).search(state.boardId!, { q: "Acme", limit: 10 }))
} else {
  skipped("boards.listItems / search", "no board fixture")
}

if (state.boardId && state.itemId) {
  await step("boards.updateItem (doc-shape — expected to fail validation)", () =>
    (client.boards as any).updateItem(state.boardId!, state.itemId!, {
      fields: { name: "Acme Corp — Closed Won" },
    }),
    /* expectFail */ true,
  )
  if (state.identifierFieldId) {
    await step("boards.updateItem (canonical shape)", () =>
      (client.boards as any).updateItem(state.boardId!, state.itemId!, {
        data: [{ key: state.identifierFieldId!, value: `Acme Corp — Closed Won ${ts}` }],
      }),
    )
  } else {
    skipped("boards.updateItem (canonical)", "no identifierFieldId")
  }
  await step("boards.deleteItem", () => (client.boards as any).deleteItem(state.boardId!, state.itemId!))
} else {
  skipped("boards.updateItem / deleteItem", "no item fixture")
}

if (state.boardId) {
  await step("boards.exportCsv", () => (client.boards as any).exportCsv(state.boardId!))
} else {
  skipped("boards.exportCsv", "no board fixture")
}

// ── Cleanup ───────────────────────────────────────────────────────────────

section("cleanup")
if (state.boardId) {
  await step("boards.delete (cleanup)", () => client.boards.delete(state.boardId!))
}
if (state.folderId) {
  await step("boards.deleteFolders (cleanup)",
    () => (client.boards as any).deleteFolders({ ids: [state.folderId!] }))
}
if (state.flowId) {
  await step("workflows.deleteFlow (cleanup)",
    () => (client.workflows as any).deleteFlow?.(state.flowId!) ?? Promise.resolve())
}
if (state.assistantId) {
  await step("chatAi.deleteAiAgent (cleanup; doc says deleteAssistant)",
    () => client.chatAi.deleteAiAgent(state.assistantId!))
}

console.log(`\n━━━ Summary (full-flow-guide / Access Token) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) {
  console.log("Failures:")
  fails.forEach(f => console.log(`  - ${f}`))
}
if (docGaps.length) {
  console.log("Doc gaps to fix:")
  docGaps.forEach(g => console.log(`  - ${g}`))
}
process.exit(fail > 0 ? 1 : 0)
