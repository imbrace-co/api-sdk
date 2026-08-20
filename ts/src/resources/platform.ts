import { HttpTransport } from "../http.js"
import type { User, Organization, Permission, PagedResponse } from "../types/index.js"

export interface ChangeRoleResponse {
  success: boolean
  user?: User
  [key: string]: unknown
}

export interface UserActionResponse {
  success: boolean
  [key: string]: unknown
}

export interface BulkInviteInput {
  users: Array<{ email: string; role?: string; [key: string]: unknown }>
  [key: string]: unknown
}

export interface BulkInviteResponse {
  invited: number
  errors?: unknown[]
  [key: string]: unknown
}

export interface UserWorkflowsResponse {
  workflows: unknown[]
  [key: string]: unknown
}

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

export interface TeamOperationResponse {
  success: boolean
  [key: string]: unknown
}

export interface TeamWorkflowsResponse {
  workflows: unknown[]
  [key: string]: unknown
}

export interface Credential {
  id: string
  name: string
  type: string
  [key: string]: unknown
}

export interface CredentialTypeItem {
  name: string
  displayName: string
  [key: string]: unknown
}

export interface KnowledgeItem {
  _id: string
  name?: string
  [key: string]: unknown
}

export interface KnowledgeListResponse {
  data: KnowledgeItem[]
  [key: string]: unknown
}

export interface KnowledgeUploadResponse {
  url?: string
  [key: string]: unknown
}

export interface ResourceItem {
  _id: string
  name: string
  [key: string]: unknown
}

export interface Room {
  _id: string
  name?: string
  status?: string
  [key: string]: unknown
}

export interface UpdateRoomInput {
  name?: string
  status?: string
  [key: string]: unknown
}

export interface RoomStatusResponse {
  status: string
  [key: string]: unknown
}

export interface JoinRoomInput {
  room_id: string
  [key: string]: unknown
}

export interface JoinRoomResponse {
  success: boolean
  [key: string]: unknown
}

export interface RoomStatusCountResponse {
  [status: string]: number
}

export interface PhysicalStore {
  _id: string
  name: string
  address?: string
  [key: string]: unknown
}

export interface CreateStoreInput {
  name: string
  address?: string
  [key: string]: unknown
}

export interface UpdateStoreInput {
  name?: string
  address?: string
  [key: string]: unknown
}

export interface FacebookPage {
  id: string
  name: string
  access_token?: string
  [key: string]: unknown
}

export interface AuthFacebookInput {
  access_token: string
  [key: string]: unknown
}

export interface AuthFacebookResponse {
  success: boolean
  pages?: FacebookPage[]
  [key: string]: unknown
}

export interface MailChannel {
  _id: string
  name?: string
  email?: string
  [key: string]: unknown
}

export interface CreateMailChannelInput {
  name?: string
  email?: string
  [key: string]: unknown
}

export interface InitChannelInput {
  type: string
  [key: string]: unknown
}

export interface InitChannelResponse {
  success: boolean
  [key: string]: unknown
}

export interface CreateAwsOrgInput {
  customer_id?: string
  [key: string]: unknown
}

export interface UpdateContactV2Input {
  [key: string]: unknown
}

export class PlatformResource {
  constructor(
    private readonly http: HttpTransport,
    private readonly base: string,
  ) {}

  private get v1() { return `${this.base}/v1` }
  private get v2() { return `${this.base}/v2` }

  async listUsers(params?: {
    page?: number
    limit?: number
    skip?: number
    search?: string
    roles?: string
    sort?: string
    status?: string
  }): Promise<PagedResponse<User>> {
    const url = new URL(`${this.v1}/users`)
    if (params?.page)   url.searchParams.set("page",   String(params.page))
    if (params?.limit)  url.searchParams.set("limit",  String(params.limit))
    if (params?.skip !== undefined) url.searchParams.set("skip", String(params.skip))
    if (params?.search) url.searchParams.set("search", params.search)
    if (params?.roles)  url.searchParams.set("roles",  params.roles)
    if (params?.sort)   url.searchParams.set("sort",   params.sort)
    if (params?.status) url.searchParams.set("status", params.status)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async getUser(userId: string): Promise<User> {
    return this.http.getFetch()(`${this.v1}/users/${userId}`, { method: "GET" }).then(r => r.json())
  }

  async getMe(): Promise<User> {
    return this.http.getFetch()(`${this.v1}/users/_me`, { method: "GET" }).then(r => r.json())
  }

  async updateUser(userId: string, body: Partial<User>): Promise<User> {
    return this.http.getFetch()(`${this.v1}/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async changeRole(body: { user_id: string; role: string }): Promise<ChangeRoleResponse> {
    return this.http.getFetch()(`${this.v1}/users/_change_role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async archiveUser(body: { user_id: string }): Promise<UserActionResponse> {
    return this.http.getFetch()(`${this.v1}/users/_archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async reactivateUser(body: { user_id: string }): Promise<UserActionResponse> {
    return this.http.getFetch()(`${this.v1}/users/_reactivate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async bulkInvite(body: BulkInviteInput): Promise<BulkInviteResponse> {
    return this.http.getFetch()(`${this.v1}/users/_bulk_invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getUserWorkflows(userId: string): Promise<UserWorkflowsResponse> {
    return this.http.getFetch()(`${this.v1}/users/${userId}/workflows`, { method: "GET" }).then(r => r.json())
  }

  async listOrgs(params?: {
    limit?: number
    skip?: number
    is_active?: boolean
  }): Promise<PagedResponse<Organization>> {
    // platform-service paged `/v2/organizations` requires a `login_acc_` token
    // (only issued during OTP/SSO login flow). For general use post-login,
    // defer to `/_all` which accepts the standard `acc_` token and slice client-side.
    const all = await this.listAllOrgs({ is_active: params?.is_active })
    const skip  = params?.skip  ?? 0
    const limit = params?.limit ?? all.length
    return { data: all.slice(skip, skip + limit), total: all.length, page: 1, limit }
  }

  async listAllOrgs(params?: { is_active?: boolean }): Promise<Organization[]> {
    const url = new URL(`${this.v2}/organizations/_all`)
    if (params?.is_active !== undefined) url.searchParams.set("is_active", String(params.is_active))
    const res = await this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
    // Platform-service wraps in {object_name, data}
    if (res && typeof res === "object" && Array.isArray((res as any).data)) {
      return (res as { data: Organization[] }).data
    }
    return res as Organization[]
  }

  async createOrg(body: Partial<Organization>): Promise<Organization> {
    return this.http.getFetch()(`${this.v1}/organizations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async listTeams(params?: { type?: string; limit?: number; skip?: number; q?: string }): Promise<PagedResponse<{ _id: string; name: string; [key: string]: unknown }>> {
    const url = new URL(`${this.v2}/teams`)
    if (params?.type)   url.searchParams.set("type",  params.type)
    if (params?.limit)  url.searchParams.set("limit", String(params.limit))
    if (params?.skip !== undefined) url.searchParams.set("skip", String(params.skip))
    if (params?.q)      url.searchParams.set("q",     params.q)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async getMyTeams(): Promise<{ _id: string; name: string; [key: string]: unknown }[]> {
    return this.http.getFetch()(`${this.v2}/teams/my`, { method: "GET" }).then(r => r.json())
  }

  async createTeam(body: CreateTeamInput): Promise<{ _id: string; name: string; [key: string]: unknown }> {
    return this.http.getFetch()(`${this.v1}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateTeam(teamId: string, body: UpdateTeamInput): Promise<{ _id: string; name: string; [key: string]: unknown }> {
    return this.http.getFetch()(`${this.v2}/teams/${teamId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deleteTeam(teamId: string): Promise<TeamOperationResponse> {
    return this.http.getFetch()(`${this.v2}/teams/${teamId}`, { method: "DELETE" }).then(r => r.json())
  }

  async addTeamUsers(body: { team_id: string; user_ids: string[] }): Promise<TeamOperationResponse> {
    return this.http.getFetch()(`${this.v2}/teams/_add_users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async removeTeamUsers(body: { user_ids: string[] }): Promise<TeamOperationResponse> {
    return this.http.getFetch()(`${this.v2}/teams/_remove_users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getTeamWorkflows(teamId: string): Promise<TeamWorkflowsResponse> {
    return this.http.getFetch()(`${this.v1}/teams/${teamId}/workflows`, { method: "GET" }).then(r => r.json())
  }

  async listPermissions(userId: string): Promise<Permission[]> {
    return this.http.getFetch()(`${this.v1}/users/${userId}/permissions`, { method: "GET" }).then(r => r.json())
  }

  async grantPermission(userId: string, resource: string, action: Permission["action"]): Promise<Permission> {
    return this.http.getFetch()(`${this.v1}/users/${userId}/permissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource, action }),
    }).then(r => r.json())
  }

  async revokePermission(userId: string, permissionId: string): Promise<void> {
    await this.http.getFetch()(`${this.v1}/users/${userId}/permissions/${permissionId}`, { method: "DELETE" })
  }

  async listCredentials(): Promise<Credential[]> {
    return this.http.getFetch()(`${this.v1}/credentials`, { method: "GET" }).then(r => r.json())
  }

  async getCredentialTypes(params?: Record<string, string>): Promise<CredentialTypeItem[]> {
    const url = new URL(`${this.v1}/workflow/credential-types`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listKnowledge(): Promise<KnowledgeListResponse> {
    return this.http.getFetch()(`${this.v1}/knowledge`, { method: "GET" }).then(r => r.json())
  }

  async uploadKnowledge(body: FormData): Promise<KnowledgeUploadResponse> {
    return this.http.getFetch()(`${this.v1}/knowledge/upload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async listResources(): Promise<ResourceItem[]> {
    return this.http.getFetch()(`${this.v1}/resources`, { method: "GET" }).then(r => r.json())
  }

  async getContactV2(contactId: string): Promise<{ _id: string; [key: string]: unknown }> {
    return this.http.getFetch()(`${this.v2}/contacts/${contactId}`, { method: "GET" }).then(r => r.json())
  }

  async updateContactV2(contactId: string, body: UpdateContactV2Input): Promise<{ _id: string; [key: string]: unknown }> {
    return this.http.getFetch()(`${this.v2}/contacts/${contactId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async suspendUser(body: { user_id: string }): Promise<UserActionResponse> {
    return this.http.getFetch()(`${this.v1}/users/_suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async deactivateUser(body: { user_id: string }): Promise<UserActionResponse> {
    return this.http.getFetch()(`${this.v1}/users/_deactivate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async listAllUsers(params?: Record<string, string>): Promise<User[]> {
    const url = new URL(`${this.v1}/users/_all`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async uploadUserAvatar(body: FormData): Promise<{ url: string }> {
    return this.http.getFetch()(`${this.v1}/users/_fileupload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async listBusinessUnits(params?: Record<string, string>): Promise<{ _id: string; name: string; [key: string]: unknown }[]> {
    const url = new URL(`${this.v1}/business_units`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listRooms(params?: Record<string, string>): Promise<Room[]> {
    const url = new URL(`${this.v1}/rooms`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async getRoom(roomId: string): Promise<Room> {
    return this.http.getFetch()(`${this.v1}/rooms/${roomId}`, { method: "GET" }).then(r => r.json())
  }

  async updateRoom(roomId: string, body: UpdateRoomInput): Promise<Room> {
    return this.http.getFetch()(`${this.v1}/rooms/${roomId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getRoomStatus(params?: Record<string, string>): Promise<RoomStatusResponse> {
    const url = new URL(`${this.v1}/rooms/_status`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async joinRoom(body: JoinRoomInput): Promise<JoinRoomResponse> {
    return this.http.getFetch()(`${this.v1}/rooms/_join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getRoomStatusCount(): Promise<RoomStatusCountResponse> {
    return this.http.getFetch()(`${this.v1}/rooms/_status_count`, { method: "GET" }).then(r => r.json())
  }

  async searchRooms(params: { q: string }): Promise<Room[]> {
    const url = new URL(`${this.v1}/rooms/_search`)
    url.searchParams.set("q", params.q)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listStores(): Promise<PhysicalStore[]> {
    return this.http.getFetch()(`${this.v1}/stores`, { method: "GET" }).then(r => r.json())
  }

  async createStore(body: CreateStoreInput): Promise<PhysicalStore> {
    return this.http.getFetch()(`${this.v1}/stores/_create_with_fp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async updateStore(body: UpdateStoreInput): Promise<PhysicalStore> {
    return this.http.getFetch()(`${this.v1}/stores/_modify_with_fp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getStore(storeId: string): Promise<PhysicalStore> {
    return this.http.getFetch()(`${this.v1}/stores/${storeId}`, { method: "GET" }).then(r => r.json())
  }

  async getFacebookPages(params?: { fbUserId?: string }): Promise<FacebookPage[]> {
    const url = new URL(`${this.v1}/facebooks`)
    if (params?.fbUserId) url.searchParams.set("fbUserId", params.fbUserId)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async authFacebookPages(body: AuthFacebookInput): Promise<AuthFacebookResponse> {
    return this.http.getFetch()(`${this.v1}/facebook/_auth_pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async cancelFacebookPages(body: AuthFacebookInput): Promise<AuthFacebookResponse> {
    return this.http.getFetch()(`${this.v1}/facebook/_cancel_pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createMailChannel(body: CreateMailChannelInput): Promise<MailChannel> {
    return this.http.getFetch()(`${this.v1}/mail_channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getMailChannel(channelId: string): Promise<MailChannel> {
    return this.http.getFetch()(`${this.v1}/mail_channels/${channelId}`, { method: "GET" }).then(r => r.json())
  }

  async initChannel(body: InitChannelInput): Promise<InitChannelResponse> {
    return this.http.getFetch()(`${this.v1}/init_channel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async createAwsOrg(body: CreateAwsOrgInput): Promise<Organization> {
    return this.http.getFetch()(`${this.v1}/organizations/aws`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async getCredentialTypeByName(name: string): Promise<CredentialTypeItem> {
    return this.http.getFetch()(`${this.v1}/workflow/credential-types/${name}`, { method: "GET" }).then(r => r.json())
  }

  async listProcessedCredentialTypes(): Promise<CredentialTypeItem[]> {
    return this.http.getFetch()(`${this.v1}/workflow/processed-credential-types`, { method: "GET" }).then(r => r.json())
  }

  async getCredentialParam(params?: Record<string, string>): Promise<{ [key: string]: unknown }> {
    const url = new URL(`${this.v1}/workflow/_credentialParam`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async updateTeamV1(teamId: string, body: UpdateTeamInput): Promise<{ _id: string; name: string; [key: string]: unknown }> {
    return this.http.getFetch()(`${this.v1}/teams/${teamId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async uploadTeamIcon(body: FormData): Promise<{ url: string }> {
    return this.http.getFetch()(`${this.v1}/teams/_fileupload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async listTeamUsers(params?: Record<string, string>): Promise<User[]> {
    const url = new URL(`${this.v1}/team_users`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async listTeamInvites(version: "v1" | "v2" = "v2"): Promise<{ _id: string; [key: string]: unknown }[]> {
    return this.http.getFetch()(`${this.base}/${version}/team_users/_invite_list`, { method: "GET" }).then(r => r.json())
  }

  async listTeamUsersV2(params?: Record<string, string>): Promise<User[]> {
    const url = new URL(`${this.v2}/team_users`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async acceptTeamJoinRequest(teamId: string, teamUserId: string): Promise<TeamOperationResponse> {
    return this.http.getFetch()(`${this.v2}/teams/${teamId}/user/${teamUserId}/accept`, {
      method: "POST",
    }).then(r => r.json())
  }

  async getTeamLabels(teamId: string): Promise<{ _id: string; name: string; [key: string]: unknown }[]> {
    return this.http.getFetch()(`${this.v1}/teams/${teamId}/team_labels`, { method: "GET" }).then(r => r.json())
  }
}
