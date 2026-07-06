# Pre-Dispatch Pack — SMFX: Small-Fixes Bundle

> **Factory status:** synthesized → decisions-pending (2 decisions, recommendations below)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: SMFX. Priority: P1 (opportunistic).
> One short Sonnet session; zero founder-visible risk; every item verified live on 2026-07-04
> against committed state.

## Scope (8 items, all verified current — items 7-8 added 2026-07-04 from the 14E/05C recons)

### 1. `/queue` redirect route (dead notification link since PRD-15 Build G)
No `/queue` route exists anywhere in `src/` (verified by grep 2026-07-04). Three live producers
write `action_url: '/queue?tab=requests'`: `src/hooks/useRequests.ts:133`,
`src/hooks/useRewardProposals.ts:163` and `:351`. NotificationTray navigates there → 404/blank.
**Fix:** add a `/queue` route (inside `<ProtectedRoute>`) that redirects to `/dashboard` and opens
the UniversalQueueModal on the tab named by `?tab=` (`requests|sort|calendar`, default requests).
Producers stay untouched — the URL becomes real. Registered in STUB_REGISTRY (KIDS-REWARDS
follow-ups, ⏳ MVP).

### 2. fo-command-center pin seeds `family_overview_configs`
`tests/e2e/family-overview/fo-command-center.spec.ts` assumes the default no-config state and
never seeds it — any session that saves a member selection on Testworth mom's FO breaks tests
6+12 ("Jordan's column"). Bit the 2026-07-03 pin run; repaired by a one-off manual delete.
**Fix:** beforeAll/afterAll snapshot + restore of `family_overview_configs` via service role
(same pattern the kids-rewards slice specs use for member preferences). Test-infra only.
Registered in STUB_REGISTRY (⏳ MVP, "FO-COMMAND-CENTER-owned surface").

### 3. Shopping-mode scoping residuals (from the shipped Role-Scoping Leak Pass)
Per `claude/follow-up-builds/shopping-mode-and-lists-visibility-scoping.md` (shipped 2026-06-09,
two residuals): (a) **automated test pin** for the list-visibility rules (mom family-wide;
non-mom own+shared only; the founder's three canonical cases — gift-ideas list never leaks,
"belt for Gideon" never reaches Miriam, shared grocery list does reach her); (b) **Q4 audit** —
Notepad/route list-picker parity: verify every write-destination list picker (route-to-list
surfaces) scopes to the same own+shared+granted rule, fix any leak found (bounded: display-layer
scoping, same `useViewableMembers`/shares pattern).

### 4. Revoke transitional public `set_family_password` RPC grant
Family-Auth-Two-Door stub (⏳ MVP): the bare RPC skips shadow-account rotation → drift risk; the
`family-auth-admin` Edge Function path is canonical. **Fix:** one migration revoking
EXECUTE from client roles (take the next free migration number at creation time — parallel
sessions are landing migrations; verify with `ls supabase/migrations | tail` immediately before
push). Verify the Settings page + `npm run family:password` script both use the Edge Function
path before revoking.

### 5. Emoji sweep (KIDS-REWARDS Slice 2 registered follow-up; emoji rule = zero Unicode emoji)
Verified live 2026-07-04: `src/features/permissions/ViewAsMemberPicker.tsx:226` (👁 → Lucide
`Eye`); `src/components/tasks/views/OneFiveThreeView.tsx:105` (📋 → Lucide `ClipboardList`);
`src/components/widgets/info/InfoCountdown.tsx:48` (🎯 *fallback* → Lucide `Target`). The
`countdowns.emoji` COLUMN (user-supplied emoji feature) is NOT touched here — see D-SMFX-1.
After the three swaps, run a repo-wide emoji grep and list any further hits in the build report
(fix mechanical ones; flag product-decision ones).

### 7. `/hub/tv` blank-page fix (added 2026-07-04 from the PRD-14E recon)
`HubTvStub` renders `<PlannedExpansionCard featureKey="family_hub_tv_route" />` but that key is
NOT in `feature_expansion_registry.ts` → the card returns null → **the route renders a blank
page today** (Convention #31 violation). Fix: add the registry entry (name/description/
location_hint per the Convention #31 shape). One line + copy.

### 8. Hide the misleading Optimizer mode-picker entry (added 2026-07-04 from the PRD-05C recon)
`optimizer` sits in LiLa's live mode picker (`LilaModeSwitcher.tsx:16,33` BUILT_MODES/
DRAWER_MODES) but the PRD-05C flow is unbuilt — selecting it silently falls through to bare
chat (STUB:116 "MISLEADING UI"). Fix: remove `'optimizer'` from both sets (the mode row and
feature key stay — the PRD05C build un-hides it). One-line honesty fix.

### 6. PRD-14D §Screen 5 line 335 wording edit (doc-only)
Hub session-timeout text references PRD-01 settings that are intentionally unenforced. One-line
edit so the PRD doesn't promise behavior the code doesn't deliver. **Convention #12 exception
required:** `prds/` is read-only source material — this edit executes ONLY with the founder's
explicit go in the pack approval (it was founder-sanctioned in the follow-up queue, 2026-05-28).

## Decisions

| # | Decision | Recommendation |
|---|---|---|
| D-SMFX-1 | `countdowns.emoji` column: keep user-supplied emoji, or replace with platform-asset/icon picker? | DEFER the product decision to the PRD-14E/Hub pack (countdowns are a Hub feature). SMFX swaps only the hardcoded 🎯 fallback — purely mechanical, no behavior change for existing user data. |
| D-SMFX-2 | Authorize the one-line PRD-14D edit (Convention #12 exception)? | Yes — it was already founder-sanctioned 2026-05-28; approving this pack is the written authorization. |

## Model routing
Single worker: **Sonnet 5, effort xhigh** (per model-routing — all coding workers xhigh even when
cheap). No judgment gate needed beyond the founder eyes-on: every item is pinned by a test or is
doc-only. Playwright + tsc + lint are the proof.

---

## DISPATCH PROMPT (paste into a FRESH session)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for SMFX — the small-fixes bundle. Pre-dispatch pack:
claude/dispatch-factory/SMFX.md (read it first; it is the scope authority). Decisions resolved:
D-SMFX-1 = fallback-only emoji swap, do NOT touch the countdowns.emoji column or its UX;
D-SMFX-2 = the PRD-14D one-line edit is authorized (sole Convention #12 exception in this build).

FRESHNESS PREAMBLE: pack produced 2026-07-04. Run `git log --oneline --since=2026-07-04`, re-read
CLAUDE.md conventions added since, and re-verify each file:line in the pack before editing.

BUILD (8 items, no scope growth):
0a. /hub/tv blank-page fix: add the family_hub_tv_route entry to feature_expansion_registry.ts
   (Convention #31 shape) — verify the route now renders the roadmap card.
0b. Optimizer picker honesty: remove 'optimizer' from LilaModeSwitcher BUILT_MODES/DRAWER_MODES
   (mode row + feature key untouched — PRD05C's build restores it).
1. /queue redirect route: <ProtectedRoute> route redirecting to /dashboard and opening
   UniversalQueueModal on ?tab= (requests|sort|calendar; default requests). Do not modify the
   three producer call sites. E2E: notification tap-through lands with the modal open on the
   Requests tab.
2. fo-command-center.spec.ts: beforeAll/afterAll snapshot+restore of family_overview_configs via
   service role (pattern: kids-rewards slice specs' preference snapshot). Run the FO pin after —
   ASK THE FOUNDER before running any shared-fixture suite (parallel sessions use Testworth).
3. Shopping-mode: (a) new spec pinning list visibility (mom family-wide; teen own+shared only;
   the three canonical founder cases from the pack); (b) audit every route-to-list picker for
   own+shared+granted scoping, fix leaks found, report the audit table.
4. Migration revoking public EXECUTE on set_family_password (verify Settings page + npm run
   family:password use the family-auth-admin Edge Function FIRST). Take the next free migration
   number at creation time and re-check immediately before `supabase db push --linked`.
5. Emoji swaps: ViewAsMemberPicker.tsx (👁→Eye), OneFiveThreeView.tsx (📋→ClipboardList),
   InfoCountdown.tsx fallback (🎯→Target). Then repo-wide emoji grep: fix mechanical hits, flag
   product-decision hits in your report. Theme tokens only; no hardcoded colors.
6. prds/dashboards/PRD-14D-Family-Hub.md §Screen 5 (~line 335): one-line wording fix so hub
   session-timeout text stops referencing unenforced PRD-01 timeouts. Touch NOTHING else in prds/.

PROOF: new/updated specs green, tsc -b clean, lint clean, affected pins green (fo-command-center;
leak-pass if item 3b changed code). NOTHING COMMITS until proof is green AND founder eyes-on
clears; selective staging (this build's files only); founder confirms before push. No active
build file needed beyond a minimal .claude/rules/current-builds/SMFX.md you create at start and
archive at close (it's still a build — Checkpoints 5/6 apply, scaled to size).
```
