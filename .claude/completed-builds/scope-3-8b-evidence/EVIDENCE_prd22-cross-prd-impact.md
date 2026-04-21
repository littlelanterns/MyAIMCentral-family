---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Addendum: prds/addenda/PRD-22-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-22 (source) ↔ PRD-01 (Auth — `member_emails` login resolution + `account_deletions` cascade), PRD-02 (Permissions — Permission Hub embed), PRD-03 (Themes — Name Packs removal), PRD-04 (Shell Routing — gear icon overlay trigger), PRD-05 (LiLa — `lila_member_preferences` tone/length/retention), PRD-13 (Archives — faith preferences link), PRD-14B (Calendar Settings embed), PRD-15 (Messaging Settings + Notification Preferences + Out of Nest notifications)
Provenance: Worker `aa6b5d308c5c08af6` (Opus, report-only mode) ran the full evidence pass in-memory across the addendum (139 lines) + full PRD-22 body (1106 lines) + migration `00000000100027_prd01_repair.sql` (created `member_emails` + `account_deletions`) + migration `00000000000007_lila_ai_system.sql` (created `lila_member_preferences`) + `src/pages/SettingsPage.tsx` (481 lines) + `src/components/settings/SettingsProvider.tsx` + `supabase/functions/notify-out-of-nest/index.ts` + live_schema.md. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Walked PRD-22 Cross-PRD Impact Addendum end-to-end against code reality. **Primary architectural drift (F11 adjacent):** Settings is wired as a ROUTE `/settings` (App.tsx L153, SettingsProvider L31-33), directly contradicting the addendum's "Settings is NOT a route — no `/settings` URL exists. The overlay renders on top of the current page." Even the SettingsProvider comment at L6 says "Full Settings overlay conversion deferred to PRD-22 build." This is an acknowledged-deferred implementation pattern. **Primary data-lifecycle/compliance finding (F11 + GDPR/COPPA-adjacent):** `account_deletions` table migrated with `process_expired_deletions()` function defined (migration 100027:267) but **the pg_cron schedule is COMMENTED OUT** at migration 100027:304-305. There is no scheduled job actually running; the 30-day deletion enforcement the addendum promises is purely ceremonial. Combined with zero UI, a mom who wants to delete her account cannot self-serve, and the cascade job never fires even if someone INSERTs a row manually. Scope 2 DECISIONS.md L638 confirms founder direction: "If they contact us to remove their data/account, then we would do that with the grace period" — i.e. **manual admin workflow is the intentional process**. **Primary F11 hit (member_emails login resolution):** PRD-22 addendum L17 explicitly requires "update login resolution logic to include `member_emails` lookup." Grep `member_emails` in `src/` returns ZERO matches. Zero Edge Function matches. No login resolution code ever consults this table. **Primary LiLa preferences integration drift:** `lila_member_preferences` table exists (0 rows live) with tone/response_length/history_retention columns — but `tone\|response_length` grep across all `supabase/functions/` returns ZERO matches. No LiLa Edge Function loads these as metadata. No history-retention sweep job exists. **Primary analytics_opt_in drift:** column exists on `families` table, but `analytics_opt_in` grep in `src/` returns zero — no UI toggle, and no feature consults the flag before writing telemetry. **Primary Out of Nest drift:** column specified as `phone_number` and `notification_methods JSONB` by addendum L112+L117, but live schema shows the column is named `phone` and `notification_methods` is absent; `notify-out-of-nest` Edge Function exists but is explicitly a stub. **Strong positives:** Name Packs removal is complete (grep-clean); Permission Hub route `/permissions` exists with working PermissionHub page (linked from SettingsPage L189); faith preferences UI in Archives exists; `/archives/export` context export page works. Convention #207 member color sync is documented and enforced via `getMemberColor()` helper.

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | **Settings is a full-screen overlay, NOT a route; gear icon opens overlay rendered by root-level `<SettingsOverlay>`** | Addendum L54-60 + PRD-22 L17 + Decision 1 L1063 | `App.tsx:153` defines `<Route path="/settings">`; `SettingsProvider.tsx:31-33 openSettings() { navigate('/settings') }`; Explicit comment at `SettingsProvider.tsx:6` — "Full Settings overlay conversion deferred to PRD-22 build." | Intentional-Document (acknowledged-deferred conversion) | **SCOPE-3** Low | N |
| 2 | **`member_emails` wires login resolution: auth.users.email → member_emails.email WHERE is_verified** | Addendum L12 + L17 | Migration 100027:188-228 creates table + RLS. **Grep `member_emails` in `src/` = 0 matches; in `supabase/functions/` = 0 matches.** No login resolver code consults the table. 0 rows live. Also: `ensure_single_primary_email` trigger **NEVER CREATED** in any migration. | Unintentional-Fix-Code | **SCOPE-3** Medium | N |
| 3 | **`account_deletions` + `process_expired_deletions` scheduled job; mom deletion cascades to family; 30-day grace period** | Addendum L12-14 + PRD-22 Screen 2 L196-209 + Data Schema L771-794 | Migration 100027:234-261 creates table + RLS. Migration 100027:267-299 creates `process_expired_deletions()` function — **but only does `is_active = false` soft-deactivate, NOT hard-delete cascade**: comment at L284 "actual hard deletion of data is a future enhancement." Migration 100027:304-305 has the cron schedule call **COMMENTED OUT**: `-- SELECT cron.schedule('process-expired-deletions', '0 3 * * *', ...)`. **The job is never installed.** Zero UI path. | Intentional-Document (manual support workflow) + Unintentional-Fix-Code (commented cron + soft-deactivate vs hard-delete gap) | **SCOPE-8b** primary + **SCOPE-3** cross-ref | **Y** |
| 4 | **`lila_member_preferences` loaded as metadata in every LiLa API call; history_retention triggers auto-archive** | Addendum L67-77 + PRD-22 Screen 7 + Data Schema L727-745 + Outgoing Flows L838 | Migration 000007:157-186 creates the table. **Grep `lila_member_preferences\|tone.*response_length\|history_retention` in `supabase/functions/` = 0 matches.** No LiLa Edge Function ever loads these. No scheduled job archives conversations. The kid-defaults fallback is impossible because nothing consumes the table. 0 rows live. | Unintentional-Fix-Code | **SCOPE-3** Medium. Cross-addendum F11 contributor. | N |
| 5 | **`analytics_opt_in` BOOLEAN on `families` default true; every feature checks before collecting** | Addendum L141-145 (removed) + PRD-22 L803 + Outgoing Flows L842 | Column exists in live schema. **Grep `analytics_opt_in` in `src/` = 0 matches; in `supabase/functions/` = 0 matches.** No UI toggle in SettingsPage. No feature ever consults the flag before writing `activity_log_entries`, `ai_usage_tracking`, or Platform Intelligence Pipeline writes. No UI to flip the default-ON to OFF. | Unintentional-Fix-Code | **SCOPE-8b** primary + **SCOPE-3** cross-ref | **Y** |
| 6 | **Out of Nest members get email notifications when new messages arrive** | Addendum L112+L117-118 | **Live schema `out_of_nest_members` has column `phone`, NOT `phone_number`. `notification_methods JSONB` absent.** `notify-out-of-nest/index.ts` Edge Function exists but is a documented stub (L8: "Actual email delivery is deferred"). Grep of `messages` table INSERT triggers for OoN notification wire-up returns no auto-trigger. | Unintentional-Fix-Code + Deferred-Document | **SCOPE-3** Medium | N |
| 7 | **Permission Hub embedded within Settings overlay context** | Addendum L26-27 + L32-33 | Permission Hub at route `/permissions`; SettingsPage.tsx L185-191 links via SettingsNavRow. Navigates away rather than embeds (because Settings itself isn't an overlay per seam #1). | Cross-ref seam #1 | — | — |
| 8 | **Calendar Settings Screen embedded in Settings overlay as Screen 8** | Addendum L94-97 | `CalendarSettingsModal.tsx` exists and renders from `CalendarPage.tsx` toolbar gear icon. SettingsPage.tsx has NO Calendar Settings navigation link. Single entry point (Calendar page gear), not dual as addendum specifies. | Unintentional-Fix-Code | **SCOPE-3** Low | N |
| 9 | **Messaging Settings + Notification Preferences embedded in Settings overlay as Screens 9 + 5** | Addendum L107-109 + L114 | Messaging Settings exists, but grep of `SettingsPage.tsx` for messaging/notification nav rows returns ZERO matches. Neither is wired into Settings. Notification Preferences table has 0 rows live and no UI source code. | Unintentional-Fix-Code | **SCOPE-3** Low | N |
| 10 | **Name Packs removed from platform** | Addendum L40-47 | Grep `Name Pack\|name_pack\|namePack\|NamePack` in `src/` = 0 matches. **Clean removal.** ✓ | Documented (no finding) — strong positive | — | — |
| 11 | **Faith preferences link from Settings → Privacy & Permissions → "Manage faith frameworks"** | Addendum L84-85 | `FaithPreferencesModal.tsx` exists in Archives; SettingsPage.tsx has no "Manage faith frameworks" link. Faith preferences reachable only via Archives navigation. | Unintentional-Fix-Code | **SCOPE-3** Low | N |

## Unexpected findings list

1. **`ensure_single_primary_email` trigger NEVER created** — PRD-22 L722-724 is the only place this trigger is mentioned. Any `member_emails` INSERT with `is_primary=true` does not demote other primary emails. Latent corruption risk the moment the UI ships.

2. **`process_expired_deletions()` does not actually hard-delete** — the function body only does `is_active = false`. The 30-day grace-then-hard-delete pattern the addendum promises for GDPR compliance is a naming illusion. GDPR right-to-erasure is unenforced.

3. **Addendum never mentions the `data_exports` table at all** — PRD-22 Screen 11 and Data Schema L749-767 define the table, but live_schema.md flags it as "listed in DOMAIN_ORDER but not present."

4. **"Password change" form entirely absent** — PRD-22 Screen 2 L192-194 specifies a Change Password form. Grep returns only a TODO in FamilyMembers.tsx:428.

5. **LiLa preferences "Kid defaults" inheritance pattern is entirely ungrounded** — addendum L77 "Note kid defaults: if a kid doesn't have their own record, fall back to mom's defaults." Since ZERO LiLa Edge Functions load `lila_member_preferences` at all, the fallback has nothing to run.

## Proposed consolidation (§5.1 + §5.2 candidates)

**§5.1 within-addendum:**
- Seams #2, #4, #5 consolidate to: **"PRD-22 table extensions to PRD-01/PRD-05 ship as schema-only with zero consumers."**
- Seams #7, #8, #9, #11 consolidate to: **"PRD-22 Settings page missing 4 of 5 cross-PRD navigation entry points promised by addendum."**
- Seam #3 stands alone as primary SCOPE-8b.
- Seam #1 stands alone as acknowledged-deferred architectural drift.
- Seam #6 stands alone — intersects PRD-15.

**§5.2 cross-addendum candidates:**

**A. F11 server-side enforcement — PRD-22 contributes 2 surfaces (5th + 6th confirmed).**

| Surface | Gap |
|---|---|
| PRD-15 | Per-pair `member_messaging_permissions` checked client-side only |
| PRD-17B | `classify_by_embedding` RPC trusts caller `p_family_id` |
| PRD-18 | `match_book_extractions` RPC trusts caller `p_family_id` |
| PRD-21 | `lila_tool_permissions` never checked by 8 tool Edge Functions |
| **PRD-22 (new)** | **`member_emails` login resolution not enforced at Edge Function / auth callback layer** |
| **PRD-22 (new)** | **`lila_member_preferences` not loaded by any LiLa Edge Function** |

**Strong cross-addendum F11 consolidation (6 surfaces). ESCALATE.**

**B. Schema-only extensions not shipped — PRD-22 contributes.** PRD-19 + PRD-22 = 2 surfaces. Orchestrator watch.

**C. Settings entry-point-missing pattern — PRD-22 only.** Not a consolidation candidate.

**D. Opt-out/mom-configured accountability silently bypassed — PRD-22 contributes 2 instances:**

| Surface | Gap |
|---|---|
| PRD-14D | PIN-per-intention tally bypassable |
| PRD-19 | `is_available_for_mediation` opt-out unenforceable (column missing) |
| **PRD-22 (new)** | **`analytics_opt_in` flag default-ON but no UI toggle + no consumer checks** |
| **PRD-22 (new)** | **`history_retention` per-member LiLa setting silently ignored** |

**Pattern threshold reached at 4. Strong cross-addendum consolidation candidate. ESCALATE.**

## Proposed finding split

- **F-A: `account_deletions` pipeline is schema-ceremonial** (seam #3). **SCOPE-8b primary + SCOPE-3 cross-ref. Beta Y.**
- **F-B: `analytics_opt_in` privacy promise unenforceable** (seam #5). **SCOPE-8b primary + SCOPE-3 cross-ref. Beta Y.**
- **F-C: PRD-22 three schema extensions ship with zero consumers** (seams #2, #4 consolidated) — `member_emails`, `lila_member_preferences`, `ensure_single_primary_email` trigger. **SCOPE-3 Medium + SCOPE-8b cross-ref for F11 pattern. Beta N.**
- **F-D: Settings page missing 4 cross-PRD navigation entry points** (seams #7, #8, #9, #11 consolidated). **SCOPE-3 Low. Beta N.**
- **F-E: Settings overlay-vs-route architectural drift** (seam #1). **Intentional-Document. SCOPE-3 Low. Beta N.**
- **F-F: Out of Nest notification infrastructure drift** (seam #6). **SCOPE-3 Low. Beta N.**

## Beta Y candidates

1. **F-A (SCOPE-8b side)** — `account_deletions` grace-period promise architecturally incomplete: cron commented out + hard-delete cascade absent. GDPR right-to-erasure unenforced.

2. **F-B (SCOPE-8b side)** — `analytics_opt_in` ON-by-default with no toggle and no consumer-side check. Privacy promise written into PRD unkeepable.

## Top 3 surprises

1. **`process_expired_deletions()` is schema dance theater** — the function exists, the table exists, the grace period column exists, but the cron call is commented out AND even if the function ran it only soft-deactivates. Someone INSERTing an `account_deletions` row today would see nothing happen after 30 days. Even the manual support workflow doesn't invoke any cascade.

2. **`lila_member_preferences` is twin-architecture drift with PRD-21's `lila_tool_permissions`** — both are per-member config tables migrated into the schema, both are 0 rows in production, both have zero Edge Function consumers, both document per-member functionality that never executes. Cross-addendum F11 pattern grows from 4 surfaces to 6.

3. **Settings is a route, acknowledged as a route, documented as a route in the SettingsProvider comment — while the addendum says "Settings is NOT a route" and CLAUDE.md Convention #53 says "Settings is NOT in the sidebar. Access only via floating gear icon"** — three sources of spec all contradict the code, and the code contradicts them back with an explicit comment acknowledging the deviation.

## Watch-flag hits

- **F11 server-side enforcement — DIRECT HIT (Beta Y on F-A + F-B).** Seams #2, #3, #4, #5 all contribute. **Cross-addendum F11 pattern now at 6 surfaces — ESCALATE to consolidated Scope 8b finding.**
- **Crisis Override** — Non-hit.
- **F17 messaging** — Partial hit via seam #9 (Messaging Settings not linked) + seam #6 (OoN notification infra stub).
- **F22+F23 privacy/is_included_in_ai** — Non-hit directly. Context Settings panel not in SettingsPage at all.
- **studio_queue source discipline** — Non-hit.
- **`is_included_in_ai` three-tier propagation** — Non-hit directly.
- **HITM (Convention #4)** — Non-hit.
- **Convention #207 (member color sync)** — STRONG POSITIVE. `getMemberColor()` helper at `src/lib/memberColors.ts` + `useMemberColor` hook are the canonical consumers.
- **Convention #53 (Settings NOT in sidebar, gear icon only)** — Partial hit: gear icon exists but navigates to `/settings` route rather than opening an overlay. Cross-ref seam #1.

## Orchestrator adjudication

(empty — pending walk-through)
