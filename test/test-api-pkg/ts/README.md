# test-api-pkg/ts — Verify `@imbrace/sdk` from npm with API Key auth

Pulls the **public npm release** of `@imbrace/sdk@^1.0.3` (no local link, no `file:` tgz)
and exercises every method documented at https://developer.imbrace.co/sdk/ai-agent/.

The API Key auth path skips/expects-fail on user-context endpoints
(chat-client persistence, votes, etc.) — those need an Access Token.
For full coverage of those, run the sibling [`test-accesstoken-pkg/ts`](../../test-accesstoken-pkg/ts/).

## Setup

```bash
cp ../../../.env.example .env
# edit .env with real IMBRACE_API_KEY + IMBRACE_ORGANIZATION_ID

npm install
```

## Run

```bash
npm test
```

Exit code is `1` if any non-expected step fails.
