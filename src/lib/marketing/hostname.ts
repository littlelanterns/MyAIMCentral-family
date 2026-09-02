/**
 * LAUNCH-PAGE — hostname-based routing.
 *
 * aimagicformoms.com (+ www) serves the public marketing site; every other
 * hostname (myaimcentral.com, localhost, Vercel preview URLs) keeps the
 * existing app-Welcome behavior untouched. This is a pure function of
 * window.location.hostname — no server-side rewrite is needed because the
 * SPA already serves everything through index.html (vercel.json rewrites
 * "/(.*)" -> "/index.html").
 *
 * A dev-accessible route (/welcome) renders the marketing home directly
 * regardless of hostname, so the site can be built and toured before DNS
 * ever points at it — see App.tsx.
 */

const MARKETING_HOSTNAMES = new Set(['aimagicformoms.com', 'www.aimagicformoms.com'])

export function isMarketingHostname(hostname?: string): boolean {
  const host = (hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '')).toLowerCase()
  return MARKETING_HOSTNAMES.has(host)
}
