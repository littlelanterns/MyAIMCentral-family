# Feature Decision File: PRD-21 — Communication & Relationship Tools

> **Created:** 2026-03-25
> **PRD:** `prds/ai-vault/PRD-21-Communication-Relationship-Tools.md`
> **Addenda read:**
>   - `prds/addenda/PRD-21-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` (always-relevant)
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md` (always-relevant)
> **Intelligence source:** `Additional Docs/communication_tools_condensed_intelligence.md` (198 items, 27 books)
> **Founder approved:** pending

---

## What Is Being Built

Eight AI-powered guided tools that help family members communicate better and connect intentionally. Five "Love Language" tools (Quality Time, Gifts, Observe & Serve, Words of Affirmation, Gratitude) work with any family member. Cyrano is spouse/partner-only message crafting. Higgins has two modes: Say (craft messages for any relationship) and Navigate (relational processing and coaching). All 8 open in conversation modals — not the LiLa drawer — for every member including mom. They use the existing LiLa conversation engine with person-specific context loading, teaching skill rotation, and veto memory.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| AI Toolbox sidebar section | New nav section below "AI & Tools" in Mom/Adult/Independent shells. Love Languages group (collapsible, 5 items) + Cyrano + Higgins. Not in Play/Guided (simplified for Guided TBD). |
| QuickTasks — Love Languages popover | Popover (desktop) / bottom sheet (mobile) with 5 tool options. Launched from new Love Languages pill button. |
| QuickTasks — Cyrano pill button | Direct launch to Cyrano modal. Shows only if partner exists and member has access. |
| QuickTasks — Higgins mode picker | Small popover: "Help Me Say Something" / "Help Me Navigate This". Launched from Higgins pill button. |
| ToolConversationModal | Shared modal wrapping all 8 tools. Extends existing LilaModal with: person pill selector in header, tool-specific action chips, mode-switching support. |
| PersonPillSelector | Horizontal row of member avatar pills. Single-select for Love Languages + Cyrano. Multi-select for Higgins. Auto-detects names from conversation text. |
| Tool-specific action chip trays | Save Draft, Copy Draft, Send via Message (Cyrano/Higgins Say). Create Task (5 tools). Save to Journal (Gratitude/Navigate). Record Victory (WoA/Gratitude). Add to Wishlist/Gift Ideas (Gifts). |
| Cyrano partner guard | Empty state when no partner: "Cyrano works with your spouse or partner..." message. |
| No-context empty state | When selected person has minimal context: "I don't know much about [Name] yet..." |

---

## Key PRD Decisions (Easy to Miss)

1. **All 8 tools use modals, NOT drawer** — even for mom. `container_preference: 'modal'` in guided mode registry.
2. **Cyrano is spouse/partner-only.** Higgins covers all other relationships. If user selects spouse in Higgins Say, offer Cyrano handoff once (don't force).
3. **Craft-first flow** — Cyrano and Higgins Say produce the draft IMMEDIATELY on first message. No clarifying questions before the first draft. Exception: repair/apology messages may ask "What do you want them to feel?"
4. **Teaching skills rotate** — Load last 10 from `teaching_skill_history`. Never repeat the most recent. After each turn, save the used skill. Cyrano has its own set (11+ skills from condensed intelligence). Higgins Say has a distinct set (9+ skills).
5. **Skill-check mode** — After 5+ interactions with a crafting tool, periodically offer to let user write first and give feedback. If declined, don't repeat same session.
6. **Veto memory** — Negative preferences saved to `archive_context_items` with `is_negative_preference = true`. Loaded as AVOID list in future sessions. User can override vetoes.
7. **"How to Reach Me" card** is HIGH PRIORITY context for all 8 tools — loaded first in token budget.
8. **Person pill auto-detection** — When user mentions a family member by name/nickname in conversation text, auto-resolve via `display_name_aliases` and auto-select pill.
9. **Higgins Navigate follows 5 phases** in order: Listen → Validate → Curiosity → Options → Empower. Do NOT shortcut or reorder.
10. **Mode switching within modals** — LiLa detects domain shifts, offers to switch modes, saves both conversations.
11. **Relationship-specific voice adaptation** — Higgins Say adapts coaching to 7 relationship types: Parent→Young Child, Parent→Tween, Parent→Teen, Parent→Young Adult, Child/Teen→Parent, Peer→Peer, Spouse→Spouse. Use developmental stage, not just chronological age.
12. **communication_drafts unifies** Cyrano and Higgins Say drafts in one table. `tool_mode` column distinguishes.
13. **Drafts older than 30 days** in "draft" status auto-archive (not delete). "saved_for_later" persists indefinitely.
14. **9 feature keys** — `tool_quality_time`, `tool_gifts`, `tool_observe_serve`, `tool_words_affirmation`, `tool_gratitude`, `tool_cyrano`, `tool_higgins_say`, `tool_higgins_navigate`, `ai_toolbox_browse`. All return true during beta.

---

## Addendum Rulings

### From PRD-21-Cross-PRD-Impact-Addendum.md:
- QuickTasks strip gains 3 new button types with popover/bottom-sheet sub-menus
- `container_preference: 'modal'` added to guided mode registry schema for all 8 tools
- Gratitude tool creates `journal_entries` with `entry_type = 'gratitude'`
- Higgins Navigate creates `journal_entries` with `entry_type = 'journal_entry'`
- "Send via Message" opens PRD-15 compose flow with pre-filled text — verify API exists
- Veto memory uses existing PRD-13 context learning write-back pattern
- AI Toolbox sidebar section partially wires PRD-19 stubs

### From PRD-Audit-Readiness-Addendum.md:
- `communication_drafts` unified (not separate per-tool tables)
- `teaching_skill_history` covers all 3 crafting modes
- `partner_lens` replaces `her_lens` (gender-neutral)

---

## Database Changes Required

### New Tables
- `communication_drafts` — Stores Cyrano and Higgins Say drafts. Columns: id, family_id, author_id, about_member_id, tool_mode (CHECK: 'cyrano','higgins_say'), raw_input, crafted_version, final_version, teaching_skill, teaching_note, status (CHECK: 'draft','sent','saved_for_later','discarded'), sent_at, sent_via, lila_conversation_id, created_at, updated_at. RLS: author + mom.
- `teaching_skill_history` — Tracks skill rotation for all 3 crafting modes. Columns: id, family_id, member_id, tool_mode (CHECK: 'cyrano','higgins_say','higgins_navigate'), skill_key, about_member_id, lila_conversation_id, created_at. RLS: member + mom.

### PRD-19 Guard Tables (create if missing)
- `private_notes` — Mom's private notes about family members. Columns: id, family_id, about_member_id, author_id, content, is_included_in_ai, created_at, updated_at. RLS: author + mom. CRITICAL privacy constraint: NEVER visible to about_member_id.
- `relationship_notes` — Author-scoped relationship notes. Columns: id, family_id, author_id, person_a_id, person_b_id, content, is_included_in_ai, created_at, updated_at. RLS: author + mom.

### Modified Tables
- `archive_context_items` — Add `is_negative_preference BOOLEAN DEFAULT false` if not present
- `archive_member_settings` — Add `display_name_aliases TEXT[] DEFAULT '{}'` if not present

### Migrations
- Single migration file: `supabase/migrations/00000000100041_prd21_communication_tools.sql`
- Idempotent: uses IF NOT EXISTS and ADD COLUMN IF NOT EXISTS throughout

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `tool_quality_time` | TBD (beta: all) | mom, dad_adults, independent_teens, guided_kids | |
| `tool_gifts` | TBD (beta: all) | mom, dad_adults, independent_teens, guided_kids | |
| `tool_observe_serve` | TBD (beta: all) | mom, dad_adults, independent_teens | |
| `tool_words_affirmation` | TBD (beta: all) | mom, dad_adults, independent_teens, guided_kids | |
| `tool_gratitude` | TBD (beta: all) | mom, dad_adults, independent_teens, guided_kids | |
| `tool_cyrano` | TBD (beta: all) | mom, dad_adults | Spouse/partner only |
| `tool_higgins_say` | TBD (beta: all) | mom, dad_adults, independent_teens | |
| `tool_higgins_navigate` | TBD (beta: all) | mom, dad_adults, independent_teens | |
| `ai_toolbox_browse` | TBD (beta: all) | mom, dad_adults, independent_teens, guided_kids | Sidebar section |

---

## Stubs — Do NOT Build This Phase

- [ ] AI Vault "+Add to AI Toolbox" assignment flow → PRD-21A (already built; wiring from vault to toolbox is separate)
- [ ] Full message coaching checkpoint integration ("Want help rewording? Open in Cyrano") → post-MVP
- [ ] Dedicated per-tool data tables (gift history, activity log) → post-MVP
- [ ] Cyrano growth tracking and export → post-MVP
- [ ] 21 Compliments Practice (Words of Affirmation enhancement) → post-MVP
- [ ] AI Toolbox drag-to-reorder → post-MVP
- [ ] Tool usage analytics per member → post-MVP
- [ ] ThoughtSift tools in AI Toolbox → PRD-34
- [ ] Homework Helper / teen tools → future PRD

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Loads person context | ← | Archives (PRD-13) | `archive_context_items` WHERE `about_member_id` = selected person |
| Loads "How to Reach Me" | ← | Archives (PRD-13) | `archive_context_items` WHERE `context_type = 'how_to_reach_me'` |
| Loads InnerWorkings | ← | InnerWorkings (PRD-07) | `self_knowledge` for selected person |
| Loads Guiding Stars | ← | GuidingStars (PRD-06) | `guiding_stars` for current member |
| Saves vetoes | → | Archives (PRD-13) | `archive_context_items` with `is_negative_preference = true` |
| Creates tasks | → | Tasks (PRD-09A) | Action chip → task creation modal |
| Creates journal entries | → | Journal (PRD-08) | Action chip → `journal_entries` insert (gratitude, journal_entry types) |
| Creates list items | → | Lists (PRD-09B) | Action chip → wishlist / gift ideas list items |
| Creates victories | → | Victories (PRD-11) | Action chip → victory creation |
| Opens message compose | → | Messages (PRD-15) | "Send via Message" → compose flow with pre-filled body |
| Loads private notes | ← | Family Context (PRD-19) | `private_notes` WHERE `author_id` = current member |
| Loads relationship notes | ← | Family Context (PRD-19) | `relationship_notes` for relevant pair |
| Saves to conversations | → | LiLa (PRD-05) | `lila_conversations` + `lila_messages` |

---

## Things That Connect Back to This Feature Later

- PRD-21A: AI Vault "+Add to AI Toolbox" will allow vault items to appear in AI Toolbox sidebar
- PRD-34: ThoughtSift tools will register in AI Toolbox alongside these 8 tools
- Future teen tools PRD: Additional tools for independent/guided shells
- PRD-15 coaching build: Full "Want help rewording? Open in Cyrano" checkpoint integration

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate
- [x] All addenda captured above
- [x] Stubs confirmed — nothing extra will be built
- [x] Schema changes correct
- [x] Feature keys identified
- [x] **Approved to build** — 2026-03-26

---

## Post-Build PRD Verification

| # | Requirement | Source | Status | Notes |
|---|---|---|---|---|
| 1 | AI Toolbox sidebar in Mom/Adult/Independent | PRD §Entry Points | Wired | AIToolboxSection in Sidebar.tsx |
| 2 | Love Languages group (collapsible, 5) + Cyrano + Higgins | PRD §Entry Points | Wired | |
| 3 | QuickTasks 3 buttons | PRD §Entry Points | Wired | Love Languages, Cyrano, Higgins |
| 4 | Love Languages popover (5 tools) | PRD §Screen 1 | Stubbed | QuickTasks opens quality_time directly; sidebar has full 5-tool picker |
| 5 | Higgins mode picker (Say/Navigate) | PRD §Screen 2 | Wired | Sidebar expands to both |
| 6 | All 8 in modals for ALL members | PRD §Screen 3 | Wired | container_preference='modal' |
| 7 | Person pill selector in header | PRD §Screen 3 | Wired | PersonPillSelector component |
| 8 | Pills pre-select spouse for Cyrano | PRD §Screen 3 | Wired | partnerOnly mode |
| 9 | Multi-select for Higgins | PRD §Screen 3 | Wired | |
| 10 | Name auto-detection (client-side pill) | PRD §Screen 3 | Stubbed | Server-side name detection works; client pill auto-select not wired |
| 11 | Context assembly loads 11 sources | PRD §AI Integration | Wired | relationship-context.ts |
| 12 | "How to Reach Me" high-priority | PRD §AI Integration | Wired | Loaded first, formatted as HIGH PRIORITY |
| 13 | Quality Time suggestions | PRD §Tool 1 | Wired | |
| 14 | Gifts personalized | PRD §Tool 2 | Wired | |
| 15 | Gifts: Add to Wishlist/Gift Ideas chips | PRD §Tool 2 | Stubbed | UI present, routes to generic list creation |
| 16 | Observe & Serve hidden needs | PRD §Tool 3 | Wired | |
| 17 | Words of Affirmation specific | PRD §Tool 4 | Wired | 4 subtypes, NVC formula |
| 18 | Gratitude: Save to Journal | PRD §Tool 5 | Wired | entry_type='gratitude' |
| 19 | Cyrano craft-first + partner lens | PRD §Tool 6 | Wired | |
| 20 | Cyrano teaches 1 skill/interaction | PRD §Tool 6 | Wired | 11 skills with rotation |
| 21 | Higgins Say voice adaptation | PRD §Tool 7 | Wired | 7 relationship types |
| 22 | Higgins Say teaches skills | PRD §Tool 7 | Wired | 9 skills with rotation |
| 23 | Navigate 5-phase flow | PRD §Tool 8 | Wired | Listen→Validate→Curiosity→Options→Empower |
| 24 | Navigate options with labels/risk | PRD §Tool 8 | Wired | SODA process |
| 25 | Veto memory | PRD §Screen 3 | Wired | is_negative_preference column + AVOID list |
| 26 | communication_drafts + RLS | PRD §Data Schema | Wired | |
| 27 | teaching_skill_history + RLS | PRD §Data Schema | Wired | |
| 28 | Skill rotation (last 10) | PRD §Tool 6 | Wired | pickNextSkill helper |
| 29 | Skill-check after 5+ | PRD §Tool 6 | Wired | totalInteractions in prompt |
| 30 | Save/Copy Draft chips | PRD §Screen 3 | Wired | |
| 31 | Send via Message | PRD §Screen 3 | Stubbed | PRD-15 compose API not verified |
| 32 | Create Task chips | PRD §Screen 3 | Wired | |
| 33 | Record Victory chips | PRD §Screen 3 | Wired | |
| 34 | Mode switching within modals | PRD §AI Integration | Wired | Navigate→Say via ToolLauncherProvider |
| 35 | Conversations save with mode tags | PRD §Screen 3 | Wired | |
| 36 | Conversations auto-named | PRD §Screen 3 | Stubbed | Auto-titling not in tool Edge Functions |
| 37 | Opening messages rotate | PRD §Tools | Wired | 2 variants per tool seeded |
| 38 | useCanAccess() on 9 keys | PRD §Tier Gating | Stubbed | Keys registered; gates not wrapped (beta=all true) |
| 39 | PermissionGate wrapping | PRD §Tier Gating | Stubbed | Same — beta deferred |
| 40 | RLS: drafts author+mom | PRD §Data Schema | Wired | |
| 41 | RLS: skill history member+mom | PRD §Data Schema | Wired | |
| 42 | Teen voice: talks UP | PRD §Visibility | Wired | In Higgins Say system prompt |

### Summary
- Total requirements: 42
- Wired: 32
- Stubbed: 10
- Missing: **0**

### Founder Notes for PRD-34
- Item 36 (auto-titling): Wire auto-title Haiku call in all ThoughtSift tool Edge Functions from the start
- Item 31 (Send via Message): Verify PRD-15 compose flow API before PRD-34 ships — Mediator needs it too

---

## Founder Sign-Off (Post-Build)

- [x] Verification table reviewed
- [x] All stubs are acceptable for this phase
- [x] Zero Missing items confirmed
- [x] **Phase approved as complete**
- **Completion date:** 2026-03-26
