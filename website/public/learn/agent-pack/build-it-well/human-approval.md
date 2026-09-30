---
title: Human approval
description: One decision, five places a person can actually make it - and why a chat reply is not one of them.
level: '3'
track:
- build
verified_on: '2026-09-25'
---

# Human approval

Every build that matters has a moment where a person needs to say yes before something goes
out. The decision itself is always the same kind of thing. Where a person makes it can be
different for every use case.

## The decision is one thing, the surface is another

The decision part works out what should happen from the underlying records, refuses to
proceed if nobody has decided, and writes down who decided, what they decided, and when.
That part does not change from build to build.

The surface - where and how a person actually makes that decision - is a design choice, made
per use case, based on where the person already is and how the build needs to behave while
it waits.

## Five places a person can make it

| Surface | How it works | Use it when |
|---|---|---|
| **A field on a record** | a person flips a status field on a board or list; the next step fires automatically once it changes | the reviewer already works from that board day to day. No custom interface needed, and the most common surface by far |
| **A pause that genuinely waits** | the build actually suspends the run until someone resolves it, rather than polling or guessing | the process must not continue at all until a person acts |
| **A single-use link** | a signed link, one per possible outcome; visiting it shows the details, and confirming on it writes the decision | the reviewer is somewhere else entirely, and building them a portal is overkill |
| **An approval card in chat** | the build posts a message with buttons in the channel the reviewer already uses; the run resumes on the click | the reviewer lives in that channel already |
| **A command in a conversation** | a verified person types an approval, referencing the specific item; the system records it against that item | the reviewer is already talking with an agent, and the channel can verify who they are |

All five end at the same place: a recorded decision, tied to a specific item, with who
decided and when.

Recording the decision is not the last step. Whichever surface was used, the process picks
back up on its own once the decision lands - finishing the job it was waiting on, or telling
the person who asked what happened - without anyone having to notice and come back to ask
again.

Which surfaces are available depends on your installation and version; your iMBrace contact
can confirm them. The field on a record is the most widely used and the simplest place to
start. Whatever surface you choose, walk the path as the reviewer before you rely on it: they
are told, they open the item, they record the decision.

## A proven combination: a board column that resumes a paused workflow

When the process must genuinely wait and the reviewer works from a board, combine the first
two surfaces. The workflow creates a task (the Todos step), notifies the reviewer - for
example by email, with a link to the record, never a link that decides - and then pauses to
wait. The reviewer picks approve or reject in a single-choice column on the record. An
automation bound to that one column resumes the paused task. The workflow - not the edit -
then writes the outcome, so there is exactly one writer for the decision.

Notify the reviewer directly. A waiting task only moves when the reviewer knows it is there,
so the message with a link to the record is a required step of the pattern, not an extra.

## The rule that does not bend

**A friendly "yes" typed into a chat is not, by itself, a decision.** It is flow control -
it might tell the conversation to keep going - but on its own it leaves no durable record
that anyone can point to later and say: this was approved, by this person, at this time.

The command surface above is not an exception to that rule. It is what makes a chat message
count as a decision: the system captures it as a structured record against a specific item,
with a verified sender, rather than leaving it sitting in a transcript. A bare "yes" with
nothing to tie it to a specific item is not accepted as a decision at all.

Two more rules worth holding onto:

- **The gate works out its own answer.** It recomputes the outcome from the underlying
  records rather than trusting a number it was just handed in the same interaction. A gate
  that trusts what it is told will happily approve a wrong number.
- **No decision means no output.** Not a default. Not a timeout that lets things through
  after a while. If nobody has decided, nothing goes out.

## Four details that make a gate hold

- **A board edit takes effect when it is saved.** Test the gate from the saved state, and
  include "press Save" in the reviewer's instructions.
- **A decision link shows first and acts only on confirm.** Opening a link - by a person, a
  mail scanner or a preview - must never be enough to record a decision. Send decision links
  only to the reviewer, and keep them, and any identifier that could make the decision, off
  the record itself.
- **The agent must never be able to write the decision.** Build the columns that record a
  decision so they take their starting value when the record is created and refuse every later
  write from the agent - give the agent narrow tools that cannot reach them.
- **"No verdict yet" must never read as a pass.** A check that has not run, or that failed,
  leaves the record looking exactly like one that passed. Stamp a verdict on every record,
  clear ones included, and make every later step wait for it and refuse without it.

## Prove the gate is wired, not just present

A control point is only as good as what is bound to it. Confirm the status field triggers a
real automation on every value it can take, not only the ones you expect.

Wire the surface to something that genuinely depends on it, and exercise the whole path end
to end - including the "nobody decided yet" case - before calling the approval step done.

---

*Edition 1.0.1, 30 September 2026. Community edition, published on engineer.imbrace.co - a method guide for building on iMBrace with an AI coding tool.*
