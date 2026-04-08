/**
 * EventCreationModal — persistent modal for creating/editing calendar events.
 *
 * Uses ModalV2 with type="persistent", size "md", gradient header.
 * Section-card form pattern matching TaskCreationModal.
 * Uses Universal Scheduler for recurrence with showTimeDefault={true}.
 *
 * PRD-14B Screen 2, spec: Calendar-System-Build-Spec.md
 */

import { useState, useCallback, useEffect } from 'react'
import {
  Calendar as CalendarIcon, Clock, MapPin, FileText,
  Repeat, Users, Car, Tag, Bell, Home, Pencil,
} from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useCreateEvent, useUpdateEvent, useEventCategories, useCalendarSettings } from '@/hooks/useCalendarEvents'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { UniversalScheduler } from '@/components/scheduling/UniversalScheduler'
import type { SchedulerOutput } from '@/components/scheduling/types'
import type { CalendarEvent, EventAttendee, CreateEventInput, AttendeeInput, ItemToBring } from '@/types/calendar'

interface EventCreationModalProps {
  isOpen: boolean
  onClose: () => void
  /** Pre-populate date when opened from a calendar date */
  initialDate?: string // 'YYYY-MM-DD'
  /** Pre-populate all fields when editing an existing event */
  initialEvent?: CalendarEvent & { event_attendees?: EventAttendee[] }
  /** Called after a new event is successfully created (not on edit) */
  onCreated?: () => void
  /** Pre-fill title in create mode (e.g., from a request) */
  prefillTitle?: string
  /** Pre-fill notes in create mode (e.g., details from a request) */
  prefillNotes?: string
}

const REMINDER_OPTIONS = [
  { value: 5, label: '5 min' },
  { value: 10, label: '10 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 1440, label: '1 day' },
]

export function EventCreationModal({ isOpen, onClose, initialDate, initialEvent, onCreated, prefillTitle, prefillNotes }: EventCreationModalProps) {
  // `initialEvent` with a non-empty id → edit mode (PATCH existing row).
  // `initialEvent` with empty id → create mode pre-filled from queue item.
  // Callers like CalendarTab.queueItemToEditEvent pass a synthetic
  // CalendarEvent shape with id='' to pre-populate the form for approval
  // of a mindsweep_detected / .ics-imported queue item. Without this check,
  // isEditing would be truthy and save would PATCH with id='' → 400.
  const isEditing = !!initialEvent && !!initialEvent.id
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()
  const { data: categories } = useEventCategories()
  const { data: settings } = useCalendarSettings()
  const { data: family } = useFamily()
  const { data: familyMembers } = useFamilyMembers(family?.id)

  // Form state
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState(initialDate ?? '')
  const [endDate, setEndDate] = useState('')
  const [isMultiDay, setIsMultiDay] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [isAllDay, setIsAllDay] = useState(false)
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedReminders, setSelectedReminders] = useState<number[]>([])
  const [attendees, setAttendees] = useState<Map<string, string>>(new Map()) // memberId → role
  const [transportationNeeded, setTransportationNeeded] = useState(false)
  const [transportationNotes, setTransportationNotes] = useState('')
  const [itemsToBring, setItemsToBring] = useState<ItemToBring[]>([])
  const [newItemText, setNewItemText] = useState('')
  const [notes, setNotes] = useState('')
  const [showOnHub, setShowOnHub] = useState(true)
  const [isPenciledIn, setIsPenciledIn] = useState(false)
  const [scheduleValue, setScheduleValue] = useState<SchedulerOutput | null>(null)

  // Reset / populate form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialEvent) {
        // Edit mode — pre-populate from existing event
        setTitle(initialEvent.title ?? '')
        setEventDate(initialEvent.event_date ?? initialDate ?? '')
        setEndDate(initialEvent.end_date ?? '')
        setIsMultiDay(!!initialEvent.end_date && initialEvent.end_date !== initialEvent.event_date)
        setStartTime(initialEvent.start_time?.slice(0, 5) ?? '')
        setEndTime(initialEvent.end_time?.slice(0, 5) ?? '')
        setIsAllDay(initialEvent.is_all_day ?? false)
        setLocation(initialEvent.location ?? '')
        setDescription(initialEvent.description ?? '')
        setCategoryId(initialEvent.category_id ?? '')
        setSelectedReminders(initialEvent.reminder_minutes ?? [])
        const initialAttendees = new Map<string, string>()
        for (const a of initialEvent.event_attendees ?? []) {
          initialAttendees.set(a.family_member_id, a.attendee_role ?? 'attending')
        }
        setAttendees(initialAttendees)
        setTransportationNeeded(initialEvent.transportation_needed ?? false)
        setTransportationNotes(initialEvent.transportation_notes ?? '')
        setItemsToBring(initialEvent.items_to_bring ?? [])
        setNotes(initialEvent.notes ?? '')
        setShowOnHub(initialEvent.show_on_hub ?? true)
        setIsPenciledIn(initialEvent.status === 'penciled_in')
        // Restore recurrence if present
        if (initialEvent.recurrence_details) {
          setScheduleValue(initialEvent.recurrence_details as unknown as SchedulerOutput)
        } else {
          setScheduleValue(null)
        }
      } else {
        // Create mode — reset to blank (with optional prefills)
        setTitle(prefillTitle ?? '')
        setEventDate(initialDate ?? '')
        setEndDate('')
        setIsMultiDay(false)
        setStartTime('')
        setEndTime('')
        setIsAllDay(false)
        setLocation('')
        setDescription('')
        setCategoryId('')
        setSelectedReminders([])
        setAttendees(new Map())
        setTransportationNeeded(false)
        setTransportationNotes('')
        setItemsToBring([])
        setNotes(prefillNotes ?? '')
        setShowOnHub(true)
        setIsPenciledIn(false)
        setScheduleValue(null)
      }
      setNewItemText('')
    }
  }, [isOpen, initialDate, initialEvent, prefillTitle, prefillNotes])

  const toggleReminder = useCallback((mins: number) => {
    setSelectedReminders(prev =>
      prev.includes(mins) ? prev.filter(m => m !== mins) : [...prev, mins]
    )
  }, [])

  const toggleAttendee = useCallback((memberId: string) => {
    setAttendees(prev => {
      const next = new Map(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.set(memberId, 'attending')
      }
      return next
    })
  }, [])

  const setAttendeeRole = useCallback((memberId: string, role: string) => {
    setAttendees(prev => {
      const next = new Map(prev)
      next.set(memberId, role)
      return next
    })
  }, [])

  const addItem = useCallback(() => {
    if (!newItemText.trim()) return
    setItemsToBring(prev => [...prev, { text: newItemText.trim(), checked: false, ai_suggested: false }])
    setNewItemText('')
  }, [newItemText])

  const removeItem = useCallback((idx: number) => {
    setItemsToBring(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !eventDate) return

    const attendeeInputs: AttendeeInput[] = Array.from(attendees.entries()).map(([id, role]) => ({
      family_member_id: id,
      attendee_role: role as 'attending' | 'driving' | 'requested_presence',
    }))

    const input: CreateEventInput = {
      title: title.trim(),
      event_date: eventDate,
      end_date: isMultiDay && endDate ? endDate : undefined,
      start_time: isAllDay ? undefined : startTime || undefined,
      end_time: isAllDay ? undefined : endTime || undefined,
      is_all_day: isAllDay,
      location: location || undefined,
      description: description || undefined,
      category_id: categoryId || undefined,
      reminder_minutes: selectedReminders.length > 0 ? selectedReminders : undefined,
      transportation_needed: transportationNeeded,
      transportation_notes: transportationNotes || undefined,
      items_to_bring: itemsToBring.length > 0 ? itemsToBring : undefined,
      notes: notes || undefined,
      attendees: attendeeInputs.length > 0 ? attendeeInputs : undefined,
      show_on_hub: showOnHub,
      status: isPenciledIn ? 'penciled_in' : undefined,
    }

    // Apply recurrence from scheduler
    if (scheduleValue?.rrule) {
      input.recurrence_details = scheduleValue as unknown as Record<string, unknown>
      // Derive quick-filter recurrence_rule
      const rrule = scheduleValue.rrule
      if (rrule.includes('FREQ=DAILY')) input.recurrence_rule = 'daily'
      else if (rrule.includes('FREQ=WEEKLY')) input.recurrence_rule = 'weekly'
      else if (rrule.includes('FREQ=MONTHLY')) input.recurrence_rule = 'monthly'
      else if (rrule.includes('FREQ=YEARLY')) input.recurrence_rule = 'yearly'
      else input.recurrence_rule = 'custom'
    }

    if (isEditing && initialEvent) {
      await updateEvent.mutateAsync({ eventId: initialEvent.id, updates: input })
    } else {
      await createEvent.mutateAsync(input)
      onCreated?.()
    }
    onClose()
  }, [title, eventDate, endDate, isMultiDay, startTime, endTime, isAllDay, location, description, categoryId, selectedReminders, attendees, transportationNeeded, transportationNotes, itemsToBring, notes, showOnHub, isPenciledIn, scheduleValue, isEditing, initialEvent, createEvent, updateEvent, onClose, onCreated])

  const isSaving = createEvent.isPending || updateEvent.isPending
  const hasUnsavedChanges = title.trim().length > 0

  // Calculate leave-by time
  const leaveByTime = transportationNeeded && startTime && settings?.default_drive_time_minutes
    ? (() => {
        const [h, m] = startTime.split(':').map(Number)
        const totalMin = h * 60 + m - settings.default_drive_time_minutes
        const lh = Math.floor(((totalMin % 1440) + 1440) % 1440 / 60)
        const lm = ((totalMin % 1440) + 1440) % 1440 % 60
        const ampm = lh >= 12 ? 'PM' : 'AM'
        const hour = lh % 12 || 12
        return `${hour}:${String(lm).padStart(2, '0')} ${ampm}`
      })()
    : null

  return (
    <ModalV2
      id="event-create"
      isOpen={isOpen}
      onClose={onClose}
      type="persistent"
      size="md"
      title={isEditing ? 'Edit Event' : 'Create Event'}
      icon={CalendarIcon}
      hasUnsavedChanges={hasUnsavedChanges}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg"
            style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !eventDate || isSaving}
            className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
              border: 'none',
              minHeight: 'unset',
              cursor: 'pointer',
              opacity: (!title.trim() || !eventDate) ? 0.5 : 1,
            }}
          >
            {isSaving
              ? (isEditing ? 'Saving...' : 'Creating...')
              : (isEditing ? 'Save Changes' : 'Create Event')
            }
          </button>
        </div>
      }
    >
      <div className="space-y-4 p-4" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
        {/* Event Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter event name"
          className="w-full text-base font-medium rounded-lg px-3 py-2.5"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            outline: 'none',
          }}
          autoFocus
        />

        {/* Date & Time Section Card */}
        <SectionCard title="Date & Time" icon={Clock}>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <span style={{ color: 'var(--color-text-primary)' }}>All day</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isMultiDay}
                onChange={(e) => {
                  setIsMultiDay(e.target.checked)
                  if (!e.target.checked) setEndDate('')
                }}
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <span style={{ color: 'var(--color-text-primary)' }}>Multi-day</span>
            </label>
          </div>
          <div className={`grid gap-3 ${isAllDay && !isMultiDay ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                {isMultiDay ? 'Start Date' : 'Date'}
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              />
            </div>
            {isMultiDay && (
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={eventDate || undefined}
                  className="w-full text-sm rounded-lg px-3 py-2"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                />
              </div>
            )}
            {!isAllDay && (
              <>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-sm rounded-lg px-3 py-2"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-sm rounded-lg px-3 py-2"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </>
            )}
          </div>
        </SectionCard>

        {/* Location */}
        <div className="flex items-center gap-2">
          <MapPin size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="flex-1 text-sm rounded-lg px-3 py-2"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          />
        </div>

        {/* Description */}
        <div className="flex items-start gap-2">
          <FileText size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: '8px' }} />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="flex-1 text-sm rounded-lg px-3 py-2 resize-none"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          />
        </div>

        {/* Recurrence — Universal Scheduler */}
        <SectionCard title="How Often?" icon={Repeat}>
          <UniversalScheduler
            value={scheduleValue}
            onChange={setScheduleValue}
            showTimeDefault={false}
            compactMode
          />
        </SectionCard>

        {/* Who's Involved */}
        {familyMembers && familyMembers.length > 0 && (
          <SectionCard title="Who's Involved?" icon={Users}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {/* Everyone pill */}
              {familyMembers.length > 1 && (() => {
                const allSelected = familyMembers.every(m => attendees.has(m.id))
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setAttendees(prev => {
                        if (allSelected) return new Map()
                        const next = new Map(prev)
                        for (const m of familyMembers) {
                          if (!next.has(m.id)) next.set(m.id, 'attending')
                        }
                        return next
                      })
                    }}
                    className="rounded-full text-xs font-semibold transition-all duration-150"
                    style={{
                      padding: '0.375rem 0.75rem',
                      backgroundColor: allSelected ? 'var(--color-btn-primary-bg)' : 'transparent',
                      color: allSelected ? 'var(--color-btn-primary-text, #fff)' : 'var(--color-text-primary)',
                      border: `2px solid ${allSelected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                      cursor: 'pointer',
                      minHeight: 'unset',
                      lineHeight: 1.2,
                    }}
                  >
                    Everyone
                  </button>
                )
              })()}
              {familyMembers.map(m => {
                const isSelected = attendees.has(m.id)
                const color = m.assigned_color || m.member_color || 'var(--color-btn-primary-bg)'
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleAttendee(m.id)}
                    className="rounded-full text-xs font-semibold transition-all duration-150"
                    style={{
                      padding: '0.375rem 0.75rem',
                      backgroundColor: isSelected ? color : 'transparent',
                      color: isSelected ? 'var(--color-bg-card, #fff)' : 'var(--color-text-primary)',
                      border: `2px solid ${color}`,
                      cursor: 'pointer',
                      minHeight: 'unset',
                      lineHeight: 1.2,
                      opacity: isSelected ? 1 : 0.7,
                    }}
                  >
                    {m.display_name.split(' ')[0]}
                  </button>
                )
              })}
            </div>
            {/* Role selectors for selected attendees */}
            {attendees.size > 0 && (
              <div className="mt-2 space-y-1">
                {familyMembers.filter(m => attendees.has(m.id)).map(m => {
                  const role = attendees.get(m.id) ?? 'attending'
                  const color = m.assigned_color || m.member_color || 'var(--color-btn-primary-bg)'
                  return (
                    <div key={m.id} className="flex items-center gap-2">
                      <span className="text-xs font-medium" style={{ color, minWidth: '4rem' }}>
                        {m.display_name.split(' ')[0]}
                      </span>
                      <select
                        value={role}
                        onChange={(e) => setAttendeeRole(m.id, e.target.value)}
                        className="text-xs rounded px-1.5 py-0.5"
                        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', minHeight: 'unset' }}
                      >
                        <option value="attending">Attending</option>
                        <option value="driving">Driving</option>
                        <option value="requested_presence">Requested</option>
                      </select>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* Transportation & Logistics */}
        <SectionCard title="Transportation" icon={Car} collapsed>
          <label className="flex items-center gap-2 text-sm mb-2 cursor-pointer">
            <input
              type="checkbox"
              checked={transportationNeeded}
              onChange={(e) => setTransportationNeeded(e.target.checked)}
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            <span style={{ color: 'var(--color-text-primary)' }}>Transportation needed</span>
          </label>
          {transportationNeeded && (
            <div className="space-y-2 pl-6">
              {leaveByTime && (
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Leave by: <strong>{leaveByTime}</strong> (based on {settings?.default_drive_time_minutes} min drive)
                </p>
              )}
              <input
                value={transportationNotes}
                onChange={(e) => setTransportationNotes(e.target.value)}
                placeholder="Who's driving? Carpool details?"
                className="w-full text-sm rounded-lg px-3 py-2"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              />
            </div>
          )}

          {/* Items to bring */}
          <div className="mt-3">
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Items to bring</p>
            {itemsToBring.map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>{item.text}</span>
                <button
                  onClick={() => removeItem(i)}
                  className="text-xs"
                  style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
                >
                  remove
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <input
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addItem() }}
                placeholder="Add item..."
                className="flex-1 text-sm rounded px-2 py-1"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              />
              <button
                onClick={addItem}
                className="text-xs px-2 py-1 rounded"
                style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', minHeight: 'unset', cursor: 'pointer' }}
              >
                Add
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Category */}
        <div className="flex items-center gap-2">
          <Tag size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex-1 text-sm rounded-lg px-3 py-2"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          >
            <option value="">Category (optional)</option>
            {(categories ?? []).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Reminders */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bell size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Reminders</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {REMINDER_OPTIONS.map(opt => {
              const isSelected = selectedReminders.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleReminder(opt.value)}
                  className="text-xs rounded-full px-2.5 py-1 transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                    color: isSelected ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                    border: isSelected ? 'none' : '1px solid var(--color-border)',
                    minHeight: 'unset',
                    cursor: 'pointer',
                  }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div className="flex items-start gap-2">
          <FileText size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: '8px' }} />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes for mom (optional)"
            rows={2}
            className="flex-1 text-sm rounded-lg px-3 py-2 resize-none"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
          />
        </div>

        {/* Penciled In toggle */}
        <div className="flex items-center gap-2">
          <Pencil size={16} style={{ color: isPenciledIn ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)', flexShrink: 0 }} />
          <label className="flex items-center gap-2 flex-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isPenciledIn}
              onChange={(e) => setIsPenciledIn(e.target.checked)}
              className="rounded"
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Tentative
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              (I'll confirm later)
            </span>
          </label>
        </div>

        {/* Hub visibility — PRD-14D */}
        <div className="flex items-center gap-2">
          <Home size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <label className="flex items-center gap-2 flex-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnHub}
              onChange={(e) => setShowOnHub(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Show on Family Hub
            </span>
          </label>
        </div>
      </div>
    </ModalV2>
  )
}

// ─── Section Card ────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
  collapsed: defaultCollapsed,
}: {
  title: string
  icon: React.ComponentType<{ size: number }>
  children: React.ReactNode
  collapsed?: boolean
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed ?? false)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)',
        border: '1px solid var(--color-border)',
      }}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 w-full px-3 py-2.5 text-left"
        style={{ background: 'transparent', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
      >
        <Icon size={16} />
        <span
          className="text-sm font-semibold flex-1"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          {title}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {isCollapsed ? '+' : '-'}
        </span>
      </button>
      {!isCollapsed && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  )
}
