# PRD-17B Cross-PRD Impact Addendum

**Created:** March 16, 2026
**Session:** PRD-17B (MindSweep)
**Purpose:** Documents how PRD-17B decisions affect prior PRDs and establishes new connections.

---

## Impact on PRD-01 (Auth & Family Setup)

**What changed:**
- `families` table gets two new columns: `sweep_email_address` (TEXT, nullable) and `sweep_email_enabled` (BOOLEAN, default false). Generated on family creation, dormant until mom enables.
- `mindsweep_settings` record auto-created for Mom, Dad, and Independent members during setup (default: `aggressiveness = 'always_ask'`).
- Mom and Dad's registered email addresses auto-added to `mindsweep_allowed_senders` on family creation.

**Action needed:**
- Add `sweep_email_address` and `sweep_email_enabled` columns to `families` table schema in PRD-01.
- Add `mindsweep_settings` creation to the member setup sequence alongside Backburner list creation.
- Add `mindsweep_allowed_senders` seed for Mom and Dad emails.
- Note MindSweep PWA home screen prompt as a post-setup onboarding consideration.

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- MindSweep quick-capture available via QuickTasks strip. No special placement needed — existing auto-sort by usage frequency handles positioning.
- QuickTasks strip now has MindSweep alongside existing buttons (Tasks, Victory, Backburner, Review Queue, etc.).

**Action needed:**
- Add MindSweep to the QuickTasks button catalog with Lucide `Wand2` icon and "MindSweep" label.
- Note that the quick-capture modal opened from QuickTasks is the same minimal interface as the `/sweep` PWA entry point.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- New Edge Function: `mindsweep-sort` — extraction + classification + confidence scoring + routing. Uses Haiku-equivalent model via OpenRouter with Sonnet fallback for complex inputs.
- New Edge Function: `mindsweep-email-intake` — email parsing, sender verification, content cleaning, feeds `mindsweep-sort`.
- LiLa conversations now support "MindSweep this" as a trigger phrase that routes conversation content through `mindsweep-sort`.

**Action needed:**
- Add `mindsweep-sort` and `mindsweep-email-intake` to the Edge Function registry.
- Add "MindSweep this" as a recognized action trigger in LiLa conversations.
- Note cost estimates: ~$0.005-0.02 per sweep event.

---

## Impact on PRD-08 (Journal + Smart Notepad)

**What changed:**
- "MindSweep" added as a routing destination in the "Send to..." RoutingStrip grid (Lucide `Wand2`).
- MindSweep is the third routing paradigm alongside "Send to → [destination]" (manual) and "Review & Route" (semi-manual).
- Smart Notepad tab content is the primary input for MindSweep when accessed from the RoutingStrip.
- The Smart Notepad is also the default input surface for the quick-capture PWA entry point.

**Action needed:**
- Add MindSweep tile to the RoutingStrip destination catalog in PRD-08.
- Update the routing paradigm description to include MindSweep as the auto-sort option.
- Note that the quick-capture PWA embeds a minimal Notepad instance.

---

## Impact on PRD-14B (Calendar)

**What changed:**
- MindSweep can auto-detect calendar events in mixed content and route them through the existing `calendar-parse-event` Edge Function.
- Email-forwarded content containing dates/events follows the same image-to-event and text-to-event flows already defined in PRD-14B.
- Calendar events created by MindSweep carry `source_type = 'mindsweep'` (new value for the `event_source` enum).

**Action needed:**
- Add `'mindsweep'` to the `event_source` enum/CHECK values on `calendar_events.source_type`.
- Note that MindSweep-created events follow the same approval flow (pending_approval for kid-created events, approved for mom).

---

## Impact on PRD-15 (Messages, Requests & Notifications)

**What changed:**
- Cross-member MindSweep routing creates notification records for the target member: "Mom's MindSweep sent you: [item description]."
- Items routed to another member's queue via MindSweep use the existing `member_request` pattern with `source = 'mindsweep_auto'`.

**Action needed:**
- Add MindSweep as a notification source type.
- Note that cross-member MindSweep items appear in the target member's Requests tab with clear attribution.

---

## Impact on PRD-17 (Universal Queue & Routing System)

**What changed:**
- `studio_queue` table gets two new columns: `mindsweep_confidence` (TEXT, nullable) and `mindsweep_event_id` (UUID, nullable).
- Four new `source` values added to the CHECK constraint: 'mindsweep_auto', 'mindsweep_queued', 'email_forward', 'share_to_app'.
- MindSweep tile added to the RoutingStrip destination catalog.
- Queue items from MindSweep display their confidence level as a visual indicator (subtle high/medium/low badge) to help mom understand why an item was queued vs. auto-routed.
- PRD-17's post-MVP items "LiLa auto-routing" and "Smart defaults" are now wired by MindSweep.

**Action needed:**
- Add columns to `studio_queue` schema.
- Update `source` CHECK constraint.
- Add MindSweep to RoutingStrip catalog.
- Move "LiLa auto-routing" and "Smart defaults" from post-MVP to "Wired by PRD-17B" in stubs section.

---

## Impact on PRD-18 (Rhythms & Reflections)

**What changed:**
- New section type #28 "MindSweep Digest" added to the Section Type Library.
- Available in: Morning, Evening, Weekly, Custom rhythms.
- Data source: `mindsweep_events` aggregated by time period.
- Default: enabled in Morning, Evening, and Weekly rhythms for Mom (configurable in MindSweep Settings).

**Action needed:**
- Add section type #28 to the Section Type Library table.
- Add MindSweep Digest to default section lists for Morning (after Task Preview), Evening (after Victory Summary), and Weekly (after Weekly Stats).

---

## Impact on PRD-22 (Settings)

**What changed:**
- New "MindSweep" section in Settings containing: aggressiveness mode, always-review rules, email forwarding configuration, allowed senders management, share-to-app toggle, digest preferences, and home screen shortcut prompt.

**Action needed:**
- Add MindSweep settings section to PRD-22's settings page layout.

---

## Impact on Backburner Feature Addendum

**What changed:**
- MindSweep can auto-route "someday/maybe" items to Backburner based on content classification (detects "not now but not never" language patterns like "I should start thinking about...", "someday we should...", "it would be nice to...").
- Backburner is a valid MindSweep routing destination alongside all other RoutingStrip destinations.

**Action needed:**
- Note in Backburner Addendum that MindSweep is an additional entry point for Backburner items, with AI auto-categorization applied on arrival (same as all other Backburner entry points).

---

## Impact on PRD-33 (Offline / PWA)

**What changed:**
- Quick-capture PWA entry point (`/sweep`) requires its own web manifest with distinct `start_url`, icon, and `name` field.
- Offline capture queue (IndexedDB) must handle voice blobs, text, and image attachments with sync-on-connectivity behavior.
- Share-to-app (Web Share Target API) registration requires service worker configuration.

**Action needed:**
- Add MindSweep quick-capture PWA manifest to PRD-33 scope.
- Add offline capture queue to PRD-33's IndexedDB sync specifications.
- Add Web Share Target API registration to service worker scope.

---

## Impact on Remaining PRDs Ordered Doc

**What changed:**
- PRD-17B (MindSweep) is a new PRD. Add to completed list.
- "SMS/email capture channels" side quest (attached to PRD-15) is partially absorbed: email forwarding is fully specified in PRD-17B. SMS remains deferred as a post-MVP side quest.
- "External calendar sync" side quest (attached to PRD-14B) remains unchanged — Google Calendar sync is separate from MindSweep.

**Action needed:**
- Add PRD-17B to completed PRDs list.
- Update "SMS/email capture channels" side quest to note email forwarding is now in PRD-17B; only SMS remains.
- Update completed PRD count.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-17B completed. Depends on PRD-17 and PRD-08 being built first. Can be built alongside or after PRD-18 (for digest integration).
- Email forwarding infrastructure (DNS, webhook service) is a deployment task, not a build task — can be enabled post-deploy.
- Share-to-app requires service worker (PRD-33 dependency) but basic capture works without it.

**Action needed:**
- Add PRD-17B to Build Order. Recommended placement: after PRD-17 in the same build section, since they share schema and pipeline.

---

*End of PRD-17B Cross-PRD Impact Addendum*
