# Build Prompt 34: Safety Monitoring

## PRD Reference
- PRD-30: `prds/platform-complete/PRD-30-Safety-Monitoring.md`
- Addendum: `prds/addenda/PRD-30-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 06 (LiLa Core AI) complete
- Phase 16 (Meetings) complete

## Objective
Build the two-layer safety detection system: synchronous keyword matching plus async Haiku classification on LiLa messages. Implement 3 severity tiers (Concern/Warning/Critical), 3 locked categories (self_harm/abuse/sexual_predatory always High), child monitoring enabled by default, weekly pattern summary narratives, admin keyword CRUD, safety resources per category, and safety alerts that bypass DND. Adds `safety_scanned` flag to `lila_messages`. This is a Medium phase.

## Database Work
Create tables:
- `safety_monitoring_configs` — Family-level safety monitoring settings (enabled categories, notification preferences, child monitoring defaults)
- `safety_sensitivity_configs` — Per-category sensitivity thresholds and override settings
- `safety_notification_recipients` — Configured recipients for safety alerts per family (defaults to mom)
- `safety_flags` — Individual safety flag records with message reference, detected category, severity, classification source (keyword/AI), resolution status
- `safety_keywords` — Admin-managed keyword lists per category for synchronous matching layer
- `safety_resources` — Help resources linked to safety categories (hotline numbers, websites, guidance text)
- `safety_pattern_summaries` — Weekly pattern summary narratives generated from aggregated safety flags

Alter existing tables:
- `lila_messages` — Add `safety_scanned` boolean flag (default false)

Enable RLS on all tables. Safety flags visible to mom and admin only. Safety resources are system-level read-only. Children never see their own safety flags.

## Edge Function Work
- `safety-classify` — Haiku-based async classification of flagged messages; determines category, severity, and confidence score

## Component Work
### Detection Pipeline
- Keyword matching layer — Synchronous scan of every LiLa message against safety_keywords; immediate flag on match
- Haiku classification layer — Async AI classification of keyword-matched messages for category and severity refinement
- safety_scanned flag — Mark messages as scanned after processing both layers

### Severity & Categories
- 3 severity tiers — Concern (low, logged only), Warning (medium, notification sent), Critical (high, immediate alert bypassing DND)
- 3 locked categories — self_harm, abuse, sexual_predatory are always classified as High severity and cannot be downgraded
- Child monitoring default — Children are monitored by default; mom can adjust but cannot fully disable locked categories

### Notifications & Alerts
- Safety alert delivery — Notifications to configured recipients based on severity tier
- DND bypass — Critical safety alerts bypass Do Not Disturb settings
- Alert detail view — View flagged message context, classification details, and recommended resources

### Administration
- Admin keyword CRUD — Add, edit, remove keywords per safety category
- Safety resources management — Configure help resources (hotlines, websites, text) per category
- Weekly pattern summary — Auto-generated narrative summarizing safety flag patterns over the past week
- Safety monitoring dashboard — Overview of flags by category, severity, and time period

## Testing Checklist
- [ ] Keyword matching detects configured keywords in LiLa messages synchronously
- [ ] Haiku classification runs async after keyword match and refines category/severity
- [ ] safety_scanned flag set to true after processing
- [ ] Concern-level flags are logged but do not trigger notifications
- [ ] Warning-level flags trigger notifications to configured recipients
- [ ] Critical-level flags trigger immediate alerts that bypass DND
- [ ] Locked categories (self_harm, abuse, sexual_predatory) always classify as High
- [ ] Locked categories cannot be downgraded or disabled
- [ ] Child members are monitored by default
- [ ] Admin can add, edit, and remove safety keywords
- [ ] Safety resources display per category on alert detail
- [ ] Weekly pattern summary generates accurate narrative
- [ ] Children cannot see their own safety flags
- [ ] RLS restricts safety flag access to mom and admin roles

## Definition of Done
- All PRD-30 MVP items checked off
- Two-layer detection pipeline operational (keyword + Haiku)
- All 3 severity tiers functioning with correct notification behavior
- 3 locked categories enforced at High severity
- Safety alerts bypassing DND for Critical tier
- Weekly pattern summary generating
- Admin keyword CRUD and safety resources management working
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
