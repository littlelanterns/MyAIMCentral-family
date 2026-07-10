# Beta Readiness Report — July 2026

> **Audit date:** 2026-07-06
> **Auditor:** Fable 5 (Beta Readiness Gate audit session, read-only)
> **Checklist of record:** `claude/web-sync/MYAIM_GAMEPLAN_v2.2.md` lines 520–529 — the **Beta Readiness Gate exit criteria** (the gate between Gate 3 and Gate 4; Gate 4 itself has no formal exit criteria per Gameplan L557). This report is the gate's named deliverable (Gameplan L531 calls it `BETA_READINESS_REPORT.md`; per the dispatch it lives here).
> **Scope:** current status + evidence per criterion; the first-ever HITM coverage audit (criterion 7); the ordered critical path to gate completion.
> **This report changes no code and closes no criterion.** It tells you exactly what's left and in what order.

---

## 1. Founder Summary — plain English

**How far are we from beta? Roughly a month of build work plus one external wait you control: the attorney.**

Here's the honest picture, in your terms:

**What's already done (the hard, scary part):**
- **LiLa's guardrails are real now.** The safety layer you gated beta on (Layer 2) shipped this week: every AI prompt in the platform carries the crisis override and the five auto-reject categories, crisis detection runs on all ten functions that were missing it, and the six endpoints anyone on the internet could call are locked. It's deployed, committed, and pinned by 58 passing tests.
- **PRD-41 — the rulebook for enforcing LiLa's character at the code level, not just in her instructions — is written and you approved it** (2026-07-06). The build that implements it (Slice E) has its dispatch prompt sitting ready. It's the single biggest remaining safety build.
- **The lawyer package is written.** Privacy policy draft, COPPA notice, consent-flow copy, data-practices summary, plus the proof that no AI provider trains on your families' data — all sitting in `claude/legal-drafts/` waiting for you to fill in three blanks (mailing address, privacy email, phone) and hit send.

**What's left, in order:**
1. **You: send the attorney package.** This has the longest wait time and nothing else can substitute for it — legal review is a hard gate requirement Claude cannot self-certify. Send it first so the clock runs while we build.
2. **Build Slice E** (LiLa's enforcement layer, runs in "watch mode" first) — dispatch-ready today.
3. **Let it watch your own family for a week**, then flip it on (a short session with you).
4. **Build PRD-40 (COPPA)** — currently 100% unbuilt, but the plan says build it dormant and start beta with families who have no kids under 13. The build pack is approved and ready. You'll need to create the Stripe account before its payment slice.
5. **Build PRD-30 (Safety Monitoring)** — the mom-alerting layer. Not started; it's the locked next build after the safety gate clears. It needs its own pre-build first.
6. **Close the small HITM gaps this audit found** (details below — three real ones, all fixable in one small session, plus a couple of design rulings only you can make).
7. **You: say the words** — "Beta Readiness Gate is complete."

**One important correction to the checklist itself:** two of the nine boxes have been formally superseded by your own newer decisions. "PRD-20 Safe Harbor wired" is off the list (you backburnered it 2026-06-09; the safety sequence is PRD-41 → PRD-30). And "COPPA fully wired before beta" was replaced by your 2026-04-21 ruling: build the COPPA framework dormant, run beta cohort 1 with no under-13 families, open under-13 access only after the attorney signs off.

**The HITM audit — the one that had never been run — is now done.** The result is better than feared: every pipeline that turns AI output into real family records (tasks, insights, victories, list items, curriculum, meeting summaries) has a genuine review-and-approve step. The gaps are three conversation-adjacent surfaces (Board of Directors advisor replies, BookShelf book discussions, and "Ask LiLa & Send" in Messages — where LiLa's answer posts straight into the family thread with no review), plus the BookShelf extraction pipeline which saves first and lets you curate after. None are five-alarm; all need either a fix or your explicit "that's the design" ruling before the gate closes.

**Bottom line:** the platform is not beta-ready today, but every remaining item has a name, an owner, and a ready-to-go plan. The critical path is: **attorney send (you, today) → Slice E → one-week shadow → flip → PRD-40 → PRD-30 → HITM closure → your declaration.** If builds proceed at the pace of the last month and the attorney turns around within a few weeks, the gate is realistically **4–6 weeks out** — with cohort-1 beta (no under-13 kids) possible at the end of it.

---

## 2. The Checklist of Record — reconciliation notes

The exit criteria (Gameplan L520–529), with two lines formally superseded by newer founder rulings (Convention #11: newer wins):

| # | Criterion (verbatim) | Standing |
|---|---|---|
| 1 | COPPA per PRD-40 fully wired (`coppa_consents`, `parent_verifications`, consent UX, first-under-13 trigger) | **AMENDED** — founder resolution 2026-04-21 (FIX_NOW_SEQUENCE L517, encoded in `claude/dispatch-factory/PRD40.md` reconciliation ruling 1): build the framework **dormant**; beta cohort 1 = families with **no under-13 children**; under-13 cohort opens only after lawyer review + revocation cascade. The reconciled bar for THIS gate = dormant framework built + cohort-1 scoping enforced. |
| 2 | Child data handling audit (RLS, export/deletion, retention) | Stands as written |
| 3 | LiLa ethics enforcement at Edge Function level, red-team tested | Stands as written |
| 4 | Deity-block tested, cannot be bypassed | Stands as written |
| 5 | PRD-20 Safe Harbor wired and tested | **SUPERSEDED** — backburnered 2026-06-09 (`claude/feature-decisions/Safe-Harbor-Backburner-Decision.md`, commit `b04ea98`). Safety sequence is now PRD-41 → PRD-30. Marked N/A below. Defensive `is_safe_harbor` plumbing remains in force (Convention #6) and is carried forward in PRD-41's data model. |
| 6 | PRD-30 Safety Monitoring core wired | Stands as written |
| 7 | Every AI output surface has HITM — audit confirms no gaps | Stands as written — **executed for the first time in this report (§4)** |
| 8 | Legal review completed by a human lawyer | Stands as written — hard requirement, cannot be self-certified |
| 9 | Founder declaration | Stands as written |

**Precondition note:** the gate's preconditions (Gameplan L515–518) list Gate 3 (video library) first. Gate 3 has **not started** — no PRD-39 / video design doc exists (glob confirms), though `LILA_KNOWLEDGE_BACKLOG.md` exists at repo root. The Scope 8 compliance report precondition IS satisfied (`claude/web-sync/AUDIT_REPORT_v1.md` §8a, findings SCOPE-8a.F1–F5, all triaged). In practice the exit-criteria remediation has proceeded in parallel with the gameplan's phase order — which the gameplan explicitly permits (L535) — but **beta user exposure remains blocked until this gate clears**, and Gate 3 remains separately outstanding on the road to Gate 4 / LiLa training.

**Correction to the dispatch prompt's assumption:** "PRD-30 pre-build in flight" is **not the case**. No PRD-30 pre-build, pack, or build file exists anywhere (`claude/`, `.claude/rules/current-builds/`, dispatch factory — verified). PRD-30 was deliberately excluded from the dispatch factory because it's sequenced inside SAFETY-BETA-GATE's locked order: Slice E → Phase 4 flip → **then** PRD-30 (MANIFEST exclusions table; SAFETY-BETA-GATE build file "Post-Slice-E gate exit"). It still needs its own pre-build ritual when its turn comes.

---

## 3. Per-Criterion Status

### Criterion 1 — COPPA per PRD-40 (as amended): ❌ NOT BUILT — approved pack ready

- **Code:** 100% unbuilt. `grep coppa_consents|parent_verifications` across `supabase/migrations/` → zero matches. Recon verdict (`claude/dispatch-factory/PRD40-RECON.md`, quoted in `PRD40.md` header): "**100% unbuilt. Zero COPPA code, zero Stripe code anywhere in the platform.**" Registered since April as SCOPE-8a.F1/F2, LOCKED Fix Now rows #1/#2.
- **Plan:** `claude/dispatch-factory/PRD40.md` — APPROVED (Stage 4, 2026-07-04), 6-slice build (schema+RLS → Stripe foundation → consent UX → rights/lifecycle/export/cascade/retention crons → enforcement gating → admin tab + E2E). Slice 0 (Two-Door Auth Addendum, founder/claude.ai channel) precedes the build. Dispatch precondition — SAFETY Slices C/B/A deployed — is **met** (deployed 2026-07-04); territory note: shared `supabase/functions/`, so sequence after Slice E rather than overlapping.
- **Founder-only inputs:** Stripe account creation/keys (greenfield ruling D-PRD31-5) before Slice 2; the Slice 0 addendum session.
- **What clears it (amended bar):** dormant framework built + verified, cohort-1 no-under-13 scoping in place. `lawyer_approved_at` population (criterion 8) is the cohort-2 opener, not a cohort-1 blocker.

### Criterion 2 — Child data handling audit: ❌ NOT STARTED — absorbed into PRD-40 + PRD-22

- **Export/deletion:** SCOPE-8a.F2 ("Privacy-data-lifecycle incomplete — export, deletion, voice retention," `AUDIT_REPORT_v1.md:266`). `account_deletions` table exists with **0 rows** and no flows (live schema); no per-child export exists. PRD-40 Slice 4 builds the per-child export ZIP, 8-rule deletion cascade (extended for two-door auth artifacts), and 3 retention crons; PRD-22 builds the family-wide export (shared engine per MANIFEST dependency edge "PRD40 ↔ PRD22").
- **Retention policy:** not encoded anywhere today.
- **Under-13 RLS audit:** no dedicated audit has run; PRD-40 Slice 1 carries the `rls-verifier` gate and Slice 5 extends RLS on child-scoped writes.
- **What clears it:** PRD-40 Slices 1/4/5 verified (its E2E suite covers cascade correctness, export, RLS probes) + this criterion's audit re-run against the built tables.

### Criterion 3 — LiLa ethics enforcement at Edge Function level, red-team tested: 🟡 LAYER 2 DONE / LAYER 1 NOT BUILT

- **Layer 2 (prompt-level) — SHIPPED.** SAFETY-BETA-GATE Slices C→B→A: auth closure on 6 openly-invocable endpoints; `detectCrisis` on 10 previously-unscreened functions; canonical `_shared/safety-preamble.ts` (crisis override + five auto-reject categories + tone rules + no-emoji) imported at all 16 prompt sites; 16 real per-mode prompts replacing bare fallbacks; MindSweep client crisis rendering fixed. Evidence: commit `4b86cb0` ("close Convention #247 gate"), pushed through `a78e338`; `tests/e2e/features/safety-beta-gate.spec.ts` **58/58** (static drift pins + live 401/crisis probes against deployed functions); 29 functions deployed 2026-07-04; eyes-on tour verified (build file progress logs).
- **Layer 1 (Edge-Function-level output validation) — NOT BUILT.** This is precisely what the criterion's "not just prompt-specified" clause demands. `prds/foundation/PRD-41-LiLa-Runtime-Ethics-Enforcement.md` authored 2026-07-05, **founder-approved 2026-07-06** with resolutions recorded (no off switch; shadow-mode rollout; no-side-door content ruling). Slice E (Phases 1→2→3: `ethics-guard.ts` Tier 0 → `ai_output_scans` queue + `validate-ai-output` Tier 1/2 → full surface retrofit + mom's Response Log) is **dispatch-ready** — paste-ready prompt in `.claude/rules/current-builds/SAFETY-BETA-GATE.md`.
- **Red-team testing — NOT BUILT.** `tests/redteam/` does not exist; the red-team corpus + `npm run redteam` suite are Slice E Phase 1 deliverables, authored together with the ~150 pattern-library seed exemplars.
- **What clears it:** Slice E shipped (shadow mode) → **≥1 week** founder-family shadow data → Phase 4 calibration review + enforcement flip (separate founder-gated session — this IS the Layer-1 gate exit per the build file) → red-team suite green.

### Criterion 4 — Deity-block tested, cannot be bypassed: 🟡 IMPLEMENTED FAIL-CLOSED; ADVERSARIAL BYPASS CORPUS MISSING

- **Implementation:** `supabase/functions/lila-board-of-directors/index.ts` — `contentPolicyCheck` runs BEFORE persona generation (Convention #102), returns `outcome: 'approved' | 'deity' | 'blocked' | 'harmful_description'` (`:76-78`); deity outcome triggers the Prayer Seat redirect (`:133-138`); Prayer Seat generation at `:389-412`; **fail-closed default** — any HTTP error, parse failure, unknown outcome, or exception → `blocked` (`CONTENT_POLICY_BLOCK_FAIL_CLOSED`).
- **Testing that exists:** `tests/verification/row-26-content-policy-fail-closed.ts` — verifies all 5 fail-closed branches + crisis-gate precedence + a source-equivalence grep guarding drift (a standalone `npx tsx` verification script, not a CI-pinned suite). Cache-lookup governance is separately pinned (`row-11-persona-tiers.ts`, `row-18-promotion-queue-lifecycle.ts`; Convention #258 four-predicate scoping).
- **The gap:** "cannot be bypassed" has **not** been adversarially tested — no corpus of indirect phrasings (e.g., descriptive circumlocutions for divine figures) has ever been thrown at the live Haiku classifier. Exposure is currently low (`public.board_personas`: 0 rows — the feature is essentially unused), but the criterion says *tested*.
- **What clears it:** a deity-bypass adversarial corpus. **Recommendation:** fold ~15–20 bypass attempts into Slice E's red-team suite (same corpus infrastructure, same enforcement point) rather than a separate build — one line added to the Slice E dispatch.

### Criterion 5 — PRD-20 Safe Harbor: ⬜ N/A — SUPERSEDED

Backburnered by founder decision 2026-06-09 (`claude/feature-decisions/Safe-Harbor-Backburner-Decision.md`; commit `b04ea98`; MANIFEST exclusion row; memory `project_safe_harbor_backburnered`). Never build without new founder direction. Defensive plumbing stays: `is_safe_harbor` filters (Convention #6), Safe Harbor exclusion in PRD-41's scan-candidate harvesting and `lila_ethics_rejections.is_safe_harbor` flag.

### Criterion 6 — PRD-30 Safety Monitoring core wired: ❌ NOT STARTED

- **Code:** entirely unbuilt (SCOPE-8a.F3). No `safety_flags` / `safety_keywords` / `safety_monitoring_configs` / `safety_resources` tables in the live schema; `lila_conversations.safety_scanned` and `lila_messages.safety_scanned` are dead columns; no `safety-classify` Edge Function in `supabase/functions/`.
- **Sequencing:** locked as **the next build after** SAFETY-BETA-GATE's gate exit (Slice E → Phase 4 flip → PRD-30), per the build file and MANIFEST exclusion note. **No pre-build exists** — it will need the full `/prebuild PRD-30` ritual (PRD + `PRD-30-Cross-PRD-Impact-Addendum.md`).
- **Ready hooks:** PRD-41 deliberately leaves PRD-30 hooks in place (notifications path, scan-queue pattern, dad-log-access stub arrives via PRD-30 recipient grants).
- **What clears it:** the PRD-30 build's core wired — two-layer detection, severity tiers, locked categories, mom notification path (safety alerts bypass DND per Convention #143).

### Criterion 7 — HITM coverage audit: ✅ AUDIT EXECUTED (first time) / ❌ GAPS FOUND — see §4

The audit itself — never run before this report — is now complete across all 51 Edge Functions using PRD-41's wiring matrix as the inventory. Verdict: **record-creating pipelines are in genuinely good shape; 3 Missing surfaces + 6 Partial/needs-ruling items block the "no gaps" claim.** Full table in §4; punch list in §5.

### Criterion 8 — Legal review by a human lawyer: 🟡 PACKAGE DELIVERED, NOT SENT

- **Delivered 2026-07-05** to `claude/legal-drafts/`: `privacy-policy-draft.md`, `coppa-direct-notice-draft.md`, `parental-consent-flow-copy-draft.md`, `data-practices-summary.md`, `attorney-cover-memo.md`, `no-training-verification.md` + 3 dashboard exhibit PNGs (OpenRouter data policies, OpenAI sharing disabled, OpenAI API logging). The data-practices summary deliberately surfaces the legacy kid-privacy carve-outs to counsel (per the 2026-07-04 standing-principle ruling — decided once, at PRD-40 level, with attorney input).
- **Outstanding (all founder-only):** (a) fill 3 contact blanks — mailing address, privacy email, phone (`.claude/state/CURRENT.md` founder item 1); (b) send to counsel; (c) the OpenRouter privity support ticket (founder item 2, wording in `no-training-verification.md` §6); (d) attorney response — T&C, privacy policy, LiLa disclosure language, consent language. Consent templates ship with `lawyer_approved_at` NULL and the flow stays inert until counsel populates it (cohort-2 opener).
- **Not yet drafted:** Terms & Conditions are not among the six delivered documents — confirm with counsel whether they draft T&C or want a draft to review (the criterion names "T&C" explicitly).

### Criterion 9 — Founder declaration: ⬜ OPEN — last box, yours alone

---

## 4. HITM Coverage Audit (Criterion 7) — full results

**Method:** inventory = PRD-41's Surface Wiring Matrix (all 51 functions in `supabase/functions/`, verified against the directory). Each generative surface traced client-side to answer: does the AI output **persist**, and if so, is there an explicit review step (Edit/Approve/Regenerate/Reject or equivalent accept-before-write) between the AI response and the DB write? Per the audit brief: persisting outputs require HITM (Convention #4); ephemeral outputs the user manually adopts do not. Conversation replies persisting to `lila_messages` are conversation history — Convention #55 applies HITM to them anyway, so absences there are graded against the platform's own standard.

**Verdict counts:** 22 Covered · 8 Partial (incl. 2 documented-intentional) · **3 Missing** · 18 N/A (ephemeral/manual-adopt/non-generative).

### 4A. Record-creating pipelines (HITM required — Convention #4)

| Surface | Persists to | Review before write | Verdict |
|---|---|---|---|
| **ai-parse** (Notepad Review & Route) | tasks, list_items, victories, journal_entries, guiding_stars, best_intentions, self_knowledge, studio_queue via `deployQueueItem.ts:98-273` | Card-by-card review + per-card route / "Route All" (`NotepadReviewRoute.tsx:709-746`, `:463-475`); "the card-by-card review IS the HITM step" (Convention #276, `NotepadReviewRoute.tsx:7-9`) | ✅ Covered |
| **task-breaker** | tasks (parent + children, `StandaloneTaskBreakerModal.tsx:43-77`) | Editable/reorderable/removable subtask list + explicit "Apply N Steps" (`TaskBreaker.tsx:353-438`, `:416-426`) | ✅ Covered |
| **smart-list-import** | lists + list_items (`SmartImportModal.tsx:209-245`) | Per-item accept checkboxes + list-override + explicit "Add N items" (`SmartImportModal.tsx:447-452`, `:304-307`) | ✅ Covered |
| **extract-insights** (InnerWorkings) | self_knowledge (`useSelfKnowledge.ts:240-247`) | "Review Extracted Insights" screen, per-insight toggle/edit + "Save N Entries" (`InnerWorkings.tsx:595-660`) | ✅ Covered |
| **celebrate-victory** (DailyCelebration) | victory_celebrations (`useCelebrationArchive.ts:36-54`) | `NarrativeHITM` Edit/Approve/Regenerate/Reject row; both save paths gate on `narrativeApproved` (`DailyCelebration.tsx:676-786`, `:222-243`) — the SCOPE-8a.F6 gate | ✅ Covered |
| **scan-activity-victories** | victories via `useCreateVictory` (`VictorySuggestions.tsx:74-85`) | Explicit per-suggestion Claim / Skip / Edit (`VictorySuggestions.tsx:203-236`) | ✅ Covered |
| **curriculum-parse** | via `SequentialCreator` save (form-state population only, `CurriculumParseModal.tsx:160-164`) | Per-item editable review cards + "Use these N items" (`CurriculumParseModal.tsx:290-514`); Convention #165 | ✅ Covered |
| **Meeting summaries** (lila-chat meeting mode → journal) | journal_entries `entry_type='meeting_notes'` (`completeMeeting.ts:56-68`) | Summary rendered in editable textarea + Regenerate button before the explicit Save & Close that persists (`PostMeetingReview.tsx:256-280`, `:237-244`) — Convention #239 honored | ✅ Covered |
| **Communication drafts** (Cyrano/Higgins) | communication_drafts (`ToolConversationModal.tsx:598-610`) | Explicit "Save Draft" chip only; `final_version`/`status='sent'` never written anywhere — draft inert until human acts; conversation itself has HITM (§4B) | ✅ Covered |
| **mindsweep-sort — `always_ask`** (the default; `MindSweepCapture.tsx:167`) | studio_queue only (`useMindSweep.ts:519-539`) → human Sort-tab review | Queue review before any destination write | ✅ Covered |
| **mindsweep-sort — `trust_obvious` / `full_autopilot`** (user opt-in) | Direct inserts to tasks/lists/journal/victories/guiding_stars/best_intentions/backburner/self_knowledge on high (or high+medium) confidence (`useMindSweep.ts:326-342`, `:351-506`); calendar/agenda/recipe/archives always still queue | **None per-item.** Precise framing: the persisted CONTENT is the user's own captured text; only the AI's **destination choice** goes unreviewed. Gated by an explicit member-level aggressiveness setting, and this autopilot is the documented product promise (PRD-17B; Convention #276 lineage) | 🟡 Partial — by-design opt-in; needs a founder line in CLAUDE.md declaring it an approved Convention #4 exception |
| **homework-estimate** (Log Learning) | homeschool_time_logs (`useHomeschool.ts:373-375`) | AI-suggested subjects auto-select but stay visible/toggleable before explicit Submit (`LogLearningModal.tsx:83-84`, `:319-383`); AI's raw minutes/reasoning never stored | 🟡 Partial — acceptable shape (visible-and-editable before explicit submit), one notch below an explicit accept step |
| **BookShelf extraction pipeline** (bookshelf-extract / -process / -key-points / -study-guide) | `platform_intelligence.book_extractions` + `bookshelf_*` dual-write, bulk, fire-and-forget (`bookshelf-extract/index.ts:259-263`, `:1279-1291`); `bookshelf-process/index.ts:1057-1088` auto-writes AI title/author/genres/summary to bookshelf_items; key-points auto-flags (`bookshelf-key-points/index.ts:110-182`) | **None pre-save** — persist-then-curate. Post-save controls ARE robust: heart / note / hide / edit-text (`extractionActions.ts:31-71`, `ExtractionItem.tsx:60-162`). LiLa context gated on hearting **only under the default** `book_knowledge_access='hearted_only'`; the `'all'` setting admits un-hearted extractions to context (`context-assembler.ts:465-480`) | 🟡 Partial — NOT a documented exception. Source material is published book text (lowest risk class per PRD-41), and per-item pre-approval of tens of thousands of extractions is impractical. Needs a founder ruling documenting persist-then-curate as the approved pattern for book-derived content — or remediation |

### 4B. Conversation surfaces (Convention #55 standard)

| Surface | Persists to | HITM controls | Verdict |
|---|---|---|---|
| LiLa Drawer (Mom) | lila_messages | `HumanInTheMix` via `LilaMessageBubble.tsx:194-207`; Regenerate/Reject wired `LilaDrawer.tsx:320-361` | ✅ Covered (hidden in help/assist/optimizer — `LilaDrawer.tsx:633`) |
| LiLa Modal (Adult/Indep/Guided) | lila_messages | Same pattern, `LilaModal.tsx:304-312` | ✅ Covered (hidden in help/assist/general/optimizer — `LilaModal.tsx:302`) |
| Cyrano / Higgins Say / Higgins Navigate | lila_messages | `ToolConversationModal.tsx:1011-1021`, always shown | ✅ Covered |
| 5 Love Language tools | lila_messages | Same shared modal | ✅ Covered |
| Decision Guide / Perspective Shifter / Mediator | lila_messages | Same shared modal | ✅ Covered |
| **Board of Directors — advisor replies** | lila_messages (per-advisor, server-side insert) | **Absent.** `BoardOfDirectorsModal.tsx` renders messages manually (`:743-783`) — no `LilaMessageBubble`, no `HumanInTheMix` import; only Copy / Save-to-Notepad chips (`:772-781`). (The persona-creation preview DOES have Approve & Seat / Regenerate / Reject — `:844-882` — the gap is conversation turns only) | ❌ **Missing** — inconsistent with every sibling conversation surface |
| **bookshelf-discuss** | bookshelf_discussion_messages — AI reply inserted directly (`useBookDiscussions.ts:156-165`) | **Absent.** Plain bubbles (`BookDiscussionModal.tsx:287-298`); only whole-discussion Delete / Copy All | ❌ **Missing** |
| **lila-message-respond ("Ask LiLa & Send")** | **`messages` — the shared family thread**, server-side insert on stream completion (`lila-message-respond/index.ts:267-278`) | **Absent.** `ChatThreadView.tsx:278-291` sends the user message then invokes LiLa with no review gate; the reply is immediately visible to ALL thread participants | ❌ **Missing** — the sharpest gap in the audit: the only surface where unreviewed AI output publishes directly to other family members. PRD-15 designed explicit invocation ("Ask LiLa **& Send**"), so this may be intended — but it is a Convention #4 exception no document currently declares |
| Meeting conversation turns | lila_messages | `hideHumanInTheMix={true}` on both bubble calls (`MeetingConversationView.tsx:267-292`) | 🟡 Partial — deliberate code, undocumented rationale |
| Help/Assist/General/Optimizer modes | lila_messages | Hidden by `isConversationalMode` flags (above) | 🟡 Partial — support-Q&A surfaces; almost certainly intentional, undocumented |

### 4C. Background / fire-and-forget writers

| Path | Persists to | Controls | Verdict |
|---|---|---|---|
| auto-title-thread | conversation_threads.title (`auto-title-thread/index.ts:140-146`) | Inline-editable (`ChatThreadView.tsx:293-297`, `:349-391`); crisis content never titled (`index.ts:101-110`) | 🟡 Partial-**Intentional** — Convention #148's documented sole exception |
| Notepad auto-title | notepad_tabs.title + is_auto_named (`useNotepad.ts:295-321`) | Double-click rename clears is_auto_named (`NotepadDrawer.tsx:669-687`) | 🟡 Partial — **undocumented sibling** of #148 (which is scoped to messaging); needs one documentation line |
| spelling-coach | spelling_coaching_cache (`spelling-coach/index.ts:116-129`) | N/A — platform-wide dictionary, no family/member identifiers | ⬜ N/A (out of Convention #4 scope) |
| Archives context learning | Designed suggest-then-accept (`ContextLearningSaveDialog.tsx:122-164` incl. Edit-Before-Saving + dismissal hashes) | **Component is dead code** — zero import sites; no pipeline auto-writes AI content to archive_context_items today | ⬜ N/A (dormant; correctly-shaped when it wires) |

### 4D. Ephemeral / manual-adopt / non-generative (HITM not applicable)

lila-translator (local state, manual Copy — `TranslatorModal.tsx:181`, `:465-497`) · whisper-transcribe (draft text into editable input — `useVoiceInput.ts:214-290`) · message-coach (ephemeral checkpoint, Send Anyway always available, nothing content-bearing persists — `CoachingCheckpoint.tsx:16-17`, only a cost-log row) · mindsweep-scan (OCR into editable textarea/checkbox review — `MindSweepCapture.tsx:290-326`) · guided-nbt-glaze (in-memory session cache only) · Morning Insight (read-only display) · Guided encouraging messages (static pool, no AI today — re-audit if the Haiku version in the code comment ships) · describe-vs-icon (service-role-only ingest tool, no family-facing path) · the 13 matrix-exempt non-generative functions (embed, embed-text-admin, generate-query-embedding, bookshelf-search, whisper-transcribe*, family-auth-admin, fire-painted-schedules, calculate-allowance-period, accrue-loan-interest, evaluate-deferred-contracts, notify-out-of-nest, process-carry-forward-fallback, shopping-list-auto-archive) · mindsweep-auto-sweep / mindsweep-email-intake (no direct model calls; route through mindsweep-sort).

### 4E. Criterion 7 punch list (what "no gaps" requires)

1. **lila-message-respond** — founder ruling required: either (a) declare "Ask LiLa & Send" a documented Convention #4 exception (PRD-15's explicit-invocation design), or (b) add a review step before the reply posts to the thread. *(Note: PRD-41 Slice E will add ethics scanning + retraction to this surface either way — a mitigating layer, not HITM.)*
2. **Board of Directors advisor turns** — mount `LilaMessageBubble`/`HumanInTheMix` for parity with every other conversation surface (Regenerate/Reject wiring already exists as a pattern in `ToolConversationModal.tsx:557-590`). Small fix.
3. **bookshelf-discuss** — add per-message HITM controls (or founder-rule it as conversation history with delete-only). Small fix.
4. **BookShelf extraction pipeline** — founder ruling: document persist-then-curate + hearted-only-context as the approved pattern for book-derived content (recommended — pre-approving ~90K extractions per-item is not viable), and decide whether `book_knowledge_access='all'` should remain available (it bypasses the hearting review before context inclusion).
5. **Notepad auto-title** — one documentation line extending Convention #148's exception to Notepad, or fold both under a general "AI titling is background-allowed, always inline-editable" convention.
6. **MindSweep autopilot modes** — one documentation line declaring `trust_obvious`/`full_autopilot` an approved opt-in exception (AI chooses destination; content is the user's own words; default remains `always_ask`).
7. **Meeting conversation + help/assist/optimizer HITM hiding** — one documentation line each, or un-hide.

Items 2–3 are one small build session. Items 1, 4–7 are founder rulings + CLAUDE.md lines. After that, criterion 7 flips to ✅.

---

## 5. Critical Path to "Beta Readiness Gate complete"

Cross-referenced against `claude/dispatch-factory/MANIFEST.md` (build order of record) and `.claude/rules/current-builds/SAFETY-BETA-GATE.md` (locked safety sequence). **Bold** = founder-only action; plain = build session.

| # | Step | Owner | Depends on | Clears |
|---|---|---|---|---|
| 1 | **Fill 3 contact blanks + email attorney package** (`claude/legal-drafts/`) + **OpenRouter privity ticket**. Longest external lead time — start the clock first. Confirm T&C authorship with counsel. | Founder (today) | Nothing | Starts criterion 8 |
| 2 | **Slice E pre-build confirms** — approve the five reframe copy blocks + choose red-team hook placement (pre-push vs checklist). Presented in the worker's first message. **Recommended add-on: fold the deity-bypass adversarial corpus (§3 criterion 4) into Slice E's red-team suite — one line in the dispatch.** | Founder (5 min, at dispatch) | Nothing | — |
| 3 | **SAFETY-BETA-GATE Slice E** — Layer 1 build, PRD-41 Phases 1→2→3, ships shadow mode. Dispatch prompt ready in the build file. Occupies `supabase/functions/` territory. | Sonnet worker | Step 2 | Criterion 3 (build half) + criterion 4 (if corpus folded in) |
| 4 | **≥1 week shadow-data window** on the founder family. Runs in parallel with steps 5–6. | Calendar | Step 3 deployed | — |
| 5 | **PRD-40 Slice 0** — Two-Door Auth Addendum (claude.ai / founder channel per the pack). **+ Stripe account creation** (greenfield, D-PRD31-5) before Slice 2. | Founder | Nothing (parallel with 3–4) | — |
| 6 | **PRD-40 build** — 6 slices per the approved pack (dormant framework: schema/RLS → Stripe → consent UX → export/cascade/retention → enforcement → admin+E2E). Sequence AFTER Slice E (shared function territory — pack's own rule: "sequence, don't overlap"). | Sonnet workers | Steps 3, 5 | Criteria 1 + 2 |
| 7 | **Phase 4 calibration review + enforcement flip** — founder-gated session reviewing shadow data; flips `ENFORCEMENT_MODE`. This IS the Layer-1 gate exit. | Founder + session | Step 4 complete | Criterion 3 (complete) |
| 8 | **PRD-30 Safety Monitoring** — full pre-build ritual (`/prebuild PRD-30` — no pack exists, by design), then build. Locked next-after-gate-exit; PRD-41 left its hooks ready. | Fable/Opus pre-build → Sonnet workers | Step 7 | Criterion 6 |
| 9 | **HITM closure** — founder rulings on §4E items 1, 4–7 (one decision batch) + one small build session for items 2–3 (BoD + bookshelf-discuss controls). Can run any time; suggest riding alongside step 6 or as an SMFX-style micro-pack. | Founder rulings + Sonnet worker | Nothing | Criterion 7 |
| 10 | **Attorney response lands** — incorporate feedback; counsel populates `lawyer_approved_at` on consent templates (cohort-2 opener); T&C/privacy/disclosure sign-off recorded. | External + founder | Step 1 | Criterion 8 |
| 11 | **Founder declaration:** "Beta Readiness Gate is complete." Update this report with final evidence per criterion. | Founder | 1–10 | Criterion 9 — gate complete |

**Cohort framing (per the reconciled criterion 1):**
- **Cohort 1 (no under-13 families)** can open at gate completion — steps 1–11.
- **Cohort 2 (under-13 families)** additionally requires: lawyer-approved consent templates live (step 10), revocation cascade verified (PRD-40 Slice 4 E2E), and PRD-41 enforcement ON, not shadow (step 7) — per PRD-40:767-769,1158.

**Parallelization notes:** Steps 1, 2, 5 start today independently. Step 3 is the only in-flight-territory constraint (shares `supabase/functions/` with step 6 and with any Wave-1 work touching functions). Steps 4 and 5–6 overlap. Step 9's ruling half can happen in any founder decision batch this week.

**Not on this gate's path but still ahead of Gate 4 / LiLa training:** Gate 3 video library (PRD-39 design doc → Tier 1/2 recordings → index) — not started; and the gameplan's own preconditions list it ahead of this gate. Beta user exposure is blocked on THIS gate; LiLa knowledge-batch training is blocked on Gate 3's videos. Reconcile the phase ordering when you schedule Gate 3.

**Time shape (estimate, not commitment):** Slice E ≈ days; shadow window = fixed 1 week; PRD-40 ≈ 1–2 weeks; PRD-30 ≈ 1–2 weeks incl. pre-build; HITM closure ≈ days; attorney = external. With the parallelism above: **≈ 4–6 weeks to gate completion**, dominated by the safety sequence and attorney turnaround.

---

## 6. Corrections & drift found by this audit (for the record)

1. **Gameplan L521 ("COPPA fully wired before beta") vs the 2026-04-21 dormant-but-built ruling** — never reconciled in the gameplan doc itself; the PRD40 pack encodes the newer ruling and this report follows it. The gameplan should be annotated when next touched.
2. **Gameplan L525 (PRD-20)** — superseded by the 2026-06-09 backburner decision; likewise never annotated in the gameplan.
3. **Dispatch assumption "PRD-30 pre-build in flight"** — false; no PRD-30 pre-build exists anywhere. It's sequenced (locked) after the SAFETY-BETA-GATE gate exit and will need its own pre-build ritual.
4. **`ContextLearningSaveDialog.tsx` is dead code** — a fully-built, correctly-HITM-shaped suggest-then-accept dialog with zero import sites. Confirm mid-build vs deprecated; if the Archives auto-detection pipeline (Convention #247 attribute 3) ships later, this is its intended gate.
5. **SAFETY-BETA-GATE build file header** still reads "HOLDING FOR FOUNDER COMMIT" — stale; the work is committed (`4b86cb0`) and pushed. Update at next touch.
6. **`book_knowledge_access='all'`** quietly bypasses the hearted-only review path into LiLa context — surfaced in §4A for the founder's BookShelf ruling.

---

*Read-only audit; no code, migrations, or convention text were changed. Evidence gathered 2026-07-06 against commit `a78e338` (main) plus in-flight working-tree state where noted.*

---

# DELTA ADDENDUM — 2026-07-09

> **Auditor:** Fable 5 (coordination seat), evidence against `main` @ `e550cbd`.
> Baseline above: 2026-07-06 @ `a78e338`. Three days elapsed; the gate moved more in those
> three days than in any comparable window of this project.

## Founder Summary — what changed, plain English

**On 2026-07-06 the honest answer was "4–6 weeks out." Today it's roughly 2–3 weeks of build
plus the attorney — and the entire safety sequence you gated beta on is either done or one
session from done.**

- **The safety sequence (Layer 2 → PRD-41 → PRD-30) is COMPLETE except for one flip.** Slice E
  shipped and is running live in watch mode; PRD-30 safety monitoring shipped end-to-end and you
  signed it off; the calibration came back **zero false positives**. The Phase-4 flip session was
  dispatched today (Opus window) — when it goes GO, criterion 3 closes and the Convention #247
  beta gate clears.
- **The HITM box is checked.** Every gap the 07-06 audit found was either fixed (the three
  missing conversation surfaces) or you formally blessed it as designed (Convention #279).
- **COPPA went from zero code to a live foundation.** All 7 tables, age brackets backfilled,
  the consent template seeded dormant, and a 175-table deletion registry with a CI tripwire so
  no future table can dodge classification.
- **An adversarial security review found 4 critical holes — including LiLa's crisis response
  returning an error instead of the 988 hotline — and all of them were fixed live the same day.**
  Finding these BEFORE beta is the system working. One bounded follow-up sweep remains.

## Per-criterion delta

| # | Criterion | 07-06 | 07-09 | What moved it |
|---|---|---|---|---|
| 1 | COPPA per PRD-40 (amended: dormant + cohort-1 scoping) | ❌ Not built | 🟡 **Slice 1 of 6 live** | Migration 100305: 6 PRD-40 tables + `stripe_webhook_events`, immutability RLS (81-probe rls-verifier pass), `coppa_age_bracket` backfilled (6 under-13 / 5 teen / 9 adult), template v1.0.0 seeded `lawyer_approved_at=NULL`, `coppa_admin` staff type. OD-1..4 resolved; Two-Door Addendum landed. **Slice 2 blocked only on founder Stripe test keys.** |
| 2 | Child data handling audit | ❌ Not started | 🟡 **Foundation built** | `child_data_tables` registry: 175 member-referencing tables classified (134 hard_delete / 33 scrub / 5 preserve / 3 N/A) + `coppa-registry-completeness.test.ts` CI pin — any future child-scoped table fails CI until classified. Export ZIP / cascade execution / retention crons remain PRD-40 Slice 4. |
| 3 | Layer-1 ethics enforcement, red-team tested | 🟡 Layer 2 only | 🟡 **Built + deployed (shadow); flip dispatched** | Slice E Phases 1→2→3 complete: `ethics-guard.ts` Tier 0, `ai_output_scans` + `validate-ai-output` cron (live, healthy), append-only `lila_ethics_rejections` w/ DB column guard (no-side-door verified), 150 exemplars embedded, mom Response Log, admin curation. Red-team suite exists now — 66/66, wired into pre-push. Live calibration: **0% false positives.** Phase-4 flip session dispatched 2026-07-09 (Opus). |
| 4 | Deity-block adversarially tested | 🟡 No corpus | 🟡 **Corpus built + pinned** | The recommended fold-in happened: 4 deity-block bypass tests (direct names, paraphrase, blocked figures, re-ask persistence) live in `ethics-enforcement.spec.ts`; the `lila-board-of-directors` model-ID fix confirmed the gate had been failing CLOSED (over-blocking, never leaking). Full live run rides the Phase-4 verification pass. |
| 5 | Safe Harbor | ⬜ N/A (superseded) | ⬜ N/A | Unchanged. |
| 6 | PRD-30 Safety Monitoring core | ❌ Not started | ✅ **COMPLETE — founder signed off 2026-07-08** | SM-A+B+C: two-layer detection (keyword sweep + Haiku classification), severity tiers w/ locked categories, no-excerpt flag surfaces (DB column guard), teen disclosure row, weekly content-free digests, D5 crisis-flag wiring on the 3 non-persisted surfaces. 48 wired / 4 stubbed / 0 missing; Checkpoint 5 PASS. Email delivery deferred (Resend — founder item). **One open functional check** (assigned as Step 0 of the Phase-4 window): confirm the 73/84 unscanned `lila_conversations` are correctly out-of-scope, not a scanner gap. |
| 7 | HITM coverage — no gaps | ❌ 3 Missing + 6 rulings | ✅ **CLOSED** | HITM-CLOSURE (2026-07-06, Convention #279): the 3 Missing surfaces fixed (BoD advisor turns, BookShelf discussions, Ask LiLa & Send now gated Send/Edit/Discard w/ HMAC-verified server-side posting); founder-declared exceptions (a)–(d) recorded; in-code rationale required for any hidden HITM going forward. Entire §4E punch list resolved. |
| 8 | Legal review by a human lawyer | 🟡 Delivered, not sent | 🟡 **Founder-external** | ARP sits in `claude/legal-drafts/` (3 contact blanks + send). CURRENT.md tracks it at ~2 weeks expected turnaround once sent. Cohort-2 opener, not a cohort-1 blocker. |
| 9 | Founder declaration | ⬜ Open | ⬜ Open | Last box, yours alone. |

## New material findings since the baseline (not on the 07-06 checklist)

1. **Adversarial safety-stack review (2026-07-09, Opus) — 4 CRITICAL, 3 live, ALL CLOSED same
   day:** `grant_money` + `apply_permission_profile` in-body auth gates (100311); 3-function
   leaf-RPC lockdown (100310); **lila-chat crisis-500** (crisis path returned HTTP 500 — the 988
   resources never rendered; now live-verified returning 200 + resources); `validate-ai-output`
   fail-open (a Tier-2 failure auto-cleared flagged rows; now retries/parks). Report:
   `SAFETY_STACK_ADVERSARIAL_REVIEW.md`. Follow-up: one bounded RPC-EXECUTE sweep (queued, not
   an emergency — seat-verified all ~15 remaining anon-executable fns are bounded).
2. **Model-ID platform repair (2026-07-08):** six functions had silently-invalid Haiku model IDs
   — meaning PRD-30 Layer-2 classification and PRD-41 Tier-2 confirmation had NEVER actually run
   before 2026-07-08 15:47 UTC. Fixed + permanently pinned (`model-id-guard.test.ts`).
   **Calibration/audit implication:** shadow data before that timestamp is Tier-1-only evidence.
3. **Beta-quality items outside the gate criteria** landed in parallel: GDCX (Next Best Thing
   re-enabled after 2+ months dark), FDWA+PINR (family-tablet writes + kid relock), PECON economy,
   WishLists, KitchenCompass Phase A, Family Goals. The known kid-facing gap remaining: 4-digit
   PIN sessions never mint (founder ruled the derived-secret fix; queued).

## Revised critical path

| # | Step | Owner | Status |
|---|---|---|---|
| 1 | Phase-4 flip: Step-0 scanner check → calibration re-run → 58-suite → GO → flip + deploy | Opus window (dispatched 2026-07-09) + founder GO + deploy approval | **In flight** — clears criteria 3 & 4 |
| 2 | **Stripe test keys** → PRD-40 Slices 2–6 (Stripe → consent UX → rights/cascade → enforcement → admin+E2E) | Founder (keys) → Sonnet workers | Keys are the only blocker — clears criteria 1 & 2 |
| 3 | **Send attorney package** (3 blanks + send) + OpenRouter privity ticket | Founder | Longest external lead — start the clock |
| 4 | Kid-PIN derived-secret fix + RPC-EXECUTE sweep + teen invite (quality, not gate criteria) | Sonnet workers | Queued, unblocked |
| 5 | Founder declaration + final evidence update to this report | Founder | After 1–3 |

**Time shape:** Phase-4 ≈ one session; PRD-40 remaining ≈ 1–2 weeks of worker sessions;
attorney = external. **≈ 2–3 weeks of build to cohort-1 readiness**, with the attorney
turnaround the only piece that can't be scheduled. Gate 3 (video library) remains separately
outstanding ahead of Gate 4 / LiLa training — unchanged, not this gate.
