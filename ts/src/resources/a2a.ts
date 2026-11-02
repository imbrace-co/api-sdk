import { HttpTransport } from "../http.js"
import { ImbraceError } from "../errors.js"

// --- A2A protocol types (spec 0.3.0, the subset this SDK speaks) -------------

export interface A2APart {
  kind: "text" | string
  text?: string
  [key: string]: unknown
}

export interface A2AMessage {
  role: "user" | "agent"
  parts: A2APart[]
  messageId: string
  kind: "message"
  taskId?: string
  contextId?: string
  metadata?: Record<string, unknown>
}

export interface A2AArtifact {
  artifactId?: string
  name?: string
  parts: A2APart[]
}

export interface A2ATask {
  id: string
  contextId?: string
  kind: "task"
  status: {
    state: "submitted" | "working" | "completed" | "failed" | "canceled" | string
    timestamp?: string
    message?: A2AMessage
  }
  history?: A2AMessage[]
  artifacts?: A2AArtifact[]
}

export interface A2ASkill {
  id: string
  name: string
  description?: string
  tags?: string[]
}

export interface AgentCard {
  protocolVersion?: string
  name: string
  description?: string
  /** JSON-RPC endpoint to POST `message/send` to. */
  url: string
  preferredTransport?: string
  version?: string
  capabilities?: { streaming?: boolean; pushNotifications?: boolean; stateTransitionHistory?: boolean }
  defaultInputModes?: string[]
  defaultOutputModes?: string[]
  skills?: A2ASkill[]
  provider?: { organization?: string; url?: string }
  securitySchemes?: Record<string, unknown>
  security?: Array<Record<string, unknown>>
  [key: string]: unknown
}

/** One agent in this org's A2A catalog. */
export interface A2AAgentSummary {
  id: string
  name: string
  /** Bare agent endpoint — the canonical "Agent URL" to hand to a peer. */
  url: string
  /** Direct link to the Agent Card JSON. */
  cardUrl: string
}

/** Result of probing a remote agent through the platform. */
export interface A2ADiscoverResult {
  healthy: boolean
  name?: string
  description?: string
  url?: string
  version?: string
  capabilities?: string[]
  skills?: A2ASkill[]
}

// --- Shared helpers ---------------------------------------------------------

const stripTrailingSlash = (u: string): string => u.replace(/\/+$/, "")

/**
 * Where an agent's card lives, given a user-supplied URL: a card URL is used
 * as-is, anything else is treated as the agent base.
 */
export function agentCardUrl(url: string): string {
  const trimmed = url.trim()
  if (/\.json$/i.test(trimmed)) return trimmed
  return `${stripTrailingSlash(trimmed)}/.well-known/agent-card.json`
}

/** Build a minimal text user Message for `message/send`. */
export function textMessage(text: string): A2AMessage {
  return {
    role: "user",
    parts: [{ kind: "text", text }],
    messageId: crypto.randomUUID(),
    kind: "message",
  }
}

/**
 * Pull readable text out of a Task or Message: the status message first, then
 * artifacts. Falls back to the raw JSON so a caller never gets an empty string
 * for a result it could have inspected.
 */
export function extractA2AText(result: unknown): string {
  const partsText = (parts?: A2APart[]): string =>
    (parts ?? [])
      .filter(p => p.kind === "text" && typeof p.text === "string")
      .map(p => p.text as string)
      .join("\n")

  const r = (result ?? {}) as Partial<A2ATask> & Partial<A2AMessage>
  if (r.kind === "task") {
    const fromStatus = partsText(r.status?.message?.parts)
    if (fromStatus) return fromStatus
    const fromArtifacts = (r.artifacts ?? []).map(a => partsText(a.parts)).filter(Boolean).join("\n")
    if (fromArtifacts) return fromArtifacts
  }
  if (r.kind === "message") {
    const t = partsText(r.parts)
    if (t) return t
  }
  return typeof result === "string" ? result : JSON.stringify(result)
}

function unwrapJsonRpc<T>(body: any, endpoint: string): T {
  if (body && typeof body === "object" && body.error) {
    throw new ImbraceError(
      `A2A agent error ${body.error.code}: ${body.error.message}`,
    )
  }
  if (body && typeof body === "object" && "result" in body) return body.result as T
  throw new ImbraceError(`Invalid JSON-RPC response from ${endpoint}: no result or error`)
}

function jsonRpcBody(message: A2AMessage, metadata?: Record<string, unknown>) {
  return {
    jsonrpc: "2.0" as const,
    id: crypto.randomUUID(),
    method: "message/send",
    params: { message, ...(metadata ? { metadata } : {}) },
  }
}

export interface SendMessageOptions {
  /** Extra `params.metadata` passed through to the agent. */
  metadata?: Record<string, unknown>
  /** Continue an existing A2A context instead of starting a new one. */
  contextId?: string
}

// --- Imbrace-hosted agents --------------------------------------------------

/**
 * Agent-to-Agent (A2A) access to this organization's agents, plus the
 * platform-side probe for remote ones.
 *
 * An agent reached here is addressed over A2A, not over the chat API: a call is
 * one blocking `message/send` that runs the agent to a final answer. To talk to
 * an agent that is NOT on this platform, use {@link A2AClient} instead — it
 * never sends your Imbrace credential to a third-party host.
 */
export class A2AResource {
  /** @param base - ai-agent base URL (`${gateway}/ai-agent`) */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  /** This org's agents, each with the URL a peer needs. */
  async listAgents(): Promise<A2AAgentSummary[]> {
    const res = await this.http.getFetch()(`${this.base}/a2a/agents`, { method: "GET" }).then(r => r.json())
    return res?.data?.agents ?? res?.agents ?? []
  }

  /** One agent's Agent Card — its identity, skills and auth scheme. */
  async getAgentCard(assistantId: string): Promise<AgentCard> {
    return this.http
      .getFetch()(`${this.base}/a2a/agents/${encodeURIComponent(assistantId)}/.well-known/agent-card.json`, {
        method: "GET",
      })
      .then(r => r.json())
  }

  /** Run an agent to a final answer and return the raw A2A Task (or Message). */
  async sendMessage(
    assistantId: string,
    text: string,
    opts: SendMessageOptions = {},
  ): Promise<A2ATask | A2AMessage> {
    const endpoint = `${this.base}/a2a/agents/${encodeURIComponent(assistantId)}`
    const message = textMessage(text)
    if (opts.contextId) message.contextId = opts.contextId
    const body = await this.http
      .getFetch()(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonRpcBody(message, opts.metadata)),
      })
      .then(r => r.json())
    return unwrapJsonRpc<A2ATask | A2AMessage>(body, endpoint)
  }

  /** {@link sendMessage}, reduced to the answer text. */
  async ask(assistantId: string, text: string, opts: SendMessageOptions = {}): Promise<string> {
    return extractA2AText(await this.sendMessage(assistantId, text, opts))
  }

  /**
   * Probe a remote agent's card from the platform and report its skills.
   * Runs server-side, so it also answers "can the platform reach this agent",
   * which a probe from your own machine does not.
   *
   * @param key - credential for the remote agent, when it needs one. It is sent
   *   to that agent only, never stored.
   */
  async discover(url: string, key?: string): Promise<A2ADiscoverResult> {
    const res = await this.http
      .getFetch()(`${this.base}/a2a/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, ...(key ? { key } : {}) }),
      })
      .then(r => r.json())
    return res?.data ?? res
  }
}

// --- Any A2A agent, on this platform or not ---------------------------------

export interface A2AClientOptions {
  /** Agent base URL or Agent Card URL. */
  url: string
  /** Sent as both `x-api-key` and `Authorization: Bearer` — agents differ on which they read. */
  apiKey?: string
  /** Extra headers, for an agent whose card names a scheme the two above don't cover. */
  headers?: Record<string, string>
  /** Per-request timeout. Default 120s: a remote agent runs a full agentic loop. */
  timeoutMs?: number
  /** Override the fetch implementation (tests, proxies). */
  fetch?: typeof fetch
}

/**
 * A standalone A2A client for ANY agent that speaks the protocol — an Imbrace
 * agent in another org, or something else entirely (Claude Code behind an A2A
 * shim, a LangGraph or ADK agent, …).
 *
 * It is deliberately independent of {@link ImbraceClient}: it holds no Imbrace
 * credential and sends only the key you pass here, so pointing it at a
 * third-party host cannot leak your platform token.
 */
export class A2AClient {
  private readonly fetchImpl: typeof fetch
  private readonly timeoutMs: number
  private card?: AgentCard

  constructor(private readonly opts: A2AClientOptions) {
    this.fetchImpl = opts.fetch ?? globalThis.fetch
    this.timeoutMs = opts.timeoutMs ?? 120_000
  }

  private authHeaders(): Record<string, string> {
    const { apiKey, headers } = this.opts
    return {
      ...(apiKey ? { "x-api-key": apiKey, Authorization: `Bearer ${apiKey}` } : {}),
      ...(headers ?? {}),
    }
  }

  /** Fetch the Agent Card (cached for the life of this client). */
  async getCard(refresh = false): Promise<AgentCard> {
    if (this.card && !refresh) return this.card
    const target = agentCardUrl(this.opts.url)
    const res = await this.fetchImpl(target, {
      headers: { Accept: "application/json", ...this.authHeaders() },
      signal: AbortSignal.timeout(this.timeoutMs),
    })
    const text = await res.text()
    if (!res.ok) {
      throw new ImbraceError(
        `A2A agent-card fetch failed: HTTP ${res.status} from ${target}. ${text.slice(0, 300)}`,
      )
    }
    let card: AgentCard
    try {
      card = JSON.parse(text) as AgentCard
    } catch {
      throw new ImbraceError(`Non-JSON agent card from ${target}: ${text.slice(0, 120)}`)
    }
    if (!card?.name) throw new ImbraceError(`Malformed agent card from ${target}: missing "name"`)
    this.card = card
    return card
  }

  /** The agent's skills, as named on its card. */
  async listSkills(): Promise<A2ASkill[]> {
    return (await this.getCard()).skills ?? []
  }

  /** Send one task and return the raw A2A Task (or Message). */
  async sendMessage(text: string, opts: SendMessageOptions = {}): Promise<A2ATask | A2AMessage> {
    const card = await this.getCard()
    const endpoint = card.url || stripTrailingSlash(this.opts.url)
    const message = textMessage(text)
    if (opts.contextId) message.contextId = opts.contextId

    const res = await this.fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...this.authHeaders() },
      body: JSON.stringify(jsonRpcBody(message, opts.metadata)),
      signal: AbortSignal.timeout(this.timeoutMs),
    })
    const raw = await res.text()
    if (!res.ok) {
      throw new ImbraceError(
        `A2A message/send failed: HTTP ${res.status} from ${endpoint}. ${raw.slice(0, 300)}`,
      )
    }
    let body: unknown
    try {
      body = JSON.parse(raw)
    } catch {
      throw new ImbraceError(`Non-JSON JSON-RPC response from ${endpoint}: ${raw.slice(0, 120)}`)
    }
    return unwrapJsonRpc<A2ATask | A2AMessage>(body, endpoint)
  }

  /** {@link sendMessage}, reduced to the answer text. */
  async ask(text: string, opts: SendMessageOptions = {}): Promise<string> {
    return extractA2AText(await this.sendMessage(text, opts))
  }
}
