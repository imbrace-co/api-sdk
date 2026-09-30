---
title: Native-first
description: Why you reach for the platform's own building blocks before writing code, and what that buys you.
level: '3'
track:
- build
verified_on: '2026-09-23'
---

# Native-first

Before writing custom code to do something, check whether the platform already does it. This
is not a style preference. It changes what your build costs to run, how safely it can be
moved, and how easily someone else can understand it later.

## The idea in one sentence

If a person could point at a capability and name it as a feature of the platform, it is
almost certainly already built in. Rebuilding it yourself in custom code hides what it does
behind code someone has to read, tends to age badly as the platform evolves, and very often
ends up needing a login credential that the built-in way would never have needed at all.

## What the platform typically gives you, out of the box

A working platform of this kind ships with a large amount of ready-made capability: reading
and writing structured records, sending mail and chat messages across the usual channels,
calendars, spreadsheets, file storage, handling incoming documents, pausing a process to
wait for a person, calling one process from another, routing and looping within a process,
and stopping a run cleanly. Connections to accounts and other systems live in the platform's
own connection store - configured once, referenced by a build, and never carried inside the
build's own logic.

Before writing a line of custom code, it is worth checking the platform's current capability
list for something that already does the job. New capability ships regularly, and the safest
default is always to look before you build.

## When custom code is genuinely justified

Two things both need to be true:

1. **Nothing built in does the job**, and you can say specifically what you checked and why
   it was not enough.
2. **The code is pure** - it only computes over the values it is given. It does not itself
   call out to another system with a credential of its own. If it genuinely needs to reach
   another system, it does that through one of the platform's own connections, not through a
   key embedded in the code.

Any exception to native-first should be written down plainly: what was considered, why it
was not used, and what would let the custom code be retired later. Treat an exception as a
temporary, named debt rather than a quiet permanent choice - and retire it the moment a
built-in way to do the same job ships.

## Why this matters more than it sounds like it should

- **Nothing in a build should ever hold a credential.** A build that only ever uses the
  platform's own connections contains no login details, no API keys, nothing of that shape
  at all. That means the build itself can be shared, exported, or moved to another account
  safely - there is nothing inside it that needs to be rotated, redacted, or worried about.
- **A build using built-in capability is readable by someone who is not a developer.** They
  can open it and see, step by step, what each part does, without opening any code.
  Custom code hides that behind a wall only a developer can read.
- **It survives being moved.** Export a build made from built-in capability into a
  different account, and it needs no rewiring. A build with a credential baked into it
  breaks, or worse, quietly keeps working using the wrong account's access. Connections that
  use a provider sign-in, such as Gmail, are authorised once per account by someone with
  access; a mail-server (SMTP) connection is configured once with the server's details.

## What good looks like

- The build reads step by step in the platform's own view, understandable without opening
  any code.
- A search of the build's logic for anything credential-shaped turns up nothing.
- Every piece of custom code, if any, has a note saying which built-in capability was
  considered and why it was not enough.
- Moving the build to a different account changes nothing about how it behaves.

## A worked example

Take a quoting assistant: sending the finished document needs no custom code at all - the
steps read the record, route on its status, format a date, send the mail and update the
record, all built in. The approval step works the same way, with a built-in task that pauses
the process until a person decides, then picks up again on its own and sends the document.
Custom code is typically limited to a few things: the arithmetic, a database query, a final
verification check and the layout of the document itself.

---

*Edition 1.0.1, 30 September 2026. Community edition, published on engineer.imbrace.co - a method guide for building on iMBrace with an AI coding tool.*
