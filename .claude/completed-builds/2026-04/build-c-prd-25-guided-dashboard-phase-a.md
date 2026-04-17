# Build C: PRD-25 Guided Dashboard (Phase A)

### PRD Files
- `prds/dashboards/PRD-25-Guided-Dashboard.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-25-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-25-Guided-Dashboard.md`

### Build Spec
`specs/PRD-25-Phase-A-Guided-Dashboard-Core-Spec.md` — Founder-provided implementation spec covering all Phase A build items.

---

### Pre-Build Summary

#### Context
Guided Dashboard is the dashboard experience for children aged 8-12 in the Guided shell. Currently, Guided members see the same Dashboard.tsx wrapped in GuidedShell, which provides a custom bottom nav and simplified header. PRD-25 replaces this with a purpose-built GuidedDashboard with 7 sections, the Next Best Thing suggestion engine, Best Intentions for Guided members, and Mom's Dashboard Management screen.

GuidedShell already exists (`src/components/shells/GuidedShell.tsx`) with its own custom bottom nav (hardcoded navItems, NOT using shared BottomNav.tsx). The shell wraps all Guided member pages including `/dashboard`.

#### Dependencies Already Built
- GuidedShell with custom bottom nav (PRD-04)
- Dashboard.tsx with data-driven section system via dashboard_configs.layout.sections (PRD-14)
- Best Intentions hooks: useBestIntentions with full CRUD + useLogIteration (PRD-06)
- Tasks hooks: useTasks with 12 view formats, useCompleteTask (PRD-09A)
- CalendarWidget (PRD-14B) — needs memberIds filter for self-only view
- DashboardGrid with canReorderOnly prop (PRD-10)
- Widget Picker + Configuration modals (PRD-10)
- FamilyMembers.tsx with dashboard_mode selector (PRD-22)
- Edge Function shared utilities: _shared/cors.ts, _shared/auth.ts, _shared/cost-logger.ts
- useActedBy hook for write attribution (PRD-14)
- useGuidingStars hook for greeting rotation (PRD-06)

#### Dependencies NOT Yet Built
- spelling_coaching_cache table (Phase A creates table, Phase B uses it)
- GuidedDashboard page component (new)
- NBT engine (new frontend computation)
- guided-nbt-glaze Edge Function (new)
- GuidedManagementScreen (new)
- Reading Support CSS infrastructure (new)

#### Build Items (Phase A — 12 items)

**1. Migration 00000000100077**
- `spelling_coaching_cache` table — global cache for spelling coaching explanations (Phase B usage)
- Verify best_intentions + intention_iterations have all needed columns (ADD COLUMN IF NOT EXISTS for safety)
- Feature keys: `guided_dashboard`, `guided_nbt`, `guided_best_intentions`, `guided_reading_support`, `guided_spelling_coaching`, `guided_reflections`, `guided_write_drawer`

**2. TypeScript types**
- `src/types/guided-dashboard.ts` — GuidedDashboardPreferences, GuidedSectionKey, NBTSuggestion, section defaults

**3. Hooks**
- `useGuidedDashboardConfig` — wraps dashboard_configs with Guided-specific defaults
- `useNBTEngine` — 7-level deterministic priority engine from task/intention data
- `useNBTGlaze` — calls guided-nbt-glaze Edge Function with session caching
- `useGuidedBestIntentions` — personal + family intentions for Guided member

**4. Section components (7)**
- GuidedGreetingSection — name + time greeting + Guiding Stars rotation + gamification indicators
- GuidedBestIntentionsSection — personal + family intentions, tap-to-celebrate, child creation
- NextBestThingCard — current suggestion + AI glaze + [Do This] + [Something Else]
- GuidedCalendarSection — self-only CalendarWidget in day view
- GuidedActiveTasksSection — Simple List / Now-Next-Optional, celebration animation
- GuidedWidgetGrid — canReorderOnly, no resize/delete/create
- CelebrateSection — stub with PlannedExpansionCard (PRD-11 dependency)

**5. GuidedDashboard page**
- Conditional render inside Dashboard.tsx when dashboard_mode='guided'
- Section renderer from dashboard_configs.layout.sections with Guided defaults
- Reading Support CSS class toggle

**6. GuidedShell bottom nav rename**
- Change "Journal" → "Write" in GuidedShell.tsx navItems array
- Phase A: still routes to `/journal`. Phase B: triggers Write drawer.

**7. GuidedManagementScreen**
- Section reorder/visibility (Greeting + NBT + Best Intentions unhideable)
- Feature toggles: Reading Support, Spelling Coaching
- Best Intentions CRUD for child
- child_can_create_best_intentions toggle
- Wire into FamilyMembers.tsx as "Manage Dashboard" button for guided members

**8. Edge Function: guided-nbt-glaze**
- Haiku-class model, authenticated, generates 10-20 word encouraging sentence
- Uses _shared/ utilities pattern
- Fallback: "Up next: [task title]"

**9. Reading Support CSS infrastructure**
- `.guided-reading-support` class with larger font + TTS icon visibility
- TTS via browser speechSynthesis API
- Speaker icons (Volume2) hidden by default, shown when enabled

**10. TypeScript check**
- `tsc -b` — zero errors before declaring complete

### Stubs (NOT Building Phase A)
- Write drawer (3 tabs: Notepad, Messages, Reflections) — Phase B
- Spelling & Grammar Coaching UI — Phase B
- DailyCelebration Reflections step — Phase C (PRD-11 dependency)
- LiLa Homework Help modal — Future (PRD-05 guided modes)
- LiLa Communication Coach modal — Future (PRD-05 guided modes)
- Victory Recorder integration — Future (PRD-11)
- Visual World theme skinning — Future (PRD-24A)
- Gamification pipeline — Future (PRD-24)
- Before-send message coaching — Future (PRD-15)
- Graduation flow (Guided → Independent) — Post-MVP

### Key Decisions
1. **No separate route** — GuidedDashboard renders conditionally inside Dashboard.tsx based on dashboard_mode='guided'
2. **GuidedShell's own bottom nav modified directly** — not shared BottomNav.tsx
3. **Reuse existing useBestIntentions** — no new hooks for personal intentions
4. **NBT is frontend-only computation** — no database table, no server logic
5. **Gamification indicators are visual stubs** — read from family_members columns
6. **Reading Support is CSS-only** — no backend, uses browser speechSynthesis
7. **spelling_coaching_cache table created but unused in Phase A**
8. **Management screen in FamilyMembers.tsx** — opens as modal for guided members
9. **Unhideable sections: Greeting, Next Best Thing, Best Intentions** — mom cannot hide these

---

