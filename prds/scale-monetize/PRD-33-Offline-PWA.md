# PRD-33: Offline / PWA

**Status:** Stub (Audit-Ready, Full Specification Deferred to Post-MVP)
**Dependencies:** PRD-01 (Auth — URL routing structure), PRD-03 (Design System — theme colors for manifests), PRD-04 (Shell Routing — route registration), PRD-14D (Family Hub), PRD-14E (TV Mode — TV manifest requirements), PRD-17B (MindSweep — `/sweep` entry point and offline capture queue)
**Created:** March 21, 2026
**Last Updated:** March 21, 2026

---

## Overview

This is an infrastructure PRD — it doesn't define a user-facing feature but rather the invisible layer that makes every other feature work without an internet connection and installable as a home screen app. Offline/PWA touches everything but defines nothing new. Its job is to make what already exists feel native.

The platform serves families who use it throughout their day on multiple devices: mom's phone in the carpool line, a tablet mounted in the kitchen, the family TV as a digital bulletin board, a teen's phone for quick captures. Connectivity isn't guaranteed in all these contexts. The system must degrade gracefully — capturing data locally, syncing when connectivity returns, and never losing a user's input.

**This is a stub PRD.** It captures the complete scope, all accumulated requirements from other PRDs, and the key architectural decisions. It does NOT include detailed screens, full schema, or implementation flows. Those will be specified when this PRD moves into active build (post-MVP for demo purposes). The audit needs to know what's coming and where the boundaries are — this document provides that.

---

## Scope Summary

### What's In

- **Service worker** registration, caching strategy, and update flow
- **IndexedDB sync engine** for offline data capture and queue management
- **PWA manifests** for all installable entry points (five total)
- **Offline capture queue** handling text, voice blobs, and image attachments
- **Sync-on-connectivity** with conflict resolution
- **Visual indicators** for offline status and pending sync count
- **Web Share Target API** registration (share-to-app from phone browser)

### What's Out

- Push notifications (side quest attached to PRD-15, separate engineering sprint)
- Background sync API (evaluate post-MVP based on browser support)
- Native app wrappers (Capacitor, React Native) — PWA only
- Offline AI processing (all LiLa interactions require connectivity)
- Full offline navigation of all features (see Sync Targets below for what works offline)

---

## PWA Entry Points

Five installable entry points, each with its own web manifest configuration. The app is one codebase — these are different front doors.

| # | Route | Manifest `start_url` | Manifest `name` | Orientation | Target Device | Defined By |
|---|-------|---------------------|-----------------|-------------|---------------|------------|
| 1 | `/hub` | `/hub` | "[Family Name] Hub" | `any` | Shared family tablet | PRD-01, PRD-14D |
| 2 | `/hub/tv` | `/hub/tv` | "[Family Name] TV" | `landscape` | Smart TV (Fire TV, Android TV, Google TV) | PRD-14E |
| 3 | `/dashboard` | `/dashboard` | "MyAIM" | `any` | Personal phone/tablet (mom, dad, teens, kids) | PRD-01 |
| 4 | `/sweep` | `/sweep` | "MindSweep" | `any` | Mom's phone (quick capture) | PRD-17B |
| 5 | `/feed` | `/feed` | "MyAIM Family" | `any` | Out of Nest member's phone | PRD-37 |

### Manifest Details

All manifests share:
- `display`: `"standalone"` (runs without browser chrome)
- `theme_color` and `background_color`: Derived from family's active theme (PRD-03)
- Standard icon sizes: 192×192, 512×512

TV-specific additions (entry point #2):
- `orientation`: `"landscape"` (locked)
- Additional icons: 320×180 banner (Android TV), 1280×720 splash (Fire TV)

> **Implementation note:** Dynamic manifest generation (family name, theme colors) may require a server-side manifest endpoint rather than a static `manifest.json`. Exact approach determined at build time.

---

## IndexedDB Sync Targets

Not every feature needs offline support. The following are the critical offline surfaces — features where losing user input would be unacceptable.

### Must Work Offline (Capture + Queue)

| Feature | Data Types | Source PRD | Notes |
|---------|-----------|------------|-------|
| Tasks | Task completion, routine check-offs | PRD-09A | Mark done offline, sync later |
| Smart Notepad | Text content, tab creation | PRD-08 | Autosave to IndexedDB, sync on reconnect |
| Journal | Journal entry text | PRD-08 | Write offline, sync later |
| Victory Recorder | Victory logs | PRD-11 | Log victories offline, sync later |
| MindSweep | Text, voice blobs, image attachments | PRD-17B | Full offline capture queue — this is the most complex sync target |
| Best Intentions | Tally taps | PRD-06 | Counter increments queue locally |
| Rhythms | Section completion tracking | PRD-18 | Modal renders from cache, completions queue locally |

### Read-Only Offline (Cached Display)

| Feature | What's Cached | Source PRD | Notes |
|---------|--------------|------------|-------|
| Family Hub | Last-known widget state, slideshow images | PRD-14D | Shows stale data with indicator |
| TV Hub | Same as Family Hub at TV scale | PRD-14E | Ambient mode can cycle cached content |
| Calendar | Last-synced events (read-only) | PRD-14B | No event creation offline |
| Dashboard | Last-synced section data | PRD-14 | Stale indicators on each section |

### Online Only (No Offline Support)

- All LiLa conversations and AI features
- Review & Route (requires AI extraction)
- BookShelf extraction and discussion
- Settings changes
- Family member management
- Archive searches
- Messages (require delivery confirmation)

---

## Conflict Resolution

**Strategy: Last-write-wins** (established in System Overview PRD)

When a device reconnects and syncs its offline queue:
- Each queued change includes a client-side timestamp
- Server compares client timestamp with current `updated_at`
- If server record is newer → server wins, client change is discarded with a "sync conflict" indicator
- If client record is newer → client wins, server updates
- **No merge** — for the data types we're syncing offline (task completions, tally taps, text entries), merge logic adds complexity without meaningful benefit

**Special cases:**
- **Tally taps (Best Intentions, Victory logs):** These are INSERT-only (append operations), not updates. No conflict possible — all offline taps sync as new records.
- **Voice blobs (MindSweep):** Binary data queued with metadata. Sync uploads the blob, then creates the `mindsweep_events` record. If upload fails, retry with exponential backoff.
- **Task completions:** If a task was reassigned or deleted while the device was offline, the completion is logged but flagged for review.

---

## Visual Indicators

- **Offline banner:** Subtle, non-blocking indicator when device loses connectivity. Uses `--color-text-secondary` styling, not alarming. Appears below the top nav.
- **Pending sync count:** "X changes pending" shown in the offline banner. Count decrements as items sync.
- **Stale data indicator:** Small icon on cached read-only sections indicating data may be outdated. Tooltip: "Last updated [time]."
- **Sync in progress:** Brief animation when connectivity returns and queue is flushing.
- **Sync complete:** Toast notification: "All changes synced" — auto-dismisses after 3 seconds.

---

## Accumulated Requirements Registry

These are requirements deferred to PRD-33 by other PRDs. This registry ensures nothing falls through the cracks during full specification.

| Source PRD | Requirement | Status |
|-----------|-------------|--------|
| PRD-01 | URL routing structure supports separate installable entry points | Addressed — 5 entry points defined above |
| PRD-01 | PWA manifest, service worker, and offline behavior | Scoped above, full spec deferred |
| PRD-08 | Full offline sync pattern for Notepad | Scoped in Sync Targets above |
| PRD-09A | Pomodoro timer with background audio notifications (requires service worker) | Deferred to full spec |
| PRD-14E | TV-specific PWA manifest icons and splash screens | Addressed in PWA Entry Points above |
| PRD-14E | Offline Hub display from service worker cache | Scoped in Read-Only Offline above |
| PRD-17B | MindSweep `/sweep` PWA entry point with own web manifest | Addressed — entry point #4 above |
| PRD-17B | Offline capture queue for voice blobs, text, image attachments | Scoped in Sync Targets above |
| PRD-17B | Web Share Target API registration in service worker | Scoped above, full spec deferred |
| PRD-18 | Rhythm modal renders offline, completions queue locally | Scoped in Sync Targets above |
| PRD-37 | Out of Nest feed-first entry point | Addressed — entry point #5 above |

---

## Tier Gating

No tier-specific gating. Offline/PWA functionality is infrastructure available at all tiers. The ability to install as a PWA and use basic offline features is part of the base platform experience.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Push notification infrastructure (service worker push subscription) | Push notification delivery | Side quest (PRD-15) |
| Background sync API evaluation | Automatic retry of failed syncs without user action | Post-MVP enhancement |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| PWA manifest, service worker, offline behavior | PRD-01 | Fully wired — 5 entry points, service worker, IndexedDB sync |
| TV-specific PWA manifest icons and splash screens | PRD-14E | Fully wired — TV manifest configuration with landscape lock and TV-appropriate icon sizes |
| Offline Hub display from service worker cache | PRD-14E | Fully wired — read-only cached Hub display |
| MindSweep quick-capture PWA manifest | PRD-17B | Fully wired — `/sweep` entry point #4 |
| Offline capture queue (IndexedDB) | PRD-17B | Fully wired — voice, text, image queue with sync-on-connectivity |
| Web Share Target API registration | PRD-17B | Scoped — full implementation spec deferred |
| Full offline sync pattern (Notepad) | PRD-08 | Fully wired — Notepad in Must Work Offline targets |

---

## What "Done" Looks Like

> **Note:** This is the stub-level checklist. The full specification will expand these into detailed verification items.

### MVP (Must Have)
- [ ] Service worker registered and caching static assets (app shell)
- [ ] At least one PWA manifest functional (entry point #3, `/dashboard`)
- [ ] IndexedDB offline queue captures task completions, notepad text, journal entries, victory logs, and tally taps
- [ ] Offline banner appears when connectivity drops
- [ ] Pending changes sync automatically on reconnect
- [ ] Last-write-wins conflict resolution functional
- [ ] "X changes pending" count visible in offline banner

### MVP When Dependency Is Ready
- [ ] `/hub` manifest with family name (requires PRD-14D)
- [ ] `/hub/tv` manifest with landscape lock and TV icons (requires PRD-14E)
- [ ] `/sweep` manifest for MindSweep quick capture (requires PRD-17B)
- [ ] `/feed` manifest for Out of Nest members (requires PRD-37)
- [ ] MindSweep offline capture queue with voice blob handling (requires PRD-17B)
- [ ] Web Share Target API registration (requires PRD-17B)

### Post-MVP
- [ ] Background sync API for automatic retry
- [ ] Push notification subscription via service worker
- [ ] Pomodoro timer background audio notifications
- [ ] Offline indicator in TV ambient mode
- [ ] Service worker update prompt ("New version available!")
- [ ] Selective cache invalidation (per-feature cache groups)
- [ ] Samsung Tizen and LG webOS PWA compatibility testing

---

## CLAUDE.md Additions from This PRD

- [ ] Offline/PWA is infrastructure, not a feature. It has no UI of its own — it makes existing features work offline and installable.
- [ ] Five PWA entry points: `/hub`, `/hub/tv`, `/dashboard`, `/sweep`, `/feed`. Each has its own manifest. Auth determines which user sees what — the entry point is just the front door.
- [ ] IndexedDB sync uses last-write-wins. INSERT-only operations (tallies, victories) have no conflict — they always sync as new records.
- [ ] All LiLa and AI features require connectivity. No offline AI processing.
- [ ] Service worker caches the app shell. Feature data caching is per-feature based on the Sync Targets table in PRD-33.

---

## DATABASE_SCHEMA.md Additions from This PRD

No new server-side tables. All offline storage is client-side IndexedDB. The sync engine writes to existing tables defined in their respective PRDs.

Potential addition at full spec time: an `offline_sync_log` table for debugging sync issues (timestamp, device_id, records_synced, conflicts_encountered). Deferred to full specification.

---

*End of PRD-33 (Stub)*
