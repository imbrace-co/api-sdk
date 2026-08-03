# test-accesstoken-pkg/ts — Verify `@imbrace/sdk` from npm with Access Token auth

Pulls the **public npm release** of `@imbrace/sdk@^1.0.3` and exercises every
method documented at https://developer.imbrace.co/sdk/ai-agent/.

Access Token mode covers the user-context endpoints (chat-client persistence,
votes, document suggestions) which API Key mode skips.
For server-to-server scenarios, see the sibling [`test-api-pkg/ts`](../../test-api-pkg/ts/).

## Setup

```bash
cp ../../../.env.example .env
# edit .env with real IMBRACE_ACCESS_TOKEN + IMBRACE_ORGANIZATION_ID

npm install
```

## Run

```bash
npm test
```

Exit code is `1` if any non-expected step fails.
