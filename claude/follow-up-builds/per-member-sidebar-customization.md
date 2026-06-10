# Per-Member Sidebar Customization

**Status:** ✅ SHIPPED 2026-06-09 — folded into PERMISSIONS-WIRING (Convention #274). `useResolvedFeatureAccess` + `getSidebarSections(shell, options)`; Sidebar/BottomNav/ViewAsModal share identical options. Open Qs resolved: sync = render-time; profile apply stays a full reset (PRD-31); beta keeps per-member toggles active (tier layer only bypassed); no-row = role default (Hub display fixed to match).
**Filed:** 2026-05-28
**Filed from:** View As Identity-Scope Architecture build (Worker 2 Checkpoint 2 review — section-level filter gap)
**Estimated workers:** 2-3
**Estimated calendar time on branch:** 2-3 days
**Live-app downtime:** zero (feature branch strategy)

---

## What this build is for

Wire mom's per-member permission customizations through to the sidebar. Today, after the View As Identity-Scope Architecture build's sidebar rewrite, the sidebar reads from the STATIC role-default profile (`permission_level_profiles` for `adult` / `independent`) and ignores the per-member overrides mom may have set in `member_feature_toggles`. The data model supports per-member customization; the UI doesn't reflect it yet. This build closes that gap.

---

## Why we're doing it

The founder vision for permissions, stated repeatedly:

> "Mom would determine what pages/features are accessible to her kids/family, and when someone clicks view as, or signs in from the hub, it is essentially the same as signing into their own experience."

The current state has three layers, only two of which are functioning:

**Layer 1 — Data model: COMPLETE**
- `member_feature_toggles` — sparse table, rows exist only when a feature is disabled for a specific member
- `permission_level_profiles` — 164 rows, role/level templates (Minimum / Balanced / Maximum) for `additional_adult` and `independent`
- `permission_presets` — 6 family-level preset configurations
- `member_permissions` — per-pair, per-feature grants (168 rows in production)

**Layer 2 — Mom-facing UI to configure: PARTIAL (state unknown)**
- PRD-02 specifies a Permission Hub at `/permissions` (mom-only) where mom configures per-member access
- The route exists in the codebase
- UI completeness against PRD-02 spec has not been audited as part of this filing
- Likely state: framework wired, screens may need polish or completion

**Layer 3 — Sidebar consumes per-member state: GAP (introduced by View As build)**
- The OLD sidebar (pre-Worker 2 of View As build) used `useCanAccess(featureKey)` at each nav item, which DOES check `member_feature_toggles` for disabled features
- Worker 2's rewrite filters at the SECTION level using the static role profile — Adult shell drops items per the Balanced profile, Independent shell drops items per the Balanced Teen profile
- This means: even if mom enables a normally-Balanced-disabled feature for a specific teen via the Permission Hub, the entire section may still be missing from the sidebar
- The gap goes one direction. Disabling a feature mom hasn't explicitly turned off still works (the role default hides it). But ENABLING a feature beyond the role default doesn't flow through to the sidebar.

This build wires Layer 3 to Layer 1 (and validates Layer 2 along the way).

---

## Strategy — feature branch, three workers

Feature branch (`per-member-sidebar-customization`). Main stays deployable throughout.

### Worker 1 — Per-member access resolution hook

- New hook: `src/hooks/useResolvedFeatureAccess.ts`
- Inputs: effective member ID
- Returns: a map of `featureKey → { enabled, source }` where `source` is one of `'role_default' | 'member_toggle' | 'tier_lock'`
- Resolution order, per Convention #11:
  1. Tier threshold check (`feature_access_v2`) — returns `{ enabled: false, source: 'tier_lock' }` if the family's tier doesn't include it
  2. Member toggle check (`member_feature_toggles`) — if a row exists for this member + feature, that override wins
  3. Role default (`permission_level_profiles`) — fallback to the static profile
- React Query cached per (familyId, memberId), invalidated when `member_feature_toggles` changes
- Convention #10 during beta: tier_lock returns `enabled: true` regardless, role default still respected unless overridden

### Worker 2 — Wire `getSidebarSections()` into the resolved access map

- `getSidebarSections(shell, options?: { resolvedAccess?: Map<string, boolean> })` — add new option
- Section filtering logic:
  - For each item, check `resolvedAccess[item.featureKey]`. If `false`, omit.
  - For each section, if all items are omitted, omit the whole section. (Today's "drop the whole AI & Tools section" still works because every item in it resolves to disabled.)
- `Sidebar.tsx` and `BottomNav.tsx` both consume `useResolvedFeatureAccess(effectiveMember.id)` and pass the map through
- Convention #16 parity preserved automatically — both navs flow from the same options

### Worker 3 — Permission Hub UI audit + Mom-UI verification

- Audit `/permissions` page against PRD-02 spec
- Identify gaps in the Permission Hub UI:
  - Per-member toggle list rendered for each feature category?
  - Save flow writes correctly to `member_feature_toggles`?
  - Real-time sync — does Permission Hub change reach the affected member's sidebar without a full page refresh?
  - Founding override and inheritance behavior matches PRD-02
- Either fix gaps in this build OR file as a follow-up Permission Hub Completion build (founder call at dispatch)
- Mom-UI verification: toggle a feature on/off in the Permission Hub, verify the affected member's sidebar updates correctly in View As mode. Test for both adult and independent roles.

---

## Blockers / prerequisites

- **View As Identity-Scope Architecture build must close first.** This build builds on `useEffectiveMember()`, `useEffectiveShell()`, and Worker 2's `getSidebarSections(shell, options?)` signature.
- **Permission Hub state must be assessed BEFORE Worker 3 starts.** If `/permissions` is significantly incomplete vs PRD-02, Worker 3's scope may need to fork — a Permission Hub Completion sub-build may need to land first.
- **No conflict with Per-Member Sidebar Customization existing during beta.** Convention #10 says beta unlocks tier gates but does NOT say beta ignores `member_feature_toggles`. Per-member disables still take effect during beta. This build does not change that.

---

## What NOT to do

- **Re-derive the static role profile in `getSidebarSections()`.** The resolved-access hook is the single source of truth. Don't bring back the inline filtering against `permission_level_profiles` constants — that's the whole gap this build closes.
- **Skip the tier-lock case.** Items above a member's tier (post-beta) should still appear in the sidebar with a lock icon, not be omitted entirely. This matches the existing `tierLocked` rendering in `SidebarNavItem`. Don't conflate "feature disabled by mom" with "feature locked by tier."
- **Block on a complete Permission Hub UI.** If Worker 3 finds the Hub is significantly incomplete, decide whether to fork the work or proceed with sidebar wiring and file Hub completion separately. Don't let "the configuration UI isn't perfect" block "the sidebar respects what mom has configured today."
- **Touch the View As architecture's `useEffectiveMember()` or `useEffectiveShell()`.** Those are upstream contracts. This build consumes them; it does not modify them.

---

## Open questions for the founder at dispatch time

1. **Permission Hub completeness scope.** If Worker 3 finds the Hub UI is far from PRD-02 spec, do gaps get fixed in this build, or filed as a separate Permission Hub Completion build candidate? Recommendation: file separately if the gap is substantial; tackle minor polish in this build.
2. **Real-time sync expectation.** When mom toggles a feature in the Permission Hub, should the affected member's sidebar update LIVE if they're using the app right now (via Supabase Realtime), or only on next render/page navigation? Live is more delightful, render-time is simpler.
3. **Inheritance from family-level presets.** PRD-02 mentions `permission_presets` as family-level templates. Does applying a preset to a member overwrite their existing `member_feature_toggles` rows, merge with them, or coexist? Decision affects Worker 1's resolution order.
4. **Beta behavior confirmation.** Per Convention #10, `useCanAccess()` returns true for everything during beta. Confirm: during beta, `member_feature_toggles` overrides STILL apply (mom can still disable features per-member), only the tier-lock layer is bypassed. This is my reading but worth confirming.
5. **Founding-family override interaction.** Founding families bypass tier restrictions. Do they ALSO bypass `member_feature_toggles`, or do per-member disables still apply to founding families? Recommendation: per-member disables apply universally (mom's choice is mom's choice regardless of founding status), but worth confirming.

---

## Related

- **Convention #10** — Beta returns true for `useCanAccess()`; tier infrastructure stays in place
- **Convention #11** — `member_feature_toggles` is sparse (rows only when disabled); three-layer permission check (tier + toggle + founding override)
- **Convention #16** — BottomNav More menu mirrors Sidebar via `getSidebarSections()` — preserved by this build
- **Convention #38-41** — PRD-02 Permissions UI (Permission Hub, PIN lockout, View As, Special Adult shifts)
- **PRD-02 Permissions and Access Control** — Permission Hub spec, member configuration UI
- **PRD-31 Subscription Tiers** — `feature_access_v2`, `feature_key_registry`, `member_feature_toggles`, tier thresholds
- **View As Identity-Scope Architecture build** — Worker 2's `getSidebarSections(shell, options?)` signature is the integration point for this build
