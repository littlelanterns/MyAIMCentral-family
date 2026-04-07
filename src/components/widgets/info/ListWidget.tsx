/**
 * ListWidget — PRD-09B Addendum
 * Dashboard widget that renders a pinned list.
 * Reference lists use ReferenceListView with accordion.
 * Other list types render a simple checklist view.
 */

// ListWidget — dashboard widget for pinned lists
import type { DashboardWidget } from '@/types/widgets'
import { useList, useListItems, useToggleListItem, useListShares } from '@/hooks/useLists'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { ReferenceListView } from '@/components/lists/ReferenceListView'

interface ListWidgetProps {
  widget: DashboardWidget
  isCompact?: boolean
}

export function ListWidget({ widget }: ListWidgetProps) {
  const listId = widget.widget_config?.listId as string | undefined
    ?? (widget.data_source_ids?.[0] as string | undefined)
  const { data: list } = useList(listId)
  const { data: items = [] } = useListItems(listId)
  const { data: shares = [] } = useListShares(listId)
  const { data: member } = useFamilyMember()
  const toggleItem = useToggleListItem()

  if (!listId || !list) {
    return (
      <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        No list configured
      </div>
    )
  }

  // Determine if current user can edit
  const isOwner = list.owner_id === member?.id
  const shareRecord = shares.find(s => s.member_id === member?.id)
  const canEdit = isOwner || shareRecord?.permission === 'edit' || shareRecord?.can_edit === true

  // Reference list — use the accordion renderer
  if (list.list_type === 'reference') {
    return (
      <div className="h-full overflow-auto px-1">
        <ReferenceListView listId={listId} compact={true} canEdit={canEdit} />
      </div>
    )
  }

  // Other list types — simple checklist view
  return (
    <div className="h-full overflow-auto space-y-0.5 px-1">
      {items.length === 0 && (
        <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Empty list
        </div>
      )}
      {items.map(item => (
        <div key={item.id} className="flex items-start gap-1.5 py-0.5">
          <button
            onClick={() => toggleItem.mutate({
              id: item.id,
              checked: !item.checked,
              listId: list.id,
              checkedBy: member?.id,
            })}
            className="mt-0.5 shrink-0"
            disabled={!canEdit}
          >
            <div
              className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
              style={{
                borderColor: item.checked ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
                backgroundColor: item.checked ? 'var(--color-btn-primary-bg)' : 'transparent',
              }}
            >
              {item.checked && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="var(--color-btn-primary-text)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-xs ${item.checked ? 'line-through opacity-60' : ''}`} style={{ color: 'var(--color-text-primary)' }}>
              {item.content || item.item_name}
            </p>
            {item.notes && (
              <p className="text-[10px] italic" style={{ color: 'var(--color-text-secondary)' }}>
                {item.notes}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
