export interface Notification {
  object_name?: string
  id: string
  organization_id: string
  user_id: string
  type: string
  content: Record<string, unknown>
  is_read: boolean
  created_at: string
}
