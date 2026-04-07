// ESLint flat config (ESLint 9+)
//
// Minimum-viable rule set for MyAIM Central. This config is an ALLOW LIST:
// nothing is active unless we explicitly enable it below. We deliberately
// skip the `typescript-eslint/recommended` and `js.configs.recommended`
// presets because they'd flag hundreds of existing patterns in this mature
// codebase and create noise that kills adoption.
//
// The motivating rule is `no-restricted-syntax` for the UTC date bug — see
// src/utils/dates.ts and claude/conventions.md for context. Additional rules
// can be added incrementally as real bugs surface.

import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  // ─── Global ignores ────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      // Supabase Edge Functions run under Deno with different globals and
      // import conventions — lint separately if ever needed, not from here.
      'supabase/functions/**',
      // Build artifacts and tooling output
      '**/.tsbuildinfo',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      'blob-report/**',
      // Config files
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      'vite.config.*',
      'vitest.config.*',
      'playwright.config.*',
      'tailwind.config.*',
      // Generated types (Supabase codegen)
      'src/types/supabase.ts',
      // Scripts are node-side tooling with different conventions
      'scripts/**',
    ],
  },

  // ─── TypeScript parser + plugin wiring (for src/ and tests/) ───────────
  {
    files: ['src/**/*.{ts,tsx,js,jsx}', 'tests/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react-hooks': reactHooks,
    },
    rules: {
      // ── THE motivating rule: prevent the UTC local-date bug ────────────
      // Matches any `X.toISOString().(split|slice|substring|substr)(...)`
      // call — the distinctive pattern used to extract a date string from
      // a Date via UTC. Fixed across 27 files on 2026-04-07 after the
      // reflections-dated-tomorrow incident (beta_glitch_reports 8dc4b2bd).
      // Documented in claude/conventions.md and src/utils/dates.ts.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.object.callee.property.name='toISOString'][callee.property.name=/^(split|slice|substring|substr)$/]",
          message:
            'Do not use `.toISOString().split("T")` or `.slice(0, 10)` — it returns the UTC date, not the user\'s local date, and causes off-by-one bugs in negative-offset timezones. Import from @/utils/dates: `todayLocalIso()` / `localIso(date)` / `localIsoDaysFromToday(n)` for date strings, `startOfLocalDayUtc()` / `endOfLocalDayUtc()` for TIMESTAMPTZ range queries, `toDatetimeLocalInput()` for datetime-local HTML inputs.',
        },
      ],

      // ── React hooks (catches real bugs, universally applicable) ────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── Basic hygiene ──────────────────────────────────────────────────
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
    },
  },
]
