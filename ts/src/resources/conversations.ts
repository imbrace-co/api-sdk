import { HttpTransport } from "../http.js"
import type { Conversation, PagedResponse } from "../types/index.js"

export interface ConversationActionResponse {
  success: boolean
  conversation?: Conversation
  [key: string]: unknown
}

export interface JoinConversationInput {
  conversation_id: string
  [key: string]: unknown
}

export interface LeaveConversationInput {
  conversation_id: string
  [key: string]: unknown
}

export interface UpdateStatusInput {
  conversation_id: string
  status: string
  [key: string]: unknown
}

export interface UpdateNameInput {
  conversation_id: string
  name: string
  [key: string]: unknown
}

export interface InitVideoCallInput {
  conversation_id: string
  [key: string]: unknown
}

export interface AssignTeamMemberInput {
  conversation_id: string
  user_id: string
  [key: string]: unknown
}

export interface RemoveTeamMemberInput {
  conversation_id: string
  user_id: string
  [key: string]: unknown
}

export interface InvitableUser {
  _id: string
  name?: string
  email?: string
  [key: string]: unknown
}

export interface CreateConversationInput {
  channel_id?: string
  contact_id?: string
  [key: string]: unknown
}

export interface JoinRequestInput {
  conversation_id: string
  [key: string]: unknown
}

export class ConversationsResource {
  /**
   * @param base - channel-service base URL (gateway/channel-service)
   */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private get v1() { return `${this.base}/v1` }
  private get v2() { return `${this.base}/v2` }

  async list(params?: {
    type?: string
    q?: string
    limit?: number
    skip?: number
    sort?: string
  }): Promise<PagedResponse<Conversation>> {
    const url = new URL(`${this.v2}/team_conversations`)
    if (params?.type)   url.searchParams.set("type",  params.type)
    if (params?.q)      url.searchParams.set("q",     params.q)
    if (params?.limit)  url.searchParams.set("limit", String(params.limit))
    if (params?.skip !== undefined) url.searchParams.set("skip", String(params.skip))
    if (params?.sort)   url.searchParams.set("sort",  params.sort)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async get(convId: string): Promise<Conversation> {
    return this.http.getFetch()(`${this.v1}/team_conversations/${convId}`, { method: "GET" }).then(r => r.json())
  }

  async getByConversationId(conversationId: string): Promise<Conversation> {
    const url = new URL(`${this.v1}/team_conversations`)
    url.searchParams.set("type", "conversation_id")
    url.searchParams.set("q",    conversationId)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async search(params: { businessUnitId: string; q: string; limit?: number; skip?: number }): Promise<PagedResponse<Conversation>> {
    const url = new URL(`${this.v1}/team_conversations/_search`)
    url.searchParams.set("business_unit_id", params.businessUnitId)
    url.searchParams.set("type",             "text")
    url.searchParams.set("q",               params.q)
    if (params.limit) url.searchParams.set("limit", String(params.limit))
    if (params.skip !== undefined) url.searchParams.set("skip", String(params.skip))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  /**
   * Get conversation counts per view.
   *
   * No params → org-scoped (v1) — counts across the user's org.
   * Pass `{ businessUnitId }` → BU-scoped (v2) — counts for that business unit.
   */
  async getViewsCount(params?: { businessUnitId?: string }): Promise<{ [view: string]: number }> {
    if (params?.businessUnitId) {
      const url = new URL(`${this.v2}/team_conversations/_views_count`)
      url.searchParams.set("type", "business_unit_id")
      url.searchParams.set("q",    params.businessUnitId)
      return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
    }
    const res = await this.http.getFetch()(`${this.v1}/team_conversations/_views_count`, { method: "GET" }).then(r => r.json())
    return (res as any)?.data ?? res
  }

  async getOutstanding(params: { businessUnitId: string; limit?: number; skip?: number }): Promise<PagedResponse<Conversation>> {
    const url = new URL(`${this.v1}/team_conversations/_outstanding`)
    url.searchParams.set("type", "business_unit_id")
    url.searchParams.set("q",    params.businessUnitId)
    if (params.limit) url.searchParams.set("limit", String(params.limit))
    if (params.skip !== undefined) url.searchParams.set("skip", String(params.skip))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async join(body: JoinConversationInput): Promise<ConversationActionResponse> {
    return this.http.getFetch()(`${this.v1}/team_conversations/_join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async leave(body: LeaveConversationInput): Promise<ConversationActionResponse> {
    return this.http.getFetch()(`${this.v1}/team_conversations/_leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateStatus(body: UpdateStatusInput): Promise<ConversationActionResponse> {
    return this.http.getFetch()(`${this.v1}/team_conversations/_update_status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateName(body: UpdateNameInput): Promise<ConversationActionResponse> {
    return this.http.getFetch()(`${this.v1}/team_conversations/_update_name`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async initVideoCall(body: InitVideoCallInput): Promise<ConversationActionResponse> {
    return this.http.getFetch()(`${this.v1}/team_conversations/_init_jaas_conference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async assignTeamMember(body: AssignTeamMemberInput): Promise<ConversationActionResponse> {
    return this.http.getFetch()(`${this.v1}/team_conversations/assign_team_member`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async removeTeamMember(body: RemoveTeamMemberInput): Promise<ConversationActionResponse> {
    return this.http.getFetch()(`${this.v1}/team_conversations/remove_team_member`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getInvitableUsers(teamConvId: string): Promise<InvitableUser[]> {
    return this.http.getFetch()(`${this.v1}/team_conversations/${teamConvId}/users`, { method: "GET" }).then(r => r.json())
  }

  async getConversation(conversationId: string): Promise<Conversation> {
    return this.http.getFetch()(`${this.v1}/conversations/${conversationId}`, { method: "GET" }).then(r => r.json())
  }

  async create(body?: CreateConversationInput): Promise<Conversation> {
    return this.http.getFetch()(`${this.v1}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }).then(r => r.json())
  }

  async joinRequest(body: JoinRequestInput): Promise<ConversationActionResponse> {
    return this.http.getFetch()(`${this.v1}/team_conversations/_join_request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
