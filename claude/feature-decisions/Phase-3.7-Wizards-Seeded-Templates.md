# Feature Decision File: Phase 3.7 — Wizards & Seeded Templates

> **Created:** 2026-05-04
> **Source:** `claude/web-sync/Connector-Build-Plan-2026-04-26.md` §8
> **Composition patterns:** `claude/web-sync/Composition-Architecture-and-Assembly-Patterns.md`
> **Dispatch:** `.claude/state/phase3.7-orchestrator-dispatch.md`
> **Triage fold-ins:** NEW-WW, SCOPE-2.F61, SCOPE-3.F14, NEW-QQ, SCOPE-2.F62
> **Founder approved:** [pending]

---

## What Is Being Built

Three outcome-named wizards that wrap the Phase 3 connector layer (contracts + deed_firings + godmothers) into friendly guided flows, plus three seeded templates that pre-fill those wizards for common use cases, plus supporting infrastructure (template library, treasure box pools, draft persistence, NLC entry point).

After this ships, mom uses wizards to create potty charts, consequence spinners, and earning opportunity boards — all composing contracts under the hood. She never sees "deeds" or "godmothers" in the UI.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| **RewardsListWizard** | New wizard in `src/components/studio/wizards/`. 4 steps: name → items (BulkAddWithAI) → sharing → review & deploy. Creates `lists` row with `list_type='reward_list'` + `list_items`. |
| **RepeatedActionChartWizard** | New wizard. 6 steps: name → pick action → chart display (star chart + coloring reveal) → milestones & rewards → assign to kid → review & deploy. Creates contracts via connector layer. |
| **ListRevealAssignmentWizard** | New wizard with flavor selection (opportunity / draw). Opportunity: 6 steps. Draw: 7 steps. Creates lists + contracts. |
| **WizardProgressSaver** | New shared component. localStorage persistence for wizard state. Auto-save on step change, restore on mount. |
| **Studio "Drafts" tab** | New third tab in Studio.tsx alongside Browse and My Customized. Shows in-progress wizard skeletons. |
| **Studio NLC entry point** | "Describe what you want to create" text input at top of Studio Browse tab. Haiku parses → opens matching wizard pre-filled. |
| **Studio "Setup Wizards" section updates** | Add 3 seeded template cards (Potty Chart, Consequence Spinner, Extra Earning Opportunities) + 3 "Create Your Own" cards. |
| **Potty Chart template card** | Seeded in Studio. Opens RepeatedActionChartWizard pre-filled. |
| **Consequence Spinner template card** | Seeded in Studio. Opens ListRevealAssignmentWizard (draw flavor) pre-filled. |
| **Extra Earning Opportunities template card** | Seeded in Studio. Opens ListRevealAssignmentWizard (opportunity flavor) pre-filled. |
| **Empty states** | "No rewards lists yet. Create one to use with treasure boxes, spinners, and milestone charts." |
| **Drafts empty state** | "No drafts in progress. Start a wizard from the Browse tab — you can save and come back anytime." |
| **NLC fallback** | "Based on what I'm hearing — [restate] — these wizards might fit. Want to try one?" |

---

## Key Decisions (Easy to Miss)

1. **`reward_list` is a new `ListType`** — must be added to the TypeScript union AND any DB CHECK constraint on `lists.list_type` (if one exists — currently no CHECK, it's application-level).

2. **TypeScript `GodmotherType` is missing 3 types** — `creature_godmother`, `coloring_reveal_godmother`, `widget_data_point_godmother`, `page_unlock_godmother` exist in DB migrations (100225, 100228) but are NOT in `src/types/contracts.ts`. Worker A must add them.

3. **`recognition_godmother` accidentally dropped from DB CHECK** — migration 100228 replaced the CHECK constraint without including `recognition_godmother` (which was added in migration 100216). Worker A's migration must restore it.

4. **Wizards compose contracts, not direct table writes** — The Repeated Action Chart wizard and List+Reveal+Assignment wizard create `contracts` rows that fire godmothers. They don't write to `widget_data_points` or `member_coloring_reveals` directly. The contracts do that.

5. **`reveal_animation_pools` table does NOT exist yet** — Must be created by Worker A. The `reveal_animations` table (33 rows) exists but has no pooling/rotation mechanism.

6. **No draft persistence exists** — All 5 existing wizards are fire-and-forget (state is React useState only). WizardProgressSaver is genuinely new infrastructure.

7. **`AttachRevealSection` already exists in production** — The dispatch doc says to "wire out of /dev/gamification" but the component is already at `src/components/reward-reveals/AttachRevealSection.tsx` and is used by `TaskCreationModal`, `StarChartWizard`, `WidgetConfiguration`, and `RewardRevealLibrary`. SCOPE-2.F61 may be partially resolved. Need to verify what's still missing.

8. **Existing wizard pattern uses `SetupWizard` base shell** — All new wizards should use the same base from `src/components/studio/wizards/SetupWizard.tsx`.

9. **Convention 253: NLC is a first-class entry point** — Not a nice-to-have. The "Describe what you want" input on Studio is a required Convention 253 deliverable.

10. **SCOPE-3.F14 (allowance first-period bootstrap) is partially resolved** — B1a complete, B1b pending. Worker D's opportunity wizard must handle gracefully: if kid has no active allowance period, show inline prompt, don't block deployment.

11. **Seeded templates are NOT migration seeds** — They're TypeScript constants in `src/components/studio/studio-seed-data.ts` that pre-fill wizard fields. The wizards then create real contracts + lists at deploy time.

12. **Person-pick-spin flow for Consequence Spinner** — Two modes: person-first (pick kid, then spin) and draw-first (spin, then assign). Configurable per deployment.

---

## Database Changes Required

### New Tables

**`reveal_animation_pools`**
- `id` UUID PK DEFAULT gen_random_uuid()
- `family_id` UUID FK families(id) — NULL for system pools
- `name` TEXT NOT NULL
- `description` TEXT
- `sharing_mode` TEXT DEFAULT 'family' — ('family' | 'system' | 'community')
- `created_by` UUID FK family_members(id)
- `created_at` TIMESTAMPTZ DEFAULT now()
- `archived_at` TIMESTAMPTZ
- RLS: family-scoped read/write, system pools readable by all

**`reveal_animation_pool_members`**
- `id` UUID PK DEFAULT gen_random_uuid()
- `pool_id` UUID FK reveal_animation_pools(id) ON DELETE CASCADE
- `reveal_animation_id` UUID FK reveal_animations(id) ON DELETE CASCADE
- `weight` INTEGER DEFAULT 1
- `sort_order` INTEGER DEFAULT 0
- `created_at` TIMESTAMPTZ DEFAULT now()
- UNIQUE(pool_id, reveal_animation_id)

**`wizard_templates`**
- `id` UUID PK DEFAULT gen_random_uuid()
- `family_id` UUID FK families(id) — NULL for system templates
- `template_type` TEXT NOT NULL — ('rewards_list' | 'repeated_action_chart' | 'list_reveal_assignment')
- `title` TEXT NOT NULL
- `description` TEXT
- `template_source` TEXT DEFAULT 'system' — ('system' | 'family' | 'community')
- `is_example` BOOLEAN DEFAULT false
- `config` JSONB NOT NULL DEFAULT '{}'
- `cloned_from_template_id` UUID FK wizard_templates(id) — community-sharing prep
- `original_author_id` UUID FK family_members(id) — community-sharing prep
- `tags` JSONB DEFAULT '[]'
- `sharing_mode` TEXT DEFAULT 'family'
- `usage_count` INTEGER DEFAULT 0
- `created_at` TIMESTAMPTZ DEFAULT now()
- `updated_at` TIMESTAMPTZ DEFAULT now()
- `archived_at` TIMESTAMPTZ
- RLS: family-scoped read/write, system templates readable by all

### Modified Tables

**`reveal_animations`** — Add `tag TEXT` column (for categorizing: 'treasure_box', 'spinner', 'scratch', 'card_flip', etc.)

**`contracts.godmother_type` CHECK** — Restore `recognition_godmother` that was accidentally dropped in migration 100228.

### TypeScript Changes

**`src/types/contracts.ts`** — Add to `GodmotherType`:
- `'creature_godmother'`
- `'page_unlock_godmother'`
- `'coloring_reveal_godmother'`
- `'widget_data_point_godmother'`

**`src/types/lists.ts`** — Add `'reward_list'` to `ListType` union.

### Migrations
- `00000000100229_phase_3_7_infrastructure.sql` — wizard_templates, reveal_animation_pools, reveal_animation_pool_members, reveal_animations.tag, fix godmother_type CHECK

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `studio_wizards` | Essential | primary_parent | Access to wizard-based creation flows |
| `studio_drafts` | Essential | primary_parent | Draft persistence and resume |
| `studio_nlc` | Enhanced | primary_parent | Natural Language Composition entry point |

---

## Stubs — Do NOT Build This Phase

- [ ] Community template sharing (fields exist on `wizard_templates` but no sharing UI)
- [ ] LiLa-driven composition (conversational creation through LiLa Assist)
- [ ] Smart Notepad "make this into a real thing" promotion to wizard
- [ ] Sequential/Gradual/Random reveal strategies from PRD-24B (SCOPE-2.F62 — document gap, use Build M shape)
- [ ] Reveal-as-task-presentation (universal presentation wrapper beyond reward delivery)
- [ ] Nested subtask authoring in opportunity wizard items
- [ ] Per-section and per-item rotation memory overrides (list-level only this phase)
- [ ] Phase 3.5 multi-pool allowance integration with wizards
- [ ] Treasure box tier escalation (different reveals at different thresholds — compose via multiple contracts instead)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Wizards | → creates | `contracts` | Contract rows with source/godmother/IF config |
| Wizards | → creates | `lists` + `list_items` | Reward lists, opportunity lists, consequence lists |
| Wizards | → creates | `tasks` | "Used the potty!" action tasks |
| Wizards | → creates | `dashboard_widgets` | Star chart widgets from Repeated Action Chart |
| Wizards | → creates | `member_coloring_reveals` | Via coloring_reveal_godmother contracts |
| Wizards | → reads | `coloring_reveal_library` | Image picker in chart wizard |
| Wizards | → reads | `reveal_animations` | Animation picker in all wizards |
| Wizards | → reads | `widget_starter_configs` | Widget style picker in chart wizard |
| Contracts | → fires | `deed_firings` → godmothers | At runtime when kid completes action |
| NLC | → calls | Haiku via `ai-parse` or new Edge Function | For natural language → wizard field mapping |
| Studio | → renders | Wizard components | Via template cards + customize buttons |

---

## Things That Connect Back to This Feature Later

- Phase 3.5 Multi-Pool Allowance — wizards may need pool assignment UI
- PRD-24A Game Modes — downstream consumer of connector layer
- Community template sharing — wizard_templates ready for it
- LiLa Assist — conversational creation via NLC backend
- PRD-33 Offline/PWA — wizard drafts in localStorage already offline-friendly

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All source material captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> To be completed after build.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
