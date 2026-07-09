# PRD-31 — DRAFT Tier Chart (for founder markup)

> **Status: DRAFT v1.1 — LIVING DRAFT (founder ruling 2026-07-08).** Principles approved 2026-07-08: (A) Essential-is-mom-only story KEPT — every non-mom `E` cell below converts to `En` in Slice 1 unless the founder marks an exception; (D) `safety_monitoring_basic` moves DOWN to Essential (mom cell), AI layer stays FM; the three default rules below are APPROVED. **The founder's cell-level markup happens on her schedule — this chart stays a living draft until flip time (her beta strategy); later marks flow in via seed updates or the Screen-4 admin grid once built. Slice 1 does not block on full markup.**
> Built 2026-07-08 by the PRD-31 pre-build audit directly from the LIVE `feature_access_v2` seeds (390 rows) joined to `feature_key_registry` (222 keys) and `subscription_tiers`. Nothing here is invented — every cell is what production currently says. Your job is to REACT: mark cells up, don't compose from scratch.
>
> This file is the human-readable export required by Convention #256 (tier chart as single source of truth) and the seed for Phase 41 (Tier Assignment Review). Once you mark it up, Slice 1 turns your marks into `feature_access_v2` seed corrections, and the Screen-4 admin grid becomes the LIVE version of this chart from then on.

## How to mark this up

- **Cell codes:** `E` = Essential · `En` = Enhanced · `FM` = Full Magic · `C` = Creator · `Nv` = Never (not available to this role at any tier) · `—` = no assignment exists yet · `?` = a row exists but its tier is NULL (seed bug — needs a real value)
- **Columns:** Mom | Dad/Adult | Special Adult | Teen | Guided | Play
- Write your corrections directly next to a cell (e.g. `E→En`), or strike a whole row and write the intent. Anything you leave untouched ships as-is when gating activates.
- Rows flagged **⚠** are the ones this audit judges most questionable — read those notes first.
- **You don't have to resolve every `—` now.** The draft rule below covers unassigned keys safely; Phase 41 is the deadline for a complete chart, not this markup pass.

## Default rules — ✅ APPROVED (founder, 2026-07-08); they cover 78 unassigned keys + 45 broken rows

1. **Unassigned key (`—` across a row or in a cell):** treated as **UNGATED (allowed)** when the activation switch flips — nothing silently disappears from a paying family because we forgot to seed a row. Every `—` is flagged in the admin grid as "needs assignment" until Phase 41 closes them out.
2. **`?` rows (NULL tier, 45 rows):** Slice 1 repairs each to a real tier — proposed repair value is noted per row below; default repair is **the same tier as the feature's nearest sibling key**.
3. **Special Adults:** default **Never** for everything except the Permission-Matrix Addendum's SA list (tasks/calendar for assigned kids, trackable events, notes/instructions, shift notes, messages-to-parents, LiLa Help) — shift-scoping (PRD-02) stays the primary control; the tier chart just shouldn't accidentally hand SAs whole features.

## THE FIVE SYSTEMIC FLAGS (bigger than any one row)

1. **✅ RESOLVED (founder 2026-07-08 — OD-31-A): the Essential-is-mom-only story is KEPT.** The PRD says Essential = "Mom-only account — no connected family members," and Enhanced's entire pitch is "Connected family" — but the live seeds put dozens of family-facing features at Essential for dads and kids (`tasks_basic`, `messaging_basic`, `meetings_basic`, `gamification_basic`, `play_dashboard`, `reward_shop`, `wishlists_basic`, `rhythms_basic`, `timer_basic`, `opportunity_lists`…). **Ruling: Slice 1 mechanically converts every non-mom `E` cell in this chart to `En`; the founder marks per-row exceptions during her own markup passes.** The ⚠ "Systemic flag 1" row notes below stand as the inventory of affected rows.
2. **⚠ Creator is completely empty.** Zero rows anywhere assign anything to `C`. Per the PRD this is deliberate (Creator = Full Magic + expansion cards), but it means FM and C are functionally identical in the chart. Confirm that's still the intent so nobody "fixes" it later.
3. **78 keys have no assignments at all** — including entire live, shipping surfaces: **all of BookShelf (8 keys), all of Family Hub (4), Family Overview (2), all Guided-shell keys (7), Family Login, Special Adult access, Studio Queue/Queue Modal/RoutingStrip, My Rewards, Family Goals, MindSweep Auto**. Rule 1 keeps them safe at activation, but the Enhanced pillars (family_login, family_hub, family_dashboards' siblings) deserve real values before gating flips.
4. **Management-grant keys are mixed into the tier chart** (`financial_tracking`, `studio`, `reward_rules`, `task_assignment`, `gift_planning`, `meal_planning`). These are Convention #274/#276 explicit-grant keys — mom grants them per-dad; they are not tier features in the same sense. Section M proposes the composition rule (tier gates whether the grant SYSTEM is available; the grant itself stays mom's choice; tier never auto-grants).
5. **Vocabulary duplicates need merging before the chart is trustworthy** (Section N): `smart_notepad` (unregistered) vs `notepad_basic`; `duration_tracking` vs `task_duration_tracking`; `task_assignment` vs `tasks_family_assignment` (both display as "Task Assignment"); `quicktasks` and `meal_planning` unregistered but carrying live rows.

---

## A. Personal Growth (PRD-06 / 07 / 08 / 11 / 18)

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| Guiding Stars (`guiding_stars_basic`) | E | E | — | E | — | — | |
| Craft with LiLa (`guiding_stars_ai_craft`) | En | — | — | — | — | — | |
| Family Guiding Stars (`guiding_stars_family`) | — | — | — | — | — | — | Live on Hub today — assign (suggest En) |
| Best Intentions (`best_intentions`) | E | E | — | E | — | — | ⚠ Guided kids use Best Intentions daily (PRD-25 can't-hide section) — Guided cell should not be `—` |
| Intention Tracker Views (`best_intentions_tracker_views`) | — | — | — | — | — | — | |
| InnerWorkings (`innerworkings_basic`) | E | E | — | E | — | — | |
| Self-Discovery (`innerworkings_discovery`) | En | — | — | — | — | — | |
| InnerWorkings Upload (`innerworkings_upload`) | — | — | — | — | — | — | |
| InnerWorkings Context (`innerworkings_context`) | — | — | — | — | — | — | |
| Connection Preferences (`connection_preferences`) | E | E | E | E | E | — | ⚠ SA at Essential — collides with Rule 3 (SA default Never) |
| Journal (`journal_basic`) | E | E | — | E | — | — | |
| Journal AI Tags (`journal_ai_tags`) | En | — | — | — | — | — | |
| Journal AI Context (`journal_ai_context`) | — | — | — | — | — | — | |
| Smart Notepad (`notepad_basic`) | E | E | — | E | — | — | |
| Notepad Voice (`notepad_voice`) | E | — | — | — | — | — | |
| Review & Route (`notepad_review_route`) | En | — | — | — | — | — | |
| Notepad AI Titles (`notepad_ai_titles`) | — | — | — | — | — | — | |
| Victory Recorder (`victory_recorder_basic`) | E | E | — | E | — | — | ⚠ Guided/Play kids record victories today (Ta-Da list is core celebration) — `—` for kids looks wrong; suggest E/En for Guided+Play |
| Celebration Narratives (`victory_recorder_celebrate`) | — | — | — | — | — | — | |
| Mom's Picks (`victory_moms_picks`) | — | — | — | — | — | — | |
| DailyCelebration (`daily_celebration`) | — | — | — | — | E | E | ⚠ Inverted: ONLY kids have rows; mom/teen `—`. Glossary says Essential-Enhanced for the family. Assign mom+teen |
| Reflection Prompts (`reflections_basic`) | E | — | — | — | — | — | Teens answer reflections in rhythms — teen `—` questionable |
| Custom Reflections (`reflections_custom`) | — | — | — | — | — | — | |
| Export Reflections (`reflections_export`) | — | — | — | — | — | — | |
| Morning/Evening Rhythms (`rhythms_basic`) | E | E | — | E | E | E | ⚠ Systemic flag 1 (kids at E) |
| Periodic Rhythms (`rhythms_periodic`) | En | En | — | En | — | — | |
| Custom Rhythms (`rhythms_custom`) | En | En | — | En | — | — | |
| MindSweep-Lite (`rhythm_mindsweep_lite`) | E | E | — | E | — | — | |
| Morning Insight (`rhythm_morning_insight`) | En | En | — | En | — | — | |
| On the Horizon (`rhythm_on_the_horizon`) | E | E | — | E | E | — | |
| Feature Discovery (`rhythm_feature_discovery`) | E | E | — | E | — | — | |
| Rhythm Tracker Prompts (`rhythm_tracker_prompts`) | En | En | — | En | — | — | |
| Carry Forward Fallback (`rhythm_carry_forward_fallback`) | E | E | — | E | E | E | |
| AI Dynamic Prompts (`rhythm_dynamic_prompts`) | — | — | — | — | — | — | |

## B. Tasks, Studio & Lists (PRD-09A / 09B / 17)

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| Tasks (`tasks_basic`) | E | E | — | E | E | E | ⚠ Systemic flag 1 — kids/dad at E vs "Essential = mom-only." SA `—` also collides with the SA addendum list (tasks for assigned kids should be available) |
| Task Views (13 views) (`tasks_views_full`) | En | — | — | — | — | — | ⚠ Pure-JS lenses on tasks mom already has; gating views at En feels nickel-and-dime — consider E |
| Routines (`tasks_routines`) | En | — | — | — | — | — | ⚠ Dad completes/co-runs routines today; dad `—` needs a value. Kids EXPERIENCE routines via tasks_basic — clarify that the key gates AUTHORING |
| Task Assignment (`tasks_family_assignment`) | En | — | — | — | — | — | ⚠ Display-name collision with grant key `task_assignment` (Section M/N) |
| Approval Workflows (`tasks_approval_workflows`) | — | — | — | — | — | — | |
| Opportunities (`tasks_opportunities`) | — | — | — | — | — | — | Opportunity boards live for all shells today (`opportunity_lists` has E×6) — near-dupe pair, see N |
| Opportunity Lists (`opportunity_lists`) | E | E | E | E | E | E | ⚠ SA at E collides with Rule 3 |
| Sequential Collections (`tasks_sequential`) | — | — | — | — | — | — | |
| Sequential Advancement (`sequential_advancement`) | En | En | — | En | En | — | |
| Rotating Assignments (`tasks_rotation`) | — | — | — | — | — | — | |
| Task Templates (`tasks_templates`) | — | — | — | — | — | — | |
| Task Queue (`tasks_queue`) | — | — | — | — | — | — | |
| Pomodoro (`tasks_pomodoro`) | — | — | — | — | — | — | `timer_advanced` already covers pomodoro at En — near-dupe, see N |
| Task Breaker Text (`tasks_task_breaker_text`) | En | — | — | — | — | — | |
| Task Breaker Image (`tasks_task_breaker_image`) | FM | — | — | — | — | — | Mode deactivated 2026-07-04 (migration 100281); key kept for reactivation — fine |
| Teen Studio (`tasks_teen_studio`) | — | — | — | — | — | — | Near-dupe of `studio_teen_access` (which says teen FM) — see N |
| Duration Tracking (`duration_tracking`) | E | E | — | E | E | — | ⚠ Dupe of `task_duration_tracking` below — merge (see N) |
| Task Duration Tracking (`task_duration_tracking`) | E | E | — | E | E | E | ⚠ Dupe of above |
| Task Progress Tracking (`task_progress_tracking`) | E | E | — | E | E | E | |
| Task Session History (`task_session_history`) | E | E | — | E | E | E | |
| Task Soft Claim (`task_soft_claim`) | E | E | — | E | E | E | |
| Linked Routine Steps (`linked_routine_steps`) | En | En | — | — | — | — | Kids RENDER linked steps daily; key gates authoring — OK if that's the meaning |
| Curriculum AI Parse (`curriculum_ai_parse`) | En | En | — | — | — | — | |
| Lists Basic (`lists_basic`) | E | E | ? | E | — | — | ⚠ SA cell is a NULL-tier row — repair (suggest per SA addendum: allowed, shift-scoped) |
| Always-On Lists (`lists_always_on`) | E | E | — | E | — | — | |
| Purchase History (`lists_purchase_history`) | E | E | — | E | — | — | |
| Lists Sharing (`lists_sharing`) | En | En | — | — | — | — | ⚠ Teens receive shared lists today — teen `—` |
| Lists AI Bulk Add (`lists_ai_bulk_add`) | En | En | — | — | — | — | |
| Lists AI Organize (`lists_ai_organize`) | En | En | — | — | — | — | |
| List Tags (`lists_tags`) | — | — | — | — | — | — | |
| AI Tag Suggestions (`lists_tag_suggest`) | — | — | — | — | — | — | |
| Reference Lists (`lists_reference`) | — | — | — | — | — | — | |
| Guided Form Lists (`lists_guided_forms`) | ? | ? | — | — | — | — | 2 NULL-tier rows — repair (suggest E mom / En dad) |
| Lists Victory on Complete (`lists_victory_complete`) | ? | ? | — | ? | — | — | 3 NULL-tier rows — repair (suggest match `victory_recorder_basic`) |
| Surprise Me Draw (`draw_mode_surprise`) | — | — | — | — | — | — | |
| Randomizer Advancement (`randomizer_advancement`) | En | En | — | En | En | — | |
| Shopping Mode (`shopping_mode`) | E | E | — | E | — | — | |
| Studio Browse (`studio_browse`) | E | ? | ? | FM | — | — | ⚠ Teen at FULL MAGIC just to browse Studio while mom is E — steep; also 2 NULL-tier rows. `studio_teen_access` (---FM--) duplicates the teen story |
| Studio Customize Tasks (`studio_customize_tasks`) | En | En | — | — | — | — | |
| Studio Customize Lists (`studio_customize_lists`) | ? | ? | — | — | — | — | 2 NULL-tier rows — repair (suggest match customize_tasks: En/En) |
| Studio Teen Access (`studio_teen_access`) | — | — | — | FM | — | — | See `studio_browse` note |
| Studio Queue (`studio_queue`) | — | — | — | — | — | — | The universal intake — everything routes through it; assign (suggest E mom) |
| Queue Modal (`queue_modal`) | — | — | — | — | — | — | |
| Quick Queue (`queue_quick_mode`) | — | — | — | — | — | — | |
| Batch Processing (`queue_batch_processing`) | — | — | — | — | — | — | |
| RoutingStrip (`routing_strip`) | — | — | — | — | — | — | Infrastructure component — candidate for "never gate" (remove from chart) rather than assignment |
| Activity List Wizard (`activity_list_wizard`) | — | — | — | — | — | — | |
| Shared Task List Wizard (`shared_task_list_wizard`) | — | — | — | — | — | — | |
| Icon Launcher Widget (`icon_launcher_widget`) | — | — | — | — | — | — | |

## C. Calendar, Dashboards, Hub & Shells (PRD-14 family / 01 / 25 / 26)

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| Personal Calendar (`calendar_basic`) | E | E | — | E | — | — | SA needs assigned-kid calendar per SA addendum — `—` collides |
| Family Calendar (`calendar_family`) | En | — | — | — | — | — | ⚠ Dad `—` — dad lives on the family calendar; assign En |
| AI Event Creation (`calendar_ai_intake`) | FM | — | — | — | — | — | |
| Event Approval Queue (`calendar_queue`) | — | — | — | — | — | — | |
| Family Member Dashboards (`family_dashboards`) | E | E | — | — | — | — | ⚠⚠ THE Enhanced differentiator ("Connected family") seeded at Essential — this single row most directly guts the tier story. Suggest En |
| Family Login & PIN (`family_login`) | — | — | — | — | — | — | ⚠ Enhanced signature feature per tier story — assign En |
| Member Account Invitations (`member_account_invites`) | — | — | — | — | — | — | Same family-connection cluster — suggest En |
| Special Adult Access (`special_adult_access`) | — | — | — | — | — | — | "Special Adult invites" named in Enhanced description — assign En |
| Family Device Hub (`tablet_hub`) | — | — | — | — | — | — | Suggest En (family surface) |
| Family Hub (`family_hub`) | — | — | — | — | — | — | ⚠ Whole PRD-14D surface unassigned; glossary says Enhanced |
| Hub Best Intentions (`family_hub_best_intentions`) | — | — | — | — | — | — | |
| Hub Slideshow (`family_hub_slideshow`) | — | — | — | — | — | — | |
| Hub TV Mode (`family_hub_tv_route`) | — | — | — | — | — | — | Glossary: Enhanced (PRD-14E) |
| Family Overview (`family_overview`) | — | — | — | — | — | — | ⚠ Mom's command center (Convention #275) unassigned; glossary Enhanced |
| Family Overview AI (`family_overview_ai`) | — | — | — | — | — | — | |
| Guided Dashboard (`guided_dashboard`) | — | — | — | — | — | — | Whole Guided shell cluster unassigned (7 keys) — assign as a set when the Essential-vs-Enhanced principle lands |
| Guided Write Drawer (`guided_write_drawer`) | — | — | — | — | — | — | The PRD's canonical "lite version" example — also needs `is_lite_version` metadata (Slice 1) |
| Guided NBT / Reading / Reflections / Spelling / Best Intentions (5 keys) | — | — | — | — | — | — | Same cluster |
| Play Dashboard (`play_dashboard`) | E | E | E | E | E | E | ⚠ Systemic flag 1 + why do mom/dad/SA/teen have rows for the Play shell at all? Role-scoping (shell) already governs — suggest keys like this get rows ONLY for the roles that can use them |
| Play Message Receive (`play_message_receive`) | E | E | E | E | E | E | Same pattern |
| Play Reading Support (`play_reading_support`) | E | E | E | E | E | E | Same pattern |
| My Rewards (`my_rewards_page`) | — | — | — | — | — | — | Live page for kids today — assign |
| Teen Privacy Panel (`teen_transparency_panel`) | — | — | — | En | — | — | ⚠ Transparency/disclosure surface gated at Enhanced — disclosure surfaces (PRD-30 monitoring disclosure lives here) should arguably NEVER be tier-gated; suggest E or ungated |

## D. Communication (PRD-15 / 16)

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| Basic Messaging (`messaging_basic`) | E | E | — | E | E | — | ⚠ Systemic flag 1 — messaging is between family members; unreachable in a mom-only Essential |
| Messaging Groups (`messaging_groups`) | E | E | — | E | — | — | |
| Message Coaching (`messaging_coaching`) | En | — | — | — | — | — | ⚠ Coaching fires on KIDS' messages but the key sits on mom — define "whose access is checked" (the configurer, not the coached kid) in Slice 1 semantics doc |
| Content Corner (`messaging_content_corner`) | En | En | — | — | En | — | Teen `—` but guided En — odd inversion; teens use Content Corner |
| Messaging LiLa (`messaging_lila`) | En | En | — | En | — | — | |
| Out-of-Nest Messaging (`messaging_out_of_nest`) | En | — | — | — | — | — | |
| In-App Notifications (`notifications_basic`) | E | E | — | E | E | — | |
| Email Notifications (`notifications_email`) | En | En | — | — | — | — | No email sender exists yet (PRD-30 stub, founder "not ready" 2026-07-08) — harmless to assign now |
| Push Notifications (`notifications_push`) | En | En | — | En | — | — | PRD-33 post-MVP |
| Family Requests (`requests_basic`) | E | E | — | E | E | — | ⚠ Systemic flag 1 |
| Requests Routing (`requests_routing`) | E | E | — | — | — | — | |
| Meetings Basic (`meetings_basic`) | E | E | — | E | E | E | ⚠ Systemic flag 1; also glossary says Essential-Full Magic range. Play kids in meetings? PRD-16 says Play has NO meetings presence — Play cell should be Never |
| Meetings Shared (`meetings_shared`) | En | En | — | En | — | — | |
| Meetings AI (`meetings_ai`) | En | En | — | — | — | — | |
| Meetings Custom Templates (`meetings_custom_templates`) | — | — | — | — | — | — | Glossary: Full Magic — assign FM |
| Facilitator Rotation (`meetings_facilitator_rotation`) | — | — | — | — | — | — | |

## E. LiLa & AI Tools (PRD-05 / 05C / 17B / 20 / 21 / 34 / 41)

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| LiLa Help (`lila_help`) | E | — | — | — | — | — | PRD says Help is free/unmetered for everyone — dad/teen `—` vs `lila_modal_access` En below is incoherent; align the LiLa entry keys as a set |
| LiLa Assist (`lila_assist`) | E | — | — | — | — | — | |
| LiLa Drawer (`lila_drawer`) | E | — | — | — | — | — | Mom-only drawer by design ✓ |
| LiLa Modal (`lila_modal_access`) | — | En | — | En | — | — | Mom `—` correct (she has the drawer). Guided kids get LiLa modals (homework help) — Guided `—` questionable |
| LiLa Family Drawer (`lila_family_drawer`) | — | — | — | — | — | — | |
| LiLa Optimizer (`lila_optimizer`) | En | — | — | — | — | — | ⚠ PRD Screen-6 example calls Optimizer "Full Magic"; tier description says Enhanced includes it. Seeds say En. Pick the canonical story (suggest En per tier description; fix the Screen-6 example copy) |
| Optimizer Templates / Context Presets / Credits (3 keys) | — | — | — | — | — | — | PRD-05C glossary: Enhanced+ — assign with Optimizer as a set |
| LiLa Response Log (`lila_ethics_log`) | — | — | — | — | — | — | ⚠ Safety/ethics transparency surface — recommend UNGATED (never tier-gate safety visibility), mark Never-gate like Convention #282 treats safety alerts |
| MindSweep Manual (`mindsweep_manual`) | E | E | — | E | — | — | |
| MindSweep Auto (`mindsweep_auto`) | — | — | — | — | — | — | ⚠ The flagship autopilot unassigned — glossary Essential-Full Magic; suggest En |
| MindSweep PWA (`mindsweep_pwa`) | En | En | — | En | — | — | |
| MindSweep Share (`mindsweep_share`) | En | En | — | En | — | — | |
| MindSweep Digest (`mindsweep_digest`) | En | En | — | — | — | — | |
| MindSweep Email (`mindsweep_email`) | — | — | — | — | — | — | Email intake dormant (DNS) — assign when wired |
| MindSweep Learning (`mindsweep_learning`) | — | — | — | — | — | — | |
| Safe Harbor (`safe_harbor`) | En | En | — | En | — | — | PRD-20 BACKBURNERED (never build without founder direction) — rows are inert; leave but tag "dormant" in registry |
| Safe Harbor Guided (`safe_harbor_guided`) | — | — | — | — | — | — | Same — dormant |
| ThoughtSift Board of Directors (`thoughtsift_board_of_directors`) | FM | — | — | — | — | — | ⚠ BoD at FM while the other 4 ThoughtSift tools sit at En — plausible (BoD is N Sonnet calls per turn = most expensive feature in the app) but confirm the split is intended |
| ThoughtSift Decision Guide / Mediator / Perspective Shifter / Translator (4 keys) | En | — | — | — | — | — | Mediator Full-Picture mode is already role-locked to mom (Convention #95) ✓ |
| Cyrano (`tool_cyrano`) | En | — | — | — | — | — | ⚠ Cyrano is SPOUSE-facing (dad writes to mom too) — dad `—` questionable; glossary Enhanced-Full Magic |
| Higgins Say (`tool_higgins_say`) | En | En | — | — | — | — | |
| Higgins Navigate (`tool_higgins_navigate`) | En | — | — | — | — | — | Inconsistent with higgins_say (dad has Say but not Navigate) |
| Quality Time (`tool_quality_time`) | En | — | — | — | — | — | Love-language set is split: 3 assigned mom-only En, 3 unassigned (gifts=En, gratitude/observe_serve/words_affirmation=—) — assign as a coherent set, incl. dad |
| Gifts (`tool_gifts`) | En | — | — | — | — | — | |
| Gratitude / Observe & Serve / Words of Affirmation (3 keys) | — | — | — | — | — | — | |

## F. BookShelf & Vault (PRD-21A / 23)

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| BookShelf Basic/Adult/Teen/Extraction/Discussions/Sharing/Export (7 keys) | — | — | — | — | — | — | ⚠ ENTIRE live PRD-23 surface unassigned (562 books in production). Glossary: Essential-Full Magic. Suggest: basic E, extraction En (real AI cost), discussions En, export FM — but this whole section is yours to shape |
| `bookshelf_adult` / `bookshelf_teen` | — | — | — | — | — | — | Audience-variant keys — also need `is_lite_version` metadata decisions |
| AI Toolbox (`ai_toolbox_browse`) | — | — | — | — | — | — | |
| Browse AI Vault (`vault_browse`) | E | ? | — | — | — | — | ⚠ Addendum's 9-key vault breakdown is only partially seeded: `vault_hearts`, `vault_comments_post`, `vault_comments_read` DON'T EXIST in the registry yet (Slice 1 adds; comments = mom-only/Never-others per addendum decision). Teen `—` here vs addendum "TBD" |
| Consume Vault Content (`vault_consume`) | E | ? | — | ? | — | — | NULL-tier rows to repair |
| Optimize with LiLa (`vault_optimize_lila`) | ? | ? | — | — | — | — | Repair (suggest En — Sonnet cost) |
| Prompt Library (`vault_prompt_library`) | ? | ? | — | — | — | — | Repair (suggest E) |
| Vault Content Requests (`vault_request_content`) | ? | ? | — | — | — | — | Addendum says mom-only — dad row should be removed/Never |
| Vault Toolbox Assign (`vault_toolbox_assign`) | ? | — | — | — | — | — | Repair (suggest En) |

## G. Gamification & Rewards (PRD-24 / 26 / PECON / FAMILY-GOALS)

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| Gamification Basic (`gamification_basic`) | E | E | E | E | E | E | ⚠ Systemic flag 1; SA at E collides with Rule 3 |
| Sticker Book (`gamification_sticker_book`) | E | E | E | E | E | E | |
| Earning Modes (`gamification_earning_modes`) | ? | ? | ? | ? | ? | ? | All 6 rows NULL-tier — repair (suggest match gamification_basic) |
| Streak Milestones (`gamification_streak_milestones`) | En | En | En | En | En | En | |
| Play Reveal Tiles (`play_reveal_tiles`) | En | En | En | En | En | En | ⚠ The reveal tiles ARE the fun of the Play shell — gating them a tier above the shell's base (E) means the youngest kids get the flattest experience unless the family upgrades. Deliberate upsell or accident? |
| Coloring Reveal Basic (`coloring_reveal_basic`) | ? | ? | ? | ? | ? | ? | All 6 NULL-tier — repair |
| Coloring Reveal Print (`coloring_reveal_print`) | ? | ? | ? | ? | ? | ? | All 6 NULL-tier — repair |
| Task Segments (`task_segments`) | ? | ? | ? | ? | ? | ? | All 6 NULL-tier — repair (suggest E — organizational, no AI cost) |
| Reward Reveals Basic (`reward_reveals_basic`) | E | E | — | — | — | — | Kids SEE reveals; keys gate authoring — confirm semantics |
| Reward Reveals Library (`reward_reveals_library`) | En | En | — | — | — | — | |
| Media Reward Reveals (`reward_reveals_media`) | En | En | — | — | — | — | |
| Reward Shop (`reward_shop`) | E | E | — | E | E | E | ⚠ Systemic flag 1 |
| Family Goals & Prizes (`family_goals`) | — | — | — | — | — | — | Live feature (Convention #278) — assign (suggest En, it's inherently multi-member) |

## H. Tracking, Financial & Homeschool (PRD-28 / 28B)

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| Basic Allowance (`allowance_basic`) | E | E | — | — | — | — | ⚠ Allowance pays KIDS — kid columns `—` while the money flows to them; semantics note needed (gates CONFIG, kids see via My Rewards) |
| Advanced Allowance (`allowance_advanced`) | En | En | — | — | — | — | |
| Multi-Pool Allowance (`tracking_allowance_multi_pool`) | — | — | — | — | — | — | Live (Phase 3.5) — assign (suggest FM — power feature) |
| Homework & Subjects (`homeschool_subjects`) | En | En | — | — | — | — | ⚠ Homeschool families are THE core segment — at En, an Essential homeschool mom can't log hours. Consider E |
| Compliance Reporting (`homeschool_compliance`) | ? | — | — | — | — | — | NULL-tier — repair; glossary Essential-Full Magic (suggest En; AI-report generation FM) |
| ESA Invoice (`compliance_esa_invoice`) | E | — | — | — | — | — | ✓ Right call — ESA moms need invoices at any tier |

## I. Safety (PRD-30) — special handling

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| Safety Monitoring Basic (`safety_monitoring_basic`) | En **→E** | En | — | — | — | — | ✅ RESOLVED (founder 2026-07-08 — OD-31-D): keyword layer moves DOWN to Essential — "basic 'mom knows' is floor-level safety, not a premium." Mom cell → E in Slice 1; dad cell stays En per the A-principle (dads only exist at Enhanced+) — founder may override dad to E in markup if she wants the recipient row lower. Crisis Override (Convention #7) is global and NEVER gated regardless ✓ |
| Safety Monitoring AI (`safety_monitoring_ai`) | FM | FM | — | — | — | — | ✅ Confirmed premium (founder 2026-07-08): AI layer (classification, starters, digests) stays FM. This is the exact key `safety-classify`'s `TIER_GATE_ENABLED` will read (Layer-2 Haiku sweeps + conversation starters gate here when flipped). Weekly digests follow this key too — Slice 4 wires it |

## J. Meals & WishLists (PRD-42 / 43)

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| KitchenCompass Recipes & Plan (`meals_basic`) | E | E | — | E | — | — | |
| AI Recipe Capture (`meals_ai_capture`) | E | E | — | E | — | — | ⚠ Sonnet VISION calls at Essential — the single most expensive per-use feature seeded at the cheapest tier. Metering will catch cost, but consider En |
| WishLists (`wishlists_basic`) | E | E | — | E | E | E | ⚠ Systemic flag 1 |
| WishLists Capture (`wishlists_capture`) | E | E | — | E | E | — | |
| WishLists Share Links (`wishlists_share_links`) | E | E | — | — | — | — | |
| Wishlist AI Context (`wishlist_ai_context`) | E | E | E | E | E | — | SA at E collides with Rule 3 |

## K. Scheduling & Timers (PRD-35 / 36)

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| Scheduler Basic (`scheduler_basic`) | E | E | — | E | — | — | |
| Scheduler Custom (`scheduler_custom`) | En | En | — | — | — | — | |
| Scheduler Advanced (`scheduler_advanced`) | FM | — | — | — | — | — | Custody patterns at FM — ⚠ custody/co-parent families NEED this; consider En (it's their core logistics, not a luxury) |
| LiLa Schedule Extract (`scheduler_lila_extract`) | FM | — | — | — | — | — | |
| Timer Basic (`timer_basic`) | E | E | — | E | E | E | |
| Timer Advanced (`timer_advanced`) | En | En | — | En | — | — | |
| Timer Visual (`timer_visual`) | En | — | — | — | En | En | ⚠ Visual timers exist FOR Play/Guided kids (no-numbers design) — gating the kid-accessibility variant at En while timer_basic is E penalizes the youngest; consider E |

## L. Settings, Permissions, Archives & System (PRD-01 / 02 / 13 / 22)

| Feature (key) | Mom | Dad | SA | Teen | Guided | Play | Notes |
|---|---|---|---|---|---|---|---|
| Account Settings (`settings_basic`) | E | E | — | E | — | — | |
| Family Management (`settings_family_management`) | E | — | — | — | — | — | ⚠ Family management at E but family features at En? Align with the Essential-story decision |
| Browse Archives (`archives_browse`) | E | — | — | — | — | — | Dad has grant-scoped archive access today (Convention #274) — dad `—` needs the grant-composition rule (Section M) |
| Faith Preferences (`archives_faith_preferences`) | E | — | — | — | — | — | |
| Context Learning (`archives_context_learning`) | — | — | — | — | — | — | |
| Per-Feature Permission Control (`granular_permissions`) | En | — | — | — | — | — | Consistent with mom-only Essential ✓ |
| Custom Permission Presets (`custom_permission_presets`) | — | — | — | — | — | — | |
| Mom Self-Restrictions (`mom_self_restrictions`) | — | — | — | — | — | — | Unenforced today (STUB) — leave unassigned |
| View As (`view_as_mode`) | En | — | — | — | — | — | ✓ Consistent (nobody to view-as at Essential) |
| Shift Scheduling (`shift_scheduling`) | — | — | — | — | — | — | |
| Special Adult Shifts (`special_adult_shifts`) | En | — | — | — | — | — | |

## M. Management-grant keys (Convention #274/#276 — need a composition ruling, not tier cells)

These keys govern mom-granted authority for dads. Live seeds put them in `feature_access_v2` as if they were tier features:

| Key | Live seed | Proposed handling |
|---|---|---|
| `financial_tracking` | mom En, dad En | Tier gates whether the family's plan INCLUDES the grant system (suggest En — no family at E anyway); the actual dad access stays 100% mom's per-kid/family-wide grant. `useCanAccess` NEVER auto-grants; `useViewableMembers`/`util.finance_grant_level()` stay authoritative |
| `studio` | dad En | Same rule |
| `reward_rules` | dad En | Same rule |
| `task_assignment` | dad E | Same rule — ⚠ and rename display ("Task Assignment Grant") to stop colliding with `tasks_family_assignment` |
| `gift_planning` | dad En | Same rule |
| `meal_planning` | dad E — **unregistered key** | Register in `feature_key_registry` + same rule |

**Proposed convention sentence (Slice 1 documents it):** *Tier gating and grant gating compose as AND: the tier decides whether the grant system exists for this family; the grant decides whether THIS adult has it. Neither ever substitutes for the other.*

## N. Registry hygiene (Slice 1 repairs — approve the merge directions)

| Problem | Keys | Proposed fix |
|---|---|---|
| Unregistered keys carrying live rows | `meal_planning`, `quicktasks`, `smart_notepad` | Register `meal_planning` + `quicktasks`; MERGE `smart_notepad` rows into `notepad_basic` and delete the orphan key |
| Duplicate pair | `duration_tracking` ↔ `task_duration_tracking` | Keep `task_duration_tracking` (Addendum vocabulary), migrate rows, retire the other |
| Duplicate pair | `tasks_teen_studio` ↔ `studio_teen_access` | Keep one (suggest `studio_teen_access`), retire the other |
| Near-dupe | `tasks_pomodoro` ↔ `timer_advanced` | Retire `tasks_pomodoro` (timer keys own pomodoro per PRD-36) |
| Display-name collision | `task_assignment` (grant) vs `tasks_family_assignment` (tier) | Rename displays: "Task Assignment Grant (adults)" vs "Assign Tasks to Family" |
| Missing addendum keys | `vault_hearts`, `vault_comments_post`, `vault_comments_read` | Add per Permission-Matrix Addendum (comments mom-only, hearts follow browse) |
| 45 NULL-tier rows | listed inline above with `?` | Repair each to the noted suggestion in the same Slice-1 migration |
| Missing registry columns | `category`, `is_lite_version`, `lite_version_of` on `feature_key_registry` | Slice 1 adds; categories = the section headers of THIS chart |

---

*Produced by the PRD-31 pre-build audit, 2026-07-08. Source of truth for current state: live production query (`feature_access_v2` × `feature_key_registry` × `subscription_tiers`). After founder markup, Slice 1 encodes the marks; after Slice 6, the Screen-4 admin grid supersedes this file as the live chart (this file remains the markup record).*
