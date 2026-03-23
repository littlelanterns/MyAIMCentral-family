# PRD-32A: Demand Validation Engine & Planned Expansion Stubs

**Status:** Not Started
**Dependencies:** PRD-32 (Admin Console — Feedback tab hosts the admin dashboard), PRD-02 (Permissions — View As mode for Guided/Play voting), PRD-04 (Shell Routing — component renders in all shells with visibility rules)
**Created:** March 21, 2026
**Last Updated:** March 21, 2026

---

## Overview

Rather than leaving unbuilt features as blank space or broken UI, every feature that exists in the PRD set but hasn't been built yet surfaces as a **Planned Expansion Card** in its intended location. This transforms "not built yet" from a gap into a data collection opportunity — passively gathering real user demand signals to drive build prioritization while making beta launch feel intentional rather than incomplete.

The system has two sides: a lightweight, reusable `<PlannedExpansionCard>` component that any stub drops into its intended location, and a **Demand Validation dashboard** in the Admin Console's Feedback tab where the founder reviews aggregated vote counts, freeform notes, and role-based demand breakdowns to prioritize what to build next.

> **Mom experience goal:** Encountering an unbuilt feature should feel like discovering something exciting on the horizon — not like hitting a dead end. The card celebrates curiosity and invites participation in shaping the platform.

---

## User Stories

### Family Members
- As a mom, I want to see what features are coming so I know the platform is growing and I can tell the team what matters to my family.
- As a mom using View As for my younger child, I want to vote on planned features from the child's perspective so the team knows what families with young kids need.
- As a dad, I want to quickly indicate whether a planned feature would be useful so my input shapes the platform without requiring a long form.
- As a teen, I want to vote on features that would appear in my dashboard so the teen experience reflects what teens actually want.

### Admin
- As the founder, I want to see which planned features have the highest demand so I can prioritize the build order based on real user signals instead of guesswork.
- As the founder, I want to filter demand by role type (Mom, Dad, Teen) so I can see if certain features skew toward particular family members.
- As the founder, I want to read freeform notes from users so I understand not just whether they want a feature but what they hope it does.
- As the founder, I want to export the demand data so I can use it in planning sessions with Claude or share with future team members.

---

## Screens

### Screen 1: Planned Expansion Card (User-Facing — In Family App)

> **This is a reusable component, not a page.** It renders wherever a stubbed feature would live — on dashboards, in sidebars, within tab containers, etc.

**What the user sees (initial state):**

```
┌──────────────────────────────────────────────────────┐
│  ✨ Coming Soon                                      │
│                                                      │
│  [Feature Name]                                      │
│  [Brief description of what this feature will do]    │
│                                                      │
│  Would this be useful to your family?                │
│                                                      │
│  [Yes, definitely!]     [Not for us]                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**After tapping "Yes, definitely!":**

```
┌──────────────────────────────────────────────────────┐
│  ✨ Coming Soon                                      │
│                                                      │
│  [Feature Name]                                      │
│  [Brief description]                                 │
│                                                      │
│  ✓ Thanks! We'll prioritize this.                    │
│                                                      │
│  Want to tell us more? (optional)                    │
│  ┌────────────────────────────────────────────────┐  │
│  │ What would you hope it does?                   │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│  [Submit]                                            │
│                                                      │
│  [Change my answer]                                  │
└──────────────────────────────────────────────────────┘
```

**After tapping "Not for us":**

```
┌──────────────────────────────────────────────────────┐
│  ✨ Coming Soon                                      │
│                                                      │
│  [Feature Name]                                      │
│  [Brief description]                                 │
│                                                      │
│  ✓ Got it — noted!                                   │
│                                                      │
│  [Change my answer]                                  │
└──────────────────────────────────────────────────────┘
```

**After submitting a note (or after voting without adding a note):**

```
┌──────────────────────────────────────────────────────┐
│  ✨ Coming Soon                                      │
│                                                      │
│  [Feature Name]                                      │
│  [Brief description]                                 │
│                                                      │
│  ✓ You voted: Yes! · [Change my answer]              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

> **Decision rationale:** The card collapses to a compact "you already voted" state after interaction. This prevents the card from dominating the page on repeat visits while still showing the user their vote and allowing changes. The freeform note field only appears on "Yes" votes because positive demand notes ("I'd use this for X") are more actionable than rejection reasons.

**Key behaviors:**
- **One card per feature per location.** If a feature stub appears in multiple places (e.g., a widget stub on the dashboard and a full-page stub in the sidebar), each location shows the card. Votes are per-feature, not per-location — voting on either card registers the same `feature_key`.
- **Returning visitors see their previous vote state.** The card queries `feature_demand_responses` for the current `family_member_id` + `feature_key` and renders the post-vote compact state if a response exists.
- **"Change my answer"** inserts a new response record with a fresh `responded_at` timestamp. The original response is preserved (soft update, not overwrite). The admin dashboard shows the most recent response as the active vote.
- **Vote history preserved.** If a member votes Yes, then changes to No, then changes back to Yes, all three responses are stored. The admin dashboard uses the most recent `responded_at` per member per feature as the active vote, but the full history is available for analysis.

**Interactions:**
- Tap "Yes, definitely!" → records `response = 'yes'`, shows note field
- Tap "Not for us" → records `response = 'no'`, shows compact confirmation
- Type a note + tap "Submit" → updates the response record with the note text
- Tap "Change my answer" → resets the card to the initial voting state, allowing a new vote

**Data created/updated:**
- `feature_demand_responses` INSERT on each vote (including changed votes — new row, not UPDATE)

---

### Screen 2: Demand Validation Dashboard (Admin — In Feedback Tab)

> **Depends on:** PRD-32 Feedback tab. This is a third sub-view alongside Submissions and Known Issues.

**What the admin sees:**

```
┌──────────────────────────────────────────────────────────┐
│  Feedback                                                │
│  ──────────────────────────────────────────────────────  │
│  [Submissions] [Known Issues] [Demand Validation]        │
│  ──────────────────────────────────────────────────────  │
│                                                          │
│  Planned Features — User Demand                          │
│  ──────────────────────────────────────────────────────  │
│  Filter: [All Roles ▾]     Sort: [Demand % ▾]           │
│                                          [Export CSV]    │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 📊 Project Planner                                 │  │
│  │ ████████████████████░░░░ 84% Yes · 38 votes        │  │
│  │ Mom: 22 yes / 3 no · Dad: 8 yes / 1 no            │  │
│  │ Teen: 4 yes / 0 no                                 │  │
│  │ 💬 12 notes                           [View Notes] │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ 📊 ThoughtSift — Decision Tools                    │  │
│  │ ██████████████████░░░░░░ 76% Yes · 29 votes        │  │
│  │ Mom: 18 yes / 4 no · Dad: 3 yes / 2 no            │  │
│  │ Teen: 2 yes / 0 no                                 │  │
│  │ 💬 8 notes                            [View Notes] │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ 📊 Caregiver Tools                                 │  │
│  │ ███████████░░░░░░░░░░░░░ 45% Yes · 11 votes        │  │
│  │ Mom: 5 yes / 6 no · Dad: 0 yes / 0 no             │  │
│  │ Teen: 0 yes / 0 no                                 │  │
│  │ 💬 3 notes                            [View Notes] │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key elements:**
- **Feature list:** Every feature in the `feature_expansion_registry` with at least one vote, sorted by demand percentage (default) or total votes, or alphabetically.
- **Per-feature summary:** Feature name, demand bar (visual % of Yes votes), total vote count, role breakdown (Mom/Dad/Teen counts separately — Guided/Play votes from View As show under "Mom" since mom is the voter), note count.
- **Role filter:** All Roles, Mom Only, Dad Only, Teen Only. Filters both the vote counts and the notes.
- **Sort options:** Demand % (default), Total Votes, Most Notes, Alphabetical.
- **"View Notes" button:** Expands the card to show all freeform notes for that feature, scrollable, with the voter's role and timestamp. Notes are searchable within the expanded view.
- **Export CSV:** Exports all demand data — feature key, feature name, total yes, total no, yes %, per-role breakdowns, all notes with role and timestamp.

**Expanded notes view:**

```
┌────────────────────────────────────────────────────────┐
│ 📊 Project Planner — Notes (12)           [Collapse]   │
│ ────────────────────────────────────────────────────── │
│ 🔍 Search notes...                                     │
│                                                        │
│ 👩 Mom · Mar 18: "I need this for planning our         │
│    homeschool year — subjects, deadlines, supplies"     │
│                                                        │
│ 👩 Mom · Mar 17: "Would love to plan family             │
│    vacations step by step with this"                    │
│                                                        │
│ 👨 Dad · Mar 16: "I'd use this for home                │
│    renovation project tracking"                         │
│                                                        │
│ 👩‍👧 Teen · Mar 15: "College application                │
│    planning would be amazing"                           │
│                                                        │
│ ... (scrollable)                                       │
└────────────────────────────────────────────────────────┘
```

> **Decision rationale:** The Demand Validation dashboard lives under the Feedback tab because it's user-generated input about what they want, which is conceptually the same as feature requests — just structured and in-context rather than freeform. Putting it alongside Submissions and Known Issues keeps all "what users are telling us" data in one place.

**Interactions:**
- Filter by role → recalculates percentages and counts for the selected role
- Sort → reorders the feature list
- View Notes → inline expand with scrollable, searchable note list
- Export CSV → downloads all data as a CSV file
- Click a feature name → no action (no drill-down page at MVP — the expanded notes view is sufficient)

**Data read:**
- `feature_demand_responses` — aggregated by feature_key, grouped by role
- `feature_expansion_registry` — config file providing feature names and descriptions

---

## The PlannedExpansionCard Component

### Component API

```
<PlannedExpansionCard featureKey="project_planner" />
```

That's it. One prop. Everything else is derived:

- **Feature name and description** come from the `feature_expansion_registry` config object, keyed by `featureKey`.
- **Current user's vote state** is fetched from `feature_demand_responses` for the current `family_member_id` + `featureKey`.
- **Visibility** is determined by shell type and View As state (see Visibility rules below).

> **Decision rationale:** A single-prop component means every stub in every PRD simply drops in `<PlannedExpansionCard featureKey="xxx" />`. No custom UI per feature. No database work to add a new stub. The registry config file is the only thing that needs a new entry.

### The Feature Expansion Registry

A TypeScript constant file (not a database table) that maps feature keys to display info:

```typescript
// feature_expansion_registry.ts
export const FEATURE_EXPANSION_REGISTRY: Record<string, {
  name: string;
  description: string;
  location_hint?: string; // helps admin understand where the card appears
}> = {
  project_planner: {
    name: "Project Planner",
    description: "Plan and track long-term goals, multi-step projects, and family initiatives with milestone tracking and LiLa guidance.",
    location_hint: "Personal Dashboard sidebar, Family Hub"
  },
  thoughtsift_decision_tools: {
    name: "ThoughtSift — Decision & Thinking Tools",
    description: "A suite of thinking tools: Board of Directors persona panel, Perspective Shifter, Decision Guide, Mediator, and fun Translator.",
    location_hint: "Personal Dashboard, LiLa drawer"
  },
  caregiver_tools: {
    name: "Caregiver Tools",
    description: "Shift management, activity logging, and real-time coordination for babysitters, nannies, and other caregivers.",
    location_hint: "Special Adult shell, Settings"
  },
  // ... every stubbed feature gets an entry
};
```

> **Forward note:** During the pre-build audit, Opus can generate the initial registry by extracting every stubbed feature across all PRDs. This ensures comprehensive coverage from day one without manual cataloging. The registry file is then maintained as features are built (entries removed) or new stubs are added.

> **Decision rationale:** A config file rather than a database table because (a) feature stubs are developer-managed, not admin-managed — they change when code ships, not when an admin clicks a button, (b) zero database migration to add or remove a stub, and (c) the registry is part of the codebase, so it's version-controlled alongside the components that render the cards.

---

## Visibility & Permissions

### PlannedExpansionCard Visibility

| Role | Sees Card? | Can Vote? | Notes |
|------|-----------|-----------|-------|
| Mom / Primary Parent | Yes | Yes | Sees cards in her own dashboard and everywhere she navigates. |
| Dad / Additional Adult | Yes | Yes | Sees cards in his shell. Votes attributed to his `family_member_id`. |
| Special Adult | No | No | Special Adults have scoped access during shifts — expansion cards would be confusing in that context. |
| Independent (Teen) | Yes | Yes | Sees cards in the Independent shell. Votes attributed to their `family_member_id`. |
| Guided | No (directly) | Via View As | Child doesn't see cards in their own shell. Mom sees cards when using View As for this child. Mom's vote is attributed to the child's `family_member_id` with `voted_via_view_as = true`. |
| Play | No (directly) | Via View As | Same as Guided. |

> **Decision rationale:** Guided and Play shell users are young children whose dashboard should stay focused on their tasks and celebrations, not product development questions. Mom sees the expansion cards when she's in View As mode for these children, allowing her to vote from the child's perspective based on what she knows they'd benefit from. The `voted_via_view_as` flag preserves the distinction between "mom wants this for herself" and "mom thinks her child would benefit from this" in the admin analytics.

### Shell Behavior

- **Mom shell:** Cards appear wherever stubs exist in mom's navigation — dashboard widget slots, sidebar feature slots, page placeholders.
- **Dad/Additional Adult shell:** Cards appear in dad's shell where stubs exist. Fewer locations than mom (dad has a more limited shell).
- **Special Adult shell:** No cards. Special Adults are task-focused during shifts.
- **Independent (Teen) shell:** Cards appear in teen's shell where stubs exist. Teen-relevant features get teen votes.
- **Guided shell:** No cards in the child's direct view. Cards visible in View As mode.
- **Play shell:** No cards in the child's direct view. Cards visible in View As mode.

### Admin Dashboard Visibility

The Demand Validation sub-view in the Feedback tab follows the same permission model as the rest of the Feedback tab: requires `feedback_admin` or `super_admin` permission.

### Privacy & Transparency

Demand responses are not visible to other family members. A teen's vote is not shown to mom within the family app. The admin dashboard shows aggregated data by role type, not by individual family member name — though the admin can see which family a response came from if needed for context. No teen transparency rules apply to demand responses.

---

## Data Schema

### Table: `feature_demand_responses`

All user votes on planned expansion features.

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| id | UUID | gen_random_uuid() | NOT NULL | PK |
| family_id | UUID | | NOT NULL | FK → families |
| family_member_id | UUID | | NOT NULL | FK → family_members. The member whose perspective this vote represents. For View As votes, this is the child being viewed, not mom. |
| feature_key | TEXT | | NOT NULL | Matches key in `feature_expansion_registry` config. |
| response | TEXT | | NOT NULL | CHECK: 'yes', 'no' |
| note | TEXT | | NULL | Optional freeform text (only on 'yes' votes) |
| voted_via_view_as | BOOLEAN | false | NOT NULL | True if mom voted on behalf of a Guided/Play child via View As mode. |
| actual_voter_id | UUID | | NULL | FK → family_members. If `voted_via_view_as = true`, this is mom's `family_member_id`. NULL if the member voted directly. |
| responded_at | TIMESTAMPTZ | now() | NOT NULL | When this specific response was recorded. |
| created_at | TIMESTAMPTZ | now() | NOT NULL | |

**RLS Policy:** Family members can INSERT for their own `family_member_id` (or for children they have View As access to). Family members can READ their own responses (to show vote state on the card). Admin can read all.

> **Decision rationale:** Each vote is a new INSERT, not an UPDATE. This preserves the full history of opinion changes. The admin dashboard uses the most recent `responded_at` per `family_member_id` per `feature_key` to determine the "active" vote. Historical votes are available for trend analysis (e.g., "did demand for this feature grow over time?").

**Indexes:**
- `(family_member_id, feature_key, responded_at DESC)` — "this member's current vote on this feature" (most recent first)
- `(feature_key, response)` — "total yes/no counts per feature" (primary admin query)
- `(feature_key, responded_at DESC)` — "all votes for this feature, newest first"
- `(family_id)` — "all votes from this family"

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| **Every stubbed feature location** | `<PlannedExpansionCard>` renders in the stub's intended location. User interacts → creates `feature_demand_responses` record. |
| **View As mode (PRD-02)** | When mom is in View As for a Guided/Play child and encounters a card, her vote is attributed to the child's `family_member_id` with `voted_via_view_as = true` and `actual_voter_id` = mom's ID. |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| **PRD-32 Feedback tab** | Demand Validation dashboard reads aggregated data from `feature_demand_responses`. |
| **Build order decisions** | Export CSV provides data for founder review and build prioritization. Not an automated flow — human decision-making. |

---

## AI Integration

None. This feature is entirely human-driven — users vote, admin reviews. No AI classification, no AI-generated suggestions. The simplicity is intentional.

> **Decision rationale:** Demand validation should be raw signal from real users, not filtered or interpreted by AI. The founder should see exactly what families said and make prioritization decisions directly.

---

## Edge Cases

### Feature Gets Built (Card Removal)
- When a feature is built and deployed, its entry is removed from the `feature_expansion_registry` config file. The `<PlannedExpansionCard>` component checks the registry — if the `featureKey` doesn't exist in the registry, the component renders nothing (silent no-op, not an error).
- Historical `feature_demand_responses` data is preserved in the database. The admin dashboard still shows it (grayed out or in a "Built" section) for reference.

> **Decision rationale:** Silent no-op means removing a feature from the registry is all that's needed during deployment. No database cleanup, no migration, no risk of broken UI if a card is missed during removal.

### Same Feature Key Used for Card in Multiple Locations
- Multiple `<PlannedExpansionCard>` components can exist for the same `featureKey` on different pages. They all read from and write to the same `feature_demand_responses` data. If a user votes on the dashboard stub, the sidebar stub also shows the voted state.
- This is handled naturally by the component querying by `family_member_id` + `feature_key`.

### User Votes Then Account Is Deleted
- Soft delete (30-day window): votes preserved, attributed to member.
- Hard delete: votes remain in database with orphaned `family_member_id`. Admin dashboard shows the vote in aggregate counts but the individual attribution shows "[deleted member]."

### Feature Key in Database but Not in Registry
- If a `feature_demand_responses` record references a `feature_key` that no longer exists in the registry (feature was built or renamed), the admin dashboard still shows it using the raw `feature_key` string. A small "Unknown Feature" badge indicates the registry entry was removed.
- No data loss. No errors.

### Very Long Freeform Notes
- Text field has a 500-character limit. Sufficient for a meaningful response without allowing essay-length submissions.

### Rapid Vote Changes (Abuse/Spam)
- No rate limiting on vote changes. Each change is a new INSERT, so rapid toggling just creates more rows. The admin dashboard only looks at the most recent `responded_at`, so rapid toggling has zero impact on the displayed metrics.
- If this somehow becomes a storage concern (extremely unlikely), a scheduled cleanup can consolidate old vote-change rows, keeping only the most recent per member per feature.

### View As Vote Attribution
- When mom votes via View As, the card component detects View As mode (from the auth context) and sets `voted_via_view_as = true` and `actual_voter_id = mom's ID`.
- On the admin dashboard, View As votes are counted under the child's role type for demand analysis (since the vote represents the child's needs) but marked with a subtle indicator so the admin knows it was mom voting on behalf of the child, not the child directly.
- If mom votes for Feature X on her own dashboard (attributed to herself) and then also votes Yes for Feature X while in View As for her 5-year-old (attributed to the child), both votes count — they represent two distinct signals (mom wants it for herself AND thinks her child would benefit).

---

## Tier Gating

No tier-specific gating. Planned Expansion Cards are visible at all tiers. Responses are collected regardless of tier.

> **Tier rationale:** Every user's input on feature prioritization is valuable. Gating demand validation by tier would bias the data toward higher-paying users and miss signals from the broader user base. Free/Essential tier users voting "Yes, definitely!" on a Full Magic feature is actually the most valuable signal — it indicates upgrade potential.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| "Built" section in admin dashboard showing historical demand for shipped features | Post-MVP analytics view | Post-MVP enhancement |
| Demand trend analysis (vote counts over time per feature) | Post-MVP analytics chart | Post-MVP enhancement |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| Every `<PlannedExpansionCard>` location | All PRDs with stubbed features | Cross-cutting: any PRD's stub can use the component. The `feature_expansion_registry` is the master list of all available expansion cards. |

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `<PlannedExpansionCard>` component implemented with single `featureKey` prop
- [ ] Component renders feature name and description from `feature_expansion_registry`
- [ ] Yes/No voting functional with immediate visual feedback
- [ ] Optional freeform note field appears on "Yes" votes
- [ ] "Change my answer" creates a new response record (INSERT, not UPDATE)
- [ ] Component shows previous vote state on return visits
- [ ] Component renders nothing (silent no-op) if `featureKey` not in registry
- [ ] View As detection: votes attributed to viewed child with `voted_via_view_as = true`
- [ ] `feature_demand_responses` table created with RLS policies
- [ ] RLS verified: members can only INSERT for their own ID (or View As children), can READ their own responses
- [ ] `feature_expansion_registry` config file created with initial feature entries (generated during pre-build audit)
- [ ] Cards visible in Mom, Dad, Independent shells; hidden in Guided/Play direct view; visible in View As
- [ ] Cards NOT visible in Special Adult shell
- [ ] Demand Validation sub-view added to PRD-32 Feedback tab
- [ ] Admin dashboard shows per-feature vote counts, percentages, role breakdowns
- [ ] Admin dashboard shows freeform notes (expandable, searchable)
- [ ] Role filter functional on admin dashboard
- [ ] Sort by Demand %, Total Votes, Most Notes, Alphabetical
- [ ] Export CSV functional with all demand data
- [ ] 500-character limit on freeform notes

### Post-MVP
- [ ] "Built" section showing historical demand for shipped features
- [ ] Demand trend visualization (vote counts over time)
- [ ] Auto-suggestion: when a user submits a feature request via the Feedback FAB that matches an existing expansion card's keywords, suggest they vote on the card instead
- [ ] Notification to admin when a feature crosses a demand threshold (e.g., 80% Yes with 20+ votes)

---

## CLAUDE.md Additions from This PRD

- [ ] Convention: Every stubbed feature uses `<PlannedExpansionCard featureKey="xxx" />`. No custom stub UI per feature. The featureKey must match an entry in `feature_expansion_registry.ts`.
- [ ] Convention: When a feature is built and deployed, remove its entry from `feature_expansion_registry.ts`. The component will silently render nothing. Do not delete `feature_demand_responses` data.
- [ ] Convention: Demand responses use INSERT-only (never UPDATE). Each vote change is a new row. The active vote is the most recent `responded_at` per `family_member_id` per `feature_key`.
- [ ] Convention: In View As mode, `<PlannedExpansionCard>` detects the viewed member from auth context and attributes the vote to the child's `family_member_id`, not mom's.
- [ ] Convention: The `feature_expansion_registry` is a TypeScript config file, not a database table. Adding/removing stubs is a code change, not a migration.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: `feature_demand_responses`
Enums updated: None
Triggers added: None

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Admin dashboard lives in Feedback tab as a third sub-view | Demand votes are user-generated input about what they want — conceptually aligned with feature requests and other feedback. |
| 2 | Mom, Dad, and Teen see cards directly; Guided/Play only via View As | Young children's dashboards stay focused on their tasks. Mom votes on behalf of children based on what she knows they'd benefit from. |
| 3 | Written as PRD-32A addendum (not merged into PRD-32) | Cross-cutting component + admin dashboard warrants its own focused document. Keeps PRD-32 focused on the admin console itself. |
| 4 | Config file registry, not database table | Feature stubs are developer-managed, version-controlled, and change at deployment — not admin-runtime. Zero migrations to add/remove stubs. |
| 5 | INSERT-only vote history | Preserves full opinion change history. Active vote determined by most recent timestamp. Enables future trend analysis. |
| 6 | View As votes attributed to child with `voted_via_view_as` flag | Preserves the distinction between "mom wants this" and "mom thinks her child needs this" while counting the child's perspective in role-based demand analysis. |
| 7 | Silent no-op for missing registry entries | Removing a feature from the registry is the only step needed at deployment. No broken UI, no cleanup, no migration. |
| 8 | No AI integration | Demand validation should be raw human signal, not AI-interpreted. Founder sees exactly what families said. |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | "Built" section in admin dashboard | Post-MVP. Historical demand data preserved in database. |
| 2 | Demand trend visualization | Post-MVP. Time-series vote data available for charting. |
| 3 | Auto-linking feedback FAB feature requests to expansion cards | Post-MVP. Keyword matching between freeform requests and registry entries. |
| 4 | Threshold notifications | Post-MVP. Alert admin when a feature hits a demand milestone. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-32 (Admin Console) | Feedback tab gains a third sub-view: "Demand Validation." Navigation updated from `[Submissions] [Known Issues]` to `[Submissions] [Known Issues] [Demand Validation]`. | Add Demand Validation sub-view to Feedback tab. |
| PRD-02 (Permissions — View As) | View As mode now affects `<PlannedExpansionCard>` behavior: votes attributed to the viewed child, not mom. | Note that View As context is consumed by the PlannedExpansionCard component. |
| PRD-04 (Shell Routing) | `<PlannedExpansionCard>` renders in all shells except Special Adult (hidden) and Guided/Play (hidden in direct view, visible in View As). | Add component to shell layout rendering rules. |
| All PRDs with stubbed features | Every stub location can use `<PlannedExpansionCard featureKey="xxx" />` instead of a blank placeholder or "Coming Soon" modal. | During pre-build audit, generate initial `feature_expansion_registry.ts` from all stubbed features across all PRDs. |
| Build Order Source of Truth | PRD-32A completed. Planned Expansion system designed. | Add to completed PRDs list. Note that the registry generation is a pre-build audit task. |

---

*End of PRD-32A*
