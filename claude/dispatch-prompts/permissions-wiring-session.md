# Dispatch — PERMISSIONS-WIRING session

> Paste everything below the line into a fresh Claude Code session.
> Prepared 2026-06-09 at founder request, following the Role-Scoping Leak Pass.

---

You are Worker PERMISSIONS-WIRING on MyAIM Central. This is a feature-anchored build session — full build per the orchestrator rules: active build file in `.claude/rules/current-builds/`, founder-approved plan before code, Checkpoint 2-style verification per phase, Checkpoint 5 audit table, close-out file updates. CLAUDE.md and `.claude/rules/` auto-load; honor every convention, especially:

- **#121** — `./node_modules/.bin/tsc -b` clean before declaring anything done
- **Migrations** — idempotent (DROP POLICY IF EXISTS + CREATE); check `npx supabase migration list --linked` for the next free number FIRST (parallel sessions have collided twice; 100259 was the last as of 2026-06-09); after applying run `npm run schema:dump` and stage `claude/live_schema.md` (pre-commit hook enforces)
- **Theme tokens only**, Lucide icons, `<ModalV2>`, density classes on any UI you touch
- **Visual Verification Standard** — eyes-on desktop + 375px before marking UI items Wired
- **Playwright proof** — extend the pattern in `tests/e2e/permissions/role-scoping-leak-pass.spec.ts` (Testworth family, service-role fixtures with a unique prefix, cleanup in afterAll). Every grant you wire gets a browser test proving granted vs ungranted behavior.

## Read first (full documents, not skims)

1. `claude/follow-up-builds/permission-hub-wiring-audit.md` — the audit spec (scope LAW)
2. `claude/follow-up-builds/dad-finance-access.md` — finance + management-surface grants (founder rulings quoted verbatim; scope LAW)
3. `claude/follow-up-builds/per-member-sidebar-customization.md` — sidebar layer (has 5 open founder questions — surface them at the gate)
4. `.claude/completed-builds/2026-06/role-scoping-leak-pass.md` (or `.claude/rules/current-builds/role-scoping-leak-pass.md` if not yet archived) — what already exists: `useViewableMembers(featureKey, forMember?)`, MomOnlyRoute own-login enforcement, migrations 100255 + 100259
5. `src/lib/permissions/usePermission.ts` + `src/hooks/useViewableMembers.ts` — the two wiring primitives
6. PRD-02 (permissions model) + `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` + PRD-28 (financial) — per `claude/PRE_BUILD_PROCESS.md`

## Phase 1 — Audit (NO code)

Build the audit table: every `permission_key` offered by Permission Hub and every row family in `permission_level_profiles`, with columns:

| Key | Surface that should consume it | Consumes today? (file:line) | Proposed decision (wire / defer-remove-from-Hub / remove) | Access-level semantics (view vs manage) |

Known facts to seed the table (verified 2026-06-09): `tasks_basic` + `lists_basic` are consumed (leak pass); meetings keys gate parent_child/mentor creation (`useMeetings.ts` ~98); AI context assembly consults grants; `journal_basic`, `archives_browse`, `innerworkings_basic`, `victory_recorder_basic` and most others are no-ops. Include a **Special Adult section** reconciling `getSidebarSections('special_adult')` against `special_adult_permissions` + `permission_level_profiles` (queue item 2 folds in here).

**STOP. Present the table to Tenise with the open decisions below. No code until she approves.**

Open founder decisions to present at the gate:
- Grant shape for FAMILY-LEVEL surfaces (Studio / Prize Board / RewardRules): `member_permissions` requires a `target_member_id` today — nullable family-wide row, a sentinel convention, or a new column?
- Prize Board at `manage`: Mark Paid + ledger only, or also the Allowance tab (period close-out, grace days)? (Doc recommends Mark Paid + ledger only; period management stays mom.)
- Notification to mom when dad records a payment?
- The 5 open questions in the per-member-sidebar-customization doc.
- For every "defer" key: remove from Hub UI vs label "coming soon"?

## Phase 2 — Wire (after approval)

1. **Dad finance access** — seed `financial_tracking` into `permission_level_profiles` (dad_adults, default `none`); RLS migration extending `ft_scoped_read` / `loans_scoped_read` / `ft_parent_insert` (and check `allowance_periods` + Mark-Paid write paths) with granted paths per the doc; `/finances/history` + Prize Board guards admit granted adults; member pickers scope via `useViewableMembers('financial_tracking')`; payments attributed to dad in the audit trail. Ledger stays APPEND-ONLY (Convention #223) — "edit" = new payment/adjustment rows, never mutation.
2. **Management surfaces** — Studio, Prize Board, RewardRules grantable: default invisible (unchanged for ungranted dads — sidebar omission + Parent-only card); granted → appears in dad's sidebar AND the route guard admits him. This needs the grant-aware guard (extend MomOnlyRoute or build `GrantedRoute`) and the sidebar layering from item 3.
3. **Per-member sidebar customization** — `useResolvedFeatureAccess(memberId)` layering `member_feature_toggles` + grants over `permission_level_profiles` baselines; `getSidebarSections()` consumes it. CLAUDE.md Convention #16 (BottomNav More menu derives from getSidebarSections) means mobile parity comes free — verify it anyway at 375px.
4. **Approved "wire" rows from the audit table** — via `useViewableMembers` (read scoping) / `usePermission` (action gating).
5. **Hub cleanup** — approved defer/remove keys leave the Permission Hub UI so it never offers a dead toggle.

Amend CLAUDE.md: Prize Board "mom-only" (Phase 3 Connector Layer) becomes "mom + finance-granted adults" — explicit convention note, founder sign-off required.

## NOT in scope

- Editing/deleting financial ledger rows (append-only, non-negotiable)
- Special Adult finance access
- `child_can_see_finances` changes
- Tasks/Lists RLS hardening (Convention #39 migration point)
- Family Overview Command Center restructure (separate queued build)

## Close-out

- `tsc -b` clean; `npm run lint` no new errors; full Playwright suite for this build green + role-scoping-leak-pass.spec.ts still green (regression)
- Post-Build Verification table (Wired/Stubbed/Missing, zero Missing) + Mom-UI table (desktop/tablet/375px)
- Update `WIRING_STATUS.md`, `STUB_REGISTRY.md` (if stubs), `claude/feature-decisions/` file, follow-up queue memory (items 2/6/9/10 → shipped)
- Logical commits per phase; **stage only your own files** (check `git status` for parallel-session work before any `git add`); push at the end
