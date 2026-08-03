# CLI Installation

## Install the CLI

### Public npm Package

```bash
npm install -g @imbrace/cli
```

### From Source

Clone the repository and run the install script:

```bash
git clone https://github.com/imbraceltd/imbrace-cli.git
cd imbrace-cli
./install.sh
```

`install.sh` runs `bun install` (or `npm install` if Bun is not available), `npm run build`, `npm link`, then symlinks `imbrace` into `/opt/homebrew/bin` (Apple Silicon) or `/usr/local/bin` (Intel).

### Manual Build

```bash
cd cli
npm install
npm run build
npm link
```

## Authentication

Resource commands (ai-agent, data-board, document-ai, guardrail, orchestrator, workflow) auto-prompt login if not authenticated for the resolved profile. Auth and profile management commands (`login`, `logout`, `whoami`, `docs`, `profile`) do not auto-prompt.

Credentials and environment settings are stored in **profiles**. Resolution order: `--profile` flag > `IMBRACE_PROFILE` env var > `active_profile` config > `"default"`.

### Interactive Login

Pass no flags to be prompted interactively:

```bash
imbrace login
```

You will be asked to choose a method (API Key or Email + Password) and optionally set a profile name and SDK environment.

### Login with API Key

Recommended for CI/CD and coding agents:

```bash
imbrace login --api-key api_xxx...
imbrace login --api-key api_xxx... --profile work
imbrace login --api-key api_xxx... --profile dev --env sandbox --org-id org_xxx
```

Additional flags: `--base-url`, `--timeout`, `--check-health`, `--services`.

### Login with Email + Password

```bash
imbrace login --email user@example.com --password mypass
imbrace login --email user@example.com --password mypass --profile personal
imbrace login --email user@example.com --password mypass --org-id org_xxx
```

Password login resolves your organization before saving the credential: if your
account belongs to one organization it is selected automatically; if it belongs
to several, pass `--org-id <id>` (or pick one interactively when run in a
terminal). The CLI stores the resulting org-scoped token.

### Check Current Login

```bash
imbrace whoami
imbrace whoami --json
imbrace whoami --profile work
```

### Logout

Clear credentials for the active (or named) profile:

```bash
imbrace logout
imbrace logout --profile work
```

If a command returns 401, run `imbrace login --api-key api_xxx...` again.

## Updating the CLI

From **v0.6.8** onwards, the CLI includes a self-update command:

```bash
imbrace update              # update to latest
imbrace update --check      # check for updates without installing
imbrace update --version 0.6.7  # install a specific version
```

For versions older than v0.6.8, update manually:

```bash
npm install -g @imbrace/cli@latest
```

## Credential Storage

| OS | Path |
|---|---|
| macOS | `~/Library/Preferences/imbrace-nodejs/config.json` |
| Linux | `~/.config/imbrace-nodejs/config.json` |
| Windows | `%APPDATA%\imbrace-nodejs\Config\config.json` |
