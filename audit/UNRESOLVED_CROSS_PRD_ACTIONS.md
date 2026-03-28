# Unresolved Cross-PRD Actions

> **Generated from full PRD audit 2026-03-23**
> **Total action items across all addenda: 813+**
> **Status: ALL are technically unresolved** — addenda specify changes but target PRDs were not updated.

## How to Use This Document

The Cross-PRD Impact Addenda are the authoritative change records. During build, when implementing any PRD:

1. Read the PRD itself
2. Read ALL addenda that target that PRD (listed below)
3. Apply changes specified in the addenda

This document organizes by **target PRD** so you can quickly find all changes that need to be applied.

---

## PRD-01 (Auth & Family Setup) — 15+ actions

### Schema Changes Needed
- Add `calendar_color TEXT NULL` to `family_members` (PRD-14B Addendum #3)
- Add `sweep_email_address TEXT NULL`, `sweep_email_enabled BOOLEAN DEFAULT false` to `families` (PRD-17B Addendum #1)
- Add `founding_onboarding_complete`, `founding_onboarding_grace_deadline`, `founding_family_lost_at` to `families` (PRD-31 Addendum #3)
- Add 6 gamification columns to `family_members` (PRD-24 Addendum #1)
- Replace `feature_access` table with `feature_access_v2` (PRD-31 Addendum #4)
- Update `handle_new_user()` trigger for onboarding milestones (PRD-31 Addendum #5)
- Auto-create `safety_monitoring_configs` on member creation (PRD-30 Addendum #11)
- Auto-create `mindsweep_settings` on member setup (PRD-17B Addendum #2)
- Auto-create `gamification_configs` on member creation (PRD-24 Addendum #2)

### Spec/Doc Changes Needed
- Note `out_of_nest_members` account pattern (PRD-15 Addendum #1-3)
- Update login resolution for `member_emails` (PRD-22 Addendum #1)
- Note Family Feed as recommended OON entry point (PRD-37 Addendum #1)

### Source Addenda
PRD-14B, PRD-15, PRD-17B, PRD-22, PRD-24, PRD-27, PRD-30, PRD-31, PRD-37/28B

---

## PRD-02 (Permissions & Access Control) — 35+ actions

### Feature Key Registrations Needed
- 4 calendar keys (PRD-14B Addendum #4)
- 4 hub keys (PRD-14D Addendum #19)
- 11 messaging keys (PRD-15 Addendum #4)
- 5 meeting keys (PRD-16 Addendum #14)
- 7 gamification keys (PRD-24 Addendum #6)
- 2 safe harbor keys (PRD-20 Addendum #3)
- 5 caregiver keys (PRD-27 Addendum #11)

### Schema Changes Needed
- Replace `shift_schedules` with `access_schedules` (PRD-35 Addendum #1)
- Add `system_admin`, `analytics_admin`, `feedback_admin` to `staff_permissions` (PRD-32 Addendum #1)
- Rewrite `useCanAccess()` for three-layer model (PRD-31 Addendum #9)
- Create `member_feature_toggles` table (PRD-31 Addendum #11)

### Spec Changes Needed
- Add journal category-level visibility pattern (PRD-08 Addendum #9)
- Add `is_private_note` exclusion to permission engine (PRD-19 Addendum #2)
- Safe Harbor transparency exception (PRD-20 Addendum #1)
- Permission level profiles (PRD-31 Permission Matrix Addendum)

### Source Addenda
PRD-08, PRD-14B, PRD-14D, PRD-15, PRD-16, PRD-17B, PRD-19, PRD-20, PRD-24, PRD-27, PRD-28, PRD-30, PRD-31, PRD-32/32A, PRD-34, PRD-35

---

## PRD-04 (Shell Routing & Layouts) — 40+ actions

### Routing Updates Needed
- Add Calendar to sidebar (PRD-14B Addendum #6)
- Add Messages to sidebar (PRD-15 Addendum #8)
- Add Meetings to sidebar (PRD-16 Addendum #17)
- Add AI Toolbox section (PRD-21 Addendum #2)
- Add AI Vault to sidebar (PRD-21A Addendum #1)
- Add Feeds to sidebar (PRD-37 Addendum #3)
- Add Reflections/Rhythms to sidebar (PRD-18 Addendum #22-23)
- Add `/admin` routes (PRD-21B Addendum #3)

### QuickTasks Updates
- Add "Review Queue" (PRD-14B Addendum #7)
- Add MindSweep button (PRD-17B Addendum #5)
- Add "Request" option (PRD-15 Addendum #11)
- Add 3 relationship tool buttons (PRD-21 Addendum #1)

### Other Updates
- Perspective switcher extended to Dad/Teen (PRD-14D Addendum #1)
- Notification bell icon in header (PRD-15 Addendum #9)
- Special Adult → CaregiverLayout (PRD-27 Addendum #1)
- Timer bubble z-index layer (PRD-36 Addendum #10)
- Background image rendering layers (PRD-24A/24B Addenda)
- Guided shell bottom nav: Home|Tasks|Write|Victories|Progress (PRD-25 Addendum #1)

### Source Addenda
PRD-08, PRD-14, PRD-14B, PRD-14D, PRD-15, PRD-16, PRD-17B, PRD-18, PRD-21, PRD-21A, PRD-21B, PRD-22, PRD-24, PRD-24A, PRD-24B, PRD-25, PRD-26, PRD-27, PRD-28, PRD-32/32A, PRD-36, PRD-37/28B

---

## PRD-05 (LiLa Core AI System) — 50+ actions

### Guided Mode Registrations Needed
- `calendar_event_create` (PRD-14B Addendum #8)
- `meeting` with subtypes (PRD-16 Addendum #4)
- `family_context_interview` (PRD-19 Addendum #6)
- 4 safe harbor modes (PRD-20 Addendum #4)
- `book_discuss`, `library_ask` (PRD-23 Addendum #1)
- 4 BigPlans modes (PRD-29 Addendum #1)
- 5 ThoughtSift modes replacing `thoughtsift` placeholder (PRD-34 Addendum #1-2)
- `guided_homework_help`, `guided_communication_coach` (PRD-25 Addendum #25)
- `homeschool_report_generation`, `homeschool_bulk_summary` (PRD-37/28B Addendum #6)

### Schema Changes Needed
- Add `is_safe_harbor` to `lila_conversations` (PRD-20 Addendum #5)
- Add `vault_item_id` to `lila_conversations` (PRD-21A Addendum #5)
- Add `safety_scanned` to `lila_messages` (PRD-30 Addendum #1)
- Add `container_preference` to guided mode registry (PRD-21 Addendum #4)

### Context Assembly Updates Needed
- Add Notepad context source (PRD-08 Addendum #1)
- Add calendar events (PRD-14B Addendum #9)
- Add family communication guidelines (PRD-15 Addendum #12)
- Add BookShelf extraction tables (PRD-23 Addendum #2)
- Add active plans (PRD-29 Addendum #3)
- Add overlay context fields (PRD-24A Addendum #16)
- Add `lila_member_preferences` metadata (PRD-22 Addendum #13)

### Source Addenda
PRD-08, PRD-14B, PRD-15, PRD-16, PRD-17B, PRD-18, PRD-19, PRD-20, PRD-21, PRD-21A, PRD-21B, PRD-21C, PRD-22, PRD-23, PRD-24A, PRD-25, PRD-29, PRD-30, PRD-32/32A, PRD-34, PRD-37/28B

---

## PRD-08 (Journal + Smart Notepad) — 15+ actions

### Schema Changes Needed
- Add `tags TEXT[]` with GIN index to `journal_entries` (PRD-18 Addendum #1)
- Add `related_plan_id` to `journal_entries` (PRD-29 Addendum #6)

### Routing Destination Updates
- Add Family Feed and Homeschool Portfolio to Send To grid (PRD-37/28B Addendum #9)
- Add BigPlans as RoutingStrip destination (PRD-29 Addendum #8)
- Add MindSweep tile (PRD-17B Addendum #10)
- Add Request to Send To grid (PRD-15 Addendum #18)

### Stub Status Updates
- Calendar routing WIRED (PRD-14B Addendum #11)
- Agenda routing WIRED (PRD-16 Addendum #1)
- Message send WIRED (PRD-15 Addendum #16-17)
- Meeting notes entry_type added (PRD-16 Addendum #2-3)

### Source Addenda
PRD-14B, PRD-15, PRD-16, PRD-17B, PRD-18, PRD-25, PRD-29, PRD-35, PRD-37/28B

---

## PRD-09A (Tasks) — 20+ actions

### Schema Changes Needed
- Add `points_override INTEGER NULL` (PRD-24 Addendum #12)
- Add `time_tracking_enabled BOOLEAN DEFAULT false` (PRD-36 Addendum #1)
- Add `time_threshold_minutes INTEGER NULL` (PRD-36 Addendum #2)
- Remove `task_rewards` table (superseded by PRD-24 gamification pipeline) (PRD-24 Addendum #11)
- Expand `recurrence_rule` enum with 'yearly', 'completion_dependent', 'custody' (PRD-35 Addendum #11)
- Upgrade `recurrence_details` to RRULE JSONB format (PRD-35 Addendum #12)

### Source Addenda
PRD-14B, PRD-15, PRD-17B, PRD-24, PRD-26, PRD-28, PRD-29, PRD-35, PRD-36

---

## PRD-09B (Lists & Studio) — 10+ actions

### Schema Changes Needed
- Add 5 columns to `list_items` (PRD-24 Addendum #17)
- Add 3 columns to `lists` (PRD-24 Addendum #18)
- Rename `reveal_visual` → `reveal_type` (PRD-24B Addendum #18)

### Source Addenda
PRD-24, PRD-24B, PRD-26

---

## PRD-10 (Widgets) — 25+ actions

### Widget Type Registrations Needed
- 6 Hub-specific widgets (PRD-14D Addendum #23)
- Treasure Box, Points Dashboard, Family Leaderboard (PRD-24 Addendum #22-24)
- Collection View, Boss HP Bar, Bingo Card, Evolution Creature, Passport Progress (PRD-24A Addendum #21)
- Log Learning widget (PRD-28 Addendum #6)
- Vault Recommendations widget (PRD-21A Addendum #15)
- AI Actions This Month widget (PRD-31 Addendum #19)
- Recent Moments widget (PRD-37/28B Addendum #19)

### Source Addenda
PRD-14, PRD-14D, PRD-21A, PRD-24, PRD-24A, PRD-24B, PRD-28, PRD-31, PRD-36, PRD-37/28B

---

## PRD-11 (Victory Recorder) — 15+ actions

### Enum Additions to `victories.source` Needed
- `'reflection_routed'` (PRD-18 Addendum #9)
- `'homeschool_logged'` (PRD-28 Addendum #15)
- `'plan_completed'`, `'milestone_completed'` (PRD-29 Addendum #18)
- `'family_feed'` (PRD-37/28B Addendum #17)
- `'bookshelf'` (PRD-23 Addendum #15)

### Source Addenda
PRD-14D, PRD-18, PRD-21C, PRD-23, PRD-24, PRD-24A, PRD-25, PRD-26, PRD-28, PRD-29, PRD-37/28B

---

## PRD-15 (Messages & Notifications) — 30+ actions

### Notification Type Additions Needed
- 6 gamification types (PRD-24 Addendum #34)
- 8 overlay types (PRD-24A Addendum #28)
- `safety_flag` (PRD-30 Addendum #5)
- `timer_idle_reminder`, `timer_auto_paused` (PRD-36 Addendum #12)
- `reporting_reminder`, `family_feed_post` (PRD-37/28B Addendum #23-24)
- `comment_reply` (PRD-21C Addendum #19)
- 3 meeting types (PRD-16 Addendum #11)

### Schema Changes Needed
- Add `phone_number`, `notification_methods` to `out_of_nest_members` (PRD-22 Addendum #23)
- Add `'caregiver'` to `conversation_threads.thread_type` (PRD-27 Addendum #15)

### Source Addenda
PRD-14B, PRD-14D, PRD-16, PRD-17B, PRD-21C, PRD-22, PRD-24, PRD-24A, PRD-25, PRD-26, PRD-27, PRD-30, PRD-36, PRD-37/28B

---

## PRD-22 (Settings) — 25+ actions

### New Settings Categories Needed
- MindSweep settings (PRD-17B Addendum #23)
- Gamification settings (PRD-24 Addendum #41)
- Safety Monitoring (PRD-30 Addendum #9)
- Timer Settings (PRD-36 Addendum #14)
- Feed Settings (PRD-37/28B Addendum #34)
- Allowance & Finances (PRD-28 Addendum #12)
- Feedback section (PRD-32/32A Addendum #12)
- Homeschool Configuration (PRD-37/28B Addendum #33)

### Source Addenda
PRD-17B, PRD-21C, PRD-24, PRD-24A, PRD-25, PRD-26, PRD-28, PRD-30, PRD-36, PRD-37/28B, PRD-32/32A

---

## Other Target PRDs (summarized)

| Target PRD | Action Count | Key Changes |
|------------|-------------|-------------|
| PRD-03 (Design) | ~10 | Remove Name Packs, background celebration tokens, breathing glow |
| PRD-06 (Guiding Stars) | ~8 | Add `'bookshelf'` and `'bigplans'` source values |
| PRD-13 (Archives) | ~10 | Multiple column additions from PRD-19, PRD-21A |
| PRD-14 (Dashboard) | ~20 | Perspective switcher updates, section keys, rendering layers |
| PRD-14B (Calendar) | ~10 | `show_on_hub`, meeting schedule linkage, MindSweep source |
| PRD-14C (Family Overview) | ~5 | Safety monitoring section, decisions resolved |
| PRD-14D (Family Hub) | ~5 | `families.hub_config` superseded by `family_hub_configs` |
| PRD-16 (Meetings) | ~5 | Universal Scheduler component, RRULE format |
| PRD-17 (Queue) | ~10 | MindSweep columns, source enum expansions |
| PRD-18 (Rhythms) | ~5 | MindSweep Digest, BigPlans check-in |
| PRD-19 (Family Context) | ~5 | Safe Harbor protocol language update |
| PRD-21A (Vault) | ~10 | `last_published_at`, `curation` rename, denormalized counters |
| PRD-29 (BigPlans) | ~3 | Milestone triggers |
| PRD-31 (Subscription) | ~5 | `ai_usage_tracking` superseded, credit balance |
| PRD-33 (Offline) | ~3 | MindSweep PWA manifest |
| Build Order | ~50 | PRD completions, section updates, convention additions |

---

## Migration Requirements Summary

| Migration | Source | Priority |
|-----------|--------|----------|
| `feature_access` → `feature_access_v2` | PRD-31 | Critical |
| `shift_schedules` → `access_schedules` | PRD-35 | Critical |
| `recurrence_details` JSONB → RRULE format on tasks, calendar_events, meeting_schedules | PRD-35 | Critical |
| `task_rewards` table removal (superseded by gamification pipeline) | PRD-24 | High |
| `treasure_boxes.animation_template` → `reveal_type` | PRD-24B | High |
| `lists.reveal_visual` → `reveal_type` | PRD-24B | High |
| `gamification_configs.visual_world_theme` → `dashboard_background_key` | PRD-24A | High |
| `gamification_daily_summaries.theme_unlocks_today` → `background_change_today` | PRD-24A | High |
| `member_feature_toggles` sparse → pre-populated model | PRD-31 Addendum | High |
| `ai_usage_tracking` table consolidation/removal | PRD-31 | Medium |
