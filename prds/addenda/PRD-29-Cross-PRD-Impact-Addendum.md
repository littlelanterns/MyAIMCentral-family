# PRD-29 Cross-PRD Impact Addendum: BigPlans

**Created:** March 22, 2026
**Parent PRD:** PRD-29 (BigPlans)

---

## Summary of Cross-PRD Changes

PRD-29 (BigPlans) introduces a planning and system-design tool that connects deeply to the goal ecosystem, task infrastructure, AI system, and rhythm features. This addendum tracks all impacts on existing PRDs.

---

## PRD-05: LiLa Core AI System

### Guided Mode Registry Additions

Add four new guided modes to the registry:

| Mode Key | Display Name | Parent Mode | Model | Available To | Feature Key |
|----------|-------------|-------------|-------|-------------|-------------|
| `bigplans` | BigPlans | — | sonnet | mom, adult, independent | bigplans_create |
| `bigplans_goal` | BigPlans — Goal | bigplans | sonnet | mom, adult, independent | bigplans_create |
| `bigplans_project` | BigPlans — Project | bigplans | sonnet | mom, adult | bigplans_create |
| `bigplans_system` | BigPlans — System Design | bigplans | sonnet | mom, adult | bigplans_system_design |

### Intent Recognition Pattern: Friction Detection

Add a new intent recognition pattern to LiLa's intelligence layer:

**Pattern name:** `friction_detection`
**Triggers:**
- Repeated complaints about the same topic across 3+ conversations within 14 days (requires cross-conversation topic matching via pgvector)
- Explicit frustration language combined with an actionable domain (mornings, chores, meals, homework, finances, bedtime, transitions, getting-out-the-door)
- Direct requests: "I need a better way to handle X" / "Nothing works for Y" / "How do I fix X"

**Response:** Offer to route into `bigplans_system` mode. If declined, suppress re-offer for 7 days on the same topic.

**Ethics constraint:** LiLa never implies the user is failing. Frame: "friction in the system, not failure in you."

### Context Assembly Addition

Add to the LiLa context assembly pipeline for all conversation modes:

```
Active Plans (if any):
- "[Plan title]" ([plan_type], [status summary — e.g., "3/7 milestones complete, next: X by April 15"])
```

Load from `plans` table where `status = 'active'` and the plan belongs to the current member or is a family plan they're assigned to.

Plans with `nudge_in_conversations = true` allow LiLa to mention them once per conversation when contextually relevant.

---

## PRD-06: Guiding Stars & Best Intentions

### Schema Updates

Add `'bigplans'` to the `source` CHECK values on the `best_intentions` table. System-design plans can create Best Intentions as deployed components.

### Behavioral Note

Plans can link to Guiding Stars via `plans.guiding_star_ids` (UUID array). LiLa references connected Guiding Stars during planning conversations and check-ins. This is a read relationship — BigPlans reads Guiding Stars data but does not modify it.

---

## PRD-08: Journal + Smart Notepad

### Schema Update

Add column to `journal_entries`:

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| related_plan_id | UUID | | NULL | FK → plans. Links journal entries to BigPlans plans. |

**Index:** `(related_plan_id)` — lookup entries for a specific plan.

### RoutingStrip Update

Add BigPlans as a RoutingStrip destination:

| Destination | Icon | Label | Behavior |
|-------------|------|-------|----------|
| BigPlans | Lucide `Target` or `Map` | "BigPlans" | Deposits content into `studio_queue` with `source = 'project_planner'`, `destination = 'plan'`. Content becomes a plan seed. |

---

## PRD-09A: Tasks, Routines & Opportunities

### Stub Status Updates

| Stub | Previous Status | New Status | How Wired |
|------|----------------|------------|-----------|
| `source = 'project_planner'` on tasks table | STUB | WIRED | Tasks created from BigPlans milestone breakdown use this source value. |
| `related_plan_id` FK on tasks table | STUB | WIRED | Set on all tasks created from BigPlans milestones. Enables traceability from task back to plan. |

### Sequential Collection Integration

BigPlans milestones can generate sequential collections. The "Create Sequential" action on a milestone:
1. Creates a `sequential_collections` record
2. Creates task instances within the collection with `source = 'project_planner'` and `related_plan_id` set
3. Items promote in chronological order per the existing sequential infrastructure

---

## PRD-12A: Personal LifeLantern

### Stub Status Update

| Stub | Previous Status | New Status | How Wired |
|------|----------------|------------|-----------|
| "Complex multi-step long-term goal → Project Planner (stub)" in Goal Generation | STUB | WIRED | Routes to BigPlans creation via `studio_queue` with `source = 'goal_decomposition'`. LiLa no longer says "I'll break this into Tasks instead" — it routes to BigPlans for full plan creation. |

Update Screen 6 (Goal Generation) routing logic:

| Goal Type | Destination | Creation Method |
|-----------|-------------|-----------------|
| Complex multi-step long-term goal | **BigPlans (PRD-29)** | Routed: deposits into `studio_queue` with `source = 'goal_decomposition'`, `destination = 'plan'`. Opens BigPlans creation with goal context pre-filled. |

---

## PRD-17: Universal Queue & Routing System

### Stub Status Updates

| Stub | Previous Status | New Status | How Wired |
|------|----------------|------------|-----------|
| Project planner → `studio_queue` deposit | STUB | WIRED | BigPlans deposits milestone-generated tasks and trackers into the queue with `source = 'project_planner'`. |
| Goal decomposition → `studio_queue` deposit | STUB | WIRED | LifeLantern complex goals route to BigPlans via queue with `source = 'goal_decomposition'`. |

### Destination Value Addition

Add `'plan'` to the `destination` CHECK constraint on `studio_queue`. This enables Notepad → BigPlans routing and LifeLantern → BigPlans routing.

---

## PRD-18: Rhythms & Reflections

### Periodic Rhythm Card Registration

BigPlans registers check-in rhythm cards as a periodic rhythm source. When a plan has `check_in_rhythm` set (weekly/biweekly/monthly), a rhythm card appears inline within the morning rhythm on the configured check-in day.

**Card content:**
- Plan title
- Brief progress summary (milestones completed / total)
- For system-design plans in trial: "Day X of Y — how's the system working?"
- "Check In Now" button → opens LiLa BigPlans check-in conversation
- "Snooze" option → delays to next day

**Card key:** `bigplans_checkin_{plan_id}`
**Tracking:** `rhythm_completions` with `rhythm_key = 'bigplans_checkin'`, `period` matching the check-in date

---

## PRD-11: Victory Recorder

### Source Value Additions

Add two new victory source values:
- `'plan_completed'` — triggered when a plan's status changes to 'completed'. Suggested victory text references the plan title and duration.
- `'milestone_completed'` — triggered when a milestone's status changes to 'completed'. Suggested victory text references the milestone and its parent plan.

Both are suggestions (Human-in-the-Mix) — the user confirms before the victory is created.

---

## Platform Intelligence Pipeline v2

### Capture Channel Addition

Add BigPlans as a new capture channel:

**Channel:** System Design Patterns
**What's captured:** Anonymized structural patterns from system-design plans — which friction categories are most common, which component combinations are deployed together, which trial modifications are most frequent.
**Privacy:** Only structural patterns cross the wall. No personal details, family names, or specific friction descriptions.
**Pipeline stage:** Stage 1 (Capture) → Stage 2 (Admin Review) → Stage 3 (Platform Intelligence)

---

## Build Order Source of Truth v2

### Section 2 Addition

Add to completed PRDs:

| PRD # | Feature Name | Key DB Tables |
|-------|-------------|--------------|
| **PRD-29** | BigPlans | `plans`, `plan_milestones`, `plan_components`, `plan_check_ins`, `friction_diagnosis_templates` (platform_intelligence), `freebie_friction_results` (stub) |

### Section 8 Addition (Guided Modes)

| Mode Key | Display Name | Registered By |
|----------|-------------|---------------|
| `bigplans` | BigPlans | PRD-29 |
| `bigplans_goal` | BigPlans — Goal | PRD-29 |
| `bigplans_project` | BigPlans — Project | PRD-29 |
| `bigplans_system` | BigPlans — System Design | PRD-29 |

---

*End of PRD-29 Cross-PRD Impact Addendum*
