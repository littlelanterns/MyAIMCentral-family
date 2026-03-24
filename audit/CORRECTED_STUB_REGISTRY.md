# Corrected Stub Registry

> **Generated from full PRD audit 2026-03-23**
> **Convention:** Stubs are documented intentions. UI renders `<PlannedExpansionCard>`.
> **Status:** Wired = fully implemented by another PRD. Unwired = future work. Post-MVP = deferred.

---

## Wired Stubs (Resolved)

| Stub Description | Created By | Wired By | Notes |
|-----------------|-----------|----------|-------|
| Shell routing placeholder | PRD-01 | PRD-04 | `getShellForMember()` fully implemented |
| Permission check placeholder (`useCanAccess` returns true) | PRD-01 | PRD-02/31 | Full three-layer implementation |
| Special Adult scoping | PRD-01 | PRD-02/27 | CaregiverLayout + permissions |
| PermissionGate fallback patterns | PRD-02 | PRD-03 | LockedOverlay, UpgradeCard defined |
| LiLa Chat drawer container | PRD-04 | PRD-05 | Conversation engine fully specified |
| LiLa drawer context-awareness | PRD-04 | PRD-05 | page_context on conversations |
| Smart Notepad drawer container | PRD-04 | PRD-08 | Full spec with tabs and routing |
| Perspective switcher: My Dashboard | PRD-04 | PRD-14 | Fully implemented |
| Perspective switcher: Family Overview | PRD-14 | PRD-14C | Fully implemented |
| Perspective switcher: Family Hub | PRD-14/04 | PRD-14D | Fully implemented + extended to Dad/Teen |
| Hub widget grid | PRD-04 | PRD-14D | Full hub specification |
| Tablet hub screen | PRD-01 | PRD-14D | `families.hub_config` superseded by `family_hub_configs` |
| `/hub/tv` route | PRD-14D | PRD-14E | TV mode fully specified |
| Guided Dashboard full spec | PRD-14 | PRD-25 | Fully specified |
| Play Dashboard full spec | PRD-14 | PRD-26 | Fully specified |
| `member_self_insights` table | PRD-05 | PRD-07 | Superseded by `self_knowledge` |
| LiLa Optimizer mode entry | PRD-05 | PRD-05C | Full optimizer pipeline |
| "Edit in Notepad" action chip | PRD-05 | PRD-08 | Creates notepad tab |
| "Review & Route" action chip | PRD-05 | PRD-08 | Universal extraction component |
| MindSweep as Review & Route | PRD-05 Planning | PRD-08/17B | Fully realized |
| InnerWorkings log routing | PRD-07 | PRD-08 | `source_type = 'log_routed'` |
| Optimizer → Notepad flow | PRD-05C | PRD-08 | Bidirectional |
| GuidingStars from routing | PRD-06 | PRD-08 | `source = 'hatch_routed'` |
| BestIntentions from routing | PRD-06 | PRD-08 | `source = 'hatch_routed'` |
| Calendar routing from Notepad | PRD-08 | PRD-14B | Via `calendar-parse-event` Edge Function |
| Agenda routing from Notepad | PRD-08 | PRD-16 | Meeting agenda items |
| Message inbox/reply system | PRD-08 | PRD-15 | Full messaging system |
| Task Creation Queue migration | PRD-09A | PRD-14B | Universal Queue Modal |
| `studio_queue` replaces `task_queue` | PRD-09A | PRD-09B | `studio_queue` authoritative |
| Task reward processing | PRD-09A | PRD-24 | Gamification event pipeline |
| Task unmark reward cascade | PRD-02 | PRD-24 | Reverse pipeline |
| Dashboard widget containers for GS/BI | PRD-06 | PRD-14 | Greeting header + info widget |
| Widget milestone → Victory | PRD-10 | PRD-11 | Auto-create victory record |
| DailyCelebration Step 4 gamification | PRD-11 | PRD-24/24A | Sub-steps A, B, C specified |
| Family Celebration mode | PRD-11 | PRD-11B | Fully implemented |
| Family-level Guiding Stars | PRD-06 | PRD-12B | `owner_type = 'family'`, `source = 'lifelantern'` |
| LifeLantern as LiLa context | PRD-05 | PRD-12A | Vision statements registered |
| LifeLantern goals → GS/BI | PRD-06 | PRD-12A | `source = 'lifelantern'` |
| Archive folder auto-creation | PRD-01 | PRD-13 | member_root + 7 folders + wishlist |
| InnerWorkings in Archives | PRD-07 | PRD-13 | Query-time aggregation |
| Privacy Filtered management | PRD-05 | PRD-13 | Screen 5, auto-routing |
| Context Learning write-back | PRD-05C | PRD-13 | Save dialog, folder suggestion |
| Faith preferences | PRD-06 | PRD-13 | Family Overview Card modal |
| Gift wishlists in Archives | PRD-05 | PRD-13 | Shared via toggle |
| AI Toolbox + "+Add" pattern | PRD-21 | PRD-21A | Full vault integration |
| Moderation tab | PRD-21B | PRD-21C | Fully defined |
| Vault engagement counters | PRD-21A | PRD-21C | Denormalized on `vault_items` |
| `thoughtsift` placeholder mode | PRD-05 | PRD-34 | Replaced by 5 specific modes |
| `relationship_mediation` mode | PRD-19 | PRD-34 | Superseded by `mediator` |
| `shift_schedules` table | PRD-02 | PRD-35 | Replaced by `access_schedules` |
| `feature_access` table | PRD-01 | PRD-31 | Replaced by `feature_access_v2` |
| BigPlans task routing | PRD-09A | PRD-29 | `source = 'project_planner'` |
| InnerWorkings content extraction | PRD-07 | PRD-23 | `source_type = 'content_extraction'` |
| Channel E Platform Intelligence | Pipeline v2 | PRD-23 | Book Knowledge wired |
| Channel D Platform Intelligence | Pipeline v2 | PRD-34 | Board Personas wired |
| Safety monitoring admin | PRD-30 | PRD-32 | Admin keyword management |
| Gamification approach modules | PRD-11 | PRD-24A | Overlay engine IS the module system |

---

## Unwired Stubs (Future Work)

| Stub Description | Created By | Expected To Wire | Priority |
|-----------------|-----------|-----------------|----------|
| Dashboard calendar widget for Play | PRD-14B | PRD-26 | Wired (icon calendar) |
| Dashboard widget for InnerWorkings | PRD-07 | PRD-10 | Build phase |
| Dashboard widget for BookShelf | PRD-23 | PRD-10 | Build phase |
| Dashboard widget for LifeLantern | PRD-12A | PRD-14 | Build phase |
| Log Learning widget (adult variant) | PRD-28 | PRD-10 | Build phase |
| Calendar event icon for Play | PRD-14B | PRD-26 | Build phase |
| Family Meeting Notes in Archives | PRD-13 | PRD-16 | Build phase |
| Partner Profile aggregation | PRD-13 | Future People PRD | Post-MVP |
| My Circle (non-family contacts) | PRD-13 | Future People PRD | Post-MVP |
| Victory auto-archive monthly | PRD-11 | Enhancement | Post-MVP |
| Seasonal Family Overview prompts | PRD-13 | Rhythms enhancement | Post-MVP |
| Advanced context export | PRD-13 | Optimizer enhancement | Post-MVP |
| BigPlans Project Planner → LifeLantern | PRD-12A | PRD-29 | Wired |
| BigPlans check-in rhythm card | PRD-29 | PRD-18 | Build phase |
| Evening Rhythm → Family Celebration | PRD-11B | PRD-18 | Build phase |
| Menu widget on Hub | PRD-14D | Future Meal Planning PRD | Post-MVP |
| Hub Slideshow AI Vault integration | PRD-14D | Future | Post-MVP |
| Family Check-In guided mode | PRD-14D | Future | Post-MVP |
| Countdown → Calendar auto-link | PRD-14D | Enhancement | Post-MVP |
| Hub lock mode | PRD-14E | Post-MVP | Post-MVP |
| TV offline display | PRD-14E | PRD-33 | Post-MVP |
| Graduation tutorial content (Guided) | PRD-25 | Build phase | Build |
| Advanced Next Best Thing | PRD-25 | Post-MVP | Post-MVP |
| Play member message sending | PRD-26 | PRD-15 enhancement | Post-MVP |
| Audio/sound effects | PRD-26 | Post-MVP | Post-MVP |
| Reveal tile analytics | PRD-26 | PRD-32 | Post-MVP |
| Google Calendar sync | PRD-14B | Post-MVP | Post-MVP |
| TTS audio for celebrations | PRD-11 | Post-MVP | Post-MVP |
| Family celebration in Evening Rhythm | PRD-11B | PRD-18 | Build phase |
| Youth-lite LifeLantern | PRD-12A | Full Magic tier | Post-MVP |
| Custom life areas | PRD-12A | Post-MVP | Post-MVP |
| Live facilitated Vision Quest mode | PRD-12B | Post-MVP | Post-MVP |
| Image prompt optimization | PRD-05C | Future Optimizer | Post-MVP |
| Search/Research prompt optimization | PRD-05C | Future Optimizer | Post-MVP |
| Teen Lite Optimizer | PRD-05C | Future teen tools | Post-MVP |
| AI credit pack purchasing | PRD-05C | PRD-31/Payments | Build phase |
| Cyrano growth tracking | PRD-21 | Post-MVP | Post-MVP |
| ThoughtSift tools in AI Toolbox | PRD-21 | PRD-34 | Wired (via mode registry) |
| Vault "Recommended for You" widget | PRD-21A | PRD-10 | Build phase |
| LiLa proactive Vault suggestions | PRD-21A | Post-MVP | Post-MVP |
| Vault learning paths | PRD-21A | Post-MVP | Post-MVP |
| Creator tier user-submitted tools | PRD-21A | Post-MVP | Post-MVP |
| Community contributor recognition | PRD-21C | Post-MVP | Post-MVP |
| Semantic search in discussions | PRD-21C | Post-MVP | Post-MVP |
| Subscription & Billing management | PRD-22 | PRD-31 | Build phase |
| Out of Nest SMS notifications | PRD-22 | Post-MVP | Post-MVP |
| Push notification toggle | PRD-22 | Post-MVP | Post-MVP |
| Scheduled auto-export | PRD-22 | Post-MVP | Post-MVP |
| Additional overlay configs | PRD-24A | Content expansion | Post-MVP |
| Random events in overlays | PRD-24A | Post-MVP | Post-MVP |
| Color-reveal custom zone editor | PRD-24B | Post-MVP | Post-MVP |
| Background parallax scrolling | PRD-24B | Post-MVP | Post-MVP |
| Sound effect trigger points | PRD-24B | Post-MVP | Post-MVP |
| Family Challenge framework | PRD-24 | PRD-24C | Post-MVP |
| Seasonal event framework | PRD-24 | PRD-24C | Post-MVP |
| MindSweep PWA manifest | PRD-17B | PRD-33 | Build phase |
| Offline capture queue | PRD-17B | PRD-33 | Post-MVP |
| Web Share Target API | PRD-17B | PRD-33 | Post-MVP |

---

## Summary

| Status | Count |
|--------|-------|
| Wired (resolved) | ~60 |
| Unwired (build phase) | ~25 |
| Unwired (post-MVP) | ~40 |
| **Total** | **~125** |
