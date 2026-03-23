# PRD-26 Cross-PRD Impact Addendum

**Created:** March 17, 2026
**Session:** PRD-26 (Play Dashboard)
**Purpose:** Documents how PRD-26 decisions affect prior PRDs.

---

## Impact on PRD-14 (Personal Dashboard)

**What changed:**
- PRD-14 Screen 5 Play Dashboard stub fully superseded by PRD-26.
- Two new section key constants: `'task_tiles'` and `'mom_message'`.
- `dashboard_configs.preferences` JSONB extended with Play-specific keys.

**Action needed:**
- Mark PRD-14 Screen 5 Play Dashboard stub as "Superseded by PRD-26."
- Add `'task_tiles'` and `'mom_message'` to section key constants.
- Add Play preference keys to schema documentation.
- Note: both Guided (PRD-25) and Play (PRD-26) stubs are now fully superseded. Screen 5 can be marked as historical reference only.

---

## Impact on PRD-09A (Tasks, Routines & Opportunities)

**What changed:**
- New `tasks.source` value: `'randomizer_reveal'` — tasks created when a Play member accepts a revealed item from a reveal task tile.
- `source_reference_id` links to the `list_items.id` that was revealed.

**Action needed:**
- Add `'randomizer_reveal'` to the documented `tasks.source` values.
- Note that these tasks are created dynamically on the Play dashboard, not through the Task Creation Modal.

---

## Impact on PRD-09B (Lists, Studio & Templates — Randomizer)

**What changed:**
- Randomizer lists now have a second consumer: Play dashboard reveal task tiles (in addition to mom's Draw button).
- Reveal tiles require additional configuration beyond what PRD-09B's Randomizer spec includes: selection_mode (random/rotating/manual), repeat_rule (infinite/limited/one_and_done), daily_draw_limit, and reveal_style.
- These additional configuration fields are stored in `dashboard_configs.preferences.reveal_tiles` (not on the list itself), keeping the list schema unchanged.

**Action needed:**
- Note Play dashboard as a consumer of Randomizer lists alongside mom's Draw button.
- Verify `list_items.is_repeatable` and `list_items.is_available` fields support the one-and-done flow (they do — `is_available` is set to false when completed).
- Note that the "rotating" selection mode (no repeats until all items seen) requires tracking which items have been shown. This is managed client-side or in a separate tracking field in the reveal tile preferences, not in the list schema.

---

## Impact on PRD-24B (Gamification Visuals & Interactions)

**What changed:**
- Reveal animation components (spinner, mystery doors, card flip, scratch-off, gift box) confirmed for use outside reward contexts — specifically for Play dashboard reveal task tiles.
- Animation components must accept arbitrary content to display (a task/list item), not just reward data.

**Action needed:**
- Ensure reveal animation component interfaces are generic: they receive a "content to reveal" object (with a name, emoji, and description) rather than a reward-specific data structure.
- Note that spinner, mystery doors, and card flip are MVP priorities. Scratch-off and gift box are Post-MVP for the Play dashboard context.

---

## Impact on PRD-15 (Messages, Requests & Notifications)

**What changed:**
- Play members confirmed as receive-only for messaging. They can see messages from parents displayed as inline cards on their dashboard.
- No messaging compose, reply, or notification tray for Play members.
- Messages display location: inline card on the Play dashboard, not via a messaging page or notification bell.

**Action needed:**
- Verify the message send API supports targeting Play members (members who cannot reply).
- Note that Play shell message delivery is "push to dashboard" — messages appear as visual cards, not as entries in a conversation thread the child navigates to.
- Update the PRD-15 shell behavior table: Play members receive messages as dashboard cards, no notification tray, no compose.

---

## Impact on PRD-11 (Victory Recorder & Daily Celebration)

**What changed:**
- Tasks with `source = 'randomizer_reveal'` should include the parent Randomizer list title as category context in victory records.
- Victory description format: "[List Title]: [Item Name]" — e.g., "Jobs: Wiped the kitchen table."

**Action needed:**
- Note the victory description format for randomizer_reveal tasks in the auto-victory creation logic.
- This enriches the DailyCelebration narrative ("You picked a job from the spinner and wiped the kitchen table!").

---

## Impact on PRD-22 (Settings)

**What changed:**
- Play Dashboard Management screen added to Settings → Family Management → Play member → Manage Dashboard.
- Includes: task tile ordering, reveal tile configuration (with linked Randomizer list management), widget assignment, Reading Support toggle.

**Action needed:**
- Add "Manage Dashboard" for Play members in PRD-22's Family Management member detail.
- The reveal tile configuration UI is the most complex element: list selection/creation, reveal style picker, selection mode, repeat rules, re-pick settings, daily limit.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-26 (Play Dashboard) written.

**Action needed:**
- Move PRD-26 to Section 2 (completed PRDs).
- Wave 2 (Final) is now complete: both PRD-25 and PRD-26 are written.

---

## New Patterns Established

| Pattern | Description | Applicable To |
|---------|-------------|---------------|
| **Reveal task tile** | A task tile linked to a Randomizer list that uses a reveal animation to show the specific item. Transforms category-level assignments ("do a job") into gamified surprises. | Could extend to Guided mode as an alternative to Next Best Thing for specific category tasks. Could extend to adult dashboards for fun family activities. |
| **Receive-only messaging** | A member can see messages from parents as inline dashboard cards but cannot compose or reply. Appropriate for young children. | Pattern could apply to other limited-access contexts (e.g., guest accounts, demo mode). |
| **Reveal animation reuse outside rewards** | PRD-24B animations used for task reveals, not just reward reveals. Generic content interface. | Could power other "surprise" surfaces: random quote of the day, mystery activity suggestions, meal planning reveals. |
| **Play → Guided graduation** | Same celebration + tutorial pattern as Guided → Independent (PRD-25), simplified for younger audience (4 steps vs 5). | Completes the graduation chain: Play → Guided → Independent. Consistent pattern across all transitions. |

---

*End of PRD-26 Cross-PRD Impact Addendum*
