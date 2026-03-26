> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-21A: AI Vault — Browse & Content Delivery

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts — sidebar navigation, QuickTasks strip), PRD-05 (LiLa Core AI System — guided mode registry, context assembly, conversation modals, `container_preference` field), PRD-05C (LiLa Optimizer — prompt optimization flow), PRD-13 (Archives & Context — person context, family context, physical descriptions, wishlists), PRD-21 (Communication & Relationship Tools — AI Toolbox sidebar pattern, `lila_tool_permissions`, "+Add to AI Toolbox" stub)
**Created:** March 14, 2026
**Last Updated:** March 14, 2026

---

## Overview

The AI Vault is the platform's front door and revenue engine. It is a Netflix-style browsable library of AI tutorials, interactive tools, prompt packs, and workflows — the thing that pulls subscribers in. The family management system (tasks, dashboards, journals, communication tools) is what makes them stay.

The Vault serves two strategic purposes. First, it teaches moms to use AI through a natural learning ladder: Fun & Creative content (the hook — coloring pages, storybook characters, children's books) → Practical & Problem-Solving content (the value — meal planning, homework help, schedule optimization) → Creator content (the graduation — building custom GPTs, creating courses, launching AI-powered side projects). Second, it delivers interactive AI tools that run within the platform, some powered by LiLa and personalized with family context, and some embedded from external platforms.

The relationship between the AI Vault and the AI Toolbox (PRD-21) is catalog-to-launcher: the Vault is the browsable storefront where mom discovers content. The Toolbox is the personalized per-member launcher where assigned tools live for daily use. Mom browses the Vault, finds a tool she wants a family member to have, taps "+Add to AI Toolbox," and that tool appears in the member's Toolbox sidebar and QuickTasks strip.

> **Mom experience goal:** Browsing the Vault should feel like scrolling Netflix — visually rich, endlessly interesting, and always surfacing something she didn't know she needed. Every tap should lead to either learning something or doing something, never to a dead end.

---

## User Stories

### Content Discovery
- As a mom, I want to browse AI tutorials and tools organized by category so I can explore what's available without knowing exactly what I'm looking for.
- As a mom, I want a "Continue Learning" row at the top of the Vault so I can pick up where I left off without digging through categories.
- As a mom, I want to search for content by keyword so I can find specific tutorials or tools quickly.
- As a mom, I want to filter content by type (tutorials, tools, prompt packs) and difficulty level so I can find what matches my current skill level.
- As a mom, I want seasonal and holiday content surfaced automatically during relevant times of year so I never miss timely resources.

### Content Consumption
- As a mom, I want to open a tutorial directly within the platform so I don't lose context by navigating to an external site.
- As a mom, I want to browse image style prompt packs in a visual gallery so I can see what each style looks like before copying the prompt.
- As a mom, I want to copy any prompt with one tap so I can paste it into whatever AI platform I use.
- As a mom, I want to personalize prompts with my family context using "Optimize with LiLa" so I get results tailored to my specific kids and situation.
- As a mom, I want to launch LiLa-powered tools directly from the Vault in a conversation modal so I can use them without leaving the browse experience.

### Content Management & Progress
- As a mom, I want to bookmark content for later so I can save interesting items without losing them.
- As a mom, I want my progress tracked on tutorials so I can see what I've completed and what I've started.
- As a mom, I want to save prompts to my personal prompt library so I can reuse them — whether I saved them as-is or after LiLa personalized them.
- As a mom, I want to request tutorials on topics the Vault doesn't cover yet so the content evolves based on what I actually need.

### Family Tool Assignment
- As a mom, I want to add AI tools from the Vault to specific family members' AI Toolboxes so each person has the tools that are right for them.
- As a dad, I want to browse the Vault if my wife has granted me access, so I can discover tools and content on my own.
- As a teen, I want to see only the Vault content my mom has made available to me, so I'm not overwhelmed or exposed to content she hasn't approved.

### Tier Awareness
- As a non-subscribed user, I want to see what content exists at higher tiers (with enticing hook titles and locked styling) so I'm motivated to upgrade.
- As a subscribed user, I want clear visual indicators of what's included in my tier so I never feel like the platform is withholding value from me.

---

## Screens

### Screen 1: Vault Browse Page (Main Library)

**What the user sees:**

> **Depends on:** PRD-04 sidebar navigation — AI Vault is a sidebar nav item. PRD-03 Design System for theme variables and card component patterns.

The Vault page is organized vertically in distinct sections:

**Section A — Hero Spotlight:**
A large featured content area at the top. Admin-curated (PRD-21B). Shows 1-3 rotating spotlighted items with large thumbnail, hook title, short description, and CTA button ("Start Tutorial" / "Try This Tool" / "Browse Pack"). The hero section has a subtle parallax or fade animation on scroll.

> **Decision rationale:** The hero section gives admin control over what users see first. This is marketing real estate — use it to showcase flagship content, new releases, or seasonal features.

**Section B — Continue Learning (conditional):**
Appears only if the user has items with `progress_status = 'in_progress'`. A horizontal-scroll row of cards showing items they've started but not finished, sorted by `last_accessed_at` descending. Each card shows progress indicator (bar or percentage). Tapping opens the item's detail view.

**Section C — Recommended for You (conditional):**
A horizontal-scroll row of personalized recommendations. At MVP, uses simple signals: items in categories the user has engaged with that they haven't started, weighted by newness, plus items tagged as prerequisites for things they're working on. This row does not appear for brand-new users with no engagement history — they see the hero and category rows instead.

> **Forward note:** Post-MVP, recommendations can incorporate collaborative filtering ("Moms like you also use...") and Archives-driven suggestions (family context informing content suggestions). The data model supports this without restructuring.

**Section D — Category Rows:**
The main browse experience. Each category is a horizontal-scrolling row with a label ("Creative & Fun," "Home Management," "AI Learning Path," etc.). Each row shows content cards that can be swiped left-to-right on mobile and scrolled horizontally on desktop. Categories are admin-defined (PRD-21B) with sort order.

```
┌──────────────────────────────────────────────────────┐
│  Creative & Fun                          See All >   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │     │ │     │ │     │ │     │ │     │  ← swipe  │
│  │card │ │card │ │card │ │card │ │card │            │
│  │     │ │     │ │     │ │     │ │     │            │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │
│                                                      │
│  Home Management                         See All >   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │     │ │     │ │ 🔒  │ │     │ │ 🔒  │  ← swipe  │
│  │card │ │card │ │lock │ │card │ │lock │            │
│  │     │ │     │ │     │ │     │ │     │            │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘          │
└──────────────────────────────────────────────────────┘
```

"See All" on a category row navigates to a full-grid view of that category's items.

**Section E — Search & Filters:**
A search bar at the top of the page (sticky on scroll, below the page header). Full-text search across `display_title`, `detail_title`, `short_description`, `full_description`, and `tags`. Filter chips below the search bar: content type (tutorial, ai_tool, prompt_pack, skill, tool_collection, workflow), difficulty (beginner, intermediate, advanced), and tags. Filters can be combined. Active filters show as filled chips; tapping toggles them. A "Bookmarks" filter shows only bookmarked items.

When search is active or filters are applied, category rows are replaced by a flat grid of matching items.

**Interactions:**
- Tap a card → opens Screen 2 (Content Detail View)
- Tap a locked card → opens Screen 3 (Upgrade Modal)
- Tap "See All" on a category row → shows full grid of that category
- Tap search → keyboard opens, results appear as typed (debounced)
- Tap a filter chip → toggles filter, results update instantly
- Swipe left/right on a category row → scrolls content cards

**Data created/updated:**
- `vault_user_visits`: records visit timestamp for NEW badge calculation
- `vault_first_sightings`: records first-seen timestamp per user per item (for NEW badge countdown)

### Screen 2: Content Detail View

The detail view is the core consumption surface. It adapts its layout based on content type.

**Entry:** Tapping any content card opens the detail view. On desktop, this renders as a large modal (lg: 800px or xl: 960px) with semi-transparent backdrop. On mobile, it renders as a full-screen view with a back button. The user does not navigate away from the Vault page on desktop — the modal overlays it.

> **Mom experience goal:** Opening a detail view should feel like picking up a book from a shelf — immersive but not a commitment. Closing it puts her right back where she was.

#### Detail View: Tutorial

**What the user sees:**
- **Header:** Display title, content type badge ("Tutorial"), difficulty badge, estimated time, bookmark button
- **Content area:** Either rich-text content rendered natively (Markdown body), an embedded iframe (Gamma page, video embed), or both (video at top, written steps below)
- **Learning outcomes:** A brief list of what the user will learn (admin-authored)
- **Tags:** Clickable tags for cross-discovery
- **Action bar:** [Bookmark] [Optimize with LiLa] [+ Add to AI Toolbox] (if applicable)
- **Progress indicator:** Shows current progress if user has started this tutorial

**Interactions:**
- Scroll through content → progress auto-tracks based on scroll position / section completion
- Tap "Optimize with LiLa" → opens Screen 5 (Optimize with LiLa Modal)
- Tap "Bookmark" → toggles bookmark state
- Close modal → saves progress, returns to browse

**Data created/updated:**
- `vault_user_progress`: upserts status, progress_percent, last_accessed_at

#### Detail View: AI Tool

**What the user sees:**
- **Header:** Display title, content type badge ("AI Tool"), bookmark button
- **Portal section:** Tool description, usage tips (portal_tips), prerequisites, platform requirements
- **Action bar:** [Launch Tool] [Bookmark] [+ Add to AI Toolbox]

**Interactions:**
- Tap "Launch Tool" →
  - If `delivery_method = 'native'` (LiLa-powered): opens a LiLa conversation modal in the tool's registered guided mode. Uses `container_preference: 'modal'` from PRD-21's convention.
  - If `delivery_method = 'embedded'`: loads the tool in an iframe within the detail view (or a dedicated tool portal view)
  - If `delivery_method = 'link_out'`: opens the tool URL in a new tab/window
- Tap "+ Add to AI Toolbox" → opens Screen 4 (Member Assignment Modal)

**Data created/updated:**
- `vault_tool_sessions`: creates session record with token, start time, expiry
- `vault_user_progress`: marks as started/launched

#### Detail View: Prompt Pack

This is the most visually rich detail view. Layout adapts based on `prompt_format`.

**For `image_gen` / `video_gen` prompt packs (Gallery Mode):**

**What the user sees:**
- **Header:** Pack title, prompt count ("20 styles"), format badge ("Image Prompts"), bookmark button, favorite heart
- **Gallery:** A masonry-style grid of example output images from all prompt entries in the pack. Images are the hero — large, beautiful, swipeable. This is the "Product Photo Styles" / "Lighting Styles & Moods" layout from the AI Black Magic reference.

**Interactions:**
- Hover/tap an image → reveals an overlay card with:
  - Entry title (e.g., "Watercolor Storybook")
  - Prompt text (truncated, expandable)
  - [Copy Prompt] button
  - [Optimize with LiLa] button
  - [Save to My Prompts] button
- Long-press or tap-hold an image → option to download or save as a style reference
- "Style References" section (if entry has `reference_images`): downloadable images the user can use as inputs to their image generator. Individual download or "Download All" (zipped).

> **Decision rationale:** Gallery mode for image/video prompts mirrors how users browse visual content on platforms like Pinterest and Unsplash. The image IS the discovery mechanism — you see a style you love, you grab the prompt. Text would slow this down.

**For `text_llm` / `audio_gen` prompt packs (List Mode):**

**What the user sees:**
- **Header:** Pack title, prompt count, format badge ("LLM Prompts"), bookmark button
- **Prompt list:** Expandable cards for each prompt entry. Collapsed shows title and first line. Expanded shows full prompt text with variable placeholders highlighted.

**Interactions:**
- Tap to expand/collapse a prompt entry
- [Copy Prompt] per entry
- [Optimize with LiLa] per entry → opens Screen 5 with this specific prompt pre-loaded
- [Save to My Prompts] per entry

**For both modes:**
- Action bar at pack level: [Bookmark] [+ Add to AI Toolbox]
- Content protection: prompt text is not selectable. Copy only via the Copy button. Right-click disabled on images. All copy actions logged.

**Data created/updated:**
- `vault_user_progress`: marks pack as started when any entry is interacted with, completed when all entries have been viewed
- `vault_copy_events`: logs each copy action (user, item, entry, timestamp)

#### Detail View: Tool Collection

**What the user sees:**
- **Header:** Collection title, item count, description
- **Grid of contained items:** Cards for each Vault item in the collection, rendered the same as browse cards but in a contained grid
- Tapping a contained item opens its own detail view (tutorial, tool, or prompt pack)

#### Detail View: Workflow

**What the user sees:**
- **Header:** Workflow title, step count, estimated total time
- **Step-by-step layout:** Numbered steps, each with instructions, embedded prompts (with copy buttons), and references to external tools. Similar to the AI Black Magic "Simple Photo To Professional Marketing Video" example — a video walkthrough at the top, then detailed written steps below with copyable prompts per step.

### Screen 3: Upgrade Modal (Locked Content)

> **Depends on:** PRD-01 subscription tiers. Visuals follow PRD-03 design system.

**What the user sees:**

When a user taps a card for content above their subscription tier, the detail view opens but the content area is replaced with an upgrade prompt:

- The item's hook title and thumbnail (visible — this is marketing)
- The short description (visible — they should want it)
- A message: "This [tutorial/tool/pack] is available on the [Tier Name] plan"
- The user's current plan name
- A preview of what else they'd unlock by upgrading (2-3 other items from that tier)
- Buttons: [See Plans] [Maybe Later]

> **Decision rationale:** Locked content remains visible in the browse experience so users know what's available at higher tiers. The hook title and short description are always visible; the full description and content are gated. This creates aspiration without deception.

**Card-level lock treatment:**
- Locked cards in the browse rows show the thumbnail with a theme-dependent grayed-out/faded overlay
- A tier badge icon (Lucide icon, tier-specific, theme-colored) appears on the card overlay
- The hook title remains visible and readable through the fade
- The lock styling is applied via CSS overlay on the thumbnail — the underlying image is the same, the treatment signals "you'd need to upgrade for this"

> **Decision rationale:** The overlay creates visual consistency across cards with different thumbnail styles. The tier-specific Lucide icon helps users learn the tier iconography naturally by seeing it repeatedly.

### Screen 4: Member Assignment Modal ("+Add to AI Toolbox")

> **Depends on:** PRD-21 AI Toolbox sidebar, PRD-05 `lila_tool_permissions`.

**What the user sees:**

When mom taps "+Add to AI Toolbox" on any `ai_tool` type Vault item:

```
┌──────────────────────────────────────────┐
│  Add to AI Toolbox                       │
│  ──────────────────────────────────────  │
│                                          │
│  [Tool Name]                             │
│  Add this tool to family members'        │
│  AI Toolboxes                            │
│                                          │
│  ☑ Mom (you)          [calendar_color]   │
│  ☐ Dad                [calendar_color]   │
│  ☐ Emma (14)          [calendar_color]   │
│  ☐ Jake (11)          [calendar_color]   │
│  ── Guided/Play members ──               │
│  ☐ Lily (7)           [calendar_color]   │
│  ☐ Sam (4)            [calendar_color]   │
│                                          │
│  [Cancel]              [Add to Toolbox]  │
└──────────────────────────────────────────┘
```

- Family members listed with their `calendar_color` indicator
- Mom pre-checked by default
- In-household members grouped at top, Out of Nest behind a "More" expansion
- Guided/Play members shown with a note: "Tool will appear in their simplified Toolbox"
- Checkboxes for multi-select

**Interactions:**
- Check/uncheck members → toggle selection
- Tap "Add to Toolbox" → creates `lila_tool_permissions` records with `source = 'vault'`, `vault_item_id` referencing the Vault item
- If the tool is already in a member's Toolbox, their checkbox shows as checked and disabled with "(already added)"

**Data created/updated:**
- `lila_tool_permissions`: new rows linking the Vault item to selected members

> **Forward note:** Only `ai_tool` type items can be added to the Toolbox. Tutorials and prompt packs are consumed in the Vault itself. The "+Add to AI Toolbox" button does not appear on tutorial or prompt_pack items.

### Screen 5: Optimize with LiLa Modal

> **Depends on:** PRD-05 LiLa conversation engine, PRD-05C LiLa Optimizer, PRD-13 Archives context assembly.

**What the user sees:**

A LiLa conversation modal (same engine and container as PRD-21's tool modals) opens with context pre-loaded:

- The Vault item's `lila_optimization_prompt` (admin-authored instructions for how LiLa should personalize this content)
- The specific prompt text being optimized (if opened from a prompt entry)
- The user's family context from Archives (assembled per PRD-05/PRD-13 pipeline)
- **For image/video prompts specifically:** the selected person's `physical_description` from Archives (if a person is selected via the pill selector), including hair color, skin tone, eye color, build, typical clothing — everything needed to create an accurate image prompt

LiLa's opening message acknowledges the context: "I've got [Prompt Pack Name] loaded and I know your family. What would you like me to personalize? You can tell me which family member, what the image is for, or any details you want included."

**Interactions:**
- User types instructions ("make this for my daughter Emma" / "adapt this for a birthday party" / "I want this in a cottagecore style for my living room")
- LiLa produces a personalized version of the prompt
- Action chips on LiLa's response: [Copy] [Save to My Prompts] [Edit in Notepad]

**Data created/updated:**
- `lila_conversations`: new conversation with `guided_mode = 'optimizer'`, `vault_item_id` in metadata
- `lila_messages`: conversation messages

### Screen 6: Personal Prompt Library

A lightweight page accessible from sidebar navigation (under the AI Vault section) where users manage prompts they've saved.

**What the user sees:**
- A list of saved prompts, each showing: user-editable title, prompt text (truncated), source info ("From: Whimsical Children's Book Styles" or "LiLa Optimized" or "Created by me"), tags, date saved
- Search bar for filtering saved prompts
- Sort options: newest, alphabetical, most recently used

**Interactions:**
- Tap a saved prompt → expands to show full text
- [Copy] → copies prompt text (logged)
- [Edit] → allows editing title, text, and tags
- [Delete] → removes with confirmation
- [Optimize with LiLa] → opens Optimizer modal with this prompt pre-loaded
- [+ New Prompt] → creates a blank prompt entry for user to write their own

**Data created/updated:**
- `user_saved_prompts`: CRUD operations

### Screen 7: Request a Tutorial

A simple form accessible from the Vault page (a subtle "Request Content" link in the page footer or sidebar).

**What the user sees:**
- Title: "Request a Tutorial or Tool"
- Fields: Topic/title (text), Description of what you'd like (textarea), Category suggestion (optional dropdown), Priority (low/medium/high)
- Submit button

**Interactions:**
- Fill form → submit → confirmation toast: "Thanks! We review all requests."
- Submitted requests appear in admin queue (PRD-21B) in a format designed for easy copy-paste into AI for processing

**Data created/updated:**
- `vault_content_requests`: new record with user_id, topic, description, category, priority, status='pending'

---

## Vault Content Card Design

Every item in the Vault is displayed as a card in browse rows and grids. Cards have a consistent overlay structure regardless of content type.

**Card anatomy:**

```
┌──────────────────────────┐
│  [Thumbnail Image]       │
│  ┌────────────────────┐  │
│  │ 📐 Tutorial        │  │  ← content type badge (top-left)
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │ ✨ Enhanced         │  │  ← tier badge (top-right, Lucide icon + tier name)
│  └────────────────────┘  │
│                          │
│  "Custom Coloring Pages  │  ← hook title (display_title)
│   in Minutes"            │
│                          │
│  Quick Solutions · ⭐NEW  │  ← category + NEW badge (if applicable)
│                          │
│  [🔖]                    │  ← bookmark icon (bottom-right)
└──────────────────────────┘
```

**For locked cards:** The thumbnail gets a theme-dependent faded overlay (semi-transparent wash in the theme's muted color). The tier badge is more prominent. The hook title remains readable through the fade. Tapping opens the upgrade modal, not the detail view.

**For subscribed cards on hover/tap:** A subtle reveal of the `short_description` text below the hook title, giving more context without opening the full detail view. On mobile, this reveal happens on tap-and-hold or as a secondary line always visible.

**Card overlay elements are consistent** regardless of the underlying thumbnail image. This creates visual coherence across the Vault even when thumbnails vary in style, brightness, and composition.

> **Decision rationale:** The overlay approach (badges, title, tier indicator) applied on top of thumbnails allows full creative freedom in thumbnail design while maintaining a scannable, consistent card grid. The tier-specific Lucide icon and color create a learnable visual language for subscription levels.

---

## Content Type Taxonomy

| Content Type | `content_type` Value | Rendering | "+Add to Toolbox" |
|---|---|---|---|
| Tutorial | `tutorial` | Detail view with rich text and/or iframe content | No |
| AI Tool | `ai_tool` | Portal + launch (native/embedded/link-out) | **Yes** |
| Prompt Pack | `prompt_pack` | Gallery (image/video) or list (text/audio) based on `prompt_format` | No |
| Tool Collection | `tool_collection` | Grid of contained Vault items | No |
| Workflow | `workflow` | Step-by-step instructions with embedded prompts | No |
| Skill | `skill` | Product page with platform selector + deploy actions | **Yes** (via Deploy with LiLa → external tool) |

### Skill Content Type

A skill is a **deployable AI instruction set** — a structured Markdown file (or instruction block) that users load into their own AI platform account to create a specialized AI assistant. Skills follow the Agent Skills open standard and work across Claude (Skills), ChatGPT (Custom GPTs), and Gemini (Gems). Free users can create and use skills on Claude and Gemini; ChatGPT requires a Plus subscription to create Custom GPTs but free users can use others' GPTs.

> **Decision rationale:** Skills are structurally distinct from prompt packs (they're not collections of prompts you copy) and from ai_tools (they don't run inside the platform). They're deployable instruction sets that create standalone AI assistants on the user's own platform. The rendering, user action (deploy rather than copy or launch), and value proposition warrant their own content type. This is also where MyAIM's unique value shines — competitors sell generic skills for $15/month; MyAIM personalizes them with family context and connects them to the monthly context update loop.

**Skill detail view shows:**
- What the skill does (description, example interactions, use cases)
- Compatible platforms with icons (Claude, ChatGPT, Gemini, other)
- Difficulty level and estimated setup time
- The skill framework (viewable but content-protected — same no-text-selection rules)
- Action buttons:
  - **[Deploy with LiLa]** — the premium action. LiLa personalizes the skill with family context, formats for the chosen platform, includes context update instructions, and registers the deployment in the External Tool Registry. This creates the full context update loop from the External Tool Generation & Context Update Loop document.
  - **[Download for Claude]** — downloads the raw .md skill file (generic, no personalization)
  - **[Copy for ChatGPT]** — copies instructions formatted for Custom GPT creation
  - **[Copy for Gemini]** — copies instructions formatted for Gem creation
- Content protection: skill instruction text is not text-selectable, copy only via platform-specific buttons, all copies logged

**Skills that generate structured data** (like a Homework Helper that produces session reports) can include instructions for generating a `=== SESSION REPORT ===` block at the end of each use. The user copies this report back into MyAIM (via Smart Notepad's Review & Route or a dedicated import field), feeding data back into Archives, Widgets/Trackers, and homeschool tracking. This creates a two-way value loop: MyAIM context makes the skill smarter → the skill generates data that enriches MyAIM context → next month's context update is even better.

> **Forward note:** The full External Tool Registry, context update pipeline, and "Deployed Tools" section of the AI Toolbox are defined in the External Tool Generation & Context Update Loop document. PRD-21A establishes the Vault as the discovery surface for skills; the deployment and update mechanics are implemented as part of PRD-05C (Optimizer) and PRD-19 (Family Context) per that document.

**`target_platforms` field:** TEXT array on `vault_items` for skill items — e.g., `['claude', 'chatgpt', 'gemini']`. Determines which platform download/copy buttons appear. Admin-set during upload (PRD-21B).

### Skill Pattern Deep Dive: How "Deploy with LiLa" Works End-to-End

This section documents the complete flow so that build-time context is preserved. The pattern applies to ALL skills in the Vault, not just the example below.

**Step 1: Mom finds a skill in the Vault.**
She's browsing the "AI Skills" category and sees "Homework Helper — AI Tutor for Any Subject." She taps the card.

**Step 2: She reads the detail view.**
The skill detail page shows: what the Homework Helper does (helps kids work through homework by asking guiding questions instead of giving answers, adapts to the child's learning style, generates session reports), which platforms it works on (Claude, ChatGPT, Gemini), difficulty (beginner — setup takes ~5 minutes), and a preview of example interactions.

**Step 3: She taps "Deploy with LiLa."**
A LiLa conversation modal opens. LiLa already has the skill's framework loaded as context.

LiLa asks:
- "Which platform do you want to set this up on?" → Mom picks Claude (free account)
- "Which child is this for?" → Mom selects Emma (14) from the person pill selector
- "Any subjects Emma is focusing on right now?" → Mom says "Algebra 2 and AP History"
- "Does Emma have any learning accommodations I should know about?" → "She's a visual learner and needs extra processing time"

**Step 4: LiLa assembles the complete deployment package.**

The output has three clearly delimited sections (per the External Tool Generation & Context Update Loop document):

**Section A — Framework Instructions** (the skill's behavioral rules, customized):
```
You are Emma's Homework Helper. You are a patient, encouraging tutor 
who helps Emma work through homework by asking guiding questions — 
NEVER by giving answers directly.

Core rules:
- Ask questions that lead Emma to discover the answer herself
- When she's stuck, break the problem into smaller steps
- She's a visual learner — use analogies, diagrams, and spatial 
  descriptions whenever possible
- Give her processing time — don't rapid-fire questions. 
  One question, wait for her response.
- Current focus subjects: Algebra 2, AP History
- Celebrate genuine progress, not just correct answers
- If she seems frustrated, shift approach — don't push harder

[... full framework continues ...]
```

**Section B — Family Context Block:**
```
=== FAMILY CONTEXT (Generated by MyAIM on 2026-03-14) ===

About Emma (age 14, Independent):
- 9th grade, homeschooled
- Visual learner — needs to SEE concepts, not just hear them
- ENFP — enthusiastic starter, sometimes scattered on follow-through
- Needs extra processing time before responding
- Currently excelling in creative writing
- Struggles with abstract math concepts but responds well to 
  real-world applications ("when would I use this?")
- Love language: Words of Affirmation — praise specific effort, 
  not just results
- Responds best to humor and directness
- Gets overwhelmed by long instructions — break into small steps
- Allergic to peanuts (EpiPen in backpack) [included for safety context]

=== END FAMILY CONTEXT ===
```

**Section C — Context Update Instructions + Session Report Instructions:**
```
=== CONTEXT UPDATE INSTRUCTIONS ===

This tool's family context was generated by MyAIM Family on 2026-03-14.
Family context changes over time — kids grow, subjects change, 
skills develop.

TO UPDATE THIS TOOL'S CONTEXT:
1. Open MyAIM Family → AI Toolbox → Deployed Tools
2. Find "Homework Helper — Emma" and tap "Generate Context Update"
3. Review the suggested changes
4. Approve the updates
5. Copy the new context block and replace the FAMILY CONTEXT section 
   above (between the === markers)

Your next context update will be available after your monthly review.

=== END CONTEXT UPDATE INSTRUCTIONS ===

=== SESSION REPORT INSTRUCTIONS ===

At the END of each homework session, generate a session report 
in EXACTLY this format. Tell Emma: "Great work today! Here's your 
session summary — copy this and paste it into MyAIM so your mom 
can see what you worked on."

=== SESSION REPORT ===
Date: [today's date]
Student: Emma
Session duration: approximately [X] minutes
Subjects covered: [list each subject]
Topics worked on: [specific topics/chapters/problems]
Skills practiced: [e.g., quadratic equations, document analysis]
Progress observations:
- [What went well — specific skills or concepts that clicked]
- [What was challenging — specific areas that need more practice]
- [Any breakthrough moments]
Engagement level: [high/medium/low]
Recommended next focus: [what to work on next session]
Notes: [anything notable — frustration points, interests sparked, 
  connections made to other subjects]
=== END SESSION REPORT ===

=== END SESSION REPORT INSTRUCTIONS ===
```

**Step 5: LiLa presents the complete package.**
Mom sees the full output in the conversation modal. Action chips:
- **[Copy All]** — copies the entire package (Sections A+B+C) formatted for the chosen platform
- **[Preview as Claude Project]** — shows how it would look pasted into Claude Project Instructions
- **[Edit Before Copying]** — opens in Smart Notepad for manual adjustments

**Step 6: Mom deploys.**
LiLa provides platform-specific setup instructions:
- "Go to claude.ai → Settings → Capabilities → Skills → Upload. Or create a new Project and paste these instructions."
- After deploying, LiLa asks: "Paste the URL of your new Claude project here so you can launch it from MyAIM anytime."
- Mom pastes the URL → registered in the External Tool Registry → appears in her Toolbox under "Deployed Tools"

**Step 7: Emma uses the Homework Helper.**
Emma opens Claude (her own free account, or mom's account), navigates to the project/skill, and starts her homework session. The AI tutors her using all the context MyAIM provided. At the end of the session, the AI generates the session report and tells Emma to copy it.

### Session Report Re-Import: How Off-App Data Gets Back Into MyAIM

> **Mom experience goal:** I don't want to monitor every homework session in real time. I want to check in once a week (or once a month) and see a clear picture of what each kid worked on, how long, which subjects, and where they need help — without having to be in the room or ask twenty questions.

**The re-import flow has three options, giving families flexibility:**

**Option A: Kid self-submits (recommended for teens/Independent shell).**
Emma copies the session report from her Homework Helper session. She opens MyAIM on her own account (Independent shell), navigates to her Smart Notepad, and pastes the report. Review & Route (PRD-08) detects the `=== SESSION REPORT ===` markers and auto-routes the data:
- Subjects and topics → tracked in educational records (PRD-28 homeschool tracking, when built)
- Duration → logged for time tracking
- Progress observations → saved to Emma's Archives as context items (PRD-13)
- The report itself → stored as a journal entry or notepad entry with `source = 'external_skill'`

Mom can configure this as a **task requirement**: "Submit your Homework Helper report" appears as a recurring task (PRD-09A) that Emma marks complete by pasting the report. Mom sees it in her Family Overview (PRD-14C) and can verify with one glance.

> **Decision rationale:** Making report submission a task that the kid completes gives mom verification without requiring daily involvement. The kid develops accountability. Mom reviews at her chosen cadence — daily, weekly, or monthly. The data accumulates regardless of when mom checks.

**Option B: Kid uploads from their dashboard (Guided/younger kids).**
For younger kids in the Guided shell, the Deployed Tools section of their simplified Toolbox can include an "Upload Session Report" button. Kid taps it, pastes the report text, taps submit. The parsing happens automatically. Mom sees a notification: "Emma submitted a Homework Helper report."

**Option C: Mom imports manually.**
Mom copies session reports herself (if she's supervising the session or the kid gives her the text). She pastes into her own Smart Notepad. Review & Route detects the markers and routes the data, associating it with the correct child via the "Student:" field in the report.

**What happens to the imported data:**

| Data from Report | Where It Goes | How It's Used |
|---|---|---|
| Subjects covered, topics worked on | `archive_context_items` on the child's Archive (PRD-13) tagged as educational activity | Builds a running log of educational activity; feeds into homeschool compliance reports (PRD-28) |
| Duration | Educational time tracking (PRD-28 when built) | Accumulates hours per subject for state reporting requirements |
| Progress observations (strengths) | Child's Archive under "School & Learning" category folder | LiLa uses this context in future sessions — the Homework Helper gets smarter about what Emma already understands |
| Progress observations (challenges) | Child's Archive under "School & Learning" category folder | LiLa and the Homework Helper both know what needs more work next time |
| Recommended next focus | Optionally surfaces as a suggested task (PRD-09A) or a note on mom's Family Overview | Mom can see "Emma's Homework Helper recommends focusing on polynomial division next" |
| Engagement level trends | Widgets/Trackers (PRD-10) — trackable metric over time | Mom can see engagement trends: "Emma's math engagement has been low for 3 weeks" |
| Full report text | Journal entry (`journal_entries` with `entry_type = 'session_report'`, `source = 'external_skill'`) | Searchable, timestamped record of every session |

**The context update loop closes the circle:**
- Month 1: Homework Helper is deployed with "Struggles with abstract math concepts"
- Month 1-2: Session reports show Emma is making progress on quadratic equations
- Month 2 context update: MyAIM's freshness review notices the progress and updates the context to "Making progress on quadratic equations; previously struggled with abstract math but responding well to real-world application examples"
- Month 2+: The Homework Helper receives the updated context and adjusts its approach — it knows Emma has grown and doesn't need to over-scaffold on quadratics anymore

> **Forward note (PRD-28 — Tracking, Allowance & Financial):** The session report data model defined here is designed to feed directly into PRD-28's homeschool tracking system. When PRD-28 is written, it should consume session report data from `archive_context_items` tagged as educational activity, and from journal entries with `source = 'external_skill'`. The per-subject hour accumulation and state compliance report generation are PRD-28 scope, not PRD-21A — but the data pipeline starts here.

> **Forward note (PRD-09A — Tasks):** "Submit Homework Helper report" as a recurring task assigned to a child is supported by PRD-09A's task system. The task's completion can be linked to the presence of a session report submission (detected by Review & Route). This verification pattern — "task is complete when structured data is submitted" — could apply to other external skills beyond homework.

### Other Skill Examples (For Content Planning Reference)

These are not exhaustive — they illustrate the breadth of skills that could be created for the AI Vault. Each follows the same Deploy with LiLa → family context personalization → context update loop pattern.

| Skill Name | What It Does | Key Personalization from MyAIM | Session Data It Generates |
|---|---|---|---|
| **Homework Helper** | AI tutor that guides without giving answers | Child's learning style, current subjects, strengths/weaknesses, personality | Session reports (subjects, duration, progress, challenges) |
| **Meal Planner** | Weekly meal planning with family dietary needs | Family size, dietary restrictions, budget preferences, favorite meals, allergies | Meal plans (could feed into grocery lists via PRD-09B) |
| **Board of Directors** | Decision-making tool with virtual advisors | Mom's values (Guiding Stars), decision-making style (InnerWorkings), current life priorities | Decision summaries (could feed into journal) |
| **Story Time Creator** | Creates personalized bedtime stories | Child's name, age, interests, physical description, favorite characters | Story text (could save to Archives as family memories) |
| **Budget Coach** | Financial planning conversations | Family financial context (when PRD-28 is built), goals, spending patterns | Budget analysis (could feed into financial tracking) |
| **Email Sequence Builder** | Creates email marketing sequences | Mom's business context (if in Archives), brand voice, audience | Email sequences (could save to Notepad for later use) |
| **Homeschool Curriculum Planner** | Plans weekly/monthly curriculum | Children's ages, grade levels, learning styles, state requirements, interests | Curriculum plans (feeds directly into homeschool tracking) |
| **Social Media Content Planner** | Plans content calendar for mom's business/brand | Brand voice, audience, content pillars, posting schedule | Content calendar (could save as tasks) |

### Prompt Format Sub-Types

| `prompt_format` | Rendering Mode | Visual Treatment |
|---|---|---|
| `text_llm` | List — expandable text cards | No images required |
| `image_gen` | Gallery — masonry grid of example output images | Images are the hero |
| `video_gen` | Gallery — with video thumbnails or stills | Images/stills are the hero |
| `audio_gen` | List — with optional audio preview | No images required |

### AI Tool Delivery Methods

| `delivery_method` | When Used | Launch Behavior |
|---|---|---|
| `native` | LiLa-powered tools (registered guided modes) | Opens LiLa conversation modal with tool's context and mode |
| `embedded` | External tools that render in an iframe | Loads in an iframe within the platform, session token tracked |
| `link_out` | Tools that must open in their native platform | Opens in new tab/window after portal page |

> **Decision rationale:** Platform-specific tool types from V1 (custom-gpt, gemini-gem, opal-app, caffeine-app, perplexity) are consolidated into `ai_tool` with the specific platform stored as metadata (`platform` field). This prevents the taxonomy from growing every time a new AI platform launches.

---

## Learning Ladder (Content Strategy Framework)

The learning ladder is an **internal content strategy framework** for planning what content to create, not a user-facing feature or filter. It describes the natural progression of content that pulls subscribers in and keeps them engaged:

| Position | Label | Strategic Purpose | Example Content |
|---|---|---|---|
| Fun & Creative | `fun_creative` | The hook — gets people excited about AI | Coloring pages, storybook characters, holiday cards, image style libraries |
| Practical & Problem-Solving | `practical` | The value — solves real daily problems | Meal planning, homework help, schedule optimization, communication skills |
| Creator | `creator` | The graduation — builds deeper AI skills | Custom GPTs, automation workflows, prompt engineering, course creation, skills |

The `ladder_position` field on `vault_items` is optional metadata for admin use. It is not exposed as a filter in the browse UI and is not connected to subscription tiers. Any tier can access any ladder position. The field exists so that admin analytics (PRD-21B) can show content mix balance across the three strategy buckets.

> **Decision rationale:** The learning ladder is a content planning lens, not a product feature. Forcing every Vault item into one of three buckets adds rigidity without user value. Categories and tags handle discoverability; the ladder handles editorial strategy.

---

## Content Protection

> **Decision rationale:** The Vault's prompt content is the primary deliverable for subscribers. Protection should make casual copying impractical while keeping the experience effortless for legitimate use.

### Protection Measures

1. **No bulk copy.** No "copy all prompts" action on any pack. Each prompt has its own individual Copy button. Copying 200 prompts requires 200 individual taps.

2. **No native text selection on prompt text.** Prompt content renders in a non-selectable container. The only way to extract text is through the Copy button. This applies to prompt entries in packs and to tutorial content with embedded prompts.

3. **Copy event tracking.** Every Copy action logs to `vault_copy_events`: user_id, vault_item_id, prompt_entry_id (if applicable), timestamp. Patterns are visible in admin analytics (PRD-21B).

4. **Copy rate limiting.** After 20 copy actions in a 60-minute window, the user sees a gentle message: "You're saving a lot of prompts! Remember you can bookmark packs and come back anytime — they're always here for you." Not a hard block — the copy still works — but it introduces awareness and friction. Thresholds are admin-configurable.

5. **Prompt text loaded on demand.** Prompt text is not rendered in the initial page HTML. It loads via authenticated API call when the user interacts with a specific entry (expand, hover, or tap). A basic page scraper gets zero prompt content.

6. **Session-based access.** All prompt text delivery requires an active authenticated session. Direct URLs to packs or entries without a session return nothing.

7. **Image protection.** Example output images and reference images served with right-click disabled, no direct URL exposure in page source. Images loaded through a proxy/signed URL pattern.

8. **LiLa-optimized attribution.** When LiLa personalizes a prompt, the output includes a subtle attribution comment (`/* Crafted with Three Little Lanterns AI Vault */`) that doesn't affect AI generation but identifies the source if redistributed.

---

## NEW Badge System

> **Depends on:** Per-item admin configuration in PRD-21B.

**How it works:**

The NEW badge is based on when each individual user first sees each item, not when the item was uploaded.

1. When a user visits the Vault page, the visit is recorded in `vault_user_visits`.
2. The system identifies items added since the user's last visit.
3. For each new-to-them item, a `vault_first_sightings` record is created with the current timestamp.
4. The NEW badge displays for a configurable number of days (default 30) from that first sighting.

**Key behaviors:**
- User takes a 2-week break, comes back → NEW badges on everything added while they were gone
- Each item's countdown is independent
- An item uploaded 40 days ago that the user has never seen still shows NEW when they finally visit
- Once the countdown starts, it's anchored — re-visiting doesn't reset it
- Admin can configure `new_badge_duration_days` per item (default 30)
- Admin can toggle `first_seen_tracking` on/off per item

---

## Seasonal & Gift Tagging

Library items can be tagged with seasonal and gift-related tags to surface relevant content at the right time of year.

- **`seasonal_tags`:** Text array. Examples: christmas, mothers-day, fathers-day, valentines-day, easter, thanksgiving, back-to-school, summer. Admin types whatever tags make sense during upload.
- **`gift_idea_tags`:** Separate text array. Examples: gifts-for-teachers, handmade-gifts, gift-wrapping, diy-gifts.
- **`seasonal_priority`:** Integer (0-10). Higher values boost the item during its tagged season.

During a tagged season, the Vault browse page gains a "Seasonal" category row (or the hero section features seasonal content). The seasonal surfacing logic is date-driven and automatic once tagged.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full browse, full consumption, full Toolbox assignment | Can see all content (including locked tier content with upgrade prompts). Can add tools to any family member's Toolbox. |
| Dad / Additional Adult | Permission-gated browse | Requires `vault_browse` feature key granted by mom. If granted: full browse and consumption for their tier. Cannot assign tools to other members' Toolboxes (mom-only). |
| Special Adult | Not present | AI Vault is not part of the Special Adult scope. |
| Independent (Teen) | Filtered browse | Sees only Vault items that are either: (a) explicitly assigned to them via Toolbox, or (b) tagged as `teen_visible = true` by admin. Cannot assign tools to others. |
| Guided | Not present | Does not access the Vault directly. Mom adds tools to their Toolbox on their behalf. |
| Play | Not present | No Vault access. |

### Shell Behavior

- **Mom shell:** Full Vault access via sidebar navigation. Browse, search, filter, consume all content at her tier, assign tools to family members.
- **Dad/Adult shell:** Vault appears in sidebar only if `vault_browse` permission is granted. Browse and consume for their tier. No Toolbox assignment.
- **Independent shell:** Vault appears in sidebar as a filtered experience. Only teen-approved content visible. Primarily accesses tools through their Toolbox rather than browsing.
- **Guided shell:** Not present in sidebar. Tools come to them via Toolbox assignments.
- **Play shell:** Not present. No Vault access of any kind.

> **Decision rationale:** The Vault is primarily mom's discovery surface. Other family members primarily experience Vault tools through the Toolbox — their curated, personalized launcher. This keeps the Vault's full breadth (including content about parenting, relationship tools, etc.) within mom's domain.

---

## Data Schema

### Table: `vault_items`

The core content table. Replaces V1's `library_items`.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| display_title | TEXT | | NOT NULL | Hook title — visible to all users including non-subscribers. Catchy, outcome-focused, Google-proof. |
| detail_title | TEXT | | NULL | Clear title — visible only to users with tier access. Reveals the method. |
| short_description | TEXT | | NOT NULL | Hook description — visible on card to everyone. |
| full_description | TEXT | | NULL | Detailed description — only in detail view for users with tier access. |
| content_type | TEXT | | NOT NULL | CHECK: 'tutorial', 'ai_tool', 'prompt_pack', 'tool_collection', 'workflow', 'skill' |
| prompt_format | TEXT | | NULL | For prompt_packs: CHECK: 'text_llm', 'image_gen', 'video_gen', 'audio_gen' |
| delivery_method | TEXT | | NULL | For ai_tools: CHECK: 'native', 'embedded', 'link_out' |
| category_id | UUID | | NOT NULL | FK → vault_categories |
| ladder_position | TEXT | NULL | NULL | Optional content strategy label: 'fun_creative', 'practical', 'creator'. Used internally for content planning. Not user-facing, not filterable at MVP. |
| difficulty | TEXT | 'beginner' | NOT NULL | CHECK: 'beginner', 'intermediate', 'advanced' |
| tags | TEXT[] | '{}' | NOT NULL | Admin-defined tags for cross-category discovery |
| thumbnail_url | TEXT | | NULL | Card thumbnail image URL |
| preview_image_url | TEXT | | NULL | Larger preview image for detail views |
| content_body | TEXT | | NULL | Rich text / Markdown content for tutorials rendered natively |
| content_url | TEXT | | NULL | External content URL for iframe embedding (Gamma pages, video embeds) |
| tool_url | TEXT | | NULL | For embedded/link-out tools: the actual tool URL (hidden from users) |
| guided_mode_key | TEXT | | NULL | For native LiLa tools: the registered guided mode key from PRD-05 |
| platform | TEXT | | NULL | For ai_tools: which AI platform (chatgpt, gemini, midjourney, etc.) |
| target_platforms | TEXT[] | '{}' | NOT NULL | For skills: compatible platforms (claude, chatgpt, gemini, etc.) |
| auth_provider | TEXT | | NULL | For embedded tools requiring auth: 'google', 'openai', etc. |
| requires_auth | BOOLEAN | false | NOT NULL | Whether the tool requires external authentication |
| enable_lila_optimization | BOOLEAN | false | NOT NULL | Whether "Optimize with LiLa" button appears |
| lila_optimization_prompt | TEXT | | NULL | Admin-authored instructions for how LiLa should personalize this content |
| allowed_tiers | TEXT[] | '{}' | NOT NULL | Which subscription tiers can access this item |
| status | TEXT | 'draft' | NOT NULL | CHECK: 'draft', 'published', 'archived' |
| is_featured | BOOLEAN | false | NOT NULL | Shows in hero spotlight section |
| is_new | BOOLEAN | true | NOT NULL | Eligible for NEW badge system |
| first_seen_tracking | BOOLEAN | true | NOT NULL | Whether per-user NEW badge tracking is active |
| new_badge_duration_days | INTEGER | 30 | NOT NULL | Days the NEW badge shows per user |
| teen_visible | BOOLEAN | false | NOT NULL | Whether this item appears in teen's filtered Vault browse |
| seasonal_tags | TEXT[] | '{}' | NOT NULL | Seasonal tag array |
| gift_idea_tags | TEXT[] | '{}' | NOT NULL | Gift idea tag array |
| seasonal_priority | INTEGER | 0 | NOT NULL | 0-10, higher = more prominent during tagged season |
| portal_description | TEXT | | NULL | For tools: description shown on portal/prep page |
| portal_tips | TEXT[] | '{}' | NOT NULL | For tools: tips shown before launch |
| prerequisites_text | TEXT | | NULL | What the user needs before starting |
| learning_outcomes | TEXT[] | '{}' | NOT NULL | For tutorials: what they'll learn |
| estimated_minutes | INTEGER | | NULL | Estimated time to complete |
| enable_usage_limits | BOOLEAN | false | NOT NULL | Whether this tool has usage limits |
| usage_limit_type | TEXT | | NULL | CHECK: 'daily', 'weekly', 'monthly', 'total' |
| usage_limit_amount | INTEGER | | NULL | Number of uses allowed per period |
| session_timeout_minutes | INTEGER | 60 | NOT NULL | Idle timeout for tool sessions |
| display_order | INTEGER | 0 | NOT NULL | Sort order within category |
| view_count | INTEGER | 0 | NOT NULL | Total views (incremented on detail open) |
| created_by | UUID | | NOT NULL | FK → auth.users (admin who created) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Published items readable by all authenticated users. Draft/archived items readable only by admins. Write access admin-only.

**Indexes:**
- `vault_items_category_id_idx` on category_id
- `vault_items_content_type_idx` on content_type
- `vault_items_status_idx` on status
- `vault_items_tags_gin_idx` GIN on tags
- `vault_items_seasonal_tags_gin_idx` GIN on seasonal_tags
- `vault_items_display_order_idx` on (category_id, display_order)
- Full-text search index on (display_title, detail_title, short_description, full_description, tags)

### Table: `vault_categories`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| slug | TEXT | | NOT NULL | UNIQUE. URL-friendly identifier |
| display_name | TEXT | | NOT NULL | Category label in UI |
| description | TEXT | | NULL | Category description (optional, shown on category page) |
| icon | TEXT | | NULL | Lucide icon name |
| color | TEXT | | NULL | Theme-compatible color identifier |
| sort_order | INTEGER | 0 | NOT NULL | Display order on browse page |
| is_active | BOOLEAN | true | NOT NULL | Soft delete / hide |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Readable by all authenticated users. Write access admin-only.

### Table: `vault_prompt_entries`

Child table for prompt packs. Each entry is one prompt within a pack.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| vault_item_id | UUID | | NOT NULL | FK → vault_items (the parent pack) |
| title | TEXT | | NOT NULL | Entry title (e.g., "Watercolor Storybook") |
| prompt_text | TEXT | | NOT NULL | The prompt content |
| variable_placeholders | TEXT[] | '{}' | NOT NULL | List of replaceable variables (e.g., '[SUBJECT]', '[STYLE]') |
| example_outputs | TEXT[] | '{}' | NOT NULL | Array of image URLs showing output examples |
| reference_images | TEXT[] | '{}' | NOT NULL | Array of downloadable style reference image URLs |
| tags | TEXT[] | '{}' | NOT NULL | Per-entry tags for filtering within a pack |
| sort_order | INTEGER | 0 | NOT NULL | Order within the pack |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Readable by authenticated users who can access the parent vault_item. Write access admin-only.

**Indexes:**
- `vault_prompt_entries_vault_item_id_idx` on vault_item_id
- `vault_prompt_entries_sort_order_idx` on (vault_item_id, sort_order)

### Table: `vault_collection_items`

Join table linking tool_collection items to their contained items.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| collection_id | UUID | | NOT NULL | FK → vault_items (the collection) |
| item_id | UUID | | NOT NULL | FK → vault_items (the contained item) |
| sort_order | INTEGER | 0 | NOT NULL | Order within collection |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Inherits from parent vault_items. UNIQUE on (collection_id, item_id).

### Table: `vault_user_bookmarks`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| user_id | UUID | | NOT NULL | FK → auth.users |
| vault_item_id | UUID | | NOT NULL | FK → vault_items |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Users can read/write/delete their own bookmarks only. UNIQUE on (user_id, vault_item_id).

### Table: `vault_user_progress`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| user_id | UUID | | NOT NULL | FK → auth.users |
| vault_item_id | UUID | | NOT NULL | FK → vault_items |
| progress_status | TEXT | 'not_started' | NOT NULL | CHECK: 'not_started', 'in_progress', 'completed' |
| progress_percent | INTEGER | 0 | NOT NULL | 0-100 |
| last_accessed_at | TIMESTAMPTZ | | NULL | Most recent interaction |
| completed_at | TIMESTAMPTZ | | NULL | When marked complete |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Users can read/write their own progress. Mom can read all family members' progress (family_id scoped). UNIQUE on (user_id, vault_item_id).

### Table: `vault_user_visits`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| user_id | UUID | | NOT NULL | FK → auth.users |
| visited_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Users own their visit records.

### Table: `vault_first_sightings`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| user_id | UUID | | NOT NULL | FK → auth.users |
| vault_item_id | UUID | | NOT NULL | FK → vault_items |
| first_seen_at | TIMESTAMPTZ | now() | NOT NULL | Anchored timestamp for NEW badge countdown |

**RLS Policy:** Users own their sighting records. UNIQUE on (user_id, vault_item_id).

### Table: `vault_tool_sessions`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| user_id | UUID | | NOT NULL | FK → auth.users |
| vault_item_id | UUID | | NOT NULL | FK → vault_items |
| session_token | TEXT | | NOT NULL | UNIQUE. Generated token for authenticated embeds |
| started_at | TIMESTAMPTZ | now() | NOT NULL | |
| expires_at | TIMESTAMPTZ | | NOT NULL | Start + session_timeout_minutes |
| last_activity_at | TIMESTAMPTZ | now() | NOT NULL | Updated on heartbeat |
| is_active | BOOLEAN | true | NOT NULL | Soft close on timeout |

**RLS Policy:** Users own their sessions. Admin can read all.

### Table: `vault_copy_events`

Content protection tracking.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| user_id | UUID | | NOT NULL | FK → auth.users |
| vault_item_id | UUID | | NOT NULL | FK → vault_items |
| prompt_entry_id | UUID | | NULL | FK → vault_prompt_entries (if copying from a pack entry) |
| copied_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Insert-only for authenticated users. Read access admin-only (for analytics).

### Table: `user_saved_prompts`

Personal prompt library.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| user_id | UUID | | NOT NULL | FK → auth.users |
| title | TEXT | | NOT NULL | User-editable title |
| prompt_text | TEXT | | NOT NULL | The prompt content |
| source_vault_item_id | UUID | | NULL | FK → vault_items (if saved from a Vault pack) |
| source_prompt_entry_id | UUID | | NULL | FK → vault_prompt_entries (if saved from a specific entry) |
| is_lila_optimized | BOOLEAN | false | NOT NULL | Whether LiLa personalized this version |
| tags | TEXT[] | '{}' | NOT NULL | User-defined tags |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Users can CRUD their own saved prompts only.

### Table: `vault_content_requests`

User-submitted content requests.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| user_id | UUID | | NOT NULL | FK → auth.users |
| topic | TEXT | | NOT NULL | What they want |
| description | TEXT | | NULL | Additional details |
| category_suggestion | TEXT | | NULL | Optional category |
| priority | TEXT | 'medium' | NOT NULL | CHECK: 'low', 'medium', 'high' |
| status | TEXT | 'pending' | NOT NULL | CHECK: 'pending', 'reviewed', 'planned', 'completed', 'declined' |
| admin_notes | TEXT | | NULL | Admin response/notes |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Users can create and read their own requests. Admin can read/update all.

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| PRD-21B (Admin Console) | All Vault content created, edited, published, and archived through admin. Content flows into `vault_items`, `vault_categories`, `vault_prompt_entries`. |
| PRD-13 (Archives) | Family context, person context, physical descriptions, and wishlist data flow into "Optimize with LiLa" conversations. Context assembly follows PRD-05/PRD-13 pipeline. |
| PRD-05 (LiLa Core) | Guided mode registry provides mode definitions for native AI tools. Conversation engine powers "Optimize with LiLa" and native tool launch. |
| PRD-01 (Auth) | Subscription tier from user's account determines which items are accessible vs. locked. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-21 (AI Toolbox) | "+Add to AI Toolbox" creates `lila_tool_permissions` records linking Vault tools to family members' Toolboxes. Tool appears in member's Toolbox sidebar section and QuickTasks strip. |
| PRD-14 (Personal Dashboard) | "Recommended for You" widget stub — shows 3 Vault items on the dashboard based on tier, engagement, and progress. |
| PRD-05 (LiLa Core) | LiLa can proactively suggest Vault content during conversations: "I have a tutorial on that in the Vault!" |
| `user_saved_prompts` | "Save to My Prompts" from prompt packs writes to the personal prompt library. |
| `vault_content_requests` | "Request a Tutorial" form writes to the requests queue readable by admin. |

---

## AI Integration

### "Optimize with LiLa" Flow

**Guided mode:** Uses existing `optimizer` mode from PRD-05C, with additional context:
- `vault_item_id` and item metadata passed as conversation context
- Specific prompt text (if optimizing a prompt entry) pre-loaded
- `lila_optimization_prompt` (admin-authored) injected as system prompt guidance

**Context loaded:**
1. Guiding Stars (baseline family values)
2. User's InnerWorkings (self-awareness)
3. Selected person's Archive context (if a person is selected via pill selector)
4. **Selected person's `physical_description`** from Archives (critical for image prompts — hair, skin, eyes, build, typical clothing)
5. Selected person's interests and hobbies (for content personalization)
6. The Vault item's content (prompt text, tool description, etc.)
7. The admin's optimization instructions (`lila_optimization_prompt`)

> **Forward note (PRD-13 Archives impact):** PRD-13 needs a `physical_description` text field and a `reference_photos` image array (2-4 photos) on member Archive settings. These feed image prompt personalization. Mom uploads photos of each child; LiLa (or mom) creates a text description. This description is loaded as high-priority context for image/video prompt optimization.

### LiLa Proactive Suggestions

When a user is in a general LiLa conversation and mentions a topic that matches Vault content (by tag or category), LiLa can offer: "I actually have a tutorial on AI meal planning in the Vault — want me to find it for you?"

This is a lightweight integration: LiLa checks the user's tier-accessible Vault items by tag match and offers a link. No guided mode registration needed — it's a proactive suggestion pattern within general chat.

### Native AI Tool Launch

When a Vault item has `delivery_method = 'native'` and a `guided_mode_key`, launching the tool from the Vault opens a LiLa conversation modal in that guided mode. This uses the same infrastructure as PRD-21's relationship tool modals — `container_preference: 'modal'` on the guided mode, person pill selector if applicable, standard action chips.

---

## Edge Cases

### Empty Vault (No Published Content)
- New platform with no content uploaded yet shows an empty state: "The AI Vault is being stocked with amazing content. Check back soon!" with a decorative illustration.
- If search returns no results: "No results for [query]. Try different keywords or browse our categories."

### User Has No Progress
- "Continue Learning" row simply doesn't appear
- "Recommended for You" shows popular/featured items instead of personalized ones

### Tool Session Expiry
- If a user returns to an embedded tool after their session has expired, the portal page reappears with a "Your session expired. Ready to continue?" prompt and a re-launch button that creates a new session.

### Prompt Pack with Zero Entries
- If admin creates a pack but hasn't added entries yet (draft state), it doesn't appear in the browse. If somehow published with zero entries, the detail view shows: "Content is being added to this pack. Check back soon!"

### Concurrent Bookmark Toggle
- Optimistic UI update with revert on failure. Unique constraint prevents duplicate bookmarks.

### Copy Rate Limit Reached
- Copy still works (not a hard block). User sees a gentle toast message. Rate limit counter resets after the time window.

### Large Prompt Packs (100+ entries)
- Gallery and list views paginate at 30 entries with "Load More" or infinite scroll. The pack header always shows the total count.

### Locked Content Shared via URL
- If someone shares a direct URL to a gated Vault item and the recipient doesn't have tier access, they see the upgrade modal treatment — hook title, thumbnail, and upsell prompt.

### User Downgrades Subscription Tier
- Content they previously accessed at a higher tier becomes locked. Progress is preserved — if they re-upgrade, they pick up where they left off. Bookmarks on now-locked items remain but show the lock treatment.

### "Optimize with LiLa" on Content Without Optimization Prompt
- The button only appears when `enable_lila_optimization = true`. If an item lacks a `lila_optimization_prompt`, LiLa still works but uses generic optimization behavior rather than item-specific instructions.

---

## Tier Gating

> **Tier rationale:** The AI Vault is the primary revenue driver. Basic browse access should be available to demonstrate value. Content access within the Vault is gated per-item by `allowed_tiers`. Feature-level access controls who can browse at all.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `vault_browse` | Access to browse the AI Vault as a feature | TBD |
| `vault_consume` | Access to open and consume Vault content | TBD |
| `vault_optimize_lila` | Access to "Optimize with LiLa" on Vault items | TBD |
| `vault_toolbox_assign` | Access to "+Add to AI Toolbox" assignment | TBD |
| `vault_prompt_library` | Access to personal prompt library | TBD |
| `vault_request_content` | Access to submit content requests | TBD |

All return `true` during beta. Feature keys wired from day one per PRD-02 conventions. Content-level gating (per-item `allowed_tiers`) is separate from feature-level gating and is managed in admin (PRD-21B).

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| "Recommended for You" dashboard widget | Widget showing 3 Vault items on personal dashboard | PRD-10 (Widgets) — widget type registration |
| LiLa proactive Vault suggestions in general chat | LiLa suggesting Vault content during conversations | PRD-05 enhancement (post-MVP) |
| Learning paths (structured multi-item sequences) | Curated ordered paths through Vault content | Side quest sub-PRD |
| Vault playlist CRUD (curated collections for family members) | Full playlist management UI | Side quest or PRD-21A enhancement |
| Creator tier user-submitted tools | User-generated content with review process | Phase 4 (PRD-21A or 21B extension) |
| Archives `physical_description` field and `reference_photos` | Per-member physical description and photos for image prompt personalization | PRD-13 (Archives) — addition needed |
| Tool marketplace and revenue sharing | Creator economy with content monetization | Phase 4 side quest |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| AI Vault tool browsing and "+Add to AI Toolbox" assignment pattern | PRD-21 | Fully wired: browse experience delivers the catalog; "+Add to AI Toolbox" on `ai_tool` items creates `lila_tool_permissions` records with `source = 'vault'`, `vault_item_id` reference. Tools appear in assigned members' Toolbox sidebar sections and QuickTasks strips. |
| Library Vault tutorial links from LiLa Assist | PRD-05 | Partially wired: Vault content exists and is browsable. LiLa proactive suggestion pattern defined but implementation deferred to post-MVP. |
| "Add to Dashboard" widget feature | V1 design spec | Redefined: "Recommended for You" dashboard widget stub created, wiring to PRD-10 widget grid. Full widget spec deferred. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Vault browse page renders with hero spotlight, category rows, search, and filters
- [ ] Category rows scroll horizontally with swipe on mobile and scroll on desktop
- [ ] Search returns results across display_title, detail_title, short_description, full_description, and tags
- [ ] Filter chips for content type, difficulty, ladder position, and tags
- [ ] "Continue Learning" row appears when user has in-progress items
- [ ] Content cards show thumbnail, hook title, content type badge, tier badge, and NEW badge (when applicable)
- [ ] Locked cards show theme-dependent faded overlay with tier icon
- [ ] Tapping a locked card opens the upgrade modal with hook title, thumbnail, tier info, and plan comparison
- [ ] Tapping an accessible card opens the detail view (modal on desktop, full-screen on mobile)
- [ ] Tutorial detail view renders rich text content and/or iframe embeds
- [ ] AI Tool detail view shows portal page with tips/prerequisites and launch button
- [ ] Native AI tools launch in LiLa conversation modal using guided mode registry
- [ ] Embedded tools load in iframe with session token tracking
- [ ] Link-out tools open in new tab after portal page
- [ ] Prompt pack detail view renders in gallery mode (image_gen/video_gen) or list mode (text_llm/audio_gen)
- [ ] Gallery mode shows masonry grid of example output images with hover/tap to reveal prompt
- [ ] Each prompt entry has Copy, Optimize with LiLa, and Save to My Prompts buttons
- [ ] Reference images section on prompt entries with individual and batch download
- [ ] "Optimize with LiLa" opens Optimizer conversation modal with item context and family context pre-loaded
- [ ] Image prompt optimization loads selected person's `physical_description` from Archives when available
- [ ] "+Add to AI Toolbox" button appears only on ai_tool items
- [ ] Skill detail view shows compatible platforms, framework preview, and platform-specific deploy/download/copy buttons
- [ ] "Deploy with LiLa" on skills opens Optimizer conversation modal for family-context personalization and platform formatting
- [ ] "Deploy with LiLa" output includes Framework Instructions + Family Context Block + Context Update Instructions per External Tool Generation Loop
- [ ] Raw skill download/copy buttons work for Claude (.md download), ChatGPT (copy formatted instructions), Gemini (copy formatted instructions)
- [ ] Skill content protected: no text selection on framework text, copy only via platform buttons, copies logged
- [ ] Member assignment modal shows family members with checkboxes, creates `lila_tool_permissions` records
- [ ] Bookmark toggle works on all content types with optimistic UI
- [ ] Progress tracking: status transitions (not_started → in_progress → completed), progress_percent, last_accessed_at
- [ ] NEW badge system: per-user first-seen tracking with configurable duration
- [ ] Seasonal content surfacing during tagged seasons
- [ ] Personal prompt library page: list, search, copy, edit, delete saved prompts
- [ ] "Save to My Prompts" saves as-is or LiLa-optimized versions
- [ ] "Request a Tutorial" form writes to `vault_content_requests`
- [ ] Content protection: no text selection on prompts, copy-only via button, copy event logging, rate limiting, on-demand prompt loading, session-based access
- [ ] Right-click disabled on gallery images, signed URL image serving
- [ ] `useCanAccess()` wired on all 6 feature keys, returning true during beta
- [ ] PermissionGate wrapping Vault UI per PRD-02 conventions
- [ ] RLS verified: users see only published items at their tier
- [ ] RLS verified: bookmarks, progress, saved prompts scoped to user
- [ ] RLS verified: mom can read all family members' progress
- [ ] Full-text search index working on vault_items

### MVP When Dependency Is Ready
- [ ] "Recommended for You" dashboard widget (depends on PRD-10 widget grid)
- [ ] LiLa proactive Vault suggestions in general chat (depends on PRD-05 enhancement)
- [ ] Archives `physical_description` and `reference_photos` fields for image prompt personalization (depends on PRD-13 addition)
- [ ] Vault playlist CRUD and family member assignment (depends on side quest PRD)
- [ ] Seasonal content auto-boosting based on date logic (depends on admin seasonal tag population)

### Post-MVP
- [ ] Collaborative filtering for "Recommended for You" ("Moms like you also use...")
- [ ] Semantic search / vector-based content discovery
- [ ] Learning paths (structured multi-item sequences)
- [ ] Creator tier: user-submitted tools with review process
- [ ] Tool marketplace with revenue sharing
- [ ] Advanced copy protection analytics dashboard (scraping pattern detection)
- [ ] Vault content versioning (update tutorials without losing progress data)
- [ ] Platform variant switching on prompt entries (Midjourney / DALL-E / Ideogram syntax)
- [ ] Unauthenticated public browse for marketing (landing page showing curated selection)
- [ ] Audio preview playback for audio_gen prompt packs

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: **AI Vault** is the browsable content catalog; **AI Toolbox** (PRD-21) is the personalized per-member launcher. Vault = storefront. Toolbox = personalized view. Only `ai_tool` type items can be added to Toolbox.
- [ ] Convention: Vault items have **two-layer titles** — `display_title` (hook, visible to everyone) and `detail_title` (clear, visible only to tier-authorized users). Hook titles sell the outcome; detail titles reveal the method.
- [ ] Convention: Vault items have **two-layer descriptions** — `short_description` (visible on card to everyone) and `full_description` (visible in detail view to tier-authorized users only).
- [ ] Convention: **Content types** are 'tutorial', 'ai_tool', 'prompt_pack', 'tool_collection', 'workflow', 'skill'. Platform-specific tools (GPTs, Gems, etc.) are `ai_tool` with `platform` metadata, not separate content types. Taxonomy extensible via migration.
- [ ] Convention: **Skills** are deployable AI instruction sets for external platforms (Claude Skills, ChatGPT Custom GPTs, Gemini Gems). They have `target_platforms` array and platform-specific download/copy actions. "Deploy with LiLa" personalizes with family context and registers in the External Tool Registry for the context update loop.
- [ ] Convention: Skills that generate structured data (e.g., Homework Helper session reports) include `=== SESSION REPORT ===` block instructions for re-import into MyAIM via Smart Notepad Review & Route.
- [ ] Convention: **Prompt packs** use a parent-child model. `vault_items` holds the pack; `vault_prompt_entries` holds individual prompts. Each entry has its own prompt text, example output images, and reference images.
- [ ] Convention: **Prompt format** (`text_llm`, `image_gen`, `video_gen`, `audio_gen`) determines rendering mode: gallery for visual formats, list for text formats.
- [ ] Convention: **Delivery methods** for AI tools: `native` (LiLa conversation modal), `embedded` (iframe), `link_out` (new tab). Native tools use `guided_mode_key` from the guided mode registry.
- [ ] Convention: **Learning ladder** (`fun_creative`, `practical`, `creator`) is an internal content strategy framework, not a user-facing feature. Optional metadata on `vault_items` for admin analytics. Not filterable, not tier-connected.
- [ ] Convention: **NEW badge** uses per-user first-seen tracking, not upload date. Badge duration configurable per item (default 30 days from first sighting).
- [ ] Convention: **Content protection** — no text selection on prompt content, copy only via button, all copies logged to `vault_copy_events`, rate limited (20/hour default, configurable), prompt text loaded on-demand (not in initial HTML).
- [ ] Convention: **Locked content** visible in browse with faded overlay and tier badge. Hook title and short_description always visible. Full description and content gated by tier.
- [ ] Convention: **"+Add to AI Toolbox"** creates `lila_tool_permissions` records with `source = 'vault'` and `vault_item_id`. Only available on `ai_tool` content type items.
- [ ] Convention: **"Optimize with LiLa"** on image prompts loads the selected person's `physical_description` from Archives as high-priority context for personalization.
- [ ] Convention: **Vault categories** are admin-managed via `vault_categories` table. Referenced by ID from `vault_items`. No inline creation from browse side.
- [ ] Convention: `vault_items` replaces V1's `library_items`. All V1 library_ prefixed tables are superseded.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `vault_items`, `vault_categories`, `vault_prompt_entries`, `vault_collection_items`, `vault_user_bookmarks`, `vault_user_progress`, `vault_user_visits`, `vault_first_sightings`, `vault_tool_sessions`, `vault_copy_events`, `user_saved_prompts`, `vault_content_requests`
Enums updated: none (TEXT with CHECK constraints)
Triggers added: `set_updated_at` on `vault_items`, `vault_categories`, `vault_prompt_entries`, `vault_user_progress`, `user_saved_prompts`, `vault_content_requests`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Content type taxonomy: 6 types (tutorial, ai_tool, prompt_pack, tool_collection, workflow, skill)** | Consolidates V1's 10 platform-specific tool types into a cleaner model. Skills added as a distinct type for deployable AI instruction sets (Claude Skills, Custom GPTs, Gemini Gems). Specific platforms stored as metadata. Taxonomy is extensible — adding a 7th type later requires a migration + rendering template, not a rebuild. |
| 2 | **Prompt format sub-types determine rendering mode (gallery vs. list)** | image_gen and video_gen render as masonry galleries with visual-first discovery. text_llm and audio_gen render as expandable text lists. Same data model, adaptive presentation. |
| 3 | **Parent-child model for prompt packs (vault_items → vault_prompt_entries)** | Each pack is a vault_items record; individual prompts are child entries with their own text, example images, reference images, and sort order. Enables gallery rendering, per-entry copy/optimize, and granular admin management. |
| 4 | **Two-layer titles: display_title (hook) + detail_title (clear)** | Hook titles sell the outcome without revealing the method, preventing non-subscribers from Googling the technique. Detail titles clarify the content for subscribers. Anti-churn design. |
| 5 | **Two-layer descriptions: short_description + full_description** | Same principle as titles. Short description visible to everyone on cards. Full description only in detail view for tier-authorized users. |
| 6 | **Learning ladder is a content strategy framework, not a user-facing feature** | fun_creative / practical / creator positions describe editorial strategy for content planning. Optional metadata on vault_items for admin analytics. Not exposed as a user-facing filter or connected to subscription tiers. Categories and tags handle discoverability. |
| 7 | **Ratings, reviews, likes, favorites, discussions → PRD-21C** | All engagement/community features scoped out of 21A. PRD-21A is browse-and-consume only. PRD-21C adds the social layer. |
| 8 | **Playlist data model deferred; AI Toolbox handles the primary assignment use case** | "+Add to AI Toolbox" covers the most important family assignment scenario (tools to members). Playlists (curated learning collections) are a nice-to-have deferred to a side quest. |
| 9 | **Content protection: 8 measures including no text selection, copy logging, rate limiting, on-demand loading** | Prompt content is the core deliverable. Protection makes casual copying impractical while keeping legitimate use effortless. Does not aim to stop determined technical scrapers — aims to ensure the subscription is easier than stealing. |
| 10 | **Reference images on prompt entries (separate from example outputs)** | Example outputs show what the style produces. Reference images are downloadable style inputs for the user's own prompts. Two different purposes, two different image arrays. |
| 11 | **Physical description + reference photos in Archives for image prompt personalization** | When "Optimize with LiLa" fires on an image prompt, LiLa needs to know what the child looks like. Physical description and photos live in Archives (PRD-13 addition), loaded as high-priority context for image/video prompt optimization. |
| 12 | **Personal prompt library included in PRD-21A** | "Save to My Prompts" needs a destination. Lightweight page with CRUD, search, and re-optimization. Stores both as-is copies and LiLa-personalized versions. |
| 13 | **"Request a Tutorial" form included in PRD-21A** | Simple form writing to vault_content_requests. Admin sees queue in PRD-21B in a format easy to copy-paste into AI for triage and content planning. |
| 14 | **No unauthenticated browse at MVP** | Vault requires login. Public browse is a post-MVP marketing feature. Simpler architecture at launch. |
| 15 | **Single prompt text per entry at MVP (no platform variant switching)** | Platform-specific prompt syntax differences are real but marginal for most use cases. Single prompt with optional LiLa adaptation per platform is sufficient at launch. Platform variant JSONB field reserved for post-MVP. |
| 16 | **Vault browse page uses modal detail views on desktop, full-screen on mobile** | User stays on the browse page contextually. Closing the modal returns to exactly where they were scrolling. Same pattern as V1's TutorialPreviewModal but cleaned up and extended. |
| 17 | **`skill` added as 6th content type for deployable AI instruction sets** | Skills (Claude Skills, Custom GPTs, Gemini Gems) are structurally distinct from prompts and tools. They create standalone AI assistants on the user's own platform. "Deploy with LiLa" personalizes with family context and connects to the External Tool Generation Context Update Loop — this is MyAIM's unique differentiator vs. competitors selling generic skills. |
| 18 | **Skills that generate structured data include session report instructions in the framework** | Skills like Homework Helper produce `=== SESSION REPORT ===` blocks that users paste back into MyAIM. This creates a two-way data loop: MyAIM context → skill personalization → skill generates usage data → data enriches MyAIM context → next update is smarter. |
| 19 | **Session report re-import via kid self-submission (task requirement pattern)** | Mom configures "Submit Homework Helper report" as a recurring task. Kid pastes the report into MyAIM (Smart Notepad or dedicated upload). Review & Route parses the structured data and routes to Archives, educational tracking, and journal. Mom reviews at her own cadence — weekly, monthly, whatever works. Kid develops accountability without requiring daily mom oversight. |
| 20 | **Content type taxonomy is extensible, not permanent** | The 6 types at launch cover current needs. Adding a 7th type later requires a migration (adding a CHECK value) plus a rendering template — not a rebuild. The architecture doesn't prevent future expansion. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Ratings & reviews | PRD-21C (Engagement & Community) |
| 2 | Likes, favorites, community discussions, moderation | PRD-21C |
| 3 | Playlist CRUD and family member assignment | Side quest sub-PRD or PRD-21A enhancement |
| 4 | Platform variant switching on prompt entries | Post-MVP enhancement |
| 5 | Collaborative filtering recommendations | Post-MVP |
| 6 | Semantic/vector search | Post-MVP |
| 7 | Learning paths | Side quest sub-PRD |
| 8 | Creator economy (user-submitted tools) | Phase 4 |
| 9 | Tool marketplace / revenue sharing | Phase 4 |
| 10 | Unauthenticated public browse | Post-MVP marketing feature |
| 11 | Archives physical_description and reference_photos fields | PRD-13 addition (cross-PRD impact) |
| 12 | Full External Tool Registry and context update pipeline implementation | PRD-05C (Optimizer) + PRD-19 (Family Context) per External Tool Generation Loop document |
| 13 | Session report structured data parsing into educational tracking fields | PRD-28 (Tracking, Allowance & Financial) — consumes session report data routed via Review & Route |
| 14 | "Submit Homework Helper report" as verifiable task completion pattern | PRD-09A (Tasks) enhancement — task completion linked to structured data submission |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-04 (Shell Routing) | AI Vault added as sidebar navigation item. Vault page route defined. Personal Prompt Library added as sub-navigation under Vault. | Add Vault to sidebar route list. Note prompt library as sub-route. |
| PRD-05 (LiLa Core) | Native AI tools launch from Vault via guided mode registry and conversation modal. "Optimize with LiLa" uses Optimizer mode with Vault item context. LiLa proactive suggestion stub defined. | Note Vault as a launch surface for guided modes. Note vault_item_id as optional context metadata on optimizer conversations. |
| PRD-13 (Archives) | `physical_description` text field and `reference_photos` image array needed on member Archive settings for image prompt personalization. | Add fields to member Archive settings schema. Note AI Vault image optimization as the consumer. |
| PRD-21 (Communication Tools) | AI Toolbox stub fully wired. "+Add to AI Toolbox" creates `lila_tool_permissions` with `source = 'vault'` and `vault_item_id`. Vault items with `delivery_method = 'native'` launch the same conversation modal infrastructure. | Mark AI Vault browsing + Toolbox assignment stub as fully wired. |
| PRD-10 (Widgets) | "Recommended for You" dashboard widget stub created. Shows 3 Vault items based on tier, engagement, progress. | Register widget type for Vault recommendations. |
| PRD-14 (Personal Dashboard) | Dashboard gains a "Recommended for You" widget slot for Vault content. | Note in dashboard widget configuration. |
| Build Order Source of Truth | PRD-21A completed. 12 new tables defined. Content type taxonomy locked. Prompt pack parent-child model established. AI Vault ↔ AI Toolbox integration fully defined. | Update Section 2. Add tables to completed list. Note taxonomy and content protection conventions. |

---

*End of PRD-21A*
