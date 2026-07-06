# Pre-Dispatch Pack — BSB1: BookShelf Becoming Build 1 "Never Lose My Place"

> **Factory status:** synthesized → decisions-pending (3 small design decisions, recommendations below)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: BSB1. Priority: P1 (opportunistic track).
> **Dispatch gate:** founder sequencing ruling 2026-06-12 — dispatch WAITS until KIDS-REWARDS-PAGE
> completes (Slice 5 + close-out). Slices 1–4 are committed as of 2026-07-02 (`0fd05de`); Slice 5
> (Parent PrizeBoard + full verification) remains in flight.
>
> **Authority chain:** `claude/feature-decisions/BookShelf-Reading-Experience-Recon.md` Part 6 →
> `claude/feature-decisions/BookShelf-Becoming-Build1-Never-Lose-My-Place.md` (THE scope document —
> this pack does not duplicate it) → PRD-23 + Session Addendum + Cross-PRD Impact Addendum.

---

## What this pack adds to the existing draft

The pre-build draft is complete and founder-authorized (2026-06-12). This pack contributes:
(1) a freshness verification, (2) convention reconciliation against everything that postdated the
draft, (3) model routing, (4) the final dispatch prompt.

## 1. Freshness verification (2026-07-04)

`git log --since=2026-06-12` over `src/**/*ookshelf*`, `useBookReadingPosition.ts`,
`useExtractionBrowser.ts`, `src/components/bookshelf`, `supabase/functions/bookshelf-*`:
**ZERO commits.** Every commit since the draft date is KIDS-REWARDS (Slices 1–4) or
OPPORTUNITY-SURFACES — neither touches the BookShelf domain. The draft's file:line refs remain
strong leads (the build-time worker still re-verifies per the draft's own instruction).

## 2. Convention reconciliation (draft date → pack date)

Conventions/builds landed 2026-06-12 → 2026-07-04: #275 (FO command center), #276 (direct deploy /
task assignment), OPPORTUNITY-SURFACES (migration 100280), KIDS-REWARDS Slices 2–4 (migrations
100274–100279). **None conflict with Build 1 scope.** Points of contact checked:

- **Dashboard Continue Reading card** (draft item 7): the personal Dashboard's data-driven section
  system is unchanged by FO-COMMAND-CENTER (which restructured Family Overview, not the personal
  dashboard). A self-hiding section card remains the right shape. No mobile-nav parity obligation
  (no new top-level page).
- **`useEffectiveMember()`** (draft item 2): unchanged; still the correct View-As data-subject hook.
- **Convention #257** (client dates): draft already compliant (`last_viewed_at` is TIMESTAMPTZ,
  server `now()`). NOTE: CLIENT-DATE-REMEDIATION is dispatched in parallel and may rewrite
  Convention #257's text — the build worker's freshness check must re-read #257 at build time; the
  contract (no client-derived dates) will only get stricter, which Build 1 already satisfies.
- **Migration numbering:** none expected; if AudienceToggle persistence needs a column, take the
  next free number at creation time and re-check before push (KIDS-REWARDS S5 + CLIENT-DATE are
  landing migrations in parallel; next free was 100281 as of 2026-07-03 — will have moved).

## 3. Model routing (per `.claude/rules/model-routing.md`)

- One implementation worker: **Sonnet 5, effort xhigh** (single-worker build; UI + hooks + one spec).
- Post-build verification (Checkpoint 5): **Fable if available, else Opus** — this build runs
  post-2026-07-07.
- Playwright is the proof of done (9-test spec in the draft); no model tokens spent judging what
  the spec proves.

## 4. Open design decisions (D-BSB1-1..3 — small; recommendations carried from the draft)

| # | Decision | Recommendation |
|---|---|---|
| D-BSB1-1 | Dashboard Continue card: section vs widget | Section card, Morning-Rhythm-style, self-hiding when nothing recent |
| D-BSB1-2 | Anchor URL param format | `&anchor=<extraction_id>`, section-title fallback |
| D-BSB1-3 | AudienceToggle persistence home | `bookshelf_member_settings` (per-member reading pref, same family as `library_sort`) |

If the founder approves this pack without comment, the recommendations are the rulings and the
dispatch prompt below stands as written.

---

## 5. DISPATCH PROMPT (paste into a FRESH session — only after KIDS-REWARDS-PAGE closes out)

```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for BOOKSHELF-BECOMING BUILD 1 — "Never Lose My Place."
Founder-authorized 2026-06-12; pre-dispatch pack finalized 2026-07-04. All design decisions are
resolved (D-BSB1-1: dashboard section card, self-hiding; D-BSB1-2: &anchor=<extraction_id> with
section-title fallback; D-BSB1-3: AudienceToggle persists in bookshelf_member_settings).

FRESHNESS PREAMBLE (do this before anything else): this pack was produced 2026-07-04. Run
`git log --oneline --since=2026-07-04` and re-read CLAUDE.md for conventions added since then.
Re-verify every file:line reference in the scope document before relying on it — especially
Convention #257's current text (CLIENT-DATE-REMEDIATION may have rewritten it) and the next free
migration number IF you end up needing one.

READ FIRST (in order):
1. claude/feature-decisions/BookShelf-Becoming-Build1-Never-Lose-My-Place.md — THE scope document.
   Every numbered item (1–17) ships; no MVP reductions. Copy it into
   .claude/rules/current-builds/bookshelf-becoming-build1.md (no YAML frontmatter) as the active
   build file, updating file:line refs you re-verified.
2. claude/feature-decisions/BookShelf-Reading-Experience-Recon.md — Parts 1, 2, 6 (root causes +
   current-state map + program plan).
3. PRE-BUILD PROCESS STEP 1 IS MANDATORY: a fresh FULL read of prds/ai-vault/PRD-23-BookShelf.md +
   prds/addenda/PRD-23-Session-Addendum.md + prds/addenda/PRD-23-Cross-PRD-Impact-Addendum.md
   before any code. The recon does not substitute for this.

BUILD: the 17-item scope in the scope document — section-anchored reading position
(IntersectionObserver anchor, restore gated on data-ready), effective-member correctness,
Go-Deeper/Continue-Extraction refetch preservation, multi-part position memory, member-scoped
sessionStorage, DB-backed Continue Reading banner + dashboard Continue Reading section card
(self-hiding), last_viewed_at freshness, progress header ("Chapter X of Y"), AudienceToggle
persistence, search jump-to-source with highlight pulse (theme tokens only), and the six bundled
friction/hygiene fixes (D6, G1, G2, G3, G4, B7).

CONVENTIONS ON THE HOT PATH: #257 (no client-derived dates), zero hardcoded colors + density
system (myaim-frontend-design skill for any UI work), Buffet Principle (restore is automatic,
never a prompt), celebration-only framing (Continue Reading is an invitation, never "you
abandoned this book").

PROOF (Playwright is the only proof of done): write
tests/e2e/features/bookshelf-never-lose-my-place.spec.ts per the 9-test plan in the scope
document — test 1 (anchor restore after data load) MUST fail against pre-build code before your
fix makes it pass. Plus tsc -b clean, lint clean. Ask the founder before running any full
regression suite (other sessions may share Testworth fixtures); the standard pins to re-run:
leak-pass, permissions-wiring.

PROCESS: fill the Mom-UI Verification table in the active build file (surfaces are pre-listed in
the scope doc); Post-Build Verification table with every scope item Wired/Stubbed/Missing — zero
Missing, zero stubs planned. NOTHING COMMITS until the suite is green AND founder eyes-on clears;
selective staging (this build's files only), founder confirms before push.
```
