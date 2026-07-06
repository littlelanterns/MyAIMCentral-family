# PRD-14E + PRD-11B + MSWP — Combined Tail Recon Brief (Sonnet reader, 2026-07-04)

> Archived condensed with citations. Consumed by `PRD14E.md`, `PRD11B.md`, `MSWP.md`.

## PRD-14E (+14D Phase B)

Scope: 8 screens (TV hub rendering scale L127-158; remote nav L162-196; BI TV interaction; member quick access; simplified member shell w/ allow/block table L250-271; ambient idle slideshow/content-cycle L289-350; **Screen 7 Family Celebration TV — hard-depends on PRD-11B** L352-415; TV Settings L418-455). Hub Lock deferred (L457-473). Schema: only `family_hub_configs.tv_config` (EXISTS live, write-orphaned — `useUpdateFamilyHubConfig` L72-93 has no tvConfig param; no TV Settings UI anywhere). PWA manifest/splash/offline explicitly routed to PRD-33 by the PRD's own stubs table (L606-607).
**LIVE BUG:** `/hub/tv` renders BLANK — `HubTvStub` (App.tsx:77-86, route :117) uses `PlannedExpansionCard featureKey="family_hub_tv_route"` which is NOT in feature_expansion_registry → card returns null (PlannedExpansionCard:113-114). Violates Convention #31. One-line registry fix (amended into SMFX item 7).
14D Phase B status: slideshow BUILT (SlideshowOverlay, useSlideshowSlides, slideshow_slides 0 rows); countdowns built (emoji column live — **the D-SMFX-1 deferred product decision lands here**). Dead columns on families: hub_config, tablet_hub_config, tablet_hub_timeout — zero src/ references (addendum L73-76 says superseded/removable; also finally squares the stale STUB:78 "wired" row found by the PRD-22 recon).

## PRD-11B

Scope: 3 screens (Generation View w/ filters + 3 types Highlights/Detailed/Individual-Spotlight L62-98; Narrative Display L102-143; Archive L146-162); 4 AI modes incl. private_parenting_lens (L288-328); dad gated by `family_celebration` permission (L166-192); Hub PIN trigger (L200, 352-354); ONE table `family_victory_celebrations` (L207-236); 4 keys (L362-369); stubs incl. TTS/rhythm-integration/reports.
**Verdicts:** ZERO build — only a notification_type literal (types/messaging.ts:29). Godmother = explicit no-op (migration 100213:5-33, returns prd_11b_not_built). Table absent (live_schema DOMAIN_ORDER-missing). **Hub "Celebrate Together" button = disabled stub that doesn't even query victory counts** (HubVictoriesSummarySection.tsx, 59 lines — misses PRD-14D's own MVP line too). `victory_celebrations` (singular, PRD-11 personal tier) exists 0 rows w/ full DailyCelebration infra — DISTINCT feature. Keys unregistered. **STUB:184 "Family Celebration mode ✅ Wired" is FALSE** — needs correction.
Wiring: victories (13 rows) ready as the read source; godmother replacement = NEW superseding migration (never edit landed ones; guard-ledger pattern); #274 explicit-grant-only precedent fits `family_celebration`.

## MSWP (PRD-17B remainder) — item SHRINKS

- **Share-to-app: ALREADY WIRED** — manifest.json:10-19 share_target → /sweep; MindSweepCapture.tsx:122-129 handles title/text/url params. NOT a remainder. (iOS graceful-degradation branch per PRD edge case L698-699 missing — small.)
- **Offline/IndexedDB + dedicated /sweep manifest + SW registration: PRD-33 scope by the PRD-17B addendum's OWN assignment** (addendum :142-152). Not a 17B code gap.
- **Email intake: code-complete, DNS-blocked** — the PRD itself calls infrastructure setup "DevOps/deployment concern, not a PRD" (L727). Ops checklist for the founder, not a build.
- **Auto-sweep cron: exists, Convention-#246-patched in place** (migration 100093 header notes) — live cron.job_run_details verification still owed.
- **GENUINE GAP — MindSweep Digest (PRD-18 section #28, L651-663):** `mindsweep_settings.digest_morning/evening/weekly` toggles exist in the settings UI and persist — **no rendering component exists anywhere**; flipping them does nothing (misleading settings).
- **Approval learning:** data-collection wired (useMindSweep.ts:547-558) exactly per MVP scope; the learning/suggestion loop is the PRD's own "Phase 2" (L639-648) and stub-tabled → Post-MVP. **STUB:232 "✅ Wired" overclaims** (needs the same honesty note row 231 already carries).
- PRD header says "Not Started" — stale vs reality; record in the feature-decision file (prds/ read-only).
- Embedding-first classification repair (migration 100250) noted; re-verify holds for MindSweep tables at build. studio_queue.mindsweep_confidence/mindsweep_event_id: present per live_schema studio_queue listing.

## Founder questions (absorbed into packs)
/hub/tv registry fix now (→SMFX 7); 14E before/after 11B; drop dead families columns; PWA scope→PRD-33; countdown emoji fate; STUB 184/232 corrections; digest wanted now; cron live check; iOS branch priority.
