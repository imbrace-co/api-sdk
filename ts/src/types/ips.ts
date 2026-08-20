export interface IpsProfile {
  id: string
  user_id: string
  display_name: string
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Identity {
  id: string
  user_id: string
  provider: string
  provider_user_id: string
  created_at: string
}
