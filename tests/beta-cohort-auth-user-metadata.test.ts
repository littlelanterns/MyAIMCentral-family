/**
 * BETA-COHORT (migration 100338) — auth.admin.createUser() founding-safety guard.
 *
 * handle_new_user() now flags every new, non-test family founding-at-signup
 * while beta_cohort_settings.enabled=true, subject to the soft cap. ANY test
 * fixture that calls `auth.admin.createUser()` without either
 * `is_test_family: true` or `skip_auto_family: true` in its metadata would,
 * from this migration forward, silently consume a real founding slot every
 * time that test runs — exactly the class of bug found live in
 * seed-testworths-complete.ts and tests/verification/new-jj-kk-onboarding.ts
 * during this build (neither call bypasses handle_new_user; both create
 * real auth.users rows that fire the trigger).
 *
 * `skip_auto_family: true` is ALSO a valid safety flag — it makes
 * handle_new_user() return before ANY family-creation code (including the
 * founding-at-signup block) ever runs, so a fixture using it needs no
 * is_test_family flag at all (e.g. coppa-enforcement.spec.ts's shadow
 * accounts, coppa-admin-console.spec.ts's staff accounts).
 *
 * This test is a deliberately pragmatic source scan (balanced-paren call-
 * text extraction), not a full AST parse — matches the precedent already
 * established by tests/task-source-constraint.test.ts for this class of
 * "does every writer of X respect invariant Y" guard. It scans every .ts/
 * .tsx file under tests/ (production Edge Function code, e.g.
 * family-auth-admin/index.ts, is genuinely out of scope — those are real
 * signup paths, not test fixtures, and are covered by the TEEN-CRED record's
 * own precedent of setting skip_auto_family there already).
 *
 * When adding a NEW test fixture that calls auth.admin.createUser(): pass
 * `user_metadata: { is_test_family: true }` (a real signup you want to
 * exercise normally) or `{ skip_auto_family: true }` (a shadow/PIN-style
 * account that should never get a family at all) — this test fails loudly
 * if you forget either.
 *
 * The ONE deliberate exception: coppa-consent-screens.spec.ts's own
 * founding-at-signup probe needs a genuinely real (unflagged) signup to
 * prove the founding-at-signup behavior actually fires — that call is
 * marked with the literal comment `BETA-COHORT-DELIBERATE-REAL-SIGNUP`
 * immediately above it, which this scanner recognizes and skips.
 */

import { describe, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const TESTS_ROOT = join(__dirname)
const REPO_ROOT = join(__dirname, '..')

const SKIP_DIRS = new Set(['node_modules', 'screenshots', 'eyes-on-tour', 'studio-audit-out'])

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, out)
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
      out.push(full)
    }
  }
  return out
}

/**
 * Extract the balanced-paren call-argument text starting at the '(' that
 * opens a createUser(...) call. Same "not a full AST parse, good enough for
 * a controlled codebase" pragmatism as the COPPA registry/write-gates pins'
 * balanced-paren CREATE TABLE body walk.
 */
function extractCallArgs(text: string, openParenIndex: number): string {
  let depth = 0
  for (let i = openParenIndex; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')') {
      depth--
      if (depth === 0) return text.slice(openParenIndex, i + 1)
    }
  }
  // Unbalanced (shouldn't happen in valid TS) — fall back to a generous window.
  return text.slice(openParenIndex, Math.min(text.length, openParenIndex + 2000))
}

const CREATE_USER_RE = /\.auth\.admin\.createUser\s*\(/g
const SAFE_FLAG_RE = /(is_test_family|skip_auto_family)\s*:\s*(true|'true'|"true")/

interface Violation {
  file: string
  snippet: string
}

describe('BETA-COHORT: every tests/ auth.admin.createUser() call is founding-safe', () => {
  it('has zero createUser() calls missing is_test_family or skip_auto_family in metadata', () => {
    const files = walk(TESTS_ROOT)
    const violations: Violation[] = []

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      const re = new RegExp(CREATE_USER_RE.source, 'g')
      let match: RegExpExecArray | null
      while ((match = re.exec(content))) {
        // Skip doc-comment mentions of the pattern (e.g. a header comment
        // reading "sr.auth.admin.createUser() — handle_new_user
        // auto-provisions..."). A genuine call always passes at least an
        // email, so empty parens is never a real call site; a `//`/`*`-
        // prefixed line is a second, independent guard against comment text.
        const lineStart = content.lastIndexOf('\n', match.index) + 1
        const linePrefix = content.slice(lineStart, match.index).trimStart()
        if (/^(\/\/|\*)/.test(linePrefix)) continue

        // The ONE deliberate exception (see file header): a marker comment
        // anywhere in the 1200 chars immediately before the call opts it out
        // entirely — used only by coppa-consent-screens.spec.ts's own
        // founding-at-signup probe, which needs a genuinely unflagged real
        // signup. Generous window: the marker sits inside a multi-line doc
        // comment whose length can grow.
        const precedingWindow = content.slice(Math.max(0, match.index - 1200), match.index)
        if (precedingWindow.includes('BETA-COHORT-DELIBERATE-REAL-SIGNUP')) continue

        const openParenIndex = match.index + match[0].length - 1
        const callText = extractCallArgs(content, openParenIndex)
        if (callText.trim() === '()') continue

        if (!SAFE_FLAG_RE.test(callText)) {
          violations.push({
            file: relative(REPO_ROOT, file),
            snippet: callText.replace(/\s+/g, ' ').slice(0, 140),
          })
        }
      }
    }

    if (violations.length > 0) {
      const msg = violations.map((v) => `  ${v.file}\n    ${v.snippet}...`).join('\n')
      throw new Error(
        `Found ${violations.length} auth.admin.createUser() call(s) under tests/ with no ` +
          `is_test_family:true or skip_auto_family:true in their metadata. Without one of these ` +
          `flags, handle_new_user() (migration 100338) flags the resulting family founding-at-` +
          `signup, consuming a real founding slot on every test run:\n${msg}`,
      )
    }
  })
})
