# MyAIM Central — Family Platform v2

## Project Overview

MyAIM Central is a comprehensive family management and transformation platform built for AI-curious moms managing complex households. The platform serves as a personal growth companion, family coordination hub, and AI skill-building resource — all wrapped in a warm, celebration-only experience with no punishment mechanics, no dark patterns, and no shame.

The AI assistant is named **LiLa** (Little Lanterns). LiLa is a processing partner, never a friend, therapist, or companion. Every AI output follows the **Human-in-the-Mix** pattern: Edit / Approve / Regenerate / Reject before saving. The platform follows the **Buffet Principle**: maximalist options, minimalist auto-defaults.

The platform supports five family member roles (Mom, Dad/Additional Adult, Special Adult/Caregiver, Independent Teen, Guided/Play Children) with role-based shells that adapt the entire UI experience. Mom is always the primary administrator with full visibility. The platform is being built by a solo founder (Tenise) with AI assistance.

## Tech Stack

- **Frontend:** Vite + React 19 + TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime)
- **AI Models:** Claude Sonnet via OpenRouter (primary), Haiku (lightweight), OpenAI text-embedding-3-small (embeddings)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS + CSS custom properties for theming
- **Icons:** Lucide React (no emoji in adult interfaces; emoji only in Play shell)
- **Scheduling:** rrule.js (RFC 5545)
- **Payments:** Stripe
- **Extensions:** pgvector, pgmq, pg_net, pg_cron

## Key Architectural Patterns

- **Five-Shell System:** Mom, Adult, Independent, Guided, Play — each with distinct layouts and capabilities
- **Three-Tier Context Toggle:** Person / Category / Item level AI inclusion control
- **Permission Layer:** `<PermissionGate>` + `useCanAccess()` — tier threshold + member toggle + founding override
- **RoutingStrip:** Universal grid component for routing items between features
- **Automatic Intelligent Routing (AIR):** Silent auto-routing of victories from task completions, intention iterations, widget milestones
- **Embedding Pipeline:** Async queue-based (pgmq → embed Edge Function → OpenAI), never synchronous
- **Celebration Only:** Victory Recorder is a Ta-Da list. No punishment mechanics anywhere.

## Detailed Documentation

@claude/architecture.md
@claude/database_schema.md
@claude/live_schema.md
@claude/conventions.md
@claude/ai_patterns.md
@claude/feature_glossary.md
@WIRING_STATUS.md
@specs/studio-seed-templates.md

## Critical Conventions (Apply to ALL Code)

1. **Database tables:** snake_case. No nautical names. No exceptions.
2. **Feature names:** Compound capitals — LifeLantern, InnerWorkings, GuidingStars, BestIntentions, BookShelf, ThoughtSift, BigPlans, MindSweep, DailyCelebration
3. **Every table MUST have RLS enabled.** Mom sees all within family. Other roles scoped per PRD-02.
4. **Every AI output MUST go through Human-in-the-Mix** (Edit/Approve/Regenerate/Reject) before persisting.
5. **Never synchronous AI calls on write.** Embeddings are always async via queue.
6. **Safe Harbor conversations are EXEMPT** from all data aggregation, spousal transparency, reports, and context freshness processes. Filter with `is_safe_harbor`.
7. **Crisis Override is GLOBAL** — applies to ALL LiLa conversations, not just Safe Harbor. Every system prompt must include crisis detection.
8. **`is_included_in_ai` pattern:** Every context source has this boolean (default true). Three-tier toggles control inclusion.
9. **Feature keys:** Register in `feature_key_registry`, gate with `<PermissionGate>`, check with `useCanAccess()`.
10. **During beta:** `useCanAccess()` returns true for everything (all tiers unlocked). Infrastructure must still be in place.
11. **PRDs are the ONLY source of truth for building features.** Before writing ANY code for a feature, you MUST read the FULL PRD file in `prds/` AND any related addenda in `prds/addenda/`. The `claude/database_schema.md` file is a summary reference — it is NOT authoritative for schema design. If `database_schema.md` conflicts with a PRD, the PRD wins. If two PRDs conflict, the newer one wins. Every column, every enum value, every screen, every interaction, every empty state, every visibility rule in the PRD must be implemented precisely. This platform is a Rube Goldberg machine — every piece connects, and precision is non-negotiable.
12. **Never modify files in `prds/`, `specs/`, or `reference/`.** These are read-only source material.
13. **No "MVP" or placeholder implementations.** Build every feature complete and correct the first time. Never use local regex stubs, setTimeout placeholders, or "simple parsing for MVP" comments. If a feature needs AI, connect AI. If it needs streaming, stream. If it's not ready to build right, don't build it yet — ask the founder. This is a law of this codebase.
14. **Post-phase checklist (MANDATORY after completing each build phase):** Update these files before moving to the next phase:
    - `BUILD_STATUS.md` — mark phase complete with date
    - `claude/database_schema.md` — update any new/changed tables and columns
    - `STUB_REGISTRY.md` — add new stubs created, update wired status of existing stubs
    - `CLAUDE.md` — add any new conventions introduced by the phase
    - Add `<FeatureGuide featureKey="xxx" />` to every new page/feature

15. **Member colors:** Use the 44-color AIMfM palette from `src/config/member_colors.ts`. Never hardcode hex colors — use CSS custom properties with fallbacks. Run `npm run check:colors` to verify.
16. **Mobile layout:** BottomNav handles mobile navigation. No hamburger menu. Hide "Back to Dashboard" buttons on mobile (`hidden md:flex`). LiLa drawer sits above bottom nav (`bottom-14 md:bottom-0`).
17. **PIN hashing:** All PINs are hashed server-side via `hash_member_pin` RPC (pgcrypto bcrypt). Never store plain-text PINs. Verify with `verify_member_pin` RPC.
18. **Out of Nest members:** Stored in `out_of_nest_members` table (NOT `family_members`). They are descendants and their spouses only — below mom on the family tree. No dashboard, no PIN, no feature access. Grandparents who help are Special Adults, not Out of Nest.
19. **Auto-provisioning:** The `auto_provision_member_resources` trigger creates an archive folder + dashboard_config for every new `family_members` insert. No manual creation needed.
20. **Smart Notepad:** Right-drawer workspace with Supabase-backed tabs, autosave (500ms debounce), AI auto-titling (Haiku). "Send to..." grid routes content to 13 destinations via RoutingStrip. "Review & Route" extracts items via ai-parse. NotepadProvider wraps MomShell. Journal's `+` button opens Notepad — Journal is NOT a direct writing surface. "Note" routes to `journal_entries` with `entry_type = 'free_write'`.
21. **RoutingStrip:** Universal grid component for routing items between features. Context-filtered sets (notepad_send_to, request_accept, meeting_action, review_route_card). Favorites section auto-sorted by `notepad_routing_stats`. Sub-destination drill-down for destinations with sub-types. Build once, use everywhere.
22. **Review & Route:** Universal reusable extraction component defined in PRD-08. Other features wire in with their content as input. AI extraction → card-by-card review → per-item routing. Merciful defaults: if uncertain → Journal. Extract more rather than fewer.

## Pricing (PRD-31 Authoritative)

| Tier | Monthly | Founding Rate |
|------|---------|---------------|
| Essential | $9.99 | $7.99 |
| Enhanced | $16.99 | $13.99 |
| Full Magic | $24.99 | $20.99 |
| Creator | $39.99 | $34.99 |

100 founding family limit. Founding rates are lifetime locks with growing dollar discount.

## Universal Scheduler (PRD-35)

23. **All scheduling uses the Universal Scheduler component (PRD-35).** Never build a custom recurrence picker. Import from `@/components/scheduling`.
24. **Schedule data is stored as RRULE JSONB** in each consuming feature's `recurrence_details` column. Format: `{rrule, dtstart, until, count, exdates, rdates, timezone, schedule_type, completion_dependent, custody_pattern}`.
25. **Use rrule.js for all instance generation.** Never pre-generate infinite instances. Expand on-the-fly with a configurable horizon.
26. **`access_schedules` replaces `shift_schedules`** for Special Adult/co-parent access windows.
27. **Completion-dependent schedules** generate the next instance from the last completion timestamp, not from a fixed calendar position.
28. **The [+ Add another] pattern** is the universal solution for multi-value scheduling (multiple weekdays, multiple dates, multiple seasonal ranges). No fixed limit on rows.
29. **Calendar preview is REQUIRED** on all scheduler instances. It must work for every frequency type and be navigable to any month/year.
30. **Time is optional by default.** Consuming features pass `showTimeDefault: true` for time-centric features (calendar, meetings, shifts).

## PlannedExpansionCard (PRD-32A)

31. **PlannedExpansionCard enhanced pattern:** Every PlannedExpansionCard includes THREE sections:
    (a) "What this will do" — A FeatureGuide-style description of the planned feature written in present-future tense. Pulled from `feature_expansion_registry.ts` description field. This shows judges and users the vision.
    (b) "I'm interested" — Yes/No vote buttons + optional freeform note (500 char) on Yes. Saves to `feature_demand_responses` table. Shows previous vote state on return. This collects real user demand data.
    (c) "Notify me when it's ready" — Toggle that opts user into a notification when the feature launches. This builds anticipation.
    The card should feel warm and exciting ("On our roadmap!"), not like a dead end ("Coming soon"). Use btn-primary styling, warm brand energy. Every PlannedExpansionCard page ALSO gets a FeatureGuide card explaining the demand validation concept itself ("Help us build what matters most to your family!").

## Universal Timer (PRD-36)

32. **Timer is timestamp-based, not client-side.** `started_at` and `ended_at` are server timestamps. Duration = `ended_at - started_at`. Timer persists across page refresh and device switches.
33. **Floating bubble renders at shell level** via `TimerProvider` wrapping each shell. Z-index: above content and QuickTasks, below modals. Hidden when no active timers.
34. **Multiple concurrent timers supported.** Each timer is an independent `time_sessions` row. The bubble shows a badge with count.
35. **5 visual timer styles** (sand_timer, hourglass, thermometer, arc, filling_jar) are SVG/CSS animations consuming theme tokens. Play shell shows visual-only (no numbers).
36. **Soft delete only** for timer sessions (`deleted_at` timestamp). Mom can edit timestamps with full audit trail preserved in `original_timestamps` JSONB.
37. **Play mode age gate** is a speed bump (client-side useState), not security. Under 18 redirects to "ask a grown-up". Mom quick-starts countdowns for Play children.

## Permissions UI (PRD-02)

38. **PIN lockout is server-side.** `verify_member_pin` RPC returns JSONB `{success, reason, attempts_remaining, locked_until, remaining_seconds}`. 5 failures → 15-minute lockout. Columns: `pin_failed_attempts`, `pin_locked_until` on `family_members`.
39. **View As renders full-shell mode** via `ViewAsShellWrapper` wrapping MomShell content. `ViewAsBanner` (z-45) shows "Viewing as [Name]" with Switch/Exit buttons. `ViewAsMemberPicker` is a modal grid.
40. **Special Adult shifts use `time_sessions`** with `source_type='shift'`, `is_standalone=true`. No separate `shift_sessions` table. Co-parents with `always_on` schedule skip shift start/end entirely.
41. **Default permissions auto-created** via `trg_fm_auto_permissions` trigger when `additional_adult` is inserted. Grants `view` level for basic features to all children.

## Design System (PRD-03)

42. **38 themes implemented** across 6 mood categories (Warm & Cozy, Cool & Calm, Bold & Rich, Soft & Light, Bright & Fun). Each has light + dark variants with 20 semantic token fields including `accentDeep`, `textOnPrimary`, `borderDefault`.
43. **Tooltip is fully theme-adaptive.** Background=`var(--color-accent-deep)`, text=`var(--color-text-on-primary)`, border=`var(--color-border-default)`, radius=`var(--vibe-radius-input)`. Zero hardcoded colors. Desktop: hover 300ms delay. Mobile: long-press. Auto-positioning via portal.
44. **Shared component library:** Button, Card, Input, Modal, Badge, LoadingSpinner, EmptyState, Toggle, Avatar, Tabs, Select, Tooltip, SparkleOverlay — all in `@/components/shared`, all theme-aware via CSS custom properties.
45. **Shell token overrides** applied via `applyShellTokens()`: touch targets (44/48/56px), font scale, line height, icon size, transition timing per shell type.
46. **SparkleOverlay** reserved exclusively for victory celebrations in Play shell. Quick burst (8-12 particles, 0.8s) and full celebration (16-24 particles, 1.6s). Respects prefers-reduced-motion.
47. **Dark mode defaults to system** (`prefers-color-scheme`). Theme preferences persist to Supabase `family_members.theme_preferences` JSONB via `useThemePersistence` hook.

## Shell Routing (PRD-04)

48. **BottomNav is shell-aware.** Mom/Adult/Independent: Home, Tasks, Journal, Notepad, More. Guided/Play have their own nav (BottomNav returns null). More menu has ⓘ info toggle for descriptions.
49. **QuickTasks strip** is a horizontal scrollable pill bar at the top of Mom/Adult/Independent shells. Collapsible (persists to localStorage). Default items: Add Task, Journal, Quick Note, Victory, Calendar, MindSweep. "Quick Note" opens the Notepad drawer via bridge context.
50. **PerspectiveSwitcher** is a segmented control on the dashboard page only (mom only). Three views: My Dashboard, Family Overview, Family Hub. Caller owns the state.
51. **Play shell** uses pure emoji nav (🏠✅⭐🎮), parent-locked Settings button, prominent "Celebrate!" button, 56px touch targets.
52. **Guided shell** shows personalized greeting header with member name + date. 48px touch targets. No sidebar on mobile.
53. **Settings is NOT in the sidebar.** Access only via floating gear icon in top-right of each shell.
54. **NotepadDrawer** is available in Mom, Adult, and Independent shells (wrapped with NotepadProvider). Not available in Guided (lightweight version future) or Play.

## LiLa AI (PRD-05)

55. **HumanInTheMix Regenerate** deletes the assistant message, re-sends with "[Please try a different approach]" appended. **Reject** deletes the assistant message and invalidates the query.
56. **Help/Assist pattern matching** via `help-patterns.ts` (13 FAQ patterns) runs BEFORE AI calls. Matched responses insert directly into `lila_messages` with `metadata.source = 'pattern_match'` — zero API cost.
57. **Context assembly has 7 stub loaders** for future sources (archives, LifeLantern, partner, BookShelf, family vision, personal vision, recent tasks). Each returns empty arrays until its PRD phase is built.
58. **Permission filtering** (Step 5) excludes other members' context for non-mom. **Privacy Filtered** (Step 6) excludes private-visibility items for non-mom. Both auto-activate when `belongsToOtherMember` and `visibility` fields are populated.
59. **Voice input** wired to LiLa drawer/modal via `useVoiceInput` hook → `whisper-transcribe` Edge Function. Recording indicator, interim preview, transcribed text inserted into input.
60. **Page context** passed as `window.location.pathname` when creating conversations. Available in context snapshots for mode auto-routing (future).
61. **Opening messages** seeded for core modes (help, assist, general, optimizer) and task_breaker modes. Rotate randomly on conversation start.

## Auth Gaps (PRD-01)

62. **Accept-invite flow** at `/auth/accept-invite?token=xxx`. Validates token against `family_members.invite_token`, supports new account creation or existing account linking. `accept_family_invite` RPC (SECURITY DEFINER) handles the DB update atomically.
63. **Session duration per role:** adult=24h, independent=4h, guided=1h, play=30m. `useSessionTimeout` hook in ShellProvider tracks inactivity (mouse/key/touch/scroll), throttled to 30s resets. Warning banner 2 minutes before expiry. Auto-signout on timeout.

## Tasks System (PRD-09A, PRD-17)

65. **`studio_queue` is the universal task intake.** There is NO `task_queue` table. PRD-17 supersedes PRD-09A's `task_queue` with `studio_queue`. Items arrive with `destination='task'` from Notepad, LiLa, meetings, and requests.
66. **Universal Queue Modal** has 3 tabs: Calendar, Sort, Requests. The Sort tab processes `studio_queue` items. It is the central decision inbox — one modal, everything waiting for mom's attention.
67. **Task Creation Modal** has Quick Mode (name + assignee + date) and Full Mode (7 collapsible sections). Quick Mode is default from Sort tab; Full Mode is default for batch/template operations.
68. **13 prioritization views** show the same tasks through different lenses. View metadata fields (`eisenhower_quadrant`, `frog_rank`, `importance_level`, etc.) stored on each task. Auto-sync between views (Eisenhower "Do Now" → ABCDE "A") but never overwrite explicit user values.
69. **Fresh Reset is the DEFAULT incomplete action for routines.** No carry-forward guilt. History recorded but each period starts clean.
70. **Opportunities** have 3 sub-types: `opportunity_repeatable` (unlimited earnings), `opportunity_claimable` (lock for duration, release on expiry), `opportunity_capped` (max completions). Claim locks are first-claim-wins with configurable duration.
71. **Sequential Collections** drip-feed tasks one at a time. On completion, next item auto-promotes (immediate/next_day/manual). Reusable across years by reassigning.
72. **Task Breaker AI** decomposes tasks into subtasks at 3 levels (quick/detailed/granular). Child tasks link via `parent_task_id`. Image mode available at Full Magic tier.

## Build Prompts Ban

73. **Old build prompts are BANNED.** The 42 files in `archive/old-build-prompts/` were generated from a bad schema summary and are POISONED. Never reference, read, or use them. For every remaining feature, read the FULL PRD in `prds/` (and any addenda in `prds/addenda/`) before writing any code. This supersedes any workflow that previously relied on build prompt files.
