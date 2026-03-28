# PRD-21A Cross-PRD Impact Addendum
## AI Vault: Browse & Content Delivery — Impact on Existing PRDs

**Created:** March 14, 2026
**Parent PRD:** PRD-21A (AI Vault — Browse & Content Delivery)

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- AI Vault added as a sidebar navigation item for Mom and (permission-gated) Dad/Adult shells.
- Personal Prompt Library added as a sub-navigation item under the AI Vault section.
- AI Vault page route needs to be defined in the routing configuration.
- Independent (Teen) shell shows a filtered Vault experience — only `teen_visible = true` items.
- Guided and Play shells do not show Vault in sidebar.

**Action needed:**
- Add AI Vault to sidebar route list with appropriate shell visibility rules.
- Add Personal Prompt Library as a sub-route under the Vault section.
- Note teen-filtered browse as a Vault-specific routing behavior (not a separate route — same page, filtered data).

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- The Vault is now a launch surface for guided modes. AI tools with `delivery_method = 'native'` launch conversation modals using the guided mode registry. This extends the existing pattern from PRD-21 (relationship tools launching from QuickTasks/Toolbox) to a new entry point.
- "Optimize with LiLa" on Vault items uses the existing `optimizer` guided mode (PRD-05C) but with additional context: `vault_item_id`, item metadata, specific prompt text, and the admin's `lila_optimization_prompt`.
- LiLa proactive Vault suggestions defined as a stub: LiLa can mention relevant Vault content during general chat conversations.
- `vault_item_id` added as an optional context metadata field on LiLa conversations when launched from the Vault.

**Action needed:**
- Note Vault as an additional launch surface for guided modes alongside QuickTasks, Toolbox, and feature-specific entry points.
- Add `vault_item_id` to the optional metadata fields on `lila_conversations` for Vault-originated conversations.
- Note LiLa proactive suggestion as a post-MVP enhancement pattern in the general chat system prompt.

---

## Impact on PRD-13 (Archives & Context)

**What changed:**
- **New fields needed on member Archive settings:** `physical_description` (TEXT) for a text description of the member's physical appearance, and `reference_photos` (TEXT[] — array of image URLs, 2-4 photos) for actual photos of the member. These are used by "Optimize with LiLa" on image/video prompts to personalize content with accurate physical descriptions.
- The `physical_description` can be mom-written or LiLa-generated from uploaded photos.
- This data is loaded as high-priority context when "Optimize with LiLa" fires on image/video prompt packs with a person selected via the pill selector.

**Action needed:**
- Add `physical_description` TEXT field to `archive_member_settings` table.
- Add `reference_photos` TEXT[] field to `archive_member_settings` table.
- Note "AI Vault image prompt personalization" as a consumer of these fields in PRD-13's Outgoing Flows.
- Consider whether `physical_description` should be editable by the member themselves (teen self-description) or mom-only. Recommend: mom-authored for younger children, member-editable for teens with mom visibility.

---

## Impact on PRD-21 (Communication & Relationship Tools)

**What changed:**
- The AI Vault browsing and "+Add to AI Toolbox" assignment stub created by PRD-21 is **fully wired** by PRD-21A.
- The data model for Vault-to-Toolbox assignment: `lila_tool_permissions` records created with `source = 'vault'` and `vault_item_id` referencing the specific Vault item. This extends the existing `lila_tool_permissions` table which already stores `source = 'default'` for the 8 PRD-21 starter tools.
- The AI Toolbox sidebar section now shows tools from two sources: default relationship tools (PRD-21) and Vault-assigned tools (PRD-21A). The sidebar queries `lila_tool_permissions` for both.
- Vault-assigned native tools launch in conversation modals using the same infrastructure as relationship tools — same conversation engine, same container pattern, same action chips framework.

**Action needed:**
- Mark the "AI Vault tool browsing and '+Add to AI Toolbox' assignment pattern" stub as **fully wired**.
- Add `source` TEXT column to `lila_tool_permissions` if not already present (CHECK: 'default', 'vault').
- Add `vault_item_id` UUID column to `lila_tool_permissions` (nullable, FK → vault_items) for tracking which Vault item the assignment came from.
- Note that the Toolbox sidebar section now queries for both `source = 'default'` and `source = 'vault'` permissions.

---

## Impact on PRD-10 (Widgets, Trackers & Dashboard Layout)

**What changed:**
- "Recommended for You" widget stub created. This is an info widget type that displays 3 AI Vault items on the personal dashboard, selected based on the user's subscription tier, engagement history, and progress. The widget links to the Vault for each item.

**Action needed:**
- Register `vault_recommendations` as a widget type in the widget template catalog.
- Note that this widget reads from `vault_items` (filtered by tier) and `vault_user_progress` (to avoid recommending completed items).
- Widget renders as a compact row of 3 small cards with thumbnails and hook titles. Tapping a card navigates to the Vault item detail view.

---

## Impact on PRD-14 (Personal Dashboard)

**What changed:**
- The "Recommended for You" widget can appear in the personal dashboard widget grid as an optional info widget. Mom can add/remove it from her dashboard layout.
- Mom's dashboard can also show a "Family Learning" indicator — aggregate progress across family members on Vault content. This is a future enhancement, not MVP.

**Action needed:**
- Note `vault_recommendations` widget as an available widget type for dashboard configuration.
- No structural changes to dashboard layout needed — the widget fits within the existing widget grid system.

---

## Impact on PRD-05C (LiLa Optimizer)

**What changed:**
- The Optimizer mode now has an additional invocation pattern: launched from Vault items with `enable_lila_optimization = true`. When invoked this way, the optimizer receives additional context:
  - The Vault item's `lila_optimization_prompt` (admin-authored personalization instructions)
  - The specific prompt text being optimized (if from a prompt entry)
  - The parent pack's metadata (format, category, tags)
- For image/video prompt optimization specifically, the person's `physical_description` from Archives is loaded as high-priority context.

**Action needed:**
- Note Vault-originated optimization as an invocation pattern alongside direct Optimizer launch.
- Note that `lila_optimization_prompt` from the Vault item is injected as additional system prompt guidance during optimization.
- Note `physical_description` as a high-priority context source for image/video prompt optimization.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-21A completed. 12 new tables defined: `vault_items`, `vault_categories`, `vault_prompt_entries`, `vault_collection_items`, `vault_user_bookmarks`, `vault_user_progress`, `vault_user_visits`, `vault_first_sightings`, `vault_tool_sessions`, `vault_copy_events`, `user_saved_prompts`, `vault_content_requests`.
- Content type taxonomy locked: tutorial, ai_tool, prompt_pack, tool_collection, workflow.
- Prompt pack parent-child model established (vault_items → vault_prompt_entries).
- AI Vault ↔ AI Toolbox integration fully defined.
- Content protection conventions established (no text selection, copy logging, rate limiting, on-demand loading, signed image URLs).
- Two-layer title/description convention established (hook vs. detail).
- Learning ladder convention established (fun_creative, practical, creator).
- V1's `library_items` and related tables superseded by `vault_items` and new schema.

**Action needed:**
- Move PRD-21A to Section 2 (completed) with key DB tables listed.
- Add content type taxonomy, prompt pack model, and content protection to conventions.
- Note V1 library_ tables as superseded in name change log or conventions.
- Note `physical_description` and `reference_photos` as a PRD-13 addition pending next edit.

---

*End of PRD-21A Cross-PRD Impact Addendum*
