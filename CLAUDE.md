# MyAIM Family — Builder Context

## What This Product Is

MyAIM Family is a family management and transformation platform paired with AI Magic for Moms (AIMfM), an AI literacy membership. The platform serves moms managing complex households — including homeschool families, disability families, and families navigating Education Savings Accounts. The AI assistant LiLa (Little Lanterns) is a context-aware family AI that assembles knowledge about each family member to make every interaction specific to this family, not generic advice.

The core design philosophy is **Human-in-the-Mix**: every AI output passes through Edit / Approve / Regenerate / Reject before becoming permanent. This is simultaneously a UX pattern, a COPPA compliance mechanism, and a legal liability shield. It is non-negotiable in every feature.

The platform serves five user types through five purpose-built shells: Mom (full command center), Adult (scoped view), Independent (teens), Guided (kids 8-12), and Play (young children). These are not permission layers — they are fundamentally different interfaces.

## Why 40+ PRDs Exist Before Most Code

This repository contains 40+ Product Requirement Documents that were written before building. This is intentional. The platform handles children's data, disability documentation, family finances, and sensitive relationship context. Each PRD specifies screens, interactions, data models, permission structures across all five roles, and architectural decisions with rationale.

A 97-file compliance audit was conducted before the build sprint. When it found that early code diverged from the PRDs, we rebuilt from scratch. The PRDs are the single source of truth. The corrected reference documents in `audit/` are authoritative. Old build prompts and summary documents are superseded.

**PRDs answer what and why. Build prompts answer how.** No file paths, component architecture, or session setup instructions belong in PRDs.

## Key Architectural Principles

- **Mom-first:** Every design decision serves mom's workflow first. Other roles get scoped access that ultimately serves mom's goals.
- **Family context is the differentiator:** Without context, LiLa is just another chatbot. With it, she's a partner who knows this specific family.
- **Embedding-first classification:** ~90% of routine classification uses pgvector embeddings, not LLM calls. Total AI cost: < $1.00/family/month.
- **Templates as data, not code:** Report templates, guided modes, and widget configurations are database rows, not code files.
- **Celebration only, never punishment:** Victory Recorder shows what was done, never what wasn't. No shame mechanics anywhere.

---

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
@claude/live_schema.md
@claude/conventions.md
@claude/ai_patterns.md
@claude/feature_glossary.md
@WIRING_STATUS.md
@specs/studio-seed-templates.md
@claude/PRE_BUILD_PROCESS.md

## Pre-Build Process (MANDATORY — NO EXCEPTIONS)

**Every build session must begin with this process. No code is written until the pre-build summary is complete and founder-approved.**

See `claude/PRE_BUILD_PROCESS.md` for the full ritual. The short version:

1. Read the FULL PRD for the feature being built — every word, not a skim
2. Read EVERY matching addendum in `prds/addenda/` — search for all files containing the PRD number
3. Create a feature decision file in `claude/feature-decisions/PRD-XX-FeatureName.md`
4. Create the active build file at `.claude/rules/current-builds/<build-name>.md` (no YAML `paths:` frontmatter) and populate it with the complete pre-build summary
5. Present the summary to Tenise and get explicit approval
6. Only THEN write code

This process exists because weeks of careful planning went into every PRD and addendum. Building without reading them produces wrong code. The pre-build summary is the proof the material was read — not a formality.

**The PRDs ARE the minimum. "MVP" means building exactly what the PRD says — not a simpler version of it. If you find yourself thinking "for now I'll just..." — stop. Either build it right or ask Tenise first.**

## Icon Semantics (Non-Negotiable)

- **Eye / EyeOff** = show/hide sensitive text — PASSWORDS ONLY
- **Heart / HeartOff** = include/exclude from LiLa context (`is_included_in_ai` toggle — used on EVERY context-eligible item across the entire platform)
- These two icons must never be swapped or used interchangeably. Ever.
- Filled Heart = LiLa can use this item. HeartOff = exists but not in LiLa context.
- Summary indicator on every context-source page: "LiLa is drawing from X/Y [feature-specific noun]"
- Per-group "heart all / unheart all" toggle on grouped pages (collapsible category groups)

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
11. **PRDs are the ONLY source of truth for building features.** Before writing ANY code, follow the full Pre-Build Process above. Read the FULL PRD AND every addendum in `prds/addenda/` that matches the PRD number — there are often multiple addenda per PRD and they contain decisions that override or clarify the base PRD. If two PRDs conflict, the newer one wins. Every column, every enum value, every screen, every interaction, every empty state, every visibility rule in the PRD must be implemented precisely. This platform is a Rube Goldberg machine — every piece connects, and precision is non-negotiable.
12. **Never modify files in `prds/`, `specs/`, or `reference/`.** These are read-only source material.
13. **The PRDs ARE the minimum. There is no simpler version.** Do not suggest an "MVP approach," an "easy version for now," a "simplified implementation," or any reduction of what the PRD specifies. The PRDs were designed carefully and ARE the minimum viable product — not a ceiling to aim toward later, but the floor to build from now. Every screen, every field, every interaction, every edge case in the PRD gets built exactly as written. If something in the PRD cannot be built correctly right now (missing dependency, unclear spec, infrastructure not ready), stop and ask Tenise — do not substitute a simpler version without explicit approval. Never use local regex stubs, setTimeout placeholders, hardcoded data, or "simple parsing for now" shortcuts. If a feature needs AI, connect AI. If it needs streaming, stream. If it needs a real database query, write the real query. Build it right or don't build it yet.
14. **Post-phase checklist (MANDATORY after completing each build phase):** Two parts — verification first, then file updates. Do not skip Part A.

    *Architecture note:* Active builds are tracked as one `.md` file per in-flight build under `.claude/rules/current-builds/`, with filenames like `PRD-30-safety-monitoring.md`. This folder auto-loads into every Claude Code session via Claude Code's native `.claude/rules/` recursive discovery — no `@`-reference in CLAUDE.md is required. Build files in `.claude/rules/current-builds/` **must not include YAML `paths:` frontmatter** — frontmatter with `paths:` makes a rule file path-conditional and breaks the unconditional auto-load this folder relies on.

    **Part A — PRD Verification (before anything else):**
    - Go through every requirement from the pre-build summary — every screen, every interaction, every field, every rule, every edge case
    - Assign each a status: **Wired** (built and functional), **Stubbed** (documented placeholder in STUB_REGISTRY.md), or **Missing** (not built, not stubbed)
    - Fill in the Post-Build Verification table in the active build file under `.claude/rules/current-builds/`
    - Present the completed table to Tenise — every requirement, every status
    - Zero Missing items required before the build is considered complete. Any Missing must be built or explicitly approved as a stub.
    - **Mobile/desktop navigation parity check:** if the build added or renamed any top-level page (anything that earns a sidebar entry), confirm:
      (a) The page is registered exactly once, in `getSidebarSections()` in [src/components/shells/Sidebar.tsx](src/components/shells/Sidebar.tsx) — never as a parallel hand-maintained list inside `BottomNav.tsx` or anywhere else.
      (b) Open the app in DevTools mobile viewport (375px), tap **More**, and visually confirm the new page appears in the same section, with the same label, the same icon, and in the same position as in the desktop sidebar. Both navs must read like the same map.
      (c) Tap through the new entry from the More menu and confirm it routes correctly. "I added it to the sidebar" is not sufficient — eyes-on mobile verification is required, same standard as the Visual Verification rule in `claude/PRE_BUILD_PROCESS.md`.
      (d) Note the parity check pass in the verification table (e.g. "Mobile More menu shows new page in correct section ✓").
    **Part B — File updates (after Tenise confirms verification):**
    - `BUILD_STATUS.md` — mark phase complete with date
    - `claude/live_schema.md` — regenerate via `npm run schema:dump` after migrations are applied
    - `STUB_REGISTRY.md` — add new stubs created, update wired status of existing stubs
    - `CLAUDE.md` — add any new conventions introduced by the phase
    - Add `<FeatureGuide featureKey="xxx" />` to every new page/feature
    - **Update LiLa's knowledge** — if the build added or changed any user-facing feature:
      (a) `src/lib/ai/help-patterns.ts` — add keyword patterns for "how do I use [feature]?" queries (each pattern = $0 AI cost)
      (b) `supabase/functions/_shared/feature-guide-knowledge.ts` — add page knowledge + use case recipes with warm clarifying questions so LiLa can walk mom through setup
      (c) If it was built, LiLa must know how to explain it and guide a mom through using it
    - Copy verification table into `claude/feature-decisions/PRD-XX.md`, get founder post-build sign-off
    - Move the completed build file from `.claude/rules/current-builds/` to `.claude/completed-builds/YYYY-MM/`. The folder itself is the current-state indicator; if no files remain, an `IDLE.md` placeholder should exist as the folder anchor.
    - `claude/feature-decisions/README.md` — add the new file to the index table

15. **Member colors:** Use the 44-color AIMfM palette from `src/config/member_colors.ts`. Never hardcode hex colors — use CSS custom properties with fallbacks. Run `npm run check:colors` to verify.
16. **Mobile layout:** BottomNav handles mobile navigation. No hamburger menu. Hide "Back to Dashboard" buttons on mobile (`hidden md:flex`). LiLa drawer sits above bottom nav (`bottom-14 md:bottom-0`). **Mobile/desktop nav parity is non-negotiable:** the BottomNav "More" menu MUST be built from the same `getSidebarSections(shell)` source as the desktop sidebar in [src/components/shells/Sidebar.tsx](src/components/shells/Sidebar.tsx) — never hand-maintained as a parallel list. The only allowed difference is filtering items already pinned to the bottom tab bar (`/dashboard`, `/tasks`, `/bookshelf`, `/vault`). Section names, item ordering, item labels, routes, and icons MUST match the sidebar exactly. Whenever a new top-level page is added, it MUST appear in `getSidebarSections` and will then automatically flow into the More menu — no second registration needed.
17. **PIN hashing:** All PINs are hashed server-side via `hash_member_pin` RPC (pgcrypto bcrypt). Never store plain-text PINs. Verify with `verify_member_pin` RPC.
18. **Out of Nest members:** Stored in `out_of_nest_members` table (NOT `family_members`). They are descendants and their spouses only — below mom on the family tree. No dashboard, no PIN, no feature access. Grandparents who help are Special Adults, not Out of Nest.
19. **Auto-provisioning:** The `auto_provision_member_resources` trigger creates an archive folder + dashboard_config for every new `family_members` insert. No manual creation needed.
20. **Smart Notepad:** Right-drawer workspace with Supabase-backed tabs, autosave (500ms debounce), AI auto-titling (Haiku), light rich text editor (bold/italic/bullets via tiptap). "Send to..." grid routes content to 14 destinations via RoutingStrip. "Review & Route" extracts items via ai-parse with inline editing, "Edit in Notepad", and "Save Only" options. NotepadProvider wraps MomShell. Journal's `+` button opens Notepad — Journal is NOT a direct writing surface. "Quick Note" destination routes to `journal_entries` with `entry_type = 'quick_note'`. Journal entry types follow PRD-08: `journal_entry`, `gratitude`, `reflection`, `quick_note`, `commonplace`, `kid_quips`, `meeting_notes`, `transcript`, `lila_conversation`, `brain_dump`, `custom`. Note: `learning_capture` is NOT a journal type — homeschool learning capture lives in `family_moments` (PRD-37) and `homeschool_time_logs` (PRD-28).
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
    (a) "What this will do" — A FeatureGuide-style description of the planned feature written in present-future tense. Pulled from `feature_expansion_registry.ts` description field. This shows users the vision.
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

## Archives & Context (PRD-13)

74. **Three-tier toggle system for context inclusion.** Every context item has three levels of `is_included_in_ai` control. ALL THREE must be true for an item to reach LiLa: (1) Person level — `archive_member_settings.is_included_in_ai` master switch, (2) Category level — `archive_folders.is_included_in_ai`, (3) Item level — source table's `is_included_in_ai` or `archive_context_items.is_included_in_ai`. Heart/HeartOff icon = `is_included_in_ai` toggle at every level.
75. **"Checked somewhere, checked everywhere."** Archives surfaces entries from source feature tables as live references, never copies. Toggling `is_included_in_ai` on an aggregated item (e.g., InnerWorkings entry shown in Archives) writes BACK to the source table (`self_knowledge`), not to an Archives copy. No intermediate tables for aggregation state. This convention applies to all context source tables: `self_knowledge`, `guiding_stars`, `best_intentions`, and future sources.
76. **Privacy Filtered is a HARD system constraint.** `is_privacy_filtered = true` items are NEVER included in non-mom context regardless of any toggle state. This is enforced in the context assembly pipeline, not in UI. It is not a preference — it is a system boundary.
77. **Archive folder auto-creation on member add.** The `auto_provision_member_resources` trigger creates: member_root folder, 7 system category subfolders (Preferences, Schedule & Activities, Personality & Traits, Interests & Hobbies, School & Learning, Health & Medical, General), wishlist folder, and `archive_member_settings` record. On family creation, `auto_provision_family_overview` creates: Family Overview folder + 4 section subfolders (Family Personality, Rhythms & Routines, Current Focus, Faith & Values). System folders (`is_system = true`) cannot be deleted, can be renamed.
78. **Faith preferences use individual boolean columns.** The `faith_preferences` table stores each option as a separate boolean (e.g., `prioritize_tradition`, `include_comparative`, `respect_but_dont_assume`), NOT as a single `response_approach` TEXT or `tone_settings` JSONB. PRD-13 is authoritative for this schema. Relevance setting (`automatic`/`always`/`manual`) controls when faith context appears in LiLa.
79. **Name detection in context assembly.** When a user mentions a family member by name in a LiLa conversation, the context assembly pipeline automatically loads that person's Archive context using word-boundary regex matching (StewardShip `contextLoader.ts` pattern). This makes LiLa feel like she "knows" the family without mom having to specify every time.

73. **Old build prompts are BANNED.** The 42 files in `archive/old-build-prompts/` were generated from a bad schema summary and are POISONED. Never reference, read, or use them. For every remaining feature, read the FULL PRD in `prds/` (and any addenda in `prds/addenda/`) before writing any code. This supersedes any workflow that previously relied on build prompt files.

## AI Vault (PRD-21A)

80. **AI Vault** is the browsable content catalog; **AI Toolbox** (PRD-21) is the personalized per-member launcher. Vault = storefront. Toolbox = personalized view. Only `ai_tool` and `skill` type items can be added to Toolbox.
81. **Content types:** `'tutorial'`, `'ai_tool'`, `'prompt_pack'`, `'curation'`, `'workflow'`, `'skill'`. The value `'curation'` replaces `'tool_collection'` per PRD-21B addendum. Platform-specific tools (GPTs, Gems, etc.) are `ai_tool` with `platform` metadata, not separate content types.
82. **Two-layer titles:** `display_title` (hook, visible to ALL including non-subscribers) + `detail_title` (clear, visible only to tier-authorized users). Hook titles sell the outcome; detail titles reveal the method.
83. **Two-layer descriptions:** `short_description` (visible on card) + `full_description` (detail view, tier-gated).
84. **Prompt format determines rendering:** `image_gen`/`video_gen` → gallery mode (masonry grid), `text_llm`/`audio_gen` → list mode (expandable cards). Parent-child model: `vault_items` holds the pack, `vault_prompt_entries` holds individual prompts.
85. **Content protection:** No text selection on prompt content. Copy only via CopyPromptButton. All copies logged to `vault_copy_events`. Soft rate limit (20/60min). Prompt text loaded on-demand. Right-click disabled on images.
86. **NEW badge:** Per-user first-seen tracking via `vault_first_sightings`, NOT upload date. Default 30-day countdown from first sighting.
87. **Locked content:** Visible in browse with faded overlay + tier badge. Hook title and short_description always visible. Full description and content gated by tier.
88. **"+Add to AI Toolbox"** creates `lila_tool_permissions` records with `source = 'vault'` and `vault_item_id`. Only available on `ai_tool` and `skill` content type items.
89. **Delivery methods for AI tools:** `native` (LiLa conversation modal via guided_mode_key), `embedded` (iframe), `link_out` (new tab). Native tools use `container_preference: 'modal'`.
90. **Learning ladder** (`fun_creative`, `practical`, `creator`) is internal content strategy metadata, NOT a user-facing filter. Not connected to tiers.
91. **`vault_items` replaces V1's `library_items`.** All V1 library_ prefixed tables are superseded.

## ThoughtSift (PRD-34)

92. **ThoughtSift = 5 separate tools, NOT one tool with sub-modes.** Each has its own guided mode key (`board_of_directors`, `perspective_shifter`, `decision_guide`, `mediator`, `translator`), Edge Function, system prompt, model tier, and Vault listing.
93. **Board of Directors uses sequential per-advisor Sonnet calls.** Each response attributed via `lila_messages.metadata.persona_id`. 3 default seats, 5 max. Each advisor call receives full history INCLUDING prior advisor responses from the current turn.
94. **Translator uses Haiku, is single-turn.** Saves to `lila_messages` for history but does not use conversation continuity. No emoji in tone labels or output text.
95. **Mediator supersedes `relationship_mediation` (PRD-19).** Mode key `relationship_mediation` was never created. Feature key `archives_relationship_mediation` maps to the Mediator's Full Picture context mode. Full Picture is restricted to `primary_parent` role only.
96. **Mediator safety exception is mandatory.** Once triggered (fear, harm, coercive control, isolation, threats), `safety_triggered` flag is persisted to `lila_conversations.context_snapshot`. Checked from DB on every turn. Framework coaching does NOT resume in that session. Flag survives close/reopen.
97. **Board of Directors `personal_custom` personas NEVER enter the platform intelligence pipeline.** `persona_type` check required before any pipeline write. Hard rule, no exceptions.
98. **Perspective Shifter family-context lenses: synthesize context, never quote source items.** Privacy rule enforced in Edge Function code (`synthesizeFamilyContext()`), not just system prompt. Dual enforcement.
99. **Persona caching (P8 pattern): always check `board_personas` by name (case-insensitive) before generating a new public persona.** One generation cost per persona, amortized across all future users.
100. **Prayer Seat = special `board_session_personas` record with `is_prayer_seat=true`.** No AI responses generated for this seat. Reflection questions generated FRESH per session by Sonnet using the user's specific situation — never canned.
101. **Persona disclaimer shown exactly ONCE per session for non-personal personas.** Tracked via `disclaimer_shown` boolean on `board_sessions`. "AI interpretation of [Name]... not endorsed... read their actual work."
102. **Content policy gate runs BEFORE persona generation.** Haiku pre-screen (separate call from Sonnet generation). Three outcomes: deity → Prayer Seat redirect, blocked figure → hard block, harmful description → prompt to revise. Applies to ALL persona types including `personal_custom`.
103. **Decision Guide: 15 named frameworks in `decision_frameworks` table.** LiLa suggests based on decision type or user picks from list. Framework's `system_prompt_addition` loaded from DB and appended to system prompt. Coin flip insight = LiLa interjection during indecision (3+ turns), offered once, never pushed.
104. **All ThoughtSift conversations pass through PRD-30 safety monitoring pipeline.** No new safety infrastructure needed. Crisis override is global.
105. **ThoughtSift tools live in AI Vault as 5 separate items.** No default family member assignments. Mom assigns via "+Add to AI Toolbox."

## Calendar (PRD-14B)

106. **Calendar date storage uses separate fields:** `event_date DATE` + `start_time TIME` + `end_time TIME` + `end_date DATE`. NULL times = all-day event. Simpler for date queries than combined TIMESTAMPTZ. The build spec's combined TIMESTAMPTZ approach is superseded.
107. **Calendar page defaults to Month view; dashboard widget defaults to Week view.** The full page is the big-picture view. The widget shows "what's happening this week."
108. **Click any date on any calendar view opens DateDetailModal** as a transient modal overlay. Calendar stays visible behind it. Consistent across Month/Week/Day views. No page navigation on date click.
109. **Calendar recurrence uses Universal Scheduler output.** `recurrence_details JSONB` (RRULE format) + `recurrence_rule TEXT` (quick-filter enum: 'daily', 'weekly', 'monthly', 'yearly', 'custom', 'none'). No individual recurrence columns (`recurrence_type`, `recurrence_interval`, `recurrence_days` etc. are redundant). EventCreationModal passes `showTimeDefault={true}` to the scheduler.
110. **11 system event categories:** Learning (not School), Sports, Medical, Family, Social, Faith, Music & Arts, Travel, Celebration, Work, Other. System categories have `family_id IS NULL`. Category is `category_id UUID` FK (not a text slug column).
111. **Events by mom auto-approved.** Events by members in `calendar_settings.auto_approve_members` UUID[] auto-approved. All others `pending_approval`. Pending rendering: faded/gray, dotted border, "pending" badge. Full color on approval.
112. **Task due dates surface on calendar via direct query from `tasks` table.** NO duplication into `calendar_events`. Distinct checkbox icon, slightly muted style. Mom can inline edit task due dates from calendar (full permission); members can only edit due dates on tasks they created themselves.
113. **`items_to_bring` is JSONB** with structure `[{text: string, checked: boolean, ai_suggested: boolean}]` — not a simple text array. Checkable state for packing. `transportation_notes TEXT` (not `transportation_details`).
114. **Calendar Settings stores:** `default_drive_time_minutes INTEGER DEFAULT 30`, `required_intake_fields JSONB DEFAULT '[]'`, `auto_approve_members UUID[]`, `week_start_day INTEGER DEFAULT 0`. Mom configures which fields are mandatory for kid events.
115. **Week start day is configurable** (Sunday=0 or Monday=1). Stored in `calendar_settings.week_start_day`. Respected by: Calendar page grid, Dashboard widget grid, WeekdayCircles, MiniCalendarPicker, Universal Scheduler calendar preview.
116. **MiniCalendarPicker is a shared component** (`src/components/shared/MiniCalendarPicker.tsx`). Compact month grid with clickable month name dropdown + editable year text field + prev/next arrows + Today button. Used by Calendar page toolbar, DateDetailModal header, Dashboard widget, and Universal Scheduler calendar preview.
117. **Universal Scheduler redesigned to radio-button primary interface** ("How Often?"). One-Time, Daily, Weekly, Monthly, Yearly as top-level radio buttons with inline detail pickers. Custom expands to full scheduling power. Supersedes the NO/YES toggle interface. See `specs/Universal-Scheduler-Calendar-Consolidated-Update.md`.

## Multi-Person Assignment Pattern (Any/Each)

118. **When assigning any completable item to 2+ people, show the Any/Each toggle.** Two modes: "Any of them" (shared — one record, anyone can complete, credit shows who did it) and "Each of them" (individual — separate record per person, each completes independently). Toggle appears as a segmented control with inline description of the active mode when 2+ people are selected.
119. **Member selection uses compact colored pill buttons.** First name only, member's `assigned_color` as fill (selected) or border (unselected), wrapping flex layout. "Everyone" pill selects all. Replaces full-width checkbox rows everywhere members are assigned. This pattern applies to: TaskCreationModal, EventCreationModal attendees, meetings/agenda items (PRD-16), list sharing (PRD-09B), trackers (PRD-10). Exceptions: Guided Forms (always "each" — worksheets are personal), Vault tool permissions (always "each" — per-member access).
120. **Default assignMode varies by feature.** Tasks/routines/trackers default to "each" (most common: everyone does their own). Calendar events default to shared (one event, multiple attendees). Meetings default to shared. The `assignMode: 'any' | 'each'` field on creation data drives the save logic; `is_shared: boolean` on the record flags the mode for display.

## Guided Dashboard (PRD-25)

122. **Guided Dashboard section keys:** `'greeting'`, `'best_intentions'`, `'next_best_thing'`, `'calendar'`, `'active_tasks'`, `'widget_grid'`, `'celebrate'`. All are valid section key constants.
123. **Guided sections that CANNOT be hidden by mom:** `'greeting'`, `'next_best_thing'`, `'best_intentions'`. Mom can hide all others.
124. **Bottom nav for Guided shell:** Home, Tasks, Write, Victories, Progress. "Write" opens the Write drawer (right-side slide-in), NOT a page navigation.
125. **Write drawer is the Guided shell's upgraded notepad.** Three tabs: Notepad, Messages, Reflections. Reflections tab hidden when reflections not enabled. Messages tab is a stub until PRD-15.
126. **Next Best Thing suggestion priority order:** overdue > active routine > time-block > mom-priority > next due > opportunities > unscheduled > best intention reminder. Deterministic, not random. AI glaze is Haiku-class, cached per suggestion per session.
127. **Best Intentions for Guided members:** mom creates/manages. Child can also create when `child_can_create_best_intentions = true`. Child creation includes coaching helper text.
128. **Family Best Intentions also appear on Guided dashboard** with "family" badge.
129. **Reading Support** is a per-member setting in `dashboard_configs.preferences.reading_support_enabled`, NOT a separate dashboard mode. Adds TTS icons, larger font, icon pairing.
130. **Spelling & Grammar Coaching:** 3-tier lookup (static JSON > `spelling_coaching_cache` table > Haiku AI). Globally cached. AI results write back to cache for everyone. Mom toggle controls whether explanations show.
131. **"Send To..." routing in Write drawer:** Journal, Homework (`entry_category = 'homework'`), Message (stub), Task Note. Homework is the first brick in the PRD-37 > PRD-28B portfolio pipeline.
132. **Graduation (Guided > Independent):** tracked via `graduation_tutorial_completed` preference flag. Full ceremony is Post-MVP.
133. **All Guided dashboard content is visible to mom.** TransparencyIndicator placed on Best Intentions, Write drawer Notepad, and Write drawer Reflections.
134. **View As renders full GuidedDashboard** for Guided members. Mom can interact with `useActedBy` attribution.
135. **Guided Tasks page shows 2 tabs only** (My Tasks, Opportunities). No task creation for Guided members. No filter bar.

## Messaging, Requests & Notifications (PRD-15)

136. **Three-level messaging architecture:** Conversation Spaces → Conversation Threads → Messages. Spaces are persistent containers (`space_type` is one of `direct`, `group`, `family`, `content_corner`, `out_of_nest`). Threads are topics within spaces. Messages are individual chat entries. Never collapse these into a flat feed.
137. **`message_type` enum distinguishes display treatment:** `user`, `lila`, `system`, `content_corner_link`. LiLa messages get a distinct "L" avatar in the brand color and a tinted bubble (`color-mix(brand 12%, secondary)`). System messages render centered, italic, no bubble. Content Corner links render as `LinkPreviewCard`s in the Content Corner space, never as chat bubbles.
138. **LiLa is NEVER automatically present in conversations.** She only responds when explicitly invoked via "Ask LiLa & Send" (Sparkles icon button on the LEFT side of the text input — never near Send to avoid accidental taps). Auto-titling is the only background LiLa action allowed in messaging.
139. **Message coaching is a before-send checkpoint, never a blocker.** "Send Anyway" is always available alongside "Edit". Coaching adapts to sender-recipient relationship dynamic (parent→child, teen→parent, sibling→sibling all get different tone). Rapid-fire bypass: coaching skips after the first message in a 60-second burst. Mom sees that coaching was triggered, never the message content.
140. **Messaging permissions are explicit `member_messaging_permissions` records** per member-pair. Mom and Dad have IMPLICIT permission to message anyone (checked at the application layer, not stored as records). Kids need explicit per-pair records. RLS enforces space membership separately.
141. **Mom CANNOT read other members' messages.** She controls WHO communicates and WHAT coaching is active, but message content between other members is private. RLS enforces this — mom only sees messages in spaces where she is herself a member. Coaching activity log shows that coaching fired, never the draft content.
142. **Out of Nest members live in `out_of_nest_members`, NOT `family_members`.** They have no family tools, no PIN, no role, no shell — only designated conversation spaces and email notifications. Adding them via `family_members` is wrong and pollutes the core member table.
143. **Notifications use a single `notifications` table** with `notification_type` (specific) and `category` (filterable: messages, requests, calendar, tasks, safety, lila). Category drives preference filtering. Safety alerts are `priority='high'` and ALWAYS bypass Do Not Disturb — non-negotiable.
144. **NotificationBell lives in shell headers** (Mom, Adult, Independent only — never Guided/Play). Reuses `BreathingGlow` when unread > 0. Bell shows "what happened" (awareness). Queue Modal shows "what needs your decision" (action). They are architecturally distinct surfaces and BOTH must exist.
145. **Requests are NOT studio_queue items.** They have their own lifecycle and live in `family_requests`. Universal Queue Modal Requests tab handles them. Accept offers a simplified routing strip (Calendar, Tasks, List, Acknowledge). "Discuss" creates a conversation thread titled `Regarding: {request.title}`. `family_requests.source` includes `'mindsweep_auto'` for PRD-17B cross-member routing.
146. **Universal Queue Modal has 3 tabs only:** Calendar, Sort (tasks), Requests. Plus a chat shortcut button at the bottom for one-tap messaging access while processing the queue. Messages do NOT get a Queue Modal tab — they have their own sidebar home at `/messages`.
147. **Content Corner is a special `conversation_spaces` row** with `space_type='content_corner'`. Links are `messages` rows with `message_type='content_corner_link'` and URL metadata in `metadata` JSONB (`url`, `domain`, `title`, `thumbnail_url`). Lock state: members can ADD links while locked but cannot VIEW them until `content_corner_locked_until` passes (mom always sees). Two render modes: Feed (chronological) and Playlist (sequential with Previous/Next).
148. **LiLa auto-titles conversation threads** after the first reply via `auto-title-thread` Edge Function (Haiku, 3-6 words, fire-and-forget). Titles are always inline editable on `conversation_threads.title`. Family Communication Guidelines stored in `messaging_settings.communication_guidelines` are loaded into LiLa's context for ALL in-conversation responses and coaching interactions.

## Studio Intelligence & Universal Creation Hub (PRD-09A/09B Studio Intelligence Phase 1)

149. **Studio is the universal creation and library surface.** Created items display on whatever page makes sense for the user's mental model, regardless of underlying storage. Sequential collections are visible on both Tasks → Sequential tab AND the Lists page. The original three-page model (Studio → Tasks → Lists) is a deployment architecture, not a user-facing constraint. This is a deliberate evolution from PRD-09A line 469; documented in `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md`.
150. **Sequential collections are creatable from three entry points and ONLY through `SequentialCreatorModal`.** Studio → Sequential Collection [Customize], Tasks → Sequential tab → [+ Create], and Lists → [+ New List] → "Sequential Collection" tile all open the same modal, which wraps `SequentialCreator` and calls `useCreateSequentialCollection`. Never route sequential creation through `TaskCreationModal`.
151. **`createTaskFromData()` has a guard clause for `taskType='sequential'` — it must never silently create a broken single-row task.** The guard throws a loud error. `TaskCreationModal` also skips `initialTaskType='sequential'` with a `console.warn`. Both layers exist defensively to prevent regression of the bug that left `sequential_collections` at 0 rows in production until 2026-04-06.
152. **Standalone sequential tasks (task row with `task_type='sequential'` and no `sequential_collection_id`) are not a valid state.** Every sequential item is created through `useCreateSequentialCollection`, which guarantees a parent row plus N children. Any legacy orphans from the pre-Phase-1 broken period are ignored by the UI.
153. **All Studio template types have `capability_tags: string[]`** on the `StudioTemplate` type (required, not optional — forgetting tags is a compile error). Tags describe what a template DOES, not what it IS, and are the data foundation for Phase 2's intent-based Studio search and future LiLa creation guidance. Tag vocabulary is authoritative in `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` §1D.
154. **`SequentialCollectionCard` is the exported reusable primitive** for rendering a single sequential collection on any surface. Lists page renders it inside a back-button wrapper; Tasks → Sequential tab renders it via `SequentialCollectionView`. Never duplicate the card logic.
155. **Randomizer creation is accessible from two paths:** Lists page [+ New List] type picker (direct) and Studio → Randomizer [Customize] → `/lists?create=randomizer` (URL-param nav). Both resolve to the same `lists` row with `list_type='randomizer'`.
156. **Sequential collections surface on the Lists page ONLY when `filter === 'all'`.** They don't belong to a specific list_type filter, and the archived filter has its own lifecycle. Specific-type filters (shopping, wishlist, etc.) hide them to keep the filter semantics clean.

## Linked Steps, Mastery & Practice Advancement (PRD-09A/09B Build J, 2026-04-06)

157. **Linked routine steps use the `step_type` enum on `task_template_steps`** (values: `static` default / `linked_sequential` / `linked_randomizer` / `linked_task`). Source content is resolved at render time from the linked source, NOT copied into the step. Routine step completion is daily; linked source advancement is cumulative and independent. Linked steps inherit their parent section's frequency schedule.
158. **Sequential advancement modes are per-item with collection-level defaults (bulk-set-then-override).** Three modes on `tasks.advancement_mode`: `complete` (existing behavior, default), `practice_count` (N completions auto-advance), `mastery` (practice + optional approval gate). `sequential_collections.default_*` columns propagate to new items on create; `useCreateSequentialCollection` accepts per-item overrides. Randomizer items (`list_items`) get the same 10 advancement columns for parity.
159. **`practice_log` is the unified cross-source practice session log.** For sequential items, `useLogPractice` dual-writes to BOTH `practice_log` AND `task_completions` (with `completion_type='practice'`) so the existing per-task audit view stays accurate. For randomizer items it writes ONLY to `practice_log` (list_items has no task_completions parent). `task_completions` continues to handle standard task completion/approval flows.
160. **Mastery rejection resets `mastery_status` to `'practicing'`, NOT `'rejected'`.** The child continues practicing; rejection note is preserved as audit history in `practice_log.rejection_note` and the `task_completions` row. This is different from standard task rejection which sets task status back to `pending`. For sequential: `useRejectMasterySubmission`. For randomizer: same hook with `sourceType='randomizer_item'`.
161. **Sequential mastery approvals reuse the existing `PendingApprovalsSection` in Tasks.tsx (line 1062) by detecting `completion_type='mastery_submit'`** on task_completions rows. It forks to `useApproveMasterySubmission` / `useRejectMasterySubmission` instead of the standard approve/reject hooks. Randomizer mastery approvals surface on the Lists detail view per-list via `RandomizerMasteryApprovalInline` — a unified cross-source mastery queue is explicitly NOT built.
162. **Randomizer draw modes are list-level configuration** (`lists.draw_mode`, randomizer-only; NULL for other list types): `focused` (1 active, manual draw, locks on selection), `buffet` (N active via `max_active_draws`, slots open on completion), `surprise` (auto-draw on routine instance generation via `useSurpriseMeAutoDraw`, uses smart-draw weighting). Mom configures via `DrawModeSelector` in the Lists detail settings panel.
163. **Surprise Me is deterministic per day.** UNIQUE partial index on `randomizer_draws(list_id, family_member_id, routine_instance_date) WHERE draw_source='auto_surprise'` guarantees exactly one auto-draw per member per list per day. Refresh shows the same item — that's the feature, not a bug. Mastered randomizer items exit the pool permanently via `list_items.is_available = false`; `is_repeatable` is ignored for mastery items.
164. **Reading List is a Studio template (`ex_reading_list`), not a new list type.** It opens `SequentialCreatorModal` with `initialDefaults: { defaultAdvancementMode: 'mastery', defaultRequireApproval: true, defaultTrackDuration: true }`. Sequential collection with mastery + duration tracking + active_count=1 + manual promotion. Tracked via `sequentialTemplateId` state in Studio.tsx.
165. **The `curriculum-parse` Edge Function is dedicated (NOT a reuse of `ai-parse`).** Per the "each AI tool gets its own Edge Function" convention confirmed in Build H. Haiku via OpenRouter, Zod-validated input/output, cost logging. Follows the task-breaker code pattern exactly. UX pattern matches RoutineBrainDump (paste → parse → Human-in-the-Mix review → accept) but the code path is separate. Never saves without mom's explicit accept.
166. **`tasks.resource_url` is the dedicated URL column for sequential items** (and task_type='task' in general). `image_url` is NO LONGER overloaded for sequential item URLs. `useCreateSequentialCollection` writes URLs to `resource_url`; a backfill in migration 100105 copies existing `image_url` values where they look like URLs.
167. **The badge/award program pattern ("pick N of M with required items") is deferred to BigPlans (PRD-29).** `curriculum-parse` detects the pattern in `detected_metadata.pick_n_of_m` as informational only — lists are still created flat. Multi-list milestone completion logic belongs in a BigPlans container, not in a single sequential list.

## Rhythms (PRD-18 Phase B)

168. **Rhythm section seeds follow the "front door OR genuinely helpful" rule.** A section earns its place in a default seed only if it's a front door to engagement with another part of the app (writes data, opens flows, captures intent), OR if it's genuinely helpful in a way no other surface delivers. Pure display of data the user already sees on the dashboard is filler — cut it. This rule killed `task_preview` from the adult/Guided morning seed in migration 100111 (it duplicated the dashboard's Active Tasks section). Section types stay in the registry as available for custom rhythm building, but they don't ship in default seeds. Calendar Preview KEEPS its place because it's a front door to calendar context (tappable to /calendar) AND provides at-a-glance consciousness of the day in a way pure passive display doesn't.

169. **Tomorrow Capture writes are batched on Close My Day, never mid-flow.** `EveningTomorrowCaptureSection` stages items in `RhythmMetadataContext` (a ref-backed modal-scoped store, not React state — section components write into it without re-rendering the modal). On Close My Day, `RhythmModal.handleComplete` reads the staged metadata, calls `commitTomorrowCapture` to bump matched tasks to `priority='now'` and create new `tasks` rows with `source='rhythm_priority'`, then writes the `rhythm_completions` row with the enriched `metadata.priority_items` array. If commit fails, the completion is NOT written and the user can retry — prevents orphaned staged state.

170. **Fuzzy task matching is bespoke, no library.** `src/lib/rhythm/fuzzyMatchTask.ts` combines Jaccard similarity on tokenized words (≥ 0.55) with substring coverage (≥ 0.7). ~150 lines. No `fuse.js`, no `fuzzysort`. Tunable thresholds exported as constants. Calibrated for "did mom likely mean this existing task" — not for general fuzzy search.

171. **Carry forward fallback runs hourly via pg_cron → Edge Function → per-family timezone midnight check.** `process-carry-forward-fallback` is invoked every hour at `:05` (offset from `mindsweep-auto-sweep` at `:00`). The Edge Function loads all families, computes the current hour in each family's timezone via `Intl.DateTimeFormat`, and only processes members whose local hour === 0. Per-task `carry_forward_override` takes precedence over member default in `family_members.preferences.carry_forward_fallback`. Default is `'stay'` (ADHD-friendly — no nightly decision burden). Backburner fallback reuses the MindSweep pattern (find list by `owner_id + list_type='backburner'`, insert into `list_items`, soft-delete the task).

172. **Closing Thought auto-hides when the member has fewer than 5 active Guiding Stars.** Threshold rule (`MIN_POOL_SIZE_FOR_BEDTIME_ROTATION = 5` in `ClosingThoughtSection.tsx`). Below 5, reading the same 1-3 stars at bedtime feels redundant when the morning rotation already showed them. Above 5, the pool is deep enough that bedtime feels like rediscovery. Self-tunes — sparse libraries don't see it, rich libraries do. No mom configuration needed.

173. **Calendar Preview scope is per-section config, not per-shell logic.** `rhythm_configs.sections[*].config.scope` is `'family'` (default) or `'member'`. Family scope shows all family events; member scope filters to events the member is an attendee on (PLUS family-wide events with no specific attendees). Adult/Independent morning seed uses `'family'` (mom needs to see everything). Guided morning seed uses `'member'` (kids see only events involving them). Mom can flip via Rhythms Settings without code changes.

174. **Weekly/Monthly reflection prompts are frontend constants, NOT `reflection_prompts` rows.** `WeeklyReviewCard` has a hardcoded array of 10 weekly-specific questions, picked deterministically per member per week via `rhythmSeed(memberId, 'weekly_review:prompt', weekStart)`. Answers write to `journal_entries` with `tags=['reflection','weekly_review']` directly. Rationale: avoids bloating `reflection_prompts` (which is for daily prompts), keeps weekly content easy to edit, and uses the existing journal pipeline for storage + visibility.

175. **`tasks.source` includes `'rhythm_priority'`** for tasks auto-created from Evening Tomorrow Capture. Distinguishes rhythm-created tasks from formally-created ones, enables Morning Priorities Recall to render as its own section, and lets future analytics measure how many of mom's tasks come from intentional evening capture vs. ad-hoc creation.

176. **Backlog prompt banner is a conditional banner at the top of the evening modal, NOT a section type.** When the carry-forward Edge Function detects a member has ≥ `carry_forward_backlog_threshold` tasks older than 14 days AND the last prompt was outside the frequency window, it marks the next pending evening completion with `metadata.backlog_prompt_pending=true`. `RhythmModal` renders `BacklogPromptBanner` above the section list when that flag is set. [Start sweep] links to `/tasks?filter=overdue` and [Not now] both write `last_backlog_prompt_at` so the prompt doesn't re-fire.

177. **Encouraging messages for Guided morning are a 20-string frontend constant pool with `{name}` substitution.** `GuidedEncouragingMessageSection` picks one via date-seeded PRNG so the same kid sees the same message all day, rotates at midnight. When PRD-05 day-data context lands, the component can swap `pickOne()` for a Haiku call without changing the interface — but the static pool is the default and ships now.

178. **Periodic rhythm cards (Weekly/Monthly/Quarterly) render inline inside Morning Rhythm via `PeriodicCardsSlot`, NOT as their own dashboard cards.** Each card writes its own `rhythm_completions` row when the user marks it done (with the appropriate period string: `YYYY-W##` / `YYYY-MM` / `YYYY-Q#`). After completion, `PeriodicCardWrapper` queries the period-specific completion and hides the card until the next period. Quarterly Inventory uses `lifelantern_staleness` trigger which is a stub until PRD-12A — for Phase B it always shows when enabled.

179. **`GuidedDashboard.tsx` renders both morning AND evening rhythm cards at position 0**, OUTSIDE the data-driven section system. Same pattern as the adult Dashboard. Auto-managed — never reorderable, never hideable. Each card self-hides when outside its time window AND has no completion record. Phase A only wired the evening card — Build K added the morning card. Coexists with the Celebrate button which still launches DailyCelebration overlay separately.

180. **MindSweep-Lite reuses the existing `mindsweep-sort` Edge Function — no new "lite" classifier.** The "Lite" name refers to the embedded UX (collapsed inline section in the evening rhythm, text-only input, batched commit on Close My Day), NOT to a simplified classification pipeline. The full `mindsweep-sort` destination set (11+ destinations: task, list, calendar, journal, victory, guiding_stars, best_intentions, backburner, innerworkings, archives, recipe) is available. Phase C added `'rhythm_evening'` to the function's `source_channel` enum. Aggressiveness is always `'always_ask'` so nothing auto-routes — items stage in `RhythmMetadataContext` via `stageMindSweepItems` and commit on Close My Day via `commitMindSweepLite`.

181. **`release` is a frontend-only override disposition on MindSweep-Lite.** Haiku never suggests it. The user manually overrides any classified item to Release to acknowledge a thought without creating a record. Preserved in `rhythm_completions.metadata.mindsweep_items` with `created_record_id=null`. This is the only disposition unique to MindSweep-Lite vs full MindSweep — and it lives entirely in the frontend (override UI + commit-time skip), never in the Edge Function.

182. **`commitMindSweepLite` is a deliberate mirror of `routeDirectly` from `useMindSweep.ts`, not a reuse.** Per-item try/catch with `commit_error` recorded on the item means partial failures do NOT block rhythm completion. Every non-release item gets `source='rhythm_mindsweep_lite'` attribution on the created task OR `content_details.source_context='rhythm_evening'` in the studio_queue fallback. Direct destinations (journal, victory, guiding_stars, best_intentions, innerworkings, backburner) write directly; queue destinations (calendar, archives, recipe, list when no shopping list exists) fall back to `studio_queue`.

183. **Morning Insight generates query embeddings on-the-fly via the dedicated `generate-query-embedding` Edge Function.** Not a reuse of `embed` (which is queue-driven) or `bookshelf-search` (which uses the pre-Phase-1 `match_bookshelf_extractions` RPC). `generate-query-embedding` is a 40-line wrapper around OpenAI text-embedding-3-small that returns the 1536-dim vector. Morning Insight calls it twice: once on mount with the question text (passive matches), and once on debounced user response (active matches). Both feed into `match_book_extractions` RPC (migration 100092) which queries `platform_intelligence.book_extractions` with a 0.3 similarity threshold.

184. **Feature Discovery frequency gate uses a 3-days-per-ISO-week PRNG pick**, not a rhythm_completions counter. `pickN([0..6], 3, rhythmSeed(memberId, 'morning:feature_discovery_days', today, thisWeekIso))` picks 3 day numbers for the current ISO week; if `new Date().getDay()` isn't in the picked set, the section returns null. Same member sees the same 3 days all week; rotates next week. Simpler than metadata tracking and guarantees "at least one discovery-free day per week."

185. **Feature Discovery pool is a TypeScript constant** in `src/lib/rhythm/featureDiscoveryPool.ts`, not a DB table. 12 initial entries targeting features that already exist today. Each entry carries `audiences: ('adult' | 'teen')[]` — Phase C populates adult-only; Phase D adds teen-specific entries. `engagement_event_types` + `engagement_source_tables` per entry drive the "already discovered" query against `activity_log_entries` in the last 14 days.

186. **Feature Discovery dismissals are permanent per member** via `feature_discovery_dismissals` table. A dismissed feature never resurfaces for that member. Matches Enhancement Addendum decision 17.

187. **Rhythm Tracker Prompts reads `dashboard_widgets.config.rhythm_keys TEXT[]`** — a runtime JSONB sub-field, not a schema column. A widget surfaces in a rhythm if its `config.rhythm_keys` array contains that rhythm's key. Mom configures via the "Show in rhythms" multi-select section in `WidgetConfiguration.tsx`. The section uses Supabase's `.contains('widget_config', { rhythm_keys: [rhythmKey] })` which translates to the `@>` JSONB operator. Phase C ships link-only rendering (tap → go to dashboard); inline data entry per widget type is a polish pass.

188. **Phase C is adult-only across all four enhancements.** Teen MindSweep-Lite framing, teen morning insight question pool (15 teen-specific questions), teen feature discovery pool prioritization, and teen framing language across sections are all Phase D scope. Phase D forks section components on `memberRole='independent'` (or passes an `audience='teen'` prop) to add teen-specific branches. Phase C builds clean adult-only implementations to keep concerns separate.

189. **Rhythm audience is derived at render time from `family_members.dashboard_mode`, not stored on `rhythm_configs`.** `RhythmDashboardCard` reads the rendered member's dashboard_mode via `useFamilyMembers(familyId)` + `.find(m => m.id === memberId)` and derives `audience: RhythmAudience = dashboard_mode === 'independent' ? 'teen' : 'adult'`. The audience prop flows `RhythmDashboardCard → RhythmModal → SectionRendererSwitch → section components`. Per-section framing can ALSO be set via `rhythm_configs.sections[*].config.framingText / .variant / .audience` — the renderer reads config first, then falls back to the audience-derived default. This means future mom customization via Rhythms Settings can override framing without code changes, and members who change dashboard_mode (Guided → Independent → Adult) instantly get the right rhythm variant without a migration.

190. **Teen rhythm display names are "Morning Check-in" and "Evening Check-in"**, not "Morning Rhythm" and "Evening Rhythm" (adult names). Stored in `rhythm_configs.display_name` at seed time by the `ELSIF NEW.dashboard_mode = 'independent'` branch of `auto_provision_member_resources`. Small signal but important: the rhythm should feel like the teen's own thing, not "mom's productivity system."

191. **Teen morning is 7 sections, teen evening is 8 sections; teen `reflection_guideline_count=2` by default.** Teen morning omits `task_preview` (per Phase B front-door rule — the dashboard already shows Active Tasks) AND `brain_dump` (teens dump in evening MindSweep-Lite, not morning). Weekly/Monthly/Quarterly rhythms are NOT teen-differentiated in Phase D — teens get identical periodic rhythms to adults. Mom can override `reflection_guideline_count` per-teen via Rhythms Settings (founder overrides her own teens to 3).

192. **Teen MindSweep-Lite uses 5 dispositions and a SEPARATE component (`MindSweepLiteTeenSection.tsx`), not a prop-forked version of the adult section.** The 5 dispositions are Schedule (= `task` backend) / Ask someone (= `family_request` backend, **Build N.2 addition**) / Journal about it (= `journal` backend with teen tag) / Talk to someone (= `talk_to_someone` backend, private journal note) / Let it go (= `release` backend). Teen override dropdown hides adult-only dispositions (guiding_stars, best_intentions, victory, innerworkings, list, calendar, archives, recipe, backburner) but DOES include `family_request` because Build N.2 made "Ask someone" a teen opt-in disposition for sending real outbound requests through PRD-15. The teen section uses `adultDestinationToTeenDisposition(classifierDest, crossMemberAction)` at display time to translate the classifier output into the teen vocabulary — `mindsweep-sort` stays platform-level and teen-agnostic. Adults use `MindSweepLiteSection`, teens use `MindSweepLiteTeenSection`; the `SectionRendererSwitch` forks on `config.audience === 'teen' || audience === 'teen'`.

193. **`talk_to_someone` disposition NEVER writes to `family_requests`.** It writes a PRIVATE `journal_entries` row with content prefixed `"Reminder to talk to [Name] about: [text]"` (or `"Reminder to talk to someone about: [text]"` if no recipient was detected), `visibility='private'`, `tags=['rhythm_mindsweep_lite','talk_to_someone']`. This is a founder-critical rule from Phase D sign-off (2026-04-07): teen delegation is a private self-reminder, adult delegation is an outbound cross-member write, and the two MUST NEVER share a code path. The `commitMindSweepLite` adult wrapper logic that auto-downgrades `family_request` → `task` when recipient is missing does NOT apply to `talk_to_someone` — teen items gracefully degrade to `"Reminder to talk to someone about: ..."` content instead.

194. **Teen morning insight questions live in `morning_insight_questions` with `audience='teen'`** — 15 hand-authored questions across Identity & Growth × 5, School & Learning × 4, Relationships & Social × 3, Life & Future × 3 (migration 100114). The `useMorningInsightQuestions(audience, familyId)` hook already filters by audience; `MorningInsightSection` takes an `audience` prop that defaults to `'adult'` and is overridden by either `section.config.audience` (seeded by the teen trigger branch) or the derived `audience` prop from dashboard_mode.

195. **Teen Feature Discovery pool uses `audiences: ['teen']` for teen-only entries**, `audiences: ['adult','teen']` for shared entries. Phase D adds 3 teen-only entries (`bookshelf_for_school`, `thoughtsift_translator_teen`, `journal_tagged_teen`) with school-use framing alongside the 12 shared entries. Engagement exits share source_tables across adult + teen variants so a teen who uploads any book exits BOTH the generic `bookshelf_upload_first` AND the teen `bookshelf_for_school` nudges simultaneously. Dynamic book-title injection ("Your library has [title]") is deferred post-MVP.

196. **Adult Phase C code paths are frozen for Phase D — Phase D adds variants alongside, never forks in place.** `MindSweepLiteSection.tsx`, adult `commitMindSweepLite` cases, `MorningInsightSection` adult-default behavior, and `FeatureDiscoverySection` adult defaults are all untouched. New teen component (`MindSweepLiteTeenSection.tsx`), new commit case (`talk_to_someone`), new optional props (`audience`, `variant`, `title`, `framingText`) with adult-default fallbacks. Principle: if you find yourself adding `if (audience === 'teen') { ... }` branches inside an existing adult component beyond a simple string fallback, stop and build a sibling component instead.

197. **Teen `family_request` disposition is OPT-IN ONLY — the classifier never auto-suggests it (Build N.2).** Cross-member detection in `mindsweep-sort` produces `cross_member_action='suggest_route'`, which the teen section's `adultDestinationToTeenDisposition` translator maps to `'talk_to_someone'` (PRIVATE journal note: "Reminder to talk to [Name] about: ..."). The teen must consciously override the disposition to `'family_request'` ("Ask someone") to escalate from "I'll remember to bring this up myself" to "send this to mom right now." This preserves the privacy-first default — no teen gets accidentally auto-routed into sending mom a notification just because they typed "mom" in their brain dump. The recipient picker UI uses TWO distinct labels to make the difference visible at a glance: `talk_to_someone` shows "Remind yourself to talk to:" (private), `family_request` shows "Send to:" (outbound). The footer copy switches based on whether any item is tagged Ask someone — when none are, it reads "Nothing goes out — it's all yours"; when at least one is, it reads "Anything tagged 'Ask someone' goes out as a real request — everything else stays just yours." The commit path reuses the existing adult `case 'family_request'` from Build L.1 (zero new code in `commitMindSweepLite.ts`) — same `family_requests` row, same `source='mindsweep_auto'`, same defensive auto-downgrade-to-task if recipient is missing.

## Play Dashboard & Sticker Book Gamification (PRD-24 + PRD-26 — Build M)

198. **`roll_creature_for_completion(p_task_completion_id UUID)` is the authoritative gamification pipeline endpoint.** SECURITY DEFINER RPC in migration `00000000100115_play_dashboard_sticker_book.sql`. All task completion writes that should count toward gamification MUST route through this RPC — never update `family_members.gamification_points` / `current_streak` / `longest_streak` directly from client or other server code. The RPC is atomic: points + streak + creature roll + page unlock happen in one transaction or none of them happen. Idempotency-safe via a UNIQUE constraint on `member_creature_collection.awarded_source_id` — re-firing on the same `task_completions.id` returns without double-awarding. Wired from four hooks in Sub-phase C: `useCompleteTask` (primary), `useApproveTaskCompletion` (Tasks.tsx approval path), `useApproveCompletion` (useTaskCompletions.ts legacy path), `useApproveMasterySubmission` (Build J mastery path).

199. **The gamification RPC NEVER throws from the client perspective.** All four hooks wrap the `supabase.rpc('roll_creature_for_completion', ...)` call in a `try/catch` that logs with `console.warn` and returns `null`. A failed roll (network blip, RLS glitch, DB error) must NEVER prevent the underlying task from being marked complete — gamification is ADDITIVE, not load-bearing. Consumers read `data.gamificationResult` and treat `null | undefined | { error }` as "no pipeline result available" and continue normally.

200. **Practice sessions do NOT trigger the gamification pipeline.** Only `task_completions` rows with `completion_type IN ('complete', NULL, 'mastery_approved')` get past the RPC's Step 3 filter. Rows with `completion_type='practice'` (written by `useLogPractice`) or `completion_type='mastery_submit'` (written by `useSubmitMastery` when `require_mastery_approval=true`) are skipped with `skipped_completion_type: '...'`. This is a founder decision (Q8 = Option C in the feature decision file): practice is about skill-building, not point accumulation. Points only flow when something is genuinely done — either normal completion, auto-approved work, or mom-approved mastery. `useApproveMasterySubmission` flips `completion_type` from `'mastery_submit'` → `'mastery_approved'` as part of the approval update so the RPC accepts the newly-approved row past Step 3.

201. **`useCompleteTask` only fires the RPC when `requireApproval === false`.** For tasks that need mom's approval, the completion row is inserted with `approval_status='pending'` and no gamification happens yet — the RPC would otherwise reward work before mom saw it. The approval hooks (`useApproveTaskCompletion`, `useApproveCompletion`, `useApproveMasterySubmission`) fire the RPC at approval time instead. This gives mom full control over when rewards actually flow to kids.

202. **Hooks that invoke the gamification RPC invalidate the right cache keys.** On success with a non-error result: `['family-member']` (header stats for the logged-in user), `['family-members', familyId]` (family-wide list read by PlayDashboard + ViewAs), `['sticker-book-state', completerId]`, `['member-creatures', completerId]`. The completer id comes from `task_completions.family_member_id`, not `task.assignee_id` — they differ for shared tasks where any assignee can complete.

203. **`GamificationResult` is a flat, all-optional TypeScript interface** (not a discriminated union) in `src/types/gamification.ts`. The RPC has ~8 early-return branches (error, gamification_disabled, already_processed, skipped_completion_type, sticker_book_disabled, roll_failed, theme_empty, full_success) and a union would force every consumer into a guard ladder. Instead, three narrowing helpers cover the needs: `gamificationDidAwardPoints`, `gamificationDidAwardCreature`, `gamificationDidUnlockPage`. PlayDashboard uses the latter two to push `RevealEvent`s onto the modal queue.

204. **Sub-phase C ships inline placeholder reveal banners, not modals.** When a creature is awarded or a page is unlocked, `PlayDashboard` renders a single theme-tokened `<div role="status">` above the task grid with the creature/page name and a "(Sub-phase D reveal modal coming)" caption. Auto-dismisses after 2 seconds. Sub-phase D replaces these with full-screen `CreatureRevealModal` + `PageUnlockRevealModal` that play the Mossy Chest + Fairy Door videos. Never merge a reveal modal into Sub-phase C scope — the founder signed off on one end-to-end review after Sub-phase F, not per-sub-phase reviews.

205. **Randomizer mastery approvals do NOT fire the gamification pipeline in Sub-phase C (known gap).** `useApproveMasterySubmission` has a sequential branch (keyed on `task_completions.id`, wired to the RPC) and a randomizer branch (keyed on `list_items.id`, no `task_completions` row exists). The RPC is strictly `task_completions`-keyed. Randomizer mastery awards live outside the gamification pipeline until a follow-up build wires a separate code path. Points still flow for kids via Focused/Buffet randomizer COMPLETIONS (which go through `useCompleteTask`) — only the mastery exit-from-pool path is the gap.

206. **Task unmark cascade is explicitly NOT implemented (known limitation).** When a `task_completions` row is soft-deleted or a task is un-completed, points are NOT deducted, streak is NOT rewound, creatures are NOT removed from the collection, and pages are NOT re-locked. The PRD calls for this cascade but the baby step ships without it — mom can manually adjust `gamification_points` via settings if needed. A future build will add an UNDO pipeline. Registered in `STUB_REGISTRY.md` as a known gap during Sub-phase F.

207. **Member color canonical field:** Always read member colors via `getMemberColor(member)` from `src/lib/memberColors.ts` or the `useMemberColor(memberId)` hook. Never read `assigned_color` or `member_color` directly in components. When saving a color pick in any settings UI, write BOTH `member_color` AND `assigned_color` simultaneously so the two fields stay in sync.

## Configurable Earning Strategies (PRD-24/PRD-26 — Build M Expansion)

208. **Task segments are per-member day organizers, available in ALL shells.** `task_segments` table groups tasks into named sections (Morning, School, Jobs, Evening) with sort order, day-of-week filter (`day_filter INTEGER[]`), and per-segment creature earning toggle. Play renders big tile banners; Guided/Independent/Adult render `SegmentHeader` with compact progress bars. If no segments exist, dashboards render tasks as flat lists (backward compatible). Segments are optional — mom creates them in gamification settings.

209. **4 creature earning modes, mom-configurable per child.** Stored in `member_sticker_book_state.creature_earning_mode`: `'random_per_task'` (default, d100 roll), `'every_n_completions'` (counter with configurable threshold), `'segment_complete'` (all tasks in a segment done), `'complete_the_day'` (all today's tasks done). `roll_creature_for_completion` RPC branches on this mode in Step 7. Mode-specific config columns: `creature_earning_threshold`, `creature_earning_counter`, `creature_earning_counter_resets`.

210. **3 page/background earning modes, independent from creature earning.** Stored in `member_sticker_book_state.page_earning_mode`: `'every_n_creatures'` (default, page unlocks after N creatures), `'every_n_completions'` (page after N task completions), `'tracker_goal'` (page when a dashboard widget reaches a threshold). Mode-specific columns: `page_earning_completion_threshold`, `page_earning_completion_counter`, `page_earning_tracker_widget_id`, `page_earning_tracker_threshold`.

211. **Coloring reveals are 1:1 task-linked tally counters, NOT earning-mode-driven.** Each `member_coloring_reveals` row has an `earning_task_id` FK linking it to one specific task. Each completion of that task = one reveal step (one zone group transitions from grayscale to color). The RPC checks `earning_task_id` FIRST — if the completed task matches a linked reveal, it advances that reveal regardless of creature earning mode. This is a visual tally counter tied to a specific repeatable action, not a gamification reward.

212. **Coloring reveal config is 4 fields only:** pick image (from `coloring_reveal_library`), pick linked task (`earning_task_id`), pick step count (5/10/15/20/30/50 — maps to `reveal_sequences` JSONB key), pick lineart preference (simple/medium/complex — for printing). No earning mode cards, no thresholds, no segment checkboxes on coloring reveals.

213. **`coloring_reveal_library` stores 32 Woodland Felt subjects** (20 animals + 12 scenes). Each row has `slug`, `display_name`, `category` (animal/scene), `theme_id`, and `reveal_sequences JSONB` with 6 step-count variants. Asset URLs are derived at runtime from `{CDN_BASE}/gamification-assets/woodland-felt/coloring-library/{slug}/{file}` — database stores only the slug.

214. **Randomizer reveal styles are per-segment, mom-configurable.** `task_segments.randomizer_reveal_style` is `'mystery_tap'` (default, sparkly card-flip animation) or `'show_upfront'` (activity visible when dashboard loads). The underlying randomizer draw is deterministic per day regardless of style. Completed tasks always show revealed. Mom configures per-segment in gamification settings.

215. **Redraw mechanism: UPDATE in-place, math gate, adult-only.** `RedrawButton` redraws the randomizer selection for a segment by updating the existing `randomizer_draws` row in-place (no history pollution, no new rows). Adult members must solve a simple math gate before redrawing — prevents children from fishing for preferred activities. Only adults (mom/additional_adult) see the redraw button.

216. **`segment_complete_celebration` is a per-segment boolean flag.** When all tasks in a segment are marked complete and this flag is `true`, a mini-celebration (confetti + glow) plays before any creature earning logic fires. Mom can disable per-segment for kids who find celebrations between segments annoying.

217. **Cross-shell segment rendering uses shell-appropriate components.** Play shell: `PlayTaskTileGrid` with big section banners, chunky progress bars, large tiles. Guided shell: `SegmentHeader` with name + compact progress bar, standard task cards. Independent shell: collapsible section headers in task list, progress pill in header. Adult shell: collapsible section headers at adult density. All shells read the same `task_segments` table.

218. **Earning progress is visible to children.** For `every_n_completions` mode, `EarningProgressPill` shows "2/3 until next creature!" on the Play Dashboard. For `segment_complete`, progress shows per-segment (3/4 complete). For `complete_the_day`, progress shows total day completion. Gamification is motivating, not hidden.

219. **Earned creatures and pages are NEVER taken away.** If mom adds a task mid-day after "complete the day" fired, the creature stays earned. Past awards are permanent. The day-complete status rechecks live for future evaluations only. Consistent with "celebration only, never punishment" (CLAUDE.md principle).

220. **Gamification opt-in is available across all shells, not just Play.** A 13-year-old Independent teen with `gamification_configs.enabled = true` earns creatures on task completion with a lighter sticker book widget. Gamification and allowance calculations (PRD-28) coexist — both consume `task_completions` rows independently.

221. **`GamificationSettingsModal` has 6 collapsible sections.** (1) Master toggles (enable gamification, sticker book, base points per task). (2) Day Segments (CRUD with DnD reorder, suggested names, day-of-week filters, per-segment creature earning toggle). (3) Creature Earning (4-card mode picker with "good for" descriptions). (4) Background/Page Earning (3-card mode picker). (5) Coloring Reveals (browse library, assign task, pick step count + lineart). (6) Reset & Advanced (stats, reset buttons). Accessible from Settings → [Play Child] → Gamification.

222. **`ColorRevealTallyWidget` is a dashboard widget, not a task tile.** Renders the coloring image with grayscale→color progressive reveal, linked task name, progress bar (current/total steps), and an "I did it!" button that completes the linked task. On full reveal, shows "Print it!" button with lineart complexity picker. Similar to a Best Intentions widget but with a visual reveal instead of a counter.

## Tracking, Allowance & Financial (PRD-28)

223. **`financial_transactions` is append-only.** Never UPDATE, never DELETE. Reversals are new negative `adjustment` records. `balance_after` on every row provides audit trail. If `SUM(amount)` != latest `balance_after`, there is a data integrity issue. INSERT-only RLS policy enforced at the database level.
224. **Task-level tracking flags: `counts_for_allowance`, `counts_for_homework`, `counts_for_gamification`.** All three exist on both `tasks` and `task_templates`. `counts_for_gamification` defaults to `true` (preserves existing behavior — all completions earn points unless mom un-checks). `counts_for_allowance` and `counts_for_homework` default to `false` (opt-in). The `roll_creature_for_completion` RPC checks `counts_for_gamification` and skips gamification when `false`.
225. **Financial data is excluded from LiLa context assembly.** `_shared/context-assembler.ts` must never load from `financial_transactions`, `allowance_configs`, `allowance_periods`, or `loans`. No dollar amounts, no balances, no transaction history in any LiLa context. This is a hard privacy boundary.
226. **`homeschool_configs` uses a dual-record pattern.** `family_member_id = NULL` for the family-wide default record; non-NULL for per-child overrides. Two partial unique indexes enforce one family default per family + one config per child. Resolution order: child override (if field is non-NULL) → family default (if field is non-NULL) → system default. Most families configure once at the family level; per-child overrides only when a specific child diverges (different program, different grade level).
227. **Minutes (INTEGER) as the base unit for all homework time logging.** `homeschool_time_logs.minutes_logged` is always INTEGER minutes. Display converts to hours (`formatMinutes` helper: `2h 15m`). This avoids fractional hour rounding issues critical for compliance reporting. The `default_weekly_hours` field on `homeschool_subjects` is DECIMAL(5,2) because it represents a target, not a logged value.
228. **Homework hour targets are opt-in, NULL by default.** `homeschool_subjects.default_weekly_hours` is nullable with no preset value. The 7 suggested subjects ship with NULL targets. The Log Learning widget adapts per-subject: no target = count-only display ("2h 15m this week"); target set = progress bar ("2h 15m of 5h target"). Mom opts IN to targets — they are never the default. No pressure, no judgment.

## Meetings (PRD-16)

229. **Meeting types: 4 built-in + custom.** `meetings.meeting_type` CHECK: `'couple', 'parent_child', 'mentor', 'family_council', 'custom'`. Weekly/monthly/quarterly reviews belong to Rhythms (PRD-18), not Meetings. Business meetings are custom templates, not built-in types.
230. **Meeting facilitation uses existing `lila-chat`, NOT a new Edge Function.** Meeting-specific context assembly additions live in `_shared/context-assembler.ts`. The `meeting` mode_key row in `lila_guided_modes` (seeded in migration 000007) is the entry point for all meeting conversations.
231. **Action items ALWAYS route through Studio Queue** with `source='meeting_action'`. Never create tasks directly from post-meeting review. This is consistent with every other source (Notepad, Review & Route, Requests, MindSweep).
232. **Meeting impressions are PERSONAL** — only visible to the person who ended the meeting. Never shared with other participants, never included in "Share to Messages", never in LiLa context.
233. **Default agenda sections lazy-seed on first editor access** from `BUILT_IN_AGENDAS` constants in `src/types/meetings.ts`, NOT on table creation. 4 sets: couple (6 sections), mentor (5), parent_child (5), family_council (6).
234. **Pending agenda items carry forward** to the next meeting when unaddressed. They accumulate between meetings and don't disappear — `meeting_agenda_items.status` stays `'pending'` until explicitly discussed or removed.
235. **Couple meetings: dad has IMPLICIT permission.** No `member_permissions` check needed. Parent-child and mentor meetings require per-kid `member_permissions` grants for non-mom participants.
236. **Special Adults have NO access** to Meetings. Guided children participate indirectly via "Things to Talk About" capture (`suggested_by_guided=true`). Play children have no Meetings presence.
237. **Schedule Editor is the Universal Scheduler** (PRD-35 addendum). `showTimeDefault={true}`. Stores RRULE JSONB in `meeting_schedules.recurrence_details`. Calendar integration is opt-in via checkbox.
238. **Stale meeting auto-cancel is client-side**, checked on MeetingsPage load. 24h prompt → 7-day auto-cancel. No dedicated cron job.
239. **Meeting summaries auto-save to journal** with `entry_type='meeting_notes'` on Save & Close. Automatic, not user-triggered.
240. **MeetingPickerOverlay** is the inline overlay for Notepad "Send to → Agenda" — shows upcoming meetings grouped by type, user picks one, creates `meeting_agenda_items` record with `source='notepad_route'`.

## Build Strictness (Non-Negotiable)

121. **Before completing any build session, run `npx tsc --noEmit` and verify zero errors.** The production build (Vercel) uses strict TypeScript checking with `noUnusedLocals` and `noUnusedParameters` enabled. Vite's dev server does NOT type-check — it uses esbuild which ignores these flags. Code that works in `vite dev` can still fail on deploy. Never commit code that passes `vite dev` but would fail `npx tsc --noEmit`. Run the check before declaring any phase complete.

## Tooling Hygiene (Non-Negotiable)

241. **Tool health check must pass before any build work begins.** See `/prebuild` Step 0 for the current mechanism. Applies to required MCP servers (codegraph, endor-cli-tools) and auth-backed CLIs (mgrep). Silent disconnects and auth expiry have historically gone undetected for weeks — AURI sat disconnected through the PRD-01 and PRD-02 builds without any error surfacing. This check closes that gap. Reference: `claude/LESSONS_LEARNED.md` → "The Second Failure Mode: Silent Tool Drift" and `TOOL_HEALTH_REPORT_2026-04-16.md`. If a tool is disconnected or unauthenticated at session start, resolve it before starting build work or explicitly record an "override acknowledged" audit entry in the active build file under `.claude/rules/current-builds/` acknowledging the known gap for that specific build.

242. **Always use `mgrep` for search — Grep, Glob, and WebSearch are prohibited for cross-cutting lookups.** mgrep is semantic (finds cross-PRD, convention, and architectural matches keyword grep misses) and returns ranked top-N results instead of every regex hit, which lowers token usage significantly. Use `mgrep "query" --max 5` for code/content search, `mgrep --web "query"` for external docs. The only acceptable Grep/Glob uses are (a) looking up a single symbol in a specific file whose path is already known, or (b) confirming a specific file exists at a known path — everything else routes through mgrep. If mgrep is unavailable (auth expired, daemon down), treat it as a tool health failure per convention 241 rather than silently falling back to Grep. Enforcement reference: `feedback_use_mgrep` memory entry (session-persistent).

## Privacy Guardrails (Non-Negotiable)

243. **Safe Harbor aggregation-exclusion guardrail.** All queries against `lila_conversations` used for aggregation, reporting, or context assembly MUST filter `is_safe_harbor = false` unless the query is explicitly scoped to a Safe Harbor history view. Safe Harbor conversations are isolated by design — they must never surface in cross-conversation aggregations, family reports, platform intelligence pipelines, or LiLa context assembly. Convention text only at this stage; grep-based CI check and RLS/view guard implementation land with the first aggregation PRD build (PRD-19, PRD-28B, or PRD-30 — whichever ships first, per `RECON_DECISIONS_RESOLVED.md` Decision 10).

## Schema Documentation (Non-Negotiable)

244. **`claude/live_schema.md` is regenerated from production, not hand-edited.** The file is a read-only snapshot produced by `npm run schema:dump` (wraps `scripts/full-schema-dump.cjs`, uses OpenAPI introspection + row counts against production Supabase). After any migration lands, run `npm run schema:dump` to refresh the snapshot. For schema design intent, PRDs remain authoritative — `live_schema.md` reflects the current state of what was built, not what should be built. A drift between `live_schema.md` and a PRD means either the PRD still needs building or the schema needs a migration; it never means `live_schema.md` should be edited directly.
