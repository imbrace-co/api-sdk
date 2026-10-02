import { HttpTransport } from "../http.js"

export interface Role {
  id: string
  organization_id: string
  key: string
  name: string
  description?: string
  permissions: string[]
  scope: "org" | "team"
  team_id?: string | null
  priority?: number
  is_system: boolean
  is_active: boolean
  [key: string]: unknown
}

export interface CreateRoleInput {
  /** Lowercase id, `^[a-z][a-z0-9_]{1,49}$`; must not clash with a system role. */
  key: string
  name: string
  description?: string
  /** Permission keys from {@link RolesResource.listPermissions}. */
  permissions?: string[]
  priority?: number
  scope?: "org" | "team"
  team_id?: string
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  permissions?: string[]
  priority?: number
  is_active?: boolean
}

export interface PermissionCatalog {
  groups: unknown[]
  all: unknown[]
  wildcard?: string
  [key: string]: unknown
}

/** Organization roles and their permissions (platform `/v1/roles`). Writes need an org admin and the `rbac` feature. */
export class RolesResource {
  /** @param base - platform base URL (`${gateway}/platform`) */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private json(path: string, method: string, body?: unknown): Promise<any> {
    return this.http.getFetch()(`${this.base}/v1${path}`, {
      method,
      ...(body !== undefined ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
    }).then(r => r.json())
  }

  /** Every permission a role can hold. */
  async listPermissions(params?: { scope?: "org" | "team" }): Promise<PermissionCatalog> {
    return this.json(`/roles/permissions${params?.scope ? `?scope=${params.scope}` : ""}`, "GET")
  }

  async list(params?: { limit?: number; skip?: number; scope?: "org" | "team"; team_id?: string }): Promise<{ data: Role[]; count: number; has_more: boolean }> {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined) q.set(k, String(v))
    const s = q.toString()
    return this.json(`/roles${s ? `?${s}` : ""}`, "GET")
  }

  async get(id: string): Promise<Role> {
    return this.json(`/roles/${id}`, "GET")
  }

  async create(body: CreateRoleInput): Promise<Role> {
    return this.json("/roles", "POST", body)
  }

  async update(id: string, body: UpdateRoleInput): Promise<Role> {
    return this.json(`/roles/${id}`, "PUT", body)
  }

  /** Fails with 409 while users still hold the role. */
  async delete(id: string): Promise<{ success: boolean; message?: string }> {
    return this.json(`/roles/${id}`, "DELETE")
  }

  /** Give a user a role (by role key). */
  async assign(userId: string, role: string): Promise<Record<string, unknown>> {
    return this.json("/users/_change_role", "POST", { user_id: userId, role })
  }

  /** Give several users a role in one call. */
  async assignMany(userIds: string[], role: string): Promise<{ success: boolean; updated: unknown[]; updated_count: number; errors: unknown[]; error_count: number }> {
    return this.json("/users/_bulk_change_role", "POST", { user_ids: userIds, role })
  }
}
