# Troubleshooting

## `AuthError: Invalid or expired API key (x-api-key).` (HTTP 401)

API key in `.env` has expired.

```bash
# Update .env
IMBRACE_API_KEY=new_api_key
```

---

## `ApiError: [404]` with double path in URL

The `baseUrl` / `base_url` passed to the constructor points to a full endpoint path instead of just the gateway root.

> The SDK does **not** auto-read environment variables. Convention is `IMBRACE_GATEWAY_URL` in `.env`; you pass it manually: `new ImbraceClient({ baseUrl: process.env.IMBRACE_GATEWAY_URL })`.

```env
# Incorrect
IMBRACE_GATEWAY_URL=https://app-gatewayv2.imbrace.co/private/backend/v1/third_party_token

# Correct
IMBRACE_GATEWAY_URL=https://app-gatewayv2.imbrace.co
```

---

## Integration tests all skipped

`IMBRACE_API_KEY` is not set.

```bash
# Set temporarily during execution
IMBRACE_API_KEY=api_xxx pytest tests/integration -v -m integration

# Or add to .env
echo "IMBRACE_API_KEY=api_xxx" >> py/.env
```

---

## `Cannot find module` (TypeScript tests)

Import paths in test files must be relative to the directory depth:

| Test file location               | Import                            |
| -------------------------------- | --------------------------------- |
| `tests/unit/*.test.ts`           | `../../src/client.js`             |
| `tests/unit/resources/*.test.ts` | `../../../src/resources/x.js`     |
| `tests/integration/*.test.ts`    | `../../src/client.js`             |

---

## `mypy` error: `Pattern matching is only supported in Python 3.10`

mypy scanning `site-packages` by mistake. Configured in `pyproject.toml`. If it persists:

```bash
mypy src/imbrace --exclude site-packages
```

---

## CLI: commands return `401 Unauthorized`

Your credential has expired or the API server has a stale token.

```bash
imbrace login --api-key api_xxx...
```

---

## CLI: `workflow run --sync` times out

The sync mode may time out at ~60s. Use async + poll instead:

```bash
imbrace workflow run <flowId> --payload '{}'
imbrace workflow runs --limit 10           # find the run ID
imbrace workflow run-detail <runId>        # check result
```
