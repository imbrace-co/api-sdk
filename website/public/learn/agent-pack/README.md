# iMBrace build guide - for your AI coding tool

This folder teaches an AI coding tool - Claude Code, Cursor, Codex, Copilot, or any assistant
that can read files - how to build on iMBrace the way we do: pick the shape of the use case,
use the platform's own capability before writing code, keep rules as data a person can edit,
put a real human decision where one is needed, and check the result on the platform instead
of trusting a summary.

It is also readable by people. Start with `build-it-well/index.md` for the method, or
`build-it/getting-started.md` to set up.

## What is inside

**Understand** (level 0)

- `understand/overview.md` - What iMBrace is, how it keeps AI dependable, and what governs it - enough to explain to a customer who might fit.
- `understand/capability-truth-table.md` - A capability-by-capability list of what iMBrace can do right now, with a page or a screen where you can check each one yourself.

**Build it** (level 2)

- `build-it/index.md` - Level 2 of the iMBrace course - build a small working agent on a test organisation.
- `build-it/getting-started.md` - Set up an AI coding tool to build on iMBrace - a test organisation, the SDK, credentials, and a live connection to the organisation.
- `build-it/vibe-coding-tutorial.md` - Build a small working agent on a test organisation, with any AI coding tool.
- `build-it/working-with-ai.md` - The stance, habits and guardrails that keep what an AI coding tool builds on iMBrace trustworthy.
- `build-it/building-blocks.md` - Recognise the five things every iMBrace build is made from, plus the three ways to extend and deliver them, by name and by where each one lives on screen.

**Build it well** (level 3)

- `build-it-well/index.md` - What it takes to design an iMBrace build that survives contact with real use, real load, and real oversight.
- `build-it-well/the-eight-principles.md` - The eight principles behind a build that survives contact with real use - what each one means, what good looks like, and how it goes wrong.
- `build-it-well/use-case-shapes.md` - Nine recurring shapes a business use case takes on iMBrace, and the kinds of parts each one is assembled from.
- `build-it-well/human-approval.md` - One decision, five places a person can actually make it - and why a chat reply is not one of them.
- `build-it-well/native-first.md` - Why you reach for the platform's own building blocks before writing code, and what that buys you.
- `build-it-well/document-models.md` - How to choose what DocIQ extracts from a document - adopt the platform's default model, extend it, and write your own only as a last resort.
- `build-it-well/anti-patterns.md` - The mistakes that get built again and again, what each one costs, and the fix.
- `build-it-well/review-checklist.md` - The eight-principle review, as a checklist you can run on your own build before you ship it.

## How to use it

1. **In a code project (recommended).** Copy this folder into the project, for example as
   `docs/imbrace-build-guide/`. Then point your tool at `AGENTS.md`:
   - **Claude Code:** add the line `@docs/imbrace-build-guide/AGENTS.md` to your project's
     `CLAUDE.md`.
   - **Cursor, Codex, Copilot and other tools that read `AGENTS.md`:** add a line to your
     project's `AGENTS.md`: "When building on iMBrace, follow
     docs/imbrace-build-guide/AGENTS.md."
2. **In a chat assistant with project knowledge**, such as a Claude Project: upload
   `llms-full.txt`, which is the whole guide in one file.
3. **Anywhere else:** give the tool `llms.txt`, the index that lists every page.

Then connect the tool to your test organisation over MCP (`build-it/getting-started.md`), so
it can see what already exists instead of guessing.

## What is not in here, on purpose

The SDK, CLI and API reference. It lives at https://engineer.imbrace.co and changes on its own
schedule, so the guide tells your tool to fetch it fresh rather than work from a copy that
has gone stale.

## Updates

This is edition 1.0.1, 30 September 2026. When the method changes we send a new edition, and
`CHANGELOG.md` says what changed. Replace the whole folder rather than editing it, so your
copy stays in step. Once the guide is published on engineer.imbrace.co, your tool will be
able to read the latest edition there directly.

## Feedback

This is the community edition: it has no partner-specific contact attached to it. Open an
issue at https://github.com/imbrace-co/api-sdk/issues (the public iMBrace repository) about anything wrong, unclear or
missing - especially anywhere your tool followed the guide and still went wrong. That is
the most useful thing you can send us.

---

*Edition 1.0.1, 30 September 2026. Community edition, published on engineer.imbrace.co - a method guide for building on iMBrace with an AI coding tool.*
