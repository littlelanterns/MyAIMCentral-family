# RFLX + MSRE — Combined Recon Brief (Sonnet agent, 2026-07-04)

> Archived condensed with citations. Consumed by `RFLX.md` + `MSRE.md`.

## RFLX — Reflections

**Current state:** `reflection_responses` has NO privacy column (migration 100071:68-97). RLS `rr_parent_reads_children` (:100-112): mom reads ALL non-additional_adult members' responses unconditionally — dad excluded (spousal carve-out), kids NOT excluded. **This is PRD-18's DOCUMENTED design, not an oversight** (PRD :615-641, :768: "Mom sees teen's reflection answers via View As... Teen is aware via TransparencyIndicator"; "Dad's reflections are private"). No kid-private concept exists anywhere in the PRD.

**Transparency indicator inconsistency (3 write surfaces):** ReflectionsPage.tsx:37,69-79 (teen-only gate); WriteDrawerReflections.tsx:59-66 (unconditional); GuidedReflectionsSection.tsx (evening rhythm inline) — **NO indicator at all**.

**Journal-copy visibility mismatch (standing correctness bug, independent of privacy question):** `useSaveResponse` (useReflections.ts:259-273) auto-creates journal_entries with HARDCODED `visibility:'private'` → `je_select_parent` RLS (migration 6:43-63) hard-blocks mom from the journal copy while the Reflections page shows her the same content. PRD :906 says the two views should be equivalent. Looks like a copy-paste default, not design.

**Dead infra:** `routed_destinations` JSONB has NO writer (AUDIT_REPORT_v1:1389); the PRD's route-from-Reflections-page design (:309 — routing from the page, NOT from rhythm inline) is unbuilt.

**View-As deferral on file:** Worker 5A deferred reflections privacy to Follow-Up G ("no privacy column"); filterKidPrivate() is shape-ready for a reflections branch if ever wanted. Two privacy strengths coexist platform-wide: RLS-hard (journal 'private') vs display-layer (self_knowledge + filterKidPrivate). Icon semantics: Heart=AI-inclusion, Eye=passwords — a privacy toggle would need Lock (Journal.tsx:28-32 VISIBILITY_ICONS precedent). Rhythms `reflection_guideline_count` orthogonal.

**Change surface if kid-privacy ever ships:** migration column, rr_parent RLS clause OR display-layer filter, useReflections params, ReflectionsPastTab toggle, both indicators made accurate, filterKidPrivate branch. Guided kids have no self-service settings home (mom-configures convention).

**Open questions:** (1) is kid-private wanted AT ALL (reversal of written design; align with the PRD-40 D-PRD40-3 resolution); (2) hard-RLS vs display-layer; (3) teens only vs Guided; (4) journal-copy visibility fix direction; (5) per-response vs per-category.

## MSRE — Mom self-restrictions

**Table + intent:** mom_self_restrictions (PRD-02 :341-364; restriction_type 'full'|'tag' + restricted_tags). PRD-02 permission-engine Step 1 (:507-508): mom's access check consults it FIRST; content-item visibility filtering (:540). `view_as_permissions` (the overlapping older table) is DEAD (0 rows; FO build removed its last read — "never reintroduce").

**Writes work, nothing reads:** PermissionHub MomSelfRestrictionCard (:1175-1297) — teens-only render (:210-224; **Guided kids never see the card** though all 4 features exist for them); RESTRICTABLE_FEATURES = journal_basic, innerworkings_basic, guiding_stars_basic, best_intentions (:1187-1192); toggle writes rows (:1207-1221) — **no notification fires on delete though UI copy promises it** (:1251 vs PRD :364). TeenTransparencyPanel already honest (momCanSee() returns true when key inactive; wrench = pending; :279-289). keyWiringStatus.ts:38-45 marks all 4 keys 'inactive' — **latent conflation: one flag covers BOTH dad-grant enforcement AND mom-restriction enforcement (different code paths)**; flipping for MSRE alone would falsely claim dad-grant wiring.

**Enforcement sites (the work list):**
1. Journal.tsx:37-47 (has filterKidPrivate — MSRE = a SECOND independent layer)
2. InnerWorkings.tsx:62 (same)
3. GuidingStars.tsx:191-193 (NO existing filter layer)
4. BestIntentions.tsx:812-814 (NO existing filter layer)
5. **useFamilyOverviewData.ts:105-124 `useBestIntentionsForMembers`** — mom-side FO column reads kids' Best Intentions OUTSIDE View-As entirely; page-level enforcement alone would leak here.
6. Tag-level (`restricted_tags`) is wholly unbuilt; only feature-level checked anywhere (isRestricted :1223-1224).

Pattern: shared `useMomSelfRestriction(featureKey, targetMemberId)` hook, origin-gated ('mom_viewing'), full-restriction → friendly "you've hidden this from yourself" card (distinct visual language from kid-private silence — two opposite-direction mechanisms now stack on the same pages).

**Open questions:** priority feature/tag need; Guided card inclusion; tag-level now vs later; FO surfaces honored; ship the promised notification.
