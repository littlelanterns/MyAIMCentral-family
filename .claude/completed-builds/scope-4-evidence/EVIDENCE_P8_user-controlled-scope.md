---
Status: COMPLETE — awaiting orchestrator adjudication
Stage: C
Scope: 4
Pattern: P8 — User-Controlled Scope
Opened: 2026-04-20
ai_patterns.md reference: L200
Dynamic evidence: None (static-only per PLAN §2.8)
---

# Scope 4 — P8 User-Controlled Scope Evidence Pass

## Worker summary

Pattern P8 (ai_patterns.md L200): "Let users opt in/out of specific AI features via toggles." The flagship implementation is the three-tier `is_included_in_ai` toggle chain (person / folder / item) documented in CLAUDE.md Conventions #8 and #74. Per-member `lila_tool_permissions` gates per-tool access.

**Method:** (1) Grep `claude/live_schema.md` for every table with `is_included_in_ai` column → 21 tables. (2) Grep `src/` for each table's UI mutation — identify which tables have a user-visible Heart/HeartOff toggle vs DB-only. (3) Enumerate every AI-consuming Edge Function under `supabase/functions/` and verify each either reads through `_shared/context-assembler.ts` / `_shared/relationship-context.ts` (which honor `is_included_in_ai`) or reads only user-supplied text (no context-table reads). (4) Verify per-tool feature toggles (`member_feature_toggles`, `lila_tool_permissions`) and per-member coaching toggle (`message_coaching_settings.is_enabled`).

**Headline result:** P8 applied at most sites where it matters most. **Three-tier archive chain is fully wired** (person/folder/item each have HeartOff UI). Guiding Stars, Best Intentions, Self-Knowledge (InnerWorkings), Lists, and the archive chain expose Heart/HeartOff toggles in their pages. Per-tool gating via `member_feature_toggles` (PermissionHub) and per-tool `lila_tool_permissions` (vault MemberAssignmentModal) is wired. Message-coaching toggle wired per-member in Messaging Settings.

**Gaps identified:** Five tables expose an `is_included_in_ai` column with filtering logic but **no user-facing UI toggle** — `journal_entries`, `calendar_events`, `dashboard_widgets`, `family_best_intentions`, and (functionally) individual bookshelf extractions. Two tables ship with column + 0 rows + no UI + no consuming Edge-Function filter (`private_notes`, `relationship_notes`) and are effectively un-launched. Faith preferences relies on `relevance_setting='manual'` as a soft opt-out proxy rather than the column-level `is_included_in_ai` boolean. `book_knowledge_access` is implemented as a member-level setting but the **UI to change it is not built** — the `useBookShelfSettings` hook exists but no component renders a picker. Verdict: P8 applied correctly at 15 of 21 context-source sites; 6 sites have column-shipped-UI-missing gaps. None are beta-blocking (default is included — so it's a "can't opt out" concern, not a "forced AI on data the user never consented to" concern).

## Site enumeration table — `is_included_in_ai` tables

| Table | Column exists | UI toggle location | Mutation hook | Three-tier level | Verdict |
|---|---|---|---|---|---|
| `archive_member_settings` | Yes (L1418) | `MemberArchiveDetail.tsx:754-764` (person-level heart) | `useArchives.ts:300-362` (togglePersonLevel) | **Person** (Tier 1) | **Applied** |
| `archive_folders` | Yes (L1382) | `MemberArchiveDetail.tsx:345-355` (folder-level heart) | `useArchives.ts` `updateFolder` | **Category** (Tier 2) | **Applied** |
| `archive_context_items` | Yes (L1396) | `MemberArchiveDetail.tsx:569-584` (item-level heart) | `useArchives.ts:710-714` | **Item** (Tier 3) | **Applied** |
| `guiding_stars` | Yes (L422) | `GuidingStars.tsx:108-125, 288-293` (Heart/HeartOff) | `useGuidingStars.ts:130-160` | Item-level | **Applied** |
| `best_intentions` | Yes (L447) | `BestIntentions.tsx:268-291` | `useBestIntentions.ts:234-244` | Item-level | **Applied** |
| `self_knowledge` | Yes (L489) | `InnerWorkings.tsx:155-158, 918-924` | `useSelfKnowledge.ts:280-307` (per-item + per-category batch) | Item + category batch | **Applied** |
| `lists` | Yes (L886) | `Lists.tsx:2117-2127` (per-list heart) | `useLists` `updateList` | Per-list | **Applied** |
| `journal_entries` | Yes (L512) | **NONE** | **None found** (no mutation exposes toggle) | Item-level | **Not applied** — column read at `src/lib/ai/context-assembly.ts:500-505` but no UI to change default `true` |
| `calendar_events` | Yes (L1170) | **NONE** | No toggle mutation | Item-level | **Not applied** — column written `is_included_in_ai: true` on create (SortTab.tsx:326, CalendarTab.tsx:471), no user toggle. Note: `calendar_events` is NOT currently read by Edge-Function context-assembler, so the column is defensive infrastructure. |
| `dashboard_widgets` | Yes (L1058) | **NONE** | No mutation | Per-widget | **Not applied** — column filtered in `Dashboard.tsx:198` for guiding-stars context seed, but widget-level `is_included_in_ai` has no toggle UI anywhere in `src/components/widgets/` |
| `family_best_intentions` | Yes (L1267) | **NONE** | Hook supports `isIncludedInAi` param (`useFamilyBestIntentions.ts:140`) but no component calls it | Item-level | **Not applied** — mutation scaffolded, never wired to UI |
| `faith_preferences` | Yes (L1449) | `FaithPreferencesModal.tsx:577-598` (3-option radio `relevance_setting`: automatic / always / manual) | `useArchives.ts` faith path | Family-level | **Ambiguous** — `relevance_setting='manual'` acts as soft opt-out; dedicated `is_included_in_ai` toggle not exposed. Edge Function at `context-assembler.ts:384` honors the column when set to `false`, so the DB-level opt-out is wired — just not exposed as a separate UI. |
| `bookshelf_summaries` | Yes (L1823) | **NONE per-item** (member-level `book_knowledge_access` acts as gate) | — | Item-level | **Partial** — member-level `book_knowledge_access` (hearted_only / all / insights_only / none) gates consumption in `context-assembler.ts:320-336`. Per-item `is_hearted` is the user-visible toggle (`items/*Item.tsx`). Per-item `is_included_in_ai` is default true; not user-toggleable. Acceptable because member-level + heart-filtering covers P8. |
| `bookshelf_insights` | Yes (L1848) | same as summaries | — | Item-level | **Partial** — same pattern |
| `bookshelf_declarations` | Yes (L1876) | same | — | Item-level | **Partial** — same pattern |
| `bookshelf_action_steps` | Yes (L1902) | same | — | Item-level | **Partial** — same pattern |
| `bookshelf_questions` | Yes (L1930) | same | — | Item-level | **Partial** — same pattern |
| `bookshelf_user_state` | Yes (L2039) | (per-user state for platform-library extraction overrides) | `extractionActions.ts` is_hearted toggle | Per-user-per-extraction | **Partial** — `is_hearted` is user-facing; column-level `is_included_in_ai` defaults true, no separate toggle |
| `journal_visibility_settings` | Yes — `is_included_in_ai_default` (L2948) | **NONE** | No UI | Per-entry-type default | **Not applied** — cross-referenced by SCOPE-2.F18 (PRD-08 per-child journal visibility UI missing). Cite and skip. |
| `private_notes` | Yes (L3243) | **NONE** (table has 0 rows, unbuilt) | — | Item-level | **Not applied** — feature unbuilt per SCOPE-2.F22/F23 pattern. Cite and skip. |
| `relationship_notes` | Yes (L3305) | **NONE** (table has 0 rows, unbuilt) | — | Item-level | **Not applied** — feature unbuilt. Cite and skip. |

**Three-tier archive chain — all three tiers wired ✓** (the flagship P8 site).

## Site enumeration table — AI-consuming Edge Functions

| Edge Function | Context sources read | `is_included_in_ai` filter applied? | Tool-level toggle | Verdict |
|---|---|---|---|---|
| `lila-chat` | Via `_shared/context-assembler.ts` (guiding_stars, self_knowledge, archive, faith, bookshelf, wishlist) | **Yes** — every `.from(...)` includes `.eq('is_included_in_ai', true)` | `lila_tool_permissions` / default-enabled | **Applied** |
| `lila-board-of-directors` | guiding_stars, best_intentions, self_knowledge (L422-428) | **Yes** — explicit `.eq('is_included_in_ai', true)` on all three | `lila_tool_permissions` via vault assignment | **Applied** |
| `lila-decision-guide` | guiding_stars, best_intentions, self_knowledge (L34-69) | **Yes** — explicit filter | Per-tool | **Applied** |
| `lila-cyrano` / `lila-higgins-say` / `lila-higgins-navigate` / `lila-quality-time` / `lila-gifts` / `lila-observe-serve` / `lila-words-affirmation` / `lila-gratitude` / `lila-mediator` / `lila-perspective-shifter` | Via `_shared/relationship-context.ts` | **Yes** — relationship-context.ts filters `is_included_in_ai=true` at L143-179, L286, L301, L370-448 | Per-tool | **Applied** |
| `lila-message-respond` | Via `assembleContext()` + `communication_guidelines` | **Yes** (inherited) | `messaging_settings` + `lila_tool_permissions` | **Applied** |
| `bookshelf-discuss` | Via `assembleContext()` + RPC `get_bookshelf_context` honors `book_knowledge_access` | **Yes** | Per-tool | **Applied** |
| `bookshelf-study-guide` | guiding_stars (L90) | **Yes** — `.eq('is_included_in_ai', true)` | Per-tool | **Applied** |
| `celebrate-victory` | guiding_stars, best_intentions, self_knowledge (L40-65) | **Yes** — all three filtered | Auto-fired on victory; no per-user toggle (by design) | **Applied** |
| `scan-activity-victories` | guiding_stars, best_intentions (L87-100) | **Yes** | Scheduled background; uses `is_included_in_ai` to respect opt-outs | **Applied** |
| `message-coach` | `messaging_settings.communication_guidelines` only | N/A — reads a single settings row | `message_coaching_settings.is_enabled` per-member toggle wired `MessagingSettings.tsx:200` | **Applied** |
| `auto-title-thread` | User-supplied first-message text only | N/A — no context-table reads | Fire-and-forget; no user toggle (Haiku titles) | **Applied** (user-supplied input only) |
| `task-breaker` | User-supplied task text only | N/A | AI Vault entry + per-tier gating | **Applied** (user-initiated per-call) |
| `curriculum-parse` | User-supplied paste text only | N/A | User-initiated per-call | **Applied** |
| `smart-list-import` | User-supplied text only | N/A | User-initiated | **Applied** |
| `homework-estimate` | Subjects + description only | N/A | User-initiated per call | **Applied** |
| `ai-parse` | User-supplied text only | N/A | User-initiated | **Applied** |
| `guided-nbt-glaze` | User context (task name, NBT reason) only | N/A | Lightweight enhancement; per-member rhythm enabled | **Applied** |
| `spelling-coach` | Misspelling only | N/A (cache-first per CLAUDE.md Convention #130) | Per-member `spelling_coach_enabled` preference (implied) | **Applied** |
| `mindsweep-sort` / `mindsweep-auto-sweep` / `mindsweep-email-intake` / `mindsweep-scan` | User capture text + destinations list (NOT context-source tables) | N/A — classifies INTO destinations, doesn't read FROM them | `mindsweep_settings` per-member aggressiveness config | **Applied** |
| `extract-insights` / `bookshelf-extract` / `bookshelf-process` / `bookshelf-key-points` / `bookshelf-search` | Book-library content only (user-uploaded) | N/A — extraction from user-supplied book | Per-member `book_knowledge_access` | **Applied** |
| `describe-vs-icon` / `embed` / `embed-text-admin` / `generate-query-embedding` / `whisper-transcribe` / `notify-out-of-nest` / `accrue-loan-interest` / `calculate-allowance-period` / `process-carry-forward-fallback` | Platform infrastructure; not user-data AI calls | N/A | N/A | **Applied** (infrastructure) |

**Every AI-consuming Edge Function that reads context-source tables honors `is_included_in_ai=true` filters.** No bypass path found.

## Three-tier chain check

| Tier | Table | Storage column | UI element | Verdict |
|---|---|---|---|---|
| Person | `archive_member_settings.is_included_in_ai` | DB default `true` | `MemberArchiveDetail.tsx:754` person-level heart toggle with snooze explanation on opt-out | **Wired** |
| Category | `archive_folders.is_included_in_ai` | DB default `true` | `MemberArchiveDetail.tsx:345` folder-level heart toggle + active/total counter | **Wired** |
| Item | `archive_context_items.is_included_in_ai` | DB default `true` | `MemberArchiveDetail.tsx:569-584` item-level heart toggle | **Wired** |

**All three tiers wired with HeartOff semantics per CLAUDE.md Convention #Icon Semantics.** Convention #75 ("checked somewhere, checked everywhere") also wired — `useArchives.ts:690-714` explicitly toggles source-table `is_included_in_ai` when an aggregated item (e.g., InnerWorkings entry surfaced in Archives) is flipped. No gap in flagship three-tier implementation.

## Recent builds regression check

Scanned `.claude/completed-builds/2026-04/` (15 build files, Builds C–P plus Phase 1b):

- **Build O — PRD-28 Tracking, Allowance & Financial (2026-04-13):** introduced `homework-estimate` Edge Function (Haiku subject-allocation). Takes user-supplied description + subjects list; does NOT read context-source tables. Financial data explicitly excluded from LiLa context (CLAUDE.md Convention #225). **No P8 gap introduced.**
- **Build P — PRD-16 Meetings (2026-04-16):** adds meeting facilitation via `lila-chat` guided mode. Context assembly via `assembleContext()` — inherits all P8 filters. Meeting impressions marked personal-only (CLAUDE.md Convention #232) — opt-out is the default. **No P8 gap introduced.**
- **Build M — PRD-24+26 Play Dashboard + Sticker Book (2026-04-13):** no new AI-consuming Edge Functions. Gamification is local logic via `roll_creature_for_completion` RPC. **No P8 gap introduced.**
- **Build L — PRD-18 Phase C AI Enhancements (2026-04):** added Morning Insight, Feature Discovery, MindSweep-Lite (reuses existing `mindsweep-sort`). New `generate-query-embedding` wrapper (platform infrastructure, no user-data context). Per-rhythm-section enable via `rhythm_configs.sections[*].enabled` — implicit P8 opt-out. Per-member dismissals via `feature_discovery_dismissals`. **No P8 gap introduced.**
- **Builds C–K:** Studio Intelligence, Linked Steps, Rhythms Phases A/B, Guided Dashboard, Queue Gap Fill, MindSweep, BookShelf Phase 1, Messages — all consume user-initiated text or go through `assembleContext()` / `relationship-context.ts`. No bypass path introduced.
- **Phase 1b — PRD-23 BookShelf Platform Migration:** introduced `get_bookshelf_context` RPC that honors `book_knowledge_access` member-level setting. P8 control tightened (RPC centralizes filter), not loosened.

No regression. All recent builds either opt through `assembleContext()` (inheriting `is_included_in_ai` filters) or operate on user-initiated input (per-call user consent).

## Unexpected findings

1. **`book_knowledge_access` member setting has no UI picker.** `useBookShelfSettings.ts` exposes an `updateSetting('bookKnowledgeAccess', value)` mutation, and the hook is imported from exactly zero components (grep confirms). Default `'hearted_only'` applies. Mom cannot change her per-member book_knowledge_access without DB access. This is a UI gap, not a pattern miss — the filter is wired, the control surface is missing. Recommend surfacing as Settings row when PRD-22 Settings page is built.

2. **`faith_preferences.is_included_in_ai` column exists separately from `relevance_setting`.** CLAUDE.md Convention #78 confirms individual boolean columns are authoritative. Context-assembler reads both — `relevance_setting='manual'` + `is_included_in_ai=false` are distinct opt-outs. Only `relevance_setting` has UI; the column `is_included_in_ai` is DB-default `true` with no UI. Low-severity — `relevance_setting='manual'` suffices as user-facing opt-out.

3. **Calendar events have `is_included_in_ai` column but calendar context is NOT currently read by any Edge Function.** SortTab.tsx:326 and CalendarTab.tsx:471 write `is_included_in_ai: true` on create, but grep against `supabase/functions/` shows no `.from('calendar_events').select(...).eq('is_included_in_ai', ...)`. Column is defensive infrastructure for future calendar-context feature. Not a miss today because the data isn't being consumed — P8 compliance vacuously holds. Re-audit when calendar-context-to-LiLa feature lands.

4. **`dashboard_widgets.is_included_in_ai` column similarly defensive.** No context-assembler path loads widget data into LiLa context today. Filtered in `Dashboard.tsx:198` for an unrelated purpose (guiding-stars greeting rotation). Column-default-true + no UI = vacuously P8-compliant until widget-data-to-LiLa feature lands.

5. **`family_best_intentions` table (1 row in prod) has mutation hook wired but no UI surface.** `useFamilyBestIntentions.ts:140` supports `isIncludedInAi` param. No component in `src/components/hub` or `src/pages` passes it. Family Hub surface for family-level intentions exists; AI-toggle UI missing. Minor gap — low-severity because family intentions are family-wide by design and default-true matches mom's expected behavior.

6. **Journal entries have NO `is_included_in_ai` toggle UI.** Client-side `src/lib/ai/context-assembly.ts:500-505` filters `journal_entries.is_included_in_ai=true` (client is only a secondary path; primary is Edge Function). Column defaults to true. No Heart/HeartOff on `Journal.tsx` entries. Mom cannot exclude a specific journal entry from AI context without DB access. Distinct from SCOPE-2.F18 (which covers per-child-per-entry-type visibility gate for parents viewing teens — different concern).

## Proposed consolidation

Per PLAN §5.1 (one finding per pattern-level miss), propose **one SCOPE-4.F{N} finding**:

**Draft title:** "P8 three-tier `is_included_in_ai` toggle chain applied at flagship Archives + 5 core context tables; 6 adjacent tables ship column with no UI surface"

**Severity:** Low.

**Body:** Core P8 sites (Archives person/folder/item, Guiding Stars, Best Intentions, Self-Knowledge, Lists) all expose Heart/HeartOff UI. Every AI-consuming Edge Function honors `is_included_in_ai=true` filters (context-assembler + relationship-context + direct per-table filter in 6 functions). Per-tool gating wired via `member_feature_toggles` (PermissionHub) and `lila_tool_permissions` (vault assignment). Message-coaching toggle wired per-member. Gaps: `journal_entries`, `calendar_events`, `dashboard_widgets`, `family_best_intentions`, faith preferences (`is_included_in_ai` vs the shipped `relevance_setting` proxy), and bookshelf member-level `book_knowledge_access` (hook exists, UI-picker missing) have shipped DB columns but no user-facing toggle. Of these six, two are "defensive infrastructure" on data not yet consumed by AI (calendar_events, dashboard_widgets) — vacuously compliant until consumption lands. Three are real but low-severity gaps (journal_entries, family_best_intentions, book_knowledge_access picker). One is effectively covered by an alternate UI (faith `relevance_setting` + member-level bookshelf hearted-filter).

**Classification:** Intentional-Ship-As-Is for the two defensive-infrastructure columns. Fix-Next-Build for `book_knowledge_access` UI (trivial — hook already exists). Fix-Next-Build for journal Heart/HeartOff if/when journal-to-LiLa consumption becomes more prominent than the currently-conservative client-side read. Low-priority fix for `family_best_intentions` toggle UI.

**Cross-references to existing scopes:**
- **SCOPE-2.F18** (PRD-08 per-child journal visibility UI missing) — different angle on journal UI (parent-to-teen visibility vs self opt-out from AI). Cite and skip; distinct root cause.
- **No SCOPE-2 finding** on calendar_events `is_included_in_ai` toggle — this is a Scope 4 pattern-level observation, not a PRD-alignment miss.
- **No SCOPE-2 finding** on dashboard_widgets AI-toggle — same.

**Beta Readiness flag:** N.
- Default is `true` (included), which means users are opted-IN to AI by default — there is no "forced AI on data the user never consented to" concern; only a "can't opt out specific items" concern.
- `member_feature_toggles` already provides family-wide per-feature disable for any mom who wants to turn off a whole AI surface for a member.
- Safe Harbor and Privacy-Filtered hard exclusions (CLAUDE.md Conventions #6, #76) apply orthogonally and are wired.
- No projected cost impact — users can already opt out at the feature-level (Convention #8 tier toggle) if cost is the concern.

**Fix scope (single finding):**
- Add Heart/HeartOff toggles on journal entry cards (wire existing `useJournal` to include a toggle mutation).
- Add `BookKnowledgeAccess` picker component wired to existing `useBookShelfSettings.updateSetting` hook — surface on Settings → BookShelf.
- Add is_included_in_ai toggle on family-best-intention cards (wire existing `useFamilyBestIntentions` mutation param).
- Dashboard widgets + calendar events: defer until those surfaces actually feed LiLa context. Re-audit trigger: first Edge Function call-site that reads `calendar_events` or `dashboard_widgets` for AI context.
- Faith preferences: consider dropping the redundant `is_included_in_ai` column if `relevance_setting` is authoritative (or expose both — founder decision at walk-through).

## Orchestrator adjudication

*(leave blank — filled by orchestrator walk-through)*
