import { LegalPageShell } from './LegalPageShell'
import { useMarketingSEO } from '@/lib/marketing/useMarketingSEO'

/**
 * Condensed, public-facing rendering of claude/legal-drafts/privacy-policy-draft.md
 * and data-practices-summary.md — the substantive commitments only. The
 * internal margin notes ("[Note for counsel]", "[PLANNED]", question lists
 * for the attorney) are drafting scaffolding for legal review and do not
 * belong on a public page; this component keeps the plain-language
 * promises those drafts already committed to and marks the whole page as
 * a beta draft awaiting attorney sign-off (see LegalPageShell banner).
 */
export function PrivacyPolicyPublic() {
  useMarketingSEO({
    title: 'Privacy Policy — a.i.magic for moms',
    description: "How MyAIM Central and a.i.magic for moms collect, use, and protect your family's information.",
    path: '/privacy',
  })

  return (
    <LegalPageShell title="Privacy Policy">
      <p>
        Three Little Lanterns LLC ("we," "us," "our") makes MyAIM Central (myaimcentral.com) and a.i.magic for
        moms (aimagicformoms.com). This policy explains what information we collect, how we use it, who can
        see it, and the choices and rights you have. We wrote it to be readable — because if you're trusting
        us with your family's information, you deserve to understand exactly what we do with it.
      </p>

      <div>
        <h2>The short version</h2>
        <ul>
          <li>Your family's data belongs to your family. We never sell it, and there are no advertising trackers anywhere in the product.</li>
          <li>The parent is in charge — she controls what's collected about each family member, what our AI assistant can use, and what other family members can see.</li>
          <li>
            Children get extra protection. For children under 13, we collect nothing until a parent reads our
            disclosures and gives verified consent, as U.S. federal law (COPPA) requires.
          </li>
          <li>AI is a tool we use to serve you, not a data buyer — every AI-generated response passes a human review step before it's saved.</li>
        </ul>
      </div>

      <div>
        <h2>Who we are</h2>
        <p>
          Three Little Lanterns LLC is a Missouri limited liability company. Email: aimagicformoms@gmail.com
          (a monitored inbox read directly by the founder). Mailing address: [Mailing address — pending;
          flagged for counsel].
        </p>
      </div>

      <div>
        <h2>Information we collect</h2>
        <p>
          From the parent who creates the account: name, email, password (stored hashed), and subscription
          status. Payment information is processed by our payment processor — card numbers never touch our
          servers.
        </p>
        <p>
          About family members the parent adds: profile basics (name or nickname, age or birthdate,
          relationship, avatar), sign-in helpers (a PIN stored only as a secure hash, or a picture password
          stored as a scrambled code — never in readable form), and activity within the features the parent
          turns on for that member.
        </p>
        <p>
          We do not use third-party advertising or analytics trackers. None exist in the product.
        </p>
      </div>

      <div>
        <h2>How we use information</h2>
        <p>
          To run the platform, power the features your family uses, personalize LiLa (our AI assistant) using
          the context you've chosen to share with her, and keep the service safe and working. We never use
          your information to sell it, rent it, advertise to you or your children, or train AI models on your
          family's private data.
        </p>
      </div>

      <div>
        <h2>AI features (LiLa) and AI service providers</h2>
        <p>
          When you talk with LiLa, we send the conversation — along with the family context you've approved
          for AI use — to our AI service providers to generate a response. The parent controls exactly what
          LiLa can use: every context item has an on/off toggle at the person, category, and item level.
          Every AI-generated output is presented for human review (edit, approve, regenerate, or reject)
          before it's saved to your family's records.
        </p>
      </div>

      <div>
        <h2>Who can see your family's information</h2>
        <p>
          Inside your family, the primary parent sees the family's information, subject to the platform's
          permission system; other adults and children see only what the parent grants. Our infrastructure
          providers (database hosting, web hosting, payment processing, AI providers) process data only to
          run the service on our behalf, under contracts limiting their use of it. We disclose information
          only when validly required by law, or if the company is ever acquired or reorganized — and we will
          tell you in either case unless legally prohibited. We never sell personal information, and we
          never share it with advertisers, marketers, or data brokers.
        </p>
      </div>

      <div>
        <h2>Data retention</h2>
        <p>
          We keep information only as long as we reasonably need it to run the features your family uses. AI
          conversation transcripts for children under 13 are automatically deleted after 90 days. Structured
          family records are kept for as long as parental consent for that child is active, and are deleted
          when consent is revoked (after a grace window so an accidental tap can be undone). Parental
          consent and verification records are kept permanently, as legal evidence of consent.
        </p>
      </div>

      <div>
        <h2>Children's privacy (COPPA)</h2>
        <p>
          Before we collect any personal information from or about a child under 13, the primary parent must
          read our disclosures and complete verified parental consent. The parent can, at any time: review
          everything collected about the child, export all of the child's data in a readable archive, edit
          or delete individual records, revoke consent entirely (which schedules deletion of the child's
          data), and turn off any feature for that child. We never disclose children's personal information
          to any third party for that party's own use, and we never show children advertising.
        </p>
      </div>

      <div>
        <h2>Teens (13–17)</h2>
        <p>
          Teens get their own logins and age-appropriate features. The parent administers the family account
          and controls feature access, and the platform gives teens a transparency panel showing exactly
          what is shared with the parent. We do not sell teens' data or profile them for marketing.
        </p>
      </div>

      <div>
        <h2>Your rights and choices</h2>
        <p>
          Regardless of which state you live in, we honor these for every user: access and export your data,
          correct it, delete it, and close your account. Exercise these rights in-app (Settings) where
          available, or by emailing aimagicformoms@gmail.com. We verify requests and respond promptly, and
          we never discriminate against you for exercising your rights.
        </p>
      </div>

      <div>
        <h2>Security</h2>
        <p>
          We protect your family's information with encryption in transit, row-level security on every
          database table (each family's data is walled off from every other family's), hashed credentials,
          role-scoped access inside each family, and payment handling that keeps card numbers off our
          servers entirely. No system is perfectly secure; if a breach affects your information, we will
          notify you and regulators as applicable law requires.
        </p>
      </div>

      <div>
        <h2>Changes to this policy</h2>
        <p>
          If we change this policy in a way that matters — especially anything affecting children's data —
          we will notify the primary parent by email before the change takes effect, and where the change
          expands what we collect from children or how we use it, we will obtain fresh parental consent as
          COPPA requires.
        </p>
      </div>

      <div>
        <h2>Contact us</h2>
        <p>
          Three Little Lanterns LLC ·{' '}
          <a href="mailto:aimagicformoms@gmail.com">aimagicformoms@gmail.com</a>
        </p>
        <p>Mailing address: [Mailing address — pending; flagged for counsel].</p>
        <p>If you have any privacy concern, email us and a human — the founder — will read it.</p>
      </div>
    </LegalPageShell>
  )
}
