import { describe, it, expect } from 'vitest'
import { isMarketingHostname } from '@/lib/marketing/hostname'

/**
 * Pure-function unit test for the LAUNCH-PAGE hostname fork.
 *
 * A real Chromium browser will not let JS override `window.location`
 * (the whole property, or individual accessors like `hostname`) — it's a
 * security-enforced binding tied to the browsing context, and any attempt
 * to redefine it via Object.defineProperty silently no-ops. That makes
 * spoofing a hostname inside an E2E test unreliable (confirmed live during
 * this build's own proof pass). The correct way to verify hostname-based
 * routing logic is here — as a deterministic unit test of the pure
 * matching function — with the E2E suite covering what it actually can:
 * the dev-accessible /welcome route (renders MarketingHome regardless of
 * hostname) and the default localhost behavior on "/" (renders the
 * unmodified app Welcome page). True hostname-fork verification against a
 * REAL alternate hostname happens against a Vercel preview URL or after
 * the DNS cutover (see the founder-ops checklist in the LAUNCH-PAGE build
 * file) — matching the PRD-38 pack's own precedent for this exact pattern.
 */
describe('isMarketingHostname', () => {
  it('matches the apex marketing domain', () => {
    expect(isMarketingHostname('aimagicformoms.com')).toBe(true)
  })

  it('matches the www subdomain', () => {
    expect(isMarketingHostname('www.aimagicformoms.com')).toBe(true)
  })

  it('is case-insensitive', () => {
    expect(isMarketingHostname('AIMagicForMoms.COM')).toBe(true)
    expect(isMarketingHostname('WWW.AIMAGICFORMOMS.COM')).toBe(true)
  })

  it('does not match the app domain', () => {
    expect(isMarketingHostname('myaimcentral.com')).toBe(false)
    expect(isMarketingHostname('www.myaimcentral.com')).toBe(false)
  })

  it('does not match localhost or dev hosts', () => {
    expect(isMarketingHostname('localhost')).toBe(false)
    expect(isMarketingHostname('127.0.0.1')).toBe(false)
  })

  it('does not match a Vercel preview hostname', () => {
    expect(isMarketingHostname('myaim-central-git-feature-branch.vercel.app')).toBe(false)
  })

  it('does not match a look-alike hostname (substring, not exact)', () => {
    expect(isMarketingHostname('aimagicformoms.com.evil.example')).toBe(false)
    expect(isMarketingHostname('notaimagicformoms.com')).toBe(false)
  })

  it('does not match an empty or undefined hostname', () => {
    expect(isMarketingHostname('')).toBe(false)
  })
})
