# Coding Conventions — MyAIM Central Family Platform v2

This document defines the coding conventions, patterns, and standards for the MyAIM Central codebase. All contributors (human and AI) must follow these conventions.

---

## Naming Conventions

| Category | Convention | Examples |
|---|---|---|
| Database tables | `snake_case`. Never nautical names. Never renamed once created. | `guiding_stars`, `activity_log_entries`, `studio_queue` |
| Feature names | Compound capitals (PascalCase, no spaces) | LifeLantern, InnerWorkings, GuidingStars, BestIntentions, BookShelf, ThoughtSift, BigPlans, MindSweep, DailyCelebration, SafeHarbor |
| Feature keys | `snake_case` | `guiding_stars_basic`, `lila_optimizer`, `safe_harbor` |
| Component files | PascalCase | `GuidingStarCard.tsx`, `PermissionGate.tsx` |
| Hook files | camelCase with `use` prefix | `useCanAccess.ts`, `useTheme.ts` |
| Edge Functions | kebab-case | `lila-chat`, `mindsweep-sort` |
| CSS variables | kebab-case with prefix | `--vibe-primary`, `--theme-accent` |
| Icons | Lucide React only. No emoji in adult interfaces. Emoji permitted only in the Play shell. |

---

## RLS Policy Patterns

Every table MUST have Row Level Security enabled. No exceptions.

### Standard Access Patterns

- **Owner access**: `auth.uid() = user_id` or resolved through the `family_members` join.
- **Family scoping**: All queries filter by `family_id` derived from the authenticated user's family.
- **Mom sees all**: The primary parent has full visibility within the family.
- **Dad scoped**: Additional adults see data based on `member_permissions` grants.
- **Special Adult**: Shift-scoped access via `access_schedules`, or always-on for co-parents.
- **Teen**: Own data plus family-level shared data only.
- **Guided / Play**: Own data visible to mom; no cross-member visibility.

---

## Human-in-the-Mix Pattern

Every AI-generated output MUST present four options before saving:

1. **Edit** — User modifies the output.
2. **Approve** — Save as-is.
3. **Regenerate** — Request a new version.
4. **Reject** — Discard without saving.

Implementation:

```tsx
<HumanInTheMix
  onEdit={handleEdit}
  onApprove={handleApprove}
  onRegenerate={handleRegenerate}
  onReject={handleReject}
/>
```

---

## Permission System

Based on PRD-02. Three layers, checked in order:

1. **Tier threshold** — from `feature_access_v2`.
2. **Member toggle** — from `member_feature_toggles` (sparse: rows exist only when a feature is disabled).
3. **Founding family override** — bypasses tier restrictions for founding families.

### Components and Hooks

- `<PermissionGate featureKey="xxx">` — Renders children only if access is granted.
- `useCanAccess(featureKey, memberId?)` — Hook returning a boolean.

### Beta Behavior

During beta, `useCanAccess` returns `true` for everything (all tiers unlocked).

### Feature Key Registration

Every new feature MUST:

1. Add feature key(s) to the `feature_key_registry` table seed.
2. Add tier thresholds to the `feature_access_v2` seed (per role group).
3. Wrap UI with `<PermissionGate featureKey="xxx">`.
4. Use `useCanAccess()` for conditional logic.

---

## Activity Logging Pattern

All significant user actions log to `activity_log_entries`:

```typescript
await logActivity({
  family_id,
  member_id,
  event_type,
  source_table,
  source_id,
  metadata,
});
```

Event types include: `'task_completed'`, `'victory_recorded'`, `'journal_created'`, `'guiding_star_created'`, etc.

---

## Queue Routing Patterns

- `studio_queue` is the universal intake funnel (PRD-17 authoritative definition, PRD-17B additions).
- All items entering the task/list/tracker creation pipeline go through `studio_queue`.
- Sources: `notepad`, `meetings`, `requests`, `goals`, `lila`, `mindsweep`, `manual`.
- The `RoutingStrip` component is used everywhere items route between features.

---

## Stub Conventions

When creating a stub for a future feature:

1. Add a comment: `// STUB: [description] — wires to PRD-XX`
2. Register in `STUB_REGISTRY.md` with the created-by PRD and expected wired-by PRD.
3. Stub UI renders `<PlannedExpansionCard featureKey="xxx" />` for demand validation.
4. Never create empty files or placeholder components — stubs are documented intentions only.

---

## Embedding Pipeline (Semantic Context Infrastructure)

- Tables with textual content get an `embedding vector` column (`halfvec(1536)`).
- INSERT/UPDATE trigger calls `util.queue_embedding_job()` which pushes to a pgmq queue, consumed by the `embed` Edge Function.
- Never synchronous — embeddings are always async via queue.
- Use `match_by_embedding()` Postgres function for semantic search.
- NULL embeddings are handled gracefully (records remain queryable, just not by similarity).

---

## `is_included_in_ai` Pattern

- Every context source table has `is_included_in_ai BOOLEAN DEFAULT true`.
- Three-tier toggles: person-level, category-level, item-level.
- Mom can toggle at any level; dad and teens see only their own toggles.
- Privacy Filtered items are always excluded for non-mom regardless of toggle state.
- Safe Harbor conversations are always excluded from all data compilation.

---

## CSS / Theming

- **Mobile-first** responsive design (375px baseline).
- Tailwind CSS with CSS custom properties for theme tokens.
- Theme token prefixes:
  - `--vibe-*` for structural tokens.
  - `--theme-*` for color tokens.
- Shell-aware scaling: Play (bounciest) → Guided (moderate) → Independent (clean) → Adult (subtle).
- No hardcoded colors — always use theme tokens.
- Dark mode via `prefers-color-scheme` media query plus a user toggle.

---

## TypeScript Conventions

- Strict mode enabled.
- Types generated from the Supabase schema — never hand-write database types.
- Prefer `interface` for object shapes; use `type` for unions and intersections.
- No `any` — use `unknown` and narrow with type guards.
- `async`/`await` over `.then()` chains.

---

## Date and Time (Local vs UTC)

- Always use helpers from `src/utils/dates.ts` for any local-date computation. Never write `new Date().toISOString().split('T')[0]` — it returns the UTC date, not the user's local date, and causes off-by-one bugs in negative-offset timezones during late-evening writes (first surfaced by beta_glitch_reports `8dc4b2bd`, then found in 30+ files). **ESLint enforces this** via a `no-restricted-syntax` rule in `eslint.config.js` — `npm run prebuild` (which Vercel runs automatically before `npm run build`) will fail on any new occurrence.
- For `DATE` columns and date-keyed query keys: `todayLocalIso()` / `localIso(date)` / `localIsoDaysFromToday(n)`.
- For week / month / quarter period identifiers: `localWeekIso()` / `localMonthIso()` / `localQuarterIso()` — all use local time and match the ISO 8601 week algorithm used in `periodForRhythm()`.
- For `TIMESTAMPTZ` range queries (e.g. "items created today in the user's local time"): `startOfLocalDayUtc()` / `endOfLocalDayUtc()` — these produce proper UTC ISO timestamps representing the local wall-clock boundary. Passing a naive `YYYY-MM-DD` string to a TIMESTAMPTZ filter is still wrong even if the date was computed locally — it gets interpreted in the Postgres session timezone (usually UTC), not the user's.
- For `<input type="datetime-local">` round-trips: use `toDatetimeLocalInput(dateOrIsoString)` on the read side. The save side (`new Date(input.value).toISOString()`) is already correct because datetime-local values are parsed by the Date constructor as local time.
- E2E tests live outside `src/` and don't use the `@/` path alias — they have their own mirror at `tests/e2e/helpers/dates.ts`. Keep the two files in sync if the algorithms ever change.

---

## ESLint

- Config lives at `eslint.config.js` (flat config, ESLint 9+). It is intentionally an **allow list**: nothing is enabled unless explicitly turned on. We deliberately skip `typescript-eslint/recommended` and `js.configs.recommended` because they'd flag hundreds of existing patterns and create noise.
- Active rules:
  - `no-restricted-syntax` — blocks `.toISOString().split/slice/substring/substr` (the UTC date bug). Error.
  - `react-hooks/rules-of-hooks` — error.
  - `react-hooks/exhaustive-deps` — warning (too many false positives to be an error).
  - `no-debugger`, `no-var` — error.
  - `prefer-const` — warning.
- ESLint runs as `npm run lint` (manual) or via the `prebuild` lifecycle hook which fires automatically when `npm run build` runs (locally and on Vercel). Errors block the build; warnings don't.
- Adding a new rule? Run `npm run lint` first to count current violations. If there are more than ~10 of an error-level rule, either fix them all in the same PR or set the rule to `'warn'` for now and convert to `'error'` once fixed. **Don't introduce a rule that ships with broken builds.**

---

## Edge Function Conventions

- TypeScript with Deno runtime (Supabase Edge Functions).
- Always validate input with Zod schemas.
- Log AI costs to `ai_usage_log` for Sonnet calls (fire-and-forget).
- Stream responses for conversation-based functions.
- Never expose the service role key to the client — Edge Functions handle all privileged operations.

---

## Optimistic Updates

- Dashboard reordering, task completion, reactions: update UI immediately, sync in background.
- Use TanStack Query's optimistic update pattern.
- On failure: revert UI and show a toast notification.

---

## Error Handling

- **User-facing errors**: Friendly toast messages. Never raw error strings.
- **LiLa errors**: Use the pattern "I had trouble with that. Want to try again?"
- **Network errors**: Offline banner plus a pending-changes indicator (PRD-33).
- Never swallow errors silently in development.

---

## Testing

- **Unit tests** for pure logic (hooks, utilities, permission checks).
- **Component tests** for interactive UI (render + assert).
- **Integration tests** for cross-feature flows (queue routing, context assembly).
- **E2E tests** for critical paths (auth, task completion to victory, tier gating).
- Tests are written to the `tests/` directory, organized by feature domain.

---

## Visual Density System

Every page or surface wrapper MUST declare a density class. Components consume `--density-multiplier` for spacing calculations.

| Density | Multiplier | Use |
|---|---|---|
| `density-comfortable` | 1.0 | Creation flows, forms, content reading |
| `density-compact` | 0.7 | Browsing grids, navigation, data lists (Studio, Vault, Dashboard, Archives) |
| `density-tight` | 0.5 | Settings panels, control surfaces, filter bars |

Density goes on the **page-level wrapper**, not globally and not on individual components.

---

## Zero Hardcoded Colors

All `color`, `background`, `border-color`, `fill`, `stroke`, and `box-shadow` color values must use `var(--*)` CSS custom properties. No hex, no `rgb()`, no named colors.

**Exceptions:** `rgba(0,0,0,...)` in shadow definitions, print `@media print` styles, and auth pages (pre-theme).

Use `var(--token, #fallback)` pattern where a fallback is needed for safety. Use `color-mix(in srgb, var(--token) NN%, transparent)` for opacity instead of `rgba()` with hardcoded components.

---

## Quick Create Component

`src/components/global/QuickCreate.tsx` — Global "+" button with 6 quick-action shortcuts.

- **Desktop:** Renders as the rightmost pill in the QuickTasks strip (`mode="strip"`)
- **Mobile:** Renders as a FAB in bottom-right corner above BottomNav (`mode="fab"`)
- **Actions:** Add Task, Quick Note, Log Victory, Calendar Event, Send Request, Mind Sweep
- **Shell visibility:** Mom, Adult, Independent only (no Guided/Play)

Action handlers are passed as props by the consuming shell (MomShell, etc.).

---

## Sidebar Collapsible Sections

Sidebar nav items are organized into 6 sections: Home, Capture & Reflect, Plan & Do, Grow, Family, AI & Tools. All sections except Home are collapsible.

- Default: only the section containing the current route is expanded
- Expanding one section does NOT auto-collapse others
- Navigating to a page auto-expands its section
- State is session-only (not persisted)
- Smooth `max-height` transition, 200ms

---

## Modal System

All modals MUST use `<ModalV2>` from `@/components/shared/ModalV2.tsx`. No one-off portals.

| Type | Header | Close Behavior | State |
|---|---|---|---|
| `persistent` | Gradient | Minimizes to pill (max 3) | Preserved while minimized |
| `transient` | Plain + border | Closes and destroys | No preservation |

Sizes: `sm` (480px), `md` (640px), `lg` (750px), `xl` (960px), `full` (90vw).
