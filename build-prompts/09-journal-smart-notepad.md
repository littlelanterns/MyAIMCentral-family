# Build Prompt 09: Journal & Smart Notepad

## PRD Reference
- PRD-08: `prds/personal-growth/PRD-08-Journal-Smart-Notepad.md`
- PRD-08 Addendum: `prds/addenda/PRD-08-Cross-PRD-Impact-Addendum.md`
- PRD-18 Addendum (tag changes): `prds/addenda/PRD-18-Cross-PRD-Impact-Addendum.md`

## Prerequisites
- Phase 06 (LiLa Core) complete

## Objective
Build Smart Notepad (universal capture) and Journal (permanent entries) with Review & Route extraction pipeline.

## Database Work
Create tables:
- `journal_entries` — 11 entry_type values, tags TEXT[] with GIN index, visibility, embedding
- `notepad_tabs` — Smart Notepad workspaces
- `notepad_extracted_items` — Review & Route extracted items
- `notepad_routing_stats` — Usage analytics

Audit ruling: Keep entry_type as structural enum (creation flow), tags for flexible filtering (browsing UI). Sub-pages become tag-filtered views.
Audit ruling: Drop family_messages table — messaging routes to PRD-15's conversation_spaces system.

## Component Work
- Smart Notepad right drawer (always-on, tabbed, autosave)
- Multiple tabs with drag-and-drop between tabs
- Voice-to-text input (Whisper API)
- AI auto-titling of tabs
- "Send to..." routing grid (9 destinations):
  1. Journal (entry type picker)
  2. Tasks (structure picker)
  3. Lists (existing lists grouped by type)
  4. Intentions (direct save to BestIntentions)
  5. Victories (direct save)
  6. Calendar (date/time or AI extraction)
  7. InnerWorkings (category picker)
  8. Messages (→ PRD-15 conversation_spaces)
  9. Archives (folder destination picker)
- Review & Route AI extraction pipeline
- Journal page with timeline, tag-filtered views, search
- 11 journal entry types with creation flows
- Journal tag-based filtering (system tags + custom tags)
- Reflections and Commonplace views (tag filters, not sub-pages)

## Testing Checklist
- [ ] Notepad autosaves on typing
- [ ] Multiple tabs work independently
- [ ] Send to routing grid shows all 9 destinations
- [ ] Review & Route extracts items correctly
- [ ] Journal entries persist with correct entry_type
- [ ] Tag filtering works
- [ ] Voice-to-text captures and inserts
- [ ] Embedding pipeline processes journal entries

## Definition of Done
- Notepad and Journal fully functional
- Routing grid wired to available destinations (stubs for unavailable)
- Review & Route extraction tested
