/**
 * Worker ROUTINE-PROPAGATION (c3, founder D3) — count + name the
 * active deployments of a master template.
 *
 * Lives under src/lib/templates/ (D6 Thread 1) so future Worker 2
 * SHARED-ROUTINES and Worker 3 SHARED-LISTS can reuse the same
 * deployments-count primitive (e.g. when a list template is edited,
 * the same count modal makes sense).
 *
 * Used by the master-template edit confirmation modal: when mom
 * saves an edit to a routine template that is currently deployed
 * to N family members, the modal shows the count + their names so
 * she sees exactly who is affected.
 *
 * "Active deployment" = tasks row where:
 *   - template_id matches
 *   - archived_at IS NULL
 *   - status NOT IN ('completed', 'cancelled')
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ActiveDeployment {
  taskId: string
  assigneeId: string
  assigneeDisplayName: string
}

/**
 * Returns one entry per active task row referencing the given template.
 * The same assignee may have more than one active deployment (after
 * c2.5: non-overlapping date ranges), so callers that want a
 * "distinct family members affected" count should de-dupe by
 * assigneeId.
 */
export async function getActiveTemplateDeployments(
  supabase: SupabaseClient,
  templateId: string,
): Promise<ActiveDeployment[]> {
  const { data: rows, error } = await supabase
    .from('tasks')
    .select('id, assignee_id, status')
    .eq('template_id', templateId)
    .is('archived_at', null)
    .not('status', 'in', '(completed,cancelled)')

  if (error) throw error
  if (!rows || rows.length === 0) return []

  const assigneeIds = Array.from(
    new Set(
      rows
        .map(r => r.assignee_id as string | null)
        .filter((id): id is string => !!id),
    ),
  )

  if (assigneeIds.length === 0) {
    return rows
      .filter(r => !!r.assignee_id)
      .map(r => ({
        taskId: r.id as string,
        assigneeId: r.assignee_id as string,
        assigneeDisplayName: 'this family member',
      }))
  }

  const { data: members } = await supabase
    .from('family_members')
    .select('id, display_name')
    .in('id', assigneeIds)

  const nameById = new Map<string, string>()
  for (const m of members ?? []) {
    if (m.id && m.display_name) nameById.set(m.id, m.display_name)
  }

  const result: ActiveDeployment[] = []
  for (const r of rows) {
    if (!r.assignee_id) continue
    result.push({
      taskId: r.id as string,
      assigneeId: r.assignee_id as string,
      assigneeDisplayName:
        nameById.get(r.assignee_id as string) ?? 'this family member',
    })
  }

  return result
}

/**
 * Distinct assignee names from a deployments list, in stable order.
 * "Stable" = first-seen order in the input array.
 */
export function distinctAssigneeNames(
  deployments: ActiveDeployment[],
): string[] {
  const seen = new Set<string>()
  const names: string[] = []
  for (const d of deployments) {
    if (seen.has(d.assigneeId)) continue
    seen.add(d.assigneeId)
    names.push(d.assigneeDisplayName)
  }
  return names
}

/**
 * Format an array of names as a comma-separated list with Oxford comma
 * for the modal copy: ["Ruthie", "Mosiah", "Gideon"] → "Ruthie, Mosiah,
 * and Gideon". Single name returns plain. Two names returns "X and Y".
 */
export function formatNameList(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}
