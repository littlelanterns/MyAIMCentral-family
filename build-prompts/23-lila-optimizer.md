# Build Prompt 23: LiLa Optimizer

## PRD Reference
- PRD-05C: `prds/personal-growth/PRD-05C-LiLa-Optimizer.md`

## Prerequisites
- Phase 06 (LiLa Core AI System) complete
- Phase 13 (Archives & Context) complete

## Objective
Build the LiLa Optimizer as a prompt enhancement engine that takes user prompts and enriches them with relevant context, improved structure, and platform-specific optimizations. This includes context presets (pre-configured context bundles for common use cases), user prompt templates (reusable prompt structures), BYOK (Bring Your Own Key) support for users who want to use their own API keys, credit tracking for AI usage, the "Edit in Notepad" action that sends optimized prompts to Smart Notepad for further refinement, and the "Review & Route" action chip for directing optimized output to platform destinations.

## Database Work
Create tables:
- `optimizer_outputs` — Records of optimizer runs with input prompt, optimized output, context used, model, token counts
- `user_prompt_templates` — User-created reusable prompt templates with placeholders, categories, sharing settings
- `context_presets` — Pre-configured context bundles (e.g., "Parenting context", "Meal planning context") with included archive items
- `ai_usage_tracking` — Per-member AI credit usage with timestamps, model, token counts, feature source

Enable RLS on all tables. Members manage their own templates and track their own usage; mom can view family-wide usage.

## Component Work
- Optimizer input — Prompt entry with context preset selector and template chooser
- Optimization engine — Takes raw prompt, applies context preset, restructures for clarity and effectiveness
- Optimized output display — Side-by-side or inline view of original vs. optimized prompt with diff highlights
- Context preset manager — Create, edit, browse context presets with archive item selection
- User prompt template CRUD — Create, edit, categorize, share prompt templates with placeholder variables
- BYOK configuration — Settings panel for entering personal API keys (encrypted storage)
- Credit tracking dashboard — View AI credit usage, remaining balance, usage trends
- "Edit in Notepad" action — Sends optimized prompt text to Smart Notepad for further editing
- "Review & Route" action chip — Route optimized output to clipboard, LiLa conversation, journal, or external AI

## Edge Function Work
- `optimize-prompt` — Core optimization function that enriches prompts with context and structural improvements

## Testing Checklist
- [ ] Optimizer takes a raw prompt and produces an enhanced version with relevant context
- [ ] Context presets correctly bundle and apply selected archive items
- [ ] User prompt templates save with placeholders and render correctly on use
- [ ] BYOK keys are stored encrypted and used when configured
- [ ] Credit tracking accurately records token usage per interaction
- [ ] "Edit in Notepad" opens Smart Notepad with optimized prompt content
- [ ] "Review & Route" chip routes output to selected destination

## Definition of Done
- All PRD-05C MVP items checked off
- Prompt optimization producing measurably better outputs
- Context presets and user templates fully functional
- Credit tracking accurate across all AI interactions
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
