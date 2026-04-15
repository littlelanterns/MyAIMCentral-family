# Build Prompt: Reward Reveals — Universal Celebration System

## Start Here

Read these files IN THIS ORDER before writing any code:

1. `claude/feature-decisions/Reward-Reveals-Universal-Celebration-System.md` — the full feature decision file with schema, user flows, design decisions, and stubs. This is the source of truth.
2. `CLAUDE.md` — all project conventions (especially #121 tsc check, #15 member colors, #42-47 theming)
3. `claude/architecture.md` — tech stack and patterns
4. `claude/conventions.md` — coding conventions

## What Already Exists

**`reveal_animations` table** — already created and seeded (migration `00000000100142_reveal_animations_library.sql`). 33 rows: 30 video animations across 12 style categories (paper_craft, minecraft, anime, pokemon, steampunk, unicorn, candy, dnd, retro, pink_purple, ice_cream) + 3 CSS-based effects (spinner, card_flip, door_open). All 31 videos are uploaded to Supabase Storage at `gamification-assets/reveals/`. RLS is live. Do NOT recreate this table or re-upload videos.

**Existing components to reuse/reference:**
- `CreatureRevealModal.tsx` — the gamification creature reveal. Same architecture pattern (video → card slide-in → auto-dismiss). The new `RewardRevealModal` follows this pattern but with 1:1 square video container, theme-tokened sparkles/confetti, and flexible prize content.
- `PageUnlockRevealModal.tsx` — same pattern, page unlock variant.
- `SparkleOverlay` + `ConfettiBurst` — already built, theme-aware. Use these during the video→prize transition.
- `platform_assets` table — 411 visual schedule images usable as prize images (ice cream, movie night, park, playground, swimming, etc.). Query with `category='visual_schedule'`.
- `FeatureIcon` component — renders platform_assets by feature_key. Reuse for prize image display.
- `useCompleteTask`, `useApproveTaskCompletion`, `useApproveMasterySubmission` — task completion hooks where reveals need to fire.
- `useLogIteration` (Best Intentions) — iteration hook where milestone reveals fire.
- Widget data entry hooks — where tracker milestone reveals fire.

**Mossy Chest and Fairy Door are NOT part of this system.** They stay exclusive to the Woodland Felt gamification theme in `gamification_themes`. Do not reference or include them.

## What To Build

### Phase 1: Schema + Types + Hooks

1. **Migration** (next number after checking `ls supabase/migrations/*.sql | sort | tail -1`):
   - CREATE TABLE `reward_reveals` — see feature decision file for full schema. Key design: `animation_ids UUID[]` (array, not single FK) for rotating animations. `prize_pool JSONB` for varying prizes. `prize_mode` ('fixed'/'sequential'/'random').
   - CREATE TABLE `reward_reveal_attachments` — links reveals to sources. 7 source_types: task, widget, list, intention, sequential_collection, sequential_interval, mastery. `reveal_trigger_mode` ('on_completion'/'every_n'/'on_goal'). `reveal_trigger_n INTEGER` for the "every N" pattern. Tracks `times_revealed` and `last_revealed_at`.
   - CREATE TABLE `congratulations_messages` — ~20 seeded preset messages with `{reward}` placeholder. Categories: general, milestone, streak, completion, effort. See feature decision file for the full list.
   - RLS on all 3 tables. Feature keys: `reward_reveals_basic` (Essential), `reward_reveals_media` (Enhanced), `reward_reveals_library` (Enhanced).
   - Supabase Storage bucket policy for `reward-images/` (mom-uploaded prize photos).

2. **TypeScript types** in `src/types/reward-reveals.ts`

3. **Hooks** in `src/hooks/useRewardReveals.ts`:
   - `useRewardReveals(familyId)` — all family reveals
   - `useRewardReveal(id)` — single reveal
   - `useCreateRewardReveal()` — mutation
   - `useUpdateRewardReveal()` — mutation  
   - `useRewardRevealAttachments(sourceType, sourceId)` — attachments for a source
   - `useAttachReveal()` — create attachment mutation
   - `useDetachReveal()` — delete attachment mutation
   - `useCheckRevealTrigger(sourceType, sourceId, memberId, completionCount)` — checks if a reveal should fire based on trigger_mode + trigger_n + times_revealed. Returns the reveal config + which animation + which prize (resolved from rotation/pool state).
   - `useCongratulationsMessages()` — query preset + family custom messages
   - `useRevealAnimations()` — query the animation library, grouped by style_category

### Phase 2: RewardRevealModal + Prize Components

1. **`RewardRevealModal`** — full-screen modal:
   - 1:1 square video container, centered on dark backdrop
   - Video plays `muted playsInline autoPlay` (iOS Safari safe)
   - At video end (or 0.5s before via timeupdate): SparkleOverlay + ConfettiBurst fire, prize card slides in from bottom
   - Prize card renders based on prize_type: text only, image + text, platform image + text, randomizer result, or celebration-only (just confetti, no card)
   - `{reward}` in message text gets replaced with `prize_name`
   - Auto-dismiss after 6s from card appearance, or tap anywhere
   - For CSS reveals (spinner, card_flip, door_open): render the named component instead of a video, same prize card after

2. **`RevealAnimationPicker`** — browseable grid grouped by style_category. Thumbnail/icon per animation. Multi-select when rotation is enabled.

3. **`PrizeContentEditor`** — prize type selector + content fields. Handles fixed mode (single prize) and pool mode (add/remove/reorder prizes in the pool). Image upload to `reward-images/{family_id}/`.

4. **`CongratulationsMessagePicker`** — dropdown of preset messages + custom text input. Shows `{reward}` as a highlighted placeholder.

### Phase 3: Wiring Completion Paths

Wire reveal checks into existing completion hooks. Pattern: after the completion succeeds, call `useCheckRevealTrigger`. If it returns a reveal, queue `RewardRevealModal` via a provider/context pattern (same approach as `PlayDashboard.tsx` reveal queue).

1. **Task completion** — `useCompleteTask` + `useApproveTaskCompletion`
2. **Mastery approval** — `useApproveMasterySubmission`
3. **Best Intention iteration** — `useLogIteration`
4. **Widget data point** — widget data entry hooks
5. **List completion** — `useToggleListItem` (when last unchecked item gets checked)
6. **Sequential collection** — `usePromoteNextSequentialItem` (for intervals and final completion)

### Phase 4: Configuration UI

1. **`AttachRevealSection`** — collapsible section added to TaskCreationModal, WidgetConfiguration, list settings, Best Intention editor. "Add a reward reveal" → inline picker OR "Pick from library".
2. **`RewardRevealLibrary`** page at `/settings/reward-reveals` — browse/create/edit/delete named reveal combos.

### Phase 5: Verification + Documentation

Standard post-build: tsc check, verification table, STUB_REGISTRY, CLAUDE.md conventions.

## Critical Rules

- All videos are 1:1 aspect ratio — render in a square container
- Theme-tokened sparkles/confetti — colors from CSS custom properties, never hardcoded
- `{reward}` placeholder substitution in message text at render time
- Rotating animations: `times_revealed % animation_ids.length` for sequential, random pick for random
- Prize pool: `times_revealed % prize_pool.length` for sequential, random pick for random
- Gamification pipeline (`roll_creature_for_completion`) is SEPARATE — reward reveals fire independently
- Financial data exclusion from LiLa context applies here too — no prize/reward data in LiLa context
- `prefers-reduced-motion` respected — skip video, show prize card directly
- iOS Safari: `<video playsinline muted>` always — never trigger native fullscreen
