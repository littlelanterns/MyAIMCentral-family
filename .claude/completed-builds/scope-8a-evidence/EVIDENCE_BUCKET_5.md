# Scope 8a — Bucket 5 Evidence: Legal Liability Surfaces (Human-in-the-Mix)

> **Worker pass:** 2026-04-20
> **Items covered:** 8a-CL-37, 8a-CL-38, 8a-CL-39, 8a-CL-40
> **Checklist source:** [CHECKLIST_INVENTORY.md](CHECKLIST_INVENTORY.md) §Bucket 5

---

## Summary table

| ID | Claim | Verdict | Finding in brief |
|---|---|---|---|
| 8a-CL-37 | HITM component exists and is reusable | **PARTIAL** | Component exists at [src/components/HumanInTheMix.tsx](../src/components/HumanInTheMix.tsx) with the exact 4 handlers specified in `conventions.md`. **Reuse count = 1** (only imported by `LilaMessageBubble.tsx`). Most features re-invent the Edit/Approve/Regenerate/Reject pattern inline rather than reusing the component. |
| 8a-CL-38 | HITM applied on every persistent AI output | **PARTIAL** | 13 of 17 features checked have HITM-equivalent UX before persistence. **Four features persist AI output without HITM** (see subtable below). MindSweep opt-in auto-routing, DailyCelebration narrative auto-save, BookShelf extraction pipeline, and auto-titling all commit AI output with no pre-commit human review gate. |
| 8a-CL-39 | LiLa chat exempt from HITM (scope confirmation) | **DEFERRED** | Scope confirmation — requires founder acknowledgment, not worker verdict. |
| 8a-CL-40 | Embeddings exempt from HITM (scope confirmation) | **DEFERRED** | Scope confirmation — requires founder acknowledgment, not worker verdict. |

---

## 8a-CL-37 — HITM component exists and is reusable

### Component file
[src/components/HumanInTheMix.tsx](../src/components/HumanInTheMix.tsx) — 87 lines, exports named `HumanInTheMix`.

### Export signature
Props interface ([src/components/HumanInTheMix.tsx:4-10](../src/components/HumanInTheMix.tsx#L4-L10)):

```ts
interface HumanInTheMixProps {
  onEdit: () => void
  onApprove: () => void
  onRegenerate: () => void
  onReject: () => void
  isLoading?: boolean
}
```

All four handlers from `conventions.md` §Human-in-the-Mix Pattern are present. Renders four buttons with Lucide icons (Pencil, Check, RefreshCw, X) and Tooltip wrappers.

### Reuse — import sites
Grep `import.*HumanInTheMix src/` returned **1 match**:
- [src/components/lila/LilaMessageBubble.tsx:6](../src/components/lila/LilaMessageBubble.tsx#L6)

The component is rendered inside `LilaMessageBubble` on the latest assistant message when `!hideHumanInTheMix && !isStreaming` ([src/components/lila/LilaMessageBubble.tsx:147-159](../src/components/lila/LilaMessageBubble.tsx#L147-L159)).

### Interpretation
The specified reusable component exists and exposes the correct API. However, it is effectively used **only** for LiLa conversation messages — i.e., the one class of AI output that 8a-CL-39 scope-confirms as NOT requiring HITM. Every feature that persists AI output to a user record (Task Breaker, Review & Route, BulkAddWithAI, PostMeetingReview, CurriculumParseModal, RoutineBrainDump, InnerWorkings extract, SmartImportModal, etc.) implements the Edit/Approve/Regenerate/Reject semantics inline rather than consuming the shared component. The convention in `conventions.md` is satisfied in spirit (the pattern is applied) but not in the letter (the component is not reused).

**Verdict: PARTIAL** — component exists but reuse count = 1, and the sole consumer is the scope-exempt chat bubble.

---

## 8a-CL-38 — HITM applied on every persistent AI output

### Methodology
For each feature that calls an AI Edge Function whose output is persisted to a user-visible record, trace the commit path and determine whether Edit/Approve/Regenerate/Reject semantics are presented before the insert.

### Feature-by-feature subtable

| # | Feature | AI-output surface | Persistence target | HITM? | Evidence |
|---|---|---|---|---|---|
| 1 | **Task Breaker** | [TaskBreaker.tsx](../src/components/tasks/TaskBreaker.tsx) + [StandaloneTaskBreakerModal.tsx](../src/components/tasks/StandaloneTaskBreakerModal.tsx) | child `tasks` rows (parent_task_id) | **Wired (inline)** | Subtasks generated → editable list (inline title edit, reorder up/down, remove X, Retry to regenerate, Cancel to reject) → `Apply N Steps` button persists. [TaskBreaker.tsx:352-437](../src/components/tasks/TaskBreaker.tsx#L352-L437) |
| 2 | **Task Breaker image mode** | Same component, multimodal Sonnet | Same as above | **Wired (inline)** | Same review flow regardless of text/image input. |
| 3 | **Review & Route (Notepad)** | [NotepadReviewRoute.tsx](../src/components/notepad/NotepadReviewRoute.tsx) | `journal_entries`, `guiding_stars`, `best_intentions`, `self_knowledge`, `victories`, `studio_queue` | **Wired (inline)** | Per-card: inline text edit (`handleSaveEdit`), Edit in Notepad, Skip, Route to destination, Route All. [NotepadReviewRoute.tsx:383-608](../src/components/notepad/NotepadReviewRoute.tsx#L383-L608) |
| 4 | **BulkAddWithAI** (shared component used by Guiding Stars, Best Intentions, Self-Knowledge, Lists, Tasks, Family Setup) | [BulkAddWithAI.tsx](../src/components/shared/BulkAddWithAI.tsx) | Caller-specified destination | **Wired (inline)** | Two-step flow: input → preview with per-item edit/category/toggle/remove + `Back` (regenerate) + `Save Selected (N)` (approve). [BulkAddWithAI.tsx:282-443](../src/components/shared/BulkAddWithAI.tsx#L282-L443) |
| 5 | **AI Craft — Guiding Stars** (`craft_with_lila` mode) | Stub — `alert('Coming soon')` | N/A | **N/A (unbuilt)** | [GuidingStars.tsx:386-387](../src/pages/GuidingStars.tsx#L386), [GuidingStars.tsx:633-635](../src/pages/GuidingStars.tsx#L633-L635). The `craft_with_lila` guided mode reference lives only in `context-assembly.ts`. PRD-06 feature surface not yet built. |
| 6 | **AI Craft — Best Intentions** | No dedicated `Craft with LiLa` surface. BulkAddWithAI is the primary AI-input path ([BestIntentions.tsx:1096-1106](../src/pages/BestIntentions.tsx#L1096-L1106)). | `best_intentions` | **Wired (inline via BulkAddWithAI)** | Same pattern as #4. |
| 7 | **ai-parse callers** — family setup, list organize, tag suggestions, bulk add | [sendAIMessage](../src/lib/ai/send-ai-message.ts) is hit by 12 files | Varies per caller | **Mixed** | Every caller checked routes output through a review/preview surface: `FamilySetup.tsx` (preview → Confirm & Add N), `Lists.tsx` organize (`setOrganizePreview` → `applyOrganization`), `BulkAddSortModal.tsx` (`Step: input → sorting → review → error`), `PostMeetingReview.tsx` (editable textarea + per-item routing), `UniversalListWizard.tsx`, `RoutineBuilderWizard.tsx`, `BulkAddWithFrequency.tsx`. No caller persists `ai-parse` output without a review surface. `useSuggestListTags` returns tags as suggestions; caller decides application. |
| 8 | **curriculum-parse** | [CurriculumParseModal.tsx](../src/components/studio/CurriculumParseModal.tsx) invoked from [SequentialCreator.tsx](../src/components/tasks/sequential/SequentialCreator.tsx) | `sequential_collections` + `tasks` rows | **Wired (inline)** | Paste → `curriculum-parse` → preview → `handleAccept` (user-triggered only) → items cached, user can manually edit textarea to clear. [CurriculumParseModal.tsx:156](../src/components/studio/CurriculumParseModal.tsx#L156) |
| 9 | **MindSweep classification — `always_ask` mode** | [useMindSweep.ts](../src/hooks/useMindSweep.ts) | `studio_queue` (reviewed via Queue Modal Sort tab) | **Wired (deferred review)** | `always_ask` is the default `aggressiveness` mode ([useMindSweep.ts:329-330](../src/hooks/useMindSweep.ts#L329-L330)). All items route to `studio_queue` for human sort before final commit. |
| 10 | **MindSweep classification — `trust_obvious` / `full_autopilot` modes** | Same hook | Direct inserts into `journal_entries`, `victories`, `guiding_stars`, `best_intentions`, `self_knowledge`, plus `studio_queue` for task/list/calendar | **BYPASSED (user opt-in)** | `routeDirectly` path writes AI-classified content directly to persistent tables without HITM when aggressiveness is not `always_ask`. [useMindSweep.ts:322-400](../src/hooks/useMindSweep.ts#L322-L400). Auto-routing is explicit user opt-in (mom sets aggressiveness in `mindsweep_settings`), so this is a consent-based HITM bypass — but it IS a bypass and worth founder awareness. |
| 11 | **Cyrano draft** (`cyrano` guided mode) | [ToolConversationModal.tsx](../src/components/lila/ToolConversationModal.tsx) with `DRAFT_TOOLS` set | `communication_drafts` (via Save Draft action chip) | **Wired (inline)** | Draft persists ONLY when user clicks `Save Draft` ActionChip ([ToolConversationModal.tsx:1031](../src/components/lila/ToolConversationModal.tsx#L1031)). LilaMessageBubble also renders the actual `HumanInTheMix` component on the latest assistant message with Regenerate/Reject. Edit flows via "Edit in Notepad" ActionChip. |
| 12 | **Higgins Say** | Same modal, `DRAFT_TOOLS` member | `communication_drafts` + optional Task | **Wired (inline)** | Same flow as Cyrano. `Save Draft` is explicit user action. |
| 13 | **Higgins Navigate** | Same modal, `TASK_TOOLS` + `JOURNAL_TOOLS` member | `tasks` / `journal_entries` on user action | **Wired (inline)** | User clicks `Create Task` / `Save to Journal` ActionChip to persist. HumanInTheMix component renders via LilaMessageBubble. |
| 14 | **Meeting AI summary (PostMeetingReview)** | [PostMeetingReview.tsx](../src/components/meetings/PostMeetingReview.tsx) | `meetings.summary`, action items → `studio_queue`, journal entry with `entry_type='meeting_notes'` | **Wired (inline)** | AI-generated summary populates editable textarea with `Regenerate` button ([PostMeetingReview.tsx:255-262](../src/components/meetings/PostMeetingReview.tsx#L255-L262)). User must click `Save & Close` to persist. Per-action-item review with Route/Skip/Edit-assignee. Summary persistence NOT automatic — the CLAUDE.md #239 "auto-save to journal" refers to the Save & Close action, which is explicitly user-triggered; the `completeMeeting` helper is called only inside `handleSave`. |
| 15 | **Auto-title (Notepad tabs)** | [useNotepad.ts useAutoTitle](../src/hooks/useNotepad.ts#L295-L324) | `notepad_tabs.title` | **BYPASSED (fire-and-forget)** | Haiku-generated title writes to `notepad_tabs.title` directly once content > 30 chars, no user review. User can edit after the fact, but there is no pre-commit review. Per orchestrator scope clarification, titles may be exempt similarly to chat messages (8a-CL-39 reasoning). Flagged for founder acknowledgment. |
| 16 | **Auto-title (message threads)** | `auto-title-thread` Edge Function called from [ChatThreadView.tsx](../src/components/messaging/ChatThreadView.tsx) | `conversation_threads.title` | **BYPASSED (fire-and-forget)** | Same pattern as #15. Per CLAUDE.md #148: "auto-titles conversation threads after the first reply … fire-and-forget". Titles are editable after the fact. Same scope question. |
| 17 | **Task Breaker image mode** (duplicate of #2 for completeness) | Same component | Same | **Wired** | See #2. |
| 18 | **ThoughtSift Translator** | [TranslatorModal.tsx](../src/components/lila/TranslatorModal.tsx) | `lila_messages` (conversation history) only | **Wired (copy-on-demand)** | Rewritten text is displayed to user who must explicitly click Copy to use it elsewhere. No persistence to user-record tables; only to `lila_messages` conversation log. HITM-equivalent: the user decides what to do with the output. Per 8a-CL-39 scope, `lila_messages` storage is exempt. |
| 19 | **BookShelf — extract-insights pipeline (initial book processing)** | `bookshelf-extract` Edge Function | `bookshelf_declarations`, `bookshelf_insights`, `bookshelf_action_steps`, `bookshelf_questions`, `bookshelf_summaries` + mirrored into `platform_intelligence.book_extractions` | **BYPASSED (auto-persists at book-upload time)** | Book extractions are inserted directly into 6+ persistent tables by `bookshelf-extract` after mom uploads a book — no per-item HITM before commit ([supabase/functions/bookshelf-extract/index.ts:258-322](../supabase/functions/bookshelf-extract/index.ts#L258-L322)). Mom reviews **after** persistence via BookShelf UI (Heart, hide, Apply This → Guiding Stars / Tasks / Prompts). The Apply This routing (#20) IS HITM-equivalent but the underlying extraction table auto-persists. |
| 20 | **BookShelf — Apply This routing** (declarations → Guiding Stars, action steps → Tasks, questions → Journal Prompts) | [extractionActions.ts](../src/lib/extractionActions.ts) invoked from [DeclarationItem.tsx](../src/components/bookshelf/items/DeclarationItem.tsx), [ActionStepItem.tsx](../src/components/bookshelf/items/ActionStepItem.tsx), [QuestionItem.tsx](../src/components/bookshelf/items/QuestionItem.tsx) | `guiding_stars`, `tasks`, `journal_prompts` | **Wired (inline)** | Per-item user-initiated action (click Apply This → select destination). Idempotent via source_reference_id. |
| 21 | **BookShelf — Study Guide (`bookshelf-study-guide`)** | [StudyGuideModal.tsx](../src/components/bookshelf/StudyGuideModal.tsx) | `platform_intelligence.book_extractions` (inserted via RPC) | **BYPASSED (auto-persists on Generate)** | Mom picks child + detail level + clicks Generate → AI generates study guide items → `insert_book_extractions_study_guide` RPC persists directly, no preview ([supabase/functions/bookshelf-study-guide/index.ts:293-306](../supabase/functions/bookshelf-study-guide/index.ts#L293-L306)). Same as #19: review happens post-hoc via heart/hide. |
| 22 | **Extract Insights (InnerWorkings file upload)** | [InnerWorkings.tsx](../src/pages/InnerWorkings.tsx) → `extract-insights` Edge Function | `self_knowledge` | **Wired (inline)** | Upload → Review Extracted Insights phase with per-insight toggle, edit text, edit category, Cancel, `Save N Entries`. [InnerWorkings.tsx:585-653](../src/pages/InnerWorkings.tsx#L585-L653) |
| 23 | **Smart List Import (OCR from receipt / image)** | [SmartImportModal.tsx](../src/components/lists/SmartImportModal.tsx) → `smart-list-import` | `lists` + `list_items` | **Wired (inline)** | `phase: input → classifying → review → committing → done`. Per-item review. Component doc header says "Mom reviews per-item assignments, overrides as needed". [SmartImportModal.tsx:7](../src/components/lists/SmartImportModal.tsx#L7), [:74](../src/components/lists/SmartImportModal.tsx#L74) |
| 24 | **MindSweep image scan (`mindsweep-scan`)** | [ListImageImportModal.tsx](../src/components/lists/ListImageImportModal.tsx) | `lists` + `list_items` | **Wired (inline)** | `phase: capture → scanning → review → adding`. [ListImageImportModal.tsx:84](../src/components/lists/ListImageImportModal.tsx#L84) |
| 25 | **Homework time estimate (`homework-estimate`)** | [LogLearningModal.tsx](../src/features/financial/LogLearningModal.tsx) | `homeschool_time_logs` | **Wired (inline)** | AI estimates subjects; user taps to adjust; log is sent to mom for review ([LogLearningModal.tsx:387](../src/features/financial/LogLearningModal.tsx#L387)). Not immediate commit — enters approval flow. |
| 26 | **Victory suggestions (`scan-activity-victories`)** | [VictorySuggestions.tsx](../src/components/victories/VictorySuggestions.tsx) | `victories` | **Wired (inline)** | Per-suggestion Claim or Skip buttons. Nothing persists without explicit Claim click. [VictorySuggestions.tsx:73-92](../src/components/victories/VictorySuggestions.tsx#L73-L92) |
| 27 | **Daily Celebration AI narrative (`celebrate-victory`)** | [DailyCelebration.tsx](../src/components/victories/DailyCelebration.tsx) | `victory_celebrations` | **BYPASSED (auto-saves on Done)** | AI-generated narrative displayed; `handleDone` auto-saves with narrative if narrative exists, regardless of user approval ([DailyCelebration.tsx:180-196](../src/components/victories/DailyCelebration.tsx#L180-L196)). **No Regenerate, no Edit, no explicit Approve** — only Share-with-Mom button. Closing the modal via Done persists the narrative. Closing via X/backdrop doesn't persist (partial escape hatch). |
| 28 | **Message coaching (`message-coach`)** | [useMessageCoaching.ts](../src/hooks/useMessageCoaching.ts) | Coaching does NOT persist the message — it's a before-send gate | **N/A (by-design gate)** | Per CLAUDE.md #139: "before-send checkpoint, never a blocker". Returns guidance; user clicks Edit or Send Anyway. Not persistence-bound. |
| 29 | **Board of Directors persona generation** | [BoardOfDirectorsModal.tsx](../src/components/lila/BoardOfDirectorsModal.tsx) + `lila-board-of-directors` Edge Function | `board_personas` (persona created once, cached per CLAUDE.md #99), `board_session_personas` | **Wired (by pipeline caching)** | Persona generation is cached — one generation per name, amortized across all users. Generation is internal; the user-facing output is the advisor's in-conversation response, which goes through HumanInTheMix via LilaMessageBubble. `board_personas` content represents the persona definition, not the user's personal record. |
| 30 | **LiLa conversation messages (every guided tool)** | [ToolConversationModal.tsx](../src/components/lila/ToolConversationModal.tsx), [lila-chat](../supabase/functions/lila-chat/index.ts) | `lila_messages` | **Wired (via LilaMessageBubble + 8a-CL-39 exemption)** | HumanInTheMix component renders on the latest assistant message. Chat messages are scope-exempt per 8a-CL-39 anyway. Regenerate/Reject are wired ([LilaMessageBubble.tsx:147-159](../src/components/lila/LilaMessageBubble.tsx#L147-L159)). |

### Count
- **Wired (inline or via shared component):** 22
- **Wired (deferred review via studio_queue):** 1 (MindSweep default mode)
- **N/A (unbuilt / out of scope):** 3 (`craft_with_lila` stub, message-coach by-design gate, persona caching)
- **BYPASSED:** 5
  - MindSweep opt-in auto-routing modes (`trust_obvious`, `full_autopilot`) — user-consented bypass
  - Auto-title Notepad tabs — fire-and-forget (orchestrator flagged as scope question)
  - Auto-title message threads — fire-and-forget (same)
  - BookShelf extract-insights pipeline — auto-persists on book upload
  - BookShelf study-guide — auto-persists on Generate click
  - DailyCelebration narrative — auto-persists on Done click, no Edit/Regenerate/Reject UI

### Interpretation
Feature-by-feature coverage is high: most persistence-bound AI outputs have Edit/Approve/Regenerate/Reject semantics, even if the shared `HumanInTheMix` component isn't imported (they re-invent the pattern inline). **The pattern is followed in spirit across the platform.**

But there are **five real bypass surfaces** where AI output reaches a persistent table without any pre-commit human review:

1. **MindSweep auto-routing** (user opt-in). Documented as intentional design per CLAUDE.md. Still, in `full_autopilot` a voice capture turns into a Guiding Star / Best Intention / self_knowledge / victory / journal_entry with zero UI checkpoint. Founder may want a "one-tap undo" visible on the `mindsweep_events` dashboard, but the current behavior is by-design.

2. **Auto-titles (Notepad and message threads)** are fire-and-forget. Orchestrator scope clarification suggests these may fall under the 8a-CL-39 chat-exempt class; founder sign-off required.

3. **BookShelf extraction pipeline** persists AI-generated declarations/insights/action-steps/questions/summaries into 6+ tables immediately on book upload. Review is post-hoc (heart/hide/Apply This). Convention #4's "before persisting" is NOT satisfied here — though the tables feel more like a library index than a user record.

4. **BookShelf study guide** persists on Generate click. Same pattern as #3.

5. **DailyCelebration narrative** auto-saves AI narrative on Done click. No Regenerate button, no Edit button. This is the sharpest HITM violation in the evidence: the AI-generated celebration narrative becomes a permanent row in `victory_celebrations` every time a child completes the flow, with no edit path.

**Verdict: PARTIAL** — HITM is applied almost everywhere, but five specific surfaces bypass it. Whether each is a violation or an accepted design decision needs founder ruling. For beta-readiness: #5 (DailyCelebration) is most likely worth fixing before general release since it affects children's records; #1-2 are explicit opt-in/exempt patterns; #3-4 are catalog-style surfaces where post-hoc review might be acceptable.

---

## 8a-CL-39 — LiLa chat exempt from HITM

Deferred to founder acknowledgment. Not a worker verdict.

**Worker note:** Current implementation matches the stated design intent. LilaMessageBubble renders the `HumanInTheMix` component on chat assistant messages (Regenerate / Reject wired, Edit routes to Notepad, Approve is a no-op) — so the platform actually over-delivers: chat gets HITM even though the inventory says it's not required. If founder wants to clean this up, the `hideHumanInTheMix` prop on LilaMessageBubble could be set true for genuinely conversational modes (help/assist/general) and false for tool modes that produce drafts (Cyrano, Higgins Say) — though that opens a UX-consistency question.

---

## 8a-CL-40 — Embeddings exempt from HITM

Deferred to founder acknowledgment. Not a worker verdict.

**Worker note:** Embeddings are generated via the async pgmq → `embed` Edge Function pipeline (OpenAI text-embedding-3-small). No user-facing text output; stored as `halfvec(1536)` alongside source content. HITM is structurally inapplicable — there is nothing human-reviewable in a 1536-dim vector. Confirmed design intent.

---

## Unexpected findings

These are AI-persistence surfaces discovered during the sweep that were NOT on the orchestrator's feature list AND that appear to skip or partially skip HITM. Each may warrant its own audit finding.

1. **DailyCelebration narrative auto-save** (`supabase/functions/celebrate-victory`, persisted via `saveCelebrationMutation` in [DailyCelebration.tsx:180-196](../src/components/victories/DailyCelebration.tsx#L180-L196)). **No Regenerate button, no Edit textarea.** User's only HITM-equivalent option is "don't click Done" — but that also means their celebration isn't saved. This is the sharpest HITM miss in the codebase and affects Daily Celebration for every shell including children.

2. **BookShelf extraction pipeline** (`supabase/functions/bookshelf-extract`, `bookshelf-study-guide`, `bookshelf-key-points`, `bookshelf-process`). These auto-persist AI-generated content into `bookshelf_summaries`, `bookshelf_insights`, `bookshelf_declarations`, `bookshelf_action_steps`, `bookshelf_questions`, and the platform-intelligence mirror, with no per-item review before commit. Review happens post-hoc in the BookShelf UI via Heart/Hide/Apply This. PRD-23 may explicitly intend this as "library indexing" not "user record" — but it merits founder scope confirmation, especially since `is_included_in_ai` is true by default (meaning LiLa consumes these extractions as context without any pre-commit human vetting).

3. **Auto-titles (Notepad and message threads)** — fire-and-forget Haiku title generation writes to `notepad_tabs.title` and `conversation_threads.title` with no review. Edit-after-the-fact is possible. Orchestrator scope clarification notes these may be exempt similarly to chat, but the founder has not yet signed off on that exemption. Flagging explicitly.

4. **MindSweep `trust_obvious` and `full_autopilot` aggressiveness modes** auto-route items from voice/text/email input directly into persistent feature tables (`guiding_stars`, `best_intentions`, `self_knowledge`, `journal_entries`, `victories`) with no HITM. This is documented as intentional (user opt-in via mindsweep_settings), and `always_ask` is the default mode. However, the default is per-family/per-member — if mom flips to autopilot for convenience, every subsequent MindSweep output commits without review. There is no audit trail that distinguishes "AI-classified → auto-routed" from "AI-classified → mom approved" after the fact; the source column is the same either way (`source='manual'` for direct-routed journal/victory/guiding_stars items, per [useMindSweep.ts:374-399](../src/hooks/useMindSweep.ts#L374-L399) — not even `source='mindsweep_auto'`). This makes post-hoc audit impossible.

5. **HITM component reuse count = 1** despite the conventions file specifying it as a reusable component. Every other feature re-implements the pattern. This is an API hygiene issue more than a compliance issue — the pattern is applied — but a future refactor pass could consolidate them. Current inconsistency means UI treatment of HITM buttons varies across features (Task Breaker has `Apply N Steps` + `Retry` + `Cancel`; BulkAddWithAI has `Save Selected (N)` + `Back`; PostMeetingReview has `Save & Close` + `Regenerate` + `Cancel`; Review & Route has `Route All` + `Skip` + `Edit in Notepad`; only LilaMessageBubble shows the literal `Edit / Approve / Regenerate / Reject` four-button row). Mom learns four different flows instead of one.

6. **LiLa message respond is explicit-invoke only, not automatic** — confirmed per CLAUDE.md #138, not a finding. Called out here to prevent it being flagged as a bypass in a later sweep.

7. **Message coaching** (`message-coach`) is a before-send gate, not persistent AI output — N/A for HITM by design. Called out here to prevent false-flag later.

---

## Notes for the orchestrator

- Total feature surfaces checked: 30 (the 14 in the orchestrator prompt plus 16 additional AI-persistence paths found during the sweep).
- 8a-CL-37 verdict PARTIAL because component exists but reuse = 1; depending on how strictly the orchestrator interprets "reusable," this could reasonably be called FAIL (only used in the scope-exempt chat path) or PASS (the component satisfies its API contract and is technically importable elsewhere). Worker leans PARTIAL.
- 8a-CL-38 verdict PARTIAL because most features comply in spirit but five specific surfaces bypass HITM. Of those five, the DailyCelebration narrative is the highest-risk (children, auto-commit, no Edit/Regenerate at all). The two auto-title surfaces are the lowest-risk and most likely acceptable per 8a-CL-39 reasoning.
- Recommend founder scope confirmation on: (a) BookShelf extraction tables as "library index" vs "user record" — this unblocks the two biggest BYPASSED surfaces; (b) auto-titles as chat-adjacent-exempt vs HITM-required — this unblocks two more; (c) whether MindSweep autopilot's identical-to-manual `source='manual'` column is acceptable post-hoc audit behavior, or whether a `source='mindsweep_auto'` tag should also land on journal/victory/guiding_stars/best_intentions/self_knowledge direct inserts the way it already does on `studio_queue` rows.
- If 8a-CL-38 is held to strict-Blocking standard per the severity table, the DailyCelebration narrative auto-save alone is enough to trip a Blocking finding; the others become High/Medium depending on founder scope calls.
- No code changes made. No files modified other than this evidence report.
