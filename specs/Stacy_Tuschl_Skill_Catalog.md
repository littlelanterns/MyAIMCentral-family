# Claude Skill Catalog: Stacy Tuschl Framework Solutions
## 27 Skills — One Per Section of the Framework Analysis

**Created:** March 19, 2026
**Companion to:** Stacy_Tuschl_Framework_Analysis.md
**Purpose:** A buildable Claude skill (or project/prompt template) for each of the 27 sections, designed to solve or prevent the core problem that section addresses.

**Skill types used:**
- **Claude Code Skill** → Lives in `/mnt/skills/user/`, has a SKILL.md + supporting scripts, triggered by specific phrases
- **Claude Project** → A Claude.ai project with persistent instructions and project knowledge, used for recurring analysis
- **Prompt Template** → A reusable prompt you paste into any Claude conversation for a specific job

---

# Episode 1: Build Systems Like This

## Skill 1 · Mom Life → "Family System Stress Test"
**Type:** Prompt Template
**Problem it solves:** Mom can't tell if a household routine is a real system or just documentation that depends on her energy.

**Prompt:**
```
I'm going to describe a household routine or system my family uses. 
Apply the Three-Question System Test and give me an honest grade:

1. Can this system tell me when it's broken? (Does it surface problems 
   BEFORE I'm already frustrated, or do I only notice when things fall apart?)
2. Can this system improve without me? (Can family members suggest or make 
   adjustments, or does every change require me to redesign it?)
3. Can this system handle exceptions? (What happens on sick days, snow days, 
   when the babysitter runs it, when dad is traveling?)

For each question, rate it: ✅ Yes / ⚠️ Partially / ❌ No

Then give me:
- The #1 upgrade that would have the biggest impact
- A specific "Plan B" protocol for the most common exception
- One decision rule that would eliminate a recurring interruption

Here's my routine: [DESCRIBE IT]
```

**Why this format:** Moms don't need a skill file — they need a quick diagnostic they can run in any Claude chat. This becomes an AI Vault tutorial ("Stress-Test Your Family Systems with AI").

---

## Skill 2 · MyAIM Business → "Pipeline Health Auditor"
**Type:** Claude Project (persistent instructions)
**Problem it solves:** No one is checking whether MyAIM's operational pipelines actually pass the three-question system test.

**Project Setup:**
- **Name:** MyAIM Ops Health
- **Instructions:** "You are the operational health auditor for MyAIM Family, a family management SaaS platform. Your job is to evaluate every operational pipeline against the Three-Question System Test: (1) Can it tell me when it's broken? (2) Can it improve without me? (3) Can it handle exceptions? When I describe a pipeline, rate each question, identify the weakest point, and propose a specific fix using our stack: Supabase (Edge Functions, cron, triggers), Vercel, Claude API, Manus. Always propose measurable success metrics, not task lists."
- **Project Knowledge:** Upload the Build Order Source of Truth, Pre-Build Setup Checklist, and this Stacy Tuschl analysis.

**Usage:** Before launching any new operational process (onboarding flow, content pipeline, support system), describe it in this project and get a system test rating. Also use it for quarterly audits of existing pipelines.

---

## Skill 3 · AI as Solution → "Decision Rule Generator"
**Type:** Claude Code Skill
**Problem it solves:** You keep making the same types of decisions manually that could be automated into Edge Functions or business rules.

**Trigger phrases:** "generate decision rules," "turn my decisions into rules," "automate my judgment calls"

**How it works:**
1. You provide a log of decisions you've been making (CSV, text list, or just describe them)
2. The skill reads the log, clusters similar decisions, and for each cluster:
   - Writes an objective decision rule with specific triggers and thresholds
   - Drafts a Supabase Edge Function stub that implements the rule
   - Identifies which decisions genuinely require human judgment (the ones that SHOULD escalate to you)
3. Outputs: a markdown summary of proposed rules + a `/home/claude/decision-rules/` folder with Edge Function stubs ready to review

**Example output:**
```
DECISION: "Should I send a re-engagement email to this user?"
RULE: IF user.last_login > 14 days AND user.onboarding_complete = true 
      THEN send template 'warm-checkin' with personalized content
      ELSE IF user.last_login > 14 days AND user.onboarding_complete = false 
      THEN send template 'finish-setup' highlighting next incomplete step
EDGE FUNCTION: /decision-rules/re-engagement-trigger.ts
```

---

# Episode 2: The Power of Proximity

## Skill 4 · Mom Life → "Mom Circle Audit"
**Type:** Prompt Template
**Problem it solves:** Mom's social circle is all people at the same stage, commiserating rather than growing.

**Prompt:**
```
Help me audit my "proximity circle" — the people I spend the most time 
with and how they influence my growth.

I'll list 5-7 people I interact with most regularly (friends, family, 
online communities, etc.). For each, I'll note:
- How often we interact
- What we typically talk about
- Whether they're ahead of me, at my level, or behind me in the areas 
  I'm trying to grow

Then help me:
1. Identify gaps — am I missing people 1-2 stages ahead?
2. Suggest what kind of person/community would fill those gaps
3. Propose 3 ways I could CREATE proximity through contribution 
   (being useful first, not asking for help)
4. Design a simple "proximity habit" I could start this week

My people: [LIST THEM]
My growth areas: [WHAT I'M WORKING ON]
```

---

## Skill 5 · MyAIM Business → "Competitive Intelligence Brief"
**Type:** Claude Project (persistent instructions)
**Problem it solves:** Solo founder has no analyst team to track competitors, market trends, or what's working in adjacent products.

**Project Setup:**
- **Name:** MyAIM Market Intelligence
- **Instructions:** "You are a market intelligence analyst for MyAIM Family, a family management + AI literacy platform for moms. When I ask for competitive analysis, market research, or trend reports, use deep research to find real data, real user reviews, and real pricing. Always cite sources. Focus on: family management apps, homeschool platforms, AI education tools, mom-focused SaaS, and ESA-compatible educational software. Compare findings to MyAIM's positioning and recommend specific actions."
- **Knowledge:** Upload the Feature Glossary, Brand Identity doc, and competitive notes.

**Usage:** Monthly, ask: "What have our closest competitors shipped in the last 30 days? What are users saying about them? What opportunities does this create for MyAIM?" Also use before ESA applications, pitch prep, or feature prioritization.

---

## Skill 6 · AI as Solution → "AI Board of Directors Session"
**Type:** Prompt Template (precursor to ThoughtSift PRD-34)
**Problem it solves:** Solo founder has no mastermind group or advisory board for strategic decisions.

**Prompt:**
```
I need a Board of Directors session. Here's my situation:

[DESCRIBE THE DECISION OR CHALLENGE]

Please respond as a panel of 5 advisors, each with a distinct perspective:

1. **The Systems Thinker** (inspired by Ray Dalio) — What principles apply? 
   What's the root cause? What system would prevent this from recurring?
2. **The Product Builder** (inspired by Marty Cagan) — What does the user 
   need? What's the simplest version that delivers value? What's the risk?
3. **The Scrappy Founder** (inspired by Stacy Tuschl) — What's the 80/20? 
   What would you do with no budget and no team? What's the Golden Domino?
4. **The Mom Who Gets It** (inspired by a power user of MyAIM) — How does 
   this feel from the kitchen table? What would make a busy mom's eyes 
   light up vs. glaze over? What's the friction?
5. **The Contrarian** — What's everyone else missing? What assumption should 
   we challenge? What would we do if we did the opposite?

After all five speak, synthesize: Where do they agree? Where do they 
disagree? What's the recommended path forward?
```

---

# Episode 3: How to Systematize Your Business (in 90 Days)

## Skill 7 · Mom Life → "Family Systems Sequencer"
**Type:** Prompt Template
**Problem it solves:** Mom tries to fix everything at once and burns out. Needs to know which system to build first.

**Prompt:**
```
I'm overwhelmed and trying to fix too many things in my household at once. 
Help me sequence my systems.

Here are the areas causing friction:
[LIST 3-7 PROBLEM AREAS]

Apply the "systematize in sequence" principle:
1. Which one is my "product delivery" — the thing that HAS to work every 
   single day or everything downstream breaks?
2. Which one is "acquisition" — how new things enter the system (groceries, 
   school materials, information, commitments)?
3. Which one is "onboarding" — how transitions happen (morning, after school, 
   bedtime, activity hand-offs)?
4. Which ones are "back-end operations" — important but only worth 
   systematizing after the basics run?

Give me a 4-week plan: one system per week, in the right sequence. 
For each week, give me the ONE change that would make the biggest difference.
```

---

## Skill 8 · MyAIM Business → "Onboarding Consistency Checker"
**Type:** Claude Code Skill
**Problem it solves:** Ensuring every new user gets the same high-quality onboarding experience, not a random one.

**Trigger phrases:** "check onboarding consistency," "audit onboarding," "onboarding quality check"

**How it works:**
1. Connects to Supabase and queries the last 30 signups
2. For each user, traces their onboarding path: which steps completed, in what order, how long each took, where they dropped off
3. Clusters users into "path types" (completed fast, completed slow, dropped at step X, skipped steps)
4. Generates a report: consistency score (are users having the same experience?), drop-off analysis, recommended sequence changes
5. Outputs: markdown report + CSV of user paths for further analysis

---

## Skill 9 · AI as Solution → "AI Referral Sequence Builder"
**Type:** Claude Code Skill
**Problem it solves:** No automated referral system — satisfied users aren't being asked to spread the word at the right moment.

**Trigger phrases:** "build referral sequence," "create referral emails," "referral campaign"

**How it works:**
1. You define the satisfaction milestone triggers (e.g., completed first week, created 10+ tasks, used Optimizer)
2. The skill generates a complete email sequence (3-5 emails per trigger) with:
   - Claude-drafted copy personalized to the trigger event
   - Subject lines with A/B variants
   - A Supabase Edge Function that detects the milestone and fires the sequence
   - A referral tracking schema (referral codes, attribution, reward logic)
3. Outputs: email templates as markdown, Edge Function TypeScript files, and a database migration for the referral tracking table

---

# Episode 4: If You Want to Scale, You Need THIS Hire

## Skill 10 · Mom Life → "Family Operator Training Plan"
**Type:** Prompt Template
**Problem it solves:** Mom is the single point of failure. Kids and partner follow instructions but don't own systems.

**Prompt:**
```
I want to train my family members to be "operators" of household systems, 
not just task-followers. Help me create a training plan.

Here's who's in my family and their current roles:
[LIST FAMILY MEMBERS, AGES, CURRENT RESPONSIBILITIES]

For each person (age-appropriate), help me:
1. Identify ONE system they could fully own (not just tasks within it)
2. Define what "success" looks like for that system (outcome, not steps)
3. Write the handoff conversation — how I explain the ownership transfer
4. Define the exception protocol — what they do when things go sideways
5. Set the check-in cadence — how often we review if it's working, 
   without me micromanaging

The goal: if I'm sick for 2 days, the household runs imperfectly 
but functionally without me.
```

---

## Skill 11 · MyAIM Business → "Bottleneck Tracker"
**Type:** Claude Project (persistent instructions)
**Problem it solves:** No way to track whether you're reducing your personal bottleneck over time.

**Project Setup:**
- **Name:** MyAIM Bottleneck Log
- **Instructions:** "You help me track and reduce my personal bottleneck in MyAIM operations. When I log a decision or task that required my personal involvement, help me categorize it (product, support, content, operations, technical, strategic) and assess whether it could have been handled by a rule, automation, or AI tool. Weekly, generate a summary showing: total decisions this week, % that could have been automated, trending categories, and specific automation recommendations. My goal is to get the 'requires me personally' percentage under 10%."

**Usage:** Quick daily log entries like: "Answered a user question about how exports work → could be FAQ or LiLa Help." "Decided to change the onboarding email subject line → could be A/B test." Weekly: "Give me my bottleneck report."

---

## Skill 12 · AI as Solution → "Operational Health Video Brief Generator"
**Type:** Claude Code Skill
**Problem it solves:** No team to prepare a weekly CEO briefing. You need the information but don't have time to compile it.

**Trigger phrases:** "generate weekly brief," "CEO briefing," "weekly health video"

**How it works:**
1. Queries Supabase for key metrics: new signups, active users, onboarding completion rate, feature adoption, support volume, revenue, churn
2. Compares each metric to prior week and 30-day trend
3. Claude API generates a 2-minute script highlighting: what improved, what declined, what needs attention, and 1-2 recommended actions
4. Outputs: the script as markdown (for quick reading) AND a HeyGen-ready script format (with scene breaks, avatar instructions, and visual callouts)
5. Optional: if HeyGen API is configured, auto-submits the script and returns a video URL

---

# Episode 5: How to 10x Your Business (So It Runs Without You)

## Skill 13 · Mom Life → "Mom Bottleneck Audit"
**Type:** Prompt Template
**Problem it solves:** Mom doesn't know which household tasks actually require her vs. which she does out of habit.

**Prompt:**
```
Help me run a bottleneck audit on my household. I'll list my top 10 
recurring tasks/responsibilities. For each one, help me honestly assess:

- Does this REQUIRE me specifically? (My judgment, my relationships, 
  my specific knowledge?)
- Or am I doing it because I always have? (Habit, control, guilt, 
  "it's faster if I just do it"?)

For everything in the "I always have" category, suggest:
- Could another family member own this? (Who, and what training do they need?)
- Could a system replace me? (Timer, checklist, visual schedule, app?)
- Could it be eliminated entirely? (Is it actually necessary?)

Goal: Get my "requires me personally" list down to 3 items or fewer.

My top 10: [LIST THEM]
```

---

## Skill 14 · MyAIM Business → "Revenue Continuity Simulator"
**Type:** Prompt Template
**Problem it solves:** No way to test what would break if you stepped away from the business for 3-5 days.

**Prompt:**
```
I'm going to simulate a 5-day absence from MyAIM. Help me run through 
each operational area and identify what breaks:

For each area, rate: 🟢 Runs fine / 🟡 Degrades slowly / 🔴 Breaks immediately

Areas:
1. New user signups and onboarding
2. Existing user support/questions
3. Content publication pipeline
4. Billing and payments
5. Technical monitoring (errors, outages)
6. Marketing/social presence
7. Email sequences and automation
8. Community moderation (Vault discussions)
9. Bug reports and fixes
10. Strategic decisions in progress

For every 🟡 and 🔴, propose:
- The specific automation or pre-built response that would turn it 🟢
- How long it would take to build
- What tool from my stack handles it

Current state of each area: [DESCRIBE BRIEFLY]
```

---

## Skill 15 · AI as Solution → "Task Elimination Analyzer"
**Type:** Claude Code Skill
**Problem it solves:** You're doing work that should be eliminated, automated, or delegated, but you can't see it because you're inside it.

**Trigger phrases:** "analyze my tasks," "what should I stop doing," "elimination audit"

**How it works:**
1. You provide your weekly activity log (text, CSV, or time-tracking export)
2. The skill categorizes each task by: strategic value (high/medium/low), replaceability (only-me / anyone / AI-can-do-it), time spent
3. Identifies the bottom 40% by strategic value
4. For each bottom-40% task, recommends: eliminate, automate (with specific tool), or defer
5. Calculates total hours recovered if recommendations are implemented
6. Outputs: prioritized elimination plan as markdown, with specific next steps for each recommendation

---

# Episode 6: Hustle Culture is a Lie

## Skill 16 · Mom Life → "Family Golden Domino Finder"
**Type:** Prompt Template
**Problem it solves:** Mom is solving household problems in the wrong order, fixing symptoms instead of root causes.

**Prompt:**
```
Help me find my family's Golden Domino — the one problem that, when 
solved, makes everything else easier.

Here are my top 5 household frustrations:
[LIST THEM]

For each one, answer:
1. If I solved this first, how many other problems get easier or disappear?
2. What has to be true BEFORE I can solve this? (If something else needs 
   to be fixed first, that might be the real Golden Domino)
3. Would solving this make our next family improvement clearer and easier?

Rank them by cascade impact. Tell me which one to tackle first and 
give me a simple 1-week plan to start.
```

---

## Skill 17 · MyAIM Business → "Strategic Priority Ranker"
**Type:** Claude Project (persistent instructions)
**Problem it solves:** Solo founder gets pulled in too many directions without a forcing function for prioritization.

**Project Setup:**
- **Name:** MyAIM Golden Domino
- **Instructions:** "You help me identify and maintain focus on MyAIM's Golden Domino — the one priority that, when addressed, cascades into solving multiple other problems. When I present business challenges, apply these filters: (1) If solved, how many other problems get easier? (2) What prerequisites must be true first? (3) Would this make the next hire/build/decision clearer? Also apply the quality filter: 'If I gave this twice the time and half the pressure, what would it become?' Challenge me when I'm adding instead of subtracting, or solving problems out of sequence."
- **Knowledge:** Upload Build Order Source of Truth, Remaining PRDs, current metrics.

**Usage:** Weekly check-in: "Here are the 5 things pulling my attention this week. Which is the Golden Domino? What should I defer?"

---

## Skill 18 · AI as Solution → "Content Quality Pipeline"
**Type:** Claude Code Skill
**Problem it solves:** Producing content that's forgettable because it's optimized for speed instead of impact. Need "five pieces that feel like a movement, not fifty that nobody remembers."

**Trigger phrases:** "create quality content," "content pipeline," "movement content"

**How it works:**
1. You provide a topic area (e.g., "meal planning with AI for busy moms")
2. Step 1 — Research: Skill uses Perplexity API (or web search) to find what real moms are actually asking, struggling with, and searching for on this topic. Pulls real forum posts, real questions, real pain points.
3. Step 2 — Gap Analysis: Claude analyzes what existing content covers vs. what's missing or poorly addressed
4. Step 3 — Content Architecture: Claude designs a single piece of content that addresses the real pain points in a way that feels like a breakthrough, not a listicle. Includes: hook, personal angle, actionable framework, tool/template, and transformation promise.
5. Step 4 — Multi-Format Output: Generates the content as a Vault tutorial outline, a HeyGen video script, a Pinterest pin concept, and a short social caption — all from the same core insight.
6. Outputs: a `/home/claude/content-pipeline/[topic]/` folder with all assets

---

# Episode 7: I Spent $150K Solving Problems in the Wrong Order

## Skill 19 · Mom Life → "Family Critical Number Dashboard"
**Type:** Prompt Template
**Problem it solves:** Family tracks chore completion (output) instead of connection and wellbeing (impact).

**Prompt:**
```
Help me define a "Family Critical Number" — a meaningful metric that 
rallies everyone around what actually matters, not just what's measurable.

Revenue metrics for businesses = chore completion for families. Both are 
lagging indicators of something deeper.

Help me brainstorm:
1. What are 5 possible "critical numbers" for our family? (Examples: meals 
   eaten together, minutes of 1-on-1 time per kid, times we laughed, 
   number of "tell me about your day" conversations)
2. For each, how would we track it without it feeling like surveillance?
3. Which one, if it improved, would most likely improve everything else?
4. How do we make it visible and celebrated (not guilt-inducing)?

My family: [DESCRIBE FAMILY SIZE, AGES, CURRENT VIBE]
Our biggest gap right now: [WHAT FEELS MISSING]
```

---

## Skill 20 · MyAIM Business → "Smart Follow-Up Sequence Builder"
**Type:** Claude Code Skill
**Problem it solves:** Leads and inactive users get no follow-up, or generic follow-up that ignores their actual usage context.

**Trigger phrases:** "build follow-up sequence," "create drip campaign," "smart email sequence"

**How it works:**
1. You define the user segment (new signups who stalled, inactive 30 days, trial users, etc.)
2. The skill queries Supabase for that segment's actual usage patterns
3. Claude generates a 7-touch email sequence where each email is templated but personalized:
   - Touch 1: "We noticed you [specific thing they did]. Here's the natural next step..."
   - Touch 3: "Families like yours tend to love [feature they haven't tried]..."
   - Touch 7: "Your data is safe. Whenever you're ready, [specific re-entry point]..."
4. Each email includes: subject line (A/B variant), body (Claude-drafted from usage data), CTA, and the Supabase trigger condition that fires it
5. Outputs: email templates, Edge Function trigger code, and a sequence diagram showing the flow

---

## Skill 21 · AI as Solution → "AI-CRM Intelligence Layer"
**Type:** Claude Code Skill
**Problem it solves:** No CRM, no sales team, no support team — but you need all the intelligence they'd provide.

**Trigger phrases:** "CRM report," "user intelligence," "customer health check"

**How it works:**
1. Queries Supabase for all user data: signup date, onboarding progress, feature usage, last login, subscription status, support interactions, satisfaction signals
2. Claude analyzes the full user base and generates:
   - **Health Segments:** Thriving (active, engaged, expanding), Coasting (active but shallow), At-Risk (declining engagement), Dormant (inactive), Churned
   - **Recommended Actions per segment** with specific email/notification templates
   - **Top 10 users to pay personal attention to** (highest potential, highest risk)
   - **Patterns:** What do thriving users have in common? What predicts churn?
3. Outputs: full CRM intelligence report as markdown, segment definitions as Supabase views, and action templates for each segment

---

# Episode 8: 3 Slow Productivity Principles

## Skill 22 · Mom Life → "Family Rhythm Reactivator"
**Type:** Prompt Template
**Problem it solves:** Good family rhythms dropped and mom feels guilty restarting them, so she doesn't.

**Prompt:**
```
We used to do [DESCRIBE THE RHYTHM/ROUTINE THAT FELL OFF] and it worked 
well for our family. But we stopped doing it because [REASON].

Help me reactivate it without guilt or ceremony:
1. What's the absolute minimum version I could restart with TONIGHT? 
   (Not the full version — just the seed)
2. What was probably the real reason it fell off? (Be honest with me — 
   was it too complex? Too dependent on my energy? No exception plan?)
3. How do I redesign it so it's more resilient this time?
4. What's my "friction removal" move — the one thing that makes 
   restarting feel effortless instead of heavy?
5. Give me a script for reintroducing it to the family that frames it 
   as "we're bringing back something good" not "we failed and we're 
   trying again."
```

---

## Skill 23 · MyAIM Business → "Churn Reason Classifier"
**Type:** Claude Code Skill
**Problem it solves:** When users leave, you don't know why — and different reasons require completely different responses.

**Trigger phrases:** "classify churn," "analyze inactive users," "why did users leave"

**How it works:**
1. Queries Supabase for users inactive 30+ days
2. For each user, pulls: complete usage history, onboarding completion, last features used, time between sessions, support interactions, any feedback/satisfaction signals
3. Claude classifies each user into a departure category: Overwhelmed (signed up, tried a few things, got lost), Completed (got what they came for), Technical Frustration (errors, confusion), Life Got Busy (consistent user who suddenly stopped), Poor Fit (minimal engagement from the start), Price Sensitive (engaged but cancelled at payment)
4. Generates segment-specific reactivation recommendations and email templates
5. Outputs: classified user list as CSV, segment analysis as markdown, reactivation templates per segment, and Edge Function triggers for automated reactivation

---

## Skill 24 · AI as Solution → "Welcome Back Generator"
**Type:** Claude Code Skill
**Problem it solves:** Returning users see a stale app instead of a personalized "here's what's new and why you should be excited" experience.

**Trigger phrases:** "welcome back content," "returning user experience," "what's new generator"

**How it works:**
1. Takes a user ID and their last_active_date
2. Queries Supabase for: all features/content added since that date, any changes to features they previously used, new Vault content in categories they engaged with
3. Claude generates a personalized "Welcome Back" card:
   - "Hey [name], it's been [X weeks]. Your family data is all here."
   - "Since you've been gone: [2-3 most relevant new things based on THEIR usage]"
   - "Pick up where you left off: [specific re-entry point based on what they were doing]"
4. Outputs: the welcome-back card content as JSON (ready to render in the app), plus an Edge Function that auto-generates this on login when last_active > 14 days

---

# Episode 9: The Exact SamePager™ System

## Skill 25 · Mom Life → "Family Tool Consolidation Audit"
**Type:** Prompt Template
**Problem it solves:** Family's organizational life is spread across 5-10 apps, notebooks, and systems that don't talk to each other.

**Prompt:**
```
Help me consolidate my family's tool sprawl. I'll list every app, 
notebook, whiteboard, system, and method we currently use to manage 
our household.

For each one, note: what it does, how often we use it, and what 
would break if we stopped.

Then help me:
1. Identify overlaps — which tools do the same thing?
2. Find the "one ring" — which single platform could replace the most tools? 
   (Be honest about what it CAN'T replace too)
3. Create a migration plan — which tools to consolidate first (low risk) 
   vs. last (high switching cost)
4. Calculate the "cognitive tax" — how much mental overhead am I paying 
   to maintain multiple disconnected systems?

Our current tools:
[LIST EVERY APP, NOTEBOOK, SYSTEM]
```

---

## Skill 26 · MyAIM Business → "Subscription & Tool ROI Auditor"
**Type:** Claude Code Skill
**Problem it solves:** Paying for overlapping AI tools and SaaS subscriptions without a clear view of what's earning its keep.

**Trigger phrases:** "audit my subscriptions," "tool ROI check," "consolidate my tools"

**How it works:**
1. You provide a list of all paid tools/subscriptions with monthly cost and primary use case
2. The skill maps each tool to: what you actually use it for (vs. what it can do), how often you use it, what would break if you cancelled
3. Claude identifies: overlaps (two tools doing the same job), underused subscriptions (paying for features you don't touch), consolidation opportunities (tool A could absorb tool B's function)
4. Calculates: current monthly spend, projected spend after consolidation, annual savings
5. Outputs: a prioritized consolidation plan with specific migration steps and a "keep/consolidate/cancel" recommendation for each tool

---

## Skill 27 · MyAIM Business → "Weekly Subtraction Session"
**Type:** Claude Project (persistent instructions)
**Problem it solves:** Natural tendency is to add (features, tools, commitments, channels) instead of subtract. Needs a forcing function.

**Project Setup:**
- **Name:** MyAIM Subtraction Engine
- **Instructions:** "Every Friday, I'll share what I worked on this week. Your job is to challenge me: What should I STOP doing? What should I automate? What should I eliminate? What commitment should I release? Apply Stacy Tuschl's strategic subtraction framework. Push back when I'm adding complexity. Ask: 'If you could only keep 3 things from this week's work, which would they be?' and 'What would happen if you just... didn't do the others?' Be direct. I need a sparring partner who makes me lighter, not heavier."

**Usage:** Every Friday, paste your week's activity and let it challenge you. Over time, the project accumulates context about what you've cut, what you've kept, and what patterns emerge.

---

# Summary: Skills by Type

| Type | Count | Skills |
|------|-------|--------|
| **Prompt Templates** | 10 | #1, #4, #7, #10, #13, #14, #16, #19, #22, #25 |
| **Claude Code Skills** | 10 | #3, #8, #9, #12, #15, #18, #20, #21, #23, #24, #26 |
| **Claude Projects** | 6 | #2, #5, #6, #11, #17, #27 |

### Quick-Start Recommendation

Build these three first — they deliver the most immediate value:

1. **Skill #3 (Decision Rule Generator)** — Starts reducing your bottleneck from day one
2. **Skill #6 (AI Board of Directors Session)** — Immediate mastermind access for any strategic decision
3. **Skill #17 (Strategic Priority Ranker / Golden Domino project)** — Weekly forcing function to stay focused

---

*Each skill in this catalog is designed to be buildable in a single session. The Claude Code skills can be created using the skill-creator skill in `/mnt/skills/examples/skill-creator/`. The Claude Projects can be set up in Claude.ai in under 10 minutes. The Prompt Templates can be used immediately — just paste and fill in the brackets.*
