#!/usr/bin/env node
/**
 * Refreshes `specs/*.json` from a live gateway, so `npm run codegen` can then
 * regenerate the SDK from them.
 *
 * The specs are the services' curated `agent-tools` exports — the same ones the
 * AI agents register as OpenAPI tool servers. They are committed to the repo so
 * codegen is reproducible and a service adding or renaming an endpoint shows up
 * as a reviewable diff rather than a silent change.
 *
 *   IMBRACE_API_KEY=api_… node scripts/fetch-specs.mjs [--gateway <url>]
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SPEC_DIR = join(HERE, '..', '..', 'specs')

const argv = process.argv.slice(2)
const gwArg = argv.indexOf('--gateway')
const GATEWAY = (
  gwArg !== -1 ? argv[gwArg + 1] : process.env.IMBRACE_GATEWAY ?? 'https://app-gateway.dev.imbrace.co'
).replace(/\/$/, '')

const API_KEY = process.env.IMBRACE_API_KEY
if (!API_KEY) {
  console.error('IMBRACE_API_KEY is required (the gateway rejects unauthenticated spec reads).')
  process.exit(1)
}

/** Where each service serves its spec, relative to the gateway. */
const SPECS = {
  'data-board': '/data-board/openapi.json',
  channel: '/v1/channel-service/v1/openapi.json',
  platform: '/v1/platform/openapi.json',
  marketplace: '/v3/marketplaces/openapi.json',
  workflow: '/activepieces/v1/agent-tools/openapi.json',
}

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete'])

async function main() {
  mkdirSync(SPEC_DIR, { recursive: true })
  let total = 0

  for (const [name, path] of Object.entries(SPECS)) {
    const res = await fetch(`${GATEWAY}${path}`, {
      headers: { authorization: `Bearer ${API_KEY}` },
    })
    if (!res.ok) {
      console.error(`  ${name}: HTTP ${res.status} from ${path}`)
      process.exitCode = 1
      continue
    }

    const spec = await res.json()
    const ops = Object.values(spec.paths ?? {}).reduce(
      (n, item) => n + Object.keys(item).filter((m) => HTTP_METHODS.has(m)).length,
      0,
    )
    total += ops

    // Stable key order + trailing newline, so refreshes produce a clean diff.
    writeFileSync(join(SPEC_DIR, `${name}.json`), `${JSON.stringify(spec, null, 2)}\n`)
    console.log(`  ${name.padEnd(12)} ${String(ops).padStart(3)} ops`)
  }

  console.log(`  ${'TOTAL'.padEnd(12)} ${String(total).padStart(3)} ops from ${GATEWAY}`)
}

main()
