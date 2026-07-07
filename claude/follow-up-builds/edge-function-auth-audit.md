# Edge Function Auth Audit — Exposed Endpoint Sweep (DRAFT)

> Status: DRAFT — read-only diagnosis 2026-07-06, no code changed. Companion to `voice-input-repair.md`.
> Triggered by founder question: "are there other similar vulnerabilities where we have exposed endpoints?"
> Method: read all 51 Edge Functions + `config.toml` + `_shared/auth.ts`; classified each function's in-code
> auth gate; live-probed whisper-transcribe. No browser/functional testing.

---

## Plain-English summary

Every Edge Function is deployed with `verify_jwt = false` (a deliberate project convention — the platform
JWT gateway is bypassed so the anon key alone can't get you in; each function is supposed to check auth in
its own code). I checked whether each one actually does. **Out of 51, three have a hole:**

- **whisper-transcribe** — no auth check at all. (The voice bug's security twin. Confirmed live.)
- **extract-insights** — has a check that *looks* like auth but verifies nothing — it reads the token
  without checking the signature, so a forged token walks straight in, then the function runs with full
  service-role database/storage access. This is the more dangerous of the two.
- **mindsweep-email-intake** — an email webhook with no shared-secret; it trusts the payload and only
  checks values (recipient address + sender list) an attacker could learn. Not live yet (email DNS
  unconfigured), so lower urgency — but must be closed before email intake launches.

The other 48 are correctly gated. The pattern is healthy overall; these three are the gaps.

---

## How the 51 functions break down

| Gate type | Count | Verdict |
|---|---|---|
| `authenticateRequest()` — real user verification via `anonClient.auth.getUser(token)` | 39 | ✅ correct |
| Service-role token equality gate (admin tools) — `describe-vs-icon`, `embed-text-admin` | 2 | ✅ correct |
| Cron service-role header match — `embed`, `mindsweep-auto-sweep`, `process-carry-forward-fallback`, `calculate-allowance-period`, `accrue-loan-interest`, `fire-painted-schedules`, `evaluate-deferred-contracts`, `shopping-list-auto-archive` | 8 | ✅ correct |
| **Unverified-JWT decode (fake gate)** — `extract-insights` | 1 | ❌ **bypass** |
| **No auth at all** — `whisper-transcribe` | 1 | ❌ **open** |
| **Webhook, application-layer gate only, no signature** — `mindsweep-email-intake` | 1 | ⚠️ pre-launch risk |

The shared helper `_shared/auth.ts` is correct: it verifies the token against Supabase (`getUser`), so the
39 functions using it are genuinely protected. SAFETY-BETA-GATE Slice C wired six of these recently; that
work was sound — it just didn't cover whisper, extract-insights, or the webhook.

---

## Findings

### S1 — extract-insights: JWT accepted without signature verification (AUTH BYPASS)
`supabase/functions/extract-insights/index.ts:80-97`

The "auth" here decodes the JWT's middle segment with `atob` and reads `sub` — it never verifies the
signature:

```ts
const jwt = authHeader.replace('Bearer ', '');
const payloadB64 = jwt.split('.')[1];
const jwtPayload = JSON.parse(atob(b64));   // decode only — no signature check
const userId = jwtPayload.sub as string;
if (!userId) { ...401 }                     // the ONLY gate: sub must be non-empty
```

Anyone can hand-craft `header.{"sub":"anything"}.sig`, base64url the payload, and pass. There is no signing
key involved, so no secret is needed. After the gate, the function builds a **service-role** Supabase client
(line 110-111) and processes an attacker-supplied `file_storage_path` through an OpenRouter vision/text
model. Two concrete risks:

1. **Open AI bill** — same as whisper: unlimited unauthenticated model calls on the platform's OpenRouter key.
2. **Possible storage IDOR** — the function reads `file_storage_path` from the body using the service-role
   client. `userId` is decoded but (from what I read) not enforced against the file's owner. Needs a closer
   look during the fix, but the shape is a classic "service role + caller-supplied path + no ownership
   check" — an attacker could potentially read other families' uploaded files. **This is why S1 outranks the
   raw-open whisper endpoint.**

**Fix:** replace the hand-rolled decode with `authenticateRequest(req)` (real `getUser` verification), and
while there, confirm the resolved `user.id` is authorized for the `file_storage_path` being read (scope the
storage read to the caller's family, or verify ownership). One Edge Function redeploy. Client already sends a
real Bearer token, so no client change.

### S2 — whisper-transcribe: no auth check (OPEN ENDPOINT)
`supabase/functions/whisper-transcribe/index.ts` — full file, no auth anywhere.

Verified live 2026-07-06: `POST .../functions/v1/whisper-transcribe` with **no Authorization header** reaches
the handler (returns its own 400). Anyone can transcribe up to 25MB/call on the OpenAI bill. Full write-up
and the client-side context are in `voice-input-repair.md` §F6. **Fix:** add `authenticateRequest` (cors →
auth → formData). Client already sends the token — zero client change, one redeploy.

### S3 — mindsweep-email-intake: webhook has no signature/secret (PRE-LAUNCH)
`supabase/functions/mindsweep-email-intake/index.ts:35-82`

Inbound email webhook. `verify_jwt = false`, no in-code token or shared-secret check. It gates on two
application-layer facts: the recipient must match a family's `sweep_email_address`, and the sender must be in
that family's `mindsweep_allowed_senders`. An attacker who learns (or guesses) a family's sweep address plus
one allowed-sender email can POST a forged payload and inject arbitrary content directly into that family's
MindSweep queue — spoofing "an email from grandma."

Mitigating: email intake is **not live** (code comments: "DNS not yet configured"), so there's no real-world
exposure today, and the two-value gate is non-trivial to satisfy.

**Fix (before launch):** verify a shared webhook secret from the email provider (Resend/Postmark/SendGrid all
support signing) — check an `x-webhook-signature` / bearer secret header against a stored secret before
trusting the payload. Tag this to the email-intake launch checklist, not this pass, unless folded in now.

---

## Not vulnerabilities (verified correct — for the record)

- The 8 cron functions all reject any caller whose `Authorization` header doesn't contain the service-role
  key. Correct for pg_cron-invoked functions (Convention #246 pattern).
- `describe-vs-icon` and `embed-text-admin` are admin-only and require exact service-role token equality —
  correct; they're invoked by ingestion scripts, never the client.
- `generate-query-embedding` and `notify-out-of-nest` both call `authenticateRequest` properly (the earlier
  grep ambiguity was the import line, not a missing gate).
- All 39 `authenticateRequest` consumers verify the token against Supabase — real gates, not decode-only.

---

## Proposed disposition

Fold **S1 (extract-insights)** and **S2 (whisper-transcribe)** into the VOICE-INPUT-REPAIR build — both are
one-line-of-defense additions using the existing `authenticateRequest` helper, both need the same single
founder-approved Edge Function deploy pass, and S2 is already in that build (F6). S1 adds one extra function
to the same redeploy plus a storage-ownership check to confirm.

**S3 (mindsweep-email-intake)** → add to the email-intake launch checklist as a hard gate; it's dormant, so
it doesn't need to ride this pass unless you'd rather close it now while we're in here.

**Proof for S1/S2:** extend the `safety-beta-gate.spec.ts` static pin (assert whisper-transcribe and
extract-insights both import `authenticateRequest`) + a live 401 probe for each unauthenticated case, mirroring
the Slice C probes. For S1 also add a probe that a forged-`sub` token is now rejected.

## Founder decisions needed

1. Confirm S1 + S2 fold into VOICE-INPUT-REPAIR (recommended — same deploy, same helper).
2. S3: close now, or tag to the email-intake launch checklist (recommended — it's dormant)?
3. For S1: OK to add a storage-ownership check on `file_storage_path` (recommended — closes the potential
   cross-family file read), or auth-only for now?
