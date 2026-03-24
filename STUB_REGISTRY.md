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
| Family device hub widgets | PRD-01 | PRD-14D | ✅ Wired | Phase 15 |
| Tablet hub timeout config | PRD-01 | PRD-22 | ✅ Wired | Phase 27 |
| Permission hub UI | PRD-02 | PRD-22 | ✅ Wired | Phase 27 |
| Transparency panel | PRD-02 | PRD-14C | ✅ Wired | Phase 15 |
| View As sessions | PRD-02 | PRD-14 | ✅ Wired | Phase 14 |
| Shift schedule config | PRD-02 | PRD-35 (access_schedules) | ✅ Wired | Phase 05 |
| Admin user management | PRD-02 | PRD-32 | ✅ Wired | Phase 39 |

## LiLa AI Stubs

| Stub | Created By | Wired By | Status | Build Phase |
|------|-----------|----------|--------|-------------|
| LiLa Optimizer mode | PRD-05 | PRD-05C | ✅ Wired | Phase 23 |
| Context sources (GuidingStars, etc.) | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
| Review & Route pipeline | PRD-05 | PRD-08 | ✅ Wired | Phase 09 |
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
| Edit in Notepad action chip | PRD-05 (Phase 06) | PRD-08 | ⏳ Unwired (MVP) | Phase 09 |
| Review & Route action chip | PRD-05 (Phase 06) | PRD-08 | ⏳ Unwired (MVP) | Phase 09 |
| Create Task action chip | PRD-05 (Phase 06) | PRD-09A | ⏳ Unwired (MVP) | Phase 10 |
| Record Victory action chip | PRD-05 (Phase 06) | PRD-11 | ⏳ Unwired (MVP) | Phase 12 |
| Voice input (Whisper) | PRD-05 (Phase 06) | — | ⏳ Unwired (MVP) | TBD |
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
| Completion-dependent scheduling | PRD-35 | PRD-35 | ✅ Wired | Phase 05 |
| Custody patterns | PRD-35 | PRD-27 | ✅ Wired | Phase 31 |
| Timer idle reminders | PRD-36 | PRD-15 | ✅ Wired | Phase 16 |
| Timer → homeschool time logs | PRD-36 | PRD-28 | ✅ Wired | Phase 32 |

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
