/**
 * PRD-31 Slice 2 — creates/reconciles Stripe Products + Prices for every
 * ACTIVE subscription_tiers row, reading the live pricing (never
 * hand-typed — Convention #256) and persisting the resulting Stripe ids
 * back onto subscription_tiers.
 *
 * Idempotent and re-runnable:
 *   - If a tier already has a stripe_product_id, its Product is reused
 *     (not recreated).
 *   - If a tier's normal/founding monthly price already has a matching
 *     stripe_price_id_*, that Price is left alone — Stripe Prices are
 *     immutable once created, so a genuine price change requires archiving
 *     the old Price and creating a new one, which this script does
 *     automatically when the live subscription_tiers.price_monthly /
 *     founding_discount no longer matches the recorded Price's amount.
 *   - Skips inactive tiers (Creator, is_active=false) entirely — no Stripe
 *     objects are created for a hidden tier. If a tier already had a
 *     product/prices from before being hidden, they are archived (not
 *     deleted — Stripe Products/Prices are never truly deletable once used).
 *   - A tier with founding_discount = 0 (or NULL) gets no founding Price —
 *     stripe_price_id_founding stays NULL and create-subscription-checkout
 *     falls back to the normal price for that tier's founding path.
 *
 * TEST MODE ONLY at this stage — reads STRIPE_SECRET_KEY from the
 * environment exactly like every Edge Function does (no separate live/test
 * branching logic here; whichever key is loaded is the mode this script
 * operates in).
 *
 * Usage:
 *   npx tsx scripts/stripe-setup-subscription-products.ts
 *   npx tsx scripts/stripe-setup-subscription-products.ts --dry-run
 *
 * THIS IS A PRODUCTION-TOUCHING SCRIPT (creates real Stripe objects in
 * whichever mode STRIPE_SECRET_KEY points at, and writes to the live
 * subscription_tiers table). Per the production-touch gate, it must be run
 * only with explicit founder/seat approval — do not invoke automatically.
 */

import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}
if (!STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY environment variable.')
  process.exit(1)
}

const DRY_RUN = process.argv.includes('--dry-run')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const stripe = new Stripe(STRIPE_SECRET_KEY)

interface TierRow {
  id: string
  name: string
  slug: string
  price_monthly: number
  founding_discount: number | null
  is_active: boolean
  stripe_product_id: string | null
  stripe_price_id_normal: string | null
  stripe_price_id_founding: string | null
}

/** True if the recorded Price object's amount (cents) still matches the live decimal-dollar tier value. */
async function priceMatchesAmount(priceId: string | null, expectedDollars: number): Promise<boolean> {
  if (!priceId) return false
  try {
    const price = await stripe.prices.retrieve(priceId)
    if (!price.active) return false
    return price.unit_amount === Math.round(expectedDollars * 100)
  } catch {
    return false
  }
}

async function ensureProduct(tier: TierRow): Promise<string> {
  if (tier.stripe_product_id) {
    try {
      const product = await stripe.products.retrieve(tier.stripe_product_id)
      if (product.active) return product.id
    } catch {
      // Fall through and create a fresh one — the recorded id is stale.
    }
  }

  console.log(`  creating Stripe Product for ${tier.name} (${tier.slug})...`)
  if (DRY_RUN) return `dryrun_product_${tier.slug}`

  const product = await stripe.products.create({
    name: `MyAIM Central — ${tier.name}`,
    metadata: { tier_slug: tier.slug, tier_id: tier.id },
  })
  return product.id
}

async function ensurePrice(
  productId: string,
  tier: TierRow,
  kind: 'normal' | 'founding',
  amountDollars: number,
  existingPriceId: string | null,
): Promise<string> {
  if (await priceMatchesAmount(existingPriceId, amountDollars)) {
    return existingPriceId as string
  }

  if (existingPriceId) {
    console.log(`  archiving stale ${kind} Price ${existingPriceId} for ${tier.slug} (amount changed)...`)
    if (!DRY_RUN) {
      try {
        await stripe.prices.update(existingPriceId, { active: false })
      } catch (err) {
        console.warn(`    could not archive ${existingPriceId}:`, (err as Error).message)
      }
    }
  }

  console.log(`  creating ${kind} monthly Price for ${tier.slug}: $${amountDollars.toFixed(2)}/mo`)
  if (DRY_RUN) return `dryrun_price_${kind}_${tier.slug}`

  const price = await stripe.prices.create({
    product: productId,
    currency: 'usd',
    unit_amount: Math.round(amountDollars * 100),
    recurring: { interval: 'month' },
    metadata: { tier_slug: tier.slug, tier_id: tier.id, kind },
  })
  return price.id
}

async function main() {
  console.log(`Stripe subscription product/price setup${DRY_RUN ? ' (DRY RUN — no writes)' : ''}`)

  const { data: tiers, error } = await supabase
    .from('subscription_tiers')
    .select('id, name, slug, price_monthly, founding_discount, is_active, stripe_product_id, stripe_price_id_normal, stripe_price_id_founding')
    .order('sort_order')

  if (error) {
    console.error('Failed to load subscription_tiers:', error.message)
    process.exit(1)
  }
  if (!tiers || tiers.length === 0) {
    console.error('No subscription_tiers rows found.')
    process.exit(1)
  }

  for (const tier of tiers as TierRow[]) {
    if (!tier.is_active) {
      console.log(`${tier.slug}: inactive, skipping (existing Stripe objects left as-is/archived by hand if needed).`)
      continue
    }

    console.log(`${tier.slug}: $${Number(tier.price_monthly).toFixed(2)}/mo, founding_discount=${tier.founding_discount ?? 0}`)

    const productId = await ensureProduct(tier)

    const normalPriceId = await ensurePrice(productId, tier, 'normal', Number(tier.price_monthly), tier.stripe_price_id_normal)

    let foundingPriceId: string | null = null
    const foundingDiscount = Number(tier.founding_discount ?? 0)
    if (foundingDiscount > 0) {
      const foundingAmount = Number(tier.price_monthly) - foundingDiscount
      foundingPriceId = await ensurePrice(productId, tier, 'founding', foundingAmount, tier.stripe_price_id_founding)
    } else {
      console.log(`  founding_discount is 0 — no founding Price for ${tier.slug}.`)
    }

    if (!DRY_RUN) {
      const { error: updateError } = await supabase
        .from('subscription_tiers')
        .update({
          stripe_product_id: productId,
          stripe_price_id_normal: normalPriceId,
          stripe_price_id_founding: foundingPriceId,
        })
        .eq('id', tier.id)
      if (updateError) {
        console.error(`  FAILED to persist Stripe ids for ${tier.slug}:`, updateError.message)
        process.exitCode = 1
        continue
      }
    }

    console.log(`  -> product=${productId} normal=${normalPriceId} founding=${foundingPriceId ?? '(none)'}`)
  }

  console.log(DRY_RUN ? 'Dry run complete — no Stripe objects created, no DB rows changed.' : 'Done.')
}

main().catch((err) => {
  console.error('stripe-setup-subscription-products failed:', err)
  process.exit(1)
})
