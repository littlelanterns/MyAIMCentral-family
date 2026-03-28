# QA Shells — Per-Shell Verification Checklist

## Mom Shell
- [ ] Left sidebar shows all navigation items
- [ ] QuickTasks drawer accessible from top
- [ ] Smart Notepad accessible as right drawer
- [ ] LiLa accessible as bottom drawer
- [ ] Perspective switcher visible (Personal, Family Overview, Family Hub, View As)
- [ ] All permission gates render correctly
- [ ] Theme tokens applied (vibe + theme)
- [ ] Settings gear icon in header opens overlay
- [ ] Safe Harbor in sidebar
- [ ] AI Toolbox in sidebar

## Adult Shell (Dad/Additional Adult)
- [ ] Sidebar shows scoped navigation (no family management)
- [ ] QuickTasks drawer accessible
- [ ] Smart Notepad accessible
- [ ] LiLa accessible as modal (NOT drawer)
- [ ] No perspective switcher
- [ ] Permission-scoped content only
- [ ] Safe Harbor in sidebar (automatic, not mom-gated)
- [ ] Theme tokens applied

## Independent Shell (Teen)
- [ ] Sidebar shows age-appropriate navigation
- [ ] LiLa accessible as modal
- [ ] No QuickTasks drawer
- [ ] Permission-filtered features only
- [ ] Safe Harbor appears only if all prerequisites met
- [ ] Theme tokens applied (cleaner scaling)
- [ ] PlannedExpansionCards visible where applicable

## Guided Shell
- [ ] Simplified navigation
- [ ] Prompted interactions
- [ ] Parent-configured feature set
- [ ] DailyCelebration at evening time (not adult rhythm)
- [ ] "Help Me Talk to Someone" accessible (not labeled "Safe Harbor")
- [ ] Gamification visuals prominent
- [ ] Theme tokens applied (moderate scaling)

## Play Shell
- [ ] Visual, sticker-based UI
- [ ] Emoji allowed
- [ ] Task completion = visual celebration
- [ ] No LiLa drawer/modal (except age-gated timer)
- [ ] No Safe Harbor
- [ ] Gamification visuals most prominent
- [ ] Theme tokens applied (bounciest scaling)
- [ ] Visual timer styles available (sand timer, hourglass, etc.)

## Cross-Shell Checks
- [ ] Routing guards prevent shell mismatch
- [ ] Theme persists across navigation
- [ ] Permission gates consistent per role
- [ ] Breathing glow indicators working
- [ ] RoutingStrip renders correctly in all contexts
- [ ] Universal Queue Modal accessible where expected
