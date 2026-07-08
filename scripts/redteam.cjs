#!/usr/bin/env node
/**
 * PRD-41 red-team runner with a single automatic retry ONLY on a vitest
 * collection/worker-startup flake (the intermittent "reading 'config'" /
 * "failed to access its internal state" cold-start error the supervisor hit
 * once during Phase 2 verification). A GENUINE red-team failure (a real
 * assertion failing — output contains "Tests N failed") is NOT retried and
 * blocks the push, exactly as intended. This keeps the pre-push hook from
 * being defeated by a spurious worker-startup race while never masking a
 * real safety-gate regression.
 */
const { spawnSync } = require('child_process')

function run() {
  return spawnSync('npx', ['vitest', 'run', 'tests/redteam'], {
    stdio: 'pipe',
    encoding: 'utf8',
    shell: true,
  })
}

// The cold-start "reading 'config'" flake can recur on consecutive runs
// (~50/50 per attempt), so a single retry still leaves ~25% spurious
// pre-push failures. Retry the FLAKE up to MAX_ATTEMPTS; a GENUINE
// assertion failure ("Tests N failed") is never retried — it must block
// the push, exactly as intended.
const MAX_ATTEMPTS = 3
let r
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  r = run()
  process.stdout.write(r.stdout || '')
  process.stderr.write(r.stderr || '')
  if (r.status === 0) break
  const combined = (r.stdout || '') + (r.stderr || '')
  const realTestFailure = /Tests\s+\d+\s+failed/i.test(combined) || /\d+\s+failed\s*\(/i.test(combined)
  const collectionFlake =
    /reading 'config'|failed to access its internal state|Vitest caught|Error: Vitest failed to|worker exited|EPIPE|Failed to initialize/i.test(combined)
  if (realTestFailure || !collectionFlake) break
  if (attempt < MAX_ATTEMPTS) {
    console.error(`\n[redteam] vitest collection/worker-startup flake detected — retry ${attempt} of ${MAX_ATTEMPTS - 1}...\n`)
  }
}

process.exit(r.status ?? 1)
