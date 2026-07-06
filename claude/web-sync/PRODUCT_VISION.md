# MyAIM Central — Product Vision Overview

> Paste-ready product overview for briefing AI assistants (Grok, claude.ai) and collaborators.
> Written top-down: what it is, what each part does, and how the parts wire together.
> Last updated: 2026-06-19

---

## 1. The One-Sentence Version

**MyAIM Central is a family-management and transformation platform for moms running complex households — homeschool families, disability families, ESA families — built around a family-aware AI named LiLa who actually knows *this* family, and wrapped in a celebration-only experience with no shame, no dark patterns, and a human approval step on every AI output.**

It's paired with **AI Magic for Moms (AIMfM)**, an AI-literacy membership — so the platform is both the tool *and* the place a mom learns to use AI well.

---

## 2. Who It's For

The center of gravity is always **Mom**. Every design decision serves her workflow first; everyone else in the family gets scoped access that ultimately serves her goals. The platform is built for the mom juggling:

- **Homeschooling** (curriculum, hours logging, compliance/ESA reporting)
- **Disability/special-needs coordination** (therapy notes, IEP/ISP goals, caregiver shifts)
- **Family finances** (allowance, chores-as-earnings, loans)
- **The emotional and relational labor** of running a household

The promise: *an AI partner who knows your specific family*, not another generic chatbot.

---

## 3. The Design DNA (Non-Negotiable Philosophies)

These are the rules that shape every feature. They're what make the product *the product*:

| Principle | What it means |
|---|---|
| **Human-in-the-Mix** | Every AI output passes through **Edit / Approve / Regenerate / Reject** before it's ever saved. This is simultaneously a UX pattern, a COPPA compliance mechanism, and a legal liability shield. Nothing AI writes becomes permanent without a human touching it. |
| **Mom-first** | Mom is always the primary admin with full visibility. Other roles are scoped views into her world. |
| **Family context is the differentiator** | Without context, LiLa is just a chatbot. With it, she's a partner who knows your kids, your faith, your rhythms, your history. |
| **Celebration only, never punishment** | The Victory Recorder is a "Ta-Da list" — it shows what *was* done, never what wasn't. No shame mechanics anywhere, in any shell. |
| **Buffet Principle** | Maximalist options, minimalist auto-defaults. Power is available; complexity isn't forced. |
| **Embedding-first classification** | ~90% of routine AI classification uses cheap vector embeddings, not expensive LLM calls. Total AI cost target: **under $1.00/family/month.** |
| **Templates as data, not code** | Report templates, guided modes, widget configs, routines — all database rows, so they evolve without deploys. |

---

## 4. The Five-Shell System — One Platform, Five Products

The app renders a fundamentally different interface depending on who's logged in. These aren't permission tiers stacked on one UI — they're **five distinct products** sharing a backend:

| Shell | Audience | Character |
|---|---|---|
| **Mom Shell** | Primary parent | Full command center — sidebar, QuickTasks, Smart Notepad, LiLa drawer, everything |
| **Adult Shell** | Dad / additional adults | Mom-like but scoped by granted permissions |
| **Independent Shell** | Teens | Cleaner, age-appropriate, more autonomy |
| **Guided Shell** | Kids ~8–12 | Simplified, prompted, parent-configured |
| **Play Shell** | Youngest kids | Visual, sticker-based, gamification-forward, big touch targets |

The render path: `ShellProvider → AuthGate → RoleRouter → [one of five shells]`.

**View As** lets Mom step into any member's shell as a modal overlay (not a full auth swap) to see exactly what they see.

---

## 5. LiLa — The AI That Knows Your Family

LiLa ("Little Lanterns") is the heart of the differentiator. She is explicitly a **processing partner — never a friend, therapist, or companion** — and she always bridges toward real human connection.

LiLa is defined by three things working together:

1. **A shared conversation engine** — streaming chat, with crisis detection and Human-in-the-Mix baked in.
2. **A shared context-assembly pipeline** — before every conversation, she reads the relevant family knowledge (who's being discussed, what topic, faith preferences, goals, book highlights, etc.).
3. **A shared context-*update* pipeline ("gleaning")** — she writes new understanding *back* into the family's knowledge over time. **This third piece is what makes her different from a generic AI:** she gets smarter about *your* family the longer you use her.

**How context assembly stays cheap and smart** (the "appears smarter by knowing less" principle — three layers):
- **Layer 1 (always loaded, ~200 tokens):** family roster, current user, page context.
- **Layer 2 (on-demand):** triggered by *name detection* (someone's mentioned) or *topic matching* (keywords like "faith," "school," "health" pull the right archive categories).
- **Layer 3 (search only):** deep grounding via semantic/embedding search into books and journals — never bulk-loaded.

LiLa appears in **40+ guided modes** — each one reshapes her system prompt, her context sources, and her available actions. A few categories:
- **Core:** Help (support), Assist (onboarding/guidance), Optimizer (prompt-crafting), General (chat + smart routing).
- **Growth:** Guiding Stars crafting, InnerWorkings self-discovery, LifeLantern, Family Vision Quest.
- **Relationship/Communication:** the five Love Languages tools, Cyrano (spouse romantic aid), Higgins (communication coaching).
- **ThoughtSift:** five separate thinking tools (below).
- **Safe Harbor:** emotional processing with strict privacy isolation.
- **BookShelf discussion, Meeting facilitation, homeschool report generation,** and more.

**Always-on safety:** a **global Crisis Override** runs on *every* LiLa message regardless of mode — crisis keywords immediately surface real resources (988, Crisis Text Line, etc.) and suspend coaching. A separate **Safety Monitoring** layer (keyword + async Haiku classification) watches kids' conversations by default.

---

## 6. The Major Feature Systems

Organized by what Mom is actually trying to do.

### Capture & Process
- **Smart Notepad** — an always-on right-drawer capture workspace. Autosaves, AI auto-titles, and routes content to 14 destinations. Mom dumps; the platform sorts.
- **MindSweep** — brain-dump intake (text, voice, email, screenshot, link) that classifies items embedding-first and routes them. A PWA so she can capture from anywhere.
- **Review & Route** — universal extraction: paste a blob → AI extracts items → card-by-card human review → route each one.

### Plan & Do
- **Studio** — the universal creation workshop. The mental model is five layers: *store shelves* (blank system templates) → *Mom's craft table* (customize) → *the library* (My Customized) → *deployment* (assign to kids) → *dashboard* (kids' daily use). Kids never see Studio; they see the output.
- **Tasks, Routines & Opportunities** — tasks with 13 prioritization "views" (Eisenhower, Eat-the-Frog, ABCDE, Kanban…) over the same data; multi-step routines; opportunity boards kids claim and earn from; sequential collections that drip one item at a time; Task Breaker AI that decomposes a task into subtasks.
- **Lists** — shopping, wishlist, packing, expenses, to-do, randomizer, plus auto-created system lists (Backburner, Ideas). Living shopping lists with a dedicated Shopping Mode.
- **Calendar** — family calendar with AI-assisted event intake, approval flow, recurrence via the Universal Scheduler, and task due-dates surfaced inline.
- **Meetings** — couple / parent-child / mentor / family-council meetings, AI-facilitated, with agenda items that carry forward and summaries that auto-save to the journal.
- **BigPlans** — larger project/goal management with AI planning and friction-finding.

### Grow (the transformation half of the platform)
- **Guiding Stars & Best Intentions** — personal aspirations and gentle, celebration-based intention tracking.
- **InnerWorkings** — self-knowledge exploration.
- **LifeLantern / Family Vision Quest** — personal and family vision assessment.
- **Victory Recorder & DailyCelebration** — the Ta-Da list; victories auto-route in from completions (see AIR below).
- **Rhythms & Reflections** — configurable morning/evening "rhythms" (warm, structured daily check-ins) with reflection prompts, plus weekly/monthly/quarterly cards.
- **Journal** — multi-type journaling (gratitude, reflection, quick notes, meeting notes, etc.) with privacy controls.

### Knowledge & Tools
- **BookShelf** — upload books → they're chunked, embedded, and turned into highlights, action steps, declarations, and discussion. Mom can semantically chat with her library; extractions feed LiLa's context.
- **AI Vault** — a browsable catalog of AI tools, prompt packs, tutorials, and "skills," with tier-gated two-layer titles (hook vs. method). The **AI Toolbox** is the personalized per-member launcher built from the Vault.
- **ThoughtSift** — *five separate* thinking tools (not one tool with modes): Board of Directors (persona advisory panel), Perspective Shifter, Decision Guide (15 frameworks), Mediator (conflict), Translator (tone rewrite).
- **Archives & Context** — the system of record for everything LiLa knows about each person, with the **three-tier context toggle** (Person / Category / Item) controlling exactly what reaches the AI.

### Family Coordination
- **Messages, Requests & Notifications** — three-level messaging (Spaces → Threads → Messages), before-send coaching, family requests, and a notification system that's distinct from the action-needed Queue.
- **Family Hub** — a shared family-tablet/TV surface (countdowns, family victories, slideshow).
- **Out of Nest** — grown descendants who get conversation spaces and feed updates but no family tools.

### Kids' Motivation & Money
- **Gamification / Play Dashboard / Sticker Book** — kids earn creatures, unlock sticker-book pages and coloring reveals, build streaks. Mom-configurable earning strategies (random roll, every-N, segment-complete, complete-the-day). Always additive — earned rewards are never taken away.
- **Tracking, Allowance & Financial** — chores-as-earnings with an **append-only financial ledger**, multi-pool allowance, loans, and homeschool hour logging. Financial data is a hard privacy boundary — never enters LiLa's context.
- **Kids' My Rewards page** (current active build) — unifying the reward surfaces: points, finances, custom rewards, victories, creature pages, coloring, and a propose-a-reward flow.

### Safety & Sensitive
- **Safe Harbor** — emotional-processing conversations that are *completely isolated* — exempt from all aggregation, reporting, spousal transparency, and context assembly.
- **Caregiver Tools / Special Adults** — shift-scoped access for grandparents/caregivers; co-parent access windows.

---

## 7. The Connective Tissue — How It All Wires Together

This is the "Rube Goldberg machine" — the universal patterns that make every piece connect to every other piece. **This is the most important section for understanding the architecture.**

- **`studio_queue` — the universal intake funnel.** Tasks, list items, calendar events, etc. from Notepad, LiLa, meetings, requests, and MindSweep *all* land in one queue. The **Universal Queue Modal** (tabs: Calendar / Sort / Requests) is Mom's single decision inbox.

- **RoutingStrip — route anything anywhere.** One universal grid component sends an item to any of ~14 destinations (Tasks, Journal, Victory, Guiding Stars, Calendar, Backburner…). Built once, used everywhere.

- **AIR (Automatic Intelligent Routing).** Achievements silently become victories — a completed task, a logged intention, a widget milestone — without anyone clicking "record victory." Celebration happens automatically.

- **The Connector Layer (contracts → deed firings → "godmothers").** This is the newest and most powerful abstraction. When something *happens* (a task completes, an intention iterates), the app writes a **deed firing**. A central **contracts** table evaluates IF-conditions and dispatches **godmothers** — small specialized handlers that grant money, points, creatures, page unlocks, prizes, victories, or custom rewards. This decoupled the "what happened" from the "what reward results," so Mom can author reward rules without code.

- **The Member-Day Obligations canonical source.** A single function — `get_member_day_obligations` — is the *one* authoritative answer to "what counts for this kid on this day?" Every measurement surface (dashboards, allowance math, gamification, homework hours) derives from it, enforcing the **dashboard-truth invariant**: if it's not on the kid's dashboard that day, it can't count toward any reward math that day.

- **The Embedding Pipeline.** Text-bearing rows get queued (async, never on write), embedded via OpenAI, and stored as vectors — powering semantic search, MindSweep classification, and LiLa's Layer 3.

- **The three-tier context toggle (`is_included_in_ai`).** Person → Category → Item. All three must be ON for anything to reach LiLa. Privacy-Filtered items are *never* shared with non-mom, regardless of toggles — a hard system boundary.

- **Universal Scheduler & Universal Timer.** Every recurrence anywhere uses one scheduler (RRULE-based); every duration anywhere uses one timestamp-based timer. No feature builds its own.

- **Permission Layer.** `<PermissionGate>` + `useCanAccess()` — tier threshold + member toggle + founding override. During beta, everything's unlocked, but the infrastructure is fully in place.

The throughline: **capture anywhere → classify cheaply → review with a human → route universally → measure from one source of truth → reward through one connector → celebrate automatically.**

---

## 8. The Business Model

Four subscription tiers (Essential $9.99 → Enhanced $16.99 → Full Magic $24.99 → Creator $39.99), with **lifetime-locked founding rates** for the first 100 families. AI metering applies only to expensive (Sonnet-level) operations; the embedding-first architecture keeps marginal cost near zero.

---

## 9. Tech Foundation

Vite + React 19 + TypeScript · Supabase (Postgres, Auth, Storage, Edge Functions, Realtime) · Claude Sonnet/Haiku via OpenRouter + OpenAI embeddings · Vercel · Tailwind + CSS-custom-property theming (38 themes) · Lucide icons (no emoji anywhere) · pgvector / pgmq / pg_cron / pg_net.
