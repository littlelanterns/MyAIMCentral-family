# PRD-18 Enhancement Addendum: Rhythms as the Activation Engine

**Status:** Approved
**Created:** April 7, 2026
**Session:** PRD-18 Enhancement Planning
**Touches:** PRD-18, PRD-09A, PRD-10, PRD-11, PRD-17B, PRD-23, Backburner Addendum

---

## Overview

This addendum captures eight enhancements to PRD-18 (Rhythms & Reflections) that transform Rhythms from a daily habit feature into the platform's **activation engine** — the guided onramp that introduces users to other parts of the app organically, helps them engage gradually, and makes the platform sticky without ever doing anything just to drive engagement.

**Core value principle (binding):** "Providing value for them also benefits us, but err on the side of providing value." Discovery nudges and AI interactions in rhythms must be genuinely helpful, not engagement-driven. If surfacing a feature wouldn't actually help this user right now, don't surface it.

**Context:** The founder's family are the primary initial users. They can all log in, the Guided Dashboard is built, Victory Recorder is building, Reflections are already built, and the family already has a nightly reflection habit from StewardShip (V1). The main barrier to switching is facing an empty app and not knowing where to start. Rhythms solve this by saying "start here, do this" and gradually introducing the rest of the platform.

**Teen context:** The founder's teens are active target users, not an afterthought. They have full BookShelf access with a rich library including teen-specific titles. The rhythms should help them build planning habits, process their mental noise, discover the platform's tools, and feel like the app is *theirs* — not mom's app that they're forced to use.

---

## Enhancement 1: Evening Tomorrow Capture (Conversational Task Planning)

**Replaces/enhances:** PRD-18 Evening Rhythm Section 6 ("Tomorrow's Priorities")

**What changed:** The original section showed AI-suggested top priorities + freeform "What do I want tomorrow to feel like?" The enhanced version captures what's on the user's mind for tomorrow through rotating conversational prompts with fuzzy task matching — designed to feel like a brain dump, not a commitment.

### Rotating Evening Prompts

The section header **rotates through different framings** on different nights, so it never feels like the same "build your to-do list" chore:

- "What do you want to get done tomorrow?"
- "What's on your mind for tomorrow?"
- "Anything you want to remember for tomorrow?"
- "What would make tomorrow feel like a good day?"

Same function every time — the system captures text, fuzzy-matches against existing tasks, and creates/prioritizes tasks behind the scenes. But the emotional weight of the interaction shifts nightly. The user stops seeing it as a planning tool and starts seeing it as a place to dump what's floating around.

### How It Works

1. User sees the rotating prompt with **3 text inputs by default** plus a **[+] button** to add more
2. As the user types in each field, the system does a **loose fuzzy match** against their existing task list
3. If a match is found: a confirmation appears — "Did you mean: [matched task title]?" with a [Yes] button. Tapping Yes prioritizes/stars that task for tomorrow.
4. If no match: the system creates a lightweight task automatically with `source = 'rhythm_priority'` and tomorrow's date
5. The [+] button allows adding beyond 3 — no hard cap, but overflow handling kicks in (see below)

### ADHD-Aware Overflow Handling

When the user adds **6 or more items** (the ADHD "I can do ALL THE THINGS" mode), the system gently helps without dismissing:

1. **Everything gets added to the task list** — nothing is lost, nothing is judged
2. A gentle prompt appears: "That's a full day! Want to pick your top 3 to focus on, or should we pick based on due dates?"
3. **If they pick** — those 3 become the morning focus items
4. **If the system picks** — nearest due dates + starred items get priority
5. **Morning rhythm shows the 3 focus items** with a subtle "and X more on your list" link to the full task view

This respects the brain that generated all those ideas while protecting the morning from overwhelm. Nothing is deleted — the overflow items are real tasks, they just don't dominate the morning.

### Morning Recall

A **new morning section** pulls the previous evening's focus items (the 3 selected or auto-selected priorities). Framing: "Here's what you wanted to focus on:" — their own words reflected back, not a directive. If they had overflow items, a subtle link shows "and X more on your list."

### Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Fuzzy match with confirmation, not silent** | Silent matching risks wrong matches. "Did you mean this task?" respects the user's intent. |
| 2 | **Auto-created tasks tagged `source = 'rhythm_priority'`** | Distinguishes rhythm-created tasks from formally created ones. Enables morning recall to render as its own section. |
| 3 | **Stored in `rhythm_completions.metadata` JSONB** | No new table needed. Morning rhythm reads the previous evening's completion record. Simple. |
| 4 | **New morning section type: "Morning Priorities Recall" (Section Type #31)** | Sits between Guiding Star rotation and Task Preview. Connects evening → morning. |
| 5a | **Rotating prompt language** | Prevents the section from feeling like a nightly to-do list builder. Different framing each night keeps it fresh and reduces the "I have to pick the MOST IMPORTANT things" anxiety. |
| 5b | **3 default inputs + overflow with gentle focus selection** | Respects the ADHD brain that wants to capture everything while protecting the morning from a 12-item overwhelm list. Nothing is lost — just focused. |

---

## Enhancement 2: MindSweep-Lite (Evening Mental Loop Capture)

**New section in Evening Rhythm: "Something on your mind?"**

### What It Is

A mini version of the full MindSweep (PRD-17B) embedded in the evening rhythm. The user dumps whatever is looping in their mind as freeform text, and Haiku (Claude Haiku) parses it into discrete items and auto-suggests a disposition for each one.

### Position in Evening Sequence

After "3 Most Important Things for Tomorrow" (Enhancement 1), before Reflections. The evening arc becomes: celebrate → plan tomorrow → clear your head → reflect → close.

### How It Works

1. Section appears as a **collapsed expandable**: "Something on your mind?" with a chevron. Tap to expand.
2. On certain occasions (configurable — e.g., once per week, or when activity log shows elevated task volume), the section **auto-expands** with a gentle prompt: "Busy day — want to clear your head before bed?"
3. User types freeform text — anything looping, worrying, nagging
4. On save, Haiku parses the text into discrete items and suggests a disposition for each:
   - **Schedule** — creates a task (on Close My Day)
   - **Delegate** — creates a message/request to another family member (on Close My Day)
   - **Note** — saves to Smart Notepad (on Close My Day)
   - **Backburner** — adds to the user's Backburner list (on Close My Day)
   - **Release** — acknowledges and lets go. No record created. The act of naming it and choosing to release is the value.
5. Each item shows with its suggested disposition as a **one-tap tag**. User can tap to cycle through alternatives or confirm.
6. **All records are batched and created on "Close My Day"** — nothing interrupts the evening flow. The items and their dispositions are stored in `rhythm_completions.metadata` as `{mindsweep_items: [{text, disposition, created_record_id, created_record_type}]}`. Actual records (tasks, notepad tabs, backburner items, messages) are created when the rhythm completes.

### AI Cost

Haiku single-turn call. Cost estimate: ~$0.001 per MindSweep-lite interaction. At 3-4 uses per week for a heavy user, negligible. Same cost architecture as MindSweep auto-sort (PRD-17B).

### Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 5 | **Haiku auto-suggests disposition with one-tap confirm/override** | Makes it effortless — dump your thoughts, AI sorts, you just approve. Override available for when the suggestion is wrong. |
| 6 | **Batch all record creation on Close My Day** | Keeps the evening flow lightweight. No context-switching to task creation or notepad mid-reflection. Everything processes as one commit. |
| 7 | **Collapsed by default, occasionally auto-expands** | Not every night needs a brain dump. But when mental loops are loud, it's right there. Auto-expand frequency configurable. |
| 8 | **New section type: "MindSweep-Lite" (Section Type #28)** | Available in Evening rhythm and Custom rhythms. |

---

## Enhancement 3: Morning BookShelf Semantic Pull ("Something to Think About")

**New section in Morning Rhythm**

### What It Is

A thought-provoking morning question that, when engaged with, triggers a semantic search against the user's BookShelf extractions and surfaces relevant passages with links into the BookShelf.

This serves double duty: it's a **mini friction-finder** that helps the platform learn what the family is working on AND it's an **engagement hook** into BookShelf content. Over 30 days of morning rhythms, the responses accumulate into a rich picture of what this family is actually thinking about — without them ever sitting down for a formal assessment.

### How It Works

1. Section shows a question from a curated pool, labeled "Something to think about"
2. Below the question: an **optional** text box ("What comes to mind?")
3. Below the text box: 1-2 **passively matched** BookShelf extraction snippets based on the question itself (always shown, even if user doesn't type anything)
4. If the user types a response: the system runs a **semantic search** (pgvector, live query at rhythm open time) against their BookShelf extractions and shows 2-3 results matched to their specific response
5. Each result shows: book title + chapter, a brief extraction snippet, and a "See in BookShelf →" link that navigates to that book and location in the extractions

### Question Pool

A pool of **20-30 hand-authored growth/friction questions** seeded per family, similar to how the 32 default reflection prompts work. Categories:

- **Family friction**: "What's one routine in your family that could use a small improvement?"
- **Personal growth**: "What's a skill you wish you were better at?"
- **Relationship**: "What's something you wish you could communicate better to someone you love?"
- **Parenting**: "What's one thing you wish your kids understood about you?"
- **Time/energy**: "Where does your energy go that doesn't match your priorities?"
- **Values**: "What matters most to you that you haven't made time for lately?"
- **Curiosity**: "What question keeps coming back to you?"

LiLa can also generate **dynamic contextual questions** blended in, based on family activity (similar to dynamic reflection prompts). The hand-authored pool ensures quality even without AI.

### Empty BookShelf Handling

If the user has no BookShelf content (or only pre-seeded public domain books not yet extracted), the section still shows the question and the text box. Below, instead of extraction results, it shows a gentle onboarding nudge: "Add a book you love to get personalized morning insights." The question itself has value even without BookShelf content.

### Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 9 | **Section name: "Something to think about"** | Warm, inviting, not academic. Framing matters. |
| 10 | **Both passive + active paths** | Show extractions based on the question itself (passive) AND based on user's typed response (active). Works even if they don't type anything. |
| 11 | **Live pgvector query, not pre-computed** | HNSW index is sub-100ms. Content should reflect the user's current response dynamically. |
| 12 | **20-30 hand-authored questions + LiLa dynamic blend** | Hand-authored pool ensures quality. LiLa dynamic adds personalization when context warrants it. Same pattern as reflection prompts. |
| 13 | **Empty BookShelf shows question + onboarding nudge** | The question has standalone value. The nudge drives BookShelf adoption naturally. |
| 14 | **New section type: "Morning Insight / BookShelf Discovery" (Section Type #29)** | Available in Morning rhythm and Custom rhythms. |

---

## Enhancement 4: Smart Discovery Rotation

**New section type for Morning Rhythm**

### What It Is

A rotating nudge that surfaces one underused or undiscovered platform feature, powered by the activity log (being built as part of Victory Recorder). The system queries what the user has and hasn't interacted with, and surfaces a genuine, helpful suggestion.

### How It Works

1. The activity log tracks every feature interaction across the platform
2. The discovery engine queries: "What has this member NOT meaningfully engaged with in the last 14 days?"
3. From the pool of undiscovered features, it selects one and renders a nudge card
4. The card includes: a brief explanation of what the feature does, why it might help them, and a **direct action link** ("Create a tracker →", "Try the Decision Guide →")
5. Each nudge has a **dismiss** action ("Not interested") that removes that specific feature from the discovery pool for this user

### Frequency & Placement

- Appears at the **end of the morning rhythm**, before the "Start My Day" button
- Shows **2-3 times per week**, not every morning. At least one morning per week is discovery-free (pure routine)
- Once a user has meaningfully engaged with a feature (e.g., created a tracker, not just viewed the page), that feature exits the discovery pool automatically

### What Counts as "Meaningfully Engaged"

Not just page views. The activity log distinguishes between:
- **Viewed**: opened the page (doesn't exit discovery pool)
- **Engaged**: created content, configured settings, completed an action (exits discovery pool)

### Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 15 | **Interactive with direct action link, not just informational** | "Did you know?" without a path forward creates awareness but not adoption. The link makes trying it frictionless. |
| 16 | **2-3 times per week, with discovery-free mornings** | Prevents the rhythm from feeling like an ad for your own features. The consistent elements (Guiding Star, priorities, calendar) should always dominate. |
| 17 | **Dismiss per nudge + engagement tracking** | Respects user choice. Prevents resurfacing features they've already decided they don't want. |
| 18 | **New section type: "Feature Discovery" (Section Type #30)** | Available in Morning rhythm and Custom rhythms. |

---

## Enhancement 5: Carry Forward Redesign

**Replaces:** PRD-18 Evening Rhythm Section 5 ("Carry Forward" — per-task triage)

### What Changed

The original Carry Forward section showed incomplete tasks and asked the user to triage each one (move to tomorrow, reschedule, cancel, keep). This creates a nightly decision burden that's antithetical to the "never show what wasn't done" philosophy.

The redesign replaces per-task nightly triage with a **global fallback behavior setting** that the system applies automatically.

### Fallback Behavior Options

Mom sets a default once in Rhythm Settings (or Task Settings). The system applies it silently at midnight (or configured day-reset time):

| Behavior | What Happens | Best For |
|----------|-------------|----------|
| **Stay** | Task stays on the list indefinitely until done or manually removed | Users who chip away at things over time (ADHD-friendly default) |
| **Roll forward** | Task automatically moves to tomorrow at midnight | Users who want a fresh daily list |
| **Expire** | Task disappears after its due date | Time-sensitive items only |
| **Backburner** | After X days untouched (configurable, default 14), task quietly moves to the Backburner list | Users who want automatic decluttering |

### Scope

- **Global default** set once, applies to all tasks for that member
- **Per-task override** available for individual tasks that need different behavior
- The "3 things for tomorrow" (Enhancement 1) is the **positive version** of carry forward — instead of "here's what you didn't do," it's "what do you want to focus on?"

### Occasional Backlog Prompt

When accumulated incomplete tasks cross a threshold (configurable, default: 10+ tasks older than 14 days), the evening rhythm surfaces a **gentle, non-judgmental prompt**: "You have [X] things that have been sitting for a while. Want to do a quick sweep?"

This appears **at most once per week** and opens a simple triage view. This is NOT the nightly Carry Forward section — it's an occasional awareness prompt for large backlogs.

### Carry Forward Section Preserved

The original Carry Forward section (PRD-18 Section Type #20) remains in the section type library as a **toggleable option, still OFF by default**. Users who genuinely want nightly task triage can enable it. The fallback behavior system is the default, not the only option.

### Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 19 | **Global fallback default with per-task override** | Most users set one default and rarely override. Power users can customize per task. Removes nightly decision burden. |
| 20 | **"Stay" as the recommended default** | For ADHD users especially: things stay until you get to them. The system shouldn't make you feel bad about the gap between intention and action. |
| 21 | **Occasional backlog prompt, threshold-based, max once per week** | Awareness without nagging. The threshold prevents it from appearing when the backlog is small. The weekly cap prevents it from becoming its own source of guilt. |
| 22 | **Carry Forward section preserved but OFF by default** | Some users genuinely want nightly task review. The fallback system is the default, not the only option. |

---

## Enhancement 6: Tracker Rhythm Surface Configuration

**Enhancement to PRD-10 Widgets / PRD-18 Section Type #23**

### What Changed

The original PRD-18 Section Type #23 ("Custom Tracker Prompts") was limited to evening trackers. This enhancement makes it so **any tracker can be configured to surface in any rhythm** — morning, evening, weekly, or any custom rhythm.

### How It Works

- Each tracker widget gains a **`rhythm_keys` configuration** — a TEXT[] array specifying which rhythms it should appear in
- The configuration UI in widget/tracker settings includes a "Show in rhythms" multi-select: Morning, Evening, Weekly, or any custom rhythm keys
- When a rhythm renders, it pulls all trackers configured for that rhythm's key and displays them as quick-log inputs

### Examples

- **Water intake tracker** — surfaces in both Morning ("Start tracking") and Evening ("How'd you do?")
- **Medication tracker** — surfaces in Morning only
- **Mood tracker** — surfaces in Evening only (if mom chooses to create one — this is user-defined, not platform-imposed)
- **Blood pressure tracker** — surfaces in a custom "Health Check" rhythm

### Schema Change

Add `rhythm_keys` TEXT[] to the widget configuration JSONB in `dashboard_widgets.config`. Default: `[]` (no rhythm surfacing). The existing Section Type #23 ("Custom Tracker Prompts") is renamed to **"Rhythm Tracker Prompts"** — a generic section type available in any rhythm that pulls trackers configured for that rhythm's key.

### Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 23 | **Any tracker in any rhythm, not just evening** | Medication reminders need morning. Water tracking benefits from both. A mood tracker (if user-created) fits evening. The platform shouldn't assume when tracking happens. |
| 24 | **Section Type #23 renamed from "Custom Tracker Prompts" to "Rhythm Tracker Prompts"** | More accurate. It's not custom or evening-specific anymore. |
| 25 | **Mood tracking is NOT a default rhythm section** | "Moms will literally always be drained or tired. That's not a mood, that is the phase of life we are in." — Founder decision. Mood tracking, if desired, is a user-created tracker widget with their own scales and baselines. |

---

## Enhancement 7: Independent Teen Rhythm Experience

**Replaces:** PRD-18's "Reduced sections" approach for Independent Teen shell

### What Changed

The original PRD-18 treated teens as a reduced version of adults: fewer sections, lighter content, less engagement surface. This addendum upgrades teens to a **full, tailored rhythm experience** — not a stripped-down adult version, but a purpose-built teen version with age-appropriate framing, their own question pool, and the same planning/capture tools adapted for how teens actually think and live.

**Design principle:** Teens should feel like this is *their* app that happens to connect to their family, not mom's app that they're forced to use. Every section should feel useful to them personally, not like a parenting tool pointed at them.

### Teen Evening Rhythm (Default Template)

| # | Section | Default State | Notes |
|---|---------|--------------|-------|
| 1 | **Evening Greeting** | ON | Same warm greeting, teen-appropriate tone. "Hey [Name], how'd today go?" |
| 2 | **What Went Right Today** | ON | Victory summary — same data as adult Accomplishments & Victories, reframed. Not "victories" (sounds like mom celebrating), just "what went right." Task completions, manual wins, Best Intention taps. |
| 3 | **Tomorrow Capture** | ON | Same rotating prompt capture as adult (Enhancement 1) — fuzzy match, auto-create, overflow handling. Framed with same rotating prompts, which already use aspiration language that works for teens. |
| 4 | **MindSweep-Lite** | ON (collapsed) | Same as adult (Enhancement 2) but with **teen dispositions**: Schedule / Journal about it / Talk to someone / Let it go. "Delegate" becomes "Talk to someone" — could be mom, a friend, a mentor. "Backburner" becomes implicit (if they choose "Journal about it," it's captured; if they choose "Let it go," it's released). "Note" is replaced by "Journal about it" which routes to their journal. |
| 5 | **Tonight's Reflection** | ON | 1-2 reflection questions (not 3 — lighter touch). Pulled from teen-appropriate prompts (Kids-Specific and Growth categories, plus new teen-specific prompts below). |
| 6 | **Closing Thought** | ON | Their own Guiding Star, framed as "Something you believe:" — identity reinforcement in their own voice. |
| 7 | **Rhythm Tracker Prompts** | ON (auto-hides) | Any trackers configured for evening. |
| 8 | **Close My Day** | ON | Same as adult. |

### Teen Morning Rhythm (Default Template)

| # | Section | Notes |
|---|---------|-------|
| 1 | **Guiding Star Rotation** | Framed as "You said this matters to you:" — ownership language. Not "Remember who you are" (sounds parental). |
| 2 | **Morning Priorities Recall** | "Last night you said you wanted to get these done:" — their own words reflected back. |
| 3 | **Task Preview** | Today's tasks and calendar combined in a clean glance. |
| 4 | **Calendar Preview** | Today's events. |
| 5 | **On the Horizon** | Same as adult (Enhancement 8). Surfaces upcoming due dates with Task Breaker prompt. Particularly valuable for school assignments and projects. |
| 6 | **Something to Think About** (BookShelf) | Same as adult (Enhancement 3) but pulls from **teen question pool** (see below) and searches their BookShelf. For teens with school-related books uploaded, this could surface study-relevant content. |
| 7 | **Feature Discovery** | Same as adult (Enhancement 4) but the feature pool prioritizes teen-relevant features: BookShelf (for school + personal growth), trackers, Victory Recorder, ThoughtSift tools, journal. Framed as practical tips, not feature marketing. |
| 8 | **Rhythm Tracker Prompts** | Any trackers configured for morning (e.g., medication). |

### Teen MindSweep-Lite Dispositions

The adult dispositions don't map to teen life. Teens don't "delegate" and rarely think in terms of "backburner." The teen version uses:

| Disposition | What Happens | When to Use |
|------------|-------------|-------------|
| **Schedule** | Creates a task for a specific date | Homework, chores, plans with friends |
| **Journal about it** | Routes to Smart Notepad/Journal | Emotional processing, things to think through, ideas |
| **Talk to someone** | Creates a reminder/note (not a message — teen decides when/how to bring it up) | Social conflict, questions for mom/dad, things they need help with |
| **Let it go** | Acknowledged and released. No record. | Replaying embarrassing moments, worry spirals, things they can't control |

Haiku uses the same classification approach but with teen-calibrated examples in the prompt so it understands that "I said something weird in English class" is "Let it go" and "I need to ask mom about the field trip" is "Talk to someone."

### Teen Morning Insight Question Pool (15 Questions)

**Identity & Growth (5):**
1. What's something you're getting better at, even if slowly?
2. What kind of person do you want to be known as?
3. What's one thing about yourself that you've started to appreciate?
4. What's a strength you have that not everyone notices?
5. What would you attempt if you knew you couldn't fail?

**School & Learning (4):**
6. What's something you're studying right now that actually interests you?
7. What's the hardest thing on your plate this week, and what's one step toward handling it?
8. What's something you learned recently that changed how you think?
9. Is there a subject or skill you wish you could explore more deeply?

**Relationships & Social (3):**
10. What makes a good friendship, and are you being that kind of friend?
11. Is there someone you've been meaning to reach out to?
12. What's one thing you wish people understood about you?

**Life & Future (3):**
13. What are you looking forward to this week?
14. If you could build any skill over the next year, what would it be?
15. What's something you want to do differently than the adults around you?

### Teen BookShelf Integration

Teens with full BookShelf access (your teens have ALL the books) get the same semantic search behavior as adults. The morning insight question triggers a search against their library. For teens doing school work:

- If they've uploaded or have access to books related to what they're studying, the semantic search surfaces relevant extractions
- The Feature Discovery nudge can specifically highlight BookShelf for school use: "You have [book] in your library. The extractions could help with your [subject] studies — want to explore?"
- Over time, as they engage with BookShelf through the morning rhythm, they build the habit of using it independently for school and personal growth

### Why This Works for Getting Teens to Actually Use It

1. **The evening "3 things for tomorrow" builds a planning habit** — executive function practice disguised as a simple nightly routine. Over time, they start thinking ahead naturally.
2. **The MindSweep-lite gives them a place to put the mental noise** — teen brains are LOUD at night. Having a structured dump → sort → release process helps them actually sleep.
3. **The morning priorities recall shows them their own words** — "You said you wanted to get these done" is more motivating than any task list mom created.
4. **The BookShelf pull connects reading to their actual life** — not "read this because it's good for you" but "here's something from a book you have that relates to what you're thinking about."
5. **Feature Discovery introduces the platform gradually** — they don't have to figure out what all the tools do. The rhythm brings useful tools to them one at a time.
6. **Reflections build self-awareness** — 1-2 questions per evening, low pressure, builds a journal record they can look back on.
7. **Everything is framed as theirs** — ownership language throughout. "You said," "What do you want," "Something you believe." Never directive.

### Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 26 | **Teens get full rhythm experience, not reduced sections** | Teens are real users building real habits. A stripped-down version signals "this isn't really for you." A tailored version signals "this was built for you." |
| 27 | **Teen MindSweep-lite uses different dispositions than adult** | "Delegate" and "backburner" don't map to teen life. "Journal about it" and "Talk to someone" are the teen equivalents. |
| 28 | **Teen morning framing uses ownership language** | "You said this matters to you" vs. "Remember who you are." Teens are constructing identity — reflect their choices back, don't prescribe. |
| 29 | **Teen evening framing uses aspiration language** | "What do you want to get done?" vs. "3 most important things." Teens respond to agency, not obligation. |
| 30 | **1-2 reflection questions per evening, not 3** | Lighter touch. Teens are more likely to engage with fewer questions than to skip a wall of prompts. Quality over quantity. |
| 31 | **15 teen-specific morning insight questions** | The adult questions about family friction and parenting don't resonate. Teen questions about identity, school, friendships, and future are genuinely useful to them. |
| 32 | **BookShelf discovery nudge highlights school use case for teens** | Teens who see BookShelf as useful for school will use it for everything else too. Lead with the practical value. |

---

## Enhancement 8: On the Horizon (Forward-Looking Awareness)

**New section for Morning Rhythm (all roles)**

### What It Is

A forward-looking section that surfaces tasks and events with due dates approaching in the next 7 days, so nothing feels last-minute. Instead of everything hitting the user the day it's due (or after), the rhythm gently says "these are coming up" with enough lead time to plan.

For teens, this is school projects, tests, and events. For moms, it's appointments, deadlines, and things that need preparation. The goal is training the brain to think ahead without the panic of last-minute discovery.

### How It Works

1. Section shows items due in the next 7 days (configurable lookahead window per member)
2. **Capped at 3-5 items**, prioritized by nearest date. If more exist: "and X more this week" link to the full task/calendar view
3. Each item shows: title, due date, and days remaining ("in 3 days", "in 6 days")
4. For items that are complex or multi-step, the section offers: **"Want to break this into steps?"** — launches Task Breaker (PRD-09A) directly from the rhythm
5. For items that need time blocked: **"Schedule time for this?"** — creates a task or calendar block
6. Items already marked in-progress or with subtasks created show a subtle progress indicator instead of the action prompts

### What Qualifies as "On the Horizon"

- Tasks with due dates in the lookahead window that are NOT already on today's task list
- Calendar events in the lookahead window that may require preparation (not routine recurring events)
- Does NOT include items due today — those are in the Task Preview section
- Does NOT include items with no due date — those live in the regular task list

### Teen Value

Teens are notoriously bad at planning ahead — not laziness, but executive function development. "Science project due in 5 days" surfacing every morning with a "Want to break this into steps?" prompt could be the difference between a last-minute scramble and actually planning ahead. Over weeks of using this, the teen starts thinking in terms of lead time naturally.

### Mom Value

Moms carry an enormous mental load of "things I need to prepare for." The orthodontist appointment in 4 days, the co-op supply list due Friday, the birthday party to plan. On the Horizon externalizes that mental tracking to the system.

### Configuration

- **Lookahead window:** 7 days default, configurable per member (3-14 day range)
- **Max items shown:** 5 default, configurable
- **Task Breaker prompt:** shown for items with no subtasks and estimated complexity (or always, letting the user decide)
- **Position:** In the morning rhythm, after Calendar Preview and before Something to Think About

### Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 33 | **7-day default lookahead** | One week covers most school assignment cycles and family planning horizons. Configurable for users who want more or less lead time. |
| 34 | **Capped at 3-5 items, nearest first** | Showing 15 upcoming things defeats the purpose. Awareness, not overwhelm. Overflow link to full view. |
| 35 | **Task Breaker integration from the rhythm** | The moment of awareness ("this is coming up") is the best moment to plan. Offering Task Breaker right there removes the friction of "I should plan for this... later." |
| 36 | **Available for all roles, not just adults** | Teens benefit MORE from forward planning awareness than adults. This is an executive function training tool disguised as a morning section. |
| 37 | **New section type: "On the Horizon" (Section Type #32)** | Available in Morning rhythm and Custom rhythms. |

---

## Evening Rhythm Revised Section Sequence

The fixed evening sequence, incorporating all enhancements and the mood triage removal:

| # | Section | Default State | Source |
|---|---------|--------------|--------|
| 1 | Evening Greeting | ON | Original PRD-18 |
| 2 | Accomplishments & Victories | ON | Original PRD-18 |
| 3 | Completed Meetings | ON (auto-hides) | Original PRD-18 |
| 4 | Milestone Celebrations | ON (auto-hides) | Original PRD-18 |
| 5 | Carry Forward | **OFF** | Original PRD-18 (preserved as option) |
| 6 | 3 Most Important Things for Tomorrow | **ON** | **Enhancement 1** |
| 7 | MindSweep-Lite | ON (collapsed) | **Enhancement 2** |
| 8 | Closing Thought (Guiding Star) | ON | Original PRD-18 |
| 9 | From Your Library (Scripture/Quote) | ON (auto-hides) | Original PRD-18 |
| 10 | Before You Close the Day (reminders) | ON (auto-hides) | Original PRD-18 |
| 11 | Reflections | ON | Original PRD-18 |
| 12 | Rhythm Tracker Prompts | ON (auto-hides) | **Enhancement 6** (renamed) |
| 13 | Close My Day | ON | Original PRD-18 |

**Removed:** "How Was Today?" Triage (mood check). Mood tracking deferred to PRD-10 tracker widgets where users define their own scales and baselines. The `mood_triage` column on `rhythm_completions` remains in schema for future use but is not populated by default.

---

## Morning Rhythm Revised Default Sections (Mom/Adult)

| # | Section | Source |
|---|---------|--------|
| 1 | Guiding Star Rotation | Original PRD-18 |
| 2 | **Morning Priorities Recall** | **Enhancement 1** |
| 3 | Best Intentions Focus | Original PRD-18 |
| 4 | Task Preview | Original PRD-18 |
| 5 | Calendar Preview | Original PRD-18 |
| 6 | **On the Horizon** | **Enhancement 8** |
| 7 | **Something to Think About** (BookShelf) | **Enhancement 3** |
| 8 | Brain Dump / Capture | Original PRD-18 |
| 9 | **Feature Discovery** (2-3x/week) | **Enhancement 4** |
| 10 | (Periodic cards on their days) | Original PRD-18 |

---

## New Section Types Added to Library

| # | Section Type | Description | Data Source | Available In |
|---|-------------|-------------|-------------|-------------|
| 27 | **Tomorrow's Priorities** (enhanced) | Conversational task capture with fuzzy match against existing tasks | Tasks via PRD-09A + `rhythm_completions.metadata` | Evening, Custom |
| 28 | **MindSweep-Lite** | Freeform dump + Haiku auto-triage (schedule/delegate/note/backburner/release) | Haiku API + `rhythm_completions.metadata` | Evening, Custom |
| 29 | **Morning Insight / BookShelf Discovery** | Growth question + semantic search against BookShelf extractions + clickable links | `bookshelf_extractions` via pgvector + question pool | Morning, Custom |
| 30 | **Feature Discovery** | Activity-log-driven nudge toward unused features with direct action link | `activity_log` engagement queries | Morning, Custom |
| 31 | **Morning Priorities Recall** | Displays previous evening's declared priorities | `rhythm_completions.metadata` from prior evening | Morning, Custom |
| 32 | **On the Horizon** | Forward-looking awareness: tasks/events due in next 7 days with Task Breaker prompt | Tasks + Calendar with due date filtering | Morning, Custom |

---

## Schema Additions

### `rhythm_completions.metadata` JSONB Structure (Enhanced)

The existing `rhythm_completions` table gains richer metadata on evening completion records:

```json
{
  "priority_items": [
    {
      "text": "Finish Victory Recorder build",
      "matched_task_id": "uuid-of-existing-task",
      "created_task_id": null
    },
    {
      "text": "Upload public domain books",
      "matched_task_id": null,
      "created_task_id": "uuid-of-new-task"
    }
  ],
  "mindsweep_items": [
    {
      "text": "Email homeschool co-op about next semester",
      "disposition": "schedule",
      "created_record_id": "uuid-of-created-task",
      "created_record_type": "task"
    },
    {
      "text": "Messages vs Gamification build order decision",
      "disposition": "backburner",
      "created_record_id": "uuid-of-backburner-item",
      "created_record_type": "list_item"
    },
    {
      "text": "Worried about the girls' screen time",
      "disposition": "release",
      "created_record_id": null,
      "created_record_type": null
    }
  ]
}
```

### New task source value

Add `'rhythm_priority'` to `tasks.source` — tasks auto-created from evening rhythm priority capture.

### Widget configuration enhancement

Add `rhythm_keys` TEXT[] to `dashboard_widgets.config` JSONB — array of rhythm keys where this tracker should surface. Default: `[]`.

### Fallback behavior configuration

Add to `rhythm_configs.sections` JSONB for the evening rhythm, or as a new column on the member's task preferences:

```json
{
  "carry_forward_fallback": "stay",
  "carry_forward_backburner_days": 14,
  "carry_forward_backlog_threshold": 10,
  "carry_forward_backlog_prompt_max_frequency": "weekly"
}
```

**Recommended location:** Member-level task preferences (not rhythm config), since this behavior applies at midnight regardless of whether the user completes their evening rhythm. Could live in `family_members.preferences` JSONB or a dedicated task settings surface.

---

## Morning Insight Question Pool (Starter Set — 20 Questions)

### Family Friction (5)
1. What's one routine in your family that could use a small improvement?
2. What's a recurring frustration in your household that you haven't addressed yet?
3. When does your family communicate best, and when does it break down?
4. What's one thing that would make your mornings smoother?
5. Is there a family habit you'd like to start but haven't figured out how?

### Personal Growth (5)
6. What's a skill you wish you were better at?
7. What's something you used to do for yourself that you've let go of?
8. Where in your life are you running on autopilot when you'd rather be intentional?
9. What's one area where you're being too hard on yourself?
10. What would you do more of if you had an extra hour each day?

### Relationships (4)
11. What's something you wish you could communicate better to someone you love?
12. Who in your life could use more of your attention right now?
13. What's one small thing you could do today to strengthen a relationship?
14. Is there a conversation you've been avoiding? What's holding you back?

### Parenting (3)
15. What's one thing you wish your kids understood about you?
16. What's working well in your parenting right now that you should keep doing?
17. What does your child need from you this week that's different from what they needed last month?

### Values & Purpose (3)
18. What matters most to you that you haven't made time for lately?
19. If your family had a theme for this season of life, what would it be?
20. What question keeps coming back to you?

---

## Shell Behavior Override (Supersedes PRD-18 Shell Behavior Table for Independent Teen)

| Shell | Morning Rhythm | Evening Rhythm |
|-------|---------------|---------------|
| Independent (Teen) | **Full tailored template**: Guiding Star ("You said this matters to you:"), Morning Priorities Recall, Task Preview, Calendar Preview, On the Horizon (with Task Breaker), Something to Think About (teen question pool), Feature Discovery, Rhythm Tracker Prompts | **Full tailored template**: Evening Greeting (teen tone), What Went Right Today, Tomorrow Capture (rotating prompts, teen framing), MindSweep-Lite (teen dispositions), Reflection (1-2 questions), Closing Thought ("Something you believe:"), Rhythm Tracker Prompts, Close My Day |

All other shells unchanged from PRD-18.

---

## Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-09A (Tasks) | New `source` value: `'rhythm_priority'` for tasks auto-created from evening priority capture. Carry Forward fallback behavior applies to all tasks at midnight. | Add source value. Define fallback behavior processing (midnight job or trigger). |
| PRD-10 (Widgets) | Tracker widgets gain `rhythm_keys` TEXT[] config for surfacing in any rhythm. | Add to widget config schema. Update tracker settings UI. |
| PRD-17B (MindSweep) | MindSweep-Lite in evening rhythm is a simplified version of the full MindSweep. Uses same Haiku classification but with simplified UI (no voice, no photo, no link input — text only). | Note MindSweep-Lite as a consumer of the same classification Edge Function with reduced input types. |
| PRD-23 (BookShelf) | Morning Insight section does semantic search against BookShelf extractions. Requires `bookshelf_extractions` tables to have pgvector embeddings queryable by the rhythm rendering pipeline. | Verify embedding infrastructure supports cross-feature semantic queries (should already work via Semantic Context Infrastructure Addendum). |
| Backburner Addendum | MindSweep-Lite "backburner" disposition routes items to the user's Backburner list. Carry Forward "backburner" fallback option does the same for stale tasks. | Verify Backburner list auto-creation and item insertion API supports these new entry points. |
| PRD-05 (LiLa) | `mood_triage` context source removed from defaults (column preserved but not populated). Morning Insight questions can be LiLa-generated dynamically. | Remove mood_triage from default context assembly. Add morning insight question generation as a LiLa capability. |
| PRD-11 (Victory Recorder) | Activity log (being built with Victory Recorder) is the data source for Feature Discovery nudges. | Verify activity log schema supports feature engagement queries. |

---

## CLAUDE.md Additions from This Addendum

- [ ] Convention: Evening Tomorrow Capture uses **rotating prompt framing** — 4 different wordings cycled nightly to prevent the section from feeling like a nightly to-do list builder. Same fuzzy matching and task creation behind the scenes regardless of framing.
- [ ] Convention: Evening Tomorrow Capture shows 3 default inputs with [+] overflow. When 6+ items entered, system prompts user to select top 3 focus items or auto-selects by due date. All items become real tasks; only 3 surface in morning recall.
- [ ] Convention: MindSweep-Lite uses Haiku for text parsing and disposition suggestion. Five adult dispositions: schedule, delegate, note, backburner, release. All record creation batched on "Close My Day" — nothing created mid-flow.
- [ ] Convention: On the Horizon section surfaces tasks/events due in next 7 days (configurable 3-14), capped at 3-5 items nearest first. Offers Task Breaker and schedule-time prompts. Available for all roles. Executive function training disguised as a morning section.
- [ ] Convention: Morning Insight ("Something to think about") does live pgvector semantic search against BookShelf extractions. Shows passive matches based on question + active matches based on user response. Empty BookShelf shows question + onboarding nudge.
- [ ] Convention: Feature Discovery nudges appear 2-3 times per week in morning rhythm, never every day. Dismissible per feature. Features exit discovery pool when user meaningfully engages (creates content, not just views page).
- [ ] Convention: Carry Forward fallback behavior is a global default per member (Stay/Roll forward/Expire/Backburner) with per-task override. NOT a nightly triage. Occasional backlog prompts when threshold exceeded, max once per week.
- [ ] Convention: Mood tracking is NOT a default rhythm section. Users who want mood tracking create a tracker widget with their own scales and configure it to surface in their preferred rhythm(s).
- [ ] Convention: Any tracker widget can surface in any rhythm via `rhythm_keys` TEXT[] configuration. Section Type #23 renamed from "Custom Tracker Prompts" to "Rhythm Tracker Prompts."
- [ ] Convention: The evening rhythm fixed sequence is now 13 sections (mood triage removed, Tomorrow's Priorities enhanced, MindSweep-Lite added).
- [ ] Convention: Independent Teen rhythms are a full tailored experience, NOT reduced adult sections. Teen evening has 8 sections, teen morning has 7 sections, all with teen-appropriate framing.
- [ ] Convention: Teen rhythm language uses ownership framing ("You said this matters to you:", "What do you want to get done?") not directive framing ("Remember who you are", "3 most important things").
- [ ] Convention: Teen MindSweep-Lite dispositions differ from adult: Schedule / Journal about it / Talk to someone / Let it go. Haiku prompt must include teen-calibrated examples.
- [ ] Convention: Teen evening reflections show 1-2 questions (lighter touch than adult's 3). Teen morning insight questions come from a separate 15-question teen pool focused on identity, school, relationships, and future.

---

## What This Addendum Adds to "Done" Checklist

### MVP (Must Have — additions to PRD-18 checklist)
- [ ] Evening Rhythm Section 6 enhanced: Tomorrow Capture with rotating prompts and fuzzy task matching
- [ ] Rotating prompt pool (4 framings) with daily rotation
- [ ] 3 default input fields plus [+] button for overflow
- [ ] Overflow handling: when 6+ items, prompt to pick top 3 or auto-select by due date
- [ ] Fuzzy match UI: suggestion card with [Yes] / [New task] options
- [ ] Tasks created from evening priorities carry `source = 'rhythm_priority'`
- [ ] Morning Priorities Recall section reads previous evening's `rhythm_completions.metadata`
- [ ] Morning Priorities Recall shows "and X more on your list" link when overflow items exist
- [ ] On the Horizon section: 7-day lookahead, 3-5 items capped, nearest first
- [ ] On the Horizon "Want to break this into steps?" — Task Breaker launch
- [ ] On the Horizon "Schedule time for this?" — task/calendar block creation
- [ ] On the Horizon configurable lookahead window per member (3-14 day range)
- [ ] On the Horizon renders for all roles including Independent Teen
- [ ] MindSweep-Lite section: freeform text input, Haiku parsing, disposition tags with one-tap confirm
- [ ] MindSweep-Lite batches record creation on Close My Day
- [ ] MindSweep-Lite collapsed by default with configurable auto-expand frequency
- [ ] `mindsweep-sort-lite` Edge Function (or shared with PRD-17B's `mindsweep-sort`)
- [ ] Morning Insight section: question from pool, optional text input, semantic search results with BookShelf links
- [ ] 20 default morning insight questions seeded per family
- [ ] Empty BookShelf handling: question + onboarding nudge
- [ ] Feature Discovery section: activity log query, nudge card with action link, dismiss functionality
- [ ] Discovery frequency: 2-3x/week logic with discovery-free days
- [ ] Carry Forward fallback behavior setting (global default per member)
- [ ] Fallback behavior midnight processing (stay/roll/expire/backburner)
- [ ] Per-task fallback override capability
- [ ] Backlog threshold prompt (configurable threshold and max weekly frequency)
- [ ] Tracker `rhythm_keys` configuration in widget settings
- [ ] Rhythm Tracker Prompts section renders trackers for current rhythm key
- [ ] Mood triage section removed from default evening sequence

### Teen-Specific MVP Items
- [ ] Teen evening rhythm template with all 8 sections and teen-appropriate framing
- [ ] Teen morning rhythm template with all 7 sections and ownership language
- [ ] Teen MindSweep-Lite dispositions: Schedule / Journal about it / Talk to someone / Let it go
- [ ] Haiku prompt calibrated with teen examples for disposition classification
- [ ] 15 teen-specific morning insight questions seeded per teen member
- [ ] Teen evening reflection count: 1-2 questions (not 3)
- [ ] Teen Guiding Star framing: "You said this matters to you:" (not "Remember who you are")
- [ ] Teen evening priorities framing: "What do you want to get done tomorrow?" (not "3 most important things")
- [ ] Feature Discovery teen feature pool prioritization (BookShelf, trackers, Victory Recorder, ThoughtSift, journal)
- [ ] BookShelf discovery nudge for teens highlights school use case

### MVP When Dependency Is Ready
- [ ] Morning Insight LiLa dynamic question generation (requires PRD-05 context enhancement)
- [ ] MindSweep-Lite "delegate" disposition creates messages/requests (requires PRD-15 Messages)
- [ ] Carry Forward "backburner" fallback routes to Backburner list (requires Backburner Addendum build)

---

*End of PRD-18 Enhancement Addendum*
