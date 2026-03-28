# PRD-37 + PRD-28B Cross-PRD Impact Addendum

**Created:** March 18, 2026
**Session:** PRD-37 (Family Feeds) + PRD-28B (Compliance & Progress Reporting)
**Purpose:** Documents how these two connected PRDs affect prior PRDs and establishes new system-wide conventions.

---

## Session Context

This session produced two interconnected PRDs designed together:

- **PRD-37: Family Feeds** — Private family social media feed with tab architecture. Family Life Feed (all families) + Homeschool Portfolio Feed (homeschool families). Capture surface for moments, memories, and learning evidence.
- **PRD-28B: Compliance & Progress Reporting** — Universal template-based reporting engine. Homeschool compliance templates, SDS/disability monthly summary, Standards Portfolio Tracker, ESA Invoice, Family Newsletter. Export layer for formatted compliance outputs.

**Connection:** PRD-37 captures the data (visual portfolio). PRD-28B formats and exports it (compliance reports). They share the same underlying data — a photo of a science project captured in the feed becomes evidence in a standards portfolio becomes a work sample in a report.

**Build order:** PRD-37 first (capture surface), PRD-28B second (export engine).

---

## New Architectural Patterns Introduced

### 1. Tag-Based Feed Filtering

`family_moments.feed_visibility` is a TEXT[] array. The Feeds page tab system queries this array to determine which tab(s) show each moment. New feed types (e.g., Progress Portfolio for disability) are added by extending this array — no new tables needed. This is the same tag-based filtering philosophy as PRD-18's journal tag architecture, applied to feeds.

### 2. Template-as-Data Reporting

Report templates are stored in the `report_templates` table, not as code. Each template defines: structure, data sources, LiLa instructions, and tier requirements. New templates can be added by inserting a row — no application deployment needed. This supports both incremental template expansion and future custom template authoring by users.

### 3. Voice-as-Input / Text-as-Storage

Voice recordings are an input method, not a stored media type. Whisper transcribes audio to text; the transcription persists permanently. Audio files are stored for 30 days with a download button (for adorable kid recordings), then auto-deleted by a daily cron job.

### 4. Out of Nest Expanded Shell

Out of Nest members gain a feed-first lightweight shell beyond their current messaging-only experience. The Family Feed is their primary app entry point (recommended PWA home screen), with message and notification indicators. This establishes a pattern for future Out of Nest feature expansion.

---

## Impact on PRD-01 (Auth & Family Setup)

**What changed:**
- Out of Nest members gain feed access as a first-class feature beyond messaging. The existing `out_of_nest_members` table and auth flow are unchanged — feed access is additive.
- PWA entry point recommendation: Out of Nest members should be guided to save the Family Feed page to their home screen during onboarding.

**Action needed:**
- Note Family Feed as the recommended Out of Nest PWA entry point in onboarding flow documentation.
- No schema changes.

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- Caregiver shift logs (`shift_sessions`, shift notes) are now consumed by PRD-28B's SDS reporting template. No permission changes — caregivers don't see reports, they generate data that feeds into them.
- No new permission keys for caregivers. Feed access remains excluded from caregiver shifts.

**Action needed:**
- No schema changes. Note that shift data is a reporting data source.

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- **Feeds** added as a top-level sidebar navigation item, available to Mom, Dad, Independent, and Guided shells. Not available to Play or Special Adult shells.
- **Out of Nest lightweight shell** defined: feed-first layout with Family name header, message envelope icon (with unread count), notification bell, profile/settings. No full sidebar navigation. This is a distinct shell layout.
- **PWA entry points** expanded to four: Dashboard (most members), MindSweep `/sweep` (mom), Family Hub `/hub` (family tablet), Family Feed (Out of Nest primary, teen secondary).

**Action needed:**
- Add "Feeds" to sidebar navigation spec for Mom, Dad, Independent, Guided shells.
- Define Out of Nest shell layout spec (header with family name + message/notification indicators + profile, full-width feed below).
- Update PWA entry point documentation.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- New guided modes registered: `homeschool_bulk_summary`, `homeschool_report_generation`.
- Feed content auto-tagging behavior defined (subject suggestions, standards alignment, sharing suggestions) — all suggestion-only, never auto-applied.
- Report generation LiLa instructions: warm professional tone, never fabricate data, never include financial data.

**Action needed:**
- Register new guided modes in the guided mode registry.
- Add feed auto-tagging as a new LiLa behavior category (suggestion-only pattern).
- Add report generation system prompt notes to LiLa prompt assembly documentation.

---

## Impact on PRD-08 (Smart Notepad)

**What changed:**
- "Send to..." routing grid gains two new destinations: **"Family Feed"** and **"Homeschool Portfolio."** Creates a `family_moments` record from notepad content, tagged appropriately.
- Journal entries can be promoted to either feed as an explicit user action. This creates a new `family_moments` record (independent copy, not a link).

**Action needed:**
- Add "Family Feed" and "Homeschool Portfolio" to the Send to... destination list.
- Add "Share to Family Feed" / "Add to Homeschool Portfolio" as action options on journal entry detail view.
- Note: journal and portfolio are separate systems. Promotion creates an independent copy.

---

## Impact on PRD-09A (Tasks, Routines & Opportunities)

**What changed:**
- Tasks tagged with education standards can auto-create `standard_evidence` links upon completion.
- Sequential Collection task completions can auto-generate portfolio feed entries: "[Student] completed [Task Name]." This is a configurable behavior — mom can enable/disable.
- Task completion already triggers `homeschool_time_logs` (PRD-28). Now those log entries can also generate `family_moments` (portfolio-tagged) for visual display.

**Action needed:**
- Add optional `standards_tags` field to tasks (or use existing `subject_tags` with a mapping layer to `education_standards`).
- Add auto-portfolio-generation toggle to task/Sequential Collection configuration.
- Note the task completion → portfolio moment auto-generation flow.

---

## Impact on PRD-10 (Widgets, Trackers & Dashboard Layout)

**What changed:**
- Log Learning widget (PRD-28) now also appears on the Homeschool Portfolio Feed view (same widget, second surface).
- Widget data points from behavioral tracking widgets are consumed by PRD-28B's SDS/disability reporting templates.

**Action needed:**
- Note the Log Learning widget's dual placement: kid's dashboard + portfolio feed view.
- Note behavioral tracking widget data as a reporting data source.

---

## Impact on PRD-11 (Victory Recorder)

**What changed:**
- New victory source: `source = 'family_feed'` from "Celebrate This!" on feed moments.
- Portfolio entries and Log Learning submissions can also trigger victories (existing `source = 'homeschool_logged'` from PRD-28, plus new feed-originated victories).

**Action needed:**
- Add `'family_feed'` to `victories.source` enum values.

---

## Impact on PRD-13 (Archives & Context)

**What changed:**
- All feed moments flow into Archives as family context. LiLa can reference feed content when assembling context for conversations.
- Generated reports (from PRD-28B) stored in member's Archive folder as `archive_context_items` with `context_type = 'generated_report'` (existing pattern from PRD-19).

**Action needed:**
- Note `family_moments` as a new source for Archive context items.
- No schema changes — the existing `archive_context_items` pattern handles this.

---

## Impact on PRD-14D (Family Hub)

**What changed:**
- "Recent Moments" widget added to the Family Hub widget registry. Shows 3-5 most recent Family Feed posts in compact card format.
- [See All] link on the widget navigates to the Feeds page.
- Family Feed photos can serve as a content source for the Family Hub Slideshow Frame feature.

**Action needed:**
- Add "Recent Moments" to available Hub widget types.
- Add Family Feed as a Slideshow Frame content source option.

---

## Impact on PRD-15 (Messages, Requests & Notifications)

**What changed:**
- Out of Nest members gain Family Feed access beyond messaging. Their experience expands from messaging-only to feed + messaging.
- `out_of_nest_feed_settings` table extends the Out of Nest member model with per-member feed visibility and posting configuration.
- New notification category: `'reporting_reminder'` for homeschool compliance reporting schedule reminders.
- `'family_feed_post'` notification type for pending post approvals.

**Action needed:**
- Note expanded Out of Nest feature scope.
- Add `out_of_nest_feed_settings` reference to Out of Nest management screens.
- Add `'reporting_reminder'` to notification category enum.
- Add `'family_feed_post'` to notification type for post approval alerts.

---

## Impact on PRD-17 (Universal Queue)

**What changed:**
- `'family_feed_post'` added as a queue source for post approval routing. When mom has enabled approval for a child, their feed posts arrive in the Requests tab.
- Post approval actions: Approve, Edit & Approve, Reject — following standard Universal Queue patterns.

**Action needed:**
- Add `'family_feed_post'` to `universal_queue_items.source` enum.
- Define the approval card UI for feed posts in the Requests tab.

---

## Impact on PRD-17B (MindSweep)

**What changed:**
- Feed routing added to MindSweep classification. Captures can be classified and routed to:
  - Family Feed ("This sounds like a family memory")
  - Homeschool Portfolio ("This sounds like a learning activity")
  - Existing destinations (tasks, journal, lists, etc.)
- Classification uses the same embedding-first pattern.

**Action needed:**
- Add "Family Feed" and "Homeschool Portfolio" to MindSweep routing destinations.
- Add feed-related classification examples to the embedding training set.

---

## Impact on PRD-19 (Family Context & Relationships)

**What changed:**
- `generated_reports.template_type` enum extended with 16+ new values for all new template types.
- Report Generation page (Screen 5) extended with category dropdown and template browsing within categories.
- Reports Page (Screen 6) gains additional filter options for new report categories.
- `monthly_data_aggregations` now includes feed activity metrics (post counts, reaction counts) alongside existing data.
- Forward note on PRD-19 Screen 5 ("full reports system will be refined") is now resolved by PRD-28B.

**Action needed:**
- Update `generated_reports.template_type` enum with all new values.
- Add category dropdown to Report Generation page (Screen 5).
- Add feed metrics to `monthly_data_aggregations.aggregation_data` JSONB structure.
- Mark forward note on Screen 5 as resolved by PRD-28B.

---

## Impact on PRD-22 (Settings)

**What changed:**
- **Homeschool Configuration** section extended with: state, school year dates, evaluator info, ESA program selection, reporting schedule with reminder configuration.
- **Feed Settings** section added: per-member post approval toggles, Out of Nest feed visibility/posting configuration.
- **Generate Invoice** quick action added to Homeschool Configuration.
- **View Standards Portfolio** quick action added to Homeschool Configuration.

**Action needed:**
- Add extended fields to Homeschool Configuration screen.
- Add Feed Settings section to Settings category navigation.
- Add quick-action buttons for Invoice and Standards Portfolio.

---

## Impact on PRD-28 (Tracking, Allowance & Financial)

**What changed:**
- **Deferred item #3 (Compliance reporting UI) fully resolved by PRD-28B.** The compliance reporting system is now a full PRD addendum.
- `homeschool_family_config` and `homeschool_student_config` tables extend the homeschool configuration with compliance-specific fields (state, grade, standards, evaluator, ESA program, reporting schedule).
- Log Learning widget entries can auto-generate portfolio feed moments in PRD-37.
- Portfolio feed entries are now a visual complement to `homeschool_time_logs` — same data, different presentation layer.

**Action needed:**
- Mark Deferred item #3 as resolved: "Resolved by PRD-28B (Compliance & Progress Reporting)."
- Note `homeschool_family_config` and `homeschool_student_config` as companion tables to existing `homeschool_configs`.
- Note portfolio feed (PRD-37) as a visual consumer of `homeschool_time_logs` data.

---

## Impact on Build Order Source of Truth v2

**What changed:**
- **PRD-37 (Family Feeds)** added to build order. Build BEFORE PRD-28B.
- **PRD-28B (Compliance & Progress Reporting)** added to build order. Build AFTER PRD-37.
- Both belong in the "Platform Complete" wave alongside PRD-27 and PRD-28.
- Side quest "Homeschool compliance reporting (PRD-28)" resolved — no longer a side quest.

**Action needed:**
- Add PRD-37 and PRD-28B to the build order.
- Remove "Homeschool compliance reporting" from Side Quests list.
- Note build dependency: PRD-37 before PRD-28B.

---

## New Tables Summary

| Table | PRD | Purpose |
|-------|-----|---------|
| `family_moments` | PRD-37 | Core feed content — all posts/moments |
| `moment_media` | PRD-37 | Media attachments for moments |
| `moment_reactions` | PRD-37 | Heart reactions |
| `moment_comments` | PRD-37 | Comments on moments |
| `out_of_nest_feed_settings` | PRD-37 | Per-Out-of-Nest-member feed configuration |
| `feed_approval_settings` | PRD-37 | Per-member post approval toggle |
| `homeschool_family_config` | PRD-28B | Family-level compliance configuration |
| `homeschool_student_config` | PRD-28B | Per-student compliance configuration |
| `education_standards` | PRD-28B | Imported/generated educational standards (system-level) |
| `standard_evidence` | PRD-28B | Links between standards and evidence items |
| `report_templates` | PRD-28B | Report template definitions (data, not code) |
| `esa_invoices` | PRD-28B | Generated ESA invoices |

**Total new tables: 12**

---

## New Guided Modes

| Mode | PRD | Purpose |
|------|-----|---------|
| `homeschool_bulk_summary` | PRD-37 | Parse mom's voice/text dump into organized portfolio entries |
| `homeschool_report_generation` | PRD-28B | Generate report content from template + data |

---

## New Feature Keys

| Key | PRD | Tier |
|-----|-----|------|
| `family_feed_basic` | PRD-37 | Essential |
| `family_feed_portfolio` | PRD-37 | Enhanced |
| `family_feed_bulk_summary` | PRD-37 | Full Magic |
| `family_feed_auto_tagging` | PRD-37 | Full Magic |
| `family_feed_out_of_nest` | PRD-37 | Enhanced |
| `family_feed_approval` | PRD-37 | Essential |
| `family_feed_export` | PRD-37 | Enhanced / Full Magic |
| `compliance_basic_reports` | PRD-28B | Enhanced |
| `compliance_ai_reports` | PRD-28B | Full Magic |
| `compliance_standards_tracking` | PRD-28B | Enhanced |
| `compliance_standards_suggestions` | PRD-28B | Full Magic |
| `compliance_esa_invoice` | PRD-28B | Essential |
| `compliance_reporting_schedule` | PRD-28B | Enhanced |
| `compliance_newsletter` | PRD-28B | Full Magic |
| `compliance_sds_reports` | PRD-28B | Enhanced / Full Magic |

---

*End of PRD-37 + PRD-28B Cross-PRD Impact Addendum*
