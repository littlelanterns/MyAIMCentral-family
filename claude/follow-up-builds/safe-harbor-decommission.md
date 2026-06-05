# Safe Harbor Decommission

**Status:** Deferred — low-priority cleanup. No production data exists; no urgency.
**Filed:** 2026-05-28
**Founder update:** 2026-05-28
**Filed from:** View As Identity-Scope Architecture build (Deliverable B / Q4 founder decision)
**Estimated workers:** 0-2 (see Phase split below)
**Estimated calendar time on branch:** under a day for Phase 0; 1-2 days for full Phase 1+
**Live-app downtime:** zero (feature branch strategy)

---

## Founder update — 2026-05-28

> "There are no safe harbor anything yet. I think initially, I'd just be fine hiding it from the sidebar for everyone."

No production Safe Harbor data exists. No real users have Safe Harbor conversations, orientation completions, literacy records, or consent records. This collapses the urgent scope to "make sure the feature isn't visible." Full schema/code/convention removal is still desirable for code hygiene but is no longer time-sensitive.

The decommission is now a two-track effort:

- **Phase 0** — ensure Safe Harbor is invisible everywhere users can reach it. Effectively zero work; likely already complete via the View As Identity-Scope Architecture build's sidebar rewrite. Verify, don't rebuild.
- **Phase 1+** — eventual full removal of Safe Harbor schema, edge function code, conventions, and PRD-20 status update. Scheduled when convenient; not blocking anything.

---

## What this build is for

**Phase 0 (urgent, but probably already done):**
Verify Safe Harbor is not surfaced anywhere a user would encounter it. Sidebar entries, routes, AI Vault entries, LiLa mode pickers, settings surfaces. If any visible surface remains, hide it.

**Phase 1+ (deferred, schedule when convenient):**
Remove the underlying infrastructure — schema tables and columns, LiLa mode registry rows, edge function code paths, convention text, route registration, PRD-20 status. This is code hygiene and reduces surface area for future bugs / audit findings, but does not affect users today.

---

## Why we're doing it

Founder decision 2026-05-25:

> "I think I want to scrap the entire Safe Harbor concept. It feels too big to do effectively, it isn't the main purpose of what I'm creating, and there are other tools better suited and with better legal abilities, and I don't want the responsibility if something in Safe Harbor goes wrong."

This is a scope decision, not a technical decision. Safe Harbor was originally specified to give kids and adults a private AI processing space for emotional content. The founder concluded the legal/liability surface is too large for a solo-founder platform to maintain responsibly.

**Crisis Override stays.** Per Convention #7, crisis detection runs globally across every LiLa conversation in every mode. The Safe Harbor decommission does NOT touch that.

**PRD-30 Safety Monitoring stays.** Per Convention #244 and the PRD-30 build, safety monitoring is a separate system. It does NOT depend on Safe Harbor.

---

## Strategy — Phase 0 (verification, do now)

This is essentially a confirmation pass that takes minutes, not days. Can fold into the View As Identity-Scope Architecture build's Mom-UI verification or run as a one-off audit after.

### Phase 0 checklist (no new worker required)

- [ ] Confirm `/safe-harbor` is NOT in any sidebar shell config (`getSidebarSections()` in `src/components/shells/Sidebar.tsx`)
- [ ] Confirm `/safe-harbor` is NOT in any bottom-nav More menu (auto-inherits from sidebar — should be omitted if sidebar omits)
- [ ] Confirm Safe Harbor LiLa modes (`safe_harbor`, `safe_harbor_guided`, `safe_harbor_orientation`, `safe_harbor_literacy`) are not surfaced in any mode picker UI
- [ ] Confirm Safe Harbor is NOT advertised in AI Vault, settings, or onboarding flows
- [ ] Confirm any "Safe Harbor" mention in user-facing copy is removed

If any of these are still surfaced: file a small edit. If all are clean: Phase 0 is complete, file the verification result and move on.

---

## Strategy — Phase 1+ (full decommission, deferred)

Feature branch (`safe-harbor-decommission`). When the founder schedules this build, follow the phased strategy below. Until then, it sits.

### Phase 1 — Schema decommission (Worker 1)

Since no production data exists, the data disposition question (delete / migrate / archive) is answered: nothing to preserve. Drop everything.

- Drop `safe_harbor_orientation_completions` table
- Drop `safe_harbor_literacy_completions` table
- Drop `safe_harbor_consent_records` table
- Drop `lila_conversations.is_safe_harbor` column (with verification that 0 rows exist with `is_safe_harbor=true` first — defensive check)
- Remove Safe Harbor rows from `lila_guided_modes`: `safe_harbor`, `safe_harbor_guided`, `safe_harbor_orientation`, `safe_harbor_literacy`
- Remove hardcoded Safe Harbor entry from `view_as_feature_exclusions`

All migrations idempotent, follow project convention numbering, regenerate `claude/live_schema.md`.

### Phase 2 — Code cleanup (Worker 2)

- Remove SafeHarborPage from `src/pages/placeholder.tsx`
- Remove `/safe-harbor` route registration in App.tsx and from ViewAsModal.tsx's `renderPage()` allowlist
- Audit `_shared/context-assembler.ts` for Safe Harbor handling (Convention #56-59 references)
- Audit edge functions for `safe_harbor` mode references — likely in `lila-chat`, `safety-classify`
- Remove `is_safe_harbor` filter from any aggregation query (defensive grep per Convention #243)
- Remove `filterKidPrivate()` Safe Harbor branch added during View As Identity-Scope Architecture build

### Phase 3 — PRD + convention updates (Worker 3, can fold into Worker 2)

- PRD-20 → status `RETIRED` in front-matter, leave file in place for git history
- Convention #6 — review for Safe Harbor-specific language; preserve crisis override semantics
- Convention #7 — global crisis override stays unchanged
- Convention #56-59 — remove Safe Harbor-specific filtering steps; rewrite remaining filtering
- Convention #243 — remove Safe Harbor aggregation guardrail OR keep as defensive doc (founder call)
- Update `claude/feature_glossary.md` — remove PRD-20 row or mark RETIRED
- Update `WIRING_STATUS.md` — remove Safe Harbor entries

---

## Blockers / prerequisites

- **Phase 0** — none. Can verify immediately.
- **Phase 1+** — View As Identity-Scope Architecture build should close first. The `filterKidPrivate()` helper introduced during that build includes Safe Harbor as a kid-private category during transition; removing it cleanly requires that helper to exist first.
- **No PRD-30 conflict.** Safety monitoring is independent.

---

## What NOT to do

- **Touch Crisis Override.** Convention #7 is non-negotiable. Crisis detection runs globally across every LiLa conversation.
- **Touch PRD-30 Safety Monitoring infrastructure.** Different system. Don't conflate them.
- **Schedule Phase 1+ as urgent.** It isn't. No user is affected. Get to it when convenient.
- **Leave Safe Harbor references in conventions as "historical context."** Either it's gone or it isn't.

---

## Open questions for the founder at dispatch time

(All can wait until Phase 1+ is actually scheduled.)

1. **Convention #243 fate** — preserve the aggregation guardrail as defensive documentation against any future "private LiLa conversation" feature, or remove entirely?
2. **PRD-20 file disposition** — move to a `retired/` directory, mark front-matter `STATUS: RETIRED`, or delete? Recommend front-matter update + leave in place for git history clarity.

---

## Related

- **Convention #7** — global crisis override (PRESERVED)
- **Convention #56-59** — Layer 2 context filtering (Safe Harbor-specific portions removed in Phase 1+; remainder preserved)
- **Convention #243** — Safe Harbor aggregation guardrail (decision pending in Phase 1+)
- **PRD-30 Safety Monitoring** — separate system, not affected
- **View As Identity-Scope Architecture build** — `filterKidPrivate()` includes Safe Harbor as a kid-private category during transition; Phase 1+ retires that branch
