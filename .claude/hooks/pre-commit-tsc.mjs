/**
 * Pre-commit TypeScript check hook for Claude Code.
 *
 * Intercepts `git commit` commands and runs `npx tsc --noEmit` first.
 * If tsc finds errors, the commit is blocked with the error messages.
 * This ensures Vercel-equivalent strict checking happens locally.
 */
import { execSync } from 'child_process'

let data = ''
process.stdin.on('data', chunk => { data += chunk })
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(data)
    const cmd = input.tool_input?.command || ''

    // Only intercept git commit commands
    if (!cmd.match(/^git commit/)) {
      process.exit(0)
    }

    // Run tsc --noEmit
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe', timeout: 120000 })
      console.log(JSON.stringify({
        systemMessage: 'TypeScript check passed (0 errors)'
      }))
    } catch (e) {
      const stdout = e.stdout?.toString() || ''
      const lines = stdout.split('\n').filter(l => l.includes('error TS'))
      const count = lines.length
      const preview = lines.slice(0, 8).join('\n')

      console.log(JSON.stringify({
        continue: false,
        stopReason: `TypeScript found ${count} error(s) — fix before committing:\n\n${preview}${count > 8 ? `\n... and ${count - 8} more` : ''}`
      }))
    }
  } catch {
    // If we can't parse input, don't block
    process.exit(0)
  }
})
