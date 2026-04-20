/**
 * Queries live Supabase to generate a fully accurate schema doc.
 *
 * Two-pass approach:
 *   Pass 1 — OpenAPI introspection via PostgREST (captures API-exposed tables).
 *            Column names come from the OpenAPI spec; row counts come from
 *            `supabase.from(t).select('*', { count: 'exact', head: true })`.
 *   Pass 2 — Direct SQL against information_schema via `supabase db query
 *            --linked -f <tmp.sql>` (captures migration-only tables, i.e. tables
 *            that exist in the database but are not in the PostgREST schema
 *            cache / API grant). Row counts come from a dynamically built
 *            UNION ALL of COUNT(*) queries. Also captures the
 *            platform_intelligence schema the same way.
 *
 * Run: node scripts/full-schema-dump.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, key);

// Domain groupings for readability. Tables not listed here still appear — either
// under their matching domain if they're API-exposed, or in the catch-all
// "Migration-only tables (uncatalogued)" section at the bottom.
const DOMAIN_ORDER = [
  { name: 'Auth & Family', prefix: 'PRD-01, PRD-02', tables: [
    'families', 'family_members', 'special_adult_assignments', 'member_permissions',
    'staff_permissions', 'view_as_sessions', 'view_as_feature_exclusions', 'permission_presets',
    'access_schedules', 'permission_level_profiles',
  ]},
  { name: 'Subscription & Monetization', prefix: 'PRD-31', tables: [
    'subscription_tiers', 'family_subscriptions', 'feature_key_registry', 'feature_access_v2',
    'member_feature_toggles', 'ai_credits', 'credit_packs', 'tier_sampling_costs',
    'tier_sample_sessions', 'onboarding_milestones', 'subscription_cancellations',
  ]},
  { name: 'LiLa AI System', prefix: 'PRD-05', tables: [
    'lila_conversations', 'lila_messages', 'lila_guided_modes', 'lila_tool_permissions',
    'lila_member_preferences', 'optimizer_outputs', 'user_prompt_templates',
    'context_presets', 'ai_usage_tracking',
  ]},
  { name: 'Personal Growth', prefix: 'PRD-06 to PRD-08', tables: [
    'guiding_stars', 'best_intentions', 'intention_iterations', 'self_knowledge',
    'journal_entries', 'notepad_tabs', 'notepad_extracted_items', 'notepad_routing_stats',
  ]},
  { name: 'Tasks & Studio', prefix: 'PRD-09A, PRD-09B, PRD-17', tables: [
    'task_templates', 'task_template_sections', 'task_template_steps',
    'tasks', 'task_assignments', 'task_completions', 'routine_step_completions',
    'sequential_collections', 'task_claims', 'task_rewards',
    'studio_queue', 'lists', 'list_items', 'list_shares', 'list_templates',
    'guided_form_responses',
  ]},
  { name: 'Dashboards & Calendar', prefix: 'PRD-14 family', tables: [
    'dashboard_configs', 'dashboard_widgets', 'dashboard_widget_folders',
    'widget_data_points', 'widget_templates', 'widget_starter_configs',
    'calendar_events', 'event_attendees', 'event_categories', 'calendar_settings',
    'family_overview_configs',
  ]},
  { name: 'Family Hub', prefix: 'PRD-14D', tables: [
    'family_hub_configs', 'family_best_intentions', 'family_intention_iterations', 'countdowns',
  ]},
  { name: 'Victories', prefix: 'PRD-11', tables: [
    'victories', 'victory_celebrations', 'victory_voice_preferences', 'family_victory_celebrations',
  ]},
  { name: 'Archives & Context', prefix: 'PRD-13', tables: [
    'archive_folders', 'archive_context_items', 'archive_member_settings', 'faith_preferences',
    'context_learning_dismissals',
  ]},
  { name: 'Communication', prefix: 'PRD-15', tables: [
    'conversation_spaces', 'conversation_space_members', 'conversation_threads',
    'messages', 'message_read_status', 'messaging_settings',
    'member_messaging_permissions', 'message_coaching_settings',
    'family_requests', 'notifications', 'notification_preferences',
    'out_of_nest_members',
  ]},
  { name: 'ThoughtSift', prefix: 'PRD-34', tables: [
    'board_personas', 'board_sessions', 'board_session_personas', 'persona_favorites',
    'perspective_lenses', 'decision_frameworks',
  ]},
  { name: 'BookShelf', prefix: 'PRD-23', tables: [
    'bookshelf_items', 'bookshelf_chapters', 'bookshelf_chunks',
    'bookshelf_summaries', 'bookshelf_insights', 'bookshelf_declarations',
    'bookshelf_action_steps', 'bookshelf_questions',
    'bookshelf_discussions', 'bookshelf_discussion_messages',
    'bookshelf_collections', 'bookshelf_collection_items',
    'bookshelf_shares', 'bookshelf_member_settings', 'journal_prompts',
    'bookshelf_user_state',
  ]},
  { name: 'AI Vault', prefix: 'PRD-21A/B/C', tables: [
    'vault_items', 'vault_categories', 'vault_prompt_entries', 'vault_collection_items',
    'vault_user_bookmarks', 'vault_user_progress', 'vault_user_visits',
    'vault_first_sightings', 'vault_tool_sessions', 'vault_copy_events',
    'user_saved_prompts', 'vault_content_requests',
    'vault_engagement', 'vault_comments', 'vault_comment_reports',
    'vault_moderation_log', 'vault_satisfaction_signals', 'vault_engagement_config',
  ]},
  { name: 'Communication Tools', prefix: 'PRD-21', tables: [
    'communication_drafts', 'teaching_skill_history',
  ]},
  { name: 'MindSweep', prefix: 'PRD-17B', tables: [
    'mindsweep_settings', 'mindsweep_holding', 'mindsweep_allowed_senders',
    'mindsweep_events', 'mindsweep_approval_patterns',
  ]},
  { name: 'Infrastructure', prefix: 'PRD-36', tables: [
    'time_sessions', 'timer_configs',
  ]},
  { name: 'Activity, Analytics & Admin', prefix: 'PRD-32', tables: [
    'activity_log_entries', 'ai_usage_log', 'platform_usage_log',
    'feedback_submissions', 'known_issues', 'feature_demand_responses',
  ]},
  { name: 'Platform Assets', prefix: '', tables: [
    'platform_assets',
  ]},
];

/**
 * Run a SQL query against the linked Supabase project via the CLI.
 * Writes SQL to a temp file (to avoid arg-length + quoting headaches on Windows)
 * and parses the JSON response. Returns the `rows` array.
 */
function runSql(sql, label) {
  const tmp = path.join(os.tmpdir(), `schema-dump-${Date.now()}-${Math.random().toString(36).slice(2)}.sql`);
  fs.writeFileSync(tmp, sql);
  try {
    const raw = execFileSync('npx', ['supabase', 'db', 'query', '--linked', '-o', 'json', '-f', tmp], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
    // CLI wraps JSON in an "untrusted data" envelope — extract the outer object.
    // The stdout is already JSON: { boundary, rows, warning }. Parse directly.
    const parsed = JSON.parse(raw);
    if (!parsed.rows) {
      throw new Error(`${label}: no rows in response`);
    }
    return parsed.rows;
  } finally {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
  }
}

async function main() {
  // ----- Pass 1: OpenAPI spec for API-exposed column metadata -----
  process.stdout.write('Pass 1: fetching OpenAPI spec...');
  const specResp = await fetch(url + '/rest/v1/', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const spec = await specResp.json();
  const defs = spec.definitions || {};
  const apiTables = new Set(Object.keys(defs));
  console.log(` ${apiTables.size} API-exposed tables`);

  // ----- Pass 2: information_schema for migration-only tables -----
  process.stdout.write('Pass 2: querying information_schema via supabase db query --linked...');
  const infoRows = runSql(`
SELECT
  t.table_schema,
  t.table_name,
  json_agg(c.column_name ORDER BY c.ordinal_position) AS columns
FROM information_schema.tables t
JOIN information_schema.columns c
  ON c.table_schema = t.table_schema AND c.table_name = t.table_name
WHERE t.table_schema IN ('public', 'platform_intelligence')
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_schema, t.table_name
ORDER BY t.table_schema, t.table_name;
`, 'information_schema dump');
  console.log(` ${infoRows.length} tables discovered`);

  // Index live tables by name (public) and qualified name (platform_intelligence).
  // If the same table_name happens to exist in both schemas, the public one wins
  // for the `publicLiveCols` lookup; platform_intelligence lives in a separate map.
  const publicLiveCols = new Map(); // table_name -> columns[]
  const piLive = new Map();         // "platform_intelligence.<table>" -> columns[]
  for (const r of infoRows) {
    if (r.table_schema === 'public') {
      publicLiveCols.set(r.table_name, r.columns);
    } else if (r.table_schema === 'platform_intelligence') {
      piLive.set(`platform_intelligence.${r.table_name}`, r.columns);
    }
  }

  // ----- Row counts: API-exposed via PostgREST, migration-only via SQL -----
  const rowCounts = {}; // keyed the same as we render: either 'table' or 'schema.table'

  // API-exposed row counts
  const domainTables = DOMAIN_ORDER.flatMap(d => d.tables);
  const apiTablesToCount = new Set([...domainTables, ...apiTables].filter(t => apiTables.has(t)));
  for (const t of apiTablesToCount) {
    try {
      const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
      rowCounts[t] = count ?? 0;
    } catch {
      rowCounts[t] = '?';
    }
  }

  // Row counts for every live public table + every platform_intelligence table —
  // one UNION ALL query. "Migration-only" means live in info_schema but not in the
  // OpenAPI spec; "uncatalogued" means live + API-exposed but not in DOMAIN_ORDER.
  // Both sets need row counts, plus any DOMAIN_ORDER API tables not already
  // counted above (they were, but this is a safety net).
  const migrationOnlyPublic = [...publicLiveCols.keys()].filter(t => !apiTables.has(t));
  const uncataloguedPublic = [...publicLiveCols.keys()]
    .filter(t => apiTables.has(t) && !domainTables.includes(t));
  const piTables = [...piLive.keys()]; // already qualified
  const countTargets = [
    ...migrationOnlyPublic.map(t => ({ qualified: `public.${t}`, key: t })),
    ...uncataloguedPublic.map(t => ({ qualified: `public.${t}`, key: t })),
    ...piTables.map(q => ({ qualified: q, key: q })),
  ].filter((ct, i, arr) => arr.findIndex(x => x.key === ct.key) === i);

  if (countTargets.length > 0) {
    process.stdout.write(`Pass 2b: counting rows on ${countTargets.length} migration-only tables...`);
    const unionSql = countTargets
      .map(ct => `SELECT '${ct.key}' AS k, (SELECT COUNT(*) FROM ${ct.qualified})::bigint AS n`)
      .join('\nUNION ALL\n');
    try {
      const countRows = runSql(unionSql + ';', 'row counts');
      for (const row of countRows) {
        // JSON from CLI may render bigint as string — normalize to number when safe.
        const n = typeof row.n === 'string' ? Number(row.n) : row.n;
        rowCounts[row.k] = Number.isFinite(n) ? n : row.n;
      }
      console.log(' done');
    } catch (e) {
      console.log(` FAILED (${e.message})`);
      for (const ct of countTargets) rowCounts[ct.key] = '?';
    }
  }

  // ----- Build markdown -----
  let md = '# Live Database Schema — MyAIM Central v2\n\n';
  md += `> Auto-generated from live Supabase on ${new Date().toISOString().split('T')[0]}\n`;
  md += `> Script: \`node scripts/full-schema-dump.cjs\`\n`;
  md += `>\n`;
  md += `> **Two-pass capture:**\n`;
  md += `> 1. **API-exposed tables** — columns from the PostgREST OpenAPI spec, row counts via \`supabase-js\` HEAD queries.\n`;
  md += `> 2. **Migration-only tables** — tables that exist in the database but are not in the PostgREST schema cache. Columns and row counts come from direct SQL against \`information_schema\` + dynamic \`COUNT(*)\` via \`supabase db query --linked\`.\n`;
  md += `>\n`;
  md += `> Both \`public\` and \`platform_intelligence\` schemas are captured in pass 2.\n\n`;

  let apiRendered = 0;
  let migRendered = 0;
  let uncataloguedRendered = 0;
  let missingCount = 0;
  const renderedNames = new Set();

  for (const domain of DOMAIN_ORDER) {
    md += `---\n\n## ${domain.name}${domain.prefix ? ` (${domain.prefix})` : ''}\n\n`;

    for (const table of domain.tables) {
      renderedNames.add(table);
      const count = rowCounts[table];
      const def = defs[table];
      const isApi = apiTables.has(table);
      const isLive = publicLiveCols.has(table);

      if (isApi && def && def.properties) {
        const cols = Object.keys(def.properties);
        const countStr = typeof count === 'number' ? ` — ${count} rows` : '';
        md += `### \`${table}\`${countStr}\n\n`;
        md += '| # | Column |\n|---|---|\n';
        cols.forEach((c, i) => { md += `| ${i + 1} | \`${c}\` |\n`; });
        md += '\n';
        apiRendered++;
      } else if (isLive) {
        const cols = publicLiveCols.get(table);
        const countStr = typeof count === 'number' ? ` — ${count} rows` : '';
        md += `### \`${table}\`${countStr} *(migration-only — not API-exposed)*\n\n`;
        md += '| # | Column |\n|---|---|\n';
        cols.forEach((c, i) => { md += `| ${i + 1} | \`${c}\` |\n`; });
        md += '\n';
        migRendered++;
      } else {
        md += `### \`${table}\`\n\n`;
        md += '*(listed in DOMAIN_ORDER but not present in the live database — may have been planned in a PRD but not yet migrated, or dropped/renamed)*\n\n';
        missingCount++;
      }
    }
  }

  // Live public tables not claimed by any DOMAIN_ORDER entry
  const uncataloguedApi = uncataloguedPublic.filter(t => !renderedNames.has(t)).sort();
  const uncataloguedMigOnly = migrationOnlyPublic.filter(t => !renderedNames.has(t)).sort();

  if (uncataloguedApi.length > 0) {
    md += `---\n\n## API-exposed tables (not yet grouped into a domain)\n\n`;
    md += `*Live \`public\` tables that PostgREST exposes but that no DOMAIN_ORDER entry claims. They may belong in an existing section or deserve their own — update \`scripts/full-schema-dump.cjs\` DOMAIN_ORDER to resolve. Columns come from the OpenAPI spec; row counts from live HEAD queries.*\n\n`;
    for (const t of uncataloguedApi) {
      const def = defs[t];
      const cols = def && def.properties ? Object.keys(def.properties) : publicLiveCols.get(t) || [];
      const count = rowCounts[t];
      const countStr = typeof count === 'number' ? ` — ${count} rows` : '';
      md += `### \`${t}\`${countStr}\n\n`;
      md += '| # | Column |\n|---|---|\n';
      cols.forEach((c, i) => { md += `| ${i + 1} | \`${c}\` |\n`; });
      md += '\n';
      uncataloguedRendered++;
    }
  }

  if (uncataloguedMigOnly.length > 0) {
    md += `---\n\n## Migration-only public tables (not API-exposed)\n\n`;
    md += `*Tables that exist in the \`public\` schema but are not in the PostgREST API grant. Accessible from Edge Functions and direct SQL only. Columns and row counts come from \`information_schema\`.*\n\n`;
    for (const t of uncataloguedMigOnly) {
      const cols = publicLiveCols.get(t);
      const count = rowCounts[t];
      const countStr = typeof count === 'number' ? ` — ${count} rows` : '';
      md += `### \`${t}\`${countStr}\n\n`;
      md += '| # | Column |\n|---|---|\n';
      cols.forEach((c, i) => { md += `| ${i + 1} | \`${c}\` |\n`; });
      md += '\n';
      migRendered++;
    }
  }

  // Platform Intelligence schema — now from live information_schema, not hardcoded.
  md += `---\n\n## Platform Intelligence Schema (\`platform_intelligence.*\`)\n\n`;
  md += `*Separate PostgreSQL schema — not queryable via PostgREST. Columns and row counts come from \`information_schema\`.*\n\n`;
  const piSorted = [...piLive.keys()].sort();
  for (const qualified of piSorted) {
    const cols = piLive.get(qualified);
    const count = rowCounts[qualified];
    const countStr = typeof count === 'number' ? ` — ${count} rows` : '';
    md += `### \`${qualified}\`${countStr}\n\n`;
    md += '| # | Column |\n|---|---|\n';
    cols.forEach((c, i) => { md += `| ${i + 1} | \`${c}\` |\n`; });
    md += '\n';
  }

  // Summary
  md += `---\n\n`;
  md += `> **Summary:** ${apiRendered} API-exposed tables in domain sections | ${uncataloguedRendered} API-exposed but uncatalogued | ${migRendered} migration-only (\`public\`) tables | ${piSorted.length} \`platform_intelligence\` tables`;
  if (missingCount > 0) md += ` | ${missingCount} DOMAIN_ORDER entries missing from live database`;
  md += `\n>\n`;
  md += `> **Migration-only tables** exist in the database but aren't in the PostgREST schema cache. They are accessible from Edge Functions and direct SQL. To expose them via the REST API, add the schema/table to the API grant.\n`;
  md += `>\n`;
  md += `> **DOMAIN_ORDER missing entries** are tables that \`scripts/full-schema-dump.cjs\` expects to see but that don't exist in the live database. Most common cause: the owning PRD was planned but the migration hasn't been built yet. Each is flagged inline in its domain section.\n`;

  const outPath = path.join(__dirname, '..', 'claude', 'live_schema.md');
  fs.writeFileSync(outPath, md);
  console.log(`\nWritten to claude/live_schema.md`);
  console.log(`  ${apiRendered} API-exposed in domain | ${uncataloguedRendered} API-uncatalogued | ${migRendered} migration-only | ${piSorted.length} platform_intelligence | ${missingCount} missing`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
