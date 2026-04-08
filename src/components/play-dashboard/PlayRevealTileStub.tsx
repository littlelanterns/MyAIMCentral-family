/**
 * PlayRevealTileStub — Build M Sub-phase B
 *
 * Wraps PlannedExpansionCard for the play_reveal_tiles feature key.
 * The reveal-tile mechanic itself ships in a later build (Sub-phase D
 * scope only covers creature/page reveals; surprise reveal tiles are
 * a forward feature). This stub holds the slot in the layout and
 * collects vote/notification signals from interested families.
 */

import { PlannedExpansionCard } from '@/components/shared/PlannedExpansionCard'

export function PlayRevealTileStub() {
  return <PlannedExpansionCard featureKey="play_reveal_tiles" />
}
