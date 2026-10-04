---
level: '0'
track:
- sell
- build
- deploy
verified_on: '2026-09-30'
---

# What iMBrace does today

Every row below is a capability that works in iMBrace today, checked against a real page or
the product itself - not a plan or a roadmap. Where a row is marked "(Enterprise
installations)", that capability belongs to that kind of installation; everything else is
available generally. Edition and pricing questions go to your iMBrace contact.

## Reaching customers and staff

| What you can do | Where to see it |
|---|---|
| Talk to customers over WhatsApp, Facebook Messenger, Instagram, LINE, WeChat, email, or a web chat widget on your own site - all from one shared inbox | the product (Conversations) |
| See every conversation tracked with its own status - online, overdue, rep needed, pending, or closed - so your team always knows what needs a reply | the product (Conversations) |
| Split conversations by team, in either a first-come-first-served mode or one where everyone on the team can join freely | the product (Teams, Conversations) |

## Agents and knowledge

| What you can do | Where to see it |
|---|---|
| Build an AI agent with its own personality, tone, and core task, and give it reference material to answer from - PDF, Word, plain text, CSV, or Excel files are all accepted | the product (AgentIQ) |
| Point an agent at knowledge your organisation already holds, instead of re-uploading it | the product (AgentIQ, Knowledge) |
| Limit a knowledge folder or board to selected teams, so only the people on those teams can see what is in it | the product (Knowledge) |
| Keep an agent's context through a longer back-and-forth: it remembers earlier turns in the same conversation | the product (AgentIQ, Advanced Settings) |
| Set up an orchestrator agent that hands part of a task to one or more specialised sub-agents | the product (Create Your AI - Orchestrator) |
| Call an agent, or a document-extraction step, from inside an automated workflow, so an AI step runs as part of a bigger process rather than a separate chat | the product (Workflows - AI Agent Skills) |

## Documents

| What you can do | Where to see it |
|---|---|
| Turn a PDF or an image - an invoice, a form, a receipt, a contract, a business card, and more - into a structured record, using a model that reads the layout rather than a fixed template | https://engineer.imbrace.co/sdk/document-ai |
| Set up the extraction once, as a Document Model, and reuse it for every document of that type; a version history shows how it changed | the product (DocIQ, Document Models) |
| Send the extracted result straight to a Data Board, mapped to the columns you choose, and to more than one board at once if you need it | the product (DocIQ) |
| Tell DocIQ which language your documents are in, to improve extraction accuracy, including documents with handwriting | the product (DocIQ, Settings) |
| Upload reference material to a knowledge folder in a wide range of formats - PDF, Word, PowerPoint, Excel, CSV, video, or image files | the product (Knowledge) |
| Limit which teams can use a given Document Model, the same way you limit a knowledge folder | the product (DocIQ, Document Models) |

## Data and workflows

| What you can do | Where to see it |
|---|---|
| Keep structured records on a shared Data Board that every workflow, agent, and person reads and writes | the product (Knowledge, DataIQ) |
| Start a workflow from an incoming message on a connected channel, a schedule, or a change to a Data Board record - created, deleted, or a chosen field updated | the product (Workflows, FlowOps) |
| Reach an outside system from inside a workflow through a pre-built connector - iMBrace ships natively integrated with more than 100 services, from a CRM to a spreadsheet to a ticketing tool | the product (Integrations) |
| Keep a connector's credentials in the organisation's own store, separate from the workflow itself, so a shared or exported workflow definition carries no key | https://engineer.imbrace.co/sdk/workflows |
| Pause a workflow at a decision that matters and hold its place while a specific person decides, then pick the same run back up when they answer, with who decided, what they decided, and when recorded against it. If nobody answers, the run stays paused and visible, and nothing goes out | the product (FlowOps) |
| Ask that person from where they already work: an email with a card of the facts and two buttons, Approve and Reject, each opening a page where they press Confirm. Opening a link decides nothing, and once one answer is confirmed the other button stops working | the product (FlowOps), and the emailed card |
| Finish the job after the answer: once approved, the finished PDF and Excel documents are emailed to the person who asked; if rejected, that person is told and no documents go out. A request that already meets the rules skips the approval, and its documents are emailed straight away | the product (FlowOps, and the requester's inbox) |

## Access and governance

| What you can do | Where to see it |
|---|---|
| Restrict a knowledge folder or a Data Board to selected teams, so a person only sees the teams they belong to | the product (Teams, Access Control) |
| Set a member's permissions by role within a team - for example, a Team Admin versus a Representative | the product (Teams) |
| Restrict an individual field on a record to a specific role, so one board can show different detail to different readers (Enterprise installations) | the product (Access Control) |
| Look back at a record of activity across the platform - logins, file uploads, channel changes, and changes to a Data Board - each one timestamped and, where a person did it, attributed to them | the product (Audit Log) |
| Extend the activity record to AI agent actions as well (Enterprise installations) | the product (Audit Log) |
| Have access rules enforced by the platform's own permission checks, not by anything written into a prompt | the product |

## Where it runs

| What you can do | Where to see it |
|---|---|
| Run iMBrace as a hosted service on iMBrace's own cloud, with nothing to install | https://engineer.imbrace.co/getting-started/setup |
| Install iMBrace on your own infrastructure - a single on-premise server, or a private cloud deployment - instead of the hosted service | https://engineer.imbrace.co/install/kubernetes |
| Choose which AI model answers each agent's questions - a system default, or a provider you connect and manage yourself, model by model | the product (LLM Providers) |

## Building on it

| What you can do | Where to see it |
|---|---|
| Build against iMBrace with an official SDK in TypeScript or Python | https://engineer.imbrace.co/sdk/installation |
| Connect an AI coding tool to a live organisation over one URL and one key - read-only until you turn on write access, one permission at a time | https://engineer.imbrace.co/mcp/overview |
| Hand your coding tool the platform's own map of itself, so it writes correct code on the first try instead of guessing a method name | https://engineer.imbrace.co/llms.txt |
| Manage boards, agents, workflows, and document-extraction jobs from the terminal | https://engineer.imbrace.co/cli/overview |
