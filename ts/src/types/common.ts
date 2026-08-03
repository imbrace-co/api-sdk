export interface ListResponse<T = unknown> {
  object_name: "list"
  data: T[]
  nested?: Record<string, unknown>
  has_more: boolean
  count: number
  total: number
}

export interface ApiResponse<T = unknown> {
  success?: boolean
  data?: T
  message?: string
  error?: string
}

export interface PagedResponse<T = unknown> {
  data: T[]
  total: number
  page: number
  limit: number
}
