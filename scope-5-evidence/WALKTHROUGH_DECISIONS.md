# Scope 5 Stub Reconciliation — Walk-Through Decisions Log

> **Status:** OPEN — walk-through in progress.
> **Started:** 2026-04-19.
> **Source draft:** `scope-5-evidence/STUB_REGISTRY_RECONCILIATION_DRAFT.md`
> **Purpose:** Append-only log of founder decisions per round. If this session's context fills, a fresh session can pick up from here without re-reading all evidence.

## Recovery pointer

If this file is being read by a fresh session: the walk-through protocol lives in `claude/web-sync/SCOPE_5_STUB_RECONCILIATION.md` §10. The reconciliation draft is the agenda. Decisions below are the founder's final calls — they override the draft's "recommendations." After Round 5 is closed, a separate Claude Code session applies these decisions to `STUB_REGISTRY.md` in a single commit, then a second commit archives evidence files per §10.8.

## Round 1 — Aggregate Findings (Section 1, 11 items)

> Per-finding: founder's decision + short rationale. "Apply per synthesis recommendation" is valid shorthand.

### Finding A — PRD-28B absence pattern (entries 195, 196, 289, 290, 291, 517)
**Decision (2026-04-19):** Flip entries 195, 196, 289, 290, 291 from ✅ Wired to
⏳ Unwired (MVP). Keep "Wired By" column as PRD-28B on each. Add a one-line note on
each of the five referencing entry 517 as the dependency parent (the 6-table PRD-28B
infrastructure those features depend on).

**Rationale:** Entry 517 already names all 6 PRD-28B tables as unbuilt. Features
195/196/289/290/291 cannot be Wired if their dependency tables don't exist. "Phase 32"
in the Wired By column on those rows is aspirational placeholder, not a completed
phase marker. Founder confirmed PRD-28B has not been built.

### Finding B — AIR cluster incoherence (entries 67, 91, 101, 117)
**Decision (2026-04-19):** Four-row cluster resolution.

| Line | From | To | Note to add |
|---|---|---|---|
| 67 | ✅ Wired | ⏳ Unwired (MVP) | "All 3 designed AIR sources (task, intention, widget) await build. List-completion auto-victories fire via separate `list_completed` path (migration 100102), not AIR." |
| 91 | ✅ Wired | ⏳ Unwired (MVP) | "`useLogIntentionIteration` writes iteration + activity_log; no victory insert in the mutation." |
| 101 | ⏳ Unwired (MVP) | (no change) | Consistent — no daily-summary surface found. |
| 117 | ✅ Wired | ⏳ Unwired (MVP) | "Auto-victory call commented out in `useTaskCompletion.ts:106-108` with `(stub — PRD-11)` marker." |

**Rationale:** AIR is defined in `claude/ai_patterns.md` as "Silent auto-routing of
achievements into the victories system. No user action required; the platform detects
milestones and creates victory records automatically." Founder confirmed UX intent
matches: no friction, fully automatic. Under that definition, widget-milestone grep
(2026-04-19) returned zero writers across src/, migrations, and Edge Functions —
widget_milestone is a placeholder enum value with no implementation. Intention and
task AIR sources also unimplemented per in-code evidence. List-completion auto-victory
is architecturally a separate pattern (not listed as an AIR source in ai_patterns.md)
that happens to do automatic victory creation, so it does not rescue the AIR rows.

**Pattern flag:** Finding A (PRD-28B) and Finding B (AIR) both show the same drift
shape — scope locked in (columns + enum values created), "Wired" stamped, writer code
never followed. If a third such cluster surfaces in Rounds 2-3, promote to a systemic
finding for AUDIT_REPORT_v1.md.

### Finding C — Looks-Fine-Failure pattern (entries 105, 117, 127, 128, 131, 165, 323, 535)
**Decision (2026-04-19):**

| Line | From | To | Notes |
|---|---|---|---|
| 105 | ⏳ Unwired (MVP) | (no change) | Registry correctly marks "Discover with LiLa" as unwired; `InnerWorkings.tsx:470` shows a "Coming soon" toast. Consistent. |
| 117 | — | See Finding B | Already resolved in Finding B cluster decision. |
| 127 | ⏳ Unwired (MVP) | (no change) | LifeLantern aggregation in Archives — inline placeholder card. Consistent. |
| 128 | ⏳ Unwired (MVP) | (no change) | Family Vision Statement in Family Overview — `"Family Vision Statement — STUB"` comment. Consistent. See Finding J for related PRD-12B attribution question. |
| 131 | ⏳ Unwired (MVP) | (no change) | Shared Lists aggregation in Archives — placeholder card. Consistent. |
| 165 | ✅ Wired | 🔗 Partially Wired | MindSweep email forwarding. Edge Function code-complete; blocked on DNS / email forwarding provider configuration. WIRING_STATUS.md and the function header both already call it a stub; registry's "Wired" claim was premature. "Partially Wired" accurately reflects code-complete-but-not-active state. |
| 323 | ⏳ Unwired (MVP) | ✅ Wired | GuidedVictories.tsx is a functional page consuming real `useVictories` hooks (spot-verified 2026-04-19). Registry "warm stub" wording was stale — the page has been live in the Guided shell. |
| 535 | ⏳ Unwired (MVP) | (no change) | Safe Harbor placeholder UI + ViewAs exclusion. PlaceholderPage + PlannedExpansionCard in place. Consistent. |

**Rationale:** Finding C's Looks-Fine-Failure pattern was checked systematically across
8 candidate entries. Five (105, 127, 128, 131, 535) were registry-consistent — the
registry already marks them unwired and the code visibly shows placeholders. One (117)
was absorbed into Finding B's AIR cluster decision. The two that required action go in
opposite directions: 165 overstated ("Wired" when it's code-complete-but-inert), 323
understated ("Unwired (MVP)" when the page is live). Founder confirmed partial-wired
for 165 (recognizes completed code); Wired for 323 (after spot-verification).

### Finding D — Duplicate registry entries (7 pairs)
**Decision (2026-04-19):**

**Same-status duplicate pairs — merge** (keep one row, delete the other — the final
registry-apply session during commit 1 will choose which row to keep based on which
sits in the most natural PRD section; superset of detail notes preserved):

| Pair | Capability |
|---|---|
| 56 & 81 | Voice input (Whisper) |
| 62 & 82 | Long conversation summarization |
| 287 & 461 | Board of Directors session export |
| 288 & 462 | Translator language support |
| 133 & 197 | My Circle (non-family contacts) |

**Conflicting-status duplicate pairs — merge AND resolve status:**

| Pair | Resolution (2026-04-19 verification) |
|---|---|
| 285 & 457 (Community persona moderation queue) | Merge → 🔗 Partially Wired. `content_policy_status` column + writer (Edge Function sets `pending_review` for community submissions) + consumer filter (`.eq('approved')`) all exist. No admin UI page, no approve/block RPC. Queue fills but has no drain surface. |
| 286 & 458 (Community lens moderation queue) | Merge → 🔗 Partially Wired. Same shape as the persona pair — the Admin Console itself is a PlannedExpansionCard roadmap item per `feature_expansion_registry.ts:278-282`, so neither persona nor lens moderation has a live surface. |

**Verification result:** Grep sweep across `src/pages/admin/**`, `src/pages/staff/**`,
`src/**/AdminConsole*`, `src/**/*Moderation*` returned zero files. `content_policy_status`
read/write sites only consume the approved-gate; no pending-review queue UI exists.
Conclusion: BACKEND-ONLY → 🔗 Partially Wired for all four affected rows.

**Rationale:** Founder confirmed uncertainty about whether the community moderation
admin console is built. Grep verification landed the status. Merge approach chosen
across all pairs because the registry tracks what's built, not provenance — git log
preserves history.

### Finding E — Stale count claims / broken template deploy (upgraded 2026-04-19)
**Decision (2026-04-19):**

Status flips (substantive — not just count drift):
| Line | From | To | Note to add |
|---|---|---|---|
| 390 | ✅ Wired | 🔗 Partially Wired | "Template cards render in Studio; click-through deploys nothing or drops user into generic task/tally creator for most templates. Tailored wizard flows pending — feeds Universal Setup Wizards workstream." |
| 413 | ✅ Wired | 🔗 Partially Wired | "Widget starter config cards render; deploy flow either no-ops or falls through to generic creator. Wizard flows pending — feeds Universal Setup Wizards workstream." |

Hygiene edits (no status change):
| Line | Edit |
|---|---|
| 492 | Drop exact count "(27 seed templates)" — replace with "(all seed templates)". |
| 357 | Drop exact count "38 themes" — replace with "all configured themes" pending a separate grep verification of ThemeKey union vs. seeded theme list. |

**Rationale:** Founder reported that tapping seed templates in Studio currently does
nothing or misroutes to the generic task creator / tally widget. Same behavior for
widget starter configs. Synthesis framed this as stale-count hygiene — incorrect
scoping. Lines 390 and 413 upgraded to status flips. Lines 492 and 357 remain
hygiene. A template+widget+tracker inventory workstream (separate from this walk-
through) will enumerate every creation entry point and feed the Universal Setup
Wizards design workstream. Founder comment 2026-04-19: "the widgets, trackers, etc.
are scattered so it is hard to get a list of all the existing ones, and where they
are located" — underlines that a count alone is insufficient; an inventory is needed.

### Finding F — PRD-10 Phase B/C silently delivered via Build M (entries 214, 417, 423)
**Decision (2026-04-19):**

| Line | From | To | Note to add |
|---|---|---|---|
| 214 | ⏳ Unwired (MVP) | (no change) | Vault recommended dashboard widget — Build M didn't touch this; registry correctly marks as unwired. |
| 417 | ⏳ Unwired (MVP) | ✅ Wired | "Delivered via Build M (2026-04-11). `coloring_reveal_library` table (32 Woodland Felt subjects) + `ColorRevealCanvas` + `ColorRevealTallyWidget` rendered on 3 dashboards. PRD-10 Phase C's original `coloring_image_library` table was superseded." |
| 423 | ⏳ Unwired (MVP) | 🔗 Partially Wired | "Infrastructure delivered via Build M (page_earning_tracker_widget_id + threshold columns on member_sticker_book_state, CLAUDE.md Convention #210). Downstream widget-data-point consumer trigger remains unwired — see stub 266." |

**Rationale:** Finding F is the counterpoint pattern to Findings A and B — registry
UNDERSTATED what's built because Build M (PRD-24+PRD-26 Configurable Earning
Strategies, 2026-04-11) silently delivered infrastructure that the registry still
marked as pending PRD-10 Phase B/C. The coloring-reveal work is fully delivered
under a different table name than the original PRD-10 Phase C design; registry
should reflect that. The widget→gamification path has infra but not the end-to-end
trigger, so 🔗 Partially Wired is honest.

### Finding G — PRD-21A Vault delivery methods silently delivered (entries 212, 213)
**Decision (2026-04-19):**

| Line | From | To | Note to add |
|---|---|---|---|
| 212 | 📌 Post-MVP | ✅ Wired | "Delivered Phase 25 AIVault wiring (commit 2026-04-07). `AIToolDetail.tsx` has full `delivery_method === 'embedded'` branch rendering sandboxed iframe." |
| 213 | ⏳ Unwired (MVP) | ✅ Wired | "Delivered Phase 25 AIVault wiring (commit 2026-04-07, 'Vault native tools launch into correct modal (Translator, BoD + all others)'). `openTool(guided_mode_key)` + `ToolLauncherProvider` dispatch across 9 files." |

**Rationale:** Same pattern as Finding F — registry understated what shipped. Phase
25 AIVault wiring (2026-04-07) delivered both Vault delivery methods. Founder
confirmed both flows work today in the app.

### Finding H — Rhythms Phase B/C/D entries mostly consistent (entries ~175-197)
**Decision (2026-04-19):**

No status flips. The ~12 rhythm-section registry entries (PRD-18 Phase A/B/C/D)
accurately reflect code reality. Only change: add a glossary clarification to the
Status Legend at the top of STUB_REGISTRY.md.

**Glossary addition** (to be applied during the final STUB_REGISTRY.md apply commit):

🚫 Removed — Removed from the seed default (e.g., section dropped from default
morning/evening rhythm, template removed from default Studio shelf). The underlying
code / component may still exist in the repo for custom configurations or future
reuse. This symbol does NOT mean "code deleted."

Examples: entries 180 (`routine_checklist` placeholder) and 181 (`task_preview`) —
both removed from the default morning rhythm seed in migration 100111 per
CLAUDE.md Convention 168 (the "front door OR genuinely helpful" rule). The React
section components for both still exist in the codebase.

**Rationale:** Registry entries accurately marked. Glossary addition prevents future
readers from misinterpreting 🚫 Removed as "source code deleted." Low-cost, prevents
friction for future cold-start sessions reading the registry.

### Finding I — CLAUDE.md #161 line-number drift (APPLIED 2026-04-19)
**Decision (2026-04-19):** Applied as standalone doc-hygiene commit 303a1bb.
CLAUDE.md Convention 161 PendingApprovalsSection reference updated from "Tasks.tsx
(line 1062)" to "Tasks.tsx (line 1585)". Separate from Round 5 STUB_REGISTRY
apply commit — different file scope.

**Rationale:** One-line documentation fix, 30 seconds to apply, no reason to defer to
Round 5. Doesn't belong in the STUB_REGISTRY reconciliation commit because it
touches CLAUDE.md, not STUB_REGISTRY.md.

### Finding J — Family Vision Quest (PRD-12B) attribution gap (entries 88, 120, 128)
**Decision (2026-04-19):**

| Line | From | To | Note to add |
|---|---|---|---|
| 88 | ✅ Wired | ⏳ Unwired (MVP) | "`owner_type` column on `guiding_stars` supports family-scope values but no UI creates or renders family-owned Guiding Stars. PRD-12B schema never built. Column was prep-scaffolded under PRD-06/07 repair work; full Family Vision Quest feature deferred." |
| 120 | 🔗 Partial (audio stub) | ⏳ Unwired (MVP) | "PRD-12B schema (`family_vision_quests`, `vision_sections`, `family_vision_statements`, etc.) never built. Feature unavailable in app. Partial claim was aspirational." |
| 128 | ⏳ Unwired (MVP) | (no change) | Consistent — `"Family Vision Statement — STUB"` comment in `FamilyOverviewDetail.tsx:678`. |

**Rationale:** Founder decision rule (2026-04-19): "If it doesn't work in the app, it is
not wired." PRD-12B was never officially built. Some related columns/hooks may have
been prep-scaffolded to make future PRD-12B work land cleanly, which is probably why
rows 88 and 120 claimed Wired/Partial attribution to PRD-12B. Under the founder's
rule, scaffolding doesn't count. All three rows now honestly reflect "not available
in the app today."

### Finding K — Stage/seed vs build-completion conflation (entries 155, 285, 286)
**Decision (2026-04-19):** No new action. Entries 285 and 286 were resolved under
Finding D. Entry 155 (Meeting gamification connection) was verified consistent with
code reality — `facilitator_member_id` column exists, gamification pipeline not
connected, registry correctly marks ⏳ Unwired (MVP). Finding K serves as a
pattern-observation roll-up confirming the "column-scaffolded but feature-not-built"
shape seen in Findings A, D, F, J.

**Rationale:** Pattern-observation finding; no new flips. Will be incorporated into
the SCOPE-5 finding summary added to AUDIT_REPORT_v1.md at Round 5 close.

## Round 2 — Section 2 Contradictions (17 items)

**Summary:** 16 of 17 contradictions resolved as byproducts of Round 1 aggregate
findings. One standalone contradiction (line 398) resolved independently below.

**Resolved by Round 1 cross-reference:**
| Line(s) | Resolved under |
|---|---|
| 67, 91, 117 | Finding B |
| 165, 323 | Finding C |
| 195, 196, 289, 290, 291 | Finding A |
| 212, 213 | Finding G |
| 285, 286 | Finding D + K |
| 413 | Finding E |
| 417 | Finding F |

**Standalone contradiction — Line 398 (System list auto-provision):**

| Line | From | To | Note to add |
|---|---|---|---|
| 398 | ⏳ Unwired (MVP) | ✅ Wired | "Delivered via `auto_provision_member_resources` trigger in migration 00000000100101 (list_provision fix). Backfill for existing members included in same migration. Trigger body preserved verbatim in all 8 subsequent revisions (100103–100115). Founder verified 2026-04-19 that Backburner and Ideas lists appear for her family members. Caveat: routing INTO these lists from other features is tracked separately in WIRING_STATUS.md and remains untested as of walk-through date." |

**Rationale:** Founder confirmed Backburner and Ideas lists appear in the Lists page
for her family members (2026-04-19). That verifies the auto-provision scope of this
registry row. Broader questions about routing use and review surfaces are distinct
concerns, not in 398's scope. Previously logged as SCOPE-5.F1 in AUDIT_REPORT_v1.md
during pilot calibration.

## Round 3 — Section 3 Ambiguous entries (45 items)

**Summary:** 45 entries processed via bulk-verdict worker on 2026-04-20. Breakdown:
- 14 TYPE A (cross-references to Round 1/2 findings)
- 26 TYPE B (worker-proposed verdicts, founder batch-approved 2026-04-20)
- 5 TYPE C (founder per-entry judgment, adjudicated 2026-04-20)

---

### Round 3 TYPE A — Cross-references (14 entries, no new verdict)

These entries were already resolved in Round 1 or Round 2. Recorded as cross-references only.

| Line | Stub title (truncated) | Resolved under |
|---|---|---|
| 62 / 82 | Long conversation summarization (duplicate pair) | Finding D — merge, keep 📌 Post-MVP |
| 88 | Family-level GuidingStars | Finding J — ✅ Wired → ⏳ Unwired (MVP) |
| 120 | Family Vision Quest discussions | Finding J — 🔗 Partial → ⏳ Unwired (MVP) |
| 133 / 197 | My Circle (non-family contacts) (duplicate pair) | Finding D — merge, keep 📌 Post-MVP |
| 155 | Meeting gamification connection | Finding K — consistent, keep ⏳ Unwired (MVP) |
| 287 / 461 | Board session export (duplicate pair) | Finding D — merge, keep 📌 Post-MVP |
| 288 / 462 | Translator non-English language (duplicate pair) | Finding D — merge, keep 📌 Post-MVP |
| 357 | All color themes (count hygiene) | Finding E — drop "38" exact count |
| 390 | Studio seed templates ("15 in DB") | Finding E — ✅ Wired → 🔗 Partially Wired |
| 423 | Widget → Gamification progress | Finding F — ⏳ Unwired (MVP) → 🔗 Partially Wired |
| 445 | AI Auto-Sort for views | Finding E scope context — note wording update, no status change |
| 457 / 458 | Community moderation queues (duplicate with 285/286) | Finding D — merge + 🔗 Partially Wired |
| 492 | capability_tags ("on all 27 seed templates") | Finding E — drop "27" exact count |

---

### Round 3 TYPE B — Worker-proposed verdicts, batch-approved (26 entries)

**24 entries keep current status** (evidence supports the claimed state — no flip):

| Line | Current | Rationale |
|---|---|---|
| 42 | ⏳ Unwired (MVP) | No `recalculate-tier-blocks` Edge Function |
| 138 | 📌 Post-MVP | Archives-side staleness absent; LiLa-side refresh button is a different surface |
| 139 | 📌 Post-MVP | `overview_card_content` column renders; Haiku generation absent |
| 148 / 163 | 📌 Post-MVP | No community-sharing surface for meeting templates |
| 153 | ⏳ Unwired (MVP) | Compose picker hook reads family_members only; Out of Nest members not surfaced |
| 230 | ⏳ Unwired (MVP) | No DROP migration for old per-family BookShelf tables |
| 243 | ⏳ Unwired (MVP) | Task unmark cascade explicitly unimplemented per Convention #206 |
| 266 | ⏳ Unwired (MVP) | **Misleading-UI note added** — GamificationSettingsModal exposes Tracker Goal page earning mode option but data-point trigger not wired |
| 267 | 📌 Post-MVP | `theme_override_id` column exists; no faith-themed seed |
| 268 | 📌 Post-MVP | `streak_milestone` not in `creature_earning_mode` enum |
| 422 | ⏳ Unwired (MVP) | `widget_milestone` placeholder enum with zero writers |
| 447 | ⏳ Unwired (MVP) | Queue processing exists; notification-system integration not built |
| 448 | ⏳ Unwired (MVP) | Gamification reversal part of unwired cascade (Convention #206) |
| 454 | ✅ Wired | 5 ThoughtSift mode_keys seeded + Edge Functions + rows |
| 459 | 📌 Post-MVP | No persona library browse page with category filtering |
| 460 | 📌 Post-MVP | No LiLa proactive ThoughtSift tool suggestion |
| 467 | ⏳ Unwired (MVP) | `bookshelf_enriched` column exists; no consumer |
| 469 | ⏳ Unwired (MVP) | No `is_available_for_mediation` column |
| 476 | ⏳ Unwired (MVP) | No `safety-classify` Edge Function, no `safety_flags` table |
| 488 | ✅ Wired | CLAUDE.md #156 filter='all' behavior + Phase 1 e2e test |
| 515 | 📌 Post-MVP | See TYPE C #5 — superseded by split decision below |
| 518 | 📌 Post-MVP | CHECK constraint allows biweekly/monthly; UI is weekly-only |
| 534 | ⏳ Unwired (MVP) | Safe Harbor 'manage' preset exists, dormant |
| 49 cluster (23-44) | Mixed Wired | Session 3 confirmed Foundation/LiLa-core cluster consistent |

**2 entries flip:**

| Line | From | To | Note to add |
|---|---|---|---|
| 438 | 🔗 Partially Wired | ⏳ Unwired (MVP) | "Aligned with line 243 and Convention #206 — unmark cascade explicitly unimplemented. Previously 'Partial' status was inconsistent with lines 243/448." |
| 496 | 🔗 Partially Wired | ✅ Wired | "Dashboard rendering of linked routine steps landed 2026-04-13 per WIRING_STATUS.md; step_type enum + all three linked branches (sequential/randomizer/task) render in RoutineStepChecklist.tsx:214-221." |

---

### Round 3 TYPE C — Founder per-entry judgment (5 entries)

#### Entry 1 — Line 50 — LiLa Optimizer mode
- **From:** ✅ Wired
- **To:** ⏳ Unwired (MVP)
- **Note to add:** "MISLEADING UI: `optimizer` mode_key appears in LiLa mode picker, but PRD-05C Optimizer flow not built. TODO in `PromptPackDetail.tsx:152` explicitly notes the gap. Tapping the mode does not launch an optimization experience."
- **Founder (2026-04-20):** Confirmed "not a prompt optimizer" — feature does not function in app.

#### Entry 2 — Line 102 — Dashboard widget for BI celebration
- **From:** ⏳ Unwired (MVP)
- **To:** (no change)
- **Note to add:** "Planned celebration/milestone UI moment when a Best Intention threshold is hit (confetti/congrats card). Distinct from the existing `InfoFamilyIntention.tsx` tally display widget — the tally is a separate feature and is not the referent of this stub."
- **Founder (2026-04-20):** Confirmed no celebration UI exists in app; tally widget is a distinct feature.

#### Entry 3 — Line 269 — Timer goal earning mode
- **From:** 📌 Post-MVP
- **To:** (no change)
- **Note to add:** "Time-interval page unlock earning mode (e.g., new page unlocks every day or every N days). Distinct from Build M's `tracker_goal` mode (which is threshold-on-widget). Not built."
- **Founder (2026-04-20):** Clarified scope — time-based earning is intervals (day/N-days), not threshold-on-timer-widget. Rules out supersede by tracker_goal.

#### Entry 4 — Line 414 — Phase B tracker types (count stale + partial wiring)
- **From:** ⏳ Unwired (MVP)
- **To:** 🔗 Partially Wired
- **Note to add:** "11 of 13 Phase B tracker types wired (per PHASE_B_TRACKER_INVENTORY.md, 2026-04-20). 2 remain unbuilt: `color_reveal` and `gameboard`. MISLEADING UI: both unbuilt types appear in WidgetPicker.tsx:34 under goal_pursuit.trackerTypes, but neither has a case branch in WidgetRenderer.tsx — selecting them falls through to PlannedTrackerStub ('Coming soon'). Note: `color_reveal` here refers to the WidgetPicker tracker path, which is distinct from Build M's separately-rendered `ColorRevealTallyWidget` — same name, different code paths. Remediation options (picker removal vs. code-path bridge) are post-audit backlog."
- **Founder (2026-04-20):** Approved worker inventory verdict.

#### Entry 5 — Line 515 — `homeschool_time_review` LiLa guided mode
- **To:** Split into TWO registry rows.
- **Row A (NEW entry — to be inserted during final registry apply):**
  - **Title:** "homework-estimate AI subject allocation"
  - **Status:** ✅ Wired
  - **Note:** "Edge Function `homework-estimate` + inline invocation from `LogLearningModal.tsx:69`. When mom types a learning description, AI estimates which subject(s) to allocate the logged time to. Migration 00000000100138 seeded the `homeschool_time_review` mode_key used by this call."
- **Row B (existing line 515 — status unchanged, wording clarified):**
  - **Title:** "Full `homeschool_time_review` LiLa guided-mode conversation"
  - **Status:** 📌 Post-MVP (no change)
  - **Note to add:** "Conversational weekly time-log review with LiLa. Depends on PRD-05 day-data context enhancement. The Edge Function under this mode_key is wired for inline subject estimation (see Row A) but no guided-mode conversation UI surface exists."
- **Founder (2026-04-20):** Approved split. Note: founder mentioned not remembering how the homework features are intended to work — split captures code reality regardless.

## Round 4 — Section 4 Confirmed-Accurate entries (~160 items)

**Summary:** Verified via spot-check worker on 2026-04-20 (22-entry random sample
across 12 Section 4 categories). 21 of 22 confirmed; 1 exception resolved below.
Remaining ~138 entries batch-approved based on the ~95% spot-check confirmation rate
(21/22 = 95.5%). All Section 4 entries except line 321 keep their current status.

### Exception — Line 321 — Celebrate section (Guided Dashboard)
- **From:** ⏳ Unwired (MVP)
- **To:** ✅ Wired
- **Note to add:** "`CelebrateSection.tsx` is a functional 60-line component rendering
  a gold Celebrate! button wired to launch the DailyCelebration overlay. Imported
  and rendered at `GuidedDashboard.tsx:21,165`. CLAUDE.md Convention #179 documents
  as live. Reverse-direction Looks-Fine-Failure same as Finding C Entry 323."

### Deferred to Round 5 hygiene (not status changes)
- **Line 399 (ListPicker overlay):** stub wording ambiguity — queue-based routing
  works; no separate overlay component exists. Note clarification only.
- **Line 408 (6 tracker types):** count ambiguity (Finding E pattern). Count-drop
  hygiene only.

### Batch approval
The remaining ~138 Section 4 entries keep their current registry statuses. No
individual per-entry records — the spot-check rate justifies batch acceptance.
Section 4 entries by category from the reconciliation draft:
- Foundation/Auth: 23–44
- LiLa AI: 51–82 (minus already-adjudicated entries)
- Personal Growth: 89–121
- Archives: 127–142
- Communication: 150–167
- Rhythms: 173–201
- AI Vault: 207–229
- BookShelf: 230–232
- Gamification: 238–276
- Platform Complete: 277–292
- Blog/Admin: 298–304
- Calendar: 305–315
- Guided Dashboard: 322–336 (line 321 excepted above)
- Infrastructure: 344–378
- Studio & Lists: 384–402
- Widgets: 408–421
- Tasks Repair: 430–444
- ThoughtSift: 454–475
- Studio Intelligence: 486–516
- Tracking/Allowance: 518–522
- Phase 0.25 Residue: 532–536

## Round 5 — Appendix hygiene items (8 items)

**Summary:** 7 of 8 items are already-decided confirmations from Rounds 1-4. Item
8 (live_schema.md drift) triggered a follow-up workstream below.

| # | Item | Decided under | Action at apply-time |
|---|---|---|---|
| 1 | Merge 7 duplicate registry row pairs (56/81, 62/82, 133/197, 287/461, 288/462, 285/457, 286/458) | Finding D | Registry-apply session merges each pair; keep row in most natural PRD section, preserve superset of notes |
| 2 | Drop stale parenthetical counts on lines 357, 390, 413, 492, 408 | Finding E + Round 4 obs | Replace exact counts with "all configured X" style wording |
| 3 | CLAUDE.md #161 line-number fix | Finding I — APPLIED as commit 303a1bb (2026-04-19) | No further action |
| 4 | Glossary note for 🚫 Removed symbol | Finding H | Add to STUB_REGISTRY.md Status Legend during apply |
| 5 | PRD-28B absence header note | Finding A | Add one-line note under PRD-28B section: "`report_templates` + 5 companion tables not yet built; all ✅ Wired rows claiming per-template features pending that build" |
| 6 | AIR cluster scope note | Finding B | Add scope note under AIR stub clarifying Wired = silent auto-creation, not scan-and-claim or manual logging |
| 7 | Line 399 wording update | Round 4 observation | Update note to: "Routing via studio_queue works; no separate ListPicker overlay component exists — may not be needed" |
| 8 | live_schema.md drift / non-API table gap | Finding E / SCOPE-5.F2 | Separate workstream — generator script expansion + regeneration (parallel commit, see `audit-logs/schema-dump-expansion-plan.md` or similar). Will also cover widget_starter_configs and ~25 other non-API tables |

## Early-audit residue observations

> During an early-project audit, some tables/columns were created experimentally and
> never cleaned up. Any entry in the walk-through where schema exists but no code
> consumes it MAY be residue rather than a genuine hygiene item. Logged here as
> observations; founder adjudicates each as residue vs hygiene as they arise.

(empty list for now — entries appended during Rounds 3-4)

## Session-end summary (2026-04-20)

**Walk-through status:** COMPLETE. All 5 rounds closed.

**Decisions applied during walk-through:**
- 1 commit already applied: 303a1bb (CLAUDE.md #161 line fix, Finding I)

**Decisions pending STUB_REGISTRY.md apply (Commit 1):**
- Round 1: 11 aggregate findings (A-K) — 7 with registry changes, 4 observation-only
- Round 2: 17 contradictions — 16 resolved via Round 1 cross-references, 1 standalone (line 398)
- Round 3: 45 ambiguous entries — 14 TYPE A cross-refs + 26 TYPE B + 5 TYPE C; includes 1 row SPLIT (line 515 → 515 + new row for homework-estimate)
- Round 4: ~160 confirmed-accurate (batch approved via spot-check) + 1 exception flip (line 321)
- Round 5: 7 hygiene items (merges, count drops, note updates, glossary additions, header notes)

**Parallel workstreams triggered:**
- Schema dump expansion — generator script update + live_schema.md regeneration (see worker prompt queued 2026-04-20)
- Studio template inventory (scope-5-evidence/STUDIO_TEMPLATE_INVENTORY.md, already produced) — feeds future Universal Setup Wizards design session
- Phase B tracker inventory (scope-5-evidence/PHASE_B_TRACKER_INVENTORY.md, already produced) — referenced in Round 3 Entry 4 note

**Audit findings to append to AUDIT_REPORT_v1.md at Round 5 close:**
(To be added by the apply-phase session; pattern summary covering PRD-28B absence,
AIR unbuilt, Build M silent delivery, Looks-Fine-Failure bidirectional, misleading
UI clusters including Studio shelf tiles and WidgetPicker color_reveal/gameboard,
duplicate rows, stale counts, and orphan UI observations from STUDIO_TEMPLATE_INVENTORY.md
and PHASE_B_TRACKER_INVENTORY.md.)

**Next steps:**
1. Apply-phase worker session — applies all Round 1-5 decisions to STUB_REGISTRY.md
   in Commit 1, appends SCOPE-5.F{N} findings to AUDIT_REPORT_v1.md
2. Archive-move worker session — moves scope-5-evidence/*.md to appropriate archive
   location per operation plan §10.8 in Commit 2
