# How We Broke Our AI-Assisted Build — And The Process That Fixed It

> A postmortem and playbook for solo founders building complex software with AI coding assistants.
> From the MyAIM Central project — a 42-PRD family management platform built by one founder with AI.

---

## The Setup

MyAIM Central is a large-scale family management and personal growth platform. The scope is ambitious: 42 PRDs (Product Requirements Documents), ~165 database tables, five role-based UI shells, an AI assistant, gamification, scheduling, messaging, compliance reporting — the works.

The founder (Tenise) spent weeks writing detailed PRDs and addenda for every feature. These weren't vague wish lists — they were precise specifications with every screen, every field, every interaction, every edge case, every empty state documented. The planning was thorough and intentional.

Then it was time to build. With AI.

---

## What Went Wrong

### Phase 1-8: The Slow Disaster

We built features in phases, working through the PRD list. Each phase felt productive — code was being written, components were appearing, features were taking shape. But underneath, problems were compounding.

**The core failure mode: The AI was building from summaries instead of source material.**

Here's how it happened:

1. **Schema summaries replaced PRDs.** The project had a `database_schema.md` file — a convenient reference summarizing all ~165 tables. The AI would read this summary and start building. The problem? A summary captures the *shape* of a feature, not the *intent*. Column names don't tell you which fields are required on which screens, what the empty states should say, how features interact, or what the edge cases are. The PRDs had all of this. The schema summary had none of it.

2. **Addenda were missed entirely.** Many PRDs had addenda — follow-up documents capturing decisions made after the base PRD was written. These addenda often *overrode* or *clarified* the base PRD. For example, an addendum might say "use `access_schedules` instead of `shift_schedules`" or "this table name was changed from X to Y." When the AI only read the base PRD (or worse, only the schema summary), it built against outdated or incomplete specifications.

3. **"MVP" shortcuts accumulated.** The AI would suggest "for now, let's just..." or "a simpler version would be..." and implement a reduced version of what the PRD specified. Each individual shortcut seemed reasonable. But across 8 build phases, hundreds of these small reductions meant the built product was fundamentally different from the designed product. Features were half-wired. Interactions were stubbed. Edge cases were ignored. The delta between "what was built" and "what was designed" grew with every phase.

4. **Build prompts were generated from bad data.** Early in the project, we generated "build prompt" files from the schema summary to guide each phase. These build prompts inherited every error and omission from the summary. They became a layer of abstraction between the AI and the actual requirements — a game of telephone where the message degraded at each step. We eventually had to ban these files entirely (42 files moved to `archive/old-build-prompts/` and marked as poisoned).

5. **No verification against source material.** After each phase, there was no systematic check of "did we build what the PRD actually says?" Code was written, it compiled, it rendered something on screen — and the phase was marked complete. Nobody went back to the PRD line by line to verify.

### The Audit: 578 Failures

After 8 phases of building, we ran a comprehensive audit. Every built feature was checked against its source PRD and addenda.

**Result: ~578 failures across 9 categories.**

These weren't cosmetic issues. They included:
- Wrong table names (building against the old schema summary instead of audit rulings)
- Missing fields that the PRD explicitly required
- Features wired to the wrong data sources
- Interactions that didn't match the PRD's specification
- Cross-feature connections that were completely absent
- Entire sub-features that were stubbed when they should have been built
- UI patterns that contradicted the design system PRD

The 578 failures took **10 remediation phases** to fix. That's 10 phases of rework — tearing out wrong code and rebuilding it correctly — that could have been avoided if the code had been built right the first time.

---

## The Root Cause

The root cause wasn't that the AI was bad at coding. The code quality was fine. The architecture was reasonable. The components were well-structured.

**The root cause was that the AI was building the wrong thing correctly.**

When you give an AI a schema summary and say "build the tasks feature," it will produce a competent tasks feature — but one based on its interpretation of column names, not on the detailed behavioral specification in the PRD. It doesn't know that `incomplete_action` has six specific options with specific behavioral rules unless it reads the PRD. It doesn't know that Fresh Reset is the *default* for routines unless it reads the addendum. It doesn't know that `studio_queue` replaces `task_queue` unless it reads the audit rulings.

The AI builds confidently from whatever context it has. If that context is incomplete, the build is confidently wrong.

---

## The Fix: The Pre-Build Process

After the audit and remediation, we designed a mandatory process that runs before any code is written. It has been in effect for every build phase since, and the error rate has dropped to near zero.

### The Mandatory Ritual

#### Step 1: Read the Full PRD
Not a skim. Not a summary. The full document, every section, every word. The AI must process the actual source material — the PRD that the founder spent days writing.

#### Step 2: Read Every Matching Addendum
Search the addenda directory for every file that matches the PRD number. There are often multiple addenda per PRD, and they contain decisions that override or clarify the base document. Missing an addendum means building against outdated specs.

#### Step 3: Create a Feature Decision File
A permanent record in `claude/feature-decisions/` that captures:
- Every screen and interaction from the PRD
- Every addendum ruling that affects this build
- Every cross-feature connection
- Every explicit stub (what NOT to build, and why)
- Every edge case and empty state

This file does NOT duplicate the PRD — it's a build-focused extraction that ensures nothing is missed. It stays in the codebase permanently as reference.

#### Step 4: Populate the Build Context File
`CURRENT_BUILD.md` gets filled with the complete pre-build summary. This file is auto-loaded into every AI conversation, so the build context is always present.

#### Step 5: Founder Review Before Code
The pre-build summary is presented to the founder. She reviews:
- Is everything captured correctly?
- Have any decisions changed since the PRD was written?
- Are the stubs appropriate?
- Is anything missing?

**No code is written until the founder explicitly confirms.** This is the gate that prevents the AI from confidently building the wrong thing.

#### Step 6: Build With Full Context
Code is written with the complete PRD, addenda, and feature decision file loaded. During the build, if something doesn't match the PRD, work stops and the founder is consulted. No interpretation. No improvisation.

#### Step 7: Post-Build Verification
After the build, every requirement from the pre-build summary is checked line by line:
- **Wired**: Built and functional
- **Stubbed**: Documented placeholder with entry in the stub registry
- **Missing**: Not built, not stubbed — build is incomplete

**Zero Missing items required.** The verification table is presented to the founder as the handoff report. This is the check that phases 1-8 were missing entirely.

#### Step 8: File Updates
Documentation is updated: schema docs, stub registry, wiring status, build status. The feature decision file gets the verification results appended. The build context file resets to IDLE.

---

## Why It Works

### 1. Source Material, Not Summaries
The AI reads the actual PRD — the document the founder carefully wrote — not a derivative summary. This eliminates the telephone game.

### 2. Completeness Check Before Building
The feature decision file forces the AI to enumerate every requirement before writing code. You can't miss what you've explicitly listed.

### 3. Human Gate Before Code
The founder reviews the plan before implementation begins. This catches misunderstandings when they're cheap to fix (changing a bullet point) rather than expensive (rewriting a component).

### 4. Verification Against Source
The post-build check ensures the built product matches the designed product. Every requirement gets a status. Nothing slips through.

### 5. Institutional Memory
The feature decision files, stub registry, and build status documents create a permanent record. Future build phases inherit knowledge from past phases. The AI doesn't re-discover the same decisions.

---

## Key Principles We Learned

### "The PRDs ARE the minimum."
This became a mantra. When the AI suggests "for now, let's just..." or "a simpler version would be..." — the answer is no. The PRDs were carefully designed as the minimum viable product. They're not a ceiling to aim toward later; they're the floor to build from now. If something can't be built correctly right now, stop and ask the founder. Don't substitute a simpler version without explicit approval.

### "Build it right or don't build it yet."
Half-built features create more work than unbuilt features. A properly documented stub (with a PlannedExpansionCard in the UI and an entry in the stub registry) is better than a half-implemented feature that looks done but isn't.

### "Never build from summaries."
Schema docs, build prompts, feature glossaries — these are navigation aids, not building specifications. They help you find the right PRD. They are not substitutes for reading it.

### "The AI builds confidently from whatever context it has."
This is the fundamental insight. AI coding assistants don't express uncertainty about specifications. They don't say "I'm not sure what this field should do, let me check the PRD." They make a reasonable assumption and build it. If the context is wrong, the build is wrong — and it looks right until you audit it.

### "Verification is not optional."
"I wrote the code and it compiles" is not verification. "I checked every requirement in the PRD against what was built" is verification. The post-build verification table is what makes the difference between "it looks done" and "it is done."

---

## The Numbers

| Metric | Before Process | After Process |
|--------|---------------|---------------|
| Audit failures per phase | ~72 average | Near zero |
| Rework phases required | 10 (remediation) | 0 |
| Time spent on rework | More than original build | N/A |
| Features matching PRD spec | ~60-70% | ~98-100% |
| Addenda rulings missed | Routinely | None |
| Founder surprises at review | Frequent | Rare |

---

## For Other Solo Founders

If you're building a complex product with AI assistance, here's the distilled advice:

1. **Write detailed specs before you build.** The AI is only as good as the context you give it. Vague specs produce vague implementations.

2. **Make the AI read the actual spec, not a summary.** Load the full document into context. Yes, it uses tokens. It's worth it.

3. **Gate code behind human review of the plan.** Have the AI tell you what it's going to build *before* it builds it. Review that plan against your spec. This is the highest-leverage intervention.

4. **Verify after building.** Go through your spec line by line and check each item against the built product. Use a status table (Wired / Stubbed / Missing). Accept nothing less than zero Missing items.

5. **Never accept "for now" shortcuts without explicitly approving them.** Each shortcut seems small. They compound into a product that doesn't match your vision.

6. **Document decisions permanently.** Feature decision files, stub registries, convention docs — these are the institutional memory that makes the next build phase smarter than the last.

7. **Ban derivative documents that drift from source.** If you have build prompts or summaries generated from your specs, they WILL drift. When they do, they poison every build that uses them. Either keep them rigorously updated or delete them.

The AI is an incredibly powerful building tool. But it needs guard rails — not on its coding ability, but on its understanding of *what to build*. The pre-build process is those guard rails.

---

## Timeline

| Date | Event |
|------|-------|
| Early 2026 | 42 PRDs and addenda written over several weeks |
| Feb-Mar 2026 | Phases 01-08 built with AI assistance |
| 2026-03-23 | Comprehensive audit reveals ~578 failures |
| 2026-03-23 | Pre-build process designed and documented |
| 2026-03-23 to 2026-03-25 | 10 remediation phases fix audit failures |
| 2026-03-25 | Remediation complete. Process proven. New builds begin. |

---

*Written from the trenches of a real project. The mistakes were expensive. The process that fixed them was not complicated — it just had to be mandatory.*
