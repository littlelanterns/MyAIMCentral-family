# Current State — As of 2026-07-08 early AM (night-batch push; Fable window through 2026-07-12)

> Any coordination session (fresh, compacted, or resumed) rebuilds the full picture from:
> this file → `claude/dispatch-factory/MANIFEST.md` (packs + queue) →
> `.claude/rules/current-builds/*` (in-flight) → `.claude/completed-builds/README.md` (history).

## Landed in the 2026-07-07 NIGHT BATCH (committed + pushed by the coordination seat)

Six-commit batch, seat-executed release (5 lanes entangled in one tree; per-lane commits + one shared-surfaces sweep):

1. **SAFETY-BETA-GATE Slices C/B/A + E** — Layer 1+2 ethics enforcement SHIPPED IN SHADOW MODE. Red-team 63/63 (seat re-verified independently). Migrations 100286/100287/100290. **Founder-owned next: the ~30-function consolidated deploy pass (starts the shadow week), then Phase-4 flip session after ≥1 week of family data.** Slice E window has the deploy list.
2. **Schema batch** — migrations 100286–100294, 100297, 100299 + live_schema regen.
3. **PRD-30 SM-A + SM-B** — safety monitoring detection LIVE in production (safety-classify deployed, founder-approved) + all mom surfaces (/safety-flags, Settings, FO column section, teen disclosure row). Proof: vitest 24/24, spec 21/21, tour 6/6. **SM-C remains** (digests, crisis-hit wiring on 3 surfaces, email provider LAST — founder supplies Resend key/DNS when asked). Note: until SM-C, weekly digests don't exist; flag detail/history are live.
4. **PRD-43 WishLists Phase A** — kid wishlists + DB-enforced hidden gift-ideas + WishCatch capture. wishlist-extract deployed. E2E 11/11, tour caught 4 real bugs. Phase B is a future dispatch (pack final in MANIFEST).
5. **PRD-42 KitchenCompass Phase A** — recipes, This Week plan, Cook View + Family Pointers, Food Profiles. recipe-extract deployed. E2E 10/10, 26-shot tour caught the var(--color-bg) ghost-token transparency bug. Phase B/C future dispatches (C blocked on founder Instacart/Walmart signups).
6. **Shared-surfaces sweep** — App.tsx/Sidebar/PermissionHub/useManagementGrants/SettingsPage/config.toml/package.json/mindsweep cluster + append-docs (CLAUDE.md incl. PECON's drafted Convention #280, STUB_REGISTRY, WIRING_STATUS) citing all lanes.

## In flight right now

- **PECON-EARN (Worker A)** — Slices A1–A3 code-complete; **CRITICAL platform security fix shipped mid-build**: godmother EXECUTE lockdown (migration 100300) after live-proving unauthenticated cross-tenant points/money mutation (all 15 connector functions were anon-executable since Phase 3; ledger drift 0.00 = no evidence of real-world abuse; seat independently verified grants + DEFINER chain). A4 remaining: run point-economy-earning.spec.ts (12 tests, slot granted) + eyes-on tour + close-out. Its migrations 100295/100296/100298/100300/100301 + all its files remain UNCOMMITTED by design — commits at its own close. Window was compacting — build file `PECON-earn.md` carries full state; baton-pass if degraded.
- **PECON-SHOP (Worker B)** — dispatches after Worker A closes (prompt in `claude/dispatch-factory/PECON.md`).
- **SM-C** — dispatches after PRD-30 SM-B founder sign-off (prompt in the PRD-30 build file).

## Standing operating rules (the seat enforces these)

- Model routing per `.claude/rules/model-routing.md`; two-step /model headers on every dispatch (manual founder step). Fable = judgment + seat through 07-12.
- ONE shared Playwright suite across all windows at a time — seat serializes. Tree-level suite results count for all lanes in the tree (established tonight).
- Selective staging by lane; shared files ride a seat-run sweep commit citing contributors; hook overrides only via OVERRIDE_REASON (none used tonight); pre-commit requires live_schema.md staged with any migration (consolidated schema commit is the compliant pattern).
- **Founder standing authorization (2026-07-07): seat batch-reviews and PUSHES after proof green without per-push confirmation.** Production Edge Function deploys + destructive ops stay founder-per-instance (tonight's deploys: safety-classify, wishlist-extract, recipe-extract — all founder-approved in-window).
- Convention #277 tours are load-bearing: tonight they caught two invisible-UI defect classes no other check could see.

## Founder-only open items

1. **Slice E consolidated deploy pass** (~30 functions) — approving starts the shadow week; Phase-4 flip ≥1 week later.
2. Resend API key + domain DNS when SM-C asks (non-blocking, email is SM-C's LAST item).
3. Attorney package (claude/legal-drafts/) — her clock (~2 weeks).
4. `MINDSWEEP_WEBHOOK_SECRET` before email intake ever turns on.
5. **2026-07-12 Fable full-price revisit** — before then: adversarial safety-stack review (seat generates once Slice E deploy + SM-C land; **scope now includes the platform-wide RPC EXECUTE-grant audit** born from PECON's godmother finding), Beta Readiness delta report, Fable-vs-Opus re-pin recommendation, PRD-31 + PRD-40 Fable pre-build windows midweek.
6. OpenRouter privity support ticket (no-training-verification.md §6).

## Seat's SMFX pile (fold into SMFX dispatch as a freshness addendum)

- **CSS token misuse sweep** (one item, two greppable patterns): `backgroundColor:` with `var(--surface-primary)` (a gradient — silently transparent; ~15 pre-existing files incl. HubSettings.tsx) and nonexistent `var(--color-bg)` (ghost token). Both classes produced invisible-UI bugs tonight, caught only by #277 tours.
- Nameless dashboard greeting ("Good evening, there") — check display_name vs auth-metadata read (from CLIENT-DATE tour).
- Convention #280 number claimed by PECON's CLAUDE.md draft — verify no collision at PECON close.

---
*Overwritten at every close-out and baton-pass. History: HISTORY.md.*
