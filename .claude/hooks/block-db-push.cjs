#!/usr/bin/env node
// Project guardrail (2026-07-10): block `supabase db push` in every Claude session.
//
// WHY: ~22 production migrations were applied via the one-file method
// (`supabase db query --linked -f <file>`) and are NOT recorded in Supabase's
// migration-history ledger. A naive `db push` would replay all of them against
// production. They're idempotent, but this is a landmine nobody should step on
// by accident. See CURRENT.md founder item "repair history".
//
// LIFTING THE GUARDRAIL: run the repair-history ledger reconcile, then remove
// this hook entry from .claude/settings.json and delete this file.
//
// Wired as a PreToolUse hook (matcher: Bash|PowerShell) in .claude/settings.json.
let data = '';
process.stdin.on('data', (c) => (data += c));
process.stdin.on('end', () => {
  let command = '';
  try {
    const input = JSON.parse(data);
    command = (input.tool_input && input.tool_input.command) || '';
  } catch {
    // Unparseable input: do nothing (allow) — this hook only ever denies on a
    // positive match, never on its own failure.
    return;
  }
  if (/\bdb\s+push\b/i.test(command)) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'deny',
          permissionDecisionReason:
            'BLOCKED by project guardrail: `supabase db push` applies EVERY unapplied local migration file at once — with parallel sessions authoring migrations, that would apply other lanes\' not-yet-founder-approved migrations. Apply YOUR migration only, with `supabase db query --linked -f <file>` (idempotent SQL), then keep the ledger honest with `supabase migration repair --status applied <version> --linked`. FALSE POSITIVE? (a commit message or echo merely MENTIONING the phrase): reword the prose to "db-push" (hyphenated) and retry — the hook deliberately stays broad because quoting context cannot be parsed safely.',
        },
      }),
    );
  }
});
