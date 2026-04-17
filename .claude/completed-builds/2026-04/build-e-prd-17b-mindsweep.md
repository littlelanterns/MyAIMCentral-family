# Build E: PRD-17B MindSweep

### PRD Files
- `prds/communication/PRD-17B-MindSweep.md` (full PRD — read every word)

### Addenda Read
- `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md`
- `prds/addenda/PRD-Audit-Readiness-Addendum.md`

### Feature Decision File
`claude/feature-decisions/PRD-17B-MindSweep.md`

---

### Pre-Build Summary

#### Context
MindSweep is the AI auto-sort intelligence layer that sits on top of the Universal Queue & Routing System (PRD-17, just completed — 30 wired, 7 stubbed, 0 missing, 24 E2E tests passing). It is a **mode**, not a separate feature. It adds automatic extraction, classification, confidence scoring, and routing to the existing Notepad -> Review & Route -> Queue pipeline. Three routing paradigms now exist: "Send to" (manual), "Review & Route" (semi-manual), "MindSweep" (automatic).

MindSweep also introduces external intake channels: quick-capture PWA at `/sweep`, share-to-app, and email forwarding (email delivery stubbed — requires DNS setup).

This is a competitive differentiator against Jam Family Calendar's "Jaime" which routes to 3 destinations. MindSweep routes to 15+ destinations with configurable intelligence, sensitivity rules, cross-member detection, and learning patterns.

#### Infrastructure Already Built
- **PRD-17 (Universal Queue)** — FULLY BUILT: UniversalQueueModal, SortTab, QueueCard, BatchCard, RoutingStrip (15+ destinations), ListPickerModal, TaskCreationModal, BreathingGlow, RoutingToastProvider, useStudioQueue hooks, QueueBadge on Dashboard/Tasks/Calendar, QuickTasks modal trigger
- **studio_queue table** — Full schema with RLS, indexes. Already has `mindsweep_confidence` + `mindsweep_event_id` columns. `source` field has no CHECK constraint (free text).
- **families table** — Already has `sweep_email_address` + `sweep_email_enabled` columns (migration 00000000000001)
- **pgvector infrastructure** — FULLY BUILT: `embed` Edge Function (processes 13+ tables), `queue_embedding_job()` trigger, pgmq `embedding_jobs` queue, halfvec(1536) with HNSW indexes on 14 tables, `match_bookshelf_chunks()` + `match_bookshelf_extractions()` RPCs, OpenAI text-embedding-3-small
- **whisper-transcribe** — Edge Function exists, processes audio via OpenAI Whisper
- **useVoiceInput hook** — Exists with MediaRecorder + Web Speech API + Whisper fallback
- **Vision OCR** — Pattern exists in bookshelf-process (Claude Haiku via OpenRouter for image text extraction)
- **All routing destinations** — Tasks, Lists (10 types), Calendar, Journal, Victory Recorder, Guiding Stars, Best Intentions, Archives, InnerWorkings, Backburner, Ideas
- **context-assembler.ts** — Three-layer relevance-filtered context assembly in `_shared/`
- **cost-logger.ts** — AI cost tracking utility in `_shared/`
- **QuickTasks MindSweep button** — Already defined (Brain icon, routes to `/sweep`)
- **QuickCreate MindSweep action** — Already defined (routes to `/sweep`)
- **Types** — `mindsweep_confidence` already typed in `src/types/tasks.ts`

#### Dependencies NOT Yet Built
- PRD-15 (Messages/Notifications) — cross-member notification creation stubbed
- PRD-16 (Meetings) — "MindSweep All" stubbed
- PRD-18 (Rhythms) — MindSweep Digest rendering stubbed (register section type only)
- PRD-33 (PWA/Offline) — full offline sync stubbed (basic IndexedDB capture for /sweep fine)

#### What's Now Built (Sprint 1+2, 2026-04-03)
- `/sweep` route in App.tsx (ProtectedRouteNoShell)
- `MindSweepCapture.tsx` page — text, voice, scan (ScanLine → Haiku vision OCR), link (URL → Haiku summarize), holding queue UI, settings panel (5 sections)
- `mindsweep-sort` Edge Function — embedding-first + Haiku LLM batch classification, sensitivity rules, cross-member detection
- `mindsweep-scan` Edge Function — 2 modes: `scan` (image → text via Haiku vision) and `link` (URL → summarized text)
- MindSweep tile on RoutingStrip wired to sweep pipeline (NotepadDrawer intercepts `destination === 'mindsweep'`)
- Processing overlay in NotepadDrawer + status display on /sweep
- `useRunSweep` shared hook — used by both NotepadDrawer and MindSweepCapture
- `useDeleteHolding` + `useMarkHoldingProcessed` mutations with cache invalidation
- `useSweepStatus` with 8-second auto-reset timer
- `routeSweepResults` concurrent inserts via Promise.all
- `useVoiceInput` — `forceHighAccuracy` option + <30s Web Speech API shortcut (skip Whisper for short recordings)
- `UndoToast` / `RoutingToastProvider` — `onUndo` made optional for MindSweep confirmation toasts
- Confidence badge on QueueCard for MindSweep-originated items
- 11 Playwright E2E tests passing
- `tsc -b` zero errors

#### Sub-Phase Plan (3 phases)

**Phase A: Data layer + mindsweep-sort Edge Function + RoutingStrip tile**
1. Migration `00000000100089_mindsweep_tables.sql` — 5 new tables with RLS + indexes + feature keys + classify_by_embedding RPC
2. TypeScript types: `src/types/mindsweep.ts`
3. `mindsweep-sort` Edge Function — embedding-first classification + Haiku LLM fallback + sensitivity rules + cross-member detection + recipe/travel detection
4. MindSweep tile on RoutingStrip — Wand2 icon, sends content through `mindsweep-sort`, handles results per aggressiveness mode
5. Processing indicator + confirmation toast
6. Confidence badge on QueueCard for MindSweep-originated items
7. `useMindSweep` hook — settings, sweep trigger, holding queue management
8. TypeScript check: `tsc -b` zero errors

**Phase B: Quick-capture PWA + voice + scan + holding queue**
1. ~~`/sweep` route in App.tsx~~ DONE (Sprint 1)
2. ~~`MindSweepCapture.tsx` page component — text, voice, scan, link~~ DONE (Sprint 1+2)
3. ~~Voice optimization: Web Speech API for <30s, Whisper for 30s+~~ DONE (Sprint 2)
4. ~~Scan: vision model OCR — image NOT stored, text extraction only~~ DONE (Sprint 2)
5. ~~Link capture: URL fetch + summarize~~ DONE (Sprint 2)
6. ~~Holding queue UI: item count, [Sweep All], [Save for Later]~~ DONE (Sprint 2)
7. Auto-sweep: pg_cron job at configured time — NOT YET
8. Share-to-app via Web Share Target API — NOT YET (investigate PWA setup)
9. PWA manifest for `/sweep` (distinct icon) — NOT YET (investigate PWA setup)
10. Basic IndexedDB offline capture — NOT YET
11. ~~QuickTasks MindSweep button opens quick-capture~~ DONE (already wired)
12. ~~TypeScript check~~ DONE

**Phase C: Settings + email stub + polish**
1. MindSweep Settings screen — 8 sections (auto-sort mode, always-review rules, processing schedule, voice, scanning info, external intake, home screen, digest)
2. Email forwarding UI (display address, allowed senders management) — delivery stubbed
3. `mindsweep-email-intake` Edge Function code (ready to enable when DNS configured)
4. Approval pattern data collection (record actions to `mindsweep_approval_patterns`)
5. Feature keys + `useCanAccess()` wiring
6. MindSweep Digest section type #28 registered (stub renderer)
7. TypeScript check
8. Post-build PRD verification

### Stubs (NOT Building Any Phase)
- Approval pattern LEARNING recommendations (Phase 2)
- Weekly MindSweep intelligence report (Phase 2)
- Email forwarding DELIVERY infrastructure (DNS + webhook)
- MindSweep onboarding prompt (add to home screen during onboarding)
- MindSweep Digest RENDERING in rhythms (PRD-18 not built)
- "MindSweep All" on meeting post-processing (PRD-16 not built)
- Notification auto-dismiss on queue processing (PRD-15 not built)
- Cross-member routing notification creation (PRD-15 not built)
- Proactive capture prompts
- MindSweep dashboard widget
- Seasonal content capture suggestions
- SMS intake channel
- Full offline sync (PRD-33 scope)

### Key Decisions
1. **Embedding-first classification is viable** — pgvector infrastructure fully built (14 tables with embeddings, `embed` Edge Function, HNSW indexes). Need new `classify_by_embedding()` RPC to compare MindSweep items against existing family content.
2. **5 mindsweep tables need creation** — none exist in live DB. Migration 00000000100089.
3. **studio_queue columns already exist** — mindsweep_confidence + mindsweep_event_id already in migration 00000000000008. No ALTER needed.
4. **families sweep columns already exist** — sweep_email_address + sweep_email_enabled in migration 00000000000001. No ALTER needed.
5. **Vision OCR reuses bookshelf-process pattern** — Claude Haiku via OpenRouter for image text extraction. Extract into shared utility or inline in mindsweep-sort.
6. **Voice optimization wraps existing useVoiceInput** — add <30s Web Speech API shortcut before Whisper.
7. **Non-queue destinations route directly** — Journal, Victory, Best Intentions, Guiding Stars, Backburner, Archives, InnerWorkings create records directly. Tasks, Lists go through studio_queue.
8. **3 sub-phases** — A (data + Edge Function + RoutingStrip), B (PWA + voice + scan + holding), C (settings + email + polish).

---

