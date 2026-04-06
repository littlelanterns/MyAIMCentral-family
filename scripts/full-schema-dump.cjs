/**
 * Queries live Supabase to generate a fully accurate schema doc.
 * Uses the OpenAPI spec for column names (works even for empty tables),
 * plus row counts from direct queries.
 *
 * Run: node scripts/full-schema-dump.cjs
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(url, key);

// Tables known to exist but not in PostgREST API schema cache.
// These are real tables accessible from Edge Functions and direct SQL.
const NON_API_TABLES = [
  'ai_credits', 'credit_packs', 'tier_sampling_costs', 'tier_sample_sessions',
  'onboarding_milestones', 'subscription_cancellations', 'optimizer_outputs',
  'user_prompt_templates', 'context_presets', 'family_victory_celebrations',
  // notifications + notification_preferences are now API-exposed (PRD-15 migration 100098)
  'vault_engagement', 'vault_comments', 'vault_comment_reports',
  'vault_moderation_log', 'vault_satisfaction_signals', 'vault_engagement_config',
  'mindsweep_settings', 'mindsweep_holding', 'mindsweep_allowed_senders',
  'mindsweep_events', 'mindsweep_approval_patterns',
  'ai_usage_log', 'platform_usage_log', 'feedback_submissions', 'known_issues',
];

// platform_intelligence schema tables (not queryable via PostgREST)
const PI_TABLES_FROM_MIGRATIONS = {
  'platform_intelligence.book_library (renamed from book_cache)': [
    'id', 'title', 'author', 'isbn', 'genres', 'tags', 'ai_summary', 'toc',
    'chunk_count', 'title_author_embedding', 'ethics_gate_status',
    'extraction_status', 'extraction_count', 'discovered_sections',
    'created_at', 'updated_at'
  ],
  'platform_intelligence.book_chunks': [
    'id', 'book_library_id', 'chunk_index', 'chapter_index', 'chapter_title',
    'text', 'embedding', 'tokens_count', 'created_at'
  ],
  'platform_intelligence.book_extractions': [
    'id', 'book_library_id', 'extraction_type', 'text', 'guided_text', 'independent_text',
    'content_type', 'declaration_text', 'style_variant', 'value_name', 'richness',
    'section_title', 'section_index', 'sort_order', 'audience',
    'is_key_point', 'is_from_go_deeper', 'is_deleted', 'created_at', 'updated_at'
  ],
  'platform_intelligence.prompt_patterns': [
    'id', 'pattern_key', 'pattern_data', 'source_channel', 'approved', 'approved_by', 'created_at'
  ],
  'platform_intelligence.context_effectiveness': [
    'id', 'context_type', 'effectiveness_score', 'sample_size', 'created_at', 'updated_at'
  ],
  'platform_intelligence.edge_case_registry': [
    'id', 'description', 'source_prd', 'metadata', 'created_at'
  ],
  'platform_intelligence.synthesized_principles': [
    'id', 'principle', 'source_patterns', 'approved', 'approved_by', 'created_at'
  ],
  'platform_intelligence.framework_ethics_log': [
    'id', 'framework_name', 'source_book', 'review_status', 'review_notes', 'reviewed_by', 'created_at'
  ],
};

// Domain groupings for readability
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
    'widget_data_points', 'widget_templates',
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

async function main() {
  // Step 1: Fetch OpenAPI spec for column metadata
  process.stdout.write('Fetching OpenAPI spec...');
  const specResp = await fetch(url + '/rest/v1/', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const spec = await specResp.json();
  const defs = spec.definitions || {};
  console.log(` ${Object.keys(defs).length} tables found`);

  // Step 2: Get row counts for tables with data
  const rowCounts = {};
  const allTables = DOMAIN_ORDER.flatMap(d => d.tables);
  for (const t of allTables) {
    if (NON_API_TABLES.includes(t)) {
      rowCounts[t] = '(not API-exposed)';
      continue;
    }
    try {
      const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
      rowCounts[t] = count;
    } catch {
      rowCounts[t] = '?';
    }
  }

  // Step 3: Build markdown
  let md = '# Live Database Schema — MyAIM Central v2\n\n';
  md += `> Auto-generated from live Supabase on ${new Date().toISOString().split('T')[0]}\n`;
  md += `> Script: \`node scripts/full-schema-dump.cjs\`\n`;
  md += `> Column names from OpenAPI spec (accurate for all API-exposed tables)\n`;
  md += `> Row counts from live queries\n\n`;

  let apiExposed = 0;
  let nonApi = 0;

  for (const domain of DOMAIN_ORDER) {
    md += `---\n\n## ${domain.name}${domain.prefix ? ` (${domain.prefix})` : ''}\n\n`;

    for (const table of domain.tables) {
      const def = defs[table];
      const count = rowCounts[table];
      const countStr = typeof count === 'number' ? ` — ${count} rows` : (count === '(not API-exposed)' ? ' — not API-exposed' : '');

      md += `### \`${table}\`${countStr}\n\n`;

      if (NON_API_TABLES.includes(table)) {
        md += '*(exists in DB but not exposed via PostgREST API — accessible from Edge Functions and direct SQL)*\n\n';
        nonApi++;
      } else if (def && def.properties) {
        const cols = Object.keys(def.properties);
        md += '| # | Column |\n|---|---|\n';
        cols.forEach((c, i) => { md += `| ${i + 1} | \`${c}\` |\n`; });
        md += '\n';
        apiExposed++;
      } else {
        md += '*(not found in API schema)*\n\n';
      }
    }
  }

  // Platform Intelligence schema
  md += '---\n\n## Platform Intelligence Schema (`platform_intelligence.*`)\n\n';
  md += '*(Separate PostgreSQL schema — not queryable via PostgREST. Columns from migration files.)*\n\n';

  for (const [table, cols] of Object.entries(PI_TABLES_FROM_MIGRATIONS)) {
    md += `### \`${table}\`\n\n`;
    md += '| # | Column |\n|---|---|\n';
    cols.forEach((c, i) => { md += `| ${i + 1} | \`${c}\` |\n`; });
    md += '\n';
  }

  // Summary
  md += `---\n\n`;
  md += `> **Summary:** ${apiExposed} API-exposed tables with columns | ${nonApi} non-API tables | ${Object.keys(PI_TABLES_FROM_MIGRATIONS).length} platform_intelligence tables\n`;
  md += `>\n`;
  md += `> **Non-API tables** exist in the database but aren't in the PostgREST schema cache. They are accessible from Edge Functions and direct SQL. To expose them via the REST API, add them to the API schema grant.\n`;

  const outPath = path.join(__dirname, '..', 'claude', 'live_schema.md');
  fs.writeFileSync(outPath, md);
  console.log(`\nWritten to claude/live_schema.md`);
  console.log(`  ${apiExposed} API-exposed | ${nonApi} non-API | ${Object.keys(PI_TABLES_FROM_MIGRATIONS).length} platform_intelligence`);
}

main().catch(console.error);
