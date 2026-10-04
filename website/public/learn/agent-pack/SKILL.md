---
name: imbrace-build-guide
description: Use when designing or writing anything that builds on the iMBrace platform - an agent, a board, a workflow, a document model or a channel - or when reviewing one against iMBrace's own engineering principles. Covers picking the shape of a use case, using the platform's native step before writing code, keeping rules as data a person can edit, placing a real human approval, and checking a build on the platform instead of trusting a summary of it.
---

# iMBrace build guide

Read [AGENTS.md](AGENTS.md) first. It carries the method, the rules every build follows,
and the read order for designing a new one. Its lessons are this guide itself:

- `build-it/set-up-your-coding-tool.md` - a test organisation and key, and connecting your tool over MCP.
- `build-it/vibe-coding-tutorial.md` - build a small working agent end to end.
- `build-it/make-it-wait-for-a-person.md` - make that build wait for a person's decision.
- `build-it/working-with-ai.md` - the stance and habits that keep a build trustworthy.
- `build-it/building-blocks.md` - the five things every build is made from.
- `build-it-well/` - use-case shapes, native-first, the eight principles, human
  approval, document models, anti-patterns, the review checklist.

`llms.txt` lists every page; `llms-full.txt` is the whole guide in one file, for a tool
that reads a single document instead of a folder. SDK, CLI and MCP facts are never in
this guide: fetch them fresh from https://engineer.imbrace.co/llms.txt.

This is the community edition, edition 1.0.3 (4 October 2026) - the same method as
iMBrace's partner build guide, with no partner name attached. `README.md` says how to
install this folder into a project instead of using it as a skill.
