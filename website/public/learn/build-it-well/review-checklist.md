---
level: '3'
track:
- build
verified_on: '2026-09-25'
---

# Review checklist

This is the same review used internally, written so you can run it on your own build.
It takes about an hour, and it is far more useful when the person running it did not build
the thing being reviewed.

## How to run it

1. Copy the scoring table below next to the build you are reviewing.
2. Work through each principle's questions, drawn from
   [The eight principles](/learn/build-it-well/the-eight-principles.md).
3. Score every question: **achieved**, **partial**, **not achieved**, or **not
   applicable**.
4. Every score needs an **anchor** - something concrete that proves it: a specific record, a
   pasted result you watched happen, a screenshot of the actual behaviour. A score with
   nothing behind it is an opinion, not a review.
5. Anything scored **not achieved** becomes either a fix before you ship, or a written,
   dated note saying who accepted the gap and why.

## The rules that make it worth doing

- **The reviewer did not build it.** A person reviewing their own work tends to find only
  what they already knew about.
- **Run things; do not just read about them.** Do not assume a test passes because it looks
  like it should. Run it and watch the result.
- **"Not applicable" needs a reason.** It is a legitimate score, but silence is not - write
  down why the question does not apply here.
- **A partial is not a pass.** It is a named gap with an owner and, ideally, a date to
  revisit it.
- **This reviews the build, not the person.** The goal is a better artifact, not a
  judgement on whoever made it.

## 1. Provenance

| # | Question | Score | Anchor | Note |
|---|---|---|---|---|
| 1 | Can you get from a figure in the output to the record behind it, unaided? | | | |
| 2 | Does the answer carry an as-of date? | | | |
| 3 | Is a quoted line proved against its source, with a location? | | | |
| 4 | What does a person see when the data cannot answer the question? | | | |
| 5 | Does each quoted line support its verdict, or does it only appear in the source? | | | |

## 2. Determinism

| # | Question | Score | Anchor | Note |
|---|---|---|---|---|
| 1 | Where, specifically, is each number computed? | | | |
| 2 | Can a business person change a threshold without a developer? | | | |
| 3 | Does the same question, asked twice, give the same answer? | | | |
| 4 | What happens when the system meets a rule it does not yet implement? | | | |

## 3. Modularity

| # | Question | Score | Anchor | Note |
|---|---|---|---|---|
| 1 | For anything labelled shared, name both real, separate uses of it. | | | |
| 2 | Does any variant actually differ by an edit, rather than by its configuration? | | | |
| 3 | Can a part be tested on its own, with no live account or network? | | | |
| 4 | Is there anything in the build with no real, named user? | | | |

## 4. Domain-free cores

| # | Question | Score | Anchor | Note |
|---|---|---|---|---|
| 1 | Does the core logic contain a company name or a customer-specific detail? | | | |
| 2 | Could this core serve a different company by changing only its configuration? | | | |
| 3 | Does every setting in the configuration get used, and is everything used declared? | | | |
| 4 | Does any workflow contain a machine's network address? | | | |

## 5. Human governance

| # | Question | Score | Anchor | Note |
|---|---|---|---|---|
| 1 | Show the record of the last decision made. Who, what, when? | | | |
| 2 | If the approver were unavailable, would anything still go out? | | | |
| 3 | Does the gate work out its own answer, or trust one it was handed? | | | |
| 4 | What happens when the same decision arrives twice? | | | |
| 5 | Can the agent write the columns that record a decision? | | | |
| 6 | What does a later step do when the check has not stamped the record yet? | | | |
| 7 | Approve it, reject it, and leave one unanswered. Does the process carry on by itself each time? | | | |

## 6. Native-first

| # | Question | Score | Anchor | Note |
|---|---|---|---|---|
| 1 | Can someone who is not a developer read the build and say what each step does? | | | |
| 2 | Does a search of the build turn up anything credential-shaped? | | | |
| 3 | For each piece of custom code, which built-in capability was considered and rejected, and why? | | | |
| 4 | Move the build to a different account. What breaks? | | | |

## 7. Operability

| # | Question | Score | Anchor | Note |
|---|---|---|---|---|
| 1 | Did you run the tests yourself, and watch them pass? | | | |
| 2 | Where is the fixed test set, and when was it last scored? | | | |
| 3 | Does a reset restore the build to exactly the same starting state? | | | |
| 4 | What independently checks the main path, and when did it last disagree with it? | | | |
| 5 | Could a stranger install and run this from the package and the documentation alone? | | | |
| 6 | For each step, which record proves its work happened? | | | |

## 8. Security and sovereignty

| # | Question | Score | Anchor | Note |
|---|---|---|---|---|
| 1 | Does anything about to be shared contain a credential shape? | | | |
| 2 | Is the credential any AI tool has access to a limited, disposable one? | | | |
| 3 | Is sensitive-field masking enforced by the platform, or by a step that could be skipped? | | | |
| 4 | Who can see raw, unmasked data, and what actually stops an AI being connected to it? | | | |
| 5 | What does the last package you shared actually contain? | | | |
| 6 | Which AI models read this build's data, and is any of them outside the deployment? | | | |

## Gaps accepted

| Gap | Why it is acceptable now | Accepted by | Date | Revisit when |
|---|---|---|---|---|
| | | | | |
