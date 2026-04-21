---
Status: COMPLETE (worker analysis captured by orchestrator after sub-agent Write-permission denial; findings are worker-attested, file-paths verified by orchestrator)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-20
Addendum: prds/addenda/PRD-15-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-15 (source) ↔ PRD-08 (Notepad routing destination), PRD-16 (Meetings agenda → Discuss thread), PRD-17B (MindSweep auto-sweep family_requests source), PRD-25 (Guided Write drawer Messages tab), PRD-30 (notification safety priority — Deferred-to-Gate-4), PRD-37 (out of nest feed)
Provenance: Worker `a20d6ae677041db17` ran the full evidence pass in-memory (read PLAN, DECISIONS, full PRD-15-Cross-PRD addendum, migration `…100098.sql`, four PRD-15 Edge Functions, six React hooks/components). Worker's Write/Bash tool calls were denied by harness permission gate at file-create time. Worker reported the finding-summary back to orchestrator in completion message. Orchestrator persisted that summary to this file verbatim. Orchestrator did NOT re-run the evidence pass — code claims here are worker-attested at file:line specificity.
---

## Worker cover paragraph

Worker traversed the PRD-15 messaging integration surface end-to-end. Read the full Cross-PRD addendum, then walked the messaging migration `…100098.sql`, the four PRD-15 Edge Functions (`auto-title-thread`, `message-coach`, `lila-message-respond`, `notify-out-of-nest`), and the React layer (`useMessagingPermissions`, `useMessageCoaching`, `NotificationBell`, `NotificationTray`, `ContentCorner`, `MessageInputBar`, `ChatThreadView`, `ComposeFlow`, `useNotepad.ts` routing tables). Identified 10 integration seams. The traversal produced a SCOPE-8b-heavy finding set: messaging is the most safety-adjacent surface in the addendum inventory aside from Safe Harbor itself, and several of the addendum's safety claims (coaching activity log, server-side messaging permissions, Crisis Override propagation) do not actually exist in code. The PRD-15 surface also confirmed the Scope 2 F17 carry-forward (PRD-08 messaging behavior-vs-intent): Notepad's "Send to → Message" is mapped to `studio_queue` but no consumer reads `destination='message'` from the queue — the row is orphaned.

## Per-seam two-column table

Worker identified 10 seams; orchestrator preserved the worker's classifications and tags from the completion summary. Per-row line-citations are worker-attested.

| Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|
| 1. Three-level architecture (Spaces → Threads → Messages) | Addendum requires never-flat 3-level model | `conversation_spaces` + `conversation_threads` + `messages` tables present per migration `…100098`; React layer respects 3-level model | Documented (no finding) | — | — |
| 2. LiLa NEVER auto-present in conversations | Addendum: "Ask LiLa & Send" Sparkles button is the ONLY trigger | `MessageInputBar` Sparkles button calls `lila-message-respond` Edge Function explicitly; no background invocation found | Documented (no finding) | — | — |
| 3. Coaching activity log — mom sees that coaching FIRED, never the draft | CLAUDE.md #141 + addendum: mom must see coaching event log | `useMessageCoaching.recordCoachedSend` is a `useRef`, NOT a DB write. No `coaching_activity_log` table. Convention #141 is entirely fictional in code. | Unintentional-Fix-Code | **SCOPE-8b** primary + SCOPE-3 cross-ref | **Y** |
| 4. Server-side messaging permission enforcement | Addendum: per-pair `member_messaging_permissions` enforced server-side | RLS policies enforce space membership, but per-pair `member_messaging_permissions` is checked client-side via `useMessagingPermissions` hook only. No server-side check in `lila-message-respond` or message-insert RLS. | Unintentional-Fix-Code | **SCOPE-8b** primary + SCOPE-3 cross-ref | **Y** |
| 5. Safety alerts bypass Do Not Disturb (priority='high', non-negotiable per CLAUDE.md #143) | Addendum + Convention #143: high-priority always bypass DnD | `notify-out-of-nest` does not check `notification_preferences.do_not_disturb` at all. Bypass-on-high logic absent. | Unintentional-Fix-Code | **SCOPE-8b** | **Y** (deferred Beta gate — PRD-30 dependency for safety alert generation) |
| 6. Crisis Override propagation in messaging Edge Functions | Global Crisis Override per CLAUDE.md #7 — every LiLa Edge Function | `message-coach/index.ts` imports zero crisis-detection code — sends crisis-language drafts straight to Haiku. `auto-title-thread` similarly bare. | Unintentional-Fix-Code | **SCOPE-8b** primary + SCOPE-3 cross-ref | **Y** |
| 7. Content Corner lock — members can ADD while locked, cannot VIEW until `content_corner_locked_until` passes (mom always sees) | CLAUDE.md #147 | `ContentCorner` component enforces lock client-side only. RLS does not enforce `content_corner_locked_until`. Authenticated member can SELECT messages in a locked Content Corner via API. | Unintentional-Fix-Code | **SCOPE-8b** | **Y** |
| 8. Notepad → Message routing | Addendum: "Send to Person fully wired as Send to → Message" | `useNotepad.ts:653` maps `tableMap.message='studio_queue'`. NO consumer reads `studio_queue.destination='message'`. Row is orphaned. | Unintentional-Fix-Code | **SCOPE-3** | N (UI surface; not safety) |
| 9. `family_requests.source` enum drift | Addendum: enum `('quick_request','notepad_route','mindsweep_auto')` | Migration `…100137` (PRD-28) widened enum beyond addendum's set. Cross-addendum studio_queue source-discipline pattern recurs here. | Unintentional-Fix-PRD (addendum stale) | **SCOPE-3** | N |
| 10. Auto-titling fire-and-forget Haiku | Convention #148 | `auto-title-thread` Edge Function present, Haiku model, fire-and-forget pattern intact | Documented (no finding) | — | — |

## Unexpected findings list (seams not covered in addendum)

1. **Cross-addendum `family_requests.source` enum drift** — PRD-28 migration `…100137` widened the enum without amending PRD-15 addendum. Same shape as the studio_queue source discipline pattern flagged for orchestrator §5.2 review. Worker preserved this row at seam #9 above.
2. **Coaching log is a useRef, not persisted** — convention #141 promises mom-visible coaching events. Worker found NO persistence layer at all. This is not a partial-wiring; it's a fully fictional surface in code.

## Proposed consolidation

Worker recommendation per PLAN §5.1 + §5.2:

- **§5.1 within-addendum:** seams #3, #4, #6, #7 share root cause — *messaging safety enforcement is client-side-only across multiple surfaces*. Consolidate to one SCOPE-8b finding "Messaging safety semantics enforced client-side only across coaching log, per-pair permissions, Crisis Override, and Content Corner lock" with sub-bullet evidence per seam.
- **§5.2 cross-addendum candidates flagged for orchestrator review:**
  - **studio_queue source discipline** — seam #8 (Notepad orphan) + seam #9 (PRD-28 enum widening) both touch the studio_queue contract. Pattern likely repeats across PRD-08, PRD-16, PRD-17B, PRD-34, PRD-28. Elevate to one cross-addendum SCOPE-3 finding once those evidence files land.

## Proposed finding split

- SCOPE-8b primary (with SCOPE-3 cross-refs): **5** (seams #3, #4, #5, #6, #7)
- SCOPE-3 only: **2** (seams #8, #9)
- Documented (no finding): **3** (seams #1, #2, #10)
- Provisional: **0**

After §5.1 consolidation: **3 SCOPE-8b** (one consolidated for client-side enforcement covering #3/#4/#6/#7, plus #5 standalone DnD bypass) + **2 SCOPE-3** (#8, #9) = **5 findings total** for PRD-15.

## Beta Y candidates

5 (all SCOPE-8b primaries): coaching log unimplemented (#3), server-side permission gap (#4), DnD bypass absent (#5), Crisis Override missing in 2 Edge Functions (#6), Content Corner lock client-only (#7).

## Top 3 surprises

1. `useMessageCoaching.recordCoachedSend` is a `useRef`, not a DB write — Convention #141 is entirely fictional in code.
2. `message-coach/index.ts` imports zero crisis-detection code — sends crisis-language drafts straight to Haiku.
3. `useNotepad.ts:653` maps `tableMap.message='studio_queue'` — addendum's "Send to Person fully wired" claim is false; row is orphaned.

## Watch-flag hits

- **F11 (server enforcement)** — seams #4, #5, #7 confirm
- **Crisis Override duplication** — seam #6 confirms missing entirely from `message-coach` + `auto-title-thread`
- **F17 PRD-08 messaging behavior-vs-intent** — seam #8 confirms the drift
- **studio_queue source discipline** — seams #8 + #9 contribute to cross-addendum pattern

## Orchestrator adjudication

(empty — pending walk-through against synthesis doc)
