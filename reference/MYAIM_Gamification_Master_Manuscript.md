# MyAIM Central — Gamification & Tracker System
## Master Manuscript for Claude Code Development
### Complete Reference Document — All 21 Sections

---

> **How to use this document:** Provide this entire document to Claude Code at the start of any development session related to the gamification or tracker system. It is the single authoritative reference for all decisions, specifications, schemas, and build order. Do not build anything not described here without confirming with the product owner first.

> **Document structure:** 21 sections across three logical parts. Part 1 (Sections 1–5): Architecture, Design Principles, Visual Worlds, Overlays, Points System. Part 2 (Sections 6–12): Widget Gallery, All Tracker Types, Color-Reveal System, Star Charts, Custom Goal Widgets, Allowance Calculator. Part 3 (Sections 13–21): Victory Recorder, Event Flows, Mom Configuration Journey, Database Schema, Component Architecture, API Endpoints, Build Order, Open Decisions, Visual Asset Requirements.

---


---

## Section 1: System Overview

MyAIM Central is a family productivity and personal growth platform built with Vite + React + TypeScript + TailwindCSS + Supabase. The gamification and tracker system is one of its most complex subsystems. It serves four distinct user types — moms, teens, elementary-age children (Guided Mode), and young children (Play Mode) — and must adapt its visual presentation, interaction patterns, and emotional tone for each.

The system is organized into three architectural layers that work together:

**Layer 1 — The Visual World (Theme):** Every child has one Visual World assigned by mom. This is the overarching narrative environment — Dragon Academy, Flower Garden, Ocean Aquarium, etc. It defines the visual language of the child's entire dashboard and the "game" they are playing. It grows and evolves based on overall task completion over time.

**Layer 2 — The Overlay Collection:** An optional second layer that adds depth and specificity. Overlays map specific task categories to specific collectibles. For example, the Apothecary Workshop overlay turns homework tasks into Intelligence Elixirs and chore tasks into Energy Elixirs. Any overlay can be applied to any Visual World, creating a combinatorial library of experiences.

**Layer 3 — The Tracker Widgets:** Individual configurable dashboard widgets assigned by mom. These are the day-to-day interaction layer — grid trackers, streak counters, progress bars, color-reveal trackers, and more. They feed data upward into Layers 1 and 2.

The Victory Recorder (kid version) is the daily convergence point where all three layers are revealed to the child. It is the celebration sequence, the theme update, the overlay progress reveal, and the achievement unlock — all in one end-of-day experience.

---

## Section 2: Core Design Principles

These principles are non-negotiable and must be applied to every component in the system.

### 2.1 No Hard-Coded Colors — Ever

Every color in every component must reference a CSS variable (semantic color token). No hex values, RGB values, or named colors may appear in component stylesheets. This is what makes the theme system work. When a user switches themes, every component updates automatically because every component references tokens, not values.

The complete token set is:

```css
:root {
  /* Backgrounds */
  --color-bg-primary: ;       /* Main page/card background */
  --color-bg-secondary: ;     /* Subtle secondary background */
  --color-bg-elevated: ;      /* Modals, dropdowns, popovers */

  /* Text */
  --color-text-primary: ;     /* Main body text */
  --color-text-secondary: ;   /* Muted/supporting text */
  --color-text-inverse: ;     /* Text on dark/colored backgrounds */

  /* Brand */
  --color-accent: ;           /* Primary brand color, buttons, links */
  --color-accent-hover: ;     /* Hover state of accent */
  --color-accent-subtle: ;    /* Light tint of accent for backgrounds */

  /* Semantic */
  --color-success: ;          /* Completed, positive, green-family */
  --color-warning: ;          /* Caution, amber-family */
  --color-error: ;            /* Destructive, red-family */
  --color-gold: ;             /* Reserved exclusively for victories, celebrations, achievements */

  /* Structure */
  --color-border: ;           /* Dividers, card borders */
  --color-shadow: ;           /* Box shadow color */

  /* Typography */
  --font-heading: ;           /* Display and heading font */
  --font-body: ;              /* Body text font */

  /* Radius */
  --radius-sm: ;              /* Small elements: badges, tags */
  --radius-md: ;              /* Cards, inputs */
  --radius-lg: ;              /* Modals, large panels */

  /* Shadows */
  --shadow-sm: ;
  --shadow-md: ;
  --shadow-lg: ;
}
```

**Example of correct vs. incorrect styling:**
```css
/* CORRECT */
.tracker-widget {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

/* WRONG — never do this */
.tracker-widget {
  background: #ffffff;
  border: 1px solid #68a395;
  color: #333333;
}
```

### 2.2 Three-Tier Progressive Disclosure

Every configurable component must be designed in three tiers. This allows minimalist moms to get started immediately while maximalist moms can find every option.

**Tier 1 — Smart Defaults:** The component works immediately when added, with no configuration required. Defaults are sensible and cover the most common use case.

**Tier 2 — Common Customization:** The fields most moms will want to change are visible in the standard configuration panel. This includes: title, goal description, prize/reward, measurement unit, target number, and who it is assigned to.

**Tier 3 — Advanced Configuration:** Everything else is hidden behind an "Advanced" toggle or collapsible section. This includes: reset schedules, auto-tracking sources, visual style overrides, notification settings, and edge-case behaviors.

### 2.3 Template + Configuration + Theme

Every widget and tracker is a **template** (the structure and behavior), a **configuration** (the user's personalization of that template), and a **theme** (the visual skin applied at render time). These three things are always separate. A template never contains a color. A configuration never contains layout logic. A theme never contains business logic.

### 2.4 Shell-Aware Rendering

Every component must know which shell it is rendering in and adjust accordingly. The four shells are:

| Shell | Audience | Tone | Size | Gamification Level |
|---|---|---|---|---|
| Personal (Mom) | Adults | Warm, professional | Standard | Optional, subtle |
| Independent | Teens | Clean, modern | Standard | Optional, moderate |
| Guided | Ages 8–12 | Friendly, encouraging | Larger | Full, balanced |
| Play | Ages 3–7 | Joyful, animated | Largest | Full, maximum delight |

Components receive their shell context via a React context provider and must render appropriately for each mode.

### 2.5 Victory Recorder Is Two Products

The adult/teen Victory Recorder (from StewardShip) and the kid Victory Recorder (the daily celebration sequence) share a database table (`victories`) but are entirely different UI components. They must be named differently in the codebase:

- `VictoryRecorder` — the adult/teen reflective journaling component
- `DailyCelebration` — the kid-facing celebration sequence component

Never conflate these. They share data, not UI.

---

## Section 3: The Visual World System (13 Themes)

Each child has exactly one Visual World. It is chosen by mom during family member setup and can be changed at any time (with the option to keep or reset progress). The Visual World defines the background aesthetic of the child's dashboard and the narrative context for their gamification journey.

Visual Worlds are **not widgets**. They are dashboard-wide configuration. They appear in the Victory Recorder celebration sequence and in the optional Theme Progress widget.

### 3.1 Complete Visual World Catalog

| # | Name | Aesthetic | Best Age | Narrative |
|---|---|---|---|---|
| 1 | Spring Garden | Soft florals, pastels, watercolor | 4–10 | Grow a blooming garden |
| 2 | Outer Space | Dark sky, stars, planets, neon | 6–14 | Explore the cosmos |
| 3 | Ocean Deep | Blues, teals, bioluminescent | 5–12 | Discover the deep sea |
| 4 | Enchanted Forest | Greens, golds, fairy lights | 5–12 | Live in a magical wood |
| 5 | Steampunk Workshop | Brass, copper, gears, leather | 10–16 | Build in a Victorian lab |
| 6 | Desert Adventure | Warm sands, terracotta, gold | 7–14 | Explore ancient ruins |
| 7 | Arctic Tundra | Ice blues, whites, aurora colors | 6–12 | Survive the frozen north |
| 8 | Volcano Isle | Reds, oranges, dramatic darks | 7–14 | Tame a volcanic island |
| 9 | Candy Land | Bright pinks, purples, pastels | 3–8 | Live in a sweet world |
| 10 | Medieval Kingdom | Stone grays, royal purples, gold | 8–15 | Rule a kingdom |
| 11 | City Skyline | Blues, grays, city lights | 10–16 | Build a metropolis |
| 12 | Prehistoric Jungle | Earthy greens, browns, amber | 5–12 | Survive with dinosaurs |
| 13 | Enchanted Cottage | Warm creams, sage, rose | 4–10 | Cozy magical home |

### 3.2 Visual World Database Schema

```sql
-- Stored on family_members table
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS
  gamification_theme VARCHAR(50),          -- e.g., 'spring_garden', 'outer_space'
  theme_progress JSONB DEFAULT '{}',       -- Current state of their Visual World
  theme_unlocks JSONB DEFAULT '[]',        -- What they've unlocked
  gamification_overlay VARCHAR(50),        -- e.g., 'apothecary', 'kingdom_builder'
  overlay_progress JSONB DEFAULT '{}',     -- Current state of their Overlay
  overlay_unlocks JSONB DEFAULT '[]',      -- What they've unlocked in overlay
  total_gamification_points INTEGER DEFAULT 0,
  gamification_creatures JSONB DEFAULT '[]'; -- For creature-based overlays
```

### 3.3 Theme Progress Data Shape

Each Visual World stores its progress as JSONB. The shape varies by theme. Here are two examples:

**Dragon Academy (creature-based):**
```json
{
  "theme": "dragon_academy",
  "dragons": [
    {
      "id": "dragon_001",
      "type": "fire_dragon",
      "level": 3,
      "name": "Blaze",
      "unlocked_at": "2025-10-15",
      "accessories": ["saddle_basic", "red_horns"]
    }
  ],
  "total_dragons": 2,
  "lair_level": 2,
  "achievements": ["7_day_streak", "perfect_week"],
  "next_unlock": {
    "type": "forest_dragon",
    "requires": "14_day_homework_streak"
  }
}
```

**Flower Garden (accumulation-based):**
```json
{
  "theme": "flower_garden",
  "flowers": {
    "roses": 8,
    "tulips": 12,
    "sunflowers": 5,
    "daisies": 15
  },
  "total_flowers": 40,
  "garden_size": "medium",
  "accessories": ["fence", "butterfly", "watering_can"],
  "next_unlock": {
    "item": "fairy_lights",
    "requires": "50_total_flowers"
  }
}
```

### 3.4 Visual World Asset Structure

All Visual World assets are stored in a consistent folder structure:

```
/assets/themes/
  /spring_garden/
    background.png          ← Dashboard background image
    background_mobile.png
    /creatures/             ← If theme has creatures
      baby.png
      teen.png
      adult.png
    /accessories/           ← Unlockable items
      fence.png
      butterfly.png
      fairy_lights.png
    thumbnail.png           ← For selection UI
  /outer_space/
    ...
```

---

## Section 4: The Overlay Collection System

Overlays are optional second-layer gamification systems that run on top of any Visual World. A child can have zero or one overlay active at a time. Overlays add depth and specificity by mapping different task categories to different collectibles.

**The key principle:** Any overlay works on any Visual World. The Visual World provides the aesthetic; the overlay provides the mechanics. A Dragon Collection overlay on a Steampunk Workshop theme produces mechanical dragons. The same overlay on a Spring Garden theme produces floral dragons. The overlay engine is theme-agnostic.

### 4.1 Complete Overlay Catalog

| # | Name | What Accumulates | Best Age | Complexity |
|---|---|---|---|---|
| 1 | Monster Army | Cute monsters join team | 5–10 | Simple |
| 2 | Dragon Collection | Dragons hatch and grow | 6–12 | Medium |
| 3 | Robot Builder | Build robots from parts | 7–14 | Medium |
| 4 | Alien Explorer | Discover alien species | 6–12 | Simple |
| 5 | Adventure Explorer | Find treasures, explore locations | 8–14 | Medium |
| 6 | Kingdom Builder | Build entire kingdom with citizens | 9–15 | Complex |
| 7 | Garden Grower | Plants bloom and grow | 5–10 | Simple |
| 8 | Pet Collector | Adopt and raise pets | 4–10 | Simple |
| 9 | Vehicle Fleet | Build and collect vehicles | 7–14 | Medium |
| 10 | Apothecary Workshop | Brew elixirs, collect ingredients | 10–16 | Complex |

### 4.2 The Apothecary Workshop Overlay (Full Specification)

This is the most fully specified overlay and serves as the template for all others. When building the overlay engine, use this spec to validate that the engine can handle all of its features.

**Concept:** An alchemist/apothecary workshop that grows as the child completes tasks. Best for ages 10–16. Works especially well with Steampunk Workshop and Medieval Kingdom Visual Worlds. Has an optional educational tie-in with real herbology and chemistry facts.

**Task-to-Collectible Mapping:**
| Task Category | Collectible Earned |
|---|---|
| Homework | Intelligence Elixirs (Memory Elixir, Focus Draught) |
| Chores | Energy Elixirs (Strength Tonic, Stamina Brew) |
| Reading | Wisdom Elixirs (Knowledge Draught, Insight Serum) |
| Kindness | Healing Elixirs (Compassion Cure, Friendship Philter) |
| Exercise | Vitality Elixirs (Agility Elixir, Speed Draught) |
| Perfect Day (5+ tasks) | Legendary Elixirs (rare, glowing, powerful) |

**Ingredient Rarity Tiers:**
| Tier | Unlock Condition | Examples |
|---|---|---|
| Common | Early tasks | Lavender, rose petals, mint, honey, sea salt |
| Uncommon | Week milestones | Dragon scales, phoenix feather, moonstone dust, star fragments |
| Rare | Month achievements | Unicorn hair, mermaid pearls, griffin claws, time essence |
| Legendary | Perfect month | Philosopher's stone fragment, eternal flame droplet, cosmic nebula extract |

**Workshop Progression Stages:**
| Stage | Points Range | Description | Key Features |
|---|---|---|---|
| 1 — Basic Corner | 0–30 | Small corner table | 1 cauldron, 3 bottles, basic tools |
| 2 — Workbench | 31–80 | Dedicated workspace | 3 cauldrons, 12 bottles, herb drying rack |
| 3 — Full Workshop | 81–150 | Complete laboratory | 6 cauldrons, 30+ bottles, distillation equipment |
| 4 — Master Apothecary | 151+ | Grand alchemist's hall | Floor-to-ceiling shelves, secret vault, legendary setup |

**Recipe Book Unlock Schedule:**
| Unlock Condition | Book Title |
|---|---|
| Week 1 complete | Beginner's Guide to Elixirs |
| Week 2 complete | Herbology Fundamentals |
| Week 3 complete | Advanced Brewing Techniques |
| Week 4 complete | Master Alchemist's Grimoire |
| Month 2 complete | Legendary Elixirs & Lost Recipes |
| Month 3 complete | The Complete Apothecary Encyclopedia |

**Advanced Feature — Recipe Combinations:**
Children can combine completed task types to create special elixirs:
- Intelligence Elixir + Energy Elixir = Focus Draught
- Healing Elixir + Wisdom Elixir = Compassionate Teacher Elixir
- 3 Perfect Days = Rainbow Elixir (ultimate)

**Theme Variations (how the overlay adapts to the Visual World):**
- Steampunk Workshop: Brass cauldrons, copper pipes, steam-powered distillation, Victorian medicine labels
- Medieval Kingdom: Stone mortar and pestle, clay bottles, parchment scrolls, candlelit ambiance
- Enchanted Forest: Wooden bottles, fresh herbs, living plant ingredients, fairy-touched elixirs
- Outer Space: Futuristic bottles with glowing liquids, alien plant ingredients, holographic recipe displays

**AI Image Generation Prompts for Workshop Stages:**

Stage 1: `"small apothecary corner workspace, single wooden table, one small cauldron, 3 glass bottles on shelf, mortar and pestle, oil lamp, scattered herbs, cozy beginner setup, fantasy style, aerial view, warm lighting, transparent background"`

Stage 2: `"apothecary workbench, multiple cauldrons, 12 colorful elixir bottles on wooden shelves, hanging dried herbs, various tools, books, oil lamp glow, more organized, fantasy style, aerial view, warm candlelight, transparent background"`

Stage 3: `"complete apothecary workshop, multiple shelving units, 30+ glowing elixir bottles, brewing station with multiple cauldrons, herb garden corner, distillation equipment, stacks of ancient books, magical lighting, fantasy style, aerial view, atmospheric, transparent background"`

Stage 4: `"master alchemist's grand apothecary, floor-to-ceiling shelves filled with hundreds of glowing bottles, ancient tome library, rare ingredient vault visible, elaborate brewing stations, magical effects, candlelight and mystical glow, legendary workshop, fantasy epic style, aerial view, stunning detail, transparent background"`

### 4.3 The Adventure Explorer Overlay (Full Specification)

**Concept:** Indiana Jones / Tomb Raider style adventurer who discovers treasures and explores locations as tasks are completed.

**Growth Stages:**
| Stage | Points | Character State | Equipment |
|---|---|---|---|
| 1 — Novice Explorer | 0–30 | Torn map, small backpack, sneakers | Flashlight |
| 2 — Skilled Adventurer | 31–70 | Leather jacket, adventure hat | Compass, rope, canteen |
| 3 — Expert Explorer | 71–120 | Full adventure outfit | Whip, grappling hook, ancient map |
| 4 — Legendary Adventurer | 121+ | Mystical amulet, enchanted tools | All items + special powers |

**What Accumulates:**
- Ancient coins (1–5 points each)
- Precious gems (red, blue, green, purple)
- Golden artifacts (masks, statues, tablets)
- Sacred relics (mystical items)
- Map pieces (collect to unlock new locations)

**Equipment Unlock Schedule:**
Day 3: Adventure hat | Day 7: Compass | Day 10: Whip | Day 14: Grappling hook | Day 21: Ancient amulet | Day 30: Legendary explorer status

**Location Milestones:**
Week 1: Desert dunes crossed | Week 2: Hidden temple discovered | Week 3: Secret chamber unlocked | Week 4: Treasure vault found

### 4.4 The Kingdom Builder Overlay (Full Specification)

**Concept:** Build an entire kingdom from scratch — castle, citizens, buildings, defenses — as tasks are completed.

**Growth Stages:**
| Stage | Points | Kingdom State | Population |
|---|---|---|---|
| 1 — Village | 0–50 | Small huts, dirt roads | 5–10 citizens |
| 2 — Town | 51–120 | Stone buildings, cobblestone roads | 20–50 citizens |
| 3 — City | 121–200 | Multi-story buildings, paved streets | 100+ citizens |
| 4 — Kingdom | 201+ | Grand castle with towers, thriving metropolis | Thousands |

**Task-to-Building Mapping:**
| Task Category | Building Type |
|---|---|
| Homework | School, Library, University |
| Chores | Houses, Shops, Workshops |
| Kindness | Cathedral, Hospital, Orphanage |
| Exercise | Training grounds, Arena, Gym |
| Reading | Libraries, Bookshops, Archives |

**Building Upgrade Path:**
Hut → House → Manor → Mansion | Shop → Store → Grand Market | School → Academy → University | Chapel → Church → Grand Cathedral | Fort → Keep → Castle → Palace

**Defense Unlock Schedule:**
Day 7: Wooden fence | Day 14: Stone walls | Day 21: Guard towers | Day 30: Full castle with moat | Perfect week: Dragon defender

**Random Events (Streak-Based):**
- 3-day streak: Festival in town square (bonus citizens)
- 7-day streak: Royal visit (unlock palace upgrade)
- 14-day streak: Dragon attack (test defenses, gain knight)
- 30-day streak: Kingdom becomes legendary

### 4.5 Overlay Engine Architecture

The overlay engine must be built as a generic system that any overlay configuration can run on. The engine receives an overlay config object and renders accordingly. This means adding a new overlay is a content/configuration task, not a code task.

```typescript
interface OverlayConfig {
  id: string;                          // 'apothecary', 'kingdom_builder', etc.
  name: string;
  taskCategoryMapping: {               // Maps task categories to collectible types
    [taskCategory: string]: string;    // 'homework' -> 'intelligence_elixir'
  };
  stages: OverlayStage[];             // Growth stages with thresholds
  collectibleTypes: CollectibleType[]; // What can be collected
  rarityTiers: RarityTier[];          // Common/uncommon/rare/legendary
  advancedFeatures?: {
    recipeCombinations?: RecipeCombination[];
    randomEvents?: RandomEvent[];
    upgradeChains?: UpgradeChain[];
  };
}

interface OverlayStage {
  stageNumber: number;
  name: string;
  pointsRequired: number;
  description: string;
  imagePrompt: string;                 // AI generation prompt for this stage
  keyFeatures: string[];
}
```

---

## Section 5: The Points and Currency System

The gamification system uses two parallel but distinct currency systems. They must never be conflated.

### 5.1 Gamification Points (In-System Currency)

Gamification points are earned through task completion and drive Visual World progression and Overlay Collection growth. They are the "game" currency.

**Earning Points:**
| Action | Points Earned |
|---|---|
| Complete 1 task | 10 points |
| Complete 3 tasks in a day | 35 points (bonus) |
| Complete 5+ tasks (Perfect Day) | 60 points (bonus) |
| 7-day streak milestone | 50 bonus points |
| 14-day streak milestone | 100 bonus points |
| 30-day streak milestone | 200 bonus points |
| Perfect week (all assigned tasks) | 150 bonus points |

**Spending Points:** Points are spent on the in-system reward menu (configured by mom). Examples: extra screen time, a special outing, a small toy. Mom sets the point cost for each reward. The child requests redemption; mom approves in the app.

### 5.2 Allowance Calculator (Real-Money System)

The allowance calculator is entirely separate from gamification points. It calculates real money based on task completion percentage. It is a responsibility accountability tool, not a game mechanic.

**The Formula:**
```
Weekly Completion % = (Tasks Completed ÷ Total Tasks Assigned) × 100
Allowance Earned = Configured Weekly Allowance × (Completion % ÷ 100)
```

**Example (from product owner):**
- 5 school days × 11 tasks/day = 55 tasks, plus 1 weekend day × 4 tasks = 4 tasks = 59 total tasks
- Child completed 44 tasks
- Completion: 44 ÷ 59 = 74.6%
- Configured allowance: $14.00/week
- Allowance earned: $14.00 × 0.746 = **$10.44**

**Configuration fields (mom sets these):**
- Weekly allowance amount (dollar amount)
- Which task categories count toward the percentage
- Whether partial-day completions count
- Minimum completion threshold (e.g., must reach 50% to earn anything)
- Rounding behavior (round up, round down, exact)

**Display (child sees):**
```
This Week's Responsibility Score
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
44 of 59 tasks completed
[████████████░░░] 74.6%

Your allowance this week:
$10.44 of $14.00
```

---

---


## Section 6: The Widget Gallery System

The Widget Gallery is the unified interface where mom browses and adds any widget to any family member's dashboard. It is a single modal accessible from an "Add Widget" button on any dashboard in edit mode. It is organized into four categories: Tracker Widgets, Gamification Widgets, Library Tools, and Info Widgets.

### 6.1 Widget Gallery Interface

The gallery opens as a full-screen modal with search, category tabs, and a grid of widget preview cards. Each card shows a visual preview of the widget in action, a short description, and an "Add" button that opens the widget's configuration modal.

**Gallery Entry Point:** Every dashboard has an edit mode. In edit mode, an "+ Add Widget" button appears. Clicking it opens the Widget Gallery modal.

**Gallery Features:**
- Search by name, purpose, or keyword
- Category filter tabs (Trackers, Gamification, Tools, Info)
- Style filter (Artistic, Modern, Kid-Friendly, Professional)
- Person filter (show widgets suitable for a specific family member's age/mode)
- Visual preview cards showing the widget in a representative state

### 6.2 Widget Configuration Fields Vocabulary

Every widget has a configuration panel. The following field types are available for any widget to use. Each widget specifies which fields it uses and which tier (1, 2, or 3) each field belongs to.

| Field Type | Description | Example |
|---|---|---|
| `title` | Widget display name | "Jake's Reading Goal" |
| `goal_description` | What the widget is tracking | "Read 20 books this year" |
| `prize_description` | What the child earns on completion | "Trip to the bookstore" |
| `prize_image_url` | Uploaded photo of the prize | Photo of a LEGO set |
| `assigned_to` | Which family member | Emma, Jake, Mom |
| `target_number` | The goal quantity | 100, 30, 7 |
| `measurement_unit` | What is being counted | hours, times, days, dollars, pages |
| `allowance_amount` | Dollar amount for allowance widget | $14.00 |
| `start_date` | When tracking begins | 2025-11-01 |
| `end_date` | When tracking ends (optional) | 2025-11-30 |
| `reset_period` | How often the tracker resets | weekly, monthly, never |
| `task_categories` | Which task types count (multi-select checklist) | Homework, Chores, Reading |
| `visual_style` | Artistic, Modern, or Kid-Friendly | Kid-Friendly |
| `widget_size` | Small, Medium, Large | Medium |
| `celebration_type` | What happens on completion | Confetti, Star, Badge, None |
| `notes_enabled` | Allow notes on entries | true/false |
| `auto_track_source` | Pull data from Victory Recorder automatically | tasks, reading, best-intentions |
| `minimum_threshold` | Minimum % to earn anything (allowance) | 50% |
| `rounding_behavior` | How to round dollar amounts | round_up, round_down, exact |
| `notification_enabled` | Send reminder notifications | true/false |
| `notification_time` | When to send reminder | 7:00 PM |
| `sharing_enabled` | Show on family dashboard | true/false |

---

## Section 7: Tracker Widget Types (Complete Specifications)

There are eight core tracker widget types plus a custom builder. Each is a template that mom configures. All trackers are theme-aware (no hard-coded colors) and shell-aware (render differently in Play, Guided, and Independent modes).

### 7.1 Grid Tracker (Classic Bujo Style)

**What it is:** A monthly or weekly calendar grid where each day is a box to tap and fill. Inspired by bullet journal habit trackers. The most versatile tracker type.

**Best for:** Yes/no daily habits, daily activities, presence/absence tracking.

**Visual styles:**
- Artistic: Hand-drawn grid lines, watercolor fills, doodle decorations
- Modern: Clean lines, flat colors, minimal design
- Kid-Friendly: Large boxes, bright colors, sticker-style marks

**Configuration fields (Tier 1):** title, goal_description, assigned_to
**Configuration fields (Tier 2):** visual_style, grid_size (weekly/monthly), celebration_type
**Configuration fields (Tier 3):** notes_enabled, auto_track_source, reset_period, sharing_enabled

**Dashboard display:**
```
📖 Read to Kids
━━━━━━━━━━━━━━━━━━━━━
  M  T  W  T  F  S  S
[✓][✓][✓][✓][ ][ ][ ]  Week 1
[✓][✓][ ][✓][✓][✓][✓]  Week 2
[✓][ ][ ][ ][ ][ ][ ]  Week 3

15/21 days ⭐
[Mark Today Complete]
```

---

### 7.2 Circle/Dot Tracker (Year in Pixels Style)

**What it is:** Rows of circles, one per day, color-coded by level, mood, or intensity. Creates beautiful visual patterns over time.

**Best for:** Mood tracking, energy levels, quality ratings (1–5 scale), pain levels, sleep quality.

**Visual styles:**
- Artistic: Watercolor circles, hand-drawn outlines, organic arrangement
- Modern: Perfect circles, gradient fills, geometric arrangement
- Kid-Friendly: Large circles with emoji-style faces

**Configuration fields (Tier 1):** title, assigned_to, scale_type (yes/no or 1-5)
**Configuration fields (Tier 2):** scale_labels (e.g., "Great / Good / Meh"), visual_style, color_per_level
**Configuration fields (Tier 3):** notes_enabled, month_view_vs_week_view, sharing_enabled

**Dashboard display:**
```
😊 Mood Tracker — October
━━━━━━━━━━━━━━━━━━━━━━━━
Week 1: ●●●●○●●
Week 2: ●●○●●●○
Week 3: ●●●●●○●

Legend: ● Great  ◐ Good  ○ Meh
Great days: 18   Good: 3
```

---

### 7.3 Streak Tracker (Flame/Chain Style)

**What it is:** A streak counter that displays the current consecutive-day count prominently. Celebrates milestone streaks. Shows longest streak record.

**Best for:** Building habits through consecutive days, Duolingo-style motivation, consistency tracking.

**Visual styles:**
- Artistic: Hand-drawn flames with texture, watercolor fire
- Modern: Geometric flame icon with gradient
- Kid-Friendly: Animated fire character, growing flower, or chain links

**Configuration fields (Tier 1):** title, assigned_to
**Configuration fields (Tier 2):** milestone_intervals (every 7 days, every 30 days), visual_style, celebration_type
**Configuration fields (Tier 3):** grace_period (allow 1 missed day without breaking streak), notification_enabled, notification_time

**Dashboard display:**
```
💧 Drink Water
━━━━━━━━━━━━━━━━━━━━━
        🔥
        14
    Day Streak!

Keep it going!
Next milestone: 21 days
Best streak: 28 days

[Mark Today ✓]
```

---

### 7.4 Progress Bar Tracker (Thermometer Style)

**What it is:** A visual bar filling toward a goal. Shows percentage complete. Can be vertical (thermometer) or horizontal. Animated fill on update.

**Best for:** Counting toward goals, accumulating totals (books read, hours practiced), savings goals, project completion.

**Visual styles:**
- Artistic: Hand-drawn thermometer, decorative milestones
- Modern: Sleek progress bar with gradient fill
- Kid-Friendly: Fun shapes — rocket launching, tree growing, treasure chest filling, jar filling with coins

**Configuration fields (Tier 1):** title, target_number, measurement_unit, assigned_to
**Configuration fields (Tier 2):** milestone_markers (show intermediate goals), visual_style, shape (horizontal/vertical/custom)
**Configuration fields (Tier 3):** auto_track_source, notes_enabled, celebration_type

**Dashboard display:**
```
📚 Read 20 Books This Year
━━━━━━━━━━━━━━━━━━━━━━━━━
████████░░░░░░░░░░░░  8/20

40% Complete
12 books to go!

Next milestone: 10 books
[+ Add Entry]
```

---

### 7.5 Chart Tracker (Line/Bar Graph Style)

**What it is:** A data visualization over time. Line charts, bar graphs, or area charts. Shows patterns and trends. The most analytical tracker type.

**Best for:** Quantities over time, measurements (weight, height, test scores), time tracking (study hours, screen time), pattern identification.

**Visual styles:**
- Artistic: Hand-drawn graph lines, watercolor fills
- Modern: Clean data viz with theme colors
- Professional: Business-style charts (for mom's personal dashboard)

**Configuration fields (Tier 1):** title, measurement_unit, assigned_to
**Configuration fields (Tier 2):** chart_type (bar/line/area), time_range (week/month/year), show_average, show_total
**Configuration fields (Tier 3):** y_axis_min, y_axis_max, goal_line_value, notes_enabled

**Dashboard display:**
```
📊 Study Hours This Week
━━━━━━━━━━━━━━━━━━━━━━━
4 |           ▄▄
3 |       ▄▄  ██
2 |   ▄▄  ██  ██  ▄▄
1 |   ██  ██  ██  ██  ▄▄
0 +___M___T___W___T___F__

Total: 12 hours
Average: 2.4 hrs/day
[+ Add Hours]
```

---

### 7.6 Collection Tracker (Sticker/Badge Style)

**What it is:** A grid where visual elements (stars, stamps, stickers, badges) are collected as achievements happen. Satisfying visual accumulation. The digital equivalent of a sticker chart.

**Best for:** Making tracking feel like a game, collecting achievements, kid-friendly goal setting, potty training, good deed charts.

**Visual styles:**
- Artistic: Hand-drawn stickers, vintage stamp designs
- Modern: Flat icon badges with theme colors
- Kid-Friendly: Cartoon stickers, collectible characters, animated placement

**Configuration fields (Tier 1):** title, target_number, sticker_type (star/heart/paw/custom), assigned_to
**Configuration fields (Tier 2):** grid_columns, prize_description, prize_image_url, celebration_type
**Configuration fields (Tier 3):** sticker_animation (settle/pop/spin), confetti_on_add, confetti_on_complete

**Dashboard display:**
```
⭐ Good Deed Stickers
━━━━━━━━━━━━━━━━━━━━━
⭐ ⭐ ⭐ ⭐ ⭐
⭐ ⭐ ⭐ □ □
□ □ □ □ □

8/15 stickers earned!
7 more for prize!
[Prize: Trip to the park 🌳]
```

---

### 7.7 Gameboard Progress Tracker (Kid-Friendly Path)

**What it is:** A board game-style path where the child's character moves forward with each task completed. Spaces can have special events, bonuses, or surprises. Highly visual and narrative.

**Best for:** Young children (Play and Guided modes), making progress feel like an adventure, kids who respond to narrative context.

**Visual styles:** Always Kid-Friendly. Theme determines the aesthetic (space path, garden path, castle path, etc.).

**Configuration fields (Tier 1):** title, total_spaces, assigned_to
**Configuration fields (Tier 2):** character_avatar, board_theme, special_space_frequency, prize_at_end
**Configuration fields (Tier 3):** special_space_types (bonus/shortcut/celebration/mystery), animation_speed

**Dashboard display:**
```
🚀 Space Adventure Board
━━━━━━━━━━━━━━━━━━━━━━━
🚀 → ⬜ → ⬜ → ⭐ → ⬜ → 🏆
[You are here!]

15 of 30 spaces
Halfway there!
[Move Forward!]
```

---

### 7.8 Custom Tracker (Build Your Own)

**What it is:** A fully flexible tracker where mom defines the tracking type, visual, and behavior from scratch. The ultimate escape hatch for use cases not covered by the other types.

**Configuration fields (Tier 1):** title, tracking_type (yes/no, count, scale, time, money), assigned_to
**Configuration fields (Tier 2):** measurement_unit, target_number, display_style, visual_style
**Configuration fields (Tier 3):** All fields from all other tracker types, as applicable

---

## Section 8: The Color-Reveal Tracker System

The Color-Reveal Tracker is one of the most distinctive and build-ready features in the entire system. It is a tracker where the child starts with a grayscale image and reveals colors progressively as achievements are completed. When the image is fully revealed, it is saved to the child's Achievement Gallery. The same images can be used as printable coloring books for sale.

### 8.1 How It Works

1. Mom selects a colored image from the library (butterfly, mandala, garden scene, etc.)
2. Mom sets how many achievements it should take to fully reveal the image (5 to 100+)
3. The system automatically generates a grayscale starting state and a reveal sequence
4. Each time the child completes an achievement, one color zone reveals
5. The child watches the image come to life over time
6. When fully revealed, confetti plays and the image is saved to the Achievement Gallery

### 8.2 The Flexible Achievement-to-Reveal Mapping

Images have 6–10 distinct color zones. Trackers need different achievement counts. The system solves this with dynamic color splitting.

**If achievements ≤ color zones:** One achievement per color, using the most prominent colors first.

**If achievements > color zones:** The system splits colors into gradient families (light → medium → dark). Each color family gets multiple reveal steps.

**Example — 7 achievements, 6 colors:**
```
Step 1: Pink areas reveal
Step 2: Light pink shading (pink split into 2 shades)
Step 3: Blue areas reveal
Step 4: Yellow areas reveal
Step 5: Green areas reveal
Step 6: Orange areas reveal
Step 7: Purple areas reveal
```

**Example — 30 achievements, 8 colors:**
Each color gets split into a gradient family of 3–4 shades (lightest → light → medium → dark), totaling 30 reveal steps.

**Example — 100 achievements, 10 colors:**
Each color gets 10 gradient steps. Perfect for complex mandalas as long-term goals.

### 8.3 Database Schema

```sql
-- Image library (pre-generated by product owner using Gemini/DALL-E)
CREATE TABLE coloring_image_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color_image_url TEXT NOT NULL,           -- Original colored image
  grayscale_image_url TEXT,                -- Auto-generated grayscale
  black_white_line_art_url TEXT,           -- B&W version for printable coloring books
  thumbnail_url TEXT,
  image_name VARCHAR(100) NOT NULL,        -- "Monarch Butterfly"
  theme_category VARCHAR(50),              -- 'garden', 'space', 'ocean', 'fantasy'
  gamification_theme VARCHAR(50),          -- Link to Visual World
  color_zones JSONB NOT NULL,              -- Array of color zones
  /* Example color_zones:
  [
    { "color": "pink", "hex": "#FF69B4", "name": "Pink Wings", "order": 1 },
    { "color": "blue", "hex": "#4169E1", "name": "Blue Body", "order": 2 },
    { "color": "yellow", "hex": "#FFD700", "name": "Yellow Flowers", "order": 3 }
  ]
  */
  total_color_zones INTEGER,
  recommended_min_achievements INTEGER DEFAULT 5,
  recommended_max_achievements INTEGER DEFAULT 30,
  supports_gradient_reveals BOOLEAN DEFAULT true,
  complexity_level INTEGER,                -- 1-5
  age_group VARCHAR(50),                   -- 'preschool', 'elementary', 'all-ages'
  keywords VARCHAR[],
  is_available_for_print BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which colors have been revealed per tracker instance
CREATE TABLE tracker_color_reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_tracker_id UUID REFERENCES user_trackers(id) ON DELETE CASCADE,
  color_zone_index INTEGER,
  color_hex VARCHAR(7),
  color_name VARCHAR(50),
  revealed_at TIMESTAMPTZ DEFAULT NOW(),
  achievement_count INTEGER,
  UNIQUE(user_tracker_id, color_zone_index)
);

-- Add coloring-specific columns to user_trackers
ALTER TABLE user_trackers
  ADD COLUMN IF NOT EXISTS coloring_image_id UUID REFERENCES coloring_image_library(id),
  ADD COLUMN IF NOT EXISTS total_achievements_needed INTEGER,
  ADD COLUMN IF NOT EXISTS achievements_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reveal_steps_generated JSONB;
  /* Example reveal_steps_generated:
  [
    { "step": 1, "reveals": ["#FF69B4"], "name": "Pink Areas" },
    { "step": 2, "reveals": ["#FFB6C1"], "name": "Light Pink Shading" },
    { "step": 3, "reveals": ["#4169E1"], "name": "Blue Areas" }
  ]
  */

-- Achievement gallery (completed images)
CREATE TABLE coloring_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_tracker_id UUID REFERENCES user_trackers(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  coloring_template_id UUID,
  template_name VARCHAR(100),
  completed_image_url TEXT,
  completed_at TIMESTAMPTZ,
  total_sections INTEGER,
  timeframe VARCHAR(50),
  achievement_description TEXT,
  celebration_played BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.4 The Color-Reveal Algorithm

```typescript
function generateRevealSequence(
  imageColors: ColorZone[],
  achievementCount: number,
  strategy: 'auto' | 'gradual' | 'random' = 'auto'
): RevealStep[] {
  const baseColorCount = imageColors.length;

  // Simple case: fewer achievements than colors
  if (achievementCount <= baseColorCount) {
    return imageColors.slice(0, achievementCount).map((color, idx) => ({
      step: idx + 1,
      colors: [color.hex],
      name: color.name
    }));
  }

  // Complex case: more achievements than colors — split into gradients
  const stepsPerColor = Math.ceil(achievementCount / baseColorCount);
  const revealSteps: RevealStep[] = [];
  let stepNumber = 1;

  for (const color of imageColors) {
    const gradients = generateColorGradients(color.hex, stepsPerColor);
    for (const gradient of gradients) {
      if (stepNumber > achievementCount) break;
      revealSteps.push({
        step: stepNumber++,
        colors: [gradient.hex],
        name: `${color.name} — ${gradient.label}`
      });
    }
  }

  return revealSteps.slice(0, achievementCount);
}

function generateColorGradients(baseHex: string, steps: number): ColorGradient[] {
  // Generate light-to-dark gradient family from base color
  // Returns array of {hex, label} objects: 'Lightest', 'Light', 'Medium', 'Dark', 'Darkest'
}
```

### 8.5 Reveal Strategy Options (Mom Configures)

| Strategy | Description | Best For |
|---|---|---|
| Automatic | System decides best reveal order (most prominent colors first) | Default, all ages |
| Gradual | Colors reveal in shades from light to dark | Older kids who enjoy subtlety |
| Random | Surprise color reveals each time | Kids who enjoy unpredictability |

### 8.6 Storage Structure

```
/coloring-images-original/     ← Product owner's colored images
  /garden/
    butterfly-001.png
    butterfly-002.png
  /space/
  /ocean/

/coloring-images-grayscale/    ← Auto-generated by system
  /garden/
    gray_butterfly-001.png

/coloring-images-line-art/     ← B&W for printable coloring books
  /garden/
    bw_butterfly-001.png
```

### 8.7 Printable Coloring Book Business Extension

The same images used for digital trackers can be bundled as printable coloring books for sale on Etsy, Gumroad, or in the MyAIM Library. The black-and-white line art versions are generated at the same time as the colored versions. Themed PDF bundles (25–30 pages each) can be created from the library.

**Pricing tiers (reference only, not built into app):**
- Free tier: 5-page sample packs (lead magnet)
- Low tier: Single theme books $2.99–$4.99
- Mid tier: Mega bundles $9.99–$14.99
- High tier: Annual collections $19.99–$29.99

---

## Section 9: The Animated Star Chart System

The star chart is a digital version of the classic elementary school sticker chart. When a child completes a qualifying action, they tap a button, confetti fires, and an animated star visually generates and settles into place on their chart. The chart fills up over time. When complete, a celebration sequence plays.

This is distinct from the Collection Tracker (Section 7.6) in one critical way: **the animation is the feature**. The star chart is specifically designed for young children (Play and Guided modes) where the moment of tapping and watching the star appear is the primary reward. The Collection Tracker is the general-purpose version; the Star Chart is the emotionally optimized version for small children.

### 9.1 The Interaction Sequence

1. Child taps the "I did it!" button (large, prominent, satisfying to press)
2. Confetti fires from the button
3. A star animates from the button and "flies" to the next empty space on the chart
4. The star settles into place with a small bounce/sparkle animation
5. If this was the last star (chart complete): full celebration sequence plays — bigger confetti, sound, message, and the chart is saved to the Achievement Gallery

### 9.2 Configuration Fields

**Tier 1:** title (e.g., "Potty Chart", "Kindness Stars", "Bedtime Routine"), target_number (how many stars to fill), assigned_to

**Tier 2:** star_type (gold star / heart / paw print / custom emoji / custom image), grid_layout (rows × columns), prize_description, prize_image_url, button_label (e.g., "I went potty!", "I was kind!", "I did it!")

**Tier 3:** confetti_color, star_animation_style (fly/pop/sparkle), celebration_intensity (quiet/normal/maximum), auto_reset_on_complete (start a new chart automatically)

### 9.3 Use Cases

The star chart template is general-purpose. The "potty training" example is just one use case. Others include:
- Kindness chart (did something kind for someone)
- Bedtime routine (completed all steps)
- Morning routine (got ready without reminders)
- Homework chart (completed homework without being asked)
- Chore chart (completed assigned chores)
- Reading chart (read for 20 minutes)
- Practice chart (practiced instrument/sport)
- Behavior chart (paused before responding, used kind words, etc.)

### 9.4 The "Pause Before Responding" Use Case

This is a specific behavior-tracking use case worth documenting explicitly. A child (or adult) who is working on emotional regulation can use the star chart to track each time they successfully paused before responding in a difficult moment. The low-friction interaction (single tap, instant reward) is specifically designed for behaviors that happen in small, irregular moments throughout the day. The child can add multiple stars in a single day as the behavior occurs.

The Chart Tracker (Section 7.5) can be used alongside the Star Chart to show the same data over time as a bar graph — which days they did better, which days were harder, trends over a month.

---

## Section 10: Custom Goal Pursuit Widgets

These three widgets are for tracking progress toward a specific custom goal that the child (or mom) defines. They are different from habit trackers because they are goal-oriented rather than habit-oriented — the child is working toward a specific endpoint, not building a recurring behavior.

### 10.1 Reward Photo Card Widget

**What it is:** A card that displays a photo of the reward the child is working toward (uploaded by mom or the child), with a progress indicator showing how close they are.

**The emotional design:** The child can see exactly what they are working toward. The image is the motivation. As progress increases, the image can animate from grayscale to full color, or a "lock" overlay can dissolve progressively.

**Configuration fields:**
- Title (e.g., "Saving for a LEGO set")
- Prize image (upload from camera roll or URL)
- Prize description
- Goal type: task-completion-based OR points-based OR date-based
- Target (number of tasks, number of points, or a date)
- Progress display style: percentage bar, lock dissolve, grayscale-to-color reveal

**Dashboard display:**
```
🎯 My LEGO Goal
━━━━━━━━━━━━━━━━━━━━━
[Photo of LEGO set — 60% revealed in color]

"Complete 50 tasks to unlock!"
[████████████░░░░░░░░] 30/50

20 more tasks to go!
```

---

### 10.2 Step Unlock Path Widget

**What it is:** A visual path of sequential steps that must be completed in order to earn a reward. Each step is a specific task or milestone. Steps are locked until the previous one is complete. When all steps are done, the reward is unlocked.

**Best for:** Multi-step goals, chores that must be done in sequence, learning progressions, earning a privilege.

**Configuration fields:**
- Title
- Prize description and prize image
- Steps list (ordered, each with a title and optional description)
- Step completion method: manual check-off OR linked to a specific task category
- Display style: path/road, staircase, checklist with locks

**Dashboard display:**
```
🏆 Earn Movie Night
━━━━━━━━━━━━━━━━━━━━━
✅ Step 1: Clean your room
✅ Step 2: Finish all homework
✅ Step 3: Help with dishes
🔒 Step 4: No screen time arguments today
🔒 Step 5: In bed by 8:30 PM

3 of 5 steps complete
2 more to go!
```

**Variant — "Reveal One Step at a Time":** Only the next step is visible. Previous steps show as completed checkmarks. Future steps are hidden. This prevents overwhelm and creates a sense of discovery.

---

### 10.3 Tally Accumulator Widget

**What it is:** A running total tracker for goals that are measured in accumulated quantity over time. The child (or parent) adds to the total at any point during the day, as many times as needed. The widget shows the running total, the target, and a progress bar.

**This is the most versatile widget in the library.** It handles any goal that is measured by accumulation rather than daily completion.

**Configuration fields:**
- Title (e.g., "Study AI 100 Hours", "Read 1,000 Pages", "Practice Piano 50 Hours")
- Target number
- Measurement unit (hours, minutes, pages, times, dollars, miles, etc.)
- Input method: free-number entry (type how many), +1 button (tap to add one), or preset increments (buttons for +15 min, +30 min, +1 hour)
- Allow multiple entries per day: yes (default) / no
- Show history view: yes/no (toggles to bar graph showing entries over time)

**Dashboard display — primary view:**
```
🤖 Study AI
━━━━━━━━━━━━━━━━━━━━━
        47.5
       hours

[████████████░░░░░░░░] 47.5/100

[+ Add Time]  [+15 min] [+30 min] [+1 hr]

Today: 1.5 hrs added
```

**Dashboard display — history view (toggle):**
```
🤖 Study AI — Monthly View
━━━━━━━━━━━━━━━━━━━━━━━━━
4 |       ▄▄      ▄▄
3 |   ▄▄  ██  ▄▄  ██
2 |   ██  ██  ██  ██  ▄▄
1 |   ██  ██  ██  ██  ██
0 +_W1__W2__W3__W4__W5_

Best week: Week 2 (3.5 hrs)
This week: 2.0 hrs so far
```

**Use cases for the Tally Accumulator:**

| Goal | Unit | Input Method |
|---|---|---|
| Study AI 100 hours | hours | Free entry or preset increments |
| Read 1,000 pages | pages | Free entry |
| Do 100 kind acts | times | +1 button |
| Practice piano 50 hours | hours | Preset increments |
| Pause before responding 30 times | times | +1 button (single tap) |
| Save $50 | dollars | Free entry |
| Run 100 miles | miles | Free entry |
| Do 500 pushups | reps | Free entry or preset (+10, +25, +50) |
| Drink 200 glasses of water | glasses | +1 button |

**The "pause before responding" use case:** A child working on emotional regulation can tap "+1" each time they successfully pause before responding. This can happen multiple times a day, in small moments. The history view shows which days they did better, which days were harder, and trends over a month — giving both the child and the parent meaningful insight into their progress.

---

## Section 11: The Allowance Calculator Widget (Full Specification)

This widget is the digital implementation of the percentage-based allowance system. It is a Guided Mode and Independent Mode widget assigned by mom to a specific child.

### 11.1 The Three Structural Approaches

**Approach A — Fixed Template:**
Mom defines a fixed weekly task schedule. The system knows exactly how many tasks are expected each day and week. Completion percentage is calculated against this fixed total.

- Example: 7 homework tasks + 4 chores = 11 tasks/day × 5 school days = 55 tasks + 4 weekend chores = 59 tasks/week
- Child completes 44 of 59 = 74.6% = $10.44 of $14.00 allowance
- Best for: families with consistent weekly routines

**Approach B — Dynamic Pool:**
Mom selects task categories that count. The total pool is calculated dynamically each week based on what was actually assigned. Good for weeks with varying workloads (holidays, sick days, etc.).

- Example: This week had 3 school days (33 tasks) + 4 chores = 37 tasks. Child completed 30 = 81% = $11.34
- Best for: families with variable schedules

**Approach C — Points-Weighted:**
Different task categories are worth different point values. Harder tasks are worth more. Completion percentage is calculated against total possible points, not total task count.

- Example: Homework = 3 pts each, Chores = 1 pt each, Reading = 2 pts each
- This week: 7 homework (21 pts) + 4 chores (4 pts) + 3 reading (6 pts) = 31 possible points
- Child earned 24 points = 77.4% = $10.84
- Best for: families who want to incentivize harder tasks

### 11.2 Configuration Fields

**Tier 1:** title, assigned_to, weekly_allowance_amount
**Tier 2:** approach (A/B/C), task_categories (multi-select checklist), minimum_threshold_percent
**Tier 3:** rounding_behavior, point_values_per_category (Approach C only), partial_day_policy, display_running_total_during_week

### 11.3 Task Category Checklist (Mom Selects Which Count)

The following categories are available for selection. Mom checks all that apply:

- [ ] Homework / Schoolwork
- [ ] Chores (general)
- [ ] Reading
- [ ] Exercise / Physical activity
- [ ] Personal hygiene / Self-care routine
- [ ] Kindness / Service acts
- [ ] Practice (instrument, sport, skill)
- [ ] Creative projects
- [ ] Helping siblings
- [ ] Following schedule / Being on time
- [ ] Screen time limits respected
- [ ] Custom category (mom defines)

### 11.4 Dashboard Display

```
📊 Jake's Weekly Responsibility
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks completed: 44 of 59
[████████████░░░░] 74.6%

This week's allowance:
$10.44 of $14.00

Week resets: Sunday at midnight
[View Task Breakdown]
```

---

## Section 12: Additional Gamification Widgets

These widgets are part of the Gamification category in the Widget Gallery and are distinct from the tracker widgets.

### 12.1 Theme Progress Widget

Displays the child's current Visual World state as an always-visible dashboard widget. Optional (the Visual World also appears in the Victory Recorder celebration sequence, so this widget is supplementary).

**Shows:** Current image of their Visual World, progress bar to next unlock, recent unlocks, next unlock preview.

### 12.2 Achievement Gallery Widget

A gallery of the child's completed achievements — completed color-reveal tracker images, earned badges, milestone certificates. Scrollable, downloadable, shareable.

### 12.3 Rewards & Stars Widget

Shows the child's current gamification points balance and the reward menu. Child can browse available rewards and see how many points each costs. Includes a "Request Reward" button that sends a notification to mom for approval.

### 12.4 Coloring Gallery Widget

A dedicated gallery showing only completed color-reveal tracker images. Each image shows the title, completion date, and achievement description. Images can be downloaded or printed.

### 12.5 Progress Dashboard Widget

An analytics overview showing the child's overall stats: total tasks completed, current streaks, completion rate over time, total points earned, badges earned. More data-oriented, best for Guided and Independent modes.

### 12.6 Family Leaderboard Widget (Optional, Mom-Controlled)

Shows task completion rankings across family members. **This widget must be opt-in and mom-controlled.** It should not be enabled by default because of sibling rivalry concerns. Mom explicitly enables it and can configure whether it shows raw numbers or percentage-based rankings (percentage is fairer across different task loads).

---

---


## Section 13: The Victory Recorder — Two Separate Products

The Victory Recorder is the most important feature in the entire system. It is the daily convergence point where all progress is acknowledged, celebrated, and made meaningful. However, it exists as two fundamentally different products that share a database table but have entirely different UI components.

**Critical naming rule for the codebase:**
- `VictoryRecorder` — the adult/teen reflective journaling component (from StewardShip)
- `DailyCelebration` — the kid-facing celebration sequence component (Play and Guided modes)

Never conflate these in code. They share the `victories` table but are separate React components.

---

### 13.1 The Adult/Teen Victory Recorder (`VictoryRecorder` component)

This is the StewardShip-origin feature. It is a reflective journaling tool for adults and teens to capture their wins, progress, and gratitude at the end of the day or week.

**Interaction pattern:** Mom or teen opens the Victory Recorder from their personal dashboard. They see a structured form with sections for today's wins, completed tasks, best intentions progress, and an optional reflection note. They can add entries manually or review auto-populated entries from the day's activity. The result is a daily record that feeds into monthly reports and the Archives system.

**Key sections:**
- Today's Wins (free text, can add multiple)
- Completed Tasks (auto-populated from task system, can edit)
- Best Intentions Progress (auto-populated from Best Intentions feature)
- Gratitude Note (optional free text)
- Mood/Energy rating (1–5 scale, optional)
- Photo of the day (optional)

**Data written to `victories` table:** All entries are stored with `member_type: 'adult'` or `member_type: 'teen'` and `recorder_type: 'stewardship'`.

---

### 13.2 The Kid Daily Celebration (`DailyCelebration` component)

This is the gamification-origin feature. It is a sequenced celebration experience for children that reveals their progress, celebrates their achievements, and advances their Visual World and Overlay Collection.

**Interaction pattern:** The child (or mom, for young children) opens the Daily Celebration from the child's dashboard. It plays through a 5-step sequence. Each step is skippable. The whole sequence takes 60–90 seconds if not skipped.

**The 5-Step Celebration Sequence:**

**Step 1 — The Opener (5 seconds)**
A full-screen animated greeting with the child's name and a celebratory message. Uses the child's Visual World aesthetic. Confetti or theme-appropriate particles.
```
"Amazing work today, Jake! 🎉"
[Theme-appropriate animation plays]
```

**Step 2 — Tasks Summary (10–15 seconds)**
Shows which tasks were completed today. Each task animates in with a checkmark. Incomplete tasks are shown gently (not as failures).
```
Today you completed:
✅ Math homework
✅ Reading (20 min)
✅ Made your bed
✅ Helped with dishes
⬜ Practice piano (not done yet)

4 of 5 tasks! Great job!
```

**Step 3 — Streak Update (5–10 seconds)**
Shows current streak count with animation. If a streak milestone was hit today, this step gets a bigger celebration.
```
🔥 7-Day Streak!
You've done something every day this week!
[Flame animation grows]
```

**Step 4 — Theme Progress (15–20 seconds) — THE MAIN EVENT**
This is the most important step. Shows the child's Visual World and Overlay Collection progress. If anything new was unlocked today, it is revealed here with a special animation. Gold border on this step.

```
Your Dragon Academy is growing! 🐉
[Dragon image — new accessory appears with sparkle animation]
"Blaze earned a golden saddle!"

Your Apothecary Workshop:
[Workshop image — new elixir bottle appears]
"You brewed a Memory Elixir!"

Points earned today: +40
Total: 287 points
```

**Step 5 — The Close (5–10 seconds)**
An encouraging send-off message. Shows tomorrow's first task as a preview. Option to share today's celebration with mom.
```
You're doing amazing! 🌟
See you tomorrow!

Tomorrow's first task: Math homework
[Share with Mom] [Done!]
```

**Configuration options (mom sets):**
- Which steps to include (all enabled by default)
- Celebration intensity: Quiet / Normal / Maximum
- Auto-play on task completion vs. manual open
- Notification to mom when child views celebration
- Custom message from mom (appears in Step 1 or Step 5)

---

### 13.3 Shared Database Table

```sql
CREATE TABLE victories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,

  -- Record Type
  recorder_type VARCHAR(50) NOT NULL,    -- 'stewardship' (adult) or 'daily_celebration' (kid)
  member_type VARCHAR(20) NOT NULL,      -- 'adult', 'teen', 'child', 'young_child'
  record_date DATE DEFAULT CURRENT_DATE,

  -- Adult/Teen Fields (VictoryRecorder)
  wins JSONB DEFAULT '[]',               -- Array of win text entries
  gratitude_note TEXT,
  mood_rating INTEGER,                   -- 1-5
  energy_rating INTEGER,                 -- 1-5
  photo_url TEXT,
  reflection_text TEXT,

  -- Kid Fields (DailyCelebration)
  tasks_completed JSONB DEFAULT '[]',    -- Array of completed task IDs/names
  tasks_total INTEGER,
  streak_count INTEGER,
  points_earned_today INTEGER DEFAULT 0,
  theme_unlocks_today JSONB DEFAULT '[]', -- What was unlocked
  celebration_viewed BOOLEAN DEFAULT false,
  celebration_viewed_at TIMESTAMPTZ,
  shared_with_mom BOOLEAN DEFAULT false,

  -- Shared Fields
  completed_best_intentions JSONB DEFAULT '[]',
  achievements_earned JSONB DEFAULT '[]',
  auto_generated BOOLEAN DEFAULT false,  -- True if system auto-created this record

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(family_member_id, record_date, recorder_type)
);

CREATE INDEX idx_victories_member ON victories(family_member_id);
CREATE INDEX idx_victories_date ON victories(record_date);
CREATE INDEX idx_victories_type ON victories(recorder_type);
CREATE INDEX idx_victories_family ON victories(family_id);
```

---

## Section 14: Gamification Event Flows

These are the complete event flows that Claude Code needs to implement. Each flow describes what happens when a specific trigger occurs.

### 14.1 Task Completion Flow

When a child marks a task complete:

```
1. Task marked complete in tasks table
2. Award gamification points:
   - Base: 10 points
   - Check for bonus conditions:
     - 3rd task today? +25 bonus points
     - 5th task today (Perfect Day)? +50 bonus points
3. Update family_members.total_gamification_points
4. Check streak:
   - Has child completed at least 1 task today? Update streak.
   - Streak milestone hit (7, 14, 21, 30 days)? Award bonus points + unlock.
5. Check overlay progress:
   - What task category was this? Map to overlay collectible.
   - Add collectible to overlay_progress JSONB.
   - Check if new overlay stage reached.
6. Check theme progress:
   - Has a new theme unlock been triggered?
   - Update theme_progress JSONB.
7. Update today's victories record:
   - Add task to tasks_completed array.
   - Update points_earned_today.
   - Add any new unlocks to theme_unlocks_today.
8. Check allowance calculator:
   - Update weekly completion percentage.
   - Recalculate allowance earned.
9. Trigger any active tracker auto-tracking:
   - Find trackers with auto_track_enabled = true for this member.
   - Check if task category matches tracker's auto_track_source.
   - Create tracker entry if match found.
10. If celebration_type is 'instant':
    - Show immediate micro-celebration (confetti burst, points popup).
```

### 14.2 Star Chart Tap Flow

When a child taps the "I did it!" button on a Star Chart:

```
1. Create tracker entry for today (or increment today's count if multiple allowed).
2. Increment achievements_completed on user_trackers.
3. Trigger star animation:
   - Confetti fires from button.
   - Star animates from button to next empty grid space.
   - Star settles with bounce + sparkle.
4. Check if chart is complete (achievements_completed >= target_number):
   - If yes: trigger completion celebration.
     - Full confetti sequence.
     - Completion message.
     - Save to coloring_gallery (if linked to color-reveal image).
     - Mark tracker as complete.
     - Optionally auto-reset (start new chart).
5. Update victories record for today.
```

### 14.3 Color-Reveal Progress Flow

When an achievement is completed that is linked to a Color-Reveal Tracker:

```
1. Increment achievements_completed on user_trackers.
2. Look up next reveal step from reveal_steps_generated JSONB.
3. Create entry in tracker_color_reveals:
   - color_zone_index: next step number
   - color_hex: the color to reveal
   - color_name: the name of this color zone
4. Trigger reveal animation on dashboard:
   - The grayscale image updates to show the new color zone.
   - Soft glow animation on the newly revealed area.
   - "A new color revealed!" message.
5. Check if image is fully revealed (all steps complete):
   - If yes: trigger completion celebration.
     - Full confetti.
     - "Your image is complete!" message.
     - Save completed image to coloring_gallery.
     - Mark tracker as complete.
6. Update victories record.
```

### 14.4 Overlay Stage Evolution Flow

When a child's overlay progress reaches a new stage threshold:

```
1. Detect stage threshold crossed (e.g., 31 points for Apothecary Stage 2).
2. Update overlay_progress JSONB with new stage number.
3. Add new stage to overlay_unlocks JSONB with timestamp.
4. Queue evolution for DailyCelebration Step 4:
   - Add to theme_unlocks_today in victories record.
   - Flag: 'overlay_evolution' = true.
5. In DailyCelebration Step 4:
   - Show old stage image → new stage image transition animation.
   - "Your [overlay name] has grown!" message.
   - Describe what's new at this stage.
   - Gold border on this step.
```

### 14.5 Streak Milestone Flow

When a streak milestone is reached (7, 14, 21, 30 days):

```
1. Detect streak milestone.
2. Award bonus points (50 / 100 / 150 / 200 points respectively).
3. Unlock streak-based reward if configured:
   - Day 7: Unlock specific overlay item (e.g., Adventure hat, Wooden fence).
   - Day 14: Unlock next tier item.
   - Day 21: Unlock rare item.
   - Day 30: Unlock legendary item.
4. Add unlock to theme_unlocks_today.
5. Send notification to mom: "[Child name] hit a [X]-day streak!"
6. In DailyCelebration Step 3:
   - Bigger animation for milestone streaks.
   - Show what was unlocked.
```

---

## Section 15: The Mom Configuration Journey

This is the complete setup flow from mom's perspective. It is currently undocumented in the source files and is critical for the build. This section defines every step mom takes to configure the gamification system for a child.

### 15.1 Initial Child Setup (During Family Member Creation)

When mom creates a new child profile, the setup wizard includes a gamification step:

**Step 1 — Choose a Visual World:**
Mom sees a grid of Visual World thumbnails with names and age recommendations. She selects one. A preview shows what the child's dashboard will look like.

**Step 2 — Choose an Overlay (Optional):**
Mom sees overlay options with descriptions. She can skip this (no overlay) or select one. If she selects one, she sees a preview of how it maps to task categories.

**Step 3 — Configure the Allowance Calculator (Optional):**
Mom is asked if she wants to set up an allowance. If yes:
- Enter weekly allowance amount
- Select which task categories count
- Choose approach (A/B/C)
- Set minimum threshold

**Step 4 — Add Starter Widgets:**
Mom is shown a curated set of starter widgets for the child's age group. She can add them with one tap or skip and add manually later.

**Step 5 — Preview:**
Mom sees a preview of the child's dashboard with all configured elements. She can go back and change anything.

### 15.2 Adding a Widget to a Child's Dashboard

From any child's dashboard in edit mode:

1. Mom taps "+ Add Widget"
2. Widget Gallery opens
3. Mom browses or searches
4. Mom taps a widget card
5. Configuration modal opens (Tier 1 fields visible by default)
6. Mom fills in required fields
7. "Advanced" toggle reveals Tier 2 and 3 fields
8. Mom taps "Add to Dashboard"
9. Widget appears on dashboard
10. Mom can drag to reposition

### 15.3 Assigning a Tracker to a Child

From the Tracker Gallery (subset of Widget Gallery):

1. Mom taps a tracker template
2. Configuration modal opens with "Assign to:" field prominent
3. Mom selects which family member
4. Mom fills in title, goal, and other fields
5. Mom selects which dashboard it appears on (child's personal dashboard, family shared dashboard, etc.)
6. Mom taps "Assign"

### 15.4 Editing an Existing Widget

From any dashboard in edit mode:

1. Mom taps the settings icon on any widget
2. Configuration modal opens with current values pre-filled
3. Mom makes changes
4. Mom taps "Save"

### 15.5 The Mom Notification System

Mom receives notifications for:
- Child viewed their Daily Celebration
- Child hit a streak milestone
- Child completed their chart (Star Chart, Color-Reveal)
- Child requested a reward redemption
- Weekly summary: child's completion percentage and allowance earned
- Child's overlay reached a new stage

All notifications are configurable. Mom can turn off any notification type in her notification settings.

---

## Section 16: Complete Database Schema

This section consolidates all database tables needed for the gamification and tracker system. Tables are organized by subsystem.

### 16.1 Family Members Gamification Columns

```sql
-- Add to existing family_members table
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS
  -- Visual World
  gamification_theme VARCHAR(50),
  theme_progress JSONB DEFAULT '{}',
  theme_unlocks JSONB DEFAULT '[]',

  -- Overlay
  gamification_overlay VARCHAR(50),
  overlay_progress JSONB DEFAULT '{}',
  overlay_unlocks JSONB DEFAULT '[]',

  -- Points & Streaks
  total_gamification_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_grace_period_used BOOLEAN DEFAULT false,

  -- Creatures (for creature-based overlays)
  gamification_creatures JSONB DEFAULT '[]',

  -- Allowance
  weekly_allowance_amount DECIMAL(10,2),
  allowance_approach VARCHAR(1) DEFAULT 'A',
  allowance_task_categories VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
  allowance_minimum_threshold INTEGER DEFAULT 0,
  allowance_rounding VARCHAR(20) DEFAULT 'round_down',

  -- Dashboard Mode
  dashboard_mode VARCHAR(20) DEFAULT 'guided';
  -- 'play' (young kids), 'guided' (elementary), 'independent' (teens), 'personal' (adults)
```

### 16.2 Tracker Templates Table

```sql
CREATE TABLE tracker_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL,
  template_slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50),
  -- 'grid', 'circle', 'streak', 'progress_bar', 'chart', 'collection',
  -- 'gameboard', 'coloring', 'star_chart', 'tally', 'reward_photo',
  -- 'step_unlock', 'custom'
  visual_styles VARCHAR[] DEFAULT ARRAY['artistic', 'modern', 'kid_friendly'],
  suitable_for_modes VARCHAR[] DEFAULT ARRAY['personal', 'guided', 'independent'],
  age_group VARCHAR(50),
  complexity_level INTEGER DEFAULT 1,
  is_gamification_widget BOOLEAN DEFAULT false,
  default_config JSONB DEFAULT '{}',
  config_schema JSONB NOT NULL,
  thumbnail_url TEXT,
  preview_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 16.3 User Tracker Instances Table

```sql
CREATE TABLE user_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES tracker_templates(id) ON DELETE RESTRICT,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  added_by UUID REFERENCES family_members(id),
  shared_with VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],

  -- Core Configuration
  tracker_name VARCHAR(100) NOT NULL,
  tracker_goal TEXT,
  custom_description TEXT,
  prize_description TEXT,
  prize_image_url TEXT,
  target_number DECIMAL(10,2),
  measurement_unit VARCHAR(50),
  task_categories VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],

  -- Visual
  visual_style VARCHAR(50),
  widget_size VARCHAR(20) DEFAULT 'medium',
  color_scheme JSONB,

  -- Reset
  reset_period VARCHAR(50) DEFAULT 'monthly',
  reset_trigger VARCHAR(50),
  custom_reset_date DATE,
  last_reset_at TIMESTAMPTZ,
  next_reset_at TIMESTAMPTZ,

  -- Dashboard Placement
  dashboard_type VARCHAR(50),
  position_x INTEGER,
  position_y INTEGER,

  -- Feature Flags
  notes_enabled BOOLEAN DEFAULT true,
  emotions_enabled BOOLEAN DEFAULT true,
  auto_track_enabled BOOLEAN DEFAULT false,
  auto_track_source VARCHAR(50),
  celebration_type VARCHAR(50) DEFAULT 'confetti',
  notification_enabled BOOLEAN DEFAULT false,
  notification_time TIME,

  -- Tally Accumulator specific
  allow_multiple_per_day BOOLEAN DEFAULT true,
  input_method VARCHAR(20) DEFAULT 'free_entry',
  preset_increments JSONB DEFAULT '[]',
  show_history_view BOOLEAN DEFAULT true,

  -- Star Chart specific
  button_label VARCHAR(100) DEFAULT 'I did it!',
  star_type VARCHAR(50) DEFAULT 'gold_star',
  grid_columns INTEGER DEFAULT 5,
  star_animation_style VARCHAR(50) DEFAULT 'fly',
  confetti_on_add BOOLEAN DEFAULT true,
  auto_reset_on_complete BOOLEAN DEFAULT false,

  -- Color-Reveal specific
  coloring_image_id UUID REFERENCES coloring_image_library(id),
  total_achievements_needed INTEGER,
  achievements_completed INTEGER DEFAULT 0,
  reveal_steps_generated JSONB,
  reveal_strategy VARCHAR(20) DEFAULT 'auto',

  -- Step Unlock specific
  steps_list JSONB DEFAULT '[]',
  reveal_one_at_a_time BOOLEAN DEFAULT false,

  -- Reward Photo specific
  progress_display_style VARCHAR(50) DEFAULT 'percentage_bar',

  -- Allowance Calculator specific
  weekly_allowance_amount DECIMAL(10,2),
  allowance_approach VARCHAR(1) DEFAULT 'A',
  allowance_minimum_threshold INTEGER DEFAULT 0,
  allowance_rounding VARCHAR(20) DEFAULT 'round_down',
  allowance_point_values JSONB DEFAULT '{}',

  -- Kid-specific gamification
  gameboard_theme VARCHAR(50),
  character_avatar VARCHAR(50),
  achievement_gallery_enabled BOOLEAN DEFAULT true,

  -- Stats (cached)
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_entries INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2),

  -- Status
  is_active BOOLEAN DEFAULT true,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_trackers_member ON user_trackers(family_member_id);
CREATE INDEX idx_user_trackers_family ON user_trackers(family_id);
CREATE INDEX idx_user_trackers_active ON user_trackers(is_active) WHERE is_active = true;
```

### 16.4 Tracker Entries Table

```sql
CREATE TABLE tracker_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_tracker_id UUID REFERENCES user_trackers(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  entry_week INTEGER,
  entry_month INTEGER,
  entry_year INTEGER,

  -- Core Data
  completed BOOLEAN DEFAULT false,
  value DECIMAL(10,2),
  level INTEGER,

  -- Optional Enrichment
  note TEXT,
  emotion VARCHAR(50),
  tags VARCHAR[],

  -- Auto-tracking
  auto_tracked BOOLEAN DEFAULT false,
  source_type VARCHAR(50),
  source_id UUID,

  -- Kid-specific
  gameboard_position INTEGER,
  coloring_section_completed INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_tracker_id, entry_date)
);

CREATE INDEX idx_tracker_entries_tracker ON tracker_entries(user_tracker_id);
CREATE INDEX idx_tracker_entries_date ON tracker_entries(entry_date);
```

### 16.5 Tally Accumulator Entries Table

The standard tracker_entries table uses `UNIQUE(user_tracker_id, entry_date)` which prevents multiple entries per day. Tally Accumulators need multiple entries per day. Use a separate table:

```sql
CREATE TABLE tally_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_tracker_id UUID REFERENCES user_trackers(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  entry_timestamp TIMESTAMPTZ DEFAULT NOW(),
  value DECIMAL(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tally_entries_tracker ON tally_entries(user_tracker_id);
CREATE INDEX idx_tally_entries_date ON tally_entries(entry_date);
```

### 16.6 Color-Reveal Tables

```sql
-- Image library
CREATE TABLE coloring_image_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color_image_url TEXT NOT NULL,
  grayscale_image_url TEXT,
  black_white_line_art_url TEXT,
  thumbnail_url TEXT,
  image_name VARCHAR(100) NOT NULL,
  theme_category VARCHAR(50),
  gamification_theme VARCHAR(50),
  color_zones JSONB NOT NULL,
  total_color_zones INTEGER,
  recommended_min_achievements INTEGER DEFAULT 5,
  recommended_max_achievements INTEGER DEFAULT 30,
  supports_gradient_reveals BOOLEAN DEFAULT true,
  complexity_level INTEGER,
  age_group VARCHAR(50),
  keywords VARCHAR[],
  is_available_for_print BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Color reveal tracking
CREATE TABLE tracker_color_reveals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_tracker_id UUID REFERENCES user_trackers(id) ON DELETE CASCADE,
  color_zone_index INTEGER,
  color_hex VARCHAR(7),
  color_name VARCHAR(50),
  revealed_at TIMESTAMPTZ DEFAULT NOW(),
  achievement_count INTEGER,
  UNIQUE(user_tracker_id, color_zone_index)
);

-- Achievement gallery
CREATE TABLE coloring_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_tracker_id UUID REFERENCES user_trackers(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  coloring_template_id UUID,
  template_name VARCHAR(100),
  completed_image_url TEXT,
  completed_at TIMESTAMPTZ,
  total_sections INTEGER,
  timeframe VARCHAR(50),
  achievement_description TEXT,
  celebration_played BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 16.7 Gamification Points Log Table

```sql
CREATE TABLE gamification_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  source_type VARCHAR(50),
  source_id UUID,
  balance_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_points_log_member ON gamification_points_log(family_member_id);
CREATE INDEX idx_points_log_date ON gamification_points_log(created_at);
```

### 16.8 Reward Redemption Table

```sql
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  reward_name VARCHAR(100) NOT NULL,
  reward_description TEXT,
  points_cost INTEGER,
  status VARCHAR(20) DEFAULT 'pending',
  -- 'pending' (child requested), 'approved' (mom approved), 'denied', 'redeemed'
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES family_members(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Section 17: Component Architecture

This section defines the complete React component tree for the gamification and tracker system.

```
src/components/
├── gamification/
│   ├── DailyCelebration/
│   │   ├── DailyCelebration.tsx          ← Main celebration sequence (kid version)
│   │   ├── CelebrationOpener.tsx         ← Step 1: Greeting
│   │   ├── TasksSummary.tsx              ← Step 2: Tasks completed
│   │   ├── StreakUpdate.tsx              ← Step 3: Streak milestone
│   │   ├── ThemeProgress.tsx             ← Step 4: Visual World + Overlay reveal
│   │   └── CelebrationClose.tsx          ← Step 5: Send-off
│   │
│   ├── VictoryRecorder/
│   │   ├── VictoryRecorder.tsx           ← Adult/teen reflective journaling
│   │   ├── WinsEntry.tsx
│   │   ├── GratitudeNote.tsx
│   │   └── MoodRating.tsx
│   │
│   ├── VisualWorld/
│   │   ├── VisualWorldDisplay.tsx        ← Shows current theme state
│   │   ├── VisualWorldSelector.tsx       ← Mom's theme selection UI
│   │   └── VisualWorldProgress.tsx       ← Progress widget
│   │
│   ├── Overlay/
│   │   ├── OverlayDisplay.tsx            ← Shows current overlay state
│   │   ├── OverlaySelector.tsx           ← Mom's overlay selection UI
│   │   ├── ApothecaryWorkshop.tsx        ← Apothecary-specific display
│   │   ├── KingdomBuilder.tsx            ← Kingdom-specific display
│   │   ├── AdventureExplorer.tsx         ← Adventure-specific display
│   │   └── GenericOverlay.tsx            ← Fallback for all other overlays
│   │
│   └── Points/
│       ├── PointsDisplay.tsx             ← Current balance widget
│       ├── RewardMenu.tsx                ← Browse and request rewards
│       └── RewardRedemption.tsx          ← Redemption request flow
│
├── trackers/
│   ├── gallery/
│   │   ├── TrackerGallery.tsx            ← Main gallery modal
│   │   ├── TrackerTemplateCard.tsx       ← Individual template card
│   │   ├── TrackerFilters.tsx            ← Category/style/age filters
│   │   └── TrackerSearch.tsx
│   │
│   ├── configuration/
│   │   ├── TrackerConfigModal.tsx        ← Universal configuration modal
│   │   ├── ConfigTier1.tsx              ← Always-visible fields
│   │   ├── ConfigTier2.tsx              ← Common customization
│   │   ├── ConfigTier3.tsx              ← Advanced (hidden by default)
│   │   ├── PersonSelector.tsx
│   │   ├── TaskCategoryChecklist.tsx    ← Multi-select task categories
│   │   ├── PrizeImageUpload.tsx
│   │   └── ResetScheduleSelector.tsx
│   │
│   ├── widgets/
│   │   ├── TrackerWidget.tsx             ← Base wrapper (shell-aware)
│   │   ├── GridTracker.tsx
│   │   ├── CircleTracker.tsx
│   │   ├── StreakTracker.tsx
│   │   ├── ProgressBarTracker.tsx
│   │   ├── ChartTracker.tsx
│   │   ├── CollectionTracker.tsx
│   │   ├── GameboardTracker.tsx
│   │   ├── StarChartTracker.tsx          ← Animated star chart with confetti
│   │   ├── ColorRevealTracker.tsx        ← Color-reveal image tracker
│   │   ├── TallyAccumulator.tsx          ← Running total + history graph
│   │   ├── RewardPhotoCard.tsx           ← Custom goal with photo
│   │   ├── StepUnlockPath.tsx            ← Sequential step unlock
│   │   ├── AllowanceCalculator.tsx       ← Percentage-based allowance
│   │   └── CustomTracker.tsx
│   │
│   ├── entry/
│   │   ├── TrackerEntryModal.tsx
│   │   ├── TallyEntryInput.tsx           ← Free entry + preset buttons
│   │   ├── StarChartButton.tsx           ← The "I did it!" button
│   │   ├── NoteInput.tsx
│   │   └── EmotionSelector.tsx
│   │
│   └── gallery-achievements/
│       ├── AchievementGallery.tsx        ← Kid's completed images
│       ├── ColoringGallery.tsx           ← Completed color-reveal images
│       └── BadgeGallery.tsx              ← Earned badges
│
└── animations/
    ├── Confetti.tsx                      ← Reusable confetti component
    ├── StarFly.tsx                       ← Star animation for star chart
    ├── ColorReveal.tsx                   ← Color zone reveal animation
    ├── EvolutionTransition.tsx           ← Overlay stage evolution
    └── PointsPopup.tsx                   ← Points earned popup
```

---

## Section 18: API Endpoints

```
/api/gamification/
  POST   /complete-task              ← Main task completion handler (runs full event flow)
  GET    /member/:id/progress        ← Get all gamification progress for a member
  POST   /member/:id/points          ← Award/deduct points manually
  GET    /member/:id/celebration     ← Get today's celebration data
  POST   /member/:id/celebration/viewed  ← Mark celebration as viewed
  GET    /rewards                    ← Get reward menu for a family
  POST   /rewards/request            ← Child requests a reward
  PATCH  /rewards/:id/approve        ← Mom approves reward
  PATCH  /rewards/:id/deny           ← Mom denies reward

/api/trackers/
  GET    /templates                  ← Get all tracker templates (with filters)
  GET    /templates/:id              ← Get single template
  GET    /user-trackers/:memberId    ← Get all trackers for a member
  POST   /user-trackers              ← Create new tracker instance
  PATCH  /user-trackers/:id          ← Update tracker configuration
  DELETE /user-trackers/:id          ← Archive tracker
  POST   /entries                    ← Create tracker entry
  POST   /tally-entries              ← Create tally entry (multiple per day)
  GET    /entries/:trackerId         ← Get entries for a tracker
  GET    /entries/:trackerId/history ← Get history data for chart view

/api/coloring/
  GET    /library                    ← Get coloring image library (with filters)
  GET    /library/:id                ← Get single image with color zones
  POST   /reveal                     ← Reveal next color zone
  GET    /gallery/:memberId          ← Get achievement gallery for a member
  POST   /gallery                    ← Save completed image to gallery

/api/allowance/
  GET    /:memberId/current-week     ← Get current week's allowance calculation
  GET    /:memberId/history          ← Get allowance history
  PATCH  /:memberId/config           ← Update allowance configuration
```

---

## Section 19: Build Order and Priority

This section defines the recommended build sequence. Items are ordered by dependency and impact.

### Phase 1 — Foundation (Build First)

These items must exist before anything else can be built.

1. **Database migrations** — All tables from Section 16
2. **CSS token system** — All variables from Section 2.1 defined in the base stylesheet
3. **Shell context provider** — React context that provides current shell mode to all components
4. **Theme token provider** — React context that provides current theme values to all components
5. **`TrackerWidget` base wrapper** — Shell-aware wrapper that all tracker widgets use

### Phase 2 — Core Trackers (High Impact, Relatively Simple)

6. **`GridTracker`** — Most versatile, most requested
7. **`StreakTracker`** — High motivational value
8. **`ProgressBarTracker`** — Universal use case
9. **`TallyAccumulator`** — Unique value proposition, high versatility
10. **`TrackerGallery`** — The browsing interface
11. **`TrackerConfigModal`** — Universal configuration UI

### Phase 3 — Kid Gamification (High Delight, Medium Complexity)

12. **`StarChartTracker`** with confetti and star animation
13. **`DailyCelebration`** sequence (5 steps)
14. **`VisualWorldDisplay`** and `VisualWorldProgress` widget
15. **`CollectionTracker`** (sticker/badge style)
16. **Task completion event flow** (Section 14.1)

### Phase 4 — Advanced Trackers

17. **`ColorRevealTracker`** and color-reveal algorithm
18. **`AllowanceCalculator`** widget
19. **`RewardPhotoCard`** widget
20. **`StepUnlockPath`** widget
21. **`ChartTracker`** with history view

### Phase 5 — Overlay System

22. **Overlay engine** (generic, config-driven)
23. **`ApothecaryWorkshop`** component (first overlay, most specified)
24. **`OverlaySelector`** for mom's configuration
25. **Overlay event flows** (Section 14.4)

### Phase 6 — Advanced Gamification

26. **`VictoryRecorder`** adult/teen component
27. **`RewardMenu`** and redemption flow
28. **`AchievementGallery`** and `ColoringGallery`
29. **`GameboardTracker`**
30. **Additional overlays** (Kingdom Builder, Adventure Explorer, etc.)

### Phase 7 — Polish and Advanced Features

31. **`EvolutionTransition`** animation
32. **Family Leaderboard** widget (opt-in)
33. **Mom notification system**
34. **Monthly archive compilation**
35. **Printable coloring book export**

---

## Section 20: Key Decisions and Open Questions

These are decisions that still need to be made before or during development. Document the answer here when decided.

| Decision | Status | Notes |
|---|---|---|
| What is the gamification points currency called? | **Open** | "Stars," "gems," "coins," "sparks"? Needs a name for UI display. |
| Does the Family Leaderboard show raw numbers or percentages? | **Recommended: percentages** | Fairer across different task loads. |
| Can a child change their own Visual World? | **Open** | Or is it mom-only? Recommend: mom sets, child can request change. |
| What happens to overlay progress when Visual World changes? | **Open** | Recommend: overlay progress persists, only visual skin changes. |
| Is the Allowance Calculator visible to the child in real time? | **Open** | Or only revealed at end of week? |
| Can a teen configure their own trackers? | **Open** | Recommend: yes, with mom's permission toggle. |
| What is the grace period for streaks? | **Recommended: 1 day** | Miss 1 day without breaking streak. Mom configures. |
| How are coloring images generated? | **Product owner generates with AI tools** | Gemini/DALL-E. System stores and serves. |
| Is the reward redemption flow in-app only or does it send a notification? | **Recommended: both** | In-app request + push notification to mom. |

---

## Section 21: Visual Asset Requirements

This section lists all visual assets that need to be created before or during development. Assets marked with (AI) should be generated using Gemini, DALL-E, or Midjourney by the product owner.

### 21.1 Visual World Backgrounds (AI)

For each of the 13 Visual Worlds: one desktop background, one mobile background, one thumbnail. All must use the theme's color palette and be suitable as dashboard backgrounds (not too busy, good contrast for overlaid text).

### 21.2 Overlay Stage Images (AI)

For each overlay, one image per stage (4 stages = 4 images per overlay). Images should show the accumulation/growth clearly. Transparent background preferred.

**Apothecary Workshop:** 4 stage images (prompts provided in Section 4.2)

**Adventure Explorer:** 4 character stage images (prompts: use the stage descriptions in Section 4.3)

**Kingdom Builder:** 4 aerial-view kingdom images (prompts: use the stage descriptions in Section 4.4)

### 21.3 Coloring Image Library (AI)

Minimum 20 images for launch, organized by theme category. Each image needs:
- Full-color version (PNG, 1024×1024 minimum)
- Grayscale version (auto-generated by system)
- Black-and-white line art version (for printable coloring books)
- Color zone map (JSON defining which areas are which colors)

Suggested categories for launch: Garden (5 images), Space (5 images), Ocean (5 images), Fantasy (5 images).

### 21.4 Star Chart Stars and Stickers (AI or Icon Library)

- Gold star (default)
- Heart
- Paw print
- Rainbow star
- Sparkle star
- Custom emoji support (uses system emoji)

### 21.5 Badge and Achievement Icons (AI or Icon Library)

Minimum 30 badges for launch, covering: streak milestones (7, 14, 21, 30, 60, 90 days), task completion milestones, perfect week, perfect month, overlay stage completions, color-reveal completions.

---

*End of Master Manuscript — Part 3 of 3*

*This document, combined with Parts 1 and 2, constitutes the complete gamification and tracker system specification for MyAIM Central. All three parts should be provided together to Claude Code at the start of any development session related to this system.*
