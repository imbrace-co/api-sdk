# test-api-pkg/py — Verify `imbrace` from PyPI with API Key auth

Pulls the **public PyPI release** of `imbrace==1.0.3` (no editable install,
no local wheel) and exercises every method documented at
https://developer.imbrace.co/sdk/ai-agent/.

The API Key auth path skips/expects-fail on user-context endpoints
(chat-client persistence, votes, etc.) — those need an Access Token.
For full coverage of those, run [`test-accesstoken-pkg/py`](../../test-accesstoken-pkg/py/).

## Setup

```bash
cp ../../../.env.example .env
# edit .env with real IMBRACE_API_KEY + IMBRACE_ORGANIZATION_ID

python -m venv .venv && source .venv/bin/activate     # Linux/Mac
# .venv\Scripts\activate                              # Windows

pip install -r requirements.txt
```

## Run

```bash
python test_ai_agent.py
```

Exit code is `1` if any non-expected step fails.
