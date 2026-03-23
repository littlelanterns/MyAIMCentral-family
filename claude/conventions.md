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
