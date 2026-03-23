# Build Prompt 11: Widgets, Trackers & Dashboard Layout

## PRD Reference
- PRD-10: `prds/personal-growth/PRD-10-Widgets-Trackers-Dashboard-Layout.md`

## Prerequisites
- Phase 10 (Tasks, Lists, Studio & Templates) complete
- Dashboard grid infrastructure from Phase 04 (dashboard_configs)
- Task/routine data available for widget consumption

## Objective
Build the Widget Template Library with 19 widget types, 75+ variants, and 95+ configurations. This phase delivers the dashboard grid layout system, the "Track This" flow for creating custom trackers, multiplayer widgets for shared family tracking, and the Color-Reveal tracker (a coloring-page-based progress visualization). Widgets are the primary way members see and interact with their data on dashboards, making this a foundational visual layer for the platform.

## Database Work
Create tables:
- `dashboard_widgets` — Widget instances placed on member dashboards, with type, config JSON, position, size, folder assignment
- `dashboard_widget_folders` — Folder groupings for organizing widgets on dashboards
- `widget_data_points` — Time-series data entries for tracker widgets (value, timestamp, member)
- `widget_templates` — Reusable widget configurations from Studio, shareable across family
- `coloring_image_library` — Library of coloring page images available for Color-Reveal trackers
- `color_reveal_progress` — Per-member progress on coloring page reveals (segments completed)
- `coloring_gallery` — Completed coloring pages saved for display/celebration

Enable RLS on all tables. Members can manage their own widgets; mom can view/manage all.

## Component Work
- Widget Template Library — 19 types (counter, checklist, habit, timer, gauge, chart, quote, weather, countdown, photo, text, link, embed, color-reveal, multiplayer, progress, streak, goal, custom)
- Dashboard grid layout — Drag-and-drop widget placement, responsive breakpoints, folder collapse/expand
- Widget renderer — Universal component that renders any widget type from config JSON
- "Track This" flow — Quick-create tracker from any context (task completion, journal mention, conversation)
- Widget settings panel — Per-widget configuration (size, refresh, data source, appearance)
- Multiplayer widgets — Shared family widgets with per-member contributions visible
- Color-Reveal tracker — Coloring page image that reveals segments as progress milestones are hit
- Coloring gallery — View completed Color-Reveal images
- Widget folder management — Create, rename, reorder folders on dashboard
- Add Widget modal — Browse/search template library, preview, configure, place

## Edge Function Work
- None (widget data is managed client-side with Supabase real-time subscriptions)

## Testing Checklist
- [ ] All 19 widget types render correctly with default configuration
- [ ] Dashboard grid supports drag-and-drop repositioning and resizing
- [ ] "Track This" creates a tracker widget from task/journal/conversation context
- [ ] Multiplayer widget shows contributions from multiple family members
- [ ] Color-Reveal tracker reveals image segments on milestone completion
- [ ] Widget folders collapse/expand and persist across sessions
- [ ] Widget templates can be saved to and loaded from Studio
- [ ] RLS prevents cross-family widget access

## Definition of Done
- All 19 widget types functional with variant configurations
- Dashboard grid layout responsive and persistent
- Track This flow working from at least 3 entry points
- Color-Reveal tracker end-to-end functional
- RLS verified per role (update RLS-VERIFICATION.md)
- No hardcoded strings (all text extractable for i18n later)
