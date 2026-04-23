# TRIAGE_WORKSHEET.md

> **Phase 3 Triage — Gate 1 exit artifact.**
> **Source:** [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md) (153 F-numbered finding rows across 7 scopes; 146 unique findings per report self-description — F60 split into a/b/c adds 2 rows; F64/F65 skipped in numbering). **+ 2026-04-21 founder additions:** SCOPE-4.F8 split into F8a/F8b (Recon-1 verdict); 4 new findings (NEW-A BookShelf mode dedup, NEW-B General mode removal, NEW-C on-task audit, NEW-D Faith Ethics audit); 1 capture-only task (NEW-E local-LLM stub). Net delta: +6 rows.
> **Parallel artifacts (not indexed here):** Scope 6 → [LILA_KNOWLEDGE_BACKLOG.md](LILA_KNOWLEDGE_BACKLOG.md) (43 entries, all pre-classified **Defer-to-Gate-4**). Scope 7 → [PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md) (81 rows, informational-only).
> **Gameplan reference:** [MYAIM_GAMEPLAN_v2.2.md §361-381](MYAIM_GAMEPLAN_v2.2.md#L355) (Phase 3 definition + Gate 1 exit criteria).

## Status

- **Total rows:** 183
- **Beta Readiness blockers:** 27 (22 from Appendix C + 5 from 2026-04-21 founder additions: SCOPE-4.F8a, NEW-A, NEW-B, NEW-C, NEW-D; NEW-K downgraded Y->N per founder 2026-04-22)
- **Wizard-design-impacted (from Appendix B):** 21
- **Founder-decision-required at emission:** 3 rows (SCOPE-8a.F1, F2, F3 — all Beta blockers)
- **Pre-classified `Closed/Resolved` (no triage needed):** 4 (SCOPE-1.F3, F4, F5; SCOPE-5.F4)

### Proposed classification distribution

> All classifications in the Proposed column are Claude's draft based on the finding's own "Proposed resolution" field. Tenise adjudicates each row in Session 2; nothing locks without her.

| Proposed class | Count |
|---|---|
| Fix Next Build | 98 |
| Intentional-Update-Doc | 38 |
| Defer-to-Gate-4 | 23 |
| Fix Now | 11 |
| Closed/Resolved | 5 |
| Fix Now (+compound) | 2 |
| Tech Debt | 2 |
| Fix Code | 2 |
| Informational | 1 |
| Capture-only | 1 |

### Severity distribution

| Severity | Count |
|---|---|
| Blocking | 6 |
| High | 21 |
| Medium | 71 |
| Low | 85 |

---

## Worksheet

**Columns:** # · Finding ID · Scope · Sev · Beta · Wiz · Proposed · Founder decision · Worker · Blocked-by · Notes

**Ordering:** Beta=Y first, then Blocking → High → Medium → Low within each block. Session 2 walks rows top-down.

| # | Finding ID | Scope | Sev | Beta | Wiz | Proposed | Founder decision | Worker | Blocked-by | Title / founder note |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | SCOPE-8a.F1 | 8a | Blocking | Y |  | Fix Now | **LOCKED** Fix Now |  | SCOPE-2.F1, SCOPE-2.F48 | PRD-40 COPPA compliance infrastructure entirely unbuilt |
| 2 | SCOPE-8a.F2 | 8a | Blocking | Y |  | Fix Now | **LOCKED** Fix Now |  | SCOPE-8a.F1 | Privacy-data-lifecycle incomplete — export, deletion, voice retention |
| 3 | SCOPE-8a.F3 | 8a | Blocking | Y |  | Fix Now | **LOCKED** Fix Now — sub-sequence PRD-41→PRD-20→PRD-30 encoded in FIX_NOW_SEQUENCE.md v4 |  |  | PRD-20 Safe Harbor + PRD-30/PRD-41 Safety Monitoring entirely unbuilt |
| 4 | SCOPE-8a.F6 | 8a | Blocking | Y |  | Fix Now | **LOCKED** Fix Now |  |  | DailyCelebration auto-persists AI celebration narrative with no HITM |
| 5 | SCOPE-8b.F1 | 8b | Blocking | Y |  | Fix Now (+compound) | **LOCKED** Fix Now (+compound) |  |  | Edge Functions authenticate but do not authorize (13 surfaces including cross-family Mediator Full Picture dat |
| 6 | SCOPE-8b.F5 | 8b | Blocking | Y |  | Fix Now | **LOCKED** Fix Now |  |  | Crisis Override missing in 3 Edge Functions (message-coach, auto-title-thread, bookshelf-discuss) |
| 7 | NEW-A | BookShelf | High | Y |  | Fix Next Build | **LOCKED** Fix Next Build |  |  | book_discuss vs book_discussion mode_key duplication audit (BookShelf) — canonical mode ID + deprecation + PRD-23 update — _Added 2026-04-21. Two distinct mode_keys same parent_mode + same system_prompt_key. Surface every reference across code/prompts/UI/Edge Fns/tests/migrations/seeds/PRDs. Identify canonical, deprecate duplicate, verify no UI silently launches wrong mode. Dispatch as focused single-worker Claude Code mini-audit. BookShelf instability during beta surfaces bugs to families._ |
| 8 | NEW-B | LiLa UI | High | Y |  | Fix Now | **LOCKED** Fix Now — PRD-05 addendum required |  | Recon-2 complete (RECON_GENERAL_MODE_SURFACES.md); drawer default = Assist per founder | Remove General mode from user-facing surfaces; preserve technical fallback; drawer default = Assist (with routing-concierge system prompt enhancement) — _Updated 2026-04-22 per founder. Drawer default = Assist (teaching-how-the-app-works mode, Haiku) per ai_patterns.md canonical role. Recon-2 (RECON_GENERAL_MODE_SURFACES.md) found 10 user-facing General-mode surfaces; remove all (drawer default, mode switcher entry, Lanterns Path CTAs, conversation history filter chip, MomShell indirect paths). Technical fallback for modal contracts stays (general mode row stays in lila_guided_modes; PRD-05 Sitting LiLa spec preserved, hidden until local-LLM future per NEW-E). Assist system prompt enhancement: detect bug/broken/troubleshooting language -> redirect to Help. PRD-05 addendum required._ |
| 9 | SCOPE-3.F14 | 3 | High | Y | Y | Fix Next Build | **LOCKED** Fix Next Build — coord w/ NEW-W |  |  | PRD-28 first allowance_periods row never created (allowance non-operational at first-use) |
| 10 | SCOPE-3.F41 | 3 | High | Y | Y | Fix Now | **LOCKED** Fix Now |  |  | PRD-21A MemberAssignmentModal writes `is_granted`/`granted_by` to dropped columns (broken write) |
| 11 | SCOPE-4.F4 | 4 | High | Y |  | Fix Code | **LOCKED** Fix Code — Artifact A (PRD-34 addendum) + Artifact B (CLAUDE.md convention + PRD-32 Admin Console section) pre-sprint |  | Convention 247, Convention 248 (landed 2026-04-21); Artifact A + Artifact B must land BEFORE Wave 1B Board sprint | Board of Directors persona cache architecture defect — cross-family persona leak potential — _Reclassified 2026-04-21 per founder. AI classifier personal-vs-community routing; community-relevant routes to PRD-32 Admin Console approval queue; approved personas enter shared cache. PRD-34 addendum required._ |
| 12 | SCOPE-4.F8a | 4 | High | Y |  | Fix Now | **LOCKED** Fix Now |  | SCOPE-4.F4 (consolidated Board sprint) | is_privacy_filtered hard-constraint bypass in Decision Guide + Board of Directors — _Split from SCOPE-4.F8 2026-04-21. Privacy hard-constraint violation per Convention 76 / PRD-13. Paired with Phase 0.26 Session 3 privacy filter work._ |
| 13 | SCOPE-8b.F10 | 8b | High | Y |  | Fix Next Build | **LOCKED** Fix Next Build |  |  | PRD-16 dad meeting permission gate absent (useCreateMeeting does NO member_permissions check) |
| 14 | SCOPE-8b.F11 | 8b | High | Y |  | Fix Now | **LOCKED** Fix Now |  | SCOPE-3.F2 | PRD-27 shift_sessions/time_sessions bifurcation (live data gap; 2 live rows in production) |
| 15 | SCOPE-8b.F12 | 8b | High | Y |  | Fix Next Build | **LOCKED** Fix Next Build |  |  | PRD-15 messaging safety semantics enforced client-side only (consolidated 4 sub-surfaces) |
| 16 | SCOPE-8b.F13 | 8b | High | Y |  | Fix Next Build | **LOCKED** Fix Next Build |  |  | PRD-31 server-side subscription tier enforcement absent (47 Edge Functions ungated) |
| 17 | SCOPE-8b.F2 | 8b | High | Y |  | Fix Next Build | **LOCKED** Fix Next Build |  |  | HITM gate bypassed on PRD-21 `communication_drafts` persist |
| 18 | SCOPE-8b.F3 | 8b | High | Y |  | Fix Next Build | **LOCKED** Fix Next Build — folds into Row 11 consolidated sprint |  |  | HITM gate bypassed on PRD-34 `board_personas` generation |
| 19 | SCOPE-8b.F4 | 8b | High | Y | Y | Fix Next Build | **LOCKED** Fix Next Build — coord commit w/ SCOPE-3.F9 |  |  | Documented user-controlled accountability/privacy silently unenforceable (5 surfaces) |
| 20 | SCOPE-8b.F6 | 8b | High | Y |  | Fix Next Build | **LOCKED** Fix Next Build |  |  | PRD-17B auto-sweep silently a no-op (marquee "wake up to sorted items" promise unimplemented) |
| 21 | SCOPE-8b.F7 | 8b | High | Y |  | Fix Now | **LOCKED** Fix Now |  |  | PRD-14B `.ics` import CHECK violation (runtime failure on marquee import feature) |
| 22 | SCOPE-8b.F8 | 8b | High | Y |  | Fix Next Build | **LOCKED** Fix Next Build — cron coord w/ Wave 4 COPPA |  |  | PRD-22 `account_deletions` GDPR right-to-erasure unenforced |
| 23 | SCOPE-8b.F9 | 8b | High | Y |  | Fix Next Build | **LOCKED** Fix Next Build |  |  | PRD-16 meeting impressions privacy unenforced (Convention #232 enforced only by SQL comment) |
| 24 | NEW-C | LiLa prompts | Medium | Y |  | Fix Next Build | **LOCKED** Fix Next Build — paired w/ NEW-D (single worker) |  |  | On-task enforcement audit across all specialized LiLa modes (cost-abuse prevention) — pair with NEW-D — _Added 2026-04-21. Cost abuse pattern: user opens specialized tool (Board, Translator, Cyrano, etc.) then asks for general coding help. Audit every specialized mode system prompt for: narrow purpose definition, off-purpose redirect language, suggest-different-tool language. Pair with NEW-D Faith Ethics guardrail audit — same file pass._ |
| 25 | NEW-D | LiLa prompts | Medium | Y |  | Fix Next Build | **LOCKED** Fix Next Build — paired w/ NEW-C (single worker) |  |  | Faith Ethics + LiLa core guardrail coverage audit across all 43 lila_guided_modes system prompts — _Added 2026-04-21. Classic Looks-Fine-Failure at prompt-authoring layer. Verify every mode prompt embeds: processing partner framing, bridge-to-human, auto-reject categories (force/coercion/manipulation/shame/withholding), crisis override, faith context handling. Defense-in-depth with PRD-41 platform-wide output validation. Pair with NEW-C._ |
| 26 | SCOPE-8a.F5 | 8a | Medium | Y |  | Fix Now (+compound) | **LOCKED** Fix Now (+compound) — folds into Row 11 Board sprint (W1B) |  |  | Board of Directors content policy has fail-open defects |
| 27 | SCOPE-3.F22 | 3 | Low | Y |  | Fix Now | **LOCKED** Fix Now |  |  | Play shell "Fun" tab 404 (/rewards route missing) |
| 28 | NEW-G | Lists | High | N |  | Fix Next Build | **LOCKED SPLIT** — (a) Convention 70 text amendment = **Fix Now** (W1 fast commit, CLAUDE.md only, no PRD-09B changes); (b) full PRD-09B amendment + studio-seed-templates.md + 4-properties formalization = **Fix Next Build**, bundled w/ SCOPE-2.F27 under single worker. Edge: (a) → (b). Re-review flagged draft `claude/feature-decisions/opportunity-list-unification-plan.md` post-(a). |  |  | Opportunity Board dissolves into Lists page; is_opportunity is list-level; Convention 70 amendment; Lists page primitive spec — _Severity BUMPED Medium->High 2026-04-22 per founder — Convention 70 contradicts schema, actively misleading Claude Code. Doc §1.1 + §1.2 + draft notes 5, 20, 23, 33. PRD-09B + Convention 70 + studio-seed-templates.md._ |
| 29 | SCOPE-1.F3 | 1 | High | N |  | Closed/Resolved | **LOCKED** Closed/Resolved — AURI operational, post-fix connection verified 2026-04-23 |  |  | AURI retroactive scan blocked on first-call OAuth in fresh session — RESOLVED 2026-04-18 |
| 30 | SCOPE-1.F5 | 1 | High | N |  | Closed/Resolved | **LOCKED** Closed/Resolved — same resolution as SCOPE-1.F3 |  |  | AURI retroactive scan — RESOLVED 2026-04-18 |
| 31 | SCOPE-4.F1 | 4 | High | N |  | ~~Intentional-Update-Doc~~ **Fix Code (Unintentional)** | **LOCKED** Fix Code, W1 (Fix Now). Founder green-lit scope 2026-04-20: (a) migration adding `embedding halfvec(1536)` + HNSW + trigger on `archive_context_items`; (b) backfill 173 rows; (c) structured logging on `mindsweep-sort/index.ts:129-156` silent catch + `ai_parse` feature_key split. W1 placement rationale: telemetry-blindness compounds; Convention-70-analogue contract drift at metric layer. |  |  | `archive_context_items` missing `embedding` column silently breaks MindSweep embedding-first classification en |
| 32 | NEW-AA | Reveals | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — **NEW-AA worker scope: NEW-AA + SCOPE-2.F61 + SCOPE-2.F62 (3 rows)** — reveals as universal wrappers + connector architecture. F60c + F58 separate workers. |  |  | Reveals as universal presentation wrappers; reveal-as-task-presentation connector formalized across PRD-24 family — _Doc §1.3 + draft note 34. PRD-24/24A/24B addendum. Coordinates with SCOPE-2.F61 + SCOPE-2.F62._ |
| 33 | NEW-BB | Tier | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — pool |  |  | Tier-assignment chart as single source of truth; feature code references chart, never hardcodes tier names — _Doc §1.7 + draft note 35. Covered by Convention 256. Additive to existing tier infrastructure (feature_access_v2, feature_key_registry)._ |
| 34 | NEW-CC | Documentation | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — **separate follow-on worker** AFTER PRD-09B bundle lands (derives matrix from final property text) |  | PRD-09B bundle worker | Document the supported composition matrix (presentation_mode x is_opportunity x advancement_mode x draw_mode x pick_n); schema permits all combinations, no convention names them — _Added 2026-04-22 per founder context. CLAUDE.md convention + PRD-09B addendum + WIRING_STATUS.md composition matrix table. Converts doc §1.5 prose examples into formal reference._ |
| 35 | NEW-H | Segments | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — separate worker (PRD-25+PRD-26+PRD-09A, not PRD-09B bundle) |  |  | Segment primitive: always-on-collapsible default OR scheduled; exists across all shells — _Doc §1.1 + draft note 6. PRD-25 + PRD-26 + PRD-09A amendments._ |
| 36 | NEW-K | NLC | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — **post-Gate-2 flagship**, NOT in Gate 1 execution pool. Reaffirmed per FIX_NOW_SEQUENCE v3. |  | Gate 2 wizards | Natural Language Composition — first-class front-door entry point (Haiku compose, HITM approval) — _Doc §2.9 + draft note 11. Beta flag N per founder 2026-04-22 pragmatic read: beta cohort is invite-only/feedback-oriented; NLC depends on Gate 2 wizards; becomes post-Gate-2 flagship / Phase 5 headline, not beta blocker. PRD-05 + PRD-08 + Studio._ |
| 37 | NEW-L | Cross-cut | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — **audit-first row** (inventory surfaces before implementation); separate worker |  |  | Bulk-AI-Add deployment gap audit — inventory every creation surface; deploy where missing — _Doc §2.5 + draft note 12. Capability built universally; deployment coverage is the gap. Tracked by Convention 252._ |
| 38 | NEW-N | Milestone | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — single worker; **shared-language preamble first** (authoring doc defining is_milestone + Milestone Map semantics), then amend each of 8 PRDs to reference the preamble. Not 8 isolated redefinitions. |  |  | is_milestone property + Milestone Map surface (universal, Level 1 witnessed + Level 2 completion receipts) — _Doc §1.2 + §1.3 milestone-to-Milestone-Map connector + draft note 16. 8-PRD addenda: PRD-05, PRD-08, PRD-09A, PRD-09B, PRD-11, PRD-12A/B, PRD-37, PRD-28B._ |
| 39 | NEW-O | Tracking | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — single worker; **same shared-preamble-then-amend structure as NEW-N** (tracking_tags semantics authored once, PRDs reference the preamble) |  |  | tracking_tags property + Finished Products composition pipeline — _Doc §1.2 + §1.7 + draft note 17. Cross-cutting — every content-producing PRD addendum + PRD-28B consumer spec._ |
| 40 | NEW-P | Tracker | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — **multi-PRD home:** PRD-28 (data, `reading_log_entries` or extension of `homeschool_time_logs`) + PRD-10 (widget/visual/aggregation views/multi-member log UX) + PRD-09A (linked-routine-step "floor not ceiling"). Separate worker from PRD-09B bundle. Precedent: `homeschool_time_logs` pattern already in PRD-28 and consumed by PRD-28B (verified 2026-04-23). |  |  | Reading Tracker primitive (separate from BookShelf; general reading log, all-role log entries) — _Doc §1.1 + draft note 18. PRD-28 or PRD-10 addendum._ |
| 41 | NEW-Q | Products | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — PRD-28B scope expansion; cross-refs SCOPE-2.F22 (Row 52, now locked) |  |  | Finished products inventory expansion (Homeschool Transcript, Year-End Memory Books, Child Growth Portrait, Family Vision Statement, etc.) — _Doc §1.7 + draft note 19. PRD-28B scope expansion; cross-ref SCOPE-2.F22._ |
| 42 | NEW-R | Studio | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — pool |  |  | Drafts + Customized as explicit Studio pages; Drafts->Customized deployment flow; Customized items remain editable — _Doc §1.1 + §2.2 + draft note 21. Studio Intelligence Addendum amendment. Convention 250 captures the rule; this row tracks the build._ |
| 43 | NEW-T | Connectors | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — **bundled** w/ PRD-09B worker (NEW-G(b)+F27+F+T+V+Y+I+X, 8 rows) |  | NEW-G(a) Convention 70 fast-commit | Linked list items connector (item-level, analogous to linked-routine-step) — _Doc §1.3 + draft note 25. PRD-09B amendment. Enables compositions like Ruthie Reading Time._ |
| 44 | NEW-W | Allowance | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build pool slot — **SCOPE-3.F14 is hard pre-req** (F14 W1 bootstrap lands first); NEW-W sequences AFTER F14 lands, does NOT ship in F14 W1 commit |  | SCOPE-3.F14 | counts_toward_allowance extended to Segments + dedup at calculation layer — _Doc §1.2 + draft note 29. PRD-28 amendment. Coordinate with SCOPE-3.F14 (already Beta Y allowance bootstrap)._ |
| 45 | NEW-X | Assignment | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — **bundled** w/ PRD-09B worker |  | NEW-G(a) Convention 70 fast-commit | Assignment mode (Shared / Per-person) formalized at all levels: single tasks, list items, list-level defaults, lists with rosters — _Doc §1.2 + draft note 30. PRD-09A + PRD-09B amendments._ |
| 46 | NEW-Z | Dashboards | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — separate worker (PRD-09B+PRD-10, not folded into bundle) |  |  | display_on_dashboard per-member + dashboard_display_mode (full/truncated/collapsed) properties on lists — _Doc §1.2 + draft note 32. PRD-09B + PRD-10 amendments._ |
| 47 | SCOPE-1.F1 | 1 | Medium | N |  | Intentional-Update-Doc | **LOCKED** Intentional-Update-Doc (silent approve) — matches audit; single-artifact tool-recipe + LESSONS_LEARNED entry |  |  | TOOL_HEALTH_REPORT_2026-04-16 F1 AURI recipe is wrong for Developer Edition |
| 48 | SCOPE-1.F4 | 1 | Medium | N |  | Closed/Resolved | **LOCKED** Closed/Resolved — known-bucket (Convention 242 inversion landed as commit during audit window, overtaking original Intentional-Update-Doc proposal). Criterion (g) surfaced for verification only — not drift. |  |  | Convention 242 inverted mid-audit: mgrep-primary to grep-primary |
| 49 | SCOPE-2.F1 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build **Wave 0** — webhook-only scope (NOT full PRD-31 monetization). COPPA Stripe webhook prerequisite. Reclassified 2026-04-21 Defer-to-Gate-4→Fix Next Build per founder COPPA unblocking. |  | SCOPE-8a.F1 (W4) blocked by this | PRD-31 tier monetization infrastructure unbuilt — _Reclassified 2026-04-21 — Wave 4 COPPA framework prerequisite (Stripe webhook). Moved out of Defer-to-Gate-4._ |
| 50 | SCOPE-2.F11 | 2 | Medium | N |  | Defer-to-Gate-4 | **LOCKED** Defer-to-Gate-4 (silent approve) — architectural doc drift; no unlocked upstream |  |  | PRD-05 context assembly architecture wrapping drift — 3-layer framework wraps 8 PRD concepts |
| 51 | SCOPE-2.F19 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — single PRD-11B, matches audit |  |  | PRD-11B Family Celebration unbuilt — STUB_REGISTRY L120 false-Wired claim |
| 52 | SCOPE-2.F22 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — single PRD-19, matches audit; NEW-Q cross-refs this row |  |  | PRD-19 reports + aggregation pipeline unbuilt — near-term 2–3 month roadmap |
| 53 | SCOPE-2.F27 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — **bundled** w/ PRD-09B worker (8-row bundle: NEW-G(b)+F27+NEW-F+T+V+Y+I+X). Bundle inclusion confirmed. |  | NEW-G(a) Convention 70 fast-commit | PRD-09B list type catalog — codify 5 extras with documented use cases — _Scope expanded 2026-04-22: was "codify 5 extras" — now "formalize 4 independent list-behavior properties (presentation_mode, is_browsable, is_opportunity, pick_n) + add maintenance/consequences/records list_types + Lists page primitive + Opportunity Board dissolves." Severity bumped Low->Medium. See Composition Architecture doc §1.1 + §1.2._ |
| 54 | SCOPE-2.F29 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — single PRD-17B MindSweep |  |  | PRD-17B MindSweep auto-seed contract unmet — group with halfway-state completion bucket |
| 55 | SCOPE-2.F3 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — single PRD-02; **ESCALATED priority** per audit (founding-family onboarding) |  |  | PRD-02 access-level picker missing — signature founding-family onboarding moment |
| 56 | SCOPE-2.F34 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — single PRD-14B |  |  | PRD-14B AI intake unbuilt — near-term build priority per founder direction |
| 57 | SCOPE-2.F36 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — single PRD-25 |  |  | PRD-25 Guided LiLa Tools unbuilt — active kid demand elevates priority |
| 58 | SCOPE-2.F39 | 2 | Medium | N |  | Fix Next Build | **LOCKED SPLIT** — (a) Convention #141 amendment = **Fix Now** (CLAUDE.md text pointing to 3-state observation/private model per PRD-15 spec); (b) PRD-15 messaging-visibility work = **Fix Next Build**. Edge: (a) → (b). Same NEW-G split pattern. |  | (b) blocked by (a) fast-commit | PRD-15 mom-visibility architecture — three-state observation/private model supersedes Convention #141 strict p |
| 59 | SCOPE-2.F40 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build **Wave 1** — pulled forward from W2 per founder 2026-04-23. Not architecturally dependent on SCOPE-8b.F5 (different pipeline layers); calendar-slotted grouping only. Safety-alert DND bypass is mom-first critical — silent suppression is exactly the failure mode this fix prevents. |  |  | PRD-15 DND non-safety suppression unwired |
| 60 | SCOPE-2.F43 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — single PRD-16 notification enum |  |  | PRD-16 notification enum additions missing from migration 100146 — `completeMeeting.ts` workaround mis-categor |
| 61 | SCOPE-2.F45 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — single PRD-21 |  |  | PRD-21 AI Toolbox sidebar restoration |
| 62 | SCOPE-2.F48 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build **Wave 0** — minimum-scope: approval-queue UI route + admin auth gate. Do NOT expand to full PRD-32 during beta build. Dual-purpose prereq (COPPA + SCOPE-4.F4). |  | SCOPE-8a.F1 (W4) + SCOPE-4.F4 (W1B) blocked by this | PRD-21B Admin Console unbuilt — beta-deferred per F1/F9/F19 pattern — _Reclassified 2026-04-21 — Wave 4 COPPA prerequisite + SCOPE-4.F4 approval-queue host. Dual-purpose dependency._ |
| 63 | SCOPE-2.F49 | 2 | Medium | N |  | Defer-to-Gate-4 | **LOCKED** Defer-to-Gate-4 (silent approve) — upstream: "app worth subscribing to" threshold per founder F1 direction; still deferred |  |  | PRD-21C Vault Engagement layer unbuilt — mom-only commenting privacy posture preserved |
| 64 | SCOPE-2.F50 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — single PRD-22 |  |  | PRD-22 Settings overlay + embeds deferred — mom-should-not-lose-her-place UX |
| 65 | SCOPE-2.F58 | 2 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — **separate worker** (not in NEW-AA bundle, not in F60c). Independent PRD-24 reward economy scope. ESCALATED-priority annotation adjudication deferred to worker dispatch (financial-correctness adjacency). |  |  | PRD-24 reward economy unbuilt — near-term lego-piece connector |
| 66 | SCOPE-2.F60b | 2 | Medium | N |  | Defer-to-Gate-4 | **LOCKED** Defer-to-Gate-4 (silent approve) — "pause, maybe never" per founder; no upstream row, timeline-driven |  |  | PRD-24A overlay engine deferred indefinitely — pause, maybe never |
| 67 | SCOPE-2.F60c | 2 | Medium | N | Y | Fix Next Build | **LOCKED** Fix Next Build — **separate worker**, sequences AFTER NEW-AA worker lands (reads NEW-AA reveal-wrapper decisions as input) |  | NEW-AA worker | PRD-24A themes + game modes + Game Modes Addendum tables on active roadmap |
| 68 | SCOPE-2.F61 | 2 | Medium | N | Y | Fix Next Build | **LOCKED** Fix Next Build — **bundled** into NEW-AA worker (NEW-AA+F61+F62, 3 rows) |  |  | PRD-24B reveal library needs cross-feature lego wiring |
| 69 | SCOPE-2.F62 | 2 | Medium | N | Y | Fix Next Build | **LOCKED** Fix Next Build — **bundled** into NEW-AA worker |  |  | PRD-24B Color Reveal needs fuller lego-connector architecture |
| 70 | SCOPE-2.F66 | 2 | Medium | N |  | Defer-to-Gate-4 | **LOCKED** Defer-to-Gate-4 (silent approve) — Enhanced-tier flagship build timeline; still deferred, no upstream unlocked row |  |  | PRD-27 Caregiver Tools unbuilt — Enhanced-tier flagship |
| 71 | SCOPE-2.F67 | 2 | Medium | N |  | Defer-to-Gate-4 | **LOCKED** Defer-to-Gate-4 (silent approve) — Enhanced-tier flagship build timeline; still deferred |  |  | PRD-29 BigPlans unbuilt — Enhanced-tier flagship |
| 72 | SCOPE-2.F68 | 2 | Medium | N |  | Defer-to-Gate-4 | **LOCKED** Defer-to-Gate-4 (silent approve) — pairs with PRD-28B build-order; PRD-28B remains unbuilt (no dedicated worksheet row). **Freshness check:** NEW-Q (Row 41, locked Fix Next Build) expands PRD-28B scope but does NOT unblock F68's PRD-28B build dependency. Defer still valid. |  |  | PRD-37 Family Feeds unbuilt — pair with PRD-28B build-order |
| 73 | SCOPE-2.F69 | 2 | Medium | N |  | Defer-to-Gate-4 | **LOCKED** Defer-to-Gate-4 (silent approve) — pre-paid-launch prerequisite; still deferred |  |  | PRD-38 Blog (Cookie Dough & Contingency Plans) unbuilt — pre-paid-launch prerequisite |
| 74 | SCOPE-2.F9 | 2 | Medium | N |  | Defer-to-Gate-4 | **LOCKED** Defer-to-Gate-4 (silent approve) — "app worth subscribing to" threshold; still deferred. Downstream F52+F53 in Gate 4 parking (already consistent). |  |  | PRD-05C LiLa Optimizer infrastructure unbuilt |
| 75 | SCOPE-3.F1 | 3 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — cross-cutting DB hygiene pass (7+ columns, CHECK constraints); matches audit |  |  | Source/enum discipline drift pattern (7+ columns freeform TEXT with missing CHECKs) |
| 76 | SCOPE-3.F19 | 3 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — single BookShelf-handoffs-worker pass (Guiding Stars, Tasks, Journal Prompts, etc.) |  |  | PRD-23 BookShelf 5 outbound handoffs partially built + cross-PRD addendum schema drift |
| 77 | SCOPE-3.F2 | 3 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build **Wave 0** — spec amendment first, then TS consolidation. Blocks SCOPE-8b.F11 (W2, locked). |  | SCOPE-8b.F11 blocked by this | PRD-35 schedule vocabulary drift (4 incompatible vocabularies + 2 RecurrenceDetails TS types) |
| 78 | SCOPE-3.F20 | 3 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — single PRD-25 bundle worker |  |  | PRD-25 Guided cross-feature integrations ship as UI-visible placeholders (consolidated PRD-25 bundle) |
| 79 | SCOPE-3.F26 | 3 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — coordinate w/ PRD-15 messaging readiness (Send via Message surface) |  |  | PRD-21 4 integration surfaces scaffolding only (Higgins Navigate skill save + AI Toolbox sidebar + Send via Me |
| 80 | SCOPE-3.F27 | 3 | Medium | N |  | Fix Next Build | **LOCKED** Fix Next Build — bundled PRD-22 consumer-gaps pass |  |  | PRD-22 infrastructure consumer gaps bundle |
| 81 | SCOPE-3.F29 | 3 | Medium | N |  | Intentional-Update-Doc |  |  |  | PRD-24A overlay-engine architecture entirely superseded by Build M |
| 82 | SCOPE-3.F3 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-35 scheduler output broken semantics (completion-dependent + alternating-weeks + buildTaskScheduleFields) |
| 83 | SCOPE-3.F30 | 3 | Medium | N | Y | Fix Next Build |  |  |  | PRD-24B superseded architectures: flat Reveal Type Library → reveal_animations style_category + Color-Reveal → |
| 84 | SCOPE-3.F32 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-29 BigPlans surface-level drift: guided-mode taxonomy (4 addendum vs 5 seeded) + 5 BigPlans feature keys r |
| 85 | SCOPE-3.F33 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-31 tier enforcement wire-up bundle (useCanAccess/PermissionGate adoption + permission_level_profiles + fea |
| 86 | SCOPE-3.F34 | 3 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-31 monetization engine entirely unbuilt at server layer (Stripe webhook + tier enforcement cascade) |
| 87 | SCOPE-3.F36 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-36 cross-PRD integration bundle (engine wired but cross-PRD integration dispatched to void + timer complet |
| 88 | SCOPE-3.F37 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-17B mindsweep-sort 6 seams consolidated (seams 1, 2, 4, 7, 9, 12, 13, 14) |
| 89 | SCOPE-3.F38 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-14D dashboard architecture gaps (Hub widget_grid section + PerspectiveSwitcher over-grants) |
| 90 | SCOPE-3.F39 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-19 fixable integration items (lila-chat doesn't load private/relationship notes + family_context_interview |
| 91 | SCOPE-3.F5 | 3 | Medium | N |  | Fix Next Build |  |  |  | Model-tier registry-vs-runtime drift — expanded to multi-provider `invokeAI()` helper architecture |
| 92 | SCOPE-3.F6 | 3 | Medium | N |  | Intentional-Update-Doc |  |  |  | PRD-24 family Cross-PRD Impact Addenda pre-Build-M, never back-amended |
| 93 | SCOPE-4.F5 | 4 | Medium | N |  | Intentional-Update-Doc |  |  | SCOPE-4.F4 | `board_personas.embedding` is intended product infrastructure for alternative-persona substitution, not orphan |
| 94 | SCOPE-4.F8b | 4 | Medium | N |  | Fix Next Build |  |  | SCOPE-4.F4 (consolidated Board sprint) | Decision Guide + Board of Directors hand-roll context instead of calling assembleContext (Recon-1 verdict: LiLa-powered-but-bypassing) — _Recon-1 verdict 2026-04-21 (RECON_F8B_ASSEMBLER.md): LILA-POWERED-BUT-BYPASSING. Both tools have non-empty context_sources in lila_guided_modes, hand-roll context queries. Refactor to call assembleContext(); audit Perspective Shifter + Mediator in same pass. F8a folds into this sprint._ |
| 95 | SCOPE-5.F2 | 5 | Medium | N |  | Defer-to-Gate-4 |  |  |  | live_schema.md missing widget_starter_configs table (surfaced during pilot) |
| 96 | SCOPE-5.F4 | 5 | Medium | N | Y | Closed/Resolved |  |  |  | Scope 5 walk-through summary — 12 registry flips, 7 merges, 1 split, 3 hygiene adds, 1 commit applied |
| 97 | SCOPE-8a.F4 | 8a | Medium | N |  | Fix Next Build |  |  |  | Translator LiLa Edge Function exempted from code-level crisis detection |
| 98 | SCOPE-8a.F7 | 8a | Medium | N |  | Fix Next Build |  |  |  | MindSweep autopilot routes labeled `source='manual'` — audit-trail integrity defect |
| 99 | SCOPE-8a.F8 | 8a | Medium | N | Y | Tech Debt |  |  |  | HumanInTheMix component reuse count = 1 — inconsistent HITM implementations |
| 100 | NEW-E | Horizon | Low | N |  | Capture-only |  |  |  | LILA_FUTURE_LOCAL_LLM.md stub — small open-source on-device LLM for General/kid/privacy-sensitive chat (post-beta) — _Added 2026-04-21. Capture vision only — do not build, do not start design. Strategic value: privacy, zero-API-cost general chat, kid AI safety unlock, ESA positioning, offline resilience. Author post-Session-2 stub at LILA_FUTURE_LOCAL_LLM.md with routing logic, hardware floor, model candidates, guardrails, family-member-scoped constraints._ |
| 101 | NEW-F | Lists | Low | N |  | Fix Next Build | **LOCKED** Fix Next Build — **bundled** w/ PRD-09B worker |  | NEW-G(a) Convention 70 fast-commit | Crossed-off grace period property on lists (non-instant default) — _Doc §1.2 draft note 3. PRD-09B amendment._ |
| 102 | NEW-I | Connectors | Low | N |  | Fix Next Build | **LOCKED** Fix Next Build — **bundled** w/ PRD-09B worker |  | NEW-G(a) Convention 70 fast-commit | Person-pick-spin per-deploy config (flow A person-first / flow B reward-first; skip-and-return) — _Doc §1.3 + draft note 8. PRD-09B + PRD-24._ |
| 103 | NEW-J | BookShelf | Low | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — pool |  |  | Book completion chain-next (auto-advance sequential OR surface browsable opportunity list) — _Doc §1.3 + draft note 9. PRD-23 amendment._ |
| 104 | NEW-M | Tasks | Low | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — pool |  |  | Task Breaker invocable post-assignment by kid (in addition to mom pre-assignment) — _Doc §1.3 nested-subtask pattern + draft note 13. PRD-09A amendment. Task Breaker as utility already covered by Convention 248._ |
| 105 | NEW-S | Schema | Low | N |  | Tech Debt | **LOCKED** Tech Debt (silent approve) — future schema cleanup |  |  | Schema consolidation: decide canonical storage for sequential behavior (sequential_collections table vs lists with presentation_mode=sequential) — _Doc §1.1 + draft notes 24 + 26. Both storage locations valid for now; Claude Code must treat them identically behaviorally. Future schema cleanup._ |
| 106 | NEW-U | Tasks | Low | N |  | Fix Next Build | **LOCKED** Fix Next Build (silent approve) — pool |  |  | Split require_evidence into independent require_photo + require_note properties — _Doc §1.2 + draft note 27. PRD-09A amendment._ |
| 107 | NEW-V | Lists | Low | N |  | Fix Next Build | **LOCKED** Fix Next Build — **bundled** w/ PRD-09B worker |  | NEW-G(a) Convention 70 fast-commit | Rotation memory per-list / per-section / per-item with cooldown + frequency rules — _Doc §1.2 + draft note 28. PRD-09B amendment._ |
| 108 | NEW-Y | Lists | Low | N |  | Fix Next Build | **LOCKED** Fix Next Build — **bundled** w/ PRD-09B worker |  | NEW-G(a) Convention 70 fast-commit | kid_can_skip per-list (or per-item) property — _Doc §1.2 + draft note 31. PRD-09B amendment._ |
| 109 | SCOPE-1.F2 | 1 | Low | N |  | Informational |  |  |  | tsc -b and npm run lint baseline at audit start |
| 110 | SCOPE-1.F6 | 1 | Low | N |  | Intentional-Update-Doc |  |  |  | AURI Generic API Key regex false-positive on feature-key identifiers |
| 111 | SCOPE-2.F10 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-05 downstream registry supersession — 15 modes spec'd, 43 modes shipped |
| 112 | SCOPE-2.F12 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-05 Privacy Filtered folder category UI deferred to PRD-13 |
| 113 | SCOPE-2.F13 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-05 opening messages missing for 35 of 43 guided modes |
| 114 | SCOPE-2.F14 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-05 `buildFaithContext()` reads nonexistent schema field — likely dead code |
| 115 | SCOPE-2.F15 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-05C `ai_usage_tracking` schema drift — live is generic platform-wide tracker |
| 116 | SCOPE-2.F16 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-06 partner-share UI missing on Guiding Stars + Best Intentions |
| 117 | SCOPE-2.F17 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-08 messaging supersession — 2-table spec vs 3-table PRD-15 architecture |
| 118 | SCOPE-2.F18 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-08 per-child journal visibility UI missing |
| 119 | SCOPE-2.F2 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-02 permission gate adoption low — pre-monetization prerequisite |
| 120 | SCOPE-2.F20 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-18 mood triage supersession — Enhancement Addendum + Convention #25 removed default |
| 121 | SCOPE-2.F21 | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-18 teen experience supersession — Enhancement Addendum §Enhancement 7 + Conventions #189–197 |
| 122 | SCOPE-2.F23 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-19 archive column drift — 5 + 3 addendum columns unbacked |
| 123 | SCOPE-2.F24 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-09A `task_queue` legacy nomenclature — 10 stale occurrences in PRD text |
| 124 | SCOPE-2.F25 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-09A prioritization views partial — 12 options ship (7 real + 5 stubs), ABCDE removed |
| 125 | SCOPE-2.F26 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-09A Habit task type unwired — 3-mode meta-type branching remediation |
| 126 | SCOPE-2.F28 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-17 numeric indicator preference deferred to Settings PRD |
| 127 | SCOPE-2.F30 | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-10 tracker catalog expansion — codify 17 canonical + 4 extras |
| 128 | SCOPE-2.F31 | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-10 `widget_templates` vs `widget_starter_configs` architectural split |
| 129 | SCOPE-2.F32 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-14 `col_span` responsive-section feature unbuilt — will-be-built eventually |
| 130 | SCOPE-2.F33 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-14B schema refactor documentation — 3 Convention-documented deliberate supersessions |
| 131 | SCOPE-2.F35 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-14C Family Overview polish deferred — 4 UX polish items Post-MVP |
| 132 | SCOPE-2.F37 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-25 + PRD-26 graduation flows unbuilt — Post-MVP |
| 133 | SCOPE-2.F38 | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-26 reveal architecture superseded by Build M — 5 styles → 2 per-segment |
| 134 | SCOPE-2.F4 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-01 + PRD-04 legacy Hub columns on `families` table superseded by PRD-14D |
| 135 | SCOPE-2.F41 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | WIRING_STATUS.md PRD-15 / PRD-16 post-build checklist drift |
| 136 | SCOPE-2.F42 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-16 meeting_type enum 9→5 override per feature decision 2026-04-14 |
| 137 | SCOPE-2.F44 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-16 Build P verification table drift — `GuidedThingsToTalkAboutSection` marked Stubbed but fully built |
| 138 | SCOPE-2.F46 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-34 ThoughtSift `/thoughtsift` route removal — scope creep reverts |
| 139 | SCOPE-2.F47 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-34 `board_personas` schema split missing — deferred until Channel D |
| 140 | SCOPE-2.F5 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-02 shift-scheduling text superseded by `access_schedules` + `time_sessions` |
| 141 | SCOPE-2.F51 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-22 minor screens deprioritized by founder — 4 amendments |
| 142 | SCOPE-2.F52 | 2 | Low | N |  | Defer-to-Gate-4 |  |  | SCOPE-2.F9 | PRD-21A Optimize with LiLa stub — gated on F9 Optimizer build |
| 143 | SCOPE-2.F53 | 2 | Low | N |  | Defer-to-Gate-4 |  |  | SCOPE-2.F9 | PRD-21A Deploy with LiLa skill stub — gated on F9 + External Tool Registry |
| 144 | SCOPE-2.F54 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-21 skill-check mode missing for Cyrano + Higgins Say |
| 145 | SCOPE-2.F55 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-21 Higgins display name seed registry drift |
| 146 | SCOPE-2.F56 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-23 Cross-PRD Impact Addendum `bookshelf_principles` → `bookshelf_insights` rename drift |
| 147 | SCOPE-2.F57 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-23 `SemanticSearchPanel` app-wide hook zero external consumers |
| 148 | SCOPE-2.F59 | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-24 pipeline + settings panel superseded by Build M |
| 149 | SCOPE-2.F6 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-03 theme count — code ships 46, spec + Convention #42 claim 38 |
| 150 | SCOPE-2.F60a | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-24A dashboard backgrounds → Sticker Book pages supersession |
| 151 | SCOPE-2.F63 | 2 | Low | N | Y | Fix Next Build |  |  |  | PRD-24 screen features unbuilt — 5 viz modes ship 1, level threshold dormant, leaderboard scaffolding only |
| 152 | SCOPE-2.F7 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-03 shared component inventory mismatch across PRD-03 / Convention #44 / STUB_REGISTRY |
| 153 | SCOPE-2.F70 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-35 `access_schedules` field-name drift |
| 154 | SCOPE-2.F8 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-04 `/hub/tv` PlannedExpansionCard stub — PRD-14E Post-MVP |
| 155 | SCOPE-3.F10 | 3 | Low | N |  | Fix Next Build |  |  |  | Pattern 2H — Settings page missing nav entry points (4 PRD-22 cross-PRD entries + PRD-36 TimerConfigPanel + PR |
| 156 | SCOPE-3.F11 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-24 useUncompleteTask stub comment stale post-Build-M |
| 157 | SCOPE-3.F12 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-36 time_session_completed + time_session_modified events have zero listeners (wire to Build M gamification |
| 158 | SCOPE-3.F13 | 3 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-29 addendum marks stub sockets as WIRED despite no writer code existing (WIRING_STATUS convention violatio |
| 159 | SCOPE-3.F15 | 3 | Low | N |  | Closed/Resolved |  |  |  | CLAUDE.md convention proposal: Lego Primitive Connector Documentation — _Closed 2026-04-22 per founder. The Composition Architecture doc (Parts 1+2) IS the Lego convention this finding proposed. Conventions 249-256 lifted the load-bearing rules into CLAUDE.md on the same date._ |
| 160 | SCOPE-3.F16 | 3 | Low | N |  | Intentional-Update-Doc |  |  |  | CLAUDE.md convention proposal: AI Model Selection is Registry-Driven (`invokeAI()` helper) |
| 161 | SCOPE-3.F17 | 3 | Low | N |  | Intentional-Update-Doc |  |  |  | CLAUDE.md addendum-writing habit proposal: consumer-missing vs never-built classification (Habit #9, prospecti |
| 162 | SCOPE-3.F18 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-08 Notepad→studio_queue orphan destinations + source tracking lost on direct destination writes |
| 163 | SCOPE-3.F21 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-26 Build-M-superseded surfaces: Reveal Task Tile + Mom Message Card + section-key data-driven layout |
| 164 | SCOPE-3.F23 | 3 | Low | N | Y | Fix Next Build |  |  |  | PRD-14 dashboard polish bundle (col_span + grid sharing + Today's Victories widget) |
| 165 | SCOPE-3.F24 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-14B polish bundle: calendar-parse-event + calendar_event_create + duplicate calendar_color + getMemberColo |
| 166 | SCOPE-3.F25 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-18 5 cross-feature wirings delivered as schema/type scaffolding (GIN index, rhythm_request enum, reflectio |
| 167 | SCOPE-3.F28 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-24 integration edges schema/primitive-only |
| 168 | SCOPE-3.F31 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-28 enum + compliance bundle (PRD-28B handoff + hourly + financial_approval dead enum values + homework app |
| 169 | SCOPE-3.F35 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-34 ThoughtSift implementation drift bundle |
| 170 | SCOPE-3.F4 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-35 convention surface unwired (calendar preview 2/3 consumers, weekStartDay, allowedFrequencies, _legacy_r |
| 171 | SCOPE-3.F40 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-21A minor wire-up + vault_tool_sessions tracking + Optimizer integration server layer |
| 172 | SCOPE-3.F42 | 3 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-21C entire PRD deferred (cross-ref Round 0 Deferred list) |
| 173 | SCOPE-3.F7 | 3 | Low | N |  | Intentional-Update-Doc |  |  |  | Addendum self-reporting drift — 3 addenda assert completion facts code contradicts |
| 174 | SCOPE-3.F8 | 3 | Low | N | Y | Intentional-Update-Doc |  |  |  | Reusable animation/visual primitive library intentionally unassigned to production consumers (Lego/surge-prote |
| 175 | SCOPE-3.F9 | 3 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-14 `dashboard_widgets.is_included_in_ai` widget toggle is no-op — drop column + UI toggle |
| 176 | SCOPE-4.F10 | 4 | Low | N |  | Intentional-Update-Doc |  |  |  | Notepad Review & Route + Smart List Import + Post-Meeting Review classifiers are Haiku-first with no embedding |
| 177 | SCOPE-4.F2 | 4 | Low | N |  | Intentional-Update-Doc |  |  |  | pgmq `embedding_jobs` pipeline dormant; polling-consumer is the real architecture |
| 178 | SCOPE-4.F3 | 4 | Low | N |  | Intentional-Update-Doc |  |  |  | `embed` pg_cron schedule undeclared in migrations |
| 179 | SCOPE-4.F6 | 4 | Low | N | Y | Intentional-Update-Doc |  |  |  | Heart/HeartOff UI toggle gaps across six context-source surfaces — hearts everywhere |
| 180 | SCOPE-4.F7 | 4 | Low | N |  | Intentional-Update-Doc |  |  |  | Board of Directors moderator interjection fires auto-default — revoke to opt-in-only |
| 181 | SCOPE-4.F9 | 4 | Low | N |  | Intentional-Update-Doc |  |  |  | `lila-message-respond` omits `recentMessages` parameter in `assembleContext` call — sliding window shrinks to  |
| 182 | SCOPE-5.F1 | 5 | Low | N | Y | Defer-to-Gate-4 |  |  |  | STUB_REGISTRY line 398 stale: Backburner/Ideas auto-provision is wired |
| 183 | SCOPE-5.F3 | 5 | Low | N |  | Intentional-Update-Doc |  |  |  | Partition-size estimates in operation plan drifted by order of magnitude from actual partition contents |

---

## Known ordering constraints (pre-adjudicated per brief)

- **SCOPE-4.F4 blocks SCOPE-4.F5** — Board of Directors cache-scope rebuild must land before alternative-persona substitution infrastructure.
- **SCOPE-3.F2 blocks SCOPE-8b.F11** — PRD-35 scheduler vocabulary consolidation precedes PRD-27 shift_sessions/time_sessions bifurcation fix.
- **SCOPE-8a.F1 (COPPA) has compound prerequisites:** Stripe webhook Edge Function (PRD-31, covered by SCOPE-2.F1) + Admin Console shell (PRD-32, covered by SCOPE-2.F48). Fix Now scope is cross-PRD and cross-build.
- **SCOPE-8a.F2 depends on SCOPE-8a.F1** — COPPA revocation cascade IS the deletion scope.
- **SCOPE-4.F8 depends on SCOPE-4.F4** — Decision Guide + Board context-assembler bypass Fix Next Build should follow the cache rebuild.
- **SCOPE-2.F52 + SCOPE-2.F53 depend on SCOPE-2.F9** — Optimize/Deploy with LiLa stubs cannot resolve until the Optimizer is built.
- **Scope 6 (43 LiLa discrepancies)** is pre-locked **Defer-to-Gate-4** per brief; lives in [LILA_KNOWLEDGE_BACKLOG.md](LILA_KNOWLEDGE_BACKLOG.md) and does NOT appear as rows in this worksheet.
- **Scope 7 performance baseline** is informational-only; no triage rows.

A full Fix-Now-ordering DAG lives in `FIX_NOW_SEQUENCE.md`, produced in parallel by the Dependency-Graph worker (see dispatch plan).

---

## Legend

- **Sev:** Severity from AUDIT_REPORT_v1.md (Blocking / High / Medium / Low / Informational).
- **Beta:** Y = listed in [Appendix C — Beta Readiness flag index](AUDIT_REPORT_v1.md#appendix-c--beta-readiness-flag-index). 22 expected.
- **Wiz:** Y = indexed in [Appendix B — Wizard Design Impact](AUDIT_REPORT_v1.md#appendix-b--wizard-design-impact-index). Feeds Claude.ai flow-design sessions; affects how the Tier 1 wizards should be built.
- **Proposed:** Claude's proposal based on the finding's own "Proposed resolution" field. Not binding. Values: Fix Now · Fix Now (+compound) · Fix Next Build · Tech Debt · Intentional-Update-Doc · Defer-to-Gate-4 · Closed/Resolved · Informational · NEEDS-REVIEW.
  - `Fix Now (+compound)` = finding proposes Fix Now for some sub-items and Tech Debt / Fix Next Build for others. Session 2 splits it row-by-row.
  - `NEEDS-REVIEW` = auto-classifier did not match a keyword; Tenise adjudicates directly from the audit entry.
- **Founder decision:** Empty until Session 2 walkthrough. Tenise adjudicates.
- **Worker:** Assigned after Session 2 (e.g., `Exec-A-fix-now`, `Doc-B-prd-16`, `Drafter-C-scope2-med`, `DAG-build`).
- **Blocked-by:** Upstream finding(s) that must land first.
- **Title:** Short heading. Click through to [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md) and grep for the finding ID to read the full entry.

---

## Gate 1 exit criteria tracker

Per [MYAIM_GAMEPLAN_v2.2.md §372](MYAIM_GAMEPLAN_v2.2.md#L372):

- [x] Audit report is complete and founder-reviewed (Phase 2 closed 2026-04-21)
- [ ] Every audit finding is classified (this worksheet)
- [ ] All Fix Now items are resolved and committed
- [ ] PRD updates for "Intentional" classifications are merged
- [ ] `TECH_DEBT_REGISTER.md` exists with all deferred findings
- [x] `LILA_KNOWLEDGE_BACKLOG.md` has all Gate 4 items logged (43 entries landed)
- [ ] `tsc -b` is clean
- [ ] `BUILD_STATUS.md` reflects Gate 1 complete
- [ ] Founder has explicitly said "Gate 1 is complete, advancing to Gate 2"
