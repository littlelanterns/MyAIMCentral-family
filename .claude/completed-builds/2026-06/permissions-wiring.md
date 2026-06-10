# PERMISSIONS-WIRING (Permission Hub Wiring Audit + Dad Finance/Management Access + Sidebar Layer)

## Status: SIGNED OFF 2026-06-09 — founder verified in-app ("That all seems to work!" on the grant flows; "Looks great!" on the Balance arrangement). Final scope: base build (34 Wired / 3 Stubbed / 0 Missing) + two founder-requested follow-ons same session: FAMILY-WIDE finance grant (migration 100261) and Balance tab By-child/By-date arrangement. E2E 14/14 + leak-pass 10/10. Convention #274.

> Residual real-life check (non-blocking, noted for whenever it naturally happens): one Mark Paid from dad's actual device → confirm mom's notification + "paid by" ledger attribution on her phone.

## Founder decisions (Checkpoint 1 gate, 2026-06-09)

| # | Decision | Ruling |
|---|----------|--------|
| 1 | Grant shape for family-level surfaces (Studio/PrizeBoard/RewardRules) | **Nullable `target_member_id`** + partial unique index for family-wide rows |
| 2 | Prize Board scope for granted dads | **Mom chooses via access level**: view = see balances/ledger; contribute = + record payments/Mark Paid; manage = + Allowance tab (period close-out, grace days). Default suggestion = contribute |
| 3 | Notify mom when dad records a payment | **Yes — quiet in-app notification**, AND ledger row attributed to dad (actor in metadata + displayed) |
| 4 | Unwired growth rows in per-kid grid (journal, guiding_stars, best_intentions, innerworkings, victory_recorder) | **Keep, marked inactive** ("takes effect in a future update") |
| 5 | `tool_higgins_say` per-kid row | **Remove entirely** (defer; revisit at PRD-19) |
| 6 | Special Adult per-kid toggle grid | **Hide the section** (Shift Log + Emergency Lock stay — they work). File "Special Adult Experience" follow-up build |
| 7 | TeenTransparencyPanel | **Mount in teen Settings** + SINGLE SOURCE OF TRUTH: a shared key wiring-status registry drives inactive-marking in BOTH the Hub grid and the teen panel — neither screen may claim an unenforced control |
| 8 | Family-Wide Rules card (3 fake switches) | **Remove the card entirely.** No pointer needed — calendar approval already lives in Calendar Settings; teen-messaging + family-feed rules will be built inside their own sections (PRD-15 / PRD-37) when those ship |
| 9 | View-vs-Contribute semantics on wired tasks_basic/lists_basic | **Tighten now**: view = see only (no completion/approve actions); contribute+ = act |
| 10 | Permission change sync timing | **On next page move** (render-time + query invalidation; no realtime push) |

**Stated assumptions (founder may veto):** (a) beta behavior — `member_feature_toggles` per-member disables STILL apply during beta; only the tier layer is bypassed (Convention #10 reading); (b) founding-family override bypasses tier only — per-member disables apply universally; (c) preset/profile apply remains a full reset per PRD-31 addendum (existing confirm warning); (d) Hub UI is substantially complete vs PRD-02 — no completion fork needed, minor fixes in this build.

> Feature-anchored build merging follow-up queue items: Permission Hub Wiring Audit (item 9/10),
> Dad Finance & Management Access, Per-Member Sidebar Customization (item 6), Special Adult
> reconciliation (item 2, classify-only).

## Source material read (full documents)

- `claude/follow-up-builds/permission-hub-wiring-audit.md` — scope LAW for the audit
- `claude/follow-up-builds/dad-finance-access.md` — scope LAW for finance + management grants (founder rulings verbatim)
- `claude/follow-up-builds/per-member-sidebar-customization.md` — sidebar layer (5 open founder questions)
- `prds/foundation/PRD-02-Permissions-Access-Control.md` — full read
- `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` — full read (3-layer model, profiles, useCanAccess spec)
- `prds/platform-complete/PRD-28-Tracking-Allowance-Financial.md` §Visibility & Permissions (dad: read if permitted, mark payments if mom enables, never configure, never create loans; Special Adult: NO finance access; dad payment delegation was listed post-MVP — founder pulled it forward 2026-06-09)
- `.claude/rules/current-builds/role-scoping-leak-pass.md` — what already exists (useViewableMembers, MomOnlyRoute own-login enforcement, migrations 100255/100259)
- `src/lib/permissions/usePermission.ts`, `src/hooks/useViewableMembers.ts`, `src/pages/PermissionHub.tsx`, `src/lib/permissions/PermissionGate.tsx` (via agent), `src/components/shells/ShellProvider.tsx`, `src/components/shells/Sidebar.tsx` (via agent), `src/lib/ai/context-assembly.ts:601-619`
- Migrations: `00000000000012_permission_profiles.sql`, `00000000100028_prd02_repair.sql` (apply_permission_profile), `00000000100134_allowance_financial.sql`, `00000000100255`, `00000000100259`

## Migration numbering note

Last migration on disk as of audit: `00000000100259`. **Re-check `npx supabase migration list --linked` immediately before writing any migration** (parallel-session collisions have happened twice).

---

## Cross-cutting findings (Phase 1 audit, 2026-06-09)

1. **`useCanAccess` is fully stubbed** (`src/lib/permissions/useCanAccess.ts:19-23` returns `{allowed:true}` always — Convention #10 beta). Consequence: **`member_feature_toggles` is 100% unconsumed at runtime.** The Hub's "Dad's Personal Features" section writes toggles that nothing reads — toggling dad's Journal off does nothing.
2. **No call site anywhere passes `targetMemberId` to `<PermissionGate>`** (grep-verified). usePermission's Layer-3 cross-member branch is unreachable through the gate — the 7 PermissionGate sites (BookShelf, Meetings, 4 Archives pages, ContextExport) effectively only check tier (stubbed true) + View-As exclusions.
3. **`mom_self_restrictions` is a no-op**: consumed only by the unreachable usePermission branch + the unmounted TeenTransparencyPanel.
4. **PRD-02 Screens 4 and 6 are built but never mounted**: `TeenTransparencyPanel` and `ShiftView` are exported from `src/features/permissions/index.ts` with zero consumers — no route, no settings panel renders them. The Hub even tells mom teens "see a What's-Shared panel in their settings" — they don't.
5. **Special Adult = full adult shell.** `getShellForMember` (ShellProvider.tsx:36-43) maps `special_adult` → `'adult'`. No special_adult branch in getSidebarSections. Shift gating exists only in the unreachable usePermission branch. In practice an SA account behaves like an ungranted additional_adult with the full adult sidebar (self-scoped data via useViewableMembers self-only + RLS).
6. **The Hub's 3 "Family-Wide Rules" toggles don't persist** (PermissionHub.tsx:302-304 — client useState; comment admits "will wire to DB when global settings table exists"). They reset on reload. `require_calendar_approval` additionally shadows a REAL wired mechanism (`calendar_settings.auto_approve_members`, PRD-14B).
7. **`apply_permission_profile` (100028 repair version) bulk-creates per-kid `member_permissions` rows** for every enabled profile key when mom taps Set Access Level — so dads already hold grants (e.g. `settings_basic` manage per kid, `calendar_basic` contribute per kid) for keys nothing consumes.
8. **Seed-fact correction:** AI context assembly does NOT consult member_permissions. `src/lib/ai/context-assembly.ts:601-619` filters non-mom to own-context-only (safe direction); the member_permissions wiring is a PRD-19 Phase-20 comment. The audit-doc line "AI context consults grants" is wrong.
9. **Hub display-semantics conflict:** DadPersonalFeatures treats "no toggle row" as **Off** ("not configured yet"), but the adult sidebar role-default shows Journal/Rhythms/Grow regardless. When the sidebar layer wires in, no-row must resolve to the role default and the Hub display must match.
10. **`useMeetings.ts:98` grant check is key-agnostic** — any member_permissions row for (dad, kid) unlocks parent_child/mentor meeting creation, regardless of permission_key. Combined with finding 7 (profile apply creates ~18 rows per kid), every Balanced dad passes this gate.

---

## Phase 1 Audit Table

Decisions: **Wired** (already real) / **Wire** (surface exists; connect it) / **Defer** (surface doesn't exist; remove from Hub or label) / **Remove** (obsolete or covered by another mechanism).

### A. Per-kid grants — Hub "Per-Child Permissions" grid (`member_permissions`, dad→kid)

| Key | Surface that should consume it | Consumes today? (file:line) | Proposed decision | Access-level semantics (view/contribute/manage) |
|---|---|---|---|---|
| `tasks_basic` | Tasks page scoping, kid pills, pending approvals, sequential | **YES** — useViewableMembers @ Tasks.tsx:225, Lists.tsx:177, SequentialCollectionView.tsx:192 (leak pass) | **Wired** — keep. Known gap: level is binary today (any non-none = visible); view-vs-contribute action gating not enforced (decision Q10) | view = see kid's tasks; contribute = complete/add for kid; manage = edit/delete incl. mom's |
| `tasks_routines` | (routines render inside Tasks surfaces) | NO — key absent from profile seed and all consumers | **Remove** from Hub grid — covered by `tasks_basic` | n/a |
| `lists_basic` | Lists page scoping | **YES** — useViewableMembers @ Lists.tsx:170 (leak pass) | **Wired** — keep (same binary-level gap as tasks_basic) | view = see kid's lists; contribute = check items; manage = edit structure |
| `calendar_basic` | Calendar is family-shared by design (leak-pass classification); writes governed by `calendar_settings.auto_approve_members` | NO | **Remove** from per-kid grid — grant has no meaning; real mechanism is Calendar Settings approval flow | n/a |
| `journal_basic` | Dad-views-kid-journal — surface doesn't exist (product question; `journal_visibility_settings` PRD-08, 0 rows) | NO (safe-direction failure) | **Defer** — remove from Hub until a surface ships | (future) view only — PRD-02: never manage for non-owner |
| `guiding_stars_basic` | No dad-views-kid-stars surface | NO | **Defer** — remove from Hub | (future) view |
| `best_intentions` | No dad-views-kid-intentions surface | NO | **Defer** — remove from Hub | (future) view |
| `innerworkings_basic` | No dad-views-kid-innerworkings surface | NO | **Defer** — remove from Hub | (future) view |
| `victory_recorder_basic` | VictoryRecorder.tsx is strictly self-scoped (lines 63-67); no cross-member surface | NO | **Defer** — remove from Hub | (future) contribute = record victory for kid |
| `lila_modal_access` | Per-kid shape is wrong — LiLa access is a PERSONAL feature (Layer 2), not per-target-kid | NO | **Remove** from per-kid grid; becomes a personal toggle via the sidebar layer | n/a (Layer 2 boolean) |
| `tool_higgins_say` | ToolConversationModal person picker (`about_member_id`, line 603) — real adjacent surface | NO | **Wire-candidate** (decision Q9): scope person picker via useViewableMembers for additional_adult. Context inclusion stays own-only until PRD-19 | view+ = kid selectable as "about" person |
| `vault_browse` | Personal feature (Layer 2); per-kid shape wrong | NO | **Remove** from per-kid grid; personal toggle via sidebar layer | n/a (Layer 2 boolean) |
| `messaging_basic` | PRD-15: parents have IMPLICIT messaging permission (Convention #140); kid pairs via `member_messaging_permissions`; RLS enforces space membership | NO | **Remove** — covered by another mechanism | n/a |
| `requests_basic` | PRD-02 Decision 16: requests BYPASS the permission model | NO | **Remove** — by-design exempt | n/a |
| `archives_browse` | ArchivesPage member cards + MemberArchiveDetail — real surface. PermissionGate present (ArchivesPage.tsx:518 etc.) but no targetMemberId → passes for everyone; `/archives` is NOT MomOnlyRoute | NO (gate ineffective) | **Wire**: scope member-card list + detail reach via useViewableMembers('archives_browse'); verify dad direct-URL behavior | view = read kid's archive folders/items; writes stay mom-only this build |

### B. Dad's Personal Features — Hub section (`member_feature_toggles`)

| Key | Surface that should consume it | Consumes today? | Proposed decision | Semantics |
|---|---|---|---|---|
| `journal_basic`, `notepad_basic`, `guiding_stars_basic`, `best_intentions`, `innerworkings_basic`, `rhythms_basic` | Dad's sidebar/BottomNav + route reachability | **NO — all 6 are no-ops** (useCanAccess stubbed; nothing reads toggles) | **Wire** via Phase-2 item 3: `useResolvedFeatureAccess(memberId)` layering toggles over `permission_level_profiles` baseline, consumed by `getSidebarSections()` (BottomNav parity free per Convention #16). Fix Hub display: no-row = role default, not "Off" | Boolean on/off (Layer 2). Off = item absent from sidebar + friendly card on direct URL |

### C. Special Adult — reconciliation (classify-only per audit-doc scope LAW)

| Item | State found | Proposed decision |
|---|---|---|
| Shell | `special_adult` → full **adult** shell (ShellProvider.tsx:42); no SA branch in getSidebarSections | **Defer to a dedicated "Special Adult Experience" build** (mount ShiftView, SA sidebar branch, shift-gated visibility). This build does not touch shift logic. |
| ShiftView (PRD-02 Screen 6) | Built (`src/features/permissions/ShiftView.tsx`), never mounted — no route | Same follow-up build |
| Hub SA grid keys: `tasks_basic`, `calendar_basic`, `notes_instructions` | Consumed ONLY by usePermission special_adult branch (unreachable — no targetMemberId ever passed). `notes_instructions` is in no profile and has no surface anywhere | Founder decision Q6: hide the SA per-kid grid until the SA build, or annotate "takes effect when shift access ships" |
| `permission_level_profiles` special_adults seed (`tasks_basic`, `calendar_basic`, `messaging_basic`, `lila_help`) vs Hub SA grid | Mismatch both directions (Hub offers notes_instructions not in seed; seed has messaging_basic/lila_help not in Hub grid) | Reconcile inside the SA follow-up build |

### D. Mom self-restrictions (`mom_self_restrictions` — Hub "Independent Visibility")

| Item | Consumes today? | Proposed decision |
|---|---|---|
| Restriction enforcement (journal/innerworkings/stars/intentions hidden from mom) | NO — usePermission Layer 1 unreachable (no targetMemberId anywhere); panel unmounted | **Defer enforcement** — needs target-aware filtering on each mom-side surface; size it as its own pass |
| TeenTransparencyPanel (PRD-02 Screen 4 — teen "What's Shared") | Built, never mounted | **Wire-candidate** (decision Q8): mount in teen Settings — cheap, honest, and the Hub already promises it exists |

### E. Family-Wide Rules — Hub global toggles (UNPERSISTED)

| Toggle | State | Proposed decision |
|---|---|---|
| `require_calendar_approval` | Client-side useState only; duplicates WIRED `calendar_settings.auto_approve_members` | **Remove** — replace with a link to Calendar Settings |
| `teens_can_message_peers` | Unpersisted; real mechanism is PRD-15 `member_messaging_permissions` per-pair rows | **Remove** (or future wire writing per-pair rows — defer) |
| `adults_see_family_feed` | Unpersisted; PRD-37 scope | **Remove** |

### F. Profile-seeded keys with no Hub surface (dad_adults seed: 23 keys)

`lila_help`, `lila_assist`, `lila_optimizer`, `widgets`, `family_hub`, `notifications_basic`, `settings_basic`, `safe_harbor` get per-kid `member_permissions` rows auto-created by Set Access Level, consumed by nothing. Decision: leave rows harmless this build; **remove `safe_harbor` from profile seed** in the Phase-2 migration (PRD-20 backburnered — Hub already dropped it 2026-06-09); the rest become meaningful only via the sidebar layer (they're Layer-2-shaped). `settings_basic` per-kid rows are nonsense (settings is personal) — clean in Phase 2 migration if founder approves.

### G. Finance + management surfaces (Phase 2 scope per dad-finance doc)

| Key | State | Phase 2 action |
|---|---|---|
| `financial_tracking` | Registered (feature_key_registry, 100134:832) + feature_access_v2 dad_adults Enhanced. NOT in profiles, NOT in Hub, zero consumers | Seed `permission_level_profiles` dad_adults rows (default none); Hub per-kid grid row; RLS granted paths on `ft_scoped_read`/`loans_scoped_read`/`ft_parent_insert`; route guards; useViewableMembers pickers; dad attribution in payment metadata. view = ledger/balances/loans read; manage = + record payments/adjustments (APPEND-ONLY, Convention #223). Loans WRITE stays mom (PRD-28: dad never creates loans). Allowance CONFIG stays mom. |
| `studio` (registered) | Mom-only via sidebar omission + MomOnlyRoute | Grantable family-level: default invisible; granted → sidebar entry + guard admits. view = browse; manage = create/edit/deploy |
| Prize Board + RewardRules key | No key decided (`gamification_basic` family-level reuse vs new key) | Founder decisions Q1/Q2. view = see boards; manage = Mark Paid + ledger (+ Allowance tab per Q2) |

### H. Adjacent real consumers (no change proposed, recorded for completeness)

| Site | Behavior | Note |
|---|---|---|
| `useMeetings.ts:98` | Key-AGNOSTIC existence check: any (dad, kid) grant row unlocks parent_child/mentor meeting creation | Loose — every profile-applied dad passes. Optional tightening to a meetings key = founder choice (not in current scope docs) |
| `src/lib/ai/context-assembly.ts:606` | Non-mom context = own-only (grant-blind, safe) | PRD-19 Phase 20 wires grants in. Seed-fact correction recorded |
| TeenTransparencyPanel.tsx:228 | Reads grants for display | Unmounted (see D) |

---

## Phase 2 build scope (pending founder approval of the table + decisions)

1. **Dad finance access** — per dad-finance doc §Scope 1-5 (profile seed, RLS migration, guards, pickers, attribution, CLAUDE.md Prize Board convention amendment).
2. **Management surfaces grantable** — Studio / Prize Board / RewardRules: GrantedRoute (or MomOnlyRoute extension) + sidebar layering; default invisible.
3. **Per-member sidebar layer** — `useResolvedFeatureAccess(memberId)`; getSidebarSections consumes; BottomNav parity verified at 375px.
4. **Approved Wire rows** — archives_browse scoping; (per decisions) Higgins picker, TeenTransparencyPanel mount.
5. **Hub cleanup** — remove approved Remove/Defer keys + dead global toggles so the Hub never offers a dead control.
6. **Playwright** — extend `tests/e2e/permissions/role-scoping-leak-pass.spec.ts` pattern: every wired grant gets granted-vs-ungranted browser proof; leak-pass suite stays green.

## NOT in scope (re-affirmed)

- Editing/deleting ledger rows (append-only, Convention #223)
- Special Adult finance access; Special Adult shift logic changes (classify-only)
- `child_can_see_finances` changes
- Tasks/Lists RLS hardening (Convention #39 migration point)
- Family Overview Command Center restructure
- Inventing surfaces to justify keys (defer instead)

## Mom-UI Verification

Browser evidence = Playwright runs 2026-06-09 (12/12 `permissions-wiring.spec.ts` + 10/10 `role-scoping-leak-pass.spec.ts` regression), Chromium 1280px + 375px viewports with failure screenshots reviewed. Founder eyes-on rows pending (granted-dad flows need Jerrod-style device verification, same basis as the leak pass).

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Permission Hub (dead card gone, finance row, inactive marks, Family Management) | ✅ browser test 9 | pending founder | pending founder | Mom | Playwright test 9 + screenshot review | 2026-06-09 |
| /finances/history as granted dad (scoped pills + rows) | ✅ browser test 2 | pending founder | pending founder | Adult | Playwright test 2 | 2026-06-09 |
| Prize Board as granted dad (view hides Allowance tab; manage shows it) | ✅ browser test 3 | pending founder | pending founder | Adult | Playwright test 3 | 2026-06-09 |
| Mark Paid by granted dad (attribution + mom notification) | code-wired; eyes-on pending | pending founder | pending founder | Adult | RLS verified in prod; not click-tested | 2026-06-09 |
| Studio in granted dad's sidebar + route | ✅ browser test 4 | — | ✅ 375px More menu test 11a | Adult | Playwright tests 4 + 11a | 2026-06-09 |
| Ungranted dad regression (invisible + Parent-only card on all 4 routes) | ✅ browser test 1 | — | — | Adult | Playwright test 1 | 2026-06-09 |
| View-only completion gate (toast) + approvals "View only" | ✅ browser tests 6+7 (screenshot reviewed) | — | — | Adult | Playwright tests 6/7 | 2026-06-09 |
| Archives scoping (granted vs not + detail bounce) | ✅ browser test 8 | — | — | Adult | Playwright test 8 | 2026-06-09 |
| Teen What's Shared panel in Settings | ✅ browser test 10 | pending founder | pending founder | Independent | Playwright test 10 | 2026-06-09 |
| Mom regression (/studio, Prize Board Allowance tab, /finances/history) | ✅ tests 11 + leak-pass 10 | — | — | Mom | Playwright | 2026-06-09 |

## Post-Build Verification (Checkpoint 5, 2026-06-09)

| Requirement | Source | Status | Notes |
|---|---|---|---|
| `member_permissions.target_member_id` nullable + family-wide partial unique index | Decision 1 | **Wired** | Migration 100260, applied + DB-verified (`target_nullable=YES`, `uq_mp_family_wide` present) |
| `financial_tracking` profile rows = explicit-grant-only | dad-finance doc §1 | **Wired** | 3 rows, feature_enabled=false; profile apply never auto-grants |
| `apply_permission_profile` preserves explicit grants + stops per-kid `settings_basic` | gate hygiene | **Wired** | Replaced in 100260; finance/studio/reward_rules excluded from DELETE + INSERT |
| `safe_harbor` purged from profile seeds | gate hygiene (PRD-20 backburner) | **Wired** | DB-verified 0 rows |
| RLS granted finance read (`ft_scoped_read`, `loans_scoped_read`) | dad-finance doc §2 | **Wired** | pg_policies verified; browser test 2 proves scoping (granted kid visible, ungranted absent) |
| RLS granted payment insert (`ft_parent_insert` contribute+) | dad-finance doc §2 | **Wired** | pg_policies verified; append-only preserved (no UPDATE/DELETE policies added) |
| RLS `ap_granted_manage_update` (Allowance period ops, manage only) | Decision 2 | **Wired** | pg_policies verified |
| `studio` + `reward_rules` feature keys + dad_adults tier rows | dad-finance doc | **Wired** | DB-verified (2 registry rows) |
| `keyWiringStatus` single-source registry | Decision 7 ruling | **Wired** | Consumed by Hub grid, self-restriction card, AND teen panel |
| `useViewableMembers.viewableLevels` | Decision 9 | **Wired** | Tests 6/7 prove view≠contribute |
| `useResolvedFeatureAccess` + sidebar-key alias map | sidebar doc Worker 1 | **Wired** | No-row = role default; explicit toggle wins; beta tier bypass |
| `GrantedRoute` (studio / reward_rules / financial_tracking) | dad-finance doc §3 | **Wired** | Tests 1/2/4/5/11 |
| Routes moved MomOnlyRoute → GrantedRoute (4 routes) | dad-finance doc §3 | **Wired** | /studio, /prize-board, /contracts, /finances/history |
| Hub: Family-Wide Rules card REMOVED | Decision 8 | **Wired** | Test 9 asserts absence |
| Hub: per-kid rows removed (calendar, routines, lila_modal_access, vault_browse, messaging, requests, higgins) | gate-approved removals | **Wired** | Test 9 asserts Higgins absence |
| Hub: growth rows kept, marked inactive | Decision 4 | **Wired** | Test 9 asserts the inactive note |
| Hub: Finances & Allowance row with level hint | dad-finance doc §1 | **Wired** | Test 9 |
| Hub: Family Management section (family-wide Studio/RewardRules pickers, None/View/Manage) | founder ruling | **Wired** | Test 9; writes NULL-target rows |
| Hub: SA per-kid grid HIDDEN (Shift Log + Emergency Lock kept) | Decision 6 | **Wired** | Assigned-kid chips + future-update note replace the dead grid |
| Hub: DadPersonalFeatures no-row = ON (role default) | finding 9 fix | **Wired** | Matches useResolvedFeatureAccess resolution; first tap writes OFF |
| Mom self-restriction rows marked inactive (enforcement deferred) | single-source ruling | **Wired (display)** / enforcement **Stubbed** | STUB_REGISTRY entry; saved rows preserved |
| TeenTransparencyPanel mounted in teen Settings | Decision 7 | **Wired** | Test 10; reports EFFECTIVE visibility (pending restrictions marked, dad column false for inactive keys, calendar family-shared ✓) |
| Payment attribution (description suffix + metadata actor) | Decision 3 | **Wired** | Code path; founder eyes-on for the visible ledger line pending |
| Quiet mom notification on dad payment | Decision 3 | **Wired** | Fire-and-forget; never blocks the payment |
| TransactionHistory kid pills scoped + deep-link sanitized | dad-finance doc §3 | **Wired** | Test 2 |
| PrizeBoard: Allowance tab manage-only; Prizes/Balance scoped; Pay gated contribute+ | Decision 2 | **Wired** | Test 3 (view hides tab, manage shows) |
| Sidebar layer: mom toggles drive adult/independent sidebars | sidebar doc | **Wired** | Behavior note: dads with an applied Balanced profile now lose Journal/InnerWorkings from nav (= mom's configured profile, PRD-31-correct); mom can re-enable per-member in the Hub |
| Granted management entries in dad's sidebar | founder ruling | **Wired** | Tests 4 + 11a |
| BottomNav More-menu parity (Convention #16) | Convention #16 | **Wired** | Test 11a at 375px |
| ViewAsModal allowedPaths mirrors toggles + grants | regression guard | **Wired** | Code-verified; prevents sidebar-renders-but-bounces inside View-As |
| Tasks: view-only completion gate (toast + no write) | Decision 9 | **Wired** | Test 6 (incl. DB assert task stays pending) |
| Tasks: approvals "View only" (no approve/reject at view) | Decision 9 | **Wired** | Test 7 + screenshot |
| Lists: view-only item-check gate | Decision 9 | **Wired** | `canCheckItems` in handleToggle; not E2E-clicked (code-verified) |
| Archives member cards + detail-URL scoping via archives_browse | audit table row | **Wired** | Test 8 (grant appears, ungranted detail bounces) |
| AdultShell RoutingToastProvider | found by test 6 | **Wired** | Pre-existing gap: ALL adult-shell routing toasts were silent noops |
| CLAUDE.md Prize Board convention amendment | dad-finance doc §5 | **Wired** | Convention #274 added this close-out (founder sign-off = this verification review) |
| Playwright proof per wired grant + leak-pass regression | dispatch | **Wired** | 12/12 new + 10/10 regression |
| `tsc -b` clean / lint 0 errors / schema:dump regenerated | Conventions #121/#244 | **Wired** | All green 2026-06-09 |

**Zero Missing.** Stubbed (founder-acknowledged): mom self-restriction ENFORCEMENT; Special Adult Experience (dedicated follow-up build filed); IndependentShell still lacks RoutingToastProvider (teens are never cross-member actors, so no gate fires there — noted, not load-bearing).

## Follow-on (founder-requested post-close, 2026-06-09): FAMILY-WIDE finance grant

| Requirement | Status | Notes |
|---|---|---|
| Migration 100261: `util.finance_grant_level(kid)` helper + 4 policies recreated on it | **Wired** | Applied to production. Per-kid row wins (both directions, incl. 'none' carve-out); family-wide covers role='member' kids only |
| `useViewableMembers` family-wide expansion (generic NULL-target handling, per-kid override) | **Wired** | Mirrors the SQL resolution exactly |
| `useManagementGrants.financeFamilyLevel` (+ feeds financeMaxLevel → GrantedRoute/sidebar) | **Wired** | |
| Hub: "Finances & Prize Board — whole family" picker in Family Management | **Wired** | 4-level picker; explains future-kids coverage + per-kid override |
| Hub: per-kid finance row shows "Following the whole-family setting (Level)" when inheriting | **Wired** | Shared query cache key with FamilyManagementGrants |
| E2E test 2b: family-wide covers Jordan AND Alex; per-kid 'none' carves Jordan out | **Wired** | Suite 13/13 (1 known auth-helper flake passed on retry) |
