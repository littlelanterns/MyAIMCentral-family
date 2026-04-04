---
name: PRD-17B MindSweep — Next Session Plan
description: Remaining Phase B + Phase C items for MindSweep completion
type: reference
---

# PRD-17B MindSweep — Next Session Plan

## What's Done (Sprint 1+2, 2026-04-03)
- Phase A: complete (migration, Edge Function, hooks, RoutingStrip wiring)
- Phase B: ~85% (capture page, voice, scan, link, holding queue, settings inline)
- 11 Playwright E2E tests passing, `tsc -b` zero errors
- /simplify review applied (7 fixes: stale closure, shared runner, cache invalidation, etc.)

## Next Session: Phase B Finish + Phase C

### Phase B Remaining (3 items)

**1. Auto-sweep pg_cron job**
- Schedule a pg_cron job that processes the holding queue at the user's configured time
- Default: 8pm family timezone
- Reads `mindsweep_settings.auto_sweep_time` per member
- Calls `mindsweep-sort` Edge Function via pg_net with service role
- Stores results via `routeSweepResults` logic (server-side version needed)
- Consider: may need a lightweight `mindsweep-auto-sweep` Edge Function that pg_cron calls

**2. Share-to-app (Web Share Target API)**
- Investigate current PWA setup (founder mentioned different PWA lib for current Vite version)
- Add share_target to manifest for `/sweep`
- Handle shared text/URLs arriving at `/sweep` via URL params or POST body
- Android: receives shared content directly
- iOS: graceful fallback (no Share Target support — just copy-paste)
- `auto_sweep_shared` setting controls whether shared content auto-processes

**3. PWA manifest for /sweep**
- Investigate what PWA plugin is currently in use
- Add `/sweep` as a distinct PWA entry point with MindSweep icon
- "Add to Home Screen" prompt in settings
- Needs platform_assets icon or Lucide Wand2 as app icon

### Phase C (7 items)

**4. MindSweep Settings in main Settings page**
- The inline settings panel on `/sweep` already works (5 sections)
- Need to also make it accessible from the main Settings page (`/settings`)
- Extract `MindSweepSettingsPanel` to `src/components/mindsweep/MindSweepSettingsPanel.tsx`
- Wire into SettingsPage under a "MindSweep" section

**5. Email forwarding UI**
- Display family's sweep email address (`families.sweep_email_address`)
- [Copy Address] + [Add to Contacts] buttons
- Allowed senders CRUD (`mindsweep_allowed_senders` table — already exists)
- Toggle for email processing mode (immediate vs holding queue)
- Email DELIVERY is a DNS stub — just build the management UI

**6. mindsweep-email-intake Edge Function**
- Code ready to enable when DNS is configured
- Receives forwarded email, validates sender against `mindsweep_allowed_senders`
- Extracts text content, adds to holding queue or processes immediately
- Bounce reply for unauthorized senders

**7. Approval pattern data collection**
- When user processes a MindSweep-originated queue item (approve/edit/reroute/dismiss):
  - Record the action to `mindsweep_approval_patterns` table
  - Track: suggested destination, actual destination, action taken
- Wire into QueueCard's action handlers for items with `source = 'mindsweep_auto' | 'mindsweep_queued'`
- This is the data foundation for future learning recommendations

**8. Feature keys + useCanAccess() wiring**
- 7 feature keys already registered in migration 100089:
  - `mindsweep_manual`, `mindsweep_auto`, `mindsweep_email`, `mindsweep_share`, `mindsweep_pwa`, `mindsweep_scan`, `mindsweep_link`
- Wire `useCanAccess()` checks around:
  - Scan button (mindsweep_scan)
  - Link button (mindsweep_link)  
  - Auto-sweep settings (mindsweep_auto)
  - Email settings (mindsweep_email)
  - Share-to-app (mindsweep_share)
- During beta, all return true (convention #10)

**9. MindSweep Digest section type**
- Register section type #28 for MindSweep summary in rhythms
- Stub renderer (PRD-18 rhythms not built yet)
- When rhythms are built, this section shows: items swept, destinations routed to, confidence stats

**10. Post-build PRD verification**
- Go through every requirement in PRD-17B
- Status each: Wired / Stubbed / Missing
- Present verification table
- Zero Missing items required

## Priority Order for Next Session
1. Extract settings panel to shared component (#4) — quick win, needed for settings page
2. Approval pattern collection (#7) — learning foundation, no UI needed
3. Feature key wiring (#8) — quick, infrastructure-only
4. Auto-sweep pg_cron (#1) — server-side logic
5. Email forwarding UI (#5) — settings page addition
6. Email intake Edge Function (#6) — code-only stub
7. Digest section type (#9) — one-line registration
8. PWA/share-to-app (#2, #3) — investigate PWA setup first, may need founder input
9. Post-build verification (#10) — final step

## Files to Touch
- `src/components/mindsweep/MindSweepSettingsPanel.tsx` (new — extracted from MindSweepCapture)
- `src/pages/MindSweepCapture.tsx` (import extracted settings panel)
- `src/pages/SettingsPage.tsx` (add MindSweep section)
- `src/components/queue/QueueCard.tsx` (approval pattern recording)
- `src/hooks/useMindSweep.ts` (approval pattern mutation)
- `supabase/functions/mindsweep-email-intake/index.ts` (new)
- Migration for pg_cron auto-sweep job
- PWA config files (investigate first)
