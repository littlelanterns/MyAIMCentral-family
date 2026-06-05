# Special Adult Sidebar Audit (Convention #40 Follow-Up)

**Status:** Follow-up build candidate — not yet scoped. Greenfield (no prior Special Adult work shipped).
**Filed:** 2026-05-28
**Founder update:** 2026-05-28
**Filed from:** View As Identity-Scope Architecture build (Convention #40 flag during scope review)
**Estimated workers:** 1-2
**Estimated calendar time on branch:** 1-2 days
**Live-app downtime:** zero (feature branch strategy)

---

## Founder update — 2026-05-28

Two confirmations from the founder:

1. **No Special Adult work has shipped yet.** This is greenfield. There is no existing Special Adult sidebar/shell to migrate from — the build is BUILDING the Special Adult experience, not retrofitting it.
2. **Special Adult dashboard is purely a caregiving tool.** No personal-growth surfaces (Journal, Reflections, BookShelf personal use, Guiding Stars, BestIntentions, InnerWorkings, Victories, LifeLantern). The Special Adult is at this platform to provide care during a shift, not to use it as a personal growth tool.

These two confirmations resolve the open questions previously surfaced. The build is now cleanly scoped.

---

## What this build is for

Build the Special Adult shell and sidebar from scratch, applying the invisibility-over-blocking architecture from the View As Identity-Scope Architecture build. Special Adults are shift-scoped (or always-on) caregivers — typically grandparents helping during a weekend, hired sitters, co-parents during their custody window. Their access window is bounded by `access_schedules` (PRD-35) and `time_sessions` (PRD-36). Their scope is bounded by which kids they're shifted for.

The build delivers:
- A Special Adult sidebar containing ONLY caregiving surfaces
- A Special Adult shell wrapper (or confirmation that the existing Adult shell can be reused with a different sidebar)
- Shift-aware visibility — sidebar reflects "active shift" vs "outside shift" state
- Integration with `useEffectiveShell()` from the View As Identity-Scope Architecture build

---

## Why we're doing it

Convention #40 was flagged during the View As build's mom-only routes review as a follow-up audit. The View As build narrowly scoped to Adult and Independent shells; Special Adult was explicitly deferred:

> "Special Adults' sidebars should probably also follow invisibility-over-blocking (omit non-shift-relevant surfaces). Out of scope for THIS build; surfacing as follow-up."

Without this build, when Special Adults eventually start being added to families, they would fall through the sidebar code path to either the Adult case (massive scope expansion they shouldn't have) or a default (broken experience). The build delivers a real, scoped Special Adult experience before that happens.

---

## Strategy — feature branch, greenfield build

Feature branch (`special-adult-shell`). Build the shell from scratch around what Special Adults actually need during a caregiving shift. No retrofit, no migration — there's nothing yet to migrate.

### Phase 1 — Caregiving scope audit (worker reads, no code yet)

- Read PRD-02 § Special Adult permission model
- Read PRD-27 Caregiver Tools — `trackable_event_categories`, `trackable_event_logs`, `shift_reports`
- Read PRD-35 § Access Schedules — `access_schedules` table, shift gating logic
- Read PRD-36 § Time Sessions — `time_sessions`, shift session lifecycle
- Read `permission_level_profiles` for `special_adult` role
- Map the actual scope: what does a Special Adult need to see and do during a shift, in priority order?

Expected scope (founder-confirmed: caregiving only, no personal-growth):

- **Home** — shift dashboard. Current shift status, kids in scope, time remaining, current trackable events log
- **Plan & Do** — narrowly:
  - Tasks (scoped to assigned kids during shift only)
  - Calendar (scoped to assigned kids during shift only)
  - Trackable Events log (PRD-27 — meals, naps, medications, behavior, etc.)
- **Family** — only:
  - Messages (with mom and assigned kids only)
  - Shift Reports (PRD-27 — start/end shift summary)

Explicitly NOT in scope (per founder):

- Journal, Reflections, Rhythms, BookShelf, Guiding Stars, BestIntentions, InnerWorkings, Victories, LifeLantern, AI Vault personal tools, Family Feeds, Family Context (People), Archives, Studio, Prize Board, RewardRules, Trackers (mom's configuration), Lists (mom's organization)

### Phase 2 — Shell + sidebar implementation

- Decide: does Special Adult need its own ShellType (`'special_adult'`) or can it reuse the Adult shell with a different sidebar? Recommend NEW shell type because the layout and chrome should reflect caregiving (shift status indicator, prominent "log event" affordance, etc.) — not a general adult productivity surface.
- If new shell type: add `'special_adult'` to `ShellType` union in `src/lib/theme/`, add case in `RoleRouter`, add `SpecialAdultShell` component
- Add `case 'special_adult':` branch to `getSidebarSections()` in `src/components/shells/Sidebar.tsx`
- Update `getShellForMember()` in `ShellProvider.tsx` to map `role='special_adult'` to `'special_adult'` shell
- Update `useEffectiveShell()` and `ViewAsModal`'s `targetShell` resolver to handle the new shell type
- Sidebar config built strictly around the Phase 1 scope audit — no scope creep

### Phase 3 — Shift-aware visibility

Special Adults are unique among non-mom roles: their access is TIME-BOUNDED, not just role-bounded. A Special Adult outside their shift window has effectively NO access. The shell should reflect this:

- During an active shift (`access_schedules.is_active=true` AND current time within window, OR `schedule_type='always_on'`): full Special Adult sidebar renders
- Outside an active shift: shell shows a "Start Shift" or "Awaiting Shift" landing page only. No sidebar items. No data access.
- Always-on co-parents (per PRD-35 `schedule_type='always_on'`) skip this gating entirely — they're treated as in-shift continuously

Existing `useCanAccess()` may already handle feature-gate-level shift checks; this phase verifies and codifies the SHELL-level behavior.

### Phase 4 — Convention update

Update Convention #40 wording. Current convention:

> "Special Adult shifts use `time_sessions` with `source_type='shift'`, `is_standalone=true`. No separate `shift_sessions` table. Co-parents with `always_on` schedule skip shift start/end entirely."

Add:

> "Special Adult sidebar follows invisibility-over-blocking. The shell scope is caregiving only — no personal-growth surfaces, no mom-management surfaces. See `getSidebarSections('special_adult')` for canonical scope. Outside an active shift, no sidebar items render; the shell shows an awaiting-shift state."

---

## Blockers / prerequisites

- **View As Identity-Scope Architecture build must close first.** This build uses `useEffectiveShell()`, `getShellForMember()` (now exported), and the invisibility-over-blocking pattern established there.
- **No PRD-27 (Caregiver Tools) blockers** — that's marked MVP-complete per `claude/feature_glossary.md`.
- **No PRD-35 (Universal Scheduler) blockers** — also MVP-complete.

---

## What NOT to do

- **Reuse the Adult sidebar config with omissions.** Build the Special Adult config fresh. Reuse-with-omissions invites scope creep and bugs when the Adult config changes later.
- **Include any personal-growth surface.** No Journal, no Reflections, no BookShelf, no Guiding Stars, no Victories, no LifeLantern. The founder has been explicit: caregiving tool only.
- **Allow access outside the shift window.** Even read-only access outside a shift is a permission scope expansion. The sidebar should be empty/landing-only when no active shift exists.
- **Add mom-management surfaces** (Studio, Prize Board, RewardRules, Archives admin, Family Feeds, etc.). Those are mom-only by Convention #2 of the View As build's mom-only routes list. They do NOT appear here either.
- **Build Special Adult View As mode in this build.** That's a separate question — does mom doing View As Special Adult work the same way as View As kid? Probably yes, but verify and possibly add to this build's scope or a follow-up.

---

## Open questions for the founder at dispatch time

1. **Shift session UI affordances** — does the Home/shift dashboard need a "Start Shift" / "End Shift" button, or is that handled elsewhere (mom-initiated, automated by schedule, etc.)? Affects what's on the landing surface.
2. **Outside-shift behavior** — is "Awaiting Shift" a static landing page, or does it show upcoming shift info ("Your next shift is Saturday 2pm")? The latter is more useful but requires schedule lookup.
3. **Mom-UI verification scope** — this build is for the Special Adult experience, not mom's. But mom-via-View-As-Special-Adult should be tested as part of Mom-UI verification. Confirm that's in scope.
4. **Always-on co-parent edge case** — confirm always-on co-parents see the full Special Adult sidebar at all times (no shift gating). They should not be locked out at 3am just because they're not "actively shifting" in the time_sessions sense.

---

## Related

- **Convention #40** — Special Adult shifts via `time_sessions` (existing; this build amends)
- **View As Identity-Scope Architecture build** — established invisibility-over-blocking pattern and `useEffectiveShell()` hook
- **PRD-02** — Permissions and Access Control, Special Adult permission model
- **PRD-27** — Caregiver Tools, trackable events, shift reports
- **PRD-35** — Universal Scheduler, `access_schedules` table backing shift windows
- **PRD-36** — Universal Timer, `time_sessions` lifecycle
