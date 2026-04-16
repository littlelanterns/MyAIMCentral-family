# Universal Setup Wizards — Session Addendum

> **Status:** Founder review decisions — captures answers to open questions and design refinements from review session
> **Date:** April 15, 2026
> **Predecessor:** Universal-Setup-Wizards.md (Feature Decision File)
> **Authority:** Decisions here supersede the original feature decision doc where they conflict.

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Tally wizard collapsed from 10 presets to one universal wizard with suggested starting titles** | The 10 presets (Reading Log, Water Intake, Chore Points, etc.) are not different wizard paths — they're the same 6-step flow with different default text. Suggested titles become a scrollable row of starting points, not separate components. Mom can type anything she wants. |
| 2 | **Savings Goal and Chore Earnings removed from tally presets; moved to Money Wizard** | Money is money. The Money Wizard owns all three money cards (Allowance Calculator, Savings Goal, Chore Earnings). Avoids duplicate entry points in Studio for the same underlying feature. |
| 3 | **Color reveal is a tally visual variant, not a separate wizard** | The underlying data model is identical (increment a counter). Color reveal is selected in the tally wizard's "Pick a visual" step alongside coin jar, star chart, bar graph, and progress circle. Creates a `tally` type widget with `visual_variant = 'color_reveal'`. |
| 4 | **Tally wizard adds "How does this count up?" step** | Three options: (A) "Automatically when a task is completed" — task picker or inline task creation, (B) "I'll tap it manually" — no linked task, just a dashboard button, (C) "Link to an existing item" — browse existing tasks, routines, Best Intentions. This is the key connective tissue that turns the wizard from "configure a display" into "set up a complete working system." Solves the exact pain point where mom couldn't set up a color reveal for her daughter because the task didn't exist yet. |
| 5 | **Reward reveals in wizards browse the existing 30+ reveal video library** | No separate configuration system needed. The wizard step is a visual picker showing what's already uploaded to Supabase storage (treasure boxes, envelopes, card flip, three doors, etc.). |
| 6 | **Animated coin jar is a visual variant, not a reveal** | The coin jar where each completion animates a new coin dropping into the jar is a persistent dashboard display (`visual_variant = 'coin_jar_animated'`), not a treasure chest reveal. Needs to be designed and built as a new visual variant on the tally widget type. Does not exist yet — add to PRD-10/PRD-24B backlog. |
| 7 | **localStorage for wizard progress persistence, versioned keys** | Key format: `wizard-v1-{wizardId}-{familyId}`. Version number allows invalidating stale drafts when wizard structure changes between deploys. Clears on successful deploy or explicit "Start Over." Supabase persistence deferred to Phase 5 polish — only build if beta usage shows moms frequently abandoning wizards and wanting cross-device resume. |
| 8 | **Wizard deploy step saves a snapshot to Supabase** | The wizard's final "Review & Deploy" step saves a record of what was configured, providing an audit trail without the complexity of persisting draft state to the database during the wizard flow. |
| 9 | **Wizards available to Mom, Dad/Additional Adult, and Independent Teen** | Mom: all wizards. Dad/Additional Adult: wizards for features they have access to (own trackers, own Guiding Stars, own InnerWorkings, own Best Intentions). NOT children's gamification config unless mom grants permission. Independent Teen: wizards for own features (personal trackers, own Guiding Stars, Best Intentions, InnerWorkings, Opportunity Board as participant not creator, simplified gamification preference wizard if mom permits). Guided and Play: no wizards — mom configures everything. |
| 10 | **Wizard access controlled by existing permission checks, not shell-specific variants** | Wizard components are the same for all roles. `useCanAccess()` check at launch determines whether the wizard opens. Studio page already handles per-shell visibility. |
| 11 | **First-visit detection on /trackers opens a type chooser, not a single wizard** | The first-visit card shows "What would you like to track?" with category cards: Count something (tally), Build a streak (streak), Track a mood/check-in (mood), Measure completion % (percentage), Follow a path (sequential), Set up rewards (gamification setup). Each card opens the appropriate wizard. Lightweight mini-Studio, not the full browse page. |
| 12 | **Personality tests deferred — trait grid + upload for InnerWorkings wizard** | Actual validated personality test questionnaires are AI Vault content items, not wizard steps. The wizard captures what mom already knows. |
| 13 | **Claude drafts 25-30 Best Intentions ideas, founder curates** | The "Ideas from other moms" gallery needs founder-authored content. Draft for review, not publish directly. |
| 14 | **Opportunity Board wizard creates task_template records per PRD-09A architecture** | Creates `task_template` with `task_type` matching the opportunity sub-type (opportunity_claimable, opportunity_repeatable, opportunity_capped), then deploys task instances per-job. The wizard is an on-ramp, not a new data model. |
| 15 | **School Expenses uses same `expenses` list type with school-specific preset categories** | No new `list_type` value. Wizard pre-configures sections as student names + school programs. View-by-student/school/activity is a frontend filter. |
| 16 | **Growth wizards available from both Studio AND feature pages** | Studio has the cards in "Growth & Self-Knowledge" section. Feature pages have first-visit detection. Two entry points, same wizard component. Matches "maximalist options" principle. |
| 17 | **Studio badge count consolidates true duplicates but keeps genuinely different use cases as separate cards** | "Reading Log" and "Reading Log (Books)" consolidate. "Reading Log" and "Family Reading Race" stay separate because they're different use cases even though both are tally type. |
| 18 | **AI-first input is the default for every wizard** | Every wizard that accepts multiple items (opportunities, lists, rewards, routines, etc.) should accept natural language brain dump as the primary input method. AI organizes into correct format and categories. BulkAddWithAI is the standard, not the exception. "Meet mom where she's at, then pave things for her." |
| 19 | **Opportunity Board is a list of opportunities, not a single-type board** | Multiple board types coexist: earning, learning, "I'm bored" activities, etc. Bulk add is the primary creation path. Items can be added via BulkAddWithAI, Smart Notepad route-and-review, or individually. The wizard creates the board container and seeds it with bulk items; mom adds more over time through any input path. |
| 20 | **Checklist wizard merges with routine builder concept, not a separate wizard** | Checklists for kids are simplified routines. The existing routine builder (with segments containing tasks, subtasks, randomized opportunity connections, etc.) is the right architecture. What's needed is a better kid-focused setup experience within the routine builder, not a separate checklist wizard. LiLa can suggest routines, or mom creates. Removes Checklist Wizard as a standalone component. |
| 21 | **Treasure Box Wizard reveal types: complete list** | The reveal animation picker must include ALL existing reveal types: treasure chest videos (30+ variants), envelope opening, box opening, spinner wheel, scratch-and-reveal, pick a card, pick a door. Not just the video reveals — the interactive CSS/SVG reveals too. |
| 22 | **List wizards moved from Tier 4 to Tier 1** | Shared lists are an immediate need for the founder's family (house to-do lists, things to get done, shared lists with husband). Beta tester validation confirms this is a universal mom need, not family-specific. Lists are daily-use and the current creation flow is a pain point. |
| 23 | **Gamification wizards are improvements to existing setup, not full rebuilds** | The current gamification setup flow is mostly functional with specific gaps (tasks not existing yet, per-segment tracking for Guided/Play). Wizards fill the gaps and smooth the on-ramp rather than replacing what works. |
| 24 | **Annual Reference Log is NOT a new list type — records/milestones split across existing systems** | The beta tester's "calendar pages" use case and kid milestones are timestamped life data you want to look back on. These split across: (A) **Family Feed moments** for shareable family memories and milestones (tagged `annual`, `milestones`, per-child names, `traditions`), (B) **Journal entries with tags** for private records (tagged `home maintenance`, `garden`, `records`), (C) **Home Maintenance wizard** for scheduled recurring items that need "when did I last do this?" + "when is it due next?" (creates list + recurring task hybrid). The "look back" view is a filtered query on Family Feed (PRD-37) and journal tags — not a separate list type. No `annual_reference` list type needed. |
| 25 | **Beta tester's "things too small to put on a list" maps to MindSweep/brain dump** | The wizard for this is "Just dump everything" with AI sorting it to the right places afterward (Smart Notepad -> Review & Route). Not a new list type — it's the existing MindSweep pipeline with a better on-ramp. |
| 26 | **Beta tester's "bigger things that get pushed to the bottom" need priority surfacing** | Same To-Do list, but the wizard should ask "Any of these are big projects that keep getting pushed off?" and offer to tag them as BigPlans candidates or flag them with higher priority. The list wizard's AI parsing should detect size/complexity and suggest promotion. |
| 27 | **Maintenance Schedule Wizard creates a list + recurring task hybrid — applies to ALL areas of life, not just home** | Maintenance items are both a reference list (browsable categories) AND scheduled recurring tasks (with completion history as the lookback record). The wizard creates items in a maintenance list (PRD-09B) with linked recurring tasks (PRD-09A). Task completion IS the historical record — no separate journaling needed. "When did I last replace the furnace filter?" / "When was Ruthie's last neurology appointment?" / "When is our next date night due?" = task completion history. "When is it due next?" = recurrence rule. One wizard component with category-driven presets: Home, Vehicles, Health & Wellness, Pets, Garden/Yard, Financial, Kids, Relationship/Marriage, Custom. |
| 28 | **Kid milestones captured via Family Feed + Archives, not a list** | "First steps," "first word," "started talking" are Family Feed moments tagged per-child as milestones. They become part of the child's milestone timeline in Archives (PRD-13). The feed handles the shareable moment; Archives stores the structured context. A "Milestones" filtered view on the feed shows a chronological growth story per child. |

### Deferred

| # | Item | Deferred To | Reason |
|---|------|-------------|--------|
| 1 | Supabase persistence for wizard draft state | Phase 5 polish | Wait for beta signal that cross-device resume is needed. localStorage sufficient for typical single-session wizard completion. |
| 2 | Upload-your-own image for color reveal | Post-MVP | Library has 30+ images already. Custom upload adds image handling complexity. Available from normal edit view if added later. |
| 3 | Actual personality test questionnaires in InnerWorkings | Future AI Vault content | Wizard captures what mom knows now. Validated assessments are educational content, not setup steps. |
| 4 | Subject time tracking (timer-duration based) | PRD-28B (Compliance Reporting) | Timer-based tracking (start/stop for Math, Reading, etc.) feeds compliance reporting. Different data model from tap-to-increment tally. The wizard for setting it up could live in this wizard system as the Timer Duration wizard, but the feature itself is PRD-28B scope. |
| 5 | Animated coin jar visual variant | PRD-10/PRD-24B backlog | Needs design and build as `visual_variant = 'coin_jar_animated'` on tally widget type. Not currently built. |

---

## Gamification Wizards — New Additions

The original feature decision doc did not include gamification-specific wizards. These are added based on session review of PRD-24.

### Gamification Setup Wizard (per-child)

**Entry point:** First-time gamification setup for a child, OR Settings -> Family Members -> [Child] -> Gamification, OR Studio "Rewards & Gamification" section.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What do they earn?** | Currency name (stars, coins, gems, points — or custom). Icon picker. |
| 2 | **How do they earn?** | Point rate per task (default 10). "Higher points for harder tasks? You can set per-task values later." |
| 3 | **How do they see progress?** | Visualization mode picker with previews: Counter, Level, Progress Ring, Minimal Badge, Hidden. |
| 4 | **Streaks** | Grace period (strict / 1 day / 2 days). Schedule-aware toggle. |
| 5 | **Levels** | Auto-calculated (default) or custom. If custom: name and point threshold per level. |
| 6 | **Review & deploy** | Summary. Widget auto-deploys to child's dashboard. |

### Reward Menu Wizard

**Entry point:** Gamification Setup Wizard "next step" prompt, OR Settings, OR Studio.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What can they earn?** | BulkAddWithAI: "List rewards — one per line. Include a point cost if you want." AI parses into structured items. |
| 2 | **Approval** | Per-reward toggle: auto-approve or requires mom approval. Default: requires approval. |
| 3 | **Treasure boxes?** | "Want to wrap any of these in a treasure box surprise?" Quick link to Treasure Box Wizard for any items mom selects. |
| 4 | **Review** | Reward list with point costs. Deploy. |

### Treasure Box Wizard

**Entry point:** Reward Menu Wizard link, OR Settings, OR Studio.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **Name the box** | Title (e.g., "Weekly Reward Box," "Reading Challenge Prize"). |
| 2 | **When does it unlock?** | Three cards: "After earning enough points" (points threshold) / "When a specific task or tracker is completed" (completion unlock) / "After doing something X times" (count-based). |
| 3 | **What's inside?** | "Pick a reward" (from reward menu) / "Random draw" (link to a Randomizer list). |
| 4 | **Pick the reveal** | Reveal animation visual picker with previews showing ALL existing reveal types: treasure chest videos (30+ variants including pirate, princess, medieval, steampunk, candy land, gemstone, lisa frank, egg, gift box, slot machine), envelope opening, box opening, spinner wheel, scratch-and-reveal, pick a card (card flip), pick a door (three doors). Both video reveals and interactive CSS/SVG reveals available. |
| 5 | **Repeating?** | One-time / Repeating (re-locks after opening, progress resets). |
| 6 | **Review & deploy** | Summary. Auto-deploys widget to child's dashboard. |

### Visual World / Overlay Wizard

**Entry point:** Gamification Setup Wizard "next step" prompt, OR Settings, OR Studio.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **Choose a world** | Visual Theme picker with preview thumbnails (Woodland Felt, Pets, Dragons, etc. — whatever themes are available). |
| 2 | **Choose a game mode** | Game mode cards with descriptions per PRD-24A (Sticker Book, Collection, etc.). |
| 3 | **Set the background** | Background image picker from the selected theme's available backgrounds. Deploys to child's dashboard. |
| 4 | **Review** | Summary of theme + game mode + background. Deploy. |

### Family Leaderboard Wizard

**Entry point:** Studio, OR Family Hub setup.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **Who competes?** | MemberPillSelector (multiplayer forced). |
| 2 | **What metric?** | Completion percentage (default, fairest across ages) / raw points / streak days / custom. |
| 3 | **Period** | Weekly (default) / monthly / all-time. |
| 4 | **Visibility** | "Visible to kids?" toggle. "Anonymous rankings?" toggle. |
| 5 | **Review & deploy** | Summary. Deploys to Family Hub and optionally personal dashboards. |

---

## Revised Tally Wizard Design

Replaces the original 10-preset Tally Wizard (Section 1A) in the feature decision doc.

### One Universal Wizard, Suggested Titles as Starting Points

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What are you tracking?** | Scrollable suggested title row: "Best Intentions practice," "Books read," "Chore points," "Goals completed," or free text. Mom can type anything. Suggestions are name seeds, not different wizard paths. |
| 2 | **Who is this for?** | MemberPillSelector. Single or multiple. If multiple: "Create one for each person, or one shared tracker?" Shared -> multiplayer mode. "One for each" -> batch creates N widgets at deploy, summary shows all as a group. |
| 3 | **How does this count up?** | Three options: (A) "Automatically when a task is completed" -> task picker showing existing tasks for the assigned member, OR inline mini-task-creation (title, assignee, recurrence). (B) "Link to an existing item" -> browse existing tasks, routines, Best Intentions for the member. (C) "I'll tap it manually" -> no link, dashboard widget has a tap button. |
| 4 | **Set a goal** | Target number input. "No goal — just count" toggle (sets target to null). If goal set: "When [Name] reaches [target], they'll see a celebration!" |
| 5 | **Pick a look** | Visual variant picker with previews: Star/sticker chart, Bar graph, Progress circle (requires goal), Color reveal (requires goal, opens image picker from 30+ existing library images), Coin jar (animated — when built), Thermometer, Tally marks. |
| 6 | **Reward reveals?** | Optional. "Want a celebration at milestones along the way?" If yes: interval picker (every 5, every 10, at the goal, custom). Reveal animation picker browsing existing 30+ video library (treasure boxes, envelopes, card flip, three doors, etc.). Optional: prize image or text description, OR link to a randomizer prize list. |
| 7 | **Review & deploy** | Summary: title, assigned to, counting method, goal (or "counting forever"), visual, reward reveals. WizardTagPicker. DashboardDeployPicker. [Deploy to Dashboard]. |

### Notes

- The "How does this count up?" step is the critical addition that solves the dead-end problem where mom can't set up a tracker because the linked task doesn't exist yet.
- Color reveal visual selection triggers an image picker sub-step showing the existing `coloring_image_library` images in grayscale preview. Goal number determines how many color gradient zones the image is split into (max ~50).
- When "one for each person" is selected in step 2, the wizard creates N separate `dashboard_widgets` records in a batch at deploy. The review step shows all of them as a group. One tap deploys all.
- The existing "Track This" quick-creation flow (PRD-10 Screen 5) remains as the speed path for mom who already knows what she wants. Wizards are the discovery/guided path. Studio cards open wizards; Track This stays as its own entry point from QuickTasks strip, LiLa, and Smart Notepad.

---

## Holes Identified — Requiring Future Decisions

These items were identified during review but not yet resolved. They need decisions before build.

### 1. ConnectionOffersPanel accessibility from edit views

The wizard configures connections (allowance, reward reveals, rhythms, etc.) in its "Extras" step, but once deployed, the normal edit form doesn't expose those connection options. Two approaches:

- **Option A:** Make ConnectionOffersPanel a standalone component that also appears in normal edit views.
- **Option B:** Add a "Re-run wizard for this item" option on existing widget detail pages.

**DECIDED: Option A** — ConnectionOffersPanel as standalone component in edit views. Implementation constraint: **unobtrusive**. Renders as a collapsed "Connect this to other features" expandable section at the bottom of edit forms. Not in-your-face. AND: if there's nothing available to connect to (features not built yet, no relevant connections for this item type), the section doesn't render at all. No empty expandable, no "coming soon" — just absent.

### 2. RecurringItemBrowser scope for Streak Wizard

**DECIDED: Yes to both.** Best Intentions are absolutely streakable — the whole point is building patterns. And individual routine steps are streakable too. If mom wants to streak "brush teeth" specifically and not the whole bedtime routine, she should be able to.

**RecurringItemBrowser full query scope (6 sources):**
- `tasks` WHERE `recurrence_rule IS NOT NULL` — recurring standalone tasks
- `task_templates` WHERE `task_type='routine'` — whole routines
- `task_template_steps` (via `task_template_sections`) — individual routine steps (e.g., "brush teeth" inside "Bedtime Routine")
- `dashboard_widgets` WHERE `template_type='checklist'` — daily checklist widgets
- `best_intentions` WHERE `is_active=true` — active Best Intentions (streaking the practice pattern)
- `homeschool_subjects` WHERE `is_active=true` — school subjects (streak daily math, daily reading, etc.)

Display grouping in the browser: Routines (whole + individual steps expandable), School, Habits & Tasks, Best Intentions, Checklists, Custom.

### 3. Archives wizard medical prompt framing

The Health & Medical folder prompts ("Diagnoses?", "Medications?") need warm framing that matches the platform tone. Suggestion: "Does [child] have any medical needs that help us understand them better?" rather than clinical intake language.

**Status:** Accepted direction, needs copywriting pass before build.

### 4. Coin jar animated visual variant — build timing

**DECIDED: Defer.** We have enough visuals to launch with. The tally wizard ships with star chart, bar graph, progress circle, color reveal, thermometer, and tally marks. Animated coin jar (`visual_variant = 'coin_jar_animated'`) comes later in a visual variant build pass. Already tracked in Deferred item #5.

### 5. Verify color reveal increment trigger

Current color reveal wiring needs verification — does the color increment fire on task completion via the gamification event pipeline, or on manual button press, or both? Claude Code should verify the existing implementation before the wizard's "link to task" step is built.

**Status:** Verify during build. Not a design decision — implementation check.

---

## Beta Tester Validation — List Wizard Priority

A prospective beta tester (stay-at-home mom, Etsy shop, husband + 3 kids ages 7-13, kids in sports/activities) described her current system. Her needs map directly to existing platform concepts and validate list wizard priority:

| What She Described | Maps To | Wizard Needed |
|---|---|---|
| "Main to-do list of things in the next few weeks" | To-Do list type (PRD-09B) | Universal List Wizard with To-Do preset |
| "Bigger things that get pushed to the bottom and never get done" | To-Do items with priority flagging -> BigPlans promotion | Same wizard, AI detects complexity and suggests "Is this actually a bigger project?" |
| "List with my husband of things we need to get done" | Shared To-Do list | Universal List Wizard -> "Who shares this list?" step |
| "Long list in my mind of things too small to put on a list" | MindSweep / brain dump -> Smart Notepad -> Review & Route | Not a new list — it's the existing MindSweep pipeline. Wizard on-ramp = "Just dump everything." |
| "Lists for summer break with schedule ideas and fun things" | Planning/idea list (reference collection with future dates) | Universal List Wizard with planning preset |
| "Calendar pages with things to remember next year" | Family Feed moments + Journal entries + Maintenance Schedule (see Decision #24) | No new list type — existing systems with tag-based lookback |

---

## Revised Opportunity Board Wizard

Replaces the original Opportunity Board Wizard (Section 2E) in the feature decision doc.

### Key Changes from Original

- Bulk add is the **primary** creation path, not one-at-a-time
- Multiple board categories coexist on one board (earning, learning, "I'm bored" activities, etc.)
- Items can arrive from BulkAddWithAI, Smart Notepad route-and-review, or individual add
- The wizard creates the board and seeds it; mom adds more items over time through any input channel

### Steps

| # | Step | What Happens |
|---|---|---|
| 1 | **What kinds of opportunities?** | Multi-select category cards (not single-select): "Earning" (chores for money/points), "Learning" (educational extras), "Boredom Busters" (activities/play), "Helping Out" (family contribution without pay), "Custom." Mom can pick several — one board can have mixed categories. |
| 2 | **Dump them all** | BulkAddWithAI textarea as the primary input. "List all the opportunities you can think of — earning chores, learning activities, fun stuff, anything. We'll sort them." AI parses into structured items with suggested categories, reward amounts, and opportunity sub-types (claimable/repeatable/capped). Mom reviews and adjusts. |
| 3 | **Who can browse?** | MemberPillSelector. "Which family members can see and claim from this board?" |
| 4 | **Completion rules** | "Does mom need to approve before the reward is given?" toggle (default on). "Can kids add photos as evidence?" toggle. |
| 5 | **Connect it** | "Deploy a tracker widget that shows earnings?" (auto-creates tally). "Count toward allowance?" |
| 6 | **Review & deploy** | Summary: N items by category, total possible earnings, assigned members. "You can add more anytime — type them in, brain dump to your notepad, or just tell LiLa." |

### Ongoing Add Paths (Post-Wizard)

- **Individual add:** [+ Add Opportunity] button on the board detail page
- **BulkAddWithAI:** "Add several at once" option on the board detail page
- **Smart Notepad -> Review & Route:** Mom writes "clean the garage $5, organize playroom $3" in notepad, routes to Opportunity Board, AI categorizes and adds
- **LiLa:** "Add 'wash the car for $4' to the kids' opportunity board"

---

## Revised Routine / Checklist Approach

The original feature decision doc had a standalone Checklist Wizard (Section 1D). This is **removed as a separate wizard** per Decision #20.

### What Replaces It

The existing Routine Builder Wizard (`RoutineBuilderWizard.tsx`) is enhanced with a kid-focused setup path:

**Current state:** The Routine Builder already handles segments (section titles), tasks within segments, subtasks, and connections to randomized opportunity lists.

**What's needed:**

1. **LiLa-suggested routines for kids** — When mom selects a child in the routine builder, LiLa can suggest age-appropriate routine templates: "Morning routine for a 7-year-old" or "Bedtime routine for a teen." Mom edits/approves per Human-in-the-Mix.

2. **Simplified kid-focused entry point** — A "Set up [child]'s routine" card in Studio or first-visit detection that opens the Routine Builder pre-configured for that child's shell type (Play gets big tile tasks, Guided gets structured steps with subtask support).

3. **Per-segment time-of-day tracking** — For Guided and Play shells, the ability to track different things in different segments of the day (morning tasks tracked differently than evening tasks). This is the specific gap the founder identified.

4. **Brain dump path** — Mom describes the routine in natural language ("brush teeth, get dressed, pack bag, eat breakfast, put on shoes") and AI organizes into ordered steps within segments. Already exists via BulkAddWithAI but needs better framing in the wizard flow.

---

## Universal List Wizard — New Design

Replaces the individual list wizards (Shopping, Expenses, School Expenses, Standard) from Phases 2A-2D in the feature decision doc with a single universal list wizard that handles all list types through AI-first input.

### Design Philosophy

Mom doesn't think in list types. She thinks "I need a list of things to get done around the house" or "I need to track what we're spending on school stuff." The wizard's job is to understand what she needs and configure the right list type with the right fields, sharing, and view.

### Steps

| # | Step | What Happens |
|---|---|---|
| 1 | **What's this list for?** | Free text description OR pick from suggested starting points: "Things to get done" (to-do), "Shopping/groceries" (shopping), "Things to buy eventually" (expenses), "Packing for a trip" (packing), "Gift ideas/wishlist" (wishlist), "School expenses" (expenses with school preset), "Maintenance schedule" (opens Maintenance Schedule Wizard instead), "Ideas and planning" (custom reference), "Prayer/intentions" (prayer), "Something else" (custom). AI can also detect type from free text: "stuff we need from costco" -> shopping. |
| 2 | **Dump your items** | BulkAddWithAI textarea. "List everything — one item per line, or just brain dump it all and we'll organize it." AI parses into structured items with appropriate fields for the detected list type (prices for expenses/wishlist, quantities for shopping, sections/categories auto-suggested). |
| 3 | **Who shares this?** | "Just me" (default) / "Me and [specific people]" (MemberPillSelector) / "Whole family." For to-do lists: "Should anyone be able to add items, or just you?" |
| 4 | **Organize it** | AI-suggested sections/categories shown for review. Mom can accept, rename, add, remove. Shopping -> store sections. Expenses -> spending categories. To-Do -> priority groups. |
| 5 | **Extras** | Context-dependent based on list type: To-Do -> "Any of these should become real tasks?" (per-item promote toggle). "Any of these are actually bigger projects?" (BigPlans flag). Shopping -> "Auto-sort items into sections?" Expenses -> "Set a budget cap?" Wishlist -> "Share with gift-givers?" |
| 6 | **Review & deploy** | Summary with item count, sharing, list type. "You can add more anytime — type them in, brain dump to your notepad, or tell LiLa." |

---

## Maintenance Schedule Wizard — List + Recurring Task Hybrid

A new wizard that creates a **browsable reference list** (categorized maintenance items) with **linked recurring tasks** (schedule + completion tracking). The task completion history IS the lookback record — no separate journaling needed. Applies to ALL areas of life, not just home.

### Why This Needs Its Own Wizard

Maintenance items span two systems: a list (the browsable container of all items by category) and tasks (the scheduled recurrence + completion history). Setting this up manually requires creating a list, then separately creating recurring tasks, then somehow linking them. The wizard does it in one flow.

### Steps

| # | Step | What Happens |
|---|---|---|
| 1 | **What are you maintaining?** | Category picker that loads different suggested items and default frequencies: **Home** (HVAC, plumbing, exterior, appliances, seasonal), **Vehicles** (oil changes, tire rotation, registration, inspections, emissions), **Health & Wellness** (annual physicals, dental cleanings, eye exams, prescription refills, mammograms, bloodwork), **Pets** (vet visits, vaccinations, flea/heartworm treatments, grooming), **Garden/Yard** (planting schedule, fertilizing, seasonal prep, equipment maintenance), **Financial** (insurance renewals, tax deadlines, subscription reviews, license renewals), **Kids** (well-child visits, dental appointments, vision checks, immunization schedules, school registration deadlines), **Relationship/Marriage** (date nights, anniversary planning, relationship check-ins, couples devotional, weekend getaways), **Something else** (free text). Mom can pick multiple categories for one combined schedule, or create separate schedules per area. |
| 2 | **What needs doing?** | BulkAddWithAI brain dump OR review/edit the suggested items from the selected categories. "List everything you can think of that needs regular attention — we'll help you set the schedule." AI categorizes any free-text input into the appropriate category. Mom can add, remove, or adjust any suggestion. |
| 3 | **How often?** | Per-item frequency picker with smart defaults per category: furnace filter = quarterly, roof inspection = annual, oil change = every 5000 miles or 6 months, dental cleaning = every 6 months, date night = weekly or biweekly, vet visit = annual, tax filing = annual, etc. Options: weekly, biweekly, monthly, quarterly, twice yearly, annually, every 2 years, "when needed" (no schedule — just track when done). Mom can adjust any default. |
| 4 | **Reminders?** | "Create calendar reminders?" toggle (default on). "How far ahead?" — 1 week, 2 weeks, 1 month. Per-item or blanket setting. |
| 5 | **Who handles what?** | Default: shared (whoever gets to it). Per-item assignment available: Mom, Dad/husband, teen, "hire someone" (creates a to-do reminder instead of a task), "together" (for relationship items — both assigned). |
| 6 | **Review & deploy** | Summary: N items across N categories, N with schedules, N assigned. Creates: (A) a `maintenance` list with categorized items, (B) recurring `tasks` linked to each scheduled item, (C) optional calendar events for reminders. "When you mark something done, it's recorded. Next time you wonder 'when did we last...?' — it's right here." |

### Data Model

- Creates a `list` record with `list_type = 'maintenance'` (new list type config in PRD-09B — no schema changes, just config)
- Each list item links to a `task` via `promoted_task_id` with `recurrence_rule` set per the wizard's frequency selections
- Task completions create `task_completions` records — these are the historical log
- "When did I last do this?" = query `task_completions` for the linked task, sorted by date
- "When is it due next?" = `recurrence_rule` on the task calculates next occurrence

### Category Presets (Suggested Items + Default Frequencies)

| Category | Example Items | Default Frequencies |
|---|---|---|
| **Home** | Replace furnace filter, clean gutters, inspect roof, flush water heater, test smoke detectors, clean dryer vent, power wash exterior | Quarterly, twice yearly, annual, annual, twice yearly, annual, annual |
| **Vehicles** | Oil change, tire rotation, brake inspection, registration renewal, emissions test, replace wipers, check tire pressure | Every 5k miles/6mo, every 7.5k miles, annual, annual, per state schedule, twice yearly, monthly |
| **Health & Wellness** | Annual physical, dental cleaning, eye exam, dermatology check, mammogram/screening, prescription refills, bloodwork | Annual, every 6mo, annual, annual, per doctor recommendation, per prescription, annual |
| **Pets** | Vet wellness visit, vaccinations, flea/heartworm treatment, grooming, dental cleaning, nail trim | Annual, per schedule, monthly, every 6-8 weeks, annual, monthly |
| **Garden/Yard** | Fertilize lawn, winterize sprinklers, prune trees, sharpen mower blades, plant seasonal flowers, mulch beds, clean garden tools | Per season, annual, annual, annual, twice yearly, annual, end of season |
| **Financial** | Review insurance policies, file taxes, renew subscriptions, check credit report, update beneficiaries, review budget, renew licenses/registrations | Annual, annual, per subscription, annual, annual, monthly/quarterly, per expiration |
| **Kids** | Well-child visit, dental appointment, vision check, immunization updates, school registration, sports physicals, update emergency contacts | Per pediatrician schedule, every 6mo, annual, per schedule, annual, annual, annual |
| **Relationship/Marriage** | Date night, anniversary planning, relationship check-in conversation, couples devotional/study, weekend getaway, write a love note, pray together | Weekly/biweekly, annual (start planning 1mo ahead), monthly, weekly, quarterly, weekly, daily |

These are **suggestions, not requirements**. Mom keeps what resonates, deletes what doesn't, adds her own. The AI brain dump path handles "I just want to type everything I can think of" without needing to pick from presets.

---

## Records, Milestones & Memories — Not a List, Not a Wizard

The beta tester's "calendar pages with things to remember next year" and the kid milestones use case (first steps, first word, etc.) do NOT need a wizard or a new list type. They are captured through existing systems:

### Where Each Use Case Lives

| Use Case | Capture Method | Storage | Lookback View |
|---|---|---|---|
| **Annual memories** ("planted 12 tomatoes," "peach harvest week 3," "attended fall festival") | Smart Notepad -> tag `annual` + topic tags (`garden`, `traditions`) | Journal entry (PRD-08) and/or Family Feed moment (PRD-37) | Family Feed filtered by tag + "this month last year" |
| **Kid milestones** ("first steps," "first word," "started reading") | Family Feed post (maybe with photo), tagged per-child + `milestones` | `family_moments` (PRD-37) + Archives context (PRD-13) | Family Feed -> child filter -> milestones tag = chronological growth timeline |
| **Seasonal traditions** ("decorated tree Nov 28," "started advent Dec 1") | Smart Notepad or Family Feed, tagged `traditions` `annual` | Journal entry or `family_moments` | "This time last year" filtered view surfaces them next year |
| **Home maintenance records** ("replaced furnace filter," "got roof inspected") | Task completion on a recurring maintenance task (Home Maintenance Wizard output) | `task_completions` table | Task completion history sorted by date |

### The "This Time Last Year" View

This is a **filtered query**, not a separate feature:

- **Family Feed version:** Show all `family_moments` where any tag matches `annual`, `milestones`, or `traditions` AND `created_at` is within the same month of the previous year(s). Surfaced as a "Memories" section on the Feed, similar to how social media shows "On This Day."
- **Journal version:** Show all journal entries tagged with lookback-relevant tags from the same month in previous years. Surfaced in Rhythms (PRD-18) monthly review section.
- **Calendar version:** Annual events created from any of the above can generate calendar events that recur yearly as reminders.

### What the Wizard System Does for This

No dedicated wizard needed. Instead:

- **First-visit nudge on Family Feed:** "Want to capture moments you'll want to remember next year? Just post them here and tag them 'annual' — we'll remind you when the time comes."
- **Smart Notepad tag suggestions:** When mom writes something that sounds like a memory or milestone, AI suggests appropriate tags (`annual`, `milestones`, child name).
- **LiLa context:** LiLa can proactively say "It's April — last year around this time you planted tomatoes and started the garden. Want to plan this year's garden?"

---

## Build Priority — Revised Family-First Ordering

Updated to reflect list wizard promotion to Tier 1 and beta tester validation.

### Tier 1 — Build First

| Wizard | Why |
|--------|-----|
| **Universal List Wizard** | Immediate daily need (shared to-do lists, house lists, things to get done). Beta tester validates as universal mom pain point. Uses existing PRD-09B list infrastructure. |
| **Tally Wizard (universal)** | Best Intentions tracking, goal tracking with set numbers. Core daily-use tool. |
| **Gamification Setup Wizard (improvements)** | Currently in Build M. Fill gaps in existing setup, don't rebuild. |
| **Opportunity Board Wizard** | Multiple kids earning — high daily value. Bulk add path is the key improvement. |
| **Streak Wizard** | Routine streaks are already a motivational tool in active use. |

### Tier 2 — Build Next

| Wizard | Why |
|--------|-----|
| **Routine Builder (kid-focused enhancement)** | Better kid routine setup replaces standalone Checklist Wizard. LiLa-suggested routines. |
| **Maintenance Schedule Wizard** | List + recurring task hybrid for all life areas (home, vehicles, health, pets, kids, relationship). Immediate practical value for any family. |
| **Reward Menu + Treasure Box Wizards** | Complete the gamification setup experience. |
| **Best Intentions Wizard** | Core identity feature, wizard makes first-time setup inviting. |
| **Guiding Stars Wizard** | Core identity feature, same reasoning. |

### Tier 3 — Build When Ready

| Wizard | Why |
|--------|-----|
| Money Wizard | PRD-28 dependency — build after Tracking, Allowance & Financial. |
| Percentage Wizard | Useful but not urgent for current family stage. |
| Mood & Check-In Wizard | Sensory regulation tracking relevant for specific family members. |
| Visual World / Overlay Wizard | After gamification themes are further along. |
| Sequential Path Wizard | Curriculum tracking — relevant for homeschool but not first priority. |

### Tier 4 — Polish Phase

| Wizard | Why |
|--------|-----|
| Connection flows (Phase 3 glue) | Important but dependent on other wizards existing first. |
| InnerWorkings + Archives wizards | Valuable but not blocking daily use. |
| First-visit detection (Phase 5) | Polish layer — build after wizards exist to detect toward. |
| Supabase persistence for wizard drafts | Only if beta usage shows need. |

### Shared Infrastructure — Build Before Any Wizard

1. `WizardProgressSaver` — localStorage persistence with versioned keys
2. `WizardTagPicker` — tag selector for final review step
3. `ConnectionOffersPanel` — "want to connect this to..." section (pending decision on edit-view accessibility)
4. `DashboardDeployPicker` — multi-dashboard deployment
5. `RecurringItemBrowser` — for universal streak wizard (pending scope decision on Best Intentions)

---

*Created: April 15, 2026*
*Updated: April 15, 2026 — Added decisions 18-28, beta tester validation, revised Opportunity Board wizard, routine/checklist merge, Universal List Wizard, Maintenance Schedule Wizard (life-wide list + task hybrid with 9 category presets including Relationship/Marriage), Records/Milestones/Memories pattern (journal tags + Family Feed, not a list type), revised build priority*
*Reference: Universal-Setup-Wizards.md, PRD-09A, PRD-09B, PRD-10, PRD-24, PRD-24A, PRD-24B, PRD-06, PRD-07, PRD-08 (Journal/Notepad), PRD-13 (Archives), PRD-17B (MindSweep), PRD-37 (Family Feeds)*
