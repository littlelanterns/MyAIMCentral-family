# MyAIM Family — Demo Access

**Live app:** https://myaimcentral.com

---

## Two Ways to Experience MyAIM

### Option 1: Create Your Own Account

Start fresh and experience the full onboarding flow. You'll create a family, add members, and see the app build itself around your household. You may need to confirm your email address during signup.

### Option 2: Sign In as a Testworth Family Member

The Testworth family is a pre-populated household so you can explore what MyAIM looks like with real context already in place. Each member has their own login, their own shell experience, and their own data. You're welcome to add, edit, and interact with anything — the family is yours to explore.

---

## Testworth Family Credentials

| Member | Age | Role | Shell | How to Log In |
|--------|-----|------|-------|---------------|
| **Sarah** | — | Primary Parent | Mom | testmom@testworths.com / Demo2026! |
| **Mark** | — | Additional Adult | Adult | testdad@testworths.com / Demo2026! |
| **Alex** | 15 | Independent Teen | Independent | alextest@testworths.com / Demo2026! |
| **Casey** | 14 | Independent Teen | Independent | caseytest@testworths.com / Demo2026! |
| **Jordan** | 10 | Guided Child | Guided | jordantest@testworths.com / Demo2026! |
| **Ruthie** | 7 (Down Syndrome) | Play Child | Play | ruthietest@testworths.com / Demo2026! |
| **Amy** | — | Aide (Special Adult) | Adult | amytest@testworths.com / Demo2026! |
| **Kylie** | — | Aide (Special Adult) | Adult | kylietest@testworths.com / Demo2026! |

Family login name: **testworthfamily**

---

## What to Explore First

**Start as Sarah** (testmom@testworths.com) — she sees everything. This is the full command center experience.

1. **LiLa** — Pull up the LiLa drawer from any page. Ask her anything about the family. Notice how responses are informed by family context, not generic advice. Every AI output has Edit / Approve / Regenerate / Reject — that's Human-in-the-Mix.

2. **Journal + Smart Notepad** — Create an entry. Use Review & Route to see how LiLa categorizes and routes content to the right place in the system.

3. **Tasks** — See the family's task board. Notice tasks can be assigned to specific members, have multiple dimensions (allowance, homeschool hours, behavioral tracking), and flow through the permission system.

4. **Guiding Stars + Best Intentions** — The family values and growth system. These feed into LiLa's context so every AI interaction is aligned with what this family cares about.

5. **Shell Switching** — Log out and log in as different family members. Notice how each shell is a fundamentally different experience — not the same app with different permissions, but purpose-built interfaces for each type of user.

**Then try Alex** (alextest@testworths.com) — see the Independent Teen shell. Clean, respectful, age-appropriate. LiLa talks to Alex like he's capable, not like he's a child.

**Then try Ruthie** (ruthietest@testworths.com) — see the Play shell. Large icons, celebration-focused, fully parent-controlled. A 7-year-old with Down Syndrome gets her own complete experience, not a stripped-down version of her mom's app.

---

## What the Architecture Demonstrates

**Five shells, one platform:** Each family member gets a purpose-built experience. A mom managing nine kids and a 7-year-old playing with large colorful buttons are using the same platform — but it doesn't feel like it, and that's the point.

**Human-in-the-Mix:** Every AI output passes through human review before becoming permanent. This isn't a UI choice — it's COPPA compliance, ethical AI practice, and legal liability protection built into the architecture.

**Context assembly:** LiLa knows the family — their values, their goals, their schedules, their communication styles. This context is the product. No competitor assembles it.

**Role-based permissions:** Mom sees everything. Dad sees what mom has granted. Teens have independence with boundaries. Caregivers see only their assigned children during their shifts. Children's data is architecturally isolated, not just settings-gated.

---

## Ruthie's Schedule (What You'll See in Calendar)

- OT Therapy: Tuesdays 2:00 PM
- Speech Therapy: Tuesdays 3:00 PM
- Homeschool Co-op: Tuesdays & Thursdays 9:00 AM – 12:00 PM (Kylie as aide)
- Wednesday Outings: Wednesdays at noon (recurring)
- Activity Days: 2nd & 4th Wednesdays (Amy as aide)
- Church: Sundays 10:00 AM – 12:00 PM

This is a real schedule pattern from the founder's family. A child with Down Syndrome, multiple aides, recurring therapy — this is what MyAIM was built to manage.

---

## PlannedExpansionCards

Throughout the app, you'll encounter cards for features that are fully designed but not yet built. Each card represents a complete PRD (Product Requirement Document) with database schema, permission structures, and architectural decisions already specified. These aren't placeholder promises — they're demand validation mechanisms that let early users signal which features matter most to them.

Every planned feature has a reason, a spec, and a build path. See [docs/FEATURE_VISION.md](docs/FEATURE_VISION.md) for the complete list.

---

## Technical Notes for Judges

- **Stack:** Vite + React 19 + TypeScript + Tailwind + Supabase + pgvector + OpenRouter
- **AI cost:** ~$0.20/family/month through 9 optimization patterns (embedding-first classification, on-demand secondary outputs, per-turn semantic context refresh)
- **Testing:** Playwright E2E test suite — 21 passing, 0 failing
- **PRDs:** 40+ complete product requirement documents in `docs/prds/`
- **Predecessor:** StewardShip, a working app actively used by the founder's family of eleven

---

*AIMagicforMoms™ — AI Magic for Moms + MyAIM Family*
