# LILA_FUTURE_LOCAL_LLM.md

> **Status:** Vision stub — captured from [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md) Row 100 (NEW-E), classified **Capture-only** and locked 2026-04-23 at Session 2 close.
> **This is NOT a build spec.** No design work, no schema, no Edge Function, no convention amendment shall land against this document until (a) MyAIM Central is post-beta and (b) the founder explicitly initiates a design pass. The purpose of this file is to preserve strategic intent so it is not lost; it is not a to-do.
> **Source:** [FIX_NOW_SEQUENCE.md](FIX_NOW_SEQUENCE.md) v11 §Capture-only — "on-device small LLM for General/kid/privacy-sensitive chat. Post-beta vision. Author stub post-Session-2; do NOT schedule build."

---

## Vision in one paragraph

A small open-source LLM, running locally on a family's device, handles conversation surfaces where remote model calls are a poor fit — kid-facing chat, privacy-sensitive general conversation, offline usage, and the future user-visible General / Sitting LiLa mode. The remote Sonnet / Haiku pipeline continues to serve everything that genuinely needs it: specialized LiLa modes (Cyrano, Higgins, Board of Directors, etc.), BookShelf discussion, gleaning writes back into the family context graph, crisis detection redundancy, and any surface where the local model's capability or size does not meet the bar. Routing is automatic and invisible to mom — she experiences one LiLa; the substrate is mixed.

---

## Strategic value

- **Privacy.** Kid-facing chat and general conversation stop leaving the family's device. This is the single biggest category of LiLa traffic a privacy-conscious family would want off a third-party API.
- **Zero-API-cost general chat.** The 43-mode LiLa surface includes a General / Sitting LiLa that is currently hidden from user-facing surfaces (see NEW-B, Triage Row 8) precisely because every unscoped Sonnet turn is an unbounded cost exposure. A local LLM turns General LiLa from a cost-risk surface into a zero-marginal-cost surface, which is what unhides it.
- **Kid AI safety unlock.** Running kid-facing conversation on-device materially reduces the surface area of "what leaves the family" and is a cleaner story for COPPA, Florida FACT, ESA families, and any future kid-AI regulation. It also makes mom's consent posture simpler to explain.
- **ESA positioning.** Education Savings Account families are a distinct segment where data-locality is a purchase driver. A local-LLM substrate is a differentiator the remote-only competitive set cannot match without re-architecting.
- **Offline resilience.** Air travel, rural internet, ISP outage, device rotation to a tablet without data — all currently break LiLa. Local inference on General / kid surfaces keeps core conversation alive through the outage. Gleaning can buffer and replay when the device reconnects.

---

## Scope of capture

The content areas below are captured from Row 100's description. Each is a question to be answered during a future design pass — not an answer this document commits to.

### Routing logic (which conversations go local vs. remote)

Open question set for the future design pass:

- **Default category-1 remote / category-2 local?** A natural first cut: LiLa-powered modes (category 1 per Convention 248 — shared conversation engine, shared context assembly, shared gleaning) remain remote because they depend on rich cross-family context and Sonnet-grade reasoning. Native utility tools + General / Sitting LiLa + kid-shell conversation (category 2 and unscoped chat) are plausible local-first candidates.
- **Gleaning.** Gleaning (third attribute of LiLa per Convention 247) writes back to the family graph. Local-LLM turns must still emit gleaning events — either by running a remote summary pass after the conversation closes (cheap), by running gleaning on-device with a second local model pass, or by deferring gleaning on local turns and accepting a degraded learn-from-family signal for that surface. Decision deferred.
- **Fallback direction.** When local inference degrades (model too small for the prompt, latency spike, device thermal throttle), does the turn fail, queue, or silently fall back to remote? Silent fallback is the least disruptive UX but violates the privacy promise. Decision deferred.
- **Explicit user choice.** Whether mom gets a per-member or per-surface toggle ("always local" / "always remote" / "auto") vs. a fully invisible auto-route. Decision deferred.

### Hardware floor (minimum device capability)

Open question set. First-cut constraint: the floor must support the lowest-end device in the first beta cohort's realistic hardware distribution — this is not a flagship-phone-only feature. Specifics to decide:

- Minimum RAM for the target model (small quantized open-source models currently land in the 2-8 GB resident range; the floor depends on model choice).
- GPU / Neural Engine requirement vs. CPU-only fallback.
- Per-platform support matrix: iOS (Core ML + Metal), Android (NNAPI), macOS, Windows, Linux. Web surface is almost certainly remote-only.
- Cold-start latency ceiling. Warm-inference latency ceiling. Both affect the UX of "tap the drawer, LiLa answers."

### Model candidates

Not a recommendation list — a capture of the shape of the decision space. To be populated during the future design pass with then-current open-source small-model state of the art. Candidate dimensions:

- **Size class.** 1B / 3B / 7B quantized. Larger models handle mom-grade reasoning; smaller models handle kid chat and general conversation within tighter latency and RAM envelopes.
- **Licensing.** Commercial-use-permitted open-source licenses only. No GPL-style copyleft on model weights that would encumber distribution.
- **Alignment posture.** Kid-chat demands instruction-tuned + safety-tuned. Base models are not candidates regardless of size.
- **Multilingual.** At minimum the first-beta-cohort language set (English). Spanish / multilingual becomes a gating criterion if beta expands.

### Guardrails

The same safety substrate that applies to remote LiLa applies here. Specifics require design work but the invariants are already load-bearing:

- **Crisis override is global (CLAUDE.md §Safety Systems, Global Crisis Override).** Every local-LLM turn is subject to crisis keyword detection before and after inference. No local-only shortcut bypasses this.
- **Context scope.** Local inference does not get broader family context than the equivalent remote surface would. Three-tier `is_included_in_ai` toggles and Privacy Filtered constraints apply identically. Safe Harbor exemption remains.
- **Gleaning gate.** Whatever gleaning posture is chosen (remote summary pass / local gleaning / deferred), the Human-in-the-Mix contract applies to anything written back to the family graph. Local inference does not get an auto-write shortcut.
- **Category policy.** PRD-41 (Platform AI Ethics, referenced by SCOPE-8a.F3 — Triage Row 3) auto-reject categories — force, coercion, manipulation, shame-based control, withholding affection — apply to local model output. Defense-in-depth: per-mode system prompts (covered by NEW-D, Triage Row 25) are Layer 2; PRD-41 output validation is Layer 1. Both layers must re-validate local-model output before it reaches the user.
- **Content policy gates** that are narrowly scoped today (Board of Directors persona generation, per Convention 248 and PRD-34 Conventions 100–102) remain narrowly scoped. A local LLM does not automatically get authority to generate personas.

### Family-member-scoped constraints

Who can use the local LLM, under what conditions:

- **By role.** Kid surfaces (Play, Guided) are the natural first candidates for local inference. Adult and Mom surfaces may or may not opt in; founder-level decision.
- **By permission state.** Existing `useCanAccess()` + `<PermissionGate>` gating applies. A local LLM does not bypass tier gates. A family on a tier that does not include a given feature does not silently get that feature because the model happens to be local.
- **By member toggles.** The three-tier context-inclusion model continues to govern what the local model sees. A member with `is_included_in_ai = false` at any layer is not in context, local or remote.
- **By mode.** Safe Harbor remains isolated. Specialized LiLa modes with rich context requirements (Cyrano, Higgins, Board, BookShelf discussion) are remote regardless of who invokes them.

---

## Relationship to existing conventions

### Convention 247 (LiLa scope — three-attribute definition)

Convention 247 defines LiLa as (1) shared conversation engine, (2) shared context assembly, (3) shared context update / gleaning. A local-LLM future fits this definition by preserving all three attributes, with the substrate split across local + remote execution rather than collapsing to a single provider. The convention does not need to be amended to accommodate local inference — a local model is a substrate, not a new category of tool. The three invariants continue to hold.

### Convention 248 (Native AI Vault tool categories)

Convention 248 distinguishes category-1 LiLa-powered native tools (registered in `lila_guided_modes`, full LiLa pipeline) from category-2 utility tools (own Edge Function, not in `lila_guided_modes`, not gleaning-participating). A local LLM does not change this split. It changes the substrate on which some category-1 turns execute; it does not convert category-2 tools into gleaning participants, and it does not convert gleaning-required conversation into utility calls.

### NEW-B (Triage Row 8) — General / Sitting LiLa removal

NEW-B removed General / Sitting LiLa from 10 user-facing surfaces (Recon-2 verdict: RECON_GENERAL_MODE_SURFACES.md). The drawer default became Assist (teaching-how-the-app-works mode). The technical fallback stayed — the `general` mode row remains in `lila_guided_modes`; the PRD-05 Sitting LiLa spec is preserved, hidden until local-LLM future. This local-LLM future is the explicit reason NEW-B hid rather than deleted General. When the local-LLM substrate lands, re-exposing General becomes a viable product decision because the cost profile has flipped. Until then, Assist owns the drawer default.

### Forward pointers (documents that would need amendment if this ever builds)

These are flagged here for traceability so a future design pass can find them. None of these amendments should land now — the pointers are prospective.

- **CLAUDE.md §Tech Stack.** Would gain a line describing the local-LLM substrate and its role. _To be authored._
- **CLAUDE.md §LiLa AI (PRD-05).** Convention block would gain a local-vs-remote routing convention describing how turns are dispatched. _To be authored._
- **CLAUDE.md §Safety Systems.** Guardrails convention would add the local-inference invariants (crisis override re-validation, category policy re-validation, PRD-41 output-validation re-entry). _To be authored._
- **PRD-05.** Would gain a local-LLM section describing General / Sitting LiLa unhide criteria and the routing layer. _To be authored._
- **PRD-40 COPPA.** Would gain a subsection describing how on-device inference changes the kid-data-leaves-device footprint. _To be authored._
- **PRD-41 Platform AI Ethics.** Would gain a section describing output validation for local-model output vs. remote-model output. _To be authored._

A future amendment pass will populate these; none of them exist yet.

---

## Explicit caveat

This file captures a vision. It does not commit to a build, a model, a vendor, a licensing decision, a hardware floor, a routing algorithm, or a timeline. **Do not design or implement against this document.** Do not file stubs, feature keys, migrations, Edge Functions, PRD addenda, or CLAUDE.md conventions referencing a local-LLM substrate until MyAIM Central has shipped beta, run long enough to validate the business model, and the founder has explicitly initiated a design pass on this topic. Until that moment, this file's sole purpose is to preserve strategic intent so the Row 100 capture does not decay into stale notes or get lost in addendum churn.

If this file is still present and unmodified at the moment design begins, that is the correct state — its next revision is by the founder-initiated design pass, not by incremental drift.

---

## Cross-references

- Triage source: [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md) Row 100 (NEW-E), locked Capture-only 2026-04-23.
- Wave placement: [FIX_NOW_SEQUENCE.md](FIX_NOW_SEQUENCE.md) v11 §Capture-only.
- Related triage row: [TRIAGE_WORKSHEET.md](TRIAGE_WORKSHEET.md) Row 8 (NEW-B) — General mode hidden from user-facing surfaces; local-LLM future is the stated unhide condition.
- Related recon: [RECON_GENERAL_MODE_SURFACES.md](RECON_GENERAL_MODE_SURFACES.md) — 10 user-facing General surfaces inventoried for removal in NEW-B.
- Governing conventions: [CLAUDE.md](CLAUDE.md) §247 (LiLa scope), §248 (Native AI Vault tool categories).
- Safety substrate: [claude/ai_patterns.md](claude/ai_patterns.md) §Safety Systems (Global Crisis Override, PRD-30 layers).
- Upstream PRDs (for future amendment pass, not for now): PRD-05 (LiLa core), PRD-40 (COPPA), PRD-41 (Platform AI Ethics — part of SCOPE-8a.F3 Wave 1 build per [FIX_NOW_SEQUENCE.md](FIX_NOW_SEQUENCE.md)).
