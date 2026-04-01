# Feature Decision File: PRD-25 — Guided Dashboard (Phase A)

> **Created:** 2026-04-01
> **PRD:** `prds/dashboards/PRD-25-Guided-Dashboard.md`
> **Addenda read:**
>   - `prds/addenda/PRD-25-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
> **Build Spec:** `specs/PRD-25-Phase-A-Guided-Dashboard-Core-Spec.md`
> **Founder approved:** pending

---

## What Is Being Built

The Guided Dashboard is the personal home screen for family members in the Guided shell (ages 8-12, assigned by mom based on readiness). Phase A builds the core dashboard experience with 7 sections (Greeting, Best Intentions, Next Best Thing, Calendar, My Tasks, Widget Grid, Celebrate), the Next Best Thing deterministic priority engine with AI glaze via Edge Function, Guided-specific Best Intentions (personal + family, with optional child self-creation), gamification indicator stubs in the header, Reading Support CSS infrastructure, Mom's Dashboard Management screen in Settings, and the GuidedShell bottom nav rename from "Journal" to "Write". This is the child's own space — mom decides the structure, but within that structure the child has agency to reorder widgets, cycle NBT suggestions, write freely, and celebrate victories.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| GuidedDashboard (page) | Main page, renders 7 sections from `dashboard_configs.layout.sections` with Guided-specific defaults |
| GuidedGreetingSection | Member name + time-of-day + Guiding Stars rotation + gamification indicators (points + streak) |
| GuidedBestIntentionsSection | Personal + family intentions, tap-to-celebrate with confetti, optional child [+ Add] with coaching text |
| NextBestThingCard | Current suggestion with AI glaze text, [Do This] + [Something Else] buttons, slide animation on cycle |
| GuidedCalendarSection | Collapsible, reuses CalendarWidget with self-only member filter, day view default |
| GuidedActiveTasksSection | "My Tasks" label, Simple List (default) / Now/Next/Optional toggle, point values when gamification enabled |
| GuidedWidgetGrid | Reuses DashboardGrid with `canReorderOnly=true` — no resize/delete/create for child |
| CelebrateSection | Stub — PlannedExpansionCard until PRD-11 Victory Recorder is built |
| GuidedManagementScreen | Modal accessed from Settings > Family Management > Guided member > "Manage Dashboard" |
| Empty states | Per-section warm messages (no tasks, no suggestions, no intentions) |

---

## Key PRD Decisions (Easy to Miss)

1. **No separate route needed.** GuidedDashboard renders conditionally inside Dashboard.tsx when the member's `dashboard_mode` is `'guided'`. GuidedShell already wraps the page via RoleRouter.
2. **GuidedShell has its OWN navItems array** (does NOT use shared BottomNav.tsx). The "Journal" label rename to "Write" happens in `src/components/shells/GuidedShell.tsx` line 19, not in BottomNav.
3. **Bottom nav "Write" button routes to `/journal` in Phase A** — the full Write drawer (3 tabs: Notepad, Messages, Reflections) is Phase B. Phase A just renames the label; the path stays `/journal`.
4. **Sections that mom CANNOT hide:** `'greeting'`, `'next_best_thing'`, and `'best_intentions'`. All others are hideable via Management screen.
5. **Section ordering is mom-controlled only.** Guided members cannot reorder sections — only widgets within the widget grid.
6. **Reuse existing `useBestIntentions` hook.** The hook and mutations are fully built from PRD-06. Guided members get personal intentions (where `member_id` = their ID) plus family intentions (from `family_best_intentions` table if PRD-14D Hub is built, or via `related_member_ids` on personal `best_intentions`).
7. **CalendarWidget needs member-specific filtering.** Pass `memberIds` prop with only the Guided member's ID to filter events to self only. CalendarWidget already supports this prop from PRD-14C.
8. **Widget grid uses `canReorderOnly=true`.** DashboardGrid already supports this prop from PRD-10. Guided members can drag-reorder but not resize/delete/create widgets.
9. **NBT Engine is frontend-only computation** — no database table. Computes priority list from existing task/intention data. AI glaze is an optional enhancement via `guided-nbt-glaze` Edge Function.
10. **NBT priority order is deterministic, not random:** overdue -> active routine -> time-block -> mom-priority -> next due -> opportunities -> unscheduled -> best intention reminder. Same order every session. [Something Else] increments index; wraps at end.
11. **NBT AI glaze is Haiku-class, cached per suggestion per session.** In-memory Map cache. Fallback: "Up next: [task title]" on error.
12. **Gamification indicators are visual stubs in Phase A.** Read from `family_members.gamification_points` and `family_members.current_streak` columns (already in live schema). No pipeline integration — just display. Hidden entirely when gamification disabled.
13. **Reading Support is CSS-only infrastructure.** Toggle adds a class to the dashboard container. TTS uses browser's native `speechSynthesis` API. No backend needed. Speaker icons (Lucide `Volume2`) appear next to significant text.
14. **`spelling_coaching_cache` table created in migration but unused in Phase A.** Table created for Phase B Spelling & Grammar Coaching feature.
15. **Mom's Management screen wires into existing FamilyMemberDetail.tsx.** "Manage Dashboard" button appears on the member detail screen only when `dashboard_mode = 'guided'`. Opens a management modal.
16. **Task completion triggers a CSS celebration animation** — gentle scale up (1.0 -> 1.15 -> 1.0) with a brief color pulse using `var(--color-accent-warm)`. No gamification pipeline in Phase A.
17. **`child_can_create_best_intentions` preference.** When true, [+ Add] button appears with coaching helper text: "Write something you want to DO more of. Instead of 'Stop being mean,' try 'Use kind words.' What do you want to practice?"
18. **View As must work.** When mom activates View As for a Guided member, GuidedDashboard renders with that member's data. Existing `useViewAs()` + `displayMember` pattern applies. `acted_by` attribution via existing `useActedBy` hook.
19. **Default section order:** greeting (0), best_intentions (1), next_best_thing (2), calendar (3), active_tasks (4), widget_grid (5), celebrate (6).

---

## Addendum Rulings

### From PRD-25-Cross-PRD-Impact-Addendum.md:
- **PRD-04 Impact:** Guided shell bottom nav "Journal" renamed to "Write." Phase A: still routes to `/journal`. Phase B: opens the Write drawer.
- **PRD-08 Impact:** Guided shell notepad upgraded from "lightweight single-tab" to full Write drawer with three tabs. Phase B scope — not this build.
- **PRD-11 Impact:** DailyCelebration gains optional Step 2.5 (Reflections). Phase C scope — depends on PRD-11 being built.
- **PRD-14 Impact:** Two new section key constants: `'next_best_thing'` and `'celebrate'`. Also `'best_intentions'` per build spec. `dashboard_configs.preferences` JSONB extended with 10+ new keys for Guided-specific settings.
- **PRD-15 Impact:** Guided messaging moves into Write drawer Messages tab. Phase B scope.
- **PRD-18 Impact:** Reflections confirmed for Guided in two placements (drawer + celebration). Phase B/C scope.
- **PRD-22 Impact:** "Manage Dashboard" screen added to Settings > Family Management > Guided member detail.
- **PRD-24 Impact:** Gamification indicators confirmed in header. When disabled: header indicators hidden, task points hidden, NBT reward language suppressed.
- **PRD-05 Impact:** Two new guided modes (`guided_homework_help`, `guided_communication_coach`). Future scope — not this build.
- **New pattern: Next Best Thing priority engine** — deterministic suggestion ordering. Adult/Independent NBT will reuse the same engine with additional context.
- **New pattern: Reading Support accommodation layer** — per-member toggle, CSS class, TTS, larger font. Could extend to other shells.

### From PRD-Audit-Readiness-Addendum.md:
- No specific PRD-25 rulings. General rulings about table naming (`snake_case`), RLS on every table, and `is_included_in_ai` pattern apply to the new `spelling_coaching_cache` table.

---

## Database Changes Required

### New Tables

**`spelling_coaching_cache`** — Global spelling coaching cache. Grows as AI generates explanations for new words. Columns: `id`, `misspelling`, `correction`, `explanation`, `source` (CHECK: 'seed_data', 'ai_generated'), `language` (default 'en'), `usage_count`, `created_at`, `updated_at`. Unique index on `(lower(misspelling), language)`. RLS: public SELECT, service_role only writes. Created in Phase A, used in Phase B.

### Modified Tables

**`best_intentions`** — Verify and add any missing columns from PRD schema: `description`, `source`, `source_reference_id`, `related_member_ids`, `tags`, `tracker_style`, `is_active`, `is_private`, `is_shared_with_partner`, `sort_order`, `archived_at`. Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` after checking `claude/live_schema.md`.

**`intention_iterations`** — Verify and add any missing columns: `family_id`, `member_id`, `recorded_at`, `day_date`. Use `IF NOT EXISTS` pattern.

**`dashboard_configs`** — No schema change. The `preferences` JSONB column already exists. 10+ new keys consumed by frontend code only.

### No Schema Changes Needed
- Section keys (`'next_best_thing'`, `'celebrate'`, `'best_intentions'`) are string constants in TypeScript, not database enums.
- Guided dashboard preferences are JSONB keys in `dashboard_configs.preferences`, not separate columns.

### Migrations
- **Migration 100077** (next sequential): `spelling_coaching_cache` table creation + `best_intentions` column verification + `intention_iterations` column verification + indexes.

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `guided_dashboard` | TBD (beta: all) | guided_kids | Guided Dashboard layout and all sections |
| `guided_reading_support` | TBD (beta: all) | guided_kids | Reading Support accommodations (TTS, larger font, icon pairing) |
| `guided_spelling_coaching` | TBD (beta: all) | guided_kids | Spelling & Grammar Coaching teaching explanations |
| `guided_reflections` | TBD (beta: all) | guided_kids | Reflection prompts in drawer and celebration |
| `guided_next_best_thing` | TBD (beta: all) | guided_kids | Next Best Thing suggestion engine |
| `guided_lila_homework` | TBD (beta: all) | guided_kids | LiLa Homework Help tool |
| `guided_lila_communication` | TBD (beta: all) | guided_kids | LiLa Communication Coach tool |

All return `true` during beta via `useCanAccess()`.

---

## Stubs -- Do NOT Build Phase A

- [ ] Write drawer (3 tabs: Notepad, Messages, Reflections) -- Phase B
- [ ] Spelling & Grammar Coaching (lookup table + AI fallback) -- Phase B
- [ ] "Homework" routing destination in Send To grid -- Phase B
- [ ] `entry_category` field on journal_entries -- Phase B
- [ ] DailyCelebration Reflections step (Step 2.5) -- Phase C (PRD-11 dependency)
- [ ] LiLa Homework Help modal -- Future (PRD-05 guided modes)
- [ ] LiLa Communication Coach modal -- Future (PRD-05 guided modes)
- [ ] Messages tab real data -- Future (PRD-15 dependency)
- [ ] Visual World theme skinning -- Future (PRD-24A dependency)
- [ ] Gamification widgets in grid + real pipeline -- Future (PRD-24 dependency)
- [ ] Before-send message coaching -- Future (PRD-15 dependency)
- [ ] Graduation flow (Guided -> Independent) -- Post-MVP
- [ ] Advanced NBT (energy level, Best Intentions, whole-family context) -- Post-MVP
- [ ] "Ask Mom" button on NBT -- Post-MVP (PRD-15 quick-request)
- [ ] Victory Recorder integration (Celebrate section) -- Future (PRD-11 dependency)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| GuidedGreetingSection | <- reads | PRD-06 Guiding Stars | `guiding_stars` table, `is_included_in_ai = true`, `archived_at IS NULL` |
| GuidedBestIntentionsSection | <- reads | PRD-06 Best Intentions | `best_intentions` table via `useBestIntentions` hook |
| GuidedBestIntentionsSection | <- reads | PRD-14D Family Best Intentions | `family_best_intentions` table (if built) |
| GuidedBestIntentionsSection | -> creates | PRD-06 Intention Iterations | `intention_iterations` table on tap-to-celebrate |
| GuidedActiveTasksSection | <- reads | PRD-09A Tasks | `tasks` + `task_assignments` tables via tasks hooks |
| GuidedActiveTasksSection | -> creates | PRD-09A Task Completions | `task_completions` table on checkbox tap |
| GuidedCalendarSection | <- reads | PRD-14B Calendar | `calendar_events` table via CalendarWidget |
| GuidedWidgetGrid | <- reads | PRD-10 Widgets | `dashboard_widgets` table via DashboardGrid |
| NBT Engine | <- reads | PRD-09A Tasks | `tasks`, `task_assignments`, `task_completions` |
| NBT Engine | <- reads | PRD-06 Best Intentions | `best_intentions` for lowest-priority intention reminder |
| Gamification indicators | <- reads | PRD-24 (stub) | `family_members.gamification_points`, `family_members.current_streak` |
| Dashboard.tsx | -> routes | This feature | Renders GuidedDashboard when `dashboard_mode = 'guided'` |
| GuidedShell | -> wraps | This feature | Bottom nav "Write" label, shell chrome |
| GuidedManagementScreen | -> writes | dashboard_configs | `layout.sections` + `preferences` JSONB |
| GuidedManagementScreen | -> writes | best_intentions | Mom creates/edits/archives intentions for child |
| Settings FamilyMemberDetail | -> opens | GuidedManagementScreen | "Manage Dashboard" button on Guided member rows |
| View As | -> renders | This feature | Mom sees GuidedDashboard via ViewAsModal |

---

## Things That Connect Back to This Feature Later

- **PRD-11 (Victory Recorder):** Wires the CelebrateSection from stub to real DailyCelebration launch.
- **PRD-15 (Messages):** Provides real messaging data for the Write drawer Messages tab (Phase B).
- **PRD-18 (Reflections):** Provides reflection prompts for Write drawer Reflections tab (Phase B) and DailyCelebration Step 2.5 (Phase C).
- **PRD-24 (Gamification):** Replaces header indicator stubs with real pipeline integration; enables gamification widgets in grid.
- **PRD-24A (Visual Worlds):** Skins the dashboard experience with the child's selected Visual World theme.
- **PRD-05 (LiLa guided modes):** Enables Homework Help and Communication Coach modals.
- **PRD-26 (Play Dashboard):** May reuse patterns established here (NBT engine, section system, Reading Support).

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed -- nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> Completed after build, before declaring the phase done.
> Every requirement from the PRD and addenda -- accounted for.
> Zero Missing = build complete.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| GuidedDashboard renders for Guided members | PRD-25 Screen 1 | | |
| Greeting: time-of-day + member name | PRD-25 Screen 1 | | |
| Greeting: Guiding Stars rotation (if entries exist) | PRD-25 Screen 1 | | |
| Greeting: gamification indicators (points + streak) | PRD-25 Screen 1 | | |
| Greeting: indicators hidden when gamification disabled | PRD-25 Edge Cases | | |
| Best Intentions section: personal intentions with tap-to-celebrate | PRD-25 Screen 1 / Build Spec | | |
| Best Intentions section: family intentions with badge | PRD-25 Screen 1 / Build Spec | | |
| Best Intentions section: [+ Add] when child_can_create = true | Build Spec | | |
| Best Intentions section: coaching helper text on add form | Build Spec | | |
| Best Intentions section: empty state | Build Spec | | |
| Best Intentions: mom cannot hide this section | PRD-25 Screen 1 / Build Spec | | |
| NBT card: displays one suggestion at a time | PRD-25 Screen 1 | | |
| NBT card: AI glaze encouraging one-liner | PRD-25 AI Integration | | |
| NBT card: [Do This] navigates to task/routine/opportunity | PRD-25 Screen 3 | | |
| NBT card: [Something Else] cycles with slide animation | PRD-25 Screen 3 | | |
| NBT card: deterministic priority order (7 levels + intention) | PRD-25 Screen 1 / Build Spec | | |
| NBT card: wraps to start after all shown | PRD-25 Screen 3 | | |
| NBT card: empty state "Nothing on the list" | PRD-25 Edge Cases | | |
| NBT card: fallback text when AI fails | PRD-25 AI Integration | | |
| NBT card: mom cannot hide this section | PRD-25 Screen 1 | | |
| NBT: nbt_last_suggestion_index persisted to preferences | PRD-25 Data Schema | | |
| Calendar section: collapsible | PRD-25 Screen 1 | | |
| Calendar section: self-only event filter | PRD-25 Screen 1 | | |
| Calendar section: day view default | PRD-25 Screen 1 | | |
| Active Tasks ("My Tasks"): collapsible | PRD-25 Screen 1 | | |
| Active Tasks: Simple List default view | PRD-25 Screen 1 | | |
| Active Tasks: Now/Next/Optional toggle | PRD-25 Screen 1 | | |
| Active Tasks: point values shown when gamification enabled | PRD-25 Screen 1 | | |
| Active Tasks: opportunities below divider | PRD-25 Screen 1 | | |
| Active Tasks: task completion celebration animation | PRD-25 Screen 1 | | |
| Active Tasks: "Waiting for Mom" state for approval tasks | PRD-25 Screen 1 | | |
| Active Tasks: routine tasks expand to step progress | PRD-25 Screen 1 | | |
| Active Tasks: empty state "No tasks for today" | PRD-25 Edge Cases | | |
| Widget grid: renders mom-assigned widgets | PRD-25 Screen 1 | | |
| Widget grid: child can reorder only | PRD-25 Screen 1 | | |
| Widget grid: child cannot resize/delete/create | PRD-25 Screen 1 | | |
| Celebrate section: stub/PlannedExpansionCard | Build Spec | | |
| Section order from dashboard_configs.layout.sections | PRD-25 Screen 1 | | |
| Guided-specific default section order (7 sections) | PRD-25 Data Schema / Build Spec | | |
| Mom can hide Calendar, My Tasks, Widgets, Celebrate | PRD-25 Screen 5 | | |
| Mom cannot hide Greeting, NBT, Best Intentions | PRD-25 Screen 5 | | |
| GuidedShell bottom nav "Journal" -> "Write" | PRD-25 Addendum / Build Spec | | |
| Bottom nav items: Home, Tasks, Write, Victories, Progress | PRD-25 Visibility | | |
| Reading Support CSS: toggle adds class, larger font, TTS icons | PRD-25 Screen 4 | | |
| Reading Support: speaker icons next to significant text | PRD-25 Screen 4 | | |
| Reading Support: uses native speechSynthesis API | PRD-25 Screen 4 | | |
| Dashboard.tsx routes Guided members to GuidedDashboard | Build Spec | | |
| Mom's Management screen: section reorder + visibility | PRD-25 Screen 5 | | |
| Mom's Management screen: feature toggles (Reading Support, Spelling) | PRD-25 Screen 5 | | |
| Mom's Management screen: Best Intentions CRUD for child | Build Spec | | |
| Mom's Management screen: child_can_create toggle | Build Spec | | |
| Mom's Management screen: calendar default view setting | PRD-25 Screen 5 | | |
| Mom's Management screen: task default view setting | PRD-25 Screen 5 | | |
| Mom's Management screen: Reflections toggle (Phase B stub) | PRD-25 Screen 5 | | |
| Mom's Management screen: LiLa tools (future stubs) | PRD-25 Screen 5 | | |
| "Manage Dashboard" button on FamilyMemberDetail for Guided only | Build Spec | | |
| Migration: spelling_coaching_cache table | Build Spec | | |
| Migration: best_intentions column verification | Build Spec | | |
| Edge Function: guided-nbt-glaze (Haiku-class) | Build Spec | | |
| View As renders GuidedDashboard for Guided member | Build Spec | | |
| acted_by attribution via useActedBy hook | Build Spec | | |
| useCanAccess for all 7 feature keys (return true) | PRD-25 Tier Gating | | |
| TypeScript types for guided-dashboard | Build Spec | | |
| TypeScript check (tsc -b) zero errors | Convention #121 | | |
| Write drawer (3 tabs) | PRD-25 Screen 2 | Stubbed | Phase B |
| Spelling & Grammar Coaching | PRD-25 AI Integration | Stubbed | Phase B |
| DailyCelebration Reflections Step 2.5 | PRD-25 Screen 6 | Stubbed | Phase C (PRD-11 dep) |
| LiLa Homework Help modal | PRD-25 AI Integration | Stubbed | Future (PRD-05 dep) |
| LiLa Communication Coach modal | PRD-25 AI Integration | Stubbed | Future (PRD-05 dep) |
| Graduation flow (Guided -> Independent) | PRD-25 Screen 7 | Stubbed | Post-MVP |
| Visual World theme skinning | PRD-25 Screen 1 | Stubbed | Future (PRD-24A dep) |
| Gamification pipeline integration | PRD-25 Screen 1 | Stubbed | Future (PRD-24 dep) |
| Victory Recorder integration | PRD-25 Screen 1 | Stubbed | Future (PRD-11 dep) |
| Before-send message coaching | PRD-25 Screen 2 | Stubbed | Future (PRD-15 dep) |
| Messages tab real data | PRD-25 Screen 2 | Stubbed | Future (PRD-15 dep) |

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- Total requirements verified:
- Wired:
- Stubbed:
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
