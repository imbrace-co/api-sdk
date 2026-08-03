# test-accesstoken-pkg/py — Verify `imbrace` from PyPI with Access Token auth

Pulls the **public PyPI release** of `imbrace==1.0.4` and exercises every
method documented at https://developer.imbrace.co/sdk/ai-agent/.

Access Token mode covers the user-context endpoints (chat-client persistence,
votes, document suggestions) which API Key mode skips.

## Setup

```bash
cp ../../../.env.example .env
# edit .env with real IMBRACE_ACCESS_TOKEN + IMBRACE_ORGANIZATION_ID

python -m venv .venv && source .venv/bin/activate     # Linux/Mac
# .venv\Scripts\activate                              # Windows

pip install -r requirements.txt
```

## Run

```bash
python test_ai_agent.py
```

Exit code is `1` if any non-expected step fails.
