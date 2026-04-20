# Scope 8a — Bucket 4 Evidence: Deities-as-Board-Persona Block (PRD-34)

> **Worker pass:** 2026-04-20
> **Scope:** items 8a-CL-32 through 8a-CL-36
> **Source of authority:** CLAUDE.md Conventions #100, #101, #102; PRD-34 Board of Directors
> **Edge Function path:** [supabase/functions/lila-board-of-directors/index.ts](../supabase/functions/lila-board-of-directors/index.ts)
> **Primary client path:** [src/components/lila/BoardOfDirectorsModal.tsx](../src/components/lila/BoardOfDirectorsModal.tsx)

---

## Summary Table

| ID | Claim | Verdict | Severity if FAIL |
|---|---|---|---|
| 8a-CL-32 | Content policy pre-screen precedes persona generation (CLAUDE.md #102) | **PASS** | Blocking |
| 8a-CL-33 | Deity detection redirects to Prayer Seat | **PASS** | Blocking |
| 8a-CL-34 | Blocked-figure hard block | **PASS** (with caveat) | Blocking |
| 8a-CL-35 | Prayer Seat generates no AI responses (CLAUDE.md #100) | **PASS** | High |
| 8a-CL-36 | Persona disclaimer shown exactly once per session (CLAUDE.md #101) | **PASS** | Medium |

All five items PASS. One shared architectural caveat (server-side re-verification gap) is documented under 8a-CL-32 and 8a-CL-34.

---

## 8a-CL-32 — Content policy pre-screen precedes persona generation — **PASS**

**Claim:** A Haiku pre-screen must run before the Sonnet persona-generation call.

**Evidence — two distinct model calls with pre-screen gate:**

- **Model constants** ([supabase/functions/lila-board-of-directors/index.ts:18-19](../supabase/functions/lila-board-of-directors/index.ts#L18-L19)):
  - `MODEL_SONNET = 'anthropic/claude-sonnet-4'`
  - `MODEL_HAIKU = 'anthropic/claude-haiku-4-5-20251001'`
- **Pre-screen function (Haiku)** — `contentPolicyCheck(name, description)` at [index.ts:38-103](../supabase/functions/lila-board-of-directors/index.ts#L38-L103). `fetch` to OpenRouter at line 59 uses `model: MODEL_HAIKU` (line 68), returns `{ outcome: 'approved' | 'deity' | 'blocked' | 'harmful_description' }`.
- **Persona generation (Sonnet)** — `generatePersona(...)` at [index.ts:107-156](../supabase/functions/lila-board-of-directors/index.ts#L107-L156). Separate `fetch` at line 132 uses `model: MODEL_SONNET` (line 141).
- **Action dispatcher** — distinct actions: `content_policy_check` handler at [index.ts:295-301](../supabase/functions/lila-board-of-directors/index.ts#L295-L301), `create_persona` handler at [index.ts:304-362](../supabase/functions/lila-board-of-directors/index.ts#L304-L362).
- **Client enforces ordering** — [BoardOfDirectorsModal.tsx:282-323](../src/components/lila/BoardOfDirectorsModal.tsx#L282-L323): `handleCreatePersona` calls `content_policy_check` at line 284 FIRST, then branches on `outcome`. `create_persona` is only called on the approved path at line 315 (after all three non-approved branches return early).

**Caveat — server-side enforcement gap:** The Edge Function's `create_persona` action at [index.ts:304-362](../supabase/functions/lila-board-of-directors/index.ts#L304-L362) does NOT internally invoke `contentPolicyCheck` before `generatePersona`. A direct API caller bypassing the client UI could invoke `create_persona` without a prior policy check. The gate is therefore client-enforced, not server-enforced. For Convention #102 ("gate runs BEFORE persona generation") this passes because the only wired caller respects the order — but a belt-and-suspenders server-side guard would strengthen this.

---

## 8a-CL-33 — Deity detection redirects to Prayer Seat — **PASS**

**Claim:** On deity match the flow must route to a `board_session_personas` row with `is_prayer_seat = true`, with no Sonnet persona generation for the deity.

**Evidence — full deity → Prayer Seat wiring:**

- **Pre-screen deity branch** — [index.ts:80-86](../supabase/functions/lila-board-of-directors/index.ts#L80-L86): returns `outcome: 'deity'` with a message offering a Prayer Seat; passes `deityName` through.
- **Pre-screen prompt recognizes divinity** — [index.ts:46](../supabase/functions/lila-board-of-directors/index.ts#L46): "God, Jesus, Allah, Yahweh, Holy Spirit, Buddha (as a divine figure), Krishna, or any name for the divine" with explicit carve-out at line 55 that religious leaders who are NOT the divine (C.S. Lewis, Moses, Paul, saints) are OK — matches the CLAUDE.md #102 narrow-block intent.
- **Client deity handler** — [BoardOfDirectorsModal.tsx:289-300](../src/components/lila/BoardOfDirectorsModal.tsx#L289-L300): on `outcome === 'deity'`, displays the policy message, computes `situationText` from prior user messages, calls `generate_prayer_seat` action with the user's situation + deity name.
- **Prayer Seat question generation (Sonnet, fresh per session)** — `generatePrayerQuestions` at [index.ts:160-202](../supabase/functions/lila-board-of-directors/index.ts#L160-L202), invoked by the `generate_prayer_seat` action at [index.ts:365-370](../supabase/functions/lila-board-of-directors/index.ts#L365-L370). Uses `MODEL_SONNET` at line 182, takes the user's actual situation text as input — satisfies CLAUDE.md #100 "questions generated FRESH per session by Sonnet using the user's specific situation — never canned."
- **Prayer Seat row creation** — `addPrayerSeat` at [BoardOfDirectorsModal.tsx:342-372](../src/components/lila/BoardOfDirectorsModal.tsx#L342-L372). Inserts a placeholder `board_personas` row with `persona_name: 'Reflection Seat'` (line 346) — crucially NOT under the deity's name — then inserts a `board_session_personas` row with `is_prayer_seat: true` at line 360. Persists fresh questions to `lila_conversations.context_snapshot.prayer_questions` at lines 362-366 so the chat stream can render them (see 8a-CL-35).

No deity name ever reaches `generatePersona` (Sonnet persona synthesis). Pass.

---

## 8a-CL-34 — Blocked-figure hard block — **PASS (with caveat)**

**Claim:** Blocked figures (mass violence, genocide, terrorism, sexual predation) must produce a hard block with user-facing message and NO `board_personas` row.

**Evidence:**

- **Pre-screen blocked branch** — [index.ts:87-92](../supabase/functions/lila-board-of-directors/index.ts#L87-L92): returns `outcome: 'blocked'` with user-facing message `"I'm not able to create a persona for ${name}. Is there someone else you'd like at your table?"`
- **Pre-screen prompt taxonomy** — [index.ts:48-49](../supabase/functions/lila-board-of-directors/index.ts#L48-L49): explicit category "figure whose primary legacy involves mass violence, genocide, terrorism, or sexual predation (e.g., Hitler, Stalin, serial killers, cult leaders who harmed people)".
- **Client blocked handler** — [BoardOfDirectorsModal.tsx:302-306](../src/components/lila/BoardOfDirectorsModal.tsx#L302-L306): sets `policyMessage`, sets `creatingPersona` false, `return`s early without calling `create_persona`. No `board_personas` row is inserted.
- **Fourth outcome also gated** — `harmful_description` branch at [index.ts:93-98](../supabase/functions/lila-board-of-directors/index.ts#L93-L98) and client handler at [BoardOfDirectorsModal.tsx:308-312](../src/components/lila/BoardOfDirectorsModal.tsx#L308-L312) provide the same early-return on harmful description input — not required by this checklist item but aligns with the same hard-block pattern.

**Caveat — same server-side gap as 8a-CL-32:** `create_persona` does not internally re-verify policy status. A non-UI client could insert a blocked persona by calling `create_persona` directly. For the current single-client wiring this is moot; for hardening it is a known gap.

**Additional watch item — fail-open on API error:** [index.ts:74](../supabase/functions/lila-board-of-directors/index.ts#L74) and [index.ts:100-102](../supabase/functions/lila-board-of-directors/index.ts#L100-L102) both return `{ outcome: 'approved' }` if the Haiku call or JSON parse fails. This is a deliberate fail-open that lets Sonnet generation proceed on infrastructure blips. Not a FAIL of this checklist item per se (the hard-block path is wired correctly when the classifier runs), but worth surfacing for a separate "fail-open vs fail-closed" policy decision.

---

## 8a-CL-35 — Prayer Seat generates no AI responses — **PASS**

**Claim:** Per CLAUDE.md #100, Prayer Seat seats must be skipped in the advisor-response loop; reflection questions must be generated FRESH per session by Sonnet using the user's specific situation — never canned.

**Evidence:**

- **Prayer seats excluded from advisor loop input** — [index.ts:409](../supabase/functions/lila-board-of-directors/index.ts#L409): `const personaIds = seatedPersonas.filter(s => !s.is_prayer_seat).map(s => s.persona_id)`. Only non-prayer-seat persona IDs are loaded into the `personas` array that drives the Sonnet advisor loop.
- **Advisor loop iterates `personas` only** — [index.ts:502-596](../supabase/functions/lila-board-of-directors/index.ts#L502-L596): `for (let i = 0; i < personas.length; i++)`. Since `personas` excludes prayer seats (line 409), no Sonnet advisor call is ever made for a prayer seat.
- **Prayer seats handled as separate stream event** — [index.ts:599-612](../supabase/functions/lila-board-of-directors/index.ts#L599-L612): `prayerSeats = seatedPersonas.filter(s => s.is_prayer_seat)`. If present, the handler reads pre-stored `prayer_questions` from `conv.context_snapshot` (written by the client's `addPrayerSeat` at [BoardOfDirectorsModal.tsx:362-366](../src/components/lila/BoardOfDirectorsModal.tsx#L362-L366)) and emits them as a `type: 'prayer_seat'` SSE event. No `fetch` to OpenRouter for the prayer seat.
- **Fresh generation site** — `generatePrayerQuestions` at [index.ts:160-202](../supabase/functions/lila-board-of-directors/index.ts#L160-L202). Uses `MODEL_SONNET` (line 182), takes `situation` parameter (populated from the user's actual conversation at [BoardOfDirectorsModal.tsx:292](../src/components/lila/BoardOfDirectorsModal.tsx#L292)), and the prompt at line 161-171 explicitly directs "Specific to their situation (not generic spiritual questions)". A hardcoded fallback set of 5 questions exists at [index.ts:195-201](../supabase/functions/lila-board-of-directors/index.ts#L195-L201) but is only returned on JSON parse failure — fresh generation is the default path.

Nuance: "fresh per session" is implemented as "generated once when the prayer seat is added, then replayed verbatim on each chat turn within the same board session." The questions are personalized to the user's situation at generation time, and a new board session (new `board_sessions` row) would regenerate. This matches the Convention #100 intent as written.

---

## 8a-CL-36 — Disclaimer shown exactly once per session — **PASS**

**Claim:** Per CLAUDE.md #101, the "AI interpretation of [Name]..." disclaimer must be shown exactly ONCE per session for non-personal personas, tracked via `board_sessions.disclaimer_shown`.

**Evidence — full read / render / write triangle:**

- **Schema** — `board_sessions.disclaimer_shown` exists: `claude/live_schema.md` §ThoughtSift lists `disclaimer_shown` as column 6 of `board_sessions`.
- **Edge Function READ** — [index.ts:391-394](../supabase/functions/lila-board-of-directors/index.ts#L391-L394): `supabase.from('board_sessions').select('id, disclaimer_shown').eq('conversation_id', conversation_id).single()`.
- **Edge Function COMPUTE** — [index.ts:491-492](../supabase/functions/lila-board-of-directors/index.ts#L491-L492): `needsDisclaimer = boardSession && !boardSession.disclaimer_shown && personas.some(p => p.persona_type !== 'personal_custom')`. Correctly gates on (a) session loaded, (b) flag not yet set, (c) at least one non-personal persona seated. Personal (`personal_custom`) personas are skipped — matches Convention #101 "exactly ONCE per session for **non-personal** personas".
- **Edge Function EMIT to client** — [index.ts:570-579](../supabase/functions/lila-board-of-directors/index.ts#L570-L579): `isFirstNonPersonal = needsDisclaimer && i === personas.findIndex(p2 => p2.persona_type !== 'personal_custom')`. The flag is attached as `show_disclaimer: isFirstNonPersonal` on the first non-personal advisor's `lila_messages.metadata` JSONB (line 578).
- **Edge Function WRITE flag** — [index.ts:582-585](../supabase/functions/lila-board-of-directors/index.ts#L582-L585): immediately after emitting, `UPDATE board_sessions SET disclaimer_shown = true` scoped to the current session id. Subsequent turns will read `disclaimer_shown = true` and skip re-display.
- **Client RENDER** — [BoardOfDirectorsModal.tsx:562](../src/components/lila/BoardOfDirectorsModal.tsx#L562): `const showDiscl = meta.show_disclaimer === true`. [BoardOfDirectorsModal.tsx:595-599](../src/components/lila/BoardOfDirectorsModal.tsx#L595-L599): conditional renders the disclaimer text `"This is an AI interpretation of {persona_name} based on publicly available writings and known positions. Not endorsed by or affiliated with {persona_name}. For the real thing, read their actual work."`

Read + compute + emit + write + render all wired. Pass.

---

## Unexpected findings

1. **Fail-open on content policy API error** ([index.ts:74](../supabase/functions/lila-board-of-directors/index.ts#L74), [index.ts:100-102](../supabase/functions/lila-board-of-directors/index.ts#L100-L102)) — if the Haiku call or JSON parse fails, the function returns `{ outcome: 'approved' }`. A deliberate design choice but worth a founder policy decision: should the Deities-as-Board-Persona Block fail CLOSED (reject creation) on classifier unavailability, given it is a blocking content-policy gate?

2. **Server-side enforcement gap in `create_persona`** — the Edge Function's `create_persona` handler does NOT internally re-verify the policy result before calling Sonnet. The gate is enforced only by the single client path in `BoardOfDirectorsModal.tsx`. This was not raised as a FAIL for items 32 or 34 because the only wired caller respects the order, but it is a defense-in-depth gap worth logging. A one-line server-side re-invocation of `contentPolicyCheck` inside the `create_persona` branch would close it.

3. **Prayer Seat placeholder persona uses `personal_custom` type** ([BoardOfDirectorsModal.tsx:347](../src/components/lila/BoardOfDirectorsModal.tsx#L347)) — the "Reflection Seat" placeholder is inserted into `board_personas` with `persona_type: 'personal_custom'` and `family_id` populated. Under Convention #97 ("`personal_custom` personas NEVER enter the platform intelligence pipeline"), this correctly keeps Prayer Seat placeholders out of the pipeline. Consistent with the spirit of deity-block + no-platform-memory-of-deity-names.

4. **Crisis override only runs on the chat action path** — [index.ts:376-382](../supabase/functions/lila-board-of-directors/index.ts#L376-L382) detects crisis on user chat content. The `content_policy_check`, `create_persona`, and `generate_prayer_seat` actions do not run crisis detection on their inputs. Likely fine given those inputs are persona names/descriptions/situations-as-metadata rather than conversational crisis signals, but worth a note for Bucket 3 (Crisis Override) review — this item is out of scope for Bucket 4.

5. **Hardcoded fallback prayer questions exist but are only returned on JSON parse failure** ([index.ts:195-201](../supabase/functions/lila-board-of-directors/index.ts#L195-L201)). These 5 generic questions are a reasonable graceful-degradation choice but would violate Convention #100's "never canned" rule if they became the dominant path. Consider monitoring how often they're hit in production.

---

## Notes for the orchestrator

- All five Bucket 4 items PASS. No SCOPE-8a.F{N} findings proposed for this bucket.
- Two secondary observations (fail-open on classifier error; server-side enforcement gap in `create_persona`) are candidates for **informational findings** (Beta Readiness = N) if the orchestrator chooses to surface them. Neither blocks beta compliance as currently wired.
- The Prayer Seat mechanism is the most architecturally sound piece of this bucket — the `board_personas` / `board_session_personas` / `context_snapshot.prayer_questions` triangle cleanly isolates divine references from platform intelligence while keeping fresh per-session generation.
- Edge Function and client are tightly coupled by convention (client enforces action ordering). If multiple clients are ever added, the server-side gap in item 1 above becomes material.
