# PRD-32 Personas Cross-PRD Impact Addendum
## Admin Console — Personas Tab — Impact on Existing PRDs

**Created:** 2026-04-23
**Parent PRD:** PRD-32 (Admin Console — Personas Tab appended section)
**Sibling Artifact:** PRD-34 Persona Architecture Addendum (Artifact A)
**Triage Origin:** SCOPE-4.F4 (Row 11) Wave 1B prerequisite

---

## Impact on PRD-02 (Permissions & Access Control)

**What changed:**
- New `staff_permissions.permission_type` value registered: `persona_admin`. Joins existing values (`super_admin`, `vault_admin`, `moderation_admin`, `system_admin`, `analytics_admin`, `feedback_admin`).
- `super_admin` grants access to all admin tabs including Personas.
- `persona_admin` is additive — an admin can hold this permission independently of other admin permissions.

**Action needed:**
- Add `persona_admin` to `staff_permissions.permission_type` documentation (or CHECK constraint if formalized).

---

## Impact on PRD-04 (Shell Routing & Layouts)

**What changed:**
- New admin sub-route: `/admin/personas`. Joins existing `/admin/vault` (PRD-21B), `/admin/moderation` (PRD-21C), `/admin/system`, `/admin/analytics`, `/admin/feedback` (PRD-32 base).
- No change to user-facing shell layouts — the Personas tab is admin-only, does not appear in any family shell.

**Action needed:**
- Add `/admin/personas` to admin routing config as staff-only route gated by `persona_admin` or `super_admin`.

---

## Impact on PRD-34 (ThoughtSift — Decision & Thinking Tools)

**What changed:**
- PRD-34 Persona Architecture Addendum (Artifact A) defines the classifier, embedding pre-screen, `persona_promotion_queue` schema, and row lifecycle. The Personas tab consumes this queue.
- The contract between Artifact A and this section is the queue row payload defined in Artifact A §6.
- Approve / Refine-and-Approve actions from this tab write to `platform_intelligence.board_personas` per Artifact A §6 approval contract.

**Action needed:**
- Cross-reference Artifact A §6 as the authoritative queue schema.
- Ensure Wave 1B Board of Directors sprint implements both the producer side (classifier writes queue rows) and the consumer side (Personas tab reads and acts on queue rows) coherently.

---

## Impact on PRD-21B (Admin Console Shell)

**What changed:**
- Tab registry extended by one entry: Personas at `/admin/personas` with `persona_admin` permission.
- Admin shell framework (defined in PRD-21B) accommodates the new tab without restructuring — this is the forward-note behavior PRD-21B anticipated.

**Action needed:**
- Update PRD-21B tab registry documentation to include Personas row.

---

## Impact on Platform Intelligence Pipeline v2

**What changed:**
- Channel D (Personas) gains upstream architectural context: personas now flow through an embedding pre-screen + multi-family-relevance classifier before reaching the queue. Channel D still reads only from `platform_intelligence.board_personas` (personal_custom personas in `public.board_personas` remain excluded per Convention #97).
- The queue itself is NOT part of Channel D — it's upstream of the approved Tier 3 cache that Channel D reads.

**Action needed:**
- Update Pipeline v2 Channel D description to note the pre-screen + classifier upstream nodes and reinforce the personal_custom exclusion.

---

## Impact on CLAUDE.md

**What changed:**
- New Convention #258 (this artifact) codifies the three-tier persona architecture and amends Convention #99.
- Convention #99 gains an amendment line pointing at Convention #258 for the scoping predicates.

**Action needed:**
- Append Convention #258 to CLAUDE.md (text in Artifact B Part 3, placed immediately after Convention #257 — the `todayLocalIso` rule — following the chronological append pattern).
- **Concrete inline edit to Convention #99:** append the following sentence to the end of Convention #99's existing body (immediately after "...amortized across all future users."):

  > **Amended 2026-04-23 per Convention #258:** the cache-lookup check must scope by `is_public=true AND family_id IS NULL AND content_policy_status='approved'` in the `platform_intelligence.board_personas` namespace. Personal personas (`public.board_personas`, `persona_type='personal_custom'`) are never cache candidates. See Convention #258 for the full three-tier architecture.

---

## Impact on Build Order Source of Truth

**What changed:**
- PRD-32 Personas tab section added to active Wave 1B prerequisite deliverables.
- PRD-32 base (System, Analytics, Feedback tabs) remains on its original timeline — this appended section does not accelerate or replace base PRD-32 work.

**Action needed:**
- Note PRD-32 Personas tab as an appended section in the Build Order, distinct from PRD-32 base.

---

*End of PRD-32 Personas Cross-PRD Impact Addendum*
