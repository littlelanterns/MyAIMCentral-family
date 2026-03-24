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
| Permission hub UI | PRD-02 | PRD-22 | ✅ Wired | Phase 27 |
| Transparency panel (mom side) | PRD-02 | PRD-02 | ✅ Wired | Phase 02 |
| Teen transparency panel (teen side) | PRD-02 | PRD-02 | ✅ Wired | Remediation |
| View As sessions | PRD-02 | PRD-02 | ✅ Wired | Phase 02 |
| View As full-shell mode + banner | PRD-02 | PRD-02 | ✅ Wired | Remediation |
| Special Adult Shift View | PRD-02 | PRD-02 | ✅ Wired | Remediation |
| Shift schedule config | PRD-02 | PRD-35 (access_schedules) | ✅ Wired | Phase 05 |
| PIN lockout (server-side) | PRD-01 | PRD-02 | ✅ Wired | Remediation |
| Default permission auto-creation | PRD-02 | PRD-02 | ✅ Wired | Remediation |
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
| Archive context loading | PRD-05 | PRD-13 | ⏳ Unwired (MVP) | Phase 13 |
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
| AI Toolbox browsing/assignment | PRD-19 | PRD-21A | ✅ Wired | Phase 25 |
| Vault recommended dashboard widget | PRD-21A | — | 📌 Post-MVP | — |
| LiLa proactive Vault suggestions | PRD-21A | — | 📌 Post-MVP | — |
| Learning paths (multi-item sequences) | PRD-21A | — | 📌 Post-MVP | — |
| Creator economy / user-submitted tools | PRD-21A | — | 📌 Post-MVP (Phase 4) | — |
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
| Guided lightweight notepad | PRD-04 | PRD-08 | ⏳ Unwired (MVP) | Phase 09 |
| PWA entry points | PRD-04 | PRD-33 | 📌 Post-MVP | — |
| Timer idle reminders | PRD-36 | PRD-15 | ⏳ Unwired (MVP) | Phase 16 |
| Timer → homeschool time logs | PRD-36 | PRD-28 | ⏳ Unwired (MVP) | Phase 32 |
| Timer → task completion threshold | PRD-36 | PRD-09A | ✅ Wired | Phase 10 |
| Timer → widget data points | PRD-36 | PRD-10 | ⏳ Unwired (MVP) | Phase 11 |
| Visual World themed timer animations | PRD-36 | PRD-24A | 📌 Post-MVP | — |

## Studio & Lists Stubs (Phase 10 — PRD-09B)

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| Studio Browse tab (template cards) | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio My Customized tab | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio [Customize] → Task types | PRD-09B | PRD-09A | ✅ Wired | Phase 10 |
| Studio [Customize] → List types | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio [Customize] → Guided Forms | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
| Studio [Customize] → Trackers/Widgets | PRD-09B | PRD-10 | ⏳ Unwired (MVP) | Phase 11 |
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

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Wired | ~65 |
| 🔗 Partially Wired | ~3 |
| ⏳ Unwired (MVP) | ~2 |
| 📌 Post-MVP | ~45 |
| ❌ Superseded | ~3 |
| **Total** | ~118 |
