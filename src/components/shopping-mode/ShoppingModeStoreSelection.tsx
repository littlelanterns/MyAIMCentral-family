/**
 * ShoppingModeStoreSelection — "Where are you shopping?" screen
 * PRD-09B Enhancement: Shopping Mode store picker
 */

import { useState } from 'react'
import { ShoppingCart, X, Plus, Clock } from 'lucide-react'

interface Props {
  stores: string[]
  recentStores: string[]
  isLoading: boolean
  onSelectStore: (store: string) => void
  onClose: () => void
}

export function ShoppingModeStoreSelection({
  stores,
  recentStores,
  isLoading,
  onSelectStore,
  onClose,
}: Props) {
  const [customStore, setCustomStore] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  function handleCustomSubmit() {
    const trimmed = customStore.trim()
    if (trimmed) {
      onSelectStore(trimmed)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
          >
            <ShoppingCart size={20} />
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
            >
              Shopping Mode
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Where are you shopping?
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <X size={20} />
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Loading stores...
          </p>
        </div>
      ) : stores.length === 0 ? (
        <div
          className="rounded-xl p-6 text-center space-y-2"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-default)' }}
        >
          <ShoppingCart size={32} style={{ color: 'var(--color-text-secondary)', margin: '0 auto' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            No shopping lists with store sections yet
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Add store names as sections in your shopping lists, and they will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Recent stores */}
          {recentStores.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 px-1">
                <Clock size={12} style={{ color: 'var(--color-text-secondary)' }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Recent
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentStores.map(store => (
                  <button
                    key={`recent-${store}`}
                    onClick={() => onSelectStore(store)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--color-btn-primary-bg)',
                      color: 'var(--color-btn-primary-text)',
                    }}
                  >
                    {store}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All stores */}
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wider px-1" style={{ color: 'var(--color-text-secondary)' }}>
              All Stores
            </span>
            <div className="flex flex-wrap gap-2">
              {stores
                .filter(s => !recentStores.includes(s))
                .map(store => (
                  <button
                    key={store}
                    onClick={() => onSelectStore(store)}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      color: 'var(--color-text-heading)',
                      border: '1px solid var(--color-border-default)',
                    }}
                  >
                    {store}
                  </button>
                ))}
            </div>
          </div>
        </>
      )}

      {/* Custom store input */}
      {showCustomInput ? (
        <div
          className="flex gap-2 items-center p-3 rounded-xl"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-default)' }}
        >
          <input
            type="text"
            value={customStore}
            onChange={e => setCustomStore(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCustomSubmit() }}
            placeholder="Store name..."
            autoFocus
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--color-text-primary)' }}
          />
          <button
            onClick={handleCustomSubmit}
            disabled={!customStore.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: customStore.trim() ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
              color: customStore.trim() ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
            }}
          >
            Go
          </button>
          <button
            onClick={() => { setShowCustomInput(false); setCustomStore('') }}
            className="p-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCustomInput(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium w-full justify-center"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-secondary)',
            border: '1px dashed var(--color-border-default)',
          }}
        >
          <Plus size={14} />
          Other store
        </button>
      )}
    </div>
  )
}
