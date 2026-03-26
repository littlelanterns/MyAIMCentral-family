# MyAIM Family

**Infrastructure for the people who hold families together.**

MyAIM Family is a comprehensive family management and transformation platform paired with AI Magic for Moms (AIMfM), an AI literacy membership — sold together because the platform IS the curriculum. Buy one, get both. The app manages a family's most complex logistics while teaching moms the AI skills that will define the next decade of their lives.

Built by a self-taught mom of nine. Powered by the same AI tools it teaches. A predecessor app (StewardShip) is actively used by the founder's family every day. This isn't a concept — it's a working system being rebuilt properly for every family.

---

## The Problem

Moms are the original systems thinkers, project managers, therapists, schedulers, educators, mediators, and CFOs of the household — all unpaid, largely unseen, and chronically underserved by technology.

Existing tools fail because they were designed for one person or one use case, not a whole family:

- **Cozi** tracks a calendar. It doesn't know your daughter has Down Syndrome and needs aide coordination across three caregivers.
- **OurHome** assigns chores. It can't simultaneously count a chore toward allowance, homeschool hours, and behavioral tracking.
- **Notion** is infinitely flexible. It's also infinitely empty — a mom at 11pm doesn't need a blank page, she needs a system that already knows her family.
- **ChatGPT** can help with anything. It can't help with *your* family — it doesn't know your Guiding Stars, your teenager's communication style, or your 7-year-old's therapy schedule.

Meanwhile, the AI revolution is transforming every industry — but nobody is building AI tools designed for the ~85 million American moms who run the most complex organizations on Earth: their families.

**MyAIM changes that.**

---

## The Solution

### Two Products, One Mission

**MyAIM Family** — A family management platform where AI knows your whole family. Not a chatbot wrapped in a form — a context-aware system that assembles knowledge about each family member, their needs, their goals, their relationships, and uses that context to make every interaction specific to *this* family.

**AI Magic for Moms (AIMfM)** — An AI literacy membership that teaches durable frameworks and portable skills, not button-clicking tutorials that are outdated next month. The platform itself is the proof of concept: "I built this with AI. Let me show you how."

### How It Works

1. **Capture** — Mom dumps thoughts via voice, text, or stream of consciousness. MindSweep and Smart Notepad catch everything.
2. **Sort** — LiLa (our AI assistant) categorizes, prioritizes, and routes each item to the right place: tasks, calendar, journal, a family member's queue, or a decision that needs thinking.
3. **Route** — Review & Route presents the daily avalanche as an organized triage, not a pile. Mom decides. AI suggests. Human-in-the-Mix always.

### The AI Difference: Context Assembly

LiLa (Little Lanterns) isn't a chatbot. She's a family of specialized AI modes unified by a shared context assembly pipeline. When mom asks LiLa for help with dinner, the response already knows:

- Her 11-year-old is learning to cook (Best Intentions)
- Her 4-year-old needs to be included (Guiding Stars)
- Her husband prefers simple meals on weeknights (InnerWorkings)
- Tuesday is therapy day so dinner needs to be fast (Calendar context)
- The family is doing a "try one new food per week" challenge (Family Goals)

That context is the product. No competitor assembles it. No generic AI has it.

### Human-in-the-Mix

Every AI output has four buttons: **Edit, Approve, Regenerate, Reject.** This isn't just good design — it's the only ethical choice for a platform handling children's data, disability documentation, and family finances. It's also COPPA compliance by architecture: mom reviews everything before it becomes permanent.

### Five Shells, Five Experiences

A 7-year-old with Down Syndrome and her mom are fundamentally different users. They don't need the same app with different settings — they need different experiences:

| Shell | Who | Experience |
|-------|-----|-----------|
| **Mom** | Primary parent | Full command center, LiLa drawer, every tool |
| **Adult** | Dad, co-parent, caregivers | Scoped view of assigned members + communication tools |
| **Independent** | Teens (13+) | Self-directed tools, Safe Harbor, age-appropriate AI access |
| **Guided** | Kids (8-12) | Simplified interface, gamified, parent-approved interactions |
| **Play** | Young children | Large icons, celebration-focused, fully parent-controlled |

---

## Who This Serves

**~85 million US moms** — but especially the ones carrying the heaviest invisible loads:

- **Homeschool families (~3.3M households)** — Compliance reporting, portfolio tracking, ESA invoice generation. Documentation that used to take hours, done in minutes.
- **Disability families (~4.5M children)** — SDS monthly reports, ISP goal tracking, aide coordination, symptom tracking, therapy attendance. The founder's 7-year-old daughter Ruthie has Down Syndrome — this was built from lived experience.
- **ESA-eligible families (11+ states and growing)** — Education Savings Account invoices at every subscription tier. Families are leaving thousands of dollars on the table because the paperwork is too hard. MyAIM makes it automatic.
- **Every mom managing the mental load** — The calendar-counselor-cook-cashier who wakes up already behind. The former project manager drowning in family logistics. The brilliant homeschool mom with no degree who doesn't know AI just dissolved every barrier that contained her.

### The Ripple Effect

Help a mom → help everyone she holds. Mom gets capacity back → kids get a more present parent. Mom learns AI literacy → teaches it to her kids. Homeschool documentation flows → ESA funding flows → financial stability. Disability reporting gets automated → caregiver burnout reduced → more time with the child, less time on paperwork. Teen learns responsible AI use → next generation prepared.

Every ripple starts with one mom opening an app.

---

## Technology

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Vite + React 19 + TypeScript + Tailwind | Fast, modern, type-safe |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) | One platform, tight security, RLS for family data isolation |
| Embeddings | pgvector + text-embedding-3-small | Semantic classification at ~$0.01/family/month — embedding-first classification handles ~90% of routine items before any LLM call |
| AI Routing | OpenRouter | Multi-model routing (Sonnet for complex, Haiku for utilitarian), cost optimization, model flexibility |
| Async Processing | pgmq | Queue-based pipeline for embeddings, AI generation, background tasks |
| Scheduling | rrule.js (RFC 5545) | Full recurrence rule support — "2nd and 4th Wednesdays" is a real schedule in this family |
| Testing | Playwright | E2E testing infrastructure, 21 passing / 0 failing |
| Deployment | Vercel | Automatic deployments, edge functions |
| Voice | Web Speech API + Whisper | Voice input everywhere — a mom's hands are never free |

**Total AI cost: < $1.00/family/month.** Nine optimization patterns (P1-P9) keep costs disciplined without sacrificing experience. Embedding-based auto-tagging replaces expensive LLM calls for classification. On-demand secondary outputs via action chips instead of pre-generating everything. Per-turn semantic context refresh instead of stuffing full conversation history.

---

## Live Demo

**URL:** https://myaimcentral.com

### Create Your Own Account
Start fresh. Experience the onboarding flow. Add your own family.

### Sign In as the Testworth Family
A pre-seeded family with real context so you can see what a lived-in platform looks like.

| Member | Age | Role | Shell | Login |
|--------|-----|------|-------|-------|
| **Sarah** | — | Primary Parent | Mom | testmom@testworths.com / Demo2026! |
| **Mark** | — | Additional Adult | Adult | testdad@testworths.com / Demo2026! |
| **Alex** | 15 | Independent Teen | Independent | alextest@testworths.com / Demo2026! |
| **Casey** | 14 | Independent Teen | Independent | caseytest@testworths.com / Demo2026! |
| **Jordan** | 10 | Guided Child | Guided | jordantest@testworths.com / Demo2026! |
| **Ruthie** | 7 (Down Syndrome) | Play Child | Play | ruthietest@testworths.com / Demo2026! |

Family login name: **testworthfamily**

The Testworth family also includes two caregiving aides (Amy and Kylie) whose accounts and Caregiver Tools are specified in PRD-27 and planned for a future build phase.

Judges are welcome to add, edit, and interact with any data — or create a fresh account to experience onboarding from scratch. Note: you may need to confirm your email address when creating a new account.

See [DEMO.md](DEMO.md) for detailed walkthrough guidance.

---

## Why 40+ PRDs Exist

This repo contains 40+ Product Requirement Documents. That is not overengineering — it is what responsible architecture looks like for a platform that handles:

- **Children's data** (COPPA compliance is architectural, not cosmetic)
- **Disability documentation** (SDS reports, ISP goals, therapy records — errors have real consequences)
- **Family finances** (ESA invoices, allowance tracking, budget systems)
- **Sensitive family context** (relationship dynamics, faith frameworks, communication patterns)

Every PRD specifies screens, interactions, data models, permission structures across five user roles, and architectural decisions with rationale. The PRDs ARE the business plan, the market research, the feature specifications, and the architectural blueprint — all in one.

We ran a 97-file audit with 14 parallel agents before building. When the audit revealed that early code diverged from the PRDs, we rebuilt from scratch rather than ship wrong code. That's not a setback — that's product integrity for a platform families will trust with their most sensitive information.

This wasn't a one-time correction. The team went through three complete rebuild cycles — each time restarting from PRD-01 — before developing the pre-build discipline process (documented in `claude/PRE_BUILD_PROCESS.md`) that finally solved the root cause: AI builders working from summaries instead of specifications. The third rebuild, guided by surgical repair and a structured verification process, produced the stable codebase that runs today.

See [docs/WHY_PRDS_EXIST.md](docs/WHY_PRDS_EXIST.md) for the full philosophy.

---

## What's Built vs. What's Planned

### Built and Working
- Authentication + family setup with role assignment and invite flow
- Permissions & Access Control (RLS, role mapping, Permission Hub, View As, PIN lockout)
- Design System (38 themes, dark mode, shell tokens, shared components)
- Five-shell routing (Mom, Adult, Independent, Guided, Play) with mobile layouts
- LiLa conversation engine with Human-in-the-Mix, FAQ patterns, voice input, context assembly
- Universal Scheduler (all frequency types, calendar preview, custody grid)
- Universal Timer (4 modes, floating bubble, 5 visual styles, session history)
- Journal + Smart Notepad with Review & Route
- Tasks, Lists, Studio & Templates with Queue Modal, Guided Forms, Randomizer
- Guiding Stars + Best Intentions (family values and growth system)
- InnerWorkings (self-knowledge profiles that make LiLa personality-aware)
- Widgets, Trackers & Dashboard Layout
- Archives & Context Engine (the memory that makes LiLa contextually aware)
- Communication & Relationship Tools (Cyrano message drafting, Higgins coaching)
- AI Vault with tutorials and content delivery
- ThoughtSift Decision & Thinking Tools (Board of Directors, Perspective Shifter, Decision Guide, Mediator, Translator)
- Testworth demo family seeded with 8 members across all 5 shells
- Playwright testing infrastructure
- Deployed and live at myaimcentral.com

### Planned (Full PRDs Complete, Architecture Designed)
Every planned feature has a complete PRD, a database schema, permission structures, and a demand validation mechanism (PlannedExpansionCards) built into the app. These aren't vague ideas — they're fully specified systems waiting for build cycles:

- Victory Recorder & Family Celebration (PRD-11, PRD-11B) — celebration-only achievement system
- Personal Dashboard & Calendar (PRD-14, PRD-14B) — customizable home screen, full family calendar
- Family Overview, Hub & TV Mode (PRD-14C, PRD-14D, PRD-14E) — command center views
- Messages, Requests & Notifications (PRD-15) — in-app communication
- Meetings (PRD-16) — family meeting facilitation
- MindSweep (PRD-17B) — brain-dump capture, AI categorizes and routes
- Safe Harbor (PRD-20) — teen emotional processing space
- BookShelf (PRD-23) — platform-level RAG with chapter-aware chunking
- Gamification (PRD-24) — celebration-only mechanics, no punishment
- BigPlans (PRD-29) — goal backward-planning, project tracking
- Compliance & Progress Reporting (PRD-28B) — homeschool, SDS/disability, ESA invoices
- Family Feeds (PRD-37) — private family social media + homeschool portfolio
- And 15+ more — see [docs/FEATURE_VISION.md](docs/FEATURE_VISION.md)

---

## The Business

**Company:** AIMagicforMoms™

**Revenue model:** Subscription tiers (Essential → Enhanced → Full Magic) with ESA invoice generation at every tier. AI Vault membership bundled with family platform. Beta launches with all features unlocked; tier splits determined after real usage testing.

**Market opportunity:**
- ~85M US moms, ~3.3M homeschool families, ~4.5M disability families
- ESA programs in 11+ states with per-student funding up to $47,500 (Arizona) — and growing
- No competitor assembles family context across members over time
- The AI literacy gap for women/moms represents one of the largest underserved markets in tech

**Predecessor proof:** StewardShip, a working family management app, is actively used by the founder's family of eleven every day. MyAIM Family v2 is StewardShip rebuilt properly — for every family, not just one.

---

## The Founder

Tenise Wertman is a self-taught developer, homeschooling mom of nine, and caregiver to a daughter with Down Syndrome. She taught herself to code using AI, built a working family management app her family uses daily, and designed a platform with 60-80+ database tables and 40+ PRDs. She won Best of Show at Missouri's first Vibeathon (Joplin, November 2025) with MedHarmony — a healthcare scheduling solution built solo in 36 hours. She spent thousands on AI training, couldn't find tools designed for moms, and decided to build them herself.

MyAIM Family is what happens when that same builder turns her attention to the problem she lives every day.

Professional development teams would charge over a million dollars for what she has designed and built. She did it as one woman, in focused bursts, between managing a household and caregiving for a daughter with complex needs.

Her thesis: **People with context beat people with credentials.** That's not just a tagline — it's the founding principle of the entire company.

---

## Repository Structure

```
MyAIMCentral/
├── README.md                          ← You are here
├── DEMO.md                            ← Credentials + walkthrough guide
├── CLAUDE.md                          ← Builder conventions + product philosophy
├── src/                               ← Application source code
├── supabase/migrations/               ← Database schema (commented)
├── tests/e2e/                         ← Playwright test suite
├── audit/                             ← PRD compliance audit (shows architectural rigor)
├── docs/
│   ├── IMPACT_STORY.md                ← Real families, real problems, real impact
│   ├── WHY_PRDS_EXIST.md             ← Architecture-first philosophy
│   ├── ARCHITECTURE_DECISIONS.md      ← Why every tech choice was made
│   ├── FEATURE_VISION.md             ← Built vs. planned with rationale
│   ├── THE_LANTERNS_WE_LIVE_BY.md    ← Mission and values
│   ├── RUTHIE_USE_CASE.md            ← Concrete impact in one document
│   ├── AI_INTEGRATION_PHILOSOPHY.md  ← How LiLa actually works
│   ├── FOUNDER_STORY.md              ← The person behind the platform
│   ├── research/
│   │   ├── MARKET_RESEARCH.md
│   │   └── COMPETITIVE_ANALYSIS.md
│   └── prds/                          ← 40+ Product Requirement Documents
└── .judge-exclude/                    ← Internal planning files (not relevant to evaluation)
```

---

## Competition Context

**Vibeathon 2026 — Startup Bring-Your-Own Challenge**

| Criteria | Weight | Our Case |
|----------|--------|----------|
| Impact & Relevance | 40% | Serving the ~85M moms who hold society together. Disability families, homeschool compliance, ESA funding, AI literacy. Real family, real use case. |
| Demo Quality | 20% | Working app at myaimcentral.com. Pre-seeded Testworth family. Predecessor app in daily use. |
| Innovation | 15% | AI IS the product — not wrapped around it. Context assembly, condensed intelligence, Human-in-the-Mix as ethical architecture. |
| Feasibility | 15% | StewardShip predecessor actively used by founder's real family. Founder won Best of Show at previous Vibeathon. Not theoretical. |
| User Experience | 10% | Five purpose-built shells. Warm, not clinical. Every family member gets their own complete experience. |

---

*AIMagicforMoms™ — AI Magic for Moms + MyAIM Family*
*"The walls that once contained us are gone. The tools are here. And when we unleash an army of moms equipped with AI, the world will not know what hit it — for the better."*
