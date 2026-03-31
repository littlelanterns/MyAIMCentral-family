# Stub Registry — MyAIM Central v2

Every stub across all PRDs with created-by PRD, wired-by PRD (or "Unwired"), and build phase assignment.

## Status Legend
- ✅ **Wired** — Stub fully implemented by a later PRD
- 🔗 **Partially Wired** — Some aspects implemented, some remain
- ⏳ **Unwired (MVP)** — Not yet wired, expected during MVP build
- 📌 **Unwired (Post-MVP)** — Intentionally deferred to post-MVP
- ❌ **Superseded** — Replaced by a different approach

---

## Foundation Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| PIN verification (FamilyLogin) | PRD-01 (Phase 01) | Remediation | ✅ Wired | Remediation |
| Accept-invite flow (/auth/accept-invite) | PRD-01 | PRD-01 | ✅ Wired | Remediation |
| Session duration per role | PRD-01 | PRD-01 | ✅ Wired | Remediation |
| Inactivity warning banner | PRD-01 | PRD-01 | ✅ Wired | Remediation |
| Family device hub widgets | PRD-01 | PRD-14D | ✅ Wired | Phase 15 |
| Tablet hub timeout config | PRD-01 | PRD-22 | ✅ Wired | Phase 27 |
| Permission hub UI | PRD-02 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
| Transparency panel (mom side) | PRD-02 | PRD-02 | ✅ Wired | Phase 02 |
| Teen transparency panel (teen side) | PRD-02 | PRD-02 | ✅ Wired | Remediation |
| View As sessions | PRD-02 | PRD-02 | ✅ Wired | Phase 02 |
| View As full-shell mode + banner | PRD-02 | PRD-02 | ✅ Wired | Remediation |
| View As feature exclusions | PRD-02 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
| Special Adult Shift View | PRD-02 | PRD-02 | ✅ Wired | Remediation |
| Shift schedule config | PRD-02 | PRD-35 (access_schedules) | ✅ Wired | Phase 05 |
| PIN lockout (server-side) | PRD-01 | PRD-02 | ✅ Wired | Remediation |
| Default permission auto-creation | PRD-02 | PRD-02 | ✅ Wired | Remediation |
| Emergency lockout toggle | PRD-02 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
| Permission profiles → Layer 3 | PRD-02/PRD-31 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
| Post-shift LiLa summary compilation | PRD-02 | — | ⏳ Unwired (MVP) | Phase 06+ (LiLa) |
| Recalculate tier blocks Edge Function | PRD-02/PRD-31 | — | ⏳ Unwired (MVP) | Phase 38 (Stripe) |
| SA Log Activity form during shifts | PRD-02 | PRD-27 | ⏳ Unwired (MVP) | Phase 31 |
| Admin user management | PRD-02 | PRD-32 | ✅ Wired | Phase 39 |

## LiLa AI Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| LiLa Optimizer mode | PRD-05 | PRD-05C | ✅ Wired | Phase 23 |
| HumanInTheMix Regenerate/Reject | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Help/Assist pattern matching (13 FAQs) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Opening messages (core + task_breaker) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Context assembly stubs (7 sources) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Permission + privacy filtering | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Voice input (Whisper) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Page context passing | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Person-level context toggles (UI) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Conversation history date filter | PRD-05 | PRD-05 | ✅ Wired | Remediation |
| Context sources (GuidingStars, etc.) | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
| Review & Route pipeline | PRD-05 | PRD-08 | ✅ Wired | Phase 09 |
| Long conversation summarization | PRD-05 | — | 📌 Post-MVP | — |
| Mode auto-routing mid-conversation | PRD-05 | — | ⏳ Unwired (MVP) | Phase 07+ |
| Archive context loading | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
| BookShelf RAG context | PRD-05 | PRD-23 | ⏳ Unwired (MVP) | Phase 28 |
| Tool permission management UI | PRD-05 | PRD-22 | ⏳ Unwired (MVP) | Phase 27 |
| Victory detection/recording | PRD-05 | PRD-11 (AIR) | ✅ Wired | Phase 12 |
| Context Learning write-back | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
| Mediator/Peacemaker mode | PRD-05 | PRD-34 (mediator) | ✅ Wired | Phase 35 |
| Decision Guide mode | PRD-05 | PRD-34 (decision_guide) | ✅ Wired | Phase 35 |
| Fun Translator mode | PRD-05 | PRD-34 (translator) | ✅ Wired | Phase 35 |
| Teen Lite Optimizer | PRD-05C | — | 📌 Post-MVP | — |
| Homework Checker | PRD-05 | — | 📌 Post-MVP | — |
| Privacy Filtered category | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
| Library Vault tutorial links | PRD-05 | PRD-21A | ✅ Wired | Phase 25 |
| Relationship tools person-context | PRD-05 | PRD-21 | ✅ Wired | Phase 24 |
| Edit in Notepad action chip | PRD-05 (Phase 06) | PRD-08 (Phase 09) | ✅ Wired | Phase 09 |
| Review & Route action chip | PRD-05 (Phase 06) | PRD-08 (Phase 09) | ✅ Wired | Phase 09 |
| Create Task action chip | PRD-05 (Phase 06) | PRD-09A | ✅ Wired | Phase 10 |
| Record Victory action chip | PRD-05 (Phase 06) | PRD-11 | ⏳ Unwired (MVP) | Phase 12 |
| Voice input (Whisper) | PRD-05 (Phase 06) | PRD-08 (Phase 09) | ✅ Wired | Phase 09 |
| LiLa conversation summary (long convos) | PRD-05 (Phase 06) | — | 📌 Post-MVP | — |

## Personal Growth Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Family-level GuidingStars | PRD-06 | PRD-12B | ✅ Wired | Phase 22 |
| Dashboard widget containers | PRD-06 | PRD-10 | ✅ Wired | Phase 11 |
| Morning/Evening rhythm integration | PRD-06 | PRD-18 | ✅ Wired | Phase 19 |
| Victory Recorder logging from intentions | PRD-06 | PRD-11 (AIR) | ✅ Wired | Phase 12 |
| InnerWorkings context in LiLa | PRD-07 | PRD-13 | ✅ Wired | Phase 13 |
| LiLa self-discovery guided mode | PRD-07 | PRD-07 | ✅ Wired | Phase 08 |
| "Craft with LiLa" — pre-primed conversation for GS crafting (button exists, shows stub alert) | PRD-06 | PRD-05 (LiLa integration) | ⏳ Unwired (MVP) | Phase 06 |
| "Extract from Content" — upload content, extract GS entries | PRD-06 | Knowledge Base PRD | ⏳ Unwired (MVP) | TBD |
| Family-level Guiding Stars creation — owner_type='family' column exists, creation flow deferred | PRD-06 | PRD-12 (LifeLantern) | ⏳ Unwired (MVP) | Phase 22 |
| Dashboard widget for GS rotation — widget config defined | PRD-06 | PRD-10 (Widgets) | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Morning/Evening Review GS integration — data contracts defined | PRD-06 | PRD-18 (Rhythms) | ⏳ Unwired (MVP) | Phase 19 |
| Victory Recorder GS thread detection — celebration checks GS for connections | PRD-06 | PRD-11 (Victory Recorder) | ⏳ Unwired (MVP) | Phase 12 |
| Declaration language coaching — LiLa guides toward honest commitment language | PRD-06 | PRD-05 (LiLa crafting flow) | ⏳ Unwired (MVP) | Phase 06 |
| Victory Recorder daily intention summary — intention_iterations consumed by Victory Recorder | PRD-06 | PRD-11 (Victory Recorder) | ⏳ Unwired (MVP) | Phase 12 |
| Dashboard widget for BI celebration — widget config defined | PRD-06 | PRD-10 (Widgets) | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Bar graph tracker visualization — tracker_style column exists, UI shows "Enhanced" badge | PRD-06 | best_intentions_tracker_views feature key | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Streak tracker visualization — tracker_style column exists, UI shows "Enhanced" badge | PRD-06 | best_intentions_tracker_views feature key | ⏳ Unwired (MVP) | PRD-10 Phase B |
| "Discover with LiLa" (self_discovery guided mode) — button exists, stub behavior | PRD-07 | PRD-05 (lila_guided_modes seed + system prompt) | ⏳ Unwired (MVP) | Phase 06 |
| Teen privacy indicator — UI badge showing visibility status | PRD-07 | PRD-02 (teen visibility setting) | ⏳ Unwired (MVP) | Phase 02+ |
| Archives "checked somewhere, checked everywhere" — sharing state single-source-of-truth | PRD-07 | PRD-13 (Archives) | ✅ Wired | Phase 13 |
| Content extraction from Knowledge Base — upload to KB, extract IW entries | PRD-07 | Knowledge Base PRD | ⏳ Unwired (MVP) | TBD |
| Messaging notifications | PRD-08 | PRD-15 | ✅ Wired | Phase 16 |
| Review & Route routing UI | PRD-08 | PRD-08 | ✅ Wired | Phase 09 |
| Send to Person (messaging) | PRD-08 | PRD-15 | ✅ Wired | Phase 16 |
| Send to Calendar | PRD-08 | PRD-14B | ✅ Wired | Phase 14 |
| Send to Agenda | PRD-08 | PRD-16 | ✅ Wired | Phase 17 |
| Reward system integration | PRD-09A | PRD-24 | ✅ Wired | Phase 29 |
| Allowance pool calculation | PRD-09A | PRD-28 | ✅ Wired | Phase 32 |
| Widget milestone → victory | PRD-10 | PRD-11 (AIR) | ✅ Wired | Phase 12 |
| Auto-victory from task completions | PRD-11 | PRD-11 (AIR) | ✅ Wired | Phase 12 |
| Family Celebration mode | PRD-11 | PRD-11B | ✅ Wired | Phase 12 |
| Complex goal → Project Planner | PRD-12A | PRD-29 | ✅ Wired | Phase 33 |
| Family Vision Quest discussions | PRD-12B | PRD-12B | 🔗 Partial (audio stub) | Phase 22 |
| Context export for external AI | PRD-13 | PRD-13 | ✅ Wired | Phase 13 |

## Archives & Context Stubs (PRD-13)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| LifeLantern aggregation in Archives | PRD-13 | PRD-12A | ⏳ Unwired (MVP) | Phase 22 (PRD-12A) |
| Family Vision Statement in Family Overview | PRD-13 | PRD-12B | ⏳ Unwired (MVP) | Phase 22 (PRD-12B) |
| Family Meeting Notes structured routing | PRD-13 | PRD-16 | ⏳ Unwired (MVP) | Phase 17 (Meetings) |
| Partner Profile aggregation in Archives | PRD-13 | PRD-19 | ⏳ Unwired (MVP) | Phase 20 (PRD-19) |
| Shared Lists aggregation in Archives | PRD-13 | — | ⏳ Unwired (MVP) | Share with Archive UI |
| Journal entries aggregation in Archives | PRD-13 | PRD-08 | ⏳ Unwired (MVP) | Verify PRD-08 tables, wire display |
| My Circle folder type — non-family contacts | PRD-13 | — | 📌 Post-MVP | People & Relationships PRD |
| Monthly victory auto-archive | PRD-13 | PRD-11 | 📌 Post-MVP | PRD-11 enhancement |
| Seasonal Family Overview prompts | PRD-13 | PRD-18 | 📌 Post-MVP | Rhythm PRD |
| Archive full-text search | PRD-13 | — | 📌 Post-MVP | — |
| Dad edit access in Archives | PRD-13 | — | 📌 Post-MVP | Read-only at MVP |
| Context staleness indicators | PRD-13 | — | 📌 Post-MVP | — |
| Haiku overview card generation (AI call) | PRD-13 | — | 📌 Post-MVP | Card renders, generation call is stub |
| Context presets / smart modes | PRD-13 | PRD-05C | 📌 Post-MVP | PRD-05C enhancement |
| "Open in Notepad" from Context Export | PRD-13 | PRD-08 | 📌 Post-MVP | Notepad bridge not wired |
| Usage count display in Archives UI | PRD-13 | — | 📌 Post-MVP | DB columns wired, no analytics surface |

---

## Communication Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Push notification delivery | PRD-15 | — | 📌 Post-MVP | — |
| Content Corner link preview | PRD-15 | — | 📌 Post-MVP | — |
| Out of Nest SMS notifications | PRD-15 | — | 📌 Post-MVP | — |
| Morning digest/Daily Briefing | PRD-15 | — | 📌 Post-MVP | — |
| Meeting gamification connection | PRD-16 | PRD-24 | ✅ Wired | Phase 29 |
| Queue Modal future tabs | PRD-14B | PRD-15 (Requests), PRD-17 (Sort) | ✅ Wired | Phase 18 |
| MindSweep email forwarding | PRD-08 | PRD-17B | ✅ Wired | Phase 18 |
| MindSweep approval learning | PRD-17B | PRD-17B | ✅ Wired | Phase 18 |
| Weekly MindSweep intelligence report | PRD-17B | — | 📌 Post-MVP | — |

## Daily Life Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Studio rhythm template library | PRD-18 | — | 📌 Post-MVP | — |
| Reflection export as document | PRD-18 | — | 📌 Post-MVP | — |
| Custom report templates (mom-authored) | PRD-19 | PRD-28B | ✅ Wired | Phase 32 |
| State-specific compliance formatting | PRD-19 | PRD-28B | ✅ Wired | Phase 32 |
| My Circle (non-family contacts) | PRD-19 | — | 📌 Post-MVP | — |
| Teen "Tell LiLa About Yourself" | PRD-19 | — | 📌 Post-MVP | — |
| Safe Harbor → Library RAG | PRD-20 | — | 📌 Post-MVP | — |
| Safe Harbor offline support | PRD-20 | PRD-33 | ⏳ Unwired (MVP) | Phase 40 |
| ThoughtSift name → External Tool Suite | PRD-20 | PRD-34 | ✅ Wired | Phase 35 |

## AI Vault Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| AI Vault sidebar navigation | PRD-04 | PRD-21A | ✅ Wired | Phase 25 (2026-03-25) |
| AI Toolbox browsing/assignment | PRD-19 | PRD-21A | ✅ Wired | Phase 25 (2026-03-25) |
| Library Vault tutorial links from LiLa Assist | PRD-05 | PRD-21A | ✅ Wired | Phase 25 (2026-03-25) |
| Optimize with LiLa (full flow) | PRD-21A | PRD-05C | ⏳ Unwired (MVP) | Phase 23 |
| Deploy with LiLa (skill deployment) | PRD-21A | — | 📌 Post-MVP | — |
| Embedded tool iframe delivery | PRD-21A | — | 📌 Post-MVP | — |
| Native AI tool LiLa modal launch | PRD-21A | PRD-05 | ⏳ Unwired (MVP) | Phase 24 |
| Vault recommended dashboard widget | PRD-21A | PRD-10 | ⏳ Unwired (MVP) | PRD-10 Phase B |
| LiLa proactive Vault suggestions | PRD-21A | — | 📌 Post-MVP | — |
| Seasonal tag auto-surfacing (date logic) | PRD-21A | — | ⏳ Unwired (MVP) | Phase 25 enhancement |
| Section C: Recommended for You | PRD-21A | — | ⏳ Unwired (MVP) | Phase 25 enhancement |
| Session report re-import via Review & Route | PRD-21A | PRD-08 + PRD-28 | ⏳ Unwired (MVP) | Phase 32 |
| PRD-21B Admin content management UI | PRD-21A | PRD-21B | ⏳ Unwired (MVP) | Phase 25B |
| PRD-21C Engagement (hearts, comments, discussions) | PRD-21A | PRD-21C | ⏳ Unwired (MVP) | Phase 26 |
| Learning paths (multi-item sequences) | PRD-21A | — | 📌 Post-MVP | — |
| Creator economy / user-submitted tools | PRD-21A | — | 📌 Post-MVP (Phase 4) | — |
| UpgradeModal (tier gating prompt) | PRD-21A | — | ❌ Deleted during /simplify — rebuild when tier gating activates post-beta | /simplify Phase 1 |
| Content versioning | PRD-21B | — | 📌 Post-MVP | — |
| Scheduled publishing | PRD-21B | — | 📌 Post-MVP | — |
| Collaborative filtering recommendations | PRD-21C | — | 📌 Post-MVP | — |
| Semantic/vector search for Vault | PRD-21C | — | 📌 Post-MVP | — |
| Out of Nest → sibling messaging | PRD-22 | — | 📌 Post-MVP | — |
| Book social sharing | PRD-23 | — | 📌 Post-MVP | — |

## Gamification Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Family Challenges (PRD-24C) | PRD-24A | — | 📌 Post-MVP | — |
| Boss Quests game mode | PRD-24A | — | 📌 Post-MVP | — |
| Bingo Cards game mode | PRD-24A | — | 📌 Post-MVP | — |
| Evolution Creatures game mode | PRD-24A | — | 📌 Post-MVP | — |
| Passport Books game mode | PRD-24A | — | 📌 Post-MVP | — |

## Platform Complete Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Caregiver push notifications | PRD-27 | — | 📌 Post-MVP | — |
| Homeschool budget/cost tracking | PRD-28 | — | 📌 Post-MVP | — |
| Advanced financial reports | PRD-28 | — | 📌 Post-MVP | — |
| IEP Progress Report template | PRD-28B | — | 📌 Post-MVP | — |
| Therapy Summary template | PRD-28B | — | 📌 Post-MVP | — |
| IEP/document understanding | PRD-28B | — | 📌 Post-MVP | — |
| ESA vendor integration | PRD-28B | — | 📌 Post-MVP | — |
| System design trial expiration UI | PRD-29 | — | 📌 Post-MVP | — |
| Safety journal/message scanning | PRD-30 | — | 📌 Post-MVP | — |
| Community persona moderation queue | PRD-34 | PRD-32 | ✅ Wired | Phase 39 |
| Community lens moderation queue | PRD-34 | PRD-32 | ✅ Wired | Phase 39 |
| Board session export | PRD-34 | — | 📌 Post-MVP | — |
| Translator language support | PRD-34 | — | 📌 Post-MVP | — |
| Standards linkage on portfolio | PRD-37 | PRD-28B | ✅ Wired | Phase 32 |
| Portfolio export | PRD-37 | PRD-28B | ✅ Wired | Phase 32 |
| Family Newsletter report template | PRD-37 | PRD-28B | ✅ Wired | Phase 32 |
| Image auto-tagging | PRD-37 | — | 📌 Post-MVP | — |

## Scale & Monetize Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Blog comment threading | PRD-38 | — | 📌 Post-MVP | — |
| Blog search | PRD-38 | — | 📌 Post-MVP | — |
| Blog RSS feed | PRD-38 | — | 📌 Post-MVP | — |
| Blog email newsletter | PRD-38 | — | 📌 Post-MVP | — |
| Pinterest auto-pin | PRD-38 | — | 📌 Post-MVP | — |
| Per-family AI cost drill-down | PRD-32 | — | 📌 Post-MVP | — |
| Admin activity log | PRD-32 | — | 📌 Post-MVP | — |
| External calendar sync | PRD-14B | — | 📌 Post-MVP | — |
| Google Calendar integration | PRD-14B | — | 📌 Post-MVP | — |

## Infrastructure Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Universal Scheduler UI component | PRD-35 | PRD-35 | ✅ Wired | Phase 05 |
| Completion-dependent scheduling | PRD-35 | PRD-35 | ✅ Wired | Phase 05 |
| Custody patterns | PRD-35 | PRD-27 | ✅ Wired | Phase 31 |
| Family holiday calendar auto-exclusion | PRD-35 | — | 📌 Post-MVP | — |
| ICS export from RRULE strings | PRD-35 | — | 📌 Post-MVP | — |
| LiLa schedule extraction cards | PRD-35 | PRD-08 | ⏳ Unwired (MVP) | Phase 09 |
| LiLa conversational schedule builder | PRD-35 | PRD-05 | ⏳ Unwired (MVP) | Phase 06 |
| Universal Timer UI (all 4 modes) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| Floating timer bubble (all 5 shells) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| 5 visual timer styles (SVG/CSS) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| Timer session history + editing | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| Play mode age gate + visual timer | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| Timer config panel (per-member) | PRD-36 | PRD-36 | ✅ Wired | Phase 05 |
| All 38 color themes | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| Theme-adaptive Tooltip | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| 11 shared components (Button, Card, etc.) | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| SparkleOverlay (Play victories) | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| Shell token overrides (touch/font/spacing) | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| Theme persistence to Supabase | PRD-03 | PRD-03 | ✅ Wired | Remediation |
| Shell-aware BottomNav | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| QuickTasks strip | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| PerspectiveSwitcher (dashboard) | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| Play shell Celebrate button | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| Guided shell personalized header | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| Notepad in Adult/Independent shells | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| Settings removed from Sidebar | PRD-04 | PRD-04 | ✅ Wired | Remediation |
| Guided lightweight notepad | PRD-04 | PRD-04 Repair | ✅ Wired | PRD-04 Repair 2026-03-25 |
| Settings overlay (full UI) | PRD-04 Repair | PRD-22 | ⏳ Unwired (MVP) | Phase 27 |
| Hub widget content (real widgets) | PRD-04 Repair | PRD-10/PRD-14D | ⏳ Unwired (MVP) | Phase 11/15 |
| PWA entry points | PRD-04 | PRD-33 | 📌 Post-MVP | — |
| Timer idle reminders | PRD-36 | PRD-15 | ⏳ Unwired (MVP) | Phase 16 |
| Timer → homeschool time logs | PRD-36 | PRD-28 | ⏳ Unwired (MVP) | Phase 32 |
| Timer → task completion threshold | PRD-36 | PRD-09A | ✅ Wired | Phase 10 |
| Timer → widget data points | PRD-36 | PRD-10 | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Visual World themed timer animations | PRD-36 | PRD-24A | 📌 Post-MVP | — |

## Studio & Lists Stubs (Phase 10 — PRD-09B)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Studio Browse tab (template cards) | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio My Customized tab | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio [Customize] → Task types | PRD-09B | PRD-09A | ✅ Wired | Phase 10 |
| Studio [Customize] → List types | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio [Customize] → Guided Forms | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio [Customize] → Trackers/Widgets | PRD-09B | PRD-10 | ✅ Wired | PRD-10 Phase A |
| Studio seed templates (15 in DB) | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Lists full CRUD (9 types) | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Lists Randomizer draw view | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Lists promote-to-task | PRD-09B | PRD-09A | ✅ Wired | Phase 10 |
| Guided Form assign modal | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Guided Form child fill view | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Guided Form mom review view | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Guided Form LiLa help button | PRD-09B | PRD-05 | ⏳ Unwired (MVP) | Phase 06 |
| System list auto-provision (Backburner, Ideas) | PRD-09B | — | ⏳ Unwired (MVP) | Phase 10+ |
| ListPicker overlay (Notepad → Lists) | PRD-09B | — | ⏳ Unwired (MVP) | Phase 10+ |
| List drag-to-rearrange (@dnd-kit) | PRD-09B | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Save list as template to Studio | PRD-09B | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| List item promotion badge | PRD-09B | Phase 10 Repair | ✅ Wired | Phase 10 Repair |

## Widget & Tracker Stubs (PRD-10 Phase A)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Dashboard grid + 6 tracker types | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
| Widget Picker modal | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
| Widget Configuration modal | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
| Widget Detail View modal | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
| Widget folders (create/view) | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
| Widget starter configs (10 seeds) | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
| Phase B tracker types (11 remaining) | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Multiplayer layer | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Track This flow (Screen 5) | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase B |
| Color-reveal tracker + image library | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase C |
| Gameboard tracker | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase C |
| Linked pair deployment | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase C |
| Special Adult child-widget view | PRD-10 | — | 📌 Post-MVP | — |
| Decorative layer (Cozy Journal) | PRD-10 | — | 📌 Post-MVP | — |
| Widget milestone → Victory Record | PRD-10 | PRD-11 | ⏳ Unwired (MVP) | PRD-11 |
| Widget → Gamification progress | PRD-10 | PRD-24 | ⏳ Unwired (MVP) | PRD-24 |
| Allowance Calculator → payment | PRD-10 | PRD-28 | ⏳ Unwired (MVP) | PRD-28 |

## Tasks Repair Stubs (Phase 10 Repair — PRD-09A, PRD-17)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Task creation modal redesign (compact 2-col) | Phase 10 Repair | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| View sync logic (computeViewSync) | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Task view drag-to-reorder (@dnd-kit) | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Sequential reuse/redeploy flow | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Routine step progress indicator | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Approval-required parent UI | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Completion photo evidence | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Unmark cascade behavior | PRD-09A | Phase 10 Repair | 🔗 Partially Wired | Phase 10 Repair |
| Batch Process All progress bar | PRD-17 | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Role-scoped queue visibility | PRD-17 | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Breathing glow vs badge toggle | PRD-17 | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| HScrollArrows on ViewCarousel | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| Emoji removed from task views | Phase 10 Repair | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| External attribution removed | Phase 10 Repair | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
| AI Auto-Sort for views | PRD-09A | — | ⏳ Unwired (MVP) | Needs ai-parse Edge Function |
| Special Adult shift-scoped task access | PRD-09A | — | ⏳ Unwired (MVP) | Needs access_schedules wiring |
| Notification auto-dismiss on queue processing | PRD-17 | — | ⏳ Unwired (MVP) | Needs notification system |
| Gamification reward/streak reversal on unmark | PRD-09A/PRD-24 | — | ⏳ Unwired (MVP) | Needs PRD-24 |

## ThoughtSift Stubs (PRD-34)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| ThoughtSift guided modes (5) | PRD-05 | PRD-34 | ✅ Wired | Phase 35 (34A) |
| `relationship_mediation` guided mode | PRD-19 | PRD-34 (mediator) | ✅ Wired | Phase 35 (34B) |
| Board of Directors persona library | Platform Intelligence Channel D | PRD-34 | ✅ Wired | Phase 35 (34A) |
| Community persona moderation queue | PRD-34 | PRD-32 | ⏳ Unwired (MVP) | Phase 39 (Admin Console) |
| Community lens moderation queue | PRD-34 | PRD-32 | ⏳ Unwired (MVP) | Phase 39 (Admin Console) |
| Full persona library browse page (categories/filtering) | PRD-34 | — | 📌 Post-MVP | — |
| LiLa proactive ThoughtSift tool suggestion | PRD-34 | — | 📌 Post-MVP | — |
| Board session export | PRD-34 | — | 📌 Post-MVP | — |
| Translator non-English language support | PRD-34 | — | 📌 Post-MVP | — |
| Custom lens creation UI (describe → LiLa caches) | PRD-34 | — | 📌 Post-MVP | — |
| Custom lens sharing to community library | PRD-34 | — | 📌 Post-MVP | — |
| Decision Guide: user-created custom frameworks | PRD-34 | — | 📌 Post-MVP | — |
| Guided-shell simplified ThoughtSift versions | PRD-34 | — | 📌 Post-MVP | — |
| BookShelf enrichment for BoD personas | PRD-34 | PRD-23 | ⏳ Unwired (MVP) | Phase 28 (BookShelf) |
| Route to BigPlans action chip (Decision Guide + BoD) | PRD-34 | PRD-29 | ⏳ Unwired (MVP) | Phase 33 (BigPlans) |
| `is_available_for_mediation` per-note toggle | PRD-34 (Mediator) | PRD-19 | ⏳ Unwired (MVP) | Phase 20 (Family Context) |
| Send via Message action chip (Mediator) | PRD-34 | PRD-15 | ⏳ Unwired (MVP) | Phase 16 (Messages) |
| @Name addressing UI parsing in BoD | PRD-34 | — | 📌 Post-MVP | — |
| Suggested for This Situation in persona selector | PRD-34 | — | 📌 Post-MVP | — |
| Long-press persona preview card | PRD-34 | — | 📌 Post-MVP | — |
| LiLa follow-up question after custom persona creation ("direct or warm?") | PRD-34 | — | 📌 Post-MVP | Enhancement to custom persona flow — description field covers this for now |
| Recently Used section in persona selector | PRD-34 | — | 📌 Post-MVP | — |
| Full PRD-30 Layer 2 Haiku safety classification for ThoughtSift | PRD-34 | PRD-30 | ⏳ Unwired (MVP) | Phase 34 (Safety Monitoring) |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Wired | ~70 |
| 🔗 Partially Wired | ~3 |
| ⏳ Unwired (MVP) | ~27 |
| 📌 Post-MVP | ~67 |
| ❌ Superseded | ~3 |
| **Total** | ~170 |
