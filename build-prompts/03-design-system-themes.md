# Build Prompt 03: Design System & Themes

## PRD Reference
- PRD-03: `prds/foundation/PRD-03-Design-System-Themes.md`

## Prerequisites
- Phase 01 (Auth) complete

## Objective
Build the complete theme and vibe system with CSS custom properties, 50+ color themes across 9 families, gradient toggle, dark mode, responsive foundation.

## Database Work
- None (theme preferences stored in dashboard_configs or member settings)

## Component Work
- ThemeProvider with CSS custom property injection
- VibeProvider with structural tokens (border-radius, shadows, fonts)
- Theme picker component (9 families, 50+ themes)
- Vibe picker (4 presets: Classic MyAIM, Clean & Modern, Nautical, Cozy Journal)
- Gradient toggle
- Dark mode toggle (respects system preference + manual override)
- Font size adjustment
- Shell-aware token scaling (Play bounciest → Adult subtle)
- Responsive breakpoints (375px → 768px → 1024px → 1920px)
- Tailwind CSS configuration with theme token integration
- Typography setup (The Seasons serif + HK Grotesk sans-serif)
- Lucide React icon integration

## Testing Checklist
- [ ] All --theme-* and --vibe-* CSS variables defined
- [ ] Theme persists across navigation and sessions
- [ ] Dark mode toggles correctly
- [ ] Gradient overlay applies/removes
- [ ] Font size adjustment works
- [ ] Shell scaling tokens differ by shell type
- [ ] Responsive breakpoints work correctly

## Definition of Done
- Theme system fully operational
- All 4 vibe presets render correctly
- Colors never hardcoded in components
