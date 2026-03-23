# Build Prompt 21: Safe Harbor

## PRD Reference
- PRD-20: `prds/daily-life/PRD-20-Safe-Harbor.md`

## Prerequisites
- Phase 06 (LiLa Core AI System) complete
- Phase 13 (Archives & Context) complete
- Phase 20 (Family Context & Relationships) complete

## Objective
Build Safe Harbor as a protected, confidential conversation space for teens and older children to discuss sensitive topics with LiLa. This includes the Safe Harbor landing page and history view, the three-phase conversation model (Validate, Curiosity, Empower), an orientation module with 6 scenarios teaching appropriate use, a teen AI literacy module, hold harmless acknowledgment, guided child "Help Me Talk to Someone" simplified flow, safety concern protocol with mandatory reporting triggers, the is_safe_harbor flag on conversations for privacy enforcement, and the spousal transparency exemption that keeps Safe Harbor conversations private from the co-parent view.

## Database Work
Create tables:
- `safe_harbor_orientation_completions` — Tracks completion of the 6-scenario orientation module per member
- `safe_harbor_literacy_completions` — Tracks completion of the teen AI literacy module per member
- `safe_harbor_consent_records` — Hold harmless and consent acknowledgments per member with timestamps

Enable RLS on all tables. Safe Harbor data is strictly member-owned; mom sees completion status only, not conversation content.

## Component Work
- Safe Harbor landing page — Introduction, purpose explanation, orientation status, access controls
- Safe Harbor history view — Member's own conversation history (Safe Harbor conversations only)
- Safe Harbor conversation mode — LiLa in Validate/Curiosity/Empower three-phase mode with is_safe_harbor flag
- Orientation module — 6 interactive scenarios teaching when and how to use Safe Harbor appropriately
- Teen AI literacy module — Educational content about AI limitations, appropriate trust levels, critical thinking
- Hold harmless acknowledgment — Consent flow before first Safe Harbor use
- Guided child "Help Me Talk to Someone" — Simplified flow that helps younger children articulate concerns and suggests talking to a trusted adult
- Safety concern protocol — Automatic detection of safety-critical content (self-harm, abuse) with appropriate response and optional escalation
- Spousal transparency exemption — RLS and UI enforcement that Safe Harbor conversations are excluded from co-parent/View As visibility
- is_safe_harbor flag — Conversation-level flag that triggers privacy protections across the platform

## Edge Function Work
- None (Safe Harbor uses existing LiLa conversation engine with modified system prompt and is_safe_harbor flag)

## Testing Checklist
- [ ] Orientation module presents 6 scenarios and tracks completion
- [ ] Teen AI literacy module completes and records status
- [ ] Hold harmless consent must be acknowledged before first Safe Harbor conversation
- [ ] Safe Harbor conversations use Validate/Curiosity/Empower phases
- [ ] is_safe_harbor flag prevents conversation content from appearing in mom's View As
- [ ] Guided child "Help Me Talk to Someone" provides age-appropriate guidance
- [ ] Safety concern protocol triggers on detection of critical keywords/patterns
- [ ] Spousal transparency exemption verified: co-parent cannot access Safe Harbor content

## Definition of Done
- All PRD-20 MVP items checked off
- Safe Harbor privacy protections verified at RLS and UI level
- Orientation and literacy modules fully functional
- Safety concern protocol tested with trigger scenarios
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
