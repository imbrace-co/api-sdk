export interface User {
  id: string
  email: string
  display_name?: string
  avatar_url?: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Permission {
  id: string
  user_id: string
  resource: string
  action: "read" | "write" | "delete" | "admin"
  created_at: string
}
