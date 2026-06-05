# Supabase Generated Types Foundation

**Status:** Follow-up build candidate — not yet scoped
**Filed:** 2026-05-28
**Filed from:** View As Identity-Scope Architecture build (Worker 1 Checkpoint 2 discussion)
**Estimated workers:** 2-4
**Estimated calendar time on branch:** 1-3 days
**Live-app downtime:** zero (feature branch strategy)

---

## What this build is for

Enable TypeScript compile-time type-checking of every Supabase database operation by generating a typed schema file from production and wiring it into the Supabase client.

Today, Supabase queries in this codebase are loosely typed. Column typos, wrong enum values, and stale table references compile cleanly under `tsc -b` and fail at runtime in production. This build closes that gap.

---

## Why we're doing it

The project already enforces strict TypeScript checking on application code. Vercel runs `tsc -b` strict on every deploy. That layer is on.

The layer where TypeScript code meets the database has no compile-time safety. The current state:

- `src/lib/supabase/client.ts` calls `createClient(...)` without a generic type parameter
- `db:types` script exists in `package.json` but `src/types/supabase.ts` has never been generated or committed
- `claude/live_schema.md` is regenerated after every migration (Convention #244), but it is markdown documentation for humans and Claude sessions — NOT a TypeScript file the compiler can read

Result: a worker can ship code that writes to a column that doesn't exist, references a table that was renamed, or passes a value outside a CHECK constraint enum, and `tsc -b` clean signals nothing is wrong. Bugs surface at runtime — sometimes after deploy, sometimes only at specific call paths in production.

For a platform handling kids' data, family finances, and sensitive relationship context, this gap is meaningful. Type safety at this layer makes whole categories of bugs impossible at the source.

---

## Strategy — feature branch, no live-app downtime

The entire build runs on a git branch (suggested name: `supabase-types-foundation`). `main` stays deployable throughout. Vercel keeps deploying `main` normally. Users see no change. The branch can be in any state — half-done, broken, abandoned — without affecting the live app.

The merge of the branch into `main` is the cutover. Before merge: live app works without type safety. After merge: live app works with type safety. No in-between state.

If the branch turns out larger than expected, it does not merge. It pauses, gets re-scoped, or gets shelved. `main` is never at risk.

---

## Phase breakdown

### Phase 1 — Foundation (1 worker)

- Run `supabase gen types typescript --linked > src/types/supabase.ts` against production
- Edit `src/lib/supabase/client.ts` to use `createClient<Database>(...)` with the generated `Database` type
- Add a `postmigration` script in `package.json` that automatically regenerates `src/types/supabase.ts` after every `supabase db push --linked` — this is the discipline piece that keeps types in sync with schema going forward
- Commit the generated types file to the repo so the project has a tracked source of truth
- Run `tsc -b` and report the count and distribution of resulting type errors. This count becomes the cleanup scope for Phase 2.

### Phase 2 — Cleanup (1-3 workers depending on error volume)

The Phase 1 worker's error count drives the worker split. Suggested domain splits if the count is large:

- **Worker A** — tasks, lists, sequential collections, routines, calendar, meetings
- **Worker B** — archives, journal, guiding stars, best intentions, inner workings, victories, reflections, rhythms
- **Worker C** — vault, bookshelf, lila, ai usage tracking, messaging, family hub, gamification

Each worker fixes type errors within their domain only. No cross-domain refactors. Each worker reports `tsc -b` clean for their domain before handoff. Cross-domain conflicts are surfaced to the orchestrator for resolution.

If Phase 1's error count is small (< 50 errors), this collapses to one cleanup worker handling everything.

### Phase 3 — Discipline (codified in CLAUDE.md + PRE_BUILD_PROCESS.md)

- Add convention: `supabase gen types typescript --linked` runs automatically as part of every migration push, paired with `npm run schema:dump`
- Add pre-push git hook: fail if `src/types/supabase.ts` is older than the latest migration file in `supabase/migrations/`
- Document in `claude/PRE_BUILD_PROCESS.md` post-build checklist: "Regenerate Supabase TypeScript types after applying migrations (paired step with regenerating live_schema.md)"

Without Phase 3, types drift from schema and the project ends up back where it started in six months.

---

## Blockers / prerequisites

- **None to start.** Can run anytime after the View As Identity-Scope Architecture build closes.
- **Should NOT run during another active build.** The type-error cascade from Phase 1 will block any other build worker until cleanup is done. Wait for an idle window in `.claude/rules/current-builds/`.
- **Recommended:** wait until at least one feature build closes between this filing date and dispatch, so the project state has settled and the type-error count reflects the current codebase rather than the in-flight one.

---

## What NOT to do

- **Big-bang on `main`.** Live app would be unusable until cleanup completes. Always feature-branch.
- **Enable types without committing the generated file.** A `src/types/supabase.ts` that exists locally but isn't in the repo means every dev gets a different type story. Commit the file.
- **Skip Phase 3 (discipline).** Without automation, types drift from schema as soon as the next migration ships, and the project quietly rots back to the pre-build state.
- **Use `// @ts-ignore` to "fix" errors.** That defeats the purpose. If a type error is hard, surface it to the orchestrator; don't silence it.

---

## Companion conventions to add

After this build closes, the following conventions get added to CLAUDE.md (drafts — orchestrator finalizes wording):

- **New convention** — Generated TypeScript types regen is paired with `npm run schema:dump`. After every migration push, both files are regenerated and committed together. A pre-push hook enforces this.
- **Update Convention #244** — note that `claude/live_schema.md` and `src/types/supabase.ts` are sibling artifacts, both regenerated from production after every migration. Markdown is for human/Claude reading; TypeScript is for the compiler.

---

## Related

- **Convention #244** — `claude/live_schema.md` regen process. This build adds a parallel TypeScript regen step.
- **View As Identity-Scope Architecture build** — surfaced this gap during Worker 1 Checkpoint 2 verification. Migration 100246 added `view_as_sessions.origin` column with a CHECK constraint; the type for that column does not flow to TypeScript, so a typo on the enum value at any insert call site would compile cleanly and fail at runtime.

---

## Open questions for the founder at dispatch time

These do not need answers now — they get resolved when the orchestrator picks this build up for scoping:

1. Should the pre-push hook be a hard block (push fails) or a warning (push succeeds with a notice)? Hard block is more disciplined; warning is more forgiving.
2. If Phase 2 surfaces type errors that look like real bugs (not just type tightening — actual wrong column names in production code), do those get fixed in this build or filed as separate bug-fix passes?
3. Should the generated `src/types/supabase.ts` file be excluded from code review diffs (auto-generated noise) or included (visibility into schema changes)?
