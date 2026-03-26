> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-11B: Family Celebration

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-05 (LiLa Core AI System), PRD-06 (Guiding Stars & Best Intentions), PRD-11 (Victory Recorder & Daily Celebration)
**Created:** March 5, 2026
**Last Updated:** March 5, 2026
**Companion:** PRD-11 (Victory Recorder & Daily Celebration)

---

## Overview

Family Celebration is the communal layer of Victory Recorder. Where PRD-11 defines how individuals record and celebrate their own victories, Family Celebration brings the whole family together to hear what everyone accomplished and what it means as a family story. This is the feature families tell their friends about.

The ritual is simple: the family gathers — at bedtime, over dinner, on a Saturday morning — and a parent triggers the celebration. LiLa generates a narrative that calls each family member by name, highlights their individual victories, celebrates what the family accomplished together, and connects it all to the family's shared values and Best Intentions. Mom (or dad) reads it aloud, or the family reads it together on a tablet screen. It takes 60 seconds to 4 minutes depending on how much happened and how detailed the parent wants it.

But Family Celebration is not just a performance. It is also a **parenting lens**. A mom can generate a celebration privately — for one child, for a category of victories, for a specific Best Intention — and use the narrative as talking points to really see her kids, notice things she missed in the chaos of the day, and prepare herself to compliment them with specificity. A dad who gets permission to access this tool gains the same ability: to see the good in his kids through a lens that catches what he might have overlooked.

> **Mom experience goal:** Family Celebration should feel like the best version of "let's go around the table and say one good thing about today" — except the AI already gathered the evidence, so nobody has to remember on the spot, and the narrative weaves it into something that actually feels meaningful instead of perfunctory.

> **Decision rationale:** Family Celebration is a separate PRD from Victory Recorder because the communal ritual has its own UI, permission model, script generation logic, and emotional design. Architecturally it reads from the same `victories` table but serves a fundamentally different purpose — shared celebration rather than personal reflection.

---

## User Stories

### Triggering & Generating
- As a mom, I want to trigger a family celebration from my Family Overview so I can gather the family and celebrate together.
- As a mom, I want to choose between a quick highlights version and a detailed version so the celebration fits the moment — 60 seconds at bedtime or 4 minutes on a relaxed Saturday.
- As a mom, I want to choose between a whole-family narrative and individual-member spotlights so I can pick the format that fits the mood.
- As a dad (with permission), I want to trigger a family celebration so I can lead the family in this ritual too.

### Filtering & Focusing
- As a mom, I want to filter the family celebration by time period (today, this week, this month, custom) so I can celebrate the right window.
- As a mom, I want to filter by family member (multi-select) so I can celebrate just one child, or two siblings together, or the whole family.
- As a mom, I want to filter by life area category (multi-select) so I can celebrate all the family's kindness victories, or all the education victories, or a custom combination.
- As a mom, I want to filter by Best Intentions or Guiding Stars so the celebration focuses on a specific family value and draws connections from that context.

### Private Parenting Use
- As a mom, I want to generate a celebration for one child privately so I can use it as talking points to notice and compliment them specifically.
- As a dad, I want to see what my kids accomplished this week so I can be more intentional about noticing the good — especially things I might have missed because I was at work.
- As a parent, I want the celebration to surface things I didn't see firsthand so I can say "I heard you shared your snack with Mia at recess — that's the kind of person you are" and my child knows I'm paying attention even when I'm not in the room.

### The Ritual
- As a family, we want the celebration to feel like a story, not a list being read — with a beginning, individual spotlights, a family moment, and a warm close.
- As a family, we want the celebration to feel different each time so it doesn't become rote after a week.
- As a parent, I want to save each celebration to a family archive so we can look back on what we celebrated together.

### Permissions & Access
- As a mom, I want to control whether dad can trigger family celebrations so I can decide if that's a shared responsibility.
- As a mom, I want the family celebration to be pin-protected on the family hub so kids can't trigger it unsupervised (API cost control) and siblings don't have unrestricted access to each other's victory details.

---

## Screens

### Screen 1: Family Celebration — Generation View

> **Depends on:** Family Overview page — defined in Dashboard PRD. Family Hub — defined in Shell/Dashboard PRD.

**Where it lives:**
- **Mom's Family Overview:** "Celebrate Our Family" button, prominent placement
- **Dad's Family Overview:** Same button, visible only if mom has granted `family_celebration` permission
- **Family Hub (shared tablet):** "Celebrate Our Family" button, PIN-protected (parent PIN required to trigger)

**What the parent sees:**

**Filter bar (all multi-selectable):**
- **Period:** Today | This Week | This Month | All Time | Custom Range
- **Family Members:** Chips for each family member — all selected by default. Tap to toggle individual members on/off. "All" chip to reset.
- **Life Area / Tags:** **"All Areas" is the default** (no filtering). Tap individual chips to narrow — multi-selectable, **auto-sorted by usage frequency** (most-used appear first). Includes default life area categories + any custom tags. A persistent **"+ Add Custom"** button is always visible at the end of the chip row. Tapping "All Areas" resets any active selections.
- **Special Filters:** Best Intentions | Guiding Stars | LifeLantern — these change the celebration context to draw connections from the selected feature

**Preview summary:**
- Below filters: "[X] victories across [Y] family members for [period]"
- Quick preview of what's included — member names and victory counts per member

**Celebration type selector:**

| Type | Description | Length |
|------|-------------|--------|
| **Highlights** | Top win per person, quick family moment, warm close | 60–90 seconds read aloud |
| **Detailed** | Multiple victories per person, patterns noted, family achievements, value connections | 3–4 minutes read aloud |
| **Individual Spotlight** | Deep focus on one family member (pre-selected in filter). Celebrates their victories with the depth of a personal celebration, but written for the family to hear. | 1–2 minutes per person |

**Generate button:** "Generate Celebration" — triggers LiLa narrative generation

**Interactions:**
- Adjust any filter → preview summary updates immediately
- Select celebration type → sets the depth parameter for generation
- Tap "Generate Celebration" → loading state with gold SparkleOverlay → narrative appears (Screen 2)

> **Decision rationale:** The filter bar is the power tool. It lets mom generate exactly the celebration she wants — whole family today, just Noah's week, all kindness victories this month, everything connected to the family's "be present with each other" Best Intention. The same tool serves both the family ritual and the private parenting lens.

---

### Screen 2: Family Celebration — Narrative Display

**What the parent sees:**

A full-screen (or large modal) display of the generated celebration narrative, designed for reading aloud or reading together on a screen.

**The narrative structure (Highlights type):**

**Opening:** A brief, warm acknowledgment of the period. "Today was a full day for the [Family Name] family. Here's what happened."

**Individual Spotlights:** Each included family member called by name. 1–2 sentences per person highlighting their top victory. Order varies (AI randomizes or uses youngest-to-oldest — varies day to day per the sincerity/variety principle).

**Family Moment:** What the family accomplished together — shared routines, collaborative goals, family Best Intentions progress. "Together, the [Family Name] family completed their evening routine for the fifth day in a row."

**Connection (optional):** If a family Best Intention or Guiding Star is relevant, the AI names the connection. "You said you wanted to be a family that notices each other. Today, three people in this family did exactly that."

**Close:** A warm, brief send-off. The voice personality delivers this in their style.

**The narrative structure (Detailed type):**
Same sections, but individual spotlights are 3–5 sentences each with multiple victories noted, patterns observed, and connections to personal Guiding Stars or growth areas. The Family Moment section is longer and more specific.

**The narrative structure (Individual Spotlight type):**
Focuses entirely on one family member. Depth similar to an individual Victory Recorder "Celebrate This!" narrative, but written in third person for the family to hear: "Noah, this is what you did this week..." Can include pattern insights, value connections, and Mom's Picks emphasis.

**Display elements:**
- Large, readable text (designed for reading aloud or group viewing on tablet)
- Gold accents and themed border
- Family name in the header
- Date/period covered
- Voice personality indicator (if one is selected)
- No emojis in adult display. Guided/Play DailyCelebration handles kid-appropriate display separately.

**Actions at bottom:**
- **"Save to Family Archive"** — saves the narrative to `family_victory_celebrations`
- **"Copy"** — copies text to clipboard
- **"Save to Journal"** — saves to the triggering parent's journal as a family reflection
- **"Regenerate"** — generates a new narrative from the same filters (for variety or if the first one didn't land right)
- **"Done"** — dismisses

**Data created:**
- `family_victory_celebrations` record with narrative, filters used, celebration type, members included

---

### Screen 3: Family Celebration Archive

**What the parent sees:**

A browsable history of past family celebrations, modeled on the same text-card pattern as the individual Celebration Archive (PRD-11 Screen 4).

- Title: "Family Celebrations"
- Cards organized by date, newest first
- Each card shows:
  - Date header
  - Celebration type (Highlights / Detailed / Individual Spotlight)
  - Members included
  - The full narrative text
  - "Copy" and "Delete" actions

**Where it lives:** Accessible from the Family Celebration generation view, and from mom's Family Overview as a link.

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full | Triggers celebrations, sets all filters, sees all family victories, manages archive. Always has access. |
| Dad / Additional Adult | Permission-gated | Can trigger family celebrations IF mom grants `family_celebration` permission. When granted, sees victories for permitted children + own. Cannot see mom's personal victories. |
| Special Adult | None | Cannot trigger or view family celebrations. Not part of the family ritual. |
| Independent (Teen) | View only (during ritual) | Can be present when celebration is read aloud. Cannot trigger or generate. Cannot access the family celebration tool independently. |
| Guided / Play | View only (during ritual) | Experiences the celebration when family gathers. Cannot trigger. |
| Family Hub (shared tablet) | PIN-protected trigger | Any parent with their PIN can trigger. Kids cannot trigger without parent PIN. |

### Permission Use Cases for Dad Access

> **Decision rationale:** Granting dad access to Family Celebration is a meaningful permission decision. The PRD-02 permission UI should highlight these use cases when mom is configuring dad's access.

**Why mom WOULD grant `family_celebration` permission:**
- Dad wants to lead the family celebration ritual sometimes — especially when mom is tired or when dad has the kids for the evening
- Dad wants to generate private celebrations for individual kids to prepare intentional compliments — "I want to notice the good in my kids even when I'm not home all day"
- Both parents sharing the celebration responsibility models partnership for the children
- Dad generating celebrations for his own victories + kids' victories builds his own practice of noticing the good

**Why mom might NOT grant `family_celebration` permission:**
- Mom wants to curate what's included in the family ritual (some victories may be private or sensitive)
- Mom's personal victories would be visible in the family feed and she prefers to keep them separate
- Family dynamics where mom wants to maintain control over the family narrative
- Cost management — limiting who can trigger AI generation

> **Forward note:** The permission description in PRD-02's UI should include a brief note like: "Family Celebration lets [Dad's name] generate celebrations for your family's victories. He'll see his own victories and the kids' victories (based on his other permissions), but not your personal victories."

---

### Privacy Safeguards

- **Mom's personal victories are NEVER included in family celebrations unless mom explicitly opts them in.** The family celebration pulls from children's victories + the triggering parent's victories. Mom's private victories stay private.
- **Dad's view is scoped by his existing permissions.** If dad doesn't have permission to see a particular child's data (per PRD-02), that child's victories won't appear in dad's family celebration generation.
- **PIN protection on Family Hub** prevents children from triggering celebrations and seeing sibling victory details unsupervised.
- **The narrative text is generated fresh each time** — it's not a stored document that could be accessed by unauthorized family members. Only the explicitly saved archive entries persist.

---

## Data Schema

### Table: `family_victory_celebrations`

Saved family celebration narratives.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| generated_by | UUID | | NOT NULL | FK → family_members. The parent who triggered. |
| celebration_date | DATE | CURRENT_DATE | NOT NULL | The date this was generated |
| celebration_type | TEXT | 'highlights' | NOT NULL | Enum: 'highlights', 'detailed', 'individual_spotlight' |
| period_filter | TEXT | 'today' | NOT NULL | 'today', 'this_week', 'this_month', 'all_time', 'custom' |
| period_start | DATE | | NULL | For custom range |
| period_end | DATE | | NULL | For custom range |
| members_included | UUID[] | | NOT NULL | Array of family_member_ids included |
| life_area_filters | TEXT[] | | NULL | Which life areas were selected (NULL = all) |
| custom_tag_filters | TEXT[] | | NULL | Which custom tags were selected |
| special_filter | TEXT | | NULL | 'best_intentions', 'guiding_stars', or NULL |
| special_filter_id | UUID | | NULL | Specific intention or star ID if filtered to one |
| narrative | TEXT | | NOT NULL | The full generated celebration text |
| victory_count | INTEGER | | NOT NULL | Total victories included |
| celebration_voice | TEXT | | NULL | Voice personality used |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family-scoped. Mom always reads/writes. Dad reads/writes if `family_celebration` permission granted. Other roles cannot access.

**Indexes:**
- `(family_id, created_at DESC)` — archive browsing
- `(family_id, generated_by)` — celebrations by parent

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| PRD-11: `victories` table | Family Celebration reads from all family members' victory records, filtered by the parent's selections and scoped by their permissions. |
| PRD-06: Best Intentions | When "Best Intentions" special filter is active, the celebration draws connections to family and individual Best Intentions. |
| PRD-06: Guiding Stars | When "Guiding Stars" special filter is active, the celebration connects victories to the family's and members' declared values. |
| LifeLantern (stub) | When "LifeLantern" special filter is active, the celebration connects victories to life assessment goals and vision. Stub until LifeLantern PRD. |
| PRD-02: Permissions | Dad's access to family celebration and his visibility into children's data is scoped by PRD-02 `member_permissions`. |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| Family Celebration Archive | Saved narratives stored in `family_victory_celebrations`. |
| Journal (parent's) | "Save to Journal" creates a journal entry in the triggering parent's journal with entry_type = 'family_celebration'. |
| Archives (stub) | Family celebrations auto-aggregate into the family's Archives folder. Stub until Archives PRD. |
| Reports (stub) | Family celebration data feeds into monthly family summary reports. Stub until Reports PRD. |

---

## AI Integration

### Family Celebration Script Generation

**Context loaded:**
- All victory records matching the current filters (period, members, life areas, tags)
- Family Best Intentions (always included as baseline family context)
- Individual Guiding Stars for included members (if relevant)
- InnerWorkings strengths for included members (selectively — when it enriches the celebration)
- Family name
- Member names and roles (ages inform language calibration)
- Selected voice personality
- Selected celebration type (highlights, detailed, individual_spotlight)

**AI behavior rules (extend PRD-11 CLAUDE.md rules):**

1. **All PRD-11 celebration rules apply.** Identity-based, proportionate, sincere, varied, summarize-don't-itemize.
2. **Address each person by name.** The celebration is personal. "Noah, you finished your math AND helped with dishes" — not "one family member completed tasks."
3. **Vary spotlight order.** Don't always go youngest to oldest. Randomize. Sometimes start with the person who had the quietest day, because their one victory deserves the opening.
4. **The Family Moment section connects, not just lists.** Don't just say "The family completed 47 tasks." Say "You all showed up for each other today. Three different people in this family helped someone else without being asked. That's not a coincidence — that's a culture you're building together."
5. **Respect the celebration type.** Highlights are crisp and warm — don't over-explain. Detailed celebrations breathe and go deeper. Individual Spotlights give one person the full stage.
6. **Mom's personal victories are excluded by default** unless she explicitly includes herself in the member filter.
7. **For the private parenting use case**, the AI should write as if speaking to the parent about the child: "Here's what Noah did this week that you might want to notice..." — this is different from the read-aloud family tone.
8. **Surface things the parent might have missed.** Auto-routed victories from task completions are things that happened in the background. The celebration should surface them: "Did you know that Avvi drank all her water three days in a row? That's new." This is the parenting lens in action.
9. **No sibling comparisons.** Never "Noah completed more tasks than Sally." Each person is celebrated on their own terms.

### Celebration Type Prompts

**Highlights prompt structure:**
```
Generate a 60-90 second family celebration (when read aloud) for the [Family Name] family.
Period: [filter]. Members: [names]. 
Format: Opening (1 sentence), Individual Spotlights (1-2 sentences each, top win per person), 
Family Moment (1-2 sentences), Close (1 sentence).
Voice: [personality]. Vary the spotlight order. Be warm and specific.
```

**Detailed prompt structure:**
```
Generate a 3-4 minute family celebration for the [Family Name] family.
Period: [filter]. Members: [names].
Format: Opening (2-3 sentences), Individual Spotlights (3-5 sentences each, multiple victories, 
patterns noted), Family Moment (2-3 sentences, shared accomplishments and value connections), 
Connection to Best Intentions (if relevant), Close (1-2 sentences).
Voice: [personality]. Go deeper. Find the meaning. Be sincere.
```

**Individual Spotlight prompt structure:**
```
Generate a 1-2 minute celebration focused on [Child Name] for the [Family Name] family to hear together.
Period: [filter]. 
Format: Address the child by name. Celebrate their specific victories with depth and specificity.
Note patterns. Connect to their Guiding Stars or growth areas if relevant.
Mom's Picks get extra emphasis. Write as if the whole family is listening and the child deserves 
to hear that everyone sees them.
Voice: [personality].
```

**Private parenting lens prompt structure:**
```
Generate a parent's briefing on [Child Name]'s victories for [period].
This is for the parent's private use — not read aloud to the family.
Tone: Informative and warm. Surface things the parent may have missed.
Highlight patterns, note growth areas, suggest specific compliments the parent could give.
Include any Mom's Picks with their notes.
Format: Conversational paragraphs, not a list. 2-3 paragraphs.
```

---

## Edge Cases

### No Victories for Selected Filters
- If a family member has zero victories for the selected period, they are gracefully excluded from the celebration — not called out for having nothing
- If the entire family has zero victories, show a warm empty state: "No victories recorded for this period yet. That doesn't mean nothing good happened — it just means nobody wrote it down. There's still time."

### One Family Member Has Many, Another Has Few
- The celebration should not make the disparity obvious. Each person gets their spotlight. A person with one victory gets a warm, genuine spotlight on that one thing. A person with twenty gets a curated highlight, not a longer section.
- The AI should never compare quantities across siblings

### Very Large Families
- For families with 5+ children, the Highlights type naturally keeps each spotlight brief
- The Detailed type may become quite long — the AI should still curate rather than enumerate
- Individual Spotlight type handles this naturally (one person at a time)

### Dad Generates Without Full Visibility
- If dad has permission for some children but not others, the celebration only includes members he has access to
- The narrative should not reference members dad can't see ("Your family accomplished 47 things" when he can only see 30 of them)
- The preview summary accurately reflects what dad can access

### Family Hub Cost Protection
- PIN protection prevents children from triggering AI generation repeatedly
- Future enhancement: rate limiting on family celebration generation (e.g., maximum 3 per day per family)

---

## Tier Gating

> **Tier rationale:** Family Celebration is the premium communal feature — it's what differentiates MyAIM from individual productivity tools. Basic access at Enhanced, full voice options at Full Magic.

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `family_celebration_basic` | Family Celebration with Highlights type, default voice | Enhanced |
| `family_celebration_detailed` | Detailed and Individual Spotlight celebration types | Enhanced |
| `family_celebration_voice` | Voice personality selection for family celebrations | Full Magic |
| `family_celebration_archive` | Save and browse past family celebrations | Enhanced |

All keys return true during beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| TTS audio for family celebration read-aloud | Voice synthesis for family celebration playback | Post-MVP enhancement |
| Family celebration in Evening Rhythm | "Celebrate?" button in evening review linking to Victory Recorder | Rhythms PRD |
| Auto-archive family celebrations to Archives | Monthly family celebration compilation | Archives PRD |
| Family celebration in monthly summary reports | Report template inclusion | Reports PRD |
| Re-engagement notifications | Push notification / email suggesting celebration after inactivity | Notifications PRD |
| Scheduled celebration reminders | Configurable reminder at set time (bedtime, dinner) to celebrate | Notifications PRD |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Family Celebration mode | PRD-11 | Fully implemented here. PRD-11 defined the stub; PRD-11B delivers the feature. |
| `family_celebration` permission key | PRD-02 | Referenced here for dad access gating. PRD-02 should define this permission key. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Family Celebration generation view with filter bar (period, members, life areas, tags, special filters)
- [ ] Three celebration types: Highlights, Detailed, Individual Spotlight
- [ ] AI narrative generation following all celebration rules from PRD-11 + family-specific rules
- [ ] Narrative display with save/copy/journal/regenerate actions
- [ ] Family Celebration Archive — text cards by date with type and members shown
- [ ] Mom always has access; Dad access gated by `family_celebration` permission
- [ ] PIN protection on Family Hub trigger
- [ ] Mom's personal victories excluded by default
- [ ] Dad's view scoped by his existing child permissions
- [ ] No sibling comparisons in narratives
- [ ] Gold visual effects consistent with PRD-11 celebration aesthetic
- [ ] RLS on `family_victory_celebrations` — family-scoped, role-appropriate
- [ ] Private parenting lens mode (generates parent-facing talking points, not read-aloud narrative)

### MVP When Dependency Is Ready
- [ ] Evening Rhythm "Celebrate?" button linking to Victory Recorder with today's filter pre-set (requires Rhythms PRD)
- [ ] Re-engagement notifications after inactivity (requires Notifications PRD)
- [ ] Scheduled celebration reminders (requires Notifications PRD)

### Post-MVP
- [ ] TTS audio playback for family celebrations
- [ ] Auto-archive to family Archives folder
- [ ] Family celebration data in monthly summary reports
- [ ] Rate limiting on generation (cost control for large families)
- [ ] Celebration Cards — visual, designed, shareable family celebration summaries
- [ ] Family celebration voice distinct from individual voices (family votes on a shared voice)

---

## CLAUDE.md Additions from This PRD

- [ ] Family Celebration script rules: address each person by name, vary spotlight order, no sibling comparisons, surface things parent may have missed.
- [ ] Family Celebration has four prompt modes: highlights, detailed, individual_spotlight, and private_parenting_lens. Each has distinct tone and structure.
- [ ] Mom's personal victories excluded from family celebrations by default. Only included if mom explicitly adds herself to the member filter.
- [ ] Family Hub PIN protection required for celebration trigger. Kids cannot generate celebrations unsupervised.
- [ ] Dad's family celebration access is permission-gated. When configuring, show use cases for granting/denying.
- [ ] Private parenting lens writes TO the parent ABOUT the child — different tone from read-aloud family celebration.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `family_victory_celebrations`
Enums updated: `celebration_type` (highlights, detailed, individual_spotlight)
Triggers added: None (generation is on-demand, not event-triggered)

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Three celebration types: Highlights, Detailed, Individual Spotlight.** | Highlights for quick bedtime ritual, Detailed for relaxed Saturday review, Individual Spotlight for focusing on one child. Each serves a different moment. |
| 2 | **Private parenting lens is a fourth prompt mode**, not a celebration type. It generates parent-facing talking points, not a read-aloud narrative. | Mom (or dad) using this privately to prepare compliments is a different use case than the family ritual. The tone and format are fundamentally different. |
| 3 | **All filters are multi-selectable** (members, life areas, custom tags). | The power is in the combinations. "Show me Jake and Sally's kindness victories this month" is a single filter configuration. |
| 4 | **Special filter modes for Best Intentions, Guiding Stars, and LifeLantern** work at the family level too. | "Celebrate everything our family did this week connected to our intention to be present with each other" or "How are we progressing on our LifeLantern goals?" are powerful family ritual moments. |
| 5 | **Mom's personal victories excluded by default** from family celebrations. | Mom's Victory Recorder is her private space. Family celebration draws from kids' victories + the triggering parent's if they choose to include themselves. |
| 6 | **Dad access is permission-gated with explicit use cases** for why mom would/wouldn't grant it. | This is a meaningful permission decision. The use cases help mom make an informed choice and also highlight the parenting benefit of dad having this tool. |
| 7 | **PIN protection on Family Hub.** | Cost control (prevents kids from generating celebrations all day) and privacy protection (siblings shouldn't have unrestricted access to each other's victory details). |
| 8 | **No sibling comparisons, ever.** | "Noah completed more tasks than Sally" is the opposite of what this feature is for. Each person is celebrated on their own terms. |
| 9 | **Manual trigger only for MVP.** Scheduled reminders and re-engagement notifications are deferred. | Manual trigger is sufficient. A "Celebrate?" button in the Evening Rhythm provides a natural daily prompt without needing a notification system. |
| 10 | **Evening Rhythm integration: "Celebrate?" button** in the evening review links to Victory Recorder with today pre-filtered. One tap to "Celebrate This!" from there. | Low-friction daily prompt that builds the habit without nagging. The Evening Rhythm is already the natural end-of-day reflection point. |
| 11 | **Custom tags from PRD-11 are available as family celebration filters.** | If mom created a "patience season" custom tag and tagged victories with it, she can filter family celebrations to just those victories. Powerful for seasonal family focus areas. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | TTS audio for family celebration | Post-MVP enhancement |
| 2 | Scheduled celebration reminders | Notifications PRD |
| 3 | Re-engagement notifications after inactivity | Notifications PRD |
| 4 | Auto-archive to family Archives | Archives PRD |
| 5 | Rate limiting on generation | Settings / cost management sprint |
| 6 | Visual Celebration Cards | Future enhancement |
| 7 | Family celebration voice voting | Post-MVP |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-02 (Permissions) | `family_celebration` permission key defined. Use cases for granting/denying should be included in permission UI. | Add `family_celebration` to permission keys. Add use case copy to permission configuration UI spec. |
| PRD-11 (Victory Recorder) | Multi-select filters, custom tags, and special filter modes (Best Intentions, Guiding Stars) now apply to individual Victory Recorder too (updated in PRD-11). | PRD-11 has been updated with Decisions 16-18. Verify consistency. |
| PRD-04 (Shell Routing) | Family Hub requires PIN-protected action for celebration trigger. | Note PIN protection requirement in Family Hub specification. |
| PRD-05 (LiLa Core) | Four new prompt modes for family celebration (highlights, detailed, individual_spotlight, private_parenting_lens). | Add family celebration prompt templates to LiLa prompt registry. |
| Rhythms PRD (future) | Evening Rhythm should include a "Celebrate?" button that links to Victory Recorder with today's filter pre-set. | Capture as a requirement when Rhythms PRD is drafted. |

---

*End of PRD-11B*
