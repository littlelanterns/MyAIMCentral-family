# PRD-18 Cross-PRD Impact Addendum

**Created:** March 13, 2026
**Session:** PRD-18 (Rhythms & Reflections)
**Purpose:** Documents how PRD-18 decisions affect prior PRDs and establishes new system-wide conventions.

---

## Major Architectural Change: Journal Tag-Based Filtering

PRD-18 introduces the most significant cross-PRD architectural change since the Studio Queue consolidation (PRD-17). The Journal architecture from PRD-08 shifts from a sub-page model (separate pages per `entry_type`) to a unified tag-based filtering model.

**What changed:**
- `journal_entries` table gains a `tags` TEXT[] column with GIN index
- `entry_type` is preserved but its semantic meaning shifts from "content category" to "source/creation method"
- Journal sub-pages (Reflections, Commonplace, Kid Quips, etc.) become tag-based filtered views of one unified Journal
- An entry with multiple tags appears in multiple filtered views without duplication
- Export supports multi-tag selection with deduplication and date-sorted output

**Why:** Reflection answers naturally span multiple categories — a gratitude reflection that describes an accomplishment should appear in both Gratitude and Reflections views. The sub-page model would require either duplication (violating single-source-of-truth) or forcing a single category choice (losing cross-category visibility). Tags solve this cleanly.

**Action needed on PRD-08:**
1. Add `tags` TEXT[] column to `journal_entries` schema with GIN index
2. Document the semantic shift: `entry_type` = source, `tags` = content categorization
3. Update Reflections sub-page deferred note to reference PRD-18 as the resolution
4. Note that all future Journal sub-page PRDs should implement as tag-based filtered views, not separate pages
5. Update "Journal Entry Detail" screen (PRD-08 Screen 5) to show tags as removable/addable chips alongside the existing `life_area_tags`

**Migration consideration:** The existing `entry_type` values that were functioning as content categories need a backfill strategy at build time. Entries with `entry_type = 'gratitude'` should also get `tags = ['gratitude']`. This is a one-time migration, not an ongoing sync.

---

## Impact on PRD-06 (Guiding Stars & Best Intentions)

**What changed:**
- PRD-06 Screen 4 stubs ("Morning Rhythm / Evening Review integration points") are now fully wired
- Guiding Star Rotation section type consumes `guiding_stars` entries with `is_included_in_ai = true`
- Best Intentions Focus section type consumes active `best_intentions` entries
- Intention Check-in section type reads `intention_iterations` for daily counts
- Evening Rhythm's "Closing Thought" section displays one full Guiding Star entry
- Evening Rhythm's "From Your Library" section rotates Scripture/Quote entries

**Action needed:**
- Update PRD-06 Screen 4 deferred note: "Morning Rhythm and Evening Review are defined in PRD-18. Data contracts consumed as-is."
- Verify that the Guiding Star rotation in the rhythm card and the Guiding Star rotation in the greeting header (PRD-14) and the Guiding Star rotation widget (PRD-06 Screen 3) can all coexist reading from the same table without conflicts

---

## Impact on PRD-11 (Victory Recorder + Daily Celebration)

**What changed:**
- Evening Rhythm's Accomplishments & Victories section reads from `victories` table
- Reflection answers can be flagged as victories → creates `victories` record with `source = 'reflection_routed'`
- DailyCelebration handoff confirmed: at evening rhythm time, Guided/Play members trigger DailyCelebration instead of the adult evening rhythm
- Evening Rhythm links to Victory Recorder for celebration narrative generation

**Action needed:**
- Add `'reflection_routed'` to `victories.source` enum
- Update PRD-11 "MVP When Dependency Ready" item: "Evening Rhythm integration — today's victories shown in Reckoning review" → point to PRD-18 Section 2 (Evening Rhythm)
- Verify DailyCelebration trigger timing aligns with evening rhythm time configuration

---

## Impact on PRD-14 (Personal Dashboard)

**What changed:**
- Rhythm cards render as auto-inserting dashboard sections that appear at the top of the section list when due
- Rhythm cards are NOT part of the greeting header — they are separate sections
- Rhythm cards auto-manage their visibility (appear when due, show completed state after completion, disappear after period boundary resets)
- Dashboard edit mode should not allow hiding rhythm sections (they self-manage)
- The existing greeting header with Guiding Stars rotation is preserved unchanged

**Action needed:**
- Note in PRD-14 that rhythm sections are auto-managed sections that insert at position 0 in the section list
- Add rhythm section type to the section ordering system with `is_auto_managed = true` flag
- Verify that the breathing glow animation on rhythm cards doesn't conflict with any other dashboard animations

---

## Impact on PRD-03 (Design System & Themes)

**What changed:**
- Tooltip component needs enhancement: "What's this?" link support that opens LiLa contextual help
- Breathing glow animation token needs formal documentation for rhythm card usage
- The breathing glow convention from PRD-17 is now consumed by rhythm cards

**Action needed:**
- Add tooltip enhancement spec: tooltip content area + "What's this?" link with `feature_key` parameter
- Document breathing glow animation token in the Animations section
- Add `rhythm_card` to the list of components that use the breathing glow pattern

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- New context injection pattern: `contextual_help` — when user taps "What's this?", LiLa receives feature-specific context to explain the feature conversationally
- New context source: `mood_triage` from Evening Rhythm completions — available when user is discouraged or asks how their week has been going
- New capability: dynamic reflection prompt generation based on day data (task completions, stale intentions, victories, conversation tension)

**Action needed:**
- Add `contextual_help` context injection pattern to LiLa context assembly pipeline
- Add `rhythm_completions.mood_triage` as an available context source
- Define dynamic prompt generation as a LiLa capability (lightweight model call to generate 1-2 contextual prompts per evening session)
- Note: LiLa does NOT have a guided mode for Rhythms — this is a context source, not a conversation mode

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- Two new pages added to sidebar navigation: Reflections page and Rhythms Settings page
- Both pages should appear in Mom, Dad/Adult, and Independent Teen shells
- Neither page appears in Guided, Play, or Special Adult shells

**Action needed:**
- Add "Reflections" to sidebar navigation for Mom, Adult, Independent shells
- Add "Rhythms" to sidebar navigation for Mom, Adult, Independent shells (or under Settings)
- Note that the Rhythms page includes a member picker (mom only) for configuring family members' rhythms

---

## Impact on PRD-09B (Lists, Studio & Templates)

**What changed:**
- Rhythm templates are a new template category in the Studio
- 7-10 rhythm templates planned for Studio library (post-MVP content)
- Template activation creates a copy as a custom rhythm the user can further customize
- Teen rhythm request flow originates from Studio template browsing

**Action needed:**
- Note rhythm templates as a Studio category when designing the Studio page experience
- Template data model should support rhythm templates alongside task templates, list templates, etc.

---

## Impact on PRD-17 (Universal Queue & Routing System)

**What changed:**
- Teen rhythm requests use `source = 'rhythm_request'` in the Studio Queue
- Requests appear in mom's Requests tab in the Universal Queue Modal
- Accept → activates the rhythm for the teen. Edit & Accept → mom modifies before activating. Reject → declined with optional note.

**Action needed:**
- Add `'rhythm_request'` to `studio_queue.source` enum
- Define rhythm request processing behavior in the Requests tab

---

## New System-Wide Conventions Established

### Convention: Embedded Smart Notepad Component
Any feature needing text-heavy input can embed a Smart Notepad mini-component. This affects every future PRD that includes text capture with routing capabilities. The component auto-routes when the destination is obvious and offers manual routing when ambiguous.

### Convention: Tooltip + LiLa Contextual Help
Every feature should implement tooltip descriptions with "What's this?" links. This is a gradual rollout — each feature PRD implements it for its own features. PRD-03 (Tooltip component) and PRD-05 (LiLa context assembly) need updates to support the pattern.

### Convention: Journal Tag-Based Filtering
The Journal is one unified surface. Tags replace sub-pages. Every future PRD that routes content to Journal should specify tags, not just entry_type.

---

*End of PRD-18 Cross-PRD Impact Addendum*
