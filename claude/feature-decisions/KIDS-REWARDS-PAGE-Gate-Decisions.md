# KIDS-REWARDS-PAGE — Founder Gate Decisions

> **Status:** GATE APPROVED — founder decisions resolved 2026-06-12
> **Companion to:** `claude/feature-decisions/Kids-Rewards-Page.md` (pre-build recon document, Follow-Up Build A)
> **Authority:** This document resolves Q1–Q10 from the recon doc and adds founder-directed scope. Where this document and the recon doc differ, this document wins. Founder vision is the law for this build.
> **Scope directive:** ALL scope below ships in this build. The orchestrator decides internal organization, slicing, and dispatch sequencing — sequence by dependency and build-it-right principles. No MVP shortcuts without explicit founder approval; "no deferred quality" standard applies.

---

## 1. Resolved Decisions (Q1–Q10)

**Q1 — Section opt-in location: APPROVED with one change.**
`family_members.preferences.my_rewards_sections` (JSONB), managed from a new collapsible "My Rewards Page" section in `GamificationSettingsModal` that also surfaces the existing `show_my_rewards` toggle. **Change from recon recommendation:** the finances section default MIRRORS `child_can_see_finances` per kid (not a blanket OFF). One switch of intent; the two surfaces never disagree. Other defaults as recommended: creatures/coloring/custom_rewards ON when gamification enabled; points ON. New section keys added by this build (see Sections 4–6): `propose` (default OFF, Guided+ only), `victories` (default OFF).

**Q2 — Redeem: APPROVED, kid-final with mom reversal.**
- Guided/Independent: Redeem button with confirmation dialog ("Use your reward now?"). Kid-final. Quiet fire-and-forget notification to mom on redeem (same pattern as dad-payment notifications).
- Play: no Redeem button; card shows "Ask a grown-up to use it!" Mom redeems from PrizeBoard as today.
- **NEW — Un-redeem (mom only):** PrizeBoard shows an "Un-redeem" action on redeemed cards. Reversal clears `redeemed_at`/`redeemed_by`; the card returns to the kid's active rewards, redeemable again. Clean reset for v1 — no reversal history entry, no confusing state shown to the kid. (`earned_prizes` is not under the append-only rule; UPDATE is permitted. Append-only applies to `financial_transactions` only — Convention #223.)
- No `redeem_requires_mom` pending state. Not in this build.

**Q3 — Shells: APPROVED as recommended.**
One shared `MyRewards` sections component. Guided + Independent (+ Adult when enabled) at `/my-rewards`. Play keeps `/rewards` and renders the same component with Play tokens: 56px targets, finances section never rendered (PRD-28 hard rule), no Redeem button. Creature drag on Play reuses `StickerOverlay` touch handlers with large page-flip affordances (edge arrows + page dots). **Eyes-on Mom-UI verification at checkpoint must confirm the Play page-flip gesture works for small fingers.**

**Q4 — Print/Download: APPROVED as recommended.**
Keep the existing lineart browser-print flow (records `printed_at`). ADD a Download action for the lineart PNG. **Also include** (confirmed in, not optional): download of the finished color PNG as a keepsake. No PDF library.

**Q5 — Image upload attachment points: APPROVED, all prongs, expanded.**
All of the following, now ("if there is plumbing to do, do it now"):
- (a) Contract form RewardRules: `custom_reward_godmother_configs` gains optional `reward_image_url`; `execute_custom_reward_godmother` snapshots it into `earned_prizes.prize_image_url` (+ name; fixes the text-only gap in migration 100214).
- (b) Opportunity/task rewards: optional image on `tasks`, `task_templates`, `list_items` reward config, shown when reward type is privileges/family_activities; snapshotted at award time.
- (c) Edit-later: mom can set/replace the image on an already-earned prize card from PrizeBoard (UPDATE `earned_prizes.prize_image_url`).
- (d) **NEW — Routines:** both per-step rewards and routine-completion rewards get the image option and the earned-prize pipeline. **Do not guess the routine reward schema — query the live schema first**, then mirror the tasks/list_items pattern against what actually exists.
- (e) **NEW — Trackers:** per the Unification Principle (Section 3). Star Chart spec already carries `prize_description`/`prize_image_url`; verify live wiring before specifying.
- Bucket: `gamification-assets`, path `reward-images/{familyId}/…`, reuse existing `ImageUploader`.

**Q6 — Provenance: VERIFIED, no decision needed.** History resolves "how they earned it" via `source_type`/`source_id` joins. Table is empty in production; no backfill.

**Q7 — Privileges/family_activities pipeline gap: IN SCOPE, fires on approval.**
On completion of a task/opportunity/routine whose reward type is privileges or family_activities, create an `earned_prizes` row (prize_text = reward description, image per Q5, provenance to source). **Timing rule:** for items requiring approval, the prize row is created at mom's APPROVAL, not at kid's completion-mark. No-approval items create it on completion.

**Q8 — History contents: APPROVED as recommended.** Previously Redeemed = redeemed `earned_prizes` only. Money history stays in the ledger; the finances section links into it.

**Q9 — Parent side + kid finances summary: REVISED from recon recommendation.**
- PrizeBoard Prizes tab: add the LedgerView-pattern arrangement toggle — "By kid" (default) / "By date." Summary strip is **prizes and privileges only** — unredeemed prize counts. **No allowance dollars in the strip.** Money stays on the Allowance/Balance tabs. No new page.
- Kid side: when the finances section is enabled, the kid's My Rewards page shows ONE number — **total money owed to them** (unpaid allowance periods + unpaid money rewards from any source) — clicking through to the existing `LedgerView mode='self'` for the breakdown (allowance, paid opportunities, etc.). This number MUST reconcile with the Balance page (dashboard-truth, Convention #271). Play shell: finances section never renders, period.

**Q10 — Feature keys: APPROVED.** `my_rewards_page` already registered (migration 100248). No new tier keys; section opt-ins are mom preferences, not permissions.

---

## 2. Founder-Confirmed Vision Pillars (unchanged from recon)

1. Mom opt-in per section, per kid.
2. Creature pages with free placement AND cross-page drag-to-edge page flip (app-icon metaphor); next page becomes available when earned.
3. Coloring pages section: active pages + completed pages with print and download.
4. Custom reward cards with images, kid Redeem (per Q2), Previously Redeemed history with provenance (what / how / when earned / when redeemed), visible only when clicked into.
5. Parent Prize Board with by-kid / by-date arrangement (per Q9 shape).

---

## 3. NEW — Earning-Surface Unification Principle (founder-directed)

> **Any surface where mom can promise a custom reward gets (a) an optional reward image and (b) creates an `earned_prizes` row when earned, with provenance pointing back to the source.**

This covers contracts, opportunities/tasks, list items, routines (steps + completion), and trackers (star charts, streaks, custom reward goals, gameboards, potty charts, etc.) — and any future earning surface inherits it. Every promise in the system flows into ONE owed-rewards pipeline with one redemption story. This is what makes the Prize Board genuinely "everything I owe my kids."

**Guardrails (binding):**
- **G1 — Recon before wiring trackers.** The pre-build recon did NOT survey the tracker stack live. Before specifying, recon which tracker templates and prize-config fields actually exist in production vs. spec-only. Wire `earned_prizes` creation into completion paths that are REAL today; register not-yet-built tracker surfaces as covered-by-principle for their future builds. Do not invent columns.
- **G2 — Hooks, not features.** This build adds the earning hook to existing tracker/routine completions. It does NOT build or finish any trackers or routines. If recon finds a tracker half-wired, finishing it is a registered follow-up, not silent scope absorption.

---

## 4. NEW — Dashboard Doors (founder-directed)

Promote the existing Play widgets into proper dashboard widgets available on every shell, S/M/L per the PRD-10 widget size convention:

- **Sticker-page widget:** live miniature of the member's LAST-VIEWED sticker page with creatures rendered in their actual saved positions. Click → opens the full modal (rearrange, remove from page, browse the catalogue of ALL earned creatures including unplaced). The widget is a viewport, not a toy — view-only on the dashboard; all interaction lives in the modal.
- **Coloring widget:** miniature of the current/active coloring page. Click → coloring modal.
- **Mom's control = widget placement itself.** Presence, absence, and size are normal widget add/configure actions. NO new preference toggle. (Small on a teenager's dashboard; large on Play for visual interest; absent if mom wants it only behind the rewards page.) Kid self-add/resize on Independent follows existing dashboard-edit permission — no new rule.

**Recon items:** (1) Does `member_sticker_book_state` already store last-viewed page? If not, one column. (2) Does the existing modal's All-pages tab constitute the full earned-creature catalogue including unplaced creatures? Verify; extend minimally if not. (3) How wired is the general widget grid on Guided/Independent/Adult personal dashboards in production? If real, register both as catalog widgets with S/M/L. If not, scope as "render on whatever dashboard surface exists today per shell" and register grid placement for when the grid lands. The modal door and rewards-page sections get built either way.

---

## 5. NEW — Propose-a-Reward (founder-directed)

A mom-opt-in rewards-page section (`my_rewards_sections.propose`) where a kid proposes: "Can I have [reward] if I do [task / series / streak / accomplishment]?" Mom approves, counteroffers, or declines.

**Founder decisions:**
- **Guided form, not freeform.** Kid picks "I want…" (text + optional picture) and "I will…" via simple structured choices: do a thing once / do a thing every day for N days / finish this list of things — mapping cleanly to task / streak tracker / routine-or-list. No LiLa parsing in v1 (register freeform/LiLa-assisted proposals as a future enhancement). Streamline for moms, not kids.
- **Approval = prefill-confirm, never silent auto-create.** Mom's approval opens the appropriate EXISTING creation flow (task form / tracker form / routine form) prefilled from the proposal; mom confirms (setting due dates, approval-required, values, and the reward image per Q5). A counteroffer is mom editing the prefill and sending revised terms back.
- **One-round counter.** Mom's counter replaces the terms; kid accepts or declines; done. Multi-round negotiation is a registered follow-up.
- **Lives on PRD-15 requests** — architecturally a request with a payload. **Recon item:** verify the requests infrastructure's real wiring state. If solid, proposals ride it; if not, a small `reward_proposals` table is honest and acceptable. Verify, then choose.
- **Shells: Guided and up only.** No Play version in this build (keep the form simple enough that a Play variant remains feasible later, but do not build it).
- The approved structure's reward flows into `earned_prizes` per the Unification Principle — the proposed popsicle lands on the kid's Custom Rewards section when earned.

---

## 6. NEW — Mom's Own Rewards Page + Self-Propose (founder-directed)

Mom is a member; members have rewards pages (Universal Capability Parity). Mom gets her own My Rewards page, including:

- **Self-propose:** the kid proposal flow with negotiation collapsed — mom is proposer and approver, so it's one screen: define the reward, define the earning structure (task / series / routine / streak / tracker), confirm the prefilled artifacts (auto-created via the same prefill mechanism), done.
- Her earned prizes use the same `earned_prizes` pipeline, same redemption (she redeems her own), same Previously Redeemed history with provenance.
- **Mom's own prizes do NOT appear on the Prize Board** — the Prize Board is what she owes others. Her own page is the only place her rewards live.

**Recon item (critical):** verify the prize pipeline is genuinely member-agnostic. The contracts/godmothers/`earned_prizes`/reveal stack was built with kids as earners — confirm a contract can target mom, nothing filters by role, and the reveal pipeline fires on her dashboard. If a role assumption is buried anywhere, THIS build removes it.

---

## 7. NEW — Victories Section (founder-directed)

Optional rewards-page section (`my_rewards_sections.victories`): a clickable record of previous victory/celebration messages. Tap one → see the full celebration. Read surface over existing Victory Recorder (PRD-11) data.

**Binding rules carried over:** celebration-only — nothing about what wasn't done can appear (Victory Recorder principle); section is mom-opt-in like all others.

**Recon items:** what the Victory Recorder persists per celebration, and whether a browse/history view already exists (Archives may touch this). Reuse if so; otherwise a simple list-with-modal.

---

## 8. Consolidated Live-Recon Checklist (Claude Code, before specifying — never guess schema)

1. Routine reward configuration schema — per-step and completion-level (Q5d).
2. Tracker stack — which templates and prize-config fields (`prize_description`, `prize_image_url`) exist live vs. spec-only (G1).
3. `member_sticker_book_state` — last-viewed page storage (Section 4).
4. Sticker modal All-pages tab — full earned-creature catalogue including unplaced? (Section 4).
5. Dashboard widget grid wiring on Guided/Independent/Adult shells (Section 4).
6. PRD-15 requests infrastructure — real wiring state (Section 5).
7. Prize pipeline member-agnosticism — mom as earner end to end, including reveals (Section 6).
8. Victory Recorder persistence + any existing browse view (Section 7).
9. `fireDeed` source_type values in current code — confirm the provenance join targets before building the history resolver (Q6).

All findings reported back through the normal checkpoint flow; PRE_BUILD_PROCESS.md ritual applies; Playwright proof required before anything is declared done; selective staging; per-slice lint closure; migrations via `supabase db push --linked`; Convention #271 reconciliation explicitly tested for the kid's owed-money number vs. the Balance page.

---

## 9. Non-Goals (recon Section 7 stands, plus additions)

All recon non-goals stand (no PRD-24 point-spend economy, no treasure boxes, no new reveal animations, no UNDO cascade, no multiplayer sticker pages, no new randomizer UX). Added by this gate:
- No LiLa parsing of freeform proposals (registered enhancement).
- No multi-round counteroffers (registered follow-up).
- No Play-shell Propose-a-Reward.
- No reversal audit history on un-redeem (clean reset; easy add later if wanted).
- No finishing of half-built trackers or routines discovered in recon (G2 — registered follow-ups).
- No `redeem_requires_mom` pending-approval state.

---

## 10. Plain English — What This Build Means

**For Tenise:** When this ships, every reward you've ever promised — on a contract, an opportunity, a routine, a potty chart, a streak — lands in one place. Your Prize Board shows everything you owe, sortable by kid or by date. Each kid gets a rewards page you control section-by-section: their creatures (now draggable across pages like phone icons), their coloring pages (printable AND downloadable), their reward cards with pictures, the money owed to them if you allow it, their victory history, and — for Guided and up — a "propose a deal" form where they pitch you "ice cream if I do X" and you approve, counter, or decline with everything pre-filled for you. You get your own rewards page too, where you can promise yourself things and earn them the same way the kids do. If a kid redeems something by accident, you can reverse it and the reward comes back. And tiny live windows into their sticker and coloring pages can sit on any dashboard at whatever size you choose — or not at all.

**For mom users generally:** Rewards stop being scattered promises and become a single trustworthy ledger of what's owed, with the kid-facing side fun and the mom-facing side honest. Nothing earned is ever taken away; nothing unchosen is ever shown; money and points never mix; little kids see celebration, not dollar amounts.

---

## 11. Post-Gate Founder Approval — Recon Rulings & Slice Plan (2026-06-12)

> Founder-approved after the Section 8 live recon. These rulings are final and amend the sections above where noted.

- **R1 approved:** Per-step routine rewards don't exist (no schema, no code) — routine COMPLETION rewards wire now at the existing task-completion/approval hook points; per-step rewards registered in STUB_REGISTRY as a covered-by-principle follow-up (G2).
- **R2 approved:** Trackers have no goal-reached detection — the prize **image** field is added to tracker prize config now; earned-prize firing on tracker completion registered in STUB_REGISTRY as covered-by-principle until goal detection exists (G1).
- **R3 approved:** Dedicated `reward_proposals` table (family_requests has no payload column and its status model can't carry a counter round). Proposal cards render inside the existing Queue RequestsTab — one decision inbox preserved (Convention #66).
- **R4 REVISED (final form):** **No mom sidebar entry; Convention #274 untouched.** Mom's personal rewards live in the **Prize Board Prizes tab via her own pill** in the member selector. Her pill renders for her only and shows: her prize cards with Redeem, Previously Redeemed history with provenance, and a one-screen self-propose entry. Her self-rewards are excluded from the owed-summary strip and the By-date owed list.
- **R5 approved:** `member_sticker_book_state.last_viewed_page_id` new column; `active_page_id` award-landing semantics untouched.
- **R6 approved:** Kid redeem via `redeem_own_prize` SECURITY DEFINER RPC (own row, redeem fields only).

**Adult self-rewards (founder-directed):** Any adult can self-propose and earn personal rewards. Dad's capability rides his existing Adult `/my-rewards` page (`show_my_rewards` gate) with the same self-propose and controls — no Prize Board access required. Each self-created reward carries **per-reward visibility**: private to creator by default, shareable with selected members via a member picker. Shared cards appear to the recipient (under mom's pill for mom's, on the owner's surfaces otherwise). **Enforcement at the database/permissions layer per the Cross-Sibling pattern — never rendered-then-hidden; private rows must never reach another member's client.**

**Visibility convention (recorded):** Mom-sees-all remains the default, including adults' private self-rewards. Mom may voluntarily grant, per member, **"personal rewards privacy"** — that member's private self-rewards become private from mom too, enforced at the query layer. Reversible by mom. The grant lives with the other per-member My Rewards settings (Gamification Settings "My Rewards Page" section).

**Slice 1 addition (founder-directed):** The reward image picker is **three-mode everywhere it appears** — text-only (default) / mom upload / platform image library (`prize_type='platform_image'` path). Recon verdict: platform assets ARE in the embedding pipeline (`platform_assets.embedding` populated on all 622 rows; `match_assets()` RPC live; Build M `TaskIconPicker` hybrid tag+embedding precedent) → **auto-suggest top matches from the reward text** via `generate-query-embedding` + `match_assets()`. No new embedding pipeline.

**Slice plan and dispatch order approved:** 1 → 2 → (3 ∥ 4) → 5, migrations from 100266. PRE_BUILD_PROCESS ritual, Playwright proof per slice, Convention #271 reconciliation test on the kid owed-money number explicitly included in slice 5.

**Slice 2 founder amendments (2026-06-12, during eyes-on review):**
- **Page default flipped to ON.** `show_my_rewards` now defaults TRUE for every member — only an explicit false hides the page/nav entry. Supersedes Q2a's default-false (View As Identity-Scope build) and amends Q1's "defaults when mom enables the page" framing: the page is on out of the box; mom turns it OFF per member if she wants. Origin: founder saw empty View As navs ("Can we default to on").
- **Play money is a mom OPT-IN, default OFF.** Amends Q9's "Play shell: finances section never renders, period" and narrows PRD-28's "Play mode children ALWAYS see completion % only" for THIS surface: the "Money owed" toggle is offered for Play members in the My Rewards settings section, default OFF; mom's explicit opt-in renders the money section on the kid's Fun page. Buffet Principle — maximalist option, conservative default. PRD-28's rule stands unchanged on all OTHER surfaces (allowance widget %-only, LedgerView hideMoney on Balance surfaces, etc.).
- **Play nav: all-Lucide icons.** The platform_assets images read as inconsistent in the bottom nav ("I don't like how things look from the asset library — all lucide icons for now so it looks consistent"). Emoji removed either way (emoji rule). Revisit when a matched nav icon set exists in the asset library.
- **Play nav simplified to TWO tabs: Home + Fun.** Two retirements:
  - **Stars/Victories tab** → the Fun page's Victories section replaces it; victories section defaults ON for Play (amends Q1's victories-OFF default for Play only).
  - **Tasks tab** → Play kids complete tasks right on the dashboard via `PlayTaskTileGrid` (Convention #217); the standalone `/tasks` page is the full adult experience (13 prioritization views, Eisenhower, Kanban) — wrong for a Play child.
  Result: Home (dashboard w/ task tiles) + Fun (rewards/sticker/victories). Play-scoped only — Guided keeps its full nav incl. Tasks + Victories (PRD-25 / Convention #124).

---

## 13. Slice 3 Creature Page — Founder Design Direction (2026-06-12)

> Captured during Slice 2 close-out, before Slice 3 dispatch. **Refines** the gate's Pillar 2 / Slice-Plan creature interaction: a horizontal-swipe strip is added for navigation, AND drag-to-edge page flip is retained for moving creatures between backgrounds. Both coexist (the phone-home-screen metaphor exactly). To be folded into the formal Slice 3 plan when that slice is dispatched.

**The interaction (build now):**
- **Backgrounds are a horizontal swipe strip**, NOT one full page at a time. The member swipes side-to-side along the strip to BROWSE between their unlocked backgrounds (hands empty = navigation). Each background renders the creatures placed on it, at their saved positions.
- **Drag-to-edge page flip is RETAINED — for MOVING a creature between backgrounds** (founder: "we still want drag to edge page flip, as moving them from page to page is still desired"). While DRAGGING a creature, pushing it to the left/right edge of the current background advances the strip to the adjacent background, so the member can drop the creature onto a DIFFERENT background than the one it started on. This is the cross-page move; swipe is for browsing, drag-to-edge is for carrying. Both gestures coexist — exactly like phone home screens (swipe to browse pages; hold an app icon and shove it to the edge to flip to the next page and place it).
- **The whole thing is ONE self-contained frame** — the background swipe strip AND the unplaced-creatures scrollbar live together "in the same frame." Decided: scrollbar at the **BOTTOM of the frame** (NOT the bottom of the page). Because it's bottom-of-FRAME, it does NOT stack against or collide with the Play bottom nav — that earlier con is dissolved. The background scene is the hero/top focus of the frame; the creature tray is the strip beneath it inside the same bordered surface.
- **Unplaced creatures live in a horizontal scrollbar at the bottom of the frame** (side-to-side scroll). Holds every earned-but-unplaced creature.
- **The unplaced tray is HIDEABLE via a pull tab** (founder: "similar pull tab that we have for the smart notepad"). Reuse the existing shared `<PullTab orientation="bottom">` (`src/components/shared/PullTab.tsx` — vibe-aware, required accessible `label`, already powering the LiLa + Notepad drawers). Hidden state → the assembled background scene becomes the full hero of the frame ("when there is a full created image, that is the main top focus, or hero of sorts"). Tab toggles the tray back up.
- **Two placement gestures from the unplaced strip, both supported:** (a) **touch-select then touch-place** — tap a creature in the unplaced strip to select it, then tap a spot on a background to drop it there; AND (b) **drag-and-drop** — drag a creature from the strip onto a background (and drag-to-edge mid-drag to reach another background). Drag sets exact x/y; touch-place sets x/y at the tapped point.
- Small-finger eyes-on verification required (Play), same standard as the rest of Slice 3 — especially the drag-to-edge flip threshold (must be reachable for little fingers without accidental flips while placing near an edge).

**The set/theme picker (prepare for now, BUILD LATER):**
- A menu to choose **which background + character set** you're working with. We currently have exactly ONE set live (`gamification_themes` = 1 row), so the picker is not built yet — but Slice 3 MUST be structured so it slots in above the swipe strip with zero rework.
- "Prepare for it now" means: the creature section reads the member's ACTIVE set (`member_sticker_book_state.active_theme_id`) and filters backgrounds + creatures by `theme_id` from the start. Never hardcode the single theme; never assume one set.

**Data-model mapping (recon-confirmed against live_schema — no new tables needed for the core interaction):**
- Backgrounds in the swipe strip = `gamification_sticker_pages` rows for the active `theme_id`, gated to the member's unlocked set via `member_page_unlocks` (sort by `sort_order`).
- Placed creatures on a background = `member_creature_collection` rows where `sticker_page_id` = that page, rendered at `position_x`/`position_y` (the existing `StickerOverlay` 0–1 relative coords).
- Unplaced scrollbar = `member_creature_collection` rows where `sticker_page_id IS NULL` (the catalogue of earned-but-unplaced; recon finding #4 confirmed `sticker_page_id` is nullable and `useMoveCreature` already accepts a `newPageId`).
- Place a creature = set `sticker_page_id` + `position_x/y` via `useMoveCreature`. Remove-from-page = set `sticker_page_id = NULL` (returns it to the unplaced strip).
- Future set picker = a selector over `gamification_themes` that writes `member_sticker_book_state.active_theme_id`.
- `last_viewed_page_id` (R5, new column) records which background in the strip was last viewed (the swipe position to restore on return).

**What this changes vs. the build-file Slice Plan text:** the Slice-3 plan ADDS the horizontal swipe strip (navigation) + unplaced-scrollbar + dual-gesture placement. The original "cross-page drag-to-edge page flip" is RETAINED but re-scoped to its real job — carrying a creature to another background mid-drag, not page navigation (swipe owns navigation now). The `StickerOverlay` extension + `useMoveCreature newPageId` reuse still apply. Page-dots may remain as a "where am I in the strip" position indicator (optional, eyes-on); navigation edge-arrows are replaced by swipe.

**Coloring section layout (founder decision 2026-06-12): CARD GALLERY.** Active coloring images render as cards on top (each showing its progressive grayscale→color reveal progress); completed ones sit below as a "gallery of finished art." Tap any card → full view with the existing print flow + the new Download actions (lineart PNG + finished color PNG keepsake, per Q4 — no PDF lib). NOT a creature-style swipe strip: coloring has no cross-page arranging need, so a strip would add swipe for swipe's sake. Surfaces the EXISTING reveal mechanic (`useColoringReveals`, `ColorRevealCanvas`, `member_coloring_reveals`, progressive reveal via task completions — Build M); Slice 3 only adds the rewards-page gallery surface + Download. The completed wall is its own emotional payoff.

**Dashboard doors default (founder decision 2026-06-12): MOM PLACES THEM.** The sticker-book miniature and coloring miniature widgets live in the widget picker like any other widget — mom adds them to whichever kid dashboards she wants, at S/M/L (PRD-10). NOT auto-seeded onto kid dashboards (dashboard real estate stays mom-curated; matches gate Section 4 "Mom's control = widget placement itself. NO new preference toggle"). A kid with no door still reaches everything via the Fun tab. Confirms gate Section 4 as written — no auto-appear.

---

## 12. Starter Prompt for the Orchestrator

> Read `KIDS-REWARDS-PAGE-Gate-Decisions.md` in full alongside the existing KIDS-REWARDS-PAGE pre-build recon document. The gate document is founder-approved and authoritative where the two differ. All scope ships in this build; you decide the internal organization and dispatch sequencing by dependency. Begin with the Consolidated Live-Recon Checklist (Section 8) — query the live schema and code for every item before specifying anything; never guess at columns or tables. Run PRE_BUILD_PROCESS.md, then present your proposed slice plan and worker dispatch order for founder approval before any code is written. Playwright output is the only proof of done.
