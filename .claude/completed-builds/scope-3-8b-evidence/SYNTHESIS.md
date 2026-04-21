---
Status: DRAFT — awaiting founder walk-through verdicts (Option A pattern-level adjudication)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-21
Sources: 33 evidence files in `scope-3-8b-evidence/` covering 28 traversable integration surfaces + 4 Deferred-to-Gate-4 stubs + 1 global-addenda stub
Audit prompt ancestor: `prds/addenda/PRD-Audit-Readiness-Addendum.md`
---

# Scope 3+8b — Synthesis Pass

> **Purpose:** Option A pattern-grouped master doc. Founder walks through this ONCE to set verdicts at the **pattern level**; per-PRD findings cascade automatically. Each pattern below cites its contributing evidence files with file:line specificity so any verdict is evidence-anchored.
>
> **Reading order:** §1 (Beta-Y SCOPE-8b patterns) → §2 (Systemic SCOPE-3 patterns) → §3 (High-severity standalone findings) → §4 (Unbuilt-PRD Deferred stubs) → §5 (Strong positives) → §6 (Founder adjudication prompts) → §7 (Apply-phase input mapping).
>
> **How to use this in walk-through:** For each pattern in §1–§3, the founder gives ONE verdict (Beta Y / Beta N, severity, Intentional-Document / Unintentional-Fix-Code / Unintentional-Fix-PRD). That verdict cascades to every contributing surface. §6 lists the 10–15 specific decisions; §7 shows how each decision maps to SCOPE-3.F{N} and SCOPE-8b.F{N} emissions.

---

## §0 — Traversal Summary

- **28 surfaces traversed:** PRD-08, PRD-14, PRD-14B, PRD-14D, PRD-15, PRD-16, PRD-17B, PRD-18, PRD-19, PRD-21, PRD-21A, PRD-21C, PRD-22, PRD-23, PRD-24, PRD-24A, PRD-24B, PRD-25, PRD-26, PRD-27, PRD-28, PRD-29, PRD-31, PRD-34, PRD-35, PRD-36 + 2 multi-PRD (PRD-09A/09B Linked-Steps, PRD-09A/09B Studio-Intelligence).
- **4 Deferred-to-Gate-4 stubs:** PRD-20, PRD-30, PRD-32/32A, PRD-37/PRD-28B.
- **1 global-addenda stub:** PRD-Audit-Readiness + PRD-Template-and-Audit-Updates (process docs, no code surfaces).
- **Total evidence files on disk:** 33.
- **Pre-consolidation finding candidate count:** ~120 seam-level rows across all evidence files.
- **Expected post-consolidation finding count:** ~25–40 SCOPE-3 + ~12–18 SCOPE-8b = ~40–55 findings total (per PLAN §5.4 expected 25–50 total, 8–15 Scope 8b).

---

## §1 — Systemic SCOPE-8b patterns (Beta-Y candidates)

Each subsection describes ONE systemic pattern with ONE proposed verdict. The verdict cascades to every surface listed. All Beta-Y defaults per PLAN §6 (SCOPE-8b default Y) unless orchestrator/founder downgrades.

### 1A. F11 — Edge Functions authenticate but don't authorize

**Pattern description.** The platform's Edge Function / RPC layer treats identity and authorization as the same check. `_shared/auth.ts:26-40 authenticateRequest` verifies the Bearer token resolves to a user — but no Edge Function or SECURITY DEFINER RPC then verifies that the authenticated user belongs to the family/member/resource they're invoking the function against. Result: any authenticated family member can POST to almost any Edge Function with another family's `conversation_id`, `family_id`, or resource UUID and (a) trigger paid AI work charged to the other family, (b) in some cases, retrieve that family's data synthesized through the Edge Function's context loader.

**Surfaces contributing (12+):**

| Surface | Specific gap | Evidence file | Beta Y? |
|---|---|---|---|
| PRD-15 | Per-pair `member_messaging_permissions` client-side only; Edge Function `lila-message-respond` doesn't re-verify | EVIDENCE_prd15 seam #4 | Y |
| PRD-17B | `classify_by_embedding` RPC SECURITY DEFINER + trusted `p_family_id` — semantic search across any family's journal_entries/archives | EVIDENCE_prd17b seam #6 | Y |
| PRD-18 | `match_book_extractions` RPC SECURITY DEFINER + trusted `p_family_id` — same shape | EVIDENCE_prd18 seam #7 | Y |
| PRD-21 | `lila_tool_permissions` never checked by 8 tool Edge Functions (cyrano, higgins_say/navigate, 4 Love Language, gratitude) | EVIDENCE_prd21 F-A | Y |
| PRD-22 | `member_emails` login resolution not enforced at Edge Function / auth callback layer | EVIDENCE_prd22 F-C | N (latent; multi-email UI not built) |
| PRD-22 | `lila_member_preferences` not loaded by any LiLa Edge Function | EVIDENCE_prd22 F-C | N (latent; no consumers exist) |
| PRD-25 | `guided-nbt-glaze` Edge Function has NO `authenticateRequest` call at all — accepts body-supplied `family_id`/`member_id` unauthenticated | EVIDENCE_prd25 seam #7 | Y |
| PRD-27 | Special Adult shift-window permission check reads `shift_sessions` (empty) while writes go to `time_sessions`; `is_member_available()` PL/pgSQL returns NULL for shift/custody — punts to client | EVIDENCE_prd27 F-A | Y (2 live special_adult_assignments rows in production) |
| PRD-34 | `lila_tool_permissions` never checked by 5 ThoughtSift Edge Functions (board_of_directors, perspective_shifter, decision_guide, mediator, translator) | EVIDENCE_prd34 F-A | Y |
| **PRD-34 (most severe)** | **`auth.ts` checks token but not conversation ownership across all 5 Edge Functions — cross-family data exposure via Mediator Full Picture** | **EVIDENCE_prd34 F-B** | **Y** |
| PRD-36 | `time_sessions` RLS only checks `user_id=auth.uid()` (self) + `primary_parent_id` (mom) — no dad/Special Adult policies | EVIDENCE_prd36 F-C | N (mom is current sole user; compounds PRD-27 F-A) |

**Proposed consolidation.** Single systemic Scope 8b finding: `SCOPE-8b.F1 — Edge Functions authenticate but do not authorize`. Cross-reference every contributing surface. Remediation: add a shared helper `authorizeForFamily(user, family_id)` to `_shared/auth.ts` that every function calls after `authenticateRequest`, AND add `auth.uid()` membership check inside SECURITY DEFINER RPCs.

**Most severe single instance.** PRD-34 F-B (cross-family conversation ownership bypass). Authenticated user in family A can POST Mediator Full Picture with family B's `conversation_id` → loads family B's private_notes + relationship_notes + guiding_stars + self_knowledge + synthesizes them into a system prompt sent to Sonnet, tokens logged to family A. Zero-click cross-tenant data leakage.

**Proposed severity:** **High** (cross-tenant data leakage + paid-AI cost amplification). **Beta Y.**

**Proposed resolution:** **Fix Now** for PRD-34 F-B (Mediator Full Picture — the most severe). **Fix Next Build** for the other 11 surfaces (uniform helper rollout).

---

### 1B. Cross-family conversation ownership bypass (PRD-34 F-B elevation)

Same pattern as 1A; elevated because its severity is categorically higher than the other 11 surfaces. The Mediator Full Picture path loads `private_notes` + `relationship_notes` from family B's members — these are the platform's deepest personal disclosures. No other Edge Function in the 1A list touches that depth of context.

**Keep separate from 1A if founder wants to emit one Blocking SCOPE-8b finding + one High SCOPE-8b finding; collapse into 1A if founder wants one cross-addendum consolidated finding with sub-bullets.**

### 1C. HITM gate bypassed on non-conversation AI writes

**Pattern description.** CLAUDE.md Convention #4 requires every AI output to pass through Edit/Approve/Regenerate/Reject before persisting. The chat-modality exception (conversation turns are their own HITM) is well-understood. But TWO Edge Function paths write AI-generated content to **non-conversation** tables (platform intelligence tier, draft library) WITHOUT the Edit/Approve/Regenerate/Reject gate.

**Surfaces contributing (2):**

| Surface | Specific gap | Evidence file | Beta Y? |
|---|---|---|---|
| PRD-21 | `communication_drafts` INSERT happens on "Save Draft" tap with no Edit/Approve/Regenerate between stream-complete and DB insert. Mom thinks she shaped the message; what persists is LiLa's verbatim text. | EVIDENCE_prd21 F-B | Y |
| PRD-34 | `board_personas` generation writes to platform intelligence table in one shot on "Create" tap. If Sonnet hallucinates a persona, it enters the cache and amortizes across all future users. | EVIDENCE_prd34 F-C | Y |

**Pattern at 2 surfaces** — Scope 3+8b §5.2 consolidation threshold is 3+; this is a watch pattern until a third surface confirms. **Keep as two standalone Beta-Y SCOPE-8b findings** (do not consolidate).

**Proposed severity:** **High** for both. **Beta Y.** **Fix Next Build** (UX addition: "Preview / Regenerate / Save" gate).

---

### 1D. Documented opt-out / accountability mechanism silently bypassed

**Pattern description.** Mom configures a user-controlled accountability or privacy mechanism. The UI toggle exists, the DB column exists, the PRD spec calls it out — and at runtime the enforcement does not fire. Mom's mental model ("I set this, it works") is violated. Trust-violation shape, not a data-leak shape.

**Surfaces contributing (4):**

| Surface | Specific gap | Evidence file | Beta Y? |
|---|---|---|---|
| PRD-14D | `require_pin_to_tally` on `family_best_intentions` — PIN-per-intention captured in Settings, persisted in DB, never checked at tally time. Kid taps avatar → tally logs with zero friction. | EVIDENCE_prd14d F-A | Y |
| PRD-19 | `is_available_for_mediation` on `relationship_notes` — Decision 18 per-author opt-out for Full Picture synthesis. **Column doesn't exist** in live schema; `loadFullPictureContext` in Mediator cannot filter. | EVIDENCE_prd19 F-A (SCOPE-8b side) | Y |
| PRD-22 | `analytics_opt_in` BOOLEAN on `families` default TRUE — no UI toggle, no consumer-side check before anonymized event writes. | EVIDENCE_prd22 F-B | Y |
| PRD-22 | `lila_member_preferences.history_retention` — per-member auto-archive setting has no consumer; no scheduled job archives conversations. | EVIDENCE_prd22 F-C sub-element | N (reclassified — degrades to cross-ref of F-C) |

**Pattern at 3+ surfaces — threshold MET for cross-addendum consolidation.**

**Proposed consolidation.** Single systemic Scope 8b finding: `SCOPE-8b.F{N} — Documented user-controlled accountability/privacy mechanisms are silently unenforceable at runtime`. Cross-reference 4 contributing surfaces.

**Proposed severity:** **High.** **Beta Y.** Trust violation pattern compounds: once one beta user discovers a setting that doesn't do what it says, confidence in every other setting degrades.

**Proposed resolution:** **Fix Next Build** per-surface (each remediation is surgical):
- PRD-14D: add `require_pin_to_tally` check + `verify_member_pin` RPC call before INSERT in `useLogFamilyIntentionTally`
- PRD-19: add columns (`is_available_for_mediation`, `sort_order`, `archived_at`) + filter in `loadFullPictureContext`
- PRD-22 analytics: add Settings toggle + `checkAnalyticsOptIn(family_id)` helper at every anonymized-event write site
- PRD-22 history_retention: add cron job OR scope-cut the feature explicitly

---

### 1E. Crisis Override missing in non-lila-chat Edge Functions

**Pattern description.** CLAUDE.md Convention #7 requires Crisis Override globally across every LiLa Edge Function. 13 Edge Functions are correctly wired (all 8 PRD-21 tools + all 5 PRD-34 ThoughtSift). But 3 Edge Functions that process user text and invoke AI are missing the check.

**Surfaces contributing (3):**

| Surface | Specific gap | Evidence file | Beta Y? |
|---|---|---|---|
| PRD-15 | `message-coach/index.ts` imports zero crisis-detection code — sends crisis-language drafts straight to Haiku | EVIDENCE_prd15 seam #6 | Y |
| PRD-15 | `auto-title-thread/index.ts` similarly bare | EVIDENCE_prd15 seam #6 | Y |
| PRD-23 | `bookshelf-discuss` bypasses Crisis Override + writes to `bookshelf_discussion_messages` NOT `lila_messages`, so PRD-30 Layer 2 cannot scan it when built | EVIDENCE_prd23 Finding A | Y |

**Pattern at 3 surfaces — threshold MET.**

**Proposed consolidation.** Single systemic Scope 8b finding: `SCOPE-8b.F{N} — Crisis Override discipline broken across 3 Edge Functions that process user text`. Remediation is uniform: import `detectCrisis` + `CRISIS_RESPONSE` from `_shared/crisis-detection.ts`, call `detectCrisis(content)` before any Sonnet/Haiku call, return crisis response if triggered.

**Proposed severity:** **Blocking.** **Beta Y.** Crisis Override is non-negotiable per Convention #7.

**Proposed resolution:** **Fix Now.** Three Edge Functions, ~5 lines each. Ship with the other Beta-Y remediation bundle.

---

### 1F. Privacy-filter / Safe Harbor exclusion gaps in SECURITY DEFINER semantic-search RPCs

**Pattern description.** Two SECURITY DEFINER RPCs that perform semantic search across family context data do NOT apply the privacy filters (`is_safe_harbor`, `is_included_in_ai`, `is_privacy_filtered`) that the LiLa context assembler correctly applies. Any authenticated caller that reaches these RPCs (combined with 1A, essentially any authenticated user) gets semantic matches against Safe Harbor journals, HeartOff'd items, and Privacy-Filtered archive items.

**Surfaces contributing (2):**

| Surface | Specific gap | Evidence file | Beta Y? |
|---|---|---|---|
| PRD-17B | `classify_by_embedding` RPC — no `is_safe_harbor` filter on `journal_entries`, no `is_included_in_ai` on any table, no `is_privacy_filtered` on `archive_context_items` | EVIDENCE_prd17b seam #6 | Y |
| PRD-18 | `match_book_extractions` RPC — no per-member `bookshelf_member_settings.book_knowledge_access` filter, no `is_deleted` on user-state | EVIDENCE_prd18 seam #7 | Y |

**Pattern at 2 surfaces — this overlaps significantly with 1A (same RPCs also lack auth check). Keep the Beta-Y SCOPE-8b finding for 1A; this pattern is the PRIVACY FILTER angle on the same RPCs, not an independent finding.**

**Proposed consolidation.** Fold into 1A's remediation — the RPC rewrite that adds `auth.uid()` membership check should ALSO add the privacy-filter joins. **No separate finding.** Cross-reference to 1A.

---

## §2 — Systemic SCOPE-3 patterns

All Beta-N per PLAN §6 (SCOPE-3 default N) unless child-facing UX non-viability is demonstrated.

### 2A. Source/enum discipline drift

**Pattern description.** Addenda repeatedly demand CHECK constraint additions for `source` / `source_type` / `destination` / `category` columns. The CHECK constraints either don't exist at all (columns are freeform TEXT) or exist but are missing addendum-promised values. Multiple writers use varying `source` values; consumers only branch on a hardcoded subset.

**Surfaces contributing (7+):**

| Surface | Specific drift | Evidence file |
|---|---|---|
| PRD-08 | `useNotepad.ts:535` writes `source: 'manual'` instead of `'hatch_routed'` for guiding_stars | EVIDENCE_prd08 F-B |
| PRD-08 | Notepad→Message `studio_queue.destination='message'` orphan | EVIDENCE_prd08 F-A |
| PRD-15 | `family_requests.source` enum widened by PRD-28 without amending PRD-15 | EVIDENCE_prd15 seam #9 |
| PRD-16 | `notifications.notification_type='system'` + `category='tasks'` instead of `'meeting_completed'` + `'meetings'` | EVIDENCE_prd16 seam #1 |
| PRD-16 | `meeting_agenda_items.source` missing `'request'` per PRD flow | EVIDENCE_prd16 Unexpected #3 |
| PRD-17B | `studio_queue.source` CHECK has no constraint (column freeform TEXT); addendum promised 4 new enum values | EVIDENCE_prd17b seam #3 |
| PRD-17B | `calendar_events.source_type` addendum demanded `'mindsweep'`; CHECK absent | EVIDENCE_prd17b seam #10 |
| **PRD-14B** | **CalendarTab writes `source_type='ics_import'` but CHECK doesn't include it — RUNTIME CHECK VIOLATION on .ics approval** | **EVIDENCE_prd14b seam #6** |
| PRD-18 | `studio_queue.source='rhythm_request'` addendum-promised, never wired | EVIDENCE_prd18 seam #14 |
| PRD-21 | `communication_drafts.sent_via` freeform TEXT; PRD L284 enumerated 3 values | EVIDENCE_prd21 seam #2 |
| PRD-23 | `tasks.source`, `guiding_stars.source`, `best_intentions.source` — all freeform TEXT | EVIDENCE_prd23 cross-pattern |

**Pattern at 7+ surfaces — far above threshold.**

**Proposed consolidation.** Single systemic Scope 3 finding: `SCOPE-3.F{N} — Source/enum discipline: addenda repeatedly demand CHECK constraint additions; 7+ columns across 8+ tables are freeform TEXT with no enforcement`. Cross-reference each contributing surface.

**Special severity bump:** PRD-14B's `.ics` import is a **RUNTIME CHECK VIOLATION** — the first beta user who uploads a .ics file and clicks Approve will see every approve throw a DB error. This is a distinct Beta-Y SCOPE-3 (different from the systemic pattern) — **escalate PRD-14B seam #6 to standalone High severity** while keeping the systemic pattern as Medium.

**Proposed severity:** **Medium** (pattern) + **High** (PRD-14B specific runtime violation). **Beta N** (pattern) + **Beta Y** (PRD-14B runtime CHECK violation — marquee .ics import feature broken).

**Proposed resolution:** **Fix Next Build** (pattern — uniform CHECK constraint additions) + **Fix Now** (PRD-14B — 1-line migration `ALTER TABLE calendar_events ... CHECK (source_type IN ... 'ics_import', 'mindsweep')`).

---

### 2B. Schedule vocabulary drift (PRD-35-concentrated)

**Pattern description.** PRD-35 Universal Scheduler introduces THREE incompatible `schedule_type` vocabularies + a second incompatible `RecurrenceDetails` TypeScript contract. All four drifts concentrate in PRD-35 but compound PRD-27's shift-session bifurcation.

**Drifts within PRD-35:**

1. `access_schedules.schedule_type` CHECK = `'shift'|'custody'|'always_on'` (live) vs PRD-35 spec `'recurring'|'custody'|'always_on'`
2. `access_schedules` column named `recurrence_details` (live) vs PRD-35 spec `recurrence_data`
3. `SchedulerOutput.schedule_type` TypeScript union `'fixed'|'completion_dependent'|'custody'` vs DB-bridge `buildTaskScheduleFields` hardcoded `'recurring'`
4. `calendar_events`/`meeting_schedules.recurrence_rule` CHECK missing `'completion_dependent'`, `'custody'` values that `tasks.recurrence_rule` CHECK has

**Plus:** two incompatible `RecurrenceDetails` TypeScript types (`src/components/scheduling/types.ts` vs `src/lib/scheduling/scheduleUtils.ts`) — `parseRecurrenceDetails` silently returns `null` when it receives the UniversalScheduler shape. **This is the root cause of PRD-27 F-A shift bifurcation.**

**Surface contributing:** PRD-35 F-A (seam #4 + Unexpected #1, #3, #4). See EVIDENCE_prd35 F-A.

**Pattern is single-PRD (PRD-35) but affects 4+ downstream tables.** Keep as PRD-35 standalone SCOPE-3 finding; cross-reference to PRD-27 F-A for the concrete downstream impact.

**Proposed severity:** **Medium.** **Beta N.**

**Proposed resolution:** **Fix Next Build.** Either rename migration to match PRD spec, or amend PRD-35 spec to match code + consolidate the two TypeScript contracts.

---

### 2C. Model-tier registry-vs-runtime drift

**Pattern description.** `lila_guided_modes.model_tier` is treated as documentation by Edge Functions that hardcode MODEL strings. The runtime value and the DB-registered tier drift in both directions. Cost logs show the actual model, but intent-vs-reality is invisible.

**Surfaces contributing (3):**

| Surface | Direction of drift | Evidence file |
|---|---|---|
| PRD-19 | `family_context_interview` seeded `sonnet` in migration, PRD L710 specifies `haiku`. **Latent** (no UI invokes the mode) | EVIDENCE_prd19 seam #8 |
| PRD-21 | `gratitude` registry `haiku` (migration 100087 downgrade), runtime hardcoded `sonnet`. **Live cost hit** | EVIDENCE_prd21 seam #9 |
| PRD-34 | `decision_guide` registry `haiku` (migration 100087 downgrade), runtime hardcoded `sonnet`. **Live cost hit** | EVIDENCE_prd34 seam #15 |

**Pattern at 3 surfaces — threshold MET.**

**Proposed consolidation.** Single systemic Scope 3 finding: `SCOPE-3.F{N} — Model-tier registry declarations are advisory only; Edge Function hardcoded MODEL strings override the DB`. Remediation: load `model_tier` from `lila_guided_modes` at runtime OR add a CI check that each Edge Function's hardcoded MODEL matches its registry row.

**Proposed severity:** **Low** (cost impact, not safety). **Beta N.** Feeds into Scope 4 cost-pattern audit (which runs after Scope 3+8b close).

**Proposed resolution:** **Fix Next Build.**

---

### 2D. Build M supersedes PRD-24 family architecture

**Pattern description.** PRD-24 Cross-PRD Impact Addendum was written against a pre-pivot design. Build M (signed off 2026-04-13) replaced the overlay-engine architecture with a Sticker Book substrate. PRD-24 family addenda were never back-amended. 9+ of 9 promised PRD-24A tables don't exist; 6 of 8 promised PRD-24 tables don't exist; PRD-24B's flat 8-ID reveal library pivoted to 33 themed variants.

**Surfaces contributing (3 addenda):**

| Surface | Core supersession | Evidence file |
|---|---|---|
| PRD-24 | 6 of 8 promised tables absent; `reward_redemption` + 6 notification types absent | EVIDENCE_prd24 F-α |
| PRD-24A | 9 of 9 promised tables absent; overlay engine + dashboard backgrounds + game modes absent | EVIDENCE_prd24a F-A |
| PRD-24B | Flat 8-ID reveal library pivoted to `reveal_animations` style_category model | EVIDENCE_prd24b F-α |

**Pattern at 3 addenda — threshold MET.**

**Proposed consolidation.** Single systemic Scope 3 finding: `SCOPE-3.F{N} — PRD-24 family Cross-PRD Impact Addenda pre-Build-M, never back-amended`. Cross-reference Scope 2 Batch 8 PRD-24-family findings.

**Proposed severity:** **Medium** (documentation debt, not code defect). **Beta N** (code is consistent with Build M; addendum text is the stale party). **Intentional-Document.**

**Proposed resolution:** **Intentional-Update-Doc.** Amend the 3 addenda with "Superseded by Build M 2026-04-13 — see `.claude/completed-builds/2026-04/build-m-*.md`". Alternatively, mark with a new tag `> **SUPERSEDED BY Build X:** ...` (process recommendation noted in EVIDENCE_global-addenda pattern #1).

---

### 2E. Demo-only component pattern

**Pattern description.** 9+ UI components ship with full animation/visual implementation but have `GamificationShowcase.tsx` (`/dev/gamification`) as their sole consumer. No production surface invokes them.

**Components contributing (9+):**

- PRD-24: `TreasureBoxIdle`
- PRD-24A: `BackgroundCelebration`, `ReadabilityGradient`
- PRD-24B: 4 CSS reveals (`CardFlipReveal`, `ThreeDoorsReveal`, `SpinnerWheelReveal`, `ScratchOffReveal`) + `PointsPopup`, `StreakFire`, `LevelUpBurst`, `StarChartAnimation`
- PRD-36: `TimerConfigPanel` orphaned from SettingsPage; `LogLearningModal` "Use Timer" button with no onClick

**Pattern at 4 addenda, 9+ components — far above threshold.**

**Proposed consolidation.** Single systemic Scope 3 finding: `SCOPE-3.F{N} — Demo-only component pattern across 4 addenda: 9+ components ship with full implementation but GamificationShowcase.tsx is the sole consumer`. Cross-reference contributing surfaces.

**Proposed severity:** **Low** (UX polish gap, not functional break). **Beta N.** **Intentional-Document** for components that were legitimately scope-cut; **Unintentional-Fix-Code** for components the addenda described as wired (`TimerConfigPanel`, `LogLearningModal` button).

**Proposed resolution:** **Fix Next Build** per-component. Either wire production consumers or formally scope-cut the components and register in STUB_REGISTRY.

---

### 2F. Pre-pivot addendum drift (addendum self-reporting drift)

**Pattern description.** Addenda assert completion facts that live schema or code contradicts.

**Surfaces contributing (3):**

| Surface | Drift type | Evidence file |
|---|---|---|
| PRD-21C | Addendum L196 claims "PRD-21C completed (Wave 2, item 5)" + "6 new tables" — ZERO tables exist | EVIDENCE_prd21c F-A |
| PRD-24 | Addendum describes pre-pivot architecture; Build M pivoted | EVIDENCE_prd24 F-α (cross-ref 2D) |
| PRD-29 | Addendum marks `tasks.source='project_planner'` stub sockets as "WIRED" despite no writer existing — WIRING_STATUS convention violated | EVIDENCE_prd29 F-D |

**Pattern at 3 surfaces — threshold MET.**

**Proposed consolidation.** Single systemic Scope 3 finding: `SCOPE-3.F{N} — Addendum self-reporting drift: 3 addenda assert completion facts that code/schema contradict`. Cross-reference.

**Proposed severity:** **Low** (documentation, not code). **Beta N.** **Unintentional-Fix-PRD.**

**Proposed resolution:** **Intentional-Update-Doc.** Amend the 3 addenda. Also recommend process habit (new addendum tag `> **Verified against code on YYYY-MM-DD**` or similar) — see EVIDENCE_global-addenda pattern #1.

---

### 2G. `is_included_in_ai` consumer-side no-op

**Pattern description.** The three-tier toggle (person → folder → item) is CORRECTLY implemented in `_shared/context-assembler.ts:557-625` for Archives (PRD-19 seam #6 — REFERENCE IMPLEMENTATION). But other addenda prescribe `is_included_in_ai` columns on their own tables that the context-assembler doesn't query.

**Surfaces contributing (2):**

| Surface | Specific gap | Evidence file |
|---|---|---|
| PRD-14 | `dashboard_widgets.is_included_in_ai` column exists + Settings UI assumes it works; context-assembler has zero references to `dashboard_widgets` or `widget_data_points` | EVIDENCE_prd14 F-B |
| PRD-14D | `family_best_intentions.is_included_in_ai` column exists + addendum L644-651 spec; zero Edge Function queries the table | EVIDENCE_prd14d F-D |

**Pattern at 2 surfaces — below threshold.** Keep as 2 standalone SCOPE-3 Low findings; watch for 3rd occurrence to escalate.

**Reference implementation confirmed:** PRD-19 Archives three-tier toggle is the canonical correct pattern. PRD-21 relationship-context.ts is the second correct implementation. These TWO strong-positive implementations set the bar the drift surfaces should meet.

**Proposed severity:** **Low** per-surface. **Beta N.** **Unintentional-Fix-Code** OR **Unintentional-Fix-PRD** (founder decides: either wire the consumer or drop the column + UI toggle).

---

### 2H. Settings page missing nav entry points

**Pattern description.** PRD-22 Settings overlay/page is the intended hub for cross-PRD configuration surfaces. Multiple addenda prescribe Settings sections that SettingsPage.tsx doesn't link to; orphaned Settings panels exist as demo-only components.

**Surfaces contributing (1 consolidated + 1 cross-ref):**

| Surface | Specific gap | Evidence file |
|---|---|---|
| PRD-22 | 4 of 5 cross-PRD nav entry points missing from SettingsPage: Calendar Settings, Messaging Settings, Notification Preferences, Faith Preferences. Only Permission Hub linked. | EVIDENCE_prd22 F-D |
| PRD-36 | `TimerConfigPanel` (509 lines) orphaned from SettingsPage — feature-complete component with no nav entry | EVIDENCE_prd36 F-A sub-element |

**Keep as 2 standalone SCOPE-3 Low findings** (same shape, different owners). PRD-36's `TimerConfigPanel` belongs both to this pattern AND to the demo-only component pattern (2E).

**Proposed severity:** **Low.** **Beta N.** **Unintentional-Fix-Code.**

**Proposed resolution:** **Fix Next Build.** 5 nav entry additions to SettingsPage.tsx.

---

### 2I. Event dispatched to void pattern

**Pattern description.** Code paths `window.dispatchEvent(new CustomEvent(...))` or equivalent, intending "loose coupling — downstream consumers listen independently" — but zero listeners exist. Pure dead-letter dispatch.

**Surfaces contributing (2):**

| Surface | Specific gap | Evidence file |
|---|---|---|
| PRD-24 | `useUncompleteTask:434-438` stub comment "wires when PRD-24 is built" — Build M shipped, stub still there; Convention #206 acknowledges gap | EVIDENCE_prd24 F-β sub-element |
| PRD-36 | `time_session_completed` + `time_session_modified` events dispatched by `useTimer.ts:218,295,328` — ZERO listeners across `src/` and `supabase/functions/` | EVIDENCE_prd36 F-A |

**Pattern at 2 surfaces — below threshold.** Keep as 2 standalone Low findings; watch for 3rd.

**Proposed severity:** **Low.** **Beta N.** **Unintentional-Fix-Code.**

**Proposed resolution:** **Fix Next Build.** Either wire listeners OR remove the dispatch and document the coupling explicitly.

---

### 2J. Stub-socket-as-WIRED terminology

**Pattern description.** Addenda mark pre-wired column additions + enum values as "WIRED" when no writer code exists. WIRING_STATUS.md convention (L3 "If it doesn't work in the app, it is not wired") is violated by the addendum's status-claim language.

**Surfaces contributing (1 explicit + pattern-adjacent):**

| Surface | Specific gap | Evidence file |
|---|---|---|
| PRD-29 | Addendum L94-98 marks `tasks.source='project_planner'` + `tasks.related_plan_id` stubs as "WIRED" despite no writer code existing | EVIDENCE_prd29 F-D |

**Pattern at 1 explicit surface.** Worker flagged as potential cross-addendum pattern (check PRD-12A / PRD-17 / PRD-32A addenda for similar).

**Proposed handling:** **Keep as PRD-29 standalone Low finding.** Do not escalate yet. Include in the addendum-writing-habits recommendations bundle per EVIDENCE_global-addenda pattern #2.

**Proposed severity:** **Low.** **Beta N.** **Unintentional-Fix-PRD.**

---

## §3 — Individual high-severity findings (Beta-Y standalone)

These don't belong to a systemic pattern but are significant enough to emit as standalone findings with Beta-Y Beta Readiness flag.

### 3A. PRD-17B auto-sweep silently a no-op

- **Evidence:** EVIDENCE_prd17b seam #5
- **Gap:** `mindsweep-auto-sweep/index.ts:116` invokes `mindsweep-sort` from the SERVER. `mindsweep-sort` only returns classifications, does NOT write rows. Auto-sweep marks holding items `processed_at=now()` DESPITE no destination rows being created. Holding items vanish; no studio_queue / journal / victory / etc. rows materialize.
- **User-facing impact:** PRD-17B Screen 2 marquee "wake up to sorted items in your Queue" promise is unimplemented. ADHD/disability-mom primary use case non-viable.
- **Proposed severity:** **High.** **SCOPE-8b.** **Beta Y.** **Fix Next Build** (implement server-side `routeSweepResults` equivalent).

### 3B. PRD-14B `.ics` import CHECK violation (runtime failure)

- **Evidence:** EVIDENCE_prd14b seam #6
- **Gap:** CalendarTab.tsx:301, :380, :448 all INSERT `source_type: 'ics_import'` on `.ics` import approval. The live CHECK constraint (migration `100146:301`) only allows 7 values, none of which is `ics_import`. **Every .ics import approve will throw.**
- **User-facing impact:** Marquee feature in PRD-14B Screen 5 + PRD-17B Phase 0 calendar import. Silent latent bug — no one has exercised the path yet.
- **Proposed severity:** **High.** **SCOPE-8b** primary (child-data-adjacent trust-violation — marquee import silently fails) + **SCOPE-3** cross-ref.
- **Beta Y. Fix Now.** One-line migration: `ALTER TABLE calendar_events DROP CONSTRAINT calendar_events_source_type_check; ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_source_type_check CHECK (source_type IN (..., 'ics_import', 'mindsweep'));`.

### 3C. PRD-22 `account_deletions` GDPR right-to-erasure unenforced

- **Evidence:** EVIDENCE_prd22 F-A
- **Gap:** Migration 100027:267 defines `process_expired_deletions()` function — but **the pg_cron schedule is COMMENTED OUT** at migration 100027:304-305 AND the function body only does `is_active = false` (soft-deactivate), NOT hard-delete cascade. No UI path: grep `Delete My Account` in `src/` returns zero hits.
- **User-facing impact:** GDPR right-to-erasure promise in PRD-22 L639 cannot be delivered. Manual support workflow documented in Scope 2 DECISIONS but not surfaced in Settings UI.
- **Proposed severity:** **High** (GDPR/COPPA compliance). **SCOPE-8b** primary + **SCOPE-3** cross-ref. **Beta Y.**
- **Proposed resolution:** **Fix Next Build.** (a) uncomment cron OR formally document manual workflow in Settings UI; (b) extend `process_expired_deletions()` to actually hard-delete; (c) add "Delete My Account" surface.

### 3D. PRD-16 meeting impressions privacy unenforced + dad permission gate absent

- **Evidence:** EVIDENCE_prd16 seams #2 + #3
- **Gaps (2):**
  - **Seam #2:** `meetings.impressions TEXT` column on a row whose RLS grants SELECT to mom + any participant. Convention #232 ("Impressions are personal — only visible to person who ended") enforced ONLY by a SQL comment. Couple meeting impressions readable by the partner.
  - **Seam #3:** `useCreateMeeting` does NO `member_permissions` check before INSERT. RLS allows ANY family_member to insert ANY meeting type for ANY child. PRD-16 Edge Cases L880-882 promised friendly error; never shipped. Dad-without-permission can start mentor meeting with a child he can't access.
- **User-facing impact:** Couple-tester hits privacy leak on first meeting end. Cross-parent privacy boundary violated.
- **Proposed severity:** **High** (both). **SCOPE-8b** primary ×2 + **SCOPE-3** cross-refs. **Beta Y** for both.
- **Proposed resolution:** **Fix Next Build.** Impressions → column-level redaction or separate table. Dad gate → add `useCanStartMeeting(meetingType, relatedMemberId)` hook checking `member_permissions`.

### 3E. PRD-27 shift_sessions/time_sessions bifurcation (live data gap)

- **Evidence:** EVIDENCE_prd27 F-A
- **Gap:** `ShiftView.tsx:550-581` writes to `time_sessions` per Convention #40. `usePermission.ts:87-96` + `PermissionHub.tsx:833,854,1164` READ from `shift_sessions` (0 rows, table exists but unused). For shift-type (non-always_on) Special Adults, permission check returns no-active-shift → denied.
- **User-facing impact:** 2 live `special_adult_assignments` rows in production. Babysitter invite flow during beta → permission system denies access OR grants via different path not surveyed here.
- **Proposed severity:** **High.** **SCOPE-8b** primary + **SCOPE-3** cross-ref. **Beta Y.**
- **Proposed resolution:** **Fix Now.** Change `usePermission.ts` + `PermissionHub.tsx` queries to read `time_sessions WHERE source_type='shift' AND ended_at IS NULL`. One file-pair change.

### 3F. PRD-28 first `allowance_periods` row never created

- **Evidence:** EVIDENCE_prd28 seam #8
- **Gap:** Cron opens NEXT period after closing one. No code path creates the FIRST period when allowance is enabled. Mom configures allowance → no period exists → cron has nothing to close → no transactions ever land.
- **User-facing impact:** Allowance system is functionally non-operational at first-use. Founder decision (Open Q1) was "Start immediately, pro-rated from today" — no code implements.
- **Proposed severity:** **High.** **SCOPE-3** Beta Y (functional non-op on marquee feature). No SCOPE-8b.
- **Proposed resolution:** **Fix Next Build.** Add first-period bootstrap in `useUpdateAllowanceConfig` or allowance enablement trigger.

### 3G. PRD-14D PIN-per-intention silently bypassed

- **Evidence:** EVIDENCE_prd14d F-A
- **Gap:** `family_best_intentions.require_pin_to_tally` is captured at create/edit, persisted to DB, presented as Settings toggle, and NEVER checked at tally time. Mom configures "No screen time after 8 PM" as PIN-required; kids tap avatar from Hub, tally logs with zero friction.
- **User-facing impact:** Mom-configured accountability mechanism documented + UI-promised + bypassed = trust violation.
- **Already captured in 1D (Documented opt-out silently bypassed pattern).** No separate finding emission — this is one sub-surface of 1D.

### 3H. PRD-15 5 SCOPE-8b findings (consolidate per PRD-15 F-A)

- **Evidence:** EVIDENCE_prd15 seams #3, #4, #5, #6, #7
- **Gaps:**
  - Coaching log fictional (`useMessageCoaching.recordCoachedSend` is a `useRef`, no DB write)
  - Per-pair messaging permission enforced client-side only
  - Safety alert DnD bypass absent
  - Crisis Override missing in `message-coach` + `auto-title-thread`
  - Content Corner lock client-only
- **Consolidation:** Per EVIDENCE_prd15 Proposed consolidation, these collapse to ONE PRD-15 SCOPE-8b consolidated finding "Messaging safety semantics enforced client-side only across 4 surfaces". Crisis Override sub-element also contributes to 1E pattern.
- **Proposed severity:** **High.** **Beta Y.**
- **Proposed resolution:** **Fix Next Build.** 4 surfaces; each surgical.

---

## §4 — Unbuilt-PRD Deferred-to-Gate-4 stubs

Short stub files already on disk. No walk-through needed. Apply-phase worker will cite these as cross-references to the closed Scope 5 / Scope 8a findings that captured the PRD-unbuilt status.

| Stub | Closed finding cross-ref | Evidence file |
|---|---|---|
| PRD-20 Safe Harbor | SCOPE-8a.F3 | EVIDENCE_prd20 |
| PRD-30 Safety Monitoring | SCOPE-8a.F3 | EVIDENCE_prd30 |
| PRD-32/32A Admin Console | SCOPE-8a.F1 | EVIDENCE_prd32-32a |
| PRD-37/PRD-28B (Compliance seam) | Scope 5 Finding A | EVIDENCE_prd37-prd28b |

**Recommend orchestrator add PRD-27 + PRD-29 to DECISIONS.md Round 0 Deferred-to-Gate-4 table** — both meet identical "unbuilt-PRD" criteria but are not currently listed. EVIDENCE_prd27 F-B (PRD-27 unbuilt) and EVIDENCE_prd29 F-A (PRD-29 unbuilt) would then collapse to structural Deferred findings alongside the other 4.

---

## §5 — Strong positives (documented, no finding)

These are reference-quality implementations flagged as gold standards. Apply-phase worker should surface them in Appendix C or as commentary notes in AUDIT_REPORT_v1.md §3 / §8b.

| Strong positive | Evidence file |
|---|---|
| **Mediator `safety_triggered` flag** — persisted to `lila_conversations.context_snapshot`, checked from DB on every turn, survives close/reopen, dedicated SAFETY MODE system prompt forbids framework resumption | EVIDENCE_prd34 seam #4 |
| **Archives three-tier `is_included_in_ai` toggle** — person → folder → item correctly implemented in `_shared/context-assembler.ts:557-625` + privacy-filter + archived_at | EVIDENCE_prd19 seam #6 |
| **Financial data excluded from LiLa context** — Convention #225 documented in code with a comment block + zero violations across all Edge Functions | EVIDENCE_prd28 seam #5 |
| **Crisis Override on 13 Edge Functions** — all 8 PRD-21 tools + all 5 PRD-34 ThoughtSift correctly integrate `detectCrisis` | EVIDENCE_prd21 + EVIDENCE_prd34 watch-flag hits |
| **Gamification RPC pipeline** — `roll_creature_for_completion` SECURITY DEFINER + atomic + idempotent + 4 hooks wired + never throws to client + cache invalidation correct | EVIDENCE_prd24 seams #2-#7 |
| **PRD-09A/09B Studio-Intelligence Phase 1** — cleanest post-build validation in the entire audit. 14 seams traced, 0 findings. Conventions #149-#156 all citable | EVIDENCE_prd09a-09b-studio-intelligence |
| **PRD-09A/09B Linked-Steps Build J** — 2nd cleanest. 14 seams, 0 new findings. Conventions #157-#167 all citable | EVIDENCE_prd09a-09b-linked-steps-mastery |
| **PRD-26 Build M scope-cut discipline** — registered stubs + enum breadcrumbs pattern. Reveal Task Tile + Mom Message Card cleanly scope-cut via STUB_REGISTRY | EVIDENCE_prd26 Top 3 surprise #1 |
| **Relationship-context shared helper** (PRD-21) — second reference-quality `is_included_in_ai` consumer, correctly applies the Archives three-tier pattern | EVIDENCE_prd21 seam #10 |

---

## §6 — Founder adjudication prompts (walk-through)

Each decision below cascades to N per-PRD findings. Founder gives ONE verdict per row.

### Decision 1: F11 "authenticate but don't authorize" (Pattern 1A)

- **Verdict needed:** (a) Accept as ONE systemic SCOPE-8b finding with 12 cross-references, Beta Y, Fix Next Build + Fix Now for PRD-34 F-B specifically? (b) Emit per-surface findings? (c) Consolidate all 12 into 1?
- **My recommendation:** (a). One Blocking SCOPE-8b finding for the pattern + one High SCOPE-8b finding standalone for PRD-34 F-B (cross-tenant data leakage, categorically worse). Remediation: shared `authorizeForFamily()` helper.

### Decision 2: HITM on non-conversation AI writes (Pattern 1C)

- **Verdict needed:** 2 surfaces (PRD-21 communication_drafts + PRD-34 board_personas). Keep as 2 standalone Beta-Y findings, OR consolidate?
- **My recommendation:** Keep as 2 standalone. Pattern not at 3+ threshold yet.

### Decision 3: Documented opt-out silently bypassed (Pattern 1D)

- **Verdict needed:** 4 surfaces. Consolidate to one systemic SCOPE-8b Beta-Y finding with 4 cross-refs, OR emit per-surface?
- **My recommendation:** Consolidate. Trust-violation shape compounds — once mom discovers one, confidence in every other setting degrades.

### Decision 4: Crisis Override missing in 3 Edge Functions (Pattern 1E)

- **Verdict needed:** Blocking severity? Consolidate to one systemic finding?
- **My recommendation:** Consolidate. Blocking. Fix Now. Convention #7 is non-negotiable.

### Decision 5: Source/enum discipline drift (Pattern 2A)

- **Verdict needed:** 7+ surfaces. Consolidate OR emit per-surface? AND PRD-14B runtime CHECK violation — standalone escalation?
- **My recommendation:** Consolidate pattern as one Medium SCOPE-3 Beta-N finding. Emit PRD-14B seam #6 as a standalone High SCOPE-8b Beta-Y finding (runtime check violation on marquee .ics feature).

### Decision 6: Schedule vocabulary drift (Pattern 2B)

- **Verdict needed:** PRD-35-concentrated. Standalone SCOPE-3 Medium Beta-N finding with cross-ref to PRD-27 F-A?
- **My recommendation:** Yes. Don't escalate the PRD-27 shift bifurcation back to PRD-35 — keep PRD-27 F-A as its own Beta-Y finding and cross-reference PRD-35 F-A as the root-cause doc.

### Decision 7: Model-tier registry drift (Pattern 2C)

- **Verdict needed:** 3 surfaces. Consolidate?
- **My recommendation:** Consolidate as one Low SCOPE-3 Beta-N finding. Feeds Scope 4 cost-pattern audit.

### Decision 8: Build M supersession (Pattern 2D) + Pre-pivot addendum drift (2F)

- **Verdict needed:** Merge into one? Separate?
- **My recommendation:** Keep as 2 separate findings. 2D is specific to PRD-24 family architectural pivot. 2F captures the broader "addendum asserts completion facts code contradicts" pattern (PRD-21C, PRD-29 differ in shape from PRD-24). Both Intentional-Document, Beta N.

### Decision 9: Demo-only component pattern (2E)

- **Verdict needed:** 9+ components. Consolidate to one finding? Emit per-component?
- **My recommendation:** Consolidate as one Low SCOPE-3 Beta-N finding with component list. Remediation happens per-component post-beta.

### Decision 10: `is_included_in_ai` consumer-side no-op (2G)

- **Verdict needed:** 2 surfaces. Consolidate OR emit standalone?
- **My recommendation:** Emit as 2 standalone Low findings (not yet 3+ threshold). Watch for 3rd.

### Decision 11: Settings-page missing nav (2H) + Demo-only (2E overlap on TimerConfigPanel)

- **Verdict needed:** TimerConfigPanel fits both 2H (orphaned from SettingsPage) and 2E (demo-only). Assign to which finding?
- **My recommendation:** Primary assignment to 2H (missing nav entry — the more specific pattern); cross-reference from 2E finding body.

### Decision 12: Event dispatched to void (2I)

- **Verdict needed:** 2 surfaces. Consolidate OR emit standalone?
- **My recommendation:** Emit as 2 standalone Low findings. Not yet 3+ threshold.

### Decision 13: Stub-socket-as-WIRED (2J)

- **Verdict needed:** 1 explicit surface (PRD-29). Escalate, or hold for pattern?
- **My recommendation:** Hold. Emit as PRD-29 standalone Low finding. Note as potential cross-addendum pattern for future audit.

### Decision 14: Unbuilt-PRD Deferred stubs (§4)

- **Verdict needed:** Add PRD-27 + PRD-29 to DECISIONS.md Round 0 Deferred-to-Gate-4 table?
- **My recommendation:** Yes. Both meet identical criteria. EVIDENCE_prd27 F-B and EVIDENCE_prd29 F-A collapse to structural Deferred findings alongside PRD-20, PRD-30, PRD-32, PRD-28B.

### Decision 15: High-severity standalones (§3)

- **Verdict needed:** All 8 surfaces in §3 emit as standalone Beta-Y findings?
- **My recommendation:** Yes, with severity levels per-row:
  - 3A PRD-17B auto-sweep → **High SCOPE-8b Beta Y, Fix Next Build**
  - 3B PRD-14B .ics CHECK → **High SCOPE-8b Beta Y, Fix Now** (1-line migration)
  - 3C PRD-22 account_deletions → **High SCOPE-8b Beta Y, Fix Next Build**
  - 3D PRD-16 meeting impressions + dad gate → **High SCOPE-8b Beta Y ×2, Fix Next Build**
  - 3E PRD-27 shift bifurcation → **High SCOPE-8b Beta Y, Fix Now** (one file-pair change)
  - 3F PRD-28 first allowance_periods → **High SCOPE-3 Beta Y, Fix Next Build**
  - 3G PRD-14D PIN-per-intention → folded into 1D consolidation, no separate emission
  - 3H PRD-15 messaging safety → **High SCOPE-8b Beta Y (consolidated), Fix Next Build**

---

## §7 — Apply-phase input mapping

After walk-through sets verdicts, apply-phase worker receives this mapping to emit findings into AUDIT_REPORT_v1.md.

### §7.1 Expected SCOPE-8b emissions (Beta-Y candidates, default = Y)

| ID | Title | Severity | Beta Y? | Resolution | Sources |
|---|---|---|---|---|---|
| SCOPE-8b.F1 | Edge Functions authenticate but do not authorize (F11 systemic) | High | Y | Fix Next Build | 1A cross-refs: EVIDENCE_prd15, _prd17b, _prd18, _prd21, _prd22, _prd25, _prd27, _prd34, _prd36 |
| SCOPE-8b.F2 | Cross-family conversation ownership bypass (Mediator Full Picture) | Blocking | Y | Fix Now | EVIDENCE_prd34 F-B |
| SCOPE-8b.F3 | HITM gate bypassed on PRD-21 `communication_drafts` persist | High | Y | Fix Next Build | EVIDENCE_prd21 F-B |
| SCOPE-8b.F4 | HITM gate bypassed on PRD-34 `board_personas` generation | High | Y | Fix Next Build | EVIDENCE_prd34 F-C |
| SCOPE-8b.F5 | Documented user-controlled accountability/privacy silently unenforceable (4 surfaces) | High | Y | Fix Next Build | 1D cross-refs: PRD-14D, PRD-19, PRD-22 analytics, PRD-22 history |
| SCOPE-8b.F6 | Crisis Override missing in 3 Edge Functions | Blocking | Y | Fix Now | 1E cross-refs: PRD-15 message-coach + auto-title + PRD-23 bookshelf-discuss |
| SCOPE-8b.F7 | PRD-17B auto-sweep silently a no-op | High | Y | Fix Next Build | EVIDENCE_prd17b seam #5 |
| SCOPE-8b.F8 | PRD-14B `.ics` import CHECK violation (runtime failure on marquee feature) | High | Y | Fix Now | EVIDENCE_prd14b seam #6 |
| SCOPE-8b.F9 | PRD-22 `account_deletions` GDPR right-to-erasure unenforced | High | Y | Fix Next Build | EVIDENCE_prd22 F-A |
| SCOPE-8b.F10 | PRD-16 meeting impressions privacy unenforced | High | Y | Fix Next Build | EVIDENCE_prd16 seam #2 |
| SCOPE-8b.F11 | PRD-16 dad meeting permission gate absent | High | Y | Fix Next Build | EVIDENCE_prd16 seam #3 |
| SCOPE-8b.F12 | PRD-27 shift_sessions/time_sessions bifurcation (live data gap) | High | Y | Fix Now | EVIDENCE_prd27 F-A |
| SCOPE-8b.F13 | PRD-15 messaging safety semantics enforced client-side only (consolidated 4 sub-surfaces) | High | Y | Fix Next Build | EVIDENCE_prd15 F-A |
| SCOPE-8b.F14 | PRD-22 `analytics_opt_in` privacy promise unenforceable | High | Y | Fix Next Build | EVIDENCE_prd22 F-B (cross-ref 1D) |
| SCOPE-8b.F15 | PRD-31 server-side subscription tier enforcement absent (47 Edge Functions) | High | Y | Fix Next Build | EVIDENCE_prd31 F-G |

**Estimated SCOPE-8b total:** 15 findings (matches PLAN §5.4 expectation of 8-15).

### §7.2 Expected SCOPE-3 emissions (Beta-N default)

| ID | Title | Severity | Beta | Resolution | Sources |
|---|---|---|---|---|---|
| SCOPE-3.F1 | Source/enum discipline drift (7+ columns freeform TEXT with missing CHECKs) | Medium | N | Fix Next Build | 2A cross-refs |
| SCOPE-3.F2 | PRD-35 schedule vocabulary drift (4 incompatible vocabularies + 2 RecurrenceDetails TS types) | Medium | N | Fix Next Build | EVIDENCE_prd35 F-A |
| SCOPE-3.F3 | PRD-35 scheduler output broken semantics (completion-dependent + alternating-weeks + buildTaskScheduleFields) | Medium | N | Fix Next Build | EVIDENCE_prd35 F-B |
| SCOPE-3.F4 | PRD-35 convention surface unwired (calendar preview 2/3 consumers, weekStartDay, allowedFrequencies, _legacy_recurrence, CHECK gaps, scheduler tier gating) | Low | N | Fix Next Build | EVIDENCE_prd35 F-C |
| SCOPE-3.F5 | Model-tier registry-vs-runtime drift (3 Edge Functions hardcode MODEL) | Low | N | Fix Next Build | 2C cross-refs |
| SCOPE-3.F6 | PRD-24 family Cross-PRD Impact Addenda pre-Build-M, never back-amended | Medium | N | Intentional-Update-Doc | 2D cross-refs: PRD-24 + PRD-24A + PRD-24B |
| SCOPE-3.F7 | Addendum self-reporting drift — 3 addenda assert completion facts code contradicts | Low | N | Intentional-Update-Doc | 2F cross-refs: PRD-21C, PRD-24, PRD-29 |
| SCOPE-3.F8 | Demo-only component pattern (9+ components consumed only by GamificationShowcase) | Low | N | Fix Next Build | 2E cross-refs |
| SCOPE-3.F9 | PRD-14 `is_included_in_ai` widget toggle is no-op | Low | N | Fix Next Build | EVIDENCE_prd14 F-B |
| SCOPE-3.F10 | PRD-14D `family_best_intentions.is_included_in_ai` not consumed by LiLa context | Low | N | Fix Next Build | EVIDENCE_prd14d F-D |
| SCOPE-3.F11 | PRD-22 Settings page missing 4 cross-PRD nav entry points | Low | N | Fix Next Build | EVIDENCE_prd22 F-D |
| SCOPE-3.F12 | PRD-36 TimerConfigPanel orphaned from SettingsPage | Low | N | Fix Next Build | EVIDENCE_prd36 F-A |
| SCOPE-3.F13 | PRD-24 task unmark cascade stub comment stale post-Build-M | Low | N | Fix Next Build | EVIDENCE_prd24 F-β |
| SCOPE-3.F14 | PRD-36 time_session_completed + time_session_modified events have zero listeners | Medium | N | Fix Next Build | EVIDENCE_prd36 F-A |
| SCOPE-3.F15 | PRD-29 addendum marks stub sockets as "WIRED" despite no writer | Low | N | Intentional-Update-Doc | EVIDENCE_prd29 F-D |
| SCOPE-3.F16 | PRD-28 first allowance_periods row never created | High | Y | Fix Next Build | EVIDENCE_prd28 seam #8 |
| SCOPE-3.F17 | PRD-08 Notepad→studio_queue orphan destinations (message, track, optimizer) | Low | N | Fix Next Build | EVIDENCE_prd08 F-A |
| SCOPE-3.F18 | PRD-08 Notepad source tracking lost on direct destination writes | Low | N | Fix Next Build | EVIDENCE_prd08 F-B |
| SCOPE-3.F19 | PRD-23 BookShelf 5 outbound handoffs partially built | Medium | N | Fix Next Build | EVIDENCE_prd23 C |
| SCOPE-3.F20 | PRD-23 BookShelf cross-PRD addendum schema drift | Low | N | Intentional-Update-Doc | EVIDENCE_prd23 D |
| SCOPE-3.F21 | PRD-25 Guided cross-feature integrations ship as UI-visible placeholders (Step 2.5 Reflections, Messages tab, Write badge, SendTo Message) | Medium | N | Fix Next Build | EVIDENCE_prd25 F-consolidated |
| SCOPE-3.F22 | PRD-25 bottom nav missing Victories as primary tab | Medium | N | Fix Next Build | EVIDENCE_prd25 F-A |
| SCOPE-3.F23 | PRD-25 wrong feature_key gate on Guided LiLa modes | Medium | N | Fix Next Build | EVIDENCE_prd25 F-B |
| SCOPE-3.F24 | PRD-25 gamification-disable behavior unimplemented across 4 surfaces | Medium | N | Fix Next Build | EVIDENCE_prd25 F-C |
| SCOPE-3.F25 | PRD-26 Reveal Task Tile integration entirely stubbed | Low | N | Intentional-Document | EVIDENCE_prd26 F-A |
| SCOPE-3.F26 | PRD-26 Mom Message Card entirely stubbed | Low | N | Intentional-Document | EVIDENCE_prd26 F-B |
| SCOPE-3.F27 | PRD-26 section-key data-driven layout not implemented (hardcoded JSX) | Low | N | Fix Next Build | EVIDENCE_prd26 F-C |
| SCOPE-3.F28 | Play shell "Fun" tab 404 (/rewards route missing) | Low | N (mild Y) | Fix Now (1 line) | EVIDENCE_prd24a F-B |
| SCOPE-3.F29 | PRD-14 dashboard section col_span + grid sharing unimplemented | Low | N | Fix Next Build | EVIDENCE_prd14 F-A |
| SCOPE-3.F30 | PRD-14 Today's Victories widget shows recent-3 instead of today-filtered | Low | N | Fix Next Build | EVIDENCE_prd14 F-C |
| SCOPE-3.F31 | PRD-14B `calendar-parse-event` Edge Function + calendar_event_create LiLa mode unbuilt | Low | N | Fix Next Build (or Deferred per Scope 2 PRD14B-AI-INTAKE-UNBUILT) | EVIDENCE_prd14b cross-refs |
| SCOPE-3.F32 | PRD-14B duplicate calendar_color column + getMemberColor canonical drift | Low | N | Fix Next Build | EVIDENCE_prd14b seam #3 |
| SCOPE-3.F33 | PRD-14B showTimeDefault={false} on EventCreationModal violates Convention #109 | Low | N | Fix Next Build | EVIDENCE_prd14b seam #8 |
| SCOPE-3.F34 | PRD-18 5 cross-feature wirings delivered as schema/type scaffolding (GIN index, rhythm_request enum, reflection_routed, contextual_help, mood_triage) | Low | N | Fix Next Build | EVIDENCE_prd18 F-consolidated |
| SCOPE-3.F35 | PRD-21 4 integration surfaces shipped as scaffolding only (Higgins Navigate skill save, AI Toolbox sidebar, Send via Message, name auto-detection) | Medium | N | Fix Next Build | EVIDENCE_prd21 F-C |
| SCOPE-3.F36 | PRD-22 `member_emails` + `lila_member_preferences` schema extensions have zero consumers | Medium | N | Fix Next Build | EVIDENCE_prd22 F-C |
| SCOPE-3.F37 | PRD-22 Settings overlay-vs-route architectural drift (acknowledged-deferred) | Low | N | Intentional-Document | EVIDENCE_prd22 F-E |
| SCOPE-3.F38 | PRD-22 Out of Nest notification infrastructure drift (phone vs phone_number + notification_methods absent) | Low | N | Fix Next Build | EVIDENCE_prd22 F-F |
| SCOPE-3.F39 | PRD-24 Addendum pre-pivot architecture (cross-ref 2D) | Medium | N | Intentional-Update-Doc | EVIDENCE_prd24 F-α (cross-ref SCOPE-3.F6) |
| SCOPE-3.F40 | PRD-24 integration edges schema/primitive-only | Low | N | Fix Next Build | EVIDENCE_prd24 F-β |
| SCOPE-3.F41 | PRD-24A overlay-engine architecture entirely superseded by Build M (cross-ref 2D) | Medium | N | Intentional-Document | EVIDENCE_prd24a F-A (cross-ref SCOPE-3.F6) |
| SCOPE-3.F42 | PRD-24B flat Reveal Type Library superseded by reveal_animations style_category (cross-ref 2D) | Medium | N | Intentional-Document | EVIDENCE_prd24b F-α |
| SCOPE-3.F43 | PRD-24B animation primitives ship as demo-only (cross-ref 2E) | Medium | N | Fix Next Build | EVIDENCE_prd24b F-β |
| SCOPE-3.F44 | PRD-24B Color-Reveal architecture replaced by Build M tally-counter model | Medium | N | Intentional-Document | EVIDENCE_prd24b F-γ |
| SCOPE-3.F45 | PRD-28 PRD-28B compliance handoff Deferred-to-Gate-4 | Low | N | Deferred-Document | EVIDENCE_prd28 seam #15 |
| SCOPE-3.F46 | PRD-28 hourly + financial_approval dead enum values (business work pathway unwired) | Low | N | Fix Next Build | EVIDENCE_prd28 seam #9 + #10 |
| SCOPE-3.F47 | PRD-28 homework approval-path time log gap | Low | N | Fix Next Build | EVIDENCE_prd28 seams #1, #12 |
| SCOPE-3.F48 | PRD-29 BigPlans entirely unbuilt (cross-ref Deferred list) | Low | N | Deferred-Document | EVIDENCE_prd29 F-A |
| SCOPE-3.F49 | PRD-29 BigPlans guided-mode taxonomy drift (4 addendum vs 5 seeded) | Low | N | Intentional-Update-Doc | EVIDENCE_prd29 F-B |
| SCOPE-3.F50 | PRD-29 5 BigPlans feature keys referenced but absent from feature_key_registry seed | Medium | N | Fix Next Build | EVIDENCE_prd29 F-C |
| SCOPE-3.F51 | PRD-31 useCanAccess + PermissionGate adoption gap (consolidated hook stub, consumers no memberId, gate barely used) | Medium | N | Fix Next Build | EVIDENCE_prd31 F-A |
| SCOPE-3.F52 | PRD-31 permission_level_profiles seeded (164 rows) but never surfaced | Low | N | Fix Next Build | EVIDENCE_prd31 F-B |
| SCOPE-3.F53 | PRD-31 feature_access_v2 schema drift from PRD spec | Low | N | Intentional-Update-Doc | EVIDENCE_prd31 F-C |
| SCOPE-3.F54 | PRD-31 monetization engine entirely unbuilt at server layer (cascade Scope 3) | Medium | N | Deferred-Document | EVIDENCE_prd31 F-D |
| SCOPE-3.F55 | PRD-31 founding override missing onboarding-complete clause in RPC | Low | N | Fix Next Build | EVIDENCE_prd31 F-E |
| SCOPE-3.F56 | PRD-31 founding_rate columns missing from family_subscriptions | Low | N | Fix Next Build | EVIDENCE_prd31 F-F |
| SCOPE-3.F57 | PRD-34 ThoughtSift implementation drift bundle | Low-Medium | N | Fix Next Build | EVIDENCE_prd34 F-D |
| SCOPE-3.F58 | PRD-36 engine wired, cross-PRD integration dispatched to void (consolidated) | Medium | N | Fix Next Build | EVIDENCE_prd36 F-A |
| SCOPE-3.F59 | PRD-36 timer completion-side integrations partially wired | Low | N | Fix Next Build | EVIDENCE_prd36 F-B |
| SCOPE-3.F60 | PRD-36 FloatingBubble z-35 below BottomNav z-40 | Low | N | Fix Next Build | EVIDENCE_prd36 F-D |
| SCOPE-3.F61 | PRD-17B mindsweep-sort 6 seams consolidated (seams 1, 2, 4, 7, 9, 12, 13, 14) | Medium | N | Fix Next Build | EVIDENCE_prd17b consolidated |
| SCOPE-3.F62 | PRD-14D Hub widget_grid section registered but returns null | Medium | N | Fix Next Build | EVIDENCE_prd14d F-C |
| SCOPE-3.F63 | PRD-14D PerspectiveSwitcher overgrants to special_adult (Family Overview + Hub) | Medium | N | Fix Next Build | EVIDENCE_prd14d F-B |
| SCOPE-3.F64 | PRD-19 4 core tables absent (member_documents, guided_interview_progress, monthly_aggregations, generated_reports) | High | N | Deferred-Document | EVIDENCE_prd19 F-B |
| SCOPE-3.F65 | PRD-19 general lila-chat doesn't load private_notes/relationship_notes | Low | N | Fix Next Build | EVIDENCE_prd19 F-C |
| SCOPE-3.F66 | PRD-19 family_context_interview model-tier drift + no UI entry (cross-ref SCOPE-3.F5) | Low | N | Fix Next Build | EVIDENCE_prd19 F-D |
| SCOPE-3.F67 | PRD-21A MemberAssignmentModal writes `is_granted`/`granted_by` to dropped columns | High | Y | Fix Now | EVIDENCE_prd21a F-A |
| SCOPE-3.F68 | PRD-21A Optimizer integration unbuilt at server layer | Low | N | Deferred-Document | EVIDENCE_prd21a F-B |
| SCOPE-3.F69 | PRD-21A Vault browse has zero role-/tier-based filtering (teen-visible SCOPE-8b primary via 1A) | Medium | Y (teen-filter subset) | Fix Next Build | EVIDENCE_prd21a F-C |
| SCOPE-3.F70 | PRD-21A vault_tool_sessions tracking unwired | Low | N | Fix Next Build | EVIDENCE_prd21a F-D |
| SCOPE-3.F71 | PRD-21A minor wire-up polish (Personal Prompt Library sidebar, copy rate limit, role filter) | Low | N | Fix Next Build | EVIDENCE_prd21a F-E |
| SCOPE-3.F72 | PRD-21C entire PRD deferred (cross-ref 4) | Low | N | Deferred-Document | EVIDENCE_prd21c F-A |

**Estimated SCOPE-3 total:** 72 findings pre-consolidation. Post-consolidation per §6 decisions: **~35–45 SCOPE-3 findings** (some F-lines above merge further).

### §7.3 Deferred-to-Gate-4 stubs (reference entries in AUDIT_REPORT appendix)

| Stub | Cross-ref | Evidence |
|---|---|---|
| PRD-20 Safe Harbor | SCOPE-8a.F3 | EVIDENCE_prd20 |
| PRD-30 Safety Monitoring | SCOPE-8a.F3 | EVIDENCE_prd30 |
| PRD-32/32A Admin Console | SCOPE-8a.F1 | EVIDENCE_prd32-32a |
| PRD-37/PRD-28B Compliance seam | Scope 5 Finding A | EVIDENCE_prd37-prd28b |
| PRD-27 Caregiver Tools | **NEW — recommend add to Round 0** | EVIDENCE_prd27 F-B |
| PRD-29 BigPlans | **NEW — recommend add to Round 0** | EVIDENCE_prd29 F-A |

### §7.4 Appendix C (Beta Readiness) expected updates

- 15 SCOPE-8b findings tagged Beta Y
- 4 SCOPE-3 findings tagged Beta Y (PRD-14B .ics CHECK, PRD-28 first allowance period, PRD-21A MemberAssignmentModal broken write, PRD-21A teen-vault-filter)
- = 19 Beta Readiness index entries from Scope 3+8b

Total Beta Readiness index growth from Scope 3+8b: 19 entries across §3 of the report.

---

## §8 — Walk-through checklist for founder session

Before walk-through begins, orchestrator confirms:

- [ ] Founder has read §0 + §6 summary (decision prompts 1–15)
- [ ] Founder has budgeted ~60–90 min for pattern-level adjudication
- [ ] Orchestrator has PLAN.md + DECISIONS.md open for reference
- [ ] Each decision verdict is captured in DECISIONS.md in a single consolidated Round or per-decision Round entries (founder preference)

After walk-through:

- [ ] §7.1 + §7.2 final finding list regenerated with founder's verdicts
- [ ] Apply-phase worker prompt drafted (per PLAN §8)
- [ ] Archive plan confirmed

---

## §9 — Orchestrator notes + open questions

1. **F11 severity split (Decision 1 above):** If founder prefers ONE consolidated finding instead of two (1A pattern + 1B standalone), the Mediator Full Picture concrete example can be the lede paragraph of the consolidated finding.

2. **PRD-27 and PRD-29 Deferred list addition:** If accepted, EVIDENCE_prd27 F-B (the structural "PRD-27 unbuilt" consolidation of 6 seams) and EVIDENCE_prd29 F-A (the PRD-29 structural consolidation) collapse to one-line cross-references rather than standalone findings. Saves ~10 finding emissions.

3. **PRD-14B `.ics` CHECK violation (Decision 5):** My recommendation escalates this specific seam from the pattern to a standalone Beta-Y finding because it's a runtime-throwing CHECK violation, not just silent drift. If founder prefers to keep it folded into the pattern, downgrade severity from Beta Y to Beta N.

4. **SCOPE-8b count** (15) slightly exceeds PLAN §5.4 expectation of 8–15. If founder wants tighter bundling, 1D + 1E can be merged into a single "broken safety promise" finding (drops count to 14). Alternatively 1A + 1B stay split and count goes to 16.

5. **Global addenda observations** (pattern #1-#3 in EVIDENCE_global-addenda) could emit as three process-hygiene recommendations in Appendix or as `Intentional-Update-Doc` items for future addendum-writing habits. My recommendation: note in Appendix, don't emit as findings (they're about the audit process, not code).

6. **Archive pattern:** Scope 5 + Scope 8a archives are at `.claude/completed-builds/scope-5-evidence/` and `.claude/completed-builds/scope-8a-evidence/`. Scope 3+8b should follow same pattern: `.claude/completed-builds/scope-3-8b-evidence/` after apply-phase lands.
