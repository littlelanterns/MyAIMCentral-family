# Build Prompt 15: Family Overview, Hub & TV Mode

## PRD Reference
- PRD-14C: `prds/dashboards/PRD-14C-Family-Overview.md`
- PRD-14D: `prds/dashboards/PRD-14D-Family-Hub.md`
- PRD-14E: `prds/dashboards/PRD-14E-Family-Hub-TV-Mode.md`

## Prerequisites
- Phase 14 (Personal Dashboard & Calendar) complete

## Objective
Build the three family-level dashboard perspectives. Family Overview is a mom-only aggregated view showing each member's status, tasks, and events at a glance. Family Hub is a shared coordination surface visible to all members for family-wide information (countdowns, shared calendar, announcements). TV Mode is a landscape-optimized PWA view designed for display on a living room TV or tablet, featuring rotating content, countdowns, and a slideshow frame.

## Database Work
Create tables:
- `family_overview_configs` — Mom's layout preferences for the Family Overview (which member cards to show, sort order, collapsed sections)
- `family_hub_configs` — Configuration for shared Family Hub content (pinned items, section order, visibility per role)
- `countdowns` — Family countdown events with title, target date, display style, visibility

Enable RLS on all tables. Family Overview configs are mom-only; Hub configs are mom-managed, viewable by all; countdowns are family-wide.

## Component Work
- Family Overview — Aggregated dashboard showing per-member cards (tasks due, events today, rhythm status, recent victories)
- Member status cards — Compact view of each family member's daily state
- Family Hub — Shared surface with family calendar, countdowns, announcements, pinned items
- Hub section management — Mom configures which sections appear and their order
- TV Mode — Landscape PWA layout with auto-rotating content panels
- Countdown widget — Visual countdown to family events (vacation, birthday, holiday) with configurable display styles
- Slideshow frame — Rotating photo display from family gallery or uploaded images
- Perspective switcher integration — Connect Overview/Hub/TV to the perspective switcher from Phase 04

## Edge Function Work
- None

## Testing Checklist
- [ ] Family Overview shows aggregated status for each family member
- [ ] Family Overview is accessible only to mom (primary_parent)
- [ ] Family Hub displays shared content visible to all family members
- [ ] Countdowns calculate and display remaining time correctly
- [ ] TV Mode renders in landscape with auto-rotating panels
- [ ] Slideshow frame cycles through photos at configured interval
- [ ] Perspective switcher correctly navigates between Personal, Overview, Hub views

## Definition of Done
- All PRD-14C, PRD-14D, and PRD-14E MVP items checked off
- Three perspectives accessible and rendering correctly
- TV Mode functional as standalone PWA entry point
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
