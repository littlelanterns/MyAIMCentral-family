# LiLa Scope Reconnaissance

> Recon report for Phase 3 Triage walkthrough. Goal: clearly separate LiLa-persona core modes from AI Vault tools that happen to use LiLa infrastructure, and audit governance terminology across audit findings and PRD documentation.
>
> **Status:** Recon only — no files modified, no commits. Tenise reviews before classification decisions are acted on.
> **Generated:** 2026-04-21

---

## Section 1 — The `general` mode in `lila_guided_modes`

### Registration

Seeded in [supabase/migrations/00000000000007_lila_ai_system.sql:224](supabase/migrations/00000000000007_lila_ai_system.sql#L224):

```sql
('general', 'Sitting LiLa', 'sonnet', 'resting', NULL, false, NULL, NULL),
```

Updated in [supabase/migrations/00000000000013_lila_schema_remediation.sql:104-109](supabase/migrations/00000000000013_lila_schema_remediation.sql#L104-L109) to populate `opening_messages` and set `sort_order = 0`. `opening_messages` were further tuned in [supabase/migrations/00000000000021_lila_opening_messages.sql](supabase/migrations/00000000000021_lila_opening_messages.sql).

### Full column values

| Column | Value |
|---|---|
| `mode_key` | `general` |
| `display_name` | `Sitting LiLa` |
| `model_tier` | `sonnet` |
| `avatar_key` | `resting` |
| `context_sources` | `{}` (empty) |
| `person_selector` | `false` |
| `available_to_roles` | `{"mom"}` |
| `requires_feature_key` | `NULL` |
| `parent_mode` | `NULL` |
| `system_prompt_key` | `general` |
| `sort_order` | `0` |
| `is_active` | `true` |
| `container_preference` | `default` (drawer) |
| `opening_messages` | `["Hey. What's on your mind?", "Hi there. I'm here whenever you're ready — no rush.", "Hey! Want to think something through, or just need to get something off your chest?"]` |

### System prompt

Defined in [supabase/functions/lila-chat/index.ts:60-61](supabase/functions/lila-chat/index.ts#L60-L61):

```typescript
general: `Mode: General Chat. You can chat about anything. Be attentive for signals that a specialized tool would help.`
```

Shortest prompt of the four core modes. Distinguishing traits: no specialized domain, instructs the model to watch for signals that a dedicated tool would help (implicit hand-off intent).

### UI wiring

`general` is actively wired — it is the **default mode** for the LiLa drawer and the **fallback mode** throughout the app:

- [src/components/lila/LilaDrawer.tsx:145-146](src/components/lila/LilaDrawer.tsx#L145-L146) — drawer creates conversations with `mode: 'general'`.
- [src/components/lila/LilaModeSwitcher.tsx:29-32](src/components/lila/LilaModeSwitcher.tsx#L29-L32) — `general` is in the `DRAWER_MODES` set, described as "Open conversation — talk about anything". Line 79 displays it as "General Chat".
- Modals that fall back to `general` when no specific mode is set: `BoardOfDirectorsModal`, `ToolConversationModal`, `TranslatorModal`, `MeetingConversationView`.
- Conversation history filter in `LilaConversationHistory` (line 73-74) filters by `general` mode.
- Referenced in [src/components/lila/ToolLauncherProvider.tsx:140](src/components/lila/ToolLauncherProvider.tsx#L140), [src/components/shells/MomShell.tsx:251](src/components/shells/MomShell.tsx#L251), [src/components/shells/GuidedShell.tsx:282](src/components/shells/GuidedShell.tsx#L282).

### Git history for seed file

- `5d33ad8` — Phase 08: LiLa Core AI System (PRD-05, PRD-05C) — initial seed
- `cdf0af9` — Phase 08: LiLa Core AI System — full conversation engine, Edge Functions, and infrastructure (migration 13 remediation)

### How `general` differs from `help`, `assist`, `optimizer`

All four are "LiLa-persona core modes" with no matching `vault_items` seed. Differences are prompt scope and entry point:

| Mode | System prompt focus | Primary entry point | Model tier |
|---|---|---|---|
| `general` | Fallback / general chat + tool-hand-off detection | Drawer default + every modal fallback | sonnet |
| `help` | Customer support, troubleshooting, billing | Mom shell "Happy to Help" button | haiku (corrected in migration 13) |
| `assist` | Feature discovery + goal-based setup | Mom shell "Your Guide" button | haiku (corrected in migration 13) |
| `optimizer` | Prompt optimization with family context (PRD-05C) | Vault / Optimizer feature | sonnet |

**Finding:** `general` is not stubbed or orphaned. It is the default drawer experience and the universal fallback across every modal container. Last touched during initial LiLa seed (migration 7) and remediation (migration 13).

---

## Section 2 — Classification of every guided mode

Total seeded rows: **43** across 4 migration files. All rows classified below against the "does a matching `vault_items` seed with `delivery_method = 'native'` and matching `guided_mode_key` exist?" test.

### Classification table

| mode_key | display_name | available_to_roles | system_prompt_key | Matching vault_items seed? | Classification |
|---|---|---|---|---|---|
| `general` | Sitting LiLa | mom | general | No | **(a) LiLa-persona core** |
| `help` | LiLa Help | mom | help | No | **(a) LiLa-persona core** |
| `assist` | LiLa Assist | mom | assist | No | **(a) LiLa-persona core** |
| `optimizer` | LiLa Optimizer | mom | optimizer | No | **(a) LiLa-persona core** |
| `quality_time` | Quality Time | mom, dad_adults | quality_time | **Yes** ([100043](supabase/migrations/00000000100043_seed_love_language_vault_items.sql)) | **(b) AI Vault tool** |
| `gifts` | Gifts | mom, dad_adults | gifts | **Yes** (100043) | **(b) AI Vault tool** |
| `observe_serve` | Observe & Serve | mom, dad_adults | observe_serve | **Yes** (100043) | **(b) AI Vault tool** |
| `words_affirmation` | Words of Affirmation | mom, dad_adults | words_affirmation | **Yes** (100043) | **(b) AI Vault tool** |
| `gratitude` | Gratitude | mom, dad_adults | gratitude | **Yes** (100043) | **(b) AI Vault tool** |
| `cyrano` | Cyrano | mom, dad_adults | cyrano | **Yes** ([100057](supabase/migrations/00000000100057_seed_communication_tools_vault.sql)) | **(b) AI Vault tool** |
| `higgins_say` | What to Say | mom, dad_adults | higgins_say | **Yes** (100057) | **(b) AI Vault tool** |
| `higgins_navigate` | How to Navigate | mom, dad_adults | higgins_navigate | **Yes** (100057) | **(b) AI Vault tool** |
| `board_of_directors` | Board of Directors | mom, dad_adults | board_of_directors | **Yes** ([100049](supabase/migrations/00000000100049_prd34_thoughtsift_tables.sql)) | **(b) AI Vault tool** |
| `perspective_shifter` | Perspective Shifter | mom, dad_adults | perspective_shifter | **Yes** (100049) | **(b) AI Vault tool** |
| `decision_guide` | Decision Guide | mom, dad_adults | decision_guide | **Yes** (100049) | **(b) AI Vault tool** |
| `mediator` | Mediator | mom, dad_adults | mediator | **Yes** (100049) | **(b) AI Vault tool** |
| `translator` | Translator | mom, dad_adults, independent_teens | translator | **Yes** (100049) | **(b) AI Vault tool** |
| `craft_with_lila` | Craft with LiLa | mom | craft_with_lila | No | **(a) LiLa-persona core** |
| `self_discovery` | Self-Discovery | mom | self_discovery | No | **(a) LiLa-persona core** |
| `life_lantern` | LifeLantern | mom, dad_adults, independent_teens | life_lantern | No | **(a) LiLa-persona core** |
| `family_vision_quest` | Family Vision Quest | mom, dad_adults | family_vision_quest | No | **(a) LiLa-persona core** |
| `calendar_event_create` | Calendar Intake | mom | calendar_event_create | No | **(a) LiLa-persona core** |
| `meeting` | Meeting Facilitator | mom, dad_adults | meeting | No | **(a) LiLa-persona core** |
| `family_context_interview` | Family Context | mom | family_context_interview | No | **(a) LiLa-persona core** |
| `safe_harbor` | Safe Harbor | mom, dad_adults, independent_teens | safe_harbor | No | **(a) LiLa-persona core** |
| `safe_harbor_guided` | Help Me Talk to Someone | guided_kids | safe_harbor_guided | No | **(a) LiLa-persona core** |
| `safe_harbor_orientation` | Safe Harbor Orientation | mom | safe_harbor | No | **(a) LiLa-persona core** |
| `safe_harbor_literacy` | AI Literacy Module | independent_teens | safe_harbor | No | **(a) LiLa-persona core** |
| `bigplans_planning` | BigPlans | mom | bigplans_planning | No | **(a) LiLa-persona core** |
| `bigplans_friction_finder` | Friction Finder | mom | bigplans_friction_finder | No | **(a) LiLa-persona core** |
| `bigplans_checkin` | Check In | mom | bigplans_checkin | No | **(a) LiLa-persona core** |
| `bigplans_system_design_trial` | System Design Trial | mom | bigplans_system_design_trial | No | **(a) LiLa-persona core** |
| `bigplans_deployed_component` | Deployed Support | mom | bigplans_deployed_component | No | **(a) LiLa-persona core** |
| `book_discussion` | Book Discussion | mom, dad_adults, independent_teens | book_discuss | No | **(a) LiLa-persona core** |
| `book_discuss` | Discuss This Book | mom, dad_adults, independent_teens | book_discuss | No | **(a) LiLa-persona core** (alternate key, migration artifact) |
| `library_ask` | Ask Your Library | mom, dad_adults, independent_teens | library_ask | No | **(a) LiLa-persona core** |
| `homeschool_report_generation` | Report Generation | mom, dad_adults | homeschool_report_generation | No | **(a) LiLa-persona core** |
| `homeschool_time_review` | Homework Time Review | mom, dad_adults | homeschool_time_review | No | **(a) LiLa-persona core** |
| `homeschool_bulk_summary` | Bulk Summary | mom, dad_adults | homeschool_bulk_summary | No | **(a) LiLa-persona core** |
| `guided_homework_help` | Homework Help | guided_kids | guided_homework_help | No | **(a) LiLa-persona core** |
| `guided_communication_coach` | Talk It Out | guided_kids | guided_communication_coach | No | **(a) LiLa-persona core** |

### Summary

- **Class (a) LiLa-persona core modes:** 31 rows. No matching `vault_items` seed. These are LiLa speaking with her named voice across different conversation contexts. Includes the 4 canonical cores (general/help/assist/optimizer) and 27 feature-embedded modes (BigPlans planning, Safe Harbor, bookshelf discussion, homeschool report gen, etc.).
- **Class (b) AI Vault tools:** 12 rows. Each has exactly one matching `vault_items` seed with `delivery_method = 'native'` and matching `guided_mode_key`. Covers all 5 Love Languages, both Higgins tools, Cyrano, and all 5 ThoughtSift tools.

### Ambiguous cases flagged

1. **`book_discuss` vs. `book_discussion`** — both exist (migrations 7 and 100059 respectively). Both classified as (a). Likely a migration artifact; worth asking whether one should be retired.
2. **`task_breaker`** — **a `vault_items` seed exists** ([migration 100132](supabase/migrations/00000000100132_seed_task_breaker_vault.sql)) but **no matching `lila_guided_modes` row**. The Vault item references `guided_mode_key: 'task_breaker'` that isn't registered. Either (a) the mode registration was skipped and is a bug, or (b) task_breaker is delivered through a non-guided-mode code path (has its own dedicated Edge Function `task-breaker`). Noted in [src/components/lila/LilaModeSwitcher.tsx:31](src/components/lila/LilaModeSwitcher.tsx#L31) as part of `DRAWER_MODES` and `BUILT_MODES`, suggesting the intent existed. **Flag for founder.**
3. **Safe Harbor sub-modes** (`safe_harbor_orientation`, `safe_harbor_literacy`, `safe_harbor_guided`) share the same `system_prompt_key` as their parent (`safe_harbor` / `safe_harbor_guided`), with mode-specific behavior driven by other fields. Classification (a) is correct, but the prompt-key collapse may cause confusion in audit findings about "Safe Harbor ethics" scope.

---

## Section 3 — Quick Actions surface

### Where Quick Actions are defined

**Component:** [src/components/shells/QuickTasks.tsx](src/components/shells/QuickTasks.tsx) (PRD-04 QuickTasks strip).

**Data structure:** a TypeScript `QuickAction` interface ([QuickTasks.tsx:44-56](src/components/shells/QuickTasks.tsx#L44-L56)) with a `kind` discriminant: `'path' | 'notepad' | 'tool' | 'submenu' | 'task_breaker'`.

### Data source

**Hardcoded TypeScript array**, not derived from any database table. The `QUICK_ACTIONS` array ([QuickTasks.tsx:60-170](src/components/shells/QuickTasks.tsx#L60-L170)) is the single source of truth for what appears in the strip.

The component does NOT currently read from:

- `lila_tool_permissions` table (0 rows in live schema — scaffolded, not populated)
- `vault_items` table (browse catalog)
- `lila_guided_modes` table (though it references specific mode keys)
- Any user-level customization store

At launch time, the `openTool(modeKey)` call routes through [src/components/lila/ToolLauncherProvider.tsx:140](src/components/lila/ToolLauncherProvider.tsx#L140), which is where permission checks against `lila_tool_permissions` would kick in — but no dynamic additions to the strip happen.

### Current Quick Actions (as hardcoded)

**Navigation pills (`kind: 'path'`):** Journal, Calendar, plus others.
**Communication tool group (`kind: 'submenu'` / `'tool'`):** Love Languages (5 sub-tools), Cyrano, Higgins (2 sub-tools).
**ThoughtSift group (`kind: 'submenu'`):** Board of Directors, Perspective Shifter, Decision Guide, Mediator, Translator.
**Task Breaker (`kind: 'task_breaker'`):** standalone modal launcher.

Every entry in the communication / ThoughtSift sections corresponds to a Class (b) AI Vault tool from Section 2.

### Documentation grep — "Quick Action" / "QuickAction"

- [CLAUDE.md:416-418](CLAUDE.md#L416-L418) (Convention 49): defines QuickTasks strip, lists default items, describes collapse-to-localStorage behavior.
- [prds/foundation/PRD-04-Shell-Routing-Layouts.md:208-225](prds/foundation/PRD-04-Shell-Routing-Layouts.md#L208-L225): authoritative QuickTasks strip definition.
- [prds/personal-growth/PRD-10-Widgets-Trackers-Dashboard-Layout.md:230](prds/personal-growth/PRD-10-Widgets-Trackers-Dashboard-Layout.md#L230): **different** surface — "Quick Action widgets" on the dashboard (not the strip).
- [prds/ai-vault/PRD-21-Communication-Relationship-Tools.md:56-72](prds/ai-vault/PRD-21-Communication-Relationship-Tools.md#L56-L72): explicit table showing Love Languages / Cyrano / Higgins grouped into the QuickTasks strip with "Shell visibility follows `lila_tool_permissions` (PRD-05)".

**Terminology is overloaded.** Three distinct concepts use variations of "Quick Action" / "QuickTasks":

1. **QuickTasks strip** (PRD-04) — the horizontal pill row above the page content. Source: hardcoded array in `QuickTasks.tsx`.
2. **Quick Action widgets** (PRD-10) — dashboard widgets with `category = 'quick_action_tracker'`. Source: `widget_templates` + `dashboard_widgets` tables.
3. **Communication tools in the QuickTasks strip** (PRD-21) — called "tools" or "guided modes" in PRD-21, but physically live as entries in the QuickTasks strip.

### How a tool becomes a QuickTask

**Designed flow** (per PRD-21 + PRD-21A):

1. Admin seeds a `vault_items` row (`content_type='ai_tool'`, `delivery_method='native'`, `guided_mode_key='xyz'`).
2. Mom browses AI Vault → taps "+Add to AI Toolbox" on a tool.
3. Record written to `lila_tool_permissions` (`member_id`, `mode_key`, `is_enabled`, `source='vault'`, `vault_item_id`).
4. Tool then appears (a) in the AI Toolbox sidebar section, and (b) in the QuickTasks strip if `delivery_method='native'`.
5. `ToolLauncherProvider.openTool()` checks permissions at launch time.

**Actual current state:**

- `vault_items` seeds exist for 12 of 12 Class (b) tools.
- `lila_tool_permissions` table: **0 rows**. The "+Add to AI Toolbox" UI flow is not yet built (PRD-21A is partly stubbed).
- The QuickTasks strip currently shows the 8 hardcoded default tools (Love Languages group, Cyrano, Higgins, ThoughtSift group) regardless of `lila_tool_permissions` state.
- Shell visibility is gated by `ALLOWED_SHELLS` (hardcoded in the component), not by permissions table.

**Meaning:** Today, "becoming a Quick Action" is a compile-time decision (edit `QuickTasks.tsx`). The dynamic permission-driven flow is scaffolded but not wired.

### Is there a doc that explicitly labels Quick Actions as "AI Vault tool launchers"?

**No.** The docs treat them as separate concepts that happen to coexist in the same strip:

- PRD-04 defines the strip as a navigation/feature-shortcut surface.
- PRD-21 describes specific tools that appear in the strip as "Entry Points → QuickTasks Strip."
- No PRD or convention says "Quick Actions are the runtime render of AI Vault native tools" (even though operationally, the tool entries are that).

---

## Section 4 — Governance terminology mapping in audit findings

### Files searched

- [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md) (repo root)
- [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md) (repo root, 153 rows)
- [audit/AUDIT_FINDINGS.md](audit/AUDIT_FINDINGS.md)
- Scoped per-scope evidence files under [audit-logs/](audit-logs/)

### Findings touching governance / ethics / safety terminology (9 total)

#### SCOPE-8a.F3 — PRD-20 + PRD-30 + PRD-41 safety infrastructure entirely unbuilt

- **Verbatim excerpt:** "PRD-20 Safe Harbor tables and UI unbuilt; PRD-30 Safety Monitoring tables unbuilt; `safety-classify` Edge Function not present; no Layer 1 keyword scanner wired to message-send path; no Layer 2 cron scheduler; `lila_messages.safety_scanned` column is dead weight. PRD-41 LiLa Runtime Ethics Enforcement: not authored per PRD-40 dependency note; no output-validation Edge Function runs AFTER model response; ethics auto-reject categories (force, coercion, manipulation, shame-based control, withholding affection) enforced only in system prompt text."
- **Actual surface:** Platform-wide AI safety infrastructure spanning three PRDs. Affects every LiLa Edge Function (all 31 Class (a) modes + all 12 Class (b) tools).
- **Worksheet classification:** Fix Now, Beta Readiness Y.
- **Terminology match:** **MISLEADING.** Description uses "LiLa Runtime Ethics Enforcement" and "ethics auto-reject categories" as if they are LiLa-persona rules, but they are platform-wide output-validation pipelines that apply uniformly to every AI surface. The auto-reject categories are not LiLa-persona rules — they are system-level content policy.

#### SCOPE-8a.F4 — Translator exempted from code-level crisis detection

- **Verbatim excerpt:** "Every LiLa Edge Function except Translator runs a code-level `detectCrisis` check before response emission; Translator is explicitly exempted in the shared helper and relies only on an in-prompt safety clause."
- **Actual surface:** ONE AI Vault tool (Class (b)), specifically the Translator Edge Function.
- **Worksheet classification:** Fix Next Build, Beta Readiness N.
- **Terminology match:** **CORRECT.** Says "LiLa Edge Function except Translator" — accurately identifies a single surface.

#### SCOPE-8a.F5 — Board of Directors content policy has fail-open defects

- **Verbatim excerpt:** "The PRD-34 Board of Directors content policy gate (deity → Prayer Seat; blocked-figure → hard block) is correctly wired when Haiku is reachable and returns valid JSON. Two failure-mode defects undermine the guardrail: (a) Haiku classifier errors default to `approved` (fail-open)... (b) the `create_persona` action on the Edge Function does not re-invoke the content policy check server-side..."
- **Actual surface:** ONE AI Vault tool (Class (b)) — Board of Directors. Specifically the `lila-board-of-directors` Edge Function and two client-UI sites.
- **Worksheet classification:** Fix Now (+compound), Beta Readiness Y.
- **Terminology match:** **CORRECT BUT NARROW.** The deity-block / Prayer Seat rule is Board-of-Directors-specific in PRD-34. The audit treats it as such. However: the terminology raises a question about whether the same content-policy gate applies to other persona-generation surfaces (currently there are none, but this is a governance gap worth documenting).

#### SCOPE-4.F4 — Board of Directors persona cache is wrong at the platform-policy layer

- **Verbatim excerpt:** "Platform personas (shared cache) must only contain personas that Tenise / the platform team has specifically approved for reuse; personal-custom personas (e.g., 'Grandma Rose') must NEVER enter the shared cache — they stay scoped to the family that created them and are invisible to other families entirely, not just filtered out at lookup time. Current implementation is wrong on all three tiers: cache-lookup doesn't scope by `is_public` or `family_id`; content-policy gate conflates 'safe to generate' with 'safe to share across families'; no platform-approval queue exists."
- **Actual surface:** Board of Directors specifically — `board_personas` table + `lila-board-of-directors` Edge Function. But the finding exposes a **platform-level governance gap** (no platform-approval queue for cross-family persona promotion).
- **Worksheet classification:** Intentional-Update-Doc (per worksheet) / Fix Code (per audit report body) — conflict noted.
- **Terminology match:** **PARTIALLY MISLEADING.** Calls the issue "content-policy gate" but the real problem is **system governance** (who approves personas for cross-family sharing?). Content policy (safe to generate) and governance policy (safe to share) are conflated.

#### SCOPE-4.F5 — `board_personas.embedding` unwired for alternative-persona substitution

- **Verbatim excerpt:** "The `board_personas.embedding` column was architected so that when a user requests a persona the platform can't generate (e.g., 'Brené Brown' — currently blocked for IP/content-policy reasons), the system uses embedding similarity to suggest approved platform personas who share the requested persona's vibe..."
- **Actual surface:** Board of Directors — one feature (blocked-persona substitution suggestions).
- **Worksheet classification:** Intentional-Update-Doc, Beta Readiness N. Blocked on SCOPE-4.F4.
- **Terminology match:** **CORRECT.** No governance ambiguity.

#### SCOPE-4.F7 — Board of Directors moderator auto-interjection fires by default

- **Verbatim excerpt:** "Per PRD-34 specification the auto-interjection was intentional behavior, but founder direction 2026-04-20 revokes that default — the interjection should be opt-in via a 'Get moderator summary' button that mom taps when she actually wants a round-summary. Default behavior: no auto-fire; moderator silent unless invoked."
- **Actual surface:** Board of Directors — moderator interjection behavior within that one tool.
- **Worksheet classification:** Intentional-Update-Doc.
- **Terminology match:** **CORRECT.** Isolated to the tool.

#### SCOPE-4.F8 — Decision Guide + Board of Directors bypass shared 3-layer context assembler

- **Verbatim excerpt:** "Both Decision Guide and Board of Directors bypass the shared 3-layer context assembler. Both miss: Layer 1 roster (current-user tagging), name-detection + topic-matching relevance filtering, P9 per-turn refresh via sliding 4-message window, `is_privacy_filtered` hard-constraint guard."
- **Actual surface:** Two AI Vault tools (Class (b)) — Decision Guide + Board of Directors. Architectural consistency issue, not a governance issue per se. BUT: `is_privacy_filtered` is a privacy hard-constraint (Convention 76 / PRD-13) — bypassing it IS a governance defect.
- **Worksheet classification:** Intentional-Update-Doc, Beta Readiness N.
- **Terminology match:** **SUBTLY MISLEADING.** Framed as "context-assembler bypass" (architectural) but the `is_privacy_filtered` bypass is a privacy-governance violation that should surface more prominently.

#### SCOPE-8b.F12 — PRD-15 messaging safety semantics enforced client-side only

- **Verbatim excerpt:** "Client-side-only safety semantics means a motivated teen, a misconfigured browser, or any direct-API actor can bypass four separate safety mechanisms that are described in PRD-15 addendum and CLAUDE.md as enforced safeguards. Four sub-surfaces: (1) coaching activity log is fictional... (2) per-pair `member_messaging_permissions` enforced client-side only; (3) safety alert Do Not Disturb bypass absent; (4) Content Corner lock enforced client-side only."
- **Actual surface:** Messaging system (PRD-15) — NOT a LiLa surface at all.
- **Worksheet classification:** Fix Next Build, Beta Readiness Y.
- **Terminology match:** **CORRECT.** The word "LiLa" does not appear in this finding, because it genuinely is not a LiLa issue. Included here because it matches "AI safety" / messaging safety terms.

### Summary statistics

| Metric | Count |
|---|---|
| Total findings touching governance / ethics / safety | 9 |
| Findings about Board of Directors specifically | 5 (SCOPE-8a.F5, SCOPE-4.F4, SCOPE-4.F5, SCOPE-4.F7, SCOPE-4.F8 partial) |
| Findings about platform-wide AI infrastructure | 2 (SCOPE-8a.F3, SCOPE-8b.F12) |
| Findings correctly scoped to a single LiLa Edge Function | 1 (SCOPE-8a.F4) |
| Findings with "ethics" / "governance" in the title | 0 |
| Findings mentioning auto-reject categories (force/coercion/etc.) | 1 (SCOPE-8a.F3, in description only) |
| Findings mentioning deity-block / Prayer Seat | 1 (SCOPE-8a.F5, in description only) |
| Findings with misleading terminology | 3 (SCOPE-8a.F3, SCOPE-4.F4, SCOPE-4.F8) |

### Cross-cutting governance terminology issues

1. **"LiLa ethics" is used as a catch-all for three different things:** platform-wide output validation (PRD-41), persona-character rules (how LiLa speaks), and per-surface content policy (Board of Directors deity block). The audit does not separate them.
2. **"Auto-reject categories" are not indexed or tagged.** A reader cannot search the worksheet for "shame-based control enforcement" and find which findings relate. Only one finding (SCOPE-8a.F3) mentions them, and only in description prose.
3. **Deity-block / Prayer Seat is Board-of-Directors-specific** but the terminology could read as platform-wide. No PRD or convention documents the scope limit.
4. **`is_privacy_filtered` hard-constraint bypass** (SCOPE-4.F8) is filed as an architectural issue, but it's a privacy-governance violation. Severity labeling may understate the issue.

---

## Section 5 — Naming consistency for "LiLa"

### Definitions found

#### CLAUDE.md

- Line 5-6: *"The AI assistant LiLa (Little Lanterns) is a context-aware family AI that assembles knowledge about each family member to make every interaction specific to this family, not generic advice."*
- Line 22: *"Family context is the differentiator: Without context, LiLa is just another chatbot. With it, she's a partner who knows this specific family."*
- Line 35: *"The AI assistant is named **LiLa** (Little Lanterns). LiLa is a processing partner, never a friend, therapist, or companion."*

#### [prds/personal-growth/PRD-05-LiLa-Core-AI-System.md](prds/personal-growth/PRD-05-LiLa-Core-AI-System.md)

- Line 21: *"LiLa (short for 'Little Lanterns,' from the company name Three Little Lanterns) is the intelligent assistant system at the heart of MyAIM Family. The avatar character is LiLa Crew... She is not one monolithic AI but a family of specialized versions — each with a distinct personality, avatar, and purpose — unified by a shared conversation engine, context assembly pipeline, and guided mode registry."*
- Line 23: *"LiLa's superpower is family context."*

#### PRD-05C (LiLa Optimizer)

- Frames the Optimizer as one of the "four LiLa avatars" — a personality variant of the unified LiLa system. Line 29: *"strictly for prompt optimization and conversation flow crafting, not general chat."*

#### [prds/ai-vault/PRD-21A-AI-Vault-Browse-Content-Delivery.md](prds/ai-vault/PRD-21A-AI-Vault-Browse-Content-Delivery.md)

- Line 159: *"If `delivery_method = 'native'` (LiLa-powered): opens a LiLa conversation modal in the tool's registered guided mode."*
- Line 285: *"`lila_tool_permissions` records with `source = 'vault'`, `vault_item_id`"*
- **Framing:** LiLa presented as infrastructure/integration point. Native tools "use LiLa."

#### [prds/platform-complete/PRD-30-Safety-Monitoring.md](prds/platform-complete/PRD-30-Safety-Monitoring.md)

- Line 17: *"While PRD-05 defines LiLa's real-time crisis override... PRD-30 owns the behind-the-scenes detection pipeline that scans LiLa conversations for concerning patterns."*
- Line 49: *"PRD-05 (LiLa Core) | Conversation engine, global crisis override, model routing, system prompts | PRD-30 hooks into the message pipeline after each LiLa response to run detection."*
- **Framing:** LiLa as "the conversation engine" — foundational system.

#### [prds/platform-complete/PRD-34-ThoughtSift-Decision-Thinking-Tools.md](prds/platform-complete/PRD-34-ThoughtSift-Decision-Thinking-Tools.md)

- Line 17: *"ThoughtSift is a suite of five AI-powered thinking tools... Each tool is a distinct LiLa guided conversation mode, accessed through the AI Vault and assignable to family members via the AI Toolbox."*
- **Framing:** ThoughtSift tools ARE LiLa guided modes — architecturally part of LiLa, surfaced through Vault.

#### [reference/AIMfM_Faith_Ethics_Framework_Complete.md](reference/AIMfM_Faith_Ethics_Framework_Complete.md)

- Line 122: *"**LiLa is a 'Processing Partner' not 'Emotional Companion'** — Can help users think through problems conversationally, Redirects to human connection when appropriate..."*
- **Framing:** LiLa as a unified behavioral entity. Does NOT distinguish between avatars or modes — the rules apply to "LiLa" as a whole.

### Consistency analysis

| Document | LiLa framing | Consistent with PRD-05 definition? |
|---|---|---|
| CLAUDE.md | Processing partner, family-context AI | Yes |
| PRD-05 | Unified system with four avatars + guided-mode registry | Yes (authoritative) |
| PRD-05C | Specialized avatar within PRD-05 framework | Yes |
| PRD-21A | LiLa-powered tools / native delivery | **Ambiguous** — reads as if LiLa is infrastructure separate from the tools |
| PRD-30 | Core conversation engine being monitored | Yes |
| PRD-34 | LiLa guided conversation modes | Yes (correct) but terminology wobbles between "tools" and "modes" |
| Faith Ethics Framework | Unified behavioral entity with singular voice | Yes, but does not acknowledge per-mode variance |

### CLAUDE.md convention check

**Searched for a convention that explicitly defines LiLa scope — what counts as "LiLa" vs. "an AI Vault tool that uses LiLa infrastructure."**

**Result: NO SUCH CONVENTION EXISTS.**

Closest conventions:

- Convention 55 (HumanInTheMix Regenerate/Reject) — applies to all LiLa outputs
- Convention 56 (Help/Assist pattern matching) — talks about `lila_messages`
- Convention 88 ("+Add to AI Toolbox") — defines vault tool permission writes; says only `ai_tool` and `skill` content types can be added to Toolbox
- Convention 89 (Delivery methods for AI tools) — native / embedded / link_out
- Convention 230 (Meeting facilitation) — says meetings reuse "existing `lila-chat`" Edge Function

**Missing:** a convention that says something like:

> *"LiLa is the unified conversation engine + family-context-aware personality system. LiLa includes all modes registered in `lila_guided_modes`. The four core avatars (Help, Assist, Optimizer, General) are LiLa's 'named voice.' Additional guided modes (ThoughtSift, Meeting Facilitation, etc.) are ALSO LiLa — they use the same engine and context pipeline. AI Vault tools with `delivery_method='native'` are LiLa guided modes surfaced through Vault discovery. AI Vault tools with `delivery_method='embedded'` or `'link_out'` are NOT LiLa — they are external integrations."*

### Biggest inconsistencies (summary bullets)

- **"Tool" vs. "Mode" drift:** PRD-34 calls ThoughtSift entries "tools" in the title and "guided modes" in the body. PRD-21A calls them "AI tools assignable via AI Toolbox." A fresh reader could reasonably conclude ThoughtSift is external-to-LiLa, when architecturally it IS LiLa (all five tools are rows in `lila_guided_modes`).
- **"LiLa-powered" framing in PRD-21A** implies LiLa is infrastructure that tools plug into. Accurate from an implementation angle but obscures that native-delivery tools ARE LiLa.
- **Faith Ethics Framework assumes a singular LiLa voice** but 43 guided modes have distinct system prompts. Most inherit the framework rules by default; a specific audit may be needed to confirm every mode's prompt embeds the core behavioral guardrails (processing partner, not companion, bridge to human connection, etc.).
- **No convention draws the scope line.** Any future audit finding that uses the phrase "LiLa ethics" can mean any of: (a) platform-wide AI ethics, (b) persona-character rules, (c) per-mode content policy, (d) runtime output validation. Reviewers have to infer from context each time.
- **Auto-reject categories** (force, coercion, manipulation, shame-based control, withholding affection) appear in the Faith Ethics Framework as platform-wide rules, but SCOPE-8a.F3 says they're enforced only in system-prompt text — meaning different modes might (or might not) include them depending on how the prompt key was authored. No index maps which modes include which guardrails.

---

## Recommended questions for founder

Ambiguities hit during recon that should be clarified before classifying audit findings:

1. **Task Breaker mode registration.** A `vault_items` seed exists for `task_breaker` ([migration 100132](supabase/migrations/00000000100132_seed_task_breaker_vault.sql)) but no matching `lila_guided_modes` row. `task_breaker` has its own dedicated Edge Function. Is this intentional (task-breaker is not meant to be a guided mode) or a gap (should it be registered for consistency with the other native tools)? If intentional, should a convention document that native-delivery Vault tools don't always need `lila_guided_modes` rows?

2. **Deity-block / Prayer Seat scope.** SCOPE-8a.F5 treats the deity-detection + Prayer Seat redirect as Board-of-Directors-specific. Is that correct, or should the same content-policy gate apply to any future persona-generation surface (e.g., if a later feature also generates AI personas)? If Board-of-Directors-only, where should that scope limit be documented?

3. **Auto-reject categories scope.** SCOPE-8a.F3 says the five auto-reject categories (force, coercion, manipulation, shame-based control, withholding affection) are "enforced only in system prompt text." Are they intended as (a) platform-wide output-validation rules that should run AFTER every model response (PRD-41 scope), (b) per-mode system-prompt guardrails that each mode author embeds, or (c) both? Current audit phrasing conflates them.

4. **Shared cache governance policy.** SCOPE-4.F4 reveals there is no platform-approval queue for promoting personal personas to the shared `board_personas` cache. Founder direction 2026-04-20 said Tenise / platform team approves. Should this land as a new CLAUDE.md convention (e.g., Convention 99), as a section in PRD-32 Admin Console, or both?

5. **`book_discuss` vs. `book_discussion` mode duplication.** Both exist in the registry with the same `parent_mode='bookshelf'` and same `system_prompt_key='book_discuss'`. Migration artifact worth cleaning up, or intentional?

6. **Faith Ethics guardrail coverage.** The Faith Ethics Framework treats LiLa as a singular behavioral entity, but 43 guided modes have distinct system prompts. Should every mode's system prompt be audited to confirm the core guardrails (processing partner / bridge-to-human / auto-reject categories / crisis override / faith context handling) are embedded? If so, that's a new audit scope worth commissioning.

7. **LiLa scope convention.** Section 5 recommends adding a master convention to CLAUDE.md that explicitly defines LiLa's scope (unified engine + all registered guided modes = LiLa; embedded/link-out Vault tools ≠ LiLa). Worth landing before Phase 3 classification so every finding has unambiguous terminology to hang on?

8. **Severity labeling for privacy-governance bypasses.** SCOPE-4.F8 is Severity Low / Intentional-Update-Doc. But it includes an `is_privacy_filtered` bypass, which is a Convention 76 / PRD-13 privacy hard-constraint violation. Should this finding be re-severitized, or split into two findings (one architectural consistency, one privacy governance)?
