# Pre-Build Process — Mandatory Ritual

> This process MUST be completed before writing any code for any feature, any phase, any session.
> No exceptions. This is how we protect the planning that went into every PRD and addendum.

---

## Why This Exists

Weeks of careful planning went into every PRD and its addenda. When that work gets skipped at
build time — even accidentally — the result is wrong code that has to be torn out and rebuilt.
That costs more time than the pre-build process itself ever will.

The pre-build summary is not overhead before the real work. It IS the real work starting.
Code written without it is a guess.

---

## Step 1: Identify the Full Source Material

Read ALL of the following before writing a single line:

### The PRD
- Full document. Every section. Not a skim.
- Path: `prds/[category]/PRD-XX-FeatureName.md`
- If you're unsure which category, check `claude/feature_glossary.md`

### Every Matching Addendum
Search `prds/addenda/` for every file that starts with `PRD-XX` where XX is the PRD number.
Common types:
- `PRD-XX-Cross-PRD-Impact-Addendum.md` — cross-feature impacts
- `PRD-XX-Session-Addendum.md` — decisions made during planning sessions
- `PRD-XX-Content-Pipeline-Tool-Decisions.md` — content/tool-specific decisions
- `PRD-XX-Game-Modes-Addendum.md` — gamification-specific decisions

### Always-Relevant Addenda (Check for Every Build)
| Addendum | When It Applies |
|---|---|
| `PRD-31-Permission-Matrix-Addendum.md` | Any feature with permissions or tiers |
| `PRD-35-Cross-PRD-Impact-Addendum.md` | Any feature with scheduling or recurrence |
| `PRD-36-Cross-PRD-Impact-Addendum.md` | Any feature with time tracking or timers |
| `PRD-Audit-Readiness-Addendum.md` | Every build — contains cross-cutting audit rulings |
| `PRD-Template-and-Audit-Updates.md` | Any feature using templates |

### Schema
- `claude/database_schema.md` — full schema reference
- `claude/live_schema.md` — what's actually in the database right now
- Check for gaps between what the PRD requires and what exists in the live schema

### Wiring Status
- `WIRING_STATUS.md` — what's currently wired vs stubbed that this feature connects to

---

## Step 2: Create the Feature Decision File

In `claude/feature-decisions/`, create a new file: `PRD-XX-FeatureName.md`

Use the template at `claude/feature-decisions/_TEMPLATE.md`.

This file:
- Does NOT duplicate the full PRD (that's still the source of truth)
- DOES capture every decision most likely to be missed
- DOES capture every addendum ruling that affects this build
- DOES list every screen, interaction, empty state, and edge case explicitly
- DOES name every stub (what NOT to build)
- DOES map every cross-feature connection

This file is permanent — it stays in the codebase after the build as reference.

---

## Step 3: Populate CURRENT_BUILD.md

Fill in every section:
- Set Status → **ACTIVE**
- PRD file path
- Every addendum file read (list them all — if you read it, list it)
- Feature decision file path
- Complete pre-build summary covering all subsections

---

## Step 4: Present for Founder Review

Before writing any code, present the pre-build summary to Tenise.

She reviews:
- Is everything captured correctly?
- Are the stubs right — nothing missing, nothing extra?
- Have any decisions changed since the PRD was written?
- Are there things she wants to adjust before build begins?

**Do not write code until she explicitly confirms.**

---

## Step 5: Build

Now write code. With:
- `CURRENT_BUILD.md` loaded in context (auto-loaded via CLAUDE.md)
- The feature decision file available by path
- The full PRD and addenda already read and processed

**THE PRDs ARE THE MINIMUM. There is no simpler version.**
Do not suggest an "MVP approach," an "easy version for now," or any reduction of what
the PRD specifies. The PRDs were carefully designed and ARE the minimum — not a ceiling
to aim toward later, but the floor to build from now. If something can't be built correctly
right now, stop and ask Tenise. Do not substitute a simpler version without her explicit approval.

During the build, if something doesn't match what's in the PRD, stop and ask. Don't
interpret or improvise. The PRD is the law.

---

## Step 6: Post-Build PRD Verification (MANDATORY before declaring complete)

The build is NOT done until every requirement in the PRD and addenda is accounted for.

Go through every item in the pre-build summary — every screen, every component, every
interaction, every field, every rule, every edge case — and assign it a status:

| Status | Meaning |
|---|---|
| **Wired** | Built and functional in this phase |
| **Stubbed** | Documented placeholder — entry exists in STUB_REGISTRY.md |
| **Missing** | Not built, not stubbed — build is incomplete |

**Zero Missing items = build is complete. Any Missing item must be resolved.**

Fill in the Post-Build Verification table in `CURRENT_BUILD.md`. Then present the
completed verification to Tenise as the handoff report:

> "Here is every requirement from the PRD. Here is the status of each one.
>  Everything is either Wired or Stubbed. Nothing is missing."

If anything is Stubbed, confirm with Tenise that stubbing is acceptable for this phase.
If anything is Missing, it must be built or explicitly approved as a stub before closing.

---

## Visual Verification Standard

Before marking any UI item as "Wired" in the verification table:

1. Open the browser
2. Hard reload (Ctrl+Shift+R)
3. Visually confirm the change is rendering correctly
4. "I wrote the code" is NOT sufficient — only visual confirmation counts

If the item cannot be visually verified (e.g. requires specific data
or a user flow to trigger), note exactly how to reproduce it in the
Notes column of the verification table. Never mark visual items
Wired without eyes-on confirmation.

---

## Step 7: Post-Build File Checklist (Convention #14)

After verification is complete and Tenise has confirmed:

- [ ] `BUILD_STATUS.md` — mark phase complete with date
- [ ] `claude/database_schema.md` — update new/changed tables and columns
- [ ] `STUB_REGISTRY.md` — add new stubs, update wired status of existing stubs
- [ ] `CLAUDE.md` — add any new conventions introduced by the phase
- [ ] Add `<FeatureGuide featureKey="xxx" />` to every new page/feature
- [ ] `CURRENT_BUILD.md` — copy verification table to feature decision file, then reset to IDLE
- [ ] `claude/feature-decisions/PRD-XX.md` — add the verification results to the file
- [ ] `claude/feature-decisions/README.md` — add the new file to the index table
- [ ] Commit the feature decision file

---

## Quick Reference: Addenda by PRD Number

| PRD | Addenda to Check |
|---|---|
| PRD-05 | PRD-05-Planning-Decisions-Addendum.md |
| PRD-07 | PRD-07-Session-Addendum.md |
| PRD-08 | PRD-08-Cross-PRD-Impact-Addendum.md |
| PRD-14 | PRD-14-Cross-PRD-Impact-Addendum.md |
| PRD-14B | PRD-14B-Cross-PRD-Impact-Addendum.md |
| PRD-14D | PRD-14D-Cross-PRD-Impact-Addendum.md |
| PRD-15 | PRD-15-Cross-PRD-Impact-Addendum.md |
| PRD-16 | PRD-16-Cross-PRD-Impact-Addendum.md |
| PRD-17B | PRD-17B-Cross-PRD-Impact-Addendum.md |
| PRD-18 | PRD-18-Cross-PRD-Impact-Addendum.md |
| PRD-19 | PRD-19-Cross-PRD-Impact-Addendum.md |
| PRD-20 | PRD-20-Cross-PRD-Impact-Addendum.md |
| PRD-21 | PRD-21-Cross-PRD-Impact-Addendum.md |
| PRD-21A | PRD-21A-Cross-PRD-Impact-Addendum.md |
| PRD-21B | PRD-21B-Cross-PRD-Impact-Addendum.md |
| PRD-21C | PRD-21C-Cross-PRD-Impact-Addendum.md |
| PRD-22 | PRD-22-Cross-PRD-Impact-Addendum.md |
| PRD-23 | PRD-23-Cross-PRD-Impact-Addendum.md, PRD-23-Session-Addendum.md |
| PRD-24 | PRD-24-Cross-PRD-Impact-Addendum.md |
| PRD-24A | PRD-24A-Cross-PRD-Impact-Addendum.md, PRD-24A-Game-Modes-Addendum.md |
| PRD-24B | PRD-24B-Cross-PRD-Impact-Addendum.md, PRD-24B-Content-Pipeline-Tool-Decisions.md |
| PRD-25 | PRD-25-Cross-PRD-Impact-Addendum.md |
| PRD-26 | PRD-26-Cross-PRD-Impact-Addendum.md |
| PRD-27 | PRD-27-Cross-PRD-Impact-Addendum.md |
| PRD-28 | PRD-28-Cross-PRD-Impact-Addendum.md |
| PRD-29 | PRD-29-Cross-PRD-Impact-Addendum.md |
| PRD-30 | PRD-30-Cross-PRD-Impact-Addendum.md |
| PRD-31 | PRD-31-Cross-PRD-Impact-Addendum.md, PRD-31-Permission-Matrix-Addendum.md |
| PRD-32 / PRD-32A | PRD-32-32A-Cross-PRD-Impact-Addendum.md |
| PRD-34 | PRD-34-Cross-PRD-Impact-Addendum.md |
| PRD-35 | PRD-35-Cross-PRD-Impact-Addendum.md |
| PRD-36 | PRD-36-Cross-PRD-Impact-Addendum.md |
| PRD-37 / PRD-28B | PRD-37-PRD-28B-Cross-PRD-Impact-Addendum.md |
| All | PRD-Audit-Readiness-Addendum.md, PRD-Template-and-Audit-Updates.md |

"Universal UX Conventions":

DRAG-TO-REORDER (Universal)
Drag-to-reorder should be available everywhere a list 
of items has a meaningful order. This is the standard 
pattern throughout the app.

Library: @dnd-kit/core + @dnd-kit/sortable (install if 
not already in package.json)

Apply to:
- Any list of items (tasks, list items, routines, 
  intentions, victories, etc.)
- Category sections where order matters
- Dashboard widgets
- Nav items where reordering is meaningful
- Any ordered collection a user creates

Pattern: long-press or drag handle (⠿ icon) to initiate 
drag. Smooth animation during drag. Persists sort_order 
to database on drop. StewardShip's Mast.tsx is the 
reference implementation.

Do NOT add drag handles to:
- Read-only lists
- System-generated content
- Chronological feeds (Journal, History)

---

GRADIENT CONSISTENCY
Use `--surface-primary` on all interactive surfaces and
active states. Never hardcode `var(--color-btn-primary-bg)`
directly on buttons, nav items, active chips, or selected
states. Use `--surface-nav` for navigation backgrounds.
`--surface-primary` = gradient when gradient ON, flat color
when OFF. Cards, inputs, and page backgrounds never use
the gradient regardless of toggle.

---

HORIZONTAL SCROLL ARROWS
Every horizontal scroll area must show visible left/right
ChevronLeft/ChevronRight arrow indicators for desktop users.
Arrow appears when overflow exists in that direction.
Arrow fades when scrolled to the end.
Apply to: task view carousels, any pill/chip scroll row,
any horizontal collection.

---

EMOJI RULE
No Unicode emoji in Mom, Adult, or Independent shell
components. Use Lucide icons only. Emoji permitted ONLY
in Play shell components and gamification components.

---

NO EXTERNAL ATTRIBUTION IN UI
Do not reference external authors, books, or frameworks
by name in UI text. Features like "Big Rocks" and
"Eat the Frog" are platform concepts — they do not need
attribution. Remove any references to Stephen Covey,
7 Habits, Brian Tracy, or any other external source
from UI-facing text.

---

SCROLLBAR CSS
Do not modify scrollbar CSS established in Phase 03
without explicit founder approval.