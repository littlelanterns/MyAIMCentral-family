---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-20
Addendum: prds/addenda/PRD-25-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-25 (source) ↔ PRD-04 (Shell routing — bottom nav), PRD-05 (LiLa — guided_homework_help + guided_communication_coach + guided-nbt-glaze + spelling-coach), PRD-06 (Guiding Stars greeting rotation + Best Intentions child creation), PRD-08 (Write drawer Notepad + Send To grid), PRD-09A (Tasks — Active Tasks section + task point values), PRD-11 (Victory Recorder — bottom nav tab + DailyCelebration Step 2.5), PRD-14 (Personal Dashboard — shared section framework), PRD-14D (Family Best Intentions), PRD-15 (Messaging — in-drawer Messages + unread badge + before-send coaching), PRD-16 (Meetings — "Things to Talk About" capture), PRD-18 (Rhythms — morning/evening render position per Convention #179), PRD-24 (Gamification — header indicators + NBT reward language)
Provenance: Worker `ac6c9df4bcd8d137a` (Opus, report-only mode) ran full evidence pass across addendum (171L) + full PRD-25 (749L) + GuidedDashboard.tsx (243L) + useGuidedDashboardConfig.ts + useNBTEngine.ts (228L) + guided-nbt-glaze Edge Function (102L) + spelling-coach Edge Function (60L) + WriteDrawer + WriteDrawerNotepad + WriteDrawerMessages + WriteDrawerReflections + SendToGrid + SpellCheckOverlay + useSpellCheckCoaching + GuidedBestIntentionsSection + CelebrateSection + DailyCelebration + GuidedShell (607L) + GuidedManagementScreen + GuidedActiveTasksSection + types/guided-dashboard.ts + migration 00000000100077_prd25_guided_dashboard.sql + migration 00000000000013_lila_schema_remediation.sql. Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Walked the PRD-25 Guided Dashboard integration surface end-to-end. Identified 14 integration seams collapsing to **5 SCOPE-3 findings + 1 SCOPE-8b finding** plus 2 cross-addendum contributions. The most load-bearing finding is that **DailyCelebration Step 2.5 Reflections is an architectural ghost** — `reflectionsEnabled` prop is accepted (line 25) and immediately destructured as `_reflectionsEnabled` (line 37, underscore-prefixed = intentionally unused). The component never renders the Reflections step. Worse, `CelebrateSection` doesn't even read `preferences.reflections_in_celebration` to pass it — so even if DailyCelebration implemented Step 2.5, the wire is missing. This affects PRD-11, PRD-18, and the PRD-25 addendum L39-49's entire contract. The **guided-nbt-glaze Edge Function lacks `authenticateRequest`** — only `spelling-coach` has it — meaning a Guided child's NBT "encouraging sentence" can be generated for ANY family_id/member_id an attacker supplies in the body, and `logAICost` will attribute consumption to that arbitrary family. That's a SCOPE-8b contributor to the same authentication-bypass pattern PRD-17B/PRD-18 surfaced. The **bottom nav is missing Victories as a primary tab** — PRD-25 Screen 1 L119 and Convention #124 both require Home/Tasks/Write/Victories/Progress, but code is Home/Tasks/Write/Progress/More with Victories buried in the More menu. The **Messages tab in the Write Drawer is "bounce to /messages"** rather than the inline Messages + before-send coaching specified in addendum L74-77. Positive surprises: spell-check coaching 3-tier lookup works exactly per Convention #130; NBT priority engine matches the spec; Best Intentions child-creation is wired.

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | Bottom nav rename Journal → Write + 5 items | Addendum §PRD-04 L9-21 + Convention #124: "Home \| Tasks \| Write \| Victories \| Progress" | `GuidedShell.tsx:27-32` `routeNavItems = [Home, Tasks, Progress]` — only 3. Write inserted at idx 1. **Victories is MISSING from bottom nav.** It lives in `GUIDED_MORE_SECTIONS` under "Capture & Reflect". Actual bottom nav is: Home / Tasks / Write / Progress / More. | Unintentional-Fix-Code | **SCOPE-3** Medium | N |
| 2 | Write drawer opens from bottom-nav button, slides right, 3 tabs | Addendum §PRD-04 L15-17 + §PRD-08 L26-34 + Convention #125 | `WriteDrawer.tsx:91-199` implements right-slide drawer with 3 tabs. Reflections tab hidden when `!preferences.reflections_in_drawer`. `WriteNavButton` opens drawer. Header trigger also exists. ✓ | Documented (no finding) | — | — |
| 3 | "Send To..." routing grid with 3 destinations per addendum — 4 per Convention #131 | Addendum §PRD-08 L28-29 vs Convention #131 | `SendToGrid.tsx:151-156` has 4 destinations. **Message is disabled with description "Coming soon!"**. PRD-15 IS built — disabling the message destination dead-ends the child's "Send message from notepad" flow. | Unintentional-Fix-Code | **SCOPE-3** Medium | N |
| 4 | **DailyCelebration Step 2.5 Reflections insertion (mom-enabled)** | Addendum §PRD-11 L38-49 + PRD-25 Screen 6 L340-361 + Convention #123-#126 | `DailyCelebration.tsx:24-25` declares `reflectionsEnabled?: boolean`. **Line 37:** `reflectionsEnabled: _reflectionsEnabled,` — destructured with underscore prefix, never referenced. Line 28: `type CelebrationStep = 'opener' \| 'victories' \| 'streak' \| 'theme' \| 'close'` — NO `reflection` step type. **Step 2.5 does not exist in code.** `CelebrateSection.tsx:50-57` launches DailyCelebration WITHOUT passing `reflectionsEnabled` — even if Step 2.5 were implemented, the wire is dead. `reflections_in_celebration` preference is settable but has no downstream consumer. | Unintentional-Fix-Code | **SCOPE-3** High | N (founder decision: the preference is user-visible as a toggle that does nothing) |
| 5 | **Messages tab renders conversation spaces + compose + before-send coaching IN drawer** | Addendum §PRD-15 L70-78 | `WriteDrawerMessages.tsx:19-76` is a "bounce to /messages" redirect card. Comment at L11: "Future work: render a lightweight inline thread list + compose here instead of bouncing to /messages." **No inline message UI, no compose, no before-send coaching wired within the drawer.** | Unintentional-Fix-Code | **SCOPE-3** Medium | N |
| 6 | **Unread message badge on "Write" bottom nav item** | Addendum §PRD-15 L72 | `GuidedShell.tsx:581` `const unreadCount = 0` — **hardcoded to zero** with comment "Unread message badge placeholder — wired when PRD-15 is built." PRD-15 IS built. `useUnreadNotificationCount` exists and is used in WriteDrawerMessages but is NOT called by GuidedShell's WriteNavButton. | Unintentional-Fix-Code | **SCOPE-3** Low | N |
| 7 | **`guided-nbt-glaze` Edge Function authentication** | Addendum §PRD-05 L122-133 + CLAUDE.md Convention #55-#61 | `supabase/functions/guided-nbt-glaze/index.ts:35-102` does NOT call `authenticateRequest`. **No `Authorization` header check.** Body accepts `family_id`/`member_id` as trusted inputs for `logAICost` attribution with no verification that caller's `auth.uid()` has membership. Contrast: `spelling-coach/index.ts:39-41` has `await authenticateRequest(req)` as first action. Same SECURITY DEFINER-without-auth-check pattern shape as PRD-17B seam #6 and PRD-18 seam #7. Haiku costs get logged to arbitrary families; mode output is brief encouraging text (cost-attribution + unlimited-query-amplification rather than data exfiltration). | Unintentional-Fix-Code | **SCOPE-8b** primary + SCOPE-3 cross-ref | **Y** |
| 8 | LiLa guided modes gated by feature_key | Addendum §PRD-05 L122-133 + PRD-25 Screen 5 L326-331 | Migration `00000000000013_lila_schema_remediation.sql:178-181` seeds both `guided_homework_help` and `guided_communication_coach` mode rows with `requires_feature_key = 'safe_harbor_guided'`. **This is the wrong gate.** Safe Harbor Guided is an independent feature for emotional processing, NOT the homework help gate. Mom's toggle `preferences.lila_homework_enabled` / `preferences.lila_communication_coach_enabled` is the ONLY runtime gate. | Unintentional-Fix-Code | **SCOPE-3** Medium (touches permission-gate wiring) | N |
| 9 | Best Intentions for Guided members (personal + family w/ badge + child creation) | Addendum §PRD-18 L86-93 + Conventions #127-#128 | `GuidedBestIntentionsSection.tsx:26-145` renders intentions with `iteration_count`, tap-to-celebrate logs via `useLogIteration`. Family intention badge (L108-119) shows "Family" pill when `intention.related_member_ids?.length > 0` — but this is a proxy; PRD-14D addendum uses `family_best_intentions` table, not `best_intentions.related_member_ids`. **Family Best Intentions from `family_best_intentions` table are NOT rendered.** Child creation wired. ✓ for personal + child creation; GAP for Family Best Intentions source table not consumed. | Unintentional-Fix-Code | **SCOPE-3** Low | N |
| 10 | Gamification disable → header indicators hidden, point values hidden, DailyCelebration Step 4 skipped, NBT reward language suppressed | Addendum §PRD-24 L110-118 + PRD-25 Edge Cases L551-556 | **Header indicators:** `GuidedGreetingSection.tsx:109-118` gates on `points > 0 && streak > 0`, NOT on `gamification_configs.enabled`. **Task point values:** `GuidedActiveTasksSection.tsx:217-224` renders `task.points_override` unconditionally. **DailyCelebration Step 4 (theme):** Already permanently skipped. **NBT reward language suppression:** `guided-nbt-glaze` doesn't check gamification_configs. The per-member behavior contract is unhonored across 4 surfaces. | Unintentional-Fix-Code | **SCOPE-3** Medium | N |
| 11 | `dashboard_configs.preferences` JSONB extended with 10 Guided-specific keys | Addendum §PRD-14 L54-65 | `src/types/guided-dashboard.ts:35-51` defines **14 keys** (4 EXTRA). All 10 addendum-spec keys present. The 4 extras are useful additions. | Documented (no finding) | — | — |
| 12 | New section keys `'next_best_thing'` + `'celebrate'` added | Addendum §PRD-14 L56-62 + Convention #122 (7 keys) | `GUIDED_SECTION_KEYS` has **8 keys including `things_to_talk_about`** — not in Convention #122, not in PRD-25 Screen 1 defaults, not in addendum. Added as a PRD-16 Meetings cross-feature entry point. Convention list is stale. | Unintentional-Fix-PRD | **SCOPE-3** Low | N |
| 13 | Sections that cannot be hidden: 2 per PRD-25 vs 3 per Convention #123 | PRD-25 Screen 1 L182 — 2 unhideable. Convention #123 — 3 unhideable. | `GUIDED_UNHIDEABLE_SECTIONS` lists all 3: greeting, next_best_thing, best_intentions. Code follows Convention #123. | Unintentional-Fix-PRD | **SCOPE-3** Low | N |
| 14 | Greeting header uses Guiding Stars rotation | PRD-25 Screen 1 L125-126 | `GuidedGreetingSection.tsx:32-46` queries Guiding Stars filtered by `is_included_in_ai=true`. Rotation logic included. Same pattern as PRD-14 Dashboard.tsx. ✓ | Documented (no finding) | — | — |

## Unexpected findings list (seams not covered in addendum)

1. **`GuidedThingsToTalkAboutSection` writes to PRD-16 `meeting_agenda_items` from the Guided dashboard.** Not in the PRD-25 addendum. Section writes with `suggested_by_guided=true`, `source='quick_add'`. Working correctly but architecturally invisible to the addendum.

2. **`ColorRevealTallyWidget` rendered in GuidedDashboard** — Build M Phase 5 cross-wire from PRD-24/PRD-26 gamification into Guided. Not in PRD-25 addendum.

3. **`RhythmDashboardCard` rendered at position 0** for morning + evening rhythms. Per Convention #179 this is expected, but PRD-25 Cross-PRD addendum doesn't mention rhythms wiring.

4. **`GuidedShell` header has a Write icon AND bottom nav has Write tab** — dual-entry is fine but means PRD-25 addendum L15 ("Right-edge pull tab remains available as a secondary trigger on tablet/desktop") is arguably unhonored.

5. **Best Intentions tap logs an `intention_iteration` but does NOT fire auto-victory** despite Convention #AIR pattern.

6. **`nbt_last_suggestion_index` preference exists in type but `useNBTEngine` tracks index in local React `useState`**, not persisted. The preference is dead-code.

## Proposed consolidation

### §5.1 within-addendum consolidation

- Seams #4, #5, #6 + #3 are all variants of "addendum-promised integration shipped as scaffolding/placeholder." Consolidate to **one SCOPE-3 finding**: "PRD-25 cross-feature integrations ship as UI-visible placeholders — mom's management toggles write preferences that no downstream code consumes."
- Seam #1 stands alone — user-visible navigation defect.
- Seam #7 stays standalone as SCOPE-8b.
- Seam #8 stands alone — permission-gate wiring defect.
- Seam #10 — consolidate to one finding covering all four gamification-disable surfaces.
- Seams #12 + #13 — one combined Unintentional-Fix-PRD finding.

After §5.1: **4 SCOPE-3 findings + 1 SCOPE-8b finding** (within-PRD-25), **1 Unintentional-Fix-PRD doc-update**.

### §5.2 cross-addendum candidates

**A. Embedding/AI-Edge-Function authorization-bypass pattern — PRD-25 contributes 3rd data point.**

| Surface | Evidence file | Confirmation |
|---|---|---|
| PRD-17B (`classify_by_embedding`) | `EVIDENCE_prd17b-cross-prd-impact.md` seam #6 | Confirmed |
| PRD-18 (`match_book_extractions`) | `EVIDENCE_prd18-cross-prd-impact.md` seam #7 | Confirmed |
| **PRD-25 (`guided-nbt-glaze`)** | this file, seam #7 | **Confirmed — NO `authenticateRequest`, trusts body-supplied `family_id`/`member_id`** |

**Threshold MET.** Escalate to: "AI Edge Functions and SECURITY DEFINER RPCs trust caller-supplied family_id/member_id without verifying auth.uid() membership." Note: PRD-25's variant is slightly less critical (cost amplification + attribution hijack rather than data exfiltration).

**B. Addendum-promised-but-dead-wire pattern.** PRD-18 flagged 4 wirings shipped as scaffolding; PRD-25 contributes 3 more (Step 2.5 Reflections, in-drawer Messages, Write unread badge). **7+ wirings across 2 addenda** — worth elevating if a 3rd addendum confirms.

## Proposed finding split

- **SCOPE-8b primary (Beta Y): 1** — guided-nbt-glaze missing authenticateRequest (seam #7). Cross-refs PRD-17B + PRD-18 into §5.2 consolidated finding.
- **SCOPE-3 consolidated: 1** — Mom-facing Guided preferences have UI toggles but dead wires downstream (seams #4, #5, #6, plus #3 Message dead-end).
- **SCOPE-3 standalone: 3**
  - **F-A Bottom nav missing Victories** (seam #1).
  - **F-B Wrong feature_key gate on Guided LiLa modes** (seam #8).
  - **F-C Gamification-disable behavior unimplemented across 4 surfaces** (seam #10).
- **SCOPE-3 Unintentional-Fix-PRD: 1** — Convention #122 section-key list stale (seam #12) + Convention #123 unhideable-set drift (seam #13).
- **Cross-addendum contributions: 1** (seam #7).
- **Documented (no finding): 5** (seams #2, #9 partial positive, #11, #14).

Total: **1 SCOPE-8b + 4 SCOPE-3 within-PRD + 1 doc-update + 1 cross-addendum contribution** = 5 PRD-25-attributed findings + 1 cross-pattern contributor.

## Beta Y candidates

**1** — SCOPE-8b authentication-bypass on `guided-nbt-glaze`. By itself this is cost-amplification rather than data leak; combined with cross-addendum pattern from PRD-17B/PRD-18, the systemic "Edge Functions trust body-supplied family_id" issue is beta-blocking for multi-family cost accounting.

Seam #4 (DailyCelebration Step 2.5 placebo) is close to Y-territory because mom's "In evening celebration" toggle is actively misleading. Worker flags for founder consideration at walk-through.

## Top 3 surprises

1. **`DailyCelebration` component accepts `reflectionsEnabled?: boolean` and uses `_reflectionsEnabled` destructuring.** The whole Step 2.5 Reflections story hits a hard stop at one line. Most inert cross-PRD wire in the evidence pass so far.

2. **`guided-nbt-glaze` has no auth check while its sibling `spelling-coach` does.** Both ship in PRD-25 Phase B. Both take free-form user content from a kid-facing UI. The pattern is so close to cut-and-paste that this feels like a single-Edge-Function miss.

3. **The Guided bottom nav says Home / Tasks / Write / Progress / More when PRD-25 and Convention #124 both say Home / Tasks / Write / Victories / Progress.** Victories is THE most celebrated feature in the Guided experience per PRD-25's own framing — and the nav doesn't give it a primary tab.

## Watch-flag hits

- **F11 server-side enforcement:** **Direct hit — seam #7.** `guided-nbt-glaze` has no `authenticateRequest`. Third data point in embedding/AI-Edge-Function authorization pattern (§5.2 threshold met).
- **Crisis Override duplication:** N/A — `guided-nbt-glaze` generates short encouragement text only. If the addendum's future "LiLa Homework Help" + "Communication Coach" modal integrations ever land they WILL need crisis override — currently unbuilt.
- **F17 messaging behavior-vs-intent:** **Hit — seams #5 + #6.** In-drawer Messages tab + before-send coaching contract not met; Write unread badge hardcoded 0.
- **F22+F23 (reports/archive):** N/A.
- **studio_queue source discipline:** **Confirmed N/A for this surface.**
- **`is_included_in_ai` three-tier propagation:** **Partial hit.** `GuidedGreetingSection` queries Guiding Stars filtered by `is_included_in_ai=true` ✓. Best Intentions iteration doesn't filter by `is_included_in_ai`. Low-severity gap; adults follow the same pattern.

## Orchestrator adjudication

(empty — pending walk-through)
