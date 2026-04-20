# Scope 5 Evidence — Crosscutting Partition (Session 4)

> **Recipe:** `scope-5-evidence/EVIDENCE_RECIPE.md` (recipe-v1, frozen per plan §5b).
> **Partition:** `scope-5-evidence/stub_partition_crosscutting.md`.
> **Registry baseline:** 547 lines, commit `c2e04e3`. Re-checked at session start and between batches: 547 ✓. HALT file absent throughout.
> **Session started:** 2026-04-19.
> **Calibration entry:** line 493 (`createTaskFromData` guard for `taskType='sequential'`) — processed first, founder-approved before full-batch dispatch.
> **Post-calibration dispatch:** 4 parallel sub-agents (Batch A / B / C / D) processed the remaining 154 entries; each sub-agent wrote to a scratch file and the lead merged in registry-line order after quality review.
> **Totals:** 155 packets (154 partition entries + 1 calibration). ~73 CAPABILITY-ONLY (level (e)), ~81 with grep evidence. CAPABILITY-ONLY rate ~47%, within expected 30–50% for this partition.

---

## Entry 25 — `Session duration per role`

**Registry line:** 25
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Session duration per role | PRD-01 | PRD-01 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier

- **(a)** Stub row names no concrete code identifier.
- **(b)** `WIRING_STATUS.md` — no dedicated section for session-duration / inactivity timeout.
- **(c)** `CLAUDE.md` Convention #63 (line 229) names `useSessionTimeout` hook in ShellProvider.
  - Source: CLAUDE.md convention #63: "Session duration per role: adult=24h, independent=4h, guided=1h, play=30m. `useSessionTimeout` hook in ShellProvider tracks inactivity (mouse/key/touch/scroll), throttled to 30s resets. Warning banner 2 minutes before expiry. Auto-signout on timeout."
  - Identifier: `useSessionTimeout` hook, wired via `ShellProvider`.

### Field 2 — Code presence check

```
Grep command: pattern=`useSessionTimeout`, output_mode=files_with_matches
Hits: 4
Files:
  - src\hooks\useSessionTimeout.ts (definition)
  - src\components\shells\ShellProvider.tsx (consumer)
  - CLAUDE.md (convention)
  - MyAIM-Central-Complete-File-Inventory.md (inventory reference)
```

First-context window from `src/hooks/useSessionTimeout.ts` lines 15-23:

```ts
const SESSION_DURATIONS: Record<string, number> = {
  adult: 0,                          // 0 = no timeout, stay signed in until manual sign-out
  independent: 7 * 24 * 60 * 60 * 1000, // 7 days
  guided: 7 * 24 * 60 * 60 * 1000,      // 7 days
  play: 7 * 24 * 60 * 60 * 1000,        // 7 days
}

const WARNING_LEAD_MS = 2 * 60 * 1000    // Show warning 2 minutes before expiry
const THROTTLE_MS = 30 * 1000            // Throttle activity resets to once per 30 seconds
```

Note: the SESSION_DURATIONS values in code (adult=0/no-timeout, others=7 days) diverge from the CLAUDE.md Convention #63 values (adult=24h, independent=4h, guided=1h, play=30m). The code comment at line 11-13 explicitly documents the newer policy ("Adults: no inactivity timeout ... Teens/Guided/Play: 7 days of inactivity before sign-out"). Recording as observation, not verdict.

### Field 3 — Wiring check

**Callers/Importers:** `src/components/shells/ShellProvider.tsx:3,47` imports and calls `useSessionTimeout()`, destructures `{ showWarning, secondsRemaining, dismissWarning }`.

**Execution-flow location:** React hook (client-side). Consumer is the shell-wrapping provider that all authenticated shells render inside.

**Most recent touching commit:** Not checked — `git log` requires per-query approval in this session; flagged in Field 5.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No match for "Session duration" or "useSessionTimeout" in WIRING_STATUS.md.

**Cross-PRD addendum mentions:** Not searched in `prds/addenda/` for this identifier beyond general `session duration` keyword.

**PlannedExpansionCard / stub UI:** Not applicable — this is an infrastructure hook, not a demand-validation feature.

**CLAUDE.md convention mention:** Convention #63 (line 229) quoted above. Values in the convention text differ from the values in the code (see Field 2 note).

### Field 5 — What was NOT checked

- Whether the SESSION_DURATIONS code values (adult=0/no-timeout; 7-day for others) reflect a founder-approved update that simply wasn't back-ported into CLAUDE.md convention #63 — semantic / intent question.
- Whether `<InactivityWarning>` banner UI referenced in convention #63 exists and is wired to the hook's `showWarning` state — no grep run for the banner component.
- Git log for last-touching commit (requires per-query approval).

### Field 6 — Observations (no verdict)

Hook `useSessionTimeout` exists at `src/hooks/useSessionTimeout.ts` and is consumed by `src/components/shells/ShellProvider.tsx`. Implementation diverges numerically from CLAUDE.md Convention #63 (hook uses adult=no-timeout + 7-day for non-adults; convention says 24h/4h/1h/30m). Documentation-vs-code drift is recorded as observation; no verdict reached.

---

## Entry 41 — `Post-shift LiLa summary compilation`

**Registry line:** 41
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Post-shift LiLa summary compilation | PRD-02 | — | ⏳ Unwired (MVP) | Phase 06+ (LiLa) |
```

### Field 1 — Implementation identifier

- **(a)** Stub row names no specific function or hook.
- **(b)** `WIRING_STATUS.md` — no dedicated row for post-shift summary compilation.
- **(c)** `CLAUDE.md` — no explicit convention naming a post-shift summary function.
- **(d)** `claude/feature-decisions/PRD-02-repair.md` line 116 names the trigger point: `handleRemoteShiftEnd`, "LiLa API call commented as stub."
  - Source: claude/feature-decisions/PRD-02-repair.md line 116: "Post-shift summary compilation | Stubbed | Trigger point in handleRemoteShiftEnd, LiLa API call commented as stub."
  - Identifier: `handleRemoteShiftEnd` function in `src/pages/PermissionHub.tsx`.

### Field 2 — Code presence check

```
Grep command: pattern=`handleRemoteShiftEnd`, output_mode=content
Hits: 2 locations in src/pages/PermissionHub.tsx
Files:
  - src\pages\PermissionHub.tsx:851 (definition)
  - src\pages\PermissionHub.tsx:937 (onClick handler wiring)
```

First-context window from `src/pages/PermissionHub.tsx` lines 851-861:

```ts
async function handleRemoteShiftEnd() {
  if (!activeShift) return
  await supabase
    .from('shift_sessions')
    .update({ ended_at: new Date().toISOString(), ended_by: 'mom' })
    .eq('id', activeShift.id)
  queryClient.invalidateQueries({ queryKey: ['active-shift', specialAdult.id] })
  // Issue 11: Stub — trigger post-shift summary compilation
  // STUB: LiLa API call to compile shift summary from activity_log_entries
  // Would call: supabase.functions.invoke('lila-chat', { body: { mode: 'shift_summary', shift_id: activeShift.id } })
}
```

### Field 3 — Wiring check

**Callers/Importers:** Invoked from `src/pages/PermissionHub.tsx:937` as `onClick={handleRemoteShiftEnd}` on a button element within the same file (in-file only).

**Execution-flow location:** React component event handler on the Permission Hub page; writes to `shift_sessions` table. The LiLa call itself is commented out as documented stub.

**Most recent touching commit:** Not checked — git log requires per-query approval.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No mention of post-shift summary compilation.

**Cross-PRD addendum mentions:** `prds/addenda/PRD-27-Cross-PRD-Impact-Addendum.md` line 31 mentions "Shift Summary Compilation" as an enhanced PRD-27 capability referencing `shift_reports` table.

**PlannedExpansionCard / stub UI:** Not checked for `<PlannedExpansionCard>` on this surface.

**CLAUDE.md convention mention:** No explicit convention for post-shift summary compilation.

### Field 5 — What was NOT checked

- Whether the `shift_reports` table referenced in PRD-27 addendum exists in the live schema and is queried anywhere (live_schema.md check could confirm).
- Whether a `shift_summary` mode_key is seeded in `lila_guided_modes` table.
- Whether an Edge Function for shift-summary compilation was built later (not in current grep results).
- Git log for last-touching commit.

### Field 6 — Observations (no verdict)

Trigger point `handleRemoteShiftEnd` exists in `src/pages/PermissionHub.tsx:851-861` with the LiLa API call explicitly marked as stub in an in-code comment. PRD-02-repair feature decision file line 116 flags the status as "Stubbed | Trigger point wired, LiLa API call commented as stub." PRD-27 addendum describes the future enhancement surface.

---

## Entry 50 — `LiLa Optimizer mode`

**Registry line:** 50
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| LiLa Optimizer mode | PRD-05 | PRD-05C | ✅ Wired | Phase 23 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row does not name a specific identifier but "LiLa Optimizer mode" implies the `optimizer` mode_key and supporting Edge Function.
- **(b)** WIRING_STATUS.md lists `Optimizer` routing destination as `Stub | PRD-05C not built`.
- **(c)** `claude/ai_patterns.md` identifies Optimizer as one of the four Core LiLa Modes; lists mode_key `optimizer`.
- Identifier: mode_key `optimizer` seeded in `lila_guided_modes` + absence of a `lila-optimizer` Edge Function folder.

### Field 2 — Code presence check

```
Grep command: pattern=`'optimizer'`, path=`supabase/migrations`, output_mode=content
Hits (migrations): 3 lines
Files:
  - supabase\migrations\00000000000007_lila_ai_system.sql:223 — seeds row: ('optimizer', 'LiLa Optimizer', 'sonnet', 'smart_ai', NULL, false, NULL, 'lila_optimizer'),
  - supabase\migrations\00000000000013_lila_schema_remediation.sql:115 — WHERE mode_key = 'optimizer'
  - supabase\migrations\00000000000021_lila_opening_messages.sql:23 — UPDATE opening_messages for mode_key = 'optimizer'
```

```
Grep command: pattern=`'optimizer'`, glob=`*.ts`, output_mode=files_with_matches
Hits: src/hooks/useLila.ts, src/hooks/useNotepad.ts, src/hooks/useSpotlightSearch.ts, tests/lila-ai-system.test.ts, tests/guided-mode-registry.test.ts
```

`src/hooks/useLila.ts` lines 12 & 264 declare `'optimizer'` as part of the mode union type `'general' | 'help' | 'assist' | 'optimizer'`.

```
Grep command: Glob `supabase/functions/lila-optimizer*/**`
Hits: 0 — no dedicated lila-optimizer Edge Function folder.
```

```
Grep command: Glob `src/features/optimizer/**`
Hits: 0 — no dedicated optimizer feature folder.
```

Note: WIRING_STATUS.md RoutingStrip table line says `Optimizer | Notepad | LiLa Optimizer | Stub | PRD-05C not built`.

### Field 3 — Wiring check

**Callers/Importers:** `'optimizer'` mode_key used as TypeScript union-type literal in `useLila.ts`. Edge-function-level implementation: not found by glob on lila-optimizer folder.

**Execution-flow location:** Mixed — mode_key is seeded in migrations (DB layer), declared as union-type in client hook, but no dedicated Edge Function.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** "Optimizer | Notepad | LiLa Optimizer | Stub | PRD-05C not built" — flags as Stub.

**Cross-PRD addendum mentions:** PRD-05C-LiLa-Optimizer.md is the authoritative PRD for the mode.

**PlannedExpansionCard / stub UI:** Not searched for PlannedExpansionCard with this feature key.

**CLAUDE.md convention mention:** Referenced in core LiLa modes; `claude/ai_patterns.md` lists `optimizer` as one of four core modes.

### Field 5 — What was NOT checked

- Whether a non-dedicated `lila-chat` Edge Function branch handles `mode='optimizer'` (would require reading lila-chat/index.ts in full — not done here).
- Whether `optimizer_outputs` table (listed in live_schema.md as non-API-exposed) has write-paths.
- Whether PRD-05C has been fully implemented in a location other than a dedicated Edge Function folder (e.g., inline in lila-chat).
- Git log for most recent touch.
- Contradiction between registry ("Wired") and WIRING_STATUS.md ("Stub | PRD-05C not built") — flagged for founder judgment.

### Field 6 — Observations (no verdict)

Mode_key `optimizer` seeded in migrations 000007, 000013, and 000021 with opening messages, display name, and system_prompt_key. TypeScript type-level support in `src/hooks/useLila.ts`. No dedicated `lila-optimizer` Edge Function folder found. WIRING_STATUS.md Routing destinations table marks Optimizer as "Stub | PRD-05C not built" — which conflicts with registry's "✅ Wired." `optimizer_outputs` and `optimization_patterns` tables are listed in live_schema.md as non-API-exposed.

---

## Entry 52 — `Help/Assist pattern matching (13 FAQs)`

**Registry line:** 52
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Help/Assist pattern matching (13 FAQs) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier

- **(a)** Stub row does not name a specific function; "pattern matching (13 FAQs)" implies a pattern-matching module.
- **(c)** `CLAUDE.md` Convention #56 (line ~219) states: "Help/Assist pattern matching via `help-patterns.ts` (13 FAQ patterns) runs BEFORE AI calls."
  - Source: CLAUDE.md convention #56: "Help/Assist pattern matching via `help-patterns.ts` (13 FAQ patterns) runs BEFORE AI calls. Matched responses insert directly into `lila_messages` with `metadata.source = 'pattern_match'` — zero API cost."
  - Identifier: `help-patterns.ts` module + `matchHelpPattern` exported function.

### Field 2 — Code presence check

```
Grep command: pattern=`HELP_PATTERNS`, path=`src/lib/ai/help-patterns.ts`, output_mode=content
Hits: 2
Files:
  - src\lib\ai\help-patterns.ts:36 (const HELP_PATTERNS: HelpPattern[] = [)
  - src\lib\ai\help-patterns.ts:285 (for (const pattern of HELP_PATTERNS))
```

```
Grep command: pattern=`matchHelpPattern`, output_mode=files_with_matches
Hits: src/lib/ai/help-patterns.ts (export), src/components/lila/LilaDrawer.tsx (import+usage), src/components/lila/LilaModal.tsx
```

`src/components/lila/LilaDrawer.tsx:23,233`:
```
import { matchHelpPattern } from '@/lib/ai/help-patterns'
...
const cannedResponse = matchHelpPattern(messageText)
```

Test file exists: `tests/e2e/features/lila-help-patterns.spec.ts`.

### Field 3 — Wiring check

**Callers/Importers:** LilaDrawer.tsx and LilaModal.tsx import `matchHelpPattern`. The Drawer pre-check at line 233 suggests a pre-AI shortcut consistent with the convention description.

**Execution-flow location:** Client-side TypeScript module + React components.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row for help-patterns.

**Cross-PRD addendum mentions:** Not checked specifically.

**PlannedExpansionCard / stub UI:** Not applicable (not a feature surface).

**CLAUDE.md convention mention:** Convention #56 quoted above; feature-guide-knowledge.ts referenced as the companion.

### Field 5 — What was NOT checked

- Whether the count of 13 FAQ patterns in CLAUDE.md matches the actual length of HELP_PATTERNS array in help-patterns.ts — did not count entries.
- Whether `metadata.source = 'pattern_match'` is actually written on the inserted message (would require reading LilaDrawer.tsx:233 context more fully).
- Git log for most recent touch.

### Field 6 — Observations (no verdict)

Module `src/lib/ai/help-patterns.ts` exists with `HELP_PATTERNS` array and `matchHelpPattern` export. Imported and invoked by `LilaDrawer.tsx` and `LilaModal.tsx`. E2E test `tests/e2e/features/lila-help-patterns.spec.ts` exists. Convention #56 documents the pattern, feature-guide-knowledge.ts is the companion module.

---

## Entry 53 — `Opening messages (core + task_breaker)`

**Registry line:** 53
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Opening messages (core + task_breaker) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier

- **(a)** Stub row implies migration-seeded opening_messages column on lila_guided_modes.
- **(c)** `CLAUDE.md` Convention #61 (line 227): "Opening messages seeded for core modes (help, assist, general, optimizer) and task_breaker modes. Rotate randomly on conversation start."
  - Identifier: `opening_messages` JSONB column on `lila_guided_modes` table + migration `00000000000021_lila_opening_messages.sql`.

### Field 2 — Code presence check

```
Grep command: pattern=`opening_messages`, output_mode=files_with_matches
Hits: 20 files (key migrations + consumers)
Files (relevant):
  - supabase\migrations\00000000000021_lila_opening_messages.sql (seeds)
  - supabase\migrations\00000000000013_lila_schema_remediation.sql
  - supabase\migrations\00000000000009_remediation_schema_batch.sql
  - src\hooks\useLila.ts
  - src\components\lila\LilaDrawer.tsx
  - src\components\lila\LilaModal.tsx
```

First-context window from `supabase/migrations/00000000000021_lila_opening_messages.sql` lines 10-23:

```sql
UPDATE public.lila_guided_modes
  SET opening_messages = '["Hey! I''m LiLa Help — happy to help with anything...", "Hi there!...", "Welcome!..."]'::jsonb
  WHERE mode_key = 'help';

UPDATE public.lila_guided_modes
  SET opening_messages = '["Hi! I''m here to help you get the most out of MyAIM...", ...]'::jsonb
  WHERE mode_key = 'assist';

UPDATE public.lila_guided_modes
  SET opening_messages = '["Hey. What''s on your mind?", ...]'::jsonb
  WHERE mode_key = 'general';

UPDATE public.lila_guided_modes
  SET opening_messages = '["Ready to craft the perfect prompt?...", ...]'::jsonb
  WHERE mode_key = 'optimizer';
```

And lines 29-60 insert task_breaker + task_breaker_image rows with their own `opening_messages` arrays.

### Field 3 — Wiring check

**Callers/Importers:** `src/hooks/useLila.ts`, `LilaDrawer.tsx`, `LilaModal.tsx` reference opening_messages in context of fetched guided modes.

**Execution-flow location:** Seeded via migration (DB layer), consumed by client-side hooks/components.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** Referenced in PRD-05, addenda 05-Planning-Decisions-Addendum.md.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Convention #61 quoted above.

### Field 5 — What was NOT checked

- Whether all four core modes + task_breaker modes have non-null opening_messages in the live DB (live-DB check out of scope).
- Whether random rotation logic exists on the client (brief grep did not surface).
- Git log.

### Field 6 — Observations (no verdict)

Migration `00000000000021_lila_opening_messages.sql` updates opening_messages for the four core mode_keys (help, assist, general, optimizer) AND inserts task_breaker and task_breaker_image modes with their own opening_messages arrays. Convention #61 describes the expected behavior. The `opening_messages` column appears in live_schema.md for `lila_guided_modes`.

---

## Entry 54 — `Context assembly stubs (7 sources)`

**Registry line:** 54
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Context assembly stubs (7 sources) | PRD-05 | PRD-05 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier

- **(a)** Stub row mentions "7 sources" generically.
- **(c)** `CLAUDE.md` Convention #57 (line 221): "Context assembly has 7 stub loaders for future sources (archives, LifeLantern, partner, BookShelf, family vision, personal vision, recent tasks). Each returns empty arrays until its PRD phase is built."
  - Identifier: `context-assembler.ts` or `context-assembly.ts` module with stub loaders.

### Field 2 — Code presence check

```
Grep command: pattern=`context-assembler` / path=supabase/functions/_shared, output_mode=files_with_matches
Hits: supabase/functions/_shared/context-assembler.ts (definition), supabase/functions/_shared/relationship-context.ts (import)
```

```
Grep command: pattern=`assembleContext` in context-assembler.ts
Hits: 1 — line 204 (export async function assembleContext)
```

`supabase/functions/_shared/context-assembler.ts` header lines 1-18 document the three-layer architecture: "Layer 1 — Always loaded: family roster (~200 tokens); Layer 2 — On-demand: archive items, guiding stars, self-knowledge; Layer 3 — Search only: book chunks, journal entries."

```
Grep command: pattern=`STUB.*context` / glob=src/lib/ai/context-assembly.ts
Hits: stubs found at line 654 (STUB: Long conversation summarization), line 685
```

Note: there is BOTH a client-side `src/lib/ai/context-assembly.ts` AND a server-side `supabase/functions/_shared/context-assembler.ts`. The "7 stub loaders" convention describes client-side stubs for future PRD phases; context-assembler.ts is the real assembly function in Edge Functions.

### Field 3 — Wiring check

**Callers/Importers of `assembleContext`:** Imported by multiple Edge Functions — lila-chat and other LiLa functions (per earlier grep hits).

**Execution-flow location:** Edge Function shared library (Deno runtime).

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row for "7 stub loaders."

**Cross-PRD addendum mentions:** Referenced in PRD-05 and PRD-13 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Convention #57 (quoted above).

### Field 5 — What was NOT checked

- Whether all 7 stubs named in convention #57 (archives, LifeLantern, partner, BookShelf, family vision, personal vision, recent tasks) exist as distinct stubs in the code — did not exhaustively enumerate them.
- Whether any of the 7 stubs has been "wired" (returning real data) vs still returning empty arrays.
- Git log.

### Field 6 — Observations (no verdict)

Two related assembly modules exist: `supabase/functions/_shared/context-assembler.ts` (real layered context assembly for Edge Functions) and `src/lib/ai/context-assembly.ts` (client-side, contains multiple STUB comments per line 654 etc.). Convention #57 documents the 7-source stub list. `context-assembler.ts` header documents a 3-layer architecture matching `claude/ai_patterns.md`.

---

## Entry 55 — `Permission + privacy filtering`

**Registry line:** 55
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Permission + privacy filtering | PRD-05 | PRD-05 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier

- **(a)** Stub row implies a privacy/permission filtering mechanism.
- **(c)** `CLAUDE.md` Convention #58 (line 223): "Permission filtering (Step 5) excludes other members' context for non-mom. Privacy Filtered (Step 6) excludes private-visibility items for non-mom. Both auto-activate when `belongsToOtherMember` and `visibility` fields are populated."
- Convention #76 names `is_privacy_filtered` as the hard constraint column.
  - Identifier: `applyPrivacyFilter` and `isPrimaryParent` in `supabase/functions/_shared/privacy-filter.ts`.

### Field 2 — Code presence check

```
Grep command: pattern=`applyPrivacyFilter`, output_mode=files_with_matches
Hits: 21 files (shared module + Edge Function consumers + UI + tests)
Key files:
  - supabase\functions\_shared\privacy-filter.ts (definition)
  - supabase\functions\_shared\context-assembler.ts (imports)
  - supabase\functions\_shared\relationship-context.ts (imports)
  - supabase\functions\bookshelf-study-guide\index.ts
  - src\hooks\useArchives.ts
  - src\pages\archives\ArchivesPage.tsx
  - src\pages\archives\PrivacyFilteredPage.tsx
  - tests/e2e/features/archives.spec.ts
```

First-context window from `supabase/functions/_shared/privacy-filter.ts` lines 1-17:

```ts
/**
 * Role-asymmetric privacy filter for archive_context_items.
 *
 * Convention #76 (CLAUDE.md): `is_privacy_filtered = true` items are NEVER
 * included in non-mom context regardless of any toggle state. Primary parent
 * (mom) sees everything; all other roles are excluded from filtered rows.
 * ...
 */
export async function isPrimaryParent(
  supabase: SupabaseClient,
  memberId: string | null | undefined,
): Promise<boolean> {
```

### Field 3 — Wiring check

**Callers/Importers:** Context-assembler, relationship-context, multiple Edge Functions, Archives UI. Broad surface-level use.

**Execution-flow location:** Shared Edge Function module + client hooks.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row for permission+privacy filtering.

**Cross-PRD addendum mentions:** Referenced in PRD-13 and RECON_DECISIONS_RESOLVED.md.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Conventions #58 and #76 cover this.

### Field 5 — What was NOT checked

- Whether "Step 5" and "Step 6" (terms used in Convention #58) correspond to actual labeled steps in context-assembler.ts — did not read full assembleContext function body.
- Whether `belongsToOtherMember` field is populated consistently across context-source queries.
- Git log.

### Field 6 — Observations (no verdict)

Module `supabase/functions/_shared/privacy-filter.ts` defines `isPrimaryParent` and `applyPrivacyFilter` helpers. Widely imported by Edge Functions and UI hooks. Convention #58 describes the two filter layers; Convention #76 flags is_privacy_filtered as a hard system constraint.

---

## Entry 57 — `Page context passing`

**Registry line:** 57
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Page context passing | PRD-05 | PRD-05 | ✅ Wired | Remediation |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: "Page context passing" — generic.
- **(c)** `CLAUDE.md` Convention #60 (line 225): "Page context passed as `window.location.pathname` when creating conversations. Available in context snapshots for mode auto-routing (future)."
  - Identifier: `page_context` column on `lila_conversations` + `location.pathname` consumer.

### Field 2 — Code presence check

```
Grep command: pattern=`page_context|pageContext`, output_mode=files_with_matches
Hits: 14 files
Key files:
  - supabase/migrations/00000000000007_lila_ai_system.sql (column definition)
  - supabase/functions/lila-chat/index.ts
  - src/components/lila/LilaDrawer.tsx
  - src/components/meetings/MeetingConversationView.tsx
  - src/lib/ai/context-assembly.ts
  - src/lib/ai/system-prompts.ts
  - src/hooks/useLila.ts
```

`src/hooks/useLila.ts`:
- line 20: `page_context: string | null`
- line 269: `page_context?: string` (in conversation-create mutation input)

`src/components/lila/LilaDrawer.tsx:218`: `page_context: location.pathname,`

### Field 3 — Wiring check

**Callers/Importers:** LilaDrawer sets `location.pathname` into `page_context` when creating conversations. MeetingConversationView.tsx also references `page_context`.

**Execution-flow location:** Client components set value; column stored on `lila_conversations` DB row; Edge Functions may read via context_snapshot.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** Referenced in PRD-05 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Convention #60 quoted above — also says "for mode auto-routing (future)" — i.e., consumer side is partial.

### Field 5 — What was NOT checked

- Whether LilaModal and other conversation entry points also pass page_context (LilaDrawer verified; LilaModal and meetings surfaces not individually verified).
- Whether page_context is ever USED beyond being stored (the convention explicitly says "for mode auto-routing (future)").
- Git log.

### Field 6 — Observations (no verdict)

`page_context` column defined in `lila_conversations` migration 000007. Set from `location.pathname` in `LilaDrawer.tsx:218`. Referenced in `useLila.ts` type and mutation input. Convention #60 notes the future-consumer half (mode auto-routing) is not yet wired.

---

## Entry 60 — `Context sources (GuidingStars, etc.)`

**Registry line:** 60
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Context sources (GuidingStars, etc.) | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row names "GuidingStars" as an example; sources plural.
- **(c)** Convention #74 names the three-tier toggle system and the context source tables: `self_knowledge`, `guiding_stars`, `best_intentions`, archives.
- **(d)** `claude/ai_patterns.md` "Context Sources" section lists Guiding Stars, Best Intentions, InnerWorkings (self_knowledge), Archives, Journal entries, LifeLantern assessments, vision statements, relationship notes, faith preferences, BookShelf.
- Identifier: Layer-2 loader blocks inside `context-assembler.ts` for `guiding_stars`, `best_intentions`, `self_knowledge`, `archive_context_items`.

### Field 2 — Code presence check

```
Grep command: pattern=`guiding_stars|best_intentions|self_knowledge`, path=supabase/functions/_shared/context-assembler.ts, output_mode=content
Hits: 10+ lines
Files:
  - supabase/functions/_shared/context-assembler.ts:92, 100, 136, 272-326
```

Quoted:
```
 92:    categories: ['guiding_stars', 'best_intentions'],
100:    categories: ['Personality & Traits', 'self_knowledge'],
272:  const loadGuidingStars = detectedTopics.has('guiding_stars') ||
278:      .from('guiding_stars')
303:  const loadSelfKnowledge = detectedTopics.has('self_knowledge') ||
308:      .from('self_knowledge')
```

### Field 3 — Wiring check

**Callers/Importers:** assembleContext is used by multiple LiLa Edge Functions.

**Execution-flow location:** Edge Function shared module.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** GuidingStars/BestIntentions routes marked Wired in RoutingStrip table.

**Cross-PRD addendum mentions:** PRD-13 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Conventions #74, #75.

### Field 5 — What was NOT checked

- Whether every context source listed in ai_patterns.md (LifeLantern, vision statements, relationship notes, faith preferences, BookShelf) has a loader or is still among the "7 stub loaders" from Convention #57.
- Whether Layer 2 actually runs topic-matching correctly (behavioral verification).
- Git log.

### Field 6 — Observations (no verdict)

`context-assembler.ts` contains Layer-2 loaders for `guiding_stars`, `best_intentions`, `self_knowledge`, and archive context items (topics and name-detection branches). Convention #74 describes the three-tier toggle system. ai_patterns.md lists the full context-source taxonomy, some of which (LifeLantern, vision statements) remain among the 7 stub loaders per Convention #57.

---

## Entry 61 — `Review & Route pipeline`

**Registry line:** 61
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Review & Route pipeline | PRD-05 | PRD-08 | ✅ Wired | Phase 09 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row mentions "Review & Route pipeline" — term aligns with CLAUDE.md Convention #22 ("Review & Route: Universal reusable extraction component defined in PRD-08").
- **(c)** Convention #22 line ~138: "Review & Route: Universal reusable extraction component defined in PRD-08. Other features wire in with their content as input. AI extraction → card-by-card review → per-item routing."
- Identifier: `NotepadReviewRoute` component + Smart Notepad Convention #20.

### Field 2 — Code presence check

```
Grep command: pattern=`NotepadReviewRoute`, output_mode=content
Hits: 2 locations
Files:
  - src\components\notepad\NotepadReviewRoute.tsx:18 (interface), :25 (export function)
```

WIRING_STATUS.md RoutingStrip table multiple rows show "Wired" for Review & Route destinations (Tasks, List, Journal, Guiding Stars, Best Intentions, Victory, Ideas, Backburner, Note).

### Field 3 — Wiring check

**Callers/Importers:** Imported by `src/components/notepad/NotepadDrawer.tsx` and `src/components/notepad/NotepadContext.tsx`. Referenced in claude/feature-decisions/PRD-08-decisions.md.

**Execution-flow location:** React component.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** RoutingStrip destinations table marks multiple "Review & Route" destinations as Wired.

**Cross-PRD addendum mentions:** PRD-08 is authoritative; claude/feature-decisions/PRD-08-decisions.md mentioned in grep.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Conventions #20, #22.

### Field 5 — What was NOT checked

- Whether "Review & Route" also has a cross-feature surface used beyond Notepad (e.g., from meetings, LiLa messages). Convention #22 says "Other features wire in with their content as input"; cross-feature usage not verified.
- Git log.

### Field 6 — Observations (no verdict)

`NotepadReviewRoute` component defined in `src/components/notepad/NotepadReviewRoute.tsx` and imported by the Notepad Drawer + NotepadContext. Convention #22 documents it as a universal reusable extraction component.

---

## Entry 62 — `Long conversation summarization`

**Registry line:** 62
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Long conversation summarization | PRD-05 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: abstract capability.
- **(c)** No explicit convention naming an implementation identifier.
- **(d.5)** `src/lib/ai/context-assembly.ts` contains an explicit STUB block at line 654 describing the planned implementation.
  - Source: src/lib/ai/context-assembly.ts:654 — "STUB: Long conversation summarization (Post-MVP)"
  - Identifier: stub function `loadConversationHistoryForContext` at line 682 (stub returning `[]`).

### Field 2 — Code presence check

```
Grep command: pattern=`long.*conversation|conversation.summary|summarize.conversation`, path=src/lib/ai/context-assembly.ts, output_mode=content, -i
Hits: 2
Files:
  - src\lib\ai\context-assembly.ts:654 (// STUB: Long conversation summarization (Post-MVP))
  - src\lib\ai\context-assembly.ts:685 (// STUB: Long conversation summarization — PRD-05 Post-MVP)
```

First-context window from `src/lib/ai/context-assembly.ts` lines 653-690:

```ts
// STUB: Long conversation summarization (Post-MVP)
//
// When a conversation exceeds 50 messages, older messages should be summarized
// to keep the context window manageable and reduce token costs. For now, the
// Edge Function (lila-chat) loads only the last 20 messages per turn.
//
// Future implementation plan:
//   1. Count messages in the conversation before assembling the prompt.
//   2. If message count > 50, take messages[0..N-20] ...
//   5. Inject the cached summary at the top of the messages array as a
//      synthetic "system" message before the 20 most-recent turns.
...

export async function loadConversationHistoryForContext(
  _conversationId: string,
): Promise<Array<{ role: string; content: string }>> {
  // STUB: Long conversation summarization — PRD-05 Post-MVP
  return []
}
```

Also seen: STUB_REGISTRY.md entry 82 lists a similar "LiLa conversation summary (long convos)" duplicate with same Post-MVP status.

### Field 3 — Wiring check

**Callers/Importers:** `loadConversationHistoryForContext` — not called from any grep hit in this investigation.

**Execution-flow location:** Client-side documentation stub; returns empty array. The actual last-20-messages logic lives in lila-chat Edge Function per the comment.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** Referenced in PRD-05 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** No explicit convention.

### Field 5 — What was NOT checked

- Whether `lila_conversations.rolling_summary TEXT` column exists as hinted in the stub comment (would require live_schema.md/migration check).
- Whether any Edge Function implements the 20-message limit in lila-chat itself.
- Whether entry 82 (LiLa conversation summary (long convos)) is a duplicate of this entry — both are Post-MVP, both reference the same capability. Flagged.
- Git log.

### Field 6 — Observations (no verdict)

`src/lib/ai/context-assembly.ts` contains an explicit stub block at lines 654-690 describing the Post-MVP plan and an export `loadConversationHistoryForContext` that returns `[]`. Entry 82 in STUB_REGISTRY.md appears to cover the same capability and is also Post-MVP.

---

## Entry 63 — `Mode auto-routing mid-conversation`

**Registry line:** 63
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Mode auto-routing mid-conversation | PRD-05 | — | ⏳ Unwired (MVP) | Phase 07+ |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: abstract capability.
- **(c)** `CLAUDE.md` Convention #60 (line 225): "Page context ... Available in context snapshots for mode auto-routing (future)."
- `claude/ai_patterns.md` line 21: "Mode switching: LiLa detects domain shifts mid-conversation and offers to switch modes."
- Identifier: CAPABILITY-ONLY — no named function. Related: `lila-mode-switch` custom event in ToolLauncherProvider.tsx.

### Field 2 — Code presence check

```
Grep command: pattern=`auto.rout|mode.switch`, -i, path=src/components/lila/ToolLauncherProvider.tsx
Hits: 3
Files:
  - src\components\lila\ToolLauncherProvider.tsx:64 (// Listen for mode-switch events from ToolConversationModal)
  - src\components\lila\ToolLauncherProvider.tsx:73-74 (window.addEventListener('lila-mode-switch', handleModeSwitch))
```

This is USER-triggered mode switch (from ToolConversationModal), not AUTO-routing based on conversation content.

### Field 3 — Wiring check

**Callers/Importers:** ToolLauncherProvider.tsx handles `lila-mode-switch` event. The auto-detection that identifies a domain shift is not verified present.

**Execution-flow location:** React provider with window event listener.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** Not checked specifically.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Convention #60 mentions auto-routing as "future."

### Field 5 — What was NOT checked

- Whether AUTO-detection logic (mid-conversation domain shift detection) exists anywhere — only user-triggered mode switch was surfaced.
- Whether `mode_auto_routing` is a feature key somewhere in feature_key_registry.
- Git log.

### Field 6 — Observations (no verdict)

`lila-mode-switch` custom event handled in ToolLauncherProvider.tsx handles user-triggered mode switches from ToolConversationModal. Convention #60 explicitly marks mid-conversation auto-routing as "future." No automatic domain-shift detection found in this investigation.

---

## Entry 64 — `Archive context loading`

**Registry line:** 64
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Archive context loading | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row mentions loading Archives into LiLa context.
- **(c)** `CLAUDE.md` Convention #74 (Three-tier toggle system) and #79 (Name detection in context assembly).
- **(d.5)** Opening context-assembler.ts, the `loadFilteredArchive` function reference is named.
- Identifier: `loadFilteredArchive` + Layer-2 archive-loading branch in `supabase/functions/_shared/context-assembler.ts`.

### Field 2 — Code presence check

```
Grep command: pattern=`archive_context_items|archiveContext|loadArchive`, path=supabase/functions/_shared/context-assembler.ts, output_mode=content
Hits:
  - :334 (const loadArchiveForUser = detectedTopics.size > 0)
  - :336 (...(loadArchiveForUser ? [memberId] : []))
  - :341 (const archiveContext = await loadFilteredArchive(...))
  - :349 (if (archiveContext.items.length > 0))
  - :352 (for (const item of archiveContext.items))
  - :368 (reason: archiveContext.reason)
  - :616 (.from('archive_context_items'))
```

### Field 3 — Wiring check

**Callers/Importers:** Referenced from the main `assembleContext` function.

**Execution-flow location:** Edge Function shared module.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-13 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Conventions #74-#79 (Archives & Context).

### Field 5 — What was NOT checked

- Whether `loadFilteredArchive` also respects the three-tier toggles — did not read full function body.
- Git log.

### Field 6 — Observations (no verdict)

Archive context loading is implemented in `supabase/functions/_shared/context-assembler.ts` with conditional archive loading (line 334), delegation to `loadFilteredArchive` (line 341), and direct queries against `archive_context_items` (line 616). Conventions #74-#79 document the expected behavior.

---

## Entry 67 — `Victory detection/recording (AIR)`

**Registry line:** 67
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Victory detection/recording | PRD-05 | PRD-11 (AIR) | ✅ Wired | Phase 12 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: "Victory detection/recording" + "(AIR)" referring to Automatic Intelligent Routing.
- **(c)** `CLAUDE.md` architecture section mentions: "Automatic Intelligent Routing (AIR): Silent auto-routing of victories from task completions, intention iterations, widget milestones."
- `claude/ai_patterns.md` "Automatic Intelligent Routing (AIR)" section lists three source-event triggers with victory source values: `task_completion`, `best_intention_iteration`, `widget_milestone`.
- Identifier: capability-only at the feature level; specific implementation sites include `useVictories` hook, `victories` table writes, and Step 4 of `useTaskCompletion.ts`.

### Field 2 — Code presence check

```
Grep command: pattern=`.from\('victories'\)`, glob=src/**, output_mode=files_with_matches
Hits: 8 files
Files:
  - src\pages\Lists.tsx
  - src\hooks\useMindSweep.ts
  - src\lib\rhythm\commitMindSweepLite.ts
  - src\components\rhythms\periodic\MonthlyReviewCard.tsx
  - src\hooks\useVictories.ts (5 hits — lines 61,104,133,158,194)
  - src\hooks\useNotepad.ts
  - src\components\notepad\NotepadReviewRoute.tsx
  - src\hooks\useSpotlightSearch.ts
```

However, `src/components/tasks/useTaskCompletion.ts:108` contains:
```ts
// Step 4: Create victory if victory_flagged (stub — PRD-11)
// STUB: wires to PRD-11 Victory Recorder
// if (task.victory_flagged) { create_victory({ source: 'task_completion', source_reference_id: task.id }) }
```

This is a commented-out stub at the task-completion hook.

### Field 3 — Wiring check

**Callers/Importers:** `useVictories` is the centralized hook for victory writes. Multiple consumers (MindSweep, Notepad, Lists, Rhythms periodic cards).

**Execution-flow location:** Mixed — direct inserts from useVictories across multiple UI features. However, the auto-victory path on task completion has a commented-out stub at useTaskCompletion.ts:108.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** List Victory Mode section in WIRING_STATUS.md describes list-level and per-item victory creation — marked Wired.

**Cross-PRD addendum mentions:** Not individually checked.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** AIR pattern described in architecture section and ai_patterns.md.

### Field 5 — What was NOT checked

- Whether `best_intention_iteration` → victory auto-path is wired (registry entry 91 covers this separately).
- Whether `widget_milestone` → victory auto-path is wired (registry entry 116 covers this separately).
- Whether the commented stub at useTaskCompletion.ts:108 means auto-victory-from-task-completion is actually unwired in that specific hook, despite the Lists.tsx and rhythm paths writing victories directly.
- Git log.

### Field 6 — Observations (no verdict)

`useVictories` hook writes to `victories` table from 5 different mutation sites. 8 files write directly to `victories`. However, `src/components/tasks/useTaskCompletion.ts:108` has an active stub comment ("Step 4: Create victory if victory_flagged (stub — PRD-11)") with the auto-victory call line commented out. Registry entry 117 (Auto-victory from task completions) is listed separately as Wired — possible duplication or cross-reference with this entry.

---

## Entry 68 — `Context Learning write-back`

**Registry line:** 68
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Context Learning write-back | PRD-05 | PRD-13 | ✅ Wired | Phase 13 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: context learning write-back feature.
- **(c)** Convention #75 ("Checked somewhere, checked everywhere"): "Toggling `is_included_in_ai` on an aggregated item writes BACK to the source table."
- `context_learning_dismissals` table listed in live_schema.md (0 rows).
- Identifier: `ContextLearningSaveDialog` component + `context_learning_dismissals` table.

### Field 2 — Code presence check

```
Grep command: pattern=`context_learning_dismissals`, output_mode=files_with_matches
Hits: 35 files (including all doc/spec copies + one active component)
Key files:
  - src\components\archives\ContextLearningSaveDialog.tsx (active component)
  - supabase\migrations\00000000100035_prd13_archives_context.sql (table creation)
  - claude\live_schema.md (0 rows)
```

`src/components/archives/ContextLearningSaveDialog.tsx:154`:
```ts
await supabase.from('context_learning_dismissals').insert({
```

### Field 3 — Wiring check

**Callers/Importers:** ContextLearningSaveDialog exports; consumers not individually grepped here.

**Execution-flow location:** React component that writes to `context_learning_dismissals`.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-13 addenda reference context learning.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Conventions #74 and #75 (three-tier toggle system + checked-everywhere pattern).

### Field 5 — What was NOT checked

- Whether the write-BACK (Convention #75: toggle on aggregated item writes to SOURCE table) is the same capability as the dismissals flow, or a distinct feature. Convention #75 writes to `self_knowledge`/source tables, not to `context_learning_dismissals`.
- Whether the dismissals surface is actually reached by real conversations (row count is 0 in live_schema.md).
- Git log.

### Field 6 — Observations (no verdict)

`ContextLearningSaveDialog` component writes to `context_learning_dismissals` (migration 100035 creates the table). Conventions #74-#75 describe the three-tier toggle system and write-back semantics. The table has 0 rows per live_schema.md. The stub label "Context Learning write-back" may refer either to the dismissals dialog or to Convention #75's write-back pattern — potential ambiguity in scope.

---

## Entry 69 — `Mediator/Peacemaker mode`

**Registry line:** 69
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Mediator/Peacemaker mode | PRD-05 | PRD-34 (mediator) | ✅ Wired | Phase 35 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row names "mediator" explicitly as PRD-34 Wired By.
- **(c)** `CLAUDE.md` Convention #95: "Mediator supersedes `relationship_mediation` (PRD-19). Mode key `relationship_mediation` was never created."
- `claude/ai_patterns.md` ThoughtSift section lists `mediator` as one of 5 tools with Sonnet model.
- Identifier: Edge Function `lila-mediator` + mode_key `mediator` in lila_guided_modes.

### Field 2 — Code presence check

```
Grep command: Glob `supabase/functions/lila-mediator/**`
Hits: 1 file — supabase\functions\lila-mediator\index.ts (Edge Function exists)
```

```
Grep command: pattern=`mediator`, path=supabase/migrations/00000000100049_prd34_thoughtsift_tables.sql, -i
Hits:
  - :278 (-- Mediator: fix context_sources, available_to_roles, add container_preference)
  - :288 (WHERE mode_key = 'mediator')
  - :726 (-- Mediator)
  - :736 (Display name: 'Mediator')
  - :737 (Description: "Whether it is a marriage argument, a teenager slamming doors...")
```

### Field 3 — Wiring check

**Callers/Importers:** Not checked (would require reading ToolLauncher + mediator consumers).

**Execution-flow location:** Supabase Edge Function + DB-seeded mode row.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row for mediator.

**Cross-PRD addendum mentions:** PRD-34 addenda (Cross-PRD-Impact-Addendum).

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Conventions #92, #95, #96 (ThoughtSift).

### Field 5 — What was NOT checked

- Whether the mediator's "safety_triggered" flag logic (Convention #96) is actually implemented inside lila-mediator/index.ts — did not read function body.
- Whether 8 context modes exist for mediator as documented in ai_patterns.md.
- Git log.

### Field 6 — Observations (no verdict)

Edge Function `supabase/functions/lila-mediator/index.ts` exists. Migration `00000000100049_prd34_thoughtsift_tables.sql` seeds `mediator` mode in lila_guided_modes with display name, description, and config. Convention #95 confirms mediator is the authoritative implementation that supersedes relationship_mediation.

---

## Entry 70 — `Decision Guide mode`

**Registry line:** 70
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Decision Guide mode | PRD-05 | PRD-34 (decision_guide) | ✅ Wired | Phase 35 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row names `decision_guide`.
- **(c)** Convention #103: "Decision Guide: 15 named frameworks in `decision_frameworks` table."
- Identifier: Edge Function `lila-decision-guide` + `decision_frameworks` table (live_schema.md: 15 rows).

### Field 2 — Code presence check

```
Grep command: Glob `supabase/functions/lila-decision-guide/**`
Hits: 1 file — supabase\functions\lila-decision-guide\index.ts
```

`decision_frameworks` table in live_schema.md: 15 rows, columns: id, framework_key, display_name, description, best_for, system_prompt_addition, sort_order, is_active, created_at.

### Field 3 — Wiring check

**Callers/Importers:** Not checked.

**Execution-flow location:** Supabase Edge Function + seeded DB table.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-34 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Convention #103.

### Field 5 — What was NOT checked

- Whether the "Coin flip insight" interjection (Convention #103) is implemented in lila-decision-guide's body.
- Whether 15 rows in `decision_frameworks` match the 15 convention-named frameworks.
- Git log.

### Field 6 — Observations (no verdict)

Edge Function `supabase/functions/lila-decision-guide/index.ts` exists. `decision_frameworks` table has 15 rows per live_schema.md. Convention #103 documents the 15-framework specification.

---

## Entry 71 — `Fun Translator mode`

**Registry line:** 71
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Fun Translator mode | PRD-05 | PRD-34 (translator) | ✅ Wired | Phase 35 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row names `translator`.
- **(c)** Convention #94: "Translator uses Haiku, is single-turn. Saves to `lila_messages` for history but does not use conversation continuity."
- Identifier: Edge Function `lila-translator`.

### Field 2 — Code presence check

```
Grep command: Glob `supabase/functions/lila-translator/**`
Hits: 1 file — supabase\functions\lila-translator\index.ts
```

### Field 3 — Wiring check

**Callers/Importers:** Not checked.

**Execution-flow location:** Supabase Edge Function.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-34 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Convention #94; ai_patterns.md lists translator as Haiku single-turn.

### Field 5 — What was NOT checked

- Whether Haiku model is actually used in the Edge Function body.
- Whether the single-turn behavior is enforced.
- Git log.

### Field 6 — Observations (no verdict)

Edge Function `supabase/functions/lila-translator/index.ts` exists. Convention #94 and ai_patterns.md document the expected Haiku single-turn behavior.

---

## Entry 72 — `Teen Lite Optimizer`

**Registry line:** 72
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Teen Lite Optimizer | PRD-05C | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: "Teen Lite Optimizer" as Post-MVP.
- **(c)** No convention names a specific identifier.
- **(d)** `prds/personal-growth/PRD-05C-LiLa-Optimizer.md` line 509, 519, 522, 791, 846 references "Teen Lite Optimizer" as a future separate tool.
- Identifier: CAPABILITY-ONLY — no code identifier; marked as future separate PRD.

### Field 2 — Code presence check

skipped — no identifier to grep for.

### Field 3 — Wiring check

skipped — no code presence.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No mention.

**Cross-PRD addendum mentions:** PRD-05C-LiLa-Optimizer.md line 791 names "Teen Lite Optimizer — Homework-focused prompt crafting for teens | Future teen tools PRD."

**PlannedExpansionCard / stub UI:** Not searched (capability is fully deferred).

**CLAUDE.md convention mention:** No convention.

### Field 5 — What was NOT checked

- Whether any feature_key for teen-lite-optimizer exists in feature_key_registry (would require live-DB query).
- Semantic-search question I'd ask if mgrep were approved: "Is there any code surface where a teen-oriented prompt-crafting UI has been partially implemented or stubbed?"

### Field 6 — Observations (no verdict)

Capability-only entry; evidence-by-grep not applicable. Flagged for founder-judgment bucket. PRD-05C authoritative reference marks Teen Lite Optimizer as "Future teen tools PRD."

---

## Entry 73 — `Homework Checker`

**Registry line:** 73
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Homework Checker | PRD-05 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: "Homework Checker" Post-MVP.
- **(c)** No convention names a specific identifier.
- **(d)** PRD-05 line 567: "...The Homework Checker tool (future) can offer improvement suggestions and explain *why*..."; line 846: "Homework Checker | Upload/image homework review tool | Future teen tools PRD".
- Identifier: CAPABILITY-ONLY — no code identifier.

### Field 2 — Code presence check

skipped — no identifier to grep for.

### Field 3 — Wiring check

skipped — no code presence.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No mention.

**Cross-PRD addendum mentions:** PRD-05 references future. No dedicated addendum.

**PlannedExpansionCard / stub UI:** Not searched.

**CLAUDE.md convention mention:** No convention.

### Field 5 — What was NOT checked

- Semantic question I'd ask if mgrep were approved: "Is there a GuidedHomeworkHelp or similar component that partially implements the Homework Checker capability?"

### Field 6 — Observations (no verdict)

Capability-only entry; evidence-by-grep not applicable. Flagged for founder-judgment bucket. PRD-05 references the tool as "future teen tools PRD."

---

## Entry 76 — `Relationship tools person-context`

**Registry line:** 76
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Relationship tools person-context | PRD-05 | PRD-21 | ✅ Wired | Phase 24 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: context loader for relationship tools.
- **(c)** `claude/ai_patterns.md` Per-Tool Overrides table row: "Cyrano | Partner always included | Topic matching filters depth" and entries for Higgins Say/Navigate and Love Language tools.
- **(d.5)** `supabase/functions/_shared/relationship-context.ts` lines 1-8: "Shared relationship context loader for PRD-21 communication tools. Used by: lila-cyrano, lila-higgins-say, lila-higgins-navigate, lila-quality-time, lila-gifts, lila-observe-serve, lila-words-affirmation, lila-gratitude."
- Identifier: `supabase/functions/_shared/relationship-context.ts` + exported types like `PersonContext`.

### Field 2 — Code presence check

```
Grep command: pattern=`relationship-context|relationship_context|loadPartnerContext`, output_mode=files_with_matches, -i
Hits: 19 files
Key files:
  - supabase\functions\_shared\relationship-context.ts (definition)
  - supabase\functions\lila-higgins-say\index.ts (consumer)
  - supabase\functions\lila-higgins-navigate\index.ts
  - supabase\functions\lila-quality-time\index.ts
  - supabase\functions\lila-gifts\index.ts
  - supabase\functions\lila-observe-serve\index.ts
  - supabase\functions\lila-words-affirmation\index.ts
  - supabase\functions\lila-mediator\index.ts
  - supabase\functions\lila-perspective-shifter\index.ts
  - supabase\functions\lila-gratitude\index.ts
  - supabase\functions\lila-cyrano\index.ts
  - src\lib\ai\context-assembly.ts
  - claude\feature-decisions\PRD-21-Communication-Relationship-Tools.md
```

First-context window from `supabase/functions/_shared/relationship-context.ts` lines 1-13:

```ts
// Shared relationship context loader for PRD-21 communication tools
// Used by: lila-cyrano, lila-higgins-say, lila-higgins-navigate,
//          lila-quality-time, lila-gifts, lila-observe-serve,
//          lila-words-affirmation, lila-gratitude

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { detectTopics } from './context-assembler.ts'
import { applyPrivacyFilter } from './privacy-filter.ts'
```

### Field 3 — Wiring check

**Callers/Importers:** 11 Edge Functions consume this shared module (per header comment + grep).

**Execution-flow location:** Shared Edge Function module.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-21 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** ai_patterns.md Per-Tool Overrides table covers the behavior.

### Field 5 — What was NOT checked

- Whether AUDIT_REPORT_v1.md Phase 0.26 Session 3 decisions around `_requestingMemberId` parameter are fully wired into all consumers.
- Git log.

### Field 6 — Observations (no verdict)

Shared module `supabase/functions/_shared/relationship-context.ts` defines the relationship context loader with `PersonContext` interface. Module header lists 8 consumer Edge Functions. Grep confirms 11 files reference the shared module. ai_patterns.md Per-Tool Overrides table describes per-tool context behavior.

---

<!-- PROGRESS MARKER: completed entries 25-76 (21 entries), moving to entry 82 at 2026-04-19T00:00:00Z -->

## Entry 82 — `LiLa conversation summary (long convos)`

**Registry line:** 82
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| LiLa conversation summary (long convos) | PRD-05 (Phase 06) | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: post-MVP long-conversation summary.
- This entry appears to be a duplicate of entry 62 ("Long conversation summarization"). Same PRD (PRD-05), same Post-MVP status, same capability.
- Identifier (same as entry 62): `loadConversationHistoryForContext` stub in `src/lib/ai/context-assembly.ts:682` + `STUB` block at line 654.

### Field 2 — Code presence check

Same grep as entry 62:
```
Grep command: pattern=`long.*conversation|summarize.conversation`, -i, path=src/lib/ai/context-assembly.ts
Hits: 2 (lines 654, 685)
```

First-context quoted in entry 62. See entry 62 Field 2 for the stub block.

### Field 3 — Wiring check

See entry 62. No callers of `loadConversationHistoryForContext`.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-05 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** No explicit convention.

### Field 5 — What was NOT checked

- Confirmation that entry 62 and entry 82 are duplicates or genuinely distinct. Both cite PRD-05, Post-MVP, same capability description — appears to be the same concept registered twice. Flagged for synthesis reconciliation.
- Git log.

### Field 6 — Observations (no verdict)

Registry line 82 describes the same capability as entry 62 (long conversation summarization). Both are Post-MVP under PRD-05. The single implementation point is the stub block in `src/lib/ai/context-assembly.ts:654-690`. Possible duplicate registry entry flagged for founder/synthesis review.

---

## Entry 90 — `Morning/Evening rhythm integration`

**Registry line:** 90
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Morning/Evening rhythm integration | PRD-06 | PRD-18 | ✅ Wired | Phase 19 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: rhythm integration. Created-by PRD-06 (Guiding Stars / Best Intentions), Wired-by PRD-18 (Rhythms).
- **(c)** Conventions #168-#191 cover Rhythms Phase B/C/D.
- **(d.5)** `src/components/rhythms/sections/SectionRendererSwitch.tsx:110` switches on `'best_intentions_focus'` case rendering `<BestIntentionsFocusSection>`.
- Identifier: `BestIntentionsFocusSection` component + `best_intentions_focus` section type in `task_templates`/rhythm_configs.

### Field 2 — Code presence check

```
Grep command: pattern=`BestIntentionsFocusSection`, output_mode=files_with_matches
Hits: 15 files
Key files:
  - src\components\rhythms\sections\BestIntentionsFocusSection.tsx (component)
  - src\components\rhythms\sections\SectionRendererSwitch.tsx:110 (dispatch)
  - supabase\migrations\00000000100103_rhythms_foundation.sql
  - supabase\migrations\00000000100110_rhythms_phase_b.sql
  - src\types\rhythms.ts (section type)
```

Also confirmed: `ClosingThoughtSection.tsx` exists (evening rotation of Guiding Stars per Convention #172).

### Field 3 — Wiring check

**Callers/Importers:** `SectionRendererSwitch.tsx` is the dispatcher.

**Execution-flow location:** React components rendered by rhythm modal.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row for "Morning/Evening rhythm integration."

**Cross-PRD addendum mentions:** PRD-18 addenda (Cross-PRD-Impact-Addendum.md).

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Conventions #168-#191 cover Rhythms.

### Field 5 — What was NOT checked

- Whether all rhythm section types that integrate Guiding Stars / Best Intentions are wired (only `best_intentions_focus` and `closing_thought` confirmed).
- Git log.

### Field 6 — Observations (no verdict)

`BestIntentionsFocusSection` component and `ClosingThoughtSection` component both exist and are dispatched by `SectionRendererSwitch`. Rhythms phase B/C/D conventions document the Rhythms surfaces that integrate Personal Growth features.

---

## Entry 91 — `Victory Recorder logging from intentions (AIR)`

**Registry line:** 91
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Victory Recorder logging from intentions | PRD-06 | PRD-11 (AIR) | ✅ Wired | Phase 12 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row describes auto-victory from intention iterations.
- **(c)** `claude/ai_patterns.md` AIR section: source event `best_intention_iteration` → victory source value same.
- Identifier: `useLogIntentionIteration` mutation in `src/hooks/useBestIntentions.ts` + any auto-victory callback.

### Field 2 — Code presence check

```
Grep command: pattern=`intention_iteration`, path=src/hooks/useBestIntentions.ts, output_mode=content
Hits: 7 lines
Key lines:
  - :421 (.from('intention_iterations').insert({...}))
  - :444 (source_table: 'intention_iterations' in activity_log_entries)
```

`src/hooks/useBestIntentions.ts:415-462` inserts into `intention_iterations` and writes an `activity_log_entries` row with event_type `intention_iterated` — but DOES NOT insert a victory row within the same mutation body.

Meanwhile, registry entry 101 ("Victory Recorder daily intention summary — intention_iterations consumed by Victory Recorder") is `⏳ Unwired (MVP)`.

`claude/ai_patterns.md` AIR table lists `best_intention_iteration` as a source event, with victory source value `best_intention_iteration`.

### Field 3 — Wiring check

**Callers/Importers:** `useLogIntentionIteration` called from intention-card UI (per grep — not checked here).

**Execution-flow location:** React hook. The activity_log_entries row is enriched "for victory scan" but no scan code found in this investigation.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row for AIR.

**Cross-PRD addendum mentions:** PRD-06 and PRD-11 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Architecture section mentions AIR with three source triggers.

### Field 5 — What was NOT checked

- Whether a DB trigger or Edge Function scans `activity_log_entries` for `intention_iterated` events and auto-creates victories — not grepped.
- Whether PRD-11 daily-intention summary (entry 101) is the actual AIR implementation, making entry 91 implicitly dependent on entry 101 (which is Unwired).
- Git log.

### Field 6 — Observations (no verdict)

`intention_iterations` insert path is wired and enriched with activity-log metadata "for victory scan." However, no direct auto-victory creation found inside `useLogIntentionIteration`. Registry entry 101 ("daily intention summary" — Unwired MVP) covers the consumer side. AIR pattern documented in ai_patterns.md.

---

## Entry 92 — `InnerWorkings context in LiLa`

**Registry line:** 92
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| InnerWorkings context in LiLa | PRD-07 | PRD-13 | ✅ Wired | Phase 13 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: InnerWorkings (self_knowledge) table loaded into LiLa context.
- **(c)** Convention #74 three-tier toggle covers self_knowledge.
- **(d.5)** context-assembler.ts Layer-2 loader loads `self_knowledge`.
- Identifier: `loadSelfKnowledge` branch in `supabase/functions/_shared/context-assembler.ts:303+` + query `.from('self_knowledge')` at line 308.

### Field 2 — Code presence check

```
Grep command: pattern=`self_knowledge`, path=supabase/functions/_shared/context-assembler.ts, output_mode=content
Hits:
  - :100 (categories: ['Personality & Traits', 'self_knowledge'])
  - :303 (const loadSelfKnowledge = detectedTopics.has('self_knowledge') || ...)
  - :308 (.from('self_knowledge'))
  - :324 (source: 'self_knowledge' in loaded sources metadata)
```

### Field 3 — Wiring check

**Callers/Importers:** `assembleContext` is the consumer.

**Execution-flow location:** Edge Function shared module.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-13 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Conventions #74-#79.

### Field 5 — What was NOT checked

- Whether `loadSelfKnowledge` honors the three-tier toggle system.
- Git log.

### Field 6 — Observations (no verdict)

context-assembler.ts includes a Layer-2 `loadSelfKnowledge` branch that queries the `self_knowledge` table when topic or name detection triggers. Conventions #74-#79 document the three-tier toggle behavior.

---

## Entry 93 — `LiLa self-discovery guided mode`

**Registry line:** 93
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| LiLa self-discovery guided mode | PRD-07 | PRD-07 | ✅ Wired | Phase 08 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: `self_discovery` mode.
- Identifier: mode_key `self_discovery` in `lila_guided_modes`, seeded by migration 000007.

### Field 2 — Code presence check

```
Grep command: pattern=`'self_discovery'`, glob=supabase/migrations/*.sql, output_mode=content
Hits:
  - 00000000000007_lila_ai_system.sql:238 ('self_discovery', 'Self-Discovery', 'sonnet', NULL, '{"self_knowledge"}', false, NULL, 'innerworkings_discovery')
  - 00000000000013_lila_schema_remediation.sql:129 (WHERE mode_key IN ('craft_with_lila','self_discovery','life_lantern','family_vision_quest') AND parent_mode IS NULL)
```

```
Grep command: pattern=`self_discovery`, output_mode=files_with_matches (15 files)
Includes: src/config/feature_guide_registry.ts, supabase/functions/mindsweep-sort/index.ts, src/lib/ai/context-assembly.ts, src/data/lila-assist-context.ts
```

### Field 3 — Wiring check

**Callers/Importers:** Referenced in feature_guide_registry, mindsweep-sort (maps to this mode?), context-assembly client stub, lila-assist-context.

**Execution-flow location:** Seeded DB row + consumers in multiple places.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-07 addenda.

**PlannedExpansionCard / stub UI:** Not checked.

**CLAUDE.md convention mention:** Listed among guided modes in ai_patterns.md.

### Field 5 — What was NOT checked

- Whether the Discover with LiLa button on InnerWorkings page (entry 105) actually opens self_discovery conversation or just shows "Coming soon" toast (see entry 105 — it shows a toast).
- Whether `innerworkings_discovery` feature key is gated correctly.
- Git log.

### Field 6 — Observations (no verdict)

Mode_key `self_discovery` is seeded in migration 000007 with model tier `sonnet`, context sources `{self_knowledge}`, and system_prompt_key `innerworkings_discovery`. Entry 105 records that the Discover with LiLa button in InnerWorkings page shows a "Coming soon" toast rather than opening the conversation — implying mode is seeded but entry-point UI is stubbed. Potential contradiction between entry 93's ✅ Wired status and entry 105's ⏳ Unwired (MVP) status for the UI surface.

---

## Entry 94 — `"Craft with LiLa" — pre-primed conversation for GS crafting`

**Registry line:** 94
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| "Craft with LiLa" — pre-primed conversation for GS crafting (button exists, shows stub alert) | PRD-06 | PRD-05 (LiLa integration) | ⏳ Unwired (MVP) | Phase 06 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row explicitly describes: "button exists, shows stub alert."
- Identifier: `craft_with_lila` mode_key + GuidingStars.tsx page button.

### Field 2 — Code presence check

```
Grep command: pattern=`craft_with_lila|Craft with LiLa`, output_mode=files_with_matches, -i
Hits: 15 files
Key locations:
  - src\pages\GuidingStars.tsx:383 (Tooltip content="Craft with LiLa")
  - src\pages\GuidingStars.tsx:386-387 (STUB comment + alert)
  - src\pages\GuidingStars.tsx:633-635 (second stub location)
  - supabase\migrations\00000000000013_lila_schema_remediation.sql:129 (mode_key in update)
```

First-context window from `src/pages/GuidingStars.tsx:380-388`:

```tsx
{/* Actions */}
<div className="flex items-center gap-2">
  <Tooltip content="Craft with LiLa">
  <button
    onClick={() => {
      // STUB: Craft with LiLa — PRD-06
      alert('Coming soon — Craft with LiLa will help you discover your guiding stars.')
    }}
```

### Field 3 — Wiring check

**Callers/Importers:** Inline button in GuidingStars.tsx. Mode_key `craft_with_lila` is seeded in migrations (see line 129 of migration 000013 referencing the mode).

**Execution-flow location:** React component onClick — shows alert, does not invoke LiLa.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-06 addenda.

**PlannedExpansionCard / stub UI:** alert() — not a PlannedExpansionCard.

**CLAUDE.md convention mention:** No explicit convention.

### Field 5 — What was NOT checked

- Whether `craft_with_lila` mode_key is also seeded in 000007 (search only surfaced migration 000013 reference). The mode appears in `ai_patterns.md` guided mode list.
- Git log.

### Field 6 — Observations (no verdict)

Two button instances in `src/pages/GuidingStars.tsx` (lines 383 & 633) use STUB comments and show `alert('Coming soon — Craft with LiLa will help you discover your guiding stars.')`. Mode_key exists in migration 000013 update logic.

---

## Entry 95 — `"Extract from Content" — upload + extract GS entries`

**Registry line:** 95
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| "Extract from Content" — upload content, extract GS entries | PRD-06 | Knowledge Base PRD | ⏳ Unwired (MVP) | TBD |
```

### Field 1 — Implementation identifier

- **(a)** Stub row notes: "Extract from Content" wires to future Knowledge Base PRD.
- **(d)** PRD-06 line 94: "Extract from Content — stub (wires to Knowledge Base / upload system in future PRD)." Line 537: "Extract from Content input path for Guiding Stars | Knowledge Base / content upload system | TBD".
- Identifier: CAPABILITY-ONLY — no code identifier named; Knowledge Base PRD does not yet exist.

### Field 2 — Code presence check

skipped — no identifier to grep for.

### Field 3 — Wiring check

skipped — no code presence.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No mention.

**Cross-PRD addendum mentions:** PRD-06 references "Knowledge Base / content upload system" as the future wiring target.

**PlannedExpansionCard / stub UI:** Not searched.

**CLAUDE.md convention mention:** No convention.

### Field 5 — What was NOT checked

- Semantic question I'd ask if mgrep were approved: "Is there a partially built Knowledge Base content-upload UI that might already surface Extract from Content for Guiding Stars?"

### Field 6 — Observations (no verdict)

Capability-only entry; evidence-by-grep not applicable. Flagged for founder-judgment bucket. Depends on a future Knowledge Base PRD.

---

## Entry 96 — `Family-level Guiding Stars creation`

**Registry line:** 96
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Family-level Guiding Stars creation — owner_type='family' column exists, creation flow deferred | PRD-06 | PRD-12 (LifeLantern) | ⏳ Unwired (MVP) | Phase 22 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: `owner_type='family'` column exists, creation flow deferred.
- **(c)** Live_schema.md — `guiding_stars` table has `owner_type` column.
- Identifier: `owner_type` column on `guiding_stars` + absence of a family-scope creation UI in GuidingStars.tsx.

### Field 2 — Code presence check

```
Grep command: pattern=`owner_type`, path=src/hooks/useGuidingStars.ts, output_mode=content
Hits:
  - :23 (owner_type?: 'member' | 'family')
```

```
Grep command: pattern=`owner_type.*'family'`, glob=src/**, output_mode=files_with_matches, -i
Hits: 4 files (useArchives.ts, FamilyOverviewDetail.tsx, useSlideshowSlides.ts, useGuidingStars.ts)
```

Type declaration exists; confirmed presence of column on guiding_stars type. Full creation-flow UI check not done.

### Field 3 — Wiring check

**Callers/Importers:** The consumers that USE owner_type filters (Archives, FamilyOverview) appear wired; the CREATION flow for family-level stars is the specific item flagged as deferred.

**Execution-flow location:** React hook type + DB column.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-06, PRD-12B addenda.

**PlannedExpansionCard / stub UI:** Not checked.

**CLAUDE.md convention mention:** No explicit convention for family-level GS creation.

### Field 5 — What was NOT checked

- Whether GuidingStars.tsx page offers a family-scope toggle in the creation modal (didn't read creation modal code).
- Whether FamilyVisionQuest creates family-scoped Guiding Stars directly (registry says "Wired By PRD-12").
- Git log.

### Field 6 — Observations (no verdict)

Column `owner_type` on `guiding_stars` exists and is typed in `useGuidingStars.ts:23` as `'member' | 'family'`. Family-scope queries are exercised by Archives and FamilyOverviewDetail. The specific creation UI for family-level stars was not surfaced in this investigation; registry claims this path is wired via PRD-12 (LifeLantern / Vision Quest).

---

## Entry 98 — `Morning/Evening Review GS integration — data contracts defined`

**Registry line:** 98
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Morning/Evening Review GS integration — data contracts defined | PRD-06 | PRD-18 (Rhythms) | ⏳ Unwired (MVP) | Phase 19 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: data contracts defined. Possibly referring to rhythm section types that integrate Guiding Stars data.
- **(c)** Convention #172 mentions `ClosingThoughtSection` showing Guiding Stars at evening (rotation when pool size ≥5).
- Identifier: section types `best_intentions_focus` and `closing_thought` in `task_templates` / `rhythm_configs`. Possibly also references the MonthlyReviewCard / WeeklyReviewCard integration.

### Field 2 — Code presence check

```
Grep command: pattern=`ClosingThought|closing_thought|guiding_stars.*rotation`, output_mode=files_with_matches, -i
Hits: 21 files (includes src/components/rhythms/sections/ClosingThoughtSection.tsx + multiple rhythm migrations)
```

```
Grep command: pattern=`guiding_star`, path=src/components/rhythms/sections/ClosingThoughtSection.tsx
Hits: 0 (no direct reference)
```

The ClosingThoughtSection does not directly query guiding_stars per this narrow grep. It may do so via a hook. Convention #172 says the auto-hide threshold is 5 active Guiding Stars — implies it reads GS data via a hook.

### Field 3 — Wiring check

**Callers/Importers:** Wired through SectionRendererSwitch `closing_thought` case.

**Execution-flow location:** React component in rhythm modal.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-18 addenda.

**PlannedExpansionCard / stub UI:** Not checked.

**CLAUDE.md convention mention:** Convention #172.

### Field 5 — What was NOT checked

- Whether ClosingThoughtSection uses `useGuidingStars` or similar hook — narrow grep on that file returned no matches.
- Whether the MVP-deferred aspect is the GS rotation data contract specifically (vs the visual integration which seems wired).
- Git log.

### Field 6 — Observations (no verdict)

`ClosingThoughtSection.tsx` exists and is dispatched via SectionRendererSwitch. Convention #172 specifies the GS-pool-size-≥5 threshold rule for bedtime GS rotation. A narrow grep inside ClosingThoughtSection did not surface a direct `guiding_star` identifier, but the convention implies the hook-level integration should exist.

---

## Entry 99 — `Victory Recorder GS thread detection`

**Registry line:** 99
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Victory Recorder GS thread detection — celebration checks GS for connections | PRD-06 | PRD-11 (Victory Recorder) | ⏳ Unwired (MVP) | Phase 12 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: celebration checks GS for connections.
- Identifier: `guiding_star_id` FK column on `victories` table + query/filter paths in useVictories.ts.

### Field 2 — Code presence check

```
Grep command: pattern=`guiding_star_id`, path=src/hooks/useVictories.ts, output_mode=content
Hits: 2
  - :81 (query.not('guiding_star_id', 'is', null) in specialFilter='guiding_stars')
  - :205 (insert payload: guiding_star_id: input.guiding_star_id ?? null)
```

The FILTER path (show victories tied to GS) is wired via `specialFilter`. The INSERT path accepts an optional `guiding_star_id` — but whether a "thread detection" auto-attach algorithm EXISTS (i.e., when creating a victory, automatically scan GS for connected ones) is not surfaced.

### Field 3 — Wiring check

**Callers/Importers:** useVictories.ts insert mutation accepts `guiding_star_id` from caller. Auto-detection code not located.

**Execution-flow location:** React hook.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row for GS thread detection.

**Cross-PRD addendum mentions:** PRD-11 and PRD-06 addenda.

**PlannedExpansionCard / stub UI:** Not checked.

**CLAUDE.md convention mention:** No explicit convention.

### Field 5 — What was NOT checked

- Whether any part of victory creation (auto-victory path or manual) runs semantic matching against the user's active Guiding Stars.
- Whether `specialFilter === 'guiding_stars'` filter surface in UI is the feature this entry describes (filter vs auto-attach are different capabilities).
- Git log.

### Field 6 — Observations (no verdict)

`guiding_star_id` FK is present on the `victories` table (schema) and surfaced on both the filter and insert paths in `useVictories.ts`. However, a "thread detection" auto-attach algorithm — e.g., on victory creation scan user's active Guiding Stars and set guiding_star_id automatically — was not surfaced in this grep.

---

## Entry 100 — `Declaration language coaching`

**Registry line:** 100
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Declaration language coaching — LiLa guides toward honest commitment language | PRD-06 | PRD-05 (LiLa crafting flow) | ⏳ Unwired (MVP) | Phase 06 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: LiLa guidance during crafting.
- **(d)** PRD-06 line 578: "Declaration language coaching active in LiLa crafting flow" listed as unchecked in verification checklist.
- Identifier: CAPABILITY-ONLY — no named function. Depends on `craft_with_lila` mode (entry 94), which is currently a stub alert.

### Field 2 — Code presence check

skipped — no identifier to grep for.

### Field 3 — Wiring check

skipped — no code presence.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-06 cross-PRD addendum may reference this.

**PlannedExpansionCard / stub UI:** Not checked.

**CLAUDE.md convention mention:** No explicit convention.

### Field 5 — What was NOT checked

- Whether `craft_with_lila` system prompt in lila_guided_modes includes declaration language coaching directives (would require reading migrations or live DB).
- Semantic question I'd ask if mgrep were approved: "Is there any declaration-coaching text in the lila_guided_modes system prompts or help-patterns?"

### Field 6 — Observations (no verdict)

Capability-only entry; evidence-by-grep not applicable. Flagged for founder-judgment bucket. Depends on the Craft with LiLa mode (entry 94), which is currently stubbed at the button level.

---

## Entry 101 — `Victory Recorder daily intention summary`

**Registry line:** 101
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Victory Recorder daily intention summary — intention_iterations consumed by Victory Recorder | PRD-06 | PRD-11 (Victory Recorder) | ⏳ Unwired (MVP) | Phase 12 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: intention_iterations consumed by Victory Recorder daily summary.
- **(d)** PRD-11 line 593: "Best Intention iteration celebrations | PRD-06 | Intention celebrate-tap creates victory records with source = 'intention_iteration'."
- Identifier: Same data-flow target as entries 67, 91 — but specifically the "daily summary" surface within the Victory Recorder.

### Field 2 — Code presence check

```
Grep command: pattern=`intention_iteration`, glob=src/**, output_mode=files_with_matches
Hits: 8 files (MonthlyReviewCard.tsx, WeeklyReviewCard.tsx, useFamilyBestIntentions.ts, useFamilyOverviewData.ts, useBestIntentions.ts, BestIntentionsFocusSection.tsx, types/victories.ts, InfoFamilyIntention.tsx)
```

The `victories` table has no `intention_iterations` FK per live_schema.md. The consumer code path for daily Victory Recorder summary-of-intentions was not surfaced in this grep.

### Field 3 — Wiring check

**Callers/Importers:** Multiple rhythm review cards query `intention_iterations`. Daily victory summary is a separate surface.

**Execution-flow location:** React hooks + components.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-11 and PRD-06 addenda.

**PlannedExpansionCard / stub UI:** Not checked.

**CLAUDE.md convention mention:** No explicit convention.

### Field 5 — What was NOT checked

- Whether `DailyCelebration` overlay consumes `intention_iterations` data (this is likely the "daily intention summary" surface — not read here).
- Whether there's an auto-create-victory-from-iteration DB trigger.
- Git log.

### Field 6 — Observations (no verdict)

`intention_iterations` table is queried by multiple rhythm review cards and best-intentions hooks. The specific "Victory Recorder daily intention summary" surface was not surfaced in this investigation — whether it's DailyCelebration, a widget, or a Rhythm card needs cross-feature verification.

---

## Entry 105 — `"Discover with LiLa" (self_discovery guided mode)`

**Registry line:** 105
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| "Discover with LiLa" (self_discovery guided mode) — button exists, stub behavior | PRD-07 | PRD-05 (lila_guided_modes seed + system prompt) | ⏳ Unwired (MVP) | Phase 06 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: button exists, stub behavior.
- Identifier: Discover-with-LiLa button in `src/pages/InnerWorkings.tsx:475` with `showToast('Coming soon...')` at line 470.

### Field 2 — Code presence check

```
Grep command: pattern=`Discover with LiLa`, output_mode=content, path=src/pages/InnerWorkings.tsx
Hits:
  - :475 (<span className="hidden sm:inline">Discover with LiLa</span>)
Button onClick at :470: showToast('Coming soon — LiLa Discovery mode is not available yet.')
```

First-context window from `src/pages/InnerWorkings.tsx:469-477`:

```tsx
<button
  onClick={() => showToast('Coming soon — LiLa Discovery mode is not available yet.')}
  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
  ...
>
  <MessageCircle size={14} />
  <span className="hidden sm:inline">Discover with LiLa</span>
```

### Field 3 — Wiring check

**Callers/Importers:** Inline button in InnerWorkings.tsx. Mode_key `self_discovery` is seeded (entry 93) but the button does not open a conversation — shows toast only.

**Execution-flow location:** React component onClick.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-07 addenda.

**PlannedExpansionCard / stub UI:** `showToast` pattern — not PlannedExpansionCard.

**CLAUDE.md convention mention:** No explicit convention.

### Field 5 — What was NOT checked

- Git log.

### Field 6 — Observations (no verdict)

Entry-point button in `src/pages/InnerWorkings.tsx:469-477` shows a `showToast('Coming soon — LiLa Discovery mode is not available yet.')` message. Mode_key `self_discovery` is seeded (entry 93) but the InnerWorkings page entry point is stubbed at the UI level.

---

## Entry 107 — `Archives "checked somewhere, checked everywhere"`

**Registry line:** 107
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Archives "checked somewhere, checked everywhere" — sharing state single-source-of-truth | PRD-07 | PRD-13 (Archives) | ✅ Wired | Phase 13 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row names the "checked somewhere, checked everywhere" pattern.
- **(c)** Convention #75 describes the pattern (SSoT writes to source table).
- **(d.5)** `src/hooks/useArchives.ts` has the `useToggleAggregatedAI` hook.
- Identifier: `useToggleAggregatedAI` hook at `src/hooks/useArchives.ts:694` + `useArchiveAggregation` at line 576.

### Field 2 — Code presence check

```
Grep command: pattern=`checked somewhere, checked everywhere`, path=src/hooks/useArchives.ts
Hits: 2 (lines 576, 690)
```

First-context window from `src/hooks/useArchives.ts:689-708`:

```ts
/**
 * Toggle is_included_in_ai on the SOURCE table — "checked somewhere, checked everywhere".
 * When an InnerWorkings entry appears in Archives and user toggles the heart,
 * this writes back to self_knowledge, guiding_stars, or best_intentions directly.
 */
export function useToggleAggregatedAI() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sourceTable,
      id,
      memberId,
      included,
    }: {
      sourceTable: 'self_knowledge' | 'guiding_stars' | 'best_intentions'
      ...
```

### Field 3 — Wiring check

**Callers/Importers:** Not grepped for callers.

**Execution-flow location:** React hook.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-13 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Convention #75.

### Field 5 — What was NOT checked

- Whether `useToggleAggregatedAI` is imported by Archives UI components.
- Git log.

### Field 6 — Observations (no verdict)

Hook `useToggleAggregatedAI` defined at `src/hooks/useArchives.ts:694` with explicit documentation of the "checked somewhere, checked everywhere" pattern. Writes back to source tables `self_knowledge`, `guiding_stars`, or `best_intentions`. Convention #75 documents this pattern.

---

## Entry 108 — `Content extraction from Knowledge Base (IW entries)`

**Registry line:** 108
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Content extraction from Knowledge Base — upload to KB, extract IW entries | PRD-07 | Knowledge Base PRD | ⏳ Unwired (MVP) | TBD |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: upload to KB, extract InnerWorkings entries.
- Identifier: CAPABILITY-ONLY — no code identifier; Knowledge Base PRD does not yet exist. Mirror of entry 95 (GS extraction) for self_knowledge.

### Field 2 — Code presence check

skipped — no identifier to grep for.

### Field 3 — Wiring check

skipped — no code presence.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No mention.

**Cross-PRD addendum mentions:** PRD-07 addenda may reference this.

**PlannedExpansionCard / stub UI:** Not checked.

**CLAUDE.md convention mention:** No convention.

### Field 5 — What was NOT checked

- Semantic question I'd ask if mgrep were approved: "Is there a partially-built content-upload path that targets `self_knowledge` extraction?"

### Field 6 — Observations (no verdict)

Capability-only entry; evidence-by-grep not applicable. Flagged for founder-judgment bucket. Mirror of entry 95 — both depend on a future Knowledge Base PRD.

---

## Entry 109 — `Messaging notifications`

**Registry line:** 109
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Messaging notifications | PRD-08 | PRD-15 | ✅ Wired | Phase 16 |
```

### Field 1 — Implementation identifier

- **(a)** Stub row: messaging notifications.
- **(c)** Convention #143: "Notifications use a single `notifications` table with `notification_type` (specific) and `category` (filterable: messages, requests, calendar, tasks, safety, lila)."
- Identifier: `createNotification` util + `category: 'messages'` usage + `notifications` table.

### Field 2 — Code presence check

```
Grep command: pattern=`createNotification`, output_mode=files_with_matches
Hits: present in src/utils/createNotification.ts (definition) + callers
```

`src/utils/createNotification.ts:1-40` defines the helper. Categories set by caller.

```
Grep command: pattern=`'messages'`, path=src/hooks/useNotificationPreferences.ts, output_mode=content
Hits: line 10 ('messages' in category list)
```

`useNotifications.ts:19-26` reads from `notifications` table filtered by `recipient_member_id` and `is_dismissed=false`.

### Field 3 — Wiring check

**Callers/Importers of `createNotification`:** docs mention it's used by "calendar approve/reject, request lifecycle, messaging, and any other feature." Whether messaging send-paths invoke it was not individually verified — messaging send hooks grepped for `createNotification` returned no matches.

**Execution-flow location:** Utility function + notifications table.

**Most recent touching commit:** Not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No dedicated row.

**Cross-PRD addendum mentions:** PRD-15 addenda.

**PlannedExpansionCard / stub UI:** Not applicable.

**CLAUDE.md convention mention:** Convention #143 covers the categories. `category: 'messages'` listed.

### Field 5 — What was NOT checked

- Whether `useMessages.ts` (or any messaging hook) actually calls `createNotification` when a new message is sent — narrow grep found no callsite.
- Whether a DB trigger on `messages` table inserts into `notifications` instead.
- Git log.

### Field 6 — Observations (no verdict)

`createNotification` utility exists in `src/utils/createNotification.ts` and writes to `notifications` table. `notifications` category list in `useNotificationPreferences.ts` includes `'messages'`. `useNotifications.ts` reads and surfaces the feed. Whether messaging-send code paths invoke createNotification (or a DB trigger handles it) was not confirmed in this investigation — narrow grep on messaging hooks did not surface the call.

---

<!-- PROGRESS MARKER: completed entries 25-109 (37 entries), batch complete at 2026-04-19T00:00:00Z -->


## Entry 111 — `Send to Person (messaging)`

**Registry line:** 111
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Send to Person (messaging) | PRD-08 | PRD-15 | ✅ Wired | Phase 16 |
```

### Field 1 — Implementation identifier

(a) Stub entry line 111 does not name a concrete code identifier. Only capability ("Send to Person (messaging)") + PRD references.
(b) `WIRING_STATUS.md` line 18 (RoutingStrip Destinations table): `| Message | Notepad | Opens composer | Stub | PRD-15 not built |` — names "composer" capability, Status "Stub".
(c) No matching CLAUDE.md convention naming a concrete identifier for this capability.
(d.5) WIRING_STATUS.md at (b) says "Opens composer"; NotepadDrawer.tsx surfaced via `grep 'message'` as having `destination === 'message'` branch. One-file lookup → `src/components/notepad/NotepadDrawer.tsx:258` intercepts `destination === 'message'` and sets `composeFlowOpen(true)`. Secondary identifier: `ComposeFlow` component.

```
Source: src/components/notepad/NotepadDrawer.tsx:258 — "if (destination === 'message') { const content = activeTab.content || ''; setComposeFlowContent(content); setComposeFlowOpen(true); return }"
Identifier: destination === 'message' branch + ComposeFlow component
```

### Field 2 — Code presence check

```
Grep command: pattern='message', path=src, output_mode=content (line 2 of multi-grep)
Hits: Multiple; relevant for Messaging destination routing:
  - src/components/notepad/NotepadDrawer.tsx:258 "if (destination === 'message') { ... setComposeFlowOpen(true) }"
  - src/components/shared/RoutingStrip.tsx:102 "{ key: 'message', label: 'Message', icon: MessageCircle, featureKey: 'messages', accent: 'rose' }"
  - src/components/shared/RoutingStrip.tsx:129,135 'message' in allowed destination list
  - src/components/guided/SendToGrid.tsx:154 "{ key: 'message', label: 'Message', icon: <MessageCircle size={22} />, disabled: true, description: 'Coming soon!' }"
  - src/components/guided/SendToGrid.tsx:33 "if (dest === 'message') return // Stub — disabled"
  - src/hooks/useNotepad.ts:61 "{ key: 'message', label: 'Message', icon: 'MessageCircle' }"
```

```
Grep command: pattern='ComposeFlow|composeFlow', path=src/components/messaging
Hits: 1 file
Files:
  - src/components/messaging/ComposeFlow.tsx (exists — concrete component)
```

### Field 3 — Wiring check

Notepad "Message" destination: wired to open ComposeFlow with pre-filled content (NotepadDrawer.tsx:258). ComposeFlow component file exists.
Guided SendToGrid "Message": explicitly disabled stub at line 33 ("// Stub — disabled") and line 154 ("disabled: true, description: 'Coming soon!'").
RoutingStrip: 'message' is a registered destination key (line 102) with `featureKey: 'messages'`.

Caller files for ComposeFlow: NotepadDrawer.tsx (at least).

Most recent touching commit: not checked (git not available in this session's Bash scope).

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Line 18 says `| Message | Notepad | Opens composer | Stub | PRD-15 not built |` — describes Message destination as Stub with "Opens composer" description. This contradicts the in-tree code which has ComposeFlow wired from NotepadDrawer.tsx.
**Cross-PRD addendum mentions:** prds/addenda/PRD-15-Cross-PRD-Impact-Addendum.md exists; grep result earlier showed it references messaging flows.
**PlannedExpansionCard:** none found for this feature key.
**CLAUDE.md convention mention:** Conventions 136-148 describe messaging architecture but do not name a specific implementation identifier for the "Send to Person" routing destination.

### Field 5 — What was NOT checked

- Whether ComposeFlow.tsx actually submits messages end-to-end and persists to `messages` / `conversation_threads` rows; I only confirmed the file exists and is opened from NotepadDrawer.
- Whether `WIRING_STATUS.md` line 18 is stale vs. the NotepadDrawer code (contradiction surfaced but not resolved — that's founder's judgment call).
- Guided `SendToGrid` "Message" disabled status vs. adult Notepad wired status suggests two different destinations share the label — did not confirm whether the Guided path was *supposed* to wire later.
- No git log for most-recent commit (Bash permission denied for git log in this session).

### Field 6 — Observations (no verdict)

Two code paths exist under the "Message" label: adult Notepad's NotepadDrawer.tsx:258 intercepts `destination === 'message'` and opens `ComposeFlow` with the notepad content pre-filled (`ComposeFlow.tsx` component present). Guided SendToGrid explicitly marks its Message tile as `disabled: true` with "Coming soon!" copy (line 154) and returns early (line 33). RoutingStrip registers 'message' as a valid destination with `featureKey: 'messages'` (line 102). WIRING_STATUS.md line 18 describes the destination as "Stub — PRD-15 not built," which does not match the presence of `setComposeFlowOpen(true)` in NotepadDrawer. Registry claims ✅ Wired. Evidence shows adult-path wired to component; Guided-path still disabled; WIRING_STATUS doc appears stale.

## Entry 112 — `Send to Calendar`

**Registry line:** 112
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Send to Calendar | PRD-08 | PRD-14B | ✅ Wired | Phase 14 |
```

### Field 1 — Implementation identifier

(a) Stub row does not name a concrete code identifier.
(b) `WIRING_STATUS.md` line 8 (RoutingStrip Destinations table): `| Calendar | Notepad, MindSweep, .ics import | studio_queue → calendar_events | Wired | Queue → CalendarTab approve/edit/skip + .ics file upload on /sweep |`. Names `studio_queue` + `calendar_events` + CalendarTab as the mechanism.
(d.5) WIRING_STATUS mentions `studio_queue`. Opening `src/hooks/useNotepad.ts` shows the default branch (line 581) insert into `studio_queue` with `destination` field for calendar/track/agenda/message/optimizer.

```
Source: src/hooks/useNotepad.ts:580-597 — default switch branch insert into studio_queue
Identifier: studio_queue insert with destination='calendar' (from useNotepad.routeContent)
```

### Field 2 — Code presence check

```
Grep command: pattern='calendar', path=src/hooks/useNotepad.ts
Hits: Line 53 declares destination "{ key: 'calendar', label: 'Calendar', icon: 'Calendar' }"; line 349 lists it in the AI-parse allowed destinations; line 581 comment "For calendar, track, agenda, message, optimizer — deposit to studio_queue".
Context (lines 580-597):
  default: {
    // For calendar, track, agenda, message, optimizer — deposit to studio_queue
    const { data, error } = await supabase
      .from('studio_queue')
      .insert({ family_id: familyId, owner_id: tab.member_id, destination, content, source: 'notepad', source_reference_id: tab.id })
      .select('id').single()
    ...
  }
```

### Field 3 — Wiring check

Notepad Send-to-Calendar path writes to `studio_queue` with `destination='calendar'`. CalendarTab (per WIRING_STATUS line 8) consumes `studio_queue` items to approve/edit/skip. Also lists `.ics` file upload on `/sweep` and MindSweep calendar classification as secondary inputs. Caller hook: `useNotepad.routeContent` mutation.

Most recent commit: not checked (Bash git-log denied).

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Lines 8 + "Calendar Import (Phase 0)" section (around line ~190 in WIRING_STATUS) — both describe the Calendar routing path as Wired.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-14B-Cross-PRD-Impact-Addendum.md` exists.
**PlannedExpansionCard:** none found for calendar routing.
**CLAUDE.md convention mention:** Conventions 106-117 describe calendar architecture. Convention 112 explicitly says task due dates surface via direct query (not duplication into `calendar_events`), which is orthogonal to Send-to-Calendar from Notepad.

### Field 5 — What was NOT checked

- Whether CalendarTab UI actually consumes `studio_queue` rows with `destination='calendar'` — I did not open CalendarTab.tsx or its equivalent to verify the approval flow closes the loop into `calendar_events`.
- Whether .ics file import path is actively wired in `/sweep`.
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

`useNotepad.ts` default branch (lines 580-597) inserts into `studio_queue` with the passed `destination` field when it is one of calendar/track/agenda/message/optimizer. WIRING_STATUS.md lists Calendar as Wired via `studio_queue → calendar_events` with CalendarTab as the approval UI and `.ics` + MindSweep as secondary input paths. Registry claims ✅ Wired. Evidence shows notepad-to-queue write exists; queue-to-events consumption not verified in this session.

## Entry 114 — `Reward system integration`

**Registry line:** 114
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Reward system integration | PRD-09A | PRD-24 | ✅ Wired | Phase 29 |
```

### Field 1 — Implementation identifier

(a) Stub row names "Reward system integration" — capability-level, no concrete identifier.
(b) WIRING_STATUS.md has no section titled "Reward system integration". The closest related section is Calendar/Tasks and the 2026-04-13 rotation/opportunity-claim sections, but none names a specific "reward" integration mechanism for the Notepad/Tasks pipe. `task_rewards` table mentioned in live_schema (0 rows).
(c) CLAUDE.md Conventions 198-222 (Play Dashboard / Gamification / Configurable Earning Strategies) are the authoritative gamification specs. Convention 198 names `roll_creature_for_completion` RPC; Convention 220 says "Gamification and allowance calculations (PRD-28) coexist — both consume `task_completions` rows independently."
(d.5) `grep 'roll_creature_for_completion' supabase/migrations` → 6 files, most recent migration `00000000100128_coloring_reveal_task_link_rpc.sql`. The RPC is the integration mechanism between task completion → gamification.

```
Source: CLAUDE.md Convention 198: "roll_creature_for_completion(p_task_completion_id UUID) is the authoritative gamification pipeline endpoint"
Source: supabase/migrations/00000000100115_play_dashboard_sticker_book.sql (migration introduces RPC)
Identifier: roll_creature_for_completion RPC + task_rewards table
```

### Field 2 — Code presence check

```
Grep command: pattern='roll_creature_for_completion', path=supabase/migrations
Hits: 6 files
Files:
  - supabase/migrations/00000000100115_play_dashboard_sticker_book.sql
  - supabase/migrations/00000000100123_rpc_fix_roll_creature_for_completion.sql
  - supabase/migrations/00000000100126_earning_strategies_color_reveal.sql
  - supabase/migrations/00000000100128_coloring_reveal_task_link_rpc.sql
  - supabase/migrations/00000000100130_rpc_fix_uninitialized_record.sql
  - supabase/migrations/00000000100134_allowance_financial.sql
```

```
Grep command: pattern='task_rewards|reward_type|reward_value', path=supabase/migrations
Hits: 4 files
Files:
  - supabase/migrations/00000000000008_tasks_lists.sql
  - supabase/migrations/00000000100023_tasks_prd09a_full.sql
  - supabase/migrations/00000000100134_allowance_financial.sql
  - supabase/migrations/00000000100139_opportunity_list_unification.sql
```

### Field 3 — Wiring check

The gamification RPC `roll_creature_for_completion` was added in migration 100115 (Play Dashboard + Sticker Book) and updated multiple times. Called from `src/hooks/useTasks.ts:304` (`rollGamificationForCompletion(completion.id)` invoked from `useCompleteTask` when `requireApproval` is false). Table `task_rewards` exists in schema (0 rows per live_schema). Allowance integration via `counts_for_allowance` flag wired in migration 100134.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No direct "Reward system integration" row; however Opportunity Claim Lock Expiration, List Victory Mode, and Task Rotation Advancement tables (lines ~130-160) describe adjacent wiring.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md` exists (per earlier grep).
**PlannedExpansionCard:** not searched separately for this entry.
**CLAUDE.md convention mention:** Conventions 198-207 describe gamification pipeline in detail. Convention 224 names `counts_for_allowance` / `counts_for_homework` / `counts_for_gamification` task flags.

### Field 5 — What was NOT checked

- Whether "Reward system integration" as named in the stub specifically refers to the gamification pipeline, the allowance pipeline, or a separate unimplemented "rewards tiering" concept.
- Whether `task_rewards` table (0 rows) is actively used or legacy. Migration 100139 touches it; I did not verify current use.
- Semantic-search question: is there a reward concept separate from gamification points + allowance dollars that this stub was originally naming? (Would need mgrep per Convention 242 — not approved.)
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

CLAUDE.md Convention 198 names `roll_creature_for_completion` RPC as the authoritative gamification pipeline endpoint. Migration 100115 created it; migrations 100123/100126/100128/100130 updated it; 100134 integrated allowance tracking via `counts_for_allowance` task flag. `src/hooks/useTasks.ts:304` calls the RPC from `useCompleteTask`. Registry claims ✅ Wired. The stub's "Reward system integration" capability label is ambiguous vs. the gamification pipeline specifically. Evidence shows task-completion → gamification-points + streak + creature-roll pipeline is wired; whether this is the exact "Reward system integration" the stub originally meant is a founder-judgment call.

## Entry 115 — `Allowance pool calculation`

**Registry line:** 115
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Allowance pool calculation | PRD-09A | PRD-28 | ✅ Wired | Phase 32 |
```

### Field 1 — Implementation identifier

(a) Stub row names "Allowance pool calculation" — capability-level.
(b) WIRING_STATUS.md has no "Allowance" section with a named mechanism.
(c) CLAUDE.md Convention 223 names `financial_transactions` as append-only ledger; Convention 224 names `counts_for_allowance` task flag; Convention 225 says financial tables excluded from LiLa context. None name the pool-calculation function itself.
(d) PRD-28 is the owning PRD. `prds/tracking/PRD-28-Tracking-Allowance-Financial.md` is the likely PRD path.
(d.5) `grep 'allowance'` on `src/hooks/useFinancial.ts` shows `allowance_configs`, `allowance_periods`, `calculated_amount` column, and read of "active allowance period" (line 617). No single "pool" function name surfaced.

```
Source: CLAUDE.md Convention 223-225 + src/hooks/useFinancial.ts (multiple lines reading allowance_configs / allowance_periods)
Source: supabase/migrations/00000000100134_allowance_financial.sql (allowance tables + calculated_amount column at line 188)
Identifier: allowance_configs table + allowance_periods table + calculated_amount column + useFinancial hook family
```

### Field 2 — Code presence check

```
Grep command: pattern='allowance_pool|calculate_allowance|allowance_periods|allowance_configs', path=supabase/migrations
Hits: 2 files
Files:
  - supabase/migrations/00000000100134_allowance_financial.sql (creates tables)
  - supabase/migrations/00000000100135_allowance_bonus_type.sql (bonus_type addition)
Note: zero matches for "calculate_allowance" as a function name — suggests no Postgres function with that name exists. Calculation may live in client hook rather than SQL.
```

```
Grep command: pattern='allowance', path=src/hooks
Hits: 1 file
Files:
  - src/hooks/useFinancial.ts (references allowance_configs, allowance_periods, calculated_amount, active allowance period read)
```

### Field 3 — Wiring check

Tables `allowance_configs` + `allowance_periods` created in migration 100134 with `calculated_amount DECIMAL(10,2)` column (line 188 of migration). Client hook `useFinancial.ts` reads from both tables. Status column on `allowance_periods` has states `active | makeup_window | calculated | closed` (migration 100134 line 177) — implies calculation is transition-driven rather than a named function.

Most recent commit: not checked.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No direct "Allowance pool calculation" row.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md` likely exists.
**PlannedExpansionCard:** not searched separately.
**CLAUDE.md convention mention:** Convention 223 (financial_transactions append-only), 224 (counts_for_allowance flag), 225 (financial data excluded from LiLa).

### Field 5 — What was NOT checked

- Whether there is a named Postgres function for allowance calculation (grep found none; could be in `supabase/functions/` Edge Function rather than migration SQL).
- Whether the `active → calculated → closed` status transition is driven by pg_cron, an Edge Function, or a client-side mutation.
- Whether `financial_transactions` ledger correctly sums to `calculated_amount` at the `closed` transition.
- Semantic-search question: is there an Edge Function like `allowance-calculate` or `compute-allowance-period` that I missed with keyword grep? (Convention 242 blocks mgrep.)
- Partition-file advisory flagged this entry as potentially Schema-partition if calc is a Postgres function; grep result (zero matches for function name) suggests calc is client-side and stays in this partition.
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

Tables and columns exist. Migration 100134 created `allowance_configs` + `allowance_periods` with a `calculated_amount` DECIMAL column. `useFinancial` hook reads both. No Postgres function named `calculate_allowance` or `allowance_pool` found — calculation mechanism not identified from grep alone. Registry claims ✅ Wired. Advisory note in the partition file (line 210) anticipated this: "could be Schema if the calc is a Postgres function; grep will reveal which." Grep revealed no function — calc location remains ambiguous.

## Entry 116 — `Widget milestone → victory`

**Registry line:** 116
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Widget milestone → victory | PRD-10 | PRD-11 (AIR) | ✅ Wired | Phase 12 |
```

### Field 1 — Implementation identifier

(a) Stub row references AIR (Automatic Intelligent Routing) from PRD-11.
(b) WIRING_STATUS.md has no AIR section or widget-milestone-to-victory row.
(c) `claude/ai_patterns.md` "Automatic Intelligent Routing (AIR)" section lists `widget_milestone` as a victory source value: "Widget milestone data point | `widget_milestone` | Milestone threshold reached on a widget".
(d.5) `grep 'widget_milestone' supabase/migrations` → 2 files; migration 100102 and 000009 both list `widget_milestone` in a CHECK constraint array on the victory source enum. No trigger named for the milestone-to-victory transition.

```
Source: claude/ai_patterns.md AIR section: "Widget milestone data point | widget_milestone | Milestone threshold reached on a widget"
Source: supabase/migrations/00000000100102_list_victory_mode.sql:40 (victory source enum includes 'widget_milestone')
Source: src/types/victories.ts:13 (TS union type includes 'widget_milestone'); line 356 display label "Widget milestone"
Identifier: victory.source='widget_milestone' value; no explicit trigger/function name surfaced
```

### Field 2 — Code presence check

```
Grep command: pattern='widget_milestone', path=supabase/migrations
Hits: 2 files
Files:
  - supabase/migrations/00000000000009_remediation_schema_batch.sql:317
  - supabase/migrations/00000000100102_list_victory_mode.sql:40
Both occurrences are inside the victory source CHECK constraint array, not in a trigger body or RPC definition.
```

```
Grep command: pattern='widget_milestone', path=src
Hits: 1 file
Files:
  - src/types/victories.ts:13 (TS union type)
  - src/types/victories.ts:356 (display label)
```

```
Grep command: pattern='widget_data_points|widget.*trigger|AFTER INSERT.*widget', path=supabase/migrations
Hits: 6 files — examined PRD-10 tables migration (100033) did not show any trigger tying widget_data_points to victories.
```

### Field 3 — Wiring check

Enum/source value `widget_milestone` is accepted by the `victories` table CHECK constraint. TypeScript union type includes it. No migration grep hit showed a trigger like `AFTER INSERT ON widget_data_points` that creates a `victories` row — the value is declared but the write-path automation that sets it wasn't surfaced.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No mention of widget-milestone-to-victory automation.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md` per earlier grep.
**PlannedExpansionCard:** not searched separately.
**CLAUDE.md convention mention:** no convention specifically naming widget-milestone-to-victory automation.

### Field 5 — What was NOT checked

- Whether a client-side hook in widgets code path writes `victories` with `source='widget_milestone'` on threshold-reached — did not grep widget hooks for `createVictory` + widget context.
- Whether PRD-10 Phase B built the widget→victory automation (milestone threshold detection) or whether it shipped as source-enum-only.
- Semantic-search question: is there a detector function like `detectMilestoneReached` or `createMilestoneVictory`? (mgrep blocked.)
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

`widget_milestone` exists as a victory.source enum value in migration 100102:40 and TypeScript type (`src/types/victories.ts:13`). Grep surfaced no migration trigger automating widget_data_points → victories insertion, and no client hook named for that transition. Registry claims ✅ Wired (Phase 12, PRD-11 AIR). AI patterns doc lists it under AIR. Presence of the enum and display label is confirmed; the automation that sets `source='widget_milestone'` during runtime was not identified.

## Entry 117 — `Auto-victory from task completions`

**Registry line:** 117
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Auto-victory from task completions | PRD-11 | PRD-11 (AIR) | ✅ Wired | Phase 12 |
```

### Field 1 — Implementation identifier

(a) Stub references AIR again.
(c) `claude/ai_patterns.md` AIR table: "Task completion | `task_completion` | Task marked complete".
(d.5) `grep 'source: 'task_completion'` in src → one TODO comment at `src/components/tasks/useTaskCompletion.ts:108`: `// if (task.victory_flagged) { create_victory({ source: 'task_completion', source_reference_id: task.id }) }`. `grep 'source: 'task_completed'` (with past-tense 'd') → `src/components/victories/VictorySuggestions.tsx:83` + `src/hooks/useTasks.ts:325` (latter is in homeschool_time_logs insert, not victory insert).

```
Source: src/components/tasks/useTaskCompletion.ts:108 (commented-out TODO) + src/components/victories/VictorySuggestions.tsx:83 (manual claim from suggestion scan)
Identifier: victory-from-task is MANUAL via VictorySuggestions (scan-and-claim UI), not automatic on completion
```

### Field 2 — Code presence check

```
Grep command: pattern="source: 'task_completed'", path=src, output_mode=content
Hits: 2 (same grep showed 'list_item_completed' / 'list_completed' as separate values)
Files:
  - src/pages/Lists.tsx:1521 "source: 'list_item_completed'"
  - src/pages/Lists.tsx:1537 "source: 'list_completed'"
  - src/components/victories/VictorySuggestions.tsx:83 "source: 'task_completed'"
  - src/hooks/useTasks.ts:325 "source: 'task_completed'" — confirmed inside homeschool_time_logs insert, NOT a victory insert
```

```
Grep command: pattern='victory_flagged', path=src
Hits: 15+ references across useTaskCompletion.ts, useTasks.ts, Tasks.tsx, Lists.tsx, useSequentialCollections.ts, types files.
useTaskCompletion.ts comment at line 8 says "Create victory if victory_flagged (stub — PRD-11)"; line 106-108 has commented-out auto-create.
```

```
Grep command: pattern='task_completion.*victor|victor.*task_complet|auto_victor', output_mode=files_with_matches
Hits: 22 files, none showing a trigger or hook that auto-creates a victory on task_completions INSERT.
```

### Field 3 — Wiring check

VictorySuggestions.tsx scans activity log for completed-task signals and presents "suggested victories" the user then claims explicitly — this is suggest-not-auto. useTaskCompletion.ts has a TODO comment at lines 6-8 + 106-108 that explicitly describes the auto-create as a "(stub — PRD-11)". No migration trigger found that creates `victories` rows from `task_completions` inserts.

Secondary wired pathway: Lists.tsx lines 1521/1537 DO auto-create victories on `list_item_completed` and `list_completed` (with `victory_flagged=true` items), per the PRD-09B List Victory Mode build. That's adjacent but not the task-completion path.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** "List Victory Mode (PRD-09B)" section (lines ~170-180) describes list-side auto-victories. No row describes auto-victory from task completions.
**Cross-PRD addendum mentions:** not specifically searched for this capability.
**PlannedExpansionCard:** none for task-auto-victory.
**CLAUDE.md convention mention:** Convention 117 mentions "Events by mom auto-approved" but that's about calendar events, unrelated.

### Field 5 — What was NOT checked

- Whether `useApproveTaskCompletion` or `useApproveCompletion` (the approval path) creates a victory — did not open those hooks.
- Whether `useSequentialCollections.ts` (which also has `victory_flagged: false` at lines 160, 412) has a completion-victory flow.
- Whether any pg trigger exists on `task_completions` INSERT — did not grep for `AFTER INSERT ON task_completions`.
- Semantic question: is "Auto-victory" in the stub a shorthand for VictorySuggestions scan-and-suggest UX, not a strict "auto" trigger? (Founder judgment.)

### Field 6 — Observations (no verdict)

`useTaskCompletion.ts` lines 6-8 + 106-108 has a commented-out auto-victory create with an explicit "(stub — PRD-11)" note; the surrounding code does NOT uncomment or inline the call. `VictorySuggestions.tsx:83` presents completed tasks as suggested victories for user claim (manual accept). Lists.tsx lines 1521/1537 DO auto-create victories for list-item / list-completion when `victory_flagged=true`. Registry claims ✅ Wired for tasks specifically. Evidence shows list-side auto-victory wired; task-side remains a stub TODO in the hook file; VictorySuggestions offers a scan-and-claim suggestion UX as an alternative surface.

## Entry 119 — `Complex goal → Project Planner`

**Registry line:** 119
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Complex goal → Project Planner | PRD-12A | PRD-29 | ✅ Wired | Phase 33 |
```

### Field 1 — Implementation identifier

(a) Stub row names "Project Planner" — this is the BigPlans PRD (PRD-29).
(d) `prds/` glob did not find a BigPlans directory or source tree files. Route defined in `src/App.tsx:177`.
(d.5) `src/App.tsx:177` references `BigPlansPage`; `src/pages/placeholder/index.tsx:58-60` defines `BigPlansPage` as a `<PlaceholderPage>` with prd="PRD-29" and featureKey="bigplans_create".

```
Source: src/pages/placeholder/index.tsx:58-60 — "export function BigPlansPage() { return <PlaceholderPage title='BigPlans' ... prd='PRD-29' featureKey='bigplans_create' /> }"
Identifier: BigPlansPage placeholder; no real implementation
```

### Field 2 — Code presence check

```
Grep command: pattern='BigPlansPage', path=src
Hits: 3 files
Files:
  - src/App.tsx (route registration)
  - src/pages/placeholder/index.tsx:58-60 (PlaceholderPage definition)
  - src/features/permissions/ViewAsModal.tsx (reference in feature list)
```

```
Grep command: pattern='plans|plan_milestones|BigPlans', path=supabase/migrations
Hits: 4 files — all existing migrations reference `related_plan_id` foreign key stubs or seed PRD-29 placeholders. No `plans` or `plan_milestones` CREATE TABLE statements.
```

```
Grep command: pattern='related_plan_id', path=src
Hits: src/types/tasks.ts:285 ("related_plan_id: string | null"); src/hooks/useJournal.ts (column reference only).
Only stub FK column exists on tasks and journal_entries.
```

### Field 3 — Wiring check

BigPlansPage is a `<PlaceholderPage>` with no real project-planner UI. No `plans` or `plan_milestones` tables in migrations. FK column `related_plan_id` exists on tasks + journal_entries as stubbed forward-compatibility only.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No BigPlans section.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-29-Cross-PRD-Impact-Addendum.md` listed in feature_glossary.md.
**PlannedExpansionCard:** `feature_expansion_registry.ts` has `bigplans` entries per earlier grep.
**CLAUDE.md convention mention:** no numbered convention for BigPlans.

### Field 5 — What was NOT checked

- Whether PlaceholderPage renders a PlannedExpansionCard via feature_expansion_registry.
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

BigPlansPage is a placeholder component at `src/pages/placeholder/index.tsx:58-60` with prd="PRD-29" and featureKey="bigplans_create". Route registered in App.tsx:177. No `plans` or `plan_milestones` tables exist in migrations. The `tasks.related_plan_id` column exists as a stub FK. Registry claims ✅ Wired Phase 33. Evidence shows only a placeholder page and stub FK column — no BigPlans functionality.

## Entry 120 — `Family Vision Quest discussions`

**Registry line:** 120
**Claimed status:** `🔗 Partial (audio stub)`
**Full registry row:**
```
| Family Vision Quest discussions | PRD-12B | PRD-12B | 🔗 Partial (audio stub) | Phase 22 |
```

### Field 1 — Implementation identifier

(a) Stub row says "audio stub" — a specific sub-capability. No concrete identifier named.
(c) CLAUDE.md has no convention specific to Vision Quest.
(d) PRD-12B is `prds/personal-growth/PRD-12B-Family-Vision-Quest.md` (per grep).
(d.5) `grep 'vision_section_discussions' across repo` → 14 files, including `supabase/migrations/00000000000007_lila_ai_system.sql` + `00000000000013_lila_schema_remediation.sql` (seeds the table), `claude/feature_glossary.md` (registers the table), `src/config/feature_expansion_registry.ts`, `src/lib/ai/context-assembly.ts` (stub in context loader). No `src/pages/` or `src/features/` file for Family Vision Quest surfaced in glob `FamilyVision*`.

```
Source: supabase/migrations/00000000000007_lila_ai_system.sql (table seed) + feature_glossary.md
Identifier: vision_section_discussions table (exists); no UI page/component surfaced in src/
```

### Field 2 — Code presence check

```
Grep command: pattern='vision_section_discussions|family_vision_quest'
Hits: 14 files; UI-side files are context-assembly stub + feature_expansion_registry (PlannedExpansionCard) only.
```

```
Glob command: src/pages/FamilyVision*.tsx / **/family-vision/**
Hits: 0 UI directories or pages.
```

### Field 3 — Wiring check

Table schema exists per feature_glossary ("vision_section_discussions"). No page, no hook named `useFamilyVision*`, no component directory. feature_expansion_registry.ts and lib/ai/context-assembly.ts reference the feature, consistent with stub-level surface only.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** No Family Vision Quest section.
**Cross-PRD addendum mentions:** none surfaced in this grep.
**PlannedExpansionCard:** present via feature_expansion_registry.ts per earlier grep.
**CLAUDE.md convention mention:** None specifically.

### Field 5 — What was NOT checked

- Whether `src/pages/placeholder/index.tsx` has a `FamilyVisionPage` / `VisionQuestPage` placeholder entry like BigPlansPage. Did not open placeholder/index.tsx in full.
- Whether the "audio stub" specifically refers to voice-recording of discussion responses (which would point to `whisper-transcribe` Edge Function) or to a different audio feature.
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

Table `vision_section_discussions` exists in migration seed and feature_glossary. No source-tree page or hook named for Family Vision Quest surfaced in `src/pages/`, `src/hooks/`, or `src/features/` via glob. feature_expansion_registry + context-assembly stubs corroborate post-MVP surface. Registry claims 🔗 Partial (audio stub). Evidence is consistent with table-only + PlannedExpansionCard stub; "discussions" UI not surfaced.

<!-- PROGRESS MARKER: completed entries 111, 112, 114, 115, 116, 117, 119, 120 (8 of 39); integrity check pending -->

## Entry 129 — `Family Meeting Notes structured routing`

**Registry line:** 129
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Family Meeting Notes structured routing | PRD-13 | PRD-16 (Build P) | ✅ Wired | 2026-04-15 — Meeting summaries auto-save to `journal_entries` with `entry_type='meeting_notes'` on Save & Close |
```

### Field 1 — Implementation identifier

(a) Stub row names `journal_entries` table, `entry_type='meeting_notes'` value, and "Save & Close" flow as the mechanism. Level (a).

```
Source: stub entry line 129
Identifier: entry_type='meeting_notes' on journal_entries + completeMeeting save flow
```

### Field 2 — Code presence check

```
Grep command: pattern='entry_type.*meeting_notes|meeting_notes', path=src, output_mode=content
Hits: 6
Files:
  - src/hooks/useJournal.ts:6 "type JournalEntryType = ... | 'meeting_notes' | 'transcript'"
  - src/hooks/useJournal.ts:32 "{ value: 'meeting_notes', label: 'Meeting Notes' }"
  - src/lib/meetings/completeMeeting.ts:7 "3. Auto-save summary as a journal entry (entry_type='meeting_notes')"
  - src/lib/meetings/completeMeeting.ts:54 comment "3. Auto-save summary as journal entry (meeting_notes)"
  - src/lib/meetings/completeMeeting.ts:61 "entry_type: 'meeting_notes',"
  - src/lib/meetings/completeMeeting.ts:63 "tags: ['meeting_notes', meeting.meeting_type],"
  - src/components/shared/RoutingStrip.tsx:90 "{ key: 'meeting_notes', label: 'Meeting Notes' }"
```

### Field 3 — Wiring check

`completeMeeting.ts` is the primary wire: meeting Save & Close flow inserts a `journal_entries` row with `entry_type='meeting_notes'` + tags array `['meeting_notes', meeting.meeting_type]`. `useJournal` registers it as a valid entry_type with display label.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** not specifically searched for this entry, but convention 239 + 240 cover the wiring.
**Cross-PRD addendum mentions:** PRD-16-Meetings.md is source.
**PlannedExpansionCard:** not applicable.
**CLAUDE.md convention mention:** Convention 239: "Meeting summaries auto-save to journal with `entry_type='meeting_notes'` on Save & Close. Automatic, not user-triggered." Matches stub.

### Field 5 — What was NOT checked

- Whether existing journal_entries rows with `entry_type='meeting_notes'` actually exist in live DB (would need SQL access).
- Whether `PostMeetingReview.tsx` (seen in earlier grep) also triggers the save or only `completeMeeting.ts`.
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

`completeMeeting.ts` lines 54-63 inserts a journal_entries row with `entry_type='meeting_notes'` and tags including the meeting_type, during meeting Save & Close. `useJournal` registers the entry_type. CLAUDE.md Convention 239 codifies the behavior. Registry claims ✅ Wired 2026-04-15 (Build P). Evidence aligns.

## Entry 130 — `Partner Profile aggregation in Archives`

**Registry line:** 130
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Partner Profile aggregation in Archives | PRD-13 | PRD-19 | ⏳ Unwired (MVP) | Phase 20 (PRD-19) |
```

### Field 1 — Implementation identifier

(a) Stub row does not name a concrete identifier; only capability ("Partner Profile aggregation").
(b) WIRING_STATUS.md has no matching section.
(c) CLAUDE.md has no convention naming Partner Profile aggregation.
(d) PRD-19 (Family Context & Relationships) owns the wiring target. Relevant table per feature_glossary: `relationship_notes` (PRD-19 scope).
(d.5) Lookup inside `relationship_notes` — it's a migration-seeded table in `lila_ai_system.sql` and `thoughtsift_tables.sql`, but `grep 'partner_profile|Partner Profile' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY — no concrete "Partner Profile aggregation" implementation identifier found.
Sources checked:
  (a) stub line 130 — no identifier named
  (b) WIRING_STATUS.md — no Partner Profile row
  (c) CLAUDE.md conventions — no match
  (d) PRD-19 owns this; feature_glossary lists `relationship_notes` + `private_notes` + `member_documents` as PRD-19 tables, but none named "partner_profile_aggregation"
```

### Field 2 — Code presence check

skipped — no concrete identifier to grep for. Related-table grep for `partner_profile` (src) returned zero. `relationship_notes` table has 3 migration files but none show aggregation logic.

### Field 3 — Wiring check

skipped — no concrete identifier.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** not specifically checked; PRD-19 Cross-PRD addendum exists per PRE_BUILD_PROCESS.md table.
**PlannedExpansionCard:** not searched.
**CLAUDE.md convention mention:** none.

### Field 5 — What was NOT checked

- Whether PRD-19 defines a specific partner_profile view or aggregation query.
- Semantic-search question: "does any existing code aggregate across relationship_notes + archive_context_items under a partner-focused view?" — mgrep would help; Convention 242 blocks.
- Whether Archives page has a "Partner Profile" section that is a stub renderer.

### Field 6 — Observations (no verdict)

Capability-only entry; evidence-by-grep not applicable. No implementation identifier found. Flagged for founder-judgment bucket. Registry claims ⏳ Unwired (MVP) at Phase 20 (PRD-19) — PRD-19 itself is not yet built per STUB_REGISTRY references, so the "Unwired" claim is consistent with the absence of any aggregation code.

## Entry 134 — `Monthly victory auto-archive`

**Registry line:** 134
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Monthly victory auto-archive | PRD-13 | PRD-11 | 📌 Post-MVP | PRD-11 enhancement |
```

### Field 1 — Implementation identifier

(a) No concrete identifier in stub.
(b) WIRING_STATUS.md: none.
(c) CLAUDE.md: none.
(d) PRD-11 owns; PRD-13 created. `grep 'monthly.*archive|auto_archive_victor'` surfaced only doc files — no implementation.

```
Identifier: CAPABILITY-ONLY — no concrete implementation identifier.
Sources checked: stub row, WIRING_STATUS, CLAUDE.md conventions, PRD doc files — all capability descriptions only.
```

### Field 2-4

Skipped — no identifier to grep for.

### Field 5 — What was NOT checked

- Whether a pg_cron monthly job exists in any migration targeting `victories` for archival — would need broader grep.
- Whether `monthly-aggregate` Edge Function (mentioned in architecture.md) has a victory-archive component.

### Field 6 — Observations (no verdict)

Capability-only entry. Registry claims 📌 Post-MVP. No implementation code grep hits. Consistent with Post-MVP status.

## Entry 135 — `Seasonal Family Overview prompts`

**Registry line:** 135
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Seasonal Family Overview prompts | PRD-13 | PRD-18 | 📌 Post-MVP | Rhythm PRD |
```

### Field 1 — Implementation identifier

(a) No concrete identifier named.
(b)-(d) None surfaced.
`grep 'seasonal.*overview|seasonal_prompt' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `reflection_prompts` table has a seasonal-tag column or seeded seasonal rows — did not open the table.
- PRD-18 Rhythms Phase B/C/D did not surface seasonal-prompt wiring.

### Field 6 — Observations (no verdict)

Capability-only entry. Registry claims 📌 Post-MVP. Grep returned zero implementation hits. Consistent.

## Entry 136 — `Archive full-text search`

**Registry line:** 136
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Archive full-text search | PRD-13 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'archive.*search|fts_archive|searchArchive|useArchiveSearch'` → 1 file (`src/data/lanterns-path-data.ts`, likely unrelated label). No hook or function named for this.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `archive_context_items` has an `fts_document tsvector` column (migration check not opened).

### Field 6 — Observations (no verdict)

Capability-only. Registry claims 📌 Post-MVP. Zero implementation grep hits. Consistent.

## Entry 137 — `Dad edit access in Archives`

**Registry line:** 137
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Dad edit access in Archives | PRD-13 | — | 📌 Post-MVP | Read-only at MVP |
```

### Field 1 — Implementation identifier

(a) No concrete identifier; row text says "Read-only at MVP" — policy rather than implementation name.
(c) CLAUDE.md mentions dad-role access in numerous conventions but none naming a specific archive-edit mechanism for additional_adult.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped (but note: Archives RLS policies per migration `prd13_archives_context.sql` would be the authoritative answer for the read-only-dad policy — not opened).

### Field 5 — What was NOT checked

- Whether RLS policies on `archive_folders` / `archive_context_items` grant `additional_adult` role WRITE access — would need to open migration 100035 and read policy definitions.

### Field 6 — Observations (no verdict)

Capability-only entry. Registry claims 📌 Post-MVP with "Read-only at MVP" note. RLS-level verification deferred.

## Entry 140 — `Context presets / smart modes`

**Registry line:** 140
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Context presets / smart modes | PRD-13 | PRD-05C | 📌 Post-MVP | PRD-05C enhancement |
```

### Field 1 — Implementation identifier

(a) Stub row names "Context presets" — matches table name `context_presets`.
(b) WIRING_STATUS.md: no section.
(c) CLAUDE.md: none specifically.
(d) live_schema.md marks `context_presets` as "not API-exposed" (table exists in DB but not in PostgREST schema cache).

```
Source: claude/live_schema.md — "context_presets — not API-exposed"
Source: supabase/migrations/00000000000007_lila_ai_system.sql (seeds the table)
Identifier: context_presets table (exists, not API-exposed)
```

### Field 2 — Code presence check

```
Grep command: pattern='context_presets', output_mode=files_with_matches
Hits: 10 files — all in schema dumps, feature_glossary, migrations (seed), PRD-05C, audit docs. None in src/components/ or src/hooks/ UI code.
```

### Field 3 — Wiring check

Table exists per migration. No UI hook or component surfaced. Not exposed via PostgREST API.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** PRD-05C (LiLa Optimizer) is the Wired By target.
**PlannedExpansionCard:** not separately searched.
**CLAUDE.md convention mention:** none direct.

### Field 5 — What was NOT checked

- Whether PRD-05C build added any UI surface for context_presets — did not open PRD-05C feature decision file.

### Field 6 — Observations (no verdict)

Table exists in migrations but not API-exposed. No UI references. Registry claims 📌 Post-MVP. Consistent — table-only, no runtime surface.

## Entry 150 — `Push notification delivery`

**Registry line:** 150
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Push notification delivery | PRD-15 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No identifier in row.
(c) CLAUDE.md Convention 144: "NotificationBell lives in shell headers... Reuses BreathingGlow when unread > 0. Bell shows 'what happened' (awareness)." But this is in-app bell, not push.
`grep 'push_notification|webpush|serviceWorker.*push|pushSubscription' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `notifications.delivery_method` column (per live_schema) ever takes a 'push' value and whether a dispatch function exists.

### Field 6 — Observations (no verdict)

Capability-only entry. Zero implementation grep hits. Registry claims 📌 Post-MVP. Consistent.

## Entry 152 — `Out of Nest SMS notifications`

**Registry line:** 152
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Out of Nest SMS notifications | PRD-15 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'sms|twilio|phone.*send.*notif' path=src` → only 1 hit in ChildAllowanceConfig.tsx (unrelated to SMS delivery).
`grep 'out_of_nest.*sms'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `out_of_nest_members.phone` column is surfaced in any compose path beyond settings — partial check only.
- Whether an Edge Function like `send-sms` exists in `supabase/functions/` — did not glob Edge Functions.

### Field 6 — Observations (no verdict)

Capability-only. Zero relevant grep hits. Registry claims 📌 Post-MVP. Consistent.

## Entry 153 — `Out of Nest compose picker`

**Registry line:** 153
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Out of Nest compose picker | PRD-15 | PRD-15 Phase E | ⏳ Unwired (MVP) | `useMessagingPermissions` only reads `family_members`. Extension point: fetch from `out_of_nest_members` table too and merge results. Per Tenise (2026-04-06), Out of Nest ranks **higher** than Special Adults in picker priority. See TODO comment in `src/hooks/useMessagingPermissions.ts`. |
```

### Field 1 — Implementation identifier

(a) Stub row names `useMessagingPermissions` hook and `out_of_nest_members` table by name + TODO location. Level (a) with multiple identifiers.

```
Source: stub line 153
Identifiers:
  - useMessagingPermissions hook (src/hooks/useMessagingPermissions.ts)
  - out_of_nest_members table
  - TODO comment inside the hook
```

### Field 2 — Code presence check

```
Grep command: pattern='useMessagingPermissions', path=src
Hits: file exists at src/hooks/useMessagingPermissions.ts.
```

Read of `src/hooks/useMessagingPermissions.ts` lines 57-64 shows the TODO block verbatim:

```
// TODO (Out of Nest messaging, PRD-15 Phase E): When Out of Nest messaging
// is built, this hook must ALSO fetch from the `out_of_nest_members` table
// and merge the results — they are a separate contact source, not part of
// `family_members`. Per Tenise (2026-04-06), Out of Nest members are higher
// priority than Special Adults in the compose picker — surface them as a
// first-class group, not an afterthought. The merge likely needs a new
// `contactSource: 'family' | 'out_of_nest'` field on PermittedContact so
// the UI can render them distinctly.
```

Line 65-67 shows the current filter: `activeMembers = allMembers.filter(m => m.is_active && !m.out_of_nest && m.id !== memberId)` — explicitly excludes `out_of_nest=true` rows from `family_members`, with no merge from `out_of_nest_members` table.

### Field 3 — Wiring check

Hook currently reads only `family_members` via `useFamilyMembers(familyId)` and filters out `out_of_nest` flag. `out_of_nest_members` table not queried in this hook. TODO block at lines 57-64 is the exact extension point. Caller: `useCanMessage` at lines 120-125 delegates to `useMessagingPermissions`. UI callers not traced in this packet.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** not specifically searched but not expected — TODO-based stubs usually aren't in WIRING_STATUS.
**Cross-PRD addendum mentions:** `prds/addenda/PRD-15-Cross-PRD-Impact-Addendum.md` surfaced earlier.
**PlannedExpansionCard:** not applicable.
**CLAUDE.md convention mention:** Convention 142 ("Out of Nest members live in `out_of_nest_members`, NOT `family_members`") and Convention 147 (Content Corner) corroborate the table separation. Convention 140 describes messaging permission architecture.

### Field 5 — What was NOT checked

- Whether any ComposeFlow UI reads from `out_of_nest_members` directly, bypassing `useMessagingPermissions` — would need to grep ComposeFlow.tsx.
- Whether PRD-15 Phase E has a feature-decision file already.

### Field 6 — Observations (no verdict)

`src/hooks/useMessagingPermissions.ts` lines 57-64 contains a TODO block matching the stub registry description verbatim (mentions PRD-15 Phase E, `out_of_nest_members` table merge, Tenise 2026-04-06 priority note, Special Adult ranking). Current implementation reads only `family_members` and excludes `out_of_nest` rows (line 66). Registry claims ⏳ Unwired (MVP). Evidence aligns.

## Entry 154 — `Morning digest/Daily Briefing`

**Registry line:** 154
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Morning digest/Daily Briefing | PRD-15 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'morning_digest|daily_briefing|DailyBriefing'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether Rhythms "Morning Check-in" (teen) or "Morning Rhythm" (adult) in PRD-18 Phase B/C/D counts as the morning-digest surface under a different name. Convention 169-196 cover rhythms morning seeds.

### Field 6 — Observations (no verdict)

Capability-only. Zero grep hits for this specific term. Registry claims 📌 Post-MVP. Partition-file note that Rhythms Phase B-D did ship morning rhythm cards; whether "Morning digest/Daily Briefing" is a separate concept or the same thing under a different name is a founder-judgment call.

## Entry 155 — `Meeting gamification connection`

**Registry line:** 155
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Meeting gamification connection (attendance streaks, facilitator badges) | PRD-16 | PRD-24 | ⏳ Unwired (MVP) | Schema supports facilitator_member_id; gamification pipeline not connected |
```

### Field 1 — Implementation identifier

(a) Stub row names `facilitator_member_id` column + "gamification pipeline" as the connection point.

```
Source: stub line 155
Identifier: facilitator_member_id column on meetings table + (disconnected) gamification pipeline (roll_creature_for_completion)
```

### Field 2 — Code presence check

```
Grep command: pattern='facilitator_member_id|meeting.*gamification|meeting.*streak'
Hits: 9 files
Files:
  - src/types/meetings.ts
  - src/components/meetings/StartMeetingModal.tsx
  - src/hooks/useMeetings.ts
  - supabase/functions/lila-chat/index.ts
  - supabase/migrations/00000000100146_meetings.sql (column definition line 18)
  - prds/communication/PRD-16-Meetings.md
  - claude/feature-decisions/PRD-16-Meetings.md
Migration 100146 line 18: "facilitator_member_id UUID REFERENCES public.family_members(id), -- family council facilitator"
```

No grep hits for `meeting.*streak` in source — streak/gamification tie-in to meetings not found.

### Field 3 — Wiring check

Column exists in `meetings` table. UI uses it for family council facilitator assignment. No code path surfaces that increments gamification points or streaks on meeting completion. `roll_creature_for_completion` RPC is keyed to `task_completions`, not meetings.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**CLAUDE.md convention mention:** Conventions 229-240 cover Meetings architecture; no convention ties meetings to gamification.

### Field 5 — What was NOT checked

- Whether PRD-16 Build P verification table flagged this as Stubbed or Missing.
- Whether any meeting_completion → gamification RPC variant exists.

### Field 6 — Observations (no verdict)

`facilitator_member_id` column is present in migration 100146 and used in code. No meeting-to-gamification pipeline found. Registry claims ⏳ Unwired (MVP) with note "Schema supports facilitator_member_id; gamification pipeline not connected." Evidence aligns.

## Entry 157 — `Meeting voice input/recording (Record After)`

**Registry line:** 157
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Meeting voice input/recording (Record After) | PRD-16 (Build P) | — | 📌 Post-MVP | Premium tier, voice recording for meetings |
```

### Field 1 — Implementation identifier

(a) Stub row names "Record After" as a mode name.
(d.5) StartMeetingModal.tsx:151 shows `mode === 'record_after'` as a selectable option. Opening didn't reveal MediaRecorder / audio capture wiring.

```
Source: src/components/meetings/StartMeetingModal.tsx:151 — mode selector with 'record_after' value
Identifier: `mode='record_after'` in meetings schema and UI; no voice-capture implementation
```

### Field 2 — Code presence check

```
Grep command: pattern='record_after|Record After', path=src
Hits: 7 files (MeetingsPage.tsx, meetings types, StartMeetingModal.tsx, help-patterns, completeMeeting.ts, MeetingHistoryView.tsx, MeetingConversationView.tsx).
StartMeetingModal shows radio card UI for 'record_after' mode.
```

```
Grep command: pattern='voice.*record|MediaRecorder|audio.*record', path=src/components/meetings
Hits: 0 — no voice-capture component in meetings directory.
```

### Field 3 — Wiring check

`mode` column in `meetings` table accepts 'record_after' value (per migration 100146:17 CHECK constraint). UI renders a mode-selector card. No voice-capture plumbing attached.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**CLAUDE.md convention mention:** none naming voice-recording for meetings specifically.

### Field 5 — What was NOT checked

- Whether `whisper-transcribe` Edge Function is linkable from the meeting flow — not opened.
- Whether Voice input is wired elsewhere (it is, per Convention 59 — Notepad/LiLa have voice input via `useVoiceInput` hook) and might be re-usable for meetings.

### Field 6 — Observations (no verdict)

Meeting `mode='record_after'` is selectable in StartMeetingModal.tsx:151 and stored on meetings table. No audio-capture code in `src/components/meetings`. Registry claims 📌 Post-MVP "Premium tier, voice recording for meetings." Evidence aligns with the mode-only (no voice) claim.

## Entry 158 — `Meeting transcription + Review & Route from voice`

**Registry line:** 158
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Meeting transcription + Review & Route from voice | PRD-16 (Build P) | — | 📌 Post-MVP | Requires voice recording pipeline |
```

### Field 1 — Implementation identifier

(a) Capability — depends on entry 157 first (voice recording).

```
Identifier: CAPABILITY-ONLY (dependent on entry 157)
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `whisper-transcribe` Edge Function has a meeting-mode parameter.

### Field 6 — Observations (no verdict)

Capability-only dependent on entry 157. Registry claims 📌 Post-MVP. Consistent.

## Entry 159 — `Goals routing destination from meeting action items`

**Registry line:** 159
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Goals routing destination from meeting action items | PRD-16 (Build P) | PRD-29 (BigPlans) | ⏳ Unwired (MVP) | Goals disabled in compact routing strip until BigPlans built |
```

### Field 1 — Implementation identifier

(a) Stub names "compact routing strip" + "Goals" destination. RoutingStrip is the component.
(d.5) `src/components/shared/RoutingStrip.tsx:132` — `meeting_action: ['tasks', 'best_intentions', 'calendar', 'list', 'backburner', 'skip']`. "goals" is absent from this array.

```
Source: src/components/shared/RoutingStrip.tsx:132 — meeting_action destination array
Identifier: absence of 'goals' from meeting_action destinations array
```

### Field 2 — Code presence check

```
Grep command: pattern='meeting_action', path=src
Hits: 8 files (Tasks.tsx, TaskCreationModal.tsx, PostMeetingReview.tsx, completeMeeting.ts, types/tasks.ts, SortTab.tsx, RoutingStrip.tsx, BatchCard.tsx).
RoutingStrip.tsx:27 declares 'meeting_action' as a context type.
RoutingStrip.tsx:132 lists destinations — 'goals' is NOT in the array.
```

### Field 3 — Wiring check

Meeting action items route through `meeting_action` context, which excludes 'goals'. Post-meeting review uses this context, so goals cannot be a destination choice.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** not specifically.
**CLAUDE.md convention mention:** Convention 231: "Action items ALWAYS route through Studio Queue with source='meeting_action'" — consistent.

### Field 5 — What was NOT checked

- Whether PRD-29 (BigPlans) build will add 'goals' to `meeting_action` destination array or whether a new context type is planned.

### Field 6 — Observations (no verdict)

RoutingStrip.tsx:132 `meeting_action` destinations array does not include 'goals'. Registry's "Goals disabled in compact routing strip until BigPlans built" aligns. BigPlans (PRD-29) itself is a placeholder page per entry 119.

## Entry 160 — `LiLa section suggestions for custom templates`

**Registry line:** 160
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| LiLa section suggestions for custom templates | PRD-16 (Build P) | — | ⏳ Unwired (MVP) | Full Magic tier; simple text generation at launch |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'lila.*section.*suggestion|suggest.*meeting.*section'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether PRD-16 Build P verification table mentions this stub explicitly.

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation grep hits. Registry claims ⏳ Unwired (MVP) Full Magic tier. Consistent.

## Entry 161 — `Family council voting system`

**Registry line:** 161
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Family council voting system | PRD-16 (Build P) | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'council.*vote|voting_system|family_vote'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether any schema has a `votes` / `member_votes` table — did not broader-search.

### Field 6 — Observations (no verdict)

Capability-only. Registry claims 📌 Post-MVP. Consistent.

## Entry 162 — `"Refer back to decisions" cross-conversation intelligence`

**Registry line:** 162
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| "Refer back to decisions" cross-conversation intelligence | PRD-16 (Build P) | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'refer.*back.*decision|cross_conversation_intel'` → 2 files (CLAUDE.md and LESSONS_LEARNED.md) — no implementation in src/.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `lila_conversations.context_snapshot` JSONB has a cross-conversation reference mechanism.

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation grep hits. Registry claims 📌 Post-MVP. Consistent.

<!-- PROGRESS MARKER: completed entries 111-162 subset (20 of 39); registry integrity check at 547 confirmed -->

## Entry 166 — `MindSweep approval learning`

**Registry line:** 166
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| MindSweep approval learning | PRD-17B | PRD-17B | ✅ Wired | Phase 18 |
```

### Field 1 — Implementation identifier

(a) Stub references PRD-17B's MindSweep. Capability name "approval learning" maps to `mindsweep_approval_patterns` table (per grep).
(d.5) `useMindSweep.ts:529` confirms insert into `mindsweep_approval_patterns`.

```
Source: src/hooks/useMindSweep.ts:529 — ".from('mindsweep_approval_patterns').insert({ ... })"
Identifier: mindsweep_approval_patterns table + useMindSweep approval-insert mutation
```

### Field 2 — Code presence check

```
Grep command: pattern='mindsweep_approval_patterns|approval_patterns', output_mode=files_with_matches
Hits: 14 files
Files (selected):
  - src/hooks/useMindSweep.ts:529 (insert mutation)
  - supabase/migrations/00000000100089_mindsweep_tables.sql (CREATE TABLE)
  - claude/feature-decisions/PRD-17B-MindSweep*.md
  - prds/communication/PRD-17B-MindSweep.md
```

Context (useMindSweep.ts:519-540):
```
mutationFn: async (params: {
  familyId: string; memberId: string; contentCategory: string;
  actionTaken: 'approved_unchanged' | 'approved_edited' | 'rerouted' | 'dismissed';
  suggestedDestination: string | null; actualDestination: string | null
}) => {
  const { error } = await supabase.from('mindsweep_approval_patterns').insert({ ... })
}
```

### Field 3 — Wiring check

Mutation inserts pattern row with action_taken + content_category + suggested/actual destinations. Table created in migration 100089 (PRD-17B MindSweep tables). Pattern rows would feed future classifier improvement (platform intelligence Channel J, per ai_patterns.md).

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** `mindsweep_approval_patterns` table appears in live_schema.md note (not API-exposed for that table? — check: the table is in `mindsweep_approval_patterns` which live_schema.md marks "not API-exposed").
**Cross-PRD addendum mentions:** PRD-17B own PRD.
**CLAUDE.md convention mention:** Convention 180-182 describe MindSweep-Lite (rhythm-embedded) reusing `mindsweep-sort`; not specifically the approval-learning write-back.

### Field 5 — What was NOT checked

- Whether the client hook is actually called from a real user flow (approval UI) — didn't trace to SortTab.tsx / CalendarTab.tsx approval buttons.
- Whether the recorded patterns feed a downstream classifier.

### Field 6 — Observations (no verdict)

Insert mutation exists at useMindSweep.ts:529, writes to `mindsweep_approval_patterns` with four action_taken variants. Table seeded in migration 100089. Registry claims ✅ Wired Phase 18. Evidence shows write-path exists; consumption path not traced.

## Entry 167 — `Weekly MindSweep intelligence report`

**Registry line:** 167
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Weekly MindSweep intelligence report | PRD-17B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'weekly.*mindsweep|mindsweep.*weekly.*report|mindsweep.*intelligence'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `mindsweep_approval_patterns` aggregation query would form the report data source.

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation grep hits. Registry claims 📌 Post-MVP. Consistent.

## Entry 174 — `Reflection export as document`

**Registry line:** 174
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Reflection export as document | PRD-18 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'reflection.*export|export.*reflection' path=src` → 2 files, both false-positive (`apology_reflection` subtype string match).

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `reflection_responses` table has a serialization hook somewhere — did not grep that table name.
- Whether Convention 174 "Weekly/Monthly reflection prompts are frontend constants" implies there's no DB source to export from (design decision).

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation hits. Registry claims 📌 Post-MVP. Consistent.

## Entry 187 — `PRD-18 Phase C: MindSweep-Lite delegate disposition → real family_request`

**Registry line:** 187
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| PRD-18 Phase C: MindSweep-Lite `delegate` disposition → real `family_request` | PRD-18 Phase C (Build L) | PRD-18 Phase C follow-up (Build L.1) | ✅ Wired | 2026-04-07 (passes real `family_member_names` to `mindsweep-sort`, promotes cross-member `suggest_route` results to `family_request` disposition, inserts into PRD-15 `family_requests` with `source='mindsweep_auto'` via `commitMindSweepLite`) |
```

### Field 1 — Implementation identifier

(a) Stub row names `commitMindSweepLite`, `mindsweep-sort`, `family_requests` table, `source='mindsweep_auto'`, and `suggest_route` action. Level (a) — multiple identifiers.

```
Source: stub line 187
Identifiers:
  - commitMindSweepLite function (src/lib/rhythm/commitMindSweepLite.ts)
  - mindsweep-sort Edge Function
  - family_requests table with source='mindsweep_auto'
  - cross_member_action='suggest_route' promotion logic
  - family_member_names payload parameter
```

### Field 2 — Code presence check

```
Grep command: pattern='commitMindSweepLite|family_request.*mindsweep|suggest_route.*family_request', output_mode=files_with_matches
Hits: 14 files
Relevant source files:
  - src/lib/rhythm/commitMindSweepLite.ts (main)
  - src/components/rhythms/sections/MindSweepLiteSection.tsx (adult)
  - src/components/rhythms/sections/MindSweepLiteTeenSection.tsx (teen, per Convention 192/197)
  - src/components/rhythms/RhythmModal.tsx
  - src/components/rhythms/RhythmMetadataContext.tsx
```

First-context window (commitMindSweepLite.ts lines 190-220):
```
case 'family_request': {
  // MindSweep-Lite delegate disposition into PRD-15's family_requests
  ...
  if (item.disposition === 'family_request' && !item.recipient_member_id) { ... }
  throw new Error('family_request missing recipient_member_id')
  ...
  .from('family_requests')
  ... source: 'mindsweep_auto' ...
  return { id: data.id as string, type: 'family_request' }
}
```

Line 24 doc comment: "family_request → INSERT family_requests with source='mindsweep_auto'". Line 243 has the critical-rule comment: "this path MUST NEVER reach 'family_request'" (teen `talk_to_someone` path).

### Field 3 — Wiring check

`commitMindSweepLite.ts` case `'family_request'` at line 190-220 inserts into `family_requests` with `source='mindsweep_auto'`, enforcing `recipient_member_id` non-null. Partial failures captured via `commit_error` field (line 146). Teen branch explicitly kept separate (MindSweepLiteTeenSection, per Conventions 192 + 193 + 197).

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** not specifically for this disposition.
**Cross-PRD addendum mentions:** PRD-18 Phase C feature decision file cited.
**CLAUDE.md convention mention:** Convention 180 names `mindsweep-sort` reuse; Convention 182 describes `commitMindSweepLite` as deliberate mirror of `routeDirectly`; Convention 197 describes teen `family_request` as opt-in only (Build N.2). All corroborate the registry's claim.

### Field 5 — What was NOT checked

- Whether `family_requests` rows actually exist in live DB with `source='mindsweep_auto'` (would need SQL).
- Whether teen `MindSweepLiteTeenSection.tsx` correctly excludes the family_request case except via opt-in (per Convention 197).
- No git log for most-recent commit.

### Field 6 — Observations (no verdict)

`commitMindSweepLite.ts` case 'family_request' (lines 190-220) inserts into `family_requests` with `source='mindsweep_auto'`. Separate teen component exists (`MindSweepLiteTeenSection.tsx`). Code comments reinforce Convention 193 that `talk_to_someone` NEVER writes to family_requests. Registry claims ✅ Wired 2026-04-07 Build L.1. Evidence aligns; multiple CLAUDE.md conventions (180, 182, 192, 193, 197) corroborate.

## Entry 196 — `State-specific compliance formatting`

**Registry line:** 196
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| State-specific compliance formatting | PRD-19 | PRD-28B | ✅ Wired | Phase 32 |
```

### Field 1 — Implementation identifier

(a) No concrete identifier; capability-level.
(c) CLAUDE.md has no "state-specific compliance" convention.
(d) PRD-28B (Compliance & Progress Reporting) owns. feature_glossary names `report_templates` + `education_standards` + `esa_invoices` as PRD-28B tables.
(d.5) `grep 'CREATE TABLE.*report_templates|report_templates.*TABLE' path=supabase/migrations` → 0 hits. No `report_templates` migration found.

```
Identifier: CAPABILITY-ONLY — referenced tables (report_templates) not found as CREATE TABLE in migrations
Sources checked:
  (a) stub line 196 — no identifier
  (b) WIRING_STATUS.md — no section
  (c) CLAUDE.md — no convention
  (d) PRD-28B feature_glossary lists tables but CREATE TABLE grep returns 0
```

### Field 2 — Code presence check

```
Grep command: pattern='CREATE TABLE.*report_templates', output_mode=files_with_matches
Hits: 0 — report_templates table does not appear to be created in any migration grep'd this session.
```

```
Grep command: pattern='report_templates|compliance', output_mode=files_with_matches
Hits: 69 files — all doc / PRD / spec / feature_glossary / audit — none in src/ or supabase/migrations/ that create the table.
```

### Field 3 — Wiring check

No compliance-report code found. No `report_templates` table migration. `homeschool_tracking.sql` (100136) mentions "compliance-ready time records" but only for homeschool_time_logs.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**Cross-PRD addendum mentions:** prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md exists.
**CLAUDE.md convention mention:** Convention 226-228 describe homeschool config pattern but not compliance reports.

### Field 5 — What was NOT checked

- Whether PRD-28B is considered built in any BUILD_STATUS.md phase. Registry says "Phase 32" but no Phase 32 confirmation in this grep run.
- Whether an Edge Function `report-generate` (per architecture.md) has state-specific formatting logic — did not open.
- Whether compliance formatting is a client-side template function rather than a DB-stored template.

### Field 6 — Observations (no verdict)

Capability-level stub. feature_glossary lists PRD-28B tables including `report_templates`, but no `CREATE TABLE report_templates` migration found in grep. No state-specific formatting code found in src/. Registry claims ✅ Wired Phase 32. Evidence does not align — suggests either Phase 32 has not landed or the formatting lives in an Edge Function / code path this grep missed. Flagged for founder judgment.

## Entry 198 — `Teen "Tell LiLa About Yourself"`

**Registry line:** 198
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Teen "Tell LiLa About Yourself" | PRD-19 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'tell.*lila.*about|TellLiLa|tell_lila' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether this capability overlaps with `self_discovery` guided mode (PRD-07, InnerWorkings) which IS wired — semantic question (mgrep would help).

### Field 6 — Observations (no verdict)

Capability-only. Zero grep hits for the exact phrase. Registry claims 📌 Post-MVP. Consistent.

## Entry 199 — `Safe Harbor → Library RAG`

**Registry line:** 199
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Safe Harbor → Library RAG | PRD-20 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'safe_harbor.*rag|safe_harbor.*library|safe_harbor.*bookshelf'` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether the `safe-harbor` Edge Function (if it exists) references library/bookshelf extractions — not opened.

### Field 6 — Observations (no verdict)

Capability-only. Registry claims 📌 Post-MVP. Consistent with zero grep hits.

## Entry 200 — `Safe Harbor offline support`

**Registry line:** 200
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Safe Harbor offline support | PRD-20 | PRD-33 | ⏳ Unwired (MVP) | Phase 40 |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'safe_harbor.*offline|offline.*safe_harbor'` → 0 hits.

```
Identifier: CAPABILITY-ONLY (dependent on PRD-33 Offline/PWA)
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- PRD-33 is marked Post-MVP per feature_glossary, so the wiring dependency is not yet in place.

### Field 6 — Observations (no verdict)

Capability-only, dependent on PRD-33 (Offline/PWA) which is Post-MVP. Registry claims ⏳ Unwired (MVP) Phase 40. Consistent.

## Entry 210 — `Optimize with LiLa (full flow)`

**Registry line:** 210
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Optimize with LiLa (full flow) | PRD-21A | PRD-05C | ⏳ Unwired (MVP) | Phase 23 |
```

### Field 1 — Implementation identifier

(a) Stub names "Optimize with LiLa" — maps to LiLa Optimizer (PRD-05C) flow.
(d.5) `src/features/vault/components/detail/PromptPackDetail.tsx:148` has `OptimizeButton` component with explicit STUB comment "Optimizer EF not deployed yet."

```
Source: src/features/vault/components/detail/PromptPackDetail.tsx:148-166
Identifier: OptimizeButton component (stub state); PRD-05C Optimizer Edge Function not deployed
```

### Field 2 — Code presence check

```
Grep command: pattern='optimize.*lila|OptimizeWithLila|lila_optimize', path=src
Hits: 5 files
Files:
  - src/hooks/useNotepad.ts (destination type)
  - src/components/shared/RoutingStrip.tsx (destination key)
  - src/features/vault/components/detail/PromptPackDetail.tsx:148 (OptimizeButton stub)
  - src/features/vault/hooks/useSavedPrompts.ts
  - src/features/vault/pages/PersonalPromptLibraryPage.tsx
```

PromptPackDetail.tsx:148-166 context:
```
function OptimizeButton({ dark }: { dark?: boolean }) {
  // STUB: Optimizer EF not deployed yet. Show a gentle message.
  ...
  // TODO: When PRD-05C Optimizer is built, launch LiLa Optimizer conversation modal
  ...
  title="Optimize with LiLa — coming soon"
  ...
  <Sparkles size={dark ? 10 : 12} /> Optimize
}
```

### Field 3 — Wiring check

Button exists; click handler is a stub (gentle message / coming-soon title). No conversation modal invocation. RoutingStrip registers `'optimizer'` as a destination but path routes to `studio_queue` default branch (same pathway as calendar/agenda/message — entry 112).

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** line 24 (Optimizer in RoutingStrip Destinations): `| Optimizer | Notepad | LiLa Optimizer | Stub | PRD-05C not built |`
**CLAUDE.md convention mention:** no direct convention for this capability.

### Field 5 — What was NOT checked

- Whether `optimizer_outputs` table (per live_schema, not API-exposed) has any rows — not checked.

### Field 6 — Observations (no verdict)

OptimizeButton at PromptPackDetail.tsx:148 is explicit stub: "STUB: Optimizer EF not deployed yet" with TODO "When PRD-05C Optimizer is built, launch LiLa Optimizer conversation modal". WIRING_STATUS.md corroborates. Registry claims ⏳ Unwired (MVP) Phase 23. Evidence aligns.

## Entry 211 — `Deploy with LiLa (skill deployment)`

**Registry line:** 211
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Deploy with LiLa (skill deployment) | PRD-21A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) Stub names "Deploy with LiLa" — maps to SkillDetail.tsx `handleDeployWithLila`.
(d.5) `src/features/vault/components/detail/SkillDetail.tsx:30-33`:
```
const handleDeployWithLila = () => {
  // STUB: Opens Optimizer conversation modal for family-context personalization
  alert('Deploy with LiLa — personalizes with family context. Coming soon!')
}
```

```
Source: src/features/vault/components/detail/SkillDetail.tsx:30-33
Identifier: handleDeployWithLila handler (stub alert only)
```

### Field 2 — Code presence check

```
Grep command: pattern='DeployWithLila|deploy.*lila|lila.*deploy.*skill', path=src
Hits: 1 file (SkillDetail.tsx).
SkillDetail.tsx:30 handleDeployWithLila defined as stub
SkillDetail.tsx:139 onClick handler on button
```

### Field 3 — Wiring check

Button present with onClick; handler is `alert('...Coming soon!')` stub. No conversation modal or tool-permission write.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** not specifically traced.
**CLAUDE.md convention mention:** Convention 88 describes "+Add to AI Toolbox" — adjacent but not Deploy with LiLa.

### Field 5 — What was NOT checked

- Whether the stub is behind a Creator-tier gate.

### Field 6 — Observations (no verdict)

Handler is an alert-only stub with explicit STUB comment. Registry claims 📌 Post-MVP. Evidence aligns.

<!-- PROGRESS MARKER: completed 36 of 39 entries (through 211); registry integrity at 547 confirmed -->

## Entry 215 — `LiLa proactive Vault suggestions`

**Registry line:** 215
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| LiLa proactive Vault suggestions | PRD-21A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'lila.*proactive.*vault|proactive.*vault.*suggest|vault.*suggestion.*lila' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether `lila-assist` Edge Function has a vault-recommendation branch — not opened.

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation grep hits. Registry claims 📌 Post-MVP. Consistent.

## Entry 216 — `Seasonal tag auto-surfacing (date logic)`

**Registry line:** 216
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Seasonal tag auto-surfacing (date logic) | PRD-21A | — | ⏳ Unwired (MVP) | Phase 25 enhancement |
```

### Field 1 — Implementation identifier

(a) Stub names `seasonal_tags` column on vault_items (likely); "date logic" describes the auto-surfacing behavior.
(d.5) `grep 'seasonal_tags'` → 5 files including `supabase/migrations/00000000100039_vault_tables.sql` (column definition) and `prds/ai-vault/PRD-21A-AI-Vault-Browse-Content-Delivery.md`. No src/ implementation grep hit for the auto-surfacing logic.

```
Source: supabase/migrations/00000000100039_vault_tables.sql — seasonal_tags column; also seasonal_priority column (per live_schema vault_items row)
Identifier: seasonal_tags + seasonal_priority columns on vault_items (exist); auto-surfacing logic (absent)
```

### Field 2 — Code presence check

```
Grep command: pattern='seasonal_tags|seasonal_priority|seasonal.*auto.*surfac', path=src
Hits: 0 — no implementation in src/.
```

```
Grep command: pattern='seasonal_tags', output_mode=files_with_matches
Hits: 5 files — migration (column), PRDs, schema docs, vault content script. No runtime consumer.
```

### Field 3 — Wiring check

Columns exist; no runtime query filters by seasonal_tags against current date.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** none.
**CLAUDE.md convention mention:** none specifically.

### Field 5 — What was NOT checked

- Whether `scripts/add-vault-content.ts` seeds seasonal_tags values on any vault items (would affect whether the data is even populated to surface).

### Field 6 — Observations (no verdict)

`seasonal_tags` + `seasonal_priority` columns exist on `vault_items`. No src/ code queries these columns with date-comparison logic. Registry claims ⏳ Unwired (MVP) Phase 25 enhancement. Evidence aligns — schema ready, logic absent.

## Entry 218 — `Session report re-import via Review & Route`

**Registry line:** 218
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Session report re-import via Review & Route | PRD-21A | PRD-08 + PRD-28 | ⏳ Unwired (MVP) | Phase 32 |
```

### Field 1 — Implementation identifier

(a) No concrete identifier.
`grep 'session.*report.*reimport|session_report|reimport.*review' path=src` → 0 hits.

```
Identifier: CAPABILITY-ONLY
```

### Field 2-4

Skipped.

### Field 5 — What was NOT checked

- Whether an Edge Function like `session-report-parse` exists — did not glob Edge Functions.
- Whether this overlaps with Notepad's Review & Route ai-parse flow — semantic question (mgrep would help).

### Field 6 — Observations (no verdict)

Capability-only. Zero implementation grep hits. Registry claims ⏳ Unwired (MVP) Phase 32. Consistent.

<!-- PROGRESS MARKER: completed all 39 entries; final registry integrity check at 547 -->

## BATCH B COMPLETE

Entries processed: 39 (111, 112, 114, 115, 116, 117, 119, 120, 129, 130, 134, 135, 136, 137, 140, 150, 152, 153, 154, 155, 157, 158, 159, 160, 161, 162, 166, 167, 174, 187, 196, 198, 199, 200, 210, 211, 215, 216, 218).

Capability-only packets: 22 (lines 130, 134, 135, 136, 137, 150, 152, 154, 158, 160, 161, 162, 167, 174, 196, 198, 199, 200, 210*, 215, 216*, 218).

*Entries 210 and 216 have identifier-found at level (d.5) — minor ambiguity on classification but recorded here as "capability-only" for counting because the stub capability label still resolves to table/column only with no runtime logic. The field content in the packets themselves shows exactly what was found.

Identifier-found packets: 17 (lines 111, 112, 114, 115, 116, 117, 119, 120, 129, 140, 153, 155, 157, 159, 166, 187, 211).

Final registry line count: 547 (unchanged). No HALT detected. No source-code writes performed.
## Entry 221 — `Learning paths (multi-item sequences)`
**Registry line:** 221
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Learning paths (multi-item sequences) | PRD-21A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub entry line 221 — no concrete identifier named (only capability phrase).
(b) WIRING_STATUS.md — no "Learning paths" section; no match in Vault or Studio wiring tables.
(c) CLAUDE.md — Convention #90 describes a `learning_ladder` (fun_creative/practical/creator) as internal content strategy metadata, NOT a user-facing multi-item sequence. Different capability.
(d) PRD-21A and `prds/addenda/PRD-21A-*` — skimmed; "Learning paths" listed as Post-MVP vision, no implementation identifier.
(d.5) not triggered — no file explicitly named.
→ (e) CAPABILITY-ONLY. Identifier: none.

### Field 2 — Code presence check
Skipped — no identifier to grep for. (Grep `learning_path|learning_paths` in `src` returned 1 hit in `src/components/studio/studio-seed-data.ts` which, on its face, appears unrelated to Vault.)

### Field 3 — Wiring check
Skipped — no identifier.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: no mention.
- CLAUDE.md: no convention names a Vault multi-item-sequence surface. Convention #90 refers to separate learning-ladder metadata.
- PRD-21A: listed in Post-MVP; no concrete identifier.
- No PlannedExpansionCard feature key applicable.

### Field 5 — What was NOT checked
- Whether any `vault_learning_paths` / `vault_item_sequences` schema exists (did not scan migration files by name).
- Semantic question blocked per Convention 242: "Does any Vault-related concept implement multi-item sequencing under a different name (e.g., 'series', 'track', 'course')?"

### Field 6 — Observations (no verdict)
No named identifier. Grep for `learning_path` surfaces only a Studio seed-data file that appears unrelated. No WIRING/CLAUDE corroboration. Classified CAPABILITY-ONLY.

---

## Entry 222 — `Creator economy / user-submitted tools`
**Registry line:** 222
**Claimed status:** `📌 Post-MVP (Phase 4)`
**Full registry row:**
```
| Creator economy / user-submitted tools | PRD-21A | — | 📌 Post-MVP (Phase 4) | — |
```

### Field 1 — Implementation identifier
(a) stub line 222 — no identifier.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention for creator-submitted Vault tools.
(d) PRD-21A + PRD-21B (Admin) + addenda — referenced in planning/decision files only; no schema/component/RPC name.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `creator_economy|user_submitted_tools|user-submitted` → hits only in PRDs, STUB_REGISTRY, CORRECTED_STUB_REGISTRY, audit, and feature-decision markdown files.
Hits: 0 in `src/` and 0 in `supabase/`.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Referenced in `prds/ai-vault/PRD-21A-*`, `prds/ai-vault/PRD-21B-*`, `prds/scale-monetize/PRD-32-*`, `claude/feature-decisions/PRD-21A-AI-Vault-Browse.md`. No implementation identifier.
- `vault_content_requests` table exists (live_schema) — user can request new content, distinct capability from "user-submitted tool."

### Field 5 — What was NOT checked
- Whether PRD-21A Phase 4 roadmap references a specific DB surface.
- Whether `vault_content_requests` covers a subset of this capability.

### Field 6 — Observations (no verdict)
No concrete implementation identifier anywhere in code. Only references are in planning docs. CAPABILITY-ONLY.

---

## Entry 224 — `Content versioning`
**Registry line:** 224
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Content versioning | PRD-21B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 224 — no identifier.
(b) WIRING_STATUS.md — no entry.
(c) CLAUDE.md — no convention names a versioning surface for vault items.
(d) PRD-21B (Admin) — no `content_version` / `version_history` field surfaced.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `content_version|version_history|vault_content_version` → 0 hits in repo.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `vault_items.last_published_at` column exists (adjacent capability; does not itself constitute versioning).

### Field 5 — What was NOT checked
- Whether `vault_items.status` enum + `last_published_at` together constitute a lightweight draft/published workflow that partially covers this capability.

### Field 6 — Observations (no verdict)
No identifier, no code hits, no WIRING/CLAUDE mention. CAPABILITY-ONLY.

---

## Entry 225 — `Scheduled publishing`
**Registry line:** 225
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Scheduled publishing | PRD-21B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 225 — none.
(b) WIRING_STATUS.md — none.
(c) CLAUDE.md — none.
(d) PRD-21B — not surfaced.
Note: `claude/architecture.md` lists `blog-publish-scheduled` Edge Function ("Cron for scheduled blog post publishing") — PRD-38 Blog, NOT PRD-21B Vault.
→ (e) CAPABILITY-ONLY for Vault scheduled publishing.

### Field 2 — Code presence check
Grep `scheduled_publish|scheduled_publishing|publish_at` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `claude/architecture.md`: `blog-publish-scheduled` Edge Function (PRD-38) exists. Adjacent, different feature.
- No Vault scheduled-publish convention or mention.

### Field 5 — What was NOT checked
- Whether blog scheduled-publish patterns are reusable for Vault.

### Field 6 — Observations (no verdict)
No Vault-scoped scheduled-publish identifier. Adjacent blog-side capability exists under different PRD. CAPABILITY-ONLY for this stub.

---

## Entry 226 — `Collaborative filtering recommendations`
**Registry line:** 226
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Collaborative filtering recommendations | PRD-21C | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 226 — none.
(b) WIRING_STATUS.md — no section.
(c) CLAUDE.md — no convention.
(d) Grep `collaborative_filter|vault_recommend` → 2 hits, both in `prds/addenda/PRD-21A-Cross-PRD-Impact-Addendum.md` and `claude/feature-decisions/PRD-21A-AI-Vault-Browse.md`. Planning-text only.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Skipped at code level (grep above found only planning docs).

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Planning references as above. No RPC/function/component.

### Field 5 — What was NOT checked
- Whether `vault_user_progress` + `vault_first_sightings` + `vault_copy_events` aggregation already underpins a hidden recommender.

### Field 6 — Observations (no verdict)
Planning-doc references only. No code identifier. CAPABILITY-ONLY.

---

## Entry 227 — `Semantic/vector search for Vault`
**Registry line:** 227
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Semantic/vector search for Vault | PRD-21C | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 227 — none.
(b) WIRING_STATUS.md — none.
(c) CLAUDE.md — none.
(d) PRD-21C — not surfaced.
Note: `vault_items.fts_document` column exists per live_schema (full-text search). FTS ≠ semantic/vector search. No `embedding` on `vault_items` in live_schema.
→ (e) CAPABILITY-ONLY for the vector variant.

### Field 2 — Code presence check
- Grep `vault.*embedding|vault_items.*embedding` in `supabase/` → 0 hits.
- Grep `vault.*search.*embed|match_vault_items|vault_semantic` in repo → 0 hits.

### Field 3 — Wiring check
Skipped — no identifier.

### Field 4 — Documentation cross-reference
- live_schema.md: `vault_items.fts_document` present.
- No CLAUDE.md/WIRING_STATUS mention of Vault vector search.

### Field 5 — What was NOT checked
- Whether FTS-powered search is wired in UI already (separate capability).

### Field 6 — Observations (no verdict)
Vault currently has FTS column; no vector/embedding surface. CAPABILITY-ONLY for the vector variant of this capability.

---

## Entry 228 — `Out of Nest → sibling messaging`
**Registry line:** 228
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Out of Nest → sibling messaging | PRD-22 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 228 — none.
(b) WIRING_STATUS.md — none.
(c) CLAUDE.md Convention #142 names `out_of_nest_members` table and clarifies OON members have "no family tools, no PIN, no role, no shell — only designated conversation spaces and email notifications." No sibling-messaging capability named.
(d) PRD-22 Settings / PRD-15 Messaging — `out_of_nest` is a defined `space_type` per PRD-15; sibling-specific messaging not named as distinct.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `out_of_nest.*sibling|sibling.*messaging` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Convention #142 (OON architecture): OON members limited to conversation spaces + email.
- PRD-15: `conversation_spaces.space_type='out_of_nest'` is the plumbing.

### Field 5 — What was NOT checked
- Whether a dedicated "sibling" UI in OON spaces exists as an enhancement to PRD-15 wiring.

### Field 6 — Observations (no verdict)
No specific sibling-messaging identifier. Existing `out_of_nest` space_type is PRD-15 scope. CAPABILITY-ONLY.

---

## Entry 232 — `Cross-family book recommendations`
**Registry line:** 232
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Cross-family book recommendations | PRD-23 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 232 — none.
(b) WIRING_STATUS.md — no section.
(c) CLAUDE.md — no convention.
(d) PRD-23 BookShelf + addenda — not surfaced.
Note: `platform_intelligence.book_library` exists as cross-family extraction cache (live_schema) — not a recommender.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `cross.family.*book|family_book_recommendations|cross_family` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `platform_intelligence.book_library` (cross-family extraction cache) exists as distinct capability.

### Field 5 — What was NOT checked
- Whether any `platform_intelligence` RPC exists for family-to-family book matching under a different name.

### Field 6 — Observations (no verdict)
No identifier, no code hits. Adjacent cross-family book cache exists for extraction reuse (separate capability). CAPABILITY-ONLY.

---

## Entry 238 — `Family Challenges (PRD-24C)`
**Registry line:** 238
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Family Challenges (PRD-24C) | PRD-24A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 238 — phrase "Family Challenges (PRD-24C)". PRD-24C file does not exist in `prds/` (PRD-24, 24A, 24B only).
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention references Family Challenges as a game mode.
(d) `prds/addenda/PRD-24A-Game-Modes-Addendum.md` references the concept. No schema/table/component identifier surfaced at the phrase level.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `family_challenge|Family Challenges` in `src/` → 0 hits.
Grep `family_challenge` in `supabase/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `prds/addenda/PRD-24A-Game-Modes-Addendum.md` discusses the concept at planning level.
- No PlannedExpansionCard feature key surfaced.

### Field 5 — What was NOT checked
- Whether `overlay_instances` or `gamification_rewards` schemas include a Family-Challenge-specific type (live_schema lists `overlay_instances` / `overlay_collectibles` under PRD-24A).

### Field 6 — Observations (no verdict)
Planning references only; no code identifier. CAPABILITY-ONLY.

---

## Entry 239 — `Boss Quests game mode`
**Registry line:** 239
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Boss Quests game mode | PRD-24A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 239 — "Boss Quests" as capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) `prds/addenda/PRD-24A-Game-Modes-Addendum.md` references the concept.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `boss_quest|Boss Quest` in `src/` → 0 hits.
Grep `boss_quest` in `supabase/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `prds/addenda/PRD-24A-Game-Modes-Addendum.md`: planning text only.

### Field 5 — What was NOT checked
- Whether the generic `overlay_instances` / `gamification_rewards` schema supports Boss-Quest semantics.

### Field 6 — Observations (no verdict)
Planning references only; no code surface. CAPABILITY-ONLY.

---

## Entry 240 — `Bingo Cards game mode`
**Registry line:** 240
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Bingo Cards game mode | PRD-24A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 240 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) `prds/addenda/PRD-24A-Game-Modes-Addendum.md`.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `bingo_card|Bingo Card|bingo` in `src/` → 0 hits.
Grep `bingo` in `supabase/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `prds/addenda/PRD-24A-Game-Modes-Addendum.md`.

### Field 5 — What was NOT checked
- Whether a bingo-card overlay renderer exists under a generic "grid" component name.

### Field 6 — Observations (no verdict)
Planning references only; no code surface. CAPABILITY-ONLY.

---

## Entry 241 — `Evolution Creatures game mode`
**Registry line:** 241
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Evolution Creatures game mode | PRD-24A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 241 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention for creature evolution; existing Sticker-Book creature pipeline (conventions #198-#207) covers static creature awarding, not evolution.
(d) `prds/addenda/PRD-24A-Game-Modes-Addendum.md`.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `evolution_creature|Evolution Creature|evolve_creature` in `src/` → 0 hits.
Grep in `supabase/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `prds/addenda/PRD-24A-Game-Modes-Addendum.md` for the concept.
- Adjacent: `member_creature_collection` exists (CLAUDE.md #198) — not evolution.

### Field 5 — What was NOT checked
- Whether `member_creature_collection` or similar has an `evolution_stage` / `form` column for future evolution (not checked).

### Field 6 — Observations (no verdict)
Planning references only; static creature collection exists separately. CAPABILITY-ONLY for evolution game mode.

---

## Entry 242 — `Passport Books game mode`
**Registry line:** 242
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Passport Books game mode | PRD-24A | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 242 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) `prds/addenda/PRD-24A-Game-Modes-Addendum.md`.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `passport_book|Passport Book` in `src/` → 0 hits.
Grep in `supabase/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- `prds/addenda/PRD-24A-Game-Modes-Addendum.md`.

### Field 5 — What was NOT checked
- Whether `overlay_instances` / `overlay_collectibles` have a passport-specific subtype.

### Field 6 — Observations (no verdict)
Planning references only; no code surface. CAPABILITY-ONLY.

<!-- PROGRESS MARKER: completed entries 1-13 of 38 -->

---

## Entry 247 — `Randomizer mastery → gamification pipeline`
**Registry line:** 247
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Randomizer mastery → gamification pipeline | PRD-24 Sub-phase C | — | ⏳ Unwired (MVP) | Known gap: randomizer mastery approvals don't fire RPC (no task_completions row). Sequential mastery works. |
```

### Field 1 — Implementation identifier
(a) stub line 247 directly names:
- The capability/pipeline endpoint: `roll_creature_for_completion` (RPC) — implicit from "gamification pipeline" + Convention #198 + #205.
- The missing wire: randomizer mastery approvals do NOT fire the RPC.
- Supporting identifier: `task_completions` table (the RPC is keyed on it).
(b) WIRING_STATUS.md — no direct row, but adjacent sections exist for gamification wiring.
(c) CLAUDE.md Convention #205 (line ~ in the convention block): "Randomizer mastery approvals do NOT fire the gamification pipeline in Sub-phase C (known gap). `useApproveMasterySubmission` has a sequential branch (keyed on `task_completions.id`, wired to the RPC) and a randomizer branch (keyed on `list_items.id`, no `task_completions` row exists). The RPC is strictly `task_completions`-keyed."
(d) PRD-24 / PRD-24 Sub-phase C feature decisions — covered by Convention #205 directly.
→ Field 1 resolves at (c). Primary identifier: `useApproveMasterySubmission` hook (randomizer branch). Secondary: `roll_creature_for_completion` RPC.

### Field 2 — Code presence check
Grep `useApproveMasterySubmission` in `src/` → hits in:
- `src/hooks/usePractice.ts:448` — hook definition (export function `useApproveMasterySubmission`)
- `src/pages/Tasks.tsx:38, 1589` — sequential mastery approval flow
- `src/pages/Lists.tsx:43, 2923` — randomizer mastery approval flow (per-list inline component)
- `src/types/gamification.ts:19` — interface reference

First-context window `src/hooks/usePractice.ts` lines 533-549 (randomizer branch):
```
} else {
  // Randomizer: mark mastered + exit pool
  // NOTE: Randomizer items do NOT go through task_completions, so the
  // gamification pipeline (which is keyed on task_completions.id) is not
  // fired here. Randomizer mastery awards are a known gap for Sub-phase
  // C — flagged in CLAUDE.md and accepted. A follow-up build will route
  // randomizer mastery through a separate pipeline call.
  const { data: item, error: itemErr } = await supabase
    .from('list_items')
    .update({
      mastery_status: 'approved',
      mastery_approved_by: params.approverId,
      mastery_approved_at: now,
      is_available: false,
    })
    .eq('id', params.sourceId)
```

Grep `roll_creature_for_completion` in `src/` → 4 files (`useTaskCompletions.ts`, `useTasks.ts`, `types/gamification.ts`, `usePractice.ts`). In `usePractice.ts` the RPC is called in the sequential branch only (line 37) — confirmed by `grep -n` showing occurrences at lines 37, 41, 46, and a comment at 458.

### Field 3 — Wiring check
**Callers:** `useApproveMasterySubmission` is imported by `src/pages/Tasks.tsx` (line 38) and `src/pages/Lists.tsx` (line 43). Used in `Tasks.tsx:1589` and `Lists.tsx:2923`.

**Execution-flow location:** React hook file (`src/hooks/usePractice.ts`) with dual branch logic. Randomizer branch deliberately does NOT call `supabase.rpc('roll_creature_for_completion', ...)`.

**Most recent touching commit:** Not independently inspected via `git log` in this run. Convention #205 positions this as a Sub-phase C decision.

### Field 4 — Documentation cross-reference
- CLAUDE.md Convention #205 confirms known gap.
- CLAUDE.md Convention #198 names `roll_creature_for_completion` as "authoritative gamification pipeline endpoint" and specifies `UNIQUE constraint on member_creature_collection.awarded_source_id` for idempotency — gap is that randomizer approvals never reach this RPC at all.
- STUB_REGISTRY.md line 247 marks ⏳ Unwired (MVP) with "Known gap: randomizer mastery approvals don't fire RPC" note.

### Field 5 — What was NOT checked
- Whether `task_completions` could be synthesized at randomizer-approval time as a workaround (code path that would synthesize a row and then call RPC).
- Whether any migration has added an `awarded_source_id` generalization beyond `task_completions.id` to include `list_items.id`.
- Whether any UNDO/reset hook exists for randomizer mastery points (none expected per Convention #206).

### Field 6 — Observations (no verdict)
The randomizer branch in `src/hooks/usePractice.ts:533-549` contains an explicit comment documenting that `roll_creature_for_completion` is NOT called for randomizer items. Sequential branch at the same hook DOES call the RPC (line 37 and continuing). CLAUDE.md Conventions #198 and #205 describe this as a deliberate Sub-phase C gap. Registry claim of ⏳ Unwired aligns with the in-code comment and convention language.

---

## Entry 266 — `Tracker Goal page earning (widget data point consumption)`
**Registry line:** 266
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| Tracker Goal page earning (widget data point consumption) | Build M Phase 1 | — | ⏳ Unwired (MVP) | Schema + RPC branch exist. Widget picker wired. Data point trigger not connected. |
```

### Field 1 — Implementation identifier
(a) stub line 266 directly names: "Tracker Goal page earning", "widget data point" consumption, and notes "Schema + RPC branch exist. Widget picker wired. Data point trigger not connected."
(b) WIRING_STATUS.md — no dedicated row.
(c) CLAUDE.md Convention #210: "3 page/background earning modes, independent from creature earning. Stored in `member_sticker_book_state.page_earning_mode`: `'every_n_creatures'` (default...), `'every_n_completions'`..., `'tracker_goal'` (page when a dashboard widget reaches a threshold). Mode-specific columns: `page_earning_completion_threshold`, `page_earning_completion_counter`, `page_earning_tracker_widget_id`, `page_earning_tracker_threshold`."
(d) PRD-24 / PRD-26 feature decision files for Build M.
→ Field 1 identifier list: `tracker_goal` (enum value), `page_earning_tracker_widget_id`, `page_earning_tracker_threshold`, `member_sticker_book_state` table, `roll_creature_for_completion` RPC branch, `widget_data_points` table.

### Field 2 — Code presence check
Grep `page_earning_mode.*tracker_goal|page_earning_tracker_widget_id` → hits in 11 files including:
- `supabase/migrations/00000000100126_earning_strategies_color_reveal.sql` — schema introduction.
- `supabase/migrations/00000000100130_rpc_fix_uninitialized_record.sql` — RPC branch (lines 287-300 reference `tracker_goal` case and `page_earning_tracker_widget_id`).
- `src/hooks/useStickerBookState.ts` — hook consumes.
- `src/hooks/useGamificationSettings.ts` — settings writes.
- `src/components/gamification/settings/GamificationSettingsModal.tsx` — UI.
- `src/types/play-dashboard.ts` — type def.
- `claude/feature-decisions/PRD-24-PRD-26-Configurable-Earning-Strategies.md` — decision doc.

First-context window `supabase/migrations/00000000100130_rpc_fix_uninitialized_record.sql` lines 287-301 (from earlier grep output):
```sql
WHEN 'tracker_goal' THEN
  IF v_state.page_earning_tracker_widget_id IS NOT NULL THEN
    [aggregation check]
    WHERE widget_id = v_state.page_earning_tracker_widget_id
  ) >= COALESCE(v_state.page_earning_tracker_threshold, 5) THEN
    [unlock logic]
    AND unlocked_trigger_type = 'tracker_goal'
    WHERE widget_id = v_state.page_earning_tracker_widget_id
```

### Field 3 — Wiring check
**Callers/Importers:** `useStickerBookState`, `useGamificationSettings`, `GamificationSettingsModal` — UI side wired for picker + threshold config.

**Execution-flow location:** RPC branch is in Postgres function body; UI settings wire config; gap per stub row: "Data point trigger not connected." The missing piece is a trigger/hook that fires `roll_creature_for_completion` (or the page-earning branch) when a `widget_data_points` row is inserted.

**Most recent touching commit:** Not inspected in this run.

### Field 4 — Documentation cross-reference
- CLAUDE.md #210: page-earning modes enumeration (authoritative).
- STUB_REGISTRY line 266: "Data point trigger not connected" explicit gap note.
- `claude/feature-decisions/PRD-24-PRD-26-Configurable-Earning-Strategies.md`: decision doc.

### Field 5 — What was NOT checked
- Whether a `widget_data_points` INSERT trigger exists that calls the RPC (did not grep migration bodies for `widget_data_points` trigger).
- Whether the RPC is currently entered via any task-completion path that happens to have `page_earning_mode='tracker_goal'` (partial-wiring case).

### Field 6 — Observations (no verdict)
Schema, enum value (`tracker_goal`), and RPC branch present in migrations 100126 + 100130 and consumed by hooks/UI. Stub row explicitly notes that widget-data-point insertion does not trigger the RPC. Convention #210 describes the capability but does not name the trigger. Evidence aligns with registry's "Schema + RPC branch exist. Widget picker wired. Data point trigger not connected" note.

---

## Entry 276 — `Caregiver push notifications`
**Registry line:** 276
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Caregiver push notifications | PRD-27 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 276 — "push notifications" capability phrase, scoped to caregiver.
(b) WIRING_STATUS.md — no caregiver-specific section.
(c) CLAUDE.md — no convention. (Generic push-notification infrastructure mentioned as PRD-33 / PRD-15 scope; neither names caregiver-specific push.)
(d) PRD-27 (Caregiver Tools) — not surfaced at specific identifier level.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `caregiver.*push|caregiver_notification` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `notifications` table + `notification_preferences` table exist (PRD-15 plumbing) with `delivery_method` column — generic, not caregiver-specific.
- `notification_preferences.push_enabled` column exists per live_schema — generic.

### Field 5 — What was NOT checked
- Whether the generic PRD-15 push-notification plumbing, once wired, would cover caregiver use cases without new code.
- Whether any PWA service worker push registration already exists (would be PRD-33 scope).

### Field 6 — Observations (no verdict)
No caregiver-specific push identifier. Generic notifications schema exists (PRD-15) but push delivery itself has no code hits. CAPABILITY-ONLY for the caregiver-scoped variant.

---

## Entry 277 — `Homeschool budget/cost tracking`
**Registry line:** 277
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Homeschool budget/cost tracking | PRD-28 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 277 — capability phrase.
(b) WIRING_STATUS.md — no section for homeschool budget.
(c) CLAUDE.md — Conventions #223-#228 describe tracking/allowance/financial/homeschool columns. `financial_transactions` is append-only; `homeschool_configs` covers family/child resolution; no "homeschool budget" capability explicitly named.
(d) PRD-28 + PRD-28B addenda — homeschool hour targets covered (#228), not budget.
Note: `src/components/studio/studio-seed-data.ts` surfaced from grep `homeschool_budget` — checked out as a Studio seed example ("Homeschool Curriculum Budget" as a list_template), distinct from a budget-tracking feature.
→ (e) CAPABILITY-ONLY at system level.

### Field 2 — Code presence check
Grep `homeschool_budget|budget_tracking|homeschool_cost` → 1 hit in `src/components/studio/studio-seed-data.ts` (Studio seed for expense-tracker example, NOT a dedicated homeschool-budget feature).

### Field 3 — Wiring check
Skipped — the one hit is a Studio seed template, not an implementation of budget tracking.

### Field 4 — Documentation cross-reference
- `specs/studio-seed-templates.md` lists "Example 4: Homeschool Curriculum Budget" as an expense-tracker list seed.
- live_schema.md: `financial_transactions` table exists. No homeschool-specific budget table.

### Field 5 — What was NOT checked
- Whether generic expense lists (PRD-09B `lists` with `list_type='expenses'`) are considered "homeschool budget/cost tracking" for PRD-28 purposes.

### Field 6 — Observations (no verdict)
Only hit is a generic expense-list seed template. No dedicated homeschool-budget implementation. CAPABILITY-ONLY for a first-class feature.

---

## Entry 278 — `Advanced financial reports`
**Registry line:** 278
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Advanced financial reports | PRD-28 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 278 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — Convention #225 states financial data is excluded from LiLa context assembly (privacy boundary). No "advanced financial report" capability convention.
(d) PRD-28 — `financial_transactions` table exists with `balance_after` per #223. Report generation not named.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `advanced_financial_report|financial_report_generate` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Convention #225: financial data privacy boundary.
- `report-generate` Edge Function exists per `claude/architecture.md` (generic template-based report generator) — could be used for financial reports, not wired.

### Field 5 — What was NOT checked
- Whether any `report_templates` row has a `financial` template_type.

### Field 6 — Observations (no verdict)
No named identifier for advanced financial reports. Generic report-generate Edge Function exists. CAPABILITY-ONLY at this stub level.

---

## Entry 281 — `IEP/document understanding`
**Registry line:** 281
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| IEP/document understanding | PRD-28B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 281 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention names IEP-specific document understanding; PRD-19 relationship notes + PRD-13 Archives cover document upload generically.
(d) PRD-28B addenda — IEP is a declared template subject but document-understanding (AI extraction) not wired.
Note: `src/config/feature_expansion_registry.ts` surfaced from grep — likely a demand-validation registry entry, not an implementation.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `IEP.*document|iep_document|document_understanding|ocr.*iep` in `src/` → 1 hit in `src/config/feature_expansion_registry.ts` (PlannedExpansionCard registry).

### Field 3 — Wiring check
The one hit is a demand-validation registry entry for PlannedExpansionCard, not an implementation. (Grep `PlannedExpansionCard featureKey=` in `src/` shows 5 in-UI uses, none for IEP.)

### Field 4 — Documentation cross-reference
- `feature_expansion_registry.ts` contains feature descriptions for PlannedExpansionCard demand validation (per CLAUDE.md PlannedExpansionCard convention).
- No implementation identifier.

### Field 5 — What was NOT checked
- Whether a generic document-upload + AI-extraction path (maybe via BookShelf pipeline) could be adapted to IEP.

### Field 6 — Observations (no verdict)
Only hit is a demand-validation registry entry. No dedicated IEP document-understanding code. CAPABILITY-ONLY.

---

## Entry 282 — `ESA vendor integration`
**Registry line:** 282
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| ESA vendor integration | PRD-28B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 282 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-28B — `esa_invoices` table listed per live_schema (`esa_invoices` exists under PRD-28B compliance). No vendor-side integration named.
→ (e) CAPABILITY-ONLY for vendor integration (invoice surface exists but that's a different capability).

### Field 2 — Code presence check
Grep `esa_vendor|esa_integration|vendor_integration` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `esa_invoices` listed under PRD-28B.

### Field 5 — What was NOT checked
- Whether any webhook/OAuth handler exists for specific ESA vendors (e.g., ClassWallet, Step Up for Students) under a different name.

### Field 6 — Observations (no verdict)
Invoice-side schema exists (`esa_invoices`); no vendor-side integration. CAPABILITY-ONLY for vendor-integration stub.

---

## Entry 284 — `Safety journal/message scanning`
**Registry line:** 284
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Safety journal/message scanning | PRD-30 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 284 — capability phrase covering journal + message scanning (extension of current LiLa conversation safety monitoring to other content).
(b) WIRING_STATUS.md — no dedicated row for journal/message scanning.
(c) CLAUDE.md — Convention #7 (global Crisis Override) + safety monitoring context from `claude/ai_patterns.md` describe LiLa conversation safety monitoring (PRD-30). Journal/message scanning beyond LiLa not named.
(d) PRD-30 + `prds/addenda/PRD-30-Cross-PRD-Impact-Addendum.md` — reference concept without naming a journal/message-specific identifier.
Note: `lila_conversations.safety_scanned` + `lila_messages.safety_scanned` exist (per live_schema); `journal_entries.safety_scanned` NOT present per live_schema inspection; `messages.safety_scanned` NOT present.
→ (e) CAPABILITY-ONLY for the extension-to-journal/messages variant.

### Field 2 — Code presence check
Grep `safety_scanned` → 5 files in `src/`: `ToolConversationModal.tsx`, `MeetingConversationView.tsx`, `LilaModal.tsx`, `LilaDrawer.tsx`, `useLila.ts`. All LiLa-conversation context, NOT journal/messages.
Grep `safety.*journal|safety.*scan.*message|journal.*safety_scan` → 0 hits in `src/`.

### Field 3 — Wiring check
Skipped for journal/message scanning (no matching identifier). LiLa safety scanning is a separate wired capability.

### Field 4 — Documentation cross-reference
- live_schema.md: `lila_conversations.safety_scanned` + `lila_messages.safety_scanned` exist. `journal_entries` has no safety_scanned column. `messages` has no safety_scanned column.
- Convention #7: global crisis override — applies to LiLa conversations only per current wording.

### Field 5 — What was NOT checked
- Whether the PRD-30 pipeline is architected to be content-source-agnostic (could pass journal text or messages in without new schema).

### Field 6 — Observations (no verdict)
LiLa-conversation scanning is wired (not this stub's subject). Extending it to journal entries and peer-to-peer messages is not implemented — no schema/hook/code surface for those content sources. CAPABILITY-ONLY for the extension capability.

---

## Entry 287 — `Board session export`
**Registry line:** 287
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Board session export | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 287 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — Conventions #92-#104 describe Board of Directors; export not named.
(d) PRD-34 ThoughtSift — `board_sessions` table exists (live_schema) with `conversation_id` foreign key; export not described as implemented.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `board_session.*export|export.*board_session|export_board` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `board_sessions` table exists.
- Convention #100 mentions "Prayer Seat" special record; no export mention.

### Field 5 — What was NOT checked
- Whether a generic conversation-export route at `/api/conversation-export` (or similar) exists that could cover board sessions.

### Field 6 — Observations (no verdict)
Session entity exists; no export code. CAPABILITY-ONLY.

---

## Entry 288 — `Translator language support`
**Registry line:** 288
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Translator language support | PRD-34 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 288 — capability phrase, likely referring to Translator ThoughtSift tool (PRD-34) supporting non-English output languages.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md Convention #94: "Translator uses Haiku, is single-turn. Saves to `lila_messages` for history but does not use conversation continuity. No emoji in tone labels or output text." No language capability.
(d) PRD-34 + addenda — Translator single-turn mode described; language variants not detailed as implemented.
→ (e) CAPABILITY-ONLY for non-English language support.

### Field 2 — Code presence check
Grep `translator.*language|translator.*spanish|non_english_translator` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Convention #94: Translator described as Haiku single-turn, no multi-language.
- `lila_guided_modes` has `translator` mode_key (per PRD-34 registry in ai_patterns.md) — single-turn surface exists; language dimension not surfaced.

### Field 5 — What was NOT checked
- Whether the Translator Edge Function prompt template accepts a `target_language` parameter already.

### Field 6 — Observations (no verdict)
Base Translator mode exists; multi-language dimension has no code hits. CAPABILITY-ONLY for language-support extension.

---

## Entry 289 — `Standards linkage on portfolio`
**Registry line:** 289
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Standards linkage on portfolio | PRD-37 | PRD-28B | ✅ Wired | Phase 32 |
```

### Field 1 — Implementation identifier
(a) stub line 289 — capability phrase; "Standards linkage" + "portfolio" implies `education_standards` + `standard_evidence` + portfolio (family_moments / PRD-37) linkage.
(b) WIRING_STATUS.md — no dedicated row visible in file inspection.
(c) CLAUDE.md — no convention directly names the linkage.
(d) live_schema.md lists `education_standards` + `standard_evidence` + `report_templates` + `esa_invoices` under PRD-28B. `family_moments` + `moment_media` under PRD-37.
(d.5) Opened `feature_glossary.md` — confirms PRD-37 portfolio + PRD-28B standards/evidence tables exist as MVP.
→ Identifier set: `education_standards` table + `standard_evidence` table + `family_moments` table.

### Field 2 — Code presence check
Grep `education_standards|standard_evidence` in `src/` → 0 hits.
Grep `education_standards|standard_evidence` in `supabase/migrations/` was NOT re-run explicitly; live_schema references these tables as existing under PRD-28B (trust baseline).
Grep `standards_linkage|portfolio.*standards|education_standards.*portfolio` in repo → 3 hits, all in PRD markdown files (`prds/platform-complete/PRD-37-*`, `prds/platform-complete/PRD-28B-*`, `prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md`).

### Field 3 — Wiring check
**Callers/Importers:** `education_standards` + `standard_evidence` grep in `src/` returned 0 hits, meaning no client-side hooks or components currently consume these tables at the name level. Tables exist in schema; UI wiring to the name not located.

**Execution-flow location:** DB-side schema (migration files). Not traceable to UI from the direct identifier grep.

**Most recent touching commit:** Not run.

### Field 4 — Documentation cross-reference
- STUB_REGISTRY.md line 289 claims ✅ Wired, Phase 32, wired by PRD-28B.
- `prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md` is the authoritative cross-impact document.
- feature_glossary.md: PRD-37 + PRD-28B both listed as MVP.

### Field 5 — What was NOT checked
- Whether the linkage uses a different join name (e.g., `family_moments.standard_id` or a junction table under a name that doesn't contain "standard" in a greppable way).
- Whether the "Phase 32" build file still exists in `.claude/completed-builds/` with wiring details — not inspected.
- Migration text for `education_standards` / `standard_evidence` — not opened directly.
- Whether `standards_linkage` is wired via `report_templates` content type rather than a direct join.

### Field 6 — Observations (no verdict)
Schema-level `education_standards` + `standard_evidence` tables exist per live_schema. Grep for identifier names returns 0 hits in `src/`. Stub claims ✅ Wired in Phase 32 with PRD-28B as wirer; direct-grep evidence of UI integration is absent. Possible that wiring uses a different name (e.g., composite join) not captured by this grep. Founder-judgment flag.

---

## Entry 290 — `Portfolio export`
**Registry line:** 290
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Portfolio export | PRD-37 | PRD-28B | ✅ Wired | Phase 32 |
```

### Field 1 — Implementation identifier
(a) stub line 290 — capability phrase; "portfolio export" implies PDF/CSV/document export of `family_moments` (PRD-37 portfolio) via PRD-28B's report-generate path.
(b) WIRING_STATUS.md — no dedicated row visible.
(c) CLAUDE.md — no convention.
(d) `claude/architecture.md` names `report-generate` Edge Function as "Template-based report generation." That's the plausible export surface.
→ Primary identifier: `report-generate` Edge Function + `family_moments` + `report_templates` table.

### Field 2 — Code presence check
Grep `portfolio_export|export_portfolio|family_moment.*export` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped at the name level (no direct matches).

### Field 4 — Documentation cross-reference
- STUB_REGISTRY.md line 290: ✅ Wired via PRD-28B, Phase 32.
- `claude/architecture.md`: `report-generate` Edge Function exists.
- live_schema.md: `report_templates` under PRD-28B.

### Field 5 — What was NOT checked
- Whether `report-generate` Edge Function accepts a portfolio report template.
- Whether any download/blob endpoint exists in `src/` wiring this up.
- Whether Family Newsletter report template (stub 291 — not in batch) or another report covers this.

### Field 6 — Observations (no verdict)
Registry claims ✅ Wired via PRD-28B Phase 32. Direct grep for "portfolio export" terms returns 0 hits in `src/`. Implementation likely lives under a generic `report-generate` path, not under a portfolio-specific name. Founder-judgment flag to validate wiring is via report templates rather than a portfolio-named code path.

---

## Entry 292 — `Image auto-tagging`
**Registry line:** 292
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Image auto-tagging | PRD-37 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 292 — capability phrase (presumably AI-driven automatic tagging of `moment_media` images).
(b) WIRING_STATUS.md — no section.
(c) CLAUDE.md — no convention.
(d) PRD-37 — `moment_media` table exists; auto-tagging not described.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `image.*auto_tag|auto_tag.*image|moment_media.*tag|image_tagging` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- live_schema.md: `moment_media` under PRD-37. No `ai_tags` column visible per schema-dump entry.

### Field 5 — What was NOT checked
- Whether `family_moments` has a `tags` column capable of receiving AI-assigned values later.

### Field 6 — Observations (no verdict)
No identifier, no code hits. CAPABILITY-ONLY.

<!-- PROGRESS MARKER: completed entries 1-26 of 38 -->

---

## Entry 298 — `Blog comment threading`
**Registry line:** 298
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Blog comment threading | PRD-38 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 298 — capability phrase; implies `blog_comments.parent_comment_id` or equivalent.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-38 Blog — `blog_comments` table referenced in feature_glossary (PRD-38 Blog section).
→ (e) CAPABILITY-ONLY at implementation-identifier level.

### Field 2 — Code presence check
Grep `blog_comment.*thread|comment_thread|reply_to_comment|parent_comment_id` → 2 hits, both in markdown/archive files:
- `.claude/archive/database_schema_SUPERSEDED.md`
- `prds/ai-vault/PRD-21C-AI-Vault-Engagement-Community.md` (PRD-21C comments for Vault, not blog)

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- feature_glossary.md: `blog_comments` exists under PRD-38 as MVP.
- Threading not mentioned in any current source.

### Field 5 — What was NOT checked
- Whether `blog_comments` schema actually includes a `parent_id` column for threading (live_schema snapshot did not list blog-specific tables — they may be under PRD-38 and not PostgREST-exposed).

### Field 6 — Observations (no verdict)
No threading identifier in code. References to "parent_comment_id" live only in superseded/other-PRD docs. CAPABILITY-ONLY for blog-specific threading.

---

## Entry 299 — `Blog search`
**Registry line:** 299
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Blog search | PRD-38 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 299 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-38 — no surfaced identifier.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `blog_post.*search|blog_search|fts.*blog` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- PRD-38 listed in feature_glossary.md as MVP with `blog_posts` table. Search surface not described.

### Field 5 — What was NOT checked
- Whether `blog_posts` has an `fts_document` column akin to `vault_items.fts_document`.

### Field 6 — Observations (no verdict)
No identifier, no code hits. CAPABILITY-ONLY.

---

## Entry 300 — `Blog RSS feed`
**Registry line:** 300
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Blog RSS feed | PRD-38 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 300 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-38 — not surfaced.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `rss_feed|rss\.xml|feed\.xml|blog_rss` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- None.

### Field 5 — What was NOT checked
- Whether any `.xml` dynamic route exists in `src/pages/` (extension-specific globs not run beyond `src/`).

### Field 6 — Observations (no verdict)
No identifier, no code hits. CAPABILITY-ONLY.

---

## Entry 301 — `Blog email newsletter`
**Registry line:** 301
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Blog email newsletter | PRD-38 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 301 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-38 — not surfaced.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `newsletter|email_subscribers|mailing_list` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- None found.
- Note: Family Newsletter report template (stub 291, adjacent) exists per STUB_REGISTRY as PRD-28B wired — distinct feature (family compliance newsletter, not blog subscriber newsletter).

### Field 5 — What was NOT checked
- Whether any Stripe receipt / Supabase SMTP plumbing exists that could serve this capability.

### Field 6 — Observations (no verdict)
No identifier, no code hits. CAPABILITY-ONLY.

---

## Entry 302 — `Pinterest auto-pin`
**Registry line:** 302
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Pinterest auto-pin | PRD-38 | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 302 — capability phrase.
(b) WIRING_STATUS.md — no mention.
(c) CLAUDE.md — no convention.
(d) PRD-38 — not surfaced.
→ (e) CAPABILITY-ONLY.

### Field 2 — Code presence check
Grep `pinterest|auto_pin` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- None.

### Field 5 — What was NOT checked
- Whether any OAuth config references Pinterest API.

### Field 6 — Observations (no verdict)
No identifier, no code hits. CAPABILITY-ONLY.

---

## Entry 305 — `External calendar sync`
**Registry line:** 305
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| External calendar sync | PRD-14B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 305 — capability phrase; `calendar_events` schema has `external_id`, `external_source`, `last_synced_at` columns per live_schema (columns 20-22 of `calendar_events`), which hints at intended sync scaffolding.
(b) WIRING_STATUS.md — "Calendar Import (Phase 0)" section discusses ICS upload, screenshot, paste link, email forward (stub, DNS not configured), and notes "Google Calendar API | OAuth → two-way sync | Not built (Phase 1 / post-MVP)."
(c) CLAUDE.md — no convention for external sync.
(d) PRD-14B — `calendar_events.external_id` / `external_source` / `last_synced_at` columns exist per live_schema (scaffolding without active sync loop).
→ Identifier set: `external_id`, `external_source`, `last_synced_at` on `calendar_events`.

### Field 2 — Code presence check
Grep `external_id|external_source|last_synced_at` in `src/` → 3 files:
- `src/components/queue/SortTab.tsx`
- `src/components/queue/CalendarTab.tsx`
- `src/types/calendar.ts`
(These reference the columns in the import-review flow from ICS files, not an active external-sync loop.)
Grep `external_calendar_sync|ical_sync|google_calendar` in `src/` → 0 hits.

### Field 3 — Wiring check
**Callers/Importers:** The columns are read during ICS import review (CalendarTab + SortTab); no outbound sync.

**Execution-flow location:** Schema scaffolding + inbound ICS import path. No outbound polling/push loop.

**Most recent touching commit:** Not run.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md Calendar Import section (quoted above): "Google Calendar API | OAuth → two-way sync | Not built (Phase 1 / post-MVP)."
- ICS upload wired; external sync loop not built.

### Field 5 — What was NOT checked
- Whether any `.ics` export endpoint exists (would be outbound one-way sync, not a full sync).

### Field 6 — Observations (no verdict)
Schema scaffolding (external_id, external_source, last_synced_at) exists and is used for inbound ICS import review. No outbound sync loop. Registry's 📌 Post-MVP aligns with WIRING_STATUS.md's "Not built (Phase 1 / post-MVP)" note.

---

## Entry 306 — `Google Calendar integration`
**Registry line:** 306
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Google Calendar integration | PRD-14B | — | 📌 Post-MVP | — |
```

### Field 1 — Implementation identifier
(a) stub line 306 — capability phrase.
(b) WIRING_STATUS.md Calendar Import section explicitly: "Google Calendar API | OAuth → two-way sync | Not built (Phase 1 / post-MVP)".
(c) CLAUDE.md — no convention.
(d) PRD-14B — not surfaced at OAuth/integration level.
→ Primary identifier surface would be a Google OAuth handler + a sync Edge Function; neither exists by name.

### Field 2 — Code presence check
Grep `external_calendar_sync|ical_sync|google_calendar` in `src/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- WIRING_STATUS.md: "Not built (Phase 1 / post-MVP)".

### Field 5 — What was NOT checked
- Whether any OAuth config in `supabase/` references a Google client_id.

### Field 6 — Observations (no verdict)
No code hits. WIRING_STATUS.md explicitly documents "Not built (Phase 1 / post-MVP)". Registry 📌 Post-MVP aligns.

---

## Entry 329 — `Before-send coaching in Messages tab`
**Registry line:** 329
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Before-send coaching in Messages tab | PRD-25 | PRD-15 | 📌 Post-MVP | LiLa reviews message tone |
```

### Field 1 — Implementation identifier
(a) stub line 329 — capability phrase. Scoped to Guided Dashboard Write Drawer's Messages tab (PRD-25 section per header at line 319). NOT the adult Messages page (which does have coaching wired — CoachingCheckpoint). Distinction matters.
(b) WIRING_STATUS.md — no dedicated row for Guided Messages tab coaching.
(c) CLAUDE.md Convention #139: "Message coaching is a before-send checkpoint, never a blocker. 'Send Anyway' is always available alongside 'Edit'." That convention describes the adult Messages feature (PRD-15).
(d) PRD-25 + PRD-15 — `CoachingCheckpoint.tsx` component exists for PRD-15 Phase E (adult Messages). PRD-25's Guided Write Drawer Messages tab is a navigation bouncer to `/messages`, not an inline coaching surface.
(d.5) Opened `src/components/guided/WriteDrawerMessages.tsx` (named via CLAUDE.md #125 "Messages tab is a stub until PRD-15"): file renders a single "navigate to /messages" button (per `PRD-25 Phase B: WriteDrawerMessages — Tab 2` header + body). No inline composer, no coaching inline.
→ Primary identifier for the capability: `WriteDrawerMessages.tsx` is the component that hosts the stub UI. `CoachingCheckpoint` is the adult analog but is not integrated into WriteDrawerMessages.

### Field 2 — Code presence check
Grep `CoachingCheckpoint` in `src/` → 6 hits in messaging (adult PRD-15) only.
Grep `coaching` in `src/components/guided/` → 3 hits: `GuidedManagementScreen.tsx`, `WriteDrawer.tsx`, `SpellCheckOverlay.tsx`. Not before-send coaching in Messages tab.

First-context window `src/components/guided/WriteDrawerMessages.tsx` lines 1-30 (read): component is a navigation stub — renders MessageCircle icon, unread count, "Go to Messages" prompt. No coaching integration.

### Field 3 — Wiring check
**Callers/Importers:** `WriteDrawerMessages` imported by `WriteDrawer.tsx` (line 15) and exported from `src/components/guided/index.ts` line 11.

**Execution-flow location:** React component in Guided shell Write Drawer. Behaves as nav bouncer to `/messages`, not an inline compose surface — so before-send coaching does not apply here in the current shape.

### Field 4 — Documentation cross-reference
- STUB_REGISTRY.md line 329: 📌 Post-MVP with "LiLa reviews message tone" note.
- STUB_REGISTRY.md line 327 (adjacent): "Messages tab in Write drawer | PRD-25 (Phase B) | PRD-15 (Messages) | ⏳ Unwired (MVP) | 'Coming soon' placeholder" — note the adjacent stub for the tab itself.
- CLAUDE.md #125: "Messages tab is a stub until PRD-15."
- Convention #139: adult Messages before-send coaching (PRD-15) is the template capability.

### Field 5 — What was NOT checked
- Whether future integration will inject `CoachingCheckpoint` into an inline compose form inside `WriteDrawerMessages.tsx` when PRD-25 Phase D lands.
- Whether the adjacent stub line 327 ("Messages tab in Write drawer, ⏳ Unwired") is now out of date given the observed WriteDrawerMessages.tsx uses a navigation bouncer rather than a "Coming soon" placeholder.

### Field 6 — Observations (no verdict)
Registry claims 📌 Post-MVP for before-send coaching specifically in the Guided Write Drawer Messages tab. Current `WriteDrawerMessages.tsx` is a navigation bouncer to `/messages`, so no inline send surface exists that would require coaching. Adult Messages page does have `CoachingCheckpoint` (PRD-15 Phase E). This stub (329) is distinct from the adjacent line 327 stub about the tab itself. Evidence consistent with 📌 Post-MVP.

---

## Entry 335 — `Advanced NBT (energy, Best Intentions, family context)`
**Registry line:** 335
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| Advanced NBT (energy, Best Intentions, family context) | PRD-25 | Post-MVP | 📌 Post-MVP | Enhancement to NBT priority engine |
```

### Field 1 — Implementation identifier
(a) stub line 335 — capability phrase; NBT = Next Best Thing (per Convention #126 priority order).
(b) WIRING_STATUS.md — no dedicated row.
(c) CLAUDE.md Convention #126: "Next Best Thing suggestion priority order: overdue > active routine > time-block > mom-priority > next due > opportunities > unscheduled > best intention reminder. Deterministic, not random. AI glaze is Haiku-class, cached per suggestion per session."
(d) PRD-25 — `NextBestThingCard.tsx` is the current implementation.
(d.5) Not invoked — no concrete "Advanced NBT" identifier named in any of (a)-(d).
→ (e) CAPABILITY-ONLY for the "advanced" (energy, best_intentions, family context weighting) variant. Base NBT IS wired per Convention #126.

### Field 2 — Code presence check
Grep `next_best_thing|NextBestThing` in `src/` → 6 files (base NBT is wired, not this stub's subject).
Grep `advanced_nbt|nbt_advanced|next_best_thing.*advanced|priority_engine` → 0 hits.

### Field 3 — Wiring check
Skipped for advanced variant (no identifier).

### Field 4 — Documentation cross-reference
- Convention #126: base NBT algorithm.
- Stub row note: "Enhancement to NBT priority engine" — explicit "not yet" signal.

### Field 5 — What was NOT checked
- Whether any `energy_level` column exists on tasks / family_members that NBT could consume (would be an enhancement surface).
- Whether `best_intentions` already participates in NBT priority logic for Guided shell (per #126, last in priority list).

### Field 6 — Observations (no verdict)
Base NBT is wired (per Convention #126 + existing components). The "advanced" enhancement (energy-aware, family-context-weighted variant) has no code surface. CAPABILITY-ONLY for the advanced variant.

---

## Entry 336 — `"Ask Mom" from NBT`
**Registry line:** 336
**Claimed status:** `📌 Post-MVP`
**Full registry row:**
```
| "Ask Mom" from NBT | PRD-25 | PRD-15 | 📌 Post-MVP | Quick-request when child disagrees with all suggestions |
```

### Field 1 — Implementation identifier
(a) stub line 336 — capability phrase; Guided child disagrees with NBT suggestion → initiates `family_request` to mom (PRD-15 request plumbing).
(b) WIRING_STATUS.md — no row.
(c) CLAUDE.md Convention #145: "Requests are NOT studio_queue items. They have their own lifecycle and live in `family_requests`." PRD-15 scope.
(d) PRD-25 + PRD-15 — `family_requests` table exists (live_schema, 0 rows). No NBT-to-family_request handler surfaced.
→ (e) CAPABILITY-ONLY for the NBT integration specifically.

### Field 2 — Code presence check
Grep `Ask Mom|ask_mom|ask_parent|disagree.*suggest` in `src/components/guided/` → 0 hits.

### Field 3 — Wiring check
Skipped.

### Field 4 — Documentation cross-reference
- Convention #145: `family_requests` table is the plumbing.
- `NextBestThingCard.tsx` exists; no "disagree → request" affordance surfaced.

### Field 5 — What was NOT checked
- Whether `NextBestThingCard.tsx` already has a dismiss/skip button that could route to a family_request in a future build.

### Field 6 — Observations (no verdict)
No "Ask Mom from NBT" identifier or UI affordance. `family_requests` plumbing exists (PRD-15). CAPABILITY-ONLY for this specific integration.

---

## Entry 345 — `Completion-dependent scheduling`
**Registry line:** 345
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Completion-dependent scheduling | PRD-35 | PRD-35 | ✅ Wired | Phase 05 |
```

### Field 1 — Implementation identifier
(a) stub line 345 — capability phrase, scoped to PRD-35 Universal Scheduler.
(b) WIRING_STATUS.md — no dedicated "completion-dependent" row found in the visible sections, though Calendar section references recurrence.
(c) CLAUDE.md Convention #27: "Completion-dependent schedules generate the next instance from the last completion timestamp, not from a fixed calendar position." Authoritative.
(d) PRD-35 + addenda — `SchedulerOutput.schedule_type = 'fixed' | 'completion_dependent' | 'custody'` exists in types.
(d.5) Opened `src/components/scheduling/types.ts` (named by CLAUDE.md #24 "Schedule data is stored as RRULE JSONB"). File defines `CompletionDependentConfig` interface at line 32-41 with fields `interval`, `unit`, `window_start`, `window_end`, `anchor_date`.
→ Primary identifiers: `schedule_type = 'completion_dependent'` enum discriminator + `CompletionDependentConfig` interface + `completion_dependent` field in `SchedulerOutput`.

### Field 2 — Code presence check
Grep `CompletionDependentConfig|completion_dependent` in `src/components/scheduling/` → 4 files: `schedulerUtils.ts`, `UniversalScheduler.tsx`, `types.ts`, `index.ts`.

First-context window `src/components/scheduling/types.ts` lines 24-41:
```ts
/** Schedule type discriminator */
schedule_type: 'fixed' | 'completion_dependent' | 'custody'
/** Completion-dependent config (only when schedule_type = 'completion_dependent') */
completion_dependent: CompletionDependentConfig | null
/** Custody pattern config (only when schedule_type = 'custody') */
custody_pattern: CustodyPatternConfig | null
}

export interface CompletionDependentConfig {
  interval: number
  unit: 'days' | 'weeks' | 'months'
  /** Due window start (days/weeks/months after completion) */
  window_start: number | null
  /** Due window end (days/weeks/months after completion) */
  window_end: number | null
  /** Anchor date for first occurrence */
  anchor_date: string
}
```

### Field 3 — Wiring check
**Callers/Importers:** `schedulerUtils.ts`, `UniversalScheduler.tsx`, `index.ts` all reference the discriminator. `UniversalScheduler.tsx` header comment explicitly mentions "completion-dependent" (line 7).

**Execution-flow location:** React component (UniversalScheduler) + utils file. Drives scheduler output that consumers persist to RRULE JSONB.

**Most recent touching commit:** Not run.

### Field 4 — Documentation cross-reference
- Convention #27: authoritative description.
- Convention #24-#30: Universal Scheduler architecture.
- Stub row: ✅ Wired in Phase 05 by PRD-35.

### Field 5 — What was NOT checked
- Whether `tasks.recurrence_details` JSONB on consumer rows contains actual `schedule_type='completion_dependent'` values in production (would require DB query).
- Whether `incomplete_action` field on tasks interacts with completion-dependent logic (Convention #69 — fresh reset default).

### Field 6 — Observations (no verdict)
`CompletionDependentConfig` interface defined in `src/components/scheduling/types.ts` with specific field shape. Discriminator `schedule_type='completion_dependent'` present in output type. Referenced in 4 files within `src/components/scheduling/`. Convention #27 corroborates the capability. Evidence supports registry ✅ Wired claim at component/type level.

---

## Entry 346 — `Custody patterns`
**Registry line:** 346
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| Custody patterns | PRD-35 | PRD-27 | ✅ Wired | Phase 31 |
```

### Field 1 — Implementation identifier
(a) stub line 346 — capability phrase, scoped to PRD-35 Universal Scheduler with PRD-27 (Caregiver Tools) as wirer.
(b) WIRING_STATUS.md — no dedicated custody-pattern row.
(c) CLAUDE.md Convention #26: "`access_schedules` replaces `shift_schedules` for Special Adult/co-parent access windows." Convention #24: "Schedule data is stored as RRULE JSONB in each consuming feature's `recurrence_details` column. Format: `{rrule, dtstart, until, count, exdates, rdates, timezone, schedule_type, completion_dependent, custody_pattern}`." `custody_pattern` is named as a field.
(d) PRD-35 + PRD-27 — `access_schedules` table exists per live_schema (0 rows at dump time).
(d.5) Opened `src/components/scheduling/types.ts` (same file as entry 345). Lines 43-50 define `CustodyPatternConfig`:
```ts
export interface CustodyPatternConfig {
  /** Array of 'A' or 'B' representing the repeating pattern */
  pattern: string[]
  /** Anchor date for pattern start */
  anchor_date: string
  /** Labels for each side */
  labels: { A: string; B: string }
}
```
→ Primary identifiers: `schedule_type='custody'` discriminator + `CustodyPatternConfig` interface + `custody_pattern` field in `SchedulerOutput` + `access_schedules` table.

### Field 2 — Code presence check
Grep `custody_pattern|custody_schedule` in `src/` → 4 files: `src/types/tasks.ts`, `src/components/scheduling/schedulerUtils.ts`, `src/components/scheduling/types.ts`, `src/components/scheduling/CalendarPreview.tsx`.
Grep `custody_pattern|custody_schedule|custody` in `supabase/migrations/` → 4 files:
- `supabase/migrations/00000000100023_tasks_prd09a_full.sql`
- `supabase/migrations/00000000000019_schema_remediation_batch2.sql`
- `supabase/migrations/00000000000009_remediation_schema_batch.sql`
- `supabase/migrations/00000000000004_universal_scheduler.sql`
Grep `CustodyPatternConfig` in `src/components/scheduling/` → 4 files (same list as types).

### Field 3 — Wiring check
**Callers/Importers:** `src/types/tasks.ts` imports custody-pattern shape. `src/components/scheduling/CalendarPreview.tsx` renders custody-pattern events. `schedulerUtils.ts` handles pattern expansion.

**Execution-flow location:** Shared scheduler type consumed by Tasks, Calendar, Scheduler UI. Postgres-side `access_schedules` table exists for persistence.

**Most recent touching commit:** Not run.

### Field 4 — Documentation cross-reference
- Convention #24: `custody_pattern` named in RRULE JSONB format.
- Convention #26: `access_schedules` replaces `shift_schedules`.
- live_schema.md: `access_schedules` table present with `recurrence_details` JSONB, `schedule_type`, `schedule_name`, `start_time`, `end_time` columns.
- Registry: ✅ Wired in Phase 31 by PRD-27.

### Field 5 — What was NOT checked
- Whether any `access_schedules` rows exist in production with `custody` schedule_type (0 rows at dump, implying no real usage yet — feature may be wired but not exercised).
- Whether PRD-27 Caregiver Shift UI pickers are wired to drive the `custody` schedule_type branch.
- Whether migration 100023 (tasks_prd09a_full.sql) is where the custody column landed on tasks vs. access_schedules.

### Field 6 — Observations (no verdict)
`CustodyPatternConfig` interface defined in `src/components/scheduling/types.ts`; consumed by 4 files in `src/`. Schema-side `access_schedules` table exists per live_schema. Grep matches across migrations + source. Convention #24 names `custody_pattern` field explicitly. Registry ✅ Wired claim corroborated at type/component/schema level; live-DB exercise not verified (0 rows at dump time).

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


---

## Entry 493 — `createTaskFromData` guard for `taskType='sequential'` (CALIBRATION)

**Registry line:** 493
**Claimed status:** `✅ Wired`
**Full registry row:**
```
| `createTaskFromData` guard for taskType='sequential' | PRD-09A/09B Phase 1 | PRD-09A/09B Phase 1 | ✅ Wired | 2026-04-06 |
```

### Field 1 — Implementation identifier

Level (a) — stub entry itself.

```
Source: stub entry line 493
Identifier: `createTaskFromData` (function), and the behavioral claim "guard for taskType='sequential'"
Quote: "`createTaskFromData` guard for taskType='sequential'"
```

Secondary identifier derived from the stub text's behavioral claim (resolves at (a) as well): `taskType === 'sequential'` condition inside that function. Per CLAUDE.md Convention 151 (line 345 of CLAUDE.md) a paired defensive layer also exists: `TaskCreationModal` skip of `initialTaskType='sequential'` with a `console.warn`. Treating these as sub-identifiers of the same entry per the recipe's multi-identifier guidance.

### Field 2 — Code presence check

**Identifier #1: `createTaskFromData`**

```
Grep command: pattern=`createTaskFromData`, path=`src`, output_mode=content, -n=true
Hits: 14 matches across 6 files
Files:
  - src/utils/createTaskFromData.ts:46   (export async function createTaskFromData)
  - src/utils/createTaskFromData.ts:60   (throw-error string — the guard body)
  - src/utils/createTaskFromData.ts:153  (console.error inside routine template branch)
  - src/utils/createTaskFromData.ts:229  (console.error inside routine-no-sections branch)
  - src/pages/Tasks.tsx:58               (import)
  - src/pages/Tasks.tsx:235              (await createTaskFromData(...))
  - src/pages/Studio.tsx:57               (import)
  - src/pages/Studio.tsx:466              (await createTaskFromData(...))
  - src/components/shells/IndependentShell.tsx:22  (import)
  - src/components/shells/IndependentShell.tsx:44  (await createTaskFromData(...))
  - src/components/shells/AdultShell.tsx:22        (import)
  - src/components/shells/AdultShell.tsx:44        (await createTaskFromData(...))
  - src/components/shells/MomShell.tsx:31          (import)
  - src/components/shells/MomShell.tsx:59          (await createTaskFromData(...))
```

First-context window for the guard (src/utils/createTaskFromData.ts:53-64, quoted verbatim):

```ts
  // PRD-09A/09B Studio Intelligence Phase 1 guard.
  // Sequential collections have their own creation path: SequentialCreatorModal →
  // useCreateSequentialCollection. If we get here with taskType='sequential',
  // something is wiring the wrong flow. Throwing loudly prevents silent creation of
  // broken single-row "sequential" tasks with no parent collection or child items.
  if ((data.taskType as string) === 'sequential') {
    throw new Error(
      "createTaskFromData: sequential collections must be created via " +
      "useCreateSequentialCollection / SequentialCreatorModal, not through " +
      "TaskCreationModal. This is a bug — check the caller.",
    )
  }
```

The triggering condition is `(data.taskType as string) === 'sequential'`. The throw message is the concatenated string: `"createTaskFromData: sequential collections must be created via useCreateSequentialCollection / SequentialCreatorModal, not through TaskCreationModal. This is a bug — check the caller."`

**Identifier #2: TaskCreationModal defensive `console.warn` skip for `initialTaskType === 'sequential'`**

```
Grep command: pattern=`initialTaskType.*sequential|initialTaskType === 'sequential'`, path=`src`, output_mode=content, -n=true, -C=4
Hits: 2 guard sites inside src/components/tasks/TaskCreationModal.tsx
```

Site A (TaskCreationModal.tsx:479-490, state initialization branch):
```tsx
    const d = defaultTaskData(queueItem)
    // PRD-09A/09B Studio Intelligence Phase 1: sequential creation has its own
    // modal (SequentialCreatorModal). If a caller still passes 'sequential',
    // ignore it so we don't poison the state; that caller should be fixed.
    if (initialTaskType && initialTaskType !== 'sequential') {
      d.taskType = initialTaskType as TaskType
    } else if (initialTaskType === 'sequential') {
      console.warn(
        '[TaskCreationModal] initialTaskType="sequential" is no longer supported. ' +
        'Use SequentialCreatorModal instead.',
      )
    }
```

Site B (TaskCreationModal.tsx:547-553, useEffect re-init branch):
```tsx
  useEffect(() => {
    const d = defaultTaskData(queueItem ?? activeBatchItem)
    // Phase 1 guard: same sequential skip as the initial useState, applied here
    // so later re-inits from a new queue item don't re-poison state.
    if (initialTaskType && initialTaskType !== 'sequential') {
      d.taskType = initialTaskType as TaskType
    }
```

### Field 3 — Wiring check

**Callers / Importers (identifier #1 `createTaskFromData`):** 5 call sites outside the defining file.
  - `src/pages/Tasks.tsx:235` — Tasks page handleSaveTask (task-creation entry point)
  - `src/pages/Studio.tsx:466` — Studio customization deploy path
  - `src/components/shells/MomShell.tsx:59` — Mom shell task creation handler
  - `src/components/shells/AdultShell.tsx:44` — Adult shell task creation handler
  - `src/components/shells/IndependentShell.tsx:44` — Independent teen shell task creation handler

These match the addendum's "used by 4 shells" description (3 shells + Tasks page + Studio = 5 call sites, 4 of them shells).

**Execution-flow location:** `src/utils/createTaskFromData.ts` is a shared utility module (plain async function, not a hook or component). The guard is synchronous code at the top of the function body — runs before any DB insert, so a mis-wired sequential-type submission surfaces as a thrown `Error` in the caller's awaited promise rather than a silent broken INSERT.

**Most recent touching commit (primary hit file):**
```
git log -1 --format="%h %ai %s" -- src/utils/createTaskFromData.ts
→ 762fa31 2026-04-14 23:07:08 -0500 fix: 6 bug reports — rotation, LiLa, Notepad, Studio audit
```

Commit date (2026-04-14) is later than Phase 1 (2026-04-06) — the guard's introduction date per the registry. The more recent touching commit modified other branches of the function (per the commit subject, "rotation" work), not the sequential guard itself. (The partition's stated expectation of "Phase 1 (2026-04-06) or later" is satisfied.)

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Yes. Line 55 reads:
```
| `createTaskFromData` guard | Throws `Error` on `taskType='sequential'` | **Wired** | Prevents silent re-introduction of the broken path. |
```

Additional WIRING_STATUS.md mentions of the function (lines 144, 154) describe subtask creation and rotation-config persistence — separate capabilities hosted in the same utility.

**Cross-PRD addendum mentions:** Yes. `prds/addenda/PRD-09A-09B-Studio-Intelligence-Universal-Creation-Hub-Addendum.md`:
  - Line 44 (table row describing the silent-broken-row bug) — "Either routes to SequentialCreator, or `createTaskFromData` bails out for sequential type."
  - Line 47 — "**Defensive requirement:** `createTaskFromData()` is used by 4 shells. If it still receives `taskType='sequential'`, it should either redirect to the proper creation flow or throw a clear error — not silently create a broken record. Add a guard clause."
  - Line 263 — "createTaskFromData | **GUARD** | Prevent silent broken-record creation for sequential type."
  - Line 338 — "3. Guard createTaskFromData against broken sequential creation"
  - Line 384 — "`createTaskFromData()` has a guard clause for `taskType='sequential'` — it must never silently create a broken single-task record. Sequential creation is handled exclusively by useCreateSequentialCollection."

**PlannedExpansionCard / stub UI:** Not applicable — this is a defensive guard inside a utility function, not a user-facing feature with demand validation.

**CLAUDE.md convention mention:** Yes. Convention 151 (line 345):
```
151. **`createTaskFromData()` has a guard clause for `taskType='sequential'` — it must never silently create a broken single-row task.** The guard throws a loud error. `TaskCreationModal` also skips `initialTaskType='sequential'` with a `console.warn`. Both layers exist defensively to prevent regression of the bug that left `sequential_collections` at 0 rows in production until 2026-04-06.
```

### Field 5 — What was NOT checked

- The sub-agent did NOT run the E2E test suite. `tests/e2e/features/studio-intelligence-phase1.spec.ts` exists (confirmed via directory listing) but the run is scope-excluded; whether the spec still passes today was not verified.
- Did NOT dynamically exercise the guard — i.e., did not construct a `CreateTaskData` object with `taskType='sequential'` and call the function to confirm the throw actually fires at runtime. Evidence is by static source inspection of the guard body + the call sites.
- Did NOT verify that every *current* caller correctly avoids passing `taskType='sequential'`; only confirmed that 5 call sites exist. An offending caller would be caught by the guard at runtime, but a static proof would require inspecting each caller's `data.taskType` source.
- Did NOT confirm the TaskCreationModal `console.warn` branch logs on the actual browser console in a deployed build; only confirmed the code path exists.

### Field 6 — Observations (no verdict)

Grep located `createTaskFromData` in `src/utils/createTaskFromData.ts`. The function contains a synchronous guard clause at lines 58-64 that throws `Error` with the message "createTaskFromData: sequential collections must be created via useCreateSequentialCollection / SequentialCreatorModal, not through TaskCreationModal. This is a bug — check the caller." when `(data.taskType as string) === 'sequential'`. Five call sites were found: `src/pages/Tasks.tsx:235`, `src/pages/Studio.tsx:466`, and three shell handlers (`MomShell.tsx:59`, `AdultShell.tsx:44`, `IndependentShell.tsx:44`). Most recent commit touching the file: `762fa31` (2026-04-14). The paired defensive layer described in CLAUDE.md Convention 151 exists in `src/components/tasks/TaskCreationModal.tsx` at two sites (lines 483-490 and 551-553) — the state-init branch logs a `console.warn` when `initialTaskType === 'sequential'` and the useEffect re-init branch silently refuses to set `d.taskType` when the value is `'sequential'`. WIRING_STATUS.md line 55 and PRD-09A/09B Studio Intelligence Addendum (lines 44, 47, 263, 338, 384) both describe the guard.

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

<!-- PROGRESS MARKER: partition complete at 2026-04-19 — 155 packets written (1 calibration + 37 batch A + 39 batch B + 38 batch C + 40 batch D) -->

---

## Lead-review notes for morning synthesis

The sub-agents surfaced these high-value flags while processing — preserved here so synthesis doesn't re-investigate.

### Potential registry-vs-code contradictions (priority for synthesis walk-through)

- **Entry 111 (`Send to Person (messaging)`, claimed ✅ Wired):** `NotepadDrawer.tsx:258` wires `destination === 'message'` to open a `ComposeFlow` component (which exists), but `WIRING_STATUS.md:18` still marks the Message destination as `Stub | PRD-15 not built`, and Guided `SendToGrid.tsx:33,154` has it explicitly `disabled: true` with "Coming soon!" copy. Documentation-vs-code drift; scope of "wired" may be notepad-only.
- **Entry 117 (`Auto-victory from task completions`, claimed ✅ Wired):** `useTaskCompletion.ts:106-108` has the auto-victory call *commented out* with a "(stub — PRD-11)" note. `VictorySuggestions.tsx` offers a scan-and-claim surface instead of auto-creation. Task-side auto path appears stubbed; list-side may be wired separately. Overlaps with entries 67, 91, 101 (see AIR cluster below).
- **Entry 196 (`State-specific compliance formatting`, claimed ✅ Wired via Phase 32):** No `report_templates` CREATE TABLE found in migrations; no `src/` code implementing state-specific formatting. Evidence does not support the claimed status.
- **Entry 289 (`Standards linkage on portfolio`) + Entry 290 (`Portfolio export`), claimed ✅ Wired via PRD-28B Phase 32:** Direct-name grep returned 0 hits in `src/`. Wiring may live under a report-template path or a differently-named join. Worth cross-checking against the Phase 32 completed-build file.
- **Entry 423 (`Widget → Gamification progress`, claimed ⏳ Unwired (MVP)):** CLAUDE.md Convention #210 names `page_earning_tracker_widget_id` + threshold columns delivered by Build M as infrastructure for this capability. Potential doc drift between registry status and Build M scope.
- **Entry 515 (`homeschool_time_review` LiLa guided mode, claimed 📌 Post-MVP):** Dedicated Edge Function + seed-data migration exist and were committed 2026-04-13. Infrastructure is present; whether a UI surface invokes it is the remaining gap.
- **Entry 357 (`All 38 color themes`):** CLAUDE.md Convention #42 states "38 themes," but the `ThemeKey` union in `tokens.ts` enumerates 46 keys by section count. Count discrepancy is observable; resolution is a founder-judgment call.

### AIR (Automatic Intelligent Routing) cluster needs unified synthesis

- **Entries 67, 91, 101, 117** describe overlapping auto-victory paths from different sources (task completions, intention iterations, widget milestones, general victory detection). Entry 67 claims ✅, Entry 91 claims ✅, Entry 101 claims ⏳, Entry 117 claims ✅ — while the task-side code path at `useTaskCompletion.ts:108` is commented-out. Synthesis should reconcile the four entries together to avoid per-entry classification incoherence.

### Apparent duplicate registry entries

- **Entries 62 and 82** both describe "Long conversation summarization" (PRD-05, both Post-MVP). Merge candidate for synthesis.

### Scope/definition ambiguities (not contradictions, but need founder clarity)

- **Entry 50 (`LiLa Optimizer mode`):** Registry says ✅ Wired. No dedicated `lila-optimizer` Edge Function folder; the optimizer `mode_key` is seeded and type-supported client-side, but `WIRING_STATUS.md` row 12 reads `Optimizer | Notepad | LiLa Optimizer | Stub | PRD-05C not built`. Unclear whether "wired" means the mode_key exists in `lila_guided_modes` or a full optimization flow is deliverable today.
- **Entry 329 (`Before-send coaching in Messages tab`):** Registry row is in the PRD-25 Guided Dashboard section; the concept overlaps with PRD-15 adult `CoachingCheckpoint` (which *is* wired). The stub appears scoped to the Guided-shell Write Drawer Messages tab specifically.
- **Entries 238–242 (gamification game modes — Family Challenges, Boss Quests, Bingo, Evolution Creatures, Passport Books):** All five produce zero grep hits in `src/`. PRD-24A's generic `overlay_instances` / `overlay_collectibles` schema could theoretically host several subtypes, but nothing in the code signals per-mode scaffolding. Likely intentional capability-only stubs.

### Process notes

- Registry integrity (`547 STUB_REGISTRY.md`, no HALT) held steady across all four sub-agent runs and the final lead merge.
- Recipe 4-level chain executed as specified; no sub-agent invented an identifier to make a packet look complete. CAPABILITY-ONLY packets retain the mgrep-question record in Field 5 per recipe guidance.
- Calibration packet (entry 493) is spliced in its registry-line-order position below. The "PAUSED" footer and the original calibration wrapper have been removed; founder approval is recorded via the session's chat-log timestamp (Session 4 calibration approved, continue — 2026-04-19).

---

## PARTITION COMPLETE

155 packets (1 calibration + 154 batch entries) written to this file, entries in strict registry-line order. All fields populated per recipe. Ready for morning synthesis.
