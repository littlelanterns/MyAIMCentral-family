# Build Prompt 35: ThoughtSift

## PRD Reference
- PRD-34: `prds/platform-complete/PRD-34-ThoughtSift-Decision-Thinking-Tools.md`
- Addendum: `prds/addenda/PRD-34-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 06 (LiLa Core AI) complete
- Phase 20 (Safe Harbor) complete

## Extraction Pull
- `thoughtsift_condensed_intelligence.md` for persona definitions, lens presets, and framework seed data

## Objective
Build 5 SEPARATE ThoughtSift tools: Board of Directors (3-5 persona advisory panel), Perspective Shifter (lens-based reframing), Decision Guide (15 frameworks), Mediator (8 context modes, supersedes PRD-19 relationship_mediation), and Translator (Haiku, single-turn, 12 presets + custom). Each tool is a distinct experience within the ThoughtSift section. This is a Large phase.

## Database Work
Create tables:
- `board_personas` — Persona definitions with name, archetype, voice description, system prompt template, tier (system/community/custom)
- `board_sessions` — Board of Directors session records with topic, status, and Prayer Seat toggle
- `board_session_personas` — Join table linking sessions to selected personas (3-5 per session)
- `persona_favorites` — User-favorited personas from the 3-tier persona library
- `perspective_lenses` — Lens definitions for Perspective Shifter (e.g., "As a child would see it", "10 years from now")
- `decision_frameworks` — 15 decision framework definitions with structure, prompts, and guide flow

Enable RLS on all tables. Members access their own sessions and favorites. System personas and lenses are read-only for all users.

## Component Work
### Board of Directors
- Persona selection — Choose 3-5 personas from 3-tier library (system, community, custom)
- 3-tier persona library — System-provided personas, community-shared personas, user-created custom personas
- Session creation — Define topic/question, select personas, optionally enable Prayer Seat
- Panel discussion — Each persona responds independently (1 Sonnet call per persona) to the topic
- Prayer Seat — Optional spiritual/faith perspective seat in the panel
- Session history — View past Board sessions with full persona responses

### Perspective Shifter
- Lens chips — Horizontal chip row above input for selecting perspective lenses
- Mid-conversation switching — Change lens during an active conversation to reframe the discussion
- Lens library — Browse and select from system and custom perspective lenses
- Reframed response — LiLa responds through the selected lens perspective

### Decision Guide
- 15 frameworks — Full library of decision frameworks (pros/cons, SWOT, 10-10-10, etc.)
- LiLa suggestion — LiLa analyzes the decision context and suggests appropriate frameworks
- User selection — Alternatively, user picks a framework directly
- Guided flow — Step-by-step framework walkthrough with LiLa facilitation
- Coin flip insight — After framework analysis, optional "coin flip" moment to reveal gut feeling

### Mediator
- 8 context modes — Including "Full Picture" mode that provides comprehensive relationship mediation
- Supersedes PRD-19 — Replaces relationship_mediation from PRD-19 with expanded mediator tool
- Conflict framing — User describes situation; Mediator helps frame perspectives of all parties
- Resolution suggestions — LiLa offers resolution paths considering all parties' needs

### Translator
- Haiku-powered — Single-turn translation using Haiku for fast, cost-effective processing
- 12 presets — Pre-configured translation modes (e.g., "Make it kind", "Make it professional", "Simplify for a child")
- Custom mode — Free-text translation instruction for scenarios not covered by presets
- Single-turn — Input text → select preset or custom instruction → receive translated output

## Edge Function Work
- `thoughtsift-board` — Orchestrates multiple Sonnet calls (one per persona) for Board of Directors sessions
- `thoughtsift-translate` — Haiku-powered single-turn text translation with preset/custom instructions

## Testing Checklist
- [ ] Board of Directors: select 3-5 personas and receive independent responses
- [ ] Board of Directors: Prayer Seat toggle adds spiritual perspective
- [ ] 3-tier persona library renders with system, community, and custom tiers
- [ ] Custom persona creation saves and is usable in sessions
- [ ] Persona favorites persist across sessions
- [ ] Perspective Shifter: lens chips render and are selectable
- [ ] Perspective Shifter: mid-conversation lens switch reframes response
- [ ] Decision Guide: all 15 frameworks render with guided flow
- [ ] Decision Guide: LiLa suggests appropriate framework from context
- [ ] Decision Guide: coin flip insight functions after framework analysis
- [ ] Mediator: all 8 context modes render correctly
- [ ] Mediator: Full Picture mode provides comprehensive mediation
- [ ] Translator: all 12 presets produce correct translations via Haiku
- [ ] Translator: custom mode accepts free-text instruction
- [ ] Translator: single-turn (no conversation history needed)
- [ ] Each of the 5 tools is a distinct navigable experience
- [ ] RLS restricts session data to owning member

## Definition of Done
- All PRD-34 MVP items checked off
- All 5 ThoughtSift tools independently functional
- Board of Directors multi-persona panel with Sonnet calls working
- Perspective Shifter with mid-conversation lens switching operational
- Decision Guide with all 15 frameworks and coin flip insight
- Mediator with 8 context modes superseding PRD-19 relationship_mediation
- Translator with 12 presets + custom via Haiku
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
