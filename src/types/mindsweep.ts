// PRD-17B: MindSweep types

export type AggressivenessMode = 'always_ask' | 'trust_obvious' | 'full_autopilot';

export type MindSweepConfidence = 'high' | 'medium' | 'low';

export type AlwaysReviewRule =
  | 'emotional_children'
  | 'relationship_dynamics'
  | 'behavioral_notes'
  | 'financial'
  | 'health_medical'
  | 'outside_people';

export type HoldingContentType = 'voice_short' | 'voice_long' | 'text' | 'scan_extracted' | 'link' | 'email';

export type HoldingSourceChannel =
  | 'quick_capture'
  | 'routing_strip'
  | 'share_to_app'
  | 'email_forward'
  | 'lila_conversation';

export type SweepEventSourceChannel =
  | 'routing_strip'
  | 'quick_capture'
  | 'share_to_app'
  | 'email_forward'
  | 'auto_sweep';

export type SweepInputType = 'voice' | 'text' | 'image' | 'link' | 'email' | 'mixed';

export type ApprovalAction = 'approved_unchanged' | 'approved_edited' | 'rerouted' | 'dismissed';

// Digest section type for PRD-18 rhythms integration (stub — PRD-18 not yet built)
// When rhythms are built, register 'mindsweep_digest' as section type #28.
// Renderer shows: items swept, destinations routed to, confidence stats.
export const MINDSWEEP_DIGEST_SECTION_KEY = 'mindsweep_digest' as const;

// ── Database Records ──

export interface MindSweepSettings {
  id: string;
  family_id: string;
  member_id: string;
  aggressiveness: AggressivenessMode;
  always_review_rules: AlwaysReviewRule[];
  custom_review_rules: string[];
  auto_sweep_shared: boolean;
  auto_sweep_time: string; // TIME as 'HH:MM'
  email_process_immediately: boolean;
  high_accuracy_voice: boolean;
  digest_morning: boolean;
  digest_evening: boolean;
  digest_weekly: boolean;
  created_at: string;
  updated_at: string;
}

export interface MindSweepHoldingItem {
  id: string;
  family_id: string;
  member_id: string;
  content: string;
  content_type: HoldingContentType;
  source_channel: HoldingSourceChannel;
  audio_blob_local: boolean;
  link_url: string | null;
  captured_at: string;
  processed_at: string | null;
  sweep_event_id: string | null;
  created_at: string;
}

export interface MindSweepEvent {
  id: string;
  family_id: string;
  member_id: string;
  source_channel: SweepEventSourceChannel;
  input_type: SweepInputType;
  raw_content_preview: string | null;
  items_extracted: number;
  items_auto_routed: number;
  items_queued: number;
  items_direct_routed: number;
  aggressiveness_at_time: string;
  processing_cost_cents: number;
  created_at: string;
}

export interface MindSweepApprovalPattern {
  id: string;
  family_id: string;
  member_id: string;
  content_category: string;
  action_taken: ApprovalAction;
  suggested_destination: string | null;
  actual_destination: string | null;
  created_at: string;
}

// ── Edge Function Request/Response ──

export interface MindSweepSortRequest {
  items: MindSweepSortItem[];
  family_id: string;
  member_id: string;
  aggressiveness: AggressivenessMode;
  always_review_rules: AlwaysReviewRule[];
  custom_review_rules: string[];
  source_channel: SweepEventSourceChannel;
  input_type: SweepInputType;
  family_member_names: FamilyMemberName[];
}

export interface MindSweepSortItem {
  id?: string; // holding item id if from holding queue
  content: string;
  content_type: HoldingContentType;
}

export interface FamilyMemberName {
  id: string;
  display_name: string;
  nicknames?: string[];
}

export interface MindSweepSortResponse {
  event_id: string;
  results: MindSweepSortResult[];
  totals: {
    items_extracted: number;
    items_auto_routed: number;
    items_queued: number;
    items_direct_routed: number;
    items_classified_by_embedding: number;
    items_classified_by_llm: number;
    processing_cost_cents: number;
  };
}

export interface MindSweepSortResult {
  original_content: string;
  extracted_text: string;
  category: string;
  destination: string;
  destination_detail?: Record<string, unknown>;
  confidence: MindSweepConfidence | 'review_required';
  classified_by: 'embedding' | 'llm_batch';
  sensitivity_flag: boolean;
  sensitivity_reason?: string;
  cross_member?: string; // family member name detected
  cross_member_id?: string; // family member ID
  cross_member_action?: 'suggest_route' | 'note_reference';
}
