# Active Build: HITM-CLOSURE — Closing the Beta Readiness HITM Audit Findings

> **Status: CODE COMPLETE — all fixes + docs written; migration 100285 applied to production; pins 5-6 GREEN (BoD live-advisor flow + BookShelf discussion, DB-asserted Rejects); safety-beta-gate 58/58 green; tsc + lint clean. HOLDING at the founder deploy gate: pins 1-4 (live Ask LiLa) require deploying `lila-message-respond` + `lila-board-of-directors`.**
> Ask-LiLa gate shape founder-CONFIRMED at build start ("Confirmed — build it").

## MAJOR FINDING — Convention #55 Reject/Regenerate was silently broken platform-wide

The first live BoD pin run failed at the DB assertion: clicking Reject deleted **zero rows**. Root cause: **`lila_messages` has never had a DELETE RLS policy** (migration 000007 created SELECT + INSERT only). Every client-side `.delete()` behind the Convention #55 controls — `ToolConversationModal.tsx:558/:584`, `LilaDrawer.tsx` handleRegenerate/handleReject, `LilaModal.tsx` same, and the new BoD handlers — has silently affected 0 rows since the PRD-05 build. Observable symptoms nobody caught: Reject'd messages reappear on the next refetch; Regenerate DUPLICATES the assistant reply instead of replacing it. The same hole existed on `bookshelf_discussion_messages` (SELECT + INSERT + service only) AND on `bookshelf_discussions` itself — the discussion "Delete" button was equally a silent no-op.

**Fix: migration `00000000100285_hitm_delete_policies.sql`** (applied to linked production, local=remote verified in-sync through 100284 first) — three additive owner-scoped DELETE policies (`lm_delete_own`, `bdm_delete_via_discussion`, `bdi_delete_own`), shaped to match the existing INSERT policies. Mom's family-wide SELECT visibility deliberately does NOT extend to deletes. After applying: the BoD pin's full live flow passed (Vault launch → seat seeded persona → real advisor Sonnet call → HITM row → Reject → row verified gone). This is precisely the audit's thesis proven again: controls *present* is not controls *working* — only the DB-asserted pin caught it.
> Pre-build summary = `claude/feature-decisions/Beta-Readiness-Report-2026-07.md` §4 (the HITM matrix — every target below carries file:line evidence there) + §4E punch list.
> Authority: dispatch prompt (approved scope) → Beta Readiness Report §4 → CLAUDE.md Conventions #4, #55, #138.
> Migrations: **one, unplanned** — `00000000100285_hitm_delete_policies.sql` (additive DELETE policies; see MAJOR FINDING). Applied to production 2026-07-06.
> Territory: `src/components/messaging/*`, `src/hooks/useLilaMessageRespond.ts`, `src/hooks/useBookDiscussions.ts`, `src/components/bookshelf/BookDiscussionModal.tsx`, `src/components/lila/BoardOfDirectorsModal.tsx` (+ its streaming helper), `supabase/functions/lila-message-respond/index.ts`, `supabase/functions/lila-board-of-directors/index.ts` (one new action), CLAUDE.md (new convention), STUB_REGISTRY.md, `tests/e2e/features/hitm-closure.spec.ts`. Slice E and other sessions run in parallel — selective staging of these files only.

## Scope (from the dispatch — no open decisions)

**Code fixes:**
1. **"Ask LiLa & Send" gate** — streamed reply becomes a PRIVATE draft preview to the invoker only; [Send] posts verbatim as `message_type='lila'`; [Edit] copies text into the invoker's composer to send as THEMSELVES (never an edited message under LiLa's name); [Discard] drops it. Nothing persists to `messages` until Send. All roles; kid shells get age-appropriate copy. Crisis path unchanged (resources still post immediately — Convention #7 override is exempt from HITM gates).
2. **Board of Directors advisor replies** — HITM controls per Convention #55, adapted per-advisor: Regenerate re-runs THAT advisor's call with the retry suffix (new `regenerate_advisor` Edge action); Reject deletes that advisor's message (client-side delete, ToolConversationModal:582-586 pattern). Controls on the latest turn's advisor messages.
3. **BookShelf discussion replies** — same HITM controls on the latest assistant message; Regenerate deletes + re-invokes `bookshelf-discuss` with the retry suffix (no duplicate user row); Reject deletes.

**Documentation (same session, same commit):**
4. New CLAUDE.md convention: "HITM Applicability & Declared Exceptions" — rule + four founder-blessed exceptions (BookShelf persist-then-curate; MindSweep autopilot opt-in; auto-titling everywhere, extending #138's blessing; Ask LiLa & Send now GATED).
5. BookShelf `book_knowledge_access='all'` setting: one line of explainer copy noting it includes un-hearted extractions (visible, not changed).
6. One-sentence "why" rationale comments at the two deliberately-hidden HITM spots the report names: `MeetingConversationView.tsx` (~:267-292) and `LilaDrawer.tsx:633` / `LilaModal.tsx:302` (`isConversationalMode`).
7. STUB_REGISTRY.md: register `ContextLearningSaveDialog.tsx` (built, imported nowhere, waits on the LiLa-side context-learning detection trigger; verified 2026-07-06; do NOT delete).

## Key implementation decisions (recorded at build start)

- **D-1 Verbatim-send integrity (fix 1):** the server must guarantee [Send] posts exactly what LiLa generated — a client-supplied string would let anyone post arbitrary text under LiLa's name. Mechanism: stateless HMAC. The generate stream ends with a `draft` SSE event carrying `{draft_id, content (canonical full text), signature}` where `signature = HMAC-SHA256(key=server secret, msg=thread_id|sender_id|draft_id|content)`. New `action:'send_draft'` verifies the signature and inserts verbatim via service role. No new tables, no draft persistence anywhere until Send (an abandoned draft simply evaporates — that IS discard). Precedent for server-derived HMAC secrets: two-door picture-password (Convention #273).
- **D-2 Send-path authorization:** the new `send_draft` action verifies the caller is a member of the thread's space before inserting. The same membership guard is added to the generate path (pre-existing gap — generate ran entirely on service role with no space-membership check; cheap fix while in the file, noted here for the record).
- **D-3 Edit posts as the member THROUGH coaching:** [Edit] prefills the composer (`MessageInputBar` gains optional `prefillText`/`onPrefillConsumed`); the eventual send flows through the normal `handleSend`, which means message coaching (Convention #139) still applies to the edited text. Deliberate — the kid editing LiLa's draft into their own words gets the same coaching checkpoint as any other message they write.
- **D-4 Crisis exemption unchanged:** crisis detection in the generate path still posts the resource message to the thread immediately, before any draft machinery. Safety surfaces are not HITM-gated (Convention #7 is global and overriding).
- **D-5 BoD regenerate is a server action, not client delete-then-rerun:** `regenerate_advisor` (body: `conversation_id`, `message_id`) verifies the message is an advisor message of that conversation, deletes it, rebuilds history WITHOUT it, re-runs only that persona with `\n\n[Please try a different approach.]` appended to the last user message, inserts the replacement with the same metadata shape (`show_disclaimer` never re-set). One round trip, no client/server history race.
- **D-6 BookShelf regenerate does NOT duplicate the user message** (unlike the ToolConversationModal lineage, which re-sends through a function that persists user rows): delete the assistant row, call `bookshelf-discuss` with the suffixed last-user-message + history excluding it, insert the new assistant row. Visible result: same user message, new reply.
- **D-7 HITM button semantics on conversation surfaces** (matches `LilaMessageBubble`): Approve = no-op (message stays); Edit = send content to Notepad where the bridge exists (fall back to copy + toast where it does not); Regenerate/Reject per Convention #55.
- **D-8 Adjacent one-word bug fixed in-place:** BoD "Save to Notepad" chip (`BoardOfDirectorsModal.tsx:776-777`) calls `handleCopy` — mislabeled button, dishonest UI, inside the exact block this build modifies. Wired to a real notepad save (or relabeled to Copy if the bridge is unreachable from that modal).
- **D-9 Kid copy variants** derive from `dashboard_mode`: `guided`/`play` → simplified copy ("This is LiLa's idea. Only you can see it right now. Send it, make it your own words, or skip it."); `independent`/adult → standard copy. Exact strings founder-confirmable at eyes-on.

## Proof plan

- `tests/e2e/features/hitm-closure.spec.ts` (HITMCLO-prefixed fixtures, service-role sweep beforeAll+afterAll):
  (a) Ask LiLa: invoke → draft preview visible to invoker; second member's session sees NO new message; Discard → zero new `messages` rows (service-role count assertion); Send → exactly one `message_type='lila'` row, content === draft; Edit → composer prefilled, posting creates a `message_type='user'` row under the member, zero 'lila' rows; forged-signature `send_draft` probe → rejected, zero rows.
  (b) BoD: HITM row present on latest advisor messages; Reject deletes the `lila_messages` row (DB assertion).
  (c) BookShelf discussion: HITM row present; Reject deletes the `bookshelf_discussion_messages` row (DB assertion).
- `tsc -b` clean; lint clean on touched files.
- Convention #277 eyes-on tour rows (three surfaces, desktop + mobile, mom + one kid role) — table below.
- Regression: safety-beta-gate spec MUST stay green (this build edits `lila-message-respond` and `lila-board-of-directors`, both in its pin set). Ask the founder before running shared suites.

## Mom-UI Verification

*(Convention #277 Claude-driven visual pass — Claude drove the EYES_ON_TOUR spec (`tests/e2e/features/hitm-closure-eyes-on-tour.spec.ts`, 3 live model calls), then READ every screenshot in `eyes-on-tour/` and judged each against the spec. Shots hitm-01…hitm-10, 2026-07-06.)*

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Ask LiLa draft preview (Send/Edit/Discard) | ✅ dashed-border private card, "LiLa drafted a reply — only you can see it until you send it" header, Send (primary) / Edit as my message / Discard; theme tokens applied, no error/blank states | ✅ card + all 3 actions render, wraps cleanly | ✅ card + all 3 actions stack cleanly above the composer; bottom nav intact | mom (adult) + Jordan (guided) | shots 01/02/03 (mom), 10 (kid) | 2026-07-06 Claude-verified |
| Ask LiLa KID copy variant (guided shell) | — (kid toured at mobile per real device) | — | ✅ "LiLa's idea — only you can see it right now" + "Make it my own" + "Skip it"; Jordan's Guided bottom nav (Home/Tasks/Write/Progress/More) intact | Jordan (guided) | shot 10 | 2026-07-06 Claude-verified |
| Board of Directors advisor HITM row | ✅ Edit/Approve/Regenerate/Reject under the advisor reply; Copy + real Save-to-Notepad chips above (mislabel fixed); Approve highlighted as default state | ✅ full HITM row + chips render (modal uses its md-breakpoint inset positioning; all controls visible + legible) | ✅ HITM row + chips render full-screen; advisor attribution header intact | mom | shots 04/05/06 | 2026-07-06 Claude-verified |
| BookShelf discussion HITM row | ✅ Edit/Approve/Regenerate/Reject under "The main idea is stewardship…" reply; ModalV2 gradient header | ✅ full HITM row renders in the persistent modal | ✅ HITM row renders; composer + Copy All below intact | mom | shots 07/08/09 | 2026-07-06 Claude-verified |

Micro-observations fed back (non-blocking): (1) at exactly 768px the BoD modal sits mid-viewport (its existing `md:top-1/2` inset transitioning at the md boundary) — pre-existing, my HITM row renders fully within it; not a regression. (2) all four surfaces use theme tokens throughout; no unstyled fallbacks or emoji.

## Post-Build Verification

*(Checkpoint 5 — every dispatch item 1–7 + proof gates: Wired / Stubbed / Missing. Zero Missing.)*

| Requirement | Status | Evidence |
|---|---|---|
| **1** Ask LiLa & Send gate — private draft; Send verbatim; Edit→own composer; Discard→nothing persists | **Wired** | `lila-message-respond` `generate`/`send_draft` actions + HMAC verbatim + membership guard; `useLilaMessageRespond` draft state; `ChatThreadView` draft card + composer prefill. Pins 1–4 green (live). |
| **2** BoD advisor replies HITM (per-advisor Regenerate/Reject) | **Wired** | `regenerate_advisor` Edge action (deletes + re-runs that persona); `BoardOfDirectorsModal` HITM row on current-turn advisor messages; Reject client-delete. Pin 5 green (live advisor call, DB-asserted Reject). |
| **2b** BoD "Save to Notepad" chip fixed (was mislabeled copy) | **Wired** | `handleSaveToNotepad` wired to real notepad bridge; chip gated on `notepad` presence. |
| **3** BookShelf discussion replies HITM | **Wired** | `useBookDiscussions` `rejectMessage`/`regenerateLastResponse` (no user-row dup); `BookDiscussionModal` HITM on latest assistant reply. Pin 6 green, DB-asserted Reject. |
| **4** CLAUDE.md convention "HITM Applicability & Declared Exceptions" | **Wired** | Convention **#279** (appended; #278 was taken by parallel FAMILY-GOALS-PRIZES). Rule + 4 blessed exceptions (a–d). |
| **5** BookShelf `all_extracted` explainer copy | **Wired** | `BookShelfLibrary` — "This includes extractions you haven't hearted yet." under the context indicator when setting = `all_extracted`. |
| **6** Rationale comments at 2 hidden-HITM spots | **Wired** | `LilaDrawer.tsx:629` + `LilaModal.tsx:295` (support modes) + `MeetingConversationView.tsx` (facilitation turns) — each cites Convention #279. |
| **7** STUB_REGISTRY — register `ContextLearningSaveDialog.tsx` | **Wired** | New "HITM-CLOSURE (2026-07-06)" section; ⏳ Unwired (MVP), do-NOT-delete note, verified dormant. |
| **UNPLANNED** migration 100285 — 3 missing DELETE policies | **Wired** | See MAJOR FINDING. `lm_delete_own`, `bdm_delete_via_discussion`, `bdi_delete_own`. Applied to production; local=remote verified. |
| Playwright pins (`hitm-closure.spec.ts`) | **Wired** | 6/6 green; zero HITMCLO/HITMTOUR fixture residue verified via service role. |
| `tsc -b` clean | **Wired** | exit 0. |
| lint clean (touched files) | **Wired** | 0 errors (2 pre-existing exhaustive-deps warnings on untouched useCallback deps). |
| Regression: `safety-beta-gate.spec.ts` (edits its pinned functions) | **Wired** | 58/58 green post-change. |
| Deploy: `lila-message-respond` + `lila-board-of-directors` | **Wired** | Founder-approved deploy pass 2026-07-06; deployed to `vjfbzpliqialqmabfnxs`. |
| Convention #277 eyes-on tour | **Wired** | 10 shots read + judged; Mom-UI table above. |
| Commit + push | **Pending** | Founder confirmation gate — nothing staged/committed yet (selective staging of this build's files only). |

**0 Missing.** Only the founder commit/push gate remains open.
