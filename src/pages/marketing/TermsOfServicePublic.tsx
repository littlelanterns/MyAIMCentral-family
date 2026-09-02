import { LegalPageShell } from './LegalPageShell'
import { useMarketingSEO } from '@/lib/marketing/useMarketingSEO'

export function TermsOfServicePublic() {
  useMarketingSEO({
    title: 'Terms of Service — a.i.magic for moms',
    description: 'The terms that govern your use of MyAIM Central and a.i.magic for moms.',
    path: '/terms',
  })

  return (
    <LegalPageShell title="Terms of Service">
      <p>
        These Terms of Service ("Terms") govern your use of MyAIM Central (myaimcentral.com) and a.i.magic
        for moms (aimagicformoms.com), operated by Three Little Lanterns LLC, a Missouri limited liability
        company ("we," "us," "our"). By creating an account or using the service, you agree to these Terms.
      </p>

      <div>
        <h2>1. Who can use the service</h2>
        <p>
          You must be at least 18 years old to create a family account. As the account-owning parent (the
          "primary parent"), you are responsible for the family members you add — including spouses, other
          trusted adults, teens, and children — and for how they use the platform under your administration.
          Children under 13 may be added to a family account only after the primary parent completes our
          verified parental consent process; see our Privacy Policy for details.
        </p>
      </div>

      <div>
        <h2>2. Your account</h2>
        <p>
          You're responsible for keeping your login credentials secure and for all activity that happens
          under your account. Tell us right away if you suspect unauthorized access.
        </p>
      </div>

      <div>
        <h2>3. Subscriptions and billing</h2>
        <p>
          Some features require a paid subscription. Subscription prices, tiers, and any limited-time
          founding-family rates are shown on our pricing page and inside the app. Payments are processed by
          Stripe; we never store your full card number. Subscriptions renew automatically until canceled.
          You can cancel at any time from Settings, and cancellation takes effect at the end of your current
          billing period unless otherwise stated. Founding-family rates are offered to a limited number of
          early families and may be lost if a subscription lapses, as described at signup.
        </p>
      </div>

      <div>
        <h2>4. Your content</h2>
        <p>
          You and your family members retain ownership of everything you create in the platform — journal
          entries, tasks, photos, notes, and conversations with LiLa. You grant us a limited license to
          store, process, and display that content solely to provide the service to you. We do not sell your
          content or use it to train AI models.
        </p>
      </div>

      <div>
        <h2>5. AI-generated content</h2>
        <p>
          LiLa and other AI features generate suggestions, drafts, and responses based on the context you
          provide. AI output can be incomplete or wrong. Every AI-generated output is presented for your
          review — edit, approve, regenerate, or reject — before it's saved to your family's records, and
          you're responsible for reviewing it before relying on it, especially for anything involving
          health, legal, financial, or safety decisions.
        </p>
      </div>

      <div>
        <h2>6. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service for any unlawful purpose, or to harass, abuse, or harm another person</li>
          <li>Attempt to access another family's data or bypass the platform's security or permission system</li>
          <li>Reverse-engineer, scrape, or resell the service without our written permission</li>
          <li>Upload content you don't have the right to share, or content that infringes someone else's rights</li>
        </ul>
      </div>

      <div>
        <h2>7. Termination</h2>
        <p>
          You may close your account at any time from Settings. We may suspend or terminate accounts that
          violate these Terms or put other users' safety or data at risk. If we terminate your account for
          cause, we'll make reasonable efforts to let you export your family's data first, except where
          immediate action is required to protect someone's safety.
        </p>
      </div>

      <div>
        <h2>8. Disclaimers</h2>
        <p>
          The service is provided "as is." We work hard to keep it reliable and secure, but we don't
          guarantee it will be uninterrupted, error-free, or fit for every purpose. MyAIM Central is a family
          organization and AI-literacy tool — it is not a substitute for professional medical, legal,
          educational, or mental-health advice, and LiLa is not a crisis service (see our in-app crisis
          resources for that).
        </p>
      </div>

      <div>
        <h2>9. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, Three Little Lanterns LLC will not be liable for indirect,
          incidental, or consequential damages arising from your use of the service. Our total liability for
          any claim relating to the service is limited to the amount you paid us in the twelve months before
          the claim arose.
        </p>
      </div>

      <div>
        <h2>10. Governing law</h2>
        <p>
          These Terms are governed by the laws of the State of Missouri, without regard to its conflict-of-
          law principles. Any dispute will be resolved in the state or federal courts located in Missouri,
          unless applicable law requires otherwise.
        </p>
      </div>

      <div>
        <h2>11. Changes to these Terms</h2>
        <p>
          We may update these Terms as the service evolves. If we make a change that materially affects your
          rights, we'll notify you by email before it takes effect. Continuing to use the service after a
          change takes effect means you accept the updated Terms.
        </p>
      </div>

      <div>
        <h2>12. Contact us</h2>
        <p>
          Three Little Lanterns LLC · 4032 State Highway VV, Verona, MO 65769 · 208-351-4622 ·{' '}
          <a href="mailto:aimagicformoms@gmail.com">aimagicformoms@gmail.com</a>
        </p>
      </div>
    </LegalPageShell>
  )
}
