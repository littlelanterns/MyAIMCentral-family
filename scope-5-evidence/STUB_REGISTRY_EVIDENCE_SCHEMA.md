# Scope 5 Evidence — Schema Partition

> Pilot run — 5 packets (calibration + 4 follow-ups).
> Dispatched: 2026-04-19T18:19:01Z
> Recipe: scope-5-evidence/EVIDENCE_RECIPE.md
> Partition: scope-5-evidence/stub_partition_schema.md
> Registry baseline: 547 lines / commit c2e04e3

<!-- PROGRESS MARKER: dispatched, starting pre-flight checks at 2026-04-19T18:19:01Z -->
<!-- PROGRESS MARKER: pre-flight passed (HALT absent, 547 lines), beginning calibration entry -->

---

## Entry 398 — `System list auto-provision (Backburner, Ideas)`

**Registry line:** 398
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| System list auto-provision (Backburner, Ideas) | PRD-09B | — | ⏳ Unwired (MVP) | Phase 10+ |
```

### Field 1 — Implementation identifier (4-level extraction chain)

**(a) Stub entry itself.** Row at line 398: `| System list auto-provision (Backburner, Ideas) | PRD-09B | — | ⏳ Unwired (MVP) | Phase 10+ |`. Row names the capability ("auto-provision") and the two list types (Backburner, Ideas) but does NOT name any concrete DB trigger, function, or table implementing the provisioning. "Created By" column is `—`. No identifier at level (a).

**(b) WIRING_STATUS.md.** Section "System Lists (auto-created per member)" (table, lines 77-79 of WIRING_STATUS.md). Quoted rows:
```
| Backburner | `backburner` | Yes (auto_provision_member_resources trigger) | Notepad, Review & Route | **Wired** |
| Ideas | `ideas` | Yes (auto_provision_member_resources trigger) | Notepad, Review & Route | **Wired** |
```
Source: WIRING_STATUS.md lines 78-79.
Identifier: `auto_provision_member_resources` (trigger function name).
Secondary identifiers from WIRING_STATUS: `list_type = 'backburner'`, `list_type = 'ideas'`.

Chain stops at (b). Levels (c) and (d) NOT REQUIRED but checked opportunistically for cross-reference context (Field 4):
- CLAUDE.md Convention #19 (line 146) names the trigger but describes it as creating "an archive folder + dashboard_config" — does NOT mention Backburner/Ideas list creation.

Primary identifier: `auto_provision_member_resources`.
Secondary identifiers: `list_type = 'backburner'`, `list_type = 'ideas'`.

### Field 2 — Code presence check

**Identifier 1: `auto_provision_member_resources`**
```
Grep command: pattern=`auto_provision_member_resources`, path=`supabase`, output_mode=files_with_matches
Hits: 11 files
Files:
  - supabase/migrations/00000000100115_play_dashboard_sticker_book.sql  (latest revision; line 1378 is CREATE OR REPLACE)
  - supabase/migrations/00000000100114_rhythms_phase_d_teen.sql
  - supabase/migrations/00000000100112_rhythms_phase_c.sql
  - supabase/migrations/00000000100111_rhythms_phase_b_section_cleanup.sql
  - supabase/migrations/00000000100110_rhythms_phase_b.sql
  - supabase/migrations/00000000100106_guided_evening_reflections.sql
  - supabase/migrations/00000000100104_guided_evening_rhythm.sql
  - supabase/migrations/00000000100103_rhythms_foundation.sql
  - supabase/migrations/00000000100101_claim_expiration_cron_and_list_provision.sql  (ORIGINAL Backburner/Ideas introduction)
  - supabase/migrations/00000000100035_prd13_archives_context.sql
  - supabase/migrations/00000000000016_family_setup_remediation.sql
```

First-context window for the Backburner/Ideas branch, migration 100115 lines 1412-1423:
```sql
-- 3. Create Backburner & Ideas lists for non-Guided/Play members
IF NEW.dashboard_mode IS NULL OR NEW.dashboard_mode NOT IN ('guided', 'play') THEN
  IF NOT EXISTS (
    SELECT 1 FROM public.lists
    WHERE family_id = NEW.family_id
      AND owner_id = NEW.id
      AND list_type = 'backburner'
      AND archived_at IS NULL
  ) THEN
    INSERT INTO public.lists (family_id, owner_id, title, list_type)
    VALUES (NEW.family_id, NEW.id, 'Backburner', 'backburner');
  END IF;
```

Original introduction, migration 100101 lines 4 and 56-58 (file header comment + inline section comment):
```
-- PRD-09A\09B Fixes:
--   1. Server-side cron job for task claim lock expiration (hourly)
--   2. Auto-provision Backburner & Ideas lists for new members
...
-- Fix 2: Auto-provision Backburner & Ideas lists for new members
-- Updated auto_provision_member_resources trigger to create
-- system Backburner and Ideas lists for non-Guided/Play members.
```
Migration 100101 also contains a backfill INSERT at lines 119-130 for existing eligible `family_members`.

### Field 3 — Wiring check

**Callers/Importers:** `auto_provision_member_resources` is a SECURITY DEFINER plpgsql function installed in the `public` schema. It is attached to `family_members` via a trigger (not shown in the grep output I ran; the CREATE TRIGGER definitions presumably live in one or more of the 11 migration files, most likely an early migration that was subsequently replaced by CREATE OR REPLACE FUNCTION). No application-layer callers — invocation is DB-triggered on `family_members` INSERT.

**Execution-flow location:** Postgres plpgsql trigger function in migrations only. Migration 100115 is the most recent revision. The function body in migration 100101 was the first to include the Backburner/Ideas branch.

**Most recent touching commit:**
```
git log -1 --format="%h %ai %s" -- supabase/migrations/00000000100115_play_dashboard_sticker_book.sql
1dce4a0 2026-04-08 15:15:01 -0500 feat: Build M Sub-phase B — Play Dashboard shell + icon picker + RLS/data fixes
```
Also relevant — the migration that introduced the Backburner/Ideas branch:
```
git log -1 --format="%h %ai %s" -- supabase/migrations/00000000100101_claim_expiration_cron_and_list_provision.sql
ffae417 2026-04-06 18:05:11 -0500 feat: PRD-09A/09B claim cron + list auto-provision + list victory_mode + 15 E2E tests
```

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Quoted above in Field 1 — "System Lists (auto-created per member)" table (lines 78-79) marks both lists `**Wired**` and explicitly names `auto_provision_member_resources trigger` as the mechanism.

**Cross-PRD addendum mentions:** `Grep pattern=auto_provision_member_resources, path=prds/addenda` → no matches found. No addendum references the trigger by name.

**PlannedExpansionCard / stub UI:** Not applicable — Backburner and Ideas are system lists auto-created at member provision time. No user-facing feature-discovery card is expected or present.

**CLAUDE.md convention mention:** Convention #19 (line 146) names `auto_provision_member_resources` but describes it as creating "an archive folder + dashboard_config for every new `family_members` insert." The convention does NOT mention Backburner/Ideas list creation. Convention #190 (line 412) also references the function name in the context of teen rhythm display names (separate branch of the same function body). So CLAUDE.md names the function but under-documents its actual behavior relative to migration 100115.

### Field 5 — What was NOT checked

- Whether the `auto_provision_member_resources` trigger is currently ENABLED on the production DB. Migration 100115 contains CREATE OR REPLACE FUNCTION but I did not see a CREATE TRIGGER statement in the grep output; the trigger attachment likely lives in an earlier migration not surfaced by the function-name grep. Would need a Supabase SQL query (`SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname ILIKE '%provision%'`) to confirm trigger is live.
- Whether the backfill INSERT in migration 100101 (lines 119-130) actually ran successfully against all pre-existing `family_members` rows on production. Would need a Supabase query comparing `family_members` eligibility to `lists` presence.
- Whether any `family_members` rows currently exist without corresponding Backburner/Ideas list rows despite the backfill (drift detection). Requires live DB access.
- Whether the `lists` table has a UNIQUE constraint preventing duplicate provisioning if the trigger ever fires twice for the same member; the idempotent IF NOT EXISTS guards this at the function level, but a schema-level constraint was not examined.
- Whether CLAUDE.md Convention #19 should be updated to document the Backburner/Ideas/rhythm/archive-member-settings/dashboard_config full trigger behavior — a documentation-hygiene question for founder judgment.

### Field 6 — Observations (no verdict)

STUB_REGISTRY.md line 398 marks this entry `⏳ Unwired (MVP)` with a "Phase 10+" target. WIRING_STATUS.md (lines 78-79) marks both Backburner and Ideas `**Wired**` and attributes the mechanism to `auto_provision_member_resources trigger`. Grep finds the function defined across 11 migration files with CREATE OR REPLACE, most recently in migration 100115 (2026-04-08, commit 1dce4a0). The Backburner/Ideas branch was introduced in migration 100101 (2026-04-06, commit ffae417), which also includes a backfill INSERT for existing eligible members. CLAUDE.md Convention #19 names the trigger but under-specifies — it documents archive-folder + dashboard_config creation only, not the list provisioning branch. The registry row and WIRING_STATUS.md point at the same capability with opposite claimed statuses.

---

<!-- PROGRESS MARKER: calibration packet complete, pre-flight passed for entry 413 at 2026-04-19T18:19:01Z -->

## Entry 413 — `Widget starter configs (10 seeds)`

**Registry line:** 413
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Widget starter configs (10 seeds) | PRD-10 | PRD-10 Phase A | ✅ Wired | PRD-10 Phase A |
```

### Field 1 — Implementation identifier (4-level extraction chain)

**(a) Stub entry itself.** Row names the capability ("10 seeds" of "Widget starter configs") under PRD-10. No concrete table name in the row text. "Created By" is PRD-10 Phase A; no implementation identifier beyond that.

**(b) WIRING_STATUS.md.** Grep `pattern="Widget starter|widget_templates|widget.starter", path=WIRING_STATUS.md, -n`:
```
68:| Widget starter configs carry baseline tags | **Wired** | Adapter in Studio.tsx adds `['dashboard_display', 'at_a_glance', 'progress_visual', tracker_type]`. Phase 2 will replace with per-tracker-type tags. |
```
WIRING_STATUS.md confirms the capability exists and references `Studio.tsx` but does NOT name a DB table.

**(c) CLAUDE.md conventions.** Grep `pattern="widget_templates|widget starter|Widget starter", path=CLAUDE.md` → no matches. No convention names an implementation identifier for this entry.

**(d) PRD + addenda.** Not run — identifier found at a later source. Note: live_schema.md (`claude/live_schema.md`) names `widget_templates` (line 1094, 0 rows) but that was the partition rationale's guess; grep against `src/` reveals the actual table used by the hook (`widget_starter_configs`), which IS NOT in live_schema.md.

**Supplementary — source code lookup for table name:** `Grep pattern="useWidgetStarterConfigs", path=src/hooks/useWidgets.ts` — function body lines 115-123 queries `.from('widget_starter_configs')`. This is the actual runtime table.

Primary identifier: `widget_starter_configs` (table name, found via source code — NOT in live_schema.md).
Secondary identifier: `useWidgetStarterConfigs` hook.
Partition file hinted at `widget_templates` — that guess appears to be STALE/incorrect; the actual implementation uses `widget_starter_configs`.

### Field 2 — Code presence check

**Identifier 1: `widget_starter_configs`**
```
Grep command: pattern=`widget_starter_configs`, path=`supabase`, output_mode=files_with_matches
Hits: 3 files
Files:
  - supabase/migrations/00000000100032_seed_widget_starter_configs.sql  (CREATE TABLE line 22 + 10 INSERT rows)
  - supabase/migrations/00000000100056_prd10_phase_b2_starter_configs.sql  (additional Phase B2 seeds — many more INSERTs)
  - supabase/migrations/00000000100063_prd10_hub_widget_starter_configs.sql  (further hub seed)
```
Migration 100032 contains exactly 10 INSERT statements into `widget_starter_configs` (lines 73, 96, 119, 144, 169, 195, 220, 244, 268, 294). This matches the registry's "(10 seeds)" count verbatim.

First-context window at migration 100032 line 22:
```sql
CREATE TABLE IF NOT EXISTS public.widget_starter_configs (
```

**Identifier 2: `useWidgetStarterConfigs`**
```
Grep command: pattern=`useWidgetStarterConfigs`, path=`src`, output_mode=content
Hits: ≥4 sites (hook definition + 3 consumers)
Files:
  - src/hooks/useWidgets.ts:115-123  (definition, queries `.from('widget_starter_configs')`)
  - src/pages/Studio.tsx:58 (import), 229 (call site)
  - src/pages/Dashboard.tsx:24 (import), 73 (call site)
  - src/components/widgets/WidgetPicker.tsx references via starterConfigs prop
```

First-context window, `src/hooks/useWidgets.ts` lines 115-123:
```ts
// useWidgetStarterConfigs — browse seed starter configs
// ============================================================

export function useWidgetStarterConfigs() {
  return useQuery({
    queryKey: ['widget-starter-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('widget_starter_configs')
```

### Field 3 — Wiring check

**Callers/Importers:**
- `src/pages/Studio.tsx:229` — `const { data: starterConfigs = [] } = useWidgetStarterConfigs()`, feeds the Trackers & Widgets category section in Studio and the WidgetPicker modal.
- `src/pages/Dashboard.tsx:73` — same hook, feeds WidgetPicker on the dashboard.
- `src/components/widgets/WidgetPicker.tsx` — consumes via `starterConfigs: WidgetStarterConfig[]` prop; iterates starter configs to render tiles.
- `src/components/widgets/WidgetConfiguration.tsx` — consumes individual `WidgetStarterConfig` via `starterConfig` prop for pre-population.

**Execution-flow location:** Table is DB-level (migrations), seeded via 3 INSERT-only migrations. Read path: React Query hook `useWidgetStarterConfigs` → Supabase `.from('widget_starter_configs').select('*')` → UI components Studio, Dashboard, WidgetPicker, WidgetConfiguration. Write path: migrations only — no application code INSERTs into this table.

**Most recent touching commit (migration 100032 — the "10 seeds" one):**
```
git log -1 --format="%h %ai %s" -- supabase/migrations/00000000100032_seed_widget_starter_configs.sql
051ac23 2026-03-25 04:24:05 -0500 Seed 10 widget starter configs for Studio Trackers & Widgets category
```

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Line 68 — "Widget starter configs carry baseline tags | **Wired** | Adapter in Studio.tsx adds `['dashboard_display', 'at_a_glance', 'progress_visual', tracker_type]`. Phase 2 will replace with per-tracker-type tags." Confirms wiring in the context of capability tags, not explicitly naming the DB table.

**Cross-PRD addendum mentions:** Not explicitly greppped for `widget_starter_configs` in prds/addenda — skipped because implementation source was already located. See Field 5.

**PlannedExpansionCard / stub UI:** Not checked — this is a DB-layer seed registered Wired; no PlannedExpansionCard is expected.

**CLAUDE.md convention mention:** No hits for `widget_starter_configs` or "widget starter" in CLAUDE.md — not surfaced as a convention. (The broader PRD-10 widget system is discussed via Convention #35 etc., but not this specific table.)

### Field 5 — What was NOT checked

- Whether migrations 100032, 100056, and 100063 were all successfully applied to production. Migration chain presence suggests yes, but not independently verified.
- Whether the current row count in the production `widget_starter_configs` table actually matches the 10 seeds from migration 100032 (or the expanded Phase B2 count). `live_schema.md` does NOT list `widget_starter_configs` at all — it only lists `widget_templates` (0 rows). This is a live_schema.md drift from the actual DB schema if the table is present in production.
- Whether `widget_templates` (live_schema line 1094, 0 rows) is a separate legacy / vestigial table or a misnamed reference. It appears alongside `widget_starter_configs` in the migrations, but their relationship was not verified.
- Whether the partition file's rationale ("Seed rows in `widget_templates` or `dashboard_widgets`") guided at the correct identifier — it did not; the actual table is `widget_starter_configs`. This suggests partition-file drift from the live codebase.
- Whether `addenda/PRD-10*` addenda mention `widget_starter_configs` directly — skipped because evidence-by-grep was already sufficient.

### Field 6 — Observations (no verdict)

STUB_REGISTRY.md line 413 claims `✅ Wired` under PRD-10 Phase A. Grep confirms a DB table `widget_starter_configs` is created and seeded across three migration files. Migration 100032 (2026-03-25, commit 051ac23) with subject line "Seed 10 widget starter configs for Studio Trackers & Widgets category" contains exactly 10 INSERT statements — matching the registry's "(10 seeds)" count. A React Query hook `useWidgetStarterConfigs` in `src/hooks/useWidgets.ts` queries the table and is consumed by Studio, Dashboard, WidgetPicker, and WidgetConfiguration. Note: `live_schema.md` does not list `widget_starter_configs` — it only lists `widget_templates` (0 rows); either `live_schema.md` is stale relative to production or the dump process missed this table. The partition file's rationale guessed at `widget_templates` or `dashboard_widgets` as the seed table; the actual table is `widget_starter_configs`.

---

<!-- PROGRESS MARKER: entry 413 complete, pre-flight passed for entry 417 at 2026-04-19T18:19:01Z -->

## Entry 417 — `Color-reveal tracker + image library`

**Registry line:** 417
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Color-reveal tracker + image library | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase C |
```

### Field 1 — Implementation identifier (4-level extraction chain)

**(a) Stub entry itself.** Row names the capability ("Color-reveal tracker + image library") under PRD-10 with target "PRD-10 Phase C". No explicit DB table name; "image library" is descriptive, not a schema identifier.

**(b) WIRING_STATUS.md.** Grep `pattern="coloring_image_library|coloring_reveal_library|color.reveal|Color.reveal", path=WIRING_STATUS.md` → no matches found. WIRING_STATUS.md does not surface this feature by either candidate table name.

**(c) CLAUDE.md conventions.** Grep `pattern="coloring_reveal_library|coloring_image_library|ColorRevealTally|color.reveal|Color-reveal", path=CLAUDE.md, -n`:
```
460:212. **Coloring reveal config is 4 fields only:** pick image (from `coloring_reveal_library`), ...
462:213. **`coloring_reveal_library` stores 32 Woodland Felt subjects** (20 animals + 12 scenes). ...
480:222. **`ColorRevealTallyWidget` is a dashboard widget, not a task tile.** ...
```

Conventions #212, #213, #222 all name `coloring_reveal_library` (not `coloring_image_library`) as the table and `ColorRevealTallyWidget` as the widget component.

Note the naming collision: the partition file rationale and `live_schema.md` context hinted at `coloring_image_library`, but CLAUDE.md names `coloring_reveal_library`. Grep confirms BOTH tables exist (different migrations, different vintages).

Primary identifier: `coloring_reveal_library` (per CLAUDE.md #213 — Build M / PRD-24+26 context).
Secondary identifier: `coloring_image_library` (partition rationale — older PRD-10 Phase C context).
Tertiary identifier: `ColorRevealTallyWidget` component.

### Field 2 — Code presence check

**Identifier 1: `coloring_image_library`**
```
Grep command: pattern=`coloring_image_library`, path=<repo root>, output_mode=files_with_matches
Hits: 9 files
Notable code/schema hits:
  - supabase/migrations/00000000100033_prd10_widgets_trackers.sql (CREATE TABLE line 339)
  - prds/personal-growth/PRD-10-Widgets-Trackers-Dashboard-Layout.md
  - prds/gamification/PRD-24B-Gamification-Visuals-Interactions.md
  - claude/feature-decisions/PRD-10-Widgets-Trackers-Dashboard-Layout.md
  - claude/feature-decisions/Universal-Setup-Wizards-Session-Addendum.md
  - claude/feature_glossary.md
  - audit/CORRECTED_DATABASE_SCHEMA.md
  - .claude/archive/database_schema_SUPERSEDED.md
  - scope-5-evidence/stub_partition_schema.md
```

No application-layer `src/` hits for `coloring_image_library` — it is present in migration 100033 and referenced in documentation only.

First-context window, migration 100033 line 339:
```sql
CREATE TABLE IF NOT EXISTS public.coloring_image_library (
```

**Identifier 2: `coloring_reveal_library`**
```
Grep command: pattern=`coloring_reveal_library`, path=<repo root>, output_mode=files_with_matches
Hits: 10 files
Notable hits:
  - supabase/migrations/00000000100126_earning_strategies_color_reveal.sql (CREATE TABLE line 88)
  - src/hooks/useColoringReveals.ts  (.from('coloring_reveal_library') at line 28)
  - src/lib/coloringImageUrl.ts (URL derivation helper)
  - tests/e2e/features/phase5-segments-coloring-reveal.spec.ts
  - tests/e2e/features/color-reveal-phase3.spec.ts
  - CLAUDE.md  (conventions #212, #213)
  - STUB_REGISTRY.md
  - claude/feature-decisions/PRD-24-PRD-26-Configurable-Earning-Strategies.md
```

First-context window, migration 100126 line 88:
```sql
CREATE TABLE IF NOT EXISTS public.coloring_reveal_library (
```

**Identifier 3: `ColorRevealTallyWidget`**
```
Grep command: pattern=`ColorRevealTallyWidget|ColorRevealTally`, path=`src`, output_mode=files_with_matches
Hits: 4 files
  - src/components/coloring-reveal/ColorRevealTallyWidget.tsx  (component definition)
  - src/pages/Dashboard.tsx
  - src/pages/GuidedDashboard.tsx
  - src/pages/PlayDashboard.tsx
```

### Field 3 — Wiring check

**Identifier 1 callers (`coloring_image_library`):** No application-layer (`src/`) imports or queries. Table exists in migration 100033 but is not queried from any TypeScript file in `src/`. References are PRD/spec documentation only.

**Identifier 2 callers (`coloring_reveal_library`):**
- `src/hooks/useColoringReveals.ts:28` — `.from('coloring_reveal_library')` (application-layer read path).
- `src/lib/coloringImageUrl.ts:5` — helper with doc-comment naming the table as the asset-slug source.
- 2 E2E spec files referencing the table.

**Identifier 3 callers (`ColorRevealTallyWidget`):** imported by 3 dashboard pages (Dashboard.tsx, GuidedDashboard.tsx, PlayDashboard.tsx). Consumed as a dashboard widget, consistent with CLAUDE.md convention #222.

**Execution-flow location:**
- `coloring_image_library` → migration 100033 only; no live read path in `src/`. PRD-10 design artifact.
- `coloring_reveal_library` → migration 100126 (PRD-24+26 Build M Phase 1) + live hook + live widget + E2E tests. PRD-24+26 implementation.
- `ColorRevealTallyWidget` → React component consumed by 3 dashboards.

**Most recent touching commits:**
```
git log -1 --format="%h %ai %s" -- supabase/migrations/00000000100126_earning_strategies_color_reveal.sql
61a9581 2026-04-10 17:33:19 -0500 feat: Build M Phase 1 — earning strategy foundation + color reveal schema + RPC refactor
```
(Migration 100033 touching commit not retrieved — older PRD-10 Phase A era; can be looked up on demand.)

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No direct mention of `coloring_image_library` or `coloring_reveal_library` in WIRING_STATUS.md.

**Cross-PRD addendum mentions:** `coloring_image_library` appears in PRD-10 + PRD-24B + claude/feature-decisions; `coloring_reveal_library` appears in PRD-24-PRD-26 feature-decisions file. The color-reveal feature has two separate lineages — original PRD-10 Phase C design (coloring_image_library) and the Build M implementation (coloring_reveal_library).

**PlannedExpansionCard / stub UI:** Not checked — multiple components exist (ColorRevealTallyWidget is a live dashboard widget), which suggests the feature is NOT a planned-expansion card. Registry row says `⏳ Unwired (MVP)` targeted at "PRD-10 Phase C" though, so the PRD-10 Phase C version specifically may still be planned — the Build M coloring_reveal_library implementation appears to have arrived under a different PRD.

**CLAUDE.md convention mention:** Conventions #212, #213, #222 name `coloring_reveal_library` as the authoritative table for the configurable earning strategy / coloring reveal system. Convention #213 specifies "32 Woodland Felt subjects (20 animals + 12 scenes)". Row-count verification would confirm the "(32 subjects)" seed claim from partition line 259.

### Field 5 — What was NOT checked

- Whether the PRD-10 registry row at line 417 is intended to track `coloring_image_library` (the PRD-10 Phase C design), the `coloring_reveal_library` (the Build M / PRD-24+26 implementation), or both. The two tables appear to represent two generations of the same capability — one has a live read path and widget, the other exists only as a CREATE TABLE statement in migration 100033 with no `src/` consumers. This is an ambiguity the registry row does not resolve.
- Whether `coloring_image_library` is still live in production or was intended to be dropped / superseded. No DROP TABLE statement was greppped for.
- Whether the `ColorRevealTallyWidget` component is the full "Color-reveal tracker" referenced by the registry row, or whether additional widget variants are expected at PRD-10 Phase C.
- Whether the partition file's rationale (`coloring_image_library` table) is intentionally tracking the PRD-10-era table rather than the newer Build M table — potential cross-PRD conflict worth flagging for founder judgment.
- Row count on the production `coloring_reveal_library` table: CLAUDE.md #213 specifies 32 subjects; not independently verified.

### Field 6 — Observations (no verdict)

STUB_REGISTRY.md line 417 marks the entry `⏳ Unwired (MVP)` with a "PRD-10 Phase C" target. Grep reveals TWO candidate tables: `coloring_image_library` (migration 100033, PRD-10 Phase A era, no `src/` read path) and `coloring_reveal_library` (migration 100126, PRD-24+26 Build M Phase 1 era — 2026-04-10 commit 61a9581 — with live hook, widget, and E2E tests). CLAUDE.md conventions #212, #213, #222 name the newer `coloring_reveal_library` as the authoritative table and describe a live `ColorRevealTallyWidget` dashboard widget. Dashboard/GuidedDashboard/PlayDashboard all import the widget. The registry row's PRD-10 Phase C target predates Build M; the implementation may have arrived under a different PRD and the registry row has not been updated. Partition file rationale hinted at `coloring_image_library` — the actual live-code table is `coloring_reveal_library`.

---

<!-- PROGRESS MARKER: entry 417 complete, pre-flight passed for entry 446 at 2026-04-19T18:19:01Z -->

## Entry 446 — `Special Adult shift-scoped task access`

**Registry line:** 446
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Special Adult shift-scoped task access | PRD-09A | — | ⏳ Unwired (MVP) | Needs access_schedules wiring |
```

### Field 1 — Implementation identifier (4-level extraction chain)

**(a) Stub entry itself.** Row names the capability ("Special Adult shift-scoped task access") with the remediation note "Needs access_schedules wiring". The note names the dependency table `access_schedules` but not a concrete wiring mechanism on the `tasks` side (RLS policy name, hook name, or function). Identifier at (a): `access_schedules` (named in the "Remediation Required" column).

**(b) WIRING_STATUS.md.** Grep `pattern="Special Adult.{0,40}shift|access_schedules.{0,40}task|shift.scoped.{0,40}task", path=WIRING_STATUS.md` → no matches. No WIRING_STATUS row documents this specific wiring.

**(c) CLAUDE.md conventions.** Grep `pattern="access_schedules|Special Adult shift|shift-scoped", path=CLAUDE.md, -n`:
```
167:26. **`access_schedules` replaces `shift_schedules`** for Special Adult/co-parent access windows.
194:40. **Special Adult shifts use `time_sessions`** with `source_type='shift'`, `is_standalone=true`. No separate `shift_sessions` table. Co-parents with `always_on` schedule skip shift start/end entirely.
```
Conventions #26 and #40 name `access_schedules` and `time_sessions` but describe the access-window and shift-session mechanics — neither convention describes how `tasks` are filtered by access-schedule windows.

**(d) PRD + addenda.** Not run — partition rationale + (a) + (c) are sufficient to identify the table. The missing piece is specifically an RLS policy or a query filter on `tasks` that consults `access_schedules` — and that is the gap the registry row flags.

Primary identifier: `access_schedules` (table).
Secondary identifier: the hypothetical wiring (RLS policy on `tasks`, or a hook-level filter) — stub-named, not concrete.

### Field 2 — Code presence check

**Identifier 1: `access_schedules`**
```
Grep command: pattern=`access_schedules`, path=`supabase`, output_mode=files_with_matches
Hits: 2 files
  - supabase/migrations/00000000000004_universal_scheduler.sql
  - supabase/migrations/00000000000019_schema_remediation_batch2.sql
```
```
Grep command: pattern=`access_schedules`, path=`src`, output_mode=files_with_matches
Hits: 4 files
  - src/components/scheduling/schedulerUtils.ts
  - src/lib/permissions/usePermission.ts
  - src/lib/scheduling/scheduleUtils.ts
  - src/lib/scheduling/useScheduleAccess.ts  (primary hook)
```

First-context window, `src/lib/scheduling/useScheduleAccess.ts` (whole file read, lines 1-68):
- Hook `useAccessSchedules(memberId)` at line 26 queries `.from('access_schedules').select('*').eq('member_id', memberId).eq('is_active', true)`.
- Hook `useScheduleAccess(memberId)` at line 53 returns `{ available, nextWindow, isLoading, hasSchedules }`.
- NO join to `tasks` — this hook reads `access_schedules` alone.

**Search for cross-wire to tasks (`tasks.{0,60}access_schedules | access_schedules.{0,60}tasks`):**
```
Grep hit summary (across entire repo):
  - claude/feature-decisions/PRD-05-repair.md:189 — migration check; empty rows in both tables
  - claude/feature-decisions/PRD-10-repair.md:79 — design intent: "Check access_schedules for active schedule, filter tasks to assigned children only."
  - claude/feature-decisions/PRD-10-repair.md:205 — "Special Adult shift-scoped tasks | Stubbed | access_schedules not wired"
  - scope-5-evidence/stub_partition_schema.md:64 — partition file itself
```
NO source-code hit joining `access_schedules` to `tasks`. The PRD-10 feature-decision explicitly documents this wiring as Stubbed.

**Caller check for `useScheduleAccess`:**
```
Grep command: pattern=`useScheduleAccess|useAccessSchedules`, path=`src`, output_mode=files_with_matches
Hits: 3 files
  - src/features/permissions/ShiftView.tsx  (only imports? see below)
  - src/lib/scheduling/useScheduleAccess.ts  (definition site)
  - src/lib/scheduling/index.ts  (barrel export)
```

Narrower grep of `ShiftView.tsx` for `useScheduleAccess` returned no matches — the import may be in index.ts only. `ShiftView.tsx` is PRD-02 Screen 6 per its file header, which is a permissions-visualization UI, not a task-filtering consumer.

### Field 3 — Wiring check

**Callers/Importers:** Per Field 2 greps, `useScheduleAccess` appears to be defined and exported but not consumed by any `tasks`-layer query, filter, or RLS policy in `src/`. The `src/features/permissions/ShiftView.tsx` file contains the import path references but the pattern did not grep-hit on the specific hook name — suggests the file references `access_schedules` directly or through a different export.

**Execution-flow location:** Hook lives at `src/lib/scheduling/useScheduleAccess.ts`; called only from the barrel index. No call site in task-query hooks (useTasks, useTaskCompletions, etc. were not found in this grep run).

**Most recent touching commit:**
```
git log -1 --format="%h %ai %s" -- src/lib/scheduling/useScheduleAccess.ts
ed4748b 2026-03-23 15:40:43 -0500 Phase 05: Universal Scheduler & Access Schedules
```
This predates most Build-era task work; hook exists but no consumer was added in subsequent builds.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No mention.

**Cross-PRD addendum mentions:** Not fully grepped against `prds/addenda/` for this entry — skipped.

**PlannedExpansionCard / stub UI:** Not checked — feature is a backend wiring gap, not a UI surface.

**CLAUDE.md convention mention:** Conventions #26 (line 167) and #40 (line 194) name `access_schedules` and describe Special Adult shift mechanics, but neither convention describes the filter-tasks-by-active-schedule behavior that the registry row flags.

**`claude/feature-decisions/PRD-10-repair.md` (line 79, line 205):** Directly describes the wiring gap. Line 79: "Check `access_schedules` for active schedule, filter tasks to assigned children only." Line 205 verification table entry: "Special Adult shift-scoped tasks | **Stubbed** | access_schedules not wired". This feature-decision doc corroborates the STUB_REGISTRY status.

### Field 5 — What was NOT checked

- Whether any RLS policy on `tasks` references `access_schedules` via a subquery or function call. I greppped `supabase/migrations/` for the `access_schedules` pattern (only 2 hits — the create + remediation migrations) and did NOT see a tasks-side RLS policy. A narrower search for policy definitions referencing `access_schedules` could be tightened.
- Whether `useScheduleAccess` is called from any hook that filters tasks client-side — a check of specific task-hooks (`useTasks`, `useTaskCompletions`, etc.) was NOT performed.
- Whether the `ShiftView.tsx` component (PRD-02 Screen 6) is the intended consumer surface and whether task-level filtering was designed to happen there or in a separate task-query hook.
- Whether `prds/addenda/PRD-09A*` or `prds/addenda/PRD-35*` addenda specify the wiring approach — not greppped.
- Whether Special Adults currently see unfiltered tasks on production (production read-path observation) — out of scope.
- The full text of `src/features/permissions/ShiftView.tsx` (747 lines) was not read; it might contain access-window task filtering logic.

### Field 6 — Observations (no verdict)

STUB_REGISTRY.md line 446 marks this `⏳ Unwired (MVP)` with remediation note "Needs access_schedules wiring". Grep confirms `access_schedules` exists as a table (migrations 4 + 19) and is read by 4 `src/` files including a primary `useScheduleAccess` hook. However, NO grep found a wire from `access_schedules` to `tasks` — no RLS policy join, no task-hook consumer of `useScheduleAccess`. `claude/feature-decisions/PRD-10-repair.md` line 205 independently classifies this capability as Stubbed with the same "access_schedules not wired" note. CLAUDE.md conventions #26 and #40 name the table and describe related mechanics but do not describe the task-filtering wiring. Hook last touched 2026-03-23; no subsequent consumer work.

---

<!-- PROGRESS MARKER: entry 446 complete, pre-flight passed for entry 456 at 2026-04-19T18:19:01Z -->

## Entry 456 — `Board of Directors persona library`

**Registry line:** 456
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Board of Directors persona library | Platform Intelligence Channel D | PRD-34 | ✅ Wired | Phase 35 (34A) |
```

### Field 1 — Implementation identifier (4-level extraction chain)

**(a) Stub entry itself.** Row names "Board of Directors persona library" under "Platform Intelligence Channel D" and "PRD-34". No explicit DB table name in the stub text.

**(b) WIRING_STATUS.md.** Grep `pattern="board_personas|Board of Directors", path=WIRING_STATUS.md` → no matches. WIRING_STATUS.md does not document this feature by either name.

**(c) CLAUDE.md conventions.** Grep `pattern="board_personas|persona_type|Board of Directors", path=CLAUDE.md, -n`:
```
273:93. **Board of Directors uses sequential per-advisor Sonnet calls.** Each response attributed via `lila_messages.metadata.persona_id`. 3 default seats, 5 max. ...
277:97. **Board of Directors `personal_custom` personas NEVER enter the platform intelligence pipeline.** `persona_type` check required before any pipeline write. Hard rule, no exceptions.
279:99. **Persona caching (P8 pattern): always check `board_personas` by name (case-insensitive) before generating a new public persona.** One generation cost per persona, amortized across all future users.
```
Conventions #93, #97, #99 all name `board_personas` as the authoritative table.

Primary identifier: `board_personas`.
Secondary identifier: `persona_type` (column on the table, per conventions #97 and the CREATE TABLE).

### Field 2 — Code presence check

**Identifier 1: `board_personas`**
```
Grep command: pattern=`board_personas`, path=`supabase`, output_mode=files_with_matches
Hits: 2 files
  - supabase/functions/lila-board-of-directors/index.ts  (Edge Function consumer)
  - supabase/migrations/00000000100049_prd34_thoughtsift_tables.sql  (CREATE TABLE + seed)
```
```
Grep command: pattern=`board_personas`, path=`src`, output_mode=files_with_matches
Hits: 1 file
  - src/components/lila/BoardOfDirectorsModal.tsx  (UI consumer)
```

Migration 100049 structure for this table:
```
Grep command: pattern=`CREATE TABLE.{0,30}board_personas|INSERT INTO.{0,30}board_personas`, path=`supabase`, output_mode=content, -n
Hits:
  10: CREATE TABLE IF NOT EXISTS public.board_personas (
  449: INSERT INTO public.board_personas (persona_name, persona_type, personality_profile, source_references, category, content_policy_status, is_public) VALUES
```
Single CREATE TABLE + single INSERT statement (with multiple VALUES tuples).

First-context window, migration 100049 lines 445-449:
```sql
-- SEED: Board Personas (System Preloaded Starter Pack)
-- 18 personas: mix of historical, literary, faith leaders, thinkers
-- ══════════════════════════════════════════════════════════════════════════════

INSERT INTO public.board_personas (persona_name, persona_type, personality_profile, source_references, category, content_policy_status, is_public) VALUES
```
Migration comment claims "18 personas"; `claude/live_schema.md` (line in "ThoughtSift" section) lists `board_personas` — 18 rows, matching the migration claim.

First seed row (line 451, Benjamin Franklin):
```sql
('Benjamin Franklin', 'system_preloaded',
'{"traits": ["pragmatic", "witty", "relentlessly curious", "self-improving", "diplomatically shrewd"],
  "philosophies": ["Virtue is practiced, not professed", ...],
  ...}'::jsonb,
ARRAY['Poor Richard''s Almanack', 'Autobiography of Benjamin Franklin'],
'historical', 'approved', true),
```

### Field 3 — Wiring check

**Callers/Importers:**
- `supabase/functions/lila-board-of-directors/index.ts` — Edge Function that serves Board of Directors conversations. Likely queries `board_personas` to load persona profiles for Sonnet calls (per convention #93).
- `src/components/lila/BoardOfDirectorsModal.tsx` — React component (UI layer). Likely queries `board_personas` to render the persona picker.

**Execution-flow location:**
- DB layer: migration 100049 creates the table and seeds 18 rows.
- Edge Function layer: `lila-board-of-directors` consumes the table.
- UI layer: `BoardOfDirectorsModal.tsx` consumes the table.

**Most recent touching commit:**
```
git log -1 --format="%h %ai %s" -- supabase/migrations/00000000100049_prd34_thoughtsift_tables.sql
c7ade60 2026-03-26 03:24:02 -0500 feat: PRD-34 ThoughtSift — 5 AI-powered thinking tools
```

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No mention.

**Cross-PRD addendum mentions:** Not fully greppped against `prds/addenda/` — skipped.

**PlannedExpansionCard / stub UI:** Not checked — feature is wired per registry.

**CLAUDE.md convention mention:** Conventions #93 (line 273), #97 (line 277), #99 (line 279). Convention #99 explicitly names the table `board_personas` and describes the caching pattern (P8): "always check `board_personas` by name (case-insensitive) before generating a new public persona." Convention #97 governs the `persona_type` column: `personal_custom` personas must never enter platform intelligence.

**`claude/live_schema.md` Board tables section:** `board_personas` — 18 rows (per the live_schema snapshot quoted in this conversation's system-context). Matches the migration seed count.

### Field 5 — What was NOT checked

- Whether the Edge Function `lila-board-of-directors` actually queries `board_personas` with a SELECT statement (not just references the table name in a string literal). Would require reading the Edge Function source.
- Whether `BoardOfDirectorsModal.tsx` uses a hook that joins `board_personas` to `board_session_personas` and `board_sessions` (the PRD-34 related tables), or whether it only reads `board_personas` in isolation.
- Whether the seed claim of "18 personas" (migration 100049 header comment + live_schema row count) reflects the current production count, or whether new personas have been inserted/deleted since the migration.
- Whether `persona_favorites`, `board_sessions`, and `board_session_personas` tables (all listed in live_schema.md with 0 rows) represent unused gating surfaces or are populated at runtime as user sessions occur.
- Whether the `is_public` flag (last column of the seed INSERT) controls visibility correctly for non-mom members — RLS policy not examined.
- Whether the `content_policy_status = 'approved'` default on seed personas means all 18 are live; the content-policy pipeline from convention #102 was not traced.

### Field 6 — Observations (no verdict)

STUB_REGISTRY.md line 456 marks this `✅ Wired` under "Platform Intelligence Channel D" and target "Phase 35 (34A)". Grep confirms a `board_personas` table created and seeded in migration 100049 (2026-03-26, commit c7ade60 — the PRD-34 ThoughtSift build). Migration header comment claims "18 personas"; `claude/live_schema.md` ThoughtSift section confirms 18 rows on the table. One Edge Function (`lila-board-of-directors`) and one React component (`BoardOfDirectorsModal.tsx`) reference the table by name. CLAUDE.md conventions #93, #97, #99 name the table and govern persona_type semantics and caching behavior. The registry claim, the migration seed, the live_schema row count, and the CLAUDE.md conventions are consistent with one another. WIRING_STATUS.md does not carry a row for this feature.

---

## PAUSED AT ENTRY 5 — awaiting founder review

<!-- PROGRESS MARKER: 5 packets complete, paused for review at 2026-04-19T18:19:01Z -->

Next-in-queue entries (NOT yet processed): 469, 492, 494, 495, 496, 498, 500, 517, 532, 533, 534, and the full remainder of the Schema partition (48 total entries before this pause, 43 remaining after).
