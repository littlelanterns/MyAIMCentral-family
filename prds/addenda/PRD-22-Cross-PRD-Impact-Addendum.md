# PRD-22 Cross-PRD Impact Addendum
## Settings — Impact on Other PRDs

**Created:** March 15, 2026
**Parent PRD:** PRD-22 (Settings)

---

## Impact on PRD-01 (Auth & Family Setup)

**What changed:**
- New `member_emails` table enables multi-email per member. Login resolution must now check `member_emails` for any verified email matching a login attempt, in addition to the existing `auth.users.email` check.
- Account deletion with 30-day soft-delete grace period defined. New `account_deletions` table tracks deletion state. Mom's deletion cascades to entire family. Non-mom member deletion removes only their records.
- Family Management post-onboarding is confirmed as living in Settings (PRD-22 Screen 3). PRD-01's onboarding flow remains the first-time setup path. After `families.setup_completed = true`, all member management happens in Settings.

**Action needed:**
- Update login resolution logic to include `member_emails` lookup: on login attempt, check `auth.users.email` first, then `member_emails.email WHERE is_verified = true` to resolve the `auth_user_id`.
- Note `account_deletions` table and the scheduled `process_expired_deletions` job.
- Note that PRD-01's Screen 7 (MyFamily/Family Setup) is for first-time onboarding only. Settings Screen 3 is the ongoing management experience.

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- Permission Hub (Screens 1–6) is formally embedded within the Settings overlay (PRD-22 Screen 6 → "Open Permission Hub"). The Permission Hub renders within Settings overlay context — it is not a separate page.
- Teen Transparency Panel (PRD-02 Screen 4) is accessible from Settings → Privacy & Permissions for Independent members.
- Dad's read-only permission view (PRD-02 Screen 2 in read mode) is accessible from Settings → Privacy & Permissions for Additional Adults.

**Action needed:**
- No spec changes to PRD-02 screens. They render identically within the Settings overlay.
- Note that Permission Hub has two entry points: from Settings → Privacy & Permissions, and from any direct link that referenced "MyFamily settings area" (which is now Settings).
- Update PRD-02 Screen 1 description: "Accessible from ~~MyFamily settings area~~ Settings → Privacy & Permissions."

---

## Impact on PRD-03 (Design System & Themes)

**What changed:**
- **Name Packs removed from the platform.** Features have fixed display names across all vibes. The independence model is now theme + vibe + gradient + dark mode (4 axes, not 5). Any references to Name Packs in PRD-03 should be removed.
- Theme Settings screen (PRD-03 Screen 1) is formally embedded in Settings overlay as PRD-22 Screen 4.
- Mom can manage themes for Guided/Play members from Settings → Appearance.

**Action needed:**
- Remove any Name Pack references from PRD-03 (Section: "Vibe + Theme + Gradient + Name Pack Independence" → update to "Vibe + Theme + Gradient Independence" with 3 axes instead of 4).
- Note Settings → Appearance as the formal home for PRD-03 Screen 1.
- Add Name Packs to the Build Order Source of Truth Section 5 (Features Removed) with rationale: "Added confusion with minimal value. Vibes carry visual personality without renaming features."

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- Gear icon (⚙️) in shell header is confirmed as the trigger for the Settings full-screen overlay. Settings is NOT a route — no `/settings` URL exists. The overlay renders on top of the current page and closes back to it.
- Gear icon visibility per shell: visible in Mom, Adult, Independent, Special Adult (during shift only), Guided (if mom permits appearance changes). Hidden in Play shell.

**Action needed:**
- Update shell header component spec to note: gear icon triggers a full-screen overlay (not navigation). The overlay is rendered by a root-level `<SettingsOverlay>` component that sits outside the shell layout routing.
- Note gear icon visibility rules per shell (matches PRD-22 Visibility & Permissions table).
- No route registration needed for Settings — it's not in the sidebar nav or URL routing.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- New `lila_member_preferences` table stores per-member LiLa interaction preferences: tone ('warm', 'professional', 'casual'), response_length ('concise', 'balanced', 'detailed'), history_retention ('forever', '90_days', '30_days', '7_days').
- These preferences must be loaded and passed as metadata in every LiLa API call for the requesting member.
- History retention setting triggers auto-archiving of `lila_conversations` older than the retention period. Archived conversations are moved to an inactive state (not hard-deleted) and do not appear in the conversation list.
- Context Settings panel (the three-tier checkbox tree) is formally accessible from Settings → LiLa Preferences → "Manage what LiLa knows about your family."
- Mom can set LiLa preference defaults for kids who have LiLa access.

**Action needed:**
- Register `lila_member_preferences` as a required metadata source for all LiLa interactions. The tone and response_length values should be incorporated into LiLa's system prompt dynamically (e.g., "Respond in a warm tone. Keep responses balanced in length.").
- Implement history retention auto-archive: scheduled job or on-access check that moves conversations past the retention period to `status = 'archived'`. Archived conversations remain in the table but are excluded from conversation list queries.
- Note Context Settings panel has a formal entry point from Settings overlay (in addition to the context indicator in the LiLa drawer input area).
- Note kid defaults: if a kid doesn't have their own `lila_member_preferences` record, fall back to the defaults mom set. If no defaults, use system defaults (warm, balanced, forever).

---

## Impact on PRD-13 (Archives & Context)

**What changed:**
- Faith preferences configuration is linked from Settings → Privacy & Permissions → "Manage faith frameworks." This is a navigation link, not a duplicate UI.
- Multiple faith frameworks per family is explicitly confirmed as a supported configuration.

**Action needed:**
- Verify that the faith preferences UI in Archives supports adding, editing, and removing multiple faith framework configurations per family (not just one).
- Note Settings → Privacy & Permissions as a navigation entry point to faith preferences.

---

## Impact on PRD-14B (Calendar)

**What changed:**
- Calendar Settings screen (PRD-14B Screen 7) is formally embedded in the Settings overlay as PRD-22 Screen 8. No changes to the screen spec — it renders identically.
- Calendar Settings now has two entry points: the Calendar page toolbar gear icon (PRD-14B) and Settings overlay → Calendar (PRD-22).

**Action needed:**
- Note the dual entry point. Both should render the same component.
- No spec changes to PRD-14B Screen 7.

---

## Impact on PRD-15 (Messages, Requests & Notifications)

**What changed:**
- Messaging Settings screen (PRD-15 Screen 6) is formally embedded in the Settings overlay as PRD-22 Screen 9. No changes to the screen spec.
- Notification Preferences screen (PRD-15 Screen 10) is formally embedded in the Settings overlay as PRD-22 Screen 5. No changes to the screen spec.
- Out of Nest member management is accessible from Settings → Family Management (PRD-22 Screen 3) in addition to the link in Messaging Settings.
- Settings → Family Management is the primary location for adding/editing/removing Out of Nest members. Messaging Settings provides a convenience link.
- Out of Nest notification method configuration added: email notifications at MVP (sends message preview + link when new messages arrive in their assigned spaces), SMS notifications post-MVP (toggle visible but disabled, phone number field wired). This extends the `out_of_nest_members` table with `phone_number` (TEXT, nullable) and `notification_methods` (JSONB, default `'["email"]'`).

**Action needed:**
- Note dual entry points for Messaging Settings (Messages gear icon + Settings overlay) and Notification Preferences (notification tray gear icon + Settings overlay). Both render the same components.
- Note that Out of Nest member CRUD lives in Settings → Family Management. Messaging Settings → "Out of Nest Members" link should navigate to that section of Settings.
- Add `phone_number` (TEXT, nullable) and `notification_methods` (JSONB, default `'["email"]'`) columns to `out_of_nest_members` table.
- Implement email notification trigger: when a new `messages` record is created in a conversation space that an Out of Nest member belongs to, send an email notification with message preview and login link. Use the same email sending infrastructure as invitation emails.
- No spec changes to PRD-15 Screens 6 or 10.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-22 completed. 4 new tables: `member_emails`, `lila_member_preferences`, `data_exports`, `account_deletions`.
- Name Packs removed as a platform feature.
- Settings overlay established as a platform-level UI pattern (full-screen overlay, not a route).
- Settings confirmed as the post-onboarding home for Family Management (standalone Family Management Page remains removed per Build Order Section 5).

**Action needed:**
- Move PRD-22 to Section 2 (Completed PRDs).
- Add to Section 5 (Features Removed): "Name Packs — Added confusion with minimal value. Vibes carry visual personality without renaming features. Removed March 15, 2026 session."
- Note in Section 11 (Known Inconsistencies): any PRD-03 references to Name Packs need updating during audit.
- Note `member_emails` in the Auth tables group and `lila_member_preferences` in the AI System tables group.

---

*End of PRD-22 Cross-PRD Impact Addendum*
