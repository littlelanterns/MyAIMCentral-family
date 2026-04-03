# Feature Decision File: PRD-17B — MindSweep

> **Created:** 2026-04-03
> **PRD:** `prds/communication/PRD-17B-MindSweep.md`
> **Addenda read:**
>   - `prds/addenda/PRD-17B-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
> **Founder approved:** pending

---

## What Is Being Built

MindSweep is the AI auto-sort intelligence layer that sits on top of the Universal Queue & Routing System (PRD-17). It is NOT a separate feature with its own screens — it is a **mode** that adds automatic extraction, classification, confidence scoring, and routing to the existing Notepad -> Review & Route -> Queue pipeline. MindSweep introduces three routing paradigms: "Send to" (manual), "Review & Route" (semi-manual), and "MindSweep" (automatic). It also adds external intake channels: a quick-capture PWA at `/sweep`, share-to-app, and email forwarding (email delivery stubbed). Mom talks for 90 seconds while making coffee and everything lands where it belongs.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| MindSweep tile on RoutingStrip | Lucide `Wand2`, "MindSweep" label. Tapping sends content to `mindsweep-sort` Edge Function. Position: after direct destinations, before Backburner. |
| Processing indicator | "MindSweep sorting..." with animation during sweep |
| Confirmation toast | "MindSweep sorted N items" with [View in Queue] link |
| Quick-capture PWA (`/sweep`) | Minimal capture: text field (autofocus), voice button, scan button (ScanLine), link button, [Sweep Now], [Save for Later], holding queue indicator, auto-sort mode indicator, gear icon for Settings, recent activity line, [Open MyAIM] link |
| MindSweep Settings screen | 8 sections: Auto-Sort Mode (3 radio buttons), Always Review rules (checkboxes), Processing Schedule, Voice settings, Document Scanning info, External Intake (email + share), Home Screen Shortcut, Digest toggles |
| Holding queue UI | Item count badge, next auto-sweep time, [Sweep Now] button |
| Confidence badge on QueueCard | Subtle high/medium/low indicator on MindSweep-originated queue items |
| QuickTasks MindSweep button | Already exists (Wand2 icon, routes to `/sweep`) — needs to open quick-capture |
| Empty state for /sweep | "Nothing to sweep yet — type, speak, or share something first." |
| First-use scan tooltip | "Scan reads text from photos and flyers. The image stays on your phone — we just grab the information." |

---

## Key PRD Decisions (Easy to Miss)

1. **MindSweep is a MODE, not a destination** — it has no own storage. Routes to existing destinations (Tasks, Lists, Calendar, Journal, Victory, Best Intentions, Guiding Stars, Backburner, Archives, InnerWorkings, another member's queue).
2. **Three aggressiveness modes**: `always_ask` (default), `trust_obvious`, `full_autopilot`. Sensitive content ALWAYS goes to queue regardless of mode.
3. **Embedding-first classification**: Generate embedding -> pgvector similarity > 0.85 = free 'high' confidence classification. Below threshold -> batch into single Haiku LLM call. Handles ~90% of routine items for free.
4. **Batched processing**: Items collect in `mindsweep_holding`. Process in one batch via Sweep Now or auto-sweep. 15 individual calls vs 1 batched = 70-75% savings.
5. **Non-queue destinations route DIRECTLY** (Journal, Victory, Best Intentions, Guiding Stars, Backburner, Archives). Queue-based destinations (Tasks, Lists, Widgets) go through `studio_queue`.
6. **Voice cost optimization**: Short recordings (<30s) use free browser Web Speech API. Long recordings (30s+) use Whisper. "High accuracy" toggle forces Whisper for all.
7. **Scan = document extraction only**: Image NOT stored in MyAIM. Only extracted text kept. Button labeled "Scan" (ScanLine), NOT "Photo" or "Camera".
8. **Email is per-family, not per-member**: `[family-slug]-[short-hash]@sweep.myaimfamily.com`. Dormant until enabled. Unknown senders get bounce. When disabled, emails silently dropped (no bounce to prevent confirming address exists).
9. **Cross-member detection suggests, never auto-acts**: When content references another family member by name, MindSweep suggests routing to their queue. Mom confirms.
10. **Approval patterns: data collection now, learning later**: `mindsweep_approval_patterns` records every approval action. Phase 2 analyzes and suggests auto-approval.
11. **Single-item vs multi-item**: Single items route directly without extraction step. Multi-item content (detected by sentence boundaries, conjunctions, topic shifts) gets full extraction.
12. **Recipe detection**: Dual-route — recipe text to Archives/reference, ingredients to shopping list.
13. **Travel confirmation parsing**: Extract structured travel data, route to Calendar with rich event details.
14. **Per-session mode override**: User can override default aggressiveness at capture time.
15. **`mindsweep_holding` is server-side**: Not just IndexedDB. Email/share may arrive when device isn't active.
16. **MindSweep Digest**: Section type #28 for PRD-18 Rhythms. Morning/Evening/Weekly summaries from `mindsweep_events`.
17. **Auto-sweep**: Scheduled daily at configured time (default 8pm). pg_cron job.

---

## Addendum Rulings

### From PRD-17B-Cross-PRD-Impact-Addendum.md:
- `families` gets `sweep_email_address` + `sweep_email_enabled` — **already in migration 00000000000001**
- `studio_queue` gets `mindsweep_confidence` + `mindsweep_event_id` — **already in migration 00000000000008**
- `studio_queue.source` expanded with 4 new values — no CHECK constraint exists on source, so this is free
- Calendar events from MindSweep carry `source_type = 'mindsweep'`
- `mindsweep_settings` auto-created for Mom, Dad, Independent during setup
- Mom/Dad emails auto-added to `mindsweep_allowed_senders`
- MindSweep tile added to RoutingStrip destination catalog
- MindSweep Digest as section type #28 in PRD-18
- Cross-member routing creates notification records (PRD-15 stub)
- Quick-capture PWA needs its own web manifest (PRD-33 scope, basic version fine)

### From PRD-Audit-Readiness-Addendum.md:
- Process/quality guidance only. No schema changes or specific feature decisions.

---

## Database Changes Required

### New Tables (5)

**`mindsweep_settings`** — Per-member MindSweep configuration
- PRD column names are authoritative (not database_schema.md summaries)
- Key columns: `aggressiveness` (not aggressiveness_mode), `always_review_rules` JSONB, `custom_review_rules` JSONB, `auto_sweep_shared`, `auto_sweep_time` TIME, `email_process_immediately`, `high_accuracy_voice`, `digest_morning/evening/weekly`
- UNIQUE on member_id (one config per member)

**`mindsweep_holding`** — Server-side staging queue for batch processing
- Key columns: `content`, `content_type` (voice_short/voice_long/text/scan_extracted/link/email), `source_channel` (quick_capture/routing_strip/share_to_app/email_forward/lila_conversation), `audio_blob_local`, `link_url`, `captured_at`, `processed_at`, `sweep_event_id`

**`mindsweep_allowed_senders`** — Whitelisted email addresses
- Key columns: `email_address`, `added_by`
- UNIQUE on (family_id, email_address)

**`mindsweep_events`** — Sweep event tracking
- Key columns: `source_channel`, `input_type`, `raw_content_preview` (200 chars), `items_extracted`, `items_auto_routed`, `items_queued`, `items_direct_routed`, `aggressiveness_at_time`, `processing_cost_cents`

**`mindsweep_approval_patterns`** — Approval behavior recording
- Key columns: `content_category`, `action_taken` (approved_unchanged/approved_edited/rerouted/dismissed), `suggested_destination`, `actual_destination`

### Modified Tables (columns already exist)
- `studio_queue.mindsweep_confidence` — already in migration 00000000000008
- `studio_queue.mindsweep_event_id` — already in migration 00000000000008
- `families.sweep_email_address` — already in migration 00000000000001
- `families.sweep_email_enabled` — already in migration 00000000000001

### New RPC Functions
- `classify_by_embedding()` — Takes item embedding, compares against family content embeddings across multiple tables, returns category + confidence + destination

### Migrations
- `00000000100089_mindsweep_tables.sql` — All 5 new tables + RLS + indexes + feature keys + auto-sweep pg_cron job

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `mindsweep_manual` | Essential | mom, dad_adults, independent_teens | Always Ask mode |
| `mindsweep_auto` | Full Magic | mom, dad_adults | Trust Obvious + Full Autopilot |
| `mindsweep_email` | Full Magic | mom | Email forwarding intake |
| `mindsweep_share` | Enhanced | mom, dad_adults, independent_teens | Share-to-app intake |
| `mindsweep_pwa` | Enhanced | mom, dad_adults, independent_teens | Quick-capture PWA |
| `mindsweep_digest` | Enhanced | mom, dad_adults | MindSweep Digest in Rhythms |
| `mindsweep_learning` | Full Magic | mom | Approval pattern analysis (Phase 2) |

---

## Stubs — Do NOT Build This Phase

- [ ] Approval pattern LEARNING recommendations (Phase 2 — data collection YES, analysis/suggestions NO)
- [ ] Weekly MindSweep intelligence report (Phase 2)
- [ ] Email forwarding DELIVERY infrastructure (DNS + webhook — build Edge Function code, stub delivery)
- [ ] MindSweep onboarding prompt (add to home screen during onboarding)
- [ ] MindSweep Digest RENDERING in rhythms (register section type #28, stub renderer — PRD-18 not built)
- [ ] "MindSweep All" on meeting post-processing (PRD-16 not built)
- [ ] Notification auto-dismiss on queue processing (PRD-15 not built)
- [ ] Cross-member routing notification creation (PRD-15 not built)
- [ ] Proactive capture prompts ("You usually capture homework wins on Fridays...")
- [ ] Auto-sweep shared content toggle behavior (basic toggle saved, auto-processing deferred)
- [ ] MindSweep dashboard widget
- [ ] Seasonal content capture suggestions
- [ ] SMS intake channel
- [ ] Full offline sync (PRD-33 scope — basic IndexedDB capture for /sweep is fine)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| MindSweep classification | -> | Tasks | `studio_queue` with `destination='task'` |
| MindSweep classification | -> | Lists/Shopping | `studio_queue` with `destination='list'` + ListPickerModal |
| MindSweep classification | -> | Calendar | `calendar-parse-event` Edge Function -> `calendar_events` |
| MindSweep classification | -> | Journal | Direct `journal_entries` insert |
| MindSweep classification | -> | Victory Recorder | Direct `victories` insert |
| MindSweep classification | -> | Best Intentions | Direct `best_intentions` insert |
| MindSweep classification | -> | Guiding Stars | Direct `guiding_stars` insert |
| MindSweep classification | -> | Backburner | Direct `list_items` insert in Backburner list |
| MindSweep classification | -> | Archives | Direct `archive_context_items` insert |
| MindSweep classification | -> | InnerWorkings | Direct `self_knowledge` insert |
| MindSweep classification | -> | Another member's queue | `studio_queue` with target `owner_id` |
| Notepad "Send to" | -> | MindSweep | RoutingStrip tile sends content to `mindsweep-sort` |
| Quick-capture PWA | -> | MindSweep | `/sweep` page captures -> `mindsweep_holding` -> `mindsweep-sort` |
| Voice input | -> | MindSweep | `useVoiceInput` hook (existing) + Web Speech API optimization |
| Whisper transcribe | -> | MindSweep | Existing Edge Function for long recordings |
| Scan/OCR | -> | MindSweep | Vision model text extraction (new, based on bookshelf-process pattern) |
| pgvector embeddings | -> | MindSweep | Embedding-first classification via `classify_by_embedding()` RPC |
| Embed Edge Function | -> | MindSweep | Generates embeddings for family content (existing infrastructure) |

---

## Things That Connect Back to This Feature Later

- PRD-18 (Rhythms): MindSweep Digest section type #28 renders sweep summaries
- PRD-15 (Messages): Cross-member routing notifications
- PRD-16 (Meetings): "MindSweep All" button on meeting post-processing
- PRD-33 (PWA/Offline): Full offline sync, Web Share Target API service worker registration
- Phase 2 Learning: `mindsweep_approval_patterns` analysis -> auto-approval suggestions

---

## Founder Confirmation (Pre-Build)

- [ ] Pre-build summary reviewed and accurate
- [ ] All addenda captured above
- [ ] Stubs confirmed — nothing extra will be built
- [ ] Schema changes correct
- [ ] Feature keys identified
- [ ] **Approved to build**

---

## Post-Build PRD Verification

> To be completed after build.

| Requirement | Source | Status | Notes |
|---|---|---|---|
| | | | |

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
