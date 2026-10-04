---
title: Build it well
description: What it takes to design an iMBrace build that survives contact with real use, real load, and real oversight.
---

A demo shows that something can work once. Building it well means it keeps working: with
real data, under real load, with a person genuinely in the loop, and without anyone having
to remember to be careful.

This is not about writing more code. Most of what makes a build solid is design choices you
make before you write anything: which parts you assemble it from, where a human signs off,
what runs on the platform's own capability instead of custom code, and what never leaves the
build's own configuration.

## The eight principles, in one line each

1. **Provenance** - every number in an answer can be traced back to where it came from, or
   the answer says plainly that it is not in the data.
2. **Determinism** - the AI picks which rule applies; the rule itself lives as data a person
   can edit; the arithmetic is always done the same, reliable way.
3. **Modularity** - the build is assembled from parts that each do one job and have a clear
   contract, not one large tangle of custom logic.
4. **Domain-free cores** - the reusable logic carries no customer names, no specific
   business detail; everything specific to one company arrives as configuration.
5. **Human governance** - a real decision is a recorded fact - who decided, what, and when -
   not a friendly "yes" typed into a chat window.
6. **Native-first** - use what the platform already gives you before writing custom code;
   nothing in a build should ever hold a login credential.
7. **Operability** - a build can be reset, tested, and checked independently, not just run
   once by the person who built it.
8. **Security and sovereignty** - credentials, secrets and sensitive data stay in
   configuration and out of the build's own logic.

## What is on this page and what is on the rest

| Page | What it covers |
|---|---|
| [The eight principles](/learn/build-it-well/the-eight-principles/) | Each principle in full: what it means, what good looks like, how it goes wrong, and the questions to ask of your own build. |
| [Use-case shapes](/learn/build-it-well/use-case-shapes/) | Nine recurring shapes a business use case takes, and the kinds of parts each one is typically assembled from. |
| [Human approval](/learn/build-it-well/human-approval/) | How a person decides from an email with Approve and Reject buttons, confirmed on a page - and why a chat reply is not a decision. |
| [Native-first](/learn/build-it-well/native-first/) | Why you reach for the platform's own capability before writing code, and what that buys you. |
| [Document models](/learn/build-it-well/document-models/) | How to choose what DocIQ extracts from a document: adopt the default, extend it, write your own last. |
| [Anti-patterns](/learn/build-it-well/anti-patterns/) | The mistakes that get built again and again, what each one costs, and the fix. |
| [Review checklist](/learn/build-it-well/review-checklist/) | The same eight-principle review, as a checklist you can run on your own build before you ship it. |

None of this requires memorising anything. Pick the page that matches the decision in front
of you, use its questions, and move on.
