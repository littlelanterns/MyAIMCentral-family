/**
 * Universal homework property resolution.
 *
 * Single source of truth for resolving counts_for_homework and
 * homework_subject_ids for any task, regardless of generation path.
 * Three-tier: item → list/collection defaults → fallback.
 */

export interface HomeworkProperties {
  counts_for_homework: boolean
  homework_subject_ids: string[]
}

interface ItemWithHomework {
  counts_for_homework?: boolean | null
  homework_subject_ids?: string[] | null
}

interface ParentHomeworkDefaults {
  counts_for_homework?: boolean | null
  homework_subject_ids?: string[] | null
}

export function resolveHomeworkProperties(
  item?: ItemWithHomework | null,
  parentDefaults?: ParentHomeworkDefaults | null,
): HomeworkProperties {
  const countsForHomework =
    item?.counts_for_homework ??
    parentDefaults?.counts_for_homework ??
    false

  const homeworkSubjectIds =
    item?.homework_subject_ids ??
    parentDefaults?.homework_subject_ids ??
    []

  return {
    counts_for_homework: !!countsForHomework,
    homework_subject_ids: homeworkSubjectIds,
  }
}
