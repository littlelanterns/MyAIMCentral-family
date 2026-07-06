# No-Training Claim — Verification Evidence File

> **EVIDENCE FILE — FOR ATTORNEY REVIEW — NOT LEGAL ADVICE**
> Prepared 2026-07-05 by the founder's AI drafting assistant, at Tenise Wertman's request, to
> verify (not merely assert) the bracketed claim in `parental-consent-flow-copy-draft.md`
> Screen 2: *"(They may not use your family's content to train their models. — see counsel
> note below.)"* This is the item logged as **Q3** in `data-practices-summary.md` §5.4/§9 and
> flagged in the consent draft's counsel notes (§92–95) as not shippable until verified.
>
> Method: (A) a direct read of every AI-calling Edge Function in the codebase, to establish
> exactly what the platform sends today, and (B) web research against each provider's own
> current published terms, with verbatim quotes, source URLs, and access dates. Where the
> research hit ambiguity or a paywall/block, that is recorded honestly rather than inferred.
> All web sources were accessed **2026-07-05**.

---

## 1. Verdict Table

| # | Data flow | Claim in consent draft | Verdict | Why |
|---|---|---|---|---|
| 1 | **Anthropic** (Claude Sonnet 4 / Haiku 4.5) reached **through OpenRouter** — every LiLa mode, `ai-parse`, `mindsweep-sort`, `task-breaker`, BookShelf AI features, etc. | "may not use your family's content to train their models" | **VERIFIED-WITH-CONDITION** | Anthropic's own Commercial Terms and Privacy Center say API customer content is not used for training. OpenRouter's own published metadata for the Anthropic provider says the same. **But**: (a) Anthropic's Commercial ToS ties that promise to Anthropic's own direct "Customer" holding "Anthropic API keys" — we hold none; we are OpenRouter's customer, not Anthropic's; whether Anthropic's promise passes through OpenRouter to us is not documented anywhere either company publishes. (b) OpenRouter explicitly disclaims its own provider-policy display as non-binding. (c) Our code never sends OpenRouter's per-request `data_collection: "deny"` enforcement — we rely entirely on default behavior. See §3 and §4. |
| 2 | **OpenAI** (`text-embedding-3-small` embeddings; `whisper-1` audio transcription) — called **directly**, not via OpenRouter | Same sentence (the consent draft's "OpenAI for voice-to-text and search relevance" line) | **VERIFIED-WITH-CONDITION** | OpenAI's current API data-usage policy states API inputs/outputs are not used for training "unless you explicitly opt in" — and this applies platform-wide, including embeddings and audio endpoints (confirmed retention specifics differ slightly by endpoint but the no-train-by-default rule does not). Our code contains no opt-in call. **But** the opt-in toggle lives entirely in the OpenAI organization dashboard, outside the codebase — code review can prove we never *turn it on*, but cannot prove the founder's OpenAI org has never had it turned on historically (e.g., via a free-credits promotion). Needs a dashboard screenshot. See §5. |
| 3 | **OpenRouter itself**, as the intermediary handling every Anthropic-routed request (not named directly in the consent draft's sentence, but load-bearing context) | (implicit — "bound by agreements limiting their use of your data to providing our service") | **VERIFIED-WITH-CONDITION** | OpenRouter's Privacy Policy states it does not store prompts/responses unless the account opts in to either (a) private "Observability" logging or (b) allowing OpenRouter to use prompts to improve its own product (in exchange for a discount) — both off by default. Our code sends no flags requesting either. Confirmation that neither was ever toggled on lives in the OpenRouter account dashboard, not the codebase. See §5. |

**No claim in this set reached a plain "VERIFIED" — every one has at least one condition that only an account-dashboard check (founder) or a contract-privity judgment call (counsel) can close.** None reached "CANNOT VERIFY PROGRAMMATICALLY" outright, because for all three there IS a current, on-point, quotable policy — the gap is in *how it attaches to us specifically* (Anthropic/OpenRouter) or *whether it was ever overridden in an account setting* (OpenAI/OpenRouter), not in a total absence of information.

---

## 2. Code-level findings — what the platform sends today

**Architecture fact, checked first because it changes what "fix this in code" means:** there is
**no shared OpenRouter client** in this codebase. Grep confirms zero matches for a common
wrapper file; every Edge Function builds its own `fetch('https://openrouter.ai/api/v1/chat/completions', …)`
call independently. Count: **~45 call sites across ~30 Edge Functions** (`ai-parse`,
`lila-chat`, `lila-cyrano`, `lila-mediator`, `lila-board-of-directors`, `mindsweep-sort`,
`mindsweep-scan`, `task-breaker`, `bookshelf-extract`, `bookshelf-discuss`,
`bookshelf-study-guide`, `bookshelf-process`, `bookshelf-key-points`, `curriculum-parse`,
`calendar-extract`, `celebrate-victory`, `homework-estimate`, `smart-list-import`,
`spelling-coach`, `scan-activity-victories`, `message-coach`, `auto-title-thread`,
`describe-vs-icon`, `guided-nbt-glaze`, `extract-insights`, and the seven `lila-*` Love
Language / communication tools). Representative citations:

- `supabase/functions/lila-chat/index.ts:540` (main conversation engine, streaming)
- `supabase/functions/ai-parse/index.ts:62` (generic non-streaming utility call)
- `supabase/functions/task-breaker/index.ts:148`
- `supabase/functions/mindsweep-sort/index.ts:645`
- `supabase/functions/lila-board-of-directors/index.ts:106,225,377,418,1071,1168,1267` (per-advisor + moderation calls)

**Exact request shape (all 45 sites, no material variation):**

```ts
const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://myaimcentral.com',
    'X-Title': 'MyAIM Central' /* or a per-tool title */,
  },
  body: JSON.stringify({
    model: modelId,        // always 'anthropic/claude-sonnet-4' or 'anthropic/claude-haiku-4.5'
    messages,
    stream: true,          // some call sites only
    max_tokens: 2048,       // varies
  }),
})
```

**Confirmed by exhaustive grep across `supabase/functions/`:** no call site includes a
`provider` key of any kind, and the string `data_collection` does not appear anywhere in the
repository. This means **the OpenRouter per-request training-opt-out hardening described in
§4.3 below is entirely absent today** — every request relies solely on (a) Anthropic's default
policy and (b) whatever the OpenRouter account's dashboard-level privacy settings happen to be
set to, neither of which the application code touches or can verify at runtime.

**Model IDs confirmed from source** (not assumed): `anthropic/claude-sonnet-4` and
`anthropic/claude-haiku-4.5` are the two models used everywhere, with three files
(`lila-board-of-directors/index.ts:36`, `auto-title-thread/index.ts:21`,
`message-coach/index.ts:29`) using the dated snapshot `anthropic/claude-haiku-4-5-20251001`
instead. All model IDs use the `anthropic/` namespace prefix — the platform never calls a
generic/auto-routed OpenRouter model slug for these purposes. **No direct Anthropic API usage
exists anywhere in the codebase**: `Deno.env.get('ANTHROPIC_API_KEY')` and `api.anthropic.com`
both return zero matches; the only mention of `ANTHROPIC_API_KEY` in the entire repository is
an unused placeholder line in `.env.template:35`. Confirmed separately: OpenAI is called
**directly** (not through OpenRouter) for embeddings (`text-embedding-3-small`, 8 call sites
incl. `supabase/functions/embed/index.ts:91` and `supabase/functions/_shared/embedding.ts:31`)
and for audio transcription (`whisper-1`, `supabase/functions/whisper-transcribe/index.ts:53`),
using only `Authorization: Bearer ${OPENAI_API_KEY}` — no organization header, no per-request
data-sharing flag (the embeddings and audio-transcription REST endpoints do not expose one;
OpenAI's equivalent control is an organization-level dashboard setting — see §5).

### 2.1 PROPOSED code hardening — **FOUNDER APPROVAL REQUIRED, NOT IMPLEMENTED**

Because there is no shared client, "harden this in code" means one of two things, and neither
has been done:

**(a) Minimal per-call-site change** (what would need to be added at each of the ~45 sites —
shown against the `ai-parse` example above):

```ts
body: JSON.stringify({
  model: modelId,
  messages: [{ role: 'system', content: system_prompt }, ...messages],
  provider: { data_collection: 'deny' },   // NEW — forces OpenRouter to route only to
                                            // upstream hosts that do not store/train on data
  max_tokens: max_tokens || 2048,
}),
```

This is a genuine ~1–3 line addition per file, consistent with the task's framing — but doing
it 45 times, by hand, in 30 files, is itself an error-prone refactor, not a single edit.

**(b) The maintainable version** (recommended if this is approved, but a larger change than
"~3 lines" and explicitly **out of scope for this verification pass**): extract a small shared
helper — e.g. a new `supabase/functions/_shared/openrouter.ts` exporting a `callOpenRouter()`
wrapper that always injects `provider: { data_collection: 'deny' }` — and migrate the 30 files
to call it. This would make the no-training posture structurally guaranteed platform-wide
rather than dependent on 45 independent, manually-maintained request bodies never drifting.

**Why this matters even though OpenRouter's own metadata already shows Anthropic as
`training: false`:** `data_collection: "deny"` doesn't just read a flag — it **changes routing
behavior**, excluding any upstream host that would train, for defense-in-depth against (i) the
underlying `anthropic/*` model slug being served through a different upstream arrangement than
assumed (Anthropic direct vs. an Anthropic-via-Bedrock or Anthropic-via-Vertex path — Anthropic
has separate, older commercial-terms documents specifically for those two intermediary
platforms, found during this research, which shows the terms are NOT uniform across every way
of reaching an Anthropic model), and (ii) any future account-default change at OpenRouter that
the application would otherwise silently inherit. **Do not implement without Tenise's explicit
sign-off** — this is a behavior change to every AI call path in the product.

---

## 3. Anthropic — terms research

**Source 1 — Commercial Terms of Service** (`https://www.anthropic.com/legal/commercial-terms`,
version/effective date shown on the page: **June 17, 2025**; accessed 2026-07-05):

> "Anthropic may not train models on Customer Content from Services." *(Section B, Customer
> Content)*

Scope language (Section A.1) ties this commitment to **"Customer's use of Anthropic API keys
and any other Anthropic offerings that reference these Terms."** The page does not contain
language addressing access through a third-party model-routing platform — i.e., it does not
say whether these Commercial Terms (and the no-training promise inside them) extend to a
sub-customer of a reseller/router that itself holds the Anthropic API key. **This is the load-
bearing ambiguity for our situation**, because the platform has no Anthropic API key of its own
(§2 above) — Three Little Lanterns LLC is a customer of OpenRouter, not of Anthropic.

**Source 2 — Anthropic Privacy Center, commercial-products article**
(`https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training`, page
states effective **March 16, 2026**; accessed 2026-07-05):

> "By default, we will not use your inputs or outputs from our commercial products (e.g. Claude
> for Work, Anthropic API, Claude Gov, etc.) to train our models."

Exception carved out on the same page: explicit user feedback (thumbs up/down) or bug reports
submitted through Anthropic's own tooling may be retained (up to 5 years) and used for
training after de-identification — not applicable to us, since nothing in this codebase submits
feedback to Anthropic. The page is silent on OpenRouter or any other reseller/router.

**Conclusion for Anthropic:** Anthropic's *own* stated policy for anyone who is its direct API
customer is unambiguous: no training, by default. What is **not** established by any source we
could reach is whether that specific contractual promise is what governs data sent through
OpenRouter to an `anthropic/*` model — as opposed to whatever separate arrangement exists
between OpenRouter and Anthropic as *its* commercial counterparty, which we are not a party to
and cannot read. See §4 for what OpenRouter says about this same question from its side.

---

## 4. OpenRouter — terms research

**Source 1 — OpenRouter Terms of Service** (`https://openrouter.ai/terms`, effective **May 6,
2026**; accessed 2026-07-05), Sections 5.1 and 5.8:

> §5.1: "You acknowledge that the Service enables you... access to Models provided by Model
> Providers. By accessing or using any Model through the Service, you agree... to comply with
> the applicable terms for each Model."
>
> §5.8: "As between yourself and OpenRouter, these Terms govern the parties' rights and
> obligations with respect to the Service. The applicable Model Terms govern your... access to
> and use of the applicable Model to the extent required by the applicable Model Provider."

Read plainly, this says the end customer (us) may have **direct obligations to Anthropic's own
terms** by virtue of using an Anthropic model through OpenRouter — which cuts the other way from
"OpenRouter insulates us from Anthropic's terms." It does not, however, say we receive the
*benefit* of Anthropic's no-training promise as a matter of contract (obligations flowing to us
are not the same as protections flowing to us) — that remains unresolved by the text available.

**Source 2 — OpenRouter Privacy Policy** (`https://openrouter.ai/privacy`, last updated
**April 15, 2025**; accessed 2026-07-05):

> "We do not control, and are not responsible for, LLMs' handling of your Inputs or Outputs,
> including for use in their model training. To understand how your Inputs are used by AI
> models, check the terms of the providers [here]."

This is OpenRouter affirmatively disclaiming responsibility for what Anthropic does with data
routed to it, and pointing back to Anthropic's own terms (§3 above) — i.e., OpenRouter is
telling us to go verify the exact thing we are trying to verify, without itself certifying the
outcome.

On OpenRouter's **own** handling (separate from Anthropic's): "OpenRouter does not store your
prompts or responses, unless you opt in to one or both of the following" — (a) private request
logging ("Observability"), off by default, enabled in Observability settings; and (b) allowing
OpenRouter itself to use prompts/completions to improve its product (in exchange for a 1%
usage discount), off by default, enabled in Privacy settings. Neither is invoked anywhere in
our code (no request-level flags exist for either), so this reduces to an account-settings
question — see the founder checklist in §5.

**Source 3 — Provider Data Policy metadata** (live data pulled from
`https://openrouter.ai/api/frontend/all-providers`, accessed 2026-07-05). OpenRouter's own
displayed record for the Anthropic provider: `"training": false`, `"retentionDays": 30`,
`"canPublish": false`. This is consistent with Anthropic's stated policy in §3. **However**,
OpenRouter's provider-routing documentation (`https://openrouter.ai/docs/features/provider-
routing`, accessed 2026-07-05) explicitly caveats this exact data:

> "This is not a definitive source of third party data policies, but represents our best
> knowledge."

So even OpenRouter itself will not stand behind this figure as a guarantee — it's informational,
not contractual, by its own account.

**Source 4 — the `data_collection` request parameter**
(`https://openrouter.ai/docs/features/provider-routing`, accessed 2026-07-05). Exact
documented JSON shape:

```json
{
  "messages": [{ "role": "user", "content": "Hello" }],
  "provider": { "data_collection": "deny" }
}
```

Documented behavior: `"allow"` (the default if omitted) *"permits providers that retain data
non-transiently and may use it for training"*; `"deny"` *"routes only to providers that do not
collect user data."* **This is the concrete, code-level lever that does not exist in this
codebase today** (§2.1). There is also an account-wide equivalent — separate toggles (per
public documentation and third-party summaries corroborating the same page) for whether paid
vs. free models may route to data-collecting/training providers, configured on OpenRouter's own
account settings page, not in our code.

**Conclusion for OpenRouter:** OpenRouter's documentation is internally consistent and useful,
but it repeatedly disclaims certainty about what happens on Anthropic's/OpenAI's side of the
line, and it exposes controls (both a per-request parameter and account-level toggles) that our
platform does not currently invoke or confirm.

---

## 5. OpenAI — terms research

**Source 1 — OpenAI API data-usage guide** (`https://developers.openai.com/api/docs/guides/
your-data`, accessed 2026-07-05; corroborated by `https://help.openai.com/en/articles/
5722486-how-your-data-is-used-to-improve-model-performance`, which returned HTTP 403 to
automated fetch — likely bot-protection, not a content difference — but was independently
summarized via search and is consistent with the primary quote below):

> "data sent to the OpenAI API is not used to train or improve OpenAI models (unless you
> explicitly opt in to share data with us)."

Retention specifics, confirmed per-endpoint from the same page: abuse-monitoring logs are kept
"for all API feature usage and retained for up to 30 days, unless longer retention is required
by law." The page's own endpoint table shows this 30-day window applies to `/v1/chat/
completions` and `/v1/embeddings` (both used by this platform), while `/v1/audio/
transcriptions` and `/v1/audio/translations` (the Whisper endpoint this platform uses) show
**no abuse-monitoring retention at all** ("None"). Zero Data Retention (ZDR) is available for
eligible endpoints/customers on request but requires prior OpenAI approval — not something we
have applied for or confirmed either way.

**Attempted but blocked:** `https://openai.com/policies/service-terms/` and
`https://openai.com/policies/how-your-data-is-used-to-improve-model-performance/` both
returned HTTP 403 to automated fetch (Cloudflare-style bot protection on openai.com's main
marketing domain; the `developers.openai.com` documentation subdomain, which mirrors the same
substantive policy, was fetchable). Search-result summaries corroborate the same "opt-in to
train, 30-day abuse-monitoring default, ZDR available for eligible customers" framework, but
this evidence file records the fetch failure honestly rather than treating the corroborating
summary as equivalent to a direct quote of the operative Terms document.

**Source 2 — where the actual account setting lives** (`https://platform.openai.com/
settings/organization/data-controls`, referenced via OpenAI's own Help Center article
"What are the Data Controls settings?" — `https://help.openai.com/en/articles/8983077-what-
are-the-data-controls-settings`, corroborated via search 2026-07-05): the organization-level
Data Controls page exposes two independent toggles — **"Share evaluation and fine-tuning data
with OpenAI"** and **"Share inputs and outputs with OpenAI"** — each settable to Disabled /
Enabled for all projects / Enabled for selected projects. This is exactly the kind of
account-level control that a code audit cannot see or verify — it lives in the OpenAI dashboard
for the organization tied to our `OPENAI_API_KEY`, not in any file in this repository.

**Conclusion for OpenAI:** the documented default (no training on API data, including
embeddings and Whisper) matches the consent-copy claim, and our code contains no call that
would opt in. The only gap is confirming, by logging into the dashboard, that this org-level
setting was never toggled on — see §6.

---

## 6. Two-minute founder checklist

Three logins, three screenshots. Save each screenshot into this evidence file's folder
(`claude/legal-drafts/`) as `no-training-screenshot-openrouter.png`,
`-openai.png`, and (if you find one) `-openrouter-support-reply.png`.

**1. OpenRouter — account privacy settings**
- Log in at `openrouter.ai` → **Settings** → **Privacy** (and separately check
  **Observability**, a related but distinct settings tab).
- Confirm: the setting governing whether paid models may route to providers that log/train on
  data is set to the most restrictive option, and the same for the free-models setting if shown
  separately.
- Confirm: "allow OpenRouter to use my prompts to improve the product" (the 1%-discount
  program) is **off**.
- Confirm: request/response logging under **Observability** is **off** (unless you've
  deliberately turned it on for debugging — if so, note that here for counsel, since it means
  OpenRouter itself is retaining full prompt/response bodies outside the 30-day provider
  window discussed in §4).
- Screenshot all of the above.
- **Bonus (recommended, not required for the 2-minute version):** open OpenRouter's support
  chat/email and ask, in writing: *"When we call an `anthropic/*` model through OpenRouter, does
  Anthropic's no-training commercial policy extend to our account, or is that solely a term
  between OpenRouter and Anthropic?"* Save the reply. This is the one question in this whole
  file that only OpenRouter (or counsel reading OpenRouter's actual Model Provider Agreement
  with Anthropic, if obtainable) can close — see §3–4.

**2. OpenAI — organization data controls**
- Log in at `platform.openai.com` → **Settings** (top right, organization-level, not
  project-level) → **Data controls**.
- Confirm both **"Share evaluation and fine-tuning data with OpenAI"** and **"Share inputs and
  outputs with OpenAI"** read **Disabled**.
- Screenshot.

That's the whole checklist. Nothing here requires a purchase, a contract signature, or a call —
just confirming three toggles are where the default (and our code) assumes they are.

---

## 7. What must be true for the bracketed sentence to become publishable

The consent-draft sentence — *"They may not use your family's content to train their
models"* — can only ship once **all** of the following are true. Status as of this file
(2026-07-05):

| # | Condition | Met now? |
|---|---|---|
| 1 | OpenRouter account dashboard confirmed to block routing to any training/logging provider (paid **and** free model settings), and OpenRouter's own product-improvement/Observability toggles confirmed off | **Not confirmed** — likely already true by platform default, but never screenshotted/verified (§6 item 1) |
| 2 | OpenAI organization Data Controls confirmed **Disabled** for both toggles | **Not confirmed** — likely already true by platform default, but never screenshotted/verified (§6 item 2) |
| 3 | Code-level `provider: { data_collection: 'deny' }` hardening implemented across all OpenRouter call sites (or a new shared helper), so the claim is enforced structurally rather than resting on account defaults that could silently change | **Not done** — proposed in §2.1, explicitly not implemented pending Tenise's approval |
| 4 | Written confirmation obtained (from OpenRouter support, or from counsel's review of OpenRouter's actual Model Provider Agreement with Anthropic) that Anthropic's no-training commitment is the operative term for data routed through OpenRouter to us — closing the privity gap identified in §3–4 | **Not done** — this is the item only OpenRouter or counsel can close; flagged as part of Q3 in `data-practices-summary.md` |
| 5 | Counsel confirms items 1–4 collectively satisfy the amended-COPPA §312.8 "written assurances from recipients" requirement (already an open question — Q3 in `data-practices-summary.md` §9) | **Not done** — counsel's call, informed by this file |

**Bottom line: zero of the five conditions are affirmatively confirmed today.** Two of them
(1 and 2) are *probably* already true, because they match each provider's stated default and
nothing in the codebase deviates from that default — but "probably true by default" is not the
same as "verified," and this file's job was to not paper over that difference. The sentence
should stay bracketed until at minimum items 1, 2, and 4 are closed; item 3 strengthens the
claim from "true today, by default" to "true by design" and should be strongly considered
before beta cohort 2 (under-13 families) opens, given how much weight a COPPA disclosure puts on
this exact sentence.

---

## Sources (all accessed 2026-07-05)

- Anthropic Commercial Terms of Service — https://www.anthropic.com/legal/commercial-terms (effective June 17, 2025)
- Anthropic Privacy Center, "Is my data used for model training?" (commercial) — https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training (states effective March 16, 2026)
- Anthropic Privacy Center, "Is my data used for model training?" (consumer, cross-references commercial) — https://privacy.claude.com/en/articles/10023580-is-my-data-used-for-model-training
- Anthropic Privacy Center, Commercial Customers collection — https://privacy.claude.com/en/collections/10663361-commercial-customers
- OpenRouter Terms of Service — https://openrouter.ai/terms (effective May 6, 2026)
- OpenRouter Privacy Policy — https://openrouter.ai/privacy (last updated April 15, 2025)
- OpenRouter Docs, Data Collection — https://openrouter.ai/docs/guides/privacy/data-collection
- OpenRouter Docs, Provider Logging — https://openrouter.ai/docs/guides/privacy/provider-logging
- OpenRouter Docs, Provider Routing (the `data_collection` parameter + non-definitive-data caveat) — https://openrouter.ai/docs/features/provider-routing
- OpenRouter live provider-policy data — https://openrouter.ai/api/frontend/all-providers
- OpenAI API data-usage guide — https://developers.openai.com/api/docs/guides/your-data
- OpenAI Help Center, "How your data is used to improve model performance" (fetch blocked 403; corroborated via search) — https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance
- OpenAI Help Center, "What are the Data Controls settings?" — https://help.openai.com/en/articles/8983077-what-are-the-data-controls-settings
- OpenAI platform Data Controls settings page — https://platform.openai.com/settings/organization/data-controls
- Internal: `supabase/functions/**` (all Edge Functions listed in §2), `.env.template`, `claude/legal-drafts/data-practices-summary.md` §5.4/§9 Q3, `claude/legal-drafts/parental-consent-flow-copy-draft.md` Screen 2 (lines 71–95)
