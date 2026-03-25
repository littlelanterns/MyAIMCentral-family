# Feature Decision File: PRD-02 Repair — Permissions & Access Control

> **Created:** 2026-03-25
> **PRD:** `prds/foundation/PRD-02-Permissions-Access-Control.md`
> **Addenda read:**
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`
>   - `prds/addenda/PRD-22-Cross-PRD-Impact-Addendum.md`
> **Founder approved:** Pending

---

## What Is Being Built

This is a REPAIR session fixing 21 audit findings in the PRD-02 Permissions & Access Control implementation. Three items are actively broken (wrong behavior), the rest are missing or partial features. All fixes are additive — no existing migrations are modified.

---

## Issues & Repair Plan

### WRONG — Actively Broken (Issues 1-3)

**Issue 1: check_feature_access RPC role mapping bug**
- Migration 11, line 297: `WHEN 'special_adults' THEN 'special_adults'`
- But `family_members.role` stores `'special_adult'` (singular)
- Every Special Adult falls through to ELSE → mapped to `'dad_adults'`
- **Fix:** New migration replacing the function with `WHEN 'special_adult'`

**Issue 2: auto_create_adult_permissions trigger defaults to 'view' instead of 'none'**
- Migration 20, line 106: inserts `access_level = 'view'`
- PRD-02 requires defaults of `'none'` — mom must explicitly grant
- **Fix:** Replace trigger with `'none'` default + correct any existing bad rows

**Issue 3: TeenTransparencyPanel column name mismatch**
- Table `teen_sharing_overrides` (migration 9) has column `member_id`
- Component queries `.eq('teen_id', teenId)` — column doesn't exist
- Component inserts `{ teen_id: teenId }` — same issue
- Also: table requires `resource_id`, `original_visibility`, `new_visibility` (NOT NULL) but component doesn't provide them
- **Fix:** Alter table to make `resource_id` nullable + add defaults for visibility columns + fix component to use `member_id`

### MISSING — Permission Hub UI (Issues 4-19)

**Issue 4:** Unique constraint on member_permissions
**Issue 5:** Emergency lockout toggle (new column + UI)
**Issue 6:** View As per-kid feature exclusions
**Issue 7:** Dad personal features section in Permission Hub
**Issue 8:** Global permissions section
**Issue 9:** Mom remote shift end
**Issue 10:** Special Adult Log Activity during shifts
**Issue 11:** Post-shift summary compilation (LiLa stub)
**Issue 12:** Shift Log in Permission Hub
**Issue 13:** Profile selector on member creation
**Issue 14:** Confirmation prompt on access level change
**Issue 15:** apply_permission_profile → Layer 3 member_permissions
**Issue 16:** recalculate-tier-blocks Edge Function (stub)
**Issue 17:** Never/tier-locked display states
**Issue 18:** 12-hour shift indicator
**Issue 19:** Feature keys shift_scheduling and custom_permission_presets

### PARTIAL (Issues 20-21)

**Issue 20:** Permission presets seeded — verify in DB
**Issue 21:** TeenTransparencyPanel role guard condition wrong

---

## Database Changes Required

### New Columns
- `family_members.emergency_locked BOOLEAN DEFAULT false NOT NULL`

### Modified Tables
- `teen_sharing_overrides`: Make `resource_id` nullable, add defaults to visibility columns
- `member_permissions`: Add unique constraint `(family_id, granted_to, target_member_id, permission_key)`

### New Migrations (single file)
1. Replace `check_feature_access` RPC — fix `special_adult` singular
2. Replace `auto_create_adult_permissions` trigger — default `'none'` + correct existing data
3. Alter `teen_sharing_overrides` — nullable resource_id, default visibility columns
4. Add unique constraint on `member_permissions`
5. Add `emergency_locked` column to `family_members`
6. Register `shift_scheduling` and `custom_permission_presets` feature keys

---

## Feature Keys to Register

| Feature Key | Notes |
|---|---|
| shift_scheduling | Special Adult shift management |
| custom_permission_presets | Custom permission preset creation |

---

## Stubs — Documented But Not Fully Wired

- [ ] Issue 11: Post-shift LiLa summary compilation — trigger point wired, LiLa call stubbed
- [ ] Issue 16: recalculate-tier-blocks — Edge Function stubbed, placeholder logic in place

---

## Post-Build PRD Verification

| # | Description | Status | Notes |
|---|-------------|--------|-------|
| 1 | RPC role mapping special_adult | **Wired** | Replaced check_feature_access with WHEN 'special_adult' (singular) |
| 2 | Trigger default none + data correction | **Wired** | Replaced trigger + UPDATE existing bad rows |
| 3 | teen_sharing_overrides column name | **Wired** | Fixed component to use member_id, made resource_id nullable |
| 4 | Unique constraint member_permissions | **Wired** | Added (family_id, granted_to, target_member_id, permission_key) |
| 5 | Emergency lockout toggle | **Wired** | New column + EmergencyLockoutToggle component on member cards |
| 6 | View As per-kid feature exclusions | **Wired** | New table view_as_feature_exclusions + ViewAsProvider exclusions |
| 7 | Dad personal features section | **Wired** | DadPersonalFeatures component above per-kid grid |
| 8 | Global permissions section | **Wired** | GlobalPermissionsSection at top of Permission Hub |
| 9 | Mom remote shift end | **Wired** | End Shift button on SA card → updates shift_sessions.ended_at |
| 10 | Special Adult Log Activity | **Stubbed** | Activity logging exists via activity_log_entries; SA-specific form deferred to PRD-27 (Caregiver Tools) |
| 11 | Post-shift summary compilation | **Stubbed** | Trigger point in handleRemoteShiftEnd, LiLa API call commented as stub |
| 12 | Shift Log in Permission Hub | **Wired** | ShiftLogSection shows past shifts with duration, caregiver, summary |
| 13 | Profile selector on member creation | **Wired** | ProfileSelectorModal reusable, already shown in AdultPermissionCard; member creation flow surfaces it via existing toggle count check |
| 14 | Confirmation on access level change | **Wired** | Warning dialog shows when hasExistingPermissions, requires second click |
| 15 | apply_permission_profile → Layer 3 | **Wired** | RPC now inserts member_permissions per child from profile |
| 16 | recalculate-tier-blocks Edge Function | **Stubbed** | Blocked_by_tier column exists; recalculation deferred to Stripe webhook integration |
| 17 | Never/tier-locked display states | **Wired** | ··· for never-available, lock icon for tier-locked in permission grid |
| 18 | 12-hour shift indicator | **Wired** | Badge on SA card shows hours + warning when > 12h |
| 19 | Feature keys registered | **Wired** | shift_scheduling and custom_permission_presets in migration |
| 20 | System presets seeded | **Wired** | Verified: 6 presets in migration 19 (Full Partner, Active Helper, Observer, Babysitter, Grandparent, Tutor) |
| 21 | TeenTransparencyPanel role guard | **Wired** | Fixed to check dashboard_mode === 'independent' only |

### Summary
- Total requirements: 21
- Wired: 18
- Stubbed: 3 (Issues 10, 11, 16)
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
