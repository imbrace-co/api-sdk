import { HttpTransport } from "../http.js"
import type { AiAgent as AiAgentModel } from "../types/index.js"

// ─── AI Agents ────────────────────────────────────────────────────────────────

/**
 * An assistant as chat-ai returns it: the canonical model, plus whatever extra
 * fields the backend carries on the record (workflow_name, credential_name, …).
 *
 * This used to be a separate, weaker interface whose only real member was an
 * index signature, which erased `sub_agents` and friends down to `unknown` for
 * every caller. Aliasing the canonical model keeps the known fields typed while
 * the index signature preserves the pass-through for the rest.
 */
export type AiAgent = AiAgentModel & { [key: string]: unknown }

export interface CreateAiAgentInput {
  name: string
  workflow_name: string
  /**
   * The provider this AI agent chats through. Use `"default"` to follow the
   * org's default chat model; pass a specific provider UUID to pin one.
   */
  provider_id: string
  /**
   * The model name. With `provider_id: "default"` pass `"Default"`.
   * For a custom provider, pass that provider's model id.
   */
  model_id: string
  description?: string
  /** @deprecated legacy field — chat orchestrator type, leave unset. */
  model?: string
  instructions?: string
  [key: string]: unknown
}

/** A tool server an agent can call (stored in the agent's `metadata.tool_servers`). */
export interface ToolServerConfig {
  enabled: boolean
  url: string
  type?: "mcp" | "openapi"
  key?: string
  path?: string
  auth_type?: "bearer" | "session"
  /** Limit to these tool names; `null` allows all. */
  enabled_tools?: string[] | null
  [key: string]: unknown
}

/** `sub_agents` comes back as ids or `{ assistant_id, name }` objects. */
function subAgentIds(list: unknown): string[] | undefined {
  if (!Array.isArray(list)) return undefined
  return list.map(x => (typeof x === "string" ? x : (x as any)?.assistant_id ?? (x as any)?.id)).filter(Boolean)
}

// ─── Document AI ──────────────────────────────────────────────────────────────

export interface DocumentAIInput {
  modelName: string
  url: string
  organizationId: string
  boardId?: string
  language?: string
  additionalInstructions?: string
  additionalDocumentInstructions?: string
  processModelName?: string
  fileUrlToFill?: string
  tools?: Record<string, unknown>[]
  utc?: number
  chunkSize?: number
  maxConcurrent?: number
  maxRetries?: number
  useEnhancedProcessing?: boolean
}

export interface DocumentAIResponse {
  success: boolean
  data: Record<string, unknown> & { filledPdfUrl?: string }
}

/**
 * Imbrace-specific endpoints exposed by the chat-ai service. The
 * upstream OpenWebUI surface (chats, files list/upload, audio, knowledge,
 * folders, prompts, tools, models) is intentionally not wrapped here:
 * those endpoints require an OpenWebUI session JWT (issued only by the
 * OpenWebUI login flow) and reject `x-api-key` / `x-access-token` auth.
 *
 * What this resource covers:
 *   • Agent file upload and content extraction
 *   • Document AI (vision-model document processing) and provider listing
 *   • Imbrace AI agents (`/accounts/assistants`, `/assistant_apps`, …)
 */
export class ChatAiResource {
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  // ─── Files (Imbrace additions on top of OpenWebUI) ──────────────────────────

  /** Upload an agent-specific file. Endpoint: /ai/v3/files/agent */
  async uploadAgentFile(body: FormData): Promise<unknown> {
    return this.http.getFetch()(`${this.base}/files/agent`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  /** Extract content from an uploaded file (PDF/etc). Endpoint: /ai/v3/files/extract */
  async extractFile(body: FormData): Promise<unknown> {
    return this.http.getFetch()(`${this.base}/files/extract`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  // ─── Document AI ──────────────────────────────────────────────────────────

  /** Process a document with a vision model and extract structured data. Endpoint: /ai/v3/document/ */
  async processDocument(body: DocumentAIInput): Promise<DocumentAIResponse> {
    return this.http.getFetch()(`${this.base}/document/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  /** List LLM providers configured for the org — these are the models available for document AI. Endpoint: /ai/v3/providers */
  async listDocumentModels(): Promise<unknown[]> {
    return this.http.getFetch()(`${this.base}/providers`, { method: "GET" }).then(r => r.json())
  }

  // ─── AI Agents ─────────────────────────────────────────────────────────────

  async listAiAgents(): Promise<AiAgent[]> {
    return this.http.getFetch()(`${this.base}/accounts/assistants`, { method: "GET" }).then(r => r.json())
  }

  async getAiAgent(id: string): Promise<AiAgent> {
    return this.http.getFetch()(`${this.base}/assistants/${id}`, { method: "GET" }).then(r => r.json())
  }

  async createAiAgent(body: CreateAiAgentInput): Promise<AiAgent> {
    // Default to the org's default chat model when omitted. The "system"
    // provider falls back to env-configured hosts and fails on orgs without them.
    const wireBody: CreateAiAgentInput = {
      ...body,
      provider_id: body?.provider_id ?? "default",
      model_id:    body?.model_id    ?? "Default",
    }
    return this.http.getFetch()(`${this.base}/assistant_apps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wireBody),
    }).then(r => r.json())
  }

  /**
   * Update an AI agent. Only the fields you pass change.
   *
   * The server replaces the whole agent on this route (a missing `sub_agents`
   * would turn a team lead back into a plain agent), so the SDK fills the
   * fields you leave out from the current agent.
   */
  async updateAiAgent(id: string, body: Partial<CreateAiAgentInput>): Promise<AiAgent> {
    const current = await this.getAiAgent(id)
    const keep: Record<string, unknown> = {
      name: current.name,
      workflow_name: current.workflow_name,
      agent_type: current.agent_type,
      sub_agents: subAgentIds(current.sub_agents),
    }
    for (const k of Object.keys(keep)) if (keep[k] === undefined || keep[k] === null) delete keep[k]
    return this.http.getFetch()(`${this.base}/assistant_apps/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...keep, ...body }),
    }).then(r => r.json())
  }

  // ── Orchestrator (team lead + sub-agents) ──────────────────────────────────

  /**
   * Create an orchestrator: an agent that hands questions to its sub-agents.
   * Sub-agents are existing AI agent ids. Whether it may delegate at chat time
   * depends on the org's plan (the "Orchestrator" feature).
   */
  async createOrchestrator(body: CreateAiAgentInput & { sub_agents: string[] }): Promise<AiAgent> {
    return this.createAiAgent({ ...body, agent_type: "team_lead" })
  }

  /** Replace the sub-agents of an agent and make it a team lead. */
  async setSubAgents(id: string, subAgents: string[]): Promise<AiAgent> {
    return this.updateAssistant(id, { agent_type: "team_lead", sub_agents: subAgents })
  }

  // ── Tool servers (MCP) ────────────────────────────────────────────────────

  /**
   * Replace the MCP / OpenAPI tool servers an agent can call. For a workflow
   * MCP server, `url` is its SSE URL (contains the server's token).
   */
  async setToolServers(id: string, servers: ToolServerConfig[]): Promise<AiAgent> {
    const current = await this.getAiAgent(id)
    const metadata = { ...((current.metadata as Record<string, unknown>) ?? {}), tool_servers: servers }
    return this.updateAiAgent(id, { metadata })
  }

  /** The tool servers configured on an agent. */
  async listToolServers(id: string): Promise<ToolServerConfig[]> {
    const metadata = ((await this.getAiAgent(id)).metadata ?? {}) as Record<string, any>
    return metadata.tool_servers ?? (metadata.tool_server ? [metadata.tool_server] : [])
  }

  /** Partial update on `/assistants/:id`, which keeps the fields you leave out. */
  private async updateAssistant(id: string, body: Record<string, unknown>): Promise<AiAgent> {
    const current = await this.getAiAgent(id)
    return this.http.getFetch()(`${this.base}/assistants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: current.name, ...body }),
    }).then(r => r.json())
  }

  async deleteAiAgent(id: string): Promise<boolean> {
    const r = await this.http.getFetch()(`${this.base}/assistant_apps/${id}`, { method: "DELETE" })
    return r.ok
  }

  async updateAiAgentInstructions(id: string, instructions: string): Promise<AiAgent> {
    return this.http.getFetch()(`${this.base}/assistants/${id}/instructions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instructions }),
    }).then(r => r.json())
  }

  async listAiAgentSubAgents(): Promise<unknown[]> {
    return this.http.getFetch()(`${this.base}/assistants/agents`, { method: "GET" }).then(r => r.json())
  }
}
