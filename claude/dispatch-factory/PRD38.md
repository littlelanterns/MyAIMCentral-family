# Pre-Dispatch Pack — PRD38: Blog (Cookie Dough & Contingency Plans)

> **Factory status:** synthesized → decisions-pending (2 decisions, batch 9)
> Produced: 2026-07-04 (dispatch factory, Fable 5). Item ID: PRD38. Priority: P5.
> Evidence: `claude/dispatch-factory/VAULT-RECON.md` (38 section).
> Headline: the cleanest absence in the whole factory — zero code, zero tables, zero routes,
> and even its demand-validation card renders nowhere. Its two admin surfaces host inside the
> PRD32 pack's console (Vault-admin sub-nav + the Moderation tab's "Blog Comments" filter that
> pack already reserved). The 29-article content playbook is sitting ready.

## Reconciliation rulings (newer wins — named explicitly)

1. **Sequence: after PRD32** (admin host + comment drain). `/pricing` + the public
   founding-family counter degrade gracefully if PRD31 hasn't landed (counter shows once PRD31's
   mechanism exists; pricing page reads live `subscription_tiers` data, which already exists).
2. **Domain architecture (D-38-1 ANSWERED, founder 2026-07-04):** `aimagicformoms.com` is
   PARKED at GoDaddy, not pointed anywhere. **DNS cutover is a FOUNDER-OPS checklist step
   (GoDaddy → Vercel), never a build dependency** — same treatment as the MindSweep email DNS
   item. The build ships hostname-based routing at the SPA root + the full blog tree, developed
   and E2E-verified against a Vercel preview/staging hostname; the worker delivers the exact
   GoDaddy→Vercel cutover checklist (nameserver/CNAME records, Vercel domain add, SSL) for the
   founder to run whenever she flips the switch. Blog routes are PUBLIC (no auth, no shells,
   no sidebar — Convention #16 N/A by design).
3. **Privacy rules are load-bearing:** anonymous comments with IP→geo-lookup→**DISCARD** (the
   IP is never stored — E2E-probed); negative/spam comments silently "held" (commenter never
   told) draining to the PRD32 Moderation tab's Blog filter; 3/IP/10min rate limit; anonymous
   device-fingerprint hearts with NO threshold (deliberately different from the Vault's
   5-heart rule — both are per-PRD design, not drift).
4. **The two aspirational Edge Functions become real here** (`blog-comment-moderate` Haiku
   classifier; `blog-publish-scheduled` 15-min cron via Convention #246, --no-verify-jwt) —
   and `claude/architecture.md`'s table stops listing fiction.
5. **Supersessions treated as settled** (the PRD's own text): "Strategies & Snippets" →
   "Cookie Dough & Contingency Plans" rename; PRD-32's dual-publish toggle REPLACED by the
   `showcase_feature` pattern. Not reopened.
6. **Registry honesty at close-out:** a top-level STUB row for the base platform is added now
   (currently only the 4 post-MVP sub-items are tracked); the never-rendered `blog` demand card
   noted. SEO ships complete per the PRD (OG/JSON-LD/meta) — it's the reason the blog exists.

## Slice plan (single Sonnet worker, 1-2 sessions)
| Slice | Scope | Routing |
|---|---|---|
| 1 | Schema (5 tables + 7 seeded categories + buckets) + hostname routing + public route tree (no-auth boundary probes) | Sonnet xhigh + rls-verifier |
| 2 | Public surfaces: masonry home + category pills + Load More + CTA banner (config flag), article page (hero, HTML body, hearts, showcase CTA, related, full SEO), free-tools pages | Sonnet xhigh |
| 3 | Comments + engagement: anonymous comment flow (geo-label, discard-IP probe, rate limit), blog-comment-moderate EF, device-fingerprint hearts; blog-publish-scheduled cron | Sonnet xhigh |
| 4 | Admin: blog sub-nav in the PRD32 Vault-admin tab (post list + editor w/ SEO overrides + showcase picker + publish controls), free-tools management, Moderation-tab Blog Comments filter goes live | Sonnet xhigh |
| 5 | E2E (`tests/e2e/features/blog.spec.ts`: public-no-auth boundary — blog never leaks app data or requires session; IP-never-stored probe; held-comment silence; scheduled publish; SEO tags present; hostname fork) + verification + STUB top-level row | Sonnet xhigh |
| Gates | Checkpoint 5 | **Fable if available, else Opus** |

## Founder decisions — ✅ RESOLVED (2026-07-04, batch 9)
| # | Decision | Ruling |
|---|---|---|
| D-38-1 | Domain state | **ANSWERED: parked at GoDaddy, doing nothing.** DNS cutover = founder-ops checklist (GoDaddy→Vercel), NOT a build dependency; build verifies on a preview hostname |
| D-38-2 | Sequence after PRD32; /pricing + founding counter degrade gracefully until PRD31 | **YES** |

## DISPATCH PROMPT (paste into a FRESH session — after batch-9 decisions + PRD32 close-out)
```
⚙ STEP 1 (type this first, before pasting anything else): /model claude-sonnet-5[1m]
⚙ STEP 2: paste the rest of this prompt.

You are the implementation worker for PRD-38 — the public Blog (Cookie Dough & Contingency
Plans). Pack: claude/dispatch-factory/PRD38.md (6 rulings). Evidence:
claude/dispatch-factory/VAULT-RECON.md (38 section). ALL decisions RESOLVED (founder
2026-07-04). D-38-1 answered: aimagicformoms.com is PARKED at GoDaddy — build + verify the
hostname fork against a Vercel preview hostname; DELIVER the GoDaddy→Vercel cutover checklist
as a founder-ops artifact (never block on it).

FRESHNESS PREAMBLE: pack produced 2026-07-04. git log --since=2026-07-04; VERIFY PRD32 landed
(your admin host + comment drain — if absent, STOP); check PRD31 state (counter/pricing
graceful degradation per ruling 1); next free migration number before every push.

READ FIRST: (1) prds/platform-complete/PRD-38-Blog-Cookie-Dough-Contingency-Plans.md — FULL,
every word; (2) specs/Content-Marketing-Pinterest-Strategy.md (the content this platform
serves — read-only context); (3) the PRD32 build's feature-decision file; (4) the pack +
recon. Create .claude/rules/current-builds/PRD-38-blog.md (no YAML frontmatter), pre-build
summary, founder approval BEFORE code.

HARD RULES: the public tree NEVER touches authenticated app data (the no-auth boundary probe
is load-bearing); IP addresses are used for geo-lookup then DISCARDED — never stored (probe
it); held comments are silent to the commenter; crons via util.invoke_edge_function
(--no-verify-jwt, Convention #246); zero tier gating anywhere on the blog; SEO complete per
the PRD; hostname fork must not disturb ANY existing app route (full regression pins after);
Convention #257 dates; the blog is pre-theme public surface (the conventions' auth-page
exception class applies to styling).

PROOF: the new spec + tsc -b + lint + full regression pins (the hostname fork touches the app
root — leak-pass, permissions-wiring, fo-command-center; ask the founder before shared-fixture
suites). NOTHING COMMITS until green + founder eyes-on (eyes-on: publish a real first post
from the playbook and read it on your phone at aimagicformoms.com). Selective staging; founder
confirms before push. Close-out: Checkpoint 5, architecture.md EF-table honesty, STUB
top-level row + sub-item statuses, live_schema regen, archive build file.
```
