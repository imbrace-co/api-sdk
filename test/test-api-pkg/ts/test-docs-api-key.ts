/**
 * Mirrors website/public/guides/api-key.md against @imbrace/sdk@1.0.4 (npm)
 * — API-key auth.
 *
 * The doc demonstrates two ways to obtain an API key:
 *   - Imbrace Portal (UI, not testable here)
 *   - SDK: `client.auth.getThirdPartyToken(30)` — needs an access-token
 *     client because endpoint requires user JWT
 *
 * Then it shows passing the key into the constructor (already covered).
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const apiKey         = process.env.IMBRACE_API_KEY
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!apiKey || !organizationId) { console.error("Missing creds"); process.exit(1) }

const client = new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 10_000 })

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

console.log(`\n━━━ DOCS: guides/api-key.md — auth: API KEY (npm @imbrace/sdk@1.0.4) ━━━\n`)

console.log("══ §Option 2 — programmatic via SDK ══")
note("doc-gap: guides/api-key.md says `client.auth.getThirdPartyToken(30)` requires an access-token client. Calling it with API-key auth typically returns 401/403.")
await step("client.auth.getThirdPartyToken(30) with API-key (expected to fail or restricted)",
  () => (client.auth as any).getThirdPartyToken(30))

console.log("══ §Using the key — re-construct client with apiKey from env ══")
await step("new ImbraceClient({ apiKey }).platform.getMe()",
  () => new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 10_000 }).platform.getMe())

console.log(`\n━━━ Summary (api-key / API key) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
if (docGaps.length) { console.log("Doc gaps:"); docGaps.forEach(g => console.log(`  - ${g}`)) }
process.exit(fail > 0 ? 1 : 0)
