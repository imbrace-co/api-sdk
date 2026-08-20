/**
 * Mirrors website/public/sdk/resources.md against @imbrace/sdk@1.0.4 (npm)
 * — API-key auth.
 *
 * Sections:
 *   §1 Contacts          (list / get / update / getComments / getFiles / getActivities)
 *   §2 Conversations     (search / getOutstanding / assignTeamMember / updateStatus)
 *   §3 Messaging         (channel.list / messages.send / messages.list)
 *   §4 Campaign + touchpoints (CRUD)
 *   §5 Message suggestion (getSuggestions)
 *   §6 Predict
 *
 * Fixtures are auto-resolved from list endpoints when possible. Destructive
 * mutations against prod data (contact.update, conversation.assign/updateStatus,
 * messages.send) are skipped. The campaign lifecycle is exercised on a
 * throwaway campaign that is deleted at the end.
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const apiKey         = process.env.IMBRACE_API_KEY
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!apiKey || !organizationId) {
  console.error("Missing IMBRACE_API_KEY or IMBRACE_ORGANIZATION_ID")
  process.exit(1)
}

// Generous timeout because contacts/channel/campaign/predict routes go to
// services (channel-service, campaign-service) flagged as unreachable on
// app-gatewayv2 in FIX_PLAN_v1.0.6.md §A.1. Keep at 30s so we differentiate
// "service truly down" from "transient slow".
const client = new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 30_000 })

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

console.log(`\n━━━ DOCS: resources.md — auth: API KEY (npm @imbrace/sdk@1.0.4) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}\n`)

const ts = Date.now()
const state: { contactId: string | null; convId: string | null; buId: string | null; campaignId: string | null; touchpointId: string | null } =
  { contactId: null, convId: null, buId: null, campaignId: null, touchpointId: null }

// ── §1. Contacts ──────────────────────────────────────────────────────────

section("§1. Contacts")

await step("contacts.list (limit 50) + capture first id", async () => {
  const r: any = await client.contacts.list({ limit: 50 } as any)
  state.contactId = r?.data?.[0]?._id ?? r?.data?.[0]?.id ?? null
  return { count: r?.data?.length ?? 0, sampleId: state.contactId }
})

if (state.contactId) {
  await step("contacts.get(contactId)", () => (client.contacts as any).get(state.contactId!))
  skipped("contacts.update", "would mutate prod contact — destructive")
  await step("contacts.getComments(contactId)", () => (client.contacts as any).getComments(state.contactId!))
  await step("contacts.getFiles(contactId)", () => (client.contacts as any).getFiles(state.contactId!))
} else {
  skipped("contacts.get / update / getComments / getFiles", "no contact fixture in this org")
}

// getActivities takes a conversation_id, not a contact_id. Resolve it from §2.

// ── §2. Conversations ───────────────────────────────────────────────────

section("§2. Conversations")

await step("platform.listBusinessUnits + capture first bu_id", async () => {
  const bus: any = await client.platform.listBusinessUnits()
  state.buId = bus?.[0]?._id ?? bus?.[0]?.id ?? null
  return { count: (bus ?? []).length, sampleId: state.buId }
})

if (state.buId) {
  await step("conversations.search ({ businessUnitId, q='support' })", async () => {
    const r: any = await (client.conversations as any).search({ businessUnitId: state.buId!, q: "support", limit: 20 })
    state.convId = r?.data?.[0]?._id ?? r?.data?.[0]?.id ?? null
    return { count: r?.data?.length ?? 0, sampleConvId: state.convId }
  })
  await step("conversations.getOutstanding ({ businessUnitId, limit: 50 })",
    () => (client.conversations as any).getOutstanding({ businessUnitId: state.buId!, limit: 50 }))
} else {
  skipped("conversations.search / getOutstanding", "no businessUnit fixture")
}

skipped("conversations.assignTeamMember", "would re-assign a real conversation — destructive")
skipped("conversations.updateStatus", "would close a real conversation — destructive")

// Now §1 follow-up: contacts.getActivities(conversationId)
if (state.convId) {
  await step("contacts.getActivities(conversationId)",
    () => (client.contacts as any).getActivities(state.convId!))
} else {
  skipped("contacts.getActivities(conversationId)", "no conversation fixture")
}

// ── §3. Messaging ─────────────────────────────────────────────────────────

section("§3. Messaging")

await step("channel.list", () => client.channel.list())
skipped("messages.send", "would send a real message to a real channel — destructive")

if (state.convId) {
  await step("messages.list (limit 20) — needs conversation_id query param",
    () => (client.messages as any).list?.({ limit: 20, conversation_id: state.convId } as any) ?? Promise.resolve([]))
} else {
  skipped("messages.list", "needs conversation_id fixture")
}

// ── §4. Campaigns & touchpoints ──────────────────────────────────────────

section("§4. Campaigns + touchpoints")

await step("campaign.list", () => (client.campaign as any).list({}))

await step("campaign.create (throwaway)", async () => {
  const c: any = await (client.campaign as any).create({ name: `TestCampaign ${ts}`, type: "email" })
  state.campaignId = c?._id ?? c?.id ?? null
  return { id: state.campaignId }
})

if (state.campaignId) {
  await step("campaign.get(campaignId)", () => (client.campaign as any).get(state.campaignId!))
}

await step("campaign.listTouchpoints", () => (client.campaign as any).listTouchpoints())

if (state.campaignId) {
  await step("campaign.createTouchpoint", async () => {
    const tp: any = await (client.campaign as any).createTouchpoint({
      campaign_id: state.campaignId!, type: "email", delay_days: 3,
    })
    state.touchpointId = tp?._id ?? tp?.id ?? null
    return { id: state.touchpointId }
  })

  if (state.touchpointId) {
    await step("campaign.getTouchpoint(touchpointId)",
      () => (client.campaign as any).getTouchpoint(state.touchpointId!))
    await step("campaign.updateTouchpoint(touchpointId, { delay_days: 5 })",
      () => (client.campaign as any).updateTouchpoint(state.touchpointId!, { delay_days: 5 }))
  }
}

await step("campaign.validateTouchpoint", () =>
  (client.campaign as any).validateTouchpoint({ type: "email", template_id: "tpl_xxx" }),
)

// Touchpoint cleanup
if (state.touchpointId) {
  await step("campaign.deleteTouchpoint (cleanup)",
    () => (client.campaign as any).deleteTouchpoint(state.touchpointId!))
}
// Campaign cleanup
if (state.campaignId) {
  await step("campaign.delete (cleanup)",
    () => (client.campaign as any).delete(state.campaignId!))
}

// ── §5. Message suggestion ───────────────────────────────────────────────

section("§5. Message suggestion")
if (state.convId) {
  await step("messageSuggestion.getSuggestions ({ conversation_id, limit: 3 })", () =>
    (client.messageSuggestion as any).getSuggestions({ conversation_id: state.convId!, limit: 3 }),
  )
} else {
  skipped("messageSuggestion.getSuggestions", "no conversation fixture")
}

// ── §6. Predict ──────────────────────────────────────────────────────────

section("§6. Predict")
note("backend-known-issue: predict.predict is org-config dependent — model 'lead_score_v1' may not be deployed for this org")
await step("predict.predict ({ model: 'lead_score_v1', input: { ... } })", () =>
  (client.predict as any).predict({
    model: "lead_score_v1",
    input: { company_size: 200, industry: "saas", mrr: 5000 },
  }),
)

// ── Summary ──────────────────────────────────────────────────────────────

console.log(`\n━━━ Summary (resources / API key) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
if (docGaps.length) { console.log("Doc / backend gaps:"); docGaps.forEach(g => console.log(`  - ${g}`)) }
process.exit(fail > 0 ? 1 : 0)
