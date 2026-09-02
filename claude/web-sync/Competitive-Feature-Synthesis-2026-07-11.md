# Competitive Feature Synthesis — What We Have, What's Easy, What Levels Us Up

> Prepared 2026-07-11 from the founder's competitive comparison notes (S'moresUp/IAFT, OurHome,
> Ohai.ai, Nori, Our Family Habits, Hearth, Cozi, Skylight).
> Status labels are verified against WIRING_STATUS.md, the live schema, and the codebase as of today —
> not against PRD intentions. "We have this" means it's wired in production.

---

## The Scoreboard (read this first)

**Where we already beat every app on this list:**
- **Gamification depth** — points ledger, Reward Shop, prizes, creature sticker book, coloring reveals, streaks, day segments, 4 earning modes, contracts engine. S'moresUp and Skylight are shallow next to this.
- **AI that knows the family** — LiLa's context assembly + Archives + heart toggles + Human-in-the-Mix. Ohai and Nori have generic AI memory; nobody has mom-controlled, privacy-tiered family knowledge.
- **Photo/voice/paste capture** — MindSweep already does what Nori's "snap a flyer" does: screenshot → OCR → calendar event, paste a link, .ics upload, voice capture (just repaired).
- **Any-screen, no hardware** — the report's own recommendation ("Hearth/Skylight beauty without the device lock-in") is literally our architecture. Web-first, Hub tablet mode, five shells.
- **Proactive daily rhythm** — Morning/Evening Rhythms are a better version of Ohai's "daily summaries": calendar preview, priorities recall, MindSweep-Lite, insights, reflections.
- **Celebration instead of penalty** — every competitor uses late penalties and point deductions. We deliberately don't, and that's a selling point, not a gap.

**The genuine gaps, in one line each:**
1. **Family Feed / "Campfire"** — the private family sharing space. PRD-37 exists with a dispatch pack; not built. This is the single biggest emotional-connection feature competitors have that we don't.
2. **External calendar sync** (Google/Apple/Outlook two-way) — most-requested competitor feature; post-MVP for us.
3. **Push notifications / reminders that reach you** — we capture `reminder_minutes` on events but nothing delivers it; all notifications are in-app only (PRD-33 PWA push is post-MVP).
4. **Money jars (Save/Spend/Share)** — we have better financial rails than any of them (multi-pool allowance, append-only ledger, loans) but no kid-facing jar experience.
5. **Family-level insights digest** — "data-driven parenting" reports. We log everything; we synthesize nothing for mom yet (except safety).

---

## Part 1 — Feature by Feature

Format per feature: **How we do it today → How we could do it better → Where it fits → Level-up (joy/wonder/bonding).**

### 1. Gamification & Rewards (S'moresUp, Skylight)

**Points, rewards, redemption**
- *Today:* Full point economy — `point_transactions` append-only ledger, config-as-truth resolution, Reward Shop with approval flows, unlock gates, purchase limits, Play always-pends. Prizes, reveals, IOUs, redemption history. Deeper than anything on the list.
- *Better:* Nothing structural. The Reward Shop shipped 3 days ago — let real use season it.
- *Level-up:* The Sub-phase D reveal videos (Mossy Chest, Fairy Door) are the "wonder" moment competitors can't match — worth prioritizing when gamification polish comes back around.

**Money-Wise jars (Save / Spend / Share)** ⭐ QUICK WIN
- *Today:* Not built as jars — but the rails are all there: multi-pool allowance, `financial_transactions.category`, kid-visible ledger, My Rewards Finances section.
- *Better:* Add a payout-split config on `allowance_configs` (e.g., 50/40/10) so when mom marks a period paid, the payment writes three category-tagged ledger rows. Kid sees three jar visuals instead of one balance.
- *Where it fits:* Allowance config UI (one new section), My Rewards Finances (jar rendering), Play picture shelf (three treasure chests, no numbers).
- *Level-up:* "Share" jar ties beautifully to faith/values — a family giving goal the Share jars feed, displayed on the Hub. Financial literacy + generosity + family bonding in one visual.

**Badges & achievements**
- *Today:* Creatures and sticker pages ARE badges — and they're prettier. 161 creatures, 26 pages, earned-never-revoked.
- *Better:* Character-trait framing (next section).
- *Level-up:* A "collection complete" family celebration when a kid finishes a page — the machinery (page unlocks, Hub celebration banners) already exists for Family Goals; same pattern.

**Competitions & collaborations**
- *Today:* Family Goals is wired — "All together" and "Everyone does their part" modes, shared prize, race-safe awarding, Hub progress section. That's S'moresUp's "collaboration" done better.
- *Better:* The Boss Battle / Party Quest / Family Bingo visual skins are registered stubs over the same engine — pure presentation work when wanted.
- *Deliberate rejection:* Kid-vs-kid leaderboards. Celebration-only means we celebrate the family total, never rank siblings. If we ever show comparison, it's "look what we did together."

**Late penalties & point deductions** — ❌ **Deliberately rejected.** Conventions #219/#280: points are never deducted as punishment, earned things are never taken away. Fresh Reset is our answer to overdue guilt. This is a differentiator to market, not a gap to close.

### 2. Family Connection (Campfire Hub, memories, celebrations)

**Private family sharing space ("Campfire")** ⭐ BIGGEST GAP
- *Today:* Pieces exist — Messaging with family spaces, Content Corner (link sharing with feed/playlist modes), Hub victories + countdowns, Victory Recorder with photos, DailyCelebration.
- *Better:* **PRD-37 Family Feeds is exactly this** — family moments with media, reactions, comments, Out-of-Nest feed for grandparents, portfolio pipeline for homeschool. It has a dispatch pack ready. This is the build that turns "task app" into "family place."
- *Where it fits:* Its own PRD, already planned. Out-of-Nest members (already in schema) become the grandparent audience — no competitor includes extended family this way.
- *Level-up:* The homeschool angle is unique to us — a moment tagged "learning" flows into the PRD-28B portfolio. Grandma's heart-react on a kid's project photo is bonding no chore app offers.

**"Proud of You" notes** ⭐ QUICK WIN
- *Today:* `victories.is_moms_pick` + `moms_pick_note` already exist — mom can mark and annotate a victory. But the kid never gets told.
- *Better:* When mom marks a Mom's Pick, fire a notification to the kid and surface the note on their My Rewards / dashboard ("Mom noticed: ...").
- *Where it fits:* One notification insert + one My Rewards card. Tiny.
- *Level-up:* In the Play shell, read it aloud (reading-support TTS already exists) with a sparkle burst. That's the "magic moment" from the Play-shell wishlist, nearly free.

**Family highlights / weekly wins**
- *Today:* Hub slideshow machinery exists (`SlideshowOverlay`, victory settings). DailyCelebration covers the personal version.
- *Better:* A "This Week's Family Wins" Hub section — victories + goal progress + completed streaks, family-timezone week. Passes the front-door rule (taps into Victory Recorder).
- *Level-up:* Dinner-table conversation starter: one line on the Hub each evening — "Ask Gideon about his math chapter." Template-driven from the day's activity log, zero AI cost.

### 3. The AI Assistant (Ohai's "O", Nori, Frankie)

**Conversational natural-language input**
- *Today:* LiLa (43 modes), voice input across ~15 surfaces (duplication bug fixed this week), MindSweep brain dumps, Natural Language Composition in Studio.
- *Better:* **ST-B (NLC v2) is the gap and it's already scoped** — today NLC knows only 6 of ~20 outcomes and hard-fails on the founder's own headline phrase. When ST-B lands, "describe what you want" becomes real. Nothing new to plan; it's in the STUDIO-EXPERIENCE queue.
- *Level-up:* After ST-B, the same router can power LiLa Assist ("just tell LiLa what you need made") — one brain, two doors.

**Photo / email / document intelligence**
- *Today:* Screenshot → OCR → classified → calendar/task: wired. Link paste: wired. .ics upload: wired. Voice: wired. **Email forwarding: fully built but dormant** — DNS never configured, and it now needs `MINDSWEEP_WEBHOOK_SECRET` set (fail-closed by design).
- *Better:* ⭐ QUICK WIN (ops, not code): configure the inbound-email DNS + secret and the "forward the school email, it becomes a calendar event" story goes live. This is Ohai's most-praised feature and ours is sitting finished.
- *Level-up:* Weekly nudge in morning rhythm the first time: "You can forward school emails to your family's sweep address" — Feature Discovery pool entry (data-only add).

**Proactive summaries & nudges**
- *Today:* Morning/Evening Rhythms, Next Best Thing (just repaired), Feature Discovery, backlog prompts, carry-forward. Genuinely ahead of competitors here.
- *Better:* Nothing structural. The delivery gap is notifications (Section 9), not intelligence.

**AI memory & personalization**
- *Today:* Archives + three-tier heart toggles + name detection + topic matching. Ohai/Nori remember allergies; we remember allergies *and let mom control exactly what the AI may use.* Food restrictions are now first-class (PRD-42).
- *Better:* Nothing to copy from them — they should copy us. The context-update pipeline (LiLa gleaning) continuing to deepen per Convention #247 is the roadmap.

**"Assign to AI" (AI executes routine tasks)** — Partial deliberate rejection. Our equivalents: contracts + godmothers (auto-assignment, scheduled grants), MindSweep autopilot (opt-in), auto-titling. Full "AI does it without review" conflicts with Human-in-the-Mix; the blessed exceptions list (Convention #279) is the boundary. Right call — keep it.

### 4. Calendar

**Shared family calendar**
- *Today:* Wired — categories, attendees, approvals, painted schedules, drive-time/leave-by, AI-suggested items-to-bring, task due-date overlay, week-start config, DateDetailModal.
- *Better (three concrete adds):*
  1. ⭐ **Conflict soft-warning** (QUICK WIN): at event save, check overlapping events for the same attendees and show a gentle "Mosiah already has soccer 4–5pm — keep both?" No blocking, just awareness. One query + one banner in EventCreationModal.
  2. **Event reminders that actually fire** (small-medium): `reminder_minutes` is stored but nothing consumes it. A cron (the `util.invoke_edge_function` pattern) sweeping upcoming events → in-app notifications closes the loop today, and upgrades to push automatically when PRD-33 lands.
  3. **ICS interim sync** (medium): before real two-way Google sync, (a) publish a read-only ICS feed URL per family so the family calendar shows up inside Google/Apple Calendar, and (b) subscribe-to-URL import (poll an external ICS feed hourly). Covers ~70% of the sync ask at ~20% of the cost.
- *Bigger build:* True two-way Google/Apple/Outlook OAuth sync — the most-requested competitor feature. Post-MVP; needs its own pre-build when it's time.
- *Level-up:* "Leave by" + drive time already exist — a reminder-fire integration makes them magical ("Leave in 10 minutes for piano").

### 5. Meals & Grocery (Cozi, Nori, Ohai)

- *Today:* KitchenCompass Phase A shipped this week — capture (link/photo/paste/went-well), scaling + saved versions, week plan with drag-drop, Cook View with family pointers, send-week-to-shopping-list with merge + scaling. Living Shopping List + Shopping Mode + purchase history already wired. This matches or beats Cozi.
- *Better:* The competitor "wow" features are **already the registered Phase B stubs**: suggestion engine ("what should we make this week"), theme nights, prep reminders, Instacart/Walmart export. Recommendation: when Phase B is sequenced, put the **fridge-photo → dinner suggestions** flow first — it's Nori's single most-shared feature and our photo pipeline (Sonnet vision, already used in recipe capture) makes it cheap.
- *Level-up:* `kids_helped_member_ids` already logs kids cooking → homeschool minutes → victories. No competitor connects dinner to the portfolio and the celebration system. Tell that story in marketing.

### 6. Habits & Character (Our Family Habits)

- *Today:* Best Intentions = celebration-only habit tallies; 39 tracker starter configs; streaks with grace days; reflection prompts; Guided Forms (SODAS, What-If, Apology Reflection) go deeper on character than anything OFH ships. Kiosk mode = `/hub` with PIN dip-ins, wired.
- *Better:*
  1. ⭐ **Character content packs** (QUICK WIN, data-only): seed Best Intentions templates + tracker starter configs named for traits — Kind Helper, Brave Try-er, Faithful Friend — surfaced on the Studio shelf. Templates are data, not code.
  2. **Character creature theme**: a second gamification theme where creatures embody traits (earning "Patience the Owl"). Asset generation + seed rows on existing tables — the theme system was built for exactly this.
  3. **Hub TV mode Phase 1** (PRD-14E, currently a route stub): landscape layout + auto-rotating slideshow. `SlideshowOverlay` + `tv_config` already exist; this is smaller than it looks and delivers the Hearth "beautiful command center on the living-room TV" experience with zero hardware.
- *Level-up:* Weekly family rhythm digest on the Hub — "our family practiced kindness 14 times this week." Counts-only, no AI cost, pure warmth.

### 7. School & Homework

- *Today:* Homeschool subjects, time logs (minutes-based, compliance-safe), opt-in hour targets, homework routing from the Write drawer, `counts_for_homework`, photo-of-assignment → task via MindSweep scan.
- *Better:* **PRD-28B (Compliance & Progress Reporting)** is the build that matters — ESA/MOScholars exports, report templates, standards evidence. It has a pack; it's also the feature that serves the ESA positioning on the horizon list. Grade tracking/forecasting: not planned — worth a deliberate decision (my read: skip for homeschool-first audience; portfolio evidence beats grades).
- *Deliberate skip:* Google Classroom sync — our audience is homeschool-first; revisit only if hybrid-schooling families show up in beta feedback.

### 8. Analytics & Insights ("data-driven parenting," PUP score)

- *Today:* Everything is logged (activity log, completions, rhythms, moods via `mood_triage`/`mood_tag`) and almost nothing is synthesized for mom — except the safety weekly digest, which proves the whole pattern (cron → counts-only Haiku narrative → notification).
- *Better:* **Family Insights weekly digest** (medium build, post-beta candidate): reuse the safety-digest architecture verbatim on positive data — completion rhythms, streaks, victories, habit growth. Counts-only prompts keep AI cost near zero. Celebration-only framing is the hard rule: *what grew*, never *what's behind*.
- *Deliberate rejection:* Scoring mom (PUP/stress score). We don't grade mothers. The gentler version: rhythm mood triage already exists — LiLa can adapt tone from it as context, without ever showing a number.

### 9. Notifications & Reminders (cross-cutting)

- *Today:* In-app notifications with categories, DND, severity tiers, breathing glow. No push, no email (Resend key pending from SM-C), no SMS.
- *Better, in order:*
  1. Event/prep reminders → in-app via cron (Section 4) — works now.
  2. **PWA push** (PRD-33) — the single upgrade that makes reminders, digests, and "leave by" real when the app is closed. Post-MVP but rising in value as features pile up behind it.
  3. Email digests — unblocked the moment the Resend key + DNS land (already a registered stub).
- *Deliberate skip:* SMS/phone-call reminders (Nori) — real cost per message, real infra; revisit only if beta moms ask.

### 10. Platform & Sync

- Real-time sync: wired (Supabase Realtime, per-instance channels). Offline: PRD-33 post-MVP. Multi-device, any screen, no hardware: already our architecture — and the exact "software-only Hearth" recommendation in the competitive notes.

---

## Part 2 — The Quick-Win List (small adds, existing infrastructure)

| # | Feature | Where it lands | Size |
|---|---------|----------------|------|
| 1 | **Turn on email → MindSweep** (DNS + webhook secret) | Ops task; code is finished and fail-closed | Tiny (ops) |
| 2 | **"Proud of you" notes reach the kid** (moms_pick_note → notification + My Rewards card; TTS in Play) | Victory Recorder + notifications | Small |
| 3 | **Calendar conflict soft-warning** | EventCreationModal, one overlap query | Small |
| 4 | **Event reminders fire in-app** (`reminder_minutes` cron) | New cron + notifications pipeline | Small-medium |
| 5 | **Save/Spend/Share jars** (payout split + jar visuals) | Allowance config + My Rewards + Play shelf | Medium-small |
| 6 | **Character content packs** (Best Intentions templates + tracker configs; optionally a trait creature theme) | Seed data + assets, Studio shelf | Small (data) |
| 7 | **ICS feed publish + subscribe** (interim calendar sync) | New Edge Function + hourly poll cron | Medium-small |
| 8 | **Hub TV mode Phase 1** (landscape + slideshow autoplay) | `/hub/tv` stub + existing SlideshowOverlay/tv_config | Medium-small |
| 9 | **"This Week's Family Wins" Hub section** + dinner conversation starter | Hub section registry (mergeSectionOrder pattern) | Small |

## Part 3 — Bigger Builds (already planned — packs exist, no new design needed)

| Build | Covers competitor feature | Status |
|---|---|---|
| **PRD-37 Family Feeds** | Campfire / family sharing / memories / grandparent feed | Dispatch pack ready — biggest bonding win on this list |
| **ST-B NLC v2** | Ohai/Nori conversational creation | Scoped in STUDIO-EXPERIENCE queue |
| **KitchenCompass Phase B** | Meal AI, fridge-photo suggestions, Instacart | Stubs registered; recommend fridge-photo first |
| **PRD-28B Compliance Reports** | Homework/ESA reporting | Pack ready; serves ESA positioning |
| **PRD-33 PWA / Push / Offline** | Reminders that reach you, offline | Post-MVP; value rising |
| **PRD-29 BigPlans** | SMART goals with breakdowns/milestones | Pack ready |

**Needs a decision before any planning:** two-way Google Calendar sync (vs. the ICS interim), Family Insights digest (post-beta?), grade tracking (recommend: no).

## Part 4 — Deliberate Rejections (gaps we keep on purpose)

| Competitor feature | Why we say no |
|---|---|
| Late penalties, point deductions | Celebration-only law. Fresh Reset instead. Market it. |
| Sibling leaderboards | Family-total celebration, never ranking kids against each other |
| PUP/stress score for mom | We don't grade mothers; mood triage informs LiLa's tone quietly |
| Full-autopilot AI actions | Human-in-the-Mix is the product's spine and legal shield |
| Dedicated hardware | Any-screen web is the strategy, not a limitation |
| SMS/call reminders, Google Classroom | Cost/infra vs. homeschool-first audience; revisit on beta demand |
