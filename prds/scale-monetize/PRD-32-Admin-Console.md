> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-32: Admin Console — System, Analytics & Feedback

**Status:** Not Started
**Dependencies:** PRD-02 (Permissions — `staff_permissions` table), PRD-04 (Shell Routing — `/admin` route), PRD-21B (Admin Console Shell + AI Vault tab), PRD-21C (Moderation tab), PRD-05 (LiLa Help — solution routing destination), PRD-22 (Settings — permanent feedback form destination)
**Created:** March 21, 2026
**Last Updated:** March 21, 2026

---

## Overview

The Admin Console is the platform's nerve center — one location where Tenise (and eventually hired team members) manages users, reviews platform health, monitors costs, responds to feedback, and refines the platform's intelligence over time. PRD-21B established the Admin Console Shell (tabbed navigation at `/admin`, per-tab permission gating via `staff_permissions`, back button to return to the family app). PRD-21B built the AI Vault tab. PRD-21C built the Moderation tab. This PRD completes the console by defining the remaining three tabs — **System**, **Analytics**, and **Feedback** — plus the user-facing Feedback FAB that lives inside the family app during beta.

The Admin Console is entirely separate from the family experience. It uses `staff_permissions` (not `member_permissions`), its own tab-based navigation (not sidebar-based), and its own route group (`/admin/*`). No family member ever sees it. No subscription tier gates it. It is a platform management tool.

> **Mom experience goal:** The admin console should feel like a well-organized command center — not a developer dashboard. Clear labels, summary cards with counts, and obvious action buttons. Tenise shouldn't need to remember where things live; the tab structure should make every admin task findable in one click.

This PRD also introduces the **Feedback & Bug Reporting System** — a bidirectional pipeline where users submit feature requests, bug reports, and praise through a visible FAB during beta (and permanent forms in LiLa Help + Settings), and admins review, triage, and route solutions back into the platform. The sentiment filter ensures abusive or irrelevant submissions are flagged without being lost.

> **Forward note:** The tab registry is designed to grow. Future tabs (e.g., a "Content" tab for Strategies & Snippets blog management) can be added by registering a new route, permission type, and tab entry — no restructuring of the shell needed.

---

## User Stories

### System Administration
- As a super admin, I want to manage which people have admin access and what tabs they can see so I can delegate specific admin responsibilities without giving full platform access.
- As a super admin, I want to view all registered users and their family structures so I can troubleshoot account issues.
- As a super admin, I want to disable or enable user accounts so I can handle abuse or support requests.
- As a super admin, I want to manage the safety keyword library so I can keep the detection system current without touching the database directly.
- As a super admin, I want to manage curated safety resources (hotlines, websites) so flagged families see accurate, up-to-date support information.
- As a super admin, I want to review BookShelf content flagged by the ethics gate so I can approve or reject extracted principles before they enter the platform intelligence pool.

### Analytics & Intelligence
- As an admin, I want to see platform-wide metrics (user counts, active families, feature adoption) so I understand how the platform is being used.
- As an admin, I want to monitor AI costs by feature, model, and per-family average so I can ensure costs track to our targets.
- As an admin, I want to review anonymized usage patterns captured by the Platform Intelligence Pipeline so I can approve, refine, or reject them for platform-wide improvements.

### Feedback — User-Facing
- As a family member (Mom, Dad, or Teen), I want to report a glitch with an auto-captured screenshot and diagnostic info so the dev team can reproduce and fix it quickly.
- As a family member, I want to request a feature so the platform evolves based on what real families need.
- As a family member, I want to say something nice so the team knows what's working and feels appreciated.
- As a family member, I want the feedback option to be visible and easy to find so I don't have to hunt for it when something breaks.

### Feedback — Admin-Facing
- As an admin, I want to see all feedback submissions in one dashboard with auto-triage and categorization so I can prioritize what to act on.
- As an admin, I want abusive or irrelevant submissions auto-flagged and sorted to the bottom so I don't waste time on them but can still review them if needed (especially threats that may need reporting).
- As an admin, I want to copy a bug report's full diagnostics in a format ready for Claude Code so fixing it is as frictionless as possible.
- As an admin, I want to write a known-issue resolution and have it automatically surface in LiLa Help so future users with the same problem get instant answers.
- As an admin, I want to track which bug reports have been resolved, which are in progress, and which are new so nothing falls through the cracks.

---

## Screens

### Screen 0: Admin Console Shell (Extension)

> **Depends on:** PRD-21B Screen 0 — the shell framework is already defined there. This PRD extends the tab registry.

**Updated Tab Registry:**

| Tab Label | Route | Permission Required | Defined In |
|-----------|-------|-------------------|------------|
| AI Vault | `/admin/vault` | `vault_admin` | PRD-21B |
| Moderation | `/admin/moderation` | `moderation_admin` | PRD-21C |
| System | `/admin/system` | `system_admin` | **This PRD** |
| Analytics | `/admin/analytics` | `analytics_admin` | **This PRD** |
| Feedback | `/admin/feedback` | `feedback_admin` | **This PRD** |

> **Decision rationale:** Five tabs keeps each domain focused. The Feedback tab is separate from System because feedback review is the most likely task to be delegated to a non-technical admin (e.g., Tenise's husband reviewing flagged submissions), and it should be grantable independently.

> **Forward note:** Future tabs can be added by inserting a row in the tab registry and registering the corresponding `permission_type` in `staff_permissions`. The Strategies & Snippets blog management system will likely become a sixth tab or a sub-section of AI Vault — to be defined in a dedicated PRD.

**New permission types registered by this PRD:** `system_admin`, `analytics_admin`, `feedback_admin`.

---

### Screen 1: System Tab — Admin User Management

> **Depends on:** PRD-02 `staff_permissions` table.

The landing view when the System tab is opened. Manages who has admin access and what they can do.

**What the admin sees:**

```
┌──────────────────────────────────────────────────────────┐
│  System                                                  │
│  ──────────────────────────────────────────────────────  │
│  [Admin Users] [Users & Families] [Safety Config]        │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Admin Users                              [+ Add Admin]  │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ tenisewertman@gmail.com          Super Admin       │  │
│  │ All tabs · No expiry · 🔒 Hardcoded               │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ aimagicformoms@gmail.com         Super Admin       │  │
│  │ All tabs · No expiry · 🔒 Hardcoded               │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ 3littlelanterns@gmail.com        Super Admin       │  │
│  │ All tabs · No expiry · 🔒 Hardcoded               │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ husband@example.com              Custom            │  │
│  │ Feedback · No expiry                    [Edit] [×] │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Hardcoded super admins** shown with a lock icon — these cannot be edited or removed from the UI. They always have all-tab access. (The three emails from PRD-02: `tenisewertman@gmail.com`, `aimagicformoms@gmail.com`, `3littlelanterns@gmail.com`.)
- **Added admins** show their email, permission summary (which tabs they can access), optional expiry date, and edit/remove buttons.
- **"+ Add Admin" button** opens a modal: email field, multi-select checkboxes for tab permissions (AI Vault, Moderation, System, Analytics, Feedback), optional expiry date picker, and a Save button.

**Interactions:**
- **Add Admin:** Enter email, select tab permissions, optional expiry → creates `staff_permissions` records for each selected permission type.
- **Edit Admin:** Change tab permissions and/or expiry → updates `staff_permissions` records.
- **Remove Admin:** Confirmation dialog → sets `is_active = false` on all that user's `staff_permissions` records.

> **Decision rationale:** One modal to add an admin with multiple tab permissions is simpler than adding permissions one at a time. The underlying data model (`staff_permissions`) still has one row per permission type, but the UI presents it as "this person has these tabs."

**Data created/updated:**
- `staff_permissions` records (INSERT, UPDATE, soft-deactivate)

---

### Screen 2: System Tab — Users & Families

User and family management for support purposes.

**What the admin sees:**

```
┌──────────────────────────────────────────────────────────┐
│  System                                                  │
│  ──────────────────────────────────────────────────────  │
│  [Admin Users] [Users & Families] [Safety Config]        │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  🔍 Search users or families...                          │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ jane@example.com                                   │  │
│  │ Family: "The Smiths" · 5 members · Enhanced tier   │  │
│  │ Joined: Jan 15, 2026 · Last active: 2 hours ago   │  │
│  │ Status: Active                       [View] [···]  │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ maria@example.com                                  │  │
│  │ Family: "Garcia Family" · 3 members · Essential    │  │
│  │ Joined: Feb 2, 2026 · Last active: 3 days ago     │  │
│  │ Status: Active                       [View] [···]  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Showing 1-25 of 142 users              [← 1 2 3 →]     │
└──────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Search:** Full-text across email, display name, family name.
- **User cards:** Email, family name, member count, subscription tier, join date, last active, account status.
- **"View" button:** Expands inline or navigates to a detail panel showing:
  - User's email(s), display name, account creation date
  - Family structure: list of all family members with roles (Mom, Dad, Independent, Guided, Play, Special Adult, Out of Nest)
  - Subscription: current tier, Founding Family status, subscription dates
  - Recent activity summary: last login, features used in last 7 days (feature names only, no content)
  - Admin notes: free-text field for support notes
- **"···" menu:** Disable Account, Enable Account, Reset Password (sends reset email), Add Admin Note.

> **Decision rationale:** This is deliberately read-heavy. Admin should never edit a family's internal data (tasks, journals, archives, etc.) — that crosses a privacy line. The write operations are limited to account-level actions (disable, enable, reset password) and admin notes for support documentation.

**Interactions:**
- Search → filters user list in real-time (debounced, 300ms)
- View → expands user detail panel
- Disable Account → confirmation dialog → sets account to disabled state, logs user out
- Enable Account → re-enables a disabled account
- Reset Password → sends Supabase password reset email to the user
- Add Admin Note → opens text input, saves note with timestamp and admin author

**Data created/updated:**
- `admin_notes` records (new table — see Data Schema)
- User account status changes (via Supabase Auth admin API)

---

### Screen 3: System Tab — Safety Configuration

> **Depends on:** PRD-30 `safety_keywords` and `safety_resources` tables.

Admin interface for managing the safety monitoring keyword library and curated resources.

**What the admin sees:**

```
┌──────────────────────────────────────────────────────────┐
│  System                                                  │
│  ──────────────────────────────────────────────────────  │
│  [Admin Users] [Users & Families] [Safety Config]        │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  [Keywords] [Resources] [Ethics Review]                  │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Safety Keywords                        [+ Add Keyword]  │
│  ──────────────────────────────────────────────────────  │
│  Filter: [All Categories ▾]  [Active ▾]   🔍 Search     │
│                                                          │
│  ┌──────────────┬──────────┬─────────┬────────┬──────┐  │
│  │ Keyword      │ Category │Severity │ Type   │      │  │
│  ├──────────────┼──────────┼─────────┼────────┼──────┤  │
│  │ "want to die"│Self-Harm │Critical │Phrase  │ [⋮]  │  │
│  │ "kill myself" │Self-Harm │Critical │Phrase  │ [⋮]  │  │
│  │ cutting      │Self-Harm │Warning  │Word    │ [⋮]  │  │
│  │ vodka        │Substance │Concern  │Word    │ [⋮]  │  │
│  └──────────────┴──────────┴─────────┴────────┴──────┘  │
│                                                          │
│  Showing 1-50 of 87 keywords           [← 1 2 →]        │
└──────────────────────────────────────────────────────────┘
```

**Sub-tab: Keywords**
- Full CRUD on `safety_keywords` table.
- Filterable by category and active/inactive status.
- Searchable by keyword text.
- Add/Edit modal: keyword text, category (dropdown), base severity (dropdown: Concern/Warning/Critical), type (word/phrase toggle), active toggle, admin notes.
- "⋮" menu: Edit, Deactivate/Activate, Delete (with confirmation — deletion is permanent, deactivation preferred).

**Sub-tab: Resources**
- Full CRUD on `safety_resources` table.
- Grouped by category.
- Add/Edit modal: resource name, category, type (hotline/website/article/book), resource value (phone number or URL), description, display order.
- Drag-to-reorder within each category.

**Sub-tab: Ethics Review**

> **Depends on:** PRD-23 BookShelf extraction pipeline and Platform Intelligence Pipeline v2 Channel E.

Queue for reviewing BookShelf-extracted content flagged by the ethics gate before it enters the platform intelligence pool.

```
┌──────────────────────────────────────────────────────────┐
│  Ethics Review                                           │
│  ──────────────────────────────────────────────────────  │
│  3 items pending review                                  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 📖 "Atomic Habits" — Principle Extraction          │  │
│  │ "Use punishment to break bad habits"               │  │
│  │ Flagged: Potential coercion/shame-based control    │  │
│  │                                                    │  │
│  │ [Approve] [Reject] [Edit & Approve]                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 📖 "No Drama Discipline" — Framework Extraction    │  │
│  │ "Time-out as logical consequence"                  │  │
│  │ Flagged: Potential isolation technique             │  │
│  │                                                    │  │
│  │ [Approve] [Reject] [Edit & Approve]                │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

- Each item shows: book title, extraction type (principle/framework/action step), the extracted text, and why it was flagged.
- Actions: Approve (enters platform intelligence pool), Reject (discarded from pool, remains in family's personal extraction), Edit & Approve (admin can refine the text before promoting).
- Reviewed items move to a "Reviewed" history list.

**Data created/updated:**
- `safety_keywords` CRUD
- `safety_resources` CRUD
- `platform_intelligence.review_queue` status updates for ethics-flagged items

---

### Screen 4: Analytics Tab — Platform Overview

The metrics dashboard showing platform health and usage.

**What the admin sees:**

```
┌──────────────────────────────────────────────────────────┐
│  Analytics                                               │
│  ──────────────────────────────────────────────────────  │
│  [Platform Overview] [Intelligence Review] [AI Costs]    │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   142    │ │    89    │ │   67%    │ │   4.2    │   │
│  │  Users   │ │ Families │ │  Active  │ │ Avg Size │   │
│  │  total   │ │  total   │ │  30-day  │ │ members  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  Feature Adoption (30 day)                               │
│  ──────────────────────────────────────────────────────  │
│  Tasks          ████████████████████ 91%                 │
│  Journal        ██████████████░░░░░░ 72%                 │
│  Guiding Stars  ████████████░░░░░░░░ 58%                 │
│  AI Vault       ██████████░░░░░░░░░░ 51%                 │
│  BookShelf      ██████░░░░░░░░░░░░░░ 34%                 │
│  LifeLantern    ████░░░░░░░░░░░░░░░░ 22%                 │
│  ...                                                     │
│                                                          │
│  Tier Distribution                                       │
│  ──────────────────────────────────────────────────────  │
│  Essential: 45 families · Enhanced: 32 · Full Magic: 12  │
│                                                          │
│  Recent Signups (7 day)                                  │
│  ──────────────────────────────────────────────────────  │
│  8 new users · 6 new families · 2 returning              │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Summary cards:** Total users, total families, 30-day active percentage, average family size.
- **Feature adoption:** Horizontal bar chart showing percentage of active families using each feature in the last 30 days. Sorted by adoption rate.
- **Tier distribution:** Breakdown of families by subscription tier.
- **Recent signups:** 7-day new user and family counts.
- **Time range selector:** 7 days, 30 days, 90 days, All Time. Affects all metrics on the page.

> **Decision rationale:** This is a read-only overview. No actions are taken here — it's for understanding platform health at a glance. Drill-down analytics (per-feature deep dives, cohort analysis) are post-MVP.

**Data read:**
- Aggregated from `auth.users`, `families`, `family_members`, `family_subscriptions`
- Feature adoption from `platform_usage_log` (new table — see Data Schema)

---

### Screen 5: Analytics Tab — Intelligence Review

> **Depends on:** Platform Intelligence Pipeline v2 — `platform_intelligence.review_queue` table and all 12 capture channels.

The admin review interface for the Platform Intelligence Pipeline's captured patterns.

**What the admin sees:**

```
┌──────────────────────────────────────────────────────────┐
│  Analytics                                               │
│  ──────────────────────────────────────────────────────  │
│  [Platform Overview] [Intelligence Review] [AI Costs]    │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Platform Intelligence Review                            │
│  24 pending · 5 high-priority                            │
│  ──────────────────────────────────────────────────────  │
│  Filter: [All Channels ▾]  Sort: [Priority ▾]           │
│  [□ Bulk Mode]                                           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔄 Prompt Pattern · Priority: High · Seen: 23x    │  │
│  │ "Meal planning prompt with dietary restrictions    │  │
│  │  and {family_size} context"                        │  │
│  │                                                    │  │
│  │ [✅ Approve] [✏️ Refine] [🗑️ Reject] [⏸️ Defer]   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 📊 Context Signal · Priority: Med · Seen: 12x     │  │
│  │ "Homework Help tool: including learning_style      │  │
│  │  context → 85% positive outcome"                   │  │
│  │                                                    │  │
│  │ [✅ Approve] [✏️ Refine] [🗑️ Reject] [⏸️ Defer]   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Header counts:** Total pending items and high-priority count.
- **Channel filter:** All, Prompt Patterns (A), Context Signals (B), Edge Cases (C), Personas (D), Book Knowledge (E), Meeting Sections (F), Declaration Patterns (G), Routine Patterns (H), Safe Harbor Structures (I), Celebration Voices (J), Widget Configs (K), Question Phrasings (L).
- **Sort options:** Priority (default), Newest, Most Seen.
- **Bulk mode toggle:** Adds checkboxes for multi-select approve/reject.
- **Item cards:** Channel icon, priority indicator, seen count badge, anonymized content preview, quick-action buttons.
- **Expanding a card:** Shows full anonymized content, source statistics, admin notes field, anonymization verification checkbox ("Confirmed: contains no identifiable content").

**Special handling per Platform Intelligence Pipeline v2 doc:**
- **Book Knowledge (Channel E):** Separate view showing books → chapters → frameworks → principles. Per-book bulk approve/reject. Ethics-flagged items route to the Ethics Review sub-tab in the System tab.
- **Safe Harbor Structures (Channel I):** Individual review only (no bulk approve). Extra verification required: "Confirmed: contains no identifiable content and no conversation content."

**Interactions:**
- Approve → moves to `status = 'approved'`, sets `reviewed_at`, assigns `promoted_to_id`
- Refine → opens inline editor for the anonymized content, then approves the refined version
- Reject → moves to `status = 'rejected'`, sets `reviewed_at`
- Defer → moves to `status = 'deferred'`, stays in queue but drops from default view
- Bulk approve/reject → applies to all checked items simultaneously

**Data created/updated:**
- `platform_intelligence.review_queue` status updates
- Promoted items written to the appropriate `platform_intelligence.*` target table

---

### Screen 6: Analytics Tab — AI Cost Monitoring

Dashboard for tracking AI costs across the platform.

**What the admin sees:**

```
┌──────────────────────────────────────────────────────────┐
│  Analytics                                               │
│  ──────────────────────────────────────────────────────  │
│  [Platform Overview] [Intelligence Review] [AI Costs]    │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Period: [This Month ▾]                                  │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  $17.42  │ │  $0.19   │ │  $0.12   │ │  $5.20   │   │
│  │  Total   │ │ Per-Fam  │ │  Median  │ │ Highest  │   │
│  │  Cost    │ │ Average  │ │ Per-Fam  │ │ Family   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  Cost by Feature                                         │
│  ──────────────────────────────────────────────────────  │
│  LiLa Conversations  ████████████████ $8.20  (47%)      │
│  Optimizer            ██████████░░░░░░ $4.10  (24%)      │
│  Safety Monitoring    ████░░░░░░░░░░░░ $2.30  (13%)      │
│  BookShelf            ███░░░░░░░░░░░░░ $1.52  (9%)       │
│  Celebrations         ██░░░░░░░░░░░░░░ $0.80  (5%)       │
│  Other                █░░░░░░░░░░░░░░░ $0.50  (3%)       │
│                                                          │
│  Cost by Model                                           │
│  ──────────────────────────────────────────────────────  │
│  Haiku:   $12.80 (73%)  ·  Sonnet: $3.40 (20%)          │
│  Embeddings: $0.82 (5%)  ·  Whisper: $0.40 (2%)         │
│                                                          │
│  Trend (Last 6 Months)                                   │
│  ──────────────────────────────────────────────────────  │
│  [Simple line chart showing total cost and per-family    │
│   average over time]                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Summary cards:** Total cost this period, per-family average, per-family median (more useful than average for detecting outliers), and highest single-family cost.
- **Cost by Feature:** Horizontal bar chart showing which features drive AI costs. Sorted by cost.
- **Cost by Model:** Breakdown by AI model used.
- **Trend chart:** Simple line chart showing cost over the last 6 months, with both total and per-family average lines.
- **Period selector:** This Month, Last Month, Last 3 Months, Last 6 Months, All Time.

> **Forward note:** Per-family drill-down (clicking a family to see their individual cost breakdown) is post-MVP. The per-family tracking data is captured from day one via the `ai_usage_log` table — the drill-down UI is what's deferred. This table also provides the foundation for the future per-family AI credit/usage limit system (thermometer widget on the user's dashboard, tier-based monthly allotments, ability to earn/purchase rollover credits). That system will be defined in PRD-31 (Subscription Tier System). The data infrastructure built here makes that possible without schema changes.

**Data read:**
- `ai_usage_log` table (new — see Data Schema)

---

### Screen 7: Feedback Tab — Submissions Dashboard

The admin view of all user-submitted feedback.

**What the admin sees:**

```
┌──────────────────────────────────────────────────────────┐
│  Feedback                                                │
│  ──────────────────────────────────────────────────────  │
│  [Submissions] [Known Issues] [Demand Validation]        │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │  12  │ │   4  │ │   3  │ │   5  │ │   2  │         │
│  │ New  │ │Glitch│ │Feat. │ │Praise│ │Flaggd│         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
│                                                          │
│  [All] [Glitches] [Features] [Praise] [Flagged]         │
│  ──────────────────────────────────────────────────────  │
│  Sort: [Newest ▾]   Status: [All ▾]                     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🐛 GLITCH · New                      Mar 21, 3pm  │  │
│  │ "Calendar events disappear when I switch tabs"     │  │
│  │ jane@example.com · /calendar · Chrome/iOS          │  │
│  │ 📸 Screenshot attached                             │  │
│  │                                                    │  │
│  │ [View Details] [Mark In Progress] [Resolve] [···]  │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ 💡 FEATURE · New                     Mar 21, 1pm   │  │
│  │ "Would love a way to share tasks between families" │  │
│  │ maria@example.com · /tasks                         │  │
│  │                                                    │  │
│  │ [View Details] [Acknowledge] [Defer] [···]         │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ 💛 PRAISE · New                      Mar 21, 11am  │  │
│  │ "The meal planner AI is incredible! Saved me 2hrs" │  │
│  │ sarah@example.com · /vault/meal-planner            │  │
│  │                                                    │  │
│  │ [View Details] [Acknowledge] [Feature as Testimonl]│  │
│  ├────────────────────────────────────────────────────┤  │
│  │ 🚩 FLAGGED · Auto-flagged             Mar 20, 9pm │  │
│  │ "AI is evil and you should be ashamed..."          │  │
│  │ anon@example.com · /vault                          │  │
│  │ Sentiment: Hostile · Relevance: Low                │  │
│  │                                                    │  │
│  │ [View Details] [Dismiss] [Review Anyway] [Report]  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Summary cards:** Count of new (unreviewed) submissions total and by type, plus flagged count.
- **Type filter tabs:** All, Glitches, Features, Praise, Flagged (auto-flagged by sentiment filter).
- **Status filter:** All, New, In Progress, Resolved, Deferred, Acknowledged, Dismissed.
- **Sort:** Newest (default), Oldest, Priority (glitches first, then features, then praise).
- **Submission cards:** Type icon, status badge, timestamp, user's message (truncated), submitter email, route where submitted, device/browser info, screenshot indicator if attached.

**Type-specific actions:**
- **Glitches:** View Details, Mark In Progress, Resolve (opens resolution form), Copy Diagnostics for Claude Code, Link to Known Issue.
- **Features:** View Details, Acknowledge (sends nothing to user, just marks as seen), Defer (with optional note), Mark as Planned.
- **Praise:** View Details, Acknowledge, Feature as Testimonial (flags for marketing use — requires separate consent workflow, stubbed for now).
- **Flagged:** View Details, Dismiss (removes flag, keeps submission), Review Anyway (opens like a normal submission), Report (for threats — opens a notes field to document the threat for potential law enforcement reporting).

**Interactions:**
- Filter by type, status, and sort
- View Details → expands submission card inline with full text, screenshot (if any), complete diagnostic data, and admin notes field
- Copy Diagnostics for Claude Code → copies a formatted JSON block to clipboard (see Screen 8)
- Resolve → opens resolution form (see Screen 9)
- Dismiss flagged item → marks as dismissed, stays in history
- Report → adds to a `reported_threats` log with admin notes and timestamp

**Data created/updated:**
- `feedback_submissions` status updates
- `admin_notes` on submissions
- `reported_threats` records (if applicable)

---

### Screen 8: Feedback Tab — Diagnostic Detail (Glitch Reports)

When an admin clicks "View Details" on a glitch report, or "Copy Diagnostics for Claude Code."

**The diagnostic package includes:**

```json
{
  "submission_id": "uuid",
  "submitted_at": "2026-03-21T15:30:00Z",
  "user_description": "Calendar events disappear when I switch tabs",
  "route": "/calendar",
  "browser": "Chrome 124.0",
  "device": "iPhone 15 Pro / iOS 18.3",
  "screen_size": "393x852",
  "user_agent": "full UA string",
  "subscription_tier": "Enhanced",
  "console_errors": [
    "TypeError: Cannot read properties of undefined (reading 'map') at CalendarView.jsx:142",
    "Unhandled Promise rejection: Network request failed"
  ],
  "screenshot_url": "signed Supabase Storage URL",
  "recent_actions": [
    "Navigated to /calendar",
    "Created event 'Soccer practice'",
    "Switched to /tasks tab",
    "Returned to /calendar",
    "Events no longer visible"
  ]
}
```

**"Copy for Claude Code" button** formats this as a markdown block ready to paste into a Claude Code session:

```
## Bug Report: Calendar events disappear when I switch tabs

**Route:** /calendar
**Browser:** Chrome 124.0 on iPhone 15 Pro / iOS 18.3
**Screen:** 393x852
**Tier:** Enhanced

**User Description:**
Calendar events disappear when I switch tabs

**Console Errors:**
- TypeError: Cannot read properties of undefined (reading 'map') at CalendarView.jsx:142
- Unhandled Promise rejection: Network request failed

**Recent Actions:**
1. Navigated to /calendar
2. Created event 'Soccer practice'
3. Switched to /tasks tab
4. Returned to /calendar
5. Events no longer visible

**Screenshot:** [attached]
```

> **Decision rationale:** The diagnostic package is designed to give Claude Code (or any developer) everything needed to start debugging without asking follow-up questions. Auto-capturing console errors and recent navigation provides the reproduction path. The "Copy for Claude Code" format is markdown because that's the natural input format for Claude Code sessions.

**How diagnostics are captured (user-side):**
- **Route:** `window.location.pathname` at time of FAB tap.
- **Browser/Device/Screen:** Parsed from `navigator.userAgent` and `window.innerWidth/Height`.
- **Console errors:** Last 5 errors captured by a global `window.onerror` and `unhandledrejection` listener that stores errors in a small circular buffer (in-memory array, max 20 entries, no persistence). Only attached to glitch reports, never sent otherwise.
- **Recent actions:** Last 10 route changes captured by a navigation listener. Stored in a small in-memory circular buffer. Only attached to glitch reports.
- **Screenshot:** html2canvas capture triggered when user taps "Report a Glitch" — captured before the modal opens so it shows the actual page state, not the feedback form.

> **Decision rationale:** All diagnostic capture is in-memory only (no localStorage, no persistent tracking). The circular buffers are small and reset on page reload. This captures enough for debugging without creating any surveillance or privacy concern. Console errors and navigation history are only ever transmitted when the user explicitly chooses to submit a glitch report.

---

### Screen 9: Feedback Tab — Resolution & Known Issues

When resolving a glitch, or managing the known issues library that feeds LiLa Help.

**Resolution form (opened from a glitch submission):**

```
┌──────────────────────────────────────────────────────────┐
│  Resolve: "Calendar events disappear when..."    ✕      │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Resolution Type:                                        │
│  ○ Fixed (bug patched)                                   │
│  ○ Known Issue (workaround documented)                   │
│  ○ Won't Fix (by design or out of scope)                 │
│  ○ Cannot Reproduce                                      │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Internal Notes (admin-only):                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Fixed in commit abc123. Race condition in          │  │
│  │ calendar state when switching tabs.                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ☐ Add to Known Issues library                           │
│  (If checked, fill in customer-facing fields below)      │
│                                                          │
│  Known Issue Title:                                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Calendar events not showing after tab switch       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Customer-Facing Workaround:                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │ If your calendar events disappear, try refreshing  │  │
│  │ the page. This has been fixed in the latest update │  │
│  │ — clear your browser cache to get the new version. │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Keywords (for LiLa Help matching):                      │
│  ┌────────────────────────────────────────────────────┐  │
│  │ calendar, events, disappear, missing, tabs         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  [Cancel]                                     [Resolve]  │
└──────────────────────────────────────────────────────────┘
```

**Known Issues sub-tab:**

```
┌──────────────────────────────────────────────────────────┐
│  Feedback                                                │
│  ──────────────────────────────────────────────────────  │
│  [Submissions] [Known Issues] [Demand Validation]        │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Known Issues Library                 [+ Add Manually]   │
│  ──────────────────────────────────────────────────────  │
│  [Active] [Resolved] [All]              🔍 Search        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Calendar events not showing after tab switch       │  │
│  │ Status: Resolved · Created: Mar 21                 │  │
│  │ Keywords: calendar, events, disappear, missing     │  │
│  │ LiLa Help hits: 3                        [Edit][×]│  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Slow loading on first login                        │  │
│  │ Status: Active · Created: Mar 18                   │  │
│  │ Keywords: slow, loading, login, first time         │  │
│  │ LiLa Help hits: 7                        [Edit][×]│  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Known Issues list:** Title, status (Active/Resolved), creation date, keywords, LiLa Help hit count (how many times LiLa Help served this known issue to a user).
- **"+ Add Manually"** — create a known issue without linking to a specific glitch report (for proactive documentation).
- **Status filter:** Active (currently relevant), Resolved (fixed but kept for history), All.
- **LiLa Help hit count** — tracks how useful each known issue is. High hit counts on active issues indicate priority bugs.

> **Depends on:** PRD-05 (LiLa Help) — LiLa Help checks `known_issues` table via keyword matching before falling through to AI. If a match is found, LiLa Help shows the customer-facing workaround text. If the issue is marked as Resolved, LiLa Help shows the resolution and notes the fix is available.

**Data created/updated:**
- `feedback_submissions` status set to resolved
- `known_issues` records (INSERT, UPDATE)
- `known_issue_hits` counter incremented by LiLa Help at runtime

---

### Screen 10: Feedback FAB (User-Facing — In Family App)

> **This screen lives inside the family app, not the admin console.** It is the user-facing entry point for the feedback pipeline.

**What the user sees:**

A floating action button positioned at the **top-left** corner of the screen on mobile, below the navigation header. On desktop, it positions alongside the LiLa buttons area. Visible on all pages for Mom, Dad/Additional Adult, and Independent (Teen) shell users.

```
┌──────────────────────────────┐
│  [🗨️]  ← FAB (top-left)      │
│  Nav header...               │
│                              │
│  (Page content)              │
│                              │
└──────────────────────────────┘
```

**Tapping the FAB opens a quick-action menu:**

```
┌──────────────────────────────┐
│  ┌──────────────────────┐    │
│  │ 🐛 Report a Glitch   │    │
│  ├──────────────────────┤    │
│  │ 💡 Request a Feature  │    │
│  ├──────────────────────┤    │
│  │ 💛 Say Something Nice │    │
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

**Tapping any option opens a modal/slide-over form:**

**Report a Glitch:**
```
┌──────────────────────────────────────┐
│  Report a Glitch                  ✕  │
│  ──────────────────────────────────  │
│  What went wrong?                    │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │  (text area)                   │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  📸 Screenshot captured ✓            │
│  (Preview thumbnail of auto-capture) │
│  [Retake] [Remove]                   │
│                                      │
│  📎 Add another image (optional)     │
│                                      │
│  ℹ️ We'll also collect your device   │
│  info and the page you're on to      │
│  help us fix this faster.            │
│                                      │
│  [Submit Report]                     │
└──────────────────────────────────────┘
```

**Request a Feature:**
```
┌──────────────────────────────────────┐
│  Request a Feature                ✕  │
│  ──────────────────────────────────  │
│  What would you love to see?         │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │  (text area)                   │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  📎 Add an image (optional)          │
│                                      │
│  [Submit Request]                    │
└──────────────────────────────────────┘
```

**Say Something Nice:**
```
┌──────────────────────────────────────┐
│  Say Something Nice               ✕  │
│  ──────────────────────────────────  │
│  What's making you happy?            │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │  (text area)                   │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  [Send Some Love 💛]                 │
└──────────────────────────────────────┘
```

**After submission — all types show:**
```
┌──────────────────────────────────────┐
│  ✓ Thank you!                        │
│                                      │
│  Your feedback helps make MyAIM      │
│  better for every family.            │
│                                      │
│  [Close]                             │
└──────────────────────────────────────┘
```

**Auto-captured data (attached silently to every submission):**
- Current route (`window.location.pathname`)
- Browser and device info (from user agent)
- Screen dimensions
- Submission timestamp
- User ID and family ID
- Subscription tier
- **Glitch-only:** Screenshot (html2canvas, taken on FAB tap), last 5 console errors, last 10 route changes

> **Decision rationale:** The FAB is a beta-phase tool for maximum feedback visibility. It uses a feature flag (`is_feedback_fab_active` in app configuration) so it can be quietly hidden without any code changes when the beta period ends. The permanent feedback entry points (LiLa Help + Settings) are built from day one alongside the FAB, so disabling the FAB doesn't remove feedback capability — it just removes the most prominent entry point.

**FAB visibility rules:**
- **Mom shell:** Visible
- **Dad/Additional Adult shell:** Visible
- **Independent (Teen) shell:** Visible
- **Guided shell:** Not visible
- **Play shell:** Not visible
- **Admin console:** Not visible (admins submit feedback via the admin console itself)

> **Decision rationale:** Guided and Play shell users are young children who shouldn't be submitting bug reports. Teens are included because they're active platform users whose feedback is valuable, especially on Independent shell features.

---

### Screen 11: Feedback in LiLa Help (Permanent Entry Point)

> **Depends on:** PRD-05 (LiLa Help mode).

When a user opens LiLa Help and describes a problem, glitch, or has a feature idea, LiLa Help can:

1. **Check known issues first.** Keyword-match the user's description against `known_issues`. If a match is found, show the customer-facing workaround/resolution text. Ask "Did that help?" — if no, offer to submit a bug report.
2. **Offer to create a feedback submission.** If LiLa Help can't resolve the issue, she says: "I can't figure this one out yet — would you like to report this as a glitch so our team can look into it?" If yes, the same feedback form opens (pre-populated with the conversation context as the description).
3. **Feature requests via conversation.** If a user describes something they wish existed, LiLa Help can say: "That's a great idea! Want me to send that to our feature request list?" If yes, creates a `feedback_submissions` record of type `feature_request` with the conversation context.

> **Decision rationale:** LiLa Help is the conversational entry point for feedback. It's more natural than a form for users who are already talking to LiLa about a problem. The forms in Settings are the direct-access alternative for users who prefer a structured form.

---

### Screen 12: Feedback in Settings (Permanent Entry Point)

> **Depends on:** PRD-22 (Settings).

A "Feedback" section in Settings containing three buttons that open the same modal forms as the FAB (Report a Glitch, Request a Feature, Say Something Nice). Identical functionality, just a different entry point. Always available regardless of FAB status.

Positioned in the Settings category navigation alongside Support & Help (if that section exists) or as its own section.

---

## Visibility & Permissions

### Admin Console (Screens 0–9)

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | No access unless also a staff member | Being a mom does not grant admin access. Tenise is both mom and super admin. |
| Dad / Additional Adult | No access unless also a staff member | Can be granted specific tab permissions (e.g., `feedback_admin` for reviewing flagged submissions). |
| Special Adult | No access | Never. |
| Independent (Teen) | No access | Never. |
| Guided / Play | No access | Never. |

### Feedback FAB (Screen 10)

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Visible | Can submit all three feedback types. |
| Dad / Additional Adult | Visible | Can submit all three feedback types. |
| Special Adult | Not visible | Not a platform feedback use case. |
| Independent (Teen) | Visible | Can submit all three feedback types. Valuable beta feedback source. |
| Guided / Play | Not visible | Young children should not submit feedback. |

### Shell Behavior

- **Mom shell:** FAB visible (top-left). LiLa Help feedback integration active. Settings feedback section available.
- **Dad/Additional Adult shell:** FAB visible (top-left). Settings feedback section available. No LiLa Help (dad doesn't have LiLa Help access per PRD-05), but Settings entry point provides direct access.
- **Special Adult shell:** No FAB. No feedback access.
- **Independent (Teen) shell:** FAB visible (top-left). Settings feedback section available. LiLa Help feedback integration active (if teen has LiLa access per PRD-05 decisions).
- **Guided shell:** No FAB. No feedback access.
- **Play shell:** No FAB. No feedback access.
- **Admin console:** No FAB. Admin submits feedback by directly creating records in the feedback dashboard if needed.

### Privacy & Transparency

No teen transparency rules apply to feedback submissions. Feedback is sent to the platform team, not visible to other family members. A teen's bug report is not visible to their mom within the family app. Admin sees the submitter's email for follow-up purposes, but feedback content is never surfaced back to the family.

---

## Data Schema

### Table: `feedback_submissions`

All user-submitted feedback — glitches, feature requests, and praise.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| user_id | UUID | | NOT NULL | FK → auth.users |
| family_id | UUID | | NOT NULL | FK → families |
| submission_type | TEXT | | NOT NULL | CHECK: 'glitch', 'feature_request', 'praise' |
| status | TEXT | 'new' | NOT NULL | CHECK: 'new', 'in_progress', 'resolved', 'deferred', 'acknowledged', 'dismissed' |
| user_message | TEXT | | NOT NULL | The user's description |
| route | TEXT | | NULL | Page path where feedback was submitted |
| device_info | JSONB | | NULL | {browser, device, os, screen_width, screen_height, user_agent} |
| console_errors | JSONB | | NULL | Array of last 5 console errors (glitch reports only) |
| recent_actions | JSONB | | NULL | Array of last 10 route changes (glitch reports only) |
| screenshot_url | TEXT | | NULL | Signed Supabase Storage URL (glitch reports only) |
| attachment_urls | TEXT[] | '{}' | NOT NULL | Array of additional image URLs |
| subscription_tier | TEXT | | NULL | User's tier at time of submission |
| sentiment_flag | TEXT | | NULL | CHECK: 'hostile', 'irrelevant', NULL. Set by auto-triage. |
| sentiment_score | FLOAT | | NULL | Confidence score from classification (0-1) |
| admin_status_notes | TEXT | | NULL | Internal admin notes |
| resolved_at | TIMESTAMPTZ | | NULL | When marked as resolved |
| resolved_by | UUID | | NULL | FK → auth.users (admin who resolved) |
| resolution_type | TEXT | | NULL | CHECK: 'fixed', 'known_issue', 'wont_fix', 'cannot_reproduce', NULL |
| linked_known_issue_id | UUID | | NULL | FK → known_issues. If resolved by linking to a known issue. |
| source | TEXT | 'fab' | NOT NULL | CHECK: 'fab', 'lila_help', 'settings'. Where the submission originated. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Users can INSERT their own submissions. Users can READ their own submissions (future: show submission history). Admin can read all, update status/notes.

**Indexes:**
- `(submission_type, status)` — "all new glitches"
- `(user_id)` — "all submissions from this user"
- `(sentiment_flag)` WHERE sentiment_flag IS NOT NULL — "flagged submissions"
- `(created_at DESC)` — chronological listing

---

### Table: `known_issues`

Customer-facing known issues library that LiLa Help checks.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| title | TEXT | | NOT NULL | Display title |
| status | TEXT | 'active' | NOT NULL | CHECK: 'active', 'resolved' |
| customer_workaround | TEXT | | NOT NULL | Customer-facing workaround or resolution text. Shown by LiLa Help. |
| internal_notes | TEXT | | NULL | Admin-only technical notes |
| keywords | TEXT[] | '{}' | NOT NULL | Array of keywords for LiLa Help matching |
| hit_count | INTEGER | 0 | NOT NULL | Incremented when LiLa Help serves this issue. Maintained by application code. |
| linked_submission_ids | UUID[] | '{}' | NOT NULL | Array of feedback_submission IDs that led to this known issue |
| created_by | UUID | | NOT NULL | FK → auth.users (admin) |
| resolved_at | TIMESTAMPTZ | | NULL | When marked as resolved |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Read by LiLa Help service (for keyword matching). Admin CRUD.

**Indexes:**
- `(status)` — "active known issues"
- GIN index on `keywords` — fast array containment queries for LiLa Help matching

---

### Table: `reported_threats`

Log for feedback submissions containing threats that may need law enforcement reporting.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| feedback_submission_id | UUID | | NOT NULL | FK → feedback_submissions |
| admin_notes | TEXT | | NOT NULL | Admin's description of the threat |
| reported_to_authority | BOOLEAN | false | NOT NULL | Whether it was actually reported |
| reported_at | TIMESTAMPTZ | | NULL | When reported to authority |
| created_by | UUID | | NOT NULL | FK → auth.users (admin) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Admin CRUD only. No user access.

**Indexes:**
- `(feedback_submission_id)` UNIQUE

---

### Table: `admin_notes`

Free-text admin notes attachable to any entity (users, families, feedback submissions, etc.).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| entity_type | TEXT | | NOT NULL | CHECK: 'user', 'family', 'feedback_submission'. Extensible. |
| entity_id | UUID | | NOT NULL | FK to the relevant table based on entity_type |
| note_text | TEXT | | NOT NULL | The note content |
| created_by | UUID | | NOT NULL | FK → auth.users (admin who wrote it) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Admin CRUD only.

**Indexes:**
- `(entity_type, entity_id)` — "notes for this entity"
- `(created_at DESC)` — chronological

---

### Table: `ai_usage_log`

Per-call AI cost tracking across the entire platform.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| user_id | UUID | | NULL | FK → auth.users. NULL for system-initiated calls (e.g., safety monitoring pipeline). |
| feature | TEXT | | NOT NULL | Which feature triggered the call. E.g., 'lila_conversation', 'optimizer', 'safety_monitoring', 'bookshelf_extraction', 'celebration', 'content_suggestion', 'feedback_triage'. |
| model | TEXT | | NOT NULL | Model identifier. E.g., 'haiku', 'sonnet', 'text-embedding-3-small', 'whisper-1'. |
| input_tokens | INTEGER | | NULL | Input token count (NULL for non-token-based models like Whisper). |
| output_tokens | INTEGER | | NULL | Output token count. |
| estimated_cost_usd | FLOAT | | NOT NULL | Estimated cost in USD based on current pricing. |
| metadata | JSONB | | NULL | Additional context. E.g., {conversation_id, turn_number} or {vault_item_id}. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Service role INSERT only (called from Edge Functions). Admin READ only for the analytics dashboard. No user access.

> **Forward note:** This table provides the foundation for per-family AI credit tracking in PRD-31 (Subscription Tier System). When usage limits and credits are implemented, the `estimated_cost_usd` column per family per billing period determines consumption against their allotment. The thermometer widget on the user dashboard will query this table (filtered to the user's family and current billing period). Rollover credits will be managed in a separate `ai_credits` table defined in PRD-31. No schema changes to this table will be needed.

**Indexes:**
- `(family_id, created_at)` — "this family's usage over time" (primary query for per-family drill-down and credit tracking)
- `(feature, created_at)` — "cost by feature over time"
- `(model, created_at)` — "cost by model over time"
- `(created_at)` — chronological, for time-range aggregation queries

**Partitioning consideration:**
> **Forward note:** If this table grows large (millions of rows over time), consider range partitioning by month on `created_at`. Not needed at launch but the schema supports it without changes.

---

### Table: `platform_usage_log`

Feature adoption tracking for the Platform Overview analytics.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| user_id | UUID | | NOT NULL | FK → auth.users |
| feature | TEXT | | NOT NULL | Feature key. E.g., 'tasks', 'journal', 'guiding_stars', 'vault', 'bookshelf', 'lifelantern', 'calendar', 'rhythms'. |
| action | TEXT | | NOT NULL | E.g., 'page_view', 'item_created', 'item_completed', 'ai_session_started'. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Service role INSERT only. Admin READ only. No user access.

> **Decision rationale:** This is a lightweight event log, not a full analytics platform. It captures enough to answer "what percentage of families use feature X this month?" without the overhead of a full event tracking system. The action granularity (page_view vs. item_created) helps distinguish casual browsing from actual engagement.

**Indexes:**
- `(feature, created_at)` — "adoption of feature X over time"
- `(family_id, feature, created_at)` — "did this family use feature X this period?"

**Partitioning consideration:**
> **Forward note:** Same as `ai_usage_log` — range partition by month if volume warrants it.

---

### Table: `feedback_screenshots`

Supabase Storage bucket for feedback screenshots and attachments.

| Bucket | Contents | Access |
|--------|----------|--------|
| `feedback-attachments` | Screenshots (auto-captured via html2canvas) and user-uploaded images attached to feedback submissions | User write (own submissions only). Admin read. |

---

### Enum/Type Updates

**`staff_permissions.permission_type` — new values:**
- `system_admin` — access to System tab
- `analytics_admin` — access to Analytics tab
- `feedback_admin` — access to Feedback tab

(Added to existing values: `super_admin`, `vault_admin`, `moderation_admin`)

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| **User feedback (FAB, LiLa Help, Settings)** | User submits glitch/feature/praise → creates `feedback_submissions` record → auto-triage runs sentiment classification → appears in Feedback tab |
| **PRD-30 (Safety Monitoring)** | Safety keywords and resources managed via System tab. Admin CRUDs the `safety_keywords` and `safety_resources` tables. |
| **PRD-23 (BookShelf)** | Ethics-flagged extractions arrive in Platform Intelligence review queue (Channel E) → routed to Ethics Review sub-tab in System tab. |
| **Platform Intelligence Pipeline v2** | All 12 capture channels feed `platform_intelligence.review_queue` → reviewed in Analytics tab > Intelligence Review. |
| **All features (AI cost)** | Every AI call logs to `ai_usage_log` → aggregated in Analytics tab > AI Costs. |
| **All features (usage)** | Feature interactions log to `platform_usage_log` → aggregated in Analytics tab > Platform Overview. |
| **PRD-02 (Permissions)** | `staff_permissions` table used for all admin access gating. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| **PRD-05 (LiLa Help)** | Known issues with customer-facing workarounds are checked by LiLa Help via keyword matching before falling through to AI. `known_issues` table is the bridge. |
| **PRD-31 (Subscription Tier System)** | `ai_usage_log` provides the per-family cost data needed for usage limits, credit tracking, and the user-facing thermometer widget. |
| **Platform Intelligence promoted items** | Approved review queue items are promoted to `platform_intelligence.*` target tables, improving platform-wide AI behavior. |
| **PRD-30 (Safety Monitoring)** | Updated keywords and resources in `safety_keywords`/`safety_resources` take effect immediately for all future safety scans. |

---

## AI Integration

### Feedback Auto-Triage

**When a feedback submission is created,** an Edge Function runs auto-triage:

1. **Sentiment classification:** Uses text-embedding-3-small to compute the submission's embedding and compares against a small library of pre-computed hostile/irrelevant pattern embeddings (consistent with P1 cost optimization pattern). If similarity exceeds threshold (0.80 for hostile, 0.75 for irrelevant), sets `sentiment_flag` and `sentiment_score`.

> **Decision rationale:** Embedding-based classification is used instead of a Haiku call because (a) it's consistent with the platform's P1 cost optimization pattern, (b) feedback submissions are short text where embedding similarity works well, and (c) it avoids per-submission AI costs for what may be high-volume beta feedback. The hostile/irrelevant pattern library is seeded with ~20-30 example embeddings covering common abusive patterns and can be expanded over time.

2. **Duplicate detection:** Computes embedding similarity against recent submissions (last 30 days). If similarity > 0.90 to an existing submission, flags as potential duplicate with a link to the original. Does not auto-merge — admin reviews.

3. **Auto-categorization for feature requests:** If the submission mentions specific feature names or areas, auto-tags with a `feature_area` label (e.g., 'calendar', 'tasks', 'vault'). Uses keyword matching (no AI call needed).

### System Prompt Notes

No guided LiLa mode is created by this PRD. The LiLa Help integration (Screen 11) uses the existing LiLa Help mode from PRD-05 with the addition of the `known_issues` lookup step.

---

## Edge Cases

### Feedback Submission While Offline
- The FAB and forms work offline (they're just UI). The submission is queued in the offline sync queue (PRD-33) and submitted when connectivity returns. Screenshot is captured at time of tap and stored locally until sync.
- If the user is offline, the "Thank you" confirmation still shows, but notes "Your feedback will be sent when you're back online."

### Feedback From Deleted User
- If a user's account is soft-deleted (PRD-22 30-day soft delete), their existing feedback submissions remain in the admin dashboard attributed to their email. New submissions are not possible.
- If the user is restored within 30 days, submissions are still linked.
- After hard deletion, submissions remain but user_id FK becomes orphaned. Display shows "[deleted user]" instead of email.

### Feedback Flood
- If a single user submits more than 5 feedback items in 10 minutes, subsequent submissions are silently rate-limited (queued with a 1-minute delay between processing). The user still sees the "Thank you" confirmation immediately. This prevents both accidental spam and intentional abuse.

### Console Error Capture Privacy
- The circular buffer for console errors captures error messages and stack traces only. No user data (variable values, form content, etc.) is captured. Stack traces reference file names and line numbers, not runtime values.
- The buffer is in-memory only, resets on page reload, and is only ever transmitted when the user explicitly submits a glitch report.

### Admin Removes Themselves
- A hardcoded super admin cannot be removed (the UI doesn't offer the option).
- A non-hardcoded admin can have their permissions revoked by another admin. If they revoke their own last permission, they lose admin console access immediately on next navigation.

### No Feedback Submissions Yet (Empty State)
- Submissions dashboard shows: "No feedback yet! When users submit glitches, feature requests, or praise, they'll appear here."
- Known Issues sub-tab shows: "No known issues documented. When you resolve a glitch and add it to the library, it'll show up here — and LiLa Help will start using it to help users."

### Large Volume of Platform Intelligence Items
- Review queue paginates at 25 items per page.
- Bulk mode allows approve/reject of up to 25 items at once.
- Priority sorting ensures the most valuable items surface first.

### AI Cost Logging Failure
- If the Edge Function fails to log an AI call to `ai_usage_log`, the AI call itself is NOT blocked. Cost logging is fire-and-forget with retry (3 attempts, exponential backoff). If all retries fail, the missed entry is logged to a `failed_cost_logs` dead letter table for manual recovery.

### html2canvas Screenshot Failure
- If html2canvas fails to capture (some complex CSS or canvas elements may cause issues), the glitch report form still opens normally. The screenshot section shows "Screenshot capture failed — you can still attach an image manually" with the camera/gallery upload option.

---

## Tier Gating

No tier-specific gating. The admin console is gated by `staff_permissions`, which is entirely separate from the subscription tier system. Admin access has no relationship to a user's subscription level.

The Feedback FAB and feedback forms (in LiLa Help and Settings) are available to all users at all tiers. Feedback should never be paywalled.

> **Tier rationale:** Admin functionality is a platform management concern, not a subscriber benefit. User feedback is a platform health necessity — every user should be able to report issues and share ideas regardless of their subscription tier.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Demand Validation dashboard in Feedback tab | PRD-32A defines the full system — PlannedExpansionCard component + admin dashboard + feature_demand_responses table | PRD-32A (written concurrently) |
| Strategies & Snippets blog management tab | Admin interface for public blog content management | Dedicated Strategies & Snippets PRD (TBD number) |
| Dual-publish toggle infrastructure | Content created in Vault editor can optionally also publish to public blog | Strategies & Snippets PRD |
| Per-family AI cost drill-down | Click a family in AI Costs to see their individual usage breakdown | Post-MVP enhancement |
| Per-family AI credit/usage limits | Tier-based monthly AI allotments, thermometer widget, earn/purchase rollover credits | PRD-31 (Subscription Tier System) |
| Feature as Testimonial workflow | Praise submissions flagged for marketing use with consent workflow | Post-MVP / Marketing PRD |
| Admin activity log | Audit trail of all admin actions across all tabs | Post-MVP enhancement |
| User feedback submission history | Users can view their own past submissions and their status | Post-MVP enhancement |
| Trend visualization in Platform Overview | Charts showing user growth, feature adoption trends over time | Post-MVP enhancement |
| Per-feature analytics deep dives | Drill into individual feature analytics (e.g., Vault item performance, task completion rates) | Post-MVP enhancement |
| Push notification for critical glitch reports | Alert admin immediately when a glitch is reported with "Critical" classification | PRD-33 (Offline / PWA — service workers) |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| System tab in admin console shell | PRD-21B | Fully defined: Admin User Management (Screen 1), Users & Families (Screen 2), Safety Configuration (Screen 3) with Keywords, Resources, and Ethics Review sub-tabs. Route: `/admin/system`. Permission: `system_admin`. |
| Analytics tab in admin console shell | PRD-21B | Fully defined: Platform Overview (Screen 4), Intelligence Review (Screen 5), AI Cost Monitoring (Screen 6). Route: `/admin/analytics`. Permission: `analytics_admin`. |
| `system_admin` permission type | PRD-21B | Registered and used for System tab access gating. |
| `analytics_admin` permission type | PRD-21B | Registered and used for Analytics tab access gating. |
| Admin user management UI | PRD-21B (Deferred #6) | Fully defined in Screen 1: add/edit/remove admin users with per-tab permission assignment and optional expiry. |
| Admin keyword management UI | PRD-30 | Fully defined in Screen 3 > Keywords sub-tab: full CRUD on `safety_keywords` table with filtering by category and active status. |
| Discussion moderation notifications to admin | PRD-21C | Notification type wired: when items are flagged for moderation in the Vault, an in-app notification alerts admins with `moderation_admin` permission. |
| Admin book ethics review UI | PRD-23 (Deferred #8) | Fully defined in Screen 3 > Ethics Review sub-tab: review BookShelf-extracted content flagged by ethics gate. |
| Feedback & Bug Reporting System | Build Order Source of Truth v2 | Fully defined: user-facing FAB (Screen 10) + LiLa Help integration (Screen 11) + Settings entry (Screen 12) + admin dashboard (Screens 7-9) + sentiment filter + diagnostic pipeline + known issues library + solution routing to LiLa Help. |

---

## What "Done" Looks Like

### MVP (Must Have)

**Admin Console — System Tab:**
- [ ] Admin User Management screen (Screen 1) — add, edit, remove admin users with per-tab permissions
- [ ] Hardcoded super admin emails displayed with lock icon, not editable
- [ ] Users & Families search and detail view (Screen 2) — read access to all users and family structures
- [ ] Disable/Enable account actions functional via Supabase Auth admin API
- [ ] Admin notes on users and families (CRUD)
- [ ] Safety Keywords CRUD (Screen 3 > Keywords) with filter by category and active status
- [ ] Safety Resources CRUD (Screen 3 > Resources) with drag-to-reorder
- [ ] Ethics Review queue (Screen 3 > Ethics Review) — approve/reject/edit ethics-flagged BookShelf extractions
- [ ] `admin_notes` table created with RLS policies
- [ ] RLS verified: only users with `system_admin` or `super_admin` permission can access System tab routes

**Admin Console — Analytics Tab:**
- [ ] Platform Overview dashboard (Screen 4) — summary cards, feature adoption bars, tier distribution
- [ ] Intelligence Review queue (Screen 5) — all 12 channels, filter/sort, approve/refine/reject/defer actions
- [ ] Bulk mode in Intelligence Review for multi-select approve/reject
- [ ] Special handling for Book Knowledge (Channel E) and Safe Harbor (Channel I) review items
- [ ] AI Cost Monitoring dashboard (Screen 6) — total cost, per-family average/median, cost by feature, cost by model
- [ ] `ai_usage_log` table created with RLS policies
- [ ] `platform_usage_log` table created with RLS policies
- [ ] All AI-calling Edge Functions instrumented to log to `ai_usage_log`
- [ ] Key feature interactions instrumented to log to `platform_usage_log`
- [ ] RLS verified: only users with `analytics_admin` or `super_admin` permission can access Analytics tab routes

**Admin Console — Feedback Tab:**
- [ ] Submissions dashboard (Screen 7) — all feedback types, filtering, sorting, summary cards
- [ ] Glitch detail view with full diagnostic data (Screen 8)
- [ ] "Copy for Claude Code" button produces formatted markdown diagnostic block
- [ ] Resolution form with known issue creation option (Screen 9)
- [ ] Known Issues library with CRUD, keyword management, and hit count display
- [ ] `feedback_submissions` table created with RLS policies
- [ ] `known_issues` table created with RLS policies
- [ ] `reported_threats` table created with RLS policies
- [ ] `feedback-attachments` Supabase Storage bucket created
- [ ] Sentiment auto-triage runs on every new submission (embedding-based)
- [ ] Duplicate detection flags similar recent submissions
- [ ] RLS verified: only users with `feedback_admin` or `super_admin` permission can access Feedback tab routes

**User-Facing Feedback:**
- [ ] Feedback FAB (Screen 10) — top-left position, three-option menu, visible to Mom/Dad/Teen shells
- [ ] html2canvas screenshot auto-capture on "Report a Glitch" tap
- [ ] Console error circular buffer (in-memory, last 20 errors)
- [ ] Navigation history circular buffer (in-memory, last 10 route changes)
- [ ] Diagnostic data auto-attached to glitch reports (route, device, browser, console errors, recent actions)
- [ ] All three feedback forms functional (Glitch, Feature, Praise)
- [ ] FAB controlled by `is_feedback_fab_active` feature flag
- [ ] LiLa Help integration (Screen 11) — known issue lookup before AI fallthrough, offer to create feedback submission
- [ ] Settings feedback section (Screen 12) — three buttons opening same modal forms
- [ ] Rate limiting: max 5 submissions per user per 10-minute window
- [ ] Submission confirmation shown to user

**Permission registration:**
- [ ] `system_admin`, `analytics_admin`, `feedback_admin` permission types registered in `staff_permissions`
- [ ] All new permission types function correctly with the admin console shell's tab visibility logic

### MVP When Dependency Is Ready

- [ ] Offline feedback queuing (depends on PRD-33 sync engine)
- [ ] Push notification to admin for critical glitch reports (depends on PRD-33 service workers)
- [ ] Per-family AI cost data consumed by PRD-31 for usage limits and credit tracking

### Post-MVP

- [ ] Admin activity log (audit trail across all tabs)
- [ ] Per-family AI cost drill-down
- [ ] Per-feature analytics deep dives
- [ ] Trend visualization charts in Platform Overview
- [ ] User-facing submission history ("My Feedback" page)
- [ ] Feature as Testimonial consent workflow
- [ ] Strategies & Snippets blog management tab (separate PRD)
- [ ] Cohort analysis in Platform Overview
- [ ] Automated weekly admin digest email summarizing new feedback, cost trends, and intelligence queue status

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: All AI-calling Edge Functions MUST log to `ai_usage_log` with family_id, feature name, model, token counts, and estimated cost. This is non-negotiable — cost tracking depends on it.
- [ ] Convention: The Feedback FAB is controlled by the `is_feedback_fab_active` app configuration flag. When false, the FAB is hidden but all other feedback entry points (LiLa Help, Settings) remain active.
- [ ] Convention: Console error and navigation circular buffers are in-memory only (no localStorage, no persistence). Maximum 20 errors, 10 navigation events. Only transmitted with explicit user-initiated glitch reports.
- [ ] Convention: Admin notes use a polymorphic `entity_type` + `entity_id` pattern. When adding admin notes to a new entity type, add the type to the `entity_type` CHECK constraint.
- [ ] Convention: Sentiment classification for feedback uses the P1 embedding-based pattern (text-embedding-3-small + similarity comparison against a pattern library), NOT per-submission LLM calls.
- [ ] Convention: Known issues in the `known_issues` table are checked by LiLa Help via keyword array matching BEFORE falling through to AI. This is a synchronous check in the LiLa Help response pipeline.
- [ ] Convention: The `ai_usage_log` table is append-only and high-volume. Use fire-and-forget inserts with retry. Never block an AI call on a failed cost log.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `feedback_submissions`, `known_issues`, `reported_threats`, `admin_notes`, `ai_usage_log`, `platform_usage_log`
Enums updated: `staff_permissions.permission_type` extended with `system_admin`, `analytics_admin`, `feedback_admin`
Triggers added: `updated_at` auto-trigger on `feedback_submissions`, `known_issues`
Storage buckets: `feedback-attachments`

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Five admin tabs: AI Vault, Moderation, System, Analytics, Feedback | Each domain is focused and independently delegatable via per-tab permissions. |
| 2 | Feedback FAB positioned top-left on mobile | Bottom-right is taken by LiLa buttons. Top-left is visible without conflicting with existing UI elements. |
| 3 | FAB visible to Mom, Dad, and Teen. Not Guided/Play. | Young children shouldn't submit bug reports. Teens are valuable feedback sources. |
| 4 | html2canvas for screenshot capture | Zero ongoing cost, well-maintained, captures actual page state. Users can also attach manual images. |
| 5 | Sentiment filter: auto-flag, never auto-delete | Flagged items sorted to bottom. Threats preserved for potential law enforcement reporting. |
| 6 | Embedding-based sentiment classification (not Haiku) | Consistent with P1 cost optimization pattern. Works well for short text. No per-submission AI cost. |
| 7 | "Copy for Claude Code" diagnostic format | Simple, reliable, immediately useful. Formats diagnostics as paste-ready markdown. |
| 8 | Known issues table with keyword matching feeds LiLa Help | Growing FAQ that LiLa Help checks before AI. Includes customer-facing workaround text for both active issues and resolved fixes. |
| 9 | Platform Intelligence Review under Analytics tab | "Look at data and make decisions" work belongs together. Sub-navigation separates passive metrics from active review workflow. |
| 10 | Per-tab permissions only at MVP | Matches existing `staff_permissions` model. Sub-tab granularity unnecessary before multiple employees. |
| 11 | User/Family management is read-heavy | Admin should never edit family internal data. Write ops limited to account-level actions and admin notes. |
| 12 | AI cost tracking per-family from day one | `ai_usage_log` captures family_id on every AI call. Provides foundation for PRD-31's usage limits and credit system. |
| 13 | FAB is beta-flagged with kill switch | `is_feedback_fab_active` flag. Permanent feedback lives in LiLa Help + Settings simultaneously. |
| 14 | Strategies & Snippets gets its own full PRD | Separate public-facing surface warrants dedicated design attention. PRD-32 stubs the dual-publish infrastructure. |
| 15 | Dual-publish for some content types, separate editor for blog-only | Vault content can optionally publish to blog. Blog-only articles (news, product updates) use a separate workflow in the blog PRD. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Admin activity log | Post-MVP enhancement. Audit trail across all admin tabs. |
| 2 | Per-family AI cost drill-down | Post-MVP. Data captured from day one; UI deferred. |
| 3 | Per-feature analytics deep dives | Post-MVP. Basic adoption metrics at MVP. |
| 4 | User-facing submission history | Post-MVP. Users can't currently see their past submissions. |
| 5 | Feature as Testimonial consent workflow | Post-MVP / Marketing PRD. Praise can be flagged but consent flow not built. |
| 6 | Strategies & Snippets blog management | Dedicated PRD (TBD number). Stubbed infrastructure in PRD-32. |
| 7 | Cohort analysis | Post-MVP analytics enhancement. |
| 8 | Weekly admin digest email | Post-MVP. Automated summary of new feedback, costs, intelligence queue. |
| 9 | Trend visualization charts | Post-MVP. Simple numbers at MVP; charts later. |
| 10 | Sub-tab permission granularity | Post-MVP. Per-tab is sufficient until multiple employees. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-02 (Permissions) | Three new `staff_permissions.permission_type` values: `system_admin`, `analytics_admin`, `feedback_admin`. | Add to permission type documentation/CHECK constraint. |
| PRD-04 (Shell Routing) | New sub-routes: `/admin/system`, `/admin/analytics`, `/admin/feedback`. FAB component added to Mom, Dad, and Independent shell layouts. | Add routes to admin routing config. Add FAB to shell layout components with feature flag check. |
| PRD-05 (LiLa Core / LiLa Help) | LiLa Help now checks `known_issues` table via keyword matching before AI fallthrough. New step in LiLa Help response pipeline. Can offer to create feedback submissions. | Add known_issues lookup step to LiLa Help pipeline. Add "report this" flow to LiLa Help conversation handling. |
| PRD-21B (Admin Console Shell) | Tab registry extended with 3 new tabs. All PRD-21B stubs for System and Analytics tabs are now wired. | Update tab registry. Mark stubs as wired. |
| PRD-21C (Moderation) | Moderation notification to admin stub wired — alerts `moderation_admin` permission holders. | Mark stub as wired. |
| PRD-22 (Settings) | Feedback section added to Settings with three feedback form buttons. | Add Feedback section to Settings category navigation. |
| PRD-23 (BookShelf) | Admin book ethics review UI stub wired — Ethics Review sub-tab in System tab. | Mark deferred #8 as wired by PRD-32. |
| PRD-30 (Safety Monitoring) | Admin keyword management UI stub wired — Safety Config sub-tab in System tab. Safety resources management also built. | Mark "Admin keyword management UI" stub as wired. |
| PRD-31 (Subscription Tier System) | `ai_usage_log` table provides per-family cost data foundation for usage limits, credits, and thermometer widget. | Reference `ai_usage_log` as the data source for credit consumption tracking. |
| Platform Intelligence Pipeline v2 | Admin review workflow fully defined in Screen 5. All 12 channels supported. Bulk mode, special handling for Channel E and I. | Reference PRD-32 Screen 5 as the review UI. |
| Build Order Source of Truth | PRD-32 completed. All admin console stubs resolved except Strategies & Snippets (separate PRD). | Update remaining PRDs list. Add Strategies & Snippets to TBD list. |

---

*End of PRD-32*
