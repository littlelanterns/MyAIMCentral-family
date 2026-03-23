# PRD-24A Game Modes Addendum

**Status:** Approved — Ready for Pre-Build Audit Reconciliation
**Created:** March 16, 2026
**Parent PRD:** PRD-24A (Overlay Engine & Gamification Visuals)
**Scope:** Defines 4 new game modes added to the 3 existing modes from PRD-24A, bringing the launch total to 7. Also documents the full roadmap of 15 solo modes and 6 co-op modes for post-MVP expansion.

---

## Context

PRD-24A defines 3 game modes at launch: Daily Growth (effort), Category Collection, and Recipe & Quest. This addendum adds 4 more modes that were designed to work in both **solo** (individual child) and **co-op** (family on the Family Hub) contexts. All 7 modes plug into any of the visual themes via the modular Visual Theme × Game Mode architecture.

The 4 new modes are: **Stamp Passport**, **Streak Evolution**, **Boss Battle / Party Quest**, and **Family Bingo**.

---

## Launch Game Modes Summary (7 Total)

| # | Mode | Primary Mechanic | Solo | Co-op | Complexity |
|---|------|-----------------|------|-------|------------|
| 1 | Daily Growth | One collectible per day, sized by task volume | ✅ | ✅ Family daily growth | Simple |
| 2 | Category Collection | One collectible per completed task category | ✅ | ✅ Family category pool | Medium |
| 3 | Recipe & Quest | Collect quantities → combine → unlock reward | ✅ | ✅ Family recipe | Medium |
| 4 | Stamp Passport | Fill micro-goal stamps in a passport book | ✅ | ✅ Family passport | Simple |
| 5 | Streak Evolution | Consecutive days evolve a creature through phases | ✅ | ✅ Family creature | Medium |
| 6 | Boss Battle / Party Quest | Contribute toward a shared HP bar or quest target | ✅ | ✅ Primary co-op mode | Medium |
| 7 | Family Bingo | Complete squares on a shared bingo card | ✅ | ✅ Primary co-op mode | Simple |

---

## New Mode 1: Stamp Passport

### How It Works

A visual passport book with pages. Each page has 4–8 stamp slots. Each slot is a micro-goal: "Complete morning routine 5 days in a row," "Read for 30 minutes 3 times this week," "Try a new chore." Stamps are earned when the micro-goal is met. Filling a page unlocks a collectible (from the active visual theme) and reveals the next page with slightly harder goals.

### Implementation

Stamp Passport reuses the existing recipe/quest engine from PRD-24A with a different UI wrapper. Each "stamp slot" is a `RecipeCombination` where the ingredients are task completion counts, streak milestones, or category completions, and the result is a stamp (visual) + optional collectible from the theme.

A "passport page" is a group of stamps. Completing all stamps on a page = completing a "super-recipe" that unlocks the next page.

```typescript
const StampPassportMode: GameModeConfig = {
  id: 'stamp_passport',
  name: 'Stamp Passport',
  icon: '📕',
  description: 'Fill your passport with stamps by completing micro-goals! Each filled page unlocks a prize and a new adventure.',
  collectibleMode: 'category',  // Stamps are earned per-goal, not per-day
  categorySettings: {
    requireFullCategoryCompletion: false,  // Stamps have their own completion criteria
  },
  recipeSystem: {
    enabled: true,
    uiLabel: 'Passport',
    combineVerb: 'Stamp',
  },
};
```

### Passport-Specific Data

```typescript
interface PassportPage {
  id: string;
  pageNumber: number;
  title: string;                        // "Beginner's Journey", "Explorer's Path"
  stamps: PassportStamp[];
  completionReward?: string;            // Collectible or reward on page completion
  isComplete: boolean;
}

interface PassportStamp {
  id: string;
  description: string;                  // "Complete morning routine 5 days in a row"
  goal: StampGoal;
  isEarned: boolean;
  earnedAt?: string;
}

interface StampGoal {
  type: 'task_count' | 'streak_days' | 'category_complete' | 'specific_task' | 'custom';
  taskCategory?: string;                // For category-specific goals
  targetCount: number;                  // How many times / how many days
  timeframe?: 'day' | 'week' | 'month' | 'any';  // Within what period
}
```

### Solo vs. Co-op

- **Solo:** Kid fills their own passport. Pages and stamps are personal. Each family member can have their own passport with age-appropriate goals.
- **Co-op:** Family shares a passport displayed on the Family Hub. Stamps require contributions from different family members — "Emma reads 3 times" + "Jake does 5 chores" + "Family completes all morning routines on the same day." Mom configures which stamps need which members.

### Mom Configuration

- Mom can accept LiLa-generated passport pages (based on the family's task patterns) or create custom pages
- Each stamp slot: mom sets the description, the goal type, the target count, and the timeframe
- Human-in-the-Mix: LiLa suggests pages → mom edits/approves/regenerates
- Completed passports are archived and viewable as a gallery of achievement

### Visual

The passport is themed to the active visual theme:
- Pets: a "Pet Explorer's Logbook" with paw print stamps
- Apothecary: an "Alchemist's Journal" with wax seal stamps
- Dragons: a "Dragon Rider's Record" with claw mark stamps
- Pixel Loot: a "Hero's Quest Log" with pixel badge stamps

---

## New Mode 2: Streak Evolution

### How It Works

A creature (from the active visual theme) evolves through phases as the kid maintains a streak of daily task completion. The evolution chain has 5 phases:

| Phase | Streak Days | Visual | Name Pattern |
|-------|------------|--------|-------------|
| 1 — Egg | Day 1 | Egg/seed/cocoon | "Something is hatching..." |
| 2 — Hatchling | Day 3 | Tiny, cute, fragile | "Meet your [creature]!" |
| 3 — Juvenile | Day 7 | Growing, more features | "[Name] is growing!" |
| 4 — Adult | Day 14 | Full-sized, impressive | "[Name] has matured!" |
| 5 — Legendary | Day 21 | Epic, glowing, majestic | "[Name] has become LEGENDARY!" |

### Key Mechanics

- **Pause, not reset:** A missed day doesn't reset to egg. Evolution pauses. The creature stays at its current phase. When the streak resumes, evolution continues from where it left off.
- **Golden Evolution bonus:** If the streak is completely unbroken (no pauses, no grace days used), the legendary form gets a special "golden" variant — a visually enhanced version with sparkle/glow effects. This is the flex.
- **Collection:** Fully evolved creatures are saved to the collection. Over months, the kid builds a gallery of legendary creatures — each one representing a 21-day streak.
- **Evolution celebration:** When a creature reaches legendary form, a special animation plays through all 5 phases in sequence as a flipbook — egg → hatchling → juvenile → adult → legendary — using the same grid-sliced images. This is the payoff moment.

### Implementation

```typescript
const StreakEvolutionMode: GameModeConfig = {
  id: 'streak_evolution',
  name: 'Streak Evolution',
  icon: '🥚',
  description: 'Hatch and evolve a creature by completing tasks every day! Watch it grow from an egg to a legendary being.',
  collectibleMode: 'effort',  // One creature at a time, evolving
  effortSettings: {
    sizeThresholds: [
      { minTasks: 1, size: 'small', visualMultiplier: 0.5, label: 'Egg' },
      { minTasks: 1, size: 'medium', visualMultiplier: 0.75, label: 'Hatchling' },
      { minTasks: 1, size: 'large', visualMultiplier: 1.0, label: 'Adult' },
      { minTasks: 1, size: 'legendary', visualMultiplier: 1.25, label: 'Legendary' },
    ],
    nameGenerator: 'sequential',  // Evolves one creature at a time
  },
};
```

### Evolution-Specific Data

```typescript
interface EvolutionCreature {
  id: string;
  creatureVariantId: string;            // Which creature from the theme's palette
  creatureName: string;                 // Kid-named or auto-named
  currentPhase: 1 | 2 | 3 | 4 | 5;
  streakDaysAtPhase: number;            // Days in current streak contributing to this creature
  isGoldenEvolution: boolean;           // Unbroken streak — no pauses or grace days
  evolvedAt?: string;                   // When it reached legendary (phase 5)
  phaseHistory: {                       // Timestamps for each phase reached
    [phase: number]: string;
  };
}
```

### Solo vs. Co-op

- **Solo:** Kid evolves their own creature. Their personal streak drives the evolution.
- **Co-op:** Family shares a creature on the Family Hub. The family streak drives evolution — if ANY family member completes tasks each day, the streak continues (easy mode). Or ALL members must complete at least one task (hard mode). Mom configures which.

### Asset Generation

Each visual theme needs a 5-phase evolution strip per creature variant. These are perfect for grid generation:

- **Per theme:** 1 row of 5 images (egg → hatchling → juvenile → adult → legendary) per creature variant
- **Grid format:** A 5×N grid where N = number of creature variants. Slice into individual phase images.
- **Celebration animation:** The same 5 images played in sequence as a flipbook (CSS animation cycling through the 5 frames over 3–4 seconds, with a dramatic pause and sparkle burst on the legendary frame).
- **Golden variants:** The legendary (phase 5) image with a CSS gold shimmer/glow overlay. No separate image needed — CSS effect on the base image.

**Asset count per theme (Streak Evolution):**

| Asset | Count | Format | Creation |
|-------|-------|--------|----------|
| Evolution strip (5 phases × N variants) | 5 × ~4 variants = 20 per theme | 128×128 PNG | 5×4 grid → Image Cutter |
| **4 launch themes** | **80 phase images total** | | ~20 min pipeline time |

---

## New Mode 3: Boss Battle / Party Quest

### How It Works

A shared challenge with a visual target (HP bar for Boss Battle, item checklist for Party Quest) that the family — or a solo player — works to complete within a time limit. Mom (or LiLa) configures the boss/quest, and family members contribute by completing their normal tasks.

**Boss Battle skin:** A big boss character with an HP bar. Each task completion deals "damage." The HP bar visually depletes on the Family Hub. Phases at HP thresholds change the boss's appearance (full health → damaged → nearly defeated).

**Party Quest skin:** A narrative quest with required item contributions. "Defeat the dragon: collect 5 swords + 3 shields + 4 potions + 2 scrolls." Each task category contributes a specific item type. The quest board shows progress toward each required item.

Both skins use the same underlying engine: a shared target number that decrements/increments as family members complete tasks.

### Implementation

Boss Battle and Party Quest are one `GameModeConfig` with a `questSkin` parameter:

```typescript
const BossPartyMode: GameModeConfig = {
  id: 'boss_party',
  name: 'Boss Battle & Party Quest',
  icon: '⚔️',
  description: 'Work together to defeat bosses or complete epic quests! Every task contributes to the shared goal.',
  collectibleMode: 'category',
  categorySettings: {
    requireFullCategoryCompletion: false,  // Each task contributes, not just full categories
  },
  recipeSystem: {
    enabled: false,  // The quest IS the recipe — one big goal, not combinable sub-recipes
    uiLabel: 'auto',
    combineVerb: 'auto',
  },
};
```

### Boss/Quest-Specific Data

```typescript
interface BossQuest {
  id: string;
  family_id: string;
  skin: 'boss_battle' | 'party_quest';

  // Shared target
  title: string;                        // "The Shadow Dragon" or "Rescue the Lost Kingdom"
  description: string;                  // Narrative flavor text
  totalHP: number;                      // Boss HP or total quest requirement
  currentHP: number;                    // Remaining (decrements as family contributes)

  // Phase thresholds (boss appearance changes, quest narrative advances)
  phases: BossPhase[];

  // Duration
  startDate: string;
  endDate: string;
  durationDays: number;                 // Mom-configured

  // Contribution tracking
  contributions: {
    [familyMemberId: string]: number;   // How much each member contributed
  };

  // Category multipliers (optional — mom can weight certain task types)
  categoryMultipliers?: {
    [taskCategory: string]: number;     // e.g., { exercise: 2 } means exercise tasks deal double damage
  };

  // Status
  status: 'active' | 'completed' | 'failed' | 'draft';
  completedAt?: string;
  reward?: string;                      // What the family earns on completion

  // Visual theme
  visualThemeId: string;                // Which theme's boss art to use
  bossImageKey: string;                 // Specific boss from the theme
}

interface BossPhase {
  phaseNumber: number;                  // 1, 2, 3
  hpThreshold: number;                  // Phase triggers when HP drops below this
  name: string;                         // "Shield Broken!", "Weakened!", "Final Stand!"
  description: string;
  bossImageVariant: string;             // Different boss image per phase (healthy → damaged → near-defeat)
}
```

### Solo vs. Co-op

- **Solo:** One kid vs. the boss. Mom sets HP lower for solo (scales to the kid's typical task volume). Great for an individual challenge: "Can you defeat the dragon in 2 weeks?"
- **Co-op:** Family vs. the boss on the Family Hub. Each member's task completions contribute. The HP bar updates in real-time. This is the flagship co-op experience — the whole family watching the HP bar drop together.

### LiLa Integration

LiLa can generate boss/quest content:
- "Based on your family's typical weekly output of ~45 tasks, I'd suggest a boss with 60 HP for a 2-week challenge — achievable but requires effort."
- Boss narrative: LiLa writes the flavor text, phase descriptions, and victory message
- Mom reviews via Human-in-the-Mix

### Boss Art Assets

Per-theme boss images, generated as grids:

| Asset | Dimensions | Count per Theme | Format | Creation |
|-------|-----------|----------------|--------|----------|
| Mega boss (3 phases: healthy, damaged, near-defeat) | 512×512 | 3 | PNG transparent | 3×1 grid or individual |
| Mini bosses (1 image each) | 256×256 | 3 | PNG transparent | 3×1 grid |
| Defeated boss (victory state) | 512×512 | 1 | PNG transparent | CSS grayscale + trophy overlay on mega boss |
| **Per theme total** | | **7 images** (6 + 1 CSS) | | |
| **4 launch themes** | | **28 images** | | ~15 min pipeline |

**Theme-specific boss examples:**
- Pets: Giant runaway pet (friendly — you're "catching" it, not fighting)
- Apothecary: Rogue potion gone wrong (bubbling cauldron monster)
- Dragons: Elder dragon challenge (you're proving worthy, not killing)
- Pixel Loot: Classic 8-bit boss (dragon, wizard, dark knight)

> **Celebration-only note:** Boss "battles" are framed positively. For younger themes (Pets), the narrative is rescue/befriend, not combat. "The lost mega-puppy needs 50 treats to come home!" For older themes (Pixel Loot, Dragons), combat framing is age-appropriate.

---

## New Mode 4: Family Bingo

### How It Works

A 5×5 bingo card where each square is a specific task, achievement, or behavior. Squares are a mix of:
- **Individual goals:** "Emma reads for 20 min" / "Jake completes all chores"
- **Pair goals:** "Two siblings do a chore together" / "Someone helps a sibling with homework"
- **Family goals:** "Everyone completes morning routine on the same day" / "Family finishes all tasks before 5pm"
- **Stretch goals:** "Someone tries a task they've never done" / "Complete a bonus task"

Standard bingo rules apply — lines (5 in a row), four corners, and full blackout, each with escalating rewards.

### LiLa-Generated Cards

LiLa generates bingo cards based on the family's actual data:

1. **LiLa reads:** Family member list, assigned task categories per member, recent completion patterns, active streaks, task difficulty ratings
2. **LiLa generates:** A balanced 5×5 card with appropriate difficulty distribution:
   - ~8 easy squares (likely to happen naturally)
   - ~10 moderate squares (require some effort)
   - ~5 hard squares (stretch goals)
   - ~2 wildcard squares (fun/unexpected)
3. **LiLa presents to mom** via Human-in-the-Mix: Edit / Approve / Regenerate / Reject
4. **Mom edits:** Can change any square's description, target count, assigned member, or difficulty. Can swap squares. Can adjust the reward for bingo/four-corners/blackout.
5. **Card goes live** on the Family Hub and optionally on individual dashboards

### Implementation

```typescript
const FamilyBingoMode: GameModeConfig = {
  id: 'family_bingo',
  name: 'Family Bingo',
  icon: '🎯',
  description: 'Complete squares on a shared bingo card! Get a line, four corners, or blackout for escalating rewards.',
  collectibleMode: 'category',
  categorySettings: {
    requireFullCategoryCompletion: false,
  },
  recipeSystem: {
    enabled: false,
    uiLabel: 'Bingo Card',
    combineVerb: 'Complete',
  },
};
```

### Bingo-Specific Data

```typescript
interface BingoCard {
  id: string;
  family_id: string;
  title: string;                        // "March Week 2 Challenge"
  duration: 'week' | 'biweekly' | 'month' | 'custom';
  startDate: string;
  endDate: string;
  squares: BingoSquare[];               // 25 squares (5×5 grid, indexed 0–24)
  rewards: {
    line: string;                       // Reward for first bingo line
    fourCorners: string;                // Reward for four corners
    blackout: string;                   // Reward for all 25 squares
  };
  completedLines: number[];             // Which lines have been completed (row/col/diagonal indices)
  fourCornersComplete: boolean;
  blackoutComplete: boolean;
  status: 'active' | 'completed' | 'expired' | 'draft';
  generatedBy: 'lila' | 'mom' | 'template';
  created_at: string;
}

interface BingoSquare {
  index: number;                        // 0–24 (left-to-right, top-to-bottom)
  description: string;                  // "Emma reads for 20 min"
  goalType: 'individual' | 'pair' | 'family' | 'stretch' | 'wildcard';
  assignedTo?: string;                  // family_member_id (for individual goals)
  completionCriteria: {
    type: 'task_count' | 'streak' | 'category_complete' | 'time_based' | 'custom';
    targetCount?: number;
    taskCategory?: string;
    timeframe?: string;
    customDescription?: string;         // For goals the system can't auto-detect
  };
  difficulty: 'easy' | 'moderate' | 'hard' | 'wildcard';
  isComplete: boolean;
  completedAt?: string;
  completedBy?: string;                 // family_member_id who triggered completion
  isFreeSpace: boolean;                 // Center square — auto-complete on card start
}
```

### Solo vs. Co-op

- **Solo:** Personal bingo card for one child. All squares are individual goals. Good for teens who want a structured challenge.
- **Co-op:** Shared family card on the Family Hub. Mix of individual, pair, and family goals. This is the primary use case — the family working together to get bingos.

### Duration

Mom chooses how long a card lasts:
- **1 week:** Quick, fresh cards. Good for families who want variety.
- **2 weeks:** Standard pace. Most goals achievable with consistent effort.
- **1 month:** Longer-term. Harder goals. Bigger blackout reward.
- **Custom:** Mom sets exact start and end dates.

When a card expires, it's archived (viewable in history). LiLa can auto-generate the next card based on what went well/poorly on the previous one.

### Visual

The bingo card is themed to the active visual theme:
- Pets: Paw-print squares on a dog tag background
- Apothecary: Potion bottles in a shelf grid
- Dragons: Dragon eggs in a nest grid
- Pixel Loot: Treasure map grid with X-marks-the-spot

Completed squares get a stamp/check animation. Bingo lines get a gold highlight. Blackout triggers a full celebration animation.

---

## Database Schema Additions

### Table: `boss_quests`

Shared boss battles and party quests.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| skin | TEXT | 'boss_battle' | NOT NULL | 'boss_battle' or 'party_quest' |
| title | TEXT | | NOT NULL | Boss name or quest title |
| description | TEXT | | NULL | Narrative flavor text |
| total_hp | INTEGER | | NOT NULL | Total target (boss HP or quest total) |
| current_hp | INTEGER | | NOT NULL | Remaining (decrements) |
| phases | JSONB | '[]' | NOT NULL | Phase definitions with HP thresholds |
| contributions | JSONB | '{}' | NOT NULL | Per-member contribution counts |
| category_multipliers | JSONB | | NULL | Optional task category weightings |
| visual_theme_id | TEXT | | NOT NULL | Which theme's boss art |
| boss_image_key | TEXT | | NOT NULL | Specific boss image |
| start_date | DATE | | NOT NULL | |
| end_date | DATE | | NOT NULL | |
| reward | TEXT | | NULL | Family reward on completion |
| status | TEXT | 'active' | NOT NULL | 'active', 'completed', 'failed', 'draft' |
| completed_at | TIMESTAMPTZ | | NULL | |
| generated_by | TEXT | 'mom' | NOT NULL | 'mom', 'lila', 'template' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. All family members read.

### Table: `bingo_cards`

Family bingo cards.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| title | TEXT | | NOT NULL | |
| squares | JSONB | '[]' | NOT NULL | Array of 25 BingoSquare objects |
| rewards | JSONB | '{}' | NOT NULL | { line, fourCorners, blackout } |
| completed_lines | JSONB | '[]' | NOT NULL | Array of completed line indices |
| four_corners_complete | BOOLEAN | false | NOT NULL | |
| blackout_complete | BOOLEAN | false | NOT NULL | |
| start_date | DATE | | NOT NULL | |
| end_date | DATE | | NOT NULL | |
| duration_type | TEXT | 'week' | NOT NULL | 'week', 'biweekly', 'month', 'custom' |
| status | TEXT | 'active' | NOT NULL | 'active', 'completed', 'expired', 'draft' |
| visual_theme_id | TEXT | | NULL | Theme for visual styling |
| generated_by | TEXT | 'mom' | NOT NULL | 'mom', 'lila', 'template' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom full CRUD. All family members read.

### Table: `evolution_creatures`

Streak evolution creatures (one active per overlay instance at a time).

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NULL | NULL for family co-op creatures |
| overlay_instance_id | UUID | | NOT NULL | FK → overlay_instances |
| creature_variant_id | TEXT | | NOT NULL | Which creature from the theme |
| creature_name | TEXT | | NULL | Kid-named or auto-named |
| current_phase | INTEGER | 1 | NOT NULL | 1–5 |
| streak_days | INTEGER | 0 | NOT NULL | Consecutive days contributing |
| is_golden | BOOLEAN | true | NOT NULL | Starts true, set false on any pause/grace use |
| phase_history | JSONB | '{}' | NOT NULL | { 1: timestamp, 2: timestamp, ... } |
| status | TEXT | 'evolving' | NOT NULL | 'evolving', 'legendary', 'archived' |
| evolved_at | TIMESTAMPTZ | | NULL | When reached phase 5 |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom reads all. Members read own.

### Table: `passport_books`

Stamp passport instances.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NULL | NULL for family co-op passports |
| overlay_instance_id | UUID | | NOT NULL | FK → overlay_instances |
| title | TEXT | | NOT NULL | |
| pages | JSONB | '[]' | NOT NULL | Array of PassportPage objects |
| current_page | INTEGER | 1 | NOT NULL | |
| total_stamps_earned | INTEGER | 0 | NOT NULL | |
| status | TEXT | 'active' | NOT NULL | 'active', 'completed', 'archived' |
| generated_by | TEXT | 'mom' | NOT NULL | 'mom', 'lila', 'template' |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |
| updated_at | TIMESTAMPTZ | now() | NOT NULL | Auto-trigger |

**RLS Policy:** Family-scoped. Mom reads all. Members read own.

---

## Asset Additions to Visual Asset Manifest

### Boss Battle Images (Per Theme)

| Asset | Dimensions | Count per Theme | Format | Creation |
|-------|-----------|----------------|--------|----------|
| Mega boss (3 phases) | 512×512 | 3 | PNG transparent | 3×1 grid per theme |
| Mini bosses | 256×256 | 3 | PNG transparent | 3×1 grid per theme |
| Defeated state | — | — | — | CSS effect on mega boss (grayscale + trophy overlay) |
| **4 launch themes** | | **24 images** | | ~15 min pipeline |

### Streak Evolution Phase Strips (Per Theme)

| Asset | Dimensions | Count per Theme | Format | Creation |
|-------|-----------|----------------|--------|----------|
| Evolution strip (5 phases × ~4 variants) | 128×128 per phase | 20 per theme | PNG transparent | 5×4 grid → Image Cutter |
| Golden legendary variant | — | — | — | CSS gold shimmer overlay on phase 5 image |
| Evolution celebration animation | — | — | — | CSS flipbook cycling through 5 phase images |
| **4 launch themes** | | **80 phase images** | | ~20 min pipeline |

### Bingo & Passport Visual Elements

| Asset | Type | Count | Creation |
|-------|------|-------|----------|
| Bingo card themed backgrounds (per theme) | SVG/CSS | 4 | Code-built |
| Stamp icons (per theme) | 64×64 PNG | 8 per theme = 32 | 4×2 grid per theme |
| Passport page backgrounds (per theme) | SVG/CSS | 4 | Code-built |
| **Total** | | **32 stamp icons + 8 CSS** | ~10 min pipeline |

### Addendum Asset Grand Total

| Category | Count |
|----------|-------|
| Boss images | 24 |
| Evolution phase images | 80 |
| Stamp icons | 32 |
| Bingo/Passport CSS | 8 definitions |
| **Addendum total** | **136 images + 8 CSS** |
| **Combined with PRD-24A manifest** | **~369 image assets + ~125 CSS/animation defs** |

---

## Gamification Event Pipeline Impact

### Step 8 Extension for New Modes

The pipeline Step 8 from PRD-24A needs additional checks for the new modes:

```
8h. CHECK STREAK EVOLUTION (if overlay uses streak_evolution mode):
    - Is this the first task completion today?
    - If yes: increment evolution_creatures.streak_days
    - Check phase thresholds: does new streak_days cross a phase boundary?
    - If phase advanced: update current_phase, log in phase_history
    - If grace day was used or streak was paused: set is_golden = false
    - If phase 5 reached: trigger legendary celebration animation
      (CSS flipbook of all 5 phase images → gold burst → save to collection)

8i. CHECK BOSS/QUEST PROGRESS (if family has active boss_quest):
    - Decrement boss_quests.current_hp by contribution value
    - Update contributions for this member
    - Check phase thresholds: did HP cross a phase boundary?
    - If phase changed: update boss appearance on Family Hub
    - If HP reaches 0: trigger boss defeated celebration, set status = 'completed'

8j. CHECK BINGO (if family has active bingo_card):
    - For each bingo square: does this task completion satisfy any square's criteria?
    - If square completed: mark isComplete, record completedBy and completedAt
    - Check for new bingo lines (rows, columns, diagonals)
    - Check four corners and blackout
    - If new bingo: trigger celebration, unlock reward

8k. CHECK PASSPORT STAMPS (if overlay uses stamp_passport mode):
    - For each stamp on the current page: does this task completion advance any stamp's goal?
    - If stamp earned: mark isEarned, trigger stamp animation
    - If page complete: trigger page completion celebration, advance to next page
```

---

## Post-MVP Game Mode Roadmap

For reference, the full roadmap from the Gamification Themes & Modes Brainstorm:

### Solo Modes (8 remaining for post-MVP)

| Mode | Core Mechanic | Complexity |
|------|--------------|------------|
| Mystery Vault | Keys open randomized loot boxes | Medium |
| Habitat Builder | Place items into a visual scene | Medium |
| Daily Roulette | Daily rotating available items | Simple |
| Trading Post | Swap collectibles with siblings | Complex |
| Battle Deck | Build decks with stats for weekly battles | Complex |
| Expedition Map | Move along branching paths | Medium |
| Fusion Lab | Combine items to discover hybrids | Complex |
| Prestige Ladder | Reset and upgrade collection tiers | Complex |
| Seasonal Showcase | Curate displays for judged exhibitions | Simple |
| Daily Forecast | Respond to dynamic daily events | Medium |

### Co-Op Modes (5 remaining for post-MVP)

| Mode | Core Mechanic |
|------|--------------|
| Relay Chain | Alternating contributions build a chain |
| Tower Build | Shared construction with storm risk |
| Creature Caravan | Resource management on a shared journey |

> **Note:** Relay Chain, Tower Build, and Creature Caravan from the brainstorm are deferred. Trading Post, Battle Deck, and Fusion Lab are the most complex and are firmly post-MVP. Mystery Vault and Daily Roulette are the easiest post-MVP additions after the launch 7.

---

## Decisions Made in This Addendum

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **7 game modes at launch** (3 existing + 4 new). | Covers a broad range of motivation types: consistency (Streak Evolution), micro-goals (Stamp Passport), shared stakes (Boss Battle), accessible fun (Family Bingo). |
| 2 | **Boss Battle and Party Quest are one engine with two UI skins.** | Same underlying mechanic (shared target that decrements). Boss = HP bar visual. Quest = item checklist visual. One codebase, two experiences. |
| 3 | **Per-theme boss art** (16 boss images at launch for 4 themes). | Bosses should feel like they belong in the child's visual world. A pixel art boss for Pixel Loot, a dragon boss for Dragons. |
| 4 | **LiLa generates bingo cards and passport pages** with Human-in-the-Mix. | Mom shouldn't have to fill 25 squares from scratch. LiLa reads the family's actual task data and generates a balanced card. Mom edits and approves. |
| 5 | **Mom chooses bingo card duration** (week, biweekly, month, custom). | Different families have different paces. Weekly cards stay fresh. Monthly cards allow bigger goals. |
| 6 | **Streak Evolution uses pause-not-reset.** | Missing a day pauses evolution, doesn't destroy it. Golden evolution bonus rewards unbroken streaks without punishing breaks. Celebration-only philosophy. |
| 7 | **Evolution celebration plays all 5 phases as a flipbook animation** when a creature reaches legendary. | The grid-sliced phase images double as animation frames. Zero extra asset work. Maximum emotional payoff. |
| 8 | **Boss battles framed positively for younger themes.** | Pets theme: "rescue the lost mega-puppy" not "fight." Dragons: "prove worthy to the elder" not "slay." Celebration-only extends to narrative framing. |

---

*End of PRD-24A Game Modes Addendum*
