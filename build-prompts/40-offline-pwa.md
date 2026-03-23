# Build Prompt 40: Offline / PWA

## PRD Reference
- PRD-33: `prds/scale-monetize/PRD-33-Offline-PWA.md`

## Prerequisites
- All prior phases (1-39) complete

## Objective
Build Progressive Web App support with 5 PWA entry points, service worker for app shell caching, IndexedDB-based offline storage with sync targets categorized by offline capability (Must Work Offline, Read-Only Offline, Online Only), conflict resolution (last-write-wins for most, INSERT-only for tallies), and visual indicators for offline state. This is a Large phase.

## Database Work
No new server-side tables. This phase focuses on client-side storage:

### IndexedDB Schema
Design IndexedDB stores for offline data:
- Tasks store — Full CRUD offline with sync queue
- Notepad store — Full CRUD offline with sync queue
- Journal store — Full CRUD offline with sync queue
- Victories store — Full CRUD offline with sync queue
- MindSweep store — Full CRUD offline with sync queue
- Intentions store — Full CRUD offline with sync queue
- Rhythms store — Full CRUD offline with sync queue
- Hub store — Read-only cache of hub data
- TV store — Read-only cache of TV mode data
- Calendar store — Read-only cache of calendar events
- Dashboard store — Read-only cache of dashboard configuration
- Sync queue store — Pending mutations waiting for connectivity

## Component Work
### PWA Infrastructure
- 5 PWA entry points — `/hub`, `/hub/tv`, `/dashboard`, `/sweep`, `/feed` each installable as standalone PWA
- Service worker — App shell caching strategy (cache-first for static assets, network-first for API data)
- Web app manifest — Per-entry-point manifests with appropriate icons, names, and display modes
- Install prompt — Custom install prompt UI for supported browsers

### Offline Storage & Sync
- IndexedDB sync targets — Categorized offline storage:
  - **Must Work Offline**: Tasks, Notepad, Journal, Victories, MindSweep, Intentions, Rhythms (full CRUD)
  - **Read-Only Offline**: Hub, TV, Calendar, Dashboard (cached snapshots, refreshed when online)
  - **Online Only**: LiLa, Review & Route, BookShelf, Settings, Archives, Messages (graceful degradation with offline message)
- Sync queue — Queue mutations made offline for replay when connectivity returns
- Conflict resolution — Last-write-wins for standard records; INSERT-only for tally/count data (no conflicts possible)
- Background sync — Use Background Sync API where available; fallback to foreground sync on reconnect

### Visual Indicators
- Offline banner — Persistent banner when device is offline indicating limited functionality
- Pending count — Badge/count showing number of unsynced mutations
- Stale data indicator — Visual marker on data that may be outdated (last synced timestamp)
- Sync toast — Toast notification when background sync completes successfully
- Online-only feature messaging — Clear message when user attempts to access online-only feature while offline

## Testing Checklist
- [ ] All 5 PWA entry points installable on mobile and desktop
- [ ] Service worker caches app shell and static assets
- [ ] App loads from cache when fully offline
- [ ] Tasks: create, edit, complete tasks offline; sync on reconnect
- [ ] Notepad: create, edit notes offline; sync on reconnect
- [ ] Journal: create entries offline; sync on reconnect
- [ ] Victories: record victories offline; sync on reconnect
- [ ] MindSweep: capture items offline; sync on reconnect
- [ ] Intentions: update intentions offline; sync on reconnect
- [ ] Rhythms: log rhythms offline; sync on reconnect
- [ ] Hub: cached data displays when offline
- [ ] TV mode: cached data displays when offline
- [ ] Calendar: cached events display when offline
- [ ] Dashboard: cached config renders when offline
- [ ] Online-only features show graceful offline message
- [ ] Sync queue accumulates mutations while offline
- [ ] Background sync replays queue on reconnect
- [ ] Conflict resolution applies last-write-wins correctly
- [ ] Tally data uses INSERT-only (no conflict)
- [ ] Offline banner appears when connectivity lost
- [ ] Pending count badge shows correct unsynced count
- [ ] Stale data indicator shows on cached data
- [ ] Sync toast appears after successful background sync

## Definition of Done
- All PRD-33 MVP items checked off
- 5 PWA entry points installable and functional
- Service worker caching app shell correctly
- All "Must Work Offline" features functional without connectivity
- All "Read-Only Offline" features display cached data
- All "Online Only" features show graceful offline messaging
- Sync queue and background sync operational
- Conflict resolution verified (last-write-wins + INSERT-only tallies)
- All visual indicators (offline banner, pending count, stale data, sync toast) working
- No hardcoded strings (all text extractable for i18n later)
