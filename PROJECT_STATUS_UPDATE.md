# Project Status Update — MyAIM Central v2

> Last updated: 2026-03-24

## Current Reality

### Foundation (Phases 00-06 + Remediation) — COMPLETE

All foundation phases are built and remediated to match their PRDs:

| Area | PRDs | What's Built |
|------|------|-------------|
| **Project Setup** | — | Vite + React 19 + TypeScript, Supabase client, TanStack Query, routing, Tailwind |
| **Auth & Family Setup** | PRD-01 | Family login, member setup (5 roles), PIN login (bcrypt hashed server-side), birthday/age/grade, auto-provisioning trigger, accept-invite flow, session timeout per role |
| **Permissions** | PRD-02 | PermissionGate + useCanAccess (3-layer check), permission presets (6 system), View As (full-shell mode + banner), PIN lockout (server-side), teen transparency panel, shift view, default auto-creation trigger |
| **Design System** | PRD-03 | 38 themes (6 mood categories, light+dark), 20 semantic tokens, theme-adaptive Tooltip, 11+ shared components (Button/Card/Input/Modal/Badge/Spinner/EmptyState/Toggle/Avatar/Tabs/Select), SparkleOverlay, shell token overrides, dark mode default=system, theme persistence to Supabase |
| **Shell Routing** | PRD-04 | 5 shells (Mom/Adult/Independent/Guided/Play), shell-aware BottomNav, QuickTasks strip, PerspectiveSwitcher, NotepadDrawer in Mom/Adult/Independent, Settings via floating gear (not sidebar), Play emoji nav, Guided greeting header |
| **Universal Scheduler** | PRD-35 | Full UI component: all frequency types, calendar preview, custody grid, completion-dependent, compact mode, [+ Add another] pattern, RRULE JSONB storage |
| **Universal Timer** | PRD-36 | 4 modes (clock/pomodoro/stopwatch/countdown), floating bubble (all 5 shells), 5 visual styles (SVG/CSS), session history + editing, Play mode age gate, per-member config panel, timestamp-based persistence |
| **LiLa Core AI** | PRD-05 | Conversation engine, 4 core modes (help/assist/optimizer/general), HumanInTheMix (edit/approve/regenerate/reject), help-patterns FAQ (13 patterns, zero API cost), context assembly (7 stub loaders), permission + privacy filtering, voice input (Whisper), opening messages, page context, person-level context toggles |
| **Smart Notepad** | PRD-08 | Right-drawer workspace, Supabase-backed tabs, autosave (500ms debounce), AI auto-titling (Haiku), RoutingStrip ("Send to..." 13 destinations), Review & Route extraction, voice capture |

### Schema Migrations — 22 total

Migrations 001-022 covering: families, family_members, special_adult_assignments, access_schedules, dashboard_configs, guiding_stars, best_intentions, intention_iterations, self_knowledge, journal_entries, notepad_tabs, notepad_extracted_items, notepad_routing_stats, lila_conversations, lila_messages, lila_guided_modes, lila_tool_permissions, tasks, task_templates, lists, list_items, time_sessions, timer_configs, permission_presets, view_as_sessions, out_of_nest_members, and supporting RPC functions.

### Pages Built

- `/auth/*` — Login, family login, accept-invite
- `/dashboard` — Personal dashboard with PerspectiveSwitcher
- `/family-setup` — Family setup wizard
- `/family-members` — Member management
- `/journal` — Journal (opens Notepad for writing)
- `/guiding-stars` — GuidingStars page (placeholder pending Phase 07)
- `/best-intentions` — BestIntentions page (placeholder pending Phase 07)
- `/inner-workings` — InnerWorkings page (placeholder pending Phase 08)
- `/tasks` — Tasks page (placeholder pending Phase 10)
- `/lists` — Lists page (placeholder pending Phase 10)
- `/settings/permissions` — Permission Hub

---

## What's NOT Built Yet (Vibeathon + remaining phases)

### High Priority — Core Feature Phases

| Phase | PRDs | Feature | Notes |
|-------|------|---------|-------|
| 07 | PRD-06 | GuidingStars & BestIntentions | Full CRUD, AI craft mode, iterations, celebration counter |
| 08 | PRD-07 | InnerWorkings | Self-knowledge categories, upload/manual/guided entry, sharing controls |
| 10 | PRD-09A, PRD-09B | Tasks, Lists, Studio & Templates | Tasks, routines, opportunities, habits, sequential collections, templates, Studio queue |
| 11 | PRD-10 | Widgets, Trackers & Dashboard Layout | 19 tracker types, 75+ visual variants, grid layout |
| 12 | PRD-11, PRD-11B | Victory Recorder & Family Celebration | Ta-Da list, AIR auto-routing, celebration narratives |
| 13 | PRD-13 | Archives & Context | Folder hierarchy, context items, faith prefs, context learning |
| 14 | PRD-14, PRD-14B | Personal Dashboard & Calendar | Full dashboard layout, calendar events, approval flow |

### Vibeathon Targets

| Feature | PRDs | Priority |
|---------|------|----------|
| Tasks (full system) | PRD-09A, PRD-09B | High — core family coordination |
| Archives & Context | PRD-13 | High — feeds LiLa context assembly |
| Cyrano/Higgins (Communication Tools) | PRD-21 | Medium — relationship AI tools |
| ThoughtSift | PRD-34 | Medium — 5 thinking tools |
| AI Vault | PRD-21A | Medium — content browse & consume |

### Remaining Phases (16-41)

All phases 16-41 are Pending. See BUILD_STATUS.md for the full list with dependencies.

---

## CRITICAL RULES

1. **OLD BUILD PROMPTS ARE BANNED.** The 42 files formerly in `build-prompts/` have been moved to `archive/old-build-prompts/`. They were generated from a bad schema summary and are POISONED. Never reference them.
2. **For every remaining feature, read the FULL PRD in `prds/` before writing any code.** PRDs are the only source of truth. If `claude/database_schema.md` conflicts with a PRD, the PRD wins.
3. **No MVP or placeholder implementations** unless the founder explicitly approves scope reduction.
