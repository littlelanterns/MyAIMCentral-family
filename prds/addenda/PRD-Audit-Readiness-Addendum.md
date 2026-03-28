# MyAIM Family: PRD Audit Readiness Addendum
## Writing PRDs So the Final Opus Audit Actually Works

**Purpose:** This is a companion to the PRD Template. It doesn't change the template structure — it describes *how to write within that structure* so that when all PRDs are complete, a single Opus 4.6 audit pass across the full codebase can catch inconsistencies, identify elegance gaps, and surface forward-focus opportunities before a single line of app code is written.

**When to use this:** Keep it open alongside the PRD Template during every PRD session. The habits it describes are small in the moment and invaluable at audit time.

---

## The Audit Setup (For Reference)

When all PRDs are written, the plan is:

- All PRD files loaded into the VS Code workspace
- Claude Code running with `/model opus` and the 1M context option (Max plan with usage surcharge)
- A single coherent audit prompt applied across the entire platform spec
- Findings addressed by editing the PRD files directly in VS Code
- Everything aligned and consistent before build begins

The audit is only as good as the signal the PRDs provide. The habits below ensure Opus can distinguish *intentional decisions* from *potential oversights*, *known gaps* from *forgotten ones*, and *deliberate tradeoffs* from *things worth reconsidering*.

---

## Habit 1: Record the Rationale, Not Just the Decision

When you make a non-obvious call, add a one-line note explaining why.

**Why it matters:** Without rationale, Opus may flag intentional decisions as problems. With rationale, it can evaluate whether the reasoning still holds — which is actually more useful.

**Format:**
```
> **Decision rationale:** [Why this call was made, in one sentence.]
```

**Examples from existing PRDs:**

```
> **Decision rationale:** Multi-AI Panel shelved — would serve a narrow user segment
> and require full reengineering. Breadth over depth principle applies.

> **Decision rationale:** LiLa access for Dad is modal-only (not a drawer) because
> Dad's use cases are task-specific, not exploratory. Keeps his shell clean.

> **Decision rationale:** Play shell has no LiLa access of any kind — not even
> permission-gated. Intentional. Young children should not interact with AI directly.
```

Place these immediately after the relevant decision in any section — Screens, Visibility & Permissions, Shell Behavior, wherever the decision lives.

---

## Habit 2: Tag Every Deferred Decision Consistently

Use a consistent tag for anything stubbed, deferred, or left TBD.

**Why it matters:** Opus needs to distinguish "this was intentionally deferred" from "this was accidentally skipped." Consistent tagging also gives you a searchable list of open items across all PRDs.

**Format:**
```
> **Deferred:** [What's deferred] — to be resolved in [PRD-## / Caregiver Tools PRD / build phase / etc.]
```

**Examples:**

```
> **Deferred:** Special Adult shell layout — full spec to be resolved in Caregiver
> Tools PRD. Current behavior: scoped-down Adult shell filtered to assigned children.

> **Deferred:** Guided shell Guiding Stars — light version for Guided children to be
> designed in a future design sprint. Currently stubbed with "Coming soon" placeholder.

> **Deferred:** Optimizer Pattern Library content — content sprint after beta launch.
> Infrastructure built; content populated later.
```

---

## Habit 3: Name Cross-PRD Dependencies Explicitly

When a PRD assumes something defined elsewhere, say so by name.

**Why it matters:** Opus can verify both ends of the dependency — that the assumption is correct, and that the source PRD actually delivers what's assumed. This catches the most common class of cross-PRD inconsistency.

**Format:**
```
> **Depends on:** [What is assumed] — defined in PRD-[##], [Section].
```

**Examples:**

```
> **Depends on:** PermissionGate component pattern — defined in PRD-02, Permission
> Architecture section. All access gating in this feature must use that pattern.

> **Depends on:** Member color assignment — defined in PRD-03, family_members table
> updates. Color values consumed here must come from that column.

> **Depends on:** `dashboard_mode` routing logic — defined in PRD-04, Shell Routing
> Logic section. This feature's shell behavior assumes that routing is in place.
```

Place these at the top of any section that relies on another PRD, or in the Flows section when data originates elsewhere.

---

## Habit 4: Keep Shell Behavior Tables Complete and Consistent

Every feature PRD must have a shell behavior table. Every shell must have an entry. No blanks.

**Why it matters:** Shell behavior tables are the primary tool Opus will use to check cross-shell consistency. Gaps or vague entries make that check unreliable.

**The five shells — always include all five:**

| Shell | Entry required |
|-------|---------------|
| Mom / Primary Parent | Always |
| Dad / Additional Adult | Always |
| Special Adult | Always (even if "Not applicable — feature outside Special Adult scope") |
| Independent (Teen) | Always |
| Guided | Always (even if "Stubbed — see Deferred note") |
| Play | Always (even if "Not present in Play shell") |

**Quality bar for each entry:**
- "Not present" is a complete answer — just say it explicitly
- "Stubbed" needs a Deferred tag pointing to where it will be resolved
- "Permission-gated" needs to say what permission gates it and who sets it
- Never leave an entry as "TBD" without a corresponding Deferred tag

---

## Habit 5: Note Tier Availability Per Feature, Even When It's Simple

Every PRD has a Tier Gating section. Fill it intentionally, even for features available at all tiers.

**Why it matters:** By audit time, Opus will evaluate whether the tier structure is coherent, competitive, and serves the right user segments. It can only do that if every feature's tier availability is explicitly stated.

**When a feature is available at all tiers:**
```
No tier-specific gating. Feature available at all tiers.
Rationale: [Core mom feature / foundational family function / etc.]
```

**When a feature is tier-gated:**
Fill the table fully and add a rationale:
```
> **Tier rationale:** [Why this capability sits at this tier — what value proposition
> does it represent, and for which user segment?]
```

---

## Habit 6: Include a "Why This Matters to Mom" Note on Key Flows

Not everywhere — just on the most important UX decisions or flows in each PRD.

**Why it matters:** Opus will audit for mom-friendliness and UX elegance. A brief framing note tells it what the experience should *feel like*, so it can evaluate whether the design actually delivers that.

**Format:**
```
> **Mom experience goal:** [What this should feel like from mom's perspective —
> one sentence, in plain language.]
```

**Examples:**

```
> **Mom experience goal:** Permission setup should feel like making thoughtful
> choices about her family, not configuring a software system.

> **Mom experience goal:** The Command Center should feel like stepping into
> a beautiful overview of her life — a moment of clarity, not a dashboard.

> **Mom experience goal:** Guiding Stars should feel like a private anchor,
> not a productivity tool. The tone is reflective, not administrative.
```

Place these in the Overview section or directly above the most important screen description.

---

## Habit 7: Flag Forward-Compatibility Considerations

When a design decision may need to evolve — but is intentionally constrained for launch — say so.

**Why it matters:** At audit time, Opus will evaluate forward-focus. If it doesn't know which constraints are launch-scoped vs. permanent, it may recommend changes to things you already know need to evolve. Flagging them invites better suggestions.

**Format:**
```
> **Forward note:** [What may evolve and why it's constrained now.]
```

**Examples:**

```
> **Forward note:** Play shell is intentionally minimal at launch. Future versions
> may introduce voice-first interaction or parent-curated AI experiences for young
> children. Architecture should not foreclose these paths.

> **Forward note:** LiLa's context loading is feature-scoped at launch. Future
> versions may support cross-feature context synthesis. Data model should support
> this without requiring schema changes.

> **Forward note:** Tier pricing is TBD pending beta usage data. Infrastructure
> supports any tier configuration — specific feature-to-tier assignments will be
> tuned post-launch.
```

---

## The Audit Prompt (Draft — To Be Refined Before Use)

When all PRDs are written, this prompt (or a refined version) will be used to initiate the Opus audit session in Claude Code:

```
You are auditing the complete PRD set for MyAIM Family v2, a mom-first family
management and productivity platform. All PRDs are available in this workspace.

Please conduct a thorough audit across the following lenses:

**1. Cross-PRD Consistency**
- Identify any place where two PRDs make conflicting assumptions about the same
  feature, permission, schema, or behavior
- Verify that every cross-PRD dependency (marked "Depends on:") is actually
  fulfilled by the referenced PRD
- Check that shell behavior is consistent for shared features across all PRDs
  that touch each shell

**2. Completeness**
- Identify any shell behavior table entries that are vague, missing, or
  inconsistent with the permission model
- Flag any Deferred items that appear to have no resolution path
- Note any features that reference data or components from other PRDs without
  a formal dependency declaration

**3. Mom-Friendliness & UX Elegance**
- Evaluate key flows against their stated "Mom experience goal" notes
- Identify anywhere the design appears to serve platform logic over mom's
  mental model
- Flag flows with more steps or friction than necessary for their value

**4. Forward Focus**
- Given where consumer expectations for family apps and AI assistants are
  heading, identify any areas where the current design may feel dated or
  limited at launch
- Note opportunities to make features feel more intelligent, adaptive, or
  personalized without requiring architectural changes
- Flag any "Forward note" items that may need design attention before launch

**5. Tier Structure Coherence**
- Evaluate whether the tier-gated features collectively form a compelling
  value proposition at each tier
- Identify any features that seem mis-tiered relative to their audience

For each finding, note:
- Which PRD(s) are affected
- The specific section and decision
- Whether this appears to be an oversight, a tension worth discussing, or
  an opportunity to improve
- A suggested resolution or direction

Do not flag items marked "Decision rationale:" as problems unless the rationale
itself appears to conflict with the platform's stated principles. Treat Deferred
items as known — note only if a deferral appears to have downstream consequences
that haven't been accounted for.
```

---

## Quick Reference Checklist

Before finalizing any PRD, scan for:

- [ ] Non-obvious decisions have a `> **Decision rationale:**` note
- [ ] All deferred/stubbed items have a `> **Deferred:**` tag with a resolution path
- [ ] Cross-PRD assumptions have a `> **Depends on:**` note
- [ ] Shell behavior table includes all five shells with no blank entries
- [ ] Tier Gating section is filled, even if just "available at all tiers"
- [ ] At least one `> **Mom experience goal:**` note on the most important flow
- [ ] Any launch-scoped constraints have a `> **Forward note:**` tag

---

*Addendum version: 1.0*
*Companion to: MyAIM_Family_PRD_Template.md*
*Purpose: Ensuring PRD quality supports a coherent Opus 4.6 audit pass before build*
*Created: March 2026*
