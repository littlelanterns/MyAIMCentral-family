/**
 * PrizeContentEditor — Prize type selector + content fields.
 *
 * Handles fixed mode (single prize) and pool mode (add/remove/reorder
 * prizes in the pool). Platform image browser follows the same grid
 * pattern as TaskIconBrowser (visual schedule library).
 */

import { useState } from 'react'
import {
  Type,
  ImageIcon,
  Palette,
  Shuffle,
  PartyPopper,
  Upload,
  X,
  Plus,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { PrizeType, PrizeMode, PrizePoolEntry } from '@/types/reward-reveals'

// ── Main editor ──

interface PrizeContentEditorProps {
  prizeMode: PrizeMode
  onPrizeModeChange: (mode: PrizeMode) => void
  // Fixed mode fields
  prizeType: PrizeType
  onPrizeTypeChange: (type: PrizeType) => void
  prizeText: string
  onPrizeTextChange: (text: string) => void
  prizeName: string
  onPrizeNameChange: (name: string) => void
  prizeImageUrl: string
  onPrizeImageUrlChange: (url: string) => void
  prizeAssetKey: string
  onPrizeAssetKeyChange: (key: string) => void
  // Pool mode
  prizePool: PrizePoolEntry[]
  onPrizePoolChange: (pool: PrizePoolEntry[]) => void
  // For image upload
  familyId: string
}

const PRIZE_TYPE_OPTIONS: Array<{
  value: PrizeType
  label: string
  icon: typeof Type
  description: string
}> = [
  { value: 'text', label: 'Text Only', icon: Type, description: 'A congratulations message' },
  { value: 'image', label: 'My Photo', icon: ImageIcon, description: 'Upload a photo of the reward' },
  { value: 'platform_image', label: 'Pick an Image', icon: Palette, description: 'Choose from the image library' },
  { value: 'randomizer', label: 'Randomizer Pull', icon: Shuffle, description: 'Pull from a randomizer list' },
  { value: 'celebration_only', label: 'Celebration Only', icon: PartyPopper, description: 'Just the video + confetti!' },
]

const PRIZE_MODE_OPTIONS: Array<{ value: PrizeMode; label: string; description: string }> = [
  { value: 'fixed', label: 'Same every time', description: 'One prize, always' },
  { value: 'sequential', label: 'Cycle through', description: 'Different prize each time, in order' },
  { value: 'random', label: 'Random surprise', description: 'Random pick from the pool' },
]

export function PrizeContentEditor({
  prizeMode,
  onPrizeModeChange,
  prizeType,
  onPrizeTypeChange,
  prizeText,
  onPrizeTextChange,
  prizeName,
  onPrizeNameChange,
  prizeImageUrl,
  onPrizeImageUrlChange,
  prizeAssetKey,
  onPrizeAssetKeyChange,
  prizePool,
  onPrizePoolChange,
  familyId,
}: PrizeContentEditorProps) {
  const [showPlatformPicker, setShowPlatformPicker] = useState(false)
  const [editingPoolIndex, setEditingPoolIndex] = useState<number | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Prize mode selector */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Prize variety
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PRIZE_MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPrizeModeChange(opt.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                border:
                  prizeMode === opt.value
                    ? '2px solid var(--color-btn-primary-bg)'
                    : '1px solid var(--color-border)',
                backgroundColor:
                  prizeMode === opt.value
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)'
                    : 'var(--color-bg-card)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
              }}
            >
              <div style={{ fontWeight: 600 }}>{opt.label}</div>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {opt.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Fixed mode: single prize editor */}
      {prizeMode === 'fixed' && (
        <SinglePrizeEditor
          prizeType={prizeType}
          onPrizeTypeChange={onPrizeTypeChange}
          prizeText={prizeText}
          onPrizeTextChange={onPrizeTextChange}
          prizeName={prizeName}
          onPrizeNameChange={onPrizeNameChange}
          prizeImageUrl={prizeImageUrl}
          onPrizeImageUrlChange={onPrizeImageUrlChange}
          prizeAssetKey={prizeAssetKey}
          onPrizeAssetKeyChange={onPrizeAssetKeyChange}
          showPlatformPicker={showPlatformPicker}
          onTogglePlatformPicker={() => setShowPlatformPicker((v) => !v)}
          familyId={familyId}
        />
      )}

      {/* Pool mode: list of prizes */}
      {(prizeMode === 'sequential' || prizeMode === 'random') && (
        <PrizePoolEditor
          pool={prizePool}
          onChange={onPrizePoolChange}
          editingIndex={editingPoolIndex}
          onEditIndex={setEditingPoolIndex}
          familyId={familyId}
        />
      )}
    </div>
  )
}

// ── Single prize editor ──

function SinglePrizeEditor({
  prizeType,
  onPrizeTypeChange,
  prizeText,
  onPrizeTextChange,
  prizeName,
  onPrizeNameChange,
  prizeImageUrl,
  onPrizeImageUrlChange,
  prizeAssetKey,
  onPrizeAssetKeyChange,
  showPlatformPicker,
  onTogglePlatformPicker,
  familyId,
}: {
  prizeType: PrizeType
  onPrizeTypeChange: (t: PrizeType) => void
  prizeText: string
  onPrizeTextChange: (t: string) => void
  prizeName: string
  onPrizeNameChange: (n: string) => void
  prizeImageUrl: string
  onPrizeImageUrlChange: (u: string) => void
  prizeAssetKey: string
  onPrizeAssetKeyChange: (k: string) => void
  showPlatformPicker: boolean
  onTogglePlatformPicker: () => void
  familyId: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Prize type selector */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '0.5rem',
          }}
        >
          Prize type
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '0.5rem',
          }}
        >
          {PRIZE_TYPE_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const isSelected = prizeType === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onPrizeTypeChange(opt.value)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.5rem',
                  borderRadius: 'var(--vibe-radius-card, 0.75rem)',
                  border: isSelected
                    ? '2px solid var(--color-btn-primary-bg)'
                    : '1px solid var(--color-border)',
                  backgroundColor: isSelected
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)'
                    : 'var(--color-bg-card)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <Icon
                  size={20}
                  style={{
                    color: isSelected
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-text-secondary)',
                  }}
                />
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Prize name (for {reward} substitution) */}
      {prizeType !== 'celebration_only' && (
        <div>
          <label
            htmlFor="prize-name"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            Reward name
          </label>
          <input
            id="prize-name"
            type="text"
            value={prizeName}
            onChange={(e) => onPrizeNameChange(e.target.value)}
            placeholder='e.g. "ice cream", "30 min screen time"'
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
            }}
          />
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              marginTop: '0.25rem',
            }}
          >
            This replaces {'{reward}'} in the congratulations message
          </div>
        </div>
      )}

      {/* Prize message text */}
      {prizeType !== 'celebration_only' && (
        <div>
          <label
            htmlFor="prize-text"
            style={{
              display: 'block',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '0.25rem',
            }}
          >
            Message
          </label>
          <textarea
            id="prize-text"
            value={prizeText}
            onChange={(e) => onPrizeTextChange(e.target.value)}
            placeholder='e.g. "Great job! You earned {reward}!"'
            rows={2}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              resize: 'vertical',
            }}
          />
        </div>
      )}

      {/* Image upload */}
      {prizeType === 'image' && (
        <ImageUploader
          currentUrl={prizeImageUrl}
          onUrlChange={onPrizeImageUrlChange}
          familyId={familyId}
        />
      )}

      {/* Platform image picker (visual schedule browser) */}
      {prizeType === 'platform_image' && (
        <div>
          <button
            type="button"
            onClick={onTogglePlatformPicker}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {prizeAssetKey ? 'Change image' : 'Browse image library'}
          </button>
          {showPlatformPicker && (
            <PlatformImagePicker
              selectedKey={prizeAssetKey}
              onSelect={(key) => {
                onPrizeAssetKeyChange(key)
                onTogglePlatformPicker()
              }}
            />
          )}
          {prizeAssetKey && !showPlatformPicker && (
            <SelectedPlatformImage assetKey={prizeAssetKey} />
          )}
        </div>
      )}
    </div>
  )
}

// ── Prize pool editor (sequential/random mode) ──

function PrizePoolEditor({
  pool,
  onChange,
  editingIndex,
  onEditIndex,
  familyId,
}: {
  pool: PrizePoolEntry[]
  onChange: (pool: PrizePoolEntry[]) => void
  editingIndex: number | null
  onEditIndex: (index: number | null) => void
  familyId: string
}) {
  const addPrize = () => {
    onChange([
      ...pool,
      { prize_type: 'text', prize_text: '', prize_name: '', prize_image_url: null, prize_asset_key: null },
    ])
    onEditIndex(pool.length)
  }

  const removePrize = (index: number) => {
    onChange(pool.filter((_, i) => i !== index))
    if (editingIndex === index) onEditIndex(null)
  }

  const updatePrize = (index: number, updates: Partial<PrizePoolEntry>) => {
    onChange(pool.map((p, i) => (i === index ? { ...p, ...updates } : p)))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <label
        style={{
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}
      >
        Prize pool ({pool.length} prizes)
      </label>

      {pool.map((entry, idx) => (
        <div
          key={idx}
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--vibe-radius-card, 0.75rem)',
            border:
              editingIndex === idx
                ? '2px solid var(--color-btn-primary-bg)'
                : '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: editingIndex === idx ? '0.5rem' : 0,
            }}
          >
            <button
              type="button"
              onClick={() => onEditIndex(editingIndex === idx ? null : idx)}
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-primary)',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                padding: 0,
              }}
            >
              #{idx + 1}: {entry.prize_name || entry.prize_type}
            </button>
            <button
              type="button"
              onClick={() => removePrize(idx)}
              aria-label={`Remove prize ${idx + 1}`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                padding: '0.25rem',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {editingIndex === idx && (
            <PoolItemEditor
              entry={entry}
              onUpdate={(updates) => updatePrize(idx, updates)}
              familyId={familyId}
            />
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addPrize}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--vibe-radius-input, 0.5rem)',
          border: '1px dashed var(--color-border)',
          backgroundColor: 'transparent',
          color: 'var(--color-btn-primary-bg)',
          cursor: 'pointer',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
        }}
      >
        <Plus size={16} /> Add a prize
      </button>
    </div>
  )
}

function PoolItemEditor({
  entry,
  onUpdate,
  familyId,
}: {
  entry: PrizePoolEntry
  onUpdate: (updates: Partial<PrizePoolEntry>) => void
  familyId: string
}) {
  const [showPicker, setShowPicker] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Type quick-select row */}
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {(['text', 'image', 'platform_image', 'celebration_only'] as PrizeType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onUpdate({ prize_type: t })}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              fontSize: 'var(--font-size-xs)',
              border:
                entry.prize_type === t
                  ? '1px solid var(--color-btn-primary-bg)'
                  : '1px solid var(--color-border)',
              backgroundColor:
                entry.prize_type === t
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)'
                  : 'transparent',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
            }}
          >
            {t === 'text' ? 'Text' : t === 'image' ? 'Photo' : t === 'platform_image' ? 'Library' : 'Celebrate'}
          </button>
        ))}
      </div>
      {entry.prize_type !== 'celebration_only' && (
        <>
          <input
            type="text"
            value={entry.prize_name ?? ''}
            onChange={(e) => onUpdate({ prize_name: e.target.value })}
            placeholder="Reward name"
            style={{
              padding: '0.375rem 0.5rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
            }}
          />
          <input
            type="text"
            value={entry.prize_text ?? ''}
            onChange={(e) => onUpdate({ prize_text: e.target.value })}
            placeholder="Message (use {reward} for the name)"
            style={{
              padding: '0.375rem 0.5rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
            }}
          />
        </>
      )}
      {entry.prize_type === 'image' && (
        <ImageUploader
          currentUrl={entry.prize_image_url ?? ''}
          onUrlChange={(url) => onUpdate({ prize_image_url: url })}
          familyId={familyId}
        />
      )}
      {entry.prize_type === 'platform_image' && (
        <>
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {entry.prize_asset_key ? 'Change image' : 'Pick image'}
          </button>
          {showPicker && (
            <PlatformImagePicker
              selectedKey={entry.prize_asset_key ?? ''}
              onSelect={(key) => {
                onUpdate({ prize_asset_key: key })
                setShowPicker(false)
              }}
            />
          )}
          {entry.prize_asset_key && !showPicker && (
            <SelectedPlatformImage assetKey={entry.prize_asset_key} />
          )}
        </>
      )}
    </div>
  )
}

// ── Image uploader ──

function ImageUploader({
  currentUrl,
  onUrlChange,
  familyId,
}: {
  currentUrl: string
  onUrlChange: (url: string) => void
  familyId: string
}) {
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `reward-images/${familyId}/${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('gamification-assets')
        .upload(path, file, { upsert: true })
      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('gamification-assets')
        .getPublicUrl(path)
      onUrlChange(urlData.publicUrl)
    } catch (err) {
      console.error('Prize image upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {currentUrl && (
        <img
          src={currentUrl}
          alt="Prize"
          style={{
            width: '64px',
            height: '64px',
            objectFit: 'cover',
            borderRadius: 'var(--vibe-radius-card, 0.5rem)',
            border: '1px solid var(--color-border)',
          }}
        />
      )}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--vibe-radius-input, 0.5rem)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-card)',
          cursor: 'pointer',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-primary)',
        }}
      >
        <Upload size={16} />
        {uploading ? 'Uploading...' : currentUrl ? 'Replace photo' : 'Upload photo'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />
      </label>
    </div>
  )
}

// ── Platform image picker (visual schedule library browser) ──

interface PlatformAssetRow {
  feature_key: string
  display_name: string
  size_128_url: string
  variant: string
}

function PlatformImagePicker({
  selectedKey,
  onSelect,
}: {
  selectedKey: string
  onSelect: (key: string) => void
}) {
  const [query, setQuery] = useState('')

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['platform-assets-prize-picker', query.toLowerCase()],
    queryFn: async () => {
      let q = supabase
        .from('platform_assets')
        .select('feature_key, display_name, size_128_url, variant')
        .eq('category', 'visual_schedule')
        .eq('variant', 'B')
        .order('display_name')

      if (query.trim()) {
        q = q.ilike('display_name', `%${query.trim()}%`)
      }

      const { data, error } = await q.limit(200)
      if (error) throw error
      return (data ?? []) as PlatformAssetRow[]
    },
    staleTime: 1000 * 60 * 10,
  })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        marginTop: '0.5rem',
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search images (ice cream, park, swimming...)"
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--vibe-radius-input, 0.5rem)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-card)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm)',
        }}
      />

      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {isLoading ? 'Loading...' : `${assets.length} images`}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: '0.5rem',
          maxHeight: '300px',
          overflowY: 'auto',
          padding: '0.25rem',
        }}
      >
        {assets.map((asset) => {
          const isSelected = selectedKey === asset.feature_key
          return (
            <button
              key={`${asset.feature_key}::${asset.variant}`}
              type="button"
              onClick={() => onSelect(asset.feature_key)}
              aria-label={asset.display_name}
              aria-pressed={isSelected}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.125rem',
                padding: '0.375rem',
                borderRadius: 'var(--vibe-radius-card, 0.5rem)',
                backgroundColor: 'var(--color-bg-card)',
                border: isSelected
                  ? '2px solid var(--color-btn-primary-bg)'
                  : '1px solid var(--color-border)',
                cursor: 'pointer',
              }}
            >
              <img
                src={asset.size_128_url}
                alt={asset.display_name}
                loading="lazy"
                style={{
                  width: '56px',
                  height: '56px',
                  objectFit: 'contain',
                  pointerEvents: 'none',
                }}
              />
              <span
                style={{
                  fontSize: '0.5625rem',
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                  lineHeight: 1.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {asset.display_name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Show the currently selected platform image ──

function SelectedPlatformImage({ assetKey }: { assetKey: string }) {
  const { data } = useQuery({
    queryKey: ['platform-asset-preview', assetKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_assets')
        .select('display_name, size_128_url')
        .eq('feature_key', assetKey)
        .eq('variant', 'B')
        .maybeSingle()
      if (error) throw error
      return data as { display_name: string; size_128_url: string } | null
    },
    enabled: !!assetKey,
    staleTime: 1000 * 60 * 30,
  })

  if (!data) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.25rem',
      }}
    >
      <img
        src={data.size_128_url}
        alt={data.display_name}
        style={{
          width: '48px',
          height: '48px',
          objectFit: 'contain',
          borderRadius: '0.375rem',
        }}
      />
      <span
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {data.display_name}
      </span>
    </div>
  )
}
