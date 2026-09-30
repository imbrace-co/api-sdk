---
level: '3'
track:
- build
verified_on: '2026-09-25'
---

# The eight principles

Eight ideas separate a build that works once from a build that keeps working. None of them
require exotic technology. Most are decisions about where a piece of logic lives, and who
gets to change it.

## 1. Provenance

**What it means.** Every number an answer contains can be traced to where it came from, or
the answer says plainly that it is not in the data. A figure with no source behind it is not
a cheaper version of a sourced figure - it is a different kind of thing, and the difference
is invisible until someone acts on it.

**What good looks like.**
- Every figure in an answer comes with the records it was drawn from, and the date the data
  is current to.
- A quoted line is checked against the document it claims to come from, and the answer says
  where in that document it appears.
- When the answer is not in the data, the reply says so plainly, with no invented figure to
  fill the gap.
- Each kind of answer has a fixed shape - which figures, from which sources, in which order.
  A fixed shape stops invented figures where written rules alone do not.

**How it goes wrong.**
- **The confident summary.** A number that reads well, produced by an AI, with nothing
  behind it. It survives review precisely because it reads well.
- **Provenance as decoration.** A source list that names a document but not the specific
  rows or passage, so nobody can actually check the figure without redoing the work.
- **The softened finding.** A flagged problem quietly downgraded on a later pass, with
  nobody noticing it changed.
- **The quote that only exists.** A check that a quoted line appears in the source proves the
  line exists, not that it supports the verdict it is quoted for.

**Questions to ask.**
1. Pick any figure in a recent answer. Can you get from it to the record it came from,
   without asking the person who built it?
2. Does the answer carry an as-of date?
3. Take a quoted line. Can the system prove it appears in the source, and say where?
4. When the data cannot answer a question, what does the person actually see?
5. Does each quoted line actually support the verdict it is attached to, or does it only
   appear in the source?

## 2. Determinism

**What it means.** The AI picks which rule applies. The rule itself lives as data a person
can read and change. The arithmetic is always carried out the same way. Nothing consequential
is worked out inside an AI's own reasoning, and the same question asked twice gets the same
answer.

**What good looks like.**
- Arithmetic always goes through one dedicated calculating step, with every input shown.
- Rules live as rows or fields a person can edit, so changing a threshold does not need a
  developer or a new release.
- A rule the system does not yet implement refuses cleanly rather than being silently
  skipped or guessed at.

**How it goes wrong.**
- **The rulebook in the prompt.** Limits, criteria or thresholds written into an AI's
  instructions, where nobody can edit, quote, or audit them.
- **The calculator you can skip.** Nothing forces the AI to use the dedicated calculating
  step, so under load it works the sum out itself - and is usually right, until it is not,
  silently.
- **The mixed-up rules.** Numbers a system applies automatically and wording an AI is meant
  to quote, stored together in a way that blurs which is which.
- **The negative rule.** A rule written as what must not happen is easy to read the wrong way
  round, by a person or a model. State each rule as the condition you want to see, and keep an
  either-or requirement as one rule, not two.

**Questions to ask.**
1. Where, specifically, does each number in an output get computed?
2. Can a business person change a threshold or a limit without asking a developer?
3. Ask the same question twice. Are the two answers identical?
4. What happens today when the system meets a rule it has not been taught yet?

## 3. Modularity

**What it means.** A build is assembled from parts, each with a clear job and a clear
contract, rather than one large tangle of bespoke logic. Something is only "shared" once two
separate, named uses actually use it as it stands - not because it looks reusable.

**What good looks like.**
- Each part does one job, has a defined input and output, and can be tested on its own.
- A part called shared genuinely has two real users using it unchanged. At least one of
  those uses is not the one it was originally built for.
- Two versions of something that differ by an edited internal detail are honestly two
  different parts, not one part pretending to be generic.

**How it goes wrong.**
- **Shared by aspiration.** A part labelled reusable with exactly one real user, so the next
  team inherits a promise that was never actually true.
- **The forked copy.** A second version that needed one more tweak, so someone copied the
  whole thing rather than parameterising it. Now there are two things to maintain and one
  name for both.
- **The part with no user.** Built because it seemed generally useful. Maintained forever.
  Used once, if at all.

**Questions to ask.**
1. Pick something labelled shared. Name its two real, separate users.
2. Does any "variant" actually differ by an edit to the core logic, rather than by its
   configuration?
3. Can one part be tested on its own, without a live account or a network connection?
4. Is there anything in the build with no real, named user? Why does it exist?

## 4. Domain-free cores

**What it means.** The reusable logic at the centre of a build - an agent's core
instructions, a shared skill - carries no customer name, no specific business process, no
detail that belongs to one company. Everything specific to one company arrives as
configuration, supplied alongside the core rather than baked into it.

**What good looks like.**
- The core reads like a description of a role or a job to do, not like one company's
  process written out in prose.
- Every piece of company-specific detail is supplied through configuration, and the core
  contains nothing beyond what that configuration actually declares.
- The same core can serve a different company or a different industry by changing only its
  configuration, with no edit to the core itself.

**How it goes wrong.**
- **The baked-in business.** A prompt or a body of logic carrying one company's product
  list, terminology or process, which goes stale the moment that company's data changes.
- **The company name in a general part.** A part named for one deal or one customer, which
  the next team cannot reuse without renaming and rewriting it.
- **The configuration that lies.** Settings declared and never actually used by the core, or
  used by the core without ever being declared - so nobody can tell what the core actually
  depends on.
- **The baked address.** A machine's network address written into a workflow. It ties the
  build to one network, so moving the installation means finding and changing every step that
  used it. Refer to services by the installation's own internal names, and confirm them with
  whoever runs it.

**Questions to ask.**
1. Search the core logic for a company name, an account identifier, or a customer-specific
   term. What comes back?
2. Could this core serve a different company or industry by changing only its
   configuration?
3. Does every setting in the configuration actually get used by the core, and does the core
   use nothing beyond what is declared?
4. Does any workflow contain a machine's network address?

## 5. Human governance

**What it means.** A gate is a recorded decision on a specific item - who decided, what they
decided, and when - and it fails closed. No decision recorded means no output goes out. The
surface a person uses to decide is a design choice per use case; that the decision gets
recorded is not.

**What good looks like.**
- The gate works out its own answer from the underlying data, rather than trusting whatever
  the AI just said in the same turn.
- The decision is written down with who decided, what they decided, and when - captured by
  the system itself, not just visible in a chat transcript.
- Nothing consequential is auto-approved. A missing decision blocks the output rather than
  letting it through by default.
- The ask pauses the process, it does not end it. Once the decision lands, the same run
  carries on by itself - finishing the job or telling the person who asked - without anyone
  having to come back and ask again.

**How it goes wrong.**
- **The gate with nothing behind it.** A status field a person is meant to update, with
  nothing actually watching it or acting on the change. It looks like oversight and provides
  none.
- **The conversational yes.** A person types "yes" to an AI and nothing is recorded anywhere
  durable, so the decision exists only in a transcript nobody will read again.
- **The trusting gate.** The approval step reads the number the AI proposed instead of
  working it out independently, so a wrong number can approve itself.
- **The self-approving agent.** The agent can write the decision itself - the status, the
  approval, the decider - through the same tool it uses for everything else. Columns that
  record a decision should take their starting value when the record is created and refuse
  every later write from the agent.
- **The missing verdict read as a pass.** A check that has not run yet, or that failed, leaves
  a record looking exactly like one that passed. Stamp a verdict on every record, clear ones
  included, and make every later step wait for it and refuse without it.
- **The ask that hangs up.** The decision gets recorded and nothing after it moves. The
  person who asked has to notice and follow up themselves.

**Questions to ask.**
1. Show the record of the last decision that was made. Who, what, when?
2. If the approver were unavailable, would anything still go out?
3. Does the gate work out its own answer, or does it trust a number it was handed?
4. What happens if the same decision arrives twice?
5. Can the agent write the columns that record a decision?
6. What does a later step do when the check has not stamped the record yet?
7. Approve it, reject it, and leave one unanswered. In each case, does the process carry on
   by itself - the job finished or the outcome reported - with nobody having to ask twice?

See [Human approval](/learn/build-it-well/human-approval.md) for the five places a person can actually make a
decision, and why a chat reply on its own is not one of them.

## 6. Native-first

**What it means.** If the platform already gives you a way to do something - move data,
send a message, wait for a person, connect to another system - use that, rather than writing
custom code to do it yourself. If you can name a capability as a feature of the
platform, rebuilding it in custom code hides it, ages badly, and usually ends up needing a
credential that the built-in way would never have needed.

**What good looks like.**
- The build reads step by step through the platform's own building blocks, understandable to
  someone who is not a developer.
- Connections to other systems are held in the platform's own connection store, scoped and
  reusable, never embedded inside the build's logic.
- Where custom code is genuinely needed, it only computes over the inputs it is given; it
  does not call out to anything else on its own.
- Any exception is written down: which capability was considered, why it was not used, and
  what would let it be retired.

**How it goes wrong.**
- **The hand-rolled shortcut.** Custom code doing something the platform already offers,
  usually because nobody checked first. It typically needs a credential the built-in way
  would not have needed, and it breaks the moment the build moves somewhere else.
- **The glorified script.** One large piece of custom logic with a thin layer of AI on top.
  It gets the right answer and demonstrates nothing about whether the design holds up.
- **The silent credential.** A login or key embedded somewhere in a build that nobody wrote
  down, so nobody ever goes back to remove it.

**Questions to ask.**
1. Open the build. Can someone who is not a developer say what each step does?
2. Search the build for anything that looks like a credential or an access key. What comes
   back?
3. For each piece of custom code: which platform capability was considered, and why was it
   not enough?
4. Move the build to a different account or environment. What breaks?

More on this in [Native-first](/learn/build-it-well/native-first.md).

## 7. Operability

**What it means.** Keeping a build running is part of building it, not an afterthought: a
way to reset it back to a known state, a fixed set of test cases to score it against, every
mode of the build actually exercised, and a second, independent pass that checks the first
one's work.

**What good looks like.**
- Every part of the build has a test that can run with no live account or credential, and
  those tests run automatically before anything ships.
- A fixed set of test cases is scored the same way every time, and a case that could not run
  is reported as skipped - never silently counted as a pass.
- A second, independent check reviews the main path and flags disagreements, without quietly
  fixing them itself.
- The build can be reset to its starting state from within the platform, not by someone
  manually restoring it from a laptop.
- Error replies from tools are short, and each conversation is sized to fit the context of
  the model that runs it.

**How it goes wrong.**
- **The unseen green.** A report that a test passed, pasted in rather than actually watched
  run.
- **Everyone's own scoring.** Each build inventing its own way of comparing results to
  expectations, so no two reported scores mean the same thing.
- **The unresettable demo.** A build that works once and then needs its author personally to
  put it back together before it can be shown again.
- **The unaudited pass.** One result, believed, because nothing else ever checked it.
- **The status taken as the outcome.** A step's status tells you the step ran; the record it
  was meant to produce tells you the work happened. Check the record.
- **The trusted answer key.** Test answers are written by people and can be wrong. Where a
  result disagrees with the key, check the key too, and report results against both the
  original key and the corrected one.

**Questions to ask.**
1. Did you run the tests yourself, and did you watch them pass?
2. Where is the fixed test set, and when was it last scored?
3. Reset the build. Does it come back to exactly the same state?
4. What independently checks the main path, and when did it last find a disagreement?
5. Could someone who did not build this install and run it from the package and the
   documentation alone?
6. For each step, which record proves its work happened?

## 8. Security and sovereignty

**What it means.** A credential on this kind of platform is a key to a great deal, not a
single password to one small thing. Treat it that way: scoped narrowly, held in
configuration, never embedded in the build's own logic, never committed to a shared
document, and never handed to an AI coding tool as part of its working context.

**What good looks like.**
- A build reaches other systems through the platform's own connections, so its logic
  contains no credential at all and can be shared or moved safely.
- Any deliberate exception is written down on the build itself, naming what it is and what
  would remove the need for it.
- Automated checks catch the rest before anything ships: no credential-shaped text, no
  internal machine names or file paths, no personal contact details.
- Masking of sensitive fields is enforced by the platform itself on the underlying data, not
  by a step in the logic that could be skipped or forgotten. A store of raw, unmasked
  identifiers is never connected to an AI at all.
- Which AI models read the data is set per installation and per organisation. Before personal
  data goes in, confirm with whoever runs the installation that every model it uses - for
  chat, document reading and search - runs inside the deployment.

**How it goes wrong.**
- **The convenient shortcut.** Temporarily connecting the store of raw, sensitive data
  straight to an AI to answer one awkward question. The separation was the whole guarantee,
  and it just quietly stopped being true.
- **The credential in the export.** A shared package that only works because it carries a
  live credential inside it, handed to someone outside the team.
- **The indistinguishable credential.** Nothing in the process marks a throwaway test
  credential as different from a live one, so a build can end up using the wrong one. Label
  test and live credentials differently, and confirm which kind a build is holding before
  sharing or running it.
- **The unchecked export.** Sharing an export without opening it first. Open every export
  before it leaves the team and confirm it holds no credential, no customer data and no
  personal details.
- **The credential sent to a webhook.** Run history keeps each run's inputs so a run can be
  reviewed later - which is exactly why a credential never belongs in a webhook call. Send an
  identifier and let the workflow use a stored connection.

**Questions to ask.**
1. Search everything about to be shared for anything that looks like a credential. What
   comes back?
2. Is the credential an AI coding tool has access to a limited, disposable one?
3. Is sensitive-field masking enforced by the platform, or by a step someone could skip?
4. Who can see the raw, unmasked data, and what actually stops an AI from being connected to
   it?
5. What does the last package you shared with someone else actually contain?
6. Which AI models read this build's data, and is any of them outside the deployment?
