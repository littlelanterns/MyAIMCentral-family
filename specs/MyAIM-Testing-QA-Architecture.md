# MyAIM Family: Testing & QA Architecture
## Four-Layer Quality Assurance Strategy

**Purpose:** This document defines the complete testing strategy for MyAIM Family v2 — from automated tests that run every build to human testing before beta. It covers what gets tested, when, how, and by whom. It also provides the specific Opus audit instructions for generating test infrastructure and QA checkpoints during the Step 1 PRD Consistency Audit.

**When to use:** Reference during the Pre-Build Setup Checklist (Step 1 audit and Step 4 scaffolding), during every build phase (Layer 1 tests), at milestone builds (Layers 2 and 3), and before beta (all layers).

**Relationship to other docs:** This supplements the Pre-Build Setup Checklist, the Build Prompt Template, and the PRD Audit Readiness Addendum. It does not replace them — it adds the testing dimension they currently reference but don't fully specify.

---

## The Four Layers

| Layer | What | When | Who/What Runs It | Catches |
|-------|------|------|-----------------|---------|
| **Layer 1: TDD Test Suite** | Automated tests generated from PRDs, grown every build | Every build phase | Claude Code (Vitest + Supabase test helpers) | Regressions, permission violations, routing errors, convention drift, wiring breaks |
| **Layer 2: Playwright Integration Tests** | Real browser tests as each role, navigating features, verifying UI | Milestone builds (every 5-8 phases) | Claude Code runs Playwright | Permission gates in live UI, navigation flow breaks, shell rendering, responsive behavior, accessibility |
| **Layer 3: Agent Teams QA** | AI agents roleplaying each shell, cross-checking wiring and logic | Major milestones (3-4 times during build) | Claude Code Agent Teams (experimental) | Subtle integration issues, cross-shell inconsistencies, logic gaps automated tests miss |
| **Layer 4: Human Testing** | Tenise testing in browser | Before beta + ongoing | Human | UX feel, theme aesthetics, vibe judgment, "would a mom understand this," flow quality |

**The TDD principle that binds them:** Tests are written *before or alongside* the code, not after. The Opus audit generates the foundational test suite from PRDs before any application code exists. Each build phase adds tests for its features as part of implementation, not as a cleanup step. The test is the spec expressed as code.

---

## Layer 1: TDD Test Suite

### Philosophy

Every architectural decision that can be expressed as a verifiable assertion becomes a test. These tests are the immune system of the codebase — they prevent Claude Code from accidentally breaking established patterns, even in long sessions where context can drift.

**Framework:** Vitest (already compatible with Vite + React 19 + TypeScript stack). Supabase test helpers for RLS verification. Custom lint rules for convention enforcement.

**Location:** `src/__tests__/` for unit/integration tests, `tests/` at project root for RLS and convention tests.

### Test Categories

#### Category 1: Shell Routing Tests

**Source:** PRD-04 shell routing table + `getShellForMember()` specification.

**What they assert:** Every combination of `role` + `dashboard_mode` routes to the correct shell and layout component.

```
Tests generated from PRD-04:
- getShellForMember({ role: 'primary_parent' }) → 'mom'
- getShellForMember({ role: 'additional_adult' }) → 'adult'
- getShellForMember({ role: 'special_adult' }) → 'special_adult'
- getShellForMember({ role: 'family_member', dashboard_mode: 'independent' }) → 'independent'
- getShellForMember({ role: 'family_member', dashboard_mode: 'guided' }) → 'guided'
- getShellForMember({ role: 'family_member', dashboard_mode: 'play' }) → 'play'
- Hub route (/hub) renders HubLayout regardless of member role
- Shell change message appears when dashboard_mode is updated mid-session
```

**Guard rail effect:** If a future build phase accidentally modifies routing logic, these tests fail immediately.

#### Category 2: Zone Availability Tests

**Source:** PRD-04 Zone Availability by Shell table.

**What they assert:** Each shell renders exactly the zones it should — no more, no less.

```
Tests generated from PRD-04:
- Mom shell: Sidebar(full), QuickTasks(yes), SmartNotepad(full), LiLaDrawer(yes), FloatingButtons(all 4), Modals(yes)
- Adult shell: Sidebar(full), QuickTasks(yes), SmartNotepad(full), LiLaDrawer(NO — modal only), FloatingButtons(settings only), Modals(yes + LiLa tool modals)
- Independent shell: Sidebar(reduced), QuickTasks(yes), SmartNotepad(full), LiLaDrawer(NO — modal only), FloatingButtons(settings only), Modals(yes + LiLa tool modals)
- Guided shell: Sidebar(simplified), QuickTasks(NO), SmartNotepad(lightweight, permission-gated), LiLaDrawer(NO), FloatingButtons(settings only), Modals(yes, simplified)
- Play shell: Sidebar(NONE), QuickTasks(NO), SmartNotepad(NO), LiLaDrawer(NO), FloatingButtons(settings only, parent-locked), Modals(yes, simplified)
- Hub: Sidebar(NONE — member drawer on left instead), QuickTasks(NO), SmartNotepad(NO), LiLaDrawer(NO), FloatingButtons(NONE — settings gear in header), Modals(NO)
```

**Guard rail effect:** A build phase that adds a component to the wrong shell breaks its zone test.

#### Category 3: Permission Engine Tests

**Source:** PRD-02 Permission Resolution Order (5-step flow) + Feature Key Registry + RLS policies on every table.

**What they assert:** The permission resolution function returns the correct access level for every role × feature × scenario combination.

```
Tests generated from PRD-02:

Permission Resolution:
- Mom → any feature → ALLOW (unless self-restricted)
- Mom with self-restriction on 'journal' for kid X → DENY for that kid's journal
- Dad with no member_permissions record → DENY
- Dad with access_level 'view' for tasks + kid X → VIEW (not contribute, not manage)
- Dad with access_level 'contribute' for tasks + kid X → CONTRIBUTE
- Special Adult with no active shift → DENY everything
- Special Adult with active shift + permission for kid X tasks → ALLOW
- Special Adult with active shift + NO permission for kid Y → DENY
- Independent teen accessing own data → ALLOW
- Independent teen accessing sibling's data → DENY
- Guided child accessing own tasks → ALLOW (shell-scoped)
- Guided child accessing another member's data → DENY

View As:
- Mom View As any member → renders target member's shell with mom's access
- Dad View As (if mom granted) → renders target member's shell with dad's access level
- Dad View As (if mom did NOT grant) → DENY
- View As modal shows member's theme + mom-colored banner

Teen Transparency:
- Teen sharing override upgrades visibility from mom_only to family → visible to family
- Teen notification fires when mom changes access level
```

**Guard rail effect:** The most critical category. Permission bugs are the highest-risk defect class in a family app with children. These tests make permission violations impossible to ship accidentally.

#### Category 4: RLS Verification Tests

**Source:** Every table's RLS policy definition across all PRDs.

**What they assert:** Actual Supabase queries as each role return only the rows they should. These run against a test Supabase instance, not just the permission function.

```
Pattern (applied to EVERY table with RLS):
- Query as mom → returns all family-scoped rows
- Query as dad → returns only rows matching dad's permission grants
- Query as special_adult (no active shift) → returns 0 rows
- Query as special_adult (active shift) → returns only assigned children's rows
- Query as independent teen → returns only own rows (for private features)
- Query as guided child → returns only own rows
- Cross-family query → returns 0 rows (family_id scoping)
```

**The RLS-VERIFICATION.md log captures results.** Tests verify against the expected access level; the log documents what was tested and when.

#### Category 5: Convention Enforcement (Lint Rules)

**Source:** CLAUDE.md conventions, PRD-03 design system rules.

**What they assert:** The codebase follows established conventions. These are lintable rules — they scan files, not runtime behavior.

```
Convention tests:
- No hardcoded color values in any .tsx or .css file (all must be CSS variables)
- No Unicode emoji characters in Mom/Adult/Independent shell components (Lucide icons only)
- Emoji permitted ONLY in Play shell components and gamification components
- Every AI-powered output component includes Edit/Approve/Regenerate/Reject controls (Human-in-the-Mix)
- Every page/tool component calls useCanAccess() with a feature key
- Every member-scoped UI is wrapped in PermissionGate
- Touch targets meet shell minimums: 44px (adult shells), 48px (guided), 56px (play)
- All new database tables have corresponding RLS test entries
- No components import from paths outside src/core/components/ for shared components
```

**Guard rail effect:** Convention drift is the slow decay that makes a codebase inconsistent over time. These rules catch it on every build.

#### Category 6: Cross-Feature Wiring Tests

**Source:** STUB_REGISTRY.md + each PRD's "Stubs Created" and "Existing Stubs Wired" sections.

**What they assert:** Stubs that should be wired by a given phase are actually connected, and stubs that shouldn't be wired yet are still properly stubbed (not silently broken).

```
Pattern:
- For each stub marked "Wire in Phase X" where Phase X is complete:
  - The stub target component/function exists
  - The stub target is not a no-op placeholder
  - The data flow described in the stub registry actually works (input → output)
- For each stub still marked STUB:
  - The placeholder renders gracefully (no errors, shows appropriate "Coming soon" or empty state)
  - The placeholder does not accidentally execute real logic
```

**Guard rail effect:** Catches the "forgotten stub" anti-pattern — the #3 build problem identified in the Build Prompt Template.

#### Category 7: Vibe & Theme Token Tests

**Source:** PRD-03 Vibes System + Theme catalog.

**What they assert:** The CSS variable system works correctly across all four vibes, and token overrides apply per shell.

```
Vibe tests:
- Classic MyAIM vibe applies The Seasons heading font + HK Grotesk body + soft border-radius (12-16px)
- Clean & Modern vibe applies HK Grotesk for all text + tight border-radius (6-8px) + no decorative elements
- Nautical vibe applies Georgia headings + medium border-radius (8-12px)
- Cozy Journal vibe applies handwriting-style heading font + extra-soft border-radius (16-20px)

Token override tests (per shell):
- Guided shell applies --touch-target-min: 48px (not 44px)
- Play shell applies --touch-target-min: 56px (not 44px)
- Each shell's layout component applies its shell-specific CSS class
- Vibe + Theme + Gradient + Name Pack are independently configurable (no forced coupling)

Theme system tests:
- Switching themes updates all CSS custom properties (spot-check 5 key tokens)
- Gradient toggle on → gradient CSS variables resolve to linear-gradient values
- Gradient toggle off → gradient CSS variables resolve to solid colors
- Dark mode transformation rules produce valid color values (no NaN, no out-of-range)
- Font scale classes apply correct base font size (16px, 18px, 20px)
```

**Important note:** These tests verify that the *system* works (variables update, tokens cascade, overrides apply). They do NOT test whether themes look good — that's Layer 4 (human testing). The distinction: a test can catch "dark mode + Cozy Journal produces a #000000 background-text on a #0a0a0a background" (contrast failure). A test cannot catch "this color combination feels off."

#### Category 8: LiLa Guided Mode Registration Tests

**Source:** Build Order Source of Truth Section 8 (Guided Modes Registered in LiLa).

**What they assert:** Every guided mode listed in the registry is properly registered and routable.

```
For each guided mode in the registry:
- Mode key exists in the guided_modes configuration
- Mode has a registered system prompt (or stub if future)
- Mode has shell availability rules defined (which shells can access it)
- Permission gating matches the PRD's specification
- Mode key matches the format in lila_conversations table
```

**Guard rail effect:** Prevents a guided mode from being defined in a PRD but never registered in the LiLa system, or registered with the wrong access rules.

### When Tests Are Written

| Moment | What Happens |
|--------|-------------|
| **Opus audit (Step 1)** | Opus generates the foundational test suite from all PRDs — Categories 1-4 primarily. Test files exist before any application code. |
| **Scaffolding (Step 4)** | Test framework installed (Vitest). Convention lint rules (Category 5) configured. RLS test helpers set up. Foundational test files placed in the repo. |
| **Each build phase** | Claude Code writes tests for the phase's features *before or alongside* the implementation. The build prompt includes a "Tests to Write" section. Tests are committed in the same PR as the feature code. |
| **Post-phase doc sync** | New stubs added to cross-feature wiring tests. RLS-VERIFICATION.md updated with test results. |

### Build Prompt Template Addition

Add this as a new **Section 7B** in the Build Prompt Template, immediately after Section 7 (Project Conventions Reminder):

```
## Tests for This Phase

### Tests to Write (Before/Alongside Implementation)
- [ ] [Test description — what it asserts, which category it belongs to]
- [ ] [Another test]

### Existing Tests to Verify Still Pass
- [ ] Shell routing tests (Category 1)
- [ ] Zone availability tests (Category 2)
- [ ] Permission engine tests (Category 3) — especially if this phase changes any access rules
- [ ] Convention lint (Category 5) — run after all code is written
- [ ] Cross-feature wiring (Category 6) — check stubs wired this phase

### Run Before Marking Phase Complete
```
npx vitest run
```
All tests must pass. If a pre-existing test fails, that's a regression — investigate before proceeding.
```

---

## Layer 2: Playwright Integration Tests

### Philosophy

Layer 1 tests verify logic and conventions by reading code and querying the database. Layer 2 tests verify that the *actual running application* works correctly in a real browser. Playwright loads the app, authenticates as different roles, navigates through features, and verifies that what appears on screen matches what the PRDs specify.

**Framework:** Playwright (already familiar from prior project work). Chromium primary, Firefox and Safari as secondary.

**Location:** `tests/e2e/` at project root.

### Test Structure

Each test file corresponds to a shell or a cross-cutting concern:

```
tests/e2e/
├── shells/
│   ├── mom-shell.spec.ts
│   ├── adult-shell.spec.ts
│   ├── independent-shell.spec.ts
│   ├── guided-shell.spec.ts
│   ├── play-shell.spec.ts
│   ├── hub-layout.spec.ts
│   └── view-as.spec.ts
├── permissions/
│   ├── dad-access.spec.ts
│   ├── special-adult-shifts.spec.ts
│   ├── teen-privacy.spec.ts
│   └── cross-family-isolation.spec.ts
├── features/
│   ├── tasks-cross-shell.spec.ts
│   ├── journal-cross-shell.spec.ts
│   ├── lila-access.spec.ts
│   ├── victories-cross-shell.spec.ts
│   └── [additional feature files as phases ship]
├── visual/
│   ├── vibe-rendering.spec.ts
│   ├── responsive-breakpoints.spec.ts
│   └── dark-mode.spec.ts
└── helpers/
    ├── auth.ts          (login as each role)
    ├── seed-family.ts   (create test family with all role types)
    └── assertions.ts    (shared assertion helpers)
```

### Test Seed Data

Before Playwright tests run, a seed script creates a test family with representatives of every role:

```
Test Family: "The Testworths"
- Mom (primary_parent): testmom@example.com
- Dad (additional_adult): testdad@example.com — has mixed permissions (full access to some kids, view-only for others, no access to one)
- Grandma (special_adult): testgrandma@example.com — assigned to 2 of 4 kids
- Alex (family_member, independent): age 15 — has LiLa modal access enabled
- Jordan (family_member, guided): age 10 — has lightweight notepad enabled
- Riley (family_member, play): age 5
- Casey (family_member, independent): age 14 — has journal privacy granted by mom
```

This family is designed to exercise every permission path. Dad has different access levels to different kids. Grandma can only see her assigned kids during shifts. Casey has teen privacy. Riley is in Play mode. This single seed family covers the entire permission matrix.

### Shell Tests — What Playwright Verifies

#### mom-shell.spec.ts
```
Navigation:
- Sidebar renders with all sections (Personal, Family, Growth, etc.)
- Sidebar collapses and expands
- QuickTasks strip is visible and scrollable
- Smart Notepad drawer opens from right side
- LiLa drawer pulls up from bottom
- All three LiLa floating buttons visible (Help, Assist, Optimizer) + Settings
- Perspective switcher shows Personal Dashboard / Family Overview / Family Hub tabs

Perspective switching:
- Personal Dashboard tab shows mom's personal content
- Family Overview tab shows member columns
- Clicking between perspectives preserves scroll position

View As:
- "View As Alex" opens modal with Alex's Independent shell layout
- View As modal shows Alex's theme + mom-colored banner
- Mom can mark a task done within View As
- Closing View As returns to mom's exact previous position
```

#### adult-shell.spec.ts
```
Navigation:
- Sidebar renders with filtered sections (only features dad has access to)
- QuickTasks strip is visible
- Smart Notepad drawer available
- NO LiLa drawer handle at bottom
- Only Settings floating button visible (no Help/Assist/Optimizer)
- LiLa tool modals open when triggered from feature entry points

Permissions:
- Dad can see tasks for kids mom granted access to
- Dad cannot see tasks for kids mom did not grant access to
- Dad can mark task complete for kids with 'contribute' or 'manage' access
- Dad cannot mark task complete for kids with 'view' only access
- Dad's personal journal is private (not visible in mom's queries — verify via absence)
```

#### guided-shell.spec.ts
```
Layout:
- Simplified sidebar with fewer sections, larger text
- Bottom nav with 5 items: Home, Tasks, Journal, Victories, Progress
- NO QuickTasks strip
- NO LiLa drawer
- Lightweight notepad IF mom enabled it (test both states)
- Touch targets are at least 48px

Content:
- Only features available to Guided members are visible
- Task tiles display in simplified format
- Journal prompts appear (not freeform journal like Independent)
```

#### play-shell.spec.ts
```
Layout:
- NO sidebar
- Big colorful tile grid for tasks
- Bottom nav with emoji labels (3-4 items)
- NO drawers of any kind
- Settings requires parent PIN/auth to access
- Touch targets are at least 56px

Content:
- Task tiles are large, colorful, with prominent emoji
- Star/sticker rewards visible on task tiles
- Celebrate! button is visible and accessible
- Gamification elements are prominent
- NO text-heavy content
```

#### hub-layout.spec.ts
```
Layout:
- Widget grid fills the viewport
- No sidebar, no drawers, no floating LiLa buttons
- Settings gear in header (requires mom auth)
- Member selection drawer hidden by default
- Pull tab or swipe-from-left opens member drawer

Member selection:
- Drawer shows all family members with avatars
- Tapping a member triggers authentication (PIN / visual / none per member config)
- After auth, member's shell loads with "Back to Hub" button visible
- Tapping "Back to Hub" returns to hub widget grid
- Always-on mode: no session timeout for hub view
```

#### view-as.spec.ts
```
All shell rendering:
- View As Independent teen → renders IndependentLayout with teen's theme
- View As Guided child → renders GuidedLayout with child's theme
- View As Play child → renders PlayLayout with child's visual tokens
- All View As instances show mom-colored banner: "Viewing as [Name]"
- Mom has full read/write access within View As
- Closing View As returns to mom's exact position

Edge cases:
- View As a child who has no tasks → shows appropriate empty state
- View As during active shift for Special Adult → mom can still View As (not blocked by shift)
- View As with self-restriction → restricted content hidden even in View As
```

### Visual Tests — What Playwright Screenshots

Playwright takes screenshots at milestone builds for Tenise's visual review. These are NOT automated pass/fail — they're artifacts for human judgment.

```
Screenshot matrix (taken at each milestone):
- Each shell × each vibe (5 shells × 4 vibes = 20 screenshots)
- Each shell in dark mode with default theme (5 screenshots)
- Each shell at mobile breakpoint (< 768px) (5 screenshots)
- Each shell at tablet breakpoint (768-1023px) (5 screenshots)
- Guided and Play shells with Bright & Fun theme category representative (2 screenshots)

Total: ~37 screenshots per milestone build
Stored: tests/e2e/screenshots/[milestone]-[date]/
```

These screenshots serve as a visual changelog — Tenise can flip through them to spot anything that looks wrong without clicking through every shell manually.

### Responsive Breakpoint Tests

```
For each shell, verify at each breakpoint (< 768px, 768-1023px, 1024-1279px, ≥ 1280px):
- Correct navigation pattern appears (bottom nav vs sidebar vs hamburger)
- Drawers auto-collapse at narrow viewpoints
- Content doesn't overflow or clip
- Touch targets meet shell minimums at that breakpoint
```

### When Playwright Tests Run

| Trigger | Scope |
|---------|-------|
| **After Phase 1-2 (Auth + Permissions)** | Shell routing + permission tests only (the foundation) |
| **Every 5-8 build phases (milestone)** | Full suite + screenshots |
| **Before beta** | Full suite + screenshot review + responsive checks on real devices |
| **After any permission-related change** | Permission test suite only (fast, targeted) |

### Playwright Setup (During Scaffolding — Step 4)

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Add to `package.json` scripts:
```json
"test:e2e": "playwright test",
"test:e2e:headed": "playwright test --headed",
"test:e2e:screenshots": "playwright test tests/e2e/visual/ --update-snapshots"
```

The seed family script runs before each test suite via Playwright's `globalSetup`. Auth tokens for each test role are cached so individual tests don't repeat login flows.

---

## Layer 3: Agent Teams QA

### Philosophy

Agent Teams fill the gap between automated tests (which verify specific assertions) and human testing (which evaluates holistic experience). An agent "thinking as" the Guided shell child can reason about whether the overall experience makes sense in ways a test assertion can't — "wait, this feature is visible in Guided but the PRD says Guided doesn't have it" or "this button leads to a page that doesn't exist in this shell."

**When:** Major milestones only — after the foundation phases (Auth + Permissions + Design + Routing), at the mid-build mark, and pre-beta. Roughly 3-4 times during the entire build. Agent Teams are token-expensive (3-4x a normal session), so they're reserved for deep QA passes.

**How:** Claude Code with Agent Teams enabled. One team lead + shell-specific teammates. Each teammate gets a spawn prompt seeded with their shell's specs.

### Team Structure

**Team Lead:** Coordinates the QA pass. Reads the full QA-SHELLS.md manifest. Assigns verification areas to teammates. Synthesizes findings into a single report.

**Seven Teammates:**

| Agent | Shell/Context | Spawn Prompt Contains |
|-------|--------------|----------------------|
| **Agent Mom** | Mom Shell (all perspectives) | PRD-04 Mom layout, PRD-02 mom permission rules, PRD-14 Personal Dashboard, PRD-14C Family Overview, PRD-14D Family Hub, View As spec |
| **Agent Dad** | Adult Shell | PRD-04 Adult layout, PRD-02 dad permission model, permission-gated feature list, modal-only LiLa access rules |
| **Agent Teen** | Independent Shell | PRD-04 Independent layout, PRD-02 teen transparency rules, teen privacy controls, modal-only LiLa access rules |
| **Agent Guided** | Guided Shell | PRD-04 Guided layout, PRD-25 Guided Dashboard (when written), gamification spec, lightweight notepad rules, simplified interactions |
| **Agent Play** | Play Shell | PRD-04 Play layout, PRD-26 Play Dashboard (when written), gamification visual spec, big tile rules, emoji permission, parent-locked settings |
| **Agent Hub** | Tablet Hub | PRD-04 Hub layout, PRD-14D Family Hub, widget grid, member selection drawer, always-on mode, "Back to Hub" flow |
| **Agent View-As** | Mom's View As Mode | PRD-02 View As spec, PRD-04 View As modal rendering rules. This agent's job is to verify that View As correctly renders each other shell and that mom's access works within it. |

### What Each Agent Checks

Each agent's checklist is built from two sources: the structural checks (from PRD-04 zone availability table) that apply to every milestone, and the feature-specific checks that grow as build phases ship.

#### Structural Checks (Every Agent, Every QA Pass)

```
For my shell:
1. ROUTING: Does getShellForMember() return the correct shell for my role + dashboard_mode?
2. LAYOUT: Does my layout component render with the correct zone inventory? (sidebar, drawers, floating buttons, bottom nav per PRD-04 table)
3. NAVIGATION: Are sidebar/bottom-nav items correct for my shell? No items that belong to other shells?
4. DRAWERS: Do my permitted drawers open and close correctly? Are drawers I shouldn't have absent?
5. LILA ACCESS: Is LiLa accessible in the correct form? (drawer for Mom, modal for Adult/Independent/Guided, none for Play)
6. FLOATING BUTTONS: Are the correct floating buttons visible? (all 4 for Mom, Settings only for others)
7. THEME APPLICATION: Does my shell apply its visual token overrides from PRD-03?
8. RESPONSIVE: Does my shell degrade correctly at each breakpoint?
9. PERMISSIONS: Can I access only what my role permits? Can I NOT access what's restricted?
10. CROSS-SHELL MESSAGING: If I discover something that affects another shell, message that agent.
```

#### Feature-Specific Checks (Grow Per Phase)

These are generated by the Opus audit from each PRD's "What Done Looks Like" checklist, filtered to the relevant shell. Example after the Tasks phase ships:

```
Agent Mom — Tasks checks:
- Can create tasks for any family member
- Can mark tasks done for any member (directly or via View As)
- Can unmark a task and see rewards/tracking roll back
- Task appears in Family Overview member columns
- QuickTasks strip includes "Add Task" button

Agent Dad — Tasks checks:
- Can see tasks for kids where permission = view/contribute/manage
- Cannot see tasks for kids where permission = none
- Can mark done for kids with contribute/manage
- Cannot mark done for kids with view-only
- Can create tasks for self always

Agent Guided — Tasks checks:
- Sees simplified task view
- Task tiles use Guided shell's larger touch targets (48px)
- Cannot create own tasks (mom-assigned only)
- Can mark own tasks as complete
- Completion triggers gamification response (if gamification is active for this member)

Agent Play — Tasks checks:
- Sees big colorful task tiles with emoji
- Touch targets 56px minimum
- No text-heavy task descriptions
- Star/sticker rewards visible on each tile
- Completion triggers celebration animation
```

### Cross-Shell Verification (The Unique Value of Agent Teams)

The most valuable thing Agent Teams do that neither automated tests nor single-agent QA can do: **cross-shell consistency checking through agent communication.**

Examples:
- Agent Mom marks a task done via View As for Agent Guided's child → Agent Guided verifies the task shows as complete in the Guided shell
- Agent Dad discovers a feature is visible that shouldn't be → Agent Dad messages Agent Mom to verify whether the permission was set correctly
- Agent Teen shares a victory with the family → Agent Mom verifies it appears in Family Overview → Agent Hub verifies it appears in the family widget (if applicable)
- Agent View-As renders as each shell → messages the corresponding agent to compare what they see

### QA-SHELLS.md Structure

This document is initialized during scaffolding (Pre-Build Setup Checklist Step 7) and grows with every build phase:

```markdown
# QA-SHELLS.md: Per-Shell Verification Manifest

## How to Use
Run this as an Agent Teams QA pass at milestone builds.
Each agent reads their shell section.
Team lead reads the Cross-Shell section and coordinates.

## Structural Checks (All Shells — Every Pass)
[The 10-item structural checklist from above]

## Shell: Mom
### Structural: [references the common checks above]
### Feature Checks:
- [Added after each build phase that touches Mom shell features]
### Perspective Checks:
- Personal Dashboard: [checks]
- Family Overview: [checks]
- Family Hub: [checks]

## Shell: Adult
### Structural: [references common checks]
### Feature Checks:
- [Added after each build phase]
### Permission Edge Cases:
- [Mixed permission scenarios specific to dad]

## Shell: Independent
[same pattern]

## Shell: Guided
[same pattern, includes gamification checks]

## Shell: Play
[same pattern, includes gamification and celebration checks]

## Shell: Hub
[same pattern, includes always-on and member selection]

## Shell: View As
[same pattern, includes cross-shell rendering verification]

## Cross-Shell Scenarios
- [Data flow scenarios that span multiple shells]
- [Added after each build phase that creates cross-shell interactions]
```

### When Agent Teams Run

| Milestone | What They Check | Approximate Phase |
|-----------|----------------|-------------------|
| **Foundation Complete** | Auth + Permissions + Design + Routing. All 7 shells render correctly with zones. Permission engine works across all roles. | After Phases 1-4 |
| **Core Features Complete** | Tasks, Journal, Notepad, Widgets, Victories all work correctly in all applicable shells. Cross-feature data flows verified. | After ~Phase 12-15 |
| **Full Platform QA** | Everything built so far. Full cross-shell scenario matrix. Gamification in Guided/Play. AI features in applicable shells. | After ~Phase 20+ |
| **Pre-Beta** | Final comprehensive pass before human beta testing begins. | Before beta |

---

## Layer 4: Human Testing (Tenise)

### What Only a Human Can Test

- **Theme aesthetics:** Do the 38 themes look good across vibes? (Playwright screenshots make this efficient — review 37 images instead of clicking through 37 combinations manually)
- **Vibe feel:** Does Cozy Journal feel cozy? Does Nautical feel purposeful without being kitschy?
- **UX flow:** Would a mom understand what to do next? Is the flow intuitive?
- **Emotional tone:** Does the app feel warm, inviting, and empowering? Or clinical and overwhelming?
- **Content quality:** Are LiLa's responses appropriate? Do declarations feel honest? Do celebrations feel genuine?
- **Dark mode aesthetics:** Do auto-generated dark themes look right, or do some need hand-tuned overrides?
- **Mobile feel:** Does the app feel native on a phone? Are gestures natural?
- **Gamification delight:** Do Play shell celebrations feel fun for a 5-year-old? Do Guided shell achievements feel motivating for a 10-year-old?

### Human Testing Workflow

1. **Playwright screenshots arrive** → Tenise reviews visual screenshots for each shell × vibe, flags anything that looks wrong
2. **Feature testing** → Tenise tests each new feature as herself (Mom shell), then uses View As to check other shells
3. **Device testing** → Test on phone (primary), tablet (Fire TV via Silk for Hub), laptop
4. **Family testing** → Before beta: have actual family members try their shells and report what's confusing

### What Layers 1-3 Save Tenise From

Without Layers 1-3, Tenise would need to manually verify:
- All permission combinations (dozens of scenarios)
- All shell routing paths
- All zone availability per shell
- All responsive breakpoints per shell
- All cross-feature wiring
- Convention compliance (hardcoded colors, missing permission gates, wrong icons)

With Layers 1-3, Tenise focuses entirely on **experience quality** — the thing that requires human judgment and that no automated system can evaluate.

---

## Opus Audit Integration

### Addition to Pre-Build Setup Checklist — Step 1

Add the following instruction block to the Step 1 audit prompt. This tells Opus to generate testing infrastructure as part of the PRD consistency audit:

```
## Testing Infrastructure Generation

After completing the PRD consistency checks, generate the following test artifacts:

### 1. Foundational Test Suite (Layer 1)

Read every PRD and generate test files for:

**Shell Routing Tests** (`tests/unit/shell-routing.test.ts`):
- Extract every row from PRD-04's shell routing table
- Generate one test assertion per routing combination
- Include edge cases: what happens with an unrecognized dashboard_mode?

**Zone Availability Tests** (`tests/unit/zone-availability.test.ts`):
- Extract the Zone Availability by Shell table from PRD-04
- Generate one test per shell × zone combination
- Assert presence AND absence (test that Play does NOT have sidebar, not just that Mom does)

**Permission Engine Tests** (`tests/unit/permissions.test.ts`):
- Extract PRD-02's 5-step Permission Resolution Order
- Generate tests for every step with every role
- Extract the Feature Key Registry and generate access tests per feature × role
- Include View As permission tests
- Include teen sharing override tests
- Include mom self-restriction tests
- Include Special Adult shift-based access tests (with shift, without shift)

**RLS Test Templates** (`tests/rls/`):
- For every table across all PRDs that specifies an RLS policy, generate a test file
- Each test file queries as each of the 5 roles and asserts the expected row count
- Use the access level shorthand from RLS-VERIFICATION.md (full, own, per-permission, assigned, none, read-only)

**Convention Lint Rules** (`tests/lint/conventions.test.ts`):
- No hardcoded colors (scan for hex values and rgb() in .tsx and .css files, excluding test files and config)
- No Unicode emoji in adult shell components (scan component files, check import paths for shell association)
- Human-in-the-Mix controls present on AI output components
- useCanAccess() called in every page/tool component
- PermissionGate wrapping every member-scoped UI

**Cross-Feature Wiring Tests** (`tests/unit/stub-wiring.test.ts`):
- Extract every stub from every PRD's Stubs section
- Generate a test that the stub placeholder exists and renders without error
- Mark which phase should wire each stub (for future assertion updates)

**Guided Mode Registration Tests** (`tests/unit/guided-modes.test.ts`):
- Extract Build Order Source of Truth Section 8 (all registered guided modes)
- Generate a test per mode asserting registration and shell availability

**Vibe & Theme Token Tests** (`tests/unit/theme-system.test.ts`):
- Each vibe applies its correct font stack, border-radius range, and spacing density
- Theme switching updates CSS custom properties
- Gradient toggle works
- Dark mode transformation produces valid values
- Font scale classes apply correct base sizes
- Vibe + Theme + Gradient + Name Pack are independently configurable

### 2. Playwright Test Scaffold (Layer 2)

Generate the test file structure and seed data:

**Seed script** (`tests/e2e/helpers/seed-family.ts`):
- Create "The Testworths" family with all 7 role representatives
- Set up mixed permissions for Dad (different access levels to different kids)
- Set up Special Adult assignments (Grandma to 2 of 4 kids)
- Set up teen privacy override for Casey
- Create sample data: tasks, journal entries, victories, guiding stars across family members

**Auth helper** (`tests/e2e/helpers/auth.ts`):
- Login function for each test role
- Token caching to avoid repeated auth during test runs

**Shell test files** (one per shell + View As + Hub):
- Structural checks from PRD-04 as Playwright assertions
- Empty feature check sections with TODO comments keyed to build phases

**Visual test file** (`tests/e2e/visual/vibe-rendering.spec.ts`):
- Screenshot capture for each shell × vibe × dark mode matrix
- Stored in tests/e2e/screenshots/ for human review

### 3. QA-SHELLS.md Manifest (Layer 3)

Generate the complete QA-SHELLS.md document:

- Structural checks section (common to all shells)
- Per-shell sections with feature checks extracted from each PRD's "What Done Looks Like" checklist, filtered by shell applicability
- Cross-shell scenario section extracted from PRD flow diagrams and data flow descriptions
- Each check tagged with the PRD it came from and the build phase it becomes testable

### 4. Build Phase Test Mapping

Generate a table mapping each build phase to the tests that should be written during that phase:

| Build Phase | PRDs Implemented | Layer 1 Tests to Add | Layer 2 Tests to Add | Layer 3 Checks to Add |
|-------------|-----------------|---------------------|---------------------|----------------------|
| Phase 1 (Auth) | PRD-01 | Auth flow tests, family creation | Login as each role | Shell routing structural |
| Phase 2 (Permissions) | PRD-02 | Full permission engine suite, RLS tests | Permission verification in browser | Permission edge cases per agent |
| Phase 3 (Design) | PRD-03 | Vibe/theme token tests, convention lint | Visual screenshots (baseline) | Theme rendering per shell |
| Phase 4 (Routing) | PRD-04 | Shell routing, zone availability | Shell navigation in browser | Full structural checks all agents |
| ... | ... | ... | ... | ... |

This table becomes the test roadmap — during each build phase's prompt drafting, consult this table to know exactly which tests Claude Code should write.
```

### Addition to Build Prompt Template

Add "Section 7B: Tests for This Phase" to the Build Prompt Template (described in Layer 1 section above). Every build prompt includes specific tests to write, keyed to the Build Phase Test Mapping table generated during the audit.

### Addition to "What Done Looks Like" Section

Add this as a standard item in every build prompt's "What Done Looks Like" checklist:

```
- [ ] All new tests written and passing (see Section 7B)
- [ ] All pre-existing tests still passing (`npx vitest run`)
- [ ] RLS tests updated if new tables created
- [ ] QA-SHELLS.md updated with new feature checks for applicable shells
- [ ] Playwright feature tests updated (if at milestone)
```

---

## Pre-Build Setup Checklist Updates

### Step 1 Addition
Add the "Testing Infrastructure Generation" block above to the Opus audit prompt.

### Step 4 Addition (Scaffolding)
Add to the scaffolding checklist:
- [ ] Install Vitest: `npm install -D vitest @testing-library/react @testing-library/jest-dom`
- [ ] Install Playwright: `npm install -D @playwright/test && npx playwright install chromium`
- [ ] Configure Vitest in `vite.config.ts`
- [ ] Place foundational test files generated by Opus audit into repo
- [ ] Verify: `npx vitest run` executes (tests will fail against empty app — that's expected and correct, this IS TDD)
- [ ] Add test scripts to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:e2e": "playwright test"`

### Step 7 Update (QA-SHELLS.md)
Replace the current Step 7 description with:
```
Step 7: Create QA-SHELLS.md

Use the QA-SHELLS.md generated by the Opus audit (Step 1). Verify it covers:
- [ ] Structural checks for all 7 test contexts (5 shells + Hub + View As)
- [ ] Feature-specific checks extracted from every PRD's "What Done Looks Like" section
- [ ] Cross-shell scenarios from PRD data flow descriptions
- [ ] Each check tagged with source PRD and build phase
- [ ] Designed to be runnable as an Agent Teams QA pass at milestone builds
```

### Step 12 Addition (Final Verification)
Add to the final verification checklist:
- [ ] Vitest configured and foundational test files present
- [ ] Playwright installed and configured
- [ ] QA-SHELLS.md comprehensive and keyed to build phases
- [ ] Build Phase Test Mapping table present in docs/
- [ ] `npm run test` runs (tests fail against empty app — expected for TDD)

---

## Cost & Effort Estimates

| Layer | Setup Cost | Per-Phase Cost | Milestone Cost |
|-------|-----------|---------------|----------------|
| **Layer 1 (TDD)** | Opus generates foundation (~1 audit session). Framework setup ~30 min. | 15-30 min added per build phase for writing tests alongside code. | Near zero — tests run in seconds. |
| **Layer 2 (Playwright)** | Scaffold generated by Opus. Seed data ~1 session. | Minimal — test files grow incrementally. | ~30-60 min for full suite run + screenshot review. |
| **Layer 3 (Agent Teams)** | QA-SHELLS.md generated by Opus. | None between milestones. | 3-4x token cost of a normal session (~$15-40 per pass at current rates). |
| **Layer 4 (Human)** | None. | Ongoing as features ship. | Reduced by 60-70% because Layers 1-3 handle mechanical verification. |

**Total added cost per build phase:** ~15-30 minutes of Claude Code time writing tests. This is offset by the time saved NOT debugging regressions, permission bugs, and convention drift in later phases.

**The compound effect:** Each test you add makes every future build phase safer. By Phase 10, you have hundreds of assertions protecting everything built in Phases 1-9. By Phase 20, the safety net is comprehensive. This is the "no tech debt" principle applied to quality assurance.

---

*Created: March 17, 2026*
*Reference: Pre-Build Setup Checklist, Build Prompt Template, PRD-02 (Permissions), PRD-03 (Design System), PRD-04 (Shell Routing), Build Order Source of Truth v2, PRD Audit Readiness Addendum*
