# Pre-Dispatch Pack — PRD14E: Family Hub TV Mode (+ PRD-14D Phase B Residuals)

> **Factory status:** synthesized → decisions-pending (3 decisions, batch 8)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD14E. Priority: P5.
> Evidence: `claude/dispatch-factory/TAIL-RECON.md` (14E section).
> Headline: `/hub/tv` renders a BLANK PAGE today (the roadmap card's registry entry was never
> added — the one-line fix rides SMFX item 7). The real build is smaller than the inventory
> suggested: 14D's slideshow is already built; the schema needs only the (already-present,
> write-orphaned) `tv_config` column wired; PWA manifest/splash/offline route to PRD-33 per the
> PRD's own stub table.

## Rulings

1. **Dispatch AFTER PRD-11B** (D-11B-1): its Screen 7 (Family Celebration TV display) becomes a
   clean dependency instead of a double-block. If 11B somehow lags, 14E may ship without
   Screen 7 as an explicit fast-follow — but the recommended order makes that moot.
2. **PWA scope routes to PRD-33** (D-14E-1): TV manifest icons/splash/orientation + offline
   service-worker cache are PRD-33 territory per 14E's own stubs (L606-607). 14E ships the
   route, rendering scale, remote/focus navigation, member quick access + simplified member
   shell (allow/block table L250-271), ambient idle mode (slideshow-frame + content-cycle,
   reusing the BUILT SlideshowOverlay), and TV Settings — on the existing single manifest.
3. **Dead `families` columns drop** (D-14E-2): `hub_config`, `tablet_hub_config`,
   `tablet_hub_timeout` — zero code references, addendum-sanctioned as superseded. One
   migration; also finally closes the stale STUB:78 "wired" claim honestly (the PRD-22 recon
   flagged it too — whichever build lands first drops them; coordinate).
4. **Countdown emoji → platform-asset icon picker** (D-14E-3, the deferred D-SMFX-1 decision):
   the `countdowns.emoji` column's user-supplied emoji violates the platform-wide no-emoji rule
   in spirit. Countdown create/edit gains the asset/icon picker (RewardImagePicker-class reuse);
   existing emoji values render through a migration-mapped default icon; the column deprecates.
5. **`tv_config` gets its write path**: TV Settings group in Hub Settings (phone/tablet-side per
   Screen 8) + `useUpdateFamilyHubConfig` gains the param. Hub Lock stays deferred per the PRD.
6. Convention #16 parity: N/A for the TV surface by design (no sidebar; the /hub precedent) —
   ratified in the build file.

## Slice plan (single Sonnet worker)
| Slice | Scope | Routing |
|---|---|---|
| 1 | `/hub/tv` real surface: TV-scale rendering wrapper over FamilyHub content, focus/remote navigation model, member quick access + simplified member shell per the allow/block table | Sonnet xhigh |
| 2 | Ambient idle mode (slideshow-frame + content-cycle on the built SlideshowOverlay), Family BI TV interaction, Screen 7 celebration display (post-11B), TV Settings + tv_config write path | Sonnet xhigh |
| 3 | Migration (drop dead families columns; countdown icon migration per ruling 4) + countdown picker UI + E2E (`tests/e2e/features/hub-tv-mode.spec.ts`: route renders at TV scale, remote-nav focus traversal, member shell block-table probes, idle-mode cycle, settings round trip) + verification | Sonnet xhigh |
| Gates | Checkpoint 5 | **Fable if available, else Opus** |

## Open founder decisions (batch 8)
| # | Decision | Recommendation |
|---|---|---|
| D-14E-1 | PWA/manifest/offline scope routes to PRD-33 (14E ships on the shared manifest) | Yes — the PRD's own stub table already says so |
| D-14E-2 | Drop the three dead families columns (confirm nothing external reads them) | Yes |
| D-14E-3 | Countdown emoji column → asset/icon picker + deprecation (the deferred SMFX decision) | Yes — one emoji rule, no exceptions |

## DISPATCH PROMPT (paste into a FRESH session — after batch-8 decisions + PRD-11B close-out)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-14E — Family Hub TV Mode. Pack:
claude/dispatch-factory/PRD14E.md (6 rulings). Evidence: claude/dispatch-factory/TAIL-RECON.md.
Decisions RESOLVED per recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; confirm PRD-11B
landed (Screen 7 dependency — if not, ship without it as an explicit fast-follow and say so);
confirm SMFX item 7 landed (the /hub/tv registry fix — you replace that stub with the real
surface either way); check whether PRD-22's build already dropped the dead families columns
(coordinate — one dropper only); next free migration number before every push.

READ FIRST: (1) prds/dashboards/PRD-14E-Family-Hub-TV-Mode.md — FULL, every word; (2)
prds/dashboards/PRD-14D-Family-Hub.md Screens 6-7 + prds/addenda/PRD-14D-Cross-PRD-Impact-
Addendum.md; (3) the pack + recon. Create .claude/rules/current-builds/PRD-14E-tv-mode.md (no
YAML frontmatter), pre-build summary, founder approval BEFORE code.

HARD RULES: reuse the BUILT SlideshowOverlay/useSlideshowSlides for ambient mode (never fork);
the member-shell allow/block table (L250-271) is law — E2E-probe the blocks; TV surface has no
sidebar (parity N/A ratified); Hub Lock stays deferred; PWA manifest work is OUT (PRD-33);
countdown migration maps existing emoji to icons non-destructively (values preserved in a
legacy column or metadata until removal); Convention #257 dates; zero hardcoded colors +
density; Lucide only.

PROOF: the new spec + tsc -b + lint. Ask before shared-fixture suites. NOTHING COMMITS until
green + founder eyes-on (eyes-on: on the actual family TV — readability at couch distance is
the acceptance test the PRD's rendering-scale section exists for). Selective staging; founder
confirms before push. Close-out: Checkpoint 5, STUB:78 honest closure, live_schema regen,
archive build file.
```
