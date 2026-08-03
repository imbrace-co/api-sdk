## Development Guide

How to set up, build, test, and contribute to the Imbrace SDK monorepo.

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18+ |
| npm | 8+ |
| Python | 3.9+ |
| pip | 21+ |

---

## TypeScript SDK (`ts/`)

### Setup

```bash
cd ts
npm install
```

### Build

```bash
npm run build        # compile TypeScript → dist/
npm run dev          # watch mode (auto-rebuild on change)
npm run clean        # delete dist/
```

### Tests

Unit tests run offline — no API key required.

```bash
# Unit tests
npm test                          # run all unit tests
npm run test:watch                # watch mode
npx vitest run tests/unit/http.test.ts   # single file

# Integration tests (require live API key)
IMBRACE_API_KEY=api_xxx npm run test:integration

# All tests
npm run test:all
```

### Quality

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint src/
```

### Test a local build

```bash
cd ts
npm run build
npm pack                          # produces ts/imbrace-sdk-<version>.tgz

cd ../test/test-local-pkg/ts
npm install                       # installs @imbrace/sdk from the local .tgz
cp ../../../.env.example .env     # fill in credentials
npm run test:all
```

---

## Python SDK (`py/`)

### Setup

```bash
cd py
pip install -e ".[dev]"    # editable install + pytest, ruff, mypy, pytest-httpx
```

### Tests

Unit tests run offline — no API key required.

```bash
# Unit tests
pytest tests/unit -v
pytest tests/unit/test_http.py -v          # single file
pytest tests/unit -k "channel" -v          # by keyword

# Integration tests (require live API key)
# Create py/.env first:
#   IMBRACE_API_KEY=api_xxx
#   IMBRACE_BASE_URL=https://app-gatewayv2.imbrace.co
#   IMBRACE_ORG_ID=org_xxx
pytest tests/integration -v -m integration

# All tests
pytest tests/ -v

# Coverage
pytest tests/unit --cov=src/imbrace --cov-report=term-missing
```

### Quality

```bash
ruff check src/ tests/           # lint
ruff check src/ tests/ --fix     # auto-fix
mypy src/imbrace                 # type check
```

### Build wheel locally

```bash
cd py
python -m build                  # produces dist/imbrace-*.whl
pip install dist/imbrace-*.whl --force-reinstall
```

### Test a local build

```bash
cd test-pip-pkg/py
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m pytest tests/test_guide_flow.py -v
```

---

## Documentation Website (`website/`)

```bash
cd website
npm install
npm run dev      # dev server at http://localhost:4321
npm run build    # production build → dist/
npm run preview  # preview production build locally
```

The site is built with **Astro Starlight** and deployed to GitHub Pages on every push to `main` that touches `website/`.

### Adding or editing docs

- English content: `website/src/content/docs/` (root, no locale prefix)
- Translated content: `website/src/content/docs/vi/`, `zh-cn/`, `zh-tw/`
- Sidebar config: `website/astro.config.mjs`

After editing `.mdx` source, regenerate the AI-readable `.md` files:

```bash
node scripts/generate-llms-md.mjs
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `IMBRACE_API_KEY` | API key (`api_xxx`) for server-to-server calls |
| `IMBRACE_BASE_URL` | Gateway URL (defaults to stable if unset) |
| `IMBRACE_ORG_ID` | Organization ID sent as `x-organization-id` |

Both SDKs read these automatically from the environment (or from `.env` in the project root).

---

## Pre-commit Hooks

The repo uses `husky` + `lint-staged` (configured in `lint-staged.config.js`). Hooks run lint and type checks on staged files before each commit.

```bash
# If hooks are not installed after cloning:
npx husky install
```
