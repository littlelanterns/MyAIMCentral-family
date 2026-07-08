/**
 * ThisWeekPlan — PRD-42 KitchenCompass §6.1
 *
 * Week/Day/Month plan views with drag-drop between day/slot cells,
 * busy-evening flags from calendar_events, entry sheet on tap, [+] on
 * empty cells, [Send week to shopping list] toolbar action.
 */

import { useMemo, useState } from 'react'
import {
  DndContext, PointerSensor, useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent,
} from '@dnd-kit/core'
import {
  ChevronLeft, ChevronRight, Plus, Clock, ChefHat, ShoppingCart, CalendarDays, Grid3x3, List,
} from 'lucide-react'
import { MiniCalendarPicker } from '@/components/shared/MiniCalendarPicker'
import { useMealPlanEntries, useMoveMealPlanEntry } from '@/hooks/useMealPlan'
import { useMealSettings } from '@/hooks/useFoodProfiles'
import { useCalendarSettings, useEventsForRange } from '@/hooks/useCalendarEvents'
import { useFamilyToday } from '@/hooks/useFamilyToday'
import { AddEntryModal } from './AddEntryModal'
import { EntrySheetModal } from './EntrySheetModal'
import { SendToShoppingListModal, type ShoppingSourceEntry } from './SendToShoppingListModal'
import type { MealPlanEntryWithRecipe, MealSlot } from '@/types/meals'

type ViewMode = 'week' | 'day' | 'month'

const SLOT_LABELS: Record<MealSlot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack', custom: 'Custom' }

function localIsoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfWeek(date: Date, weekStartDay: 0 | 1): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay()
  const diff = weekStartDay === 1 ? (day === 0 ? -6 : 1 - day) : -day
  d.setDate(d.getDate() + diff)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

interface ThisWeekPlanProps {
  familyId: string
  memberId: string
  isMomOrGrant: boolean
}

export function ThisWeekPlan({ familyId, memberId, isMomOrGrant }: ThisWeekPlanProps) {
  const { data: mealSettings } = useMealSettings(familyId)
  const { data: calendarSettings } = useCalendarSettings()
  const { data: familyToday } = useFamilyToday(memberId)
  const weekStartDay = calendarSettings?.week_start_day ?? 0
  const enabledSlots: MealSlot[] = (mealSettings?.enabled_slots ?? ['dinner']) as MealSlot[]

  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [view, setView] = useState<ViewMode>('week')
  const [addCell, setAddCell] = useState<{ date: string; slot: MealSlot } | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<MealPlanEntryWithRecipe | null>(null)
  const [showSendWeek, setShowSendWeek] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const weekStart = useMemo(() => startOfWeek(anchorDate, weekStartDay), [anchorDate, weekStartDay])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const rangeStart = view === 'month' ? new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1) : weekDays[0]
  const rangeEnd = view === 'month' ? new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0) : weekDays[6]

  const { data: entries = [] } = useMealPlanEntries(familyId, localIsoOf(rangeStart), localIsoOf(rangeEnd))
  const { data: calendarEvents = [] } = useEventsForRange(rangeStart, rangeEnd)
  const moveEntry = useMoveMealPlanEntry()

  const entriesByDate = useMemo(() => {
    const map = new Map<string, MealPlanEntryWithRecipe[]>()
    for (const e of entries) {
      const arr = map.get(e.entry_date) ?? []
      arr.push(e)
      map.set(e.entry_date, arr)
    }
    return map
  }, [entries])

  const busyDates = useMemo(() => {
    const set = new Set<string>()
    for (const ev of calendarEvents) {
      if (ev.start_time && ev.start_time >= '16:00') set.add(ev.event_date)
    }
    return set
  }, [calendarEvents])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const entryId = active.id as string
    const [date, slot] = (over.id as string).split('::')
    const entry = entries.find((e) => e.id === entryId)
    if (!entry || (entry.entry_date === date && entry.meal_slot === slot)) return
    moveEntry.mutate({ id: entryId, familyId, entryDate: date, mealSlot: slot as MealSlot })
  }

  function navigate(offset: number) {
    if (view === 'month') setAnchorDate((d) => new Date(d.getFullYear(), d.getMonth() + offset, 1))
    else if (view === 'week') setAnchorDate((d) => addDays(d, offset * 7))
    else setAnchorDate((d) => addDays(d, offset))
  }

  // §6.6 dynamic grocery scaling: multiply each entry's ingredients by
  // servings_planned / servings_base before handing off to the merge review.
  const shoppingSourceEntries: ShoppingSourceEntry[] = useMemo(
    () => entries
      .filter((e) => e.recipe?.ingredients?.length)
      .map((e) => {
        const factor = e.servings_planned && e.recipe?.servings_base ? e.servings_planned / e.recipe.servings_base : 1
        return {
          entryDate: e.entry_date,
          recipeTitle: e.title_snapshot,
          ingredients: (e.recipe?.ingredients ?? []).map((ing) =>
            ing.quantity != null && !ing.scaling_note
              ? { ...ing, quantity: Math.round(ing.quantity * factor * 100) / 100 }
              : ing,
          ),
        }
      }),
    [entries],
  )

  return (
    <div className="density-compact space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 relative">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}><ChevronLeft size={16} /></button>
          <button
            onClick={() => setShowDatePicker((s) => !s)}
            className="text-sm font-medium min-w-40 text-center px-1 py-0.5 rounded"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {view === 'month'
              ? anchorDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
              : view === 'week'
                ? `${weekDays[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
                : anchorDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </button>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}><ChevronRight size={16} /></button>
          <button onClick={() => setAnchorDate(new Date())} className="text-xs px-2 py-1 rounded" style={{ color: 'var(--color-accent)' }}>Today</button>
          {showDatePicker && (
            <div className="absolute top-full left-0 mt-1 z-30 rounded-xl shadow-lg" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
              <MiniCalendarPicker
                selectedDate={anchorDate}
                onDateSelect={(d) => { setAnchorDate(d); setShowDatePicker(false) }}
                weekStartDay={weekStartDay}
                showTodayButton
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            <ViewButton icon={List} active={view === 'day'} onClick={() => setView('day')} />
            <ViewButton icon={Grid3x3} active={view === 'week'} onClick={() => setView('week')} />
            <ViewButton icon={CalendarDays} active={view === 'month'} onClick={() => setView('month')} />
          </div>
          {isMomOrGrant && entries.length > 0 && (
            <button onClick={() => setShowSendWeek(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
              <ShoppingCart size={14} /> Send to shopping list
            </button>
          )}
        </div>
      </div>

      {entries.length === 0 && view !== 'month' && (
        <div className="text-center py-10 space-y-2">
          <ChefHat size={32} className="mx-auto" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Nothing planned yet. Start with tonight.</p>
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {view === 'week' && (
          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const iso = localIsoOf(day)
              const isToday = iso === familyToday
              return (
                <DayColumn
                  key={iso}
                  dateIso={iso}
                  label={day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                  isToday={isToday}
                  isBusy={busyDates.has(iso)}
                  slots={enabledSlots}
                  entries={entriesByDate.get(iso) ?? []}
                  onAdd={(slot) => setAddCell({ date: iso, slot })}
                  onOpenEntry={setSelectedEntry}
                />
              )
            })}
          </div>
        )}

        {view === 'day' && (
          <DayColumn
            dateIso={localIsoOf(anchorDate)}
            label={null}
            isToday={localIsoOf(anchorDate) === familyToday}
            isBusy={busyDates.has(localIsoOf(anchorDate))}
            slots={enabledSlots}
            entries={entriesByDate.get(localIsoOf(anchorDate)) ?? []}
            onAdd={(slot) => setAddCell({ date: localIsoOf(anchorDate), slot })}
            onOpenEntry={setSelectedEntry}
            expanded
          />
        )}
      </DndContext>

      {view === 'month' && (
        <MonthGrid
          anchorDate={anchorDate}
          weekStartDay={weekStartDay}
          entriesByDate={entriesByDate}
          familyToday={familyToday}
          onSelectDate={(iso) => { setAnchorDate(new Date(iso)); setView('day') }}
        />
      )}

      {addCell && (
        <AddEntryModal familyId={familyId} memberId={memberId} entryDate={addCell.date} mealSlot={addCell.slot} onClose={() => setAddCell(null)} />
      )}
      {selectedEntry && (
        <EntrySheetModal familyId={familyId} memberId={memberId} isMomOrGrant={isMomOrGrant} entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      )}
      {showSendWeek && (
        <SendToShoppingListModal familyId={familyId} entries={shoppingSourceEntries} onClose={() => setShowSendWeek(false)} />
      )}
    </div>
  )
}

function ViewButton({ icon: Icon, active, onClick }: { icon: React.ComponentType<{ size?: number }>; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="p-2"
      style={{ backgroundColor: active ? 'var(--color-accent)' : 'var(--color-bg-secondary)', color: active ? 'var(--color-text-on-primary, white)' : 'var(--color-text-secondary)' }}
    >
      <Icon size={14} />
    </button>
  )
}

function DayColumn({
  dateIso, label, isToday, isBusy, slots, entries, onAdd, onOpenEntry, expanded = false,
}: {
  dateIso: string
  label: string | null
  isToday: boolean
  isBusy: boolean
  slots: MealSlot[]
  entries: MealPlanEntryWithRecipe[]
  onAdd: (slot: MealSlot) => void
  onOpenEntry: (entry: MealPlanEntryWithRecipe) => void
  expanded?: boolean
}) {
  return (
    <div
      className="rounded-xl p-2 space-y-2"
      style={{ backgroundColor: isToday ? 'var(--color-bg-secondary)' : 'transparent', border: isToday ? '2px solid var(--color-accent)' : '1px solid var(--color-border)' }}
    >
      {label && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-semibold" style={{ color: isToday ? 'var(--color-accent)' : 'var(--color-text-primary)' }}>{label}</span>
          {isBusy && <span title="Busy evening"><Clock size={12} style={{ color: 'var(--color-text-secondary)' }} /></span>}
        </div>
      )}
      {slots.map((slot) => (
        <SlotCell key={slot} dateIso={dateIso} slot={slot} entries={entries.filter((e) => e.meal_slot === slot)} onAdd={() => onAdd(slot)} onOpenEntry={onOpenEntry} expanded={expanded} />
      ))}
    </div>
  )
}

function SlotCell({
  dateIso, slot, entries, onAdd, onOpenEntry, expanded,
}: {
  dateIso: string
  slot: MealSlot
  entries: MealPlanEntryWithRecipe[]
  onAdd: () => void
  onOpenEntry: (entry: MealPlanEntryWithRecipe) => void
  expanded: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${dateIso}::${slot}` })
  return (
    <div ref={setNodeRef} className="space-y-1 min-h-[2.5rem] rounded-lg p-1" style={{ backgroundColor: isOver ? 'var(--color-bg-tertiary, var(--color-bg))' : 'transparent' }}>
      {expanded && <p className="text-[10px] font-semibold uppercase tracking-wide px-1" style={{ color: 'var(--color-text-secondary)' }}>{SLOT_LABELS[slot]}</p>}
      {entries.map((e) => <EntryCard key={e.id} entry={e} onOpen={() => onOpenEntry(e)} />)}
      <button onClick={onAdd} className="w-full flex items-center justify-center gap-1 py-1 rounded text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
        <Plus size={11} /> {entries.length === 0 ? SLOT_LABELS[slot] : 'Add'}
      </button>
    </div>
  )
}

function EntryCard({ entry, onOpen }: { entry: MealPlanEntryWithRecipe; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: entry.id })
  const style: React.CSSProperties = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 20, opacity: isDragging ? 0.6 : 1 }
    : {}
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      style={{ ...style, backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', opacity: entry.status === 'made' ? 0.7 : style.opacity }}
      className="w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
    >
      {entry.recipe?.photo_urls?.[0] ? (
        <img src={entry.recipe.photo_urls[0]} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
      ) : (
        <ChefHat size={12} className="shrink-0" />
      )}
      <span className="truncate">{entry.title_snapshot}</span>
      {entry.status === 'made' && <span className="shrink-0">✓</span>}
    </button>
  )
}

function MonthGrid({
  anchorDate, weekStartDay, entriesByDate, familyToday, onSelectDate,
}: {
  anchorDate: Date
  weekStartDay: 0 | 1
  entriesByDate: Map<string, MealPlanEntryWithRecipe[]>
  familyToday: string | null | undefined
  onSelectDate: (iso: string) => void
}) {
  const firstOfMonth = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1)
  const gridStart = startOfWeek(firstOfMonth, weekStartDay)
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const dowLabels = weekStartDay === 1 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-7 gap-1 text-[10px] font-semibold text-center" style={{ color: 'var(--color-text-secondary)' }}>
        {dowLabels.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = localIsoOf(day)
          const inMonth = day.getMonth() === anchorDate.getMonth()
          const dayEntries = entriesByDate.get(iso) ?? []
          const isToday = iso === familyToday
          return (
            <button
              key={iso}
              onClick={() => onSelectDate(iso)}
              className="aspect-square rounded-lg p-1 flex flex-col items-center justify-start text-xs"
              style={{
                backgroundColor: isToday ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                color: isToday ? 'var(--color-text-on-primary, white)' : inMonth ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                opacity: inMonth ? 1 : 0.4,
              }}
            >
              <span>{day.getDate()}</span>
              {dayEntries.length > 0 && <span className="w-1 h-1 rounded-full mt-1" style={{ backgroundColor: isToday ? 'var(--color-text-on-primary, white)' : 'var(--color-accent)' }} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
