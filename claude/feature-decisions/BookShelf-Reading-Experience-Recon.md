# BookShelf Reading Experience — Recon (2026-06-12)

> **Status:** RECON ONLY — no decisions made, no build authorized. Founder requested a survey of
> ways to improve the reading experience, semantic search, discussions, reading-position retention,
> and overall excitement — plus ways to make BookShelf more enticing for Independent (teen) and
> Guided (kid) members.
> Sources: live code recon (5 parallel agents), PRD-23 + Session Addendum + Cross-PRD Impact
> Addendum, STUB_REGISTRY.md, WIRING_STATUS.md. Every finding cites file:line.

---

## Part 1 — Why Tenise loses her place (root-cause diagnosis)

Reading-position persistence EXISTS (`useBookReadingPosition`, built 2026-05-01, saves scroll + tab
to `bookshelf_member_settings.reading_positions`) but it is broken in practice for four
compounding reasons:

1. **Restore races the data load.** `src/hooks/useBookReadingPosition.ts:73-99` restores scroll via
   `requestAnimationFrame` once on mount — but `useExtractionData` is still fetching. The scroll
   fires against a nearly-empty page; then hundreds of extraction items render and the page height
   explodes, leaving her somewhere random. This is the primary cause.
2. **Position is stored as raw pixels, not a section anchor.** The `sectionTitle` field in the saved
   shape exists but is ALWAYS null (`useBookReadingPosition.ts` — never populated). Pixel offsets
   are inherently fragile: any content change (Go Deeper, hearts filter, abridged toggle, study
   guide text swap) invalidates the number.
3. **The scroll-container selector points at nothing.** Line 93 looks for
   `[data-scroll-container]` which doesn't exist anywhere in the codebase; it silently falls back to
   `document.scrollingElement`. Works by accident, breaks the moment layout changes.
4. **Scroll resets on every refetch.** Go Deeper (`ExtractionBrowser.tsx:368`) and Continue
   Extraction (`:500`) call a full `refetch()` that re-renders everything and dumps her at the top.

Secondary issues:
- **View As / effective-member bug:** the hook uses `useFamilyMember()` not `useEffectiveMember()`
  (`useBookReadingPosition.ts:28`) — positions save under the wrong member during View As.
- **ContinueBanner is sessionStorage-only** (`ContinueBanner.tsx`) — closes with the tab, never
  survives across devices or days. The DB has everything needed (`last_viewed_at` +
  `reading_positions`) to make it durable.
- **Browser state (tab/view/abridged) sessionStorage keys aren't member-scoped**
  (`useExtractionBrowser.ts:9`) — family members on a shared device inherit each other's state.
- **Only one surface has persistence at all.** StudyGuideModal, discussions, and search results have
  zero position memory.

### Fix shape (the "never lose my place" package)
- **Anchor to section, not pixels:** save `{sectionTitle, itemId?}` of the topmost visible item
  (IntersectionObserver), restore by `scrollIntoView` AFTER `useExtractionData` reports loaded.
  Pixel offset becomes a within-section refinement only.
- Gate restore on data-ready (`isLoading === false` + items rendered), not on mount.
- Preserve scroll across Go Deeper / Continue Extraction refetches (capture anchor → refetch →
  re-anchor).
- Switch hook to `useEffectiveMember()`; member-scope the sessionStorage keys.
- Promote ContinueBanner to DB-backed: "Continue *The Lion, the Witch and the Wardrobe* — Chapter 7,
  Insights" with a real deep-link that restores tab + section. Show it on the dashboard too, not
  just the library page (could be a small "Continue Reading" card/widget).
- Persist the AudienceToggle choice (currently resets every reload — `ExtractionBrowser.tsx:89-100`).
- Add a visible "where I am" cue: section name in the sticky header + a thin progress bar
  ("Chapter 7 of 12") so place-keeping is felt, not just mechanical.

---

## Part 2 — Current-state map (one paragraph)

BookShelf is an extraction-and-annotation reader, not a full-text reader: library
(`BookShelfLibrary`) → `ExtractionBrowser` → `ExtractionContent` rendering 5 extraction types
(summaries / insights / declarations / action steps / questions) in 3 view modes (Tabs / Chapters /
Notes) with abridged/full, hearting, notes, Apply-This routing (8 wired destinations), Go Deeper,
study guides (teen/kid text via AudienceToggle), semantic search (`bookshelf-search` → platform
RPCs, threshold 0.3), and discussions (`bookshelf-discuss`, Sonnet, 5 discussion types × 5
audiences, 1-10 books). Full book text (`text_content`) is never rendered. ~100-500 items per type
render to DOM with no virtualization. There is **zero celebration/delight anywhere in BookShelf** —
no victory on finishing a book, no streaks, no milestone, nothing fires `fireDeed`.

---

## Part 3 — Improvement candidates by goal

Effort: S = small (hours), M = medium (a session), L = large (own build).

### A. Never lose my place
| # | Idea | Effort | Notes |
|---|------|--------|-------|
| A1 | Section-anchored position + restore-after-load (full fix package above) | M | The headline fix. Kills the #1 discouragement. |
| A2 | DB-backed Continue Reading (banner + dashboard card) with deep-link restore | S-M | Data already exists; currently sessionStorage-only. |
| A3 | Preserve scroll across Go Deeper / Continue Extraction refetch | S | `ExtractionBrowser.tsx:368,500` |
| A4 | Persist AudienceToggle + member-scope browser sessionStorage | S | Two known bugs. |
| A5 | Reading progress indicator (chapter X of Y, thin bar in sticky header) | S | Makes place-keeping *visible*. Also feeds gamification later. |
| A6 | Per-part position memory for multi-part books (currently resets crossing parts) | S | `ExtractionHeader.tsx:139-165` |

### B. Semantic search
| # | Idea | Effort | Notes |
|---|------|--------|-------|
| B1 | **Jump-to-source**: search result click lands ON the matching extraction (scroll + highlight pulse), not just book+tab | M | Today: `SemanticSearchPanel.tsx:129` navigates to book+tab only. Result already carries the extraction id — wire it through as an anchor (pairs perfectly with A1's anchor infrastructure). |
| B2 | Search filters: by type (insight/declaration/…), hearted-only, by collection | S-M | RPCs return the fields; filter client-side or add RPC params. |
| B3 | "Ask my library" entry on the dashboard / LiLa drawer — search without entering BookShelf first | M | The library is the moat; surface it where mom already is. |
| B4 | Result → one-tap actions (heart it, Apply This, start a discussion *about this result*) | S-M | Currently results are read-only. |
| B5 | Recent searches → saved searches ("topics I keep coming back to") | S | `bookshelf_search_history` already records everything. |
| B6 | Embedding staleness fix: editing extraction text doesn't re-queue its embedding | S | Hygiene; search slowly drifts from edited content. |
| B7 | Fix "search converts to tag filter and clears the box" confusion | S | `BookShelfLibrary.tsx:127-128` |

### C. Discussions
| # | Idea | Effort | Notes |
|---|------|--------|-------|
| C1 | **Streaming responses** | M | Buffered today (`bookshelf-discuss:675`); 10-20s of dead air per turn kills conversational feel. lila-chat already streams — same pattern. |
| C2 | **Discuss-this-nugget**: a "Talk about this" chip on every extraction item that opens a discussion seeded with that exact extraction | M | The single biggest "dive into the nuggets" enabler. Entry points exist only at book level today. |
| C3 | Citations: AI answers reference chapter/section, tappable to jump there | M | Context already carries section_title; populate `bookshelf_discussion_messages.metadata` (exists, never used) with source refs and render chips. |
| C4 | Raise the 4-turn history window (`bookshelf-discuss:579`) — long conversations forget themselves | S | Sliding window or summary-of-earlier-turns. |
| C5 | Discussion → Apply This parity: route an AI answer's nugget to Stars/Tasks/Journal from inside the chat | M | Action chips exist for generate_* modes; per-message routing doesn't. |
| C6 | Resume/continue past discussions more prominently (history panel exists but buried) | S | "Pick up your conversation about *Atomic Habits*" card. |
| C7 | Verify "Give Me Examples" / "Make It Kid-Friendly" chips actually fire (PRD-23 spec'd; possibly display-only) | S | Flagged by PRD-gap recon. |

### D. Excitement / "make me want to dive in"
| # | Idea | Effort | Notes |
|---|------|--------|-------|
| D1 | **Book completion → Victory + deed firing** | M | PRD-23 line 1224 spec'd it, PRD-11 dependency long since built. Finish-line definition: all sections extracted+viewed, or mom marks "finished." Fires `fireDeed` → existing connector handles victory/points/contracts. Zero new reward infra needed. |
| D2 | **"Nugget of the day"** — daily resurfaced hearted/key-point extraction on the dashboard (widget or card), date-seeded like Morning Insight | M | `resurfaced_item_ids` column already exists and is DEAD (`bookshelf_member_settings`); PRD-23 Session Addendum §9 spec'd exactly this with 3-day dedup. The wisdom she's already hearted comes back to her. |
| D3 | Reading streak ("3 days in a row in your books") via deed_firings + compute_streak | M | Connector layer already has streak IF-patterns; celebration-only framing. |
| D4 | Library cards that feel alive: progress ring, "N hearted", last-visited, "new since last visit" | S-M | Card today shows only icon/title/status. `last_viewed_at` + counts are queryable. |
| D5 | Heart milestone micro-celebrations (10th heart in a book → SparkleOverlay-class moment, shell-appropriate) | S | Heart already has a pulse animation; one step further. |
| D6 | Default-expanded sections in Full view (currently open a book → see headers, no content) | S | `ExtractionContent.tsx:26-27` — pure friction. |
| D7 | Rhythms "From Your BookShelf" card — finish the deferred PRD-18 integration | M | Data prepared since the PRD-23 build; Morning Insight half-covers it but the dedicated card never landed. |
| D8 | Book club / family read: shared collection + standing family discussion + Content Corner link | L | Post-MVP flavor; note for roadmap. |

### E. Independent (teen) enticement
| # | Idea | Effort | Notes |
|---|------|--------|-------|
| E1 | Teen-default audience: Independent shell opens books with AudienceToggle pre-set to Teen (`independent_text`) | S | Toggle exists; just default by shell + persist (A4). |
| E2 | "My Reading" surface on the Independent dashboard: assigned/shared books with progress + continue link | M | `bookshelf_shares` + assignment-as-task already wired; the teen-facing aggregation view doesn't exist. |
| E3 | School-mode framing: Questions tab → "discussion questions for my essay," export study guide as homework artifact, link into `homeschool_time_logs` (reading time counts) | M | Feature-discovery already has `bookshelf_for_school`; reading time → homework hours is a natural PRD-28 tie-in. |
| E4 | Teen-audience discussions by default (audience='teen' pre-selected) + "talk about chapter X" entry | S | Audience plumbing fully exists. |
| E5 | Reading List sequential collections (Studio `ex_reading_list` template) linked to actual BookShelf books — finish a book, advance the list, mastery/practice mechanics apply | M | Both halves exist (Build J sequential mastery + BookShelf); the bridge doesn't. Teens get visible progression. |
| E6 | Book completion → gamification for teens (Convention #220: gamification opt-in across all shells) | S on top of D1 | Same deed, lighter presentation. |

### F. Guided (kid) enticement
| # | Idea | Effort | Notes |
|---|------|--------|-------|
| F1 | **Guided Dashboard "Reading" section** (PRD-25 stub, never built): mom-shared/assigned books as big friendly cards, kid-audience text only | M-L | The kid entry point simply doesn't exist today — kids have no path into BookShelf at all. |
| F2 | Kid reading mode: card-deck presentation — ONE nugget per screen (guided_text), big type, Next/Back, TTS via existing Reading Support pattern (Convention #129) | M | Reuses study-guide text; transforms "wall of extractions" into a paced, kid-sized experience. |
| F3 | Story-time questions: book's kid-audience Questions as a Guided worksheet (guided_form pipeline) or Write-drawer prompts | M | `guided_form` infrastructure exists; questions already generated per book. |
| F4 | Reading nuggets feed creatures: completing a kid reading session fires the gamification pipeline (sticker book) | S on top of D1 | "Read 3 nuggets → creature roll" — mom-configurable, celebration-only. |
| F5 | Family read-aloud companion: hub/TV-friendly view of one section's kid summaries for family devotional/read-aloud time | L | Roadmap flavor; pairs with Family Hub. |
| F6 | Study-guide generation pulls the kid's Archives context (interests, learning style) per original PRD-23 spec §5 — current rework may not | S-M | Verify first; spec'd personalization ("references the child's actual interests") possibly lost in the Sonnet rework. |

### G. Hygiene / small fixes (bundle into any session)
| # | Fix | File |
|---|-----|------|
| G1 | ChapterJumpOverlay FAB hidden when ≥3 sections — backwards condition | `ChapterJumpOverlay.tsx:78` |
| G2 | hasYouthText ignores active tab (toggle shows, appears dead) | `ExtractionBrowser.tsx:393-396` |
| G3 | Sidebar counts don't respect hearted/search filter | `ExtractionSidebar.tsx:60-100` |
| G4 | No success/error feedback on Apply This sends (fire-and-forget) | `ApplyThisSheet.tsx:50-57` |
| G5 | No virtualization — 500+ items render at once (perf on tablets) | `ExtractionContent.tsx` |
| G6 | "Search inside all books" button on empty library state is disabled/dead | `BookShelfLibrary.tsx:552` |
| G7 | Phase 1c old-table cleanup (58K-row `bookshelf_chunks` etc.) — soak long past | WIRING_STATUS known issue |
| G8 | `library_group_mode` setting is dead (schema + type, no UI) | `types/bookshelf.ts` |

---

## Part 5 — Formation: getting the content INTO the person (added 2026-06-12, second pass)

> Founder follow-up: "not just people get through the content, but the content get into the
> person… make becoming who we want, or who the books describe, a part of us… more joy, more ease
> and accessibility, making deep classic works easier to understand, digest, and become… inspire
> greater human thinking and observation from myself and my kids."

### The core diagnosis

BookShelf today is a one-way pipe: read → heart → (maybe) send somewhere → never see it again.
Formation requires a **loop**: encounter → resonate → restate in your own words → practice →
notice yourself changing → re-encounter. The app already owns world-class machinery for four of
those six steps — Best Intentions (practice + tally), Victory Recorder (noticing), Journal +
reflection prompts (restating), Rhythms (re-encounter moments) — and BookShelf feeds **none of
them as a designed flow**. Every idea below is loop-closing, mostly with existing infrastructure.

Underlying mechanisms (internal framing only — Convention: no external attribution in UI):
*generation effect* (restating in your own words encodes far deeper than re-reading), *spaced
retrieval* (re-encountering at widening intervals beats massed review), *implementation
intentions* (Best Intentions IS this pattern), *narration* (telling back what you heard — the
classical homeschool practice), and *commonplace books* (the centuries-old practice of copying
passages that struck you — `journal_entries.entry_type='commonplace'` ALREADY EXISTS, Convention
#20, and nothing feeds it).

### 5.1 The Becoming Flow — "Make this part of me" (M-L)
One guided flow on any extraction, beyond Apply-This's raw routing grid. Steps (each skippable,
Buffet Principle): (1) *Say it back* — restate the nugget in your own words; LiLa warmly reflects,
HITM. Your paraphrase becomes the canonical version that resurfaces — you re-meet YOUR words, not
the author's. (2) *Choose a becoming* — one-tap convert to a Declaration→Guiding Star (identity),
a Best Intention (practice with tally), or a Task (single action). The declaration style variants
that already exist (`choosing_committing`, `claiming_stepping_into`…) are literally identity-
formation grammar — surface them as choices ("I am becoming…" vs "I choose…"). (3) *Set the
re-encounter* — "bring this back to me" (see 5.2). Infrastructure: all destinations wired; the
flow + paraphrase capture + LiLa coaching step are new.

### 5.2 Re-encounter engine — spaced resurfacing with warmth (M)
Replace random nugget-of-the-day with a spacing schedule per hearted/declared item: resurface at
~3 days, ~1 week, ~3 weeks, ~2 months, with a reflective frame — "Three weeks ago this stopped you
in your tracks. Is it living in you yet?" + quick responses (Still working on it / It's becoming
mine / Release it). Surfaces: dashboard card, Morning/Evening Rhythm section (rhythm section
registry exists), notification (category exists). "Release it" honors the celebration-only ethic —
no nagging, ideas are allowed to be done with you. Infrastructure: `resurfaced_item_ids` (dead
column, exactly this purpose), rhythm sections, date-seeded PRNG patterns. The spacing intervals
are the only new logic.

### 5.3 Narration & the Analog Shelf (EXPANDED 2026-06-12 per founder)
**(a) Telling it back (kids' crown jewel).** After a kid reads/hears a nugget (card-deck mode,
F2): "Tell it back in your own words." Voice input → `whisper-transcribe` (wired) → saved as
journal entry + optionally `family_moments` (PRD-37) → homeschool portfolio evidence (PRD-28B
pipeline). LiLa responds with warm noticing ("You remembered the part about the ants — that
detail matters"), never grading. For teens: written or voice, framed as "what would you tell a
friend this chapter said?"

**(b) The Analog Shelf — books you hold in your hands (founder expansion).** Most of a family's
reading life is paper. Bring it in:
- **Off-shelf book records**: add a book to the library with NO file — just title/author (+
  optional cover). It sits on the same shelf with a "physical book" treatment. `bookshelf_items`
  row with a new analog file_type; no chunks, no platform extraction.
- **"Record what I'm reading"**: from any analog book (or mid-walk, mid-couch), tap the mic and
  narrate what you just read — voice → transcription → saved as a NARRATION on that book. Works
  for kids (telling back) and adults (processing aloud). Lightweight capture-first UX, MindSweep
  spirit.
- **Highlight import**: upload/paste Kindle highlights (My Clippings.txt parses deterministically
  — no AI needed; freeform paste goes through a Bulk-AI-Add parse per Convention #252). EACH
  highlight becomes a **personal extraction** on that book — heartable, notable, searchable,
  Apply-This-able, resurfaceable by the re-encounter engine, exactly like AI extractions.
- **Quotes & poetry capture**: same pipeline for memorable quotes, poems, scripture — typed,
  pasted, voiced, or photographed (OCR path exists via MindSweep scan). Attribution fields
  (source/author) so a quote can live without a book record at all.
- **Discussions about off-shelf books**: start a discussion on a book with no uploaded text. LiLa
  grounds in (1) the person's own narrations + imported highlights as primary context and (2)
  model knowledge of the work, clearly framed as such. The person's analog reading gets the same
  conversation partner the digital shelf has.
- **Commonplace routing**: every narration, highlight, and quote offers "copy to my commonplace
  book" (5.4) — the analog reading life and the formation loop become one system.

**Architecture note (must resolve at pre-build):** personal extractions (highlights, narrations,
quotes) are FAMILY-PRIVATE and must NOT enter `platform_intelligence.book_extractions` (the
shared platform library). They need a family-scoped extraction store with embeddings so semantic
search + re-encounter cover them. Candidates: revive the legacy per-family extraction tables, or
a new `bookshelf_personal_extractions` table. Also verify where the existing
`handleCreateCustomInsight` path writes today — if it writes platform-level, that's a privacy
finding to fix in the same build.

### 5.4 Commonplace book revival (S-M)
`entry_type='commonplace'` exists in the journal with zero feeders. Add "Copy to my commonplace
book" on every extraction — but make the user TYPE (or voice) the passage rather than auto-copy;
the act of transcription is the encoding. Journal gains a beautiful commonplace view (chronological
passages with book/chapter attribution). Kid version feeds portfolio. Near-zero schema work.

### 5.5 "Who I'm Becoming" view (M)
A single surface gathering: declarations sent to Guiding Stars (grouped by `value_name` — courage,
patience…), each with its practice evidence beside it — Best Intention tallies, victories, journal
mentions. The page answers "is the reading changing me?" with the user's own recorded life. Mostly
a read-model over existing tables (`guiding_stars` rows carry `source='bookshelf'` +
`source_reference_id` already). Teen variant = identity-forward framing; this is ALSO the natural
home for before/after book reflections (5.11).

### 5.6 Ask the Author + Interest Bridges (REIMAGINED 2026-06-12 per founder — supersedes the
Board of Directors framing, which the founder declined as too obscure a vehicle)

**(a) Ask the Author.** A direct question form, anywhere in BookShelf or LiLa: *"What would
Swedenborg say about forgiveness?"* / *"What would Emerson say about my son quitting piano?"* The
answer is grounded in the author's ACTUAL WORKS: author-scoped semantic search across every book
by that author in the library (`book_library.author` + embeddings already support this), pulling
extracts and passages from one or several works, quoted and cited. The model's broader knowledge
of the author supplements — clearly framed ("From his works on your shelf… / More broadly, he
taught…"). No personas, no seats, no theater — just the author's voice through his own words.

**(b) Interest Bridges.** After (or alongside) any answer or nugget, LiLa offers: *"Want to see
how this relates to soccer? Manga art? Down syndrome?"* — the bridge topics pulled from that
member's OWN Archives (Interests & Hobbies system folder, self_knowledge, current activities) and
recent life context. Tap one → the idea re-explained inside a sphere the person already loves and
understands. This is how new/deep knowledge anchors to existing knowledge — the core of real
learning, and personal in a way no generic explainer can be. Haiku-class for the bridge
generation; Archives context assembly already exists (Layer 2 topic/name loading). Works for
adults AND kids (a kid's bridge set comes from their archive folders — dinosaurs, Minecraft,
horses).

Together these make the library feel less like an archive and more like access to mentors who
know both the great works and YOUR family.

### 5.7 Idea threads — collections of IDEAS, not books (M)
Collections exist at book level only. Add extraction-level threads: "Courage" gathering hearted
nuggets across 6 books; semantic suggestions ("this connects to something you hearted in X" —
embeddings + cross-book search already run in discussions). Threads become discussable as a unit,
exportable, and feed 5.2's resurfacing by theme. This is how a library becomes a personal
philosophy instead of 580 separate files.

### 5.8 Watch-for prompts — training observation (M)
New lightweight extraction flavor or LiLa generation: from any insight, "What would I see this
week if this were true?" → a watch-for card ("Notice when someone in your family chooses patience
under pressure"). Sightings logged via Quick Note/voice → journal tagged to the thread, surfaced
in Evening Rhythm ("Did you spot it?"). Kids version = noticing game ("Be an idea detective").
This directly answers "inspire greater human thinking and observation" — books become lenses on
the family's actual week, not content about other people.

### 5.9 Table talk — family formation (S-M)
Weekly conversation card from a shared/assigned book's Questions tab → routes to Meeting agenda
(`meeting_agenda_items` wiring EXISTS from RoutingStrip) or Family Hub display. One question at
dinner. Multi-kid audience rendering already exists (guided/independent text). The cheapest
possible "the whole family is becoming together" feature.

### 5.10 Classics made approachable (M-L)
For dense classic works specifically:
- **Companion-pane plain words**: modern-English paraphrase rendered BESIDE the original passage,
  never replacing it (the author's words stay sacred; the paraphrase is a lens). Audience-text
  plumbing (`guided_text`/`independent_text` columns + AudienceToggle) is the exact pattern — add
  an adult `plain_text` layer generated the study-guide way.
- **Tap-a-word glosses**: archaic vocabulary/context notes, Haiku-generated, globally cached
  (`spelling_coaching_cache` pattern — one generation serves every family).
- **"Why this matters now" chapter bridges**: 2-3 sentences connecting each chapter to present
  family life, generated with the member's Archives context (the personalization PRD-23 §5
  originally spec'd for study guides).
- **Slow-reading mode**: the kid card-deck (F2) generalized for adults — one passage per screen,
  dwell, optional reflection, no progress pressure. Savoring as a first-class mode next to
  Abridged/Full.

### 5.11 Bracketing reflections — before/after a book (S)
Starting a book: "What do you hope this changes?" (one journal entry). Finishing (D1's completion
moment): "Read what you hoped. What actually changed?" The victory record includes the delta. Joy
+ formation in one moment, nearly free to build.

### 5.12 Ambient wisdom in the home (S-M)
- Hub slideshow already supports `slideshow_slides.source_guiding_star_id` — book-born
  declarations rotate on the family TV/tablet ambient display. The family's chosen ideas literally
  on the wall.
- Declaration art cards: beautiful themed rendering of a declaration (theme tokens, print/share) —
  fridge-worthy.
- TTS read-aloud on nuggets (Reading Support pattern, Convention #129) — accessibility + ears-only
  moments (dishes, driving).

### 5.13 Memorization play (M, post-core)
For passages/declarations worth carrying for life: progressive word-hiding game (tap to reveal,
celebration on full recital). Kid + adult variants. Celebration-only, opt-in per item.

### What this implies for sequencing
Superseded by Part 6 (founder approved the full menu 2026-06-12 — "Let's plan how to do them
all").

---

## Part 6 — THE PROGRAM: BookShelf Becoming (founder-approved direction, 2026-06-12)

> Founder ruling 2026-06-12: all suggestions approved in direction; 5.3 expanded (Analog Shelf);
> 5.6 reimagined (Ask the Author + Interest Bridges, Board-of-Directors framing declined); 5.7
> explicitly loved. This Part is the master plan. **Each build below still runs the full
> Pre-Build Process when dispatched** — this document is its primary source material alongside
> PRD-23 + addenda. Build files go to `.claude/rules/current-builds/` per convention.

### Build sequence (6 builds)

**Build 1 — NEVER LOSE MY PLACE** *(~1 session — trust first; everything else builds on its
anchor infrastructure)*
Scope: A1 section-anchored position + restore-after-data-load; A2 DB-backed Continue Reading
(banner + dashboard card, deep-link restores tab+section); A3 scroll preserved across Go
Deeper/Continue Extraction; A4 AudienceToggle persistence + member-scoped sessionStorage; A5
chapter-progress indicator; A6 multi-part position memory; B1 search jump-to-source (same anchor
infra); D6 default-expanded Full view; hygiene G1-G4, B7. View-As fix (useEffectiveMember).
Migrations: none expected (reading_positions JSONB shape extends in place).

**Build 2 — THE BECOMING LOOP** *(~1-2 sessions)*
Scope: 5.1 "Make this part of me" flow (say-it-back paraphrase w/ LiLa + HITM, one-tap
Declaration→Star / Best Intention / Task, re-encounter opt-in); 5.2 re-encounter engine (spaced
resurfacing w/ warm reflective frame + Release; dashboard card + rhythm section); 5.4 commonplace
feeders (type-it-yourself transcription + commonplace journal view); 5.11 bracketing reflections;
D1 book completion → victory + `fireDeed` (connector handles rewards); D2 nugget-of-the-day; D5
heart milestones; 5.5 "Who I'm Becoming" view (declarations by value + practice evidence).
Migrations: resurfacing schedule store (revive/replace `resurfaced_item_ids`), paraphrase field
on user state, deed source value.

**Build 3 — THE ANALOG SHELF** *(~1-2 sessions)*
Scope: 5.3b in full — off-shelf book records (no file), "record what I'm reading" voice
narration capture, Kindle My Clippings.txt import (deterministic parser) + freeform paste
(Bulk-AI-Add) + photo/OCR path + **structured paste/.md import** (founder gate-3 addition: text
parsed by quote/poem, or an organized .md file where each entry becomes its own scrollable
card/nugget — HITM review before save), quotes & poetry capture (with or without a book),
off-shelf book discussions (grounded in own captures + labeled general knowledge), commonplace
routing on every capture. KEY ARCHITECTURE: family-private personal-extraction store with embeddings (never
`platform_intelligence`); audit `handleCreateCustomInsight` write target while there.
Migrations: analog book type, personal extractions table + embedding trigger + search RPC
inclusion.

**Build 4 — KIDS & TEENS READ TOO** *(~1-2 sessions; after 2+3 — reuses deed + narration
pipelines)*
Scope: F1 Guided Dashboard "Reading" section (the missing kid entry point — PRD-25 stub); F2
card-deck kid reading mode (one nugget/screen, big type, TTS via Reading Support); 5.3a narration
telling-back (voice → journal → family_moments → portfolio); 5.8 watch-for prompts kids' noticing
game; F3 story questions → guided-form worksheets; F4 reading → sticker-book pipeline
(mom-configurable); E1 teen default audience; E2 teen "My Reading" dashboard section; E3 school
mode (study-guide artifacts + reading time → homeschool hours); E4 teen discussions default; E5
Reading List sequential collections ↔ real books bridge.

**Build 5 — CONVERSATIONS & MENTORS** *(~1-2 sessions)*
Scope: 5.6 reimagined — (a) Ask the Author (author-scoped semantic retrieval across the author's
works, quoted + cited answers, clearly-labeled general-knowledge supplement) and (b) Interest
Bridges ("see how this relates to soccer/manga/…" from the member's own Archives interests, kid
and adult variants); C1 streaming discussion responses; C2 discuss-this-nugget chip; C3 cited
answers w/ tappable section refs (populate message metadata); C4 wider conversation memory; C5
per-message Apply-This; C6 resume-conversation cards; B3 ask-my-library from dashboard/LiLa; B4
search-result quick actions; 5.8 adult watch-for prompts; verify/finish C7 chips.

**Build 6 — DEEP WORKS & THE FAMILY SHELF** *(~1-2 sessions)*
Scope: 5.10 classics accessibility (companion-pane plain words beside the original, tap-a-word
glosses globally cached, "why this matters now" Archives-personalized chapter bridges,
slow-reading mode for adults); 5.7 idea threads (extraction-level collections + semantic
suggestions); 5.9 table talk (questions → meeting agenda / hub); 5.12 ambient wisdom (hub
slideshow of book-born declarations, declaration art cards, TTS on nuggets); D3 reading streaks;
D4 living library cards; D7 Rhythms "From Your BookShelf" card.

**Build 7 — WRITTEN ON THE HEART (Memorization)** *(own build — founder-specified 2026-06-12;
supersedes 5.13's "memorization play" sketch)*
Purpose (founder verbatim intent): "help write thoughts, scriptures, poems, ideas on the heart,
so when hard times come, that is where their mind and heart goes for answers — it has been
previously prepared."
Scope:
- **"Memorize this" action** everywhere a nugget lives: extractions, personal highlights, quotes,
  poetry, declarations (rides Apply-This + the Build 3 capture pipeline).
- **Memorization section**: browsable home for all of a member's memorization items with three
  states — **Active** (the few currently being worked, member-chosen), **Retired** (passed off,
  still browsable/retestable), **Browse** (the full collection, browsable like nuggets).
- **Dashboard presence**: active item(s) as a dashboard card/widget per member.
- **Memorization games** (celebration-only, no shame on misses): word-order drag-and-drop
  (@dnd-kit exists), first-letters-only mode, missing-words cloze, **recite to pass off** (voice
  → `whisper-transcribe` → fuzzy compare), **explain it in your own words** (LiLa, ties to 5.1's
  say-it-back — understanding alongside recall).
- **Smart-interval retention**: pass-off isn't the end — the re-encounter engine (Build 2)
  retests at widening intervals ("still got it?"), with a journal-about-it option each visit.
- **Mom loads the section**: assign items to kids (task_assignment authority applies); **AI quote
  finder** — ask for accurate, real quotes by topic/author via an OpenRouter model selected for
  faithful quotation (accuracy emphasis + HITM review before anything saves); or pull from the
  library/captures.
- **Growing quote library**: as families add quotes/authors, save + semantically embed them so
  the platform can suggest by topic or by person. ARCHITECTURE FLAG: shared quote library is
  platform-level content and must follow a curated promotion pattern (Convention #258 three-tier
  spirit: family-private by default → curated shared layer), never raw auto-sharing.
- **Rewards (optional, mom-configured)**: pass-off fires a deed (`fireDeed`, new source value) →
  existing connector/contracts handle it. Contract shapes: per-item reward, **playlist** ("pass
  off all items in this list → reward"), and **count-based** ("memorize N of your own choosing →
  reward"). Reuses the KIDS-REWARDS-PAGE custom-reward/earned-prizes pipeline — natural synergy.
Sequencing: depends on Build 2 (re-encounter engine) + Build 3 (quote/poetry capture) + the
kids-rewards reward pipeline (in flight now). Slots naturally after Build 4; can swap with 5/6.

### Dependency notes
- Build 1's section-anchor infra is load-bearing for B1 (jump-to-source), C3 (citation jumps,
  Build 5), and slow-reading position (Build 6). It goes first, non-negotiable.
- Build 2's deed firing is reused by Build 4 (kid gamification) and Build 6 (streaks).
- Build 3's capture + personal-extraction store is reused by Build 4 (narration) and feeds
  Builds 2/5/6 (personal extractions are full citizens of resurfacing, search, discussion).
- Builds 5 and 6 can swap order freely.

### Gate decisions — RESOLVED by founder 2026-06-12
1. **Personal extraction store** → ✅ NEW family-scoped table (clean RLS, embeddings, own
   lifecycle). Legacy per-family tables stay on the Phase 1c drop path.
2. **Analog books on the same shelf** with a "physical book" badge → ✅ Yes.
3. **Highlight import wave 1** → ✅ My Clippings.txt + freeform paste + photo/OCR, **PLUS**
   (founder addition): paste-in text that parses by quote/poem, and **.md file import** where
   organized entries each become their own scrollable card/nugget. Goodreads CSV and other
   readers later.
4. **Ask the Author scope** → ✅ Works-on-shelf grounded answers; other authors get
   clearly-labeled general knowledge only.
5. **Sequencing** → ✅ KIDS-REWARDS-PAGE finishes first (all slices). Pre-build preparation for
   the BookShelf Becoming program is authorized NOW — Build 1's pre-build draft lives at
   `claude/feature-decisions/BookShelf-Becoming-Build1-Never-Lose-My-Place.md` and moves into
   `.claude/rules/current-builds/` only at dispatch.

---

## Part 4 — Suggested groupings if this becomes builds (superseded by Part 5's sequencing)

1. **"Never Lose My Place" session** — A1-A6 + B1 (shared anchor infra) + D6 + G1-G3. One
   feature-surface session; directly answers the founder's stated pain.
2. **"Nuggets Come Alive" session** — D1, D2, D5, D7, C2, E6/F4 (deed + resurfacing + discuss-this).
   Reading starts feeding the celebration/connector machinery the rest of the app already has.
3. **"Deeper Conversations" session** — C1, C3, C4, C5, C6, B3, B4.
4. **"Kids & Teens Read Too" build** — F1, F2, F3, E1-E5 (needs PRD-25 Reading-section pre-build
   check; the Guided surface is net-new).

No decisions made — founder picks ordering and scope.
