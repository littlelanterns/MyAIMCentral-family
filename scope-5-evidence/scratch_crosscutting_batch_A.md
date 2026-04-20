# Scope 5 Crosscutting Batch A — Sub-agent scratch

> Session 4 sub-agent output. 37 entries from `stub_partition_crosscutting.md`. Processed in registry-line order.
> Integrity check passed at session start: `547 STUB_REGISTRY.md`, no HALT file.

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


