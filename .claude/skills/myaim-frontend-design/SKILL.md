# MyAIM Frontend Design System — Claude Code Skill

This skill constrains all frontend work to the MyAIM design system. Load it whenever writing CSS, creating components, or modifying UI. These rules prevent the visual density and consistency problems that required the UX overhaul.

---

## Rule 1: Zero Hardcoded Colors

Every `color`, `background`, `background-color`, `border-color`, `box-shadow` color, `fill`, `stroke`, and `outline-color` MUST use `var(--*)` CSS custom property tokens.

**Never use:** hex values (`#fff`, `#68a395`), `rgb()`/`rgba()`, named colors (`white`, `black`, `gray`).

**Always use:** `var(--color-text-primary)`, `var(--color-bg-card)`, `var(--color-btn-primary-bg)`, `var(--color-border)`, `var(--color-text-secondary)`, etc.

**For transparency:** Use `color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))` instead of `rgba()` with hardcoded colors.

**Verification:** Run `npm run check:colors` or grep for `#[0-9a-fA-F]{3,8}` in `.tsx` and `.css` files (excluding comments, SVG assets, and Tailwind config).

---

## Rule 2: Density Tiers

Every page or surface wrapper MUST declare a density tier via CSS class. Components consume the `--density-multiplier` for spacing.

```css
.density-comfortable { --density-multiplier: 1; }    /* default */
.density-compact     { --density-multiplier: 0.7; }
.density-tight       { --density-multiplier: 0.5; }
```

| Surface Type | Density | Examples |
|---|---|---|
| Creation flows & forms | `comfortable` | Task Creation Modal, list creation, journal editing, family setup |
| Content consumption | `comfortable` | Tutorial detail, journal reading, LiLa chat, entry detail |
| Browsing & navigation | `compact` | Studio, AI Vault, Archives, Command Center, dashboard widgets |
| Control panels & settings | `tight` | Theme selector, filter bars, config panels, permission editors |
| Data lists & tables | `compact` | Task lists, queue items, notification lists, history views |

**The density class goes on the page-level wrapper, NOT globally.**

Density does NOT affect `--touch-target-min` — touch targets are governed by shell, not density. Shell token overrides (Play = larger) compose ON TOP of density.

---

## Rule 3: Card Sizes

Use the shared Card component with the `size` prop. Never set fixed pixel heights on cards.

| Size | Internal Padding | Body Text Size | Use Case |
|---|---|---|---|
| `sm` | `0.75rem` | `var(--font-size-xs)` | Studio templates, vault browse, queue items |
| `md` | `1rem` | `var(--font-size-sm)` | Dashboard widgets, task cards, list items |
| `lg` | `1.5rem` | `var(--font-size-base)` | Form sections, detail views, modal content |

**Never:** `height: 360px`, `min-height: 300px`, or any fixed height on a card.
**Always:** Let content determine height. Use `max-height` + `overflow: hidden` only for unbounded content.

---

## Rule 4: Section Card Pattern for Forms

Multi-field forms use stacked full-width section cards. Never use 2-column grid layouts for form sections.

```css
.form-section-card {
  background: color-mix(in srgb, var(--color-bg-card) 90%, transparent);
  border: 1px solid var(--color-border);
  border-radius: var(--vibe-radius-card);
  padding: var(--spacing-lg);      /* 1.5rem — forms breathe */
  margin-bottom: var(--spacing-md); /* 1rem between sections */
}

.form-section-heading {
  color: var(--color-btn-primary-bg);
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-sm); /* 0.5rem */
}
```

Fields within a section card are full-width, stacked vertically. Labels above fields, not beside them.

---

## Rule 5: Modal System

All modals use the shared `<Modal>` component. Never create standalone modal implementations with custom portals, backdrops, or positioning. See `specs/Modal-System-Architecture.md` for the full spec.

**Two modal types:**
- **Persistent** (`type="persistent"`): Creation flows and configuration. Gradient header. Can be **minimized** to a floating pill — click-off and X trigger minimize, not close. Explicit "Cancel"/"Discard" required to close. State preserved while minimized. Max 3 minimized at once.
- **Transient** (`type="transient"`): Quick views, confirmations, pickers. Plain header. Click-off and X close the modal. No state preservation. Opens fresh every time.

**Size mapping (desktop):**
| Size | Max Width | Use Case |
|---|---|---|
| `sm` | 480px | Confirmations, pickers, simple forms |
| `md` | 640px | Event creation, victory log, list item add |
| `lg` | 750px | Task creation, template customization |
| `xl` | 960px | Vault detail, calendar month, View As |
| `full` | 90vw | Admin panels, complex config |

**Mobile:** `sm`/`md` → bottom-sheet. `lg`/`xl`/`full` → full-screen with back arrow.

**Sidebar navigation while modal is open:** Auto-minimizes the persistent modal to a pill, then navigates. User can restore from any page.

**Key components:** `Modal.tsx`, `ModalHeader.tsx`, `ModalFooter.tsx`, `MinimizedPillBar.tsx`, `DraftPrompt.tsx`, `LimitPrompt.tsx`, `ModalManagerContext.tsx`, `useModal.ts`, `useModalState.ts`

**Never:** Create a modal with its own overlay, backdrop, portal, or z-index management. Always use the shared Modal system and the z-index layer tokens (`--z-modal-backdrop: 50`, `--z-modal-content: 55`, `--z-modal-stacked: 60`).

---

## Rule 6: Helper Text on Non-Obvious Fields

Every form field that isn't immediately self-explanatory gets small helper text below it.

```css
.field-helper {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  margin-top: 0.25rem;
}
```

**Fields that need helper text:** description fields, duration pickers, life area tags, schedule options, incomplete actions, reward amounts, bonus thresholds, template names, any toggle whose purpose isn't obvious from its label alone.

**Fields that don't need helper text:** name/title fields, date pickers, email fields, password fields.

---

## Rule 7: Radio Buttons with Descriptions for Exclusive Choices

When a user must choose one option from a non-obvious set (scheduling frequency, incomplete action, task type), use radio buttons with descriptions — NOT tiny pills, NOT dropdowns.

```
○ Label — Short description explaining what this option means
○ Label — Short description explaining what this option means
```

Each radio option:
- Radio input with `accent-color: var(--color-btn-primary-bg)`
- Label: `var(--color-text-primary)`, `font-weight: 600`
- Description after em-dash: `var(--color-text-secondary)`, `font-weight: 400`

**When to use pills/chips instead:** Only for multi-select values where all options are obvious (day-of-week selectors, tag lists, member selection).

---

## Rule 8: Expandable Inline Explainers

For terminology or concepts that need explanation, use the "Types Explained" pattern:

- **Trigger:** Text link with chevron icon, styled in `var(--color-btn-primary-bg)`
- **Content:** Paragraph descriptions in a tinted background card
- **Background:** `color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))`
- **Default state:** Collapsed
- **Animation:** Smooth height transition, 200ms

Never put explanations in tooltips if they're longer than one sentence. Never hide critical decision-making information behind a "?" icon.

---

## Rule 9: Touch Target Scoping

Touch targets are scoped by element type, not applied globally.

```css
/* Primary interactive elements: full touch target */
button:not(.btn-icon):not(.btn-chip):not(.btn-inline),
input[type="text"], input[type="email"], input[type="password"],
input[type="number"], input[type="date"],
textarea, select {
  min-height: var(--touch-target-min, 44px);
}

/* Small UI elements: reduced minimum */
.btn-icon, .btn-chip, .btn-inline {
  min-height: 28px;
}
```

**Never** apply `min-height: 44px` to ALL buttons globally. Icon buttons, chips, and inline toggles get `28px`.

---

## Rule 10: Icons

- **Mom, Adult, Independent, Guided shells:** Lucide React icons only. No Unicode emoji anywhere.
- **Play shell only:** Emoji permitted alongside Lucide icons.
- Icon sizes follow the density tier:
  - Cards with `size="sm"`: `16-20px` icons
  - Cards with `size="md"`: `20-24px` icons
  - Cards with `size="lg"`: `24-32px` icons
  - Navigation: `20px` default

---

## Rule 11: Shell Token Composition

Shell-specific token overrides (from PRD-03/PRD-04) apply ON TOP of the density tier:

- **Play shell:** 56px touch targets, larger fonts, bouncier animations — these override density
- **Guided shell:** 48px touch targets, moderate scaling
- **Independent/Adult/Mom:** Standard touch targets, density controls spacing

The density system reduces spacing. The shell system increases touch targets. They compose — they don't conflict.

---

## Rule 12: No Global Spacing Overrides

- Never use `!important` on spacing properties (padding, margin, gap)
- Never set spacing in a global stylesheet that affects all instances of an element type
- Spacing is controlled by: density tier (page level) → component size prop → component-specific CSS
- If you need to override spacing for a specific instance, use a scoped class, not a global rule

---

## Quick Reference: Common Token Names

| Purpose | Token |
|---|---|
| Primary text | `var(--color-text-primary)` |
| Secondary/helper text | `var(--color-text-secondary)` |
| Page background | `var(--color-bg-primary)` |
| Card background | `var(--color-bg-card)` |
| Secondary background | `var(--color-bg-secondary)` |
| Border | `var(--color-border)` |
| Primary button bg | `var(--color-btn-primary-bg)` |
| Primary gradient | `var(--gradient-primary)` |
| Surface for nav | `var(--surface-nav)` |
| Surface for primary elements | `var(--surface-primary)` |
| Text on primary/dark bg | `var(--color-text-on-primary)` |
| Accent deep (tooltips) | `var(--color-accent-deep)` |
| Heading font | `var(--font-heading)` |
| Body font | `var(--font-body)` |
| Smallest text | `var(--font-size-xs)` |
| Small text | `var(--font-size-sm)` |
| Base text | `var(--font-size-base)` |
| Card border radius | `var(--vibe-radius-card)` |
| Input border radius | `var(--vibe-radius-input)` |
| Modal border radius | `var(--vibe-radius-modal)` |
