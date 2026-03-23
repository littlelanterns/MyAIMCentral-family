/**
 * Convention Lint Tests
 *
 * Scans the actual codebase to verify conventions are followed:
 * - Database table names use snake_case, no nautical names
 * - RLS enabled on every table
 * - Icons from Lucide only (no emoji in adult interfaces)
 * - CSS uses theme tokens (no hardcoded colors in components)
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

// Nautical terms that must NOT appear in database table names
const NAUTICAL_TERMS = [
  'helm', 'compass', 'anchor', 'starboard', 'port', 'keel',
  'rigging', 'manifest', 'galley', 'bow', 'stern', 'mast',
  'sail', 'rudder', 'hull', 'deck', 'berth', 'brig',
]

function getMigrationFiles(): string[] {
  const migrationDir = join(process.cwd(), 'supabase/migrations')
  if (!existsSync(migrationDir)) return []
  return readdirSync(migrationDir)
    .filter(f => f.endsWith('.sql'))
    .map(f => join(migrationDir, f))
}

function getComponentFiles(): string[] {
  const results: string[] = []
  function walk(dir: string) {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) walk(fullPath)
      else if (entry.name.endsWith('.tsx')) results.push(fullPath)
    }
  }
  walk(join(process.cwd(), 'src'))
  return results
}

describe('Convention Lint', () => {
  describe('Database Naming', () => {
    it('should not use nautical terms in table names', () => {
      const migrations = getMigrationFiles()
      expect(migrations.length).toBeGreaterThan(0)

      for (const file of migrations) {
        const content = readFileSync(file, 'utf-8').toLowerCase()
        // Extract CREATE TABLE statements
        const tableMatches = content.match(/create\s+table\s+(?:public\.)?([\w]+)/g) ?? []
        for (const match of tableMatches) {
          const tableName = match.replace(/create\s+table\s+(?:public\.)?/, '')
          for (const term of NAUTICAL_TERMS) {
            expect(tableName).not.toContain(term)
          }
        }
      }
    })

    it('should use snake_case for all table names', () => {
      const migrations = getMigrationFiles()
      for (const file of migrations) {
        const content = readFileSync(file, 'utf-8')
        const tableMatches = content.match(/CREATE\s+TABLE\s+(?:public\.)?([\w]+)/gi) ?? []
        for (const match of tableMatches) {
          const tableName = match.replace(/CREATE\s+TABLE\s+(?:public\.)?/i, '')
          // snake_case: only lowercase letters, digits, and underscores
          expect(tableName).toMatch(/^[a-z][a-z0-9_]*$/)
        }
      }
    })
  })

  describe('RLS Convention', () => {
    it('should have RLS enabled on every table in migrations', () => {
      const migrations = getMigrationFiles()
      for (const file of migrations) {
        const content = readFileSync(file, 'utf-8')
        // Find all CREATE TABLE statements
        const tableMatches = content.match(/CREATE\s+TABLE\s+(?:public\.)?([\w]+)/gi) ?? []
        for (const match of tableMatches) {
          const tableName = match.replace(/CREATE\s+TABLE\s+(?:public\.)?/i, '')
          // Verify corresponding ENABLE ROW LEVEL SECURITY exists
          const rlsPattern = new RegExp(
            `ALTER\\s+TABLE\\s+(?:public\\.)?${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
            'i'
          )
          expect(
            rlsPattern.test(content),
            `Table "${tableName}" in ${file.split(/[\\/]/).pop()} is missing ENABLE ROW LEVEL SECURITY`
          ).toBe(true)
        }
      }
    })
  })

  describe('Icon Convention', () => {
    it('should not use emoji in non-Play shell components', () => {
      const componentFiles = getComponentFiles()
      // Emoji regex: matches common emoji ranges
      const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u

      for (const file of componentFiles) {
        const relativePath = file.replace(process.cwd(), '')
        // Play shell is exempt — emoji allowed there
        if (relativePath.includes('PlayShell')) continue

        const content = readFileSync(file, 'utf-8')
        // Only check JSX string literals (not comments or variable names)
        const jsxStrings = content.match(/'[^']*'|"[^"]*"|`[^`]*`/g) ?? []
        for (const str of jsxStrings) {
          // Skip import paths and CSS values
          if (str.includes('from') || str.includes('var(--')) continue
          if (emojiRegex.test(str)) {
            // Fail with helpful message
            expect(
              false,
              `Emoji found in non-Play component ${relativePath.split(/[\\/]/).pop()}: ${str}`
            ).toBe(true)
          }
        }
      }
    })
  })

  describe('Theme Token Convention', () => {
    it('should not use hardcoded hex colors in component files', () => {
      const componentFiles = getComponentFiles()
      // Match hex colors like #fff, #ffffff, #FFF4EC
      const hexColorRegex = /#[0-9a-fA-F]{3,8}\b/g

      // Exempt files: theme definitions, tokens, config
      const exemptPatterns = ['tokens.ts', 'theme/', 'tailwind', 'index.css']

      for (const file of componentFiles) {
        const relativePath = file.replace(process.cwd(), '')
        if (exemptPatterns.some(p => relativePath.includes(p))) continue

        const content = readFileSync(file, 'utf-8')
        const matches = content.match(hexColorRegex) ?? []
        // Filter out common false positives (CSS-in-JS template literals referencing vars)
        const realColors = matches.filter(m => {
          // Allow short matches that might be part of IDs or other non-color strings
          return m.length >= 4
        })

        expect(
          realColors.length,
          `Hardcoded hex color(s) found in ${relativePath.split(/[\\/]/).pop()}: ${realColors.join(', ')}. Use CSS custom properties instead.`
        ).toBe(0)
      }
    })
  })
})
