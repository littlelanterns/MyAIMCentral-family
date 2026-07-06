# Pre-Dispatch Pack — PRD33: Offline / PWA

> **Factory status:** synthesized → decisions-pending (3 decisions, batch 8)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD33. Priority: P6 — **PARKED
> (Post-MVP by the PRD's own status and the glossary; deps "All phases").** Shelf pack with an
> explicit dispatch trigger: post-launch, or when beta families' real usage demands offline.
> Evidence: full recon summarized inline (the brief was comprehensive; key verdicts preserved
> here — the build-time worker re-verifies everything per the freshness preamble).
> Current state: a minimal hand-written service worker (static-asset cache only, skips all
> Supabase calls — `public/sw.js`, registered in `main.tsx:12-15`), ONE generic manifest,
> text/link share-to-app already working via PRD-17B, and **zero IndexedDB / offline-queue /
> offline-indicator code anywhere**.

## Reconciliation rulings (the reason this pack exists — these survive until dispatch)

1. **THE #257 TENSION, PRE-RULED.** PRD-33's "each queued change includes a client-side
   timestamp" collides head-on with Convention #257 (no client-derived dates in DATE columns).
   Resolution recorded now: **client timestamps are ORDERING labels only** (last-write-wins
   comparison + queue sequencing); at sync-flush the server re-derives every DATE-column value
   via the CLIENT-DATE-REMEDIATION trigger pattern (`completed_at`-style source timestamps +
   `families.timezone`), with the flush carrying the client's wall-clock event time as the
   SOURCE TIMESTAMPTZ (so a task checked offline at 9pm Tuesday lands on Tuesday even if it
   syncs Wednesday) — the ±1-day override window already governs exactly this class. No client
   value ever writes a DATE column directly. The offline build EXTENDS the remediation
   architecture; it never bypasses it. (Same pattern answers the Convention #271 stale-
   obligation case: flagged-for-review completions reconcile against `get_member_day_obligations`
   at flush.)
2. **Manifests: static per-entry-point files + Vercel path rewrites** (no new server
   infrastructure); dynamic `<link>` swap only as a fallback for edge cases. The PRD's
   "server-side manifest endpoint" question is answered: not needed on this stack. Final
   verification at full-spec. (D-PRD33-1)
3. **The fifth entry point is `/feeds`** (PRD-37's pack canonicalized it; the PRD's `/feed` is
   corrected). TV manifest/splash assets land here, AFTER PRD-14E ships real TV content.
4. **Sync-target list gains an 8th row:** Shopping Mode check-offs (the Living-Shopping-List
   addendum's accumulated requirement the PRD's table predates).
5. **Share target boundary settled:** text/link sharing is DONE (PRD-17B's shipped scope);
   PRD-33 owns image/file sharing (multipart share_target + service-worker handling) and the
   dedicated `/sweep` manifest.
6. **Library: `idb`** (thin standard wrapper) rather than hand-rolled IndexedDB — one small,
   justified dependency; the hand-written-SW precedent stays for the worker itself. (D-PRD33-2)
7. **Sequencing gates:** after PRD-37 (feeds exist), PRD-14E (TV content exists),
   CLIENT-DATE-REMEDIATION verified holding (its triggers are ruling 1's foundation). Push
   stays PRD-15's side quest; LiLa stays online-only; Background Sync API stays post-MVP eval.

## Slice sketch (full slice plan at dispatch-time pre-build — this is a parked pack)
S1 offline foundation (idb queue, connectivity detection, offline banner + pending-count +
sync toast — the Conventions.md promise made real) → S2 sync engine (7+1 targets, ruling-1
flush semantics, conflict handling, voice-blob retry) → S3 manifests ×5 + install UX →
S4 image share-target + `/sweep` polish → S5 read-only cache layer (Hub/TV/Calendar/Dashboard)
→ S6 E2E (airplane-mode capture → flush probes; DATE-correctness probes are load-bearing) +
verification. Multi-session; Sonnet xhigh workers; Fable-else-Opus gates.

## Open founder decisions (batch 8)
| # | Decision | Recommendation |
|---|---|---|
| D-PRD33-0 | Confirm PARKED with the stated dispatch trigger | Confirm |
| D-PRD33-1 | Static per-entry-point manifests + Vercel rewrites | Yes |
| D-PRD33-2 | `idb` dependency for the queue | Yes |

## DISPATCH PROMPT (only after un-parking; a FULL pre-build audit is mandatory then)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-33 — Offline/PWA. This pack was produced 2026-07-04
and PARKED; assume it is STALE. MANDATORY: full pre-build audit per claude/PRE_BUILD_PROCESS.md
(fresh FULL read of prds/scale-monetize/PRD-33-Offline-PWA.md + the PRD-17B addendum :142-152 +
Living-Shopping-List addendum :587-591), then re-verify every current-state claim in
claude/dispatch-factory/PRD33.md against the live code (sw.js, manifest.json, MindSweepCapture
share handling, CLIENT-DATE trigger inventory).

NON-NEGOTIABLE ARCHITECTURE (pack ruling 1): client timestamps are ordering labels ONLY; every
DATE column is server-derived at sync-flush via the Convention #257 trigger pattern with the
client's event wall-clock as the source TIMESTAMPTZ; offline completions reconcile against
get_member_day_obligations (#271) at flush; the airplane-mode → next-day-sync → correct-DATE
E2E probe is the load-bearing test of the whole build. Other rulings: static per-entry
manifests + Vercel rewrites; /feeds is the fifth entry point; Shopping Mode is sync target 8;
image share-target is yours, text/link is shipped; idb for the queue; push stays out (PRD-15);
LiLa stays online-only. Standard process: current-builds file, founder Checkpoint 1, Playwright
proof, nothing commits until green + eyes-on, selective staging.
```
