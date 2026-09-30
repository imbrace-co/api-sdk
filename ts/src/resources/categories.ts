import { HttpTransport } from "../http.js"

export interface Category {
  _id: string
  name: string
  apply_to?: string[]
  description?: string
  organization_id?: string
}

export interface CreateCategoryInput {
  name: string
  apply_to?: string[]
  description?: string
}

export interface UpdateCategoryInput {
  name?: string
  apply_to?: string[]
  description?: string
}

/** `GET /v1/platform/categories` wraps the list in `data`. */
export interface CategoryListResponse {
  data: Category[]
}

export interface DeleteCategoryResponse {
  message: string
  id: string
}

export class CategoriesResource {
  constructor(private readonly http: HttpTransport, private readonly base: string) {}

  private get url() { return `${this.base}/v1/platform/categories` }

  async list(organizationId: string): Promise<CategoryListResponse> {
    const url = new URL(this.url)
    url.searchParams.set("organization_id", organizationId)
    return this.http.getFetch()(url, { method: "GET" }).then(r => r.json())
  }

  async get(categoryId: string): Promise<Category> {
    return this.http.getFetch()(`${this.url}/${categoryId}`, { method: "GET" }).then(r => r.json())
  }

  async create(organizationId: string, body: CreateCategoryInput): Promise<Category> {
    return this.http.getFetch()(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "organization_id": organizationId },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async update(organizationId: string, categoryId: string, body: UpdateCategoryInput): Promise<Category> {
    return this.http.getFetch()(`${this.url}/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "organization_id": organizationId },
      body: JSON.stringify(body),
    }).then(r => r.json())
  }

  async delete(categoryId: string): Promise<DeleteCategoryResponse> {
    return this.http.getFetch()(`${this.url}/${categoryId}`, { method: "DELETE" }).then(r => r.json())
  }
}
