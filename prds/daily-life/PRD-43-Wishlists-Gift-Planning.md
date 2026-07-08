# PRD-43: WishLists — Gift Planning & the In-Store Capture Moment

> **Status:** APPROVED — designed 2026-07-07 (Fable design session); founder resolved
> decision batch **D-43-1..9 the same day, all recommendations approved** with one change:
> **name = WishLists** (§14 is the decision record). Values line confirmed verbatim:
> surprise is not surveillance; the no-hiding principle runs one direction.
> **Category:** daily-life
> **Name:** **WishLists** (founder pick 2026-07-07 — plain compound-capitals, says what it
> is; rejected: WishWell, WishKeeper, GiftGlow). Keys/routes are `wishlists_*` and
> `/wishlists`, exactly aligned with the name.
> **Number note:** PRD-39 stays soft-earmarked for the Playwright Video Library; PRD-40/41/42
> exist. PRD-43 confirmed free by repo-wide grep 2026-07-07.
> **Dispatch pack:** `claude/dispatch-factory/PRD43.md`
> **Design lineage:** `claude/feature-decisions/Composed-View-Surfaces-and-Wishlists.md`
> (2026-04-29) **remains in force** — this PRD is its buildable successor, not a replacement.
> Its composed-view portrait, "Add as reward" promotion, "still wanted" state, store-domain
> grouping, and wishlist-to-budget ideas are all honored below (§3, §6, §12).
> **Depends on (all built):** Lists (PRD-09B + Living Shopping List addendum), Archives
> (PRD-13), LiLa core + context assembler (PRD-05), MindSweep + share-to-app (PRD-17B),
> RoutingStrip (PRD-17), notifications (PRD-15), rewards spine (KIDS-REWARDS `earned_prizes` +
> `reward_proposals`), financial ledger (PRD-28), voice input, `mindsweep-scan` vision.
> **Feeds later (sockets/stubs):** PRD-33 (image share_target), PRD-30 SM-C (shared email
> sender → emailed share links), FGPZ (family prizes sourcing wishlist items), PRD-29
> (savings-goal plans), Out of Nest surfaces (PRD-37).

---

## 1. Vision & Product Summary

**The five-second promise.** Mom is in a store with her kids. A kid sees something and wants
it. Instead of a negotiation or a tantrum, mom says *"Cool! I'll put it on your list"* — and
means it, because in about five seconds she can: open capture, tap the kid's pill, snap a
photo of the thing on the shelf (or speak it, type it, or paste a link), done. The kid
**trusts** it's remembered because they can open their own list later and see it there, with
the photo, with "Mom added this" on it. The store moment is defused not by a trick but by a
real, visible promise kept.

Founder use cases (her words, near-verbatim — all in scope):

- **In-store capture:** *"when I'm shopping with my kids and they see something, I can say
  'Cool! I'll put it on your list'"* — kills store tantrums because the kid TRUSTS it's
  remembered and can see it later. Capture in ~5 seconds: voice, photo of the item on the
  shelf, text, or link, with a which-kid pill. Wired through existing capture machinery, not
  a new pipeline.
- **Anti-impulse browsing:** kids browse their own list when deciding how to spend or save
  their money — **the list IS the impulse buffer**. Connected to their real balance
  ("you're $12 away") and, later, savings goals.
- **Context feed:** the list feeds LiLa context — *"what the kids like and are motivated by
  at the moment."* Recency matters.
- **Three surfaces per kid:** (1) the kid's own wishlist — kid adds, mom adds, kid sees
  everything on it; (2) mom's HIDDEN gift-ideas list per kid — kid never sees it, mom adds
  ideas AND can copy items from the kid's list into it ("actually considering"); (3) an
  export/share for gift-givers — *"when grandma asks what they're interested in or working
  on."*

**Values statement — surprise is not surveillance (normative).** The hidden gift-ideas list
is **mom's own planning notes about gifts**, not the kid's content being hidden from the kid.
The standing no-hiding-from-parents principle (founder, 2026-07-04) runs **one direction**:
kids cannot lock content away from parents. Parents planning surprises for their kids is
ordinary loving parenthood, already canonized in the Living Shopping List addendum: *"Jake
never sees mom's gift ideas for him."* Nothing about the kid is concealed from the kid — their
own wishlist shows them everything on it, including what mom added. The concealment is of
**mom's intentions**, in **mom's list**, and it is enforced at the database (§8), because a
spoiled surprise from a UI bug is a real harm to a real Christmas morning.

**Why this beats a notes app or a retailer registry:** the wishlist lives inside the family's
operating system. The kid's list connects to their real earned balance and the shipped
"propose a reward" pipe ("I want X — I'll do Y to earn it"). Mom's gift ideas ride into
Shopping Mode next to the grocery list. LiLa's Gifts tool draws on the same data when mom
asks "what would light R up for her birthday?" Grandma gets a clean, safe, first-name-only
link with sizes mom chose to include. And the whole thing feeds the platform's core promise:
LiLa gets smarter about what each kid loves *right now*.

---

## 2. Feature Name

**WishLists** — founder pick 2026-07-07 (D-43-1): plain compound-capitals, says what it is.
Rejected: WishWell, WishKeeper, GiftGlow.

All keys/routes are `wishlists_*` and `/wishlists` permanently (exactly aligned with the
name). UI strings use "WishLists" via a single display-name constant.

---

## 3. Ecosystem Position — What Already Exists and What This PRD Does With It

This section is normative. The build inherits these; it must not create parallel machinery.

| Existing piece | State today | This PRD's ruling |
|---|---|---|
| **`lists` / `list_items` wishlist type** (PRD-09B) | Built: `list_type='wishlist'`, `resource_url`, `price`, `priority`, `notes` render in `ListDetailView`; total-price calc; hardcoded sections Want/Need/Saving For | **Canonical home.** The kid's wishlist IS a `lists` row. This PRD upgrades the item shape (§5.1) and gives wishlists a dedicated surface (§6) while they continue to appear on `/lists` (Convention #149 — display where the mental model says). |
| **`list_items.gift_for`** | **UUID FK → family_members** in production (Living-Shopping-List addendum corrected PRD-09B's TEXT-occasion description). Schema-only — no writer, no wishlist render | **Reconciled:** `gift_for` stays the *recipient* FK and stays dormant in v1 (future: kids' own giving-lists, §13). Occasions get their own column (`occasion_tags`, §5.1) — never overload `gift_for` back to text. |
| **Lists RLS** (`lists_owner_or_parent`, `lists_shared_read`, `lists_opportunity_family_read`, `lists_family_device` + `li_*` mirrors) | Owner-or-primary-parent + explicit shares + opportunity carve-out + family-device shadow ALL-access | **Load-bearing finding:** kid sessions can NOT read arbitrary family lists — a mom-owned unshared list is already invisible to a kid's own login. **The one hole is `lists_family_device`**: family-tablet shadow sessions read every family list. §8 closes it with a RESTRICTIVE policy on `list_type='gift_ideas'`. |
| **Mom's private gift-idea lists** (Living Shopping List addendum §Gift Ideas) | Design-canon: *"Mom's private gift idea lists (e.g., 'Christmas Ideas for Jake')… Jake never sees mom's gift ideas for him"*; opt-in to Shopping Mode via `include_in_shopping_mode` | **Inherited and completed.** The hidden surface becomes a first-class `list_type='gift_ideas'` with `subject_member_id`, DB-enforced adult-only visibility, and the already-spec'd Shopping Mode "Gift Ideas" section wired for it (§6.5, §12.4). |
| **Context assembler wishlist loader** (`_shared/context-assembler.ts` §2f) | **Built but dark**: loads `lists` WHERE `list_type='wishlist'` AND `is_included_in_ai=true` + items — but `lists.is_included_in_ai` defaults FALSE and no wishlist UI toggle exists, so the path never fires | **Lit up.** Wishlist creation sets `is_included_in_ai=true`; Heart toggle + "LiLa is drawing from X/Y items" indicator land on the wishlist header per Icon Semantics; the loader gains per-item filtering + recency ordering (§7.4). |
| **Archives** (PRD-13): auto-provisioned per-member `folder_type='wishlist'` folder; `archive_context_items.context_type='wishlist_item'` with `link_url`/`price_range`; `is_negative_preference`; `archive_member_settings.physical_description` | Folder auto-provisioned but **orphaned** (nothing reads/writes it as a wishlist); the other columns live in production | **Reconciled:** the `lists`-table wishlist is the single source of truth. The Archives wishlist folder becomes a **live doorway** (opens the member's wishlist surface — Convention #75, never copies). PRD-13's mom-only Archive wishlist card (":the member who owns the wishlist never sees their Archive card") is honored by the gift-ideas surface, not by duplicating data. `physical_description` supplies share-link sizes (§6.6); `is_negative_preference` items inform LiLa gift suggestions ("avoid: …"). |
| **Capture machinery**: MindSweep `/sweep` (text/voice/scan/link), `mindsweep-scan` EF (Sonnet vision OCR + Haiku link summary), PWA `share_target` (title/text/url → `/sweep`, shipped), QuickCreate FAB (7 actions), RoutingStrip | Built | **Reused, not rebuilt.** New `WishCatch` capture sheet (§6.1) is a thin surface over: `useVoiceInput`, the camera path, and a new `wishlist-extract` EF (§7.1). QuickCreate gains a Wishlist action; RoutingStrip gains a `wishlist` destination with which-kid drill-down (`dynamicSubOptions`, the ST-A list-picker pattern); `mindsweep-sort` gains a `wishlist` classification (§7.3). Image share_target stays PRD-33's. |
| **Rewards spine**: `earned_prizes` (100266 visibility model), `award_custom_reward_for_completion` (100278), `reward_proposals` (want/will/earn-structure, counter-offer), reward image columns **already on `list_items`** | Built and in production | **The motivation bridge (§12) plugs in here.** "Add as reward" prefills the existing reward flow from a wishlist item; kid-side "Ask to earn this" prefills `reward_proposals.terms.want_text/want_image_url`. **PRD-24's `gamification_rewards`/`reward_redemptions` tables were never built — nothing targets them.** The April doc's `wishlist_reward_links` table idea is superseded: provenance rides `metadata`/`source_list_item_id`, no new table. |
| **Financial ledger** (PRD-28): `useRunningBalance`, `child_can_see_finances` (per-pool), append-only `financial_transactions` | Built | "$X away" chips read the kid's real balance; every balance render is gated on the kid's primary-pool `child_can_see_finances` (§6.2). **Savings goals do not exist in code** — `pool_type='goal_pool'` is schema-only. v1 ships balance-distance display; goal-pool wiring is a registered stub (§13). |
| **Out of Nest** (PRD-15) | Built: conversation-only accounts; *"cannot see any family data beyond designated conversations"*; email invites | **Not the share mechanism.** Gift-giver access is a NEW tokenized share link (§6.6) — no account, no login, view + optional reserve. Emailing a link to an Out of Nest grandma becomes one-tap once PRD-30 SM-C's shared `send-email` capability exists (coordination edge; v1 = copy link). |
| **`family_requests`** (PRD-15) | Built | Not used for claims — gift claims are their own table with surprise-safe RLS (§5.2). |
| **Convention #257** (server-derived dates) | Enforced infrastructure | No new "today" writes. `gift_history.given_on` is a **user-chosen** date (exempt, same class as `meal_plan_entries.entry_date`). Birthday-nudge cron computes at family timezone. Run the #257(c) verification queries before touching anything. |
| **SAFETY-BETA-GATE scaffold** (`authenticateRequest`, `detectCrisis`, `buildSafetyPreamble`, no-training client, cost logging) | Shipped | Both new Edge Functions carry the full scaffold from birth. The public share EF authenticates by token-hash in code (deployed `--no-verify-jwt` per the platform pattern) and never touches AI. |

---

## 4. Core Concepts & Mental Model

1. **One canonical wishlist per person.** Every family member (kids AND adults — mom gets one
   too) has one wishlist. Capture always lands there — mom never has to pick which of the
   kid's lists mid-store. Occasions (Christmas, birthday) are **views** (per-item
   `occasion_tags` + filters), not separate lists. Extra event lists remain possible (they're
   just lists) but are never the capture default. **Capture speed is the feature; a
   list-picker step would kill it.**
2. **Three surfaces per kid:**
   - **The kid's wishlist** — kid adds, mom adds, kid sees everything including attribution
     ("Mom added · Tuesday"). The trust anchor.
   - **Mom's gift-ideas list** (`list_type='gift_ideas'`, `subject_member_id` = the kid) —
     invisible to the kid at the database layer. Mom's ideas + items copied ("Considering")
     from the kid's list, each carrying provenance.
   - **The share link** — a tokenized, revocable, expiring, first-name-only view for
     gift-givers, with optional no-account reservation.
3. **Item lifecycle:** `active` → (`dormant` — "changed my mind," reversible, celebration-only
   copy, never deleted) → (`received` — recorded into gift history). Dormant and received
   items leave the default view, the LiLa context, and every share link, but stay browsable
   in history.
4. **The impulse buffer:** the kid's own list view IS the deliberate-spending surface —
   photos, prices, priority order they control (drag), their real balance, "$X away" chips,
   and "Ask to earn this" (the shipped `reward_proposals` pipe).
5. **The context feed:** hearted, active wishlist items flow into LiLa context via the
   existing (now lit) assembler loader — recency-ordered, because "what they're into right
   now" is the point. No copies into Archives; the wishlist is itself a context source
   (Convention #75 discipline).
6. **Claims are invisible to the subject.** Reserved/purchased marks by ANY giver (family
   adult or link-holder) are never renderable to the person the list belongs to — kid or
   adult. Mom's own list hides claims from mom.

---

## 5. Data Model

All snake_case, RLS enabled, family-scoped. Migration numbers assigned at build time (verify
the CURRENT production `lists.list_type` CHECK before extending it — ST-0 lesson: base
constraint rewrites on the live constraint body, never a stale migration).

### 5.1 Column additions (existing tables)

**`lists`:**

| Column | Type | Notes |
|---|---|---|
| `subject_member_id` | UUID NULL FK family_members | Who a `gift_ideas` list is FOR. NULL for all other list types. One gift-ideas list per (family, subject) enforced by partial unique index (additional occasion-specific gift lists allowed later; v1 keeps one per kid). |

`list_type` CHECK extended with `'gift_ideas'`. An enumeration regression vitest (constraint
values ⊇ every `list_type` literal the codebase writes) ships with the migration — this bug
class has shipped twice (F-21 precedent).

**`list_items`:**

| Column | Type | Notes |
|---|---|---|
| `image_url` | TEXT | Item photo (shelf photo, link og:image). New storage bucket `wishlist-images` (family-scoped paths). Benefits all list types; wishlists use it heavily. |
| `is_included_in_ai` | BOOLEAN NOT NULL DEFAULT true | **Per-item Heart** (Convention #8 finally reaches list items). Context loader filters on it. |
| `wishlist_state` | TEXT NULL CHECK (`'active'`,`'dormant'`,`'received'`) | Wishlist/gift_ideas semantics only; NULL for other types (draw_mode precedent, Convention #162). Hook sets `'active'` on wishlist-item insert. |
| `occasion_tags` | TEXT[] NULL | e.g. `{'christmas','birthday'}`. Free vocabulary + suggested chips. Drives filtered views + share-link scope. |
| `added_by` | UUID NULL FK family_members | Attribution — the trust loop renders "Mom added this" from it. Set by every write path incl. `acted_by` semantics on family devices. |
| `excluded_from_shares` | BOOLEAN NOT NULL DEFAULT false | Per-item "never show this on any share link" (granular privacy from the external requirements list, done cheaply). |

Existing columns reused as-is: `content` (title), `notes`, `resource_url`, `price` +
`currency`, `priority` (Must-Have / Would-Love / Nice-to-Have chips map onto it — build
verifies the live column type and maps accordingly), `sort_order` (dnd-kit reorder, ⠿
handles), `section_name`/`category` (untouched), `archived_at` (hard removal; distinct from
`dormant`), reward image columns (§12).

### 5.2 `gift_claims` (new)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `family_id` | UUID FK families | |
| `list_item_id` | UUID FK list_items | |
| `item_title_snapshot` | TEXT NOT NULL | Survives item deletion/edit. |
| `claimed_by_member_id` | UUID NULL FK family_members | Family-adult claimant… |
| `claimant_label` | TEXT NULL | …or external claimant via share link ("Grandma Sue" — free text she typed). CHECK exactly-one-of member/label+link. |
| `share_link_id` | UUID NULL FK wishlist_share_links | Which link the external claim came through. |
| `status` | TEXT CHECK (`'reserved'`,`'purchased'`,`'given'`) | `given` transition offers gift-history recording + marks the item `received`. |
| `claimed_at` / `released_at` | TIMESTAMPTZ | Release returns the item to claimable. |
| `notes` | TEXT | Giver-private note ("getting the blue one"). |

Partial unique index on `(list_item_id) WHERE status IN ('reserved','purchased') AND
released_at IS NULL` — **first-claim-wins**; the second giver sees "already spoken for."

**RLS (surprise-safe, DB-enforced):** SELECT/INSERT/UPDATE for family **adults**
(primary_parent always; additional_adult via the `gift_planning` grant) **EXCEPT rows whose
underlying list's owner (or `subject_member_id`) is the caller** — nobody ever reads claims
against their own list. **No kid-role read path exists at all. No family-device policy on
this table** — claims never render on shared tablets. External link-holders never touch
PostgREST; their claims go through the `wishlist-share` EF (service role, token-verified).

### 5.3 `wishlist_share_links` (new)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `family_id` / `list_id` | UUID FKs | The wishlist being shared. |
| `created_by` | UUID FK family_members | |
| `token_hash` | TEXT NOT NULL UNIQUE | SHA-256 of a 128-bit token. Raw token shown ONCE at creation (PIN-hashing discipline — never store plaintext). |
| `label` | TEXT NOT NULL | Mom's name for it ("Grandma Sue — Christmas"). |
| `display_name` | TEXT NOT NULL | What the public page calls the kid — defaults to first name, mom-editable ("R"). Never auto-includes last name, age, or birthdate. |
| `scope` | JSONB | `{occasions?: string[], item_ids?: uuid[] (optional pinning), include_sizes: boolean, sizes_text?: string}` — `sizes_text` is a SNAPSHOT mom reviewed at creation (pulled from `archive_member_settings.physical_description`, then edited); later archive edits never silently flow to an outstanding link. |
| `allow_reserve` | BOOLEAN DEFAULT false→(D-43-3) | Whether the public page offers Reserve/Purchased marking. |
| `expires_at` | TIMESTAMPTZ NOT NULL | Default now() + 90 days, mom-adjustable. |
| `revoked_at` | TIMESTAMPTZ | Revoke = instant dead link. |
| `view_count` / `last_viewed_at` | INTEGER / TIMESTAMPTZ | "Grandma looked Tuesday" — warm feedback for mom. |

RLS: adults-of-family only (same grant shape as gift_claims). The public page never queries
PostgREST — all public traffic goes through the `wishlist-share` EF.

### 5.4 `gift_history` (new)

| Column | Type | Notes |
|---|---|---|
| `id` / `family_id` | | |
| `member_id` | UUID FK family_members | The family member the record is about. |
| `direction` | TEXT CHECK (`'received'`,`'given'`) | Received a gift / gave a gift. |
| `item_title` | TEXT NOT NULL | |
| `counterparty_label` | TEXT | "Grandma Sue" / "Cousin Ella" — free text; optional `counterparty_member_id` for in-family gifts. |
| `occasion` | TEXT | "Christmas 2026", "8th birthday". |
| `given_on` | DATE | **User-chosen date — Convention #257 exempt class** (like `meal_plan_entries.entry_date`). |
| `source_list_item_id` | UUID NULL | Provenance when it came off a list. |
| `notes` / `photo_url` | | |
| `created_at` | TIMESTAMPTZ | |

Written automatically when a claim transitions to `given` (mom confirms) and manually from
the Gift History surface. Mom-editable (this is memory-keeping, not a financial ledger — no
append-only constraint). RLS: adults of family (same grant shape); **kids don't see gift
history in v1** (it reveals giver patterns → surprise leakage; a kid-safe "gifts I've given"
view is future scope).

### 5.5 Permission key

**`gift_planning`** — family-wide, **explicit-grant-only** (Convention #274 shape;
`apply_permission_profile` never touches it). Grants an `additional_adult`: read/write on
`gift_ideas` lists, `gift_claims`, `wishlist_share_links`, `gift_history`, and the Gift
Planning surfaces. Mom (primary_parent) has it implicitly. Registered in
`feature_key_registry` + Permission Hub row (binary Off/Allowed, `task_assignment` render
precedent). Feature keys registered: `wishlists_basic`, `wishlists_capture`,
`wishlists_share_links`, `gift_planning`.

---

## 6. Screens & Surfaces

### 6.1 WishCatch — the capture sheet (THE feature)

A lightweight bottom sheet (ModalV2 transient on desktop), reachable from:
- **QuickCreate** ("Wishlist" action, Gift Lucide icon) — mom/adult/independent shells
- **`/wishlists` header** [+ Capture] and each list's [+]
- **RoutingStrip `wishlist` destination** (Notepad Send-to, Review & Route, MindSweep) with
  which-person drill-down via `dynamicSubOptions`
- **Share-to-app** (already shipped): a shared product URL lands in `/sweep`;
  `mindsweep-sort` now classifies it (§7.3) and Review & Route offers the wishlist
  destination

Sheet anatomy, top to bottom:
1. **Person pills** (compact `MemberPillSelector`) — defaults to the LAST person captured
   for (localStorage), includes "Me". One tap to switch.
2. **One input row:** text field (autofocus) + mic (`useVoiceInput` — final transcript
   appends, no duplication per VOICE-INPUT-REPAIR) + camera + auto-detected link (pasted URL
   recognized inline).
3. **[Add to R's list]** — one tap. Toast: "Added to R's wishlist ✓". Sheet stays open for a
   second capture (store trips come in multiples), person pill sticky.

**Speed contract (normative):** open → pill → input → save must be achievable in ≤5 seconds
on mobile. Nothing blocks the save: no required fields beyond one input mode, no
category/occasion/price prompts (all refinable later — the April doc's bulk-add-with-
progressive-refinement), and **AI never gates capture**:
- **Typed/spoken text** → saves as-is (mom's words are not AI output; no HITM needed).
- **Photo** → item saves IMMEDIATELY with the photo as `image_url` and a placeholder title
  ("Photo wish — [date]"); vision identification (§7.1) runs async and lands as a
  **suggested title chip** ("Suggested: 'LEGO Friends Heartlake Hotel' ✓ / ✎") — accepting
  or editing IS the HITM step, deferred and non-blocking (Convention #279 discipline: the
  AI-derived text persists only on confirm; the raw capture is mom's own record).
- **Link** → item saves with the URL immediately; deterministic og:/JSON-LD extraction (§7.1)
  fills title/image/price with an "auto-filled from the link — check it" chip (deterministic
  parsing, .ics-import class, no HITM); the rare Haiku fallback renders as a suggested chip
  requiring confirm.

Every capture sets `added_by`, `wishlist_state='active'`, `is_included_in_ai=true`.
Duplicate detection (same normalized URL or high title similarity on the same list) shows a
soft "Looks like this might already be on the list" note — never blocks.

### 6.2 The kid's wishlist (per shell)

Route `/wishlists` renders the viewer-appropriate surface. New top-level page → registered
ONCE in `getSidebarSections()` (Family section), BottomNav More-menu parity automatic
(Convention #16 checklist at build).

**Independent (teen):** their list — image-forward cards (photo, title, price, link-out,
occasion chips, priority chip), ⠿ drag reorder (persists `sort_order`), Must-Have /
Would-Love / Nice-to-Have grouping toggle, occasion filter pills, "Changed my mind" (→
dormant; copy: "Moved to your maybe-later pile" — celebration-only, reversible from the
Dormant section), per-item Heart (`is_included_in_ai`), attribution line ("Mom added ·
Tue"). **Balance strip** when primary-pool `child_can_see_finances`: "You have $23.50" +
per-item "$12.50 away" chips (hidden when no price or finances hidden). **[Ask to earn
this]** on each item (§12.2). Add = full WishCatch.

**Guided:** same list, simplified — bigger cards, fewer controls (view, add via WishCatch,
"Changed my mind", hearts visible but managed by mom). TransparencyIndicator not needed —
everything here is family-visible by design.

**Play:** picture-grid "My Wish List!" — image tiles, tap to enlarge, Lucide icons, **no
prices/balance anywhere** (OPPORTUNITY-SURFACES precedent: Play money hidden by default).
Adding happens through mom.

**Mom/Adult:** every member's wishlist via person tabs (Adult scoped per D-43-5). Mom's view
of a kid's list adds: [Consider for gift →] per item (copies into the gift-ideas list with
provenance, §6.4), claim indicators (visible to her — never to the kid, §6.5), edit/refine
(price, URL, occasion, notes), and her own list under "Me" (where SHE never sees claims).

### 6.3 Item detail / refine

Tap a card → item sheet: photo (replaceable), title, notes, price + currency, URL (+ domain
chip — store-domain grouping honored from the April doc: group-by-store view toggle on the
list when ≥2 domains), occasion tags (suggested chips: Christmas, Birthday, Easter, Just
Because + free text), priority, Heart, "exclude from share links" toggle (mom/adult only),
state controls, attribution + capture timestamp, and the motivation-bridge actions (§12).

### 6.4 Gift Planning (mom's hidden surface)

`/wishlists` → Gift Planning tab (mom + granted adults ONLY — invisible in every other
shell's nav AND on direct URL via the grant check; DB enforcement per §8 regardless).

- **Per-kid gift-ideas list** (auto-created lazily on first use; `list_type='gift_ideas'`,
  `subject_member_id`=kid). Mom adds ideas via WishCatch (person pill switches to "Gift
  ideas for R" context within this tab) — same 5-second capture.
- **"Considering" copies:** items copied from the kid's list render with provenance ("From
  R's wishlist · added by R · Mar 4"). Copy is a SNAPSHOT (kid may later edit/dormant
  theirs; mom's considering-copy persists) with `source_list_item_id` in metadata for
  cross-navigation. If the kid later marks the source dormant, the copy shows a quiet
  "R changed their mind about this" flag — mom decides what that means.
- **Claim controls:** Reserve / Purchased / Given per item (writes `gift_claims`);
  giver-visible notes; "Given" flows into gift history + offers marking the source wishlist
  item `received`.
- **Share-link manager** (§6.6) and **Gift History** (§6.7) live as sections of this tab.
- **Shopping Mode:** gift-ideas lists expose the already-spec'd `include_in_shopping_mode`
  opt-in; items then appear in Shopping Mode's "Gift Ideas" section for members with source-
  list access only (the addendum's exact rule — which, with §8 RLS, means adults only).

### 6.5 Claims & surprise safety (rendering rules)

- Claim chips ("Reserved — Grandma Sue", "Purchased — Dad") render ONLY on adult gift-
  planning surfaces, and never on any surface whose subject is the viewer (mom's own list
  shows her no claims; dad's list shows him none).
- The kid's own views never join `gift_claims` (and couldn't — no RLS read path).
- A dormant item with an active claim shows mom a "changed their mind — Grandma has this
  reserved" alert so she can redirect grandma gently.
- E2E pins: kid-session RLS probe (zero rows), View-As leak probe, mom's-own-list exclusion
  probe.

### 6.6 Share links (gift-giver export)

Creation flow (mom / granted adult): pick kid → pick scope (whole active list or occasion
filter or pinned items; per-item `excluded_from_shares` always honored) → "Include sizes?"
(pulls `archive_member_settings.physical_description` into an editable snapshot mom reviews
— what she approves is FROZEN into the link) → allow-reserve toggle (per D-43-3) → expiry
(default 90 days) → link created, raw token shown once, copy button. (Email-the-link becomes
one-tap when the PRD-30 SM-C shared sender exists; until then, copy + text it.)

**Public page** `/wish/{token}` — outside AuthGate, no shell, minimal warm styling:
- Header: "**{display_name}'s wish list**" — first name (or mom's edited label) ONLY.
- **Exposure contract (normative, COPPA-reviewed posture):** the payload contains item
  titles, item images, prices, store links, occasion chips, the optional mom-approved sizes
  text, and nothing else. **Never:** child's last name, age, birthdate, photos OF the child,
  family name, address hints, other members' names, or any platform identifiers. Token is
  128-bit unguessable; page is `noindex`; the EF rate-limits per IP; every view bumps
  `view_count`. The ARP data-practices summary gains one line describing this surface
  (coordination note for counsel — PRD-40 territory).
- Items render live (fresh captures inside scope appear; dormant/received/excluded items
  vanish). Sizes section renders the frozen snapshot.
- **Reserve without account** (when enabled): tap "I've got this one" → type a name
  ("Grandma Sue") → item shows "Someone's got this 🡒 rendered with a Lucide check, no
  emoji" to OTHER link-holders and to family adults; the kid never sees any of it. Reserver
  can mark Purchased. No account, no email required, nothing about the child collected.
- Revoked/expired links render a warm dead-end ("This list link has been closed — check
  with the family for a fresh one").

### 6.7 Gift history

Section in Gift Planning: per-member timeline grouped by year/occasion (received AND given),
sourced from claim `given` transitions + manual entries. Purpose: never re-gift, remember
"what did we get grandma last year," and a Traditions-adjacent memory ("R got their first
bike, Christmas 2026"). Filter by member/occasion/year. Manual add is a small form
(`given_on` = date picker, user-chosen).

### 6.8 Archives & LiLa touchpoints

- The auto-provisioned Archives Wishlist folder becomes a **doorway**: opening it navigates
  to that member's wishlist surface. No copies, no separate rendering (Convention #75). The
  orphaned-folder state ends.
- Wishlist header shows the standard context indicator: "LiLa is drawing from X/Y wishes"
  + per-group heart-all/unheart-all (grouped-page convention).
- A manual **Send to Archives** action on items that reveal durable interests ("anything
  horses") routes via RoutingStrip to the member's Interests & Hobbies folder — mom-curated,
  never automatic (D-43-7).

---

## 7. AI, Edge Functions & Cost Model

### 7.1 `wishlist-extract` (new EF — one function, two modes, recipe-extract precedent)

Category-2 native utility (own EF, empty `context_sources`, NOT LiLa — Convention #248
statement). Full SAFETY-BETA-GATE scaffold from birth (`authenticateRequest`, `detectCrisis`
on text inputs, no-training client, Zod I/O, cost logging).

- **`mode:'link'`** — fetch the URL (MindSweep UA/redirect pattern), parse **og:title /
  og:image / og:price:amount / product JSON-LD / oEmbed** deterministically. $0, no model
  call. Returns `{title, image_url, price?, currency?, domain, confidence:'meta'}`.
  **Haiku fallback** only when no usable meta exists (readable-text extraction → title/price
  guess): `confidence:'ai'`, rendered as a confirm-required suggestion chip. Best-effort
  honesty: when both fail, the item stays a bare URL with the domain chip — never an error
  state that loses the capture.
- **`mode:'photo'`** — image (client-resized ≤1600px, mindsweep-scan pattern) → **Sonnet
  vision** ("what product is this?") → `{title, notes?, confidence:'ai'}` → suggested-title
  chip (HITM on confirm). The photo itself already saved; the model only proposes words.

### 7.2 `wishlist-share` (new EF — public, token-authenticated)

Deployed `--no-verify-jwt`; NO bearer path — auth = token → SHA-256 → row lookup with
expiry/revocation checks, constant-time compare. Actions: `view` (returns the §6.6 payload,
bumps counters), `reserve` / `purchase` / `release` (when `allow_reserve`; writes
`gift_claims` via service role with `claimant_label` + `share_link_id`). Per-IP rate
limiting; no AI; no writes beyond claims/counters; Zod-validated; structured count logging.

### 7.3 `mindsweep-sort` extension

New classification `wishlist` (embedding-first like every destination): "R wants a bike for
Christmas" → destination `wishlist` with detected member name. Review & Route card offers
the wishlist destination with person drill-down; `deployQueueItem` gains a wishlist
deploy path (title + person → list_items insert). Teen MindSweep-Lite disposition mapping:
wishlist classifications surface to teens as "Add to my wishlist" (self only — teens never
auto-write to siblings' lists).

### 7.4 LiLa context (the "what motivates them right now" feed)

- **Loader upgrade** (existing assembler §2f): filter `wishlist_state='active'` AND item
  `is_included_in_ai=true`, order by `created_at DESC`, cap ~15, include title/price/
  occasion. Fires on name detection + gift/want/wish/birthday/christmas topic match
  (existing trigger vocabulary extended).
- **`gift_ideas` lists NEVER load into any conversation whose member is (or View-As subject
  is) the list's subject** — hard exclusion in the assembler, same class as Privacy Filtered
  (Convention #76). They load only for mom/granted adults in gift-shopping contexts
  (the PRD-21 Gifts mode, general mom chat on gift topics).
- **Gifts guided mode** (PRD-21, built): its context expectation ("loads wishlist items for
  the selected person") now actually receives data. Gift suggestions remain
  ephemeral-until-adopted (Convention #279 — display-only output isn't HITM-gated); a
  suggested idea mom likes lands in the gift-ideas list via one tap (that tap IS the
  adoption).
- `is_negative_preference` archive items feed the Gifts prompt as "avoid" context.

### 7.5 Birthday nudge

Daily pg_cron SQL job (no EF needed): for each family member whose birthday
(`date_of_birth`) is exactly N days out (default 21, at family timezone), insert one
`notifications` row to mom (+ granted adults): "R's birthday is in 3 weeks — want to look
over gift ideas?" → `action_url` to Gift Planning. Category `general`/'normal' priority —
never DND-bypassing. Idempotent per (member, year). This is the honest v1 of the external
list's "event-triggered gift prompts"; contract-based occasion triggers stay connector-
territory future work.

### 7.6 Cost model

| Path | Model | Cost |
|---|---|---|
| Link extraction (typical) | none — deterministic parse | $0 |
| Link extraction (fallback) | Haiku | ~$0.0005/capture |
| Photo identification | Sonnet vision | ~$0.01–0.02/photo, occasional |
| MindSweep wishlist classification | existing embedding-first pipeline | ~$0 marginal |
| Gifts-mode suggestions | embedding-first + Haiku compose | ~$0.002/request, on-demand |
| Birthday nudges | SQL only | $0 |

Estimated total: **< $0.05/family/month** worst case. Well inside the platform's
<$1.00/family/month envelope. No Sonnet conversation calls added (Gifts mode already runs on
its PRD-21 routing).

---

## 8. Privacy, Sharing & Security Model

### 8.1 Visibility matrix (normative)

| Surface | Subject kid | Other kids | Mom | Granted adult | Ungranted adult | Special Adult | Family-device (shadow) | Link holder |
|---|---|---|---|---|---|---|---|---|
| Kid's wishlist | full (owner) | no (unless kid/mom shares via existing `list_shares`) | full | per D-43-5 | per D-43-5 | **no** | read + capture (attributed) | scoped view via token |
| `gift_ideas` list | **NEVER (DB-enforced)** | never | full | full | no | never | **never** (restrictive policy excludes shadow) | no |
| `gift_claims` | never (no read path) | never | yes, except on her own list | yes, except own list | no | never | never (no policy) | own link's claims only, via EF |
| Share links (manage) | no | no | full | full | no | no | no | n/a |
| Gift history | no (v1) | no | full | full | no | no | no | no |

### 8.2 The database enforcement (non-negotiable, per founder)

- **RESTRICTIVE policies** (`AS RESTRICTIVE` — ANDed over every permissive policy, present
  and future) on BOTH `lists` and `list_items` (via parent-list join):
  `list_type IS DISTINCT FROM 'gift_ideas' OR util.gift_planning_access(family_id)` — where
  the SECURITY DEFINER helper returns true for the family's primary_parent or a
  `gift_planning`-granted additional_adult **on a real member session** (family-shadow
  sessions return false). This closes the `lists_family_device` hole and immunizes
  gift_ideas against any future permissive-policy drift (FDWA expansions included —
  coordination note: FDWA must never open gift_ideas, and the restrictive policy makes that
  structural rather than procedural).
- `gift_claims` / `wishlist_share_links` / `gift_history`: adult-grant policies only, no kid
  arms, no family-device arms; claims additionally exclude the subject (§5.2).
- **Leak-pass E2E pins required:** kid session probes all four tables (zero rows); family-
  device session probes gift_ideas (zero rows); View-As-kid render probe (no gift surfaces,
  no claim chips); subject-exclusion probe (mom queries claims on her own list → zero).

### 8.3 Share-link exposure (COPPA posture)

Codified in §6.6. Summary for counsel (rides the ARP data-practices summary): a tokenized
wishlist link exposes a mom-chosen first-name label, item titles/images/prices/links, and a
mom-approved frozen sizes snapshot; it collects at most a giver-typed display name for
reservations; it is revocable, expiring, unguessable, non-indexed, and rate-limited. No
child account data, no photos of children, no birthdates ever enter the payload.

### 8.4 The one-direction principle

Restated from §1 as the standing rule for every future gift feature: **kids never gain
affordances to hide content from parents (standing principle, 2026-07-04); parents DO have
DB-enforced surprise-planning surfaces about kids.** The two are not in tension — the first
is about parental oversight of children; the second is mom's own notebook. Proposed as a
CLAUDE.md convention at close-out (§15).

---

## 9. External Requirements List — Translation to This Platform

The founder-supplied requirements list was written by an AI that doesn't know this platform.
Item-by-item disposition (normative):

| # | External ask | Disposition | Rationale |
|---|---|---|---|
| 1a | Bi-directional API for external AI agents + webhooks | **Never-build** | There is no external AI; LiLa is native and already context-assembles wishlists (§7.4). The platform is closed by COPPA posture — no open API surface for children's data, full stop. |
| 1b | Structured profiling fields (sizes, interests, dislikes) | **Already exists** | Archives: Preferences/Interests folders (`archive_context_items`), `is_negative_preference` (live in production), `archive_member_settings.physical_description` (live). This PRD consumes them (§6.6, §7.4) rather than duplicating them. |
| 1c | AI gift suggestions | **Already exists + wire** | PRD-21 Gifts guided mode + the assembler loader — lit up by §7.4. HITM-adoption per Convention #279. |
| 1d | Event-triggered idea prompts (birthday approaching) | **Adapt-onto-existing (v1 small) + connector later** | §7.5 birthday nudge ships now (SQL cron + notification). Full occasion-contract triggers are connector-layer territory, registered stub. |
| 1e | Meta-tagging | **Already exists** | `occasion_tags` (new, §5.1) + `life_area_tags` + embeddings on the context path. No new tagging system. |
| 2a | Universal link scraper (image/price/title/store from URL) | **Build** | `wishlist-extract` link mode (§7.1) — deterministic og:/JSON-LD, honest best-effort, Haiku fallback behind a confirm chip. |
| 2b | Multi-store price tracking + drop alerts | **PlannedExpansionCard** | Requires external price-watch infrastructure (scheduled re-scraping at scale, ToS exposure). Demand-validate first (`wishlists_price_tracking`). |
| 2c | Browser extension capture | **PlannedExpansionCard** | Separate distribution surface + review pipelines; share-sheet + paste-link covers the job today (`wishlists_browser_extension`). |
| 2d | Share-sheet capture | **Partly shipped + PRD-33** | Text/URL share_target → `/sweep` is LIVE today (Android + desktop PWA; iOS Safari does not support PWA share_target — honest platform note; iOS path = copy link → paste into WishCatch, which auto-detects URLs). IMAGE share_target is PRD-33's parked scope (multipart + service worker) — socket noted, not built here. |
| 3a | Surprise-safe claiming (Reserved/Purchased, hidden from recipient) | **Build** | `gift_claims` (§5.2) — DB-enforced subject-invisibility, first-claim-wins. Mom-visibility per D-43-4. |
| 3b | No-account contribution via share link | **Build (D-43-3)** | `wishlist-share` EF reserve action — name-only, nothing collected about the child. |
| 3c | Secret collaboration channels ("planning chat about R") | **Stub** | `conversation_spaces` can host this later (a space R isn't a member of already works mechanically); v1 does not build gift-scoped chat. Registered stub with the space-type note. |
| 3d | Secret Santa generator | **PlannedExpansionCard** | Cheap later on randomizer machinery + claims; demand-validate first (`wishlists_secret_santa`). |
| 4a | Multiple contextual lists (per person, per event) | **Adapt** | One canonical list + `occasion_tags` + filtered views + occasion-scoped share links (§4.1). Extra event lists possible but never the capture default — capture speed wins. |
| 4b | Granular privacy per list AND per item | **Adapt-onto-existing + build small** | List-level: existing sharing model + gift_ideas RLS. Item-level: `excluded_from_shares` + per-item Heart (`is_included_in_ai`) + dormant state. The 100266 visibility vocabulary (family/private/shared) stays where it lives (prizes) — list items don't need a fourth visibility system. |
| 4c | Drag-and-drop priority + Must-Have/Nice-to-Have | **Build (thin)** | dnd-kit + `sort_order` (universal convention) + priority chips on the existing `priority` column. |
| 4d | Gift history (given + received, per person, per year) | **Build** | `gift_history` (§5.4) — small, mom-curated, fed by claim transitions. |

---

## 10. Five-Role Behavior

| Role | Wishlist | Gift Planning | Capture | Claims |
|---|---|---|---|---|
| **Mom** | Sees/edits every member's; owns her own (claims on hers hidden from her) | Full: gift_ideas, share links, history, claims | All paths | Sees all except on her own list |
| **Additional adult** | Per D-43-5 (recommended: reads kids' wishlists by default) | Full **with `gift_planning` grant**; otherwise invisible + Parent-only card on deep link | WishCatch for self + (granted) for kids | With grant, except own list |
| **Independent (teen)** | Own list, full control (add/edit/reorder/dormant/hearts); balance + "$X away"; Ask-to-earn | None (invisible) | WishCatch (self), MindSweep "Add to my wishlist" | Never |
| **Guided** | Own list, simplified; add + changed-my-mind | None | WishCatch (self, simplified) | Never |
| **Play** | Picture grid, view-forward, no prices | None | Via mom | Never |
| **Special Adult** | None (ST-A scoping lesson: never in gift audiences by default) | None | None | Never |
| **Family device** | Kid wishlists readable; capture allowed (attributed) | **Never** (restrictive policy) | WishCatch (attributed via app-layer identity) | Never |
| **Out of Nest / external** | Via share link only | Never | Never | Via link when allow_reserve |

---

## 11. Empty States & Edge Cases

**Empty states (all warm, all with one obvious action):**
- Kid's empty list: "Your wish list is ready! When you spot something you love, it goes
  here." + [Add a wish].
- Mom's Gift Planning, no ideas yet: "When R mentions something they'd love, catch it here —
  they'll never see this list." + [Capture an idea].
- Share page, empty scope: "Nothing on this list right now — check back soon!"
- Gift history empty: "Gifts you record will build the family's memory — no more 'what did
  we get grandma last year?'"

**Edge cases (normative):**
1. Dormant item with active claim → mom-side alert (§6.5); share pages drop the item; the
   claim survives with its title snapshot.
2. Item deleted/archived after external reserve → claim persists via `item_title_snapshot`;
   share page no longer shows it.
3. Claim race → partial unique index; loser sees "already spoken for" (both EF path and
   adult UI path).
4. `child_can_see_finances=false` → no balance strip, no "$X away" (item prices themselves
   still render — they're list content, not ledger data; Play hides prices entirely).
5. Kid has no priced items → no distance chips, no totals row.
6. Same item on kid list AND gift-ideas copy, then kid edits theirs → copy is a snapshot;
   provenance link shows "view current" for mom.
7. Share link created, then kid marks everything dormant → live page empties gracefully.
8. Expired vs revoked links → same warm dead-end page; view attempts on either log nothing
   but a counter.
9. Photo capture with no network in-store → capture queues client-side? NO — v1 requires
   connectivity (offline capture is PRD-33 scope; the sheet shows the standard offline
   banner). Registered socket.
10. Member removed from family → their lists follow existing member-archival behavior;
    outstanding share links for them are auto-revoked (migration + hook).
11. Voice capture duplication → already fixed platform-wide (VOICE-INPUT-REPAIR); WishCatch
    uses the repaired `useVoiceInput` only.
12. Two adults capture the same thing for the same kid in the same store → duplicate
    soft-warning (§6.1) at save time on BOTH paths.
13. Mom captures for "Me" → lands on her own wishlist; dad (granted) browsing her list for
    gift ideas sees it — the adult-to-adult gifting loop works with zero extra machinery.

---

## 12. The Motivation Bridge (April doc honored)

1. **"Add as reward" (mom-side).** On any wishlist item, mom's action sheet offers "Set up
   as a reward" → prefills the EXISTING reward flow (task/routine reward fields
   `reward_description` = item title, `reward_image_url` = item image — the columns already
   exist on both `tasks` AND `list_items`) or a contract prize (prize_text/prize_image_url).
   Provenance: `source_list_item_id` in the artifact's metadata; the wishlist item renders a
   "Set up as a reward ✦" indicator (queried by provenance, no new table — supersedes the
   April doc's `wishlist_reward_links` idea). **Coordination:** ST-F (reward-wire truth) owns
   the payer architecture; this PRD only PREFILLS whatever ST-F leaves standing.
2. **"Ask to earn this" (kid-side).** On the kid's own item → prefills a `reward_proposals`
   row (`terms.want_text` = title, `want_image_url` = image, kid picks the "I will…" half).
   Ships entirely on the KIDS-REWARDS proposal pipe — zero new backend.
3. **"$X away" + savings.** Balance-distance chips (§6.2). "Saving for this" marker =
   moving the item into the kid's existing "Saving For" section (already a wishlist section
   convention). True goal-pool wiring (`pool_type='goal_pool'`) is greenfield → registered
   stub pointing at PRD-28's schema-only columns.
4. **Shopping Mode "Watch For"** (Living-Shopping-List addendum §3.5): reward-configured
   wishlist items near earning surface in mom's Shopping Mode — the addendum spec stands;
   this build wires the query now that reward provenance exists.
5. **FGPZ (family prizes):** a family-goal prize can be picked FROM a wishlist item (image +
   title prefill into the existing `RewardImagePicker` flow) — display-level prefill only,
   no schema coupling.
6. **Wishlist-to-budget** (April doc): priced gift-ideas items sum per kid per occasion in
   Gift Planning ("Christmas for R: 3 ideas · ~$74") — display-only v1; budget envelopes are
   future scope.
7. **PECON Reward Shop (conditional — pack landed 2026-07-07, parallel session).** If the
   Point Economy build has shipped by Phase B, the wishlist item action sheet gains **"Add
   to Reward Shop"** — prefills a `reward_shop_items` row (name/image from the item,
   `source_list_item_id` provenance) so a kid can spend POINTS toward the specific thing
   they wanted, alongside the money path. Display-level prefill only; zero schema coupling;
   verified non-conflicting (PECON purchases → `earned_prizes` `source_type='store_purchase'`;
   this PRD's bridge touches `reward_proposals` + reward fields — disjoint tables). The
   Phase B worker's freshness preamble checks PECON's state.

---

## 13. Stubs & PlannedExpansionCards (registered at close-out)

**PlannedExpansionCards (Convention #31 — all three sections each):**
`wishlists_price_tracking` (price-drop alerts) · `wishlists_browser_extension` ·
`wishlists_secret_santa` · `wishlists_group_gifting` (chip-in/split-cost coordination).

**Stubs/sockets (STUB_REGISTRY entries):**
- Image share_target capture → PRD-33 (S4 slice owns multipart + SW).
- Offline in-store capture queue → PRD-33.
- Emailed share links → PRD-30 SM-C shared `send-email` (one-tap send once the sender
  exists; UI ships with copy-link only + a quiet "email coming" note).
- Gift-scoped secret conversation spaces → PRD-15 machinery, future.
- Savings goal-pool wiring → PRD-28 `pool_type='goal_pool'` (schema-only today).
- Kids' own giving-lists (teen keeps "ideas for Dad"; `gift_for` FK + subject-exclusion
  generalize cleanly) → future build, noted so `gift_for` isn't dropped.
- Kid-safe "gifts I've given" history view → future.
- Occasion-contract triggers (connector) → beyond the v1 birthday nudge.
- Grandparent Out-of-Nest in-app wishlist surface (vs tokenized link) → PRD-37 era.

---

## 14. Founder Decision Record — D-43-1..9 (RESOLVED 2026-07-07)

**Founder ruling, 2026-07-07 (verbatim intent):** "All nine approved as recommended, ONE
change: the name is WishLists (not WishWell) — plain compound-capitals, says what it is…
Confirmed values line as written — surprise is not surveillance; the no-hiding principle
runs one direction."

| # | Decision | Ruling | Status |
|---|---|---|---|
| D-43-1 | Feature name | **WishLists** (founder pick — plain compound-capitals, says what it is; rejected WishWell/WishKeeper/GiftGlow). Keys `wishlists_*`. | ✅ RESOLVED |
| D-43-2 | What a grandma share link exposes | As recommended: first-name-only label (mom-editable), items (title/image/price/link) + occasion chips, optional mom-approved FROZEN sizes snapshot; revocable; 90-day default expiry; noindex; rate-limited; nothing else about the child, ever. | ✅ RESOLVED |
| D-43-3 | Reserve-without-account | **v1**, per-link toggle (default ON at creation prompt). | ✅ RESOLVED |
| D-43-4 | Mom sees claim state on kids' lists? | **Yes** — all gift-access adults see claims EXCEPT on their own list (subject-exclusion protects everyone's surprises, including mom's). | ✅ RESOLVED |
| D-43-5 | Kid wishlist default visibility | Kid + mom + additional_adult by default; siblings NO by default (shareable via existing `list_shares`); Special Adults never. Deeper gift_planning surfaces stay mom + explicit grant. | ✅ RESOLVED |
| D-43-6 | Price tracking / browser extension / Secret Santa | All three = PlannedExpansionCards. | ✅ RESOLVED |
| D-43-7 | Wishlist data → LiLa/Archives | Direct context source, zero copying; per-item hearts + recency; manual "Send to Archives" for durable interests; NO auto-gleaning (Convention #75 discipline). | ✅ RESOLVED |
| D-43-8 | Wishlists default LiLa-included | **Yes** — new wishlists `is_included_in_ai=true` + per-item hearts default true + header indicator. Founder-family backfill only with her explicit ok at build time. | ✅ RESOLVED |
| D-43-9 | v1 scope | Phases A+B as specced (§16 / pack). | ✅ RESOLVED |

## 15. Proposed CLAUDE.md conventions (land at close-out)

1. **Wishlist three-surface contract.** One canonical wishlist per member (`lists`,
   `list_type='wishlist'`) that the subject always fully sees; adult-only `gift_ideas` lists
   (`subject_member_id`) enforced by RESTRICTIVE RLS; tokenized share links as the only
   external exposure. Occasions are per-item tags/views, never separate capture targets.
   Capture never blocks on AI; AI-derived text persists only behind a confirm chip.
2. **Surprise ≠ surveillance (one-direction privacy).** Kids never gain hide-from-parent
   affordances (standing principle 2026-07-04); parents DO have DB-enforced gift-surprise
   surfaces (`gift_ideas`, `gift_claims`, share links) that are invisible to the gift's
   subject — including mom on her own list. Claims tables get no kid read arms and no
   family-device arms, ever.

## 16. Build Phases (summary — slice detail + dispatch prompts in the pack)

- **Phase A — Foundation, capture, three surfaces:** migration (columns, 3 tables, RLS incl.
  restrictive policy + grant, CHECK extension + enumeration test, feature keys);
  `wishlist-extract` EF; WishCatch everywhere (QuickCreate, RoutingStrip, mindsweep-sort);
  wishlist surface per shell; Gift Planning tab (gift_ideas + considering-copies + claims).
- **Phase B — Sharing, intelligence, motivation bridge:** `wishlist-share` EF + public page
  + link manager; gift history; LiLa loader upgrade + Gifts-mode wiring + birthday nudge;
  Add-as-reward / Ask-to-earn / Watch-For / Shopping-Mode wiring; full E2E (leak-pass class
  probes are load-bearing) + Convention #277 eyes-on tour + docs close-out.
