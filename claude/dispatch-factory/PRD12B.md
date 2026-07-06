# Pre-Dispatch Pack — PRD12B: Family Vision Quest

> **Factory status:** synthesized → decisions-pending (3 decisions, batch 4)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD12B. Priority: P3.
> Evidence: `claude/dispatch-factory/PRD12AB-RECON.md` (shared with PRD12A).
> **Sequencing per D-12AB-1: dispatches AFTER PRD-12A** (shares loader/mode plumbing patterns;
> carries the one net-new infrastructure item — chunked Whisper transcription).
> Headline: 0% built; no `/family-vision` route even exists; the Family Hub has a registered
> `family_vision` section slot that renders null, waiting.

## Reconciliation rulings (newer wins — named explicitly)

1. **Chunked/rolling Whisper transcription is NET-NEW work** — both PRDs' texts cross-reference it
   as if the other built it; neither did (whisper-transcribe is single-shot). It ships in this
   build as its own slice, designed exactly for the failure mode the PRD names (long recordings
   timing out): client records in rolling chunks, each transcribed independently, assembled into
   `transcript_chunks` JSONB + final transcript, editable before save.
2. **Anti-comparison privacy is load-bearing and RLS-enforced,** not display-layer: dad/teen see
   ONLY their assigned sections and NEVER other members' answers; mom-only aggregation. Aligns
   with the platform's newer privacy discipline (leak-pass standards, Convention #274 honesty).
3. **`family_best_intentions` is OUT of scope** — already shipped independently via PRD-14D as a
   distinct feature; 12B builds family GUIDING STARS (owner_type='family'), not family intentions. The
   build also delivers the family-GS RENDER surface (closing STUB rows 154/162 — a family-owned
   star has to be visible somewhere; Guiding Stars page gains a "family" badge group per the
   existing Guided-dashboard precedent in Convention #128).
4. **One quest in_progress per family** — enforced by partial unique index, not application code.
5. **LiLa never quotes individuals** in compilation/discussion summaries — enforced in the Edge
   Function synthesis path (dual enforcement per the Convention #98 precedent), not just the
   prompt.
6. **Live facilitated mode stays a stub** (`mode` column ships, `family_vision_live_mode` key
   registered, PlannedExpansionCard on the toggle). (D-12B-2)
7. **Messaging integration:** per the PRD-15 addendum ("decision can be made during build"),
   discussion threads use a STANDARD group conversation when mom opts to continue a section
   discussion in Messages — no dedicated space_type. Recorded here so the build doesn't reopen it.
8. **Hub section goes live:** the `family_vision` null-case in FamilyHub.tsx renders the active
   Family Vision Statement (or a warm empty state) once the table exists.
9. **Conventions inherited:** HITM on every generated artifact (#4); append-only
   statements/history with is_active triggers; Convention #257 dates; crisis preamble inherited
   globally; Play captures via mom only (`captured_by_mom`), consistent with Play-shell
   simplicity; voice recordings in storage with member-scoped paths.

## Slice plan (model routing per `.claude/rules/model-routing.md`)

| Slice | Scope | Routing |
|---|---|---|
| 1 | Schema: 6 tables + is_active trigger + one-in-progress partial unique index + RLS (mom-all; responder-own; section-assignment scoping per ruling 2) + 4 feature keys + `/family-vision` route + sidebar/nav parity | Sonnet xhigh + rls-verifier |
| 2 | **Chunked Whisper infrastructure** (ruling 1): client rolling-chunk recorder, per-chunk transcription, assembly + edit-before-save; reusable module (BookShelf/Meetings are future consumers) | Sonnet xhigh |
| 3 | Quest flows: Hub, Setup (member picker w/ age defaults, launch → responses + notifications), Answer Input (role-adaptive incl. lightweight 2-4Q LiLa help + voice, mom-capture paths), Section View (mom aggregation) | Sonnet xhigh |
| 4 | Synthesis: Section Discussion (LiLa theme summary, never-quote enforcement in-function, chunked recording), Section Vision Editor (regenerate + history + finalize), Family Vision Statement (fresh-generation, versions, visibility), Family Guiding Stars generation + batch save + family-GS render surface (ruling 3) + Hub section live (ruling 8) + Archives FO stub card fill | Sonnet xhigh |
| 5 | E2E (`tests/e2e/features/family-vision-quest.spec.ts`: quest lifecycle, anti-comparison RLS probes — teen CANNOT read sibling answers, mom-capture attribution, chunked transcript assembly, family-GS creation + render, one-quest-per-family index probe) + verification + LiLa knowledge + FeatureGuide | Sonnet xhigh |
| Gates | Pre-build freshness audit + Checkpoint 5 | **Fable if available, else Opus** |

## Open founder decisions (batch 4)

| # | Decision | Recommendation |
|---|---|---|
| D-12B-1 | Dispatch after PRD-12A completes (shares plumbing; chunked-Whisper de-risked alone) | Yes |
| D-12B-2 | Live facilitated mode stays a stub for MVP (async survey model per PRD) | Yes — Meetings/ThoughtSift richness doesn't change the async-first design; live mode is additive later |
| D-12B-3 | Family Guiding Stars render surface ships here (family badge group on the GS page) | Yes — creating invisible stars would be a Looks-Fine-Failure |

## Dependency edges
After: PRD12A (patterns + factory sequencing). Unblocks: Hub family_vision section, Archives FO
Family Vision card, family-level Guiding Stars (STUB 154/162), PRD-16 meetings vision context,
PRD-11B celebration filter socket. Chunked-Whisper module is reusable downstream.

---

## DISPATCH PROMPT (paste into a FRESH session — after PRD-12A closes out + batch-4 decisions resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-12B — Family Vision Quest. Pre-dispatch pack:
claude/dispatch-factory/PRD12B.md (9 rulings + 5-slice plan). Evidence:
claude/dispatch-factory/PRD12AB-RECON.md. PRD-12A shipped before you — read its close-out
coordination note and REUSE its loader/mode plumbing patterns. All pack decisions RESOLVED per
recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. Run `git log --oneline --since=2026-07-04`; re-read
CLAUDE.md conventions added since; re-verify recon refs (esp. FamilyHub.tsx family_vision null
case and useFamilyHubConfig section keys); next free migration number before every push.

READ FIRST (in order):
1. prds/personal-growth/PRD-12B-Family-Vision-Quest.md — FULL read, every word.
2. prds/addenda/ PRD-12 matches + PRD-15-Cross-PRD-Impact-Addendum.md :177-184 (messaging ruling
   7 already decides this) + PRD-16-Cross-PRD-Impact-Addendum.md :130-134.
3. claude/dispatch-factory/PRD12B.md + PRD12AB-RECON.md — rulings are LAW.
4. Create .claude/rules/current-builds/PRD-12B-family-vision-quest.md (no YAML frontmatter),
   full pre-build summary per claude/PRE_BUILD_PROCESS.md, founder approval BEFORE code.

BUILD SLICES 1→5 per the pack table. HARD RULES: anti-comparison privacy is RLS-enforced (teen/
dad read ONLY own responses + own assigned sections; mom-only aggregation — E2E probes required);
LiLa NEVER quotes individuals — enforced in the Edge Function synthesis code, not just the
prompt (Convention #98 dual-enforcement precedent); chunked Whisper is its own reusable module —
design for reuse, the PRD's anti-timeout rationale is the spec; one in_progress quest per family
via partial unique index; family Guiding Stars write owner_type='family' AND get a render home
(never create invisible records); statements/history append-only with is_active triggers; "we"
language, vision-not-policy in all generation prompts; HITM everywhere (#4); Play = mom-captures
only; Convention #257 dates; mobile parity for the new page (#16); zero hardcoded colors +
density (myaim-frontend-design skill).

PROOF: tests/e2e/features/family-vision-quest.spec.ts per the pack list (the anti-comparison RLS
probes are the load-bearing tests — they must FAIL if a teen session can read a sibling's
response row). tsc -b clean, lint clean, leak-pass pin green. Ask the founder before running
shared-fixture suites. NOTHING COMMITS until proof green AND founder eyes-on clears; selective
staging; founder confirms before push. Close-out: Checkpoint 5 zero-Missing, live_schema regen,
STUB_REGISTRY sweep (rows 154/162/186/194 + 12B stub registrations), CLAUDE.md additions, LiLa
knowledge, FeatureGuide, archive build file.
```
