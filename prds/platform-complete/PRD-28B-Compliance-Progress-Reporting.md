> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-28B: Compliance & Progress Reporting

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-05 (LiLa Core AI System), PRD-09A (Tasks, Routines & Opportunities), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-19 (Family Context & Relationships — report generation infrastructure), PRD-22 (Settings), PRD-28 (Tracking, Allowance & Financial — homeschool tracking data), PRD-36 (Universal Timer), PRD-37 (Family Feeds — portfolio feed data)
**Parent PRD:** PRD-28 (Tracking, Allowance & Financial)
**Created:** March 18, 2026
**Last Updated:** March 18, 2026

---

## Overview

PRD-28B is the universal compliance and progress reporting engine for MyAIM Family. It transforms tracked data from across the platform into formatted outputs that families submit to state programs, oversight teachers, evaluators, case managers, and service coordinators. The engine is template-based: each report type is a template that teaches LiLa what a correct report looks like, and the system gathers relevant data for a given date range and member, formats it according to the template, and presents it for mom's review before export.

Two template families are fully designed in this PRD: **Homeschool Compliance Templates** (driven by the ESA/voucher market opportunity — 400,000+ students across 18+ states with earmarked education funding) and **SDS/Disability Monthly Summary Templates** (driven by the founder's personal need for Ruthie's Self-Directed Supports reporting). Additional template families — IEP progress reports, therapy summaries, and custom templates — are stubbed for future development. The architecture serves all of them identically.

This PRD also defines the **Standards-Based Portfolio Tracker** (a living checklist view of educational standards with evidence linking), the **ESA Invoice Generator** (available at all tiers), and the **Family Newsletter** template (consuming Family Feed data from PRD-37). It builds on the report generation infrastructure established in PRD-19 (Screens 5-6, `generated_reports` table, `monthly_data_aggregations` table) and consumes data from PRD-28's `homeschool_time_logs`, PRD-37's `family_moments` (portfolio-tagged entries), and PRD-02's caregiver shift system.

> **Mom experience goal:** I hit "Generate Weekly Report," pick a date range, and LiLa pulls together everything we tracked this week — tasks completed, subjects covered, hours logged, portfolio photos — and formats it into a report my evaluator will accept. I review it, tweak one sentence, hit export, and I have a PDF. The whole process takes less time than writing one paragraph by hand. For Ruthie's monthly SDS report, the aides' shift logs and my observations merge into one cohesive document. I'm not doing double bookkeeping — I tracked it once, and now it's a report.

---

## Architectural Boundaries

### What PRD-28B Owns

| System | Scope |
|--------|-------|
| Report template library | Template definitions, required fields, formatting rules, LiLa instructions per template |
| Report generation flow | Data gathering, LiLa formatting, Human-in-the-Mix review, export |
| Standards Portfolio Tracker | Standards lists, evidence linking, living view, portfolio export |
| Education standards data | Import/storage of standards frameworks, LiLa generation for gaps |
| ESA Invoice Generator | Invoice template, auto-population, PDF export |
| Family Newsletter template | Feed highlight aggregation, photo selection, narrative generation |
| Homeschool configuration extensions | State selection, grade level, reporting schedule, evaluator info |
| Reporting reminder notifications | Schedule-based reminders for report submission deadlines |

### What Other PRDs Own (Not Duplicated Here)

| PRD | What It Owns | How PRD-28B Connects |
|-----|-------------|---------------------|
| PRD-19 (Family Context) | `generated_reports` table, `monthly_data_aggregations` table, Report Generation page (Screen 5), Reports Page (Screen 6) | PRD-28B adds new template_type values and extends the report generation flow with compliance-specific features. Does NOT replace PRD-19 screens — extends them. |
| PRD-28 (Tracking) | `homeschool_time_logs`, `homeschool_subjects`, `homeschool_configs` | PRD-28B reads this data for report generation. Does NOT modify these tables. |
| PRD-37 (Family Feeds) | `family_moments` (portfolio-tagged entries), portfolio feed display | PRD-28B reads portfolio moments as evidence items and includes them in reports. |
| PRD-02 (Permissions) | `shift_sessions`, caregiver shift logging | PRD-28B reads shift data for SDS/disability monthly summaries. |
| PRD-15 (Messages/Notifications) | Notification delivery system | PRD-28B registers reporting reminder notifications. |

---

## User Stories

### Homeschool Compliance Reporting
- As a homeschool mom, I want to generate a weekly narrative report that summarizes what my kids learned, with subject hours and activity descriptions, so I can submit it to my oversight teacher.
- As a homeschool mom in an ESA program, I want reports formatted to my state's requirements so my evaluator accepts them without questions.
- As a homeschool mom, I want to hit one button and get a report covering the last week — I don't want to remember what we did or manually compile anything.
- As a homeschool mom, I want to set up a reporting schedule with reminders so I never miss a submission deadline.

### Standards Portfolio
- As a homeschool mom, I want to browse a checklist of my state's educational standards and see which ones have evidence linked so I know where our gaps are.
- As a homeschool mom, I want LiLa to suggest 2-3 age-appropriate activities per standard so I have ideas for covering gaps.
- As a homeschool mom, I want to export a standards portfolio as a formatted PDF that an evaluator can flip through.

### SDS/Disability Reporting
- As a mom managing my daughter's SDS services, I want a monthly report that merges aide shift logs with my own observations into one cohesive document so I can submit it to my case manager.
- As a mom, I want to track behavioral, health, grooming, safety, and social needs over time so I have documented evidence of why services are necessary.
- As a mom, I want the report to include data from caregiver shifts and my personal notes without me having to manually combine them.

### ESA Invoice
- As a family in an ESA/voucher program, I want a professional invoice showing my subscription payment as an educational software expense so I can submit it for reimbursement.

### Family Newsletter
- As a mom, I want to generate a beautiful newsletter highlighting our family's recent moments so I can share it with extended family who aren't on the app.

---

## Screens

### Screen 1: Report Generation (Extension of PRD-19 Screen 5)

> **Depends on:** PRD-19 Screen 5 for the base report generation page. PRD-28B extends the template selection and adds compliance-specific features.

**What the user sees:**

The existing PRD-19 report generation page, extended with new template categories:

```
┌──────────────────────────────────────────────┐
│  Generate Report                         ✕   │
│  ─────────────────────────────────────────── │
│  Report For: [Emma ▼]                        │
│                                              │
│  Category: [Homeschool Compliance ▼]         │
│  ─────────────────────────────────────────── │
│  Template:                                   │
│  ○ Weekly Activity Log (basic)               │
│  ○ Subject Hours Summary (basic)             │
│  ○ Narrative Weekly Report (AI ✨)            │
│  ○ Standards-Aligned Activity Report (AI ✨)  │
│  ○ Portfolio Learning Summary (AI ✨)         │
│  ○ Annual Progress Report (AI ✨)             │
│  ○ Evaluator-Ready Report (AI ✨)             │
│  ─────────────────────────────────────────── │
│  Date Range: [Mar 11] to [Mar 17]            │
│  ─────────────────────────────────────────── │
│  Include portfolio photos: [✓]               │
│  Include time breakdown: [✓]                 │
│  ─────────────────────────────────────────── │
│                                              │
│        [Preview]  [Generate & Save]          │
└──────────────────────────────────────────────┘
```

**Template categories (in the Category dropdown):**
- **General** (from PRD-19): Monthly Summary, List of Accomplishments, Update LiLa Context
- **Homeschool Compliance** (new): 6 basic + 6 AI-enhanced templates
- **Disability & Progress** (new — SDS template fully designed, others stubbed): SDS Monthly Summary, IEP Progress Report (stub), Therapy Summary (stub)
- **Family** (new): Family Newsletter
- **Financial** (new): ESA Invoice/Receipt

**Template details by category:**

#### Homeschool Compliance Templates — Basic (Lower Tier)

| Template | What It Contains | Data Sources |
|----------|-----------------|-------------|
| Weekly Activity Log | Date-by-date list of activities, subjects, time logged per child | `homeschool_time_logs`, `family_moments` (portfolio-tagged) |
| Subject Hours Summary | Table: subject name × hours logged for the date range | `homeschool_time_logs` |
| Monthly Progress Report | Per-subject: hours, key activities, milestones | `homeschool_time_logs`, task completions, portfolio moments |
| Attendance Record | Days with logged activity = attendance days | `homeschool_time_logs` (distinct dates) |
| Portfolio Table of Contents | List of portfolio entries with dates, subjects, descriptions | `family_moments` (homeschool-tagged) |
| Expense/Purchase Log | Educational purchases and subscriptions | `financial_transactions` (education-category) + manual entries |

#### Homeschool Compliance Templates — AI-Enhanced (Full Magic)

| Template | What LiLa Does | Data Sources |
|----------|---------------|-------------|
| Narrative Weekly Report | Writes a warm, professional narrative about the week's learning activities. Organized by subject or by day. | All homeschool data + portfolio entries |
| Standards-Aligned Activity Report | Maps activities to educational standards, shows coverage progress | All homeschool data + `education_standards` + evidence links |
| Portfolio Learning Summary | Narrative summary with embedded portfolio photos and descriptions | `family_moments` (portfolio highlights) + portfolio media |
| Annual Progress Report | Comprehensive year-in-review: subject hours, standards coverage, growth narrative | Full year's data across all sources |
| Evaluator-Ready Report | Formatted specifically for evaluator review: executive summary, detailed activity log, standards coverage, work samples | All data, formatted per state conventions |
| Florida Student Learning Plan | SLP format required by Florida PEP program: goals, methods, materials, assessment plan | All homeschool data, formatted to FL requirements |

> **Decision rationale:** Basic templates do data formatting only — no AI cost. They pull tracked data and arrange it into a clean layout. AI-enhanced templates have LiLa write narratives, make standards connections, and format to state-specific requirements. The tier split ensures every homeschool family gets useful compliance output, with AI enhancement as the upgrade incentive.

#### SDS/Disability Templates

| Template | What It Contains | Data Sources |
|----------|-----------------|-------------|
| SDS Monthly Summary (AI-enhanced) | Monthly report for Self-Directed Supports programs. Structure matches Acumen DCI portal "ER or DR Monthly Summary" format. | `shift_sessions` + shift notes (caregiver logging), mom's observations (`family_moments` tagged 'progress'), `widget_data_points` (behavioral tracking), ISP goals (configured per member), personal goals (Guiding Stars, Best Intentions, LifeLantern, victories), budget data (manual entry or imported) |

**SDS Monthly Summary — Full Template Structure:**

The report is generated as copy/paste-ready text for the family's service portal (e.g., Acumen DCI). Structure:

```
Monthly Summary and Budget Tracking

[Opening paragraph: brief overview of the month's spending, staffing 
status, and any staffing changes. Mention if under/over budget.]

Overall Status of the Individual:

[1-2 paragraphs about how the member's month went overall. Include 
health updates, mood, notable events, family happenings, milestones. 
Include personal goal progress from MyAIM tracking (Guiding Stars, 
Best Intentions, LifeLantern, victories) to paint a richer picture 
of the whole person being supported. Written warmly and personally — 
this is written by the parent.]

Activities:

[Describe what the member did during the month with aides. Reference 
specific activities from caregiver shift logs — enrichment days, 
field trips, community outings, in-home activities. Describe the 
support aides provided: toileting, hand washing, meal support, peer 
interaction coaching, safety monitoring, etc.]

Progress Towards Outcomes/Goals in the ISP:

[For each ISP goal configured for this member: describe progress, 
reference specific instances from shift logs, note level of support 
needed, highlight wins. Goals are configurable per member — not 
hardcoded. Each family enters their member's ISP goals during setup.]

Budget Review:

[Narrative paragraph about budget status. Reference whether 
under/over budget. Mention factors affecting spending.]

Budget Status:

Amount Used YTD: [from budget data]
Amount Pending: [if available]
Amount Remaining: [from budget data]
```

**SDS Report Configuration (per member):**

During setup, mom configures:
- **ISP Goals:** Enter the member's specific ISP goals (text + description). These become the report's goal sections. Editable anytime — goals change at ISP reviews.
- **Support needs categories:** Which categories to track (behavioral, health, grooming, safety, social, communication, daily living, etc.). These inform what data LiLa looks for in shift logs.
- **Program language guidelines:** Per-state/per-program phrasing rules. Stored as configuration, not hardcoded. Default set provided for Missouri SDS with guidance like: frame activities as "enrichment/community participation" not "school," frame skill-building as "daily living skills" not "tutoring," emphasize what support was provided TO the member specifically.
- **Budget information:** Initial balance, authorization dates. Updated monthly or pulled from uploaded spending summary.
- **Personal goals to include:** Toggle which MyAIM personal goals (Guiding Stars, Best Intentions, LifeLantern goals) should be woven into the "Overall Status" section for a richer picture.

**LiLa writing style for SDS reports:**
- Personal and warm, not clinical. Written in the parent's voice.
- Detailed but conversational. Include specific anecdotes.
- Honest about challenges — mention behaviors matter-of-factly alongside progress.
- Celebratory of progress, including small wins.
- Follows the family's configured program language guidelines.
- References specific activities by name when known from shift data.
- No bullet points — flowing prose paragraphs.

**Data gathering workflow:**
1. Mom hits "Generate SDS Monthly Summary" and selects the member and month.
2. LiLa gathers: all caregiver shift logs for the period, all `family_moments` tagged 'progress' for this member, all behavioral/health/social widget data points, personal goal progress, budget data.
3. LiLa shows mom what it found: "From the shift notes, it looks like Ruthie went to enrichment days on Tuesdays/Thursdays, had a field trip with Shanda, and Kyah worked on sharing and cleaning up. Does that sound right? Anything to add?"
4. Mom answers targeted follow-up questions (max 3-5): health updates, staffing changes, big events, anything to add per ISP goal, budget concerns.
5. LiLa generates the full report. Mom reviews via Human-in-the-Mix (Edit/Approve/Regenerate/Reject).
6. Final output is plain text, copy/paste-ready for the service portal, and also saved as PDF in Archives.

> **Decision rationale:** The SDS template is configurable per member, not hardcoded to any specific person's ISP goals. Different families have different goals, different ages, different programs. Mom enters her child's ISP goals during setup, and the report structure adapts. Program language guidelines are also configurable per family — Missouri SDS conventions are the default set, but families in other states or programs can customize.

> **Forward note:** IEP Progress Report and Therapy Summary templates are stubbed. The architecture supports them — they're just additional template definitions consuming the same data pool. Will be designed when user demand or founder need dictates.

---

### Screen 2: Report Preview & Edit (Human-in-the-Mix)

> **Mom experience goal:** I see the report before anyone else does. I can change anything. Nothing goes out without my approval.

**What the user sees:**

After clicking [Preview] or [Generate & Save], the report renders in a preview modal:

```
┌──────────────────────────────────────────────┐
│  Report Preview                          ✕   │
│  ─────────────────────────────────────────── │
│  Narrative Weekly Report — Emma              │
│  March 11-17, 2026                           │
│  ─────────────────────────────────────────── │
│                                              │
│  This week, Emma explored several subjects   │
│  with enthusiasm and focus. In Mathematics,  │
│  she completed her daily Synthesis assign-   │
│  ments (5 sessions, ~150 minutes total),     │
│  working through multi-step problems...      │
│                                              │
│  [Full rendered report content]              │
│                                              │
│  ─────────────────────────────────────────── │
│  ⚠️ "This report was generated by MyAIM     │
│  Family to assist with record-keeping. The   │
│  parent/guardian is solely responsible for    │
│  verifying accuracy and ensuring compliance  │
│  with their state's requirements."           │
│  ─────────────────────────────────────────── │
│                                              │
│  [Edit] [Approve & Save] [Regenerate] [Cancel]│
└──────────────────────────────────────────────┘
```

**Interactions:**
- **[Edit]** opens the report content in an editable text area. Mom can modify any text. For AI-enhanced templates, she can also adjust data inclusion (add/remove activities, change time entries).
- **[Approve & Save]** finalizes the report: saves to `generated_reports`, generates PDF, stores in member's Archive.
- **[Regenerate]** sends the report back to LiLa with optional mom instructions ("Make it shorter" / "Emphasize the science activities" / "More formal tone").
- **[Cancel]** discards without saving.

**The disclaimer appears on every generated report.** It is not removable. It protects both the family and Three Little Lanterns LLC.

**Data created:**
- `generated_reports` record with full content
- PDF stored in Supabase Storage
- `archive_context_items` record linking report to member's Archive

---

### Screen 3: Standards Portfolio Living View

> **Mom experience goal:** I open this view and immediately see: "We've covered 67% of 3rd grade math standards." I can drill into any standard and see what evidence we have. Where there are gaps, LiLa suggests activities.

**What the user sees:**

Accessible from: Homeschool Portfolio tab → [Standards] button, or from Settings → Homeschool Configuration → View Standards.

```
┌──────────────────────────────────────────────┐
│  Standards Portfolio — Emma (Grade 3)        │
│  [Math ▼]  67% covered  [Generate Report]    │
│  ─────────────────────────────────────────── │
│                                              │
│  ✅ 3.OA.1 — Interpret multiplication        │
│     Evidence: Synthesis Math Day 12,          │
│     Array worksheet (photo)                   │
│     [+ Add Evidence]                          │
│  ─────────────────────────────────────────── │
│  ✅ 3.OA.2 — Interpret whole-number          │
│     quotients                                 │
│     Evidence: Division practice log           │
│     [+ Add Evidence]                          │
│  ─────────────────────────────────────────── │
│  ⬜ 3.OA.3 — Solve multiplication and        │
│     division word problems                    │
│     No evidence yet                           │
│     [+ Add Evidence] [💡 LiLa Suggest]       │
│  ─────────────────────────────────────────── │
│  ⬜ 3.OA.4 — Determine unknown whole         │
│     number in multiplication/division         │
│     No evidence yet                           │
│     [+ Add Evidence] [💡 LiLa Suggest]       │
│  ─────────────────────────────────────────── │
│  ... (more standards)                         │
└──────────────────────────────────────────────┘
```

**Elements:**
- **Student picker** and **grade level** at top (from homeschool config).
- **Subject filter** dropdown.
- **Coverage percentage** calculated as standards-with-evidence ÷ total standards.
- **Per-standard row:** Standard code + description, evidence items (linked from portfolio moments and task completions), [+ Add Evidence] to manually link, [💡 LiLa Suggest] for activity ideas (Full Magic).
- **[Generate Portfolio Report]** button → exports the Standards Portfolio as a formatted PDF with evidence items, photos, and coverage summary.

**Evidence linking:**
- Completed tasks that are tagged with standards automatically link. (A task in a Sequential Collection with a standard tag creates a link when completed.)
- Portfolio feed entries with standards links (from PRD-37) automatically appear.
- Mom can manually link any existing portfolio entry, task completion, or uploaded document to a standard via [+ Add Evidence].

**LiLa Suggest (Full Magic):**
- For uncovered standards, LiLa generates 2-3 age-appropriate activity suggestions.
- Suggestions include: activity description, estimated time, materials needed.
- Mom can tap a suggestion to create a task (routed to PRD-09A) or a Sequential Collection item.

**Data created/updated:**
- `standard_evidence` records (linking standards to evidence items)
- Optionally: new tasks via LiLa suggestions

> **Decision rationale:** The Standards Portfolio is a living view — it's a query against existing data, not a separate data store. Evidence links are stored in `standard_evidence`, but the standards themselves and the portfolio entries come from other tables. This keeps it near-zero cost for the lower tier (just querying existing data). AI suggestions are the Full Magic upgrade.

---

### Screen 4: ESA Invoice Generator

**What the user sees:**

Accessible from: Settings → Homeschool Configuration → Generate Invoice, or from the Report Generation page under the "Financial" category.

```
┌──────────────────────────────────────────────┐
│  ESA Invoice                             ✕   │
│  ─────────────────────────────────────────── │
│                                              │
│  From: Three Little Lanterns LLC             │
│  Address: [auto-populated from business info]│
│  EIN: [auto-populated]                       │
│                                              │
│  Bill To:                                    │
│  Parent Name: [auto-populated from account]  │
│  Student Name: [Emma ▼]                      │
│                                              │
│  Invoice Number: INV-2026-03-001             │
│  Invoice Date: March 18, 2026                │
│  Service Period: Mar 1 - Mar 31, 2026        │
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ Description          │ Amount     │     │
│  ├────────────────────────────────────┤     │
│  │ MyAIM Family -       │            │     │
│  │ Educational Software │ $25.00     │     │
│  │ Subscription         │            │     │
│  │ (AI-powered family   │            │     │
│  │ learning management  │            │     │
│  │ and compliance       │            │     │
│  │ reporting platform)  │            │     │
│  ├────────────────────────────────────┤     │
│  │ Total                │ $25.00     │     │
│  └────────────────────────────────────┘     │
│                                              │
│        [Download PDF]  [Save to Reports]     │
└──────────────────────────────────────────────┘
```

**Fields:**
- **From:** Three Little Lanterns LLC business info (hard-coded in template).
- **EIN:** Business EIN (hard-coded in template).
- **Bill To:** Parent name (from account), student name (picker — one invoice per student for ESA purposes).
- **Invoice Number:** Auto-generated sequential: INV-YYYY-MM-NNN.
- **Service Period:** Auto-populated from billing period.
- **Description:** Pre-written educational purpose text optimized for ESA vendor acceptance. Editable by mom if needed.
- **Amount:** Current subscription amount for the billing period.

**Interactions:**
- [Download PDF] generates and downloads the invoice as a professional PDF.
- [Save to Reports] stores the invoice in `generated_reports` and the member's Archive.
- Mom can edit the description text if her specific ESA program requires different language.

> **Decision rationale:** The invoice is available at ALL tiers. Zero AI cost — it's just a template with auto-populated fields. This directly enables ESA revenue for every subscriber. The description emphasizes "educational software" and "learning management" — language that aligns with ESA approved expense categories.

---

### Screen 5: Homeschool Configuration (Settings Extension)

> **Depends on:** PRD-22 (Settings) for the settings overlay container. Extends PRD-28's homeschool configuration.

**What the user sees:**

New section in Settings → Homeschool Configuration:

```
┌──────────────────────────────────────────────┐
│  Homeschool Configuration                    │
│  ─────────────────────────────────────────── │
│                                              │
│  State: [Missouri ▼]                         │
│  (Determines available standards and report  │
│   template recommendations)                  │
│                                              │
│  Students:                                   │
│  ┌────────────────────────────────────┐     │
│  │ Emma — Grade 3                     │     │
│  │ Standards: Common Core (default)   │     │
│  │ [Edit Grade] [Change Standards]    │     │
│  ├────────────────────────────────────┤     │
│  │ Zy — Grade 5                       │     │
│  │ Standards: Common Core (default)   │     │
│  │ [Edit Grade] [Change Standards]    │     │
│  └────────────────────────────────────┘     │
│                                              │
│  School Year: [Aug 15, 2025] to [Jun 1, 2026]│
│                                              │
│  Evaluator/Oversight Teacher:                │
│  Name: [Mrs. Johnson]                        │
│  Email: [johnson@school.org] (for headers)   │
│                                              │
│  ESA/Voucher Program: [None ▼]               │
│  (Options: None, Arizona ESA, Florida FES,   │
│   Utah Fits All, Iowa ESA, etc.)             │
│                                              │
│  Reporting Schedule:                         │
│  Frequency: [Weekly ▼]                       │
│  Reminder: [Sunday 7:00 PM ▼]               │
│  ─────────────────────────────────────────── │
│  [Generate Invoice]                          │
│  [View Standards Portfolio]                  │
└──────────────────────────────────────────────┘
```

**Fields stored:**
- State (drives standards framework recommendations and report template suggestions)
- Per-student grade level (drives which standards are loaded)
- Per-student standards framework (Common Core default, state-specific where available, classical, custom)
- School year dates (start/end for annual boundaries in reports)
- Evaluator info (name, email — used in report headers)
- ESA/voucher program selection (drives template recommendations and invoice language)
- Reporting schedule and reminder configuration

**Data created/updated:**
- `homeschool_family_config` record (new table — family-level config)
- `notification_schedules` record for reporting reminders (routes through PRD-15)

---

### Screen 6: Reporting Schedule & Reminders

> **Mom experience goal:** The app reminds me Sunday evening that it's time to generate this week's report. I tap the reminder, it opens the report generator pre-filled with this week's dates, and I'm done in two minutes.

**What the user sees:**

Reminders appear as notifications (PRD-15) on the configured schedule:

```
┌──────────────────────────────────────────────┐
│  🔔 Weekly Report Reminder                   │
│  It's time to generate this week's           │
│  homeschool report (Mar 11-17).              │
│  [Generate Now] [Snooze 1 Day] [Dismiss]     │
└──────────────────────────────────────────────┘
```

**Interactions:**
- [Generate Now] opens the Report Generation page (Screen 1) pre-filled with the current reporting period dates and the family's configured template.
- [Snooze 1 Day] reschedules the reminder.
- [Dismiss] clears the notification.

**Mom triggers report generation manually.** Reports are never auto-generated. The reminder just opens the door — mom walks through it when she's ready.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full access | Generate reports, view standards, configure homeschool settings, generate invoices, manage reporting schedule. |
| Dad / Additional Adult | View generated reports if mom grants Archive access. Cannot generate or configure. | Report viewing follows existing Archive permission model from PRD-19. |
| Special Adult | Not present | Compliance reporting is not accessible during caregiver shifts. Caregivers contribute data (shift logs) that feeds into reports, but they don't interact with the reporting system directly. |
| Independent (Teen) | View own standards portfolio (read-only). Cannot generate reports. | Teens can see their own standards coverage but cannot generate or export reports. |
| Guided / Play | Not present | No access to reporting or standards views. |

### Shell Behavior

| Shell | What Appears | What's Different |
|-------|-------------|-----------------|
| Mom Shell | Report Generation (extended), Standards Portfolio, ESA Invoice, Homeschool Config in Settings, Reporting Reminders. | Full compliance management surface. |
| Dad Shell | Generated reports in Archives (if permitted). | Read-only. No generation, configuration, or invoice access. |
| Special Adult Shell | Not present. | Caregivers log shift data that feeds reports, but don't see reporting features. |
| Independent Shell | Own Standards Portfolio (read-only). | Can browse their standards coverage. Cannot generate reports or export. |
| Guided / Play Shell | Not present. | No compliance features visible. |

---

## Data Schema

### Table: `homeschool_family_config`

Family-level homeschool compliance configuration. Extends PRD-28's per-child config with family-wide settings.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families (UNIQUE) |
| state | TEXT | | NULL | US state abbreviation. Drives standards and template recommendations. |
| school_year_start | DATE | | NULL | Start of current school year |
| school_year_end | DATE | | NULL | End of current school year |
| evaluator_name | TEXT | | NULL | Oversight teacher / evaluator name (for report headers) |
| evaluator_email | TEXT | | NULL | |
| esa_program | TEXT | | NULL | Which ESA/voucher program. NULL = none. |
| reporting_frequency | TEXT | 'weekly' | NOT NULL | 'weekly', 'biweekly', 'monthly', 'quarterly' |
| reporting_reminder_day | TEXT | 'sunday' | NOT NULL | Day of week for reminder |
| reporting_reminder_time | TIME | '19:00:00' | NOT NULL | Time for reminder notification |
| default_report_template | TEXT | | NULL | Family's preferred template for quick generation |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. Other members read.

**Indexes:**
- `(family_id)` UNIQUE — one config per family

---

### Table: `homeschool_student_config`

Per-student compliance configuration extending PRD-28's `homeschool_configs`.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (UNIQUE) |
| grade_level | TEXT | | NULL | e.g., 'K', '1', '2', ..., '12' |
| standards_framework | TEXT | 'common_core' | NOT NULL | 'common_core', 'state_specific', 'classical', 'custom' |
| standards_state_override | TEXT | | NULL | If different from family state (e.g., family in MO but using AZ standards for ESA) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. Student reads own.

**Indexes:**
- `(family_member_id)` UNIQUE — one config per student

---

### Table: `education_standards`

Imported or LiLa-generated educational standards.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| framework | TEXT | | NOT NULL | 'common_core', 'az_state', 'fl_state', etc. |
| subject | TEXT | | NOT NULL | 'math', 'ela', 'science', 'social_studies', 'art', etc. |
| grade_level | TEXT | | NOT NULL | 'K', '1', '2', ..., '12' |
| standard_code | TEXT | | NOT NULL | e.g., '3.OA.1', 'SC.3.L.14.1' |
| description | TEXT | | NOT NULL | Full standard text |
| parent_standard_id | UUID | | NULL | FK → self. For hierarchical standards (domain → cluster → standard) |
| sort_order | INTEGER | 0 | NOT NULL | Display ordering within subject/grade |
| source | TEXT | 'imported' | NOT NULL | 'imported' (official), 'lila_generated' (gap-fill), 'custom' (mom-created) |
| is_active | BOOLEAN | true | NOT NULL | |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Read-only for all authenticated users. System manages (import scripts and LiLa generation).

**Indexes:**
- `(framework, subject, grade_level, sort_order)` — standard browsing query
- `(framework, grade_level)` — all standards for a grade
- `(standard_code)` — lookup by code
- `(parent_standard_id)` — hierarchical traversal

> **Decision rationale:** Standards are system-level data (not per-family). All families using Common Core Grade 3 Math see the same standards. This avoids duplicating standards data across families. Mom can add custom standards to her family's view, but official standards are shared.

---

### Table: `standard_evidence`

Links between standards and evidence items (portfolio entries, task completions, etc.).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members (the student) |
| standard_id | UUID | | NOT NULL | FK → education_standards |
| evidence_type | TEXT | | NOT NULL | 'portfolio_moment', 'task_completion', 'document_upload', 'manual' |
| evidence_reference_id | UUID | | NOT NULL | FK to source (family_moments.id, task_completion_id, member_documents.id) |
| evidence_description | TEXT | | NULL | Optional description of how this evidence demonstrates the standard |
| linked_by | TEXT | 'manual' | NOT NULL | 'manual' (mom linked), 'auto_task' (task with standard tag), 'auto_lila' (LiLa suggestion accepted) |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped. Mom full CRUD. Student reads own.

**Indexes:**
- `(family_member_id, standard_id)` — evidence for a specific student + standard
- `(family_id, family_member_id)` — all evidence for a student
- `(evidence_type, evidence_reference_id)` — traceability

---

### Table: `report_templates`

Report template definitions. Stores both system templates and future custom templates.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| category | TEXT | | NOT NULL | 'general', 'homeschool', 'disability', 'family', 'financial' |
| template_key | TEXT | | NOT NULL | Unique identifier: 'weekly_activity_log', 'narrative_weekly', 'sds_monthly', etc. |
| display_name | TEXT | | NOT NULL | Human-readable template name |
| description | TEXT | | NOT NULL | What the template produces |
| requires_ai | BOOLEAN | false | NOT NULL | Whether this template needs LiLa for generation |
| tier_required | TEXT | 'essential' | NOT NULL | 'essential', 'enhanced', 'full_magic' |
| data_sources | TEXT[] | '{}' | NOT NULL | Which data the template consumes: 'homeschool_time_logs', 'family_moments', 'shift_sessions', etc. |
| lila_instructions | TEXT | | NULL | System prompt additions for LiLa when generating this template |
| template_structure | JSONB | '{}' | NOT NULL | Structural definition: sections, required fields, formatting rules |
| state_specific | TEXT | | NULL | If this template is state-specific (e.g., 'FL' for Florida SLP) |
| is_system | BOOLEAN | true | NOT NULL | System templates cannot be deleted. Custom templates (future) can be. |
| sort_order | INTEGER | 0 | NOT NULL | Display ordering within category |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** System templates read-only for all. Custom templates (future) are family-scoped.

**Indexes:**
- `(category, sort_order)` — category browsing
- `(template_key)` UNIQUE — lookup by key
- `(state_specific)` — state-filtered templates

> **Decision rationale:** Templates are stored as data, not code. New templates can be added without application deployment — just insert a row with the template structure and LiLa instructions. This supports the "continually create templates" model and the future custom template authoring feature.

---

### Table: `esa_invoices`

Generated ESA invoices with unique numbering.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| student_member_id | UUID | | NOT NULL | FK → family_members |
| invoice_number | TEXT | | NOT NULL | Sequential: 'INV-YYYY-MM-NNN' |
| service_period_start | DATE | | NOT NULL | |
| service_period_end | DATE | | NOT NULL | |
| amount | DECIMAL(10,2) | | NOT NULL | Subscription amount for the period |
| description | TEXT | | NOT NULL | Educational purpose description (editable) |
| pdf_url | TEXT | | NULL | Supabase Storage URL for generated PDF |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped. Mom full CRUD.

**Indexes:**
- `(family_id, created_at DESC)` — invoice history
- `(invoice_number)` UNIQUE — unique invoice numbers

---

### Enum/Type Updates

```sql
-- Update generated_reports.template_type enum (PRD-19)
-- Add: 'weekly_activity_log', 'subject_hours_summary', 'monthly_progress',
--      'attendance_record', 'portfolio_toc', 'expense_log',
--      'narrative_weekly', 'standards_aligned', 'portfolio_summary',
--      'annual_progress', 'evaluator_ready', 'florida_slp',
--      'sds_monthly', 'iep_progress', 'therapy_summary',
--      'family_newsletter', 'esa_invoice'

-- New enums
CREATE TYPE evidence_type AS ENUM ('portfolio_moment', 'task_completion', 'document_upload', 'manual');
CREATE TYPE evidence_link_source AS ENUM ('manual', 'auto_task', 'auto_lila');
CREATE TYPE standards_framework AS ENUM ('common_core', 'state_specific', 'classical', 'custom');
CREATE TYPE report_category AS ENUM ('general', 'homeschool', 'disability', 'family', 'financial');
```

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| PRD-28 (`homeschool_time_logs`) | Core compliance data: subject hours per student per date. Consumed by all homeschool report templates. |
| PRD-37 (`family_moments` — portfolio-tagged) | Portfolio entries with photos, descriptions, subject tags, time. Consumed by portfolio-based report templates and standards evidence. |
| PRD-09A (task completions) | Completed tasks tagged with standards auto-create `standard_evidence` links. Task descriptions appear in activity reports. |
| PRD-02 (`shift_sessions`, caregiver shift logs) | Aide activities during shifts. Consumed by SDS Monthly Summary template. |
| Mom's manual observations | Mom enters observations via family_moments (tagged 'progress') or directly in the reporting flow. Consumed by SDS template. |
| PRD-10 (`widget_data_points`) | Behavioral tracking widget data (toileting, hand washing, etc.). Consumed by disability reporting templates. |
| PRD-36 (timer sessions) | Duration data for timed homeschool activities. Consumed via `homeschool_time_logs`. |
| PRD-19 (`monthly_data_aggregations`) | Pre-aggregated monthly data. Consumed by monthly and annual report templates. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| PRD-13 (Archives) | Generated reports stored in member's Archive folder. PDF and markdown versions. |
| PRD-15 (Notifications) | Reporting schedule reminders delivered as notifications. |
| Supabase Storage | PDF exports stored for download. Invoice PDFs stored for ESA documentation. |
| External (mom shares) | Mom downloads PDFs and shares with evaluators, case managers, state programs. No in-app sharing to external parties at MVP. |

---

## AI Integration

### Report Generation

When an AI-enhanced template is selected, LiLa:
1. **Gathers data:** Queries all relevant data sources for the specified date range and student(s).
2. **Assembles context:** Loads the template's `lila_instructions` and `template_structure`.
3. **Generates content:** Writes the report following the template structure, incorporating data into the narrative.
4. **Presents for review:** Full Human-in-the-Mix — mom sees everything before it's saved.

**System Prompt Notes for LiLa (reports):**
- Write in a warm, professional tone appropriate for educational documentation.
- Never fabricate activities or data. If data is sparse for a period, note it honestly: "This was a lighter week" rather than padding.
- Use the student's name naturally. Reference specific activities by name.
- For standards-aligned reports, explain HOW the activity addresses the standard, not just THAT it does.
- For SDS reports, write in the parent's voice — personal and warm, not clinical. Include specific anecdotes from shift data. Be honest about challenges (mention behaviors matter-of-factly alongside progress). Celebrate small wins. Follow the family's configured program language guidelines (e.g., "enrichment" not "school," "daily living skills" not "tutoring"). Reference specific activities by name. No bullet points — flowing prose. Show mom what was found in the data BEFORE asking follow-up questions.
- Never include financial data (dollar amounts, allowance info) in any report. Budget data in SDS reports is an exception — it's part of the required report format and comes from the SDS-specific budget configuration, not from PRD-28's financial system.

### Standards Activity Suggestions (Full Magic)

When mom taps [💡 LiLa Suggest] on an uncovered standard:
- **Context loaded:** The standard description, the student's age/grade, the family's homeschool subjects, recent activities (to suggest complementary rather than duplicate activities).
- **Output:** 2-3 activity suggestions with: description, estimated time, materials list, which subjects it touches.
- **Action:** Mom can tap to create a task or Sequential Collection item from the suggestion.

### Guided Mode: `homeschool_report_generation`

- **Guided mode name:** `homeschool_report_generation`
- **Context loaded:** Selected template, date range, student, all relevant tracked data for the period.
- **AI behavior:** Generate report content following template structure. Respect data boundaries — use only data that exists, never invent.
- **Human-in-the-Mix:** Full Edit/Approve/Regenerate/Reject on all generated content.

---

## Edge Cases

### No Data for Reporting Period
- If no homeschool data exists for the selected date range, the report generator shows: "No tracked activities found for this period. Try adjusting the date range, or check that learning activities were logged."
- Basic templates show an empty table with the headers intact. AI templates include a brief note from LiLa.

### Partial Data
- If some days have data and others don't, the report includes what's available. AI-enhanced templates note any gaps naturally: "Activities were logged for 3 of 5 weekdays."

### Standards Framework Not Imported
- If mom selects a state whose standards aren't yet imported, the system offers: "Standards for [State] aren't available yet. Would you like LiLa to generate a standards list based on [State]'s educational requirements?" (Full Magic). Or: "You can use Common Core as a starting point and customize."

### ESA Invoice for Multiple Students
- Each invoice is per-student. If mom has multiple students in an ESA program, she generates separate invoices (some ESA programs require per-student documentation). The invoice number sequence is per-family, not per-student.

### SDS Template Without Aide Data
- If no caregiver shift logs exist for the reporting period, the SDS template uses only mom's observations. A note indicates: "No aide shift data available for this period."

### Report Edit After Save
- Saved reports are immutable in `generated_reports`. If mom needs to change something, she regenerates (which creates a new report record). Historical versions are preserved.

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `compliance_basic_reports` | Basic report templates (data formatting only, no AI) | Enhanced |
| `compliance_ai_reports` | AI-enhanced report templates with LiLa narratives | Full Magic |
| `compliance_standards_tracking` | Standards Portfolio living view + evidence linking | Enhanced |
| `compliance_standards_suggestions` | LiLa activity suggestions for uncovered standards | Full Magic |
| `compliance_esa_invoice` | ESA Invoice generation | Essential (all tiers) |
| `compliance_reporting_schedule` | Reporting reminders and schedule configuration | Enhanced |
| `compliance_newsletter` | Family Newsletter report template | Full Magic |
| `compliance_sds_reports` | SDS/Disability report templates | Enhanced (basic) / Full Magic (AI-enhanced) |

> **Tier rationale:** ESA invoices at all tiers (zero cost, enables revenue). Basic compliance tools at Enhanced (the homeschool/disability family tier). AI-powered generation at Full Magic (the intelligence tier). Standards import and tracking at Enhanced (data query only). LiLa suggestions at Full Magic (AI cost). This ensures ESA families who self-select into Full Magic get the full experience, while lower-tier families still get usable compliance output.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| IEP Progress Report template | Template definition + data sources | Future — when designed from user need |
| Therapy Summary template | Template definition + data sources | Future — when designed from user need |
| Custom template authoring (mom creates her own templates) | Template editor UI + custom `report_templates` records | Post-MVP |
| State-specific report templates beyond Florida SLP | Additional state template definitions | Post-MVP — added as state research completes |
| IEP/document understanding and advocacy guided mode | Upload IEP → LiLa explains in plain language → advocacy coaching | Future dedicated PRD |
| ESA vendor application materials (ClassWallet, Odyssey integration) | Vendor-specific documentation and submission flows | Post-launch — when app is functional |
| Scholarship program at cost+10% | Application/review process for subsidized access | Post-launch — needs real usage data for cost basis |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Compliance reporting UI | PRD-28 (Deferred item #3) | Fully resolved. Report generation, standards tracking, invoice generation all designed. |
| State-specific homeschool compliance formatting | PRD-19 | Fully resolved. Template library with state-specific templates. Florida SLP template designed. |
| Custom report templates (mom-authored) | PRD-19 | Stubbed with architecture. `report_templates` table supports custom entries. UI deferred to post-MVP. |
| Homeschool configuration extensions | PRD-28 | Fully resolved. `homeschool_family_config` and `homeschool_student_config` tables add state, grade, standards, evaluator, ESA program, and reporting schedule. |
| `generated_reports` template_type extensions | PRD-19 | Wired. 16+ new template_type values added to the enum. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Report Generation page extended with category dropdown and new template selection
- [ ] 6 basic homeschool templates generating data-formatted reports (no AI)
- [ ] 6 AI-enhanced homeschool templates generating narrative reports with LiLa
- [ ] Human-in-the-Mix review: Edit/Approve/Regenerate/Reject on all generated reports
- [ ] Disclaimer on all generated reports (non-removable)
- [ ] Report export as PDF + Markdown
- [ ] Standards Portfolio living view: browse standards, see evidence, coverage percentage
- [ ] Evidence linking: auto (from tagged tasks) + manual (mom links existing items)
- [ ] LiLa activity suggestions for uncovered standards (Full Magic)
- [ ] ESA Invoice generator: auto-populated fields, per-student, PDF download
- [ ] Homeschool family configuration: state, grade, standards framework, evaluator, ESA program
- [ ] Reporting schedule with reminder notifications
- [ ] Priority standards frameworks imported: Common Core (baseline), AZ, FL, UT
- [ ] Family Newsletter template: LiLa assembles highlights from Family Feed
- [ ] `homeschool_family_config`, `homeschool_student_config`, `education_standards`, `standard_evidence`, `report_templates`, `esa_invoices` tables created with RLS
- [ ] RLS verified: Teens can view own standards portfolio but cannot generate reports
- [ ] RLS verified: Dad can view saved reports only if Archive access is granted
- [ ] Report data gathering pulls from: `homeschool_time_logs`, `family_moments`, task completions, `widget_data_points`, `shift_sessions`

### MVP When Dependency Is Ready
- [ ] SDS Monthly Summary template with configurable ISP goals, support needs categories, program language guidelines, and budget tracking (requires PRD-02 caregiver shift system + PRD-10 behavioral tracking widgets)
- [ ] SDS report data gathering: merge caregiver shift logs + mom observations + widget data + personal goal progress, show mom what was found, ask targeted follow-ups, generate report
- [ ] Timer session data in reports (requires PRD-36)
- [ ] Portfolio photo embedding in reports (requires PRD-37 media system)

### Post-MVP
- [ ] IEP Progress Report template
- [ ] Therapy Summary template
- [ ] Custom template authoring by mom
- [ ] Additional state-specific templates (AR, WV, TX, NH, NC, IA)
- [ ] ClassWallet / Odyssey vendor application preparation
- [ ] Scholarship program implementation
- [ ] IEP/document understanding advocacy guided mode (separate PRD)
- [ ] Automated standards import pipeline (bulk import from official sources)
- [ ] Report sharing: send PDF directly to evaluator's email from within the app

---

## CLAUDE.md Additions from This PRD

- [ ] Report templates are stored as data in `report_templates` table, not as code. New templates can be added without deployment. Each template defines: structure, data sources, LiLa instructions, tier requirement.
- [ ] The `education_standards` table is system-level (not per-family). All families sharing a framework/grade see the same standards. Mom can add custom standards to her family's view via `standard_evidence` with `evidence_type = 'manual'`.
- [ ] ESA invoices use sequential numbering per family: INV-YYYY-MM-NNN. Invoice numbers must be unique.
- [ ] The disclaimer "This report was generated by MyAIM Family..." appears on ALL generated reports. It is NOT removable.
- [ ] Reports are immutable once saved. Edits require regeneration (new record). Historical versions preserved.
- [ ] SDS/disability reports merge data from caregiver shift logs (`shift_sessions`) + mom's observations (`family_moments` tagged 'progress') + behavioral tracking widgets (`widget_data_points`) + personal goals (Guiding Stars, Best Intentions, LifeLantern, victories). ISP goals in the report come from per-member configuration, not hardcoded. Program language guidelines are configurable per family.
- [ ] SDS report generator also exists as a standalone AI Vault tool (free community resource). The in-app version replaces manual CSV upload with automatic data gathering from the tracking system. Both produce the same output format.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `homeschool_family_config`, `homeschool_student_config`, `education_standards`, `standard_evidence`, `report_templates`, `esa_invoices`

Enums created: `evidence_type`, `evidence_link_source`, `standards_framework`, `report_category`

Enums updated: `generated_reports.template_type` — 16+ new values added

Triggers added:
- `updated_at` auto-trigger on `homeschool_family_config`, `homeschool_student_config`
- Reporting reminder cron (Supabase Edge Function): queries `homeschool_family_config` for families where `reporting_reminder_day` = today's day and `reporting_reminder_time` has passed, creates notification records

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **PRD-28B is a universal Compliance & Progress Reporting engine** | Same template-based pattern serves homeschool, disability, family newsletters, and future report types. One engine, multiple template families. |
| 2 | **Two template families fully designed: Homeschool + SDS/Disability** | Homeschool driven by ESA market opportunity. SDS driven by founder's personal need. Others stubbed. |
| 3 | **Templates stored as data, not code** | New templates added by inserting `report_templates` rows. No deployment needed. Supports future custom template authoring. |
| 4 | **ESA invoice at ALL tiers** | Zero AI cost (just template + auto-populated fields). Directly enables ESA revenue. |
| 5 | **Standards Portfolio is a living view (query), not a separate data store** | Near-zero cost at lower tier. Evidence links stored in `standard_evidence`; standards and portfolio entries come from existing tables. |
| 6 | **Priority standards: Common Core + AZ, FL, UT** | Covers biggest ESA states. Common Core covers most states as baseline. |
| 7 | **Reports are immutable once saved** | Edits require regeneration. Historical versions preserved. Compliance audit trail. |
| 8 | **SDS template fully designed from founder's existing skill** | Template matches Acumen DCI portal format. Configurable ISP goals, support needs categories, and program language guidelines per family — not hardcoded to any specific person. Missouri SDS conventions as default phrasing guide. |
| 9 | **IEP/document advocacy deferred to separate future PRD** | Distinct enough from report generation (intake vs. output) to warrant its own design. |
| 10 | **Reporting reminders are notifications, not auto-generation** | Mom triggers generation manually. Reminders open the door; mom walks through when ready. |
| 11 | **Disability reporting data comes from aides (shift logs) + mom (observations), LiLa merges** | Same merge pattern as other report types: gather data from multiple sources, format to template, Human-in-the-Mix review. |
| 12 | **Family Newsletter is a report template consuming Family Feed data** | Simple architecture: LiLa pulls highlights from `family_moments` for a date range, assembles with photos and summaries. Mom reviews and exports as PDF to share with extended family. |
| 13 | **SDS reports pull from BOTH ISP goals (program-required) AND personal goals (MyAIM-tracked)** | ISP goals section stays compliant and program-formatted. "Overall Status" section weaves in personal growth from Guiding Stars, Best Intentions, LifeLantern, victories. Shows a whole person being supported, not just checkboxes. Makes the case for services stronger. |
| 14 | **Hybrid delivery: AI Vault tool (free/standalone) + in-house reporting (premium)** | The SDS report generator exists as a free AI Vault tool for the disability community (pre-launch marketing asset + community gift). Inside MyAIM at Full Magic tier, the same generation is seamlessly integrated with tracked data. Vault tool is the funnel; in-house reporting is the upgrade incentive. "I Go First" philosophy in action. |
| 15 | **SDS Vault tool is a free gift to disability communities** | Not gated behind subscription. Serves as outreach and trust-building. Moms use it standalone, then discover MyAIM handles it automatically. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | IEP Progress Report template | Future — designed from user need |
| 2 | Therapy Summary template | Future — designed from user need |
| 3 | Custom template authoring | Post-MVP. `report_templates` architecture supports it. |
| 4 | State-specific templates beyond FL SLP | Added incrementally as research completes |
| 5 | ClassWallet / Odyssey vendor integration | Post-launch when app is functional |
| 6 | Scholarship program | Post-launch — needs real usage data for cost basis |
| 7 | IEP/document understanding advocacy | Separate future PRD |
| 8 | Automated standards import pipeline | Post-MVP engineering task |
| 9 | SDS report generator as standalone AI Vault tool | Pre-launch content pipeline. Build from existing skill, package as free community resource. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-19 (Family Context) | `generated_reports.template_type` enum extended with 16+ new values. Report Generation page (Screen 5) extended with category dropdown and new templates. | Update enum definition. Note PRD-28B extensions on Screen 5. |
| PRD-22 (Settings) | "Homeschool Configuration" section gains: state, grade level, standards framework, evaluator info, ESA program, reporting schedule. | Add fields to Homeschool Configuration screen. |
| PRD-28 (Tracking) | Deferred item #3 (Compliance reporting UI) fully resolved by PRD-28B. `homeschool_family_config` and `homeschool_student_config` extend the homeschool configuration with compliance-specific fields. | Note deferred item as resolved. Reference PRD-28B for compliance features. |
| PRD-37 (Family Feeds) | Portfolio-tagged `family_moments` consumed as evidence items in standards portfolio and compliance reports. Newsletter template consumes Family Feed data. | Note as consumer of portfolio feed data. |
| PRD-09A (Tasks) | Tasks tagged with `education_standards` auto-create `standard_evidence` links on completion. Sequential Collection completions can auto-generate portfolio moments. | Add standard_tags field or use existing subject_tags with standards mapping. |
| PRD-15 (Notifications) | Reporting schedule reminders registered as a new notification category: 'reporting_reminder'. | Add notification category. |
| PRD-02 (Permissions) | Caregiver shift logs consumed by SDS reporting. No permission changes — caregivers don't see reports, they just generate data. | No action — existing shift logging is sufficient. |
| Build Order Source of Truth v2 | PRD-28B (Compliance & Progress Reporting) and PRD-37 (Family Feeds) added. Build order: PRD-37 first, PRD-28B second. | Update remaining PRDs list and build order. |

---

*End of PRD-28B*
