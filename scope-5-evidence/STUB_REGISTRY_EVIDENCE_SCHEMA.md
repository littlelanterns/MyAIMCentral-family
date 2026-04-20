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

---

# Session 1 resumption — Schema remainder dispatch

> Session: Session 1 of four parallel Scope 5 sessions.
> Dispatched: 2026-04-19 (continuing the pilot evidence file per partition §6-7).
> Partition: `scope-5-evidence/stub_partition_schema.md` — 43 remaining entries after pilot.
> Calibration entry: line 494 (Sequential advancement modes).
> Recipe: `scope-5-evidence/EVIDENCE_RECIPE.md`.

<!-- PROGRESS MARKER: Session 1 dispatched, pre-flight: STUB_REGISTRY.md = 547 lines, HALT absent; beginning calibration entry 494 -->

---

## Entry 494 — `Sequential advancement modes (practice_count, mastery)`

**Registry line:** 494
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Sequential advancement modes (practice_count, mastery) | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — migration 100105 + `usePractice.ts` hooks + SequentialCreator defaults section + SequentialCollectionView per-item progress + TaskCard submit-as-mastered button + PendingApprovalsSection mastery fork (Tasks.tsx). 7/7 E2E tests passing. |
```

### Field 1 — Implementation identifier (4-level extraction chain)

**(a) Stub entry itself.** Row at line 494 is a dense multi-identifier entry. The "Notes" column names seven concrete implementation artifacts:

1. Migration `100105` (file stem only — full filename resolved via glob below).
2. Hook file `usePractice.ts`.
3. Component `SequentialCreator` — specifically its "defaults section."
4. Component `SequentialCollectionView` — specifically "per-item progress."
5. Component `TaskCard` — specifically a "submit-as-mastered button."
6. Component `PendingApprovalsSection` in `Tasks.tsx` — specifically the "mastery fork."
7. E2E test claim — "7/7 E2E tests passing" (no filename given at stub level).

The stub also claims "practice_count, mastery" as advancement-mode enum values and references the "Linked Steps addendum (Build J)" in the "Deprecated By" column — which itself is a pointer to a documentation artifact.

Chain stops at (a). Opportunistic cross-reference checks at (b)-(d) below.

**Primary identifiers (resolved in subsequent fields):**
- DB columns: `advancement_mode`, `practice_target`, `mastery_status` — added to BOTH `tasks` AND `list_items` per CLAUDE.md convention #158.
- Migration file: `supabase/migrations/00000000100105_linked_steps_mastery_advancement.sql`.
- Hook: `src/hooks/usePractice.ts`.
- Components:
  - `src/components/tasks/sequential/SequentialCreator.tsx`
  - `src/components/tasks/sequential/SequentialCollectionView.tsx`
  - `src/components/tasks/TaskCard.tsx`
  - `src/pages/Tasks.tsx` (hosts `PendingApprovalsSection`)
- E2E: `tests/e2e/features/linked-steps-mastery.spec.ts`.
- Addendum: `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md`.

### Field 2 — Code presence check (one block per identifier)

**Identifier group 1: migration file + 3 columns × 2 tables**
```
Glob pattern: supabase/migrations/00000000100105_*.sql
Hits: 1
File: supabase/migrations/00000000100105_linked_steps_mastery_advancement.sql
```
```
Grep command: pattern=`advancement_mode|practice_target|mastery_status`, path=`supabase/migrations/00000000100105_linked_steps_mastery_advancement.sql`, output_mode=content, -n=true
Hits: 18 matches (pre-head-limit).
Key matches showing the 3 columns on BOTH tables:
  - line 24  | tasks: `ADD COLUMN IF NOT EXISTS advancement_mode TEXT NOT NULL DEFAULT 'complete'`
  - line 25  | tasks: `CHECK (advancement_mode IN ('complete','practice_count','mastery'))`
  - line 26  | tasks: `ADD COLUMN IF NOT EXISTS practice_target INTEGER`
  - line 28  | tasks: `ADD COLUMN IF NOT EXISTS mastery_status TEXT`
  - line 29  | tasks: `CHECK (mastery_status IN ('practicing','submitted','approved','rejected') OR mastery_status IS NULL)`
  - line 38-40 | tasks: partial index `idx_tasks_mastery_status` WHERE `advancement_mode = 'mastery'`
  - line 47-48 | sequential_collections: `default_advancement_mode` with same CHECK enum
  - line 49  | sequential_collections: `default_practice_target`
  - line 90  | list_items: `ADD COLUMN IF NOT EXISTS advancement_mode TEXT NOT NULL DEFAULT 'complete'` (same enum)
  - line 92  | list_items: `ADD COLUMN IF NOT EXISTS practice_target INTEGER`
  - line 94  | list_items: `ADD COLUMN IF NOT EXISTS mastery_status TEXT` (same enum)
  - line 103-105 | list_items: partial index `idx_list_items_mastery_status` WHERE `advancement_mode = 'mastery'`
  - line 116-118 | lists: `default_advancement_mode`, `default_practice_target` (collection-level defaults)
```
Both `tasks` AND `list_items` confirmed to receive all three advancement columns with matching enums. Collection/list-level default columns also confirmed on `sequential_collections` and `lists`.

**Identifier 2: `src/hooks/usePractice.ts`**
```
Glob pattern: src/hooks/usePractice.ts
Hit: 1 — file exists.

Grep command: pattern=`^export (function|const) use`, path=`src/hooks/usePractice.ts`, output_mode=content, -n=true
Hits: 5
  - line 76  export function useLogPractice()
  - line 268 export function useSubmitMastery()
  - line 448 export function useApproveMasterySubmission()
  - line 583 export function useRejectMasterySubmission()
  - line 680 export function useMemberPracticeLog(memberId, periodDate?)
```
All three hooks named in the partition's known-good (`useLogPractice`, `useApproveMasterySubmission`, `useRejectMasterySubmission`) are confirmed exports. Two additional hooks also exported (`useSubmitMastery`, `useMemberPracticeLog`) — not named by the stub but adjacent to the advancement-modes surface.

**Identifier 3: `SequentialCreator` defaults section**
```
Glob pattern: src/components/tasks/sequential/SequentialCreator.tsx
Hit: 1 — file exists.

Grep command: pattern=`default_advancement_mode|defaultAdvancementMode|Advancement Mode|advancement_mode`, path=`src/components/tasks/sequential/SequentialCreator.tsx`, output_mode=content, -n=true
Hits: 11 (head_limit=15)
  - line 24  | `defaultAdvancementMode: AdvancementMode` — type field in defaults interface
  - line 78-79 | `useState<AdvancementMode>(initialDefaults?.defaultAdvancementMode ?? 'complete')`
  - line 113-114 | defaults-propagation write: `defaultAdvancementMode, defaultPracticeTarget: defaultAdvancementMode === 'practice_count' ? defaultPracticeTarget : null`
  - line 292 | per-item override: `advancement_mode: item.suggested_advancement_mode`
  - line 387-390 | mode-selector button active styling keyed on `defaultAdvancementMode === m.key`
  - line 402 | conditional render block `{defaultAdvancementMode === 'practice_count' && (`
  - line 429 | conditional render block `{defaultAdvancementMode === 'mastery' && (`
  - line 441 | second mastery-mode conditional render (approval/evidence toggles)
```
"Defaults section" claim is verified: the component has a state-managed defaults interface with conditional UI branches for `practice_count` and `mastery` modes, and persists the bulk-set defaults through `defaultPracticeTarget` when applicable.

**Identifier 4: `SequentialCollectionView` per-item progress**
```
Glob pattern: src/components/tasks/sequential/SequentialCollectionView.tsx
Hit: 1 — file exists.

Grep command: pattern=`practice_count|practice_target|mastery|advancement_mode`, path=`src/components/tasks/sequential/SequentialCollectionView.tsx`, output_mode=content, -n=true
Hits: 20 (head_limit=20)
  - line 35  | `useState<AdvancementMode>(task.advancement_mode ?? 'complete')`
  - line 36  | `useState(task.practice_target ?? 5)`
  - line 37-38 | approval/evidence toggle state
  - line 45-48 | save payload: `advancement_mode: mode, practice_target: mode === 'practice_count' ? target : null, require_mastery_approval: mode === 'mastery' ? requireApproval : false`
  - line 63-64 | mode picker options: "Practice N times" / "Mastery"
  - line 99  | conditional `{mode === 'practice_count' && (`
  - line 120 | conditional `{mode === 'mastery' && (`
  - line 412-422 | per-item progressSubtitle rendering:
        if advancementMode === 'practice_count' AND task.practice_target != null:
          progressSubtitle = `${task.practice_count}/${task.practice_target} practices`
        else if advancementMode === 'mastery':
          if task.mastery_status === 'submitted' → "Submitted — awaiting approval"
          else if task.mastery_status === 'approved' → (separate branch)
          else → `Practiced ${task.practice_count} time(s)`
```
"Per-item progress" claim verified: the component renders per-task progress strings that switch on `advancement_mode`, with distinct branches for practice_count vs mastery and for each mastery_status state.

**Identifier 5: `TaskCard` submit-as-mastered button**
```
Glob pattern: src/components/tasks/TaskCard.tsx
Hit: 1 — file exists.

Grep command: pattern=`Submit as Mastered|Submit for Review|mastery_submit|MasterySubmissionModal|useSubmitMastery`, path=`src/components/tasks/TaskCard.tsx`, output_mode=content, -n=true
Hits: 2
  - line 628 | `{/* Build J: Submit as Mastered button (only for mastery items currently practicing) */}`
  - line 644 | button label text "Submit as Mastered"

First-context window (TaskCard.tsx lines 628-646):
  628  {/* Build J: Submit as Mastered button (only for mastery items currently practicing) */}
  629  {showMasteryButton && onSubmitMastery && (
  630    <button
  ...
  643      <GraduationCap size={12} />
  644      Submit as Mastered
  645    </button>
  646  )}
```
"Submit-as-mastered button" claim verified: labeled button rendered conditionally on `showMasteryButton && onSubmitMastery` props, handler delegates to the parent via `onSubmitMastery(task)`.

**Identifier 6: `PendingApprovalsSection` in `Tasks.tsx` — mastery fork**
```
Grep command: pattern=`PendingApprovalsSection`, path=`src/pages/Tasks.tsx`, output_mode=content, -n=true
Hits: 4
  - line 600  | render site: `<PendingApprovalsSection`
  - line 1577 | comment `// PendingApprovalsSection sub-component`
  - line 1579 | `interface PendingApprovalsSectionProps {`
  - line 1585 | `function PendingApprovalsSection({ tasks, familyMembers, approverId }: PendingApprovalsSectionProps) {`

Grep command: pattern=`mastery_submit|useApproveMasterySubmission|useRejectMasterySubmission`, path=`src/pages/Tasks.tsx`, output_mode=content, -n=true
Hits: 5
  - line 38   | `import { useApproveMasterySubmission, useRejectMasterySubmission, useSubmitMastery } from '@/hooks/usePractice'`
  - line 1589 | `const approveMastery = useApproveMasterySubmission()` (inside PendingApprovalsSection)
  - line 1590 | `const rejectMastery = useRejectMasterySubmission()` (inside PendingApprovalsSection)
  - line 1624 | `if ((completion as { completion_type?: string }).completion_type === 'mastery_submit') {` (fork branch 1 — approve)
  - line 1647 | same fork at reject branch
  - line 1688 | `const isMasterySubmission = (completion as { completion_type?: string } | undefined)?.completion_type === 'mastery_submit'`
```
"Mastery fork" claim verified: the sub-component checks `completion_type === 'mastery_submit'` before invoking `approveMastery.mutate` / `rejectMastery.mutate`, otherwise falls through to the standard approve/reject hooks.

⚠️ **Location drift from CLAUDE.md #161.** Convention #161 (CLAUDE.md line 358) states `PendingApprovalsSection` is "in Tasks.tsx (line 1062)." Actual location: defined at line 1585, rendered at line 600. Either the code moved after the convention was written (Build J dated 2026-04-06; Tasks.tsx most recently touched 2026-04-17 per Field 3 below) or convention #161 was written against a different point-in-time. Recording as observation, not verdict.

**Identifier 7: E2E test file and test count**
```
Glob pattern: tests/e2e/features/linked-steps-mastery.spec.ts
Hit: 1 — file exists.

Grep command: pattern=`^test\(|test\.describe\(|^\s+test\(`, path=`tests/e2e/features/linked-steps-mastery.spec.ts`, output_mode=content, -n=true
Hits: 7
  - line 261 | test A — Schema: all new columns and tables are queryable
  - line 313 | test B — Sequential practice_count: 3 practices auto-advances to next item
  - line 380 | test C — Sequential mastery: submit → approve → complete + next promotes
  - line 518 | test D — Mastery rejection resets mastery_status to practicing, NOT rejected
  - line 601 | test E — Randomizer draw_mode + defaults persist on lists + surprise uniqueness holds
  - line 657 | test F — practice_log accepts randomizer_item source + draw_id FK
  - line 712 | test G — task_template_steps accepts linked step columns
```
"7/7 E2E tests" claim — 7 test blocks present in the spec file (A–G). Passing-count claim ("passing") not independently verified this run (no E2E execution).

### Field 3 — Wiring check

**Callers / importers:**
- `usePractice` hooks are imported into `src/pages/Tasks.tsx:38` (see Field 2 identifier 6 block above — `useApproveMasterySubmission`, `useRejectMasterySubmission`, `useSubmitMastery` all imported).
- `SequentialCreator` (`src/components/tasks/sequential/SequentialCreator.tsx`) is the consumer wiring the defaults state through to `useCreateSequentialCollection` (per partition known-good); confirmed via the line 113-114 payload construction.
- `SequentialCollectionView` consumes `task.advancement_mode`, `task.practice_count`, `task.practice_target`, `task.mastery_status` on persisted `tasks` rows (Field 2 identifier 4 block).
- `TaskCard` receives `onSubmitMastery` as a prop — caller sites not enumerated in this packet (would require `grep onSubmitMastery`), flagged in Field 5.

**Execution-flow locations by file kind:**
- Migration file → Postgres migration.
- `usePractice.ts` → React Query hook module (TanStack Query).
- `SequentialCreator.tsx`, `SequentialCollectionView.tsx`, `TaskCard.tsx` → React components (client UI).
- `Tasks.tsx` → React page + embedded sub-component (`PendingApprovalsSection`).
- E2E spec → Playwright test file.

**Most recent touching commits:**
- Migration 100105: `207235e 2026-04-06 23:12:07 -0500 feat: Build J — Linked Routine Steps, Mastery & Practice Advancement (PRD-09A/09B Session 2)`.
- `src/hooks/usePractice.ts`: `2cd866c 2026-04-09 20:38:53 -0500 feat: Build M Sub-phase C — gamification write path wiring`.
- `src/pages/Tasks.tsx`: `70c2394 2026-04-17 15:23:45 -0500 feat(permissions): add Manage Tasks shortcut to ViewAs banner`.

Build J landed 2026-04-06, which matches the stub entry's "2026-04-06" date. Tasks.tsx has been touched since (2026-04-17 ViewAs feature) — a plausible reason for line numbers in convention #161 to have drifted.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention (line 57):**
> | Advancement modes (practice_count / mastery) | — | **Wired** | Build J (2026-04-06) |

One row confirming the capability and Build J attribution. No deeper wiring breakdown in WIRING_STATUS.md for this entry.

**Cross-PRD addendum:** `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md` — dedicated addendum for this feature. Selected quoted rows:
- Line 138: `| advancement_mode | TEXT | 'complete' | NOT NULL | Enum: 'complete', 'practice_count', 'mastery' |`
- Line 139: `| practice_target | INTEGER | | NULL | Required when advancement_mode = 'practice_count'. Number of completions needed. |`
- Line 141: `| mastery_status | TEXT | | NULL | Enum: 'practicing', 'submitted', 'approved', 'rejected'. NULL when advancement_mode != 'mastery'. |`
- Line 153-154: `default_advancement_mode` and `default_practice_target` on the collections-level side.
- Lines 173-182 describe the practice_count auto-advance behavior and the mastery submit→approve/reject lifecycle, including the "`mastery_status` reset to 'practicing'" convention (which matches convention #160).

**PlannedExpansionCard / stub UI:** not applicable — this is a wired infrastructure entry, not a demand-validation stub.

**CLAUDE.md convention mentions:**
- Convention #158 (line 355): names `tasks.advancement_mode` enum, documents per-item + collection-level defaults, `useCreateSequentialCollection` per-item overrides, and "Randomizer items (`list_items`) get the same 10 advancement columns for parity" — directly aligns with the dual-table migration body.
- Convention #159 (line 356): names `practice_log` as the unified session log; documents `useLogPractice` dual-writing to `practice_log` + `task_completions` with `completion_type='practice'` for sequential items. Adjacent to this entry; cross-references `practice_log` (which is the subject of registry entry 495).
- Convention #160 (line 357): documents mastery rejection resetting `mastery_status` to `'practicing'` (not `'rejected'`), via `useRejectMasterySubmission`. Directly matches the hook's documented behavior at `src/hooks/usePractice.ts:583`.
- Convention #161 (line 358): names `PendingApprovalsSection` in Tasks.tsx with the `completion_type='mastery_submit'` fork and `useApproveMasterySubmission` / `useRejectMasterySubmission` routing; also names `RandomizerMasteryApprovalInline` as the randomizer-side surface (unified cross-source mastery queue explicitly NOT built). Says "line 1062"; actual location is line 1585 — see drift note in Field 2 identifier 6 block.

### Field 5 — What was NOT checked

- **E2E execution:** the 7 test blocks in `linked-steps-mastery.spec.ts` were confirmed to exist but were NOT executed this run. The stub's "7/7 E2E tests passing" claim is structurally supported (7 test blocks) but the "passing" assertion is not independently verified.
- **Production DB schema state:** whether `ALTER TABLE ... ADD COLUMN IF NOT EXISTS advancement_mode` etc. actually ran against the live Supabase production DB was NOT verified. Would require live SQL access (out of scope for Scope 5). `live_schema.md` is present in the repo but not cross-referenced to this packet's column set.
- **Production row counts:** distribution of `mastery_status` values across live `tasks` and `list_items` rows NOT checked. Would need a Supabase query.
- **Caller breadth for `onSubmitMastery`:** `TaskCard` receives this prop from an unknown set of parents; the full caller set was NOT enumerated (would require `Grep onSubmitMastery` across `src/`).
- **Convention #161 line-number drift:** CLAUDE.md #161 says `PendingApprovalsSection` is at Tasks.tsx line 1062; actual location is line 1585. Recorded as observation; root cause (doc drift vs code movement vs convention authored against earlier snapshot) NOT investigated.
- **Convention #205 (randomizer mastery gap):** CLAUDE.md #205 documents that randomizer mastery approvals live outside the gamification pipeline as a known gap. Not directly part of entry 494's claim set; not re-verified here. Flagging per partition known-good expectations.
- **Semantic-search question NOT asked (mgrep blocked):** "Are there any callers of `advancement_mode` outside the sequential/list_items surface that might indicate additional wiring not named in the stub (e.g., dashboard widgets, LiLa context assembly, reports)?" — could not answer without mgrep per Convention 242.

### Field 6 — Observations (no verdict)

Registry line 494 claims `✅ Wired` with Build J attribution (2026-04-06) and lists seven implementation artifacts. Grep confirms each of the seven:
(1) migration `00000000100105_linked_steps_mastery_advancement.sql` adds the three advancement columns (`advancement_mode`, `practice_target`, `mastery_status`) with matching enums to BOTH `tasks` and `list_items`, plus collection-level defaults on `sequential_collections` and `lists`, plus partial indexes on `mastery_status` for both tables;
(2) `src/hooks/usePractice.ts` exports `useLogPractice`, `useSubmitMastery`, `useApproveMasterySubmission`, `useRejectMasterySubmission`, and `useMemberPracticeLog`;
(3) `SequentialCreator.tsx` has a state-managed defaults block with mode-selector buttons and conditional branches for practice_count and mastery;
(4) `SequentialCollectionView.tsx` renders per-task progress strings that switch on `advancement_mode` and `mastery_status`;
(5) `TaskCard.tsx` renders a "Submit as Mastered" button (Build J comment preserved at line 628);
(6) `PendingApprovalsSection` in `Tasks.tsx` imports the mastery hooks and forks on `completion_type === 'mastery_submit'`, but the sub-component is defined at line 1585 (not line 1062 as CLAUDE.md #161 states — a line-number drift noted but not verdict);
(7) `tests/e2e/features/linked-steps-mastery.spec.ts` contains 7 test blocks (A–G); structural count matches the stub but `passing` assertion was not re-run this session. CLAUDE.md conventions #158, #159, #160, #161 name the same columns, hooks, and fork behaviors. WIRING_STATUS.md (line 57) carries one confirmation row. PRD-09A-09B-Linked-Steps-Mastery-Advancement addendum documents the schema and lifecycle that the migration body implements.

---

## CALIBRATION APPROVED — Session 1 continuing

<!-- PROGRESS MARKER: calibration approved by founder, resuming at partition-table order (entry 28) — 2026-04-19 -->

Integrity check before batch A: STUB_REGISTRY.md = 547 lines, HALT absent.

---

## Entry 28 — `Tablet hub timeout config`

**Registry line:** 28
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Tablet hub timeout config | PRD-01 | PRD-22 | ✅ Wired | Phase 27 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Row names the capability "Tablet hub timeout config." Snake-case translation of the capability name → column `tablet_hub_timeout`. live_schema.md confirms the column exists on `families` (entry 13 on that table). Identifier chain stops at (a) by convention — the stub row's "config" terminology maps 1:1 to the snake_case column name, which is verifiable in live_schema.md.

Primary identifier: `tablet_hub_timeout` column on `families`.

### Field 2 — Code presence check

```
Grep command: pattern=`tablet_hub_timeout`, path=`supabase/migrations`, output_mode=content, -n=true
Hits: 7 lines across 2 migrations.
  - 00000000000001_auth_family_setup.sql:21  `tablet_hub_timeout INTEGER NOT NULL DEFAULT 300` (original creation)
  - 00000000000019_schema_remediation_batch2.sql:264-279  SECTION 7 remediation: ALTER COLUMN TYPE TEXT, SET DEFAULT 'never', ADD CHECK CONSTRAINT with enum ('never','15min','30min','1hr','4hr')
```

Column was introduced as INTEGER seconds and remediated to a TEXT enum. Both the creation and remediation exist in applied migrations.

### Field 3 — Wiring check

- Callers: prds/ai-vault/PRD-22-Settings.md mentions the column as a user-configurable setting; runtime UI wiring not confirmed via this grep scope.
- Execution-flow location: DB column on `families`, plus a PRD referencing it as a Settings UI element.
- Most recent touching commit for creation migration: `769a039 2026-03-23` (auth_family_setup). Remediation migration: not re-grepped for commit date in this batch.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no match for `tablet_hub_timeout` (infrastructure column, not a routing destination).
- **CLAUDE.md:** no convention names this column by its exact identifier.
- **live_schema.md:** `tablet_hub_timeout` listed as column 13 on `families`.
- **PRD / addenda:** PRD-01 (Auth Family Setup) declares the column; PRD-22 (Settings) is the stub's "Wired By" and is where the UI exposure is described.
- **PlannedExpansionCard:** not applicable.

### Field 5 — What was NOT checked

- Whether a Settings-UI React component actually exposes the timeout picker to mom (would require grep for `tablet_hub_timeout` in `src/` which did not return any `src/` hits).
- Whether production DB row values for this column have been backfilled to the new TEXT enum values or still contain legacy INTEGER-stringified values.
- Live enforcement of the timeout on hub pages (client-side logout timer behavior).

### Field 6 — Observations (no verdict)

Column `tablet_hub_timeout` exists on `families` in live_schema. Creation migration (00000000000001) and remediation migration (00000000000019) both present in the tree, with the remediation converting INTEGER→TEXT enum and adding a CHECK constraint. No `src/` grep hits were returned during discovery — a Settings-UI surface is referenced by PRD-22 but not independently verified in source by this packet. Registry row claims `✅ Wired` at Phase 27.

---

## Entry 32 — `View As sessions`

**Registry line:** 32
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| View As sessions | PRD-02 | PRD-02 | ✅ Wired | Phase 02 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Capability name "View As sessions" maps directly to `view_as_sessions` (snake_case). live_schema.md confirms the table (143 rows). Identifier at (a).

Primary identifier: `view_as_sessions` table.

### Field 2 — Code presence check

```
Grep command: pattern=`view_as_sessions`, output_mode=files_with_matches
Hits: 12 files including migrations, live_schema.md, ViewAsProvider.tsx, feature_glossary.md, dump scripts.
Creation: supabase/migrations/00000000000002_permissions_access_control.sql:65  `CREATE TABLE public.view_as_sessions (`  (preceded by comment at line 63 "view_as_sessions (mom's View As tracking)").
Client wiring: src/lib/permissions/ViewAsProvider.tsx (contains references).
```

### Field 3 — Wiring check

- Callers: `src/lib/permissions/ViewAsProvider.tsx` is the primary client wiring site.
- Execution-flow location: DB table + React provider context that reads/writes session rows.
- Most recent touching commit for creation migration (00000000000002): `e137350 2026-03-23 15:12:03`.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no direct row for "View As sessions" (not a routing destination).
- **CLAUDE.md convention #39 (line 193):** names `ViewAsShellWrapper`, `ViewAsBanner`, `ViewAsMemberPicker` as the UI components; does not name the DB table but the capability flow is documented.
- **live_schema.md:** `view_as_sessions` — 143 rows with columns `viewer_id`, `viewing_as_id`, `started_at`, `ended_at`.
- **feature_glossary.md:** lists `view_as_sessions` under PRD-02 permission-related tables.

### Field 5 — What was NOT checked

- Whether `ViewAsProvider.tsx` actually writes rows on View As activation (behavior-level verification requires reading the provider).
- Whether RLS policies on `view_as_sessions` match the PRD-02 design.
- Session cleanup/expiry logic (stale rows with NULL `ended_at`).

### Field 6 — Observations (no verdict)

`view_as_sessions` table exists in live_schema (143 rows), created in migration 00000000000002, wired on the client via `ViewAsProvider.tsx`. CLAUDE.md #39 describes the surrounding UI components (`ViewAsShellWrapper`, `ViewAsBanner`, `ViewAsMemberPicker`). Registry claims `✅ Wired` at Phase 02.

---

## Entry 34 — `View As feature exclusions`

**Registry line:** 34
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| View As feature exclusions | PRD-02 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** "View As feature exclusions" → `view_as_feature_exclusions` (snake_case). live_schema lists 58 rows. Identifier at (a).

Primary identifier: `view_as_feature_exclusions` table.

### Field 2 — Code presence check

```
Grep command: pattern=`view_as_feature_exclusions`, output_mode=files_with_matches
Hits: 8 files including migrations, live_schema, ViewAsProvider.tsx, dump scripts, AUDIT-REPORT.md.
Creation: supabase/migrations/00000000100028_prd02_repair.sql:220  `CREATE TABLE IF NOT EXISTS view_as_feature_exclusions (`
Index: line 230 `CREATE INDEX IF NOT EXISTS idx_vafe_session ON view_as_feature_exclusions (session_id);`
Client wiring: src/lib/permissions/ViewAsProvider.tsx.
```

### Field 3 — Wiring check

- Callers: `ViewAsProvider.tsx` reads/writes exclusions per-session.
- Execution-flow location: DB table with composite-index + React provider reading per-session exclusions.
- Most recent touching commit for creation migration: `f91fc7e 2026-03-24 21:36:35` (PRD-02 Repair bundle).

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no dedicated row.
- **CLAUDE.md:** no convention names this table by identifier.
- **live_schema.md:** `view_as_feature_exclusions` — 58 rows with `session_id`, `feature_key`, `created_at`.
- **feature-decisions/PRD-02-repair.md:** lists the table as part of the repair scope.

### Field 5 — What was NOT checked

- Whether exclusions are correctly filtered on mom's writes during View As sessions (behavior).
- Whether the 58 rows represent genuine usage or seed/test data.

### Field 6 — Observations (no verdict)

`view_as_feature_exclusions` created in migration 100028 (PRD-02 Repair 2026-03-24); live_schema reports 58 rows. Referenced by `ViewAsProvider.tsx` on the client. feature-decisions/PRD-02-repair.md captures the scope. Registry claims `✅ Wired` under Repair 2026-03-25.

---

## Entry 36 — `Shift schedule config`

**Registry line:** 36
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Shift schedule config | PRD-02 | PRD-35 (access_schedules) | ✅ Wired | Phase 05 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** The "Wired By" column explicitly names `access_schedules` as the implementation mechanism. Identifier at (a) directly.

Primary identifier: `access_schedules` table.

### Field 2 — Code presence check

```
Grep command: pattern=`CREATE TABLE.*access_schedules|access_schedules \(`, path=`supabase/migrations`, output_mode=content, -n=true
Hits: 2
  - 00000000000004_universal_scheduler.sql:13  `CREATE TABLE public.access_schedules (`
  - 00000000000019_schema_remediation_batch2.sql:5  remediation comment: "PRD-35: Fix access_schedules (missing columns, enum fix)"
```

Broader grep also found 15 files total referencing the table (live_schema, CLAUDE.md, RLS-VERIFICATION.md, PRD-35, schedulerUtils.ts, PRD-27, etc.).

### Field 3 — Wiring check

- Callers: `src/components/scheduling/schedulerUtils.ts` references the table; PRD-35 Universal Scheduler and PRD-27 Caregiver Tools both cite it.
- Execution-flow location: DB table, used by Universal Scheduler (PRD-35) and Special Adult access (PRD-02/PRD-27).
- Most recent touching commit (creation migration 00000000000004): not re-checked in this batch but within the 2026-03-23 bundle per the batch-A git log above. Remediation touched via migration 19 (0416eca-era).

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no routing-table row, but the table is referenced as infrastructure in scheduling flows.
- **CLAUDE.md convention #26 (Universal Scheduler section):** `access_schedules` replaces `shift_schedules` for Special Adult / co-parent access windows.
- **live_schema.md:** `access_schedules` — 0 rows, columns `schedule_type`, `recurrence_details` (RRULE JSONB), `schedule_name`, `start_time`, `end_time`, `is_active`.
- **PRD-35:** Universal Scheduler explicitly designates this as the storage table for access windows.

### Field 5 — What was NOT checked

- Whether the production DB actually has no rows (live_schema says 0 — possibly consistent with no Special Adults having been onboarded yet).
- Whether `recurrence_details` JSONB is being correctly populated by the Universal Scheduler on writes.
- RLS policy verification.

### Field 6 — Observations (no verdict)

`access_schedules` table created in migration 00000000000004 (Universal Scheduler) and remediated in migration 19 per PRD-35. CLAUDE.md #26 names it as the replacement for `shift_schedules`. live_schema shows the table exists with expected columns but 0 rows. Registry claims `✅ Wired` at Phase 05 with explicit attribution to PRD-35.

---

## Entry 37 — `PIN lockout (server-side)`

**Registry line:** 37
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PIN lockout (server-side) | PRD-01 | PRD-02 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** "PIN lockout (server-side)" — does not directly name a DB identifier, but CLAUDE.md #38 (line 192) spells it out as "`verify_member_pin` RPC" + columns `pin_failed_attempts`, `pin_locked_until` on `family_members`. This is level (c) — CLAUDE.md convention — but the convention was opportunistically read.

Primary identifiers: `verify_member_pin` RPC; `pin_failed_attempts` column; `pin_locked_until` column.

### Field 2 — Code presence check

```
Grep command: pattern=`verify_member_pin|pin_failed_attempts|pin_locked_until`, output_mode=files_with_matches
Hits: 15 files (head-limited). Core migrations:
  - 00000000000010_auth_rpcs_fix.sql:36  `CREATE OR REPLACE FUNCTION public.verify_member_pin(p_member_id UUID, p_pin TEXT)`
  - 00000000000016_family_setup_remediation.sql:91  CREATE OR REPLACE FUNCTION (v2)
  - 00000000000020_permissions_remediation_ui.sql:18  CREATE OR REPLACE FUNCTION (v3)
  - 00000000100070_fix_hash_member_pin_column.sql:44  CREATE OR REPLACE FUNCTION (v4 — latest)
Client wiring: src/pages/auth/FamilyLogin.tsx, src/components/hub/HubMemberAuthModal.tsx.
```

First-context window (migration 100070, lines 60-97) — latest body of the RPC:

- Checks `pin_locked_until > now()` → returns `{success: false, reason: 'locked', locked_until, remaining_seconds}`.
- On success: resets `pin_failed_attempts = 0` and `pin_locked_until = NULL`.
- On failure: increments `pin_failed_attempts`, sets `pin_locked_until = now() + interval '15 minutes'` when count ≥ 5.
- Returns `attempts_remaining` on wrong_pin.

This body matches CLAUDE.md #38's claim ("5 failures → 15-minute lockout" + JSONB shape `{success, reason, attempts_remaining, locked_until, remaining_seconds}`).

### Field 3 — Wiring check

- Callers: `FamilyLogin.tsx` and `HubMemberAuthModal.tsx` call `verify_member_pin` RPC.
- Execution-flow location: Postgres RPC (SECURITY DEFINER) + two React UI sites.
- Most recent touching commit for latest body (migration 100070): `5fb2191 2026-03-31 22:16:31`.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no row (server-side RPC, not a routing destination).
- **CLAUDE.md convention #17 (line 144):** names `hash_member_pin` and `verify_member_pin` RPCs as the canonical PIN surface.
- **CLAUDE.md convention #38 (line 192):** details the lockout behavior, return shape, columns.
- **live_schema.md:** `family_members` table lists `pin_hash`, `pin_failed_attempts`, `pin_locked_until` columns.
- **audit/AUDIT_FINDINGS.md** and **AUDIT-REPORT.md** reference the function.

### Field 5 — What was NOT checked

- Whether the RPC is actually invoked by the FamilyLogin happy-path (not just present in the source — would require reading the call site).
- Whether the column-level lockout timestamps are being correctly interpreted in the user's local timezone on the UI side.
- Whether a failure-mode simulation (5 wrong PINs → locked) was executed against staging/production recently.

### Field 6 — Observations (no verdict)

`verify_member_pin` RPC exists in four `CREATE OR REPLACE` revisions across migrations 10, 16, 20, and 100070; migration 100070 (2026-03-31) is the latest. The latest body implements the lockout behavior described in CLAUDE.md #38 (5-fail threshold, 15-minute lockout, failure-count reset on success, JSONB return shape). Client sites `FamilyLogin.tsx` and `HubMemberAuthModal.tsx` reference the RPC. Columns `pin_failed_attempts` and `pin_locked_until` are on `family_members`. Registry claims `✅ Wired` in Remediation.

---

## Entry 38 — `Default permission auto-creation`

**Registry line:** 38
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Default permission auto-creation | PRD-02 | PRD-02 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Capability "default permission auto-creation" — no identifier in row text itself. **(c) CLAUDE.md convention #41 (line 195):** names `trg_fm_auto_permissions` trigger on `family_members` insert of `additional_adult`. Identifier at (c).

Primary identifier: `trg_fm_auto_permissions` trigger (plus its trigger function, typically `auto_create_member_permissions`).

### Field 2 — Code presence check

```
Grep command: pattern=`trg_fm_auto_permissions|auto_create_member_permissions`, path=`supabase/migrations`, output_mode=content, -n=true
Hits: 2
  - 00000000000020_permissions_remediation_ui.sql:122  `DROP TRIGGER IF EXISTS trg_fm_auto_permissions ON public.family_members;`
  - 00000000000020_permissions_remediation_ui.sql:123  `CREATE TRIGGER trg_fm_auto_permissions`
```

Trigger lives entirely in migration 00000000000020 (Permissions Remediation UI).

### Field 3 — Wiring check

- Callers: none at the application layer — Postgres trigger fires automatically on `family_members` INSERT.
- Execution-flow location: DB trigger.
- Most recent touching commit: `1200b3f 2026-03-24 14:17:52` (permissions_remediation_ui migration).

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no row (trigger, not a routing destination).
- **CLAUDE.md convention #41 (line 195):** names `trg_fm_auto_permissions`, describes the `additional_adult` insert trigger, states "Grants `view` level for basic features to all children."
- **live_schema.md:** no explicit trigger-level entry (triggers not enumerated), but `member_permissions` has 168 rows suggesting active writes.

### Field 5 — What was NOT checked

- The trigger function body itself (grep found only the CREATE TRIGGER line; the function definition it references was not re-opened in this packet).
- Whether current `member_permissions` row distribution matches what the trigger would produce.
- Whether the trigger is presently ENABLED on production DB.

### Field 6 — Observations (no verdict)

Trigger `trg_fm_auto_permissions` is created in migration 00000000000020 with a preceding DROP IF EXISTS. CLAUDE.md #41 describes its intent (auto-grant view-level on `additional_adult` insert). Grep returned only the two trigger-management lines in that migration — the associated function definition was NOT independently confirmed in this packet (flagged in Field 5). `member_permissions` table has 168 rows in live_schema. Registry claims `✅ Wired` in Remediation.

---

## Entry 39 — `Emergency lockout toggle`

**Registry line:** 39
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Emergency lockout toggle | PRD-02 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Capability "Emergency lockout toggle" → column `emergency_locked` (per live_schema on `family_members`). Identifier at (a) by snake-case translation, confirmed at (b.5)-level via migration grep below.

Primary identifier: `emergency_locked` BOOLEAN column on `family_members`.

### Field 2 — Code presence check

```
Grep command: pattern=`emergency_locked`, path=`supabase/migrations`, output_mode=content, -n=true
Hits: 3
  - 00000000100028_prd02_repair.sql:213  `ADD COLUMN IF NOT EXISTS emergency_locked BOOLEAN NOT NULL DEFAULT false;`
  - 00000000100028_prd02_repair.sql:32   RPC gate: `IF COALESCE(v_member.emergency_locked, false) THEN`
  - 00000000100028_prd02_repair.sql:33   RPC gate: `RETURN jsonb_build_object('allowed', false, 'blockedBy', 'emergency_locked');`
```

Column introduced by migration 100028 (PRD-02 Repair) and referenced by a feature-access gate RPC in the same migration.

### Field 3 — Wiring check

- Callers: the in-migration RPC at lines 32-33 (feature-access check) consumes the flag. UI site: `src/pages/PermissionHub.tsx` (from the batch-A Grep filelist above).
- Execution-flow location: DB column + DB-side access gate + PermissionHub UI.
- Most recent touching commit (migration 100028): `f91fc7e 2026-03-24 21:36:35`.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no row.
- **CLAUDE.md:** no convention names `emergency_locked` by identifier (adjacent to #38 PIN lockout but distinct).
- **live_schema.md:** `emergency_locked` listed as column 42 on `family_members`.
- **feature-decisions/PRD-02-repair.md:** includes the column as part of repair scope.

### Field 5 — What was NOT checked

- Whether the PermissionHub UI actually exposes a toggle mom can flip and persists the change.
- Whether the RPC gate at migration 100028 lines 32-33 is the canonical gate site for ALL protected actions (or just one of many).
- Distribution of `emergency_locked = true` rows in production.

### Field 6 — Observations (no verdict)

`emergency_locked` column added to `family_members` in migration 100028 (PRD-02 Repair, 2026-03-24). Same migration contains an RPC that checks the flag and returns `blockedBy: 'emergency_locked'`. `PermissionHub.tsx` references the identifier. Registry claims `✅ Wired` in Repair 2026-03-25.

---

## Entry 40 — `Permission profiles → Layer 3`

**Registry line:** 40
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Permission profiles → Layer 3 | PRD-02/PRD-31 | PRD-02 Repair | ✅ Wired | Repair 2026-03-25 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** "Permission profiles" → `permission_level_profiles` table (snake-case, live_schema confirms 164 rows). Identifier at (a). "Layer 3" refers to the permission resolution layer documented in PRD-02/PRD-31 addenda; not a separate code identifier.

Primary identifier: `permission_level_profiles` table.

### Field 2 — Code presence check

```
Grep command: pattern=`CREATE TABLE.*permission_level_profiles|permission_level_profiles \(`, path=`supabase/migrations`, output_mode=content, -n=true
Creation: 00000000000012_permission_profiles.sql:6  `CREATE TABLE IF NOT EXISTS permission_level_profiles (`
Seed inserts: lines 26, 107, 176, 205, 227 (five INSERT batches into `permission_level_profiles`).

Broader grep (files_with_matches): 7 files including 00000000100028 (PRD-02 Repair), dump scripts, PRD-31 Permission Matrix addendum, live_schema, AUDIT_FINDINGS.
```

### Field 3 — Wiring check

- Callers: referenced by PRD-02 Repair migration (100028) and AUDIT_FINDINGS. UI wiring not confirmed by this batch.
- Execution-flow location: DB table with seed data; consumed by permission-resolution logic (per PRD-31 Permission Matrix addendum).
- Most recent touching commit (creation migration 00000000000012): `0416eca 2026-03-23 19:38:09`.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no row.
- **CLAUDE.md:** no convention names `permission_level_profiles` by identifier. Convention #10 ("During beta: useCanAccess returns true for everything") is thematically adjacent.
- **live_schema.md:** `permission_level_profiles` — 164 rows.
- **prds/addenda/PRD-31-Permission-Matrix-Addendum.md:** the authoritative design doc for the profile-layer resolution.
- **audit/AUDIT_FINDINGS.md:** referenced in audit context.

### Field 5 — What was NOT checked

- Whether `useCanAccess` / permission-resolver code in `src/lib/permissions/` actually queries `permission_level_profiles` as the Layer-3 source.
- Whether all 164 seeded rows match the PRD-31 Permission Matrix addendum.
- Whether the "Layer 3" terminology in the stub matches the PRD-31 addendum's layer numbering.

### Field 6 — Observations (no verdict)

`permission_level_profiles` table created in migration 00000000000012 (2026-03-23) with 5 seed INSERT batches. live_schema reports 164 rows. Referenced in PRD-02 Repair migration 100028 and PRD-31 Permission Matrix addendum. Registry claims `✅ Wired` under PRD-02 Repair (2026-03-25); the seed loader migration predates the repair by 2 days.

---

Integrity check after batch A: STUB_REGISTRY.md = 547 lines (re-verified via `wc -l` between packet writes), HALT absent.

<!-- PROGRESS MARKER: batch A complete (entries 28, 32, 34, 36, 37, 38, 39, 40 — 8 packets), moving to batch B at next grep round -->

---

Integrity check before batch B: STUB_REGISTRY.md = 547 lines, HALT absent.

## Entry 74 — `Privacy Filtered category`

**Registry line:** 74
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Privacy Filtered category | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** "Privacy Filtered category" — no direct identifier in row text. **(c) CLAUDE.md convention #76 (line 248):** names `is_privacy_filtered = true` as the HARD system constraint flag, enforced in context assembly pipeline. Identifier at (c).

Primary identifier: `is_privacy_filtered` boolean column (on `archive_context_items` per live_schema) + the `privacy-filter.ts` shared helper in Edge Functions.

### Field 2 — Code presence check

```
Grep command: pattern=`is_privacy_filtered`, output_mode=files_with_matches
Hits: 15 files including:
  - CLAUDE.md (convention #76)
  - claude/live_schema.md (column on archive_context_items)
  - supabase/migrations/00000000100149_archive_context_items_privacy_rls.sql (RLS enforcement)
  - supabase/functions/_shared/context-assembler.ts
  - supabase/functions/_shared/privacy-filter.ts (helper with applyPrivacyFilter())
  - .github/workflows/check-convention-76.yml (CI guard)
```

Code-path sample (privacy-filter.ts):
```
line 4   Convention #76 (CLAUDE.md): `is_privacy_filtered = true` items are NEVER ...
line 40  Conditionally appends .eq('is_privacy_filtered', false) to a Supabase
line 55  return query.eq('is_privacy_filtered', false)
```

### Field 3 — Wiring check

- Callers: `context-assembler.ts` (LiLa context pipeline).
- Execution-flow location: column on `archive_context_items` + RLS migration + shared Edge Function helper + CI convention-check workflow.
- Most recent touching commit for RLS migration 100149: `a11a456 2026-04-17 22:00:03` (recent).

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no direct row (infrastructure filter, not a routing destination).
- **CLAUDE.md #58 (line 221) and #76 (line 248):** both explicitly describe the privacy-filtered behavior.
- **live_schema.md:** `archive_context_items` column 9 is `is_privacy_filtered`.
- **GitHub Actions workflow:** `.github/workflows/check-convention-76.yml` exists as a CI guard for this convention.
- **PRD-13 / PRD-40:** PRD-13 introduces the concept; PRD-40 (COPPA Compliance) also references it.

### Field 5 — What was NOT checked

- Whether the CI workflow `check-convention-76.yml` currently passes on `main`.
- Whether ALL tables that should carry `is_privacy_filtered` actually have the column (live_schema has it on `archive_context_items` only — verification for other context tables not done in this packet).
- Whether the RLS migration 100149 policies actually deny SELECT for non-mom on `is_privacy_filtered=true` rows (policy body not inspected).

### Field 6 — Observations (no verdict)

`is_privacy_filtered` boolean flag exists on `archive_context_items` (live_schema), enforced by a dedicated RLS migration (00000000100149, most recently touched 2026-04-17), filtered in `supabase/functions/_shared/privacy-filter.ts`, called from `context-assembler.ts`, and backed by a CI convention-check workflow. CLAUDE.md #76 names it a "HARD system constraint." Registry claims `✅ Wired` at Phase 13 (PRD-13).

---

## Entry 88 — `Family-level GuidingStars`

**Registry line:** 88
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Family-level GuidingStars | PRD-06 | PRD-12B | ✅ Wired | Phase 22 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Capability "Family-level GuidingStars" — no direct identifier. **(d.5) Bounded source-code lookup:** live_schema.md lists `owner_type` as column 12 on `guiding_stars`. Migration 00000000100034 grep confirms `ALTER TABLE guiding_stars ADD COLUMN IF NOT EXISTS owner_type TEXT NOT NULL DEFAULT 'member'` at line 11. Identifier at (d.5) via opportunistic migration grep.

Primary identifier: `owner_type` TEXT column on `guiding_stars` (supports 'family' value for family-scoped stars, in addition to default 'member').

### Field 2 — Code presence check

```
Grep command: pattern=`CREATE TABLE public\.guiding_stars|ALTER TABLE.*guiding_stars.*owner_type`, path=`supabase/migrations`, output_mode=content, -n=true
Hits: 2
  - 00000000000005_personal_growth_foundation.sql:9  `CREATE TABLE public.guiding_stars (` (original, no owner_type column)
  - 00000000100034_prd06_prd07_personal_growth_repair.sql:11  ALTER TABLE ADD owner_type DEFAULT 'member' + index on (family_id, owner_type, archived_at) at line 34.
```

Migration 100034 added `owner_type` without a CHECK constraint; 'family' is therefore a permitted value but not enforced as part of an enum at the DB level.

### Field 3 — Wiring check

- Callers: UI-layer writes of rows with `owner_type = 'family'` were NOT verified in this packet (would require grep of `src/**` for the literal).
- Execution-flow location: DB column + supporting index.
- Most recent touching commit (migration 100034): not re-checked in this batch.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no direct row.
- **CLAUDE.md:** no convention names `owner_type` on `guiding_stars` by identifier. Family Vision Quest (PRD-12B) is the PRD that would produce family-level stars.
- **live_schema.md:** `guiding_stars` column 12 = `owner_type`.
- **PRD-12B:** stub row's "Wired By" — Family Vision Quest PRD. PRD-12B grep for "family_vision_statements" or "family_vision_quests" returned ONLY migration 00000000000007_lila_ai_system.sql (a single reference — likely comment/doc content, not a CREATE TABLE). **Neither `family_vision_quests` nor `family_vision_statements` appears to have been created as a table in any migration.** This is a possible gap between the stub's "Wired By PRD-12B" attribution and the migration set — recorded as observation.

### Field 5 — What was NOT checked

- Whether any UI surface actually writes `guiding_stars` rows with `owner_type = 'family'`.
- Whether PRD-12B (Family Vision Quest) has been built at all — the single reference in migration 7 is likely incidental, not a schema creation. No family_vision_* tables found in migration grep.
- Whether `owner_type` should have a CHECK constraint (live_schema shows no CHECK; migration 100034 did not add one).
- Distribution of `owner_type` values in the 27 live rows on `guiding_stars` (how many are 'family' vs 'member').

### Field 6 — Observations (no verdict)

`owner_type` column exists on `guiding_stars` via migration 00000000100034 (PRD-06/07 repair). Default is 'member'; 'family' is a permitted value but not CHECK-enforced. The stub attributes wiring to PRD-12B (Family Vision Quest), but grep for `family_vision_statements`/`family_vision_quests` found only one incidental migration reference and no CREATE TABLE statement — PRD-12B appears not to have been fully built against the migration set. Whether family-level GuidingStars rows are produced by any UI flow was NOT verified in this packet. Registry claims `✅ Wired` at Phase 22 (PRD-12B).

---

## Entry 133 — `My Circle folder type — non-family contacts`

**Registry line:** 133
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| My Circle folder type — non-family contacts | PRD-13 | — | 📌 Post-MVP | People & Relationships PRD |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** "My Circle folder type" maps to an enum value on `archive_folders.folder_type` (per live_schema). **(c) CLAUDE.md:** no convention names a 'my_circle' value. **(d) PRD-13:** grep found one reference in PRD-13. No code-level identifier surfaced in the migration set.

Identifier: CAPABILITY-ONLY. Candidate value `'my_circle'` for `archive_folders.folder_type` is mentioned only in PRD-13 documentation.

### Field 2 — Code presence check

```
Grep command: pattern=`my_circle`, output_mode=files_with_matches
Hits: 1
  - prds/personal-growth/PRD-13-Archives-Context.md (PRD text)
```

No migration, no source file, no hook references `my_circle`. The enum value does not exist in the current migration set.

### Field 3 — Wiring check

Skipped — no code presence.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no row.
- **CLAUDE.md:** no mention.
- **PRD-13:** documents My Circle as a planned folder type; status aligns with the stub's `📌 Post-MVP`.
- **"People & Relationships PRD":** the stub's Build Phase column names a future PRD; not confirmed to exist as a document.

### Field 5 — What was NOT checked

- Whether `archive_folders.folder_type` has a CHECK constraint that would need amendment to permit `'my_circle'`.
- Whether the stub row 197 (My Circle non-family contacts) is the same capability or a distinct UI surface — text suggests overlap; founder synthesis may want to treat these as linked.

### Field 6 — Observations (no verdict)

No migration, code, or hook references `my_circle` as an identifier. Only reference is in PRD-13 documentation. Stub status `📌 Post-MVP` aligns with grep absence.

---

## Entry 163 — `Meeting templates in AI Vault for community sharing`

**Registry line:** 163
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Meeting templates in AI Vault for community sharing | PRD-16 (Build P) | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** No identifier named. Capability is "meeting templates shared via AI Vault." Migration grep for `meeting_templates.*vault|meeting.*ai[-_]vault` (case-insensitive) returned zero files. PRD-16 Build P exists (meetings_phase 2026-04-16 per CLAUDE.md and recent builds); `meeting_templates` table does exist (per feature_glossary.md PRD-16 row) but no AI Vault integration identifier found.

Identifier: CAPABILITY-ONLY — no code identifier found for the AI Vault sharing surface.

### Field 2 — Code presence check

```
Grep command: pattern=`meeting_templates.*vault|meeting.*ai[-_]vault`, output_mode=files_with_matches, -i=true
Hits: 0
```

Skipped further greps — no identifier to target.

### Field 3 — Wiring check

Skipped — no code presence for the AI Vault integration aspect.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no row.
- **CLAUDE.md:** no convention mentions AI-Vault-hosted meeting templates.
- **PRD-16 / Build P:** Build P (PRD-16 Meetings) signed off 2026-04-16 per `.claude/rules/current-builds/IDLE.md`. Vault sharing was not part of Build P scope based on Build P completion notes.
- **AI Vault PRDs (PRD-21A/B/C):** no explicit mention of meeting-template content type.

### Field 5 — What was NOT checked

- Whether the `vault_items.content_type` enum would need extension to support meeting templates.
- Whether any existing vault items are tagged as meeting-template-like content.
- **Semantic-search question (mgrep blocked):** "Is there any reference anywhere in the codebase to the concept of sharing meeting templates between families, even without naming the AI Vault?"

### Field 6 — Observations (no verdict)

Zero grep hits for the AI-Vault-meeting-template integration. Stub status `📌 Post-MVP` aligns with grep absence. `meeting_templates` table exists (Build P, 2026-04-16) but its AI Vault sharing surface is not built.

---

## Entry 173 — `Studio rhythm template library`

**Registry line:** 173
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Studio rhythm template library | PRD-18 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** No identifier. **(d) PRD-18:** grep for `rhythm_config_templates|studio.*rhythm|rhythm_template` returned 6 hits — migration 00000000100103_rhythms_foundation.sql, PRD-18, and Build I/K/N completion docs. The rhythms_foundation migration creates `rhythm_configs` (not a template library). Feature_glossary lists no explicit `rhythm_templates` table.

Identifier: CAPABILITY-ONLY — no separate "rhythm template library" table or Studio integration identifier found. `rhythm_configs` is the member-level config table; a Studio-side template catalog for rhythms does not appear to exist.

### Field 2 — Code presence check

```
Grep command: pattern=`rhythm_config_templates|studio.*rhythm|rhythm_template`, output_mode=files_with_matches
Hits: 6 (all are PRD-18 build docs or the rhythms_foundation migration with no Studio template table)
  - supabase/migrations/00000000100103_rhythms_foundation.sql  (rhythm_configs table, not a Studio template)
  - prds/daily-life/PRD-18-Rhythms-Reflections.md
  - .claude/completed-builds/2026-04/build-i/k/n files
  - claude/feature-decisions/PRD-18-Rhythms-Reflections.md
```

No `rhythm_template` or `rhythm_config_templates` CREATE TABLE statement.

### Field 3 — Wiring check

Skipped — no Studio-side template table.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no row.
- **CLAUDE.md:** no convention. Convention #168-189 describe rhythm behaviors but name no Studio template library.
- **PRD-18:** documents the concept as future work.
- **feature_glossary.md PRD-18 row:** lists `rhythm_configs`, `rhythm_completions`, `reflection_prompts`, `reflection_responses` — no template-library table.

### Field 5 — What was NOT checked

- Whether the existing `rhythm_configs` could be repurposed as a template source (the stub's capability might imply this extension rather than a new table).
- Whether the Studio page `src/pages/Studio.tsx` has any rhythm-related tabs or template buckets.

### Field 6 — Observations (no verdict)

No `rhythm_template` / `rhythm_config_templates` table in migrations. `rhythm_configs` exists but is member-level, not a Studio template catalog. Stub status `📌 Post-MVP` aligns with grep absence.

---

## Entry 194 — `PRD-18 Phase D: Independent Teen tailored rhythm experience`

**Registry line:** 194
**Claimed status:** `✅ Wired 2026-04-07`
**Full registry row (long — key claims):**
```
| PRD-18 Phase D: Independent Teen tailored rhythm experience | PRD-18 Phase B (Build K) | PRD-18 Phase D (Build N) | ✅ Wired 2026-04-07 | Teen morning (7 sections) + evening (8 sections, section_order_locked) with "Morning Check-in"/"Evening Check-in" display names, reflection_guideline_count=2, MindSweepLiteTeenSection with 4-option dropdown (Schedule/Journal about it/Talk to someone/Let it go), 15 teen morning insight questions, 3 teen feature discovery entries, talk_to_someone disposition writing private journal reminders (NEVER family_requests). Migration 100114 seeded teen content and forked auto_provision_member_resources. |
```

### Field 1 — Implementation identifier

**(a) Stub entry — multi-identifier.** Migration `00000000100114_rhythms_phase_d_teen.sql` is directly named. Additional identifiers in row text: `auto_provision_member_resources` fork, `reflection_guideline_count=2`, "Morning Check-in"/"Evening Check-in" display names, `MindSweepLiteTeenSection` component, `talk_to_someone` disposition, "15 teen morning insight questions", "3 teen feature discovery entries." Identifier at (a).

Primary identifiers:
- Migration: `supabase/migrations/00000000100114_rhythms_phase_d_teen.sql`.
- Trigger fork: `auto_provision_member_resources` (teen branch).
- Component: `MindSweepLiteTeenSection` (per CLAUDE.md #192).
- Seeded data: teen morning insight questions (`morning_insight_questions` with `audience='teen'`); teen feature discovery entries (`feature_discovery_pool` content).
- Disposition: `talk_to_someone` (per CLAUDE.md #192-193).

### Field 2 — Code presence check

```
Glob: supabase/migrations/00000000100114_rhythms_phase_d_teen.sql — 1 hit.
Git log: 69510b2 2026-04-07 19:50:06  (matches claimed date).
```

CLAUDE.md conventions #189, #190, #191, #192, #193, #194, #195, #196, #197 (all in the Phase D range) document the teen rhythm architecture in detail; each names one or more of the above identifiers. Conventions referencing this entry's claims:
- #190: display names "Morning Check-in"/"Evening Check-in" seeded by `auto_provision_member_resources` teen branch.
- #191: teen morning 7 sections, evening 8 sections, `reflection_guideline_count=2`.
- #192: MindSweepLiteTeenSection separate component (not prop-fork).
- #193: `talk_to_someone` writes private `journal_entries` with `visibility='private'`, NEVER `family_requests`.
- #194: teen morning insight questions live in `morning_insight_questions` with `audience='teen'`.
- #195: teen Feature Discovery pool uses `audiences: ['teen']`.
- #196: adult Phase C code paths frozen for Phase D.
- #197: teen `family_request` is opt-in only.

### Field 3 — Wiring check

- Callers: `MindSweepLiteTeenSection` is consumed by `SectionRendererSwitch` per CLAUDE.md #192.
- Execution-flow location: DB migration (seed + trigger fork) + teen-specific React components.
- Most recent touching commit (migration 100114): `69510b2 2026-04-07 19:50:06` — matches stub's `✅ Wired 2026-04-07` claim exactly.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no routing-table row.
- **CLAUDE.md:** 9 conventions (#189-197) cover teen rhythm in detail.
- **`.claude/completed-builds/2026-04/build-n-prd-18-phase-d-teen-rhythm.md`:** dedicated completion record per `IDLE.md`.
- **PRD-18-Rhythms-Reflections.md + addenda:** Phase D design.

### Field 5 — What was NOT checked

- Body of migration 100114 not fully inspected in this packet; seed row counts (15 teen questions, 3 feature discovery entries) not independently counted.
- `MindSweepLiteTeenSection` component source not opened (only referenced via CLAUDE.md conventions).
- Whether the `auto_provision_member_resources` teen branch has been tested against an actual `independent` insert.
- Whether `talk_to_someone` items are being written with `visibility='private'` per #193 — behavior not re-verified.

### Field 6 — Observations (no verdict)

Migration 00000000100114_rhythms_phase_d_teen.sql exists, committed `69510b2` on 2026-04-07 (matches the registry row's "Wired 2026-04-07" date). CLAUDE.md conventions #189-197 collectively cover the nine sub-claims in the registry row. A dedicated completed-build record exists at `.claude/completed-builds/2026-04/build-n-prd-18-phase-d-teen-rhythm.md`. Individual seed row counts and component bodies not re-verified in this packet; multi-sub-claim entry flagged for founder review if rigor-at-sub-claim-level is desired.

---

## Entry 195 — `Custom report templates (mom-authored)`

**Registry line:** 195
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Custom report templates (mom-authored) | PRD-19 | PRD-28B | ✅ Wired | Phase 32 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Capability "Custom report templates" — no direct identifier. **(d) PRD-28B-Compliance-Progress-Reporting.md:** names `report_templates` table as the architecture (lines 625, 810, 822, 845, 871, 883, 903, 923). Identifier at (d) via PRD.

Primary identifier: `report_templates` table (per PRD-28B).

### Field 2 — Code presence check

```
Grep command: pattern=`CREATE TABLE.*report_templates`, output_mode=content, -n=true
Hits: 0 — no CREATE TABLE statement for `report_templates` found anywhere in the tree.

Grep command: pattern=`report_templates|esa_invoices|homeschool_family_config|education_standards`, path=`supabase/migrations`, output_mode=files_with_matches
Hits: 0 migrations — NONE of the 6 PRD-28B tables listed in feature_glossary.md appear in any migration file.
```

⚠️ **Potential registry-vs-code contradiction.** The stub row claims `✅ Wired` under Phase 32 with attribution to PRD-28B, but:
1. PRD-28B specifies `report_templates` as the storage table for custom templates (line 625: "Table: `report_templates`"; line 822: "`report_templates` table supports custom entries. UI deferred to post-MVP.").
2. No migration in `supabase/migrations/` contains a `CREATE TABLE report_templates` statement.
3. A broader grep for any of the 6 PRD-28B tables (report_templates, esa_invoices, homeschool_family_config, homeschool_student_config, education_standards, standard_evidence) across the entire migration directory returned zero matches.
4. PRD-28B line 822 itself describes this stub's state as "Stubbed with architecture. `report_templates` table supports custom entries. UI deferred to post-MVP." — which conflicts with the registry's `✅ Wired` claim.

### Field 3 — Wiring check

Skipped — no table creation confirmed.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no row.
- **CLAUDE.md:** no convention names `report_templates` by identifier.
- **PRD-28B** (lines 625-928): extensive design documentation for the `report_templates` architecture. Line 822 self-describes custom templates as "Post-MVP," which directly conflicts with the registry's `✅ Wired`.
- **feature_glossary.md PRD-28B row:** lists `report_templates` among 6 tables expected for Compliance & Progress Reporting.
- **docs/ARCHITECTURE_DECISIONS.md:** referenced `report_templates` among architecture decisions.
- **prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md:** addendum present.

### Field 5 — What was NOT checked

- Whether `report_templates` might be created by a future unrun migration that hasn't been applied yet (no such pending migration was found in the tree).
- Whether the capability is being implemented via some other mechanism (e.g., hardcoded JSON in code) not named `report_templates`.
- Whether the contradiction between PRD-28B's self-described "Post-MVP" status and the registry's `✅ Wired` was intentionally updated post-PRD-28B writing, or whether the registry row has drifted ahead of reality.
- **Semantic-search question (mgrep blocked):** "Is there any code path that produces the output of a custom report template through some alternative mechanism (e.g., inline JSON, Vault content item, LiLa-generated markdown) that wouldn't require the `report_templates` table?"

### Field 6 — Observations (no verdict)

Registry line 195 claims `✅ Wired` under Phase 32 (PRD-28B). PRD-28B documents `report_templates` as the storage table (line 625) and self-describes the custom-template capability as "Post-MVP" at line 822. No migration in the tree creates `report_templates` or any of the other 5 PRD-28B tables (esa_invoices, homeschool_family_config, homeschool_student_config, education_standards, standard_evidence). Relevant to entry 517 which claims the full 6-table set. Synthesis may want to examine this entry, entry 517, and any companion entries together. Flagged observation — no verdict.

---

## Entry 197 — `My Circle (non-family contacts)`

**Registry line:** 197
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| My Circle (non-family contacts) | PRD-19 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** No identifier. Capability overlaps with entry 133 (My Circle folder type). **(b)-(d) results same as entry 133.** PRD-19 (Family Context) references My Circle but no code-level identifier exists.

Identifier: CAPABILITY-ONLY.

### Field 2 — Code presence check

```
Grep: `my_circle` → 1 hit (PRD-13 only); no source-code matches.
```

### Field 3 — Wiring check

Skipped.

### Field 4 — Documentation cross-reference

- **PRD-19:** referenced. **PRD-13:** also referenced (same `my_circle` mention as entry 133).
- No code-level mentions.

### Field 5 — What was NOT checked

- Whether entry 133 (My Circle folder type) and entry 197 (My Circle non-family contacts) are distinct capabilities or overlapping — founder synthesis may want to treat them as linked. Text suggests strong overlap.

### Field 6 — Observations (no verdict)

Stub status `📌 Post-MVP` aligns with grep absence. Entry 133 in this partition covers the same capability from a different angle. Both rely on PRD-19 / "People & Relationships PRD" referenced but unwritten.

---

<!-- PROGRESS MARKER: batch B complete (entries 74, 88, 133, 163, 173, 194, 195, 197 — 8 packets), 17 total entries processed in Session 1 so far -->

Integrity check after batch B: STUB_REGISTRY.md = 547 lines, HALT absent (re-verified).

---

## Entry 230 — `Drop old per-family BookShelf tables (Phase 1c)`

**Registry line:** 230
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Drop old per-family BookShelf tables (Phase 1c) | PRD-23 Phase 1b | PRD-23 Phase 1c | ⏳ Unwired (MVP) | 30-day soak after 1b-F, then drop bookshelf_summaries/insights/declarations/action_steps/questions + old RPCs |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Row names 5 specific per-family tables slated for DROP: `bookshelf_summaries`, `bookshelf_insights`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions`. Identifier at (a). The stub is about the ABSENCE of a future drop migration; currently the tables SHOULD still exist (status Unwired means "drop not yet done").

Primary identifiers: `bookshelf_summaries`, `bookshelf_insights`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions` tables (all expected to still exist pre-drop).

### Field 2 — Code presence check

```
Grep command: pattern=`bookshelf_summaries|bookshelf_insights|bookshelf_declarations|bookshelf_action_steps|bookshelf_questions`, path=`supabase/migrations`, output_mode=files_with_matches
Hits: 7 files including:
  - 00000000100059_prd23_bookshelf_schema.sql  (original schema)
  - 00000000100066_prd23_bookshelf_search_rpcs.sql
  - 00000000100073_bookshelf_shared_extractions.sql
  - 00000000100091_bookshelf_platform_data_migration.sql
  - 00000000100095_bookshelf_multipart_ordering.sql
  - 00000000100122_bookshelf_phase1b_embeddings.sql  (latest)
```

No `DROP TABLE` statement for any of these 5 tables in the current migration set. live_schema.md reports row counts:
- `bookshelf_summaries` 21538 rows; `bookshelf_insights` 24360; `bookshelf_declarations` 16931; `bookshelf_action_steps` 16396; `bookshelf_questions` 10168.

The 5 tables are still present and densely populated. Phase 1c drop not yet executed.

### Field 3 — Wiring check

- Callers: many per-family BookShelf code paths still reference these tables (search wouldn't be exhaustive this run).
- Execution-flow location: schema-layer (tables existing alongside the new `platform_intelligence.book_extractions` shared target).
- Most recent touching migration (100122): part of Phase 1b-F embeddings.

### Field 4 — Documentation cross-reference

- **WIRING_STATUS.md:** no drop-status row for Phase 1c.
- **CLAUDE.md:** no convention names the drop schedule.
- **PRD-23 Phase 1c:** the stub names this as the future drop phase.
- **`.claude/completed-builds/2026-04/phase-1b-prd-23-bookshelf-platform-migration.md`:** Phase 1b record; Phase 1c drop deferred.

### Field 5 — What was NOT checked

- Whether per-family-table-reading code paths have all been migrated to the platform-side equivalents (required before safe DROP).
- Whether the 30-day soak period has elapsed yet (Phase 1b-F landed per completed builds; date-delta not computed in this packet).
- Whether any Edge Functions or RPCs still read from the 5 tables.

### Field 6 — Observations (no verdict)

All 5 per-family BookShelf tables (summaries, insights, declarations, action_steps, questions) exist in migrations and are populated in live_schema (row counts in the 10K-24K range). No `DROP TABLE` migration present. Stub status `⏳ Unwired (MVP)` aligns with the expected pre-drop state.

---

## Entry 231 — `bookshelf_chapters migration to platform`

**Registry line:** 231
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| bookshelf_chapters migration to platform | PRD-23 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Row names `bookshelf_chapters` directly. Migration context: PRD-23 Phase 1b migrated other per-family tables to `platform_intelligence.*`; `bookshelf_chapters` is the specific table not yet migrated. Identifier at (a).

Primary identifier: `bookshelf_chapters` table (per-family); target would be `platform_intelligence.book_chapters` or similar.

### Field 2 — Code presence check

```
Grep command: pattern=`bookshelf_chapters`, output_mode=files_with_matches
Hits: 10 files including supabase/migrations/00000000100059, component files, hooks, Edge Function.
Creation: 00000000100059_prd23_bookshelf_schema.sql:179  `CREATE TABLE IF NOT EXISTS bookshelf_chapters (`
No platform-side chapter table (no `platform_intelligence.book_chapters` found).
```

live_schema.md: `bookshelf_chapters` — 1 row.

### Field 3 — Wiring check

- Callers: `src/components/bookshelf/ChapterJumpOverlay.tsx`, `src/components/bookshelf/ExtractionSidebar.tsx`, `src/hooks/useExtractionData.ts`, `supabase/functions/bookshelf-process/index.ts`.
- Execution-flow location: per-family table still used by client and Edge Function.

### Field 4 — Documentation cross-reference

- **CLAUDE.md:** no convention references the planned chapter migration.
- **PRD-23:** mentions chapter structure; migration to platform is a future extension.
- **Phase 1b completion record** (`.claude/completed-builds/2026-04/phase-1b-prd-23-bookshelf-platform-migration.md`): documents what WAS migrated; `bookshelf_chapters` not in the migrated set.
- **live_schema.md:** `platform_intelligence.book_library` and `.book_chunks` and `.book_extractions` exist at the platform schema; no `book_chapters` sibling.

### Field 5 — What was NOT checked

- Whether the single row in `bookshelf_chapters` is representative of the system's use of the table or a test artifact.
- Whether Edge Function `bookshelf-process` still writes chapter records per-family or has been updated for platform sharing.

### Field 6 — Observations (no verdict)

`bookshelf_chapters` table exists per-family (created in migration 100059, 1 row in live_schema). No `platform_intelligence.book_chapters` or similar platform-side target exists. Consumers still reference per-family table. Stub status `📌 Post-MVP` aligns with grep absence of a platform-side migration.

---

## Entry 243 — `Task unmark cascade (points/streak/creature/page reversal)`

**Registry line:** 243
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Task unmark cascade (points/streak/creature/page reversal) | PRD-24 Sub-phase C | — | ⏳ Unwired (MVP) | Future UNDO pipeline build |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** No direct identifier. **(c) CLAUDE.md convention #206 (line 446):** explicitly names this as "explicitly NOT implemented (known limitation). When a `task_completions` row is soft-deleted or a task is un-completed, points are NOT deducted, streak is NOT rewound, creatures are NOT removed from the collection, and pages are NOT re-locked."

Identifier: CAPABILITY-ONLY — stub is about an absent UNDO pipeline; no cascade identifier exists in code.

### Field 2 — Code presence check

Skipped — no identifier to grep for. The capability is defined by its absence; CLAUDE.md #206 is the authoritative statement of that absence.

### Field 3 — Wiring check

Skipped — no code presence expected.

### Field 4 — Documentation cross-reference

- **CLAUDE.md convention #206:** authoritative. States "The PRD calls for this cascade but the baby step ships without it... A future build will add an UNDO pipeline."
- **PRD-24 Sub-phase C:** the build phase that created the forward pipeline without the reversal.

### Field 5 — What was NOT checked

- Whether `task_completions.deleted_at` currently gets set anywhere (soft-delete surface).
- Whether any gamification-point-adjustment RPC exists that mom could use as a manual workaround (CLAUDE.md #206 says "mom can manually adjust `gamification_points` via settings if needed").

### Field 6 — Observations (no verdict)

CLAUDE.md #206 explicitly documents this as a known-unimplemented gap. Stub status `⏳ Unwired (MVP)` aligns with the convention's statement. The `roll_creature_for_completion` RPC (entry 257 below) is the forward half of the pipeline; the reverse does not exist.

---

## Entry 256 — `Task segments`

**Registry line:** 256
**Claimed status:** `✅ Wired` (Build M Phase 2, 2026-04-11)
**Full registry row:**
```
| Task segments | Build M Phase 1 | Build M Phase 2 | ✅ Wired | 2026-04-11 — `task_segments` table + CRUD hooks + PlayTaskTileGrid grouped rendering |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names `task_segments` table, CRUD hooks, and `PlayTaskTileGrid` component. Identifier at (a).

### Field 2 — Code presence check

```
Grep command: pattern=`CREATE TABLE.*task_segments|task_segments \(`, path=`supabase/migrations`, output_mode=content, -n=true
Hits: 1
  - 00000000100126_earning_strategies_color_reveal.sql:20  `CREATE TABLE IF NOT EXISTS public.task_segments (`
```

CLAUDE.md convention #208 documents the full purpose ("per-member day organizers, available in ALL shells. `task_segments` table groups tasks into named sections...").

### Field 3 — Wiring check

- Callers: `PlayDashboard.tsx`, `GuidedDashboard.tsx`, `GamificationSettingsModal.tsx` all reference segment-related identifiers per batch-B+C grep filelists.
- Execution-flow location: DB table + React consumers + settings modal.
- Most recent touching commit (migration 100126): `61a9581 2026-04-10 17:33:19` (one day before claimed wiring date; likely lag between migration land and settings-UI wiring per Build M Phase 2).

### Field 4 — Documentation cross-reference

- **CLAUDE.md #208 (task_segments), #211 (coloring reveals — adjacent), #217 (cross-shell segment rendering):** each names the identifier.
- **feature-decisions/PRD-24-PRD-26-Configurable-Earning-Strategies.md:** post-build sign-off artifact.
- **E2E:** `tests/e2e/features/phase5-segments-coloring-reveal.spec.ts`.

### Field 5 — What was NOT checked

- Column-level schema of `task_segments` (e.g., `day_filter`, `segment_complete_celebration`, `randomizer_reveal_style` columns referenced in CLAUDE.md conventions not individually grep-verified).
- CRUD hook file location (not re-grep'd).
- Production row count.

### Field 6 — Observations (no verdict)

`task_segments` table created in migration 100126 (2026-04-10). CLAUDE.md #208 + #217 + Build M Phase 2 completion docs document the wiring. Registry row's date (2026-04-11) is one day after migration commit, consistent with a staged build. Stub status `✅ Wired` supported.

---

## Entry 257 — `4 creature earning modes`

**Registry line:** 257
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| 4 creature earning modes (segment_complete, every_n, complete_the_day, random_per_task) | Build M Phase 1 | Build M Phase 1 | ✅ Wired | 2026-04-11 — `roll_creature_for_completion` RPC branches on `creature_earning_mode` |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names RPC `roll_creature_for_completion` and column `creature_earning_mode`. Identifier at (a).

### Field 2 — Code presence check

```
Grep command: pattern=`roll_creature_for_completion|creature_earning_mode`, path=`supabase/migrations`, output_mode=files_with_matches
Hits: 6 migrations:
  - 00000000100115_play_dashboard_sticker_book.sql  (original creation — Build M Sub-phase B)
  - 00000000100123_rpc_fix_roll_creature_for_completion.sql  (fix)
  - 00000000100126_earning_strategies_color_reveal.sql  (branches added)
  - 00000000100128_coloring_reveal_task_link_rpc.sql
  - 00000000100130_rpc_fix_uninitialized_record.sql
  - 00000000100134_allowance_financial.sql
```

CLAUDE.md conventions #198-206 (Play Dashboard + Sticker Book section) cover the RPC extensively; #209 names the four earning modes verbatim ("`'random_per_task'` (default, d100 roll), `'every_n_completions'`, `'segment_complete'`, `'complete_the_day'`").

### Field 3 — Wiring check

- Callers: `useCompleteTask`, `useApproveTaskCompletion`, `useApproveCompletion`, `useApproveMasterySubmission` per CLAUDE.md #198.
- Execution-flow location: SECURITY DEFINER RPC in migrations, called from 4 client hooks.
- Most recent touching commit (100115): `1dce4a0 2026-04-08` (initial); fixes through 100134 (2026-04-17).

### Field 4 — Documentation cross-reference

- **CLAUDE.md #198-206, #209:** document RPC signature, idempotency, 4 earning modes.
- **feature-decisions/PRD-24-PRD-26-Play-Dashboard-Sticker-Book.md** (Build M Sub-phase C sign-off) and **PRD-24-PRD-26-Configurable-Earning-Strategies.md** (Build M expansion).

### Field 5 — What was NOT checked

- Actual body of the RPC (branch count, enum CHECK constraint on `creature_earning_mode`).
- Whether the 4 enum values in `member_sticker_book_state.creature_earning_mode` match CLAUDE.md #209's literal strings ('random_per_task', 'every_n_completions', 'segment_complete', 'complete_the_day').
- Whether the idempotency key (UNIQUE on `awarded_source_id` per #198) actually exists on `member_creature_collection`.

### Field 6 — Observations (no verdict)

`roll_creature_for_completion` RPC created in migration 100115 and revised through migration 100134 across 6 migrations. CLAUDE.md conventions #198-209 document the 4-mode architecture and the 4 calling-hook sites. Registry status `✅ Wired` supported.

---

## Entry 258 — `3 page earning modes`

**Registry line:** 258
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| 3 page earning modes (tracker_goal, every_n_creatures, every_n_completions) | Build M Phase 1 | Build M Phase 1 | ✅ Wired | 2026-04-11 — RPC branches on `page_earning_mode` |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names `page_earning_mode`. Identifier at (a).

### Field 2 — Code presence check

```
Grep command: pattern=`page_earning_mode`, path=`supabase/migrations`, output_mode=files_with_matches
Hits: 4
  - 00000000100126_earning_strategies_color_reveal.sql  (creation site for the page-earning branches)
  - 00000000100128_coloring_reveal_task_link_rpc.sql
  - 00000000100130_rpc_fix_uninitialized_record.sql
  - 00000000100134_allowance_financial.sql
```

CLAUDE.md #210 names the three page earning modes: `'every_n_creatures'`, `'every_n_completions'`, `'tracker_goal'`.

### Field 3 — Wiring check

- Execution-flow location: column on `member_sticker_book_state` + RPC branches in `roll_creature_for_completion` (same RPC as entry 257).
- Most recent touching commit (100126): `61a9581 2026-04-10`.

### Field 4 — Documentation cross-reference

- **CLAUDE.md #210:** documents the three modes and supporting columns (`page_earning_completion_threshold`, `page_earning_completion_counter`, `page_earning_tracker_widget_id`, `page_earning_tracker_threshold`).
- **feature-decisions/PRD-24-PRD-26-Configurable-Earning-Strategies.md.**

### Field 5 — What was NOT checked

- Whether `tracker_goal` mode has a downstream dependency on widget data points that is itself flagged as unwired (stub 266 "Tracker Goal page earning (widget data point consumption)" in the partition's Build M section states "Data point trigger not connected").
- Full CHECK constraint on `page_earning_mode` enum.

### Field 6 — Observations (no verdict)

`page_earning_mode` column referenced across 4 migrations, with the initial branches added in 100126. CLAUDE.md #210 documents three modes; related stub 266 observes the `tracker_goal` mode's data-point trigger is not connected (not processed in this packet's scope).

---

## Entry 259 — `Coloring reveal library (32 subjects)`

**Registry line:** 259
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Coloring reveal library (32 subjects) | Build M Phase 1 | Build M Phase 3 | ✅ Wired | 2026-04-11 — `coloring_reveal_library` seeded, `ColorRevealCanvas` renders progressive zone reveals |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names `coloring_reveal_library` table and `ColorRevealCanvas` component. Identifier at (a).

### Field 2 — Code presence check

```
Grep command: pattern=`CREATE TABLE.*coloring_reveal_library`, path=`supabase/migrations`, output_mode=content, -n=true
Hit: 00000000100126_earning_strategies_color_reveal.sql:88  `CREATE TABLE IF NOT EXISTS public.coloring_reveal_library (`
Companion table CREATE at line 116: `member_coloring_reveals`.

Grep command: pattern=`coloring_reveal_library|ColorRevealCanvas`, output_mode=files_with_matches
Hits: 10 files including CLAUDE.md, ColorRevealTallyWidget.tsx, PRD-24 feature decisions, E2E specs.
```

CLAUDE.md #213 names the library ("stores 32 Woodland Felt subjects (20 animals + 12 scenes). Each row has `slug`, `display_name`, `category` (animal/scene), `theme_id`, and `reveal_sequences JSONB` with 6 step-count variants").

### Field 3 — Wiring check

- Callers: `src/components/coloring-reveal/ColorRevealTallyWidget.tsx` (from Grep filelist); `ColorRevealCanvas` component referenced but specific path not re-confirmed this packet.
- Execution-flow location: DB table (library seed) + companion state table (`member_coloring_reveals`) + React canvas renderer.
- Most recent touching commit (100126): `61a9581 2026-04-10`.

### Field 4 — Documentation cross-reference

- **CLAUDE.md #213:** documents table shape; #211 documents per-task-linked mechanic; #222 documents the ColorRevealTallyWidget.
- **feature-decisions/PRD-24-PRD-26-Configurable-Earning-Strategies.md.**

### Field 5 — What was NOT checked

- Actual seeded row count for `coloring_reveal_library` (claim: "32 subjects"). Migration 100126 was not opened to the INSERT block in this packet.
- `ColorRevealCanvas` specific file path (implied at `src/components/coloring-reveal/ColorRevealCanvas.tsx` but not directly glob-verified).

### Field 6 — Observations (no verdict)

`coloring_reveal_library` and `member_coloring_reveals` tables created in migration 100126 (2026-04-10). CLAUDE.md #213 describes the 32-subject seed (20 animals + 12 scenes). `ColorRevealTallyWidget.tsx` component exists at `src/components/coloring-reveal/`. Registry status `✅ Wired` supported.

---

## Entry 260 — `Task-linked coloring reveals (1:1 earning_task_id)`

**Registry line:** 260
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Task-linked coloring reveals (1:1 earning_task_id) | Build M Phase 4 | Build M Phase 5 | ✅ Wired | 2026-04-11 — `earning_task_id` FK, RPC checks task linkage first, `ColorRevealTallyWidget` with "I did it!" button |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names `earning_task_id` FK column and `ColorRevealTallyWidget` component. Identifier at (a).

### Field 2 — Code presence check

```
Grep command: pattern=`earning_task_id|ColorRevealTallyWidget`, output_mode=files_with_matches
Hits: 10 files including:
  - supabase/migrations/00000000100127_coloring_reveal_task_link.sql  (task-link migration — dedicated)
  - supabase/migrations/00000000100128_coloring_reveal_task_link_rpc.sql  (RPC)
  - supabase/migrations/00000000100130_rpc_fix_uninitialized_record.sql  (fix)
  - supabase/migrations/00000000100134_allowance_financial.sql
  - src/hooks/useGamificationSettings.ts
  - tests/e2e/features/phase5-segments-coloring-reveal.spec.ts
  - tests/e2e/features/color-reveal-phase3.spec.ts
```

Migration 100127 commit: `cacfdc9 2026-04-10 21:21:15`.

CLAUDE.md #211 names the 1:1 tally-counter model: "Each `member_coloring_reveals` row has an `earning_task_id` FK linking it to one specific task. Each completion of that task = one reveal step (one zone group transitions from grayscale to color). The RPC checks `earning_task_id` FIRST..."

### Field 3 — Wiring check

- Callers: `ColorRevealTallyWidget.tsx` (confirmed), `useGamificationSettings` hook, E2E test files.
- Execution-flow location: FK column on `member_coloring_reveals` + RPC branch (in migration 100128) + widget component + E2E coverage.
- Most recent touching commit (100127): 2026-04-10 21:21:15.

### Field 4 — Documentation cross-reference

- **CLAUDE.md #211:** "Coloring reveals are 1:1 task-linked tally counters, NOT earning-mode-driven." Documents the RPC-checks-first-before-creature-earning-mode precedence.
- **CLAUDE.md #222:** names `ColorRevealTallyWidget` as a dashboard widget (not a task tile).
- **E2E coverage:** two spec files.

### Field 5 — What was NOT checked

- Widget's "I did it!" button behavior (CLAUDE.md #222) not behaviorally verified.
- RPC branch order verification (that `earning_task_id` check actually precedes `creature_earning_mode` branches).
- Print output flow (CLAUDE.md #222 mentions "Print it!" on full reveal).

### Field 6 — Observations (no verdict)

`earning_task_id` FK introduced in dedicated migration 100127 (2026-04-10) with supporting RPC in 100128. `ColorRevealTallyWidget.tsx` exists. CLAUDE.md #211 documents the design. E2E coverage present in two spec files. Registry status `✅ Wired` supported.

---

<!-- PROGRESS MARKER: batch C complete (entries 230, 231, 243, 256, 257, 258, 259, 260 — 8 packets), 25 total entries processed in Session 1 so far -->

Integrity check after batch C: STUB_REGISTRY.md = 547 lines, HALT absent.

---

## Entry 267 — `Sunday List faith-themed sticker theme override`

**Registry line:** 267
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Sunday List faith-themed sticker theme override | Build M Phase 1 | — | 📌 Post-MVP | `theme_override_id` on `task_segments`. No faith theme created. |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names `theme_override_id` column on `task_segments`. Identifier at (a). The stub is about the absence of a specific seed (a faith-themed `gamification_themes` row), not the column.

Primary identifier: `theme_override_id` on `task_segments` (schema support) + the gap of a faith-themed `gamification_themes` seed row.

### Field 2 — Code presence check

```
Grep command: pattern=`theme_override_id`, path=`supabase/migrations`, output_mode=content, -n=true
Hit: 00000000100126_earning_strategies_color_reveal.sql:32  `theme_override_id  UUID REFERENCES public.gamification_themes(id),`
```

Column exists on `task_segments` with FK to `gamification_themes`. No faith-themed seed row grep'd in this packet.

### Field 3 — Wiring check

- Execution-flow location: DB column + FK target table `gamification_themes`.
- Most recent touching commit (100126): `61a9581 2026-04-10`.

### Field 4 — Documentation cross-reference

- **CLAUDE.md:** #208 (task_segments docs) implicitly covers per-segment theme override by describing `task_segments` purpose; no explicit mention of faith-themed override.
- **No addendum or Vault entry** for a faith-themed sticker set found.

### Field 5 — What was NOT checked

- Row count / seed content of `gamification_themes` table (were faith themes attempted and removed, or never seeded?).
- Whether any Settings UI exposes theme_override_id selection per segment.

### Field 6 — Observations (no verdict)

`theme_override_id` FK exists on `task_segments`; the schema supports the capability. No migration seeds a faith-themed row into `gamification_themes`. Stub status `📌 Post-MVP` aligns with the column-exists-but-content-missing state described in the row.

---

## Entry 268 — `Streak milestone earning mode`

**Registry line:** 268
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Streak milestone earning mode | Feature decision file §7 | — | 📌 Post-MVP | Earning mode enum extensible |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** No specific enum value identifier for an earning mode. The stub references `creature_earning_mode` / `page_earning_mode` enums as candidates for extension. **(d.5) Bounded lookup:** migration 100115 grep shows `streak_milestone` exists as a value in the `unlocked_trigger_type` CHECK constraint AND in JSON event payloads AND as a feature_key (`gamification_streak_milestones`), but NOT as a value in `creature_earning_mode` or `page_earning_mode` enums.

Identifier: CAPABILITY-ONLY for the earning-mode aspect. The infrastructure-level references exist but not as a selectable earning mode in the settings UI.

### Field 2 — Code presence check

```
Grep command: pattern=`streak_milestone|timer_goal`, path=`supabase/migrations`, output_mode=content, -n=true
Hits: 10+ in migration 100115:
  - line 375  CHECK (unlocked_trigger_type IN ('bootstrap','creature_count','manual_unlock','streak_milestone','task_completion','tracker_goal'))
  - line 1048 comment: "streak_updated, new_streak, streak_milestone" (JSON field)
  - lines 1185, 1202, 1261, 1347  RPC payloads with 'streak_milestone' key
  - line 1827  seed: `('gamification_streak_milestones','Streak Milestone Bonuses','Bonus points at streak milestones (STUBBED in Build M)','PRD-24')`
  - line 1868  feature_access grant for 'gamification_streak_milestones'
```

Feature key exists; feature description explicitly says "STUBBED in Build M."

### Field 3 — Wiring check

- Execution-flow location: `streak_milestone` is a value in a different enum (`unlocked_trigger_type`) and a JSON field in the `roll_creature_for_completion` RPC payload — not a `creature_earning_mode` value selectable in settings.
- Feature key `gamification_streak_milestones` is registered but flagged as stubbed.

### Field 4 — Documentation cross-reference

- **CLAUDE.md #209:** the 4 creature earning modes are `'random_per_task'`, `'every_n_completions'`, `'segment_complete'`, `'complete_the_day'` — `streak_milestone` is not among them.
- **feature decision file §7:** stub row references this as the authoritative source (not independently re-verified in this packet).

### Field 5 — What was NOT checked

- The specific feature decision file section referenced by the stub.
- Whether extending `creature_earning_mode` CHECK to include `'streak_milestone'` would require a breaking-change migration.

### Field 6 — Observations (no verdict)

`streak_milestone` appears in migration 100115 as a JSON payload key and trigger-type enum value but NOT in the `creature_earning_mode` enum (which has the 4 values documented in CLAUDE.md #209). Feature key `gamification_streak_milestones` exists and is explicitly "STUBBED in Build M." Stub status `📌 Post-MVP` aligns with the absence from the earning-mode enum.

---

## Entry 269 — `Timer goal earning mode`

**Registry line:** 269
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Timer goal earning mode | Feature decision file §7 | — | 📌 Post-MVP | Not built |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Row says "Not built." **(d.5)** `timer_goal` appears in migration 100115 `unlocked_trigger_type` enum (same location as `streak_milestone`) but NOT in `creature_earning_mode` OR `page_earning_mode`. (`tracker_goal` is in page_earning_mode — that's a different value with similar naming.)

Identifier: CAPABILITY-ONLY for the earning-mode aspect.

### Field 2 — Code presence check

Grep for `timer_goal` hits migration 100115 only (line 375 — same CHECK as `streak_milestone`). No earning-mode enum membership.

### Field 3 — Wiring check

Skipped — not built as an earning mode.

### Field 4 — Documentation cross-reference

- **CLAUDE.md #210:** the 3 page earning modes are `'every_n_creatures'`, `'every_n_completions'`, `'tracker_goal'` — `timer_goal` is NOT among them (easy to confuse with `tracker_goal`).

### Field 5 — What was NOT checked

- Whether the stub's "Timer goal" is actually intended to be the same as the built `tracker_goal` page earning mode (similar name, different source). Founder synthesis may want to clarify — if so, the stub might be a duplicate/mis-labeled entry.

### Field 6 — Observations (no verdict)

`timer_goal` not in `creature_earning_mode` or `page_earning_mode` enums. Stub status `📌 Post-MVP` aligns with absence from earning-mode enums. Potential naming collision with the built `tracker_goal` mode — founder may want to disambiguate.

---

## Entry 270 — `Approval-based manual earning mode`

**Registry line:** 270
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Approval-based manual earning mode | Feature decision file §7 | — | 📌 Post-MVP | Not built |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** "Approval-based" — not a specific enum value. No direct identifier. Grep for `approval_based` returned no hits.

Identifier: CAPABILITY-ONLY.

### Field 2 — Code presence check

Zero migration hits for `approval_based` as an enum value. The `mastery_status='submitted'` approval flow is adjacent but is a task-level mastery approval, not an earning-mode selection.

### Field 3 — Wiring check

Skipped.

### Field 4 — Documentation cross-reference

- **CLAUDE.md #209, #210:** earning-mode enums do not include this value.

### Field 5 — What was NOT checked

- Whether the feature decision file §7 describes the intended semantics.
- Whether this is meant to be a new `creature_earning_mode` value or a completely different UX pattern.

### Field 6 — Observations (no verdict)

No enum value, column, or code identifier found for "approval-based manual earning mode." Stub status `📌 Post-MVP` aligns with grep absence.

---

## Entry 279 — `IEP Progress Report template`

**Registry line:** 279
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| IEP Progress Report template | PRD-28B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** No direct identifier. Per PRD-28B, report templates live as rows in `report_templates` table (see entry 195 above — which claims the table is wired; this packet re-examines for template-specific evidence). Identifier at (d) via PRD.

Primary identifier: `report_templates` row with template kind `iep_progress_report` (expected).

### Field 2 — Code presence check

```
Grep command: pattern=`iep_progress|therapy_summary|IEP Progress|Therapy Summary|family_newsletter`, output_mode=files_with_matches, -i=true
Hits: 4 files — all documentation (stub_partition_schema, STUB_REGISTRY, PRD-28B, PRD-19). No source code, no migration, no seed row.
```

No `report_templates` table exists in migrations (re-confirming entry 195 finding). Therefore no template row for IEP can exist.

### Field 3 — Wiring check

Skipped.

### Field 4 — Documentation cross-reference

- **PRD-28B:** mentions IEP Progress Report as a planned template kind.
- **PRD-19:** references IEP context.

### Field 5 — What was NOT checked

- Whether any other table (e.g., `vault_items` with content_type for templates) holds an IEP template row.

### Field 6 — Observations (no verdict)

No code, migration, or seed row found for an IEP Progress Report template. `report_templates` table itself is absent from migrations (linked finding: entry 195). Stub status `📌 Post-MVP` aligns with grep absence; note consistency with entries 195 and 517 (the table-level stub).

---

## Entry 280 — `Therapy Summary template`

**Registry line:** 280
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Therapy Summary template | PRD-28B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Same architecture as entry 279 — expected to be a row in `report_templates`. `report_templates` table does not exist in migrations. Identifier: CAPABILITY-ONLY.

### Field 2 — Code presence check

Included in the same batch grep as entry 279 — no source/migration/seed hits. Only PRD/stub documentation hits.

### Field 3 — Wiring check

Skipped.

### Field 4 — Documentation cross-reference

- **PRD-28B:** mentions therapy summary as a template kind.

### Field 5 — What was NOT checked

Same as entry 279.

### Field 6 — Observations (no verdict)

No implementation identifier found. Same baseline as entry 279 — `report_templates` table itself missing from the migration set. Stub status `📌 Post-MVP` aligns with grep absence.

---

## Entry 291 — `Family Newsletter report template`

**Registry line:** 291
**Claimed status:** `✅ Wired` (Phase 32, PRD-37/PRD-28B)
**Full registry row:**
```
| Family Newsletter report template | PRD-37 | PRD-28B | ✅ Wired | Phase 32 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** No direct identifier. Same architecture as entries 279/280 — expected to be a `report_templates` row. Identifier at (d) via PRD-28B.

### Field 2 — Code presence check

```
Grep command: pattern=`family_newsletter|newsletter_template`, output_mode=files_with_matches, -i=true
Hits: 1 — only PRD-28B (documentation). No source/migration/seed match.
```

No migration creates `report_templates` or seeds a family_newsletter row.

### Field 3 — Wiring check

Skipped — no code presence.

### Field 4 — Documentation cross-reference

- **PRD-28B:** references family newsletter as a template kind.
- **WIRING_STATUS.md:** no row.
- **CLAUDE.md:** no convention names this template.

### Field 5 — What was NOT checked

- Whether "Family Newsletter" might be implemented as an alternative mechanism (Vault item? LiLa-generated markdown? static JSON config?) not using `report_templates` naming.
- Whether the PRD-28B phase was ever partially built and a seed landed outside the standard migration flow.

### Field 6 — Observations (no verdict)

Stub claims `✅ Wired` at Phase 32. Grep finds only a single PRD-28B doc reference — no migration, no source file, no seed row. Consistent with the entry 195 / 517 / 279 / 280 finding that PRD-28B's `report_templates` architecture does not appear in the current migration set. The `✅ Wired` status does not match the grep evidence.

---

## Entry 390 — `Studio seed templates (15 in DB)`

**Registry line:** 390
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Studio seed templates (15 in DB) | PRD-09B | PRD-09B | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names "Studio seed templates" with count claim "15 in DB." Primary implementation surface: the frontend catalog file `src/components/studio/studio-seed-data.ts` + DB rows in `task_templates` / `list_templates` tables. Identifier at (a) via file-level identification.

Primary identifiers: `src/components/studio/studio-seed-data.ts` (frontend seed catalog); `task_templates` and `list_templates` tables (DB seed rows).

### Field 2 — Code presence check

```
Glob: src/components/studio/studio-seed-data.ts — 1 hit (792 lines).

Grep command: pattern=`id: '[a-z_]+',?`, path=`src/components/studio/studio-seed-data.ts`, output_mode=content, -n=true
Hits (head_limit=50): 40+ template id entries observed. Prefixes:
  - `sys_task_*` (4 templates: simple, routine, opportunity, sequential)
  - `ex_*` (examples: morning_routine, bedroom_cleanup, extra_house_jobs, curriculum_sequence, reading_list, tsg_randomizer, sodas_sibling, what_if_friend_pressure, apology_general, weekly_grocery, road_trip_packing, birthday_wishlist, homeschool_budget)
  - `sys_guided_form_*` (4: blank, sodas, what_if, apology)
  - `sys_list_*` (6: shopping, wishlist, packing, expenses, todo, custom)
  - `sys_randomizer`
  - `studio_*` (11 starter configs: gamification_setup, day_segments, coloring_reveal, reward_reveal, star_chart, reward_spinner, meeting_setup, routine_builder, universal_list, get_to_know, best_intentions)
```

Database side (live_schema):
- `task_templates` — 21 rows
- `list_templates` — 12 rows
- Combined: 33 rows

Frontend catalog: 40+ templates visible in head-limited grep (file is 792 lines — likely has more beyond the 50-line head).

### Field 3 — Wiring check

- Callers: Studio.tsx and related components consume `studio-seed-data.ts`.
- Execution-flow location: frontend catalog + DB seed rows.
- Count claim in stub ("15 in DB") does NOT match current live_schema totals (33 across task_templates + list_templates) or frontend catalog count (40+).

### Field 4 — Documentation cross-reference

- **specs/studio-seed-templates.md:** 27 seed templates listed as the "founder spec" target.
- **CLAUDE.md #153:** "`capability_tags: string[]` on the `StudioTemplate` type... Tag vocabulary is authoritative in PRD-09A-09B addendum §1D."
- **STUB_REGISTRY.md line 492:** separate entry "capability_tags populated on all 27 seed templates" — suggests "27" is the current count, not 15.

### Field 5 — What was NOT checked

- Exact count of DB-seeded vs frontend-only templates.
- Whether the "15 in DB" count was historical (at Phase 10 original build) and has grown to 33+ since.
- Cross-reference between frontend template IDs and their DB-seeded counterparts (some frontend templates may not have DB seed rows).

### Field 6 — Observations (no verdict)

The frontend catalog `src/components/studio/studio-seed-data.ts` contains 40+ distinct template IDs. DB-side `task_templates` (21) + `list_templates` (12) = 33 rows. The stub's "15 in DB" claim does not match current counts — likely a historical number from initial Phase 10 build. Related entry 492 (capability_tags on all 27 seed templates) references a different count again. Stub status `✅ Wired` is supported by the existence of the catalog + DB seeds, but the specific count in parentheses is stale.

---

<!-- PROGRESS MARKER: batch D complete (entries 267, 268, 269, 270, 279, 280, 291, 390 — 8 packets), 33 total entries processed in Session 1 so far -->

Integrity check after batch D: STUB_REGISTRY.md = 547 lines, HALT absent.

---

## Entry 469 — `is_available_for_mediation` per-note toggle

**Registry line:** 469
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| `is_available_for_mediation` per-note toggle | PRD-34 (Mediator) | PRD-19 | ⏳ Unwired (MVP) | Phase 20 (Family Context) |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names `is_available_for_mediation` column. Identifier at (a).

Primary identifier: `is_available_for_mediation` column (target table: a notes/relationship-notes table per PRD-19).

### Field 2 — Code presence check

```
Grep command: pattern=`is_available_for_mediation`, output_mode=files_with_matches
Hits: 4 files — all documentation:
  - scope-5-evidence/stub_partition_schema.md
  - STUB_REGISTRY.md
  - prds/daily-life/PRD-19-Family-Context-Relationships.md
  - claude/feature-decisions/PRD-34-ThoughtSift.md
No source code, no migration, no schema column.
```

### Field 3 — Wiring check

Skipped — no code presence.

### Field 4 — Documentation cross-reference

- **PRD-19 / PRD-34 (Mediator):** both reference the toggle.
- **feature-decisions/PRD-34-ThoughtSift.md:** documents the planned toggle.
- **No migration** creates the column.

### Field 5 — What was NOT checked

- Which specific notes table would host the column (PRD-19 likely `private_notes` or `relationship_notes` — live_schema does not show these tables as built).
- Whether PRD-19 tables themselves exist in migrations (likely separate stub).

### Field 6 — Observations (no verdict)

No migration, source code, or schema column for `is_available_for_mediation`. Stub status `⏳ Unwired (MVP)` aligns with grep absence.

---

## Entry 492 — `capability_tags populated on all 27 seed templates`

**Registry line:** 492
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| `capability_tags` populated on all 27 seed templates | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names `capability_tags` field on StudioTemplate type + "27 seed templates" count. Identifier at (a).

### Field 2 — Code presence check

```
Grep command: pattern=`capabilityTags|capability_tags`, path=`src/components/studio/studio-seed-data.ts`, output_mode=count
Hits: 40 occurrences in studio-seed-data.ts (792-line file with ~40+ distinct template IDs).
```

CLAUDE.md #153: "`capability_tags: string[]` on the `StudioTemplate` type (required, not optional — forgetting tags is a compile error)." The frontend catalog applies tags broadly; the count "40" includes multi-tag occurrences per template (each template has multiple tags).

### Field 3 — Wiring check

- Callers: Studio.tsx consumes the seed data including tags.
- Most recent touching commit: part of Build J era (2026-04-06 per registry row claim).

### Field 4 — Documentation cross-reference

- **CLAUDE.md #153:** documents the compile-time requirement.
- **WIRING_STATUS.md Studio Capability Tags section:** explicit row "`capability_tags: string[]` required on `StudioTemplate` type" as Wired.
- **prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md §1D** (named in CLAUDE.md #153 as the tag vocabulary authority).

### Field 5 — What was NOT checked

- Whether "27 seed templates" is the exact count at time of writing — batch-D review of studio-seed-data.ts counted 40+ distinct IDs including several Studio starter configs (`studio_*` prefix). Registry claims 27; frontend file has more. Founder synthesis may wish to reconcile the count with entry 390 (which claims "15 in DB" — a third different count).
- Whether every template entry has a non-empty `capabilityTags` array (count=40 of `capability_tags` references in the file could be distributed unevenly).

### Field 6 — Observations (no verdict)

`capability_tags` / `capabilityTags` appears 40 times across `studio-seed-data.ts`. CLAUDE.md #153 and WIRING_STATUS.md both describe this as Wired at compile-time-required strictness. Template count claim "27" differs from actual frontend catalog of 40+ IDs and live_schema's 33 DB template rows. Registry status `✅ Wired` is supported structurally, but count claim doesn't match current state.

---

## Entry 495 — `practice_log` + `randomizer_draws` tables

**Registry line:** 495
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| `practice_log` + `randomizer_draws` tables | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — migration 100105 with RLS + indexes + UNIQUE partial index on randomizer_draws for Surprise Me determinism. E2E test E verifies duplicate rejection. |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names `practice_log`, `randomizer_draws`, migration `100105`. Identifier at (a).

### Field 2 — Code presence check

```
Grep command: pattern=`CREATE TABLE.*practice_log|CREATE TABLE.*randomizer_draws`, path=`supabase/migrations`, output_mode=content, -n=true
Hits: 2
  - 00000000100105_linked_steps_mastery_advancement.sql:127  `CREATE TABLE IF NOT EXISTS public.practice_log (`
  - 00000000100105_linked_steps_mastery_advancement.sql:187  `CREATE TABLE IF NOT EXISTS public.randomizer_draws (`
```

Both tables created in the Build J migration (same migration verified in calibration entry 494).

### Field 3 — Wiring check

- Callers: `usePractice.ts` writes to `practice_log` (per CLAUDE.md #159); `useSurpriseMeAutoDraw` writes to `randomizer_draws` (per CLAUDE.md #163 — UNIQUE partial index).
- Most recent touching commit: `207235e 2026-04-06` (Build J commit — same as calibration entry).
- E2E coverage: test E in `linked-steps-mastery.spec.ts` (verified in calibration) explicitly tests `draw_id` FK + Surprise Me uniqueness.

### Field 4 — Documentation cross-reference

- **CLAUDE.md #159 (practice_log), #162 (randomizer draw modes), #163 (Surprise Me determinism / UNIQUE partial index).**
- **Linked Steps addendum** (referenced in calibration).

### Field 5 — What was NOT checked

- Body of `practice_log` CREATE TABLE (columns, RLS, indexes) not opened in this packet — summarized via convention text.
- Body of `randomizer_draws` CREATE TABLE similarly.
- UNIQUE partial index definition location (migration 100105 likely has it near the table; not re-opened).

### Field 6 — Observations (no verdict)

Both tables created in migration 00000000100105 at lines 127 and 187 respectively (Build J, 2026-04-06). CLAUDE.md conventions #159, #162, #163 document the surrounding architecture. Registry status `✅ Wired` supported by the migration.

---

## Entry 496 — `Linked routine steps (`step_type` enum)`

**Registry line:** 496
**Claimed status:** `🔗 Partially Wired`
**Full registry row:**
```
| Linked routine steps (`step_type` enum) | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | 🔗 Partially Wired | 2026-04-06 — schema + RoutineSectionEditor "Add linked step" + LinkedSourcePicker + createTaskFromData persistence. Dashboard RENDERING of linked steps (expand to show current active item from source) is the next incremental step. |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names `step_type` enum on `task_template_steps` + `RoutineSectionEditor` + `LinkedSourcePicker` + `createTaskFromData`. Identifier at (a).

### Field 2 — Code presence check

```
Grep command: pattern=`step_type.*TEXT|step_type TEXT|CHECK \(step_type`, path=`supabase/migrations`, output_mode=content, -n=true
Hits: 2
  - 00000000100105_linked_steps_mastery_advancement.sql:74  `ADD COLUMN IF NOT EXISTS step_type TEXT NOT NULL DEFAULT 'static'`
  - 00000000100105_linked_steps_mastery_advancement.sql:75  `CHECK (step_type IN ('static','linked_sequential','linked_randomizer','linked_task'))`
```

4-value enum confirmed. WIRING_STATUS.md "Linked routine steps — dashboard rendering" row confirms the "Wired" update as of 2026-04-13 (RoutineStepChecklist expands inline).

### Field 3 — Wiring check

- Callers: `createTaskFromData` persistence (per stub row), `RoutineSectionEditor`, `LinkedSourcePicker`. Most recent dashboard-rendering update per WIRING_STATUS.md is 2026-04-13 — which suggests the "next incremental step" in the stub row may have since been completed, making the `🔗 Partially Wired` status potentially stale.

### Field 4 — Documentation cross-reference

- **CLAUDE.md #157:** documents the enum values and describes source resolution at render time.
- **WIRING_STATUS.md Sequential Collections table, row "Linked routine steps — dashboard rendering":** marked `**Wired**` with note "RoutineStepChecklist expands inline with linked content from sequential/randomizer/task sources. GuidedActiveTasksSection + TaskCard. 2026-04-13."
- **Linked Steps addendum.**

### Field 5 — What was NOT checked

- Whether the dashboard rendering update dated 2026-04-13 in WIRING_STATUS.md has caused the stub row's `🔗 Partially Wired` claim to drift — registry row language ("Dashboard RENDERING... is the next incremental step") suggests the update was not yet done when the registry was written but appears to have landed after.

### Field 6 — Observations (no verdict)

`step_type` enum with 4 values created in migration 00000000100105 (Build J, 2026-04-06). WIRING_STATUS.md (Sequential Collections section) shows a "Wired 2026-04-13" update for the dashboard-rendering piece that the registry row calls out as "next incremental step." The registry's `🔗 Partially Wired` status may be stale relative to the 2026-04-13 dashboard-rendering update. Flag for synthesis.

---

## Entry 498 — `Reading List Studio template`

**Registry line:** 498
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Reading List Studio template | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — `ex_reading_list` in studio-seed-data.ts. Studio.tsx handleCustomize tracks sequentialTemplateId and opens SequentialCreatorModal with `initialDefaults` (mastery + duration tracking + active_count=1 + manual promotion). |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names `ex_reading_list` template ID + Studio.tsx `handleCustomize` + `SequentialCreatorModal` + `initialDefaults`. Identifier at (a).

### Field 2 — Code presence check

```
Grep command: pattern=`ex_reading_list`, output_mode=files_with_matches
Hits: 6 files:
  - CLAUDE.md (convention #164)
  - STUB_REGISTRY.md
  - .claude/completed-builds/2026-04/build-j-prd-09a-09b-linked-steps.md
  - src/pages/Studio.tsx
  - src/components/studio/studio-seed-data.ts
  - claude/feature-decisions/PRD-09A-09B-Linked-Steps-Mastery.md
```

Batch D earlier confirmed `id: 'ex_reading_list'` at line 183 of `studio-seed-data.ts`.

### Field 3 — Wiring check

- Callers: Studio.tsx handleCustomize opens SequentialCreatorModal with this template's initialDefaults.
- Most recent touching commit: Build J era (2026-04-06).

### Field 4 — Documentation cross-reference

- **CLAUDE.md #164:** "Reading List is a Studio template (`ex_reading_list`), not a new list type. It opens `SequentialCreatorModal` with `initialDefaults: { defaultAdvancementMode: 'mastery', defaultRequireApproval: true, defaultTrackDuration: true }`."
- **WIRING_STATUS.md Sequential Collections section:** implicit reference via "sequential creation entry points."

### Field 5 — What was NOT checked

- Exact body of the `ex_reading_list` template entry in studio-seed-data.ts (not opened line by line; existence of ID verified but initialDefaults contents not re-read).
- Studio.tsx handleCustomize body not re-opened this packet.

### Field 6 — Observations (no verdict)

`ex_reading_list` template exists in `studio-seed-data.ts` at line 183. CLAUDE.md #164 documents the template and the initialDefaults mom opens it with. 6 files reference the identifier. Registry status `✅ Wired` supported.

---

## Entry 500 — `Randomizer draw modes (focused / buffet / surprise)`

**Registry line:** 500
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Randomizer draw modes (focused / buffet / surprise) | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — DrawModeSelector component + Randomizer.tsx rendering forks (Focused locks after one draw, Buffet shows N/max slot count, Surprise Me shows auto-draw notice with no manual draw button). useSurpriseMeAutoDraw hook uses smart-draw weighting. |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names `DrawModeSelector`, `Randomizer.tsx`, `useSurpriseMeAutoDraw`. Also the column `lists.draw_mode` per CLAUDE.md #162. Identifier at (a).

### Field 2 — Code presence check

```
Grep command: pattern=`DrawModeSelector|useSurpriseMeAutoDraw`, output_mode=files_with_matches
Hits: 7
  - CLAUDE.md
  - STUB_REGISTRY.md
  - .claude/completed-builds/2026-04/build-j-prd-09a-09b-linked-steps.md
  - src/pages/Lists.tsx
  - claude/feature-decisions/PRD-09A-09B-Linked-Steps-Mastery.md
  - src/components/lists/DrawModeSelector.tsx
  - src/hooks/useRandomizerDraws.ts
```

Both named identifiers found as actual source files.

### Field 3 — Wiring check

- Callers: Lists.tsx renders DrawModeSelector; useRandomizerDraws hook contains auto-draw logic.
- Execution-flow location: React component + hook + Lists page consumer.
- Most recent touching commit: Build J era (calibration entry confirmed `207235e 2026-04-06` for the Build J bundle, though individual file commits may differ).

### Field 4 — Documentation cross-reference

- **CLAUDE.md #162:** "Randomizer draw modes are list-level configuration (`lists.draw_mode`, randomizer-only; NULL for other list types): `focused`, `buffet`, `surprise`."
- **CLAUDE.md #163:** Surprise Me determinism / UNIQUE partial index.
- **WIRING_STATUS.md Sequential Collections section** and **Lists Victory Mode section** (tangentially, Randomizer rows).

### Field 5 — What was NOT checked

- `lists.draw_mode` column definition not directly grep-verified in this packet (live_schema confirms column 26 on `lists`).
- DrawModeSelector body not opened.

### Field 6 — Observations (no verdict)

`DrawModeSelector.tsx` component and `useRandomizerDraws.ts` hook exist as real source files. CLAUDE.md #162 and #163 document the three modes and determinism behavior. Registry status `✅ Wired` supported.

---

## Entry 517 — `PRD-28B Compliance & Progress Reporting (6 tables)`

**Registry line:** 517
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| PRD-28B Compliance & Progress Reporting (6 tables) | PRD-28B | Separate build | ⏳ Unwired (MVP) | `homeschool_family_config`, `homeschool_student_config`, `education_standards`, `standard_evidence`, `report_templates`, `esa_invoices`. Consumes `homeschool_time_logs` + `homeschool_subjects` from PRD-28. Needs working data first. |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names all 6 tables: `homeschool_family_config`, `homeschool_student_config`, `education_standards`, `standard_evidence`, `report_templates`, `esa_invoices`. Identifier at (a).

### Field 2 — Code presence check

Batch B already established (see entry 195): grep command `pattern=`report_templates|esa_invoices|homeschool_family_config|education_standards`, path=`supabase/migrations`, output_mode=files_with_matches` returned ZERO migration files.

None of the 6 PRD-28B tables exist in any migration. Stub's `⏳ Unwired (MVP)` aligns with grep absence — all 6 tables are genuinely unbuilt.

The existing `homeschool_configs`, `homeschool_subjects`, and `homeschool_time_logs` tables (from PRD-28 Tracking/Allowance, separate from PRD-28B) are present in live_schema — these are the "Consumes ... from PRD-28" data sources that the stub references.

### Field 3 — Wiring check

Skipped — no PRD-28B tables created.

### Field 4 — Documentation cross-reference

- **PRD-28B:** extensive design doc with all 6 tables specified.
- **feature_glossary.md PRD-28B row:** lists all 6 tables as the expected schema.
- **Related stubs:** entries 195 (Custom report templates), 279 (IEP template), 280 (Therapy template), 291 (Family Newsletter template) all depend on these tables. Of those, entry 291 has `✅ Wired` status — which is inconsistent with this entry's `⏳ Unwired (MVP)` claim (see entry 195/291 observation).

### Field 5 — What was NOT checked

- Whether any partial migration exists in an unapplied / WIP state outside `supabase/migrations/`.
- Whether related PRD-28B addenda (prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md) contain table-level updates not yet translated to migrations.

### Field 6 — Observations (no verdict)

None of the 6 PRD-28B tables exist in the migration set (re-confirmed in this packet). Stub status `⏳ Unwired (MVP)` aligns. Registry entries 195 and 291 (both `✅ Wired` claiming templates that would live in `report_templates`) are inconsistent with this entry's `⏳ Unwired` claim — flag for synthesis. Entries 279 and 280 (`📌 Post-MVP` for individual template kinds) are consistent.

---

## Entry 532 — `lila_messages.safety_scanned` column (migration 7, line 86)

**Registry line:** 532
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| `lila_messages.safety_scanned` column (migration 7, line 86) | PRD-05 (migration 7) | PRD-30 | ⏳ Unwired (MVP) | PRD-30 Safety Monitoring build — column exists in schema but no logic reads or writes it. Will be wired when PRD-30 builds its safety-scan pipeline. |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names column + migration + line. Identifier at (a).

### Field 2 — Code presence check

```
Grep command: pattern=`safety_scanned`, path=`supabase/migrations/00000000000007_lila_ai_system.sql`, output_mode=content, -n=true
Hits at exact lines named in stub:
  - line 44  safety_scanned BOOLEAN NOT NULL DEFAULT false,  (on lila_conversations — entry 533's reference)
  - line 86  safety_scanned BOOLEAN NOT NULL DEFAULT false,  (on lila_messages — THIS entry's reference)
  - lines 92-93  CREATE INDEX idx_lm_safety ON public.lila_messages(conversation_id, safety_scanned) WHERE safety_scanned = false
```

Column exists at exactly the line the stub names (migration 7, line 86). Supporting index present.

### Field 3 — Wiring check

- Callers: per stub text, "no logic reads or writes it." Not independently re-grep'd in this packet — stub claim accepted at face value pending synthesis.
- Execution-flow location: DB column + supporting index, awaiting PRD-30 Safety Monitoring build.

### Field 4 — Documentation cross-reference

- **CLAUDE.md:** Safety Monitoring / Crisis Override (convention #7) references the capability but not the specific column.
- **live_schema.md `lila_messages`:** column 6 = `safety_scanned`.

### Field 5 — What was NOT checked

- Whether any Edge Function actually reads or writes `safety_scanned` (stub claims no — not independently verified).
- Whether the partial index `idx_lm_safety` would be used by any current query.

### Field 6 — Observations (no verdict)

Column `safety_scanned` BOOLEAN NOT NULL DEFAULT false exists on `lila_messages` at exactly migration 7 line 86, with supporting partial index at lines 92-93. Stub status `⏳ Unwired (MVP)` claims no reader/writer logic — not independently re-grep'd.

---

## Entry 533 — `lila_conversations.safety_scanned` column (migration 7, line 44)

**Registry line:** 533
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| `lila_conversations.safety_scanned` column (migration 7, line 44) | PRD-05 (migration 7) | PRD-30 | ⏳ Unwired (MVP) | PRD-30 Safety Monitoring build — same pattern as the message-level column at the conversation level. Wired alongside the message-level column. |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names column + migration + line. Identifier at (a).

### Field 2 — Code presence check

Same grep as entry 532:
```
- migration 7, line 44  `safety_scanned BOOLEAN NOT NULL DEFAULT false,`  (on lila_conversations)
```

Column exists at exactly the line the stub names.

### Field 3 — Wiring check

Same pattern as entry 532 — stub claims no reader/writer logic; PRD-30 will wire.

### Field 4 — Documentation cross-reference

- **live_schema.md `lila_conversations`:** column 10 = `safety_scanned`.

### Field 5 — What was NOT checked

Same as entry 532.

### Field 6 — Observations (no verdict)

Column `safety_scanned` BOOLEAN exists on `lila_conversations` at migration 7 line 44. Stub status `⏳ Unwired (MVP)` is for the reader/writer logic; the column is present per spec.

---

## Entry 534 — Safe Harbor `'manage'` permission preset (migration 19, lines 463-469)

**Registry line:** 534
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Safe Harbor `'manage'` permission preset (migration 19, lines 463-469, Full Partner preset, `safe_harbor: 'manage'` on line 468) | PRD-02 (migration 19) | PRD-20 | ⏳ Unwired (MVP) | PRD-20 Safe Harbor frontend — preset entry exists and is dormant. Expected no-op until PRD-20 ships the Safe Harbor UI and gating tables. Behaves correctly today as an unused permission value. |
```

### Field 1 — Implementation identifier

**(a) Stub entry.** Directly names migration 19, line range 463-469, preset name "Full Partner", and the specific field `safe_harbor: 'manage'` on line 468. Identifier at (a).

### Field 2 — Code presence check

Read of `supabase/migrations/00000000000019_schema_remediation_batch2.sql` lines 460-471:

```sql
460 INSERT INTO public.permission_presets (preset_name, target_role, permissions_config, is_system_preset)
461 VALUES
462   -- Additional Adult presets
463   ('Full Partner', 'additional_adult', '{
464     "tasks": "manage", "calendar": "manage", "messaging": "manage",
465     "lists": "manage", "victories": "manage", "widgets": "manage",
466     "journal": "view", "notepad": "manage", "guiding_stars": "manage",
467     "best_intentions": "manage", "innerworkings": "manage",
468     "safe_harbor": "manage", "archives": "view", "rhythms": "manage",
469     "vault": "view", "lila": "view"
470   }', true),
```

Preset name, line range, and `safe_harbor: 'manage'` at line 468 all match the stub's specific identifiers exactly.

### Field 3 — Wiring check

- Callers: `permission_presets` table is consumed by the Permission Hub UI when mom applies a preset. The `safe_harbor` key inside the JSONB `permissions_config` is only consumed if the Safe Harbor feature is gated by that key — per stub, PRD-20 would be the consumer and is not built.
- Execution-flow location: DB seed row (one of 6 preset rows in `permission_presets` per live_schema).
- Most recent touching commit (migration 19): within the 2026-03-24 remediation bundle.

### Field 4 — Documentation cross-reference

- **live_schema.md `permission_presets`:** 6 rows (consistent with Full Partner being one of the adult-role presets).
- **feature_glossary.md PRD-20:** lists `safe_harbor` and `safe_harbor_guided` feature keys.
- **STUB_REGISTRY.md line 535:** adjacent stub "Safe Harbor placeholder UI + ViewAs exclusion" — also waiting for PRD-20.

### Field 5 — What was NOT checked

- Whether any code path currently queries the JSONB `permissions_config->>'safe_harbor'` value (stub claims dormant — not independently re-grep'd).
- Whether the key 'manage' is a recognized permission level elsewhere (level enum on `member_permissions.access_level` was not checked for 'manage' as a valid value in this packet).

### Field 6 — Observations (no verdict)

Preset row 'Full Partner' exists at migration 19 lines 463-470 with `"safe_harbor": "manage"` at line 468 — exactly matching the stub row's line-level references. live_schema's `permission_presets` table has 6 rows. Stub status `⏳ Unwired (MVP)` describes the dormant state pending PRD-20; the seed row itself is present as a harmless placeholder.

---

Integrity check after final batch: STUB_REGISTRY.md = 547 lines (re-verified), HALT absent.

<!-- PROGRESS MARKER: final batch complete (entries 469, 492, 495, 496, 498, 500, 517, 532, 533, 534 — 10 packets) — 43 total entries processed in Session 1 (1 calibration + 42 partition entries) -->

---

## PARTITION COMPLETE

Session 1 (Schema remainder) — 43 entries processed:
- 1 calibration packet (entry 494)
- 42 partition entries: 28, 32, 34, 36, 37, 38, 39, 40, 74, 88, 133, 163, 173, 194, 195, 197, 230, 231, 243, 256, 257, 258, 259, 260, 267, 268, 269, 270, 279, 280, 291, 390, 469, 492, 495, 496, 498, 500, 517, 532, 533, 534

All 6 fields populated in every packet. Integrity checks passed between every batch (547 lines, no HALT). No forbidden actions taken. No verdicts reached.

**Notable findings surfaced for synthesis review:**

1. **PRD-28B report_templates table absent from migrations** — affects entries 195 (`✅ Wired` claim inconsistent), 279 (`📌 Post-MVP`), 280 (`📌 Post-MVP`), 291 (`✅ Wired` claim inconsistent), 517 (`⏳ Unwired` consistent). Registry entries 195 and 291 conflict with entry 517.
2. **Entry 88 Family-level GuidingStars** — `owner_type` column exists on `guiding_stars` but PRD-12B (Family Vision Quest) appears not to have built any `family_vision_*` tables. "Wired By PRD-12B" attribution questionable.
3. **CLAUDE.md #161 line-number drift** — convention says `PendingApprovalsSection` is at Tasks.tsx line 1062; actual location is line 1585 (calibration entry 494).
4. **Entry 390 "15 in DB"** and **Entry 492 "27 seed templates"** — count claims don't match current state (40+ in frontend catalog, 33 in DB). Two different count drifts.
5. **Entry 496 `🔗 Partially Wired` possibly stale** — WIRING_STATUS.md shows the "next incremental step" named by the registry row was completed 2026-04-13 (RoutineStepChecklist dashboard rendering). Registry row appears to predate that update.
6. **Entry 243 Task unmark cascade** — explicit "not implemented" per CLAUDE.md #206, consistent with `⏳ Unwired` claim.
7. **Entry 269 `timer_goal` naming collision** — could be confused with the built `tracker_goal` page earning mode. Founder synthesis may want to disambiguate.
8. **Entries 133 and 197 (My Circle)** — overlapping capability, both `📌 Post-MVP`, both capability-only.

Evidence file ready for morning synthesis.
