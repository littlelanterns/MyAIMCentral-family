# Feature Decision File: PRD-07 — InnerWorkings Repair Pass

> **Created:** 2026-03-25
> **PRD:** `prds/personal-growth/PRD-07-InnerWorkings.md`
> **Addenda read:**
>   - `prds/addenda/PRD-07-Session-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-Template-and-Audit-Updates.md`
>   - `prds/addenda/PRD-31-Permission-Matrix-Addendum.md`
> **Founder approved:** pending

---

## What Is Being Built

**Repair pass only — not a rebuild.** InnerWorkings has a working page, hook, upload pipeline, and AI context integration. This session fixes PRD compliance gaps:
- Swap Eye/EyeOff → Heart/HeartOff (platform convention)
- Fix categories to match PRD (5 specific categories)
- Replace tab navigation with collapsible groups
- Replace hard delete with soft delete (archived_at)
- Add missing `source` freeform field to create/edit form
- Add "Discover with LiLa" button (stub)
- Add per-group "heart all / unheart all" toggle
- Add conditional context loading (shouldLoadSelfKnowledge)
- Fix summary indicator wording
- Wire source_reference_id and file_storage_path on upload saves

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| InnerWorkings main page | Collapsible groups by category (5 groups). Heart toggle per entry. Drag-to-reorder within groups. Archive/restore. |
| InnerWorkings entry card | Heart icon, content text, category tag, source indicator, source_type badge, edit/archive actions, drag handle |
| InnerWorkings create/edit form | Content field, category picker (5 options), source field (freeform optional), share toggles |
| InnerWorkings empty state (global) | Warm copy per PRD. Three buttons: "Write Something About Myself", "Upload Assessment Results", "Let LiLa Help Me Discover" (stub) |
| InnerWorkings upload flow | Already working — fix category mapping + wire source_reference_id/file_storage_path |
| InnerWorkings bulk add | Already working via BulkAddWithAI — fix category values |
| InnerWorkings archived section | Collapsible "View Archived" at bottom |
| Per-group heart all/unheart all | Toggle button per collapsible group header |

---

## Key PRD Decisions (Easy to Miss)

1. **Categories must be exactly 5**: `personality_type`, `trait_tendency`, `strength`, `growth_area`, `general`. Current code has wrong categories.
2. **Display labels**: "Personality Types", "Traits & Tendencies", "Strengths", "Growth Areas", "General"
3. **"Growth Areas" label is SACRED** — never "Weaknesses", "Flaws", "Shortcomings" anywhere in UI or AI text.
4. **`source` freeform field** — optional, shows "Where does this come from?" (e.g., "Enneagram Type 1", "therapist", "self-observed")
5. **Personality Types category** gets hover description: "Your results from personality frameworks — MBTI, Enneagram, Dressing Your Truth, Four Tendencies, StrengthsFinder, Love Languages, etc."
6. **Upload saves must include `source_reference_id`** (shared across all entries from one upload) and `file_storage_path` on each record
7. **`source_type` enum values**: 'manual', 'file_upload' (not 'upload'), 'lila_discovery' (not 'lila_guided'), 'bulk_add', 'content_extraction', 'log_routed'
8. **Soft delete via `archived_at`** — column exists in live DB, code currently hard-deletes
9. **Teen privacy inverted from Guiding Stars** — InnerWorkings defaults to PRIVATE for teens. Mom must opt IN to visibility.
10. **`is_private` column** — for teen entries when mom has enabled private entry capability
11. **Heart/HeartOff** replaces Eye/EyeOff for is_included_in_ai toggle
12. **Conditional context loading** — shouldLoadSelfKnowledge() uses same pattern as Guiding Stars

---

## Addendum Rulings

### From PRD-07-Session-Addendum.md:
- Feature renamed "My Foundation" → "InnerWorkings" (already done in code)
- "You, Inc." category removed — 5 categories only
- `self_knowledge` supersedes `member_self_insights` from PRD-05 (already done)
- Teen privacy inverted: private by default, mom opts in
- Archives convention: "Checked somewhere, checked everywhere" — sharing state single-source-of-truth on self_knowledge table
- `self_discovery` guided mode registered (stub this session)
- Personality GPTs are post-MVP
- Personality Types stores type identifiers only — LiLa enriches with built-in knowledge

### From PRD-31-Permission-Matrix-Addendum.md:
- Feature keys: `innerworkings_basic` (Essential), `innerworkings_upload` (Enhanced), `innerworkings_discovery` (Enhanced), `innerworkings_context` (Essential)

---

## Database Changes Required

### Existing Table: `self_knowledge`

Live schema already has: id, family_id, member_id, category, content, source_type, share_with_mom, share_with_dad, is_included_in_ai, embedding, created_at, updated_at, source, source_reference_id, file_storage_path, is_private, sort_order, archived_at

**All needed columns already exist in live DB.** Changes needed:
- Update `category` enum constraint if one exists (old values → new values)
- Data migration: rename existing category values (personality→personality_type, strengths→strength, growth_areas→growth_area, communication_style→trait_tendency, how_i_work→general)

### No new tables needed

### Migrations
- Category value migration (UPDATE self_knowledge SET category = 'personality_type' WHERE category = 'personality', etc.)
- Idempotent — safe to run multiple times

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `innerworkings_basic` | Essential | mom, dad_adults, independent_teens | Manual entry + bulk add |
| `innerworkings_upload` | Enhanced | mom, dad_adults, independent_teens | File upload + AI extraction |
| `innerworkings_discovery` | Enhanced | mom, dad_adults, independent_teens | Discover with LiLa (stub) |
| `innerworkings_context` | Essential | mom, dad_adults, independent_teens | Entries loaded in LiLa context |

---

## Stubs — Do NOT Build This Phase

- [ ] "Discover with LiLa" (`self_discovery` guided mode) — button present, opens LiLa drawer with stub message
- [ ] Content extraction from Knowledge Base uploads
- [ ] LiLa context learning auto-detection
- [ ] Dashboard widget
- [ ] Safe Harbor personality-adapted coping
- [ ] Teen privacy indicator badge (UI shows but toggle not functional until PRD-02 teen visibility setting exists)
- [ ] Archives person card integration ("Checked somewhere, checked everywhere")

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| InnerWorkings | → | LiLa context assembly | `is_included_in_ai`, conditional loading via shouldLoadSelfKnowledge() |
| Notepad routing | → | InnerWorkings | RoutingStrip destination `innerworkings` (already wired) |
| Upload | → | extract-insights Edge Function | File upload → AI extraction (already working) |
| InnerWorkings | → | Embedding pipeline | `embedding` column + queue trigger (already wired) |

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**
