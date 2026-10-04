---
title: Document models
description: How to choose what DocIQ extracts from a document - adopt the platform's default model, extend it, and write your own only as a last resort.
level: '3'
track:
- build
verified_on: '2026-09-23'
---

# Document models - adopt, extend, write

When DocIQ reads a document - a CV, an invoice, a purchase order - a **document model** tells
it what to pull out and which record to fill. There are three ways to get one, and they are
in strict order.

1. **Adopt the organisation's default.** The platform ships a large library of models,
   including resumes, invoices, purchase orders and onboarding checklists. Adopting one costs
   nothing, and every future build on the organisation sees the same fields.
2. **Extend a default when a field is genuinely missing.** Ask your iMBrace contact. Adding
   a field to the default puts it in front of every organisation, instead of forking a model
   for one customer.
3. **Write your own only where no default exists**, and write it in the platform's own style,
   so that a future default can replace it cleanly.

## What not to do

- **Manage a model as its own deliberate step, never as a side effect of a build.** Create or
  change a document model outside a running build, so every build that reads a given document
  type points at the same, single model.
- **Do not leave the choice of model to chance.** Where a step always reads one kind of
  document, tell it which model to use, so every document lands on the board you intend.

## Validate with your own documents

Check each of these with a few of your own documents before a design depends on it:

- **A wide model.** A model with dozens of fields is easier to validate as several focused
  passes. Whatever the size, check each result against the field list so every field is
  accounted for.
- **Nested rows.** Line items on an invoice, jobs in a CV's work history: confirm in your
  test set that each child row lands on the board linked to its parent.
- **A document that is really a table** - a price list, a statement - is many records, not
  one. Read it as rows.
- **A document that does not look like its type.** Include atypical examples in your test
  set - a job description with no duties section, a form missing its standard headings - and
  make sure the agent reports an unrecognised document as unrecognised, never as a success.
- **Organisation-wide settings.** DocIQ's model settings are shared across the organisation.
  Record the settings your build was tested with next to your test set, and re-run the set
  whenever they change.
- **Where the models run.** Which model reads your documents is set per installation and per
  organisation. Where personal data must stay on premises, have whoever runs the installation
  confirm that every model DocIQ uses - for reading and for search - runs inside it, before
  the first real document goes in.

## Design choices that pay off

- **Fewer models is cheaper and more accurate.** Classification compares each document with
  every model in the organisation, so every unused model adds cost and room for error. Keep
  the models you use, and where a step always reads one kind of document, point it at that
  document's board so the model is fixed.
- **Give a closed vocabulary to any field you will group or chart by.** List the allowed
  values in the field's description, so grouping and charting work from a fixed, known set
  of terms.
- **Describe each document type by what it is and what it is not.** Descriptions that name the
  near-identical types a document is not are what keep them apart.

---

*Edition 1.0.3, 4 October 2026. Community edition, published on engineer.imbrace.co - a method guide for building on iMBrace with an AI coding tool.*
