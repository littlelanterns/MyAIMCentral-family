#!/usr/bin/env node
/**
 * BookShelf Migration: StewardShip v1 → MyAIM Family v2
 * Phase B+C: Direct database-to-database migration
 *
 * Run: node scripts/bookshelf-migrate.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');

// ============================================================
// Configuration
// ============================================================
const FOUNDER_FAMILY_ID = 'e28051fb-db40-458a-88b0-d85c880b1153';
const FOUNDER_MEMBER_ID = '4741c7c2-c0b5-4a8a-b90e-280dc63c3dbf';
// v1: Supabase client with service_role key (bypasses RLS)
const v1 = createClient(process.env.STEWARDSHIP_SUPABASE_URL, process.env.STEWARDSHIP_SERVICE_ROLE_KEY);

// v2: Supabase client with service_role key (bypasses RLS)
const v2 = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Lookup maps
const itemIdMap = new Map();    // v1 manifest_item_id → v2 bookshelf_item_id
const cacheIdMap = new Map();   // v1 manifest_item_id → v2 book_cache_id
const frameworkMap = new Map(); // v1 framework_id → { manifest_item_id, tags }
const collectionIdMap = new Map(); // v1 collection_id → v2 collection_id

// ============================================================
// Content type normalization
// ============================================================
const VALID_SUMMARY_TYPES = new Set(['key_concept', 'story', 'metaphor', 'lesson', 'quote', 'insight', 'theme', 'character_insight', 'exercise', 'principle']);
const VALID_ACTION_TYPES = new Set(['exercise', 'practice', 'habit', 'conversation_starter', 'project', 'daily_action', 'weekly_practice']);
const VALID_QUESTION_TYPES = new Set(['reflection', 'implementation', 'recognition', 'self_examination', 'discussion', 'scenario']);
const VALID_STYLES = new Set(['choosing_committing', 'recognizing_awakening', 'claiming_stepping_into', 'learning_striving', 'resolute_unashamed']);

function normalizeSummaryType(ct) {
  if (VALID_SUMMARY_TYPES.has(ct)) return ct;
  if (ct === 'narrative_summary') return 'insight';
  if (ct === 'framework') return 'principle';
  if (ct === 'thematic_insight') return 'insight';
  return 'insight';
}

function normalizeActionType(ct) {
  if (VALID_ACTION_TYPES.has(ct)) return ct;
  return 'exercise';
}

function normalizeStyle(style) {
  if (!style) return 'choosing_committing';
  if (VALID_STYLES.has(style)) return style;
  const map = {
    'Choosing & Committing': 'choosing_committing',
    'Learning & Striving': 'learning_striving',
    'Recognizing & Awakening': 'recognizing_awakening',
    'Claiming & Stepping Into': 'claiming_stepping_into',
    'Resolute & Unashamed': 'resolute_unashamed',
    'stepping_into': 'claiming_stepping_into',
  };
  return map[style] || 'choosing_committing';
}

function uuid() { return crypto.randomUUID(); }

function dedupeTags(a, b) {
  return [...new Set([...(a || []), ...(b || [])])];
}

// ============================================================
// Batch insert helper
// ============================================================
async function batchInsert(table, rows, batchSize = 500) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await v2.from(table).insert(batch);
    if (error) {
      console.error(`ERROR inserting into ${table} at offset ${i}:`, error.message);
      console.error('First failing row:', JSON.stringify(batch[0], null, 2));
      throw error;
    }
    inserted += batch.length;
  }
  return inserted;
}

// ============================================================
// Step 1: Read source data
// ============================================================
const V1_USER_ID = '082b18e3-f2c4-4411-a5b6-8435e3b36e56';

// Helper: paginated read from v1 via Supabase client
async function v1ReadAll(table, select, filters = {}, orderBy = 'created_at') {
  const all = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    let q = v1.from(table).select(select).eq('user_id', V1_USER_ID);
    for (const [k, v] of Object.entries(filters)) {
      if (v === null) q = q.is(k, null);
      else q = q.eq(k, v);
    }
    q = q.order(orderBy).range(page * pageSize, (page + 1) * pageSize - 1);
    const { data, error } = await q;
    if (error) throw new Error(`Error reading ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    page++;
    if (data.length < pageSize) break;
  }
  return all;
}

async function readSourceData() {
  console.log('\n=== Step 1: Reading source data from StewardShip ===');
  console.log(`  Filtering by user_id: ${V1_USER_ID}`);

  // Read manifest_items (without text_content)
  const allItems = await v1ReadAll('manifest_items',
    'id, title, author, isbn, file_type, file_name, file_size_bytes, genres, tags, folder_group, processing_status, extraction_status, chunk_count, intake_completed, ai_summary, toc, discovered_sections, parent_manifest_item_id, part_number, part_count, last_viewed_at, archived_at, created_at, updated_at'
  );
  console.log(`  Read ${allItems.length} manifest_items`);

  // Read ai_frameworks
  const allFrameworks = await v1ReadAll('ai_frameworks',
    'id, manifest_item_id, name, tags',
    { archived_at: null }
  );
  console.log(`  Read ${allFrameworks.length} ai_frameworks`);

  // Build framework lookup
  for (const fw of allFrameworks) {
    frameworkMap.set(fw.id, { manifest_item_id: fw.manifest_item_id, tags: fw.tags || [] });
  }

  return allItems;
}

// ============================================================
// Step 2: Create book_cache records
// ============================================================
async function createBookCache(items) {
  console.log('\n=== Step 2: Creating book_cache records ===');

  // Build a framework lookup by manifest_item_id for tag merging
  const fwByItem = new Map();
  for (const [fwId, fw] of frameworkMap) {
    fwByItem.set(fw.manifest_item_id, fw.tags);
  }

  const cacheRows = items.map(item => {
    const id = uuid();
    cacheIdMap.set(item.id, id);
    const mergedTags = dedupeTags(item.tags, fwByItem.get(item.id));
    return {
      id,
      title: item.title,
      author: item.author,
      isbn: item.isbn,
      genres: item.genres || [],
      tags: mergedTags,
      ai_summary: item.ai_summary,
      toc: item.toc,
      chunk_count: item.chunk_count || 0,
      ethics_gate_status: 'exempt',
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  });

  const count = await batchInsert('book_cache', cacheRows, 100);
  // Note: book_cache is in platform_intelligence schema, but Supabase client
  // uses the public schema by default. Need to use the schema option or rpc.
  console.log(`  Created ${count} book_cache records`);
  return count;
}

// ============================================================
// Step 3: Create bookshelf_items records (without text_content)
// ============================================================
async function createBookshelfItems(items) {
  console.log('\n=== Step 3: Creating bookshelf_items records ===');

  const fwByItem = new Map();
  for (const [fwId, fw] of frameworkMap) {
    fwByItem.set(fw.manifest_item_id, fw.tags);
  }

  const itemRows = items.map(item => {
    const id = uuid();
    itemIdMap.set(item.id, id);
    const mergedTags = dedupeTags(item.tags, fwByItem.get(item.id));
    return {
      id,
      family_id: FOUNDER_FAMILY_ID,
      uploaded_by_member_id: FOUNDER_MEMBER_ID,
      title: item.title,
      author: item.author,
      isbn: item.isbn,
      file_type: item.file_type || 'pdf',
      file_name: item.file_name,
      text_content: null,
      file_size_bytes: item.file_size_bytes,
      genres: item.genres || [],
      tags: mergedTags,
      folder_group: item.folder_group,
      processing_status: 'completed',
      extraction_status: item.extraction_status || 'none',
      chunk_count: item.chunk_count || 0,
      intake_completed: item.intake_completed || false,
      ai_summary: item.ai_summary,
      toc: item.toc,
      discovered_sections: item.discovered_sections,
      book_cache_id: cacheIdMap.get(item.id),
      parent_bookshelf_item_id: null, // resolved in step 4
      part_number: item.part_number,
      part_count: item.part_count,
      last_viewed_at: item.last_viewed_at,
      archived_at: item.archived_at,
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  });

  const count = await batchInsert('bookshelf_items', itemRows, 100);
  console.log(`  Created ${count} bookshelf_items records`);
  return count;
}

// ============================================================
// Step 4: Resolve multi-part parent references
// ============================================================
async function resolveParentRefs(items) {
  console.log('\n=== Step 4: Resolving multi-part parent references ===');
  let resolved = 0;

  for (const item of items) {
    if (item.parent_manifest_item_id) {
      const v2ItemId = itemIdMap.get(item.id);
      const v2ParentId = itemIdMap.get(item.parent_manifest_item_id);
      if (v2ItemId && v2ParentId) {
        const { error } = await v2.from('bookshelf_items')
          .update({ parent_bookshelf_item_id: v2ParentId })
          .eq('id', v2ItemId);
        if (error) {
          console.error(`Error resolving parent for ${item.id}:`, error.message);
        } else {
          resolved++;
        }
      }
    }
  }

  console.log(`  Resolved ${resolved} parent references`);
  return resolved;
}

// ============================================================
// Step 5: Migrate extraction tables (sequential in this script)
// ============================================================

async function migrateChunks() {
  console.log('\n=== Migrating chunks (58K+ rows) ===');
  let total = 0;
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await v1.from('manifest_chunks')
      .select('id, manifest_item_id, chunk_index, chunk_text, token_count, metadata, created_at')
      .eq('user_id', V1_USER_ID)
      .order('manifest_item_id')
      .order('chunk_index')
      .range(offset, offset + batchSize - 1);

    if (error) { console.error('Error reading chunks:', error.message); throw error; }
    if (!data || data.length === 0) break;

    const rows = [];
    for (const chunk of data) {
      const bookCacheId = cacheIdMap.get(chunk.manifest_item_id);
      if (!bookCacheId) continue; // skip orphaned chunks

      const meta = chunk.metadata || {};
      rows.push({
        id: uuid(),
        book_cache_id: bookCacheId,
        chunk_index: chunk.chunk_index,
        chunk_text: chunk.chunk_text,
        token_count: chunk.token_count,
        chapter_title: meta.chapter_title || meta.section_title || null,
        chapter_index: meta.chapter_index != null ? meta.chapter_index : (meta.section_index != null ? meta.section_index : null),
        embedding: null,
        metadata: chunk.metadata || {},
        created_at: chunk.created_at,
      });
    }

    if (rows.length > 0) {
      await batchInsert('bookshelf_chunks', rows, 1000);
    }

    total += data.length;
    if (total % 5000 === 0 || data.length < batchSize) {
      console.log(`  Chunks: ${total} migrated`);
    }

    if (data.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`  Chunks complete: ${total} total`);
  return total;
}

async function migrateSummaries() {
  console.log('\n=== Migrating summaries ===');
  let total = 0;
  let offset = 0;
  const batchSize = 500;

  while (true) {
    const { data, error } = await v1.from('manifest_summaries')
      .select('id, manifest_item_id, section_title, section_index, content_type, text, sort_order, audience, created_at')
      .eq('user_id', V1_USER_ID)
      .eq('is_deleted', false)
      .order('manifest_item_id')
      .order('sort_order')
      .range(offset, offset + batchSize - 1);

    if (error) { console.error('Error reading summaries:', error.message); throw error; }
    if (!data || data.length === 0) break;

    const rows = data.map(s => ({
      id: uuid(),
      family_id: FOUNDER_FAMILY_ID,
      family_member_id: FOUNDER_MEMBER_ID,
      bookshelf_item_id: itemIdMap.get(s.manifest_item_id),
      section_title: s.section_title,
      section_index: s.section_index,
      content_type: normalizeSummaryType(s.content_type),
      text: s.text,
      sort_order: s.sort_order || 0,
      audience: s.audience || 'original',
      is_key_point: false,
      is_hearted: false,
      is_deleted: false,
      is_from_go_deeper: false,
      user_note: null,
      is_included_in_ai: true,
      embedding: null,
      created_at: s.created_at,
    })).filter(r => r.bookshelf_item_id); // skip orphans

    if (rows.length > 0) {
      await batchInsert('bookshelf_summaries', rows, 500);
    }

    total += data.length;
    if (total % 5000 === 0 || data.length < batchSize) {
      console.log(`  Summaries: ${total} migrated`);
    }

    if (data.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`  Summaries complete: ${total} total`);
  return total;
}

async function migrateInsights() {
  console.log('\n=== Migrating insights (from ai_framework_principles) ===');
  let total = 0;
  let offset = 0;
  const batchSize = 500;

  while (true) {
    const { data, error } = await v1.from('ai_framework_principles')
      .select('id, framework_id, text, section_title, sort_order, is_included, created_at, updated_at')
      .eq('user_id', V1_USER_ID)
      .is('archived_at', null)
      .order('framework_id')
      .order('sort_order')
      .range(offset, offset + batchSize - 1);

    if (error) { console.error('Error reading principles:', error.message); throw error; }
    if (!data || data.length === 0) break;

    const rows = [];
    for (const p of data) {
      const fw = frameworkMap.get(p.framework_id);
      if (!fw) continue;
      const bookItemId = itemIdMap.get(fw.manifest_item_id);
      if (!bookItemId) continue;

      rows.push({
        id: uuid(),
        family_id: FOUNDER_FAMILY_ID,
        family_member_id: FOUNDER_MEMBER_ID,
        bookshelf_item_id: bookItemId,
        section_title: p.section_title,
        section_index: null,
        content_type: 'principle',
        text: p.text,
        sort_order: p.sort_order || 0,
        audience: 'original',
        is_key_point: false,
        is_user_added: false,
        is_hearted: false,
        is_deleted: false,
        is_from_go_deeper: false,
        user_note: null,
        is_included_in_ai: p.is_included !== false,
        embedding: null,
        created_at: p.created_at,
        updated_at: p.updated_at || p.created_at,
      });
    }

    if (rows.length > 0) {
      await batchInsert('bookshelf_insights', rows, 500);
    }

    total += data.length;
    if (total % 5000 === 0 || data.length < batchSize) {
      console.log(`  Insights: ${total} migrated`);
    }

    if (data.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`  Insights complete: ${total} total`);
  return total;
}

async function migrateDeclarations() {
  console.log('\n=== Migrating declarations ===');
  let total = 0;
  let offset = 0;
  const batchSize = 500;

  while (true) {
    const { data, error } = await v1.from('manifest_declarations')
      .select('id, manifest_item_id, section_title, declaration_text, declaration_style, sort_order, audience, created_at')
      .eq('user_id', V1_USER_ID)
      .eq('is_deleted', false)
      .order('manifest_item_id')
      .order('sort_order')
      .range(offset, offset + batchSize - 1);

    if (error) { console.error('Error reading declarations:', error.message); throw error; }
    if (!data || data.length === 0) break;

    const rows = data.map(d => ({
      id: uuid(),
      family_id: FOUNDER_FAMILY_ID,
      family_member_id: FOUNDER_MEMBER_ID,
      bookshelf_item_id: itemIdMap.get(d.manifest_item_id),
      section_title: d.section_title,
      section_index: null,
      value_name: null,
      declaration_text: d.declaration_text,
      style_variant: normalizeStyle(d.declaration_style),
      richness: null,
      sort_order: d.sort_order || 0,
      audience: d.audience || 'original',
      is_key_point: false,
      is_hearted: false,
      is_deleted: false,
      is_from_go_deeper: false,
      sent_to_guiding_stars: false,
      guiding_star_id: null,
      user_note: null,
      is_included_in_ai: true,
      embedding: null,
      created_at: d.created_at,
    })).filter(r => r.bookshelf_item_id);

    if (rows.length > 0) {
      await batchInsert('bookshelf_declarations', rows, 500);
    }

    total += data.length;
    if (total % 5000 === 0 || data.length < batchSize) {
      console.log(`  Declarations: ${total} migrated`);
    }

    if (data.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`  Declarations complete: ${total} total`);
  return total;
}

async function migrateActionStepsAndQuestions() {
  console.log('\n=== Migrating action steps + questions ===');

  // Part A: Read all action_steps (paginated)
  const allActionSteps = await v1ReadAll('manifest_action_steps',
    'id, manifest_item_id, section_title, section_index, content_type, text, sort_order, audience, created_at',
    { is_deleted: false }
  );
  console.log(`  Read ${allActionSteps.length} action_steps from v1`);

  // Split reflection_prompts from action steps
  const reflectionPrompts = allActionSteps.filter(a => a.content_type === 'reflection_prompt');
  const realActions = allActionSteps.filter(a => a.content_type !== 'reflection_prompt');
  console.log(`  Split: ${realActions.length} actions, ${reflectionPrompts.length} reflection_prompts → questions`);

  // Part B: Read all questions (paginated)
  const allQuestions = await v1ReadAll('manifest_questions',
    'id, manifest_item_id, section_title, section_index, content_type, text, sort_order, audience, created_at',
    { is_deleted: false }
  );
  console.log(`  Read ${allQuestions.length} questions from v1`);

  // Insert action steps
  const actionRows = realActions.map(a => ({
    id: uuid(),
    family_id: FOUNDER_FAMILY_ID,
    family_member_id: FOUNDER_MEMBER_ID,
    bookshelf_item_id: itemIdMap.get(a.manifest_item_id),
    section_title: a.section_title,
    section_index: a.section_index,
    content_type: normalizeActionType(a.content_type),
    text: a.text,
    sort_order: a.sort_order || 0,
    audience: a.audience || 'original',
    is_key_point: false,
    is_hearted: false,
    is_deleted: false,
    is_from_go_deeper: false,
    sent_to_tasks: false,
    task_id: null,
    user_note: null,
    is_included_in_ai: true,
    embedding: null,
    created_at: a.created_at,
  })).filter(r => r.bookshelf_item_id);

  const actionCount = await batchInsert('bookshelf_action_steps', actionRows, 500);
  console.log(`  Inserted ${actionCount} action_steps`);

  // Combine reclassified reflection_prompts + original questions
  const questionRows = [
    ...reflectionPrompts.map(q => ({
      id: uuid(),
      family_id: FOUNDER_FAMILY_ID,
      family_member_id: FOUNDER_MEMBER_ID,
      bookshelf_item_id: itemIdMap.get(q.manifest_item_id),
      section_title: q.section_title,
      section_index: q.section_index,
      content_type: 'reflection', // reclassified
      text: q.text,
      sort_order: q.sort_order || 0,
      audience: q.audience || 'original',
      is_key_point: false,
      is_hearted: false,
      is_deleted: false,
      is_from_go_deeper: false,
      sent_to_prompts: false,
      journal_prompt_id: null,
      sent_to_tasks: false,
      task_id: null,
      user_note: null,
      is_included_in_ai: true,
      embedding: null,
      created_at: q.created_at,
    })),
    ...allQuestions.map(q => ({
      id: uuid(),
      family_id: FOUNDER_FAMILY_ID,
      family_member_id: FOUNDER_MEMBER_ID,
      bookshelf_item_id: itemIdMap.get(q.manifest_item_id),
      section_title: q.section_title,
      section_index: q.section_index,
      content_type: VALID_QUESTION_TYPES.has(q.content_type) ? q.content_type : 'reflection',
      text: q.text,
      sort_order: q.sort_order || 0,
      audience: q.audience || 'original',
      is_key_point: false,
      is_hearted: false,
      is_deleted: false,
      is_from_go_deeper: false,
      sent_to_prompts: false,
      journal_prompt_id: null,
      sent_to_tasks: false,
      task_id: null,
      user_note: null,
      is_included_in_ai: true,
      embedding: null,
      created_at: q.created_at,
    })),
  ].filter(r => r.bookshelf_item_id);

  const questionCount = await batchInsert('bookshelf_questions', questionRows, 500);
  console.log(`  Inserted ${questionCount} questions`);

  return { actionCount, questionCount };
}

// ============================================================
// Step 6: Migrate text_content (heavy)
// ============================================================
async function migrateTextContent(items) {
  console.log('\n=== Step 6: Migrating text_content (heavy column) ===');
  let migrated = 0;
  const batchSize = 5;

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const ids = batch.map(b => b.id);

    // Read text_content from v1
    const { data, error } = await v1.from('manifest_items')
      .select('id, text_content')
      .in('id', ids);
    if (error) { console.error('Error reading text_content:', error.message); throw error; }

    for (const row of (data || [])) {
      if (!row.text_content) continue;
      const v2Id = itemIdMap.get(row.id);
      if (!v2Id) continue;

      const { error: ue } = await v2.from('bookshelf_items')
        .update({ text_content: row.text_content })
        .eq('id', v2Id);

      if (ue) {
        console.error(`Error updating text_content for ${row.id}:`, ue.message);
      } else {
        migrated++;
      }
    }

    if (migrated % 50 === 0 || i + batchSize >= items.length) {
      console.log(`  Text content: ${migrated} of ${items.length} books`);
    }
  }

  console.log(`  Text content complete: ${migrated} books`);
  return migrated;
}

// ============================================================
// Step 7: Migrate collections
// ============================================================
async function migrateCollections() {
  console.log('\n=== Step 7: Migrating collections ===');

  const { data: collections, error: ce } = await v1.from('manifest_collections')
    .select('id, name, description, created_at')
    .eq('user_id', V1_USER_ID);
  if (ce) { console.error('Error reading collections:', ce.message); throw ce; }
  if (!collections || collections.length === 0) {
    console.log('  No collections found');
    return 0;
  }

  const colRows = collections.map(c => {
    const id = uuid();
    collectionIdMap.set(c.id, id);
    return {
      id,
      family_id: FOUNDER_FAMILY_ID,
      created_by_member_id: FOUNDER_MEMBER_ID,
      name: c.name,
      description: c.description,
      sort_order: 0,
      created_at: c.created_at,
    };
  });

  await batchInsert('bookshelf_collections', colRows, 100);
  console.log(`  Created ${colRows.length} collections`);

  // Collection items - read items for our collections
  const colIds = collections.map(c => c.id);
  const { data: colItems, error: cie } = await v1.from('manifest_collection_items')
    .select('collection_id, manifest_item_id, sort_order')
    .in('collection_id', colIds);
  if (cie) { console.error('Error reading collection items:', cie.message); throw cie; }
  if (!colItems || colItems.length === 0) {
    console.log('  No collection items');
    return colRows.length;
  }

  const ciRows = colItems.map(ci => ({
    id: uuid(),
    collection_id: collectionIdMap.get(ci.collection_id),
    bookshelf_item_id: itemIdMap.get(ci.manifest_item_id),
    sort_order: ci.sort_order || 0,
  })).filter(r => r.collection_id && r.bookshelf_item_id);

  await batchInsert('bookshelf_collection_items', ciRows, 100);
  console.log(`  Created ${ciRows.length} collection items`);

  return colRows.length;
}

// ============================================================
// Step 8: Create member settings
// ============================================================
async function createMemberSettings() {
  console.log('\n=== Step 9: Creating member settings ===');
  const { error } = await v2.from('bookshelf_member_settings').insert({
    family_id: FOUNDER_FAMILY_ID,
    family_member_id: FOUNDER_MEMBER_ID,
  });
  if (error && !error.message.includes('duplicate')) {
    console.error('Error creating member settings:', error.message);
  } else {
    console.log('  Created bookshelf_member_settings for founder');
  }
}

// ============================================================
// Verification
// ============================================================
async function verify() {
  console.log('\n=== Verification ===');

  // book_cache via SQL (not exposed via PostgREST)
  try {
    const bcResult = execSync('npx supabase db query --linked "SELECT count(*) as cnt FROM platform_intelligence.book_cache"', { stdio: 'pipe', timeout: 30000 }).toString();
    const bcMatch = bcResult.match(/"cnt"\s*:\s*"?(\d+)"?/);
    console.log(`  book_cache count: expected 578, actual ${bcMatch ? bcMatch[1] : 'parse error'}`);
  } catch (e) { console.log('  book_cache count: ERROR', e.message); }

  const checks = [
    { name: 'bookshelf_items count', table: 'bookshelf_items', expected: 578 },
    { name: 'bookshelf_chunks count', table: 'bookshelf_chunks', expected: '~58115' },
    { name: 'bookshelf_summaries count', table: 'bookshelf_summaries', expected: '~21693' },
    { name: 'bookshelf_insights count', table: 'bookshelf_insights', expected: '~24159' },
    { name: 'bookshelf_declarations count', table: 'bookshelf_declarations', expected: '~17035' },
    { name: 'bookshelf_action_steps count', table: 'bookshelf_action_steps', expected: '~16228' },
    { name: 'bookshelf_questions count', table: 'bookshelf_questions', expected: '~9952' },
    { name: 'bookshelf_collections count', table: 'bookshelf_collections', expected: 15 },
    { name: 'bookshelf_collection_items', table: 'bookshelf_collection_items', expected: 85 },
  ];

  for (const check of checks) {
    const { count, error } = await v2.from(check.table).select('*', { count: 'exact', head: true });
    console.log(`  ${check.name}: expected ${check.expected}, actual ${count}${error ? ' ERROR: ' + error.message : ''}`);
  }

  // Check for null FKs
  for (const table of ['bookshelf_summaries', 'bookshelf_insights', 'bookshelf_declarations', 'bookshelf_action_steps', 'bookshelf_questions']) {
    const { count } = await v2.from(table).select('*', { count: 'exact', head: true }).is('bookshelf_item_id', null);
    console.log(`  ${table} null bookshelf_item_id: ${count} (should be 0)`);
  }

  // Check chunks null book_cache_id
  const { count: nullCache } = await v2.from('bookshelf_chunks').select('*', { count: 'exact', head: true }).is('book_cache_id', null);
  console.log(`  bookshelf_chunks null book_cache_id: ${nullCache} (should be 0)`);

  // Check text_content
  const { count: textCount } = await v2.from('bookshelf_items').select('*', { count: 'exact', head: true }).not('text_content', 'is', null);
  console.log(`  bookshelf_items with text_content: ${textCount} (should be 578)`);

  // Check style_variant validity
  const { data: badStyles } = await v2.from('bookshelf_declarations')
    .select('style_variant')
    .not('style_variant', 'in', '("choosing_committing","recognizing_awakening","claiming_stepping_into","learning_striving","resolute_unashamed")')
    .limit(5);
  console.log(`  Invalid style_variants: ${badStyles?.length || 0} (should be 0)`);

  // Check no reflection_prompts in action_steps
  const { count: reflInActions } = await v2.from('bookshelf_action_steps').select('*', { count: 'exact', head: true }).eq('content_type', 'reflection_prompt');
  console.log(`  reflection_prompt in action_steps: ${reflInActions} (should be 0)`);
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('========================================');
  console.log('BookShelf Migration: StewardShip → MyAIM v2');
  console.log('========================================');
  console.log(`Founder: family_id=${FOUNDER_FAMILY_ID}, member_id=${FOUNDER_MEMBER_ID}`);

  try {
    // Step 1: Read source data
    const items = await readSourceData();

    // Step 2: Create book_cache via SQL (platform_intelligence schema not exposed via PostgREST)
    console.log('\n=== Step 2: Creating book_cache records (via SQL) ===');
    const fwByItem = new Map();
    for (const [fwId, fw] of frameworkMap) {
      fwByItem.set(fw.manifest_item_id, fw.tags);
    }

    // Build ID map first
    for (const item of items) {
      cacheIdMap.set(item.id, uuid());
    }

    // Generate SQL in batches and execute via CLI
    let bookCacheCount = 0;
    const sqlBatchSize = 50;
    for (let i = 0; i < items.length; i += sqlBatchSize) {
      const batch = items.slice(i, i + sqlBatchSize);
      const values = batch.map(item => {
        const id = cacheIdMap.get(item.id);
        const mergedTags = dedupeTags(item.tags, fwByItem.get(item.id));
        const esc = (s) => s ? s.replace(/'/g, "''") : null;
        const arrLit = (a) => `ARRAY[${(a || []).map(t => `'${esc(t)}'`).join(',')}]::text[]`;
        const tsLit = (t) => t ? `'${t}'::timestamptz` : 'now()';
        const jsonLit = (j) => j ? `'${JSON.stringify(j).replace(/'/g, "''")}'::jsonb` : 'NULL';
        return `('${id}', '${esc(item.title)}', ${item.author ? `'${esc(item.author)}'` : 'NULL'}, ${item.isbn ? `'${esc(item.isbn)}'` : 'NULL'}, ${arrLit(item.genres)}, ${arrLit(mergedTags)}, ${item.ai_summary ? `'${esc(item.ai_summary)}'` : 'NULL'}, ${jsonLit(item.toc)}, ${item.chunk_count || 0}, 'exempt', ${tsLit(item.created_at)}, ${tsLit(item.updated_at)})`;
      }).join(',\n');

      const sql = `INSERT INTO platform_intelligence.book_cache (id, title, author, isbn, genres, tags, ai_summary, toc, chunk_count, ethics_gate_status, created_at, updated_at) VALUES\n${values}\nON CONFLICT (id) DO NOTHING;`;

      // Write to temp file and execute
      const tmpFile = 'scripts/_tmp_bc.sql';
      fs.writeFileSync(tmpFile, sql);
      try {
        execSync(`npx supabase db query --linked -f ${tmpFile}`, { stdio: 'pipe', timeout: 60000 });
      } catch (e) {
        const stderr = e.stderr ? e.stderr.toString() : e.message;
        console.error(`Error inserting book_cache batch at ${i}:`, stderr);
        throw new Error(stderr);
      }
      bookCacheCount += batch.length;
      if (bookCacheCount % 200 === 0 || i + sqlBatchSize >= items.length) {
        console.log(`  book_cache: ${bookCacheCount} of ${items.length}`);
      }
    }
    fs.unlinkSync('scripts/_tmp_bc.sql');
    console.log(`  Created ${bookCacheCount} book_cache records`);

    // Step 3: Create bookshelf_items
    await createBookshelfItems(items);

    // Step 4: Resolve parent refs
    await resolveParentRefs(items);

    // Step 5: Extraction tables (sequential)
    await migrateChunks();
    await migrateSummaries();
    await migrateInsights();
    await migrateDeclarations();
    await migrateActionStepsAndQuestions();

    // Step 6: text_content
    await migrateTextContent(items);

    // Step 7: Collections
    await migrateCollections();

    // Step 8: Member settings
    await createMemberSettings();

    // Verify
    await verify();

    console.log('\n========================================');
    console.log('Migration complete!');
    console.log('========================================');
    console.log('Next: Re-enable embedding triggers and queue backfill');

  } catch (err) {
    console.error('\nMIGRATION FAILED:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
