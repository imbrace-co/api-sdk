---
level: '1'
track:
- sell
- build
- deploy
verified_on: 2026-09-29
---

# Sales quoting

Quillmoor Components' sales team quotes industrial fasteners and fittings from a large
catalogue, and a discount beyond the standard rule needs a manager's word before it goes
out. iMBrace turns a plain-words request straight into a priced quotation, and only lets it
go final once the right person has approved anything beyond that rule.

## What happens, step by step

Here is the story, start to finish:

1. A sales person asks the agent, called Sales Quoting, for a quotation in plain words: the
   customer, the products and the quantities.
2. The agent reads SQ Catalogue and SQ Pricing Rules, two boards - structured tables in
   DataIQ - that hold Quillmoor's products and its pricing rules.

Screen: The SQ Catalogue board listing Quillmoor's products with their SKUs and prices
*1 Knowledge > DataIQ in the sidebar. 2 The SQ Catalogue board, Quillmoor's products and prices.*

Screen: The SQ Pricing Rules board with the approval_threshold discount rule
*1 Knowledge > DataIQ in the sidebar. 2 The discount rule row, in the approval_threshold field.*

3. It works out the quotation and writes it, line by line, onto the SQ Quotations and
   SQ Quotation Lines boards.

Screen: InsightsIQ's answer: a new quotation written up with its priced lines and total
*1 InsightsIQ in the sidebar. 2 The Sales Quoting agent's answer: the new quotation, priced line by line.*

4. When the discount asked for goes beyond the rule on the SQ Pricing Rules board, the
   quotation's status shows it is waiting for a manager - the platform holds it there
   itself, not on the agent's word.

Screen: The SQ Quotations board with one row showing status awaiting approval
*1 Knowledge > DataIQ in the sidebar. 2 The quotation's own status: awaiting approval.*

5. The manager reviews it and approves it directly on the board.

Screen: The Approved By cell on a quotation row being edited with a manager's name, next to the Save button
*1 The Approved By cell, being edited with the manager's name. 2 The Save button.*

6. A workflow - iMBrace's engine for steps that run on their own once triggered - picks up
   the approval by itself and marks the quotation final. The sales person then asks the
   agent for the finished quotation as a document, ready to send.

Screen: The SQ Quotations board with the row's status now approved
*The quotation's status flipped to approved.*

Screen: InsightsIQ's answer with the finished quotation's number and its document download links
*The Sales Quoting agent's answer: the finished quotation number, with its PDF and XLSX download links.*

## Where people decide

A quotation asking for a discount beyond the standard rule waits for a manager to approve
it before it can go final. It sits there because a discount the rule does not already
allow should always be a person's decision, checked the same way every time by iMBrace
itself, rather than left to memory.

## What you can change without code

The rule a discount is checked against, and everything Quillmoor sells, are both rows on a
board.

| Row | What it controls |
|---|---|
| Each rule on the SQ Pricing Rules board | The margin Quillmoor expects, and the discount level that needs a manager's approval. |
| Each product on the SQ Catalogue board | What Quillmoor sells, and at what price. |
| Each line on the SQ Terms board | The wording that appears on every quotation, such as validity, delivery and payment. |

Change a row, and the next quotation written reads the update - no rebuild needed.

## Try it

If you are a partner, your practice organisation arrives with Sales Quoting already
installed, using Quillmoor Components' catalogue and pricing rules, and the demo script in
your partner kit walks you through running it live, from the first request through to
manager approval and the finished quotation. Anyone else can ask their iMBrace contact to
see it running on an organisation of their own.
