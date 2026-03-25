// PRD-10: Widget Folder Card — renders a folder as a single grid cell
// Shows 2x2 mini-preview of first 4 widgets inside, with folder name label
// Tap to open folder overlay (Screen 2)

import { Folder } from 'lucide-react'
import type { DashboardWidget, DashboardWidgetFolder } from '@/types/widgets'
import { getTrackerMeta } from '@/types/widgets'

interface WidgetFolderCardProps {
  folder: DashboardWidgetFolder
  widgets: DashboardWidget[]
  isEditMode?: boolean
  onOpen: () => void
}

export function WidgetFolderCard({ folder, widgets, isEditMode, onOpen }: WidgetFolderCardProps) {
  const preview = widgets.slice(0, 4)

  return (
    <button
      onClick={onOpen}
      className={`
        w-full h-full rounded-xl p-3 flex flex-col transition-all
        ${isEditMode ? 'animate-[wiggle_0.3s_ease-in-out_infinite]' : ''}
      `}
      style={{
        background: 'var(--color-card-bg, var(--color-bg-secondary))',
        border: '1px solid var(--color-border-default)',
      }}
    >
      {/* 2x2 mini preview grid */}
      <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-1 mb-2">
        {preview.map(w => {
          const meta = getTrackerMeta(w.template_type)
          return (
            <div
              key={w.id}
              className="rounded flex items-center justify-center text-xs"
              style={{
                background: 'var(--color-bg-tertiary)',
                color: 'var(--color-text-tertiary)',
              }}
            >
              {meta?.label?.[0] ?? '?'}
            </div>
          )
        })}
        {/* Fill empty slots */}
        {Array.from({ length: Math.max(0, 4 - preview.length) }, (_, i) => (
          <div
            key={`empty-${i}`}
            className="rounded"
            style={{ background: 'var(--color-bg-tertiary)', opacity: 0.3 }}
          />
        ))}
      </div>

      {/* Folder name */}
      <div className="flex items-center gap-1.5">
        <Folder size={12} style={{ color: 'var(--color-text-secondary)' }} />
        <span
          className="text-xs font-medium truncate"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {folder.name}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {widgets.length}
        </span>
      </div>
    </button>
  )
}
