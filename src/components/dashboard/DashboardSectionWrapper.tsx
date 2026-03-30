/**
 * DashboardSectionWrapper — PRD-14
 *
 * Shared wrapper for dashboard sections. Provides:
 * - Collapse/expand toggle (for collapsible sections)
 * - Edit mode: drag handle + visibility (eye) toggle
 * - Section header with icon, label, count badge
 */

import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronRight, GripVertical, Eye, EyeOff } from 'lucide-react'
import type { SectionKey, SectionMeta } from './dashboardSections'
import { SECTION_META } from './dashboardSections'

interface DashboardSectionWrapperProps {
  sectionKey: SectionKey
  collapsed: boolean
  visible: boolean
  isEditMode: boolean
  /** Count badge (e.g. task count) */
  count?: number
  /** Extra header content (placed after badge, before chevron) */
  headerExtra?: ReactNode
  onToggleCollapse: () => void
  onToggleVisibility: () => void
  children: ReactNode
}

export function DashboardSectionWrapper({
  sectionKey,
  collapsed,
  visible,
  isEditMode,
  count,
  headerExtra,
  onToggleCollapse,
  onToggleVisibility,
  children,
}: DashboardSectionWrapperProps) {
  const meta: SectionMeta = SECTION_META[sectionKey]

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `section-${sectionKey}`,
    disabled: !isEditMode || !meta.draggable,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : !visible && isEditMode ? 0.4 : 1,
  }

  // Hidden sections: show only in edit mode with reduced opacity
  if (!visible && !isEditMode) return null

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isEditMode && meta.draggable ? 'animate-wiggle' : ''}
    >
      {/* Section header */}
      {meta.collapsible && (
        <div className="flex items-center gap-2 mb-2" style={{ minHeight: 'var(--touch-target-min, 44px)' }}>
          {/* Drag handle — edit mode only, draggable sections only */}
          {isEditMode && meta.draggable && (
            <button
              className="p-1 cursor-grab active:cursor-grabbing rounded"
              style={{ color: 'var(--color-text-tertiary)' }}
              {...attributes}
              {...listeners}
            >
              <GripVertical size={18} />
            </button>
          )}

          {/* Collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-2 flex-1 text-left"
          >
            <span
              className="font-semibold text-base"
              style={{
                color: 'var(--color-text-heading)',
                textDecoration: !visible && isEditMode ? 'line-through' : 'none',
              }}
            >
              {meta.label}
            </span>

            {count !== undefined && count > 0 && (
              <span
                className="text-sm px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
                  color: 'var(--color-btn-primary-bg)',
                  fontWeight: 500,
                }}
              >
                {count}
              </span>
            )}

            {headerExtra}

            {collapsed ? (
              <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} className="ml-auto" />
            ) : (
              <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} className="ml-auto" />
            )}
          </button>

          {/* Visibility toggle — edit mode only, hideable sections only */}
          {isEditMode && meta.hideable && (
            <button
              onClick={onToggleVisibility}
              className="p-1.5 rounded"
              style={{ color: visible ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }}
              title={visible ? 'Hide section' : 'Show section'}
            >
              {visible ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          )}
        </div>
      )}

      {/* Section content — hidden when collapsed */}
      {!collapsed && children}
    </div>
  )
}
