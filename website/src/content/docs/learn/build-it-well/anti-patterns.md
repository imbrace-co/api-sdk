---
title: Anti-patterns
description: The mistakes that get built again and again, what each one costs, and the fix.
---

Each of these looks reasonable at the time, which is exactly why they are worth naming in
advance.

## The gate with nothing behind it

A status field a person is meant to update, with nothing actually watching it or acting on
the change. **What it costs:** it looks like oversight in a review and provides none in
production - things go out with nobody having genuinely approved them. **The fix:** wire the
surface to something that truly depends on it, and exercise the full path - including the
"nobody decided yet" case - end to end before calling it done.

## The ask that hangs up

A build asks a person for a decision, then stops there. The decision gets recorded, but
nothing downstream moves: the document is not sent, the person who asked is not told, and
they have to notice and come back to ask again. **What it costs:** it passes a review and
fails in production - work sits recorded but unfinished, and someone has to chase it by
hand. **The fix:** design the ask to pick back up once it is answered - approved, rejected,
or left open - so the process finishes the job or reports the outcome on its own.

## The confident summary

An AI-produced answer that reads well and has nothing behind it. **What it costs:** it
survives review precisely because it reads convincingly, and a decision gets made on a
number nobody can actually trace. **The fix:** require every figure to carry the record it
came from; when the answer is not in the data, say so plainly instead of filling the gap.

## The calculator you can skip

Nothing forces arithmetic through one dedicated, checkable step, so under load the AI just
works the sum out itself. **What it costs:** it is usually right, which is what makes it
dangerous - the failures are rare, silent, and easy to miss until someone checks. **The
fix:** route all arithmetic through one dedicated calculating step, every time, with the
inputs shown.

## The rulebook in the prompt

Limits, criteria or thresholds written into an AI's instructions instead of held as
editable data. **What it costs:** a business person cannot change a number without going
through a developer, and nobody can audit which rule actually fired on a given case. **The
fix:** hold rules as data on a record a non-developer can open and edit directly.

## The forked copy

Copying a working build's internals to create a near-identical version for a new case,
instead of parameterising the original. **What it costs:** two things to maintain that
quietly drift apart, and the next person often does not even know a second copy exists.
**The fix:** parameterise instead of copying. If a genuine second version is truly needed,
give it its own name and its own documentation rather than letting it masquerade as the
first.

## The hand-rolled shortcut

Custom code doing something the platform already offers as a built-in capability, usually
because nobody checked first. **What it costs:** it typically needs a credential the
built-in way would never have needed, and it breaks the moment the build is moved to another
account. **The fix:** check the platform's current capability list before writing any code.
See [Native-first](/learn/build-it-well/native-first/).

## The unchecked extraction

Trusting an extraction result without comparing it with what was asked for. **What it
costs:** a missing field is easy to overlook when nobody checks the output against the field
list. **The fix:** check every result against the field list, and keep a long field list as
several focused passes.

## The retrieval count

Treating a counting or citing question - "how many," "which document, on what page" - as a
search question. **What it costs:** that kind of question needs structured records to answer
exactly; retrieval alone cannot show its working. **The fix:** index the material into
structured records and query them. Save search-and-retrieve for genuine "how do I"
questions.

## The leading-edge fire

A process reacts to the very first item in a related burst of activity, instead of waiting
for the burst to settle. **What it costs:** the result is generated before the rest of the
related items have arrived, and it is wrong or incomplete the moment they do. **The fix:**
wait for the burst to go quiet, then act once, on the complete picture.

## The trusting gate

An approval step that reads the number the AI just proposed instead of working it out
independently from the underlying records. **What it costs:** a wrong number can approve
itself, because nothing ever checked it against the source. **The fix:** the gate always
re-derives its own answer.

## The self-report

A build reporting its own success - a plausible-looking pasted result, a status of "done" or
"live" for something nobody actually watched run. **What it costs:** confidence in a state
of the world that was never actually observed. **The fix:** run it yourself, watch it
happen, and only mark something as working once someone has genuinely seen it work.

## The convenient shortcut around privacy

Temporarily connecting a store of raw, sensitive data directly to an AI to answer one
awkward question. **What it costs:** the separation between sensitive data and the AI was
the entire privacy guarantee, and it has just quietly stopped being true - even if only for
a moment. **The fix:** never connect it, even briefly. If a question genuinely needs the raw
data, it is the wrong question for that AI to be answering.

## The answer key in the prompt

The expected answers - the figures a demo should show - written into the agent's own
instructions. **What it costs:** the demo passes while the tools behind it are wrong, and
nobody finds out until a real question is asked. **The fix:** expected values live in the
test set, never in the instructions, and a check before the agent goes live refuses
instructions that contain them.

## Memory as the data source

An agent answers a live-data question from what it remembers, or from a document attached to
it some time ago, instead of reading the source in front of it. **What it costs:** a
confident answer with yesterday's figures in it. **The fix:** attach no documents to an agent
that answers from live data, give it a standing rule never to save figures to memory or
answer from memory, and keep a test question that would catch a stale answer. Keep the
conversation's own history on for any agent that holds a conversation - it needs it to stand
by what it said earlier.

## Conceding a disputed figure

A person offers their own number and the agent drops its correct, tool-computed figure to
agree with them. **What it costs:** the answer becomes whatever the most confident person in
the conversation says. **The fix:** give the agent a challenge rule - re-run the tool, try to
reproduce the person's figure with a tool, and say plainly what each figure covers.

## The pivot photograph

Reading a pivot table in a converted spreadsheet as if it still calculated. When an Excel
workbook is converted to Google Sheets, its pivot tables keep the values they showed at that
moment and stop updating. **What it costs:** every figure taken from the pivot is frozen at
the conversion date, however current the rows beneath it are. **The fix:** calculate from
the raw rows, and say so wherever the pivot is shown.

## The whole tab in the turn

A large sheet or table handed whole to an agent in a single turn. **What it costs:** it is
more than the agent can take in at once, and whatever follows is built on a partial read
that looks complete. **The fix:** read it with the platform's own read step, total it in a
calculation step, and give the agent only the finished figures, with the rows, filters and
dates they came from. See [Native-first](/learn/build-it-well/native-first/).

## The unused shared part

Something built because it seemed generally useful, then never actually reused, but still
maintained indefinitely. **What it costs:** ongoing upkeep for something that returns no
value, and a false sense that the build is more modular than it actually is. **The fix:**
do not label something reusable until at least two real, separate, named needs for it exist.
