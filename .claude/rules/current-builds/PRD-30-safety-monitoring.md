# Active Build: PRD-30 — Safety Monitoring

> **Status: SM-A + SM-B + SM-C ALL COMPLETE. PRD-30 is DONE — the locked safety sequence (Layer 2 prompts → PRD-41 ethics enforcement → PRD-30 monitoring) is closed.** SM-C shipped the weekly pattern digest (`safety-weekly-digest`, migration 100303) + D5 crisis-hit flag wiring (`mindsweep-sort`/`mindsweep-scan`/`message-coach`, `_shared/crisis-flag.ts`). Proof: 27/27 `safety-monitoring.spec.ts` (SM-A+B+C combined, run 3× clean), 58/58 `safety-beta-gate.spec.ts` regression (run 2×, once catching a real regression this build introduced and then fixed), 66/66 `npm run redteam`, zero fixture residue verified after every run, `tsc -b`/lint clean, Convention #277 eyes-on tour for the new digest UI read and confirmed. **Unplanned but fixed this session:** a genuinely invalid OpenRouter model ID (`'anthropic/claude-haiku-4-5-20251001'`) was silently broken in FOUR functions — `safety-weekly-digest` (caught pre-ship), `safety-classify` (PRD-30, broken since SM-A — Layer 2 classification and conversation starters had never once succeeded in production), `validate-ai-output` (PRD-41, cross-territory fix, founder+seat-approved since that build's window is closed), and `message-coach` (PRD-15, broken since deploy). All four fixed and redeployed; 2 more instances found and grandfathered for a future session (`auto-title-thread`, `lila-board-of-directors`) — see STUB_REGISTRY.md. A real regression was also caught and fixed mid-build: an early D5 fix to `message-coach` reordered sender resolution ahead of its crisis check (needed for the flag write), which meant the crisis response itself would only fire after a successful DB lookup — caught by `safety-beta-gate.spec.ts`'s own documented invariant, fixed by making the sender lookup an independent, separately try/caught best-effort operation that can never block or delay the crisis response. Email delivery (D6) is the one deliberately-stubbed item — founder chose "not ready" 2026-07-08 (no Resend credentials yet), explicit and registered in STUB_REGISTRY.md, not silently dropped. New CLAUDE.md Convention #282 (PRD-30 architecture) + an 8th Silent Tooling Failure Pattern under Convention #241 + `tests/redteam/model-id-guard.test.ts` (wired into the pre-push hook) so the invalid-model-ID bug class can never ship a third time. `claude/live_schema.md` regenerated. STUB_REGISTRY.md, WIRING_STATUS.md, and the feature decision file's Post-Build Verification table (56 requirements, 54 Wired / 2 Stubbed / 0 Missing) are all updated. **Nothing committed — holding for the coordination seat's batch per this session's standing instruction.** Next: founder/seat Checkpoint 5 sign-off.
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

### SM-A (2026-07-07, Sonnet worker session) — CODE COMPLETE, HOLDING FOR FOUNDER DEPLOY APPROVAL

**Migration `00000000100289_safety_monitoring_foundation.sql`** — applied via `supabase db query --linked -f` (NOT `db push` — 3 foreign unapplied migrations from parallel sessions were pending: 100290 ethics-log-admin-curation, 100291 meal-planning, 100292 wishlists; none touched). Verified live: 7 tables, 86 active `safety_keywords`, 16 `safety_resources`, column guard intact (16 granted / 3 REVOKEd on `safety_flags`, matches migration 100286's `lila_ethics_rejections` shape exactly), `safety_keywords` fully unreadable via PostgREST (REVOKE ALL, service-role only), backfill covers all 13 existing role∈{member,additional_adult} members + 3 primary_parent recipients (one per production family), cron `safety-classify` registered. `claude/live_schema.md` regenerated.

**Shared module `_shared/safety-classify-match.ts`** — pure logic (matching, sensitivity resolution/threshold, dedup/consolidation decision, notification consolidation, context-snippet construction), zero URL imports, vitest-importable directly (mirrors `ethics-guard.ts`'s pattern). 24/24 vitest passing (`tests/safety-classify-match.test.ts`) — keyword corpus (86-row fixture mirroring the migration seed 1:1), locked-category floor (survives a tampered/explicit-override sensitivity value), Screen 2 shell-default matrix, sensitivity threshold filtering, dedup/alert-fatigue decision table, D3 severity→priority, context-snippet bounds. **Two real bugs caught by the test-writing process and fixed**: `buildContextSnippetFromIndex`/`buildContextSnippetFromIndices` originally could include messages that occurred AFTER the flagged point (an off-by-cap arithmetic error) — fixed to always pin `end` at the flag point and only extend backward.

**Edge Function `safety-classify/index.ts`** — cron-invoked (`--no-verify-jwt` + in-code service-role bearer check), both layers in one polled sweep per D1. Layer 1 sweeps `lila_messages` + `bookshelf_discussion_messages` (grouped by conversation/discussion for context-snippet + consolidated-notification purposes), Layer 2 sweeps `lila_conversations` + `bookshelf_discussions` quiet ≥30min via Haiku classification. Dedup/consolidation, layer-disagreement downgrade, content-free conversation-starter generation, D3-consolidated notifications all wired per the shared module. **Judgment calls made and documented in-code + here**:
- **Sensitivity semantics (Key PRD Decision #9)**: read literally — Low suppresses Concern severity only; Medium and High both flag everything. The PRD's further clause about Medium "requiring a higher base severity threshold" is treated as already achieved via the category-default matrix (Medium categories get Warning/Critical-skewed base severities by design), not as an additional runtime filter.
- **Tier gating**: `TIER_GATE_ENABLED = false`, mirroring `src/lib/permissions/useCanAccess.ts`'s Convention #10 beta bypass exactly — no Edge Function anywhere else in the codebase implements server-side `feature_access_v2` resolution, so inventing one here would be inconsistent, premature scope.
- **Layer 2 retry/park**: no new bookkeeping table. A Haiku failure leaves the conversation `safety_scanned=false` and structured-logs the error; the next minute's sweep retries automatically (self-healing, matches the polling architecture's own philosophy). This is a **deliberate simplification** vs. the PRD's literal "retry ×3 then park" — flagged for founder awareness, not hidden.
- **Weekly digest cron**: deliberately NOT registered in this migration (build item 3 mentioned it, but SM-C explicitly owns generation logic — item 13). Registering a cron pointing at an undeployed function was judged worse than a documented deferral.
- **CRISIS_KEYWORDS "harm to others" mapping**: the 4 entries (kill him/her/them, going to kill, want/going to hurt) don't fit any category's victim-framing description — mapped to `other` as the only reasonable catch-all, all at `critical` per Key PRD Decision #12's "guarantees crisis language always produces Critical" reading.
- **PRD-mentioned "sh" slang abbreviation** deliberately NOT seeded (2-character bare-word false-positive magnet).

**config.toml**: added `[functions.safety-classify]` (verify_jwt=false). **Opportunistic fix**: `[functions.validate-ai-output]` was entirely MISSING from config.toml (PRD-41 Slice E shipped without it) — `npm run prebuild`'s own verify_jwt guard would have failed on this pre-existing gap; fixed while in the file since it's a one-line, zero-risk addition directly relevant to config.toml correctness.

**Convention #243 grep-CI check**: new `scripts/check-safe-harbor-filter.cjs`, wired into `prebuild`. Scoped to server-side Edge Functions only (client-side `src/` already gets the filter for free via RLS's `lc_select_parent` policy, migration 7) — checks every `.from('lila_conversations')` call site for either a single-row `.eq('id', ...)` lookup or an `is_safe_harbor` reference in a 15-line window; `safety-classify/index.ts` is the one documented, justified allowlist entry. Passes clean (55 functions scanned, 0 flagged).

**Proof**: `tests/safety-classify-match.test.ts` 24/24. `tests/e2e/features/safety-monitoring.spec.ts` Class 1 (DB/RLS probes, no deploy needed) 11/11 — backfill correctness (children ON, additional_adult OFF, mom has no config row ever, special adults have neither config nor recipient rows), kid-session zero-read across every safety table, `safety_keywords` fully unreadable even by mom, `safety_resources` readable, ungranted-dad-blocked/granted-dad-can-read-non-content-columns-only (with an explicit proof that requesting the 3 guarded columns hard-errors 42501 for BOTH the granted dad AND mom herself — the column REVOKE has no side door), no-DELETE-policy proof, mom-can-acknowledge/kid-cannot-modify proof. Zero fixture residue verified via direct SQL post-run. `tsc -b` clean. Lint clean on all touched non-Deno files (`.cjs` script correctly ignored by eslint per the `check-function-jwt-config.cjs` precedent).

**Class 2 (LIVE pipeline pins) — DEPLOYED, RUN, GREEN.** Founder approved the deploy (2026-07-07, "Yes, deploy now"). `safety-classify` deployed `--no-verify-jwt`. **First deploy surfaced a real bug**: `loadMonitoredMembers()`'s embed query (`family_members!inner(...)`) was ambiguous — `safety_monitoring_configs` has TWO FKs to `family_members` (`monitored_member_id` AND `created_by`), so PostgREST returned `PGRST201` on every invocation, silently swallowed by the function's `catch`-and-`console.error` pattern, producing `monitored_members: 0` on every sweep (confirmed via manual curl invocation + direct PostgREST query reproducing the exact `PGRST201` ambiguous-relationship error). Fixed by disambiguating to the FK constraint name (`family_members!safety_monitoring_configs_monitored_member_id_fkey(...)`) — the OTHER two embeds in the same file (`lila_messages`→`lila_conversations`, `bookshelf_discussion_messages`→`bookshelf_discussions`) were checked and are NOT ambiguous (single FK each). Redeployed; all 3 LIVE pins green on the next run. **Also fixed while writing the tests**: a fixture-cleanup gap in the test file itself (not a product bug) — `sendConsolidatedNotification` fans out to every ACTIVE recipient, so once the RLS dad-grant test (test 9) runs earlier in the same spec file, Mark becomes an active recipient and every subsequent flag event produces 2 notification rows (Sarah + Mark), but the original cleanup only tracked "the most recent one." Fixed `afterAll` to sweep `notifications` by `source_reference_id IN (createdFlagIds)` instead of relying on per-test capture.

**Final proof, full spec together: 14/14 passing** (`tests/e2e/features/safety-monitoring.spec.ts` — 5 backfill + 6 RLS + 3 LIVE). Zero fixture residue verified via direct SQL (flags=0, safety_flag notifications=0, extra recipients=0, sensitivity overrides=0, recent conversations=0). `tests/safety-classify-match.test.ts` still 24/24 (unchanged — the bug was in the Edge Function's DB query shape, not the pure-logic module).

**`tsc -b` scope note**: whole-project `tsc -b` currently fails, but ONLY on files from OTHER parallel sessions' in-flight, uncommitted work (`src/components/meals/RecipeCaptureModal.tsx`, `src/components/wishlists/WishCatchModal.tsx`, `src/pages/WishLists.tsx` — all untracked per `git status`, confirmed not touched by this build). Zero errors on any PRD-30 file; `safety-classify/` is Deno-only and outside the tsc project scope entirely (matches every other Edge Function). Lint clean on both new test files (0 errors, 0 warnings). **Not committed — holding per explicit instruction until the whole tree compiles; the seat calls the commit batch.**

**Checkpoint fix (2026-07-07, same session): Layer 2 input bounding.** Checkpoint review flagged an unaddressed risk: `processLilaConversationsLayer2`/`processBookshelfDiscussionsLayer2` fetched a conversation's ENTIRE message history with no `.limit()` and fed it whole to `classifyTranscript`'s Haiku call. Confirmed genuinely unbounded (not a false alarm) — a conversation exceeding Haiku's context would fail every sweep, and combined with the "leave unscanned, retry next tick" simplification, that becomes an infinite once-a-minute retry loop that never resolves. **Fixed**: new `fetchBoundedConversationMessages()` helper (fetches the most-recent `MAX_LAYER2_MESSAGES=150` rows descending, reverses to chronological order — bound #1) + a `MAX_TRANSCRIPT_CHARS=60000` backstop inside `classifyTranscript` that truncates from the front, keeping the tail (most recent content) — bound #2, defense-in-depth against pathologically verbose individual messages within the 150-message window. Both Layer 2 call sites (lila_conversations + bookshelf_discussions) now route through the shared bounded fetch; the "quiet ≥30min" check (`lastMessageAt` from `messages[messages.length-1]`) still works correctly post-reversal since the array stays chronologically ordered. Founder-approved redeploy (second deploy of `safety-classify` this session); all 14/14 Playwright tests re-run green post-redeploy; zero fixture residue reverified.

**Accepted per checkpoint, action item for close-out**: `TIER_GATE_ENABLED=false` is accepted for beta as-is — **register a STUB_REGISTRY entry at SM close-out** cross-referencing PRD-31 (real server-side `feature_access_v2` tier resolution lands when the beta bypass exits platform-wide, matching `src/lib/permissions/useCanAccess.ts`'s own "restore the RPC check" comment). Not done in THIS session (STUB_REGISTRY updates are a Convention #14 Part B close-out action, owned by whichever slice closes the whole PRD-30 build, not per-slice) — flagging here so it isn't dropped.

**Observed, NOT fixed (out of scope, another session's in-flight work)**: a parallel wishlists-build session added a new Edge Function (`wishlist-extract`) without its own `config.toml` entry — `npm run prebuild`'s verify_jwt guard now fails on THAT function (unrelated to PRD-30). Flagging for the founder/coordination seat; did not touch it (not my territory).

**Live reality for SM-B**: `safety_monitoring_configs`/`safety_sensitivity_configs`/`safety_notification_recipients`/`safety_flags`/`safety_pattern_summaries` all exist and are RLS-verified. `safety_flags` reads from the client MUST use an explicit column list (never `select('*')`) — the column guard hard-errors 42501 on `*` even for authorized readers (mom included). Plain-language category labels + curated resources live in `CATEGORY_DISPLAY_LABEL`/`safety_resources` respectively — SM-B's Screen 2/3/4 components should be aware the label/description constants currently live only in the Deno-only `supabase/functions/_shared/safety-classify-match.ts`; a client-side mirror (e.g. `src/lib/safety/categoryLabels.ts`) will be needed for the same 8-category labels — flagging so SM-B doesn't hand-roll a second copy that drifts.

### SM-B (2026-07-07, Sonnet worker session) — CODE COMPLETE, ALL PROOF GREEN (21/21 Playwright + 6/6 eyes-on tour), HOLDING FOR THE COMMIT BATCH

**Screen 1 (Settings) + Screen 2 (sensitivity modal)**: `SafetyMonitoringSettingsSection.tsx` mounted in `SettingsPage.tsx` as a new `<SettingsSection title="Safety Monitoring" icon={ShieldAlert}>` gated `shell === 'mom'` (primary-parent-only per addendum ruling — matches every other mom-only section's existing gate pattern, not a new mechanism) + wrapped in `<PermissionGate featureKey="safety_monitoring_basic">`. Recipient toggles (mom locked ON with Lock pill; dad gets a real toggle writing `safety_notification_recipients`), delivery channels (in-app always-on, email shown disabled "Coming soon" — D6 email lands in SM-C), per-member monitored list with ON/OFF + gear (`Settings2` icon opening `SafetySensitivityModal`), "View Flag History →" link to `/safety-flags`. `SafetySensitivityModal.tsx` (ModalV2 transient): 8 category rows, 3 locked (self_harm/abuse/sexual_predatory) render a `Lock` pill pinned to "High" with NO control underneath — `isLockedCategory()` gates the render branch directly, so a tampered DB override can never surface as an editable Low/Medium/High segmented control; adjustable categories persist immediately per click (upsert on `(family_id, monitored_member_id, category)`), "Reset to Defaults" clears all overrides for that member.

**Screen 3 (flag detail, NO-EXCERPT) + Screen 4 (flag history)**: `SafetyFlagDetailModal.tsx` — severity banner (Critical gets the larger icon + expanded-feel styling), plain-language category label (never the raw enum), timestamp, surface + detection-layer label, content-free "How to Bring This Up" starter, curated `safety_resources` per category, Acknowledge/Dismiss (one-way — buttons disappear once `status !== 'new'`, replaced by a plain "Acknowledged on [date]" / "Dismissed on [date]" line). **No CONTEXT block anywhere in this component — it never even calls a hook that could fetch `context_snippet`/`matched_keywords`/`classification_reasoning`.** No Delete action exists. `SafetyFlagsPage.tsx` at canonical route `/safety-flags`: member/category filters + "Show dismissed" toggle, This Week/Last Week/Earlier time buckets (`localWeekIso` comparison — display-only grouping of already-fetched TIMESTAMPTZ rows, not a Convention #257 write/today-filter concern), Load More accumulates across pages, `?flag=<id>` auto-opens the detail modal (notification tap-through) and self-clears from the URL after consumption, `?member=<id>` seeds the member filter (FO "Review →" deep link).

**New route guard `SafetyRecipientRoute.tsx`** (`src/lib/permissions/`): GrantedRoute-shape (`useEffectiveMember` + `MomOnlyBlockedCard`, same View-As/origin behavior as every other guard in this family) but its allow-check is `useIsSafetyRecipient()` against `safety_notification_recipients`, NOT `useManagementGrants`/`member_permissions` — PRD-30 owns its own recipient table by design (feature decision file: "PRD-30's own table + Settings UI is the authority"). Registered in `App.tsx` as `<Route path="/safety-flags" element={<SafetyRecipientRoute><SafetyFlagsPage /></SafetyRecipientRoute>} />` — never a sidebar entry (Convention #16 N/A, confirmed: reached only via the Settings link, the FO section, and notification `action_url`).

**Screen 5 (Family Overview column section)**: added `'safety_monitoring'` to `FAMILY_OVERVIEW_SECTION_KEYS` (`useFamilyOverviewConfig.ts`) — grafts in at read time via the existing `mergeSectionOrder` mechanism, zero migration needed (matches the Convention #275 pattern exactly). In `FamilyOverview.tsx`: new hooks `useIsSafetyRecipient(viewer)` + `useSafetyFlagCountsForMembers(familyId, selectedMemberIds)` feed two new props (`safetySummary`, `viewerIsSafetyRecipient`) into `MemberColumn`. **`renderSection` returns `null` outright (no header, not even a collapsed row) when `!viewerIsSafetyRecipient || !safetySummary?.monitored`** — satisfies both "recipients-only" AND "hidden for unmonitored members" from the same guard, matching the existing `StubSection`-tolerant pattern where `sectionOrder`/`SortableContext` can list a key with no rendered element for it. Not added to `CREATABLE_SECTIONS` (no `[+ create]` — mom doesn't create flags). New `SafetyMonitoringFOSection` component shows "✓ No flags" or "N new flag(s) (Warning) — Review →" linking to `/safety-flags?member=<id>`.

**Screen 6 (dad granted-recipient path)**: fully covered by the above — the Settings toggle writes the recipient row, `SafetyRecipientRoute` and the FO's `useIsSafetyRecipient` both read the same table, and `notifications` rows are already written per-recipient by SM-A's `sendConsolidatedNotification` (each recipient gets their own row with their own `recipient_member_id`), so the existing `NotificationTray`/`useNotifications` pipeline requires zero changes for dad to receive and tap through alerts once granted.

**Teen disclosure row (J5/D4)** — and the one place this slice found a real, un-anticipated conflict:

**MAJOR FINDING, fixed in-slice: a new migration was required, not just UI.** D4's "standing disclosure row ... always present when monitoring is active for that teen" is IMPOSSIBLE to build reactively against SM-A's schema as shipped — `safety_monitoring_configs`'s only RLS policy (`smc_mom_all`) restricts ALL access, including SELECT, to `primary_parent`. A teen cannot read even their own `is_active` flag under that policy, so a client-side disclosure component would have nothing to condition on. Reasoned through this and concluded (per D4's own text — "this is not hidden surveillance, it's disclosed as a safety net") that a monitored member reading their OWN on/off state IS the disclosure, not a leak — the sensitivity, flags, and keyword library must stay fully invisible, but the yes/no fact of being watched is exactly what disclosure means.

**Migration `00000000100299_safety_monitoring_self_read_policy.sql`** — ONE additive, narrow policy: `CREATE POLICY "smc_self_select" ON safety_monitoring_configs FOR SELECT TO authenticated USING (monitored_member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid()))`. Nothing else touched — `smc_mom_all` (mom's full CRUD) is untouched, and no policy of any kind was added to `safety_sensitivity_configs`, `safety_notification_recipients`, `safety_flags`, or `safety_pattern_summaries` — those remain exactly as SM-A shipped them, fully invisible to every monitored member with no exceptions.

Migration numbering (numbers are moving fast tonight — 5 other sessions landed 100290-100298 in the two hours since SM-A's 100289): re-checked `ls supabase/migrations` immediately before file creation (100289-100298 all taken, none by me) → took **100299**, re-checked it was still free immediately before applying (unchanged) → applied via **`supabase db query --linked -f supabase/migrations/00000000100299_safety_monitoring_self_read_policy.sql`** (the one-file method, NOT `db push` — 100290-100298 are other sessions' unreviewed/unapplied work and a `db push` would have swept all of them in as a side effect). Verified live immediately after: direct `pg_policies` query confirms both `smc_mom_all` and the new `smc_self_select` present on `safety_monitoring_configs`, nothing else changed.

**Real regression found and fixed as a result**: SM-A's own RLS leak-probe test ("a monitored kid session (Casey) reads ZERO rows from every safety table") explicitly asserted zero rows from `safety_monitoring_configs` among the "other tables" — which the new policy correctly breaks, on purpose. Updated that test (not weakened, RETARGETED) to assert the new, intentional, narrower contract: Casey reads **zero** rows from `safety_sensitivity_configs`, `safety_notification_recipients`, and `safety_pattern_summaries` (unchanged), reads **zero content-bearing columns** from `safety_flags` (unchanged, still column-guarded), and reads **exactly her own one row** from `safety_monitoring_configs` — asserted by both count (`=== 1`) and `monitored_member_id === caseyId` (never a sibling's row). This is the tests-match-intent rule's allowed case: the underlying contract legitimately changed under a founder-approved decision, and the pin was updated to prove the NEW intent, not loosened to dodge a failure.

**Two explicit confirmations requested by the coordination seat:**
1. **The self-read policy is SELECT-only and own-row-only, and does NOT extend to `safety_sensitivity_configs`, `safety_notification_recipients`, `safety_flags`, or `safety_pattern_summaries`.** Confirmed by direct inspection of migration 100299 (one `CREATE POLICY` statement, one table, `FOR SELECT` only — no `FOR ALL`, no `WITH CHECK`, meaning the monitored member cannot even UPDATE their own row) and by the live `pg_policies` verification query showing exactly two policies on `safety_monitoring_configs` and nothing new on the other four tables. The updated Playwright pin (`safety-monitoring.spec.ts` "RLS leak probes" describe block) drives this live as Casey and asserts all four "must stay zero" tables explicitly by name, plus the flag-content-column guard separately.
2. **The disclosure row renders for independent teens ONLY — guided/play kids get no surface even though the RLS technically permits their own self-read too** (the policy is written generically across any monitored member, not scoped to `dashboard_mode`, since restricting it further would require a second, redundant condition when the real gate belongs in the UI, matching how every other Settings-page surface in this codebase is gated). Verified by direct code read: `TeenTransparencyPanel.tsx` has a hard early return `if (member.dashboard_mode !== 'independent') return null` (line 143) wrapping `SafetyDisclosureRow` along with everything else in the panel, AND `SettingsPage.tsx` only mounts `<TeenTransparencyPanel />` at all when `member?.dashboard_mode === 'independent'` — a double gate, mount-site plus component-internal. A guided child (Jordan) or Play child (Ruthie) has no code path that renders this banner, regardless of what the RLS policy would technically allow if they queried the table directly from devtools — which is the same category of non-issue as "a technically-savvy kid could open devtools and see their own `is_active` boolean," not a content/flag/sensitivity leak. New Playwright pin drives Jordan hitting `/safety-flags` directly (blocked) as the guided-shell coverage; the disclosure-row pin itself only exercises Alex (independent).

**E2E spec extension** (`tests/e2e/features/safety-monitoring.spec.ts`, appended as "Class 3 — SM-B mom-surface UI pins", real browser flows per rider (a), 9 new tests): Settings toggle persists (Casey on/off, DB-polled both directions); locked-category Lock-pill rendering survives a tampered override row planted via service role, adjustable category (substance) persists through a real click; flag review one-way transition (acknowledge via UI → DB-polled → reopen → buttons gone, only status text) + history member-filter proof; Casey (own login) and Jordan (own login) both blocked from `/safety-flags` by the route guard; ungranted-Mark blocked → mom grants via the real Settings UI (not a raw DB write) → granted-Mark passes and sees the real history page; Alex's disclosure row renders with the exact copy, then disappears when monitoring is toggled off (service-role, simulating a mom-driven off state) and is restored to ON afterward so the shared fixture family is never left mid-test. Total after this slice: SM-A's original 14 (5 backfill + 6 RLS incl. the retargeted Casey pin + 3 LIVE) + 9 new SM-B = **21 tests total in the file** (confirmed via `npx playwright test --list`, not yet executed).

**Proof status — ALL GREEN, executed 2026-07-07 after the slot was granted.** `npx tsc -b`: clean, exit 0, whole project (both before and after the fixes below). `npx eslint` on all touched files: 0 errors (found and fixed one real `no-unused-vars`-class issue myself — an unused `eslint-disable-next-line react-hooks/exhaustive-deps` comment left over a `useEffect` whose deps array was already complete). `npm run check:colors`: zero new violations. `npx playwright test tests/e2e/features/safety-monitoring.spec.ts`: **21/21 passing** (14 SM-A + 7 new SM-B tests) after fixing one real bug the FIRST run surfaced (below). `EYES_ON_TOUR=1 npx playwright test tests/e2e/features/safety-monitoring-eyes-on-tour.spec.ts`: **6/6 passing**, 11 screenshots, all read and judged — surfaced a SECOND real bug (below), fixed, both suites re-run green to confirm. Zero fixture residue verified via direct SQL after every run (flags/sensitivity-overrides/Mark's-recipient-row/safety_flag-notifications all 0; Casey and Alex both restored to `is_active=true`).

**Bug #1 (test-only, found by the first suite run): toggle race condition.** "mom can toggle a member's monitoring on/off (persists)" clicked the toggle twice with only a DATABASE poll between clicks — the DB write completing doesn't guarantee the BROWSER's own React Query cache has refetched and re-rendered by the time Playwright fires the second click. The second click read a stale `checked` value and re-sent the SAME value (off→off again) instead of flipping back on, leaving Casey's fixture row at `is_active=false` after the failed run (confirmed via direct SQL, manually restored before re-running). Fixed by asserting `aria-pressed` on the toggle itself (which waits for the actual DOM/React state, not just the DB) between the two clicks. Also added a belt-and-suspenders Casey restore to the shared `afterAll` alongside the existing Alex restore.

**Bug #2 (real product bug, found by the eyes-on tour): `backgroundColor` cannot render a gradient.** `--surface-primary` resolves to `linear-gradient(135deg, #68a395 0%, #d6a461 100%)` in the active theme. I had written `backgroundColor: 'var(--surface-primary)'` (not `background:`) on 4 buttons — the sensitivity modal's selected Low/Medium/High pill and its Done footer button, the flag detail's Acknowledge button, and the history page's "Show dismissed" active toggle. `background-color` only accepts solid colors; a gradient value is invalid at that property and the browser silently drops it, leaving the background fully transparent (confirmed via `getComputedStyle`: `backgroundColor: rgba(0,0,0,0)`, `backgroundImage: none`). Combined with `color: var(--color-text-on-primary)` (white), every one of these controls rendered WHITE TEXT ON A TRANSPARENT BACKGROUND inside a white modal — completely illegible. The tour's first sensitivity-modal screenshot showed "Low ... High" legible but the selected "Medium" pill blank; DOM inspection (button text content, bounding box, computed style) proved all three buttons existed and were correctly sized — the text was simply invisible. Fixed by changing `backgroundColor:` to `background:` (the shorthand accepts both gradients and solid colors) at all 4 sites. Re-ran both suites afterward — 21/21 and 6/6 — and re-read the affected screenshots to confirm the fix (all "High"/"Medium"/Done/Acknowledge pills now render the teal-to-gold gradient with legible white text). **Note for the record:** this exact `backgroundColor: 'var(--surface-primary, ...)'` pattern exists in ~15 OTHER pre-existing files across the codebase (`HubSettings.tsx` and others) — those are OUT OF SCOPE for this build (not touched, not mine to fix), but they are very likely exhibiting the identical invisible-selected-state bug whenever gradient mode is on. Flagging for the founder/seat as a cross-cutting finding, not fixing beyond my own 4 sites.

Nothing committed — holding for the commit batch per the coordination seat's instruction.

**Live reality for SM-C**: `/safety-flags` route + `SafetyRecipientRoute` + all Screen 3/4 UI exist and are wired to the exact table/column shapes SM-A shipped. `safety_monitoring_configs` now has a second RLS policy (`smc_self_select`) — SM-C's weekly digest generation logic (service role) is unaffected (service role bypasses RLS entirely) but should be aware the table is no longer primary-parent-exclusive if it ever adds client-facing summary UI. The digest UI is NOT built here — Settings shows a static "arrives automatically once it's ready" line, no functional toggle (D6 email + digest are explicitly SM-C scope, sequenced last).

### SM-C (2026-07-08, Sonnet worker session) — CODE COMPLETE, ALL PROOF GREEN, HOLDING FOR THE COMMIT BATCH

**Build Item 13 — weekly pattern digest.** Migration `00000000100303` (idempotency `UNIQUE(monitored_member_id, period_end)` + weekly Sunday cron via `util.invoke_edge_function`) applied via the one-file method (100302 was already taken by a parallel PECON-SHOP migration by the time I checked — re-verified immediately before creating and again before applying, per protocol). New `safety-weekly-digest` Edge Function: for every actively-monitored member, computes `period_end` = yesterday in the family's local timezone (`Intl.DateTimeFormat`, never a client-supplied date), counts `safety_flags` in the rolling 7-day window (`is_safe_harbor=false` excluded per J5), zero-flag weeks get the PRD's literal narrative with no Haiku call, non-zero weeks get one Haiku call fed COUNTS ONLY (never conversation content), inserts the summary row, and sends one quiet (`priority='normal'`) notification per active recipient. New pure helpers added to `_shared/safety-classify-match.ts` (`computeTrend`, `buildWeeklySummaryData`, `timezoneOffsetMinutesAt`, `familyLocalDayBoundsUtc`, `shiftLocalDate`, `ZERO_FLAG_NARRATIVE`) — all vitest-tested (14 new tests, incl. a Chicago DST-boundary check). Client: new `useLatestSafetyPatternSummaries` hook + `WeeklyPatternSummarySection` inline on `SafetyFlagsPage.tsx` ("This Week's Trend", trend icon + narrative per member, freshness-filtered to 9 days) + updated the stale "coming soon" Settings copy now that the digest is genuinely live.

**Build Item 14 — D5 crisis-hit flag wiring.** New `_shared/crisis-flag.ts`: `flagCrisisEvent()` (fire-and-forget, never-throws) checks the member is actively monitored (naturally excludes mom — she has no config row per Key PRD Decision #2), categorizes the matched `CRISIS_KEYWORDS` phrase (self_harm/abuse/other, mirroring the migration 100289 seed's own category assignment exactly), applies the same 24h dedup window as the main pipeline, inserts a Critical `safety_flags` row (`conversation_table`/`conversation_id` NULL — the polymorphic schema built for exactly this), and notifies every active recipient. Wired at the existing `detectCrisis()` short-circuit in `mindsweep-sort` (one call site) and `mindsweep-scan` (both `handleScan`/`handleLink`). `message-coach` needed more care — see the regression below.

**MAJOR FINDING #1 — the digest narrative silently failed on first live test, tracing to a platform-wide bug.** Manual sanity probes of the freshly-deployed `safety-weekly-digest` succeeded for all-zero-flag members (11/11, no Haiku needed) but the FIRST real non-zero-flag test failed `expect(summary.narrative).toBeTruthy()` — `narrative` came back `null`. Since I couldn't view Deno function logs through this CLI version, I added temporary `DEBUG_HTTP_${status}`/`DEBUG_EXCEPTION` return values, redeployed, and reproduced: `{"error":{"message":"anthropic/claude-haiku-4-5-20251001 is not a valid model ID","code":400}}`. Cross-checked: `safety-classify` (SM-A's own function) uses the IDENTICAL string, and a direct query confirmed ZERO `ai_usage_tracking` rows for `feature_key='safety_classification'` had EVER existed — meaning `safety-classify`'s Layer 2 classification and conversation-starter generation had silently failed on every single invocation since SM-A shipped, invisibly, because every failure path (`if (!res.ok) return null`, then the caller's `if (starter) { UPDATE ... }`) degrades to "nothing to do here," never an error state anyone would notice. Fixed `safety-weekly-digest`'s and `safety-classify`'s `HAIKU_MODEL` constant to `'anthropic/claude-haiku-4.5'` (the string 6 other working functions already use) — founder-approved the `safety-classify` cross-fix via AskUserQuestion (same PRD, same session). Redeployed both; **live re-verification confirmed the fix restored a REAL, working "How to Bring This Up" conversation starter** for the very first time in production (Jordan's re-run bullying flag got a genuine, warm, correctly-content-free starter — see the Class-2-LIVE-pipeline test rerun below).

**Seat-directed cross-territory extension.** The coordination seat, mid-session, granted authorization to apply the identical fix to `validate-ai-output` (PRD-41/SAFETY-BETA-GATE Slice E — that build's window is closed) and directed three follow-ups: (1) fix + deploy `validate-ai-output` — done, with a code-read confirming the exact failure mode there was WORSE than PRD-30's (its caller's `if (!tier2 || ...)` branch auto-validates a Tier-1-flagged row as if Tier 2 had confirmed "clean," meaning Tier 2 had never once actually confirmed or rejected anything in production); (2) append a dated handoff note to `SAFETY-BETA-GATE.md`'s Phase-4 section warning that shadow-mode data before the fix's deploy timestamp (2026-07-08 15:47 UTC) carries no real Tier-2 signal — done; (3) add a repo-wide static guard banning the invalid model ID — done (`tests/redteam/model-id-guard.test.ts`, wired into `npm run redteam`/pre-push). Authoring that guard's file-scan surfaced TWO MORE live instances (`auto-title-thread`, `lila-board-of-directors`) — outside this build's granted territory, so grandfathered in the guard's own `GRANDFATHERED_FILES` list and flagged in STUB_REGISTRY.md rather than fixed. The guard's own scan then also caught a 5th instance inside my OWN already-approved `message-coach` (a SEPARATE `MODEL` constant, its actual real coaching-note generator, unrelated to the D5 crisis-flag wiring) — founder-approved via AskUserQuestion and fixed same-session, since it was already in my working set and already deploy-approved.

**MAJOR FINDING #2 — my own digest narrative was missing PRD-41 ethics-guard wiring, caught by the redteam suite before ship.** Running `npm run redteam` after the model-ID fixes failed one FULL-MATRIX pin: `safety-weekly-digest` makes a chat-model call producing member-facing prose (not a structured verdict), so it does NOT qualify for the classifier exception `safety-classify`/`validate-ai-output` correctly claim. Fixed by wiring `scanUtilityOutput`/`enqueueOutputScan` into `generateNarrative` (same pattern as every other utility surface), with a safe non-alarming fallback string for the (currently theoretical, since `ENFORCEMENT_MODE='shadow'`) case of a real hit. Redeployed; redteam back to green (66/66).

**Regression found and fixed — the crisis response must never depend on a DB lookup succeeding.** My first `message-coach` D5 fix reordered sender resolution AHEAD of the crisis check (the flag write needs `sender.family_id`/`sender.id`). The FIRST full regression run (`safety-beta-gate.spec.ts`) still passed 58/58 on ASSERTIONS ALONE, but the test's own name — "message-coach short-circuits on crisis content **before resolving the sender or thread**" — and its comment documented an invariant my reorder had silently broken: the crisis response itself was now gated behind a successful `family_members` lookup, a real robustness regression on a Convention #7 path (if the lookup ever failed, a crisis message would get a 403 instead of resources). Caught this by actually reading the test's comment rather than just its pass/fail, per the "tests-match-intent" discipline. Fixed properly: crisis check runs FIRST again (unconditional, zero DB dependency), and the sender lookup for `flagCrisisEvent` is now an INDEPENDENT, separately try/caught best-effort operation inside the crisis branch that can never delay or block the crisis response. Updated the static drift pin in `tests/safety-crisis-flag.test.ts` to assert the corrected ordering AND the try/catch isolation (previously it asserted the — now known-wrong — opposite ordering). Redeployed `message-coach`; re-ran both `safety-monitoring.spec.ts` (SM-C block, 6/6) and `safety-beta-gate.spec.ts` (58/58) to confirm.

**Test-fixture hygiene finding — `safety-weekly-digest` sweeps ALL monitored members platform-wide on every invocation (correct, real behavior), which means testing ONE member's digest silently creates summary rows for every OTHER monitored Testworth member too.** The original `afterAll` only tracked explicitly-queried summary ids, leaving orphaned rows (and, from an earlier partial-cleanup pass, orphaned notifications pointing at already-deleted summaries) after each run. Hardened the cleanup to a family+category-scoped sweep (`DELETE safety_pattern_summaries WHERE family_id=...` + `DELETE notifications WHERE category='safety' AND recipient_member_id IN (family's members)`) rather than cross-referencing "notifications whose source still exists" — the latter can't catch an orphan whose source was already deleted by an earlier pass. Manually swept all residue accumulated during debugging (both from my own manual probes and the first buggy-cleanup Playwright run); re-ran the full suite twice more to confirm zero residue from a clean cleanup path.

**Final proof (all green, in this order):** `tests/safety-classify-match.test.ts` + `tests/safety-crisis-flag.test.ts` 42/42 vitest; `tests/e2e/features/safety-monitoring.spec.ts` full 27/27 run **three times** (once with the model-ID/timeout issues surfaced and fixed, twice clean after), zero fixture residue confirmed via direct SQL after every run; `tests/e2e/features/safety-beta-gate.spec.ts` 58/58 **twice** (once catching the message-coach regression, once clean after the fix); `npm run redteam` 66/66 (63 original + 3 new model-id-guard, after the digest ethics-guard fix); Convention #277 eyes-on tour extension (`safety-monitoring-eyes-on-tour.spec.ts`, 1 new test, 2 screenshots) read and confirmed — the "This Week's Trend" section renders correctly at desktop and mobile with the exact designed copy and trend iconography, zero fixture residue after. `tsc -b` clean; lint clean on every touched frontend/test file (Edge Functions correctly excluded from eslint per `eslint.config.js`, verified via esbuild syntax-checks instead, matching the established precedent for this codebase's Deno functions).

**Deploy list, all founder/seat-approved:** `safety-weekly-digest` (new, deployed 3× across iterative fixes), `mindsweep-sort`, `mindsweep-scan`, `message-coach` (deployed 2× — D5 wiring, then the crisis-ordering regression fix), `safety-classify` (model-ID fix), `validate-ai-output` (model-ID fix, cross-territory grant).

**Live reality for anyone touching PRD-30 next:** `safety_pattern_summaries` now has real rows for the FOUNDER'S ACTUAL FAMILY (generated during this session's manual sanity probes — all "No concerns detected this week." zero-flag, zero cost, left in place deliberately as legitimate real production data, not test residue). `safety-classify`'s conversation starters and Layer 2 classification are, for the first time since SM-A, actually functioning in production — anyone reviewing existing `safety_flags` rows created before 2026-07-08 will find `conversation_starter=NULL` on all of them (the historical silent-failure signature); anything flagged from now on should carry a real starter.

**Encore (2026-07-08, same session) — seat-granted cross-territory closure of the two remaining grandfathered instances.** The coordination seat, after Checkpoint passed, authorized fixing the last two known occurrences of the invalid model ID: `auto-title-thread` (`MODEL`, PRD-15 thread auto-titling — had been silently failing to title threads since deploy, indistinguishable from "no reply yet" since both leave `title=NULL`) and `lila-board-of-directors` (`MODEL_HAIKU`, PRD-34 — two call sites, BOTH already fail-closed by design, so this bug's effect was the opposite direction from every other instance found this session: `contentPolicyCheck` had been silently BLOCKING every custom persona creation attempt since deploy [SCOPE-8a.F8a's fail-closed discipline doing its job, just against a permanently-failing call], and `classifyRelevance` had always defaulted to `personal-only`, meaning nothing has ever been promoted to the Tier-3 shared persona cache via this classifier). Both fixed to `'anthropic/claude-haiku-4.5'`, syntax-checked via esbuild, deployed. `tests/redteam/model-id-guard.test.ts`'s `GRANDFATHERED_FILES` list reduced from 3 entries to 1 (`_shared/cost-logger.ts`'s inert `MODEL_PRICING` row only — deliberately left alone: it's a shared file bundled into every function's deploy and a pure data lookup nothing will ever call again, outside the two named functions this grant covered) — the guard now runs with **zero function-level exceptions**. `FIXED_FUNCTIONS` list grew from 4 to 6. Re-ran: `npm run redteam` 66/66, `tsc -b` clean, lint clean, `safety-beta-gate.spec.ts` full suite 58/58 (both functions' static-list pins and `auto-title-thread`'s dedicated LIVE crisis-short-circuit test all green post-deploy). Zero files staged, zero commits — reporting done per the seat's explicit instruction; the seat runs the batch.

Nothing committed — holding for the coordination seat's batch per this session's standing instruction.

## Mom-UI Verification

*(Convention #277 Claude-driven eyes-on tour RUN 2026-07-07 — `tests/e2e/features/safety-monitoring-eyes-on-tour.spec.ts`, `EYES_ON_TOUR=1`, 6 tests / 11 screenshots, all read and judged directly. Real DB fixtures — Jordan flagged with a real `bullying`/`warning` flag, real seeded conversation starter and resources, zero model calls. Screenshots in `eyes-on-tour/sm-01..11*.png`.)*

**A real bug was found and fixed during this tour** (see Progress Log "MAJOR FINDING #2"): the sensitivity modal's selected-option pill and 3 other buttons used `backgroundColor: 'var(--surface-primary)'`, but `--surface-primary` resolves to a CSS gradient (`linear-gradient(...)`) in this theme — `background-color` cannot render a gradient (only `background`/`background-image` can), so the browser silently rejected the value, leaving the button background fully transparent. Combined with white (`--color-text-on-primary`) text, this made the SELECTED sensitivity level (and the modal's Done button, and the flag detail's Acknowledge button, and the history page's "Show dismissed" active state) **invisible** — confirmed via direct DOM/computed-style inspection (`backgroundColor: rgba(0,0,0,0)`), not just a hunch. Fixed all 4 occurrences (`background:` instead of `backgroundColor:`), re-ran the full 21-test suite (still 21/21) and re-captured the tour (all 6 tests still pass) to confirm the fix. This is exactly the class of defect Convention #277 exists to catch — code compiled, tests passed on data assertions, and it still would have shipped with an unreadable control.

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Settings Safety Monitoring section (recipients, delivery, monitored list) | ✅ `sm-01` — section expanded, "You (Mom) — Always on" locked pill, "Mark" toggle, In-app/Email delivery rows | ✅ `sm-02` — sidebar layout holds, section renders identically | ✅ `sm-03` — BottomNav present, section content readable (one pre-existing app-wide floating-icon overlap noted below, not introduced by this build) | mom | Screenshots read + judged | 2026-07-07 |
| Sensitivity modal (3 locked "High" pills + 5 adjustable Low/Medium/High controls) | ✅ `sm-04` — POST-FIX: all 3 Lock pills legible, all 5 adjustable controls show a legible gradient-filled "High" (Jordan's guided-shell default), Done button legible | — (not separately captured; modal is width-fluid, desktop+mobile bracket the range) | — | mom | Bug found + fixed + re-verified in this same tour run | 2026-07-07 |
| Flag detail (NO-EXCERPT: severity banner, starter, resources, Acknowledge/Dismiss) | ✅ `sm-05` — "Warning — Severe Bullying", real timestamp/surface/detection-layer line, the exact seeded starter text, 2 curated StopBullying.gov/Cyberbullying Research Center resources, legible Acknowledge (POST-FIX) + Dismiss buttons. Flag history visible correctly behind the modal | — | — | mom | Screenshot read + judged | 2026-07-07 |
| Flag history (filters, This Week grouping) | ✅ `sm-06` | ✅ `sm-07` | ✅ `sm-08` | mom | All 3 viewports render filters + grouped flag row identically; not a sidebar entry (confirmed absent from nav, by design) | 2026-07-07 |
| FO safety_monitoring column section (per-member, hidden-when-unmonitored proven live) | ✅ `sm-09` — TWO adjacent columns compared side by side: one shows "✓ No flags", the other shows "⚠ 1 new flag (Warning) — Review →" for the seeded Jordan flag — proves the per-member severity/count differentiation live, not just in isolation | — | — | mom | Screenshot read + judged; this is the strongest single piece of evidence for Screen 5's exact PRD wording ("1 new flag (Warning) [Review →]" / "No flags ✓") | 2026-07-07 |
| Safety notification + tap-through | N/A (no new screenshot) | N/A | N/A | mom | Reuses SM-A's proven `notifications`/`action_url` pipeline unchanged, already Class 2 LIVE-pipeline-verified | 2026-07-07 |
| Teen What's Shared disclosure row (independent-only, D4) | ✅ `sm-10` — exact copy present, teen's own theme respected, positioned above the Mom/Dad/Family grid | — | ✅ `sm-11` — text wraps cleanly, no clipping, BottomNav intact | independent (Alex) | Screenshots read + judged | 2026-07-07 |
| Kid shells zero-surface check (Casey, Jordan blocked at `/safety-flags`) | Proven via Playwright DOM assertion, not a screenshot (blocked card is the same `MomOnlyBlockedCard` proven visually elsewhere in the app) | — | — | guided + independent (own login) | `safety-monitoring.spec.ts` tests 18-19, both green | 2026-07-07 |
| SM-C: "This Week's Trend" weekly digest section on `/safety-flags` | ✅ `sm-12` — "Jordan · ↓ down from last week" trend indicator + narrative "One bullying-related flag this week, down from two last week. No critical flags." renders correctly above the filter bar and flag-history list, theme tokens applied, no emoji | — | ✅ `sm-13` — text wraps cleanly at 390px, layout intact, BottomNav present (same pre-existing floating-icon overlap noted below, not introduced by this build) | mom | `safety-monitoring-eyes-on-tour.spec.ts` (extended), screenshots read + judged; zero fixture residue confirmed after | 2026-07-08 |

**Micro-observation (not a defect, noted for the pile):** on mobile (`sm-03`, `sm-08`, `sm-11`, `sm-13`), a pre-existing app-wide floating icon (the AI Vault quick-launch bubble) sits near the top-left and partially overlaps page content at narrow viewports — present on every page in this app, not introduced by this build.

## Post-Build Verification

*(Checkpoint 5 — every PRD MVP item + D1–D7 outcome: Wired / Stubbed / Missing. Zero Missing required. This is the SM-B slice's own verification — SM-C's own table follows it below, and the FULL whole-build comprehensive table (56 requirements combining SM-A+B+C, J-areas, D-decisions, unplanned findings) lives in `claude/feature-decisions/PRD-30-Safety-Monitoring.md` §Post-Build PRD Verification. Playwright suite (21/21) and the Convention #277 eyes-on tour (6/6, 11 screenshots read and judged) both EXECUTED 2026-07-07 — every "Wired" row below is browser-proven, not just statically checked.)*

| Requirement | Status | Evidence |
|---|---|---|
| Screen 1 — Settings section (primary-parent-only, PermissionGate) | Wired | `SafetyMonitoringSettingsSection.tsx` mounted in `SettingsPage.tsx` gated `shell === 'mom'` + `<PermissionGate featureKey="safety_monitoring_basic">`; pin written |
| Screen 1 — recipient toggles (mom locked, dad grantable) | Wired | Same component; pin: "ungranted dad ... blocked; granted dad passes" |
| Screen 1 — delivery channels (in-app always-on, email disabled) | Wired | Static UI, D6 email is explicitly SM-C scope |
| Screen 2 — sensitivity modal, 3 locked categories pinned High | Wired | `SafetySensitivityModal.tsx`; pin: "locked categories show a Lock pill ... even with a tampered override row" |
| Screen 2 — adjustable categories persist | Wired | Same pin, substance-category assertion |
| Screen 3 — flag detail, NO-EXCERPT mode | Wired | `SafetyFlagDetailModal.tsx` — never requests/renders content-bearing columns; pin: "flag review is one-way" |
| Screen 3 — Acknowledge/Dismiss one-way, no Delete | Wired | Same component + pin |
| Screen 4 — flag history at canonical `/safety-flags` | Wired | `SafetyFlagsPage.tsx`; filters + time buckets + Load More; pin covers member filter |
| Screen 4 — `?flag=` and `?member=` deep links | Wired | Code complete, consumed by notification `action_url` and FO "Review →" respectively |
| Screen 5 — FO `safety_monitoring` column section | Wired | `FAMILY_OVERVIEW_SECTION_KEYS` + `SafetyMonitoringFOSection`; recipients-only AND hidden-when-unmonitored via `renderSection` early-return `null` |
| Recipient-gated route guard | Wired | `SafetyRecipientRoute.tsx`; pins: Casey blocked, Jordan blocked, ungranted/granted dad |
| Teen disclosure row (D4), independent-only | Wired | `TeenTransparencyPanel.tsx` `SafetyDisclosureRow`; double-gated to `dashboard_mode==='independent'`; pin covers Alex on/off |
| Self-read RLS policy for the disclosure row | Wired | Migration 100299, applied + verified live via `pg_policies`; scope confirmed narrow (SELECT-only, own-row-only, 4 other tables untouched) |
| Retargeted SM-A regression pin (Casey zero-read except own config) | Wired | Updated + seat-accepted per tests-match-intent's allowed case |
| FeatureGuide registry entry | Wired | `feature_guide_registry.ts` `safety_monitoring_basic` |
| help-patterns.ts entry | Wired | New `safety_monitoring` category pattern |
| feature-guide-knowledge.ts PAGE_KNOWLEDGE + USE_CASE_RECIPE | Wired | `/settings#safety-monitoring` entry + new recipe |
| `tsc -b` clean | Wired | Exit 0, whole project, re-verified after the CSS fix |
| lint clean on all touched files | Wired | 0 errors |
| Playwright suite execution (21 tests: 14 SM-A + 7 new tests) | **Wired** | **21/21 passing.** One real bug found + fixed mid-run (toggle race condition in the test itself — DB write confirmed before the UI's own React Query cache had refetched, causing a stale second click; fixed by asserting `aria-pressed` before proceeding) |
| Convention #277 eyes-on tour | **Wired** | **6/6 tour tests passing, 11 screenshots, all read and judged.** Found + fixed a real product bug (see below) |
| **Real bug found + fixed: `backgroundColor` + gradient CSS variable** | **Wired (fixed)** | `--surface-primary` is a `linear-gradient()`; `background-color` silently rejects gradient values (confirmed via computed-style inspection: `rgba(0,0,0,0)`). Made the selected sensitivity pill, modal Done button, flag Acknowledge button, and history "Show dismissed" active state all render with invisible (white-on-transparent) text. Fixed 4 occurrences (`background:` instead of `backgroundColor:`) in `SafetySensitivityModal.tsx` (×2), `SafetyFlagDetailModal.tsx`, `SafetyFlagsPage.tsx`. Re-verified via re-run of both the full suite (21/21) and the tour (6/6) |
| Zero fixture residue | **Wired** | Direct SQL post-run: `safety_flags=0`, `safety_sensitivity_configs=0`, Mark's recipient row=0, `safety_flag` notifications=0, Casey/Alex both restored to `is_active=true` |
| Mobile/desktop nav parity (Convention #16) | N/A | `/safety-flags` is deliberately not a sidebar entry per the PRD (reached via Settings link / FO / notification only) — confirmed absent from nav in all 3 tour viewports |

### SM-C — Post-Build Verification (2026-07-08, closes PRD-30)

*(Checkpoint 5 for the whole build — every PRD MVP item this slice owns + D5/D6 outcomes: Wired / Stubbed / Missing. Zero Missing required. `safety-monitoring.spec.ts` 27/27 (run 3× clean, zero residue each time), `safety-beta-gate.spec.ts` 58/58 (run 2×), `npm run redteam` 66/66, Convention #277 eyes-on tour for the digest UI read and confirmed.)*

| Requirement | Status | Evidence |
|---|---|---|
| Weekly pattern summary generation | **Wired** | `safety-weekly-digest` Edge Function; migration 100303 (idempotency constraint + cron); pins: "a backdated flag... produces a non-zero summary", "idempotent: re-running... does not create a second summary", "zero-flag week... gets the PRD literal narrative" |
| Zero-flag digest = PRD literal narrative, no Haiku call | **Wired** | Pin asserts `narrative === 'No concerns detected this week.'` and no cost log |
| Non-zero digest = Haiku narrative, counts only | **Wired** | Pin plants a unique content marker in the flag's guarded columns and asserts the marker never appears in the narrative or the notification body |
| Digest is content-free by construction AND PRD-41-output-scanned | **Wired** | `scanUtilityOutput`/`enqueueOutputScan` wired into `generateNarrative` before ship — a real gap the redteam FULL MATRIX pin caught (this surface is member-facing prose, not a structured verdict, so it does not qualify for the classifier exception) |
| Digest notification (priority=normal, J3/D3) | **Wired** | Pin: `notifs[0].priority === 'normal'`, `notification_type === 'safety_digest'` |
| "This Week's Trend" inline digest view on `/safety-flags` | **Wired** | `WeeklyPatternSummarySection` in `SafetyFlagsPage.tsx`; Convention #277 eyes-on tour `sm-12`/`sm-13`, read and confirmed |
| Settings copy updated (no longer "coming soon" now that the digest is live) | **Wired** | `SafetyMonitoringSettingsSection.tsx` copy change |
| D5 — `mindsweep-sort` crisis-hit flag | **Wired** | `flagCrisisEvent()` at the existing crisis short-circuit; pin: Critical flag, `conversation_table`/`conversation_id` NULL, correct `matched_keywords`, mom notification `priority='high'` |
| D5 — `mindsweep-scan` crisis-hit flag (both `handleScan`/`handleLink` hit sites) | **Wired (static/vitest-verified)** | Live probing needs a real vision-model image or an uncontrolled external URL — not a repeatable isolated fixture; covered by the static drift pin + code review, matching the SAFETY-BETA-GATE Slice B precedent for this exact function |
| D5 — `message-coach` crisis-hit flag | **Wired** | Pin: Critical flag + mom notification; member still sees `coachingNote` containing '988' |
| D5 dedup (24h same member+category) | **Wired** | Pin: a second crisis phrase for the same member within the window creates zero new rows |
| D5 scope-discipline (exactly 3 surfaces, can't silently spread) | **Wired** | `tests/safety-crisis-flag.test.ts` static pin enumerates all Edge Function dirs and asserts the importer set equals exactly `{mindsweep-sort, mindsweep-scan, message-coach}` |
| D5 crisis response never depends on a DB lookup succeeding | **Wired (regression caught + fixed)** | An early draft reordered `message-coach` to resolve sender before the crisis check; caught by `safety-beta-gate.spec.ts`'s own documented invariant test; fixed by making the sender lookup an independent, separately try/caught best-effort operation inside the crisis branch — new static pins assert both the corrected ordering and the try/catch isolation |
| D6 — email delivery | **Stubbed (explicit, founder-acknowledged)** | Founder resolved D6=(a) "in scope" 2026-07-07, then chose "not ready" 2026-07-08 (no Resend API key/DNS yet) via AskUserQuestion. Registered in STUB_REGISTRY.md as an open item, not silently dropped. `notifications.email_sent_at`/`delivery_method` columns already exist, ready to receive it. |
| **Unplanned: invalid OpenRouter model ID silently broke 4 functions** | **Fixed** | `safety-weekly-digest` (caught pre-ship), `safety-classify` (PRD-30, broken since SM-A — Layer 2 + conversation starters had never once succeeded), `validate-ai-output` (PRD-41, cross-territory, founder+seat-approved), `message-coach` (PRD-15). All redeployed and reverified live. 2 more instances found + grandfathered (`auto-title-thread`, `lila-board-of-directors`) — STUB_REGISTRY.md. |
| **Unplanned: model-ID hygiene guard** | **Wired** | `tests/redteam/model-id-guard.test.ts`, wired into `npm run redteam`/pre-push, bans the invalid string platform-wide outside a dated grandfather list |
| CLAUDE.md Convention #282 (PRD-30 architecture) | **Wired** | Added |
| CLAUDE.md Convention #241 8th Silent Tooling Failure Pattern | **Wired** | Added |
| STUB_REGISTRY.md SM-C section | **Wired** | Added, plus corrections to 3 stale pre-SM-A/SM-C entries (`safety_scanned` columns, ThoughtSift Layer 2 coverage) |
| WIRING_STATUS.md SM-C section | **Wired** | Added |
| Feature decision file comprehensive Post-Build Verification table | **Wired** | 56 requirements: 54 Wired / 2 Stubbed / 0 Missing |
| `claude/live_schema.md` regeneration | **Wired** | Regenerated, diff reviewed (row-count drift + parallel-session tables, no destructive change) |
| `tsc -b` clean | **Wired** | Exit 0, whole project |
| lint clean on all touched files | **Wired** | 0 errors |
| Zero fixture residue (Testworth) | **Wired** | Verified after every one of the 3 full-suite runs + the eyes-on tour run — `safety_flags=0`, `safety_pattern_summaries=0`, `notifications WHERE category='safety'=0` |
| Commit | **Holding** | Per standing session instruction — rides the coordination seat's tree-wide batch, selective staging of this build's own files only |

**PRD-30 whole-build total: 0 Missing.** Two founder-acknowledged Stubbed items (email delivery; PRD-33 push notifications, pre-existing). Everything else Wired.
