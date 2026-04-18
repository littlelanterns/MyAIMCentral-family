# Repo Stats — MyAIM Central Family Platform v2

> Measured approximately; drifts over time. Re-measure periodically when
> reasoning about context budgets, mgrep index size, or AI cost.

**Last measured:** 2026-04-18 (Phase 0.26 S5)

## Token approximations

Measurement method: file byte count ÷ ~4.8 bytes per token (empirical
ratio for this repo's mix of TypeScript, SQL, and Markdown). Order of
magnitude only — exact token counts are not worth the measurement cost.

| Path | Size | Approx tokens |
|---|---|---|
| `src/` | ~8.6 MB (709 TS/TSX files) | ~1.8M |
| `supabase/` | ~5.0 MB (56 TS + 156 SQL) | ~1.0M |
| `prds/` | ~4.5 MB (97 MD files) | ~0.9M |
| `claude/` | ~1.3 MB | ~270K |
| `.claude/` | ~681 KB | ~140K |
| **Repo total** | — | **~4-5M tokens** |

## Why this matters

- **mgrep index budget:** With `--max-file-count 3000`, the whole repo
  fits; above the default 1000, silent truncation. See `.mgrepignore`
  for exclusions keeping the index lean.
- **Claude Code context window:** 1M-context Opus fits the full `src/`
  tree with room for PRDs. 200K-context sessions cannot; rely on mgrep
  semantic chunks instead.
- **Prompt caching cost:** Larger auto-loaded files (`CLAUDE.md`,
  `claude/live_schema.md`, `WIRING_STATUS.md`) are cached between turns;
  first read is the expensive one.

## How to re-measure

```bash
du -sh src supabase prds claude .claude
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l
find supabase -type f \( -name "*.ts" -o -name "*.sql" \) | wc -l
find prds -type f -name "*.md" | wc -l
```

Divide MB size by ~4.8 for rough token estimate. Adjust ratio if the
mix of content changes significantly (e.g., more docs than code).
