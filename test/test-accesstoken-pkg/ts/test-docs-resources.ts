/**
 * Mirrors website/public/sdk/resources.md against @imbrace/sdk@1.0.4 (npm)
 * — Access Token auth. See test-api-pkg/ts/test-docs-resources.ts for
 * commentary.
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

console.log(`\n━━━ DOCS: resources.md — auth: ACCESS TOKEN (npm @imbrace/sdk@1.0.4) ━━━`)
console.log(`gateway=${baseUrl}\norg=${organizationId}\n`)

const ts = Date.now()
const state: { contactId: string | null; convId: string | null; buId: string | null; campaignId: string | null; touchpointId: string | null } =
  { contactId: null, convId: null, buId: null, campaignId: null, touchpointId: null }

note("backend-known-issue: many resources here (contacts, channel-service, campaign, predict) are flagged as unreachable on app-gatewayv2 in FIX_PLAN_v1.0.6.md §A.1. Most failures below are backend ops issues, not SDK bugs.")

section("§1. Contacts")
await step("contacts.list (limit 50)", async () => {
  const r: any = await client.contacts.list({ limit: 50 } as any)
  state.contactId = r?.data?.[0]?._id ?? r?.data?.[0]?.id ?? null
  return { count: r?.data?.length ?? 0, sampleId: state.contactId }
})
if (state.contactId) {
  await step("contacts.get(contactId)", () => (client.contacts as any).get(state.contactId!))
  skipped("contacts.update", "destructive")
  await step("contacts.getComments(contactId)", () => (client.contacts as any).getComments(state.contactId!))
  await step("contacts.getFiles(contactId)", () => (client.contacts as any).getFiles(state.contactId!))
} else {
  skipped("contacts.get / update / getComments / getFiles", "no contact fixture")
}

section("§2. Conversations")
await step("platform.listBusinessUnits + capture first bu_id", async () => {
  const bus: any = await client.platform.listBusinessUnits()
  state.buId = bus?.[0]?._id ?? bus?.[0]?.id ?? null
  return { count: (bus ?? []).length, sampleId: state.buId }
})
if (state.buId) {
  await step("conversations.search ({ businessUnitId, q })", async () => {
    const r: any = await (client.conversations as any).search({ businessUnitId: state.buId!, q: "support", limit: 20 })
    state.convId = r?.data?.[0]?._id ?? r?.data?.[0]?.id ?? null
    return { count: r?.data?.length ?? 0, sampleConvId: state.convId }
  })
  await step("conversations.getOutstanding ({ businessUnitId })",
    () => (client.conversations as any).getOutstanding({ businessUnitId: state.buId!, limit: 50 }))
} else {
  skipped("conversations.search / getOutstanding", "no businessUnit fixture")
}
skipped("conversations.assignTeamMember / updateStatus", "destructive")

if (state.convId) {
  await step("contacts.getActivities(conversationId)",
    () => (client.contacts as any).getActivities(state.convId!))
} else {
  skipped("contacts.getActivities(conversationId)", "no conversation fixture")
}

section("§3. Messaging")
await step("channel.list", () => client.channel.list())
skipped("messages.send", "destructive")
if (state.convId) {
  await step("messages.list (limit 20)",
    () => (client.messages as any).list?.({ limit: 20, conversation_id: state.convId } as any) ?? Promise.resolve([]))
} else {
  skipped("messages.list", "needs conversation_id fixture")
}

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
    await step("campaign.updateTouchpoint(touchpointId)",
      () => (client.campaign as any).updateTouchpoint(state.touchpointId!, { delay_days: 5 }))
  }
}
await step("campaign.validateTouchpoint",
  () => (client.campaign as any).validateTouchpoint({ type: "email", template_id: "tpl_xxx" }))
if (state.touchpointId) {
  await step("campaign.deleteTouchpoint (cleanup)",
    () => (client.campaign as any).deleteTouchpoint(state.touchpointId!))
}
if (state.campaignId) {
  await step("campaign.delete (cleanup)", () => (client.campaign as any).delete(state.campaignId!))
}

section("§5. Message suggestion")
if (state.convId) {
  await step("messageSuggestion.getSuggestions",
    () => (client.messageSuggestion as any).getSuggestions({ conversation_id: state.convId!, limit: 3 }))
} else {
  skipped("messageSuggestion.getSuggestions", "no conversation fixture")
}

section("§6. Predict")
note("backend-known-issue: predict.predict is org-config dependent — model 'lead_score_v1' may not be deployed for this org")
await step("predict.predict ({ model: 'lead_score_v1', input })",
  () => (client.predict as any).predict({ model: "lead_score_v1", input: { company_size: 200, industry: "saas", mrr: 5000 } }))

console.log(`\n━━━ Summary (resources / Access Token) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
if (docGaps.length) { console.log("Doc / backend gaps:"); docGaps.forEach(g => console.log(`  - ${g}`)) }
process.exit(fail > 0 ? 1 : 0)
