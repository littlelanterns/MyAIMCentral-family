# MyAIM Family v2: Planning Decisions & Updates
## Authoritative Reference for All Decisions Made During Planning

**Created:** February 27, 2026
**Sessions:** 2 planning sessions (kickoff + detailed planning)
**Status:** Phase 2 (PRD Writing) — No PRDs written yet, all pre-PRD decisions captured here
**Supersedes:** MyAIM_Family_Execution_Plan.md (outdated), portions of System Overview PRD v1, portions of Architecture Plan

---

## How to Use This Document

This document captures decisions made AFTER the original project knowledge files were written. Where this document conflicts with the System Overview PRD v1, the Architecture Plan, or the Complete Reference, **this document is authoritative**. Those older docs remain valuable for context and detail but their PRD order, permission model, and feature list are outdated.

---

## Process & Workflow

### Development Process (Proven in StewardShip)

We follow the exact process that built StewardShip successfully:

1. **Phase 1: System Architecture** — ✅ Complete (System Overview PRD, Architecture Plan, Faith & Ethics, Brand Identity all exist)
2. **Phase 2: Detailed PRD Writing** — 🔄 Current phase. Write ALL PRDs before any code.
3. **Phase 3: Audit & Dev Environment Setup** — After all PRDs: consistency audit, create repo, create Supabase project, scaffold
4. **Phase 4A-4D: Build Cycles** (repeating) — Plan prompt → Build in Claude Code → Test & Fix → Update Docs
5. **Phase 5+: Scope expansion, hardening, deployment** — as needed

**Key principle:** ALL PRDs are written and audited BEFORE creating the repo, Supabase project, or writing any code. No early scaffolding.

### Tool Usage
- **Opus 4.6 (claude.ai, this project):** Architecture, PRD writing, planning, build prompt drafting, debugging cross-feature issues
- **Sonnet 4.6 standard context (Claude Code in VS Code):** Code execution, file creation, migrations, testing. Use standard context (not 1M) to avoid extra billing.
- **Build prompts:** Follow the Build_Prompt_Template.md structure (10-section template proven across 12+ StewardShip phases)

### Auto-Update Convention (for CLAUDE.md)
After every git push, Claude Code updates:
- `BUILD_STATUS.md` — mark completed phase, timestamp
- `CLAUDE.md` — append new conventions to Conventions Appendix
- `docs/STUB_REGISTRY.md` — mark wired stubs, note new stubs created

### Additional Dev Artifacts
- `BUILD_STATUS.md` — tracks what's been built and when
- `STUB_REGISTRY.md` — tracks every stub, what it wires to, when it gets connected
- `DATABASE_SCHEMA.md` — auto-generated from migration files where possible
- Schema doc generation script — reads `supabase/migrations/*.sql` and outputs formatted schema doc
- RLS sanity-check test script — verifiable per-role data access tests run in Claude Code

---

## Family Member Roles (5 Types)

### 1. Mom / Primary Parent
- Sees everything across ALL family members by default
- Controls permissions for ALL other family members (dad, teens, kids, special adults)
- Full access to every feature
- Manages all accounts, PINs, passwords
- Can view/reset any family member's PIN from Family Settings
- "View As" mode to see any member's experience from her own account
- Can opt to INCREASE a teen's privacy on specific features (but default is mom sees all)

### 2. Dad / Additional Adult (Spouse)
- Has own personal feature set (whatever mom has enabled)
- Can adjust his OWN privacy settings for features he has access to
- Cannot change permissions for other family members
- Access to kids' content is controlled by mom at a granular level (per feature, per child)

### 3. Special Adults (Grandparent, Babysitter, Caregiver, Helper)
- NO personal features — no journal, no goals, no LiLa, nothing of their own
- Permission-based access only for assigned kids (mom assigns which kids)
- **Can see for assigned members:**
  - Task lists (daily routine, scheduled tasks)
  - Opportunities / Options / Extra Credit lists
  - Trackable events (custom categories mom creates — toileting, hand washing, ISP goals, etc.)
  - Relevant notes/instructions mom has attached
- **Can do:**
  - Mark tasks as complete
  - Mark trackable events with checkmark + optional note per occurrence
  - View and mark opportunity/job lists as complete
  - Add shift notes (free text observations)
  - "Compile Shift Summary" → AI compiles everything logged during their shift into a readable report
  - Copy/paste/edit the compiled summary on their own device
- **Cannot:** Access personal features, see other family members, change settings, see other caregivers' shifts (unless mom enables)
- **Shift concept:** Login = "on shift." Everything timestamped and grouped by shift. Mom sees shift history.
- **Full caregiver tools at launch** — this is not deferred

### 4. Independent Mode (Teens 13+)
- Own full feature set, mom sees all by default
- Can see ALL privacy settings in their settings (full transparency)
- Cannot give themselves MORE privacy than mom has set
- CAN give themselves more sharing (make something visible to family/dad that was previously mom-only)
- "Send to private" option → content goes to flagged private area, mom gets notification something went private, doesn't see content unless safety flags trigger
- Mom can granularly configure which features are fully private for the teen (opt-in, not default)

### 5. Guided (8-12ish) / Play (3-7ish) Mode
- Mom sees everything, period
- No privacy controls for child
- Mom controls whether dad can see their content
- Mode assigned by mom based on child's readiness, NOT age. No age labels in UI.

---

## Permission Model

### Core Principle
Mom sees all by default. This is NOT a surveillance tool — it's a platform for involved, intentional parents. Privacy is available but transparent.

### Visibility Options per Data Item
- `mom_only` — default for most personal content, only primary parent sees it
- `both_parents` — both parents see it (mom grants dad access)
- `family` — everyone in the family can see it
- `private_flagged` — teen's private area, mom gets notification but not content (unless safety flag)

### RLS Policy Architecture
The old three-tier model (`private` / `family` / `parents_only`) is replaced by a more granular system:
- Primary parent has implicit read access to ALL member-scoped data (no visibility toggle needed)
- Additional adult (dad) access is controlled via a permissions table (mom sets per feature, per child)
- Special adults access is controlled via an assignment table (mom assigns kids + feature types)
- Teen "send to private" creates a flagged record that suppresses content from mom's view but sends a notification

This will be fully specified in PRD-02 (Permissions & Visibility).

---

## Tablet / Family Device

### Default Hub View (no one logged in)
The family device shows a shared family hub when no specific member is authenticated:
- Family Calendar widget
- Shared Goals / Chart widgets
- Dinner Menu widget
- Family Reminders
- "Coming Soon" — exciting upcoming events
- All widgets optional, mom configures which appear

### Member Access from Hub
- Button/icon/dropdown for each family member
- Tap your name → authenticate → goes to your personal experience
- Authentication options (mom configures per member):
  - PIN (default: child's birthday mm/dd until changed)
  - Visual password (tap images in order)
  - None (for young kids, if mom chooses)
  - Full login (for adults)
- Mom can see all PINs/passwords in Family Settings
- Mom can reset any PIN herself or request new one via email

---

## PRD Writing Order (Locked In)

| # | PRD | Key Notes |
|---|---|---|
| 1 | Auth & Family Setup | Family structure, 5 member roles, login flows, PIN, member management, Special Adult invites, tablet hub framework |
| 2 | Permissions & Visibility | Mom-sees-all, granular per-parent access, teen transparency, Special Adult scoping, View As, RLS templates |
| 3 | Design System & Themes | CSS variables, shared components, theme library, vibes system, gradient toggle |
| 4 | Shell Routing & Navigation | Mom/Adult/Independent/Guided/Play shells, layout zones, drawers, responsive behavior |
| 5 | LiLa Core + Help + Assist | Chat infrastructure/engine, drawer + full page, context assembly, edge function, guided mode framework, support & guide personalities |
| 5C | LiLa Optimizer | Prompt optimization, context assembly from Archives, platform formatting, context learning |
| 6 | Guiding Stars & Best Intentions | Values/principles/declarations + intentional action commitments (GROUPED — philosophical siblings) |
| 7 | Self-Knowledge (My Foundation) | Personality data, 3 input paths, user-nameable |
| 8 | Journal + Smart Notepad | Capture → route system, tabs, voice, Review & Route (MindSweep folded in), full-page mode, OCR future |
| 9 | Tasks + Lists | All task views, Task Breaker, lists, recurring, family assignment, approval workflows (GROUPED) |
| 10 | Widgets | Widget templates, custom trackers/charts/goals, auto-sort by usage frequency, system widgets, dashboard widget hub |
| 11 | Victory Recorder | CRUD, AI celebrations, sharing |
| 12 | LifeLantern | Personal life assessment + vision casting + goal generation + Family Vision (mom-initiated) |
| 13 | Archives & Context | Folders, checkbox context, auto-overview cards, LiLa context integration, per-member Archive folders, Out of Nest member cards |
| 14 | Personal Dashboard | Per-member personal growth space. Mom's can also view/mark-complete for any family member. |
| 15 | Family Dashboard | Shared family coordination — family tasks, shared calendar, family Best Intentions, shared goals |
| 16 | Mom's Overview | All-seeing progress command post — aggregated progress from ALL family members at a glance |
| 17 | Family Management Page | View/edit family members, launch person-context tools (Higgins, Cyrano, etc.), Out of Nest management |
| 18 | People & Relationships | People profiles, categorized notes, non-family contacts (My Circle TBD) |
| 19 | Partner Profile | Connected spouse account, mutual visibility, LiLa context sharing (opt-in TBD during PRD) |
| 20 | Morning/Evening Rhythms | Daily check-in cards |
| 21 | Meetings | Couple, Parent-Child Mentor, Family Meeting frameworks |
| 22 | Safe Harbor | Stress relief, guided support, crisis resources |
| 23 | Library Vault + Admin | Netflix browsing, tool embedding, admin console, progress tracking |
| 24 | Rewards & Gamification | Points, stars, themes, streaks, family gamification |
| 25 | Play Mode Dashboard | Visual tasks, sticker rewards, celebrations |
| 26 | Guided Mode Dashboard | Simplified UI, prompted interactions |
| 27 | Caregiver Tools | Special Adult shift management, trackable events, ISP goal tracking, AI shift compilation |
| 28 | Tracking, Allowance & Financial | Payment owed/earned, allowance pools ($1/yr of age, % completion = % earned, bonus), homeschool, multi-dimensional task tracking |
| 29 | Settings | All config panels, family management, privacy controls |
| 30+ | Calendar, Knowledge Base/RAG, Project Planner, Safety Monitoring, Subscription Tiers, Offline/PWA | Later PRDs |

---

## Features Removed from Active Build

| Feature | Reason | Extensibility |
|---|---|---|
| The Wheel (Growth Cycle) | Therapist's IP, haven't asked permission for public use | Architecture extensible — `features/inner-oracle/wheel/` can be added later via new PRD + migration |
| Spheres of Influence | Same reason as Wheel | Same extensibility pattern |
| MindSweep (standalone) | Folded into Smart Notepad's Review & Route pipeline | The notepad + Review & Route IS the MindSweep experience. Can add branded quick-launch button. |
| Progress & Goals (standalone name) | Renamed to **Widgets** — broader scope | Widget template library, custom trackers/charts/goals, assign to dashboards, auto-sort by usage. |

---

## Family Management & People Architecture

### Two Separate Surfaces
1. **Family Management page** — management and tools. View/edit family members, launch tools (Higgins, Cyrano, etc.) with a person selected. When using a tool, click relevant people to load their context.
2. **Archives** — context and notes. Each family member has an Archive folder for their context data, notes, and information.

### Family Member Types in Archives
- **In-home family members** — Mom, Dad/spouse, teens, guided kids, play kids. Each has an Archive folder AND a dashboard.
- **Out of Nest family members** — Adult children, grandparents elsewhere, etc. Have Archive folder cards but NO dashboard. (Check v1's family creation logic in GitHub repo for how this works.)
- **Non-family people** — Eventually available at highest tier. "Additional People" folder in Archives for friends, mentors, therapist, teachers, etc. Notes and context about them.

### Tools with Person Context
When launching tools like Higgins (communication coaching) or Cyrano (compliments), the user clicks which people are relevant to the situation. Those people's Archive context loads automatically into the tool's AI context.

### Separate PRDs Confirmed
- **People & Relationships** — stays as its own PRD. People profiles, categorized notes, non-family contacts.
- **Partner Profile** — stays as its own PRD. Connected spouse account, mutual visibility. Open question for PRD writing: should LiLa have access to spouse's self-knowledge (with opt-in) when helping with relationship topics?

### My Circle (Non-Family Contacts)
Decision deferred to PRD writing. May live in Archives as folder cards OR as part of People & Relationships PRD.

---

## Dashboard Architecture (Four Distinct Views)

| View | Who Sees It | Purpose |
|---|---|---|
| **Command Center** | Mom (navigation hub) | Cards linking to all features. Mom's landing page / home screen. |
| **Personal Dashboard** | Every member gets one | Personal growth space. Mom's personal dashboard also lets her view/mark-complete anything for any family member. |
| **Family Dashboard** | Mom, adults, members with access | Shared family coordination — family tasks, shared calendar, family Best Intentions, shared goals. |
| **Mom's Overview** | Mom only | All-seeing progress command post — aggregated progress from ALL family members in one at-a-glance view. See it all at once. |

**Key distinctions:**
- Command Center = navigation/launching pad
- Personal Dashboard = MY stuff (each member has one)
- Family Dashboard = OUR stuff (shared family data)
- Mom's Overview = EVERYONE's stuff (mom's command post seeing all progress)

---

## Widgets (formerly Progress & Goals / Charts)

### Renamed and Expanded
"Charts" / "Progress & Goals" is now **Widgets**. This is a widget/tracker/tool library (distinct from Library Vault which is AI tutorials and tools).

### How It Works
- Users browse **widget templates** to create their own tracker/chart/tool instances
- Created widgets live in the Widgets library
- Users **assign widgets to their Personal Dashboard** (or mom assigns to Family Dashboard, guided/play modes, caregivers)
- Widgets that are frequently interacted with **auto-sort to the top** (most-used first)
- System widgets and custom widgets live in the same space

### Who Can Do What
- **Mom:** Create widgets, assign to ANY member's dashboard (her own, spouse, teens, family, guided, play, caregiver views), view all results
- **Dad/Spouse:** Has mom-assigned widgets + can create or add additional ones for themselves. Mom can view their results.
- **Teens (Independent):** Has mom-assigned widgets + can create or add additional ones for themselves. Mom can view results.
- **Guided/Play:** Mom assigns widgets to their dashboard view. Cannot add their own.
- **Caregivers:** Mom assigns widgets and associated tracking, caregiver logs data, mom views results

### Widget Data Flow
All widget tracking data flows up to Mom's Overview — she can see progress from everyone in one place.

---

## Tracking, Allowance & Financial (PRD-25)

This is its own PRD covering all tracking and financial management for the family.

### Payment Tracking
When a kid completes an Opportunity with a monetary reward, the system auto-calculates what mom owes them. Mom can see running totals per child.

### Allowance Pool
- Per-kid weekly allowance amount, typically $1 per year of age (mom configurable)
- Mom assigns tasks/activities to each kid's allowance pool — these are expected tasks, not individually paid
- End of week: percentage of pool tasks completed = percentage of allowance earned
- Above a configurable threshold (e.g., 90%) = bonus amount
- Separate from individually-paid Opportunities

### Homeschool Multi-Tracking
- Same task can count for multiple tracking purposes (subject hours, completion percentage, skill progress)
- Per-family subject configuration
- Time logging per activity
- Double-dipping rules (can one activity count for two subjects?)
- Report generation (weekly, monthly, by subject)

### Multi-Dimensional Task Tracking
One task can simultaneously be:
- A chore (counts in allowance pool)
- A learning activity (logs homeschool hours)
- An opportunity (earns individual payment)
- A trackable event (logs occurrence for ISP/behavioral tracking)

This is the most complex tracking PRD and will make managing 9 kids dramatically easier.

---

## Tier Gating Approach

### Build Everything Unlocked
During beta and initial building, ALL features are fully unlocked for everyone. No tier gating is enforced during development.

### Infrastructure Built From Day One
- `subscription_tiers` table with tier definitions
- `feature_access` table mapping tier + feature_key = enabled/disabled
- `useCanAccess('feature_key')` hook on every feature (returns true for now)
- This means adding tier-gating later is a configuration change, not a refactor

### Founding Family Program
- Founding families get a special lifetime rates plan
- Special rates persist as long as they stay active
- Can move between tiers and keep their special pricing
- If they cancel, they lose founding status and return to normal pricing on re-subscribe
- `is_founding_family` flag on families table
- `founding_family_rates` JSONB with per-tier special pricing
- Founding Family badge/distinction in UI

---

## Feature Naming

| Feature | Name | Notes |
|---|---|---|
| Life assessment + vision + goals | **LifeLantern** | One word, capital L capital L. Personal + Family versions. No ™ in code/docs. |
| AI assistant system | **LiLa** (Little Lady) | Four versions: Help ("Happy to Help"), Assist ("Your Guide"), Optimizer ("Smart AI"), API ("The Engine") |
| Values/principles | **Guiding Stars** | Grouped with Best Intentions in one PRD |
| Personality/self-knowledge | **My Foundation** | User-nameable |
| Custom trackers/charts/goals | **Widgets** | Formerly "Progress & Goals" / "Charts". Widget template library, assign to dashboards, auto-sort by usage. |
| People profiles/relationships | **People & Relationships** | Separate PRD. Non-family contacts, categorized notes. |
| Spouse/partner context | **Partner Profile** | Separate PRD. Connected account, mutual visibility. |
| Family member management | **Family Management** | NEW page. View/edit members, launch person-context tools, Out of Nest management. |
| Database table names | **snake_case** | Never nautical, never changes |
| UI feature names | **User-configurable** where noted | Otherwise consistent across shells |

---

## LiLa System (Four Versions)

| Version | Subtitle | Role | User-Facing? |
|---|---|---|---|
| LiLa Help | Happy to Help | Customer support, troubleshooting | Yes |
| LiLa Assist | Your Guide | Feature guidance, onboarding, tool recommendations | Yes |
| LiLa Optimizer | Smart AI | Prompt optimization with family context | Yes |
| LiLa API | The Engine | Backend AI processing, shared infrastructure | No |

All three user-facing versions accessible via LiLa Panel in the global header. All route through LiLa API for AI processing. See LiLa_Versions_Guide.docx for full details.

PRD-05 covers Core + Help + Assist (shared infrastructure). PRD-05C covers Optimizer separately (it's complex enough for its own PRD).

---

## LifeLantern Feature Design

### Personal LifeLantern
Three interconnected components:
1. **Life Assessment** — "Where I was / where I am / where I'm going" across life areas (Spiritual, Marriage, Family, Physical Health, Emotional Health, Social, Career, Financial, Personal Development, Service + custom). Conversational, no scales.
2. **Vision Casting** — Forward-looking exercise articulating what the user WANTS life to look like. Cohesive picture, not just per-area goals. Becomes core LiLa context.
3. **Goal Generation from Vision** — LiLa analyzes gap between assessment and vision, suggests concrete goals, breaks into steps, can create charts/tasks/trackers from them.

### Family LifeLantern
- Mom-initiated — either as solo planning ("what do I want for my family") or collaborative family activity
- Family members can contribute
- Output becomes shared family context for LiLa across all members
- User has additional thoughts on family vision setup to share (pending discussion)

### Availability
- Mom at launch, expandable to teens and dad at Full Magic tier
- Main build order (PRD-12) — important for LiLa context, not deferrable

---

## Tech Stack (Confirmed)

- **Frontend:** Vite + React 19 + TypeScript
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage, Edge Functions, pgvector)
- **Hosting:** Vercel (new project, fresh deployment)
- **AI:** Claude Sonnet via OpenRouter (initial); BYOK support planned
- **Transcription:** OpenAI Whisper API (optional)
- **Embeddings:** Supabase pgvector (for Knowledge Base RAG)
- **New repo, new Supabase project, clean unified schema**

---

## Project Knowledge Status

### Files to Add to Project Knowledge
1. ✅ Build_Prompt_Template.md — build prompt structure (created this session)
2. ☐ LiLa_Versions_Guide.docx — LiLa personality/role definitions
3. ☐ This document (MyAIM_Family_Planning_Decisions.md)
4. ☐ MyAIM_Family_Execution_Plan_v2.md (updated execution plan)
5. ☐ Next_Session_Prompt.md
6. ☐ At least one StewardShip build prompt (Phase 7 recommended) as pattern reference

### Files That Can Eventually Be Removed
Once enough clarity exists in PRDs and planning docs, the StewardShip and MyAIM repos can be removed from project knowledge to free capacity. The repos remain the most accurate reference for existing code patterns but aren't needed once PRDs are self-sufficient.

### Outdated Files (Do Not Upload)
- MyAIM_Family_Execution_Plan.md (v1, from kickoff session) — superseded by v2

---

## Open Items for Next Session

1. ☐ User wants to share Family Vision thoughts before starting PRD-01
2. ☐ Decide during PRD writing: My Circle (non-family contacts) — live in Archives as folder cards OR separate lightweight feature?
3. ☐ Write PRD-01: Auth & Family Setup
4. ☐ Continue writing PRDs in order

---

*Last updated: February 27, 2026 — End of Session 3*
*Session 3 additions: Charts→Widgets rename, 4 dashboard views (Command Center/Personal/Family/Mom's Overview), Crew/FirstMate→Archives person cards, Tracking & Allowance PRD-25, tier gating approach (build unlocked, infrastructure from day one), Founding Family program details, People & Partner Profile folded into Archives*
