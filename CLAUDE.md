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
@claude/database_schema.md
@claude/live_schema.md
@claude/conventions.md
@claude/ai_patterns.md
@claude/feature_glossary.md
@WIRING_STATUS.md
@specs/studio-seed-templates.md
@CURRENT_BUILD.md
@claude/PRE_BUILD_PROCESS.md

## Pre-Build Process (MANDATORY — NO EXCEPTIONS)

**Every build session must begin with this process. No code is written until the pre-build summary is complete and founder-approved.**

See `claude/PRE_BUILD_PROCESS.md` for the full ritual. The short version:

1. Read the FULL PRD for the feature being built — every word, not a skim
2. Read EVERY matching addendum in `prds/addenda/` — search for all files containing the PRD number
3. Create a feature decision file in `claude/feature-decisions/PRD-XX-FeatureName.md`
4. Populate `CURRENT_BUILD.md` with the complete pre-build summary
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
11. **PRDs are the ONLY source of truth for building features.** Before writing ANY code, follow the full Pre-Build Process above. Read the FULL PRD AND every addendum in `prds/addenda/` that matches the PRD number — there are often multiple addenda per PRD and they contain decisions that override or clarify the base PRD. The `claude/database_schema.md` file is a summary reference — it is NOT authoritative for schema design. If `database_schema.md` conflicts with a PRD, the PRD wins. If two PRDs conflict, the newer one wins. Every column, every enum value, every screen, every interaction, every empty state, every visibility rule in the PRD must be implemented precisely. This platform is a Rube Goldberg machine — every piece connects, and precision is non-negotiable.
12. **Never modify files in `prds/`, `specs/`, or `reference/`.** These are read-only source material.
13. **The PRDs ARE the minimum. There is no simpler version.** Do not suggest an "MVP approach," an "easy version for now," a "simplified implementation," or any reduction of what the PRD specifies. The PRDs were designed carefully and ARE the minimum viable product — not a ceiling to aim toward later, but the floor to build from now. Every screen, every field, every interaction, every edge case in the PRD gets built exactly as written. If something in the PRD cannot be built correctly right now (missing dependency, unclear spec, infrastructure not ready), stop and ask Tenise — do not substitute a simpler version without explicit approval. Never use local regex stubs, setTimeout placeholders, hardcoded data, or "simple parsing for now" shortcuts. If a feature needs AI, connect AI. If it needs streaming, stream. If it needs a real database query, write the real query. Build it right or don't build it yet.
14. **Post-phase checklist (MANDATORY after completing each build phase):** Two parts — verification first, then file updates. Do not skip Part A.
    **Part A — PRD Verification (before anything else):**
    - Go through every requirement from the pre-build summary — every screen, every interaction, every field, every rule, every edge case
    - Assign each a status: **Wired** (built and functional), **Stubbed** (documented placeholder in STUB_REGISTRY.md), or **Missing** (not built, not stubbed)
    - Fill in the Post-Build Verification table in `CURRENT_BUILD.md`
    - Present the completed table to Tenise — every requirement, every status
    - Zero Missing items required before the build is considered complete. Any Missing must be built or explicitly approved as a stub.
    **Part B — File updates (after Tenise confirms verification):**
    - `BUILD_STATUS.md` — mark phase complete with date
    - `claude/database_schema.md` — update any new/changed tables and columns
    - `STUB_REGISTRY.md` — add new stubs created, update wired status of existing stubs
    - `CLAUDE.md` — add any new conventions introduced by the phase
    - Add `<FeatureGuide featureKey="xxx" />` to every new page/feature
    - Copy verification table into `claude/feature-decisions/PRD-XX.md`, get founder post-build sign-off
    - `CURRENT_BUILD.md` — reset Status to IDLE, clear all sections
    - `claude/feature-decisions/README.md` — add the new file to the index table

15. **Member colors:** Use the 44-color AIMfM palette from `src/config/member_colors.ts`. Never hardcode hex colors — use CSS custom properties with fallbacks. Run `npm run check:colors` to verify.
16. **Mobile layout:** BottomNav handles mobile navigation. No hamburger menu. Hide "Back to Dashboard" buttons on mobile (`hidden md:flex`). LiLa drawer sits above bottom nav (`bottom-14 md:bottom-0`).
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

## Build Strictness (Non-Negotiable)

121. **Before completing any build session, run `npx tsc --noEmit` and verify zero errors.** The production build (Vercel) uses strict TypeScript checking with `noUnusedLocals` and `noUnusedParameters` enabled. Vite's dev server does NOT type-check — it uses esbuild which ignores these flags. Code that works in `vite dev` can still fail on deploy. Never commit code that passes `vite dev` but would fail `npx tsc --noEmit`. Run the check before declaring any phase complete.
