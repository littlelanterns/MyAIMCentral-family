# Build Prompt 25: AI Vault Browse & Admin

## PRD Reference
- PRD-21A: `prds/ai-vault/PRD-21A-AI-Vault-Browse-Content-Delivery.md`
- PRD-21B: `prds/ai-vault/PRD-21B-AI-Vault-Admin-Content-Management.md`

## Prerequisites
- Phase 06 (LiLa Core AI System) complete
- Phase 23 (LiLa Optimizer) complete

## Objective
Build the AI Vault as a curated content library with 6 content types for browsing and consumption, subscription tier gating to control access by plan level, NEW badges for first-time content discovery, and 8 content protection measures to prevent unauthorized copying/sharing. Build the personal prompt library where users save and organize their own prompts with "Optimize with LiLa" integration. Build the admin content dashboard for managing vault content including CRUD operations, category management, and a prompt pack editor. Set up Supabase Storage buckets for vault-thumbnails and vault-prompt-images.

## Database Work
Create tables:
- `vault_items` — Content items with type (article, prompt-pack, tool, guide, template, resource), title, description, content body, tier requirement, category, status (draft/published/archived)
- `vault_categories` — Hierarchical categories for organizing vault content
- `vault_prompt_entries` — Individual prompts within prompt packs with text, variables, instructions, order
- `vault_collection_items` — Curated collections grouping related vault items
- `vault_user_bookmarks` — User-saved vault items for quick access
- `vault_user_progress` — Tracks user progress through multi-step content (guides, courses)
- `vault_user_visits` — Records user visits to vault items for analytics and recommendation
- `vault_first_sightings` — Tracks first time a user sees an item (for NEW badge logic)
- `vault_tool_sessions` — Records of interactive tool usage within vault items
- `vault_copy_events` — Audit log of copy/share attempts for content protection monitoring
- `user_saved_prompts` — Personal prompt library entries with text, category, tags, optimization history
- `vault_content_requests` — User requests for new content types or topics

Enable RLS on all tables. Users access vault items based on their subscription tier; admin has full CRUD.

## Component Work
- Vault browse page — Grid/list view of vault content with category filtering, search, tier badges
- Content type renderers — Specialized views for each of 6 content types (article reader, prompt pack viewer, tool launcher, guide stepper, template preview, resource downloader)
- Tier gating — Lock/unlock indicators, upgrade prompts for content above user's tier
- NEW badges — Visual indicator on first-seen content, clears after viewing
- Content protection (8 measures) — Disable text selection, prevent right-click, watermark overlay, copy event logging, screenshot deterrence CSS, print prevention, share link restrictions, session-based access tokens
- Personal prompt library — Browse, create, edit, organize saved prompts with tags and categories
- "Optimize with LiLa" — Button on saved prompts that sends to LiLa Optimizer for enhancement
- Admin content dashboard — Full CRUD interface for vault items with preview, publish workflow, bulk operations
- Category manager (admin) — Create, edit, reorder, nest content categories
- Prompt pack editor (admin) — Specialized editor for creating prompt packs with individual prompt entries, variables, and instructions
- Supabase Storage setup — Create vault-thumbnails and vault-prompt-images buckets with appropriate access policies

## Edge Function Work
- `vault-access-check` — Validates user tier against content requirements, returns access decision with upgrade path if denied

## Testing Checklist
- [ ] Vault browse page displays content filtered by user's subscription tier
- [ ] All 6 content types render correctly in their specialized viewers
- [ ] NEW badges appear on first visit and clear after viewing
- [ ] Content protection measures prevent casual copying (text selection disabled, right-click blocked)
- [ ] Personal prompt library supports CRUD with "Optimize with LiLa" integration
- [ ] Admin dashboard allows creating, editing, publishing, and archiving vault content
- [ ] Category manager supports hierarchical category management
- [ ] Prompt pack editor creates packs with multiple prompt entries and variables
- [ ] Supabase Storage buckets accept and serve thumbnail and prompt images

## Definition of Done
- All PRD-21A and PRD-21B MVP items checked off
- 6 content types browsable and consumable with tier gating
- Content protection measures active and copy events logging
- Admin content management fully operational
- Storage buckets configured with appropriate RLS policies
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
