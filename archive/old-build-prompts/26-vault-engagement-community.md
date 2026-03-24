# Build Prompt 26: AI Vault Engagement & Community

## PRD Reference
- PRD-21C: `prds/ai-vault/PRD-21C-AI-Vault-Engagement-Community.md`
- Addendum: `prds/addenda/PRD-21C-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 25 (AI Vault Admin & Content Management) complete

## Objective
Build community engagement features for the AI Vault: hearts, threaded comments with Haiku auto-moderation, community reporting (3 reports = auto-hide), satisfaction signals (thumbs up/down after 60 seconds of viewing), moderation queue with Flagged/Hidden/Reported/History tabs, content policy dashboard, and recommendation rows (4 types). This is a Medium phase.

## Database Work
Create tables:
- `vault_engagement` — Hearts and engagement tracking per user per content item
- `vault_comments` — Threaded comments with max depth of 3, tied to vault content items
- `vault_comment_reports` — Community report records; 3 reports on a comment triggers auto-hide
- `vault_moderation_log` — Audit trail of moderation actions (approve, hide, delete, escalate) with actor and reason
- `vault_satisfaction_signals` — Thumbs up/down signals collected after 60 seconds of content viewing
- `vault_engagement_config` — Admin-configurable engagement settings (report threshold, signal delay, recommendation weights)

Enable RLS on all tables. Hearts and comments scoped to authenticated users. Moderation log restricted to admin/mom roles. Satisfaction signals are anonymous aggregates visible to admins only.

## Component Work
- Heart button — Toggle heart on vault content items, with count display
- Threaded comments — Comment input, reply threading (max depth 3), edit/delete own comments
- Haiku auto-moderation — Each new comment is classified by Haiku (approve/flag); flagged comments held for review
- Community reporting — Report button on comments, 3 distinct reports = auto-hide with moderation log entry
- Satisfaction signals — Thumbs up/down prompt appears after 60 seconds of content viewing; one signal per user per item
- Moderation queue — Admin view with 4 tabs: Flagged (AI-flagged pending review), Hidden (auto-hidden by reports), Reported (user-reported pending review), History (past moderation actions)
- Content policy dashboard — Admin view of engagement metrics, policy configuration, moderation statistics
- Recommendation rows — 4 recommendation types (trending, new, personalized, category-based) displayed as horizontal scrollable rows

## Edge Function Work
- `vault-moderate-comment` — Calls Haiku to classify comment content (approve/flag) before display

## Testing Checklist
- [ ] Heart toggle works and count updates in real time
- [ ] Comments thread correctly up to depth 3; depth 4 replies are blocked
- [ ] Haiku auto-moderation flags inappropriate comments before display
- [ ] 3 reports on a comment triggers auto-hide
- [ ] Satisfaction signal prompt appears after 60 seconds of viewing
- [ ] Satisfaction signal limited to one per user per content item
- [ ] Moderation queue tabs filter correctly (Flagged, Hidden, Reported, History)
- [ ] Content policy dashboard displays engagement metrics
- [ ] Recommendation rows render 4 distinct types with horizontal scroll
- [ ] RLS prevents non-admin access to moderation log and config

## Definition of Done
- All PRD-21C engagement MVP items checked off
- Haiku auto-moderation pipeline operational
- Community reporting with auto-hide at threshold functional
- Satisfaction signals collecting after 60-second delay
- Moderation queue fully functional with all 4 tabs
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
