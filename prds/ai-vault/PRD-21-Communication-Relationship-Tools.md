# PRD-21: Communication & Relationship Tools

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts — QuickTasks strip), PRD-05 (LiLa Core AI System — guided mode registry, context assembly, conversation engine), PRD-06 (Guiding Stars & Best Intentions), PRD-07 (InnerWorkings), PRD-08 (Journal + Smart Notepad — gratitude entry type, action chips), PRD-09A (Tasks — Create Task action chip), PRD-09B (Lists — wishlist and idea list types), PRD-13 (Archives & Context — person context, wishlist folders), PRD-15 (Messages, Requests & Notifications — message compose for draft delivery), PRD-19 (Family Context & Relationships — private notes, relationship notes, "How to Reach Me" card, partner sharing, AI Toolbox stub, name resolution)
**Created:** March 14, 2026
**Last Updated:** March 14, 2026

---

## Overview

PRD-21 defines eight AI-powered guided tools that help family members communicate better, connect intentionally, and navigate difficult conversations. Each tool is a distinct LiLa guided mode (already registered in PRD-05's guided mode registry) that launches a focused conversation modal with person context pre-loaded from Archives, InnerWorkings, Guiding Stars, relationship notes, and the "How to Reach Me" card.

These tools evolved from StewardShip's Marriage Toolbox (spouse-only, 6 modes on the First Mate page) and Higgins (crew communication coach). In MyAIM v2, the Marriage Toolbox name is retired. Five of the eight tools work with any family member and are grouped under a "Love Languages" umbrella in the UI. Cyrano remains spouse/partner-focused. Higgins (two modes accessed from a single entry point) works with any relationship. All eight tools use conversation modals for every member including mom — distinct from the LiLa drawer used for core modes (Help, Assist, Optimizer, general chat).

The tools are accessed from three surfaces: the QuickTasks strip (3 grouped buttons: Love Languages, Cyrano, Higgins), the AI Toolbox sidebar section (personalized per member), and eventually the AI Vault (PRD-21A). The AI Toolbox is a curated per-member tool launcher — these 8 tools are the default starter collection. Future tools from the AI Vault can be added to any member's Toolbox by mom.

> **Mom experience goal:** When I'm thinking about my husband, my teen, or my seven-year-old, I want a single tap to launch a focused tool that already knows everything about that person — their love language, what triggers them, what makes them light up, what they'd hate — and helps me connect with them in a way that's specific, real, and actually works. I don't want to navigate to a page. I want it right there when I need it, and I want to be fully in that moment, not distracted by the page behind me.

---

## User Stories

### Connection & Brainstorming Tools (Love Languages Group)
- As a mom, I want to brainstorm quality time activities with a specific child so we can connect in ways that match their interests and age.
- As a mom, I want gift ideas for my husband that reflect what he actually cares about, not generic suggestions, and I want LiLa to remember what's already been vetoed.
- As a dad, I want help noticing what my wife needs right now — things I might be overlooking — so I can serve her in meaningful ways.
- As a mom, I want to craft genuine, specific words of affirmation for my teen that are rooted in real things I've noticed about them.
- As a mom, I want a gratitude practice focused on a specific person that helps me see them more clearly and appreciate them more deeply, with the option to save reflections to my journal.

### Communication Coaching Tools
- As a mom, I want help crafting a message to my husband that says what I actually feel, in a way he'll hear, while learning communication skills I can use on my own.
- As a teen, I want help figuring out what to say to my dad about something that's bothering me, without making it worse.
- As a dad, I want help navigating a difficult conversation with my teenage son — not just words to say, but understanding the dynamics and my options.
- As a mom, I want the AI to teach me communication skills as it helps me, so I eventually don't need it anymore.

### Tool Access & Discovery
- As a mom, I want these tools in my QuickTasks strip so I can launch them with one tap from any page.
- As a teen, I want to see the tools my mom has given me access to in my AI Toolbox so I know what's available.
- As a mom, I want to control which communication tools each family member can access so I can curate age-appropriate AI experiences.

### Person Selection & Context
- As a mom, I want to select which family member a tool is about using a pill selector at the top of the conversation, and I want the AI to also detect names I mention and automatically load that person's context.
- As a user, I want to involve multiple people in a Higgins conversation (e.g., navigating a conflict between two siblings) and have the AI load context for all of them.
- As a mom, I want LiLa to remember when I've said someone would hate a specific gift, activity, or approach, so it never suggests those things again.

---

## Entry Points

### 1. QuickTasks Strip (Primary — All Shells)

> **Depends on:** PRD-04 QuickTasks strip: horizontal scrolling pill-shaped action buttons, auto-sorted by usage frequency, available on every page.

Three grouped buttons represent the 8 tools:

| QuickTask Button | Tap Behavior | Tools Inside |
|-----------------|-------------|-------------|
| **Love Languages** | Opens a popover/bottom sheet with 5 tool options | Quality Time, Gifts, Observe & Serve, Words of Affirmation, Gratitude |
| **Cyrano** | Directly opens Cyrano conversation modal | Cyrano (spouse/partner only) |
| **Higgins** | Opens mode picker: "Help Me Say Something" / "Help Me Navigate This" | Higgins Say, Higgins Navigate |

- Auto-sorted by usage frequency within the QuickTasks strip (most-used group bubbles left)
- Shell visibility follows `lila_tool_permissions` (PRD-05): if a teen doesn't have Cyrano access, the Cyrano button doesn't appear
- Love Languages button only appears if the member has access to at least one of the 5 tools inside it
- Higgins button only appears if the member has access to at least one Higgins mode

### 2. AI Toolbox (Dashboard Sidebar Section)

A section in the dashboard sidebar that displays the tools each member has access to. This is a **personalized per-member tool launcher** — it shows only tools that have been enabled for that member.

**What the user sees:**

```
AI Toolbox ✨
├── Love Languages        [Heart icon]
│   └── (expandable: Quality Time, Gifts,
│        Observe & Serve, Words of Affirmation,
│        Gratitude)
├── Cyrano               [Feather icon]
└── Higgins              [GraduationCap icon]
```

- **Love Languages** is a collapsible group. Collapsed shows the group name with a count badge ("5 tools"). Expanded shows the 5 individual tools as sub-items.
- **Cyrano** and **Higgins** are individual entries.
- Tap any tool → opens its conversation modal.
- Tapping Higgins opens the mode picker (Say / Navigate) before the conversation starts.
- Section is collapsible (chevron toggle, state persists per session).
- Section does not appear if the member has zero permitted tools.

**Shell visibility:**
- **Mom shell:** All tools visible. This is the default starter collection.
- **Dad/Adult shell:** Tools mom has granted via `lila_tool_permissions`.
- **Independent (Teen) shell:** Tools mom has granted. Higgins is the most likely teen-accessible tool.
- **Guided shell:** Tools mom has granted. Simplified card display per Guided shell tokens.
- **Play shell:** Not present. No AI Toolbox section.

> **Decision rationale:** The AI Toolbox sidebar section establishes a pattern for per-member curated AI tool access. These 8 tools are the default starter collection. PRD-21A (AI Vault) will add "+Add to AI Toolbox" on Vault tools, enabling mom to browse the catalog and assign tools to specific family members' Toolboxes. The Toolbox is the personalized view; the Vault is the browsable catalog.

> **Forward note:** PRD-21A will add the browse-and-assign flow: mom browses AI Vault → taps "+Add to AI Toolbox" → selects which member(s) get access → tool appears in those members' Toolbox sidebar sections and QuickTasks strips. The data model for this (tool assignments per member) extends `lila_tool_permissions` from PRD-05.

### 3. AI Vault (Future — PRD-21A)

> **Deferred:** Full AI Vault integration — browsable catalog, categories, "Add to AI Toolbox" pattern — to PRD-21A. This PRD establishes the tools and the Toolbox launcher; PRD-21A establishes the storefront.

---

## Screens

### Screen 1: Love Languages Popover (QuickTasks)

**What the user sees:**
- A compact popover (desktop) or bottom sheet (mobile) that appears when tapping the Love Languages QuickTask button
- Five tool options, each showing: icon, tool name, one-line description
- Tap a tool → popover dismisses, conversation modal opens in that guided mode

**Tools listed:**

| Tool | Icon | Description |
|------|------|-------------|
| Quality Time | Heart | Plan meaningful connection time |
| Gifts | Gift | Thoughtful, personalized gift ideas |
| Observe & Serve | Eye | Notice needs and find ways to serve |
| Words of Affirmation | MessageCircle | Craft genuine, specific affirmations |
| Gratitude | Sparkles | Deepen thankfulness for someone |

**Interactions:**
- Tap outside popover → dismiss (no action)
- Tap a tool → dismiss popover, open conversation modal

### Screen 2: Higgins Mode Picker

**What the user sees:**
- A compact modal or popover with two options when tapping the Higgins button (from QuickTasks or AI Toolbox)

```
┌─────────────────────────────────────┐
│  Higgins                            │
│  ─────────────────────────────────  │
│                                     │
│  [💬] Help Me Say Something         │
│       Craft the right words for     │
│       any conversation              │
│                                     │
│  [🧭] Help Me Navigate This         │
│       Process a situation and       │
│       explore your options          │
│                                     │
└─────────────────────────────────────┘
```

**Interactions:**
- Tap "Help Me Say Something" → opens conversation modal in `higgins_say` mode
- Tap "Help Me Navigate This" → opens conversation modal in `higgins_navigate` mode
- Tap outside → dismiss (no action)

### Screen 3: Tool Conversation Modal (All 8 Tools)

> **Depends on:** PRD-05 LiLa modal conversation screen. This screen describes the additions specific to relationship tool guided modes.

All 8 tools open in a conversation modal — for every member including mom. This is distinct from mom's LiLa drawer (used for core modes: Help, Assist, Optimizer, general chat). The conversation engine is identical; only the UI container differs. Mode switching within a modal works the same as within the drawer — if a conversation naturally shifts, LiLa offers to switch modes, saves the current conversation, and opens the new mode in the same modal.

**What the user sees:**

**Modal container:**
- Desktop: centered, lg size (800px), semi-transparent backdrop
- Mobile: full-screen with close button in top corner
- Close saves the conversation automatically (same as drawer close behavior)

**Header area:**
- Tool icon and display name (e.g., feather + "Cyrano", graduation cap + "Higgins — Say Something")
- Close button (X)
- **Person pill selector:** A horizontal row of small oval pills showing family members. Each pill shows the member's `calendar_color` fill with their first name or nickname. Tapping a pill selects/deselects that person as involved in the conversation. Selected pills have filled background; unselected have outline only.
  - **For Cyrano:** Pre-selects spouse/partner. Only spouse/partner is selectable.
  - **For Higgins (both modes):** Empty by default. User selects one or more people. Multi-select supported for navigating situations involving multiple people.
  - **For the 5 Love Languages tools:** Empty by default. User selects one person (or leaves empty for a general, non-person-specific conversation).
  - Pill selector shows: in-household members first, then Out of Nest members behind a "More ›" pill that expands the row.
  - **Name auto-detection:** When the user types a family member's name or nickname in a message, LiLa resolves it via the name resolution table (PRD-19 `display_name_aliases`) and auto-selects that person's pill if not already selected. A subtle inline confirmation appears: "Added [Name] to this conversation." User can tap to deselect if the detection was wrong.

**Conversation area:**
- Standard LiLa conversation layout (scrollable history, tool avatar on LiLa messages, user messages right-aligned)
- Tool-specific opening message (rotating variants per PRD-05 convention)
- Action chips below LiLa messages (context-dependent, varies by tool — see below)
- Typing indicator when LiLa is generating

**Action chips available across ALL relationship tools:**
- **Copy** — copies LiLa's message to clipboard
- **Edit in Notepad** — sends to Smart Notepad tab (PRD-08)
- **Review & Route** — triggers extraction pipeline (PRD-08)

**Additional action chips by tool:**

| Tool | Additional Action Chips |
|------|------------------------|
| Quality Time | Create Task |
| Gifts | Create Task, Add to Wishlist, Add to Gift Ideas List |
| Observe & Serve | Create Task |
| Words of Affirmation | Create Task, Record Victory |
| Gratitude | Save to Journal (creates `journal_entries` with `entry_type = 'gratitude'`), Record Victory |
| Cyrano | Copy Draft, Save Draft, Send via Message (opens PRD-15 compose with text pre-filled) |
| Higgins Say | Copy Draft, Save Draft, Send via Message |
| Higgins Navigate | Create Task (for action items), Save to Journal (for reflections) |

**"Add to Wishlist" and "Add to Gift Ideas List" (Gifts tool only):**
- When LiLa suggests a gift, these chips appear alongside the suggestion
- "Add to Wishlist" → opens inline picker showing the target person's wishlist folder (PRD-13 Archives `folder_type = 'wishlist'`) → saves as a list item
- "Add to Gift Ideas List" → opens inline picker for idea lists (PRD-09B) → saves as a list item
- If no wishlist or idea list exists for the person, the chip offers to create one

**Veto memory pattern:**
When the user mentions that someone would dislike a gift, activity, or approach (e.g., "she hates flowers," "he'd never go hiking"), LiLa:
1. Acknowledges the veto in conversation
2. Offers to save as a negative preference: "Got it — I'll remember that [Name] doesn't like flowers. Want me to save that to their context?"
3. If confirmed, saves to Archives as a context item with a "dislikes" or "avoid" tag on the person's Archive card (uses the existing PRD-13 context learning write-back pattern)
4. Future conversations for that person automatically load vetoed items as negative context: "AVOID suggesting: [list of vetoed items]"

**Conversations save to history:**
- Every tool conversation creates a `lila_conversations` record with the tool's `guided_mode` and `guided_subtype`
- Auto-named by LiLa (same pattern as all LiLa conversations)
- Appears in conversation history with mode tag and tool icon
- Searchable, filterable by mode and by person involved
- Reopening a past tool conversation opens it in the modal (not the drawer)

**Data created/updated:**
- `lila_conversations` record with `guided_mode`, `guided_subtype`, and `metadata` containing `involved_member_ids`
- `lila_messages` records
- `communication_drafts` records (Cyrano and Higgins Say only, when Save Draft is tapped)
- `teaching_skill_history` records (Cyrano and both Higgins modes, when a teaching skill is delivered)

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | All 8 tools available. Sees all family members in person pill selector (in-household + Out of Nest). Controls which tools other members can access via `lila_tool_permissions`. |
| Dad / Additional Adult | Configurable | Mom grants access per tool. Default recommendation: all 8 tools. Person pill selector shows members mom has permitted context for. |
| Special Adult | None | No AI Toolbox access. Special Adults use shift-specific tools (PRD-27). |
| Independent (Teen) | Configurable | Mom grants per tool. Recommended defaults: Higgins Say, Higgins Navigate, Gratitude, Words of Affirmation. Person pill selector shows family members. AI voice adapts to teen-appropriate coaching. |
| Guided | Configurable | Mom can grant specific tools (e.g., simplified Gratitude). Guided shell token overrides apply. |
| Play | Not present | No AI Toolbox. No relationship tools. |

### Shell Behavior
- **Mom shell:** AI Toolbox in sidebar with Love Languages group + Cyrano + Higgins. Three QuickTask buttons. Conversation modals for all tools.
- **Dad/Adult shell:** AI Toolbox shows permitted tools. Permitted tool buttons in QuickTasks. Conversation modals.
- **Independent shell:** AI Toolbox shows permitted tools. QuickTasks shows permitted tools. Conversation modals.
- **Guided shell:** AI Toolbox shows permitted tools with simplified display. QuickTasks shows permitted tools. Conversation modals.
- **Play shell:** No AI Toolbox section. No relationship tool QuickTasks.

### Privacy & Transparency
- Mom's private notes (PRD-19) are loaded into HER LiLa context when she uses these tools. Never loaded for other members.
- Relationship notes are author-scoped: each member's conversations only reference their own relationship notes (PRD-19).
- Vetoed items are saved to the person's Archives context and loaded for the author who vetoed them (not visible to the person being described).
- When a teen uses Higgins, mom can see the conversation existed in history (mode tag) but teen privacy conventions from PRD-02 apply to content visibility.
- Conversations from all tools appear in the member's LiLa conversation history, tagged with tool mode and persons involved.

---

## Data Schema

### Table: `communication_drafts`

Stores drafts from Cyrano and Higgins Say modes. Replaces StewardShip's separate `cyrano_messages` and `higgins_messages` tables with a single unified table.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| author_id | UUID | | NOT NULL | FK → family_members. Who created this draft. |
| about_member_id | UUID | | NULL | FK → family_members. Primary person this draft is about. NULL if general. |
| tool_mode | TEXT | | NOT NULL | 'cyrano' or 'higgins_say'. CHECK constraint. |
| raw_input | TEXT | | NOT NULL | User's original text / situation description |
| crafted_version | TEXT | | NOT NULL | LiLa's suggested version |
| final_version | TEXT | | NULL | What user actually sent (after edits). NULL if still draft. |
| teaching_skill | TEXT | | NULL | Which skill was highlighted |
| teaching_note | TEXT | | NULL | LiLa's explanation of the skill |
| status | TEXT | 'draft' | NOT NULL | Enum: 'draft', 'sent', 'saved_for_later', 'discarded' |
| sent_at | TIMESTAMPTZ | | NULL | When marked as sent |
| sent_via | TEXT | | NULL | 'clipboard', 'message', 'external'. How the draft was delivered. |
| lila_conversation_id | UUID | | NULL | FK → lila_conversations. ON DELETE SET NULL. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

> **Decision rationale:** Unifying Cyrano and Higgins Say drafts into one table simplifies queries and reduces migration complexity. Both tools produce the same artifact — a crafted communication draft. The `tool_mode` column distinguishes them for filtering and skill rotation.

**RLS Policy:** Members can CRUD their own drafts (`author_id = current_member_id`). Mom can READ all drafts in her family (consistent with PRD-02 mom-sees-all). No other cross-member access.

**Indexes:**
- `(family_id, author_id, status)` — "my active drafts"
- `(family_id, author_id, tool_mode, created_at DESC)` — "my recent Cyrano/Higgins drafts"
- `(family_id, about_member_id)` — "drafts about a specific person"

---

### Table: `teaching_skill_history`

Tracks which teaching skills have been used recently per user per tool, enabling skill rotation and skill-check mode progression.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| member_id | UUID | | NOT NULL | FK → family_members |
| tool_mode | TEXT | | NOT NULL | 'cyrano', 'higgins_say', or 'higgins_navigate' |
| skill_key | TEXT | | NOT NULL | The teaching skill key (e.g., 'specificity', 'naming_emotion') |
| about_member_id | UUID | | NULL | FK → family_members. Who the conversation was about. |
| lila_conversation_id | UUID | | NULL | FK → lila_conversations. ON DELETE SET NULL. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

> **Decision rationale:** A separate history table (rather than querying `communication_drafts`) allows tracking teaching skills for Higgins Navigate mode too, which doesn't produce drafts but still teaches skills.

**RLS Policy:** Members can read their own records. Mom can read all in family.

**Indexes:**
- `(family_id, member_id, tool_mode, created_at DESC)` — "recent skills for rotation"
- `(family_id, member_id, tool_mode)` — "total count for skill-check threshold"

### Enum/Type Updates

No new enums. All type distinctions use TEXT with CHECK constraints.

Existing enums referenced:
- `journal_entries.entry_type` includes `'gratitude'` (defined in PRD-08) — used by Gratitude tool's "Save to Journal" action chip

---

## Flows

### Incoming Flows (How Data Gets INTO These Tools)

| Source | How It Works |
|--------|-------------|
| QuickTasks strip | Love Languages / Cyrano / Higgins buttons launch tool conversation modals |
| AI Toolbox sidebar | Tool cards launch conversation modals |
| Conversation history | Reopening a past tool conversation opens it in its modal |
| Archives context (PRD-13) | Person context, wishlist folders loaded into tool conversations when a person is selected |
| InnerWorkings (PRD-07) | Self-knowledge loaded for the user AND for the selected person (if they have entries) |
| Guiding Stars (PRD-06) | Always loaded as baseline context |
| Private notes (PRD-19) | Mom's private notes about the selected person loaded into her tool context |
| Relationship notes (PRD-19) | Author's own notes about the relevant relationship pair loaded |
| "How to Reach Me" card (PRD-19) | High-priority context loaded for ALL 8 tools when a person is selected |
| Partner shared context (PRD-19) | Spouse's shared InnerWorkings/context loaded for Cyrano and spouse-involving tools |
| Name resolution table (PRD-19) | `display_name_aliases` used for auto-detecting people mentioned in conversation |

### Outgoing Flows (How These Tools Feed Others)

| Destination | How It Works |
|-------------|-------------|
| Tasks (PRD-09A) | "Create Task" action chip on Quality Time, Gifts, Observe & Serve, Words of Affirmation, Higgins Navigate |
| Journal (PRD-08) | "Save to Journal" action chip on Gratitude (entry_type = 'gratitude') and Higgins Navigate (entry_type = 'journal_entry') |
| Victory Recorder (PRD-11) | "Record Victory" action chip on Words of Affirmation and Gratitude |
| Lists (PRD-09B) | "Add to Wishlist" / "Add to Gift Ideas List" on Gifts tool |
| Messages (PRD-15) | "Send via Message" action chip on Cyrano and Higgins Say opens compose flow with draft text |
| Smart Notepad (PRD-08) | "Edit in Notepad" action chip on all tools |
| Archives context learning (PRD-13) | Veto memory: negative preferences saved to person's Archive context via context learning write-back |
| Conversation History | Every tool conversation auto-saves with mode tag, persons involved, and auto-generated title |

---

## AI Integration

### Shared Context Assembly (All 8 Tools)

When any relationship tool conversation starts and a person is selected via the pill selector (or auto-detected), the context assembly pipeline loads:

1. **Guiding Stars** (always, baseline)
2. **User's InnerWorkings** (always, for self-awareness context)
3. **Selected person's Archive context** (active items from PRD-13, priority-ordered per PRD-19 drag ordering)
4. **Selected person's "How to Reach Me" card** (PRD-19, HIGH PRIORITY — loaded first in person context block)
5. **Selected person's InnerWorkings** (if they have entries and sharing is enabled)
6. **Author's private notes about the selected person** (PRD-19, mom only)
7. **Author's relationship notes** for any relevant pair (PRD-19, author-scoped)
8. **Partner shared context** (PRD-19, for Cyrano and spouse-involving conversations)
9. **Vetoed items** for the selected person (negative preferences from Archives, formatted as "AVOID suggesting: [items]")
10. **Recent teaching skill history** (last 10 entries for the tool mode, for skill rotation)
11. **Total interaction count** with this tool (for skill-check threshold)

### Shared AI Rules (All 8 Tools)

These rules apply to every relationship tool conversation:

- **Never takes sides** in interpersonal conflicts
- **Never coaches manipulation or deception** — if a user's request seems aimed at controlling rather than connecting, gently redirect
- **Never replaces professional help** — redirects to Safe Harbor (PRD-20) if abuse/danger indicators appear
- **Never reveals private notes or other members' relationship notes** — LiLa synthesizes without attributing
- **Always redirects toward real human connection** — the tools are bridges to people, not substitutes for people
- **Faith references only when natural** and the user's Guiding Stars support it (per PRD-05 faith ethics framework)
- **Respects the Relationship Context Ethical Framework** (PRD-19): validate → invite curiosity → gentle reframe → empower with ownership
- **Uses the "How to Reach Me" card** as high-priority guidance for how to approach the selected person
- **Honors vetoed items** — never suggests gifts, activities, or approaches the user has previously rejected for this person

### Mode Switching Within Modals

If a conversation naturally shifts to a different tool's domain (e.g., a Quality Time chat becomes a Higgins Navigate situation), LiLa recognizes the shift and offers:

"This sounds like you're working through something deeper with [Name]. Want me to switch to Navigate mode so we can explore the situation together? I'll save this conversation and start fresh."

If the user accepts:
1. Current conversation is saved with its original mode tag
2. A new conversation opens in the new mode within the same modal
3. Person selection carries over
4. Key context from the prior conversation is summarized into the new conversation's opening

---

### Tool 1: Quality Time (`quality_time`)

**Display Name:** Quality Time
**Icon:** Heart
**Group:** Love Languages
**Model:** Sonnet
**Person Selector:** Single person (any family member, including Out of Nest)

**Context loaded:** Shared context (above) + person's interests/hobbies from Archives + recent activities from conversation history + any vetoed activities

**AI Behavior:**

1. **GREET** warmly with a rotating opening message that references the selected person by name and something specific from their context.
   - Variant 1: "Let's plan something special for [Name]. I can see they're really into [interest from Archives] lately — want to build on that, or try something completely different?"
   - Variant 2: "Quality time with [Name] — one of the best investments you can make. What's the vibe you're going for? Chill and low-key, active adventure, or learning something new together?"
   - Variant 3: "I know [Name] pretty well by now. Want me to suggest some ideas based on what I know about them, or do you have a direction in mind?"

2. **SUGGEST** context-aware activities. Each suggestion includes:
   - The activity idea (specific, not generic — "build a LEGO Technic set together" not "do a craft")
   - Why it fits this person (references their interests, age, personality)
   - Practical details (estimated time, cost range, indoor/outdoor, energy level)
   - A connection prompt — something to talk about or notice during the activity

3. **ADAPT** based on constraints the user mentions (budget, time, weather, other kids present, mobility limitations, etc.)

4. **OFFER** to create a task for the chosen activity with a suggested date/time

5. **FOLLOW UP** if the user returns: "How did [activity] with [Name] go? Want to capture any moments or plan the next one?"

**Action chips:** Copy, Edit in Notepad, Review & Route, Create Task

---

### Tool 2: Gifts (`gifts`)

**Display Name:** Gifts
**Icon:** Gift
**Group:** Love Languages
**Model:** Sonnet
**Person Selector:** Single person (any family member, including Out of Nest)

**Context loaded:** Shared context + person's wishlist folder (PRD-13) + person's interests + previous gift conversations in history + vetoed gift items + budget context if user has mentioned it

**AI Behavior:**

1. **GREET** with awareness of context:
   - Variant 1: "Gift shopping for [Name]? I see they have [X items] on their wishlist — want to start there, or surprise them with something they haven't thought of?"
   - Variant 2: "Let's find something perfect for [Name]. Any occasion in mind, or just because?"
   - Variant 3: "[Name] is into [interest]. I have some ideas that might light them up — ready?"

2. **SUGGEST** personalized gift ideas with:
   - The gift idea (specific product/experience, not categories)
   - Why it fits (references interests, personality, love language, recent events)
   - Approximate price range
   - Where to find it (general — "most bookstores" not affiliate links)
   - Whether it connects to their wishlist or goes in a new direction

3. **RESPECT VETOES** — never suggest items in the "AVOID" context. If the user mentions something new that the person would dislike, acknowledge and offer to save as a veto.

4. **INTEGRATE WITH LISTS** — offer "Add to Wishlist" and "Add to Gift Ideas List" action chips on each suggestion. These save to the person's existing lists (PRD-09B, PRD-13 wishlist folder).

5. **TRACK OCCASION** — if the user mentions a birthday, anniversary, holiday, etc., offer to create a task with a reminder date.

**Action chips:** Copy, Edit in Notepad, Review & Route, Create Task, Add to Wishlist, Add to Gift Ideas List

---

### Tool 3: Observe & Serve (`observe_serve`)

**Display Name:** Observe & Serve
**Icon:** Eye
**Group:** Love Languages
**Model:** Sonnet
**Person Selector:** Single person (any family member)

**Context loaded:** Shared context + "How to Reach Me" card (critical for this tool) + private notes + recent task history for the person + recent journal entries mentioning the person

**AI Behavior:**

1. **GREET** with an observation-oriented opening:
   - Variant 1: "Let's think about [Name] for a minute. What have you noticed about them lately — anything that's been on your mind?"
   - Variant 2: "Serving someone well starts with seeing them clearly. What's [Name]'s world like right now?"
   - Variant 3: "I know a few things about what [Name] needs. Want me to suggest some ways to serve them based on what I can see, or do you want to talk through what you've been noticing?"

2. **SURFACE HIDDEN NEEDS** — this tool's unique strength. LiLa uses Archives context, private notes, and "How to Reach Me" to identify:
   - Recurring frustrations (from private notes, journal entries)
   - Unmet needs (from "How to Reach Me" card fields)
   - Things the person has asked for that haven't been addressed
   - Subtle signs of stress or overwhelm (from recent context patterns)
   - Put-off requests or overlooked needs

3. **SUGGEST CONCRETE ACTIONS** — not vague ("be more supportive") but specific:
   - "Jake mentioned he's stressed about his science project — could you offer to help him organize his notes tonight?"
   - "Emma's 'How to Reach Me' card says she needs 10 minutes of quiet after school before talking. Have you been honoring that?"
   - "Your husband hasn't had a night off from bedtime routine in two weeks. What if you handled it solo tonight?"

4. **DISTINGUISH** between acts of service and taking over — gently redirect if suggestions lean toward enabling rather than supporting.

**Action chips:** Copy, Edit in Notepad, Review & Route, Create Task

---

### Tool 4: Words of Affirmation (`words_affirmation`)

**Display Name:** Words of Affirmation
**Icon:** MessageCircle
**Group:** Love Languages
**Model:** Sonnet
**Person Selector:** Single person (any family member)

**Context loaded:** Shared context + recent victories for the person (PRD-11) + person's strengths from Archives + InnerWorkings (values, personality) + Guiding Stars (for alignment with family values)

**AI Behavior:**

1. **GREET** with an affirmation-ready opening:
   - Variant 1: "Let's celebrate [Name]. What have you seen them do lately that made you proud, grateful, or just amazed?"
   - Variant 2: "Words of affirmation are most powerful when they're specific. Tell me something [Name] did recently, and I'll help you say why it mattered."
   - Variant 3: "I know some incredible things about [Name] from their context. Want me to help you put words to what you already see in them?"

2. **CRAFT SPECIFIC AFFIRMATIONS** rooted in real knowledge:
   - Never generic ("you're amazing!") — always specific ("The way you helped your sister with her reading without being asked shows real kindness and patience")
   - References real events, accomplishments, character traits from context
   - Matches the person's receiving style from "How to Reach Me" card and Archives
   - Varies sentence structure — not every affirmation follows the same pattern

3. **ALIGN WITH HONEST DECLARATIONS PHILOSOPHY** (per The Art of Honest Declarations companion doc):
   - Affirmations should be things every fiber of the speaker's being can affirm as true
   - No hollow praise — only real observations stated with genuine feeling
   - Direct constructions, not passive progressive
   - Varied sentence structures

4. **OFFER MULTIPLE FORMATS:**
   - Spoken words (what to say out loud)
   - Written note (for a card, sticky note, or text message)
   - Declaration-style (for the person to say about themselves, if appropriate)

**Action chips:** Copy, Edit in Notepad, Review & Route, Create Task, Record Victory

---

### Tool 5: Gratitude (`gratitude`)

**Display Name:** Gratitude
**Icon:** Sparkles
**Group:** Love Languages
**Model:** Sonnet
**Person Selector:** Single person (optional — can be general gratitude practice or person-focused)

**Context loaded:** Shared context (if person selected) + recent gratitude journal entries + person's context and victories

**AI Behavior:**

1. **GREET** with a gratitude-oriented opening:
   - Variant 1 (person selected): "Let's slow down and think about [Name]. What are you grateful for about them right now — big or small?"
   - Variant 2 (person selected): "Gratitude rewires how you see someone. What's one thing [Name] did recently that you might normally overlook?"
   - Variant 3 (no person): "What's on your heart today? I'm here to help you sit with gratitude for a minute."

2. **DEEPEN** — don't just list things to be grateful for. Help the user:
   - Move from surface to substance ("I'm grateful she cooks dinner" → "I'm grateful that she puts thought into what each kid will actually eat, even when she's exhausted")
   - Find gratitude in hard situations ("What's the gift hidden in this struggle?")
   - Connect gratitude to the person's character, not just their actions
   - Notice what they might be taking for granted

3. **OFFER TO SAVE** — the "Save to Journal" action chip creates a `journal_entries` record with `entry_type = 'gratitude'` and the `life_area_tag` set to the relevant area (e.g., `spouse_marriage`, `family`, `personal`). If a person was selected, the journal entry's metadata includes the person reference.

4. **CONNECT** to Words of Affirmation: "That's a beautiful observation. Would you like to tell [Name] what you just told me? I can help you craft the words." This offers a natural bridge to the Words of Affirmation tool (via mode switching).

5. **QUICK CAPTURE** option: if the user just wants to jot a quick gratitude note without a full conversation, LiLa accommodates: "Just want to capture something quick? Go ahead — I'll save it to your journal."

**Action chips:** Copy, Edit in Notepad, Review & Route, Save to Journal, Record Victory

---

### Tool 6: Cyrano (`cyrano`)

**Display Name:** Cyrano
**Icon:** Feather
**Group:** Individual (not part of Love Languages group)
**Model:** Sonnet
**Person Selector:** Spouse/partner only (pre-selected, not changeable)

**Context loaded:** Shared context + partner's full Archives context + partner shared InnerWorkings + all Cyrano teaching skill history + recent Cyrano drafts + partner's "How to Reach Me" card + vetoed communication approaches

**AI Behavior — Craft-First Flow:**

1. **GREET** warmly and ask what they want to say:
   - Variant 1: "What's on your mind about [Partner]? Give me the raw version — I'll help you say it the way they'll actually hear it."
   - Variant 2: "Got something you want to tell [Partner]? Don't worry about how it sounds — just tell me what you're feeling, and we'll craft it together."

2. **CRAFT IMMEDIATELY** after the user's first message. No clarifying questions before the first draft. The user needs to see that LiLa is useful before they invest more. The crafted version should:
   - Preserve the user's voice (don't make them sound like someone else)
   - Express in the partner's receiving language, not the sender's expressing language
   - Be specific, not generic
   - Reference shared history or context where it strengthens the message

3. **TEACH ONE SKILL** per interaction. Include alongside the crafted message:
   - The skill name (friendly, not jargon)
   - A brief teaching note explaining why the changes matter
   - Framed as "here's what I did and why" — educational, not condescending

4. **INVITE REFINEMENT:** "Want to adjust anything? This is YOUR message — I just helped shape it."

5. **OFFER DELIVERY:** Copy Draft, Save Draft, Send via Message action chips.

6. **NEVER MAKES IT PERFORMATIVE.** If LiLa senses the user is trying to "win points" rather than genuinely connect, gently redirect: "This is good, but let me ask — is this what you actually feel, or what you think they want to hear? Because they can tell the difference, and the real version is always better."

**Cyrano Teaching Skills (7 skills, renamed from StewardShip):**

| Skill Key | Display Name | Description |
|-----------|-------------|-------------|
| `specificity` | Specificity | Name the specific thing, not the category ("the way you handled Jake's meltdown" not "you're a good parent") |
| `partner_lens` | Their Lens | Express in the partner's receiving language, not your expressing language |
| `feeling_over_function` | Feeling Over Function | What it makes you feel, not just what you observe |
| `timing` | Timing & Context | When and how to deliver for maximum impact |
| `callback_power` | Callback Power | Referencing shared history, inside jokes, previous conversations |
| `unsaid_need` | The Unsaid Need | What they might need to hear that they'd never ask for |
| `presence_proof` | Presence Proof | Words that demonstrate you were paying attention to something small |

> **Decision rationale:** `her_lens` renamed to `partner_lens` for gender-neutral language that works for any partnership configuration.

**Skill Rotation:**
- Last 10 teaching skills loaded into context (from `teaching_skill_history`)
- LiLa avoids repeating the same skill consecutively
- Distributes across all 7 skills over time

**Skill-Check Mode (after 5+ interactions):**
- After 5+ Cyrano interactions, LiLa periodically offers: "Want to try something? Write your message to [Partner] first, and I'll give you feedback instead of rewriting it."
- User writes their own draft → LiLa analyzes using the teaching framework → provides feedback highlighting what's strong and what could be improved
- This is the "make itself unnecessary" progression — the user gradually internalizes the skills
- Tracked via total count in `teaching_skill_history` for the `cyrano` tool mode

**Cyrano stays spouse/partner-only:**

> **Decision rationale:** Cyrano's value comes from its intimate, romantic-aware communication coaching. Expanding it to other relationships would dilute the magic. Higgins Say covers "help me craft a message to anyone" with relationship-aware voice adaptation. Making Cyrano deeper (more skills, richer partner context, skill-check progression) is the upgrade path, not making it broader.

---

### Tool 7: Higgins — Help Me Say Something (`higgins_say`)

**Display Name:** Help Me Say Something (under the Higgins umbrella)
**Icon:** GraduationCap
**Group:** Individual (accessed via Higgins mode picker)
**Model:** Sonnet
**Person Selector:** One or more people (any family member, any relationship)

**Context loaded:** Shared context + relationship-type-aware coaching adaptation + Higgins teaching skill history + relationship notes for the relevant pair

**AI Behavior — Craft-First Flow (same pattern as Cyrano, adapted for any relationship):**

1. **GREET** warmly and ask what they want to say:
   - Variant 1: "Who are you trying to talk to, and what do you want to say? Give me the honest version."
   - Variant 2: "Communication is a skill, not a talent. Tell me the situation, and we'll find the right words together."

2. **CRAFT IMMEDIATELY** after the first message. Same craft-first principle as Cyrano — no clarifying questions before the first draft.

3. **ADAPT VOICE** based on relationship dynamics. This is Higgins' distinguishing feature:

| Relationship Dynamic | Coaching Adaptation |
|---------------------|-------------------|
| Parent → Child (under 8) | Simple, concrete, playful language. Model emotional vocabulary. "Try saying: 'I noticed you shared your toy with Maya. That was really kind.'" |
| Parent → Child (8-12) | Age-appropriate emotional intelligence. Beginning independence respect. |
| Parent → Teen (13-17) | Autonomy-respecting. Invitation over instruction. Validate their perspective first. |
| Parent → Young Adult (18+) | Peer-adjacent. Advisory tone. Respect their choices. |
| Child/Teen → Parent | Navigate power dynamics safely. Express needs without threatening the relationship. |
| Peer → Peer | Equal footing. Direct communication. Mutual respect. |
| Spouse → Spouse | If someone selects their spouse, Higgins operates here but LiLa may suggest Cyrano for richer partner-specific coaching. |

4. **TEACH ONE SKILL** per interaction (from Higgins skill set, distinct from Cyrano's).

5. **INVITE REFINEMENT** and offer delivery options.

**Higgins Teaching Skills (7 skills):**

| Skill Key | Display Name | Description |
|-----------|-------------|-------------|
| `naming_emotion` | Naming the Emotion | Identifying and expressing the actual feeling beneath the surface |
| `perspective_shift` | Perspective Shift | Seeing the situation from the other person's point of view |
| `validation_first` | Validation First | Leading with acknowledgment before making a request or raising a concern |
| `behavior_vs_identity` | Behavior vs Identity | Addressing actions, not character ("when you do X" not "you always") |
| `invitation` | Invitation | Phrasing requests as invitations rather than demands |
| `repair` | Repair | Reconnecting after conflict, rupture, or misunderstanding |
| `boundaries_with_love` | Boundaries with Love | Setting limits while maintaining warmth and connection |

**Skill rotation and skill-check mode** follow the same pattern as Cyrano (last 10 loaded, avoid repeats, skill-check after 5+ interactions).

---

### Tool 8: Higgins — Help Me Navigate This (`higgins_navigate`)

**Display Name:** Help Me Navigate This (under the Higgins umbrella)
**Icon:** GraduationCap (same as Say — differentiated by mode tag)
**Group:** Individual (accessed via Higgins mode picker)
**Model:** Sonnet
**Person Selector:** One or more people (multi-select encouraged for situations involving multiple family members)

**Context loaded:** Shared context + relationship notes for all relevant pairs + private notes + "How to Reach Me" cards for all involved people + Higgins Navigate teaching skill history

**AI Behavior — Processing Flow (distinct from craft-first):**

This is NOT a "draft a message" tool. This is a relational processing tool — more therapeutic than Cyrano or Higgins Say. The flow follows the Relationship Context Ethical Framework (PRD-19):

1. **LISTEN** to the situation. Let the user describe what's happening without interrupting or immediately offering solutions.
   - Variant 1: "Tell me what's going on. Take your time — I'm here to listen and help you think through this."
   - Variant 2: "What's the situation? I'll help you figure out your options and how you want to show up."

2. **VALIDATE** feelings first. Always. Every time.
   - Acknowledge the person's experience as real and legitimate
   - "That sounds really frustrating." "It makes sense you'd feel unheard."
   - Never skip validation to jump to advice or perspective-taking

3. **INVITE CURIOSITY** — ask the user what THEY think is going on:
   - "Why do you think [person] might be responding that way?"
   - "What do you think is happening for them?"
   - This is fundamentally different from telling them what the other person thinks

4. **PRESENT 2-3 OPTIONS** — each option includes:
   - The approach (what to do or say)
   - Which teaching skill it demonstrates
   - The likely outcome / risk
   - Why it might work for this specific person (using "How to Reach Me" context)

5. **EMPOWER WITH OWNERSHIP:**
   - "What are your thoughts? How would you like to show up in this?"
   - "Would you like help crafting something specific to say?"
   - If the user wants word-crafting at this point, Higgins Navigate shifts into a light craft mode (but still within the Navigate conversation — no mode switch needed)

6. **OFFER JOURNALING** — "Want to capture your thoughts on this? I can save a reflection to your journal." The Save to Journal action chip creates a `journal_entries` record.

**Teaching skills:** Uses the same 7 Higgins skills as Say mode, but they're woven into the options rather than explicitly taught per message. The teaching is implicit — each option is an example of a skill in action, and LiLa names the skill within the option description.

**Multi-person situations:**
When multiple people are selected in the pill selector, LiLa loads context for all of them and navigates the interpersonal dynamics between them. This is distinct from Full Picture Mediation (PRD-19) in that Navigate mode uses only the current user's context and relationship notes — it doesn't load other members' private notes.

---

## Edge Cases

### No Person Selected
- Love Languages tools work without a person selected (general brainstorming), but LiLa gently suggests: "Want to focus on someone specific? I can give much better suggestions with their context loaded."
- Cyrano requires spouse/partner — if no partner exists in the family, the tool shows: "Cyrano works with your spouse or partner. Once your partner is set up in the family, you'll be able to use this tool."
- Higgins works without a person selected for general communication advice, but context-dependent features are reduced.

### Person Has Minimal Context
- If a selected person has very little Archives context, LiLa acknowledges: "I don't know much about [Name] yet. The more context you add to their Archives profile, the better I can help. For now, tell me about them and I'll work with what you share."
- Tool still functions — it just relies more on what the user shares in conversation.

### Veto Conflict
- If a user suggests something that was previously vetoed by themselves, LiLa flags it: "You mentioned before that [Name] doesn't like [thing]. Has that changed, or would you like me to suggest alternatives?"
- User can override the veto: "Actually, they've come around on that" → LiLa offers to remove the veto from Archives context.

### Skill-Check Mode Declined
- If the user declines skill-check mode ("No, just help me write it"), LiLa returns to craft-first mode without judgment. The offer is periodic, not persistent.

### Mode Switching Mid-Conversation
- If LiLa detects a conversation has shifted domains (e.g., a Gifts chat becomes a Navigate situation), it offers to switch modes. Both conversations are saved. The user can decline and stay in the current mode.

### Draft Management
- Drafts older than 30 days in "draft" status are auto-archived (not deleted). Users can find them in conversation history.
- "Saved for later" drafts persist indefinitely until explicitly discarded.

### Multi-Person Higgins With Conflicting Context
- When navigating a situation between two people who have conflicting "How to Reach Me" preferences (e.g., one needs space, the other needs immediate resolution), LiLa names the tension: "This is tricky because [Person A] needs space to process while [Person B] needs immediate reassurance. Here are approaches that honor both..."

---

## Tier Gating

> **Tier rationale:** These tools are a core differentiator for the platform. Basic access should be available broadly to demonstrate value. Advanced features (skill-check mode, multi-person Higgins, veto memory) represent deeper engagement worth gating at higher tiers.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `tool_quality_time` | Quality Time guided mode | TBD |
| `tool_gifts` | Gifts guided mode | TBD |
| `tool_observe_serve` | Observe & Serve guided mode | TBD |
| `tool_words_affirmation` | Words of Affirmation guided mode | TBD |
| `tool_gratitude` | Gratitude guided mode | TBD |
| `tool_cyrano` | Cyrano guided mode | TBD |
| `tool_higgins_say` | Higgins Say guided mode | TBD |
| `tool_higgins_navigate` | Higgins Navigate guided mode | TBD |
| `ai_toolbox_browse` | Browse AI Toolbox sidebar section | TBD |

All return `true` during beta. Feature keys wired from day one per PRD-02 conventions.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| AI Vault tool browsing and "+Add to AI Toolbox" assignment pattern | Full AI Vault browse + assign flow | PRD-21A |
| ThoughtSift tools in AI Toolbox | ThoughtSift guided modes registering in Toolbox | Future ThoughtSift PRD |
| Homework Helper / Teen tools in AI Toolbox | Teen-specific guided modes | Future teen tools PRD |
| Cyrano growth tracking and export (anniversary gift feature) | Draft quality comparison over time, exportable message history | Post-MVP enhancement or Cyrano v2 side quest |
| Dedicated per-tool data tables (gift history, activity log, etc.) | Structured browsable records beyond conversation history | Post-MVP enhancement based on beta feedback |
| Skill distribution analytics (ensure all 7 skills get practiced) | Visual skill coverage for users who want to track their growth | Post-MVP |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| AI Toolbox page + per-member tool assignment | PRD-19 | Partially wired: AI Toolbox sidebar section created with 8 default tools, per-member permission filtering via `lila_tool_permissions`. Full Vault-based assignment flow deferred to PRD-21A. |
| Higgins/Cyrano/etc. living in AI Toolbox | PRD-19 | Wired: all 8 tools live in AI Toolbox sidebar section and QuickTasks strip. |
| Higgins/Cyrano coaching integration in message coaching | PRD-15 | Partially wired: "Send via Message" action chip on Cyrano and Higgins Say opens PRD-15 compose flow. Full coaching-checkpoint integration (PRD-15's "Want help rewording? Open in Cyrano" pattern) deferred to post-MVP. |
| Relationship tools person-context adaptation | PRD-05 | Wired: all 8 tools use PRD-19 person context, relationship notes, "How to Reach Me" card, and name resolution. |
| Gift wishlists linked from Gifts guided mode | PRD-05 | Wired: "Add to Wishlist" action chip links to PRD-13 wishlist folders and PRD-09B lists. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] AI Toolbox sidebar section renders in all dashboard shells (filtered by permissions)
- [ ] AI Toolbox shows Love Languages group (collapsible, 5 tools inside) + Cyrano + Higgins
- [ ] QuickTasks strip shows 3 buttons: Love Languages (popover picker), Cyrano, Higgins (mode picker)
- [ ] Love Languages popover shows 5 tools; tapping one opens conversation modal
- [ ] Higgins mode picker shows Say / Navigate options; tapping one opens conversation modal
- [ ] All 8 tools open in conversation modals (not drawer) for ALL members including mom
- [ ] Person pill selector appears in modal header for all tools
- [ ] Person pill selector pre-selects spouse for Cyrano; empty for others
- [ ] Person pill selector supports multi-select for Higgins modes
- [ ] Name auto-detection from conversation text resolves via PRD-19 name resolution table and auto-selects pills
- [ ] Context assembly loads all 11 sources listed in AI Integration for each tool when person selected
- [ ] "How to Reach Me" card loaded as high-priority context for all 8 tools
- [ ] Quality Time: context-aware activity suggestions with practical details and connection prompts
- [ ] Gifts: personalized suggestions with wishlist integration and gift idea list integration
- [ ] Gifts: "Add to Wishlist" and "Add to Gift Ideas List" action chips functional
- [ ] Observe & Serve: surfaces hidden needs from context, suggests concrete specific actions
- [ ] Words of Affirmation: specific, evidence-based affirmations aligned with Honest Declarations philosophy
- [ ] Gratitude: person-focused or general practice, "Save to Journal" creates `journal_entries` with `entry_type = 'gratitude'`
- [ ] Cyrano: craft-first flow, preserves user voice, partner-lens adaptation, spouse-only
- [ ] Cyrano: teaches one of 7 skills per interaction with teaching note
- [ ] Higgins Say: craft-first flow with relationship-aware voice adaptation by relationship type
- [ ] Higgins Say: teaches one of 7 Higgins skills per interaction
- [ ] Higgins Navigate: processing flow (listen → validate → curiosity → options → empower)
- [ ] Higgins Navigate: presents 2-3 options with skill labels and risk assessment
- [ ] Veto memory: LiLa detects negative preferences, offers to save to Archives, respects vetoes in future conversations
- [ ] `communication_drafts` table created with RLS enforced
- [ ] `teaching_skill_history` table created with RLS enforced
- [ ] Skill rotation: last 10 skills loaded, avoids consecutive repeats
- [ ] Skill-check mode offered after 5+ interactions (Cyrano and Higgins Say)
- [ ] "Save Draft" and "Copy Draft" action chips on Cyrano and Higgins Say
- [ ] "Send via Message" action chip opens PRD-15 compose flow with draft text
- [ ] "Create Task" action chips functional on applicable tools
- [ ] "Record Victory" action chips functional on Words of Affirmation and Gratitude
- [ ] Mode switching within modals: LiLa detects domain shift, offers switch, saves both conversations
- [ ] All tool conversations save to LiLa conversation history with mode tags and person involvement
- [ ] Conversations auto-named by LiLa
- [ ] Opening messages rotate (2+ variants per tool per PRD-05 convention)
- [ ] `useCanAccess()` wired on all 9 feature keys, returning `true` during beta
- [ ] PermissionGate wrapping all AI Toolbox UI per PRD-02 conventions
- [ ] RLS verified: drafts only readable by author (+ mom)
- [ ] RLS verified: skill history only readable by member (+ mom)
- [ ] AI voice for teen users: talks UP, treats as capable, never condescending, parent-connection-first

### MVP When Dependency Is Ready
- [ ] AI Vault browse + "+Add to AI Toolbox" assignment (depends on PRD-21A)
- [ ] Full message coaching checkpoint integration — "Want help rewording? Open in Cyrano" (depends on PRD-15 coaching build)
- [ ] ThoughtSift tools registering in AI Toolbox (depends on future ThoughtSift PRD)
- [ ] Homework Helper / teen tools in AI Toolbox (depends on future teen tools PRD)

### Post-MVP
- [ ] Cyrano growth tracking: raw input quality comparison over time
- [ ] Cyrano skill distribution analytics: visual coverage of all 7 skills
- [ ] Cyrano exportable message history (anniversary gift feature)
- [ ] Dedicated per-tool data tables (gift history, activity log) based on beta usage patterns
- [ ] 21 Compliments Practice within Words of Affirmation (structured multi-day challenge, saved as List)
- [ ] Seasonal/occasion-aware suggestions (birthday approaching, holidays, etc.)
- [ ] AI Toolbox drag-to-reorder for personalized tool arrangement
- [ ] Tool usage analytics per member (which tools get used most, with whom)

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: All 8 relationship tools open in **conversation modals** for ALL members including mom. LiLa drawer is reserved for core modes (Help, Assist, Optimizer, general chat). Same conversation engine, different UI container.
- [ ] Convention: AI Toolbox sidebar section is a **per-member curated tool launcher**. Shows only tools the member has access to. These 8 tools are the default starter collection. Future tools added from AI Vault via PRD-21A "+Add to AI Toolbox" pattern.
- [ ] Convention: QuickTasks shows 3 grouped buttons for relationship tools: **Love Languages** (popover with 5 tools), **Cyrano** (direct launch), **Higgins** (mode picker: Say / Navigate).
- [ ] Convention: `communication_drafts` table unifies Cyrano and Higgins Say drafts. `tool_mode` column distinguishes them. No separate tables per tool.
- [ ] Convention: `teaching_skill_history` tracks ALL teaching skill usage (Cyrano, Higgins Say, Higgins Navigate). Used for rotation and skill-check threshold.
- [ ] Convention: Cyrano is **spouse/partner-only**. Higgins covers all other relationships with voice adaptation by relationship type.
- [ ] Convention: Cyrano skill `partner_lens` (renamed from StewardShip's `her_lens`) — gender-neutral for any partnership configuration.
- [ ] Convention: Person pill selector in tool modal header. Auto-detection of names via PRD-19 `display_name_aliases`. Auto-selects pills when names mentioned in conversation.
- [ ] Convention: **Veto memory** — when a user says someone dislikes something, LiLa offers to save as negative preference to Archives context via context learning write-back (PRD-13 pattern). Vetoed items loaded as "AVOID suggesting: [items]" in future conversations.
- [ ] Convention: **Skill-check mode** after 5+ interactions (Cyrano and Higgins Say). User writes first, LiLa gives feedback instead of rewriting. "Make itself unnecessary" philosophy.
- [ ] Convention: **"How to Reach Me" card is high-priority context for ALL 8 tools**, not just communication-focused ones.
- [ ] Convention: Gifts tool integrates with PRD-13 wishlist folders and PRD-09B idea lists via "Add to Wishlist" and "Add to Gift Ideas List" action chips.
- [ ] Convention: Gratitude tool's "Save to Journal" creates `journal_entries` with `entry_type = 'gratitude'` and `life_area_tag` based on context.
- [ ] Convention: Higgins Navigate follows the **Relationship Context Ethical Framework** (PRD-19): validate → invite curiosity → gentle reframe → empower with ownership. Safety concern exception defers to Safe Harbor (PRD-20).
- [ ] Convention: Mode switching within modals is supported. LiLa detects domain shifts, offers to switch, saves both conversations with their original mode tags.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `communication_drafts`, `teaching_skill_history`
Enums updated: none (TEXT with CHECK constraints)
Triggers added: `set_updated_at` on `communication_drafts`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **All 8 tools use conversation modals, not drawer, for all members including mom** | Creates focused, immersive tool experiences distinct from general LiLa chat. Signals "I'm doing a thing" rather than "I'm chatting." Same conversation engine underneath — purely a UI container decision. Mode switching works identically in modals. |
| 2 | **Love Languages grouping for 5 brainstorming tools** | Reduces QuickTasks clutter from 7/8 buttons to 3. Natural conceptual grouping. AI Toolbox sidebar uses same grouping. |
| 3 | **Higgins as single entry point with mode picker** | One button, two modes (Say / Navigate). Cleaner than two separate buttons. Mode picker is a quick 2-option choice. |
| 4 | **Cyrano stays spouse/partner-only** | Its value comes from intimate, romantic-aware coaching. Expanding dilutes the magic. Higgins covers all other relationships. Making Cyrano deeper (not broader) is the upgrade path. |
| 5 | **Lightweight action tracking (no new tables) for 5 brainstorming tools** | Existing action chips (Create Task, Save to Journal, Record Victory, Add to Wishlist/List) cover 90% of persistence needs. Dedicated tables can be added post-MVP based on beta feedback. |
| 6 | **Unified `communication_drafts` table** | Cyrano and Higgins Say produce the same artifact. One table with `tool_mode` column is simpler than two tables. |
| 7 | **Veto memory pattern** | Users often know what someone dislikes. Saving negative preferences to Archives context prevents LiLa from re-suggesting vetoed items. Uses existing context learning write-back pattern from PRD-13. |
| 8 | **`partner_lens` replaces `her_lens`** | Gender-neutral naming for the teaching skill. Same concept (see it from partner's perspective), works for any partnership. |
| 9 | **"How to Reach Me" card = high-priority context for ALL 8 tools** | Even Quality Time and Gifts benefit from knowing "I respond best to humor" or "please don't raise your voice." Communication style context is universally relevant. |
| 10 | **AI Toolbox is a per-member curated launcher, not a static list** | These 8 are defaults. PRD-21A adds AI Vault browse-and-assign. Each member sees only their permitted tools. Foundation for a growing tool ecosystem. |
| 11 | **No tool entry points from Archives person cards** | Tools auto-detect names via name resolution (PRD-19) and use person pill selector. Keeps Archives focused on context management, not tool launching. |
| 12 | **Cyrano display name shortened to "Cyrano"** (from "Cyrano Me") | Cleaner. The "Me" was a StewardShip convention that doesn't carry forward. |
| 13 | **Modal conversations save to LiLa conversation history** | Full continuity — auto-named, tagged with mode and persons involved, searchable, reopenable. No separate history surface needed. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | AI Vault browse + "+Add to AI Toolbox" assignment | PRD-21A |
| 2 | Dedicated per-tool data tables (gift history, activity log) | Post-MVP based on beta feedback |
| 3 | Cyrano growth tracking and export | Post-MVP enhancement or Cyrano v2 side quest |
| 4 | 21 Compliments Practice | Post-MVP Words of Affirmation enhancement |
| 5 | ThoughtSift / Homework tools in AI Toolbox | Future PRDs |
| 6 | Full message coaching checkpoint integration with Cyrano | Depends on PRD-15 coaching build |
| 7 | Tool usage analytics | Post-MVP |
| 8 | AI Toolbox drag-to-reorder | Post-MVP |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-04 (Shell Routing) | QuickTasks strip gains 3 new button types: Love Languages (popover), Cyrano (direct), Higgins (mode picker). These follow the existing auto-sort-by-frequency pattern. | Note the popover/bottom-sheet pattern as a QuickTask interaction type. Add to QuickTask button type documentation. |
| PRD-05 (LiLa Core) | Conversation modals now used for guided relationship tools for ALL members including mom. This is a UI container clarification, not an architecture change. All 8 mode keys already registered. | Note that guided modes can specify `container_preference: 'modal'` in the registry to override the default drawer-for-mom / modal-for-others pattern. |
| PRD-08 (Journal) | Gratitude tool creates `journal_entries` with `entry_type = 'gratitude'`. Higgins Navigate creates entries with `entry_type = 'journal_entry'`. Both use "Save to Journal" action chip. | Verify journal creation API supports external callers specifying `entry_type` and `life_area_tag`. Note relationship tools as journal entry sources. |
| PRD-09B (Lists) | Gifts tool uses "Add to Gift Ideas List" action chip to create list items. | Verify list item creation API supports external callers. |
| PRD-13 (Archives) | Veto memory saves negative preferences via context learning write-back. Gifts tool links to wishlist folders. | Note veto/negative-preference as a context item pattern (distinct from positive context). Consider an "avoid" tag or category for negative preferences. |
| PRD-15 (Messages) | "Send via Message" action chip on Cyrano and Higgins Say opens compose flow with pre-filled text. Higgins/Cyrano coaching integration stub partially wired. | Verify compose flow API accepts pre-filled body text from external callers. Mark coaching integration stub as partially wired. |
| PRD-19 (Family Context) | AI Toolbox stub partially wired (sidebar section + 8 default tools + per-member filtering). Full Vault-based assignment deferred to PRD-21A. Name resolution and "How to Reach Me" card confirmed as high-priority context for all 8 tools. | Mark AI Toolbox stubs as partially wired. Note that full wiring depends on PRD-21A. |
| Build Order Source of Truth | PRD-21 completed. 8 relationship tools defined. AI Toolbox sidebar section established. `communication_drafts` and `teaching_skill_history` tables defined. | Update Section 2 to list PRD-21 as completed with key tables. Note AI Toolbox as a new UI pattern. |

---

*End of PRD-21*