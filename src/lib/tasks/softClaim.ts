/**
 * PRD-09A Addendum §4 — Soft-claim authorization.
 *
 * Determines whether a family member can mark a track-progress task as Done.
 * Rules:
 *   - Mom (primary_parent) or task creator: always allowed
 *   - Soft-claim holder (in_progress_member_id matches): allowed
 *   - Anyone else: blocked with a reason
 */

export type SoftClaimResult =
  | { allowed: true }
  | { allowed: false; reason: 'not_claim_holder'; holderName: string | null }

export function checkSoftClaimAuthorization(params: {
  taskTrackProgress: boolean
  taskInProgressMemberId: string | null
  taskCreatedBy: string
  callerId: string
  callerIsPrimaryParent: boolean
  holderDisplayName: string | null
}): SoftClaimResult {
  if (!params.taskTrackProgress) {
    return { allowed: true }
  }

  if (params.callerIsPrimaryParent) {
    return { allowed: true }
  }

  if (params.callerId === params.taskCreatedBy) {
    return { allowed: true }
  }

  if (!params.taskInProgressMemberId) {
    return { allowed: true }
  }

  if (params.callerId === params.taskInProgressMemberId) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: 'not_claim_holder',
    holderName: params.holderDisplayName,
  }
}

export function checkSoftClaimCrossClaim(params: {
  taskInProgressMemberId: string | null
  callerId: string
  holderDisplayName: string | null
}): { isCrossClaim: boolean; holderName: string | null } {
  if (
    !params.taskInProgressMemberId ||
    params.taskInProgressMemberId === params.callerId
  ) {
    return { isCrossClaim: false, holderName: null }
  }

  return { isCrossClaim: true, holderName: params.holderDisplayName }
}
