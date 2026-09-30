import { HttpTransport } from "../http.js"
import type { Team } from "../types/index.js"
import { retired } from "./retired.js"
import { addTeamUsersBody, teamListUrl, type AddTeamUsersInput, type PlatformList } from "./platform.js"

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

  /**
   * Teams of a business unit. platform-service requires the business unit id as `q`
   * (with `type: "business_unit_id"`, which is the default).
   */
  async list(params: { q: string; type?: string; limit?: number; skip?: number; search?: string }): Promise<PlatformList<Team>> {
    return this.http.getFetch()(teamListUrl(`${this.v2}/teams`, "business_unit_id", params), { method: "GET" }).then(r => r.json())
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

  /** Adds members to a team. Users with an unknown role are silently skipped by the server. */
  async addUsers(body: AddTeamUsersInput): Promise<TeamMembershipResponse> {
    return this.http.getFetch()(`${this.v2}/teams/_add_users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addTeamUsersBody(body)),
    }).then(r => r.json())
  }

  async removeUsers(body: { team_id: string; user_ids: string[] }): Promise<TeamMembershipResponse> {
    return this.http.getFetch()(`${this.v2}/teams/_remove_users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getUsers(teamId: string): Promise<TeamUserItem[]> {
    return this.http.getFetch()(`${this.v1}/team/${teamId}/users`, { method: "GET" }).then(r => r.json())
  }

  /** @deprecated Retired; throws. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- keeps the signature for callers
  async getWorkflows(_teamId: string): Promise<TeamWorkflowItem[]> {
    return retired("teams.getWorkflows", "its route was removed when the legacy backend was retired")
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
