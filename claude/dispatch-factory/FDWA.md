# Pre-Dispatch Pack — FDWA: Family-Device Write Audit (Remaining Tables)

> **Factory status:** synthesized → decisions-pending (3 decisions, batch 4)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: FDWA. Priority: P1 (correctness).
> Evidence: `claude/dispatch-factory/FDWA-RECON.md` — a complete, file:line-cited coverage table.
> Headline: **12+ tables where a kid's action on the family tablet silently does nothing** (theme
> changes, widget reorder, tracker taps, Guided worksheets, journal sends, practice logs, timer
> starts, reflections, rhythm check-ins, prize redemption, reward proposals). Plus TWO bonus
> discoveries: (1) `family_members` has NO self-update policy for ANY role — **theme/layout
> changes silently fail for every non-mom session even on their own devices** (no catch block;
> a live platform-wide bug hiding since the theme system shipped); (2) the `redeem_own_prize`
> RPC is missing the family-shadow branch that its two sibling RPCs from the same era have.

## Rulings

1. **One migration, the proven 100262 pattern.** ~12-13 additive
   `OR util.is_family_shadow_of(family_id)` clauses (DROP-IF-EXISTS/recreate) on:
   widget_data_points, practice_log, journal_entries, guided_form_responses, dashboard_widgets,
   dashboard_configs, guiding_stars, best_intentions, self_knowledge, reflection_responses,
   rhythm_completions, randomizer_draws, time_sessions, reward_proposals. No new tables, no new
   helper functions.
2. **`family_members` fix goes through a NARROW SECURITY DEFINER RPC, not a blanket self-update
   policy.** (D-FDWA-1) A blanket `fm_update_own` policy would let any member session UPDATE
   sensitive columns on their own row — `gamification_points`, `current_streak`, `pin_hash`,
   `role` — violating Convention #198 (never update points directly from client). Instead: new
   `update_member_appearance(p_member_id, p_theme_preferences, p_layout_preferences)` SECURITY
   DEFINER RPC gated owner / primary_parent / `util.is_family_shadow_of` (the 100275
   `can_arrange_member_stickers` pattern), touching ONLY the two appearance columns.
   `useThemePersistence` routes through it (and finally gets error handling). This fixes the
   family-device case AND the universal non-mom self-theme bug in one move.
3. **`redeem_own_prize` gets the shadow branch its siblings have** — edited against the CURRENT
   production body per the KIDS-REWARDS guard-ledger discipline (never rewrite from a superseded
   migration copy; note the edit in the guard-ledger header style). Coordinate with the
   KIDS-REWARDS session (Slice 5 still in flight — same lineage).
4. **AMENDED BY FOUNDER (2026-07-04): ALL FOUR conditional tables are INCLUDED —
   `family_requests`, `messages`, `notepad_tabs` (+ notepad_extracted_items), and
   `mindsweep_holding`.** Teens PIN-logged-into the family device get full use of those
   features; app-layer attribution to the PIN-verified member is the ACCEPTED model (documented
   Convention #39/#276 limitation), and the PIN-relock build (PINR) mitigates the walk-away
   risk. **FDWA + PINR are a sequencing pair** — dispatch in the same window (either order;
   note the pairing in both build files). The E2E flips accordingly: no messages-blocked probe —
   instead ATTRIBUTION probes on messages/notepad/mindsweep writes (shadow session + app-layer
   member identity lands correctly on every row).
5. **Attribution stays app-layer** (documented Convention #39 limitation, same trade already
   accepted for the tasks domain in #276): the shadow policies admit the session; the acting
   member id is enforced by the app. Nothing in this build changes that model.
6. **E2E is the proof**: a family-shadow session spec exercising every fixed table (write +
   attribution asserted — including messages, notepad_tabs, and mindsweep_holding per the
   amended ruling 4), the redeem RPC both ways, the theme RPC from all three session types.

## Slice plan (single Sonnet worker)

| Slice | Scope | Routing |
|---|---|---|
| 1 | The migration (rulings 1-4): additive policies + `update_member_appearance` RPC + `redeem_own_prize` edit; `supabase db push --linked`; verification queries pasted | Sonnet xhigh |
| 2 | `useThemePersistence` reroute through the RPC + error handling (toast on failure — never silent again); final grep sweep for Edge-Function bypasses the recon may have missed | Sonnet xhigh |
| 3 | E2E `tests/e2e/features/family-device-writes.spec.ts` per ruling 6 + regression pins (family-auth-two-door 8/8, kids-rewards slices — you touch redeem_own_prize) | Sonnet xhigh |
| Gates | Checkpoint 5 verify | **Fable if available, else Opus** |

## Founder decisions — ✅ RESOLVED (2026-07-04)

| # | Decision | Ruling |
|---|---|---|
| D-FDWA-1 | family_members via narrow appearance RPC (not blanket self-update policy) | **YES** |
| D-FDWA-2 | Conditional-table scope | **AMENDED: include ALL FOUR** (family_requests + messages + notepad_tabs + mindsweep_holding). App-layer attribution accepted (#39/#276); PINR mitigates walk-away risk; **FDWA+PINR = sequencing pair** |
| D-FDWA-3 | Teen family-device usage | **ANSWERED: yes** — teens on the family device get full feature use |

## Dependency edges
Coordinate with KIDS-REWARDS (redeem_own_prize lineage; Slice 5 in flight). Independent
otherwise; highest kid-facing-pain-per-effort item in the factory — good first dispatch.

---

## DISPATCH PROMPT (paste into a FRESH session — after batch-4 decisions resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for FDWA — the family-device write audit closure. Pre-dispatch
pack: claude/dispatch-factory/FDWA.md (6 rulings + 3-slice plan). Evidence:
claude/dispatch-factory/FDWA-RECON.md — the coverage table IS your work list; re-verify each
policy citation before editing. All decisions RESOLVED per recommendations unless the founder
noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. Run `git log --oneline --since=2026-07-04`; check
whether KIDS-REWARDS Slice 5 landed (redeem_own_prize lineage — ALWAYS base your RPC edit on the
CURRENT production definition, never a superseded migration body; the guard-ledger lesson in the
KIDS-REWARDS build file is binding); re-check the next free migration number immediately before
push (multiple sessions land migrations in parallel).

BUILD per the 3-slice plan (AMENDED scope: the additive-policy list INCLUDES messages,
conversation_threads/spaces as needed for thread creation, notepad_tabs +
notepad_extracted_items, mindsweep_holding, and family_requests — founder ruling 2026-07-04).
HARD RULES: exact 100262 additive pattern (DROP POLICY IF EXISTS / recreate with the OR clause
— never narrow an existing policy); family_members fix is ONLY the narrow
update_member_appearance RPC (owner/primary_parent/shadow gate, two appearance columns — a
blanket self-update policy is FORBIDDEN, it would expose gamification_points/pin_hash);
attribution remains app-layer (Convention #39 note — change nothing about it, but EVERY
amended-table E2E probe asserts the acting member's identity lands on the row);
useThemePersistence gains real error handling (silent failure is the bug class this build
exists to kill). SEQUENCING PAIR: dispatch alongside PINR (either order) — note each other in
both build files.

PROOF: tests/e2e/features/family-device-writes.spec.ts — shadow-session write + attribution
probes for EVERY fixed table (incl. messages/notepad/mindsweep attribution probes), redeem RPC
both ways, theme RPC from owner/mom/shadow sessions. Regression: family-auth-two-door 8/8 +
kids-rewards slice pins
(ask the founder before running shared-fixture suites). tsc -b clean, lint clean. Founder
eyes-on: on the REAL family tablet — theme change, widget reorder, tracker tap, Guided worksheet,
journal send, practice log, prize redeem — all persist across refresh. NOTHING COMMITS until
proof green AND eyes-on clears; selective staging; founder confirms before push. Close-out:
Checkpoint 5, STUB_REGISTRY flip (RR-DEPLOY-SCOPING family-device audit row → Wired, note the
deliberate messages exclusion), WIRING_STATUS entry, archive build file.
```
