# TRIAGE_WORKSHEET.md

> **Phase 3 Triage — Gate 1 exit artifact.**
> **Source:** [AUDIT_REPORT_v1.md](AUDIT_REPORT_v1.md) (153 F-numbered finding rows across 7 scopes; 146 unique findings per report self-description — F60 split into a/b/c adds 2 rows; F64/F65 skipped in numbering).
> **Parallel artifacts (not indexed here):** Scope 6 → [LILA_KNOWLEDGE_BACKLOG.md](LILA_KNOWLEDGE_BACKLOG.md) (43 entries, all pre-classified **Defer-to-Gate-4**). Scope 7 → [PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md) (81 rows, informational-only).
> **Gameplan reference:** [MYAIM_GAMEPLAN_v2.2.md §361-381](MYAIM_GAMEPLAN_v2.2.md#L355) (Phase 3 definition + Gate 1 exit criteria).

## Status

- **Total rows:** 153
- **Beta Readiness blockers (from Appendix C):** 22 (target: 22)
- **Wizard-design-impacted (from Appendix B):** 21
- **Founder-decision-required at emission:** 3 rows (SCOPE-8a.F1, F2, F3 — all Beta blockers)
- **Pre-classified `Closed/Resolved` (no triage needed):** 4 (SCOPE-1.F3, F4, F5; SCOPE-5.F4)

### Proposed classification distribution

> All classifications in the Proposed column are Claude's draft based on the finding's own "Proposed resolution" field. Tenise adjudicates each row in Session 2; nothing locks without her.

| Proposed class | Count |
|---|---|
| Fix Next Build | 68 |
| Intentional-Update-Doc | 43 |
| Defer-to-Gate-4 | 25 |
| Fix Now | 9 |
| Closed/Resolved | 4 |
| Fix Now (+compound) | 2 |
| Informational | 1 |
| Tech Debt | 1 |

### Severity distribution

| Severity | Count |
|---|---|
| Blocking | 6 |
| High | 17 |
| Medium | 52 |
| Low | 78 |

---

## Worksheet

**Columns:** # · Finding ID · Scope · Sev · Beta · Wiz · Proposed · Founder decision · Worker · Blocked-by · Notes

**Ordering:** Beta=Y first, then Blocking → High → Medium → Low within each block. Session 2 walks rows top-down.

| # | Finding ID | Scope | Sev | Beta | Wiz | Proposed | Founder decision | Worker | Blocked-by | Title (see AUDIT_REPORT_v1.md for full finding) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | SCOPE-8a.F1 | 8a | Blocking | Y |  | Fix Now |  |  | SCOPE-2.F1 (Stripe); SCOPE-2.F48 (Admin) | PRD-40 COPPA compliance infrastructure entirely unbuilt |
| 2 | SCOPE-8a.F2 | 8a | Blocking | Y |  | Fix Now |  |  | SCOPE-8a.F1 | Privacy-data-lifecycle incomplete — export, deletion, voice retention |
| 3 | SCOPE-8a.F3 | 8a | Blocking | Y |  | Fix Now |  |  |  | PRD-20 Safe Harbor + PRD-30/PRD-41 Safety Monitoring entirely unbuilt |
| 4 | SCOPE-8a.F6 | 8a | Blocking | Y |  | Fix Now |  |  |  | DailyCelebration auto-persists AI celebration narrative with no HITM |
| 5 | SCOPE-8b.F1 | 8b | Blocking | Y |  | Fix Now (+compound) |  |  |  | Edge Functions authenticate but do not authorize (13 surfaces including cross-family Mediator Full Picture dat |
| 6 | SCOPE-8b.F5 | 8b | Blocking | Y |  | Fix Now |  |  |  | Crisis Override missing in 3 Edge Functions (message-coach, auto-title-thread, bookshelf-discuss) |
| 7 | SCOPE-3.F14 | 3 | High | Y | Y | Fix Next Build |  |  |  | PRD-28 first allowance_periods row never created (allowance non-operational at first-use) |
| 8 | SCOPE-3.F41 | 3 | High | Y | Y | Fix Now |  |  |  | PRD-21A MemberAssignmentModal writes `is_granted`/`granted_by` to dropped columns (broken write) |
| 9 | SCOPE-4.F4 | 4 | High | Y |  | Intentional-Update-Doc |  |  |  | Board of Directors persona cache architecture defect — cross-family persona leak potential |
| 10 | SCOPE-8b.F10 | 8b | High | Y |  | Fix Next Build |  |  |  | PRD-16 dad meeting permission gate absent (useCreateMeeting does NO member_permissions check) |
| 11 | SCOPE-8b.F11 | 8b | High | Y |  | Fix Now |  |  | SCOPE-3.F2 | PRD-27 shift_sessions/time_sessions bifurcation (live data gap; 2 live rows in production) |
| 12 | SCOPE-8b.F12 | 8b | High | Y |  | Fix Next Build |  |  |  | PRD-15 messaging safety semantics enforced client-side only (consolidated 4 sub-surfaces) |
| 13 | SCOPE-8b.F13 | 8b | High | Y |  | Fix Next Build |  |  |  | PRD-31 server-side subscription tier enforcement absent (47 Edge Functions ungated) |
| 14 | SCOPE-8b.F2 | 8b | High | Y |  | Fix Next Build |  |  |  | HITM gate bypassed on PRD-21 `communication_drafts` persist |
| 15 | SCOPE-8b.F3 | 8b | High | Y |  | Fix Next Build |  |  |  | HITM gate bypassed on PRD-34 `board_personas` generation |
| 16 | SCOPE-8b.F4 | 8b | High | Y | Y | Fix Next Build |  |  |  | Documented user-controlled accountability/privacy silently unenforceable (5 surfaces) |
| 17 | SCOPE-8b.F6 | 8b | High | Y |  | Fix Next Build |  |  |  | PRD-17B auto-sweep silently a no-op (marquee "wake up to sorted items" promise unimplemented) |
| 18 | SCOPE-8b.F7 | 8b | High | Y |  | Fix Now |  |  |  | PRD-14B `.ics` import CHECK violation (runtime failure on marquee import feature) |
| 19 | SCOPE-8b.F8 | 8b | High | Y |  | Fix Next Build |  |  |  | PRD-22 `account_deletions` GDPR right-to-erasure unenforced |
| 20 | SCOPE-8b.F9 | 8b | High | Y |  | Fix Next Build |  |  |  | PRD-16 meeting impressions privacy unenforced (Convention #232 enforced only by SQL comment) |
| 21 | SCOPE-8a.F5 | 8a | Medium | Y |  | Fix Now (+compound) |  |  |  | Board of Directors content policy has fail-open defects |
| 22 | SCOPE-3.F22 | 3 | Low | Y |  | Fix Now |  |  |  | Play shell "Fun" tab 404 (/rewards route missing) |
| 23 | SCOPE-1.F3 | 1 | High | N |  | Closed/Resolved |  |  |  | AURI retroactive scan blocked on first-call OAuth in fresh session — RESOLVED 2026-04-18 |
| 24 | SCOPE-1.F5 | 1 | High | N |  | Closed/Resolved |  |  |  | AURI retroactive scan — RESOLVED 2026-04-18 |
| 25 | SCOPE-4.F1 | 4 | High | N |  | Intentional-Update-Doc |  |  |  | `archive_context_items` missing `embedding` column silently breaks MindSweep embedding-first classification en |
| 26 | SCOPE-1.F1 | 1 | Medium | N |  | Intentional-Update-Doc |  |  |  | TOOL_HEALTH_REPORT_2026-04-16 F1 AURI recipe is wrong for Developer Edition |
| 27 | SCOPE-1.F4 | 1 | Medium | N |  | Closed/Resolved |  |  |  | Convention 242 inverted mid-audit: mgrep-primary to grep-primary |
| 28 | SCOPE-2.F1 | 2 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-31 tier monetization infrastructure unbuilt |
| 29 | SCOPE-2.F11 | 2 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-05 context assembly architecture wrapping drift — 3-layer framework wraps 8 PRD concepts |
| 30 | SCOPE-2.F19 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-11B Family Celebration unbuilt — STUB_REGISTRY L120 false-Wired claim |
| 31 | SCOPE-2.F22 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-19 reports + aggregation pipeline unbuilt — near-term 2–3 month roadmap |
| 32 | SCOPE-2.F29 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-17B MindSweep auto-seed contract unmet — group with halfway-state completion bucket |
| 33 | SCOPE-2.F3 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-02 access-level picker missing — signature founding-family onboarding moment |
| 34 | SCOPE-2.F34 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-14B AI intake unbuilt — near-term build priority per founder direction |
| 35 | SCOPE-2.F36 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-25 Guided LiLa Tools unbuilt — active kid demand elevates priority |
| 36 | SCOPE-2.F39 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-15 mom-visibility architecture — three-state observation/private model supersedes Convention #141 strict p |
| 37 | SCOPE-2.F40 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-15 DND non-safety suppression unwired |
| 38 | SCOPE-2.F43 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-16 notification enum additions missing from migration 100146 — `completeMeeting.ts` workaround mis-categor |
| 39 | SCOPE-2.F45 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-21 AI Toolbox sidebar restoration |
| 40 | SCOPE-2.F48 | 2 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-21B Admin Console unbuilt — beta-deferred per F1/F9/F19 pattern |
| 41 | SCOPE-2.F49 | 2 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-21C Vault Engagement layer unbuilt — mom-only commenting privacy posture preserved |
| 42 | SCOPE-2.F50 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-22 Settings overlay + embeds deferred — mom-should-not-lose-her-place UX |
| 43 | SCOPE-2.F58 | 2 | Medium | N |  | Fix Next Build |  |  |  | PRD-24 reward economy unbuilt — near-term lego-piece connector |
| 44 | SCOPE-2.F60b | 2 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-24A overlay engine deferred indefinitely — pause, maybe never |
| 45 | SCOPE-2.F60c | 2 | Medium | N | Y | Fix Next Build |  |  |  | PRD-24A themes + game modes + Game Modes Addendum tables on active roadmap |
| 46 | SCOPE-2.F61 | 2 | Medium | N | Y | Fix Next Build |  |  |  | PRD-24B reveal library needs cross-feature lego wiring |
| 47 | SCOPE-2.F62 | 2 | Medium | N | Y | Fix Next Build |  |  |  | PRD-24B Color Reveal needs fuller lego-connector architecture |
| 48 | SCOPE-2.F66 | 2 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-27 Caregiver Tools unbuilt — Enhanced-tier flagship |
| 49 | SCOPE-2.F67 | 2 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-29 BigPlans unbuilt — Enhanced-tier flagship |
| 50 | SCOPE-2.F68 | 2 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-37 Family Feeds unbuilt — pair with PRD-28B build-order |
| 51 | SCOPE-2.F69 | 2 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-38 Blog (Cookie Dough & Contingency Plans) unbuilt — pre-paid-launch prerequisite |
| 52 | SCOPE-2.F9 | 2 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-05C LiLa Optimizer infrastructure unbuilt |
| 53 | SCOPE-3.F1 | 3 | Medium | N |  | Fix Next Build |  |  |  | Source/enum discipline drift pattern (7+ columns freeform TEXT with missing CHECKs) |
| 54 | SCOPE-3.F19 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-23 BookShelf 5 outbound handoffs partially built + cross-PRD addendum schema drift |
| 55 | SCOPE-3.F2 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-35 schedule vocabulary drift (4 incompatible vocabularies + 2 RecurrenceDetails TS types) |
| 56 | SCOPE-3.F20 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-25 Guided cross-feature integrations ship as UI-visible placeholders (consolidated PRD-25 bundle) |
| 57 | SCOPE-3.F26 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-21 4 integration surfaces scaffolding only (Higgins Navigate skill save + AI Toolbox sidebar + Send via Me |
| 58 | SCOPE-3.F27 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-22 infrastructure consumer gaps bundle |
| 59 | SCOPE-3.F29 | 3 | Medium | N |  | Intentional-Update-Doc |  |  |  | PRD-24A overlay-engine architecture entirely superseded by Build M |
| 60 | SCOPE-3.F3 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-35 scheduler output broken semantics (completion-dependent + alternating-weeks + buildTaskScheduleFields) |
| 61 | SCOPE-3.F30 | 3 | Medium | N | Y | Fix Next Build |  |  |  | PRD-24B superseded architectures: flat Reveal Type Library → reveal_animations style_category + Color-Reveal → |
| 62 | SCOPE-3.F32 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-29 BigPlans surface-level drift: guided-mode taxonomy (4 addendum vs 5 seeded) + 5 BigPlans feature keys r |
| 63 | SCOPE-3.F33 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-31 tier enforcement wire-up bundle (useCanAccess/PermissionGate adoption + permission_level_profiles + fea |
| 64 | SCOPE-3.F34 | 3 | Medium | N |  | Defer-to-Gate-4 |  |  |  | PRD-31 monetization engine entirely unbuilt at server layer (Stripe webhook + tier enforcement cascade) |
| 65 | SCOPE-3.F36 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-36 cross-PRD integration bundle (engine wired but cross-PRD integration dispatched to void + timer complet |
| 66 | SCOPE-3.F37 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-17B mindsweep-sort 6 seams consolidated (seams 1, 2, 4, 7, 9, 12, 13, 14) |
| 67 | SCOPE-3.F38 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-14D dashboard architecture gaps (Hub widget_grid section + PerspectiveSwitcher over-grants) |
| 68 | SCOPE-3.F39 | 3 | Medium | N |  | Fix Next Build |  |  |  | PRD-19 fixable integration items (lila-chat doesn't load private/relationship notes + family_context_interview |
| 69 | SCOPE-3.F5 | 3 | Medium | N |  | Fix Next Build |  |  |  | Model-tier registry-vs-runtime drift — expanded to multi-provider `invokeAI()` helper architecture |
| 70 | SCOPE-3.F6 | 3 | Medium | N |  | Intentional-Update-Doc |  |  |  | PRD-24 family Cross-PRD Impact Addenda pre-Build-M, never back-amended |
| 71 | SCOPE-4.F5 | 4 | Medium | N |  | Intentional-Update-Doc |  |  | SCOPE-4.F4 | `board_personas.embedding` is intended product infrastructure for alternative-persona substitution, not orphan |
| 72 | SCOPE-5.F2 | 5 | Medium | N |  | Defer-to-Gate-4 |  |  |  | live_schema.md missing widget_starter_configs table (surfaced during pilot) |
| 73 | SCOPE-5.F4 | 5 | Medium | N | Y | Closed/Resolved |  |  |  | Scope 5 walk-through summary — 12 registry flips, 7 merges, 1 split, 3 hygiene adds, 1 commit applied |
| 74 | SCOPE-8a.F4 | 8a | Medium | N |  | Fix Next Build |  |  |  | Translator LiLa Edge Function exempted from code-level crisis detection |
| 75 | SCOPE-8a.F7 | 8a | Medium | N |  | Fix Next Build |  |  |  | MindSweep autopilot routes labeled `source='manual'` — audit-trail integrity defect |
| 76 | SCOPE-8a.F8 | 8a | Medium | N | Y | Tech Debt |  |  |  | HumanInTheMix component reuse count = 1 — inconsistent HITM implementations |
| 77 | SCOPE-1.F2 | 1 | Low | N |  | Informational |  |  |  | tsc -b and npm run lint baseline at audit start |
| 78 | SCOPE-1.F6 | 1 | Low | N |  | Intentional-Update-Doc |  |  |  | AURI Generic API Key regex false-positive on feature-key identifiers |
| 79 | SCOPE-2.F10 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-05 downstream registry supersession — 15 modes spec'd, 43 modes shipped |
| 80 | SCOPE-2.F12 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-05 Privacy Filtered folder category UI deferred to PRD-13 |
| 81 | SCOPE-2.F13 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-05 opening messages missing for 35 of 43 guided modes |
| 82 | SCOPE-2.F14 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-05 `buildFaithContext()` reads nonexistent schema field — likely dead code |
| 83 | SCOPE-2.F15 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-05C `ai_usage_tracking` schema drift — live is generic platform-wide tracker |
| 84 | SCOPE-2.F16 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-06 partner-share UI missing on Guiding Stars + Best Intentions |
| 85 | SCOPE-2.F17 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-08 messaging supersession — 2-table spec vs 3-table PRD-15 architecture |
| 86 | SCOPE-2.F18 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-08 per-child journal visibility UI missing |
| 87 | SCOPE-2.F2 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-02 permission gate adoption low — pre-monetization prerequisite |
| 88 | SCOPE-2.F20 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-18 mood triage supersession — Enhancement Addendum + Convention #25 removed default |
| 89 | SCOPE-2.F21 | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-18 teen experience supersession — Enhancement Addendum §Enhancement 7 + Conventions #189–197 |
| 90 | SCOPE-2.F23 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-19 archive column drift — 5 + 3 addendum columns unbacked |
| 91 | SCOPE-2.F24 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-09A `task_queue` legacy nomenclature — 10 stale occurrences in PRD text |
| 92 | SCOPE-2.F25 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-09A prioritization views partial — 12 options ship (7 real + 5 stubs), ABCDE removed |
| 93 | SCOPE-2.F26 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-09A Habit task type unwired — 3-mode meta-type branching remediation |
| 94 | SCOPE-2.F27 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-09B list type catalog — codify 5 extras with documented use cases |
| 95 | SCOPE-2.F28 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-17 numeric indicator preference deferred to Settings PRD |
| 96 | SCOPE-2.F30 | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-10 tracker catalog expansion — codify 17 canonical + 4 extras |
| 97 | SCOPE-2.F31 | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-10 `widget_templates` vs `widget_starter_configs` architectural split |
| 98 | SCOPE-2.F32 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-14 `col_span` responsive-section feature unbuilt — will-be-built eventually |
| 99 | SCOPE-2.F33 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-14B schema refactor documentation — 3 Convention-documented deliberate supersessions |
| 100 | SCOPE-2.F35 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-14C Family Overview polish deferred — 4 UX polish items Post-MVP |
| 101 | SCOPE-2.F37 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-25 + PRD-26 graduation flows unbuilt — Post-MVP |
| 102 | SCOPE-2.F38 | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-26 reveal architecture superseded by Build M — 5 styles → 2 per-segment |
| 103 | SCOPE-2.F4 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-01 + PRD-04 legacy Hub columns on `families` table superseded by PRD-14D |
| 104 | SCOPE-2.F41 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | WIRING_STATUS.md PRD-15 / PRD-16 post-build checklist drift |
| 105 | SCOPE-2.F42 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-16 meeting_type enum 9→5 override per feature decision 2026-04-14 |
| 106 | SCOPE-2.F44 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-16 Build P verification table drift — `GuidedThingsToTalkAboutSection` marked Stubbed but fully built |
| 107 | SCOPE-2.F46 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-34 ThoughtSift `/thoughtsift` route removal — scope creep reverts |
| 108 | SCOPE-2.F47 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-34 `board_personas` schema split missing — deferred until Channel D |
| 109 | SCOPE-2.F5 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-02 shift-scheduling text superseded by `access_schedules` + `time_sessions` |
| 110 | SCOPE-2.F51 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-22 minor screens deprioritized by founder — 4 amendments |
| 111 | SCOPE-2.F52 | 2 | Low | N |  | Defer-to-Gate-4 |  |  | SCOPE-2.F9 | PRD-21A Optimize with LiLa stub — gated on F9 Optimizer build |
| 112 | SCOPE-2.F53 | 2 | Low | N |  | Defer-to-Gate-4 |  |  | SCOPE-2.F9 | PRD-21A Deploy with LiLa skill stub — gated on F9 + External Tool Registry |
| 113 | SCOPE-2.F54 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-21 skill-check mode missing for Cyrano + Higgins Say |
| 114 | SCOPE-2.F55 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-21 Higgins display name seed registry drift |
| 115 | SCOPE-2.F56 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-23 Cross-PRD Impact Addendum `bookshelf_principles` → `bookshelf_insights` rename drift |
| 116 | SCOPE-2.F57 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-23 `SemanticSearchPanel` app-wide hook zero external consumers |
| 117 | SCOPE-2.F59 | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-24 pipeline + settings panel superseded by Build M |
| 118 | SCOPE-2.F6 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-03 theme count — code ships 46, spec + Convention #42 claim 38 |
| 119 | SCOPE-2.F60a | 2 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-24A dashboard backgrounds → Sticker Book pages supersession |
| 120 | SCOPE-2.F63 | 2 | Low | N | Y | Fix Next Build |  |  |  | PRD-24 screen features unbuilt — 5 viz modes ship 1, level threshold dormant, leaderboard scaffolding only |
| 121 | SCOPE-2.F7 | 2 | Low | N |  | Fix Next Build |  |  |  | PRD-03 shared component inventory mismatch across PRD-03 / Convention #44 / STUB_REGISTRY |
| 122 | SCOPE-2.F70 | 2 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-35 `access_schedules` field-name drift |
| 123 | SCOPE-2.F8 | 2 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-04 `/hub/tv` PlannedExpansionCard stub — PRD-14E Post-MVP |
| 124 | SCOPE-3.F10 | 3 | Low | N |  | Fix Next Build |  |  |  | Pattern 2H — Settings page missing nav entry points (4 PRD-22 cross-PRD entries + PRD-36 TimerConfigPanel + PR |
| 125 | SCOPE-3.F11 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-24 useUncompleteTask stub comment stale post-Build-M |
| 126 | SCOPE-3.F12 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-36 time_session_completed + time_session_modified events have zero listeners (wire to Build M gamification |
| 127 | SCOPE-3.F13 | 3 | Low | N |  | Intentional-Update-Doc |  |  |  | PRD-29 addendum marks stub sockets as WIRED despite no writer code existing (WIRING_STATUS convention violatio |
| 128 | SCOPE-3.F15 | 3 | Low | N |  | Intentional-Update-Doc |  |  |  | CLAUDE.md convention proposal: Lego Primitive Connector Documentation |
| 129 | SCOPE-3.F16 | 3 | Low | N |  | Intentional-Update-Doc |  |  |  | CLAUDE.md convention proposal: AI Model Selection is Registry-Driven (`invokeAI()` helper) |
| 130 | SCOPE-3.F17 | 3 | Low | N |  | Intentional-Update-Doc |  |  |  | CLAUDE.md addendum-writing habit proposal: consumer-missing vs never-built classification (Habit #9, prospecti |
| 131 | SCOPE-3.F18 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-08 Notepad→studio_queue orphan destinations + source tracking lost on direct destination writes |
| 132 | SCOPE-3.F21 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-26 Build-M-superseded surfaces: Reveal Task Tile + Mom Message Card + section-key data-driven layout |
| 133 | SCOPE-3.F23 | 3 | Low | N | Y | Fix Next Build |  |  |  | PRD-14 dashboard polish bundle (col_span + grid sharing + Today's Victories widget) |
| 134 | SCOPE-3.F24 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-14B polish bundle: calendar-parse-event + calendar_event_create + duplicate calendar_color + getMemberColo |
| 135 | SCOPE-3.F25 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-18 5 cross-feature wirings delivered as schema/type scaffolding (GIN index, rhythm_request enum, reflectio |
| 136 | SCOPE-3.F28 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-24 integration edges schema/primitive-only |
| 137 | SCOPE-3.F31 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-28 enum + compliance bundle (PRD-28B handoff + hourly + financial_approval dead enum values + homework app |
| 138 | SCOPE-3.F35 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-34 ThoughtSift implementation drift bundle |
| 139 | SCOPE-3.F4 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-35 convention surface unwired (calendar preview 2/3 consumers, weekStartDay, allowedFrequencies, _legacy_r |
| 140 | SCOPE-3.F40 | 3 | Low | N |  | Fix Next Build |  |  |  | PRD-21A minor wire-up + vault_tool_sessions tracking + Optimizer integration server layer |
| 141 | SCOPE-3.F42 | 3 | Low | N |  | Defer-to-Gate-4 |  |  |  | PRD-21C entire PRD deferred (cross-ref Round 0 Deferred list) |
| 142 | SCOPE-3.F7 | 3 | Low | N |  | Intentional-Update-Doc |  |  |  | Addendum self-reporting drift — 3 addenda assert completion facts code contradicts |
| 143 | SCOPE-3.F8 | 3 | Low | N | Y | Intentional-Update-Doc |  |  |  | Reusable animation/visual primitive library intentionally unassigned to production consumers (Lego/surge-prote |
| 144 | SCOPE-3.F9 | 3 | Low | N | Y | Intentional-Update-Doc |  |  |  | PRD-14 `dashboard_widgets.is_included_in_ai` widget toggle is no-op — drop column + UI toggle |
| 145 | SCOPE-4.F10 | 4 | Low | N |  | Intentional-Update-Doc |  |  |  | Notepad Review & Route + Smart List Import + Post-Meeting Review classifiers are Haiku-first with no embedding |
| 146 | SCOPE-4.F2 | 4 | Low | N |  | Intentional-Update-Doc |  |  |  | pgmq `embedding_jobs` pipeline dormant; polling-consumer is the real architecture |
| 147 | SCOPE-4.F3 | 4 | Low | N |  | Intentional-Update-Doc |  |  |  | `embed` pg_cron schedule undeclared in migrations |
| 148 | SCOPE-4.F6 | 4 | Low | N | Y | Intentional-Update-Doc |  |  |  | Heart/HeartOff UI toggle gaps across six context-source surfaces — hearts everywhere |
| 149 | SCOPE-4.F7 | 4 | Low | N |  | Intentional-Update-Doc |  |  |  | Board of Directors moderator interjection fires auto-default — revoke to opt-in-only |
| 150 | SCOPE-4.F8 | 4 | Low | N |  | Intentional-Update-Doc |  |  | SCOPE-4.F4 | ThoughtSift Decision Guide + Board of Directors bypass shared 3-layer context assembler |
| 151 | SCOPE-4.F9 | 4 | Low | N |  | Intentional-Update-Doc |  |  |  | `lila-message-respond` omits `recentMessages` parameter in `assembleContext` call — sliding window shrinks to  |
| 152 | SCOPE-5.F1 | 5 | Low | N | Y | Defer-to-Gate-4 |  |  |  | STUB_REGISTRY line 398 stale: Backburner/Ideas auto-provision is wired |
| 153 | SCOPE-5.F3 | 5 | Low | N |  | Intentional-Update-Doc |  |  |  | Partition-size estimates in operation plan drifted by order of magnitude from actual partition contents |

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
