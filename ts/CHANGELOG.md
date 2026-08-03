# @imbrace/sdk

## 1.2.1

### Patch Changes

- eb9ff90: Fix Document AI agent listing and creation.
  - `documentAi.listAgents({ documentAiOnly: true })` now filters on
    `agent_type === "document_ai"` (with a fallback to a populated `document_ai`
    object). The `/accounts/assistants` list endpoint tags Document AI agents via
    `agent_type` but leaves the `document_ai` config object `null` (only the
    per-agent detail endpoint populates it), so the previous
    `document_ai != null` filter returned an empty list even when Document AI
    agents existed.
  - `documentAi.createAgent()` now sends `agent_type: "document_ai"` in the body.
    Without it the backend defaulted `agent_type` to `"agent"`, so agents created
    through the SDK were never recognised as Document AI agents (and never
    appeared in `listAgents({ documentAiOnly: true })`).

  Python SDK updated for parity (sync + async).

## 1.2.0

### Minor Changes

- 269301d: Fix login → org-picker returning organizations the user can't actually enter.

  `client.login()` / `loginWithOtp()` previously fetched orgs from the **global** `/v1/organizations` list (which returns every org in the system — hundreds), so most entries weren't member orgs and `selectOrganization()` rejected them with "User not found in this organization".
  - `login()` / `loginWithOtp()` now go through the new `auth.authenticate()` (`POST /v1/login/authenticate`), whose `organizations` are **membership-scoped** — every returned org is exchangeable. Each entry now carries `organization_id`, `display_name`, `role`, `status`, etc.
  - New `auth.authenticate({ email, password? , otp?, provider_type? })` returns `{ ...loginAccess, organizations }` in one call.
  - `organizations.listForLogin()` is documented as the **global** list (not membership-scoped) — prefer the login flow for the picker.

  Note: the `organizations` field on the `login()`/`loginWithOtp()` result now uses the membership shape (`organization_id` instead of `id`).

### Patch Changes

- f680402: Fix `boards.search()` hitting the wrong path (404).

  It POSTed to `/search/boards/:boardId` (extra `/boards` segment) → 404. The data-board route is `POST /search/:boardId`. Corrected the path.

  Also:
  - Return type now reflects the real Meilisearch envelope `{ success, message: { hits, estimatedTotalHits, ... } }` (was incorrectly typed as `PagedResponse<BoardItem>`).
  - Request body now accepts the backend's full schema: `filter?: string` and `sort?: string[]` in addition to `q`/`limit`/`offset`.

## 1.1.3

### Patch Changes

- 38e5b33: Streamline the login → org-picker flow so callers don't have to manage tokens manually.
  - `AuthResource` now talks to platform-service (`/platform/v1/login/*`, `/platform/v1/access/*`) instead of the legacy backend (`/v1/backend/login/*`). Same payloads, same auth, but the canonical home for these endpoints.
  - `client.login(email, password)` and `client.loginWithOtp(email, otp)` now return `{ ...signIn, organizations }` — the SDK fetches the user's orgs (`GET /v2/organizations`) right after sign-in so the caller can show a picker without a second SDK call.
  - New `client.selectOrganization(orgId)` exchanges the short-lived `login_acc_…` for an org-scoped `acc_…` token, swaps it in the token manager, and sets `x-organization-id` for all subsequent requests. Replaces the manual `auth.exchangeAccessToken` + `setAccessToken` two-step.
  - New `HttpTransport.setOrganizationId(id?)` mutator so the org id can be changed after construction.
  - Docs: rewrote the OTP Login Flow and Password Login sections in `sdk/authentication.mdx` (en + zh-tw + zh-cn + vi) to use the new convenience methods. Python samples still use the explicit `exchange_access_token` + `set_access_token` pair; Python parity will follow in the next Python release.

- da2b7ce: Make `organizations.list()` work during the post-OTP org-picker flow, so apps using the email-login flow can fetch the user's orgs between `loginWithOtp` and `exchangeAccessToken`.
  - `organizations.list()` now routes by token prefix: `login_acc_…` → paged `/v2/organizations` (gated by `loginAccessMiddleware`); anything else → `/v2/organizations/_all` (regular `acc_` / `api_key` callers).
  - New `organizations.listForLogin()` / `organizations.list_for_login()` always hits the paged endpoint explicitly.
  - New `HttpTransport.getToken()` accessor (TypeScript).
  - Python `organizations.list()` previously always called the paged endpoint, which 401s for `api_key` callers — now routed correctly.
  - Docs: rewrote the OTP Login Flow section in `sdk/authentication.mdx` to show the two-phase token exchange and the org-picker step explicitly.
