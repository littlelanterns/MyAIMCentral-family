# Build Prompt 04: Shell Routing & Layouts

## PRD Reference
- PRD-04: `prds/foundation/PRD-04-Shell-Routing-Layouts.md`

## Prerequisites
- Phase 02 (Permissions) complete
- Phase 03 (Design System) complete

## Objective
Build the five shell layouts with routing guards, five interaction zones, perspective switcher, navigation structure.

## Database Work
Create tables:
- `dashboard_configs` — Dashboard layout configurations per member

## Component Work
- ShellProvider + RoleRouter
- MomShell — Full sidebar, QuickTasks, Smart Notepad, LiLa drawer, main content
- AdultShell — Similar to Mom, LiLa as modal
- IndependentShell — Teen layout, cleaner, no QuickTasks
- GuidedShell — Simplified, prompted interactions
- PlayShell — Visual, sticker-based, emoji-friendly
- CaregiverLayout — Single-page, two-view (PRD-27 will use this)
- Left Sidebar navigation (role-based items)
- QuickTasks drawer (horizontal scroll, auto-sorted)
- Smart Notepad right drawer (stub — full implementation in Phase 09)
- LiLa bottom drawer / modal (stub — full implementation in Phase 06)
- Perspective switcher (mom only: Personal, Family Overview, Family Hub, View As)
- Routing guards (prevent shell mismatch)
- Breathing glow convention component
- Settings gear icon → overlay trigger

## Testing Checklist
- [ ] Each role renders correct shell
- [ ] Routing guards redirect to correct shell
- [ ] All 5 interaction zones render in mom shell
- [ ] Sidebar items differ by role
- [ ] Perspective switcher only visible for mom
- [ ] Responsive behavior: sidebar collapses on mobile
- [ ] Theme tokens apply across all shells

## Definition of Done
- All 5 shells rendering correctly
- Navigation structure complete
- Routing guards working
- Shell routing tests pass
