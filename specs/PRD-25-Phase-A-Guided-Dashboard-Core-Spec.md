# PRD-25 Phase A: Guided Dashboard Core + Shell Upgrade — Implementation Spec

> **Status:** Ready for Claude Code session
> **Source PRD:** prds/dashboards/PRD-25-Guided-Dashboard.md
> **Dependencies Built:** PRD-04 (Shell/GuidedLayout), PRD-06 (Guiding Stars/Best Intentions), PRD-09A (Tasks), PRD-10 (Widgets), PRD-14 (Dashboard architecture), PRD-14B (Calendar)
> **Created:** April 1, 2026

---

## Scope — What Phase A Builds

Phase A delivers the core Guided Dashboard experience: the dashboard page with all sections, the Next Best Thing engine, Best Intentions for Guided members, the shell upgrade (bottom nav rename, Write drawer trigger), and Mom's management screen wired into Settings. This is the largest of the three planned phases.

### In Scope
1. GuidedShell bottom nav upgrade: "Journal" → "Write" (triggers drawer in Phase B; for now routes to `/journal`)
2. GuidedDashboard page with 7 sections: Greeting, Best Intentions, Next Best Thing, Calendar, Active Tasks ("My Tasks"), Widget Grid, Celebrate
3. Section ordering from `dashboard_configs.layout.sections` with Guided-specific defaults
4. Section visibility rules (Greeting + Next Best Thing + Best Intentions cannot be hidden by mom)
5. Guided member can reorder widgets but NOT sections, cannot resize/delete/create widgets
6. Next Best Thing engine — 7-level deterministic priority, [Do This] navigation, [Something Else] cycling
7. NBT AI glaze Edge Function (`guided-nbt-glaze`) with fallback text
8. Best Intentions section for Guided members — personal + family intentions, tap-to-celebrate
9. Child self-creation of Best Intentions (permission-gated by mom) with coaching helper text
10. Gamification indicators in header (stubs — display points + streak from `family_members` columns, hidden when gamification disabled)
11. Task completion celebration animation (gentle scale + color pulse)
12. Reading Support CSS infrastructure (toggle applies class, larger font + icon pairing ready)
13. `useCanAccess()` hooks for all 7 feature keys (return true during beta)
14. RLS policies for Guided member dashboard access
15. Empty state handling (no tasks, no suggestions, no intentions)
16. Mom's Dashboard Management screen (Settings → Family Management → member → Manage Dashboard)
17. Migration for preferences JSONB keys, section key constants, and spelling_coaching_cache table
18. Edge Function: `guided-nbt-glaze`

### Out of Scope (Phase B)
- Write drawer component (3 tabs: Notepad, Messages, Reflections)
- Spelling & Grammar Coaching (lookup table + AI fallback)
- "Homework" routing destination in Send To grid
- `entry_category` field on journal_entries

### Out of Scope (Phase C or Later)
- LiLa Homework Help modal (needs PRD-05 guided modes)
- LiLa Communication Coach modal (needs PRD-05 guided modes)
- DailyCelebration Reflections step (needs PRD-11)
- Messages tab real data (needs PRD-15)
- Visual World theme skinning (needs PRD-24A)
- Gamification widgets in grid + real point/streak data (needs PRD-24)
- Before-send message coaching (needs PRD-15)
- Graduation flow (Guided → Independent) — Post-MVP

---

## Pre-Build Verification

Before writing any code, Claude Code MUST run these checks:

```bash
# 1. Verify GuidedShell exists and understand current structure
mgrep "GuidedShell\|GuidedLayout" src/ --include="*.tsx" --include="*.ts"

# 2. Verify dashboard_configs table and current preferences structure
mgrep "dashboard_configs" src/ --include="*.ts" --include="*.tsx"

# 3. Verify best_intentions table live columns
mgrep "best_intentions\|intention_iterations" src/ --include="*.ts" --include="*.tsx"

# 4. Check bottom nav current implementation
mgrep "BottomNav\|bottomNav\|bottom-nav" src/ --include="*.tsx"

# 5. Check existing Best Intentions components
mgrep "BestIntention" src/ --include="*.tsx" --include="*.ts"

# 6. Check current section rendering on Dashboard
mgrep "SectionRenderer\|dashboard_section\|section_key\|sectionKey" src/ --include="*.tsx" --include="*.ts"

# 7. Check current tasks hooks for NBT data needs
mgrep "useTasks\|useAssignedTasks\|task_assignments" src/ --include="*.ts"

# 8. Verify live schema columns on best_intentions and journal_entries
cat claude/live_schema.md | grep -A 30 "best_intentions"
cat claude/live_schema.md | grep -A 30 "journal_entries"

# 9. Check Edge Function patterns (shared utils)
ls supabase/functions/
cat supabase/functions/_shared/ -R 2>/dev/null || echo "Check shared utils location"

# 10. TypeScript check
npx tsc --noEmit 2>&1 | tail -5
```

---

## Database Migration

**Migration number:** Next sequential (check latest in `supabase/migrations/`)

### Part 1: dashboard_configs preferences extension

The `preferences` JSONB column on `dashboard_configs` already exists. PRD-25 adds 10 new keys. No schema change needed — these are JSONB keys consumed by the frontend. Document the expected shape in types.

### Part 2: Section key constants

New section keys for Guided Dashboard: `'next_best_thing'`, `'celebrate'`, `'best_intentions'`. These are string constants in frontend code, not database enums. No migration needed — just TypeScript constants.

### Part 3: spelling_coaching_cache table (global)

```sql
-- Global spelling coaching cache — grows as AI generates explanations for new words
CREATE TABLE IF NOT EXISTS spelling_coaching_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  misspelling TEXT NOT NULL,
  correction TEXT NOT NULL,
  explanation TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai_generated' CHECK (source IN ('seed_data', 'ai_generated')),
  language TEXT NOT NULL DEFAULT 'en',
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint on misspelling+language to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_scc_misspelling_lang 
  ON spelling_coaching_cache (lower(misspelling), language);

-- Index for lookup performance
CREATE INDEX IF NOT EXISTS idx_scc_correction 
  ON spelling_coaching_cache (lower(correction));

-- RLS: public read (all users benefit), only service_role writes (Edge Function)
ALTER TABLE spelling_coaching_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read spelling cache"
  ON spelling_coaching_cache FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies for anon/authenticated — 
-- only the Edge Function (service_role) writes to this table

-- Trigger for updated_at
CREATE TRIGGER set_spelling_coaching_cache_updated_at
  BEFORE UPDATE ON spelling_coaching_cache
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### Part 4: Guided dashboard preferences defaults

No separate migration needed. When a Guided member's dashboard_configs row is created (or first loaded), the frontend applies Guided-specific defaults to the `preferences` JSONB if the keys don't exist yet. This is a frontend concern using a `getGuidedDefaults()` utility.

### Part 5: Verify best_intentions table has needed columns

The live schema audit (CORRECTED_DATABASE_SCHEMA.md) flagged many missing columns on `best_intentions`. The migration must add any missing columns:

```sql
-- Add missing columns to best_intentions if they don't exist
-- Check live_schema.md output to determine which are actually missing
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS source_reference_id UUID;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS related_member_ids UUID[];
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS tracker_style TEXT NOT NULL DEFAULT 'counter';
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS is_shared_with_partner BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE best_intentions ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Add missing columns to intention_iterations if needed
ALTER TABLE intention_iterations ADD COLUMN IF NOT EXISTS family_id UUID;
ALTER TABLE intention_iterations ADD COLUMN IF NOT EXISTS member_id UUID;
ALTER TABLE intention_iterations ADD COLUMN IF NOT EXISTS recorded_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE intention_iterations ADD COLUMN IF NOT EXISTS day_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_bi_active_member 
  ON best_intentions (family_id, owner_member_id, is_active, archived_at);
CREATE INDEX IF NOT EXISTS idx_bi_context 
  ON best_intentions (family_id, is_included_in_ai, is_active, archived_at);
CREATE INDEX IF NOT EXISTS idx_ii_daily 
  ON intention_iterations (intention_id, day_date);
CREATE INDEX IF NOT EXISTS idx_ii_member_daily 
  ON intention_iterations (member_id, day_date);
```

**IMPORTANT:** Claude Code must check `claude/live_schema.md` first to see which columns already exist. Only add what's actually missing. Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for safety.

### Part 6: Guided-specific dashboard_configs preferences key for Best Intentions child creation permission

This is a JSONB key, not a column. Added to the preferences object:
```json
{
  "child_can_create_best_intentions": false
}
```

Mom toggles this in the Management screen. Default: false (mom creates for child).

---

## TypeScript Types

### GuidedDashboardPreferences

```typescript
// src/types/guided-dashboard.ts

export interface GuidedDashboardPreferences {
  // Reading Support
  reading_support_enabled: boolean;           // default: false
  // Spelling & Grammar Coaching
  spelling_coaching_enabled: boolean;          // default: true
  // Reflections (Phase B)
  reflections_in_drawer: boolean;             // default: false
  reflections_in_celebration: boolean;         // default: false
  reflection_prompts: number[];               // default: [28, 29, 30, 31, 32]
  reflection_custom_prompts: Array<{ id: string; text: string }>;  // default: []
  reflection_daily_count: number;             // default: 1
  // Next Best Thing
  nbt_last_suggestion_index: number;          // default: 0 (reset daily)
  // Graduation (Post-MVP)
  graduation_tutorial_completed: boolean;     // default: false
  // Task view
  guided_task_view_default: 'simple_list' | 'now_next_optional';  // default: 'simple_list'
  // Best Intentions
  child_can_create_best_intentions: boolean;  // default: false
  // LiLa tools (future)
  lila_homework_enabled: boolean;             // default: false
  lila_communication_coach_enabled: boolean;  // default: false
}

export const GUIDED_PREFERENCES_DEFAULTS: GuidedDashboardPreferences = {
  reading_support_enabled: false,
  spelling_coaching_enabled: true,
  reflections_in_drawer: false,
  reflections_in_celebration: false,
  reflection_prompts: [28, 29, 30, 31, 32],
  reflection_custom_prompts: [],
  reflection_daily_count: 1,
  nbt_last_suggestion_index: 0,
  graduation_tutorial_completed: false,
  guided_task_view_default: 'simple_list',
  child_can_create_best_intentions: false,
  lila_homework_enabled: false,
  lila_communication_coach_enabled: false,
};
```

### Guided Section Keys

```typescript
// Extend existing section key constants
export const GUIDED_SECTION_KEYS = [
  'greeting',
  'best_intentions',
  'next_best_thing',
  'calendar',
  'active_tasks',
  'widget_grid',
  'celebrate',
] as const;

export type GuidedSectionKey = typeof GUIDED_SECTION_KEYS[number];

// Sections that mom cannot hide
export const GUIDED_UNHIDEABLE_SECTIONS: GuidedSectionKey[] = [
  'greeting',
  'next_best_thing',
  'best_intentions',
];

// Default section order for new Guided dashboards
export const GUIDED_DEFAULT_SECTIONS = GUIDED_SECTION_KEYS.map((key, i) => ({
  key,
  visible: true,
  collapsed: false,
  order: i,
}));
```

### NBT Suggestion Types

```typescript
export interface NBTSuggestion {
  id: string;
  type: 'overdue_task' | 'active_routine' | 'time_block' | 'mom_priority' | 'next_due' | 'opportunity' | 'unscheduled' | 'best_intention';
  title: string;
  subtitle?: string;         // e.g., "Due 2 hours ago" or "Worth 15 stars"
  aiGlaze?: string;          // AI-generated encouraging one-liner
  navigateTo?: string;       // route to navigate on [Do This]
  entityId?: string;         // task_id, intention_id, etc.
  entityType?: 'task' | 'routine' | 'opportunity' | 'intention';
  pointValue?: number;       // gamification points (hidden when gamification disabled)
}
```

---

## Component Architecture

### Page: GuidedDashboard

```
src/pages/GuidedDashboard.tsx
├── Uses: useGuidedDashboardConfig() — loads/creates dashboard_configs for this Guided member
├── Uses: useNBTEngine() — computes suggestions
├── Uses: useBestIntentions() — loads personal + family intentions
├── Renders sections in order from dashboard_configs.layout.sections:
│
├── GuidedGreetingSection
│   ├── Member name + time-of-day greeting
│   ├── Guiding Stars rotation (reuse existing useGuidingStars hook)
│   └── Gamification indicators (points + streak) — stub display from family_members columns
│
├── GuidedBestIntentionsSection
│   ├── Active personal intentions (1-3, tap-to-celebrate)
│   ├── Family intentions with "family" badge (tap-to-celebrate)
│   ├── [+ Add] button (visible only when child_can_create_best_intentions = true)
│   │   └── Inline add form with coaching helper text
│   └── Empty state: "Your mom hasn't set any Best Intentions for you yet"
│
├── NextBestThingCard
│   ├── Current suggestion with AI glaze text
│   ├── [Do This] button → navigates to task/routine/opportunity
│   ├── [Something Else] button → cycles to next suggestion with slide animation
│   ├── Empty state: "Nothing on the list right now. Enjoy your free time!"
│   └── Loading state while AI glaze fetches
│
├── GuidedCalendarSection
│   ├── Collapsible, reuses calendar display component from PRD-14B
│   ├── Self-only filter (Guided members see only their own events)
│   └── Default view: day view showing today's events
│
├── GuidedActiveTasksSection ("My Tasks")
│   ├── Two view options: Simple List (default) | Now/Next/Optional
│   ├── Each task: checkbox + title + point value (if gamification enabled)
│   ├── Opportunities below "Opportunities" divider in Now/Next/Optional view
│   ├── Task completion → celebration animation + gamification pipeline trigger
│   ├── Routine tasks expand to show step progress on tap
│   └── Section collapse + "Waiting for Mom" state for approval-required tasks
│
├── GuidedWidgetGrid
│   ├── Reuses PRD-10 widget grid infrastructure
│   ├── Guided permissions: reorder only, no resize/delete/create
│   └── Mom-assigned widgets render normally
│
└── CelebrateSection
    ├── Big [Celebrate!] button
    └── Stub → PlannedExpansionCard until PRD-11 (Victory Recorder) is built
```

### Hook: useNBTEngine

```typescript
// src/hooks/useNBTEngine.ts

interface UseNBTEngineReturn {
  suggestions: NBTSuggestion[];
  currentIndex: number;
  currentSuggestion: NBTSuggestion | null;
  advance: () => void;       // [Something Else]
  isLoading: boolean;
  isEmpty: boolean;
}

// Priority order (deterministic):
// 1. Overdue tasks — any task past its due date/time
// 2. Active routine in progress — started but not completed
// 3. Current time-block task — scheduled time matches now (±15 min window)
// 4. Mom-prioritized tasks — importance_level = critical_1 or priority flagged
// 5. Next due task — earliest due date/time not yet started
// 6. Available opportunities — claimable, sorted by point value (highest first)
// 7. Unscheduled tasks — remaining assigned, sorted by mom's priority or creation order
// 8. Best Intention reminder — "Remember to practice [intention]!" (gentle nudge, lowest priority)
//
// The engine computes the full ordered list once per dashboard load.
// advance() increments currentIndex. When all shown, wraps to 0.
// nbt_last_suggestion_index persists to preferences (reset daily at midnight).
```

### Hook: useNBTGlaze

```typescript
// src/hooks/useNBTGlaze.ts

// Calls the guided-nbt-glaze Edge Function for the current suggestion.
// Caches results per suggestion ID per session (Map in memory).
// Returns { glazeText, isLoading, error }.
// On error, returns null — the component falls back to "Up next: [task title]".
```

### Hook: useGuidedDashboardConfig

```typescript
// src/hooks/useGuidedDashboardConfig.ts

// Wraps the existing dashboard_configs query with Guided-specific defaults.
// On first load for a Guided member, if no dashboard_configs row exists:
//   - Creates one with dashboard_type = 'personal'
//   - Sets layout.sections = GUIDED_DEFAULT_SECTIONS
//   - Sets preferences = GUIDED_PREFERENCES_DEFAULTS
// Returns { config, preferences, sections, updatePreference, updateSectionOrder }
```

### Component: GuidedBestIntentionsSection

```typescript
// src/components/guided/GuidedBestIntentionsSection.tsx

// Displays active Best Intentions for this Guided member.
// Two sources:
//   1. Personal intentions: best_intentions WHERE owner_member_id = this member AND is_active AND NOT archived
//   2. Family intentions: family_best_intentions from PRD-14D (if Family Hub is built)
//      — OR: best_intentions WHERE related_member_ids @> ARRAY[this_member_id]
//         (mom creates intention "for" this child by including them in related_member_ids)
//
// Tap-to-celebrate: creates intention_iterations record, triggers confetti animation,
// increments displayed count. Uses existing BestIntentions celebration pattern.
//
// Child creation (when child_can_create_best_intentions = true):
//   [+ Add] button opens inline form with:
//   - Text input for intention title
//   - Helper text below input:
//     "Write something you want to DO more of.
//      Instead of 'Stop being mean,' try 'Use kind words.'
//      What do you want to practice?"
//   - [Save] and [Cancel] buttons
//   - Saves with source = 'manual', owner_member_id = child's ID
//   - Mom can see and archive from Management screen
```

---

## Mom's Dashboard Management Screen

### Location

Settings → Family Management → select Guided member → **"Manage Dashboard"** button

This button appears on PRD-22 Screen 3A (Member Detail) ONLY when the member's `dashboard_mode = 'guided'`.

### Screen Layout

```
+---------------------------------------------+
|  <- [Name]'s Dashboard                       |
|  -------------------------------------------  |
|                                             |
|  SECTIONS                                   |
|  Drag to reorder. Some sections cannot      |
|  be hidden.                                 |
|                                             |
|  = Greeting              [locked]           |
|  = Best Intentions       [locked]           |
|  = Next Best Thing       [locked]           |
|  = Calendar              [eye]              |
|  = My Tasks              [eye]              |
|  = Widgets               [eye]              |
|  = Celebrate             [eye]              |
|                                             |
|  -------------------------------------------  |
|  SECTION SETTINGS                           |
|                                             |
|  Calendar                                   |
|    Default view: [Day v]                    |
|                                             |
|  My Tasks                                   |
|    Default view: [Simple List v]            |
|                                             |
|  Widgets                                    |
|    [Manage Widgets ->]                      |
|                                             |
|  -------------------------------------------  |
|  FEATURES                                   |
|                                             |
|  Reading Support               [OFF]        |
|  Adds read-aloud icons, larger text,        |
|  and icon labels.                           |
|                                             |
|  Spelling Coaching             [ON]         |
|  Brief teaching explanations with           |
|  spell check corrections.                   |
|                                             |
|  -------------------------------------------  |
|  BEST INTENTIONS                            |
|                                             |
|  Allow [Name] to create own    [OFF]        |
|  [Name] can add their own Best              |
|  Intentions. You can see and manage         |
|  everything they create.                    |
|                                             |
|  [Name]'s Intentions:                       |
|  - Use kind words        [edit] [del]       |
|  - Practice patience     [edit] [del]       |
|  [+ Add Intention for [Name]]              |
|                                             |
|  -------------------------------------------  |
|  REFLECTIONS (Phase B stub)     [OFF]       |
|                                             |
|  -------------------------------------------  |
|  LILA TOOLS (future stubs)                  |
|                                             |
|  Homework Help                  [OFF]       |
|  Coming soon                                |
|                                             |
|  Communication Coach            [OFF]       |
|  Coming soon                                |
|                                             |
+---------------------------------------------+
```

### Data Writes

- Section reorder/visibility -> `dashboard_configs.layout.sections`
- Feature toggles -> `dashboard_configs.preferences` (reading_support_enabled, spelling_coaching_enabled, etc.)
- Best Intentions CRUD -> `best_intentions` table (mom creates with owner_member_id = child)
- Child creation permission -> `dashboard_configs.preferences.child_can_create_best_intentions`

---

## Edge Function: guided-nbt-glaze

### Location
`supabase/functions/guided-nbt-glaze/index.ts`

### Pattern
Follows shared utils pattern from existing Edge Functions:
- Import from `_shared/cors.ts`, `_shared/auth.ts`, `_shared/cost-logger.ts`
- Uses Haiku-class model (claude-3-5-haiku or equivalent fast/cheap model)
- Authenticated (requires valid JWT)

### Request
```typescript
{
  taskTitle: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  memberName: string;
  streakCount: number;
  currencyName?: string;  // gamification currency name, if enabled
  suggestionType: string; // 'overdue_task' | 'active_routine' | etc.
  pointValue?: number;    // if gamification enabled
}
```

### Response
```typescript
{
  glazeText: string;  // 10-20 word encouraging one-liner
}
```

### System Prompt
```
You generate one encouraging sentence (10-20 words) for a child's dashboard.
Connect the suggestion to the context provided. Be warm, specific, and brief.
Never be generic ("Great job!" is forbidden). Always connect to something concrete.
Examples:
- "Math first thing — you've done 12 days in a row!"
- "Reading time! Pick up where you left off yesterday."
- "Dinner prep is worth 15 stars — the biggest reward today!"
Respond with ONLY the sentence. No quotes, no explanation.
```

### Cost Logging
Use existing `cost-logger.ts` with feature: `'guided_nbt_glaze'`.

---

## Reading Support CSS Infrastructure

When `reading_support_enabled = true`, add a CSS class to the GuidedDashboard container:

```css
.guided-reading-support {
  /* Increase base font by 2 steps */
  --guided-font-scale: 1.25;
  font-size: calc(var(--font-size-base) * var(--guided-font-scale));
}

.guided-reading-support .reading-support-tts {
  /* Show TTS speaker icons (hidden by default) */
  display: inline-flex;
}

.guided-reading-support .voice-input-prominent {
  /* Make mic button larger */
  transform: scale(1.3);
}
```

The actual TTS functionality uses the device's native `speechSynthesis` API:
```typescript
const speak = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // slightly slower for kids
    window.speechSynthesis.speak(utterance);
  }
};
```

Speaker icons (Lucide `Volume2`) appear next to: task titles, calendar event names, section headers, NBT suggestion text, Best Intention titles, widget labels, and navigation labels.

---

## Gamification Stub Approach

PRD-24 (Gamification) is not built yet. For Phase A:

- **Header indicators** read from `family_members.gamification_points` and `family_members.current_streak` (columns already exist in live schema)
- Display: star icon + points count, fire icon + streak count
- Hidden entirely when gamification is disabled (check `dashboard_configs.preferences` or a future gamification toggle — for now, show them since columns have data)
- **Task point values** shown as star + N next to task titles — read from `tasks.points_value` if it exists, otherwise hidden
- **Task completion animation:** CSS animation on checkbox — gentle scale up (1.0 -> 1.15 -> 1.0) with a brief color pulse using `var(--color-accent-warm)`
- **No gamification pipeline integration** — just visual feedback for now

---

## View As Support

Mom's View As (PRD-02/PRD-14) must work with the Guided Dashboard:

- When mom activates View As for a Guided member, the GuidedDashboard page renders with that member's data
- The existing `useViewAs()` hook + `displayMember` pattern from Dashboard.tsx applies
- ViewAsBanner renders at the top (existing infrastructure)
- Mom sees the full dashboard as the child would see it
- Mom CAN interact (mark tasks, tap celebrate) — actions record with `acted_by` attribution (PRD-14 useActedBy hook)

---

## File Inventory (Expected)

### New Files
```
src/pages/GuidedDashboard.tsx
src/components/guided/GuidedGreetingSection.tsx
src/components/guided/GuidedBestIntentionsSection.tsx
src/components/guided/NextBestThingCard.tsx
src/components/guided/GuidedCalendarSection.tsx
src/components/guided/GuidedActiveTasksSection.tsx
src/components/guided/GuidedWidgetGrid.tsx
src/components/guided/CelebrateSection.tsx
src/components/guided/GuidedManagementScreen.tsx
src/hooks/useNBTEngine.ts
src/hooks/useNBTGlaze.ts
src/hooks/useGuidedDashboardConfig.ts
src/hooks/useGuidedBestIntentions.ts
src/types/guided-dashboard.ts
src/data/spelling-coaching-seed.json          (seed data for Phase B, can create now)
supabase/functions/guided-nbt-glaze/index.ts
supabase/migrations/00000000100XXX_prd25_guided_dashboard.sql
```

### Modified Files
```
src/components/shell/GuidedShell.tsx          (bottom nav "Journal" -> "Write")
src/components/shell/BottomNav.tsx            (if shared component, update label)
src/pages/Dashboard.tsx                       (route Guided members to GuidedDashboard)
src/App.tsx                                   (add /guided-dashboard route if needed, or handle via shell routing)
src/types/widgets.ts                          (extend section key types)
src/components/settings/FamilyMemberDetail.tsx (add "Manage Dashboard" button for Guided members)
```

---

## Conventions & Patterns to Follow

1. **Semantic color tokens only** — no hardcoded colors or gradients
2. **Lucide icons** throughout (Guided shell, not Play)
3. **Per-page density classes** preserved — use existing density system
4. **ModalV2** for any modals (not legacy Modal)
5. **Optimistic UI** for tap-to-celebrate on Best Intentions
6. **TransparencyIndicator** on sections where content is visible to mom
7. **FeatureGuide** component for first-time feature discovery
8. **Plain-language UI copy** — no jargon. "My Tasks" not "Active Tasks." "Next Best Thing" not "Priority Engine."
9. **Assignment Mode** convention: for Best Intentions, each member has their own iterations (like "each" mode)
10. **`tsc --noEmit`** pre-deployment check

---

## Testing Checklist

After build, verify:

- [ ] Guided member sees GuidedDashboard (not adult Dashboard) when logged in
- [ ] All 7 sections render in correct default order
- [ ] Greeting shows member name + time-of-day + Guiding Stars rotation (if entries exist)
- [ ] Best Intentions section shows active personal intentions with tap-to-celebrate
- [ ] Best Intentions tap creates intention_iterations record and shows confetti
- [ ] Best Intentions [+ Add] button hidden when child_can_create_best_intentions = false
- [ ] Best Intentions [+ Add] shows coaching helper text when enabled
- [ ] Best Intentions family intentions show with "family" badge
- [ ] NBT card shows first suggestion from priority-ordered list
- [ ] NBT [Do This] navigates to correct task/routine/opportunity
- [ ] NBT [Something Else] cycles with slide animation
- [ ] NBT AI glaze text appears (or fallback "Up next: [title]" on error)
- [ ] NBT empty state shows when no tasks assigned
- [ ] Calendar section shows self-only events in day view
- [ ] Active Tasks ("My Tasks") shows today's assigned tasks
- [ ] Simple List is default view; Now/Next/Optional toggle works
- [ ] Task checkbox completion triggers celebration animation
- [ ] Widget grid renders mom-assigned widgets
- [ ] Guided member can drag-reorder widgets but not resize/delete/create
- [ ] Celebrate button renders (stub/PlannedExpansionCard)
- [ ] Gamification indicators show in header (from family_members columns)
- [ ] Section collapse works on all collapsible sections
- [ ] Mom cannot hide Greeting, Next Best Thing, or Best Intentions via management screen
- [ ] Mom CAN hide Calendar, My Tasks, Widgets, Celebrate
- [ ] Mom can reorder all sections via drag-and-drop in management screen
- [ ] Mom can create/edit/archive Best Intentions for child in management screen
- [ ] Mom can toggle child_can_create_best_intentions
- [ ] Feature toggles (Reading Support, Spelling Coaching) save to preferences
- [ ] Reading Support toggle adds CSS class with larger font + TTS icons visible
- [ ] "Manage Dashboard" button appears on Member Detail for Guided members only
- [ ] View As shows GuidedDashboard for Guided member
- [ ] Empty states render correctly for all sections
- [ ] Mobile responsive (bottom nav, full-width sections)
- [ ] Zero TypeScript errors (`tsc --noEmit`)

---

*End of PRD-25 Phase A Implementation Spec*
