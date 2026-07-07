# Voice Input Repair — Diagnosis & Proposed Fixes (DRAFT)

> Status: DRAFT — read-only diagnosis 2026-07-06, no code changed. Awaiting founder review of proposed fixes.
> Diagnosed by: Fable session, direct code read + live production probes (no browser testing performed).
> Scope of investigation: every voice surface in the app. All voice capture funnels through ONE hook
> (`src/hooks/useVoiceInput.ts`) consumed by 13 components (~15 surfaces) — which is why a bug there
> breaks voice "everywhere" at once.

---

## Plain-English summary

Voice input has one root-cause bug and several compounding ones. The big one: **the live
speech-preview engine re-adds everything you already said every time you finish a phrase.**
Say "Get the milk. And the eggs." and the text becomes "Get the milk Get the milk And the eggs" —
and it compounds with every sentence, so longer dictations get progressively more garbled.
Because recordings under 30 seconds use that preview text as the final result (the paid Whisper
transcription is skipped to save cost), **the garbled text is what actually lands in the box** on
Chrome/Edge — the browsers almost everyone uses. The backend (Whisper Edge Function) is deployed,
healthy, and was verified working by live probe — the breakage is entirely client-side logic.

A second layer: the LiLa chat surfaces mishandle the preview text (Board of Directors doubles it
again; the LiLa drawer erases anything you'd already typed when you tap the mic). A third: if the
browser denies microphone permission, the button silently does nothing — no message at all.

Bonus finding from the same investigation: the `whisper-transcribe` Edge Function is **publicly
invocable with no authentication** (verified live — it answers without any Authorization header).
Same class as the six endpoints SAFETY-BETA-GATE Slice C closed; this one was missed.

---

## Surfaces affected (all funnel through the one hook)

| Surface | Integration | Extra local bug? |
|---|---|---|
| LiLa Drawer (mom) | inline mic, interim mirrored into input | F3 (erases draft, fragile replace) |
| LiLa Modal (other roles) | same pattern | F3 |
| ToolConversationModal (Cyrano, Higgins, ThoughtSift, etc.) | same pattern | F3 |
| Board of Directors Modal | interim mirrored + appended again on stop | **F2 (guaranteed doubling)** |
| Smart Notepad drawer | append on stop | — |
| Guided Write drawer (Notepad tab) | append on stop | — |
| Guided Write drawer (Reflections tab) | shared VoiceInputButton | — |
| MindSweep capture (`/sweep`) | append on stop; `high_accuracy_voice` forces Whisper | — |
| Archives Voice Dump modal | modal flow | F8 (close triggers discarded transcription) |
| Archives Bulk Add Sort modal | shared VoiceInputButton | — |
| BookShelf Discussion modal | shared VoiceInputButton | — |
| Record Victory (both variants) | shared VoiceInputButton | — |
| Bulk Add (shared + lists frequency variant) | shared VoiceInputButton | — |

No voice-specific reports exist in `beta_glitch_reports` (searched voice/mic/dictat/transcri/record —
3 hits, all unrelated). The extensive "[Voice] Mic appears silent" debug logging already in the hook
suggests a prior debugging session chased symptoms here before.

---

## Findings

### F1 — ROOT CAUSE: Web Speech preview duplicates text (all surfaces, Chrome/Edge)
`src/hooks/useVoiceInput.ts:166-185`

The `recognition.onresult` handler iterates **all** results from index `0` on every event, then
**appends** the whole session's finalized text to the accumulator ref each time a new phrase
finalizes:

```ts
for (let i = 0; i < event.results.length; i++) { ... }   // should start at event.resultIndex
...
webSpeechFinalRef.current = webSpeechFinalRef.current + sessionFinal  // re-appends ALL prior finals
```

Walkthrough: phrase 1 finalizes → ref = "A ". Phrase 2 finalizes → event.results still contains
phrase 1, so sessionFinal = "A B " → ref = "A A B ". Phrase 3 → ref = "A A B A B C ". Compounds
per phrase.

Impact is double-barreled:
1. The live preview (interimText) shows garbled text while speaking — on LiLa surfaces this is
   written straight into the input box.
2. `stopRecording()` line 269: recordings **< 30s with any Web Speech text return that text as the
   final result** (Whisper is skipped). So the duplicated text is what gets inserted. This covers
   the vast majority of real dictations.

Browsers without Web Speech (Firefox, Brave) skip to Whisper and are unaffected — which may explain
inconsistent "works on one device, not another" behavior.

**Fix:** iterate from `event.resultIndex`; append only newly-finalized results to the ref; interim =
non-final results from `resultIndex` onward. Keep the cross-restart accumulation (that part is
correct — Chrome kills continuous recognition and the auto-restart handling is right).

**Testability:** extract the result-reducer into a pure function (`reduceSpeechResults(prevFinal,
event)`) and pin it with a vitest — fake event sequences for: multi-phrase session, restart
mid-session, interim-only events. Voice can't be E2E'd (no mic in CI), so the pure-function pin is
the drift guard.

### F2 — Board of Directors doubles the final text (independent of F1)
`src/components/lila/BoardOfDirectorsModal.tsx:282-283, 538-546`

The effect mirrors interim into the input while recording; the stop handler then **appends** the
transcript to that same input without removing the interim:

```ts
if (transcribed) setInput(prev => prev ? prev + ' ' + transcribed : transcribed)
```

For short recordings `prev` ≈ `transcribed` → "text text" even after F1 is fixed.

**Fix:** stop mirroring interim into the real input (see F3's shared fix), or at minimum replicate
the LilaDrawer replace-then-append pattern.

### F3 — LiLa surfaces: interim-into-input pattern is fragile and erases drafts
`LilaDrawer.tsx:118-122, 194-207` · `LilaModal.tsx:65-68, 94-105` · `ToolConversationModal.tsx:445-446, 464-475`

Three problems with the shared pattern:
- Tapping the mic runs `setInput('')` — **any draft the user had typed is silently erased**.
- While recording, `setInput(interimText)` replaces the entire input with preview text.
- On stop, `prev.replace(interimText, '')` tries to strip the preview before appending the real
  transcript — a whitespace/trim mismatch or a late interim event makes the replace silently fail,
  leaving preview + transcript concatenated.

**Fix (one shared pattern):** never write preview text into the real input. All three surfaces
already render a recording status bar — show interim preview there (like Notepad/MindSweep do).
On stop, append the final transcript to whatever was already typed. Deletes the erase, the mirror
effect, and the fragile replace in one move; Board of Directors gets the same pattern (fixes F2).

### F4 — Mic permission failure is a silent dead button (all surfaces)
`useVoiceInput.ts:149-153` throws `'Microphone access denied'` on ANY start failure. **No consumer
catches it** → unhandled promise rejection, no UI feedback. On iOS Safari and family-tablet
contexts where permission prompts/denials are common, the mic button just does nothing.

**Fix:** return a typed error state from the hook (or catch in `VoiceInputButton` + each inline
consumer) and show the standard friendly toast: "I need microphone access to hear you — check your
browser's mic permission." Distinguish `NotAllowedError` (permission) from `NotFoundError` (no mic)
for better copy. Per the error-handling convention: never raw errors, never silent.

### F5 — Design decision: Whisper is documented as primary but is actually the rare path
The hook's doc comment says "Whisper-primary with Web Speech fallback." Reality (line 269): Web
Speech is primary for everything under 30 seconds; Whisper only runs for long recordings, empty Web
Speech results, or MindSweep's `high_accuracy_voice` opt-in. So the everyday dictation experience is
Web Speech's (lower) accuracy — with F1 on top.

**Options (founder pick):**
- **(a) Keep hybrid, fix F1** — $0 marginal cost; Web Speech accuracy is acceptable post-fix;
  Whisper still catches long recordings. *(Recommended: fixes the actual bug, costs nothing.)*
- **(b) Whisper-primary always** — matches the doc's intent; best accuracy everywhere; Web Speech
  becomes preview-only. Cost ≈ $0.006/min of audio (OpenAI Whisper) — negligible at current usage
  but it's a per-family AI-budget line item that scales with dictation habits.

Either way F1 must be fixed (Web Speech still drives the live preview).

### F6 — SECURITY: whisper-transcribe is publicly invocable (no auth)
Verified live 2026-07-06: `POST /functions/v1/whisper-transcribe` with **no Authorization header**
returns the handler's own 400 ("No audio file provided") — the request reached the function code.
`config.toml` has `verify_jwt = false` and the function (`index.ts`) never checks auth. Anyone on
the internet can transcribe up to 25MB of audio per call on the platform's OpenAI bill. Same class
as the six endpoints SAFETY-BETA-GATE Slice C closed; this one wasn't on that list.

**Fix:** wire the shared `authenticateRequest` pattern into `whisper-transcribe/index.ts` (cors →
auth → formData, before the OpenAI call). The client hook already sends `Authorization: Bearer
<session token>` (`useVoiceInput.ts:346-352`), so **zero client changes** — existing users are
unaffected. Requires one Edge Function redeploy (founder-approved deploy pass, per convention).

### F7 — Whisper cost logging never fires
`whisper-transcribe/index.ts:71` only logs cost `if (familyId && memberId)` — but the client hook
never appends `family_id`/`member_id` to the form (`useVoiceInput.ts:343-344`). Result: zero
Whisper rows in `ai_usage_tracking` since launch.

**Fix:** hook appends both fields (it can accept them as options or read the session's member);
no function change needed beyond what F6 touches anyway.

### F8 — Minor: Voice Dump modal close wastes a transcription
`src/components/archives/VoiceDumpModal.tsx:43-48` — closing mid-recording calls
`voice.stopRecording()` fire-and-forget: the result is discarded, but for a ≥30s recording that's a
real (paid) Whisper call for nothing. **Fix:** call `voice.cancelRecording()` instead.

### F9 — Minor: stuck-red-button edge case
`useVoiceInput.ts:241-250` — if the recorder is already inactive when stop is tapped (mic hardware
disconnected mid-recording), `recorder.stop()` throws inside the Promise executor → `stopRecording`
rejects → state stays 'recording' with a dead stream. **Fix:** guard `recorder.state` before
`stop()`, resolve with the chunks already collected, and always reach `resetRefs()` via
try/finally.

---

## Proposed build shape (pending founder approval)

- **One small build: VOICE-INPUT-REPAIR.** Single Sonnet worker, no migrations, one Edge Function
  redeploy (whisper-transcribe, for F6+F7).
- **Order:** F1 (hook reducer fix + vitest pin) → F3/F2 (shared consumer pattern) → F4 (error
  surfacing) → F6/F7 (auth + cost logging, redeploy) → F8/F9 (minor hardening) → F5 per founder
  decision.
- **Proof:** vitest pin on the extracted speech-result reducer (drift guard for F1); grep-style
  static pin that whisper-transcribe imports `authenticateRequest` (extends the
  safety-beta-gate.spec.ts pattern); live 401 probe for the unauthenticated case; `tsc -b` + lint;
  Convention #277 eyes-on tour of the touched surfaces (mic button states, status bars, denial
  toast) — actual audio capture verified manually by founder on her devices since CI has no mic.

## Founder decisions needed

1. **F5:** keep the free hybrid (fix duplication, Web Speech stays primary <30s) or go
   Whisper-primary everywhere (~$0.006/min)? Recommendation: keep hybrid — fix first, upgrade later
   if accuracy still disappoints.
2. **F6:** confirm whisper-transcribe auth closure rides in this build (it's a live open endpoint).
3. Approve dispatch of the build (or fold into another in-flight window).
