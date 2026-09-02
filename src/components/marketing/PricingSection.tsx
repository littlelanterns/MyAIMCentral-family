import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { brand } from '@/lib/theme/tokens'

interface Tier {
  id: string
  name: string
  slug: string
  price_monthly: number
  founding_discount: number | null
  sort_order: number
}

const FOUNDING_LIMIT = 100

async function fetchTiers(): Promise<Tier[]> {
  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('id, name, slug, price_monthly, founding_discount, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

async function fetchFoundingCount(): Promise<number | null> {
  const { data, error } = await supabase.rpc('get_founding_family_count')
  if (error) return null
  return typeof data === 'number' ? data : null
}

function foundingPriceFor(tier: Tier): number | null {
  if (tier.founding_discount == null || Number(tier.founding_discount) <= 0) return null
  return Number(tier.price_monthly) - Number(tier.founding_discount)
}

export function PricingSection() {
  const { data: tiers, isLoading, isError } = useQuery({ queryKey: ['marketing-tiers'], queryFn: fetchTiers })
  const { data: foundingCount } = useQuery({
    queryKey: ['marketing-founding-count'],
    queryFn: fetchFoundingCount,
    // Graceful degradation: if this RPC ever isn't there yet (e.g. this
    // migration hasn't reached a given environment), the section still
    // renders the plans with the static "first 100 families" framing.
    retry: false,
  })

  const spotsLeft = typeof foundingCount === 'number' ? Math.max(0, FOUNDING_LIMIT - foundingCount) : null
  // Graceful default: if the count RPC is unavailable, assume the founding
  // window is still open rather than silently dropping the framing.
  const foundingOpen = spotsLeft === null || spotsLeft > 0

  // Round 3: founding pricing is back to being a REAL discount (not just a
  // lock), so the headline leads with the cheapest founding price rather
  // than a generic tagline — computed live from subscription_tiers, never
  // hardcoded, so it can never drift from what the cards below actually
  // show.
  const cheapestFoundingPrice =
    foundingOpen && tiers && tiers.length > 0
      ? tiers.reduce<number | null>((min, tier) => {
          const price = foundingPriceFor(tier)
          if (price == null) return min
          return min == null ? price : Math.min(min, price)
        }, null)
      : null

  return (
    <section id="pricing" className="py-16 px-6" style={{ backgroundColor: brand.warmCream }}>
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-3" style={{ color: brand.warmEarth, fontFamily: 'var(--font-heading)' }}>
          {cheapestFoundingPrice != null
            ? `Founding families start at just $${cheapestFoundingPrice.toFixed(2)}/mo`
            : 'Simple, honest pricing'}
        </h2>
        <p className="text-base max-w-2xl mx-auto mb-3" style={{ color: brand.warmEarth, opacity: 0.75 }}>
          Every plan includes LiLa, your five-shell family dashboard, and the celebration-only design
          philosophy — no punishment mechanics, ever.
        </p>
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-10"
          style={{ backgroundColor: brand.softGold, color: brand.warmEarth }}
        >
          <Lock size={16} style={{ color: brand.goldenHoney }} />
          {foundingOpen
            ? spotsLeft !== null
              ? `${spotsLeft} of ${FOUNDING_LIMIT} founding spots left — keep these prices forever`
              : `The first ${FOUNDING_LIMIT} families keep these prices forever`
            : 'Founding spots are full — see current pricing below'}
        </div>

        {isLoading && <p style={{ color: brand.warmEarth, opacity: 0.6 }}>Loading pricing…</p>}
        {isError && (
          <p style={{ color: brand.warmEarth, opacity: 0.6 }}>
            Pricing is temporarily unavailable — email us at{' '}
            <a href="mailto:aimagicformoms@gmail.com" style={{ color: brand.sageTeal }}>
              aimagicformoms@gmail.com
            </a>{' '}
            and we'll fill you in.
          </p>
        )}

        {tiers && tiers.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="pricing-tiers">
            {tiers.map((tier) => {
              const foundingPrice = foundingOpen ? foundingPriceFor(tier) : null
              return (
                <div
                  key={tier.id}
                  className="rounded-2xl p-6 text-left flex flex-col relative"
                  style={{ backgroundColor: '#ffffff', border: `2px solid ${brand.softSage}` }}
                  data-testid={`pricing-tier-${tier.slug}`}
                >
                  {foundingPrice != null && (
                    <div
                      className="inline-flex items-center gap-1 self-start px-2.5 py-1 rounded-full text-xs font-semibold mb-3"
                      style={{ backgroundColor: brand.softGold, color: brand.warmEarth }}
                      data-testid={`pricing-tier-${tier.slug}-founding-badge`}
                    >
                      <Lock size={12} style={{ color: brand.goldenHoney }} />
                      Founding badge
                    </div>
                  )}
                  <h3 className="text-lg font-bold mb-1" style={{ color: brand.warmEarth }}>
                    {tier.name}
                  </h3>
                  {foundingPrice != null ? (
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span
                        className="text-base font-medium"
                        style={{ color: brand.warmEarth, opacity: 0.45, textDecoration: 'line-through' }}
                      >
                        ${Number(tier.price_monthly).toFixed(2)}
                      </span>
                      <span className="text-3xl font-bold" style={{ color: brand.deepOcean }}>
                        ${foundingPrice.toFixed(2)}
                        <span className="text-sm font-normal" style={{ color: brand.warmEarth, opacity: 0.6 }}>
                          {' '}
                          /mo
                        </span>
                      </span>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold mb-1" style={{ color: brand.deepOcean }}>
                      ${Number(tier.price_monthly).toFixed(2)}
                      <span className="text-sm font-normal" style={{ color: brand.warmEarth, opacity: 0.6 }}>
                        {' '}
                        /mo
                      </span>
                    </p>
                  )}
                  {foundingPrice != null && (
                    <p className="text-sm font-semibold mb-4" style={{ color: brand.goldenHoney }}>
                      Founding family price — the first {FOUNDING_LIMIT} families keep it forever
                    </p>
                  )}
                  <div className="mt-auto flex items-center gap-2 text-xs" style={{ color: brand.warmEarth, opacity: 0.6 }}>
                    <CheckCircle2 size={14} style={{ color: brand.sageTeal }} />
                    Cancel anytime
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
