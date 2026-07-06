# Data-Practices Summary — Technical Grounding for Counsel

> **DRAFT — FOR ATTORNEY REVIEW — NOT LEGAL ADVICE**
>
> Prepared 2026-07-04 by the founder's AI drafting assistant as review material for licensed
> counsel. This is the factual foundation for the other three drafts (privacy policy, COPPA
> direct notice, parental-consent flow copy). Every claim here traces to the product
> requirements document PRD-40, the live database schema snapshot (`claude/live_schema.md`,
> regenerated from production 2026-07-05), the platform conventions file (`CLAUDE.md`), or a
> direct codebase check performed on 2026-07-04. Items we could not verify are marked
> **[UNKNOWN — FOR COUNSEL]** or **[FOUNDER INPUT NEEDED]** — nothing is papered over.

---

## 1. What the platform is

1.1. **Operator:** Three Little Lanterns LLC, a Missouri limited liability company
([FOUNDER INPUT NEEDED: registered address, phone]). Sole owner-operator: Tenise Wertman.
Products: **MyAIM Central** (myaimcentral.com — the family platform) and **AI Magic for Moms /
AIMfM** (aimagicformoms.com — a public blog and AI-literacy membership).

1.2. **What it does:** a family management platform for mothers managing complex households
(homeschool families, disability families, families using Education Savings Accounts). The
mother ("mom," platform role `primary_parent`) is the account owner and administrator. She may
add a spouse/partner, other trusted adults ("Special Adults"), teens (13–17), and children
under 13. Each role gets a purpose-built interface ("shell"): Mom, Adult, Independent (teens),
Guided (roughly ages 8–12), and Play (young children).

1.3. **The AI assistant ("LiLa"):** a context-aware assistant that uses family knowledge the
mother configures (notes, goals, preferences) to personalize responses. Every AI output passes
a human review step (Edit / Approve / Regenerate / Reject) before it is saved — a deliberate
design pattern the platform treats as both UX and a COPPA posture ("Human-in-the-Mix").

1.4. **Audience:** United States, nationwide. Users may reside in any state. The company is
based in Missouri. There is no international offering and no current plan for one.

1.5. **Commercial model:** subscription SaaS (tiers $9.99–$39.99/month planned; a limited
"founding family" beta cohort of up to 100 families). No advertising. No sale of data. No
third-party ad or analytics SDKs are present in the codebase (verified by dependency and
source scan, 2026-07-04).

---

## 2. Built today vs. specified-but-dormant (critical context)

Counsel should understand three states of the platform:

2.1. **Built and in production today:** the family platform itself (tasks, journals, AI
conversations, archives, allowance ledger, messaging, gamification, etc.), used **only by the
founder's own family and internal test families**. No outside customers. No payments of any
kind have ever been processed — there is **zero Stripe code** in the codebase today (verified
2026-07-04).

2.2. **Specified but not yet built (PRD-40):** the entire COPPA consent apparatus — consent
database tables, the $1 verification charge, the 5-section consent flow, the parental data
export, the revocation-and-deletion cascade, and the retention-enforcement jobs. PRD-40 (dated
2026-04-16) specifies all of it in detail; a build has been planned and slice-scoped but not
started as of 2026-07-04. **The consent screens ship with a database field
`lawyer_approved_at = NULL`, and the flow is inert for real users until counsel's approved
text is loaded and that field is set.** Your sign-off is the literal software gate.

2.3. **The cohort plan (founder decision 2026-04-21, re-confirmed 2026-07-04):**
- **Beta cohort 1** is scoped to families with **no children under 13**. The COPPA framework
  ships "dormant-but-built" at beta launch.
- **Beta cohort 2** (families with under-13 children) opens only after (a) counsel's review
  completes, (b) `lawyer_approved_at` is populated on the consent templates, and (c) the
  revocation/deletion cascade build is complete and tested.

2.4. **Interim exposure (founder-accepted risk, for counsel's awareness):** the founder's own
under-13 children currently use the platform without the consent infrastructure, on the theory
that the founder is herself the consenting parent. The plan is to backfill her family's formal
consent records as the first real consent events once the flow exists. Counsel should confirm
this posture is acceptable and whether anything should be documented now.

---

## 3. Inventory of children's data (per-domain, table-level)

Source: live schema snapshot + PRD-40's deletion-cascade registry. The build will maintain a
canonical machine-readable registry (`child_data_tables`) that the deletion cascade iterates;
this table is the human-readable version. "Child" below means any family member the parent
marks under 13 (`coppa_age_bracket = 'under_13'` — a column that ships with the PRD-40 build).

| # | Domain | Representative tables | Children's personal information held |
|---|--------|----------------------|--------------------------------------|
| 1 | Identity & profile | `family_members` | First name/display name, nicknames, date of birth and/or age, relationship to family, avatar image URL, assigned color, preferences (JSON), gamification points/streaks |
| 2 | Sign-in artifacts | `family_members` (+ Supabase `auth.users` shadow rows) | Hashed PIN (bcrypt; plaintext never stored), picture-password configuration (the child's chosen secret picture ID plus a fixed decoy set, held server-side; login secret is a server-derived HMAC, never the picture), failed-attempt counters and lockout timestamps, hidden per-member "shadow" login accounts of the form `{id}@family.myaimcentral.app` that make PIN/picture sign-in work (two-door auth model, platform Convention #273 — **see §7 flag: the PRD-40 addendum documenting these artifacts is not yet written**) |
| 3 | Tasks & routines | `tasks`, `task_completions`, `routine_step_completions`, `task_assignments`, `task_claims`, `practice_log`, `sequential_collections`, `task_segments` | Assigned tasks/chores, completion timestamps and notes, optional completion photos, practice/mastery records |
| 4 | Journals & growth | `journal_entries`, `self_knowledge`, `guiding_stars`, `best_intentions`, `intention_iterations`, `reflection_responses`, `victories`, `victory_celebrations` | Freeform journal text, mood tags, **audio voice recordings** (journal audio; see §5.3), self-knowledge entries, goals/intentions, reflection answers, achievement records |
| 5 | AI conversations | `lila_conversations`, `lila_messages`, `bookshelf_discussions`, `ai_usage_tracking` | Full transcripts of the child's conversations with the AI assistant; token/cost metering rows keyed to the member |
| 6 | Archives & context (parent-authored, about the child) | `archive_context_items`, `archive_folders`, `archive_member_settings`, `private_notes`, `relationship_notes` | Mom's structured notes about the child, including system categories **"Health & Medical"** and "School & Learning"; a `physical_description` field and `reference_photos` on member settings; relationship notes naming the child |
| 7 | Faith preferences | `faith_preferences` | Family-level religious tradition/denomination and handling preferences (family-scoped, not child-scoped, but informs AI responses to the child — **sensitive-category data under many state laws**) |
| 8 | Messaging | `conversation_spaces/threads`, `messages`, `family_requests`, `notifications` | Intra-family messages the child sends/receives, requests to parents, notification history |
| 9 | Financial | `financial_transactions`, `allowance_configs`, `allowance_periods`, `loans`, `earned_prizes`, `reward_proposals`, `contracts`, `deed_firings` | Allowance balances and ledger, per-child earnings, family "loans," reward records. (Platform Convention #225: financial data is categorically excluded from all AI context assembly.) |
| 10 | Gamification | `member_creature_collection`, `member_sticker_book_state`, `member_page_unlocks`, `member_coloring_reveals`, `gamification_configs` | Earned virtual creatures/stickers/pages, point configs |
| 11 | Education | `homeschool_time_logs`, `homeschool_subjects`, `homeschool_configs`, `guided_form_responses` | Homeschool time logs per subject, structured worksheet responses (e.g., decision-making exercises the child fills out) |
| 12 | Trackers & widgets | `dashboard_widgets`, `widget_data_points` | Tracker configurations and data points recorded for/by the child (can include mood check-ins and health-adjacent counts) |
| 13 | Calendar & time | `calendar_events`, `event_attendees`, `time_sessions` | Events the child attends, timer sessions |
| 14 | Stored media (Supabase Storage) | (storage buckets) | Avatar images, task-completion photos, journal audio recordings, screenshots attached to bug reports |
| 15 | Diagnostics | `beta_glitch_reports`, `activity_log_entries`, `view_as_sessions` | Bug reports may include screenshots (which can capture child content on screen), browser info, recent routes, console errors; activity log of in-app events; audit log of parent "View As" sessions |
| 16 | Derived vectors | `embedding` columns on many tables above | Numerical embedding vectors (1,536-dimension) computed from text items for search/relevance; stored only in the platform's own database (see §5.2) |
| 17 | COPPA records (ships with PRD-40 build) | `parent_verifications`, `coppa_consents`, `coppa_consent_templates`, `parent_verification_attempts`, `parental_data_exports`, `retention_deletion_log` | Parent's verification event (method, Stripe payment-intent ID, **IP address, user agent**), per-child consent records with versioned disclosure text, attempt/rate-limit log, export and deletion audit logs |

3.1. **What is NOT collected from children:** no email addresses of under-13 children (PIN or
picture sign-in only; the `member_emails` table exists for invited adults/teens and has zero
rows today), no precise geolocation, no biometric identifiers (the picture password is an
image choice, not face/voice/fingerprint processing; photos are stored but no biometric
templates are ever computed), no government identifiers, no third-party advertising or
analytics identifiers (no such SDKs exist in the codebase). Persistent identifiers are limited
to first-party auth tokens/session cookies (Supabase) and browser localStorage used for UI
state — support for internal operations.

3.2. **Freeform text from children is collected** (journals, AI chat, brain-dump features) in
features the parent enables per child. The PRD states the design intent that "LiLa never asks
children for personal information directly"; **counsel should know this is design intent
enforced by system prompts today, with deterministic runtime output-validation (PRD-41)
specified as a binding prerequisite for under-13 beta access but not yet built.**

---

## 4. Processors / recipients (the complete third-party map)

| Recipient | Role | What reaches them | Status |
|---|---|---|---|
| **Supabase** (hosted PostgreSQL, auth, storage, edge functions) | Infrastructure processor | All platform data at rest; all server-side processing | Live. [UNKNOWN — FOR COUNSEL: confirm hosting region (believed US) and review Supabase DPA] |
| **Vercel** | Frontend hosting/CDN | Serves the app; standard server/request logs | Live. [UNKNOWN: log retention terms — review Vercel DPA] |
| **OpenRouter** → **Anthropic** | AI model routing → AI model provider (Claude Sonnet/Haiku) | Conversation messages plus assembled family context for each AI call (names, ages, roles of family members; relevant notes/goals the parent has toggled into AI context; the user's messages) | Live. **Contract posture unverified — see Q3 in §9** |
| **OpenAI** | Embeddings (`text-embedding-3-small`) and voice transcription (Whisper) | Text of items being embedded; audio recordings being transcribed | Live. **Contract posture unverified — see Q3** |
| **Stripe** | Payments; the $1 COPPA verification charge | Card data via Stripe Elements (never touches platform servers); metadata: purpose, family ID, parent member ID | **Not built yet** — lands with PRD-40 build |
| Transactional email provider | Consent receipts, revocation notices, deletion reminders | Parent email address, child first name, consent metadata | **Not selected/wired yet.** Only Supabase's built-in auth emails exist today. [FOUNDER INPUT NEEDED before PRD-40 build] |

4.1. **No other recipients.** No data brokers, no advertisers, no analytics vendors, no social
plugins. Disclosure outside this table would occur only under legal process or in a business
transfer (to be addressed in the privacy policy).

4.2. **Platform Intelligence Pipeline (internal, flagged):** the platform has an internal
anonymized-patterns pipeline (12 capture channels; admin approval required before anything
becomes platform intelligence) intended to improve the product. **PRD-40 makes it a binding
requirement that under-13 data is excluded from ALL cross-family aggregation, benchmarks, and
intelligence ingestion — parental consent is scoped to the family's own features and its
service providers, not to platform-wide analytics.** Enforcement of that exclusion is not yet
possible in code (the `coppa_age_bracket` column does not exist until the PRD-40 build) —
an honest interim-state item for counsel (Q9 in §9).

---

## 5. AI data-flow specifics

5.1. **What leaves the platform per AI call:** system prompt (includes a safety preamble:
crisis-resource override, five auto-reject categories, tone rules) + assembled family context
+ the conversation messages. Context assembly is governed by a three-tier parent-controlled
toggle (`is_included_in_ai` at person / category / item level — all three must be on), a
role-asymmetric privacy filter (items the parent marks "Privacy Filtered" are stripped from
every non-parent context, including the child's own conversations — implemented 2026-04-17,
migration 100149), and layered relevance loading (only items relevant to the conversation are
sent, not the whole database).

5.2. **Embeddings** are computed by OpenAI, then stored exclusively in the platform's own
database as numeric vectors. They are never shared onward and are deleted with their parent
rows.

5.3. **Audio:** voice input and journal audio are recorded in-browser, sent to OpenAI Whisper
for transcription, and the audio files are stored in platform storage. The amended COPPA Rule
adds audio to the definition of personal information; the platform **retains** child audio
(journal recordings), so the FTC's deletion-exception policy for ephemeral audio does not
apply. A daily voice-recording cleanup job exists in the architecture; its exact retention
window is [UNKNOWN — verify at build time; align with the retention policy in §6].

5.4. **No-training posture:** PRD-40's disclosure copy asserts that AI providers process data
"under service agreements with no-training clauses." As of this drafting, **that assertion has
not been verified against the operative Anthropic, OpenAI, and OpenRouter terms and settings**
(OpenRouter in particular has per-provider routing/logging settings that must be configured).
This is deliberately listed as an open item (Q3) rather than asserted — the consent copy must
not say it until it is contractually true.

---

## 6. Retention & deletion — current state vs. specified policy

6.1. **Current state (honest):** there is **no retention enforcement in production today**.
The existing account-deletion path only deactivates records (`is_active = false`) — it does
not purge child data. This is a known, registered gap (tracked as SCOPE-8a.F2) that the PRD-40
build closes before cohort 2.

6.2. **Specified retention policy (PRD-40, to be enforced by three daily jobs):**

| Data | Retention | Rationale |
|---|---|---|
| AI conversation transcripts (`lila_messages` / `lila_conversations`) | 90 days rolling, auto-delete | Ephemeral interaction artifacts; window for parental review |
| Task-completion photos | 180 days rolling, auto-delete | Photos carry higher risk than text |
| Structured records (tasks, victories, trackers, archive notes, avatar) | Life of the active consent | The features' long-term purpose; deleted on revocation |
| COPPA audit records (verifications, consents, attempts, deletion logs) | Permanent | Legal evidence of consent/revocation |
| Parental export archives | Download link expires 7 days; export record 90 days after download | Minimize copies in flight |

All automated deletions are logged to `retention_deletion_log` (per-table row counts, job run
IDs) for auditability. The amended COPPA Rule's **written retention policy** requirement
(16 C.F.R. § 312.10 as amended) will be satisfied by publishing this schedule in the privacy
policy — counsel to confirm format and placement.

6.3. **Revocation-triggered deletion:** parent revokes per child → 14-day grace period with
undo → daily job runs a full cascade across every registered child-data table → per-table
results written to the consent row (`deletion_completion_notes`) → consent record itself
preserved permanently as audit evidence.

6.4. **Cascade edge rules (the legally interesting ones):**
- "Data **about** the child" (mom's archive notes on the child, AI conversations where the
  child was the subject, relationship notes) → **hard delete**.
- Child's entries inside shared/aggregate records → **scrubbed**, record retained for siblings.
- **A sibling's own journal entry that happens to mention the departing child → preserved**
  (it is the sibling's own expression; mom can manually edit). This sibling-preservation rule
  is load-bearing in the build — counsel to confirm defensibility (Q7).

---

## 7. The two-door sign-in model (Convention #273) — and a known documentation gap

7.1. Since June 2026, each family has two "doors": mom's email/password, and a family-level
login (family name + family password) that unlocks a member-choice screen where a child taps
their name and enters a PIN or taps their secret picture. To make child sign-ins produce real
sessions, the platform provisions **hidden shadow login accounts** per family and per member
(synthetic addresses like `{id}@family.myaimcentral.app`; secrets are server-derived HMACs).
Changing the family password rotates the shadow account and signs out every family device (the
parent "kill switch").

7.2. **Gap flagged for counsel:** PRD-40 (2026-04-16) predates this architecture. A formal
addendum ("PRD-40 Two-Door Auth Addendum") extending the disclosure enumeration and the
deletion-cascade registry (shadow-account teardown, `pin_hash`, `visual_password_config`,
picture-secret rows) is planned but **does not exist yet**. The consent-flow draft in this
package already names these artifacts in plain language (drafted against the approved ruling
describing them); counsel should treat that copy as ahead of the internal spec paper trail,
and we will conform the addendum to whatever counsel approves.

---

## 8. Parental access vs. the shipped kid-privacy carve-outs (the founder's mandatory question)

8.1. **What shipped:** the platform deliberately gives children small zones of daily-UX
privacy that the parent does not see while casually browsing via "View As" (the feature that
lets mom see the app as a child sees it): journal entries the child marks private,
self-knowledge entries with `share_with_mom = false`, and saved AI-conversation journal
entries. This filtering is keyed on how the session originated, not on age. It is a shipped,
deliberate trust-building design (Convention #39, `filterKidPrivate()`), and a separate
founder principle ("no hiding from parents," 2026-07-04) freezes the pattern — no NEW
kid-privacy affordances will be added.

8.2. **The reconciliation ruling under review (D-PRD40-3, founder-approved 2026-07-04 pending
counsel's advice):** COPPA gives the parent the right to review the child's collected personal
information. The proposed posture: the daily-UX filter stands, and the parental review right
is satisfied **in full** on the formal rights surfaces — the Settings → Privacy & Consent
review screen and the per-child data export, both of which include **everything**, expressly
including the kid-private items, for under-13 children.

8.3. **THE QUESTION (decided once, on counsel's advice; never widened retroactively):**
> Does the D-PRD40-3 posture — daily-UX privacy plus full parental access through the formal
> COPPA review/export surfaces — satisfy COPPA's parental-rights requirements (and any
> analogous state-law parental access rights) for under-13 children? The shipped carve-outs
> (private Journal / `share_with_mom = false` / saved AI-conversation entries filtered from
> View-As) stand today; the no-hiding principle freezes the pattern going forward; counsel's
> answer decides the carve-outs once and for all.

---

## 9. QUESTIONS FOR COUNSEL

1. **(Mandatory — §8.3 above.)** The legacy kid-privacy carve-outs question, verbatim as
   framed there.
2. **Service classification.** Is MyAIM Central best treated as (a) a general-audience service
   with actual knowledge of specific under-13 users (parent declares each child's age
   bracket), (b) a mixed-audience service under the amended Rule's codified definition, or
   (c) partially child-directed (the Play/Guided shells)? The classification drives which
   notice/consent mechanics attach where.
3. **AI providers under the amended Rule.** Are Anthropic/OpenAI (via OpenRouter) properly
   treated as service providers supporting internal operations, or do the AI calls constitute
   third-party "disclosures" triggering the amended Rule's **separate** verifiable consent for
   non-integral disclosures (16 C.F.R. § 312.5(a)(2) as amended)? Related: what contractual
   assurances must we obtain and document (the amended § 312.8 requires written assurances
   from recipients), and is the "no-training clauses" statement in the consent copy
   permissible once the operative terms are confirmed? *(We have flagged that the terms are
   currently unverified — §5.4.)*
4. **Verification method.** Does the planned flow — a non-refundable $1.00 Stripe charge, card
   entered via Stripe Elements after five acknowledged disclosure sections, receipt email, and
   `MYAIM VERIFY` statement descriptor — satisfy the credit/debit "monetary transaction with
   notification to the primary account holder" consent method under § 312.5(b) as amended?
   Should we plan a fallback method (knowledge-based authentication or the new text-based
   options) for parents without cards, and is "non-refundable" framing acceptable under
   UDAP/MMPA principles?
5. **Retention policy adequacy.** Do the schedule in §6.2 and the "life of active consent"
   formulation satisfy amended § 312.10's written-retention-policy requirement (specific
   purposes, business need, deletion timeframe; no indefinite retention)?
6. **Written information security program.** What documentation does a solo-founder LLC need
   to satisfy amended § 312.8 (program, coordinator designation, risk assessments, vendor
   assurances, annual review), and can counsel supply or review a template?
7. **Deletion cascade rules.** Is the sibling-preservation rule (§6.4) defensible against a
   parent's deletion request under COPPA and state analogues?
8. **Grace period.** Is the 14-day undo window before deletion consistent with the duty to
   delete upon revocation "as soon as reasonably practicable"?
9. **Aggregation exclusion interim state.** Under-13 exclusion from the internal intelligence
   pipeline is a binding build requirement, but the enforcing column doesn't exist until the
   PRD-40 build. Given cohort 1 contains no under-13 families, is any interim measure needed?
10. **Direct-notice delivery mechanics.** The consent flow displays the disclosures in-app and
    emails a full receipt after verification. Must the § 312.4(c) direct notice also be
    *sent* to the parent before/at consent (e.g., emailed when the flow starts)?
11. **PRD-41 interim exposure.** Runtime output-validation for child AI conversations is a
    named prerequisite for under-13 access but is not yet built; prompt-level safeguards are
    deployed. Any interim documentation or gating counsel wants beyond the cohort scoping?
12. **Two-door addendum gap** (§7.2): confirm you are comfortable reviewing consent copy that
    is ahead of the internal spec addendum; we will conform the addendum to your approved text.
13. **Founder-family backfill** (§2.4): how should we document consent for data already
    collected from the founder's own children before the infrastructure existed?
14. **Diagnostics data** (§3, row 15): bug-report screenshots may incidentally capture child
    content. Does this need separate treatment in the disclosures?

---

## Margin sources for counsel

- Amended COPPA Rule, final rule text and preamble: [Federal Register, 90 FR — Children's Online Privacy Protection Rule (Apr. 22, 2025)](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule); effective June 23, 2025; compliance required by April 22, 2026 ([Davis Polk client update](https://www.davispolk.com/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect); [Hunton deadline note](https://www.hunton.com/privacy-and-cybersecurity-law-blog/coppa-rule-amendment-compliance-deadline-approaches)).
- Current rule text: [16 C.F.R. Part 312 (eCFR)](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.4).
- Consent methods incl. monetary-transaction: [FTC, Complying with COPPA: Frequently Asked Questions](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions).
- Retention-policy analysis: [Fenwick — What the Amended COPPA Rule Means for Data Retention Practices](https://www.fenwick.com/insights/publications/what-the-amended-coppa-rule-means-for-data-retention-practices).
- Internal sources: `prds/foundation/PRD-40-COPPA-Compliance-Parental-Verification.md`;
  `claude/dispatch-factory/PRD40.md` + `PRD40-RECON.md`; `claude/live_schema.md` (2026-07-05
  snapshot); `CLAUDE.md` Conventions #6, #225, #243, #273.
