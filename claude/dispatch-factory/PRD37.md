# Pre-Dispatch Pack — PRD37: Family Feeds

> **Factory status:** synthesized → decisions-pending (4 decisions, batch 6)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD37. Priority: P5.
> Evidence: `claude/dispatch-factory/PRD3728-RECON.md` (shared with PRD28B).
> Sequencing per the locked addendum: **PRD-37 ships before PRD-28B.** 100% unbuilt; both stub
> routes exist (one is a dead duplicate); the demand-validation card has been collecting votes.

## Reconciliation rulings (newer wins — named explicitly)

1. **Data readiness is NOT a blocker (D-3728-2).** The Family tab needs zero homeschool data; the
   Portfolio tab already self-gates on `homeschool_subjects` having rows (PRD's own design). The
   build seeds Testworth fixture data for E2E. Founder starting to use Log Learning in the
   interim just makes her own portfolio richer on day one.
2. **`standards_links` ships as a bare `UUID[]`, no FK** — the FK constraint lands with PRD-28B's
   `education_standards` migration (forward-reference handling; validation deferred, documented).
3. **SendToGrid "Homework" destination REDIRECTS to `family_moments` when this ships (D-3728-3).**
   Convention #20 declares family_moments the learning-capture home; Convention #131 called the
   journal write "the first brick" — this build is the wall it was laid for. Existing
   journal rows stay untouched (history is history); new Guided homework sends create
   family_moments rows (text-only allowed, subject optional).
4. **Route cleanup (D-3728-4):** `/feeds` is canonical (sidebar-wired, demand card); the
   `/family-feed` PlaceholderPage duplicate retires with a redirect.
5. **Bulk Summary is a DEDICATED Edge Function** (`homeschool-bulk-summary`) per Convention #165
   (curriculum-parse precedent) — never dispatched through ai-parse/lila-chat. It is category-1
   (context_sources populated) → calls `assembleContext()` (Convention #248 invariant; verify the
   mode row's context_sources non-empty at build). HITM on every parsed entry; MAX 1-2 clarifying
   questions per the PRD — the Composition-convention bulk-AI-add mandate (#252) is satisfied by
   this design natively; no wizardization retrofit forced.
6. **Approval queue rides the Requests tab** (source='family_feed_post', additive — the
   reward_proposal precedent; Convention #146's 3-tab contract untouched).
7. **Play kids never post; mom posts on behalf** (role-adapted modal per PRD; consistent with
   Play-shell simplicity). Out of Nest members get the lightweight feed-first view at the /feed
   PWA entry; email notifications ride the existing notify-out-of-nest stub (its DNS/email gap is
   PRD-15's, tracked there — this build wires the call, not the mail server).
8. **Victory wiring:** family_moments Portfolio Highlights can fire `source='family_feed'`
   victories through the connector (value pre-seeded in 3 CHECKs) — celebration-only framing.
9. **Feature keys registered in this build's Slice 1** (the 7 family_feed_* keys — keys ship with
   their feature, not as a separate hygiene pass).

## Slice plan (model routing per `.claude/rules/model-routing.md`)

| Slice | Scope | Routing |
|---|---|---|
| 1 | Schema: 6 tables (+bare standards_links; 30-day voice TTL on moment_media via cron, Convention #246), enums, queue source value, 7 keys, RLS (visibility model: family-wide read scoped by feed_visibility; out-of-nest scoping; approval states) | Sonnet xhigh + rls-verifier |
| 2 | Feeds page: tab nav, Family Life Feed (cards, hearts, comments, member filter), Hub "Recent Moments" widget, route cleanup (+redirect) | Sonnet xhigh |
| 3 | Post creation: role-adapted modal (mom/dad/teen full; Guided simplified; Play mom-on-behalf), approval queue (opt-in per child, Requests tab card), moment_media upload | Sonnet xhigh |
| 4 | Portfolio tab: subject tags, time-logged display, Highlight badge + sub-filters, SendToGrid homework redirect (ruling 3), self-gate on homeschool_subjects | Sonnet xhigh |
| 5 | Bulk Summary: dedicated EF (Haiku parse per PRD; HITM review; ≤2 clarifying questions; per-child entries; optional homeschool_time_logs generation), voice input via existing whisper path | Sonnet xhigh |
| 6 | Out of Nest feed view (/feed PWA lightweight shell, out_of_nest_feed_settings, notify call), victory wiring, E2E (`tests/e2e/features/family-feeds.spec.ts`: role-adapted posting incl. Play-on-behalf, approval round trip, out-of-nest scoping probes — OoN NEVER sees non-shared moments, portfolio gate, homework-redirect round trip), verification, LiLa knowledge, FeatureGuide | Sonnet xhigh |
| Gates | Pre-build freshness audit + Checkpoint 5 | **Fable if available, else Opus** |

## Open founder decisions (batch 6)

| # | Decision | Recommendation |
|---|---|---|
| D-3728-2 | Proceed without waiting on real Log Learning data (fixtures for E2E; portfolio self-gates) | Yes |
| D-3728-3 | Guided "Homework" Send-To redirects to family_moments on ship (old journal rows untouched) | Yes — it was always the first brick of this wall |
| D-3728-4 | Retire /family-feed duplicate (redirect to /feeds) | Yes |
| D-3728-1 | Confirm locked order: PRD-37 → PRD-28B, with PRD-19 as 28B's prerequisite | Confirm — matches the addendum + the PRD19 pack ruling |

## Dependency edges
Before PRD28B (locked order). After PRD-19 is NOT required for 37 itself. Unblocks: PRD-28B
evidence sources, portfolio pipeline completion, Play mom-message adjacency, Out-of-Nest value.

---

## DISPATCH PROMPT (paste into a FRESH session — after batch-6 decisions resolve)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-37 — Family Feeds. Pack:
claude/dispatch-factory/PRD37.md (9 rulings + 6-slice plan). Evidence:
claude/dispatch-factory/PRD3728-RECON.md. Decisions RESOLVED per recommendations unless the
founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; re-read CLAUDE.md
conventions added since; re-verify recon refs (SendToGrid.tsx homework destination, the two stub
routes, mode row context_sources); next free migration number before every push.

READ FIRST: (1) prds/platform-complete/PRD-37-Family-Feeds.md — FULL, every word; (2)
prds/addenda/PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md — FULL; (3) the pack + recon (rulings
are LAW — esp. ruling 2's bare-UUID[] forward reference and ruling 3's redirect). Create
.claude/rules/current-builds/PRD-37-family-feeds.md (no YAML frontmatter), pre-build summary,
founder approval BEFORE code.

BUILD SLICES 1→6. HARD RULES: Out-of-Nest members NEVER see moments not explicitly shared to
their visibility scope (RLS + E2E probe — the load-bearing test); Play kids never author (mom
on behalf, attributed); approval queue is additive to the Requests tab (Convention #146
untouched); Bulk Summary = dedicated EF, category-1 assembleContext, HITM, ≤2 clarifying
questions; hearts/comments celebration-only (no counts-shaming, no punishment mechanics);
moment_media voice TTL cron via util.invoke_edge_function (#246, --no-verify-jwt); Lucide only;
zero hardcoded colors + density (myaim-frontend-design skill); Convention #257 dates; mobile
parity (#16) — /feeds is nav-registered in 3 shells already.

PROOF: the new spec per the pack list + tsc -b + lint + leak-pass pin (you add member-scoped
visibility surfaces). Ask before shared-fixture suites. NOTHING COMMITS until green + founder
eyes-on. Selective staging; founder confirms before push. Close-out: Checkpoint 5 zero-Missing,
live_schema regen, STUB_REGISTRY sweep (PRD-37 rows + Convention #131 first-brick graduation
note), retire the demand card (feature shipped), CLAUDE.md additions, LiLa knowledge,
FeatureGuide, archive build file.
```
