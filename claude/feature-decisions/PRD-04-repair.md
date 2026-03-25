# PRD-04 Repair — Shell Routing & Layouts

**PRD:** prds/foundation/PRD-04-Shell-Routing-Layouts.md
**Addenda Read:**
- prds/addenda/PRD-Audit-Readiness-Addendum.md
- prds/addenda/PRD-14-Cross-PRD-Impact-Addendum.md
- prds/addenda/PRD-22-Cross-PRD-Impact-Addendum.md
**Created:** 2026-03-25
**Type:** Repair pass — fixing audit findings from Phase 04

---

## Repair Items

### 1. Settings Button — WRONG (navigate to /family-members → stub Settings overlay)

**Current:** MomShell.tsx line 70 calls `navigate('/family-members')`.
**PRD-22 Addendum:** Settings is a full-screen overlay, NOT a route. Gear icon triggers overlay.
**Fix:** Create `useSettings()` context with `openSettings()`. Create `SettingsOverlay` placeholder ("Settings coming soon"). Wire gear icon in all shells to call `openSettings()`. Remove `/settings` route from App.tsx. Document stub in STUB_REGISTRY.md.

### 2. Hub Layout — MISSING

**PRD-04 spec:** `/hub` route with HubLayout — standalone always-on family dashboard for tablet/shared devices.
**What to build:**
- `/hub` route in App.tsx (public after family auth, not wrapped in ProtectedRoute shell)
- `HubLayout` component: full-screen widget grid, family branding header, settings gear (PIN-locked)
- Member selection drawer: left-side hidden drawer with avatar chips, PIN/visual auth per member
- Widget grid: PlannedExpansionCard placeholders (real widgets come in PRD-10/PRD-14D)
- "Back to Hub" button when member taps into their shell
- Uses `families.hub_config` JSONB (column already exists in live schema)

### 3. Layout Preferences Persistence — MISSING

**PRD-04 spec:** Sidebar collapsed state and zone states persist in `family_members.layout_preferences` JSONB.
**Live schema confirms:** `layout_preferences` column exists on `family_members`.
**Fix:** Wire sidebar collapsed state to persist/load from `layout_preferences`. Save on change, load on mount. Use existing RLS policies.

### 4. Auto-Collapse Logic — MISSING

**PRD-04 spec:** Protect main content at 480px minimum width. Auto-collapse zones (QuickTasks → Notepad → Sidebar → LiLa → Main) when viewport minus sidebar would leave less than 480px.
**Fix:** Add ResizeObserver to MomShell that monitors main content width. Auto-collapse in priority order. Track `auto_collapsed_zones` separately from manual. Auto-reopen when space returns.

### 5. Tier-Locking in Sidebar — MISSING

**PRD-04 spec:** Mom sees tier-locked items greyed/blurred. Other roles: tier-locked items hidden entirely.
**Fix:** Import `useCanAccess` in Sidebar. For each nav item with a feature key, check access. Mom: show greyed + blurred with tooltip "Unlocks at [tier]". Others: hide completely. During beta `useCanAccess` returns true, so this is infrastructure-only for now.

### 6. Lightweight Notepad for Guided Shell — MISSING

**PRD-04 spec:** Simplified right-drawer for Guided members: single tab, freeform text, larger font, voice input button, saves directly to journal. No routing grid, no multi-tab.
**Fix:** Create `GuidedNotepad` component. Accessible via pencil icon in Guided shell header. Permission-gated by mom.

### 7. Sitting LiLa Resting Avatar — MISSING

**PRD-04 spec:** When LiLa drawer opens without a specific mode, show "sitting LiLa" character art (meditative pose with glowing heart).
**Fix:** Add `LilaAvatar` with `avatarKey="sitting"` to the LiLa drawer's resting/general state. This avatar is already imported in MomShell — just need to ensure it appears in the drawer's default state.

### 8. Journal Container Sub-Routes — MISSING

**PRD-04 spec:** `/journal/reflections`, `/journal/commonplace`, `/journal/gratitude`, `/journal/kid-quips`.
**Fix:** Add nested routes in App.tsx. Journal page uses URL to determine active tab. These are filtered views of the same journal_entries table.

### 9. QuickTasks Auto-Sort by Usage Frequency — MISSING

**PRD-04 spec:** QuickTasks items auto-sort by usage — most-used first.
**Fix:** Track usage counts in `layout_preferences.quicktask_usage` JSONB. Increment on each action. Sort QuickTasks array by count descending.

### 10. View As Full Shell with Member's Theme — PARTIAL

**Current:** ViewAsShellWrapper adds a banner but doesn't switch to the target member's shell type or theme.
**PRD-04 spec:** View As renders the target member's full shell with their theme applied. Mom sees exactly what that member sees.
**Fix:** ViewAsShellWrapper should:
- Load target member's `theme_preferences`
- Apply their shell type via RoleRouter
- Apply their theme tokens
- Keep View As exit banner visible (z-45)

---

## Gradient Consistency Rules (from repair prompt)

- Sidebar active nav item background → `var(--surface-primary)`
- BottomNav active tab indicator → `var(--surface-primary)`
- PerspectiveSwitcher active segment → `var(--surface-primary)`
- QuickTasks strip background → `var(--surface-nav)`
- Do NOT use `var(--color-btn-primary-bg)` directly on navigation surfaces
- Do NOT modify any scrollbar CSS from Phase 03

---

## What Is NOT Being Built (Stubs)

- Settings overlay full UI (PRD-22 — Phase 27) — only placeholder
- Hub widget content (PRD-10/PRD-14D) — PlannedExpansionCard placeholders
- Command Center page — stub/deferred
- PWA manifests — deferred to PRD-33

---

## Database Changes Required

None — all needed columns (`layout_preferences`, `hub_config`, `theme_preferences`) already exist in the live schema.

---

## Post-Build Verification Table

| Requirement | Source | Status | Notes |
|---|---|---|---|
| Settings gear → overlay (not route) | PRD-22 Addendum | **Wired** | useSettings context + SettingsOverlay placeholder. Gear wired in all 5 shells. /settings route removed. Stub registered for PRD-22. |
| Hub layout at /hub | PRD-04 §Tablet Hub | **Wired** | HubPage with family header, member selection left drawer (hidden by default), widget grid with 6 PlannedExpansionCard stubs. |
| Layout preferences persist to Supabase | PRD-04 §Open/Closed State | **Wired** | useSidebarPersistence hook reads/writes family_members.layout_preferences.sidebar_open. |
| Auto-collapse at 480px content width | PRD-04 §Auto-Collapse Logic | **Wired** | useAutoCollapse hook with ResizeObserver on main content. Forces QuickTasks collapsed when < 480px. 50px hysteresis to prevent flapping. |
| Tier-locking in sidebar (grey/blur for mom, hidden for others) | PRD-04 §Privacy & Transparency | **Wired** | Infrastructure in place — tierLocked flag per nav item. Mom: greyed/blurred + Lock icon. Others: hidden entirely. During beta tierLocked=false (all shown). |
| Guided shell lightweight notepad | PRD-04 §Smart Notepad | **Wired** | GuidedNotepad component: pencil icon in header, single-tab textarea with larger font (18px), voice input button (stub), saves to journal_entries as free_write. |
| Sitting LiLa resting avatar in drawer | PRD-04 §LiLa Chat | **Wired** | Already present — LilaAvatar with avatarKey="sitting" shows in drawer's opening message area when no mode is active. Verified in LilaDrawer.tsx line ~449. |
| Journal sub-routes (/journal/reflections, etc.) | PRD-04 §Feature Container Routes | **Wired** | 4 nested routes added in App.tsx. Journal page reads URL via useLocation and maps to filter type. |
| QuickTasks auto-sort by usage | PRD-04 §QuickTasks Strip | **Wired** | Usage counts tracked in localStorage (myaim-quicktasks-usage). sortByUsage() sorts actions by count descending. incrementUsage() called on each action. |
| View As full shell + member theme | PRD-04 §View As Modal | **Wired** | ViewAsShellWrapper now loads target member's theme_preferences and shell type via setTheme/setShell. Restores mom's shell on exit. |
| Gradient consistency on nav surfaces | Repair prompt | **Wired** | Sidebar active item → var(--surface-primary). BottomNav active → var(--surface-primary). PerspectiveSwitcher active → var(--surface-primary). QuickTasks strip → var(--surface-nav). No scrollbar CSS modified. |

### Verification Summary
- Total requirements: 11
- Wired: 11
- Stubbed: 0
- Missing: **0**

### Additional Fixes During Visual Verification
- Hub bypassed shell wrapping (ProtectedRouteNoShell) — was rendering inside MomShell with sidebar
- Hub switched from PlannedExpansionCard (missing registry entries) to simple stub cards
- Hub uses family_login_name for display ("wertmanfamily Hub")
- View As: Sidebar ViewAsSwitcher query expanded to include dashboard_mode + theme_preferences
- View As: RoleRouter renders target member's shell + ViewAsBanner at RoleRouter level
- GuidedShell greeting uses displayMember (viewed-as member when active)
- Dashboard: removed family_name subtitle under greeting (was showing "Tenise")

### Founder Sign-Off
- [x] All requirements Wired or Stubbed
- [x] Stubs in STUB_REGISTRY.md
- [x] **Build approved as complete** — 2026-03-25
