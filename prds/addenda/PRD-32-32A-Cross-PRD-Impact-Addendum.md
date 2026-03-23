# PRD-32 / PRD-32A Cross-PRD Impact Addendum
## Admin Console (System, Analytics & Feedback) + Demand Validation Engine — Impact on Existing PRDs

**Created:** March 21, 2026
**Parent PRDs:** PRD-32 (Admin Console — System, Analytics & Feedback), PRD-32A (Demand Validation Engine & Planned Expansion Stubs)

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- Three new `staff_permissions.permission_type` values registered: `system_admin`, `analytics_admin`, `feedback_admin`. These complete the full set of admin tab permissions alongside the existing `super_admin`, `vault_admin` (PRD-21B), and `moderation_admin` (PRD-21C).
- View As mode (Screen 5 in PRD-02) now affects `<PlannedExpansionCard>` behavior. When mom is in View As for a Guided/Play child, expansion card votes are attributed to the child's `family_member_id` with `voted_via_view_as = true` and `actual_voter_id` set to mom's ID.

**Action needed:**
- Add `system_admin`, `analytics_admin`, `feedback_admin` to `staff_permissions.permission_type` documentation or CHECK constraint.
- Note in View As documentation that the PlannedExpansionCard component consumes View As context to attribute votes correctly.

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- New admin sub-routes: `/admin/system`, `/admin/analytics`, `/admin/feedback`. These join the existing `/admin/vault` (PRD-21B) and `/admin/moderation` (PRD-21C).
- **Feedback FAB component** added to shell layouts: visible in Mom, Dad/Additional Adult, and Independent (Teen) shells. Positioned top-left on mobile. Controlled by `is_feedback_fab_active` feature flag.
- **PlannedExpansionCard component** renders in Mom, Dad, Independent shells wherever stubs exist. Hidden in Special Adult shell. Hidden in Guided/Play direct view but visible in View As mode.

**Action needed:**
- Add `/admin/system`, `/admin/analytics`, `/admin/feedback` to admin routing config.
- Add Feedback FAB to Mom, Dad, and Independent shell layout components with feature flag check.
- Add PlannedExpansionCard visibility rules to shell rendering logic.

---

## Impact on PRD-05 (LiLa Core / LiLa Help)

**What changed:**
- **LiLa Help now checks `known_issues` table** via keyword matching before falling through to AI. This is a new synchronous step in the LiLa Help response pipeline: user describes a problem → check `known_issues` keywords → if match, show customer-facing workaround text → ask "Did that help?" → if no, fall through to AI.
- **LiLa Help can create feedback submissions.** If LiLa Help can't resolve an issue, she offers to submit a glitch report on the user's behalf, pre-populated with conversation context.
- **Known issue hit tracking:** Each time LiLa Help serves a known issue response, it increments the `hit_count` on the `known_issues` record. This gives the admin visibility into how useful each documented issue is.

**Action needed:**
- Add `known_issues` keyword lookup step to LiLa Help response pipeline (before AI fallthrough).
- Add "submit a glitch report" conversational flow to LiLa Help.
- Add hit count increment call when LiLa Help serves a known issue.

---

## Impact on PRD-21B (AI Vault — Admin Content Management)

**What changed:**
- Admin Console tab registry extended with three new tabs (System, Analytics, Feedback). The tab registry now has five entries total.
- All PRD-21B stubs for System and Analytics tabs are now fully wired by PRD-32.
- Feedback tab gains a Demand Validation sub-view (PRD-32A).

**Action needed:**
- Update tab registry to five tabs.
- Mark System tab stub, Analytics tab stub, `system_admin` permission stub, and `analytics_admin` permission stub as wired by PRD-32.

---

## Impact on PRD-21C (AI Vault — Engagement & Community)

**What changed:**
- "Discussion moderation notifications to admin" stub is wired. When comments are flagged for moderation review, an in-app notification alerts users with `moderation_admin` permission.

**Action needed:**
- Mark the "Discussion moderation notifications to admin (in-app alert when flagged items need review)" stub as wired by PRD-32.

---

## Impact on PRD-22 (Settings)

**What changed:**
- **Feedback section added to Settings.** Three buttons: "Report a Glitch," "Request a Feature," "Say Something Nice." These open the same modal forms as the Feedback FAB. This is the permanent feedback entry point that remains after the beta FAB is disabled.

**Action needed:**
- Add Feedback section to Settings category navigation.
- Implement the three feedback form buttons using the same form components as the FAB.

---

## Impact on PRD-23 (BookShelf)

**What changed:**
- "Admin book ethics review UI" (Deferred #8 in PRD-23) is fully wired. The Ethics Review sub-tab in PRD-32's System tab provides the admin interface for reviewing BookShelf-extracted content flagged by the ethics gate.

**Action needed:**
- Mark Deferred #8 ("Admin book ethics review UI → PRD-32 System Admin Console") as wired by PRD-32.

---

## Impact on PRD-30 (Safety Monitoring)

**What changed:**
- "Admin keyword management UI" stub is fully wired. The Safety Config sub-tab in PRD-32's System tab provides full CRUD on the `safety_keywords` table with filtering by category and active status.
- Safety resources management is also built: full CRUD on `safety_resources` table with drag-to-reorder within categories.

**Action needed:**
- Mark "Admin keyword management UI → PRD-32 (Admin Console)" stub as wired.
- Note that safety resources are also admin-managed through PRD-32.

---

## Impact on PRD-31 (Subscription Tier System — Not Yet Written)

**What changed:**
- PRD-32 creates the `ai_usage_log` table that tracks every AI call with `family_id`, feature name, model, token counts, and estimated cost. This provides the per-family cost data foundation that PRD-31 will need for:
  - Tier-based monthly AI usage allotments
  - Per-family usage thermometer widget on the user dashboard
  - AI credit earn/purchase/rollover system
- PRD-31 should reference `ai_usage_log` as its data source for consumption tracking and define the `ai_credits` table for the credit management system.

**Action needed:**
- When writing PRD-31, reference `ai_usage_log` (PRD-32) as the consumption data source.
- Define `ai_credits` table in PRD-31 for credit balances, purchases, and rollovers.
- The thermometer widget UI should query `ai_usage_log` filtered by family_id and current billing period.

---

## Impact on Platform Intelligence Pipeline v2

**What changed:**
- The admin review workflow is fully defined in PRD-32 Screen 5 (Analytics Tab — Intelligence Review). All 12 capture channels are supported with filtering, sorting, bulk mode, and special handling for Channel E (Book Knowledge) and Channel I (Safe Harbor Structures).
- The weekly admin review UI described in the Pipeline v2 doc is now a concrete screen with defined interactions and data operations.

**Action needed:**
- Reference PRD-32 Screen 5 as the implementation spec for the review queue UI.
- Note that Channel E ethics-flagged items route to the System tab's Ethics Review sub-tab, not the Analytics tab.

---

## Impact on All PRDs with Stubbed Features (PRD-32A)

**What changed:**
- Every PRD that creates stubs for future features can now use `<PlannedExpansionCard featureKey="xxx" />` instead of blank placeholders or "Coming Soon" modals.
- A `feature_expansion_registry.ts` config file maps feature keys to display names and descriptions.
- User demand data (Yes/No votes + freeform notes) is collected passively and reviewed in the admin Feedback tab.

**Action needed:**
- During the pre-build audit, Opus should generate the initial `feature_expansion_registry.ts` by extracting every stubbed feature across all PRDs.
- When building each PRD, replace placeholder stubs with `<PlannedExpansionCard featureKey="xxx" />` where appropriate.
- When a feature is built, remove its entry from the registry (the component silently renders nothing for missing keys).

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-32 (Admin Console — System, Analytics & Feedback) completed.
- PRD-32A (Demand Validation Engine & Planned Expansion Stubs) completed.
- All admin console stubs from PRD-21B are resolved.
- All admin-deferred items from PRD-21B, PRD-23, and PRD-30 are wired.
- Strategies & Snippets blog management remains as a stub for a dedicated future PRD.

**Action needed:**
- Move PRD-32 and PRD-32A to completed list.
- Add Strategies & Snippets PRD to the remaining/future list.
- Note that `feature_expansion_registry.ts` generation is a pre-build audit task.
- Update remaining PRDs count.

---

*End of PRD-32 / PRD-32A Cross-PRD Impact Addendum*
