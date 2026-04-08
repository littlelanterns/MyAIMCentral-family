/**
 * PlayMomMessageStub — Build M Sub-phase B
 *
 * Wraps PlannedExpansionCard for the play_message_receive feature key.
 * The actual mom-message-on-Play-Dashboard surface depends on PRD-15
 * messaging integration (currently in Build G). This stub reserves
 * the layout slot and collects demand signals.
 */

import { PlannedExpansionCard } from '@/components/shared/PlannedExpansionCard'

export function PlayMomMessageStub() {
  return <PlannedExpansionCard featureKey="play_message_receive" />
}
