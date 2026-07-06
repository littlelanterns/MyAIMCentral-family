# BookShelf Becoming — Build 1: NEVER LOSE MY PLACE (Pre-Build Draft)

> **Status: PRE-BUILD DRAFT — NOT ACTIVE.** Founder authorized prebuild preparation 2026-06-12;
> dispatch waits until KIDS-REWARDS-PAGE completes (founder sequencing ruling, same date).
> At dispatch: copy/move this into `.claude/rules/current-builds/bookshelf-becoming-build1.md`
> (no YAML frontmatter), and the dispatching session MUST complete Pre-Build Process Step 1 —
> a fresh full read of PRD-23 + the Session Addendum + Cross-PRD Impact Addendum — before code.
> This draft is built from the 2026-06-12 five-agent recon; treat its file:line refs as strong
> leads to re-verify, not gospel (code may move between now and dispatch).

**Authority chain:** `claude/feature-decisions/BookShelf-Reading-Experience-Recon.md` Part 6
(program plan + resolved gates) → PRD-23 + addenda → this file.

---

## Why this build exists (founder pain, verbatim intent)

"It retain where I was at in the book from visit to visit… Trying to find my place each time is
discouraging." Build 1 restores trust in the reading surface. Its section-anchor infrastructure
is load-bearing for Build 5 (citation jumps), Build 6 (slow-reading position), and search
jump-to-source in this build.

## Root causes being fixed (from recon)

1. Scroll restore races the data load — fires on near-empty DOM before extractions render
   (`src/hooks/useBookReadingPosition.ts:73-99` vs async `useExtractionData`).
2. Position saved as raw pixels; `sectionTitle` in the saved shape is always null. Pixels break
   on any content change.
3. `[data-scroll-container]` selector matches nothing in the codebase (hook line ~93); silently
   falls back to `document.scrollingElement`.
4. Go Deeper (`ExtractionBrowser.tsx:368`) and Continue Extraction (`:500`) full-`refetch()` dump
   the user to the top.
5. Hook uses `useFamilyMember()` not `useEffectiveMember()` (line ~28) — wrong member under
   View As.
6. ContinueBanner is sessionStorage-only — dies with the tab, never cross-device.
7. Browser-state sessionStorage keys not member-scoped (`useExtractionBrowser.ts:9`).

## Scope (every item ships; no MVP reductions)

### Core position system
1. **Section-anchored reading position.** Save `{sectionTitle, itemId?, withinSectionOffset?,
   activeTab, viewMode, updatedAt}` per book in `bookshelf_member_settings.reading_positions`
   (JSONB — additive shape change, old pixel entries read as fallback). Topmost-visible item
   tracked via IntersectionObserver. Restore by scrolling the anchor item/section into view
   AFTER `useExtractionData` reports loaded + items rendered (gate on data-ready, not mount).
2. **Effective-member correctness.** Hook switches to `useEffectiveMember()`; positions key to
   the data subject. View As reads/writes the viewed member's position.
3. **Refetch preservation.** Go Deeper / Continue Extraction capture the anchor before
   `refetch()` and re-anchor after.
4. **Multi-part position memory.** Position saved per part; crossing parts via Previous/Next
   (`ExtractionHeader.tsx:139-165`) keeps each part's own place.
5. **Member-scoped sessionStorage.** All `bookshelf-*` browser-state keys gain the member id
   (match ContinueBanner's existing pattern).

### Continue Reading, made durable
6. **DB-backed Continue Reading banner.** Replace sessionStorage source with
   `bookshelf_items.last_viewed_at` + saved position: "Continue *{title}* — {section}, {tab}".
   Deep link restores book + tab + anchor. Survives devices and days.
7. **Dashboard Continue Reading card.** Small card/section on Mom/Adult/Independent dashboards
   when a recent position exists (placement decision at dispatch — candidate: dashboard section
   like Morning Rhythm cards, or a widget). Same deep link.
8. **`last_viewed_at` freshness.** Update on meaningful engagement (currently written once on
   mount only — `ExtractionBrowser.tsx:135-137`).

### Visible place-keeping
9. **Progress indicator.** Sticky header shows current section + "Chapter X of Y" thin progress
   bar (chapters from `bookshelf_chapters` or section fallback, same source the sidebar uses).
10. **AudienceToggle persistence.** Selection persists per member (bookshelf_member_settings or
    preferences; URL param remains shareable override). Currently resets every reload
    (`ExtractionBrowser.tsx:89-100`).

### Search jump-to-source (B1)
11. **Result → exact spot.** SemanticSearchPanel result click lands ON the matching extraction:
    navigate with an anchor param (extraction id), scroll into view post-load, highlight pulse
    (theme tokens). Today it stops at book+tab (`SemanticSearchPanel.tsx:129`). Uses the same
    anchor/restore machinery as item 1.

### Friction + hygiene (bundled)
12. **D6** — Full view sections default EXPANDED (`ExtractionContent.tsx:26-27`).
13. **G1** — ChapterJumpOverlay FAB condition inverted (`ChapterJumpOverlay.tsx:78` — hides when
    ≥3 sections; should show).
14. **G2** — `hasYouthText` computed per active tab (`ExtractionBrowser.tsx:393-396`).
15. **G3** — Sidebar counts respect hearted/search filters (`ExtractionSidebar.tsx:60-100`).
16. **G4** — Apply-This sends get success/error toasts (`ApplyThisSheet.tsx:50-57` is
    fire-and-forget today).
17. **B7** — Library search no longer silently converts to a tag filter and clears the box
    (`BookShelfLibrary.tsx:127-128`) — keep query visible, show "filtering by tag" affordance.

## Explicitly OUT of scope (later builds)
Re-encounter engine, nugget-of-the-day, completion victories (Build 2); analog shelf/import
(Build 3); kid/teen surfaces (Build 4); streaming/citations/Ask-the-Author (Build 5); classics
modes, idea threads, ambient (Build 6); memorization (Build 7).

## Migrations
None expected. `reading_positions` JSONB shape extends in place (additive, with pixel-entry
fallback). AudienceToggle persistence target to confirm at dispatch — if
`bookshelf_member_settings` gains a column instead of riding an existing JSONB, that's one small
additive migration (next free number per current-builds ledger at dispatch time).

## Stubs planned
None.

## Conventions on the hot path
#257 (no client-side "today" writes — `last_viewed_at` is TIMESTAMPTZ, server `now()` fine),
#272 (no realtime hooks here, n/a), Visual Density + zero-hardcoded-colors for the progress bar
and highlight pulse, Buffet Principle (restore is automatic, never a prompt), celebration-only
(no "you abandoned this book" framing anywhere — Continue Reading is an invitation).

## Mom-UI Surfaces (Checkpoint 5 checklist seed)
- BookShelf library — Continue Reading banner (mom/adult/independent; modification)
- ExtractionBrowser — progress header, expanded sections, anchor restore (all reading shells;
  modification)
- Dashboard — Continue Reading card (mom/adult/independent; NEW)
- SemanticSearchPanel — jump-to-source + highlight (modification)
- Mobile parity: banner + progress header at 375px; ChapterJumpOverlay fix is mobile-only by
  nature

| Surface | Desktop ≥1024px | Tablet ~768px | Mobile ≤640px | Shells Tested | Evidence | Timestamp |
|---------|-----------------|---------------|---------------|---------------|----------|-----------|
| Library Continue banner | | | | | | |
| Reading view: anchor restore + progress header | | | | | | |
| Dashboard Continue card | | | | | | |
| Search jump-to-source + pulse | | | | | | |
| Go Deeper scroll preservation | | | | | | |

## Verification plan (Playwright is the proof of done)
`tests/e2e/features/bookshelf-never-lose-my-place.spec.ts`:
1. Open book → scroll to section N → leave → return → assert section N is in viewport AFTER
   content load (the race-condition pin — must fail against today's code).
2. Position survives sign-out/sign-in (DB-backed, not sessionStorage).
3. Continue banner deep link restores book + tab + section.
4. Go Deeper on a section → assert viewport stays on that section post-refetch.
5. Two members on one browser: positions and browser state never bleed (member-scoping pin).
6. View As: position reads/writes under the viewed member (effective-member pin).
7. Search result click → matching extraction in viewport with highlight.
8. AudienceToggle choice survives reload.
9. Multi-part book: each part remembers its own position.
Plus `tsc -b` clean, lint clean, and regression pins (leak-pass, permissions-wiring) green.

## Open design decisions at dispatch (small)
- Dashboard Continue card placement: dashboard section vs widget (recommend section card,
  Morning-Rhythm-style, self-hiding when nothing recent).
- Anchor URL param format (`&anchor=<extraction_id>` recommended; section-title fallback).
- AudienceToggle persistence home (recommend `bookshelf_member_settings` — it's per-member
  reading preference, same family as `library_sort`).
