# COPPA Direct Notice to Parents — DRAFT

> **DRAFT — FOR ATTORNEY REVIEW — NOT LEGAL ADVICE**
>
> Prepared 2026-07-04. This is the notice-to-parents document shaped to 16 C.F.R. § 312.4
> (as amended, in force since June 23, 2025; compliance mandatory since April 22, 2026). It
> is designed to be (a) emailed to the parent when the consent flow begins and again with the
> Screen 6 receipt, and (b) linked from the consent screens. The amended Rule expects the
> direct notice to be complete in itself, with a link to the full privacy policy.
>
> **[Note for counsel]:** please conform this draft clause-by-clause to § 312.4(c)(1) — we
> structured it to the amended content requirements as we understand them (operator identity
> and contact including phone; items of personal information collected; uses; identities or
> specific categories of third-party recipients and the purposes for disclosure; retention;
> how consent is given and revoked; parental rights), but the exact ordering and any
> mandatory phrases are yours to set. Delivery mechanics are Question 2 below.

---

## Direct Notice: Our Collection of Personal Information from Your Child

**From:** Three Little Lanterns LLC (operator of MyAIM Central)
[Mailing address — FOUNDER INPUT NEEDED] · [Phone — FOUNDER INPUT NEEDED] ·
[privacy email — FOUNDER INPUT NEEDED] · myaimcentral.com

You're receiving this notice because you told us **[Child Name]** is under 13. A U.S. federal
law — the Children's Online Privacy Protection Act (COPPA) — requires us to tell you exactly
what we collect about your child, how we use it, and to get your verifiable consent before we
collect anything. This notice is that disclosure, in full. Our complete Privacy Policy is at
[link], but this notice stands on its own.

### 1. Why you're getting this and what we've collected so far

We have collected your name and email address (from your own account) for one purpose: to
seek your consent for [Child Name]. **If you do not give consent within [14 days —
FOUNDER/COUNSEL TO SET], we will take no further action and [Child Name]'s profile will not
be created.** No information about [Child Name] is collected until you consent.

### 2. What we will collect about [Child Name] if you consent

- Their name (or the nickname you choose), age bracket, and how they relate to your family.
- A sign-in helper if you set one up: a PIN (stored only as a scrambled hash — we never store
  the actual number) or a secret-picture password (we store a scrambled server-side code —
  never a readable record of which picture). To make your child's sign-in work, our system
  also creates a hidden internal login record for them; it's a technical artifact, not a
  public profile.
- An avatar or profile image, if you upload one.
- Tasks and routines you assign, and when your child completes them — including an optional
  photo if you turn photo check-offs on.
- Your child's entries in features **you** choose to turn on for them: journal entries
  (including voice recordings, which are transcribed to text), goals and reflections,
  tracker check-ins, worksheets, and messages with family members.
- Your child's conversations with LiLa (our AI assistant), **only if you grant them LiLa
  access**.
- Notes **you** write about your child (for example in Archives — these can include health or
  school notes you choose to record).
- Allowance, reward, and gamification records tied to your child.
- Basic technical information needed to run the service on their device (session tokens,
  device/browser type, timezone). We use **no** advertising or third-party analytics trackers.

### 3. How we use it

To run the features you turned on for your child (their task list, their journal, their
dashboard); to personalize LiLa's responses using only the family context you've approved;
to show you your child's activity; and to keep the service safe and working. Every
AI-generated output passes through your family's review controls before it becomes a saved
record.

**We never use your child's information for advertising. We never sell it. We never train AI
models on it.** We will not condition your child's participation in any activity on
collecting more information than is reasonably necessary for that activity.

### 4. Who receives your child's information, and why

Your child's information is disclosed only to the service providers that run the platform for
us, under contracts limiting their use to providing our service:

| Recipient | Purpose |
|---|---|
| Supabase | Database, sign-in, and file storage (where all family data lives) |
| Vercel | Web hosting |
| Anthropic (via OpenRouter) | Generating LiLa's AI responses when your child or family uses LiLa |
| OpenAI | Search-relevance processing (embeddings) and voice-to-text transcription |
| Stripe | Processing your $1.00 verification charge (your card details go directly to Stripe, never to us) |
| [Email provider — TBD] | Sending you receipts and notices |

We do not disclose your child's personal information to any third party for that party's own
purposes — not advertisers, not marketers, not data brokers, not "partners." If we are ever
legally compelled to disclose information (for example, by a valid court order), we will
comply with the law and tell you unless we are legally prohibited from doing so.

> **[Note for counsel]:** the amended Rule requires parents to be able to consent to
> collection/use WITHOUT consenting to disclosure to third parties, where such disclosure is
> not integral to the service (§ 312.5(a)(2) as amended). Our position for your review: the
> recipients above are service providers whose processing IS integral (the AI providers
> literally generate the product's responses), so no separate disclosure-consent checkbox is
> offered. If you disagree on any recipient, the consent flow gains a second checkbox and
> this notice a corresponding section.

### 5. How long we keep it

- LiLa conversation transcripts: **90 days**, then automatically deleted.
- Task-completion photos: **180 days**, then automatically deleted.
- Structured records (tasks, victories, trackers, notes, avatar): for as long as your consent
  is active — deleted when you revoke.
- Your consent and verification records: kept permanently as legal evidence.

We do not retain your child's personal information longer than reasonably necessary for the
purposes above, and never indefinitely.

### 6. How you give consent — and how we verify it's you

You review five short disclosure sections in the app (what we collect, how LiLa uses it, who
sees it, your rights, and your affirmation that you are the parent or legal guardian). Then we
verify you're an adult with control of a payment card by charging **$1.00** to your card —
a one-time, non-refundable verification charge using an FTC-recognized method. It will appear
on your statement as **MYAIM VERIFY** and we'll email you a receipt. You will not be charged
again for adding more children.

If you choose not to consent, nothing is collected, nothing is charged, and you can still use
MyAIM Central for yourself and family members 13 and older.

### 7. Your rights, any time

- **Review** everything we've collected about [Child Name] (Settings → Privacy & Consent and
  your child's detail pages).
- **Export** all of it in a readable archive we email you a link to.
- **Correct or delete** individual records.
- **Turn off** any feature for your child, including LiLa, at any time — collection for that
  feature stops.
- **Revoke your consent entirely** (Settings → Privacy & Consent → Revoke). Your child's
  information is then deleted — you get a 14-day window to change your mind, and after that
  the deletion is permanent. Revoking for one child never affects your other children.
- **Contact us** about any of this: [privacy email], [phone], [address].

We will honor review, deletion, and refusal-of-further-collection requests even while your
consent remains otherwise active.

---

## QUESTIONS FOR COUNSEL (direct notice)

1. **Clause-by-clause conformity:** please conform this notice to amended § 312.4(c)(1),
   including any required statements we've missed and your preferred ordering.
2. **Delivery mechanics:** is in-app display during the consent flow plus a post-verification
   receipt email sufficient, or must this notice be affirmatively *sent* to the parent's email
   at the start of the flow? (We can trigger either — say the word.)
3. **"Integral" service-provider position (§4 note):** confirm or reject our position that no
   separate third-party-disclosure consent is required for the listed AI/infrastructure
   providers.
4. **Section 1 window:** what is the right "if you do not consent within N days we delete
   your contact-for-consent record" window, and does our per-child flow (parent already has
   her own account) need that clause at all?
5. **The "no training" claim in §3:** held out of the recipients table but present in bold in
   §3 — please confirm we may keep it once provider terms are verified, or soften it.
6. **Voice recordings:** the amended Rule includes audio in personal information. We retain
   child journal audio (we are not within the FTC's ephemeral-audio deletion policy). Does the
   notice's treatment (listed in §2, retention per §5 structured records) suffice, or should
   audio get its own retention line?
7. **Statement descriptor and non-refundability:** any concern with `MYAIM VERIFY` and the
   non-refundable framing of the $1.00 charge?

## Margin sources

- [16 C.F.R. § 312.4 (eCFR, current)](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.4) — notice content;
  [16 C.F.R. Part 312 (LII)](https://www.law.cornell.edu/cfr/text/16/part-312).
- [Amended Rule — Federal Register (Apr. 22, 2025)](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule) — third-party identification and retention additions to the direct notice; separate consent for non-integral disclosures.
- [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions) — monetary-transaction consent method; audio-file policy.
- Drafting structure cross-checked against practitioner guides ([Promise Legal COPPA direct-notice guide](https://blog.promise.legal/coppa-direct-notice-drafting-requirements/)).
