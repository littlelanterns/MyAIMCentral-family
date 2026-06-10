# Special Adult Experience (shift-based access, for real)

**Status:** Follow-up build candidate — filed per founder direction 2026-06-09 ("I haven't even begun to think of this yet")
**Filed:** 2026-06-09, during the PERMISSIONS-WIRING close-out
**Estimated workers:** 1-2
**Depends on:** PERMISSIONS-WIRING (shipped 2026-06-09 — keyWiringStatus registry, GrantedRoute pattern, useResolvedFeatureAccess)

---

## What the audit found (2026-06-09)

PRD-02's shift-based caregiver model effectively does not exist in the live app:

1. **Special adults get the full adult shell.** `getShellForMember` (ShellProvider.tsx:42) maps `special_adult` → `'adult'`. No SA branch exists in `getSidebarSections` — a babysitter login shows Journal, Rhythms, Grow, Messages, Vault, BookShelf (data self-scoped, but the PRD-02 "access goes dark outside shifts" model is absent).
2. **ShiftView (PRD-02 Screen 6) is finished code with no route.** `src/features/permissions/ShiftView.tsx` (Start/End Shift, next-window display, activity logging) is exported from `src/features/permissions/index.ts` and rendered nowhere.
3. **`special_adult_permissions` rows are written but never enforced.** The only reader is usePermission's special_adult branch, which is unreachable (no PermissionGate call site passes targetMemberId). The Hub's SA per-kid toggle grid was HIDDEN by PERMISSIONS-WIRING (founder choice) until this build ships; Shift Log + Emergency Lock remain (they work).
4. **Profile/Hub key mismatch:** the Hub SA grid offered `tasks_basic`/`calendar_basic`/`notes_instructions`; `permission_level_profiles` special_adults seeds `tasks_basic`/`calendar_basic`/`messaging_basic`/`lila_help`. `notes_instructions` exists in no profile and no surface. Reconcile here.

## Scope sketch (pre-build process required before any code)

- Mount ShiftView: route + make it the SA resting surface (PRD-02 Screen 6: outside a shift, SA sees Start Shift only — no kid data)
- SA sidebar branch in getSidebarSections (minimal: Dashboard/ShiftView/assigned-kid surfaces per grants)
- Shift-gated data visibility: useViewableMembers SA branch honors active shift + special_adult_permissions
- Restore the Hub SA per-kid grid (un-hide) and flip the relevant keys in `keyWiringStatus.ts`
- Reconcile profile seeds vs Hub keys; decide notes_instructions fate
- Shift auto-end (scheduled end + 30min) — PRD-02 edge case; cron or client sweep
- PRD-02 + PRD-27 (Caregiver Tools) are the source PRDs; PRD-27 may fold in (trackable events, shift reports)

## NOT in scope

- Special Adult finance access (excluded by PRD-28 — caregivers never see money)
- Changing the contribute cap (SAs never get manage — PRD-02)
