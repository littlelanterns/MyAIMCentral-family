/**
 * One-time cleanup: remove duplicate dashboard widgets.
 *
 * Run in browser console while logged in as mom:
 *
 * 1. Open MyAIM Central in browser
 * 2. Open DevTools console (F12)
 * 3. Paste the code below and press Enter
 */

/*
// ---- Paste this in browser console ----

const { data: widgets, error } = await window.__supabase
  ? await window.__supabase.from('dashboard_widgets').select('*').is('archived_at', null).eq('is_on_dashboard', true)
  : { data: null, error: 'No supabase client found' }

if (error) { console.error('Error fetching widgets:', error); }
else {
  // Group by (family_member_id, template_type)
  const groups = {}
  for (const w of widgets) {
    const key = `${w.family_member_id}::${w.template_type}`
    if (!groups[key]) groups[key] = []
    groups[key].push(w)
  }

  const toArchive = []
  for (const [key, group] of Object.entries(groups)) {
    if (group.length > 1) {
      // Keep the oldest, archive the rest
      group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      console.log(`Duplicate: ${key} — keeping ${group[0].id}, archiving ${group.length - 1} duplicates`)
      for (let i = 1; i < group.length; i++) {
        toArchive.push(group[i].id)
      }
    }
  }

  if (toArchive.length === 0) {
    console.log('No duplicates found!')
  } else {
    console.log(`Archiving ${toArchive.length} duplicate widgets...`)
    // You can preview first, then uncomment below to actually clean up:
    // for (const id of toArchive) {
    //   await window.__supabase.from('dashboard_widgets').update({ archived_at: new Date().toISOString(), is_on_dashboard: false }).eq('id', id)
    // }
    // console.log('Done! Refresh the page.')
  }
}
*/

// Alternative: Run via supabase SQL editor
// This SQL finds and soft-deletes duplicate widgets, keeping the earliest created per (member, template_type):
const SQL = `
WITH ranked AS (
  SELECT id,
         family_member_id,
         template_type,
         ROW_NUMBER() OVER (
           PARTITION BY family_member_id, template_type
           ORDER BY created_at ASC
         ) AS rn
  FROM dashboard_widgets
  WHERE archived_at IS NULL
    AND is_on_dashboard = true
)
UPDATE dashboard_widgets
SET archived_at = now(), is_on_dashboard = false
WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);
`

console.log('Run this SQL in Supabase SQL Editor to clean up duplicates:')
console.log(SQL)
