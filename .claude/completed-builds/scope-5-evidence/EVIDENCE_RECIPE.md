# Scope 5 Evidence Recipe

> **Purpose:** Every Claude Code session (sub-agent, parallel session, or lead+sub-agents under a lead) assigned to Scope 5 stub reconciliation reads THIS document first and follows it verbatim. The recipe produces observational evidence packets, not verdicts. Humans judge the evidence in the morning.
>
> **Parent plan:** `AUDIT_REPORT_v1.md` Scope 5 section — full line-by-line reconciliation of ~224 entries in `STUB_REGISTRY.md` against code reality.
>
> **Inversion from previous approach:** Prior plan had sub-agents classify entries as "Wired/Unwired/Stubbed/Missing." That put judgment inside the sub-agent. New plan: sub-agents collect evidence only. Humans classify using the evidence in the morning synthesis session.

---

## Forbidden actions (hard rules)

A session executing this recipe MUST NOT:

1. **Write to or edit `STUB_REGISTRY.md`.** The registry is read-only for the entire evidence-collection run. It gets updated exactly once, in the morning synthesis session, by a human-led process.
2. **Edit any source code.** No fixes, no cleanup, no refactors, no Edit/Write/NotebookEdit calls against files in `src/`, `supabase/`, `tests/`, `specs/`, or any other code directory. Reading is fine; writing is not.
3. **Run any git operation.** No `git add`, no `git commit`, no `git push`, no `git checkout`, no `git stash`. Read-only git observations are allowed (`git log`, `git show`, `git diff`, `git status`). Evidence files can record command output from these reads.
4. **Reach a verdict.** Do not write "this entry is Wired" or "this entry is Unwired" or "this is clearly a stub." Write what you observed. The classification happens in the morning synthesis session, not in the evidence packet.
5. **Speculate past the evidence.** If you grep for an identifier and it's not found, write "grep returned no matches for `<identifier>`." Do not write "this feature is probably unwired" or "this suggests the stub is accurate." Observations, not inferences.
6. **Invoke `mgrep`.** Per Convention 242 (inverted 2026-04-18), mgrep requires per-query founder approval. Evidence-collection runs MUST use Grep and Glob. If a query genuinely needs semantic search that keyword matching cannot answer, record the question in the packet's "What was NOT checked" field and stop — do not attempt mgrep.
7. **Invoke AURI MCP scan tools or other paid/usage-billed tools.** Same logic: these have cost surfaces and require founder approval. Scope 5 is a grep+inspection task, not a scanning task.

If you find yourself wanting to do any of the above: stop. Record what you were going to do in the packet's "What was NOT checked" field. Move to the next entry.

---

## Registry integrity check (run at session start, then between every entry)

Baseline at dispatch time:

- `STUB_REGISTRY.md` line count: **547**
- Last-modifying commit: **c2e04e3** (2026-04-17 22:24 — "chore(phase-0.26-s3.5): mark _requestingMemberId wiring complete in STUB_REGISTRY")

Before processing ANY entry — including the calibration entry — run a line-count check:

```bash
wc -l STUB_REGISTRY.md
```

If the output is anything other than `547 STUB_REGISTRY.md`:

1. Stop immediately. Do not process any more entries.
2. Write to the evidence file:
   ```
   ## HALTED — REGISTRY CHANGED MID-RUN (expected 547 lines, got <M>)
   <timestamp>
   <N entries completed before halt>
   ```
3. Exit. Do not attempt to reconcile the diff yourself.

Re-run the check between every entry, not just at session start. Four parallel sessions may be reading this file simultaneously, and a human may edit it. The check is cheap; the cost of evidence built against a drifted registry is high (packets reference line numbers that no longer point at the intended entry).

If the partition file header's checksum is ever inconsistent with the baseline recorded above, trust the partition file header — the baseline here is the reference at recipe-write time, but the partition file is the session's authoritative target count.

---

## HALT file mechanism

Every session checks for a file named `HALT` at the repo root before starting each evidence packet. If `HALT` exists:

1. Stop immediately.
2. Write current state to your evidence file with a clear `## HALTED AT ENTRY <N>` marker at the bottom.
3. Exit gracefully (no git operations).

The founder uses this to abort any or all running sessions without babysitting each window. `touch HALT` in the repo root halts everyone on their next check.

If a session aborts for any other reason (tool error, context pressure, session timeout), it still writes the `## HALTED AT ENTRY <N>` marker before exiting.

---

## Progress markers

Every session writes a progress marker to its evidence file every 20-30 entries:

```
<!-- PROGRESS MARKER: completed entries 1-25, moving to entry 26 at 2026-04-19T09:15:03Z -->
```

The marker is an HTML comment so it doesn't render in the markdown body. The marker's purpose is so the founder can wake up, scan the four evidence files, and immediately see which sessions made progress and which stalled, without reading packet contents.

---

## The per-entry evidence packet

Each entry gets one packet. Packet format is fixed. Every field must appear even if empty (with an explicit "none found" note).

### Packet template

````markdown
## Entry <N> — `<short identifier from the registry>`

**Registry line:** <line number in STUB_REGISTRY.md>
**Claimed status:** `<✅ Wired | 🔗 Partially Wired | ⏳ Unwired (MVP) | 📌 Post-MVP | ❌ Superseded | 🚫 Removed>`
**Full registry row:**
```
<paste the full table row verbatim, including the pipe-delimited fields>
```

### Field 1 — Implementation identifier (MANDATORY 4-level extraction chain)

Before running any grep in Field 2, execute this identifier-extraction chain in strict order (a) → (b) → (c) → (d) → (e). Stop at the first level that produces a concrete code identifier. Record which level produced the identifier and quote the source.

**(a) Stub entry itself.** Read the stub row verbatim from `STUB_REGISTRY.md` at the cited line. Does the row name a concrete code identifier — table name, function name, component name, hook name, feature key, Edge Function endpoint, RPC name, trigger name, enum, migration file? If YES, use it. Record:
```
Source: stub entry line <N>
Identifier: <the named thing>
Quote: "<the portion of the row that names it>"
```

**(b) `WIRING_STATUS.md`.** If (a) produced nothing, open `WIRING_STATUS.md` and locate the feature's section (e.g. "System Lists", "RoutingStrip Destinations", "Calendar Import"). Does it name a concrete implementation mechanism — trigger name, function path, component file? Quote the row. Record:
```
Source: WIRING_STATUS.md: "<quoted row or table cell>"
Identifier: <the mechanism name>
```

**(c) `CLAUDE.md` conventions.** If (b) produced nothing, search `CLAUDE.md` for the feature name or capability description using Grep (path=`CLAUDE.md`, limited context). Look specifically at numbered conventions (#1 through #240-ish — skip the Silent-Failure and Convention-Hygiene patterns, those are meta-patterns not feature specs). Does any convention name a concrete implementation identifier for this capability? Quote the convention and its line. Record:
```
Source: CLAUDE.md convention #<N> (line <L>): "<quoted convention>"
Identifier: <the named thing>
```

**(d) PRD + addenda.** If (c) produced nothing, find the PRD referenced in the stub's "Created By" column. Locate it via `claude/feature_glossary.md` or `Glob prds/**/PRD-XX*`. Open that PRD and any matching addenda (`Glob prds/addenda/PRD-XX*`). Does the PRD's data-model / architecture section, or any addendum, name a concrete implementation identifier — table name, function signature, component name? Quote the relevant section. Record:
```
Source: prds/<category>/PRD-XX-<name>.md section <N>: "<quoted passage>"
        OR prds/addenda/<filename>: "<quoted passage>"
Identifier: <the named thing>
```

**(d.5) File-named-but-identifier-inside lookup.** If (a)-(d) produced a filename or module path but no specific identifier WITHIN that file (e.g., `WIRING_STATUS.md` says "Adapter in Studio.tsx" without naming the hook or table; CLAUDE.md says "the context-assembler" without naming an export), open that specific file and perform ONE bounded source-code lookup to find the identifier that implements this capability. Record source as `<file>:<line> — <quoted code showing the identifier>`.

Limits on (d.5):
- ONE file opened per entry at this level. Do not cascade to more files — if the first named file doesn't contain the identifier, escalate to (e) capability-only.
- The file you open must have been named explicitly at levels (a)-(d). Not a file you guess might be relevant.
- This is bounded chained inference, not free-range source exploration. If you're tempted to grep the whole `src/` tree at this step, stop and escalate to (e).

**Pilot precedent:** Entry 413 (Widget starter configs). Level (b) WIRING_STATUS.md line 68 named `Studio.tsx` as the adapter file but did not name a specific hook or table. Opening `src/pages/Studio.tsx` surfaced `useWidgetStarterConfigs` at line 229, which led to the hook definition at `src/hooks/useWidgets.ts:115-123` where the runtime table name `widget_starter_configs` appeared. That is the sanctioned shape of (d.5) — one file opened because it was explicitly named at (b), identifier extracted, lookup terminates.

**(e) Capability-only fallback.** If (a)-(d.5) all produced no concrete implementation identifier, the entry is CAPABILITY-ONLY. Record Field 1 as:
```
Identifier: CAPABILITY-ONLY — no implementation identifier found.
Sources checked:
  (a) stub entry line <N> — no identifier named
  (b) WIRING_STATUS.md — <quote the section checked or note absence>
  (c) CLAUDE.md conventions — <grep pattern tried, hits: 0>
  (d) PRD-XX <category> + addenda in prds/addenda/PRD-XX* — <list of files opened; note which sections read>
```

When Field 1 lands at (e):
- Fields 2, 3, 4 become `"skipped — no identifier to grep for."`
- Field 5 explicitly records the capability-only status AND any semantic-search question the sub-agent would have asked if mgrep were approved per query (record the question, do NOT invoke mgrep).
- Field 6 summary: `"capability-only entry; evidence-by-grep not applicable. Flagged for founder-judgment bucket."`

**Hard rule: DO NOT INVENT AN IDENTIFIER.** If (a)-(d) all come up empty, the honest answer is "capability-only." Inventing a plausible-sounding function name and grepping for it produces fabricated evidence, which is worse than acknowledging the ambiguity. The calibration entry Backburner/Ideas required (b) — the trigger name was NOT in the stub row; it was in WIRING_STATUS.md. A sub-agent that skips directly from (a) to grep will miss this pattern entirely.

**Multi-identifier case.** If a single stub entry references multiple concrete implementation identifiers (e.g. "Sequential advancement modes" references columns + an RPC + hooks), Field 1 records all of them with their sources, and Fields 2-4 produce one grep/wiring/doc-check block per identifier. Do not collapse multiple identifiers into one grep.

### Field 2 — Code presence check

For EACH identifier in Field 1, run Grep once. Record:

```
Grep command: <the exact Grep call — pattern, path, output_mode, -n flag>
Hits: <N>
Files:
  - <relative path>:<line> <one-sentence context of what's at that line>
  - <relative path>:<line> ...
First-context window for the most relevant hit: <5-10 lines, quoted>
```

If Grep returns zero hits for an identifier, write:
```
Grep command: <exact call>
Hits: 0 — no matches for <identifier>.
```

If Grep returns >20 hits (too noisy to list), tighten the pattern and re-run. Record the tightening step.

### Field 3 — Wiring check (only if Field 2 found hits)

For the most authoritative hit from Field 2, check:

**Callers/Importers:** Grep for references to the identifier (imports, function calls, component usage). Record top-5 caller locations with one-line context each.

**Execution-flow location:** State what kind of file the hit is in — migration, Edge Function, React component, hook, utility, type definition, test, documentation, orphaned. If ambiguous, record both possibilities.

**Most recent touching commit:** Run `git log -1 --format="%h %ai %s" -- <file>` for the primary hit file. Record the commit hash, date, and subject line.

If Field 2 found no hits, skip Field 3 entirely and write "skipped — no code presence."

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Grep `WIRING_STATUS.md` for the entry's feature name or primary identifier. Quote the matching row if found. Record "no mention" if not.

**Cross-PRD addendum mentions:** Run `Glob` for `prds/addenda/*{feature-name}*` OR Grep `prds/addenda/` for the primary identifier. List any matching addendum filenames and quote one-line context if the feature is mentioned. Record "no addendum mention" if not.

**PlannedExpansionCard / stub UI:** Grep `src/` for `<PlannedExpansionCard featureKey="<feature_key>"`. Quote the matching JSX line if found.

**CLAUDE.md convention mention:** Grep `CLAUDE.md` for the primary identifier or feature name. Quote the matching convention number+line if found.

### Field 5 — What was NOT checked

Every question you wanted to answer but could not with the tools and rules of this run. Every ambiguity. Every place where "I'd need to see X to be sure." Examples:

- "Could not verify whether `<trigger>` is currently ENABLED on production DB — would need a Supabase SQL query against live DB, which is out of scope for this run."
- "Grep hit in `supabase/functions/<fn>/index.ts` but could not confirm the function is DEPLOYED to production — would need `supabase functions list`, out of scope."
- "Entry mentions 'works great with <other feature>' but I couldn't locate <other feature>'s wiring to confirm the integration exists — cross-feature."
- "Stub text is ambiguous: could refer to UI component OR backend capability — semantic search would help here; Convention 242 blocks it without approval. Flagging for founder judgment."

Empty is acceptable only if you genuinely had no ambiguities — in practice, most packets will have at least one "NOT checked" item.

### Field 6 — Observations (no verdict)

A short paragraph summarizing what the packet shows. No "this is wired" or "this is unwired." Neutral language:

- "Grep found <identifier> in <N> locations, all in <file>. Most recent commit <hash> dated <date>."
- "No grep hits for <identifier>. WIRING_STATUS.md does not mention this feature. PlannedExpansionCard present at `<file>:<line>`."
- "Multiple identifiers across migrations and Edge Functions — see Fields 2 and 3 for the spread."

Human reviewers use Field 6 as a one-glance summary to decide which packets to read in full.
````

### Good packet example (Backburner/Ideas, calibration entry)

If this recipe is right, the Backburner/Ideas entry should produce a packet that surfaces the contradiction between STUB_REGISTRY.md and WIRING_STATUS.md, cites the trigger by name, and quotes the relevant migration lines — WITHOUT declaring the entry wired or unwired.

Expected-quality calibration packet:

````markdown
## Entry 398 — `System list auto-provision (Backburner, Ideas)`

**Registry line:** 398
**Claimed status:** `⏳ Unwired (MVP)`
**Full registry row:**
```
| System list auto-provision (Backburner, Ideas) | PRD-09B | — | ⏳ Unwired (MVP) | Phase 10+ |
```

### Field 1 — Implementation identifier

Registry row text does not name a concrete DB trigger or function. Cross-references:

- `WIRING_STATUS.md` "System Lists (auto-created per member)" section names `auto_provision_member_resources` trigger as the mechanism and lists both Backburner and Ideas with Status `**Wired**`.
- `CLAUDE.md` Convention 19 names `auto_provision_member_resources` trigger — but only mentions it creating "an archive folder + dashboard_config," NOT Backburner/Ideas lists.

Primary identifier: `auto_provision_member_resources` (from WIRING_STATUS.md).
Secondary: `list_type = 'backburner'` and `list_type = 'ideas'` (from the registry entry itself).

### Field 2 — Code presence check

```
Grep command: pattern=`auto_provision_member_resources`, path=`supabase`, output_mode=files_with_matches
Hits: 11 files
Files:
  - supabase/migrations/00000000000016_family_setup_remediation.sql
  - supabase/migrations/00000000100035_prd13_archives_context.sql
  - supabase/migrations/00000000100101_claim_expiration_cron_and_list_provision.sql
  - supabase/migrations/00000000100103_rhythms_foundation.sql
  - supabase/migrations/00000000100104_guided_evening_rhythm.sql
  - supabase/migrations/00000000100106_guided_evening_reflections.sql
  - supabase/migrations/00000000100110_rhythms_phase_b.sql
  - supabase/migrations/00000000100111_rhythms_phase_b_section_cleanup.sql
  - supabase/migrations/00000000100112_rhythms_phase_c.sql
  - supabase/migrations/00000000100114_rhythms_phase_d_teen.sql
  - supabase/migrations/00000000100115_play_dashboard_sticker_book.sql
Most recent CREATE OR REPLACE: migration 100115 line 1378.
```

First-context window for the Backburner/Ideas branch (migration 100115 lines 1412-1435):

```sql
-- 3. Create Backburner & Ideas lists for non-Guided/Play members
IF NEW.dashboard_mode IS NULL OR NEW.dashboard_mode NOT IN ('guided', 'play') THEN
  IF NOT EXISTS (
    SELECT 1 FROM public.lists
    WHERE family_id = NEW.family_id AND owner_id = NEW.id
      AND list_type = 'backburner' AND archived_at IS NULL
  ) THEN
    INSERT INTO public.lists (family_id, owner_id, title, list_type)
    VALUES (NEW.family_id, NEW.id, 'Backburner', 'backburner');
  END IF;
  -- (same pattern for Ideas list)
END IF;
```

Original introduction: migration 100101 line 61-115 with comment "Fix 2: Auto-provision Backburner & Ideas lists for new members" + a backfill INSERT for existing eligible members.

### Field 3 — Wiring check

**Callers:** trigger is invoked by Supabase directly on `family_members` INSERT — no application-layer callers.

**Execution-flow location:** Postgres trigger function in migrations. Status in live DB: assumed enabled (migration chain is applied); not independently verified in this run.

**Most recent touching commit:** `git log -1 --format="%h %ai %s" -- supabase/migrations/00000000100115_play_dashboard_sticker_book.sql` → <commit hash/date/subject would be recorded here>.

### Field 4 — Documentation cross-reference

**WIRING_STATUS.md mention:** Quoted — "System Lists (auto-created per member)" table:
> | Backburner | `backburner` | Yes (auto_provision_member_resources trigger) | Notepad, Review & Route | **Wired** |
> | Ideas | `ideas` | Yes (auto_provision_member_resources trigger) | Notepad, Review & Route | **Wired** |

**Cross-PRD addendum mentions:** Grep `prds/addenda/` for `auto_provision_member_resources` — (would be recorded here).

**PlannedExpansionCard / stub UI:** not applicable — Backburner/Ideas are system lists, not UI features with demand-validation cards.

**CLAUDE.md convention mention:** Convention 19 (line <N>) names `auto_provision_member_resources` trigger, mentions "archive folder + dashboard_config," does NOT mention Backburner/Ideas list creation. Under-specified relative to the actual trigger body.

### Field 5 — What was NOT checked

- Whether the trigger is currently enabled on the production DB (would need live SQL access).
- Whether the backfill in migration 100101 actually ran against all pre-existing family_members rows (would need a Supabase query).
- Whether any family_members rows exist with no corresponding Backburner/Ideas rows despite the backfill (staleness/drift).

### Field 6 — Observations (no verdict)

STUB_REGISTRY.md line 398 claims `⏳ Unwired (MVP)`. WIRING_STATUS.md claims `Wired`. Migration 100101 introduced the trigger branch that creates both lists idempotently plus a backfill for existing members; migration 100115 (latest of 11 revisions) preserves the branch verbatim. CLAUDE.md Convention 19 is under-specified — names the trigger but not the list-creation behavior.
````

This packet would feed directly into the morning synthesis session. Human reviewer sees the contradiction in Field 6, validates the evidence in Fields 2-4, classifies the entry as "evidence-contradicts-claimed-status," and queues a STUB_REGISTRY update.

### Bad packet example (what NOT to do)

````markdown
## Entry 398 — Backburner/Ideas auto-provision

This one is definitely wired. I checked the migrations and the trigger creates both lists. Should flip line 398 to Wired.
````

Wrong because:
- No full registry row quoted.
- No grep commands recorded.
- No file paths or line numbers.
- Reached a verdict ("definitely wired") — forbidden.
- No cross-reference to WIRING_STATUS.md.
- No "what was NOT checked" field.
- Synthesis reviewer has nothing to validate — they'd have to redo the grep work themselves.

---

## Handling ambiguity

When the registry entry is vague ("LiLa proactive suggestions," "Seasonal tag auto-surfacing"):

1. Field 1 gets "no concrete identifier extractable from registry row."
2. Check WIRING_STATUS.md, CLAUDE.md conventions, and PRD feature glossary for the feature name. If any of them names an implementation identifier, use it.
3. If NONE of the cross-references name a concrete identifier, write Field 1 as "entry is abstract; no concrete implementation identifier found in authoritative docs." Fields 2-4 become "skipped — nothing to grep for." Field 5 gets a note like "entry is too abstract for grep-based evidence collection; would need either a more specific identifier from the registry or a semantic search (blocked by Convention 242)."
4. Field 6 summarizes: "abstract entry; evidence-by-grep not applicable."

These packets will be the smallest and the most likely to resolve as "ambiguous-needs-founder-judgment" in the morning synthesis. That's fine. Don't fake evidence to make the packet look complete.

---

## Session startup instructions (template)

When a session is dispatched, it receives a prompt that includes:

1. This recipe file path: `scope-5-evidence/EVIDENCE_RECIPE.md` — read it first, in full, before doing anything else.
2. The partition file assigned to this session: `scope-5-evidence/stub_partition_<domain>.md`.
3. The output file path for this session's evidence: `scope-5-evidence/STUB_REGISTRY_EVIDENCE_<DOMAIN>.md`.
4. The HALT file check: check for `HALT` at repo root before every entry.
5. Calibration entry requirement: if the Backburner/Ideas entry (line 398) is in this session's partition, process it first as a calibration packet. If NOT in this session's partition, skip calibration.
6. Progress marker cadence: every 20-30 entries.
7. Context reminder: no writes to source code, no git ops, no verdicts, no mgrep/AURI without founder approval, no conclusions.

---

## For the founder (morning review)

When you wake up:

1. **Scan progress markers.** Each evidence file has HTML-comment progress markers. If one session stalled at entry 12 of 65, that session needs attention before the synthesis step.
2. **Scan packet shapes.** Open each evidence file briefly. Do packets have all six fields? Do Field 6 summaries use neutral language (no verdicts)? Do Field 5 sections exist and contain honest "NOT checked" items (empty sections across all packets is a red flag — means the session wasn't thinking critically)?
3. **Flag malformed packets.** If any packets are skeletal or missing fields, mark them for re-run. Do not include them in synthesis.
4. **Synthesis session.** New Claude Code session receives all 4 evidence files + instruction to merge into `STUB_REGISTRY_RECONCILIATION_DRAFT.md`, classifying each entry into three buckets based on evidence alone:
   - `evidence-supports-claimed-status` — packet evidence aligns with what the registry claims
   - `evidence-contradicts-claimed-status` — evidence directly contradicts the claim (like Backburner/Ideas)
   - `evidence-ambiguous-needs-founder-judgment` — evidence is mixed, incomplete, or the entry was too abstract to grep
5. **Walk the contradictions and ambiguous entries with the synthesis session.** You decide the real status per entry. The session produces ONE commit with an updated STUB_REGISTRY.md and an entry in `AUDIT_REPORT_v1.md` summarizing the reconciliation.

Expected session counts after morning synthesis: most entries land in `supports` (registry is probably mostly accurate). Maybe 5-15 `contradicts`. Maybe 20-40 `ambiguous`. If the `contradicts` count is over ~30, that's a signal the registry drifted significantly during build phases and a broader doc-hygiene pass might be needed.
