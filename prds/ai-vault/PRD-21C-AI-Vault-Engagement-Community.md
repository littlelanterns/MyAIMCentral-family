> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-21C: AI Vault — Engagement & Community

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup — user identity, subscription tiers), PRD-02 (Permissions & Access Control — `staff_permissions`, PermissionGate, Feature Key Registry), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts — sidebar nav, admin route separation), PRD-05 (LiLa Core AI System — Haiku gate pattern, context assembly), PRD-11 (Victory Recorder — external victory source pattern), PRD-15 (Messages, Requests & Notifications — notification infrastructure, notification preferences), PRD-20 (Safe Harbor — safety screening principles), PRD-21 (Communication & Relationship Tools — AI Toolbox, `lila_tool_permissions`), PRD-21A (AI Vault — Browse & Content Delivery — all 12 user-facing tables, content type taxonomy, content cards, detail views, `vault_user_bookmarks`, `vault_user_progress`, `vault_tool_sessions`, `vault_copy_events`, `user_saved_prompts`), PRD-21B (AI Vault — Admin Content Management — Admin Console Shell, tab registry, Moderation tab stub, analytics section per item), PRD-22 (Settings — notification preferences, analytics opt-in)
**Created:** March 15, 2026
**Last Updated:** March 15, 2026

---

## Overview

PRD-21A built the storefront — the Netflix-style browse where moms discover content. PRD-21B built the backstage — how content gets created and managed. PRD-21C adds the human layer: the hearts, the conversations, the "me too" moments, the gentle indicators that say "other moms found this helpful" and "you've already been here." This is what makes the AI Vault a learning community instead of a static catalog.

The engagement layer serves three purposes. First, it gives moms social proof — a heart count on a tutorial tells them other moms validated this content before they invest their time. Second, it gives users conversation space on content items — a place to ask questions about a tutorial, share how they adapted a prompt for their family, or help another mom who's stuck. Third, it gives the admin (Tenise) rich internal analytics: which content resonates, which frustrates, who's contributing the most to discussions, and where the catalog needs attention.

The community philosophy is "warm library," not social network. There are no user profiles, no follower counts, no public activity feeds, no leaderboards. Moms see each other's display names in discussion threads and heart counts on cards. That's the extent of the social surface. The depth lives in the conversations attached to content items, where moms help each other learn. Everything else — top contributor analytics, satisfaction signals, engagement rankings — lives behind the admin wall.

> **Mom experience goal:** The Vault should feel like a well-stocked library where someone has helpfully placed "other readers loved this" cards on the shelves, and there's a cozy reading nook where moms are quietly sharing notes and helping each other. Not a social media feed. Not a comment section. A learning community.

---

## User Stories

### Engagement
- As a mom, I want to heart content I find valuable so other moms know what's worth their time.
- As a mom, I want to bookmark content for later so I can save things without publicly endorsing them.
- As a mom, I want to see heart counts on content cards so I can quickly find what's most helpful.
- As a mom, I want a "Was this helpful?" prompt after using a tool so I can give quick feedback without writing a review.

### Discussions
- As a mom, I want to ask a question about a tutorial in a comment thread so I can get help without leaving the content.
- As a mom, I want to share how I adapted a prompt for my family so other moms can learn from my experience.
- As a mom, I want to reply to another mom's question so I can help her the way someone helped me.
- As a mom, I want to report a comment that feels off so the community stays supportive.

### Progress & History
- As a mom, I want to see which Vault items I've already viewed so I don't accidentally re-open content thinking it's new.
- As a mom, I want to sort my Vault history by most-used so I can quickly find my go-to tools.
- As a mom, I want my tutorial completions to be offered as Victory Recorder entries so my learning journey is celebrated.

### Sharing & Assignment
- As a mom, I want to share a Vault item externally with a friend by copying a formatted message that points to our landing page.
- As a mom, I want to assign a LiLa-customized prompt or skill to a family member's AI Toolbox so they get the personalized version, not the generic one.

### Recommendations
- As a mom, I want to see what I recently viewed so I can quickly get back to something.
- As a mom, I want "Popular in [Category]" suggestions so I can find what other moms love in areas I'm browsing.
- As a mom, I want "Because You Liked [X]" suggestions so I discover related content I wouldn't have found on my own.
- As a mom, I want "New Since Your Last Visit" highlighted so I don't miss fresh content.

### Admin (Internal)
- As an admin, I want to see per-item engagement metrics (views, hearts, bookmarks, sessions, satisfaction scores) so I can make data-driven content decisions.
- As an admin, I want to see which users contribute the most helpful discussion content so I know who my community champions are.
- As an admin, I want to see satisfaction trends (thumbs up vs. thumbs down ratio) per item so I can identify content that frustrates users and fix or remove it.
- As an admin, I want a moderation queue for flagged and reported comments so I can keep the community safe.
- As an admin, I want configurable content policy rules for the auto-moderation system so I can adjust screening sensitivity without code deploys.

---

## Screens

### Screen 1: Engagement Elements on Content Cards (PRD-21A Enhancement)

> **Depends on:** PRD-21A Screen 1 (Vault Browse Page) — content cards in category rows. PRD-03 design system for icon and badge styling.

PRD-21A defined content cards in horizontal-scrolling category rows. PRD-21C adds engagement indicators to those cards.

**What the user sees on each content card:**

```
┌─────────────────────┐
│  [thumbnail image]   │
│                      │
│  Display Title       │
│  Short description   │
│                      │
│  ♡ 47   [viewed ✓]  │
│  [NEW]  ★ Beginner  │
└─────────────────────┘
```

- **Heart count:** Heart icon with count. Displayed only when the item has 5 or more hearts. Below 5 hearts, only the heart icon appears with no number (avoids the "lonely 1 heart" problem during early growth). If the current user has hearted this item, the heart icon renders as filled/active.
- **Viewed indicator:** A subtle checkmark or "viewed" dot appears on cards for items the user has previously opened. Not prominent — a small visual cue, not a badge.
- **In-progress indicator:** For items with `progress_status = 'in_progress'`, a small progress bar or percentage replaces the viewed indicator.
- **Completed indicator:** For items with `progress_status = 'completed'`, a small completion checkmark (distinct from the "viewed" indicator — filled vs. outline, or different color).

> **Decision rationale:** The heart count threshold of 5 solves the cold-start embarrassment problem. Early in the platform's life, hearts accumulate invisibly. Once an item crosses 5, the social proof appears. The threshold is admin-configurable in `vault_engagement_config` so it can be lowered as the user base grows.

**Data read:**
- `vault_engagement` for heart count and user's own heart state
- `vault_user_progress` for viewed/in-progress/completed state

### Screen 2: Engagement Elements on Content Detail View (PRD-21A Enhancement)

> **Depends on:** PRD-21A Screen 2 (Content Detail View) — the modal/full-screen view that opens when a card is tapped.

PRD-21A defined the detail view action bar as: [Bookmark] [Optimize with LiLa] [+ Add to AI Toolbox]. PRD-21C extends this view with engagement components.

**What the user sees (additions to existing detail view):**

**Engagement bar (below the action bar):**

```
┌──────────────────────────────────────────┐
│  ♡ Heart (47)  |  💬 Discussion (12)     │
│                |  Share ↗                │
└──────────────────────────────────────────┘
```

- **Heart button:** Toggle. Tapping hearts the item (optimistic UI — count updates instantly, reverts on error). If already hearted, tapping un-hearts.
- **Discussion count:** Shows total approved comment count. Tapping scrolls to the Discussion section below.
- **Share button:** Opens a share action sheet (Screen 4).

**"Was this helpful?" prompt (conditional):**

After the user has spent meaningful time with the content (≥60 seconds on a tutorial, or after closing a tool session), a subtle inline prompt appears:

```
┌──────────────────────────────────────────┐
│  Was this helpful?   [👍 Yes]  [👎 No]   │
└──────────────────────────────────────────┘
```

- Binary response. One tap, done. The prompt disappears after response.
- Stored in `vault_satisfaction_signals` — admin-only analytics, never shown to other users.
- The prompt appears at most once per user per item. If they've already responded, it doesn't show again.
- The prompt is dismissible (tap anywhere outside it or wait — it auto-fades after 10 seconds if ignored).

> **Decision rationale:** The satisfaction signal serves a different purpose than hearts. Hearts say "I like this." Satisfaction says "this worked for me." An item with lots of hearts but a poor satisfaction ratio tells admin the marketing/hook is great but the content disappoints. An item with few hearts but high satisfaction is a hidden gem that needs better positioning.

**Discussion section (below content):**

See Screen 3.

**Data created/updated:**
- `vault_engagement`: inserts/deletes on heart toggle
- `vault_satisfaction_signals`: inserts on thumbs up/down
- Denormalized `heart_count` on `vault_items` updated via database trigger

### Screen 3: Discussion Thread (Per-Item)

> **Depends on:** PRD-21A Screen 2 detail view (discussions render below content). PRD-03 design system for comment thread styling.

Threaded discussions attached to each Vault item. Mom-only — only the Primary Parent can see and participate in discussions. Other family members who may have Vault browse access (dad with `vault_browse` permission, teens with filtered browse) do not see the discussion section.

**What the user sees:**

```
┌──────────────────────────────────────────┐
│  Discussion (12 comments)                │
│  ──────────────────────────────────────  │
│  Community Guidelines:                   │
│  Be kind. Be helpful. Share what works   │
│  for your family.                        │
│  ──────────────────────────────────────  │
│                                          │
│  [Write a comment...]              [Post]│
│  ──────────────────────────────────────  │
│                                          │
│  Sarah M.  •  2 hours ago               │
│  This was so helpful! I used the meal    │
│  planning prompt and modified it for     │
│  my family's dietary needs.              │
│  [Reply]  [Report]                       │
│                                          │
│    ↳ Jennifer K.  •  1 hour ago         │
│      What modifications did you make?    │
│      I'm trying to do the same.         │
│      [Reply]  [Report]                   │
│                                          │
│  Rachel T.  •  5 hours ago              │
│  Quick question — does the "Optimize    │
│  with LiLa" work for this one? I want   │
│  to personalize it for my 8-year-old.   │
│  [Reply]  [Report]                       │
│                                          │
│  [Load more comments]                    │
└──────────────────────────────────────────┘
```

**Comment display:**
- Author's display name (from their Settings profile — no clickable profile page)
- Timestamp (relative: "2 hours ago", "yesterday", "March 10")
- Comment text (plain text, no rich formatting, no links)
- Action buttons: [Reply] and [Report]
- If the comment is the current user's: [Edit] and [Delete] replace [Report]

**Threading:**
- Top-level comments are direct children of the Vault item
- Replies nest under their parent with visual indentation
- Maximum nesting depth: 3 levels. At depth 3, "Reply" still works but the reply appears at depth 3 (no further indentation) with an "@[parent author]" prefix
- Sort order: Newest first (default). "Oldest first" toggle available.

**Community guidelines:**
- Displayed above the comment form as subtle, non-intrusive text
- Text: "Be kind. Be helpful. Share what works for your family."
- Not dismissible — always present as a gentle reminder

**Comment submission flow:**
1. Mom types comment in the text field
2. Taps [Post]
3. Comment is sent to the server-side moderation pipeline (see AI Integration section)
4. If approved: comment appears immediately in the thread
5. If flagged: mom sees "Your comment is being reviewed and will appear shortly" — comment is held in admin moderation queue
6. If rejected: mom sees "Your comment couldn't be posted — it may contain content outside our community guidelines. Try rephrasing?"

**Interactions:**
- Tap [Reply] → opens an inline reply form nested under the comment
- Tap [Report] → opens Screen 5 (Report Modal)
- Tap [Edit] → replaces comment text with editable text field, [Save] and [Cancel] buttons
- Tap [Delete] → confirmation dialog: "Remove your comment? This can't be undone." → soft delete (sets `moderation_status = 'deleted'`, content hidden from all views)
- Tap [Load more comments] → loads next batch (10 per batch)

**Empty state:**
- "No comments yet. Be the first to share your experience!"
- The comment form is visible even in the empty state

**Data created/updated:**
- `vault_comments`: insert on post, update on edit, status change on delete
- `vault_comment_reports`: insert on report
- `vault_moderation_log`: insert on auto-moderation actions

### Screen 4: Share Action Sheet

When a user taps the Share button on a content detail view:

**What the user sees:**

```
┌──────────────────────────────────────────┐
│  Share                              [×]  │
│  ──────────────────────────────────────  │
│                                          │
│  [ + Add to Family Member's Toolbox ]    │
│                                          │
│  [ Share from My Prompts ]               │
│    (if user has saved prompts for this)  │
│                                          │
│  [ Copy to Share Externally ]            │
│    Copies a message to your clipboard    │
│                                          │
└──────────────────────────────────────────┘
```

**"+ Add to Family Member's Toolbox":**
- Opens the existing Member Assignment Modal (PRD-21A Screen 4)
- Assigns the original Vault item to the selected member's AI Toolbox
- Creates a `lila_tool_permissions` record with `source = 'vault'` and `vault_item_id`

**"Share from My Prompts":**
- Only visible if the user has entries in `user_saved_prompts` linked to this Vault item (via `source_vault_item_id`)
- Opens a picker showing saved prompts for this item (both as-is copies and LiLa-optimized versions)
- User selects a saved prompt → member picker opens → creates a `lila_tool_permissions` record with `source = 'saved_prompt'` and `saved_prompt_id`
- The family member sees the personalized prompt in their Toolbox, not the generic Vault version

> **Decision rationale:** This is the "mom customizes with LiLa, then sends the personalized version to her kid" flow. Mom is the curator and personalizer. Family members receive ready-to-use tools without needing Optimize with LiLa access themselves. The same pattern applies to skills — mom deploys a LiLa-customized skill and assigns it via Toolbox.

**"Copy to Share Externally":**
- Copies a formatted message to the clipboard:
  `"[User's Display Name] found this [content type label] useful and thought of you! Find out more at [landing page URL]"`
- Toast confirmation: "Copied! Share it anywhere."
- The URL points to the platform's marketing/sales landing page — NOT directly into the Vault (no unauthenticated browse per PRD-21A decision #14)

> **Decision rationale:** External sharing is an organic acquisition channel. The message is warm and personal. Non-subscribers land on a marketing page that sells the platform, not on a login wall.

**Data created/updated:**
- `lila_tool_permissions`: on Toolbox assignment (original or saved prompt)
- No data created for external share (clipboard only)

### Screen 5: Report Modal

When a user taps [Report] on a comment:

**What the user sees:**

```
┌──────────────────────────────────────────┐
│  Report this comment               [×]  │
│  ──────────────────────────────────────  │
│                                          │
│  Why are you reporting this?             │
│                                          │
│  ○ Inappropriate language                │
│  ○ Spam or self-promotion               │
│  ○ Harassment or bullying               │
│  ○ Harmful or dangerous advice          │
│  ○ Off-topic content                    │
│  ○ Other                                │
│                                          │
│  Additional details (optional):          │
│  [                                    ]  │
│                                          │
│  [Submit Report]                         │
│                                          │
└──────────────────────────────────────────┘
```

**Behavior:**
- One reason required, additional details optional
- Tap [Submit Report] → inserts to `vault_comment_reports`
- Confirmation: "Thank you. We'll review this."
- Reports are anonymous — other users never see who reported. Only admin moderation panel shows reporter identity.
- If a comment accumulates 3+ reports from different users, it is auto-hidden (`moderation_status = 'auto_hidden'`) and logged to `vault_moderation_log` with `automated = true`

**Data created:**
- `vault_comment_reports`: insert
- `vault_comments.report_count`: incremented
- If report_count >= 3: `vault_comments.moderation_status` → 'auto_hidden', `vault_moderation_log` entry

### Screen 6: My Vault Activity (Personal History View)

Accessible from the Vault browse page via a "My Activity" link or tab in the search/filter area.

**What the user sees:**

```
┌──────────────────────────────────────────┐
│  My Vault Activity                       │
│  ──────────────────────────────────────  │
│  You've completed 12 tutorials           │
│  ──────────────────────────────────────  │
│                                          │
│  Sort by: [Most Used ▼]                  │
│  Filter: [All ▼] [Hearted ▼]            │
│           [Completed ▼] [In Progress ▼]  │
│                                          │
│  ┌─────┐ Meal Planning Master            │
│  │thumb│ Used 23 times  •  Completed     │
│  │     │ Last used: 2 days ago           │
│  └─────┘ ♡ Hearted                       │
│                                          │
│  ┌─────┐ Storybook Character Builder     │
│  │thumb│ Used 8 times  •  In Progress    │
│  │     │ Last used: 1 week ago           │
│  └─────┘                                 │
│                                          │
│  ┌─────┐ AI Basics for Beginners         │
│  │thumb│ Viewed  •  Completed            │
│  │     │ Completed: March 1              │
│  └─────┘ ♡ Hearted                       │
│                                          │
└──────────────────────────────────────────┘
```

- **Completion stat header:** "You've completed X tutorials" — a simple encouraging stat
- **Sort options:** Most Used (session count descending), Recently Used, Recently Viewed, Alphabetical
- **Filter options:** All, Hearted, Completed, In Progress, Bookmarked
- **Per-item display:** Thumbnail, title, usage count (from `vault_tool_sessions`), progress status, last used/viewed date, heart state
- Tapping any item opens its detail view

**Data read:**
- `vault_user_progress` for status and completion
- `vault_tool_sessions` for usage counts and last-used dates
- `vault_engagement` for heart state
- `vault_user_bookmarks` for bookmark state

### Screen 7: Recommendation Rows (PRD-21A Browse Page Enhancement)

> **Depends on:** PRD-21A Screen 1 — the browse page section layout.

PRD-21A defined Section B (Continue Learning) and Section C (Recommended for You). PRD-21C refines and expands these with engagement-powered logic.

**Section B — Recently Viewed (replaces "Continue Learning"):**
- Shows the last 8-10 items the user opened, sorted by `last_accessed_at` descending
- Each card shows the standard card layout plus a progress indicator if in-progress
- This row always appears if the user has viewed at least one item (not conditional on in-progress status)
- If any items have `progress_status = 'in_progress'`, those sort to the front of the row

> **Decision rationale:** "Recently Viewed" is more universally useful than "Continue Learning" since most Vault items are single-use tools or prompt packs, not multi-step tutorials. The user gets their browsing history as a quick-access row. In-progress items bubble to the front for the cases where multi-step content exists.

**Section C — Recommended for You (refined logic):**

Four recommendation sub-rows, each appearing as a labeled horizontal scroll row when sufficient data exists:

1. **"Popular in [Category]"** — For categories the user has browsed, shows items sorted by heart count that the user hasn't started. Row label uses the category name: "Popular in Creative & Fun."
2. **"Because You Hearted [X]"** — Items sharing tags or category with items the user has hearted, excluding items already viewed. Shows up to 6 items. Only appears if the user has hearted at least 2 items.
3. **"New Since Your Last Visit"** — Items added since the user's most recent `vault_user_visits` timestamp. Uses the existing first-sighting system from PRD-21A. Only appears if there are new items.
4. **"In Progress"** (conditional) — Only appears if the user has items with `progress_status = 'in_progress'` AND `progress_percent > 0` AND `progress_percent < 100`. Shows items with their progress bars. A focused "finish what you started" row.

> **Decision rationale:** These four surfaces are rule-based (no ML) and powered entirely by data PRD-21A and PRD-21C define. "Popular in Category" uses heart counts. "Because You Hearted" uses tag intersection. "New Since Last Visit" uses the first-sighting system. "In Progress" uses progress tracking. No recommendation engine to build or maintain. The architecture supports adding collaborative filtering later without restructuring.

**Data read:**
- `vault_user_progress` for recent views, progress status
- `vault_engagement` for hearts (user's and aggregate)
- `vault_user_visits` and `vault_first_sightings` for new-since-last-visit
- `vault_items` for tags, categories, heart counts

### Screen 8: Admin Moderation Tab (Wires PRD-21B Stub)

> **Depends on:** PRD-21B Screen 0 (Admin Console Shell) — the Moderation tab was stubbed. PRD-21C fully defines it. Requires `moderation_admin` staff permission.

The Moderation tab in the Admin Console provides tools for managing community-generated content (discussion comments).

**What the admin sees:**

```
┌──────────────────────────────────────────┐
│  MyAIM Admin Console            [User] [←]│
│  ─────────────────────────────────────── │
│  [AI Vault] [Moderation] [System] [...]   │
│  ──────────────────────────────────────  │
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐            │
│  │  3   │ │  1   │ │  5   │            │
│  │Flagged│ │Hidden│ │Reports│           │
│  └──────┘ └──────┘ └──────┘            │
│                                          │
│  [Flagged] [Hidden] [Reported] [History] │
│  ──────────────────────────────────────  │
│                                          │
│  (Active tab content below)              │
│                                          │
└──────────────────────────────────────────┘
```

**Summary cards at top:** Quick-glance counts — total flagged, total hidden, total pending reports. Updating in real-time.

**Tab: Flagged**
- Shows comments where `moderation_status = 'flagged'`
- These were caught by the AI moderation gate and held for review
- Each item shows: comment text, author name, vault item title (linked), timestamp, moderation flags (what triggered it)
- Actions per item: [Approve] (makes visible), [Delete] (soft delete), [Keep Flagged]

**Tab: Hidden**
- Shows comments where `moderation_status = 'auto_hidden'`
- Auto-hidden by aggressive moderation rules or by reaching 3+ community reports
- Same display as Flagged tab
- Actions per item: [Restore] (sets to approved), [Delete] (soft delete), [Keep Hidden]

**Tab: Reported**
- Shows entries from `vault_comment_reports` joined with `vault_comments`
- Each item shows: reported comment text, author, vault item title, report reason, additional details, reporter name (admin-only), report timestamp
- Actions per item: [Dismiss Report] (report acknowledged, no action on comment), [Approve Comment] (if it was auto-hidden by reports), [Delete Comment], [Hide Comment]

**Tab: History**
- Shows `vault_moderation_log` entries, most recent first
- Each entry shows: comment content (truncated), moderator name, action taken, reason, previous status → new status, whether automated, timestamp
- Filterable by action type and date range
- Limited to most recent 100 entries with pagination

**All moderation actions:**
- Every action writes to `vault_moderation_log` with: comment_id, moderator_id, action, reason, previous_status, new_status, automated (false for manual actions)
- Actions are immediate — no confirmation dialog for approve/delete/hide (admin can always reverse via History tab)

**Data read/written:**
- `vault_comments`: read for flagged/hidden items, update moderation_status on actions
- `vault_comment_reports`: read for reported tab
- `vault_moderation_log`: read for history, insert on every action

### Screen 9: Admin Content Policy Configuration

Accessible from the Moderation tab via a "Content Policy" settings button/link.

**What the admin sees:**

```
┌──────────────────────────────────────────┐
│  Content Policy Settings                 │
│  ──────────────────────────────────────  │
│                                          │
│  Auto-moderation: [Enabled ✓]            │
│                                          │
│  Topic Exclusions:                       │
│  [×] Political content                   │
│  [×] Adult content (above PG level)      │
│  [×] Vaccination debates                 │
│  [×] Religious debates / proselytizing   │
│  [ ] Other: [                         ]  │
│  [+ Add exclusion]                       │
│                                          │
│  Behavior Rules:                         │
│  [×] Flag negativity / criticism         │
│  [×] Flag self-promotion / spam          │
│  [×] Flag harmful or dangerous advice    │
│  [×] Flag off-topic content              │
│                                          │
│  Heart Count Display Threshold: [5]      │
│  Auto-hide Report Threshold: [3]         │
│                                          │
│  [Save Changes]                          │
│                                          │
└──────────────────────────────────────────┘
```

- **Topic exclusions:** Configurable list of topics the AI moderation gate should flag or reject. Each exclusion is a descriptive phrase the Haiku gate evaluates semantically (not keyword matching).
- **Behavior rules:** Toggleable categories of comment behavior to screen for.
- **Heart count display threshold:** The minimum heart count before the number appears on content cards. Default: 5.
- **Auto-hide report threshold:** Number of unique user reports before a comment is auto-hidden. Default: 3.

All settings stored in `vault_engagement_config` (key-value configuration table).

**Data updated:**
- `vault_engagement_config`: upserts on save

### Screen 10: Admin Engagement Analytics (PRD-21B Enhancement)

> **Depends on:** PRD-21B's per-item analytics section in the Vault Admin tab.

PRD-21B defined an analytics area on each item's admin detail view showing views, bookmarks, copies, and sessions. PRD-21C adds engagement metrics to that existing view.

**Additional metrics shown per item:**

- **Hearts:** Total heart count
- **Satisfaction:** Thumbs up count, thumbs down count, satisfaction ratio (% positive). Highlighted in red if ratio drops below 70%.
- **Discussion activity:** Total comments, active commenters count
- **Usage frequency:** Total sessions, unique users, average sessions per user

**Admin-level analytics dashboard (within the Vault Admin tab):**

- **Top Content:** Items ranked by hearts, by sessions, by satisfaction ratio
- **Struggling Content:** Items with satisfaction ratio below 70% — flagged for review or removal
- **Top Contributors:** Users ranked by approved comment count. Shows display name and total contributions. Admin-only — never user-facing.
- **Engagement Trends:** Time-series of total hearts, comments, and sessions per week/month
- **Community Health:** Moderation stats — auto-flagged rate, report rate, admin action breakdown

> **Decision rationale:** The "Struggling Content" view directly addresses the need to identify tools that frustrate users. The satisfaction signal (thumbs up/down) is the primary data source for this — hearts alone don't capture frustration since users who dislike something simply don't heart it. The binary satisfaction prompt after use captures both positive and negative signals.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full engagement access | Can heart, bookmark, comment, report, view discussions, see heart counts on cards, access My Vault Activity, share externally, assign to Toolbox. |
| Dad / Additional Adult | Browse only (if `vault_browse` granted) | Can see heart counts on cards and viewed/progress indicators on their own items. Cannot see or participate in discussions. Cannot heart items. |
| Special Adult | Not present | AI Vault is not part of the Special Adult scope. |
| Independent (Teen) | Filtered browse only | Can see heart counts on cards in their filtered view. Cannot see or participate in discussions. Cannot heart items. |
| Guided / Play | Not present | No Vault access. |
| Admin (via staff_permissions) | Full moderation access | Moderation tab, content policy configuration, engagement analytics, top contributor reports. |

### Shell Behavior

- **Mom shell:** Full engagement layer visible. Hearts, discussions, My Vault Activity, share actions, recommendation rows — all active.
- **Dad/Adult shell (with vault_browse):** Sees heart counts on cards as a passive quality signal. Sees their own progress/viewed indicators. No discussion section renders. No heart button. No share actions.
- **Independent shell:** Same as Dad — passive signals only. No interaction with engagement layer.
- **Guided/Play shell:** Not applicable.

### Privacy & Transparency

- Discussion comments display the author's display name only. No other identifying information is visible to other users.
- Reports are anonymous to all users. Only admin moderation panel reveals reporter identity.
- Satisfaction signals (thumbs up/down) are completely anonymous — even admin analytics show only aggregate ratios, not per-user responses.
- Heart activity is semi-public: other moms can see the aggregate count but not who hearted. Only the user knows their own heart state.
- Engagement data (hearts, comments, satisfaction) is included in the anonymized platform intelligence pipeline (PRD Platform Intelligence Pipeline v2) — structural patterns only, no personal content.

---

## Data Schema

### Table: `vault_engagement`

Tracks hearts on Vault items. One row per user per item (single engagement type — hearts only, not V1's multi-type pattern).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| vault_item_id | UUID | | NOT NULL | FK → vault_items |
| user_id | UUID | | NOT NULL | FK → auth.users |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Users can insert/delete their own rows. All authenticated users can read (for aggregate counts). UNIQUE on (vault_item_id, user_id).

**Indexes:**
- `(vault_item_id)` — aggregate heart count queries
- `(user_id)` — "items I've hearted" queries

> **Decision rationale:** V1 used an `engagement_type` column supporting both 'like' and 'favorite.' V2 collapses this to hearts only. Bookmarks (the private save action) are handled by PRD-21A's existing `vault_user_bookmarks` table. One table per engagement type is cleaner than a multi-type table with type filtering on every query.

### Table: `vault_comments`

Threaded discussion comments on Vault items.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| vault_item_id | UUID | | NOT NULL | FK → vault_items |
| parent_comment_id | UUID | | NULL | Self-FK → vault_comments. NULL for top-level. |
| user_id | UUID | | NOT NULL | FK → auth.users |
| author_display_name | TEXT | | NOT NULL | Snapshot of user's display name at time of posting |
| content | TEXT | | NOT NULL | Comment text (plain text only) |
| depth_level | INTEGER | 0 | NOT NULL | 0 = top-level, 1 = reply, 2 = reply-to-reply, max 3 |
| moderation_status | TEXT | 'approved' | NOT NULL | CHECK: 'pending', 'approved', 'flagged', 'auto_hidden', 'deleted' |
| moderation_flags | TEXT[] | '{}' | NOT NULL | Array of strings describing what triggered moderation (e.g., 'topic:political', 'tone:negative') |
| report_count | INTEGER | 0 | NOT NULL | Denormalized count of reports. Auto-hides at threshold. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Users with `isPrimaryParent()` can read approved comments and insert new comments. Users can update/delete (soft) their own comments. Admin can read all statuses. Write moderation_status changes admin-only (except soft delete by comment owner).

**Indexes:**
- `(vault_item_id, moderation_status, created_at)` — loading approved comments for a discussion thread
- `(parent_comment_id)` — loading replies
- `(user_id)` — "my comments" and top contributor queries
- `(moderation_status)` — admin moderation queue queries

### Table: `vault_comment_reports`

Community reports on comments.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| comment_id | UUID | | NOT NULL | FK → vault_comments |
| reporter_id | UUID | | NOT NULL | FK → auth.users |
| reason | TEXT | | NOT NULL | CHECK: 'inappropriate_language', 'spam_promotional', 'harassment_bullying', 'harmful_advice', 'off_topic', 'other' |
| additional_details | TEXT | | NULL | Optional context |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Insert-only for authenticated primary parents. Read access admin-only. UNIQUE on (comment_id, reporter_id) — one report per user per comment.

**Indexes:**
- `(comment_id)` — reports for a specific comment

### Table: `vault_moderation_log`

Audit trail for all moderation actions, both automated and manual.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| comment_id | UUID | | NOT NULL | FK → vault_comments |
| moderator_id | UUID | | NULL | FK → auth.users. NULL for system-automated actions. |
| action | TEXT | | NOT NULL | CHECK: 'approve', 'delete', 'flag', 'hide', 'restore', 'auto_flag', 'auto_hide', 'report_auto_hide' |
| reason | TEXT | | NULL | Human-written reason or auto-moderation explanation |
| previous_status | TEXT | | NULL | moderation_status before action |
| new_status | TEXT | | NOT NULL | moderation_status after action |
| automated | BOOLEAN | false | NOT NULL | true for AI gate and report-threshold actions |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Insert for system and admin. Read admin-only.

**Indexes:**
- `(comment_id)` — moderation history for a comment
- `(created_at DESC)` — chronological moderation log
- `(automated, created_at)` — filtering auto vs. manual actions

### Table: `vault_satisfaction_signals`

Binary satisfaction feedback per user per item. Admin-only analytics — never exposed to other users.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| vault_item_id | UUID | | NOT NULL | FK → vault_items |
| user_id | UUID | | NOT NULL | FK → auth.users |
| is_positive | BOOLEAN | | NOT NULL | true = thumbs up, false = thumbs down |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Users can insert and update their own signals (change their mind). Read access admin-only. UNIQUE on (vault_item_id, user_id).

**Indexes:**
- `(vault_item_id, is_positive)` — per-item satisfaction ratio calculation

### Table: `vault_engagement_config`

Admin-configurable engagement settings. Key-value store.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| key | TEXT | | NOT NULL | PK. E.g., 'heart_display_threshold', 'report_auto_hide_threshold' |
| value | JSONB | | NOT NULL | Configuration value |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_by | UUID | | NULL | FK → auth.users (admin who changed it) |

**RLS Policy:** Read by all authenticated users (client needs thresholds). Write admin-only.

**Default entries:**

| Key | Default Value | Purpose |
|-----|--------------|---------|
| `heart_display_threshold` | `5` | Minimum hearts before count shows on cards |
| `report_auto_hide_threshold` | `3` | Reports needed to auto-hide a comment |
| `moderation_enabled` | `true` | Whether AI moderation gate is active |
| `topic_exclusions` | `["political content", "adult content above PG", "vaccination debates", "religious debates"]` | Topics the AI gate flags |
| `behavior_rules` | `["negativity", "spam", "harmful_advice", "off_topic"]` | Comment behaviors to screen for |

### Additions to `vault_items` (PRD-21A table)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| heart_count | INTEGER | 0 | Denormalized. Updated via database trigger on `vault_engagement` insert/delete. |
| comment_count | INTEGER | 0 | Denormalized. Updated via database trigger on `vault_comments` insert (approved only) / status change to deleted. |
| satisfaction_positive | INTEGER | 0 | Denormalized thumbs-up count. |
| satisfaction_negative | INTEGER | 0 | Denormalized thumbs-down count. |

> **Decision rationale:** Denormalized counters on `vault_items` avoid JOIN queries when rendering browse page cards. Database triggers maintain consistency. This follows the V1 pattern (which had `engagement_likes`, `engagement_favorites`, `engagement_comments`) but with cleaner column names and separate satisfaction counters.

### Additions to `user_saved_prompts` (PRD-21A table)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| shared_with_member_id | UUID | NULL | FK → family_members. If set, this saved prompt has been shared to a member's Toolbox. |

> **Decision rationale:** When mom shares a LiLa-customized prompt to a family member's Toolbox, the `user_saved_prompts` record is the source of truth for the customized content. The `lila_tool_permissions` record (PRD-21) links to this via `saved_prompt_id`. The `shared_with_member_id` on saved prompts provides quick lookup: "which of my saved prompts have I shared?"

### Additions to `lila_tool_permissions` (PRD-21 table)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| saved_prompt_id | UUID | NULL | FK → user_saved_prompts. If set, the Toolbox entry renders the saved prompt content instead of the generic Vault item. |

> **Decision rationale:** The Toolbox entry needs to know whether to render the original Vault item or a customized saved prompt. If `saved_prompt_id` is set, the Toolbox pulls the prompt text from `user_saved_prompts`. If NULL, it pulls from the `vault_item_id` as before.

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| PRD-21A (Browse & Content) | All Vault items, user progress, bookmarks, sessions, and visits flow from 21A's tables. Engagement components overlay on 21A's content cards and detail views. |
| PRD-21B (Admin) | Admin publishes content → users can then heart, discuss, and rate it. Admin moderation tab defined here is added to 21B's console shell. |
| PRD-22 (Settings) | Notification preferences (PRD-22) determine whether engagement notifications (replies to your comments, etc.) are delivered. |
| PRD-05 (LiLa Core) | Haiku model used for AI moderation gate. Context assembly patterns inform moderation prompt construction. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-21A (Browse cards) | Heart counts and viewed/progress indicators render on 21A's content cards. Recommendation rows power 21A's browse page sections. |
| PRD-21B (Admin analytics) | Engagement metrics, satisfaction signals, and top contributor data feed into 21B's per-item analytics and the admin engagement dashboard. |
| PRD-21 (AI Toolbox) | "Share from My Prompts" creates `lila_tool_permissions` records linking saved prompts to family member Toolboxes. |
| PRD-11 (Victory Recorder) | Vault completion events are offered as Victory Recorder entries via the external victory source pattern. |
| PRD-15 (Notifications) | "Someone replied to your comment" notifications use PRD-15's notification infrastructure. |
| Platform Intelligence Pipeline | Anonymized engagement patterns (which content types get most hearts, which categories have most discussion) feed into platform intelligence — structural patterns only, no personal content. |

---

## AI Integration

### Comment Moderation Gate (Haiku)

When a user submits a comment, it passes through a server-side AI moderation gate before being stored.

**Pipeline:**
1. User submits comment text
2. Edge Function receives the comment and the `vault_engagement_config` content policy settings
3. Edge Function calls Haiku with the comment text and the content policy as system context
4. Haiku evaluates the comment semantically against:
   - Topic exclusions (political, adult, vaccination debates, religious debates, etc.)
   - Behavior rules (negativity, spam, harmful advice, off-topic)
   - Community alignment (is this helpful, supportive, and relevant to the Vault content?)
5. Haiku returns a structured response: `{ action: 'approve' | 'flag' | 'reject', flags: string[], explanation: string }`
6. Edge Function maps the action to `moderation_status`:
   - `approve` → `'approved'` (comment visible immediately)
   - `flag` → `'flagged'` (held for admin review, user sees "being reviewed" message)
   - `reject` → comment is not stored, user sees rephrasing suggestion
7. If flagged or rejected: `vault_moderation_log` entry created with `automated = true`

**System prompt for Haiku gate:**

```
You are a community moderation assistant for a mom-focused AI learning platform. 
Evaluate the following comment for a discussion thread on educational AI content.

APPROVE if the comment is:
- Helpful, supportive, or encouraging
- A genuine question about the content
- Sharing a personal experience with the tool/tutorial
- Constructive feedback

FLAG for human review if the comment:
- Contains mild negativity that might be constructive criticism
- Is borderline off-topic but might be relevant
- Uses language that could be interpreted multiple ways

REJECT if the comment:
- Discusses political topics or political figures
- Contains adult content above a PG level
- Debates vaccinations, medical treatments, or health controversies
- Proselytizes or debates religious beliefs
- Contains harassment, bullying, or personal attacks
- Promotes products, services, or external links (spam)
- Contains harmful, dangerous, or medically irresponsible advice
- Is clearly unrelated to the content being discussed
- Uses profanity or inappropriate language

TOPIC EXCLUSIONS (admin-configured):
{topic_exclusions_from_config}

Respond with JSON only:
{ "action": "approve" | "flag" | "reject", "flags": ["reason1", "reason2"], "explanation": "brief explanation" }
```

> **Decision rationale:** Using Haiku for semantic moderation instead of V1's keyword/regex approach. Haiku understands context, tone, and topic relevance — it can flag "I think the government should require all families to use AI" as political content without any keyword matching. The content policy is configurable via the admin panel (Screen 9), so adding or removing topic exclusions doesn't require code changes. Cost is minimal — Haiku calls on short comment text cost fractions of a cent.

### Victory Recorder Integration

When a user marks a Vault item as completed (either manually via a "Mark Complete" action or automatically when progress reaches 100%), the system offers to create a Victory Recorder entry.

**Flow:**
1. `vault_user_progress.progress_status` changes to `'completed'`
2. System generates a suggested victory: "Completed: [Item Display Title]"
3. Victory appears in the user's next Victory Recorder session as a suggested entry (following PRD-11's external victory source pattern)
4. User can approve, edit, or skip (Human-in-the-Mix)

> **Decision rationale:** Learning accomplishments deserve celebration. The Victory Recorder is the platform's celebration engine. Connecting Vault completions to victories creates a natural feedback loop: completing tutorials feels rewarding, which motivates more learning.

### LiLa Proactive Suggestion (Stub Enhancement)

PRD-21A defined a stub for LiLa proactively suggesting Vault content during conversations. PRD-21C enriches the suggestion logic with engagement data:

- When suggesting content, LiLa prioritizes items with higher heart counts (social proof that the content is good)
- LiLa avoids suggesting items the user has already completed (checks `vault_user_progress`)
- LiLa can reference discussion activity: "The Meal Planning tutorial has a great discussion thread — other moms shared their adaptations"

---

## Edge Cases

### Cold Start (New Platform, Few Users)
- Heart counts below the display threshold (default 5) show the heart icon with no number — clean and non-embarrassing
- Discussion sections show the empty state: "No comments yet. Be the first to share your experience!"
- "Popular in Category" recommendations don't render until at least one item in the category has hearts above the threshold
- "Because You Hearted" doesn't render until the user has hearted at least 2 items
- The admin can manually heart items from their own account to seed initial engagement (no special seeding mechanism needed — organic accumulation)

### Comment Moderation Edge Cases
- User's comment is flagged → they see "Your comment is being reviewed" → admin approves → comment appears in thread (but the user isn't notified of approval — it just appears)
- User's comment is rejected → they see the rephrasing suggestion → they can try again with different wording (new comment, not a retry of the rejected one)
- User edits an already-approved comment → the edit passes through the moderation gate again. If the edit is flagged, the original approved version stays visible until admin reviews the edit.
- Admin takes no action on flagged items → they stay in the queue indefinitely. No auto-approve timer.

### Data Integrity
- User deletes their account → soft delete their comments (preserve thread structure but show "[deleted user]" as author). Hearts removed. Satisfaction signals removed.
- Vault item is archived → discussions are preserved but no new comments can be posted. Existing comments stay visible in a read-only state if the item is later restored.
- User changes their display name → existing comments retain the `author_display_name` snapshot from when they were posted. This is intentional — avoids retroactive name changes on old comments.

### Concurrent Activity
- Two users heart the same item simultaneously → UNIQUE constraint prevents duplicate rows. Denormalized counter uses database trigger (not application-level increment) to avoid race conditions.
- Report threshold reached during concurrent reports → database trigger handles the auto-hide. If two reports arrive simultaneously bringing the count to 3, the trigger fires once.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `vault_engagement` | Hearts, discussions, satisfaction signals, My Vault Activity | Essential+ (all paid tiers) |
| `vault_share_external` | External share (copy to clipboard) | Essential+ |
| `vault_share_toolbox` | Share customized prompts/skills to family Toolboxes | Enhanced+ |

> **Tier rationale:** Basic engagement (hearts, comments) should be available to all paid users to build community critical mass. Sharing customized content to family Toolboxes is a family-coordination feature that fits the Enhanced tier's "family intelligence" positioning. All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Collaborative filtering recommendations ("moms like you also liked") | Advanced recommendation engine | Post-MVP |
| Notification delivery for "someone replied to your comment" | PRD-15 notification infrastructure | PRD-15 is written; notification type registered here, delivery wired at build time |
| Victory Recorder auto-suggest for Vault completions | PRD-11 external victory source | PRD-11 is written; integration point defined here |
| Discussion moderation notifications to admin (in-app alert when flagged items need review) | Admin notification system | PRD-32 (System Admin) |
| Community contributor recognition (badges, "helpful" marks on comments) | PRD-24 (Rewards & Gamification) or post-MVP |
| Semantic search integration for discussions (search within comments across all Vault items) | Post-MVP search enhancement |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Moderation tab in Admin Console Shell | PRD-21B | Fully defined: 4-tab moderation interface (Flagged, Hidden, Reported, History) + Content Policy configuration. Route: `/admin/moderation`. Permission: `moderation_admin`. |
| "Ratings, reviews, likes, favorites, discussions → PRD-21C" | PRD-21A (Decision #7) | Fully wired: Hearts (replacing likes+favorites), discussions (threaded comments), satisfaction signals (replacing star ratings). Reviews dropped — hearts and satisfaction serve both purposes. |
| Per-item engagement analytics in Vault Admin | PRD-21B | Hearts, satisfaction ratio, comment count, top contributors, and struggling content view added to 21B's analytics section. |
| Engagement counters on vault_items | PRD-21A (schema) | `heart_count`, `comment_count`, `satisfaction_positive`, `satisfaction_negative` columns added to `vault_items`. Replace V1's `engagement_likes`, `engagement_favorites`, `engagement_comments`. |
| "Recommended for You" dashboard widget signals | PRD-21A / PRD-14 | Heart data and usage frequency data now available for the dashboard widget to incorporate alongside tier and progress signals. |

---

## What "Done" Looks Like

### MVP (Must Have)

**Engagement:**
- [ ] `vault_engagement` table created with RLS policies and UNIQUE constraint
- [ ] Heart button on content detail view with optimistic UI (instant toggle, revert on error)
- [ ] Heart count display on content cards, hidden below configurable threshold (default 5)
- [ ] Denormalized `heart_count` on `vault_items` maintained by database trigger
- [ ] `vault_satisfaction_signals` table created with RLS
- [ ] "Was this helpful?" prompt appears after ≥60s engagement, once per user per item, auto-fades
- [ ] Denormalized `satisfaction_positive` and `satisfaction_negative` on `vault_items`

**Discussions:**
- [ ] `vault_comments` table created with RLS (primary parent only for read/write)
- [ ] Comment form and threaded display on content detail views
- [ ] Threading with max depth 3, "@[author]" prefix at max depth
- [ ] Sort toggle: newest first (default), oldest first
- [ ] Community guidelines displayed above comment form
- [ ] Edit own comments, soft-delete own comments
- [ ] `vault_comment_reports` table created with RLS
- [ ] Report modal with reason categories and optional details
- [ ] Auto-hide on 3+ reports (configurable threshold)

**Moderation:**
- [ ] Haiku-based server-side moderation gate on comment submission
- [ ] Moderation pipeline: approve → visible, flag → held for review, reject → not stored with user feedback
- [ ] `vault_moderation_log` table created with RLS
- [ ] All moderation actions (auto and manual) logged
- [ ] Admin Moderation tab fully wired in Admin Console: Flagged, Hidden, Reported, History tabs
- [ ] Content Policy configuration screen with topic exclusions and behavior rules
- [ ] `vault_engagement_config` table with default entries

**Progress & History:**
- [ ] Viewed indicator on content cards for previously-opened items
- [ ] In-progress indicator on cards with active progress
- [ ] Completed indicator on cards for completed items
- [ ] My Vault Activity screen with completion count, sort by most-used/recently-used, filter by status

**Recommendations:**
- [ ] "Recently Viewed" row on browse page (replaces "Continue Learning" — in-progress items sort to front)
- [ ] "Popular in [Category]" row powered by heart counts
- [ ] "Because You Hearted [X]" row using tag intersection
- [ ] "New Since Your Last Visit" row using first-sighting system
- [ ] "In Progress" conditional row

**Sharing:**
- [ ] Share action sheet on content detail view
- [ ] "+ Add to Family Member's Toolbox" (wires to PRD-21A Screen 4)
- [ ] "Share from My Prompts" with saved prompt picker and member assignment
- [ ] `shared_with_member_id` column on `user_saved_prompts`
- [ ] `saved_prompt_id` column on `lila_tool_permissions`
- [ ] "Copy to Share Externally" with formatted message and landing page URL

**Admin Analytics:**
- [ ] Per-item engagement metrics in Vault Admin: hearts, satisfaction ratio, comments, sessions
- [ ] Struggling Content view (items with satisfaction ratio below 70%)
- [ ] Top Contributors view (users by approved comment count — admin only)

### MVP When Dependency Is Ready

- [ ] Victory Recorder integration: completion events offered as suggested victories (when PRD-11 is built)
- [ ] "Someone replied to your comment" notification via PRD-15 notification system (when PRD-15 is built)
- [ ] Notification preferences for engagement alerts in PRD-22 Settings (when PRD-22 is built)

### Post-MVP

- [ ] Collaborative filtering recommendations ("moms like you also liked")
- [ ] Semantic search across discussion threads
- [ ] Community contributor recognition (badges, "helpful" marks on comments)
- [ ] Discussion threading beyond depth 3
- [ ] Rich text in comments (bold, links)
- [ ] Admin moderation notifications (in-app alerts for new flagged items)
- [ ] Engagement data feeding into LiLa context (suggest content based on what user has hearted and discussed)
- [ ] "Pin" a comment (admin action — pin a helpful comment to the top of a discussion)
- [ ] Discussion digest: periodic notification summarizing new discussion activity on items the user has interacted with

---

## CLAUDE.md Additions from This PRD

- [ ] Engagement model: hearts (public social signal) + bookmarks (private save, PRD-21A). No separate "favorites" — V1's dual engagement types collapsed to one.
- [ ] Satisfaction signals: binary thumbs up/down, admin-only analytics. Never shown to users. Primary source for identifying frustrating content.
- [ ] Heart count display threshold: configurable via `vault_engagement_config`. Default 5. Cards show heart icon with no number below threshold.
- [ ] Discussion threading: max depth 3. Replies at max depth use "@[author]" prefix. Mom-only feature — other roles with Vault browse access do not see discussions.
- [ ] Comment moderation pipeline: Haiku gate (semantic evaluation) → approve/flag/reject. Content policy admin-configurable via `vault_engagement_config`. Topic exclusions are descriptive phrases evaluated semantically, not keywords.
- [ ] Report threshold: 3 unique user reports auto-hides a comment. Configurable via `vault_engagement_config`.
- [ ] Denormalized counters: `heart_count`, `comment_count`, `satisfaction_positive`, `satisfaction_negative` on `vault_items`. Maintained by database triggers, not application code.
- [ ] `author_display_name` on comments is a snapshot — does not retroactively change when user updates their name.
- [ ] Victory Recorder integration: Vault completion → suggested victory entry via external source pattern (PRD-11). Human-in-the-Mix: approve/edit/skip.
- [ ] Shared prompts to Toolbox: `user_saved_prompts.shared_with_member_id` + `lila_tool_permissions.saved_prompt_id` link customized prompts to family member Toolboxes.
- [ ] External sharing: copy-to-clipboard formatted message pointing to landing page. No direct Vault links to non-authenticated users.
- [ ] Admin Moderation tab at `/admin/moderation`: Flagged, Hidden, Reported, History. Requires `moderation_admin` staff permission.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `vault_engagement`, `vault_comments`, `vault_comment_reports`, `vault_moderation_log`, `vault_satisfaction_signals`, `vault_engagement_config`
Columns added to existing tables: `vault_items` gains `heart_count`, `comment_count`, `satisfaction_positive`, `satisfaction_negative`. `user_saved_prompts` gains `shared_with_member_id`. `lila_tool_permissions` gains `saved_prompt_id`.
Enums updated: none (TEXT with CHECK constraints)
Triggers added: `set_updated_at` on `vault_comments`, `vault_engagement_config`. Heart count trigger on `vault_engagement` insert/delete → updates `vault_items.heart_count`. Comment count trigger on `vault_comments` insert (approved) / status change → updates `vault_items.comment_count`. Satisfaction trigger on `vault_satisfaction_signals` insert/update → updates `vault_items.satisfaction_positive` / `satisfaction_negative`.

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **No community profiles, no leaderboards, no follower mechanics** | The Vault is a learning community, not a social network. Display names on comments are the only public identity. Top contributor data is admin-only analytics. |
| 2 | **Hearts + bookmarks (two actions, not three)** | V1 had likes, favorites, and bookmarks — three overlapping concepts. V2 collapses to: hearts (public social signal) and bookmarks (private save, from PRD-21A). Cleaner UX, no confusion. |
| 3 | **No star ratings — hearts + satisfaction signals replace them** | Star ratings invite criticism and require volume to be meaningful. Hearts are encouragement-only. Satisfaction signals (thumbs up/down) capture frustration for admin without exposing negative scores to users. |
| 4 | **Heart count hidden below threshold (default 5)** | Avoids cold-start embarrassment when only 1-2 users have hearted an item. Threshold is admin-configurable. |
| 5 | **Haiku-based semantic moderation instead of V1's client-side keyword/regex** | Haiku evaluates tone, topic relevance, and intent — not just keywords. Can flag political content, vaccination debates, and adult themes without maintaining keyword lists. Content policy admin-configurable. |
| 6 | **Topic exclusions: political, adult (above PG), vaccination debates, religious debates** | These are the initial default exclusions. Admin can add/remove via Content Policy configuration. The AI Vault is a learning space for AI tools, not a debate forum. |
| 7 | **"Recently Viewed" replaces "Continue Learning" as primary history row** | Most Vault items are single-use tools or prompt packs, not multi-step tutorials. A history row is universally useful. In-progress items sort to the front for the multi-step cases. |
| 8 | **Four rule-based recommendation surfaces at MVP (no ML)** | Popular in Category (heart counts), Because You Hearted (tag intersection), New Since Last Visit (first-sighting), In Progress (conditional). All powered by engagement data defined in this PRD. Architecture supports adding collaborative filtering post-MVP. |
| 9 | **External sharing = copy-to-clipboard formatted message → landing page** | No direct Vault links to non-authenticated users (per PRD-21A). Warm personal message format serves as organic acquisition. No social media integration buttons. |
| 10 | **LiLa-customized prompts/skills assignable to family Toolboxes via saved_prompt_id** | Mom customizes with LiLa → saves to My Prompts → shares to member's Toolbox. Member gets personalized version. `lila_tool_permissions.saved_prompt_id` links to `user_saved_prompts`. |
| 11 | **Vault completion → Victory Recorder suggested entry** | Learning accomplishments deserve celebration. Follows PRD-11's external victory source pattern with Human-in-the-Mix checkpoint. |
| 12 | **Discussions are mom-only; other roles with Vault access don't see them** | Preserves the AI Vault discussions as a mom community space. Dad/teen with browse access see heart counts as passive quality signals but don't see or participate in discussions. |
| 13 | **No heartbeat community in-app; Facebook page serves external community** | In-app engagement is content-attached (discussions on items). Broader community building happens on Facebook. The platform is a learning tool, not a social network. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Collaborative filtering recommendations | Post-MVP. Current rule-based surfaces are sufficient for launch. |
| 2 | Community contributor recognition (badges) | PRD-24 (Gamification) or post-MVP side quest |
| 3 | Rich text in comments (bold, links) | Post-MVP enhancement |
| 4 | Discussion search across all items | Post-MVP search enhancement |
| 5 | Admin notification for new flagged items | PRD-32 (System Admin) |
| 6 | "Pin" a helpful comment to top of thread | Post-MVP admin feature |
| 7 | Discussion activity digest notifications | Post-MVP |
| 8 | Engagement data in LiLa context assembly | Post-MVP — requires extending PRD-05 context sources |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-21A (Browse & Content Delivery) | Content cards gain heart count, viewed/progress/completed indicators. Detail view gains engagement bar, satisfaction prompt, discussion section, share button. "Continue Learning" section refined to "Recently Viewed" with in-progress sort-to-front. "Recommended for You" section expanded to 4 recommendation sub-rows. `vault_items` gains 4 denormalized columns. | Update PRD-21A Screens 1 and 2 to reference PRD-21C engagement overlays. Update Section C description. Add columns to vault_items schema. |
| PRD-21B (Admin Content Management) | Moderation tab fully defined (was stub). Per-item analytics expanded with engagement metrics, satisfaction ratio, top contributors, struggling content. Content Policy configuration added to admin. | Mark Moderation tab stub as wired. Add engagement metrics to admin analytics section. |
| PRD-21 (Communication & Relationship Tools) | `lila_tool_permissions` gains `saved_prompt_id` column enabling customized prompt/skill Toolbox assignments. | Add column to schema. Note that Toolbox rendering checks `saved_prompt_id` before `vault_item_id` for content source. |
| PRD-21A (user_saved_prompts) | `user_saved_prompts` gains `shared_with_member_id` column. | Add column to schema. |
| PRD-11 (Victory Recorder) | Vault completion registered as external victory source. Completion events → suggested victory entries. | Add Vault completion to PRD-11's external source registry. Note Human-in-the-Mix checkpoint. |
| PRD-15 (Notifications) | "Comment reply" notification type registered. Delivery via PRD-15's notification infrastructure. | Add notification type to PRD-15's type registry. |
| PRD-05 (LiLa Core) | Haiku gate moderation call registered as a LiLa Engine use case. LiLa proactive suggestion logic enriched with heart count and discussion data. | Note moderation as a Haiku use case. Update proactive suggestion logic. |
| PRD-22 (Settings) | Engagement notification preferences (comment replies) added to notification settings. | Add engagement notification category to PRD-22's notification preferences. |
| Build Order Source of Truth | PRD-21C completed. 6 new tables defined. 4 columns added to `vault_items`. Moderation tab wired. Engagement analytics wired. | Update Section 2. Add tables to completed list. |

---

*End of PRD-21C*
