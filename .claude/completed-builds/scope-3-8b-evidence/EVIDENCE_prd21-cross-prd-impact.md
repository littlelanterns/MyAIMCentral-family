---
Status: COMPLETE (worker analysis captured by orchestrator under Option B report-only protocol)
Stage: C
Scope: 3 + 8b
Opened: 2026-04-20
Addendum: prds/addenda/PRD-21-Cross-PRD-Impact-Addendum.md
Bridged PRDs: PRD-21 (source) ↔ PRD-05 (LiLa guided modes + container_preference=modal), PRD-13 (Archives — context source + veto memory + aliases), PRD-15 (Messaging — "Send via Message" integration absent), PRD-19 (private_notes + relationship_notes consumed), PRD-21A (AI Vault install path via +Add to AI Toolbox)
Provenance: Worker `a61dc14fb7a8d360b` (Opus, report-only mode) ran the full evidence pass in-memory across the addendum (127 lines) + full PRD-21 body (961 lines) + live_schema rows for `communication_drafts`, `teaching_skill_history`, `private_notes`, `relationship_notes`, `lila_tool_permissions` + migration `00000000100041_prd21_communication_tools.sql` (376L) + migration `00000000000007_lila_ai_system.sql` mode seeds for all 8 modes + migration `00000000100087_guided_model_tier_optimization.sql` + all 8 tool Edge Functions + `_shared/relationship-context.ts` (681L) + `src/components/lila/ToolConversationModal.tsx` (1080+L) + `src/components/shells/QuickTasks.tsx` + `src/components/shells/Sidebar.tsx:487` (AI Toolbox removed comment) + `src/hooks/useLila.ts:379-396` (client-side `useToolPermissions`). Worker returned structured findings as completion text per Option B protocol; orchestrator persisted verbatim.
---

## Worker cover paragraph

Walked the PRD-21 Communication & Relationship Tools integration surface end-to-end. Identified 12 integration seams collapsing to 4 distinct findings + 2 cross-addendum contributions. **Primary F11 direct hit**: `lila_tool_permissions` has **zero grep matches across `supabase/functions/`** — the permission gate the addendum promises is enforced client-side only, with service-role Edge Functions that never check. Any authenticated user can POST directly to `lila-cyrano`, `lila-higgins-navigate`, etc., bypassing mom's tool assignment entirely. **Primary HITM violation (Convention #4)**: `communication_drafts` INSERT happens in ToolConversationModal client-side with no Edit/Approve/Regenerate/Reject gate — user taps "Save Draft" and the crafted text persists immediately. This is the first PRD-21 LOOK at HITM I've walked where the draft-saving path writes to a persistent table but skips the gate. **Primary Crisis Override compliance**: all 8 tool Edge Functions do import and run `detectCrisis(content)` — strong positive. **Primary addendum-vs-code drift**: AI Toolbox sidebar section (addendum L14-18, PRD-21 L73-104 foundational UI) was explicitly removed — Sidebar.tsx L487 reads "AI Toolbox removed — tools accessible via LiLa guided mode switcher." **Send via Message action chip (addendum L77-78, PRD-21 L205/L613) does NOT exist in ToolConversationModal** — grep for "Send via Message" returns only the comment at L54 listing it as a planned chip, no implementation. **Model-tier drift** (cross-addendum pattern with PRD-19): migration 100087 set `lila_guided_modes.gratitude.model_tier = 'haiku'` but `lila-gratitude/index.ts:17` hardcodes `'anthropic/claude-sonnet-4'` — registry says haiku, runtime uses sonnet, drift invisible to cost logs. PRD-21 contributes a 7th surface to the cross-addendum source-discipline pattern: `communication_drafts.sent_via` is freeform TEXT with no CHECK despite PRD-21 L284 enumeration `'clipboard','message','external'`. Teaching skill save gap: Cyrano (L285) + Higgins Say both write to `teaching_skill_history`, but **Higgins Navigate — explicitly promised by PRD-21 L683 to track skills for skill-check threshold — never writes to the table**, meaning its `totalInteractions` count is always 0 and skill-check mode never fires for Navigate. `private_notes` + `relationship_notes` loading correctly gated by `is_included_in_ai` and role-asymmetric `applyPrivacyFilter` — the three-tier toggle is wired here (matches PRD-19 Archives reference pattern), but NO `is_safe_harbor` exclusion filter anywhere in `_shared/relationship-context.ts` (defense-in-depth gap even though relationship tools don't currently hit Safe Harbor tables).

## Per-seam two-column table

| # | Seam | Addendum spec | Code reality | Classification | Proposed finding tag | Beta default |
|---|---|---|---|---|---|---|
| 1 | **All 8 guided modes registered with `container_preference='modal'`** | Addendum L30-31 | Migration `…100041:293-298` sets `container_preference='modal'` for all 8 mode_keys. `lila_guided_modes` has 43 rows incl. all 8. Edge Function files exist 1:1 per tool. | Documented (no finding) — strong positive | — | — |
| 2 | **`communication_drafts` table created per PRD-21 schema** | Addendum L104 + PRD-21 L266-297 | Migration `…100041:172-244` creates table with all columns, CHECK constraints on `tool_mode` + `status`, 3 indexes, proper RLS (author CRUD, mom SELECT). `sent_via` freeform TEXT despite PRD L284 enumeration `'clipboard','message','external'` — cross-addendum source-discipline pattern. | Unintentional-Fix-PRD (minor enum gap) | **SCOPE-3** (contributor to source-discipline pattern) | N |
| 3 | **`teaching_skill_history` tracks ALL 3 tool modes** | Addendum L98-99 + PRD-21 L301-321 | Migration creates table with CHECK `tool_mode IN ('cyrano','higgins_say','higgins_navigate')` ✓. Grep confirms Cyrano + Higgins Say write to it. **`lila-higgins-navigate/index.ts` never INSERTs into `teaching_skill_history`** despite PRD L683 describing it as the mechanism for skill-check mode + skill rotation in Navigate. `loadRelationshipContext.totalInteractions` therefore always returns 0 for `tool_mode='higgins_navigate'`, and the skill-check threshold (5+ interactions) never fires. | Unintentional-Fix-Code (partial-wiring) | **SCOPE-3** | N (craft-first flow not affected; skill-check mode declination is graceful) |
| 4 | **`lila_tool_permissions` gates tool access per-member** | Addendum L19 + PRD-21 L69 + Convention #88 | Client-side: `useToolPermissions` hook at `src/hooks/useLila.ts:379-396` queries the table and filters UI. **Server-side: `lila_tool_permissions` has ZERO matches across `supabase/functions/`**. None of the 8 Edge Functions check caller permission before responding. Any authenticated family member can invoke any tool Edge Function via direct POST, bypassing mom's curated grant. `lila_tool_permissions` has 0 rows live (seam-adjacent confirmation of never-used). | Unintentional-Fix-Code | **SCOPE-8b** primary + **SCOPE-3** cross-ref | **Y** (direct F11 hit — permission matrix bypassable at API layer) |
| 5 | **HITM gate on AI-generated drafts (Convention #4)** | CLAUDE.md #4: "Every AI output MUST go through Human-in-the-Mix (Edit/Approve/Regenerate/Reject) before persisting." | `ToolConversationModal.tsx:598-610 handleSaveDraft` inserts directly into `communication_drafts` on user tap — no gate, no confirmation. The "Save Draft" action is treated as the persist trigger, but the crafted text was already rendered by LiLa with no user editing UI between stream-complete and DB insert. Regenerate (L557) and Reject (L586) are wired for `lila_messages` (conversation history), but NOT for `communication_drafts`. User has no path to edit LiLa's crafted text before Save Draft writes it verbatim. PRD L611 says "This is YOUR message — I just helped shape it" but the UI doesn't let them shape it before persisting. | Unintentional-Fix-Code | **SCOPE-8b** primary (HITM convention is in the 8b-canonical surfaces per PLAN §2.3) + **SCOPE-3** cross-ref | **Y** (trust-violation shape: mom thinks she edited her voice, but what persists is LiLa's voice. Also impacts PRD-15 Send via Message downstream.) |
| 6 | **AI Toolbox sidebar section for all dashboard shells** | Addendum L14-18, PRD-21 L73-104, Convention #85+#88 | `src/components/shells/Sidebar.tsx:487` — **"AI Toolbox removed — tools accessible via LiLa guided mode switcher"**. Grep for `AIToolbox` or `ai_toolbox` in shells returns only this removal comment. Tools are still accessible via QuickTasks pills, so the primary entry path works, but the Toolbox as a dedicated sidebar launcher + per-member curation view is gone. PRD-21 "What Done Looks Like" MVP item #1 unfulfilled. Also undermines PRD-21A "+Add to AI Toolbox" because the destination section doesn't render. | Unintentional-Fix-PRD (addendum+PRD drift from shipped UI decision) | **SCOPE-3** | N (QuickTasks primary entry path works) |
| 7 | **QuickTasks strip shows 3 grouped buttons** | Addendum L11-13 + PRD-21 L62-71 | `QuickTasks.tsx:121-154` wires all 3: Love Languages as `kind: 'submenu'` with 5 tool items, Cyrano as `kind: 'tool'` direct, Higgins as `kind: 'submenu'` with 2 items. Clean implementation. | Documented (no finding) — strong positive | — | — |
| 8 | **"Send via Message" action chip on Cyrano and Higgins Say** | Addendum L77-80 + PRD-21 L205-206, L613 | `ToolConversationModal.tsx:54` comment lists it as planned. `DRAFT_TOOLS` at L55, chips rendered at L1029-1036 show Save Draft + Edit in Notepad only. **No grep hit for "Send via Message" action chip anywhere in src/**. Cross-reference PRD-15 evidence seam #8 — 2nd messaging-orphan instance. | Unintentional-Fix-Code (absent integration) | **SCOPE-3** | N (workaround: Copy Draft → manually paste) |
| 9 | **Gratitude mode uses Haiku per migration 100087** | Migration 100087:5-8 downgrades `gratitude` to `model_tier = 'haiku'` | `lila_guided_modes.gratitude.model_tier` = 'haiku' (DB state). `lila-gratitude/index.ts:17` hardcodes `const MODEL = 'anthropic/claude-sonnet-4'`. **Runtime ignores registry**. Cross-addendum pattern with PRD-19 seam #8. | Unintentional-Fix-Code (model-tier drift) | **SCOPE-3** + cross-ref Scope 4 cost-pattern | N |
| 10 | **`is_included_in_ai` three-tier toggle + privacy-filter respected for Archives context** | Convention #74 + #76 | `_shared/relationship-context.ts`: person-level check at L370-375 ✓, folder-level at L378-385 ✓, item-level at L420-422 ✓ + `archived_at IS NULL` ✓ + `applyPrivacyFilter(itemsQuery, requesterIsMom)` at L424 ✓. **Private notes additionally filter `is_included_in_ai=true` at L171**. **Relationship notes also filter at L179**. Matches PRD-19 reference pattern. One defense-in-depth gap: NO `is_safe_harbor` filter anywhere, but relationship tools don't currently read `lila_conversations` or `journal_entries` so CLAUDE.md #243 isn't directly violated. | Documented (no finding) — strong positive | — | — |
| 11 | **Veto memory pattern — save negative preferences to Archives context** | Addendum L64-66 + PRD-21 L215-220 + Convention #78 | `_shared/relationship-context.ts:650-680 saveVetoItem` writes to `archive_context_items` with `is_negative_preference=true`, finds `member_root` folder, sets `added_by`, `source='lila_conversation'`. Migration `…100041:161` added `is_negative_preference` column. Clean wiring. | Documented (no finding) — strong positive | — | — |
| 12 | **Name auto-detection via `archive_member_settings.display_name_aliases`** | Addendum L85 + PRD-21 L183, L894 + Convention #79 | Migration `…100041:165` adds `display_name_aliases TEXT[]`. `relationship-context.ts:105-124` loads aliases. But: detection is passive (aliases exposed to system prompt at L584-589), not active auto-selecting of pills as PRD-21 L183 promises ("auto-selects that person's pill if not already selected"). `PersonPillSelector` grep for `auto-detect\|aliasDetect` returns nothing. | Unintentional-Fix-Code (partial-wiring) | **SCOPE-3** | N |

## Unexpected findings list

1. **`lila_tool_permissions` has 0 live rows** — no family in the live DB has ever granted a tool. Combined with seam #4 (no server enforcement) and seam #6 (Toolbox UI removed), the permission infrastructure for PRD-21 is vestigial.

2. **`ToolConversationModal.tsx` action-chip sets drift from PRD-21 spec**: PRD L207 specifies "Gifts: Copy, Edit in Notepad, Review & Route, Create Task, Add to Wishlist, Add to Gift Ideas List" — but the modal shows only Copy + Create Task. Non-trivial UX gap for the Gifts tool's primary differentiator.

3. **Veto memory prompt gate** — Edge Function system prompts instruct LiLa to offer ("Want me to remember that?") but there's no client-side UI capturing "yes" and calling `saveVetoItem`. Vetoes require manual add to Archives.

4. **`teaching_skill_history` fire-and-forget pattern swallows errors** — Cyrano L285-292 uses `.then(() => {}).catch(() => {})`. Low severity but worth noting.

5. **Higgins Navigate DOES save conversation to journal** — JOURNAL_TOOLS includes `higgins_navigate` (L61), creating `journal_entries` with `entry_type='journal_entry'`. PRD L355 says `entry_type = 'journal_entry'` — matches. ✓

## Proposed consolidation

### §5.1 within-addendum

- Seams #4 (server-side permission enforcement) and #5 (HITM gate on drafts) are the two SCOPE-8b primaries — keep separate.
- Seams #3, #6, #8, #12 are all "addendum promised, code partial/absent" of the same shape. Consolidate to one SCOPE-3 finding: **"PRD-21 promises 4 user-facing integration surfaces that shipped as scaffolding-only"**.
- Seam #2, Seam #9 — cross-addendum contributors only; don't emit standalone PRD-21 finding.

After §5.1: **2 SCOPE-8b + 1 SCOPE-3 (consolidated)** + 2 contributions to cross-addendum patterns.

### §5.2 cross-addendum candidates flagged for orchestrator review

**A. Model-tier registry-vs-runtime drift pattern — ESCALATE (2 surfaces confirmed).**

| Surface | Evidence file | Confirmation |
|---|---|---|
| PRD-19 (`family_context_interview` seeded sonnet, spec haiku) | `EVIDENCE_prd19-cross-prd-impact.md` seam #8 | Confirmed |
| **PRD-21 (`gratitude` registry haiku, runtime sonnet)** | this file, seam #9 | **Confirmed — directional opposite drift** |

Pattern name: "model-tier registry declarations are advisory only — Edge Function hardcoded MODEL strings override the DB, silently drifting cost and quality."

**B. Source-discipline enum drift pattern — PRD-21 contributes.**

7 surfaces (PRD-15, PRD-17B, PRD-23, PRD-14B, PRD-16, PRD-18, PRD-21). `communication_drafts.sent_via` freeform TEXT.

**C. Messaging-orphan pattern — PRD-21 confirms at cross-reference (2 surfaces).**

PRD-15 seam #8 (Notepad → Message orphan). PRD-21 "Send via Message" (seam #8) is the 2nd surface.

**D. F11 server-side enforcement cross-addendum pattern — 4 surfaces confirmed.**

| Surface | Specific gap |
|---|---|
| PRD-15 | Per-pair `member_messaging_permissions` checked client-side only |
| PRD-17B | `classify_by_embedding` RPC trusts caller `p_family_id` |
| PRD-18 | `match_book_extractions` RPC trusts caller `p_family_id` |
| **PRD-21** | **`lila_tool_permissions` never checked by 8 tool Edge Functions** |

**Strong escalation candidate — 4 confirmed.** Worker recommends elevating to one consolidated `SCOPE-8b.F{N}` finding: "Per-resource authorization tables declared by addenda are consistently unenforced at the Edge Function layer."

## Proposed finding split

- **F-A: `lila_tool_permissions` has no server-side enforcement** (seam #4). **SCOPE-8b primary + SCOPE-3 cross-ref. Beta Y.**
- **F-B: HITM gate bypassed on `communication_drafts` save path** (seam #5). **SCOPE-8b primary + SCOPE-3 cross-ref. Beta Y.**
- **F-C: Four PRD-21 integration surfaces shipped as scaffolding only** (seams #3 + #6 + #8 + #12 consolidated). **SCOPE-3 Medium. Beta N.**
- **F-D (contributor only, no standalone finding):** PRD-21 contributes 2 surfaces to cross-addendum patterns.

## Beta Y candidates

1. **F-A** — `lila_tool_permissions` not enforced server-side. Any authenticated family member can POST to `lila-cyrano` or `lila-higgins-navigate` (or any tool Edge Function) bypassing mom's permission grant.
2. **F-B** — HITM gate skipped on `communication_drafts` save. Convention #4 is enumerated by PLAN §2.3 as a canonical Scope 8b surface.

## Top 3 surprises

1. **`lila_tool_permissions` is schema-only infrastructure** — client-side `useToolPermissions` queries it, but zero server-side code enforces it, zero live rows populate it, and the UI surface that would populate it (AI Toolbox sidebar) was removed. Every layer treats the permission table as optional decoration.

2. **Higgins Navigate's skill-check mode can never activate** — the threshold (5+ interactions) reads from `teaching_skill_history` but Navigate never writes a row. User could use Navigate 500 times and LiLa would still offer the "first-time" craft-first flow forever.

3. **Gratitude model drift is a direction-reversed twin of PRD-19's family_context_interview** — in PRD-19, registry says haiku but no one built the UI so the drift is latent. In PRD-21, registry says haiku and the UI is fully built, so every Gratitude turn in production runs Sonnet contrary to the DB's explicit downgrade.

## Watch-flag hits

- **F11 server-side enforcement** — **DIRECT HIT (Beta Y).** Seam #4. Cross-reference PRD-17B seam #6, PRD-18 seam #7, PRD-15 seam #4. **Cross-addendum F11 pattern confirmed at 4 surfaces.**
- **Crisis Override** — Non-hit. All 8 PRD-21 tool Edge Functions correctly integrate `detectCrisis`. Strong convention #7 compliance.
- **F17 messaging behavior** — Partial hit via seam #8. "Send via Message" integration absent. Joins PRD-15 seam #8 as 2nd messaging-orphan instance.
- **F22+F23 privacy/is_included_in_ai** — Non-hit as violation; STRONG POSITIVE. `_shared/relationship-context.ts` implements all three tiers correctly + applyPrivacyFilter + archived_at for Archives, and `is_included_in_ai` filter on private_notes + relationship_notes. Matches PRD-19 reference.
- **studio_queue source discipline** — Contributor via seam #2. 7th surface confirmed.
- **`is_included_in_ai` three-tier propagation** — CORRECTLY IMPLEMENTED for relationship tools consuming Archives. 2nd reference-quality implementation after PRD-19.
- **HITM (Convention #4)** — **DIRECT HIT (Beta Y).** Seam #5. First Scope 3+8b surface where HITM was traced end-to-end on a non-messaging draft path and found missing.

## Orchestrator adjudication

(empty — pending walk-through)
