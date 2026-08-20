# Imbrace CLI — Architecture

## Overview

The Imbrace CLI connects directly to the Imbrace Platform using the `@imbrace/sdk` npm package:

```
imbrace (CLI) → https://app-gatewayv2.imbrace.co (Imbrace Platform)
```

No local proxy server or intermediate service is required. Each CLI command calls the Imbrace platform directly via SDK methods.

### Components

| Component | Directory | Tech | Role |
|---|---|---|---|
| **CLI** | `cli/` | oclif (TypeScript) | Terminal commands (`imbrace login`, `imbrace data-board list`, ...) |

## Authentication Flow

### Two auth methods

**1. API Key** (credential starts with `sk-` or `api_`):
- Passed directly to SDK: `new ImbraceClient({ apiKey: credential, baseUrl })`
- Stored as-is in local config

**2. Email + Password** (returns JWT token):
- SDK: `client.login(email, password)` → internally calls `client.tokenManager.getToken()`
- JWT token stored as credential

### Credential Storage (CLI side)

File: `cli/src/config.ts` — uses `conf` npm package with `projectName: "imbrace"`.

| OS | Config path |
|---|---|
| macOS | `~/Library/Preferences/imbrace-nodejs/config.json` |
| Linux | `~/.config/imbrace-nodejs/config.json` |
| Windows | `%APPDATA%\imbrace-nodejs\Config\config.json` |

Stored fields: `credential`, `method` (`"api-key"` | `"password"`), `email`, `apiUrl`.

### Auto-login

File: `cli/src/base-command.ts`

Every CLI command (except `login`) extends `BaseCommand`, which calls `ensureLoggedIn()` in `init()`. If no credential is found, it interactively prompts the user to choose login method (API Key or Email + Password) using `@inquirer/prompts`.

## AI Agent Create Flow

File: `cli/src/commands/ai-agent/create.ts`

`client.chatAi.createAiAgent(body)` atomically creates:

1. **AI Assistant** — model, instructions, prompt configuration
2. **Web channel** — for the chat widget (`demo_url: "https://chat-widgetv2.imbrace.co"`)
3. **Use-case template** — the card shown in the UI

The `workflow_name` is auto-generated as `<slug>_v<timestamp>` to ensure backend uniqueness (snake_case required):
```typescript
const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
const workflowName = `${slug}_v${Date.now()}`
```

## Workflow Node Architecture

### Node Tree Structure

Workflows use a **linked list** structure via `nextAction` pointers:

```typescript
// Workflow Version structure
{
  version: {
    trigger: {
      name: "trigger",
      type: "PIECE_TRIGGER" | "EMPTY" | "PIECE" | "ROUTER" | "LOOP_ON_ITEMS" | "CODE",
      displayName: string,
      settings: {
        pieceName: string,     // e.g. "@activepieces/piece-slack"
        pieceVersion: string,  // e.g. "0.3.9"
        triggerName?: string,
        actionName?: string,
        input: Record<string, any>,
        propertySettings: Record<string, any>,
        sampleData: Record<string, any>,
      },
      nextAction: { ... },     // ← linked list pointer
      children?: any[],         // ← ROUTER branches
      firstLoopAction?: any,    // ← LOOP_ON_ITEMS body
      valid: boolean,
    }
  }
}
```

### Piece Schema Discovery

Piece details are fetched via SDK `client.workflows.listPieces()` and raw fetch to `GET /activepieces/v1/pieces/<pieceName>` for full field schemas needed to build node inputs.

## Project Structure

```
imbrace-cli/
└── cli/                     ← oclif CLI
    └── src/
        ├── base-command.ts       ← Auto-login
        ├── config.ts             ← Credential store (conf)
        ├── http.ts               ← HTTP client → Imbrace API
        ├── select-board.ts       ← Interactive board selector
        └── commands/
            ├── login.ts / logout.ts / whoami.ts
            ├── data-board/   (8 commands)
            ├── ai-agent/     (9 commands)
            └── workflow/     (20 commands across piece/ node/ conn/ folder/ mcp/)
```
