# PRD-34 Persona Architecture Addendum (Wave 1B)

**Parent PRD:** PRD-34 (ThoughtSift — Decision & Thinking Tools)
**Created:** 2026-04-23
**Session Type:** Wave 1B prerequisite (Artifact A of the paired A+B deliverable)
**Paired With:** PRD-32 Personas tab section + CLAUDE.md Convention #258 (Artifact B)
**Triage Origin:** SCOPE-4.F4 (Row 11) + SCOPE-4.F7 fold + SCOPE-8a.F5 fold
**Status:** Pre-sprint prerequisite — must land before Wave 1B consolidated Board sprint dispatches

---

## Context & Scope

### Why this addendum exists

The parent PRD-34 Decision #14 specified on-demand persona generation with three-tier caching in shorthand, and the cache implementation that shipped had a cross-family leak defect: personal custom personas created by one family could be served as cache candidates to other families asking for personas by the same name. This is a privacy defect, not a performance defect, and it is Beta-blocking.

Triage worksheet Row 11 (SCOPE-4.F4) reclassified this finding from Intentional-Update-Doc to Fix Code on 2026-04-21 with founder green-lit scope covering seven work items (a)–(g). This addendum is the design-level specification those work items implement against. Its existence is also a prerequisite for the Wave 1B consolidated Board sprint, which folds SCOPE-4.F4 + SCOPE-8a.F5 + SCOPE-8b.F3 + SCOPE-4.F8a + SCOPE-4.F8b + SCOPE-4.F7 into a single build cycle touching `lila-board-of-directors/index.ts`, related Board UI, and PRD-34.

Blocker relationship per `claude/web-sync/FIX_NOW_SEQUENCE.md` v11: Artifact A + Artifact B are Wave 1B prerequisites; neither SCOPE-4.F4 nor its folded rows (F7, F8a, F8b, 8b.F3, 8a.F5) can dispatch until both artifacts land and the governance convention is published.

### What this addendum amends vs. adds

**Amends:**
- Parent PRD-34 Decision #14 ("on-demand persona generation with three-tier caching") — rewritten from shorthand to full specification
- Parent PRD-34 `board_personas` RLS policy section — tightened with explicit three-tier predicates
- Parent PRD-34 Screen 3 Content Safety Gate — extended with embedding pre-screen (new step) and multi-family-relevance classifier (new step)
- Parent PRD-34 LiLa moderator interjection behavior (lines ~116–118) — aligned with SCOPE-4.F7 opt-in-only default

**Adds (net-new sections):**
- Personal persona write path specification with family-scoped RLS
- Cache lookup rewrite with explicit query predicate
- Embedding pre-screen design (threshold, tiered UX, integration point)
- Content-policy classifier design (model, signals, fail-closed rule)
- `persona_promotion_queue` schema and row lifecycle
- Seeded-persona audit scope and regression fixture design
- Governance convention hook (references Artifact B's Convention #258)

### Locked decisions carried forward (not re-opened)

- LiLa scope = Definition C + gleaning attribute per Convention 247
- Deity-block + Prayer Seat pattern per Conventions 100–102 applies upstream of this addendum's classifier — deities never reach the classifier
- Board of Directors uses sequential per-advisor Sonnet calls, 3 default / 5 max (parent PRD Decisions #3, #4)
- `board_personas` split schema: `platform_intelligence` for system/community approved; `public` for personal_custom
- Personal customs NEVER enter Platform Intelligence Pipeline (Channel D exclusion, existing)
- Ethics enforcement = two-layer defense-in-depth: PRD-41 (Layer 1) + per-mode prompts (Layer 2). NEW-D tracks Layer 2 audit across 43 guided modes
- Five auto-reject categories: force, coercion, manipulation, shame-based control, withholding affection
- First beta cohort = no under-13s; COPPA ships dormant in Wave 4

---

## §1. Three-Tier Cache Architecture

**Amends parent PRD-34 Decision #14 and `board_personas` RLS policy section.**

Board of Directors personas live in three architecturally distinct tiers. Every persona belongs to exactly one tier. Cache-lookup paths scope by tier. Promotion between tiers happens only through the admin approval workflow defined in §7.

### Tier 1 — Personal Scoped

**Schema:** `public.board_personas`
**Defining predicates:** `persona_type='personal_custom'` AND `is_public=false` AND `family_id IS NOT NULL`
**Visibility:** Readable only by members of the creating family (RLS-scoped).
**Cache eligibility:** NEVER. Personal personas are never considered as cache candidates for any other family, even on exact name match.
**Platform Intelligence Pipeline:** EXCLUDED. Convention #97 reinforced — personal_custom personas never enter the pipeline under any circumstances.

Personal scoped is the default write path for any persona generated from a free-form user description. A persona reaches Tier 2 or Tier 3 only if the content-policy classifier in §6 explicitly routes it there.

### Tier 2 — Promotion Queue

**Schema:** `platform_intelligence.persona_promotion_queue` (new table, §7)
**Defining predicates:** N/A — queue rows are not `board_personas` rows; they are review candidates.
**Visibility:** Admin only (gated by `persona_admin` or `super_admin` staff_permission).
**Cache eligibility:** NEVER. Queue rows are not candidates for any family's persona selector.
**Lifecycle:** Created by the classifier when `multi_family_relevance = yes`. Terminated by admin action (Approve / Refine-and-Approve / Reject / Defer). Approval promotes to Tier 3.

The queue exists because some user-generated personas are genuinely about public figures with verifiable sources — Brené Brown, Viktor Frankl, a historical leader — and serving the admin-approved version to every family is both better quality and avoids each family paying Sonnet generation cost for the same figure. But which generations deserve promotion is a judgment call, not an automatic one. The queue holds candidates pending that judgment.

### Tier 3 — Approved Shared Cache

**Schema:** `platform_intelligence.board_personas`
**Defining predicates:** `is_public=true` AND `family_id IS NULL` AND `content_policy_status='approved'`
**Visibility:** Readable by all authenticated users.
**Cache eligibility:** YES. Cache-lookup paths (§4) scope to this tier.
**Write path:** ONLY the admin Approve or Refine-and-Approve action in PRD-32's Personas tab can write to this tier. Direct INSERT is disallowed by RLS for all non-admin users.

Tier 3 is the shared library. It accumulates personas that have passed Tenise's review — either unchanged or refined before approval. Every family benefits from every approved persona.

### Three-tier invariant

**No row in the system simultaneously satisfies the predicates of two tiers.** Specifically:
- A `public.board_personas` row with `is_public=true` is a schema violation (caught by the regression fixture in §9).
- A `platform_intelligence.board_personas` row with `family_id IS NOT NULL` is a schema violation.
- A `persona_promotion_queue` row that has been approved must have its `decided_at` set and its `approved_persona_id` point at the newly-written Tier 3 row — the queue row itself remains as the audit trail, it does not get deleted.

---

## §2. Personal Persona Write Path

**Net-new specification.**

When Board of Directors persona creation completes (Screen 3 "Create a Custom Persona" flow) and the content-policy classifier in §6 routes the persona to personal-only, the system writes a single row to `public.board_personas`:

**Write contract:**
```sql
INSERT INTO public.board_personas (
  persona_name,
  persona_type,          -- 'personal_custom'
  personality_profile,
  source_references,
  bookshelf_enriched,
  category,
  icon_emoji,
  content_policy_status, -- 'approved' (passed harm screen + classifier routed to personal)
  is_public,             -- false
  created_by,            -- current user's family_members.id
  family_id,             -- current user's families.id
  usage_count,           -- 0
  embedding              -- computed at write time
)
```

**RLS policy on `public.board_personas`:**
- SELECT: `family_id = (SELECT family_id FROM family_members WHERE id = auth.uid_family_member_id())` — members of the owning family can read. Primary parents can read all personas in their family.
- INSERT: writer's `created_by` must resolve to a `family_member` whose `family_id` matches the INSERT's `family_id`. Prevents cross-family writes.
- UPDATE: only `created_by` user or primary parent of the owning family. `is_public` and `family_id` are immutable (RLS rejects updates that change them).
- DELETE: only `created_by` user or primary parent of the owning family.

**What this closes:** the original SCOPE-4.F4 defect. A personal persona written with `family_id=A` cannot be read by a family member whose session resolves to `family_id=B`, regardless of name match.

**Cross-reference:** personal personas are excluded from Platform Intelligence Pipeline ingestion per Convention #97. The Pipeline's Channel D (Personas) reads only from `platform_intelligence.board_personas`, not from `public.board_personas`, which enforces the exclusion at the schema level.

---

## §3. Cache Lookup Rewrite

**Net-new specification. Replaces the cache-lookup predicate in `lila-board-of-directors/index.ts`.**

Before this fix, the cache-lookup path queried `board_personas` filtered only by name (case-insensitive `ilike`) and `content_policy_status='approved'`. That predicate matched personal_custom rows written by any family, producing the leak.

**New cache-lookup predicate (canonical):**

```sql
SELECT * FROM platform_intelligence.board_personas
WHERE LOWER(persona_name) = LOWER($requested_name)
  AND is_public = true
  AND family_id IS NULL
  AND content_policy_status = 'approved'
LIMIT 1;
```

**Why all four filters are load-bearing:**
- `is_public = true` — defense against `persona_type` drift; even if a row were mistakenly labeled `system_preloaded` but had `is_public=false`, it still wouldn't be served.
- `family_id IS NULL` — defense against a row that claims `is_public=true` but retains a family reference.
- `content_policy_status = 'approved'` — preserves the existing content-safety guarantee.
- Schema namespace (`platform_intelligence` not `public`) — personal personas physically cannot appear in the query result set because they live in a different schema.

**Applies to all three cache-lookup entry points:**
1. Direct name match on custom persona creation (the "is there already one?" check).
2. "Suggested for this situation" persona surfacing in Screen 1.
3. Embedding pre-screen near-miss lookups (§5) — the pre-screen query scopes by the same predicates.

**Regression test fixture (§9) asserts this predicate.**

---

## §4. Embedding Pre-Screen

**Net-new step. Precedes the Screen 3 harm screen in the content safety gate.**

### Placement in the gate sequence

Screen 3 Content Safety Gate sequence, after this addendum:

1. **Embedding pre-screen** (new — this section)
2. Haiku harm screen (existing — deity→Prayer Seat, blocked figure→hard block, harmful description→revise prompt)
3. **Multi-family-relevance classifier** (new — §6)
4. Sonnet persona generation (existing)
5. Write to appropriate tier (§2 for personal, §7 for queue)

### Purpose

Before spending Sonnet tokens generating a persona, check whether an approved shared persona already covers the request. If so, offer it instead of generating. Saves cost, improves quality (user gets the admin-reviewed version), and reduces queue volume.

### Threshold and UX tiers

**Threshold: 0.88 cosine similarity** against `board_personas.embedding` where `is_public=true AND content_policy_status='approved'`.

Rationale for 0.88: aligns with Platform Intelligence Pipeline v2's 0.85 anonymized-pattern dedup and 0.9 book-identity match. Personas carry character identity, so the threshold leans toward "same person" rather than near-miss suggestions. The Gandhi vs. Gandalf problem — two very different characters with high surface similarity — requires a threshold high enough that character confusion doesn't happen.

**Tiered UX:**

| Similarity | Action | User sees |
|---|---|---|
| ≥ 0.92 | Silent seat | Subtle toast: "Seated your existing [name]." Creation modal closes. Persona enters the current board session. |
| 0.88 – 0.92 | Suggest | Inline card: "We already have [existing_name] in your library — seat them, or generate a fresh version?" Two buttons. |
| < 0.88 | Proceed to harm screen | No UI; user sees the existing generation flow. |

**Why tiered rather than binary:** above 0.92 the match is strong enough that surfacing a choice adds friction without adding value — the user typed "Brené Brown," we have Brené Brown, just seat her. Between 0.88 and 0.92 the match is plausible but not certain, and letting the user choose avoids the "we gave her a different Brené Brown than she meant" failure mode.

### Contract point for PRD-05

The pre-screen runs inside the conversation engine path (shared context-assembler substrate). PRD-05's conversation engine spec gains a new pre-generation step: `preScreenApprovedPersonaMatch(requestedName, requestedEmbedding)` returning `{ match: 'silent' | 'suggest' | 'none', personaId?, similarity? }`. Cross-PRD impact §11 documents this.

### Index requirement

`platform_intelligence.board_personas.embedding` is `halfvec(1536)` with HNSW index per existing schema. No new index needed. The pre-screen query filters to `is_public=true AND content_policy_status='approved'` first, then runs ANN search within that subset.

---

## §5. Content-Policy Classifier (Multi-Family Relevance)

**Net-new step. Amends parent PRD-34 Screen 3 Content Safety Gate.**

### Placement and purpose

Runs after the harm screen passes, before Sonnet generation. Decides whether the generated persona writes to Tier 1 (personal) or Tier 2 (promotion queue). The harm screen already rejected deities (→ Prayer Seat), blocked figures (→ hard block), and harmful descriptions (→ prompt user to revise). The classifier's only job is personal-vs-community relevance for personas the harm screen approved.

### Model

**Haiku.** Consistent with other content-policy Haiku calls in PRD-34 (harm screen) and with the Platform Intelligence Pipeline's ethics gate pattern. One classifier call per persona creation. Not batched — the user is waiting.

### Signal set

The classifier receives and reasons over:

1. **Public-figure-with-verifiable-sources check.** Is the described person (a) a real public figure with published works, speeches, or documented record, or (b) a fictional character from published work, or (c) neither? (c) is a strong signal for personal-only.

2. **Personal-only attribute detection.** Does the user's description contain possessives about personal relationships ("my grandmother," "my pastor's advice to me"), private anecdotes ("she always told me that when I was little"), or references to a relationship only the user has ("my college mentor")? Presence of any of these is a strong signal for personal-only.

3. **Entity resolution via near-miss embedding.** If the pre-screen (§4) returned a 0.80–0.88 near-miss (below the suggest threshold but above an entity-recognition floor), that's signal that the requested name resolves to an existing entity — which aligns with community-relevance.

4. **Explicit user chip selection.** The Screen 3 "Who is this person to you?" picker's existing chip set includes values like "A historical/public figure," "A fictional character I'm writing," "Someone personal to me (family, friend, mentor)," etc. Anything other than "historical/public" or "fictional character" is a strong signal for personal-only. This is the highest-weight signal because the user has explicitly declared intent.

### Fail-closed rule

**On classifier error, timeout, or low-confidence output: route to personal-only.** Never auto-promote. This aligns with SCOPE-8a.F5's fail-closed pattern for content policy. If the system can't confidently decide "this is shareable," the safe default is "treat as personal."

### Output contract

Classifier returns structured JSON:
```json
{
  "multi_family_relevance": "yes | no",
  "confidence": 0.0,
  "signals": {
    "public_figure_verifiable": true,
    "personal_attributes_detected": false,
    "entity_resolved": true,
    "user_chip_selection": "A historical/public figure"
  },
  "reasoning": "one-line human-readable rationale for the admin"
}
```

- `multi_family_relevance = 'yes'` → write personal row to Tier 1 AND insert row into Tier 2 queue with this classifier output attached.
- `multi_family_relevance = 'no'` → write personal row to Tier 1 only.
- Error / timeout → write personal row to Tier 1 only (fail-closed).

---

## §6. Persona Promotion Queue

**Net-new. Primary contract point for Artifact B (PRD-32 Personas tab).**

### Table: `platform_intelligence.persona_promotion_queue`

| Column | Type | Default | Nullable | Notes |
|---|---|---|---|---|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| requested_persona_name | TEXT | | NOT NULL | Name the user typed |
| submitted_by_family_id | UUID | | NOT NULL | FK → families |
| submitted_by_member_id | UUID | | NOT NULL | FK → family_members |
| promoted_from_personal_id | UUID | | NOT NULL | FK → public.board_personas. The Tier 1 row created for the submitting family. |
| proposed_personality_profile | JSONB | | NOT NULL | Sonnet-generated profile, pending admin review |
| source_references | TEXT[] | '{}' | NOT NULL | Sonnet-generated source references |
| category | TEXT | | NULL | 'historical', 'literary', 'faith_leader', etc. |
| icon_emoji | TEXT | | NULL | |
| classifier_confidence | NUMERIC(3,2) | | NOT NULL | 0.00–1.00 from §5 classifier |
| classifier_signals | JSONB | | NOT NULL | Full signal breakdown from §5 output |
| classifier_reasoning | TEXT | | NOT NULL | One-line human-readable rationale |
| content_policy_pre_screen_status | TEXT | 'passed' | NOT NULL | Always 'passed' if the row exists (failed harm screen never reaches classifier) |
| embedding | halfvec(1536) | | NULL | Computed at write time for admin-side dedup / similarity hints |
| status | TEXT | 'pending' | NOT NULL | CHECK: 'pending', 'approved', 'refined_and_approved', 'rejected', 'deferred' |
| reviewer_id | UUID | | NULL | FK → auth.users. Set on decision. |
| decided_at | TIMESTAMPTZ | | NULL | Set on decision. |
| admin_notes | TEXT | | NULL | Reviewer's notes |
| approved_persona_id | UUID | | NULL | FK → platform_intelligence.board_personas. Set on Approve or Refine-and-Approve. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS policy:** admin-only. `SELECT/INSERT/UPDATE/DELETE` gated by `staff_permissions.permission_type IN ('persona_admin', 'super_admin')`. The INSERT path is the classifier's Edge Function write, which uses service-role key.

**Indexes:**
- `(status, created_at DESC)` — default admin list view (pending, newest first)
- `embedding` HNSW — admin-side similarity suggestions ("other pending rows look similar to this one")
- `requested_persona_name` (text search) — admin search

### Row lifecycle

1. **Creation.** Classifier returns `multi_family_relevance='yes'` → Edge Function writes Tier 1 row to `public.board_personas` AND queue row to `platform_intelligence.persona_promotion_queue` with `status='pending'`, `promoted_from_personal_id` pointing at the Tier 1 row.

2. **Admin review (PRD-32 Personas tab).** Tenise opens the queue. For each row she chooses one of four actions:

   **Approve** → writes a NEW row to `platform_intelligence.board_personas` with:
   - `persona_name` = queue row's `requested_persona_name`
   - `persona_type` = `'community_generated'`
   - `personality_profile`, `source_references`, `category`, `icon_emoji` = queue row's proposed values unchanged
   - `content_policy_status` = `'approved'`
   - `is_public` = true
   - `family_id` = NULL
   - `created_by` = NULL (platform ownership)
   - `embedding` = recomputed from approved values

   Queue row updates: `status='approved'`, `reviewer_id`, `decided_at`, `approved_persona_id`.

   **Refine** → opens inline editor on `proposed_personality_profile` and `source_references`. On save, the approval flow runs with the refined values. Queue row status becomes `'refined_and_approved'`, `admin_notes` captures the refinement rationale if provided.

   **Reject** → queue row `status='rejected'`, `reviewer_id`, `decided_at`, `admin_notes`. No `board_personas` row is written. The Tier 1 personal row remains with the originating family — the reject is a decision not to promote, not to strip the persona from the family that created it.

   **Defer** → queue row `status='deferred'`, drops from default view (which shows `status='pending'`). Reviewer can reopen anytime. No timeout or auto-expiry.

3. **Cache effect on approval.** Once an approved `board_personas` row exists in Tier 3, future cache-lookups (§3) and embedding pre-screens (§4) will match it. Future users asking for the same persona get the approved version — the family that originally submitted it still has their personal Tier 1 row (which is identical in content but scoped to them), so their experience doesn't change.

### Stale-entry handling

Soft TTL in UI only. Default queue list filter hides `status='pending'` rows older than 30 days with a "show stale" toggle. No cron job, no schema change. At beta scale (Tenise as sole reviewer, expected low volume) this is sufficient. Upgrade to cron sweep is a Gate-4 consideration.

### Contract points for Artifact B (PRD-32)

Artifact B's Personas tab section consumes this queue via:
- **List query:** `SELECT * FROM persona_promotion_queue WHERE status='pending' ORDER BY created_at DESC` (with optional stale filter).
- **Detail view:** joins `promoted_from_personal_id` to show the family's personal version for reviewer context.
- **Approve / Refine / Reject / Defer actions:** exactly as specified above. The Edge Function that performs the state transitions lives in the Board of Directors / ThoughtSift code area; PRD-32 calls it.

---

## §7. Alignment with SCOPE-4.F7 (Moderator Interjection Opt-In)

**Amends parent PRD-34 LiLa moderator interjection behavior (lines ~116–118).**

The Wave 1B sprint folds in SCOPE-4.F7, which changes the default for LiLa moderator interjections during Board of Directors conversations from "on" to "opt-in only."

### Current behavior (pre-fix)

LiLa occasionally interjects during Board sessions to summarize divergent advisor views, surface a blind spot, or nudge the user toward synthesis. This behavior is always-on with no user control.

### New behavior (post-fix)

**Default: OFF.** LiLa does not interject by default.

**Opt-in location:** Board of Directors conversation settings panel. Toggle labeled something like "Let LiLa interject to help synthesize" with a brief explainer. Default state is off. User flips it on per-session or as a persistent preference.

**Persistence:** the setting persists at the `family_members.preferences` JSONB level as a user-level preference. Opting in for one session carries forward unless the user opts back out.

### Why this changed

The moderator interjection pattern assumed the user wanted active facilitation. Founder direction 2026-04-21 was that the default should respect the user's flow — if she wanted facilitation, Decision Guide is the tool for that. Board of Directors is about hearing the advisors, not hearing LiLa. Making interjection opt-in honors that.

### What this addendum owns vs. what SCOPE-4.F7 owns

This addendum owns: *aligning parent PRD-34's description of moderator behavior with the opt-in default.* The detailed spec of the interjection logic, the settings UI, and the code changes all live in the F7 fix itself. This section is a pointer: PRD-34's text must be updated to say "LiLa moderator interjections default off, opt-in via conversation settings," not the old "LiLa may interject to help synthesize." The amendment is textual; the behavior change happens in the F7 commit.

---

## §8. Seeded-Persona Audit + Regression Fixture

**Net-new. Implements work item (e) from the Row 11 fix scope.**

### Audit scope

Audit pass covers the 18 seeded starter-pack personas (Decision #18 — public domain historical + literary figures). **Current location note:** the 18 rows live in `public.board_personas` today; they will migrate to `platform_intelligence.board_personas` as part of Wave 1B schema split per work item (a) of the Row 11 fix scope. The audit should run against whichever schema they occupy at audit time; the invariants apply post-migration.

Against:

1. **Three-tier architecture invariants.** After the Wave 1B schema split, every seeded row must have `is_public=true`, `family_id IS NULL`, `content_policy_status='approved'`, `persona_type='system_preloaded'`, `created_by IS NULL` (platform ownership), and live in `platform_intelligence.board_personas`. No schema violations.

2. **Five auto-reject ethics categories.** Each seeded persona's `personality_profile` and `source_references` pass Layer 2 review against force, coercion, manipulation, shame-based control, withholding affection. This is the same audit surface NEW-D covers at the system-prompt level; here it's extended to the seeded persona content.

**Why audit both in one pass:** NEW-D (Row 25, Faith Ethics + LiLa core guardrail coverage audit across 43 guided modes) is already in flight. Starter-pack personas are the exact surface where Layer 2 ethics coverage and three-tier invariants meet. One reviewer pass, one set of findings.

### Regression test fixture

Two-layer coverage:

**Layer A — SQL invariants in CI.** Runs on every migration. Assertions:

```sql
-- No personal_custom row is ever public
SELECT COUNT(*) FROM public.board_personas
WHERE persona_type='personal_custom' AND is_public=true;
-- Must be 0

-- No public row has a family reference
SELECT COUNT(*) FROM platform_intelligence.board_personas
WHERE is_public=true AND family_id IS NOT NULL;
-- Must be 0

-- All system_preloaded rows are approved
SELECT COUNT(*) FROM platform_intelligence.board_personas
WHERE persona_type='system_preloaded' AND content_policy_status != 'approved';
-- Must be 0

-- Approved queue rows have an approved_persona_id
SELECT COUNT(*) FROM platform_intelligence.persona_promotion_queue
WHERE status IN ('approved', 'refined_and_approved') AND approved_persona_id IS NULL;
-- Must be 0
```

**Layer B — Playwright multi-user E2E against Testworth.** New test:
- **Setup:** Mom (Testworth primary parent) creates personal persona "Grandma Rose" via Board of Directors Screen 3. Classifier routes to personal (personal-attribute signals triggered).
- **Assertion 1:** Mom's Board of Directors persona selector shows "Grandma Rose."
- **Assertion 2:** Dad (Testworth additional adult) logs in. Dad's Board of Directors persona selector does NOT show "Grandma Rose" — name search returns zero results for that name.
- **Assertion 3:** A separate test family (not Testworth) opens Board of Directors and searches "Grandma Rose" — zero results.
- **Assertion 4:** Mom creates "Brené Brown" with description pointing at published works. Classifier routes to promotion queue. Mom's selector shows "Brené Brown" (her personal Tier 1 row). Dad's selector does NOT (queue row not yet approved). Tenise approves the queue row. Dad's selector now shows "Brené Brown" (Tier 3 approved row).

**Location:** `tests/e2e/persona-architecture.spec.ts` (new file).

---

## §9. Governance Convention Hook

**Contract point for Artifact B.**

Artifact B authors **CLAUDE.md Convention #258**, which lifts this addendum's three-tier architecture rule into the persistent contract and amends Convention #99 accordingly.

This addendum does NOT write the convention text. Artifact B is the source of truth.

### Invariants the convention must encode

For cross-artifact verification, Convention #258 must enforce:

1. Personal scoped personas (`persona_type='personal_custom'`) are RLS-isolated to the creating family and NEVER enter the shared cache regardless of content.
2. Personal scoped personas NEVER enter the Platform Intelligence Pipeline (Convention #97 reinforced).
3. Personas classified community-relevant enter the promotion queue; deity and blocked-figure personas are rejected upstream by the harm screen (Conventions #100–#102) and never reach the queue.
4. Only the admin Approve / Refine-and-Approve path in PRD-32's Personas tab can write Tier 3 rows (`is_public=true, family_id=NULL, content_policy_status='approved'`).
5. Cache-lookup paths scope by all four Tier 3 predicates (schema namespace + is_public + family_id + content_policy_status).
6. Shared-cache entry criteria are governed at admin review against the PRD-41 / LiLa Layer 2 auto-reject categories (force, coercion, manipulation, shame-based control, withholding affection). Convention #258 does not redefine these categories.

If Artifact B's Convention #258 text diverges from any of these invariants, the artifacts are out of contract and must reconcile before Wave 1B dispatches.

---

## §10. Cross-PRD Impact Delta

**Patch to apply to existing `PRD-34-Cross-PRD-Impact-Addendum.md`:**

### New row: Impact on PRD-05 (LiLa Core / Conversation Engine)

The conversation engine path gains a new pre-generation step: `preScreenApprovedPersonaMatch(requestedName, requestedEmbedding)` returning match status (silent / suggest / none) and a matched persona ID if applicable. PRD-05's conversation engine spec must register this step; implementation lives in the Board of Directors Edge Function but the contract is shared.

**Action needed:** Add pre-screen step to PRD-05's conversation engine pipeline documentation.

### Updated row: Impact on PRD-32 (Admin Console)

Previously stubbed as "persona review queue" in the existing 32/32A addendum. Now concretized:
- New top-level tab: Personas (`/admin/personas`)
- New `staff_permissions.permission_type`: `persona_admin`
- Consumes `platform_intelligence.persona_promotion_queue` per §6 contract
- Approve / Refine / Reject / Defer action set
- Writes to `platform_intelligence.board_personas` on Approve / Refine-and-Approve

**Action needed:** Artifact B's PRD-32 Personas tab section is the authoritative spec. Cross-reference this addendum §6.

### New row: Impact on PRD-30 (Safety Monitoring)

Content Safety Gate sequence shifts: harm screen is now step 2 (after embedding pre-screen) rather than step 1. PRD-30's safety pipeline documentation should note the reordering.

**Action needed:** Update Content Safety Gate sequence documentation in PRD-30 or its cross-reference in PRD-34.

### New row: Impact on Platform Intelligence Pipeline v2

Channel D (Personas) ingestion path gains upstream nodes: embedding pre-screen + multi-family-relevance classifier. Channel D still reads only from `platform_intelligence.board_personas` — reinforces personal_custom exclusion (Convention #97).

**Action needed:** Update Platform Intelligence Pipeline v2 Channel D description to reference the pre-screen + classifier upstream.

### New row: Impact on AI Cost Optimization Patterns

Net cost impact of this addendum:
- **Savings:** embedding pre-screen saves Sonnet generation cost on re-asks for existing approved personas. Estimated: any family requesting a previously-approved persona by name = zero generation cost vs. previous ~$0.02–$0.03.
- **Added cost:** one Haiku classifier call per persona creation. Estimated ~$0.0005 per call.
- **Net:** savings-positive as the approved persona library grows. First family to ask for a given persona pays generation; all future families benefit.

**Action needed:** Register these costs in AI Cost Optimization Patterns doc as additions to the P8 persona caching pattern.

---

## §11. Decisions Locked This Session

| # | Decision | Rationale |
|---|---|---|
| D1 | Embedding pre-screen threshold 0.88, tiered UX (≥0.92 silent, 0.88–0.92 suggest) | Balances "Gandhi vs. Gandalf" character-identity risk with friction reduction on strong matches. Aligns with Pipeline v2 thresholds. |
| D2 | Haiku classifier with 4-signal set, fail-closed to personal-only | Matches existing harm-screen model pattern. Explicit user chip is highest-weight signal. Fail-closed matches SCOPE-8a.F5 precedent. |
| D3 | New `platform_intelligence.persona_promotion_queue` table | Queue rows carry different structured fields than generic review queue; approve writes new Tier 3 row rather than flipping status; cleaner contract for PRD-32. |
| D4 | Mirror-then-approve (personal row stays, new Tier 3 row created on approval) | Cheaper (no regeneration), auditable (admin sees what family actually got), avoids admin-approved-X-platform-got-Y drift. |
| D5 | Seeded-persona audit = three-tier + five ethics categories in one pass; regression fixture = SQL invariants (CI) + Playwright multi-user (Testworth) | NEW-D already audits the same surface; single pass avoids duplication. Two fixture layers catch different classes of regression. |
| D6 | Moderator interjection default OFF, opt-in per conversation or user preference (SCOPE-4.F7 alignment) | Founder direction 2026-04-21. Board of Directors respects user's flow; Decision Guide is the tool for active facilitation. |

---

*End of PRD-34 Persona Architecture Addendum*
