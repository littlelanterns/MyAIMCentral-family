# Phase 3.7 — Wizards & Seeded Templates

## Status: ACTIVE

## Source Material

- **Build plan:** `claude/web-sync/Connector-Build-Plan-2026-04-26.md` §8
- **Composition patterns:** `claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md` §§1.1–1.5, 2.1–2.10
- **Dispatch doc:** `.claude/state/phase3.7-orchestrator-dispatch.md`
- **Feature decision file:** `claude/feature-decisions/Phase-3.7-Wizards-Seeded-Templates.md`

### Triage Fold-Ins Read
- NEW-WW — Per-line-item reward picker on opportunity lists (High, Beta=Y) → Worker D
- SCOPE-2.F61 — AttachRevealSection wiring (Medium) → Worker A (partially resolved — component exists, verify gaps)
- SCOPE-3.F14 — Allowance first-period bootstrap (High, Beta=Y, B1a complete) → Worker D graceful handling
- NEW-QQ — "Setup is too hard" discoverability (Medium) → All wizards (wizards ARE the fix)
- SCOPE-2.F62 — Color reveal PRD-24B architecture (Medium, Intentional) → Worker C (document gap, use Build M shape)

### Addenda / Cross-Cutting Material Read
- Composition-Architecture-and-Assembly-Patterns.md — all wizard design conventions (249-255)
- Connector-Build-Plan §§3.7, 4.3, 8.1–8.3, 9, 13 (dispatch)
- specs/studio-seed-templates.md (founder's Studio mental model)

---

## Pre-Build Summary

### What Ships
Three outcome-named wizards + three seeded templates + infrastructure, all composing the Phase 3 connector layer.

**Three Wizards:**
1. **Rewards List Wizard** — "Create a Rewards List" (4 steps)
2. **Repeated Action Chart Wizard** — "Set Up a Progress Chart" (6 steps)
3. **List + Reveal + Assignment Wizard** — Two flavors: "Extra Earning Opportunities" (opportunity, 6 steps) and "Consequence Spinner" (draw, 7 steps)

**Three Seeded Templates:**
1. Potty Chart (pre-fills Repeated Action Chart wizard)
2. Consequence Spinner (pre-fills List+Reveal+Assignment draw flavor)
3. Extra Earning Opportunities (pre-fills List+Reveal+Assignment opportunity flavor)

**Infrastructure:**
- `wizard_templates` table (with community-sharing fields for future)
- `reveal_animation_pools` + pool members tables
- `reveal_animations.tag` column
- `WizardProgressSaver` component (localStorage draft persistence)
- Drafts tab in Studio
- Natural Language Composition entry point on Studio
- TypeScript `GodmotherType` union fix (add 4 missing types)
- DB `recognition_godmother` CHECK restoration

### Existing Infrastructure Verified
- All 13 godmother execute functions exist in SQL (100209-100228)
- `AttachRevealSection` exists at `src/components/reward-reveals/` with inline/library modes
- `SetupWizard` base shell exists at `src/components/studio/wizards/`
- 5 existing wizards in Studio.tsx (StarChart, GetToKnow, RoutineBuilder, MeetingSetup, UniversalList)
- 7 Studio categories including "Setup Wizards" and "Gamification & Rewards"
- `coloring_reveal_library` (32 rows), `reveal_animations` (33 rows) seeded
- Contracts table with all CHECK values, deed_firings dispatch trigger

### Schema Gap Found During Pre-Build
- `recognition_godmother` accidentally dropped from DB CHECK in migration 100228 (was in 100216, overwritten without inclusion). Worker A migration must restore. ✅ Fixed in 100229.

### SCOPE-2.F61 Audit Result (Worker A)
- AttachRevealSection: production-wired, used by 4 components. **Resolved.**
- 4 CSS reveal components: importable from `@/components/gamification`. **Resolved.**
- Remaining gap: `CssRevealRenderer` in `RewardRevealModal.tsx` renders a generic placeholder instead of instantiating actual reveal components. **Folded into Worker C** (tests full reveal pipeline end-to-end).

---

## Worker Breakdown

### Worker A: Schema + Shared Components
**Migration 100229.** Creates wizard_templates, reveal_animation_pools + members, adds reveal_animations.tag, fixes godmother_type CHECK (restore recognition_godmother, add all 13). TypeScript GodmotherType union + ListType union updates. WizardProgressSaver component. Drafts tab in Studio.

### Worker B: Rewards List Wizard
First wizard. Creates `reward_list` list type. 4-step wizard. BulkAddWithAI on items. Convention 249/250/251/252/255 compliant.

### Worker C: Repeated Action Chart Wizard + Potty Chart Template
6-step wizard composing contracts. Star chart + coloring reveal visual config. Milestone rewards via treasure box pools. Potty Chart seeded template.

### Worker D: List + Reveal + Assignment Wizard + Templates + NEW-WW
Two-flavor wizard (opportunity/draw). Per-item reward config (NEW-WW). Consequence Spinner + Extra Earning Opportunities seeded templates. SCOPE-3.F14 graceful handling.

### Worker E: NLC Entry Point + Studio Integration + Testing
Natural Language Composition on Studio. Studio shelf integration. Drafts integration. E2E tests for all 3 wizards + NLC + drafts.

### Dependencies
```
A → B → C (parallel with D) → E
```

---

## Mom-UI Surfaces

| Surface | Shells | New / Modification |
|---|---|---|
| Studio Browse tab — NLC input | Mom | New |
| Studio Browse tab — seeded template cards | Mom | Modification (add 3+3 cards to existing sections) |
| Studio Drafts tab | Mom | New |
| RewardsListWizard (4 steps) | Mom | New |
| RepeatedActionChartWizard (6 steps) | Mom | New |
| ListRevealAssignmentWizard — Opportunity (6 steps) | Mom | New |
| ListRevealAssignmentWizard — Draw (7 steps) | Mom | New |
| Save-as-draft prompt on wizard close | Mom | New |
| Draft resume prompt | Mom | New |
| Allowance not set up inline prompt (Worker D) | Mom | New |

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Studio NLC input | | | | | | |
| Studio Drafts tab | | | | | | |
| Studio seeded cards | | | | | | |
| RewardsListWizard | | | | | | |
| RepeatedActionChartWizard | | | | | | |
| ListRevealAssignmentWizard (Opportunity) | | | | | | |
| ListRevealAssignmentWizard (Draw) | | | | | | |
| Draft save/resume flow | | | | | | |

---

## Conventions to Enforce
- Convention 249: Wizard named by outcome
- Convention 250: Save-and-return + Drafts
- Convention 251: AI assistance at every creation surface
- Convention 252: Bulk-AI-Add on every multi-item surface
- Convention 253: Natural Language Composition entry point
- Convention 255: Friction-first design
- Convention 121: `tsc -b` zero errors after every worker
- Human-in-the-Mix on ALL AI-generated content
