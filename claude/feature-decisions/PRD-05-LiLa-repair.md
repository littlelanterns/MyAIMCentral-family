# Feature Decision File: PRD-05 Repair — LiLa Core AI System

> **Created:** 2026-03-25
> **PRD:** `prds/PRD-05-LiLa-Core-AI-System.md`
> **Addenda read:**
>   - `prds/addenda/PRD-05-Planning-Decisions-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
>   - `prds/addenda/PRD-22-Cross-PRD-Impact-Addendum.md`
> **Founder approved:** pending

---

## What Is Being Built

Repair session for the existing LiLa Core AI System (PRD-05). Fixes 4 critical partial implementations (Regenerate/Reject in drawer, context snapshot saving, page_context) and builds 7 missing features (person selector, mom conversation visibility, swipe/long-press in history, refresh context button, empty-context acknowledgment, mode conflict dialog, mobile floating buttons).

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| LilaDrawer.tsx | Fix: Regenerate callback (#1), add Reject prop (#2), save context_snapshot (#3), pass page_context (#4) |
| LilaModal.tsx | Add: Person selector when mode has person_selector=true (#5) |
| LilaConversationHistory.tsx | Add: Swipe-left to delete/archive, long-press context menu (#7). Add: "Family Conversations" tab for mom (#6) |
| LilaContextSettings.tsx | Add: "Refresh Context" button when toggles change mid-conversation (#8) |
| LilaModeSwitcher.tsx / LilaDrawer.tsx | Add: Mode conflict confirmation dialog (#10) |
| MomShell.tsx | Fix: Mobile floating buttons — collapsed FAB that expands (#11) |
| Context assembly flow | Add: Empty-context acknowledgment in guided modes (#9) |

---

## Key PRD Decisions (Easy to Miss)

1. **Regenerate** deletes the assistant message, re-sends last user message with "[Please try a different approach.]" appended
2. **Reject** deletes the assistant message and invalidates the query cache
3. **context_snapshot** must be saved AFTER conversation creation — update the conversation record with assembled JSONB
4. **page_context** comes from `window.location.pathname` — passed when creating a conversation
5. **Person selector** appears when guided mode has `person_selector: true`. Sets `guided_mode_reference_id` on conversation
6. **Mom conversation visibility**: Mom can browse guided members' conversations by default. Dad/teen follow transparency settings (stubbed for now)
7. **Mode conflict**: Must show confirmation dialog before resetting conversation when switching modes mid-conversation
8. **Empty context acknowledgment**: "I don't have much context about [X] yet. I'll do my best..."
9. **Floating buttons**: PRD-05 says three floating buttons accessible on all pages. Current code has them always visible (no `hidden md:flex`). Audit says they're hidden on mobile — VERIFIED: they are NOT hidden. They render at all breakpoints. The audit finding #11 appears incorrect based on code review.

---

## Addendum Rulings

### From PRD-05-Planning-Decisions-Addendum.md:
- Three floating buttons (Help, Assist, Optimizer) are mom shell only
- Relationship tools are person-context-aware via person selector
- LiLa drawer is mom-only at MVP; others get modals
- Privacy Filtered is hard system boundary — NEVER in non-mom context

### From PRD-22-Cross-PRD-Impact-Addendum.md:
- `lila_member_preferences` stores tone/response_length/history_retention per member
- Preferences must be passed in every LiLa API call — STUB for this repair (PRD-22 full build)
- Kid fallback: no preferences → mom's defaults → system defaults (warm, balanced, forever)

### From PRD-Audit-Readiness-Addendum.md:
- No specific rulings affecting this repair — general quality habits

---

## Database Changes Required

None. All columns already exist in schema.

---

## Feature Keys

No new feature keys needed.

---

## Stubs — Do NOT Build This Phase

- [ ] Full drawer for dad/teens at Full Magic tier
- [ ] LiLa Optimizer full spec (PRD-05C)
- [ ] Context Learning auto-detection
- [ ] Long conversation summarization
- [ ] Conversation visibility transparency settings UI (PRD-22 dependency)
- [ ] lila_member_preferences integration (PRD-22 full build)
- [ ] Create Task action chip (PRD-09A dependency)
- [ ] Record Victory action chip (PRD-11 dependency)

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| LiLa drawer | → | lila_conversations.context_snapshot | JSONB update after creation |
| LiLa drawer | ← | window.location.pathname | page_context field |
| Person selector | → | lila_conversations.guided_mode_reference_id | UUID of selected member |
| Mom visibility | ← | family_members table | Filter by family_id where role = primary_parent |
| Swipe gestures | ← | useSwipeGesture hook | Existing hook in codebase |

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate
- [x] All addenda captured above
- [x] Stubs confirmed — nothing extra will be built
- [x] Schema changes correct (none needed)
- [x] Feature keys identified
- [x] **Approved to build** — 2026-03-25

---

## Post-Build PRD Verification

| Issue # | Description | Source | Status | Notes |
|---------|-------------|--------|--------|-------|
| 1 | Regenerate wired in drawer | PRD-05 §HumanInTheMix | **Wired** | Ported modal's handleRegenerate: delete msg → re-send with "[Please try a different approach.]" |
| 2 | Reject prop passed in drawer | PRD-05 §HumanInTheMix | **Wired** | Added handleReject + onReject prop to LilaMessageBubble in drawer |
| 3 | Context snapshot saved to DB | PRD-05 §Data Created | **Wired** | createContextSnapshot() result saved via supabase update after conversation creation |
| 4 | page_context passed from drawer | PRD-05 §Context Step 7 | **Wired** | useLocation().pathname passed to assembleContext() and createConversation() |
| 5 | Person selector in modal | PRD-05 §Guided Mode Registry | **Wired** | Family member chips when mode.person_selector=true, sets guided_mode_reference_id |
| 6 | Mom conversation visibility UI | PRD-05 §Visibility | **Wired** | "Family" tab in LilaConversationHistory, useFamilyConversations hook queries family_id |
| 7 | Swipe + long-press in history | PRD-05 §Screen 2 | **Wired** | useSwipeGesture for swipe-left delete/archive, 500ms long-press context menu |
| 8 | Refresh Context button | PRD-05 §Context Staleness | **Wired** | LilaContextSettings shows button after toggle change during active conversation |
| 9 | Empty-context acknowledgment | PRD-05 §Edge Cases | **Wired** | Guided modes with context_sources append acknowledgment when contextSummary='No context loaded' |
| 10 | Mode conflict dialog | PRD-05 §Mode Conflict | **Wired** | Confirmation dialog in LilaDrawer before resetting conversation on mode switch |
| 11 | Mobile floating LiLa buttons | PRD-05 §Floating Buttons | **N/A** | Audit finding incorrect — buttons already visible at all breakpoints (no hidden md:flex in code) |

### Summary
- Total requirements verified: 11
- Wired: 10
- N/A: 1 (audit finding incorrect)
- Stubbed: 0
- Missing: **0**

---

## Founder Sign-Off (Post-Build)

- [x] Verification table reviewed
- [x] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [x] Zero Missing items confirmed
- [x] **Phase approved as complete**
- **Completion date:** 2026-03-25
