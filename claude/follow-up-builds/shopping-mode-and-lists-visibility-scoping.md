# Shopping Mode & Lists Visibility Scoping

**Status:** Follow-up build candidate — not yet scoped
**Filed:** 2026-05-28
**Filed from:** View As Identity-Scope Architecture build (Worker 3 Checkpoint 2 Surprise #2)
**Estimated workers:** 1-2
**Estimated calendar time on branch:** 1-2 days
**Live-app downtime:** zero (feature branch strategy)

---

## What this build is for

Fix the list visibility rules for Shopping Mode (and likely the Lists page) so non-mom members see ONLY the lists they own and the lists explicitly shared with them via `list_shares`. Today, Shopping Mode aggregates family-wide lists marked `include_in_shopping_mode=true` regardless of ownership or sharing, which leaks mom's private lists (gift ideas, kid-specific shopping) to other family members.

---

## Why we're doing it

Worker 3 of the View As Identity-Scope Architecture build correctly migrated Shopping Mode's data-subject derivation to `useEffectiveMember()`. Their investigation surfaced that the underlying list-visibility query is family-wide:

> "useShoppingModeStores queries family-wide shopping lists (`list_type='shopping' AND include_in_shopping_mode=true`), then unions in personal shares via `list_shares.shared_with = memberId`."

The "family-wide" part is the bug. When mom does View As of Miriam (or Miriam logs in via the family hub once Worker 5 lands), the Shopping Mode page asks for Miriam's data — but the query gives back every family list marked `include_in_shopping_mode=true`, regardless of whether Miriam has any business seeing it.

Founder vision, confirmed 2026-05-28:

> "If my teens are shopping, I only want their shopping mode to pull from lists that are shared with them, like groceries, or general, or whatever. I don't want my gift ideas list showing up on their lists, or a belt for Gideon to show up on Miriam's list."

The current implementation contradicts this directly. Three concrete leak examples surface from the founder's own use cases:

1. **Mom's gift ideas list** (mom owns, marked `include_in_shopping_mode=true` because mom shops for items on it, never shared) → currently visible to every teen in their Shopping Mode
2. **A list with "belt for Gideon" on it** (mom owns, marked for shopping mode, not shared with Miriam) → currently visible to Miriam
3. **Family grocery list** (mom owns, marked for shopping mode, explicitly shared with Miriam via `list_shares`) → correctly visible to Miriam

Only case 3 behaves correctly today. Cases 1 and 2 are leaks.

---

## Scope decision — list-level visibility only

Founder decision 2026-05-28:

> "I don't want to worry about item-level leaks, mom and mindsweep should be smart enough to put gideon's belt in the appropriate list."

**No item-level filtering in scope.** The architectural assumption is that mom + MindSweep classification put items onto the right list during intake. Once items are correctly classified, list-level visibility rules are the enforcement layer. If "belt for Gideon" ends up on a list Miriam shouldn't see, fix the list classification or the sharing rule — don't add a per-item filter.

This means:
- The `gift_for` column on `list_items` is not consulted by Shopping Mode queries in this build
- MindSweep's list-routing intelligence is the upstream guardrail (separate concern; tracked elsewhere)
- The fix is purely about which LISTS each member sees

---

## Strategy — feature branch, one or two workers

Feature branch (`shopping-mode-visibility-scoping`). Main stays deployable throughout.

### Worker 1 — Shopping Mode query rewrites

- Rewrite `useShoppingModeStores(familyId, memberId)` to scope by ownership + explicit `list_shares` instead of family-wide. Pseudocode of the correct rule:

  ```
  visible_lists = (
    lists WHERE owner_id = memberId AND include_in_shopping_mode = true
  )
  UNION
  (
    lists WHERE id IN (
      SELECT list_id FROM list_shares WHERE shared_with = memberId
    ) AND include_in_shopping_mode = true
  )
  ```

- Rewrite `useShoppingModeItems(familyId, memberId, selectedStore)` to use the same visibility filter
- Confirm cache keys still partition correctly by (familyId, memberId)
- Add tests:
  - Mom sees all her own shopping-mode-flagged lists
  - Miriam sees ONLY her own shopping-mode-flagged lists + lists explicitly shared with her
  - Mom's gift ideas list (not shared) is invisible to teens
  - List shared with Miriam but not Gideon is invisible to Gideon
  - Mom's `include_in_shopping_mode=false` lists don't appear anywhere
  - Worker 2 (View As Identity-Scope) data-subject flow continues to work: mom-via-View-As-of-Miriam sees Miriam's scoped view

### Worker 2 — Lists.tsx page audit (may fold into Worker 1)

- Audit Lists.tsx top-level query — does it have the same family-wide leak?
- If yes, apply the same ownership + shares filter
- Verify mom's view is unchanged (she owns most lists; no regression for her)
- Verify teen views are correctly scoped
- Consider: should this also extend to the Notepad routing destinations and any list-picker UIs? (Probably yes; surface to orchestrator at dispatch time.)

---

## Blockers / prerequisites

- **View As Identity-Scope Architecture build must close first.** This build builds on Worker 3's `useEffectiveMember()` migration of ShoppingMode.tsx. Without that migration, the fix here would scope to mom's data even when she's viewing as a teen.
- **No new schema needed.** All required columns exist: `lists.owner_id`, `lists.include_in_shopping_mode`, `list_shares.list_id`, `list_shares.shared_with`.
- **MindSweep behavior is NOT a blocker.** Founder's assumption that mom + MindSweep classify correctly is separate; this build only enforces list-level visibility rules. MindSweep classification quality is its own concern, tracked separately.

---

## What NOT to do

- **Add per-item filtering.** Out of scope per founder decision. Items are scoped by their containing list; list-level rules are the enforcement layer.
- **Touch the `gift_for` column.** That's a per-item field; not relevant to this build.
- **Change the `include_in_shopping_mode` flag's meaning.** It stays as "this list participates in Shopping Mode at all." It does NOT mean "everyone in the family sees this in Shopping Mode" — that's the bug being fixed.
- **Build a UI for mom to bulk-share lists.** Out of scope. Use existing `list_shares` mechanisms (whatever surfaces them today; if those are incomplete, that's a separate concern).
- **Migrate Lists.tsx data-subject derivation.** Worker 3 already did this. This build is about the visibility QUERY, not the data subject IDENTITY.

---

## Open questions for the founder at dispatch time

1. **Lists.tsx scope.** Audit will reveal whether Lists.tsx has the same family-wide leak. If yes, fold the fix into this build (single worker handling both) or split into a separate Lists page sweep?
2. **`include_in_shopping_mode=true` lists with NO sharees.** A list owned by mom, marked for shopping mode, but never shared with any kid — does mom still see it in her own Shopping Mode? (Yes, by ownership.) Confirm this matches founder expectation.
3. **List-share semantics for `is_individual_copy=true`.** The `list_shares` table has an `is_individual_copy` flag (per Convention 269 Two Sharing Modes). Do both shared lists AND individual-copy lists count as "shared with the teen" for Shopping Mode visibility purposes? Recommendation: yes, both count (the teen has access either way).
4. **Notepad routing destinations.** When mom routes a notepad item to a list, does she see only her own shopping lists, or all family lists? Worth checking parity here. May warrant inclusion in this build's scope.
5. **Existing data audit.** Are there currently any lists marked `include_in_shopping_mode=true` that were marked under the assumption "this should be family-visible"? After the fix, those would no longer leak — confirm this is intended. (Recommendation: yes, intended. Mom can re-share explicitly any list she actually wants kids to see.)

---

## Related

- **View As Identity-Scope Architecture build** — Worker 3's `useEffectiveMember()` migration of ShoppingMode.tsx surfaced this gap
- **PRD-09B Lists, Studio & Templates** — defines the `lists`, `list_shares`, `list_items` schema
- **PRD-09B Living Shopping List & Shopping Mode V1** — introduces `include_in_shopping_mode` flag and Shopping Mode aggregation
- **Convention #269** — Two Sharing Modes (shared list vs individual copies via `list_shares.is_individual_copy`)
- **MindSweep (PRD-17B)** — upstream classification of swept items into the correct list; not in scope for this build but the founder's behavioral assumption depends on MindSweep doing its job
