/* eslint-disable @typescript-eslint/no-unused-vars -- retired methods keep their signatures for callers */
import { HttpTransport } from "../http.js"
import { retired } from "./retired.js"
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

/** The organization's default web channel. */
export interface InitChannelResponse {
  id: string
  type: string
  [key: string]: unknown
}

export interface CreateAwsOrgInput {
  customer_id?: string
  [key: string]: unknown
}

export interface UpdateContactV2Input {
  [key: string]: unknown
}

/**
 * Platform list envelope, used by teams, team users and the invite list.
 * Note: `count` is the grand total across pages, `total` is the size of this page.
 */
export interface PlatformList<T> {
  object_name?: string
  data: T[]
  nested?: Record<string, unknown>
  has_more?: boolean
  count: number
  total: number
}

export interface TeamUser {
  id?: string
  team_id?: string
  user_id?: string
  role?: string
  user?: User
  [key: string]: unknown
}

export interface EffectivePermissions {
  user_id: string
  organization_id: string
  role: string
  is_owner: boolean
  permissions: string[]
  roles_version?: number
  [key: string]: unknown
}

export interface AddTeamUsersInput {
  team_id: string
  /** Members with their team role. */
  users?: Array<{ user_id: string; role: string }>
  /** Shorthand: these users are added with `role` (default "member"). */
  user_ids?: string[]
  role?: string
  reserve_leave?: boolean
}

const RETIRED = "its route was removed when the legacy backend was retired"

export class PlatformResource {
  private readonly channelService: string

  /**
   * @param base           - platform base URL (`${gateway}/platform`)
   * @param channelService - channel-service base URL (`${gateway}/channel-service`); contacts,
   *                         credentials and channel init moved there from the retired backend
   */
  constructor(
    private readonly http: HttpTransport,
    private readonly base: string,
    channelService?: string,
  ) {
    this.channelService = (channelService ?? base.replace(/\/platform\/?$/, "/channel-service")).replace(/\/$/, "")
  }

  private get v1() { return `${this.base}/v1` }
  private get v2() { return `${this.base}/v2` }
  private get cs() { return `${this.channelService}/v1` }

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

  /** @deprecated Retired; throws. Use `deactivateUser()`. */
  async archiveUser(_body: { user_id: string }): Promise<UserActionResponse> {
    return retired("platform.archiveUser", RETIRED, "Use platform.deactivateUser() instead.")
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

  /** @deprecated Retired; throws. */
  async getUserWorkflows(_userId: string): Promise<UserWorkflowsResponse> {
    return retired("platform.getUserWorkflows", RETIRED)
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

  /** Lists the caller's organizations. Needs a user access token; API keys are rejected (401). */
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

  /**
   * Teams of a business unit. platform-service requires the business unit id as `q`
   * (with `type: "business_unit_id"`, which is the default).
   */
  async listTeams(params: { q: string; type?: string; limit?: number; skip?: number; search?: string }): Promise<PlatformList<{ _id: string; name: string; [key: string]: unknown }>> {
    return this.http.getFetch()(teamListUrl(`${this.v2}/teams`, "business_unit_id", params), { method: "GET" }).then(r => r.json())
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
    // platform-service answers 200 with an empty body
    return this.http.getFetch()(`${this.v2}/teams/${teamId}`, { method: "DELETE" })
      .then(r => r.text())
      .then(t => (t ? JSON.parse(t) : { success: true }))
  }

  /** Adds members to a team. Users with an unknown role are silently skipped by the server. */
  async addTeamUsers(body: AddTeamUsersInput): Promise<TeamOperationResponse> {
    return this.http.getFetch()(`${this.v2}/teams/_add_users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addTeamUsersBody(body)),
    }).then(r => r.json())
  }

  async removeTeamUsers(body: { team_id: string; user_ids: string[] }): Promise<TeamOperationResponse> {
    return this.http.getFetch()(`${this.v2}/teams/_remove_users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  /** @deprecated Retired; throws. */
  async getTeamWorkflows(_teamId: string): Promise<TeamWorkflowsResponse> {
    return retired("platform.getTeamWorkflows", RETIRED)
  }

  /** @deprecated Retired; throws. Permissions are role-based: use `getEffectivePermissions()`. */
  async listPermissions(_userId: string): Promise<Permission[]> {
    return retired("platform.listPermissions", RETIRED, "Use platform.getEffectivePermissions(userId) instead.")
  }

  /** A user's effective permissions, resolved from their role — `GET /platform/v1/roles/_effective`. */
  async getEffectivePermissions(userId: string): Promise<EffectivePermissions> {
    const url = new URL(`${this.v1}/roles/_effective`)
    url.searchParams.set("user_id", userId)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  /** @deprecated Retired; throws. Permissions come from roles: use `changeRole()`. */
  async grantPermission(_userId: string, _resource: string, _action: Permission["action"]): Promise<Permission> {
    return retired("platform.grantPermission", RETIRED, "Permissions come from roles; use platform.changeRole().")
  }

  /** @deprecated Retired; throws. Permissions come from roles: use `changeRole()`. */
  async revokePermission(_userId: string, _permissionId: string): Promise<void> {
    return retired("platform.revokePermission", RETIRED, "Permissions come from roles; use platform.changeRole().")
  }

  /** Workflow credentials — `GET /channel-service/v1/credentials`. */
  async listCredentials(): Promise<Credential[]> {
    return this.http.getFetch()(`${this.cs}/credentials`, { method: "GET" }).then(r => r.json()).then(unwrapData)
  }

  /** @deprecated Retired; throws. Use `listProcessedCredentialTypes()`. */
  async getCredentialTypes(_params?: Record<string, string>): Promise<CredentialTypeItem[]> {
    return retired("platform.getCredentialTypes", RETIRED, "Use platform.listProcessedCredentialTypes() instead.")
  }

  /** @deprecated Retired; throws. Knowledge Hub files live in data-board folders (`boards.createFolder`, `boards.uploadFile`). */
  async listKnowledge(): Promise<KnowledgeListResponse> {
    return retired("platform.listKnowledge", RETIRED, "Use the Knowledge Hub folders in client.boards instead.")
  }

  /** @deprecated Retired; throws. Use `boards.uploadFile()`. */
  async uploadKnowledge(_body: FormData): Promise<KnowledgeUploadResponse> {
    return retired("platform.uploadKnowledge", RETIRED, "Use client.boards.uploadFile() instead.")
  }

  /** @deprecated Retired; throws. */
  async listResources(): Promise<ResourceItem[]> {
    return retired("platform.listResources", RETIRED)
  }

  /** Get a contact — `GET /channel-service/v1/contacts/:id`. */
  async getContactV2(contactId: string): Promise<{ _id: string; [key: string]: unknown }> {
    return this.http.getFetch()(`${this.cs}/contacts/${contactId}`, { method: "GET" }).then(r => r.json()).then(unwrapData)
  }

  /** Update a contact — `PUT /channel-service/v1/contacts/:id`. */
  async updateContactV2(contactId: string, body: UpdateContactV2Input): Promise<{ _id: string; [key: string]: unknown }> {
    return this.http.getFetch()(`${this.cs}/contacts/${contactId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(unwrapData)
  }

  /** @deprecated Retired; throws. Use `deactivateUser()`. */
  async suspendUser(_body: { user_id: string }): Promise<UserActionResponse> {
    return retired("platform.suspendUser", RETIRED, "Use platform.deactivateUser() instead.")
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

  /** Upload the caller's own avatar — `POST /platform/v1/account/_fileupload`. */
  async uploadUserAvatar(body: FormData): Promise<{ url: string }> {
    return this.http.getFetch()(`${this.v1}/account/_fileupload`, {
      method: "POST",
      body,
    }).then(r => r.json())
  }

  async listBusinessUnits(params?: Record<string, string>): Promise<{ _id: string; name: string; [key: string]: unknown }[]> {
    const url = new URL(`${this.v1}/business_units`)
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json()).then(unwrapData)
  }

  /** @deprecated Retired; throws. */
  async listRooms(_params?: Record<string, string>): Promise<Room[]> { return retired("platform.listRooms", RETIRED) }
  /** @deprecated Retired; throws. */
  async getRoom(_roomId: string): Promise<Room> { return retired("platform.getRoom", RETIRED) }
  /** @deprecated Retired; throws. */
  async updateRoom(_roomId: string, _body: UpdateRoomInput): Promise<Room> { return retired("platform.updateRoom", RETIRED) }
  /** @deprecated Retired; throws. */
  async getRoomStatus(_params?: Record<string, string>): Promise<RoomStatusResponse> { return retired("platform.getRoomStatus", RETIRED) }
  /** @deprecated Retired; throws. */
  async joinRoom(_body: JoinRoomInput): Promise<JoinRoomResponse> { return retired("platform.joinRoom", RETIRED) }
  /** @deprecated Retired; throws. */
  async getRoomStatusCount(): Promise<RoomStatusCountResponse> { return retired("platform.getRoomStatusCount", RETIRED) }
  /** @deprecated Retired; throws. */
  async searchRooms(_params: { q: string }): Promise<Room[]> { return retired("platform.searchRooms", RETIRED) }

  /** @deprecated Retired; throws. */
  async listStores(): Promise<PhysicalStore[]> { return retired("platform.listStores", RETIRED) }
  /** @deprecated Retired; throws. */
  async createStore(_body: CreateStoreInput): Promise<PhysicalStore> { return retired("platform.createStore", RETIRED) }
  /** @deprecated Retired; throws. */
  async updateStore(_body: UpdateStoreInput): Promise<PhysicalStore> { return retired("platform.updateStore", RETIRED) }
  /** @deprecated Retired; throws. */
  async getStore(_storeId: string): Promise<PhysicalStore> { return retired("platform.getStore", RETIRED) }

  /** @deprecated Retired; throws. Facebook channels are managed through `client.channel`. */
  async getFacebookPages(_params?: { fbUserId?: string }): Promise<FacebookPage[]> {
    return retired("platform.getFacebookPages", RETIRED, "Facebook channels are managed through client.channel.")
  }
  /** @deprecated Retired; throws. Facebook channels are managed through `client.channel`. */
  async authFacebookPages(_body: AuthFacebookInput): Promise<AuthFacebookResponse> {
    return retired("platform.authFacebookPages", RETIRED, "Facebook channels are managed through client.channel.")
  }
  /** @deprecated Retired; throws. Facebook channels are managed through `client.channel`. */
  async cancelFacebookPages(_body: AuthFacebookInput): Promise<AuthFacebookResponse> {
    return retired("platform.cancelFacebookPages", RETIRED, "Facebook channels are managed through client.channel.")
  }

  /** @deprecated Retired; throws. Email channels are managed through `client.channel`. */
  async createMailChannel(_body: CreateMailChannelInput): Promise<MailChannel> {
    return retired("platform.createMailChannel", RETIRED, "Email channels are managed through client.channel.")
  }
  /** @deprecated Retired; throws. Email channels are managed through `client.channel`. */
  async getMailChannel(_channelId: string): Promise<MailChannel> {
    return retired("platform.getMailChannel", RETIRED, "Email channels are managed through client.channel.")
  }

  /** Get or create the organization's default web channel — `POST /channel-service/v1/init_channel`. */
  async initChannel(body: InitChannelInput): Promise<InitChannelResponse> {
    return this.http.getFetch()(`${this.cs}/init_channel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json()).then(unwrapData)
  }

  async createAwsOrg(body: CreateAwsOrgInput): Promise<Organization> {
    return this.http.getFetch()(`${this.v1}/organizations/aws`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  /** One credential type's schema — `GET /channel-service/v1/workflow/_credentialParam?type=:name`. */
  async getCredentialTypeByName(name: string): Promise<CredentialTypeItem> {
    return this.getCredentialParam({ type: name }) as Promise<CredentialTypeItem>
  }

  /**
   * Credential types — `GET /channel-service/v1/workflow/processed-credential-types`.
   * The service groups them as `{ channel, integration }`; they are returned as one list.
   */
  async listProcessedCredentialTypes(): Promise<CredentialTypeItem[]> {
    const res = await this.http.getFetch()(`${this.cs}/workflow/processed-credential-types`, { method: "GET" }).then(r => r.json())
    if (Array.isArray(res)) return res
    return [...(res?.channel ?? []), ...(res?.integration ?? [])]
  }

  /** A credential type's parameters — `GET /channel-service/v1/workflow/_credentialParam`. Requires `type`. */
  async getCredentialParam(params: { type: string; [key: string]: string }): Promise<{ [key: string]: unknown }> {
    const url = new URL(`${this.cs}/workflow/_credentialParam`)
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
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

  /** Members of a team. platform-service requires the team id as `q` (with `type: "team_id"`, the default). */
  async listTeamUsers(params: { q: string; type?: string; limit?: number; skip?: number; search?: string }): Promise<PlatformList<TeamUser>> {
    return this.http.getFetch()(teamListUrl(`${this.v1}/team_users`, "team_id", params), { method: "GET" }).then(r => r.json())
  }

  /** Pending invites of a team — `GET /platform/{version}/team_users/_invite_list`. */
  async listTeamInvites(teamId: string, version: "v1" | "v2" = "v2"): Promise<PlatformList<User>> {
    const url = new URL(`${this.base}/${version}/team_users/_invite_list`)
    url.searchParams.set("type", "team_id")
    url.searchParams.set("team_id", teamId)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  /** Members of a team (v2). platform-service requires the team id as `q` (with `type: "team_id"`, the default). */
  async listTeamUsersV2(params: { q: string; type?: string; limit?: number; skip?: number; search?: string; sort?: string }): Promise<PlatformList<TeamUser>> {
    return this.http.getFetch()(teamListUrl(`${this.v2}/team_users`, "team_id", params), { method: "GET" }).then(r => r.json())
  }

  async acceptTeamJoinRequest(teamId: string, teamUserId: string): Promise<TeamOperationResponse> {
    return this.http.getFetch()(`${this.v2}/teams/${teamId}/user/${teamUserId}/accept`, {
      method: "POST",
    }).then(r => r.json())
  }

  async getTeamLabels(teamId: string): Promise<{ _id: string; name: string; [key: string]: unknown }[]> {
    return this.http.getFetch()(`${this.v1}/teams/${teamId}/team_labels`, { method: "GET" })
      .then(r => r.json())
      .then(res => (Array.isArray(res) ? res : res?.items ?? res?.data ?? res))
  }
}

/** Services that moved off the retired backend wrap single objects and lists in `{ data }`. */
function unwrapData(res: any): any {
  return res && typeof res === "object" && !Array.isArray(res) && "data" in res ? res.data : res
}

/** Builds a teams / team_users list URL; platform-service rejects the call without `type` + `q`. */
export function teamListUrl(
  base: string,
  defaultType: string,
  params: { q: string; type?: string; limit?: number; skip?: number; search?: string; sort?: string },
): URL {
  const url = new URL(base)
  url.searchParams.set("type", params.type ?? defaultType)
  url.searchParams.set("q", params.q)
  if (params.limit !== undefined) url.searchParams.set("limit", String(params.limit))
  if (params.skip !== undefined) url.searchParams.set("skip", String(params.skip))
  if (params.search) url.searchParams.set("search", params.search)
  if (params.sort) url.searchParams.set("sort", params.sort)
  return url
}

/** platform-service expects `users: [{ user_id, role }]`; `user_ids` is accepted as a shorthand. */
export function addTeamUsersBody(body: AddTeamUsersInput): { team_id: string; users: Array<{ user_id: string; role: string }>; reserve_leave?: boolean } {
  const users = body.users ?? (body.user_ids ?? []).map(user_id => ({ user_id, role: body.role ?? "member" }))
  return { team_id: body.team_id, users, ...(body.reserve_leave !== undefined ? { reserve_leave: body.reserve_leave } : {}) }
}
