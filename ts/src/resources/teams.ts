import { HttpTransport } from "../http.js"
import type { Team, PagedResponse } from "../types/index.js"

export interface CreateTeamInput {
  name: string
  type?: string
  description?: string
  [key: string]: unknown
}

export interface UpdateTeamInput {
  name?: string
  description?: string
  [key: string]: unknown
}

export interface TeamMembershipResponse {
  success: boolean
  [key: string]: unknown
}

export interface TeamUserItem {
  _id: string
  user_id?: string
  team_id?: string
  role?: string
  [key: string]: unknown
}

export interface TeamWorkflowItem {
  _id: string
  name?: string
  [key: string]: unknown
}

export interface JoinTeamInput {
  team_id: string
  [key: string]: unknown
}

export interface LeaveTeamInput {
  team_id?: string
  [key: string]: unknown
}

export interface JoinRequestInput {
  message?: string
  [key: string]: unknown
}

export interface UpdateUserRoleInput {
  role: string
  [key: string]: unknown
}

export class TeamsResource {
  constructor(
    private readonly http: HttpTransport,
    private readonly base: string,
  ) {}

  private get v1() { return `${this.base}/v1` }
  private get v2() { return `${this.base}/v2` }

  async uploadIcon(body: FormData): Promise<{ url: string }> {
    return this.http.getFetch()(`${this.v1}/teams/_fileupload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async list(params?: { type?: string; limit?: number; skip?: number; q?: string }): Promise<PagedResponse<Team>> {
    const url = new URL(`${this.v2}/teams`)
    if (params?.type)   url.searchParams.set("type",  params.type)
    if (params?.limit)  url.searchParams.set("limit", String(params.limit))
    if (params?.skip !== undefined) url.searchParams.set("skip", String(params.skip))
    if (params?.q)      url.searchParams.set("q",     params.q)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listMy(): Promise<Team[]> {
    return this.http.getFetch()(`${this.v2}/teams/my`, { method: "GET" }).then(r => r.json())
  }

  async create(body: CreateTeamInput): Promise<Team> {
    return this.http.getFetch()(`${this.v1}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async update(teamId: string, body: UpdateTeamInput): Promise<Team> {
    return this.http.getFetch()(`${this.v2}/teams/${teamId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async delete(teamId: string): Promise<void> {
    await this.http.getFetch()(`${this.v2}/teams/${teamId}`, { method: "DELETE" })
  }

  async addUsers(body: { team_id: string; user_ids: string[] }): Promise<TeamMembershipResponse> {
    return this.http.getFetch()(`${this.v2}/teams/_add_users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async removeUsers(body: { user_ids: string[] }): Promise<TeamMembershipResponse> {
    return this.http.getFetch()(`${this.v2}/teams/_remove_users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getUsers(teamId: string): Promise<TeamUserItem[]> {
    return this.http.getFetch()(`${this.v1}/team/${teamId}/users`, { method: "GET" }).then(r => r.json())
  }

  async getWorkflows(teamId: string): Promise<TeamWorkflowItem[]> {
    return this.http.getFetch()(`${this.v1}/teams/${teamId}/workflows`, { method: "GET" }).then(r => r.json())
  }

  async join(body: JoinTeamInput): Promise<TeamMembershipResponse> {
    return this.http.getFetch()(`${this.v2}/teams/_join_team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async leave(body: LeaveTeamInput): Promise<TeamMembershipResponse> {
    return this.http.getFetch()(`${this.v2}/teams/_leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async requestJoin(teamId: string, body: JoinRequestInput): Promise<TeamMembershipResponse> {
    return this.http.getFetch()(`${this.v2}/teams/${teamId}/join_request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async approveJoinRequest(teamId: string, teamUserId: string): Promise<TeamMembershipResponse> {
    return this.http.getFetch()(`${this.v2}/teams/${teamId}/user/${teamUserId}/approve`, {
      method: "POST",
    }).then(r => r.json())
  }

  async updateUserRole(teamId: string, teamUserId: string, body: UpdateUserRoleInput): Promise<TeamMembershipResponse> {
    return this.http.getFetch()(`${this.v2}/teams/${teamId}/user/${teamUserId}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }
}
