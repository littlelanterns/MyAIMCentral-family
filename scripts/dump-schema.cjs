/**
 * Generates claude/live_schema.md from the live Supabase database.
 * Run: node scripts/dump-schema.js
 *
 * This queries every known table and lists its actual columns.
 * The output is the AUTHORITATIVE schema reference — always accurate
 * because it reads directly from the database, not from documentation.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

// All known tables (add new ones as they're created)
const ALL_TABLES = [
  // Auth & Family
  'families', 'family_members', 'special_adult_assignments', 'member_permissions',
  'staff_permissions', 'view_as_sessions', 'permission_presets', 'access_schedules',
  'permission_level_profiles',
  // Subscription
  'subscription_tiers', 'family_subscriptions', 'feature_key_registry', 'feature_access_v2',
  'member_feature_toggles', 'ai_credits', 'credit_packs', 'tier_sampling_costs',
  'tier_sample_sessions', 'onboarding_milestones', 'subscription_cancellations',
  // LiLa AI
  'lila_conversations', 'lila_messages', 'lila_guided_modes', 'lila_tool_permissions',
  'lila_member_preferences', 'optimizer_outputs', 'user_prompt_templates',
  'context_presets', 'ai_usage_tracking',
  // Personal Growth
  'guiding_stars', 'best_intentions', 'intention_iterations', 'self_knowledge',
  'journal_entries', 'notepad_tabs', 'notepad_extracted_items', 'notepad_routing_stats',
  // Tasks
  'task_templates', 'task_template_sections', 'task_template_steps',
  'tasks', 'task_assignments', 'task_completions', 'routine_step_completions',
  'sequential_collections', 'task_claims', 'task_rewards',
  // Lists & Studio
  'studio_queue', 'lists', 'list_items', 'list_shares', 'list_templates',
  'guided_form_responses',
  // Dashboards
  'dashboard_configs',
  // Victories
  'victories', 'victory_celebrations', 'victory_voice_preferences',
  // Archives
  'archive_folders', 'archive_context_items', 'archive_member_settings', 'faith_preferences',
  // Communication
  'out_of_nest_members',
  // Infrastructure
  'time_sessions', 'timer_configs',
  // Activity & Analytics
  'activity_log_entries', 'ai_usage_tracking',
  // Platform
  'platform_assets',
];

async function main() {
  const schema = {};
  let errors = 0;

  for (const t of ALL_TABLES) {
    try {
      const { data } = await supabase.from(t).select('*').limit(1);
      if (data && data.length > 0) {
        schema[t] = Object.keys(data[0]);
      } else {
        schema[t] = [];
      }
    } catch (e) {
      schema[t] = null;
      errors++;
    }
  }

  // Format as markdown
  let md = '# Live Database Schema — MyAIM Central v2\n\n';
  md += `> Auto-generated from live Supabase instance on ${new Date().toISOString().split('T')[0]}\n`;
  md += '> Regenerate: `node scripts/dump-schema.js`\n';
  md += `> Tables found: ${Object.values(schema).filter(v => v !== null).length} / ${ALL_TABLES.length}\n\n`;

  for (const [table, cols] of Object.entries(schema)) {
    md += `## \`${table}\`\n\n`;
    if (cols === null) {
      md += '*(table not found — may not exist yet)*\n';
    } else if (cols.length === 0) {
      md += '*(empty table — columns exist but no sample row)*\n';
    } else {
      md += '| # | Column |\n|---|---|\n';
      cols.forEach((c, i) => { md += `| ${i + 1} | \`${c}\` |\n`; });
    }
    md += '\n';
  }

  const outPath = path.join(__dirname, '..', 'claude', 'live_schema.md');
  fs.writeFileSync(outPath, md);
  console.log(`Written to claude/live_schema.md — ${Object.keys(schema).length} tables (${errors} errors)`);
}

main().catch(console.error);
