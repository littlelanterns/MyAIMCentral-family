/**
 * RewardImagePicker — KIDS-REWARDS-PAGE Slice 1 (gate §11, Q5).
 *
 * The THREE-MODE reward image picker, used everywhere a custom reward can be
 * promised (Unification Principle): task/opportunity reward config, list item
 * rewards, contract custom-reward config, tracker prize config, proposals.
 *
 * Modes:
 *   1. No picture (default — text-only reward card)
 *   2. Upload — mom photo → gamification-assets/reward-images/{familyId}/
 *      (PrizeContentEditor ImageUploader pattern)
 *   3. Picture library — platform_assets with embedding auto-suggest from the
 *      reward text (reuses useTaskIconSuggestions: instant tag search +
 *      debounced match_assets() embedding refine — no new pipeline, per
 *      post-gate approval §11)
 *
 * Value shape mirrors the storage columns: exactly one of imageUrl /
 * imageAssetKey is set (or neither). Selecting in one mode clears the other.
 */

import { useEffect, useState } from 'react'
import { ImageOff, Upload, Images, Sparkles, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { PlatformAssetImage } from '@/components/shared/PlatformAssetImage'
import {
  useTaskIconSuggestions,
  REWARD_ASSET_CATEGORIES,
  GOOD_MATCH_SIMILARITY,
} from '@/hooks/useTaskIconSuggestions'
import { useAssetMissLogger } from '@/hooks/useAssetMissLogger'

export interface RewardImageValue {
  /** Mom-uploaded image URL (prize_type='image' path) */
  imageUrl: string | null
  /** platform_assets feature_key (prize_type='platform_image' path) */
  imageAssetKey: string | null
}

interface RewardImagePickerProps {
  value: RewardImageValue
  onChange: (value: RewardImageValue) => void
  familyId: string
  /** Reward text used for library auto-suggest (e.g. "a popsicle") */
  suggestText?: string
  label?: string
}

type PickerMode = 'none' | 'upload' | 'library'

function initialMode(value: RewardImageValue): PickerMode {
  if (value.imageUrl) return 'upload'
  if (value.imageAssetKey) return 'library'
  return 'none'
}

export function RewardImagePicker({
  value,
  onChange,
  familyId,
  suggestText = '',
  label = 'Reward picture',
}: RewardImagePickerProps) {
  const [mode, setMode] = useState<PickerMode>(() => initialMode(value))
  const [uploading, setUploading] = useState(false)
  const [librarySearch, setLibrarySearch] = useState('')

  const effectiveSearch = librarySearch.trim().length >= 3 ? librarySearch : suggestText
  // Founder direction (2026-06-12): the reward library spans routine icons,
  // tool icons, AND sign-in pictures ("pizza"/"unicorn" are login avatars)
  const { results, isRefining, hasEmbeddingResults, topSimilarity, isSettled } =
    useTaskIconSuggestions(effectiveSearch, null, mode === 'library', REWARD_ASSET_CATEGORIES)
  const logMiss = useAssetMissLogger()

  // Weak-match: nothing great in the library — show closest + record the term
  const isWeakMatch =
    isSettled &&
    (results.length === 0 || (topSimilarity !== null && topSimilarity < GOOD_MATCH_SIMILARITY))
  useEffect(() => {
    if (mode === 'library' && isWeakMatch) {
      logMiss(effectiveSearch, 'reward_image', topSimilarity)
    }
  }, [mode, isWeakMatch, effectiveSearch, topSimilarity, logMiss])

  const switchMode = (next: PickerMode) => {
    setMode(next)
    if (next === 'none') {
      onChange({ imageUrl: null, imageAssetKey: null })
    }
  }

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
      onChange({ imageUrl: urlData.publicUrl, imageAssetKey: null })
    } catch (err) {
      console.error('[RewardImagePicker] upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const modeButton = (key: PickerMode, icon: React.ReactNode, text: string) => {
    const active = mode === key
    return (
      <button
        type="button"
        onClick={() => switchMode(key)}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.375rem',
          padding: '0.5rem 0.5rem',
          minHeight: '44px',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          border: active
            ? '2px solid var(--color-btn-primary-bg)'
            : '1px solid var(--color-border)',
          backgroundColor: active
            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
            : 'var(--color-bg-card)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--font-size-sm, 0.875rem)',
          fontWeight: active ? 600 : 400,
          cursor: 'pointer',
        }}
      >
        {icon}
        {text}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <label
        style={{
          display: 'block',
          fontSize: 'var(--font-size-sm, 0.875rem)',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
        }}
      >
        {label}
      </label>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {modeButton('none', <ImageOff size={16} />, 'No picture')}
        {modeButton('upload', <Upload size={16} />, 'Upload')}
        {modeButton('library', <Images size={16} />, 'Picture library')}
      </div>

      {/* Upload mode */}
      {mode === 'upload' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {value.imageUrl && (
            <img
              src={value.imageUrl}
              alt="Reward"
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
              minHeight: '44px',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-primary)',
            }}
          >
            <Upload size={16} />
            {uploading ? 'Uploading...' : value.imageUrl ? 'Replace photo' : 'Upload photo'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {/* Library mode */}
      {mode === 'library' && (
        <div className="space-y-2">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder={
                suggestText
                  ? `Suggestions for "${suggestText}" — or search...`
                  : 'Search the picture library...'
              }
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                minHeight: '44px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                backgroundColor: 'var(--color-bg-input)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm, 0.875rem)',
              }}
            />
            {(isRefining || hasEmbeddingResults) && (
              <Sparkles
                size={14}
                aria-label={isRefining ? 'Finding smarter matches...' : 'Smart matches'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-btn-primary-bg)',
                  opacity: isRefining ? 0.5 : 1,
                }}
              />
            )}
          </div>

          {effectiveSearch.trim().length < 3 ? (
            <div
              style={{
                padding: '0.75rem',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Type at least 3 letters to search the library.
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: '0.75rem',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {isSettled
                ? "We don't have an image for that yet — we've made a note to add one! Try a different word, or upload a photo."
                : 'No matches yet — try a different word.'}
            </div>
          ) : (
            <>
            {isWeakMatch && (
              <div
                style={{
                  padding: '0 0.25rem 0.25rem',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                We don't have that exact image yet (we've made a note to add
                one) — here's the closest we have:
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                gap: '0.5rem',
                maxHeight: '220px',
                overflowY: 'auto',
                padding: '0.25rem',
              }}
            >
              {results.map((asset) => {
                const selected = value.imageAssetKey === asset.asset_key
                return (
                  <button
                    key={`${asset.asset_key}-${asset.variant}`}
                    type="button"
                    onClick={() =>
                      onChange({ imageUrl: null, imageAssetKey: asset.asset_key })
                    }
                    title={asset.display_name}
                    style={{
                      position: 'relative',
                      padding: '0.25rem',
                      borderRadius: 'var(--vibe-radius-card, 0.5rem)',
                      border: selected
                        ? '2px solid var(--color-btn-primary-bg)'
                        : '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-card)',
                      cursor: 'pointer',
                    }}
                  >
                    <img
                      src={asset.size_128_url}
                      alt={asset.display_name}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'contain',
                        borderRadius: 'var(--vibe-radius-card, 0.375rem)',
                      }}
                    />
                    {selected && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '0.125rem',
                          right: '0.125rem',
                          width: '18px',
                          height: '18px',
                          borderRadius: '9999px',
                          backgroundColor: 'var(--color-btn-primary-bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={12} style={{ color: 'var(--color-text-on-primary)' }} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            </>
          )}

          {/* Current platform selection preview when search results don't include it */}
          {value.imageAssetKey && !results.some((r) => r.asset_key === value.imageAssetKey) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <PlatformAssetImage
                assetKey={value.imageAssetKey}
                size={40}
                assetSize={128}
                variant="B"
                fallback={<Images size={24} />}
              />
              Current picture
            </div>
          )}
        </div>
      )}
    </div>
  )
}
