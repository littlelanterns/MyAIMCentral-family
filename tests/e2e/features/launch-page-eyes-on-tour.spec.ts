/**
 * LAUNCH-PAGE — Convention #277 eyes-on tour.
 *
 * Claude drives this via Playwright and reads every screenshot to fill the
 * Mom-UI Verification table in .claude/rules/current-builds/LAUNCH-PAGE.md.
 * Gated behind EYES_ON_TOUR so it never runs as part of the normal suite.
 * The founder's own taste-pass is REQUIRED before close (this is the
 * public face of the brand) — this tour proves correctness, not feel.
 *
 * Run with:
 *   $env:EYES_ON_TOUR='1'; npx playwright test tests/e2e/features/launch-page-eyes-on-tour.spec.ts --headed
 */
import { test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

test.skip(!process.env.EYES_ON_TOUR, 'Manual eyes-on tour — set EYES_ON_TOUR=1 to run')

const OUT_DIR = path.resolve('eyes-on-tour')
fs.mkdirSync(OUT_DIR, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const

const STOPS: { name: string; path: string; anchor?: string }[] = [
  { name: 'hero-pillars', path: '/welcome' },
  { name: 'pricing', path: '/welcome', anchor: '#pricing' },
  { name: 'waitlist', path: '/welcome', anchor: '#waitlist' },
  { name: 'privacy', path: '/privacy' },
  { name: 'terms', path: '/terms' },
]

for (const vp of VIEWPORTS) {
  test(`LAUNCH-PAGE tour — ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    for (const stop of STOPS) {
      await page.goto(stop.path + (stop.anchor ?? ''))
      if (stop.anchor) {
        await page.locator(stop.anchor).scrollIntoViewIfNeeded()
      }
      await page.waitForTimeout(400)
      await page.screenshot({
        path: path.join(OUT_DIR, `launch-page-${vp.name}-${stop.name}.png`),
        fullPage: !stop.anchor,
      })
    }
  })
}
