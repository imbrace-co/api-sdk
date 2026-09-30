---
title: Working with an AI coding tool
description: The stance, habits and guardrails that keep what an AI coding tool builds on iMBrace trustworthy.
level: '2'
track:
- build
verified_on: '2026-09-23'
---

# Working with an AI coding tool

Most building on iMBrace can now be done with an AI coding tool. That is fine, and it changes
almost nothing about what "done" means. This page is what does change.

## The stance

**The tool assists; the person decides.** Not because the tool is weak, but because
accountability does not transfer. Someone signs off that the build works, and it cannot be
the thing that wrote it.

**A build's report on itself is never trusted.** AI tools make this sharper: a convincing
summary of a passing test is easy to produce and hard to tell from a real one. Run it. Watch
it. Look at the result on the platform. A green you did not see is not a green.

**Say the honest status.** Every piece of a build is one of three things:

- **proposed** - designed, not built;
- **built** - built, but not yet run against the platform and checked;
- **live** - run on the platform, and the result checked by a person.

Nobody is judged for "built". Writing "live" for something that never ran is the failure.

## What to give the tool

- **This guide's `AGENTS.md`**, or the one page that governs the job in front of you. Not
  everything at once: a tool that reads everything has less room left for your problem.
- **The SDK's own map**, fetched fresh from [engineer.imbrace.co](https://engineer.imbrace.co/llms.txt)
  when it writes SDK code. Never an old copy.
- **The organisation itself**, over the MCP connection, when the question is about what
  exists or what happened - see [Getting started](getting-started.md).

## The guardrails

- **No credential in a workflow, a code step, a prompt, or a committed file.** Credentials
  live in the organisation's connection store, or in a local `.env` that is never committed.
- **A code step is pure** - numbers in, a result out, no network call, no key - or it says
  plainly why it is not.
- **A refusal is data, not an error.** "I could not find that" is a valid, useful answer.
- **A skipped check is never a pass.** If a test could not run, say it did not run.
- **No personal data** in test data, logs, prompts or examples. Invent it.
- **Write for a stranger.** Plain sentences, no shorthand, nothing that only makes sense to
  whoever was in the conversation.

## Habits that carry most of the weight

1. **Business outcome first.** Who uses it, what breaks today, what it unlocks. A clever
   answer to a question nobody asked is a wrong answer.
2. **The person sketches first.** Have the person draw the use case - the shape, the parts,
   where a human decides - before the tool proposes a design. It keeps the design theirs.
3. **Disagree with evidence.** When the tool thinks the person is wrong, it says so at once,
   with the evidence, rather than quietly doing what was asked.
4. **Every claim carries an anchor.** A board row, a run's id, a pasted output. No anchor,
   no claim.
5. **Correct records with a date.** When a finding or a decision note turns out to be wrong,
   say so in place, with the date, and leave the original visible.
6. **Someone else reviews it.** The person who did not build it runs the
   [review checklist](../build-it-well/review-checklist.md) before it ships.
7. **Match the ceremony to the size of the change.** A small change gets a small record.

## Keep delegation shallow

If your tool hands work to its own helpers, keep the hand-off at the top level, give each
helper a complete brief, and check each result yourself: when a helper says it fixed
something, open the file and look.

## What done means

Something another person can install, a note they can follow, a test they can run, and an
honest status on each part.

---

*Edition 1.0.1, 30 September 2026. Community edition, published on engineer.imbrace.co - a method guide for building on iMBrace with an AI coding tool.*
