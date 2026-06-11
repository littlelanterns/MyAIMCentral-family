/**
 * SequentialDetailModal — full-collection view in a transient modal.
 *
 * FO-COMMAND-CENTER: opened from a sequential next-item card in the Tasks
 * page views (founder Q2 tap-through) AND from the Family Overview column
 * sequential rows (founder eyes-on feedback 2026-06-10: "edit it from right
 * there"). Uses the exported SequentialCollectionCard primitive (Convention
 * #154 — never duplicate the card logic; the card carries its own edit /
 * reorder / redeploy / archive affordances).
 */

import { ModalV2 } from '@/components/shared/ModalV2'
import { useSequentialCollections } from '@/hooks/useSequentialCollections'
import { SequentialCollectionCard } from './SequentialCollectionView'

export function SequentialDetailModal({
  collectionId,
  familyId,
  onClose,
}: {
  collectionId: string
  familyId: string | undefined
  onClose: () => void
}) {
  const { data: collections = [] } = useSequentialCollections(familyId)
  const collection = collections.find((c) => c.id === collectionId)

  return (
    <ModalV2
      id={`sequential-detail-${collectionId}`}
      isOpen
      onClose={onClose}
      type="transient"
      size="lg"
      title={collection?.title ?? 'Sequential Collection'}
    >
      {collection ? (
        <SequentialCollectionCard collection={collection} />
      ) : (
        <div className="py-8 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Loading collection…
        </div>
      )}
    </ModalV2>
  )
}
