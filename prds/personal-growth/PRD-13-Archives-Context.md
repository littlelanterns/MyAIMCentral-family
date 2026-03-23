# PRD-13: Archives & Context

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup — member roles, family structure, Out of Nest designation), PRD-02 (Permissions & Access Control — PermissionGate, mom-sees-all model, teen transparency, View As), PRD-03 (Design System & Themes — visual tokens, card styling), PRD-04 (Shell Routing & Layouts — page routing, nav placement), PRD-05 (LiLa Core AI System — context assembly pipeline, `is_included_in_ai` pattern, three-tier toggles, Privacy Filtered category, guided mode registry), PRD-05C (LiLa Optimizer — context presets, context learning detection, cross-reference note for write-back), PRD-06 (Guiding Stars & Best Intentions — context source, faith removed in favor of Archives), PRD-07 (InnerWorkings — context source, "checked somewhere checked everywhere" convention, Archive person card aggregation), PRD-08 (Journal + Smart Notepad — context source, Review & Route routing), PRD-09B (Lists Studio — Share with Archive pattern for wishlists and other lists), PRD-12A (Personal LifeLantern — Personal Vision Statement context source), PRD-12B (Family Vision Quest — Family Vision Statement context source)
**Created:** March 10, 2026
**Last Updated:** March 10, 2026

---

## Overview

Archives & Context is the platform's context management engine — the central place where everything LiLa knows about a family is organized, controlled, and made visible. It is not a feature families interact with for its own sake; it is the infrastructure that makes every other feature smarter. When LiLa crafts a homework prompt that knows Jake is a visual learner who loves Minecraft, that knowledge lives in Archives. When the Optimizer builds a meal plan prompt that respects the family's faith-based dietary practices, those preferences flow through Archives. When mom exports her family context to use with ChatGPT or Claude, Archives assembles and formats it.

Archives serves three audiences simultaneously: **mom** (who curates, organizes, and controls all family context), **LiLa** (who reads context through the assembly pipeline defined in PRD-05), and **the Optimizer** (who pulls context through presets defined in PRD-05C). Mom is the only family member who browses Archives directly — she can grant dad browsing access through the permission system, but no other role sees Archives as a feature. Everyone else's data flows *through* Archives invisibly, surfacing only in the AI interactions it powers.

The architecture follows three foundational principles established across prior PRDs. First, **"checked somewhere, checked everywhere"** — data lives in its source feature table and Archives surfaces it as a live reference, never a copy. When an InnerWorkings entry has `is_included_in_ai = true`, the same entry appears on that person's Archive card with the same state, because Archives queries the source table at render time. Second, **the three-tier toggle system** (person → category → item) from PRD-05 gives mom granular control without per-conversation setup. Third, **Privacy Filtered is a hard system-enforced boundary** — sensitive content is never included in non-mom contexts regardless of other permission settings.

> **Mom experience goal:** Archives should feel like a beautifully organized family intelligence center — a place where mom can see at a glance what LiLa knows about each person and the family as a whole, and confidently control what gets shared. It should never feel like a database or a settings panel. The experience is: "I know exactly what my AI knows about us, and I'm in charge of it."

---

## User Stories

### Context Organization
- As a mom, I want each family member to have their own Archive folder so I can organize context about each person separately.
- As a mom, I want to create any folder I want (by topic, project, or theme) so my context organization matches how I think, not how the app thinks.
- As a mom, I want to add context items about my kids — preferences, schedules, medical info, personality observations — so LiLa knows the things I know about my family.
- As a mom, I want to see everything LiLa knows about a person in one place, including data from InnerWorkings, Guiding Stars, Best Intentions, and LifeLantern, so I have a complete picture without visiting five different features.

### Context Control
- As a mom, I want checkbox controls on every context item so I can include or exclude anything from LiLa's awareness without deleting it.
- As a mom, I want to toggle all context for a person on or off with one tap so I can quickly adjust what LiLa sees.
- As a mom, I want a Privacy Filtered section where sensitive items are kept out of everyone else's AI interactions, even if other sharing permissions are open.
- As a mom, I want to see a summary indicator ("Gleaning context from 17/28 insights") so I know at a glance how much context is active without opening every folder.

### Family Overview
- As a mom, I want a Family Overview Card that captures our family's personality, rhythms, and dynamics — the things that make us *us* — so LiLa understands our family as a whole, not just as individual people.
- As a mom, I want to set up our family's faith preferences so LiLa can weave faith context into conversations when it's relevant, without forcing it when it isn't.
- As a mom, I want Family Vision Quest content and family meeting notes to feed into the Family Overview so our shared vision stays part of our family intelligence.

### Context Learning
- As a mom, I want LiLa to notice when I mention new family information in conversation and offer to save it to the right person's Archive so my context stays current without manual data entry.
- As a mom, I want to approve, edit, or dismiss every suggested save so nothing goes into Archives without my explicit consent.
- As a mom, I want a "Recently Added by LiLa" filter so I can review everything LiLa helped me save.

### Context Export
- As a mom, I want to export my family's checked context as a clean text file so I can paste it into any AI platform's system prompt and get the same personalized responses I get from LiLa.

### Out of Nest
- As a mom, I want Archive folders for my adult children who've left home — and their spouses and children — so LiLa can still help me communicate with them, shop for gifts, and remember what matters to them, even though they don't have a dashboard.
- As a mom, I want Out of Nest members tucked away in a collapsible section so they don't clutter my daily view — I only need them when I'm specifically thinking about that person.

### Share with Archive (Lists Integration)
- As a mom, I want to share any list (wishlist, gift ideas, grocery list) to a family member's Archive folder so LiLa can reference it when relevant.
- As a teen, I want to create my own wishlist that mom can see in my Archive, so people know what I actually want for gifts.

### Dad Access
- As a dad who's been granted Archive browsing access by mom, I want to view Archive cards for the kids I have access to so I can see the same family intelligence mom sees.

---

## Screens

### Screen 1: Archives Main Page

> **Mom experience goal:** Walking into Archives should feel like opening a beautifully organized family file — each person represented, the family as a whole captured, and clear indicators showing what's active and what's not.

**What the user sees:**
- Page title: "Archives"
- Contextual subtitle (muted): "Everything LiLa knows about your family."
- **Family Overview Card** at the top — a special card representing the family as a whole. Shows family name, family photo (optional), and section summaries (Family Personality, Rhythms & Routines, Current Focus, Faith & Values). Summary indicator: "Family context: X items active." Tap to open Family Overview detail (Screen 3).
- **Member Archive Cards** below, one per family member (including Out of Nest members). Each card shows:
  - Member name, avatar, role badge
  - Out of Nest badge (if applicable)
  - Summary indicator: "Gleaning context from X/Y insights"
  - Quick preview of active context categories with item counts
  - `is_included_in_ai` master toggle for this entire person (person-level of three-tier system)
  - Tap to open Member Archive detail (Screen 2)
- Member cards are ordered: in-household members first (by family_members sort order)
- **Out of Nest section** — a collapsible section below in-household members, collapsed by default. Header shows "Out of Nest ([count])" with expand/collapse chevron. When expanded, shows Archive cards for all Out of Nest members (adult children, their spouses, grandchildren). Collapse state persists across sessions.

> **Decision rationale:** Out of Nest members are important for gift planning and communication coaching but are not part of daily family management. Collapsing them by default keeps the Archives main page focused on the people mom interacts with every day, while keeping Out of Nest members one tap away when needed.
- **Privacy Filtered section** at the bottom — visually distinct (muted background, lock icon). Shows count of items in the privacy-filtered category. Tap to open Privacy Filtered management (Screen 5).
- Floating action button: "Add Context" — opens a flow to add a standalone context item (member picker → folder picker/create → item entry)

**Interactions:**
- Tap Family Overview Card → Screen 3
- Tap a Member Archive Card → Screen 2
- Tap Privacy Filtered section → Screen 5
- Tap person-level `is_included_in_ai` toggle → optimistic toggle, syncs to server. Toggling a person OFF pauses all their context from LiLa without changing individual item states (a "snooze" for the whole person). Toggling back ON restores previous item states.
- Tap "Add Context" FAB → inline flow: select member → select/create folder → enter context item
- Tap "Export Context" in page header menu → Screen 6

**Data created/updated:**
- Person-level `is_included_in_ai` state (stored on `archive_member_settings`)

---

### Screen 2: Member Archive Detail

**What the user sees:**
- Header: member name, avatar, role badge, Out of Nest badge (if applicable)
- Summary indicator: "Gleaning context from X/Y insights"
- Person-level `is_included_in_ai` master toggle (same as on the card)
- **Auto-Generated Overview Card** — a compact "baseball card" summary of everything known about this person, auto-generated from all active context items and aggregated source data. Shows key facts organized by theme. Each fact line has its own checkbox. The overview card regenerates when content changes.

> **Decision rationale:** The overview card is generated by a Haiku call summarizing all active context for the person. It serves as a scannable digest — mom doesn't have to open every folder to see what LiLa knows. Individual checkboxes on overview lines control whether that specific fact is included in context, but the overview itself is always regenerated from source data.

- **Context folders** listed below the overview card, each showing:
  - Folder name and icon
  - Item count (active/total)
  - Category-level `is_included_in_ai` toggle (category level of three-tier system)
  - Expand/collapse to see individual items
  - System-created category folders appear first (Preferences, Schedule & Activities, etc.), followed by user-created folders
- **Aggregated context sources** — sections for data from other features, each clearly labeled with the source feature name:
  - **InnerWorkings** — live references to `self_knowledge` entries for this member. Each entry shows text, category tag, source indicator, and the `is_included_in_ai` checkbox (same state as on the InnerWorkings page — "checked somewhere, checked everywhere")
  - **Guiding Stars** — live references to `guiding_stars` entries for this member
  - **Best Intentions** — live references to active `best_intentions` entries for this member
  - **LifeLantern** — live reference to the active `personal_vision_statements` entry (if exists), plus per-area content summaries
  - **Shared Lists** — live references to any lists shared to this member's Archive via the "Share with Archive" pattern (wishlists, gift ideas, etc.)
  - Each aggregated section shows the source feature icon and a "View in [Feature]" link that navigates to the source feature page
- **Wishlist folder** (if exists) — a folder with `folder_type = 'wishlist'` containing gift-related items. May include items mom added, items the member added to their own wishlist (for teens), or items routed from Lists via Share with Archive.
- **"Recently Added by LiLa" filter** — toggleable filter that shows only items added via context learning, sorted by recency

**Interactions:**
- Tap overview card checkbox → toggles that fact's inclusion in AI context
- Tap category-level toggle → toggles all items in that folder
- Expand a folder → shows individual items with per-item `is_included_in_ai` checkboxes (item level of three-tier system)
- Tap an individual item → inline edit (for standalone items mom added). For aggregated references, tapping opens the item in its source feature.
- Tap "View in InnerWorkings" (or any source feature link) → navigates to that feature page
- Swipe an item → archive (for standalone items) or "Move to Privacy Filtered" option
- Tap "Add Item" within a folder → inline add form
- Tap folder header → rename, reorder, create subfolder, or delete (user-created folders only; system folders can be renamed but not deleted)
- Long-press folder → drag to reorder
- Tap "Recently Added by LiLa" → filter toggles on/off

**Data created/updated:**
- `archive_context_items` records (standalone items)
- `is_included_in_ai` toggles on source feature tables (for aggregated references — the toggle call updates the source table, not an Archives copy)
- `archive_member_settings` (person-level toggle)
- `archive_overview_cards` (regenerated when content changes)

---

### Screen 3: Family Overview Card Detail

> **Mom experience goal:** The Family Overview should feel like reading a warm, living description of your family — not filling out a form. The sections should feel like pages in a family story, not configuration panels.

**What the user sees:**
- Header: family name, family photo (optional, tappable to upload/change)
- Four content sections, each expandable with its own `is_included_in_ai` category toggle:

**Family Personality:**
- Core values, communication style, conflict resolution, decision-making approach, financial philosophy
- Each item is a context item with its own checkbox
- "Add" button for new items
- "Build with LiLa" button — opens LiLa in general mode with Family Overview context pre-loaded, LiLa asks warm questions to help articulate family personality

**Rhythms & Routines:**
- Morning flow, bedtime routine, weekend patterns, annual traditions, seasonal rhythms
- Same item structure with checkboxes

**Current Focus:**
- Season of life, big changes approaching, current challenges, current wins
- Same item structure

**Faith & Values:**
- Summary of faith preferences (if configured): tradition name, key observances, relevance setting
- "Edit Faith Preferences" button → opens faith preferences modal (Screen 4)
- Additional faith-related context items mom has added manually
- `is_included_in_ai` toggle controls whether faith context is available to LiLa (separate from the faith relevance setting which controls *when* LiLa uses it)

**Aggregated family-level context:**
- **Family Vision Statement** — live reference to the active `family_vision_statements` entry from PRD-12B (if exists). Shows preview with "View in Family Vision Quest" link.
- **Family Guiding Stars** — live references to `guiding_stars` entries where `owner_type = 'family'`
- **Family Meeting Notes** — context items from meetings routed to the Family Archive (via manual add or future Meetings PRD routing)

**Bottom summary:**
- Total active context items count
- Last updated timestamp
- "Export Family Context" button

**Interactions:**
- Tap a section header → expand/collapse
- Tap section-level `is_included_in_ai` toggle → toggles all items in that section
- Tap individual item checkbox → toggle that item
- Tap "Build with LiLa" → opens LiLa drawer for conversational family overview building
- Tap "Edit Faith Preferences" → Screen 4 (modal)
- Tap "View in Family Vision Quest" → navigates to PRD-12B Family Vision Statement page
- Tap "Add" within any section → inline add form
- Edit items inline (tap to edit text, tap away to save)

**Data created/updated:**
- `archive_context_items` records (family-level standalone items)
- `archive_folder_settings` (section-level toggles)
- Family Overview content items

---

### Screen 4: Faith Preferences Modal

> **Depends on:** Faith & Ethics Framework (AIMfM_Faith_Ethics_Framework_Complete.md), FaithAware Addendum (MyAIM-Central_Archives_FaithAware_Addendum.md).

A modal overlay accessible from the Family Overview Card's Faith & Values section, and also from Settings.

**What the user sees:**

**Step 1: Faith Identity (Optional)**
- Faith Tradition dropdown (major world religions + "Spiritual but not religious" + "Prefer not to say" + "Other")
- Specific Denomination/Branch (freeform text)
- Important Observances/Practices (multi-line freeform)
- Sacred Texts or Authorities (multi-line freeform)

**Step 2: Response Approach (checkboxes, select all that apply)**
- Prioritize my faith tradition (answer from our perspective first)
- Include comparative views (show how other traditions approach this)
- Include secular perspectives (show non-religious approaches alongside faith-based ones)
- Educational only (provide information without prescriptive guidance)

**Step 3: Tone & Framing (checkboxes, select all that apply)**
- Use our terminology (use language/terms from our tradition when relevant)
- Respect but don't assume (be aware of our background but don't force religious framing)
- Avoid conflicting teachings (don't suggest practices contrary to our beliefs)

**Step 4: Internal Diversity (checkboxes, select all that apply)**
- Acknowledge diverse perspectives (recognize internal diversity within our tradition)
- We hold minority views (our interpretation may differ from the majority in our tradition)
- Other (freeform text)

**Step 5: Special Instructions**
- Large text area for additional guidance
- Example placeholder: "We take doctrine seriously but recognize cultural practices vs. core teachings..."

**Step 6: Relevance Settings**
- Radio group: Automatic (recommended — LiLa decides when faith context is relevant), Always include, Manual only

**Footer:** Save Preferences / Cancel

**Interactions:**
- Each step is a section in the modal (not a multi-page wizard — all visible, scrollable)
- All fields are optional — the modal can be saved with any subset filled
- Save writes to `faith_preferences` table
- Cancel closes without saving

**Data created/updated:**
- `faith_preferences` record (one per family, UPSERT)

---

### Screen 5: Privacy Filtered Management

> **Decision rationale:** Privacy Filtered is a system-enforced section, not a regular folder. It exists at the Archives level, not within any member's folder tree. Items here are included in mom's own LiLa context but never shared with other family members' tools. This is the hard boundary from PRD-05.

**What the user sees:**
- Header: "Privacy Filtered" with lock icon
- Explanation text: "Items here are included in YOUR LiLa context but never shared with other family members' tools. Sensitive content like mental health details, medical information, and private family matters belongs here."
- Items grouped by member (which person this sensitive item is about)
- Each item shows:
  - Content text
  - Which member it relates to
  - `is_included_in_ai` checkbox (whether even mom's LiLa can see it)
  - Source indicator (how it got here: "AI auto-routed", "Manually moved", "Added directly")
  - "Move to [member]'s Archive" button — moves the item out of Privacy Filtered back to the member's regular Archive (removes the privacy protection)
- "Add Item" button — add a new item directly to Privacy Filtered, selecting which member it relates to
- Visual styling: muted/dark background, lock icon throughout, clearly distinct from regular Archive folders

**Interactions:**
- Tap `is_included_in_ai` checkbox → toggle whether this item appears even in mom's own LiLa context
- Tap "Move to Archive" → confirmation dialog ("This will remove the privacy protection. The item will be visible to any family member with Archive access for [member]. Continue?"), then moves to the member's appropriate folder (auto-suggested, mom can redirect)
- Tap "Add Item" → inline form with member picker and content field

**Data created/updated:**
- `archive_context_items` records with `is_privacy_filtered = true`
- Moving items updates `is_privacy_filtered` and `folder_id`

---

### Screen 6: Context Export

**What the user sees:**
- Header: "Export Family Context"
- Explanation: "Export your family's active context as a text file you can paste into any AI platform's custom instructions or system prompt."
- **Scope selector:**
  - "Export everything" (default) — all checked items across all members and family context
  - "Select specific people" — member checkboxes to include/exclude
  - "Select specific folders" — folder-level selection within each selected member
- **Preview pane:** shows the formatted export text, organized by person then by category. Each item shows its content. Items are grouped clearly with headers.
- **Format:** Markdown (clean, readable, paste-ready)
- **Actions:**
  - "Copy to Clipboard" — copies the full export text
  - "Download as File" — downloads as `.md` file
  - "Open in Notepad" — sends to Smart Notepad for editing before export

**Interactions:**
- Toggle scope selections → preview updates in real time
- Tap Copy → clipboard copy with "Copied!" confirmation
- Tap Download → file download
- Tap "Open in Notepad" → creates Notepad tab with export content

**Data created/updated:**
- No persistent data — export is generated on demand from current context state

> **Forward note:** Post-MVP enhancements include platform-specific formatting (XML for Claude custom instructions, structured prompts for ChatGPT, etc.) and a "Format for..." dropdown. The architecture supports this without refactoring — the export pipeline just needs additional formatters.

---

### Screen 7: Context Learning Save Dialog

This is not a standalone screen — it appears as an inline offer within any LiLa conversation when context learning detects new family information (detection mechanism defined in PRD-05C).

**What the user sees (within the conversation):**

After LiLa delivers her primary response (never interrupting the main flow), a suggestion card appears:

```
📝 I noticed something new:
"Jake doesn't like broccoli anymore"

Save to Jake's Archive?
Folder: Preferences (suggested)

[Save] [Edit Before Saving] [Skip]
```

**Interactions:**
- Tap "Save" → item saved directly to the suggested folder with `is_included_in_ai = true`, `source = 'lila_detected'`. Brief confirmation: "Saved to Jake's Preferences."
- Tap "Edit Before Saving" → inline edit of the content text, plus folder picker (can change the suggested folder or create a new one), plus member picker (in case LiLa associated with the wrong person). Save button confirms.
- Tap "Skip" → dismissed. LiLa does not re-offer this specific information in future conversations (tracked to avoid repetition).

**Data created/updated:**
- `archive_context_items` record with `source = 'lila_detected'`, `source_conversation_id` referencing the LiLa conversation
- `context_learning_dismissals` record (if skipped, to prevent re-offering)

---

## Aggregation Architecture

> **Decision rationale:** Query-time aggregation (not reference rows, not copies) was chosen because it perfectly implements "checked somewhere, checked everywhere" with zero data duplication. The Archive card is a composite view assembled at render time from multiple source tables. This means edits in InnerWorkings instantly appear on the Archive card, toggle changes in either location propagate automatically, and there's no sync logic to maintain.

### How Aggregation Works

When rendering a member's Archive detail (Screen 2), the system queries:

1. **Standalone context items:** `archive_context_items WHERE member_id = X` — items mom added directly in Archives
2. **InnerWorkings:** `self_knowledge WHERE family_member_id = X AND archived_at IS NULL` — live references, grouped by category
3. **Guiding Stars:** `guiding_stars WHERE owner_member_id = X AND archived_at IS NULL` — live references, grouped by type
4. **Best Intentions:** `best_intentions WHERE owner_member_id = X AND is_active = true AND archived_at IS NULL` — active intentions
5. **LifeLantern:** `personal_vision_statements WHERE family_member_id = X AND is_active = true` — active vision statement; `life_lantern_areas WHERE family_member_id = X` — per-area content
6. **Shared Lists:** `lists WHERE archive_member_id = X AND is_shared_to_archive = true` — lists shared to this member's Archive
7. **Journal entries:** `journal_entries WHERE family_member_id = X AND is_included_in_ai = true` — opted-in journal entries

Each source renders in its own labeled section with a "View in [Feature]" link. The `is_included_in_ai` checkbox on aggregated items writes back to the source table — there is no intermediate table for aggregation state.

### For the Family Overview Card

The Family Overview assembles:
1. **Standalone family items:** `archive_context_items WHERE folder_id IN (family overview folder children)`
2. **Family Vision Statement:** `family_vision_statements WHERE family_id = X AND is_active = true` (from PRD-12B)
3. **Family Guiding Stars:** `guiding_stars WHERE family_id = X AND owner_type = 'family'`
4. **Faith Preferences:** `faith_preferences WHERE family_id = X`

### LiLa Context Assembly Integration

> **Depends on:** PRD-05 Context Assembly System — Archives is the backbone of step 4 ("Apply three-tier toggles") in the context assembly pipeline.

When the LiLa context assembly pipeline runs (PRD-05), it queries Archives data through the same aggregation pattern:

1. Identify which people are relevant (from mode's person selector or conversation context)
2. For each relevant person, load all context items where `is_included_in_ai = true` at person, category, AND item level
3. Apply Privacy Filtered exclusion for non-mom contexts
4. Apply context preset filters (PRD-05C) to select relevant categories
5. Format into the system prompt's context section

Archives does not store a separate "context bundle" — the context assembly pipeline queries source tables directly, filtered by the three-tier toggle states. Archives provides the *organizational layer* (folders, categories, the overview card) and the *standalone items layer* (things mom added that don't belong to another feature). The aggregation of other features' data happens at query time.

---

## Share with Archive Pattern

> **Decision rationale:** A general-purpose pattern rather than wishlist-specific because many list types benefit from Archive integration (grocery lists for meal planning context, reading lists for homeschool context, etc.). The pattern works identically regardless of list type.

Any list in Lists Studio (PRD-09B) can be shared to a family member's Archive folder.

### How It Works

1. On any list in Lists Studio, mom (or a teen for their own list) toggles "Share with Archive" → ON
2. **Member picker:** "Whose Archive should this appear in?" — defaults to the list owner. Mom can select any family member (including creating a list on behalf of a younger child).
3. **Folder picker:** "Which folder?" — shows the target member's Archive folders with an option to create a new folder.
4. The list now appears as a live reference in the selected member's Archive folder. Edits to the list happen in Lists Studio; Archives always shows the current state.
5. When `is_included_in_ai = true` on the list (controlled in either Lists or Archives), LiLa can reference the list's items in relevant conversations (Gifts mode, Meal Planning, etc.)

### Data Model

The list stores the Archive routing:
- `lists.is_shared_to_archive` (BOOLEAN) — whether this list is shared to an Archive
- `lists.archive_member_id` (UUID, nullable) — which member's Archive it's shared to (FK → family_members)
- `lists.archive_folder_id` (UUID, nullable) — which Archive folder it appears in (FK → archive_folders)

No data is copied. Archives queries `lists WHERE archive_member_id = X AND is_shared_to_archive = true` to render shared lists on the member's Archive card.

### Wishlist Specifics

- Wishlists are lists created with a "Wishlist" template type in Lists Studio
- Teens and Guided members can create their own wishlists
- Mom can create wishlists on behalf of younger children (the list's `archive_member_id` determines whose Archive card it appears on)
- Items checked off in the wishlist (purchased/given) are preserved in list history but excluded from active Archive display
- The member who owns the wishlist never sees their Archive card — only mom (and dad if granted access) sees the wishlist aggregated on the Archive card

---

## Context Learning Write-Back

> **Depends on:** PRD-05C Context Learning Detection — defines the detection triggers (preference changes, schedule info, personality observations, milestones, relationship dynamics, medical/dietary), the Haiku-scan process, and the "Want me to save that?" offer UI. This section defines the Archives side: the write-back endpoint, folder routing, and save flow.

### Write-Back Endpoint

When mom approves a context learning save (from the dialog in Screen 7):

1. **Identify the member:** LiLa's detection identifies which family member the new information is about
2. **Suggest the folder:** Based on the content type (preference → Preferences folder, schedule → Schedule & Activities, medical → Health & Medical, etc.), LiLa suggests the appropriate folder. The suggestion is rule-based:

| Detected Content Type | Suggested Folder |
|---|---|
| Food preference, like/dislike | Preferences |
| Schedule, recurring activity | Schedule & Activities |
| Personality observation, behavioral pattern | Personality & Traits |
| Interest, hobby, favorite thing | Interests & Hobbies |
| School, grade, teacher, academic | School & Learning |
| Allergy, medication, medical, health | Health & Medical |
| Everything else | General |

3. **Save the item:** Creates an `archive_context_items` record with:
   - `source = 'lila_detected'`
   - `source_conversation_id` pointing to the LiLa conversation where it was detected
   - `is_included_in_ai = true` (default)
   - `is_privacy_filtered` = AI's assessment of whether this should be privacy-filtered (mom can override)
   - If the AI flags it as sensitive (mental health, medical, trauma-related), it auto-routes to Privacy Filtered with a note explaining why

4. **No review queue:** Mom already reviewed and approved in the conversation dialog. The item is immediately active in Archives.

### Smart Question Filtering Integration

The Optimizer's smart question filtering (PRD-05C) checks Archives before asking clarifying questions. When assembling the "known" context map, it queries all `archive_context_items` with `is_included_in_ai = true` for the relevant members, plus all aggregated source data. This ensures LiLa never asks "what are Jake's food allergies?" when that information is already in Jake's Health & Medical folder.

### Dismissal Tracking

When mom taps "Skip" on a context learning offer, the system records:
- What information was offered
- Which conversation it was detected in
- A content hash to prevent re-offering the same fact

LiLa will not re-offer the same information in future conversations. If the information evolves (e.g., "Jake likes broccoli again" after previously dismissing "Jake hates broccoli"), LiLa can offer the updated version since the content hash differs.

---

## Visibility & Permissions

> **Depends on:** PRD-02 (Permissions & Access Control) — mom-sees-all model, PermissionGate, teen transparency.

| Role | Access | Notes |
|------|--------|-------|
| **Mom / Primary Parent** | Full access. Browse all Archive folders, all members, all context. Create, edit, delete standalone items. Manage all toggles. Privacy Filtered management. Context export. Faith preferences. Family Overview. | Primary and default user. |
| **Dad / Additional Adult** | Permission-gated. Mom can grant dad browsing access to Archives — either full or scoped to specific children. When granted, dad sees member Archive cards for permitted children (read-only by default; mom can grant edit access). Dad cannot see Privacy Filtered items. | Dad never sees Archives unless mom explicitly grants access. |
| **Special Adult** | Not present. Special Adults have no Archives access. | |
| **Independent (Teen)** | Not present. Teens manage their own data in source feature pages (InnerWorkings, Guiding Stars, etc.). They can create wishlists in Lists Studio that route to their Archive. They never browse Archives directly. | Teen's own data feeds into Archives invisibly. |
| **Guided / Play** | Not present. | |

### Shell Behavior

| Shell | Archives Access |
|-------|----------------|
| Mom | Full Archives experience — main page, member cards, Family Overview, Privacy Filtered, export, faith preferences, context learning saves |
| Dad / Additional Adult | Permission-gated. If mom grants access: read-only Archive cards for permitted children. No Family Overview editing, no Privacy Filtered, no faith preferences, no export. Mom can upgrade to edit access per-member. |
| Special Adult | Not present |
| Independent (Teen) | Not present |
| Guided / Play | Not present |

> **Decision rationale:** Archives is mom-only by default because it is the family's context control center — mom's vantage point for understanding and managing what AI knows about her family. Granting dad optional access respects co-parenting needs without defaulting to shared control. Privacy Filtered is always mom-only — no other role should see sensitive context management.

### Privacy & Transparency

- Mom sees everything in Archives (all members, all folders, all items) by default
- Dad (when granted access) sees member cards for permitted children but NOT Privacy Filtered items, NOT other adults' personal context, NOT faith preferences management
- Teens are informed (per PRD-02 conventions) that mom has visibility into their context, but they do not interact with Archives directly
- Items in Privacy Filtered are never visible to any family member except mom, regardless of other permission settings
- When mom toggles `is_included_in_ai` on an aggregated reference (e.g., an InnerWorkings entry), the toggle updates the source table — the change is visible in both Archives and the source feature page

---

## Data Schema

### Table: `archive_folders`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| parent_folder_id | UUID | | NULL | FK → archive_folders (self-referencing for nesting) |
| member_id | UUID | | NULL | FK → family_members. NULL for family-level folders. |
| folder_name | TEXT | | NOT NULL | Display name |
| folder_type | TEXT | 'custom' | NOT NULL | CHECK: 'member_root', 'family_overview', 'system_category', 'wishlist', 'custom' |
| icon | TEXT | | NULL | Icon identifier |
| color_hex | TEXT | | NULL | Optional folder color |
| description | TEXT | | NULL | Optional folder description |
| is_system | BOOLEAN | false | NOT NULL | System-created folders (member roots, default categories) cannot be deleted |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Category-level toggle (category tier of three-tier system) |
| sort_order | INTEGER | 0 | NOT NULL | Display order within parent |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Mom can CRUD all folders for her family. Dad (with granted access) can read folders for permitted children. No other role access.

**Indexes:**
- `(family_id, member_id, parent_folder_id)` — folder tree for a member
- `(family_id, folder_type)` — find all folders of a specific type

**Trigger:**
```sql
CREATE TRIGGER set_updated_at BEFORE UPDATE ON archive_folders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### Table: `archive_context_items`

Standalone context items that mom adds directly to Archives. These are NOT copies of data from other features — those are aggregated at query time.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| folder_id | UUID | | NOT NULL | FK → archive_folders |
| member_id | UUID | | NULL | FK → family_members. Which member this item is about. NULL for family-level items. |
| context_field | TEXT | | NOT NULL | Short label/title for the item |
| context_value | TEXT | | NOT NULL | The actual content/value |
| context_type | TEXT | 'general' | NOT NULL | CHECK: 'preference', 'schedule', 'personality', 'interest', 'academic', 'medical', 'wishlist_item', 'family_personality', 'family_rhythm', 'family_focus', 'faith_context', 'meeting_note', 'general' |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Item-level toggle (item tier of three-tier system) |
| is_privacy_filtered | BOOLEAN | false | NOT NULL | Whether this item is in the Privacy Filtered category |
| source | TEXT | 'manual' | NOT NULL | CHECK: 'manual', 'lila_detected', 'review_route', 'list_shared' |
| source_conversation_id | UUID | | NULL | FK → lila_conversations (for context learning saves) |
| source_reference_id | UUID | | NULL | General FK for routing traceability |
| added_by | UUID | | NOT NULL | FK → family_members (who added this item) |
| usage_count | INTEGER | 0 | NOT NULL | How many times LiLa has referenced this item |
| last_used_at | TIMESTAMPTZ | | NULL | Last time LiLa referenced this item |
| link_url | TEXT | | NULL | Optional URL (for wishlist items, resources, etc.) |
| price_range | TEXT | | NULL | Optional price range (for wishlist items) |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Mom can CRUD all items for her family. Dad (with granted access) can read items for permitted children (excluding `is_privacy_filtered = true`). No other role access.

**Indexes:**
- `(folder_id, is_included_in_ai, archived_at)` — active items in a folder
- `(family_id, member_id, is_included_in_ai, is_privacy_filtered, archived_at)` — context assembly query
- `(family_id, source, created_at DESC)` — "Recently Added by LiLa" filter
- `(family_id, member_id, context_type)` — items by type for a member

**Trigger:**
```sql
CREATE TRIGGER set_updated_at BEFORE UPDATE ON archive_context_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### Table: `archive_member_settings`

Per-member Archive settings, primarily the person-level toggle.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Person-level master toggle (person tier of three-tier system) |
| overview_card_content | TEXT | | NULL | Auto-generated overview card text |
| overview_card_updated_at | TIMESTAMPTZ | | NULL | When the overview card was last regenerated |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**Unique constraint:** `(family_id, member_id)` — one settings record per member.

**RLS Policy:** Mom can CRUD. Dad can read for permitted children.

---

### Table: `faith_preferences`

Family-level faith configuration. One record per family.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families. UNIQUE. |
| faith_tradition | TEXT | | NULL | Selected tradition or "Other" |
| denomination | TEXT | | NULL | Specific denomination/branch |
| observances | TEXT[] | '{}' | NOT NULL | Important practices |
| sacred_texts | TEXT[] | '{}' | NOT NULL | Referenced texts/authorities |
| prioritize_tradition | BOOLEAN | false | NOT NULL | Answer from our perspective first |
| include_comparative | BOOLEAN | false | NOT NULL | Show other traditions' approaches |
| include_secular | BOOLEAN | false | NOT NULL | Show non-religious approaches |
| educational_only | BOOLEAN | false | NOT NULL | Information only, no prescriptive guidance |
| use_our_terminology | BOOLEAN | false | NOT NULL | Use faith-specific language |
| respect_but_dont_assume | BOOLEAN | true | NOT NULL | Be aware but don't force framing |
| avoid_conflicting | BOOLEAN | true | NOT NULL | Don't suggest contrary practices |
| acknowledge_diversity | BOOLEAN | false | NOT NULL | Recognize internal diversity |
| minority_views | BOOLEAN | false | NOT NULL | Our interpretation may differ from majority |
| diversity_notes | TEXT | | NULL | Additional diversity context |
| special_instructions | TEXT | | NULL | Freeform additional guidance |
| relevance_setting | TEXT | 'automatic' | NOT NULL | CHECK: 'automatic', 'always', 'manual' |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Master toggle for faith context |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Mom can CRUD. Family members can read (faith context informs all LiLa conversations for the family).

**Trigger:**
```sql
CREATE TRIGGER set_updated_at BEFORE UPDATE ON faith_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

### Table: `context_learning_dismissals`

Tracks context learning offers that mom dismissed, to prevent re-offering.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| content_hash | TEXT | | NOT NULL | Hash of the detected content (for dedup) |
| conversation_id | UUID | | NOT NULL | FK → lila_conversations |
| dismissed_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** System-managed. Mom's conversations trigger writes. No direct user access.

**Indexes:**
- `(family_id, content_hash)` — dedup check

---

### Columns Added to Existing Tables

**On `lists` table (PRD-09B):**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| is_shared_to_archive | BOOLEAN | false | NOT NULL | Whether this list is shared to an Archive |
| archive_member_id | UUID | | NULL | FK → family_members. Whose Archive this list appears in. |
| archive_folder_id | UUID | | NULL | FK → archive_folders. Which folder it appears in. |

---

### Enum/Type Updates

Add to any existing source/context enums:
- `archive_context` as a context source type in LiLa context assembly
- `faith_preferences` as a context source type in LiLa context assembly
- `family_overview` as a context source type in LiLa context assembly

---

## Flows

### Incoming Flows (How Data Gets INTO Archives)

| Source | How It Works |
|--------|-------------|
| Mom manual entry | Mom adds standalone context items directly in Archives (Screen 2, Screen 3) |
| LiLa context learning (PRD-05C) | Detection in Optimizer or any LiLa conversation → save dialog (Screen 7) → `archive_context_items` with `source = 'lila_detected'` |
| Review & Route (PRD-08) | "Send to... → Archives" from Smart Notepad routes content as a context item with `source = 'review_route'` |
| Lists "Share with Archive" (PRD-09B) | Any list toggled to share with Archive appears as a live reference on the target member's Archive card |
| InnerWorkings (PRD-07) | Live query-time aggregation. No data written to Archives tables — queried from `self_knowledge` at render time. |
| Guiding Stars (PRD-06) | Live query-time aggregation from `guiding_stars` |
| Best Intentions (PRD-06) | Live query-time aggregation from `best_intentions` |
| LifeLantern (PRD-12A) | Live query-time aggregation from `personal_vision_statements` and `life_lantern_areas` |
| Family Vision Quest (PRD-12B) | Live query-time aggregation from `family_vision_statements` |
| Journal (PRD-08) | Live query-time aggregation from `journal_entries` where `is_included_in_ai = true` |
| Family Setup (PRD-01) | Auto-creation of per-member Archive folders and Family Overview folder on member add |

### Outgoing Flows (How Archives Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| LiLa context assembly (PRD-05) | Context assembly pipeline queries Archives standalone items + source feature tables filtered by three-tier toggles. Archives is the organizational backbone of context assembly. |
| LiLa Optimizer (PRD-05C) | Optimizer's context presets load Archives categories. Smart question filtering checks Archives before asking questions. |
| Gifts guided mode (PRD-05) | Loads wishlist items shared to Archive for the selected person |
| Context export (Screen 6) | Assembles and formats all checked context for external AI use |
| Higgins / Cyrano (PRD-05) | Person-context modes load the selected person's Archive context |
| All guided modes | Any mode with person-selector loads Archive context for selected people |

---

## AI Integration

### No Guided Mode Registered

Archives does not register a guided mode in the LiLa guided mode registry. It is an organizational and data layer, not a conversation mode.

> **Decision rationale:** Archives produces data LiLa reads, not a tool LiLa operates. The "Build with LiLa" flow on the Family Overview Card is a pre-primed general conversation, not a registered guided mode.

### Build with LiLa — Pre-Primed Conversation

When mom taps "Build with LiLa" on the Family Overview Card, LiLa opens in general mode with the Family Overview context pre-loaded. LiLa asks warm, open-ended questions to help mom articulate family personality, dynamics, and rhythms:

- "What are your family's core values — the things that define who you are?"
- "How would you describe your family's personality?"
- "What does a typical week look like for your household?"
- "What season of life is your family in right now?"

LiLa organizes responses into context items, presents them for mom's confirmation, and saves confirmed items to the appropriate Family Overview section.

### Context Assembly Behavior

Archives content in LiLa's system prompt is formatted as:

```
[Person Name]'s Context:

PREFERENCES:
- [item content]

SCHEDULE:
- [item content]

[Additional categories with active items...]

---

Family Context:

FAMILY PERSONALITY:
- [item content]

RHYTHMS & ROUTINES:
- [item content]

FAITH CONTEXT:
- [faith tradition and preferences summary, if relevance setting = 'always' or auto-detected as relevant]
```

### Faith Context Integration

> **Depends on:** Faith & Ethics Framework, FaithAware Addendum.

When LiLa assembles context, faith preferences are checked against the `relevance_setting`:
- **Automatic:** LiLa evaluates whether the conversation topic has a faith dimension. Topics like death, values, morality, dietary practices, and Sabbath observance trigger inclusion. Purely functional topics (scheduling, image prompts) do not.
- **Always:** Faith context included in every conversation.
- **Manual:** Faith context only included when mom explicitly requests it or selects a context preset that includes it (e.g., "Spiritual Questions").

When faith context is included, the transparency indicator in LiLa's prompt card shows "🕊️ Faith context included" with a toggle to exclude for this conversation.

### Auto-Generated Overview Cards

When content changes for a member's Archive (new items added, items toggled, aggregated source data updated), the system regenerates the overview card:

1. Collect all active context for the member (standalone items + aggregated sources)
2. Send to Haiku with a prompt: "Summarize this person's context as a compact profile card. Include key facts organized by theme. Keep it scannable — bullet points, not paragraphs."
3. Store the generated summary in `archive_member_settings.overview_card_content`
4. Display on the member's Archive card (Screen 2)

Regeneration is debounced — triggered no more than once per hour after content changes, and always on explicit page load if content has changed since last generation.

### Usage Tracking

When LiLa references a context item in a response, the system increments `usage_count` and updates `last_used_at` on the referenced `archive_context_items` records. This provides subtle retention value — mom can see "LiLa used your family context 47 times this month" as a signal that her effort in building context has tangible payoff.

> **Decision rationale:** Usage tracking is internal data with retention potential, not a primary feature surface. The indicator appears as a subtle stat on the Archives main page, not as a per-item metric that might cause anxiety about "unused" context.

---

## Edge Cases

### Empty Archives (New Family)
- Archives shows empty member cards with warm invitation: "Start building [name]'s profile — the more LiLa knows, the better she can help."
- Family Overview shows empty sections with guided prompts
- Context export shows empty state: "Nothing to export yet. Start adding context to your family's Archives."

### Member Added After Initial Setup
- When a new member is added (PRD-01), the system auto-creates:
  - Member root folder (`folder_type = 'member_root'`)
  - Default category subfolders (Preferences, Schedule & Activities, Personality & Traits, Interests & Hobbies, School & Learning, Health & Medical, General)
  - Wishlist folder (`folder_type = 'wishlist'`)
  - `archive_member_settings` record with `is_included_in_ai = true`

### Member Removed from Family
- Member's Archive folders and standalone items are soft-deleted (retained for data integrity but hidden from UI)
- Aggregated references stop appearing (source feature data follows its own deletion rules)
- Out of Nest members can be marked as "removed" to hide from active Archives without deleting data

### Out of Nest Members
- Includes adult children who've left home, their spouses (sons/daughters-in-law), and their children (grandchildren) — anyone below mom on the family tree, or married to someone below mom (per PRD-01 convention)
- Full Archive folder structure (same as in-household members)
- No dashboard, no login, no task assignments
- Context available to: Gifts guided mode, Higgins (communicating with them), Optimizer prompts, context export
- Appear in person selector wherever Archive context can be loaded
- Visual badge distinguishes them from in-household members
- Displayed in a collapsible section on Archives main page, collapsed by default — mom expands when she needs them

### Very Large Archives
- Folder tree has no hard nesting limit, but UI shows a maximum of 3 nesting levels. Deeper nesting is allowed but renders as a flat list within the third level.
- Auto-generated overview cards truncate at ~500 tokens. A "Show full context" link expands to the complete view.
- Context assembly pipeline respects token budgets (per PRD-05) — if a member has extensive context, lower-priority items are truncated with a note.

### Concurrent Edits (Multi-Device)
- Last-write-wins for standalone item content edits
- Toggle changes are atomic booleans — concurrent toggles on different items do not conflict
- Overview card regeneration is debounced and idempotent

### Privacy Filtered Auto-Routing False Positive
- If AI incorrectly flags an item as sensitive and routes it to Privacy Filtered, mom can simply move it to the appropriate regular folder with one tap. The "Move to Archive" button on Screen 5 handles this.

### Context Learning During Non-Mom Conversations
- Context learning detection only runs on mom's conversations (mom is the context curator). When dad or teens use LiLa tools, no context learning offers appear — their conversations don't create Archive items.

> **Decision rationale:** Mom-only context learning prevents other family members from inadvertently adding context that mom hasn't curated. This is consistent with the mom-first architecture — Archives is mom's domain.

---

## Tier Gating

> **Tier rationale:** Archives is the backbone of LiLa's intelligence. The exact tier assignments will be determined at launch based on beta usage data. All feature keys are wired from day one with `useCanAccess()` returning `true` during beta.

| Feature Key | Description | Tier (Future) |
|---|---|---|
| `archives_browse` | Access to browse Archives as a feature | TBD |
| `archives_member_folders` | Per-member Archive folders | TBD |
| `archives_family_overview` | Family Overview Card | TBD |
| `archives_faith_preferences` | Faith preferences configuration | TBD |
| `archives_context_learning` | Context learning write-back (LiLa detects and saves) | TBD |
| `archives_overview_cards` | Auto-generated overview cards | TBD |
| `archives_context_export` | Export context for external AI platforms | TBD |
| `archives_privacy_filtered` | Privacy Filtered management | TBD |
| `archives_dad_access` | Dad browsing access to Archives | TBD |
| `archives_share_list` | Share lists to Archive (Lists integration) | TBD |

All return `true` during beta. Feature keys exist from day one per PRD-02 conventions.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| My Circle (non-family contacts) folder type | Non-family people context (therapist, teacher, mentor, friends) | People & Relationships PRD (post-MVP) |
| Family Meeting Notes routing (manual add) | Structured meeting notes → Family Archive | Meetings PRD |
| Partner Profile aggregation | Partner-specific context on Archive card | Partner Profile PRD |
| Auto-archive victories monthly | Victory Recorder monthly summary → member Archive | Victory Recorder enhancement |
| Seasonal Family Overview prompts | Periodic LiLa check-ins on family overview accuracy | Morning/Evening Rhythm PRD |
| Advanced context export (platform-specific formatting) | XML for Claude, structured for ChatGPT, etc. | Future Optimizer enhancement |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Per-member Archive folder auto-creation on member add | PRD-01 | Fully wired: member add triggers creation of member root folder, 7 category subfolders, wishlist folder, and `archive_member_settings` record |
| Archives person cards show InnerWorkings entries as live references | PRD-07 | Fully wired: query-time aggregation renders `self_knowledge` entries on member Archive card with live `is_included_in_ai` toggles |
| "Checked somewhere, checked everywhere" convention | PRD-07 | Fully wired: aggregated references write toggle changes back to source tables |
| Privacy Filtered category auto-routing and management | PRD-05 | Fully wired: Privacy Filtered section (Screen 5) with AI auto-routing, manual management, and hard exclusion from non-mom contexts |
| Context Learning write-back endpoint | PRD-05C | Fully wired: save dialog (Screen 7), folder auto-suggestion, direct save on approval, dismissal tracking |
| Smart question filtering Archives check | PRD-05C | Fully wired: context assembly queries Archives before Optimizer generates clarifying questions |
| Faith preferences handled at Archives/system level | PRD-06 | Fully wired: faith preferences modal (Screen 4) accessible from Family Overview Card, integrated with context assembly |
| Gift wishlists linked from Gifts guided mode | PRD-05 | Fully wired: wishlists in Lists Studio, shared to Archive via toggle, LiLa references in Gifts mode context |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Archive folder auto-creation: member root + 7 category subfolders + wishlist folder created on member add
- [ ] Family Overview folder auto-created on family creation with 4 section subfolders (Family Personality, Rhythms & Routines, Current Focus, Faith & Values)
- [ ] Archives main page renders Family Overview Card and all member Archive cards with summary indicators
- [ ] Member Archive detail shows standalone context items organized by folder with three-tier toggle checkboxes (person → category → item)
- [ ] Aggregation: InnerWorkings, Guiding Stars, Best Intentions entries appear as live references on member Archive cards
- [ ] Aggregation: toggling `is_included_in_ai` on an aggregated reference updates the source table
- [ ] Aggregation: LifeLantern Personal Vision Statement appears on member Archive card when active
- [ ] Aggregation: Family Vision Statement appears on Family Overview Card when active
- [ ] Family Overview Card detail with editable sections and "Build with LiLa" pre-primed conversation
- [ ] Faith preferences modal with all 6 configuration steps, saves to `faith_preferences` table
- [ ] Faith preferences integrated with LiLa context assembly (automatic/always/manual relevance)
- [ ] Privacy Filtered section: view items, toggle `is_included_in_ai`, move items to/from regular folders
- [ ] AI auto-routing of sensitive content to Privacy Filtered during context learning saves
- [ ] Privacy Filtered hard exclusion enforced in context assembly for all non-mom contexts
- [ ] Context learning write-back: save dialog within LiLa conversations, folder auto-suggestion, direct save on approval
- [ ] Context learning dismissal tracking (prevent re-offering same information)
- [ ] "Recently Added by LiLa" filter on member Archive detail
- [ ] Standalone context item CRUD: add, edit, archive items in any folder
- [ ] Folder management: create, rename, reorder, delete (user-created only), nest
- [ ] Context export: Markdown format, scope selector (all/by person/by folder), copy to clipboard, download
- [ ] Out of Nest members: full Archive folders, visual badge, accessible to LiLa tools via person selector
- [ ] Auto-generated overview cards: Haiku-generated summary per member, debounced regeneration
- [ ] Usage tracking: increment `usage_count` and `last_used_at` when LiLa references context items
- [ ] Share with Archive pattern: toggle on any list → member picker → folder picker/create → live reference on Archive card
- [ ] RLS policies enforce mom-only access (with optional dad grant) on all Archives tables
- [ ] `useCanAccess()` wired on all Archives feature keys, returning `true` during beta
- [ ] PermissionGate wrapping all Archives UI

### MVP When Dependency Is Ready
- [ ] Aggregation for Journal entries with `is_included_in_ai = true` (when PRD-08 is built)
- [ ] Family Meeting Notes section in Family Overview (when Meetings PRD is built)
- [ ] Partner Profile aggregation on Archive card (when Partner Profile PRD is built)
- [ ] My Circle folder type for non-family contacts (when People & Relationships PRD is built)
- [ ] Monthly victory auto-archive to member Archives (when Victory Recorder enhancement is built)

### Post-MVP
- [ ] Platform-specific context export formatting (XML for Claude, structured for ChatGPT)
- [ ] Seasonal Family Overview prompts (LiLa check-ins on family context freshness)
- [ ] Dad full edit access to permitted Archives (not just read)
- [ ] Advanced usage analytics (which context categories are most/least used, effectiveness scoring)
- [ ] Context staleness indicators (highlight items that haven't been updated in X months)
- [ ] Bulk context import (paste multiple items, AI sorts into folders)
- [ ] Archive search (full-text search across all folders and items)

---

## CLAUDE.md Additions from This PRD

- [ ] Archives is the platform's context management engine. Mom-only browsing by default; dad can be granted access. No other role browses Archives directly.
- [ ] Aggregation is query-time, never copy. Archives renders live references from source tables (self_knowledge, guiding_stars, best_intentions, personal_vision_statements, life_lantern_areas, family_vision_statements, journal_entries, lists). Toggling `is_included_in_ai` on an aggregated reference updates the source table.
- [ ] "Checked somewhere, checked everywhere" — the architectural convention. Sharing/permission state lives on the source feature table, not on Archives copies (because there are no copies).
- [ ] Three-tier toggle system: person level (`archive_member_settings.is_included_in_ai`), category level (`archive_folders.is_included_in_ai`), item level (`archive_context_items.is_included_in_ai` or source table's `is_included_in_ai`).
- [ ] Privacy Filtered is a hard system-enforced boundary. `is_privacy_filtered = true` items are NEVER included in non-mom context assembly. Not a toggle — a system constraint. AI auto-routes sensitive content here during context learning saves.
- [ ] Archive folder auto-creation on member add: member_root folder + 7 category subfolders (Preferences, Schedule & Activities, Personality & Traits, Interests & Hobbies, School & Learning, Health & Medical, General) + wishlist folder. System folders cannot be deleted.
- [ ] Family Overview is a special Archive folder (`folder_type = 'family_overview'`) with structured sections. Faith preferences stored in dedicated `faith_preferences` table, referenced from Family Overview.
- [ ] Context learning write-back: direct save on mom's approval, no review queue. Folder auto-suggestion based on content type. Dismissal tracking prevents re-offering. `source = 'lila_detected'` on saved items.
- [ ] Share with Archive pattern: any list in Lists Studio can be shared to a member's Archive via toggle + member picker + folder picker. Data stays in Lists; Archives surfaces live references.
- [ ] Context export: Markdown format at MVP. All checked items across all members, organized by person then category.
- [ ] Out of Nest members: adult children, their spouses (sons/daughters-in-law), and grandchildren. Full Archive folders, no dashboard/login. Context accessible to LiLa tools via person selector. Displayed in a collapsible section on Archives main page, collapsed by default.
- [ ] Auto-generated overview cards: Haiku-generated member summary, debounced regeneration (max once per hour), stored in `archive_member_settings.overview_card_content`.
- [ ] PermissionGate required on all Archives UI. `useCanAccess('archives_browse')` wired from day one.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `archive_folders`, `archive_context_items`, `archive_member_settings`, `faith_preferences`, `context_learning_dismissals`
Columns added to `lists` (PRD-09B): `is_shared_to_archive`, `archive_member_id`, `archive_folder_id`
Enums updated: context source types (add `archive_context`, `faith_preferences`, `family_overview`)
Triggers added: `set_updated_at` on `archive_folders`, `archive_context_items`, `archive_member_settings`, `faith_preferences`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Hybrid folder architecture:** system auto-creates per-member folders + Family Overview folder; mom creates anything else | Ensures every member has an Archive from day one while preserving Bublup-style flexibility. System folders provide structure; custom folders provide freedom. |
| 2 | **Query-time aggregation, not copies or reference rows** | Perfectly implements "checked somewhere, checked everywhere" with zero data duplication. No sync logic to maintain. Edits in source features instantly reflected on Archive cards. |
| 3 | **Family Overview Card is a special Archive folder, not a standalone table** | Keeps all Archives content in a unified folder/item model. Family Vision Statement and faith preferences are referenced, not copied. Consistent UI patterns. |
| 4 | **Faith preferences accessible from Family Overview Card + Settings shortcut, not during family setup** | Family setup should stay fast and unintimidating. Faith preferences are discovered when mom explores Archives or when LiLa contextually suggests them. |
| 5 | **Context learning: direct save on approval, no review queue** | Mom already reviewed and approved in the conversation dialog. A separate review queue adds friction without value. "Recently Added by LiLa" filter provides after-the-fact review. |
| 6 | **7 starter category subfolders per member, auto-created** | Preferences, Schedule & Activities, Personality & Traits, Interests & Hobbies, School & Learning, Health & Medical, General. Ready to receive content from day one. Mom can rename, create new, or leave empty. |
| 7 | **Context export: Markdown at MVP, platform-specific post-MVP** | A well-formatted Markdown export works on any AI platform. Platform-specific formatting is polish for power users. |
| 8 | **Out of Nest: full Archive folders, no dashboard, collapsible section, includes descendants and their spouses** | Preserves context about adult children, their spouses, and grandchildren for gift planning, communication coaching, and family memory. Collapsible section keeps daily Archives view focused on in-household members. Same folder structure as in-household members. |
| 9 | **Archives owns context data; People & Relationships owns relationship management** | Clean separation. Archives is the context engine. People & Relationships (future) manages the social graph. Archives provides the backbone; P&R adds relationship-specific features. |
| 10 | **Privacy Filtered: system section, not a regular folder** | Visually distinct, always mom-only, hard exclusion enforced. Items can be moved back to regular folders when appropriate. AI auto-routes sensitive content here. |
| 11 | **Wishlists live in Lists Studio, not Archives** | Lists owns the data model, sharing, and management. Archives surfaces wishlists as live references via the "Share with Archive" pattern. Same pattern works for any list type. |
| 12 | **Share with Archive is a general pattern for all list types** | Not wishlist-specific. Grocery lists, reading lists, homeschool curriculum lists — any list can share to any member's Archive folder. |
| 13 | **Archives is mom-only by default; dad can be granted access** | Mom is the family's context curator. Dad access is opt-in, scoped per child, read-only by default. No other role browses Archives. |
| 14 | **Usage tracking: internal data with retention potential** | Subtle "LiLa used your family context X times" indicator. Not a per-item metric. Serves as retention signal that context curation has tangible value. |
| 15 | **Tier gating: feature keys wired, tiers TBD at launch** | All `useCanAccess()` hooks built and returning `true` during beta. Tier assignments determined from beta usage data. |
| 16 | **Family Vision Quest and family meeting notes feed Family Overview** | Family Vision Statement aggregated as live reference. Meeting notes stored as standalone items in Family Overview folder. Both enrich the "family personality" context LiLa uses. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | My Circle (non-family contacts) | People & Relationships PRD. Architecture supports it: `folder_type = 'my_circle'` ready when needed. |
| 2 | Family Meeting Notes structured routing | Meetings PRD. Currently manual add to Family Overview folder. |
| 3 | Partner Profile aggregation | Partner Profile PRD. Archive card will aggregate partner-specific context when available. |
| 4 | Monthly victory auto-archive | Victory Recorder enhancement. Currently manual. |
| 5 | Seasonal Family Overview prompts | Morning/Evening Rhythm PRD. Currently LiLa's general conversational awareness. |
| 6 | Platform-specific export formatting | Future Optimizer enhancement. MVP uses universal Markdown. |
| 7 | Bulk context import (paste-to-sort) | Post-MVP. Similar to InnerWorkings Bulk Add pattern. |
| 8 | Archive search (full-text) | Post-MVP. Database supports it; UI not designed yet. |
| 9 | Tier assignments for all feature keys | Launch configuration based on beta usage data. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-01 (Auth & Family Setup) | Archive folder auto-creation on member add now fully specified: member_root + 7 category subfolders + wishlist folder + `archive_member_settings` record. Family Overview folder created on family creation. | Update the stub reference in PRD-01 to point to PRD-13's folder auto-creation specification. |
| PRD-05 (LiLa Core) | Context assembly pipeline now documented from the Archives side: query-time aggregation, three-tier filtering, Privacy Filtered enforcement, faith preferences integration. | Verify PRD-05 context assembly section is consistent with PRD-13's aggregation architecture. |
| PRD-05C (LiLa Optimizer) | Context learning write-back fully specified: save endpoint, folder routing, dismissal tracking. Smart question filtering Archives check documented. | Update PRD-05C's "Cross-Reference Note for Archives PRD" to reference PRD-13 Screen 7 and Context Learning Write-Back section. |
| PRD-07 (InnerWorkings) | "Archives aggregation" convention now fully implemented: query-time live references, toggle write-back to source table. | No changes needed — PRD-07's convention is implemented as designed. |
| PRD-09B (Lists Studio) | Share with Archive pattern adds 3 columns to `lists` table: `is_shared_to_archive`, `archive_member_id`, `archive_folder_id`. UI toggle + member picker + folder picker needed on list settings. | Add Share with Archive section to PRD-09B screens and schema. |
| PRD-06 (Guiding Stars) | Faith Foundations removal confirmed — faith context lives in Archives `faith_preferences` table. Family-level Guiding Stars aggregated on Family Overview Card. | No changes needed — PRD-06 already deferred faith to Archives. |
| PRD-11 (Victory Recorder) | Monthly victory auto-archive to member Archives documented as a stub. | Add forward note to PRD-11 referencing Archives stub. |

---

*End of PRD-13*
