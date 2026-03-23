# PRD-06: Guiding Stars & Best Intentions

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-05 Planning Decisions Addendum
**Created:** March 3, 2026
**Last Updated:** March 4, 2026

---

## Overview

Guiding Stars and Best Intentions are the twin north star features of MyAIM Family. Together, they answer the two questions that shape everything else: **who am I choosing to be?** (Guiding Stars) and **what am I actively practicing?** (Best Intentions).

**Guiding Stars** is a living collection of identity declarations — values, honest commitments, anchoring scriptures or quotes, and vision statements. These are relatively stable, identity-level entries that define the person's character compass. They are not goals to complete; they are truths to live by. LiLa loads them as baseline context in every conversation, grounding advice in what matters most to the person. When Victory Recorder celebrates an accomplishment, it looks for threads connecting daily actions back to declared Guiding Stars — turning small wins into evidence of who the person is becoming.

**Best Intentions** captures the organic, ongoing things a person wants to be more mindful of doing — not structured goals, not habits to mechanically track, but intentional reminders of how they want to show up. "Give my kids more opportunities to have experiences with the Spirit." "Pause, listen, and breathe when Gideon is speaking." "Go for more walks focused on gratitude." Best Intentions rotate through dashboard widgets, morning rhythm, and evening review so they stay top of mind. When a person acts on one, they tap to celebrate — confetti fires, the iteration counts, and Victory Recorder logs the moment. Then it resets for next time, because Best Intentions are never "done."

> **Decision rationale:** Best Intentions was redesigned from v1's structured goal system (current_state/desired_state/why_it_matters) to lightweight intentional reminders with tap-to-celebrate. The structured goal-setting pattern will live in LifeLantern (PRD-12) instead. Best Intentions prioritizes staying top-of-mind over tracking progress toward completion.

These features are **context sources, not conversation modes.** Neither registers in the LiLa guided mode registry. They produce data that LiLa reads and references when relevant — Guiding Stars as always-loaded identity context, Best Intentions as topically-surfaced action context.

> **Mom experience goal:** Mom should feel like the app truly knows her — not just her tasks and calendar, but her heart. Guiding Stars makes her values visible and active in every AI interaction. Best Intentions keeps her true priorities from drowning in daily noise. The tap-to-celebrate interaction should feel like a tiny, private fist-pump — a moment of "I did that" in a day that rarely pauses to notice.

> **Depends on:** Context assembly pipeline and `is_included_in_ai` pattern — defined in PRD-05 (LiLa Core AI System) and PRD-05 Planning Decisions Addendum. Three-tier toggle system (person → category → item). Guided mode registry (these features do NOT register). Permission model from PRD-02.

---

## User Stories

### Guiding Stars — Creating & Managing
- As a mom, I want to write down my core values so LiLa can ground its advice in what matters to me.
- As a mom, I want to craft a declaration with LiLa's help so I can articulate who I'm choosing to become using honest commitment language.
- As a mom, I want to add scriptures or quotes that anchor me so I can reference them and LiLa can weave them in naturally.
- As a mom, I want to write my vision for my life and family so there's a north star LiLa can help me navigate toward.
- As a dad, I want my own Guiding Stars so my AI interactions reflect my values, not just my wife's.
- As an independent teen, I want to start defining who I'm choosing to be so the AI treats me as someone with my own identity.

### Guiding Stars — Visibility & Reminders
- As a mom, I want my Guiding Stars to rotate through a dashboard widget so I'm regularly reminded of what I've declared.
- As a mom, I want to archive a Guiding Star I've outgrown without deleting it, because it was part of my journey.
- As a mom, I want to see my teen's Guiding Stars so I can understand their emerging values (unless I've granted them private entries).

### Best Intentions — Creating & Managing
- As a mom, I want to quickly add an intention so capturing it doesn't interrupt my flow.
- As a mom, I want to toggle intentions active or inactive so I can focus on what matters right now without losing intentions I'll return to later.
- As a mom, I want to choose how I visually track each intention — counter, bar graph, or streak — so it feels meaningful to me.
- As a dad, I want my own Best Intentions so the AI knows what I'm working on personally.

### Best Intentions — Daily Interaction
- As a mom, I want to tap a checkmark on an intention when I do it so I get a moment of celebration.
- As a mom, I want to tap the checkmark multiple times per day because some intentions happen more than once.
- As a mom, I want each tap to trigger a small confetti celebration so it feels rewarding.
- As a mom, I want my daily taps logged to Victory Recorder so my consistency is celebrated over time.
- As a mom, I want my active intentions to rotate through dashboard widgets and morning/evening review so I don't forget them.

### AI Integration
- As a mom, I want LiLa to reference my Guiding Stars naturally when they're relevant, not mechanically list them.
- As a mom, I want LiLa to surface relevant Best Intentions when I'm discussing a topic they relate to.
- As a mom, I want Victory Recorder to notice when my accomplishments connect to my Guiding Stars and celebrate that thread.
- As a mom, I want to control which Guiding Stars and Best Intentions LiLa can see using the standard context toggle system.

---

## Screens

### Screen 1: Guiding Stars Main Page

**What the user sees:**
- Page title: "Guiding Stars"
- Contextual subtitle (muted): "Who you are choosing to be."
- Entries grouped by type, each group collapsible:
  - **Values** — core character values (integrity, patience, courage, creativity, etc.)
  - **Declarations** — honest commitments about who you are choosing to become
  - **Scriptures & Quotes** — anchoring texts from any tradition or source
  - **Vision** — what you want your life to look like

> **Decision rationale:** Faith Foundations was removed as a Guiding Stars entry type. The Archives Faith Preferences system (FaithAware Addendum) handles faith configuration at the system level. Guiding Stars entries may reference faith content (e.g., a declaration about relationship with God), but faith is not a separate category here. This avoids duplication with Archives.
- Each entry displayed as a card with:
  - The text of the entry
  - Small type indicator tag (value, declaration, etc.)
  - `is_included_in_ai` checkbox (tooltip: "Included in LiLa conversations. Uncheck to exclude.")
  - Edit icon (inline editing)
  - Archive action (swipe or menu)
- "Select All / Deselect All" toggle per group for AI context inclusion
- Summary indicator at top: "Gleaning context from 12/15 stars" (per PRD-05 Addendum pattern)
- Floating action button with options:
  - "Write It Myself" — opens inline add form
  - "Craft with LiLa" — opens LiLa pre-primed for Guiding Stars crafting
  - "Extract from Content" — stub (wires to Knowledge Base / upload system in future PRD)
- "View Archived" toggle at bottom to show/hide archived entries

**Interactions:**
- Tap entry → expand for inline editing
- Long-press or drag → reorder within group
- Swipe left → archive option
- Tap "Craft with LiLa" → opens LiLa drawer (mom) or modal (other roles) with the Guiding Stars crafting system prompt loaded. This is NOT a guided mode — it's a pre-primed conversation context.
- Tap AI checkbox → optimistic toggle, syncs to server
- Tap archived entry → option to restore

**Data created/updated:**
- `guiding_stars` entries (CRUD)
- `is_included_in_ai` boolean per entry
- `archived_at` timestamp for soft deletes
- `sort_order` integer for user-controlled ordering

**Empty State:**
- Warm illustration or icon
- "Your Guiding Stars are the values, commitments, and vision that define who you're choosing to be. They help LiLa give you advice grounded in what matters most to you."
- Two buttons: "Write My First Star" and "Let LiLa Help Me Discover Mine"
- The "Let LiLa Help" button opens the crafting conversation (see AI Integration section)

### Screen 2: Best Intentions Main Page

**What the user sees:**
- Page title: "Best Intentions"
- Contextual subtitle (muted): "What you're actively practicing."
- Two sections:
  - **Active Intentions** — shown prominently, each as a card
  - **Resting Intentions** — collapsed section for inactive intentions (toggled off but not archived)
- Each active intention card shows:
  - Intention title text
  - Tap-to-celebrate checkmark button (prominent, inviting)
  - Today's iteration count (small badge: "×3 today")
  - Tracker visualization (user's chosen format — counter, bar graph, or streak)
  - `is_included_in_ai` checkbox
  - Optional: related family member tags (shown as small avatars or name chips)
  - Edit / Archive menu
- Each resting intention card shows:
  - Intention title (muted styling)
  - Toggle to reactivate
  - Edit / Archive menu
- Floating action button: "Add Intention" — opens quick add form
- Summary indicator: "LiLa is aware of 8/12 intentions"

**Quick Add Form (inline or bottom sheet):**
- Title field (required) — "What do you want to be more mindful of?"
- Description field (optional) — for additional context
- Related family members (optional) — multi-select from family
- Tags (optional) — freeform text tags for LiLa context filtering
- Tracker style picker: Counter | Bar Graph | Streak
- Active toggle (default: on)
- Save button

**Interactions:**
- Tap checkmark → confetti animation fires, iteration count increments, entry pulses briefly. If this is the first tap of the day for this intention, Victory Recorder creates a pending daily log entry. Subsequent taps increment the count on the existing entry.
- Tap checkmark again → confetti fires again (smaller/different each time to stay delightful), count increments. No limit on daily taps.
- Tap active/inactive toggle → moves card between Active and Resting sections with animation
- Tap tracker visualization → expands to show fuller view (weekly bar chart, streak calendar, cumulative counter)
- Long-press or drag → reorder within Active section

**Data created/updated:**
- `best_intentions` entries (CRUD)
- `intention_iterations` entries (one per tap, timestamped)
- Victory Recorder daily summary (batched at end of day or on-demand)

**Empty State:**
- "Best Intentions are the things you want to be more mindful of — not goals to complete, but ways of being you want to practice. Add one and start celebrating every time you live it."
- Button: "Add My First Intention"

### Screen 3: Guiding Stars & Best Intentions Dashboard Widget

**What the user sees (Guiding Stars widget):**
- Compact card that rotates through active, AI-included Guiding Stars entries
- Shows one entry at a time with smooth transition animation
- Entry type tag shown (value, declaration, etc.)
- Rotation interval: configurable (default every 30 seconds, or on widget tap)
- Tap widget → navigates to Guiding Stars main page

**What the user sees (Best Intentions widget):**
- Compact card showing 1-3 active Best Intentions (configurable)
- Each shows: title + tap-to-celebrate checkmark + today's count
- Tap checkmark → same confetti/count behavior as main page
- Intentions rotate to show different active ones over time (not all at once unless user has ≤3)
- Tap widget title → navigates to Best Intentions main page

**Note:** These are dashboard widget configurations defined here. The actual widget rendering infrastructure is in PRD-10 (Widgets). This PRD defines the data and behavior; PRD-10 defines the container.

### Screen 4: Morning/Evening Review Integration

**Best Intentions in Morning Rhythm:**
- Section showing 2-3 active intentions selected for today's focus
- Selection can be random rotation, priority-weighted, or user-pinned
- Each shows title + checkmark for immediate celebration
- Framing: "Today, remember to..."

**Best Intentions in Evening Review:**
- Section showing today's intention activity
- Each active intention shows: title + today's iteration count
- Intentions with 0 taps shown gently (not as failures): "Didn't get to this one today — that's okay. Tomorrow's a new day."
- Intentions with taps shown with celebration: "You practiced [title] ×3 today!"
- Daily summary auto-logged to Victory Recorder

**Guiding Stars in Morning Rhythm:**
- One rotating Guiding Star shown as an anchoring reminder
- Framing: "Remember who you are..."

**Guiding Stars in Evening Review:**
- Victory Recorder's daily celebration may reference threads connecting accomplishments to Guiding Stars (see AI Integration section)

**Note:** Morning Rhythm and Evening Review are future features. This PRD defines the data contracts and behavioral expectations; the review features will consume them.

---

## Visibility & Permissions

| Role | Guiding Stars Access | Best Intentions Access | Notes |
|------|---------------------|----------------------|-------|
| Mom / Primary Parent | Full CRUD on own entries. Can view teen entries. Can view family-level entries. | Full CRUD on own entries. Can view teen entries. | Mom sees teen entries by default. Mom controls whether teens can create private entries. |
| Dad / Additional Adult | Full CRUD on own entries. Cannot see mom's unless she shares. Can view family-level entries. | Full CRUD on own entries. Cannot see mom's unless she shares. | Dad's entries are private by default. Can share specific entries with mom via toggle. |
| Special Adult | None | None | Special Adults do not have Guiding Stars or Best Intentions. |
| Independent (Teen) | Full CRUD on own entries. Entries visible to mom by default. If mom grants private entry permission, teen can mark entries private. | Full CRUD on own entries. Same visibility rules as Guiding Stars. | Teen sees a permissions indicator showing what mom can/can't see. |
| Guided / Play | Stubbed — future design decision | None | Light version for Guided children to be designed later. Play children do not interact with this feature. |

> **Forward note:** Guided children's Guiding Stars is constrained to a stub now because the right UX for young children declaring identity values requires dedicated design attention. The data model supports it (same table, same RLS); only the UI and age-appropriate interaction pattern need design.

### Shell Behavior

- **Mom shell:** Full Guiding Stars page and Best Intentions page in sidebar. Dashboard widgets for both. LiLa context integration active.
- **Adult shell:** Same pages if feature access granted by mom. Own entries only (plus family-level Guiding Stars). Dashboard widgets.
- **Independent shell:** Own Guiding Stars and Best Intentions pages. Simplified layout. Dashboard widgets if available in teen dashboard.
- **Guided shell:** Stubbed. Placeholder nav item that shows "Coming soon" or is hidden based on build status.
- **Play shell:** Feature not present.

### Privacy & Transparency

- **Teen privacy indicator:** On the Guiding Stars and Best Intentions pages in the Independent shell, a small icon or badge shows the current visibility status: "Mom can see your entries" or "You have private entries enabled." Tapping this navigates to the permissions section in Settings.
- **Dad sharing:** Each entry has a "Share with [partner name]" toggle. When shared, the entry appears in the partner's LiLa context and is visible on the partner's Context Settings screen. Unsharing removes it.
- **Family-level entries:** Visible to all adults. Editable only by mom. Created via LifeLantern Family Vision flow (stubbed in this PRD).

---

## Data Schema

### Table: `guiding_stars`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| owner_type | TEXT | 'member' | NOT NULL | Enum: 'member', 'family'. 'family' = family-level entry created via LifeLantern. |
| owner_member_id | UUID | | NULL | FK → family_members. NULL when owner_type = 'family'. NOT NULL when owner_type = 'member'. |
| entry_type | TEXT | | NOT NULL | Enum: 'value', 'declaration', 'scripture_quote', 'vision' |
| title | TEXT | | NULL | Optional short title (for display in widgets and rotation). Auto-generated from content if not provided. |
| content | TEXT | | NOT NULL | The full text of the entry |
| category | TEXT | | NULL | Optional user-created grouping tag |
| source | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'lila_crafted', 'content_extraction', 'lifelantern', 'hatch_routed', 'review_route'. Tracks how entry was created. |
| source_reference_id | UUID | | NULL | FK → source record (e.g., LiLa conversation ID, uploaded content ID). For traceability. |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Standard context toggle. PRD-05 Addendum pattern. |
| is_private | BOOLEAN | false | NOT NULL | For teen entries: if true, mom cannot see this entry. Only functional when mom has enabled private entries for this teen. |
| is_shared_with_partner | BOOLEAN | false | NOT NULL | For dad/adult entries: if true, partner can see this entry in their context. |
| sort_order | INTEGER | 0 | NOT NULL | User-controlled ordering within entry_type group |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete. Non-null = archived. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- Members can CRUD their own entries (where `owner_member_id` = auth user's member ID)
- Mom can SELECT teen entries (where teen's `is_private` = false OR mom has not enabled private entries for that teen)
- All adults can SELECT family-level entries (where `owner_type` = 'family')
- Only mom can INSERT/UPDATE/DELETE family-level entries
- Partner can SELECT entries where `is_shared_with_partner` = true

**Indexes:**
- `family_id, owner_member_id, archived_at` (active entries per member)
- `family_id, owner_type, archived_at` (family-level entries)
- `family_id, owner_member_id, entry_type, archived_at` (entries by type)
- `family_id, is_included_in_ai, archived_at` (context assembly query)

**Trigger:**
```sql
CREATE TRIGGER set_updated_at BEFORE UPDATE ON guiding_stars
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Table: `best_intentions`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| owner_member_id | UUID | | NOT NULL | FK → family_members. Best Intentions are always personal (no family-level). |
| title | TEXT | | NOT NULL | The intention statement. "Give my kids more opportunities to have experiences with the Spirit." |
| description | TEXT | | NULL | Optional additional context for AI. |
| source | TEXT | 'manual' | NOT NULL | Enum: 'manual', 'lila_crafted', 'hatch_routed', 'review_route'. Tracks how entry was created. |
| source_reference_id | UUID | | NULL | FK → source record (e.g., LiLa conversation ID, notepad tab ID). For traceability. |
| related_member_ids | UUID[] | | NULL | FK[] → family_members. Members this intention relates to (e.g., specific child). |
| tags | TEXT[] | | NULL | Freeform tags for LiLa context filtering. |
| tracker_style | TEXT | 'counter' | NOT NULL | Enum: 'counter', 'bar_graph', 'streak'. User picks; changeable anytime. |
| is_active | BOOLEAN | true | NOT NULL | Active = shows in widgets/reviews/rotation. Inactive = resting, not shown, not in AI context. |
| is_included_in_ai | BOOLEAN | true | NOT NULL | Standard context toggle. PRD-05 Addendum pattern. Only relevant when is_active = true. |
| is_private | BOOLEAN | false | NOT NULL | Same pattern as guiding_stars: for teen entries when mom has granted private entry permission. |
| is_shared_with_partner | BOOLEAN | false | NOT NULL | Same pattern as guiding_stars. |
| sort_order | INTEGER | 0 | NOT NULL | User-controlled ordering within Active section |
| archived_at | TIMESTAMPTZ | | NULL | Soft delete. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Same patterns as `guiding_stars` (own entries, mom sees teen non-private, partner sees shared).

**Indexes:**
- `family_id, owner_member_id, is_active, archived_at` (active intentions per member)
- `family_id, is_included_in_ai, is_active, archived_at` (context assembly)
- `owner_member_id, related_member_ids` (GIN index for related member filtering)

**Trigger:**
```sql
CREATE TRIGGER set_updated_at BEFORE UPDATE ON best_intentions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Table: `intention_iterations`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| intention_id | UUID | | NOT NULL | FK → best_intentions |
| family_id | UUID | | NOT NULL | FK → families (denormalized for RLS) |
| member_id | UUID | | NOT NULL | FK → family_members (denormalized for RLS) |
| recorded_at | TIMESTAMPTZ | now() | NOT NULL | When the tap happened |
| day_date | DATE | CURRENT_DATE | NOT NULL | Denormalized date for daily aggregation queries |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Members can INSERT and SELECT their own iterations. Mom can SELECT teen iterations.

**Indexes:**
- `intention_id, day_date` (daily count query: "how many times today?")
- `member_id, day_date` (all iterations for a member today — for evening review)
- `intention_id, recorded_at` (time-series for bar graph visualization)

**Note:** No UPDATE or DELETE on iterations. Once recorded, a tap is permanent. This preserves data integrity for Victory Recorder logs and tracker visualizations.

### Enum/Type Updates

Add to any existing source/context enums:
- `guiding_star` as a context source type in LiLa context assembly
- `best_intention` as a context source type in LiLa context assembly
- `intention_celebration` as a victory type in Victory Recorder (to be defined in PRD-11)

---

## Flows

### Incoming Flows (How Data Gets INTO These Features)

| Source | How It Works |
|--------|-------------|
| Direct entry (manual) | User types entry on Guiding Stars or Best Intentions page |
| LiLa conversation (craft with LiLa) | User opens LiLa pre-primed for Guiding Stars crafting. LiLa interviews, shapes declaration language, user confirms → entry saved to `guiding_stars` with `source = 'lila_crafted'` |
| Content extraction (stub) | Future: user uploads content, AI extracts candidate entries → user confirms → saved with `source = 'content_extraction'` |
| LifeLantern Family Vision (stub) | Future: Family Vision Quest generates suggested family Guiding Stars → mom confirms → saved with `owner_type = 'family'`, `source = 'lifelantern'` |
| LiLa context learning (PRD-05C) | During any LiLa conversation, context learning detects intention-like language ("I want to...", "I wish I would...") → offers to save as Best Intention. User confirms → saved with `source = 'lila_crafted'` |
| Review & Route / MindSweep (stub) | Future: Smart Notepad Review & Route detects Guiding Star or Best Intention content → offers routing → user confirms |
| Smart Notepad "Send To" routing (PRD-08) | User selects "Send to... → Guiding Stars" or "Send to... → Best Intentions" from Notepad Send To grid. Creates entry with `source = 'hatch_routed'`, `source_reference_id` = notepad tab ID. |

### Outgoing Flows (How These Features Feed Others)

| Destination | How It Works |
|-------------|-------------|
| LiLa context assembly | Active, `is_included_in_ai = true` Guiding Stars loaded as baseline identity context. Active, included Best Intentions loaded when topically relevant (filtered by `related_member_ids` and `tags`). |
| LiLa Optimizer (PRD-05C) | Optimizer's context presets pull relevant Best Intentions by tag. "Spiritual Questions" preset pulls faith-tagged intentions. "Homework Help" pulls learning-tagged intentions. Guiding Stars values always included as baseline. |
| Victory Recorder (PRD-11) | Daily intention iteration summaries logged as victories. Victory celebration text checks Guiding Stars for thread connections. |
| Dashboard widgets (PRD-10) | Guiding Stars rotation widget. Best Intentions celebration widget. Both defined behaviorally here; container in PRD-10. |
| Morning Rhythm / Evening Review (future) | Morning: rotating Guiding Star + 2-3 focus intentions. Evening: today's iteration summary + Guiding Star thread celebration. |
| LifeLantern (PRD-12) | LifeLantern's vision casting can reference existing Guiding Stars. Goal generation can reference Best Intentions. Family Vision flow creates family-level Guiding Stars. |
| Tasks (PRD-09A) | Tasks can carry a `related_intention_id` (FK → `best_intentions`) to link a task to a specific Best Intention. Enables: "I set an intention to 'foster sibling collaboration' and created a task 'Mosiah helps Jake with science project' linked to that intention." LiLa can suggest these connections during task creation. |

---

## AI Integration

### No Guided Mode Registered

Guiding Stars and Best Intentions do NOT register in the LiLa guided mode registry. They are context sources, not conversation modes. There is no "Guiding Stars mode" in the drawer.

> **Decision rationale:** These features produce data LiLa reads, not tools LiLa operates. The "Craft with LiLa" flow is a pre-primed conversation, not a registered guided mode — keeping the registry clean for true interactive modes.

### Craft with LiLa — Pre-Primed Conversation

When a user taps "Craft with LiLa" on the Guiding Stars page, LiLa opens with a specialized system prompt addition (not a guided mode — just augmented context for the current conversation). The conversation flow:

1. LiLa asks about the area of life the user wants to articulate (values, commitments, vision, anchoring texts)
2. For declarations specifically, LiLa coaches toward honest commitment language (see Declaration Language section below)
3. LiLa helps shape the user's thoughts into clear, resonant language
4. LiLa presents the crafted text and asks the user to confirm
5. On confirmation, the entry is saved to `guiding_stars` with `source = 'lila_crafted'` and `source_reference_id` pointing to the conversation

For a first-time user with an empty Guiding Stars page, the "Let LiLa Help Me Discover Mine" flow is more expansive — LiLa walks through a discovery interview:
- "What qualities do you most admire? What do you want to be known for?"
- "What kind of home and family life do you envision?"
- "Are there any quotes, scriptures, or principles that anchor you?"
- "What commitments are you ready to make about who you're choosing to become?"

LiLa shapes responses into candidate entries, presents them grouped by type, and the user confirms which to save. LiLa sets expectations: "This is a starting point. Your Guiding Stars will grow and deepen as you use MyAIM."

### Declaration Language Rules

**The core principle:** Declarations are honest commitments about who you are CHOOSING to become or what you are STEPPING INTO. They are not affirmations that claim a finished state you haven't reached. The distinction is subtle but psychologically significant — honest commitment language gives the brain something true to build on, activating the reticular activating system to seek proof and create alignment. Dishonest affirmations create cognitive dissonance.

**Approved opening patterns for AI-crafted declarations:**

Process commitments (things you are actively choosing):
- "I am choosing to..."
- "I am learning to..."
- "I am striving to..."
- "I am leaning into..."
- "I am taking steps to..."
- "I am committed to becoming someone who..."
- "I am working to cultivate..."

Identity claims you can step into immediately (true the moment you declare them):
- "I am a seeker of deeper truths..." (you become this by seeking)
- "I do hard things until hard things become easy." (true the moment you decide it)
- "I carry dignity with calm strength." (a choice you make right now)
- "I hold fast to hope." (an active decision)
- "I am a dearly beloved daughter/son of..." (a belief you choose to claim)

**The test:** Can this be true RIGHT NOW, the moment you say it? If the truth depends on a future state ("I am thin," "I am rich," "I am patient"), it's an affirmation that may feel dishonest. If the truth is in the choosing itself ("I am choosing to fuel my body with nutrients," "I am taking steps to become a wise financial steward," "I choose courage over comfort"), it's an honest commitment.

**LiLa's coaching behavior:**
- When crafting declarations, LiLa guides toward these patterns and explains the psychology briefly (one sentence, not a lecture)
- If a user manually types an affirmation-style statement ("I am patient"), LiLa does NOT block it — it gently suggests a reframe: "That's a great aspiration. Some people find it powerful to phrase it as a choice: 'I am choosing to respond with patience.' Would you like to adjust, or keep it as-is?"
- The user always has final say. LiLa coaches; it doesn't enforce.

### Context Assembly Behavior

**Guiding Stars in LiLa context:**
- All active (non-archived), `is_included_in_ai = true` entries for the current user are loaded as baseline context in every LiLa conversation
- Formatted in the system prompt as:

```
[User]'s Guiding Stars:

VALUES:
- [content]

DECLARATIONS:
- [content]

SCRIPTURES & QUOTES:
- [content]

VISION:
- [content]
```

- If total Guiding Stars text exceeds ~2000 tokens, include all entries but truncate very long individual entries with "[truncated — full text on Guiding Stars page]"
- LiLa references these naturally when relevant — never lists them or quotes them mechanically. Example: User says "I lost my patience with the kids" and Guiding Stars includes a declaration about patience → LiLa says "That's hard, especially when you've committed to responding with patience. What triggered it?"

**Best Intentions in LiLa context:**
- Active, `is_included_in_ai = true` intentions are loaded as topical context — NOT in every conversation, but when the conversation topic relates to them
- Matching logic: LiLa checks `related_member_ids` (if the conversation mentions a specific family member) and `tags` (keyword overlap with conversation topic)
- Formatted when included:

```
[User]'s Active Intentions (relevant to this conversation):
- "[title]" [related to: Jake, Mosiah]
- "[title]"
```

- LiLa weaves these in proactively but naturally. Example: User asks for homework help for Jake, and there's an intention about fostering sibling collaboration tagged to Jake and Mosiah → LiLa suggests a collaborative approach.

### Victory Recorder Thread Detection

When Victory Recorder creates a celebration (defined fully in PRD-11), it receives the day's accomplishments and the user's active Guiding Stars. The celebration generation prompt includes:

"Check if any of today's accomplishments demonstrate the user living by their Guiding Stars. If you find a genuine connection, weave it into the celebration naturally. Don't force connections — only highlight threads that are real and meaningful."

Example output: "You spent an hour helping Mosiah with his science project today — and you did it with patience and genuine curiosity. That's your 'I pursue wisdom like a hidden treasure' star shining through. Moments like these are what building a legacy looks like."

---

## Edge Cases

### Empty Guiding Stars
- LiLa functions without Guiding Stars but may gently suggest setting them up — maximum once per week, only in receptive contexts (not mid-task): "I notice you haven't set up any Guiding Stars yet. They help me give you advice grounded in what matters most to you. Want to set some up?"
- Dashboard widget shows empty state with invitation to create first entry.

### Empty Best Intentions
- LiLa functions without Best Intentions. No nagging.
- Dashboard widget shows empty state with invitation.

### Very Many Entries
- No hard limit on Guiding Stars entries, but practical guidance: LiLa's context window is finite. If a user has 50+ entries, the context assembly pipeline should prioritize by `sort_order` (user's top-ranked entries first) and truncate lower-ranked entries if token budget is exceeded.
- Best Intentions: no limit on total, but only `is_active = true` entries appear in widgets and rotation.

### Rapid Celebration Taps
- Debounce at the UI level: minimum 500ms between taps to prevent accidental double-counting.
- Each tap creates a separate `intention_iterations` record — no batching.
- Confetti animation varies slightly on rapid taps (scale, color, direction) to stay delightful.

### Archived Then Restored
- Restoring a Guiding Star (setting `archived_at` back to NULL) returns it to active display in its original `sort_order` position.
- Restoring a Best Intention also resets `is_active` to true.

### Best Intention Related Members
- If a related family member is removed from the family (leaves or is removed by mom), the `related_member_ids` array is cleaned up but the intention itself persists.
- If the intention was ONLY meaningful in relation to that member, the user can archive it.

### Concurrent Edits (Multi-Device)
- Last-write-wins for entry content edits.
- `intention_iterations` are append-only, so no conflict risk for celebration taps.

### Teen Private Entry Visibility
- When mom has NOT enabled private entries for a teen: `is_private` column is non-functional. All teen entries visible to mom. The UI does not show the privacy toggle to the teen.
- When mom HAS enabled private entries: teen sees a toggle on each entry. Private entries are excluded from mom's view via RLS. The teen's permissions page shows: "You can mark entries as private. Mom won't see private entries."
- Mom cannot retroactively view entries that were created while private mode was enabled, even if she later disables private mode. (Once created as private, stays private unless the teen manually un-privates it.)

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `guiding_stars_basic` | Personal Guiding Stars (manual entry only) | Essential |
| `guiding_stars_ai_craft` | Craft with LiLa (AI-assisted declaration writing) | Enhanced |
| `guiding_stars_family` | Family-level Guiding Stars (via LifeLantern) | Full Magic |
| `best_intentions` | Best Intentions with celebration tracking | Essential |
| `best_intentions_tracker_views` | Bar graph and streak visualizations (counter is always available) | Enhanced |

All keys return true during beta.

> **Tier rationale:** Core identity features (basic Guiding Stars, Best Intentions with counter) are Essential-tier — every mom deserves values-aware AI. AI-assisted crafting and richer visualizations are Enhanced because they require AI calls and add polish. Family-level Guiding Stars are Full Magic because they depend on LifeLantern's Family Vision Quest, which is a premium collaborative experience.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| "Extract from Content" input path for Guiding Stars | Knowledge Base / content upload system | TBD |
| Family-level Guiding Stars creation flow | LifeLantern Family Vision Quest | PRD-12 |
| Guided children's light Guiding Stars experience | Guided shell feature design | Future design decision |

> **Deferred:** Guided children's Guiding Stars experience — to be designed in a future design sprint after the core feature is validated with adults and teens. Stubbed intentionally; not an oversight.
| Dashboard widget containers for both features | Widgets infrastructure | PRD-10 |
| Morning Rhythm / Evening Review integration points | Morning/Evening Review system | Future PRD |
| Victory Recorder daily summary logging from intention iterations | Victory Recorder | PRD-11 |
| Victory Recorder Guiding Stars thread detection in celebrations | Victory Recorder AI celebration | PRD-11 |
| Review & Route detection of Guiding Star / Best Intention content | Smart Notepad Review & Route | PRD-08 |
| Best Intentions surfacing in Optimizer context presets | LiLa Optimizer preset filtering | PRD-05C (may already be defined) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| `guiding_stars` table referenced in LiLa context assembly | PRD-05, PRD-05 Addendum | Table fully defined with `is_included_in_ai`, context format specified |
| `best_intentions` table referenced in LiLa context assembly | PRD-05, PRD-05 Addendum | Table fully defined with `is_included_in_ai`, context format specified |
| Guiding Stars as context source in Optimizer | PRD-05C | Context assembly format and filtering behavior defined |
| Best Intentions keywords in Optimizer context presets | PRD-05C | Tags field on `best_intentions` enables preset filtering |
| LiLa context learning detects Best Intention language | PRD-05C | Detection triggers and save flow specified |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `guiding_stars` table created with all columns, RLS policies active
- [ ] `best_intentions` table created with all columns, RLS policies active
- [ ] `intention_iterations` table created, append-only, RLS active
- [ ] Guiding Stars page: display entries grouped by type, inline add, inline edit, archive/restore, reorder
- [ ] Best Intentions page: display active/resting sections, quick add form, active/inactive toggle
- [ ] Tap-to-celebrate: checkmark tap → confetti animation → iteration count increments → `intention_iterations` record created
- [ ] Multiple taps per day supported with debounce
- [ ] `is_included_in_ai` toggle on all entries, optimistic UI, server sync
- [ ] "Select All / Deselect All" per Guiding Stars entry type group
- [ ] Summary indicator: "Gleaning context from X/Y stars" and "LiLa is aware of X/Y intentions"
- [ ] Soft delete via `archived_at` on both tables
- [ ] RLS verified: mom sees own + teen non-private entries; dad sees own only; teen sees own only
- [ ] Empty states for both features with onboarding invitations
- [ ] Craft with LiLa: button opens LiLa with Guiding Stars crafting context loaded
- [ ] Declaration language coaching active in LiLa crafting flow
- [ ] LiLa context assembly loads Guiding Stars as baseline and Best Intentions as topical context
- [ ] Tracker style picker (counter, bar graph, streak) on Best Intentions — counter functional, other views functional

### MVP When Dependency Is Ready
- [ ] Dashboard widgets for both features (requires PRD-10 Widgets)
- [ ] Victory Recorder daily intention summary logging (requires PRD-11)
- [ ] Victory Recorder Guiding Stars thread detection in celebrations (requires PRD-11)
- [ ] Morning/Evening Review integration (requires future Review PRD)
- [ ] Family-level Guiding Stars creation via LifeLantern (requires PRD-12)
- [ ] Content extraction input path (requires Knowledge Base PRD)
- [ ] Review & Route detection of GS/BI content (requires PRD-08)

### Post-MVP
- [ ] AI near-duplicate detection across entries ("I notice two similar values about patience — want to consolidate?")
- [ ] AI misalignment reflection (when LiLa notices patterns misaligned with Guiding Stars — gentle, receptive contexts only)
- [ ] Guided children's light Guiding Stars experience
- [ ] Best Intentions sharing between partners (e.g., dad can see mom's shared intentions for coordinated parenting)
- [ ] Intention suggestion engine (LiLa proactively suggests new intentions based on conversation patterns)

---

## CLAUDE.md Additions from This PRD

- [ ] Guiding Stars entries always loaded in LiLa system prompt as baseline identity context — format specified in AI Integration section
- [ ] Best Intentions loaded as topical context when conversation topic matches `related_member_ids` or `tags` — never dumped wholesale
- [ ] Declaration language rules: honest commitment language, not hollow affirmations. Process commitments ("I am choosing to...") and immediate identity claims ("I do hard things..."). LiLa coaches toward these patterns, never blocks user's manual entries.
- [ ] Convention: `source` + `source_reference_id` tracking on `guiding_stars` and `best_intentions` entries for traceability. Entries from Smart Notepad routing use `source = 'hatch_routed'` with `source_reference_id` = notepad tab ID.
- [ ] Convention: `archived_at` soft delete (no hard deletes in user-facing features)
- [ ] Convention: `sort_order` integer for user-controlled ordering
- [ ] Convention: `intention_iterations` is append-only — no UPDATE or DELETE
- [ ] Convention: celebration tap debounce minimum 500ms
- [ ] Convention: empty feature gentle nudge maximum once per week, only in receptive contexts
- [ ] Victory Recorder must check Guiding Stars for thread connections when generating celebration text
- [ ] `owner_type` on `guiding_stars` distinguishes personal ('member') from family-level ('family') entries

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `guiding_stars`, `best_intentions`, `intention_iterations`
Enums updated: context source types (add `guiding_star`, `best_intention`), victory types (add `intention_celebration`)
Triggers added: `set_updated_at` on `guiding_stars`, `set_updated_at` on `best_intentions`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Best Intentions redesigned from structured goals to lightweight intentional reminders** | v1's current_state/desired_state/why_it_matters structure was too heavy for the organic, mindful-practice use case. Structured goal-setting deferred to LifeLantern (PRD-12). |
| 2 | **Faith Foundations removed as a Guiding Stars entry type** | Archives Faith Preferences system already handles faith configuration. Keeping it in Guiding Stars would duplicate data. Faith content can still appear in any entry type (e.g., a declaration about relationship with God). |
| 3 | **Best Intentions is a separate feature from Guiding Stars, not a 5th category** | Different data models (static declarations vs. tap-to-celebrate countable actions), different UI patterns, different interaction rhythms. Nesting BI inside GS would confuse both the UI and the schema. |
| 4 | **Family-level Guiding Stars exist in the data model but creation is stubbed** | The `owner_type = 'family'` column supports family-level entries, but the collaborative Family Vision creation flow belongs in LifeLantern (PRD-12). |
| 5 | **Brain Dump Coach dropped from this PRD** | Covered by LiLa context learning (PRD-05C) and Review & Route (PRD-08). No standalone conversational input needed. |
| 6 | **Tap-to-celebrate with optional target frequency** | Mom can optionally set a target ("3x per day") but it's not required. Purely accumulative celebration is the default. |
| 7 | **Tracker visualization is user-chosen per intention** | Counter (default), bar graph, or streak — switchable anytime. Counter is Essential tier; bar graph and streak are Enhanced. |
| 8 | **Declaration language coaching, not enforcement** | LiLa guides toward honest commitment language and explains the psychology, but never blocks a user's manual entry. User always has final say. |
| 9 | **Guiding Stars rotate in dashboard widgets** | Same rotational visibility pattern as Best Intentions — keeps declarations top-of-mind as regular reminders. |
| 10 | **Victory Recorder checks Guiding Stars for thread connections** | When generating celebrations, Victory Recorder looks for genuine threads between daily accomplishments and declared Guiding Stars. Only highlights real connections. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Guided children's light Guiding Stars experience | Future design sprint after core feature validated with adults/teens |
| 2 | Family-level Guiding Stars creation flow (Family Vision Quest) | PRD-12 (LifeLantern) |
| 3 | Content extraction input path ("Extract from Content") | Future Knowledge Base / upload system PRD |
| 4 | AI near-duplicate detection across entries | Post-MVP enhancement |
| 5 | AI misalignment reflection (noticing patterns misaligned with Guiding Stars) | Post-MVP — needs accumulated data from Journal, Tasks, conversations |
| 6 | Best Intentions sharing between partners | Post-MVP enhancement |
| 7 | Morning/Evening Review integration details | Future Review PRD |
| 8 | Best Intentions categories | Decided not to include formal categories. Freeform tags serve the LiLa context filtering need. May revisit if users request organization. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-05 (LiLa Core) | Guiding Stars context assembly format defined; Best Intentions topical loading logic defined | Update context assembly docs to reference PRD-06 format specs |
| PRD-05C (Optimizer) | Best Intentions tags field enables preset filtering; Guiding Stars values always in baseline context | Confirm Optimizer preset definitions reference these fields |
| PRD-10 (Widgets) | Two new widget types defined (GS rotation, BI celebration) | Widget infrastructure must support these card types |
| PRD-11 (Victory Recorder) | Daily intention iteration summary logging; Guiding Stars thread detection in celebrations | Victory Recorder must consume `intention_iterations` and query `guiding_stars` during celebration generation |
| PRD-12 (LifeLantern) | Family Vision Quest creates family-level Guiding Stars; structured goal-setting (from v1 Best Intentions) moves here | LifeLantern PRD must include Family Guiding Stars creation flow and structured goal patterns |
| PRD-08 (Journal + Smart Notepad) | Review & Route can detect and route to Guiding Stars and Best Intentions; Notepad Send To grid includes both as destinations | PRD-08 should include GS and BI in routing destination list |
| PRD-09A (Tasks) | Tasks can link to Best Intentions via `related_intention_id` FK | Tasks table must include `related_intention_id UUID NULL FK → best_intentions` column. LiLa can suggest connections during task creation. |

---

## Appendix: Declaration Language Examples

These examples illustrate the spectrum of honest commitment language. They are drawn from real curriculum and demonstrate the variety of forms that honest declarations can take.

**Process commitments — actively choosing:**
- "I am choosing to become someone who responds with patience."
- "When I feel anger rising, I will pause before I speak."
- "I am taking steps to become a wise financial steward."
- "I am choosing to fuel my body with nutrients."
- "I am committed to becoming someone my children feel safe with."

**Identity claims you step into immediately — true the moment you declare them:**
- "I am a seeker of deeper truths, attuned to the whispers hidden in story, in nature, and in the quiet corners of ordinary life."
- "I am lit by the flame of curiosity, eager to ask, seek, and explore."
- "I wear responsibility as a mark of strength and trust."
- "I hold fast to hope, a light that endures even when shadows fall."
- "I choose courage over comfort, knowing that brave hearts change the world."
- "I do hard things until hard things become easy."
- "I am a dearly beloved daughter of Heavenly Parents who love me."
- "I am redeemed. I am deeply known and deeply beloved."
- "Legacy is the quiet story my life tells. I plant seeds for trees I may never sit beneath."

**The test for any declaration:** Can this be true RIGHT NOW? Not in a future state — right now, in the moment of declaring it. If yes, it's an honest commitment. If it requires a future reality that hasn't happened yet, it's an affirmation that may create cognitive dissonance rather than alignment.

---

*End of PRD-06*
