# Current Build Context

> Auto-loaded every session via CLAUDE.md. Must be fully populated before any build begins.
> When no build is active, status is IDLE and no code should be written without starting the pre-build process.

## Status: ACTIVE

---

*PRD-06 (Guiding Stars & Best Intentions) + PRD-07 (InnerWorkings repair) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-06-Guiding-Stars-Best-Intentions.md` and `claude/feature-decisions/PRD-07-InnerWorkings-repair.md`.*

*PRD-10 Phase A (Widgets, Trackers & Dashboard Layout) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-10-Widgets-Trackers-Dashboard-Layout.md`.*

*PRD-13 (Archives & Context) completed 2026-03-25. Verification archived to `claude/feature-decisions/PRD-13-Archives-Context.md`. 94 requirements: 80 wired, 14 stubbed, 0 missing.*

---

## Current Build: PRD-13B — Archives Repair Pass

### PRD File
`prds/personal-growth/PRD-13-Archives-Context.md` (base — this is a repair pass, not a new feature)

### Addenda Read
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`
- `prds/addenda/PRD-Template-and-Audit-Updates.md`

### Feature Decision File
`claude/feature-decisions/PRD-13B-Archives-Repair-Pass.md`

---

### Pre-Build Summary

**Scope:** 5 targeted changes to the existing Archives feature. No rebuild. No routing changes. No data hook changes.

#### Change 1: Grid Column Algorithm + Bublup-Style Grid

**New utility:** `src/lib/utils/gridColumns.ts` — `getOptimalColumnCount(total, maxColumns)`
- Priority: remainder 0 (perfect) > highest remainder > remainder 1 (alone)
- Decision table verified: 2→2, 3→3, 4→4, 5→5, 6→3, 7→4, 8→4, 9→3, 10→5, 11→4, 12→4, 13→5, 14→5, 15→5, 16→4

**New component:** `src/components/archives/ArchiveMemberCard.tsx`
- Square card (aspect-ratio: 1/1)
- Photo state: image fills card, gradient overlay bottom third, name bottom-left (white), insights bottom-right, role badge top-left, heart top-right
- No-photo state: member color background + 2-letter initials centered, same overlay/name/insights/role/heart
- Camera overlay: hover (desktop) / long-press (mobile), triggers photo upload
- Family Overview card always first — uses families.family_photo_url or brand primary + initials

**ArchivesPage.tsx modifications:**
- CSS Grid with responsive columns (desktop ≤5, tablet ≤3, mobile ≤2)
- Grid/list toggle in header (LayoutGrid + List icons), persists to localStorage `archives-view-mode`
- Mobile (<768px): hide toggle, always list
- OON section: own grid when expanded, own column count

#### Change 2: Photo Upload

**New hook:** `src/hooks/useAvatarUpload.ts`
- Upload to Supabase Storage bucket `family-avatars`
- Member path: `{family_id}/{member_id}`, family path: `{family_id}/family-overview`
- Validates: image/*, max 5MB
- Updates family_members.avatar_url or families.family_photo_url
- Returns { uploadMemberAvatar, uploadFamilyPhoto, uploading, error }

**DB migration:** `ALTER TABLE families ADD COLUMN IF NOT EXISTS family_photo_url TEXT;`
**Storage bucket:** `family-avatars` (note: create via dashboard/CLI)

#### Change 3: Member Color Fallback

- Avatar.tsx: use `getContrastText(hex)` from member_colors.ts when rendering initials
- Color resolution chain: `assigned_color_token` → `member_color` → `assigned_color` → theme fallback
- Eliminate grey placeholders everywhere in the app
- ArchiveMemberCard no-photo state: member color fills entire square card

#### Change 4: Expanded FAB (3 Options)

Replace single FAB with expandable 3-option FAB:
- **"Add for a Person"** — existing flow
- **"Voice Dump"** — new VoiceDumpModal using useVoiceInput hook → auto-populates Bulk Add
- **"Bulk Add & Sort"** — new BulkAddSortModal with textarea → Haiku AI sort → review screen

**New files:**
- `src/components/archives/VoiceDumpModal.tsx`
- `src/components/archives/BulkAddSortModal.tsx`

**Bulk Add AI call:** Uses `sendAIMessage()` + `extractJSON()` from `src/lib/ai/send-ai-message.ts`, Haiku model
**Human-in-the-Mix:** Review screen groups by member, checkboxes, editable member/folder dropdowns, Save Selected
**Saves:** `archive_context_items` with `source = 'bulk_add'`

#### Change 5: Folder Grid in Member Detail

MemberArchiveDetail.tsx: folder navigation cards in 3-col grid on desktop (≥1024px), single column mobile.
Uses `getOptimalColumnCount(folderCount, 3)`.
Aggregated source sections stay full-width.

---

### Files Being Created
- `src/lib/utils/gridColumns.ts`
- `src/components/archives/ArchiveMemberCard.tsx`
- `src/hooks/useAvatarUpload.ts`
- `src/components/archives/VoiceDumpModal.tsx`
- `src/components/archives/BulkAddSortModal.tsx`
- Migration file for `families.family_photo_url`

### Files Being Modified
- `src/pages/archives/ArchivesPage.tsx` (grid layout, toggle, expanded FAB)
- `src/pages/archives/MemberArchiveDetail.tsx` (folder grid)
- `src/components/shared/Avatar.tsx` (color contrast fix)

### Files NOT Being Modified
- `src/hooks/useArchives.ts`
- `src/types/archives.ts`
- `src/pages/archives/FamilyOverviewDetail.tsx`
- `src/pages/archives/FaithPreferencesModal.tsx`
- `src/pages/archives/PrivacyFilteredPage.tsx`
- `src/pages/archives/ContextExportPage.tsx`
- All routing

### Dependencies
- `useVoiceInput` hook (existing — same as Notepad/LiLa)
- `sendAIMessage` + `extractJSON` (existing — same as BulkAddWithAI)
- `getContrastText` from `member_colors.ts` (existing)
- `MEMBER_COLORS` palette (existing)

### Post-Build Checklist
- [ ] Supabase Storage bucket `family-avatars` needs creation (dashboard/CLI)
- [ ] Verify `archive_context_items.source` CHECK allows 'bulk_add' or update constraint
- [ ] TypeScript: zero errors
- [ ] Vite build: clean
- [ ] Update STUB_REGISTRY.md if anything new stubbed
