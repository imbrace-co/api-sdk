/**
 * Mirrors website/public/guides/api-key.md against @imbrace/sdk@1.0.4 (npm)
 * — Access Token auth.
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const accessToken    = process.env.IMBRACE_ACCESS_TOKEN
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!accessToken || !organizationId) { console.error("Missing creds"); process.exit(1) }

const client = new ImbraceClient({ accessToken, organizationId, baseUrl, timeout: 10_000 })

let pass = 0, fail = 0, skip = 0
const fails: string[] = []

async function step(label: string, fn: () => Promise<unknown>) {
  process.stdout.write(`  • ${label} ... `)
  try { const r = await fn(); console.log(`✓ ${JSON.stringify(r ?? {}).slice(0, 90)}`); pass++ }
  catch (err: any) { console.log(`✗ [${err?.statusCode ?? err?.message}]`); fail++; fails.push(`${label} → ${err?.statusCode ?? err?.message}`) }
}
function skipped(label: string, reason: string) { console.log(`  - ${label}  ⏭ ${reason}`); skip++ }

console.log(`\n━━━ DOCS: guides/api-key.md — auth: ACCESS TOKEN (npm @imbrace/sdk@1.0.4) ━━━\n`)

console.log("══ §Option 2 — programmatic via SDK (requires access-token, which we have) ══")
await step("client.auth.getThirdPartyToken(30) — access-token client should succeed",
  () => (client.auth as any).getThirdPartyToken(30))

console.log("══ §Using the key — re-construct client (covered by §1 init) ══")
skipped("new ImbraceClient({ apiKey }).platform.getMe()", "covered by test-api-pkg")

console.log(`\n━━━ Summary (api-key / Access Token) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=${skip}`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
process.exit(fail > 0 ? 1 : 0)
