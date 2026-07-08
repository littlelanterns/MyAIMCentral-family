// PRD-43 WishLists — Gift Planning & In-Store Capture. TypeScript types for
// the three new Phase A tables (gift_claims, wishlist_share_links,
// gift_history — the latter two are Phase B UI scope but the shapes are
// declared now since the tables exist from Phase A's migration).

export type GiftClaimStatus = 'reserved' | 'purchased' | 'given'

export interface GiftClaim {
  id: string
  family_id: string
  list_item_id: string | null
  item_title_snapshot: string
  claimed_by_member_id: string | null
  claimant_label: string | null
  share_link_id: string | null
  status: GiftClaimStatus
  claimed_at: string
  released_at: string | null
  notes: string | null
  created_at: string
}

export interface WishlistShareLinkScope {
  occasions?: string[]
  item_ids?: string[]
  include_sizes: boolean
  sizes_text?: string
}

export interface WishlistShareLink {
  id: string
  family_id: string
  list_id: string
  created_by: string
  token_hash: string
  label: string
  display_name: string
  scope: WishlistShareLinkScope
  allow_reserve: boolean
  expires_at: string
  revoked_at: string | null
  view_count: number
  last_viewed_at: string | null
  created_at: string
}

export type GiftHistoryDirection = 'received' | 'given'

export interface GiftHistoryEntry {
  id: string
  family_id: string
  member_id: string
  direction: GiftHistoryDirection
  item_title: string
  counterparty_label: string | null
  counterparty_member_id: string | null
  occasion: string | null
  given_on: string | null
  source_list_item_id: string | null
  notes: string | null
  photo_url: string | null
  created_at: string
}

/** Suggested occasion chips (PRD §6.3) — free-vocabulary field, these are just starting suggestions. */
export const SUGGESTED_OCCASIONS = ['Christmas', 'Birthday', 'Easter', 'Just Because'] as const

/** wishlist-extract Edge Function response shapes (PRD §7.1) */
export interface WishlistExtractLinkResult {
  title: string | null
  image_url: string | null
  price: number | null
  currency: string | null
  domain: string | null
  notes: string | null
  confidence: 'meta' | 'ai' | 'none'
  crisis?: boolean
  response?: string
  ethics_declined?: boolean
  message?: string
}

export interface WishlistExtractPhotoResult {
  title: string | null
  notes: string | null
  confidence: 'ai' | 'none'
  crisis?: boolean
  response?: string
  ethics_declined?: boolean
}
