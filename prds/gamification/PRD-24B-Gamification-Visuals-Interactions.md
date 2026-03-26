> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-24B: Gamification Visuals & Interactions

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-09A (Tasks, Routines & Opportunities), PRD-09B (Lists, Studio & Templates), PRD-10 (Widgets, Trackers & Dashboard Layout), PRD-11 (Victory Recorder & Daily Celebration), PRD-14 (Personal Dashboard), PRD-22 (Settings), PRD-24 (Gamification System — Overview & Foundation), PRD-24A (Overlay Engine & Gamification Visuals)
**Created:** March 16, 2026
**Last Updated:** March 16, 2026
**Parent PRD:** PRD-24 (Gamification System — Overview & Foundation)
**Sibling PRDs:** PRD-24A (Overlay Engine & Gamification Visuals), PRD-24C (Family Challenges & Multiplayer Gamification)

---

## Overview

PRD-24B is the animation bible for the MyAIM Family gamification system. It specifies every animation sequence, interaction pattern, and visual effect that makes gamification feel alive — from the moment a child taps "complete" on a task to the celebratory reveals at the end of their day. It covers eight reveal types in a unified Reveal Type Library, the Star Chart animation sequence, the Color-Reveal tracker system, micro-celebration effects, dashboard background celebration animations, the evolution flipbook celebration, treasure box widget idle states, and the master reference for how PRD-03's shell animation tokens apply to every gamification animation.

The Reveal Type Library is the architectural centerpiece. All eight reveal types — treasure chest, gift box, cracking egg, slot machine, spinner wheel, three doors, card flip, and scratch-off — are first-class citizens in a flat, modular library. Any reveal type can be attached to any reveal context: a reward earned from an overlay recipe, a randomizer draw from a chore list, a prize from completing a Star Chart, a task idea, an extra credit suggestion. Mom chooses which reveal type to use per context. No reveal type is inherently tied to any specific system. They are all interchangeable wrappers around a shared reward card component.

Every animation in this PRD follows three non-negotiable rules. First, **celebration only** — no failure animations, no shame effects, no punishment visuals. If something doesn't happen, the system says nothing. Second, **shell-aware** — Play shell gets the bounciest, longest, most particle-rich version of every animation. Guided gets moderate. Independent gets clean. Adult gets subtle. The same animation scales across shells via PRD-03's token system. Third, **`prefers-reduced-motion` respect** — every animation has a static fallback that conveys the same information without movement.

> **Mom experience goal:** When my kid completes a task, I want to see their face light up. Not because a screen told them they're great, but because a small, beautiful, themed animation made the moment feel like it mattered. The reveals should feel elegant and pristine — like opening a beautifully wrapped gift, not a cheap carnival game. And when I set up which reveal type to use for which reward, it should be as easy as picking from a visual catalog.

> **Kid experience goal:** Every time I finish something, something cool happens. Points float up. My background comes alive. And when I earn a reward, I get to open it — spin a wheel, flip a card, scratch off a mystery, crack open an egg. The moment of finding out what I got is the best part.

> **Depends on:** PRD-24 (Foundation) defines the points engine, reward economy, treasure box data model, and gamification event pipeline. PRD-24A defines the overlay engine, dashboard backgrounds, daily collectible system, DailyCelebration Step 4 wiring, per-theme reveal container definitions, and the Visual Asset Manifest. PRD-03 defines shell animation tokens (Play bouncy cubic-bezier 350ms, Guided standard 250ms, Adult subtle 200ms). PRD-10 defines the dashboard grid and widget infrastructure. PRD-11 defines the DailyCelebration 5-step sequence.

---

## Architectural Boundaries

### What PRD-24B Owns

| System | Scope |
|--------|-------|
| Reveal Type Library | 8 reveal types as a flat modular library: treasure chest, gift box, cracking egg, slot machine (video-based); spinner wheel, three doors, card flip, scratch-off (CSS/SVG interactive). Architecture, shared reward card, theme-aware sparkle overlay, attachment to any reveal context. |
| Video-based reveal playback | `<video>` element implementation (WebM primary, MP4 fallback, poster frame, playsinline muted), end-of-video reward card transition, CSS sparkle overlay timing synced to video playback. Video files are uploaded assets — PRD-24B specs how the code plays them. |
| CSS/SVG interactive reveal specs | Full interaction specs for spinner, doors, cards, scratch-off: tap targets, drag behavior, deceleration curves, animation timing per shell, theme color adaptation (Tier 1 via CSS tokens at MVP), shape adaptation per visual theme (Tier 2 post-MVP). |
| Star Chart animation sequence | Star generation on task completion → star flies from button to grid slot → settles with bounce → confetti burst → chart completion celebration → gallery save. |
| Color-Reveal tracker system | Grayscale-to-color zone reveal algorithm, zone map JSON format (SVG path-based), reveal animation (bloom + glow), completed image gallery save, printable line art export (individual + batch PDF). |
| Micro-celebration animations | Points popup on task completion, streak fire growth, level-up burst. All shell-aware per PRD-03 tokens. |
| Background celebration animation specs | CSS/SVG implementation detail for PRD-24A's 3-tier background celebrations: SVG silhouette elements, keyframe definitions, animation timing per tier, random selection with repeat avoidance, non-blocking positioning. |
| Dashboard background readability system | Gradient overlay spec per shell, card opacity adjustments, dark mode adaptation. |
| Treasure box widget idle animations | Locked state breathing with progress ring, unlocked state bounce with gold ring, transition animation between states. |
| Evolution flipbook celebration | 5-phase streak evolution images as CSS flipbook (0.5s per frame, 2s dramatic pause + gold shimmer burst on phase 5). |
| Theme-aware animation styling master reference | How PRD-03 shell animation tokens apply to every gamification animation. Play = bounciest/longest/most particles. Guided = moderate. Independent = clean. Adult = subtle. |
| Reveal Type configuration UI | Mom's reveal type picker in Settings: visual catalog of all 8 types, per-context assignment. |

### What Other PRDs Own (Not Duplicated Here)

| PRD | What It Owns | How PRD-24B Connects |
|-----|-------------|---------------------|
| PRD-03 (Design System) | Shell animation tokens, color tokens, motion guidelines, SparkleOverlay gold effects, `prefers-reduced-motion` rules | PRD-24B consumes shell tokens for all animation timing. Every animation references PRD-03 tokens, never hardcoded values. |
| PRD-10 (Widgets) | Dashboard grid, widget types, tracker infrastructure, Color-Reveal tracker type definition | PRD-24B specifies the animations that play inside PRD-10's widget containers (Star Chart, Color-Reveal, treasure box widget). |
| PRD-11 (Victory Recorder) | DailyCelebration 5-step structure, celebration narrative | PRD-24B's micro-celebrations fire during task completions. Reveal types can be used within DailyCelebration Step 4's collectible reveal. |
| PRD-24 (Foundation) | Points engine, reward economy, treasure box data model, gamification event pipeline, streak system | PRD-24B animates the data PRD-24 produces. Points popup reads from pipeline. Treasure box widget reads from `treasure_boxes` table. |
| PRD-24A (Overlays) | Overlay engine, dashboard backgrounds, daily collectibles, per-theme reveal container definitions, Visual Asset Manifest, Content Creation Pipeline | PRD-24A defines WHAT each theme's reveal containers look like (pet carrier, dragon egg, etc.) and generates the video files. PRD-24B specs HOW those videos play and how interactive reveals animate. |

---

## User Stories

### Reveal Types (Mom)
- As a mom, I want to choose which reveal type (treasure chest, spinner, card flip, etc.) to use when my child earns a reward, so the reveal experience matches my child's personality — my 5-year-old loves cracking eggs, my 12-year-old prefers the card flip.
- As a mom, I want the reveal type catalog to show me a preview of each type so I can pick without guessing what each one looks like.
- As a mom, I want to assign different reveal types to different contexts — spinner for randomizer chores, gift box for reward milestones, scratch-off for bonus tasks — so each context feels distinct.
- As a mom, I want the reveal animations to look elegant and pristine, not cheesy or tacky, so the app feels premium.

### Reveal Types (Children)
- As a child, I want to open my reward in a fun way — crack an egg, spin a wheel, flip a card — so finding out what I got feels exciting.
- As a child, I want the reveal to match my theme — if I have the Dragon theme, I want to crack a dragon egg, not a generic box.
- As a child, I want sparkles and confetti when my reward appears, so the moment feels special.

### Star Chart
- As a young child, I want to tap "I did it!" and watch a star fly across the screen and land in my chart with a sparkle, because watching it happen is the best part.
- As a child, I want the last star on my chart to trigger a big celebration — confetti, gold sparkles, and a message about my prize — because finishing the chart should feel amazing.
- As a mom, I want the completed star chart to save to my child's gallery automatically so we have a record of the accomplishment.

### Color-Reveal
- As a child, I want to watch a grayscale picture slowly come to life in color as I complete tasks, so I can see my progress turning into something beautiful.
- As a mom, I want to choose images from a library organized by theme and complexity, with simple 3-5 zone images for my toddler and ornate 50-100 zone images for my teen or myself.
- As a mom, I want to print completed coloring images for my child's wall and export a batch of all their completed images as a single PDF.

### Micro-Celebrations
- As a child, I want to see "+10 ⭐" float up from my task when I complete it, so I know I earned something right away.
- As a child, I want my streak widget to show a growing flame animation when my streak gets longer, so I can feel the momentum.
- As a child, I want a sparkle bar across the screen when I level up, so leveling up feels like a big moment.

### Background Celebrations
- As a child, I want a small themed animation (a fish swimming by, a star shooting across) every time I complete a task, so my dashboard feels alive and responsive to my effort.
- As a child, I want bigger, more dramatic animations when I hit milestones (3rd task, 5th task, whole routine), so the big moments feel extra special.

### Treasure Box Widget
- As a child, I want my treasure box to gently pulse on my dashboard when I'm close to unlocking it, with a progress ring showing how close I am, so I'm motivated to keep going.
- As a child, I want the treasure box to bounce and turn gold when it's ready to open, so I know immediately that something is waiting for me.

### Evolution Flipbook
- As a child, I want to watch my creature evolve through all 5 phases in a rapid flipbook when it reaches legendary form — egg to hatchling to juvenile to adult to legendary with gold sparkles — because this is the payoff for 21 days of effort.

---

## Screens

### Screen 1: Reveal Type Library — Shared Architecture

The Reveal Type Library is a flat catalog of 8 reveal animations. Each is a standalone component that wraps the act of revealing content — a reward, a randomizer result, a prize, a task idea, or any other content that benefits from a moment of anticipation before the reveal.

**Two implementation categories, one shared endpoint:**

**Video-based reveals** (uploaded video assets, passive viewing):
1. **Treasure Chest** — Classic chest opens, lid lifts, light spills out
2. **Gift Box** — Ribbon unties, box unwraps, content rises
3. **Cracking Egg** — Egg wobbles, cracks spread, shell breaks apart (can be flipbook from stacked images)
4. **Slot Machine** — Reels spin, decelerate, land on result

**CSS/SVG interactive reveals** (code-built, user participates):
5. **Spinner Wheel** — Tap to spin, wheel decelerates to predetermined result
6. **Three Doors** — Tap one of three doors, chosen door swings open
7. **Card Flip** — Tap one of three face-down cards, chosen card flips with 3D transform
8. **Scratch-Off** — Drag finger across card to scratch away mask layer

**Both categories terminate with the same shared component:**

**Reward Card** — A themed card that slides/fades in after the reveal animation completes, showing the revealed content (reward name, description, image if applicable). The card is accompanied by a theme-aware CSS sparkle/confetti overlay.

**RevealType interface:**

```typescript
interface RevealType {
  id: string;                    // 'treasure_chest', 'spinner_wheel', etc.
  name: string;                  // "Treasure Chest", "Spinner Wheel"
  category: 'video' | 'interactive';
  description: string;           // Mom-facing description
  previewImageKey: string;       // Static preview for the catalog picker
  
  // Theme adaptation
  themeAdaptation: {
    tier1: 'color_tokens';       // MVP: CSS color tokens adapt to active theme
    tier2?: 'shape_variants';    // Post-MVP: per-theme shape variants (castle doors for Medieval, etc.)
  };
  
  // For video-based reveals
  videoConfig?: {
    posterFrameKey: string;      // Static poster frame image key
    videoWebMKey: string;        // WebM video key
    videoMP4Key: string;         // MP4 fallback key
    rewardCardTimestamp: number; // Seconds into video when reward card should appear
  };
  
  // For interactive reveals
  interactionConfig?: {
    type: 'tap_to_spin' | 'tap_to_select' | 'drag_to_scratch';
    resultDeterminedBy: 'server'; // Result always predetermined server-side
  };
}
```

**Reveal context attachment:**

Any system that needs to reveal content can specify a `reveal_type_id`. This is a configuration choice, not a code dependency. The reveal type receives the content to reveal and wraps it in the appropriate animation.

```typescript
interface RevealContext {
  revealTypeId: string;          // Which reveal type to use
  content: {
    title: string;               // "You earned: Extra Screen Time!"
    description?: string;        // "30 minutes of bonus screen time this weekend"
    imageUrl?: string;           // Optional reward image
    pointValue?: number;         // Optional points display
  };
  themeOverride?: string;        // Override active theme for this reveal (usually null — uses active theme)
}
```

**Where reveal types can be attached (non-exhaustive):**

| Context | Configured By | Example |
|---------|--------------|---------|
| Treasure box unlock (PRD-24) | Mom, in treasure box config | Gift box reveal for completing 10 tasks |
| Randomizer draw (PRD-09B) | Mom, in randomizer list config | Spinner wheel for weekly chore assignment |
| Overlay recipe/quest completion (PRD-24A) | Mom, in overlay recipe config | Cracking egg for brewing a potion |
| Star Chart completion prize | Mom, in Star Chart config | Card flip for the star chart prize |
| Reward redemption (PRD-24) | Mom, in reward menu config | Treasure chest for a high-point reward |
| Custom reveal (any) | Mom, in task/list/widget config | Scratch-off for a surprise bonus task |

---

### Screen 2: Reveal Type Picker (Settings)

> **Hosted within:** Any configuration surface where mom assigns a reveal type — PRD-22 Settings (treasure box config, gamification settings), PRD-09B (randomizer list config), widget configuration modals.

**What the user sees:**

A visual catalog modal showing all 8 reveal types as preview cards in a 2×4 grid (mobile) or 4×2 grid (tablet/desktop). Each card shows a static preview image, the reveal type name, and a brief description.

```
┌──────────────────────────────────────────────────┐
│  Choose a Reveal Type                             │
│  ─────────────────────────────────────────────── │
│                                                   │
│  [🎁 Treasure    [🎁 Gift       [🥚 Cracking   │
│   Chest]          Box]           Egg]            │
│   Classic open    Unwrap &       Wobble, crack   │
│                   reveal         & hatch!        │
│                                                   │
│  [🎰 Slot        [🎡 Spinner    [🚪 Three      │
│   Machine]        Wheel]         Doors]          │
│   Reels spin &    Tap to spin,   Pick a door,    │
│   land            win a prize    find the prize  │
│                                                   │
│  [🃏 Card        [✨ Scratch-                    │
│   Flip]           Off]                            │
│   Pick a card,    Scratch to                      │
│   flip to reveal  reveal                          │
│                                                   │
│  [Preview]  [Select]  [Cancel]                    │
└──────────────────────────────────────────────────┘
```

**Interactions:**
- Tap a card to select it (highlight border in `--color-accent`)
- [Preview] plays a demo animation of the selected reveal type with sample content
- [Select] confirms the choice and returns to the parent configuration screen
- [Cancel] dismisses without changes

**Theme adaptation preview:** If the child has an active overlay theme, the preview shows the themed variant (pet carrier instead of generic chest, dragon egg instead of generic egg). If no overlay is active, generic variants are shown.

---

### Screen 3: Video-Based Reveal Playback (Treasure Chest, Gift Box, Cracking Egg, Slot Machine)

**What the user sees:**

A modal overlay containing the reveal experience. The modal has a semi-transparent dark backdrop. The reveal content is centered vertically and horizontally.

**Animation sequence (all video-based reveals follow this pattern):**

```
Phase 1 — POSTER FRAME (0.5s)
├── Modal backdrop fades in (200ms)
├── Poster frame image appears at center (the container's idle/closed state)
├── Brief pause to establish the container (300ms)

Phase 2 — VIDEO PLAYBACK (3-5s, varies by video)
├── <video> element replaces poster frame, begins playing
├── Video plays: idle → anticipation wobble → dramatic open → content space
├── Video is playsinline, muted, no controls visible
├── User cannot interact during playback (non-skippable for Play/Guided; 
│   tap-to-skip available for Independent/Adult after 1s)

Phase 3 — REWARD CARD ENTRANCE (synced to video end)
├── At the video's reward card timestamp (last 0.5-1s of video):
│   ├── CSS sparkle overlay begins (theme-colored particles burst from center)
│   ├── Reward card slides up from bottom of modal into the content space
│   ├── Card entrance uses shell-appropriate easing:
│   │   ├── Play: cubic-bezier(0.34, 1.56, 0.64, 1) — bouncy overshoot
│   │   ├── Guided: ease-out (250ms)
│   │   └── Independent/Adult: ease (200ms)
│   └── Video freezes on final frame (or fades to 50% opacity behind card)

Phase 4 — REWARD CARD DISPLAY (until dismissed)
├── Reward card fully visible with content:
│   ├── Reward title (large, themed heading font)
│   ├── Reward description (body text)
│   ├── Reward image (if provided, centered above text)
│   ├── Point value badge (if applicable, e.g., "+50 ⭐")
│   └── [Collect] button (or [Awesome!] for Play shell)
├── CSS sparkle overlay continues gently (reduced intensity, looping)
├── Tap [Collect] or tap outside modal to dismiss
└── Modal backdrop fades out (200ms)
```

**`<video>` element implementation:**

```html
<video
  playsinline
  muted
  preload="metadata"
  poster="{posterFrameUrl}"
  style="width: 100%; max-width: 400px; border-radius: var(--vibe-radius-card);"
>
  <source src="{videoWebMUrl}" type="video/webm">
  <source src="{videoMP4Url}" type="video/mp4">
  <!-- Fallback: show poster frame as static image if video fails -->
  <img src="{posterFrameUrl}" alt="Reveal container" />
</video>
```

**Cracking egg flipbook variant:** When the cracking egg uses stacked images instead of video, the implementation replaces the `<video>` element with a CSS flipbook: a series of PNG frames displayed in rapid succession using `animation-timing-function: steps(N)` where N is the number of frames. The flipbook plays at the same timing as a video would (3-5 seconds total). The reward card entrance syncs to the final frame.

**Theme adaptation (Tier 1 — MVP):**
- The video files themselves are themed (pet carrier video for Pets theme, dragon egg video for Dragons theme) — uploaded as part of PRD-24A's content pipeline
- The CSS sparkle overlay uses the active PRD-03 theme's `--color-accent` and `--color-gold` tokens for particle colors
- The reward card uses standard theme tokens for background, text, and borders
- If no overlay is active, generic fallback videos are used

**Theme adaptation (Tier 2 — Post-MVP):**
- Reward card shape/decoration adapts per theme (rounded parchment for Apothecary, pixel-bordered for Pixel Loot)

---

### Screen 4: Spinner Wheel (Interactive Reveal)

**What the user sees:**

A modal overlay with a large spinner wheel centered on screen.

**Wheel design:**
- 8 segments (default) — mom can choose 6, 8, or 12 segments when configuring the reveal
- Each segment shows an icon or short text label representing a possible reward category or themed icon
- Segments use alternating theme colors derived from `--color-accent`, `--color-accent-subtle`, and `--color-bg-secondary`
- A fixed pointer/indicator arrow at the top of the wheel marks the winning segment
- The wheel fills approximately 70% of the modal's available width (max 360px diameter on mobile)

**Interaction sequence:**

```
Phase 1 — PRESENTATION (0.5s)
├── Modal backdrop fades in
├── Wheel appears with a gentle scale-up (0 → 1.0, ease-out, 300ms)
├── Pointer arrow pulses once to draw attention
├── "Tap to Spin!" label below wheel (Play: large, bouncy. Guided: standard. Independent: subtle.)

Phase 2 — SPIN (tap to activate, 3-4s animation)
├── User taps the wheel (the entire wheel is the tap target)
├── Result is already determined server-side — the animation targets that segment
├── Wheel accelerates instantly to peak velocity (first 200ms)
├── Wheel decelerates on a cubic-bezier ease-out curve over 3-4 seconds
│   ├── Play: cubic-bezier(0.15, 0.80, 0.30, 1.00), 4s — long, dramatic deceleration
│   ├── Guided: cubic-bezier(0.20, 0.75, 0.35, 1.00), 3.5s
│   └── Independent/Adult: cubic-bezier(0.25, 0.70, 0.40, 1.00), 3s
├── Wheel lands precisely on the predetermined winning segment
├── Final "tick" past the pointer — tiny overshoot and settle (50ms)

Phase 3 — RESULT (0.5s → Reward Card)
├── Winning segment pulses/glows briefly (200ms)
├── CSS sparkle burst from the pointer
├── Reward Card entrance (same shared component from Screen 3, Phase 3-4)
```

**Segment count options (mom-configurable):**

| Segments | Best For | Visual Feel |
|----------|----------|-------------|
| 6 | Small reward pools, young children (Play) | Spacious, easy to read |
| 8 | Default — balanced variety and readability | Standard |
| 12 | Large reward pools, older children | Dense, exciting |

**No-FOMO rule:** The wheel shows possible *categories* or themed icons, not specific competing rewards. The child never sees "I almost won X but got Y instead." The segments represent the visual experience, not a real probability display.

---

### Screen 5: Three Doors (Interactive Reveal)

**What the user sees:**

A modal overlay with three doors displayed side by side horizontally.

**Door design:**
- Three doors of equal size, evenly spaced, with subtle themed styling
- Each door has a door handle and a slight 3D perspective (CSS box-shadow suggesting depth)
- Doors use theme color tokens: frame in `--color-border`, surface in `--color-bg-secondary`, handle in `--color-accent`
- Doors have a subtle idle shimmer (a slow CSS gradient sweep across the surface, 4s loop) to indicate interactivity

**Card back template library (mom-selectable):**
Mom chooses a door design template from a catalog of 3-4 per theme. All templates use theme color tokens for automatic theme adaptation. Design quality target: collectible card game quality — foil-embossed textures, subtle gradients, theme-appropriate iconography. Never tacky, never cheesy.

**Interaction sequence:**

```
Phase 1 — PRESENTATION (0.8s)
├── Modal backdrop fades in
├── Three doors appear with staggered entrance:
│   ├── Left door: slides up from bottom (0ms delay)
│   ├── Center door: slides up (100ms delay)
│   └── Right door: slides up (200ms delay)
├── Brief anticipation moment — all three doors wobble gently once (300ms)
│   (Play: bouncy wobble. Guided: gentle sway. Independent: skip wobble.)
├── "Pick a door!" label appears below

Phase 2 — SELECTION (user taps one door)
├── All three doors are individual tap targets (min touch target per shell token)
├── Touch-start: touched door glows slightly (10% brighter, instant)
├── Touch-end/tap: selection confirmed
├── Result was predetermined server-side — the selected door always contains the reward

Phase 3 — REVEAL (1-2s)
├── Chosen door:
│   ├── Swings open with a CSS 3D perspective transform (rotateY -110°)
│   ├── Door swing uses shell-appropriate timing:
│   │   ├── Play: 600ms, cubic-bezier(0.34, 1.56, 0.64, 1) — bouncy swing
│   │   ├── Guided: 400ms, ease-out
│   │   └── Independent/Adult: 300ms, ease
│   ├── Behind the door: a glowing light/sparkle effect (CSS radial-gradient expanding)
│   └── Reward content visible through the open doorway
├── Unchosen doors:
│   ├── Fade out simultaneously (opacity 1 → 0, 400ms ease)
│   ├── NEVER open, NEVER reveal what was behind them
│   └── They are visual decoys — no real content behind them

Phase 4 — REWARD CARD (same shared component)
├── Reward Card slides in from the open doorway
├── CSS sparkle overlay synced to card entrance
```

---

### Screen 6: Card Flip (Interactive Reveal)

**What the user sees:**

A modal overlay with three face-down cards arranged in a horizontal row.

**Card design:**
- Three cards of equal size, evenly spaced, with a themed card-back design
- Card backs use a template from the card back design library (mom-selectable, 3-4 templates per theme)
- All card back templates use theme color tokens — automatic theme adaptation
- Design quality: elegant, foil-embossed feel using CSS gradients and subtle pattern overlays. Think premium trading card, not playing card.
- Cards have a subtle floating animation (translateY oscillation ±2px, 3s cycle, staggered timing)

**Interaction sequence:**

```
Phase 1 — PRESENTATION (0.8s)
├── Modal backdrop fades in
├── Three cards appear with staggered entrance:
│   ├── Cards deal in from top-right, landing with a slight bounce
│   ├── 150ms stagger between each card
├── Brief shimmer across all three card backs (CSS gradient sweep, 400ms)
├── "Pick a card!" label appears below

Phase 2 — SELECTION (user taps one card)
├── All three cards are individual tap targets
├── Touch-start: touched card lifts slightly (translateY -4px, scale 1.02x)
├── Touch-end/tap: selection confirmed

Phase 3 — REVEAL (0.8-1.2s)
├── Chosen card:
│   ├── 3D CSS flip: rotateY(0°) → rotateY(180°) 
│   │   (card back is the front face, card front is the back face with reward)
│   ├── Flip timing per shell:
│   │   ├── Play: 800ms, cubic-bezier(0.34, 1.56, 0.64, 1)
│   │   ├── Guided: 600ms, ease-out
│   │   └── Independent/Adult: 400ms, ease
│   ├── Midpoint (90°): brief flash of light effect (opacity pulse)
│   └── Card face shows reward preview (icon + name)
├── Unchosen cards:
│   ├── Fade out (opacity 1 → 0, 400ms)
│   ├── NEVER flip — they are decorative decoys
│   └── No content exists behind them

Phase 4 — REWARD CARD (same shared component)
├── Reward Card expands from the flipped card's position
├── CSS sparkle overlay
```

---

### Screen 7: Scratch-Off (Interactive Reveal)

**What the user sees:**

A modal overlay with a single scratch-off card centered on screen.

**Card design:**
- One large card (approximately 300×200px on mobile, scales up on tablet/desktop)
- Card surface covered by a scratch-off mask layer — a textured opaque coating hiding the reward underneath
- Scratch-off texture is themed:

| Texture | Used By Themes | Visual |
|---------|---------------|--------|
| Gold foil | Pets, Mythical Creatures, generic fallback | Warm metallic gold with subtle sparkle pattern |
| Aged parchment | Apothecary, Dragons | Worn paper texture with wax seal accent |
| Metallic pixel grid | Pixel Loot | 8-bit metallic squares pattern |
| Sparkle frost | (Future themes) | Crystal frost over iridescent base |

- Below the mask: the reward content (title, description, image) is fully rendered but hidden
- "Scratch to reveal!" instruction text above the card
- A small "Reveal All" button in the corner for accessibility (auto-reveals without scratching)

**Interaction sequence:**

```
Phase 1 — PRESENTATION (0.5s)
├── Modal backdrop fades in
├── Card appears with scale-up entrance (0.8 → 1.0, 300ms ease-out)
├── A brief sparkle sweeps across the scratch surface (hint of what's underneath)
├── "Scratch to reveal!" instruction appears

Phase 2 — SCRATCHING (user-driven, 2-10s typically)
├── Implementation: HTML Canvas masking
│   ├── Canvas overlay with scratch texture drawn as the mask
│   ├── Touch/mouse move events erase the mask in a circular brush pattern
│   ├── Brush size: 40px diameter (mobile), 30px (desktop)
│   ├── Erased areas become transparent, revealing the reward content beneath
├── Haptic feedback (if device supports): light vibration on each scratch stroke
├── Auto-reveal threshold: when 60% of the mask is scratched, the remaining 
│   mask dissolves automatically (opacity fade, 500ms)
│   ├── This prevents tedious corner-scratching
├── "Reveal All" button: instantly dissolves the entire mask (same 500ms fade)

Phase 3 — FULL REVEAL (when mask fully dissolved)
├── CSS sparkle burst from the card center
├── Card content fully visible
├── Reward Card treatment applied to the existing card (border glow, sparkle overlay)
├── [Collect] button appears below
```

---

### Screen 8: CSS Sparkle Overlay (Shared Component)

The CSS sparkle overlay accompanies all 8 reveal types at the moment of reward reveal. It is the visual punctuation that makes the moment feel celebratory.

**Implementation:**

Particle system using CSS-animated `<div>` elements (no canvas, no WebGL — pure CSS for performance and simplicity).

**Particle properties:**
- Count: Play 16-24, Guided 10-16, Independent 6-10, Adult 4-6
- Shapes: circles (60%) + rotated squares/diamonds (40%)
- Colors: drawn from active theme tokens — primary uses `--color-gold` variations (#D4AF37, #E8C547, #B8942A), accent uses `--color-accent` at 50% opacity
- Size: 4-8px diameter, randomized per particle
- Animation: particles burst outward from a center point in random directions, decelerating with gravity simulation (ease-out vertical, linear horizontal), fading to opacity 0 over their lifetime
- Duration: Play 1.6s, Guided 1.2s, Independent 0.8s, Adult 0.6s
- Z-index: above the reward card, below the modal close button

**`prefers-reduced-motion` fallback:** Sparkle overlay is replaced with a static gold border glow on the reward card (box-shadow animation, 0 → full glow in 200ms, no particles).

---

### Screen 9: Star Chart Animation Sequence

The Star Chart (PRD-10 Widget Catalog, Master Manuscript Section 9) is a digital sticker chart where the animation IS the feature. The moment of tapping and watching the star appear is the primary reward for young children.

**Star implementation:** Stars are CSS/SVG elements for the default gold star. Custom star types (heart, paw print, rainbow star, sparkle star) use small PNG/SVG icon assets. The star element is sized per shell: Play 32px, Guided 24px, Independent 18px.

**Animation sequence on task completion:**

```
Phase 1 — BUTTON TAP (immediate)
├── Child taps "I did it!" button (large, prominent, themed)
├── Button press animation: scale 0.95x → 1.0x (100ms)
├── Confetti burst from button position (PRD-03 SparkleOverlay quick burst pattern)
│   ├── Play: 8-12 gold particles, 0.8s
│   ├── Guided: 6-8 particles, 0.6s
│   └── Independent: skip confetti, brief gold flash on button

Phase 2 — STAR FLIGHT (0.6-1.0s)
├── New star element appears at the button's screen position
├── Star follows a parabolic arc from button to the next empty grid slot
│   ├── Play: full parabolic arc (rises 60px above straight line, then descends)
│   │   using cubic-bezier for natural "toss" feel, 1.0s duration
│   ├── Guided: gentle arc (rises 30px above), 0.8s
│   └── Independent: straight line with ease-out, 0.6s
├── Star scales from 0.5x → 1.2x during flight, then settles to 1.0x on landing

Phase 3 — STAR LANDING (0.3s)
├── Star reaches its grid slot
├── Landing bounce:
│   ├── Play: bouncy settle (1.2x → 0.9x → 1.05x → 1.0x, 300ms)
│   ├── Guided: gentle settle (1.1x → 0.98x → 1.0x, 200ms)
│   └── Independent: smooth ease to 1.0x (150ms)
├── Small sparkle burst on landing (3-5 particles, 200ms)
├── Grid slot background briefly pulses with --color-gold (100ms)
├── Counter updates: "8/15 stickers earned!"

Phase 4 — CHART COMPLETION (if this was the last star)
├── Brief pause (500ms) to let the last star settle
├── All stars pulse simultaneously with gold glow 
│   (box-shadow animation, 0 → gold glow → 0, 600ms, all stars in sync)
├── Full SparkleOverlay celebration:
│   ├── Play: maximum celebration — 24 particles, 1.6s, expanding gold ring,
│   │   screen-wide confetti rain effect (small gold/accent colored dots 
│   │   falling from top, 2s)
│   ├── Guided: moderate celebration — 16 particles, 1.2s
│   └── Independent: brief glow + 8 particles, 0.8s
├── Prize card slides up from bottom:
│   ├── Prize title and description (from star chart configuration)
│   ├── Prize image (if mom uploaded one)
│   ├── "You did it! 🎉" message (Play only — emoji permitted in Play shell)
│   ├── If a reveal type is configured for the prize: the reveal type animation 
│   │   plays instead of the simple prize card
├── Auto-save to Achievement Gallery (toast: "Saved to your gallery!")
│   ├── Play: "Added to your gallery! ⭐" with brief sparkle
│   ├── Guided/Independent: "Saved to gallery" subtle toast
├── If auto_reset_on_complete is true: brief transition, new empty chart appears
```

**`prefers-reduced-motion` fallback:** Stars appear instantly in their grid slot (no flight animation). Chart completion shows the prize card immediately with a static gold border, no particles or pulsing.

---

### Screen 10: Color-Reveal Tracker System

The Color-Reveal tracker transforms a grayscale image into a full-color image one zone at a time as a child completes achievements. It is the long-form version of the Star Chart — where the Star Chart fills slots, the Color-Reveal fills an image with color.

**Zone Map JSON Format:**

Each Color-Reveal image has an associated zone map that defines the spatial boundaries of each colorable zone. Zones use SVG `<path>` data for resolution-independent boundaries.

```typescript
interface ColorRevealImage {
  id: string;
  name: string;                          // "Monarch Butterfly"
  category: string;                      // 'garden', 'space', 'ocean', 'fantasy'
  complexityLevel: 1 | 2 | 3 | 4 | 5;  // Determines zone count range
  zones: ColorZone[];
  fullColorImageUrl: string;             // Original colored image
  lineArtImageUrl: string;               // B&W line art for printing
  thumbnailUrl: string;
}

interface ColorZone {
  id: string;                            // 'z1', 'z2', etc.
  name: string;                          // "Upper Wings", "Blue Body"
  targetColor: string;                   // Hex color: "#FF6B9D"
  svgPath: string;                       // SVG path data defining zone boundary
                                         // e.g., "M68,30 C120,20 175,45 180,100..."
  order: number;                         // Reveal order (1 = first revealed)
}
```

**Complexity level → zone count mapping:**

| Level | Zone Count | Best For | Example |
|-------|-----------|----------|---------|
| 1 | 3–5 zones | Play mode, toddlers | Simple butterfly (wings, body, flowers) |
| 2 | 5–10 zones | Young Guided | Colorful fish with distinct sections |
| 3 | 10–20 zones | Guided | Detailed garden scene |
| 4 | 20–50 zones | Independent / Teen | Complex landscape |
| 5 | 50–100 zones | Adult coloring book style | Ornate mandala or architectural scene |

**Zone map authoring:** Zone maps are generated during the content pipeline. Claude analyzes the source color image and generates the zone map JSON, defining logical color regions as SVG paths with their target colors. This is a pipeline task, not a runtime operation.

> **Forward note:** Post-MVP, a simple drag-and-paint zone editor could let mom define custom zones for uploaded images. The SVG path format supports this — zones are just closed paths that can be drawn with a pointing device.

**Mom configuration:**
- Mom selects an image from the Color-Reveal library (organized by category and complexity)
- Mom sets the achievement source: which tasks, trackers, or other data feeds this reveal (e.g., "every book finished reveals a zone," "every 5 tasks reveals a zone")
- Mom can choose the reveal strategy:

| Strategy | Description | Best For |
|----------|-------------|----------|
| Sequential | Zones reveal in the defined order (most prominent colors first) | Default, all ages |
| Gradual | Each zone reveals in shades from light to dark before moving to the next | Older kids who enjoy subtlety |
| Random | Surprise — a random unrevealed zone is revealed each time | Kids who enjoy unpredictability |

**Reveal animation (on each zone reveal):**

```
Phase 1 — TRIGGER (immediate, on qualifying achievement)
├── Achievement detected (task complete, book finished, etc.)
├── System selects the next zone to reveal (per strategy)

Phase 2 — ZONE BLOOM (1.5s)
├── The selected zone transitions from grayscale to full color:
│   ├── CSS filter transition on the zone's SVG clip-path area:
│   │   grayscale(100%) → grayscale(0%) over 800ms, ease-out
│   ├── Simultaneously, a soft radial glow emanates from the zone center:
│   │   box-shadow / filter: drop-shadow in the zone's target color,
│   │   opacity 0 → 0.6 → 0 over 1.5s
│   ├── The bloom feels like color "seeping" into the zone, not snapping
├── Shell variations:
│   ├── Play: glow is larger, more saturated, with 3-5 small sparkle particles
│   │   around the zone edges
│   ├── Guided: standard glow, no particles
│   └── Independent: subtle glow, fast transition (800ms total)

Phase 3 — PROGRESSIVE EXCITEMENT (later zones are more dramatic)
├── Zones 1 through (total/2): standard bloom animation
├── Zones (total/2) through (total-1): bloom + expanding ring effect 
│   (a thin circle that expands outward from the zone, 400ms, fade out)
├── Final zone (completion): full celebration sequence (see Phase 4)

Phase 4 — IMAGE COMPLETION CELEBRATION
├── Brief pause (300ms) after last zone reveals
├── All zones pulse simultaneously (brief brightness increase, 400ms)
├── Full SparkleOverlay celebration (same as Star Chart completion)
├── "Your image is complete!" card slides up with:
│   ├── Full-color image thumbnail
│   ├── Image name and completion date
│   ├── [Save to Gallery] (auto-saves, shows confirmation toast)
│   ├── [Print] (exports line art version as PDF — see Print Export below)
│   └── For Play shell: bigger celebration, "You colored the whole thing! 🎨"
```

**Print Export:**

Individual image export:
- Tapping [Print] on a completed image generates a single-page PDF containing the black-and-white line art version at 1024×1024 at 300dpi, fitting on standard letter/A4 with margins
- The PDF includes the image name and child's name as a footer
- Available from the Color-Reveal widget completion card and from the Coloring Gallery widget

Batch export:
- From the Coloring Gallery widget (PRD-10, Widget Catalog I-19): a [Print Collection] button generates a multi-page PDF of all completed images (or selected images)
- Each image gets one page, with name and completion date in the footer
- PDF generated client-side or via a lightweight server function

**`prefers-reduced-motion` fallback:** Zones transition from grayscale to color with a simple opacity crossfade (200ms), no glow, no particles, no expanding rings. Completion shows the prize card immediately with no pulse.

---

### Screen 11: Micro-Celebration Animations

Micro-celebrations are brief, non-blocking animations that fire in real-time on task completion events. They provide immediate positive feedback without interrupting the child's workflow.

**11A — Points Popup**

Triggered on every task completion when gamification is enabled AND `visualization_mode` is NOT "hidden."

```
Animation:
├── "+{points} {currencyIcon}" text element appears at the completed task card's 
│   screen position
│   ├── Text uses the child's configured currency icon and amount
│   ├── e.g., "+10 ⭐" or "+1 🌟" or "+25 💎"
├── Text floats upward 80px from origin over its duration
├── Text fades from opacity 1 → 0 during the final 30% of the animation
├── Shell variations:
│   ├── Play: font-size 24px, cubic-bezier(0.34, 1.56, 0.64, 1) upward bounce,
│   │   1.2s duration, brief sparkle trail (3 tiny particles following the text)
│   ├── Guided: font-size 18px, ease-out float, 1.0s, no trail
│   ├── Independent: font-size 14px, ease-out float, 0.6s, no trail
│   └── Adult: font-size 12px, ease float, 0.5s (if gamification visible)
├── Non-blocking: user can continue interacting during popup
├── Multiple popups stack: if tasks complete rapidly, each popup offsets 
│   horizontally by 30px to avoid overlap, max 3 visible at once
```

**11B — Streak Fire Animation**

Triggered when a task completion extends the current streak. Renders on the streak widget (PRD-10 streak tracker type).

```
Animation:
├── The streak flame icon grows in size corresponding to the streak length:
│   ├── Streak 1-6: small flame (1.0x scale)
│   ├── Streak 7-13: medium flame (1.15x scale, warmer color shift)
│   ├── Streak 14-20: large flame (1.3x scale, orange → gold shift)
│   ├── Streak 21+: maximum flame (1.4x scale, gold + sparkle particles)
├── On each streak increment: brief flame "flare" animation
│   ├── Flame scales up 1.2x its current size over 200ms, then settles back
│   ├── Brief particle burst from flame tip (2-3 spark particles)
│   ├── Streak counter number animates: old number slides up and fades,
│   │   new number slides in from below
├── Shell variations:
│   ├── Play: flame has gentle idle sway animation (3s loop), maximum flare
│   ├── Guided: subtle idle pulse, moderate flare
│   └── Independent: no idle animation, brief flare only
```

**11C — Level-Up Burst**

Triggered when accumulated points cross a level threshold (PRD-24 XP/Level system).

```
Animation:
├── Full-width sparkle bar shoots across the screen horizontally
│   ├── A thin line of gold sparkle particles traverses from left to right
│   │   across the full viewport width
│   ├── Duration: Play 1.2s, Guided 0.8s, Independent 0.5s
│   ├── Particles leave a brief trail that fades over 400ms
├── "Level Up!" badge appears at screen center
│   ├── Badge scales from 0 → 1.2x → 1.0x (bounce)
│   ├── Badge shows new level number: "Level 5!"
│   ├── Badge auto-dismisses after 2s (Play), 1.5s (Guided), 1s (Independent)
├── Non-blocking: appears as an overlay, user can continue interacting
├── Adult shell: level-up is shown as a subtle toast notification, no sparkle bar
```

**`prefers-reduced-motion` fallback for all micro-celebrations:**
- Points popup: static "+10 ⭐" text appears briefly at task position, no float (opacity only, 1s)
- Streak fire: number updates instantly, no flare or particles
- Level-up: toast notification only, no sparkle bar or badge animation

---

### Screen 12: Background Celebration Animations

PRD-24A defines that each dashboard background has 3 random celebration animations per tier (small, medium, large). PRD-24B specifies the CSS/SVG implementation.

**Animation element style: Themed silhouettes**

Each animation element (fish, dolphin, whale, shooting star, rocket, butterfly, etc.) is a simple SVG path — a recognizable silhouette, not a detailed illustration. SVG paths are filled using the active PRD-03 theme's color tokens (primarily `--color-accent` and `--color-accent-subtle`), making them automatically theme-aware regardless of which dashboard background is displayed.

**Why silhouettes:** Silhouettes are theme-compatible (any color works), file-size tiny, animation-smooth, and complement rather than compete with the dashboard background image. They read clearly at any size against any background.

**Animation tier specifications:**

| Tier | Trigger | Duration | Element Scale | Particle Count | Example (Ocean) |
|------|---------|----------|--------------|----------------|-----------------|
| Small | Every task completion | 2s | 30-50px | 0 | Small fish swims across |
| Medium | 3rd daily task, routine complete | 3s | 60-100px | 3-5 sparkle trails | Dolphin leaps in arc |
| Large | 5th+ daily task (Perfect Day) | 4s | 100-160px | 8-12 sparkle trails | Whale breaches across screen |

**Animation positioning:**
- Elements are absolutely positioned in the dashboard viewport, above the background image but below dashboard cards and widgets
- Entry point: randomly selected from left, right, or top edge (varies per animation definition)
- Flight path: defined as a CSS `@keyframes` with `transform: translate()` + `rotate()` keyframes along a natural-feeling path (arcs, curves, not straight lines)
- No element ever crosses the center 40% of the viewport vertically (where primary dashboard content lives) — animations stay in the periphery

**Random selection with repeat avoidance:**
- Each background defines its celebration config in `background_library.celebration_config` (JSONB)
- On each task completion event, the system selects the appropriate tier, then randomly picks one of the 3 animations for that tier
- **Repeat avoidance:** The last-played animation ID is stored in component state. The next selection excludes that ID, choosing randomly from the remaining 2. This ensures no animation plays twice in a row within a session.

**Shell animation token scaling:**

| Property | Play | Guided | Independent | Adult |
|----------|------|--------|-------------|-------|
| Element size | 1.4x base | 1.0x base | 0.8x base | 0.6x base |
| Duration | 1.2x base | 1.0x base | 0.85x base | 0.7x base |
| Timing function | cubic-bezier(0.34, 1.56, 0.64, 1) | ease | ease | ease |
| Trail particles | Yes (sparkle) | Subtle | None | None |
| Idle visibility | Always visible | Always visible | Visible if enabled | OFF by default |

**Background celebration config JSONB structure (in `background_library`):**

```json
{
  "small": [
    { "id": "ocean_small_1", "svgPath": "M0,0 C10,5...", "entryEdge": "left", "exitEdge": "right", "pathKeyframes": "..." },
    { "id": "ocean_small_2", "svgPath": "...", "entryEdge": "right", "exitEdge": "left", "pathKeyframes": "..." },
    { "id": "ocean_small_3", "svgPath": "...", "entryEdge": "left", "exitEdge": "right", "pathKeyframes": "..." }
  ],
  "medium": [ ... ],
  "large": [ ... ]
}
```

**`prefers-reduced-motion` fallback:** Background celebrations are replaced with a brief, subtle color flash along the viewport edge corresponding to the animation's entry point (e.g., a 200ms gold tint sweep along the left edge). No moving elements.

---

### Screen 13: Dashboard Background Readability System

Dashboard backgrounds (PRD-24A) display themed images behind dashboard content. A readability gradient overlay ensures text and cards remain legible.

**Gradient overlay implementation:**

A CSS `::before` pseudo-element on the dashboard container, positioned between the background image and the dashboard content.

**Light mode gradient:**

| Shell | Gradient | Rationale |
|-------|----------|-----------|
| Play | `linear-gradient(to bottom, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.92) 100%)` | Maximum readability for large text |
| Guided | `linear-gradient(to bottom, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.85) 100%)` | Standard readability |
| Independent | `linear-gradient(to bottom, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.78) 100%)` | More background visible |
| Adult | `linear-gradient(to bottom, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.72) 100%)` | Most background visible (adult choice) |

**Dark mode gradient:**

| Shell | Gradient |
|-------|----------|
| Play | `linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.88) 100%)` |
| Guided | `linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.80) 100%)` |
| Independent | `linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.72) 100%)` |
| Adult | `linear-gradient(to bottom, rgba(0,0,0,0.50) 0%, rgba(0,0,0,0.68) 100%)` |

**Card opacity adjustments:**
- When a background is active, dashboard cards get an additional `background-color` opacity boost:
  - Play: card backgrounds at 95% opacity (near-opaque for maximum text contrast)
  - Guided: 90% opacity
  - Independent: 85% opacity
  - Adult: 85% opacity

**Background positioning:**
- `background-size: cover; background-position: center;`
- `position: fixed` on desktop (background stays still as content scrolls — parallax feel)
- `position: fixed` on mobile (same behavior; optional scroll-linked parallax is post-MVP)
- When no background is selected: no gradient overlay rendered, standard PRD-03 theme background applies

> **Post-MVP:** A "Background intensity" slider in Settings that lets the user adjust the gradient overlay opacity. Fixed per shell at MVP.

---

### Screen 14: Treasure Box Widget Idle Animations

The treasure box widget (PRD-10, 1×1 size) sits on the child's dashboard and shows the current treasure box state. It has two visual states with distinct idle animations and a transition animation between them.

**Locked state (box in progress):**

```
Visual:
├── Treasure box image (themed to active overlay — pet carrier, dragon egg, etc.)
│   or generic treasure chest if no overlay active
├── Progress ring: a thin circular SVG stroke around the box image
│   ├── Stroke color: --color-accent at 30% opacity (background), 
│   │   --color-accent at 100% (progress fill)
│   ├── Ring fills clockwise based on progress percentage 
│   │   (from treasure_boxes.unlock_progress)
│   ├── Ring animates smoothly when progress updates (CSS transition on 
│   │   stroke-dashoffset, 500ms ease)
├── Progress label below: "7/10 tasks" or "70%" (configurable by mom)

Idle animation:
├── Subtle breathing scale: 1.0x → 1.02x → 1.0x, 3s ease-in-out infinite
├── This is a passive "I'm here, I'm growing" signal — NOT an interaction affordance
├── No glow (glow = actionable in standard UI patterns)
├── Shell variations:
│   ├── Play: breathing + occasional subtle shimmer across the box surface (6s cycle)
│   ├── Guided: breathing only
│   └── Independent: no idle animation (static with progress ring)
```

**Unlocked state (ready to open):**

```
Visual:
├── Same treasure box image, but now with a gold-tinted overlay
├── Progress ring: fully filled, ring color transitions to --color-gold
├── "Ready to open!" label below (Play: "Open me! 🎁" — emoji OK in Play)

Idle animation:
├── Gentle bounce: translateY(0) → translateY(-4px) → translateY(0), 2s 
│   ease-in-out infinite
├── Gold ring pulse: box-shadow alternates between subtle and bright gold glow, 
│   3s cycle
├── The bounce + gold says "I'm actionable, tap me!" — distinct from the locked 
│   breathing animation
├── Shell variations:
│   ├── Play: bouncier (translateY -6px), with small sparkle particles orbiting 
│   │   the box (2-3 tiny gold dots on a circular CSS animation path, 4s cycle)
│   ├── Guided: standard bounce, no particles
│   └── Independent: subtle translateY -2px, minimal glow pulse
```

**Transition animation (locked → unlocked):**

```
├── Triggered when unlock_progress reaches 100% (gamification pipeline event)
├── Box shakes briefly: translateX oscillation (±3px, 4 cycles, 400ms)
├── Flash of gold light (box-shadow: 0 0 20px var(--color-gold), 200ms in, 300ms out)
├── Sparkle burst from box center (6-8 gold particles, 0.8s)
├── Progress ring color transitions from --color-accent to --color-gold (300ms)
├── Idle animation switches from breathing to bouncing
├── Play shell: add brief "Ding!" sound effect stub (audio integration is post-MVP, 
│   but the trigger point is defined here)
```

**Interaction on tap (unlocked state):**
- Opens the configured reveal type for this treasure box (Screen 3-7, depending on mom's choice)
- After reveal completes: box returns to locked state with progress reset to 0

**`prefers-reduced-motion` fallback:** No idle animations. Locked state shows static box with progress ring. Unlocked state shows static box with gold ring and "Ready to open!" label. Transition is an instant state swap with no shake/flash.

---

### Screen 15: Evolution Flipbook Celebration

When a streak evolution creature reaches legendary form (phase 5, day 21 — from PRD-24A Game Modes Addendum), a special celebration animation plays through all 5 evolution phases as a CSS flipbook.

**Flipbook implementation:**

The 5 phase images for the creature variant (egg → hatchling → juvenile → adult → legendary) are the same grid-sliced images from the content pipeline. They are displayed sequentially using CSS animation with `steps()` timing.

```
Animation sequence:

Phase 1 — SETUP (0.5s)
├── Modal overlay appears with dark backdrop
├── Creature's name and "is evolving!" text fades in
├── Phase 1 image (egg) appears at center, scaled to ~200px

Phase 2 — FLIPBOOK (3.5s)
├── Images cycle through phases 1→2→3→4→5
│   ├── Phase 1 → Phase 2: 0.5s hold, then crossfade to next (200ms fade)
│   ├── Phase 2 → Phase 3: 0.5s hold, crossfade
│   ├── Phase 3 → Phase 4: 0.5s hold, crossfade
│   ├── Phase 4 → Phase 5: 0.5s hold, crossfade
│   ├── Each transition has a brief scale pulse (1.0x → 1.05x → 1.0x)
│   │   to punctuate the change
├── Text updates with each phase:
│   ├── Phase 2: "Meet your [creature]!"
│   ├── Phase 3: "[Name] is growing!"
│   ├── Phase 4: "[Name] has matured!"
│   └── Phase 5: "[Name] has become LEGENDARY!"

Phase 3 — LEGENDARY DRAMATIC PAUSE (2.0s)
├── Phase 5 image holds at center
├── Gold shimmer overlay activates:
│   ├── Animated CSS linear-gradient that sweeps across the image on a loop
│   │   (angle: 120deg, gold highlight band moving left to right, 2s per sweep)
│   ├── Shimmer is rendered as a semi-transparent overlay div with 
│   │   mix-blend-mode: overlay
├── If is_golden = true (unbroken streak, no pauses or grace days used):
│   ├── Gold shimmer is more intense (higher opacity, wider highlight band)
│   ├── Gold particle ring orbits the image (8 small gold dots on a circular 
│   │   CSS animation path, 3s orbit period)
│   ├── "GOLDEN Legendary!" text in gold with shimmer effect
├── Gold sparkle burst: full SparkleOverlay celebration (Play: maximum)
├── "Saved to your collection!" toast

Phase 4 — DISMISS
├── Tap anywhere or [Awesome!] button to dismiss
├── Modal fades out
├── Creature is saved to the collection gallery
```

**Shell variations:**
- Play: full dramatic sequence, maximum particles, bouncy text entrances, 2s legendary pause
- Guided: moderate particles, standard text, 1.5s legendary pause
- Independent: clean transitions, minimal particles, 1s legendary pause, no text drama
- Adult: not applicable (evolution is a child-facing mechanic)

**`prefers-reduced-motion` fallback:** All 5 phase images shown in a static vertical strip (or horizontal row), with the legendary phase highlighted with a gold border. No crossfades, no shimmer, no particles. "LEGENDARY!" text with static gold color.

---

## Theme-Aware Animation Styling Master Reference

This section is the authoritative reference for how PRD-03's shell animation tokens scale every gamification animation in PRD-24B. All animation implementations MUST reference these token mappings.

### Shell Animation Token Application

| Animation Property | Play | Guided | Independent | Adult |
|-------------------|------|--------|-------------|-------|
| **Timing function** | `cubic-bezier(0.34, 1.56, 0.64, 1)` — bouncy overshoot | `ease` or `ease-out` | `ease` | `ease` |
| **Base duration multiplier** | 1.4x | 1.0x | 0.85x | 0.7x |
| **Particle count multiplier** | 1.5x | 1.0x | 0.5x | 0.25x |
| **Element scale multiplier** | 1.4x | 1.0x | 0.85x | 0.7x |
| **Idle animations** | Full (breathing, shimmer, orbit) | Moderate (breathing) | Minimal or none | None |
| **Sparkle trails** | Yes | Subtle | No | No |
| **Confetti rain** | Yes (on major milestones) | No | No | No |
| **Emoji in celebration text** | Permitted | Prohibited | Prohibited | Prohibited |
| **Skip/dismiss delay** | 1s before skip available | 0.5s | Immediate | Immediate |
| **Sound effect stubs** | Defined (audio post-MVP) | Defined | None | None |

### Token Resolution Example

For a background celebration animation with base duration 3s, element size 80px:

| Shell | Duration | Element Size | Timing | Particles |
|-------|----------|-------------|--------|-----------|
| Play | 4.2s (3 × 1.4) | 112px (80 × 1.4) | bouncy | 12-15 (10 × 1.5) |
| Guided | 3.0s | 80px | ease | 8-10 |
| Independent | 2.55s (3 × 0.85) | 68px (80 × 0.85) | ease | 4-5 (10 × 0.5) |
| Adult | 2.1s (3 × 0.7) | 56px (80 × 0.7) | ease | 2-3 (10 × 0.25) |

### Reduced Motion (`prefers-reduced-motion: reduce`)

Per PRD-03: all transitions become instant or ≤100ms. No bouncing, wobbling, scaling, or elastic effects in any shell. SparkleOverlay replaced with static gold visual feedback. Idle animations disabled entirely.

**PRD-24B specific reduced-motion rules (additive to PRD-03):**
- Reveal types: skip to reward card immediately on activation. Video-based reveals show poster frame → reward card. Interactive reveals show result immediately.
- Star Chart: stars appear instantly in grid slots, no flight
- Color-Reveal: zones transition with 200ms opacity crossfade, no glow
- Micro-celebrations: static text appears briefly, no float animation
- Background celebrations: brief color flash on viewport edge, no moving elements
- Treasure box: static visual state, no breathing/bouncing
- Evolution flipbook: static strip of all 5 phases, no crossfade

---

## Visibility & Permissions

| Role | Access | Notes |
|------|--------|-------|
| Mom / Primary Parent | Full configuration | Selects reveal types per context, configures Color-Reveal images, manages Star Charts. Sees all animations in preview mode. |
| Dad / Additional Adult | Same as Mom if granted gamification management permission | Can configure reveal types and trackers for assigned children |
| Special Adult | View-only during shift | Sees children's animations fire during task completions. Cannot configure reveal types or animation settings. |
| Independent (Teen) | Experiences own animations | Sees micro-celebrations, background celebrations, reveal animations. Cannot change reveal type assignments (mom controls). Can toggle background visibility. |
| Guided / Play | Experiences own animations | Sees all celebrations. Play gets maximum animation intensity. Cannot configure anything. |

### Shell Behavior

| Shell | Animation Intensity | Reveal Types Available | Configuration |
|-------|--------------------|-----------------------|---------------|
| Play | Maximum — bounciest, longest, most particles, emoji permitted | All 8 types | Mom configures everything |
| Guided | Moderate — balanced, clear feedback | All 8 types | Mom configures everything |
| Independent | Clean — brief, subtle, no particles | All 8 types | Mom configures; teen can toggle background on/off |
| Adult | Subtle — minimal, toast-based, off by default | All 8 types (if gamification enabled) | Self-configured if gamification enabled |

---

## Data Schema

PRD-24B introduces no new database tables. All animation behavior is derived from existing data models and shell-level configuration tokens.

### Data Sources Consumed

| Data | Source Table | Source PRD | What PRD-24B Does With It |
|------|-------------|-----------|---------------------------|
| Points earned on task completion | `gamification_events` | PRD-24 | Drives points popup amount and currency icon |
| Current streak | `family_members.current_streak` | PRD-24 / PRD-01 | Drives streak fire scale |
| Current level | `family_members.gamification_level` | PRD-24 / PRD-01 | Drives level-up burst trigger |
| Treasure box state | `treasure_boxes` | PRD-24 | Drives widget idle animation (locked/unlocked) + progress ring |
| Active dashboard background | `dashboard_backgrounds` | PRD-24A | Drives which celebration animations play |
| Background celebration config | `background_library.celebration_config` | PRD-24A | Defines available SVG elements per background |
| Evolution creature phase | `evolution_creatures.current_phase` | PRD-24A Addendum | Drives flipbook celebration trigger |
| Color-Reveal zone state | `tracker_color_reveals` | Master Manuscript | Drives which zones are revealed vs. grayscale |
| Star Chart state | `user_trackers` (Star Chart type) | PRD-10 | Drives star count, grid layout, completion state |
| Reveal type assignment | `gamification_configs` / context-specific config | PRD-24 | Determines which reveal type plays for each context |
| Visualization mode | `gamification_configs.visualization_mode` | PRD-24 | If "hidden," points popup is suppressed |

### Configuration Extensions to Existing Tables

**`gamification_configs` (PRD-24) — add column:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| default_reveal_type | TEXT | 'treasure_chest' | NOT NULL | Default reveal type for this member's treasure boxes. One of: 'treasure_chest', 'gift_box', 'cracking_egg', 'slot_machine', 'spinner_wheel', 'three_doors', 'card_flip', 'scratch_off' |

**`treasure_boxes` (PRD-24) — add column:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| reveal_type | TEXT | NULL | NULL | Override reveal type for this specific treasure box. NULL = use member's default_reveal_type from gamification_configs |

**`lists` (PRD-09B) — add column:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| reveal_type | TEXT | NULL | NULL | Reveal type for randomizer draws from this list. NULL = no reveal animation (simple draw) |

> **Audit readiness:** These column additions are registered in the Cross-PRD Impact Addendum for backporting to PRD-24 and PRD-09B during the pre-build audit.

---

## Flows

### Incoming Flows (How Data Gets INTO This Feature)

| Source | How It Works |
|--------|-------------|
| Gamification event pipeline (PRD-24) | Task completion → pipeline step 10 (micro-celebration trigger) fires the points popup. Pipeline step 8 updates streak/level/treasure box data that drives animations. |
| Background celebration trigger (PRD-24A) | Task completion event includes the active dashboard background key. PRD-24B reads the background's celebration config and plays the appropriate tier animation. |
| Treasure box unlock event (PRD-24) | Pipeline detects treasure box reached 100% progress → fires unlock transition animation on widget → box enters unlocked idle state. |
| Reveal type selection (Settings) | Mom selects a reveal type in configuration UI → stored on the relevant config record (gamification_configs, treasure_boxes, lists, etc.) |
| Star Chart task completion | Child taps "I did it!" → star generation animation fires → star count incremented. |
| Color-Reveal achievement | Qualifying achievement detected → next zone selected per strategy → bloom animation fires → zone state updated. |
| Evolution phase change (PRD-24A Addendum) | Streak evolution creature reaches phase 5 → flipbook celebration fires. |

### Outgoing Flows (How This Feature Feeds Others)

| Destination | How It Works |
|-------------|-------------|
| Achievement Gallery (PRD-10 / Master Manuscript) | Star Chart completion auto-saves to gallery. Color-Reveal completion auto-saves to gallery. |
| Coloring Gallery Widget (I-19) | Completed Color-Reveal images are displayed in the gallery widget with print export capability. |
| DailyCelebration Step 4 (PRD-11 / PRD-24A) | Reveal types can be used within Step 4's collectible reveal sub-step. The overlay collectible reveal can use any of the 8 reveal types if configured. |
| Print export (PDF) | Color-Reveal line art images exported as single-page or batch PDF for printing. |

---

## AI Integration

No direct AI integration in PRD-24B. All animations are deterministic, driven by data from the gamification pipeline.

**Indirect AI connection:** LiLa's context assembly (PRD-05) can reference a child's recent celebrations, completed Color-Reveal images, and Star Chart progress to generate personalized encouragement. This is PRD-05's responsibility, not PRD-24B's.

---

## Edge Cases

### Video Fails to Load
- If the WebM and MP4 sources both fail to load, the `<video>` element's fallback `<img>` shows the poster frame as a static image
- After a 2-second timeout, skip directly to the reward card display with sparkle overlay
- No error message shown to the child — the reward still appears, just without the video ceremony

### Rapid Task Completions
- If multiple tasks complete within 2 seconds, micro-celebrations queue: each points popup appears with a 300ms stagger
- Background celebrations do NOT queue — only the first task's celebration plays; subsequent completions within the animation's duration are skipped (the animation is already playing)
- This prevents celebration overload while still showing all earned points

### Star Chart — Multiple Stars in Quick Succession
- If a child rapidly taps "I did it!" multiple times (e.g., catching up on missed entries), each star animation plays but with compressed timing: 400ms between stars instead of full sequence
- If the compressed queue reaches chart completion, the completion celebration waits until the last star has landed

### Color-Reveal — All Zones Revealed in One Session
- If a batch of achievements reveals multiple zones at once (e.g., importing data from another system), zones reveal in rapid sequence (300ms per zone, no glow — just color snap) before playing the completion celebration for the final zone

### No Active Overlay Theme
- Reveal types that have per-theme variants (treasure chest, egg, gift box, slot machine) fall back to generic designs when no overlay is active
- CSS/SVG interactive reveals (spinner, doors, cards, scratch-off) always work — they use color tokens only, no theme-specific assets required
- Background celebrations work independently of overlay status

### Color-Reveal Image with Zones that Cross Color Boundaries
- Zone paths may overlap slightly at edges (anti-aliasing). The reveal algorithm processes zones in order, so later zones render on top of earlier ones. This naturally handles overlapping boundaries.

### Reveal Type Not Configured
- If a reveal context has no reveal_type configured (null), the content is displayed directly in a simple card with sparkle overlay — no reveal animation wrapping
- This is the graceful fallback: reward still appears, just without the ceremony

### Device Performance
- If the device drops below 30fps during a particle animation, the particle count is automatically halved
- CSS `will-change: transform, opacity` is set on animated elements to promote GPU compositing
- All animations use `transform` and `opacity` only (no layout-triggering properties like `width`, `height`, `top`, `left`)

---

## Tier Gating

| Feature Key | Description | Tier (Future) |
|-------------|-------------|---------------|
| `gamification_reveal_types` | Access to the full Reveal Type Library (all 8 types) | Enhanced |
| `gamification_reveal_interactive` | Access to CSS/SVG interactive reveals (spinner, doors, cards, scratch-off). When gated, only video-based reveals available. | Full Magic |
| `gamification_color_reveal` | Access to the Color-Reveal tracker system | Enhanced |
| `gamification_star_chart_animation` | Access to animated Star Chart (vs. static grid tracker) | Essential |
| `gamification_background_celebrations` | Access to themed background celebration animations | Enhanced |

> **Tier rationale:** Star Chart animation is Essential because it's the core delight for Play-mode children. The animated experience IS the product for that age group. Color-Reveal and background celebrations add richness but aren't critical for core functionality. Interactive reveals are the most premium experience.

> **Beta behavior:** All feature keys return true. Tier restrictions added through configuration post-beta.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Sound effect trigger points | Audio playback system | Post-MVP audio PRD |
| Reveal Type shape adaptation per visual theme (Tier 2) | Per-theme door shapes, card shapes, etc. | Post-MVP content expansion |
| Background intensity slider in Settings | User-configurable gradient opacity | Post-MVP Settings enhancement |
| Color-Reveal custom zone editor (drag-and-paint) | Mom-created zone maps for uploaded images | Post-MVP content tools |
| Background parallax scrolling on mobile | Scroll-linked background movement | Post-MVP polish |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| DailyCelebration Step 4 micro-celebration trigger | PRD-11 / PRD-24A | Points popup and streak fire fire in real-time during task completions, feeding into Step 4's accumulated display |
| Gamification event pipeline Step 10 (micro-celebration) | PRD-24 | Points popup animation triggered by pipeline step 10 event |
| Treasure box widget animated states | PRD-24 / PRD-10 | Locked/unlocked idle animations and transition specified |
| Background celebration animations (3 tiers) | PRD-24A | CSS/SVG implementation fully specified — silhouette elements, keyframes, tier sizing, positioning |
| Color-Reveal tracker animation | Master Manuscript Section 8 | Zone bloom animation, completion celebration, gallery save, print export specified |
| Star Chart animation | Master Manuscript Section 9 | Star flight, landing, and completion celebration specified |
| Reveal visual selection (PRD-24 Screen 8 Section I) | PRD-24 | Replaced by Reveal Type Library — flat catalog of 8 types, mom picks per context |
| Evolution celebration animation | PRD-24A Game Modes Addendum | Flipbook implementation specified with gold shimmer variant |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] Reveal Type Library implemented with all 8 reveal types as interchangeable components
- [ ] Video-based reveals: `<video>` playback with poster frame, WebM/MP4 sources, reward card transition, CSS sparkle overlay
- [ ] Cracking egg flipbook variant working (CSS `steps()` animation over stacked images)
- [ ] Spinner wheel: 6/8/12 segment options, tap-to-spin, predetermined result, deceleration curve per shell
- [ ] Three doors: three doors with door design templates, tap-to-select, chosen door opens, unchosen fade out
- [ ] Card flip: three cards with card back templates, tap-to-select, 3D CSS flip, unchosen fade out
- [ ] Scratch-off: canvas-based mask, touch/mouse drag scratching, 60% auto-reveal threshold, themed textures (4 at launch), "Reveal All" accessibility button
- [ ] Shared reward card component rendering correctly with theme tokens
- [ ] CSS sparkle overlay: particle counts per shell, theme-colored, reduced-motion fallback
- [ ] Reveal Type Picker UI: visual catalog, preview, selection, per-context assignment
- [ ] Star Chart animation: button tap → confetti → star arc flight (Play) / straight line (Independent) → bounce landing → counter update
- [ ] Star Chart completion: all-star pulse → SparkleOverlay → prize card → auto-save to gallery
- [ ] Color-Reveal: zone map JSON consumed, grayscale → color bloom animation per zone, progressive excitement on later zones
- [ ] Color-Reveal completion: all-zone pulse → celebration → gallery save
- [ ] Color-Reveal print export: individual image as single-page PDF (line art version)
- [ ] Color-Reveal batch export: selected/all completed images as multi-page PDF
- [ ] Color-Reveal strategies working: Sequential, Gradual, Random
- [ ] Micro-celebrations: points popup (position-aware, shell-scaled, skipped when visualization_mode=hidden)
- [ ] Micro-celebrations: streak fire (scale by streak length, flare on increment)
- [ ] Micro-celebrations: level-up burst (sparkle bar, badge, auto-dismiss)
- [ ] Background celebrations: SVG silhouette elements rendering with theme color tokens
- [ ] Background celebrations: 3-tier sizing (small/medium/large) with correct triggers
- [ ] Background celebrations: repeat avoidance (no same animation twice in a row)
- [ ] Background celebrations: peripheral positioning (no content area overlap)
- [ ] Dashboard readability gradient: per-shell opacity values, light/dark mode, card opacity boost
- [ ] Treasure box widget: locked state breathing + progress ring
- [ ] Treasure box widget: unlocked state bounce + gold ring
- [ ] Treasure box widget: transition animation (shake → flash → sparkle → state swap)
- [ ] Evolution flipbook: 5-phase crossfade sequence, 2s legendary pause, gold shimmer overlay
- [ ] Evolution flipbook: golden variant detection (is_golden=true → enhanced shimmer + particle ring)
- [ ] All animations respect shell tokens: Play bouncy/long/maximum, Guided moderate, Independent clean, Adult subtle
- [ ] All animations respect `prefers-reduced-motion`: static fallbacks for every animation
- [ ] All colors from CSS tokens — zero hardcoded hex values in animation code
- [ ] Reveal types attachable to: treasure boxes, randomizer draws, overlay recipe completions, Star Chart prizes, reward redemptions
- [ ] `default_reveal_type` column added to `gamification_configs`
- [ ] `reveal_type` column added to `treasure_boxes`
- [ ] `reveal_type` column added to `lists`
- [ ] `useCanAccess()` hooks wired for all 5 feature keys (all return true during beta)
- [ ] RLS: reveal type configuration follows parent table RLS (family-scoped, mom reads all)

### MVP When Dependency Is Ready
- [ ] Background celebrations fire on task completion events (requires PRD-24 gamification pipeline)
- [ ] Treasure box widget reads from `treasure_boxes` table (requires PRD-24)
- [ ] Reveal types triggered by overlay recipe completion (requires PRD-24A overlay engine)
- [ ] Evolution flipbook triggered by streak evolution phase change (requires PRD-24A Game Modes Addendum)
- [ ] Star Chart widget hosted in PRD-10 dashboard grid (requires PRD-10)
- [ ] Color-Reveal widget hosted in PRD-10 dashboard grid (requires PRD-10)
- [ ] Color-Reveal images loaded from `coloring_image_library` (requires content pipeline)
- [ ] Background celebration configs loaded from `background_library` (requires PRD-24A)

### Post-MVP
- [ ] Reveal type Tier 2: per-theme shape variants (castle doors for Medieval, hobbit doors for Forest, etc.)
- [ ] Background intensity slider (user-configurable gradient opacity)
- [ ] Background parallax scrolling on mobile
- [ ] Color-Reveal custom zone editor (mom draws zones on uploaded images)
- [ ] Color-Reveal images themed to overlay aesthetics
- [ ] Sound effects for reveal types, Star Chart, and level-up
- [ ] Lottie/sprite sheet upgrades for background celebration animations
- [ ] Additional scratch-off textures (per-theme unique textures)
- [ ] Additional card back / door design templates
- [ ] Rarity visual treatment for reveal types (common = standard animation, legendary = enhanced animation with extra particles)
- [ ] TTS audio for celebration text ("You did it!")

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: **Reveal Type Library is a flat, modular catalog.** All 8 reveal types are first-class citizens. No hierarchy — treasure chest is a reveal type, not a container that uses a reveal type. Any reveal type can be attached to any reveal context (treasure box, randomizer, reward, Star Chart prize, etc.).
- [ ] Convention: **Two implementation categories for reveals.** Video-based (treasure chest, gift box, cracking egg, slot machine) use `<video>` elements with uploaded assets. CSS/SVG interactive (spinner, doors, cards, scratch-off) are code-built. Both terminate with the same shared reward card + CSS sparkle overlay.
- [ ] Convention: **Video assets for reveals are uploaded, not generated by code.** PRD-24B specifies playback behavior. The content pipeline (PRD-24A) generates and uploads the video files.
- [ ] Convention: **Unchosen items NEVER reveal.** In three doors and card flip, unchosen options fade out. They are decorative decoys with no content behind them. No FOMO mechanics.
- [ ] Convention: **Interactive reveal results are predetermined server-side.** The spinner wheel, three doors, and card flip animations are decorative — the result is already determined before the animation begins. The animation targets the predetermined result.
- [ ] Convention: **All gamification animations consume PRD-03 shell tokens.** Play = bouncy cubic-bezier 350ms, max particles. Guided = ease 250ms, moderate. Independent = ease 200ms, minimal. Adult = ease 150ms, subtle. Use the duration/particle/scale multipliers from the Theme-Aware Animation Styling Master Reference.
- [ ] Convention: **All gamification animations respect `prefers-reduced-motion`.** Every animation has a static fallback. Reveal types skip to reward card. Stars appear in grid slots. Color zones snap to color. Background celebrations become edge color flashes. Micro-celebrations show static text.
- [ ] Convention: **Background celebration SVG elements are themed silhouettes, not detailed illustrations.** Filled with active PRD-03 theme color tokens. Theme-aware, not background-aware.
- [ ] Convention: **Background celebrations use repeat avoidance.** Track last-played animation ID in component state. Exclude it from next random selection.
- [ ] Convention: **Micro-celebration points popup respects visualization_mode.** If gamification_configs.visualization_mode = 'hidden', the points popup is suppressed entirely.
- [ ] Convention: **Treasure box idle animations use breathing (locked) and bouncing (unlocked) as distinct signals.** Breathing = passive/in-progress. Bouncing + gold = actionable/ready. No glow on locked state (glow = actionable in standard UI).
- [ ] Convention: **Color-Reveal zone maps use SVG path data** for resolution-independent zone boundaries. Zone maps are generated in the content pipeline, not at runtime.
- [ ] Convention: **Color-Reveal supports complexity levels 1-5** mapping to 3-100 zones. Level 1 (3-5 zones) for Play-mode toddlers through Level 5 (50-100 zones) for ornate adult coloring.
- [ ] Convention: **Star Chart star flight uses parabolic arc in Play shell, straight line in Independent.** Guided uses a gentle arc.
- [ ] Convention: **All animation CSS uses `transform` and `opacity` only.** No layout-triggering properties. `will-change: transform, opacity` on animated elements.
- [ ] Convention: **Reveal types, scratch-off textures, and card/door templates are not married to any overlay.** They are standalone components usable anywhere, with theme color coordination via CSS tokens.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: None (PRD-24B is an animation specification PRD)

Tables modified:
- `gamification_configs` (PRD-24): +1 column `default_reveal_type` TEXT DEFAULT 'treasure_chest'
- `treasure_boxes` (PRD-24): +1 column `reveal_type` TEXT NULL
- `lists` (PRD-09B): +1 column `reveal_type` TEXT NULL

Enums referenced (not created — these are valid values for the TEXT columns above):
- Reveal types: `'treasure_chest'`, `'gift_box'`, `'cracking_egg'`, `'slot_machine'`, `'spinner_wheel'`, `'three_doors'`, `'card_flip'`, `'scratch_off'`

Triggers added: None

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **Reveal Type Library is a flat catalog of 8 types, not a hierarchy.** Treasure chest, gift box, cracking egg, and slot machine are reveal types, not containers that use reveal types. They sit alongside spinner, doors, cards, and scratch-off as equals. | Cleaner architecture. Any reveal type can wrap any reveal context. No coupling between reveal types and specific gamification systems. |
| 2 | **Video-based reveals use uploaded video files; code only handles playback.** The content pipeline generates and uploads WebM/MP4 videos. PRD-24B specs the `<video>` element, poster frame, reward card transition, and sparkle overlay timing. | Separation of content and code. Video quality is a pipeline concern; animation orchestration is a code concern. |
| 3 | **WebM primary format with MP4 fallback.** `<source>` elements in priority order. Poster frame `<img>` as final fallback if both video formats fail. | WebM gives smaller files + alpha transparency. MP4 is the universal fallback. Poster frame ensures the experience degrades gracefully. |
| 4 | **Spinner wheel: tap-to-spin with 6/8/12 segment options.** 8 segments default. Mom chooses segment count per reveal configuration. Result predetermined server-side. | Tap is simpler and more reliable than flick/drag. 8 segments is the sweet spot between visual interest and mobile readability. Options let mom match the reward pool size. |
| 5 | **Card flip and three doors: mom-selectable design templates, 3-4 per theme.** All templates use theme color tokens. Design quality target: collectible card game quality, elegant and pristine. | Mom wants visual variety without garish results. Templates ensure quality control while offering personalization. Theme tokens ensure automatic theme adaptation. |
| 6 | **Scratch-off uses canvas-based masking with 60% auto-reveal threshold.** 4 launch textures grouped by aesthetic set (gold foil, aged parchment, metallic pixel, sparkle frost), not per-theme. "Reveal All" button for accessibility. | Canvas gives the most authentic scratch feel. Auto-reveal prevents tedious corner-scratching. Grouped textures reduce asset count while providing variety. Accessibility button is essential. |
| 7 | **Color-Reveal zones use SVG path data, not pixel coordinates or mask PNGs.** Zone maps generated in content pipeline by Claude analyzing source images. | Resolution-independent, clean boundaries, supports future drag-and-paint editor. SVG paths enable the CSS glow animation on reveal. |
| 8 | **Color-Reveal complexity levels 1-5, supporting 3-100 zones.** Level 1 for toddlers (3-5 zones), Level 5 for ornate adult coloring (50-100 zones). Mom configurable. | Serves the full age range. Simple butterflies for Play-mode kids, ornate mandalas for teens and adults. The reveal algorithm handles any zone count. |
| 9 | **Star Chart: parabolic arc flight in Play, straight line in Independent.** Guided gets a gentle arc. | Arc feels like a natural "toss" for young children — more playful. Straight line is more efficient for older users who want quicker feedback. |
| 10 | **Dashboard readability gradient: fixed per shell at MVP, slider post-MVP.** Play gets the most opaque overlay, Adult gets the least. | Keeps Settings simple at launch. Each shell's values are calibrated for its text size and audience. Slider adds personalization later without architectural changes. |
| 11 | **Evolution flipbook: CSS crossfade over stacked images, gold shimmer via CSS overlay.** Not a generated animation. Zero extra assets beyond the 5 phase images already in the grid. | Minimizes content pipeline work. The grid-sliced images double as animation frames. CSS shimmer distinguishes golden from regular legendary with no additional art. |
| 12 | **Treasure box idle: breathing (locked) vs. bouncing (unlocked).** Progress ring shows proximity to unlock. No glow on locked state. | Breathing = passive. Bouncing + gold = actionable. Progress ring builds anticipation. Avoids UI inconsistency where glow means "interact" in standard patterns. |
| 13 | **Background celebrations: SVG silhouettes with theme color tokens, repeat avoidance.** Not background-aware — theme-aware. No same animation twice in a row. | Silhouettes are tiny, performant, and automatically work with any theme. Repeat avoidance keeps the experience feeling curated. Theme-awareness means one set of SVGs works across all 44 color themes. |
| 14 | **Points popup suppressed when visualization_mode is "hidden."** | If mom chose to hide gamification for a member, the popup shouldn't override that choice. Respects parent's display preference. |
| 15 | **Color-Reveal print export: individual + batch PDF at MVP.** Individual from completion card and gallery. Batch from gallery widget. | Individual is the obvious need. Batch respects the no-tech-debt principle and serves the mom who doesn't want to print one at a time. |
| 16 | **Star Chart completion auto-saves to gallery, no prompt.** Brief toast confirmation. | Preserves celebration momentum. No decision fatigue at the peak emotional moment. |
| 17 | **Three doors and card flip: unchosen items are empty decoys.** One real reward, random placement, others purely decorative. | Showing three real items where the child "loses" two violates celebration-only philosophy. The child always wins. No disappointment. |
| 18 | **PRD-24B introduces no new tables.** 3 column additions to existing tables. | PRD-24B is an animation specification — it animates data owned by PRD-24, PRD-24A, PRD-09B, and PRD-10. The only data it needs to store is which reveal type to use per context. |
| 19 | **Reveal types and scratch-off textures are not married to any overlay.** Available as standalone components for any context. Theme-coordinated via CSS tokens. | Maximum flexibility. A mom without any overlay active can still use card flip for a randomizer draw. Scratch-off textures work everywhere. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Per-theme shape variants for interactive reveals (Tier 2) | Post-MVP content expansion — castle doors for Medieval, pixel borders for Pixel Loot, etc. |
| 2 | Sound effects for reveals and celebrations | Post-MVP audio PRD — trigger points defined in this PRD |
| 3 | Background intensity slider | Post-MVP Settings enhancement |
| 4 | Background parallax scrolling on mobile | Post-MVP polish |
| 5 | Color-Reveal custom zone editor | Post-MVP content tools |
| 6 | Rarity visual treatment for reveal animations | Post-MVP — engine supports it, visual treatment TBD |
| 7 | Lottie/sprite sheet upgrades for background animations | Post-MVP polish |
| 8 | TTS audio for celebration text | Post-MVP accessibility enhancement |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-24 (Foundation) | `gamification_configs` gains `default_reveal_type` column. `treasure_boxes` gains `reveal_type` column. PRD-24's treasure box animation templates (Screen 5, Screen 8 Section I, Screen 9) replaced by Reveal Type Library. The 10 generic templates (pirate, princess, medieval, etc.) concept is fully superseded — PRD-24A already replaced them with per-theme containers, and PRD-24B now defines the flat library model where treasure box is just another reveal type. | Update PRD-24 schema. Replace all "animation template" references with Reveal Type Library references. Update Screens 5, 8I, and 9 to reference reveal type picker instead of fixed template list. |
| PRD-24A (Overlays) | Background celebration animation CSS/SVG implementation fully specified (was noted as needing PRD-24B detail). Evolution flipbook animation fully specified. Per-theme reveal container poster frames now serve as poster attributes for video-based reveal types in the flat library. | Note in PRD-24A that background celebration implementation is in PRD-24B. Note evolution flipbook implementation is in PRD-24B. |
| PRD-09B (Lists) | `lists` table gains `reveal_type` column for randomizer draw reveals. | Add column to PRD-09B schema. |
| PRD-10 (Widgets) | Star Chart animation sequence fully specified. Color-Reveal animation sequence fully specified. Treasure box widget idle animations specified. | Note in PRD-10 that animation specs for these widget types are in PRD-24B. |
| PRD-11 (Victory Recorder) | DailyCelebration Step 4 collectible reveals can use any of the 8 reveal types when configured by mom. | Note in PRD-11 that Step 4 reveal animations reference PRD-24B's Reveal Type Library. |
| PRD-03 (Design System) | Background celebration SVG animations are a new pattern that follows PRD-03 conventions. Micro-celebrations (points popup, streak fire, level-up burst) are new animation patterns using shell tokens. | Note in PRD-03 that PRD-24B introduces gamification animation patterns using existing shell tokens. |
| PRD-22 (Settings) | Reveal Type Picker is a new reusable modal component used in multiple settings screens (treasure box config, gamification settings, list config). | Note in PRD-22 that the Reveal Type Picker is available as a shared settings component. |
| Widget Template Catalog | Star Chart and Color-Reveal visual variants now have full animation specifications. | Update catalog entries to reference PRD-24B for animation details. |
| Build Order Source of Truth | PRD-24B completed. 0 new tables, 3 column additions. Reveal Type Library architecture established. | Move PRD-24B to Section 2. Note column additions. |

---

## Starter Prompt for Next Session (PRD-24C: Family Challenges & Multiplayer Gamification)

```
We are writing PRD-24C: Family Challenges & Multiplayer Gamification for MyAIM Family v2.

READ THESE FIRST (in order):
1. PRD-24-Gamification-Overview-Foundation.md (parent PRD — points, rewards, streaks, gamification event pipeline)
2. PRD-24A-Overlay-Engine-Gamification-Visuals.md (overlay engine, dashboard backgrounds, daily collectibles, game modes)
3. PRD-24A-Game-Modes-Addendum.md (Boss Battle/Party Quest, Family Bingo — the co-op modes)
4. PRD-24B-Gamification-Visuals-Interactions.md (Reveal Type Library, animation specs — celebration patterns to reuse)
5. PRD-24A-Cross-PRD-Impact-Addendum.md (cross-PRD impacts including boss/bingo tables and notification types)
6. PRD-11B-Family-Celebration.md (family-level celebration system)
7. PRD-14D-Family-Hub.md (Family Hub where co-op widgets live)
8. PRD-14E-Family-Hub-TV-Mode.md (TV display mode for family dashboard)
9. PRD-15-Messages-Requests-Notifications.md (notification types for family challenges)
10. MYAIM_Gamification_Master_Manuscript.md (family collaboration sections)
11. MyAIM_Family_Build_Order_Source_of_Truth_v2.md
12. MyAIM_Family_PRD_Template.md

PRD-24C covers:
- Time-boxed family challenges: mom creates challenges with start/end dates, participation rules, rewards
- Family quest board: persistent shared goals visible on Family Hub
- Boss Battle co-op mode UI: shared HP bar widget, phase transitions, boss defeated celebration
- Family Bingo co-op mode UI: 5×5 bingo card widget, square completion, line/blackout celebrations
- Seasonal event framework (stub): architecture for time-limited seasonal themed events
- Family celebration integration: how family challenge completions feed PRD-11B
- Family leaderboard display: percentage-based, opt-in, privacy controls
- Equitable contribution: normalization math for mixed-age family participation

Key decisions already made in PRD-24 and PRD-24A:
- Boss Battle and Party Quest are one engine with two UI skins (HP bar vs. item checklist)
- Bosses are framed positively per theme (rescue, not fight)
- LiLa generates bingo cards and boss stats with Human-in-the-Mix
- Family leaderboard must be opt-in, mom-controlled, never default
- Equitable contribution normalizes by completion percentage, not raw points
- Boss/Bingo widgets live on Family Hub
- 8 notification types already defined in PRD-24A Cross-PRD addendum

Present all clarifying questions at once with your recommendation leading each.
```

---

*End of PRD-24B*
