# MyAIM Central — Family Platform v2

## Project Overview

MyAIM Central is a comprehensive family management and transformation platform built for AI-curious moms managing complex households. The platform serves as a personal growth companion, family coordination hub, and AI skill-building resource — all wrapped in a warm, celebration-only experience with no punishment mechanics, no dark patterns, and no shame.

The AI assistant is named **LiLa** (Little Lanterns). LiLa is a processing partner, never a friend, therapist, or companion. Every AI output follows the **Human-in-the-Mix** pattern: Edit / Approve / Regenerate / Reject before saving. The platform follows the **Buffet Principle**: maximalist options, minimalist auto-defaults.

The platform supports five family member roles (Mom, Dad/Additional Adult, Special Adult/Caregiver, Independent Teen, Guided/Play Children) with role-based shells that adapt the entire UI experience. Mom is always the primary administrator with full visibility. The platform is being built by a solo founder (Tenise) with AI assistance.

## Tech Stack

- **Frontend:** Vite + React 19 + TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime)
- **AI Models:** Claude Sonnet via OpenRouter (primary), Haiku (lightweight), OpenAI text-embedding-3-small (embeddings)
- **Hosting:** Vercel
- **Styling:** Tailwind CSS + CSS custom properties for theming
- **Icons:** Lucide React (no emoji in adult interfaces; emoji only in Play shell)
- **Scheduling:** rrule.js (RFC 5545)
- **Payments:** Stripe
- **Extensions:** pgvector, pgmq, pg_net, pg_cron

## Key Architectural Patterns

- **Five-Shell System:** Mom, Adult, Independent, Guided, Play — each with distinct layouts and capabilities
- **Three-Tier Context Toggle:** Person / Category / Item level AI inclusion control
- **Permission Layer:** `<PermissionGate>` + `useCanAccess()` — tier threshold + member toggle + founding override
- **RoutingStrip:** Universal grid component for routing items between features
- **Automatic Intelligent Routing (AIR):** Silent auto-routing of victories from task completions, intention iterations, widget milestones
- **Embedding Pipeline:** Async queue-based (pgmq → embed Edge Function → OpenAI), never synchronous
- **Celebration Only:** Victory Recorder is a Ta-Da list. No punishment mechanics anywhere.

## Detailed Documentation

@claude/architecture.md
@claude/database_schema.md
@claude/conventions.md
@claude/ai_patterns.md
@claude/feature_glossary.md

## Critical Conventions (Apply to ALL Code)

1. **Database tables:** snake_case. No nautical names. No exceptions.
2. **Feature names:** Compound capitals — LifeLantern, InnerWorkings, GuidingStars, BestIntentions, BookShelf, ThoughtSift, BigPlans, MindSweep, DailyCelebration
3. **Every table MUST have RLS enabled.** Mom sees all within family. Other roles scoped per PRD-02.
4. **Every AI output MUST go through Human-in-the-Mix** (Edit/Approve/Regenerate/Reject) before persisting.
5. **Never synchronous AI calls on write.** Embeddings are always async via queue.
6. **Safe Harbor conversations are EXEMPT** from all data aggregation, spousal transparency, reports, and context freshness processes. Filter with `is_safe_harbor`.
7. **Crisis Override is GLOBAL** — applies to ALL LiLa conversations, not just Safe Harbor. Every system prompt must include crisis detection.
8. **`is_included_in_ai` pattern:** Every context source has this boolean (default true). Three-tier toggles control inclusion.
9. **Feature keys:** Register in `feature_key_registry`, gate with `<PermissionGate>`, check with `useCanAccess()`.
10. **During beta:** `useCanAccess()` returns true for everything (all tiers unlocked). Infrastructure must still be in place.
11. **PRDs are the source of truth.** If a spec doc conflicts with a PRD, the PRD wins. If two PRDs conflict, the newer one wins.
12. **Never modify files in `prds/`, `specs/`, or `reference/`.** These are read-only source material.

## Pricing (PRD-31 Authoritative)

| Tier | Monthly | Founding Rate |
|------|---------|---------------|
| Essential | $9.99 | $7.99 |
| Enhanced | $16.99 | $13.99 |
| Full Magic | $24.99 | $20.99 |
| Creator | $39.99 | $34.99 |

100 founding family limit. Founding rates are lifetime locks with growing dollar discount.
