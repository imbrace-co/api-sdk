/**
 * Mirrors website/public/getting-started/setup.md against @imbrace/sdk@1.0.4
 * (npm) — API-key auth.
 *
 * The doc is mostly bash install + init variants. We test:
 *   §1 ImbraceClient init via env preset (`env: "stable"`)
 *   §2 ImbraceClient init via baseUrl
 *   §3 services override (just constructs, no call against fake URL)
 *   §4 Hello world calls — platform.getMe / channel.list / ai.complete (covered)
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const apiKey         = process.env.IMBRACE_API_KEY
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!apiKey || !organizationId) { console.error("Missing creds"); process.exit(1) }

let pass = 0, fail = 0, skip = 0
const fails: string[] = []
const docGaps: string[] = []

async function step(label: string, fn: () => Promise<unknown>) {
  process.stdout.write(`  • ${label} ... `)
  try { const r = await fn(); console.log(`✓ ${JSON.stringify(r ?? {}).slice(0, 90)}`); pass++ }
  catch (err: any) { console.log(`✗ [${err?.statusCode ?? err?.message}]`); fail++; fails.push(`${label} → ${err?.statusCode ?? err?.message}`) }
}
function skipped(label: string, reason: string) { console.log(`  - ${label}  ⏭ ${reason}`); skip++ }
function note(msg: string) { console.log(`  ℹ ${msg}`); docGaps.push(msg) }

console.log(`\n━━━ DOCS: getting-started/setup.md — auth: API KEY (npm @imbrace/sdk@1.0.4) ━━━\n`)

console.log("══ §Init by env preset (env: 'stable') ══")
await step("new ImbraceClient({ apiKey, env: 'stable' }).platform.getMe()",
  () => new ImbraceClient({ apiKey, organizationId, env: "stable" as any, timeout: 8_000 }).platform.getMe())

console.log("══ §Init by baseUrl ══")
await step("new ImbraceClient({ apiKey, baseUrl }).platform.getMe()",
  () => new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 8_000 }).platform.getMe())

console.log("══ §services override (construct only — no live call) ══")
note("backend-known-issue: services.aiAgent override target localhost:4000 won't resolve in tests; we just verify constructor accepts the option")
await step("new ImbraceClient({ services: { aiAgent: 'http://localhost:4000/...' } }) constructs ok",
  async () => {
    const c = new ImbraceClient({
      apiKey, organizationId, env: "develop" as any, timeout: 1_000,
      services: {
        aiAgent: "http://localhost:4000/ai-agent",
        dataBoard: "http://localhost:3001/data-board",
        channelService: "http://localhost:3002/channel-service",
      } as any,
    })
    return { ok: typeof c === "object" }
  })

console.log("══ §Hello-world calls — platform.getMe + channel.list ══")
await step("apiKeyClient.channel.list()",
  () => new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 8_000 }).channel.list({} as any))
skipped("messages.send", "destructive")
skipped("ai.complete / ai.stream / aiAgent.streamChat", "covered in test-docs-ai-agent.ts")

console.log("══ §OTP login flow (destructive) ══")
skipped("requestOtp / loginWithOtp", "destructive")

console.log(`\n━━━ Summary (setup / API key) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
if (docGaps.length) { console.log("Doc / backend gaps:"); docGaps.forEach(g => console.log(`  - ${g}`)) }
process.exit(fail > 0 ? 1 : 0)
