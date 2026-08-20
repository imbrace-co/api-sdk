# test-pip-pkg / py

Smoke test of the published `imbrace` PyPI package against prodv2.

Mirrors the TypeScript `test-npm-pkg/ts/tests/test-guide-flow.ts` so we can
verify Python parity flow-by-flow.

## Setup

```bash
cd test-pip-pkg/py
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
# Access token mode
AUTH_MODE=token python tests/test_guide_flow.py

# API key mode
AUTH_MODE=apikey python tests/test_guide_flow.py
```

`.env` is gitignored — fill it from `.env.example` at the repo root (creds are per-developer).
