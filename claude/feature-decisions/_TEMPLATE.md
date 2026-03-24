# Feature Decision File: [PRD-XX — Feature Name]

> **Created:** [date]
> **PRD:** `prds/[category]/PRD-XX-FeatureName.md`
> **Addenda read:**
>   - `prds/addenda/PRD-XX-Cross-PRD-Impact-Addendum.md`
>   - *(list every addendum read — if you read it, it goes here)*
> **Founder approved:** [date]

---

## What Is Being Built

*(One paragraph — what this feature does from the user's perspective, plain language)*

---

## Screens & Components

*(Exhaustive list — every screen, every modal, every drawer, every card, every empty state.
If it renders, it's listed here. Nothing assumed.)*

| Screen / Component | Notes |
|---|---|
| | |

---

## Key PRD Decisions (Easy to Miss)

*(The things most likely to be overlooked, misread, or built wrong. Pull these out explicitly.
Field names, enum values, visibility rules, conditional behavior, empty states.)*

1.
2.
3.

---

## Addendum Rulings

*(Every decision from every addendum that affects this build.
If an addendum overrides or clarifies the PRD, call that out explicitly.)*

### From [Addendum filename]:
-

### From [Addendum filename]:
-

---

## Database Changes Required

*(Every table being created or modified. Every column. Every index. Every trigger.
Migration approach — what SQL runs, in what order.)*

### New Tables
-

### Modified Tables (columns being added)
-

### Migrations
-

---

## Feature Keys

*(Every feature key for this PRD. Must be registered in `feature_key_registry`.)*

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| | | | |

---

## Stubs — Do NOT Build This Phase

*(Explicit list of things that are out of scope. If it's in the PRD but not being built now,
name it here so it doesn't accidentally get built or expected.)*

- [ ]
- [ ]

---

## Cross-Feature Connections

*(What this feature receives from other features, and what it sends to other features.
Both directions. Be specific about table names and field names.)*

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| | → | | |
| | ← | | |

---

## Things That Connect Back to This Feature Later

*(Other features that will wire into this one when they're built.
Document so future builds know what to look for here.)*

-

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> Completed after build, before declaring the phase done.
> Every requirement from the PRD and addenda — accounted for.
> Zero Missing = build complete.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | PRD §/ Addendum | Wired / Stubbed / Missing | |

**Status key:** Wired = built and functional · Stubbed = in STUB_REGISTRY.md · Missing = incomplete

### Summary
- Total requirements verified:
- Wired:
- Stubbed:
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
