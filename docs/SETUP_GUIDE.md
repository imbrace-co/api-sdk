# Imbrace SDK — Hướng dẫn cài đặt

Tài liệu này hướng dẫn cài đặt và sử dụng Imbrace SDK cho cả **TypeScript/JavaScript** và **Python**, bao gồm cài đặt trong nội bộ monorepo và cài đặt từ bên ngoài như một package độc lập.

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt TypeScript SDK](#2-cài-đặt-typescript-sdk)
3. [Cài đặt Python SDK](#3-cài-đặt-python-sdk)
4. [Cấu hình xác thực](#4-cấu-hình-xác-thực)
5. [Môi trường (Environments)](#5-môi-trường-environments)
6. [Khởi tạo client](#6-khởi-tạo-client)
7. [Ví dụ sử dụng nhanh](#7-ví-dụ-sử-dụng-nhanh)
8. [Override URL dịch vụ](#8-override-url-dịch-vụ)
9. [Chạy test](#9-chạy-test)
10. [Xử lý lỗi thường gặp](#10-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu cầu hệ thống

| Yêu cầu | Phiên bản tối thiểu |
|---|---|
| Node.js | 18.0.0+ |
| npm | 8.0.0+ |
| Python | 3.9+ |
| pip | 23.0+ |

---

## 2. Cài đặt TypeScript SDK

### Cài từ bên ngoài (npm registry)

```bash
npm install @imbrace/sdk
```

```bash
# hoặc dùng yarn
yarn add @imbrace/sdk

# hoặc dùng pnpm
pnpm add @imbrace/sdk
```

### Cài trong nội bộ monorepo (local development)

```bash
# Bước 1: vào thư mục ts và cài dependencies
cd sdk/ts
npm install

# Bước 2: build package
npm run build

# Bước 3 (tuỳ chọn): link global để dùng trong project khác trên cùng máy
npm link
```

Sau khi `npm link`, vào project bên ngoài và chạy:

```bash
cd /path/to/your-project
npm link @imbrace/sdk
```

### Kiểm tra cài đặt

```ts
import { ImbraceClient } from '@imbrace/sdk'
console.log('SDK loaded:', typeof ImbraceClient) // 'function'
```

---

## 3. Cài đặt Python SDK

### Cài từ bên ngoài (PyPI)

```bash
pip install imbrace
```

```bash
# hoặc dùng uv
uv add imbrace

# hoặc thêm vào pyproject.toml
# dependencies = ["imbrace>=1.0.0"]
```

### Cài trong nội bộ monorepo (local development)

```bash
# Chế độ editable — thay đổi source có hiệu lực ngay, không cần cài lại
cd sdk/py
pip install -e ".[dev]"
```

Cờ `[dev]` cài thêm: `pytest`, `pytest-asyncio`, `pytest-httpx`, `ruff`, `mypy`.

### Kiểm tra cài đặt

```python
from imbrace import ImbraceClient
print("SDK loaded:", ImbraceClient)
```

---

## 4. Cấu hình xác thực

SDK hỗ trợ 2 phương thức xác thực:

| Phương thức | Header gửi đi | Dùng khi |
|---|---|---|
| **API Key** | `x-api-key` | Server-to-server, backend service |
| **Access Token** | `x-access-token` | Client-side, sau khi đăng nhập bằng email/password hoặc OTP |

### Tạo file `.env`

```bash
# Dùng chung cho cả TypeScript và Python — mẫu nằm ở thư mục gốc repo
cp .env.example .env
```

Nội dung `.env`:

```env
# Môi trường: develop | sandbox | stable
IMBRACE_ENV=stable

# Xác thực server-side (ưu tiên dùng cái này cho backend)
IMBRACE_API_KEY=your_api_key_here

# Xác thực client-side (dùng sau khi đăng nhập)
# IMBRACE_ACCESS_TOKEN=your_jwt_token_here

# ID tổ chức (gửi kèm mọi request)
IMBRACE_ORGANIZATION_ID=your_org_id_here

# Override gateway URL (để trống nếu dùng môi trường mặc định)
IMBRACE_GATEWAY_URL=
```

### Lấy API Key

Cách 1 — qua Portal: đăng nhập Imbrace Portal, vào **Settings → API Keys**.

Cách 2 — qua API (cần có access token hiện tại):

```bash
curl -X POST https://app-gatewayv2.imbrace.co/private/backend/v1/third_party_token \
  -H "x-access-token: <your_existing_token>" \
  -H "Content-Type: application/json" \
  -d '{"expirationDays": 30}'
```

Response trả về `apiKey.apiKey` — đó chính là API Key.

---

## 5. Môi trường (Environments)

| Tên | Gateway URL | Dùng khi |
|---|---|---|
| `develop` | `https://app-gateway.dev.imbrace.co` | Phát triển nội bộ |
| `sandbox` | `https://app-gateway.sandbox.imbrace.co` | Kiểm thử tích hợp |
| `stable` | `https://app-gatewayv2.imbrace.co` | Production (mặc định) |

---

## 6. Khởi tạo client

### TypeScript

```ts
import { ImbraceClient } from '@imbrace/sdk'

// Server-side — dùng API Key
const client = new ImbraceClient({
  apiKey: process.env.IMBRACE_API_KEY,
  organizationId: process.env.IMBRACE_ORGANIZATION_ID,
  env: 'stable', // mặc định nếu bỏ qua
})

// Client-side — dùng Access Token
const client = new ImbraceClient({
  accessToken: 'eyJhbGci...',
  organizationId: 'org_xxx',
})

// Đăng nhập email/password để lấy Access Token
const anonClient = new ImbraceClient({ env: 'stable' })
await anonClient.login('user@example.com', 'password')
// Access token tự động được lưu vào client

// Đăng nhập bằng OTP
await anonClient.requestOtp('user@example.com')       // gửi OTP về email
await anonClient.loginWithOtp('user@example.com', '123456') // xác nhận
```

### Python (sync)

```python
import os
from imbrace import ImbraceClient

# Server-side — dùng API Key
client = ImbraceClient(
    api_key=os.environ["IMBRACE_API_KEY"],
    organization_id=os.environ.get("IMBRACE_ORG_ID"),
    env="stable",
)

# Client-side — dùng Access Token
client = ImbraceClient(
    access_token="eyJhbGci...",
    organization_id="org_xxx",
)

# Đăng nhập email/password
anon = ImbraceClient(env="stable")
anon.login("user@example.com", "password")  # lưu token tự động

# Đăng nhập bằng OTP
anon.request_otp("user@example.com")
anon.login_with_otp("user@example.com", "123456")
```

### Python (async)

```python
from imbrace import AsyncImbraceClient

async def main():
    async with AsyncImbraceClient(api_key="sk-...") as client:
        me = await client.platform.get_me()
        print(me)
```

---

## 7. Ví dụ sử dụng nhanh

### TypeScript

```ts
import { ImbraceClient } from '@imbrace/sdk'

const client = new ImbraceClient({ apiKey: process.env.IMBRACE_API_KEY })

// Lấy thông tin user hiện tại
const me = await client.platform.getMe()

// Danh sách channel
const channels = await client.channel.listChannels()

// Gửi tin nhắn
await client.channel.sendMessage('conv_123', {
  content: 'Xin chào!',
  type: 'text',
})

// Dùng AI
const result = await client.ai.complete({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
})

// AI streaming
for await (const chunk of client.ai.stream({ model: 'gpt-4o', messages: [...] })) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? '')
}

// Dọn dẹp (không bắt buộc với TS)
client.clearAccessToken()
```

### Python

```python
from imbrace import ImbraceClient

with ImbraceClient(api_key="sk-...") as client:
    # Lấy thông tin user
    me = client.platform.get_me()

    # Danh sách channel
    channels = client.channel.list()

    # Boards
    boards = client.boards.list()
    items  = client.boards.list_items(boards[0]["id"])

    # AI
    result = client.ai.complete(
        model="gpt-4o",
        messages=[{"role": "user", "content": "Hello"}],
    )
```

---

## 8. Override URL dịch vụ

Dùng khi một microservice chạy ở địa chỉ khác (ví dụ: local dev, staging riêng).

### TypeScript

```ts
const client = new ImbraceClient({
  env: 'develop',
  services: {
    dataBoard:      'http://localhost:3001/data-board',
    channelService: 'http://localhost:3002/channel-service',
  },
})
```

### Python

```python
client = ImbraceClient(
    env="develop",
    services={
        "data_board":      "http://localhost:3001/data-board",
        "channel_service": "http://localhost:3002/channel-service",
    },
)
```

Danh sách key hợp lệ:

| Python key | TypeScript key | Dịch vụ |
|---|---|---|
| `gateway` | `gateway` | App Gateway |
| `platform` | `platform` | Platform service |
| `channel_service` | `channelService` | Channel service |
| `data_board` | `dataBoard` | Data Board |
| `ips` | `ips` | IPS service |
| `ai` | `ai` | AI service |
| `marketplaces` | `marketplaces` | Marketplace service |
| `file_service` | `fileService` | File service |
| `activepieces` | `activepieces` | ActivePieces |

---

## 9. Chạy test

### TypeScript

```bash
cd sdk/ts

# Unit tests (không cần credential)
npm test

# Integration tests (cần IMBRACE_API_KEY trong .env)
npm run test:integration

# Tất cả
npm run test:all

# Watch mode
npm run test:watch
```

### Python

```bash
cd sdk/py

# Unit tests
pytest tests/unit

# Integration tests (cần biến môi trường)
IMBRACE_API_KEY=sk-... pytest tests/integration -m integration

# Tất cả
pytest
```

---

## 10. Xử lý lỗi thường gặp

### `Cannot find package '@imbrace/sdk'`
Package chưa được link. Chạy lại từ thư mục `sdk/ts`:
```bash
npm link
cd /path/to/your-project && npm link @imbrace/sdk
```

### `ERR_MODULE_NOT_FOUND` cho file trong `dist/`
Package chưa được build. Chạy:
```bash
cd sdk/ts && npm run build
```

### `ModuleNotFoundError: No module named 'imbrace'`
Package chưa được cài. Chạy:
```bash
cd sdk/py && pip install -e ".[dev]"
```

### `401 Unauthorized`
API Key hết hạn hoặc sai. Tạo API Key mới:
```bash
curl -X POST https://app-gatewayv2.imbrace.co/private/backend/v1/third_party_token \
  -H "x-access-token: <your_existing_token>" \
  -H "Content-Type: application/json" \
  -d '{"expirationDays": 30}'
```

### `UserWarning: ImbraceClient: no credentials provided`
Không truyền `api_key` hoặc `access_token`. Nếu cố ý (ví dụ: chỉ để login), có thể bỏ qua warning này. Nếu không, hãy kiểm tra lại file `.env`.

---

*Imbrace SDK — MIT License*
