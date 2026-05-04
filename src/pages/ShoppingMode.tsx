/**
 * ShoppingMode Page — PRD-09B Enhancement
 *
 * Full-page route at /shopping-mode composing the store selection
 * and store view components. Also usable as an entry point from lists.
 */

import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useShoppingModeStores, useShoppingModeItems } from '@/hooks/useShoppingMode'
import { ShoppingModeStoreSelection } from '@/components/shopping-mode/ShoppingModeStoreSelection'
import { ShoppingModeStoreView } from '@/components/shopping-mode/ShoppingModeStoreView'

export function ShoppingModePage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Pre-select store from URL param (e.g., from individual list entry point)
  const initialStore = searchParams.get('store') || null
  const [selectedStore, setSelectedStore] = useState<string | null>(initialStore)

  const familyId = family?.id
  const memberId = activeMember?.id

  const { data: storeData, isLoading: storesLoading } = useShoppingModeStores(familyId, memberId)
  const { data: items = [], isLoading: itemsLoading } = useShoppingModeItems(familyId, memberId, selectedStore)

  function handleClose() {
    navigate('/lists')
  }

  if (!selectedStore) {
    return (
      <div className="density-comfortable max-w-2xl mx-auto p-4 md:p-6">
        <ShoppingModeStoreSelection
          stores={storeData?.stores ?? []}
          recentStores={storeData?.recentStores ?? []}
          isLoading={storesLoading}
          onSelectStore={setSelectedStore}
          onClose={handleClose}
        />
      </div>
    )
  }

  return (
    <div className="density-comfortable max-w-2xl mx-auto p-4 md:p-6">
      <ShoppingModeStoreView
        storeName={selectedStore}
        items={items}
        isLoading={itemsLoading}
        memberId={memberId ?? ''}
        familyId={familyId ?? ''}
        onSwitchStore={() => setSelectedStore(null)}
      />
    </div>
  )
}
