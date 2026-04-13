// PRD-15: Messages, Requests & Notifications — TypeScript Types

// ── Enums ──────────────────────────────────────────────────────────────────

export type SpaceType = 'direct' | 'group' | 'family' | 'content_corner' | 'out_of_nest'

export type SpaceMemberRole = 'member' | 'admin'

export type ThreadSourceType = 'manual' | 'request_discussion' | 'notepad_route' | 'system'

export type MessageType = 'user' | 'lila' | 'system' | 'content_corner_link'

export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'snoozed'

export type RequestRoutedTo = 'calendar' | 'tasks' | 'list' | 'acknowledged'

export type RequestSource = 'quick_request' | 'notepad_route' | 'mindsweep_auto' | 'homeschool_child_report' | 'financial_approval'

export type NotificationType =
  | 'new_message'
  | 'request_received'
  | 'request_outcome'
  | 'calendar_approved'
  | 'calendar_rejected'
  | 'calendar_reminder'
  | 'task_approval'
  | 'safety_alert'
  | 'victory_shared'
  | 'family_celebration'
  | 'lila_suggestion'
  | 'permission_change'
  | 'system'

export type NotificationCategory = 'messages' | 'requests' | 'calendar' | 'tasks' | 'safety' | 'lila'

export type NotificationDeliveryMethod = 'in_app' | 'email' | 'push' | 'email_and_push'

export type NotificationPriority = 'normal' | 'high'

export type ContentCornerViewingMode = 'browse' | 'locked'

// ── Conversation Spaces ────────────────────────────────────────────────────

export interface ConversationSpace {
  id: string
  family_id: string
  space_type: SpaceType
  name: string | null
  created_by: string
  is_pinned: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ConversationSpaceWithPreview extends ConversationSpace {
  last_message_preview?: string
  last_message_at?: string
  last_message_sender?: string
  unread_count?: number
  members?: ConversationSpaceMember[]
}

export interface ConversationSpaceMember {
  id: string
  space_id: string
  family_member_id: string
  role: SpaceMemberRole
  notifications_muted: boolean
  joined_at: string
  // Joined fields
  display_name?: string
  avatar_url?: string | null
  assigned_color?: string | null
  member_color?: string | null
}

// ── Conversation Threads ───────────────────────────────────────────────────

export interface ConversationThread {
  id: string
  space_id: string
  title: string | null
  started_by: string
  is_archived: boolean
  is_pinned: boolean
  source_type: ThreadSourceType
  source_reference_id: string | null
  last_message_at: string
  created_at: string
}

export interface ConversationThreadWithPreview extends ConversationThread {
  last_message_preview?: string
  last_message_sender?: string
  unread_count?: number
  space_name?: string
}

// ── Messages ───────────────────────────────────────────────────────────────

export interface Message {
  id: string
  thread_id: string
  sender_member_id: string | null
  message_type: MessageType
  content: string
  metadata: MessageMetadata
  reply_to_id: string | null
  is_edited: boolean
  edited_at: string | null
  created_at: string
}

export interface MessageMetadata {
  // Content Corner links
  url?: string
  preview_title?: string
  preview_image?: string
  preview_domain?: string
  thumbnail_url?: string
  domain?: string
  // System messages
  event_type?: string
  request_id?: string
  routed_to?: string
  // LiLa messages
  model_used?: string
  token_count?: number
  model?: string
  feature?: string
  type?: string
  [key: string]: unknown
}

export interface MessageWithSender extends Message {
  sender_display_name?: string
  sender_avatar_url?: string | null
  sender_assigned_color?: string | null
  sender_member_color?: string | null
  reply_to?: Message | null
}

// ── Message Read Status ────────────────────────────────────────────────────

export interface MessageReadStatus {
  id: string
  thread_id: string
  family_member_id: string
  last_read_message_id: string | null
  last_read_at: string | null
}

// ── Messaging Settings ─────────────────────────────────────────────────────

export interface MessagingSettings {
  id: string
  family_id: string
  communication_guidelines: string
  content_corner_viewing_mode: ContentCornerViewingMode
  content_corner_locked_until: string | null
  content_corner_who_can_add: string[]
  created_at: string
  updated_at: string
}

// ── Member Messaging Permissions ───────────────────────────────────────────

export interface MemberMessagingPermission {
  id: string
  family_id: string
  member_id: string
  can_message_member_id: string
  created_at: string
}

// ── Message Coaching Settings ──────────────────────────────────────────────

export interface MessageCoachingSetting {
  id: string
  family_id: string
  family_member_id: string
  is_enabled: boolean
  custom_prompt: string | null
  created_at: string
  updated_at: string
}

// ── Family Requests ────────────────────────────────────────────────────────

export interface FamilyRequest {
  id: string
  family_id: string
  sender_member_id: string
  recipient_member_id: string
  title: string
  details: string | null
  when_text: string | null
  status: RequestStatus
  routed_to: RequestRoutedTo | null
  routed_reference_id: string | null
  decline_note: string | null
  snoozed_until: string | null
  discussion_thread_id: string | null
  source: RequestSource
  source_reference_id: string | null
  processed_at: string | null
  processed_by: string | null
  created_at: string
  updated_at: string
}

export interface FamilyRequestWithSender extends FamilyRequest {
  sender_display_name?: string
  sender_avatar_url?: string | null
  sender_assigned_color?: string | null
  sender_member_color?: string | null
}

// ── Notifications ──────────────────────────────────────────────────────────

export interface Notification {
  id: string
  family_id: string
  recipient_member_id: string
  notification_type: NotificationType
  category: NotificationCategory
  title: string
  body: string | null
  source_type: string | null
  source_reference_id: string | null
  action_url: string | null
  is_read: boolean
  read_at: string | null
  is_dismissed: boolean
  delivery_method: NotificationDeliveryMethod
  delivered_at: string | null
  email_sent_at: string | null
  priority: NotificationPriority
  created_at: string
}

// ── Notification Preferences ───────────────────────────────────────────────

export interface NotificationPreference {
  id: string
  family_id: string
  family_member_id: string
  category: NotificationCategory
  in_app_enabled: boolean
  push_enabled: boolean
  do_not_disturb: boolean
  created_at: string
  updated_at: string
}

// ── Create/Update DTOs ─────────────────────────────────────────────────────

export interface CreateRequestData {
  title: string
  recipient_member_id: string
  details?: string
  when_text?: string
  source?: RequestSource
  source_reference_id?: string
}

export interface CreateNotificationData {
  family_id: string
  recipient_member_id: string
  notification_type: NotificationType
  category: NotificationCategory
  title: string
  body?: string
  source_type?: string
  source_reference_id?: string
  action_url?: string
  priority?: NotificationPriority
}

export interface CreateMessageData {
  thread_id: string
  content: string
  message_type?: MessageType
  metadata?: MessageMetadata
  reply_to_id?: string
}

export interface CreateSpaceData {
  family_id: string
  space_type: SpaceType
  name?: string
  member_ids: string[]
}

export interface CreateThreadData {
  space_id: string
  content: string
  source_type?: ThreadSourceType
  source_reference_id?: string
}
