# PRD-07 Session Addendum: Decisions & Cross-PRD Updates

**Session:** PRD-07 (InnerWorkings) planning and drafting
**Date:** March 3, 2026
**Purpose:** Capture all decisions made during this session that affect project knowledge, other PRDs, or the build order. Upload this to project knowledge so future conversations have access.

---

## Decision 1: Feature Renamed — "My Foundation" → "InnerWorkings"

**Previous name:** My Foundation (user-nameable, with preset options: Compass Rose, Inner Workings, My Blueprint, Operating System, or custom)
**New name:** **InnerWorkings** (one word, capital I capital W). NOT user-nameable — it's InnerWorkings for everyone.
**Database table:** `self_knowledge` (unchanged)

**What to update:**
- Planning_Decisions.md: Feature Naming table — change "My Foundation" to "InnerWorkings", remove "User-nameable" note
- Feature Design Reference: Feature Name Mapping table — update display name from "My Foundation (user-nameable)" to "InnerWorkings"
- System Overview PRD v1 and Complete Reference: feature map tables — update display name, remove "User Can Rename? YES" for this feature
- PRD-05 Planning Decisions Addendum: any reference to "My Foundation" → "InnerWorkings"
- PRD-06 (Guiding Stars): references to "My Foundation" in context assembly section → "InnerWorkings"

---

## Decision 2: "You, Inc." Category Removed

The "You, Inc." (professional self-knowledge) category has been removed from InnerWorkings for all members. The five categories are now:

1. **Personality Types** (renamed from "Personality Assessments") — hover description: "Your results from personality frameworks — MBTI, Enneagram, Dressing Your Truth, Four Tendencies, StrengthsFinder, Love Languages, etc. Just the type or result, not the full assessment."
2. **Traits & Tendencies**
3. **Strengths**
4. **Growth Areas** (never "Weaknesses")
5. **General**

**Rationale:** A future growth direction is to have a business identity that functions like an additional family member — a business entity with its own profile, self-knowledge, and context. Professional/business self-knowledge will live there, not in personal InnerWorkings.

**What to update:**
- Any reference to six Keel/self-knowledge categories → five categories
- StewardShip conventions referencing "You, Inc." do not carry forward to MyAIM Family v2

---

## Decision 3: `self_knowledge` Table Supersedes `member_self_insights`

PRD-05 defined a `member_self_insights` stub table for teen/dad self-insights. PRD-07's `self_knowledge` table fully replaces it, carrying forward the sharing model (`share_with_mom`, `share_with_dad`) with the complete InnerWorkings feature structure.

**What to update:**
- PRD-05 (LiLa Core AI System): note that `member_self_insights` is superseded by `self_knowledge` from PRD-07
- PRD-05 schema section: mark `member_self_insights` as superseded
- Any context assembly references to `member_self_insights` → `self_knowledge`

---

## Decision 4: Teen Privacy Inverted for InnerWorkings

InnerWorkings uses an **inverted privacy model** compared to Guiding Stars:

| Feature | Teen Default | Mom Access |
|---------|-------------|------------|
| Guiding Stars (PRD-06) | Visible to mom by default | Mom can grant teen ability to mark entries private |
| InnerWorkings (PRD-07) | **Private by default** | Mom must actively toggle on visibility (teen is notified) |

**Details:**
- Mom toggles on visibility per teen in Family Settings
- Teen receives a notification when mom turns on visibility
- A persistent indicator appears on the teen's InnerWorkings page
- Teen cannot toggle visibility back off, but can advocate for privacy via a Higgins conversation
- Even with visibility on, entries the teen has marked `is_private = true` remain hidden (if mom has enabled the private entry capability)
- Per-entry sharing toggles (`is_shared_with_mom`, `is_shared_with_dad`) work independently of the master visibility toggle — a teen with full privacy can still proactively share specific entries

**What to update:**
- This is a new pattern. No existing PRDs need to change, but future PRDs should be aware that either privacy model is available depending on feature sensitivity.

---

## Decision 5: Archives Aggregation Convention — "Checked Somewhere, Checked Everywhere"

This is a NEW cross-feature convention established in PRD-07:

**Rule:** Archives surfaces entries from context source feature tables (InnerWorkings, Guiding Stars, Best Intentions, Goals, etc.) as **live references, not copies**. The source feature table owns the sharing/visibility state (`is_included_in_ai`, `is_shared_with_mom`, `is_shared_with_dad`, `is_private`). Toggling these values in ANY surface — the feature's own page, Archives, or Context Settings — updates the same underlying column. There is no separate "Archives copy" of the sharing state.

**What this means:**
- Archives is the **unified context management surface** — it aggregates relevant entries from across the platform into per-person cards
- Mom can CRUD context in Archives AND on each feature's own page — changes sync because they're the same data
- Mom can also add **supplementary entries** (her own observations about family members) directly in Archives — these live only in Archives, not in the member's InnerWorkings
- InnerWorkings is always **self-authored** — the member writes about themselves. Mom's observations about a family member go in Archives.

**PRDs affected:**
- **PRD-05 Planning Decisions Addendum:** Add this convention to the context toggle infrastructure section
- **PRD-06 (Guiding Stars & Best Intentions):** `guiding_stars` and `best_intentions` entries surface in Archives under this same convention (no table changes needed — the convention was already compatible, just not explicitly stated)
- **PRD-13 (Archives & Context) — future:** Must implement the aggregation UI that reads from all source tables
- **All future context source PRDs:** Must follow this convention

---

## Decision 6: `self_discovery` Guided Mode Registered

InnerWorkings registers a **`self_discovery` guided mode** in the LiLa guided mode registry. This is the "Discover with LiLa" input path.

**Key behavior:**
- LiLa uses built-in training knowledge of personality frameworks (MBTI, Enneagram, Four Tendencies, Dressing Your Truth, StrengthsFinder, Love Languages, DISC, Working Genius, etc.)
- When a user mentions a personality type, LiLa unpacks it: presents common traits as questions, confirms which apply, extracts confirmed traits as InnerWorkings entries
- For unknown frameworks, LiLa honestly says she's unfamiliar and asks for more context
- Discovery can span multiple conversations
- Extraction happens at natural stopping points: LiLa compiles confirmed insights, user reviews/edits, confirms → saved with `source_type = 'lila_discovery'`

**What to update:**
- PRD-05 guided mode registry should note `self_discovery` as a mode registered by PRD-07

---

## Decision 7: Personality GPTs Are Post-MVP (May Not Be Built)

Personality GPTs (Enneagram Guide, MBTI Interpreter, Four Tendencies Coach, StrengthsFinder Coach, Working Genius Navigator) referenced in the Faith & Ethics Framework and Complete Reference are **post-MVP and may not be built**. For now, users upload results, describe themselves, or discover through LiLa conversation.

**What to update:**
- Any roadmap or feature list referencing Personality GPTs should note them as post-MVP/optional
- The `self_discovery` guided mode handles the core use case these tools would have served

---

## Decision 8: Personality Types Category Behavior

The "Personality Types" category stores **type identifiers** — short entries like "ENFP", "Enneagram 7w8", "Carol Tuttle 3/2", "Gretchen Rubin Rebel" — not full assessment writeups. LiLa uses her training knowledge about those frameworks to understand what the type means and reference associated traits naturally in conversation.

This means:
- Entries in this category are typically short (a type identifier + optional brief notes)
- LiLa enriches sparse type entries with built-in framework knowledge
- The `source` field on these entries often contains the framework name ("MBTI", "Enneagram", "Dressing Your Truth")

---

## Decision 9: Business Identity as Future Family Member

A future growth direction is to allow a **business identity** that functions like an additional family member in the system — with its own profile, self-knowledge (InnerWorkings), guiding stars, and context. This is why "You, Inc." was removed from personal InnerWorkings: professional/business self-knowledge will live in the business entity's own InnerWorkings, not mixed in with personal self-knowledge.

This is NOT in any current PRD scope. It's a future architecture decision noted here for context.

---

## Complete PRD Build Order (Current as of March 3, 2026)

This is the authoritative build order from Planning_Decisions.md with status annotations:

### Foundation PRDs
| # | PRD | Status | Key Notes |
|---|-----|--------|-----------|
| 1 | Auth & Family Setup | ✅ Complete | Family structure, 5 member roles, login flows, PIN, member management |
| 2 | Permissions & Visibility | ✅ Complete | Mom-sees-all, granular per-parent access, teen transparency, RLS templates |
| 3 | Design System & Themes | ✅ Complete | CSS variables, shared components, theme library, vibes system |
| 4 | Shell Routing & Navigation | ✅ Complete | Mom/Adult/Independent/Guided/Play shells, layout zones, drawers |

### AI PRDs
| # | PRD | Status | Key Notes |
|---|-----|--------|-----------|
| 5 | LiLa Core + Help + Assist | ✅ Complete | Chat engine, drawer, context assembly, guided mode framework |
| 5A | PRD-05 Planning Decisions Addendum | ✅ Complete | Cross-PRD impact decisions from PRD-05 session |
| 5C | LiLa Optimizer | ✅ Complete | Prompt optimization, context assembly, platform formatting |

### Personal Growth PRDs
| # | PRD | Status | Key Notes |
|---|-----|--------|-----------|
| 6 | Guiding Stars & Best Intentions | ✅ Complete | Values/declarations + intentional action commitments |
| 7 | InnerWorkings (Self-Knowledge) | ✅ Complete | Personality data, 4 input paths, `self_discovery` guided mode. Formerly "My Foundation". |
| 8 | Journal + Smart Notepad | 📋 Next | Capture → route system, tabs, voice, Review & Route (MindSweep folded in) |
| 9 | Tasks + Lists | Not Started | All task views, Task Breaker, lists, recurring, family assignment |
| 10 | Widgets | Not Started | Widget templates, custom trackers/charts/goals, auto-sort by usage |
| 11 | Victory Recorder | Not Started | CRUD, AI celebrations, sharing |

### Vision & Context PRDs
| # | PRD | Status | Key Notes |
|---|-----|--------|-----------|
| 12 | LifeLantern | Not Started | Life assessment + vision casting + goal generation + Family Vision |
| 13 | Archives & Context | Not Started | Folders, checkbox context, auto-overview cards, aggregation hub. Must implement "checked somewhere, checked everywhere" convention. |
| 14 | Personal Dashboard | Not Started | Per-member personal growth space |

### Family PRDs
| # | PRD | Status | Key Notes |
|---|-----|--------|-----------|
| 15 | Family Dashboard | Not Started | Shared family coordination |
| 16 | Mom's Overview | Not Started | All-seeing progress command post |
| 17 | Family Management Page | Not Started | View/edit members, launch person-context tools, Out of Nest |

### Relationship PRDs
| # | PRD | Status | Key Notes |
|---|-----|--------|-----------|
| 18 | People & Relationships | Not Started | People profiles, categorized notes, non-family contacts |
| 19 | Partner Profile | Not Started | Connected spouse account, mutual visibility |

### Daily Life PRDs
| # | PRD | Status | Key Notes |
|---|-----|--------|-----------|
| 20 | Morning/Evening Rhythms | Not Started | Daily check-in cards |
| 21 | Meetings | Not Started | Couple, Parent-Child Mentor, Family Meeting frameworks |
| 22 | Safe Harbor | Not Started | Stress relief, guided support, crisis resources |

### Platform PRDs
| # | PRD | Status | Key Notes |
|---|-----|--------|-----------|
| 23 | Library Vault + Admin | Not Started | Netflix browsing, tool embedding, admin console |
| 24 | Rewards & Gamification | Not Started | Points, stars, themes, streaks, family gamification |
| 25 | Play Mode Dashboard | Not Started | Visual tasks, sticker rewards, celebrations |
| 26 | Guided Mode Dashboard | Not Started | Simplified UI, prompted interactions |
| 27 | Caregiver Tools | Not Started | Special Adult shift management, ISP goal tracking |
| 28 | Tracking, Allowance & Financial | Not Started | Payment tracking, allowance pools, homeschool, multi-dimensional task tracking |
| 29 | Settings | Not Started | All config panels, family management, privacy controls |

### Later PRDs (30+)
| PRD | Status | Key Notes |
|-----|--------|-----------|
| Calendar | Not Started | |
| Knowledge Base / RAG | Not Started | |
| Project Planner | Not Started | |
| Safety Monitoring | Not Started | |
| Subscription Tier System | Not Started | |
| Offline / PWA | Not Started | |

---

*End of PRD-07 Session Addendum*
