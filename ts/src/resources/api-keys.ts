import { HttpTransport } from "../http.js"
import { ApiError } from "../errors.js"

export interface ApiKey {
  _id: string
  name?: string
  organization_id?: string
  user_id?: string
  is_active?: boolean
  permissions?: Record<string, unknown>
  expired_at?: string | null
  /** Only returned by {@link ApiKeysResource.create}. */
  token?: string
  [key: string]: unknown
}

export interface CreateApiKeyInput {
  name?: string
  /** Days until the key expires (default 365). */
  expirationDays?: number
  /** A key that never expires. */
  neverExpire?: boolean
  permissions?: Record<string, unknown>
}

/** API keys of the calling user (platform `third_party_token` / `api_key_token`). */
export class ApiKeysResource {
  /** @param base - platform base URL (`${gateway}/platform`) */
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  /** The caller's keys in this org. Tokens are not included. */
  async list(): Promise<ApiKey[]> {
    return this.http.getFetch()(`${this.base}/v1/api_key_token`, { method: "GET" }).then(r => r.json())
  }

  /** Create a key. The returned `token` is shown only once; store it. */
  async create(body: CreateApiKeyInput = {}): Promise<ApiKey> {
    const res = await this.http.getFetch()(`${this.base}/v1/third_party_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(r => r.json())
    return res.apiKey ?? res
  }

  async delete(id: string): Promise<void> {
    try {
      await this.http.getFetch()(`${this.base}/v1/third_party_token/${id}`, { method: "DELETE" })
    } catch (e) {
      // platform answers 404 even when it did delete the key; trust the list instead
      if (!(e instanceof ApiError && e.statusCode === 404)) throw e
      if ((await this.list()).some(k => k._id === id)) throw e
    }
  }
}
