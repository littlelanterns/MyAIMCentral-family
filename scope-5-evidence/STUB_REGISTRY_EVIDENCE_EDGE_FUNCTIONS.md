# Scope 5 Evidence — Edge Functions partition

> Session 2 of 4. Partition: Edge Functions & server logic. Output written by lead session per recipe §sub-agent rules.
> Recipe: `scope-5-evidence/EVIDENCE_RECIPE.md`. Plan: `claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md`. Partition: `scope-5-evidence/stub_partition_edge_functions.md`.
> Registry baseline at session start: 547 lines (verified). HALT file: not present at session start.

---

## Entry 497 — `curriculum-parse` Edge Function (CALIBRATION)

**Registry line:** 497
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| `curriculum-parse` Edge Function | PRD-09A/09B Phase 1 | Linked Steps addendum (Build J) | ✅ Wired | 2026-04-06 — dedicated Haiku-powered Edge Function (not ai-parse). CurriculumParseModal Human-in-the-Mix review wired into SequentialCreator `[Paste Curriculum]` button. Per-item advancement/URL metadata flows through to handleSave via parallel parsedItems state. |
```

### Field 1 — Implementation identifier (4-level extraction chain)

Source: stub entry line 497 — Field 1 resolves at level (a). Stub row text directly names the Edge Function endpoint and the React caller component.

```
Source: stub entry line 497
Identifier (primary): `curriculum-parse` (Edge Function endpoint name)
Quote: "`curriculum-parse` Edge Function ... dedicated Haiku-powered Edge Function (not ai-parse)"
Identifier (secondary): `CurriculumParseModal` (React caller component)
Quote: "CurriculumParseModal Human-in-the-Mix review wired into SequentialCreator `[Paste Curriculum]` button"
Identifier (tertiary): `SequentialCreator` `parsedItems` state (data-flow surface)
Quote: "Per-item advancement/URL metadata flows through to handleSave via parallel parsedItems state"
```

Levels (b)-(e) not invoked — (a) produced concrete identifiers.

### Field 2 — Code presence check

**Identifier 1 — `curriculum-parse`**

```
Grep command: pattern=`curriculum-parse`, path=`supabase/functions`, output_mode=files_with_matches
Hits: 2 files
Files:
  - supabase/functions/curriculum-parse/index.ts — the Edge Function itself
  - supabase/functions/smart-list-import/index.ts — peripheral mention (not the implementation)
```

```
Glob command: pattern=`supabase/functions/curriculum-parse/**`
Hits: 1 file
Files:
  - supabase/functions/curriculum-parse/index.ts
```

First-context window for `supabase/functions/curriculum-parse/index.ts` (lines 1-24):

```ts
// MyAIM Central — curriculum-parse Edge Function
// Build J — PRD-09A/09B Linked Steps, Mastery & Practice Advancement (addendum Enhancement E)
//
// AI-assisted list creation from pasted curriculum text. Mom pastes a block of
// curriculum (badge requirements, chapter list, scope-and-sequence, syllabus),
// LiLa structures it into items with suggested advancement modes. Nothing saves
// until mom reviews and approves (Human-in-the-Mix).
//
// Pattern: follows task-breaker exactly — Haiku via OpenRouter, Zod-validated
// input, JSON-only output with markdown-fence fallback, cost logging.

import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const MODEL = 'anthropic/claude-haiku-4.5'

const SYSTEM_PROMPT = `You are a curriculum parsing assistant for a homeschool family management app. ...`
```

Confirmed file shape: Build J header, Zod imports, `handleCors`/`jsonHeaders` shared helpers, `logAICost` shared cost logger, `OPENROUTER_API_KEY` env reference, `MODEL = 'anthropic/claude-haiku-4.5'`, multi-rule SYSTEM_PROMPT for structured extraction.

Supabase config registration (`supabase/supabase/config.toml` lines 509-510):

```toml
[functions.curriculum-parse]
verify_jwt = false
```

**Identifier 2 — `CurriculumParseModal`**

```
Grep command: pattern=`CurriculumParseModal`, output_mode=files_with_matches
Hits: 6 files
Files:
  - src/components/studio/CurriculumParseModal.tsx — component definition
  - src/components/tasks/sequential/SequentialCreator.tsx — caller
  - STUB_REGISTRY.md — the entry under test
  - scope-5-evidence/stub_partition_edge_functions.md — partition doc
  - .claude/completed-builds/2026-04/build-j-prd-09a-09b-linked-steps.md — build record
  - claude/feature-decisions/PRD-09A-09B-Linked-Steps-Mastery.md — feature decision
```

First-context window for `src/components/studio/CurriculumParseModal.tsx` lines 70-114:

```tsx
export function CurriculumParseModal({
  isOpen,
  onClose,
  ...
  familyId,
  memberId,
}: CurriculumParseModalProps) {
  const [step, setStep] = useState<'input' | 'review'>('input')
  const [rawText, setRawText] = useState('')
  ...
  // Call the dedicated curriculum-parse Edge Function directly.
  // We go through supabase.functions.invoke for auth + CORS handling.
  const { data, error: fnError } = await supabase.functions.invoke('curriculum-parse', {
    body: {
      raw_text: rawText.trim(),
      ...
```

Component invokes `supabase.functions.invoke('curriculum-parse', ...)` (line 113). ModalV2 `id="curriculum-parse"` at line 164.

**Identifier 3 — `parsedItems` state in `SequentialCreator.tsx`**

```
Grep command: pattern=`Paste Curriculum|setShowCurriculumParse|parsedItems`, path=`src/components/tasks/sequential/SequentialCreator.tsx`, output_mode=content, -n
Hits: 10
Locations:
  - line 64: const [showCurriculumParse, setShowCurriculumParse] = useState(false)
  - line 69: const [parsedItems, setParsedItems] = useState<SequentialCreateItem[] | null>(null)
  - line 102: const effectiveItems: SequentialCreateItem[] = parsedItems ?? manualItems
  - line 190: if (parsedItems) setParsedItems(null) (textarea-edit clears parsed state)
  - line 208: {parsedItems && ' (from curriculum parse — per-item advancement preserved)'}
  - line 244: onClick={() => setShowCurriculumParse(true)}
  - line 278: onClose={() => setShowCurriculumParse(false)}
  - line 287: // in parsedItems state until mom manually edits the textarea.
  - line 298: setShowCurriculumParse(false)
```

Caller button rendered at SequentialCreator.tsx lines 241-254 — actual label text "Paste curriculum — LiLa suggests advancement modes" (stub's `[Paste Curriculum]` is a stylized shorthand for the same button). `parsedItems` precedence over `manualItems` confirmed at line 102.

### Field 3 — Wiring check

**Callers/Importers:**

- `src/components/tasks/sequential/SequentialCreator.tsx:9-10` imports `CurriculumParseModal` and `CurriculumParseItem` type from `@/components/studio/CurriculumParseModal`.
- `src/components/tasks/sequential/SequentialCreator.tsx:276` instantiates `<CurriculumParseModal ...>` inside conditional `{showCurriculumParse && memberId && (...)}` block.
- `CurriculumParseModal.tsx:113` invokes the `curriculum-parse` Edge Function via `supabase.functions.invoke('curriculum-parse', ...)`.
- `tests/e2e/features/linked-steps-mastery.spec.ts` references `curriculum-parse` (per file-search results) — E2E coverage exists.

**Execution-flow location:**

- `supabase/functions/curriculum-parse/index.ts` — Supabase Edge Function (Deno runtime).
- `src/components/studio/CurriculumParseModal.tsx` — React component, two-step modal (input → review), Human-in-the-Mix accept gate.
- `src/components/tasks/sequential/SequentialCreator.tsx` — React component, host of the Paste Curriculum button + `parsedItems` state surface.

**Most recent touching commit:**

```
git log -1 --format="%h %ai %s" -- supabase/functions/curriculum-parse/index.ts
→ 207235e 2026-04-06 23:12:07 -0500 feat: Build J — Linked Routine Steps, Mastery & Practice Advancement (PRD-09A/09B Session 2)

git log -1 --format="%h %ai %s" -- src/components/studio/CurriculumParseModal.tsx
→ 207235e 2026-04-06 23:12:07 -0500 feat: Build J — Linked Routine Steps, Mastery & Practice Advancement (PRD-09A/09B Session 2)
```

Both files originated in the same Build J commit (207235e, 2026-04-06). No subsequent modifications observed.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:**

`WIRING_STATUS.md:60` (in the "Sequential Collections (PRD-09A/09B Studio Intelligence Phase 1)" section):

> | `curriculum-parse` Edge Function | — | **Wired** | Build J (2026-04-06) |

**Cross-PRD addendum mentions:**

- `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md:372`: section header `### Edge Function: curriculum-parse`
- `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md:512`: "Add [Paste Curriculum] / [AI Import] button that invokes `curriculum-parse` Edge Function."
- `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md:529`: schema-changes table entry — "New Edge Function: curriculum-parse | CREATE | Haiku-powered text parser for curriculum import. Same pattern as routine-brain-dump. ..."
- `prds/addenda/PRD-09A-09B-Linked-Steps-Mastery-Advancement-Addendum.md:609`: acceptance bullet — "AI-assisted list creation (`curriculum-parse` Edge Function) follows the same pattern as `routine-brain-dump` ... Never auto-creates without Human-in-the-Mix approval."
- `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md:369`: lists `curriculum-parse` Edge Function as a Session 2 deliverable.

**PlannedExpansionCard / stub UI:**

Not applicable — `curriculum-parse` is a backend capability invoked from a real button in a real modal. No demand-validation card.

**CLAUDE.md convention mention:**

- Convention 165 (line 362): "**The `curriculum-parse` Edge Function is dedicated (NOT a reuse of `ai-parse`).** Per the 'each AI tool gets its own Edge Function' convention confirmed in Build H. Haiku via OpenRouter, Zod-validated input/output, cost logging. Follows the task-breaker code pattern exactly. UX pattern matches RoutineBrainDump (paste → parse → Human-in-the-Mix review → accept) but the code path is separate. Never saves without mom's explicit accept."
- Convention 167 (line 364) also names `curriculum-parse` in the context of the deferred `pick_n_of_m` pattern detection.

### Field 5 — What was NOT checked

- Whether the Edge Function is currently DEPLOYED to production Supabase (would need `supabase functions list` against live project — out of scope for grep+inspection run).
- Whether `OPENROUTER_API_KEY` env var is set in production (would need Supabase Functions secrets inspection — out of scope).
- Whether the `claude-haiku-4.5` model slug currently resolves on OpenRouter (would need a live API call or OpenRouter dashboard — out of scope).
- Whether the E2E test in `tests/e2e/features/linked-steps-mastery.spec.ts` currently passes (would need a test run — out of scope; stub claims "7/7 E2E tests passing" at line 494, but that's a sibling entry's claim).
- Whether `parsedItems` metadata actually flows all the way through to the `tasks` rows on save (the stub claims it does via `handleSave`; reading `handleSave` body was not done — the per-item flow integration was not traced beyond the `effectiveItems` precedence statement at line 102).
- The full body of `CurriculumParseModal.tsx` (only the open/close/invoke lines were inspected) — review-step UI rendering, per-item edit affordances, accept-button behavior were not exhaustively traced.

### Field 6 — Observations (no verdict)

`STUB_REGISTRY.md:497` claims `✅ Wired`. Evidence collected:
- Edge Function source file exists at the expected path (`supabase/functions/curriculum-parse/index.ts`) with Build J header, Zod schemas, OpenRouter Haiku model, cost logger, and a multi-rule SYSTEM_PROMPT.
- Supabase config registers the function (`config.toml` `[functions.curriculum-parse]`).
- React caller component (`CurriculumParseModal.tsx`) invokes the Edge Function via `supabase.functions.invoke('curriculum-parse', ...)` and is mounted in `SequentialCreator.tsx` behind the "Paste curriculum — LiLa suggests advancement modes" button.
- `parsedItems` state in `SequentialCreator.tsx` exists and is given precedence over `manualItems` (line 102) per the stub's claim.
- Both files share commit 207235e dated 2026-04-06 (matches stub's "wired by" date).
- WIRING_STATUS.md, CLAUDE.md Convention 165, and two PRD addenda all corroborate the same identifier and architecture.

No contradictions surfaced. Documentation, code presence, and caller wiring are mutually consistent. Live-deployment status not verified (see Field 5).

---

<!-- PROGRESS MARKER: calibration entry 497 complete and approved by founder; resuming with remaining 8 entries (42, 56, 65, 81, 139, 165, 445, 476) -->

---

## Entry 42 — `Recalculate tier blocks Edge Function`

**Registry line:** 42
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Recalculate tier blocks Edge Function | PRD-02/PRD-31 | — | ⏳ Unwired (MVP) | Phase 38 (Stripe) |
```

### Field 1 — Implementation identifier (4-level extraction chain)

(a) Stub row text: capability name "Recalculate tier blocks Edge Function" without a kebab-case Edge Function endpoint identifier inline. No file path, function name, or RPC named in the row.
(b) `WIRING_STATUS.md`: grep returned no matches for `recalculate-tier|tier-blocks|tier blocks`.
(c) `CLAUDE.md`: grep returned no matches for `tier.block|tier_block`.
(d) PRD addendum: `prds/addenda/PRD-31-Permission-Matrix-Addendum.md:494` — "Edge Function added: `recalculate-tier-blocks` — triggered on tier change, recalculates `blocked_by_tier` for all family members".

```
Source: prds/addenda/PRD-31-Permission-Matrix-Addendum.md:494
Identifier: `recalculate-tier-blocks` (Edge Function endpoint name)
Quote: "Edge Function added: `recalculate-tier-blocks` — triggered on tier change, recalculates `blocked_by_tier` for all family members"
```

Secondary identifier from same chain: `blocked_by_tier` (target column on `member_feature_toggles` per PRD-31).

### Field 2 — Code presence check

**Identifier 1 — `recalculate-tier-blocks` Edge Function**

```
Glob command: pattern=`supabase/functions/*tier*/**`
Hits: 0 — no Edge Function directory matches.

Glob command: pattern=`supabase/functions/*recalc*/**`
Hits: 0 — no Edge Function directory matches.

Grep command: pattern=`recalculate-tier|recalc-tier|tier-block|recalculate_tier`, output_mode=content, -n
Hits: 6 across 3 documentation files only:
  - AUDIT-REPORT.md:65 — "`recalculate-tier-blocks` Edge Function | Stubbed | STUB_REGISTRY | Deferred to Stripe phase"
  - claude/feature-decisions/PRD-02-repair.md:55, 98, 121 — Issue 16: "recalculate-tier-blocks Edge Function (stub)" and "Issue 16 | recalculate-tier-blocks Edge Function | **Stubbed** | Blocked_by_tier column exists; recalculation deferred to Stripe webhook integration"
  - prds/addenda/PRD-31-Permission-Matrix-Addendum.md:494 — see Field 1.

No code files. No `supabase/functions/recalculate-tier-blocks/` directory.
```

**Identifier 2 — `blocked_by_tier` column**

```
Grep command: pattern=`blocked_by_tier`, path=`supabase`, output_mode=files_with_matches
Hits: 4 migration files:
  - supabase/migrations/00000000000011_permissions_remediation.sql
  - supabase/migrations/00000000000012_permission_profiles.sql
  - supabase/migrations/00000000000019_schema_remediation_batch2.sql
  - supabase/migrations/00000000100028_prd02_repair.sql
```

Column exists in DB schema; no Edge Function source-code file references it.

### Field 3 — Wiring check

Skipped — Field 2 found no Edge Function code presence (only documentation hits and the column).

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No mention found.

**Cross-PRD addendum mentions:**
- `prds/addenda/PRD-31-Permission-Matrix-Addendum.md:417, 494` — describes the recalculation trigger and names the Edge Function.

**PlannedExpansionCard / stub UI:** Not applicable — backend recalculation function, no UI surface.

**CLAUDE.md convention mention:** No mention found.

**Other documentation:**
- `AUDIT-REPORT.md:65` lists this Edge Function as "Stubbed" deferred to the Stripe phase.
- `claude/feature-decisions/PRD-02-repair.md:55, 98, 121` documents Issue 16 as "Stubbed; Blocked_by_tier column exists; recalculation deferred to Stripe webhook integration."

### Field 5 — What was NOT checked

- Whether any application-layer code recomputes `blocked_by_tier` synchronously inside a non-Edge-Function path (e.g. inside `lila-chat` or `apply_permission_profile` — would need broader hook/RPC tracing).
- Whether the column has any non-NULL values in the live DB (would need Supabase SQL access; out of scope).
- Whether the Stripe webhook flow has been started in any branch (search constrained to repo state at HEAD).

### Field 6 — Observations (no verdict)

`STUB_REGISTRY.md:42` claims `⏳ Unwired (MVP)` with note "Phase 38 (Stripe)". Evidence: `recalculate-tier-blocks` Edge Function is named only in documentation (PRD-31 Permission Matrix Addendum, PRD-02 repair feature decision, AUDIT-REPORT). No `supabase/functions/recalculate-tier-blocks/` directory or any source-code file. The target column `blocked_by_tier` exists in 4 migration files. WIRING_STATUS.md and CLAUDE.md do not mention the function. Documentation labels the function "Stubbed; deferred to Stripe phase."

---

## Entry 56 — `Voice input (Whisper)` (PRD-05)

**Registry line:** 56
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Voice input (Whisper) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier (4-level extraction chain)

(a) Stub row text: capability name "Voice input (Whisper)". No specific endpoint identifier inline.
(b) Skipped — go to (c) where CLAUDE.md Convention 59 names the function directly.
(c) `CLAUDE.md` Convention 59 (line 222): "**Voice input** wired to LiLa drawer/modal via `useVoiceInput` hook → `whisper-transcribe` Edge Function. Recording indicator, interim preview, transcribed text inserted into input."

```
Source: CLAUDE.md convention #59 (line 222)
Identifier (primary): `whisper-transcribe` (Edge Function)
Identifier (secondary): `useVoiceInput` (React hook)
Quote: "Voice input wired to LiLa drawer/modal via `useVoiceInput` hook → `whisper-transcribe` Edge Function."
```

`claude/architecture.md:168` independently names `whisper-transcribe` as "Voice-to-text transcription via OpenAI Whisper API".

### Field 2 — Code presence check

**Identifier 1 — `whisper-transcribe`**

```
Glob command: pattern=`supabase/functions/whisper*/**`
Hits: 1 file
Files:
  - supabase/functions/whisper-transcribe/index.ts

Grep command: pattern=`whisper-transcribe`, output_mode=files_with_matches
Hits: 8 files:
  - AUDIT_REPORT_v1.md
  - CLAUDE.md
  - .claude/completed-builds/2026-04/build-e-prd-17b-mindsweep.md
  - supabase/supabase/config.toml
  - src/hooks/useVoiceInput.ts
  - AUDIT-REPORT.md
  - MyAIM-Central-Complete-File-Inventory.md
  - claude/architecture.md
```

First-context window for `supabase/functions/whisper-transcribe/index.ts` (lines 1-29):
```ts
// MyAIM Central — Whisper Transcription Edge Function
// Accepts audio file, transcribes via OpenAI Whisper API, returns text.
// Used by Smart Notepad voice input, MindSweep, and other voice capture features.

import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

Deno.serve(async (req: Request) => {
  ...
  const formData = await req.formData()
  const audioFile = formData.get('audio') as File | null
  ...
```

Supabase config registration (`supabase/supabase/config.toml:421-422`):
```toml
[functions.whisper-transcribe]
verify_jwt = false
```

**Identifier 2 — `useVoiceInput`**

```
Grep command: pattern=`useVoiceInput`, output_mode=files_with_matches
Hits: 17 files (selected):
  - src/hooks/useVoiceInput.ts (definition)
  - src/components/lila/LilaDrawer.tsx
  - src/components/lila/LilaModal.tsx
  - src/components/lila/ToolConversationModal.tsx
  - src/components/lila/BoardOfDirectorsModal.tsx
  - src/components/notepad/NotepadDrawer.tsx
  - src/components/guided/WriteDrawerNotepad.tsx
  - src/components/archives/VoiceDumpModal.tsx
  - src/components/shared/VoiceInputButton.tsx
  - src/pages/MindSweepCapture.tsx
  - CLAUDE.md
  - .claude/completed-builds/README.md
  - .claude/completed-builds/2026-04/build-e-prd-17b-mindsweep.md
  - claude/feature-decisions/PRD-17B-MindSweep.md
  - claude/feature-decisions/PRD-13B-Archives-Repair-Pass.md
```

Hook is consumed across LiLa drawer + modal + tool-conversation modal + Board of Directors modal + Notepad + Guided Write Drawer + Archives Voice Dump + MindSweep + the shared `VoiceInputButton` component.

### Field 3 — Wiring check

**Callers/Importers:** 16 caller files (the 17 hits above minus the hook definition itself + the documentation files).

**Execution-flow location:** `supabase/functions/whisper-transcribe/index.ts` is a Supabase Edge Function (Deno.serve handler). `src/hooks/useVoiceInput.ts` is a React hook used by multiple modals/drawers/pages.

**Most recent touching commit:**
```
git log -1 --format="%h %ai %s" -- supabase/functions/whisper-transcribe/index.ts
→ 6b30b1d 2026-03-30 22:59:24 -0500 refactor: /simplify — extract shared Edge Function utils, add Zod validation, migrate legacy modals
```

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Grep returned no direct mention of `whisper-transcribe`. Capability is mentioned indirectly through "MindSweep capture: text, voice, scan, link, calendar import" at WIRING_STATUS.md:114 and the Notepad row at WIRING_STATUS.md:14.

**Cross-PRD addendum mentions:** Not directly grepped for `whisper-transcribe` in `prds/addenda/`. Convention 59 in CLAUDE.md is the authoritative summary.

**PlannedExpansionCard / stub UI:** Not applicable — voice input is wired into many active surfaces.

**CLAUDE.md convention mention:** Convention 59 (line 222) — full quote in Field 1.

**Other documentation:** `claude/architecture.md:168` lists `whisper-transcribe` in the Edge Functions table.

### Field 5 — What was NOT checked

- Whether `OPENAI_API_KEY` env var is set in production (out of scope).
- Whether the function quota / OpenAI rate limit has been exercised in beta usage (out of scope).
- Whether ALL 16 caller surfaces actually exercise `useVoiceInput` at runtime, or whether some just import it dead (would require runtime telemetry).

### Field 6 — Observations (no verdict)

`STUB_REGISTRY.md:56` claims `✅ Wired`. Evidence: Edge Function file exists at `supabase/functions/whisper-transcribe/index.ts` with OPENAI_API_KEY env reference, multipart-audio body handling, shared CORS + cost-logger imports. Function registered in `supabase/supabase/config.toml`. React hook `useVoiceInput` consumed by 16 client surfaces (LiLa drawer/modal, Notepad, MindSweep, Archives, Guided Write, Board of Directors, shared VoiceInputButton). Most recent commit on the Edge Function: `6b30b1d` (2026-03-30). CLAUDE.md Convention 59 corroborates the wiring.

---

## Entry 65 — `BookShelf RAG context` (PRD-05)

**Registry line:** 65
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| BookShelf RAG context | PRD-05 | PRD-23 | ✅ Wired | 2026-04-11 (Phase 1b-E: context-assembler → get_bookshelf_context platform RPC) |
```

### Field 1 — Implementation identifier (4-level extraction chain)

(a) Stub row text directly names two identifiers inline: "context-assembler" (file) and "`get_bookshelf_context` platform RPC".

```
Source: stub entry line 65
Identifier (primary): `get_bookshelf_context` (Postgres RPC)
Identifier (secondary): context-assembler Edge Function shared module
Quote: "Phase 1b-E: context-assembler → get_bookshelf_context platform RPC"
```

(d.5) From level (a) "context-assembler" was a module path, not a function name; opening `supabase/functions/_shared/context-assembler.ts:458` surfaces the named function `loadBookShelfContext` which is the wrapper that calls the RPC. Recorded as a tertiary identifier.

### Field 2 — Code presence check

**Identifier 1 — `get_bookshelf_context`**

```
Grep command: pattern=`get_bookshelf_context`, output_mode=files_with_matches
Hits: 8 files:
  - STUB_REGISTRY.md (the entry)
  - supabase/functions/_shared/context-assembler.ts
  - .claude/completed-builds/2026-04/phase-1b-prd-23-bookshelf-platform-migration.md
  - claude/feature-decisions/PRD-23-BookShelf-Platform-Library-Phase1b.md
  - supabase/migrations/00000000100131_bookshelf_phase1b_consumer_rpcs.sql
  - tests/e2e/features/bookshelf-platform-library.spec.ts
  - src/lib/ai/context-assembly.ts
  - supabase/migrations/00000000100094_bookshelf_phase2_frontend_rpcs.sql
```

Migration creating the RPC: `supabase/migrations/00000000100094_bookshelf_phase2_frontend_rpcs.sql:186-190` ("RPC: get_bookshelf_context", `CREATE OR REPLACE FUNCTION get_bookshelf_context(...)`). Enum-fix amendment: `supabase/migrations/00000000100131_bookshelf_phase1b_consumer_rpcs.sql:6, 16, 20` ("Fix get_bookshelf_context enum: 'all_extracted' → 'all'").

**Identifier 2 — `loadBookShelfContext`** (in context-assembler)

First-context window for `supabase/functions/_shared/context-assembler.ts:450-498`:
```ts
/**
 * Load BookShelf extraction items filtered by the member's book_knowledge_access setting.
 *
 * Phase 1b-E: Rewired from 4 direct old-table queries to the single
 * get_bookshelf_context platform RPC (migration 100094, enum-fixed in 100131).
 * The RPC queries platform_intelligence.book_extractions + bookshelf_user_state,
 * handles hearted-first ordering, access-level filtering, and book title attribution.
 */
async function loadBookShelfContext(
  familyId: string,
  memberId: string,
): Promise<{ contextLines: string[]; itemCount: number; reason: string }> {
  ...
  const access = (settings?.book_knowledge_access as string) || 'hearted_only'
  if (access === 'none') return empty
  ...
  const { data, error } = await supabase.rpc('get_bookshelf_context', {
    p_family_id: familyId,
    p_member_id: memberId,
    p_access_level: accessLevel,
    p_max_items: MAX_ITEMS,
  })
  ...
```

E2E test exists at `tests/e2e/features/bookshelf-platform-library.spec.ts`.

### Field 3 — Wiring check

**Callers/Importers:** `loadBookShelfContext` is invoked from inside `supabase/functions/_shared/context-assembler.ts` itself (used by the central context-assembly pipeline; consumed by every LiLa Edge Function that imports the module). Frontend-side `src/lib/ai/context-assembly.ts` independently references `get_bookshelf_context`.

**Execution-flow location:** Postgres function (`get_bookshelf_context`) created by migrations 100094 and patched by 100131. Wrapper `loadBookShelfContext` is part of the shared Edge Function context-assembler module. E2E test in Playwright suite.

**Most recent touching commits:**
```
git log -1 --format="%h %ai %s" -- supabase/functions/_shared/context-assembler.ts
→ 6760ad1 2026-04-17 21:12:24 -0500 feat(phase-0.26-s3.1): role-asymmetric privacy filter helper + context-assembler fix

git log -1 --format="%h %ai %s" -- supabase/migrations/00000000100131_bookshelf_phase1b_consumer_rpcs.sql
→ e9eb169 2026-04-11 01:29:59 -0500 feat(bookshelf): Phase 1b-E — rewire key-points, study-guide, context-assembler to platform
```

The 2026-04-11 commit aligns with the date in the stub row.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Grep returned no `get_bookshelf_context` mention in WIRING_STATUS.md.

**Cross-PRD addendum mentions:** Not grepped for the RPC name in `prds/addenda/`. `claude/feature-decisions/PRD-23-BookShelf-Platform-Library-Phase1b.md` discusses the migration.

**PlannedExpansionCard / stub UI:** Not applicable — backend RAG context loader.

**CLAUDE.md convention mention:** Grep returned no `get_bookshelf_context` matches in CLAUDE.md.

**Other documentation:**
- `claude/ai_patterns.md:149-150, 161, 183` references BookShelf chunks/extractions and `match_bookshelf_chunks`/`match_bookshelf_extractions` RPCs (separate semantic-search RPCs from `get_bookshelf_context`). The architecture document covers BookShelf extensively but does not cite `get_bookshelf_context` by name.
- `.claude/completed-builds/2026-04/phase-1b-prd-23-bookshelf-platform-migration.md` documents the rewire.

### Field 5 — What was NOT checked

- Whether the function is currently DEPLOYED to the production Supabase instance (would need `supabase functions deploy` history; out of scope).
- Whether the platform_intelligence.book_extractions table has rows in production (would require live SQL).
- Whether `bookshelf_member_settings.book_knowledge_access` is populated for live family members (would require live SQL).
- The full body of `get_bookshelf_context` in migrations 100094 and 100131 (only top lines confirmed).
- Whether the E2E test currently passes (would need a test run).
- Whether `claude/ai_patterns.md` SHOULD reference `get_bookshelf_context` (documentation gap, not a code gap).

### Field 6 — Observations (no verdict)

`STUB_REGISTRY.md:65` claims `✅ Wired` with date 2026-04-11. Evidence: RPC `get_bookshelf_context` defined in migration 100094 (frontend RPCs), enum-patched in migration 100131. Wrapper function `loadBookShelfContext` exists at `supabase/functions/_shared/context-assembler.ts:458-498` and invokes the RPC via `supabase.rpc('get_bookshelf_context', ...)`. E2E test present. Phase 1b-E commit `e9eb169` dated 2026-04-11 matches the registry's date. WIRING_STATUS.md and CLAUDE.md do not name the RPC explicitly (documentation gap noted). `claude/ai_patterns.md` describes the BookShelf context pipeline but cites different RPCs (`match_bookshelf_chunks`/`match_bookshelf_extractions`) which serve a different code path.

---

## Entry 81 — `Voice input (Whisper)` (PRD-05 Phase 06 / PRD-08 Phase 09 — duplicate row)

**Registry line:** 81
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Voice input (Whisper) | PRD-05 (Phase 06) | PRD-08 (Phase 09) | ✅ Wired | Phase 09 |
```

### Cross-reference note

This is the same capability identifier as entry 56, with a different "Created By" / "Wired By" attribution (PRD-05 Phase 06 — wired via PRD-08 Phase 09 — Notepad). Per partition file instruction: "process with cross-reference note to packet at line 56."

The full evidence packet for the underlying `whisper-transcribe` Edge Function and `useVoiceInput` hook is at `## Entry 56` above. All Field 1-4 evidence applies identically.

### Field 1 — Implementation identifier

Same as entry 56:
- Primary: `whisper-transcribe` (Edge Function — `supabase/functions/whisper-transcribe/index.ts`)
- Secondary: `useVoiceInput` (React hook — `src/hooks/useVoiceInput.ts`)
- Source: CLAUDE.md Convention 59 (line 222) names both.

### Field 2 — Code presence check

Same hits as entry 56. Notepad-specific caller: `src/components/notepad/NotepadDrawer.tsx` (uses `useVoiceInput`). This is the PRD-08 wiring path implied by line 81's "Wired By" cell.

### Field 3 — Wiring check

Same as entry 56. The PRD-08 NotepadDrawer is one of 16 caller surfaces.

### Field 4 — Documentation cross-reference

Same as entry 56. Note: STUB_REGISTRY.md contains TWO rows for "Voice input (Whisper)" (lines 56 and 81) attributed to different parent PRDs. This duplication is documented in the partition file ("Voice input (Whisper) — duplicate row").

### Field 5 — What was NOT checked

- Whether the duplication is intentional (one row per PRD context) or a registry hygiene issue (would be a synthesis-stage judgment call).
- Whether other duplicate-shaped entries exist elsewhere in STUB_REGISTRY.md (out of scope for this entry).

### Field 6 — Observations (no verdict)

`STUB_REGISTRY.md:81` claims `✅ Wired`. Same Edge Function (`whisper-transcribe`) and hook (`useVoiceInput`) as entry 56. The Notepad-specific consumer (`NotepadDrawer.tsx`) is one of the surfaces the hook serves, supporting the "Wired By: PRD-08 (Phase 09)" attribution. Two registry rows for the same capability — flagged for synthesis-stage judgment on whether to deduplicate.

---

## Entry 139 — `Haiku overview card generation (AI call)` (PRD-13)

**Registry line:** 139
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Haiku overview card generation (AI call) | PRD-13 | — | 📌 Post-MVP | Card renders, generation call is stub |
```

### Field 1 — Implementation identifier (4-level extraction chain)

(a) Stub row names a capability ("Haiku overview card generation (AI call)") and notes "Card renders, generation call is stub" — no concrete Edge Function or function name in the row.
(b) `WIRING_STATUS.md`: no entry for overview card generation.
(c) `CLAUDE.md`: no convention naming the generation call.
(d) `prds/personal-growth/PRD-13-Archives-Context.md`:
- Line 110: "**Auto-Generated Overview Card** — a compact 'baseball card' summary of everything known about this person, auto-generated from all active context items and aggregated source data."
- Line 112: "The overview card is generated by a Haiku call summarizing all active context for the person."
- Line 583-584 (data model): `overview_card_content TEXT` and `overview_card_updated_at TIMESTAMPTZ` columns on `archive_member_settings`.
- Line 762-767 ("Auto-Generated Overview Cards"): "Send to Haiku with a prompt: 'Summarize this person's context as a compact profile card. ...'"

```
Source: prds/personal-growth/PRD-13-Archives-Context.md:110, 112, 762-767
Identifier (target columns): `overview_card_content`, `overview_card_updated_at` (on `archive_member_settings`)
Identifier (capability): "Haiku call to summarize context" — PRD does not assign an Edge Function endpoint name.
Quote (line 112): "The overview card is generated by a Haiku call summarizing all active context for the person."
```

(d.5) From level (d), opening the named target file `src/hooks/useArchives.ts` surfaces a write path for the columns at lines 391-394 — but this is a manual save pattern (`overview_card_content: content`), not a generated call. No identifier inside the file matches a generation function. PRD-13 names no specific Edge Function endpoint; chain terminates without a Haiku-call identifier.
(e) Generation-call-side: CAPABILITY-ONLY. Storage-side: column identifiers found.

### Field 2 — Code presence check

**Identifier (storage columns) — `overview_card_content`**

```
Grep command: pattern=`overview_card_content`, output_mode=files_with_matches
Hits: 9 files:
  - claude/live_schema.md
  - .claude/archive/database_schema_SUPERSEDED.md
  - src/pages/archives/MemberArchiveDetail.tsx (read at line 785)
  - src/hooks/useArchives.ts (write at lines 391-394)
  - src/types/archives.ts
  - prds/personal-growth/PRD-13-Archives-Context.md
  - supabase/migrations/00000000100035_prd13_archives_context.sql
  - claude/feature-decisions/PRD-13-Archives-Context.md
  - audit/CORRECTED_DATABASE_SCHEMA.md
```

Read path:
```tsx
// src/pages/archives/MemberArchiveDetail.tsx:784-786
// Overview card
const overviewContent = memberSettings?.overview_card_content
const overviewUpdatedAt = memberSettings?.overview_card_updated_at
```

Write path (manual upsert):
```ts
// src/hooks/useArchives.ts:390-396
{
  family_id: familyId,
  member_id: memberId,
  overview_card_content: content,
  overview_card_updated_at: new Date().toISOString(),
},
{ onConflict: 'family_id,member_id' }
```

**Identifier (generation Edge Function)**

```
Glob command: pattern=`supabase/functions/*overview*/**`
Hits: 0 — no Edge Function directory matches.

Grep command: pattern=`generate.*overview|overview.*haiku`, path=`supabase/functions`, output_mode=files_with_matches, -i
Hits: 0 — no Edge Function source-code file matches.
```

### Field 3 — Wiring check

For the storage columns: column read (display) is wired in `MemberArchiveDetail.tsx`; column write (manual content) is wired in `useArchives.ts`.

For the AI generation call: skipped — no Edge Function identified to grep against.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No mention of overview card generation.

**Cross-PRD addendum mentions:** Not grepped — PRD-13 itself is the source of the design.

**PlannedExpansionCard / stub UI:** Not checked — not applicable to a pure backend generation step.

**CLAUDE.md convention mention:** No convention names the generation call.

### Field 5 — What was NOT checked

- Whether any non-Edge-Function code path triggers a Haiku call to populate `overview_card_content` (e.g. an in-app `lila-chat` or `ai-parse` invocation with an overview-summary prompt — would require broader prompt-text grep).
- Whether the registry's "Card renders, generation call is stub" note is corroborated by the absence of any Haiku call invocation referencing `overview_card_content` in the codebase (would require pattern-search across `src/`).
- Semantic-search question that mgrep could answer if approved per query: "Is there any code anywhere that generates the overview card text via AI today, or is the column purely manually populated?" — recorded; not invoked per Convention 242.

### Field 6 — Observations (no verdict)

`STUB_REGISTRY.md:139` claims `📌 Post-MVP` with note "Card renders, generation call is stub." Evidence: storage columns `overview_card_content` and `overview_card_updated_at` exist in `archive_member_settings` (migration 100035). UI read path in `MemberArchiveDetail.tsx:784-786`. UI write path (manual content upsert) in `useArchives.ts:390-396`. PRD-13 (lines 110, 112, 762-767) describes the generation flow as a Haiku call summarizing active context; PRD does not name an Edge Function endpoint. No `supabase/functions/*overview*/` directory; no source-code file grep hit for "generate overview" or "overview haiku" inside `supabase/functions/`. Registry's claim "generation call is stub" aligns with the absence of an Edge Function for this purpose. Capability-only on the AI generation side.

---

## Entry 165 — `MindSweep email forwarding` (PRD-08 / PRD-17B)

**Registry line:** 165
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| MindSweep email forwarding | PRD-08 | PRD-17B | ✅ Wired | Phase 18 |
```

### Field 1 — Implementation identifier (4-level extraction chain)

(a) Stub row text: capability "MindSweep email forwarding" — no Edge Function name in the row.
(b) `WIRING_STATUS.md:134`: "Forward email (.ics) | Email forwarding → mindsweep-email-intake | Stub (DNS not configured)".

```
Source: WIRING_STATUS.md:134
Identifier (primary): `mindsweep-email-intake` (Edge Function)
Quote: "Forward email (.ics) | Email forwarding → mindsweep-email-intake | Stub (DNS not configured)"
```

Secondary identifier inside the function file: `sweep_email_address` (target column on `families`) and `mindsweep_allowed_senders` (target table). Confirmed by the function header.

### Field 2 — Code presence check

**Identifier 1 — `mindsweep-email-intake`**

```
Glob command: pattern=`supabase/functions/*email*/**`
Hits: 1 file:
  - supabase/functions/mindsweep-email-intake/index.ts

Glob command: pattern=`supabase/functions/*mindsweep*/**`
Hits: 4 files (3 sibling MindSweep functions + email-intake).

Grep command: pattern=`mindsweep-email|mindsweep_email|sweep_email_address`, output_mode=files_with_matches
Hits: 19 files including:
  - src/pages/SettingsPage.tsx
  - supabase/supabase/config.toml
  - WIRING_STATUS.md
  - src/hooks/useMindSweep.ts
  - supabase/functions/mindsweep-email-intake/index.ts
  - supabase/migrations/00000000100089_mindsweep_tables.sql
  - supabase/migrations/00000000000001_auth_family_setup.sql
  - prds/communication/PRD-17B-MindSweep.md
  - prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md
  - claude/feature-decisions/PRD-17B-MindSweep.md
  - claude/feature-decisions/PRD-17B-MindSweep-NextSession.md
```

First-context window for `supabase/functions/mindsweep-email-intake/index.ts` (lines 1-21):
```ts
/**
 * mindsweep-email-intake — PRD-17B Email Forwarding Intake
 *
 * Receives forwarded emails (via webhook from email service — DNS not yet configured).
 * Validates sender against mindsweep_allowed_senders, extracts text content,
 * and either processes immediately or adds to holding queue based on settings.
 *
 * STUB: This function is code-complete but cannot receive emails until DNS is configured
 * for the family's sweep_email_address domain. The webhook URL would be:
 *   POST https://<project-ref>.supabase.co/functions/v1/mindsweep-email-intake
 *
 * Expected webhook payload (from email service like Resend, Postmark, or SendGrid):
 * {
 *   from: string,
 *   to: string,
 *   subject: string,
 *   text: string,
 *   html?: string,
 * }
 */
```

Function header self-describes as "code-complete but cannot receive emails until DNS is configured."

Supabase config registration (`supabase/supabase/config.toml:502-503`):
```toml
[functions.mindsweep-email-intake]
verify_jwt = false
```

### Field 3 — Wiring check

**Callers/Importers:** No application-layer caller — this is a webhook target invoked by an external email service (Resend/Postmark/SendGrid) once DNS is configured. Internal references in `src/pages/SettingsPage.tsx` and `src/hooks/useMindSweep.ts` relate to the `sweep_email_address` configuration UI, not function invocation.

**Execution-flow location:** Supabase Edge Function (Deno.serve POST handler).

**Most recent touching commit:**
```
git log -1 --format="%h %ai %s" -- supabase/functions/mindsweep-email-intake/index.ts
→ c4433cc 2026-04-03 20:33:10 -0500 feat: PRD-17B Phase C — email UI, allowed senders, auto-sweep, email intake stub
```

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** `WIRING_STATUS.md:134` — "Forward email (.ics) | Email forwarding → mindsweep-email-intake | **Stub (DNS not configured)**".

**Cross-PRD addendum mentions:** `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md` referenced but the specific quote was not extracted.

**PlannedExpansionCard / stub UI:** Not checked — not applicable to webhook target.

**CLAUDE.md convention mention:** Grep returned no matches for `email.forward|sweep_email|mindsweep.*email`.

**Other documentation:** Function file's own commit subject names this as "email intake stub."

### Field 5 — What was NOT checked

- Whether the DNS for the families' sweep email addresses has been configured in production (would require external DNS lookup; out of scope).
- Whether any inbound webhook from an external mail service has been received in production (would require Supabase logs).
- Whether `mindsweep_allowed_senders` and `sweep_email_address` tables/columns are fully wired in the Settings UI (the SettingsPage and useMindSweep hits suggest they are; full UI trace not done).

### Field 6 — Observations (no verdict)

`STUB_REGISTRY.md:165` claims `✅ Wired`. Evidence:
- Edge Function `mindsweep-email-intake` exists at `supabase/functions/mindsweep-email-intake/index.ts` (commit `c4433cc`, 2026-04-03 — "email intake stub").
- Function file's own header explicitly self-describes: "STUB: This function is code-complete but cannot receive emails until DNS is configured for the family's sweep_email_address domain."
- WIRING_STATUS.md:134 labels the email-forwarding path as "Stub (DNS not configured)."
- The commit subject from c4433cc is "email intake stub."

The registry's `✅ Wired` claim and WIRING_STATUS.md / function header's "Stub" labels are not aligned. Surfaced for synthesis-stage judgment.

---

## Entry 445 — `AI Auto-Sort for views` (PRD-09A)

**Registry line:** 445
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| AI Auto-Sort for views | PRD-09A | — | ⏳ Unwired (MVP) | Needs ai-parse Edge Function |
```

### Field 1 — Implementation identifier (4-level extraction chain)

(a) Stub row text: capability "AI Auto-Sort for views"; named dependency "ai-parse Edge Function" (already exists, see entry not in this partition).
(b) `WIRING_STATUS.md`: no row for "AI Auto-Sort for views".
(c) `CLAUDE.md`: no convention naming this capability.
(d) `prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md`:
- Line 585 ("AI Auto-Sort"): "When the user switches to a framework view and tasks are missing placement data for that view, LiLa offers to suggest placements."
- Line 1143 ("AI Auto-Sort (View Placement)"): names the **guided mode** `task_placement` with context = "All unplaced tasks + current view framework definition."

```
Source: prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md:1143-1146
Identifier (primary): `task_placement` (LiLa guided mode key)
Identifier (secondary): `ai-parse` Edge Function (per stub row's "Needs ai-parse")
Quote: "**Guided mode name:** `task_placement` ... **Context loaded:** All unplaced tasks + current view framework definition."
```

### Field 2 — Code presence check

**Identifier 1 — `task_placement` guided mode**

```
Grep command: pattern=`task_placement`, output_mode=files_with_matches
Hits: 2 files:
  - prds/personal-growth/PRD-09A-Tasks-Routines-Opportunities.md
  - audit/CORRECTED_GUIDED_MODE_REGISTRY.md
```

Both hits are documentation-only. No source-code file (TypeScript, SQL, Edge Function) references `task_placement`. No `lila_guided_modes` row insertion for this mode key (would require migration grep, but registry-side absence in code is sufficient at this level).

**Identifier 2 — `ai-parse` Edge Function**

```
Glob command: pattern=`supabase/functions/ai-parse/**`
Hits: 1 file
Files:
  - supabase/functions/ai-parse/index.ts
```

`ai-parse` exists. First-context window (lines 1-25):
```ts
// MyAIM Central — AI Parse Edge Function
// Non-streaming utility AI calls: parsing, sorting, classifying, bulk add.
// Used by BulkAddWithAI, family setup, and other features that need
// structured AI output without streaming.
...
const MODELS = {
  sonnet: 'anthropic/claude-sonnet-4',
  haiku: 'anthropic/claude-haiku-4.5',
} as const
```

Last commit on `ai-parse`: `6b30b1d` (2026-03-30) — "refactor: /simplify — extract shared Edge Function utils, add Zod validation, migrate legacy modals".

The stub's note "Needs ai-parse Edge Function" is satisfied at the dependency level (the function exists), but no caller code wires the Auto-Sort UI to invoke it for view placement.

**Identifier 3 — `auto-sort` UI**

```
Grep command: pattern=`auto.?sort|AI.?Sort`, path=`src/components/tasks/ViewCarousel.tsx`, -i
Hits: 1
- src/components/tasks/ViewCarousel.tsx:5 — "Auto-sorts by usage frequency (stored in localStorage)."
```

This is a usage-frequency view sorter (not the AI placement sorter). Per PRD-09A line 482, view auto-sort by usage frequency is a separate feature from "AI Auto-Sort (View Placement)" at line 1143.

### Field 3 — Wiring check

For `task_placement` guided mode: skipped — no source-code presence to trace.

For `ai-parse` Edge Function: function exists and is invoked by `RoutineBrainDump.tsx` and other callers (per the Field 2 grep), but no caller is the AI Auto-Sort task-placement flow.

For `ViewCarousel` localStorage usage-frequency sorter: that is a different capability (frequency-based view ordering) and is not the AI placement feature this stub describes.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No row for AI Auto-Sort.

**Cross-PRD addendum mentions:** Not grepped specifically.

**PlannedExpansionCard / stub UI:** Not checked.

**CLAUDE.md convention mention:** No convention names AI Auto-Sort.

**Other documentation:** `audit/CORRECTED_GUIDED_MODE_REGISTRY.md` references `task_placement` (the audit's corrected list of guided modes that should exist), implying it is an expected mode that has not been seeded into `lila_guided_modes`.

### Field 5 — What was NOT checked

- Whether any migration inserts a `task_placement` row into `lila_guided_modes` (would require grepping migration files for the literal string `task_placement` — Field 2 grep covered all paths and found only doc hits).
- Whether the ViewCarousel component has a code path that displays a "LiLa suggested placements" banner per PRD-09A line 587 (Field 2 grep on the file showed only the localStorage sorter).
- Whether some other Edge Function (not `ai-parse`) is currently being used as a placeholder for placement suggestions (would require broader semantic search).

### Field 6 — Observations (no verdict)

`STUB_REGISTRY.md:445` claims `⏳ Unwired (MVP)` with note "Needs ai-parse Edge Function". Evidence:
- The named dependency `ai-parse` Edge Function EXISTS at `supabase/functions/ai-parse/index.ts` (commit `6b30b1d`, 2026-03-30). The dependency description in the stub note is therefore satisfied.
- The PRD-09A specification for the feature names a guided mode `task_placement` (line 1144). Grep finds this mode key only in PRD-09A and `audit/CORRECTED_GUIDED_MODE_REGISTRY.md` — no source code, no migration.
- `ViewCarousel.tsx` implements a localStorage usage-frequency sorter (line 5), which is a separate capability per PRD-09A.
- No "AI placement banner" UI was traced.

Capability-side: not implemented in code despite the named dependency being available. Stub's "Needs ai-parse" note is technically out-of-date (the dep exists), but the feature itself is still un-wired.

---

## Entry 476 — `Full PRD-30 Layer 2 Haiku safety classification for ThoughtSift` (PRD-34 / PRD-30)

**Registry line:** 476
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Full PRD-30 Layer 2 Haiku safety classification for ThoughtSift | PRD-34 | PRD-30 | ⏳ Unwired (MVP) | Phase 34 (Safety Monitoring) |
```

### Field 1 — Implementation identifier (4-level extraction chain)

(a) Stub row: capability "Full PRD-30 Layer 2 Haiku safety classification for ThoughtSift" — no concrete Edge Function endpoint named.
(b) `WIRING_STATUS.md`: not checked specifically; safety pipeline absent from current wiring.
(c) `CLAUDE.md` Convention 104 (line 284): "**All ThoughtSift conversations pass through PRD-30 safety monitoring pipeline.** No new safety infrastructure needed. Crisis override is global." — names the pipeline but not an Edge Function endpoint.
(d) PRD-30 (`prds/platform-complete/PRD-30-Safety-Monitoring.md`):
- Line 779: acceptance criterion — "Layer 2 Haiku classification runs on conversation completion for monitored members"
- Line 812: "Convention: Safety monitoring uses a two-layer detection pipeline: Layer 1 (keyword/phrase matching, synchronous, every message) + Layer 2 (Haiku conversation classification, async, per-conversation). Both layers feed the same `safety_flags` table."

`prds/addenda/PRD-34-Cross-PRD-Impact-Addendum.md:81`: "All ThoughtSift conversations pass through the existing two-layer safety pipeline (Layer 1 keyword matching + Layer 2 Haiku classification). No new safety infrastructure needed."

`claude/architecture.md` table (Edge Functions list) names `safety-classify` as "Haiku conversation classification for safety monitoring" — this is the implied Edge Function endpoint name from architecture docs.

```
Source: claude/architecture.md (Edge Functions table)
Identifier (primary): `safety-classify` (Edge Function — name from architecture table; status: not yet built)
Identifier (secondary): `safety_flags` (target table — per PRD-30 convention)
```

### Field 2 — Code presence check

**Identifier 1 — `safety-classify` Edge Function**

```
Glob command: pattern=`supabase/functions/safety*/**`
Hits: 0 — no Edge Function directory matches.

Grep command: pattern=`safety-classify|safety_classify`, output_mode=files_with_matches
Hits: 4 files (all documentation):
  - RECONNAISSANCE_REPORT_v1.md
  - .claude/agents/edge-function-scaffolder.md
  - claude/architecture.md
  - AI-COST-TRACKER.md
```

No source-code file references the function endpoint. No `supabase/functions/safety-classify/` directory.

**Identifier 2 — `safety_flags` table**

```
Grep command: pattern=`safety_flags`, path=`supabase`, output_mode=files_with_matches
Hits: 0 — no migration creates the table.

Grep command: pattern=`safety_flags|safety-classify`, path=`claude/live_schema.md`, output_mode=content, -n
Hits: 0 — table not present in live schema snapshot.
```

Table does not exist in the live schema or in any migration file.

### Field 3 — Wiring check

Skipped — Field 2 found no Edge Function or table source-code presence.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Not grepped specifically.

**Cross-PRD addendum mentions:** `prds/addenda/PRD-34-Cross-PRD-Impact-Addendum.md:30, 78-87, 142` — names PRD-30 dependency multiple times; line 81 quoted in Field 1.

**PlannedExpansionCard / stub UI:** Not checked — backend safety pipeline.

**CLAUDE.md convention mention:** Convention 104 (line 284) — full quote in Field 1.

**Other documentation:**
- `prds/platform-complete/PRD-30-Safety-Monitoring.md:779, 812` — Layer 2 Haiku classification acceptance criterion + convention.
- `claude/ai_patterns.md:319` — references "Layer 2: Haiku conversation classification — async background processing" in the Safety Systems section.
- `claude/architecture.md` (Edge Functions table) names `safety-classify` — implied endpoint name.

### Field 5 — What was NOT checked

- Whether any partial scaffolding exists for `safety-classify` in a feature branch (search constrained to HEAD).
- Whether any current `lila-chat` or ThoughtSift Edge Function calls a Haiku classifier inline (would require deeper trace of those functions).
- Whether the `safety_flags` table is referenced in any TypeScript types file as an expected future shape (out of scope for this entry).
- Semantic search question for mgrep approval queue (not invoked): "Are there any Haiku classification calls happening today that share the safety-classify code shape, even if not named that way?"

### Field 6 — Observations (no verdict)

`STUB_REGISTRY.md:476` claims `⏳ Unwired (MVP)` with note "Phase 34 (Safety Monitoring)". Evidence:
- No `supabase/functions/safety-classify/` directory.
- No source-code file references the implied Edge Function endpoint name.
- No migration creates a `safety_flags` table; table absent from `claude/live_schema.md`.
- PRD-30 (lines 779, 812), CLAUDE.md Convention 104, PRD-34 Cross-PRD addendum (line 81), and `claude/architecture.md` Edge Functions table all describe the Layer 2 Haiku classification capability and the pipeline integration with ThoughtSift.
- Documentation describes the design; code does not yet implement it.

---

<!-- PROGRESS MARKER: completed entries 42, 56, 65, 81, 139, 165, 445, 476 (all 8 to-be-processed entries plus calibration) at 2026-04-19 session end -->

## PARTITION COMPLETE

Session 2 (Edge Functions) processed 9 of 9 entries (calibration 497 + entries 42, 56, 65, 81, 139, 165, 445, 476). No HALT conditions encountered. Registry baseline of 547 lines verified at session start, before each entry, and before final write.

Entries that surfaced potential contradictions for synthesis-stage review (Field 6 notes):
- Entry 165 — registry says `✅ Wired`, function header + WIRING_STATUS.md + commit subject all label "stub (DNS not configured)".

Entries with documentation gaps noted in Field 5 / Field 6 but not verdicts:
- Entry 65 — `claude/ai_patterns.md` and CLAUDE.md cite different BookShelf RPCs; `get_bookshelf_context` is named only in stub row + migrations + context-assembler + feature decision.
- Entry 81 — duplicate registry row for the same capability as entry 56 (different parent-PRD attribution).
- Entry 445 — stub note "Needs ai-parse Edge Function" is out-of-date (the dependency exists); the feature itself is still un-wired.

All other entries had mutually consistent evidence across code, config, conventions, and PRDs.
