import { HttpTransport } from "../http.js";
import type { Organization, PagedResponse } from "../types/index.js";

export interface CreateOrganizationInput {
  name: string;
  plan?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

export class OrganizationsResource {
  constructor(
    private readonly http: HttpTransport,
    private readonly base: string,
  ) {}

  private get v1() {
    return `${this.base}/v1`;
  }
  private get v2() {
    return `${this.base}/v2`;
  }

  async list(params?: {
    limit?: number;
    skip?: number;
    is_active?: boolean;
  }): Promise<PagedResponse<Organization>> {
    // Two endpoints, two middleware: paged `/v1/organizations` accepts the
    // `login_acc_` token (post-login/OTP picker phase), while
    // `/v2/organizations/_all` requires an org-scoped `acc_` token
    // (post-exchange). Route by token prefix so both phases of the login flow
    // work without the caller knowing which endpoint to hit.
    const token = this.http.getToken();
    if (token?.startsWith("login_acc_")) {
      return this.listForLogin(params);
    }
    const all = await this.listAll({ is_active: params?.is_active });
    const skip = params?.skip ?? 0;
    const limit = params?.limit ?? all.length;
    return {
      data: all.slice(skip, skip + limit),
      total: all.length,
      page: 1,
      limit,
    };
  }

  /**
   * Paged `/v1/organizations` — accepts a `login_acc_` token (the `v2` route
   * rejects it with 401 on the prod-v2 gateway). Response shape:
   * `{ data, count, total, has_more }` where `count` is the grand total and
   * `total` is the size of the returned page.
   *
   * ⚠️ This is a GLOBAL org list, NOT scoped to the user's memberships — it
   * returns every org in the system (`count` can be in the hundreds), most of
   * which the user can't enter (`selectOrganization` will fail with "User not
   * found in this organization"). For the login → org-picker flow, use
   * `client.login()` / `loginWithOtp()` (or `auth.authenticate()`) instead:
   * their `organizations` are membership-scoped and all exchangeable.
   */
  async listForLogin(params?: {
    limit?: number;
    skip?: number;
    is_active?: boolean;
  }): Promise<PagedResponse<Organization>> {
    const url = new URL(`${this.v1}/organizations`);
    const limit = params?.limit ?? 10;
    const skip = params?.skip ?? 0;
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("skip", String(skip));
    if (params?.is_active !== undefined)
      url.searchParams.set("is_active", String(params.is_active));
    const res = (await this.http
      .getFetch()(url, { method: "GET" })
      .then((r) => r.json())) as any;
    const data: Organization[] = Array.isArray(res?.data) ? res.data : [];
    const total = typeof res?.count === "number" ? res.count : data.length;
    return {
      data,
      total,
      page: Math.floor(skip / Math.max(limit, 1)) + 1,
      limit,
    };
  }

  async listAll(params?: { is_active?: boolean }): Promise<Organization[]> {
    const url = new URL(`${this.v2}/organizations/_all`);
    if (params?.is_active !== undefined)
      url.searchParams.set("is_active", String(params.is_active));
    const res = await this.http
      .getFetch()(url, { method: "GET" })
      .then((r) => r.json());
    // Platform-service wraps in {object_name, data}
    if (res && typeof res === "object" && Array.isArray((res as any).data)) {
      return (res as { data: Organization[] }).data;
    }
    return res as Organization[];
  }

  async create(body: CreateOrganizationInput): Promise<Organization> {
    return this.http
      .getFetch()(`${this.v1}/organizations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      .then((r) => r.json());
  }
}
