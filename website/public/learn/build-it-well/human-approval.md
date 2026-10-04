---
level: '3'
track:
- build
verified_on: '2026-09-30'
---

# Human approval

Every build that matters has a moment where a person needs to say yes before something goes
out. Design that moment first: who is asked, where they already work, which document is in
front of them, what they see, and what happens after they answer.

## The decision is one thing, the surface is another

The decision part works out what should happen from the underlying records, refuses to
proceed if nobody has decided, and writes down who decided, what they decided, and when.
That part does not change from build to build.

The surface - where and how a person actually makes that decision - is chosen per use case,
but the default is not a free choice: a person decides from where they already work. For most
reviewers that is their inbox.

## The default: an email with Approve and Reject

The reviewer gets an email that carries everything needed to decide: the facts, the document
itself (the quotation, the CV, the contract) linked or attached, and the recommended action.
Below it are two buttons, Approve and Reject.

1. The build pauses and emails the reviewer. While it waits, nothing goes out.
2. The reviewer reads the email, with the document in front of them.
3. A button opens a confirm page that shows the choice. Opening it decides nothing.
4. Only the page's Confirm records the decision. The other button then stops working, so one
   person gives one answer.
5. The same run carries on: it finishes the job - for example the documents go to the rep -
   and tells the person who asked what happened.

Write the moment in five lines before you build anything: who is asked, where they already
work, which document is in front of them, what they see, and what happens after they answer.
Then keep three things in mind.

- **People, messages and documents lead.** The moment is a person, an email and the document,
  not a grid. The board holds the record behind it.
- **The email is a card, not a notice.** If the reviewer has to open something else to decide,
  the card is missing a fact.
- **Every branch ends somewhere the requester can see:** approved, rejected, expired, no
  answer.

## Other ways, and when to use them

| Surface | How it works | Use it when |
|---|---|---|
| **An email with a confirm page** | one button per outcome; opening a button shows a page, and confirming on it writes the decision | the default, for every reviewer who works in their inbox |
| **A field on a record** | a person flips a status field on a board; the next step fires once it is saved | a fallback, only when the reviewer already works from that board every day. Not for a business person |

Do not ask a business person to approve by picking a value in a data board. It sits in a
grid they have no reason to open, does nothing until it is saved, and does not feel like
deciding.

Which surfaces are available depends on your installation and version; your iMBrace contact
can confirm them. Whatever you choose, walk the path as the reviewer before you rely on it:
they get the email, open it, confirm, and the build finishes.

## The rule that does not bend

**A friendly "yes" typed into a chat is not, by itself, a decision.** It is flow control - it
might tell the conversation to keep going - but it leaves no durable record that anyone can
point to later and say: this was approved, by this person, at this time. A decision is a
recorded answer tied to a specific item, with who decided and when.

Two more rules worth holding onto:

- **The gate works out its own answer.** It recomputes the outcome from the underlying
  records rather than trusting a number it was just handed in the same interaction. A gate
  that trusts what it is told will happily approve a wrong number.
- **No decision means no output.** Not a default. Not a timeout that lets things through
  after a while. If nobody has decided, nothing goes out.

## Details that make a gate hold

- **Opening a link decides nothing.** A person, a mail scanner or a preview may open it. A
  visit shows the page; only the confirming step decides.
- **One email per person, one set of buttons per person.** Record on your own row whose
  buttons they were and when they confirmed, so "approved by" always comes from your record.
- **A second answer changes nothing.** Once one answer is confirmed, the other outcome is
  retired, and the step after the pause is safe to run twice.
- **The confirm page tells the truth.** It shows "done" only after the decision was recorded,
  and says so plainly if it was not.
- **Send the email only once the build is waiting for the answer.**
- **The agent must never be able to write the decision.** Build the columns that record a
  decision so they take their starting value when the record is created and refuse every later
  write from the agent - give the agent narrow tools that cannot reach them.
- **"No verdict yet" must never read as a pass.** A check that has not run, or that failed,
  leaves the record looking exactly like one that passed. Stamp a verdict on every record,
  clear ones included, and make every later step wait for it and refuse without it.
- **A board edit takes effect when it is saved.** If a reviewer does use the board, test the
  gate from the saved state and include "press Save" in their instructions.

## Prove the gate is wired, not just present

A control point is only as good as what is bound to it. Wire the surface to something that
genuinely depends on it, and exercise the whole path end to end as the reviewer: for each
outcome - approve, reject and no answer - start the run, answer from the email they would
really get, and check that the job finished or the requester was told, with no further prompt
from anyone. A gate is not built until that has been done.
