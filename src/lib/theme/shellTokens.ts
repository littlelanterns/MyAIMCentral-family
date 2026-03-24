import { shellScaling } from './tokens'
import type { ShellType } from './tokens'

/**
 * Applies shell-specific CSS token overrides to document.documentElement.
 * Called at the end of applyTokens() in ThemeProvider whenever the active shell changes.
 * PRD-03 — Shell Token Override System
 */
export function applyShellTokens(shell: ShellType): void {
  const root = document.documentElement
  const scale = shellScaling[shell]

  switch (shell) {
    case 'mom':
    case 'adult':
    case 'independent':
      root.style.setProperty('--font-size-base', '1rem')
      root.style.setProperty('--touch-target-min', '44px')
      root.style.setProperty('--line-height-normal', '1.5')
      root.style.setProperty('--vibe-transition', `${scale.animationSpeed} ease`)
      root.style.setProperty('--icon-size-default', '20px')
      break

    case 'guided':
      root.style.setProperty('--font-size-base', '1.0625rem')
      root.style.setProperty('--touch-target-min', '48px')
      root.style.setProperty('--line-height-normal', '1.75')
      root.style.setProperty('--vibe-transition', `${scale.animationSpeed} ease`)
      root.style.setProperty('--icon-size-default', '24px')
      break

    case 'play':
      root.style.setProperty('--font-size-base', '1.25rem')
      root.style.setProperty('--touch-target-min', '56px')
      root.style.setProperty('--line-height-normal', '1.75')
      // Play shell gets the bouncy spring easing per PRD-03
      root.style.setProperty(
        '--vibe-transition',
        '350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      )
      root.style.setProperty('--icon-size-default', '28px')
      break
  }
}
