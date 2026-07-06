# Pre-Dispatch Pack — PRD19: Family Context & Relationships

> **Factory status:** synthesized → decisions-pending (6 decisions, batch 4)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD19. Priority: P3 —
> **FOUNDER-PROTECTED** (standing rule: never left over; Fable-quality synthesis guaranteed).
> Evidence: `claude/dispatch-factory/PRD19-RECON.md`.
> Headline: genuinely unbuilt, but its skeleton was partially pre-created by other builds —
> PRD-21 built two of its tables early as read-only "guard tables" (nothing has EVER been able to
> write them), PRD-34's Mediator absorbed and shipped its mediation mode, and the context loader
> that all 8 relationship tools use reads PRD-19 data that cannot exist yet. Building PRD-19 is
> largely "give the already-listening infrastructure something to hear."

## Reconciliation rulings (newer wins — named explicitly)

1. **Safe Harbor bridge (backburner conflict): build with the REDUCED bridge.** PRD-20 is
   backburnered indefinitely; PRD-19's ethical-framework text pointing at Safe Harbor is stale.
   The shipped Mediator already made the right call — hardcoded DV hotline + Crisis Text Line +
   "trusted humans" bridging, no Safe Harbor references. PRD-19's surfaces adopt the identical
   pattern. Does not block the build. (D-PRD19-1)
2. **Nickname unification: ONE store — `family_members.nicknames`.** Convention #79's live
   implementation (main context assembler) uses it; the roster is Layer-1-always-loaded; migrating
   the one file that reads the other store (`relationship-context.ts:105-125`) is far cheaper and
   safer than migrating the main pipeline. `display_name_aliases` is backfill-merged into
   `nicknames` then deprecated (column stays, stops being written; removal is a later hygiene
   pass). PRD-19's spec text loses to shipped reality. (D-PRD19-2)
3. **Privacy-alias system is DISTINCT and ships per PRD** (`primary_alias` +
   `use_alias_in_external` on archive_member_settings + Screen 2 UI): it serves external-LLM name
   substitution (PRD-05C consumer), a different job than nickname recognition. Columns + UI land
   here; the substitution consumer lands with the PRD05C pack. (part of D-PRD19-2)
4. **Guided Context Interview: rebuilt to the PRD's design** — predefined 9-category question
   bank (never AI-generated questions), Haiku for answer-extraction only, local-scored
   love-languages mini-assessment. The seeded Sonnet/freeform mode is drift (unreachable from any
   UI) — same class as the BigPlans mode drift; migrate the row, register the dangling
   `archives_guided_interview` key. (D-PRD19-3)
5. **Convention #248 ambiguity resolved by AMENDING #248, not "fixing" the tools:** the
   ai_patterns.md per-tool override table is the operative truth — Cyrano/Higgins/Mediator's
   `loadRelationshipContext()` is a sanctioned specialization, not a defect. This build proposes
   the #248 clarifying amendment ("per-tool overrides documented in ai_patterns.md are sanctioned
   specializations") at close-out, and extends `relationship-context.ts` with the new sources
   (private notes write-side, relationship notes, HTRM). HTRM ALSO registers in the shared
   assembler path where general-purpose (message-coach loading per the PRD-15 addendum).
   (D-PRD19-4)
6. **Reports boundary held exactly as both documents state it:** PRD-19 ships
   `monthly_data_aggregations` + `generated_reports` + core generation flow + THREE templates
   (Monthly Summary, Homeschool Hours, Accomplishments) + the Update-LiLa-Context template's
   freshness review. Custom templates, state-specific compliance, the 16+ expanded taxonomy = the
   PRD28B pack. Zero bleed. (D-PRD19-5)
7. **Convention #243 lands HERE, non-negotiably.** PRD-19 builds the platform's first aggregation
   pipeline → it inherits the Safe Harbor exclusion obligation: `is_safe_harbor = false` filter
   built into the aggregation queries from birth + the grep-based CI check + the RLS/view guard,
   per RECON Decision 10. This is a hard verification row, not a nice-to-have.
8. **Mediation stays superseded (Convention #95) — this build completes the loose ends:** wire
   `archives_relationship_mediation` as a REAL registered key consulted by the Mediator's Full
   Picture gate (today a raw role check — key never registered, Convention #95's claim currently
   unenforced), add `is_available_for_mediation` to relationship_notes and FILTER
   `loadFullPictureContext()` by it (closes STUB:557).
9. **Special Adults get the lightweight card only** — summary view, excluded from ALL enhanced
   Screen-2 features (aliases, sharing, private notes ABOUT them still allowed — mom's notes are
   mom's — but no HTRM/interview/documents for SAs). Coordinates with the SAEX pack (shift-gating
   is SAEX's job; the archive card shape is this build's). (D-PRD19-6)
10. **Guard-table completion is additive:** missing columns (sort_order, archived_at,
    is_available_for_mediation), the `person_a_id < person_b_id` CHECK (tables are empty —
    trivial), CHECK expansions on archive_context_items (`how_to_reach_me`, `generated_report`
    types; `guided_interview`, `document_upload`, `monthly_review`, `bulk_add` sources — fixing
    BulkAddSortModal's documented fallback), `self_knowledge.share_with_spouse`. All 13 feature
    keys registered. AI Toolbox standalone page is NOT resurrected (Convention #88).
11. **PRD defects recorded, not edited:** the duplicate "Screen 8" numbering and the PRD-20
    addendum's unapplied text note are renumbered/recorded in the feature-decision file —
    `prds/` stays read-only (Convention #12).

## Slice plan (model routing per `.claude/rules/model-routing.md`; multi-session build)

| Slice | Scope | Routing |
|---|---|---|
| 1 | Schema: 4 new tables (member_documents, guided_interview_progress, monthly_data_aggregations w/ #243 guard from birth, generated_reports) + guard-table completion + CHECK expansions + alias columns + self_knowledge.share_with_spouse + 13 feature keys + RLS (private notes mom/author; relationship notes author-scoped; #245 sync-roster discipline) | Sonnet xhigh + rls-verifier |
| 2 | Screen 2 enhanced member detail (drag/sort_order, 3 sharing checkboxes w/ write-back, Private Notes UI, alias UI, HTRM card write UI, section shells for documents/reports/interview) + Screen 1 (SA lightweight cards, Reports shortcut) + Partner Sharing screen + nickname unification migration (backfill display_name_aliases → nicknames; relationship-context.ts reads nicknames) | Sonnet xhigh |
| 3 | Guided Context Interview: 9-category predefined bank (frontend constants + guided_interview_progress persistence), Haiku extraction-to-review (HITM), love-languages local scoring, mode-row migration to spec | Sonnet xhigh |
| 4 | Upload & Summarize: member_documents storage + extraction Edge Function (Sonnet complex/Haiku simple split), review screen (HITM), size/chunking edge cases | Sonnet xhigh |
| 5 | Relationship layer: Relationship Notes UI (multi-author, role starter prompts, author-scoped visibility probes), is_available_for_mediation wired into Full Picture, archives_relationship_mediation key enforced, HTRM consumption in message-coach (addendum), reduced safety-bridge language everywhere (ruling 1) | Sonnet xhigh |
| 6 | Aggregation + Reports: monthly_data_aggregations pipeline + billing-day cron (Convention #246, --no-verify-jwt), 4-step freshness review (HITM on every suggested context change), 3 templates as DATA rows, generated_reports + Reports page + Screen 5, **#243 CI grep check ships here** | Sonnet xhigh |
| 7 | E2E (`tests/e2e/features/family-context.spec.ts`: private-notes mom-only RLS probes, relationship-note author-scoping probes — teen/dad NEVER read others' notes, sharing-checkbox effects on context assembly, HTRM write→coach-load round trip, interview persistence, aggregation is_safe_harbor exclusion probe, SA lightweight exclusion) + verification + LiLa knowledge + registry sweeps | Sonnet xhigh |
| Gates | Pre-build freshness audit + Checkpoint 5 | **Fable if available, else Opus** |

## Open founder decisions (batch 4)

| # | Decision | Recommendation |
|---|---|---|
| D-PRD19-1 | Reduced safety bridge (Mediator pattern); do not block on Safe Harbor | Yes |
| D-PRD19-2 | Nicknames unify on `family_members.nicknames`; privacy-alias ships as the distinct system | Yes |
| D-PRD19-3 | Interview rebuilt to PRD spec (Haiku + predefined bank); drifted mode migrated | Yes |
| D-PRD19-4 | Amend Convention #248 (per-tool overrides sanctioned); extend relationship-context.ts | Yes |
| D-PRD19-5 | Reports boundary held: 3 templates, zero PRD-28B bleed | Yes |
| D-PRD19-6 | SA lightweight-card scope (mom's private notes about SAs allowed; no other enhanced features) | Yes |

## Dependency edges
Unblocks: the 8 relationship tools' inert context loader goes LIVE (Cyrano/Higgins/Love-Language
tools finally get private notes, relationship notes, HTRM), PRD-05C alias substitution, PRD-28B
report-taxonomy extension, PRD-23 person-detail book trigger, PRD-15 coach HTRM. Coordinates
with: SAEX (SA card vs shift-gating split), PRD28B (boundary), PRD05C (alias consumer).
Best before: PRD28B. Dispatch any time after approval.

---

## DISPATCH PROMPT (paste into a FRESH session — after batch-4 decisions resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-19 — Family Context & Relationships. This is a
founder-protected, multi-session build. Pre-dispatch pack: claude/dispatch-factory/PRD19.md
(11 rulings + 7-slice plan). Evidence: claude/dispatch-factory/PRD19-RECON.md. All pack
decisions RESOLVED per recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. Run `git log --oneline --since=2026-07-04`;
re-read CLAUDE.md conventions added since; check whether SAEX, PRD28B, or PRD05C packs shipped
(coordination edges in the pack); re-verify the recon's file:line map (esp. relationship-context.ts,
lila-mediator loadFullPictureContext, the archive_context_items CHECK constraints at migration
100035/100145); next free migration number immediately before every push.

READ FIRST (in order):
1. prds/daily-life/PRD-19-Family-Context-Relationships.md — FULL read, every word (note: the PRD
   has a duplicate "Screen 8" numbering defect — renumber in your feature-decision file, never
   edit prds/).
2. prds/addenda/PRD-19-Cross-PRD-Impact-Addendum.md — FULL; plus PRD-20-Cross-PRD-Impact-Addendum
   :86-98 (safety-language refinement — already reflected in the Mediator; your surfaces match
   the Mediator's language) and PRD-37-PRD-28B addendum :211-223 (the reports boundary you hold).
3. claude/dispatch-factory/PRD19.md + PRD19-RECON.md — the 11 rulings are LAW.
4. Create .claude/rules/current-builds/PRD-19-family-context.md (no YAML frontmatter), full
   pre-build summary per claude/PRE_BUILD_PROCESS.md, founder approval BEFORE code.

BUILD SLICES 1→7 per the pack table. HARD RULES: Convention #243 guard is built INTO
monthly_data_aggregations from its first migration (is_safe_harbor=false filter in every
aggregation query + the grep CI check + RLS/view guard — a hard Checkpoint-5 row); author-scoped
relationship-note visibility is RLS-enforced and E2E-probed (a teen reading dad's note about the
kids is a failed build); private_notes are mom+author only; NO Safe Harbor references anywhere —
use the Mediator's hardcoded-resources bridge pattern; nickname unification per ruling 2 (do NOT
add a third store); interview questions are PREDEFINED constants, Haiku only extracts; every AI
suggestion (extraction review, freshness review) through <HumanInTheMix>; report templates are
DATA rows (Convention: templates as data); billing-day cron via util.invoke_edge_function +
--no-verify-jwt (Convention #246); Convention #257 dates; AI Toolbox page stays dead (Convention
#88); zero hardcoded colors + density (myaim-frontend-design skill); mobile parity for the
Reports page (#16).

PROOF: tests/e2e/features/family-context.spec.ts per the pack list — the author-scoping and
is_safe_harbor exclusion probes are the load-bearing tests. tsc -b clean, lint clean, regression
pins green (leak-pass — you touch member-scoped privacy surfaces). Ask the founder before
running shared-fixture suites. NOTHING COMMITS until proof green AND founder eyes-on clears;
selective staging; founder confirms before push. Close-out per Checkpoint 5/6: zero-Missing
table, live_schema regen, STUB_REGISTRY sweep (rows 196/261/262/557 + guard-table notes),
Convention #248 amendment proposal + Convention #95 enforcement note, CLAUDE.md additions, LiLa
knowledge, FeatureGuide, archive build file, baton-pass files at session boundaries.
```
