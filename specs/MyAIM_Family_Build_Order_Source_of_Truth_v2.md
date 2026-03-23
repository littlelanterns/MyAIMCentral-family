# MyAIM Family v2: Build Order & Source of Truth v2
## Authoritative Reference for PRD Numbering, Feature Names, and Conventions

**Created:** March 10, 2026
**Last Updated:** March 16, 2026 — Updated to reflect PRDs completed through PRD-24B, PRD-34 added
**Supersedes:** MyAIM_Family_Build_Order_Source_of_Truth.md (v1)

**Rule:** When this document conflicts with the Planning Decisions doc, the System Overview, the original Feature Inventory, or any other planning document, **this document wins**.

---

## SECTION 1: Rules for PRD Numbering and Labeling

### PRD Numbers

1. **PRD numbers are permanent once a PRD is written.** Never renumber a completed PRD.
2. **Sub-PRDs use letter suffixes:** PRD-09A, PRD-09B, PRD-11B, PRD-12A, PRD-12B, PRD-14B-E, PRD-21A-C, PRD-24A-B.
3. **Future PRD numbers referenced in completed PRDs are LOCKED.** Currently locked: **PRD-27, PRD-28.**
4. **Unwritten PRDs that are NOT yet referenced by number can still shift.** See Section 3.
5. **Addendum files use the parent PRD number.**

### Feature Naming

1. **Database tables:** snake_case. Never changes once created. Never nautical.
2. **Display names:** As decided during the PRD session that defines the feature.
3. **Compound names:** OneWord with internal capitals: LifeLantern, InnerWorkings, GuidingStars, BestIntentions, BookShelf, ThoughtSift.
4. **When a feature is renamed during a PRD session,** all prior documents are noted as needing updates — but the rename is authoritative immediately.

### Required PRD Sections

Every feature PRD MUST include (per PRD Template + PRD-02 conventions):

1. **Overview** — with at least one `> **Mom experience goal:**` tag
2. **User Stories**
3. **Screens** — detailed enough to build from
4. **Visibility & Permissions** — all 5 roles, explicit "Not present" where applicable
5. **Data Schema** — exact tables and columns
6. **Flows** — incoming and outgoing
7. **AI Integration** — if applicable (guided mode registration, context loading)
8. **Tier Gating** — feature keys defined, with `useCanAccess()` wired
9. **Stubs** — created and wired, even if "none"
10. **What "Done" Looks Like** — tiered checklist (MVP, When Dependency Ready, Post-MVP)
11. **CLAUDE.md Additions** — conventions for build consistency
12. **DATABASE_SCHEMA.md Additions** — tables, enums, triggers
13. **Decisions Made This Session** — Decided, Deferred, Cross-PRD Impact tables

### Required Conventions from PRD-02 (Apply to ALL Feature PRDs)

1. **Feature Key Registration:** Every PRD that introduces member-scoped features must register its feature keys in the Tier Gating section, compatible with PRD-02's Feature Key Registry format.
2. **PermissionGate:** Every member-scoped UI must be wrapped in `PermissionGate` component.
3. **useCanAccess():** Every feature page/tool must have `useCanAccess('feature_key')` wired from day one. During beta, all return true.
4. **Audit readiness tags:** Use `> **Decision rationale:**`, `> **Deferred:**`, `> **Depends on:**`, `> **Mom experience goal:**`, `> **Tier rationale:**`, `> **Forward note:**` throughout.

---

## SECTION 2: Completed PRDs (37 PRDs + Addenda)

### Foundation PRDs

| PRD # | Feature Name | Key DB Tables |
|-------|-------------|--------------|
| **PRD-01** | Auth & Family Setup | `families`, `family_members`, `special_adult_assignments`, `subscription_tiers`, `family_subscriptions`, `feature_access` |
| **PRD-02** | Permissions & Access Control | `member_permissions`, `view_as_sessions`, `teen_privacy_overrides`, `special_adult_feature_access` |
| **PRD-03** | Design System & Themes | *(CSS variables, theme config)* |
| **PRD-04** | Shell Routing & Layouts | *(routing config, layout zones)* |

### AI System PRDs

| PRD # | Feature Name | Key DB Tables |
|-------|-------------|--------------|
| **PRD-05** | LiLa Core AI System | `lila_conversations`, `lila_messages`, `lila_guided_modes`, `lila_tool_permissions` |
| **PRD-05C** | LiLa Optimizer | *(same tables, prompt mode)* |

### Personal Growth PRDs

| PRD # | Feature Name | Key DB Tables |
|-------|-------------|--------------|
| **PRD-06** | Guiding Stars & Best Intentions | `guiding_stars`, `best_intentions`, `intention_iterations` |
| **PRD-07** | InnerWorkings | `self_knowledge` |
| **PRD-08** | Journal + Smart Notepad | `journal_entries` |
| **PRD-09A** | Tasks, Routines & Opportunities | `tasks`, `task_assignments`, `task_completions`, `task_rewards`, `routine_step_completions`, `sequential_collections`, `task_claims`, `task_queue`, `activity_log_entries` |
| **PRD-09B** | Lists, Studio & Templates | `lists`, `list_items`, `list_shares`, `list_templates` |
| **PRD-10** | Widgets, Trackers & Dashboard Layout | `widgets`, `widget_templates`, `dashboard_configs` |
| **PRD-11** | Victory Recorder + Daily Celebration | `victories` |
| **PRD-11B** | Family Celebration | `family_victory_celebrations` |

### Vision & Context PRDs

| PRD # | Feature Name | Key DB Tables |
|-------|-------------|--------------|
| **PRD-12A** | Personal LifeLantern | `life_lantern_assessments`, `life_lantern_areas` |
| **PRD-12B** | Family Vision Quest | `family_vision_quests`, `vision_sections`, `vision_section_history`, `vision_section_responses`, `vision_section_discussions`, `family_vision_statements` |
| **PRD-13** | Archives & Context | `archive_folders`, `archive_context_items`, `archive_member_settings`, `faith_preferences`, `context_learning_dismissals` |

### Dashboard PRDs

| PRD # | Feature Name | Key DB Tables |
|-------|-------------|--------------|
| **PRD-14** | Personal Dashboard | *(extends `dashboard_configs`)* |
| **PRD-14B** | Calendar | `calendar_events`, `event_attendees`, `event_categories`, `calendar_settings` |
| **PRD-14C** | Family Overview | `family_overview_configs` |
| **PRD-14D** | Family Hub | `family_hub_configs`, `family_best_intentions`, `family_intention_iterations`, `countdowns`, `slideshow_slides` |
| **PRD-14E** | Family Hub TV Mode | *(extends `family_hub_configs` with `tv_config` JSONB)* |

### Communication & Daily Life PRDs

| PRD # | Feature Name | Key DB Tables |
|-------|-------------|--------------|
| **PRD-15** | Messages, Requests & Notifications | `conversation_spaces`, `conversation_space_members`, `conversation_threads`, `messages`, `message_read_status`, `messaging_settings`, `member_messaging_permissions`, `message_coaching_settings`, `family_requests`, `notifications`, `notification_preferences`, `out_of_nest_members` |
| **PRD-16** | Meetings | `meetings`, `meeting_participants`, `meeting_schedules`, `meeting_templates`, `meeting_template_sections`, `meeting_agenda_items` |
| **PRD-17** | Universal Queue & Routing System | `studio_queue` (authoritative) |
| **PRD-18** | Rhythms & Reflections | `rhythm_configs`, `rhythm_completions`, `reflection_prompts`, `reflection_responses` |
| **PRD-19** | Family Context & Relationships | `member_documents`, `private_notes`, `relationship_notes`, `guided_interview_progress`, `monthly_data_aggregations`, `generated_reports` |
| **PRD-20** | Safe Harbor | `safe_harbor_orientation_completions`, `safe_harbor_literacy_completions`, `safe_harbor_consent_records` |

### AI Vault & Tools PRDs

| PRD # | Feature Name | Key DB Tables |
|-------|-------------|--------------|
| **PRD-21** | Communication & Relationship Tools | *(8 guided tools — uses LiLa guided mode tables)* |
| **PRD-21A** | AI Vault: Browse & Content Delivery | *(vault browse, content cards, progress tracking)* |
| **PRD-21B** | AI Vault: Admin Content Management | *(admin upload, publish, category management)* |
| **PRD-21C** | AI Vault: Engagement & Community | *(likes, favorites, discussions, moderation — VC system)* |
| **PRD-22** | Settings | *(config panels, family management, privacy, account)* |
| **PRD-23** | BookShelf | *(RAG document library, family content distribution)* |

### Gamification PRDs

| PRD # | Feature Name | Key DB Tables |
|-------|-------------|--------------|
| **PRD-24** | Gamification Overview & Foundation | *(reward system, points, core infrastructure)* |
| **PRD-24A** | Overlay Engine / Gamification Visuals | *(visual overlay system + Game Modes Addendum)* |
| **PRD-24B** | Gamification Visuals & Interactions | *(visual interactions, animations, engagement)* |

### Addenda

| Document | Parent PRD |
|----------|-----------|
| PRD-05 Planning Decisions Addendum | PRD-05 |
| PRD-07 Session Addendum | PRD-07 |
| PRD-08 Cross-PRD Impact Addendum | PRD-08 |
| PRD-14 Cross-PRD Impact Addendum | PRD-14 |
| PRD-14B Cross-PRD Impact Addendum | PRD-14B |
| PRD-14D Cross-PRD Impact Addendum | PRD-14D |
| PRD-15 Cross-PRD Impact Addendum | PRD-15 |
| PRD-16 Cross-PRD Impact Addendum | PRD-16 |
| PRD-18 Cross-PRD Impact Addendum | PRD-18 |
| PRD-19 Cross-PRD Impact Addendum | PRD-19 |
| PRD-20 Cross-PRD Impact Addendum | PRD-20 |
| PRD-21 Cross-PRD Impact Addendum | PRD-21 |
| PRD-21A Cross-PRD Impact Addendum | PRD-21A |
| PRD-21B Cross-PRD Impact Addendum | PRD-21B |
| PRD-21C Cross-PRD Impact Addendum | PRD-21C |
| PRD-22 Cross-PRD Impact Addendum | PRD-22 |
| PRD-23 Cross-PRD Impact Addendum | PRD-23 |
| PRD-24 Cross-PRD Impact Addendum | PRD-24 |
| PRD-24A Cross-PRD Impact Addendum | PRD-24A |
| PRD-24A Game Modes Addendum | PRD-24A |
| PRD-24B Cross-PRD Impact Addendum | PRD-24B |
| PRD Audit Readiness Addendum | All |
| PRD Template & Audit Updates | Template |
| Backburner Feature Addendum | Multiple |

---

## SECTION 3: Remaining PRDs — Ordered by Priority

### Remaining Wave 2

| Order | PRD # | Feature | Notes |
|-------|-------|---------|-------|
| 1 | **PRD-25** | **Guided Dashboard** | Simplified dashboard for Guided shell. May be lean — gamification PRDs cover most of the hard parts. |
| 2 | **PRD-26** | **Play Dashboard** | Visual task surface for Play shell. May be lean — same reason. |

### Wave 3: "Platform Complete"

| Order | PRD # | Feature | Notes |
|-------|-------|---------|-------|
| 3 | **PRD-27** | **Caregiver Tools** | NUMBER LOCKED. Mainly permission-based views — limited view for caregivers to let kids mark their own charts, caregiver notes, record of what was done. |
| 4 | **PRD-28** | **Tracking, Allowance & Financial** | NUMBER LOCKED. Allowance, payments, homeschool tracking. |
| 5 | **PRD-29** | **Project Planner** | Long-term goal management. StewardShip Rigging reference. |
| 6 | **PRD-30** | **Safety Monitoring** | Invisible to monitored members. |
| 7 | **PRD-34** | **ThoughtSift — Decision & Thinking Tools** | Board of Directors (persona panel + shared persona library with 3-tier caching), Perspective Shifter (archetypal lenses + family-context hypotheticals using real InnerWorkings data), Decision Guide (SODAS, pros/cons, coin flip insight, weighted matrix), Mediator (expands PRD-19's `relationship_mediation` beyond family), Translator (fun rewrite: formal, pirate, gen z, boomer, medieval, etc.). Infrastructure for persona library already designed in Platform Intelligence Pipeline v2 (Channel D). |

### Wave 4: "Scale & Monetize"

| Order | PRD # | Feature | Notes |
|-------|-------|---------|-------|
| 8 | **PRD-31** | **Subscription Tier System** | Stripe, tier gating config, Founding Member program. |
| 9 | **PRD-32** | **Admin Console (System/Platform)** | User/family management, analytics. **Also includes Feedback & Bug Reporting System:** (1) User-facing: "Request a Feature" button, "Report a Glitch" button with screenshot capture and auto-collected diagnostic info, "Tell Us Something Nice" option. (2) Admin-facing: aggregated dashboard, auto-triage, Claude Code diagnostic pipeline for bugs. (3) Solution routing: fixes feed back into LiLa Help knowledge. (4) Sentiment filter: abusive submissions auto-filtered. |
| 10 | **PRD-33** | **Offline / PWA** | IndexedDB + sync, service worker. |

### Side Quests (attach as sub-PRDs when needed)

| Feature | Attaches To | Notes |
|---------|------------|-------|
| Cyrano Me v2 (expanded teaching framework) | PRD-21 | If lean version isn't enough |
| AI Vault: Interactive Tools | PRD-21A | Artifacts, GPTs, Gems embedded |
| AI Vault: Prompt Packs | PRD-21A | Downloadable prompt collections |
| Homeschool compliance reporting | PRD-28 | ESA/voucher automated reporting |
| Multi-AI Panel | PRD-05 | Shelved, low priority |
| Teen Lite Optimizer | PRD-05C | Post-MVP |
| Family Mission Statement | PRD-12B | Distinct from Vision |
| My Circle (non-family contacts) | PRD-13 or PRD-19 | Archive folder cards |
| SMS/email capture channels | PRD-15 | External message ingestion |
| External calendar sync | PRD-14B | Google Calendar, Apple Calendar |
| Push notifications | PRD-15 | Post-MVP engineering sprint |

---

## SECTION 4: Locked Future PRD Numbers

| PRD # | Referenced By |
|-------|--------------|
| **PRD-27** (Caregiver Tools) | PRD-01 |
| **PRD-28** (Tracking, Allowance & Financial) | PRD-09A, PRD-09B, PRD-10 |

---

## SECTION 5: Features Removed from Active Build

| Feature | Reason |
|---------|--------|
| The Wheel (Growth Cycle) | Therapist's IP. LifeLantern absorbs the spirit. |
| Spheres of Influence | Same IP concerns. |
| MindSweep (standalone) | Folded into Review & Route (PRD-08). |
| Family Management Page (standalone) | Lives in Settings + Archives. Removed March 13, 2026. |
| Hub lock mode | Deferred indefinitely. Removed March 13, 2026. |
| Video calling | No user story needs it. Removed March 13, 2026. |
| Marriage Toolbox (as a name) | Tools individually named, not spouse-locked. Retired March 13, 2026; tools in PRD-21. |

---

## SECTION 6: Feature Name Changes Log

| Original Name | Current Name | Changed When |
|---------------|-------------|-------------|
| My Foundation | **InnerWorkings** | PRD-07 session |
| Knowledge Base / RAG / Personal Library / Manifest | **BookShelf** | PRD-23 session |
| Library Vault | **AI Vault** | PRD-12A session |
| Progress & Goals / Charts | **Widgets** | Planning sessions |
| Life Inventory / Life Check-in | **LifeLantern** | Planning sessions |
| MindSweep (standalone) | Folded into **Review & Route** (PRD-08) | Planning sessions |
| Marriage Toolbox | **Communication & Relationship Tools** (8 individual tools) | March 13, 2026 |

---

## SECTION 7: StewardShip → MyAIM v2 Name Map

| StewardShip | MyAIM v2 | PRD |
|------------|---------|-----|
| The Helm | LiLa (4 versions) | PRD-05 |
| *(none)* | LiLa Optimizer | PRD-05C |
| The Mast | Guiding Stars | PRD-06 |
| *(MyAIM v1 only)* | Best Intentions | PRD-06 |
| The Keel | InnerWorkings | PRD-07 |
| The Log | Journal + Smart Notepad | PRD-08 |
| Unload the Hold | *(folded into PRD-08)* | — |
| The Compass | Tasks, Routines & Opportunities | PRD-09A |
| Lists | Lists Studio & Templates | PRD-09B |
| Charts + Goals | Widgets, Trackers & Dashboard | PRD-10 |
| Victory Recorder | Victory Recorder | PRD-11 |
| Life Inventory | LifeLantern (Personal) | PRD-12A |
| The Wheel | *(removed)* | — |
| Sphere of Influence | *(removed)* | — |
| First Mate + Crew tools | Communication & Relationship Tools | PRD-21 |
| Crew | Family Context & Relationships | PRD-19 |
| Rigging | Project Planner | PRD-29 |
| The Manifest | BookShelf | PRD-23 |
| *(MyAIM v1: Library Vault)* | AI Vault | PRD-21A/B/C |
| Crow's Nest | Personal Dashboard | PRD-14 |
| Reveille + Reckoning | Rhythms & Reflections | PRD-18 |
| Safe Harbor | Safe Harbor | PRD-20 |
| Meeting Frameworks | Meetings | PRD-16 |
| *(none)* | ThoughtSift | PRD-34 |

---

## SECTION 8: Guided Modes Registered in LiLa

| Mode Key | Display Name | Registered By |
|----------|-------------|---------------|
| `help` | LiLa Help | PRD-05 |
| `assist` | LiLa Assist | PRD-05 |
| `optimizer` | LiLa Optimizer | PRD-05 |
| `general` | General Chat | PRD-05 |
| `quality_time` | Quality Time | PRD-05 |
| `gifts` | Gifts | PRD-05 |
| `observe_serve` | Observe & Serve | PRD-05 |
| `words_affirmation` | Words of Affirmation | PRD-05 |
| `gratitude` | Gratitude | PRD-05 |
| `cyrano` | Cyrano Me | PRD-05 |
| `higgins_say` | Help Me Say Something | PRD-05 |
| `higgins_navigate` | Help Me Navigate | PRD-05 |
| `task_breaker` | Break It Down | PRD-05 |
| `task_breaker_image` | Break It Down (Image) | PRD-05 |
| `self_discovery` | Discover Your InnerWorkings | PRD-07 |
| `family_vision_quest` | Family Vision Quest | PRD-12B |
| `life_lantern` | Personal LifeLantern | PRD-12A |
| `calendar_event_create` | Calendar Event Create | PRD-14B |
| `meeting` | Meeting Facilitation | PRD-16 |
| `family_context_interview` | Family Context Interview | PRD-19 |
| `relationship_mediation` | Full Picture Mediation | PRD-19 |
| `safe_harbor` | Safe Harbor | PRD-20 |
| `safe_harbor_guided` | Safe Harbor (Guided Child) | PRD-20 |
| `safe_harbor_orientation` | Safe Harbor Orientation | PRD-20 |
| `safe_harbor_literacy` | Safe Harbor Literacy | PRD-20 |
| *(future)* | Board of Directors | PRD-34 |
| *(future)* | Perspective Shifter | PRD-34 |
| *(future)* | Decision Guide | PRD-34 |
| *(future)* | Mediator | PRD-34 |
| *(future)* | Translator | PRD-34 |

---

## SECTION 9: Known Inconsistencies (For Pre-Build Audit)

### Numbering Inconsistencies

| Location | Issue | Correct Value |
|----------|-------|---------------|
| PRD-02 (2 locations) | References "PRD-30 (Rewards)" | **PRD-24** |

### Convention Compliance Gaps

| Issue | Affected PRDs |
|-------|--------------|
| No explicit PermissionGate reference | PRD-06, PRD-09B, PRD-10, PRD-11, PRD-11B, PRD-12B |
| No explicit Feature Key Registry registration note | PRD-06, PRD-09B, PRD-10, PRD-11, PRD-11B, PRD-12B |
| Missing formal "## Stubs" section | PRD-09B |
| Missing formal "## Decisions Made This Session" section | PRD-10 |

### Reference Updates Needed

| Reference | Update |
|-----------|--------|
| Semantic Context Infrastructure Addendum | "Knowledge Base / Manifest (Future PRD)" → "BookShelf (PRD-23)" |
| Platform Intelligence Pipeline v2 | "ThoughtSift PRD" content policy reference → verify it landed in a written PRD |

### Resolved Architectural Questions

| Question | Resolution | Date |
|----------|-----------|------|
| AI Vault PRD splitting | 3 sub-PRDs: 21A, 21B, 21C | March 13, 2026 |
| Admin console architecture | AI Vault admin = PRD-21B. System admin = PRD-32. | March 13, 2026 |
| AI Vault vs Personal Library boundary | Separate. Vault = curated content. BookShelf = user's documents (PRD-23). | March 13, 2026 |
| Cyrano Me v2 PRD home | Lean version in PRD-21. Expanded as side quest if needed. | March 13, 2026 |
| ThoughtSift scope | Suite of decision/thinking tools in PRD-34. Not standalone processing modes. | March 16, 2026 |

---

## SECTION 10: Strategic Context

### Business Model
The AI Vault is the **front door and revenue engine**. Tutorial content is what pulls subscribers in. The MyAIM family management system is what makes the platform sticky. Content follows a natural learning ladder: Fun & Creative (the hook) → Practical & Problem-Solving (the value) → Creator (the graduation).

### Key Decisions
- No tier mapping during build — everything unlocked, gate later based on real data
- "Marriage Toolbox" name retired — tools individually named, most usable with any family member
- AI Vault tools (like BookShelf) each get their own PRDs as they grow in complexity
- Caregiver Tools (PRD-27) is mainly permission-based views, not heavy new architecture
- Guided/Play dashboards (PRD-25/26) may be lean since gamification PRDs cover most complexity
- The 45-Day Launch Plan defines the launch timeline and phasing

---

## SUMMARY

| Category | Count |
|----------|-------|
| **PRDs Written** | 37 |
| **Addenda** | 24 |
| **Remaining PRDs** | 10 (PRD-25, 26, 27, 28, 29, 30, 31, 32, 33, 34) |
| **Side Quests** | ~11 |
| **Locked Future Numbers** | 2 (PRD-27, PRD-28) |

---

*Last updated: March 16, 2026*
