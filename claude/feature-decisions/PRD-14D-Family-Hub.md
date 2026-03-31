# Feature Decision File: PRD-14D — Family Hub

> **Created:** 2026-03-31
> **PRD:** `prds/dashboards/PRD-14D-Family-Hub.md`
> **Addenda read:**
>   - `prds/addenda/PRD-14D-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-14-Cross-PRD-Impact-Addendum.md`
>   - `prds/addenda/PRD-Audit-Readiness-Addendum.md`
> **Build Spec:** Founder-provided build spec with updated design decisions
> **Founder approved:** 2026-03-31

---

## What Is Being Built

The Family Hub — a shared family coordination surface that belongs to no one and everyone. The digital kitchen bulletin board. It shows the family calendar, family-level Best Intentions with per-member tally tracking, countdowns to exciting events, a widget grid (text cards, job board), and member quick access for shared devices. Hub Mode locks a shared tablet to just the Hub surface (kiosk pattern with PIN). Mom configures everything; all family members see the same surface. Phase A covers core Hub + Family Best Intentions. Phase B adds slideshow frame.

---

## Screens & Components

| Screen / Component | Notes |
|---|---|
| FamilyHub (main) | Dual context: `standalone` (full viewport, no shell) or `tab` (inline in dashboard) |
| HubHeader | Title + frame toggle (Phase B) + settings gear + lock icon (Hub Mode) |
| FamilyCalendarSection | CalendarWidget with all family members, `show_on_hub = true` filter |
| FamilyBestIntentionsSection | Intention cards with member avatar tally row |
| VictoriesSummarySection | STUB — "Coming soon" with Trophy icon |
| CountdownsSection | Countdown cards sorted by nearest date |
| HubWidgetGrid | DashboardGrid scoped to `dashboard_type = 'family_hub'` |
| MemberAccessSection | Avatar row with PIN auth → shell modal (standalone only) |
| HubSettings | Settings modal with 6 config groups |
| FamilyBestIntentionForm | Create/edit intention form in Hub Settings |
| CountdownForm | Create/edit countdown in Hub Settings |
| HubModeActivation | PIN prompt to enter/exit Hub Mode |
| PinInput | Shared PIN entry component (reuse existing if available) |
| HubMemberConfirm | Member pill selector → optional PIN → action attribution |
| HubEditMode | Long-press overlay for section reorder + widget grid edit |
| HubOnboardingCard | Warm dismissible card for first-time Hub access |
| hub_text_card widget | Editable text card, mom-titled, can have multiples |
| hub_job_board widget | Read-only opportunity task list with name + reward |
| info_family_intention widget | Personal dashboard widget: "You: X · Family: Y" |
| info_countdown widget | Personal dashboard countdown widget |
| FamilyVisionSection | STUB — hidden when no data |
| /hub/tv route | PlannedExpansionCard stub |

---

## Key PRD Decisions (Easy to Miss)

1. **Hub renders INLINE on perspective tab** — does NOT navigate to `/hub`. Current code (Dashboard.tsx line 51-54) is wrong and must be fixed.
2. **Hub Mode is a kiosk lock** — Hub PIN (stored hashed in `family_hub_configs.hub_pin`) to activate. localStorage persistence for PWA. PIN only needed to activate and exit, not on every page load.
3. **Hub sections are NOT collapsible** (unlike Personal Dashboard). Mom hides via settings.
4. **`hub_text_card` is a general widget type** — mom titles it, can have multiples. NOT a "dinner" widget specifically. Dinner/meal is a future PRD with AI integration.
5. **Family Best Intentions are a SEPARATE table** from personal `best_intentions` (PRD-06). Different interaction model, different RLS.
6. **PIN-per-intention is configurable by mom** — `require_pin_to_tally`. Some families want accountability, others want frictionless positive reinforcement.
7. **Family Best Intentions auto-deploy as widgets** to participating members' personal dashboards. Archiving removes the widgets.
8. **All tally sources aggregate** — Hub, personal dashboard, any device → same `family_intention_iterations` table.
9. **Job Board is read-only on Hub** — no claim button. "Log in to your account to claim a job."
10. **Calendar always shows ALL family members** — no MemberPillSelector on Hub. Events filtered by `show_on_hub = true`.
11. **Long-press edit mode is permission-gated** — only mom or Hub CRUD permission holders. Disabled in Hub Mode.
12. **Countdowns simplified for Phase A** — no scope/assignment columns. Simple table. Widget push deferred to PRD-10.
13. **Special Adult Hub access deferred** to PRD-27 per founder decision.
14. **Victory summary shows counts only**, not individual details. Celebrate button stubbed (PRD-11B dependency).
15. **`family_hub_configs` is per-family UNIQUE** (not per-member like `family_overview_configs`). One Hub, one config.

---

## Addendum Rulings

### From PRD-14D-Cross-PRD-Impact-Addendum.md:
- Perspective switcher extended to non-mom shells (already done in PRD-14 session)
- `calendar_events` needs `show_on_hub` column
- `families.hub_config` JSONB superseded by dedicated `family_hub_configs` table
- New feature keys: `family_hub`, `family_hub_best_intentions`, `family_hub_slideshow`, `family_hub_tv_route`
- Hub widget grid uses `dashboard_type = 'family_hub'` on `dashboard_configs`

### From PRD-14-Cross-PRD-Impact-Addendum.md:
- Perspective switcher tabs confirmed per role (already built)
- Hub tab is no longer a stub — being wired by this build

### Build spec overrides PRD:
- Countdowns: simplified table without scope/assigned_member_ids columns
- Hub Mode: detailed kiosk lock pattern with localStorage persistence (more specific than PRD)
- Widget types: `hub_text_card` (general, not dinner-specific) per founder

---

## Database Changes Required

### New Tables

**`family_hub_configs`** — one row per family:
| Column | Type | Default | Notes |
|---|---|---|---|
| id | UUID | gen_random_uuid() | PK |
| family_id | UUID | — | FK families, UNIQUE |
| hub_title | TEXT | NULL | NULL = "[Family Name] Hub" |
| theme_override | TEXT | NULL | Theme ID override |
| section_order | TEXT[] | 7-item default | Ordered section keys |
| section_visibility | JSONB | '{}' | section_key → boolean |
| victory_settings | JSONB | '{}' | show_count, include_teens, celebrate_pin_required |
| slideshow_config | JSONB | '{}' | Phase B config |
| tv_config | JSONB | NULL | PRD-14E config |
| hub_pin | TEXT | NULL | Hashed Hub Mode PIN |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | Auto-trigger |

**`family_best_intentions`**:
| Column | Type | Default | Notes |
|---|---|---|---|
| id | UUID | gen_random_uuid() | PK |
| family_id | UUID | — | FK families |
| created_by_member_id | UUID | — | FK family_members |
| title | TEXT | — | Required |
| description | TEXT | NULL | Optional |
| participating_member_ids | UUID[] | — | Required |
| require_pin_to_tally | BOOLEAN | false | |
| is_active | BOOLEAN | true | |
| is_included_in_ai | BOOLEAN | true | |
| sort_order | INTEGER | 0 | |
| archived_at | TIMESTAMPTZ | NULL | Soft delete |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

**`family_intention_iterations`**:
| Column | Type | Default | Notes |
|---|---|---|---|
| id | UUID | gen_random_uuid() | PK |
| family_id | UUID | — | FK families |
| intention_id | UUID | — | FK family_best_intentions |
| member_id | UUID | — | FK family_members |
| day_date | DATE | CURRENT_DATE | Daily aggregation key |
| created_at | TIMESTAMPTZ | now() | |

**`countdowns`**:
| Column | Type | Default | Notes |
|---|---|---|---|
| id | UUID | gen_random_uuid() | PK |
| family_id | UUID | — | FK families |
| created_by_member_id | UUID | — | FK family_members |
| title | TEXT | — | Required |
| emoji | TEXT | NULL | Optional |
| target_date | DATE | — | Required |
| show_on_target_day | BOOLEAN | true | |
| is_active | BOOLEAN | true | |
| recurring_annually | BOOLEAN | false | |
| created_at | TIMESTAMPTZ | now() | |
| updated_at | TIMESTAMPTZ | now() | |

### Modified Tables
- `calendar_events` — add `show_on_hub BOOLEAN NOT NULL DEFAULT true`

### Migrations
- `00000000100061_prd14d_family_hub.sql` — All 4 tables, column addition, RLS, indexes, triggers, feature keys

---

## Feature Keys

| Feature Key | Minimum Tier | Role Groups | Notes |
|---|---|---|---|
| `family_hub` | Enhanced | all | Core Hub display |
| `family_hub_best_intentions` | Enhanced | all | Family intentions + tally |
| `family_hub_slideshow` | Full Magic | all | Phase B |
| `family_hub_tv_route` | Full Magic | all | PRD-14E stub |

---

## Stubs — Do NOT Build Phase A

- [ ] Victories summary — "Coming soon" (PRD-11 dependency)
- [ ] Celebrate button — disabled (PRD-11B dependency)
- [ ] Family Vision section — hidden (PRD-12B dependency)
- [ ] Slideshow frame overlay — Phase B
- [ ] `slideshow_slides` table — Phase B
- [ ] TV Mode — PRD-14E
- [ ] Special Adult shift-scoped access — deferred to PRD-27
- [ ] Countdown push to personal dashboards — deferred to PRD-10
- [ ] Countdown scope/assignment — deferred to PRD-10
- [ ] Meal plan structured widget — future PRD
- [ ] Family Check-In LiLa guided mode — future PRD
- [ ] Shared Tracker widget type — existing PRD-10 capability

---

## Cross-Feature Connections

| This feature... | Direction | Connected to... | Via |
|---|---|---|---|
| Reads calendar events | ← | PRD-14B | `calendar_events` WHERE `show_on_hub = true` |
| Reads opportunity tasks | ← | PRD-09A | `tasks` WHERE `task_type LIKE 'opportunity_%'` |
| Reads family members | ← | PRD-01 | `family_members` for avatars, names, auth methods |
| Writes intention iterations | → | (own table) | `family_intention_iterations` INSERT |
| Auto-deploys widgets | → | PRD-10 | `dashboard_widgets` INSERT on personal dashboards |
| Reads widget grid | ← | PRD-10 | `dashboard_configs` WHERE `dashboard_type = 'family_hub'` |
| Opens shell modal | → | PRD-04/14 | ViewAsModal pattern for member access |
| Adds show_on_hub toggle | → | PRD-14B | `calendar_events.show_on_hub` column |
| Writes to LiLa context | → | PRD-05 | Family intentions WHERE `is_included_in_ai = true` |

---

## Things That Connect Back to This Feature Later

- PRD-11 (Victory Recorder) wires victories_summary section with real count data
- PRD-11B (Family Celebration) wires Celebrate button with generation flow
- PRD-12B (Family Vision Quest) wires family_vision section display
- PRD-14E (TV Mode) extends Hub with TV rendering at `/hub/tv`
- PRD-10 Phase B adds countdown widget push, "Great for Family Hub" category
- Future Meal Plan PRD replaces text card with structured widget
- Future PRD adds Family Check-In LiLa guided mode using Hub data

---

## Founder Confirmation (Pre-Build)

- [x] Pre-build summary reviewed and accurate
- [x] All addenda captured above
- [x] Stubs confirmed — nothing extra will be built
- [x] Schema changes correct
- [x] Feature keys identified
- [x] **Approved to build**

---

## Post-Build PRD Verification

> To be completed after Phase A build.

---

## Founder Sign-Off (Post-Build)

- [ ] Verification table reviewed
- [ ] All stubs are acceptable for this phase and in STUB_REGISTRY.md
- [ ] Zero Missing items confirmed
- [ ] **Phase approved as complete**
- **Completion date:**
