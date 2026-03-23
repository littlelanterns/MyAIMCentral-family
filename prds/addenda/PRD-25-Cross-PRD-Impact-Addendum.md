# PRD-25 Cross-PRD Impact Addendum

**Created:** March 17, 2026
**Session:** PRD-25 (Guided Dashboard)
**Purpose:** Documents how PRD-25 decisions affect prior PRDs and establishes new patterns.

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- Guided shell bottom nav item "Journal" renamed to "Write."
- "Write" button opens the right-side Write drawer (same slide-in direction as adult Smart Notepad). It does NOT navigate to a page.
- Right-edge pull tab remains available as a secondary trigger on tablet/desktop.
- Guided shell notepad upgraded from "lightweight single-tab" to full Write drawer with three tabs (Notepad, Messages, Reflections).

**Action needed:**
- Update Guided shell bottom nav spec: `Home | Tasks | Write | Victories | Progress`.
- Update Guided shell notepad description: replace "Simplified capture drawer. Single-tab, large text, voice input, saves to journal, no routing grid" with reference to PRD-25 Write drawer spec.
- Note that "Write" in bottom nav triggers the right-side drawer, not a page route.

---

## Impact on PRD-08 (Journal + Smart Notepad)

**What changed:**
- Guided shell notepad is no longer "lightweight single-tab." It's a full Write drawer with three tabs: Notepad (freeform writing with spell check + "Send To..." routing), Messages (PRD-15 conversation spaces), Reflections (mom-enabled prompt cards).
- Spell check with real-time squiggles added as a baseline feature. Spelling & Grammar Coaching (teaching explanations) added as a mom-toggled enhancement.
- "Send To..." routing from the Notepad tab includes: Journal, Message, Task Note. This is a simplified routing grid compared to the adult Smart Notepad's full Review & Route.

**Action needed:**
- Update PRD-08's reference to Guided shell notepad. Replace "lightweight single-tab notepad" with "Write drawer (PRD-25) with Notepad, Messages, and Reflections tabs."
- Note that the Write drawer's "Send To..." routing is a simplified subset of Review & Route — it routes to 3 destinations (Journal, Message, Task Note) instead of the full routing grid.
- Note spell check and Spelling & Grammar Coaching as notepad capabilities (available in all shells, but coaching toggle is Guided-specific for now).

---

## Impact on PRD-11 (Victory Recorder & Daily Celebration)

**What changed:**
- DailyCelebration gains an optional Step 2.5 (Reflections) for Guided members.
- Step 2.5 is inserted between Step 2 (Victories Summary) and Step 3 (Streak Update).
- Only appears when mom enables `reflections_in_celebration = true` in the member's dashboard preferences.
- Step 2.5 is skippable. Shows 1-3 reflection prompts (mom-configured count). Answers save to `journal_entries` with `entry_type = 'reflection'` and `source = 'daily_celebration'`.

**Action needed:**
- Note the optional Step 2.5 insertion point in PRD-11's DailyCelebration sequence spec.
- Add a forward note: "Step 2.5 (Reflections) defined in PRD-25. Only renders for Guided members when mom enables reflections in celebration. Skippable."
- Verify that the DailyCelebration component architecture supports optional step insertion without disrupting the existing 5-step flow.

---

## Impact on PRD-14 (Personal Dashboard)

**What changed:**
- PRD-14 Screen 5 (Guided and Play Dashboard stubs) — Guided section is now fully superseded by PRD-25.
- Two new section key constants added: `'next_best_thing'` and `'celebrate'`.
- `dashboard_configs.preferences` JSONB extended with 10 new keys for Guided-specific settings.

**Action needed:**
- Mark PRD-14 Screen 5 Guided Dashboard stub as "Superseded by PRD-25."
- Add `'next_best_thing'` and `'celebrate'` to the section key constants list (alongside `'greeting'`, `'calendar'`, `'active_tasks'`, `'widget_grid'`).
- Add PRD-25 preference keys to the `preferences` JSONB documentation: `reading_support_enabled`, `spelling_coaching_enabled`, `reflections_in_drawer`, `reflections_in_celebration`, `reflection_prompts`, `reflection_custom_prompts`, `reflection_daily_count`, `nbt_last_suggestion_index`, `graduation_tutorial_completed`, `guided_task_view_default`.
- Note in the forward note that PRD-26 (Play Dashboard) will also supersede the remaining Play stub in Screen 5.

---

## Impact on PRD-15 (Messages, Requests & Notifications)

**What changed:**
- Guided shell messaging surface is now inside the Write drawer's Messages tab, not a standalone page.
- Before-send coaching checkpoint renders within the Write drawer context (same functionality, different container).
- Unread message count displays as a badge on the "Write" bottom nav item (not a notification bell — Guided shell has no notification bell per PRD-15).

**Action needed:**
- Note that Guided shell messaging is accessed via the Write drawer Messages tab (PRD-25), not via a sidebar "Messages" item.
- Verify the before-send coaching checkpoint UI works within a drawer panel (may need to render as an inline section rather than a modal overlay).
- Note "Write" bottom nav badge for unread messages replaces the inline indicator approach previously described for Guided shell.

---

## Impact on PRD-18 (Rhythms & Reflections)

**What changed:**
- Reflections confirmed for Guided kids in two placements: Write drawer tab (anytime) and DailyCelebration Step 2.5 (evening routine).
- Mom enables each placement independently per child.
- Kid-specific prompts (library prompts 28-32) confirmed as the default enabled set for Guided members.
- Mom can add custom prompts and configure how many show per day/celebration.

**Action needed:**
- Note Guided reflections architecture in PRD-18. Reference PRD-25 for full spec.
- Confirm prompts 28-32 are tagged as "kid-appropriate" in the reflection prompt library.
- Note the `reflection_daily_count` preference that controls how many prompts surface per session.

---

## Impact on PRD-22 (Settings)

**What changed:**
- "Manage Dashboard" screen added to Settings → Family Management → [Guided member] detail.
- Management screen includes: section ordering, visibility toggles, feature toggles (Reading Support, Spelling Coaching, Reflections with sub-options, Gamification), and LiLa tool access per-tool toggles.

**Action needed:**
- Add "Manage Dashboard" entry to the Family Management member detail screen in PRD-22.
- Note that this management surface only appears for members in Guided (and eventually Play) mode. Adult/Independent members manage their own dashboards.
- LiLa tool toggles in this screen are the same permission flags from PRD-02 `member_permissions` — this is a convenience surface, not a new permission system.

---

## Impact on PRD-24 (Gamification Overview & Foundation)

**What changed:**
- Gamification indicators in Guided dashboard header confirmed: currency balance + streak count.
- When gamification is disabled for a member: header indicators hidden, task point values hidden, DailyCelebration Step 4 skipped, NBT reward language suppressed.

**Action needed:**
- No structural changes needed — PRD-24 already supports per-member gamification disable.
- Note the Guided header as a display location for gamification indicators alongside widget grid widgets.

---

## Impact on PRD-05 (LiLa Core AI System)

**What changed:**
- Two new guided modes defined for Guided shell LiLa tool modals:
  - `guided_homework_help` — Socratic method homework assistance.
  - `guided_communication_coach` — Kid-adapted Higgins communication coaching (two sub-modes: "help me say something" and "help me figure this out").
- Both require PRD-05 guided mode infrastructure to render as permission-gated modals.

**Action needed:**
- Add `guided_homework_help` and `guided_communication_coach` to the guided mode registry.
- Note these modes are modal-only (no drawer access) and all conversations are visible to mom by default.
- Reference PRD-25 AI Integration section for system prompt notes and context loading specs.

---

## Impact on Feature Highlight Audit

**What changed:**
- Next Best Thing button fully specified for Guided dashboard with priority logic, AI glaze, cycling behavior, and edge cases.

**Action needed:**
- Update Feature Highlight Audit to reference PRD-25 as the authoritative specification for the Guided implementation of Next Best Thing. Note that the adult/Independent implementation will follow the same architectural pattern with expanded context (Best Intentions, energy level, whole-family awareness).

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-25 (Guided Dashboard) written.

**Action needed:**
- Move PRD-25 to Section 2 (completed PRDs).
- Update any references to "Guided Dashboard — tentatively earmarked" to "PRD-25 — written."

---

## New Patterns Established

| Pattern | Description | Applicable To |
|---------|-------------|---------------|
| **Write drawer as upgraded notepad** | Bottom nav "Write" button opens the same right-side drawer as the adult Smart Notepad, but with a kid-accessible trigger. Three tabs consolidate writing, messaging, and reflections. | PRD-26 (Play Dashboard) may use a further-simplified version. |
| **Reading Support accommodation layer** | Per-member toggle that adds TTS, larger font, and icon pairing without changing the dashboard mode. Accommodation, not demotion. | Could extend to Independent shell for members with reading challenges. |
| **Spelling & Grammar Coaching** | Lookup table + AI fallback for teaching explanations on spell check corrections. Mom-toggled. Globally cached. | Could extend to all shells as an optional learning tool. |
| **Next Best Thing priority engine** | Deterministic suggestion ordering: overdue → active routine → time-block → mom-priority → next due → opportunities → unscheduled. AI glaze is lightweight and cached. | Adult/Independent NBT will use the same engine with additional context inputs (Best Intentions, energy, whole-family). |
| **DailyCelebration optional step insertion** | Step 2.5 pattern allows inserting optional content between existing steps without restructuring the sequence. | Future PRDs could insert other optional steps (e.g., gratitude prompt, goal check-in). |
| **Graduation celebration + tutorial** | Shell transition includes celebration overlay, interactive tutorial with tasks, and welcome card. Data carries over completely. | Pattern reusable for Play → Guided graduation (PRD-26). |

---

*End of PRD-25 Cross-PRD Impact Addendum*
