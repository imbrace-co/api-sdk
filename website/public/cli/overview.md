# CLI Overview

The Imbrace CLI (`@imbrace/cli`) is a terminal tool for interacting with the Imbrace platform. Commands call the Imbrace platform directly via the `@imbrace/sdk` package. Source: [imbraceltd/imbrace-cli](https://github.com/imbraceltd/imbrace-cli).

```
imbrace (CLI) → https://app-gatewayv2.imbrace.co (Imbrace Platform)
```

## Authentication Flow

The CLI supports two authentication methods:

**1. API Key** (credential starts with `sk-` or `api_`):
- Passed directly to SDK: `new ImbraceClient({ apiKey: credential })`
- Stored as-is in local config

**2. Email + Password** (returns JWT token):
- SDK: `client.login(email, password)` returns the user's organizations; the CLI then calls `client.selectOrganization(orgId)` to obtain an org-scoped token
- Multi-org accounts: pass `--org-id` (single-org auto-selects, multi-org prompts in a TTY)
- The org-scoped JWT is stored as the credential

### Credential Storage

Credentials and per-environment settings are stored in **profiles** via the `conf` npm package with `projectName: "imbrace"`.

| OS | Config path |
|---|---|
| macOS | `~/Library/Preferences/imbrace-nodejs/config.json` |
| Linux | `~/.config/imbrace-nodejs/config.json` |
| Windows | `%APPDATA%\imbrace-nodejs\Config\config.json` |

Each profile stores:

| Field | Type | Description |
|-------|------|-------------|
| `credential` | string | API key or JWT token |
| `method` | `"api-key"` / `"password"` | Authentication method |
| `email` | string? | Email (for password auth) |
| `env` | `"stable"` / `"sandbox"` / `"develop"` / `"prodv2"`? | SDK environment preset |
| `base_url` | string? | Override gateway base URL |
| `organization_id` | string? | Organization ID |
| `timeout` | number? | Request timeout in ms |
| `services` | object? | Per-service URL overrides |
| `check_health` | boolean? | Ping health on client init |

Resolution order for profile selection: `--profile` flag > `IMBRACE_PROFILE` env var > `active_profile` config > `"default"`.

### Auto-login

Resource commands (ai-agent, data-board, document-ai, guardrail, orchestrator, workflow) extend `BaseCommand`, which calls `ensureLoggedIn()` on init. If no credential is found for the resolved profile, it interactively prompts the user to choose a login method (API Key or Email + Password). Auth and profile management commands (`login`, `logout`, `whoami`, `docs`, `profile/*`) extend `Command` directly and do not auto-prompt.

All commands accept a global `--profile` flag to target a specific profile, overriding `IMBRACE_PROFILE` env var and the `active_profile` setting.

Most commands accept `--json` for machine-readable output (exceptions: `login`, `logout`). All commands accept `-h` / `--help` for usage.

## Project Structure

```
imbrace-cli/
└── cli/                     ← oclif CLI
    └── src/
        ├── base-command.ts       ← Auto-login
        ├── config.ts             ← Credential store (conf)
        └── commands/
            ├── login.ts / logout.ts / whoami.ts / docs.ts / update.ts
            ├── profile/      (6 commands: create, delete, list, rename, show, use)
            ├── data-board/    (8 commands)
            ├── ai-agent/      (9 commands)
            ├── document-ai/   (7 commands)
            ├── orchestrator/  (4 commands)
            ├── guardrail/     (5 commands)
            └── workflow/      (32 commands)
```

## Workflow Node Architecture

Workflows use a **linked list** structure via `nextAction` pointers:

```typescript
{
  version: {
    trigger: {
      name: "trigger",
      type: "PIECE_TRIGGER" | "EMPTY" | "PIECE" | "ROUTER" | "LOOP_ON_ITEMS" | "CODE",
      settings: { pieceName, pieceVersion, input, ... },
      nextAction: { ... },
      children?: any[],          // ROUTER branches
      firstLoopAction?: any,     // LOOP_ON_ITEMS body
    }
  }
}
```

All node operations use `applyFlowOperation()` with types: `UPDATE_TRIGGER`, `ADD_ACTION`, `UPDATE_ACTION`, `DELETE_ACTION`, `LOCK_AND_PUBLISH`, `CHANGE_STATUS`, `CHANGE_FOLDER`.
