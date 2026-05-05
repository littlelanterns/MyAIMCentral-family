import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Shuffle, List } from 'lucide-react'
import { IconLauncherTile } from './IconLauncherTile'
import { ActivityRevealCard } from './ActivityRevealCard'
import { ActivityBrowseModal } from './ActivityBrowseModal'
import { useIconLauncherIcon, type IconLauncherWidget } from '@/hooks/useIconLauncherWidgets'
import type { ListItem } from '@/types/lists'

interface IconLauncherGridProps {
  widgets: IconLauncherWidget[]
  familyId: string
  memberId: string
  isPlayShell: boolean
}

function weightedRandomPick(items: ListItem[]): ListItem | null {
  const eligible = items.filter(i => i.is_available !== false)
  if (eligible.length === 0) return null

  const weights = eligible.map(item => {
    if (item.frequency_min != null && (item.period_completion_count ?? 0) < item.frequency_min) {
      return 3
    }
    return 1
  })

  const total = weights.reduce((s, w) => s + w, 0)
  let r = Math.random() * total
  for (let i = 0; i < eligible.length; i++) {
    r -= weights[i]
    if (r <= 0) return eligible[i]
  }
  return eligible[eligible.length - 1]
}

export function IconLauncherGrid({
  widgets,
  familyId,
  memberId,
  isPlayShell,
}: IconLauncherGridProps) {
  const [activeWidgetId, setActiveWidgetId] = useState<string | null>(null)
  const [drawnItem, setDrawnItem] = useState<ListItem | null>(null)
  const [browseListId, setBrowseListId] = useState<string | null>(null)
  const [browseTitle, setBrowseTitle] = useState('')

  const activeWidget = useMemo(
    () => widgets.find(w => w.id === activeWidgetId) ?? null,
    [widgets, activeWidgetId],
  )

  const handleTap = useCallback(
    (widget: IconLauncherWidget, items: ListItem[]) => {
      const mode = widget.widget_config.display_mode
      if (mode === 'browse' || mode === 'sequential_browse') {
        setBrowseListId(widget.widget_config.linked_list_id)
        setBrowseTitle(widget.widget_config.display_label)
        setActiveWidgetId(widget.id)
      } else {
        const pick = weightedRandomPick(items)
        if (pick) {
          setDrawnItem(pick)
          setActiveWidgetId(widget.id)
        }
      }
    },
    [],
  )

  const handleClose = useCallback(() => {
    setActiveWidgetId(null)
    setDrawnItem(null)
    setBrowseListId(null)
  }, [])

  const iconWidgets = useMemo(
    () => widgets.filter(w => w.widget_config.visual_style !== 'text_button'),
    [widgets],
  )
  const textWidgets = useMemo(
    () => widgets.filter(w => w.widget_config.visual_style === 'text_button'),
    [widgets],
  )

  if (widgets.length === 0) return null

  return (
    <section>
      <h2
        style={{
          margin: '0 0 0.5rem 0',
          fontSize: 'var(--font-size-base)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}
      >
        Activities
      </h2>

      {iconWidgets.length > 0 && (
        <div className="icon-launcher-grid">
          {iconWidgets.map(widget => (
            <IconLauncherTileWithData
              key={widget.id}
              widget={widget}
              onTap={handleTap}
            />
          ))}
        </div>
      )}

      {textWidgets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: iconWidgets.length > 0 ? '0.75rem' : 0 }}>
          {textWidgets.map(widget => (
            <TextButtonLauncher
              key={widget.id}
              widget={widget}
              onTap={handleTap}
            />
          ))}
        </div>
      )}

      {drawnItem && activeWidget && (
        <ActivityRevealCard
          item={drawnItem}
          listTitle={activeWidget.widget_config.display_label}
          familyId={familyId}
          memberId={memberId}
          isPlayShell={isPlayShell}
          onClose={handleClose}
          onClaimed={handleClose}
        />
      )}

      {browseListId && (
        <ActivityBrowseModal
          listId={browseListId}
          listTitle={browseTitle}
          familyId={familyId}
          memberId={memberId}
          isPlayShell={isPlayShell}
          onClose={handleClose}
        />
      )}

      <style>{`
        .icon-launcher-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .icon-launcher-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </section>
  )
}

function IconLauncherTileWithData({
  widget,
  onTap,
}: {
  widget: IconLauncherWidget
  onTap: (widget: IconLauncherWidget, items: ListItem[]) => void
}) {
  const cfg = widget.widget_config
  const { data: iconUrl } = useIconLauncherIcon(cfg.icon_asset_key, cfg.icon_variant)

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

  return (
    <IconLauncherTile
      widgetId={widget.id}
      label={cfg.display_label}
      iconUrl={iconUrl ?? null}
      onTap={() => onTap(widget, items)}
    />
  )
}

function TextButtonLauncher({
  widget,
  onTap,
}: {
  widget: IconLauncherWidget
  onTap: (widget: IconLauncherWidget, items: ListItem[]) => void
}) {
  const cfg = widget.widget_config

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

  const eligible = items.filter(i => i.is_available !== false)
  const isBrowse = cfg.display_mode === 'browse' || cfg.display_mode === 'sequential_browse'

  return (
    <button
      type="button"
      onClick={() => onTap(widget, items)}
      disabled={eligible.length === 0}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '1rem',
        borderRadius: 'var(--vibe-radius-card, 0.75rem)',
        border: '1px dashed var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
        color: eligible.length > 0 ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-base)',
        fontWeight: 600,
        cursor: eligible.length > 0 ? 'pointer' : 'default',
        minHeight: '56px',
      }}
    >
      {isBrowse ? <List size={20} /> : <Shuffle size={20} />}
      {eligible.length > 0
        ? `${cfg.display_label}: ${isBrowse ? 'Browse' : 'Surprise me!'}`
        : `${cfg.display_label}: All done!`}
    </button>
  )
}
