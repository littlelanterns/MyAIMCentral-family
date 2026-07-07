# Active Build: VOICE-INPUT-REPAIR — Voice Dictation Fix + Exposed-Endpoint Auth Closure

> **Status: DEPLOYED + VERIFIED — HOLDING for founder mic eyes-on + commit approval (2026-07-07). Founder approved the deploy; the 3 Edge Functions are live and all live probes pass. Nothing committed yet.**
>
> **Deploy done 2026-07-07:** whisper-transcribe, extract-insights, mindsweep-email-intake all deployed `--no-verify-jwt` (auth enforced in code) to vjfbzpliqialqmabfnxs. LIVE probes 5/5 green (no-auth 401, garbage-token 401, forged-`sub` 401, email no-secret 401). Positive-path confirmed: real mom token → whisper 400 (reached handler past auth), extract-insights bad-path 403 (auth passed, ownership rejected) — legitimate users are NOT locked out.
> Implemented by: Fable session (founder explicitly requested Fable rather than a Sonnet worker — a deliberate override of `.claude/rules/model-routing.md`, which reserves Fable for judgment gates).
> Diagnosis records: `claude/follow-up-builds/voice-input-repair.md` (F1–F9) + `claude/follow-up-builds/edge-function-auth-audit.md` (S1–S3). Those are the evidence; this file is the build record.
> Founder decisions (all resolved before build): fold everything into one fix; F5 → keep the free Web-Speech-under-30s hybrid (fix duplication, no per-minute Whisper cost); S1 → add storage-ownership check; S3 → fail-closed webhook secret now.

## What shipped

**Voice (all surfaces route through one hook, so one fix reaches ~15 surfaces):**
- **F1 (root cause)** — `src/lib/voice/reduceSpeechResults.ts` (new pure fn) + `useVoiceInput.ts` now read Web Speech results from `event.resultIndex` forward instead of index 0. Kills the duplication where "A. B. C." compounded into "A A B A B C" and landed in the box on Chrome/Edge (the <30s free path uses this preview as the final text). Pinned by `tests/voice-reduce-speech-results.test.ts` (vitest, 7 cases incl. the exact old-bug sequence + cross-restart accumulation).
- **F2/F3** — the 4 LiLa consumers (`LilaDrawer`, `LilaModal`, `ToolConversationModal`, `BoardOfDirectorsModal`) no longer mirror interim text into the real input (deleted the mirror effects), no longer erase the user's typed draft on mic-tap, and append the final transcript to the existing draft on stop (no fragile `prev.replace(interim, '')`). Live interim preview moved into each recording status bar; Board got a new preview line since it had none.
- **F4** — `useVoiceInput` no longer throws on mic-start failure (nothing caught it → silent dead button). It sets a friendly, typed `error` (permission vs no-device) exposed via `error` + `clearError`, surfaced as a dismissible line in `VoiceInputButton` (6 consumers) and every inline consumer (LiLa ×4, Notepad, MindSweep, Guided Write, Voice Dump).
- **F8** — `VoiceDumpModal` close-mid-recording now `cancelRecording()` instead of a fire-and-forget `stopRecording()` that paid for a discarded Whisper call.
- **F9** — `stopRecording` guards an already-inactive recorder (mic unplugged mid-recording) so the button can't get stuck on 'recording'.

**Security (the "any other exposed endpoints?" sweep — all 51 Edge Functions classified; 48 already correct):**
- **S2 (whisper-transcribe)** — was publicly invocable with no auth (verified live: answered with no Authorization header). Added `authenticateRequest`. Client already sends the token → zero client change.
- **F6/F7 (whisper-transcribe)** — cost logging never fired (client never sent family/member ids). Now derives them server-side from the authenticated user; `whisper_transcribe` rows will finally land in `ai_usage_tracking`.
- **S1 (extract-insights)** — AUTH BYPASS: it base64-decoded the JWT and trusted `sub` **without verifying the signature**, then ran with service-role storage access. Replaced with `authenticateRequest` (real `getUser`) + a storage-ownership check (path is `{member_id}/innerworkings/...`; caller must share a family with that member) — closes both the open-AI-bill and the cross-family file-read risks.
- **S3 (mindsweep-email-intake)** — email webhook had no signature/secret, only recipient+sender application-layer gates (attacker-learnable). Added a **fail-closed** `MINDSWEEP_WEBHOOK_SECRET` bearer/`x-webhook-secret` check. Dormant today (email DNS unconfigured), so failing closed breaks nothing. **Launch gate: set `MINDSWEEP_WEBHOOK_SECRET` (and the provider's signing config) before wiring email intake.**

## Proof (done this session, pre-deploy)
- `npx tsc -b` — clean, exit 0.
- `npx vitest run tests/voice-reduce-speech-results.test.ts` — 7/7.
- `voice-and-endpoint-auth.spec.ts` static pins — 5/5 (reducer used; whisper+extract-insights call `authenticateRequest`; extract-insights no longer decodes `sub`; email-intake fails closed).
- `safety-beta-gate.spec.ts` static regression — 39/39 (I edited extract-insights, which that spec pins; detectCrisis still present, no regression).
- `eslint` on all 11 touched frontend files — 0 errors (3 pre-existing `exhaustive-deps` warnings on untouched hooks).

## Proof (requires the founder-approved deploy — run after)
- `voice-and-endpoint-auth.spec.ts` LIVE probes (5): whisper-transcribe 401 on no-auth + garbage token; extract-insights 401 on no-auth + forged-`sub` JWT; mindsweep-email-intake 401 with no webhook secret. **These fail until the 3 functions are deployed** (whisper is live at v3 with no auth today).

## Deploy list (ONE founder-approved pass — NOT yet run)
```
supabase functions deploy whisper-transcribe --project-ref vjfbzpliqialqmabfnxs
supabase functions deploy extract-insights --project-ref vjfbzpliqialqmabfnxs
supabase functions deploy mindsweep-email-intake --project-ref vjfbzpliqialqmabfnxs
```
All three keep `verify_jwt = false` (auth is enforced in code, per the project convention). No migrations. No config.toml change. Frontend changes go live on the next normal Vercel deploy.

## Mom-UI Verification
Voice capture needs a real microphone, which neither CI nor this session has — the duplication fix is proven by the vitest reducer pin and the auth fixes by the endpoint pins. The **visual eyes-on** of the mic button states, the moved interim status-bar preview, and the dismissible mic-error line (Convention #277 / #14) has NOT been done — it is founder-owned here, or a headed Playwright tour on a machine with a mic. Recommend a quick real-device pass: dictate a 2-3 sentence note in the Notepad + LiLa drawer (confirm no duplication), and deny mic permission once to see the friendly error.

| Surface | Desktop | Mobile | Verified | Notes |
|---|---|---|---|---|
| LiLa drawer/modal dictation (no dup, draft preserved, interim in status bar) | — | — | **Pending founder eyes-on** | vitest + logic verified; visual not yet |
| Notepad / MindSweep / Guided Write dictation | — | — | **Pending founder eyes-on** | |
| Mic-permission-denied error line | — | — | **Pending founder eyes-on** | deny mic to trigger |

## Post-Build Verification
| Requirement | Status | Evidence |
|---|---|---|
| F1 duplication root cause | **Wired** | reduceSpeechResults + hook; vitest 7/7 |
| F1 vitest pin | **Wired** | tests/voice-reduce-speech-results.test.ts |
| F2/F3 LiLa consumers (×4) | **Wired** | mirror effects deleted, append-not-replace, no draft erase |
| F4 friendly mic error, no throw | **Wired** | hook `error`/`clearError` + display in VoiceInputButton + all inline consumers |
| F5 keep free hybrid | **Wired (by decision)** | no cost-path change |
| F8 VoiceDump close→cancel | **Wired** | cancelRecording on close |
| F9 stop-when-inactive hardening | **Wired** | recorder.state guard + try/finalize |
| S1 extract-insights auth + ownership | **Wired** | authenticateRequest + family-scope check; static pin |
| S2 whisper-transcribe auth | **Wired** | authenticateRequest; static pin; live probe post-deploy |
| F6/F7 whisper cost logging | **Wired** | server-derived family/member |
| S3 email webhook fail-closed secret | **Wired** | MINDSWEEP_WEBHOOK_SECRET gate; static pin |
| Live 401 probes | **Wired** | voice-and-endpoint-auth LIVE 5/5 post-deploy; positive-path (real token) confirmed |
| Mom-UI visual eyes-on | **Pending founder** | needs a mic; Convention #277 |
| Commit + push | **Not done** | holding for founder |

**0 Missing on code. Pending items are deploy + founder eyes-on, both founder-owned.**
