# Pre-Dispatch Pack — MSRE: Mom Self-Restriction Enforcement

> **Factory status:** synthesized → decisions-pending (2 decisions, batch 5)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: MSRE. Priority: P4.
> Evidence: `claude/dispatch-factory/RFLX-MSRE-RECON.md` (MSRE section).
> Headline: mom can save self-restrictions ("don't show me my teen's journal") and the teen
> panel honestly reports them as pending — but NOTHING enforces them. The recon also found the
> Family Overview reads kids' Best Intentions OUTSIDE View-As entirely (a leak path page-level
> enforcement would miss), and that one registry flag conflates two different enforcement
> mechanisms (dad grants vs mom restrictions).

## Rulings

1. **Shared hook, five surfaces.** New `useMomSelfRestriction(featureKey, targetMemberId)` —
   origin-gated (applies to `mom_viewing` only; the kid via hub always sees their own content) —
   applied at the 4 View-As pages (Journal, InnerWorkings, GuidingStars, BestIntentions) AND the
   FO cross-member Best Intentions query (`useFamilyOverviewData.useBestIntentionsForMembers`) —
   the outside-View-As leak path is in scope from day one.
2. **Distinct visual language, never silence.** A full restriction renders a warm "You've hidden
   this from your view — [Manage in Permission Hub]" card. Mom must always be able to tell
   self-restriction apart from kid-privacy (opposite-direction mechanisms stacking on the same
   pages) and from empty states.
3. **Registry de-conflation.** `keyWiringStatus`'s single flag currently covers BOTH dad-grant
   enforcement and mom-restriction enforcement for the same 4 keys. Split into per-mechanism
   status (mom-restriction status map alongside the existing key map); the Hub card and the teen
   panel's `momCanSee()` read the mom-restriction map; flipping MSRE active no longer falsely
   claims dad-grant wiring (Convention #274 honesty preserved).
4. **Guided kids included (D-MSRE-1):** the Hub card's teens-only filter drops — PRD-02's engine
   is written universally, the 4 features all exist for Guided kids, and self-restriction is
   mom's own choice (no kid-side panel needed for Guided).
5. **Tag-level restriction deferred (D-MSRE-2):** feature-level ('full') ships now; `restricted_
   tags` filtering (wholly unbuilt infra) waits for a real tag-driven need. Registered honestly.
6. **The promised notification ships:** deleting a restriction (mom increases visibility)
   notifies an Independent target member — the Hub UI has claimed this happens since PRD-02;
   `createNotification` actually works now (KIDS-REWARDS S4 fixed the cross-member RLS bug).

## Slice plan (single Sonnet worker)
| Slice | Scope | Routing |
|---|---|---|
| 1 | `useMomSelfRestriction` hook + the 4 page applications + FO query application + restriction card component | Sonnet xhigh |
| 2 | Registry de-conflation + Hub card Guided inclusion + teen-panel momCanSee() update + removal notification | Sonnet xhigh |
| 3 | E2E (`tests/e2e/permissions/mom-self-restriction.spec.ts`: restricted feature blanked for mom-via-View-As but visible to the kid via hub-origin; FO column honors it; teen panel flips from wrench-pending to enforced-✗; removal notification row lands; Guided card renders) | Sonnet xhigh |
| Gates | Checkpoint 5 | **Fable if available, else Opus** |

## Open founder decisions (batch 5)
| # | Decision | Recommendation |
|---|---|---|
| D-MSRE-1 | Include Guided kids in the self-restriction card | Yes — the engine is universal; it's mom restricting herself |
| D-MSRE-2 | Defer tag-level restriction until a tag-driven need exists | Yes — feature-level covers the stated use; tags are new infra |

## Dependency edges
None blocking. Touches the same pages as RFLX/filterKidPrivate — the two filter layers must
compose (kid-privacy first, then mom-restriction; both origin-gated). Either build order works;
whichever lands second verifies composition.

---

## DISPATCH PROMPT (paste into a FRESH session — after batch-5 decisions resolve)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for MSRE — mom self-restriction enforcement. Pack:
claude/dispatch-factory/MSRE.md (6 rulings). Evidence: claude/dispatch-factory/RFLX-MSRE-RECON.md
(MSRE section — the change-surface inventory is your work list). Decisions RESOLVED per
recommendations unless the founder noted otherwise.

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; re-verify the recon's
file:line refs (PermissionHub.tsx:1175-1297, keyWiringStatus.ts:38-45, the 4 page query sites,
useFamilyOverviewData.ts:105-124); check whether RFLX landed (filter-layer composition order).

READ FIRST: prds/foundation/PRD-02-Permissions-Access-Control.md §Permission Engine (:499-542)
+ §mom_self_restrictions (:341-364); CLAUDE.md Convention #274 (keyWiringStatus single source of
truth — your de-conflation must PRESERVE its honesty guarantee); the pack + recon. Create
.claude/rules/current-builds/MSRE-self-restriction.md, pre-build summary, founder approval
BEFORE code.

HARD RULES: enforcement is origin-gated — 'mom_viewing' only, the kid's own view is NEVER
affected; the FO Best Intentions query is in scope (page-level-only enforcement is a failed
build); restriction rendering is the warm manage-card, never a silent empty state; the
de-conflated registry never claims dad-grant enforcement it can't prove (unknown keys default
inactive, #274); tag-level stays deferred and honestly registered; notification via the shared
createNotification util.

PROOF: the new spec (the mom-blocked-but-kid-sees probe is load-bearing) + tsc -b + lint +
permissions-wiring pin (you touch its surfaces — ask the founder before shared-fixture suites).
NOTHING COMMITS until green + founder eyes-on (eyes-on: restrict yourself from a kid's journal,
View As them, see the manage-card; the kid still sees their journal from the hub). Selective
staging; founder confirms before push. Close-out: Checkpoint 5, STUB_REGISTRY flip (Foundation
"Mom self-restriction ENFORCEMENT" row → Wired w/ tag-level residual), keyWiringStatus doc note,
archive build file.
```
