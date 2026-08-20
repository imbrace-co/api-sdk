# Imbrace Python SDK

Official Python client for the Imbrace Gateway. Supports sync and async.

## Installation

```bash
pip install imbrace
```

## Quick Start

### API Key — server-side scripts, Celery tasks

```python
from imbrace import ImbraceClient

client = ImbraceClient(api_key="sk-xxx...")

me = client.platform.get_me()
```

### Access Token — after user login

```python
client = ImbraceClient(access_token="acc_xxxxxxxxxxxxx")
```

### OTP Login Flow

```python
client = ImbraceClient()

client.request_otp("user@example.com")
client.login_with_otp("user@example.com", "123456")

# all subsequent calls are authenticated
me = client.platform.get_me()
```

### Async Client

```python
from imbrace import AsyncImbraceClient

async with AsyncImbraceClient(api_key="sk-xxx...") as client:
    me = await client.platform.get_me()
```

## Error Handling

```python
from imbrace import AuthError, ApiError, NetworkError

try:
    client.platform.get_me()
except AuthError:
    print("Invalid credentials")
except ApiError as e:
    print(f"[{e.status_code}] {e}")
except NetworkError:
    print("Gateway unreachable")
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `IMBRACE_API_KEY` | API key (server-side auth) |
| `IMBRACE_GATEWAY_URL` | Override gateway URL (default: `https://app-gatewayv2.imbrace.co`) |
| `IMBRACE_ENV` | Environment preset: `develop`, `sandbox`, `stable` (default: `stable`) |

## Development

```bash
pip install -e ".[dev]"
pytest                    # unit tests
pytest tests/integration  # integration tests (requires IMBRACE_API_KEY)
```

## Resources

Full resource reference: **[sdk.imbrace.co/python/resources](https://sdk.imbrace.co/python/resources)**
