# PRD-22: Settings

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-14B (Calendar), PRD-15 (Messages, Requests & Notifications)
**Created:** March 15, 2026
**Last Updated:** March 15, 2026

---

## Overview

PRD-22 defines the Settings experience — the single place where every family member configures their MyAIM Family experience. Settings is a full-screen overlay (not a separate route) triggered by the gear icon in the shell header. It contains category-based navigation with sections for Account, Family Management, Appearance, Notifications, Privacy & Permissions, LiLa Preferences, Calendar, Messaging, Subscription & Billing, and Data Export.

Settings consolidates configuration that was partially defined across many earlier PRDs. PRD-02 defined the Permission Hub. PRD-03 defined theme selection. PRD-14B defined Calendar Settings. PRD-15 defined Messaging Settings and Notification Preferences. Rather than redefining those screens, PRD-22 establishes Settings as the unified entry point that embeds or navigates to each of those existing specifications, and fills the gaps they didn't cover — Account management, Family Management (the ongoing counterpart to PRD-01's onboarding), LiLa interaction preferences, Subscription status, and Data Export.

Settings is a family member feature accessible from the shell header. It is NOT part of the admin console (`/admin`). Each member role sees a role-appropriate subset of settings categories.

> **Mom experience goal:** Settings should feel like a well-organized control panel for my family's digital home — everything in one place, nothing hidden, nothing confusing. I can find any setting in two taps. Changing something for my family feels like adjusting the thermostat, not programming a computer.

> **Depends on:** PRD-01 (Auth & Family Setup) — member records, family structure, subscription tables. PRD-02 (Permissions & Access Control) — Permission Hub screens, PermissionGate pattern. PRD-03 (Design System & Themes) — theme/vibe system, `theme_preferences` JSONB. PRD-04 (Shell Routing & Layouts) — shell header gear icon, overlay/modal rendering. PRD-05 (LiLa Core AI System) — context settings screen, LiLa conversation storage. PRD-14B (Calendar) — Calendar Settings screen. PRD-15 (Messages, Requests & Notifications) — Messaging Settings screen, Notification Preferences screen, Out of Nest member management.

---

## User Stories

### Account Management
- As any member with a full login account, I want to update my display name, email, and avatar from one place so I don't have to hunt through the app.
- As mom, I want to add secondary email addresses to my account so the system recognizes me regardless of which email I use.
- As any member with a password, I want to change my password from Settings so I don't have to go through a reset flow.
- As mom, I want to delete my family account with clear warnings and a grace period so I can undo it if I change my mind.
- As dad or a teen, I want to remove my own account from the family without affecting anyone else.

### Family Management
- As mom, I want to manage all family members from Settings — add new members, edit names and roles, remove members, generate invite links — so there's one place for all of that after initial setup.
- As mom, I want to manage Out of Nest members (add, remove, configure which conversation spaces they can access) from the same Family Management area.
- As mom, I want to change the Family Login Name and family display name from Settings.
- As mom, I want to reset any family member's PIN from Settings so I don't have to remember their current one.

### Appearance
- As any member (except Play), I want to change my theme, vibe, gradient toggle, dark mode, and font size from a single Appearance section in Settings.
- As mom, I want to set themes for Guided and Play members from Settings.
- As mom, I want to assign member colors for calendar and family views.

### Notifications
- As any member, I want to control which notification categories I receive so I'm not overwhelmed.
- As mom, I want Do Not Disturb to mute everything except safety alerts.

### Privacy & Permissions
- As mom, I want to access the full Permission Hub from within Settings so I can manage who sees what without leaving the settings experience.
- As mom, I want to control whether anonymized usage data is collected.

### LiLa Preferences
- As any member with LiLa access, I want to set my preferred conversation tone, response length, and history retention so LiLa feels personalized.
- As mom, I want to set LiLa preference defaults for my kids.

### Calendar & Messaging
- As any member, I want to access Calendar Settings and Messaging Settings from within the Settings overlay so I don't have to navigate to those features first.

### Subscription
- As mom, I want to see my current subscription status and know when billing features will be available.

### Data Export
- As mom, I want to download all my family's data as a ZIP file so I have a copy of everything we've put into the system.

---

## Screens

### Screen 1: Settings Overlay — Category Navigation

**What the user sees:**

A full-screen overlay triggered by the gear icon (⚙️) in the shell header, positioned in the top-right area near the notification bell and member avatar. The overlay slides up from below (mobile) or appears as a large centered modal (desktop/tablet).

**Mobile layout:**
```
┌─────────────────────────────────────────┐
│  Settings                            ✕  │
│  ─────────────────────────────────────  │
│  [👤] Account                        →  │
│  [👥] Family Management              →  │
│  [🎨] Appearance                     →  │
│  [🔔] Notifications                  →  │
│  [🔒] Privacy & Permissions          →  │
│  [✨] LiLa Preferences               →  │
│  [📅] Calendar                       →  │
│  [💬] Messaging                      →  │
│  [💳] Subscription & Billing         →  │
│  [📦] Data Export                    →  │
│  ─────────────────────────────────────  │
│  [Sign Out]                             │
│  ─────────────────────────────────────  │
│  v2.0.0 · Three Little Lanterns LLC     │
└─────────────────────────────────────────┘
```
(Icons above are illustrative — actual implementation uses Lucide icons per PRD-03 emoji policy. No Unicode emoji in Mom/Adult/Independent shells.)

Tapping any category navigates into that section (slides right). Back arrow returns to category list.

**Desktop/tablet layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Settings                                            ✕  │
│  ┌──────────────┬────────────────────────────────────┐  │
│  │ Account      │                                    │  │
│  │ Family Mgmt  │  [Selected category content        │  │
│  │ Appearance   │   renders here]                    │  │
│  │ Notifications│                                    │  │
│  │ Privacy      │                                    │  │
│  │ LiLa         │                                    │  │
│  │ Calendar     │                                    │  │
│  │ Messaging    │                                    │  │
│  │ Subscription │                                    │  │
│  │ Data Export  │                                    │  │
│  │              │                                    │  │
│  │ [Sign Out]   │                                    │  │
│  └──────────────┴────────────────────────────────────┘  │
│  v2.0.0 · Three Little Lanterns LLC                     │
└─────────────────────────────────────────────────────────┘
```

Left sidebar shows categories; right pane shows the selected category's content. First category (Account) is selected by default.

**Role-based category visibility:**

| Category | Mom | Dad | Special Adult | Independent (Teen) | Guided | Play |
|----------|-----|-----|---------------|-------------------|--------|------|
| Account | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Family Management | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Appearance | ✓ | ✓ | ✓ | ✓ | Limited | ✗ |
| Notifications | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Privacy & Permissions | ✓ | Read Own | ✗ | Read Own | ✗ | ✗ |
| LiLa Preferences | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Calendar | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ |
| Messaging | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Subscription & Billing | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Data Export | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

> **Decision rationale:** Dad sees his own LiLa, appearance, notifications, and calendar preferences but cannot manage family-level settings. Teens see their own appearance, notification, LiLa, and calendar preferences plus the transparency panel (Privacy — Read Own). Guided members see only a simplified appearance section (dark mode toggle + font size, if mom permits). Play members have no settings access — mom manages everything for them.

**Interactions:**
- ✕ button closes the overlay, returning to the page the user was on
- Escape key also closes (desktop)
- Swipe down from top also closes (mobile)
- Sign Out button with confirmation dialog: "Are you sure you want to sign out?"

---

### Screen 2: Account Settings

**What the user sees:**

```
┌─────────────────────────────────────────┐
│  ← Account                              │
│  ─────────────────────────────────────  │
│  Profile                                │
│  Display Name: [Tenise            ]     │
│  Avatar: [Current avatar] [Change]      │
│  ─────────────────────────────────────  │
│  Email Addresses                        │
│  ★ tenise@primary.com (primary)         │
│    tenise@second.com     [✕ remove]     │
│    tenise@third.com      [✕ remove]     │
│  [+ Add Email Address]                  │
│  ─────────────────────────────────────  │
│  Security                               │
│  [Change Password →]                    │
│  ─────────────────────────────────────  │
│  Account Actions                        │
│  [Delete My Account →]                  │
│  ─────────────────────────────────────  │
└─────────────────────────────────────────┘
```

**Profile section:**
- Display Name: inline editable text field. Auto-saves on blur.
- Avatar: current avatar image with "Change" button. Opens image picker (upload from device or choose from avatar library). Uploaded to Supabase Storage. URL saved to `family_members.avatar_url`.

**Email Addresses section:**
- Lists all verified emails. Primary email has a ★ indicator and "(primary)" label.
- "Add Email Address" opens an inline form: enter email → system sends verification email → once verified, email appears in the list.
- Any non-primary email can be removed with the ✕ button (with confirmation).
- Tap any non-primary email to set it as primary (with confirmation). This changes the login email.
- Primary email cannot be removed — must first designate another email as primary.

**Security section:**
- "Change Password" opens a form: Current Password, New Password, Confirm New Password. Standard validation (min 8 chars, passwords match). On success: "Password changed successfully."

**Account Actions — Delete My Account:**

For **mom (primary parent):**
- Warning: "Deleting your account will delete your entire family's data. All family members will lose access. This cannot be undone after the grace period."
- Confirmation flow: type "DELETE" → re-enter password → confirm
- Account enters soft-delete state for 30 days. During this period, logging back in reactivates the account with all data intact.
- After 30 days: hard delete of all family data.
- Separate link: "Just want to download your data first?" → links to Data Export section.

For **non-mom members (dad, teen):**
- Warning: "This will remove your account from [Family Name]. Your personal data (journal, goals, etc.) will be deleted. Family shared data (tasks you created, messages) will be preserved."
- Confirmation: re-enter password → confirm
- Removes `family_members` record, `auth.users` record (if they have one), and all personal data. Family-level records they contributed to remain.

> **Decision rationale:** Mom's deletion removes the whole family because mom IS the family owner — there's no orphaned family. But the 30-day grace period makes it easy to come back. Non-mom members can leave without damaging the family structure.

**Data created/updated:**
- `family_members` (display_name, avatar_url)
- `member_emails` (new table — add/remove/set primary)
- `auth.users` (password change, account deletion)

---

### Screen 3: Family Management

**What the user sees (mom only):**

```
┌─────────────────────────────────────────┐
│  ← Family Management                    │
│  ─────────────────────────────────────  │
│  Family Identity                        │
│  Family Name: [The Wertman Family  ]    │
│  Family Login Name: [wertmans      ]   │
│  ─────────────────────────────────────  │
│  Family Members                         │
│  ┌─────────────────────────────────┐    │
│  │ [👤] Tenise — Mom (You)        │    │
│  │ [👤] [Husband] — Dad        [⚙]│    │
│  │ [👤] Jake — Independent     [⚙]│    │
│  │ [👤] Emma — Guided          [⚙]│    │
│  │ [👤] Ruthie — Guided        [⚙]│    │
│  │ [👤] ... (all members)      [⚙]│    │
│  └─────────────────────────────────┘    │
│  [+ Add Family Member]                  │
│  ─────────────────────────────────────  │
│  Out of Nest                            │
│  ┌─────────────────────────────────┐    │
│  │ [👤] Grandma Jean           [⚙]│    │
│  │ [👤] Uncle Rob              [⚙]│    │
│  └─────────────────────────────────┘    │
│  [+ Add Out of Nest Member]             │
│  ─────────────────────────────────────  │
│  Member Colors                          │
│  [Manage member color assignments →]    │
│  ─────────────────────────────────────  │
│  Tablet / Family Device                 │
│  Hub timeout: [Never ▾]                 │
│  [Manage Hub Widgets →]                 │
│  ─────────────────────────────────────  │
└─────────────────────────────────────────┘
```

**Family Identity:**
- Family Name and Family Login Name are inline editable. Auto-save on blur.
- Family Login Name validates uniqueness (case-insensitive).
- Updates `families.family_name` and `families.family_login_name`.

**Family Members list:**
- Shows all active `family_members` records grouped by role: Mom first, then Additional Adults, then children by dashboard_mode (Independent, Guided, Play).
- Each card shows: avatar, display name, role label, dashboard mode badge.
- ⚙ button on each member opens **Member Detail** (Screen 3A).
- "+ Add Family Member" opens the same add-member flow from PRD-01 (natural language bulk add or form-based individual add). After onboarding, this is where new members are added.

**Out of Nest section:**
- Lists `out_of_nest_members` records.
- ⚙ button opens Out of Nest detail (Screen 3B).
- "+ Add Out of Nest Member" opens a form: Name, Email, Relationship, which conversation spaces they can access.

> **Depends on:** PRD-15 (Messages, Requests & Notifications) — Out of Nest member table and conversation space access model. PRD-01 (Auth & Family Setup) — member creation flows.

**Member Colors:**
- Links to the Member Color Assignment screen defined in PRD-03 Screen 2.

**Tablet / Family Device:**
- Hub timeout dropdown (never, 15min, 30min, 1hr, 4hr). Updates `families.tablet_hub_timeout`.
- "Manage Hub Widgets" links to the hub widget configuration (PRD-14D).

---

### Screen 3A: Family Member Detail (Mom Editing a Member)

**What the user sees:**

```
┌─────────────────────────────────────────┐
│  ← Jake                                 │
│  ─────────────────────────────────────  │
│  Profile                                │
│  Display Name: [Jake               ]    │
│  Nicknames: [Jakey, J-man          ]    │
│  Date of Birth: [03/15/2012        ]    │
│  Avatar: [Current] [Change]             │
│  ─────────────────────────────────────  │
│  Role & Access                          │
│  Role: Member                           │
│  Dashboard Mode: [Independent ▾]        │
│  Auth Method: [PIN ▾]                   │
│  [Reset PIN →]                          │
│  ─────────────────────────────────────  │
│  Login Access                           │
│  Dashboard Enabled: [ON]                │
│  Out of Nest: [OFF]                     │
│  ─────────────────────────────────────  │
│  Invitation                             │
│  Status: Accepted                       │
│  [Generate New Invite Link →]           │
│  ─────────────────────────────────────  │
│  [Remove from Family]                   │
│  ─────────────────────────────────────  │
└─────────────────────────────────────────┘
```

- All fields update `family_members` record. Auto-save on blur.
- Dashboard Mode dropdown: adult, independent, guided, play. Changing mode updates shell routing for that member.
- Auth Method dropdown: full_login, pin, visual_password, none.
- "Reset PIN" opens a PIN entry form. Mom sets a new 4-digit PIN for this member.
- Dashboard Enabled toggle: whether member appears in Family Login flow.
- Out of Nest toggle: marks member as an adult child who has left home. Preserves data in Archives, removes active dashboard.
- "Generate New Invite Link" creates a new invitation (QR code + shareable link) for members who need their own login.
- "Remove from Family" with confirmation: "Remove Jake from your family? Their personal data will be archived for 30 days then permanently deleted." Confirmation requires typing the member's name.

> **Decision rationale:** Removing a member archives rather than instantly deletes, matching the account deletion grace period pattern. This protects against accidental removal in large families.

**Data created/updated:**
- `family_members` (all profile fields, role, mode, auth_method, pin_hash, dashboard_enabled, out_of_nest)

---

### Screen 3B: Out of Nest Member Detail

**What the user sees:**

```
┌─────────────────────────────────────────┐
│  ← Grandma Jean                         │
│  ─────────────────────────────────────  │
│  Profile                                │
│  Name: [Jean Wertman            ]       │
│  Email: [grandma@email.com      ]       │
│  Phone: [+1 555-123-4567       ]        │
│  Relationship: [Grandparent ▾]          │
│  ─────────────────────────────────────  │
│  Notifications                          │
│  How should we let them know when       │
│  they have a new message?               │
│  [✓] Email                              │
│  [ ] Text message (coming soon)         │
│  ─────────────────────────────────────  │
│  Conversation Access                    │
│  Which conversation spaces can they     │
│  participate in?                        │
│  [✓] Whole Family                       │
│  [✓] Grandparents Group                 │
│  [ ] Parents Only                       │
│  ─────────────────────────────────────  │
│  Invite Status                          │
│  Status: Accepted · Joined Jan 2026     │
│  [Resend Invitation Email]              │
│  ─────────────────────────────────────  │
│  [Remove Out of Nest Member]            │
│  ─────────────────────────────────────  │
└─────────────────────────────────────────┘
```

- **Notifications section:** Mom configures how Out of Nest members are notified of new messages. Out of Nest members are unlikely to be checking the app regularly, so proactive notifications are important.
  - **Email (MVP):** When a new message arrives in a conversation space the Out of Nest member has access to, an email notification is sent with the message preview and a link to read/reply in their MyAIM inbox.
  - **Text/SMS (post-MVP):** Same notification via SMS to the configured phone number. Requires SMS provider integration (e.g., Twilio). Visible but disabled at MVP with "coming soon" label.
  - At least one notification method must be enabled (email is default and required if no SMS).
- **Conversation Access** shows all conversation spaces and toggles per space. Mom controls which spaces each Out of Nest member can see and participate in.

> **Decision rationale:** Out of Nest members live outside the app. Without proactive notifications, messages would go unread indefinitely. Email notifications at MVP use the same email infrastructure as invitations — no new provider needed. SMS is deferred because it requires a third-party provider (Twilio/similar) and per-message cost, but the phone number field and toggle are wired from day one so activating SMS is a configuration change, not a refactor.

> **Forward note:** Out of Nest members messaging individual in-home family members (e.g., grandma messages a younger sibling who doesn't have a phone) is a post-MVP enhancement. The permission configuration will be added to this screen when that feature is built. The inbox and notification infrastructure is the same — they'd just have access to additional conversation spaces.

**Data created/updated:**
- `out_of_nest_members` (name, email, phone_number, relationship, notification_methods)
- `conversation_space_members` (space access grants)

---

### Screen 4: Appearance

> **Depends on:** PRD-03 (Design System & Themes) — theme catalog, vibe definitions, gradient system, `theme_preferences` JSONB. PRD-03 Screen 1 defines this screen's content in detail.

**What the user sees:**

This is the Appearance screen defined in PRD-03 Screen 1, now embedded within the Settings overlay. No changes to the spec — it renders identically:

- Current theme preview (3-color swatch + name)
- Theme picker grid organized by mood-based categories (Warm & Cozy, Cool & Calm, Bold & Rich, Soft & Light, Bright & Fun, Seasonal)
- Vibe selector (Classic MyAIM, Clean & Modern, Nautical, Cozy Journal)
- Gradient toggle (on/off with live preview)
- Dark mode selector (Light / Dark / System)
- Font size selector (Normal / Large / Extra Large)

All changes apply instantly and auto-save to `family_members.theme_preferences`.

**Mom's additional controls (visible only to mom):**
- Below personal appearance settings: "Manage Appearance for Family Members" section
- Shows each Guided and Play member with their current theme and a "Change" button
- Tapping "Change" opens a theme picker for that member

> **Decision rationale:** Name Packs removed from the platform entirely. They added confusion (support burden, documentation complexity, onboarding friction) with minimal value. The Nautical vibe carries StewardShip nostalgia through visual personality without renaming features.

---

### Screen 5: Notification Preferences

> **Depends on:** PRD-15 (Messages, Requests & Notifications) — Screen 10 defines this screen in detail.

This is the Notification Preferences screen defined in PRD-15 Screen 10, now accessible from within the Settings overlay. No changes to the spec:

- Do Not Disturb toggle (Safety alerts always come through)
- Per-category toggles: Messages, Requests, Calendar, Tasks, Safety (locked on), LiLa
- In-App column active; Push column visible but disabled at MVP ("coming soon")
- Save button

Accessible to all members who have a notification bell (Mom, Dad, Independent, Special Adult). Not available to Guided or Play.

---

### Screen 6: Privacy & Permissions

**What mom sees:**

```
┌─────────────────────────────────────────┐
│  ← Privacy & Permissions                │
│  ─────────────────────────────────────  │
│  Family Permissions                     │
│  [Open Permission Hub →]                │
│  Manage who can see what for each       │
│  family member.                         │
│  ─────────────────────────────────────  │
│  Data & Privacy                         │
│  Anonymous usage analytics: [ON]        │
│  Help improve MyAIM by sharing          │
│  anonymized usage patterns. No personal │
│  content is ever shared.                │
│  ─────────────────────────────────────  │
│  Faith Preferences                      │
│  [Manage faith frameworks →]            │
│  Configure faith traditions for your    │
│  family. Supports multiple frameworks.  │
│  ─────────────────────────────────────  │
└─────────────────────────────────────────┘
```

- "Open Permission Hub" navigates to the full Permission Hub defined in PRD-02 (Screens 1–6). The Permission Hub renders within the Settings overlay context — not as a separate page.
- Anonymous usage analytics toggle: opt-in/out for anonymized usage data collection. Data is collected by Three Little Lanterns LLC for product improvement. No personal content is shared. Default: ON.
- "Manage faith frameworks" links to the faith preferences configuration in Archives (PRD-13). Supports multiple faith frameworks per family.

> **Decision rationale:** The Permission Hub is not re-spec'd here — PRD-02's definition is complete and authoritative. Settings provides the entry point. The analytics toggle is simple and honest — collected by Three Little Lanterns for product improvement, not shared with AI providers.

**What dad sees:**
- "My Permissions" — read-only view of what features/kids he has access to (PRD-02 Screen 2 read-only mode)

**What teens see:**
- "What's Shared" — the Teen Transparency Panel from PRD-02 Screen 4. Shows what mom can see, what dad can see, what's family-visible. Teen can share UP (increase visibility) but not restrict DOWN.

---

### Screen 7: LiLa Preferences

**What the user sees:**

```
┌─────────────────────────────────────────┐
│  ← LiLa Preferences                     │
│  ─────────────────────────────────────  │
│  Conversation Style                     │
│  Tone: [Warm ▾]                         │
│    (Warm · Professional · Casual)       │
│  Response Length: [Balanced ▾]          │
│    (Concise · Balanced · Detailed)      │
│  ─────────────────────────────────────  │
│  Conversation History                   │
│  Keep conversations: [Forever ▾]        │
│    (Forever · 90 days · 30 days ·       │
│     7 days)                             │
│  [Clear All Conversation History]       │
│  ─────────────────────────────────────  │
│  Context Sources (Mom Only)             │
│  [Manage what LiLa knows about your    │
│   family →]                             │
│  (Opens the context settings panel      │
│   from PRD-05)                          │
│  ─────────────────────────────────────  │
└─────────────────────────────────────────┘
```

**Conversation Style:**
- Tone: Warm (default), Professional, Casual. Affects LiLa's response personality.
- Response Length: Concise, Balanced (default), Detailed. Influences how verbose LiLa's responses are.
- These preferences are passed as metadata in every LiLa API call for this member.

**Conversation History:**
- Retention period: Forever (default), 90 days, 30 days, 7 days. Conversations older than the retention period are auto-archived (not hard-deleted — moved to an archived state that doesn't appear in the conversation list but can be retrieved if the user changes the setting back).
- "Clear All Conversation History" with confirmation: "This will permanently delete all your LiLa conversations. This cannot be undone." Requires typing "CLEAR" to confirm.

**Context Sources (Mom Only):**
- Links to the Context Settings panel defined in PRD-05 (the three-tier checkbox tree showing People, Family, Personal, and Archives context sources).
- Not visible to non-mom members. Other members' context is auto-assembled based on their permissions — they don't get manual control.

> **Decision rationale:** LiLa preferences are per-member because family members have different communication needs. A teen may prefer casual tone while mom prefers warm. These preferences enhance personalization without being overwhelming — just two dropdowns and a retention setting.

**Mom's additional controls:**
Below personal LiLa preferences, mom sees a section for setting LiLa preference defaults for kids:

```
  ─────────────────────────────────────
  LiLa Defaults for Kids
  Jake:  Tone [Warm ▾]  Length [Balanced ▾]
  Emma:  Tone [Warm ▾]  Length [Concise ▾]
  Ruthie: Tone [Warm ▾] Length [Concise ▾]
```

- Only shows members who have LiLa access (per PRD-05 permissions).
- These defaults apply until the member changes their own preference (if they have permission to do so).

**Data created/updated:**
- `lila_member_preferences` (new table — see Data Schema)

---

### Screen 8: Calendar Settings

> **Depends on:** PRD-14B (Calendar) — Screen 7 defines Calendar Settings in detail.

This is the Calendar Settings screen defined in PRD-14B Screen 7, now accessible from within the Settings overlay. No changes to the spec:

- Week starts on (Sunday/Monday dropdown)
- Default view (Week/Month/Day dropdown)
- Color mode (Dots/Stripe toggle)
- Default drive time (minutes — mom only)
- Required intake fields for kid events (mom only)
- Auto-approve events per member (mom only)

Mom sees all sections. Dad and teens see only Display settings (week start, default view, color mode). Stored in `dashboard_configs.preferences` and `calendar_settings`.

---

### Screen 9: Messaging Settings

> **Depends on:** PRD-15 (Messages, Requests & Notifications) — Screen 6 defines Messaging Settings in detail.

This is the Messaging Settings screen defined in PRD-15 Screen 6, accessible from within the Settings overlay. Mom-only. No changes to the spec:

- Family Communication Guidelines (text area)
- Message Coaching per-member toggles
- Messaging Permissions (who can message whom)
- Group Creation permissions
- Ask LiLa per-space/global toggle
- Content Corner settings (browse/locked mode, who can add links)
- Out of Nest Members management link

---

### Screen 10: Subscription & Billing

**What the user sees (mom only):**

```
┌─────────────────────────────────────────┐
│  ← Subscription & Billing               │
│  ─────────────────────────────────────  │
│  Current Plan                           │
│  ┌─────────────────────────────────┐    │
│  │  ✨ Founding Family              │    │
│  │  All Features Unlocked           │    │
│  │  Status: Active                  │    │
│  │  Member since: March 2026        │    │
│  └─────────────────────────────────┘    │
│  ─────────────────────────────────────  │
│  Billing                                │
│  Payment management and plan options    │
│  will be available here when            │
│  subscription tiers launch.             │
│  ─────────────────────────────────────  │
│  Founding Family Benefits               │
│  As a founding family, you'll receive   │
│  locked-in pricing at our lowest rates  │
│  when subscription tiers launch.        │
│  ─────────────────────────────────────  │
└─────────────────────────────────────────┘
```

> **Deferred:** Full subscription management (Stripe integration, plan selection, billing history, payment method management, upgrade/downgrade, cancellation) — to be resolved in PRD-31 (Subscription Tier System). Stripe supports PayPal, Venmo, Apple Pay, Google Pay as payment methods within a single checkout flow — no separate integrations needed. Stripe account creation and test key configuration should happen during the pre-build setup sprint.

> **Forward note:** When PRD-31 is built, this screen will expand to include: plan comparison cards, payment method management, billing history, usage meters (if tier-gated features have limits), and upgrade/downgrade flows. The current stub shows Founding Family status and a friendly placeholder.

**Data referenced:**
- `families.is_founding_family`
- `family_subscriptions.status`, `family_subscriptions.tier_id`

---

### Screen 11: Data Export

**What the user sees (mom only):**

```
┌─────────────────────────────────────────┐
│  ← Data Export                           │
│  ─────────────────────────────────────  │
│  Download Your Data                     │
│                                         │
│  Download a ZIP file containing all     │
│  data your family has created in        │
│  MyAIM Family. This includes journal    │
│  entries, tasks, calendar events,       │
│  lists, messages you sent, victories,   │
│  archives, and all other content you    │
│  created or approved.                   │
│                                         │
│  AI-generated content that you saved    │
│  or approved is included. Raw AI        │
│  conversation logs are not included.    │
│                                         │
│  [Download All Data]                    │
│                                         │
│  Last export: Never                     │
│  ─────────────────────────────────────  │
└─────────────────────────────────────────┘
```

- "Download All Data" triggers an async export job. Shows progress indicator while generating.
- When complete: browser download of a ZIP file.
- ZIP structure: folders by feature (journal/, tasks/, calendar/, messages/, lists/, victories/, archives/, guiding_stars/, best_intentions/, innerworkings/, life_lantern/, etc.) with JSON files inside each.
- Includes: all user-created and user-approved content, uploaded images/files, family configuration data.
- Excludes: raw LiLa conversation logs (AI-generated, not user data), system-generated analytics, embedding vectors, internal processing records.
- "Last export" shows timestamp of most recent export (stored in `families` metadata).

> **Decision rationale:** Single "Download All" button is the right MVP scope. Users who want their data should get it easily. Granular per-category export selection is unnecessary complexity for a feature most users will use zero or one times. The export is comprehensive enough to satisfy GDPR/data portability requirements while excluding AI processing artifacts that aren't the user's intellectual property.

> **Forward note:** If data export is used frequently (unlikely), a scheduled auto-export option could be added post-MVP. The export format (JSON in folders) is designed to be human-readable and machine-parseable for potential import into other systems.

---

### Screen 12: Guided Member Simplified Settings

**What Guided members see when they tap the gear icon:**

```
┌─────────────────────────────────────────┐
│  Settings                            ✕  │
│  ─────────────────────────────────────  │
│  How It Looks                           │
│  Dark mode: [Light ▾]                   │
│  Text size: [Normal ▾]                  │
│  ─────────────────────────────────────  │
└─────────────────────────────────────────┘
```

- Only two settings: dark mode and font size.
- Available only if mom has permitted appearance changes for this member (checked against `member_permissions`).
- No category navigation — single simple screen.
- If mom has not permitted any appearance changes, the gear icon is hidden for this member.

> **Decision rationale:** Guided members are younger children who don't need (and shouldn't be distracted by) configuration options. Mom manages their experience. The two settings here (dark mode for nighttime use, font size for readability) are the only ones that make sense for a child to control.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | Sees all 10 categories. Full CRUD on all settings. Only role that sees Family Management, Messaging, Subscription, and Data Export. |
| Dad / Additional Adult | Partial | Sees Account (own), Appearance (own), Notifications (own), Privacy (read-only — what he has access to), LiLa Preferences (own), Calendar (display settings only). Cannot see Family Management, Messaging, Subscription, or Data Export. |
| Special Adult | Minimal | Sees Account (own profile) and Appearance (own theme/vibe). No other settings. Settings only accessible during active shift. |
| Independent (Teen) | Partial | Sees Account (own — but no delete option, teens can't delete their own account), Appearance (full theme catalog), Notifications (own), Privacy (transparency panel — "What's Shared"), LiLa Preferences (own, if LiLa access granted), Calendar (display settings). |
| Guided | Minimal | Simplified settings screen (Screen 12). Dark mode and font size only, if mom permits. No gear icon if mom hasn't permitted appearance changes. |
| Play | None | No gear icon. No settings access. Mom manages everything from her own settings. |

### Shell Behavior

- **Mom Shell:** Gear icon in shell header. Full Settings overlay with all categories.
- **Adult Shell (Dad):** Gear icon in shell header. Settings overlay with reduced categories.
- **Special Adult Shell:** Gear icon visible only during active shift. Minimal settings.
- **Independent Shell:** Gear icon in shell header. Settings overlay with teen-appropriate categories plus transparency panel.
- **Guided Shell:** Gear icon in shell header IF mom permits appearance changes. Opens simplified Screen 12.
- **Play Shell:** No gear icon. Not present.

### Privacy & Transparency
- Teen can see their full transparency panel (PRD-02 Screen 4) within Settings.
- Dad can see what permissions he has but cannot modify them.
- All personal settings (theme, notifications, LiLa preferences) are private to each member — mom cannot see dad's personal notification preferences.
- Mom CAN manage themes for Guided/Play members and set LiLa defaults for kids.

---

## Data Schema

### New Table: `member_emails`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| email | TEXT | | NOT NULL | Verified email address |
| is_primary | BOOLEAN | false | NOT NULL | Whether this is the login/primary email |
| is_verified | BOOLEAN | false | NOT NULL | Whether email has been verified via confirmation link |
| verification_token | TEXT | | NULL | Token sent in verification email. Null after verified. |
| verification_expires_at | TIMESTAMPTZ | | NULL | Token expiry. Null after verified. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:**
- Member can CRUD their own email records.
- Mom can read all family members' email records (for family management).
- Exactly one email per member must be `is_primary = true` (enforced by application logic + trigger).

**Indexes:**
- `(email)` — unique across all members (prevents duplicate accounts)
- `(family_member_id, is_primary)` — for quick primary email lookup
- `(verification_token)` — for verification link resolution

**Trigger:**
- `ensure_single_primary_email`: Before insert/update — if setting `is_primary = true`, set all other emails for this member to `is_primary = false`.

---

### New Table: `lila_member_preferences`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| tone | TEXT | 'warm' | NOT NULL | Enum: 'warm', 'professional', 'casual' |
| response_length | TEXT | 'balanced' | NOT NULL | Enum: 'concise', 'balanced', 'detailed' |
| history_retention | TEXT | 'forever' | NOT NULL | Enum: 'forever', '90_days', '30_days', '7_days' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:**
- Member can read/update their own record.
- Mom can read/update any family member's record (for setting kid defaults).

**Indexes:**
- Unique constraint on `(family_member_id)` — one preference record per member

---

### New Table: `data_exports`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| requested_by | UUID | | NOT NULL | FK → family_members (always mom) |
| status | TEXT | 'pending' | NOT NULL | Enum: 'pending', 'processing', 'completed', 'failed' |
| file_url | TEXT | | NULL | Supabase Storage URL for the generated ZIP. NULL until completed. |
| file_expires_at | TIMESTAMPTZ | | NULL | URL expiry (24 hours after generation). NULL until completed. |
| error_message | TEXT | | NULL | Error details if status = 'failed' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| completed_at | TIMESTAMPTZ | | NULL | When export finished |

**RLS Policy:**
- Mom can CRUD. No other members can access.

**Indexes:**
- `(family_id, created_at DESC)` — most recent export lookup

---

### New Table: `account_deletions`

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members |
| deletion_type | TEXT | | NOT NULL | Enum: 'family' (mom deletes whole family), 'member' (member removes self) |
| requested_at | TIMESTAMPTZ | now() | NOT NULL | |
| grace_period_ends_at | TIMESTAMPTZ | | NOT NULL | 30 days after requested_at |
| hard_deleted_at | TIMESTAMPTZ | | NULL | When data was actually purged. NULL during grace period. |
| cancelled_at | TIMESTAMPTZ | | NULL | If user reactivated during grace period. |
| status | TEXT | 'pending' | NOT NULL | Enum: 'pending', 'completed', 'cancelled' |

**RLS Policy:**
- Mom can read family deletion records. Members can read their own.

**Indexes:**
- `(family_id, status)` — check for pending deletions
- `(grace_period_ends_at, status)` — scheduled job query for deletions ready to execute

**Scheduled job:**
- `process_expired_deletions`: Runs daily. Finds records where `status = 'pending'` AND `grace_period_ends_at < now()`. Executes hard delete cascade and sets `status = 'completed'`, `hard_deleted_at = now()`.

---

### Modifications to Existing Tables

**`families` (PRD-01) — add column:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| analytics_opt_in | BOOLEAN | true | NOT NULL | Whether family participates in anonymized usage analytics |
| last_data_export_at | TIMESTAMPTZ | | NULL | Timestamp of most recent data export |

---

### Enum/Type Updates

New enums:
- `lila_tone`: 'warm', 'professional', 'casual'
- `lila_response_length`: 'concise', 'balanced', 'detailed'
- `lila_history_retention`: 'forever', '90_days', '30_days', '7_days'
- `deletion_type`: 'family', 'member'
- `deletion_status`: 'pending', 'completed', 'cancelled'
- `export_status`: 'pending', 'processing', 'completed', 'failed'

---

## Flows

### Incoming Flows (How Data Gets INTO Settings)

| Source | How It Works |
|--------|-------------|
| PRD-01 (Auth & Family Setup) | Member records created during onboarding are edited here. Family identity (name, login name) set during onboarding is editable here. |
| PRD-02 (Permissions & Access Control) | Permission Hub screens are rendered within Settings. Permission data flows from PRD-02 tables. |
| PRD-03 (Design System & Themes) | Theme/vibe preferences stored in `family_members.theme_preferences` are read and written here. |
| PRD-05 (LiLa Core AI System) | Context Settings panel is rendered within Settings. LiLa preferences extend PRD-05's conversation system. |
| PRD-13 (Archives & Context) | Faith preferences link navigates to Archives faith configuration. |
| PRD-14B (Calendar) | Calendar Settings screen renders within Settings. Data in `calendar_settings` and `dashboard_configs.preferences`. |
| PRD-15 (Messages, Requests & Notifications) | Messaging Settings and Notification Preferences screens render within Settings. Data in `messaging_settings`, `notification_preferences`, etc. |

### Outgoing Flows (How Settings Feeds Other Features)

| Destination | How It Works |
|-------------|-------------|
| PRD-05 (LiLa Core AI System) | `lila_member_preferences` (tone, length) passed as metadata in every LiLa API call. History retention setting triggers auto-archive job on `lila_conversations`. |
| PRD-03 (Design System & Themes) | Theme/vibe changes apply globally and instantly via CSS variable swapping. |
| PRD-01 (Auth & Family Setup) | Member profile changes (name, avatar, PIN, dashboard_mode) update the source records. New members added here appear in all family views. |
| PRD-15 (Messages & Notifications) | Notification preference changes affect delivery. Messaging permission changes affect who can message whom. |
| Every feature | Analytics opt-in flag checked before any anonymized event collection. |

---

## AI Integration

No LiLa guided mode for Settings. Settings is a pure configuration experience — no AI assistance needed.

However, Settings feeds LiLa:
- `lila_member_preferences` (tone, response_length) are loaded as metadata for every LiLa interaction.
- Context Settings (accessed from Settings → LiLa Preferences) control what LiLa knows.
- Family Communication Guidelines (accessed from Settings → Messaging) are loaded for all conversation coaching.

---

## Edge Cases

### Large Families (9+ Members)
- Family Management member list is scrollable with role-based grouping for easy scanning.
- Member Color Assignment handles 44 colors for up to 44 members without conflicts (though duplicates are allowed with disambiguation).

### Multiple Email Addresses
- Adding an email that already belongs to another account: "This email is already associated with another account. If that's you, sign in to that account and merge, or contact support."
- Verification email not received: "Resend verification" button with rate limiting (max 3 per hour).
- Deleting the only verified email: blocked. Must always have at least one verified email.

### Account Deletion During Grace Period
- Mom logs in during 30-day grace period: "Welcome back! Your account was scheduled for deletion on [date]. Would you like to cancel the deletion?" One-tap reactivation.
- Mom's family members try to log in during grace period: "This family's account is being deactivated. Contact [mom's name] to restore access."

### Data Export for Large Families
- Export may take several minutes for families with years of data. Progress indicator shows (e.g., "Exporting journal entries... Exporting tasks... Packaging ZIP...").
- Export URL expires after 24 hours. User can re-export if needed.
- Maximum export size: if ZIP exceeds 500MB, split into multiple files with clear labeling.

### Concurrent Settings Changes
- If mom and dad are both in Settings simultaneously changing their own preferences, no conflict — each writes to their own records.
- If mom changes a family-level setting (like Family Name) while dad is viewing it, dad's view updates on next settings open (no real-time sync needed for settings).

### Settings During Active View As
- If mom is in View As mode and opens Settings: Settings always shows MOM's settings, not the viewed member's. Settings is never affected by View As.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `settings_basic` | Access to Account, Appearance, Notifications settings | Essential (all users) |
| `settings_family_management` | Family Management section | Essential (all users) |
| `settings_data_export` | Data export capability | Essential (all users) |
| `settings_multi_email` | Multiple email addresses per account | Enhanced |

> **Tier rationale:** Core settings (account, appearance, notifications, family management, data export) are available at all tiers — restricting configuration would feel punishing. Multi-email is a convenience feature that serves power users (like Tenise with 3 emails) and sits naturally at Enhanced tier.

All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Subscription & Billing full management (Stripe, plan selection, billing history, payment methods, upgrade/downgrade) | Stripe integration, tier management UI | PRD-31 (Subscription Tier System) |
| Out of Nest member → in-home sibling messaging permission configuration | Expanded Out of Nest conversation space access for individual members | Post-MVP enhancement (no PRD assigned) |
| Out of Nest SMS notifications (toggle visible but disabled) | SMS delivery via Twilio or similar provider | Post-MVP engineering sprint |
| Push notification toggle (visible but disabled) | Push notification infrastructure | Post-MVP Push Notifications sprint |
| Scheduled data auto-export | Automated periodic export | Post-MVP enhancement |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| "Family Management Page (standalone)" removal | Build Order Source of Truth v2, Section 5 | Family Management now lives in Settings Screen 3. No standalone page. Post-onboarding member management is here. |
| Settings gear icon in shell header | PRD-04 (Shell Routing & Layouts), PRD-15 (notification tray layout) | Gear icon triggers Settings overlay. Positioned in shell header near notification bell and member avatar. |
| Theme Settings "within Settings page" reference | PRD-03 (Design System), Screen 1 description | PRD-03's theme screen is now formally embedded as Screen 4 within the Settings overlay. |
| Calendar Settings "from the main Settings area" reference | PRD-14B (Calendar), Screen 7 description | PRD-14B's calendar settings screen is now formally embedded as Screen 8 within the Settings overlay. |
| Messaging Settings "from the main Settings area" reference | PRD-15 (Messages), Screen 6 description | PRD-15's messaging settings screen is now formally embedded as Screen 9 within the Settings overlay. |
| Notification Preferences "from Settings area" reference | PRD-15 (Messages), Screen 10 description | PRD-15's notification preferences screen is now formally embedded as Screen 5 within the Settings overlay. |
| Permission Hub "from MyFamily settings area" reference | PRD-02 (Permissions), Screen 1 description | PRD-02's Permission Hub is now formally accessible via Settings Screen 6. |
| LiLa context settings "from a dedicated settings page" reference | PRD-05 (LiLa Core), Context Settings screen | PRD-05's context settings panel is now formally accessible via Settings Screen 7 (LiLa Preferences → Manage context). |

---

## What "Done" Looks Like

### MVP (Must Have)

**Settings Overlay:**
- [ ] Settings overlay triggered by gear icon in shell header for all applicable shells
- [ ] Full-screen overlay on mobile, large centered modal on desktop
- [ ] Category-based navigation with role-appropriate visibility
- [ ] Back navigation and close (✕, escape, swipe down)
- [ ] Sign Out button with confirmation

**Account Settings:**
- [ ] Display name editing with auto-save
- [ ] Avatar upload to Supabase Storage
- [ ] `member_emails` table created with RLS policies
- [ ] Add/remove/verify secondary emails flow
- [ ] Set primary email with confirmation
- [ ] Password change form
- [ ] Account deletion with 30-day soft delete grace period
- [ ] `account_deletions` table created with RLS policies and scheduled job
- [ ] Reactivation flow during grace period

**Family Management (Mom):**
- [ ] Family name and login name editing
- [ ] Family member list with role grouping
- [ ] Member detail editing (Screen 3A) — all `family_members` fields
- [ ] PIN reset for family members
- [ ] Add new family member (reuses PRD-01 add flow)
- [ ] Remove family member with grace period
- [ ] Generate invitation links
- [ ] Out of Nest member management (Screen 3B)
- [ ] Member Color Assignment link (to PRD-03 Screen 2)
- [ ] Tablet/Hub settings (timeout, widget config link)

**Appearance:**
- [ ] Theme picker, vibe selector, gradient toggle, dark mode, font size — all per PRD-03
- [ ] Mom's "Manage Appearance for Family Members" section for Guided/Play members

**Embedded PRD-02/03/05/14B/15 Screens:**
- [ ] Permission Hub accessible from Privacy & Permissions (PRD-02 Screens 1–6)
- [ ] Notification Preferences rendered (PRD-15 Screen 10)
- [ ] Calendar Settings rendered (PRD-14B Screen 7)
- [ ] Messaging Settings rendered (PRD-15 Screen 6)
- [ ] LiLa Context Settings accessible (PRD-05 Context Settings)

**LiLa Preferences:**
- [ ] `lila_member_preferences` table created with RLS policies
- [ ] Tone and response length dropdowns with auto-save
- [ ] History retention setting with auto-archive behavior
- [ ] Clear conversation history with confirmation
- [ ] Mom's kid defaults section

**Privacy & Data:**
- [ ] Analytics opt-in toggle updating `families.analytics_opt_in`
- [ ] Faith preferences link to Archives

**Subscription:**
- [ ] Founding Family status display
- [ ] Placeholder for future billing management

**Data Export:**
- [ ] `data_exports` table created with RLS policies
- [ ] Export job generates ZIP with JSON files organized by feature
- [ ] Download link with 24-hour expiry
- [ ] Progress indicator during generation
- [ ] "Last export" timestamp display

**Guided Simplified Settings:**
- [ ] Screen 12 renders for Guided members with dark mode and font size only
- [ ] Gear icon hidden if mom hasn't permitted appearance changes

**RLS Verification:**
- [ ] Members can only read/update their own settings records
- [ ] Mom can read/update all family member settings
- [ ] Dad cannot access family management, messaging settings, subscription, or data export
- [ ] Teens cannot delete their own account
- [ ] Guided/Play members cannot access full settings

### MVP When Dependency Is Ready

- [ ] Stripe integration in Subscription section (requires PRD-31)
- [ ] Push notification toggles functional (requires push notification sprint)

### Post-MVP

- [ ] Out of Nest → in-home sibling individual messaging permissions
- [ ] Granular data export (per-category selection)
- [ ] Scheduled auto-export
- [ ] Multi-email at Enhanced tier (during beta, available to all)
- [ ] Settings search/filter ("type to find a setting")
- [ ] Import data (for users migrating from other platforms)

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: Settings is a full-screen overlay triggered by gear icon in shell header, NOT a route. No `/settings` URL.
- [ ] Convention: Settings categories are role-gated. Use the visibility table in PRD-22 Screen 1 to determine which categories each role sees.
- [ ] Convention: Settings embeds screens from PRD-02, PRD-03, PRD-05, PRD-14B, and PRD-15 — does NOT redefine them. Changes to those screens are made in their source PRDs.
- [ ] Convention: Account deletion uses a 30-day soft-delete grace period. Mom deletion = family deletion. Member deletion = individual removal.
- [ ] Convention: `member_emails` table enables multi-email per member. One must always be `is_primary = true`.
- [ ] Convention: `lila_member_preferences` stores tone, response_length, and history_retention per member. Passed as metadata in every LiLa API call.
- [ ] Convention: Data export generates a ZIP with JSON files organized by feature folder. Excludes raw LiLa conversation logs. Includes user-created and user-approved content only.
- [ ] Convention: Name Packs are removed from the platform. Features have fixed display names across all vibes.
- [ ] Convention: Guided members see simplified settings (Screen 12) with dark mode and font size only. Play members see no settings.

---

## DATABASE_SCHEMA.md Additions from This PRD

**Tables defined:** `member_emails`, `lila_member_preferences`, `data_exports`, `account_deletions`

**Enums defined:**
- `lila_tone`: 'warm', 'professional', 'casual'
- `lila_response_length`: 'concise', 'balanced', 'detailed'
- `lila_history_retention`: 'forever', '90_days', '30_days', '7_days'
- `deletion_type`: 'family', 'member'
- `deletion_status`: 'pending', 'completed', 'cancelled'
- `export_status`: 'pending', 'processing', 'completed', 'failed'

**Triggers defined:**
- `ensure_single_primary_email`: On `member_emails` insert/update — enforces single primary per member
- `process_expired_deletions`: Scheduled daily job — hard-deletes accounts past grace period

**Modifications to existing tables:**
- `families`: Add `analytics_opt_in` (BOOLEAN, default true), `last_data_export_at` (TIMESTAMPTZ, nullable)

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Settings is a full-screen overlay, not a route** | Overlay preserves context — user returns to exactly where they were. Modal feel on desktop, full-screen on mobile. No `/settings` URL needed. |
| 2 | **Multi-email support via `member_emails` table** | Clean schema for login resolution, deduplication, and future email-based features. One primary email for login, secondaries for recognition and flexibility. |
| 3 | **Account deletion: 30-day soft delete with easy reactivation** | Balances legal compliance (right to delete) with user retention (easy to come back). Mom deletion cascades to entire family. Member deletion removes only their data. |
| 4 | **Family Management lives in Settings post-onboarding** | The standalone Family Management Page is removed (Build Order Section 5). PRD-01's onboarding flow creates the family; Settings manages it thereafter. One place for everything. |
| 5 | **Name Packs removed from the platform** | Added confusion (support burden, documentation, onboarding friction) with minimal value. Nautical vibe carries StewardShip nostalgia visually without renaming features. |
| 6 | **Permission Hub embedded in Settings, not redefined** | PRD-02's spec is complete. No point duplicating. Settings provides the entry point. |
| 7 | **LiLa preferences: tone, response length, history retention per member** | PRD-05 defined context controls but not personality preferences. These three settings cover the meaningful personalization axis without being overwhelming. |
| 8 | **Data export: single "Download All" button, ZIP with JSON by feature** | Pragmatic MVP scope. Gives users their data (legally and ethically right) without building a luxury export suite. Excludes raw AI logs, includes user-created and user-approved content. |
| 9 | **Analytics opt-in collects data for Three Little Lanterns only** | Anonymized usage data helps product improvement. Not shared with Anthropic or any third party. Default: ON with clear disclosure. |
| 10 | **Subscription & Billing is a stub until PRD-31** | Stripe setup in pre-build sprint. Stripe handles PayPal, Venmo, Apple Pay, Google Pay natively. Full billing UI deferred to PRD-31. |
| 11 | **Out of Nest sibling messaging is post-MVP** | Permission config will be added to Settings when the feature is built. MVP Out of Nest members have conversation space access with email notifications. |
| 12 | **Multiple faith frameworks per family supported** | Settings links to Archives faith configuration. Families may have multiple faith traditions — not limited to one. |
| 13 | **Settings during View As always shows mom's settings** | View As is for managing kids' daily activities, not for configuring their settings. Settings is always the logged-in user's own experience. |
| 14 | **Out of Nest members get email notifications at MVP, SMS post-MVP** | Out of Nest members live outside the app and won't check an inbox proactively. Email notifications use existing email infrastructure (no new provider). SMS requires Twilio/similar with per-message cost — phone number field and toggle wired from day one so activation is a config change. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Full Stripe subscription management | PRD-31 (Subscription Tier System) |
| 2 | Push notification preference toggles (functional) | Post-MVP Push Notifications sprint |
| 3 | Out of Nest → in-home sibling individual messaging permissions | Post-MVP enhancement |
| 4 | Granular data export (per-category selection) | Post-MVP enhancement |
| 5 | Settings search/filter | Post-MVP UX enhancement |
| 6 | Data import from other platforms | Post-MVP |
| 7 | Multi-email tier gating (Enhanced tier) | PRD-31 tier activation |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-01 (Auth & Family Setup) | Family Management post-onboarding now lives in Settings. Multi-email `member_emails` table adds a new login resolution path (check `member_emails` for any verified email matching login attempt). Account deletion with grace period defined. | Note `member_emails` as a login resolution source. Note account deletion flow and `account_deletions` table. Family setup onboarding flow unchanged — Settings takes over after first setup. |
| PRD-02 (Permissions & Access Control) | Permission Hub is formally embedded within Settings overlay. Entry point confirmed as Settings → Privacy & Permissions → Open Permission Hub. | Note that Permission Hub renders within Settings overlay context. No spec changes needed — PRD-02 screens render as-is. |
| PRD-03 (Design System & Themes) | Name Packs removed from platform. Theme Settings screen (Screen 1) formally embedded in Settings overlay as Screen 4. | Remove Name Pack references from PRD-03 if any remain. Note Settings as the formal home for theme screen. |
| PRD-04 (Shell Routing & Layouts) | Gear icon in shell header confirmed as Settings overlay trigger. No `/settings` route needed — overlay renders on top of current page. | Note gear icon behavior: triggers full-screen overlay (not route navigation). Adjust shell header spec if needed. |
| PRD-05 (LiLa Core AI System) | New `lila_member_preferences` table stores per-member tone, response_length, history_retention. These are passed as metadata in every LiLa API call. Context Settings panel formally accessible from Settings → LiLa Preferences. | Register `lila_member_preferences` as a context source loaded on every LiLa call. Note history_retention triggers auto-archive on `lila_conversations`. |
| PRD-13 (Archives & Context) | Faith preferences link from Settings → Privacy confirmed. Multiple faith frameworks per family explicitly supported. | Verify faith preferences UI supports multiple frameworks. Note Settings as a navigation entry point. |
| PRD-14B (Calendar) | Calendar Settings screen formally embedded in Settings overlay. No changes to screen spec. | Note Settings as the formal home alongside the Calendar gear icon entry point. |
| PRD-15 (Messages, Requests & Notifications) | Messaging Settings and Notification Preferences screens formally embedded in Settings overlay. Out of Nest member management accessible from Settings → Family Management and Settings → Messaging. | Note Settings as the formal home alongside Messages gear icon entry points. Note Out of Nest management in Settings Family Management section. |
| Build Order Source of Truth | PRD-22 completed. 4 new tables. Name Packs removed. Settings overlay pattern established. | Move PRD-22 to Section 2 (completed). Add Name Packs to Section 5 (Features Removed). Note Settings overlay as a platform-level UI pattern. |

---

*End of PRD-22*
