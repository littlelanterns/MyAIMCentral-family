# Feature Decision File: PRD-13B — Archives Repair Pass

> **Created:** 2026-03-25
> **Base PRD:** `prds/personal-growth/PRD-13-Archives-Context.md`
> **Base feature decision:** `claude/feature-decisions/PRD-13-Archives-Context.md`
> **Addenda read:**
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md`
> **Scope:** Targeted repair pass — NOT a rebuild. Only 5 specific changes.
> **Founder approved:** *(pending)*

---

## What Is Being Built

A targeted UI/UX enhancement pass on the existing Archives feature (PRD-13). Five changes:
1. Grid column algorithm utility (new shared utility)
2. Bublup-style folder grid on ArchivesPage with photo/color member cards + grid/list toggle
3. Photo upload for member avatars and family photo (new Supabase Storage integration)
4. Member color fallback (eliminate grey placeholders globally)
5. Expanded FAB with Voice Dump and Bulk Add & Sort

No changes to routing, data hooks, three-tier toggle system, context assembly, or any existing Archives subpage logic.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| **`src/lib/utils/gridColumns.ts`** | New utility: `getOptimalColumnCount(total, maxColumns)` — nobody sits alone |
| **`src/components/archives/ArchiveMemberCard.tsx`** | New: Square card with photo/color states, gradient overlay, name/insights/role/heart, camera overlay |
| **ArchivesPage.tsx (modified)** | Grid layout for member cards, grid/list toggle, responsive column count, expanded FAB |
| **`src/hooks/useAvatarUpload.ts`** | New: Upload member avatar + family photo to Supabase Storage, update DB |
| **`src/components/archives/VoiceDumpModal.tsx`** | New: Voice recording → transcript → auto-populates Bulk Add |
| **`src/components/archives/BulkAddSortModal.tsx`** | New: Textarea → Haiku AI sort → review screen → save items |
| **`src/components/shared/Avatar.tsx` (modified)** | Update: Use `getContrastText()` for initials text color when using member color |
| **MemberArchiveDetail.tsx (modified)** | Folder grid in 3 columns on desktop |

---

## Key Decisions (Easy to Miss)

1. **Grid column algorithm priority:** remainder 0 (perfect) > highest remainder (fuller last row) > remainder 1 (worst — someone alone). Decision table: 2→2, 3→3, 4→4, 5→5, 6→3, 7→4, 8→4, 9→3, 10→5, 11→4, 12→4, 13→5, 14→5, 15→5, 16→4
2. **Mobile always list** — grid/list toggle hidden on mobile (<768px), always renders list view
3. **Family Overview is always the first card** in the grid
4. **Camera overlay:** hover on desktop, long-press on mobile — NOT always visible
5. **No-photo state uses `assigned_color_token` resolved to hex**, falling back to `member_color`, then `assigned_color`, then `var(--color-btn-primary-bg)`
6. **Initials logic:** 2-letter initials from first + last name, or first 2 chars if single name
7. **Voice Dump goes straight to Bulk Add review** — mom never manually reviews raw transcript
8. **Bulk Add source = 'bulk_add'** — new source value for `archive_context_items`
9. **Family photo stored in `families.family_photo_url`** — new column needed
10. **Supabase Storage bucket `family-avatars`** — must be created (dashboard/CLI, noted in checklist)
11. **Photo upload paths:** `{family_id}/{member_id}` for members, `{family_id}/family-overview` for family
12. **localStorage key `archives-view-mode`** for grid/list toggle persistence
13. **Bulk Add AI uses Haiku via `sendAIMessage()`** — same pattern as BulkAddWithAI
14. **Human-in-the-Mix on Bulk Add:** Nothing saves until mom reviews and taps "Save Selected"

---

## Database Changes Required

### New Columns
- `families.family_photo_url TEXT` — NULL by default

### New Supabase Storage
- Bucket: `family-avatars` (public read, authenticated write)
- Note: Must be created via Supabase dashboard or CLI — not a SQL migration

### New Archive Source Value
- `archive_context_items.source` CHECK constraint may need `'bulk_add'` added
- Check if the CHECK allows any text or is constrained to specific values

### Migration
- Single migration: `ALTER TABLE families ADD COLUMN IF NOT EXISTS family_photo_url TEXT;`
- Check if `archive_context_items.source` CHECK needs updating for `'bulk_add'`

---

## Feature Keys

No new feature keys — this is a UI enhancement to the existing `archives_browse` feature.

---

## Stubs — Do NOT Build This Phase

- [ ] LiLa-assisted context learning save dialog (already stubbed from PRD-13 base build)
- [ ] Auto-generated overview card via Haiku (already stubbed)
- [ ] ShareWithArchiveToggle (already stubbed)
- [ ] Context freshness indicators (already stubbed)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Avatar upload | → | family_members.avatar_url | Supabase Storage → DB update |
| Family photo upload | → | families.family_photo_url | Supabase Storage → DB update |
| Voice Dump | ← | useVoiceInput hook | Same hook as Notepad/LiLa |
| Bulk Add AI sort | ← | sendAIMessage + ai-parse Edge Fn | Haiku model, same pattern as BulkAddWithAI |
| Bulk Add save | → | archive_context_items | Creates records with source='bulk_add' |
| Member color | ← | member_colors.ts | getContrastText() for initials |

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All changes captured above match repair instructions
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct (family_photo_url + storage bucket)
- [ ] **Approved to build**
