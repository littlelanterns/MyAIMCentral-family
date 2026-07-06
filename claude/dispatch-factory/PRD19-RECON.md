# PRD-19 Family Context & Relationships — Recon Evidence Brief (Sonnet reader, 2026-07-04)

> Archived by the dispatch factory (condensed, citations kept). Consumed by `PRD19.md`.
> Founder-protected item (never left over, per standing rule).

## A. Scope (refs → `prds/daily-life/PRD-19-Family-Context-Relationships.md`)

Screens: S1 Enhanced Archives main (SA lightweight-card section, Reports shortcut, Family folder master toggle; L76-99); S2 Enhanced Member Detail (aliases "Also known as" + external-alias toggle; context items w/ drag reorder + 3 sharing checkboxes LiLa/Spouse/Family + bulk toggle; Private Notes mom-only; Shared-Context-from-Them; Guided Interview section; Documents; Reports; L103-176); S3 Guided Context Interview (PREDEFINED question bank — NOT AI-generated — 9 categories incl. local-scored love-languages mini-assessment; skip-anytime; per-category progress; L180-252); S4 Upload & Summarize (PDF/JPG/PNG/DOCX/TXT/EPUB/MD → Sonnet complex/Haiku simple extraction → review → member_documents + archive_context_items source='document_upload'; L254-280); S5 Report Generation (member/family picker, templates: Monthly Summary/Homeschool Hours/IEP/Accomplishments/Update-LiLa-Context/Custom-gated; date ranges limited to completed aggregation months; L283-300); S6 Reports page (L303-314); S7 Relationship Notes (pair cards, author-scoped visibility — each author sees ONLY own; mom sees all ONLY via mediation, never on-screen; is_included_in_ai + is_available_for_mediation; role-differentiated starter prompts; L317-357); S8a How-to-Reach-Me card (5 structured fields, single JSONB archive_context_items context_type='how_to_reach_me', HIGH-PRIORITY into Higgins/Cyrano/message-coaching/mediation; L360-429); S8b(dup#) Partner Sharing Settings (bidirectional opt-in; L431-447). **PRD has a literal duplicate "Screen 8" numbering bug.**

Schema: member_documents, private_notes, relationship_notes (w/ person_a<person_b CHECK L547), guided_interview_progress, monthly_data_aggregations, generated_reports; archive_member_settings + aliases/use_alias_in_external/primary_alias; archive_context_items + share_with_spouse/share_with_family/sort_order; enum/source extensions. AI: family_context_interview mode (HAIKU per PRD, mom-only, predefined questions); nickname recognition via display_name_aliases per PRD; Full Picture mediation (superseded by PRD-34); Relationship Context Ethical Framework (system-wide); monthly aggregation 4-step pipeline (aggregate→suggest add/revise/remove→mom review→report notice), billing-day trigger. 13 feature keys (all TBD/beta-true). Visibility: mom full; dad configurable per-child + own card; SA summary-only; teen limited/own card; Guided/Play none.

## B. Verdicts (all file:line verified)

**Genuinely unbuilt. Zero PRD-19 mentions in WIRING_STATUS; no feature-decision file.** What exists = PRD-21 "guard tables" (migration 100041 header: "defined in PRD-19 but needed NOW by PRD-21") + superseded pieces:

- `private_notes` + `relationship_notes` tables EXIST (100041:18-73, :76-130) — read-only forever: **zero INSERT/UPDATE anywhere** (only SELECTs in `lila-mediator/index.ts:176,194-212` + `_shared/relationship-context.ts:165-212`); 0 rows; both missing sort_order/archived_at; relationship_notes missing is_available_for_mediation AND the person_a<person_b CHECK.
- `relationship-context.ts` (shared loader for all 8 PRD-21 tools + Mediator) is **functionally inert** — reads tables/values nothing writes (incl. HTRM block :324-331,490-493).
- **HTRM cannot even be written today:** archive_context_items context_type CHECK (100035:52-56, last touched 100145) excludes 'how_to_reach_me' + 'generated_report'; source CHECK excludes 'guided_interview'/'document_upload'/'monthly_review' (BulkAddSortModal.tsx:254 comment confirms 'bulk_add' missing too — falls back to 'manual').
- **TWO parallel nickname stores:** main assembler `detectMentionedMembers()` (context-assembler.ts:145-168) uses `family_members.nicknames`; relationship tools use `archive_member_settings.display_name_aliases` (added by 100041:164-165). PRD-19 as written would formalize a third variant. Privacy-alias system (primary_alias/use_alias_in_external) has NO columns.
- `family_context_interview` mode EXISTS in lila_guided_modes (live DB: **sonnet**, freeform prompt lila-chat/index.ts:129-131) — **contradicts PRD (haiku + predefined bank)**; zero UI reaches it; `requires_feature_key='archives_guided_interview'` is a DANGLING reference (key never registered).
- **Mediation: superseded + BUILT.** Convention #95; `loadFullPictureContext()` (lila-mediator:167-215) matches PRD-19's spec almost verbatim (neutral A/B/Observer labels, never attributes). BUT gating is a raw `role==='primary_parent'` check (ToolConversationModal.tsx:315,319) — `archives_relationship_mediation` key referenced by Convention #95 is **never in code or registry**. Full Picture loads ALL notes unconditionally (no is_available_for_mediation filter — STUB:557 confirms unwired).
- Ethical framework arc + safety exception: BUILT in Mediator (:32-58,79-165) with the PRD-20-addendum-refined language + hardcoded DV/crisis resources (already works around Safe Harbor).
- Screens 1/2/4/5/6/7/8a/8b UI: **all missing** (MemberArchiveDetail.tsx 1131 lines = unmodified PRD-13 baseline; no /reports route; no upload; no aggregation/report Edge Functions — `monthly-aggregate`/`report-generate` never scaffolded).
- self_knowledge.share_with_spouse: missing. Feature keys: 1 of 13 registered (ai_toolbox_browse). AI Toolbox standalone page: superseded by Vault model (Convention #88; ToolConversationModal.tsx:779 comment) — do NOT resurrect.
- Convention #243 (Safe Harbor aggregation exclusion): **fully outstanding**; PRD-19 is a named candidate first-shipper (RECON_DECISIONS_RESOLVED Decision 10) — whoever builds monthly_data_aggregations first inherits the filter + grep CI check.
- Convention #79 already-wired via family_members.nicknames; #76 privacy filter + #245 sync-roster discipline established in relationship-context.ts:296-305,415-425 — new write paths must follow.

## C. Schema gaps
Absent: member_documents, guided_interview_progress, monthly_data_aggregations, generated_reports. Incomplete: private_notes (+sort_order, archived_at), relationship_notes (+is_available_for_mediation, sort_order, archived_at, person_a<person_b CHECK), archive_member_settings (+privacy-alias trio), archive_context_items (+share_with_spouse/share_with_family/sort_order + CHECK expansions), self_knowledge (+share_with_spouse).

## D. Touchpoints
Inert readers waiting: relationship-context.ts (8 tools), lila-mediator Full Picture. Downstream waiting: PRD-05C alias substitution (blocked, no columns); PRD-28B/PRD-37 report-taxonomy extension (addendum :214-223 pre-planned on PRD-19's base tables); PRD-23 person-detail book trigger + study-guide personalization (Session Addendum :207,287,578); PRD-11 Relationship Wins auto-tag; PRD-15 message-coach HTRM loading (addendum L128-135 — not wired).

## E. Conflicts (named)
1. Convention #95's feature-key claim has zero enforcement (raw role check; key unregistered).
2. **Safe Harbor backburner:** PRD-19's ethical framework names Safe Harbor as its handoff (L815, L857, L1091) and defers protocol authorship to shelved PRD-20; the built Mediator already self-resolved (hardcoded resources). Live conflict needing a bridge ruling.
3. Convention #243 obligation lands with whoever builds aggregation first.
4. Two nickname stores (Convention #79 vs PRD-19 spec) — unification decision required BEFORE schema work.
5. **Convention #248 invariant vs ai_patterns.md per-tool overrides:** Cyrano/Higgins/Mediator are category-1 (populated context_sources) but hand-roll loadRelationshipContext() instead of assembleContext() — literal #248 violation UNLESS the ai_patterns per-tool override table sanctions it. Two authoritative docs disagree; PRD-19 adds more sources into the same bifurcated pipeline.
6. PRD-19/PRD-28B reporting boundary (both docs agree): PRD-19 = aggregation table + core flow + 3 basic templates; PRD-28B = expanded taxonomy + custom + compliance (its own 6 tables also unbuilt — no bleed).
7. AI Toolbox superseded by Vault (Convention #88).
8. PRD internal duplicate "Screen 8" numbering defect.

## F. Open questions (absorbed into pack decisions)
1. Reduced safety bridge vs block on Safe Harbor. 2. Nickname unification direction. 3. Privacy-alias distinct vs reuse of display_name_aliases (PRD L112 ambiguous). 4. Interview mode: rebuild to PRD (haiku/predefined) vs accept drifted Sonnet freeform. 5. Reports MVP = 3 templates, zero 28B bleed — reconfirm. 6. SA lightweight-card scoping (which S2 features apply to SAs at all). 7. Dangling archives_guided_interview key fix. 8. CHECK-expansion sequencing.
