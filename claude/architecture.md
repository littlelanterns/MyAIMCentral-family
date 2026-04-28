# MyAIM Central — Architecture

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 19 + TypeScript |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions, Realtime) |
| AI (primary) | Claude Sonnet via OpenRouter |
| AI (lightweight) | Claude Haiku |
| Embeddings | OpenAI text-embedding-3-small |
| Hosting | Vercel |
| Styling | Tailwind CSS + CSS custom properties for theming |
| Icons | Lucide React (no emoji anywhere in the app, including Play shell) |
| Scheduling | rrule.js (RFC 5545) |
| Payments | Stripe |

---

## Five-Shell System (PRD-04)

The app renders different layouts based on the active member's role. Each shell controls sidebar behavior, drawer availability, theming intensity, and feature scoping.

| Shell | Audience | Key Characteristics |
|-------|----------|-------------------|
| **Mom Shell** | Primary parent | Full sidebar, QuickTasks drawer, Smart Notepad, LiLa drawer, all features |
| **Adult Shell** | Other adults | Similar to Mom but scoped permissions (no family management, no teen access controls) |
| **Independent Shell** | Teens | Age-appropriate features, cleaner UI |
| **Guided Shell** | Younger children | Simplified, prompted interactions, parent-configured |
| **Play Shell** | Youngest members | Visual, sticker-based, icon-library-driven, gamification-forward |

### Shell Component Tree

```
<ShellProvider>
  <AuthGate>
    <RoleRouter>
      <MomShell /> | <AdultShell /> | <IndependentShell /> | <GuidedShell /> | <PlayShell />
    </RoleRouter>
  </AuthGate>
</ShellProvider>
```

---

## Five Interaction Zones

1. **Left Sidebar** -- Navigation; expanded on desktop, collapsible, hamburger on mobile.
2. **Top QuickTasks Drawer** -- Horizontal scroll of quick actions, auto-sorted by frequency.
3. **Right Smart Notepad** -- Always-on capture workspace with tabs (PRD-08).
4. **Bottom LiLa Chat Drawer** -- Pull-up conversational AI interface. Mom gets drawer; others get modals.
5. **Center Main Content Area** -- Responsive to drawer states.

---

## Routing Structure

### Public / Auth

| Route | Purpose |
|-------|---------|
| `/` | Public blog (aimagicformoms.com) or redirect to dashboard (myaimcentral.com) |
| `/auth/*` | Authentication flows |

### Core Feature Routes

| Route | Feature |
|-------|---------|
| `/dashboard` | Personal dashboard (perspective switcher for mom) |
| `/family-hub` | Family Hub shared surface |
| `/family-hub/tv` | TV mode (landscape PWA) |
| `/tasks` | Tasks |
| `/lists` | Lists |
| `/calendar` | Calendar |
| `/meetings` | Meetings |
| `/messages` | Messaging |
| `/journal` | Journal with tag-filtered views |
| `/notepad` | Smart Notepad (also accessible as right drawer) |

### Transformation & Self-Knowledge Routes

| Route | Feature |
|-------|---------|
| `/guiding-stars` | Guiding Stars and Best Intentions |
| `/inner-workings` | InnerWorkings (self-knowledge) |
| `/life-lantern` | Personal LifeLantern assessment |
| `/family-vision` | Family Vision Quest |
| `/safe-harbor` | Safe Harbor emotional processing |
| `/victories` | Victory Recorder |

### Tools & Content Routes

| Route | Feature |
|-------|---------|
| `/studio` | Studio (template workshop) |
| `/vault` | AI Vault (browse, tools, BookShelf) |
| `/vault/bookshelf` | BookShelf |
| `/bigplans` | BigPlans project management |
| `/thoughtsift/*` | ThoughtSift tools (5 separate tools) |
| `/archives` | Archives and Context management |
| `/family-feed` | Family Feeds |

### System Routes

| Route | Feature |
|-------|---------|
| `/settings` | Settings overlay |
| `/admin/*` | Admin Console (tabbed: System, Analytics, Feedback, AI Vault, Moderation) |
| `/sweep` | MindSweep PWA entry |
| `/feed` | Out of Nest feed entry |

---

## Source Directory Layout

```
/src
  /components        UI components (shell-specific subdirectories)
  /features          Feature modules (one per PRD domain)
  /hooks             Shared React hooks
  /lib
    /supabase        Supabase client, auth helpers
    /ai              LiLa context assembly, model routing
    /permissions     useCanAccess, PermissionGate
    /theme           Theme provider, vibe system
  /types             TypeScript types (generated from Supabase)
  /utils             Shared utilities
```

---

## Permission Layer

- **`<PermissionGate featureKey="xxx">`** -- Wraps any feature-gated UI.
- **`useCanAccess(featureKey, memberId?)`** -- Three-layer check: tier threshold + member toggle + founding override.
- **`<ViewAsProvider>`** -- Mom can view as any family member (scoped by PRD-02).

---

## Theme System (PRD-03)

- CSS custom properties driven by `--vibe-*` and `--theme-*` tokens.
- 9 theme families, 50+ color themes.
- Gradient toggle per user.
- Dark mode support.
- Shell-aware token scaling: Play = bounciest, Adult = subtle.

---

## State Management

| Concern | Approach |
|---------|----------|
| Live data (messages, notifications, task completions) | Supabase Realtime |
| Server state | React Query (TanStack Query) with optimistic updates |
| Shell state, theme, permissions, active member | React Context |
| Global client state store | None -- server-first architecture |

---

## Edge Functions (Supabase)

| Function | Purpose |
|----------|---------|
| `embed` | Generic embedding function (processes pgmq queue, calls OpenAI) |
| `lila-chat` | LiLa conversation handler (context assembly, model call, stream response) |
| `ai-parse` | Non-streaming utility AI (parsing, sorting, classifying) |
| `whisper-transcribe` | Voice-to-text transcription via OpenAI Whisper API |
| `mindsweep-sort` | MindSweep classification and routing |
| `schedule-extract` | Parse schedule intent from text |
| `blog-comment-moderate` | Haiku auto-moderation for blog comments |
| `blog-publish-scheduled` | Cron for scheduled blog post publishing |
| `safety-classify` | Haiku conversation classification for safety monitoring |
| `anonymize` | Platform Intelligence Pipeline anonymization |
| `monthly-aggregate` | Monthly data aggregation (billing day trigger) |
| `report-generate` | Template-based report generation |

---

## Database Infrastructure

| Extension | Usage |
|-----------|-------|
| **pgvector** | Embeddings with HNSW indexes, `halfvec(1536)` |
| **pgmq** | Message queue for async embedding jobs |
| **pg_cron** | Scheduled jobs (embedding queue every 10s, blog publishing every 15m, voice recording cleanup daily) |
| **pg_net** | HTTP calls from database functions |

---

## Responsive Design

| Breakpoint | Behavior |
|------------|----------|
| 375px (baseline) | Mobile-first |
| 768px (tablet) | Sidebars become overlays |
| 1024px (desktop) | Full multi-zone layout |
| 1920px (TV mode) | Landscape-locked Family Hub |

---

## PWA Entry Points (PRD-33)

Five installable PWA surfaces:

1. `/hub` -- Family Hub
2. `/hub/tv` -- Family TV (landscape)
3. `/dashboard` -- MyAIM personal
4. `/sweep` -- MindSweep
5. `/feed` -- Out of Nest family feed

---

## Perspective Switcher (Mom Only)

Mom can toggle between:

- **Personal Dashboard** -- Her own view.
- **Family Overview** -- Aggregated all-member view.
- **Family Hub** -- Shared coordination surface.
- **View As [Member]** -- See what any family member sees.

---

## Universal Patterns

| Pattern | Description |
|---------|-------------|
| **Human-in-the-Mix** | Every AI output offers Edit / Approve / Regenerate / Reject |
| **Buffet Principle** | Maximalist options, minimalist auto-defaults |
| **Celebration Only** | No punishment mechanics anywhere |
| **Three-Tier Context Toggle** | Person / Category / Item level AI inclusion |
| **RoutingStrip** | Universal grid component for routing items between features |
| **Universal Queue Modal** | Tabbed modal for pending approvals (Calendar, Sort, Requests) |
| **Breathing Glow** | Universal presence indicator for pending items (no numeric badges) |
| **PlannedExpansionCard** | Single-prop component for stubbed features with demand validation |
