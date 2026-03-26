import { useState, useEffect } from 'react'
import { Search, Sparkles, MessageSquarePlus } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import { PlannedExpansionCard } from '@/components/shared/PlannedExpansionCard'
import { VaultHeroSpotlight } from '../components/VaultHeroSpotlight'
import { VaultCategoryRow } from '../components/VaultCategoryRow'
import { VaultContentCard } from '../components/VaultContentCard'
import { VaultSearchBar } from '../components/VaultSearchBar'
import { VaultDetailView } from '../components/VaultDetailView'
import { ContentRequestForm } from '../components/ContentRequestForm'
import { useVaultBrowse } from '../hooks/useVaultBrowse'
import type { VaultItem } from '../hooks/useVaultBrowse'

export function VaultBrowsePage() {
  const { data: member } = useFamilyMember()
  const {
    categories,
    itemsByCategory,
    featuredItems,
    continueItems,
    searchResults,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    isSearching,
    loading,
  } = useVaultBrowse(member?.id ?? null)

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)

  const handleSelectItem = (item: VaultItem) => {
    // During beta, everything is unlocked — open detail directly.
    // When tiers are enforced: check allowed_tiers, open UpgradeModal if locked.
    setSelectedItemId(item.id)
  }

  // Record visit for NEW badge system
  useEffect(() => {
    if (!member?.id) return
    supabase.from('vault_user_visits').insert({ user_id: member.id }).then(() => {})
  }, [member?.id])

  const showSearchResults = searchQuery.length > 0 || Object.values(filters).some(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 pb-20">
      <FeatureGuide featureKey="vault_browse" />

      {/* Page header */}
      <div className="pt-6 pb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>
          AI Vault
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Tutorials, tools, and prompts to unlock AI for your family
        </p>
      </div>

      {/* Search & Filters (sticky) */}
      <VaultSearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {showSearchResults ? (
        /* Flat grid of search/filter results */
        <div className="mt-6">
          {isSearching ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-btn-primary-bg)' }} />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {searchResults.map(item => (
                <VaultContentCard key={item.id} item={item} memberId={member?.id ?? null} onSelect={handleSelectItem} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Search size={40} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-secondary)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No results for &ldquo;{searchQuery}&rdquo;. Try different keywords or browse our categories.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Normal browse experience */
        <div className="mt-4 space-y-8">
          {/* Section A: Hero Spotlight */}
          {featuredItems.length > 0 && (
            <VaultHeroSpotlight items={featuredItems} memberId={member?.id ?? null} />
          )}

          {/* Section B: Continue Learning (conditional) */}
          {continueItems.length > 0 && (
            <VaultCategoryRow
              title="Continue Learning"
              items={continueItems}
              memberId={member?.id ?? null}
              showProgress
              onSelectItem={handleSelectItem}
            />
          )}

          {/* BookShelf — Coming Soon highlight */}
          <PlannedExpansionCard featureKey="bookshelf" />

          {/* Section D: Category Rows */}
          {loading ? (
            <div className="space-y-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-5 w-40 rounded mb-3" style={{ backgroundColor: 'var(--color-bg-secondary)' }} />
                  <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="w-44 h-56 rounded-lg shrink-0" style={{ backgroundColor: 'var(--color-bg-secondary)' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            categories.map(cat => {
              const items = itemsByCategory[cat.id] || []
              return (
                <VaultCategoryRow
                  key={cat.id}
                  title={cat.display_name}
                  categorySlug={cat.slug}
                  items={items}
                  memberId={member?.id ?? null}
                  onSelectItem={handleSelectItem}
                  emptyMessage={
                    <span className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
                      Content coming soon
                    </span>
                  }
                />
              )
            })
          ) : (
            /* Empty Vault state */
            <div className="text-center py-20">
              <Sparkles size={48} className="mx-auto mb-4 opacity-40" style={{ color: 'var(--color-btn-primary-bg)' }} />
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-heading)' }}>
                We're building something magical here
              </h2>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                The AI Vault is being stocked with amazing tutorials, tools, and prompts. Check back soon!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Request Content link (PRD-21A Screen 7) */}
      {!showSearchResults && categories.length > 0 && (
        <div className="mt-12 text-center pb-4">
          <button
            onClick={() => setShowRequestForm(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <MessageSquarePlus size={14} />
            Request a Tutorial or Tool
          </button>
        </div>
      )}

      {/* Detail View (modal on desktop, fullscreen on mobile) */}
      {selectedItemId && (
        <VaultDetailView
          itemId={selectedItemId}
          memberId={member?.id ?? null}
          onClose={() => setSelectedItemId(null)}
        />
      )}

      {/* Content Request Form */}
      <ContentRequestForm
        open={showRequestForm}
        onClose={() => setShowRequestForm(false)}
      />
    </div>
  )
}
