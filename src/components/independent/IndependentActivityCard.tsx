import { useState, useCallback, useMemo } from 'react'
import { Shuffle, List, Check, ChevronRight } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { DualModeListAccess, type ActivityAccessMode } from '@/components/lists/DualModeListAccess'
import { useIconLauncherWidgets, useIconLauncherIcon, type IconLauncherWidget } from '@/hooks/useIconLauncherWidgets'
import type { ListItem } from '@/types/lists'

interface IndependentActivityCardProps {
  familyId: string
  memberId: string
}

export function IndependentActivityCard({
  familyId,
  memberId,
}: IndependentActivityCardProps) {
  const { data: widgets = [] } = useIconLauncherWidgets(familyId, memberId)

  if (widgets.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <h3
        style={{
          margin: 0,
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Activities
      </h3>
      {widgets.map(widget => (
        <IndependentActivityRow
          key={widget.id}
          widget={widget}
          familyId={familyId}
          memberId={memberId}
        />
      ))}
    </div>
  )
}

function IndependentActivityRow({
  widget,
  familyId,
  memberId,
}: {
  widget: IconLauncherWidget
  familyId: string
  memberId: string
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
      console.warn('[IndependentActivityRow] Claim failed:', err)
    } finally {
      setClaiming(false)
    }
  }, [familyId, memberId, claiming, queryClient])

  return (
    <div
      style={{
        borderRadius: 'var(--vibe-radius-card, 0.5rem)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-card)',
        padding: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {iconUrl && (
          <img
            src={iconUrl}
            alt=""
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '0.375rem',
              objectFit: 'contain',
            }}
          />
        )}
        <span
          style={{
            flex: 1,
            fontSize: 'var(--font-size-sm)',
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

      {mode === 'random' && (
        <>
          {drawnItem ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ flex: 1, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                {drawnItem.item_name || drawnItem.content}
              </span>
              <button
                type="button"
                onClick={() => handleClaim(drawnItem)}
                disabled={claiming}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border-none rounded"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-text-on-primary)',
                  cursor: claiming ? 'wait' : 'pointer',
                  borderRadius: 'var(--vibe-radius-input, 0.375rem)',
                }}
              >
                <Check size={12} />
                Go
              </button>
              <button
                type="button"
                onClick={handleDraw}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded"
                style={{
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  borderRadius: 'var(--vibe-radius-input, 0.375rem)',
                }}
              >
                <Shuffle size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleDraw}
              disabled={eligible.length === 0}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold"
              style={{
                borderRadius: 'var(--vibe-radius-input, 0.375rem)',
                border: '1px dashed var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: eligible.length > 0 ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                cursor: eligible.length > 0 ? 'pointer' : 'default',
              }}
            >
              <Shuffle size={14} />
              {eligible.length > 0 ? 'Random pick' : 'All done'}
            </button>
          )}
        </>
      )}

      {mode === 'browse' && (
        <>
          {!expanded ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold"
              style={{
                borderRadius: 'var(--vibe-radius-input, 0.375rem)',
                border: '1px dashed var(--color-border)',
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-btn-primary-bg)',
                cursor: 'pointer',
              }}
            >
              <List size={14} />
              Browse ({eligible.length})
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                    padding: '0.5rem 0.625rem',
                    borderRadius: 'var(--vibe-radius-input, 0.375rem)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-bg-card)',
                    cursor: claiming ? 'wait' : 'pointer',
                    textAlign: 'left',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <span style={{ flex: 1 }}>{item.item_name || item.content}</span>
                  <ChevronRight size={12} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                style={{
                  padding: '0.375rem',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Collapse
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
