# Worker 5 (Painter / Universal Scheduler Upgrade) — Review Checklist

> **Purpose:** items to specifically verify when Worker 5's output comes back for sign-off review. Not a full verification table — that lives in Worker 5's pre-build / post-build documents per `claude/PRE_BUILD_PROCESS.md`. This file captures forward-looking concerns surfaced during pre-parallel investigation that aren't covered by the standard verification ritual.

---

## Multi-assignee deed firing semantics

**The concern:** the push pattern means Worker 5 writes the deed firing at the moment a painted occurrence arrives. When a painted assignment has MULTIPLE assignees, what does Worker 5 actually write?

**Why this matters:** contracts wired to `scheduled_occurrence_active` deeds may target specific kids (or filter by `family_member_id`). If Worker 5 writes:

- One firing without `family_member_id` → contracts targeting specific kids misfire (or never qualify)
- One firing with the FIRST painted assignee → only the first kid's contracts fire; everyone else gets nothing
- One firing per assignee, each carrying their own `family_member_id` → contracts evaluate correctly for every kid

The expected correct answer is **one firing per assignee**, but it needs to be confirmed in Worker 5's actual implementation, not assumed from the dispatch prompt.

**What to verify at Worker 5 sign-off:**

1. For a painted schedule with `instantiation_mode='per_assignee_instance'` and N assignees, when the painted day arrives Worker 5 writes N deed firings (one per kid).
2. For a painted schedule with `instantiation_mode='shared_anyone_completes'` and N assignees, Worker 5's behavior here needs explicit founder review. Two reasonable answers:
   - **N firings, one per assignee** — every contract evaluates; first-completer-wins is enforced at the godmother / completion layer rather than the firing layer
   - **One firing without family_member_id (or with a special "shared pool" marker)** — contracts that need a specific kid won't fire; only contracts that match by source/category will
   The right answer depends on what contracts wired to shared-instance painted schedules need to do. Surface this to founder during sign-off if Worker 5's choice isn't obvious.
3. For per-date assignee mappings (Sun=Mosiah, Tue=Helam), the firing on each date carries that date's specific assignee in `family_member_id` — not all roster members.

**Cross-references:**
- Coordination Brief §2.3 — instantiation mode for multi-assignee schedules
- Coordination Brief §3.1 item 6 — Worker 5 owns deed-firings table; firings carry `family_member_id` of the actual assignee
- Coordination Brief §2.10 — `source_type='scheduled_occurrence_active'` locked verbatim

---

## Other Worker 5 review items (pre-existing concerns)

- **Family timezone respected** in painted-day arrival detection (Coordination Brief §2.6 — no UTC `CURRENT_DATE`).
- **Painter attaches to lists, not just tasks/routines** (Coordination Brief §3.1 item 5).
- **Per-date assignee map persists** through the `SchedulerOutput` blob.
- **Deed-firings table schema** matches Phase 3 design (Connector-Architecture-and-Routing-Model.md). If Worker 5 deviates, surface to founder before sign-off so Phase 3 inherits the right shape.
- **Universal People Picker reused** (no worker-local clone).
- **Templates carry community-readiness fields** (Coordination Brief §2.7).
- **`scheduled_occurrence_active` source_type used verbatim** in firings (no past-tense, no parent-level form).

---

## When this file gets used

Read this file at Worker 5 sign-off review, alongside Worker 5's post-build verification table. Cross-check the multi-assignee firing semantics against actual Worker 5 implementation. If the founder is satisfied, the items here can be folded into Worker 5's verification table as additional rows; otherwise they become follow-up work scoped against Phase 3.
