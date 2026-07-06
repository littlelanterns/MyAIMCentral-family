# PRD-22 Settings — Recon Evidence Brief (Sonnet reader, 2026-07-04)

> Archived by the dispatch factory (condensed, all citations kept). Consumed by `PRD22.md`.
> Prior deep audit exists: `.claude/completed-builds/scope-3-8b-evidence/EVIDENCE_prd22-cross-prd-impact.md`
> (2026-04-21) — every finding re-verified still current this session except noted deltas.

## A. Scope inventory (refs → `prds/ai-vault/PRD-22-Settings.md`)

1. Settings = full-screen OVERLAY via gear icon, NO `/settings` route (L17, L54, L1024, L74-101; Addendum L54-60).
2. 10 role-gated categories (L129-144): Account, Family Management, Appearance, Notifications, Privacy & Permissions, LiLa Preferences, Calendar, Messaging, Subscription & Billing, Data Export.
3. Screen 2 Account (L154-216): display-name auto-save, avatar upload, multi-email via `member_emails` (add/remove/set-primary/verify), Change Password, Delete My Account (mom = 30-day family soft-delete, typed DELETE + password; non-mom = remove-self, personal deleted, shared preserved).
4. Screen 3 Family Management, mom only (L218-283): family name/login inline edit, member list w/ detail drill, +Add Member (PRD-01 flow), Out of Nest section + detail, Member Colors link, Tablet/Family Device (hub timeout dropdown + Manage Hub Widgets link).
5. Screen 3A Member Detail (L285-331): nicknames/DOB/avatar, dashboard_mode + auth_method dropdowns, Reset PIN, dashboard_enabled + out_of_nest toggles, invite status + regenerate, Remove-from-Family (30-day archive, typed-name confirm).
6. Screen 3B OoN Detail (L334-382): profile, notification method (email MVP, SMS visible-disabled), per-space conversation toggles, invite resend, remove.
7. Screen 4 Appearance (L386-409): embeds PRD-03 Screen 1 verbatim + mom's "Manage Appearance for Family Members" (Guided/Play).
8. Screen 5 Notifications (L412-424): embeds PRD-15 Screen 10; Mom/Dad/Independent/SA only.
9. Screen 6 Privacy & Permissions (L427-465): Permission Hub embed; `analytics_opt_in` toggle (default ON); faith-frameworks link; dad READ-ONLY "My Permissions"; teen What's-Shared.
10. Screen 7 LiLa Preferences (L468-528): tone + response-length dropdowns, history retention (forever/90/30/7) + Clear All (typed CLEAR), Context Sources link (mom), mom's LiLa-defaults-for-kids.
11. Screen 8 Calendar (L531-544): embeds PRD-14B Screen 7; mom full, dad/teen display-only.
12. Screen 9 Messaging (L548-560): embeds PRD-15 Screen 6; mom-only.
13. Screen 10 Subscription & Billing (L564-599): mom-only STUB until PRD-31 (founding status card + placeholder).
14. Screen 11 Data Export (L603-641): full-platform async ZIP of JSON by feature folder, excludes raw LiLa logs, 24h URL, last-export timestamp.
15. Screen 12 Guided Simplified (L645-665): dark mode + font size ONLY, gated by mom-granted appearance permission; gear hidden entirely otherwise.
16. Schema: `member_emails` (+ ensure_single_primary_email trigger), `lila_member_preferences`, `data_exports`, `account_deletions` (+ process_expired_deletions job); `families.analytics_opt_in`, `families.last_data_export_at`.
17. Role visibility matrix (L671-678): **Play = NONE, no gear icon at all.**
18. Settings during View As ALWAYS shows mom's own settings (L881-882, Decision 13 L1075).
19. Login resolution must consult `member_emails` (Addendum L12, L17).

## B. What exists (the settings-surface map — verdicts)

**No single Settings surface exists; ~8 scattered surfaces cover parts of the intent:**
- `/settings` IS a route (`App.tsx:173`; `SettingsProvider.tsx:31-33` navigates). Provider comment self-acknowledges: "Full Settings overlay conversion deferred to PRD-22 build." Gear icon in all 5 shell headers (MomShell:143, AdultShell:72, IndependentShell:68, GuidedShell:94, **PlayShell:66 — violates Play=NONE**; tooltip says "parent only" but NO gate — clicks straight through).
- `SettingsPage.tsx` (581 lines) renders a DIFFERENT section list than the PRD: Lantern's Path (not in PRD), Profile (display-only, no edit), Appearance (dark mode + gradient only, unconditional for ALL roles incl. Play/Guided), What's-Shared (teen, wired 2026-06-09), Family Management (thin, mom), MindSweep + Allowance + Homework + Gamification + Reward Reveals nav rows (all later builds, none PRD-22 scope), Access & Security (→ /permissions), Data & Privacy (→ /archives/export).
- **Screen 2 Account: entirely ABSENT** — no name/avatar edit, no email UI, no Change Password, no Delete Account. `help-patterns.ts:40` tells users "Settings > Account > Change Password" — a path that doesn't exist.
- `member_emails`: table exists (0 rows), **zero consumers**; trigger never created; login resolution ignores it.
- Family Management: `FamilyMembers.tsx` (817 lines) covers PIN/picture/invite/colors/dashboard_mode; MISSING dashboard_enabled toggle, out_of_nest toggle, Remove-from-Family grace flow; family name/login edit at separate `/family-login-name`.
- OoN: onboarding-only (`FamilySetup.tsx`); no ongoing CRUD; column `phone` not `phone_number`; no notification_methods JSONB; notify-out-of-nest EF = stub.
- Appearance: split across SettingsPage section + separate `ThemeSelector.tsx` (full grid/vibe/font-size via palette icon). No mom-manages-kids section. **No appearance permission gating exists at all** (0 hits in PermissionHub).
- Notifications: `NotificationPreferencesPanel.tsx` BUILT but only reachable from the bell dropdown (NotificationTray:353); no Settings entry.
- Privacy: Permission Hub at `/permissions` wrapped in `<MomOnlyRoute>` (App.tsx:137) — **dad's read-only "My Permissions" is actively fenced out**, not just missing. `analytics_opt_in`: column exists, ZERO consumers. Faith link from Settings: absent.
- LiLa Preferences: `lila_member_preferences` table exists (0 rows, col `member_id` not PRD's `family_member_id`); **zero UI, zero Edge Function consumption** (tone/length never reach prompts); no retention job; no Clear-All.
- Calendar: `CalendarSettingsModal.tsx` built, single entry (calendar toolbar only).
- Messaging: `MessagingSettings.tsx` **fully orphaned — zero JSX call sites anywhere** (worse than a Settings gap: unreachable by ANY user).
- Screen 10: absent (acceptable — PRD defers to PRD-31; not even the founding-status stub card though).
- Data Export: `SettingsPage:207-217` → `/archives/export` = `ContextExportPage.tsx` — **Archives-context Markdown export only**, NOT the full-platform ZIP; `data_exports` table absent; `last_data_export_at` unused.
- `account_deletions`: exists w/ DIFFERENT columns than PRD spec (`requested_by`/`scheduled_for`/`grace_period_days` vs `family_member_id`/`grace_period_ends_at`/`hard_deleted_at`/`cancelled_at`); `process_expired_deletions()` only flips is_active=false ("actual hard deletion... future enhancement"); **cron.schedule call commented out** (migration 100027:304-305, still true); zero UI writes rows.
- Screen 12 Guided: absent — Guided gets full SettingsPage, ungated.
- View-As invariant (18): plausible (Provider reads useFamilyMember) but UNVERIFIED — flag for build.

## C. Schema gaps

- `member_emails` ✅ exists (0 rows), matches PRD; trigger `ensure_single_primary_email` MISSING.
- `lila_member_preferences` ✅ exists (0 rows); naming drift `member_id` vs `family_member_id`.
- `data_exports` ❌ absent (live_schema DOMAIN_ORDER-missing list).
- `account_deletions` ✅ exists, columns DIVERGE from PRD spec (built ad hoc in 100027).
- `families.analytics_opt_in` ✅ exists, unused. `families.last_data_export_at` ✅ exists, unused.
- `families.tablet_hub_config`/`tablet_hub_timeout` ✅ exist, **entirely unused in src/** (STUB_REGISTRY L78's "✅ Wired by PRD-22" claim is STALE/FALSE — flagged for correction). Separate `hub_config` column is the one PRD-14D actually uses.
- `out_of_nest_members.phone` (not phone_number); no notification_methods column.

## D. Wiring touchpoints

STUB_REGISTRY: L78 tablet-hub-timeout (stale ✅ — needs correction), L132 Tool permission mgmt UI (⏳ accurate — lila_tool_permissions written by Vault "+Add to Toolbox", no manage/revoke surface), L293 OoN sibling messaging (📌 correct), L450 Settings overlay (⏳ — the umbrella stub).
Feeds PRD-22: PRD-01/02/03/04/05/14B/15 all built with the noted single-entry/orphan gaps.
Audit-Readiness addendum: zero PRD-22 mentions.

## E. Conflicts with newer conventions (named)

- Convention #273 shipped its own settings-adjacent surfaces (`/family-password`, `/family-login-name`) outside PRD-22's model — never amended into the PRD.
- Convention #274 `keyWiringStatus.ts` Permission Hub is MORE sophisticated than PRD-22 Screen 6 anticipated; the missing pieces are the PRD-22 riders (dad read-only view, analytics toggle, faith link).
- Convention #39 `<MomOnlyRoute>` on /permissions correctly implements mom-only routing but hard-blocks dad's PRD-22 read-only view — PRD wants dad IN with reduced rights, architecture keeps him OUT.
- Convention #47: ThemeSelector owns theme persistence, contradicting PRD's one-Appearance-section framing.
- Convention #53 (gear only, not sidebar): satisfied; silent on overlay-vs-route.
- PRD-24/26/28 established the `/settings/*` namespace precedent (allowance/homework/gamification/reward-reveals) with no relation to PRD-22's category list.
- PRD-13 faith preferences: built in Archives, zero Settings link (Addendum L84-89 unmet).

## F. Open questions (absorbed into pack decisions)

1. Full consolidation overlay vs index-that-links-out vs partial supersession?
2. Overlay-vs-route target still standing?
3. Screen 2 Account = priority slice?
4. account_deletions schema: reconcile to spec vs adopt drift?
5. Dad read-only permissions: new scoped view vs drop requirement?
6. MessagingSettings orphan: wire independent of PRD-22?
7. Data export: Archives-Markdown substitute permanent vs build full ZIP?
8. Guided appearance permission gate still wanted?
9. Play gear icon regression: gate, remove, or product shift?
