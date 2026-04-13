/**
 * RoutineBrainDump — "Explain it once" routine builder
 *
 * Mom types or dictates a routine the way she'd explain it to her kids.
 * AI parses it into structured sections with frequencies and steps.
 * Preview shows the result as editable cards. Accept populates the RoutineSectionEditor.
 *
 * Uses the same ai-parse Edge Function and BulkAddWithAI patterns.
 */

import { useState, useCallback } from 'react'
import { X, Loader, Sparkles, ChevronDown, ChevronUp, Plus, Trash2, Check, RotateCcw } from 'lucide-react'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'
import { Button, Tooltip } from '@/components/shared'
import type { RoutineSection, SectionFrequency } from './RoutineSectionEditor'

// ─── AI Prompt ──────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an AI assistant that helps organize household routines. A mom is describing a routine the way she'd explain it to her kids — naturally, conversationally, maybe a little scattered. Your job is to organize this into structured sections grouped by frequency.

RULES:
1. Group steps by HOW OFTEN they happen. Each unique frequency becomes its own section.
2. Detect frequency from natural language. Day numbers: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday.
   - "every day", "daily", "each day" → frequency: "daily"
   - "weekdays", "school days", "Monday through Friday" → frequency: "weekdays"
   - "Mon–Sat", "Monday through Saturday", "Mon-Sat" → frequency: "custom", customDays: [1,2,3,4,5,6]
   - "MWF", "Monday Wednesday Friday", "Mon Wed Fri" → frequency: "mwf"
   - "Tuesday Thursday", "T/Th", "Tue Thu" → frequency: "t_th"
   - "weekly", "once a week", "every week", "1x/week" → frequency: "weekly"
   - "monthly", "once a month" → frequency: "monthly"
   - A SINGLE day header like "Monday" or "🗓️ Tuesday" → frequency: "custom", customDays: [that day's number]. Example: "Monday" → customDays: [1], "Thursday" → customDays: [4]
   - Multiple specific days like "Monday and Friday" or "Tue, Thu, Sat" → frequency: "custom", customDays: [array of day numbers]
   - Day ranges like "Tue, Wed, Sat" → frequency: "custom", customDays: [2,3,6]
3. If no frequency is mentioned for a step, default to "daily".
4. When a section is "weekly" or "1x/week" or "once a week" (meaning it needs to get done sometime during the week but not on a specific day), set BOTH frequency: "custom", customDays: [1,2,3,4,5,6] AND showUntilComplete: true. This makes the task show up every day until it's checked off, giving flexibility to choose when.
5. Also detect explicit "show until complete" / "keep showing until done" / "don't clear until finished" / "stays until checked off" → showUntilComplete: true.
6. If a step has instructions or notes (like "use the blue spray" or "make sure to get behind the toilet"), put those in the step's "notes" field, keeping the step title short and actionable.
7. If a step should be done multiple times (like "do 3 sets" or "wipe each sink" when there are 2 sinks), set instanceCount to that number.
8. Give each section a descriptive name based on its frequency (e.g., "Every Day (Mon–Sat)", "Monday", "Tuesday", "Weekly (anytime)").
9. Keep step titles SHORT and actionable — like a checklist item a kid can understand.
10. If the input contains a summary table at the end (like "Rotating Weekly Focus Summary" or a table with columns), IGNORE IT. Only parse the actual day-by-day task descriptions above the table.
11. Emoji headers like 🧹 or 🗓️ are just formatting — parse the text after them normally.

Return ONLY a JSON array of section objects. Each section:
{
  "name": "Section Name",
  "frequency": "daily" | "weekdays" | "mwf" | "t_th" | "weekly" | "monthly" | "custom",
  "customDays": [0,1,2,3,4,5,6],  // REQUIRED when frequency is "custom"
  "showUntilComplete": false,
  "steps": [
    { "title": "Step name", "notes": "", "instanceCount": 1 }
  ]
}

No markdown, no explanation — ONLY the JSON array.`

// ─── Types ──────────────────────────────────────────────────

interface ParsedSection {
  name: string
  frequency: SectionFrequency
  customDays?: number[]
  showUntilComplete: boolean
  steps: { title: string; notes: string; instanceCount: number }[]
}

interface RoutineBrainDumpProps {
  onAccept: (sections: RoutineSection[]) => void
  onClose: () => void
  /** If true, sections will be appended to existing ones instead of replacing */
  appendMode?: boolean
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

// ─── Preview Section Card ───────────────────────────────────

const FREQ_LABELS: Record<SectionFrequency, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  mwf: 'MWF',
  t_th: 'Tue & Thu',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom days',
}

const DAY_LABELS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']

function PreviewSectionCard({
  section,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  section: ParsedSection
  index: number
  total: number
  onUpdate: (s: ParsedSection) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [expanded, setExpanded] = useState(true)

  const updateStep = (stepIdx: number, field: string, value: unknown) => {
    const steps = [...section.steps]
    steps[stepIdx] = { ...steps[stepIdx], [field]: value }
    onUpdate({ ...section, steps })
  }

  const removeStep = (stepIdx: number) => {
    onUpdate({ ...section, steps: section.steps.filter((_, i) => i !== stepIdx) })
  }

  const addStep = () => {
    onUpdate({
      ...section,
      steps: [...section.steps, { title: '', notes: '', instanceCount: 1 }],
    })
  }

  return (
    <div
      style={{
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div
        className="flex items-center gap-2"
        style={{
          padding: '0.625rem 0.75rem',
          backgroundColor: 'var(--color-bg-secondary)',
          borderBottom: expanded ? '1px solid var(--color-border)' : undefined,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={section.name}
            onChange={(e) => { e.stopPropagation(); onUpdate({ ...section, name: e.target.value }) }}
            onClick={(e) => e.stopPropagation()}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              color: 'var(--color-text-heading)',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              fontWeight: 600,
              width: '100%',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 'var(--font-size-xs, 0.75rem)',
            color: 'var(--color-text-secondary)',
            whiteSpace: 'nowrap',
          }}
        >
          {FREQ_LABELS[section.frequency] || section.frequency}
          {section.showUntilComplete ? ' · until done' : ''}
        </span>
        <span style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
          {section.steps.length} step{section.steps.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <Tooltip content="Move up">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={index === 0}
              style={{
                padding: '0.25rem',
                background: 'transparent',
                border: 'none',
                cursor: index === 0 ? 'not-allowed' : 'pointer',
                color: index === 0 ? 'var(--color-border)' : 'var(--color-text-secondary)',
                borderRadius: '4px',
              }}
            >
              <ChevronUp size={13} />
            </button>
          </Tooltip>
          <Tooltip content="Move down">
            <button
              type="button"
              onClick={onMoveDown}
              disabled={index === total - 1}
              style={{
                padding: '0.25rem',
                background: 'transparent',
                border: 'none',
                cursor: index === total - 1 ? 'not-allowed' : 'pointer',
                color: index === total - 1 ? 'var(--color-border)' : 'var(--color-text-secondary)',
                borderRadius: '4px',
              }}
            >
              <ChevronDown size={13} />
            </button>
          </Tooltip>
          <Tooltip content="Remove section">
            <button
              type="button"
              onClick={onRemove}
              style={{
                padding: '0.25rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                borderRadius: '4px',
              }}
            >
              <X size={13} />
            </button>
          </Tooltip>
        </div>
        {expanded ? <ChevronUp size={14} style={{ color: 'var(--color-text-secondary)' }} /> : <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} />}
      </div>

      {/* Section config */}
      {expanded && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 4%, var(--color-bg-card))',
          }}
          className="flex items-center gap-3 flex-wrap"
        >
          <select
            value={section.frequency}
            onChange={(e) => onUpdate({ ...section, frequency: e.target.value as SectionFrequency })}
            style={{
              padding: '0.375rem 0.5rem',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              minHeight: '36px',
            }}
          >
            <option value="daily">Daily</option>
            <option value="weekdays">Weekdays</option>
            <option value="mwf">MWF</option>
            <option value="t_th">Tue & Thu</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom days</option>
          </select>

          {section.frequency === 'custom' && (
            <div className="flex gap-1">
              {DAY_LABELS.map((label, dayIdx) => {
                const active = section.customDays?.includes(dayIdx) ?? false
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      const days = active
                        ? (section.customDays ?? []).filter((d) => d !== dayIdx)
                        : [...(section.customDays ?? []), dayIdx]
                      onUpdate({ ...section, customDays: days })
                    }}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      border: `1.5px solid ${active ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                      backgroundColor: active ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                      color: active ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                      fontSize: '10px',
                      fontWeight: active ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={section.showUntilComplete}
              onChange={(e) => onUpdate({ ...section, showUntilComplete: e.target.checked })}
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            <span style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
              Show until done
            </span>
          </label>
        </div>
      )}

      {/* Steps */}
      {expanded && (
        <div style={{ padding: '0.5rem 0.75rem' }} className="space-y-1.5">
          {section.steps.map((step, stepIdx) => (
            <div
              key={stepIdx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.375rem 0.5rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-card)',
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 3,
                  border: '1.5px solid var(--color-border)',
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
              <div className="flex-1 min-w-0 space-y-1">
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStep(stepIdx, 'title', e.target.value)}
                  placeholder="Step name..."
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-primary)',
                    fontSize: 'var(--font-size-sm, 0.875rem)',
                  }}
                />
                {step.notes && (
                  <input
                    type="text"
                    value={step.notes}
                    onChange={(e) => updateStep(stepIdx, 'notes', e.target.value)}
                    style={{
                      width: '100%',
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-secondary)',
                      fontSize: 'var(--font-size-xs, 0.75rem)',
                      fontStyle: 'italic',
                    }}
                  />
                )}
                {step.instanceCount > 1 && (
                  <span style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                    x{step.instanceCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeStep(stepIdx)}
                style={{
                  padding: '0.25rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  borderRadius: '4px',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addStep}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.375rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-btn-primary-bg)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              fontWeight: 500,
            }}
          >
            <Plus size={12} />
            Add step
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────

export function RoutineBrainDump({ onAccept, onClose, appendMode }: RoutineBrainDumpProps) {
  const [inputText, setInputText] = useState('')
  const [parsedSections, setParsedSections] = useState<ParsedSection[]>([])
  const [parsing, setParsing] = useState(false)
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [error, setError] = useState<string | null>(null)

  const handleParse = useCallback(async () => {
    const trimmed = inputText.trim()
    if (!trimmed) return

    setParsing(true)
    setError(null)

    try {
      const response = await sendAIMessage(
        SYSTEM_PROMPT,
        [{ role: 'user', content: trimmed }],
        4096,
        'haiku',
      )

      const parsed = extractJSON<ParsedSection[]>(response)

      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        // Validate and clean up
        const cleaned = parsed
          .filter((s) => s && typeof s === 'object' && Array.isArray(s.steps))
          .map((s) => ({
            name: s.name || 'Untitled',
            frequency: (['daily', 'weekdays', 'mwf', 't_th', 'weekly', 'monthly', 'custom'].includes(s.frequency) ? s.frequency : 'daily') as SectionFrequency,
            customDays: Array.isArray(s.customDays) ? s.customDays.filter((d: unknown) => typeof d === 'number' && d >= 0 && d <= 6) : [],
            showUntilComplete: s.showUntilComplete === true,
            steps: s.steps
              .filter((st: unknown) => st && typeof st === 'object' && 'title' in (st as Record<string, unknown>))
              .map((st: { title?: string; notes?: string; instanceCount?: number }) => ({
                title: String(st.title || '').trim(),
                notes: String(st.notes || '').trim(),
                instanceCount: typeof st.instanceCount === 'number' && st.instanceCount > 1 ? st.instanceCount : 1,
              }))
              .filter((st: { title: string }) => st.title.length > 0),
          }))
          .filter((s) => s.steps.length > 0)

        if (cleaned.length > 0) {
          setParsedSections(cleaned)
          setStep('preview')
          return
        }
      }

      setError('Could not organize the routine. Try adding more detail about what needs to happen and when.')
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.')
    } finally {
      setParsing(false)
    }
  }, [inputText])

  const handleAccept = useCallback(() => {
    // Convert parsed sections to RoutineSection format
    const routineSections: RoutineSection[] = parsedSections.map((section, sIdx) => ({
      id: generateId(),
      name: section.name,
      frequency: section.frequency,
      customDays: section.customDays ?? [],
      showUntilComplete: section.showUntilComplete,
      sort_order: sIdx,
      isEditing: false,
      steps: section.steps.map((step, stIdx) => ({
        id: generateId(),
        title: step.title,
        notes: step.notes,
        showNotes: step.notes.length > 0,
        instanceCount: step.instanceCount,
        requirePhoto: false,
        sort_order: stIdx,
        // Build J: brain-dump generates static steps (no linked content)
        step_type: 'static' as const,
        linked_source_id: null,
        linked_source_type: null,
        display_name_override: null,
      })),
    }))

    onAccept(routineSections)
  }, [parsedSections, onAccept])

  const updateSection = (index: number, updated: ParsedSection) => {
    setParsedSections((prev) => prev.map((s, i) => (i === index ? updated : s)))
  }

  const removeSection = (index: number) => {
    setParsedSections((prev) => prev.filter((_, i) => i !== index))
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1
    if (swapIdx < 0 || swapIdx >= parsedSections.length) return
    setParsedSections((prev) => {
      const next = [...prev]
      ;[next[index], next[swapIdx]] = [next[swapIdx], next[index]]
      return next
    })
  }

  const totalSteps = parsedSections.reduce((sum, s) => sum + s.steps.length, 0)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--surface-primary)',
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--color-btn-primary-text, var(--color-text-heading))' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-btn-primary-text, var(--color-text-heading))' }}>
            Describe Your Routine
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:opacity-70"
          style={{ color: 'var(--color-btn-primary-text, var(--color-text-secondary))', minHeight: 'unset' }}
        >
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 text-sm" style={{ color: 'var(--color-error, #c44)' }}>
          {error}
        </div>
      )}

      {/* Step 1: Brain dump input */}
      {step === 'input' && (
        <div className="p-4 space-y-3">
          <p style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Explain this routine the way you'd explain it to your kids. Include what needs to happen and how often.
            AI will organize it into sections with the right schedules.
          </p>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Example:\n\nEvery day: wipe down the sinks, pick up anything on the floor, and hang up your towel.\n\nTuesday and Thursday: clean the mirrors with the glass spray.\n\nMonday, Wednesday, Friday: scrub the toilets — make sure you get under the rim.\n\nTake out the bathroom trash on Monday and Friday.\n\nOnce a week, scrub the bathtub — this one stays on your list until it's done.`}
            rows={10}
            className="w-full px-3 py-2 rounded-lg text-sm resize-y"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              lineHeight: 1.5,
              minHeight: 'unset',
            }}
            autoFocus
          />

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleParse}
              disabled={!inputText.trim() || parsing}
            >
              {parsing && <Loader size={14} className="animate-spin" />}
              {parsing ? 'Organizing...' : 'Let AI organize this'}
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Preview organized sections */}
      {step === 'preview' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p style={{ fontSize: 'var(--font-size-sm, 0.875rem)', color: 'var(--color-text-secondary)' }}>
              {parsedSections.length} section{parsedSections.length !== 1 ? 's' : ''}, {totalSteps} step{totalSteps !== 1 ? 's' : ''}.
              Edit anything before accepting.
            </p>
          </div>

          <div className="space-y-2 max-h-[450px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {parsedSections.map((section, idx) => (
              <PreviewSectionCard
                key={idx}
                section={section}
                index={idx}
                total={parsedSections.length}
                onUpdate={(s) => updateSection(idx, s)}
                onRemove={() => removeSection(idx)}
                onMoveUp={() => moveSection(idx, 'up')}
                onMoveDown={() => moveSection(idx, 'down')}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleAccept}
              disabled={parsedSections.length === 0}
            >
              <Check size={14} />
              {appendMode ? 'Add these sections' : 'Use this routine'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setStep('input'); setError(null) }}
            >
              <RotateCcw size={14} />
              Start over
            </Button>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
