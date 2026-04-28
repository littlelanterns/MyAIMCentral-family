/**
 * PRD-09A Addendum §6.4 — Universal tracking property resolution.
 *
 * Single source of truth for resolving track_progress and track_duration
 * for any task, regardless of generation path. Called from every task
 * creation site to enforce the universal inheritance rule (§6.2).
 */

export interface TrackingProperties {
  track_progress: boolean
  track_duration: boolean
}

interface ItemWithTracking {
  track_progress?: boolean | null
  track_duration?: boolean | null
}

interface ListDefaults {
  default_track_progress?: boolean | null
  default_track_duration?: boolean | null
}

export function resolveTrackingProperties(
  item?: ItemWithTracking | null,
  listDefaults?: ListDefaults | null,
): TrackingProperties {
  const trackProgress =
    item?.track_progress ??
    listDefaults?.default_track_progress ??
    false

  const trackDuration =
    item?.track_duration ??
    listDefaults?.default_track_duration ??
    false

  return {
    track_progress: !!trackProgress,
    track_duration: !!trackDuration,
  }
}
