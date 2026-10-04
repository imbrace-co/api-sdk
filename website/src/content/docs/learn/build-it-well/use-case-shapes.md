---
title: Use-case shapes
description: Nine recurring shapes a business use case takes on iMBrace, and the kinds of parts each one is assembled from.
---

Most business use cases are not as different from each other as they first look. Once you
have seen enough of them, they sort into a small number of recurring shapes. Find the shape
your problem looks like, and you have a first draft of what to assemble - something to argue
with, not a finished design.

Each shape below names what it looks like, then the kinds of parts it is typically built
from. These are kinds of parts and what they do, not specific products - the actual building
blocks live in the platform's own part library.

## 1. Transactional resolver

**It looks like:** someone asks, in plain words, for a priced or configured thing - a quote,
a booking, a specific option worked out for them.

**Typically assembled from:**
- an agent tuned to this kind of transaction
- a skill that looks up existing records
- a skill that searches for matching records
- a skill that runs the calculation, showing every input it used
- a skill that saves the resulting record
- a skill that puts together a document from a template
- a skill that asks a person to approve, by email with a confirm page, before anything goes out
- a skill that sends the finished document to the requester
- where capacity is limited, a skill that reserves a slot against what is genuinely still
  available, not just against a raw quantity

## 2. Extraction back office

**It looks like:** documents arrive - invoices, applications, forms - and need to become
checked, structured records.

**Typically assembled from:**
- an agent that reads incoming documents
- the platform's own document intake
- a skill that splits a document into its separate parts before reading them
- a skill that compares one record against another, including a three-way match where a
  third source is involved
- a skill that checks extracted values against rules
- a skill that finds duplicate records, even ones written slightly differently
- a skill that saves records
- a skill that asks a person for a decision on anything that does not clearly pass
- a skill that sends a message with the outcome
- an independent pass that audits what the first pass did

## 3. Insights desk

**It looks like:** people ask plain-language questions about data that already exists
somewhere in the business.

**Typically assembled from:**
- an agent built for answering questions over data
- a skill that queries the underlying records and returns the query it actually ran, not
  just an answer with no working shown
- a skill that groups and totals records
- a skill that runs calculations
- a skill that sends the answer by email
- an automation that links a new record back to its parent as soon as it appears

Where a figure has to be provable, use the query skill above, which returns the query it ran
with the answer, so anyone can check the number afterwards.

## 4. Conversational front door

**It looks like:** a channel where anyone might arrive - a chat widget, a messaging app, an
inbox - and the build has to work out who it is talking to before it can do anything useful.

**Typically assembled from:**
- an agent standing at that channel
- a skill that verifies who the sender actually is
- a skill that finds a matching record, with a sensible fallback when nothing matches
- the platform's own document intake, for anything sent as a file
- a skill that screens incoming free text for anything that should not be acted on
  automatically
- a skill that asks a person for a decision
- a skill that issues a single-use access link
- a skill that sends a message
- a skill that saves records

## 5. Multi-agent examiner

**It looks like:** a case has to be judged against a rulebook, and the judgment genuinely
needs more than one point of view - a lead coordinating several specialists.

**Typically assembled from:**
- a lead agent, one or more specialist assessor agents, a rulebook reader, and a report
  writer
- a skill that queries the underlying records
- a skill that checks values against rules
- a skill that verifies a quoted line against its source
- a skill that compares records
- a skill that runs calculations
- a skill that saves the resulting records
- a skill that asks a person for a decision
- an independent audit pass over the whole case

## 6. Self-filling CRM

**It looks like:** notes, calls and messages arrive continuously, and need to turn into
records a person then confirms, rather than types in by hand.

**Typically assembled from:**
- an agent that reads incoming notes and messages
- a skill that splits an incoming document into its separate parts
- a skill that verifies a quoted line
- a skill that saves records, including any nested child records that belong to them
- a skill that keeps a running history of what changed and when
- a skill that asks a person to confirm before anything is treated as final
- a skill that writes a short report
- a skill that composes and sends an email
- an automation that waits for a burst of related activity to settle before acting, rather
  than firing on the very first item and being wrong the moment the rest arrive

## 7. Contract or document management

**It looks like:** one long document - a contract, an agreement, a long-form filing - drives
a working record and a schedule of things that need to happen against it.

**Typically assembled from:**
- an agent (sometimes two, working together) that reads the document
- a skill that splits and routes the document to the right handling
- a skill that extracts a wide set of fields and checks the result against the full field
  list
- a skill that verifies a quoted line
- a skill that checks values against rules
- a skill that fills in a template
- a skill that issues a single-use access link
- a skill that stores the resulting file
- a scheduled automation that runs the whole cycle at a set cadence

## 8. Knowledge kit

**It looks like:** people ask questions of a body of documents - policies, manuals, past
correspondence.

This is the one shape where the easy first instinct is often the wrong one, so it is worth
splitting in two:

- **"How do I do this"** is a genuine search question. The platform's own built-in retrieval
  over a set of documents handles this well, and needs nothing more built on top.
- **"How many" or "which document said this, on what page"** is a counting and citing
  question, best answered from records rather than retrieval. Index every page as its own
  record, then use a skill that queries those records and a skill that groups and totals
  them. Counting and citing are then exact.

## 9. Governance showcase

**It looks like:** the point of the build is demonstrating who may see what - access,
masking, and audit, rather than any one transaction.

**Typically assembled from:**
- the platform's own access administration, view-level masking, model governance, and read
  audit
- a skill that masks sensitive fields in anything an agent writes out
- a skill that screens text
- a skill that issues a single-use access link
- an output check on the agent's own answers, as a second layer alongside the platform's
  view-level masking
