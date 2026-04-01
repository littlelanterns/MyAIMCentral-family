import { useState } from 'react'
import { Clock, ChevronDown } from 'lucide-react'
import { usePastResponses, REFLECTION_CATEGORIES } from '@/hooks/useReflections'

interface ReflectionsPastTabProps {
  memberId: string
}

const PAGE_SIZE = 50

export function ReflectionsPastTab({ memberId }: ReflectionsPastTabProps) {
  const [offset, setOffset] = useState(0)
  const { data: responses = [], isLoading } = usePastResponses(memberId, PAGE_SIZE, offset)

  if (isLoading && offset === 0) {
    return <p className="text-sm py-4" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
  }

  if (responses.length === 0 && offset === 0) {
    return (
      <div
        className="p-8 rounded-lg text-center"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <Clock size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>
          No past reflections yet. Answer some questions in the Today tab to see your history here.
        </p>
      </div>
    )
  }

  // Group by date
  const grouped = groupByDate(responses)

  return (
    <div className="space-y-4">
      {grouped.map(({ date, entries }) => (
        <div key={date}>
          <p
            className="text-xs font-medium mb-2 px-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {date}
          </p>
          <div className="space-y-2">
            {entries.map(r => {
              const categoryLabel = REFLECTION_CATEGORIES.find(c => c.value === r.reflection_prompts.category)?.label
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    className="text-xs font-medium mb-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {r.reflection_prompts.prompt_text}
                  </p>
                  <p
                    className="text-sm whitespace-pre-wrap"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {r.response_text}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {categoryLabel && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {categoryLabel}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Load more */}
      {responses.length === PAGE_SIZE && (
        <div className="text-center pt-2">
          <button
            onClick={() => setOffset(prev => prev + PAGE_SIZE)}
            className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <ChevronDown size={14} />
            Load More
          </button>
        </div>
      )}
    </div>
  )
}

interface GroupedResponses {
  date: string
  entries: {
    id: string
    response_text: string
    created_at: string
    reflection_prompts: { prompt_text: string; category: string }
  }[]
}

function groupByDate(responses: {
  id: string
  response_date: string
  response_text: string
  created_at: string
  reflection_prompts: { prompt_text: string; category: string }
}[]): GroupedResponses[] {
  const groups: Record<string, GroupedResponses['entries']> = {}
  for (const r of responses) {
    const date = new Date(r.response_date + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(r)
  }
  return Object.entries(groups).map(([date, entries]) => ({ date, entries }))
}
