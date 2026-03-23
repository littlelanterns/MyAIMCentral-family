# PRD-21B: AI Vault — Admin Content Management

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup — subscription tiers, user authentication), PRD-02 (Permissions & Access Control — `staff_permissions` table, admin permission types), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts — admin route not visible in any family member shell), PRD-21A (AI Vault — Browse & Content Delivery — all 12 user-facing tables, content type taxonomy, prompt pack parent-child model, content protection conventions, data schema)
**Created:** March 14, 2026
**Last Updated:** March 14, 2026

---

## Overview

The AI Vault Admin is how content gets into the Vault and how it stays healthy over time. PRD-21A defined the user-facing storefront — the Netflix-style browse, the content types, the data schema, the protection measures. This PRD defines the backstage: how Tenise (and eventually designated admins) create, edit, publish, archive, and analyze Vault content.

V1's `LibraryAdmin.jsx` was a creation-only 1090-line form with ~35 fields. It could upload new content but could never edit or delete anything already published. New categories created inline during upload weren't persisted to the categories table. Image removal cleared the URL field but left orphaned files in Supabase Storage. The `requires_auth` field existed in the schema but had no checkbox — it was always false. `required_tier` and `allowed_tiers` were both submitted simultaneously with no reconciliation. V2 fixes all of these gaps and introduces a proper content lifecycle.

This PRD also establishes the **Admin Console Shell** — a unified admin interface at `/admin` with tabbed navigation. The Vault Admin is the first tab. Future admin PRDs (PRD-21C for moderation, PRD-32 for system admin) add their own tabs to the same shell, so admins have one place to go for all administrative work.

> **Mom experience goal:** Managing the Vault should feel like running a content library from a clean dashboard, not wrestling with a database. Upload something, let LiLa help with titles and tags, preview it, publish it. Come back later and see how it's performing. Edit anything, anytime.

---

## User Stories

### Content Management
- As an admin, I want to create any type of Vault content (tutorial, AI tool, prompt pack, skill, curation, workflow) from a single adaptive form so I don't need to learn different interfaces for different content types.
- As an admin, I want to edit any published Vault item so I can fix typos, update descriptions, swap images, or change tier access without needing to delete and re-create.
- As an admin, I want to archive content rather than hard-delete it so I can bring things back if I change my mind.
- As an admin, I want to save content as a draft and come back to finish it later so I'm not forced to complete everything in one session.
- As an admin, I want to see a list of all Vault content with status indicators (draft, published, archived) so I can manage my content library at a glance.

### Prompt Pack Management
- As an admin, I want to create a prompt pack and then add individual prompt entries to it one at a time so I can build packs incrementally.
- As an admin, I want to drag-reorder prompt entries within a pack so I control the gallery or list presentation order.
- As an admin, I want to upload example output images and reference images per prompt entry so users can see what the style produces and download reference material.

### Curation Management
- As an admin, I want to create curations (curated bundles of Vault items) that group tutorials, tools, prompt packs, and skills together for a specific purpose — like a playlist.
- As an admin, I want to drag items from my content list directly into a curation so I can build bundles quickly and drag the same item into multiple curations.
- As an admin, I want to click into a curation and drag-reorder the items inside so I control the presentation order.
- As an admin, I want LiLa to suggest which curations a new item should be added to so I don't have to remember every bundle I've created.

### Category Management
- As an admin, I want to create, edit, reorder, and archive categories so I control how the browse page is organized.
- As an admin, I want categories to have icons and colors so they're visually distinctive in the browse UI.

### LiLa-Assisted Creation
- As an admin, I want LiLa to suggest a catchy hook title, a clear detail title, relevant tags, and a category when I enter a description so I save time and get better content metadata.
- As an admin, I want to accept, edit, or ignore each LiLa suggestion independently so I stay in control.

### Publishing & Lifecycle
- As an admin, I want to publish a draft item with one click so content goes live instantly when I'm ready.
- As an admin, I want to un-publish a live item back to draft so I can revise it without users seeing the in-progress version.
- As an admin, I want to archive content that's no longer relevant and optionally restore it later.

### Analytics & Requests
- As an admin, I want to see per-item performance metrics (views, bookmarks, copies, sessions) so I know what content resonates and what to create more of.
- As an admin, I want to view and manage user-submitted content requests so I can prioritize what to build next.
- As an admin, I want to copy all pending content requests in a structured format so I can paste them into Claude for batch triage and content planning.

### Image Management
- As an admin, I want thumbnails, example images, and reference images to upload to organized storage buckets so files are manageable.
- As an admin, I want orphaned images (images no longer referenced by any Vault item) to be identifiable and cleanable so storage doesn't grow indefinitely.

---

## Screens

### Screen 0: Admin Console Shell

> **Depends on:** PRD-02 `staff_permissions` table and permission types. PRD-04 routing — the `/admin` route is NOT part of any family member shell. It is a separate authenticated route accessible only to users with active staff permissions.

The Admin Console Shell is a lightweight framework that houses all admin interfaces in one location.

**What the user sees:**

```
┌──────────────────────────────────────────────────────┐
│  MyAIM Admin Console                    [User] [←]   │
│  ─────────────────────────────────────────────────── │
│  [AI Vault] [Moderation] [System] [Analytics]        │
│  ────────────────────────────────────────────────────│
│                                                      │
│  (Active tab content renders here)                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- **Route:** `/admin` — redirects to the first permitted tab
- **Tab navigation:** Horizontal tabs across the top. Each tab corresponds to an admin domain.
- **Per-tab permissions:** Each tab has a required permission type from `staff_permissions`. If the admin doesn't have permission for a tab, the tab is hidden — not disabled, hidden.
- **Back button (`←`):** Returns to the regular app experience (mom shell).

**Tab Registry (grows with future PRDs):**

| Tab Label | Route | Permission Required | Defined In |
|-----------|-------|-------------------|------------|
| AI Vault | `/admin/vault` | `vault_admin` | **This PRD (21B)** |
| Moderation | `/admin/moderation` | `moderation_admin` | PRD-21C (stub) |
| System | `/admin/system` | `system_admin` | PRD-32 (stub) |
| Analytics | `/admin/analytics` | `analytics_admin` | PRD-32 (stub) |

> **Decision rationale:** A unified admin shell with tabbed navigation prevents the V1 problem of three separate admin routes (`/aim-admin`, `/beta/admin`, `/library/admin`) that required clicking between different pages. One console, one location, tab-scoped permissions so different admins can access different areas. The shell is lightweight — it's just routing + tab nav + permission gating.

**Admin access model:**
- V1 pattern carried forward: hardcoded super admin emails (`tenisewertman@gmail.com`, `aimagicformoms@gmail.com`, `3littlelanterns@gmail.com`) always have `super_admin` permission.
- `super_admin` grants access to all tabs.
- Additional admins added via `staff_permissions` table with specific permission types and optional expiry dates.
- The "manage admin users" UI is PRD-32 scope. At MVP, additional admins are added directly in the database.

> **Forward note:** PRD-32 (Admin Console — System/Platform) will add the System and Analytics tabs and build the admin user management interface. The shell framework defined here should accommodate any number of future tabs without restructuring.

**Data created/updated:**
- No new tables. Uses existing `staff_permissions` from PRD-02.

---

### Screen 1: Vault Content Dashboard

> **Depends on:** PRD-21A `vault_items`, `vault_categories` tables.

The landing page of the AI Vault admin tab. Shows all Vault content in a manageable list with filtering and quick actions.

**What the user sees:**

```
┌────────────────────────────────────────────────────────────┐
│  AI Vault Content                         [+ New Content]  │
│  ────────────────────────────────────────────────────────  │
│  [All] [Published] [Drafts] [Archived]     🔍 Search...   │
│                                                            │
│  Filters: [Type ▾] [Category ▾] [Tier ▾]    Sort: Recent  │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  ┌─────────┬───────────────────────┬──────┬──────┬──────┐ │
│  │Thumbnail│ Title & Info          │Status│Views │ ···  │ │
│  ├─────────┼───────────────────────┼──────┼──────┼──────┤ │
│  │  [img]  │ Custom Coloring Pages │ ✅   │ 342  │ [⋮] │ │
│  │         │ Tutorial · Creative   │      │      │      │ │
│  ├─────────┼───────────────────────┼──────┼──────┼──────┤ │
│  │  [img]  │ Watercolor Styles     │ ✅   │ 187  │ [⋮] │ │
│  │         │ Prompt Pack · 24 ent  │      │      │      │ │
│  ├─────────┼───────────────────────┼──────┼──────┼──────┤ │
│  │  [img]  │ Meal Planner Pro      │ 📝   │  —   │ [⋮] │ │
│  │         │ AI Tool · Practical   │      │      │      │ │
│  └─────────┴───────────────────────┴──────┴──────┴──────┘ │
│                                                            │
│  Showing 1-25 of 68 items              [← 1 2 3 →]        │
└────────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Status tabs:** All (default), Published (live in Vault), Drafts (in progress), Archived (removed from Vault, data preserved)
- **Search:** Full-text across `display_title`, `detail_title`, `short_description`, `tags`
- **Filters:** Content type dropdown, category dropdown, tier access dropdown. Combinable.
- **Sort:** Most recent (default), alphabetical, most views, most bookmarks
- **Content rows:** Thumbnail, display title, content type badge, category name, status icon (✅ published, 📝 draft, 📦 archived), view count
- **Prompt pack rows** show entry count (e.g., "24 entries")
- **Action menu (⋮):** Edit, Duplicate, View Live (if published — opens in new tab showing user-facing detail view), Change Status (publish/draft/archive), Delete (hard delete with confirmation)
- **Pagination:** 25 items per page with page controls

**Interactions:**
- Tap a content row → navigates to Screen 2 (Content Editor) for that item
- Tap `+ New Content` → navigates to Screen 2 with blank form
- Tap status tab → filters the list
- Tap a filter → refines results, combinable with status tabs
- Tap ⋮ → shows action menu with quick actions
- Tap "View Live" → opens the user-facing detail view in a new tab (only for published items)

**Data created/updated:**
- No writes from this screen. Read-only dashboard.

---

### Screen 2: Content Editor (Create / Edit)

The core content management form. Adapts its fields based on the selected `content_type`. Used for both creating new items and editing existing ones.

> **Mom experience goal:** This form should feel like filling out a content profile, not configuring a database. The most important fields are at the top. Advanced settings are collapsed by default. LiLa helps with the creative work (titles, tags).

**Form Layout:**

The form is divided into collapsible sections. When creating new content, the user first selects a content type, and the form adapts to show only the relevant sections.

**Section 1: Content Type Selector** (top of form, always visible)

```
┌────────────────────────────────────────────────────┐
│  What are you creating?                            │
│                                                    │
│  [📖 Tutorial] [🤖 AI Tool] [🎨 Prompt Pack]      │
│  [⚡ Skill] [📦 Curation] [🔄 Workflow]          │
└────────────────────────────────────────────────────┘
```

Six card-style buttons, one per content type. On edit, this is display-only (content type cannot change after creation).

> **Decision rationale:** Content type is selected first because it determines which form fields appear. Card buttons with icons are faster to scan than a dropdown for 6 options.

**Section 2: Core Information** (always visible, all content types)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Display Title (Hook) | Text input | Yes | Catchy, outcome-focused, Google-proof. LiLa can suggest. |
| Detail Title | Text input | No | Clear title revealing the method. Visible only to tier-authorized users. LiLa can suggest. |
| Short Description | Textarea | Yes | Hook description for cards. Visible to everyone including non-subscribers. |
| Full Description | Rich textarea | No | Detailed description for the detail view. Only for tier-authorized users. |
| Category | Dropdown + "Create New" | Yes | Populated from `vault_categories`. "Create New" opens inline category creation (persisted immediately — fixes V1 bug). |
| Tags | Tag input with auto-suggest | No | Free-text tags. Auto-suggests from existing tags across all items. |
| Difficulty | Dropdown | Yes | Beginner, Intermediate, Advanced. Default: Beginner. |
| Thumbnail | Image upload | No | Card thumbnail. Upload preview shown inline. |
| Preview Image | Image upload | No | Larger image for detail view header. |
| [💡 Suggest with LiLa] | Button | — | Takes `full_description` content, calls LiLa API, returns suggestions for display_title, detail_title, tags, category. See AI Integration section. |

**Section 3: Content-Type-Specific Fields** (conditional based on type selection)

**For Tutorial:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Content Body | Rich Markdown editor | No | For natively rendered tutorials. |
| Content URL | URL input | No | For iframe-embedded content (Gamma pages, video embeds). |
| Learning Outcomes | Repeatable text inputs | No | What the user will learn. Rendered as a list in the detail view. |
| Estimated Minutes | Number input | No | Estimated completion time. |

> **Decision rationale:** Tutorials can be native Markdown content, an iframe embed, or both (video at top + written steps below). The form supports all three configurations.

**For AI Tool:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Delivery Method | Radio: Native / Embedded / Link Out | Yes | Determines how the tool launches. |
| Guided Mode Key | Text input | Conditional | Required when delivery_method = 'native'. References the guided mode registry (PRD-05). |
| Tool URL | URL input | Conditional | Required when delivery_method = 'embedded' or 'link_out'. Hidden from users. |
| Platform | Dropdown | No | Which AI platform (ChatGPT, Gemini, Midjourney, etc.). Metadata only — not a content type. |
| Requires Auth | Checkbox | No | Whether the tool requires the user to sign into an external platform. Fixes V1 bug where this field existed but had no checkbox. |
| Auth Provider | Dropdown | Conditional | Required when requires_auth = true. Options: Google, OpenAI, other. |
| Portal Description | Textarea | No | Description shown on the tool portal/prep page before launch. |
| Portal Tips | Repeatable text inputs | No | Tips shown before launch. |
| Prerequisites | Textarea | No | What the user needs before starting. |

**For Prompt Pack:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Prompt Format | Radio: Text LLM / Image Gen / Video Gen / Audio Gen | Yes | Determines rendering mode (gallery vs. list) on the browse side. |

Prompt entries are managed on a sub-screen (Screen 3). The pack-level form only captures the parent metadata. A "Manage Entries" button navigates to Screen 3 after the parent pack is saved.

**For Skill:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Target Platforms | Multi-select checkboxes | Yes | Claude, ChatGPT, Gemini, Other. |
| Content Body | Rich Markdown editor | Yes | The skill framework/instructions. Content-protected on the user side. |
| Estimated Setup Minutes | Number input | No | How long deployment takes. |

**For Curation:**

Curations are editorial bundles — curated playlists of Vault items grouped for a specific purpose that wouldn't naturally tag together. For example, "Back to School AI Starter Kit" might bundle a tutorial, a prompt pack, and a skill from three different categories.

Curation membership is managed through two complementary interfaces:

1. **From the Content Dashboard (Screen 1):** The content list supports drag-and-drop into curations via a collapsible curations sidebar panel on the right side (similar to StewardShip's CollectionSidebar pattern). The admin can drag any content row from the list into a curation in the sidebar. The same item can be dragged into multiple curations. The sidebar shows all curations with item counts and accepts drops.

2. **From the Curation Detail Screen (Screen 3B):** When the admin clicks into a specific curation, they see all items inside it with drag-to-reorder handles. This is where presentation order is set. Items can also be added here via a search/checkbox picker.

The content editor form for a `curation` type item captures only the curation's own metadata (title, description, thumbnail). The items inside the curation are managed on Screen 3B, not inline on the editor form.

> **Decision rationale:** Curations are the editorial glue that turns individual content items into purposeful bundles. The drag-from-dashboard approach makes it fast to build curations while browsing content. The dedicated detail screen makes it easy to fine-tune order and composition. This mirrors StewardShip's Manifest Collections pattern (drag-to-add, click-into-reorder) adapted for the Vault's content types.

No additional fields on the curation editor form beyond the Core Information section — the curation's value is its curated contents, managed on Screen 3B.

**For Workflow:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Content Body | Rich Markdown editor | Yes | Step-by-step instructions with embedded prompts. |
| Step Count | Auto-calculated | — | Derived from content body structure (counts numbered steps or H2 headings). |
| Estimated Minutes | Number input | No | Total workflow time estimate. |

**Section 4: Access & Visibility** (all content types)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Allowed Tiers | Multi-select checkboxes | Yes | Which subscription tiers can access this item. Replaces V1's dual `required_tier` / `allowed_tiers` confusion — V2 uses only `allowed_tiers`. |
| Teen Visible | Checkbox | No | Whether this item appears in the teen's filtered Vault browse. Default: false. |
| Enable LiLa Optimization | Checkbox | No | Whether the "Optimize with LiLa" button appears on this item. Default: false. |
| LiLa Optimization Prompt | Textarea | Conditional | Visible when enable_lila_optimization = true. Admin-authored instructions for how LiLa should personalize this content. |

> **Decision rationale:** V1 submitted both `required_tier` (single) and `allowed_tiers` (array) with no reconciliation. V2 uses only `allowed_tiers` — a simple checkbox array. This was decided in the PRD-21A session.

**Section 5: Featured & Discovery** (all content types, collapsed by default)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Featured in Hero Spotlight | Checkbox | No | Toggles `is_featured`. |
| Featured Sort Order | Number input | Conditional | Visible when featured = true. Controls hero rotation order. |
| Ladder Position | Dropdown | No | Fun & Creative, Practical, Creator. Optional content strategy metadata for admin analytics. Not user-facing. |
| Display Order | Number input | No | Sort order within category. Default 0. |

**Section 6: NEW Badge Settings** (all content types, collapsed by default)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Eligible for NEW Badge | Checkbox | No | Default: true. Toggles `is_new`. |
| First-Seen Tracking | Checkbox | No | Default: true. Whether per-user NEW badge tracking is active. |
| Badge Duration (Days) | Number input | No | Default: 30. How many days the NEW badge shows per user from first sighting. |

**Section 7: Seasonal & Gift Tags** (all content types, collapsed by default)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Seasonal Tags | Tag input with auto-suggest | No | Free-text tag array. Auto-suggests from tags used across all items (e.g., christmas, back-to-school). |
| Gift Idea Tags | Tag input with auto-suggest | No | Separate tag array for gift-related content (e.g., gifts-for-teachers, handmade-gifts). |
| Seasonal Priority | Slider or number (0-10) | No | Higher values boost the item during its tagged season. Default: 0. |

**Section 8: Usage Limits** (AI tools only, collapsed by default)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Enable Usage Limits | Checkbox | No | Default: false. |
| Limit Type | Dropdown | Conditional | Daily, Weekly, Monthly, Total. Visible when limits enabled. |
| Limit Amount | Number input | Conditional | Number of allowed uses per period. |
| Session Timeout (Minutes) | Number input | No | Default: 60. Idle timeout for tool sessions. |

**Section 9: Status & Actions** (bottom of form, always visible)

```
┌────────────────────────────────────────────────────────────┐
│  Status: [Draft ▾]                                         │
│                                                            │
│  [Save Draft]  [Preview]  [Publish]  [Archive]  [Delete]   │
│                                                            │
│  Last saved: March 14, 2026 2:34 PM                        │
│  Last published: March 12, 2026 10:00 AM                   │
│  Created by: tenisewertman@gmail.com                       │
└────────────────────────────────────────────────────────────┘
```

- **Save Draft:** Saves all current form data. Item remains in draft status.
- **Preview:** Opens a modal showing how this item would look in the user-facing browse and detail views. Works for both draft and published items.
- **Publish:** Validates required fields, then sets status to 'published'. Sets `last_published_at` timestamp. Item immediately visible in the Vault for users with tier access.
- **Archive:** Sets status to 'archived'. Item disappears from user-facing Vault. Data preserved.
- **Delete:** Hard delete with confirmation dialog: "This will permanently delete this item and all associated data (prompt entries, bookmarks, progress, analytics). This cannot be undone." Requires typing "DELETE" to confirm.

**Status transitions:**

```
Draft ←→ Published → Archived → Draft (unarchive)
                                   ↓
                              Hard Delete (with confirmation)
```

> **Decision rationale:** Published → Draft (un-publish) is supported for temporary revision without archiving. Archived → Draft (unarchive) brings content back. Hard delete is the nuclear option, requiring deliberate confirmation because it destroys user progress and bookmark data.

> **Forward note:** Content versioning (tracking what changed between publishes, rollback to previous versions) is a post-MVP enhancement. The `last_published_at` timestamp and `updated_at` auto-trigger provide basic audit trail for now. When versioning is added, the schema should support a version history table linked to `vault_items`.

> **Forward note:** Scheduled publishing (set a future date for auto-publish) is a post-MVP enhancement. The status field supports this by adding a 'scheduled' value and a `scheduled_publish_at` timestamp column. A Supabase edge function or cron job would transition status from 'scheduled' to 'published' at the scheduled time.

**Interactions:**
- Select content type → form sections adapt (show/hide relevant fields)
- Type in Full Description → "Suggest with LiLa" button becomes active
- Tap "Suggest with LiLa" → See AI Integration section
- Tap "Manage Entries" (prompt packs) → navigates to Screen 3
- Tap "Preview" → opens preview modal
- Tap any save/publish/archive/delete action → confirmation where appropriate, then action
- Category dropdown "Create New" → inline form appears: name, icon, color, description. On save, creates `vault_categories` record immediately and selects it. Fixes V1 bug.

**Data created/updated:**
- `vault_items`: create or update
- `vault_categories`: create (if "Create New" used)
- Supabase Storage: thumbnail and preview image uploads

---

### Screen 3: Prompt Pack Entry Manager

> **Depends on:** PRD-21A `vault_prompt_entries` table and parent-child model.

A dedicated sub-screen for managing individual prompt entries within a prompt pack. Accessed via "Manage Entries" button on the parent pack's editor form.

**What the user sees:**

```
┌────────────────────────────────────────────────────────────┐
│  ← Back to "Watercolor Styles"          [+ Add Entry]      │
│  ────────────────────────────────────────────────────────  │
│  24 entries · Image Gen · Published                         │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  ┌─ ≡ ─┬───────────────────────────────────────┬─────────┐│
│  │ ≡   │ Watercolor Storybook                  │ [⋮]     ││
│  │ drag │ 3 example images · 1 reference        │ Edit    ││
│  ├─────┼───────────────────────────────────────┼─────────┤│
│  │ ≡   │ Oil Painting Classic                  │ [⋮]     ││
│  │ drag │ 4 example images · 0 references       │ Edit    ││
│  ├─────┼───────────────────────────────────────┼─────────┤│
│  │ ≡   │ Pencil Sketch Realistic               │ [⋮]     ││
│  │ drag │ 2 example images · 2 references       │ Edit    ││
│  └─────┴───────────────────────────────────────┴─────────┘│
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- **Entry list:** Shows all prompt entries in sort order, with drag handles for reordering.
- **Each row:** Entry title, example image count, reference image count, action menu.
- **Action menu (⋮):** Edit (opens entry editor), Duplicate, Delete (with confirmation).
- **Drag-to-reorder:** Updates `sort_order` on drop.
- **Back button:** Returns to the parent pack's editor form.

**Tap "Add Entry" or "Edit":** Opens the entry editor inline (expanding the row) or in a side panel:

**Entry Editor Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Title | Text input | Yes | Entry title (e.g., "Watercolor Storybook"). |
| Prompt Text | Textarea (large) | Yes | The actual prompt content. |
| Variable Placeholders | Tag input | No | Replaceable variables like `[SUBJECT]`, `[STYLE]`. Detected automatically from prompt text or added manually. |
| Example Output Images | Multi-image upload | No | Images showing what this style produces. Up to 10 per entry (soft limit). |
| Reference Images | Multi-image upload | No | Downloadable style reference images. Up to 5 per entry (soft limit). |
| Tags | Tag input with auto-suggest | No | Per-entry tags for filtering within the pack. |

**Interactions:**
- Drag an entry row → reorder (updates sort_order for all affected entries)
- Tap "Add Entry" → blank entry editor opens
- Fill entry fields → Save creates `vault_prompt_entries` record
- Upload images → stored in Supabase Storage under organized paths
- Tap Delete on an entry → confirmation, then hard delete (entries don't have draft/archive lifecycle)

**Data created/updated:**
- `vault_prompt_entries`: create, update, delete, reorder
- Supabase Storage: example output and reference image uploads

---

### Screen 3B: Curation Detail Manager

> **Depends on:** PRD-21A `vault_collection_items` join table (renamed conceptually to "curation items" in the UI, same underlying table).

A dedicated screen for viewing and managing the contents of a single curation. Accessed by clicking a curation in the curations sidebar on Screen 1, or by clicking "Manage Items" on a curation's editor form (Screen 2).

**What the user sees:**

```
┌────────────────────────────────────────────────────────────┐
│  ← Back to Curations          "Back to School Starter Kit" │
│  ────────────────────────────────────────────────────────  │
│  4 items · Published                    [+ Add Items]      │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  ┌─ ≡ ─┬─────────┬──────────────────────────┬───────────┐ │
│  │ ≡   │  [img]  │ AI Meal Planning 101      │   [✕]    │ │
│  │ drag │         │ Tutorial · Practical      │  remove   │ │
│  ├─────┼─────────┼──────────────────────────┼───────────┤ │
│  │ ≡   │  [img]  │ Homework Helper Skill     │   [✕]    │ │
│  │ drag │         │ Skill · Education         │  remove   │ │
│  ├─────┼─────────┼──────────────────────────┼───────────┤ │
│  │ ≡   │  [img]  │ Weekly Schedule Prompts   │   [✕]    │ │
│  │ drag │         │ Prompt Pack · 12 entries  │  remove   │ │
│  ├─────┼─────────┼──────────────────────────┼───────────┤ │
│  │ ≡   │  [img]  │ Morning Routine Workflow  │   [✕]    │ │
│  │ drag │         │ Workflow · Home Mgmt      │  remove   │ │
│  └─────┴─────────┴──────────────────────────┴───────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- **Drag-to-reorder:** Drag handles on each item row. Reordering updates `sort_order` on `vault_collection_items`. This order is the presentation order users see when browsing the curation.
- **Remove (✕):** Removes the item from this curation (deletes the `vault_collection_items` row). Does NOT archive or delete the item itself.
- **Item rows:** Thumbnail, display title, content type badge, category. Tapping the title opens that item's editor (Screen 2) in a new context.

**"+ Add Items" opens an Add Items Picker modal:**

```
┌────────────────────────────────────────────────────────────┐
│  Add Items to "Back to School Starter Kit"          [Done] │
│  ────────────────────────────────────────────────────────  │
│  🔍 Search items...                                        │
│                                                            │
│  Filter: [All Types ▾] [All Categories ▾] [Tags ▾]        │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  ☑ AI Meal Planning 101          (already in curation)     │
│  ☐ Custom Coloring Pages         Tutorial · Creative       │
│  ☐ Watercolor Styles             Prompt Pack · Creative    │
│  ☑ Homework Helper Skill         (already in curation)     │
│  ☐ Budget Coach                  Skill · Practical         │
│  ☐ Email Sequence Builder        Skill · Creator           │
│                                                            │
│  Selected: 0 new items                     [Add Selected]  │
└────────────────────────────────────────────────────────────┘
```

- **Search:** Full-text across titles and tags.
- **Filter by type:** Dropdown to filter by content_type (tutorial, ai_tool, prompt_pack, skill, workflow). Curations cannot contain other curations.
- **Filter by category:** Dropdown to filter by vault_categories.
- **Filter by tags:** Tag picker to filter by item tags — this is where "view by tag" works for finding related items.
- **Checkboxes:** Items already in the curation show as checked and marked "(already in curation)." New selections get checkboxes.
- **"Add Selected":** Creates `vault_collection_items` rows for each newly selected item with sequential sort_order values appended after existing items.
- Only published items appear in the picker (no drafts or archived items).

> **Decision rationale:** The picker modal provides the search + checkbox + tag-filter experience for deliberate curation building. The drag-from-dashboard (Screen 1) provides the fast, visual approach for building curations while browsing content. Both methods write to the same `vault_collection_items` table.

**Interactions:**
- Drag item rows → reorder (updates sort_order)
- Tap ✕ → remove item from curation with confirmation
- Tap "+ Add Items" → opens picker modal
- Search/filter in picker → refines available items
- Check items + "Add Selected" → adds to curation
- Tap item title → navigates to that item's editor (Screen 2)

**Data created/updated:**
- `vault_collection_items`: create (add items), delete (remove items), update sort_order (reorder)

---

### Screen 1 Addition: Curations Sidebar

The Content Dashboard (Screen 1) gains a collapsible curations sidebar on the right side, enabling drag-and-drop curation building directly from the content list.

**Sidebar behavior:**

```
┌──────────────────────────────────────┬───────────────────┐
│  AI Vault Content        [+ New]     │  Curations    [+] │
│  ──────────────────────────────────  │  ─────────────── │
│  [All] [Published] [Drafts]          │                   │
│  ──────────────────────────────────  │  📦 Back to       │
│                                      │     School (4)    │
│  ┌─────────┬──────────────┬────┐     │  ─ ─ ─ ─ ─ ─ ─  │
│  │  [img]  │ Coloring...  │ ⋮ │ ←drag│  📦 Holiday      │
│  ├─────────┼──────────────┼────┤     │     Workshop (3) │
│  │  [img]  │ Watercolor...│ ⋮ │     │  ─ ─ ─ ─ ─ ─ ─  │
│  ├─────────┼──────────────┼────┤     │  📦 Image Gen    │
│  │  [img]  │ Meal Plan... │ ⋮ │     │     Mastery (6)  │
│  └─────────┴──────────────┴────┘     │                   │
│                                      │  [Manage →]       │
└──────────────────────────────────────┴───────────────────┘
```

- **Toggle:** A "Curations" button on the content dashboard toggles the sidebar open/closed. Sidebar is closed by default to keep the content list full-width.
- **When open:** The content list wraps DnD context. Content rows become draggable. Each curation in the sidebar is a drop zone.
- **Drop behavior:** Dropping a content row onto a curation calls `addToCollection(curationId, [itemId])` — upsert prevents duplicates, assigns sort_order at the end.
- **Same item, multiple curations:** Drag the same item to different curations — each drop creates a separate `vault_collection_items` row.
- **Each curation row:** Shows name and item count. Clicking a curation navigates to Screen 3B (Curation Detail).
- **[+] button:** Creates a new curation inline (name input, save).
- **"Manage →" link:** Navigates to a curations list view showing all curations with edit/archive actions.
- **Mobile:** Sidebar appears below the content list (stacked) rather than beside it.

> **Decision rationale:** The sidebar drag-and-drop pattern mirrors StewardShip's CollectionSidebar — fast, visual curation building while browsing content. The sidebar is optional (collapsed by default) so it doesn't clutter the content dashboard for simple content management tasks.

**Data created/updated:**
- `vault_collection_items`: create (on drop)

---

### Screen 4: Category Manager

A management screen for Vault categories. Accessible from a "Manage Categories" link on the content dashboard or as a sub-tab within the AI Vault admin tab.

**What the user sees:**

```
┌────────────────────────────────────────────────────────────┐
│  Categories                               [+ New Category]  │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  ┌─ ≡ ─┬─────┬────────────────────┬────────┬─────────────┐│
│  │ ≡   │ 🎨  │ Creative & Fun      │ Active │ 12 items   ││
│  ├─────┼─────┼────────────────────┼────────┼─────────────┤│
│  │ ≡   │ 🏠  │ Home Management     │ Active │ 8 items    ││
│  ├─────┼─────┼────────────────────┼────────┼─────────────┤│
│  │ ≡   │ 📚  │ AI Learning Path    │ Active │ 15 items   ││
│  ├─────┼─────┼────────────────────┼────────┼─────────────┤│
│  │ ≡   │ 💼  │ Creator Tools       │ Hidden │ 3 items    ││
│  └─────┴─────┴────────────────────┴────────┴─────────────┘│
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- **Drag-to-reorder:** Updates `sort_order` for all categories. Sort order determines the order of category rows on the user-facing Vault browse page.
- **Each row:** Icon, display name, active/hidden status, item count.
- **Tap a row → inline edit:** Display name, description, Lucide icon picker, color selector, active/hidden toggle.
- **"+ New Category":** Inline form at the top: name, icon, color, description. Saves to `vault_categories`.
- **Cannot delete a category with items:** Must reassign items first. Categories with zero items can be deleted.

**Interactions:**
- Drag rows → reorder (updates sort_order)
- Tap a row → expand inline edit form
- Toggle active/hidden → sets `is_active`. Hidden categories don't appear as browse rows, but their items remain accessible via search and direct links.
- Tap Delete (zero-item categories only) → confirmation, then delete

**Data created/updated:**
- `vault_categories`: create, update, delete, reorder

---

### Screen 5: Content Request Queue

> **Depends on:** PRD-21A `vault_content_requests` table.

A management interface for user-submitted content requests.

**What the user sees:**

```
┌────────────────────────────────────────────────────────────┐
│  Content Requests                [Copy All Pending]         │
│  ────────────────────────────────────────────────────────  │
│  [Pending (7)] [Reviewed] [Planned] [Completed] [Declined] │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  ┌──────────────────────────────────────────────┬────────┐│
│  │ "AI-generated holiday cards"                  │ High   ││
│  │ Would love templates for making custom        │        ││
│  │ Christmas cards with family photos...         │        ││
│  │ Suggested: Creative & Fun · 3 days ago        │ [⋮]   ││
│  ├──────────────────────────────────────────────┼────────┤│
│  │ "Meal planning for large families"            │ Medium ││
│  │ I have 6 kids and need meal planning that     │        ││
│  │ accounts for different dietary needs...       │        ││
│  │ Suggested: Home Management · 5 days ago       │ [⋮]   ││
│  └──────────────────────────────────────────────┴────────┘│
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- **Status tabs:** Filter by request status. Badge counts on each tab.
- **Each request:** Topic, description (truncated, expandable), suggested category, priority, age.
- **Action menu (⋮):** Mark as Reviewed, Mark as Planned, Mark as Completed (with link to Vault item), Mark as Declined, Add Admin Notes, Copy This Request.
- **"Copy All Pending" button:** Formats all pending requests as a structured text block:

```
=== VAULT CONTENT REQUESTS (Pending) ===
Date exported: March 14, 2026
Count: 7 pending requests

---
REQUEST 1 of 7
Topic: AI-generated holiday cards
Priority: High
Category suggestion: Creative & Fun
Description: Would love templates for making custom Christmas cards with family photos...
Submitted: March 11, 2026
---
REQUEST 2 of 7
Topic: Meal planning for large families
Priority: Medium
Category suggestion: Home Management
Description: I have 6 kids and need meal planning that accounts for different dietary needs...
Submitted: March 9, 2026
---
[...]
=== END REQUESTS ===
```

> **Decision rationale:** The export format is designed for pasting into Claude for batch triage. Structured, numbered, with clear delimiters so Claude can parse and prioritize. This is a Tenise-workflow optimization — batch-process requests in Claude, then come back to update statuses.

**Interactions:**
- Tap a status tab → filters requests
- Tap a request row → expands to show full description and admin notes field
- Tap ⋮ → status change actions
- Tap "Copy All Pending" → copies formatted text to clipboard with "Copied!" toast
- Add admin notes → saves to `vault_content_requests.admin_notes`

**Data created/updated:**
- `vault_content_requests`: update status, admin_notes

---

### Screen 6: Content Analytics

A performance-focused analytics view showing how Vault content is performing. Designed to be exportable to Claude for analysis.

**What the user sees:**

```
┌────────────────────────────────────────────────────────────┐
│  Content Performance          [Copy Report] [Date Range ▾]  │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  Summary: 68 published · 12 drafts · 5 archived            │
│  Total views: 4,271 · Total copies: 892 · Active users: 34│
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  Sort: [Views ▾] [Bookmarks] [Copies] [Sessions]           │
│                                                            │
│  ┌──────────────────────┬──────┬──────┬──────┬───────────┐│
│  │ Item                 │Views │ 🔖   │ 📋   │ Progress  ││
│  ├──────────────────────┼──────┼──────┼──────┼───────────┤│
│  │ Custom Coloring Pages│ 342  │  47  │  89  │ 23 comp.  ││
│  │ Tutorial · Creative  │      │      │      │           ││
│  ├──────────────────────┼──────┼──────┼──────┼───────────┤│
│  │ Watercolor Styles    │ 287  │  62  │ 312  │ 15 started││
│  │ Prompt Pack · 24 ent │      │      │      │           ││
│  └──────────────────────┴──────┴──────┴──────┴───────────┘│
│                                                            │
│  Content Mix:                                              │
│  Fun & Creative: 28 (41%) · Practical: 24 (35%) ·          │
│  Creator: 16 (24%)                                          │
│                                                            │
│  Request Trends:                                            │
│  7 pending · 12 this month · Top category: Creative & Fun  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- **Summary row:** Total counts across all content.
- **Sortable table:** Per-item metrics. Columns: item name, view count, bookmark count, copy event count, progress stats (completed/started), tool session count (for AI tools).
- **Date range filter:** All time, last 30 days, last 7 days, custom range.
- **Content Mix:** Breakdown by `ladder_position` — shows whether the content library is balanced across the three strategy buckets (fun_creative, practical, creator).
- **Request Trends:** Summary of content request volume and top requested categories.
- **"Copy Report" button:** Formats the analytics table as a structured text block (similar to content requests export) for pasting into Claude for analysis.

**Copy Report format:**

```
=== VAULT CONTENT PERFORMANCE REPORT ===
Date: March 14, 2026
Period: Last 30 days

SUMMARY
Published items: 68
Total views: 4,271
Total copy events: 892
Total bookmarks: 1,234
Active users browsing: 34

CONTENT MIX
Fun & Creative: 28 items (41%)
Practical: 24 items (35%)
Creator: 16 items (24%)

PER-ITEM METRICS (sorted by views)
1. Custom Coloring Pages (Tutorial, Creative & Fun) — 342 views, 47 bookmarks, 89 copies, 23 completed
2. Watercolor Styles (Prompt Pack, Creative & Fun) — 287 views, 62 bookmarks, 312 copies, 15 started
[...]

CONTENT REQUESTS
Pending: 7
This month: 12
Top requested category: Creative & Fun
=== END REPORT ===
```

> **Decision rationale:** Analytics are presented in a format optimized for human scanning AND for pasting into Claude. The admin doesn't need to understand database queries — she copies the report, pastes it into Claude, and asks "what should I create next?" or "which content is underperforming?"

**Interactions:**
- Sort columns → re-sorts the table
- Change date range → refreshes all metrics
- Tap "Copy Report" → copies structured text to clipboard
- Tap an item row → navigates to that item's editor (Screen 2)

**Data sources (read-only):**
- `vault_items.view_count`
- `vault_user_bookmarks` (count per item)
- `vault_copy_events` (count per item, filterable by date)
- `vault_user_progress` (completed/started counts per item)
- `vault_tool_sessions` (count per item, filterable by date)
- `vault_content_requests` (status counts, category trends)

---

### Screen 7: Image Manager

A utility screen for managing uploaded images across all Vault content. Focuses on identifying and cleaning orphaned images.

**What the user sees:**

```
┌────────────────────────────────────────────────────────────┐
│  Image Manager                      [Clean Orphaned Images] │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  Storage Usage: 2.4 GB of thumbnails, examples, references │
│                                                            │
│  [All Images] [Orphaned (12)]                               │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  Orphaned images (not referenced by any Vault item):        │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │[img] │ │[img] │ │[img] │ │[img] │ │[img] │            │
│  │ ☑    │ │ ☑    │ │ ☐    │ │ ☑    │ │ ☐    │            │
│  │ 45KB │ │128KB │ │ 2MB  │ │ 89KB │ │1.2MB │            │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                            │
│  [Select All] [Delete Selected (3)]                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

- **Storage summary:** Total storage used across all Vault image buckets.
- **Orphaned images tab:** Shows images in Supabase Storage that are not referenced by any `vault_items.thumbnail_url`, `vault_items.preview_image_url`, `vault_prompt_entries.example_outputs`, or `vault_prompt_entries.reference_images` field.
- **Checkboxes:** Select individual images for deletion.
- **"Clean Orphaned Images":** Selects all orphaned images and confirms bulk delete.

> **Decision rationale:** This fixes V1's orphaned image bug where `removeImage()` cleared the URL but didn't delete from Supabase Storage. The Image Manager provides visibility into storage usage and a manual cleanup tool. Automated scheduled cleanup is a post-MVP enhancement.

**Interactions:**
- Toggle "Orphaned" tab → shows only unreferenced images
- Check/uncheck images → select for deletion
- "Delete Selected" → confirmation dialog, then permanently deletes from Supabase Storage
- "Clean Orphaned Images" → selects all orphaned, then same deletion flow

**Data created/updated:**
- Supabase Storage: delete operations on image files

---

## Visibility & Permissions

The admin console is entirely outside the family member permission model. It uses `staff_permissions` from PRD-02.

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | No access unless also a staff member | Being a mom/primary parent does not grant admin access. Only `staff_permissions` grants access. In practice, Tenise is both. |
| Dad / Additional Adult | No access unless also a staff member | Same as above. |
| Special Adult | No access | Never. |
| Independent (Teen) | No access | Never. |
| Guided / Play | No access | Never. |

### Shell Behavior

- **Mom shell:** Admin Console is NOT in the sidebar. It is accessed via a separate route (`/admin`) or via a subtle admin link in the user menu (visible only if the user has any `staff_permissions`).
- **Dad/Adult shell:** Not visible. Not accessible.
- **Independent shell:** Not visible. Not accessible.
- **Guided shell:** Not visible. Not accessible.
- **Play shell:** Not visible. Not accessible.

> **Decision rationale:** The admin console is a separate world from the family experience. It uses a different authentication check (`staff_permissions` instead of `member_permissions`) and a different navigation structure (tab-based instead of sidebar-based). This separation is intentional — admin work and family browsing are different modes of operation.

### Privacy & Transparency

No teen transparency rules apply. The admin console is invisible to all non-staff users. No content changes are surfaced as notifications to family members (content simply appears or disappears from the Vault). Analytics data is aggregate — individual user browsing behavior is not identifiable in the admin analytics (view counts, bookmark counts, etc. are per-item totals, not per-user breakdowns).

> **Forward note:** If user-level analytics are ever needed (e.g., "show me which users accessed this tool"), that would be PRD-32 scope with privacy considerations. PRD-21B analytics are content-performance only.

---

## Data Schema

PRD-21B does not create new tables. All data tables were defined in PRD-21A. This PRD defines the admin interfaces that perform CRUD operations on those tables.

### Schema Additions to Existing Tables

**Addition to `vault_items`:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| last_published_at | TIMESTAMPTZ | | NULL | Set when status transitions to 'published'. Preserved when un-published. Enables basic audit trail for when the live version last changed. |

> **Forward note:** When content versioning is added post-MVP, a `vault_item_versions` table will store snapshots of item state at each publish event. The `last_published_at` field remains as a quick-access timestamp; the version table provides the full history.

**Addition to `vault_categories` (clarification):**

The `vault_categories` table defined in PRD-21A did not include an `item_count` column. Item counts are calculated at query time (`SELECT COUNT(*) FROM vault_items WHERE category_id = ? AND status = 'published'`). No denormalized count column needed.

### Admin Console Shell (no new tables)

Admin access uses the existing `staff_permissions` table from PRD-02:

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| permission_type | TEXT | 'super_admin', 'vault_admin', 'moderation_admin', 'system_admin', 'analytics_admin' |
| is_active | BOOLEAN | Active/revoked |
| expires_at | TIMESTAMPTZ | Optional expiry |
| created_at | TIMESTAMPTZ | |

**New permission_type values registered by this PRD:** `vault_admin` (access to AI Vault admin tab).

**Existing values:** `super_admin` (access to all tabs — already used in V1).

**Future values (stubs):** `moderation_admin` (PRD-21C), `system_admin` (PRD-32), `analytics_admin` (PRD-32).

### Supabase Storage Buckets

| Bucket | Contents | Access |
|--------|----------|--------|
| `vault-thumbnails` | Card thumbnail images and preview images for vault_items | Admin write. Authenticated users read (signed URLs). |
| `vault-prompt-images` | Example output images and reference images for vault_prompt_entries | Admin write. Authenticated users read (signed URLs). |

> **Decision rationale:** Two buckets rather than one to keep organizational clarity. Thumbnails are small, frequently accessed images. Prompt images are larger, associated with specific entries, and served with content protection (signed URLs per PRD-21A).

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| Admin user input | All Vault content created and managed through the admin editor forms. |
| PRD-21A (Content Requests) | User-submitted `vault_content_requests` appear in the request queue for admin triage. |
| PRD-21A (Analytics data) | View counts, bookmark counts, copy events, progress data, and session data — all written by the user-facing Vault — are read by the admin analytics dashboard. |
| LiLa API | "Suggest with LiLa" calls the LiLa API for content metadata suggestions during creation. |
| Supabase Storage | Image uploads flow into organized storage buckets. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-21A (Vault Browse) | Published `vault_items` and `vault_prompt_entries` appear in the user-facing Vault. Categories with `is_active = true` appear as browse rows ordered by `sort_order`. Featured items appear in the hero spotlight. |
| PRD-21A (NEW Badge) | Admin-configured badge settings (`is_new`, `first_seen_tracking`, `new_badge_duration_days`) control the NEW badge behavior per item. |
| PRD-21A (Tier Gating) | Admin-set `allowed_tiers` on each item determines which users can access it. |
| PRD-21A (Content Protection) | Admin-set `enable_lila_optimization` and `lila_optimization_prompt` control whether and how "Optimize with LiLa" works for each item. |
| PRD-21A (Seasonal Surfacing) | Admin-set seasonal tags and priority scores drive automatic seasonal content boosting. |

---

## AI Integration

### LiLa-Assisted Content Metadata Suggestions

**Trigger:** Admin clicks "Suggest with LiLa" button on the content editor form after entering the `full_description` field.

**Context sent to LiLa:**
1. The item's `full_description` text
2. The item's `content_type`
3. The list of existing `vault_categories` (names and descriptions)
4. The list of existing tags across all vault_items (for tag consistency)
5. The list of existing curations with their names, descriptions, and current item summaries (for curation matching)

**LiLa returns:**
- `suggested_display_title`: A catchy hook title — outcome-focused, Google-proof (doesn't reveal the technique so non-subscribers can't find it elsewhere).
- `suggested_detail_title`: A clear, descriptive title revealing the method.
- `suggested_tags`: 3-8 relevant tags, prioritizing existing tags for consistency.
- `suggested_category_id`: The best-matching existing category, with a note if no good fit exists (suggesting a new category name).
- `suggested_curation_ids`: Existing curations this item would fit well in, based on the item's content type, tags, category, and the curation descriptions. May suggest 0-3 curations. If no curations exist yet, this field is empty.

**Admin experience:**
Each suggestion appears inline next to its corresponding form field with [Accept] and [Dismiss] buttons. Accepting populates the field (or, for curations, adds the item to the suggested curations). Dismissing clears the suggestion. The admin can also manually edit after accepting. Suggestions never auto-populate — the admin always reviews first.

For curation suggestions specifically, each suggested curation shows as a chip with the curation name and an [Add] button. Tapping [Add] adds the item to that curation (creates a `vault_collection_items` row). This only works after the item has been saved at least once (needs an ID).

> **Decision rationale:** This is a single API call, not a conversation. The admin is in a form-filling workflow, not a chat workflow. LiLa's role here is time-saving metadata generation, not creative collaboration. The admin stays in control of every field.

### System Prompt Notes for LiLa Content Suggestions

- Hook titles should be catchy and sell the outcome ("Custom Coloring Pages in Minutes") without revealing the specific method or tool ("Midjourney /describe workflow")
- Detail titles should clearly state what the content actually teaches ("Using Midjourney's /describe Command for Custom Coloring Book Pages")
- Tags should be discovery-oriented — what would a mom search for?
- Category suggestions should match the content's primary audience and use case, not its technical category
- Curation suggestions should identify bundles where this item adds value alongside the existing items — look for thematic fit, complementary content types (a tutorial pairs well with a related prompt pack), and purpose alignment (items that serve the same project or learning goal)

---

## Edge Cases

### Empty Vault (No Content Created Yet)
- Content dashboard shows an empty state with a friendly message: "Your Vault is empty! Tap '+ New Content' to upload your first tutorial or tool." The "+ New Content" button is prominent.

### Publishing a Prompt Pack with Zero Entries
- Allowed for drafts. Prevented for publishing — validation shows: "This prompt pack has no entries. Add at least one prompt entry before publishing."

### Deleting a Published Item with Active User Data
- Hard delete warning includes: "This item has been viewed 342 times, bookmarked by 47 users, and has 23 completed progress records. All of this data will be permanently deleted." The warning escalates based on the amount of user data that would be lost.

### Archiving a Featured Item
- Archiving automatically sets `is_featured = false`. The hero spotlight adjusts to show remaining featured items.

### Category with Active Items Being Hidden
- Hiding a category (`is_active = false`) removes the category row from the browse page, but the items in that category remain accessible via search, direct links, and other discovery paths (tags, "See All" within other content types). Items are NOT archived — only the category row is hidden.

### Image Upload Failures
- If a Supabase Storage upload fails, the form shows an inline error and retains the previous image (if editing). The save operation is not blocked — the item saves without the new image.

### Concurrent Editing
- Last-write-wins. If two admin tabs have the same item open and both save, the most recent save overwrites the other. No conflict detection at MVP.

> **Forward note:** Conflict detection (showing "this item was modified by another admin 2 minutes ago") is a post-MVP enhancement relevant only when multiple admins are actively managing content.

### Large Prompt Packs (100+ entries)
- Entry manager paginates at 50 entries with "Load More." Drag-to-reorder works within the loaded set. Full reorder across pagination boundaries uses explicit sort_order number inputs.

### Orphaned Image Detection Performance
- The orphan scan compares Storage file list against all URL columns in `vault_items` and `vault_prompt_entries`. For large image libraries, this is triggered manually (not on every page load). A loading indicator shows during the scan.

---

## Tier Gating

No tier-specific gating. The admin console is gated by `staff_permissions`, which is entirely separate from the subscription tier system. Admin access has no relationship to a user's subscription level.

> **Tier rationale:** Admin functionality is a platform management concern, not a subscriber benefit. The admin console should work identically regardless of what subscription tier the admin's personal account is on.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Moderation tab in admin console shell | VC System moderation panel | PRD-21C (Engagement & Community) |
| System tab in admin console shell | User management, family management, system analytics, database maintenance | PRD-32 (Admin Console — System/Platform) |
| Analytics tab in admin console shell | Platform-wide analytics beyond content performance | PRD-32 (Admin Console — System/Platform) |
| `moderation_admin` permission type | Per-tab access control for moderation tab | PRD-21C |
| `system_admin` permission type | Per-tab access control for system tab | PRD-32 |
| `analytics_admin` permission type | Per-tab access control for analytics tab | PRD-32 |
| Content versioning | Version history table and diff view for vault_items | Post-MVP enhancement |
| Scheduled publishing | `scheduled_publish_at` timestamp + cron job for auto-publish | Post-MVP enhancement |
| Automated orphaned image cleanup | Scheduled function to detect and clean orphaned images | Post-MVP enhancement |
| Automated hero rotation | Rules-based auto-featuring (new content, seasonal boost, engagement-based) | Post-MVP enhancement |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| All Vault content created, edited, published, and archived through admin | PRD-21A (Incoming Flows) | Fully wired: Content editor (Screen 2) performs full CRUD on `vault_items` and `vault_prompt_entries`. Category manager (Screen 4) manages `vault_categories`. Image uploads go to Supabase Storage with signed URLs. Publish workflow transitions items through draft → published → archived states. |
| Admin sees content request queue in a format easy to copy-paste into AI | PRD-21A (Screen 7 forward reference) | Fully wired: Content Request Queue (Screen 5) with "Copy All Pending" producing structured export format designed for Claude triage. |
| Per-item admin configuration for NEW badge settings | PRD-21A (NEW Badge System) | Fully wired: NEW Badge Settings section on content editor form (Screen 2, Section 6) with toggles for `is_new`, `first_seen_tracking`, and `new_badge_duration_days`. |
| Admin-curated hero spotlight | PRD-21A (Screen 1, Section A) | Fully wired: `is_featured` toggle and `featured_sort_order` on content editor form (Screen 2, Section 5). |
| Admin-managed categories with sort order | PRD-21A (Screen 1, Section D) | Fully wired: Category Manager (Screen 4) with full CRUD and drag-to-reorder. |
| Inline category creation persisted to vault_categories | V1 bug fix | Fully wired: "Create New" in category dropdown immediately persists to `vault_categories`. Fixes V1 bug where inline categories weren't saved. |

---

## What "Done" Looks Like

### MVP (Must Have)

**Admin Console Shell:**
- [ ] `/admin` route exists, accessible only to users with active `staff_permissions`
- [ ] Tab navigation renders with AI Vault tab. Stub tabs for Moderation, System, Analytics hidden (no permission type records exist for them yet).
- [ ] `super_admin` permission grants access to all tabs
- [ ] `vault_admin` permission grants access to AI Vault tab only
- [ ] Regular users (no staff_permissions) see no admin link and get redirected to home if they navigate to `/admin` directly
- [ ] Back button returns to the regular app experience

**Content Dashboard (Screen 1):**
- [ ] Lists all `vault_items` with thumbnail, title, type badge, category, status icon, view count
- [ ] Status tabs filter by draft/published/archived
- [ ] Search across display_title, detail_title, short_description, tags
- [ ] Filter by content type, category, tier
- [ ] Sort by recent, alphabetical, views, bookmarks
- [ ] Action menu with Edit, Duplicate, View Live, Change Status, Delete
- [ ] Pagination at 25 items per page
- [ ] Prompt pack rows show entry count

**Content Editor (Screen 2):**
- [ ] Content type selector with 6 card buttons (tutorial, ai_tool, prompt_pack, skill, curation, workflow)
- [ ] Core Information section renders for all types with all fields
- [ ] Content-type-specific sections show/hide based on type selection
- [ ] Tutorial fields: content_body, content_url, learning_outcomes, estimated_minutes
- [ ] AI Tool fields: delivery_method, guided_mode_key, tool_url, platform, requires_auth, auth_provider, portal fields
- [ ] Prompt Pack: prompt_format radio, "Manage Entries" button
- [ ] Skill fields: target_platforms, content_body, estimated_setup_minutes
- [ ] Curation type: editor form captures metadata only; "Manage Items" navigates to Screen 3B

**Curation Management (Screens 1 sidebar + 3B):**
- [ ] Curations sidebar on Content Dashboard toggleable open/closed
- [ ] Content rows draggable when sidebar is open
- [ ] Drop content row onto curation → adds item (upsert prevents duplicates)
- [ ] Same item droppable into multiple curations
- [ ] Curations sidebar shows name + item count per curation
- [ ] Clicking a curation in sidebar navigates to Curation Detail (Screen 3B)
- [ ] Curation Detail shows all items with drag-to-reorder handles
- [ ] Remove item from curation (does not delete the item itself)
- [ ] "+ Add Items" picker modal with search, type filter, category filter, tag filter
- [ ] Items already in curation shown as checked in picker
- [ ] Curations cannot contain other curations
- [ ] Workflow fields: content_body, estimated_minutes
- [ ] Access & Visibility section: allowed_tiers checkboxes, teen_visible, enable_lila_optimization, lila_optimization_prompt
- [ ] Featured & Discovery section (collapsed): is_featured, featured_sort_order, ladder_position, display_order
- [ ] NEW Badge section (collapsed): is_new, first_seen_tracking, new_badge_duration_days
- [ ] Seasonal & Gift Tags section (collapsed): seasonal_tags, gift_idea_tags, seasonal_priority
- [ ] Usage Limits section (AI tools only, collapsed): enable_usage_limits, limit_type, limit_amount, session_timeout
- [ ] Status section: Save Draft, Preview, Publish, Archive, Delete with appropriate confirmations
- [ ] Status transitions work: Draft ↔ Published → Archived → Draft
- [ ] Hard delete requires typing "DELETE" to confirm
- [ ] `last_published_at` set on publish
- [ ] Category dropdown populated from `vault_categories` with "Create New" option
- [ ] "Create New" category persists immediately to `vault_categories` (V1 bug fix)
- [ ] Thumbnail and preview image upload to Supabase Storage
- [ ] Form loads existing data correctly when editing
- [ ] `requires_auth` checkbox present and functional (V1 bug fix)
- [ ] Only `allowed_tiers` submitted — no `required_tier` field (V1 bug fix)

**LiLa Suggestions:**
- [ ] "Suggest with LiLa" button active when full_description has content
- [ ] LiLa returns display_title, detail_title, tags, category, and curation suggestions
- [ ] Each suggestion has Accept/Dismiss controls
- [ ] Accepted suggestions populate form fields
- [ ] Curation suggestions shown as chips with [Add] button (works after item is saved)
- [ ] Admin can edit after accepting

**Prompt Pack Entry Manager (Screen 3):**
- [ ] Entry list with drag-to-reorder
- [ ] Add entry with title, prompt_text, variable_placeholders, example_outputs, reference_images, tags
- [ ] Edit existing entries
- [ ] Delete entries with confirmation
- [ ] Example output image upload (up to 10 per entry)
- [ ] Reference image upload (up to 5 per entry)
- [ ] Sort order persisted on drag

**Category Manager (Screen 4):**
- [ ] List all categories with icon, name, status, item count
- [ ] Drag-to-reorder updates sort_order
- [ ] Inline edit: display_name, description, icon, color, is_active
- [ ] Create new category
- [ ] Cannot delete category with active items
- [ ] Hidden categories remove browse row but don't affect item accessibility

**Content Request Queue (Screen 5):**
- [ ] List all `vault_content_requests` with status tabs
- [ ] Status transitions: pending → reviewed → planned → completed / declined
- [ ] Admin notes editable per request
- [ ] "Copy All Pending" exports structured text to clipboard
- [ ] Individual "Copy" per request

**Content Analytics (Screen 6):**
- [ ] Summary metrics: published count, total views, total copies, total bookmarks
- [ ] Per-item table with views, bookmarks, copies, progress stats, sessions
- [ ] Sortable by each metric column
- [ ] Date range filter
- [ ] Content mix breakdown by ladder_position
- [ ] Request trends summary
- [ ] "Copy Report" exports structured analytics text to clipboard

**Image Manager (Screen 7):**
- [ ] Storage usage summary
- [ ] Orphaned image detection (manual trigger)
- [ ] Orphaned image list with checkboxes and thumbnails
- [ ] Select all / delete selected with confirmation
- [ ] Deletion removes files from Supabase Storage

**Data Integrity:**
- [ ] RLS verified: only users with `staff_permissions` can write to `vault_items`, `vault_categories`, `vault_prompt_entries`
- [ ] RLS verified: `vault_content_requests` — users can create/read own, admins can read/update all
- [ ] Image uploads create files in the correct storage buckets with signed URL access
- [ ] Image deletion removes files from Supabase Storage (fixes V1 orphaned image bug)
- [ ] Category creation from the editor form persists to `vault_categories` (fixes V1 inline category bug)

### MVP When Dependency Is Ready
- [ ] Moderation tab content (when PRD-21C is built)
- [ ] System and Analytics tab content (when PRD-32 is built)
- [ ] "Manage admin users" UI for adding/removing staff_permissions (when PRD-32 is built)

### Post-MVP
- [ ] Content versioning — version history table, diff view, rollback to previous version
- [ ] Scheduled publishing — `scheduled_publish_at` field + cron job for auto-publish
- [ ] Automated orphaned image cleanup — scheduled function (weekly or monthly)
- [ ] Automated hero rotation — rules-based auto-featuring (new content boost, seasonal auto-promote, engagement-based featuring)
- [ ] Bulk operations — select multiple items, bulk status change, bulk tier update, bulk category reassign
- [ ] Content duplication with linked entries (duplicate a prompt pack including all entries)
- [ ] Import/export — export Vault items as JSON, import from a structured file
- [ ] Concurrent editing detection — "modified by another admin" warning
- [ ] Admin activity log — who created/edited/published/archived what, when

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: **Admin Console Shell** lives at `/admin` with tabbed navigation. Each tab has a permission type from `staff_permissions`. `super_admin` accesses all tabs. Tabs are hidden (not disabled) for admins without the required permission.
- [ ] Convention: The admin console is **completely separate from the family shell system**. It uses `staff_permissions` for access control, not `member_permissions`. It is never visible in any family member shell's sidebar.
- [ ] Convention: **Hardcoded super admin emails** (`tenisewertman@gmail.com`, `aimagicformoms@gmail.com`, `3littlelanterns@gmail.com`) always have `super_admin` permission. This supplements (not replaces) `staff_permissions` table checks.
- [ ] Convention: **Content status transitions**: Draft ↔ Published → Archived → Draft (unarchive). Hard delete is a separate destructive action requiring explicit confirmation. `last_published_at` is set on each Draft → Published transition.
- [ ] Convention: **Vault content editor is one adaptive form** with sections that show/hide based on `content_type`. Content type is set at creation and cannot change after.
- [ ] Convention: **Category creation from content editor** must immediately persist to `vault_categories`. No orphaned/unlinked categories (V1 bug fix).
- [ ] Convention: **Image uploads** go to `vault-thumbnails` (thumbnails + preview images) and `vault-prompt-images` (example outputs + reference images) Supabase Storage buckets. All images served via signed URLs.
- [ ] Convention: **Image deletion** must remove files from Supabase Storage, not just clear URL fields (V1 bug fix).
- [ ] Convention: **V2 uses only `allowed_tiers` for tier access control**. The V1 `required_tier` field is removed. No dual-field confusion.
- [ ] Convention: **Admin analytics are content-performance focused**, not user-tracking focused. Per-item aggregate metrics only. User-level analytics (if ever needed) are PRD-32 scope.
- [ ] Convention: **Content request export format** uses `=== VAULT CONTENT REQUESTS ===` delimiters with numbered requests for Claude-friendly batch processing.
- [ ] Convention: **LiLa content suggestions** are a single API call returning structured metadata, not a conversation. Suggestions are always reviewed before accepting — never auto-populated.
- [ ] Convention: **`tool_collection` content type renamed to `curation`** in V2. Display name is "Curation." Database `content_type` value is `curation`. Underlying `vault_collection_items` join table unchanged. A curation is an editorial bundle — a curated playlist of Vault items grouped for a specific purpose.
- [ ] Convention: **Curation building uses drag-from-dashboard + picker modal** as complementary methods. Drag-and-drop for fast visual bundling. Picker modal with search/filter/tag for deliberate selection. Both write to `vault_collection_items`.
- [ ] Convention: **LiLa suggests curation assignments** alongside titles, tags, and category when "Suggest with LiLa" is clicked. Curation suggestions are presented as chips with [Add] buttons, only functional after the item has been saved.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: None (all tables defined in PRD-21A)
Columns added: `last_published_at` (TIMESTAMPTZ, nullable) on `vault_items`
Permission types registered: `vault_admin`, `moderation_admin` (stub), `system_admin` (stub), `analytics_admin` (stub) in `staff_permissions.permission_type`
Supabase Storage buckets defined: `vault-thumbnails`, `vault-prompt-images`
Triggers added: None

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Unified Admin Console Shell with tabbed navigation at `/admin`** | Prevents V1's problem of three separate admin routes requiring clicking between different pages. One location, tab-scoped permissions. Shell defined here as the first admin PRD; future PRDs add tabs. |
| 2 | **Per-tab permissions via `staff_permissions.permission_type`** | Different admins can access different areas. Super admin accesses everything. Granular control without building a complex RBAC system. |
| 3 | **One adaptive form for all content types** | Cleaner than V1's 1090-line monolith, but still one form rather than 6 separate forms. Sections show/hide based on content_type. Familiar pattern from V1, improved organization. |
| 4 | **V2 uses only `allowed_tiers` — `required_tier` removed** | V1 submitted both fields with no reconciliation. `allowed_tiers` (array of permitted tiers) is the single model decided in PRD-21A. |
| 5 | **LiLa content suggestions as a single API call, not a conversation** | Admin is in a form-filling workflow. A "Suggest" button returning structured metadata is faster than a chat interaction. Admin reviews each suggestion individually. |
| 6 | **Prompt pack entries managed on a separate sub-screen** | Parent pack form is already complex. Adding nested entry management inline would make it unwieldy. Drill-down pattern keeps each screen focused. |
| 7 | **Two Supabase Storage buckets for Vault images** | Organizational clarity: thumbnails vs. prompt-related images. Both use signed URLs for content protection. |
| 8 | **No content versioning at MVP — `last_published_at` for basic audit trail** | Full versioning (diffs, rollback) adds significant complexity. The timestamp provides basic "when did this last go live?" information. Schema designed to accommodate future versioning table. |
| 9 | **No scheduled publishing at MVP — architecture supports adding it** | Scheduled publishing requires a cron job or edge function. Status field can accept a 'scheduled' value and `scheduled_publish_at` column when ready. |
| 10 | **Analytics presented in Claude-pasteable structured text format** | Admin doesn't need to understand database queries. Copy a structured report, paste into Claude, ask "what should I create next?" Analytics serve content strategy, not technical analysis. |
| 11 | **Hard delete requires typing "DELETE" to confirm** | Destructive action that removes user data (bookmarks, progress). Deliberate friction prevents accidents. Archive is the preferred removal method. |
| 12 | **Orphaned image cleanup is manual at MVP** | The scan (comparing Storage files to DB URLs) can be expensive. Manual trigger with loading indicator is sufficient. Automated scheduled cleanup is post-MVP. |
| 13 | **Category creation from editor persists immediately** | Fixes V1 bug where inline-created categories weren't saved to `library_categories`. In V2, "Create New" in the category dropdown saves to `vault_categories` before returning to the editor form. |
| 14 | **Admin console not visible in any family shell sidebar** | Admin and family are separate modes of operation. A subtle link in the user menu (visible only to staff) connects the two. No sidebar pollution. |
| 15 | **`tool_collection` content type renamed to `curation` in display and UX** | "Curation" describes what the admin is doing — curating a bundle of items for a purpose. "Tool collection" was generic and confusing. The `content_type` database value becomes `curation` (PRD-21A schema impact). The underlying `vault_collection_items` join table stays the same. |
| 16 | **Drag-from-dashboard + picker modal for curation building** | Two complementary methods: drag-and-drop from the content list into the curations sidebar for fast visual building, and a search/filter/checkbox picker modal for deliberate selection. Same underlying data writes. Mirrors StewardShip's Manifest Collections UX. |
| 17 | **LiLa suggests curation assignments alongside titles and tags** | When LiLa knows the item's content and can see existing curations, suggesting which bundles an item fits in saves the admin from remembering every curation they've created. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Content versioning (version history, diffs, rollback) | Post-MVP enhancement. Schema supports future `vault_item_versions` table. |
| 2 | Scheduled publishing | Post-MVP. Add `scheduled_publish_at` column + edge function. |
| 3 | Automated orphaned image cleanup | Post-MVP. Convert manual scan to scheduled function. |
| 4 | Automated hero rotation | Post-MVP. Rules engine for auto-featuring based on newness, season, engagement. |
| 5 | Bulk operations | Post-MVP. Multi-select + batch status change, tier update, category reassign. |
| 6 | Admin user management UI | PRD-32 (Admin Console — System/Platform). At MVP, staff_permissions managed via database. |
| 7 | Moderation tab content | PRD-21C (Engagement & Community). |
| 8 | System/Analytics tab content | PRD-32. |
| 9 | Concurrent editing detection | Post-MVP. Relevant only when multiple admins are active. |
| 10 | Admin activity log | Post-MVP. Audit trail of who did what when. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-02 (Permissions & Access Control) | New permission types registered: `vault_admin`, `moderation_admin` (stub), `system_admin` (stub), `analytics_admin` (stub). Admin console uses `staff_permissions` table with these types. | Add permission types to Feature Key Registry. Note that admin console permissions are `staff_permissions` types, not `member_permissions` feature keys. |
| PRD-04 (Shell Routing & Layouts) | `/admin` route defined outside the family shell system. Not in any sidebar. Accessed via user menu link (staff-only visibility) or direct URL. | Add `/admin` to route configuration as a staff-only route outside shell routing. Note admin console shell as a separate routing context. |
| PRD-21A (AI Vault — Browse & Content Delivery) | `last_published_at` column added to `vault_items`. All admin-side stubs from PRD-21A are now fully wired (content CRUD, category management, request queue, hero spotlight, NEW badge configuration). | Add `last_published_at` to `vault_items` schema. Mark all PRD-21B-referenced stubs as wired. |
| Build Order Source of Truth | PRD-21B completed. Admin Console Shell framework established. Supabase Storage buckets defined. V1 bug fixes documented. LiLa content suggestion pattern defined. | Update Section 2. Note admin console shell as a shared framework. Add storage bucket conventions. |

---

*End of PRD-21B*
