# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.

## Status: ACTIVE — UX Overhaul Session 3 + PRD-14B Calendar

### PRD File
`prds/dashboards/PRD-14B-Calendar.md`

### Addenda Read
- `prds/addenda/PRD-14B-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-14-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-35-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-08-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-14D-Cross-PRD-Impact-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-14B-Calendar.md`

### Superseding Spec
`specs/Universal-Scheduler-Calendar-Consolidated-Update.md` — founder-approved consolidated decisions that override any conflicts in other specs.

### Session Items (UX Overhaul Session 3)
1. **QuickTasks Strip Layout Fix** — COMPLETE. Hidden scrollbar, fade gradient, scroll arrows, usage sorting.
2. **Calendar System (PRD-14B)** — IN PROGRESS. Pre-build complete. Migration needs regeneration per consolidated spec.
3. **Spotlight Search (Cmd+K)** — PENDING.
4. **Tooltip Audit** — PENDING.

### Schema Reconciliation (Founder-Confirmed)
- Date storage: separate `event_date DATE` + `start_time TIME` + `end_time TIME` + `end_date DATE`
- Category: `category_id UUID` FK to `event_categories.id` (not slug text)
- 11 system categories: Learning, Sports, Medical, Family, Social, Faith, Music & Arts, Travel, Celebration, Work, Other
- Recurrence: `recurrence_details JSONB` (RRULE) + `recurrence_rule TEXT` (quick-filter). No individual recurrence columns.
- `items_to_bring JSONB` [{text, checked, ai_suggested}]
- `transportation_notes TEXT`
- `reminder_minutes INTEGER[]`
- `default_drive_time_minutes DEFAULT 30`
- `required_intake_fields JSONB DEFAULT '[]'` in calendar_settings
- `event_categories.family_id` nullable (NULL = system)
- Universal Scheduler redesign: radio-button primary interface, MiniCalendarPicker shared component

### Stubs (Not Building This Phase)
- Image-to-event OCR (Edge Function)
- LiLa guided event creation
- Universal Queue Modal Calendar tab (approval in DateDetailModal)
- Calendar context for LiLa
- Guided/Play shell calendar variants
- Google Calendar sync
- Push notification reminders
- "Send to Calendar" from Notepad

---

*PRD-06 (Guiding Stars & Best Intentions) + PRD-07 (InnerWorkings repair) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-06-Guiding-Stars-Best-Intentions.md` and `claude/feature-decisions/PRD-07-InnerWorkings-repair.md`.*

*PRD-10 Phase A (Widgets, Trackers & Dashboard Layout) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-10-Widgets-Trackers-Dashboard-Layout.md`.*

*PRD-13 (Archives & Context) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-13-Archives-Context.md`. 94 requirements: 80 wired, 14 stubbed, 0 missing.*

*Bug fixes (View As modal, Hub navigation, Notepad close) completed 2026-03-25. No new stubs.*

*PRD-21A (AI Vault Browse & Content Delivery) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-21A-AI-Vault-Browse.md`. 88 requirements: 74 wired, 14 stubbed, 0 missing. 12 new tables, 3 content items loaded, sidebar simplified to Lucide icons.*

*PRD-21 (Communication & Relationship Tools) completed 2026-03-26. Verification archived to `claude/feature-decisions/PRD-21-Communication-Relationship-Tools.md`. 42 requirements: 32 wired, 10 stubbed, 0 missing. 8 Edge Functions deployed, 4 new tables, AI Toolbox sidebar + QuickTasks buttons, 198 condensed intelligence items powering system prompts.*

*PRD-34 (ThoughtSift — Decision & Thinking Tools) completed 2026-03-26. 3 sub-phases: 34A (Foundation + Translator + Decision Guide), 34B (Perspective Shifter + Mediator), 34C (Board of Directors). 6 tables, 5 Edge Functions, 18 personas + 17 lenses + 15 frameworks seeded, 5 vault items. Total: 129 wired, 22 stubbed, 0 missing across all sub-phases.*

*UX Overhaul Session 1 completed 2026-03-28. Density system, z-index layers, Card size prop, ModalV2 system (8 files), ModalManagerProvider, TaskCreationModal redesign.*

*UX Overhaul Session 2 completed 2026-03-28. SKILL.md updated to 14 rules, hardcoded color audit (0 remaining in non-auth files), ThemeSelector compacted to 280px, all sidebar sections collapsible with route-aware expand, QuickCreate component (strip pill + mobile FAB), density-compact applied to Studio/Dashboard/Vault.*

*UX Overhaul Session 3 (partial) completed 2026-03-28. Calendar visual overhaul: v1-style warm card columns (widget), square month cells with event title labels (page), gradient headers on both, full month grid in MonthViewModal with legend. ThemeSelector btn-chip fix for Cozy vibe S/M/L/XL. Modern vibe PullTab visibility fix (6px→120x24px). Font scale CSS dedup fix (S/M/L/XL now in correct order). EventCreationModal wired from dashboard DateDetailModal.*

---
