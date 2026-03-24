# Corrected Guided Mode Registry

> **Generated from full PRD audit 2026-03-23**
> **Source:** All 42 PRDs + all addenda
> **Convention:** Registered in `lila_guided_modes` table

---

## Core Modes (PRD-05)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `general` | General Chat | Sonnet | All (per context assembly) | No | Mom | — |
| `help` | LiLa Help | Haiku | Known issues DB, FAQ patterns | No | Mom | `lila_help` |
| `assist` | LiLa Assist | Haiku | Feature documentation, onboarding state | No | Mom | `lila_assist` |
| `optimizer` | LiLa Optimizer | Sonnet | All (filtered by active preset) | No (auto-detected) | Mom | `lila_optimizer` |

## Relationship / Communication Tools (PRD-21)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `quality_time` | Quality Time | Sonnet | Archives, InnerWorkings, preferences, relationship notes | Single person (any family member + OON) | Mom, Dad, Teen | `tool_quality_time` |
| `gifts` | Gifts | Sonnet | Archives, wishlists, preferences, gift history | Single person (any family member + OON) | Mom, Dad, Teen | `tool_gifts` |
| `observe_serve` | Observe & Serve | Sonnet | Archives, InnerWorkings, daily routines, recent tasks | Single person (family member) | Mom, Dad, Teen | `tool_observe_serve` |
| `words_affirmation` | Words of Affirmation | Sonnet | Archives, InnerWorkings, recent victories | Single person (family member) | Mom, Dad, Teen | `tool_words_affirmation` |
| `gratitude` | Gratitude | Sonnet | Archives, recent interactions, journal | Single person (optional) | Mom, Dad, Teen | `tool_gratitude` |
| `cyrano` | Cyrano | Sonnet | Archives, partner context, InnerWorkings, relationship notes | Spouse/partner only | Mom, Dad | `tool_cyrano` |
| `higgins_say` | Help Me Say Something | Sonnet | Archives, InnerWorkings, relationship notes, "How to Reach Me" | One or more people | Mom, Dad, Teen | `tool_higgins_say` |
| `higgins_navigate` | Help Me Navigate | Sonnet | Archives, InnerWorkings, relationship notes, "How to Reach Me" | One or more people (multi-select) | Mom, Dad, Teen | `tool_higgins_navigate` |

**Note:** All 8 tools use `container_preference: 'modal'` — modals for ALL members including mom.

## Personal Growth Modes

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key | Source PRD |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|-----------|
| `self_discovery` | Discover Your InnerWorkings | Sonnet | Existing InnerWorkings entries | No (always current member) | Mom, Dad, Teen | `innerworkings_discovery` | PRD-07 |
| `life_lantern` | Personal LifeLantern | Sonnet | self_knowledge, guiding_stars, best_intentions, life_lantern | No (always current member) | Mom (expandable) | `life_lantern` | PRD-12A |
| `family_vision_quest` | Family Vision Quest | Sonnet | family_members, guiding_stars, self_knowledge | No (family-scoped) | Mom | `family_vision_quest` | PRD-12B |

## Calendar / Events (PRD-14B)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `calendar_event_create` | LiLa Guided Event Creation | Sonnet (implied) | Family members, default drive time, recent locations, existing events | No | Guided, Independent | `calendar_ai_intake` |

## Meetings (PRD-16)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `meeting` | Meeting Facilitation | Sonnet | Meeting template, participants, agenda items, family context, recent victories, vision statement | No (meeting-scoped) | Mom, Dad | `meetings_ai` |

**Subtypes:** couple, parent_child, family_council, mentor, weekly_review, monthly_review, quarterly_inventory, business, custom

## Family Context (PRD-19)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `family_context_interview` | Family Context Interview | Sonnet | Existing archive data, family structure | Yes (about specific member) | Mom | `archives_guided_interview` |

**Note:** `relationship_mediation` from PRD-19 is **superseded** by `mediator` from PRD-34.

## Safe Harbor (PRD-20)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `safe_harbor` | Safe Harbor | Sonnet | Minimal — no family context loaded for privacy | No | Mom, Dad, Teen | `safe_harbor` |
| `safe_harbor_guided` | Safe Harbor Guided | Haiku | Simple warm responses | No | Guided children | `safe_harbor_guided` |
| `safe_harbor_orientation` | Safe Harbor Orientation | Sonnet | Orientation scenarios | No | Mom only | `safe_harbor` |
| `safe_harbor_literacy` | Safe Harbor Literacy | Haiku | Literacy building content | No | Teen only | `safe_harbor` |

## Task Modes (PRD-05/09A)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `task_breaker` | Task Breaker (Text) | Sonnet (implied) | Task title, description, family member names, dashboard modes, existing tasks, life area tag | No | All roles | `tasks_task_breaker_text` |
| `task_breaker_image` | Task Breaker (Image) | Sonnet (implied) | Same + uploaded image | No | Mom (Full Magic) | `tasks_task_breaker_image` |
| `task_placement` | AI Auto-Sort | Haiku (implied) | All unplaced tasks + current view framework | No | Mom, Dad, Teen | `tasks_views_full` |

## ThoughtSift (PRD-34)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `board_of_directors` | Board of Directors | Sonnet (one call per advisor) | User's topic + persona profiles + family context | No | Mom, Dad, Teen | `thoughtsift_board_of_directors` |
| `perspective_shifter` | Perspective Shifter | Sonnet | User's situation + active lens definition | No | Mom, Dad, Teen | `thoughtsift_perspective_shifter` |
| `decision_guide` | Decision Guide | Sonnet | User's decision + selected framework | No | Mom, Dad, Teen | `thoughtsift_decision_guide` |
| `mediator` | Mediator | Sonnet | Relationship notes, InnerWorkings, family context | Multi-person | Mom, Dad, Teen | `thoughtsift_mediator` |
| `translator` | Translator | Haiku | Input text only (single-turn, NOT conversational) | No | Mom, Dad, Teen | `thoughtsift_translator` |

**Note:** `mediator` supersedes `relationship_mediation` from PRD-19. `translator` is single-turn — NOT a conversation mode.

## BigPlans (PRD-29)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `bigplans` | BigPlans Planning | Sonnet | Active plans, guiding stars, best intentions | No | Mom, Dad, Teen | `bigplans_create` |
| `bigplans_goal` | BigPlans Goal Setting | Sonnet | Plan context, LifeLantern areas | No | Mom, Dad, Teen | `bigplans_ai_compile` |
| `bigplans_project` | BigPlans Project Planning | Sonnet | Plan context, milestones | No | Mom, Dad, Teen | `bigplans_ai_compile` |
| `bigplans_system` | BigPlans System Design | Sonnet | Plan context, friction templates | No | Mom | `bigplans_system_design` |

## BookShelf (PRD-23)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `book_discuss` | Discuss This Book | Sonnet | RAG chunks (per-book), extracted content, Guiding Stars, InnerWorkings | No | Mom, Dad, Teen | `bookshelf_discussions` |
| `library_ask` | Ask Your Library | Sonnet | RAG chunks (all books), semantic search all extracted content, Guiding Stars, InnerWorkings | No | Mom, Dad, Teen | `bookshelf_discussions` |

## Guided Dashboard (PRD-25)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `guided_homework_help` | Homework Help | Haiku (glaze) / Sonnet (conversation) | Member profile, current task list | No | Guided children | `guided_lila_homework` |
| `guided_communication_coach` | Communication Coach | Sonnet (implied) | Family member names, relationships | No | Guided children | `guided_lila_communication` |

## Compliance / Reporting (PRD-28B/37)

| mode_key | Display Name | Model | Context Sources | Person Selector | Available To | Feature Key |
|----------|-------------|-------|-----------------|-----------------|--------------|-------------|
| `homeschool_report_generation` | Homeschool Report Generation | Sonnet | Standards evidence, time logs, portfolio moments | No | Mom | `compliance_ai_reports` |
| `homeschool_bulk_summary` | Bulk Summary Generation | Sonnet | Family moments, time logs, portfolio data | No | Mom | `family_feed_bulk_summary` |

---

## Summary

| Category | Count |
|----------|-------|
| Core modes | 4 |
| Relationship tools | 8 |
| Personal growth | 3 |
| Calendar/events | 1 |
| Meetings | 1 |
| Family context | 1 |
| Safe Harbor | 4 |
| Task modes | 3 |
| ThoughtSift | 5 |
| BigPlans | 4 |
| BookShelf | 2 |
| Guided Dashboard | 2 |
| Compliance/Reporting | 2 |
| **Total** | **40** |

## Superseded Modes
| Old mode_key | Replaced By | Reason |
|-------------|-------------|--------|
| `thoughtsift` (placeholder) | 5 specific ThoughtSift modes | PRD-34 defines separate tools |
| `relationship_mediation` | `mediator` | PRD-34 supersedes PRD-19 |
