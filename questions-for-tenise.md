# Questions for Tenise — Post-Audit Decisions

> Generated from the full platform audit on 2026-03-28.
> Each question requires a founder decision before the fix session.
> Previous pre-build questions have been archived (they were answered during earlier sessions).

---

## 1. Broken Features — Fix Priority

**Context:** The audit found 10 pieces of broken wiring where code exists but doesn't actually work. These need to be prioritized.

**Question:** Which of these should be fixed first? Suggest ranking by what would embarrass you most in a demo.

**Broken items (proposed priority order):**
1. Calendar edit flow (EventCreationModal can't pre-populate for editing)
2. TrackerQuickCreateModal (console.log stub — widgets never created via quick-create)
3. Opportunity sub-type selector (disconnected from TaskCreationModal — can't pick claimable/repeatable/capped)
4. Items-to-bring checklist (readOnly — can't check items off)
5. CalendarWidget Settings button (dead — no onClick)
6. DashboardGrid drag-to-reorder (not implemented — @dnd-kit not wired)
7. Widget folder tap (no-op)
8. Task flyout missing Change Due Date / Mark Complete
9. dashboard_configs never queried (layout persistence dead)
10. Responsive grid columns (always 2)

**Options:**
- A: Fix all 10 in a focused fix session before building new features
- B: Fix top 5 now, defer 6-10 until PRD-10 Phase B
- C: Fix only demo-critical items (1-5), leave infrastructure items for later

---

## 2. View As — What Should It Actually Do?

**Context:** PRD-04 says View As should render the target member's full shell with their theme. Current code: `ViewAsShellWrapper` is a no-op passthrough. `ViewAsModal` shows a fixed-position overlay containing only the Dashboard — no shell wrapper, no theme switching.

**Question:** Is the current simplified View As (modal overlay showing Dashboard only) acceptable for beta, or should it render the full target shell + theme?

**Options:**
- A: Current behavior is fine for beta — View As is primarily for checking what's on a member's dashboard
- B: Must render target member's shell type but current theme is fine
- C: Full PRD spec — target shell + target theme (this is significant work)

---

## 3. AI Toolbox Sidebar — Keep or Remove?

**Context:** PRD-21 specifies an AI Toolbox section in the sidebar. The post-build verification marked it "Wired." But `Sidebar.tsx` line 354 has a comment: "AI Toolbox removed — tools accessible via LiLa guided mode switcher."

**Question:** Should there be an AI Toolbox section in the sidebar, or is the LiLa mode switcher sufficient?

**Options:**
- A: Remove the sidebar section permanently — LiLa mode switcher is the entry point
- B: Restore sidebar section as a quick-launch grid for assigned tools
- C: Defer until PRD-21 Phase 2 (post-beta)

---

## 4. Settings — Route or Overlay?

**Context:** PRD-04 says Settings should be an overlay triggered by the gear icon (not a route). Current code: gear icon navigates to `/settings` via `window.location.href` (full page reload). PRD-22 (Settings full UI) is documented as a stub.

**Question:** For beta, should Settings remain as a page route, or should we convert to an overlay now?

**Options:**
- A: Keep as page route for beta — convert to overlay when PRD-22 is built
- B: Convert to slide-over overlay now (less jarring, matches PRD intent)

---

## 5. Privacy Filtered Enforcement Gap

**Context:** `is_privacy_filtered` items are correctly managed in the UI (PrivacyFilteredPage, toggle controls). However, the client-side `context-assembly.ts` pipeline does NOT filter out `is_privacy_filtered = true` items. This means if context assembly runs client-side (not through an Edge Function), privacy-filtered items could leak into LiLa context for non-mom members.

**Question:** Is context assembly always server-side (Edge Functions only), or does any client-side path exist?

**Options:**
- A: Context assembly is Edge Function-only — add the filter there and skip client-side (verify this is true)
- B: Client-side assembly exists — must add `is_privacy_filtered` filter to `context-assembly.ts` immediately

---

## 6. Heart Icon — Dual Use

**Context:** CLAUDE.md Convention says Heart/HeartOff is exclusively for `is_included_in_ai` toggles. The audit found Heart used as a decorative/nav icon in 6+ places: sidebar nav for InnerWorkings, Apology Reflection form type icon, Wishlist list type icon, etc.

**Question:** Should Heart be restricted to AI context toggles only (replace decorative uses with other icons), or is the dual use acceptable?

**Options:**
- A: Strict enforcement — replace all decorative Heart uses with different Lucide icons (Brain for InnerWorkings, Gift for Wishlist, etc.)
- B: Heart is fine for both purposes — the convention is aspirational, not enforced
- C: Enforce only in contexts where confusion is possible (near AI toggles), allow elsewhere

---

## 7. Eye Icon — "Reviewed" and "Visibility" Uses

**Context:** CLAUDE.md says Eye/EyeOff is exclusively for password visibility. The audit found Eye used for "Reviewed" status in Guided Forms, "Deploy to Dashboard" in Widgets, and teen visibility states in PermissionHub.

**Question:** Same as Heart — strict enforcement or acceptable dual use?

**Options:**
- A: Strict — replace all non-password Eye uses (CheckCircle for Reviewed, Layout for Deploy, Shield for Visibility)
- B: Eye for "visibility" concepts is intuitive — keep for permissions/view states, replace for other misuses
- C: Convention is aspirational — leave as-is

---

## 8. Density Classes — Backfill or Defer?

**Context:** Only 5 of ~20 feature pages have density wrappers. Convention says "Every page or surface wrapper MUST declare a density class." 12+ pages are missing them.

**Question:** Should we backfill density classes across all pages in the fix session?

**Options:**
- A: Backfill all pages now (quick — just adding a CSS class to each wrapper div)
- B: Backfill only the pages that are visually dense (Studio, Dashboard, Vault already done; add Archives, Lists, Calendar)
- C: Defer until /simplify pass

---

## 9. Legacy Modal -> ModalV2 Migration

**Context:** 7 components still use the legacy `Modal` component instead of `ModalV2`. Additionally, 6 components bypass the modal system entirely with direct `createPortal` calls.

**Question:** Should legacy modals be migrated to ModalV2 in the fix session?

**Options:**
- A: Migrate all 7 legacy Modal usages now (moderate effort)
- B: Migrate only the ones users interact with frequently (FaithPreferencesModal, GuidedFormReviewView)
- C: Defer to /simplify pass — they work, they're just inconsistent

---

## 10. Zod Validation in Edge Functions

**Context:** Zero of 19 Edge Functions use Zod for input validation. All rely on manual field checks. CLAUDE.md conventions say "Always validate input with Zod schemas."

**Question:** Should Zod be added to all Edge Functions, or just the ones that face user input directly?

**Options:**
- A: Add Zod to all 19 functions (significant effort, most reliable)
- B: Add Zod to the 4 most critical: `lila-chat`, `ai-parse`, `whisper-transcribe`, `extract-insights`
- C: Defer — manual validation is working, Zod is a convention not a blocker

---

## 11. AI Cost Logging Gaps

**Context:** `ai-parse` has a comment saying "Log usage (fire-and-forget)" but the actual insert to `ai_usage_tracking` was never written. `extract-insights` (which processes PDFs with Sonnet) has no cost logging at all.

**Question:** Fix these now? They affect cost visibility.

**Options:**
- A: Fix both immediately — 10 minutes each, important for cost tracking
- B: Fix `extract-insights` (expensive Sonnet calls) now, defer `ai-parse` (lighter calls)

---

## 12. TaskCreationModal Full Mode — Collapsible Sections?

**Context:** PRD-09A says "7 collapsible sections" in Full Mode. Current code uses static `SectionCard` wrappers — no expand/collapse toggle.

**Question:** Should sections be collapsible, or is the current static layout acceptable?

**Options:**
- A: Make sections collapsible (accordion pattern) — matches PRD spec
- B: Current static layout is fine — modal already scrolls, collapsing adds complexity

---

## 13. VaultCategoryGridPage — Build or Defer?

**Context:** PRD-21A Screen spec includes a "See All" grid page for browsing all items in a category. No component or route exists. Category rows have a "See All" text but nowhere to navigate.

**Question:** Build this page now, or defer?

**Options:**
- A: Build now — it's a simple filtered grid page, maybe 1 hour
- B: Defer — category rows show enough for beta

---

## 14. Feature Decision File Gaps

**Context:** PRD-09A, PRD-09B, and PRD-14 have no feature decision files. PRD-08's decision file is mislabeled as `PRD-09-repair.md`.

**Question:** Should these be created retroactively?

**Options:**
- A: Create minimal decision files documenting what was actually built + stubs
- B: Skip — the code is the source of truth for already-built features
- C: Rename the mislabeled file, skip creating new ones

---

## 15. `sequential` Task Type — Standalone or List-Only?

**Context:** PRD-09A defines `sequential` as a task type. Current code only exposes sequential as a list delivery mode (within the new "List" task type button). Users cannot create a standalone sequential collection via the TASK_TYPES_GRID.

**Question:** Should `sequential` appear as its own button in the task type grid, or is list-delivery-mode sufficient?

**Options:**
- A: Add sequential to the task type grid as a 6th button
- B: List delivery mode is sufficient — sequential lives inside the list task type
- C: Defer until PRD-09A Phase 2
