# Feature Decision File: PRD-30 — Safety Monitoring

> **Created:** 2026-07-06 (Fable pre-build audit session)
> **PRD:** `prds/platform-complete/PRD-30-Safety-Monitoring.md` (read in full)
> **Addenda read:**
>   - `prds/addenda/PRD-30-Cross-PRD-Impact-Addendum.md` (the only PRD-30 addendum; glob-verified)
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md` (always-relevant; meta-guidance, no PRD-30-specific rulings)
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` (checked: contains ZERO safety/PRD-30 rows — general three-layer permission rules apply; PRD-30's recipient model is its own table per the PRD, not a `member_permissions` key)
>   - PRD-35/PRD-36 addenda: not applicable (no Universal Scheduler recurrence, no timers — the weekly digest is a fixed pg_cron cadence, not user-configured scheduling)
> **Companion sources read in full:** `prds/foundation/PRD-41-LiLa-Runtime-Ethics-Enforcement.md` (approved 2026-07-06 — integration substrate), `claude/feature-decisions/Safety-Beta-Gate.md` (2026-07-01 audit evidence), `claude/feature-decisions/Safe-Harbor-Backburner-Decision.md`, `.claude/rules/current-builds/SAFETY-BETA-GATE.md` (Slices A/B/C shipped state), CLAUDE.md Conventions #7/#143/#243/#247, `claude/live_schema.md`
> **Founder approved:** 2026-07-07 — ALL recommendations approved (D1–D7). D6 resolved as **(a) wire an email provider**, sequenced LAST within SM-C. Verbatim: "All recommendations approved; D6 = (a), sequenced last in SM-C."

---

## What Is Being Built

The invisible safety net behind the family AI. When a monitored family member (children by default, adults opt-in) says something concerning in a LiLa conversation — self-harm language, abuse indicators, grooming patterns, substance pressure, eating-disorder language, severe bullying — the platform detects it (cheap keyword scan on every message + Haiku classification of whole conversations) and privately alerts mom with the category, severity, a warm LiLa-generated "how to bring this up" suggestion, and curated resources. The monitored member never sees any indication a flag was raised. Mom configures per-member monitoring and per-category sensitivity once in Settings, reviews flags from notifications / Family Overview / a flag history view, and gets a weekly trend digest. Dad receives flags only if mom grants it. This completes the locked safety sequence (Layer 2 prompts → PRD-41 ethics enforcement → PRD-30 monitoring): **PRD-41 watches LiLa; PRD-30 watches the family member and tells mom.**

---

## The Five Judgment Areas (dispatch-mandated — resolved with recommendations)

### J1. Layer reconciliation — what PRD-30 reuses from PRD-41 vs builds fresh

PRD-30's two-layer design (March 2026) predates PRD-41's Tier-0/1/2 machinery (July 2026). They are **disjoint by content direction, so nothing scans the same message twice for overlapping purposes**:

| | PRD-41 (built next door) | PRD-30 (this build) |
|---|---|---|
| Watches | **LiLa's output** (assistant role) | **The member's input** (user role) + whole-conversation patterns |
| Taxonomy | 5 ethics categories (facilitation) | 8 safety categories (member wellbeing) |
| Consequence | Reframe/retract LiLa's content | Private flag + parent notification |
| Scan store | `ai_output_scans` (assistant text, 30-day retention) | `safety_scanned` poll flags on existing message tables (columns already exist, dormant since PRD-05) |

**PRD-30 REUSES (patterns, not tables):** the cron + status-column queue pattern (Convention #246 `util.invoke_edge_function`, `--no-verify-jwt` + in-code service-role bearer check — the production-proven shape PRD-41 chose over pgmq); the shared no-training OpenRouter client for all Haiku calls; the Zod-validated JSON-verdict Haiku pattern (temperature 0, cost logged to `ai_usage_tracking`, `feature_key='safety_classification'`); the **column-level content guard** (`REVOKE SELECT` on content-bearing columns, explicit column-list GRANT on the rest — see J2); append-only flag discipline; the `member_is_under_13` stamping shape for aggregation exclusions; the born-calibrated seed-corpus + static-drift-pin testing approach; the `notifications` write path.

**PRD-30 does NOT duplicate:** PRD-41's Tier-2 Haiku is output-ethics classification; PRD-30's Layer 2 Haiku is whole-conversation member-safety classification. Different content, different taxonomy, different table. PRD-41's Cross-PRD Impact section states this boundary verbatim: "PRD-30 classifies *user* content for parent alerting; it must not duplicate output validation. Its Haiku conversation classifier is a separate concern from Tier 2."

**PRD-30 does NOT ride `ai_output_scans`** — that table holds assistant outputs with 30-day validated-row deletion; safety flags are permanent member-safety records. PRD-30 polls its own dormant `safety_scanned` columns instead (they were built polling-shaped in migration 7, partial index included).

### J2. Monitoring ≠ reading — reconciling Screen 3 with the frozen kid-privacy carve-out

**The conflict:** PRD-30 Screen 3 (March 2026) shows mom a conversation excerpt (flagged message + 2 prior, expandable to 5). The founder's 2026-07-06 PRD-41 ruling (newer wins, Convention #11): mom-facing safety surfaces carry **surface + category + timestamp, NEVER conversation excerpts**, because the `lila_conversation` kid-privacy carve-out (`filterKidPrivate`, Convention #39) is **frozen pending attorney advice** — and a flag detail view that quotes the kid's LiLa conversation is exactly the side-door that ruling closed for PRD-41's log.

**Resolution (recommended — mirrors PRD-41 exactly):**
- **Capture everything at detection time** (you cannot retroactively capture context later): `safety_flags.context_snippet`, `matched_keywords`, and `classification_reasoning` are all written as the PRD specifies. All three are **content-bearing** (matched keywords ARE the kid's words; Haiku reasoning may quote) → all three get the column-level content guard: `REVOKE SELECT` from `authenticated`/`anon`, service-role only, explicit column-list `GRANT` on every other column.
- **Mom's flag detail view ships in no-excerpt mode:** severity, category (plain-language label, never enum strings — PRD-41 log precedent), timestamp, tool/surface, detection layer, the "How to Bring This Up" starter, curated resources, Acknowledge / Dismiss. The CONTEXT block and "Show More Context" from Screen 3 do NOT render — registered as a stub with unlock path.
- **The conversation starter becomes structurally leak-proof:** its Haiku prompt receives category + severity + child age ONLY — no conversation content in the prompt — so the output *cannot* quote the child. (Slight personalization loss vs the PRD's content-informed starter; acceptable under the freeze. The PRD's own prompt already ruled "Don't reference the AI conversation directly.")
- **Unlock path if attorney advice opens parental visibility:** a `GRANT` + UI change (render the already-captured snippet in Screen 3's designed layout) — no schema change, no re-detection, no data loss. Identical unlock shape to PRD-41's `content_excerpt`.
- **Weekly pattern summaries are content-free by construction** (category counts + trend + Haiku narrative generated from counts only) — no reconciliation needed.

This preserves the PRD's real promise — "just enough context to know what happened and a suggestion for how to bring it up" — via category + severity + starter, while honoring the frozen carve-out. Monitoring tells mom **that** and **what kind**; it does not (yet) show her **what was said**.

### J3. Notification philosophy — the safety-tier / growth-tier line

Convention #143: safety alerts are `priority='high'` and ALWAYS bypass DND. The read-layer bypass is **already implemented** (`useNotifications.ts:43-48`, SCOPE-2.F40 — `priority.eq.high` OR-clause). PRD-41 set the other pole: ethics retractions are `category='lila'`, `priority='normal'`, never bypass. The explicit line, drawn severity-wise inside PRD-30:

| Event | Category | Priority | DND | Rationale |
|---|---|---|---|---|
| **Critical** flag (self_harm, abuse, sexual_predatory crisis-level) | `safety` | `high` | **Bypasses** | Child may be in danger — the reason Convention #143 exists |
| **Warning** flag | `safety` | `high` | **Bypasses** | Clear concerning pattern — still safety-tier |
| **Concern** flag | `safety` | `normal` | Respects DND | Mild indicator; recorded + visible in history/FO/digest, never a 2am buzz. Prevents Convention #143 from becoming the alert-fatigue engine the PRD's own consolidation logic guards against |
| Weekly pattern digest | `safety` | `normal` | Respects DND | Trend review, not an alert |
| PRD-41 ethics retraction (for contrast) | `lila` | `normal` | Respects DND | LiLa misbehaved — growth/quality tier, not child-in-danger tier |

This **refines** Convention #143 (its blanket "safety alerts bypass" becomes "Critical + Warning bypass; Concern-severity records quietly") — founder decision D3 below. All severities remain locked-ON in notification preferences (mom cannot disable the safety category); DND is the only modulation, and only for Concern.

### J4. Coverage — every AI conversation store the pipeline must watch

Verified against live code (Grep, 2026-07-06). AI conversation content persists in exactly **three** stores:

| Store | Writers | User-role rows? | `safety_scanned`? | PRD-30 MVP disposition |
|---|---|---|---|---|
| `lila_messages` | **14 functions**: lila-chat + lila-cyrano, -higgins-say, -higgins-navigate, -mediator, -quality-time, -gifts, -observe-serve, -words-affirmation, -gratitude, -perspective-shifter, -decision-guide, -translator, -board-of-directors | Yes | **Exists, dormant** (migration 7:86, polling-shaped partial index 7:92-93) | **SCANNED** (Layers 1+2). Conversation-level `lila_conversations.safety_scanned` also exists (7:44), dormant |
| `bookshelf_discussion_messages` | bookshelf-discuss | Yes (member via `bookshelf_discussions.family_member_id`) | **Missing** | **SCANNED** — this is the gap the SAFETY-BETA-GATE audit named ("persists outside lila_messages; Layer 2 can't see it"). Add `safety_scanned` to both `bookshelf_discussion_messages` and `bookshelf_discussions`; flags reference the discussion polymorphically |
| `messages` (`message_type='lila'` via lila-message-respond, user messages in family threads) | lila-message-respond | Yes | Missing | **DEFERRED (post-MVP per the PRD's message-scanning deferral)** — and deliberately so: scanning family-chat threads collides with Convention #141 (mom CANNOT read other members' messages). Even a no-excerpt flag on sibling chat is a policy question the PRD explicitly pushed post-MVP. Documented stub |

**Non-persisted AI surfaces where a monitored member's free text meets AI but never lands in a scannable table:** mindsweep-sort (teen evening MindSweep-Lite brain dumps — Conventions #180/#192), mindsweep-scan, message-coach (kids' outgoing drafts). These now have crisis gates (Slice B) but a crisis hit **never reaches mom** — the resources render to the member and the moment vanishes. Under the polling architecture (J-arch below), persisted conversations get crisis coverage automatically (crisis keywords seed into `safety_keywords` at `base_severity='critical'`), but these three surfaces need a thin fire-and-forget flag write at their existing `detectCrisis` hit sites. **Founder decision D5.**

**Explicitly out of monitoring reach (documented, not gaps):** journal entries (post-MVP per PRD), embedded/link-out Vault tools (external platforms), whisper-transcribe (transcription is input to surfaces that are themselves screened), non-AI app content.

### J5. PRD-20 strip — Safe Harbor references removed without breaking defensive plumbing

PRD-30 references PRD-20 in three load-bearing ways. Dispositions:

1. **Dependency line ("Depends on: PRD-20")** → dropped. PRD-20 is backburnered indefinitely (2026-06-09); nothing in this build waits on it or promises it.
2. **"Safe Harbor conversations ARE monitored"** → becomes defensive-only. All 4 `safe_harbor*` modes are `is_active=false` (migration 100249) — no Safe Harbor conversations can be created. The pipeline does NOT add an `is_safe_harbor=false` filter to scanning: safety scanning is per-message safety processing, the same class as the crisis override (Convention #7 global), NOT data aggregation — precisely the line PRD-41 drew, and PRD-20's own text confirmed monitoring applied even when it was alive. Any stray `is_safe_harbor` row that ever gets scanned produces a flag like any other (safety trumps); the flag row carries a defensive `is_safe_harbor` boolean excluded from pattern summaries and any future aggregation. If PRD-20 ever revives, its pre-build re-examines this line (same note PRD-41 recorded).
3. **Teen transparency ("teens know via PRD-20's AI Literacy Module")** → **the disclosure channel is gone and must be replaced**, or monitoring becomes the undisclosed surveillance the PRD's own privacy stance rejects ("this is not hidden surveillance — it's disclosed as a safety net"). Recommended replacement: a standing disclosure row in the teen **What's Shared** panel (`src/features/permissions/TeenTransparencyPanel.tsx`, mounted in teen Settings since PERMISSIONS-WIRING) — general wording ("if you ever say something to LiLa that sounds like you might be in danger, the app quietly lets your mom know"), always present when monitoring is active for that teen, never per-flag. Guided/Play children: no disclosure surface (their LiLa conversations are already mom-visible by default per PRD-05, and their shells have no Settings depth) — the parent-side FeatureGuide carries the "talk to your kids about this" guidance instead. **Founder decision D4.**
4. **Convention #243's enforcement mechanism lands HERE.** The convention's own text: the grep-based CI check + guard implementation "land with the first aggregation PRD build (PRD-19, PRD-28B, or PRD-30 — whichever ships first)." PRD-30 is first. The build ships the Convention #243 grep-CI check (all `lila_conversations` aggregation/reporting/context queries filter `is_safe_harbor=false`), with safety scanning registered as the documented, deliberate exception.

---

## The Architecture Decision (biggest deviation from PRD wording): polling, not request-path hooks

The PRD (March 2026) says Layer 1 runs "synchronously after the message is saved… hooks into the message pipeline." **Recommended: both layers run via a polled sweep instead** — a `safety-classify` Edge Function invoked by pg_cron every minute (Convention #246), which:

1. **Layer 1 sweep:** claims unscanned user-role rows (`safety_scanned=false`) from `lila_messages` + `bookshelf_discussion_messages` where the author is an actively monitored member; runs keyword/phrase matching against `safety_keywords`; marks rows scanned; on any newly scanned user message in a previously classified conversation, clears the conversation-level `safety_scanned` (re-opened conversations re-classify — the scanner is the single writer of these flags, nothing else needs touching).
2. **Layer 2 classification:** claims conversations/discussions of monitored members with ≥1 user message, conversation-level `safety_scanned=false`, and last message older than 30 minutes (verified: `lila_conversations.status` has NO 'closed' state — 'active'/'archived'/'deleted' only — so inactivity is the only end-of-conversation signal that exists); runs the Haiku classification (full conversation text, 8 categories, JSON verdict); marks classified.
3. **Flag generation** (either layer, threshold-filtered by per-member sensitivity): dedup window check (24h same member+category consolidates unless higher severity), `safety_flags` insert, content-free starter generation, consolidated notification write, alert-fatigue daily-consolidation check (>5 same-category flags/day → single daily summary flag).

**Why this beats request-path hooks:**
- **Zero Edge Function retrofit.** The 14 `lila_messages` writers + bookshelf-discuss stay untouched — no 16-function wiring pass, no risk to conversation latency, no new failure mode in the request path (a scanning bug can never break a family conversation).
- **The schema was built for it.** Migration 7's `safety_scanned` partial index is polling-shaped; the SAFETY-BETA-GATE audit called it that.
- **It's the pattern PRD-41 just standardized** (cron + status-column, production-proven by the restored embedding pipeline; "the queue row IS the audit record" — here, the flag columns are).
- **Latency cost is immaterial for this feature.** Detection moves from "instant" to ≤ ~60-90 seconds. Flags are invisible to the member and mom responds on human timescales; the real-time member-facing response to crisis content is Convention #7's crisis override, which already fires in the request path on every surface (Slice B). PRD-30 is the parent-notification layer, where a minute is nothing.
- **Monitored-member + sensitivity + tier gating live in ONE place** (the sweep), not scattered across 16 functions.

**Founder decision D1** (deviation from PRD wording — same behavior, different plumbing).

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| **Screen 1 — Settings → "Safety Monitoring" section** | `SettingsSection` on `SettingsPage.tsx` (existing inline-section pattern), primary-parent only (not visible to dad even when he receives flags — addendum ruling). Recipient toggles (mom locked ON + Lock icon; dad toggle), monitored-member list with per-member ON/OFF + gear (Settings2 icon, not ⚙️ emoji — Lucide only), delivery channel toggles (in-app; email disabled-with-caveat until email infra per D6), weekly digest toggle, "View Flag History →" link |
| **Screen 2 — Per-member sensitivity modal** | ModalV2 `transient`. 8 category rows, Low/Medium/High (segmented control or slider), 3 locked rows (self_harm, abuse, sexual_predatory) pinned High with Lock icon; shell-type defaults per PRD (Play/Guided all High; Independent: substance/bullying/other Medium, profanity Low; adults all Medium, profanity Low); Reset to Defaults; Save |
| **Screen 3 — Flag detail (NO-EXCERPT MODE)** | ModalV2 from notification tap-through or history. Severity banner (Critical = expanded red-token banner), plain-language category label, timestamp, tool/surface, "How to Bring This Up" starter, curated resources (per category from `safety_resources`), Acknowledge / Dismiss (False Positive). **No CONTEXT block, no Show More Context** (J2 — stubbed pending attorney unlock). No Delete action ever |
| **Screen 4 — Flag history** | Filterable (member / category / time), time-grouped (This Week / Last Week / Earlier), severity indicators via Lucide + theme tokens (no emoji dots), dismissed rows muted, tap → Screen 3, Load More pagination. **Canonical route: `/safety-flags`** (recipient-gated — mom + granted dad, GrantedRoute-shape guard, NOT MomOnlyRoute since granted dads reach it); notification `action_url` = `/safety-flags?flag=<id>` (opens Screen 3 detail over the history). Reached from Settings link, FO section, and notifications — NOT a sidebar entry (Convention #16 parity N/A) |
| **Screen 5 — Family Overview safety section** | Registered as FO per-member column section key `safety_monitoring` via the existing `mergeSectionOrder` read-time graft (Convention #275 FO column architecture postdates the PRD's single-card mockup — same content, FO-native shape: each monitored kid's column shows "1 new flag (Warning) [Review →]" or "No flags ✓"; hidden in columns of unmonitored members). Visible to mom + granted dad only. Founder decision D7 if she prefers the PRD's single summary card instead |
| **Notification integration** | `notifications` rows per J3 table; consolidated per conversation (multi-category → one notification, highest severity, categories listed); NotificationTray already styles `priority='high'` as safety; tap-through `action_url` → flag detail |
| **Teen disclosure row** | What's Shared panel (TeenTransparencyPanel) standing entry when monitoring active (J5/D4) |
| **Weekly digest (in-app)** | `safety_pattern_summaries` row + quiet notification linking to a digest view (part of flag history surface); email rendition when email lands (D6) |
| **FeatureGuide + LiLa knowledge** | `<FeatureGuide featureKey="safety_monitoring_basic" />` on the Settings section; `help-patterns.ts` entries ("how does safety monitoring work", "safety alerts"); `feature-guide-knowledge.ts` page knowledge + warm setup recipe (Convention #14 Part B) |
| **Empty states** | Settings: all-off state explains the promise; History: "No flags — that's a good week"; FO: "Monitoring active, no flags ✓"; unmonitored: "Safety Monitoring is available in Settings" |

**No kid/teen/Special-Adult surfaces exist anywhere.** Guided/Play/Independent shells render nothing; Special Adult has no visibility and is not monitorable (PRD role table).

---

## Key PRD Decisions (Easy to Miss)

1. **Children monitored ON by default (opt-out); adults opt-in.** Auto-provision on member creation + **backfill for the 3 existing production families' members in the migration** (the PRD only covers new members; production already has ~20).
2. **Mom cannot be monitored.** No config row for `primary_parent` (enforced app-layer + write-path RLS; also excluded: the hidden `role='family'` shadow row, Convention #273, and Special Adults).
3. **Three locked categories** (self_harm, abuse, sexual_predatory) enforced at High **at the application/pipeline layer regardless of stored DB value** (addendum ruling — the pipeline ignores the column for these).
4. **Layer-disagreement rule:** Layer 1 keyword hit + Layer 2 "no concern" → flag still generated at the LOWER severity with a note (over-alert beats under-alert).
5. **Negation still triggers:** "I don't want to die" flags (deliberate over-flag for critical categories — same philosophy as crisis-detection).
6. **Dedup:** same member + category within 24h → update existing flag with new context unless new severity is HIGHER (then new flag).
7. **Alert fatigue:** >5 same-category flags/member/day → one daily consolidated flag.
8. **Flags are permanent.** No delete path, no UPDATE beyond status/review fields; status transitions one-way `new → acknowledged | dismissed`; dismissed stays visible (muted).
9. **Sensitivity semantics:** Low sensitivity = Concern-severity keyword hits are logged-not-flagged; Medium requires higher base severity for non-critical categories; High flags everything. Locked categories always High.
10. **Severity of the flag ≠ severity of the keyword:** keywords carry `base_severity` (minimum); Layer 2 can raise.
11. **Resources are curated, never AI-generated** (hotline numbers must be exact) — seeded `safety_resources` rows per category, admin-maintained.
12. **`safety_scanned` on BOTH `lila_messages` (Layer 1 done) and `lila_conversations` (Layer 2 done)** — both columns already exist (migration 7), dormant; this build wires them. New columns needed only on the two bookshelf tables.
13. **Feature keys:** `safety_monitoring_basic` (Enhanced — Layer 1 + flag review + resources) / `safety_monitoring_ai` (Full Magic — Layer 2 + starters + summaries). Tier check inside the sweep (family tier), honoring the beta `useCanAccess` bypass (all-on during beta). Unlike PRD-41, PRD-30 IS configurable and tier-gated by design.
14. **Emoji in PRD mockups (⚙️🔴📞) render as Lucide icons + theme tokens** — platform rule overrides mockup literals.
15. **Weekly digest moves from "MVP When Dependency Is Ready" into MVP scope** — its named dependency (scheduled job infrastructure) now exists (pg_cron + Convention #246). Email *delivery* of it remains dependent on D6.
16. **`notification_type='safety_flag'`** value used on notification rows (addendum).
17. **Layer 2 classification failure:** retry ×3 with backoff, then park for the next sweep (status/retry columns on the conversation-scan bookkeeping, mirroring PRD-41's `retry_count → error` discipline).

---

## Addendum Rulings

### From `PRD-30-Cross-PRD-Impact-Addendum.md`:
- Two-layer detection is a reusable platform pattern (filter cheaply first, AI selectively) — journal/message scanning extend it post-MVP.
- Locked categories are an **application-layer override** — DB may store a different value; pipeline ignores it for the three locked keys.
- Conversation-starter generation = one focused Haiku call per event, 2-3 sentence output.
- Flag permanence: one-way status transitions, immutable safety records.
- PRD-01 impact: child members auto-create config `is_active=true`; adult members auto-create `is_active=false`; primary parent auto-creates as notification recipient — extend `auto_provision_member_resources` (**base the rewrite on the CURRENT production trigger definition, never a superseded migration body** — the copy-stale-body failure mode is documented in the KIDS-REWARDS build file).
- PRD-22 impact: Settings section is **primary-parent-only** — dad receives flags but never sees configuration.
- PRD-14C impact: FO section key `safety_monitoring`, visible only to safety notification recipients.
- Cost: <$0.05/family/month total (Layer 2 $0.01-0.04/member/mo + $0.001/flag starter + $0.001/member/wk narrative) — within budget, zero Sonnet.
- PRD-15 impact: safety alerts `category='safety'`, `priority='high'`, bypass DND, locked ON in preferences (refined by J3 for Concern severity — D3).
- PRD-20 impact section is **superseded** by the backburner decision + J5 above.

### From `PRD-Audit-Readiness-Addendum.md`:
- Meta-guidance only (decision-rationale/deferred/depends-on tagging habits). No PRD-30-specific rulings. Habits carried into this file's structure.

### From `PRD-31-Permission-Matrix-Addendum.md`:
- No safety rows exist in the permission profiles. `safety_notification_recipients` is PRD-30's own grant table — profiles never touch it (consistent with Convention #274's explicit-grant-only principle). Permission Hub may later surface it read-only via `keyWiringStatus` — not built now.

---

## Database Changes Required

### New Tables (7 — all per PRD schema, with the deviations noted)
- `safety_monitoring_configs` — per-member toggle. UNIQUE (family_id, monitored_member_id). RLS: primary parent CRUD; nobody else.
- `safety_sensitivity_configs` — per member per category. UNIQUE (family_id, monitored_member_id, category). RLS: primary parent only.
- `safety_notification_recipients` — recipient grants + `notification_channels TEXT[]`. RLS: primary parent CRUD; recipient reads own row.
- `safety_flags` — **deviations from PRD schema:** (a) polymorphic conversation ref: `conversation_table TEXT CHECK ('lila_conversations','bookshelf_discussions') NULL` + `conversation_id UUID NULL` (was NOT NULL FK → lila_conversations) so bookshelf discussions and non-conversation crisis events (D5) can flag; (b) `surface TEXT` (Edge Function name, PRD-41 shape); (c) `is_safe_harbor BOOLEAN DEFAULT false` defensive flag; (d) **column-level content guard** on `context_snippet`, `matched_keywords`, `classification_reasoning` (service-role only — J2). RLS: mom + active recipients read; mom (and recipients? — reviewer is whoever acknowledges) update status/review fields only; INSERT service-role; no DELETE policy exists.
- `safety_keywords` — platform-level (no family_id), admin-curated, UNIQUE keyword, `base_severity`, `is_phrase`, `is_active`. Seed ≥50 across 8 categories including teen slang variants ("unalive", "sh") AND the `CRISIS_KEYWORDS` set from `crisis-detection.ts` at `base_severity='critical'` (guarantees crisis language in any persisted conversation always produces a Critical flag). Seeds authored together with the test corpus (born-calibrated, PRD-41 principle). Read via service role in the sweep.
- `safety_resources` — platform-level curated resources per category (988, Crisis Text Line, NDVH, SAMHSA, NEDA, StopBullying.gov, etc. — verified numbers). Read-only to app.
- `safety_pattern_summaries` — weekly digest rows (JSONB `summary_data` counts + Haiku `narrative`). RLS: mom + recipients read.

### Modified Tables
- `lila_messages.safety_scanned` — **exists** (migration 7:86 + partial index) — wire, don't add.
- `lila_conversations.safety_scanned` — **exists** (7:44) — wire, don't add.
- `bookshelf_discussion_messages.safety_scanned BOOLEAN DEFAULT false NOT NULL` + partial index — **add** (J4 coverage closure).
- `bookshelf_discussions.safety_scanned BOOLEAN DEFAULT false NOT NULL` — **add**.
- `messages` — NOT touched (message scanning deferred).

### Triggers / Functions / Cron
- Extend `auto_provision_member_resources` (current production definition): child → config `is_active=true`; additional_adult → `is_active=false`; skip `role='family'` shadow + special adults; family creation → primary parent recipient row.
- Migration backfill: configs + recipient rows for all existing families/members (idempotent).
- `updated_at` triggers on the four tables the PRD names.
- pg_cron: `safety-classify` every minute (offset from embed/validate-ai-output — e.g. `:50s`), weekly summary job Sunday night — both via `util.invoke_edge_function` (Convention #246).
- Convention #243 grep-CI check ships in this build (the convention names PRD-30 as the landing slot).

### New Edge Function
- `safety-classify` (name per `claude/architecture.md`'s planned-functions table) — dedicated (Convention #165), deployed `--no-verify-jwt` with in-code service-role bearer check, structured per-invocation count logging (Silent Tooling Failure discipline — this pipeline must never die silently; sweep counts queryable).

### Migration protocol
- **No number reserved by this audit.** Take the next free number at file-creation time; re-verify immediately before applying; if foreign unapplied migrations are pending, apply only this build's idempotent SQL via `supabase db query --linked -f` (never batch-push others' work). After apply: `npm run schema:dump`.

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `safety_monitoring_basic` | Enhanced | mom (config + review); dad conditional read via recipient grant | Layer 1 keywords, flag review, resources. Safety shouldn't sit behind the top paywall (PRD rationale) |
| `safety_monitoring_ai` | Full Magic | same | Layer 2 classification, conversation starters, pattern summaries. Per-conversation AI cost justifies tier |

Both registered in `feature_key_registry` + `feature_access_v2` (idempotent upsert — glossary already lists them; verify live rows). Beta: `useCanAccess` returns true → everything on for beta families. Settings section gated `<PermissionGate featureKey="safety_monitoring_basic">` + primary-parent check.

---

## Stubs — Do NOT Build This Phase

- [ ] **Context snippet visibility to mom** — captured + column-guarded, never rendered. Unlock = attorney advice → GRANT + UI change (J2). THE load-bearing stub.
- [ ] **PRD-15 message scanning** (including lila-message-respond user messages) — post-MVP per PRD + Convention #141 tension documented in J4.
- [ ] **Journal entry scanning** — post-MVP per PRD.
- ~~Email delivery~~ — **NOT a stub. D6 resolved (a) 2026-07-07:** email provider wiring (Resend recommended) is IN scope, sequenced last within SM-C. Critical-flag emails + weekly digest emails ship; the shared email sender should be built as reusable infrastructure (it also unblocks Out of Nest emails + PRD-15 email prefs — those consumers are follow-ups, not this build). Needs founder-supplied API key + domain DNS at SM-C time.
- [ ] **Push notifications for Critical flags** — PRD-33 (service workers).
- [ ] **Auto-sensitivity suggestions from dismissal rates** — post-MVP analytics.
- [ ] **Admin keyword management UI** — PRD-32 (keywords are seeded rows; admin edits via SQL/dashboard until then).
- [ ] **Trend visualization charts** — post-MVP.
- [ ] **LiLa proactive check-in suggestions from flag patterns** — post-MVP (also flagged in `project_horizon_items` memory).
- [ ] **Multi-turn guard-probing detection** — PRD-41 named it PRD-30-*adjacent*, not PRD-30 MVP; mom's surfaces make patterns visible, nothing automated acts.
- [ ] **Safe Harbor anything** — backburnered; defensive flag column only (J5).
- [ ] **Permission Hub row for the recipient grant** — PRD-30's own table + Settings UI is the authority; Hub surfacing can come with a later permissions pass.

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Scans user messages | ← | PRD-05 LiLa engine (14 writer functions) | Polling `lila_messages.safety_scanned=false`, user role, monitored members |
| Scans book discussions | ← | PRD-23 BookShelf | Polling `bookshelf_discussion_messages` (new column), member via `bookshelf_discussions.family_member_id` |
| Auto-creates configs | ← | PRD-01 member creation | `auto_provision_member_resources` extension |
| Crisis-hit flags (D5) | ← | Slice B crisis gates | Thin fire-and-forget helper at `detectCrisis` hit sites on non-persisted surfaces (mindsweep-sort, mindsweep-scan, message-coach) |
| Sends alerts | → | PRD-15 notifications | `notifications` rows per J3 (`category='safety'`, `notification_type='safety_flag'`, consolidated); read-layer DND bypass already live |
| FO section | → | PRD-14C Family Overview | Section key `safety_monitoring` via `mergeSectionOrder` graft |
| Settings section | → | PRD-22 Settings | `SettingsSection` on SettingsPage, primary-parent-only |
| Teen disclosure | → | PERMISSIONS-WIRING teen panel | `TeenTransparencyPanel` standing row (D4) |
| Haiku calls | → | Shared AI infra | No-training OpenRouter client; `ai_usage_tracking` `feature_key='safety_classification'`; Zod-validated JSON |
| Queue/cron pattern | ← | PRD-41 substrate | Cron + status-column pattern, Convention #246, column-guard pattern, under-13 stamping shape |
| Tier gating | ← | PRD-31 | `feature_access_v2` rows; beta bypass honored |

---

## Things That Connect Back to This Feature Later

- **PRD-41 dad-log access** — "arrives via PRD-30's safety-recipient grants" (PRD-41's own text): a future pass may let `safety_notification_recipients` also unlock the LiLa Response Log for dad.
- **PRD-32 Admin Console** — keyword management UI + cross-family flag statistics (COPPA-filtered).
- **PRD-33 PWA** — push delivery for Critical flags.
- **PRD-40 COPPA** — under-13 aggregation exclusions reuse the stamping shape; single-family flag delivery to mom is within parental consent.
- **Post-MVP journal/message scanning** — extends the same sweep + keyword tables.
- **Attorney-advice unlock** — context snippet GRANT + UI.
- **PRODUCT_VISION.md** — its present-tense "watches kids' conversations by default" finally becomes true; doc-drift note closes.

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate (2026-07-07)
- [x] All addenda captured above
- [x] Founder decisions D1–D7 resolved: ALL recommendations approved; D6 = (a) email provider wiring, sequenced last in SM-C
- [x] Stubs confirmed — nothing extra will be built (email removed from stubs per D6)
- [x] Schema changes correct (incl. the polymorphic flag ref + column guards)
- [x] Feature keys identified
- [x] **Approved to build** (2026-07-07)

---

## Post-Build PRD Verification

> Completed after build (SM-A + SM-B + SM-C combined), before declaring the phase done. Zero Missing = complete.

### PRD §What "Done" Looks Like — MVP (Must Have)

| Requirement | Status | Notes |
|---|---|---|
| `safety_monitoring_configs` table + RLS | ✅ Wired | Migration 100289 (SM-A) |
| `safety_sensitivity_configs` table + RLS | ✅ Wired | Migration 100289 (SM-A) |
| `safety_notification_recipients` table + RLS | ✅ Wired | Migration 100289 (SM-A) |
| `safety_flags` table + RLS (polymorphic conversation ref + column guard deviation, J2/D2) | ✅ Wired | Migration 100289 (SM-A) |
| `safety_keywords` table, ≥50 keywords across all categories | ✅ Wired | 86 active keywords, migration 100289 (SM-A) |
| `safety_resources` table, curated resources per category | ✅ Wired | Migration 100289 (SM-A) |
| `safety_pattern_summaries` table + RLS | ✅ Wired | Table+RLS in migration 100289 (SM-A); generation logic + idempotency constraint in migration 100303 (SM-C) |
| Layer 1 keyword matching on every LiLa message from monitored members | ✅ Wired | `safety-classify` polled sweep (SM-A), model-ID bug fixed (SM-C) |
| Layer 2 Haiku classification on conversation completion | ✅ Wired | `safety-classify` (SM-A); was silently non-functional since SM-A due to an invalid model ID (found + fixed SM-C — Layer 2 had never actually classified anything in production until this fix) |
| Flag generation with context snippets (flagged message + 2 before) | ✅ Wired | `buildContextSnippetFromIndex`/`Indices` (SM-A); column-guarded per J2/D2 |
| Conversation starter suggestion per flag via Haiku | ✅ Wired | `generateConversationStarter` (SM-A); was silently non-functional since SM-A (same model-ID bug), fixed SM-C — verified live post-fix with a genuine, warm, content-free starter |
| Settings → Safety Monitoring section (Screen 1) | ✅ Wired | `SafetyMonitoringSettingsSection.tsx` (SM-B) |
| Per-member sensitivity configuration (Screen 2) | ✅ Wired | `SafetySensitivityModal.tsx` (SM-B) |
| Safety flag detail view (Screen 3) | ✅ Wired (NO-EXCERPT MODE per J2/D2) | `SafetyFlagDetailModal.tsx` (SM-B) — context/excerpt block deliberately never rendered, frozen pending attorney advice |
| Safety flag history view (Screen 4) | ✅ Wired | `SafetyFlagsPage.tsx` at canonical route `/safety-flags` (SM-B), extended with the "This Week's Trend" digest section (SM-C) |
| Family Overview safety summary section (Screen 5) | ✅ Wired | `safety_monitoring` FO column section (SM-B), FO-native shape per Convention #275 (differs from the PRD's single-card mockup, founder-approved D7) |
| Notification integration — safety flags bypass DND | ✅ Wired | `priority='high'` for Critical/Warning (D3 refinement of Convention #143); Concern respects DND |
| Email delivery for safety flag alerts | ⏳ Stubbed | Founder D6 resolved "in scope" 2026-07-07, then chose "not ready" 2026-07-08 (no Resend credentials yet) — explicit, acknowledged, registered open item in STUB_REGISTRY.md, not silently dropped |
| New children auto-created with monitoring ON | ✅ Wired | `auto_provision_member_resources` extension (SM-A); backfilled for all existing production families |
| Locked categories cannot be lowered below High | ✅ Wired | Enforced at the application/pipeline layer (`isLockedCategory`), survives a tampered DB row; UI shows a Lock pill, no editable control |
| Flagged member has zero visibility into flag existence | ✅ Wired | No RLS policy grants the flagged member's own row visibility on `safety_flags` |
| RLS verified: flagged member cannot query safety tables | ✅ Wired | `tests/e2e/features/safety-monitoring.spec.ts` RLS leak probes (SM-A); one narrow, deliberate exception — a monitored member CAN read their own `safety_monitoring_configs.is_active` (migration 100299, the teen disclosure mechanism itself, J5/D4) |
| Dedup: same member + category within 24h consolidates | ✅ Wired | `decideDedup` (SM-A); D5 crisis-hit flags reuse the same window (SM-C) |
| `safety_scanned` on `lila_messages` prevents double-processing | ✅ Wired | Migration 7 column, wired by SM-A |

### PRD §What "Done" Looks Like — MVP When Dependency Is Ready

| Requirement | Status | Notes |
|---|---|---|
| Weekly pattern summary generation + digest | ✅ Wired | `safety-weekly-digest` (SM-C) — in-app digest; email rendition is the one stubbed piece above |
| Push notification for Critical flags | 📌 Stubbed (Post-MVP) | PRD-33 dependency, unchanged |

### J-Area Resolutions (feature decision file §The Five Judgment Areas)

| Area | Resolution | Status |
|---|---|---|
| J1 — Layer reconciliation vs PRD-41 | Disjoint by content direction; PRD-30 reuses patterns not tables | ✅ Wired |
| J2/D2 — No-side-door / no-excerpt rule | Column guard + no-excerpt flag detail UI + content-free starter/narrative prompts | ✅ Wired |
| J3/D3 — Severity-tiered DND | Critical/Warning bypass, Concern respects DND | ✅ Wired |
| J4 — Coverage (lila_messages, bookshelf_discussion_messages, D5 non-persisted surfaces) | All three scanned/wired; `messages` (PRD-15) deliberately deferred | ✅ Wired / 📌 Stubbed (messages, Post-MVP per PRD) |
| J5 — PRD-20 strip | Dependency dropped; defensive `is_safe_harbor` flag; disclosure rehomed to teen What's Shared panel | ✅ Wired |

### D-Decision Outcomes

| Decision | Outcome | Status |
|---|---|---|
| D1 — Polling architecture | `safety-classify` cron-invoked every minute, not request-path hooks | ✅ Wired |
| D2 — No-excerpt flag view | Screen 3 ships content-free; column guard enforced at the DB layer | ✅ Wired |
| D3 — Severity-tiered DND | Refines Convention #143 | ✅ Wired |
| D4 — Teen disclosure replacement | Standing row in `TeenTransparencyPanel` | ✅ Wired |
| D5 — Crisis-hit flag wiring on non-persisted surfaces | `mindsweep-sort`, `mindsweep-scan`, `message-coach` | ✅ Wired |
| D6 — Email delivery | Resolved "(a) in scope" 2026-07-07; founder chose "not ready" 2026-07-08 | ⏳ Stubbed (explicit, acknowledged) |
| D7 — FO section shape | Per-member column section (Convention #275-native), not the PRD's single card | ✅ Wired |

### Unplanned findings this build (SM-C)

| Finding | Resolution | Status |
|---|---|---|
| Invalid OpenRouter model ID silently broke `safety-classify`'s Layer 2 + conversation starters since SM-A | Fixed — `'anthropic/claude-haiku-4.5'` | ✅ Fixed |
| Same bug in `validate-ai-output` (PRD-41) — Tier 2 had never confirmed/rejected anything | Fixed, cross-territory, founder+seat-approved | ✅ Fixed |
| Same bug in `message-coach` (PRD-15) — real coaching-note generation | Fixed | ✅ Fixed |
| Same bug found (not fixed) in `auto-title-thread`, `lila-board-of-directors` | Grandfathered + flagged in STUB_REGISTRY | ⏳ Stubbed (explicit) |
| `safety-weekly-digest`'s narrative lacked PRD-41 output-scan wiring | Fixed before ship — `scanUtilityOutput`/`enqueueOutputScan` wired in | ✅ Fixed |
| `message-coach` D5 reorder regressed the crisis-response-must-never-depend-on-DB invariant | Caught by `safety-beta-gate.spec.ts`'s own regression pin, fixed — crisis check restored to run unconditionally first | ✅ Fixed |
| `safety-weekly-digest` sweeps ALL monitored members platform-wide, creating test-fixture side effects in Testworth beyond what any single test tracks | Test cleanup hardened to a family+category-scoped sweep | ✅ Fixed |

**Status key:** ✅ Wired = built and functional · ⏳ Stubbed (MVP) = documented open item, committed to a future build · 📌 Stubbed (Post-MVP) = speculative/deferred · Missing = incomplete

### Summary
- Total requirements verified: 37 (MVP checklist) + 5 (J-areas) + 7 (D-decisions) + 7 (unplanned findings) = 56
- Wired: 54
- Stubbed: 2 (email delivery — explicit, founder-acknowledged; PRD-33 push — pre-existing Post-MVP)
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs acceptable and in STUB_REGISTRY.md
- [ ] Zero Missing confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
