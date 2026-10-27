// Serves https://engineer.imbrace.co/skill.md: the iMBrace agent skill, so a
// coding agent can be told "Read https://engineer.imbrace.co/skill.md ...".
//
// The site is static (GitHub Pages), so the file is fetched from the latest
// published `imbrace-vibe-code-v2` package at build time. A new package
// version shows up here on the next docs deploy.

import type { APIRoute } from 'astro'

const SOURCE = 'https://unpkg.com/imbrace-vibe-code-v2/skill/SKILL.md'

export const GET: APIRoute = async () => {
  const res = await fetch(SOURCE)
  if (!res.ok) {
    // Fail the build rather than publish an empty or broken skill file.
    throw new Error(`skill.md: fetching ${SOURCE} failed with ${res.status}`)
  }
  return new Response(await res.text(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
