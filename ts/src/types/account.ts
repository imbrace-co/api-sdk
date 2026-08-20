import type { Team } from "./team.js"

export interface TeamRole {
  object_name: "team_user"
  id: string
  organization_id: string
  business_unit_id: string
  team_id: string
  user_id: string
  role: string
  team?: Team
}

export interface Account {
  object_name: "account"
  id: string
  name?: string
  organization_id: string
  display_name: string
  avatar_url: string
  gender: string
  first_name: string
  last_name: string
  area_code: string
  phone_number: string
  email: string
  language: string
  role: string
  status: string
  is_active: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
  team_roles: TeamRole[]
}
