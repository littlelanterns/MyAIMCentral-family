/**
 * Universal access/sharing property resolution.
 *
 * Single source of truth for resolving is_shared, instantiation_mode,
 * collaboration_mode, and in_progress_member_id for any task, regardless
 * of generation path. Three-tier: item → parent → fallback.
 *
 * Note: instantiation_mode and collaboration_mode are TEXT columns
 * (not Postgres enums) per Master Plans extensibility constraint.
 */

export type InstantiationMode = 'per_assignee_instance' | 'shared_anyone_completes'
export type CollaborationMode = 'solo_claim' | 'collaborative'

export interface AccessProperties {
  is_shared: boolean
  instantiation_mode: InstantiationMode | null
  collaboration_mode: CollaborationMode | null
  in_progress_member_id: string | null
}

interface ItemWithAccess {
  is_shared?: boolean | null
  instantiation_mode?: string | null
  collaboration_mode?: string | null
  in_progress_member_id?: string | null
}

interface ParentAccessDefaults {
  is_shared?: boolean | null
  instantiation_mode?: string | null
  collaboration_mode?: string | null
}

export function resolveAccessProperties(
  item?: ItemWithAccess | null,
  parentDefaults?: ParentAccessDefaults | null,
): AccessProperties {
  const isShared =
    item?.is_shared ??
    parentDefaults?.is_shared ??
    false

  const instantiationMode = (
    item?.instantiation_mode ??
    parentDefaults?.instantiation_mode ??
    null
  ) as InstantiationMode | null

  const collaborationMode = (
    item?.collaboration_mode ??
    parentDefaults?.collaboration_mode ??
    null
  ) as CollaborationMode | null

  const inProgressMemberId =
    item?.in_progress_member_id ?? null

  return {
    is_shared: !!isShared,
    instantiation_mode: instantiationMode,
    collaboration_mode: collaborationMode,
    in_progress_member_id: inProgressMemberId,
  }
}
