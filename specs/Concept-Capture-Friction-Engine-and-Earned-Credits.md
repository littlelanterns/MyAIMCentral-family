# Concept Capture: Two Connected Ideas
## Captured March 19, 2026 — During PRD-29 Pre-Session

**Status:** Ideas captured. Not yet designed. Routing to relevant PRDs noted below.

---

## Concept 1: LiLa as Friction Detective → System Design Routing

### The Idea

Mom comes to LiLa venting about a recurring frustration — "the kids never put their shoes away and we're late every morning." She's not asking for a system. She's processing.

LiLa recognizes this as a **friction pattern** — a repeating pain point that a designed system could resolve — and gently offers to help: *"It sounds like the morning exit flow is breaking down. Want me to help you design a system for that?"*

If mom says yes, LiLa shifts into the **system-design planning mode** (PRD-29's third planning type). The conversation transitions from venting/processing to structured friction diagnosis → system design → deployable plan with real MyAIM components (routines, tasks, checklists, etc.).

If mom says no, LiLa continues supporting the conversation normally. No pressure, no loss.

### Why It Matters

- Moms don't think in terms of "I need to create a system." They think "this keeps happening and I'm frustrated."
- LiLa bridges the gap between emotional processing and practical solution-building.
- This is LiLa at her best — not replacing human problem-solving, but recognizing when a tool could help and offering it at the right moment.

### Where It Lives

| PRD | What Gets Documented |
|-----|---------------------|
| **PRD-29 (BigPlan — working title)** | The system-design planning mode that LiLa routes *to*. The friction diagnosis engine. The output (deployable system plan). |
| **PRD-05 (LiLa Core) — Addendum** | Friction-detection as a new **intent recognition pattern** in LiLa's intelligence layer. Added to the guided mode registry. Triggers: repeated complaints about the same topic, explicit frustration language + actionable domain (mornings, chores, meals, homework, finances), direct requests like "I need a better way to handle X." |

### Design Notes

- LiLa should detect friction patterns across conversations (not just within one conversation) — if mom has mentioned morning chaos three times this week, the offer becomes more confident.
- The routing should feel like a natural conversation shift, not a modal/popup. LiLa offers, mom confirms, the conversation continues in the new mode.
- This is NOT LiLa diagnosing problems mom didn't ask about. It's LiLa recognizing when something mom is *already talking about* could benefit from structured problem-solving.
- Ethics guardrail: LiLa never implies mom is doing something wrong. The frame is always "this is a friction point in the system, not a failure in you."

---

## Concept 2: Earned AI Credits Through Progressive Onboarding

### The Idea

Instead of offering a traditional "free trial month," MyAIM rewards new users with AI credits as they complete onboarding milestones. Each milestone that makes the product stickier for them earns a small credit (e.g., $1 worth of AI usage).

**Examples of credit-earning milestones:**
- Complete family profile setup → $1 credit
- Create your first routine → $1 credit
- Add context to a child's Archive → $1 credit
- Set up your first Guiding Star → $1 credit
- Complete your first Best Intention → $1 credit
- Run your first LiLa conversation → $1 credit
- etc.

By the time a user has earned the equivalent of a free month (~$10-15 in credits), they've actually **set up and personalized the product**. The stickiness comes from investment and context, not a calendar deadline.

### Why It's Better Than a Free Trial

| Traditional Free Trial | Earned Credits |
|----------------------|----------------|
| "Here's everything for 30 days — figure it out" | "Do this one thing — here's a reward to try something cool" |
| Overwhelms the target user (busy mom, lots of features) | Guides her through setup step by step |
| Stickiness depends on user self-directing exploration | Stickiness comes from personalization she's already built |
| Deadline pressure: "Your trial ends Friday!" | No deadline — earn at your own pace |
| Everyone gets the same experience regardless of engagement | More engaged = more credits = more invested |
| Churn after trial because they never really set it up | By "trial end" they have real context flowing and see real value |

### The Tier Sampling Angle

Credits can be used to try tools from **higher tiers** than the user's current subscription. This creates a natural upgrade path:

- User on basic tier earns enough credits to try the LiLa Optimizer (Full Magic tier feature)
- She uses it once, loves it, now she's experienced the value firsthand
- Upgrade sells itself — no hard sell needed

This is the "I Go First" philosophy applied to the product experience itself: we *show* you what the higher tier does for you, rather than telling you about it behind a paywall.

### Where It Lives

| PRD | What Gets Documented |
|-----|---------------------|
| **PRD-31 (Subscription Tier System)** | Core credit system design — credit ledger, earning rules, spending rules, tier-sampling permissions, credit expiration policy (if any). |
| **PRD-25 (Guided Dashboard)** | Onboarding milestone definitions — which setup steps earn credits, progress indicators, celebration moments when credits are earned. |
| **PRD-21A (AI Vault)** | Vault tools as credit-spendable experiences — trying a higher-tier Vault tool with earned credits. |
| **PRD-24 (Gamification)** | Credit-earning as a gamification event — reveal animations when credits are awarded, progress tracking toward "earned a full month." |

### Design Notes

- Credit amounts and milestone list are **deferred to PRD-31** — don't lock in specific dollar amounts now.
- The milestone list should be curated, not exhaustive. We want ~8-12 meaningful setup steps, not 50 micro-tasks that feel like busywork.
- Credits should feel like a gift, not a manipulation. Frame: "You just set up your family — here's something to celebrate with!" not "Complete 10 tasks to unlock your trial."
- Consider: should credits expire? Probably yes (after 90 days?) to create gentle urgency, but this is a PRD-31 decision.
- Consider: should the earned-credits model replace OR supplement a traditional trial? Could offer both paths: "Start with a guided setup and earn credits" OR "Just give me everything for 14 days." Different users prefer different approaches.
- The tier-sampling angle means the credit system needs to know which features belong to which tier and allow temporary access. This is infrastructure that PRD-31 needs to design.

### Connection to PRD-29 (BigPlan)

The friction diagnosis engine (Concept 1) could be one of the credit-earning milestones: "Tell us where your home has friction → earn $2 in credits." This is the bridge between the freebie funnel version and the onboarding credits system — the friction finder IS an onboarding step that earns credits AND doubles as lead-gen for non-users.

---

## How These Two Concepts Connect

```
Non-user path (freebie funnel):
  Friction Finder (free, no account) 
    → Personalized report via email
    → "Here's how MyAIM solves these" feature map
    → Sign up → friction answers seed onboarding
    → Earn credits through setup milestones
    → Stickiness

Existing user path (in-app):
  Mom vents to LiLa about recurring frustration
    → LiLa detects friction pattern
    → Offers system-design mode (PRD-29)
    → Friction diagnosis → system design → deploy
    → System runs on MyAIM tools (routines, tasks, etc.)
    → Life changes → refresh context → adjust system

Both paths share:
  - The same friction diagnosis framework
  - The same friction taxonomy (knowledge / motivation / logistics / capacity)
  - The same solution-to-feature mapping intelligence
```

---

## Open Questions (For Future Sessions)

1. What are the actual friction categories? (Tenise gathering notes from lived experience)
2. How does the freebie funnel version get delivered? (Standalone web page? Vault tool? Both?)
3. Should the friction finder be branded separately for marketing? ("Family Friction Finder" or similar?)
4. How do earned credits interact with the Founding Families beta program? (Do founding families skip the credit system since they already have full access?)
5. What's the minimum viable milestone list for the credit-earning onboarding?

---

*This document is a concept capture, not a PRD. Ideas will be formally designed in their respective PRDs as noted above.*
