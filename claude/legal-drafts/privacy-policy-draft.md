# Privacy Policy — DRAFT

> **DRAFT — FOR ATTORNEY REVIEW — NOT LEGAL ADVICE**
>
> Prepared 2026-07-04 for review, revision, and approval by licensed counsel. This draft is
> written for a **nationwide U.S. user base** — it never assumes the reader lives in Missouri.
> Missouri appears only as the operator's home state. The draft describes the platform **as it
> will operate when the PRD-40 consent infrastructure ships**; anything not yet built is
> tagged **[PLANNED — ships with PRD-40 build]** so counsel can see exactly what is live vs.
> specified. Factual claims trace to the companion *Data-Practices Summary* (same folder).
> Blockquotes marked **[Note for counsel]** are margin notes, not policy text.

---

# MyAIM Central Privacy Policy

**Effective date:** [TBD — set at publication]
**Last updated:** [TBD]

Three Little Lanterns LLC ("we," "us," "our") makes MyAIM Central (myaimcentral.com) and
AI Magic for Moms (aimagicformoms.com). This policy explains what information we collect, how
we use it, who can see it, and the choices and rights you have. We wrote it to be actually
readable — because if you're trusting us with your family's information, you deserve to
understand exactly what we do with it.

The short version, in plain words:

- **Your family's data belongs to your family.** We never sell it. We never share it with
  advertisers. There are no ad trackers or third-party analytics in the app.
- **The parent is in charge.** The account-owning parent controls what's collected about each
  family member, what the AI can use, and what other family members can see.
- **Children get extra protection.** For children under 13, we collect nothing until a parent
  reads our disclosures and gives verified consent, as U.S. federal law (COPPA) requires.
- **AI is a tool, not a data buyer.** AI providers process your content only to answer you.
  [Their agreements with us prohibit using your data to train their models. —
  **[Note for counsel: do not publish this sentence until the operative Anthropic/OpenAI/
  OpenRouter terms and settings are verified — see Data-Practices Summary §5.4 and Q3.]**]

> **[Note for counsel — voice]:** The platform's brand voice is warm-but-plain. We have kept
> legal terms of art where they matter (e.g., "verifiable parental consent") and plain
> language everywhere else. Please preserve readability in your edits where possible; a
> parent actually reading this document is part of the compliance story.

---

## 1. Who we are

1.1. Three Little Lanterns LLC is a Missouri limited liability company.
Mailing address: **4032 State Highway VV, Verona, MO 65769**. Email:
**aimagicformoms@gmail.com** (a monitored inbox read directly by the founder). Phone:
**208-351-4622**.

1.2. We operate two connected products: **MyAIM Central**, a private family management
platform, and **AI Magic for Moms**, a public blog and membership. This policy covers both;
sections about family and children's data apply to MyAIM Central.

## 2. Who this policy is for

2.1. MyAIM Central is built for a parent or guardian (we call this role the **primary
parent**) who sets up the family account and decides which family members participate: other
adults, teens (13–17), and children under 13. Each family member the parent adds uses the
platform under the parent's administration.

2.2. We serve users throughout the United States. We do not currently offer the service
outside the U.S.

## 3. Information we collect

### 3.1. From the primary parent (account owner)

- Account details: name, email address, password (stored hashed), subscription and billing
  status.
- Payment information: processed by **Stripe**; card numbers never touch our servers.
  **[PLANNED — ships with PRD-40 build: the one-time $1.00 parental-verification charge.]**
- Everything the parent creates: family profiles, tasks, calendars, journals, notes about
  family members (including optional health, school, and faith-related notes the parent
  chooses to record), lists, goals, uploaded books and documents, photos, and AI
  conversations.

### 3.2. About family members the parent adds

- Profile basics: name or nickname, age or birthdate, relationship, avatar image, an assigned
  color.
- Sign-in helpers the parent sets up: a PIN (stored only as a secure hash — we never store the
  actual number) or a picture password (the child picks a secret picture; what we store is a
  scrambled server-side code, never "which picture" in readable form). To make family sign-ins
  work, our system creates hidden internal login records for the family and each member; these
  are technical artifacts, not additional profiles.
- Activity within features the parent turns on: tasks and completions (with optional photos),
  journal entries (text and voice recordings), goals and reflections, tracker check-ins,
  messages between family members, allowance and reward records, homeschool time logs, and
  conversations with LiLa (our AI assistant).

### 3.3. Collected automatically

- Technical basics needed to run the service: session tokens, device/browser type, IP address
  in server logs, timezone, and in-app activity events (used for features like streaks and
  "recently used" — not for advertising).
- Bug reports you choose to send, which may include a screenshot of what was on your screen,
  recent pages visited, and technical error details.
- We do **not** use third-party advertising or analytics trackers. None exist in the product.

### 3.4. Children under 13

We collect personal information from or about a child under 13 **only after** the primary
parent completes our COPPA consent and verification flow for that specific child. Section 8
covers this in full. **[PLANNED — ships with PRD-40 build; until it ships, families with
children under 13 are not admitted to the platform.]**

## 4. How we use information

4.1. To run the platform: signing your family in, syncing across devices, showing each family
member their own dashboard, sending the notifications you configure.

4.2. To power the features you use: task and routine tracking, journaling, calendars,
allowance math, celebration and gamification features, homeschool logs and reports for your
own family's use.

4.3. To personalize LiLa, our AI assistant: LiLa uses the family context the parent has
chosen to share with it (see Section 5) so its answers fit your family instead of being
generic.

4.4. To keep the service safe and working: authentication, rate limiting, abuse prevention,
debugging from bug reports, and legally required records (like parental-consent records).

4.5. **What we never use your information for:** selling it, renting it, advertising to you or
your children, or training AI models. We do not build advertising profiles.

> **[Note for counsel]:** "training AI models" — the platform itself does not train models on
> user data. An internal, admin-gated "platform intelligence" pipeline learns anonymized
> product patterns; under-13 data is excluded from it as a binding requirement. See
> Data-Practices Summary §4.2 and Q9 for the interim-state caveat. Please advise whether this
> internal pipeline needs its own disclosure line here.

## 5. AI features (LiLa) and AI service providers

5.1. When you or a family member talks to LiLa, we send the conversation — along with the
family context the parent has approved for AI use — to our AI service providers to generate a
response. Our current providers are **Anthropic** (Claude models, routed through
**OpenRouter**) and **OpenAI** (used for search-relevance embeddings and voice-to-text
transcription).

5.2. These providers process your content to provide the service to us. [They are
contractually prohibited from using your family's content to train their models. —
**[Note for counsel: verify before publication — see §5.4/Q3 of the Data-Practices
Summary.]**]

5.3. The parent controls what LiLa can use. Every context item has an on/off toggle (at the
person, category, and item level), and the parent can disable AI features per family member at
any time in Settings.

5.4. Every AI-generated output is presented for human review (edit, approve, regenerate, or
reject) before it is saved to your family's records.

5.5. Embedding vectors (numerical representations we use for search and relevance) are stored
only in our own database and are never shared.

## 6. Who can see your family's information

6.1. **Inside your family:** the primary parent sees the family's information, subject to the
platform's permission system. Other adults and children see only what the parent grants.
(Small deliberate exceptions exist — for example, private journal entries — described in
Section 8.6 for children under 13.)

6.2. **Our service providers:** the companies that host and power the platform on our behalf,
under contracts limiting their use of your data to providing the service to us:

| Provider | What they do for us |
|---|---|
| Supabase | Database, authentication, file storage, server functions |
| Vercel | Web hosting |
| Stripe | Payment processing **[PLANNED for the verification charge]** |
| Anthropic (via OpenRouter) | AI responses |
| OpenAI | Embeddings and voice transcription |
| [Email provider — TBD] | Transactional email (receipts, notices) **[FOUNDER INPUT NEEDED]** |

6.3. **Nobody else**, with two exceptions every honest company must name:
- **Legal process:** we disclose information if validly required by law (for example, a
  lawful subpoena or court order), and we will tell you unless legally prohibited.
- **Business transfer:** if our company is ever acquired or reorganized, your information may
  transfer with it — under this policy's promises, and we will notify you. **[Note for
  counsel: for children's data, please advise whether to commit to fresh parental
  notice/consent on any transfer — the FTC has policed this in COPPA settlements.]**

6.4. We never sell personal information. We never share it with advertisers, marketers, or
data brokers. We have never received a national security letter or similar demand.
**[Note for counsel: warrant-canary-style sentence — keep or cut at your discretion.]**

## 7. Data retention

> **[Note for counsel]:** the amended COPPA Rule (16 C.F.R. §§ 312.4(d), 312.10) requires the
> online notice to state a written children's data retention policy — purposes, business
> need, and deletion timeframes; indefinite retention is prohibited. The table below is the
> platform's specified policy (enforcement jobs ship with the PRD-40 build). Please confirm
> the framing and the "life of active consent" formulation.

7.1. We keep information only as long as we reasonably need it to run the features your
family uses:

| Information | How long we keep it |
|---|---|
| AI conversation transcripts (all users under 13) | 90 days, then automatically deleted |
| Task-completion photos (children under 13) | 180 days, then automatically deleted |
| Structured family records (tasks, victories, trackers, notes, avatars) | For as long as the parent's consent for that child is active; deleted when consent is revoked |
| Parental consent and verification records | Kept permanently, as legal evidence of consent |
| Account data (adults/teens) | Until the account is deleted |
| Bug reports | [TBD — FOUNDER INPUT + counsel] |
| Server logs | [TBD — confirm with hosting providers] |

7.2. When the parent revokes consent for a child under 13, that child's data is deleted after
a 14-day grace window (so an accidental tap can be undone), and the deletion sweeps every
category of the child's data listed in our consent disclosures. **[PLANNED — ships with
PRD-40 build.]**

## 8. Children's privacy (COPPA)

8.1. **Consent before collection.** Before we collect any personal information from or about
a child under 13, the primary parent must (a) read our disclosures — what we collect, how the
AI uses it, who sees it, and the parent's rights — and (b) complete verified parental consent.
We verify the consenting parent using a one-time $1.00 charge to a payment card, an
FTC-recognized verification method. The charge appears as `MYAIM VERIFY` and a receipt is
emailed. **[PLANNED — ships with PRD-40 build.]**

8.2. **Per-child consent.** Consent is recorded per child. Adding another child later requires
the parent to re-acknowledge the same disclosures for that child (no new charge).

8.3. **What we collect about children** is enumerated in the consent flow and our COPPA
Direct Notice (a copy is emailed to the parent). In summary: profile basics, sign-in helpers
(hashed PIN or picture-password code, plus the hidden internal login records that make child
sign-in work), activity in parent-enabled features (tasks, journals including voice
recordings, trackers, messages, allowance records), the child's LiLa conversations if the
parent grants AI access, the parent's own notes about the child, and photos where enabled.

8.4. **Parental rights.** The parent can, at any time:
- **Review** everything collected about the child (Settings → Privacy & Consent, and the
  child's detail views);
- **Export** all of the child's data in a readable archive;
- **Edit or delete** individual records;
- **Revoke consent entirely**, which deletes the child's data after the 14-day grace window;
- **Refuse further collection** for any feature by turning it off for that child.
We never condition a child's participation on collecting more information than is reasonably
necessary for the activity.

8.5. **No ads, no sale, no third-party disclosure for children.** Children's data goes only to
the service providers in Section 6.2, only so they can run the platform for us. We do not
disclose children's personal information to any third party for that party's own use.

8.6. **A note on children's private spaces.** To help children build healthy journaling
habits, a child can mark certain journal entries "private," which hides them from the
parent's casual day-to-day view inside the app. **The parent's full review and export rights
in Section 8.4 always include these entries for children under 13** — nothing a child under
13 writes is ever outside the parent's reach on the formal review surfaces.
> **[Note for counsel]:** this paragraph implements ruling D-PRD40-3 and is contingent on
> your answer to the carve-outs question (Data-Practices Summary §8.3/Q1). If your advice
> changes the posture, this paragraph and the consent-flow copy change together.

8.7. **Teens are different.** COPPA covers children under 13. Family members 13–17 use the
platform under the parent's administration and the platform's permission system; Section 9
covers additional protections.

## 9. Teens (13–17)

9.1. Teens get their own logins and age-appropriate features. The parent administers the
family account, controls feature access, and can see teen activity as the permission system
provides; the platform also gives teens a transparency panel showing exactly what is shared
with the parent.

9.2. We do not sell teens' data, show them ads, or profile them for marketing — the same as
everyone else.

> **[Note for counsel]:** several states now regulate minors' (under-18) data specifically —
> notably New York's Child Data Protection Act (in effect June 20, 2025), which requires
> informed consent for non-strictly-necessary processing of known minors' data, with the
> 13–17 consent coming from the minor. Please advise whether our parent-administered model
> needs a teen-consent surface for New York users, and whether this section should carry
> state-specific language. See cover memo §Multi-State.

## 10. Your rights and choices (all users)

10.1. Regardless of which state you live in, we honor these for every user: access and export
your data, correct it, delete it, and close your account.

> **[Note for counsel]:** most state comprehensive privacy laws likely do not yet apply to us
> at current scale (see cover memo thresholds table), but we prefer to grant the core rights
> universally rather than gate them by residency. Please confirm this posture and whether we
> must still include state-specific disclosure blocks (e.g., California "notice at
> collection" formatting, Virginia appeal-rights language) once any threshold is met — and
> whether any apply **now**.

10.2. How to exercise rights: in-app (Settings) where available, or by emailing
**aimagicformoms@gmail.com**. We verify requests, respond within [45] days,
and never discriminate against you for exercising rights. If we decline a request, we explain
why and how to appeal. **[Note for counsel: appeal mechanics required by several state laws —
include now or upon applicability?]**

10.3. **Consumer health data.** Some optional features let your family record health-related
information (for example, medical notes in Archives or mood check-ins). We treat this as
sensitive: it is never sold, never shared for advertising, and never used outside the features
you chose.
> **[Note for counsel]:** Washington's My Health My Data Act and Nevada's SB 370 apply
> without size thresholds to consumer health data of those states' residents and have
> specific requirements (separate consumer-health-data privacy policy linked from the
> homepage in WA; consent mechanics; WA has a private right of action). Please advise whether
> these attach to us today and, if so, we will prepare the separate WA policy document —
> flagged as a deliverable, not drafted here.

## 11. Security

11.1. We protect your family's information with, at minimum: encryption in transit,
row-level security on every database table (each family's data is walled off from every
other family's), hashed credentials (passwords, PINs), role-scoped access inside each family,
and payment handling that keeps card numbers off our servers entirely.

11.2. We maintain a written information security program covering children's personal
information, including a designated coordinator, risk assessments, service-provider
assurances, and at-least-annual review. **[PLANNED — documentation to be completed with
counsel; required by the amended COPPA Rule, 16 C.F.R. § 312.8.]**

11.3. No system is perfectly secure. If a breach affects your information, we will notify you
and regulators as applicable law requires. **[Note for counsel: breach-notification
obligations span all 50 states (Missouri: Mo. Rev. Stat. § 407.1500); recommend we prepare an
incident-response one-pager as a companion task.]**

## 12. Where your data lives

12.1. Our infrastructure is hosted in the United States **[UNKNOWN — confirm Supabase/Vercel
regions before publication]**. We do not transfer your data internationally as part of the
service.

## 13. Changes to this policy

13.1. If we change this policy in a way that matters (especially anything affecting
children's data), we will notify the primary parent by email before the change takes effect,
and — where the change expands what we collect from children or how we use it — we will
obtain fresh parental consent as COPPA requires. Prior versions remain available on request,
and our consent records always preserve the exact text each parent agreed to.

## 14. Contact us

Three Little Lanterns LLC
4032 State Highway VV, Verona, MO 65769
208-351-4622
aimagicformoms@gmail.com

If you have any privacy concern, email us and a human — the founder — will read it.

---

## QUESTIONS FOR COUNSEL (privacy policy)

1. **Operator-notice completeness (amended § 312.4(d)):** does this draft satisfy the amended
   online-notice content requirements for the children's section — including the retention
   policy statement, the identities/categories of third parties and purposes, and (new)
   operator phone number? Please conform any missing elements.
2. **State rights posture (§10):** confirm the "grant core rights universally, gate nothing by
   residency" approach, and identify any state-specific disclosure blocks we must include
   *today* versus at defined growth triggers (see cover memo).
3. **Consumer health data (§10.3):** do WA MHMD / NV SB 370 attach now given health-related
   archive notes and mood tracking for users in those states? If yes, we will produce the
   separate WA consumer-health-data policy + homepage link as its own deliverable.
4. **New York CDPA (§9):** does our parent-administered teen model require a teen
   informed-consent surface for New York minors 13–17, and should the policy say so?
5. **AI-provider sentence (§5.2):** hold until contracts verified — please tell us exactly
   what contractual assurances you need to see (and whether the amended Rule's written-
   assurances requirement, § 312.8, is satisfied by standard DPAs or needs bespoke language).
6. **Business-transfer clause for children's data (§6.3):** should we commit to fresh
   parental notice/consent on transfer?
7. **MMPA exposure check:** as Missouri counsel, please red-line any statement here that
   could be read as an over-promise under the Missouri Merchandising Practices Act (and
   FTC Act § 5) — we would rather promise less and honor more.
8. **Effective-date mechanics:** any requirement to date/version this policy in a particular
   way given the versioned consent-template system (each parent's consent stores the exact
   disclosure text version they saw)?
9. **Blog/membership (aimagicformoms.com):** does the public blog need its own shorter policy
   (it has comments and a membership), or can this policy cover both with a scope section?

## Margin sources

- [16 C.F.R. Part 312 (eCFR, current)](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312/section-312.4);
  [Amended COPPA Rule — Federal Register (Apr. 22, 2025)](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule);
  [FTC COPPA FAQ](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions).
- Retention: [Fenwick on amended-rule retention practices](https://www.fenwick.com/insights/publications/what-the-amended-coppa-rule-means-for-data-retention-practices).
- Missouri: [MO AG statutory guide to privacy & data-breach laws](https://ago.mo.gov/get-help/programs-services-from-a-z/identity-theft-data-security/statutory-guide/);
  MMPA enforcement trend: [Chambers, Data Protection & Privacy 2026 — USA (Missouri)](https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2026/usa-missouri/trends-and-developments).
- NY CDPA: [Morrison Foerster overview](https://www.mofo.com/resources/insights/250701-the-new-york-child-data-protection-act);
  [Goodwin alert](https://www.goodwinlaw.com/en/insights/publications/2025/06/alerts-practices-dpc-new-yorks-child-data-protection-act-now-effect).
- WA/NV health data: [DWT — MHMD and its Nevada twin](https://www.dwt.com/blogs/privacy--security-law-blog/2024/04/my-health-my-data-act-washington-nevada).
