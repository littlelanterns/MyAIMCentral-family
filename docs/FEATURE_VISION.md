# Feature Vision: Built, Building, and Planned

*Every feature in MyAIM Family exists for a reason, has a specification, and has a place in the build order. This document shows what's live, what's next, and why we show planned features instead of hiding them.*

---

## Why Planned Features Are Visible

Throughout the app, you'll encounter PlannedExpansionCards — warm, informative cards that appear where unbuilt features will live. These aren't apologies for missing functionality. They are:

1. **Demand validation.** Each card lets early users signal interest, helping us prioritize build order based on real demand rather than assumptions.
2. **Transparency.** Families trusting this platform with sensitive data deserve to know where it's going.
3. **Context for judges.** Every planned feature has a complete PRD with database schema, permission model, and architectural decisions. These are fully specified systems, not ideas on a whiteboard.

---

## Built and Operational

These features are live at [myaimcentral.com](https://myaimcentral.com):

| Feature | PRD | What It Does |
|---------|-----|-------------|
| Auth + Family Setup | PRD-01 | Account creation, family creation, member management with role assignment, invite flow |
| Permissions & Access Control | PRD-02 | Five-role permission system, RLS, Permission Hub, View As, PIN lockout |
| Design System & Themes | PRD-03 | 38 themes (light+dark), shell tokens, 11+ shared components, SparkleOverlay |
| Shell Routing | PRD-04 | Five purpose-built shells with distinct layouts, BottomNav, QuickTasks |
| LiLa Core AI | PRD-05 | Conversation engine, context assembly, Human-in-the-Mix, FAQ patterns, voice input |
| Guiding Stars + Best Intentions | PRD-06 | Family values system, growth goals, iteration tracking, celebration counter |
| InnerWorkings | PRD-07 | Self-knowledge profiles that make LiLa personality-aware |
| Journal + Smart Notepad | PRD-08 | Journaling with Review & Route, AI-assisted categorization, voice capture |
| Tasks, Lists, Studio | PRD-09A/B | Tasks, routines, lists, templates, Queue Modal, Guided Forms, Randomizer |
| Widgets & Trackers | PRD-10 | Customizable tracking surfaces with grid layout |
| Archives & Context | PRD-13 | Family context engine — the memory that makes LiLa contextually aware |
| Communication Tools | PRD-21 | Cyrano (message drafting), Higgins (coaching), 8 relationship tools |
| AI Vault | PRD-21A | AI literacy content — tutorials, tools, prompt packs |
| ThoughtSift | PRD-34 | 5 decision/thinking tools — Board of Directors, Perspective Shifter, Decision Guide, Mediator, Translator |
| Universal Scheduler | PRD-35 | All frequency types, calendar preview, custody grid, RRULE storage |
| Universal Timer | PRD-36 | 4 modes, floating bubble, 5 visual styles, session history |
| Playwright Testing | — | E2E test infrastructure |

---

## Fully Specified, Awaiting Build

Every feature below has a complete PRD with screens, interactions, data models, permissions, AI integration, and tier gating decisions. Build order follows dependency chains.

| Feature | PRD | One-Line Rationale |
|---------|-----|--------------------|
| Victory Recorder | PRD-11 | Celebration-only achievement system — a Ta-Da list, never a shame list |
| Family Celebration | PRD-11B | Family-wide celebration rituals and milestone recognition |
| LifeLantern | PRD-12A | Personal vision and life direction — the individual growth compass |
| Family Vision Quest | PRD-12B | Shared family vision-building process |
| Personal Dashboard | PRD-14 | Customizable member home screen with widget layout |
| Calendar | PRD-14B | Full family calendar with RFC 5545 recurrence, multi-member views |
| Family Overview | PRD-14C | Mom's command center — all members, all status, one view |
| Family Hub | PRD-14D | Shared family dashboard on a common device |
| TV Mode | PRD-14E | Large-screen display for family hub on living room TV |
| Messages & Notifications | PRD-15 | In-app messaging, request system, notification routing |
| Meetings | PRD-16 | Family meeting facilitation with agenda, notes, action items |
| MindSweep | PRD-17B | Brain-dump capture — voice or text, AI categorizes and routes |
| Rhythms & Reflections | PRD-18 | Weekly family rhythm planning and retrospective |
| Family Context & Relationships | PRD-19 | Relationship mapping, communication preferences, "How to Reach Me" |
| Safe Harbor | PRD-20 | Teen emotional processing space with safety guardrails |
| LiLa Optimizer | PRD-05C | Prompt optimization with family context, BYOK support |
| AI Vault Community | PRD-21C | Engagement and community features within the Vault |
| Settings | PRD-22 | Full-screen overlay, multi-email, data export, member management |
| BookShelf | PRD-23 | Platform-level RAG — upload books, extract wisdom, chapter-aware chunking |
| Gamification | PRD-24 | Celebration-only mechanics, quests, streaks — never punishment |
| Guided Dashboard | PRD-25 | Purpose-built dashboard for kids 8-12 |
| Play Dashboard | PRD-26 | Purpose-built dashboard for young children |
| Caregiver Tools | PRD-27 | Aide shift management, child handoff, shift notes, reporting |
| Financial Tracking | PRD-28 | Allowance, chore-based earning, budget tracking |
| Compliance Reporting | PRD-28B | Homeschool reports, SDS disability reports, ESA invoices |
| BigPlans | PRD-29 | Goal backward-planning, project tracking, system/routine design |
| Safety Monitoring | PRD-30 | Crisis detection, safety guardrails, escalation protocols |
| Subscription Tiers | PRD-31 | Essential → Enhanced → Full Magic tier system |
| Admin Console | PRD-32 | Platform administration, analytics, content management |
| Demand Validation | PRD-32A | Data-driven feature prioritization from PlannedExpansionCard signals |
| Offline / PWA | PRD-33 | Progressive web app for offline access and mobile installation |
| Family Feeds | PRD-37 | Private family social media + homeschool portfolio feed |
| Blog | PRD-38 | Public-facing content at Cookie Dough & Contingency Plans |

---

## The Subscription Strategy

Beta launches with **all features unlocked**. Access hooks are wired from day one, but tier splits will be determined after real usage testing reveals which features drive the most value.

The planned tiers:

- **Essential** — Core family management + ESA invoicing (available at every tier because families shouldn't pay extra to access funding they're entitled to)
- **Enhanced** — Homeschool compliance tools, basic reports, additional widgets and trackers
- **Full Magic** — AI-powered everything: LiLa's full context assembly, AI-enhanced reports, BookShelf, ThoughtSift, communication coaching, the complete AI Vault

This structure ensures that the platform is useful at every price point while making the AI-powered features the clear upgrade incentive.

---

*AIMagicforMoms™ — AI Magic for Moms + MyAIM Family*
