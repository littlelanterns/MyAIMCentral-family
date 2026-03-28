# PRD-21C Cross-PRD Impact Addendum
## AI Vault — Engagement & Community

**Created:** March 15, 2026
**PRD Session:** PRD-21C

This addendum documents changes to prior PRDs resulting from decisions made during the PRD-21C session. These changes should be applied during the pre-build audit or at each affected PRD's next edit.

---

## Impact on PRD-21A (AI Vault — Browse & Content Delivery)

### Content Card Enhancements (Screen 1)

**What changed:**
PRD-21C adds three visual indicators to content cards defined in PRD-21A:
1. Heart count display (with configurable threshold — hidden below 5 hearts)
2. Viewed/in-progress/completed indicators based on `vault_user_progress`
3. Filled heart icon when the current user has hearted the item

**Action needed:**
- Update PRD-21A Screen 1 card layout description to include engagement indicators
- Note that the heart count reads from denormalized `heart_count` on `vault_items`, not a JOIN to `vault_engagement`

### Content Detail View Enhancements (Screen 2)

**What changed:**
PRD-21C adds to the detail view:
1. Engagement bar below the action bar (heart button, discussion count, share button)
2. "Was this helpful?" satisfaction prompt (conditional, after ≥60s engagement)
3. Discussion thread section below content (Screen 3 in PRD-21C)

**Action needed:**
- Update PRD-21A Screen 2 to reference PRD-21C engagement bar insertion point
- Note that the action bar order is now: [Bookmark] [Optimize with LiLa] [+ Add to AI Toolbox] → then engagement bar → then content → then discussion thread

### Browse Page Sections Refinement (Sections B and C)

**What changed:**
- Section B "Continue Learning" → renamed "Recently Viewed." Shows last 8-10 opened items sorted by recency. Items with `in_progress` status sort to front. Always appears (not conditional on in-progress items existing).
- Section C "Recommended for You" → expanded to 4 sub-rows: Popular in [Category], Because You Hearted [X], New Since Your Last Visit, In Progress (conditional).

**Action needed:**
- Update PRD-21A Section B description and conditional logic
- Update PRD-21A Section C with the 4 recommendation sub-rows and their data sources

### Schema Additions to `vault_items`

**What changed:**
4 new denormalized columns:
- `heart_count` (INTEGER DEFAULT 0) — maintained by database trigger
- `comment_count` (INTEGER DEFAULT 0) — maintained by database trigger
- `satisfaction_positive` (INTEGER DEFAULT 0) — maintained by database trigger
- `satisfaction_negative` (INTEGER DEFAULT 0) — maintained by database trigger

**Action needed:**
- Add columns to PRD-21A's `vault_items` schema table
- Note these replace V1's `engagement_likes`, `engagement_favorites`, `engagement_comments` pattern

### Schema Addition to `user_saved_prompts`

**What changed:**
1 new column:
- `shared_with_member_id` (UUID, nullable, FK → family_members)

**Action needed:**
- Add column to PRD-21A's `user_saved_prompts` schema table

---

## Impact on PRD-21B (AI Vault — Admin Content Management)

### Moderation Tab Wired

**What changed:**
The Moderation tab in the Admin Console Shell (stubbed in PRD-21B Screen 0) is now fully defined:
- Route: `/admin/moderation`
- Permission: `moderation_admin`
- 4 tabs: Flagged, Hidden, Reported, History
- Content Policy configuration screen
- All moderation actions logged to `vault_moderation_log`

**Action needed:**
- Mark the Moderation tab stub as wired in PRD-21B
- No changes needed to PRD-21B's Admin Console Shell structure — the tab registry entry is already correct

### Per-Item Analytics Enhanced

**What changed:**
PRD-21B defined per-item analytics showing views, bookmarks, copies, sessions. PRD-21C adds:
- Heart count
- Satisfaction ratio (thumbs up / thumbs down) with red highlight below 70%
- Comment count and active commenter count
- Usage frequency metrics

Plus admin-level dashboard views:
- Top Content rankings (by hearts, sessions, satisfaction)
- Struggling Content (satisfaction ratio below 70%)
- Top Contributors (users by approved comment count)
- Engagement Trends (time-series)
- Community Health (moderation stats)

**Action needed:**
- Update PRD-21B's analytics section to include engagement metrics
- Add reference to Struggling Content view as a content health monitoring tool

---

## Impact on PRD-21 (Communication & Relationship Tools)

### `lila_tool_permissions` Schema Addition

**What changed:**
1 new column:
- `saved_prompt_id` (UUID, nullable, FK → user_saved_prompts)

When `saved_prompt_id` is set, the Toolbox entry renders the saved prompt content (potentially LiLa-customized) instead of the generic Vault item.

**Action needed:**
- Add column to PRD-21's `lila_tool_permissions` schema
- Update Toolbox rendering logic: check `saved_prompt_id` first → if present, pull content from `user_saved_prompts`; if NULL, pull from `vault_item_id` as before

---

## Impact on PRD-11 (Victory Recorder & Daily Celebration)

### Vault Completion as External Victory Source

**What changed:**
When a user's `vault_user_progress.progress_status` changes to `'completed'`, the system suggests a Victory Recorder entry: "Completed: [Item Display Title]."

**Action needed:**
- Register Vault completion as an external victory source in PRD-11's source registry
- Note the Human-in-the-Mix checkpoint: user approves, edits, or skips the suggested victory
- Victory suggested once per completion event (not on every subsequent view)

---

## Impact on PRD-15 (Messages, Requests & Notifications)

### New Notification Type: Comment Reply

**What changed:**
PRD-21C registers a "comment_reply" notification type. When someone replies to a user's comment on a Vault item, a notification is created.

**Action needed:**
- Add `comment_reply` to PRD-15's notification type registry
- Notification content: "[Author name] replied to your comment on [Item title]"
- Notification tap action: opens the content detail view scrolled to the discussion thread
- Respects PRD-22 notification preferences (user can mute engagement notifications)

---

## Impact on PRD-05 (LiLa Core AI System)

### Haiku Gate Moderation Registered as Use Case

**What changed:**
Comment moderation uses a Haiku API call for semantic content evaluation. This is a new Haiku use case in the model routing table.

**Action needed:**
- Add "Comment moderation (semantic content policy evaluation)" to PRD-05's model routing table under Haiku use cases
- Note: single Haiku call per comment submission, short input text, minimal token cost

### LiLa Proactive Suggestion Enrichment

**What changed:**
LiLa's proactive Vault content suggestions (stubbed in PRD-21A) can now factor in:
- Heart count (prioritize well-loved content)
- Completion status (don't suggest already-completed items)
- Discussion activity (mention active discussions as a draw)

**Action needed:**
- Update LiLa proactive suggestion stub to note engagement data as an available signal
- No architectural change — this is context enrichment on an existing stub

---

## Impact on PRD-22 (Settings)

### Engagement Notification Preferences

**What changed:**
PRD-21C introduces engagement-related notifications (comment replies). These need a preference toggle in Settings.

**Action needed:**
- Add "Vault Discussions" category to PRD-22's notification preferences section (Screen for Notification Preferences)
- Toggle: "Notify me when someone replies to my comment" (default: on)
- Respects Do Not Disturb (muted during DND except safety alerts)

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-21C completed (Wave 2, item 5)
- 6 new tables: `vault_engagement`, `vault_comments`, `vault_comment_reports`, `vault_moderation_log`, `vault_satisfaction_signals`, `vault_engagement_config`
- 4 columns added to `vault_items`: `heart_count`, `comment_count`, `satisfaction_positive`, `satisfaction_negative`
- 1 column added to `user_saved_prompts`: `shared_with_member_id`
- 1 column added to `lila_tool_permissions`: `saved_prompt_id`
- PRD-21B Moderation tab stub → wired
- PRD-21A engagement stub (Decision #7) → wired

**Action needed:**
- Update Section 2 with PRD-21C completion
- Add new tables to the completed tables list
- Note engagement conventions (heart threshold, moderation pipeline, denormalized counters) in conventions section

---

*End of PRD-21C Cross-PRD Impact Addendum*
