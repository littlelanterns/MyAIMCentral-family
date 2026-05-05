import { useState, useCallback, useMemo } from 'react'
import { Shuffle, List, Check, ChevronRight } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { DualModeListAccess, type ActivityAccessMode } from '@/components/lists/DualModeListAccess'
import { useIconLauncherWidgets, useIconLauncherIcon, type IconLauncherWidget } from '@/hooks/useIconLauncherWidgets'
import type { ListItem } from '@/types/lists'

interface GuidedActivitySectionProps {
  familyId: string
  memberId: string
  readingSupport?: boolean
}

export function GuidedActivitySection({
  familyId,
  memberId,
}: GuidedActivitySectionProps) {
  const { data: widgets = [] } = useIconLauncherWidgets(familyId, memberId)

  if (widgets.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {widgets.map(widget => {
        const vs = widget.widget_config.visual_style
        return (
          <GuidedActivityCard
            key={widget.id}
            widget={widget}
            familyId={familyId}
            memberId={memberId}
            compact={vs === 'text_button'}
          />
        )
      })}
    </div>
  )
}

function GuidedActivityCard({
  widget,
  familyId,
  memberId,
  compact = false,
}: {
  widget: IconLauncherWidget
  familyId: string
  memberId: string
  compact?: boolean
}) {
  const cfg = widget.widget_config
  const { data: iconUrl } = useIconLauncherIcon(cfg.icon_asset_key, cfg.icon_variant)
  const [mode, setMode] = useState<ActivityAccessMode>(
    cfg.display_mode === 'browse' || cfg.display_mode === 'sequential_browse'
      ? 'browse'
      : 'random',
  )
  const [drawnItem, setDrawnItem] = useState<ListItem | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const queryClient = useQueryClient()

  const { data: items = [] } = useQuery({
    queryKey: ['icon-launcher-items', cfg.linked_list_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', cfg.linked_list_id)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data ?? []) as ListItem[]
    },
    staleTime: 1000 * 60 * 5,
  })

  const eligible = useMemo(
    () => items.filter(i => i.is_available !== false),
    [items],
  )

  const handleDraw = useCallback(() => {
    if (eligible.length === 0) return
    const idx = Math.floor(Math.random() * eligible.length)
    setDrawnItem(eligible[idx])
  }, [eligible])

  const handleClaim = useCallback(async (item: ListItem) => {
    if (claiming) return
    setClaiming(true)

    try {
      await supabase.from('tasks').insert({
        family_id: familyId,
        created_by: memberId,
        assignee_id: memberId,
        title: item.item_name || item.content,
        task_type: 'task',
        status: 'pending',
        source: 'icon_launcher',
        source_reference_id: item.id,
      })

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setDrawnItem(null)
      setExpanded(false)
    } catch (err) {
      console.warn('[GuidedActivityCard] Claim failed:', err)
    } finally {
      setClaiming(false)
    }
  }, [familyId, memberId, claiming, queryClient])

  return (
    <div
      style={{
        borderRadius: 'var(--vibe-radius-card, 0.75rem)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-card)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
        }}
      >
        {!compact && iconUrl && (
          <img
            src={iconUrl}
            alt=""
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '0.5rem',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
        )}
        <span
          style={{
            flex: 1,
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          {cfg.display_label}
        </span>
        <DualModeListAccess
          defaultMode={mode}
          onModeChange={m => {
            setMode(m)
            setDrawnItem(null)
            setExpanded(false)
          }}
        />
      </div>

      {/* Random mode: draw result */}
      {mode === 'random' && (
        <div style={{ padding: '0 1rem 1rem' }}>
          {drawnItem ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <span
                style={{
                  flex: 1,
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                }}
              >
                {drawnItem.item_name || drawnItem.content}
              </span>
              <button
                type="button"
                onClick={() => handleClaim(drawnItem)}
                disabled={claiming}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                  border: 'none',
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-text-on-primary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  cursor: claiming ? 'wait' : 'pointer',
                  minHeight: '48px',
                }}
              >
                <Check size={14} />
                {claiming ? '...' : "Let's go!"}
              </button>
              <button
                type="button"
                onClick={handleDraw}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  minHeight: '48px',
                }}
              >
                <Shuffle size={14} />
                Again
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDraw}
              disabled={eligible.length === 0}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                border: '1px dashed var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: eligible.length > 0
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: eligible.length > 0 ? 'pointer' : 'default',
                minHeight: '48px',
              }}
            >
              <Shuffle size={16} />
              {eligible.length > 0 ? 'Surprise me!' : 'All done for now!'}
            </button>
          )}
        </div>
      )}

      {/* Browse mode: expandable list */}
      {mode === 'browse' && (
        <div style={{ padding: '0 1rem 1rem' }}>
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                border: '1px dashed var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-btn-primary-bg)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '48px',
              }}
            >
              <List size={16} />
              Browse activities ({eligible.length})
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {eligible.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleClaim(item)}
                  disabled={claiming}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-card)',
                    cursor: claiming ? 'wait' : 'pointer',
                    textAlign: 'left',
                    minHeight: '48px',
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {item.item_name || item.content}
                  </span>
                  <ChevronRight
                    size={14}
                    style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                style={{
                  padding: '0.5rem',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Collapse
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
