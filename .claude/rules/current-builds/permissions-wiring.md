# PERMISSIONS-WIRING (Permission Hub Wiring Audit + Dad Finance/Management Access + Sidebar Layer)

## Status: ACTIVE — Phase 1 audit complete; founder decisions collected 2026-06-09; awaiting final go on consolidated Phase 2 plan (no code written)

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

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Permission Hub (cleaned grid, finance row) | | | | Mom | | |
| /finances/history as granted dad | | | | Adult | | |
| Prize Board as granted dad (Mark Paid) | | | | Adult | | |
| Studio in granted dad's sidebar + route | | | | Adult | | |
| Ungranted dad regression (invisible + Parent-only card) | | | | Adult | | |
| Sidebar per-member toggle (toggle off → item gone, 375px More menu parity) | | | | Adult/Independent | | |
| Archives scoping as dad (granted vs not) | | | | Adult | | |

## Post-Build Verification

(to be filled at Checkpoint 5 — zero Missing required)
