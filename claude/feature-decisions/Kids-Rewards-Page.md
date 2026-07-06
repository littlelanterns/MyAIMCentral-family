# Kids' My Rewards Page (KIDS-REWARDS-PAGE)

> **Status:** PRE-BUILD — awaiting founder gate approval
> **Build identity:** KIDS-REWARDS-PAGE (Follow-Up Build A promised when the `/my-rewards` stub shipped in the View-As build)
> **Created:** 2026-06-12
> **Founder vision is the law for this build.** The PRDs below are read for context and binding cross-cutting rules; where the original PRD-24 reward economy conflicts with what was actually built (Build M sticker book + Phase 3 Connector Layer), the built architecture wins (Convention #11 — newer supersedes).

---

## 1. Founder Vision (verbatim summary — the five pillars)

1. **Mom opt-in per section.** Mom chooses which rewards sections each kid's page shows — finances, points, creature pages, coloring pages, custom rewards.
2. **Creature pages.** Kids place earned creatures wherever they want on pages they've earned, and can later drag-and-drop creatures to different pages and locations — like dragging an app icon on a phone: drag it off the edge and the next page becomes available.
3. **Coloring pages.** Shows active coloring pages; completed/earned ones can be downloaded and printed as the matching physical coloring sheet.
4. **Custom rewards cards.** Cards for custom rewards kids earned (late night with friends, popsicle, ice cream trip). Card can have a mom-uploaded image — set when she creates the opportunity to earn the reward OR any time she edits that item later. Each card has a **Redeem** button → marks redeemed → moves to a **Previously Redeemed** tab: a history view (like the Balance page) tracking what they earned, HOW they earned it, WHEN they earned it, and when it was redeemed. History is NOT always visible — only when clicked into.
5. **Prize Board parent side.** Mom gets a similar view — everything she owes her kids, with the balance viewable by-everything or by-kid (same pattern as the finances Balance tab's By child / By date toggle).

---

## 2. Source Material Read (pre-build proof)

| Source | Read |
|---|---|
| `prds/gamification/PRD-24-Gamification-Overview-Foundation.md` | Full (1,375 lines) |
| `prds/dashboards/PRD-25-Guided-Dashboard.md` | Full |
| `prds/dashboards/PRD-26-Play-Dashboard.md` | Full |
| `prds/addenda/PRD-24-Cross-PRD-Impact-Addendum.md` | Full |
| `prds/addenda/PRD-24A-Cross-PRD-Impact-Addendum.md` | Full |
| `prds/addenda/PRD-24A-Game-Modes-Addendum.md` | Full |
| `prds/addenda/PRD-24B-Cross-PRD-Impact-Addendum.md` | Full |
| `prds/addenda/PRD-24B-Content-Pipeline-Tool-Decisions.md` | Full |
| `prds/addenda/PRD-25-Cross-PRD-Impact-Addendum.md` | Full |
| `prds/addenda/PRD-26-Cross-PRD-Impact-Addendum.md` | Full |
| `prds/addenda/PRD-28-Cross-PRD-Impact-Addendum.md` | Full |
| `prds/addenda/PRD-31-Permission-Matrix-Addendum.md` | Full |
| `prds/addenda/PRD-Audit-Readiness-Addendum.md` | Full |
| `prds/addenda/PRD-Template-and-Audit-Updates.md` | Full |
| `prds/platform-complete/PRD-28-Tracking-Allowance-Financial.md` | Relevant sections (child visibility, ledger, Play money rules, Visibility & Permissions tables) |
| `claude/live_schema.md`, `WIRING_STATUS.md`, CLAUDE.md Conventions #198–#222, #223–#228, #271–#276 | Full (loaded context) |
| Live code survey | `/my-rewards` stub, sticker book stack, coloring stack, earned_prizes lifecycle, PrizeBoard, LedgerView, GamificationSettingsModal, storage buckets, dnd patterns, shell routing |

---

## 3. Supersession Map (critical — prevents building the wrong thing)

PRD-24's original reward economy was **never built as specified** and is superseded by built systems:

| PRD-24 original | What actually exists (authoritative) |
|---|---|
| `gamification_rewards` + `reward_redemptions` + reward menu (Screens 3, 7) | **Phase 3 Connector Layer:** `contracts` + godmothers + `earned_prizes` (+ `reward_reveals`, `reward_reveal_attachments`, `contract_grant_log`) |
| `treasure_boxes` + `treasure_box_opens` + animation templates (Screens 4, 5, 9) | **Reveal animations** (`reveal_animations`, `RewardRevealProvider`, `ContractRevealWatcher`, `presentation_mode`) |
| `gamification_events` append-only ledger | `roll_creature_for_completion` RPC + `member_creature_collection` / `member_page_unlocks` / points on `family_members` (Build M, Conventions #198–#206) |
| Visual Worlds / overlays (PRD-24A) | **Sticker book** (`gamification_themes/_creatures/_sticker_pages`, `member_sticker_book_state`) + coloring reveals (`member_coloring_reveals`, `coloring_reveal_library`) |
| Reward redemption → PRD-15 request flow | Redemption today = mom-only "Redeemed" button on PrizeBoard (`earned_prizes.redeemed_at/redeemed_by`). No PRD-15 request integration exists. |

Still-binding rules from the PRDs (NOT superseded):
- **Celebration only / never taken away** — earned rewards are permanent (Convention #219; PRD-24 principle).
- **Points are personal currency; never mixed with real money** (PRD-24 ↔ PRD-28 boundary; Convention #223 append-only ledger).
- **Play mode children ALWAYS see completion % only, never dollar amounts**, regardless of `child_can_see_finances` (PRD-28 decision rationale; already enforced in `LedgerView` via `hideMoney`).
- **`child_can_see_finances`** gates dollar visibility for Guided/Independent (default: true Independent, false Guided/Play).
- **Currency name/icon is per-child config** — never hardcode "stars"/"points" in UI strings (`gamification_configs.currency_name`).
- **Mom-managed for Play/Guided; Independent self-views.** Mom sees all (PRD-24 Visibility table).
- **Unchosen things never revealed; no FOMO/shame mechanics** anywhere.

---

## 4. Existing Infrastructure Inventory (reuse, don't rebuild)

| Piece | Where | State |
|---|---|---|
| `/my-rewards` route + stub page | `src/App.tsx:67`, `src/pages/MyRewardsPage.tsx` | Stub (`PlannedExpansionCard featureKey="my_rewards_page"`) |
| Per-kid page gate | `src/hooks/useShowMyRewards.ts` → `family_members.preferences.show_my_rewards` (default false) | Wired; sidebar entry for Adult/Independent/Guided via `getSidebarSections` |
| Play rewards surface | `/rewards` → `src/pages/PlayRewards.tsx` (sticker book + `PrizeBox canRedeem={false}`) | Wired (SCOPE-3.F22 fix) — Play does NOT use `/my-rewards` |
| Sticker book display | `StickerBookDetailModal` (Current page / All pages tabs), `PlayStickerBookWidget` | Wired |
| Creature free-position drag **within a page** | `StickerOverlay.tsx` (custom mouse/touch handlers, relative 0–1 coords, `useMoveCreature` persists `position_x/y`) | Wired |
| Page unlocks | `useMemberPageUnlocks` → `member_page_unlocks` | Wired |
| Coloring reveals + progressive color | `useColoringReveals`, `ColorRevealCanvas`, `ColorRevealTallyWidget`, `ColorRevealDetailModal` | Wired |
| Coloring print flow | lineart preference picker → `lineartUrlForPreference(slug, pref)` → new window + `window.print()` → records `printed_at` | Wired (browser print; no download button, no PDF) |
| Earned prizes data | `earned_prizes` (migration 100144): `prize_type` (text/image/platform_image/randomizer/celebration_only), `prize_text`, `prize_name`, `prize_image_url`, `prize_asset_key`, `source_type`, `source_id`, `earned_at`, `redeemed_at`, `redeemed_by`, `animation_slug` | Wired; **0 production rows as of 2026-06-11** |
| Prize inserts | `execute_prize_godmother` (100211, full snapshot incl. image), `execute_custom_reward_godmother` (100214, **text-only** — no image/name) | Wired |
| Kid prize display | `PrizeBox.tsx` (card grid, redeem button behind `canRedeem`, collapsed "Show redeemed") | Wired — but **never renders `prize_text`**, so custom text rewards show as a bare Gift icon (display gap to fix) |
| Mom redeem | PrizeBoard Prizes tab → `useRedeemPrize` sets `redeemed_at/redeemed_by` | Wired (mom/granted-manage only) |
| Parent Prize Board | `/prize-board` (GrantedRoute `financial_tracking`): Allowance (unpaid periods + Mark Paid) / Prizes (by kid) / Balance (LedgerView) | Wired |
| By-child/By-date arrangement precedent | `LedgerView.tsx` (`myaim-ledger-allkids-arrangement` localStorage, founder-requested 2026-06-09) | Wired |
| Kid self ledger | `LedgerView mode='self'` honoring `child_can_see_finances` + Play `hideMoney` | Wired |
| Image upload pattern | `PrizeContentEditor` ImageUploader → bucket `gamification-assets`, path `reward-images/{familyId}/{uuid}.{ext}`; avatar pattern in `useAvatarUpload` | Wired (reward_reveals authoring only) |
| Opportunity/task reward config | `RewardConfig.tsx` — reward types `stars/points/money/privileges/family_activities` | **No image field; `privileges`/`family_activities` are labels only — nothing consumes them on completion. No kid-visible record is created.** |
| Section opt-in pattern precedent | `dashboard_configs.preferences` (reading_support etc.) AND `family_members.preferences` (show_my_rewards, carry_forward) | Both patterns exist |
| Gamification settings | `GamificationSettingsModal` (6 collapsible sections, Convention #221) | Wired; natural host for new section opt-ins |
| Reveal pipeline | `usePendingReveals` + `ContractRevealWatcher` (Convention #272-compliant realtime) | Wired |

**Provenance verification ("how they earned it"):** `earned_prizes.source_type` carries the deed firing source — observed live values flow from `fireDeed` call sites: `'task'`, `'sequential_task'`, `'intention_iteration'`, `'randomizer_item'`, with `'contract_grant'` fallback — plus `source_id` to the source row and `attachment_id`/`reward_reveal_id` for prize-godmother grants. The history view CAN resolve human-readable "how" via joins (task title, intention statement, list item name, contract name). Safe to promise. Caveat: rows inserted before this build = none (table is empty in production), so no backfill needed.

---

## 5. Gap Analysis (what this build actually creates)

| # | Vision pillar | Gap |
|---|---|---|
| 1 | Section opt-in | No per-section preference exists; no settings UI for it. Page itself is a stub. |
| 2 | Creature pages | In-page drag exists; **cross-page drag (drag-to-edge → page flip)** does not. Sticker book is Play-modal-styled; needs a My Rewards section embed for Guided/Independent too. |
| 3 | Coloring | Display + print exist but live only in Play dashboard widgets/modals; needs a My Rewards section (active + completed, with print/download) for all enabled shells. No download button today. |
| 4 | Custom rewards | `PrizeBox` exists but: kids can't redeem (`canRedeem=false` everywhere kid-facing); `prize_text` never rendered; **no image on custom_reward/opportunity-sourced rewards**; no mom image-edit-later; no "Previously Redeemed" history view with provenance; **opportunity rewards of type privileges/family_activities create nothing**. |
| 5 | Parent side | Prizes tab is by-kid only; no by-everything/by-kid arrangement toggle; no unified "everything owed" framing across prizes + unpaid allowance. |

---

## 6. Decisions Needed at the Gate (founder Q1–Q10)

> Recommendations lead; founder decides.

**Q1 — Where does mom's per-kid section opt-in live?**
Recommend: `family_members.preferences.my_rewards_sections` (JSONB object, e.g. `{finances:false, points:true, creatures:true, coloring:true, custom_rewards:true}`), sitting next to the existing `show_my_rewards` gate so one fetch answers "is the page on, and what's on it." Managed from a NEW collapsible section in `GamificationSettingsModal` ("My Rewards Page") that also surfaces the existing show/hide toggle. Alternative: `dashboard_configs.preferences` (the PRD-25/26 home for dashboard prefs) — rejected because the page gate already lives on `family_members.preferences` and splitting the two invites drift.
Defaults when mom enables the page: creatures/coloring/custom_rewards ON if gamification enabled; points ON; finances OFF (opt-in, consistent with `child_can_see_finances` being conservative).

**Q2 — Is kid "Redeem" final? Accidental-tap protection?**
Recommend: Redeem is **kid-final with a confirmation dialog** ("Use your reward now?") for Guided/Independent — celebration moment, quiet in-app notification to mom (same fire-and-forget pattern as dad-payment notifications). **Play shell: no Redeem button** — card shows "Ask a grown-up to use it!" (consistent with Convention #37 speed-bump philosophy and the existing mom-redeems-on-PrizeBoard flow). Alternative if founder prefers control: per-kid toggle `redeem_requires_mom` — NOT recommended for v1 (adds a pending state with no surface to manage it).

**Q3 — Which shells get the page, and how does Play adapt?**
Recommend: one shared `MyRewards` sections component. Guided + Independent (+ Adult if mom enables) render it at `/my-rewards` (existing sidebar gating). **Play keeps `/rewards`** ("Fun" tab) and renders the same component with Play tokens: 56px targets, finances section never rendered (PRD-28 hard rule), no Redeem button (Q2). Creature drag on Play reuses the existing `StickerOverlay` touch handlers (8px slop) with bigger page-flip affordances (large edge arrows + page dots, not just edge-hover).

**Q4 — Print: browser print or PDF download?**
Recommend: keep the existing lineart browser-print flow (already built, already records `printed_at`) and ADD a "Download" action that downloads the lineart PNG directly (and optionally the finished color PNG as a keepsake). No PDF generation library — the assets are print-resolution PNGs by design (Convention #212/#213).

**Q5 — Mom's image upload for custom rewards: where does it attach + which bucket?**
Recommend, in order of where mom touches rewards:
 (a) **Contract form (`/contracts` RewardRules)** — `custom_reward_godmother_configs` gains optional `reward_image_url`; reuse the existing `ImageUploader` (bucket `gamification-assets`, path `reward-images/{familyId}/…`). `execute_custom_reward_godmother` snapshots it into `earned_prizes.prize_image_url` (+`prize_type='image'`).
 (b) **Opportunity/task rewards** — add `reward_image_url` to `tasks`, `task_templates`, `list_items`; surface an optional image picker in `RewardConfig` (and opportunity item editor) **only when reward type is privileges/family_activities** (custom rewards), snapshotted into the earned prize at award time.
 (c) **Edit-later** — mom can set/replace the image on an already-earned prize card from PrizeBoard (UPDATE `earned_prizes.prize_image_url` — allowed; the append-only rule is `financial_transactions` only).
 Bucket: `gamification-assets` (existing public bucket + existing path convention). 

**Q6 — Provenance promise check.** VERIFIED (Section 4). History view will show: prize, image, source ("Earned by: [task title / intention / randomizer item / reward rule name]"), `earned_at`, `redeemed_at`, redeemed-by attribution. No schema gap.

**Q7 — NEW (found in recon): opportunity rewards of type `privileges`/`family_activities` award NOTHING today.** They're dropdown labels with no completion-time consumer — the "popsicle earned from an opportunity" in the founder's vision has no pipeline. Recommend: in scope — on completion/approval of a task whose reward type is privileges or family_activities, create an `earned_prizes` row (prize_text = reward description, image per Q5b, source_type/source_id = the task) so it lands on the kid's Custom Rewards section. This is the connective tissue of vision #4. Confirm scope.

**Q8 — What's in "Previously Redeemed" history?**
Recommend: redeemed `earned_prizes` only (prizes domain). Money history already has a home (Balance/LedgerView `mode='self'`), which the finances section links into. Mixing money into the prize history would duplicate the ledger.

**Q9 — Parent side shape.**
Recommend: on PrizeBoard **Prizes tab**, add the same arrangement toggle pattern as LedgerView — "By kid" (current grouping, default) / "By date" (one chronological owed list) — plus an "everything owed" summary strip at top (unredeemed prize count + total unpaid allowance $ across kids). Allowance/Balance tabs unchanged. No new page.

**Q10 — Feature keys.** `my_rewards_page` already registered (migration 100248). Recommend no new keys — section opt-ins are mom preferences, not tier permissions; beta `useCanAccess` returns true regardless. Confirm.

---

## 7. Explicit Non-Goals / Stubs

- **No PRD-24 reward menu / point-cost redemption economy.** Points remain display-only currency here; nothing in this build spends points.
- **No treasure box containers** (superseded architecture).
- **No PRD-15 request-based reward approval flow** (unless founder picks the mom-confirm variant in Q2).
- **No new reveal animations** — reveals stay owned by `ContractRevealWatcher`.
- **No gamification UNDO cascade** (Convention #206 known limitation stands).
- **Sticker placement collaboration / multiplayer pages** — out of scope.
- **Randomizer-drawn prize pools (`prize_type='randomizer'`)** — display as-is; no new pool UX.

---

## 8. Cross-Feature Connections

| Connects to | How |
|---|---|
| Build M sticker book (Conventions #198–#222) | Creature pages section embeds/extends `StickerBookDetailModal` + `StickerOverlay`; placement writes via `useMoveCreature` (now also `sticker_page_id`) |
| Phase 3 Connector Layer | Custom rewards read/redeem `earned_prizes`; Q7 wires opportunity privilege rewards into the same table |
| PERMISSIONS-WIRING (Convention #274) | PrizeBoard changes stay behind `financial_tracking` grants; per-kid scoping untouched |
| PRD-28 finances | Finances section = `LedgerView mode='self'` + allowance progress; `child_can_see_finances` + Play %-only honored |
| FO-COMMAND-CENTER (Convention #275) | No FO changes; mom's command surfaces unchanged except PrizeBoard Prizes tab arrangement |
| View-As (Convention #39) | Page must render correctly under View As via `useEffectiveMember`; kid-private rules N/A (rewards are mom-visible by design) |
| Mobile parity (Convention #16) | `/my-rewards` already flows from `getSidebarSections` → More menu; verify eyes-on |

---

## 9. Post-Build Verification

*(Checkpoint 5 — every gate requirement across Slices 1-4 + this close-out: Wired / Stubbed / Missing)*

| Requirement | Status | Evidence |
|---|---|---|
| **Slice 1 — Reward pipeline core** |
| `reward_image_url`/`reward_description`/`reward_image_asset_key` on tasks, task_templates, list_items, custom_reward_godmother_configs | **Wired** | Migration 100266 |
| `execute_custom_reward_godmother` snapshots image+name into `earned_prizes` | **Wired** | Migrations 100266-100269 (guard ledger G1-G8), slice1 test 1/1c/1d/1e/1f/1g |
| `redeem_own_prize` SECURITY DEFINER RPC (kid self-redeem) | **Wired** | Migration 100266, slice1 test 4 |
| Tracker prize-image field (`widget_config.prize_image_url`) | **Wired** | WidgetConfiguration.tsx sequential_path + streak cases |
| Award hook wiring (completion-time + approval-time, Q7 timing) | **Wired** | useTaskCompletion.ts, useTaskCompletions.ts, slice1 test 3a/3b |
| Three-mode reward image picker (none/upload/library) + embedding auto-suggest | **Wired** | RewardImagePicker.tsx, TaskIconPicker precedent reuse |
| PrizeBox: prize_text render, kid Redeem+confirm+mom notification, Play "Ask a grown-up" | **Wired** | PrizeBox.tsx, slice1 test 4 |
| PrizeBoard: Un-redeem, edit-image-later | **Wired** | PrizeBoard.tsx, slice1 test 5 |
| Visibility model (private/shared/family) + `personal_rewards_privacy` grant | **Wired** | Migration 100266, slice1 tests 6a/6b/6c |
| R1 — per-step routine rewards | **Stubbed** | STUB_REGISTRY "KIDS-REWARDS-PAGE Follow-Ups" — completion-level wired now, per-step is new schema/code |
| R2 — tracker goal-detection → prize firing | **Stubbed** | STUB_REGISTRY — image field wired, firing needs goal-detection infrastructure first |
| **Slice 2 — My Rewards page + section opt-ins** |
| `show_my_rewards` + `my_rewards_sections` settings (defaults ON per founder amendment) | **Wired** | useMyRewardsSettings.ts, slice2 tests 1/2 |
| Shared `<MyRewards>` component: Points, Custom Rewards, Victories, Finances sections | **Wired** | MyRewards.tsx, slice2 tests 3-8 |
| Convention #271 owed-number reconciliation (matches Balance page) | **Wired** | slice2 test 18 (also closes this Slice 5 checklist item early) |
| RedeemedHistoryModal (Previously Redeemed history + provenance) | **Wired** | slice2 test 6/21 |
| CelebrationDetailModal (victory narrative) | **Wired** | slice2 test 7/22 |
| Mom's own /my-rewards (R4-REVISED: self-only render, no sidebar entry) | **Wired** | Component renders correctly under direct URL; PrizeBoard-pill entry point is the Slice 5 gap below |
| Play /rewards layout + View-As-aware nav (2 pre-existing bugs found & fixed) | **Wired** | Founder eyes-on fixes, slice2 test 9/10 |
| View-As correctness (no self-redeem under mom session) | **Wired** | slice2 test 8/23/24 |
| **Slice 3 — Creatures + Coloring + Dashboard Doors** |
| CreaturePageFrame: swipe-strip nav + unplaced tray + PullTab + dual placement (tap + drag) | **Wired** | slice3 tests 25-29 |
| Drag-to-edge page carry | **Wired** | slice3 test 28 |
| Theme scoping (filters by active_theme_id) | **Wired** | slice3 test 30 |
| ColoringSection: active + finished gallery, print + download (lineart/color PNG) | **Wired** | slice3 test 31 |
| Dashboard doors (`info_sticker_page`/`info_coloring_page` widgets) | **Wired** | slice3 test 32/33 |
| Kid creature-write RPCs (`place_member_creature`, `set_member_last_viewed_page`) | **Wired** | Migration 100275 — fixed a real RLS gap blocking kid self-service |
| Starter creature (every enabled sticker book gets one on enable) | **Wired** | Migrations 100276-100277, slice3 test 36 |
| **Slice 4 — Propose-a-Reward + self-propose** |
| `reward_proposals` table + RLS (proposer/mom/self-proposal-privacy scoping) | **Wired** | Migrations 100278-100279, slice4 test 8 |
| ProposalTermsForm (guided: once / streak_n_days / finish_list) | **Wired** | ProposalTermsForm.tsx, slice4 tests 2/4/6 |
| ProposalArtifactCreator prefill-confirm (task / routine / tracker, never silent auto-create) | **Wired** | slice4 tests 3/4/6 |
| ProposeRewardSection: kid pitch, withdraw, notification to mom | **Wired** | slice4 test 2 |
| SelfProposeSection: adult self-propose, private-by-default visibility | **Wired** | slice4 test 7 |
| ProposalCard in Queue RequestsTab: Approve / Counter / Decline | **Wired** | slice4 tests 3/4/5 |
| ONE-round counter loop (mom counters once, kid accepts/declines) | **Wired** | slice4 test 4 |
| Notification integration (`reward_proposal_received/outcome/countered/counter_response`) | **Wired** | useRewardProposals.ts, slice4 test 2 + this close-out's Stop 15 |
| "Propose a deal" settings toggle (Guided+ only, never Play) | **Wired** | slice4 test 1 |
| Bug fix: `createNotification` RETURNING clause broke ALL cross-member notifications platform-wide | **Wired (fixed)** | Root-caused and fixed during Slice 4; verified via direct probe + slice4 test 2 |
| Bug fix: `TaskCreationModal.initialAssigneeId` clobbered on already-open mounts | **Wired (fixed)** | Fixed during Slice 4; FO behavior unchanged |
| **Convention #277 — Claude-driven Mom-UI visual verification (this close-out, 2026-07-04)** |
| Casey's Propose a Deal (kid pitch form → pending state) | **Wired** | Eyes-on tour Stop 12, screenshots 25-26, all 3 viewports, Claude-read and judged |
| Mom's Queue — proposal pitch card + counter round | **Wired** | Eyes-on tour Stop 13, screenshots 27-28, all 3 viewports, Claude-read and judged |
| Dad's Promise Yourself a Reward (self-propose, private-by-default) | **Wired** | Eyes-on tour Stop 14, screenshots 29-31, all 3 viewports, Claude-read and judged — surfaced and fixed 2 real test-code bugs (missing `.first()` strict-mode defense; screenshot-timing race with modal close) along the way |
| Notification bell — cross-member proposal request arrives | **Wired** | Eyes-on tour Stop 15, screenshots 32-33, all 3 viewports, Claude-read and judged |
| **LiLa knowledge (Part B, this close-out)** |
| help-patterns.ts — "propose a deal" / "my rewards" pattern | **Wired** | `my_rewards` category added |
| feature-guide-knowledge.ts — `/my-rewards` PAGE_KNOWLEDGE entry | **Wired** | Added |
| feature-guide-knowledge.ts — Propose/self-propose USE_CASE_RECIPE | **Wired** | Added |
| FeatureGuide on /my-rewards | **Wired** | Already added in Slice 2 (MyRewardsPage.tsx) |
| **Registered follow-ups (STUB_REGISTRY "KIDS-REWARDS-PAGE Follow-Ups")** |
| Freeform / LiLa-assisted proposals | **Stubbed** | Post-MVP |
| Multi-round counteroffers | **Stubbed** | Post-MVP |
| Play-shell Propose-a-Reward variant | **Stubbed** | Post-MVP — correctly never built (gate §5) |
| Un-redeem reversal audit history | **Stubbed** | Post-MVP |
| fo-command-center pin should self-seed `family_overview_configs` | **Stubbed** | FO-COMMAND-CENTER-owned follow-up |
| `/queue?tab=requests` dead action_url (pre-existing since PRD-15 Build G) | **Stubbed** | PRD-15/queue-surface follow-up |
| **Slice 5 — Parent PrizeBoard arrangement + full spec (NEVER EXECUTED)** | **Missing → registered as Stubbed** | See STUB_REGISTRY "Slice 5" row added 2026-07-04. By-kid/By-date arrangement toggle, prizes-only summary strip, and `tests/e2e/features/kids-rewards-page.spec.ts` were never built. The #271 test and LiLa knowledge/FeatureGuide items from the Slice 5 plan ARE done (via Slice 2 and this close-out respectively) — only the PrizeBoard arrangement UI + dedicated spec remain open. Founder instructed close-out to proceed 2026-07-04; this is a deliberate, disclosed scope reduction, not a silent gap. |

**Tally: ~49 Wired (incl. 2 real bugs found and fixed during this close-out's own verification pass), 8 Stubbed (6 pre-existing Post-MVP/follow-up + Slice 5 items), 0 silently-Missing (Slice 5 explicitly registered as a stub, not dropped).**
