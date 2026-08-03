import { type Environment, type EnvironmentPreset, ENVIRONMENTS } from './environments.js'

export interface ServiceUrls {
  // ── Core ───────────────────────────────────────────────────────────────
  /** Gateway root — health, license, sessions, and anything not yet split out. */
  gateway: string

  // ── platform-service (account, users, organizations, teams, apps, …) ───
  /** platform — versioned per method as `${platform}/v1/...` or `${platform}/v2/...`. */
  platform: string

  // ── channel-service (channel, contacts, conversations, messages, …) ────
  /** channel-service — versioned per method as `${channelService}/v{1,2,3}/...`. */
  channelService: string

  // ── data-board (boards, items, fields, KnowledgeHub) ───────────────────
  /** data-board — no version prefix; the service mounts at `/api/` internally and the gateway rewrites. */
  dataBoard: string

  // ── file-service ───────────────────────────────────────────────────────
  /** file-service — spec-exact `/v1` routes (gateway also exposes `/v1/files` and `/files/v1`). */
  fileService: string

  // ── marketplace ────────────────────────────────────────────────────────
  /** marketplace v2 — `/marketplaces/v2`. */
  marketplaces: string
  /**
   * marketplace v3 — where the generated `api.marketplace` surface resolves.
   *
   * A separate entry, not a nicety: the gateway rewrites the version into the
   * upstream path (`/v3/marketplaces/x` → the service's `/v3/x`), so v2 and v3
   * are different APIs rather than aliases of one. Pointing the generated
   * methods at `marketplaces` above would silently call v2 endpoints.
   */
  marketplacesV3: string

  // ── ips ────────────────────────────────────────────────────────────────
  /** ips/v1 — gateway/ips/v1. */
  ips: string

  // ── ai-service-v2 / chat-ai ────────────────────────────────────────────
  /** ai — version (v2/v3) appended per method. */
  ai: string

  // ── ai-agent / message-suggestion / predict ────────────────────────────
  /** ai-agent — /api/ai-agent. */
  aiAgent: string
  /** message-suggestion — /v1/message-suggestion. */
  messageSuggestion: string
  /** predict — /predict. */
  predict: string

  // ── workflow-engine (activepieces) ─────────────────────────────────────
  /** workflow engine — /activepieces (gateway path is unchanged for v2). */
  workflowEngine: string

  // ── legacy backend (boards CRUD/items, auth, templates) ────────────────
  /** /v1/backend — items, fields, search, segmentation, auth signin, templates. */
  backend: string
}


export function resolveServiceUrls(
  env: Environment | EnvironmentPreset,
  overrides?: Partial<ServiceUrls>,
): ServiceUrls {
  const preset: EnvironmentPreset =
    typeof env === 'string' ? ENVIRONMENTS[env] : env
  const gw    = preset.gateway.replace(/\/$/, '')
  const hosts = preset.serviceHosts ?? {}

  const resolved: ServiceUrls = {
    gateway:           gw,
    platform:          `${gw}/platform`,
    channelService:    `${gw}/channel-service`,
    dataBoard:         `${gw}/data-board`,
    fileService:       `${gw}/files/v1`,
    marketplaces:      `${gw}/marketplaces/v2`,
    marketplacesV3:    `${gw}/v3/marketplaces`,
    ips:               `${(hosts.ips ?? gw).replace(/\/$/, '')}/ips/v1`,
    ai:                gw,
    aiAgent:           `${gw}/ai-agent`,
    messageSuggestion: `${gw}/v1/message-suggestion`,
    predict:           `${gw}/predict`,
    workflowEngine:    `${gw}/activepieces`,
    backend:           `${gw}/v1/backend`,
  }

  return { ...resolved, ...overrides }
}
