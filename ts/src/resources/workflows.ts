import { HttpTransport } from "../http.js"

// ── Channel automation interfaces ─────────────────────────────────────────────

export interface ChannelAutomationItem {
  id: string
  name?: string
  active?: boolean
  tags?: { id: string; name: string }[]
  [key: string]: unknown
}

// ── Workflow flow / runs / folders / connections / pieces / MCP / tables ──────

export interface ApPage<T> {
  data: T[]
  next: string | null
  previous: string | null
}

export interface Flow {
  id: string
  created: string
  updated: string
  projectId: string
  externalId: string
  status: 'ENABLED' | 'DISABLED'
  operationStatus: string
  version: FlowVersion
}

export interface FlowVersion {
  id: string
  created: string
  updated: string
  flowId: string
  displayName: string
  trigger: Record<string, unknown>
  steps?: Record<string, unknown>
  valid?: boolean
}

export interface FlowRun {
  id: string
  created: string
  updated: string
  projectId: string
  flowId: string
  flowVersionId: string
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMEOUT' | 'PAUSED' | 'STOPPED'
  environment: 'PRODUCTION' | 'TESTING'
  startTime?: string
  finishTime?: string
  failParentOnFailure: boolean
  tags?: string[]
  [key: string]: unknown
}

export interface WorkflowFolder {
  id: string
  created: string
  updated: string
  displayName: string
  projectId: string
}

export interface AppConnection {
  id: string
  created: string
  updated: string
  externalId: string
  displayName: string
  pieceName: string
  projectId: string
  type: 'SECRET_TEXT' | 'OAUTH2' | 'CLOUD_OAUTH2' | 'PLATFORM_OAUTH2' | 'BASIC_AUTH' | 'CUSTOM_AUTH'
  [key: string]: unknown
}

export interface Piece {
  id: string
  name: string
  displayName: string
  description: string
  logoUrl: string
  version: string
  categories: string[]
  actions: number
  triggers: number
  authors: string[]
  [key: string]: unknown
}

export interface McpServer {
  id: string
  created: string
  updated: string
  projectId: string
  name?: string
  [key: string]: unknown
}

export interface UserInvitation {
  id: string
  created: string
  updated: string
  email: string
  type: 'PLATFORM' | 'PROJECT'
  status: string
  [key: string]: unknown
}

export interface WorkflowTable {
  id: string
  created: string
  updated: string
  name: string
  projectId: string
  [key: string]: unknown
}

export interface WorkflowRecord {
  id: string
  created: string
  updated: string
  tableId: string
  cells: Record<string, unknown>
  [key: string]: unknown
}

export interface TriggerRunStatus {
  pieces: Record<string, {
    dailyStats: Record<string, { success: number; failure: number }>
  }>
}

// ── List params ───────────────────────────────────────────────────────────────

export interface ListParams {
  limit?: number
  cursor?: string
}

export interface FlowListParams extends ListParams {
  projectId?: string
  folderId?: string
  status?: 'ENABLED' | 'DISABLED'
}

export interface RunListParams extends ListParams {
  flowId?: string
  status?: FlowRun['status']
  projectId?: string
  tags?: string[]
  createdAfter?: string
  createdBefore?: string
}

export interface ConnectionListParams extends ListParams {
  projectId?: string
  pieceName?: string
}

export interface InvitationListParams extends ListParams {
  type: 'PLATFORM' | 'PROJECT'
  projectId?: string
  [key: string]: unknown
}

export interface RecordListParams {
  tableId: string
  limit?: number
  cursor?: string
  [key: string]: unknown
}

// ── Flow builder (declarative) ────────────────────────────────────────────────
// The raw ActivePieces flow-operation payload has two easy-to-miss requirements
// that otherwise fail with a 400 or silently orphan every later step:
//   1. every PIECE trigger/action `settings` needs a `propertySettings` entry
//      for each input key;
//   2. an action added AFTER a loop must pass `stepLocationRelativeToParent`.
// The builders below fill both in, so a whole flow is one `buildFlow(...)` call.

/** A flow trigger, described declaratively. */
export type FlowTriggerSpec =
  | {
      kind: 'piece'
      pieceName: string
      pieceVersion: string
      triggerName: string
      displayName: string
      input?: Record<string, unknown>
    }
  | { kind: 'empty' }

/** A flow step, described declaratively. `loop` steps may nest `steps`. */
export type FlowStepSpec =
  | { kind: 'code'; name?: string; displayName: string; code: string; packageJson?: string }
  | {
      kind: 'piece'
      name?: string
      displayName: string
      pieceName: string
      pieceVersion: string
      actionName: string
      input?: Record<string, unknown>
    }
  | { kind: 'loop'; name?: string; displayName: string; items: string; steps?: FlowStepSpec[] }

export interface BuildFlowSpec {
  displayName: string
  projectId?: string
  trigger?: FlowTriggerSpec
  steps: FlowStepSpec[]
}

// ── Resource ──────────────────────────────────────────────────────────────────

export class WorkflowsResource {
  private readonly apBase: string

  /**
   * @param backend        - backend base URL (`{gateway}/v1/backend`)
   *   (kept for any methods that still rely on legacy routes).
   * @param apBase         - workflow engine base URL (`{gateway}/activepieces`)
   *   for flows, runs, folders, connections, pieces, MCP servers, tables.
   * @param channelService - channel-service base (`{gateway}/channel-service`)
   *   for channel-automation listings.
   */
  constructor(
    private readonly http: HttpTransport,
    private readonly backend: string,
    apBase: string,
    private readonly channelService: string = '',
  ) {
    this.apBase = apBase.replace(/\/$/, '')
  }

  /** Cache of resolved ActivePieces project id (per-org, fetched lazily). */
  private _cachedProjectId?: string

  /**
   * Resolve the ActivePieces project id for the current org by listing the
   * first flow and reading its `projectId`. Caches the result so repeated
   * calls don't refetch. Throws if the org has no flows yet (caller must
   * pass `projectId` explicitly in that case).
   */
  async resolveProjectId(): Promise<string> {
    if (this._cachedProjectId) return this._cachedProjectId
    const r: any = await this.listFlows({ limit: 1 } as any)
    const flow = (r?.data ?? [])[0]
    const pid = flow?.projectId ?? flow?.project_id
    if (!pid) {
      throw new Error(
        "workflows.resolveProjectId: org has no flows yet — cannot derive projectId. " +
        "Pass it explicitly to the calling method (e.g. listMcpServers(projectId)).",
      )
    }
    this._cachedProjectId = pid
    return pid
  }

  private get v2() {
    return this.backend.replace("/v1/", "/v2/")
  }

  private apUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
    const u = new URL(`${this.apBase}${path}`)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v))
      }
    }
    return u.toString()
  }

  private apFetch<T>(url: string, init?: RequestInit): Promise<T> {
    return this.http.getFetch()(url, init).then(r => {
      if (r.status === 204 || r.headers.get('content-length') === '0') return undefined as T
      return r.json() as T
    })
  }

  // ── Channel automation ─────────────────────────────────────────────────────

  async listChannelAutomation(params?: { channelType?: string }): Promise<{ data: ChannelAutomationItem[] }> {
    // Channel automation moved from /v2/backend/workflows to channel-service.
    const base = this.channelService || this.v2
    const url = new URL(`${base}/v1/workflows/channel_automation`)
    if (params?.channelType) url.searchParams.set("channelType", params.channelType)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  // ── Flows ──────────────────────────────────────────────────────────────────

  listFlows(params?: FlowListParams): Promise<ApPage<Flow>> {
    return this.apFetch(this.apUrl('/v1/flows', params as Record<string, string>))
  }

  getFlow(flowId: string): Promise<Flow> {
    return this.apFetch(this.apUrl(`/v1/flows/${flowId}`))
  }

  createFlow(body: { displayName: string; projectId?: string }): Promise<Flow> {
    return this.apFetch(this.apUrl('/v1/flows'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  deleteFlow(flowId: string): Promise<void> {
    return this.apFetch(this.apUrl(`/v1/flows/${flowId}`), { method: 'DELETE' })
  }

  applyFlowOperation(flowId: string, body: Record<string, unknown>): Promise<Flow> {
    return this.apFetch(this.apUrl(`/v1/flows/${flowId}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  // ── Flow builder ─────────────────────────────────────────────────────────────

  /** The engine 400s unless every input key has a propertySettings entry. */
  private propertySettingsFor(input: Record<string, unknown> = {}): Record<string, { type: 'MANUAL' }> {
    return Object.fromEntries(Object.keys(input).map((k) => [k, { type: 'MANUAL' }]))
  }

  private buildTriggerRequest(t: FlowTriggerSpec): Record<string, unknown> {
    if (t.kind === 'empty') {
      return { name: 'trigger', valid: false, displayName: 'Select Trigger', type: 'EMPTY', settings: {} }
    }
    const input = t.input ?? {}
    return {
      name: 'trigger', valid: true, displayName: t.displayName, type: 'PIECE_TRIGGER',
      settings: {
        pieceName: t.pieceName, pieceVersion: t.pieceVersion, triggerName: t.triggerName,
        input, propertySettings: this.propertySettingsFor(input), inputUiInfo: {},
        packageType: 'REGISTRY', pieceType: 'OFFICIAL',
      },
    }
  }

  private buildActionRequest(name: string, step: FlowStepSpec): Record<string, unknown> {
    if (step.kind === 'code') {
      return {
        name, valid: true, displayName: step.displayName, type: 'CODE',
        settings: {
          sourceCode: { code: step.code, packageJson: step.packageJson ?? '{}' },
          input: {}, inputUiInfo: {},
          errorHandlingOptions: { continueOnFailure: { value: false }, retryOnFailure: { value: false } },
        },
      }
    }
    if (step.kind === 'loop') {
      return { name, valid: true, displayName: step.displayName, type: 'LOOP_ON_ITEMS', settings: { items: step.items, inputUiInfo: {} } }
    }
    const input = step.input ?? {}
    return {
      name, valid: true, displayName: step.displayName, type: 'PIECE',
      settings: {
        pieceName: step.pieceName, pieceVersion: step.pieceVersion, actionName: step.actionName,
        input, propertySettings: this.propertySettingsFor(input), inputUiInfo: {},
        packageType: 'REGISTRY', pieceType: 'OFFICIAL',
      },
    }
  }

  /** Apply a list of steps under `parentStep`, chaining siblings and recursing into loops. */
  private async applySteps(
    flowId: string,
    parentStep: string,
    firstLocation: 'AFTER' | 'INSIDE_LOOP',
    steps: FlowStepSpec[],
    counter: { n: number },
  ): Promise<void> {
    let parent = parentStep
    let location: 'AFTER' | 'INSIDE_LOOP' = firstLocation
    for (const step of steps) {
      const name = step.name ?? `step_${++counter.n}`
      await this.applyFlowOperation(flowId, {
        type: 'ADD_ACTION',
        request: { parentStep: parent, stepLocationRelativeToParent: location, action: this.buildActionRequest(name, step) },
      })
      if (step.kind === 'loop' && step.steps?.length) {
        await this.applySteps(flowId, name, 'INSIDE_LOOP', step.steps, counter)
      }
      // The next sibling attaches AFTER this step (AFTER the loop itself, not its body).
      parent = name
      location = 'AFTER'
    }
  }

  /**
   * Build a whole flow — trigger + (optionally nested) steps — in ONE call.
   * Auto-fills the two things the raw ActivePieces flow-operation API requires:
   * `propertySettings` on every piece, and `stepLocationRelativeToParent` on
   * every added action (mandatory after a loop, or later steps silently orphan).
   * Step names auto-increment (`step_1`, `step_2`, …) unless a step sets `name`.
   * Returns the final flow.
   */
  async buildFlow(spec: BuildFlowSpec): Promise<Flow> {
    const flow = await this.createFlow({ displayName: spec.displayName, projectId: spec.projectId })
    const flowId = flow.id
    if (spec.trigger) {
      await this.applyFlowOperation(flowId, { type: 'UPDATE_TRIGGER', request: this.buildTriggerRequest(spec.trigger) })
    }
    await this.applySteps(flowId, 'trigger', 'AFTER', spec.steps, { n: 0 })
    return this.getFlow(flowId)
  }

  /**
   * Append steps to an existing flow (same auto-fill as {@link buildFlow}).
   * By default attaches AFTER the trigger; pass `parentStep`/`location` to attach
   * elsewhere (e.g. INSIDE_LOOP of a loop step). `startIndex` continues the
   * auto step-name counter so names stay unique.
   */
  async addSteps(
    flowId: string,
    steps: FlowStepSpec[],
    opts?: { parentStep?: string; location?: 'AFTER' | 'INSIDE_LOOP'; startIndex?: number },
  ): Promise<Flow> {
    await this.applySteps(flowId, opts?.parentStep ?? 'trigger', opts?.location ?? 'AFTER', steps, { n: opts?.startIndex ?? 0 })
    return this.getFlow(flowId)
  }

  triggerFlow(flowId: string, payload?: Record<string, unknown>): Promise<unknown> {
    return this.apFetch(this.apUrl(`/v1/webhooks/${flowId}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
    })
  }

  triggerFlowSync(flowId: string, payload?: Record<string, unknown>): Promise<unknown> {
    return this.apFetch(this.apUrl(`/v1/webhooks/${flowId}/sync`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
    })
  }

  // ── Flow Runs ──────────────────────────────────────────────────────────────

  listRuns(params?: RunListParams): Promise<ApPage<FlowRun>> {
    return this.apFetch(this.apUrl('/v1/flow-runs', params as Record<string, string>))
  }

  getRun(runId: string): Promise<FlowRun> {
    return this.apFetch(this.apUrl(`/v1/flow-runs/${runId}`))
  }

  // ── Folders ────────────────────────────────────────────────────────────────

  listFolders(params?: ListParams): Promise<ApPage<WorkflowFolder>> {
    return this.apFetch(this.apUrl('/v1/folders', params as Record<string, string>))
  }

  getFolder(folderId: string): Promise<WorkflowFolder> {
    return this.apFetch(this.apUrl(`/v1/folders/${folderId}`))
  }

  createFolder(body: { displayName: string; projectId: string }): Promise<WorkflowFolder> {
    return this.apFetch(this.apUrl('/v1/folders'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  updateFolder(folderId: string, body: { displayName: string }): Promise<WorkflowFolder> {
    return this.apFetch(this.apUrl(`/v1/folders/${folderId}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  deleteFolder(folderId: string): Promise<void> {
    return this.apFetch(this.apUrl(`/v1/folders/${folderId}`), { method: 'DELETE' })
  }

  // ── App Connections ────────────────────────────────────────────────────────

  listConnections(params?: ConnectionListParams): Promise<ApPage<AppConnection>> {
    return this.apFetch(this.apUrl('/v1/app-connections', params as Record<string, string>))
  }

  getConnection(connectionId: string): Promise<AppConnection> {
    return this.apFetch(this.apUrl(`/v1/app-connections/${connectionId}`))
  }

  upsertConnection(body: Record<string, unknown>): Promise<AppConnection> {
    return this.apFetch(this.apUrl('/v1/app-connections'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  deleteConnection(connectionId: string): Promise<void> {
    return this.apFetch(this.apUrl(`/v1/app-connections/${connectionId}`), { method: 'DELETE' })
  }

  // ── Pieces ─────────────────────────────────────────────────────────────────

  listPieces(params?: ListParams): Promise<Piece[]> {
    return this.apFetch(this.apUrl('/v1/pieces', params as Record<string, string>))
  }

  // ── Triggers ───────────────────────────────────────────────────────────────

  getTriggerRunStatus(): Promise<TriggerRunStatus> {
    return this.apFetch(this.apUrl('/v1/trigger-runs/status'))
  }

  testTrigger(body: Record<string, unknown>): Promise<unknown> {
    return this.apFetch(this.apUrl('/v1/test-trigger'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  // ── Tables & Records ───────────────────────────────────────────────────────

  listTables(params?: ListParams): Promise<ApPage<WorkflowTable>> {
    return this.apFetch(this.apUrl('/v1/tables', params as Record<string, string>))
  }

  getTable(tableId: string): Promise<WorkflowTable> {
    return this.apFetch(this.apUrl(`/v1/tables/${tableId}`))
  }

  listRecords(params: RecordListParams): Promise<ApPage<WorkflowRecord>> {
    return this.apFetch(this.apUrl('/v1/records', params as Record<string, string>))
  }

  // ── MCP Servers ────────────────────────────────────────────────────────────

  /**
   * List MCP servers for a project. If `projectId` is omitted, the SDK
   * auto-resolves it via {@link resolveProjectId} (lists the first flow in
   * the org and reads its `projectId`).
   */
  async listMcpServers(projectId?: string): Promise<ApPage<McpServer>> {
    const pid = projectId ?? await this.resolveProjectId()
    return this.apFetch(this.apUrl('/v1/mcp-servers', { projectId: pid })) as Promise<ApPage<McpServer>>
  }

  getMcpServer(mcpServerId: string): Promise<McpServer> {
    return this.apFetch(this.apUrl(`/v1/mcp-servers/${mcpServerId}`))
  }

  createMcpServer(body: Record<string, unknown>): Promise<McpServer> {
    return this.apFetch(this.apUrl('/v1/mcp-servers'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  deleteMcpServer(mcpServerId: string): Promise<void> {
    return this.apFetch(this.apUrl(`/v1/mcp-servers/${mcpServerId}`), { method: 'DELETE' })
  }

  rotateMcpToken(mcpServerId: string): Promise<McpServer> {
    return this.apFetch(this.apUrl(`/v1/mcp-servers/${mcpServerId}/rotate`), { method: 'POST' })
  }

  // ── User Invitations ───────────────────────────────────────────────────────

  listInvitations(params: InvitationListParams): Promise<ApPage<UserInvitation>> {
    return this.apFetch(this.apUrl('/v1/user-invitations', params as Record<string, string>))
  }

  deleteInvitation(invitationId: string): Promise<void> {
    return this.apFetch(this.apUrl(`/v1/user-invitations/${invitationId}`), { method: 'DELETE' })
  }
}
