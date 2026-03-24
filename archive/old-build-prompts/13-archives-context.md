# Build Prompt 13: Archives & Context

## PRD Reference
- PRD-13: `prds/personal-growth/PRD-13-Archives-Context.md`

## Prerequisites
- Phase 07 (GuidingStars & BestIntentions) complete
- Phase 08 (InnerWorkings) complete
- Phase 09 (Journal & Smart Notepad) complete

## Objective
Build the Archives system that serves as the central context repository for LiLa and the platform. This includes the archive folder hierarchy for organizing context items, the context management interface with three-tier toggles (Always Include / Available / Never Include), faith preferences, context learning write-back (where LiLa learns from conversations and writes back to Archives), Privacy Filtered category handling, and context export. Archives are the backbone of personalized AI interactions across the platform.

## Database Work
Create tables:
- `archive_folders` — Hierarchical folder structure for organizing context items (parent_id for nesting)
- `archive_context_items` — Individual context entries with content, source, category, inclusion tier, member association
- `archive_member_settings` — Per-member archive preferences (default inclusion tier, auto-learn toggle, privacy level)
- `faith_preferences` — Faith/spirituality preferences that inform LiLa tone and content (denomination, comfort level, integration preference)
- `context_learning_dismissals` — Tracks context suggestions from LiLa that the user dismissed (prevents re-suggesting)

Enable RLS on all tables. Members manage their own context; mom can view all non-privacy-filtered items.

## Component Work
- Archive folder hierarchy — Tree view with create, rename, reorder, nest folders
- Context item management — CRUD for context entries with rich text, source attribution, categorization
- Three-tier toggle — Per-item inclusion control (Always Include / Available / Never Include) for AI context assembly
- Faith preferences panel — Set denomination, comfort level, how faith integrates with LiLa responses
- Context learning write-back — LiLa suggests context items from conversations; user approves/dismisses
- Privacy Filtered category — Special items visible only to their owner, excluded from View As and mom oversight
- Context export — Export archive contents as structured file (JSON/PDF)
- Archive search — Full-text search across all context items with folder/category filters
- Context assembly preview — Show what context LiLa would receive for a given conversation

## Edge Function Work
- None (context assembly happens in the existing LiLa Edge Function pipeline from Phase 06)

## Testing Checklist
- [ ] Archive folders support unlimited nesting depth
- [ ] Three-tier toggle correctly affects LiLa context assembly
- [ ] Context learning write-back suggests items from conversation and saves on approval
- [ ] Dismissed context suggestions do not resurface
- [ ] Privacy Filtered items are invisible to mom in View As mode
- [ ] Faith preferences influence LiLa response tone when enabled
- [ ] Context export produces valid structured output
- [ ] RLS prevents cross-family context access

## Definition of Done
- All PRD-13 MVP items checked off
- Context assembly pipeline integrates with three-tier system
- Privacy Filtered category enforced at RLS level
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
