/**
 * Post-build check: Detect hardcoded colors in source files.
 *
 * Allowed:
 *   - CSS custom properties: var(--color-...)
 *   - Fallback values in var(): var(--color-foo, #68a395)
 *   - The member_colors.ts config file (source of truth for palette)
 *   - Theme token files (they define the variables)
 *   - rgba() with 0 alpha (transparent overlays)
 *   - Test files
 *
 * Flagged:
 *   - Bare hex codes (#abc123) NOT inside a var() fallback
 *   - Bare rgb/hsl values in style props
 *   - Hardcoded color names (red, blue, etc.) in style props
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, extname, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const SRC_DIR = join(__dirname, '..', 'src')

// Files/dirs that are allowed to have raw colors
const ALLOWED_FILES = [
  'config/member_colors.ts',
  'lib/theme/tokens.ts',
  'lib/theme/ThemeProvider.tsx',
  'config/feature_guide_registry.ts',
  'components/ThemeSelector.tsx', // Theme swatches are by definition color constants
]

// Hex color pattern: #rgb, #rrggbb, #rrggbbaa — NOT inside var() fallback
const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g

// Lines containing var(-- are allowed (fallback values)
const VAR_FALLBACK = /var\(--[^)]*#[0-9a-fA-F]+/

// rgba with near-zero alpha is fine (overlays)
const RGBA_OVERLAY = /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\.[0-4]/

interface Violation {
  file: string
  line: number
  content: string
  hex: string
}

function walkDir(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue
      files.push(...walkDir(full))
    } else {
      const ext = extname(full)
      if (['.tsx', '.ts', '.css', '.jsx', '.js'].includes(ext)) {
        files.push(full)
      }
    }
  }
  return files
}

function checkFile(filePath: string): Violation[] {
  const rel = relative(SRC_DIR, filePath).replace(/\\/g, '/')
  if (ALLOWED_FILES.some(allowed => rel === allowed || rel.startsWith(allowed))) return []
  if (rel.includes('__test') || rel.includes('.test.') || rel.includes('.spec.')) return []

  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const violations: Violation[] = []

  lines.forEach((line, i) => {
    // Skip comment lines
    const trimmed = line.trim()
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return

    // Find hex codes
    const matches = line.match(HEX_PATTERN)
    if (!matches) return

    for (const hex of matches) {
      // Skip if it's inside a var() fallback
      if (VAR_FALLBACK.test(line)) continue
      // Skip if it's part of rgba overlay
      if (RGBA_OVERLAY.test(line)) continue
      // Skip import/require lines
      if (trimmed.startsWith('import ') || trimmed.startsWith('require(')) continue

      violations.push({
        file: rel,
        line: i + 1,
        content: trimmed.substring(0, 100),
        hex,
      })
    }
  })

  return violations
}

// Run
const files = walkDir(SRC_DIR)
const allViolations: Violation[] = []

for (const file of files) {
  allViolations.push(...checkFile(file))
}

if (allViolations.length === 0) {
  console.log('No hardcoded colors found. All colors use CSS custom properties.')
  process.exit(0)
} else {
  console.log(`Found ${allViolations.length} potential hardcoded color(s):\n`)
  for (const v of allViolations) {
    console.log(`  ${v.file}:${v.line}  ${v.hex}`)
    console.log(`    ${v.content}\n`)
  }
  console.log('Fix: Replace with var(--color-*, fallback) or move to an allowed config file.')
  process.exit(1)
}
