# Corrected Conventions — Compiled from All PRDs

> **Generated from full PRD audit 2026-03-23**
> **Source:** "CLAUDE.md Additions" sections from all 42 PRDs + addenda

---

## 1. Database Conventions

- **All tables:** snake_case names. No nautical names. Never renamed once created. UUID PKs with `gen_random_uuid()`.
- **Timestamps:** `created_at TIMESTAMPTZ DEFAULT now() NOT NULL` on all tables. `updated_at` on mutable tables with BEFORE UPDATE trigger.
- **Soft deletes:** Use `archived_at TIMESTAMPTZ NULL` pattern. Non-null = archived.
- **RLS:** Every table MUST have RLS enabled. Every query passes through `auth.uid()` → `family_members` to resolve family and role.
- **Embeddings:** `halfvec(1536)` with HNSW indexes. Async queue via pgmq → `embed` Edge Function → OpenAI. Never synchronous.
- **Append-only tables:** `gamification_events`, `ai_credits`, `activity_log_entries`, `intention_iterations` — never UPDATE or DELETE.

## 2. Feature Naming

- **Compound capitals in code:** LifeLantern, InnerWorkings, GuidingStars, BestIntentions, BookShelf, ThoughtSift, BigPlans, MindSweep, DailyCelebration, SafeHarbor
- **Feature keys:** snake_case (`guiding_stars_basic`, `lila_optimizer`, `safe_harbor`)
- **Component files:** PascalCase (`GuidingStarCard.tsx`, `PermissionGate.tsx`)
- **Hook files:** camelCase with `use` prefix (`useCanAccess.ts`, `useTheme.ts`)
- **Edge Functions:** kebab-case (`lila-chat`, `mindsweep-sort`)
- **CSS variables:** kebab-case with prefix (`--vibe-primary`, `--theme-accent`)
- **Icons:** Lucide React only. No emoji in adult interfaces. Emoji permitted only in Play shell.

## 3. LiLa Conventions

- LiLa = "Little Lanterns" (company: Three Little Lanterns). Avatar character is LiLa Crew. NOT "Little Lady."
- LiLa is a processing partner, NEVER a friend, therapist, or companion.
- Never guilt, shame, or manipulate. Always bridge toward real human connection.
- Four canonical avatars: LiLa Help, LiLa Assist, LiLa Optimizer, Sitting LiLa.
- Three floating buttons: Mom shell only. Help, Assist, Optimizer.
- LiLa drawer is mom-only for MVP. Others access via permission-gated modals.
- Conversation engine is container-agnostic (drawer for mom, modals for others).
- Every guided mode MUST have 2+ rotating opening message variants.
- Model routing: Sonnet for emotional/complex, Haiku for utilitarian/extraction.
- "Talk Up" philosophy for teen/guided: assume slightly more mature, never condescending.
- Parent-Connection-First: always encourage talking to parents.
- LiLaEdge: internal backend name. Not user-facing.

## 4. Context Assembly

- Three-tier toggles: Person level → Category level → Item level via `is_included_in_ai`.
- Privacy Filtered (`is_privacy_filtered = true`): NEVER included in non-mom context assembly. System-enforced hard boundary.
- Safe Harbor (`is_safe_harbor = true`): EXEMPT from ALL data aggregation, spousal transparency, reports, context freshness. Filter always.
- Crisis Override: GLOBAL — applies to ALL LiLa conversations. Every system prompt must include crisis detection.
- Per-turn semantic refresh (P9): Don't carry stale context through long conversations.
- Selective loading: InnerWorkings loaded only when personality context improves response (not always-on like Guiding Stars).
- Guiding Stars loaded as baseline identity context in every LiLa system prompt.
- Best Intentions loaded as topical context when conversation topic matches tags/related_members.

## 5. Human-in-the-Mix

Every AI-generated output MUST present four options before persisting:
1. **Edit** — User modifies
2. **Approve** — Save as-is
3. **Regenerate** — New version
4. **Reject** — Discard

## 6. Permission System

- Three layers checked in order: (1) Tier threshold from `feature_access_v2`, (2) Member toggle from `member_feature_toggles`, (3) Founding family override (bypasses Layer 1 only).
- `<PermissionGate featureKey="xxx">` wraps feature-gated UI.
- `useCanAccess(featureKey, memberId?)` returns `{ allowed, blockedBy, upgradeTier? }`.
- `usePermission(action, targetMemberId?, featureKey?)` for role-based access.
- During beta: `useCanAccess` returns true for everything.
- Mom sees all. Dad default is DENY. Special Adults default DENY outside shifts.
- Mom sees tier-locked features greyed/blurred (upsell). Others see inaccessible features HIDDEN entirely.
- Four access levels: none, view, contribute, manage.
- `member_feature_toggles` is pre-populated (not sparse). Every member has a row for every feature.

## 7. Shell System

- Five shells: Mom (`MomLayout`), Adult (`AdultLayout`), Independent (`IndependentLayout`), Guided (`GuidedLayout`), Play (`PlayLayout`), plus Special Adult (`CaregiverLayout`).
- Shell routing: `getShellForMember()` reads `role` + `dashboard_mode`.
- Hub is standalone layout (`/hub`), not a shell.
- Perspective switcher: Mom gets 4 tabs (My Dashboard, Family Overview, Hub, View As). Dad/Adult gets My Dashboard + Hub (+ Family Overview if permitted). Independent gets My Dashboard + Hub. Guided/Play: no switcher.
- Auto-collapse priority: QuickTasks → Smart Notepad → Sidebar → LiLa → Main Content (never).
- Sidebar visibility: Mom sees tier-locked greyed. Others see inaccessible HIDDEN.

## 8. CSS / Theming

- Mobile-first responsive (375px baseline).
- Tailwind CSS + CSS custom properties for theme tokens.
- `--vibe-*` for structural tokens, `--theme-*` for color tokens.
- Shell-aware scaling: Play (bounciest) → Guided (moderate) → Independent/Adult (subtle).
- No hardcoded colors — always use theme tokens.
- Dark mode: `prefers-color-scheme` + user toggle (`theme_preferences.dark_mode`).
- Dashboard backgrounds (PRD-24A) are cosmetic images independent of PRD-03 color themes.
- Gold celebratory effects: ONLY on Victory Recorder, DailyCelebration, and streak milestones.
- `prefers-reduced-motion` respected. Every animation has a static fallback.
- All animations use `transform` and `opacity` only. No layout-triggering properties.

## 9. Task System

- Three-page model: Studio → Tasks → Dashboard.
- Routines: `task_type = 'routine'` with sectioned sub-step checklists.
- Opportunities: three sub-types (repeatable, claimable, capped).
- Sequential collections drip-feed tasks.
- 14 prioritization views share same data.
- Fresh Reset is default for routines.
- "Unmark anywhere = unmark everywhere" — all rewards/tracking cascade.
- Task rewards handled by PRD-24 gamification pipeline (not `task_rewards` table).

## 10. Queue & Routing

- `studio_queue` is the universal intake funnel (PRD-17 authoritative, PRD-17B additions).
- All items entering task/list/tracker creation go through `studio_queue`.
- `RoutingStrip` component used everywhere items route between features.
- Universal Queue Modal: tabbed modal for pending approvals (Calendar, Sort, Requests).
- Breathing Glow: universal presence indicator for pending items (no numeric badges).

## 11. Victory & Celebration

- Victory Recorder is celebration-only. NEVER shows incomplete tasks.
- Celebration text: identity-based, not performance-based. Never generic. Never "I'm so proud of you."
- Small steps honored. Variety required daily. Sincerity over enthusiasm.
- Summarize, don't itemize.
- Auto-routed victories always silent.
- `VictoryRecorder` = adult/teen. `DailyCelebration` = kid (5-step sequence).
- DailyCelebration Step 4 has 3 sub-steps: A (collectible reveal), B (stage evolution), C (points).

## 12. Smart Notepad

- Right drawer, tabs, "Send to..." grid with 14+ destinations.
- Review & Route: universal reusable extraction component (PRD-08).
- Journal's `+` button opens Smart Notepad — Journal is NOT a direct writing surface.
- "Note" routes to `journal_entries` with `entry_type = 'quick_note'`.
- Merciful extraction defaults: if uncertain → Journal.

## 13. Embedding Pipeline

- Model: OpenAI `text-embedding-3-small` (1536 dimensions, $0.02/M tokens).
- Storage: `halfvec(1536)` for cost efficiency.
- Queue: pgmq `embedding_jobs` queue.
- Processing: `pg_cron` every 10 seconds → `embed` Edge Function.
- Generic trigger: `util.queue_embedding_job()` on content column changes.
- Search: `match_by_embedding()` generic Postgres function.

## 14. AI Cost Optimization (9 Patterns)

| Pattern | Name | Key Rule |
|---------|------|----------|
| P1 | Semantic Context Assembly | pgvector replaces category-based loading |
| P2 | Embedding-Based Classification | Replaces ALL Haiku auto-tagging calls |
| P3 | Embedding Delta Detection | Only triggers AI when genuinely new info |
| P4 | Smart Regeneration | Skip regeneration when content unchanged |
| P5 | On-Demand Secondary Output | Generate extras only on user request via action chips |
| P6 | Prompt Pattern Caching | Cache successful prompt structures |
| P7 | Per-Member Context Caching | Pre-assemble frequently-needed context |
| P8 | Shared Persona Library | Generate personas once, reuse |
| P9 | Per-Turn Context Refresh | Refresh semantic context each turn |

## 15. Platform Intelligence Pipeline

- Separate `platform_intelligence` schema. Never write family-identifiable data.
- 12 capture channels (A-L), all wired from day one.
- Three-layer ethics filter: Haiku gate → Sonnet scan → admin review.
- Synthesized wisdom over book attribution — LiLa never cites single sources.
- Auto-reject coercion/manipulation/force frameworks.
- Safe Harbor (Channel I): structure ONLY, never content.
- Deities blocked as speaking personas → redirect to "Prayer Seat".

## 16. Gamification

- Opt-in, mom-configured per child. `gamification_configs.enabled` gates everything.
- `gamification_events` append-only.
- Points hierarchy: task-specific override > member base rate > shell default.
- Streaks schedule-aware by default. Grace days configurable.
- Unchosen items (card flip, three doors) NEVER reveal what was on them.
- Currency name/icon per-child. Never hardcode "stars" or "points".
- Play leaderboard: collaborative framing only, never competitive ranking.
- Treasure box videos: WebM primary, MP4 fallback, `playsinline muted`, poster frame.
- Reveal types: 8 first-class types. Video-based and CSS/SVG interactive. Both end with shared reward card + sparkle overlay.

## 17. BookShelf

- BookShelf is compound OneWord. Table prefix `bookshelf_`.
- Chunks at platform level (`book_cache`), not per-family.
- Chapter-aware chunking (never crosses boundaries).
- Extraction: 5 tabs (Summaries, Insights, Declarations, Action Steps, Questions).
- Declaration extraction follows Art of Honest Declarations (5 voices, 3 richness levels).
- Platform book cache with 0.9 similarity threshold.
- Ethics pipeline on cache, not family uploads.
- `journal_prompts` NOT prefixed with `bookshelf_`.

## 18. Safe Harbor

- EXEMPT from all data aggregation, spousal transparency, reports.
- LiLa NEVER labels situations as abuse or provides diagnoses.
- Paints picture of healthy dynamics, acknowledges gaps, bridges to safe humans.
- Arc: Validate → Curiosity → Empower.
- Three-tier escalation: Normal → Professional Referral → Crisis Override.

## 19. Archives & Context

- Archives is the context management engine. Mom-only browsing by default.
- Aggregation is query-time, never copy. "Checked somewhere, checked everywhere."
- Privacy Filtered: hard system-enforced boundary.
- Auto-creation on member add: member_root + 7 category subfolders + wishlist folder.
- Context learning write-back: direct save on approval, no review queue.

## 20. Universal Scheduler (PRD-35)

- All recurrence patterns use RRULE JSONB format.
- Universal Scheduler component replaces all custom recurrence pickers.
- Never build a custom recurrence picker for tasks, calendar, meetings, or rhythms.

## 21. Activity Logging

All significant user actions log to `activity_log_entries`:
```typescript
await logActivity({ family_id, member_id, event_type, source_table, source_id, metadata });
```

## 22. Error Handling

- User-facing: friendly toast messages. Never raw error strings.
- LiLa errors: "I had trouble with that. Want to try again?"
- Network errors: offline banner + pending-changes indicator.

## 23. TypeScript

- Strict mode enabled. Types generated from Supabase schema.
- Prefer `interface` for objects; `type` for unions/intersections.
- No `any` — use `unknown` + type guards.
- `async`/`await` over `.then()` chains.

## 24. Stub Conventions

- Comment: `// STUB: [description] — wires to PRD-XX`
- Register in STUB_REGISTRY.md
- UI renders `<PlannedExpansionCard featureKey="xxx" />`
- Never create empty files — stubs are documented intentions only.

## 25. PRD Source of Truth Rule

- **PRDs are the ONLY source of truth for building features.**
- Before writing ANY code, read the FULL PRD file + any related addenda in `prds/addenda/`.
- `database_schema.md` is a summary reference — NOT authoritative.
- If `database_schema.md` conflicts with a PRD, the PRD wins.
- If two PRDs conflict, the newer one wins.
- Never modify files in `prds/`, `specs/`, or `reference/`.

## 26. Pricing (PRD-31 Authoritative)

| Tier | Monthly | Founding Rate |
|------|---------|---------------|
| Essential | $9.99 | $7.99 |
| Enhanced | $16.99 | $13.99 |
| Full Magic | $24.99 | $20.99 |
| Creator | $39.99 | $34.99 |

100 founding family limit. Founding rates are lifetime locks.
