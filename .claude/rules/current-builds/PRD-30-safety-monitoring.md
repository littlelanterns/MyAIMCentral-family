# Active Build: PRD-30 — Safety Monitoring

> **Status: APPROVED FOR DISPATCH — founder approved 2026-07-07: ALL recommendations (D1–D7); D6 = (a) wire an email provider, sequenced LAST within SM-C. No code written yet, no migration numbers reserved. Next action: founder pastes the SM-A dispatch prompt (below) into a fresh Sonnet session.**
> Auditor: Fable pre-build session 2026-07-06 (dispatched per the locked safety sequence: Layer 2 shipped 2026-07-04 → PRD-41 approved 2026-07-06 → **PRD-30 = this build**, the final item; its gate-exit completes the safety sequence and closes the Convention #247/PRD-30 monitoring backstop gap).
> Authority chain: `prds/platform-complete/PRD-30-Safety-Monitoring.md` + `prds/addenda/PRD-30-Cross-PRD-Impact-Addendum.md` → `claude/feature-decisions/PRD-30-Safety-Monitoring.md` (THE evidence record + judgment-area resolutions — read it first) → this file (scope + slices) → newer-wins rulings: PRD-41 Founder Decision Record 2026-07-06 (no-side-door/no-excerpt), Safe-Harbor backburner 2026-06-09.
> **Migration discipline: NO numbers reserved.** Take the next free number at file-creation time and re-verify immediately before applying; if foreign unapplied migrations are pending, apply only this build's idempotent SQL via `supabase db query --linked -f` — never batch-push other sessions' work.
>
> 2026-07-06 — Step 0 override (Convention #241, founder-approved this session): endor-cli-tools (AURI) probe skipped by founder instruction (known-down since 2026-07-05); codegraph stale lock cleared with founder approval and re-probed HEALTHY (880 files / 10,067 nodes / 16,978 edges), but founder directed Grep/Glob-only for this audit regardless. Known gap: AURI security scanning unverified this build (read-only audit — no code written, low impact; implementation workers should re-run Step 0).

---

## Source material read (this session, in full)

- `prds/platform-complete/PRD-30-Safety-Monitoring.md` (877 lines, every word)
- `prds/addenda/PRD-30-Cross-PRD-Impact-Addendum.md` (the only PRD-30 addendum, glob-verified)
- `prds/addenda/PRD-Audit-Readiness-Addendum.md` (always-relevant; meta-guidance only)
- `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` (checked — zero safety rows; general rules only)
- `prds/foundation/PRD-41-LiLa-Runtime-Ethics-Enforcement.md` (approved 2026-07-06 — the integration substrate; its §Cross-PRD Impact draws the PRD-30 boundary verbatim)
- `claude/feature-decisions/Safety-Beta-Gate.md` + `.claude/rules/current-builds/SAFETY-BETA-GATE.md` (shipped Slices A/B/C state; §3 crisis call-path table; §4 PRD-30 unbuilt verification)
- `claude/feature-decisions/Safe-Harbor-Backburner-Decision.md`
- CLAUDE.md Conventions #7/#143/#243/#247 (+ #6, #248, #273, #274, #275 where they bind)
- `claude/live_schema.md` (PRD-30's 7 tables absent; `safety_scanned` dormant on both lila tables) + live-code Grep verification (email infra absent, DND bypass wired, 14 lila_messages writers, no conversation 'closed' state)

## The headlines the founder needs

1. **PRD-30 is cleanly buildable now — and cheaper than the PRD planned.** Everything it depends on exists: notifications with the `priority='high'` DND bypass ALREADY WIRED at the read layer (`useNotifications.ts:43-48`), cron infrastructure (Convention #246), the no-training Haiku client, the dormant `safety_scanned` columns from migration 7, and PRD-41's freshly-standardized queue/column-guard patterns. Detection needs **zero changes to any LiLa Edge Function** if we poll instead of hooking the request path (D1) — the March PRD couldn't know July's infrastructure.
2. **One real conflict to resolve: the PRD's flag detail view shows mom conversation excerpts; your 2026-07-06 no-side-door ruling forbids exactly that** while the kid-privacy carve-out is frozen pending attorney advice. Recommended: capture everything, column-guard it (service-role only, PRD-41's exact mechanism), ship the flag view in no-excerpt mode (category + severity + "how to bring this up" + resources), unlock later via GRANT + UI. Newer ruling wins (D2).
3. **One dependency is genuinely missing: outbound email does not exist anywhere on the platform** (`notify-out-of-nest` is an explicit stub). PRD-30 promises email alerts + digest emails. Decide: wire an email provider in this build, or ship in-app-only with email stubbed (D6). A safety net that only reaches mom inside the app is weaker than the PRD's promise — but provider wiring is its own small project.
4. **PRD-20's teen-disclosure channel is gone** (Safe Harbor backburnered took the AI Literacy Module with it). Without a replacement, teen monitoring becomes undisclosed surveillance — against the PRD's own principle. Recommended home: a standing row in the teen What's Shared panel (D4).
5. **Coverage gap confirmed and closed in-plan:** `bookshelf_discussion_messages` persists LiLa conversations outside `lila_messages` — the PRD's pipeline would never see them. The plan adds `safety_scanned` columns there and makes flag records polymorphic. Family-chat messages (`messages` table) stay deferred per the PRD + Convention #141.
6. **Convention #243's enforcement mechanism lands in this build by the convention's own text** ("lands with the first aggregation PRD build — PRD-19, PRD-28B, or PRD-30, whichever ships first"). PRD-30 is first.

## Founder decisions — RESOLVED 2026-07-07 ("All recommendations approved; D6 = (a), sequenced last in SM-C")

All seven resolved as recommended. D1 polling architecture ✅ · D2 no-excerpt flag view with column-guarded capture ✅ · D3 severity-tiered DND (Critical+Warning bypass; Concern quiet) ✅ · D4 teen What's-Shared disclosure row ✅ · D5 crisis-hit flag wiring on the three non-persisted surfaces ✅ · **D6 = (a): email provider wiring IS in scope, built as the LAST item of SM-C** (founder supplies API key + domain DNS at that point) ✅ · D7 FO per-member column section ✅. Original decision text preserved below for the workers' context:

### (original decision list, for reference)

1. **D1 — Polling architecture (recommended: YES).** Both detection layers run via a cron-invoked `safety-classify` sweep (every minute) polling the `safety_scanned` flags, instead of the PRD's "synchronous hook in the message pipeline." Same behavior, ≤ ~60-90s detection latency (immaterial — flags are invisible to the member; real-time crisis response already exists in the request path per Convention #7), zero retrofit across 16 Edge Functions, zero new failure modes in family conversations, and the monitored/sensitivity/tier gates live in one place. The PRD's own schema (polling-shaped partial index, migration 7) was built for this.
2. **D2 — No-excerpt flag view (recommended: YES — mirrors your PRD-41 ruling).** `context_snippet` / `matched_keywords` / `classification_reasoning` are captured at detection time but column-guarded (service-role only); mom's flag detail shows category + severity + surface + timestamp + conversation starter + resources — never the kid's words. Starter generation receives category/age/severity only, so it structurally cannot quote the conversation. Unlock when attorney advice clears = GRANT + UI change, no schema change, no data loss.
3. **D3 — Severity-tiered DND line (recommended: Critical + Warning bypass DND; Concern records quietly).** Refines Convention #143's blanket bypass: a Low-stakes profanity Concern should not buzz through DND at 2am — it lands in history/FO/digest instead. All severities stay locked-ON (mom cannot disable the safety category); DND-respect applies to Concern only. Alternative: keep the blanket bypass per #143's letter and rely on sensitivity tuning alone.
4. **D4 — Teen disclosure replacement (recommended: What's Shared panel row).** Standing, general-wording entry in the teen transparency panel when monitoring is active ("if you ever tell LiLa something that sounds like you might be in danger, the app quietly lets mom know") — replaces the backburnered PRD-20 AI Literacy Module as the "not hidden surveillance" channel. Guided/Play kids get no disclosure surface (their conversations are already mom-visible by default; parent-side FeatureGuide carries the talk-to-your-kids guidance).
5. **D5 — Crisis-hit → flag wiring on non-persisted surfaces (recommended: YES, narrow).** Persisted conversations get crisis coverage automatically (crisis keywords seed into `safety_keywords` at Critical). But mindsweep-sort (teen brain dumps), mindsweep-scan, and message-coach show crisis resources to the member and **mom never knows** — the content never lands in a scannable table. A thin fire-and-forget flag write at those three existing `detectCrisis` hit sites closes it (~5 lines each, Slice B pattern). Scope guard: those three surfaces only; anything wider is scope creep.
6. **D6 — Email delivery (genuine either-way decision; recommendation: wire it, minimally).** Options: (a) **Wire a provider now** (Resend is the standard Supabase pairing; needs an API key + domain DNS from you) — Critical-flag emails + weekly digest emails ship as the PRD promises, and it unblocks Out of Nest emails + PRD-15 email prefs platform-wide; ~a slice-sized addition. (b) **Stub email** — ship in-app-only (bell + DND bypass), channels UI shows email as coming-soon, STUB_REGISTRY entry. Recommendation leans (a) because a safety alert that can't reach mom outside the app undercuts the feature's core promise, and this is the platform's third feature waiting on the same missing brick — but (b) is honest and ships faster.
7. **D7 — FO section shape (recommended: per-member column section).** The PRD's Screen 5 mockup (March) is a single summary card; Family Overview has since become the per-member column command center (Convention #275). Recommended: register `safety_monitoring` as a column section — each monitored kid's column shows "1 new flag (Warning) [Review →]" / "No flags ✓", hidden for unmonitored members, visible to mom + granted dad only. Same content, FO-native shape.

## Dependencies already built (verified live)

- `notifications` table + read-layer DND bypass for `priority='high'` (SCOPE-2.F40 / Convention #143) + NotificationTray safety styling + tap-through `action_url` routing
- pg_cron + Vault + `util.invoke_edge_function` (Convention #246); `--no-verify-jwt` + in-code bearer pattern (SAFETY-BETA-GATE precedent)
- Shared no-training OpenRouter client (NOTRAIN-HARDEN); Zod/temperature-0/cost-logging Haiku pattern (PRD-41 spec)
- `lila_messages.safety_scanned` + `lila_conversations.safety_scanned` (migration 7, dormant, polling index in place)
- Crisis gates on every AI function (Slice B) + `safety-preamble.ts` Layer 2 (Slice A) + endpoint auth (Slice C) — PRD-30 stacks on a safe foundation
- `auto_provision_member_resources` trigger (extension point), TeenTransparencyPanel (disclosure home), SettingsPage inline sections, FO `mergeSectionOrder` read-time graft, ModalV2, MomOnlyRoute/View-As invisibility machinery, leak-pass E2E fixture patterns

## Dependencies NOT yet built (and their disposition)

- **Outbound email** — does not exist platform-wide (`notify-out-of-nest` is a stub). → D6.
- **Push notifications** — PRD-33. → stub per PRD.
- **Admin keyword UI** — PRD-32. → stub per PRD; keywords seeded + SQL-managed.
- **PRD-20 AI Literacy Module** — backburnered. → replaced by D4; never rebuilt here.

## Build Items (slice plan — Sonnet xhigh workers, sequential; each slice = one dispatch)

### Slice SM-A — Detection foundation (data + pipeline, zero UI)
1. Migration (next free number; idempotent): 7 tables per the decision file's §Database Changes (incl. polymorphic `safety_flags` conversation ref + `surface` + defensive `is_safe_harbor` + **column-level content guard** on the three content-bearing columns); `bookshelf_discussion_messages.safety_scanned` + `bookshelf_discussions.safety_scanned` + partial indexes; RLS per PRD (mom CRUD configs; recipients read flags/summaries; flagged member sees NOTHING; no DELETE policy on flags); `updated_at` triggers; `auto_provision_member_resources` extension (from CURRENT production definition — child ON / adult OFF / skip `role='family'` + special adults / mom → recipient row); **backfill for all existing families' members**; seeds: ≥50 `safety_keywords` across 8 categories (slang variants + `CRISIS_KEYWORDS` at Critical, authored together with the test corpus) + `safety_resources` with verified numbers; feature keys upserted into `feature_key_registry` + `feature_access_v2`. After apply: `npm run schema:dump`.
2. `safety-classify` Edge Function (dedicated, `--no-verify-jwt`, in-code service-role bearer, structured count logging): Layer 1 keyword sweep (word-boundary + phrase + negation-still-triggers, monitored members only, sensitivity filtering with the three locked categories enforced in code) → Layer 2 Haiku conversation classification (30-min-quiet + unscanned conversations; re-opened conversations re-classify via the scanner-owned flag reset; retry ×3 → park) → flag generation (dedup 24h window, layer-disagreement lower-severity rule, >5/day consolidation) → content-free starter generation → consolidated `notifications` write per D3's severity table → tier gate (`safety_monitoring_ai` for Layer 2/starters, beta bypass honored).
3. Cron jobs via `util.invoke_edge_function`: per-minute sweep (offset from embed + validate-ai-output) + Sunday-night weekly summary job.
4. Convention #243 grep-CI check (safety scanning = the documented exception; everything else filters `is_safe_harbor=false`).
5. Proof: corpus vitest (keyword hits per category + benign contrast set must NOT hit + negation cases + locked-category floor); Playwright pipeline pins with service-role fixtures (SAFETYMON prefix, swept): seeded user message → flag row + notification row; sensitivity=Low suppresses Concern; dedup consolidates; Critical notification is `priority='high'`; **RLS leak probes: kid session cannot read any safety table; dad without grant cannot read flags; dad with grant can; content columns unreadable even to mom's session (column guard)**.

### Slice SM-B — Mom surfaces
6. Settings → Safety Monitoring section (Screen 1; primary-parent-only) + per-member sensitivity modal (Screen 2; locked rows pinned High with Lock icon; shell-type defaults).
7. Flag detail (Screen 3, **no-excerpt mode** per D2) + flag history (Screen 4, filters + time grouping + muted dismissed) + notification tap-through routing.
8. FO `safety_monitoring` column section per D7 (mergeSectionOrder graft; recipients-only visibility).
9. Dad granted-recipient read path (flags + history via his notifications; zero config access).
10. Teen What's Shared disclosure row per D4.
11. FeatureGuide + `help-patterns.ts` + `feature-guide-knowledge.ts` (Convention #14 Part B); PermissionGate wiring; View-As invisibility checks.
12. Proof: E2E spec extension (config toggles persist; locked category cannot be lowered through the UI or the API; flag review transitions one-way; history filters; kid/teen shells render zero safety surfaces; View-As leak probe) + **Convention #277 eyes-on tour** (mom desktop/tablet/mobile + teen What's-Shared row + dad-granted view), screenshots read and Mom-UI table below filled.

### Slice SM-C — Digests, acute-surface wiring, email
13. Weekly pattern summaries: cron → per-monitored-member `safety_pattern_summaries` row (counts + trend) + content-free Haiku narrative + quiet in-app digest notification; zero-flag members get "No concerns detected" only if digest enabled.
14. D5 crisis-hit flag wiring: fire-and-forget helper at the `detectCrisis` hit sites in mindsweep-sort, mindsweep-scan, message-coach (surface-stamped flags, `conversation_table` NULL). Static pin asserts exactly these three sites (no silent spread).
15. **D6 = (a), LAST item of the slice:** email provider wiring (Resend recommended) — a shared, reusable `send-email` capability (Edge Function or `_shared` module), Critical-flag emails + weekly digest emails, recipient `notification_channels` honoring, `email_sent_at` stamping. Founder supplies the API key + domain DNS records at this step — the worker STOPS and requests them before building this item, and if they aren't available, ships everything before it and registers email as a same-slice follow-up rather than blocking the slice. Out-of-Nest/PRD-15 email consumers are NOT wired here (follow-ups) — but the sender must be built shareable so they can be.
16. Proof: digest pins (summary row + notification; narrative contains no conversation content); crisis-flag pins per surface; email pin (Critical flag → email queued/sent for enabled recipient; Concern → no email); full regression sweep (safety-beta-gate 58, leak-pass, permissions-wiring, fo-command-center, kids-rewards pins — ask founder before running shared suites); `tsc -b` + lint clean.

**Gate exit (Checkpoint 5):** post-build-verifier audit — every PRD MVP checklist item + every D-decision outcome Wired/Stubbed with zero Missing; verification table copied to the feature decision file; founder sign-off. **This closes the locked safety sequence** (Layer 2 → PRD-41 → PRD-30). Note: PRD-41 Slice E ships separately and remains the Convention #247 beta-gate half; PRD-30 is the monitoring backstop on top.

## Model routing (per `.claude/rules/model-routing.md`)

- Implementation slices SM-A/B/C: **Sonnet 5 workers at xhigh** (`/model claude-sonnet-5[1m]`), one fresh session per slice, sequential.
- Judgment gates (this pre-build audit done; Checkpoint 5 post-build-verifier; any escalated debugging): **Fable if still available, else Opus at high effort** — Fable intro pricing ends 2026-07-07 and the routing policy's revisit date arrives with it; do not assume Fable availability in dispatch prompts written after that date.
- Haiku only for mechanical sweeps (never screenshot judgment — Convention #277 lesson: judgment is Sonnet-minimum).

## Stubs (NOT building — full rationale in the feature decision file)

Context-snippet mom-visibility (frozen; captured + column-guarded; unlock = GRANT + UI) · PRD-15 message scanning incl. Ask-LiLa-&-Send (Convention #141 tension) · journal scanning · push (PRD-33) · auto-sensitivity suggestions · admin keyword UI (PRD-32) · trend charts · LiLa proactive check-ins · multi-turn probing detection (PRD-30-adjacent per PRD-41, not MVP) · Safe Harbor anything (defensive flag only) · Permission Hub recipient-grant row · Out-of-Nest/PRD-15 email *consumers* (the SM-C email sender is built shareable; wiring those consumers is follow-up work). Email itself is NOT a stub — D6 resolved (a).

## Key Decisions (architectural — full versions + evidence in the feature decision file)

- **J1:** PRD-41 watches LiLa's output; PRD-30 watches the member's input — no double-scanning; reuse patterns (cron/status-columns, no-training client, column guards, under-13 stamping), never tables.
- **J2/D2:** capture-everything + column-guard + no-excerpt UI; starter generation is structurally content-free.
- **J3/D3:** Critical/Warning bypass DND; Concern records quietly; refines Convention #143.
- **J4:** three conversation stores enumerated; bookshelf discussions join the pipeline; `messages` deferred deliberately.
- **J5:** PRD-20 stripped — dependency dropped, Safe-Harbor rule defensive-only, disclosure rehomed (D4), Convention #243 CI check lands here.
- **D1:** polling sweep, not request-path hooks — zero-touch detection across all 14+ writer functions.
- Flags are permanent, celebration-only-compatible (flags are FOR mom, invisible to the member; nothing punitive ever renders to a child).

## Dispatch prompts (paste each into a FRESH session, in sequence, one at a time after the prior slice's checkpoint passes)

**Universal rules baked into every slice (do not re-litigate in-session):**
- Read `claude/feature-decisions/PRD-30-Safety-Monitoring.md` FIRST — it is the requirement list (J1–J5 resolutions, D1–D7 rulings, schema deviations, key PRD decisions 1–17). Then this build file. Then the PRD itself for any detail the decision file references. No scope trimming, no "simpler for now."
- Proof = Playwright + vitest driving REAL flows with service-role DB assertions (SAFETYMON fixture prefix, swept beforeAll+afterAll, zero residue). A pin that only checks a modal opened is a failed deliverable.
- Migration protocol: next FREE number at file-creation time, re-check right before applying; if foreign unapplied migrations are pending, apply ONLY yours via `supabase db query --linked -f` with idempotent SQL. After apply: `npm run schema:dump`.
- Lucide icons only, no emoji (PRD mockups' ⚙️/🔴/📞 render as Lucide + theme tokens); zero hardcoded colors; ModalV2 for all modals.
- The three locked categories (self_harm, abuse, sexual_predatory) are enforced High IN CODE regardless of stored values. The content-bearing columns (`context_snippet`, `matched_keywords`, `classification_reasoning`) are service-role-only via column-level REVOKE/GRANT — no UI, no API path may expose them (founder no-side-door ruling).
- Run Step 0 tool health (Convention #241) at session start — the 2026-07-06 audit override does not carry forward.
- Ask the founder before running full shared Playwright suites (fixtures shared across windows) and before deploying ANY Edge Function. NOTHING COMMITS until proof is green and founder confirms; selective staging of this build's files only (check git status — other sessions run in parallel).

### SM-A — Detection foundation (data + pipeline, zero UI)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the SM-A worker for PRD-30 Safety Monitoring — the detection
foundation: schema, seeds, the safety-classify sweep, crons, and pipeline
proof. Zero UI in this slice. Pre-build complete, founder-approved
2026-07-07, all decisions RESOLVED (D1-D7 in the active build file).

READ FIRST (in order):
1. claude/feature-decisions/PRD-30-Safety-Monitoring.md — THE requirement
   list. §Database Changes is your migration spec (7 tables + the
   polymorphic safety_flags deviations + column-level content guard +
   bookshelf safety_scanned columns + backfill + trigger extension +
   seeds). §Key PRD Decisions 1-17 are behavior law.
2. .claude/rules/current-builds/PRD-30-safety-monitoring.md (auto-loads) —
   Build Items 1-5 are your scope, universal rules above.
3. prds/platform-complete/PRD-30-Safety-Monitoring.md — §Detection
   Pipeline, §Data Schema, §Edge Cases (dedup, layer disagreement,
   consolidation, retry) in full.
4. prds/foundation/PRD-41-LiLa-Runtime-Ethics-Enforcement.md §Data Model +
   §Edge Function Architecture — your pattern templates (column guard,
   cron + status polling, batch claim SKIP LOCKED, no-training Haiku with
   Zod + temperature 0 + cost logging, structured count logging).
5. supabase/functions/_shared/crisis-detection.ts — CRISIS_KEYWORDS seeds
   into safety_keywords at base_severity='critical'.

NON-NEGOTIABLES:
- D1: detection is a POLLED sweep (safety-classify Edge Function, cron
  every minute via util.invoke_edge_function, --no-verify-jwt + in-code
  service-role bearer). Do NOT touch any LiLa Edge Function in this slice.
- Layer 1 scans USER-role rows only, monitored members only, from
  lila_messages AND bookshelf_discussion_messages. Layer 2 classifies
  quiet-30-min conversations/discussions; the scanner itself resets the
  conversation-level flag when new user messages arrive (single-writer).
- Sensitivity filtering with locked-High categories enforced in code;
  tier gate (safety_monitoring_ai for Layer 2 + starters) honoring the
  beta useCanAccess bypass; dedup 24h; >5/day consolidation;
  layer-disagreement lower-severity rule; negation still triggers.
- Conversation-starter Haiku prompt receives category + age + severity
  ONLY — never conversation content (structurally leak-proof, D2).
- Notifications per the D3 severity table: Critical/Warning =
  category 'safety', priority 'high' (read-layer DND bypass already
  exists); Concern = priority 'normal'. notification_type='safety_flag',
  consolidated per conversation, action_url to the flag detail route
  (SM-B builds the page; route string agreed in the decision file).
- Seeds born-calibrated: author the ≥50-keyword library TOGETHER with the
  vitest corpus (violation set + benign contrast set that must NOT hit).
  safety_resources numbers must be verified-real (988, Crisis Text Line,
  NDVH, SAMHSA, NEDA...).
- auto_provision_member_resources extension: base the rewrite on the
  CURRENT production definition (copy-stale-body failure mode is
  documented); child ON / additional_adult OFF / skip role='family' +
  special adults; mom → recipient row; idempotent backfill for existing
  families.
- Convention #243 grep-CI check ships in this slice (safety scanning =
  the documented exception).
PROOF: corpus vitest green; tests/e2e/features/safety-monitoring.spec.ts
pipeline pins — seeded user message → flag + notification rows;
sensitivity=Low suppresses Concern; locked category floor holds even with
a tampered DB value; dedup consolidates; re-opened conversation
re-classifies; RLS leak probes (kid session reads NOTHING from any safety
table; ungranted dad blocked; granted dad reads flags; content columns
unreadable even to mom's session); tsc -b clean; lint clean. Fill your
rows in the build file's progress log.
```

### SM-B — Mom surfaces

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the SM-B worker for PRD-30 Safety Monitoring — every mom-facing
surface. SM-A (detection pipeline) is shipped; read its progress-log entry
in the active build file for the live table/function/route reality before
writing anything.

READ FIRST: claude/feature-decisions/PRD-30-Safety-Monitoring.md
(§Screens & Components is your build list; J2/D2 no-excerpt rule; D3/D4/D7
rulings), the active build file (Build Items 6-12 + universal rules +
SM-A progress log), PRD-30 §Screens 1-5 in full.

SCOPE:
6. Settings → "Safety Monitoring" SettingsSection (Screen 1) —
   primary-parent-only (dad NEVER sees config even when granted); mom's
   recipient row locked ON with Lock icon; per-member toggles + gear.
7. Per-member sensitivity modal (Screen 2, ModalV2 transient) — 8
   categories, locked rows pinned High, shell-type defaults per PRD,
   Reset to Defaults.
8. Flag detail (Screen 3) in NO-EXCERPT MODE — severity banner (Critical
   expanded, error tokens), plain-language category labels (PRD-41 log
   precedent — never enum strings, never clinical vocabulary), timestamp,
   surface, "How to Bring This Up" starter, curated resources,
   Acknowledge / Dismiss (one-way, no delete). NO context block — it is
   frozen pending attorney advice; do not render, do not fetch (the
   columns are service-role-only and will error anyway).
9. Flag history (Screen 4) — member/category/time filters, time grouping,
   muted dismissed rows, pagination, tap → detail.
10. FO 'safety_monitoring' per-member column section (D7) via
    mergeSectionOrder graft — recipients-only visibility, "N new flags
    [Review →]" / "No flags ✓", hidden for unmonitored members.
11. Notification tap-through routing; dad granted-recipient read path
    (flags + history, zero config).
12. Teen What's Shared disclosure row (D4) in TeenTransparencyPanel —
    standing general-wording entry when monitoring is active for that
    teen.
13. FeatureGuide (featureKey safety_monitoring_basic) + help-patterns.ts
    + feature-guide-knowledge.ts (Convention #14 Part B); PermissionGate
    wiring; Convention #16 mobile-nav parity N/A check (no new top-level
    page — Settings/FO/modals only; confirm and note it).
PROOF: extend safety-monitoring.spec.ts — config persists; locked
category cannot be lowered via UI OR direct API write; status transitions
one-way; filters; kid/teen/play shells render ZERO safety surfaces;
View-As leak probe; granted-vs-ungranted dad. Then the Convention #277
eyes-on tour (EYES_ON_TOUR-gated spec, desktop/tablet/mobile, mom + teen
+ granted dad + guided/play zero-surface shots), READ every screenshot,
fill the Mom-UI Verification table in the active build file.
```

### SM-C — Digests, acute-surface wiring, email (email LAST — founder D6a)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the SM-C worker for PRD-30 Safety Monitoring — the closing slice:
weekly digests, crisis-hit flag wiring on non-persisted surfaces, and
email delivery (LAST, per founder D6=(a) sequencing). SM-A and SM-B are
shipped; read their progress-log entries in the active build file first.

READ FIRST: claude/feature-decisions/PRD-30-Safety-Monitoring.md (D5/D6
rulings, J4 non-persisted surface list), the active build file (Build
Items 13-16 + universal rules + progress logs), PRD-30 §Pattern Summary +
§Edge Cases.

SCOPE (in this order):
13. Weekly pattern summaries: Sunday-night cron (util.invoke_edge_function)
    → safety_pattern_summaries rows (JSONB counts + trend vs prior week)
    + Haiku narrative generated FROM COUNTS ONLY (never conversation
    content) + quiet in-app digest notification (priority 'normal').
    Zero-flag members: "No concerns detected" only when digest enabled.
14. D5 crisis-hit flag wiring — EXACTLY three surfaces: mindsweep-sort,
    mindsweep-scan, message-coach. Fire-and-forget helper at their
    existing detectCrisis hit sites (~5 lines each, never-throws,
    Slice-B pattern): Critical safety_flag with conversation_table NULL +
    surface stamped + notification. Static pin asserts exactly these
    three call sites so it can never silently spread.
15. EMAIL (LAST): STOP and request the founder's provider API key +
    domain DNS before building. Then: shared reusable email sender
    (Resend; _shared module or dedicated function — pick the shape that
    PRD-15/Out-of-Nest can consume later), Critical-flag alert emails +
    weekly digest emails for recipients with 'email' in
    notification_channels, email_sent_at stamping, no conversation
    content in any email body (same no-excerpt law). If credentials
    aren't available when you reach this item, ship items 13-14, record
    email as the slice's explicit open item in the progress log, and do
    NOT invent a fake sender.
16. PROOF: digest pins (row + notification; narrative content-free);
    crisis-flag pin per surface (crisis text into each → flag row + mom
    notification, member still sees resources); email pins (Critical →
    email path fires for enabled recipient; Concern → no email); static
    call-site pin; full regression sweep after founder go-ahead
    (safety-beta-gate 58 MUST stay green — you are touching three of its
    functions — plus leak-pass, permissions-wiring, fo-command-center,
    kids-rewards); tsc -b + lint clean.
CLOSE-OUT: this is the final slice — fill the Post-Build Verification
table (every PRD MVP item + D1-D7 outcome, zero Missing), copy to the
feature decision file, complete Convention #14 Part B docs (STUB_REGISTRY,
WIRING_STATUS section, CLAUDE.md convention entries from PRD §CLAUDE.md
Additions as amended by the decision file, live_schema regen), then hold
for the founder-gated Checkpoint 5 post-build-verifier session
(Fable-if-available-else-Opus).
```

## Mom-UI Surfaces

- Settings → Safety Monitoring section + sensitivity modal — shells: mom only, new
- Flag detail modal + flag history view — shells: mom (+ granted dad read), new
- Family Overview `safety_monitoring` column section — shells: mom (+ granted dad), new section
- NotificationTray safety alerts + tap-through — shells: mom (+ granted dad), modification (styling exists)
- Teen What's Shared disclosure row — shells: independent, modification
- Kid/Play/Guided/Special-Adult shells: **zero surfaces** (verified absence is itself a test target)

## Progress Log

*(Each slice worker appends its entry here at checkpoint: what shipped, migration numbers actually taken, deviations found, live table/function/route reality for the next slice. Canonical flag route: `/safety-flags` + `?flag=<id>` — pinned in the decision file's Screen 4 row.)*

- SM-A: *(pending dispatch)*
- SM-B: *(pending SM-A)*
- SM-C: *(pending SM-B; email item last — founder supplies Resend API key + DNS at that step)*

## Mom-UI Verification

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Settings Safety Monitoring section + sensitivity modal (locked rows) | | | | mom | | |
| Flag detail (no-excerpt) + acknowledge/dismiss | | | | mom | | |
| Flag history (filters, grouping, muted dismissed) | | | | mom | | |
| FO safety column section | | | | mom + granted dad | | |
| Safety notification + tap-through | | | | mom | | |
| Teen What's Shared disclosure row | | | | independent | | |
| Kid shells zero-surface check | | | | guided + play | | |

## Post-Build Verification

*(Checkpoint 5 — every PRD MVP item + D1–D7 outcome: Wired / Stubbed / Missing. Zero Missing required.)*

| Requirement | Status | Evidence |
|---|---|---|
| *(populated at build close-out)* | | |
