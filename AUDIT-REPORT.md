# Full Platform Audit Report

> **Date:** 2026-03-28
> **Scope:** All built PRDs (01-04, 05, 06, 07, 08, 09A, 09B, 10, 13, 14, 14B, 21, 21A, 34, 35, 36) + cross-cutting concerns
> **Mode:** Read-only recon. Zero fixes applied.

---

## Executive Summary

**Total requirements audited:** ~400+ across 20 PRDs
**Overall health:** Solid foundation with known gaps in newer features

| Category | Count |
|---|---|
| Correct / Wired | ~310 |
| Wrong (code diverges from PRD) | ~18 |
| Missing (no code, no stub) | ~12 |
| Stubbed (approved) | ~45 |
| Broken wiring (exists but disconnected) | ~10 |

### Top 10 Issues by Impact

| # | Issue | Severity | PRD |
|---|---|---|---|
| 1 | TrackerQuickCreateModal is a console.log stub — widgets never created | **BROKEN** | PRD-10 |
| 2 | Calendar edit flow broken — EventCreationModal has no `event` prop for pre-population | **BROKEN** | PRD-14B |
| 3 | Opportunity sub-type selector completely disconnected from TaskCreationModal | **BROKEN** | PRD-09A |
| 4 | DashboardGrid drag-to-reorder not implemented — @dnd-kit not imported | **BROKEN** | PRD-10 |
| 5 | `dashboard_configs` table never queried — layout_mode/grid_columns/decorations dead | **DEAD CODE** | PRD-14 |
| 6 | `is_privacy_filtered` not enforced in client-side context-assembly.ts | **SECURITY** | PRD-13 |
| 7 | AI Toolbox sidebar section removed but post-build marked "Wired" | **WRONG** | PRD-21 |
| 8 | View As doesn't apply target member's shell or theme | **WRONG** | PRD-04 |
| 9 | Zero Zod validation across all 19 Edge Functions | **PATTERN GAP** | Cross-cutting |
| 10 | `ai-parse` and `extract-insights` missing AI cost logging (Sonnet calls) | **COST LEAK** | Cross-cutting |

---

## PRD-01: Auth & Family Setup

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| Accept-invite route `/auth/accept-invite` | Correct | `src/App.tsx:69`, `src/pages/auth/AcceptInvite.tsx` | |
| `accept_family_invite` RPC with `auth_method` | Correct | AcceptInvite.tsx:44, migration 27 | |
| Visual password login (platform_assets, 4-tap) | Correct | `src/pages/auth/FamilyLogin.tsx:141-202` | |
| Bulk add with duplicate detection | Correct | `src/pages/FamilySetup.tsx:132-188` | |
| PIN hashing via `hash_member_pin` RPC | Correct | FamilyMembers.tsx:370, FamilySetup.tsx:289 | |
| PIN verification via `verify_member_pin` RPC | Correct | FamilyLogin.tsx:212 | |
| PIN lockout (5 fails → 15min) | Correct | Server-side RPC | |
| Email invite sending | Stubbed | FamilyMembers.tsx:512-516 | QR + copy link instead |
| Post-onboarding routing to Settings | Wrong | App.tsx:81, SettingsProvider.tsx:34 | `/settings` route exists but PRD-04 says remove it; `window.location.href` bypasses React Router |

---

## PRD-02: Permissions & Access Control

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| `PermissionGate` three-layer resolution | Correct | `src/lib/permissions/PermissionGate.tsx` | |
| `useCanAccess` returns true for beta | Correct | `src/lib/permissions/useCanAccess.ts:19` | |
| `usePermission` role-based Layer 3 | Correct | `src/lib/permissions/usePermission.ts` | |
| Emergency lockout toggle | Correct | `src/pages/PermissionHub.tsx:334-361` | |
| View As sessions + feature exclusions | Correct | ViewAsProvider.tsx:112-127 | |
| Permission presets (6 system) | Correct | Migration 19 | |
| `recalculate-tier-blocks` Edge Function | Stubbed | STUB_REGISTRY | Deferred to Stripe phase |
| SA Activity Log during shifts | Stubbed | STUB_REGISTRY | Deferred to PRD-27 |
| `view_as_feature_exclusions` in live_schema.md | Wrong | live_schema.md | Table missing from schema dump (documentation lag) |

---

## PRD-03: Design System & Themes

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| 45+ themes in 7 categories | Correct | `src/lib/theme/tokens.ts` | |
| ThemeSelector with collapsible categories | Correct | `src/components/ThemeSelector.tsx` | |
| Shell token overrides (applyShellTokens) | Correct | `src/lib/theme/shellTokens.ts` | |
| Theme persistence to Supabase | Correct | `src/lib/theme/useThemePersistence.ts` | |
| SparkleOverlay (quick burst + full celebration) | Correct | `src/components/shared/SparkleOverlay.tsx` | |
| Tooltip fully theme-adaptive | Correct | `src/components/shared/Tooltip.tsx:239-244` | |
| Firefox scrollbar theming | Wrong | `src/App.css:54-68` | Only WebKit rules; `scrollbar-color`/`scrollbar-width` absent |

---

## PRD-04: Shell Routing & Layouts

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| All 5 shells exist (Mom/Adult/Independent/Guided/Play) | Correct | `src/components/shells/` | |
| RoleRouter dispatches correctly | Correct | `src/components/shells/RoleRouter.tsx` | |
| BottomNav (56px, mobile-only, shell-aware) | Correct | `src/components/shells/BottomNav.tsx` | |
| QuickTasks auto-sort by frequency | Correct | `src/components/shells/QuickTasks.tsx` | |
| PerspectiveSwitcher (mom-only) | Correct | `src/components/shells/PerspectiveSwitcher.tsx` | |
| NotepadDrawer in Mom/Adult/Independent | Correct | Shell files | |
| GuidedNotepad in Guided shell | Correct | `src/components/shells/GuidedShell.tsx:111-200` | |
| Settings gear → overlay (not route) | Wrong | SettingsProvider.tsx:34 | Uses `window.location.href = '/settings'` (full page nav, not overlay) |
| View As renders target member's shell + theme | Wrong | ViewAsModal.tsx, ViewAsShellWrapper.tsx | ViewAsShellWrapper is a no-op; ViewAsModal shows only Dashboard, no shell/theme switch |

---

## PRD-05: LiLa Core AI System

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| LilaDrawer with streaming | Correct | `src/components/lila/LilaDrawer.tsx` | |
| Context assembly pipeline (8 steps) | Correct | `src/lib/ai/context-assembly.ts` | |
| Help pattern matching (13 patterns) | Correct | `src/lib/ai/help-patterns.ts` | |
| HumanInTheMix (Edit/Approve/Regenerate/Reject) | Correct | `src/components/HumanInTheMix.tsx` | |
| Regenerate: delete + re-send with "[Please try a different approach]" | Correct | LilaDrawer.tsx:294-324 | |
| Reject: delete message | Correct | LilaDrawer.tsx:327-334 | |
| Voice input (Whisper + Web Speech fallback) | Correct | `src/hooks/useVoiceInput.ts` | |
| lila-chat Edge Function | Correct | `supabase/functions/lila-chat/index.ts` | |
| ai-parse Edge Function | Correct | `supabase/functions/ai-parse/index.ts` | |
| whisper-transcribe Edge Function | Correct | `supabase/functions/whisper-transcribe/index.ts` | |
| Mode conflict dialog | Correct | LilaDrawer.tsx:336-354 | |
| Approve action | Partial | LilaMessageBubble.tsx:146 | No-op (message already persisted by Edge Function) |

---

## PRD-06: GuidingStars & BestIntentions

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| 4 entry types (value, declaration, scripture_quote, vision) | Correct | `src/hooks/useGuidingStars.ts` | |
| Heart/HeartOff for is_included_in_ai | Correct | GuidingStars.tsx:118-122 | |
| Drag-to-reorder within groups | Correct | GuidingStars.tsx (@dnd-kit) | |
| Soft delete (archived_at) | Correct | useGuidingStars.ts | |
| Bulk Add with AI | Correct | GuidingStars.tsx:423-447 | |
| BestIntentions 3 tracker styles | Correct | BestIntentions.tsx:310-462 | |
| Tap-to-celebrate (intention_iterations) | Correct | useBestIntentions.ts | |
| `owner_type` field missing from TypeScript interface | Wrong | useGuidingStars.ts | Family-star creation impossible from any form |
| Permanent delete button in archived section | Missing | GuidingStars.tsx | Only restore exists |
| `recorded_at` missing from IntentionIteration | Missing | useBestIntentions.ts | PRD-06 Decision 8 requires it |
| `related_member_ids` — no UI picker | Missing | BestIntentions.tsx | Field exists in interface, no UI to set it |

---

## PRD-07: InnerWorkings

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| 5 categories (personality_type, etc.) | Correct | `src/hooks/useSelfKnowledge.ts` | |
| Source types (manual, file_upload, etc.) | Correct | useSelfKnowledge.ts | |
| Heart/HeartOff per-entry toggles | Correct | InnerWorkings.tsx | |
| Collapsible groups + drag-to-reorder | Correct | InnerWorkings.tsx | |
| File upload with content extraction | Correct | InnerWorkings.tsx:287 | |
| `share_with_mom` toggle | Missing | InnerWorkings.tsx | Column in DB, no UI control |
| `share_with_dad` toggle | Correct | InnerWorkings.tsx:508-511 | |

---

## PRD-08: Smart Notepad & Journal

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| NotepadDrawer with tab management (8 max) | Correct | `src/components/notepad/NotepadDrawer.tsx` | |
| Autosave 500ms debounce | Correct | useNotepad.ts:423 | |
| AI auto-titling (30+ chars, 2s delay) | Correct | useNotepad.ts:295-324 | |
| Rich text (tiptap: bold/italic/bullets) | Correct | NotepadRichEditor.tsx | |
| Send to... RoutingStrip | Correct | NotepadDrawer.tsx:393 | |
| Review & Route extraction | Correct | NotepadDrawer.tsx:404-409 | |
| Journal read-only (+ opens Notepad) | Correct | Journal.tsx:59-62 | |
| All 11 journal entry types | Correct | useJournal.ts:25-36 | |
| Review & Route inline editing persists | Wrong | NotepadReviewRoute.tsx:317-321 | `handleSaveEdit` mutates in memory only — lost on reload before routing |

---

## PRD-09A: Tasks, Routines & Opportunities

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| TaskCreationModal (Quick/Full modes) | Correct | `src/components/tasks/TaskCreationModal.tsx` | |
| Task types: task, routine, opportunity, habit | Correct | TaskCreationModal.tsx:140-150 | |
| Fresh Reset default for routines | Correct | TaskCreationModal.tsx:759 | |
| Any/Each assignment pattern | Correct | TaskCreationModal.tsx:571-604 | |
| studio_queue as universal intake | Correct | Multiple files | |
| Opportunity sub-types (claimable/repeatable/capped) | **BROKEN** | TaskTypeSelector.tsx, TaskCreationModal.tsx | `TaskTypeSelector` component is never rendered; `opportunitySubType` in data type but no UI to set it |
| Full Mode 7 collapsible sections | Wrong | TaskCreationModal.tsx | Sections are static cards, not collapsible |
| 13 prioritization views | Partial | ViewCarousel.tsx | 7 wired, 6 are `isPlanned: true` stubs |
| `sequential` as standalone task type | Missing | TaskCreationModal.tsx | Only available as list delivery mode, not in TASK_TYPES_GRID |
| TaskBreaker AI | Stubbed | TaskCreationModal.tsx:710 | Button exists, no-op stub |

---

## PRD-09B: Lists, Studio & Templates

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| Studio page (Browse + My Customized tabs) | Correct | `src/pages/Studio.tsx` | |
| 10 list types in type system | Correct | `src/types/lists.ts` | |
| List type-specific fields | Correct | types/lists.ts | |
| Guided Forms architecture | Correct | guidedFormTypes.ts | |
| Randomizer component | Correct | `src/components/lists/Randomizer.tsx` | |
| Prayer/Ideas/Backburner — no Studio template cards | Missing | studio-seed-data.ts | Types exist, not in Studio browse |

---

## PRD-10: Widgets, Trackers & Dashboard Layout

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| DB tables (dashboard_widgets, widget_templates, etc.) | Correct | Migration 33 | |
| DashboardGrid component | Correct | `src/components/widgets/DashboardGrid.tsx` | |
| 6 Phase-A tracker types | Correct | `src/components/widgets/trackers/` | |
| 11 remaining tracker types | Stubbed | PlannedTrackerStub.tsx | |
| useWidgets hooks (CRUD) | Correct | `src/hooks/useWidgets.ts` | |
| TrackerQuickCreateModal | **BROKEN** | TrackerQuickCreateModal.tsx:63 | `handleAddToDashboard` is `console.log` — never calls `useCreateWidget` |
| Widget folder tap | **BROKEN** | Dashboard.tsx:205 | `onOpenFolder={() => {}}` — no-op, no FolderOverlayModal |
| Drag-to-reorder | **BROKEN** | DashboardGrid.tsx | No @dnd-kit imports, `_onUpdateLayout` unused |
| `dashboard_configs` table usage | **DEAD** | Dashboard.tsx | Table never queried; layout_mode/grid_columns/decorations dead |
| Responsive `--grid-cols` | Missing | DashboardGrid.tsx:124 | Hardcoded 2, no breakpoint switching |
| 50-widget limit warning | Missing | None | No count check |
| Auto-arrange → manual on first drag | Missing | None | layout_mode never read/written |

---

## PRD-13: Archives & Context

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| Three-tier toggle system | Correct | useArchives.ts | |
| Archive folder tree with auto-provisioned system folders | Correct | Migration 35 | |
| "Checked somewhere, checked everywhere" | Correct | useArchives.ts:656-694 | |
| Faith preferences (individual booleans) | Correct | archives.ts, FaithPreferencesModal.tsx | |
| Context export (Markdown) | Correct | ContextExportPage.tsx | |
| Privacy Filtered in client-side context assembly | **Missing** | context-assembly.ts | `is_privacy_filtered` not filtered in context assembly pipeline |
| `physical_description`/`reference_photos` on ArchiveMemberSettings | Missing | archives.ts | Columns exist in migration but not in TypeScript interface |
| Name detection (client-side pill auto-select) | Stubbed | ToolConversationModal.tsx | Server-side works; client pill auto-select not wired |

---

## PRD-14: Personal Dashboard

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| PerspectiveSwitcher (3 views) | Correct | PerspectiveSwitcher.tsx | |
| CalendarWidget on dashboard | Correct | Dashboard.tsx:181 | |
| Widget grid on dashboard | Correct | Dashboard.tsx:188-213 | |
| View As integration | Correct | Dashboard.tsx:29,47 | |
| `dashboard_configs` table usage | **DEAD** | Dashboard.tsx | Never queried — migration columns unused |

---

## PRD-14B: Calendar

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| Month/Week/Day views | Correct | CalendarPage.tsx | |
| EventCreationModal (all fields) | Correct | EventCreationModal.tsx | |
| DateDetailModal (edit/delete/approve/reject) | Correct | DateDetailModal.tsx | |
| 11 system categories | Correct | Migration 52 | |
| MiniCalendarPicker shared component | Correct | MiniCalendarPicker.tsx | |
| Pick Members filter + Dots/Stripe toggle | Correct | CalendarPage.tsx | |
| Task due dates on calendar | Correct | CalendarPage.tsx | |
| Edit event flow | **BROKEN** | CalendarPage.tsx, CalendarWidget.tsx | `_editingEvent` unused; EventCreationModal has no `event` prop |
| Items-to-bring checklist | **BROKEN** | DateDetailModal.tsx:462 | `readOnly` attribute prevents interaction |
| CalendarWidget Settings button | **BROKEN** | CalendarWidget.tsx:209-220 | No `onClick` handler |
| Task flyout: Change Due Date / Mark Complete | Missing | CalendarPage.tsx:966 | Only "Open full task" link |
| Task flyout navigation | Wrong | CalendarPage.tsx:970 | Uses `window.location.href` with no task ID |

---

## PRD-21: Communication & Relationship Tools

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| 8 guided modes (all Edge Functions) | Correct | supabase/functions/ | All 8 present |
| ToolConversationModal (modal-based) | Correct | ToolConversationModal.tsx | |
| PersonPillSelector | Correct | PersonPillSelector.tsx | |
| Communication drafts save/copy | Correct | ToolConversationModal.tsx:455 | |
| Action chips per tool | Correct | ToolConversationModal.tsx | |
| AI Toolbox sidebar section | **Wrong** | Sidebar.tsx:354 | Comment says "removed" but post-build marked Wired |
| Name auto-detection (client pill) | Stubbed | Post-build Item 10 | |
| Conversations auto-named | Stubbed | Post-build Item 36 | |

---

## PRD-21A: AI Vault

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| 6 content types | Correct | VaultContentCard.tsx | |
| Two-layer titles + descriptions | Correct | Multiple files | |
| NEW badge (vault_first_sightings, 30-day) | Correct | useVaultBrowse.ts | |
| Content protection (no select, copy logging) | Correct | ContentProtection.tsx, CopyPromptButton.tsx | |
| Soft rate limit (20/60min) | Correct | CopyPromptButton.tsx | |
| Progress tracking + bookmarks | Correct | useVaultDetail.ts, useVaultBookmarks.ts | |
| VaultCategoryGridPage ("See All") | Missing | — | No component or route exists |
| "+Add to AI Toolbox" on skill type | Wrong | VaultDetailView.tsx:125 | PRD says ai_tool only; code shows for skill too |
| Tier gating with locked overlay | Partial | VaultContentCard.tsx:40 | `isLocked` hardcoded false during beta |
| `physical_description`/`reference_photos` in ArchiveMemberSettings type | Missing | archives.ts | |

---

## PRD-34: ThoughtSift

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| All 5 tools (Board, Perspective, Decision, Mediator, Translator) | Correct | Multiple components + Edge Functions | |
| 6 DB tables | Correct | Migration 49 | |
| Persona disclaimer (once per session) | Correct | BoardOfDirectorsModal.tsx:568 | |
| Content policy gate (Haiku pre-screen) | Correct | BoardOfDirectorsModal.tsx:294 | |
| Prayer Seat implementation | Correct | BoardOfDirectorsModal.tsx:303 | |
| Personal custom personas pipeline guard | Correct | BoardOfDirectorsModal.tsx:330 | |
| Mediator safety_triggered persistence | Correct | lila-mediator Edge Function | |
| 5 Vault items seeded | Correct | Migration 49 | |

---

## PRD-35: Universal Scheduler

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| Radio-button interface (6 options) | Correct | UniversalScheduler.tsx | |
| RRULE JSONB output | Correct | types.ts:9-30 | |
| rrule.js usage | Correct | schedulerUtils.ts:8 | |
| Calendar preview (navigable, EXDATE, RDATE) | Correct | CalendarPreview.tsx | |
| [+ Add another] pattern | Correct | UniversalScheduler.tsx | |
| Compact mode | Correct | UniversalScheduler.tsx:41 | |
| RecurringEditPrompt | Correct | RecurringEditPrompt.tsx | |

---

## PRD-36: Universal Timer

| Requirement | Status | File(s) | Issue |
|---|---|---|---|
| Timestamp-based (started_at/ended_at) | Correct | useTimer.ts | |
| FloatingBubble at shell level (all 5 shells) | Correct | TimerProvider.tsx | |
| Multiple concurrent timers + badge | Correct | FloatingBubble.tsx | |
| 5 visual timer styles | Correct | VisualTimers.tsx | |
| Soft delete + edit audit trail | Correct | useTimer.ts:278-285,319 | |
| Swipe-away → restore dot | Correct | FloatingBubble.tsx:242-264 | |
| Idle reminder + auto-pause | Correct | TimerProvider.tsx:140-205 | |
| `timerMode` missing from time_session_completed event | Wrong | useTimer.ts:218-225 | PRD event contract specifies it |

---

## Cross-Cutting Concerns

### TypeScript Strict Compliance
- **PASS** — strict mode fully enabled, zero `@ts-ignore` or `@ts-expect-error` comments

### Dead Code
| Item | File | Type |
|---|---|---|
| `useModal` hook | `src/hooks/useModal.ts` | Never imported |
| `useTaskTemplates` hook | `src/hooks/useTaskTemplates.ts` | Never imported |
| `TaskTypeSelector` component | `src/components/tasks/TaskTypeSelector.tsx` | Never rendered (type-only import) |
| `LimitPrompt` component | `src/components/shared/LimitPrompt.tsx` | Exported, never imported |
| Deprecated `Tooltip.tsx` shim | `src/components/Tooltip.tsx` | Orphaned re-export |

### Hardcoded Colors (violations outside auth pages)
| File | Values |
|---|---|
| `src/pages/Welcome.tsx:40,75,86,96,109` | `#ffffff`, `#7a6a5f` |
| `src/components/tour/GuidedIntroTour.tsx:145` | `#D6A461` |
| `src/components/calendar/DateDetailModal.tsx:250` | `#fff` |
| `src/components/lila/PersonPillSelector.tsx:90,105` | `#fff` |
| `src/components/calendar/EventCreationModal.tsx:333` | `#fff` |
| `src/components/shared/SparkleOverlay.tsx:102` | `rgba(212,175,55,0.4)` |

### Density Classes Missing (12+ pages)
Journal, BestIntentions, Lists, GuidingStars, InnerWorkings, PermissionHub, FamilyMembers, LanternsPath, Hub, SettingsPage, ArchivesPage, FamilyOverviewDetail, MemberArchiveDetail

### Legacy Modal Usage (should be ModalV2)
GuidedFormReviewView, ContentRequestForm, GuidingStars (inspiration modal), FaithPreferencesModal, BulkAddSortModal, CropPreviewModal, VoiceDumpModal

### Direct createPortal Bypassing ModalV2
QuickCreate, SpotlightSearch, GuidedFormFillView, LilaModeSwitcher, UniversalQueueModal, VaultDetailView

### Icon Semantic Violations

**Eye/EyeOff (should be password-only):**
- GuidedFormReviewView.tsx:190 — "Reviewed" badge
- WidgetConfiguration.tsx:192 — "Deploy to Dashboard" button
- PermissionHub.tsx:198,1138,1143 — visibility/permission states
- FamilyOverviewDetail.tsx:680 — "Family Vision Statement"

**Heart (should be is_included_in_ai only):**
- Sidebar.tsx:67 — InnerWorkings nav icon
- StudioTemplateCard.tsx:79 — Apology Reflection icon
- GuidedFormAssignModal.tsx:50 — form type icon
- Lists.tsx — Wishlist type icon
- LanternsPath.tsx — decorative icon
- ToolConversationModal.tsx — tool type icon

### FeatureGuide Missing
Journal, BestIntentions, LanternsPath, Hub, SettingsPage, Welcome

### Edge Functions — Pattern Gaps

**Zod validation:** 0 of 19 functions use Zod. All rely on manual field checks.

**AI cost logging missing:**
- `ai-parse` — comment says "Log usage" but no insert to ai_usage_tracking
- `extract-insights` — Sonnet calls with no cost logging at all

**CORS missing:** `embed` function (acceptable — cron-triggered, not browser-called)

### Migration Health
- 54 total migrations, two namespaces (0000... and 0001...)
- No circular dependencies
- One redundant CREATE TABLE (platform_assets in migrations 23 + 25, guarded by IF NOT EXISTS)
- All use idempotent patterns (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS)

---

## Feature Decision File Gaps

| PRD | Decision File | Status |
|---|---|---|
| PRD-08 | Named `PRD-09-repair.md` | Mislabeled |
| PRD-09A | None | Missing |
| PRD-09B | None | Missing |
| PRD-14 | None | Missing (dashboard built as part of PRD-04) |
