# Build Prompt 24: Communication & Relationship Tools

## PRD Reference
- PRD-21: `prds/ai-vault/PRD-21-Communication-Relationship-Tools.md`

## Prerequisites
- Phase 06 (LiLa Core AI System) complete
- Phase 20 (Family Context & Relationships) complete

## Objective
Build the suite of communication and relationship AI tools including five Love Languages tools (one per language), Cyrano (draft composer for meaningful messages), Higgins Say (conversation preparation) and Higgins Navigate (real-time conversation guidance), AI Toolbox integration for discoverability, the Person Pill Selector for choosing who a tool applies to, Skill-Check Mode that activates after 5+ interactions to transition from AI-assisted to independent skill use, the QuickTasks 3-button group for fast tool access, and modal mode switching between tool modes.

## Database Work
Create tables:
- `communication_drafts` — Saved drafts from Cyrano and other composition tools with content, recipient context, status, tool source
- `teaching_skill_history` — Tracks member interactions per communication tool for Skill-Check Mode activation (interaction count, skill assessments, independence scores)

Enable RLS on all tables. Members own their drafts and skill history; mom can view guided children's progress.

## Component Work
- Love Languages tools (5) — One tool per love language (Words of Affirmation, Acts of Service, Receiving Gifts, Quality Time, Physical Touch) with contextual suggestions and practice prompts
- Cyrano — Draft composer for meaningful messages (birthday cards, thank you notes, difficult conversations) with tone/style controls
- Higgins Say — Conversation preparation tool: describe the situation, get suggested talking points, practice responses
- Higgins Navigate — Real-time conversation guidance: during a conversation, get suggested responses, de-escalation strategies, empathy prompts
- Person Pill Selector — Reusable component for selecting which family member or contact a tool applies to, with context auto-loading
- AI Toolbox integration — Register all communication tools in the AI Toolbox page from Phase 20
- Skill-Check Mode — After 5+ interactions with a tool, offer skill assessment; transition to coaching mode that encourages independent application
- QuickTasks 3-button group — Three most-used communication tools as quick-access buttons in the QuickTasks drawer
- Modal mode switching — Within a tool modal, switch between related tool modes (e.g., Higgins Say to Higgins Navigate)

## Edge Function Work
- `communication-tool-assist` — Unified Edge Function handling AI interactions for all communication/relationship tools with tool-specific system prompts

## Testing Checklist
- [ ] All 5 Love Languages tools provide relevant suggestions based on selected person's context
- [ ] Cyrano generates drafts with appropriate tone for the selected relationship and occasion
- [ ] Higgins Say produces useful talking points for described conversation scenarios
- [ ] Higgins Navigate provides real-time response suggestions during active conversations
- [ ] Person Pill Selector loads context from Archives for the selected person
- [ ] Skill-Check Mode activates after 5 interactions and offers skill assessment
- [ ] QuickTasks 3-button group shows most-used tools and launches correctly
- [ ] Modal mode switching transitions smoothly between related tool modes

## Definition of Done
- All PRD-21 MVP items checked off
- All 5 Love Languages tools, Cyrano, Higgins Say, and Higgins Navigate functional
- Skill-Check Mode activation and assessment flow verified
- Person Pill Selector working with context auto-loading
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
