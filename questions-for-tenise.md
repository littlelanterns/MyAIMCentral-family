# Questions for Tenise

Questions that came up during the pre-build audit and file generation that couldn't be resolved from the PRDs alone. Answer these in bulk when you're ready — none are blocking Phase 3 generation.

---

## Pre-Build Tool Installation

1. **AURI Security Scanner (Endor Labs):** Before writing the first line of auth code (PRD-01), you need to install the AURI MCP server in VS Code. It's free, runs locally, code never leaves your machine. Have you set this up yet, or do you need instructions?

2. **mgrep Semantic Search (Mixedbread AI):** Run these commands to set up:
   ```
   npm install -g @mixedbread-ai/mgrep
   mgrep login
   cd MyAIMCentral-family && mgrep watch
   mgrep install-claude-code
   ```
   This keeps 60-70% of context window free during builds. Ready to install?

---

## Pricing Confirmation

3. **Tier pricing confirmed as:** Essential $9.99 (founding $7.99), Enhanced $16.99 (founding $13.99), Full Magic $24.99 (founding $20.99), Creator $39.99 (founding $34.99). The PRD-31 file in the repo appears to have different numbers ($7.99/$13.99/$20.99/$34.99 as regular prices). Should I treat your verbal confirmation as the source of truth and note the discrepancy, or should PRD-31 be updated?

---

## Architecture Decisions

4. **Next.js vs Vite+React:** The v1 overview doc references "Vite + React 19" but the modern Supabase + Vercel stack strongly suggests Next.js (App Router). The PRDs don't specify. Which do you prefer? Next.js gives you SSR, API routes, and better Vercel integration. Vite gives you simpler mental model and faster dev builds.

5. **Supabase project name:** You have the StewardShip credentials in `.env.local`. Have you created the NEW Supabase project for MyAIM v2 yet? (The `.env.local` has placeholder values for `NEXT_PUBLIC_SUPABASE_URL` etc.)

6. **Domain setup:** PRD-38 references dual-domain routing (aimagicformoms.com for public blog, myaimcentral.com for authenticated app). Are both domains purchased and pointed at Vercel?

---

## Feature Clarifications

7. **PRD-24C (Family Challenges):** Referenced as a stub in PRD-24A but no PRD-24C file exists. Is this intentionally deferred to post-MVP, or was it absorbed into another PRD?

8. **Creator tier:** PRD-31 describes the Creator tier ($39.99) as "future business/design features (currently stubbed)." Should the build include the Creator tier in the UI with "Coming Soon" messaging, or omit it entirely until those features are designed?

9. **Founding Family enrollment:** How will the first 100 families be enrolled? Is there a waitlist, a launch event, or will it be first-come-first-served when the platform goes live?

10. **OpenRouter API key:** The build will need an OpenRouter API key for LiLa (Claude Sonnet). Do you have one, or should the build use the Anthropic API directly? The `.env.local` has placeholders for both `OPENROUTER_API_KEY` and `ANTHROPIC_API_KEY`.

---

## Unresolved Side Quests

These side quests from `MyAIM_Remaining_PRDs_Ordered.md` were NOT resolved by any written PRD. Confirm they're all post-MVP:

11. **Multi-AI Panel** (shelved, low priority) — Confirmed deferred?
12. **Teen Lite Optimizer** — Post-MVP?
13. **Family Mission Statement** (distinct from Family Vision Statement) — Post-MVP?
14. **My Circle** (non-family contacts in Archives) — Post-MVP?
15. **External calendar sync** (Google/Apple) — Post-MVP?
16. **Push notifications** — Post-MVP?
17. **SMS capture channels** — Post-MVP? (Email forwarding is covered by MindSweep PRD-17B)

---

## Content & Assets

18. **LiLa character design:** The PRDs reference 4 LiLa avatar states (Happy to Help, Your Guide, Smart AI, Sitting/Resting). Do you have these designed, or do they need to be created? What art style — the paper craft aesthetic from the brand doc?

19. **Vault seed content:** PRD-21A describes the AI Vault with tutorials, prompt packs, tools, etc. Will there be seed content at launch, or will the Vault launch empty with admin tools ready?

20. **Blog seed content:** PRD-38 describes the Cookie Dough blog. Will there be launch posts ready, or is the blog infrastructure-only at MVP?

---

## Technical Infrastructure

21. **Supabase plan:** Which Supabase plan are you on? The Pro plan ($25/mo) is needed for Edge Functions, pg_cron, and reasonable database size. The Free plan won't support the build.

22. **Vercel plan:** Similar question — the Hobby plan has limitations on Edge Functions and build minutes. Pro ($20/mo) recommended for the build.

23. **StewardShip data migration:** Several features reference "condensed intelligence" from StewardShip (ThoughtSift, BigPlans). The `thoughtsift_condensed_intelligence.md` and `bigplans_condensed_intelligence.md` files exist in `reference/`. Should these be loaded into the platform_intelligence schema during setup, or will they be manually curated during content phases?
