# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.

## Status: ACTIVE — PRD-21 Communication & Relationship Tools

---

### PRD Source Material Read
- `prds/ai-vault/PRD-21-Communication-Relationship-Tools.md` — FULL READ (956 lines)
- `prds/addenda/PRD-21-Cross-PRD-Impact-Addendum.md` — FULL READ
- `prds/addenda/PRD-Audit-Readiness-Addendum.md` — checked for PRD-21 impacts
- `Additional Docs/communication_tools_condensed_intelligence.md` — FULL READ (198 items, 27 books)
- `Additional Docs/innerworkings_condensed_intelligence.md` — checked for love language / relationship detection sections

### Feature Decision File
`claude/feature-decisions/PRD-21-Communication-Relationship-Tools.md`

---

### Pre-Build Summary

**What is being built:** 8 AI-powered communication coaching tools, each a LiLa guided mode opening in a dedicated conversation modal. Five Love Language tools (Quality Time, Gifts, Observe & Serve, Words of Affirmation, Gratitude) + Cyrano (spouse-only) + Higgins Say (any relationship) + Higgins Navigate (relational processing). Backed by 198 distilled intelligence items from 27 books.

**Sub-phase recommendation:** Build in ONE phase. The infrastructure is mature — LilaModal, conversation engine, context assembly, HumanInTheMix, streaming all exist. All 8 guided modes are already registered in the DB. The new work is: 2 tables + 2 guard tables, extend LilaModal with person pills + action chips, add AI Toolbox sidebar section + QuickTasks buttons, write 8 system prompts, create 8 Edge Functions with shared context loader.

**Database changes:**
1. Create `communication_drafts` table (Cyrano + Higgins Say draft storage)
2. Create `teaching_skill_history` table (skill rotation tracking)
3. Create `private_notes` table (PRD-19 guard — mom's private notes)
4. Create `relationship_notes` table (PRD-19 guard — relationship-scoped notes)
5. Add `is_negative_preference` column to `archive_context_items` (veto memory)
6. Add `display_name_aliases` column to `archive_member_settings` (name resolution)
7. Verify all 8 guided mode registrations have `container_preference: 'modal'` — add column to `lila_guided_modes` if missing

**UI changes:**
1. Extend `LilaModal` → `ToolConversationModal` with person pill selector header + tool-specific action chips
2. New `PersonPillSelector` component (single/multi-select, name auto-detection)
3. New AI Toolbox sidebar section in `Sidebar.tsx` (Mom/Adult/Independent shells)
4. New QuickTasks buttons: Love Languages (popover), Cyrano (direct), Higgins (mode picker)
5. `LoveLanguagesPopover` — 5-tool picker popover/bottom-sheet
6. `HigginsModePickerPopover` — Say / Navigate picker
7. Action chip implementations for each tool (Save Draft, Copy Draft, Send via Message, Create Task, Save to Journal, Record Victory, Add to Wishlist/Gift Ideas)

**Edge Functions (8 new, 1 shared helper):**
1. `lila-quality-time` — Activity suggestions with connection prompts
2. `lila-gifts` — Gift ideas with wishlist integration
3. `lila-observe-serve` — Hidden need detection and service suggestions
4. `lila-words-affirmation` — NVC-formula evidence-based affirmations
5. `lila-gratitude` — Gratitude practice (person-focused or general)
6. `lila-cyrano` — Spouse message crafting with teaching skills
7. `lila-higgins-say` — Any-relationship message crafting with voice adaptation
8. `lila-higgins-navigate` — 5-phase relational processing flow
9. `_shared/loadRelationshipContext.ts` — Shared context loader for all 8 functions

**System prompts powered by condensed intelligence:**
- Cyrano: 11 teaching skills (specificity, partner_lens, invitation_language, callback_power, their_world_first, unsaid_need_surfacing, presence_proof, feeling_over_function, decode_the_fear, tone_and_delivery, nvc_appreciation)
- Higgins Say: 9 teaching skills (validation_first, behavior_not_identity, invitation_not_demand, repair_language, boundary_with_warmth, autonomy_ladder, direct_and_kind, describe_not_evaluate, avp_validation)
- Higgins Navigate: Full IROLE listen framework, 4 reflective listening forms, curiosity question library, SODA options process, 3-tier professional referral
- All tools: Relationship detection (7 types), age-stage calibration, special needs layer, cross-tool ethics rules

**What will NOT be built (stubs):**
- AI Vault "+Add to AI Toolbox" (PRD-21A done separately)
- Full message coaching checkpoint integration
- Dedicated per-tool data tables
- Cyrano growth tracking/export
- 21 Compliments Practice
- AI Toolbox drag-to-reorder
- Tool usage analytics

---

*Previous builds:*
*PRD-06, PRD-07, PRD-10A, PRD-13, PRD-21A completed 2026-03-25.*
