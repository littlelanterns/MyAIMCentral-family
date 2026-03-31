---
name: myaim-frontend-design
description: "Use this skill whenever creating, modifying, or reviewing any UI component, CSS, or visual element in the MyAIM Family v2 codebase. Triggers include: creating new components, modifying styles, building modals or forms, adjusting spacing/padding, working with theme tokens, creating page layouts, or any task involving visual output."
---

# MyAIM Frontend Design System — Claude Code Skill

This skill constrains all frontend work to the MyAIM design system. Load it whenever writing CSS, creating components, or modifying UI. These rules prevent the visual density and consistency problems that required the UX overhaul.

---

## Rule 1: Zero Hardcoded Colors

Every `color`, `background`, `border-color`, `fill`, `stroke`, `box-shadow` color value must use `var(--*)` CSS custom properties. No hex, no rgb(), no named colors. The ONLY exception is `rgba(0,0,0,...)` for shadow definitions — and even those should prefer `var(--shadow-*)` tokens when possible.

**Never use:** hex values (`#fff`, `#68a395`), `rgb()`/`rgba()` with hardcoded color components, named colors (`white`, `black`, `gray`).

**Always use:** `var(--color-text-primary)`, `var(--color-bg-card)`, `var(--color-btn-primary-bg)`, `var(--color-border)`, `var(--color-text-secondary)`, etc.

**For transparency:** Use `color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))` instead of `rgba()` with hardcoded colors.

---

## Rule 2: Density Tiers

Every new page or surface must declare its density class on its wrapper element. Creation flows and forms use `density-comfortable`. Browsing grids and navigation use `density-compact`. Settings panels and control surfaces use `density-tight`. Content reading surfaces use `density-comfortable`.

```css
.density-comfortable { --density-multiplier: 1; }
.density-compact     { --density-multiplier: 0.7; }
.density-tight       { --density-multiplier: 0.5; }
```

---

## Rule 3: Card Sizes via Prop

Use the shared Card component with `size="sm"`, `size="md"`, or `size="lg"`. Never set fixed pixel heights on cards. Let content drive height. Studio/Vault browse = `sm`. Dashboard widgets = `md`. Form section cards = `lg`.

---

## Rule 4: Section Card Pattern for Forms

Multi-field forms use stacked full-width section cards: translucent card background (`color-mix(in srgb, var(--color-bg-card) 90%, transparent)`), colored section heading in `var(--font-heading)`, `1px solid var(--color-border)`, `var(--vibe-radius-card)` corners, generous internal padding (`1.25rem`).

---

## Rule 5: Gradient Headers on Primary Modals

All persistent (minimizable) modals get the gradient header: `var(--gradient-primary)` background (with solid fallback), `var(--font-heading)`, white/on-dark text, circular close button with translucent white background. Transient modals get a plain header with border-bottom.

---

## Rule 6: Helper Text on Non-Obvious Fields

Every form field whose purpose isn't immediately obvious from its label gets helper text: `var(--color-text-secondary)`, `var(--font-size-xs)`, placed directly below the input with `4px` gap. Written in conversational plain language.

---

## Rule 7: Radio Buttons with Descriptions for Exclusive Non-Obvious Choices

When options are mutually exclusive AND a user wouldn't know what to pick without context, use radio buttons where each option has a bold label and a description line. Chips/pills are fine for well-understood selections (days of week, family members by name).

---

## Rule 8: Expandable Inline Explainers for Terminology

For any place where the app introduces terminology that might confuse a first-time user, add an expandable "What's the difference?" section: text link trigger in `var(--color-btn-primary-bg)`, expanded content in a tinted background card.

---

## Rule 9: Touch Targets Scoped by Element Type

Primary interactive elements (buttons, inputs, selects) get `min-height: var(--touch-target-min)` (44px adult, 48px guided, 56px play). Icon buttons, chips, inline toggles get `min-height: 28px`. Never apply 44px minimum to every button globally.

---

## Rule 10: Lucide Icons Only in Mom/Adult/Independent/Guided Shells

No Unicode emoji as decoration, bullets, or status indicators. Play shell permits emoji. Icon size: 18-20px adult, 22-24px guided, 28-32px play.

---

## Rule 11: Shell Token Overrides Compose with Density

When building for Guided or Play shells, the shell's larger font/spacing/touch-target overrides apply ON TOP of the surface's density tier. They multiply, not conflict.

---

## Rule 12: No `!important` on Spacing

Never use `!important` to override padding, margin, gap, or any spacing value. Use the density system or component props.

---

## Rule 13: Modal Type Correctness

Use `type="persistent"` for creation/editing flows (task, event, list, template, victory). Use `type="transient"` for read-only views, confirmations, pickers. Always use the shared ModalV2 component — no one-off portals.

---

## Rule 14: Consistent Modal Patterns

All persistent modals: gradient header, section-card body, sticky footer with Cancel + primary action. All transient modals: plain header with border, content body, optional footer. Both: backdrop click behavior per type, Escape key, focus trap.

---

## Rule 15: Scrollbar CSS — Do Not Touch

The scrollbar theming in `src/App.css` uses exactly 3 WebKit pseudo-element rules. These are the ONLY scrollbar rules that work. Do NOT add, modify, or "improve" them.

```css
/* These 3 rules are the complete scrollbar system. Do not add to them. */
::-webkit-scrollbar-thumb { background: var(--color-btn-primary-bg); }
.gradient-on ::-webkit-scrollbar-thumb { background: var(--gradient-primary); }
::-webkit-scrollbar-thumb:hover { background: linear-gradient(135deg, var(--color-accent), var(--color-btn-primary-bg)); }
```

**NEVER add any of these — they break the gradient scrollbars:**
- `scrollbar-color` property (overrides WebKit pseudo-elements in modern browsers)
- `scrollbar-width` property
- `* { }` selectors targeting scrollbars
- Any Firefox-specific scrollbar fallbacks

This has been broken and fixed twice. The standard `scrollbar-color` CSS property conflicts with `::-webkit-scrollbar` pseudo-elements — browsers that support both prefer the standard property, which only accepts solid colors (no gradients). The result is gradient scrollbars silently replaced with flat colors.

If a specific panel needs a different scrollbar track color, use `.scrollbar-card::-webkit-scrollbar-track` — but be careful it doesn't break the `.gradient-on` thumb rule by specificity.

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
