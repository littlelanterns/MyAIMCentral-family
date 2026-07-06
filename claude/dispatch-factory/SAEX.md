# Pre-Dispatch Pack — SAEX: Special Adult Experience + PRD-27 Caregiver Tools

> **Factory status:** synthesized → decisions-pending (6 decisions, batch 6)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: SAEX (+PRD27 merged per D-001).
> Evidence: `claude/dispatch-factory/SAEX-RECON.md`.
> **D-001 SYNTHESIS RESOLUTION: one pack, TWO sequential builds** — Build A (foundation: make
> PRD-02's caregiver promise real) then Build B (PRD-27's caregiver content on top).
> Headline: **the shift system is split-brained.** The shift timer writes `time_sessions`
> (Convention #40, correct); mom's entire monitoring UI AND the permission gate itself read the
> dead legacy `shift_sessions` table (0 rows). Shift-gated access has NEVER functioned in
> production; mom's remote "End Shift" operates on rows that can't exist; and the registry's
> "Shift View ✅ Wired" row is materially misleading. Meanwhile a babysitter login today gets the
> FULL adult shell — Journal, AI Vault, Notepad — everything PRD-27 says she must never see.

## Reconciliation rulings (newer wins — named explicitly)

1. **Shell architecture: pre-shell redirect, not a 6th ShellType (D-SAEX-1).** `RoleRouter` gains
   a `role==='special_adult'` detour to a purpose-built `/caregiver` surface — the exact pattern
   already shipped for `role==='family'` → `/hub` (RoleRouter.tsx:41-43). PRD-27's own words:
   "NOT a scoped-down version of the Adult shell." Convention #16 nav parity is ratified N/A for
   `/caregiver` by design (no sidebar exists — the /admin precedent). No token/nav/parity
   machinery dragged in.
2. **`time_sessions` is the one shift truth; the dead table dies (D-SAEX-2).** All readers
   (usePermission SA branch, PermissionHub SpecialAdultCard badge + remote End Shift +
   ShiftLogSection) rewire to `time_sessions` `source_type='shift'` per Convention #40;
   `shift_sessions` (0 rows) drops in the same migration. Report compilation state moves to
   Layer 2's `shift_reports` table; co-parent semantics live on `access_schedules.always_on` —
   the flag on the dead table was never needed.
3. **SA auth stays on the email-invite/PIN path and SAs are EXCLUDED from the family-door
   roster (D-SAEX-3).** The babysitter authenticates with her own credentials; the family
   password never exposes her tile (need-to-know roster). Build A verifies and pins this.
4. **Messaging: reuse `space_type='direct'` mom↔SA spaces — zero schema change (D-SAEX-4).**
   PRD-27's `thread_type` plan targeted a column that never existed; shift tagging rides
   `messages.metadata` JSONB. Co-parent messaging is NEVER window-gated (PRD rule, preserved).
5. **Vocabulary: existing registered keys are canonical (D-SAEX-5).** `tasks_basic` /
   `calendar_basic` / `messaging_basic` stay (real, registered, profile-seeded);
   **`lila_help` is REMOVED from SA profile seeds** (PRD-27: "No LiLa access of any kind");
   PRD-27's five `caregiver_*` keys register in Build B with their features;
   `notes_instructions` becomes a real Build-B surface (Notes & Instructions on the caregiver
   view) rather than a phantom key. keyWiringStatus gains SA entries (honesty per #274).
6. **Log Activity ships twice, honestly:** Build A mounts ShiftView WITH a basic freeform
   [+ Log note] form (finally completing PRD-02 Screen 6); Build B upgrades it to the trackable-
   event tap-to-mark model (PRD-27 S1/S4). STUB:85's misleading ✅ corrected at Build A close.
7. **Mom's shift history follows the FO precedent (D-SAEX-6):** Build B's Screen 5 (Shift
   History & Reports) is a dedicated page reachable from Family Overview (command-center
   adjacency); Permission Hub keeps only per-SA config. The Hub's broken ShiftLogSection is
   rewired in Build A and relocated in Build B.
8. **PRD-28 money exclusion becomes EXPLICIT:** today it's an accidental side effect of
   role-string checks. Build A adds the explicit deny posture (SA can never hold financial/
   studio/reward_rules grants) + a leak-pass-style E2E probe so it can't silently evaporate.
9. **Kid View (S2) is reuse, not rebuild:** renders the kid's actual Guided/Play dashboard
   scoped by `special_adult_permissions`, with `shift_session_id` tagging threaded through the
   existing completion paths (acted_by attribution conventions apply). View-As gains the
   caregiver mapping (the Play-shell modal precedent from KIDS-REWARDS Slice 2).
10. **The schedule-config write UI is Build A scope** — `access_schedules` has readers and zero
    writers; manual/scheduled/recurring/always_on config via the Universal Scheduler (#23-30),
    custody patterns included (the "Custody patterns ✅ Wired" STUB row gets an honest re-check).

## Slice plan (model routing per `.claude/rules/model-routing.md`)

**BUILD A — Caregiver Foundation (dispatch first):**
| Slice | Scope | Routing |
|---|---|---|
| A1 | Split-brain migration: rewire usePermission SA branch + PermissionHub SA surfaces to time_sessions; drop shift_sessions; remove lila_help from SA profile seeds; explicit SA financial/management-grant deny + probe | Sonnet xhigh + rls-verifier |
| A2 | `/caregiver` pre-shell surface (RoleRouter detour): resting layout hosting ShiftView + the freeform Log Activity form; no sidebar/drawers/AI; View-As mapping; family-door roster exclusion pin | Sonnet xhigh |
| A3 | Schedule-config write UI (PRD-02 Screen 3 §3 → access_schedules via Universal Scheduler; always_on co-parent; custody) + `useShiftScopedKids` hook (active shift × special_adult_permissions) + Hub per-kid grid un-hidden + keyWiringStatus SA entries | Sonnet xhigh |
| A4 | E2E (`tests/e2e/permissions/caregiver-foundation.spec.ts`: shift-gate GRANTS during an active shift and DENIES outside it — the never-worked pin; mom's badge/End-Shift round trip on time_sessions; roster exclusion; money-grant deny probe; /caregiver has no adult-shell surfaces) + verification + STUB:85/93 corrections | Sonnet xhigh |

**BUILD B — PRD-27 Content (after A closes):**
| Slice | Scope | Routing |
|---|---|---|
| B1 | Schema: trackable_event_categories/logs + shift_reports + activity source enum + 5 caregiver keys + RLS | Sonnet xhigh + rls-verifier |
| B2 | Caregiver Main View (S1: kid columns, tap-to-mark + quick-note, running shift log, top bar) + mom's Trackable Event Config (S4: CRUD, 5 preset bundles APPEND, per-item options) | Sonnet xhigh |
| B3 | Kid View (S2 reuse + shift_session_id tagging) + Co-Parent mode (S3: always_on, custody lockouts + 5-min grace, date-organized Activity Log) + forgotten-shift auto-end cron (#246) | Sonnet xhigh |
| B4 | Shift Reports (S5: dedicated LiLa compilation EF — chronological/aggregated + gap highlighting; FO-linked history page per ruling 7) + Caregiver Messages (S6: direct-space reuse, photo, tagging, never-gated co-parent) + E2E + verification + LiLa knowledge | Sonnet xhigh |
| Gates (both) | Pre-build freshness audit + Checkpoint 5 per build | **Fable if available, else Opus** |

## Open founder decisions (batch 6)

| # | Decision | Recommendation |
|---|---|---|
| D-SAEX-1 | Pre-shell /caregiver redirect (not a 6th ShellType); Convention #16 ratified N/A for it | Yes — matches PRD-27's intent + the shipped role='family' precedent |
| D-SAEX-2 | time_sessions canonical; drop dead shift_sessions in Build A | Yes — Convention #40 is already the law; the dead table is the bug |
| D-SAEX-3 | SAs excluded from the family-door roster; email-invite/PIN stays their path | Yes — need-to-know roster |
| D-SAEX-4 | Messaging reuses direct spaces; no schema change | Yes — the PRD's plan targeted a column that never existed |
| D-SAEX-5 | Existing registered keys canonical; lila_help removed from SA seeds; caregiver_* keys land with Build B | Yes |
| D-SAEX-6 | Shift History & Reports = dedicated page off Family Overview; Hub keeps config only | Yes — your command-center pattern |

## Dependency edges
Build A is self-contained (bug-fix + foundation — dispatchable early; it also closes the
PERMISSIONS-WIRING SA stub and the PRD-19 SA-lightweight-card coordination point). Build B after
A. PRD-27's tracker-widget feed + push notifications stay dependency-gated stubs per the PRD.

---

## DISPATCH PROMPT — BUILD A (paste into a FRESH session after batch-6 decisions)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for SAEX BUILD A — the Caregiver Foundation. Pack:
claude/dispatch-factory/SAEX.md (10 rulings; Build A slice table). Evidence:
claude/dispatch-factory/SAEX-RECON.md (file:line map — the split-brain findings A1-A10 are your
work list). Decisions RESOLVED per recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; re-verify the recon's
refs (usePermission.ts:87-138, PermissionHub.tsx:989-1170 + :1301-1402, ShiftView.tsx,
RoleRouter.tsx:41-43, migration 100260 role predicates); check whether PRD-19's build landed
(its SA lightweight-card ruling coordinates with your /caregiver surface); next free migration
number before every push.

READ FIRST: (1) prds/foundation/PRD-02-Permissions-Access-Control.md — Screen 3 + Screen 6 (the
shift model you are finally making real); (2) prds/platform-complete/PRD-27-Caregiver-Tools.md
L52-146 + L330-345 (the shell-intent language — Build B's full read comes later); (3)
claude/follow-up-builds/special-adult-experience.md; (4) the pack + recon. Create
.claude/rules/current-builds/SAEX-A-caregiver-foundation.md (no YAML frontmatter), pre-build
summary, founder approval BEFORE code.

BUILD SLICES A1→A4. HARD RULES: time_sessions source_type='shift' is the ONLY shift truth
(Convention #40) — every reader rewired, the dead table dropped; the shift-gate E2E pin must
FAIL against pre-fix code (it has never granted in production); /caregiver has NO sidebar, NO
notepad, NO AI surfaces of any kind (PRD-27 L337-341 — lila_help leaves the SA profile seeds);
SAs never appear on the family-door roster (pin it); explicit money/management-grant deny probe;
schedule-config UI uses the Universal Scheduler (#23-30), never a bespoke picker; View-As
caregiver mapping per the Play-shell precedent; Convention #257 dates; zero hardcoded colors +
density (myaim-frontend-design skill).

PROOF: tests/e2e/permissions/caregiver-foundation.spec.ts per the pack list + tsc -b + lint +
permissions-wiring & leak-pass pins (you touch their territory — ask the founder before
shared-fixture suites). NOTHING COMMITS until proof green AND founder eyes-on clears (eyes-on:
log in AS the real babysitter account — she lands on /caregiver, starts a shift, sees only her
scoped world; mom's Hub shows the live shift). Selective staging; founder confirms before push.
Close-out: Checkpoint 5 zero-Missing, live_schema regen, STUB corrections (rows 85/93 + the
custody-patterns row re-check), keyWiringStatus SA entries, archive build file, and a
coordination note for Build B.
```

*(Build B's dispatch prompt is generated at Build A close-out by the standard process — its
slice table above is the contract; a fresh freshness pass then is mandatory.)*
