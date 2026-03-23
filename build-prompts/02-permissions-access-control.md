# Build Prompt 02: Permissions & Access Control

## PRD Reference
- PRD-02: `prds/foundation/PRD-02-Permissions-Access-Control.md`
- PRD-31 Permission Matrix Addendum: `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`

## Prerequisites
- Phase 01 (Auth & Family Setup) complete

## Objective
Build the permission engine: role-based access control, PermissionGate component, useCanAccess hook, View As system, permission hub, transparency panel.

## Database Work
Create tables:
- `member_permissions` — Per-member permission grants
- `staff_permissions` — Admin console access
- `view_as_sessions` — Mom's View As tracking

## Component Work
- `<PermissionGate featureKey="xxx">` component
- `useCanAccess(featureKey, memberId?)` hook — three-layer check
- View As provider and session management
- Permission Hub (mom manages per-child feature access)
- Transparency Panel (shows what mom can see per child)
- Per-kid permission configuration screens

## Testing Checklist
- [ ] useCanAccess returns true for all features during beta
- [ ] PermissionGate renders children when access granted
- [ ] PermissionGate hides children when access denied
- [ ] View As correctly scopes data to target member's perspective
- [ ] Mom can toggle feature access per child
- [ ] RLS enforces role-based data access

## Definition of Done
- Three-layer permission check working (tier + toggle + founding)
- View As functional for mom
- RLS-VERIFICATION.md updated for permission tables
