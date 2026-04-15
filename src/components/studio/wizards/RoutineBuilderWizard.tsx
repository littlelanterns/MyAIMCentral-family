/**
 * RoutineBuilderWizard — Guided routine creation via AI brain dump.
 *
 * Steps: Describe → AI Parse → Review → opens TaskCreationModal with sections pre-loaded.
 *
 * This wizard wraps the existing RoutineBrainDump component in a friendlier
 * step-by-step flow, then hands off to TaskCreationModal for assignment + deploy.
 */

import { useState, useCallback } from 'react'
import { ListChecks, Sparkles, Loader } from 'lucide-react'
import { SetupWizard, type WizardStep } from './SetupWizard'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'
import type { RoutineSection, SectionFrequency } from '@/components/tasks/RoutineSectionEditor'

// Same AI prompt as RoutineBrainDump — keep them in sync
const SYSTEM_PROMPT = `You are an AI assistant that helps organize household routines. A mom is describing a routine the way she'd explain it to her kids — naturally, conversationally, maybe a little scattered. Your job is to organize this into structured sections grouped by frequency.

RULES:
1. Group steps by HOW OFTEN they happen. Each unique frequency becomes its own section.
2. Detect frequency from natural language. Day numbers: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday.
   - "every day", "daily", "each day" → frequency: "daily"
   - "weekdays", "school days", "Monday through Friday" → frequency: "weekdays"
   - "MWF", "Monday Wednesday Friday" → frequency: "mwf"
   - "Tuesday Thursday", "T/Th" → frequency: "t_th"
   - "weekly", "once a week" → frequency: "weekly"
   - "monthly", "once a month" → frequency: "monthly"
   - A SINGLE day header like "Monday" → frequency: "custom", customDays: [1]
   - Multiple specific days → frequency: "custom", customDays: [day numbers]
3. If no frequency is mentioned for a step, default to "daily".
4. When a section is "weekly" or "1x/week", set frequency: "custom", customDays: [1,2,3,4,5,6] AND showUntilComplete: true.
5. Keep step titles SHORT and actionable — like a checklist item a kid can understand.
6. If a step has notes, put them in the "notes" field, keeping the title short.
7. instanceCount > 1 when a step should be done multiple times.

Return ONLY a JSON array of section objects:
{
  "name": "Section Name",
  "frequency": "daily" | "weekdays" | "mwf" | "t_th" | "weekly" | "monthly" | "custom",
  "customDays": [0,1,2,3,4,5,6],
  "showUntilComplete": false,
  "steps": [
    { "title": "Step name", "notes": "", "instanceCount": 1 }
  ]
}

No markdown, no explanation — ONLY the JSON array.`

interface ParsedSection {
  name: string
  frequency: SectionFrequency
  customDays?: number[]
  showUntilComplete: boolean
  steps: { title: string; notes: string; instanceCount: number }[]
}

const STEPS: WizardStep[] = [
  { key: 'describe', title: 'Describe' },
  { key: 'preview', title: 'Review' },
]

const EXAMPLE_ROUTINES = [
  {
    label: 'Morning Routine',
    text: 'Every morning: make bed, brush teeth, get dressed, eat breakfast, pack backpack. On school days also: pack lunch, check homework folder.',
  },
  {
    label: 'Bedroom Clean-Up',
    text: 'Daily: make bed, pick up clothes, clear nightstand. Weekly (show until done): vacuum floor, dust shelves, organize closet. Monthly (show until done): deep clean under bed, rotate seasonal clothes.',
  },
  {
    label: 'Kitchen Duties',
    text: 'Every day: wipe counters, load dishwasher, sweep floor. Tuesday and Thursday: mop kitchen floor. Weekly: clean out fridge, wipe cabinet fronts.',
  },
]

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

const FREQ_LABELS: Record<SectionFrequency, string> = {
  daily: 'Daily',
  weekdays: 'Weekdays',
  mwf: 'MWF',
  t_th: 'Tue/Thu',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom',
}

const DAY_LABELS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']

interface RoutineBuilderWizardProps {
  isOpen: boolean
  onClose: () => void
  /** Called with the parsed sections when the user accepts. The parent should open TaskCreationModal with these pre-loaded. */
  onAccept: (routineName: string, sections: RoutineSection[]) => void
}

export function RoutineBuilderWizard({
  isOpen,
  onClose,
  onAccept,
}: RoutineBuilderWizardProps) {
  const [step, setStep] = useState(0)
  const [routineName, setRoutineName] = useState('')
  const [inputText, setInputText] = useState('')
  const [parsedSections, setParsedSections] = useState<ParsedSection[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep(0)
    setRoutineName('')
    setInputText('')
    setParsedSections([])
    setIsParsing(false)
    setParseError(null)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const handleParse = useCallback(async () => {
    if (!inputText.trim()) return
    setIsParsing(true)
    setParseError(null)

    try {
      const response = await sendAIMessage(
        SYSTEM_PROMPT,
        [{ role: 'user', content: inputText }],
        2000,
        'haiku',
      )

      const sections = extractJSON<ParsedSection[]>(response)
      if (!sections || !Array.isArray(sections) || sections.length === 0) {
        setParseError('Could not parse the routine. Try describing it differently.')
        return
      }
      setParsedSections(sections)
      setStep(1)
    } catch (err) {
      console.error('[RoutineBuilderWizard] Parse error:', err)
      setParseError('Something went wrong parsing your routine. Try again.')
    } finally {
      setIsParsing(false)
    }
  }, [inputText])

  const handleAccept = useCallback(() => {
    // Convert parsed sections to RoutineSection format
    const routineSections: RoutineSection[] = parsedSections.map((sec, i) => ({
      id: generateId(),
      name: sec.name,
      frequency: sec.frequency,
      customDays: sec.customDays ?? [],
      showUntilComplete: sec.showUntilComplete,
      sort_order: i,
      isEditing: false,
      steps: sec.steps.map((st, j) => ({
        id: generateId(),
        title: st.title,
        notes: st.notes || '',
        showNotes: !!st.notes,
        instanceCount: st.instanceCount ?? 1,
        requirePhoto: false,
        sort_order: j,
        step_type: 'static' as const,
        linked_source_id: null,
        linked_source_type: null,
        display_name_override: null,
      })),
    }))

    const name = routineName.trim() || 'My Routine'
    onAccept(name, routineSections)
    handleClose()
  }, [parsedSections, routineName, onAccept, handleClose])

  const removeSection = useCallback((index: number) => {
    setParsedSections(prev => prev.filter((_, i) => i !== index))
  }, [])

  const removeStep = useCallback((sectionIdx: number, stepIdx: number) => {
    setParsedSections(prev => prev.map((sec, i) =>
      i === sectionIdx
        ? { ...sec, steps: sec.steps.filter((_, j) => j !== stepIdx) }
        : sec
    ))
  }, [])

  const totalSteps = parsedSections.reduce((sum, s) => sum + s.steps.length, 0)

  return (
    <SetupWizard
      id="routine-builder-wizard"
      isOpen={isOpen}
      onClose={handleClose}
      title="Routine Builder"
      subtitle="Describe it once, we'll organize it"
      steps={STEPS}
      currentStep={step}
      onBack={() => setStep(0)}
      onNext={handleParse}
      onFinish={handleAccept}
      canAdvance={inputText.trim().length > 10}
      canFinish={parsedSections.length > 0 && totalSteps > 0}
      finishLabel="Use This Routine"
    >
      {/* Step 1: Describe */}
      {step === 0 && (
        <div>
          <div className="mb-3">
            <label className="text-sm font-medium block mb-1.5" style={{ color: 'var(--color-text-primary)' }}>
              Routine Name
            </label>
            <input
              type="text"
              value={routineName}
              onChange={e => setRoutineName(e.target.value)}
              placeholder="e.g., Morning Routine, Bedroom Clean-Up"
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            />
          </div>

          <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-primary)' }}>
            Describe the routine in your own words
          </label>
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-muted)' }}>
            This is the same Routine Brain Dump AI you'll find inside the routine editor. After
            we organize it, you'll finish setup in the full Routine Creator where you can
            fine-tune sections, assign to kids, and add linked content.
          </p>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Just describe it the way you'd tell your kids. We'll organize it into sections with the right schedule for each part..."
            rows={6}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none resize-none"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
            autoFocus
          />

          {parseError && (
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-error, #dc2626)' }}>
              {parseError}
            </p>
          )}

          {/* Example routines */}
          <div className="mt-4">
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Try an example:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_ROUTINES.map(ex => (
                <button
                  key={ex.label}
                  onClick={() => {
                    setInputText(ex.text)
                    setRoutineName(ex.label)
                  }}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>

          {isParsing && (
            <div className="flex items-center gap-2 mt-4" style={{ color: 'var(--color-text-secondary)' }}>
              <Loader size={16} className="animate-spin" />
              <span className="text-sm">Organizing your routine...</span>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review parsed sections */}
      {step === 1 && (
        <div>
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {parsedSections.length} section{parsedSections.length !== 1 ? 's' : ''} with {totalSteps} steps.
            Remove anything that doesn't belong, then continue to assign and deploy.
          </p>

          <div className="space-y-3">
            {parsedSections.map((section, si) => (
              <div
                key={si}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}
              >
                {/* Section header */}
                <div
                  className="flex items-center gap-2 px-3 py-2.5"
                  style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                >
                  <ListChecks size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
                  <span className="text-sm font-semibold flex-1" style={{ color: 'var(--color-text-heading)' }}>
                    {section.name}
                  </span>
                  <span
                    className="text-xs rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
                      color: 'var(--color-btn-primary-bg)',
                    }}
                  >
                    {FREQ_LABELS[section.frequency]}
                    {section.frequency === 'custom' && section.customDays?.length
                      ? `: ${section.customDays.map(d => DAY_LABELS[d]).join(', ')}`
                      : ''
                    }
                  </span>
                  {section.showUntilComplete && (
                    <span
                      className="text-xs rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 12%, transparent)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      Until done
                    </span>
                  )}
                  <button
                    onClick={() => removeSection(si)}
                    className="p-1 rounded hover:opacity-70"
                    style={{ color: 'var(--color-text-muted)' }}
                    title="Remove section"
                  >
                    <span className="text-xs">Remove</span>
                  </button>
                </div>

                {/* Steps */}
                <div className="px-3 py-2 space-y-1">
                  {section.steps.map((st, sti) => (
                    <div
                      key={sti}
                      className="flex items-start gap-2 py-1 group"
                    >
                      <div
                        className="w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sti + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {st.title}
                        </span>
                        {st.notes && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                            {st.notes}
                          </p>
                        )}
                        {st.instanceCount > 1 && (
                          <span className="text-xs ml-1" style={{ color: 'var(--color-text-muted)' }}>
                            (x{st.instanceCount})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeStep(si, sti)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
                        style={{ color: 'var(--color-text-muted)' }}
                        title="Remove step"
                      >
                        <span className="text-xs">x</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(0)}
            className="flex items-center gap-1.5 mt-4 text-xs font-medium"
            style={{ color: 'var(--color-btn-primary-bg)' }}
          >
            <Sparkles size={14} />
            Re-parse from scratch
          </button>
        </div>
      )}
    </SetupWizard>
  )
}
