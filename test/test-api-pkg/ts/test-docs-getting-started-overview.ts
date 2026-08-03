/**
 * Mirrors website/public/getting-started/overview.md against
 * @imbrace/sdk@1.0.4 (npm) — API-key auth.
 *
 * The doc shows a streamChat init example. We just verify init + a basic
 * call (covered fully in test-docs-ai-agent.ts and full-flow-guide).
 */
import "dotenv/config"
import { ImbraceClient } from "@imbrace/sdk"

const apiKey         = process.env.IMBRACE_API_KEY
const organizationId = process.env.IMBRACE_ORGANIZATION_ID
const baseUrl        = process.env.IMBRACE_GATEWAY_URL ?? "https://app-gatewayv2.imbrace.co"

if (!apiKey || !organizationId) { console.error("Missing creds"); process.exit(1) }

const client = new ImbraceClient({ apiKey, organizationId, baseUrl, timeout: 8_000 })

let pass = 0, fail = 0
const fails: string[] = []

async function step(label: string, fn: () => Promise<unknown>) {
  process.stdout.write(`  • ${label} ... `)
  try { const r = await fn(); console.log(`✓ ${JSON.stringify(r ?? {}).slice(0, 90)}`); pass++ }
  catch (err: any) { console.log(`✗ [${err?.statusCode ?? err?.message}]`); fail++; fails.push(`${label} → ${err?.statusCode ?? err?.message}`) }
}

console.log(`\n━━━ DOCS: getting-started/overview.md — auth: API KEY (npm @imbrace/sdk@1.0.4) ━━━\n`)
console.log("══ §Quick example — verify client init + chatAi.listAiAgents (cheap proxy for streamChat init) ══")
await step("client.chatAi.listAiAgents", () => client.chatAi.listAiAgents())

console.log(`\n━━━ Summary (getting-started/overview / API key) ━━━`)
console.log(`pass=${pass}  fail=${fail}  skip=0`)
if (fails.length) { console.log("Failures:"); fails.forEach(f => console.log(`  - ${f}`)) }
process.exit(fail > 0 ? 1 : 0)
