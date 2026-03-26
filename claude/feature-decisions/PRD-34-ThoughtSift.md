# Feature Decision File: PRD-34 — ThoughtSift Decision & Thinking Tools

> **Created:** 2026-03-26
> **PRD:** `prds/platform-complete/PRD-34-ThoughtSift-Decision-Thinking-Tools.md`
> **Addenda read:**
>   - `prds/addenda/PRD-34-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
> **Condensed intelligence:** `reference/thoughtsift_condensed_intelligence.md` (67 KB, 172 books)
> **Founder approved:** pending

---

## What Is Being Built

Five AI-powered thinking tools that help family members process decisions, shift perspectives, resolve conflicts, and rewrite text. Each is a distinct LiLa guided mode, parked in the AI Vault as separate browsable items. Mom discovers them in the Vault and assigns individual tools to family members via "+Add to AI Toolbox." All conversations save to `lila_messages` + `lila_conversations`.

Tools: Board of Directors (multi-persona advisory panel), Perspective Shifter (framework lenses with family-context), Decision Guide (15 structured frameworks), Mediator (8 conflict context modes, supersedes PRD-19 relationship_mediation), Translator (single-turn Haiku rewrite).

---

## Sub-Phase Plan

| Sub-Phase | Scope | Tools |
|---|---|---|
| **34A** | Foundation + simpler tools | DB migration (6 tables + seed data), guided mode corrections, Vault category + 5 vault_items with thumbnails, Translator (custom UI + Haiku edge function), Decision Guide (UI + 15 frameworks + Sonnet edge function + values alignment) |
| **34B** | Complex conversational tools | Perspective Shifter (lens chips + family-context lenses + person pill selector + Sonnet edge function), Mediator (8 context modes + Full Picture PRD-19 preservation + safety exception + Sonnet edge function) |
| **34C** | Board of Directors | Group-chat UI, sequential multi-advisor responses, persona selector sheet, custom persona creation, Prayer Seat, content policy gate, persona caching, board_sessions wiring, BookShelf enrichment stub |

---

## Screens & Components

| Screen / Component | Sub-Phase | Notes |
|---|---|---|
| Translator single-turn UI (NOT ToolConversationModal) | 34A | Input textarea, 12 tone chips (text only, no emoji), result area, Copy/Try Another/Edit actions |
| Decision Guide framework overlay in ToolConversationModal | 34A | [Suggest for me] / [I'll pick my own] flow, 15-framework scrollable list, visual divider on switch |
| Perspective Shifter lens chip row in ToolConversationModal | 34B | Horizontal scrollable chips above input, active lens highlighted, [+ More] for full library |
| Perspective Shifter family-context person pill selector | 34B | Same PersonPillSelector from PRD-21, triggered by family-context lens activation |
| Mediator context selector dropdown in ToolConversationModal | 34B | 8 context modes, default "Solo — just me processing" |
| Mediator Full Picture mode (mom only) | 34B | Loads all relationship_notes for pair, private_notes, neutral label synthesis |
| Board of Directors modal (BoardOfDirectorsModal) | 34C | Extends base modal with board assembly bar + group-chat attributed messages |
| Persona Selector bottom sheet | 34C | Search, favorites, recently used, suggested, platform library, create custom |
| Custom Persona Creation flow | 34C | 2-step: name + relationship + description → LiLa follow-up → generate |
| Prayer Seat card | 34C | 5 fresh reflection questions per session, Save to Journal, Add as Reflection Seat |
| Persona disclaimer (inline, once per session) | 34C | "AI interpretation... not endorsed..." for non-personal personas |
| Vault items for all 5 tools | 34A | Seeded with real thumbnails from platform_assets |
| Empty states for each tool | All | Opening messages from PRD-34 spec |

---

## Key PRD Decisions (Easy to Miss)

1. **Translator uses Haiku, NOT Sonnet.** Single-turn only. No conversation history. No context loading.
2. **Translator tone buttons: text labels only, no emoji.** No emoji in output text either.
3. **Board of Directors: 3 default seats, 5 max.** Each advisor = one Sonnet call per turn. Cost scales linearly.
4. **Mediator supersedes PRD-19's `relationship_mediation`.** Mode key `relationship_mediation` should be deactivated. All Full Picture privacy rules preserved in Mediator's 8th context mode.
5. **`relationship_mediation` was never actually created in migrations** — no deactivation SQL needed. The PRD-19 behavior just needs to be built into the Mediator.
6. **All 5 tools start parked in Vault, no default assignments.** Mom assigns via "+Add to AI Toolbox."
7. **Perspective Shifter family-context lenses: synthesize, never quote.** Privacy rule enforced in edge function, not just system prompt.
8. **Board of Directors personal_custom personas NEVER enter platform intelligence pipeline.** Check `persona_type` before any pipeline write.
9. **Content policy gate: deity → Prayer Seat, blocked figures → message, harmful descriptions → revise prompt.**
10. **Persona caching (P8 pattern): always check by name before generating.** User-created public personas go through moderation.
11. **Decision Guide coin flip insight: offered once after 3+ turns of indecision. Never pushed if declined.**
12. **Mediator safety exception: once triggered, framework coaching does NOT resume in that session.**
13. **Vault thumbnails already exist** in platform_assets table as vault_thumbnail category entries for all 5 tools (board_of_directors, perspective_shifter, decision_guide, mediator, translator) — variant A is the primary.
14. **Existing guided mode registrations need corrections:** container_preference, context_sources, available_to_roles, person_selector, opening_messages all need updates per PRD spec.

---

## Addendum Rulings

### From PRD-34-Cross-PRD-Impact-Addendum:
- Remove `thoughtsift` placeholder from guided mode registry (confirmed: no such placeholder exists — 5 individual modes were seeded instead)
- Mark `relationship_mediation` as superseded (confirmed: never existed in DB, no action needed)
- 5 new vault_items with `content_type = 'ai_tool'`, `delivery_method = 'native'`
- New "ThoughtSift / Thinking Tools" vault category
- Community persona/lens moderation queues deferred to PRD-32
- BoD safety: evaluate advisor responses in full conversation context, not individually

### From PRD-31-Permission-Matrix-Addendum:
- Board of Directors + Perspective Shifter: Full Magic tier
- Decision Guide + Mediator + Translator: Enhanced tier
- Guided kids: Decision Guide + Mediator at Full Magic, Translator at Enhanced
- Play/Special Adult: never for any ThoughtSift tool
- During beta: all return true via useCanAccess()

### From PRD-Audit-Readiness-Addendum:
- All tables must have RLS enabled
- All embedding columns use halfvec(1536) with HNSW indexes
- board_personas.embedding uses halfvec(1536), not vector(768) as PRD states

---

## Database Changes Required

### New Tables (6)
1. `board_personas` — persona profiles (system/community/personal_custom)
2. `board_sessions` — links BoD conversations to seated personas
3. `board_session_personas` — individual persona seats per session
4. `persona_favorites` — user's favorited personas (UNIQUE member_id, persona_id)
5. `perspective_lenses` — lens definitions (system/community/custom)
6. `decision_frameworks` — 15 decision framework definitions

### Modified Tables
- `lila_guided_modes` — update 5 ThoughtSift mode rows: add container_preference='modal', fix context_sources, fix available_to_roles, fix person_selector, add opening_messages

### Seed Data
- 15 decision_frameworks with full system_prompt_additions
- ~17 perspective_lenses (6 simple shifts + 8 named frameworks + 3 family-context templates)
- 15-20 board_personas (system_preloaded starter pack)
- 1 vault_categories record ("ThoughtSift / Thinking Tools")
- 5 vault_items records with real thumbnail URLs from platform_assets

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `thoughtsift_board_of_directors` | Full Magic | mom, dad_adults, independent_teens | Already registered |
| `thoughtsift_perspective_shifter` | Full Magic | mom, dad_adults, independent_teens | Already registered |
| `thoughtsift_decision_guide` | Enhanced | mom, dad_adults, independent_teens, guided_kids | Already registered |
| `thoughtsift_mediator` | Enhanced | mom, dad_adults, independent_teens, guided_kids | Already registered |
| `thoughtsift_translator` | Enhanced | mom, dad_adults, independent_teens, guided_kids | Already registered |

---

## Stubs — Do NOT Build This Phase

- [ ] Community persona moderation queue (→ PRD-32 Admin Console)
- [ ] Community lens moderation queue (→ PRD-32 Admin Console)
- [ ] Full persona library browse page with categories (post-MVP — search + favorites sufficient)
- [ ] LiLa proactive ThoughtSift tool suggestion from general chat (post-MVP)
- [ ] Board session export (post-MVP)
- [ ] Translator non-English language support (post-MVP)
- [ ] Guided-shell simplified tool versions (post-MVP)
- [ ] Custom framework creation for Decision Guide (post-MVP)
- [ ] BookShelf enrichment for BoD personas (stub if PRD-23 not built — check at build time)
- [ ] Route to BigPlans action chip (stub if PRD-29 not built — show disabled with tooltip)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| ThoughtSift tools | ← | AI Vault (PRD-21A) | vault_items with guided_mode_key |
| ThoughtSift tools | ← | AI Toolbox (PRD-21) | lila_tool_permissions records |
| Mediator Full Picture | ← | Archives (PRD-13) | relationship_notes, private_notes, archive_context_items |
| Perspective Shifter | ← | InnerWorkings (PRD-07) | self_knowledge entries for family-context lenses |
| Decision Guide | ← | Guiding Stars (PRD-06) | guiding_stars, best_intentions for values alignment |
| All tools | → | LiLa conversations | lila_conversations + lila_messages |
| All tools | → | Safety monitoring (PRD-30) | Standard safety pipeline |
| Board of Directors | → | Platform Intelligence | Channel D personas (system/community only, NOT personal) |
| Decision Guide | → | Smart Notepad | Save Decision action chip |
| Board of Directors | → | Journal | Save to Journal via Prayer Seat |

---

## Things That Connect Back to This Feature Later

- PRD-23 (BookShelf): enriches BoD personas with extracted book content
- PRD-29 (BigPlans): "Route to BigPlans" action chip on Decision Guide and BoD
- PRD-32 (Admin Console): community persona/lens moderation queues
- PRD-15 (Messaging): "Send via Message" compose flow for Mediator

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] Sub-phase split (34A / 34B / 34C) approved
- [ ] No emoji on Translator tone buttons or output — confirmed
- [ ] Vault thumbnails use real URLs from platform_assets — confirmed
- [ ] **Approved to build**

---

## Post-Build PRD Verification — Phase 34A

> Completed 2026-03-26. Founder approved.

### Summary — Phase 34A
- Total requirements verified: 54
- Wired: 42
- Deferred to 34B/34C: 4
- Stubbed: 8 (PRD-30 pipeline, PRD-23 BookShelf, PRD-29 BigPlans, PRD-32 moderation, 34B/34C Edge Functions)
- Missing: 0

### Key deliverables
- 6 tables: board_personas, board_sessions, board_session_personas, persona_favorites, perspective_lenses, decision_frameworks
- Seed data: 18 personas, 17 lenses, 15 frameworks, 5 vault_items, 1 vault_category
- Edge Functions: lila-translator (Haiku), lila-decision-guide (Sonnet)
- UI: TranslatorModal (single-turn), Decision Guide framework selector (suggest/pick/switch/active header)
- Guided mode corrections: all 5 modes updated (container_preference, context_sources, available_to_roles, person_selector, opening_messages)

---

## Post-Build PRD Verification — Phase 34B

> Completed 2026-03-26. Founder approved.

### Summary — Phase 34B
- Total requirements verified: 43
- Wired: 39
- Stubbed: 4 (community lens moderation, custom lens creation UI, is_available_for_mediation toggle, Send via Message)
- Missing: 0

### Key deliverables
- Edge Functions: lila-perspective-shifter (Sonnet), lila-mediator (Sonnet)
- Perspective Shifter: lens chips above input, 14 system lenses, family-context synthesis (never quote), full lens library overlay
- Mediator: 8 context modes via dropdown, Full Picture (mom-only gated), safety_triggered flag persisted to DB (survives close/reopen, checked every turn, no resume)
- Three critical requirements verified: family-context privacy (dual enforcement), Full Picture role gate, safety flag persistence

---

## Post-Build PRD Verification — Phase 34C

> Completed 2026-03-26. Founder approved.

### Summary — Phase 34C
- Total requirements verified: 58
- Wired: 48
- Stubbed: 10 (BookShelf enrichment, community moderation, browse page, export, @Name UI, situation suggestions, preview card, follow-up Q, BigPlans, recently used)
- Missing: 0

### Key deliverables
- Edge Function: lila-board-of-directors (Sonnet) with 4 action types (chat, create_persona, generate_prayer_seat, content_policy_check)
- BoardOfDirectorsModal: group-chat UI, board assembly bar, sequential multi-advisor streaming
- PersonaSelector: search, favorites, platform library by category, create custom
- Content policy gate: Haiku pre-screen with 3 outcomes (deity/blocked/harmful)
- Prayer Seat: fresh questions generated per situation via Sonnet
- Persona caching: case-insensitive name check before generation
- Disclaimer tracking: disclaimer_shown on board_sessions, shown once per session
- 5-advisor hard cap enforced in UI

---

## Founder Sign-Off (Post-Build)

- [x] Phase 34A verification table reviewed — **approved 2026-03-26**
- [x] Phase 34B verification table reviewed — **approved 2026-03-26**
- [x] Phase 34C verification table reviewed — **approved 2026-03-26**
- [x] All stubs are acceptable and in STUB_REGISTRY.md
- [x] Zero Missing items confirmed
- [x] **All phases approved as complete**
- **34A completion date:** 2026-03-26
- **34B completion date:** 2026-03-26
- **34C completion date:** 2026-03-26
- **PRD-34 fully complete:** 2026-03-26
- **34A completion date:** 2026-03-26
- **34B completion date:** 2026-03-26
