# Layered Context Assembly — Implementation Spec

> **Status:** Starter spec for implementation session
> **Scope:** Shared context assembly module for all LiLa Edge Functions
> **Rule:** This document is READ-ONLY source material, same as PRDs.

---

## The Problem

Every LiLa Edge Function that assembles context currently bulk-loads everything: all Guiding Stars, all Self-Knowledge, all Archive context items, all relationship notes — regardless of whether the conversation touches those topics or people. This causes:

1. **Non sequiturs** — LiLa references irrelevant context because it's in the prompt
2. **Generic responses** — the model gets confused about what matters when 50 items are loaded and only 8 are relevant
3. **Wasted tokens** — paying for context that doesn't influence the output
4. **False "What did I add?" explanations** — Optimizer lists context that was loaded but never actually shaped the response

## The Principle

**"LiLa appears smarter by knowing less at the right time."**

If a context item isn't relevant to what the user is talking about right now, don't load it. The model produces better responses with 8 relevant items than 50 mixed ones.

---

## The Three-Layer Architecture

### Layer 1 — Always Loaded (~200 tokens)

The lightweight index. Loaded on every turn, every Edge Function, no filtering.

| Source | What's loaded | Why always |
|--------|--------------|------------|
| `family_members` | display_name, age, role, relationship for all active members | Name detection needs the roster to work |
| Current user | display_name, role | LiLa needs to know who's talking |
| Feature context | Book title(s), tool mode, page context | Grounds the conversation in what's happening |

This is ~200 tokens for a typical family. Never grows large.

### Layer 2 — On-Demand by Relevance

Fetched only when the conversation references a specific person or topic. Two trigger mechanisms:

**Trigger A: Name Detection (free, instant)**
Scan the current user message + last 2 assistant messages for family member names using word-boundary regex matching. When a name is detected, load that member's:
- Archive context items (from enabled folders, respecting three-tier toggles)
- Relevant Self-Knowledge entries (if the member has any)
- Relationship notes involving that member

If NO family member names are detected beyond the user themselves, only load the user's own context.

**Trigger B: Category/Topic Matching (lightweight)**
Match the user's message against context categories to determine which Guiding Stars and Self-Knowledge entries are relevant:
- Guiding Stars have `category` and `entry_type` fields
- Self-Knowledge has `category` (personality_type, trait_tendency, strength, growth_area, general)
- Archive folders have `folder_name` (Preferences, Schedule & Activities, Personality & Traits, etc.)

Simple keyword mapping (not AI-powered):
- Message mentions "faith/spiritual/prayer/church" → load faith_preferences + faith-category Guiding Stars
- Message mentions "goal/intention/plan/grow" → load Guiding Stars (values, declarations) + Best Intentions
- Message mentions "schedule/busy/time/week" → load schedule-related archive items
- Message mentions "personality/trait/strength/weakness" → load Self-Knowledge
- Message mentions "food/meal/diet/cook" → load food-preference archive items
- Default (no specific topic detected): load user's top 5 Guiding Stars only (the most universal context)

### Layer 3 — Search Only, Never Bulk Loaded

Accessed via semantic search (embedding similarity) when a specific question needs deep grounding. Never loaded wholesale.

| Source | Access method | When used |
|--------|-------------|-----------|
| `bookshelf_chunks` | `match_bookshelf_chunks` RPC | BookShelf discuss, when user asks about book content |
| Full extraction sets | `match_bookshelf_extractions` RPC | BookShelf discuss, semantic search |
| Journal entries | Future: semantic search RPC | When conversation references past reflections |
| Conversation history | Future: semantic search | When referencing prior LiLa conversations |

---

## Implementation Plan

### Step 1: Build `_shared/context-assembler.ts`

A shared module used by all Edge Functions. Core interface:

```typescript
interface ContextAssemblyOptions {
  familyId: string
  memberId: string
  /** The current user message (used for name detection + topic matching) */
  userMessage: string
  /** Recent conversation messages for broader name/topic detection */
  recentMessages?: Array<{ role: string; content: string }>
  /** Feature-specific context (book titles, tool mode, etc.) */
  featureContext?: string
  /** Override: always load these members' context regardless of detection */
  alwaysIncludeMembers?: string[]
  /** Override: always load these context categories */
  alwaysIncludeCategories?: string[]
  /** Max total items to return across all sources */
  maxItems?: number // default 30
}

interface AssembledContext {
  /** Layer 1: always present */
  familyRoster: string
  featureContext: string
  /** Layer 2: relevance-filtered */
  relevantContext: string
  /** Metadata for explainability */
  loadedSources: Array<{
    source: string
    memberName?: string
    reason: string  // "name detected in message" | "topic match: faith" | "always included"
    itemCount: number
  }>
}

export async function assembleContext(options: ContextAssemblyOptions): Promise<AssembledContext>
```

### Step 2: Name Detection Utility

```typescript
/**
 * Detect family member names in text using word-boundary regex.
 * Returns array of detected member IDs.
 * Also checks nicknames from family_members.nicknames column.
 */
function detectMentionedMembers(
  text: string,
  familyRoster: Array<{ id: string; display_name: string; nicknames?: string[] }>
): string[]
```

Pattern: case-insensitive, word-boundary matching. "Ruthie" matches but "truth" doesn't. Check both `display_name` and `nicknames` array.

### Step 3: Topic Keyword Mapping

```typescript
const TOPIC_CATEGORY_MAP: Record<string, string[]> = {
  // keyword patterns → archive folder names / guiding star categories to load
  'faith|spiritual|prayer|church|God|scripture': ['Faith & Values', 'faith'],
  'goal|intention|plan|grow|improve': ['guiding_stars', 'best_intentions'],
  'schedule|busy|time|week|calendar': ['Schedule & Activities'],
  'personality|trait|strength|weakness|type': ['Personality & Traits', 'self_knowledge'],
  'food|meal|diet|cook|eat|allergy': ['Preferences'],
  'school|learn|homework|curriculum|grade': ['School & Learning'],
  'health|medical|doctor|therapy|medication': ['Health & Medical'],
  'hobby|interest|sport|music|art': ['Interests & Hobbies'],
}
```

This is NOT AI-powered — it's a simple regex map. Fast, free, deterministic. Can be refined over time by adding more keyword patterns.

### Step 4: Migrate Edge Functions

Replace ad-hoc context loading in each Edge Function with a single call:

```typescript
import { assembleContext } from '../_shared/context-assembler.ts'

const ctx = await assembleContext({
  familyId: family_id,
  memberId: member_id,
  userMessage: message,
  recentMessages: conversation_history.slice(-4),
  featureContext: `Discussing book: "${bookTitle}"`,
})

const systemPrompt = `...
${ctx.familyRoster}
${ctx.featureContext}
${ctx.relevantContext}
`
```

Edge Functions to migrate (in priority order):
1. `bookshelf-discuss` — just added bulk archive loading, perfect test case
2. `lila-chat` — the core conversation engine, highest impact
3. `lila-cyrano` — already person-scoped, clean test of name detection
4. `lila-higgins-say` / `lila-higgins-navigate` — multi-person detection
5. `lila-quality-time`, `lila-gifts`, `lila-observe-serve`, `lila-words-affirmation`, `lila-gratitude`
6. `lila-decision-guide`, `lila-mediator`, `lila-perspective-shifter`
7. `lila-board-of-directors` — persona context only, lightest touch

### Step 5: Explainability Hook (Future — Optimizer)

The `loadedSources` metadata enables the Optimizer's "What did I add?" explainer to be accurate:

```
Context used:
- Ruthie (age 7): 4 items loaded (name detected in your message)
- Your Guiding Stars: 2 items loaded (topic match: parenting)
- Faith preferences: loaded (topic match: prayer)
```

Only lists what was actually fetched, because only relevant items were fetched.

---

## Per-Tool Context Overrides

Some tools always need certain context regardless of detection:

| Tool | Always load (Layer 1+) | Layer 2 trigger |
|------|----------------------|-----------------|
| Cyrano | Partner name + love language + How to Reach Me card | Name detection + topic matching on user message |
| Higgins Say/Navigate | Nothing extra | Name detection (multi-person) |
| Love Language tools | Partner basic profile | Topic matching only |
| BookShelf Discuss | Book metadata + hearted extractions | Name detection + topic matching |
| Safe Harbor | Nothing extra (privacy-first) | Minimal — only user's own context |
| Board of Directors | Persona descriptions | Name detection if personas reference real people |
| Optimizer | Depends on context preset selected | Full topic matching |

---

## What NOT to Change

- **Three-tier toggle system** (`is_included_in_ai` at person/folder/item level) — still respected. Layered loading adds relevance filtering ON TOP of permission filtering, not instead of it.
- **Privacy Filtered items** — still always excluded for non-mom regardless of relevance.
- **Safe Harbor exemption** — still excluded from all context aggregation.
- **Crisis Override** — still global, still checked on every message.

---

## Success Criteria

1. A book discussion about personal goals loads zero context about children (unless mentioned)
2. Asking Cyrano about bedtime gratitude loads partner + bedtime-related context, not career goals
3. Higgins conversation about "Jake and Emma" loads only those two children's context
4. Optimizer "What did I add?" lists only context that was actually fetched
5. Total context tokens per turn decrease by 40-60% on average
6. Response quality improves — fewer non sequiturs, more specific references

---

## Session Starter Prompt

When starting the implementation session, the builder should:

1. Read this spec fully
2. Read `claude/ai_patterns.md` for existing context assembly documentation
3. Read `supabase/functions/lila-chat/index.ts` for the current bulk-loading pattern
4. Read `supabase/functions/bookshelf-discuss/index.ts` for the newly-added archive loading (test case)
5. Read `supabase/functions/_shared/` for existing shared utilities pattern
6. Build `_shared/context-assembler.ts` first, test with `bookshelf-discuss`, then migrate others
