export interface Board {
  object_name?: string
  id: string
  organization_id: string
  name: string
  description?: string
  workflow_id?: string
  hidden?: boolean
  team_ids?: string[]
  created_at: string
  updated_at: string
}

export interface BoardItem {
  object_name?: string
  id: string
  board_id: string
  fields: Record<string, unknown>
  created_at: string
  updated_at: string
}
