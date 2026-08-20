/**
 * Mirrors website/public/getting-started/setup.md against @imbrace/sdk@1.0.4
 * (npm) — Access Token auth.
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const accessToken    = process.env.IMBRACE_ACCESS_TOKEN
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!accessToken || !organizationId) { console.error("Missing creds"); process.exit(1) }

let pass = 0, fail = 0, skip = 0
const fails: string[] = []

async function step(label: string, fn: () => Promise<unknown>) {
  process.stdout.write(`  • ${label} ... `)
  try { const r = await fn(); console.log(`✓ ${JSON.stringify(r ?? {}).slice(0, 90)}`); pass++ }
  catch (err: any) { console.log(`✗ [${err?.statusCode ?? err?.message}]`); fail++; fails.push(`${label} → ${err?.statusCode ?? err?.message}`) }
}
function skipped(label: string, reason: string) { console.log(`  - ${label}  ⏭ ${reason}`); skip++ }

console.log(`\n━━━ DOCS: getting-started/setup.md — auth: ACCESS TOKEN (npm @imbrace/sdk@1.0.4) ━━━\n`)

console.log("══ §Init by env preset ══")
await step("new ImbraceClient({ accessToken, env: 'stable' }).platform.getMe()",
  () => new ImbraceClient({ accessToken, organizationId, env: "stable" as any, timeout: 8_000 }).platform.getMe())

console.log("══ §Init by baseUrl ══")
await step("new ImbraceClient({ accessToken, baseUrl }).platform.getMe()",
  () => new ImbraceClient({ accessToken, organizationId, baseUrl, timeout: 8_000 }).platform.getMe())

console.log("══ §services override (construct only) ══")
await step("new ImbraceClient({ services: {...} }) constructs ok",
  async () => {
    const c = new ImbraceClient({
      accessToken, organizationId, env: "develop" as any, timeout: 1_000,
      services: { aiAgent: "http://localhost:4000/ai-agent" } as any,
    })
    return { ok: typeof c === "object" }
  })

console.log("══ §Hello-world calls ══")
await step("client.channel.list()",
  () => new ImbraceClient({ accessToken, organizationId, baseUrl, timeout: 8_000 }).channel.list({} as any))
skipped("messages.send", "destructive")
skipped("ai.complete / ai.stream / aiAgent.streamChat", "covered in test-docs-ai-agent.ts")

console.log("══ §OTP login flow ══")
skipped("requestOtp / loginWithOtp", "destructive")

console.log(`\n━━━ Summary (setup / Access Token) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
process.exit(fail > 0 ? 1 : 0)
