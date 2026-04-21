---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-20
Addendum: prds/addenda/PRD-08-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-08 (source) ↔ PRD-09A (Tasks), PRD-09B (Lists), PRD-11 (Victories), PRD-06 (GuidingStars/BestIntentions), PRD-07 (InnerWorkings/SelfKnowledge), PRD-14B (Calendar), PRD-15 (Messages — F17 carry-forward), PRD-16 (Meetings agenda), PRD-17 (Studio Queue), PRD-17B (MindSweep), PRD-05C (Optimizer — partial)
Provenance: Worker `a01bb5a97cd0218b2` (Opus, report-only mode) ran the full evidence pass in-memory across the addendum + main PRD-08 + `useNotepad.ts` (671 lines) + `NotepadDrawer.tsx` (1067 lines) + `NotepadReviewRoute.tsx` (608 lines) + `useJournal.ts` + RoutingStrip catalog + `ai-parse` Edge Function + `sendAIMessage` wrapper + SortTab/CalendarTab/ListPickerModal queue consumers + all three shells + `whisper-transcribe` integration. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Worker traversed the PRD-08 outbound integration surface — Smart Notepad and Journal as the universal capture/route system feeding the rest of the platform. Read the full Cross-PRD addendum, the main PRD-08, the live `useNotepad.ts` hook (671 lines), `NotepadDrawer.tsx` (1067 lines), `NotepadReviewRoute.tsx` (608 lines), `useJournal.ts`, the `RoutingStrip` destination catalog, the `ai-parse` Edge Function + `sendAIMessage` wrapper, the SortTab/CalendarTab/ListPickerModal queue consumers, all three shells (Mom/Adult/Independent) for `NotepadProvider` placement, and the `whisper-transcribe` integration via `useVoiceInput`. Identified 11 integration seams collapsing to 5 distinct findings. The traversal confirms the Scope 2 F17 carry-forward (Notepad → Message orphans `studio_queue.destination='message'`) and discovers a parallel orphan pattern: `track`, `optimizer`, AND `message` all write to studio_queue but only `task`, `calendar`, and `list` have consumer handlers — `track`/`optimizer` are completely orphaned (Message at least has the in-DRAWER `ComposeFlow` interception via NotepadDrawer.tsx:258-262, but a queue row is also written through the default branch; verified the path: NotepadDrawer intercepts `'message'` BEFORE it reaches `useRouteContent`, so the orphan path I expected is partially mitigated). Significant additional finding: PRD-08's addendum required `source = 'hatch_routed'` and `source_reference_id = tab.id` on all direct routings to context-source tables (guiding_stars, best_intentions, self_knowledge), but `useRouteContent` writes `source: 'manual'`/`source_type: 'manual'` with no `source_reference_id` — losing all traceability back to the original capture, and silently merging Notepad-routed entries with truly-manual entries.

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | Notepad → Studio Queue source field | Implicit per Convention #20: `source='notepad'` for Notepad origins | `useNotepad.ts:570, 589` writes `source: 'notepad'` consistently for tasks/list/calendar/track/agenda/message/optimizer | Documented (no finding) | — | — |
| 2 | Notepad → Journal `entry_type='quick_note'` | Convention #20 + addendum §PRD-04: "Note" routes to `journal_entries` with `entry_type='quick_note'` | `useNotepad.ts:478-495` correctly writes `entry_type: 'quick_note'`; `NotepadReviewRoute.tsx:77` ditto | Documented (no finding) | — | — |
| 3 | NotepadDrawer in Mom/Adult/Independent ONLY (Convention #54) | Convention #54: "NotepadDrawer is available in Mom, Adult, and Independent shells (wrapped with NotepadProvider). Not available in Guided or Play." | `MomShell.tsx:113`, `AdultShell.tsx:56`, `IndependentShell.tsx:56` all wrap with `NotepadProvider`. `GuidedShell.tsx` + `PlayShell.tsx` do NOT. Negative test passes. | Documented (no finding) | — | — |
| 4 | Review & Route AI extraction → ai-parse Edge Function | Addendum §PRD-05 #3 + PRD-08 Screen 3: "LiLa Edge Function analyzes content" | `useNotepad.ts:335-397` `useExtractContent` calls `sendAIMessage` → `ai-parse` Edge Function (Haiku, Zod-validated). Inserts to `notepad_extracted_items`. ✓ | Documented (no finding) | — | — |
| 5 | HITM gate on Review & Route extracted items (Convention #4) | CLAUDE.md #4 + addendum §PRD-05 #3: every AI output goes through Edit/Approve/Regenerate/Reject before persisting | `NotepadReviewRoute.tsx:485-541` provides inline edit + per-card route confirm + per-card skip. Card-level Approve via "Route" button, edit via Pencil, skip via Skip. Reject is via Skip; Regenerate is absent. Inline rich text edit requires explicit click-to-edit. **`status='pending'` is the persistence default** — items written to `notepad_extracted_items` BEFORE user touches them. Since the items table is a worktable (not the destination), this is acceptable per HITM doctrine: the destination tables (tasks, journal, etc.) only receive a row after user clicks Route. | Documented (no finding — partial Regenerate gap is minor) | — | — |
| 6 | Notepad → studio_queue `destination='message'` consumer | Addendum: "Send to Person fully wired as Send to → Message"; Notepad must reach Messages. PRD-15 evidence file seam #8 already classified this as Unintentional-Fix-Code | **In NotepadDrawer.tsx:258-262, `handleRoute` intercepts `destination==='message'` BEFORE `useRouteContent` runs and opens `ComposeFlow` directly — bypasses studio_queue entirely. ✓** BUT: `NotepadReviewRoute.tsx:130-148` default branch DOES write `destination: 'message'` to studio_queue with NO consumer (SortTab.tsx:426-449 only branches on 'list'/'calendar'; everything else opens TaskCreationModal — wrong UX). Cross-addendum pattern with PRD-15 seam #8 confirmed. | Unintentional-Fix-Code | **SCOPE-3** (cross-references PRD-15 seam #8) | N |
| 7 | Notepad → studio_queue `destination='track'` and `destination='optimizer'` orphaned | Addendum §PRD-05C: Notepad→Optimizer is bidirectional. PRD-08 destination #11 (Track Progress) + #13 (LiLa Optimizer) | `useNotepad.ts:580-597` default branch writes `studio_queue` rows with `destination: 'track'` or `'optimizer'`. SortTab.tsx:426-449 has NO branch for these destinations. CalendarTab/ListPickerModal don't handle them either. Rows accumulate in queue with no UI path to process them — opens TaskCreationModal by fallback (wrong UX). Same root cause as seam #6. | Unintentional-Fix-Code | **SCOPE-3** | N |
| 8 | Notepad → Guiding Stars / Best Intentions / InnerWorkings: source tracking | Addendum §PRD-06: `source = 'hatch_routed'` and `source_reference_id` pointing to notepad tab ID. §PRD-07: `source_type = 'log_routed'` and `source_reference_id` = notepad tab ID. PRD-08 line 767 ditto. | `useNotepad.ts:528-541` (guiding_stars) writes `source: 'manual'`, NO `source_reference_id`. `useNotepad.ts:496-510` (best_intentions) ditto. `useNotepad.ts:543-559` (self_knowledge) writes `source_type: 'manual'`, NO `source_reference_id`. **All Notepad-routed entries are indistinguishable from manually-typed entries.** Traceability back to the original tab is severed. PRD-07 enum specifically defines `'log_routed'`. | Unintentional-Fix-Code | **SCOPE-3** (potential SCOPE-8b cross-ref — privacy implication: a teen's Notepad → InnerWorkings entry can't be traced back if mom needs to audit a routing decision) | N |
| 9 | Notepad → Victory: `source='notepad_routed'` correct, `source_reference_id` missing | Addendum §PRD-06 implicit: source_reference_id should point to capture origin | `useNotepad.ts:511-527` writes `source: 'notepad_routed'` ✓ but NO `source_reference_id: tab.id`. Same source-tracking gap as seam #8. **`NotepadReviewRoute.tsx:54-68` for victories DOES populate `source_reference_id: item.id`** — review-route path is correct, send-to path is broken. | Unintentional-Fix-Code | **SCOPE-3** (consolidate with seam #8) | N |
| 10 | `journal_visibility_settings` mom-configurable UI | Addendum §PRD-02 #1: "Mom configures which journal entry types are visible per child in Family Settings"; PRD-08 §531 defines table | Table wired (live_schema.md:2938 — 6 cols, 0 rows). NO Family Settings UI exists for per-child × per-entry-type visibility configuration. Already captured by Scope 2 SCOPE-2.F18 per `.claude/completed-builds/scope-2-evidence/DECISIONS.md:236` | Cross-reference Scope 2 closed finding | (no new finding — defer to SCOPE-2.F18) | N |
| 11 | Voice input → Notepad via `whisper-transcribe` | PRD-08 Screen 1: "Microphone button: Tap to start voice-to-text. Whisper API (online)" | `NotepadDrawer.tsx:619-629` calls `useVoiceInput` → `whisper-transcribe` Edge Function. Transcribed text appended to active tab. Auto-titled tab persists. ✓ Behind `FEATURE_FLAGS.ENABLE_VOICE_INPUT`. | Documented (no finding) | — | — |

## Unexpected findings list (seams not covered in addendum)

1. **Inverse: addendum is silent on `track`/`optimizer` consumer wiring.** PRD-08 Screen 2 lists Track and Optimizer as destinations 11 and 13, but the cross-PRD addendum gives PRD-05C §1 a "Notepad → Optimizer" spec without saying *how* the Optimizer reads it. Code wires Notepad → studio_queue but no Optimizer consumer exists. If PRD-05C is unbuilt (not in Scope 5 closed list as built), this is partial-wiring on the source side only. PRD-10 widget data-routing also explicitly stub-status per WIRING_STATUS.md: "PRD-10 widget data routing not built."

2. **`source_reference_id` discipline drift between send-to and review-route.** `NotepadReviewRoute.tsx:54-68` correctly populates `source_reference_id: item.id` for victories — proving the developer KNEW the convention — but `useNotepad.ts:511-527` (the send-to path for the SAME destination) skips it. Two implementations of the same handoff with diverging source-tracking behavior. Likely cause: the NotepadReviewRoute file got an upgrade pass that didn't propagate to useNotepad.ts.

3. **Notepad → Journal `subType` picker offers 11 entry types but the `useNotepad.ts:460-477` `case 'journal'` branch silently accepts ANY `entry_type` string** with no allowlist guard at the application layer. If a future addendum adds e.g. `'safe_harbor_reflection'`, it would write the value with no validation. CLAUDE.md #20 lists 11 valid types — no enforcement at the write site.

## Proposed consolidation

**§5.1 within-addendum:**
- Seams #6 + #7 share root cause (studio_queue destinations with no consumer for non-task/list/calendar values). Consolidate to one SCOPE-3 finding "Notepad routing destinations write to studio_queue but lack downstream consumers for `message`, `track`, `optimizer`."
- Seams #8 + #9 share root cause (Notepad-routed entries miss `source` enum value AND `source_reference_id`). Consolidate to one SCOPE-3 finding "Notepad → context-source-table writes lose traceability via incorrect `source` enum values and missing `source_reference_id`."

**§5.2 cross-addendum candidates flagged for orchestrator review:**

- **studio_queue handoff source/destination discipline (PRIMARY pattern).** Confirmed across PRD-08 (this surface) + PRD-15 (seam #8 orphan, seam #9 enum drift) + PRD-23 (worker noted at `extractionActions.ts:189-212`). The pattern shape:
  - `studio_queue.destination` is freeform TEXT — no CHECK constraint
  - `studio_queue.source` is freeform TEXT — no CHECK constraint
  - Multiple writers use varying `source` values; consumers only branch on a hardcoded subset of `destination` values
  - Orphan rows accumulate silently (no DB integrity violation, no UX surfacing)
  - PRD-08 strongly recommends elevating to a single cross-addendum SCOPE-3 finding now that 3 surfaces confirm. Use evidence anchors: PRD-08 useNotepad.ts:580-597 (orphan write) + PRD-15 useNotepad.ts:653 (orphan map) + PRD-23 extractionActions.ts:189-212 (freeform source).

- **`source_reference_id` traceability discipline.** Multiple PRDs require source_reference_id propagation but writers skip it. Worth tracking if a third surface confirms (BookShelf evidence file already cited the related freeform-source pattern at extractionActions.ts).

## Proposed finding split

After §5.1 consolidation:
- **2 SCOPE-3 findings** for PRD-08:
  - **F-A: Studio queue orphan destinations** (consolidates seams #6 + #7) — Notepad writes to studio_queue with destinations `message`, `track`, `optimizer` that have no consumer; queue rows accumulate; SortTab fallback opens TaskCreationModal (wrong UX). Cross-references PRD-15 seam #8.
  - **F-B: Source tracking lost on direct destination writes** (consolidates seams #8 + #9) — `useRouteContent` writes `source: 'manual'`/`source_type: 'manual'` with no `source_reference_id` for guiding_stars/best_intentions/self_knowledge/victories direct-routes; addendum requires `'hatch_routed'`/`'log_routed'` + tab.id; `NotepadReviewRoute.tsx` does the right thing for victories proving feasibility.
- **0 SCOPE-8b findings** — Notepad surface doesn't carry safety/Crisis Override/HITM-gate primary concerns; HITM is correctly preserved in Review & Route flow. No `is_safe_harbor` filter applies (journal_entries table doesn't have the column; Convention #243 scopes to lila_conversations).
- **Documented (no finding):** seams #1, #2, #3, #4, #5, #11. PRD-08 source discipline and shell wrapping are CORRECT; HITM is correctly preserved at the destination-write boundary; ai-parse Edge Function is correctly invoked; whisper-transcribe is correctly wired.
- **Cross-ref to closed Scope 2:** seam #10 (already covered by SCOPE-2.F18).

## Beta Y candidates

**0** — neither finding is safety-critical or beta-blocking. Both are UX/data-quality drift. F-A causes silent queue accumulation (mom never sees an orphan to act on); F-B causes muddled provenance reporting. Neither breaks a child-facing surface or exposes data.

## Top 3 surprises

1. **`useNotepad.ts:535` writes `source: 'manual'` for Guiding Stars from Notepad** — addendum line 102 explicitly demands `source = 'hatch_routed'`; the entire Guiding Stars provenance is silently lost on every single Notepad→Star routing. The PRD-07 enum defines `'log_routed'` exactly because of this addendum, but the developer wired `'manual'` instead.

2. **Same hook, two inconsistent paths.** `useNotepad.ts:518` (send-to victories) writes `source: 'notepad_routed'` ✓ but skips `source_reference_id`. `NotepadReviewRoute.tsx:60-67` (review-route victories) writes BOTH correctly. Developer knew the convention — it just didn't propagate to the other path.

3. **NotepadDrawer intercepts `message` BEFORE useRouteContent runs (NotepadDrawer.tsx:258-262 opens ComposeFlow directly) — but NotepadReviewRoute does NOT have the same interception**, so review-route → message still writes an orphan studio_queue row. Two parallel implementations of "Notepad → Message" with different orphan behavior.

## Watch-flag hits

- **F11 (server-side enforcement):** N/A — no privileged write path on this surface.
- **Crisis Override duplication:** N/A — Notepad does not invoke LiLa conversational endpoints; Review & Route uses ai-parse (utility AI, not conversational).
- **F17 PRD-08 messaging behavior-vs-intent:** **CONFIRMED with nuance** — NotepadDrawer's `handleRoute` actually intercepts `'message'` and opens ComposeFlow directly (bypassing studio_queue). The orphan row only happens via NotepadReviewRoute.tsx default branch and via useNotepad.ts default branch (which is dead code since NotepadDrawer intercepts first). PRD-15 evidence seam #8's claim "row is orphaned" is true at the `useNotepad.ts:653` undo-map level and at the NotepadReviewRoute path, but for the primary user flow (NotepadDrawer "Send to → Message") the path is correctly wired through ComposeFlow. Recommend updating PRD-15 finding text to acknowledge the partial-mitigation.
- **F22+F23 archive:** N/A — no archive surfacing on this evidence pass.
- **studio_queue handoff `source` discipline:** **CONFIRMED — strong cross-addendum signal.** PRD-08 contributes seam #6 + #7 + the F-A consolidated finding. Cross with PRD-15 seam #8/#9 and PRD-23 extractionActions:189-212 — three addenda now confirm the pattern; recommend orchestrator elevate to a single cross-addendum SCOPE-3 finding.
- **`is_included_in_ai` propagation:** Notepad does not write `is_included_in_ai` directly (the destination tables apply their own defaults). Addendum is silent. No drift detected.

## Orchestrator adjudication

(empty — pending walk-through against synthesis doc)
