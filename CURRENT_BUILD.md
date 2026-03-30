# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.

## Status: ACTIVE — PRD-14 Personal Dashboard Reconciliation

### PRD Files
- `prds/dashboards/PRD-14-Personal-Dashboard.md` (full PRD — read every word)
- `prds/dashboards/PRD-14D-Family-Hub.md` (perspective switcher changes)

### Addenda Read
- `prds/addenda/PRD-14-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-Template-and-Audit-Updates.md`

### Feature Decision File
`claude/feature-decisions/PRD-14-Personal-Dashboard.md`

### Build Spec
User-provided reconciliation build spec with 7 build items, derived from 37-item audit (9 MISSING, 14 PARTIAL).

### Investigation File
`claude/feature-decisions/PRD-04-repair.md` — View As sign-off (marked WIRED but investigation shows ViewAsShellWrapper is a passthrough)

---

### Pre-Build Summary

#### Context
PRD-14 was never formally built. Dashboard features arrived incrementally via PRD-04, PRD-09A, PRD-10, PRD-14B, and UX overhaul sessions S1-S5. A 37-item reconciliation audit identified:
- 13 WIRED (already working)
- 14 PARTIAL (exist but incomplete)
- 9 MISSING (not implemented)
- 0 SUPERSEDED

#### Build Items (7 total — items 1-7 all priority)

**1. Data-Driven Section System** (gaps A2, A3, A4, A5, G2)
- Define section key constants: `greeting`, `calendar`, `active_tasks`, `widget_grid`
- Add `sections` array to `dashboard_configs.layout` JSONB
- Each entry: `{ key, order, visible, collapsed }`
- Greeting: always order 0, always visible, never collapsible, never draggable
- Default order: greeting(0), calendar(1), active_tasks(2), widget_grid(3)
- Section renderer component: loops over sections, renders correct component per key
- Drag-to-reorder sections in edit mode (greeting pinned)
- Section visibility toggle (eye icon) in edit mode
- Collapse persistence to DB via `useUpdateDashboardConfig`
- Migration to seed defaults for existing dashboard_configs rows
- NOT building: `col_span` (sections remain full-width)

**2. Guiding Stars in Greeting Header** (gap B2)
- Rotating declaration below greeting text, NOT a widget
- Filters by `is_included_in_ai = true` AND `archived_at IS NULL`
- Smooth fade transition between entries
- Default 30-second interval (configurable via `preferences.greeting_rotation_interval_seconds`)
- Hides entirely if no eligible entries
- Coexists with InfoGuidingStarsRotation widget in the picker
- Font: `--font-display` for name, `--font-body` for declaration

**3. Starter Widget Auto-Deploy** (gap E3)
- On first dashboard load when member has 0 widgets:
  - Guiding Stars Rotation (Small) — only if member has >=1 star
  - Best Intentions Celebration (Medium) — only if member has >=1 intention
  - Today's Victories (Small) — always
- Track `preferences.starters_deployed` flag to prevent re-triggering
- Warm onboarding card (dismissible, tracked via `preferences.onboarding_dismissed`)

**4. Tasks View Pills Carousel** (gap D1)
- Replace `<select>` dropdown with horizontal scroll pill buttons
- Track usage counts in `dashboard_configs.preferences.task_view_usage` JSONB
- Sort pills by count descending (most-used first)
- 0-use views at end in default order

**5. Collapsible Calendar Section** (gap C1)
- Wrap CalendarWidget in DashboardSectionWrapper
- Section header: "Calendar" with chevron collapse toggle
- Collapse state managed by section system (`layout.sections[key='calendar'].collapsed`)

**6. Perspective Switcher Expansion** (gaps F1, F2, F3)
- PRD-14D overrides PRD-14: perspective switcher is no longer mom-only
- **Mom (primary_parent):** 4 tabs — My Dashboard, Family Overview, Hub, View As
  - View As tab: inline member picker with colored pill buttons
- **Dad/Additional Adult:** 2-4 tabs — My Dashboard (always), Hub, Family Overview (if permitted), View As (if permitted)
  - Hub tab: PlannedExpansionCard inline (not /hub navigation)
- **Independent Teen:** 2 tabs — My Dashboard, Hub
  - Hub tab: PlannedExpansionCard inline
- **Guided/Play:** no perspective switcher (unchanged)
- Family Overview for dad: uses existing FamilyOverviewStrip, filtered by PRD-02 permissions

**7. View As Theme/Shell Investigation & Fix** (gap F4)
- **Investigation complete:** ViewAsShellWrapper is a passthrough. Theme/shell loading was NEVER built — it was marked WIRED in PRD-04 repair but the passthrough was intentional to avoid breaking MomShell component tree.
- **Fix needed:**
  - View As should load target member's `theme_preferences` and apply their theme tokens
  - View As should render target member's shell type if different from mom's
  - Keep View As exit banner visible (z-45)
  - Restore mom's shell and theme on exit

**8. View As Rework (PRD-02/04)** — folded into this build
- **`acted_by` attribution on writes:** No `acted_by` column exists on task_completions, intention_iterations, or calendar_events. `widget_data_points` already has `recorded_by_member_id` (sufficient). Migration adds nullable `acted_by UUID FK` to those 3 tables. When mom acts in View As: `member_id = target child`, `acted_by = mom's member_id`. NULL = member acted for themselves.
- **`view_as_permissions` wiring:** Table exists (migration 00000000000009) with `enabled` boolean + `excluded_features` JSONB but is completely unwired. Member picker currently does zero permission checks. Need to: check `view_as_permissions.enabled` in member picker, merge permanent + session exclusions.
- **View As shell rendering:** Extends item 7. Guided child → GuidedShell. Play child → PlayShell. Teen → IndependentShell. Dad → AdultShell. Banner (z-45) overlays target shell.
- **Member switching:** Direct switch without closing View As. Compact switcher in View As banner or perspective switcher tab.
- **Feature exclusion enforcement:** Two layers — `view_as_permissions.excluded_features` (permanent) + `view_as_feature_exclusions` (per-session). Merge both in PermissionGate + nav filtering during View As.
- **Feature key:** `view_as_mode` already registered, Enhanced tier, mom role group.

### Stubs (NOT Building This Phase)
- Section `col_span` on 3+ column grids (complex layout for marginal desktop gain)
- Widget folder drag-to-create gesture (folder infrastructure exists, no creation UX)
- Notification bell (depends on PRD-15 Messages/Notifications)
- Calendar week/month toggle on dashboard (always week view per PRD-14B)
- LifeLantern summary widget (PRD-12A not built)
- Special Adult shift-scoped dashboard read (requires PRD-27 shift infrastructure)

### Key Decisions from PRD + Addenda
1. PRD-14D **overrides** PRD-14 on perspective switcher scope (no longer mom-only)
2. Greeting header uses `--font-display` (The Seasons) for member name, `--font-body` (DM Sans) for declaration
3. Section keys are string constants, not DB enums
4. Layout sections array lives inside existing `layout` JSONB column (no schema change)
5. View As per PRD-14 line 514: "renders using that member's dashboard_configs row, that member's theme tokens, and that member's data"
6. Empty state: collapsed calendar + expanded tasks + starter widgets + onboarding card
7. Edit mode: long-press triggers for BOTH sections AND widgets simultaneously
8. `acted_by` pattern: record's `member_id` = target child, `acted_by` = mom. `widget_data_points.recorded_by_member_id` already covers widgets. Need new column on 3 tables.
9. `view_as_permissions` table exists but is completely unwired — member picker does zero permission checks currently
10. Feature exclusion has two layers: permanent (view_as_permissions.excluded_features) + per-session (view_as_feature_exclusions table). ViewAsProvider already has setFeatureExclusions() method.

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

*UX Overhaul Session 4 completed 2026-03-28. DateDetailModal completeness (edit/delete, items-to-bring, leave-by time, attendees, recurrence, rejection note). Calendar Settings additions (required intake fields, default view, color mode, auto-approve). RLS verified for 4 calendar tables. WeekdayCircles weekStartDay prop. QuickCreate converted to universal draggable FAB. QuickTasks strip navigation-only. Tooltip conversion (~248 across 92 files). Post-build verification: 155/185 wired, 13 stubbed.*

*UX Overhaul Session 5 completed 2026-03-28. Calendar toolbar completion: Pick Members filter with avatar row, Dots/Stripe color mode toggle, ?new=1 URL param, MiniCalendarPicker in CalendarWidget, task due date click detail modal, member color dots/stripes on all views. List as 5th task type: migration (linked_list_id, list_delivery_mode columns), 5th button in TaskCreationModal grid, 3-decision inline sub-section. Tracker Quick-Create: 7th QuickCreate action, TrackerQuickCreateModal with Lucide-icon quick-picks. Element Size user preference: S/M/L in ThemeSelector, --density-multiplier on :root. Zero TS errors.*

---
