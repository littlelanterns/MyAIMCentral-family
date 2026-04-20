# Round 4 Spot-Check Report

> Produced 2026-04-20 by Scope 5 Round 4 walk-through.
> Scope: sample ~20 entries across Section 4 "confirmed-accurate" categories of
> `scope-5-evidence/STUB_REGISTRY_RECONCILIATION_DRAFT.md`. Verify each against
> current code via direct grep/file inspection. Apply founder's rule.

## Sampling strategy

Pulled 22 entries across 17 Section 4 category clusters. Favored entries with the
most implementation complexity (highest risk of synthesis misclassification) and
skipped entries already adjudicated in Rounds 1-3.

## Summary

- **Total sampled:** 22
- **Confirmed:** 21
- **Exceptions:** 1

---

## Confirmed entries

| Line | Stub title (truncated) | Current | One-line verification |
|---|---|---|---|
| 32 | View As sessions | ✅ Wired | [`ViewAsProvider.tsx`](src/lib/permissions/ViewAsProvider.tsx) references `view_as_sessions` table (4 hits); live_schema.md shows 143 rows, active use. |
| 65 | BookShelf RAG context | ✅ Wired | `get_bookshelf_context` platform RPC found in migrations 100094 and 100131; [`context-assembler.ts`](supabase/functions/_shared/context-assembler.ts) imports it. |
| 107 | Archives "checked somewhere, checked everywhere" | ✅ Wired | `is_included_in_ai` read/write sites in ArchivesPage.tsx, FamilyOverviewDetail.tsx, MemberArchiveDetail.tsx; matches CLAUDE.md Convention #75. |
| 129 | Family Meeting Notes structured routing | ✅ Wired | [`completeMeeting.ts:61`](src/lib/meetings/completeMeeting.ts#L61) writes `entry_type: 'meeting_notes'` to `journal_entries` with tags. |
| 156 | Guided "Things to Talk About" capture widget | ✅ Wired | [`GuidedThingsToTalkAboutSection.tsx`](src/components/guided/GuidedThingsToTalkAboutSection.tsx) imported and rendered by GuidedDashboard.tsx. |
| 175 | PRD-18 Phase A `evening_tomorrow_capture` | ✅ Wired | [`EveningTomorrowCaptureSection.tsx`](src/components/rhythms/sections/EveningTomorrowCaptureSection.tsx) + `commitTomorrowCapture.ts` + `RhythmMetadataContext.tsx` all present; matches Convention #169. |
| 194 | PRD-18 Phase D Teen tailored rhythm | ✅ Wired | [`MindSweepLiteTeenSection.tsx`](src/components/rhythms/sections/MindSweepLiteTeenSection.tsx) + migration 100114 seed; CLAUDE.md Conventions #189-197 document full Build N scope. |
| 207 | AI Vault sidebar navigation | ✅ Wired | [`Sidebar.tsx:95,117,134`](src/components/shells/Sidebar.tsx) registers `/vault` entry for all three shells with `vault_browse` / `vault_consume` feature keys. |
| 231 | bookshelf_chapters migration to platform | 📌 Post-MVP | `bookshelf_chapters` table created in migration 100059 as per-family table; no migration to `platform_intelligence` schema. Consistent. |
| 256 | Task segments (Build M) | ✅ Wired | [`useTaskSegments.ts`](src/hooks/useTaskSegments.ts) CRUD hook exists; CLAUDE.md Convention #208 confirms Build M delivery 2026-04-11. |
| 284 | Safety journal/message scanning | 📌 Post-MVP | No `safety-classify` Edge Function in `supabase/functions/`. Consistent with PRD-30 not yet shipped. |
| 298 | Blog comment threading | 📌 Post-MVP | No `parent_comment_id` / `reply_to` columns in blog migrations. Consistent. |
| 305 | External calendar sync | 📌 Post-MVP | `external_id` / `external_source` columns exist in `calendar_events` (migration 100052) for future sync, but no sync code in `src/`. Consistent — schema scaffolded, feature not built. |
| 344 | Universal Scheduler UI component | ✅ Wired | [`src/components/scheduling/`](src/components/scheduling/) directory contains `UniversalScheduler.tsx`, `CalendarPreview.tsx`, `RecurringEditPrompt.tsx`, `WeekdayCircles.tsx`, `schedulerUtils.ts`, `useSchedulerState.ts`, `types.ts`, `index.ts`. Full implementation. |
| 399 | ListPicker overlay (Notepad → Lists) | ⏳ Unwired (MVP) | No direct inline overlay in `src/components/notepad/`. Queue-based flow (Notepad → studio_queue → SortTab → ListPickerModal) works, but the stub wording specifically names "overlay" — direct inline overlay is genuinely unbuilt. See Observation below. |
| 408 | Dashboard grid + 6 tracker types | ✅ Wired | 7 `phaseA: true` entries in TRACKER_TYPE_REGISTRY (5 PhaseATrackerType union + randomizer_spinner + privilege_status); Dashboard grid working per PRD-10 Phase A. (Minor count discrepancy: registry says "6", code has 5-7 depending on definition — see Observation below.) |
| 433 | Sequential collection creation (end-to-end) | ✅ Wired | [`useSequentialCollections.ts`](src/hooks/useSequentialCollections.ts) + [`SequentialCreatorModal.tsx`](src/components/tasks/sequential/SequentialCreatorModal.tsx) both present; matches CLAUDE.md Convention #150-152. |
| 456 | Board of Directors persona library | ✅ Wired | `board_personas` table has 18 rows per live_schema.md; table schema matches PRD-34 structure. |
| 494 | Sequential advancement modes (practice_count, mastery) | ✅ Wired | Migration [`00000000100105_linked_steps_mastery_advancement.sql`](supabase/migrations/00000000100105_linked_steps_mastery_advancement.sql) creates `practice_log` table (line 127); matches CLAUDE.md Convention #158-161. |
| 519 | Business work export (PDF/CSV) | 📌 Post-MVP | No `exportBusiness*` / business work export code in `src/`. Consistent. |
| 536 | `_requestingMemberId` parameter | ✅ Wired | [`relationship-context.ts:271`](supabase/functions/_shared/relationship-context.ts#L271) has renamed `requestingMemberId` (no underscore). `applyPrivacyFilter` + `isPrimaryParent` helpers exist in [`privacy-filter.ts`](supabase/functions/_shared/privacy-filter.ts). |

### Observations (not exceptions)

- **Line 399 (ListPicker overlay):** The stub literally says "overlay (Notepad → Lists)" and is Unwired, which is literally correct — no direct inline overlay exists. However, the broader Notepad→Lists routing *does* work via the Universal Queue Modal SortTab path (WIRING_STATUS.md confirms `ListPickerModal` in SortTab is Wired). If founder's intent for this row was the end-to-end "can I route a Notepad item to a list today?" outcome, the row is misleadingly named. Suggest founder clarify whether the row should be rewired to either (a) flip to ✅ Wired with a scope clarification that routing uses the queue-based path, or (b) keep Unwired and clarify that only the *direct inline overlay* version is pending. Leaving as CONFIRMED because the stub wording and status align literally.
- **Line 408 (Dashboard grid + 6 tracker types):** The parenthetical count "6" is ambiguous. PhaseATrackerType union has 5 types (tally, streak, percentage, checklist, multi_habit_grid), but TRACKER_TYPE_REGISTRY marks 7 entries as `phaseA: true` (adding randomizer_spinner and privilege_status). Similar count-staleness pattern to Finding E; not worth a status flip but worth noting as hygiene alongside other count edits.

---

## Exceptions

### Entry — Line 321 — Celebrate section (Guided Dashboard)

- **Current:** ⏳ Unwired (MVP)
- **Registry note:** "PlannedExpansionCard stub"
- **Synthesis claim:** Section 4 (Guided Dashboard cluster) listed this as confirmed-accurate.
- **Actual evidence:** [`CelebrateSection.tsx`](src/components/guided/CelebrateSection.tsx) is a **functional 60-line component** that renders a full-width gold gradient "Celebrate!" button wired to launch the `DailyCelebration` overlay. [`GuidedDashboard.tsx:21,165`](src/pages/GuidedDashboard.tsx) imports `CelebrateSection` and renders it via `SectionRendererSwitch` when the `celebrate` section key fires. The component handles `overrideMemberId` for View As, wires real `useFamilyMember` + `useFamily` hooks, and launches `DailyCelebration` with `shell="guided"`. **It is NOT a PlannedExpansionCard stub.**
- **Corroboration:** CLAUDE.md Convention #179 explicitly states "Coexists with the Celebrate button which still launches DailyCelebration overlay separately." The button is part of the live Guided shell today.
- **Proposed correction:** Flip ⏳ Unwired (MVP) → ✅ Wired with note: "`CelebrateSection.tsx` wired on Guided dashboard; Trophy button launches DailyCelebration overlay. Previously claimed as PlannedExpansionCard stub — wording stale." This is the same Looks-Fine-Failure (reverse direction) pattern seen in Finding C entry 323 (GuidedVictories.tsx).
- **Founder judgment needed:** **Y** — confirm whether the Celebrate button is the intended referent for this registry row, OR whether the row refers to a distinct "Celebrate section" feature (e.g., a section-level celebration aggregator on the Guided dashboard) that hasn't been built. Given `SectionRendererSwitch` maps the `celebrate` section key directly to `<CelebrateSection />`, the button IS the section per the current code architecture.
