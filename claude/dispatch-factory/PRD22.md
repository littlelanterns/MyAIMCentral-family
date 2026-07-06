# Pre-Dispatch Pack — PRD22: Settings

> **Factory status:** synthesized → decisions-pending (6 decisions, batch 2)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD22. Priority: P2.
> Evidence: `claude/dispatch-factory/PRD22-RECON.md` (full brief with file:line citations).
> Headline: the app grew ~8 scattered settings surfaces since the PRD was written; the PRD's
> architecture (one overlay) is superseded by reality, but its USER VALUE is largely unbuilt —
> no way to change a password, manage emails, delete an account, set LiLa preferences, export
> all data, or manage Out-of-Nest people after onboarding. Plus one real regression: the Play
> shell has a live, ungated Settings gear the PRD says must not exist.

## Reconciliation rulings (newer wins — named explicitly)

1. **Route-based `/settings` is the PERMANENT architecture; the PRD's overlay requirement is
   retired.** Reality: 5 shells link the route, PRD-24/26/28 established the `/settings/*`
   namespace, `SettingsProvider` navigates. Converting to an overlay is churn with zero mom value.
   PRD amended at build close; Convention #53 (gear-only, no sidebar) still fully honored.
   (D-PRD22-1)
2. **Consolidation shape = hub-and-spoke, not rebuild.** `SettingsPage` becomes the PRD's
   10-category, role-gated INDEX; existing surfaces (ThemeSelector, CalendarSettingsModal,
   NotificationPreferencesPanel, Permission Hub, FamilyMembers, the PRD-24/26/28 pages) are linked
   or lightly embedded — never duplicated. The PRD's role-visibility matrix (L671-678) governs
   which categories each role sees. (D-PRD22-2)
3. **`account_deletions` drifted schema is adopted as canonical** (built in migration 100027);
   PRD amended; missing lifecycle columns (`cancelled_at`, `hard_deleted_at`) added ADDITIVELY.
   The commented-out cron and the "hard deletion is future" placeholder stay OFF in this build's
   default posture — actual hard-delete machinery is co-designed with PRD-40's deletion cascade
   (one cascade engine, two consumers: COPPA revocation + account deletion). (D-PRD22-3 +
   cross-pack edge to PRD40 Slice 4)
4. **Dad's read-only "My Permissions": build the scoped view.** Convention #39's MomOnlyRoute
   stays on the Hub; dad gets a separate read-only surface (his grants + what's inactive, honest
   per keyWiringStatus #274). The PRD requirement stands; the implementation respects the newer
   routing architecture. (D-PRD22-4)
5. **Play gear = real regression, remove it.** PRD says Play gets NO gear; today it navigates
   straight into /settings with no gate. Remove from PlayShell (mom manages everything for Play
   kids). Guided keeps a gear ONLY when mom grants the appearance permission (Screen 12 gate,
   built as specified). (D-PRD22-5)
6. **Data export: build the full-platform ZIP.** The Archives Markdown export stays (different
   job: LiLa-context portability); Screen 11's ZIP-of-JSON is the "my data" right and pairs with
   PRD-40's per-child export — ONE export engine, two consumers (whole-family vs per-child).
   Whichever build dispatches first creates `_shared` export infrastructure; the other extends.
   (D-PRD22-6 + cross-pack edge to PRD40)
7. **STUB_REGISTRY corrections at close-out:** L78 tablet-hub-timeout "✅ Wired by PRD-22" is
   false (columns exist, zero consumers) — either wire the hub-timeout dropdown in Family
   Management (small, in scope Slice 4) or flip the row honest.
8. **MessagingSettings orphan** (zero call sites) is wired in this build's IA slice — mounted from
   the Messages surface + linked from the Settings index (mom-only), per PRD-15's own spec.
9. **View-As invariant** (Settings always shows the VIEWER's own settings, never the viewed
   member's — PRD L881-882): unverified today; becomes an explicit E2E pin in this build.

## Slice plan (model routing per `.claude/rules/model-routing.md`)

| Slice | Scope | Routing |
|---|---|---|
| 1 | **Account Settings (Screen 2)** — the biggest real gap: display-name/avatar editing, Change Password, `member_emails` CRUD + verification + `ensure_single_primary_email` trigger + login resolution consulting member_emails, Delete-My-Account flows (mom family soft-delete + non-mom self-remove) on the adopted `account_deletions` schema (UI + rows; hard-delete stays with PRD-40's cascade engine) | Sonnet xhigh |
| 2 | **Settings IA** — 10-category role-gated index per the matrix; mount the orphaned MessagingSettings; Notifications entry (second entry point to the existing panel); Calendar entry; Appearance unification (ThemeSelector reachable from the index; mom's manage-kids-appearance section); faith-frameworks link; `analytics_opt_in` toggle (wire the dead column); dad read-only My Permissions view; **Play gear removal + Guided Screen 12 permission gate**; retire Lantern's Path or re-home it (founder call at eyes-on) | Sonnet xhigh |
| 3 | **LiLa Preferences (Screen 7)** — tone/response-length/retention UI writing `lila_member_preferences`; Edge Function consumption (prompt metadata in lila-chat + context-assembler); retention auto-archive cron (Convention #246); Clear-All with typed confirm; mom defaults-for-kids; Context Sources link | Sonnet xhigh |
| 4 | **Family Management completion (Screens 3/3A/3B)** — inline family name/login edit (respecting the two-door surfaces #273 as the auth source of truth), member detail additions (dashboard_enabled + out_of_nest toggles, Remove-from-Family 30-day flow), OoN ongoing CRUD (add/edit/remove, per-space conversation toggles, resend invite; email-only MVP), hub-timeout dropdown wired to the real column (or honest stub per ruling 7) | Sonnet xhigh |
| 5 | **Data Export (Screen 11)** — `data_exports` table + async ZIP-of-JSON-by-feature engine (excludes raw LiLa logs per PRD), progress UI, 24h signed URL, `last_data_export_at`; engine designed for PRD-40's per-child consumer | Sonnet xhigh |
| 6 | E2E (`tests/e2e/features/settings.spec.ts`: password change, email lifecycle, role-gated index per all 5 shells, Play-no-gear + Guided-gate pins, View-As invariant pin, export contents, delete-account grace) + verification + LiLa knowledge (fix the phantom "Settings > Account" help path) | Sonnet xhigh |
| Gates | Pre-build freshness audit + Checkpoint 5 | **Fable if available, else Opus** |

Screen 10 (Subscription & Billing) stays a stub card until PRD-31 — add the founding-status
placeholder card only (5-line component), full screen lands with PRD31 Slice 5.

## Open founder decisions (D-PRD22-1..6 — batch 2)

| # | Decision | Recommendation |
|---|---|---|
| D-PRD22-1 | Retire the overlay requirement; route-based /settings is permanent | Yes — reality won; overlay conversion is churn |
| D-PRD22-2 | Hub-and-spoke consolidation (index links/embeds existing surfaces; no rebuilds) | Yes — the 8 surfaces are good; they're just unfindable |
| D-PRD22-3 | Adopt drifted account_deletions schema; hard-delete machinery co-designed with PRD-40's cascade | Yes — one cascade engine, two consumers |
| D-PRD22-4 | Build dad's scoped read-only My Permissions view (keep MomOnlyRoute on the Hub) | Yes — PRD intent preserved, newer routing respected |
| D-PRD22-5 | Remove the Play gear (regression); Guided gear gated by mom-granted appearance permission | Yes — matches PRD + celebration-only simplicity for littles |
| D-PRD22-6 | Build the full-platform ZIP export; keep Archives Markdown export as the separate context tool | Yes — "download my data" is a trust + legal-adjacent feature |

## Dependency edges (manifest-mirrored)

- Shares an export engine + deletion cascade with PRD40 (whichever dispatches first builds the
  shared piece; the other extends — coordinate at dispatch).
- Screen 10 completes under PRD31.
- Independent of everything else; can dispatch any time.

---

## DISPATCH PROMPT (paste into a FRESH session — after D-PRD22-1..6 resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-22 — Settings. Pre-dispatch pack:
claude/dispatch-factory/PRD22.md (9 reconciliation rulings + 6-slice plan). Evidence:
claude/dispatch-factory/PRD22-RECON.md. All pack decisions RESOLVED per recommendations unless
the founder noted otherwise at approval.

FRESHNESS PREAMBLE: pack produced 2026-07-04. Run `git log --oneline --since=2026-07-04`; re-read
CLAUDE.md conventions added since; check whether PRD-40's build landed (if yes, its export/cascade
infrastructure is your Slice 1/5 base — EXTEND, don't fork; if no, you build the shared engine and
note it in the coordination file); re-verify every file:line in the recon before editing; next
free migration number re-checked immediately before every push.

READ FIRST (in order):
1. prds/ai-vault/PRD-22-Settings.md — FULL read, every word.
2. prds/addenda/PRD-22-Cross-PRD-Impact-Addendum.md — FULL.
3. claude/dispatch-factory/PRD22.md + PRD22-RECON.md — the 9 rulings are LAW; where PRD text
   disagrees (overlay architecture, account_deletions columns), the ruling wins and you record
   the amendment in the feature-decision file.
4. Create .claude/rules/current-builds/PRD-22-settings.md (no YAML frontmatter), full pre-build
   summary per claude/PRE_BUILD_PROCESS.md, founder approval BEFORE code (Checkpoint 1).

BUILD SLICES 1→6 per the pack table. HARD RULES: hub-and-spoke — NEVER rebuild an existing
settings surface (ThemeSelector, CalendarSettingsModal, NotificationPreferencesPanel, Permission
Hub, FamilyMembers, PRD-24/26/28 pages), link or embed them; two-door auth surfaces (Convention
#273: /family-password, family-auth-admin Edge Function) are the auth source of truth — Family
Management links to them, never reimplements; PIN paths stay on hash_member_pin/verify RPCs
(Convention #17); Play gear REMOVED, Guided gear permission-gated (Screen 12); View-As invariant
(settings always the real viewer's) becomes an E2E pin; Convention #257 for any date writes;
myaim-frontend-design skill for all UI.

PROOF: tests/e2e/features/settings.spec.ts per the pack list (incl. Play-no-gear pin, Guided-gate
pin, View-As invariant pin, member_emails login-resolution probe, delete-account grace + undo,
export ZIP contents). tsc -b clean, lint clean, regression pins green (leak-pass,
permissions-wiring — you touch permission-adjacent surfaces). Ask the founder before running
shared-fixture suites. Mobile parity check per CLAUDE.md #14A for any nav-reachable page changes.
NOTHING COMMITS until proof green AND founder eyes-on clears; selective staging; founder confirms
before push. Close-out: Checkpoint 5 zero-Missing, live_schema regen, STUB_REGISTRY corrections
(tablet-hub-timeout stale row per ruling 7, L450 overlay stub resolution), help-patterns.ts fix,
CLAUDE.md convention updates, archive build file.
```
