# Permission Hub Wiring Audit (every grant drives a real surface)

**Status:** Follow-up build candidate — founder-approved for the queue 2026-06-09
**Filed:** 2026-06-09, during the Role-Scoping Leak Pass close-out
**Estimated workers:** 1-2 (audit pass first, then wiring pass)
**Depends on:** Role-Scoping Leak Pass (shipped 2026-06-09 — `useViewableMembers` is the wiring primitive)

---

## What this build is for

The Permission Hub (`/permissions`) has always written `member_permissions`
records correctly, but historically almost nothing read them. The Role-Scoping
Leak Pass (2026-06-09) made `tasks_basic` and `lists_basic` real (Tasks, Lists,
Sequential surfaces). This build finishes the job: **every permission key the
Hub offers either drives a real surface or is removed from the Hub** — the Hub
must never promise a control that does nothing.

## Known state at filing (2026-06-09)

**Grants that DO something:**
- `tasks_basic` — Tasks page scoping, kid pills, pending approvals (leak pass)
- `lists_basic` — Lists page scoping (leak pass)
- `tasks_basic` — sequential collection visibility (leak pass)
- Meetings keys — parent_child/mentor Touch Base creation gate (`useMeetings.ts` ~line 98, SCOPE-8b.F10)
- AI context — `src/lib/ai/context-assembly.ts` consults member_permissions for non-mom context
- `<PermissionGate>` via `usePermission(featureKey, targetMemberId)` — wherever targetMemberId is actually passed (few sites; part of the audit is enumerating them)

**Grants verified as no-ops at filing:**
- `journal_basic` (view) — no surface shows dad a kid's journal (safe-direction failure, but the Hub still offers the toggle)
- `archives_browse`, `innerworkings_basic`, `guiding_stars_basic`, `best_intentions`,
  `victory_recorder_basic`, `calendar_basic` levels, `notepad_basic`, `rhythms_basic`,
  `widgets`, `messaging_basic` (RLS handles messaging separately), `family_hub`,
  `requests_basic`, `notifications_basic`, lila_* keys, `settings_basic`, `safe_harbor`
  — status unverified-or-no-op; the audit classifies each

## The audit pass (Worker 1)

For EVERY permission_key offered by the Hub (and every row in
`permission_level_profiles`), produce a table:

| Key | Surface that should consume it | Consumes today? | Decision |

Decisions are one of:
1. **Wire it** — the surface exists; add `useViewableMembers(key)` (read scoping)
   and/or `usePermission(key, targetId)` (action gating) at the surface
2. **Defer it** — surface doesn't exist yet (e.g., dad-views-kid-journal is a
   product question, not a wiring task) → REMOVE from Hub UI until the surface
   ships, or label as "coming soon" per founder choice
3. **Remove it** — key is obsolete or covered by another mechanism

Founder reviews the table before any wiring (this is the Checkpoint 1 gate).

## The wiring pass (Worker 2)

Implement the founder-approved "Wire it" rows. Pattern is established:
- Read scoping: `useViewableMembers(featureKey, effectiveMember)` per the leak pass
- Action gating: `usePermission(featureKey, targetMemberId)` / `<PermissionGate>`
- Access-level semantics: `view` = see, `contribute`/`manage` = act (per-key
  definitions go in the audit table)

## Cross-references

- `claude/follow-up-builds/dad-finance-access.md` — finance keys are handled there
  (new key seeding + RLS); this audit should NOT duplicate that scope
- Follow-up queue item 6 (per-member sidebar customization) — sidebar visibility
  runs off `member_feature_toggles`, a different table; out of scope here but the
  audit table should note where the two systems touch
- `src/lib/permissions/usePermission.ts` — the canonical PRD-02 resolution order
- `src/hooks/useViewableMembers.ts` — the bulk read-scoping primitive

## What NOT to do

- Don't invent new surfaces to justify a key (deferring is fine)
- Don't touch special_adult shift logic beyond classifying it in the table
- Don't fold dad-finance-access scope in (separate queued build)
- Don't change RLS for tasks/lists here (Convention #39 migration point)
