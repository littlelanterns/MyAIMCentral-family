# Feature Decision File: Reward Reveals — Universal Celebration System

> **Created:** 2026-04-14
> **PRD:** No dedicated PRD — founder-designed in conversation. Touches PRD-24 (gamification), PRD-09A (tasks), PRD-10 (widgets/trackers), PRD-09B (lists).
> **Related addenda:**
>   - `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md` (treasure box concept — this feature is the universal evolution)
>   - `prds/addenda/PRD-24B-Content-Pipeline-Tool-Decisions.md` (reveal type library — CSS reveals originated here)
> **Founder approved:** Pending

---

## What Is Being Built

A universal "ta-da moment" system that mom can attach to anything completable in the platform. When a child finishes a task, hits a star chart goal, checks off a whole list, or reaches any milestone — a reveal animation plays (treasure chest opening, gift box unwrapping, envelope opening, spinner, card flip, etc.) and then shows the prize behind it: mom's custom message, an uploaded photo of the actual reward, a platform image, or a randomizer pull.

This is NOT tied to the gamification/sticker book system. Those reveals (Mossy Chest, Fairy Door) stay exclusive to their Woodland Felt theme. This is a separate, universal system — a lego piece any feature can use.

**Anchor use case (founder's own family):** A potty chart with stars. Each success adds a star to the tracker. Every 5 stars, an ice cream treasure chest reveal plays and shows "Great Job! You earned ice cream!" with a photo of ice cream.

---

## Design Principles

1. **Mom configures, kid experiences.** Setup complexity lives in mom's settings. The child just sees the magic moment.
2. **Works everywhere.** Tasks, widgets/trackers, lists, intentions, sequential collections — any completable thing.
3. **Video is the wrapping paper, content is the prize.** The animation and the reward are separate choices.
4. **Text is always valid.** Not every reveal needs an image. "Great job! You earned 30 minutes of screen time!" is a complete reward.
5. **Images are optional and flexible.** Mom can upload her own photo (the actual chocolate bar, the specific store), pick from the existing platform image library (411 visual schedule assets with semantic embeddings), or skip the image entirely.
6. **Repeating or one-time.** Daily routine completion → reveal every day. Sequential collection finale → one-time. Mom chooses.
7. **1:1 aspect ratio** for video rendering. Most reveal videos are square format.
8. **Celebration only is valid.** Sometimes just the video + confetti is the reward — no prize card needed.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| `RewardRevealModal` | Full-screen 1:1 video playback → prize card slide-in. Reusable from any completion path. Handles all prize_types. |
| `RevealAnimationPicker` | Browseable grid of reveal animations grouped by style_category. Used inline in task/widget config AND in the library page. Thumbnail preview on hover/tap. |
| `PrizeContentEditor` | Sub-component: prize type selector (text / image / platform image / randomizer / celebration only) + content fields. |
| `RewardRevealLibrary` page | `/settings/reward-reveals` — mom's named reveal combos. Browse, create, edit, delete. |
| `AttachRevealSection` | Collapsible section in TaskCreationModal, WidgetConfiguration, list settings — "Add a reward reveal" with inline picker OR "Pick from library" dropdown. |
| `CongratulationsMessagePicker` | Seeded message library + custom text input. Mom picks a preset or writes her own. |

---

## Key Decisions (Founder-Confirmed in Conversation)

1. **Mossy Chest and Fairy Door are NOT in this system.** They stay exclusive to the Woodland Felt gamification theme. The universal reveal library is separate.
2. **Existing CSS reveals (spinner, card flip, door open) ARE part of this system.** They're currently siloed in their features but conceptually are the same "ta-da moment" pattern.
3. **Prize content options:** (a) Mom's uploaded image + text, (b) platform image from `platform_assets` + text, (c) text only, (d) randomizer pull from a `lists` row, (e) celebration only (video + confetti, no prize card).
4. **Mom can upload her own prize image.** Real photo of the chocolate bar, the store, the game box. Stored in Supabase Storage under `reward-images/{family_id}/`.
5. **Seeded congratulations messages.** Platform provides ~20 preset messages mom can pick from. She can also write her own. Messages support `{reward}` placeholder that gets replaced with the prize name at reveal time.
6. **Two creation paths:** (a) Inline — "Add a reward reveal" section when creating/editing a task, widget, or list. (b) Library — named combos at `/settings/reward-reveals` that can be attached to multiple things by reference.
7. **Repeating vs one-time is per-attachment.** The same library combo can be attached as repeating on a daily routine and one-time on a sequential collection finale.
8. **Potty chart flow:** Star chart widget (tracker type `tally/star_chart`) with `reward_reveal_id` + `reveal_trigger_interval=5`. Every 5 data points, the reveal fires. Widget config has a "Celebrate every N" field when a reveal is attached.
9. **Prize images from existing assets.** The 411 `platform_assets` with `category='visual_schedule'` include ice cream (3 variants), movie night (3), playground (3), swimming (4), arcade (3), park (3), outside play (2), bike, dance, pet time — all usable as prize images without generating anything new. Mom can also upload her own.
10. **`{reward}` template in messages.** "Great Job! You earned {reward}!" where `{reward}` is replaced with the prize name field at render time. Keeps messages reusable across different prizes.
11. **Rotating reveal animations.** Mom can attach MULTIPLE reveal animations that rotate on each trigger. Example: potty chart every-5 alternates between ice cream envelope (on 5, 15, 25...) and ice cream treasure chest (on 10, 20, 30...). Rotation modes: `sequential` (cycle through in order), `random` (pick randomly each time). Stored as `animation_ids UUID[]` on `reward_reveals` instead of a single `animation_id`.
12. **Prize assortments.** A single reward reveal can have MULTIPLE prizes that vary each time it fires. Modes: `sequential` (prize 1 first time, prize 2 second time, cycle), `random` (random pick from pool each time), `fixed` (same prize every time — current behavior). Example: every 5 stars, kid gets a different prize from the pool — ice cream, then movie night, then playground trip. Stored as a `prize_pool` JSONB array on `reward_reveals`.
13. **Mastery completion triggers.** When a sequential item or randomizer item reaches `mastery_status='approved'`, the attached reveal fires. Source type `mastery` with source_id pointing to the task or list_item.
14. **Best Intention iteration milestones.** Attach a reveal to a Best Intention with `every_n` trigger — every N iterations, the reveal fires. "You've practiced patience 10 times this month!" + gift box.
15. **Sequential collection intervals.** Reveals can fire at intervals within a sequential collection (every 5 items completed) AND/OR on final completion of the entire collection.
16. **Self-rewards.** Mom can attach reveals to her own tasks, intentions, and trackers — not just kid-facing items. The system is universal across all shells.
17. **Theme-compatible sparkles & confetti.** The reveal modal uses theme-tokened SparkleOverlay + ConfettiBurst (already built for PRD-24) during the transition from video end to prize card appearance. Colors pull from the active theme's CSS custom properties.
18. **Messages can be anything.** While the celebration-only framing is primary, the message content is free-text. Mom could write consequences too. The system doesn't enforce positivity — it's a reveal mechanism, not a reward mechanism. (Though the UI framing and presets are all warm and celebratory per the "celebration only, never punishment" principle.)

---

## Database Changes Required

### Already Built
- `reveal_animations` table — 33 rows (30 video + 3 CSS). Migration `00000000100142_reveal_animations_library.sql`. 12 style categories. Platform-level, authenticated read.

### New Tables

#### `reward_reveals` — Mom's configured reward reveal combos
```
id                    UUID PK
family_id             UUID FK families NOT NULL
created_by            UUID FK family_members NOT NULL
name                  TEXT NULL          -- NULL = inline one-off, non-NULL = library item

-- Reveal animation(s) — single or rotating
animation_ids         UUID[] NOT NULL    -- Array of FK reveal_animations. Length 1 = fixed, 2+ = rotating.
animation_rotation    TEXT DEFAULT 'sequential' CHECK ('sequential','random')
                                         -- 'sequential' = cycle in order, 'random' = random pick

-- Prize content — single fixed prize OR a pool that varies
prize_mode            TEXT DEFAULT 'fixed' CHECK ('fixed','sequential','random')
                                         -- 'fixed' = same prize every time
                                         -- 'sequential' = cycle through prize_pool in order
                                         -- 'random' = random pick from prize_pool each time

-- For fixed mode (single prize):
prize_type            TEXT NOT NULL CHECK ('text','image','platform_image','randomizer','celebration_only')
prize_text            TEXT NULL          -- "Great Job! You earned {reward}!"
prize_name            TEXT NULL          -- The reward name for {reward} substitution ("ice cream")
prize_image_url       TEXT NULL          -- Mom-uploaded image URL (Supabase Storage)
prize_asset_key       TEXT NULL          -- platform_assets.feature_key for platform images
prize_randomizer_list_id UUID NULL FK lists  -- For randomizer prize pulls

-- For sequential/random mode (prize pool):
prize_pool            JSONB NULL         -- Array of prize objects, each with {prize_type, prize_text,
                                         -- prize_name, prize_image_url, prize_asset_key}
                                         -- NULL when prize_mode='fixed'

is_active             BOOLEAN DEFAULT true
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()
```

RLS: family-scoped, mom full CRUD, members read own family.

#### `reward_reveal_attachments` — Links a reveal to a completable source
```
id                    UUID PK
family_id             UUID FK families NOT NULL
reward_reveal_id      UUID FK reward_reveals NOT NULL
source_type           TEXT NOT NULL CHECK ('task','widget','list','intention',
                        'sequential_collection','sequential_interval','mastery')
                        -- task = single task completion
                        -- widget = tracker/widget goal reached
                        -- list = all items checked off
                        -- intention = Best Intention iteration milestone
                        -- sequential_collection = final item in the collection completed
                        -- sequential_interval = every N items in a sequential collection
                        -- mastery = mastery_status='approved' on a task or list_item
source_id             UUID NOT NULL
family_member_id      UUID NULL FK family_members  -- NULL = all assignees, non-NULL = specific child
is_repeating          BOOLEAN DEFAULT true
reveal_trigger_mode   TEXT DEFAULT 'on_completion' CHECK ('on_completion','every_n','on_goal')
reveal_trigger_n      INTEGER NULL       -- For 'every_n': fire every N completions/data points/iterations
times_revealed        INTEGER DEFAULT 0
last_revealed_at      TIMESTAMPTZ NULL
is_active             BOOLEAN DEFAULT true
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()
```

RLS: family-scoped, mom full CRUD, members read own family.
UNIQUE: `(source_type, source_id, family_member_id)` — one reveal per source per member.

#### `congratulations_messages` — Seeded message library
```
id                    UUID PK
message_text          TEXT NOT NULL      -- Supports {reward} placeholder
category              TEXT NOT NULL CHECK ('general','milestone','streak','completion','effort')
is_system             BOOLEAN DEFAULT true
family_id             UUID NULL FK families  -- NULL for system, non-NULL for custom
sort_order            INTEGER DEFAULT 0
created_at            TIMESTAMPTZ DEFAULT now()
```

RLS: system messages public read, family custom messages family-scoped.

### Seed Data: ~20 Congratulations Messages

**General:**
- "Great job! You earned {reward}!"
- "You did it! Time for {reward}!"
- "Amazing work! Here's your {reward}!"
- "Way to go! {reward} is yours!"
- "Look what you earned!"

**Milestone:**
- "You hit your goal! {reward} time!"
- "All that hard work paid off — {reward}!"
- "Goal reached! You've earned {reward}!"
- "What an accomplishment! Enjoy your {reward}!"

**Streak:**
- "You're on a roll! Here's {reward}!"
- "Another day, another win! {reward} earned!"
- "Keeping it up! {reward} is yours!"

**Completion:**
- "All done! Time to celebrate with {reward}!"
- "Everything checked off — enjoy {reward}!"
- "Finished! Here comes {reward}!"

**Effort:**
- "So proud of your hard work!"
- "You gave it your best — that's what matters!"
- "Look how far you've come!"
- "Every step counts, and you showed up!"
- "That took real effort. Well done!"

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `reward_reveals_basic` | Essential | mom, dad_adults | Create text-only reveals, attach to tasks |
| `reward_reveals_media` | Enhanced | mom, dad_adults | Upload images, use platform images, randomizer prizes |
| `reward_reveals_library` | Enhanced | mom, dad_adults | Named reusable library at /settings/reward-reveals |

---

## Stubs — Do NOT Build This Phase

- [ ] Admin console reveal animation management (upload new videos, edit metadata)
- [ ] Reveal animation thumbnail auto-generation (extract frame from video)
- [ ] Sound effects on reveals (videos are muted per iOS Safari constraint)
- [ ] Per-member reveal animation preferences (kid picks their favorite chest style)
- [ ] Reveal history / "My Prizes" gallery for kids to browse past reveals
- [ ] AI-suggested prize content based on family context
- [ ] Reveal sharing to Family Feed
- [ ] Multi-reveal sequences (play 2+ animations in order)
- [ ] Custom CSS reveal component builder
- [ ] Reveal preview in the picker (play the video inline before selecting)
- [ ] Integration with PRD-28 financial rewards (auto-create transaction on reveal)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Reads animation library | ← | `reveal_animations` (platform) | `reward_reveals.animation_id` FK |
| Reads prize images | ← | `platform_assets` (visual schedule) | `reward_reveals.prize_asset_key` → `platform_assets.feature_key` |
| Reads randomizer lists | ← | `lists` (type=randomizer) | `reward_reveals.prize_randomizer_list_id` FK |
| Attaches to tasks | → | `tasks` | `reward_reveal_attachments.source_type='task'` |
| Attaches to widgets | → | `dashboard_widgets` | `reward_reveal_attachments.source_type='widget'` |
| Attaches to lists | → | `lists` | `reward_reveal_attachments.source_type='list'` |
| Attaches to intentions | → | `best_intentions` | `reward_reveal_attachments.source_type='intention'` |
| Attaches to sequential collections | → | `sequential_collections` | `reward_reveal_attachments.source_type='sequential_collection'` |
| Fires from task completion | ← | `useCompleteTask` / `useApproveTaskCompletion` | Check for attached reveal, queue modal |
| Fires from widget data point | ← | Widget data entry hooks | Check `reveal_trigger_mode='every_n'` against data point count |
| Fires from list completion | ← | `useToggleListItem` (when last item checked) | Check for attached reveal |
| Mom uploads prize images | → | Supabase Storage `reward-images/` | Direct upload in `PrizeContentEditor` |

---

## Things That Connect Back to This Feature Later

- **PRD-24 Gamification:** The existing `treasure_boxes` table concept overlaps. Future reconciliation: treasure boxes could become `reward_reveals` with `source_type='gamification_trigger'`. Not this build.
- **PRD-28 Financial:** "You earned $5!" could auto-create a `financial_transactions` row. Stub for now.
- **PRD-11 Victory Recorder:** Reveal moment could auto-record a victory. Stub for now.
- **PRD-37 Family Feeds:** "Share this moment!" button on the prize card could post to the feed. Stub for now.
- **PRD-15 Notifications:** Mom could get notified when a reveal fires for her kid. Stub for now.

---

## User Flow: Potty Chart with Stars → Ice Cream Reveal (Rotating)

1. Mom creates a **star chart widget** (tracker type `tally/star_chart`) for her daughter
2. In widget configuration, she taps **"Add a reward reveal"**
3. She picks **TWO** animations: **Ice Cream Envelope** and **Ice Cream Treasure Chest**, rotation mode **Sequential**
4. She sets prize type to **Platform Image** and picks `vs_ice_cream_B` (child at ice cream shop)
5. She picks the message **"Great Job! You earned {reward}!"** from the preset list
6. She types the prize name: **"ice cream"**
7. She sets trigger mode to **"Every 5"** (fires every 5 data points)
8. She sets repeating to **Yes**
9. She saves the widget
10. Daughter earns stars. Star #5 → **Ice Cream Envelope** plays (animation index 0), then prize card slides in with ice cream image + "Great Job! You earned ice cream!" + theme sparkles/confetti
11. Star #10 → **Ice Cream Treasure Chest** plays (animation index 1), same prize card
12. Star #15 → back to **Ice Cream Envelope** (sequential rotation wraps). And so on.

## User Flow: Best Intention Milestone → Gift Box

1. Mom creates a Best Intention: "Practice patience with the kids"
2. She taps **"Add a reward reveal"** on the intention
3. She picks **Paper Craft Gift Box** animation
4. She sets prize type to **Text Only**
5. She picks the message **"You're doing it! {reward}!"** and types prize name: **"10 times patient this month"**
6. She sets trigger mode to **"Every 10"** (fires every 10 iterations)
7. Every time she logs her 10th, 20th, 30th iteration → gift box opens with encouragement

## User Flow: Sequential Mastery → Congratulations

1. Mom creates a piano lesson sequential collection with mastery mode
2. She attaches a reveal to the collection with `source_type='mastery'`
3. She picks **Anime Envelope** animation
4. She sets prize mode to **Random** with a pool of 5 prizes: screen time, ice cream, movie night, park trip, new book — each with its own image and message
5. Every time mom approves mastery on a piano piece → anime envelope plays → random prize from the pool appears
6. Kid never knows which prize they'll get — built-in surprise

## User Flow: Mom Self-Reward → Encouragement Envelope

1. Mom attaches a reveal to her own "Exercise 3x/week" Best Intention
2. She picks **Paper Envelope** animation
3. She sets prize type to **Text Only**, message: **"You showed up for yourself today. That matters."**
4. She sets trigger mode to **"Every 3"**
5. Every 3 iterations → envelope opens with her own encouragement message

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All decisions captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> To be completed after build.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
