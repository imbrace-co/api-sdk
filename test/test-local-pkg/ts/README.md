# Imbrace SDK - Local Integration Test Suite

An integration test suite for the Imbrace TypeScript SDK, designed to validate the source code directly during development through a locally packed tarball (`.tgz`).

## 1. Objectives
- Validate the entire SDK logic before publishing to NPM.
- Ensure the stability of the critical business flows (Full Flow).
- Verify the compatibility of the locally packed package.

## 2. Environment setup

### Prerequisites
- Node.js (v18 or later)
- PNPM or NPM

### Environment variable configuration
Create a `.env` file in this directory with the following values:
```env
IMBRACE_API_KEY=your_api_key_here
IMBRACE_ORGANIZATION_ID=your_org_id_here
IMBRACE_GATEWAY_URL=https://app-gatewayv2.imbrace.co
```

### Installation
```bash
npm install
```
*Note: This directory installs the SDK through a local file path: `file:../../ts/imbrace-sdk-x.x.x.tgz`.*

## 3. Test catalog

### 🚀 Core flow tests (Priority 1)
- **Full Flow Guide**: `npm run test:full-flow`
  - Runs the 4 most important stages: AI Assistant -> Workflow -> Knowledge Hub (RAG) -> CRM Boards.

### 🎭 Scenario-based tests
- **Frontend SDK**: `npm run test:frontend` (Chat Client API, Tracing, Messages)
- **Multi-Agent**: `npm run test:multi-agent` (Sub-agents, History, Parquet)
- **CRM Advanced**: `npm run test:crm-advanced` (Contacts, Conversations, Link/Unlink)
- **Multimedia AI**: `npm run test:multimedia` (OCR, STT, TTS, Document AI)

### 🛠️ Single-resource tests
- **Boards**: `npm run test:boards`
- **AI Agent**: `npm run test:ai`
- **CRM**: `npm run test:crm`

### 🛡️ Resilience tests
- **Error Paths**: `npm run test:error-paths` (Validates handling of 401, 404, 400 errors).

## 4. Running the whole suite
To check the overall health of the SDK:
```bash
npm run test:all
```
*The new test system is designed around a **Module Isolation** mechanism: if a backend service fails (e.g. 502), the suite records it and continues running the other modules instead of stopping entirely.*

## 5. Directory structure
- `tests/`: Contains the `.ts` test scenarios.
- `utils/`: Helper functions, client initialization, and log handling.
- `debug/`: (If present) Contains quick debugging helpers.
