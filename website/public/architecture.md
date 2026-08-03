## Project Structure

This repository contains the Imbrace SDK in two languages (TypeScript and Python), a documentation website, and integration test packages. Both SDKs wrap the same Imbrace Gateway API and expose identical resource namespaces.

---

## Repository Layout

```
api-sdk/
├── ts/                         TypeScript SDK (@imbrace/sdk v1.0.2)
├── py/                         Python SDK (imbrace v1.0.2)
├── website/                    Docs site (Astro Starlight)
├── scripts/                    Dev utilities
├── test-npm-pkg/               End-to-end test against published npm package
├── test-pip-pkg/               End-to-end test against published pip package
└── test-local-pkg/             End-to-end test against local build
```

---

## TypeScript SDK — `ts/`

**Package:** `@imbrace/sdk`  
**Entry point:** `ts/src/index.ts`

```
ts/src/
├── client.ts            ImbraceClient — wires all resources together
├── http.ts              HttpTransport — fetch-based, retry + backoff
├── errors.ts            ImbraceError, AuthError, ApiError, NetworkError
├── environments.ts      Base URL constants (dev / sandbox / stable)
├── service-registry.ts  Maps resource names to instances
├── auth/
│   └── token-manager.ts ThreadSafe token store
├── resources/           One file per namespace (camelCase)
│   ├── ai-agent.ts      client.aiAgent   — streaming chat, embeddings, parquet, tracing, Chat Client
│   ├── chat-ai.ts       client.chatAi    — assistant CRUD, completions, file processing, knowledge hub
│   ├── workflows.ts     client.workflows — flows, triggers, runs, connections, tables
│   ├── boards.ts        client.boards    — CRM boards, items, fields, search, segments, folders, files
│   ├── contacts.ts      client.contacts
│   ├── conversations.ts client.conversations
│   ├── messages.ts      client.messages
│   ├── channel.ts       client.channel
│   ├── platform.ts      client.platform
│   ├── ai.ts            client.ai        — OpenAI-compatible completions/embeddings
│   ├── auth.ts          client.auth      — OTP login flow
│   ├── marketplace.ts   client.marketplace
│   ├── organizations.ts client.organizations
│   ├── workflows.ts     client.workflows
│   └── ...              (account, agent, campaign, health, ips, license, etc.)
└── types/               TypeScript interfaces and type aliases
    ├── board.ts
    ├── channel.ts
    ├── ai.ts
    └── ...
```

### Build & Test (TypeScript)

```bash
cd ts
npm install

# Build
npm run build        # compile to dist/
npm run dev          # watch mode

# Test
npm test                                      # unit tests (no API key needed)
npm run test:integration                      # live API calls (requires IMBRACE_API_KEY)
npm run test:all                              # unit + integration
npm run test:watch                            # watch mode

# Quality
npm run typecheck
npm run lint
```

---

## Python SDK — `py/`

**Package:** `imbrace`  
**Entry points:** `py/src/imbrace/client.py` (sync), `py/src/imbrace/async_client.py` (async)

```
py/src/imbrace/
├── client.py            ImbraceClient (sync)
├── async_client.py      AsyncImbraceClient (async/await)
├── http.py              HttpTransport — httpx-based, retry + backoff
├── exceptions.py        ImbraceError, AuthError, ApiError, NetworkError
├── environments.py      Base URL constants
├── service_registry.py  Maps resource names to instances
├── api_key.py           API key helpers
├── auth/
│   └── token_manager.py Thread-safe token store
├── resources/           One file per namespace (snake_case)
│   ├── ai_agent.py      client.ai_agent   — mirrors TS ai-agent.ts
│   ├── chat_ai.py       client.chat_ai    — mirrors TS chat-ai.ts
│   ├── workflows.py     client.workflows
│   ├── boards.py        client.boards
│   ├── contacts.py      client.contacts
│   ├── conversations.py client.conversations
│   ├── messages.py      client.messages
│   ├── channel.py       client.channel
│   ├── platform.py      client.platform
│   ├── ai.py            client.ai
│   ├── auth.py          client.auth
│   ├── workflows.py     client.workflows
│   ├── campaigns.py     client.campaign
│   ├── predict.py       client.predict
│   ├── message_suggestion.py  client.message_suggestion
│   └── ...              (account, agent, health, ips, license, etc.)
└── types/               Python TypedDicts and type aliases
```

### Build & Test (Python)

```bash
cd py
pip install -e ".[dev]"    # editable install + dev deps (pytest, ruff, mypy)

# Create py/.env for integration tests
# IMBRACE_API_KEY=api_xxx
# IMBRACE_BASE_URL=https://app-gatewayv2.imbrace.co

# Test
pytest tests/unit -v                                    # unit (no API key)
pytest tests/integration -v -m integration              # live API calls
pytest tests/ -v                                        # all tests
pytest tests/unit --cov=src/imbrace --cov-report=term-missing  # coverage

# Quality
ruff check src/ tests/
mypy src/imbrace

# Build wheel
python -m build    # produces dist/imbrace-*.whl
```

---

## Naming Convention

Both SDKs expose the same resource namespaces. Method names follow each language's convention:

| Resource | TypeScript | Python |
|---|---|---|
| AI Agent | `client.aiAgent.streamChat()` | `client.ai_agent.stream_chat()` |
| Chat AI | `client.chatAi.createAiAgent()` | `client.chat_ai.create_ai_agent()` |
| Boards | `client.boards.listItems()` | `client.boards.list_items()` |
| Workflows | `client.workflows.triggerFlow()` | `client.workflows.trigger_flow()` |

---

## Documentation Website — `website/`

Built with [Astro Starlight](https://starlight.astro.build). Supports 4 locales: English (root), `vi`, `zh-cn`, `zh-tw`.

```
website/
├── astro.config.mjs          Site config, sidebar, locale definitions
├── src/
│   ├── content/docs/         MDX source files
│   │   ├── (root)/           English — 15 pages
│   │   ├── vi/               Vietnamese — 15 pages
│   │   ├── zh-cn/            Simplified Chinese — 15 pages
│   │   └── zh-tw/            Traditional Chinese — 15 pages
│   └── components/
│       ├── AuthOnly.astro    Shows content based on selected credential type
│       └── Sidebar.astro     Custom sidebar component
└── public/                   AI-readable plain .md versions of the docs
    ├── index.md
    ├── getting-started/
    ├── guides/
    └── sdk/
```

```bash
cd website
npm install
npm run dev      # dev server at localhost:4321
npm run build    # static output to dist/
```

---

## Scripts

```
scripts/
└── generate-llms-md.mjs   Regenerates website/public/*.md from the MDX source
```

---

## Environment URLs

| Environment | Base URL |
|---|---|
| develop | `https://app-gateway.dev.imbrace.co` |
| sandbox | `https://app-gateway.sandbox.imbrace.co` |
| stable (production) | `https://app-gatewayv2.imbrace.co` |

Set via `IMBRACE_BASE_URL` env var. Defaults to `stable` when unset.
