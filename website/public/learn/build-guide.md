---
level: '2'
track:
- build
---

# Build guide for AI tools

The iMBrace build guide is this course's [Build it well](/learn/build-it-well/index.md) pages, the
principles behind every good iMBrace build, plus [setting up your coding tool](/learn/build-it/set-up-your-coding-tool.md),
[the tutorial](/learn/build-it/vibe-coding-tutorial.md) and
[Make it wait for a person](/learn/build-it/make-it-wait-for-a-person.md) - packaged as plain files
an AI coding tool reads itself, instead of a page you read and explain to it.

## Who it's for

Anyone building on iMBrace with Claude Code, Codex, Cursor, or another AI coding tool that can
read a project's files.

## How to use it

Download the guide below, then point your tool at it. Three short recipes:

**Claude Code.** Unzip the guide into your project. Its own `CLAUDE.md` is a single line,
`@AGENTS.md`, so once your project's `CLAUDE.md` reads it - directly, or through your own
`@` line pointing at the unzipped folder - Claude Code follows that through to `AGENTS.md`.
Prefer a skill instead: the guide also carries a `SKILL.md`, so installing the unzipped
folder as a Claude Code skill works the same way, without editing `CLAUDE.md` at all.

**Codex and other tools that read `AGENTS.md`.** Unzip the guide so its `AGENTS.md` sits at
your project's root, or add a line to your own root `AGENTS.md` pointing at it. Any tool that
already follows that convention picks it up the same way.

**Cursor.** The guide ships a `.cursor/rules/imbrace.mdc` file. Unzip the guide into your
project and Cursor reads that rule, which points at `AGENTS.md` for the method itself.

## Where the facts come from

The guide is method only: how to design and build well. It never copies SDK, CLI or MCP
facts, because a copied fact goes stale. Instead it tells your tool to fetch
[https://engineer.imbrace.co/llms.txt](https://engineer.imbrace.co/llms.txt) live and read
the page it points to. Connect your tool to a test organisation the same way: see the
[MCP page](https://engineer.imbrace.co/mcp/overview/).

## Downloads

- [Build guide for AI coding tools (.zip)](https://engineer.imbrace.co/learn/imbrace-build-guide-community.zip)
- [The whole course for AI tools (llms-full.txt)](https://engineer.imbrace.co/learn/llms-full.txt)

- **The browsable files** - `AGENTS.md` and the rest, under
  [engineer.imbrace.co/learn/agent-pack/README.md](https://engineer.imbrace.co/learn/agent-pack/README.md)
- **The whole guide in one file**, for a tool that reads a single document instead of a
  folder: [English](https://engineer.imbrace.co/learn/llms-full.txt),
  [Traditional Chinese](https://engineer.imbrace.co/zh-tw/learn/llms-full.txt),
  [Simplified Chinese](https://engineer.imbrace.co/zh-cn/learn/llms-full.txt)
