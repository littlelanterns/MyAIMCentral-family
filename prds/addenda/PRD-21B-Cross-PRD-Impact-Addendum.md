# PRD-21B Cross-PRD Impact Addendum
## AI Vault: Admin Content Management — Impact on Existing PRDs

**Created:** March 14, 2026
**Parent PRD:** PRD-21B (AI Vault — Admin Content Management)

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- New `staff_permissions.permission_type` values registered: `vault_admin`, `moderation_admin` (stub for PRD-21C), `system_admin` (stub for PRD-32), `analytics_admin` (stub for PRD-32).
- The Admin Console Shell established the convention that admin access uses `staff_permissions` types, which is a separate system from `member_permissions` feature keys. Both live in PRD-02's permission architecture but serve different purposes: `staff_permissions` gates admin console tabs, `member_permissions` gates family feature access.
- Hardcoded super admin emails (`tenisewertman@gmail.com`, `aimagicformoms@gmail.com`, `3littlelanterns@gmail.com`) confirmed as the V2 admin bootstrap mechanism, same as V1.

**Action needed:**
- Add `vault_admin`, `moderation_admin`, `system_admin`, `analytics_admin` to the `staff_permissions.permission_type` documentation (or CHECK constraint if formalized).
- Note in PRD-02's Permission Architecture section that `staff_permissions` types are registered by admin-domain PRDs (21B, 21C, 32), separate from the `member_permissions` feature key registry.

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- `/admin` route defined as a **separate routing context** outside the family shell system. It does not appear in any shell's sidebar navigation. It has its own layout (tab-based navigation, not sidebar-based).
- A subtle admin link should appear in the user menu dropdown, visible only to users with any active `staff_permissions`. This link navigates to `/admin`.
- The admin console shell handles its own sub-routing: `/admin/vault`, `/admin/moderation`, `/admin/system`, `/admin/analytics`.

**Action needed:**
- Add `/admin` and its sub-routes to the routing configuration as a staff-only route group.
- Note that the admin console uses a different layout component than the family shell layouts.
- Add the conditional admin link to the user menu component (visible only when `staff_permissions` exist for the current user).

---

## Impact on PRD-21A (AI Vault — Browse & Content Delivery)

**What changed:**
- `last_published_at` TIMESTAMPTZ column added to `vault_items` table (nullable, set on each Draft → Published transition).
- **`tool_collection` content type renamed to `curation`** — the `content_type` CHECK constraint value changes from `'tool_collection'` to `'curation'`. The display name is "Curation." The underlying `vault_collection_items` join table is unchanged. This rename reflects the editorial purpose of the feature (curated bundles, like playlists) vs. the generic "tool collection" label.
- All admin-side stubs referenced in PRD-21A's Incoming Flows and forward references are now fully wired:
  - Content CRUD through admin editor
  - Category management with drag-to-reorder
  - Content request queue with structured export
  - Hero spotlight via `is_featured` toggle and `featured_sort_order`
  - NEW badge configuration per item
  - Seasonal and gift tag management
- V1 bugs explicitly fixed in V2 design:
  - Inline category creation now persists to `vault_categories`
  - Image removal now deletes from Supabase Storage
  - `requires_auth` checkbox now exists on the form
  - `required_tier` field removed; only `allowed_tiers` used
- Supabase Storage buckets defined: `vault-thumbnails`, `vault-prompt-images`

**Action needed:**
- Add `last_published_at` to the `vault_items` table schema in PRD-21A's Data Schema section.
- Update `content_type` CHECK constraint: change `'tool_collection'` to `'curation'`. Update the Content Type Taxonomy table display name from "Tool Collection" to "Curation."
- Update all references to "tool_collection" in PRD-21A text to "curation" (content type taxonomy table, detail view section, card rendering references).
- Note the Supabase Storage bucket names in the Data Schema section as infrastructure dependencies.
- Mark the admin-side stubs in PRD-21A's Incoming Flows as fully wired by PRD-21B.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- LiLa content metadata suggestion pattern defined: a single API call (not a conversation) that accepts content description + content type + existing categories/tags, and returns suggested display_title, detail_title, tags, and category_id.
- This is a new LiLa capability pattern: structured metadata generation for admin use, distinct from the user-facing conversation, optimization, and guided mode patterns.

**Action needed:**
- Note "admin content metadata suggestions" as a LiLa API use case pattern in PRD-05's capability registry. This uses the LiLa API but not the guided mode infrastructure — it's a direct API call from the admin form, not a conversation modal.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-21B completed. Admin Console Shell framework established as a shared platform component.
- No new database tables created (all tables defined in PRD-21A). One column added: `last_published_at` on `vault_items`.
- Supabase Storage conventions established: `vault-thumbnails` and `vault-prompt-images` buckets.
- V1 → V2 bug fix list documented (4 fixes: inline categories, orphaned images, requires_auth checkbox, tier field reconciliation).
- LiLa content suggestion pattern established.
- Admin permission types registered for current and future admin tabs.

**Action needed:**
- Move PRD-21B to Section 2 (completed) with key additions listed.
- Note Admin Console Shell as a shared framework in conventions.
- Add Supabase Storage bucket naming convention.
- Add V1 bug fix list as a reference for build sessions.

---

*End of PRD-21B Cross-PRD Impact Addendum*
