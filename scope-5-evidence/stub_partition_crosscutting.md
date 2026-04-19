# Scope 5 Partition — Hooks, Services & Cross-Cutting

> **Domain:** Client-side hooks, services, utilities, shared libraries, LiLa system prompts and guided modes, cross-PRD integration points, abstract capabilities, AI behaviors that don't live in one specific Edge Function file, CSS token systems, permission helpers, and anything that doesn't fit Schema/Edge-Functions/UI cleanly.
> **Source:** `STUB_REGISTRY.md`.
> **Source checksum at dispatch:** 547 lines, 224 entries. Last-modifying commit: `c2e04e3` (2026-04-17 22:24). See `EVIDENCE_RECIPE.md` → "Registry integrity check" for the halt-on-drift protocol.
> **Count in this partition:** ~55 to-be-processed entries.
> **Recipe:** `scope-5-evidence/EVIDENCE_RECIPE.md` — READ IN FULL before processing the calibration entry.
> **Output:** `scope-5-evidence/STUB_REGISTRY_EVIDENCE_CROSSCUTTING.md`.

## Format

Each row: `STUB_REGISTRY.md line <N> | <Stub column from registry>`.

Sub-agent reads the full row from `STUB_REGISTRY.md` at the cited line number when processing.

**Rationale column stripped 2026-04-19.** Pilot review found categorization hints were wrong in ~40% of sampled cases. Trust the recipe's 4-level Identifier Extraction chain (including the (d.5) bounded-source-code-lookup step), not partition-file hints.

## Tighter evidence requirements for this partition

Crosscutting is the MOST ambiguous partition. Many entries describe abstract capabilities without a concrete implementation identifier. Per the recipe:

1. If Field 1 lands at (e) CAPABILITY-ONLY, the packet is STILL valid — Fields 2-4 become "skipped" and Field 5 records the ambiguity.
2. Resist inventing an identifier to make the packet look complete. Empty grep results are honest; fabricated searches are noise.
3. Expect ~30-50% of this partition's packets to land in "ambiguous-needs-founder-judgment" at morning synthesis. That's correct, not failure.

## Calibration entry (process FIRST in this partition)

**Line 493 — `createTaskFromData` guard for `taskType='sequential'`.**

Why this one: specific, behaviorally-verifiable claim. The stub row explicitly names `createTaskFromData` AND describes a specific behavior ("guard throws a loud error"). Field 1 resolves at level (a). Field 2 grep must find the function AND the guard clause — a rigorous packet quotes the throw statement and the triggering condition.

Expected evidence-packet content (founder's known-good answer — verified 2026-04-19 against the working tree):

- Field 1 (a) → identifier `createTaskFromData`, source: stub entry line 493. Secondary identifier: the `taskType === 'sequential'` condition.
- Field 2 grep for `createTaskFromData` → `src/utils/createTaskFromData.ts`. At line 58, the guard clause reads: `if ((data.taskType as string) === 'sequential') { throw new Error(...) }`. The throw message is: `"createTaskFromData: sequential collections must be created via useCreateSequentialCollection / SequentialCreatorModal, not through TaskCreationModal. This is a bug — check the caller."` Packet should quote the throw statement verbatim from lines 58-64. Secondary grep for `TaskCreationModal` + `initialTaskType === 'sequential'` should surface the defensive `console.warn` skip.
- Field 3: Caller grep for `createTaskFromData`. Expected: multiple call sites across task-creation entry points. Last-touching commit should date to Phase 1 (2026-04-06) or later.
- Field 4: PRD-09A/09B Studio Intelligence addendum should describe the guard. CLAUDE.md convention 151 states the guard exists.
- Field 5: Record that the sub-agent did NOT run the E2E tests — only confirmed the spec file exists.
- Field 6 neutral summary: guard function located, guard clause quoted, throw message preserved, convention 151 corroborates, multiple callers. No verdict.

If the grep finds `createTaskFromData` but no throw-on-sequential clause, OR if the throw message diverges from the quoted version, that's the red flag — either the guard was removed, rewritten, or the sub-agent missed it.

Process this entry first. Founder compares your calibration packet against the expected content above before approving the partition for full run.

## Entries (to-be-processed)

| Line | Stub identifier |
|---|---|
| 25 | Session duration per role |
| 41 | Post-shift LiLa summary compilation |
| 50 | LiLa Optimizer mode |
| 52 | Help/Assist pattern matching (13 FAQs) |
| 53 | Opening messages (core + task_breaker) |
| 54 | Context assembly stubs (7 sources) |
| 55 | Permission + privacy filtering |
| 57 | Page context passing |
| 60 | Context sources (GuidingStars, etc.) |
| 61 | Review & Route pipeline |
| 62 | Long conversation summarization |
| 63 | Mode auto-routing mid-conversation |
| 64 | Archive context loading |
| 67 | Victory detection/recording (AIR) |
| 68 | Context Learning write-back |
| 69 | Mediator/Peacemaker mode |
| 70 | Decision Guide mode |
| 71 | Fun Translator mode |
| 72 | Teen Lite Optimizer |
| 73 | Homework Checker |
| 76 | Relationship tools person-context |
| 82 | LiLa conversation summary (long convos) |
| 90 | Morning/Evening rhythm integration |
| 91 | Victory Recorder logging from intentions (AIR) |
| 92 | InnerWorkings context in LiLa |
| 93 | LiLa self-discovery guided mode |
| 94 | "Craft with LiLa" — pre-primed conversation for GS crafting |
| 95 | "Extract from Content" — upload + extract GS entries |
| 96 | Family-level Guiding Stars creation |
| 98 | Morning/Evening Review GS integration |
| 99 | Victory Recorder GS thread detection |
| 100 | Declaration language coaching |
| 101 | Victory Recorder daily intention summary |
| 105 | "Discover with LiLa" (self_discovery guided mode) |
| 107 | Archives "checked somewhere, checked everywhere" |
| 108 | Content extraction from Knowledge Base (IW entries) |
| 109 | Messaging notifications |
| 111 | Send to Person (messaging) |
| 112 | Send to Calendar |
| 114 | Reward system integration |
| 115 | Allowance pool calculation |
| 116 | Widget milestone → victory |
| 117 | Auto-victory from task completions |
| 119 | Complex goal → Project Planner |
| 120 | Family Vision Quest discussions |
| 129 | Family Meeting Notes structured routing |
| 130 | Partner Profile aggregation in Archives |
| 134 | Monthly victory auto-archive |
| 135 | Seasonal Family Overview prompts |
| 136 | Archive full-text search |
| 137 | Dad edit access in Archives |
| 140 | Context presets / smart modes |
| 150 | Push notification delivery |
| 152 | Out of Nest SMS notifications |
| 153 | Out of Nest compose picker |
| 154 | Morning digest/Daily Briefing |
| 155 | Meeting gamification connection |
| 157 | Meeting voice input/recording (Record After) |
| 158 | Meeting transcription + Review & Route from voice |
| 159 | Goals routing destination from meeting action items |
| 160 | LiLa section suggestions for custom templates |
| 161 | Family council voting system |
| 162 | "Refer back to decisions" cross-conversation intelligence |
| 166 | MindSweep approval learning |
| 167 | Weekly MindSweep intelligence report |
| 174 | Reflection export as document |
| 187 | PRD-18 Phase C: MindSweep-Lite `delegate` disposition → real `family_request` |
| 196 | State-specific compliance formatting |
| 198 | Teen "Tell LiLa About Yourself" |
| 199 | Safe Harbor → Library RAG |
| 200 | Safe Harbor offline support |
| 210 | Optimize with LiLa (full flow) |
| 211 | Deploy with LiLa (skill deployment) |
| 215 | LiLa proactive Vault suggestions |
| 216 | Seasonal tag auto-surfacing (date logic) |
| 218 | Session report re-import via Review & Route |
| 221 | Learning paths (multi-item sequences) |
| 222 | Creator economy / user-submitted tools |
| 224 | Content versioning |
| 225 | Scheduled publishing |
| 226 | Collaborative filtering recommendations |
| 227 | Semantic/vector search for Vault |
| 228 | Out of Nest → sibling messaging |
| 232 | Cross-family book recommendations |
| 238 | Family Challenges (PRD-24C) |
| 239 | Boss Quests game mode |
| 240 | Bingo Cards game mode |
| 241 | Evolution Creatures game mode |
| 242 | Passport Books game mode |
| 247 | Randomizer mastery → gamification pipeline |
| 266 | Tracker Goal page earning (widget data point consumption) |
| 276 | Caregiver push notifications |
| 277 | Homeschool budget/cost tracking |
| 278 | Advanced financial reports |
| 281 | IEP/document understanding |
| 282 | ESA vendor integration |
| 284 | Safety journal/message scanning |
| 287 | Board session export |
| 288 | Translator language support |
| 289 | Standards linkage on portfolio |
| 290 | Portfolio export |
| 292 | Image auto-tagging |
| 298 | Blog comment threading |
| 299 | Blog search |
| 300 | Blog RSS feed |
| 301 | Blog email newsletter |
| 302 | Pinterest auto-pin |
| 305 | External calendar sync |
| 306 | Google Calendar integration |
| 329 | Before-send coaching in Messages tab |
| 335 | Advanced NBT (energy, Best Intentions, family context) |
| 336 | "Ask Mom" from NBT |
| 345 | Completion-dependent scheduling |
| 346 | Custody patterns |
| 347 | Family holiday calendar auto-exclusion |
| 348 | ICS export from RRULE strings |
| 349 | LiLa schedule extraction cards |
| 350 | LiLa conversational schedule builder |
| 357 | All 38 color themes |
| 361 | Shell token overrides (touch/font/spacing) |
| 362 | Theme persistence to Supabase |
| 373 | PWA entry points |
| 374 | Timer idle reminders |
| 375 | Timer → homeschool time logs |
| 376 | Timer → task completion threshold |
| 377 | Timer → widget data points |
| 415 | Multiplayer layer (widgets) |
| 419 | Linked pair deployment (widgets) |
| 422 | Widget milestone → Victory Record |
| 423 | Widget → Gamification progress |
| 424 | Allowance Calculator → payment |
| 431 | View sync logic (computeViewSync) |
| 438 | Unmark cascade behavior |
| 440 | Role-scoped queue visibility |
| 447 | Notification auto-dismiss on queue processing |
| 448 | Gamification reward/streak reversal on unmark |
| 454 | ThoughtSift guided modes (5) |
| 455 | `relationship_mediation` guided mode |
| 460 | LiLa proactive ThoughtSift tool suggestion |
| 461 | Board session export |
| 462 | Translator non-English language support |
| 467 | BookShelf enrichment for BoD personas |
| 474 | LiLa follow-up question after custom persona creation |
| 491 | `capability_tags` required on StudioTemplate type |
| 493 | **CALIBRATION** — `createTaskFromData` guard for `taskType='sequential'` |
| 511 | LiLa `studio_create_guide` conversational mode |
| 512 | Conversational school year planner |
| 513 | Living shopping list enhancement |
| 514 | Backburner/Ideas activation as victory |
| 515 | `homeschool_time_review` LiLa guided mode |
| 518 | Biweekly/monthly allowance periods |
| 519 | Business work export (formatted PDF/CSV) |
| 520 | Dad payment delegation |
| 521 | Teen purchase deduction requests via PRD-15 |
| 536 | `_requestingMemberId` parameter in `supabase/functions/_shared/relationship-context.ts:261` |

## Ambiguous entries — ADVISORY ONLY, do NOT process twice

All entries below are in the to-be-processed table above.

- **Lines 357 + 361 + 362 (theme system triple)** — span CSS tokens, React hook, and Supabase persistence. A sub-agent may produce one shared-evidence packet covering all three and link from the other two packets.
- **Line 115 (Allowance pool calculation)** — could be Schema if the calc is a Postgres function; grep will reveal which.
- **Line 536 (`_requestingMemberId` parameter)** — already resolved per AUDIT_REPORT_v1.md Phase 0.26 Session 3. Packet should verify resolution is complete, not re-investigate.

If the same line number appears in another partition's to-be-processed table, STOP and report the conflict under a `## CROSS-PARTITION CONFLICT` heading.

## Out of scope for this partition

Entries whose primary identifier is a React component, Edge Function endpoint, or concrete DB object belong in a different partition. Record partition mismatch and move on.
