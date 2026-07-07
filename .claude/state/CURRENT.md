# Current State — As of 2026-07-07 (release batch day; Fable intro pricing ends today)

> Any coordination session (fresh, compacted, or resumed) can rebuild the full picture from:
> this file → `claude/dispatch-factory/MANIFEST.md` (29 packs incl. PRD42 KitchenCompass) →
> `.claude/rules/current-builds/*` (in-flight) → `.claude/completed-builds/README.md` (history).

## Landed since 2026-07-05 (proof green, committed via the 2026-07-07 release batch)

- **FAMILY-GOALS-PRIZES** — family goals engine (migration 100284, trigger-counted contributions, race-safe award, NULL-owner family prizes). Rider 1 audit found + fixed 2 pre-existing Prize Board bugs. Convention #278.
- **HITM-CLOSURE** — Ask LiLa & Send gated (Send/Edit/Discard, HMAC verbatim guarantee), BoD + BookShelf HITM rows, Convention #279 (HITM applicability + declared exceptions). **Major find:** Convention #55 Reject/Regenerate silently broken platform-wide since PRD-05 — `lila_messages` never had a DELETE policy; fixed in migration 100285.
- **VOICE-INPUT-REPAIR** — speech duplicator fixed at the shared hook (all ~15 surfaces), LiLa chat mic fixes, mic-denied messaging, whisper-transcribe/extract-insights auth + ownership checks, email webhook fails closed. Functions deployed.
- **SAFETY-BETA-GATE follow-ups** — MindSweep crisis rendering card, NO_EMOJI_BLOCK in safety-preamble (16 functions redeployed).
- **Beta Readiness Report** (`claude/feature-decisions/Beta-Readiness-Report-2026-07.md`) — ~4–6 weeks to beta; HITM audit run for the first time (findings all closed by HITM-CLOSURE); critical path ordered.
- **PRD-41 approved** → `prds/foundation/PRD-41-LiLa-Runtime-Ethics-Enforcement.md`. **PRD-42 KitchenCompass** designed (meal planning; pack PRD42.md, Phase A Sonnet-ready). **PRD-30 pre-build complete + founder-approved** (D1–D7 resolved; D6 = wire real email provider, sequenced last in SM-C).

## In flight right now

- **SAFETY-BETA-GATE Slice E** (Sonnet) — PRD-41 Layer 1 build, Phase 1 running. Confirms (a)+(b) resolved: reframe copy approved as-is; red-team = pre-push hook. **Phase 2 gated on the release batch landing** (entangled Edge Function files).
- **PRD-30 SM-A** — dispatch prompt ready in `.claude/rules/current-builds/PRD-30-safety-monitoring.md`; founder pastes when ready.
- Possible other Wave-1 lanes (ST-A, FDWA, PINR, BSB1) — check windows/build files before claiming their files.

## Founder-only open items

1. **Attorney package** (`claude/legal-drafts/`) — founder plans to send in ~2 weeks (her clock; noted 2026-07-07). Fill 3 contact blanks + ask counsel about T&C. Legal-dependent items (PRD-40 finalization, kid-privacy carve-outs) wait on this; build track does not.
2. `MINDSWEEP_WEBHOOK_SECRET` must be set before email intake is ever enabled (webhook now fails closed).
3. OpenRouter privity support ticket (wording in `no-training-verification.md` §6).
4. Identify `mcps/` (untracked — commit deliberately or gitignore).
5. **Fable→Opus judgment re-pin: DEFERRED to 2026-07-12** — Anthropic extended Fable intro pricing through 07-12 (announced 07-07). Until then: judgment agents stay pinned to Fable; every Checkpoint-5 post-build audit this week runs at Fable quality. At 07-12: re-decide (likely re-pin `pre-build-auditor` + `post-build-verifier` to `opus`; Fable becomes escalation-step-3 only).
6. Resend/DNS setup when SM-C reaches its email item (worker will ask; non-blocking).
7. Slice E Phase-4 enforcement flip session after ≥1 week of family shadow data.

## Standing rules established this week

- Convention #277 Claude-driven visual verification; #278 family-goals engine contract; #279 HITM applicability + declared exceptions.
- DB-asserted pins are the only accepted proof — "controls present" ≠ "controls working" (the Convention #55 discovery is the canonical example).
- Release-worker pattern for multi-lane commits: attribution from build files, selective staging, shared docs in one citing commit, one push, no hook bypasses.

---
*This file is overwritten at every close-out and every baton-pass. For history, see HISTORY.md.*
