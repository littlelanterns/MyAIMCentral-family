# Safe Harbor (PRD-20) — Backburner Decision

> **Decision date:** 2026-06-09
> **Decided by:** Tenise (founder)
> **Status:** BACKBURNERED — not removed, not scheduled
> **Resolves:** Follow-Up Build C (Safe Harbor decommission decision) from the View-As Identity-Scope close-out

---

## The Decision

Safe Harbor (PRD-20 — the completely private, AI-guided emotional-processing space for
teens/kids) is **backburnered indefinitely**. It may return someday; it is not on any
roadmap, and no surface in the app should promise it.

## Founder Rationale (verbatim intent)

> "I feel like there are other platforms better suited for that, and I'd rather not have
> the moral responsibility to do that right where it isn't the primary focus."

Two threads:
1. **Better-suited platforms exist** for dedicated emotional processing.
2. **Moral responsibility:** doing private AI emotional processing for children *right*
   is a heavy obligation that doesn't belong in a product where it isn't the primary focus.

## What the Safety Story Becomes

Backburnering Safe Harbor *strengthens* the remaining posture rather than weakening it:

- **Crisis Override stays GLOBAL and mandatory** (Convention #7) — every LiLa
  conversation, every mode, unchanged.
- **PRD-30 Safety Monitoring stays roadmapped** — detection + mom notification.
- **LiLa's bridge-to-human posture is the answer** to heavy emotional content: LiLa is a
  processing partner, never a therapist; she notices when something is heavy and connects
  the child to real people. "We don't try to be your child's therapist" is the honest promise.
- **The locked Fix Now safety sequence changes:** PRD-41 → ~~PRD-20~~ → PRD-30.
  Worksheet row 3 (SCOPE-8a.F3) shrinks by a third.

## What Was Done (2026-06-09)

| Item | Action |
|---|---|
| 4 guided modes (`safe_harbor`, `safe_harbor_guided`, `safe_harbor_orientation`, `safe_harbor_literacy`) | `is_active=false` via migration `00000000100249` (applied to production, verified) |
| `/safe-harbor` placeholder route | Removed from `App.tsx`; `SafeHarborPage` removed from `placeholder/index.tsx` |
| Lanterns Path entry | Removed from `lanterns-path-data.ts` |
| `feature_expansion_registry.ts` entry (PlannedExpansionCard "on our roadmap" promise) | Removed |
| PermissionHub dad-personal-features toggle | Removed |

## What Was Deliberately KEPT (defensive plumbing — do not remove)

- `lila_conversations.is_safe_harbor` column and every Convention #6/#243 filter
  (`is_safe_harbor = false` in aggregation/context/report queries). These protect any
  stray data and cost nothing.
- View-As `PRIVACY_EXCLUSIONS` / `PRIVACY_ROUTE_MAP` entries.
- `context-assembly.ts` Safe Harbor exclusion.
- The dormant `safe_harbor: 'manage'` permission preset value (unused, harmless).
- PRD-20 itself (`prds/` is read-only source material; the PRD simply has no build slot).

**Reactivation path if the decision is ever reversed:** flip the 4 `is_active` flags back,
restore the removed UI surfaces from this commit's diff. Everything else is still standing.

## Convention Notes

- Conventions #6, #56–59 (opening messages list includes nothing SH-specific), #95–96
  (Mediator safety exception — SEPARATE from Safe Harbor, unaffected), #243 remain in
  CLAUDE.md as written. They describe defensive behavior that stays correct.
- Any future PRD or audit finding that assumes Safe Harbor is coming should be triaged
  against this decision file.

## Downstream Updates Made

- `BUILD_STATUS.md` Phase 21 → Backburnered
- `TRIAGE_WORKSHEET.md` row 3 (SCOPE-8a.F3) annotated — safety sequence is now PRD-41 → PRD-30
- `STUB_REGISTRY.md` Follow-Up Build C → resolved by this decision; PRD-20 stub rows annotated
- Memory note saved (`project_safe_harbor_backburnered`)
- claude.ai sync doc updated
