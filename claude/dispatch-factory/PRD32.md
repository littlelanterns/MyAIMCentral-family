# Pre-Dispatch Pack — PRD32: Admin Console + Demand Validation + Vault Admin (PRD-32 / PRD-32A / PRD-21B)

> **Factory status:** synthesized → decisions-pending (6 decisions, batch 3)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD32. Priority: P2.
> Merge per founder D-002: PRD-21B rides as its own slice inside this pack.
> Evidence: `claude/dispatch-factory/PRD32-RECON.md`.
> Headline: the admin shell + Personas tab are REAL and to-spec; everything else is either absent
> (Vault CRUD, Feedback dashboards, Demand dashboard, System/Analytics tabs) or organically solved
> under different names (`ai_usage_tracking`, `beta_glitch_reports`, `platform-assets`). The right
> build is reconciliation-first: extend what shipped, never build the PRD's parallel twins.

## Why this pack matters (plain English)

Three founder-facing pains converge here: (1) demand votes are being collected with NO way to see
them; (2) 75 glitch reports are triaged via command-line SQL because there's no review screen;
(3) every new AI Vault item requires a hand-written database migration. This pack turns the
2-tab admin shell into the real console — without duplicating any of the infrastructure that
grew organically since the PRDs were written.

## Reconciliation rulings (newer wins — named explicitly)

1. **Reconciliation-first, never parallel twins.** `ai_usage_log` is NEVER built — Screen 6 reads
   `ai_usage_tracking` (38 Edge Functions already feed it; factory-verified). This locks arms with
   PRD-31 ruling D-PRD31-4. `feedback_submissions` is NEVER built — `beta_glitch_reports` (75 live
   rows, RICHER structured fields than the PRD's freeform) is EXTENDED with `submission_type`,
   `sentiment_flag`, `source`, `linked_known_issue_id`. Vault imagery targets the unified
   `platform-assets` bucket + `platform_assets` table, not the PRD's dedicated buckets. PRDs
   amended at close-out. (D-PRD32-1)
2. **`staff_permissions` completed additively** (`is_active`, `expires_at`) so Screen 1's roster UI
   builds to spec with soft-deactivate; `useIsAdmin` gains the is_active filter. All permission_
   type CHECK values already registered — DB was ahead of the UI. (D-PRD32-2)
3. **`platform_usage_log` is NOT built at beta scale** (3 families). Screen 4 Platform Overview
   aggregates live tables (`families`, `family_members`, `activity_log_entries`, feature tables).
   Revisit a dedicated adoption-event pipeline at real scale. (D-PRD32-3)
4. **Screen 3 Safety Config is DEFERRED to the PRD-30 build** — it CRUDs `safety_keywords`/
   `safety_resources`, which are PRD-30 tables that don't exist and are already sequenced
   (SAFETY-BETA-GATE → PRD-30, locked). The **Ethics Review sub-tab ships HERE** instead: its data
   source (`platform_intelligence.book_library.ethics_gate_status`) exists today. (D-PRD32-4)
5. **Intelligence Review = per-channel queues as producers exist, never the generic 12-channel
   table.** Channel D (Personas) is shipped and stays; the lens moderation drain (the still-true
   half of STUB L355-356) ships here; the "Platform Knowledge Promotion" parent-tab refactor
   happens when Channel E lands (forward note per Convention #258 / PRD-32 L1373 — recorded, not
   built).
6. **Minimal Moderation tab ships here** — lens queue drain + a "Blog Comments" filter placeholder
   — because PRD-38 is hard-blocked on its existence and the lens queue currently fills with no
   drain. Full PRD-21C engagement moderation stays with the PRD21C pack. (D-PRD32-5)
7. **"Suggest with LiLa" (admin metadata AI) is a new third AI category** — a staff-facing direct
   utility call, neither a `lila_guided_modes` conversation (#247 cat-1) nor a member-facing
   utility tool (#248 cat-2). Build ships a clarifying CLAUDE.md note naming "admin utility AI"
   (no context assembly, no gleaning, cost-logged, staff-gated). PRD-21B's own addendum
   anticipated this.
8. **Stale-registry corrections at close-out:** STUB L355-356 (persona half → Wired), STUB L94
   ("Admin user management ✅ Phase 39" is false → corrected honestly when the real roster UI
   ships in this build).
9. **`curation` rename is a done deal** (Convention #81) — the editor builds against it, no
   re-litigation.

## Slice plan (model routing per `.claude/rules/model-routing.md`)

| Slice | Scope | Routing |
|---|---|---|
| 1 | Foundations: `staff_permissions` +`is_active`/`expires_at` migration; Screen 1 Admin User Management (roster, per-tab permission checkboxes, expiry, soft-deactivate, hardcoded-lock display); ADMIN_TABS expansion + per-tab gating ENFORCED (the shell's noted gap); retire the orphaned ApprovalsPlaceholder or repoint it | Sonnet xhigh |
| 2 | **Feedback suite (founder's daily pain — first):** extend `beta_glitch_reports` (4 new columns per ruling 1); FAB gains Feature Request + Praise quick actions (Screen 10's 3 types); Feedback dashboard + Diagnostic Detail + **"Copy for Claude Code" formatter**; `known_issues` table + Resolution flow (Fixed/Known/Won't-Fix/Cannot-Repro) + hit counts; LiLa Help DB-backed known-issues lookup (layered before help-patterns.ts AI fallthrough, Convention #56 order); Settings feedback entry; **Demand Validation Dashboard (PRD-32A Screen 2: per-feature %, role breakdown, notes, CSV)** | Sonnet xhigh |
| 3 | **Vault Admin (PRD-21B slice, per D-002):** Content Dashboard (S1), adaptive Content Editor (S2, 6 types, platform-assets uploads), Prompt Pack Entry Manager (S3), Curation Manager (S3B), Category Manager (S4), Content Request Queue + Copy-All-Pending (S5), Content Analytics (S6), orphaned-image manager against platform-assets (S7), "Suggest with LiLa" admin utility + CLAUDE.md category note (ruling 7) | Sonnet xhigh |
| 4 | Analytics: Platform Overview (live-table aggregation per ruling 3); AI Cost Monitoring reading `ai_usage_tracking` (totals, per-family, by feature, by model, trend); Intelligence Review housing: Personas (exists) + Ethics Review sub-tab (`ethics_gate_status` drain) + lens moderation drain; Users & Families (Screen 2, read-heavy + disable/reset/note using `admin_notes` polymorphic table — build it, it's 20 lines of schema) | Sonnet xhigh |
| 5 | Minimal Moderation tab (lens drain lives here or in 4 — one home, not two; Blog Comments filter placeholder for PRD-38); E2E suite (`tests/e2e/admin/admin-console.spec.ts`: gating probes per permission type incl. non-admin block, feedback lifecycle, demand dashboard aggregation, vault CRUD round-trip, known-issues LiLa lookup); registry corrections; verification | Sonnet xhigh |
| Gates | Pre-build freshness audit + Checkpoint 5 | **Fable if available, else Opus** |

Deferred out of this pack (recorded): Screen 3 Safety Config → PRD-30 build; `reported_threats` →
PRD-30 build (its producer); per-family cost drill-down + admin activity log (Post-MVP, unchanged);
generic 12-channel review queue (superseded by per-channel pattern).

## Open founder decisions (D-PRD32-1..6 — batch 3)

| # | Decision | Recommendation |
|---|---|---|
| D-PRD32-1 | Reconciliation-first: extend `beta_glitch_reports` / read `ai_usage_tracking` / target `platform-assets`; never build the PRDs' parallel twins | Yes — one truth per concern; preserves 75 live reports and 679 cost rows |
| D-PRD32-2 | `staff_permissions` + `is_active`/`expires_at` now | Yes — tiny migration, unblocks Screen 1 to spec |
| D-PRD32-3 | Skip `platform_usage_log` at beta scale; Screen 4 aggregates live tables | Yes — 3 families don't need an event pipeline |
| D-PRD32-4 | Defer Safety Config to PRD-30's build; ship Ethics Review here (data exists) | Yes — don't build CRUD for tables that don't exist |
| D-PRD32-5 | Minimal Moderation tab here (lens drain + blog filter placeholder) | Yes — closes the real lens gap and unblocks PRD-38 |
| D-PRD32-6 | Slice order: Feedback+Demand (2) before Vault CRUD (3) before Analytics (4) | Yes — matches your daily pain order; flip 2↔3 if the vault-migration bottleneck hurts more than CLI triage |

## Dependency edges (manifest-mirrored)

- After (soft): PRD31 for the billing/credit analytics tie-ins (S6 works without it; thermometer
  linkage completes under PRD31). Independent otherwise — can dispatch before PRD31.
- Unblocks: PRD38 (Vault-admin sub-section + Moderation tab), lens-queue drain, glitch-triage
  retirement of CLI-skill stopgaps, demand-data visibility, vault content growth without
  migrations.
- Cross-pack contracts honored: D-PRD31-4 (ai_usage_tracking is THE cost source), Convention #258
  three-tier persona rules, COPPA tab row stays reserved for the PRD40 build.

---

## DISPATCH PROMPT (paste into a FRESH session — after D-PRD32-1..6 resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-32 + PRD-32A + PRD-21B — the Admin Console pack.
Pre-dispatch pack: claude/dispatch-factory/PRD32.md (9 rulings + 5-slice plan). Evidence:
claude/dispatch-factory/PRD32-RECON.md. All pack decisions RESOLVED per recommendations unless
the founder noted otherwise at approval.

FRESHNESS PREAMBLE: pack produced 2026-07-04. Run `git log --oneline --since=2026-07-04`; re-read
CLAUDE.md conventions added since; re-verify the recon's file:line refs (AdminLayout ADMIN_TABS,
PersonasAdminPage, GlitchReporterFAB, PlannedExpansionCard) before editing; check whether the
PRD-40 build landed (its /admin/coppa tab must slot into the registry you're expanding — never
collide with its reserved row); next free migration number re-checked immediately before every
push.

READ FIRST (in order):
1. prds/scale-monetize/PRD-32-Admin-Console.md — FULL read, every word (incl. the appended §13).
2. prds/scale-monetize/PRD-32A-Demand-Validation-Engine.md — FULL.
3. prds/ai-vault/PRD-21B-AI-Vault-Admin-Content-Management.md — FULL.
4. Addenda: PRD-32-32A-Cross-PRD-Impact, PRD-21B-Cross-PRD-Impact, PRD-32-Personas-Cross-PRD-
   Impact, PRD-34-Persona-Architecture-Addendum §6.
5. claude/dispatch-factory/PRD32.md + PRD32-RECON.md — the 9 rulings are LAW; where PRD text
   disagrees (ai_usage_log, feedback_submissions, dedicated buckets, generic review_queue), the
   ruling wins and you record each amendment in the feature-decision file.
6. Create .claude/rules/current-builds/PRD-32-admin-console.md (no YAML frontmatter), full
   pre-build summary per claude/PRE_BUILD_PROCESS.md, founder approval BEFORE code (Checkpoint 1).

BUILD SLICES 1→5 per the pack table. HARD RULES: NEVER create ai_usage_log, feedback_submissions,
platform_usage_log, or dedicated vault buckets — extend ai_usage_tracking readers,
beta_glitch_reports columns, and platform-assets paths instead; do not touch the shipped
PersonasAdminPage flow except to house it; Personas RPC auth contract (persona_admin|super_admin
SECURITY DEFINER, migration 100161) is the pattern for every new admin RPC; /admin/* has NO
sidebar presence by design (Convention #16 parity N/A); GlitchReporterFAB extensions keep the
Math Gate + feature flag; LiLa Help lookup order = known_issues DB check → help-patterns.ts →
AI (Convention #56 zero-cost-first preserved); admin utility AI ("Suggest with LiLa") gets the
CLAUDE.md category note per ruling 7; Convention #257 for any date logic.

PROOF: tests/e2e/admin/admin-console.spec.ts per the pack list (permission gating probes incl.
expired + deactivated staff, non-admin friendly block, feedback lifecycle end-to-end from FAB to
resolution + known-issue link, demand dashboard numbers vs seeded votes, vault CRUD round-trip
incl. prompt-pack entries + curation ordering, Ethics Review drain, lens moderation drain).
tsc -b clean, lint clean, regression pins green. Ask the founder before running shared-fixture
suites. NOTHING COMMITS until proof green AND founder eyes-on clears; selective staging; founder
confirms before push. Close-out: Checkpoint 5 zero-Missing, live_schema regen, STUB_REGISTRY
corrections (L94 false-wired row, L355-356 persona/lens split), retire or repoint the
bug-reports/bug-triage-merge skills note, CLAUDE.md additions, archive build file.
```
