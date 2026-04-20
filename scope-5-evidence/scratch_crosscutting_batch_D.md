# Scope 5 — Crosscutting Partition Batch D

> Session: sub-agent of Session 4 (Crosscutting). Scope: 40 entries (lines 347, 348, 349, 350, 357, 361, 362, 373, 374, 375, 376, 377, 415, 419, 422, 423, 424, 431, 438, 440, 447, 448, 454, 455, 460, 461, 462, 467, 474, 491, 511, 512, 513, 514, 515, 518, 519, 520, 521, 536).
> Recipe: `scope-5-evidence/EVIDENCE_RECIPE.md`
> Registry baseline: 547 lines; verified at session start.
> HALT probe at session start: absent.

<!-- PROGRESS MARKER: starting batch D at 2026-04-19 — processing lines 347, 348, 349, 350, 357, 361, 362, 373, 374, 375 -->

---

## Entry 347 — `Family holiday calendar auto-exclusion`

**Registry line:** 347
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Family holiday calendar auto-exclusion | PRD-35 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

- (a) Stub row: names the capability ("Family holiday calendar auto-exclusion") but no concrete identifier (no table, function, or column named).
- (b) `WIRING_STATUS.md`: Grep for `holiday` returned no matches in WIRING_STATUS.md.
- (c) `CLAUDE.md`: grep for `holiday` found no convention touching this capability.
- (d) PRD-35 (`prds/infrastructure/PRD-35-Universal-Scheduler.md`): grep found "holiday" in the PRD but no concrete schema identifier emitted in the stub context.
- (d.5) Not applicable — no filename named at levels (a)-(d) for a bounded single-file lookup.

```
Identifier: CAPABILITY-ONLY — no implementation identifier found.
Sources checked:
  (a) stub entry line 347 — capability phrase only
  (b) WIRING_STATUS.md — no mention of "holiday" anywhere
  (c) CLAUDE.md — no convention mentioning holiday-exclusion from recurrence
  (d) PRD-35 Universal Scheduler — discusses holidays conceptually, no concrete table/column/function for auto-exclusion
```

### Field 2 — Code presence check

skipped — no identifier to grep for.

Ancillary check (not a substitute for identifier-based grep): Grep `auto.exclu|family_holiday|exclude_holidays|holiday_rule` across `src/` returned 0 matches. Grep for `holiday` across `src/` found only `useTodayHolidays.ts` / `TodayIsWidget.tsx` which are display-widget concerns, not scheduler auto-exclusion.

### Field 3 — Wiring check

skipped — no code presence.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** no mention.
**Cross-PRD addendum mentions:** not searched in this packet (no identifier); PRD-35 + addenda name holidays conceptually but no concrete implementation.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none matched.

### Field 5 — What was NOT checked

- Whether a latent migration or function scaffold exists under a non-obvious name (e.g., "calendar_exclusions"). Grep for `exclusion` across migrations could clarify, but without a concrete identifier from authoritative docs the search would speculate.
- Semantic question (blocked by Convention 242): "Does any Edge Function or migration implement date-list exclusion logic for RRULE expansion?" — deferred.

### Field 6 — Observations (no verdict)

Capability-only entry. Stub row marks it `📌 Post-MVP` with no wiring target. No concrete identifier exists in authoritative docs, no grep-visible implementation in the codebase.

---

## Entry 348 — `ICS export from RRULE strings`

**Registry line:** 348
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| ICS export from RRULE strings | PRD-35 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

- (a) Stub row: names the capability but no concrete identifier.
- (b) `WIRING_STATUS.md`: Calendar Import section names `src/lib/icsParser.ts` for IMPORT; no row for EXPORT.
- (c) `CLAUDE.md`: no convention for ICS export.
- (d) PRD-35: concept-level only; no named export utility.
- (d.5) Not applicable — importer file is named at (b) but entry is specifically EXPORT, opposite direction.

```
Identifier: CAPABILITY-ONLY — no implementation identifier found.
Sources checked:
  (a) stub entry line 348 — capability phrase only
  (b) WIRING_STATUS.md — Calendar Import table covers .ics parse on import; no export row
  (c) CLAUDE.md — no convention
  (d) PRD-35 — no named export function
```

### Field 2 — Code presence check

skipped — no identifier to grep for.

Ancillary (not identifier-based): Grep `ICS export|exportIcs|exportToICS|iCalendar` (-i) across `src/` surfaced only `src/lib/icsParser.ts` (IMPORT path only). No export helper found in direct grep.

### Field 3 — Wiring check

skipped — no code presence.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** no row for "ICS export"; only ICS import is documented.
**Cross-PRD addendum mentions:** not searched.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether server-side Edge Functions or database views produce RFC 5545 output — grep for `BEGIN:VCALENDAR` or `VEVENT` would clarify, but registry row predicts Post-MVP.

### Field 6 — Observations (no verdict)

Capability-only entry. Registry marks `📌 Post-MVP`. `src/lib/icsParser.ts` implements parsing on intake, not export — evidence of the opposite direction of dataflow but not this capability.

---

## Entry 349 — `LiLa schedule extraction cards`

**Registry line:** 349
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| LiLa schedule extraction cards | PRD-35 | PRD-08 | ⏳ Unwired (MVP) | Phase 09 |
```

### Field 1 — Implementation identifier

- (a) Stub row: names the capability. No concrete identifier.
- (b) `WIRING_STATUS.md`: no row.
- (c) `CLAUDE.md`: no convention.
- (d) `claude/architecture.md` lists a planned Edge Function: `schedule-extract` — "Parse schedule intent from text." (line 170 of architecture.md).
- (d.5) Not applicable — no file named at levels (a)-(d) for a single-file lookup.

```
Identifier: `schedule-extract` Edge Function (from claude/architecture.md:170). 
Source: claude/architecture.md line 170 — Edge Function registry row: "| `schedule-extract` | Parse schedule intent from text |"
```

### Field 2 — Code presence check

```
Grep command: Glob `supabase/functions/schedule-extract/*` via Bash `ls supabase/functions`
Hits: 0 — `supabase/functions` directory listing does not contain a `schedule-extract` folder.
```

Grep `schedule_extract|schedule-extract|conversational.schedule` across repo: only docs hits (scope-5 partition file, registry, PRD-35 PRD, architecture.md, PRD-05-repair feature decision). No source code match.

### Field 3 — Wiring check

skipped — no code presence.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** no mention.
**Cross-PRD addendum mentions:** PRD-35 itself references schedule extraction in conversational flows; formal addendum search not performed beyond Glob.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none for extraction cards.

### Field 5 — What was NOT checked

- Whether `ai-parse` or `lila-chat` internally dispatches schedule-extract-flavored prompts without a dedicated function. Convention 242 blocks mgrep; grep couldn't confirm inline dispatch.

### Field 6 — Observations (no verdict)

`claude/architecture.md` lists `schedule-extract` as a planned Edge Function. No such function exists in `supabase/functions/`. Registry marks `⏳ Unwired (MVP)` → Phase 09 (PRD-08 wiring target).

---

## Entry 350 — `LiLa conversational schedule builder`

**Registry line:** 350
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| LiLa conversational schedule builder | PRD-35 | PRD-05 | ⏳ Unwired (MVP) | Phase 06 |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability only.
- (b) `WIRING_STATUS.md`: no row.
- (c) `CLAUDE.md`: no convention.
- (d) PRD-35 and PRD-05: no concrete identifier for a distinct "conversational schedule builder" exposed.
- (d.5) not applicable.

```
Identifier: CAPABILITY-ONLY — no implementation identifier found.
Sources checked:
  (a) stub entry line 350 — capability phrase only
  (b) WIRING_STATUS.md — no row
  (c) CLAUDE.md — no convention
  (d) PRD-35 + PRD-05 — no concrete function, component, or mode_key for a conversational schedule builder
```

### Field 2 — Code presence check

skipped — no identifier to grep for.

Ancillary: Grep `conversational.schedule|schedule_builder` in src/ returned 0 matches.

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** not searched.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether the capability is bundled into `lila-chat` generic flow. Semantic search (blocked).

### Field 6 — Observations (no verdict)

Capability-only. Registry marks `⏳ Unwired (MVP)` with PRD-05 as wiring target.

---

## Entry 357 — `All 38 color themes`

**Registry line:** 357
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| All 38 color themes | PRD-03 | PRD-03 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier

- (a) Stub row: "38 color themes" but no concrete identifier. 
- (b) WIRING_STATUS.md: no row.
- (c) `CLAUDE.md` Convention #42 (line 199): **"38 themes implemented across 6 mood categories … Each has light + dark variants with 20 semantic token fields including `accentDeep`, `textOnPrimary`, `borderDefault`."** Does not name a file.
- (d) PRD-03 Design System: not re-opened; (c) provides an answer.
- (d.5) (c) names the 20-field theme shape; a single-file source code lookup required. File named at (b)/(c) — none explicitly — so escalation to capability-only would be valid, but the theme system lives under `src/lib/theme/` per the tree; opening `src/lib/theme/tokens.ts` (named via a filesystem sweep at the start of this batch, not via authoritative docs) provides `ThemeKey` union + `themes: Record<ThemeKey, ThemeColors>` exports. Strictly per recipe (d.5) requires the file be named at (a)-(d); this wasn't, so flagging as partial-identifier.

```
Primary identifier: `ThemeKey` union and `themes` exported record in `src/lib/theme/tokens.ts` (discovered via filesystem enumeration, not via authoritative doc naming).
Secondary: `ThemeColors` interface (20 fields including `accentDeep`, `textOnPrimary`, `borderDefault` matching Convention #42).
```

### Field 2 — Code presence check

```
Grep command: pattern=`ThemeKey|themes: Record<ThemeKey`, path=`src/lib/theme`, output_mode=content, -n=true
Files:
  - src/lib/theme/tokens.ts:117  `export type ThemeKey =`
  - src/lib/theme/tokens.ts:189  `export const themes: Record<ThemeKey, ThemeColors> = {`
  - src/lib/theme/ThemeProvider.tsx:3, 11, 19, 44, 218, 254 — ThemeKey flowing through the provider
  - src/lib/theme/index.ts:5 — re-exports ThemeKey
```

First-context window (`src/lib/theme/tokens.ts:117-139`): enumerates theme keys in 7 groups — Original 9, Warm & Cozy 7, Cool & Calm 7, Bold & Rich 6, Soft & Light 5, Bright & Fun 6, Seasonal 6. Total keys in the union = 9+7+7+6+5+6+6 = 46. Convention #42 says 38. Discrepancy not resolved within this packet.

### Field 3 — Wiring check

**Callers/Importers:** `ThemeProvider.tsx` imports `themes` and `ThemeKey` from tokens.ts and consumes via `setTheme` / `applyTokens`. `ThemeProvider` is the top-level wrapper.
**Execution-flow location:** TypeScript type + object literal in a shared lib module; runtime provider wraps the app shell.
**Most recent touching commit (for `tokens.ts`):** `a0173de 2026-03-24 21:48:53 -0500 Gradient toggle shows gradient track; Amatic SC headings scaled 1.5x`

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** not searched.
**PlannedExpansionCard / stub UI:** not applicable.
**CLAUDE.md convention mention:** Convention #42 at line 199 quoted above.

### Field 5 — What was NOT checked

- Whether "38" in Convention #42 reflects a subset (e.g., production-enabled themes) versus the full `ThemeKey` union of 46 observed. Could be a documentation drift or a deliberate inclusion/exclusion rule. No code artifact (e.g., `VISIBLE_THEMES` subset) searched for.
- Whether all themes actually carry the `accentDeep` / `textOnPrimary` / `borderDefault` fields in both `light` and `dark`. Would require reading the full `themes` literal.
- Whether `src/lib/theme/tokens.ts` was the correct file to open under (d.5) — strictly per recipe, (d.5) requires the file be named at (a)-(d); it was discovered via filesystem listing. Flagging as methodological uncertainty.

### Field 6 — Observations (no verdict)

`CLAUDE.md` Convention #42 states 38 themes with specific 20-field shape. `src/lib/theme/tokens.ts` defines a `ThemeKey` union with 46 members (by counting the group annotations) and a `themes: Record<ThemeKey, ThemeColors>` export. Registry marks `✅ Wired`. Count discrepancy between Convention "38" and union literal "46" is observable but not classified.

---

## Entry 361 — `Shell token overrides (touch/font/spacing)`

**Registry line:** 361
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Shell token overrides (touch/font/spacing) | PRD-03 | PRD-03 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability only.
- (b) WIRING_STATUS.md: no row.
- (c) `CLAUDE.md` Convention #45 (line 202): **"Shell token overrides applied via `applyShellTokens()`: touch targets (44/48/56px), font scale, line height, icon size, transition timing per shell type."** Names the function.
- (d) not required.

```
Source: CLAUDE.md convention #45 line 202.
Identifier: `applyShellTokens()` function.
```

### Field 2 — Code presence check

```
Grep command: pattern=`applyShellTokens|shellTokens`, path=`src/lib/theme`, output_mode=content, -n=true
Hits: 4
Files:
  - src/lib/theme/shellTokens.ts:9  `export function applyShellTokens(shell: ShellType): void {`
  - src/lib/theme/ThemeProvider.tsx:4  `import { applyShellTokens } from './shellTokens'`
  - src/lib/theme/ThemeProvider.tsx:197  `applyShellTokens(shell)`
  - src/lib/theme/index.ts:2  `export { applyShellTokens } from './shellTokens'`
```

First-context window (`src/lib/theme/shellTokens.ts:9-44`): switches on `shell` type; for mom/adult/independent sets `--font-size-base=1rem`, `--touch-target-min=44px`, `--line-height-normal=1.5`, `--vibe-transition`, `--icon-size-default=20px`; for guided: 48px touch, 1.0625rem font; for play: 56px touch, 1.25rem font + bouncy `cubic-bezier`.

### Field 3 — Wiring check

**Callers/Importers:** imported + called in `ThemeProvider.tsx:197`. Re-exported at `index.ts:2`.
**Execution-flow location:** Pure utility function; consumed by provider.
**Most recent touching commit (for `shellTokens.ts`):** `da637f1 2026-03-24 08:57:21 -0500 Foundation remediation (Phases 01-06)…`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** not searched.
**PlannedExpansionCard / stub UI:** not applicable.
**CLAUDE.md convention mention:** Convention #45 at line 202 (quoted above).

### Field 5 — What was NOT checked

- Whether `ThemeProvider` actually re-renders / re-applies tokens on shell change (would need to trace `useEffect` / dependency array inside provider). Observed only at the call-site line.
- Whether the touch-target / font-scale outputs match the exact values referenced by Convention #45 for every shell. Spot-checked mom/adult/independent (44px), guided (48px), play (56px) — match.

### Field 6 — Observations (no verdict)

`applyShellTokens()` defined at `src/lib/theme/shellTokens.ts:9`, imported and called once at `ThemeProvider.tsx:197`, re-exported via `index.ts`. Switch arms cover all five shell values with touch-target / font-scale / icon-size overrides matching Convention #45.

---

## Entry 362 — `Theme persistence to Supabase`

**Registry line:** 362
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Theme persistence to Supabase | PRD-03 | PRD-03 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability only.
- (b) WIRING_STATUS.md: no row.
- (c) `CLAUDE.md` Convention #47 (line 204): **"Theme preferences persist to Supabase `family_members.theme_preferences` JSONB via `useThemePersistence` hook."** Names hook + column.
- (d) not required.

```
Primary identifier: `useThemePersistence` hook.
Secondary identifier: `family_members.theme_preferences` JSONB column.
Source: CLAUDE.md convention #47 line 204.
```

### Field 2 — Code presence check

```
Grep command: pattern=`theme_preferences`, path=`src`, output_mode=files_with_matches
Hits: 3 files
Files:
  - src/lib/theme/useThemePersistence.ts
  - src/hooks/useFamilyMember.ts
  - src/features/permissions/ViewAsModal.tsx
```

```
Grep command: pattern=`useThemePersistence`, path=`src`, output_mode=files_with_matches (not re-run; hook file found via filesystem)
```

First-context window (`src/lib/theme/useThemePersistence.ts:1-40`): hook imports `supabase` client, `useFamilyMember`, `useViewAs`, `useTheme`; PRD-03 comment block; declares `ThemePreferences` interface with `theme`, `vibe`, `colorMode`, `gradientEnabled`, `fontScale`; exports `useThemePersistence()`. Hook body manages view-as target + persist/apply refs to suppress feedback loops.

### Field 3 — Wiring check

**Callers/Importers:** hook imported by the theme provider/shell tree (not re-grepped in this packet).
**Execution-flow location:** React hook consuming Supabase client.
**Most recent touching commit (for `useThemePersistence.ts`):** `47247d4 2026-04-09 22:36:44 -0500 chore: remove 7 stale eslint-disable directives`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** not searched.
**PlannedExpansionCard / stub UI:** not applicable.
**CLAUDE.md convention mention:** Convention #47 line 204 quoted above.
**Live schema mention:** `claude/live_schema.md` `family_members` table row 34 lists `theme_preferences` column.

### Field 5 — What was NOT checked

- Whether `useThemePersistence()` is actually mounted in the shell tree (need to grep for its call site). A hook that is defined but never mounted would persist nothing.
- Whether the Supabase upsert respects RLS — would need to inspect the write path inside the hook body (only first 40 lines inspected).

### Field 6 — Observations (no verdict)

Hook `useThemePersistence` exists at `src/lib/theme/useThemePersistence.ts`, reads/writes `family_members.theme_preferences`. Column is present in live schema. Convention #47 names both the hook and the column as the wiring. Registry `✅ Wired`.

---

## Entry 373 — `PWA entry points`

**Registry line:** 373
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| PWA entry points | PRD-04 | PRD-33 | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability only.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md: no convention naming PWA wiring.
- (d) `claude/architecture.md` (pasted in project instructions) lists five PWA entry routes (`/hub`, `/hub/tv`, `/dashboard`, `/sweep`, `/feed`) and names the feature under PRD-33 as Post-MVP.
- (d.5) not applicable — routes, not a named file.

```
Identifier: CAPABILITY-ONLY at the "installable PWA" level — no manifest file or service-worker registration named in authoritative docs.
Sources checked:
  (a) stub entry line 373
  (b) WIRING_STATUS.md — no row
  (c) CLAUDE.md — no convention
  (d) architecture.md enumerates 5 intended PWA routes; no named manifest/service-worker file
```

### Field 2 — Code presence check

skipped — no identifier to grep for.

Ancillary: `ls public/` does not surface `manifest.json` or `sw.js`; Grep `vite-plugin-pwa|registerSW` in package.json returned 0.

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** not searched.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none (PRD-33 listed as Post-MVP in feature_glossary).

### Field 5 — What was NOT checked

- Whether a `manifest.webmanifest` exists elsewhere (e.g., auto-generated at build time). Not verified.

### Field 6 — Observations (no verdict)

Capability-only entry. Registry marks `📌 Post-MVP` → PRD-33 wiring target. `public/` listing shows favicons but no manifest/service-worker. `feature_glossary.md` lists PRD-33 as Post-MVP.

---

## Entry 374 — `Timer idle reminders`

**Registry line:** 374
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Timer idle reminders | PRD-36 | PRD-15 | ⏳ Unwired (MVP) | Phase 16 |
```

### Field 1 — Implementation identifier

- (a) Stub row: names capability.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md: no convention specific to idle reminders.
- (d) PRD-36: `timer_configs` table has `idle_reminder_minutes`, `idle_repeat_minutes` (per live_schema.md).
- (d.5) File not named at (a)-(d) — but live_schema column is a concrete identifier.

```
Identifier: `idle_reminder_minutes` / `idle_repeat_minutes` columns on `timer_configs`; React state `idleReminders` in TimerProvider (inferred but not via authoritative naming).
```

### Field 2 — Code presence check

```
Grep command: pattern=`idle_reminder|idleReminder|idle_repeat`, path=`src`, output_mode=files_with_matches
Hits: 3 files
Files:
  - src/features/timer/TimerConfigPanel.tsx
  - src/features/timer/TimerProvider.tsx
  - src/features/timer/types.ts
```

First-context window (TimerProvider.tsx lines 59, 140-157, 266-287):
- Line 59: `idleReminders: IdleReminder[]`
- Line 140: `const [idleReminders, setIdleReminders] = useState<IdleReminder[]>([])`
- Line 156: `const idleThreshold = timerConfig?.idle_reminder_minutes ?? 45`
- Line 157: `const idleRepeat = timerConfig?.idle_repeat_minutes ?? 60`
- Line 279: `{idleReminders.length > 0 && (` — renders reminder component

### Field 3 — Wiring check

**Callers/Importers:** idle reminder state is local to `TimerProvider`; config columns read from `timer_configs` table per convention.
**Execution-flow location:** React context provider.
**Most recent touching commit (TimerProvider.tsx):** `6751685 2026-03-25 05:14:17 -0500 PRD-10 Phase A: Widget system, 6 tracker types, fix all TS build errors`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** no direct mention.
**Cross-PRD addendum mentions:** PRD-36 addendum presumably covers (not opened this packet).
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** Convention #34 mentions timer sessions; no specific idle-reminder convention.

### Field 5 — What was NOT checked

- Whether idle reminders actually fire in production (no runtime observation). The stub claims `⏳ Unwired (MVP)` with PRD-15 wiring target (presumably for converting reminders into notifications). Code appears to render something inline already; the "unwired" status may refer to the messaging/notification downstream rather than the local render path.
- Whether PRD-15 wiring target refers to surfacing reminders as push notifications (not verified).

### Field 6 — Observations (no verdict)

Timer config columns present in schema; TimerProvider reads them with defaults of 45/60 minutes and maintains an `idleReminders` array rendered inline. Registry marks `⏳ Unwired (MVP)` → PRD-15 (messaging/notifications).

---

## Entry 375 — `Timer → homeschool time logs`

**Registry line:** 375
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Timer → homeschool time logs | PRD-36 | PRD-28 | ⏳ Unwired (MVP) | Phase 32 |
```

### Field 1 — Implementation identifier

- (a) Stub row: names both surfaces; no function-level identifier.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md Convention #227 (line re: minutes_logged): names `homeschool_time_logs.minutes_logged` INTEGER.
- (d) PRD-28: uses `homeschool_time_logs` table.

```
Identifier: `time_sessions` → `homeschool_time_logs` bridging code (capability-level; no named function).
```

### Field 2 — Code presence check

```
Grep command: pattern=`time_sessions.*widget|widget_id.*time_session|widget_data_points.*timer`, path=`src`, output_mode=files_with_matches
Hits: 0
```

Separate Grep: `homeschool_time_logs|homeschoolTimeLog` path=`src`, Hits: 2 files (`src/hooks/useHomeschool.ts`, `src/hooks/useTasks.ts`). Neither references `time_sessions` in the same grep surface (not checked for per-file intersection).

### Field 3 — Wiring check

Cannot confirm a bridge; no direct grep intersection found between `time_sessions` and `homeschool_time_logs` in application code.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-28 addendum (not re-opened); PRD-36 addendum.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** Convention #227 (minutes unit rule) but no specific bridge.

### Field 5 — What was NOT checked

- Whether the "Log Learning widget" (PRD-28 sub-phase B artifact per commit `a161015`) internally starts/stops a timer and writes to `homeschool_time_logs`.
- Whether any Edge Function or DB trigger converts timer `ended_at - started_at` into `homeschool_time_logs.minutes_logged`. Grep did not surface such.

### Field 6 — Observations (no verdict)

Registry marks `⏳ Unwired (MVP)` → PRD-28 wiring target. Application-layer grep found no direct bridge between `time_sessions` and `homeschool_time_logs` in `src/`. `useHomeschool.ts` and `useTasks.ts` reference `homeschool_time_logs` separately.

---

<!-- PROGRESS MARKER: completed entries 1-10 (lines 347..375) at 2026-04-19; registry integrity re-check: 547 lines OK, no HALT. Moving to entries 11-20 (lines 376..423). -->

## Entry 376 — `Timer → task completion threshold`

**Registry line:** 376
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Timer → task completion threshold | PRD-36 | PRD-09A | ✅ Wired | Phase 10 |
```

### Field 1 — Implementation identifier

- (a) Stub row: names capability, no function identifier.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md: no specific convention for threshold logic; but live schema columns `tasks.time_tracking_enabled`, `tasks.time_threshold_minutes`, `tasks.focus_time_seconds` are evident.
- (d) PRD-09A + PRD-36 addenda — not re-opened.

```
Primary identifier: `tasks.time_threshold_minutes`, `tasks.time_tracking_enabled`, `tasks.focus_time_seconds` columns.
```

### Field 2 — Code presence check

```
Grep command: pattern=`time_threshold_minutes|time_tracking_enabled|timeSession.*completed`, path=`src`, output_mode=files_with_matches
Hits: 4 files
Files:
  - src/components/tasks/TaskCard.tsx
  - src/types/tasks.ts
  - src/hooks/useTasks.ts
  - src/hooks/useSequentialCollections.ts
```

### Field 3 — Wiring check

**Callers/Importers:** types shared via `src/types/tasks.ts`; mutation and UI consumers in useTasks/TaskCard/useSequentialCollections. Not inspected line-by-line for the threshold→completion rule.
**Execution-flow location:** React hooks + component; schema-backed columns.
**Most recent touching commit (TaskCard.tsx):** not re-queried.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-36 addendum likely.
**PlannedExpansionCard / stub UI:** not applicable.
**CLAUDE.md convention mention:** none specific.

### Field 5 — What was NOT checked

- Whether `focus_time_seconds` → "task complete after N minutes" actually closes a task when a timer crosses threshold. Grep surfaced references but not the completion-trigger logic.
- Whether `TimerProvider` completes tasks when thresholds are reached (e.g., calling `useCompleteTask`). Not verified.

### Field 6 — Observations (no verdict)

Threshold columns exist and are referenced in task hooks + components. Registry marks `✅ Wired`. Actual threshold→auto-complete flow not traced in this packet.

---

## Entry 377 — `Timer → widget data points`

**Registry line:** 377
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Timer → widget data points | PRD-36 | PRD-10 | ⏳ Unwired (MVP) | PRD-10 Phase B |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability only.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md Convention #32-37 describe timers; #32 names `time_sessions` as the canonical timer row. No bridge identifier.
- (d) PRD-10 + PRD-36 addenda not re-opened.

```
Identifier: CAPABILITY-ONLY at the "bridge" level. `time_sessions` and `widget_data_points` are both present in schema but no bridge function is named.
```

### Field 2 — Code presence check

```
Grep command: pattern=`time_sessions.*widget|widget_id.*time_session|widget_data_points.*timer`, path=`src`, output_mode=files_with_matches
Hits: 0
```

Live schema shows `time_sessions.widget_id` column (row 7) — exists in schema but no grep-visible consuming code path.

### Field 3 — Wiring check

skipped — no code presence for the bridge.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-10/36 addenda not opened.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none for this bridge.

### Field 5 — What was NOT checked

- Whether `time_sessions.widget_id` is ever populated or read. Grep shallow.
- Whether any RPC or trigger transforms timer sessions into widget data points.

### Field 6 — Observations (no verdict)

Registry marks `⏳ Unwired (MVP)`. Column `time_sessions.widget_id` exists in live schema but no application-layer bridge found by direct grep.

---

## Entry 415 — `Multiplayer layer` (widgets)

**Registry line:** 415
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Multiplayer layer | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase B |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability only.
- (b) WIRING_STATUS.md: no row for widget multiplayer.
- (c) CLAUDE.md: no convention.
- (d) Live schema: `dashboard_widgets.multiplayer_enabled`, `multiplayer_participants`, `multiplayer_config` columns — names.

```
Primary identifier: `multiplayer_enabled`, `multiplayer_participants`, `multiplayer_config` columns on `dashboard_widgets`.
```

### Field 2 — Code presence check

```
Grep command: pattern=`multiplayer_enabled|multiplayer_participants|multiplayer_config`, path=`src`, output_mode=files_with_matches
Hits: 2 files
Files:
  - src/components/widgets/WidgetConfiguration.tsx
  - src/types/widgets.ts
```

First-context window (WidgetConfiguration.tsx lines 117-121):
```
117:          multiplayer_enabled: true,
118:          multiplayer_participants: mpParticipants,
119:          multiplayer_mode: mpMode,
120:          multiplayer_visual_style: mpVisualStyle,
121:          multiplayer_shared_target: mpSharedTarget,
```

### Field 3 — Wiring check

**Callers/Importers:** only one configuration form references these columns. Rendering logic in widget display components not grepped.
**Execution-flow location:** React form component + type definition.
**Most recent touching commit (types/widgets.ts):** `a161015 2026-04-13 18:20:50 -0500 feat(PRD-28)…`; (WidgetConfiguration.tsx): `90a47a8 2026-04-15 16:13:36 -0500 feat: Studio setup wizards, sticker grid, LiLa knowledge + bug fixes`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-10 addendum not opened.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether widget rendering components actually consume these columns at display time (e.g., collaborative progress bars). Grep only found the write form.
- Whether write actually persists (no mutation trace).

### Field 6 — Observations (no verdict)

Schema columns exist; configuration form writes them. No consumer found on display side via this grep. Registry marks `⏳ Unwired (MVP)` → PRD-10 Phase B.

---

## Entry 419 — `Linked pair deployment`

**Registry line:** 419
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Linked pair deployment | PRD-10 | — | ⏳ Unwired (MVP) | PRD-10 Phase C |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md: no convention.
- (d) Live schema: `dashboard_widgets.linked_widget_id` column.

```
Identifier: `linked_widget_id` column on `dashboard_widgets`.
```

### Field 2 — Code presence check

```
Grep command: pattern=`linked_widget_id|linkedWidget|linked_pair`, path=`src`, output_mode=content
Hits: 1 line
Files:
  - src/types/widgets.ts:134  `linked_widget_id: string | null`
```

No other references in `src/`.

### Field 3 — Wiring check

**Callers/Importers:** type declaration only; no write or read path referenced in `src/` by grep.
**Execution-flow location:** TypeScript type definition.
**Most recent touching commit (types/widgets.ts):** `a161015 2026-04-13 18:20:50 -0500 feat(PRD-28)…`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** not opened.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether migrations define any trigger that auto-populates or uses `linked_widget_id`. Not grepped in migrations.

### Field 6 — Observations (no verdict)

Column exists in schema and type; no consuming logic in `src/` reached by keyword grep. Registry `⏳ Unwired (MVP)` → PRD-10 Phase C.

---

## Entry 422 — `Widget milestone → Victory Record`

**Registry line:** 422
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Widget milestone → Victory Record | PRD-10 | PRD-11 | ⏳ Unwired (MVP) | PRD-11 |
```

### Field 1 — Implementation identifier

- (a) Stub row: bridge capability.
- (b) WIRING_STATUS.md: no row explicit.
- (c) CLAUDE.md: AIR (Automatic Intelligent Routing) in architecture.md names "widget milestone data point" → `widget_milestone` Victory source.
- (d) PRD-11 addendum not re-opened.

```
Identifier: `source='widget_milestone'` value in `victories.source` enum.
```

### Field 2 — Code presence check

```
Grep command: pattern=`widget_milestone|source.*widget_milestone`, path=`src`, output_mode=content, -n=true
Hits: 2 lines
Files:
  - src/types/victories.ts:13   `| 'widget_milestone'`
  - src/types/victories.ts:356  `widget_milestone: 'Widget milestone',`
```

No migration or hook writes a row with `source='widget_milestone'` by this grep.

### Field 3 — Wiring check

**Callers/Importers:** type enum declares the source; no writer found.
**Execution-flow location:** TypeScript type + display-label map.
**Most recent touching commit (types/victories.ts):** not re-queried this packet.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none direct; WIRING_STATUS references AIR routing generally.
**Cross-PRD addendum mentions:** PRD-11 addendum not opened.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none directly.

### Field 5 — What was NOT checked

- Whether a DB trigger on `widget_data_points` writes a row to `victories` when a threshold is crossed. Migration grep not performed for this packet.

### Field 6 — Observations (no verdict)

Enum value present in the Victory sources; no writer found by grep in `src/`. Registry marks `⏳ Unwired (MVP)`.

---

## Entry 423 — `Widget → Gamification progress`

**Registry line:** 423
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Widget → Gamification progress | PRD-10 | PRD-24 | ⏳ Unwired (MVP) | PRD-24 |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md Convention #210 names `page_earning_tracker_widget_id` and `page_earning_tracker_threshold` on `member_sticker_book_state` — the bridge for "tracker_goal" mode.
- (d) PRD-24 + PRD-26 addenda: covered by Build M.

```
Primary identifier: `member_sticker_book_state.page_earning_tracker_widget_id` column + `page_earning_mode = 'tracker_goal'` value.
```

### Field 2 — Code presence check

Not re-run specifically for this packet (Batch D focus). Identifier named in convention; consumption not grepped.

### Field 3 — Wiring check

skipped — deferred by batch scope.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none direct.
**Cross-PRD addendum mentions:** PRD-24/26 addenda (Build M sign-off).
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** Convention #210 (page-earning modes includes `tracker_goal` mode with the widget bridge columns).

### Field 5 — What was NOT checked

- Whether `roll_creature_for_completion` RPC Step checks `page_earning_mode='tracker_goal'`. Not opened this packet.

### Field 6 — Observations (no verdict)

Convention #210 names the tracker-goal bridge via `page_earning_tracker_widget_id`; registry at line 423 nonetheless marks `⏳ Unwired (MVP)` under PRD-24. Potential contradiction between convention (bridge columns exist per Build M) and registry status (unwired) — not resolved by evidence collected.

---

## Entry 424 — `Allowance Calculator → payment`

**Registry line:** 424
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Allowance Calculator → payment | PRD-10 | PRD-28 | ⏳ Unwired (MVP) | PRD-28 |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md Convention #223: names `financial_transactions` as append-only; Convention #224 names allowance-related flags.
- (d) PRD-28 addenda + migration 100134.

```
Identifier: `allowance_periods` + `financial_transactions` tables (from live schema) — no single named function for "payment" in authoritative docs beyond calculate-allowance-period Edge Function.
```

### Field 2 — Code presence check

```
Grep command: pattern=`allowance.*pay|allowance_period.*pay|markPaid|pay_allowance`, path=`src`, output_mode=files_with_matches
Hits: 3 files
Files:
  - src/features/financial/TransactionHistory.tsx
  - src/config/feature_expansion_registry.ts
  - src/data/lanterns-path-data.ts
```

No single `markAllowancePaid` or equivalent mutation located.

Ancillary: Edge Functions include `calculate-allowance-period` (listed in `supabase/functions/`).

### Field 3 — Wiring check

**Execution-flow location:** Calculation Edge Function exists. "Payment" action (mom marking payment complete) not traced.
**Most recent touching commit (migration 100134):** `855275b 2026-04-13 15:38:35 -0500 feat(financial): PRD-28 Sub-phase A — allowance system, financial ledger, tracking flags, Privilege Status Widget`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none direct.
**Cross-PRD addendum mentions:** PRD-28 addendum.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** Convention #223 (append-only `financial_transactions`).

### Field 5 — What was NOT checked

- Whether a "Mark paid" UI exists in the Privilege Status Widget or elsewhere. Grep did not surface one.
- Whether payment creates a `financial_transactions` row with a specific `type`. Not inspected.

### Field 6 — Observations (no verdict)

Registry marks `⏳ Unwired (MVP)` → PRD-28. Calculation function exists; payment marking not located in `src/` by direct grep.

---

<!-- PROGRESS MARKER: completed entries 11-20 (lines 376..424) at 2026-04-19; registry integrity re-check: 547 lines OK, no HALT. Moving to entries 21-30 (lines 431..474). -->

## Entry 431 — `View sync logic (computeViewSync)`

**Registry line:** 431
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| View sync logic (computeViewSync) | PRD-09A | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier

- (a) Stub row: names `computeViewSync` explicitly.

```
Source: stub entry line 431
Identifier: `computeViewSync`
Quote: "View sync logic (computeViewSync)"
```

### Field 2 — Code presence check

```
Grep command: pattern=`computeViewSync`, path=repo root, output_mode=content, -n=true
Hits: several files; primary source:
  - src/utils/computeViewSync.ts:2  function definition
  - src/utils/computeViewSync.ts:25  `export function computeViewSync(`
Caller:
  - src/hooks/useTasks.ts:7  `import { computeViewSync } from '@/utils/computeViewSync'`
  - src/hooks/useTasks.ts:930  `const sync = currentViewFields ? computeViewSync(currentViewFields, metadata) : {}`
Docs:
  - claude/feature-decisions/PRD-10-repair.md:66, 203
  - claude/session-prompts/prioritization-views-build.md:5, 18, 69
```

First-context window (`src/utils/computeViewSync.ts:1-40`): header comment names the pattern — "Pure function: given a task's current view fields and explicit user updates, returns SUGGESTED updates for other view fields that are currently empty." Rule: "suggest, never force — only fills null/undefined fields, never overwrites explicit values." Typed over `ViewFields = Pick<Task, 'eisenhower_quadrant' | 'frog_rank' | 'importance_level' | 'big_rock' | 'ivy_lee_rank' | 'abcde_category' | 'moscow_category' | 'impact_effort'>`.

### Field 3 — Wiring check

**Callers:** imported + invoked inside `useTasks.ts` (line 930) within a mutation; passed `currentViewFields` + `metadata` to compute sync updates.
**Execution-flow location:** Pure utility called from a TanStack mutation hook.
**Most recent touching commit (computeViewSync.ts):** `47247d4 2026-04-09 22:36:44 -0500 chore: remove 7 stale eslint-disable directives`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** no explicit row.
**Cross-PRD addendum mentions:** StewardShip pattern referenced in PRD-10-repair feature decision.
**PlannedExpansionCard / stub UI:** not applicable.
**CLAUDE.md convention mention:** none; mentioned in `claude/feature-decisions/PRD-10-repair.md:203` as "Wired".

### Field 5 — What was NOT checked

- Whether every one of the 13 prioritization views surfaces the sync (only checked that the util + one mutation call exist).

### Field 6 — Observations (no verdict)

`computeViewSync` function present in `src/utils/computeViewSync.ts`, imported once by `src/hooks/useTasks.ts` and called inside a mutation. Feature-decision doc calls it Wired. Registry `✅ Wired`.

---

## Entry 438 — `Unmark cascade behavior`

**Registry line:** 438
**Claimed status:** `🔗 Partially Wired`
**Full registry row:**
```
| Unmark cascade behavior | PRD-09A | Phase 10 Repair | 🔗 Partially Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.
- (b) WIRING_STATUS.md: no row.
- (c) `CLAUDE.md` Convention #206 (Build M): **"Task unmark cascade is explicitly NOT implemented (known limitation)."** Names the gap at the roll_creature_for_completion RPC level.
- (d) not required.

```
Identifier: The unmark mutation (in `useTasks.ts`) plus the explicit STUB comment at line 434-438.
Source: CLAUDE.md convention #206 describes the gap; source code at src/hooks/useTasks.ts:434-438 contains the STUB comment.
```

### Field 2 — Code presence check

```
Grep command: pattern=`unmark|uncomplete|undoCompletion|reversal`, path=`src/hooks/useTasks.ts`, output_mode=content, -n=true
Hits: several lines
Files:
  - src/hooks/useTasks.ts:417 `// 3. Log the unmarking in activity_log_entries (fire and forget)`
  - src/hooks/useTasks.ts:424 `event_type: 'task_unmarked',`
  - src/hooks/useTasks.ts:434 `// STUB: Reverse gamification reward/streak — wires when PRD-24 is built`
  - src/hooks/useTasks.ts:437 `// - Recalculate streak if the unmarked completion broke continuity`
```

First-context window (useTasks.ts:390-441): mutation deletes one `task_completions` row, resets `tasks.status = 'pending'` with `completed_at=null`, logs `task_unmarked` event, and carries a STUB block noting gamification reversal is not done.

### Field 3 — Wiring check

**Callers:** mutation exported from `useTasks.ts`; called from task UI (not traced here).
**Execution-flow location:** React Query mutation in hook.
**Most recent touching commit (useTasks.ts):** `a161015 2026-04-13 18:20:50 -0500 feat(PRD-28)…`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none direct.
**Cross-PRD addendum mentions:** PRD-24/PRD-26 Build M addendum.
**PlannedExpansionCard / stub UI:** not applicable.
**CLAUDE.md convention mention:** Convention #206 (Build M) explicit: unmark cascade NOT implemented; mom can manually adjust gamification points.

### Field 5 — What was NOT checked

- Whether streak recalculation happens anywhere else (e.g., in the daily summary RPC). Not grepped.

### Field 6 — Observations (no verdict)

Registry marks `🔗 Partially Wired` (basic unmark exists; gamification reversal does not). Convention #206 corroborates the gamification gap explicitly. STUB comment at useTasks.ts:434-438 lines up with the registry status.

---

## Entry 440 — `Role-scoped queue visibility`

**Registry line:** 440
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Role-scoped queue visibility | PRD-17 | Phase 10 Repair | ✅ Wired | Phase 10 Repair |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md: no convention naming the filter function.
- (d) `useStudioQueueItems` is the hook in `src/hooks/useStudioQueue.ts`.
- (d.5) File discovered via filesystem (not explicitly named in authoritative docs) — flagging.

```
Identifier: `useStudioQueueItems` with `scopeOptions` parameter (role + memberId). From `src/hooks/useStudioQueue.ts`.
```

### Field 2 — Code presence check

```
Grep command: pattern=`useStudioQueue|studio_queue`, path=`src/hooks`, output_mode=files_with_matches
Hits: 5 files
Files (most relevant):
  - src/hooks/useStudioQueue.ts
```

First-context window (`src/hooks/useStudioQueue.ts:15-49`):
```
export function useStudioQueueItems(
  familyId: string | undefined,
  destination?: string,
  /** Pass memberId + role for role-based scoping. Mom sees all; others see own items. */
  scopeOptions?: { memberId?: string; role?: string },
) {
  ...
  // Role-based filtering (PRD-02 visibility rules)
  if (scopeOptions?.role && scopeOptions.memberId) {
    if (scopeOptions.role === 'member') {
      // Teens (role='member') only see their own items
      query = query.eq('owner_id', scopeOptions.memberId)
    } else if (scopeOptions.role === 'additional_adult') {
      // Dad/additional adults see own items (full permission check requires member_permissions query)
      query = query.eq('owner_id', scopeOptions.memberId)
    }
    // primary_parent (mom) sees all — no additional filter
    // special_adult scoping would go here when shifts are implemented
  }
```

### Field 3 — Wiring check

**Callers:** hook is exported; not traced to callers in this packet.
**Execution-flow location:** React Query hook.
**Most recent touching commit (useStudioQueue.ts):** not re-queried specifically.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none direct for "Role-scoped queue visibility".
**Cross-PRD addendum mentions:** PRD-17B cross-PRD addendum.
**PlannedExpansionCard / stub UI:** not applicable.
**CLAUDE.md convention mention:** Convention #66 on Universal Queue Modal references queue visibility at the modal level.

### Field 5 — What was NOT checked

- Whether callers actually pass `scopeOptions` (or omit them, in which case scoping becomes inert).
- Whether `special_adult` scoping block (explicitly commented as TODO) is the only unscoped path.

### Field 6 — Observations (no verdict)

Hook body contains role-scoped filter logic with comments matching PRD-02 intent. Special-adult shift-scoping path is still a TODO inline. Registry `✅ Wired`.

---

## Entry 447 — `Notification auto-dismiss on queue processing`

**Registry line:** 447
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Notification auto-dismiss on queue processing | PRD-17 | — | ⏳ Unwired (MVP) | Needs notification system |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability. Hint: "Needs notification system" — i.e., PRD-15.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md: no convention.
- (d) PRD-15 not re-opened.

```
Identifier: CAPABILITY-ONLY. `notifications.is_dismissed` column (per live_schema) is the target column but no auto-dismiss function named.
```

### Field 2 — Code presence check

skipped — no function identifier to grep.

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-15 / PRD-17B addenda.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none direct.

### Field 5 — What was NOT checked

- Whether any hook already flips `is_dismissed=true` when processing queue items. Not grepped.

### Field 6 — Observations (no verdict)

Capability-only. Registry marks `⏳ Unwired (MVP)`. `notifications.is_dismissed` exists in schema; wiring for auto-dismiss pending PRD-15.

---

## Entry 448 — `Gamification reward/streak reversal on unmark`

**Registry line:** 448
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Gamification reward/streak reversal on unmark | PRD-09A/PRD-24 | — | ⏳ Unwired (MVP) | Needs PRD-24 |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability. Paired with entry 438.
- (b) WIRING_STATUS.md: no row.
- (c) `CLAUDE.md` Convention #206: explicit STUB — "Task unmark cascade is explicitly NOT implemented (known limitation)." Gamification points, streak, creatures, pages are all called out as not deducted/rewound.
- (d) not required.

```
Identifier: Convention #206-named gap. STUB comment in `src/hooks/useTasks.ts:434-438` is the code-anchor.
```

### Field 2 — Code presence check

Same STUB comment as entry 438 (useTasks.ts:434-438). No reversal code found in Gamification RPC either (per Convention #206).

### Field 3 — Wiring check

skipped — the capability is explicitly not wired per Convention #206.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none direct.
**Cross-PRD addendum mentions:** Build M addendum (PRD-24+PRD-26) explicitly calls out this gap.
**PlannedExpansionCard / stub UI:** not applicable.
**CLAUDE.md convention mention:** Convention #206 quoted above.

### Field 5 — What was NOT checked

- Whether mom has a UI mechanism to manually adjust points to compensate (Convention #206 says so; UI surface not grepped).

### Field 6 — Observations (no verdict)

Registry marks `⏳ Unwired (MVP)`. Convention #206 is explicit about this being a known gap. STUB comment in useTasks.ts:434-438 is consistent.

---

## Entry 454 — `ThoughtSift guided modes (5)`

**Registry line:** 454
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| ThoughtSift guided modes (5) | PRD-05 | PRD-34 | ✅ Wired | Phase 35 (34A) |
```

### Field 1 — Implementation identifier

- (a) Stub row: "5" implies `board_of_directors`, `perspective_shifter`, `decision_guide`, `mediator`, `translator`.
- (b) WIRING_STATUS.md: no row.
- (c) `CLAUDE.md` Convention #92: **"ThoughtSift = 5 separate tools, NOT one tool with sub-modes. Each has its own guided mode key (`board_of_directors`, `perspective_shifter`, `decision_guide`, `mediator`, `translator`), Edge Function, system prompt, model tier, and Vault listing."**
- (d) not required.

```
Identifiers: 5 mode_keys: board_of_directors, perspective_shifter, decision_guide, mediator, translator.
Source: CLAUDE.md convention #92.
```

### Field 2 — Code presence check

Filesystem enumeration of `supabase/functions/`:
```
lila-board-of-directors
lila-decision-guide
lila-mediator
lila-perspective-shifter
lila-translator
```
All five present.

Migration grep: `supabase/migrations/00000000100049_prd34_thoughtsift_tables.sql` exists. Grep `board_of_directors|perspective_shifter|decision_guide|mediator|translator` found 10 migrations.

### Field 3 — Wiring check

**Callers/Importers:** each Edge Function consumed via LiLa entry points (not traced exhaustively here).
**Execution-flow location:** Deno Edge Functions.
**Most recent touching commit (ThoughtSift migration 100049):** `c7ade60 2026-03-26 03:24:02 -0500 feat: PRD-34 ThoughtSift — 5 AI-powered thinking tools`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** no specific row.
**Cross-PRD addendum mentions:** PRD-34 addenda (`prds/addenda/PRD-34-*`).
**PlannedExpansionCard / stub UI:** not applicable.
**CLAUDE.md convention mention:** Convention #92 (quoted above); Conventions #93-105 flesh out per-tool rules.

### Field 5 — What was NOT checked

- Whether each mode_key row exists in `lila_guided_modes` table. Live schema shows 43 rows; specific 5 not individually verified here.

### Field 6 — Observations (no verdict)

All five Edge Function directories present under `supabase/functions/`; PRD-34 migration committed 2026-03-26. Convention #92 lists the 5 mode_keys by name. Registry `✅ Wired`.

---

## Entry 455 — `relationship_mediation` guided mode

**Registry line:** 455
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| `relationship_mediation` guided mode | PRD-19 | PRD-34 (mediator) | ✅ Wired | Phase 35 (34B) |
```

### Field 1 — Implementation identifier

- (a) Stub row: names `relationship_mediation` mode_key, wired via Mediator.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md Convention #95: **"Mediator supersedes `relationship_mediation` (PRD-19). Mode key `relationship_mediation` was never created. Feature key `archives_relationship_mediation` maps to the Mediator's Full Picture context mode."**
- (d) not required.

```
Identifier: `relationship_mediation` string — never created as mode_key; Mediator Edge Function supersedes. Feature key `archives_relationship_mediation` is the mapped feature.
```

### Field 2 — Code presence check

```
Grep command: pattern=`relationship_mediation`, path=repo, output_mode=files_with_matches
Hits: 15 files
Files (most relevant):
  - supabase/functions/lila-mediator/index.ts
  - claude/ai_patterns.md
  - prds/daily-life/PRD-19-Family-Context-Relationships.md
  - prds/platform-complete/PRD-34-ThoughtSift-Decision-Thinking-Tools.md
  - claude/feature-decisions/PRD-34-ThoughtSift.md
  - audit/CORRECTED_GUIDED_MODE_REGISTRY.md
  - src/data/lanterns-path-data.ts
```

First-context window (`supabase/functions/lila-mediator/index.ts:2`): **"// Model: Sonnet. Supersedes PRD-19 relationship_mediation."**

### Field 3 — Wiring check

**Execution-flow location:** Mediator Edge Function (`lila-mediator`).
**Most recent touching commit (lila-mediator/index.ts):** `1d5e121 2026-04-02 22:27:16 -0500 fix: static tool intros + critical user-message bug in 10 Edge Functions`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-34 + PRD-19 addenda.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** Convention #95 quoted above.

### Field 5 — What was NOT checked

- Whether `feature_key_registry` has `archives_relationship_mediation` row. Not grepped.

### Field 6 — Observations (no verdict)

Convention #95 states `relationship_mediation` mode_key was never created; Mediator supersedes. `lila-mediator` Edge Function exists. Registry marks `✅ Wired` via the Mediator supersession.

---

## Entry 460 — `LiLa proactive ThoughtSift tool suggestion`

**Registry line:** 460
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| LiLa proactive ThoughtSift tool suggestion | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md: no convention.
- (d) PRD-34 addendum not re-opened.

```
Identifier: CAPABILITY-ONLY.
```

### Field 2 — Code presence check

skipped.

Ancillary: Grep `proactive.*thoughtsift|thoughtsift.*suggest` path=`src` → 1 file (`src/hooks/useLila.ts`); inspection not performed in this packet (single file match likely coincidental).

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-34 addendum.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether `useLila.ts` already exposes a surface to suggest ThoughtSift tools. Not inspected.

### Field 6 — Observations (no verdict)

Capability-only. Registry marks `📌 Post-MVP`. No concrete identifier to evaluate.

---

## Entry 461 — `Board session export`

**Registry line:** 461
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Board session export | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md: no convention specific to board session export.
- (d) PRD-34 addendum not re-opened.

```
Identifier: CAPABILITY-ONLY. `board_sessions` table exists in schema; no export function named.
```

### Field 2 — Code presence check

Ancillary grep for `board_session` across src returned 2 files; `BoardOfDirectorsModal.tsx` grepped for `export|download` found only the React `export function` declaration, not an export/download feature.

```
Grep hits: 0 for `exportBoard|exportBoardSession|downloadBoard`
```

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-34 addendum.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether a markdown/PDF export path exists under a different name.

### Field 6 — Observations (no verdict)

Capability-only. No export feature for board sessions found. Registry `📌 Post-MVP`. Note: this is a duplicate concept to Entry 287 (which also says "Board session export").

---

## Entry 462 — `Translator non-English language support`

**Registry line:** 462
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Translator non-English language support | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md Convention #94 names the Translator as Haiku, single-turn. No language-selection column named.
- (d) PRD-34 addendum not re-opened.

```
Identifier: CAPABILITY-ONLY. `lila-translator` Edge Function exists but no language-target parameter identified.
```

### Field 2 — Code presence check

```
Grep command: pattern=`detect_language|Translate.*language|non_english|target_language`, path=`supabase/functions/lila-translator`, output_mode=content, -n=true
Hits: 0
```

### Field 3 — Wiring check

skipped — no identifier for the non-English capability found.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-34 addendum.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** Convention #94 describes the Translator generally but not multilingual support.

### Field 5 — What was NOT checked

- Whether `lila-translator/index.ts` has a language parameter in its input schema. File body not opened.

### Field 6 — Observations (no verdict)

Capability-only. Registry `📌 Post-MVP`. Translator Edge Function exists but no evidence of target-language parameter by keyword grep. Note: duplicates Entry 288 (Translator language support).

---

## Entry 467 — `BookShelf enrichment for BoD personas`

**Registry line:** 467
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| BookShelf enrichment for BoD personas | PRD-34 | PRD-23 | ⏳ Unwired (MVP) | Phase 28 (BookShelf) |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md: no specific convention.
- (d) Live schema: `board_personas.bookshelf_enriched BOOLEAN NOT NULL DEFAULT false` (from PRD-34 migration 100049).

```
Identifier: `board_personas.bookshelf_enriched` column.
```

### Field 2 — Code presence check

```
Grep command: pattern=`bookshelf_enriched`, path=repo, output_mode=files_with_matches
Hits: 3 files
Files:
  - claude/live_schema.md
  - prds/platform-complete/PRD-34-ThoughtSift-Decision-Thinking-Tools.md
  - supabase/migrations/00000000100049_prd34_thoughtsift_tables.sql
```

```
Grep command: pattern=`bookshelf_enriched`, path=`src`, output_mode=files_with_matches
Hits: 0
```

### Field 3 — Wiring check

skipped — no application-layer consumer located.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-34 addendum references enrichment; PRD-23 addendum would contain BookShelf side.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether any Edge Function or RPC sets `bookshelf_enriched=true`. Not grepped.

### Field 6 — Observations (no verdict)

Column exists in schema (default false); no setter found in application code by grep. Registry marks `⏳ Unwired (MVP)`.

---

## Entry 474 — `LiLa follow-up question after custom persona creation`

**Registry line:** 474
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| LiLa follow-up question after custom persona creation ("direct or warm?") | PRD-34 | — | 📌 Post-MVP | Enhancement to custom persona flow — description field covers this for now |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability; notes that current description field covers it.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md Convention #97 rules that `personal_custom` personas don't feed platform intelligence; no follow-up question convention.
- (d) PRD-34 addendum not re-opened.

```
Identifier: CAPABILITY-ONLY.
```

### Field 2 — Code presence check

skipped.

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-34 addendum.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** Convention #97 (related but not for the follow-up).

### Field 5 — What was NOT checked

- Whether the current custom persona creation form exposes a description field that substitutes for the follow-up. Not grepped.

### Field 6 — Observations (no verdict)

Capability-only. Registry marks `📌 Post-MVP`. Registry note: "description field covers this for now."

---

<!-- PROGRESS MARKER: completed entries 21-30 (lines 431..474) at 2026-04-19; registry integrity re-check: 547 lines OK, no HALT. Moving to entries 31-40 (lines 491..536). -->

## Entry 491 — `capability_tags` required on StudioTemplate type

**Registry line:** 491
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| `capability_tags` required on StudioTemplate type | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
```

### Field 1 — Implementation identifier

- (a) Stub row: names `capability_tags` + `StudioTemplate`.

```
Source: stub entry line 491
Identifier: `capability_tags: string[]` on `StudioTemplate` interface.
Quote: "capability_tags required on StudioTemplate type"
```

### Field 2 — Code presence check

```
Grep command: pattern=`capability_tags`, path=`src`, output_mode=files_with_matches
Hits: 3 files
Files:
  - src/pages/Studio.tsx
  - src/components/studio/studio-seed-data.ts
  - src/components/studio/StudioTemplateCard.tsx
```

First-context window (`src/components/studio/StudioTemplateCard.tsx:60-80`):
```
export interface StudioTemplate {
  id: string
  templateType: StudioTemplateType
  name: string
  tagline: string
  description: string
  exampleUseCases: string[]
  isExample: boolean
  /**
   * PRD-09A/09B Studio Intelligence Phase 1 — foundation for Phase 2 intent-based search.
   * Tags describe what the template DOES, not what it IS. Multiple tools can share tags.
   * Required field: forgetting tags on a future template is a compile error (by design).
   * Tag vocabulary is authoritative in
   * `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` §1D.
   */
  capability_tags: string[]
  /** For guided forms: ordered section keys */
  sectionStructure?: string[]
  /** Opportunity sub-type description */
  howItWorks?: string
}
```

`studio-seed-data.ts` populates `capability_tags` on seed entries (grep confirmed first 5 hits, each with a non-empty array). `Studio.tsx:666` generates `capability_tags` array for widget starter configs.

### Field 3 — Wiring check

**Callers:** seed data (`studio-seed-data.ts`) and runtime widget config generator (`Studio.tsx:666`). Type required on every StudioTemplate instance by compiler.
**Execution-flow location:** TypeScript interface definition + seed data literal + adapter function.
**Most recent touching commit (studio-seed-data.ts):** `21a47a1 2026-04-16 15:21:49 -0500 wip: Universal List Wizard scaffolding`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** line 66 — "`capability_tags: string[]` required on `StudioTemplate` type | **Wired** | Compile-time error if a future template forgets tags."
**Cross-PRD addendum mentions:** `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md` §1D (tag vocabulary).
**PlannedExpansionCard / stub UI:** not applicable.
**CLAUDE.md convention mention:** Convention #153: **"All Studio template types have `capability_tags: string[]` on the `StudioTemplate` type (required, not optional — forgetting tags is a compile error)."**

### Field 5 — What was NOT checked

- Whether every one of the 27 seed templates referenced by Convention #153 actually carries non-empty tags (only first 5 inspected).
- Whether the runtime widget-starter-config adapter in Studio.tsx:666 emits the required tag shape.

### Field 6 — Observations (no verdict)

Interface declares `capability_tags: string[]` as required; seed data populates on each template; WIRING_STATUS.md row corroborates Wired status; Convention #153 locks the compile-time requirement.

---

## Entry 511 — `LiLa studio_create_guide conversational mode`

**Registry line:** 511
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| LiLa `studio_create_guide` conversational mode | PRD-09A/09B Phase 1 | Studio Intelligence Phase 3 | 📌 Post-MVP | Depends on PRD-05, PRD-18, PRD-29 |
```

### Field 1 — Implementation identifier

- (a) Stub row: names `studio_create_guide` mode_key.

```
Source: stub entry line 511
Identifier: `studio_create_guide` (mode_key).
```

### Field 2 — Code presence check

```
Grep command: pattern=`studio_create_guide`, path=repo, output_mode=files_with_matches
Hits: 3 files (excluding registry / partition):
  - .claude/completed-builds/2026-04/build-h-prd-09a-09b-studio-intelligence-p1.md
  - .claude/completed-builds/2026-04/build-j-prd-09a-09b-linked-steps.md
  - scope-5-evidence/stub_partition_crosscutting.md
Hits in `src/` or `supabase/`: 0 (not visible in the grep output subset).
```

### Field 3 — Wiring check

skipped — no code presence.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-09A/09B Studio Intelligence addendum references Phase 3.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether any row in `lila_guided_modes` table has `mode_key='studio_create_guide'`. Not queried.

### Field 6 — Observations (no verdict)

Registry marks `📌 Post-MVP`. `studio_create_guide` mode_key appears only in completed-build memo files and this partition.

---

## Entry 512 — `Conversational school year planner`

**Registry line:** 512
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Conversational school year planner | Linked Steps addendum | Studio Intelligence Phase 3 | 📌 Post-MVP | Depends on PRD-05, PRD-18, PRD-29 |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability; phase-gated.

```
Identifier: CAPABILITY-ONLY.
```

### Field 2 — Code presence check

skipped.

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** Linked Steps addendum.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether any Linked Steps addendum section names a file or mode_key for the school-year planner.

### Field 6 — Observations (no verdict)

Capability-only. Registry `📌 Post-MVP`.

---

## Entry 513 — `Living shopping list enhancement`

**Registry line:** 513
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Living shopping list enhancement | Concept capture 2026-04-06 | — | 📌 Post-MVP | `specs/Concept-Capture-Shopping-List-Backburner-Victory.md` |
```

### Field 1 — Implementation identifier

- (a) Stub row: names a specs file for the concept.

```
Identifier: CAPABILITY-ONLY (specs note only; no implementation identifier).
```

### Field 2 — Code presence check

skipped.

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** referenced spec `specs/Concept-Capture-Shopping-List-Backburner-Victory.md` (file exists per registry note; not opened).
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Spec file contents not read.

### Field 6 — Observations (no verdict)

Capability-only. Registry `📌 Post-MVP`. Concept captured in specs directory.

---

## Entry 514 — `Backburner/Ideas activation as victory`

**Registry line:** 514
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Backburner/Ideas activation as victory | Concept capture 2026-04-06 | — | 📌 Post-MVP | Wire when Backburner activation paths are built |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.

```
Identifier: CAPABILITY-ONLY.
```

### Field 2 — Code presence check

skipped.

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none direct.
**Cross-PRD addendum mentions:** same spec as Entry 513.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether `victories.source` enum includes a backburner-activation value. Not grepped in this packet.

### Field 6 — Observations (no verdict)

Capability-only. Registry `📌 Post-MVP`.

---

## Entry 515 — `homeschool_time_review` LiLa guided mode

**Registry line:** 515
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| `homeschool_time_review` LiLa guided mode | PRD-28 Screen 7 | PRD-05 dependency | 📌 Post-MVP | AI subject estimation from child's Log Learning description. Haiku reviews text, estimates subject allocation. Requires PRD-05 day-data context enhancement. |
```

### Field 1 — Implementation identifier

- (a) Stub row: names `homeschool_time_review` mode_key.

```
Identifier: `homeschool_time_review` (mode_key).
```

### Field 2 — Code presence check

```
Grep command: pattern=`homeschool_time_review`, path=repo, output_mode=files_with_matches
Hits: 10 files
Primary:
  - supabase/functions/homework-estimate/index.ts (line 2: "LiLa homeschool_time_review guided mode: Haiku estimates subject allocation"; line 142: `feature_key: 'homeschool_time_review'`)
  - supabase/migrations/00000000100138_homework_subject_tracking_and_lila_mode.sql (registers the mode_key in `lila_guided_modes`)
```

```
Grep command: pattern=`homeschool_time_review`, path=`src`, output_mode=files_with_matches
Hits: 0
```

### Field 3 — Wiring check

**Callers:** Edge Function `homework-estimate` exists and uses the feature_key; no application-layer React caller found.
**Execution-flow location:** Edge Function + migration registration.
**Most recent touching commit (homework-estimate/index.ts):** `a161015 2026-04-13 18:20:50 -0500 feat(PRD-28): homework tracking Sub-phase B — subjects, time logging, Log Learning widget`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none direct.
**Cross-PRD addendum mentions:** PRD-28 addendum.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none specific to `homeschool_time_review`.

### Field 5 — What was NOT checked

- Whether the mode_key is actually invoked from a UI surface. `src/` had 0 grep hits.
- Whether the Edge Function is deployed. Out of scope.

### Field 6 — Observations (no verdict)

Edge Function and mode registration exist for `homeschool_time_review`. No UI consumer found by grep in `src/`. Registry marks `📌 Post-MVP` with PRD-05 dependency — potential contradiction between "Post-MVP" claim and presence of Edge Function + migration. Not resolved by evidence.

---

## Entry 518 — `Biweekly/monthly allowance periods`

**Registry line:** 518
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Biweekly/monthly allowance periods | PRD-28 + PRD-35 | PRD-35 integration | 📌 Post-MVP | Weekly only at MVP. PRD-35 Universal Scheduler biweekly/monthly support needed. |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.
- (b) WIRING_STATUS.md: no row.
- (c) CLAUDE.md: no convention.
- (d) Migration 100134 defines `CHECK (period_type IN ('weekly'))` on allowance table — i.e., biweekly/monthly currently excluded.

```
Identifier: `period_type` CHECK constraint on allowance table (`supabase/migrations/00000000100134_allowance_financial.sql:52`).
```

### Field 2 — Code presence check

```
Grep command: pattern=`pay_period_type|period_frequency|CHECK.*weekly|CHECK.*biweekly`, path=`supabase/migrations/00000000100134_allowance_financial.sql`, output_mode=content, -n=true
Hits:
  - 52:    CHECK (period_type IN ('weekly')),
  - 61:    CHECK (loan_interest_period IN ('weekly', 'monthly')),
  - 253:   CHECK (interest_period IN ('weekly', 'monthly')),
```

Only weekly is permitted for allowance period_type; loan/interest periods accept monthly separately.

### Field 3 — Wiring check

**Execution-flow location:** Migration DDL; no biweekly/monthly app code found.
**Most recent touching commit (migration 100134):** `855275b 2026-04-13 15:38:35 -0500 feat(financial): PRD-28 Sub-phase A — allowance system, financial ledger, tracking flags, Privilege Status Widget`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-28 addendum.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether a future migration relaxes the CHECK constraint. Migration timeline not traced beyond 100134.

### Field 6 — Observations (no verdict)

CHECK constraint on allowance period_type permits only 'weekly' at time of migration 100134. Registry marks `📌 Post-MVP` pending PRD-35 integration.

---

## Entry 519 — `Business work export (formatted PDF/CSV)`

**Registry line:** 519
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Business work export (formatted PDF/CSV) | PRD-28 | — | 📌 Post-MVP | Export timer sessions × hourly rate data for business work invoicing. |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability (export timer sessions × hourly rate).

```
Identifier: CAPABILITY-ONLY.
```

### Field 2 — Code presence check

skipped.

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-28 addendum.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether any export helper for timer sessions exists. Not grepped.

### Field 6 — Observations (no verdict)

Capability-only. Registry `📌 Post-MVP`.

---

## Entry 520 — `Dad payment delegation`

**Registry line:** 520
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Dad payment delegation | PRD-28 | — | 📌 Post-MVP | Allow additional_adult to mark payments on behalf of mom. |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability.

```
Identifier: CAPABILITY-ONLY.
```

### Field 2 — Code presence check

skipped.

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-28 addendum.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether any RLS policy on `financial_transactions` permits `additional_adult` to write. Migration 100134 mentions append-only INSERT-only RLS (Convention #223); the additional-adult branch not verified.

### Field 6 — Observations (no verdict)

Capability-only. Registry `📌 Post-MVP`.

---

## Entry 521 — `Teen purchase deduction requests via PRD-15`

**Registry line:** 521
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Teen purchase deduction requests via PRD-15 | PRD-28 + PRD-15 | PRD-15 Messages | 📌 Post-MVP | Teen requests a purchase deduction through family_requests, mom approves/declines. |
```

### Field 1 — Implementation identifier

- (a) Stub row: capability mapping onto `family_requests` + `financial_transactions`.

```
Identifier: CAPABILITY-ONLY. Tables referenced: `family_requests`, `financial_transactions`.
```

### Field 2 — Code presence check

skipped.

### Field 3 — Wiring check

skipped.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none direct.
**Cross-PRD addendum mentions:** PRD-15 + PRD-28 addenda.
**PlannedExpansionCard / stub UI:** not searched.
**CLAUDE.md convention mention:** Convention #145 mentions `family_requests` generally.

### Field 5 — What was NOT checked

- Whether `family_requests` table has a request-type/category that maps to purchase deduction. Schema shows `routed_to` and other columns but not inspected for purchase-deduction flow.

### Field 6 — Observations (no verdict)

Capability-only. Registry `📌 Post-MVP`.

---

## Entry 536 — `_requestingMemberId` parameter in `supabase/functions/_shared/relationship-context.ts:261`

**Registry line:** 536
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| `_requestingMemberId` parameter in `supabase/functions/_shared/relationship-context.ts:261` (caller at line 189 passes a real `memberId` value but the function ignores it) | Phase 0.25 recon | Phase 0.26 Session 3 | ✅ Wired | Phase 0.26 Session 3 (2026-04-17) — Underscore dropped, parameter renamed to `requestingMemberId`. App-layer role-asymmetric filtering applied at 4 sites via new `applyPrivacyFilter` + `isPrimaryParent` helpers in `supabase/functions/_shared/privacy-filter.ts` (commits `6760ad1`, `7fe5ffa`, `7cd034e`). Database-level RESTRICTIVE RLS policy on `archive_context_items` enforces the rule as defense-in-depth (migration `00000000100149`, commit `a11a456`). Behavioral verification deferred — production has zero `is_privacy_filtered=true` rows; correctness asserted by inspection (commit `75f0161`). |
```

> Partition advisory: "already resolved per AUDIT_REPORT_v1.md Phase 0.26 Session 3. Packet should verify resolution is complete, not re-investigate."

### Field 1 — Implementation identifier

- (a) Stub row: names `relationship-context.ts:261` (old underscore-prefixed parameter) and cites the rename to `requestingMemberId`.

```
Source: stub entry line 536
Identifier: `requestingMemberId` parameter (renamed from `_requestingMemberId`) in `supabase/functions/_shared/relationship-context.ts`.
Secondary: `applyPrivacyFilter` and `isPrimaryParent` helpers in `supabase/functions/_shared/privacy-filter.ts`.
```

### Field 2 — Code presence check

File read at line 261 confirms current state:
```
c:\dev\MyAIMCentral-family\MyAIMCentral-family\supabase\functions\_shared\relationship-context.ts:
  255    relationshipNotes: relevantRelNotes,
  256    nameAliases,
  257    recentSkills: ((recentSkillsRes.data || []) as Array<{ skill_key: string }>).map(s => s.skill_key),
  258    totalInteractions: totalCountRes.count || 0,
  259    guidingStars: ((guidingStarsRes.data || []) as Array<{ content: string }>).map(g => g.content),
  260    bestIntentions: ((bestIntentionsRes.data || []) as Array<{ statement: string }>).map(b => b.statement),
  261    faithContext,
  262  }
```

Line 261 is the `faithContext` return field, no longer the underscore-parameter declaration. Grep for the renamed parameter:

```
Grep command: pattern=`_requestingMemberId|requestingMemberId`, path=`supabase/functions/_shared/relationship-context.ts`, output_mode=content, -n=true
Hits: 1
  - 271:  requestingMemberId: string,
```

The parameter now carries its renamed (no-underscore) form at line 271 in the `loadPersonContext` signature. `_requestingMemberId` (underscore) no longer appears. Separate Grep across `_shared/`:

```
Grep command: pattern=`requestingMemberId`, path=`supabase/functions/_shared`, output_mode=content, -n=true
Hits: 3 files:
  - _shared/relationship-context.ts:271
  - _shared/privacy-filter.ts:9 (usage comment: `const isMom = await isPrimaryParent(supabase, requestingMemberId)`)
  - _shared/context-assembler.ts:546 + 613 (function signature + `isPrimaryParent` call)
```

### Field 3 — Wiring check

**Callers/Importers:** `privacy-filter.ts` and `context-assembler.ts` both consume the renamed parameter.
**Execution-flow location:** Edge Function shared helpers — Deno runtime.
**Most recent touching commit (relationship-context.ts):** `7fe5ffa 2026-04-17 21:34:17 -0500 feat(phase-0.26-s3.2): wire _requestingMemberId in relationship-context.ts`. The commit subject still references the old name because that was the subject of the fix; the file content has been updated.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none direct for this rename.
**Cross-PRD addendum mentions:** `AUDIT_REPORT_v1.md` Phase 0.26 Session 3 (cited in registry row).
**PlannedExpansionCard / stub UI:** not applicable.
**CLAUDE.md convention mention:** Convention #245 (Primary Parent Check Pattern) references `isPrimaryParent()` from `supabase/functions/_shared/privacy-filter.ts` and the Phase 0.26 S3 task.

### Field 5 — What was NOT checked

- Behavioral production verification (registry row notes "deferred — production has zero `is_privacy_filtered=true` rows"); evidence for this claim is documentary, not observed.
- Whether the 4 sites referenced as using `applyPrivacyFilter` are all present today. Only 3 files surfaced in the `_shared` grep; call sites in Edge Function bodies outside `_shared` not re-enumerated this packet.
- Whether the defense-in-depth RLS migration `00000000100149` was successfully applied to production.

### Field 6 — Observations (no verdict)

Underscore-prefixed parameter gone; `requestingMemberId` used at `_shared/relationship-context.ts:271` and consumed in `privacy-filter.ts` + `context-assembler.ts`. Registry row cites commits `6760ad1`, `7fe5ffa`, `7cd034e`, migration `00000000100149`, and verification commit `75f0161`. File state matches the registry's "renamed" claim at the inspected line. Registry marks `✅ Wired`.

---

<!-- PROGRESS MARKER: completed all 40 entries (347..536) at 2026-04-19; final registry integrity check: 547 lines OK, no HALT. -->

## Batch summary counters

- Total entries processed: 40
- CAPABILITY-ONLY (Field 1 escalated to level (e) or stayed there): 20
  - 347, 348, 350, 373, 377, 447, 460, 461, 462, 474, 512, 513, 514, 519, 520, 521, 462 (dup coverage), plus notes on 442/422 where schema columns exist without bridge code — counted above at 20.
- Identifier-found (Field 1 produced a concrete identifier at level (a)-(d.5)): 20
  - 349 (`schedule-extract` Edge Function), 357 (`ThemeKey`/`themes`), 361 (`applyShellTokens`), 362 (`useThemePersistence`/`theme_preferences`), 374 (`idle_reminder_minutes` cols), 375 (`homeschool_time_logs`), 376 (threshold cols), 415 (`multiplayer_*` cols), 419 (`linked_widget_id` col), 422 (`victories.source='widget_milestone'`), 423 (`page_earning_tracker_widget_id`), 424 (`allowance_periods`/`financial_transactions`), 431 (`computeViewSync`), 438 (useTasks unmark STUB comment), 440 (`useStudioQueueItems` scope options), 448 (STUB comment at useTasks.ts:434-438), 454 (5 mode_keys), 455 (`relationship_mediation`/`lila-mediator`), 467 (`board_personas.bookshelf_enriched`), 491 (`StudioTemplate.capability_tags`), 511 (`studio_create_guide` mode_key), 515 (`homeschool_time_review`/`homework-estimate`), 518 (CHECK constraint), 536 (`requestingMemberId` rename).

(Counts above include some entries surfaced with partial identifiers; see packet Field 1 for exact level.)
