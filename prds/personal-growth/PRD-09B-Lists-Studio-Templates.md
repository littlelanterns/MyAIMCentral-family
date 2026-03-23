# PRD-09B: Lists, Studio & Templates

**Status:** Not Started
**Dependencies:** PRD-01 (Auth), PRD-02 (Permissions), PRD-03 (Design System), PRD-04 (Shell Routing), PRD-08 (Journal + Smart Notepad), PRD-09A (Tasks, Routines & Opportunities)
**Created:** March 5, 2026
**Last Updated:** March 5, 2026
**Companion:** PRD-09A (Tasks, Routines & Opportunities)

---

## Overview

PRD-09B completes the three-page model established in PRD-09A by defining the Studio page (where things are *designed*) and the Lists page (where reference collections are *organized*). Together with the Tasks page (PRD-09A), these three surfaces form the family's complete task, template, and list ecosystem.

> **Mom experience goal:** Studio should feel like walking into a well-organized craft store — browse blank formats with clear examples of what they become, tap "Customize," and build exactly what your family needs. Lists should feel like a simple, shareable notepad for the non-task things in life — grocery runs, wishlists, packing, ideas. Neither should feel like "work." Both should feel like tools that make the chaos manageable.

**Studio** is the template workshop. It houses blank template formats across every category in the platform: task and routine templates, opportunity boards, sequential collections, list templates, tracker templates, widget templates, tool templates, and gamification system templates. Users browse, customize, and deploy. Studio is where the reusable building blocks of family life are designed.

> **Forward note:** Studio's full template catalog will expand as future PRDs define their specific content. PRD-09B defines the Studio page structure, browsing experience, and the template categories that PRD-09A established (tasks, routines, opportunities, sequential collections, lists). PRD-10 (Widgets) will define tracker and widget template types. PRD-24 (Rewards & Gamification) will define gamification system templates. Additional tool templates may come from Library Vault and other PRDs. The Studio page architecture accommodates all of these — each future PRD adds its template category to the existing browsing experience rather than creating a separate page.

**Lists** is the reference collection surface. Shopping lists, wishlists with URLs and prices, packing lists, expense tracking, idea collections, and any other checkable list that doesn't need task-system features (assignments, rewards, tracking, approval). Lists can be shared within the family as a single shared list or assigned as individual copies.

> **Depends on:** Task types, Task Creation Queue, and Task Creation Modal — defined in PRD-09A. Family member roles — defined in PRD-01. Permission model — defined in PRD-02. Smart Notepad routing destinations — defined in PRD-08.

---

## User Stories

### Studio — Template Browsing & Customization
- As a mom, I want to browse blank template formats with example use cases so I can quickly find the right starting point for what I need to create.
- As a mom, I want to customize a blank chore checklist template into "Clean Kitchen" with daily/MWF/weekly sections, then deploy it to my kids on a rotation — all from one flow.
- As a mom, I want to see all my customized templates in Studio alongside who they're currently assigned to, so I have one place to manage my family's reusable task and list library.
- As a teen with Studio access (Full Magic, mom-permitted), I want to browse templates and create my own study tracker or habit routine without needing mom to set it up for me.
- As a mom, I want to save any task, routine, or list I've created as a reusable template so I can deploy it again next semester or to a different child.

### Studio — Future Template Categories
- As a mom, I want to browse and customize tracker templates to monitor my kids' reading, exercise, or homeschool progress (defined in PRD-10).
- As a mom, I want to choose a gamification theme for each child and customize it before deploying to their dashboard (defined in PRD-24).
- As a mom, I want to browse widget templates and add useful dashboard widgets like meal planners, calendar views, or progress displays (defined in PRD-10).

### Lists — Reference Collections
- As a mom, I want a grocery list that I share with my husband so either of us can add items and check them off at the store.
- As a teen, I want a wishlist where I can save URLs for things I want, with notes about size/color/model, so my parents know exactly what to get.
- As a mom planning a camping trip, I want to pull up my "Camping Packing List" template, customize it for this specific trip, and share it with the whole family so everyone can check off what they've packed.
- As a mom, I want to quickly route items from a Notepad brain dump to the right list — groceries to the grocery list, gift ideas to the gift list, trip ideas to an idea list.
- As any family member, I want to reorder list items by dragging them so I can organize by priority or store aisle.

### Lists — Shared vs. Individual
- As a mom, I want to share a single packing list with the whole family where anyone can check items off (shared list).
- As a mom, I want to give each kid their own version of a reading list where they track their own progress independently (individual copies from one template).
- As a mom, I want to see which lists are assigned or shared with whom, so I know who has access to what.

### Routing & Promotion
- As a mom, I want list items to be promotable to tasks — if "buy birthday supplies" on my to-do list becomes a real action item, I want to send it to the Task Creation Queue with one tap.
- As a mom, when I route items from Notepad to Lists, I want an inline picker showing my existing lists (grouped by type) so I can add items to the right list without navigating away.

---

## Screens

### Screen 1: Studio Page — Template Workshop

> **Depends on:** Shell routing — defined in PRD-04. Permission model — defined in PRD-02.

**What the user sees:**

The Studio page is the browsing and customization hub for all reusable templates in the platform. It presents blank template formats organized by category, each with example use cases showing what it could become. Customized templates also appear here with their assignment/deployment status.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Studio                                                       │
│  Templates, Trackers & Widgets                                │
├──────────────────────────────────────────────────────────────┤
│  [Browse Templates] [My Customized] [Search 🔍]              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ── Task & Chore Templates ──────────────────────────────    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 📋       │ │ 🔄       │ │ ⭐       │ │ 📝       │       │
│  │ Simple   │ │ Routine  │ │ Opportu- │ │ Sequen-  │       │
│  │ Task     │ │ Checklist│ │ nity     │ │ tial     │       │
│  │          │ │          │ │ Board    │ │ Collect. │       │
│  │ One-time │ │ Sectioned│ │ Claimable│ │ Ordered  │       │
│  │ or recur-│ │ checklist│ │ jobs,    │ │ items    │       │
│  │ ring task│ │ with per-│ │ repeat-  │ │ that feed│       │
│  │          │ │ section  │ │ able, or │ │ tasks one│       │
│  │          │ │ frequency│ │ capped   │ │ at a time│       │
│  │[Custom-  │ │[Custom-  │ │[Custom-  │ │[Custom-  │       │
│  │ ize]     │ │ ize]     │ │ ize]     │ │ ize]     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  ── List Templates ──────────────────────────────────────    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 🛒       │ │ 🎁       │ │ 🧳       │ │ 💡       │       │
│  │ Shopping │ │ Wishlist │ │ Packing  │ │ Custom   │       │
│  │ List     │ │          │ │ List     │ │ List     │       │
│  │          │ │ URLs,    │ │          │ │          │       │
│  │ Qty,     │ │ notes,   │ │ Category │ │ Any ref- │       │
│  │ aisle,   │ │ price,   │ │ sections,│ │ erence   │       │
│  │ store    │ │ gift for │ │ checkbox │ │ collection│      │
│  │[Custom-  │ │[Custom-  │ │[Custom-  │ │[Custom-  │       │
│  │ ize]     │ │ ize]     │ │ ize]     │ │ ize]     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  ── Special Templates ───────────────────────────────────    │
│  ┌──────────┐ ┌──────────┐                                   │
│  │ 🎲       │ │ 📝       │                                   │
│  │ Random-  │ │ SODAS /  │                                   │
│  │ izer     │ │ Guided   │                                   │
│  │          │ │ Form     │                                   │
│  │ Draw from│ │ Structured│                                  │
│  │ a curated│ │ thinking │                                   │
│  │ grab bag │ │ worksheet│                                   │
│  │[Custom-  │ │[Custom-  │                                   │
│  │ ize]     │ │ ize]     │                                   │
│  └──────────┘ └──────────┘                                   │
│                                                               │
│  ── Trackers & Widgets (PRD-10) ─────────────────────────    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 📊       │ │ 📈       │ │ 🎯       │ │ ⏱️       │       │
│  │ Progress │ │ Habit    │ │ Goal     │ │ Time     │       │
│  │ Tracker  │ │ Tracker  │ │ Tracker  │ │ Tracker  │       │
│  │          │ │          │ │          │ │          │       │
│  │ Coming   │ │ Coming   │ │ Coming   │ │ Coming   │       │
│  │ Soon     │ │ Soon     │ │ Soon     │ │ Soon     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  ── Tools (Future PRDs) ─────────────────────────────────    │
│  ┌──────────┐ ┌──────────┐                                   │
│  │ 🧠       │ │ 📅       │                                   │
│  │ Meal     │ │ Project  │                                   │
│  │ Planner  │ │ Planner  │                                   │
│  │          │ │          │                                   │
│  │ Coming   │ │ Coming   │                                   │
│  │ Soon     │ │ Soon     │                                   │
│  └──────────┘ └──────────┘                                   │
│                                                               │
│  ── Gamification Systems (PRD-24) ───────────────────────    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │ 🐉       │ │ 🌻       │ │ 🌊       │                     │
│  │ Dragon   │ │ Garden   │ │ Ocean    │                     │
│  │ Academy  │ │ Growth   │ │ Explorer │                     │
│  │          │ │          │ │          │                     │
│  │ Coming   │ │ Coming   │ │ Coming   │                     │
│  │ Soon     │ │ Soon     │ │ Soon     │                     │
│  └──────────┘ └──────────┘ └──────────┘                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Browse Templates tab:**
- Template cards organized by category with horizontal scrolling within each category
- Each card shows: icon, template name, brief description of what it becomes, [Customize] button
- "Coming Soon" cards for categories defined by future PRDs (trackers, widgets, tools, gamification). These are visible but not yet interactive — they show what's coming and build anticipation.
- Categories can be collapsed/expanded to reduce scrolling
- Search bar filters across all categories by name and description

**My Customized tab:**
- Shows all templates the user has customized (not blank templates)
- Grouped by type: Task Templates, Routine Templates, Opportunity Templates, Sequential Collections, List Templates
- Each card shows: template name, type badge, deployment status ("Assigned to: Gideon, Miriam", "Unassigned", "3 active deployments"), last deployed date
- Tap any card → opens the customized template for editing or deployment
- Filter by: type, assigned/unassigned, recently used
- Sort by: name, last deployed, most used, recently created

**Interactions:**
- [Customize] on any blank template → opens the appropriate creation flow:
  - Task/Routine/Opportunity/Sequential → opens Task Creation Modal (PRD-09A) pre-configured for that type
  - List templates → opens List Creation flow (Screen 3 below)
  - Tracker/Widget/Tool/Gamification → opens the appropriate creation flow defined by their respective PRDs (stubs for now)
- Customized templates can be: edited, deployed, duplicated, archived, or deleted
- "Import from Existing" option — create a template from an existing task or list (reverse flow: active item → saved template)

> **Decision rationale:** Studio houses ALL template categories in one browsable surface rather than scattering them across feature-specific pages. This gives users one place to go when they want to create or manage reusable content. Future PRDs add their template cards to the existing Studio structure.

> **Forward note:** At Creator tier (post-MVP), mom can design entirely new blank template formats and potentially sell them in a marketplace. The Studio architecture should support user-created template categories alongside system-provided ones. This is a significant future expansion that doesn't affect the MVP Studio structure.

**Data created/updated:**
- No Studio-specific table needed — Studio is a browsing/navigation surface that reads from `task_templates` (PRD-09A), `list_templates` (this PRD), and future template tables from other PRDs.

---

### Screen 2: Lists Page — Reference Collections

> **Depends on:** Smart Notepad routing — defined in PRD-08. Drag-to-rearrange convention — defined in PRD-08.

**What the user sees:**

The Lists page shows all customized reference lists — collections that don't connect to the task/reward/tracking system. This is for shopping, wishlists, packing, ideas, and any other checkable reference collection.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Lists                                           [+ Create]   │
├──────────────────────────────────────────────────────────────┤
│  [All] [Shopping] [Wishlists] [Packing] [Custom] [Shared]    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🛒 Weekly Groceries                        Shared w/ 2  │ │
│  │ 12 items · Last updated: Today                           │ │
│  │ Shared with: Dad, Miriam                                 │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🛒 Costco Run                               Mom only    │ │
│  │ 8 items · Last updated: 2 days ago                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🎁 Jake's Birthday Wishlist                 Jake's own   │ │
│  │ 6 items · 3 with URLs                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ 🧳 Spring Break Packing                  Shared w/ 5    │ │
│  │ 24 items · 18 checked                                    │ │
│  │ Shared with: Jake, Emma, Miriam, Gideon, Helam           │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  [+ Create]  [Browse List Templates in Studio]               │
└──────────────────────────────────────────────────────────────┘
```

**Tabs/filters:**
- **All:** Every list the user has access to
- **Shopping:** Shopping/grocery lists
- **Wishlists:** Gift wishlists with URL support
- **Packing:** Travel and event packing lists
- **Custom:** Everything else
- **Shared:** Lists shared with other family members (quick filter)

**Interactions:**
- Tap any list card → opens List Detail view (Screen 4)
- [+ Create] → opens List Creation flow (Screen 3)
- [Browse List Templates in Studio] → navigates to Studio page filtered to list templates
- Cards show: list name, type icon, item count, last updated, sharing status
- Cards are sortable by: name, last updated, most items, recently accessed
- Swipe left on a card → archive/delete options

**Data created/updated:**
- `lists` records read and displayed

---

### Screen 3: List Creation Flow

**What the user sees:**

A modal or full-screen flow for creating a new list. Can be opened from the Lists page, from Studio (when customizing a list template), or from Notepad routing.

**Step 1: Choose type (if not pre-selected from Studio)**
```
┌──────────────────────────────────────────────────────────────┐
│  Create a List                                                │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  What kind of list?                                           │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ 🛒 Shopping  │  │ 🎁 Wishlist  │  │ 💰 Expenses  │       │
│  │              │  │              │  │              │       │
│  │ Quantities,  │  │ URLs, notes, │  │ Amounts,     │       │
│  │ aisle/store  │  │ price, gift  │  │ categories,  │       │
│  │ grouping     │  │ recipient    │  │ totals       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ 🧳 Packing   │  │ ✅ To-Do     │  │ 💡 Custom    │       │
│  │              │  │              │  │              │       │
│  │ Category     │  │ Simple       │  │ You define   │       │
│  │ sections,    │  │ checkboxes,  │  │ the format   │       │
│  │ checkbox     │  │ promotable   │  │              │       │
│  │              │  │ to tasks     │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Step 2: Configure the list**
- List name (required)
- Description (optional)
- Sharing: Private (default), Shared (select family members), or assign individual copies
- For shared lists: all selected members can view, add, check, and reorder items
- For individual copies: each member gets their own independent version
- Save as template: checkbox to save this list as a reusable template in Studio

**Step 3: Add items**
- Manual entry: one item per line, or paste multiple items at once
- AI Bulk Add: paste freeform text → LiLa parses into structured items (same pattern as StewardShip's bulkParse)
- Voice input: speak items, LiLa transcribes and parses
- Per list type, items have different fields (see List Type Configurations below)

**Data created/updated:**
- `lists` record
- `list_items` records
- `list_shares` records (if shared)
- `list_templates` record (if saved as template)

---

### Screen 4: List Detail View

**What the user sees:**

The detail view for a single list — items with checkboxes, type-specific fields, and management actions.

**Layout (Shopping list example):**
```
┌──────────────────────────────────────────────────────────────┐
│  🛒 Weekly Groceries                    [Edit] [Share] [···] │
│  Shared with Dad, Miriam                                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ── Produce ──                                                │
│  ☐ Bananas                              ×6                    │
│  ☐ Spinach                              ×2 bags               │
│  ☐ Avocados                             ×4                    │
│  ☑ Apples (Gideon checked)              ×8        ✓ Got it   │
│                                                               │
│  ── Dairy ──                                                  │
│  ☐ Milk (whole)                         ×2 gal                │
│  ☐ Butter                               ×1                    │
│  ☐ Yogurt                               ×3                    │
│                                                               │
│  ── Pantry ──                                                 │
│  ☐ Pasta                                ×3 boxes              │
│  ☐ Rice                                 ×1 bag                │
│                                                               │
│  [+ Add Item]  [+ Add Section]  [AI Bulk Add]                │
│                                                               │
│  ──────────────────────────────────────────────────────────  │
│  Progress: 1/10 items checked                                 │
│                                                               │
│  [Uncheck All]  [Save as Template]  [Send to → ▾]           │
└──────────────────────────────────────────────────────────────┘
```

**Layout (Wishlist example):**
```
┌──────────────────────────────────────────────────────────────┐
│  🎁 Jake's Birthday Wishlist             [Edit] [Share] [···]│
│  Jake's own list                                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ☐ Nintendo Switch Pro Controller                             │
│    🔗 https://amazon.com/dp/B09...        $69.99              │
│    Notes: "Black color, not white"                            │
│                                                               │
│  ☐ Percy Jackson boxed set                                    │
│    🔗 https://bookshop.org/...            $35.00              │
│    Notes: "Paperback, NOT hardcover"                          │
│                                                               │
│  ☐ New skateboard wheels                                      │
│    🔗 https://skateshop.com/...           $24.99              │
│    Notes: "54mm, soft wheels for street"                      │
│                                                               │
│  ☐ Art supplies                                               │
│    Notes: "Prismacolor colored pencils, 48-count"             │
│    For: Birthday · Priority: Would love                       │
│                                                               │
│  [+ Add Item]  [AI Bulk Add]                                 │
│                                                               │
│  Total estimated: $129.98                                     │
│                                                               │
│  [Save as Template]  [Share with Mom]                        │
└──────────────────────────────────────────────────────────────┘
```

**Interactions:**
- Check/uncheck items (shared lists show who checked each item)
- Drag-to-rearrange items within sections and between sections
- Tap item to expand/edit (notes, URL, quantity, price, etc.)
- [+ Add Item] → inline new item row
- [+ Add Section] → creates a new grouping header (for Shopping, Packing types)
- [AI Bulk Add] → paste freeform text, LiLa parses into items
- [Send to → ▾] on any unchecked item → routes to Task Creation Queue (promotes list item to task)
- [Save as Template] → saves list as reusable template in Studio
- [Uncheck All] → resets all items (useful for recurring shopping lists)
- [···] menu → archive, delete, duplicate, export (copy to clipboard)
- URL items: tapping the link icon opens URL in new browser tab
- On shared lists: real-time sync so family members see updates

**Data created/updated:**
- `list_items` records updated (checked/unchecked, reordered, edited)
- `task_queue` records created when items are promoted to tasks

---

### Screen 5: Notepad → Lists Routing (Inline Picker)

> **Depends on:** Smart Notepad routing grid — defined in PRD-08. Inline picker overlay pattern — defined in PRD-08.

**What the user sees:**

When a user selects "Lists" from the Notepad "Send to..." grid, an inline picker overlay appears showing existing lists grouped by type.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Send to List                                          [✕]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Recent:                                                      │
│  ┌──────────────────┐ ┌──────────────────┐                   │
│  │ 🛒 Weekly        │ │ 🎁 Jake's        │                   │
│  │ Groceries        │ │ Wishlist         │                   │
│  └──────────────────┘ └──────────────────┘                   │
│                                                               │
│  Shopping Lists:                                              │
│  • Weekly Groceries                                           │
│  • Costco Run                                                 │
│  • Party Supplies                                             │
│                                                               │
│  Wishlists:                                                   │
│  • Jake's Birthday Wishlist                                   │
│  • Emma's Wishlist                                            │
│                                                               │
│  Packing:                                                     │
│  • Spring Break Packing                                       │
│                                                               │
│  Other:                                                       │
│  • Home Improvement Ideas                                     │
│  • Books to Read                                              │
│                                                               │
│  [+ Create New List]                                         │
└──────────────────────────────────────────────────────────────┘
```

**Behavior:**
- If the Notepad content contains fewer than 3 items, user taps a single list and the content routes there directly.
- If the Notepad content contains 3+ items, after selecting the list, user is asked: "Add all items to this list, or review items individually?" This prevents accidentally dumping an entire brain dump into the grocery list.
- If LiLa detects that items should go to different lists (groceries mixed with gift ideas), it suggests splitting: "I see some grocery items and some gift ideas. Want me to sort them?"
- [+ Create New List] opens the List Creation flow (Screen 3) with content pre-populated.
- Recent lists appear at top for quick access (auto-sorted by usage frequency, same pattern as Notepad favorites).

---

## List Type Configurations

> **Decision rationale:** List types are config-driven, not hardcoded enums. Adding a new list type should be a config change, not a code change. Each type defines which fields are available on list items and which special behaviors apply.

### Shopping List
- **Item fields:** name (required), quantity (optional, default 1), unit (optional: items, bags, lbs, oz, gallons, boxes, etc.), section/category (optional: Produce, Dairy, Meat, Pantry, Frozen, Household, etc.), store (optional), notes (optional)
- **Special behavior:** Section grouping with collapsible headers. "Uncheck All" prominent (for reuse). Checked items move to bottom of their section (greyed, strikethrough). Shared by default (family shopping is collaborative).
- **Promote to task:** Not typically promoted (shopping items don't become tasks). However, "Go grocery shopping" could be a task that references a shopping list.

### Wishlist
- **Item fields:** name (required), URL (optional), price (optional, with currency), notes (optional: color, size, model, etc.), gift_for (optional: "Birthday", "Christmas", "Just because"), priority (optional: "Must have", "Would love", "Nice to have")
- **Special behavior:** Total estimated price calculated from items with prices. URLs open in new browser tab on tap. Gift_for field helps family members shop for each other. Individual by default (each person maintains their own wishlist). Mom can view any child's wishlist.
- **Promote to task:** "Buy [item] for [person]" → sends to Task Creation Queue.

### Expenses
- **Item fields:** name (required), amount (required, currency), category (optional: Groceries, Dining, Entertainment, Gas, Household, Medical, Education, etc.), date (optional), paid_by (optional: which family member), notes (optional)
- **Special behavior:** Running total at bottom. Category subtotals. Monthly/weekly grouping option. Export option (copy as CSV or text).
- **Promote to task:** Not typically promoted.

> **Deferred:** Full expense tracking, budgeting, and financial reporting — to be resolved in PRD-28 (Tracking, Allowance & Financial). Expenses list type provides lightweight capture; PRD-28 provides the full financial system.

### Packing List
- **Item fields:** name (required), section/category (optional: Clothes, Toiletries, Electronics, Documents, Snacks, etc.), quantity (optional), notes (optional), packed_by (optional: which family member on shared lists)
- **Special behavior:** Section grouping with collapsible headers. Progress bar (15/24 packed). "Uncheck All" for next trip. Designed for shared use — whole family packs from one list. Template-ready (save "Camping Packing" template, reuse every trip).
- **Promote to task:** "Buy [missing item]" → sends to Task Creation Queue. "Pack [section]" → creates a task.

### To-Do List
- **Item fields:** name (required), notes (optional), due_date (optional), priority (optional: high, medium, low)
- **Special behavior:** Most promotable to tasks. Each item has a [→ Tasks] icon that sends it to the Task Creation Queue. A To-Do list is essentially a lightweight capture space for things that might become tasks. Once promoted, the item can stay in the list (with a badge showing it's been promoted) or be checked off.
- **Promote to task:** Primary use case. One-tap promotion to Task Creation Queue.

> **Decision rationale:** To-Do lists and Tasks are distinct surfaces. A To-Do list is a quick capture scratchpad — "things I need to do, haven't organized yet." Tasks are the structured, assigned, tracked, rewarded system. To-Do lists feed Tasks via promotion.

### Custom
- **Item fields:** name (required), notes (optional), plus any of the optional fields from other types (URL, price, quantity, date) — user chooses which fields to enable when creating the list
- **Special behavior:** Fully flexible. User names the list type when creating. Section grouping optional. All promotion paths available.
- **Promote to task:** Available per item.

### Randomizer
- **Item fields:** name (required), notes (optional), category (optional: quick jobs, medium jobs, big jobs — or custom categories), is_repeatable (boolean, default true), is_available (boolean, default true — set to false when one-time item is completed)
- **Special behavior:** The Randomizer is a curated grab bag. Mom fills it with items, then uses a **[Draw]** button to randomly select one. Fun animation (spinner or card flip) reveals the selection. Mom can **re-draw** if the selection isn't appropriate for the moment. On confirm, the drawn item is assigned to a selected child as a task. One-time items are removed from the draw pool after completion; repeatable items return. Mom can optionally filter by category before drawing ("draw a quick job" vs. "draw any job").
- **Use cases:**
  - **Extra jobs (Teaching Self-Government):** Mom curates a list of chores (washing walls, washing doorknobs, washing windows) mixed with connection items ("give mom a hug and we'll try better next time"). When a child earns an extra job, mom taps Draw.
  - **Name drawing:** List of family member names. Draw one for a prize, chore assignment, or "who picks tonight's movie."
  - **Activity picker:** List of family activities, dinner options, or field trip ideas. Draw one when you can't decide.
  - **Reward spinner:** List of small rewards. Kid earns a spin and gets a random treat.
- **Dashboard widget:** A "Draw" shortcut widget can be placed on mom's dashboard for one-tap access to a specific Randomizer list. The widget shows the list name and a prominent [Draw] button.
- **Promote to task:** Automatic on draw confirmation — the selected item becomes an assigned task.

> **Decision rationale:** Built as a general-purpose randomizer rather than an extra-jobs-only tool. The infrastructure is the same whether you're drawing chores, names, or dinner ideas. The category system (quick/medium/big) lets mom control the intensity of what gets drawn without needing separate lists.

### Guided Form (SODAS and Structured Worksheets)

> **Forward note:** Guided Forms are a new template category in Studio. SODAS is the first instance; the pattern supports other structured worksheets from Teaching Self-Government and other parenting frameworks. This category will grow as additional form types are identified.

- **What it is:** A structured, multi-section form that mom fills in partially (the Situation) and assigns to a child to complete (the Options, Disadvantages, Advantages, Solution). It's not a list or a task — it's a guided thinking exercise.
- **SODAS sections:**
  - **S — Situation** (filled by mom at assignment): Description of what happened or what decision needs to be made
  - **O — Options** (filled by child): List all possible choices or responses
  - **D — Disadvantages** (filled by child): For each option, what are the downsides?
  - **A — Advantages** (filled by child): For each option, what are the benefits?
  - **S — Solution** (filled by child): Which option is best and why?
- **Assignment flow:** Mom creates or selects a SODAS template → fills in the Situation → assigns to a child → child sees it on their dashboard as an assigned activity → child works through O-D-A-S → mom reviews the completed form.
- **LiLa assistance:** Configurable per assignment. Mom toggles "Allow AI help" — when ON, the child can tap a LiLa icon on any section for brainstorming help. When OFF, the child works through it independently. Default: OFF for Guided shell, configurable for Independent.
- **Print option:** Any SODAS (blank or completed) can be printed as a formatted worksheet for families who prefer paper.
- **Reusable:** A completed SODAS can be saved. The same Situation can be reassigned to a different child. Mom can also create SODAS templates without a specific situation for common scenarios ("What to do when a sibling takes your toy," "How to handle being left out").
- **Review flow:** Mom sees completed SODAS forms in a review queue or on the child's profile. She can add comments, discuss in person, and mark as reviewed.
- **Shell access:** Available to Guided and Independent shells. Not available to Play (too abstract). Adults can use SODAS for their own decision-making too.

> **Decision rationale:** SODAS is implemented as a Guided Form template type rather than a list or task because it's a structured thinking exercise — not a checkable collection or an actionable work item. The form-based pattern supports future Teaching Self-Government tools and other parenting framework worksheets.

---

## Visibility & Permissions

| Role | Studio Access | Lists Access | List Creation | Template Creation |
|------|-------------|-------------|---------------|-------------------|
| Mom / Primary Parent | Full browsing and customization. All categories. | All lists across family. Create, edit, share, archive. | Create any list type. Share with anyone. | Create and manage all templates. |
| Dad / Additional Adult | Full browsing. Can customize templates for self + permitted kids. | Own lists + lists shared with them. Create, edit own. | Create lists. Share with family. | Create templates for own use. Manage family templates if mom grants permission. |
| Special Adult | No Studio access. | View shared lists for assigned kids during active shift only (e.g., daily schedule list, instruction list). Cannot create or edit. | Cannot create. | Cannot create. |
| Independent (Teen) | Browse templates at Full Magic with mom permission. Customize for self. | Own lists + lists shared with them. Create, edit own. | Create lists for self. Share with family. | Create templates for own use (Full Magic w/ permission). |
| Guided | No Studio access. | View lists shared with them (simplified view). Cannot create. | Cannot create. | Cannot create. |
| Play | No Studio access. | No list access. | Cannot create. | Cannot create. |

> **Tier rationale:** Studio browsing available at Essential tier (mom-only, limited to task/list templates). Full Studio with all template categories at Enhanced+. Teen Studio access at Full Magic with mom permission.

---

## Flows

### Incoming Flows (How Data Gets INTO Lists & Studio)

| Source | How It Works |
|--------|-------------|
| Smart Notepad "Send to... → Lists" (PRD-08) | Inline list picker overlay. Items routed to selected list. If list doesn't exist, create new. |
| Smart Notepad "Send to... → Tasks" (PRD-08) | Deposits into Task Creation Queue (PRD-09A). Not a Lists flow, but establishes the routing pattern. |
| Review & Route (PRD-08) | LiLa extraction can identify list items and suggest routing to Lists. |
| Studio template customization | User customizes a blank template → creates a list or task template. |
| Task → "Save as Template" | Any active task can be saved as a template, appearing in Studio. |
| List → "Save as Template" | Any list can be saved as a template, appearing in Studio. |

### Outgoing Flows (How Lists & Studio Feed Others)

| Destination | How It Works |
|-------------|-------------|
| Tasks (PRD-09A) | List items promoted to tasks via [→ Tasks] button → deposits into Task Creation Queue. Source = 'list_promoted', source_reference_id = list_item.id. |
| Dashboard (PRD-14) | Lists can be pinned as dashboard widgets (lightweight: show list name + progress). |
| LiLa context (PRD-05) | Active lists with `is_included_in_ai = true` available in LiLa context. Example: LiLa knows you have a grocery list and can suggest additions. |
| Activity Log | List completion (all items checked on a list with victory_on_complete = true) auto-creates activity log entry. |
| Victory Recorder (PRD-11) | Lists with `victory_on_complete = true` create a victory when all items are checked (source = 'list_completed'). |

---

## AI Integration

### AI Bulk Add
When user taps [AI Bulk Add] on any list, they paste or speak freeform text. LiLa parses it into structured list items with the appropriate fields for that list type.

Example (Shopping): "We need bananas, 2 bags of spinach, a gallon of whole milk, some butter, and 3 boxes of pasta. Oh and paper towels"
→ Parsed into: Bananas ×6 (Produce), Spinach ×2 bags (Produce), Whole milk ×1 gal (Dairy), Butter ×1 (Dairy), Pasta ×3 boxes (Pantry), Paper towels ×1 (Household)

Example (Wishlist): "Jake wants the new Nintendo controller in black for about $70, and that Percy Jackson boxed set from bookshop.org"
→ Parsed into: Nintendo Switch Pro Controller ($70, notes: "black"), Percy Jackson boxed set (URL detected, routed for lookup)

Same pattern as StewardShip's bulkParse — calls LiLa Edge Function with a parsing prompt, falls back to line splitting if AI fails.

### AI List Organization
User can tap [Organize] on any list → LiLa suggests sections/categories based on item content. Shopping items get grouped by store section. Packing items get grouped by category. User reviews and accepts/adjusts.

### Smart Routing Suggestions
When items arrive via Notepad routing that mix list types (groceries + gifts + tasks), LiLa suggests splitting: "I see grocery items, a gift idea, and two action items. Want me to sort them to your grocery list, Jake's wishlist, and your Task Queue?"

---

## Edge Cases

### Shared List Conflicts
Two family members check off the same item simultaneously. Resolution: last write wins. The item shows as checked with the most recent checker's name. Since list items are simple check/uncheck operations, conflicts are unlikely to cause data loss.

### List Item Promoted to Task, Then Task Deleted
The list item retains its "promoted" badge but the task no longer exists. Tapping the badge shows "This task was removed." Item can be promoted again.

### Very Large Lists
Lists with 100+ items (e.g., comprehensive packing for a family of 11) should load and render without performance issues. Sections help manage visual complexity. Infinite scroll not needed — lists are finite collections.

### Empty List Shared with Family
An empty shared list shows a warm invitation: "This list is ready for items! Anyone in the family can add to it." with [+ Add Item] prominently displayed.

### Archived List Reuse
Archived lists can be duplicated to create a new active list. This is useful for seasonal lists (summer packing, holiday shopping) that get archived after the event but need to come back next year.

### Notepad Routes 20 Items to a List
All 20 items are added to the selected list at once. A toast shows "20 items added to [list name]" with an [Undo] option (removes all 20). Items appear at the bottom of the list in the order they were routed.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|---|---|---|
| `studio_browse` | Browse blank templates in Studio | Essential |
| `studio_customize_tasks` | Customize task/routine/opportunity/sequential templates | Enhanced |
| `studio_customize_lists` | Customize list templates | Essential |
| `studio_teen_access` | Teen access to Studio browsing and customization | Full Magic (mom-permissioned) |
| `studio_trackers_widgets` | Tracker and widget templates | Enhanced (defined by PRD-10) |
| `studio_gamification` | Gamification system templates | Full Magic (defined by PRD-24) |
| `studio_creator_templates` | Create new blank template types | Creator (post-MVP) |
| `lists_basic` | Create and manage personal lists | Essential |
| `lists_sharing` | Share lists with family members | Enhanced |
| `lists_ai_bulk_add` | AI-powered bulk item parsing | Enhanced |
| `lists_ai_organize` | AI-powered list organization/sorting | Enhanced |

All return `true` during beta.

> **Tier rationale:** Lists are a basic utility (Essential tier for personal use). Sharing requires connected family (Enhanced). Studio template customization for tasks requires Enhanced because tasks themselves are Enhanced. AI features are Enhanced for cost management. Teen Studio access and gamification are Full Magic premium features.

---

## Data Schema

### Table: `lists`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| created_by | UUID | | NOT NULL | FK → family_members |
| template_id | UUID | | NULL | FK → list_templates. NULL if created directly. |
| list_name | TEXT | | NOT NULL | |
| list_type | TEXT | | NOT NULL | Config-driven. Initial values: 'shopping', 'wishlist', 'expenses', 'packing', 'todo', 'randomizer', 'custom' |
| description | TEXT | | NULL | |
| is_shared | BOOLEAN | false | NOT NULL | True = shared list (one list, multiple people). |
| victory_on_complete | BOOLEAN | false | NOT NULL | Create victory when all items checked. |
| is_included_in_ai | BOOLEAN | false | NOT NULL | Include in LiLa context assembly. |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Creator has full CRUD. Shared-with members can read and update items. Mom reads all.

**Indexes:**
- `(family_id, list_type)` — filter by type
- `(family_id, created_by)` — "my lists"
- `(family_id, archived_at)` — active lists
- `(family_id, is_shared)` — shared list filter

---

### Table: `list_items`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| list_id | UUID | | NOT NULL | FK → lists |
| item_name | TEXT | | NOT NULL | |
| checked | BOOLEAN | false | NOT NULL | |
| checked_by | UUID | | NULL | FK → family_members. Who checked this item. |
| checked_at | TIMESTAMPTZ | | NULL | |
| section_name | TEXT | | NULL | Grouping header (Produce, Dairy, Clothes, etc.) |
| notes | TEXT | | NULL | |
| url | TEXT | | NULL | For wishlists and reference items |
| quantity | DECIMAL | | NULL | For shopping lists |
| quantity_unit | TEXT | | NULL | items, bags, lbs, oz, gallons, boxes, etc. |
| price | DECIMAL | | NULL | For wishlists and expenses |
| currency | TEXT | 'USD' | NOT NULL | |
| category | TEXT | | NULL | For expenses: Groceries, Dining, etc. |
| item_date | DATE | | NULL | For expenses: transaction date |
| priority | TEXT | | NULL | For wishlists/to-do: 'must_have', 'would_love', 'nice_to_have', 'high', 'medium', 'low' |
| gift_for | TEXT | | NULL | For wishlists: occasion or recipient |
| promoted_to_task | BOOLEAN | false | NOT NULL | Whether this item has been sent to Task Queue |
| promoted_task_id | UUID | | NULL | FK → tasks. Links to the task if promoted. |
| is_repeatable | BOOLEAN | true | NOT NULL | For Randomizer lists: returns to pool after completion |
| is_available | BOOLEAN | true | NOT NULL | For Randomizer lists: false when one-time item completed or manually disabled |
| parent_item_id | UUID | | NULL | FK → list_items. One level of nesting. |
| sort_order | INTEGER | 0 | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Inherits from parent list. Creator and shared members can CRUD items.

**Indexes:**
- `(list_id, sort_order)` — ordered items within list
- `(list_id, section_name)` — items by section
- `(list_id, checked)` — unchecked items first

> **Decision rationale:** All optional fields (URL, price, quantity, category, etc.) live on one `list_items` table rather than separate type-specific tables. This keeps the schema simple and allows Custom lists to use any combination of fields. The list_type on the parent `lists` record determines which fields the UI surfaces.

---

### Table: `list_shares`

Tracks which family members have access to shared lists.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| list_id | UUID | | NOT NULL | FK → lists |
| member_id | UUID | | NOT NULL | FK → family_members |
| is_individual_copy | BOOLEAN | false | NOT NULL | True = this member has their own independent copy of the list |
| can_edit | BOOLEAN | true | NOT NULL | Whether this member can add/remove/reorder items |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Creator can CRUD. Shared members can read their own share records.

**Indexes:**
- `(list_id, member_id)` — unique constraint
- `(member_id)` — "lists shared with me"

---

### Table: `list_templates`

Reusable list blueprints. Live in Studio.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| created_by | UUID | | NOT NULL | FK → family_members |
| template_name | TEXT | | NOT NULL | |
| list_type | TEXT | | NOT NULL | Same enum as lists.list_type |
| description | TEXT | | NULL | |
| default_items | JSONB | '[]' | NOT NULL | Array of {item_name, section_name, notes, quantity, etc.} — the pre-populated items |
| usage_count | INTEGER | 0 | NOT NULL | How many times deployed |
| last_deployed_at | TIMESTAMPTZ | | NULL | |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Same access rules as task_templates.

**Indexes:**
- `(family_id, list_type)` — filter by type
- `(family_id, archived_at)` — active templates

---

### Table: `studio_queue`

The universal creation queue. Receives draft items from Notepad, LiLa, Review & Route, Goals, Meeting action items, Task Requests, and other sources. Each item has a destination flag indicating whether it's headed for Tasks, Lists, or Widgets.

> **Depends on:** Task Creation Queue stub — defined in PRD-08. Queue processing UI — defined in PRD-09A (Screen 2).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| owner_id | UUID | | NOT NULL | FK → family_members. Who this queue item belongs to. |
| destination | TEXT | 'task' | NOT NULL | Enum: 'task', 'list', 'widget', 'tracker'. Determines which creation flow processes this item. |
| content | TEXT | | NOT NULL | The raw content/title of the draft item |
| content_details | JSONB | '{}' | NOT NULL | Additional structured data from the source (e.g., parsed items from Review & Route, structure_flag from Notepad) |
| source | TEXT | | NOT NULL | Enum: 'notepad_routed', 'review_route', 'lila_conversation', 'meeting_action', 'goal_decomposition', 'project_planner', 'member_request', 'list_promoted' |
| source_reference_id | UUID | | NULL | FK to the source record |
| structure_flag | TEXT | | NULL | From PRD-08: 'single', 'individual', 'ai_sort', 'sequential', 'chronological' |
| requester_id | UUID | | NULL | FK → family_members. For member_request source — who sent the request. |
| requester_note | TEXT | | NULL | Optional message from the requester |
| processed_at | TIMESTAMPTZ | | NULL | When this item was configured and promoted. NULL = still in queue. |
| dismissed_at | TIMESTAMPTZ | | NULL | When this item was dismissed without processing. |
| dismiss_note | TEXT | | NULL | Optional note when declining a request |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Mom sees all family queue items. Other members see only items where owner_id = their member ID. Requesters can see the status of their requests.

**Indexes:**
- `(family_id, owner_id, processed_at, dismissed_at)` — pending items for a member
- `(family_id, source)` — filter by source
- `(family_id, destination)` — filter by destination type

> **Decision rationale:** One universal queue with a `destination` flag rather than separate queues per feature type. This keeps the queue UI unified (one tab on the Tasks page showing all pending items) while allowing each item to route to the right creation flow when processed. Future PRDs add destination values as needed.

---

## What "Done" Looks Like

### Must Have (MVP Core)
- [ ] Studio page renders with blank template cards organized by category
- [ ] "Coming Soon" cards for future template categories (trackers, widgets, tools, gamification)
- [ ] "My Customized" tab shows all user's customized templates with deployment status
- [ ] [Customize] on task/routine/opportunity/sequential templates opens Task Creation Modal (PRD-09A)
- [ ] [Customize] on list templates opens List Creation flow
- [ ] Lists page renders all user's lists with type filtering
- [ ] List Creation flow works for all 6 list types (Shopping, Wishlist, Expenses, Packing, To-Do, Custom)
- [ ] List Detail view with type-appropriate fields, checkboxes, sections, drag-to-rearrange
- [ ] Shopping list: quantity, unit, section grouping
- [ ] Wishlist: URL field, price, notes, gift_for, estimated total
- [ ] Packing list: sections, progress bar
- [ ] List sharing: shared (one list, multiple members) and individual copies
- [ ] List item promotion to Task Creation Queue via [→ Tasks] button
- [ ] Notepad → Lists routing with inline list picker overlay
- [ ] AI Bulk Add on lists (freeform text → parsed items)
- [ ] Save any list as template to Studio
- [ ] `studio_queue` table created and processing integrated with PRD-09A Queue UI
- [ ] `lists`, `list_items`, `list_shares`, `list_templates` tables created with RLS
- [ ] Drag-to-rearrange on all list items (cross-cutting convention from PRD-08)
- [ ] Randomizer list type: items with repeatable/one-time flags, category grouping, [Draw] button with animation, re-draw option, auto-assign to child as task on confirm
- [ ] Randomizer dashboard widget: one-tap [Draw] shortcut for a specific Randomizer list
- [ ] Guided Form (SODAS) template: mom fills Situation, assigns to child, child completes O-D-A-S sections
- [ ] SODAS: LiLa assistance toggle per assignment (configurable by mom)
- [ ] SODAS: print option for formatted paper worksheet
- [ ] SODAS: mom review flow for completed forms
- [ ] Victory on list completion (victory_on_complete flag)
- [ ] Activity log trigger for list completions

### MVP When Dependency Is Ready
- [ ] Tracker and widget template cards in Studio (requires PRD-10)
- [ ] Gamification system template cards in Studio (requires PRD-24)
- [ ] Tool template cards in Studio (requires Library Vault / Tool PRDs)
- [ ] List pinning as Dashboard widget (requires PRD-14)
- [ ] LiLa context integration for active lists (requires PRD-05 wiring)

### Post-MVP
- [ ] AI List Organization (auto-suggest sections/categories)
- [ ] Smart routing suggestions (auto-split mixed brain dumps to multiple lists)
- [ ] List export (CSV, text, share link)
- [ ] Expense list totals with category breakdown
- [ ] Creator tier: custom blank template design in Studio
- [ ] Studio marketplace for shared/sold templates
- [ ] Barcode scanning for shopping list items
- [ ] Store-specific aisle mapping for shopping lists
- [ ] Collaborative real-time cursors on shared lists (seeing who's editing)

---

## CLAUDE.md Additions from This PRD

- [ ] Studio page is the universal template browsing surface. ALL template categories from all PRDs render here. Future PRDs add their template cards to Studio categories, not to separate pages.
- [ ] Lists and Tasks are distinct systems. Lists = reference collections (no rewards, no tracking, no approval). Tasks = actionable items with accountability. To-Do lists bridge them via item promotion.
- [ ] List types are config-driven. Adding a new list type = config object, not code change. Each type defines available fields and behaviors.
- [ ] `list_items` table uses one schema for all list types with optional fields. The `list_type` on the parent `lists` record determines which fields the UI surfaces.
- [ ] `studio_queue` is the universal creation queue with a `destination` flag. One queue, multiple processing flows. PRD-09A's Queue UI (Screen 2) is the management surface for all queue items.
- [ ] Notepad → Lists routing uses the inline picker overlay pattern from PRD-08.
- [ ] List item promotion to tasks: source = 'list_promoted', source_reference_id = list_item.id.
- [ ] Shared lists: `is_shared = true` on the list + `list_shares` records for each member. Individual copies: `list_shares` with `is_individual_copy = true`.
- [ ] "Save as Template" is a universal action available on any active task or list. Creates a template record in the appropriate template table.
- [ ] Randomizer list type: items tagged repeatable/one-time, category grouping, [Draw] with animation, auto-assign to child as task. General-purpose — works for extra jobs, name drawing, dinner picking, anything.
- [ ] Guided Form template category: structured multi-section worksheets assigned by parent, completed by child. SODAS is the first instance. Pattern supports future Teaching Self-Government and other framework tools.
- [ ] SODAS forms: LiLa assistance configurable per assignment. Print option available. Completed forms visible to assigning parent for review.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `lists`, `list_items`, `list_shares`, `list_templates`, `studio_queue`

Enums updated:
- `studio_queue.destination`: 'task', 'list', 'widget', 'tracker'
- `studio_queue.source`: 'notepad_routed', 'review_route', 'lila_conversation', 'meeting_action', 'goal_decomposition', 'project_planner', 'member_request', 'list_promoted'
- `lists.list_type`: 'shopping', 'wishlist', 'expenses', 'packing', 'todo', 'randomizer', 'custom'

Triggers added:
- AFTER UPDATE on `list_items` (all items checked on a list with victory_on_complete) → insert victory record + activity_log entry

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Studio houses ALL template categories platform-wide** | One browsable surface prevents template-category sprawl across feature pages. Future PRDs add cards to Studio rather than creating their own template pages. |
| 2 | **Studio includes trackers, widgets, tools, and gamification templates** | These are all "blank format → customize → deploy" patterns that share the Studio pipeline. Each is defined by its own PRD but browsed in Studio. |
| 3 | **"Coming Soon" cards for undefined template categories** | Shows users what's coming, builds anticipation, and establishes that Studio will grow. Prevents confusion about why some categories are empty. |
| 4 | **Six list types at launch: Shopping, Wishlist, Expenses, Packing, To-Do, Custom** | Covers the most common family list needs. Config-driven so new types can be added without code changes. Each type has purpose-built fields. |
| 5 | **All list item fields on one table with optional columns** | Simpler than type-specific tables. Custom lists can use any combination of fields. UI surfaces appropriate fields based on parent list type. |
| 6 | **One universal `studio_queue` with destination flags** | Unifies the queue experience. Mom processes all pending items from one surface regardless of whether they're headed for Tasks, Lists, or Widgets. |
| 7 | **Lists and Tasks are distinct systems** | Lists are reference collections (no rewards, no tracking). Tasks are actionable with accountability. To-Do lists bridge them via promotion. This prevents feature creep in both directions. |
| 8 | **To-Do list type is the bridge between Lists and Tasks** | Quick capture scratchpad that feeds the task system. Every To-Do item has a one-tap [→ Tasks] promotion path. |
| 9 | **List sharing: shared (one list) vs. individual (copies)** | Shared grocery list = collaborative. Individual reading lists = independent tracking. Both patterns needed for family use. |
| 10 | **Studio template categories use "Coming Soon" stubs** | Studio is architecturally ready for all categories at launch. Content fills in as PRDs are written and built. |
| 11 | **Wishlist URL + price + notes fields** | Kids need to specify exactly what they want (color, size, model) with links. Parents need to see estimated costs. This is a high-frequency family use case. |
| 12 | **Notepad → Lists routing with inline picker and smart splitting** | When a brain dump mixes groceries and gift ideas, LiLa suggests splitting. Prevents accidental routing of everything to one list. |
| 13 | **Randomizer list type as general-purpose draw tool** | Extra jobs, name drawing, dinner picking, activity selection all use the same infrastructure. Categories (quick/medium/big) let mom control intensity. Fun draw animation makes it engaging. |
| 14 | **SODAS / Guided Form as new template category** | Structured thinking exercises aren't lists or tasks — they're worksheets. A dedicated Guided Form template type supports SODAS and future parenting framework tools (Teaching Self-Government, etc.). |
| 15 | **SODAS: LiLa assistance configurable per assignment** | Some parents want children to think independently; others want AI scaffolding. Mom toggles per assignment. Default OFF. |
| 16 | **SODAS: Digital with print option** | Families have different preferences. Digital enables mom review and reuse. Print enables hands-on paper worksheets. Both available. |
| 17 | **Randomizer: Dashboard widget shortcut** | When a child earns an extra job, mom needs it fast. One-tap Draw button on her dashboard, plus the full list page. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Tracker and widget template types in Studio | PRD-10 (Widgets) defines template content and creation flow |
| 2 | Gamification system templates in Studio | PRD-24 (Rewards & Gamification) defines systems and customization |
| 3 | Tool templates in Studio | Library Vault and Tool PRDs define content |
| 4 | Full expense tracking and budgeting | PRD-28 (Tracking, Allowance & Financial) |
| 5 | Creator tier: design new blank template types | Creator Tier PRD (post-MVP) |
| 6 | Studio marketplace for template sharing/selling | Creator Tier PRD (post-MVP) |
| 7 | Barcode scanning for shopping lists | Post-MVP enhancement |
| 8 | Store-specific aisle mapping | Post-MVP enhancement |
| 9 | Collaborative real-time cursors on shared lists | Post-MVP enhancement |
| 10 | AI List Organization (auto-suggest sections) | Post-MVP AI enhancement |
| 11 | List pinning as Dashboard widget | PRD-14 (Personal Dashboard) |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-08 (Journal + Smart Notepad) | Lists routing destination fully defined. Inline list picker specified. Smart splitting behavior for mixed brain dumps. | Update "Send to... → Lists" stub to reference PRD-09B Screen 5. |
| PRD-09A (Tasks) | `studio_queue` table replaces the simpler `task_queue` concept. Queue UI (PRD-09A Screen 2) now processes items with destination flags. | Update Queue screen to handle destination = 'list' (routes to List Creation) and destination = 'widget' (routes to Widget Creation, PRD-10). |
| PRD-10 (Widgets) | Studio page structure defined. Tracker/widget template cards reserved as "Coming Soon." Studio queue supports destination = 'widget'. | PRD-10 defines tracker/widget template content, creation flows, and wires the Studio "Coming Soon" cards to live functionality. |
| PRD-14 (Personal Dashboard) | List pinning as lightweight dashboard widget mentioned. | Dashboard PRD should include list widget type showing list name + progress. |
| PRD-24 (Rewards & Gamification) | Gamification system templates reserved in Studio as "Coming Soon." | PRD-24 defines gamification template content and customization, wires to Studio. |
| PRD-04 (Shell Routing) | Studio added as sidebar navigation item with subtitle. | Add Studio to sidebar navigation definition. |
| PRD-05 (LiLa Core) | Lists with `is_included_in_ai = true` join LiLa context assembly. AI Bulk Add uses LiLa Edge Function. | Add list context loading to context assembly pipeline. Add bulk parsing prompt pattern. |
| Planning Decisions | Studio confirmed as universal template hub for all future PRDs. PRD-10 scope clarified: widget/tracker content, not Studio page structure. | Update PRD-10 scope description in PRD order. |

---

*End of PRD-09B*
