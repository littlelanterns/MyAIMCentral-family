> **Architecture Status:** This PRD is part of a meticulously designed 40+ document system for MyAIM Family. Core platform systems are built and operational at [myaimcentral.com](https://myaimcentral.com). This feature's database schema, permission model, and cross-PRD dependencies are fully specified and audit-verified. The platform is in active development with features being built in dependency order from these specifications. See [docs/WHY_PRDS_EXIST.md](/docs/WHY_PRDS_EXIST.md) for the architecture-first philosophy behind this approach.

---


# PRD-14E: Family Hub TV Mode

**Status:** Not Started
**Dependencies:** PRD-01 (Auth & Family Setup), PRD-02 (Permissions & Access Control), PRD-03 (Design System & Themes), PRD-04 (Shell Routing & Layouts), PRD-11B (Family Celebration), PRD-14 (Personal Dashboard), PRD-14B (Calendar), PRD-14D (Family Hub)
**Created:** March 11, 2026
**Last Updated:** March 11, 2026

---

## Overview

PRD-14E defines how the Family Hub (PRD-14D) renders on smart TVs. This is a rendering and interaction layer — not a new content system. The same React components that render the Hub on a tablet render on TV, with a TV-specific CSS layer that scales everything for living-room viewing distance and replaces touch interaction patterns with remote-friendly equivalents.

The TV Hub is a PWA installed on Android TV, Google TV, Fire TV, or any smart TV platform with a modern browser. It loads the `/hub/tv` route, which applies a `tv-mode` CSS class and activates TV-specific behaviors: large fonts readable from 10 feet, high-contrast focus indicators for D-pad/remote navigation, an ambient idle mode (slideshow frame or content cycle), and a simplified member shell for task completion and tally logging.

The TV does not introduce new features. It makes existing Hub features usable from a couch with a remote. Everything on TV is clunkier than on a phone or tablet — and that's fine. The TV is a warm, visual, shared family surface. It's the digital equivalent of a bulletin board you can see from the dinner table, not a productivity workstation.

> **Mom experience goal:** I want to glance at the TV and see what's for dinner, whose birthday is coming up, and how many victories my family logged today — all while the kids do their homework. When nobody's actively using it, I want it showing beautiful family photos or scripture quotes. And when my kids want to check off their chores, they can grab the remote and do it without needing a phone.

> **Depends on:** PRD-14D (Family Hub) for ALL content, section architecture, data schema, and interaction model. PRD-14E is a rendering layer on top of PRD-14D. PRD-04 (Shell Routing) for the `/hub/tv` route stub registered in PRD-14D. PRD-03 (Design System) for the base token system that TV mode overrides.

> **Forward note:** StewardShip was successfully navigated on a Fire TV via Silk browser — user selection, task completion, and large button interaction all functional. This validates the PWA-on-TV approach. PRD-14E optimizes what already works.

---

## Related PRDs in the PRD-14 Family

| PRD | Feature | Relationship |
|-----|---------|-------------|
| **PRD-14** | Personal Dashboard | Defines perspective switcher, responsive architecture, TV mode forward notes |
| **PRD-14B** | Calendar | Calendar component renders on TV Hub at large scale |
| **PRD-14C** | Family Overview | Not rendered on TV (mom-only, data-dense — not a TV surface) |
| **PRD-14D** | Family Hub | Parent document. ALL content, sections, widgets, data schema. PRD-14E renders this on TV. |
| **PRD-14E** (this document) | Family Hub TV Mode | TV-specific rendering, navigation, ambient mode, member shell |

---

## User Stories

### TV as Family Display
- As a family, we want our TV to show the Family Hub as a persistent home screen so we always know what's happening today without opening an app on our phones.
- As a mom, I want to install the Hub as an app on our Fire TV so it's one click away from our TV home screen.
- As a mom, I want the TV Hub to look beautiful from across the room — large text, warm colors, readable without squinting.

### Ambient Mode
- As a mom, I want the TV to automatically switch to a slideshow of family photos and quotes when nobody's actively using the Hub so it looks like a digital picture frame, not a frozen dashboard.
- As a mom, I want to choose whether the TV shows just the slideshow when idle, or cycles through Hub content panels.
- As anyone, I want to press any button on the remote to wake the TV back to the interactive Hub from ambient mode.

### Remote Navigation
- As any family member, I want to navigate the Hub with the TV remote — arrow keys to move between sections and items, Enter to select.
- As any family member, I want to tap my name on the TV, enter my PIN with the on-screen keyboard, and check off my tasks from the couch.

### Task Completion from TV
- As a kid, I want to log into my space on the TV and mark my chores as done so mom can see I finished without me having to find my tablet.
- As any family member, I want to tap a Family Best Intention from the TV to log that I practiced it today.

### Family Celebration on TV
- As a parent, I want to trigger the Family Celebration from the TV so we can all read it together on the big screen.

---

## Screens

### Screen 1: TV Hub — Main Surface

> **Mom experience goal:** The TV Hub should feel like walking into a warm kitchen with a big, beautiful bulletin board on the wall. Everything is readable from across the room. Nothing is tiny or cramped. It's our family's information hearth.

> **Depends on:** PRD-14D Screen 1 (Family Hub — Main Surface) for all content and section definitions. PRD-14E only changes rendering scale and interaction patterns.

**What the user sees:**

The same Family Hub content from PRD-14D, rendered at TV scale. The `/hub/tv` route applies a `tv-mode` CSS class to the root container, which activates large-screen design token overrides.

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  The Smith Family Hub                          [🖼 Frame]  [⚙ PIN]  │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   📅  FAMILY CALENDAR                                                │
│   ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┐  │
│   │  Sun   │  Mon   │  Tue   │  Wed   │  Thu   │  Fri   │  Sat   │  │
│   │        │ ●●●    │ ●      │ ●●     │        │ ●●●●   │ ●      │  │
│   │        │ Dentst │        │ Soccer │        │ Piano  │ Game   │  │
│   └────────┴────────┴────────┴────────┴────────┴────────┴────────┘  │
│                                                                      │
│   ┌─ OUR FAMILY VISION ─────────────────────────────────────────┐   │
│   │  "We are a family that chooses kindness, values hard work,  │   │
│   │   celebrates each other, and makes time to play together."  │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   ┌─ FAMILY BEST INTENTIONS ────────────────────────────────────┐   │
│   │   Remain Calm                                                │   │
│   │   (Mom 2)(Dad 1)(Jake 3)(Emma 1)(Sam 0)   Family: 7 today  │   │
│   │                                                              │   │
│   │   Sincerity > Sarcasm                                        │   │
│   │   (Mom 1)(Dad 0)(Jake 2)(Emma 1)(Sam 0)   Family: 4 today  │   │
│   └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│   🎉  14 victories recorded today!              [ Celebrate 🔒 ]    │
│                                                                      │
│   ┌─ COUNTDOWNS ─────────────────────────────────────────────────┐  │
│   │  🏖  Beach Vacation          🎂  Jake's Birthday             │  │
│   │     12 DAYS                      5 DAYS                      │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐      │
│   │ 🍽 Dinner    │  │ 📋 Job Board │  │ 📚 Family Reading    │      │
│   │ Taco Tuesday │  │ 3 available  │  │ Challenge: 47/100    │      │
│   └──────────────┘  └──────────────┘  └──────────────────────┘      │
│                                                                      │
│  ┌─ FAMILY MEMBERS ──────────────────────────────────────────────┐  │
│  │  (Mom 🔒)  (Dad 🔒)  (Jake 🔒)  (Emma 🔒)  (Sam)  (Rosie)  │  │
│  │  Select your name to open your space                          │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**TV-specific rendering differences from PRD-14D tablet view:**

**Typography scaling:**
- All font sizes scaled up for 10-foot viewing distance. Base body text: minimum 24px (vs. 16px on tablet). Section headers: minimum 36px. Countdown numbers: 72px+. Family Vision Statement: 32px+ serif display font.
- Line height increased for readability at distance: `1.6` minimum for body text.

**Spacing and layout:**
- Section padding doubled from tablet values. Generous whitespace between sections.
- Cards and widgets have increased padding and margin for visual separation at distance.
- The page scrolls vertically. No horizontal scrolling anywhere on the main surface.

**Color and contrast:**
- Minimum contrast ratio of 4.5:1 for all text (WCAG AA). TV displays vary widely in calibration — higher contrast ensures readability.
- Focus indicator: thick, high-contrast ring (`3px solid` using `--color-border-focus` with TV-boosted opacity). Must be visible from 10 feet.
- No hover states. `:hover` styles are suppressed in TV mode. All interactive feedback uses `:focus-visible` only.

**Touch target equivalents:**
- All interactive elements sized for remote navigation: minimum 48dp equivalent at TV scale, with generous spacing between adjacent focusable items to prevent mis-navigation.
- Member avatars in the Family Best Intentions and Member Access sections are large circles (64px+ diameter on 1080p, scaled proportionally for 4K).

> **Decision rationale:** TV mode is route-driven, not breakpoint-driven. The `/hub/tv` route activates TV rendering regardless of the display's actual resolution. Within TV mode, breakpoints handle 1080p vs. 4K scaling — but a Fire TV Stick running at 720p still gets the large-font, remote-friendly layout because the route determines the rendering context, not the viewport width.

**Header behavior on TV:**
- No member drawer pull tab (no swipe gestures on TV).
- Hub title centered, large.
- Frame toggle button (opens slideshow overlay) — focusable, large hit area.
- Settings gear — focusable, requires mom's PIN (on-screen keyboard input).

**Section order and visibility:**
- Identical to PRD-14D. Mom configures section order and visibility from her phone/tablet Hub Settings (PRD-14D Screen 6). The TV renders whatever mom has configured. There is no TV-specific section configuration UI — the TV reads the same `family_hub_configs` record as the tablet.

> **Decision rationale:** One configuration, multiple rendering surfaces. Mom configures the Hub once. The tablet and TV show the same content in the same order, just rendered differently. This avoids the cognitive load of maintaining separate TV and tablet configurations.

---

### Screen 2: Remote Navigation Model

> **Depends on:** Standard web browser remote/D-pad behavior on Android TV, Google TV, Fire TV. PRD-14E does not build a custom focus management engine — it optimizes the existing web page for the native remote navigation provided by the TV's built-in browser.

**How navigation works:**

The TV Hub is a web page loaded in a browser (or PWA shell). Smart TV browsers map the remote's D-pad to standard keyboard arrow keys and the Select/Enter button to mouse click. The Hub is optimized for this by:

- Making all interactive elements focusable (`tabindex="0"` or semantic HTML elements like `<button>`, `<a>`)
- Providing clear `:focus-visible` styling (thick colored ring, slight scale-up) on every focusable element
- Ensuring a logical tab order that follows the visual layout (top-to-bottom, left-to-right within sections)
- Removing all hover-dependent interactions
- Making all text inputs (PIN entry, search) work with the TV's native on-screen keyboard

**Navigation flow:**

Arrow Up/Down scrolls the page and moves focus between sections. Arrow Left/Right moves focus between items within a row (countdown cards, member avatars, widget grid items). Enter/Select activates the focused item — same as a tap on tablet.

The TV remote's Back button:
- Inside an overlay (slideshow, celebration display, member shell) → closes the overlay, returns to Hub
- On the main Hub surface → browser's native back behavior (which on a PWA is typically "do nothing" or "minimize")

> **Decision rationale:** Building on the browser's native D-pad-to-keyboard mapping is the correct approach for a PWA. Custom focus management engines are fragile, platform-specific, and unnecessary when the web standards already work. The PRD-14E job is to make the page *optimally navigable* with that native behavior — not to replace it.

**Focus visibility requirements:**

Every focusable element on the TV Hub must have a `:focus-visible` style that:
- Uses a `3px solid` ring in the theme's focus color (boosted to full opacity for TV)
- Adds a subtle background tint to the focused card/element (not just a ring — the ring alone can be hard to spot on a busy background)
- Applies a slight scale transform (`scale(1.02)`) for additional visual emphasis
- Is visible from at least 10 feet away on a 1080p display

> **Forward note:** Some TV platforms have quirks with `:focus-visible` vs. `:focus`. The build phase should test across Fire TV Silk, Chrome on Android TV, and Google TV's built-in browser. A fallback to `:focus` (with `:focus:not(:focus-visible)` suppression for mouse users on non-TV devices) ensures compatibility.

---

### Screen 3: Family Best Intentions — TV Interaction

> **Depends on:** PRD-14D Screen 2 (Family Best Intentions — Hub Display & Interaction) for the interaction model. PRD-14E adapts this for remote navigation.

**What the user sees:**

Same intention cards as PRD-14D, rendered at TV scale. Each intention card is a focusable row. Within the card, each member avatar is individually focusable.

**Tally interaction on TV:**
1. Arrow Down/Up to focus on an intention card
2. Arrow Right/Left to move between member avatars within the card
3. Enter/Select on a member avatar to log a tally

**PIN-required intentions:** If the intention has `require_pin_to_tally = true`, pressing Enter on an avatar triggers the TV's native on-screen keyboard for PIN entry. After successful PIN, the tally is logged with the same micro-animation as tablet (pulse on the avatar, count increment). Mom can choose whether to require PIN on TV — the default recommendation is no PIN for TV interactions, since the remote navigation is already clunky enough.

> **Decision rationale:** PIN gating on TV uses the TV's native on-screen keyboard rather than a custom number pad component. This is clunkier than a touch PIN pad, but it works universally across TV platforms without building platform-specific input widgets. The recommendation is to skip PIN on TV for most intentions, but the option exists for families who want it.

---

### Screen 4: Member Quick Access — TV Interaction

> **Depends on:** PRD-14D Screen 5 (Member Quick Access) for the member selection model. PRD-01 for PIN authentication.

**What the user sees:**

The Family Members section at the bottom of the Hub, rendered as a horizontal row of large avatar circles with names. Each member is a focusable element.

**Authentication flow on TV:**
1. Arrow to a member's avatar. Focus ring appears around their name/avatar.
2. Press Enter/Select.
3. If member has PIN auth: TV's native on-screen keyboard appears. User types 4-digit PIN. On success → member shell opens.
4. If member has no auth (`auth_method = 'none'`): member shell opens immediately.
5. If member has visual password: **Not supported on TV.** A message displays: "Visual passwords aren't available on TV. Use your PIN or ask a parent to set one up." Mom can configure a PIN as an alternative TV auth method for members who use visual passwords on tablet.

> **Decision rationale:** Visual password (tap images in order) requires precise touch input that doesn't translate to remote navigation. Rather than building a clunky arrow-key-to-grid-position emulation, we acknowledge the limitation and fall back to PIN on TV. This is a minor edge case — most members who need TV access will have PINs.

> **Forward note:** If visual password on TV becomes a requested feature, it could be implemented as a grid of large image buttons navigated with arrow keys. But this is not MVP.

---

### Screen 5: Simplified Member Shell — TV View

> **Mom experience goal:** My kid should be able to grab the remote, tap their name, enter their PIN, and check off their tasks in under a minute. They don't need to write journal entries or chat with LiLa from the TV — they just need to see what's on their plate and mark things done.

> **Depends on:** PRD-14 (Personal Dashboard) for the member shell architecture. PRD-09A (Tasks) for task display and completion interaction. PRD-06 (Best Intentions) for personal Best Intentions tally.

**What the member sees:**

A near-full-screen modal over the Hub (same overlay pattern as PRD-14D Screen 5) showing a simplified personal view. The modal is optimized for TV: large text, clear focus indicators, limited to features that work well with remote input.

**Allowed features on TV member shell:**

| Feature | Interaction | Notes |
|---------|-------------|-------|
| **Tasks for Today** | View list, arrow to task, Enter to mark complete | Checkbox toggle. Task names large and readable. |
| **Routines** | View routine steps, Enter to mark step complete | Same checkbox interaction as tasks. |
| **Best Intentions (personal + family)** | View, Enter on avatar to tally | Same tally interaction as Hub surface. |
| **Trackers** | View, Enter to increment or enter numeric value | Numeric input via on-screen keyboard for time/count values. Simple increment (e.g., "+1 glass of water") via Enter press. |
| **Calendar** | View only | Read-only schedule display. No event creation. |
| **Victories** | View today's victories, Log Victory quick action | "Log Victory" opens a simplified form: select category (arrow through options), optional short title (on-screen keyboard), confirm. |
| **Countdowns** | View only | Personal countdowns display. |

**Blocked features on TV member shell:**

| Feature | Reason | Message Shown |
|---------|--------|---------------|
| Journal / Smart Notepad | Requires substantial text entry | "Open MyAIM on your phone or tablet to write in your journal." |
| LiLa conversations | Requires text-based conversation | "Chat with LiLa from your phone or tablet." |
| Messaging / Higgins | Requires text entry | "Send messages from your phone or tablet." |
| InnerWorkings | Deep reflective content requiring text | "Explore InnerWorkings from your phone or tablet." |
| LifeLantern | Deep reflective content requiring text | "Work on your LifeLantern from your phone or tablet." |
| Guiding Stars editing | Requires text entry for declarations | "Edit your Guiding Stars from your phone or tablet." (Viewing the rotation is allowed.) |
| Settings / Preferences | Complex configuration UI | "Change your settings from your phone or tablet." |
| Studio / Lists editing | Requires text entry and complex drag interaction | "Edit your lists from your phone or tablet." |

> **Decision rationale:** The TV member shell is a "check things off" surface, not a full productivity workspace. Features requiring more than a few words of text input or complex multi-step workflows are blocked with a friendly redirect to phone/tablet. This keeps the TV experience fast and focused. The principle: if it requires typing more than a short title or navigating deep feature trees, it belongs on a touch device.

**Member shell header on TV:**
- Member name and avatar, large
- "Back to Hub" button — prominent, always visible, focusable. Enter/Select or remote Back button closes the modal.
- Session timer indicator (subtle): shows remaining time before auto-timeout

**Session timeout:**
- TV member sub-sessions timeout after 5 minutes of inactivity (shorter than the 15-minute tablet default).
- On timeout: modal closes automatically, returns to the Hub surface.
- Mom can configure the TV member timeout duration in TV Settings (Screen 8).

> **Decision rationale:** 5-minute default is shorter than tablet because the TV is a shared family screen in a public room. A kid's personal dashboard should not stay open on the living room TV for 15 minutes after they walk away. 5 minutes is enough time to check tasks and log tallies, short enough that abandoned sessions clear quickly.

---

### Screen 6: Ambient Idle Mode

> **Mom experience goal:** When nobody's using the Hub, I want the TV to be beautiful — not a frozen dashboard with yesterday's data. Show me our family photos, or cycle through our quotes and art. When someone picks up the remote, the Hub is right there.

**How ambient mode works:**

After a configurable period of no remote input (default: 5 minutes), the TV Hub transitions to ambient mode. Mom chooses which ambient mode to use:

**Option A — Slideshow Frame (Default):**
The slideshow overlay from PRD-14D Screen 7, rendered full-screen on TV with an ambient information overlay in one corner:

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                                                                      │
│                                                                      │
│                     [ Full-screen slideshow image                     │
│                       or beautifully rendered                        │
│                       text quote / scripture ]                       │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                       ┌────────────┐ │
│                                                       │ 7:42 PM    │ │
│                                                       │ Wed Mar 11 │ │
│                                                       │            │ │
│                                                       │ Next:      │ │
│                                                       │ Soccer 4pm │ │
│                                                       │ Tomorrow   │ │
│                                                       └────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

The ambient overlay shows:
- Current time (large, readable)
- Current date
- Next upcoming calendar event (event name, time, and "Today" / "Tomorrow" / day name)
- Optional: today's victory count ("12 victories today!")

The overlay is semi-transparent and positioned in a configurable corner (default: bottom-right). It does not obscure the primary slideshow content. Text and photos use their respective duration timers from PRD-14D's slideshow configuration.

**Option B — Content Cycle:**
Instead of the slideshow frame, the TV cycles through Hub content panels as full-screen cards:

1. **Calendar** — week view, large, with today highlighted
2. **Family Best Intentions** — current tallies, large avatars
3. **Victories Summary** — today's count with celebratory styling
4. **Countdowns** — large countdown cards
5. **Widget Grid** — family widgets displayed as large cards

Each panel displays for a configurable duration (default: 30 seconds). Sections mom has hidden from the Hub are skipped. After cycling through all panels, the cycle repeats.

> **Decision rationale:** Most families will want Slideshow Frame as their idle mode — it turns the TV into a beautiful digital picture frame. Content Cycle is available for families who want the TV to be a persistent information display even when idle. Mom chooses in TV Settings.

**Exiting ambient mode:**

Any remote button press exits ambient mode and returns to the main Hub surface. The transition is a smooth fade (not an abrupt jump). The Hub loads in its current state — no reload, no delay.

> **Forward note:** A future enhancement could allow specific buttons to perform actions without fully exiting ambient mode — for example, pressing Enter could pause/resume the slideshow, arrow keys could manually advance slides, and only the Back button would return to the Hub. For MVP, any button exits to the Hub.

---

### Screen 7: Family Celebration — TV Display

> **Depends on:** PRD-11B (Family Celebration) for narrative generation, display elements, and gold visual effects.

**Triggering on TV:**

The "Celebrate" button on the Hub's victories summary section is focusable. Press Enter → PIN prompt (parent PIN required, same as PRD-14D). After PIN authentication, the celebration generates using the simplified default configuration:
- **Type:** Highlights (quick bedtime-ritual length)
- **Period:** Today
- **Members:** All family members
- **No filter customization on TV** — the full filter bar (PRD-11B Screen 1) is a touch interface. On TV, it's always the simple default. For custom celebrations, parents generate from their phone/tablet and the narrative syncs to the TV display.

**Generation experience:**
- After PIN and trigger, the TV shows a warm loading state with gold SparkleOverlay animation. The family sees it generating in real-time — building anticipation.
- When complete, the narrative fills the screen (Screen 7 display below).

**What the family sees:**

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ✨  The Smith Family  ✨                                            │
│  March 11, 2026                                                      │
│                                                                      │
│  ─────────────────────────────────────────────────                   │
│                                                                      │
│  Today was a full day for the Smith family.                          │
│  Here's what happened.                                               │
│                                                                      │
│  Jake finished his math assignment and organized                     │
│  the garage without being asked. That's initiative.                  │
│                                                                      │
│  Emma practiced piano for thirty minutes and helped                  │
│  Sam with his spelling words. She chose to serve.                    │
│                                                                      │
│  Sam completed all five of his morning routine steps                 │
│  before breakfast — for the third day in a row.                      │
│                                                                      │
│  Together, the Smith family logged 7 "Remain Calm"                   │
│  moments. That's what you said you wanted to be.                     │
│  Today, you were.                                                    │
│                                                                      │
│  ─────────────────────────────────────────────────                   │
│                                                                      │
│  [ Save ]  [ Regenerate ]  [ Done ]                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

**Display characteristics:**
- Full-screen with generous margins
- Large serif display font (`--font-display`) for the narrative body — minimum 28px on 1080p
- Gold accents and themed border consistent with PRD-11B celebration aesthetic
- Auto-scroll for longer narratives: slow, configurable scroll speed. Alternatively, manual advance with remote Down arrow to page through sections.
- No emojis in the adult display (consistent with PRD-11B).
- Family name and date in the header.

**Actions (focusable buttons at bottom):**
- **Save** — saves to Family Celebration archive (`family_victory_celebrations`)
- **Regenerate** — generates a new narrative (same filters, different content)
- **Done** — closes celebration display, returns to Hub

> **Decision rationale:** Triggering celebration directly on TV (with simplified defaults) means the family can gather around the TV, a parent enters the PIN, and the celebration generates while everyone watches. This is a ritual moment — the anticipation of the loading animation is part of the experience. For customized celebrations with specific filters, parents use their phone/tablet.

---

### Screen 8: TV Settings

> **Depends on:** PRD-14D Screen 6 (Hub Settings) for the base configuration model. PRD-14E adds TV-specific settings.

**Access:** TV Settings are configured from mom's phone or tablet in the Hub Settings page (PRD-14D Screen 6), NOT from the TV itself. The TV's settings gear icon opens a simplified info screen: "Configure your TV Hub settings from the MyAIM app on your phone or tablet."

> **Decision rationale:** Complex settings forms with many toggles and text inputs are painful to navigate with a remote. Mom configures everything from her phone. The TV reads the config and renders accordingly. This also prevents kids from changing TV settings from the living room remote.

**TV-specific settings (added to Hub Settings on phone/tablet):**

| Setting | Options | Default | Notes |
|---------|---------|---------|-------|
| **Ambient idle mode** | Slideshow Frame / Content Cycle | Slideshow Frame | What the TV shows when idle. |
| **Idle timeout** | 1 min / 2 min / 5 min / 10 min / 15 min / Never | 5 minutes | How long before idle mode activates. "Never" keeps the interactive Hub on screen permanently. |
| **Ambient info overlay** | On / Off | On | Shows time, date, next event in the slideshow corner overlay. |
| **Ambient overlay position** | Top-left / Top-right / Bottom-left / Bottom-right | Bottom-right | Corner position for the info overlay. |
| **Member session timeout** | 1 min / 2 min / 5 min / 10 min / 15 min | 5 minutes | How long a member's personal shell stays open on TV before auto-closing. |
| **Hub lock mode** | Enabled / Disabled | Disabled | Deferred — see Hub Lock section. |

**Data storage:**

TV settings are stored as a `tv_config` JSONB column on the existing `family_hub_configs` table (PRD-14D).

```json
{
  "ambient_mode": "slideshow",
  "idle_timeout_seconds": 300,
  "ambient_overlay_enabled": true,
  "ambient_overlay_position": "bottom-right",
  "member_session_timeout_seconds": 300,
  "hub_lock_enabled": false,
  "hub_lock_config": null
}
```

> **Decision rationale:** JSONB on the existing `family_hub_configs` table rather than a new table. TV settings are a small, flat set of preferences tied to the same family Hub — they don't warrant their own table. The `tv_config` column is null until the family first accesses the `/hub/tv` route, at which point defaults are populated.

---

## Hub Lock Mode (Deferred)

> **Deferred:** Hub lock mode — full specification deferred to post-MVP. Schema column reserved. Concept documented below for future implementation.

**Concept:** Mom can configure the TV Hub to display a "locked" indicator until specified conditions are met (e.g., all required tasks complete for the day, daily celebration done). When locked, the Hub remains fully functional — the family can still see the calendar, countdowns, intentions, and everything else. The "lock" prevents dismissing the Hub/PWA to access entertainment apps on the TV.

**Reality check:** On most smart TV platforms, a PWA runs in a browser. The user can press the Home button and navigate away. True app pinning/kiosk mode is platform-dependent:
- **Fire TV:** Supports a limited kiosk mode via device settings, but requires sideloading configuration. Not a universal capability.
- **Android TV / Google TV:** Supports lock task mode via device admin, but requires the app to be set as a device owner — complex setup.
- **General:** No web standard exists for preventing the user from leaving a PWA.

**Recommended approach when built:** Hub lock works as a family accountability tool, not a technical enforcer. The Hub displays a clear visual indicator ("Hub locked until tasks are done") and tracks when conditions are met. Mom receives a notification when the Hub unlocks. The social contract is the enforcement mechanism — the TV shows the family what needs to happen before entertainment, but it cannot physically prevent someone from pressing the Home button.

**Schema reservation:** The `hub_lock_config` field in `tv_config` JSONB is reserved. When built, it would store condition types, member scopes, and override rules.

> **Forward note:** If a specific TV platform adds a web API for kiosk/pinned mode, PRD-14E can be updated to leverage it. For now, hub lock is a social agreement tool with visual accountability, not a technical lock.

---

## Visibility & Permissions

| Role | TV Hub View | TV Member Shell | TV Settings | Celebration on TV |
|------|-----------|----------------|------------|-------------------|
| Mom / Primary Parent | Full view. Can access settings info screen. | Full allowed features (task completion, tallies, trackers, victories). | Configures from phone/tablet only. | Can trigger with PIN. |
| Dad / Additional Adult | Full view. | Full allowed features. | No access. | Can trigger with PIN (if `family_celebration` permission granted per PRD-11B). |
| Special Adult | View during active shift only. | Not supported — Special Adults access assigned children's features via their own device during shift, not through TV Hub member access. | No access. | Cannot trigger. |
| Independent (Teen) | Full view. | Full allowed features. | No access. | Cannot trigger (consistent with PRD-11B). |
| Guided | Full view on shared TV. | Allowed features (task completion, tallies). No trackers requiring numeric input. | No access. | Cannot trigger. |
| Play | Full view on shared TV. | Allowed features (task completion). Simplified interaction. | No access. | Cannot trigger. |

> **Decision rationale:** TV permissions mirror PRD-14D Hub permissions. The TV doesn't introduce new permission rules — it inherits. The simplified member shell limits features by interaction complexity, not by role permission. A teen blocked from LiLa on TV isn't a permission restriction — it's an interaction-capability limitation.

---

## Data Schema

### Schema Addition to Existing Table

**`family_hub_configs` (PRD-14D) — add column:**

| Column | Type | Default | Nullable | Notes |
|--------|------|---------|----------|-------|
| tv_config | JSONB | NULL | NULL | TV-specific settings. NULL until first `/hub/tv` access. See Screen 8 for schema. |

> **Decision rationale:** No new tables. TV mode is a rendering layer with a small configuration set. Adding a JSONB column to the existing `family_hub_configs` table is the cleanest approach — it keeps all Hub configuration in one place, one row per family.

**Default `tv_config` value (populated on first TV access):**
```json
{
  "ambient_mode": "slideshow",
  "idle_timeout_seconds": 300,
  "ambient_overlay_enabled": true,
  "ambient_overlay_position": "bottom-right",
  "member_session_timeout_seconds": 300,
  "hub_lock_enabled": false,
  "hub_lock_config": null
}
```

### Computed State (Not Stored)

The following are computed at render time, not persisted:
- **Idle timer:** Client-side timer tracking last remote input. Resets on any interaction.
- **Hub lock status:** When hub lock is built, the locked/unlocked state is computed by querying task completion data — not stored as a boolean.
- **Ambient mode active:** Client-side state based on idle timer expiry.

---

## Flows

### Incoming Flows

| Source | How It Works |
|--------|-------------|
| PRD-14D (Family Hub) | ALL Hub content, section architecture, widget data, Family Best Intentions, countdowns, slideshow slides. PRD-14E renders this data at TV scale. |
| PRD-14D (`family_hub_configs`) | Section order, visibility, slideshow configuration, victory settings. TV reads the same config as tablet. TV-specific settings in the `tv_config` JSONB column. |
| PRD-01 (Auth & Family Setup) | PIN authentication for member access and settings. Session timeout values for TV sub-sessions. |
| PRD-03 (Design System) | Base design tokens. TV mode overrides token values for large-screen rendering. |
| PRD-04 (Shell Routing) | `/hub/tv` route registered as a stub in PRD-14D, wired by PRD-14E. Route activates TV rendering context. |
| PRD-11B (Family Celebration) | Celebration generation API. TV triggers with simplified default params (Highlights, today, all family). Narrative renders full-screen on TV. |
| PRD-14B (Calendar) | Calendar component at TV scale. Same component, TV CSS overrides applied. |

### Outgoing Flows

| Destination | How It Works |
|-------------|-------------|
| PRD-03 (Design System) | Extends the breakpoint system with TV-tier tokens. Adds `--breakpoint-tv-hd: 1920px` and `--breakpoint-tv-4k: 3840px`. These are scaling breakpoints within TV mode, not triggers for TV mode (which is route-driven). |
| PRD-09A (Tasks) | Task completion from TV member shell writes to the same `tasks` table. No TV-specific data path. |
| PRD-06 (Best Intentions) | Tally logged from TV writes to `family_intention_iterations` (family) or `best_intention_iterations` (personal). Same tables as tablet. |

---

## AI Integration

No new AI integration. The Family Celebration generation triggered from TV uses the same PRD-11B API with simplified default parameters. LiLa conversations are blocked on the TV member shell.

---

## Edge Cases

### Fire TV Stick at 720p
- TV mode activates via route, not resolution. A 720p device still gets the large-font TV layout. Font sizes may appear proportionally larger on a smaller/lower-res display — this is acceptable and preferable to showing a cramped tablet layout.

### No Slideshow Content
- If no slides exist and Guiding Stars auto-feed is off, ambient mode falls back to Content Cycle regardless of mom's setting. If Content Cycle also has nothing to show (all sections hidden), the Hub simply stays on the main surface with no ambient transition.

### Member with Visual Password Only (No PIN)
- TV shows: "Visual passwords aren't available on TV. Ask a parent to set up a PIN for TV access."
- This member cannot access their personal shell on TV until mom configures a PIN as an alternative.

### Large Families (9+ Members)
- Member access row scrolls horizontally with arrow keys. Focus moves linearly through the row. Dot indicators show position.
- Family Best Intentions with many participating members: avatar row scrolls horizontally within the intention card.

### TV Loses Internet
- PWA shows a friendly offline message: "Can't connect to MyAIM. Check your internet connection." If service worker caching is available (future PWA PRD), cached Hub data may display read-only.

> **Deferred:** Offline support for TV Hub — to be specified in the PWA/Offline PRD.

### Ambient Mode Transition During Member Shell
- If a member has their personal shell open on TV and the idle timer expires, ambient mode does NOT activate. The member session timeout handles this — the shell closes after 5 minutes (default), returning to the Hub, and then the Hub's idle timer starts.

### Multiple TVs
- Multiple TVs can load `/hub/tv` simultaneously. They all read the same `family_hub_configs` data. A tally logged from one TV appears on the other TV on next data refresh. No real-time sync between TVs (standard Supabase real-time subscription handles this if enabled).

---

## Tier Gating

> **Tier rationale:** TV mode is a premium family feature. It requires the family Hub (Enhanced tier) as a prerequisite. The TV-specific rendering, ambient mode, and simplified member shell are additional value that justifies a higher tier.

| Feature Key | Description | Intended Tier (TBD) |
|-------------|-------------|---------------------|
| `family_hub_tv_route` | `/hub/tv` route access — TV-optimized rendering, ambient mode, remote navigation, simplified member shell | FullMagic (registered in PRD-14D) |

All feature keys return `true` during beta.

> **Depends on:** PRD-14D registers `family_hub_tv_route` as a feature key. PRD-14E wires the functionality behind it.

---

## Stubs

### Stubs Created by This PRD

| Stub | Wires To | Future PRD |
|------|----------|------------|
| Hub lock mode (schema reserved in `tv_config`, UI and logic not built) | Task-completion-gated TV lock with visual accountability | Post-MVP enhancement |
| Ambient mode slide-specific controls (pause, skip, manual advance without exiting) | Enhanced slideshow remote interaction | Post-MVP enhancement |
| TV-specific PWA manifest icons and splash screens | Optimized app appearance on TV home screen | PWA/Offline PRD |
| Offline Hub display from service worker cache | Read-only Hub when internet drops | PWA/Offline PRD |
| Real-time data sync between multiple TV instances | Supabase real-time subscriptions for multi-screen families | Post-MVP enhancement |

### Existing Stubs Wired by This PRD

| Stub | Created By | How It's Wired |
|------|-----------|----------------|
| `/hub/tv` route (registered, shows placeholder) | PRD-14D | Fully wired. Route renders the Family Hub at TV scale with ambient mode, remote navigation, and simplified member shell. |

---

## Technical Requirements — PWA on TV

### Manifest Configuration

The PWA manifest must include TV-appropriate values:

- `display`: `"standalone"` (runs without browser chrome)
- `orientation`: `"landscape"` (TVs are always landscape)
- `icons`: Include high-resolution icons suitable for TV home screens (320×180 banner icon for Android TV, 1280×720 for Fire TV splash)
- `start_url`: `"/hub/tv"` for the TV-specific PWA install
- `theme_color` and `background_color`: Match the family's Hub theme

### Browser Compatibility

| Platform | Browser | Status |
|----------|---------|--------|
| Fire TV (all models) | Silk Browser | Validated (StewardShip) |
| Android TV | Chrome | Expected compatible (same Chromium engine) |
| Google TV | Chrome | Expected compatible |
| Samsung Tizen | Samsung Internet | Untested — forward note for compatibility sprint |
| LG webOS | LG Browser | Untested — forward note for compatibility sprint |
| Roku | N/A | No PWA support. Not a target platform. |
| Apple TV | N/A | No PWA support. Not a target platform. |

> **Decision rationale:** Targeting Chromium-based TV platforms (Fire TV, Android TV, Google TV) for MVP. Samsung and LG have non-Chromium browsers that may need additional testing. Roku and Apple TV lack PWA support and are out of scope.

> **Forward note:** Step-by-step install guides per platform (how to open the browser, navigate to the URL, add to home screen) are a companion help document written closer to launch, not part of this PRD.

### Performance Considerations

- TV devices (especially Fire TV Stick, older Android TV boxes) have limited CPU/RAM compared to tablets. The TV Hub should minimize JavaScript bundle size and avoid complex animations.
- Slideshow images should be lazy-loaded and appropriately sized for 1080p/4K (not loading 4K images on a 1080p device).
- The idle timer and ambient mode transitions should use CSS transitions, not JavaScript-driven animations, for smoother performance on constrained devices.

---

## What "Done" Looks Like

### MVP (Must Have)
- [ ] `/hub/tv` route renders the Family Hub at TV scale (large fonts, high contrast, generous spacing)
- [ ] `tv-mode` CSS class applies design token overrides for 10-foot viewing
- [ ] All Hub sections from PRD-14D render correctly at TV scale
- [ ] No hover states in TV mode — all interaction uses `:focus-visible`
- [ ] Focus ring visible from 10 feet on 1080p display (3px solid, background tint, subtle scale)
- [ ] Logical tab order follows visual layout (top-to-bottom, left-to-right within sections)
- [ ] Remote D-pad navigation works: arrow keys scroll and move focus, Enter activates
- [ ] Family Best Intentions tally works via remote (arrow to avatar, Enter to tally)
- [ ] PIN entry works via TV's native on-screen keyboard
- [ ] Member quick access: select member → PIN → simplified member shell modal
- [ ] Visual password members see redirect message on TV
- [ ] Simplified member shell shows: tasks (completable), routines (completable), Best Intentions (tallyable), trackers (incrementable), calendar (read-only), victories (viewable + log action), countdowns (viewable)
- [ ] Blocked features show friendly redirect message ("Open MyAIM on your phone or tablet to...")
- [ ] Member shell timeout after configurable duration (default 5 min), returns to Hub
- [ ] Ambient slideshow mode activates after configurable idle timeout (default 5 min)
- [ ] Ambient overlay shows time, date, next event in configurable corner
- [ ] Any remote button press exits ambient mode, returns to interactive Hub
- [ ] Content Cycle ambient mode cycles through Hub sections as full-screen panels
- [ ] Mom chooses ambient mode (slideshow vs. content cycle) from phone/tablet settings
- [ ] Family Celebration triggerable from TV with parent PIN → simplified defaults → full-screen narrative display
- [ ] Celebration narrative auto-scrolls or manually advances with remote
- [ ] `tv_config` JSONB column on `family_hub_configs` with defaults
- [ ] TV settings configurable from phone/tablet Hub Settings (not from the TV itself)
- [ ] Back button closes overlays, returns to Hub
- [ ] Works on Fire TV Silk browser (validated target platform)
- [ ] `useCanAccess('family_hub_tv_route')` wired, returns true during beta

### MVP When Dependency Is Ready
- [ ] PWA manifest with TV-appropriate icons and landscape orientation (requires PWA/Offline PRD infrastructure)
- [ ] Slideshow ambient mode with Guiding Stars auto-feed (requires PRD-06 build with family Guiding Stars)
- [ ] Calendar section at TV scale (requires PRD-14B build)
- [ ] Family Vision Statement display at TV scale (requires PRD-12B build)

### Post-MVP
- [ ] Hub lock mode (visual accountability tool, not technical lock)
- [ ] Ambient mode slide controls (pause, skip, manual advance without exiting to Hub)
- [ ] Samsung Tizen and LG webOS compatibility testing and fixes
- [ ] TV-specific PWA splash screens and home screen banners
- [ ] Offline Hub display from service worker cache
- [ ] Real-time multi-TV sync via Supabase subscriptions
- [ ] Auto-dim ambient overlay during evening hours
- [ ] TTS audio for Family Celebration read-aloud on TV

---

## CLAUDE.md Additions from This PRD

- [ ] `/hub/tv` route activates TV mode. TV mode is route-driven, NOT breakpoint-driven. The route applies a `tv-mode` CSS class that activates large-screen token overrides regardless of actual display resolution.
- [ ] TV mode does NOT build a custom focus management engine. It relies on the TV browser's native D-pad-to-keyboard mapping and optimizes the page for that behavior (semantic HTML, `:focus-visible` styling, logical tab order, no hover states).
- [ ] TV mode reuses the same React components as tablet Hub. No separate component tree for TV. Same components, different CSS context.
- [ ] TV ambient mode has two options: Slideshow Frame (default) and Content Cycle. Mom configures from phone/tablet. Any remote input exits ambient mode.
- [ ] TV member shell is a simplified subset: task completion, routine completion, Best Intentions tally, tracker increments, calendar view, victory logging. Features requiring substantial text entry (journal, LiLa, messaging, InnerWorkings, LifeLantern, Guiding Stars editing, Studio/Lists) are blocked with friendly redirect messages.
- [ ] Visual password auth is not supported on TV. Members needing TV access should have a PIN configured.
- [ ] TV settings are NOT configurable from the TV. Mom configures TV-specific settings from the Hub Settings page on her phone or tablet. The TV displays an info message directing to the phone/tablet for settings changes.
- [ ] `tv_config` JSONB column on `family_hub_configs` stores all TV-specific preferences. NULL until first `/hub/tv` access, then populated with defaults.
- [ ] TV member sub-sessions default to 5-minute timeout (shorter than tablet 15-minute default). Configurable by mom.
- [ ] Hub lock mode is deferred. Schema field reserved in `tv_config` JSONB but no implementation for MVP. When built, it's a visual accountability tool (social contract), not a technical lock — TV platforms don't reliably support kiosk mode for web apps.
- [ ] Family Celebration on TV uses simplified defaults (Highlights, today, all family). No filter customization on TV. Custom celebrations are generated from phone/tablet.

---

## DATABASE_SCHEMA.md Additions from This PRD

Tables defined: None (no new tables)
Tables modified: `family_hub_configs` (added `tv_config` JSONB column)
Enums updated: None
Triggers added: None

---

## Decisions Made This Session

### Decided

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **TV mode is route-driven (`/hub/tv`), not breakpoint-driven** | A Fire TV Stick at 720p should still get the TV layout. The route determines the rendering context. Breakpoints within TV mode (1080p vs. 4K) handle internal scaling. |
| 2 | **No custom D-pad focus management engine — use native browser behavior** | Smart TV browsers already map D-pad to keyboard events. Building a custom focus system is fragile and unnecessary. The PRD's job is to make the page optimally navigable with the native behavior. |
| 3 | **Ambient mode default: Slideshow Frame** | Most families want a beautiful idle display, not a rotating data dashboard. Content Cycle is available as an option. Mom chooses. |
| 4 | **Any remote button press exits ambient mode** | Simple, predictable, no learning curve. Enhanced slide controls (pause, skip without exiting) deferred to post-MVP. |
| 5 | **TV settings configured from phone/tablet, not from TV** | Complex settings forms are painful with a remote. Mom configures everything from her phone. Kids can't change TV settings from the living room. |
| 6 | **Simplified member shell on TV — allowed/blocked feature split** | Features requiring substantial text entry or deep navigation are blocked on TV with friendly redirect. The TV is a "check things off" surface, not a full workspace. |
| 7 | **Visual password not supported on TV** | Visual passwords require precise touch/tap interaction that doesn't translate to remote navigation. Fall back to PIN. Minor edge case. |
| 8 | **5-minute default for TV member sub-session timeout** | Shared screen in a public room — abandoned sessions should clear quickly. Shorter than tablet's 15 minutes. Mom-configurable. |
| 9 | **Family Celebration on TV: simplified default trigger** | PIN → Highlights, today, all family. No filter customization on TV (touch interface). Custom celebrations generated from phone/tablet. Anticipation during generation is part of the family ritual. |
| 10 | **Hub lock mode deferred to post-MVP** | Technical enforcement is shaky — kids can change TV input, press Home button, etc. When built, it's a visual accountability tool (social contract), not a real lock. Schema field reserved. |
| 11 | **`tv_config` JSONB column on existing `family_hub_configs` table** | Small, flat config set doesn't need its own table. Keeps all Hub configuration in one place. |
| 12 | **No TV-specific section configuration — TV reads the same Hub config as tablet** | One configuration, multiple rendering surfaces. Avoids cognitive load of maintaining separate TV and tablet configs. |
| 13 | **Target Chromium-based TV platforms for MVP** | Fire TV (validated), Android TV, Google TV. Samsung/LG deferred to compatibility sprint. Roku/Apple TV out of scope (no PWA support). |

### Deferred

| # | What's Deferred | Resolution Path |
|---|----------------|----------------|
| 1 | Hub lock mode (visual accountability tool) | Post-MVP enhancement. Schema reserved in `tv_config`. |
| 2 | Ambient mode slide controls (pause, skip without exiting) | Post-MVP enhancement. |
| 3 | Samsung Tizen and LG webOS compatibility | Compatibility testing sprint after MVP launch. |
| 4 | TV-specific PWA manifest, splash screens, home screen banners | PWA/Offline PRD. |
| 5 | Offline Hub display | PWA/Offline PRD. |
| 6 | Step-by-step install guides per TV platform | Companion help documentation, written closer to launch. |
| 7 | TTS audio for Family Celebration on TV | Post-MVP enhancement (registered as stub in PRD-11B). |
| 8 | Real-time multi-TV sync | Post-MVP — Supabase real-time subscriptions. |

### Cross-PRD Impact

| PRD Affected | What Changed | Action Needed |
|-------------|-------------|---------------|
| PRD-14D (Family Hub) | `tv_config` JSONB column added to `family_hub_configs`. `/hub/tv` stub wired. TV Settings group added to Hub Settings (Screen 6). | Update PRD-14D schema to include `tv_config` column. Add "TV Settings" group to Screen 6. Mark `/hub/tv` stub as wired. |
| PRD-03 (Design System) | TV breakpoint tiers added: `--breakpoint-tv-hd: 1920px`, `--breakpoint-tv-4k: 3840px`. Note that these are scaling tiers within TV mode, not TV mode activation triggers. | Add TV breakpoints to PRD-03 Breakpoints section with note about route-driven activation. |
| PRD-01 (Auth & Family Setup) | TV member sessions use a separate timeout default (5 min vs. 15 min tablet). Visual password not supported on TV — PIN fallback required. | Note TV session timeout as a TV-specific configuration in PRD-01's session management section. Note visual password TV limitation. |
| PRD-11B (Family Celebration) | TV triggers celebration with simplified defaults (Highlights, today, all family). No filter UI on TV. Full-screen narrative display on TV is a new rendering surface. | Note TV as a triggering surface in PRD-11B's "Where it lives" section. Document simplified default params for TV trigger. |
| PRD-04 (Shell Routing) | `/hub/tv` route wired with TV rendering context. No layout changes — same standalone Hub layout, TV CSS applied. | Note in PRD-04 that `/hub/tv` uses the standalone Hub layout with TV-specific CSS class. |
| PRD-02 (Permissions & Access Control) | No new permissions. TV permissions inherit from PRD-14D. Simplified member shell feature blocking is interaction-based, not permission-based. | No changes needed. Note in PRD-02 that `family_hub_tv_route` feature key controls TV access (already registered in PRD-14D). |
| Build Order Source of Truth | PRD-14E completed. `/hub/tv` stub wired. | Update Section 2 to list PRD-14E as completed. |

---

*End of PRD-14E*
