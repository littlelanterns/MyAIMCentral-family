/**
 * ExportDialog (PRD-23)
 * Modal for exporting book extractions as MD, TXT, or DOCX.
 * Lets user pick which content types to include and choose format.
 */
import { useState, useCallback, useMemo } from 'react'
import { Download, FileText, FileCode, File, BookOpen } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { exportExtractions, type ExportFormat, type ExportTabFilter, type BookExportData } from '@/lib/bookshelfExport'
import type {
  BookShelfItem, BookExtraction,
} from '@/types/bookshelf'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  books: BookShelfItem[]
  summaries: BookExtraction[]
  insights: BookExtraction[]
  declarations: BookExtraction[]
  actionSteps: BookExtraction[]
  questions: BookExtraction[]
}

const FORMAT_OPTIONS: { key: ExportFormat; label: string; icon: typeof FileText }[] = [
  { key: 'epub', label: 'EPUB', icon: BookOpen },
  { key: 'md', label: 'Markdown', icon: FileCode },
  { key: 'txt', label: 'Plain Text', icon: FileText },
  { key: 'docx', label: 'Word (DOCX)', icon: File },
]

const TAB_OPTIONS: { key: keyof ExportTabFilter; label: string }[] = [
  { key: 'summaries', label: 'Summaries' },
  { key: 'insights', label: 'Insights' },
  { key: 'declarations', label: 'Declarations' },
  { key: 'action_steps', label: 'Action Steps' },
  { key: 'questions', label: 'Questions' },
]

export function ExportDialog({
  isOpen, onClose, books, summaries, insights, declarations, actionSteps, questions,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('epub')
  const [tabs, setTabs] = useState<ExportTabFilter>({
    summaries: true, insights: true, declarations: true,
    action_steps: true, questions: true,
  })
  const [mode, setMode] = useState<'all' | 'hearted'>('all')

  const toggleTab = useCallback((key: keyof ExportTabFilter) => {
    setTabs(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  const exportData = useMemo((): BookExportData[] => {
    return books.map(book => {
      const bookLibId = (book as BookShelfItem & { book_library_id?: string }).book_library_id
      const filterByBook = (items: BookExtraction[]) => {
        let filtered = bookLibId
          ? items.filter(i => i.book_library_id === bookLibId)
          : items.filter(i => i.bookshelf_item_id === book.id)
        if (mode === 'hearted') filtered = filtered.filter(i => i.is_hearted)
        return filtered
      }

      return {
        bookTitle: book.title,
        summaries: filterByBook(summaries) as unknown as BookExportData['summaries'],
        insights: filterByBook(insights) as unknown as BookExportData['insights'],
        declarations: filterByBook(declarations) as unknown as BookExportData['declarations'],
        actionSteps: filterByBook(actionSteps) as unknown as BookExportData['actionSteps'],
        questions: filterByBook(questions) as unknown as BookExportData['questions'],
      }
    })
  }, [books, summaries, insights, declarations, actionSteps, questions, mode])

  const totalItems = useMemo(() => {
    return exportData.reduce((sum, d) =>
      sum + d.summaries.length + d.insights.length + d.declarations.length +
      d.actionSteps.length + d.questions.length, 0)
  }, [exportData])

  const handleExport = useCallback(async () => {
    const title = books.length === 1 ? books[0].title : undefined
    await exportExtractions(format, exportData, title, tabs)
    onClose()
  }, [format, exportData, tabs, books, onClose])

  return (
    <ModalV2
      id="export-dialog"
      isOpen={isOpen}
      onClose={onClose}
      title="Export Extractions"
      type="transient"
      size="sm"
    >
      <div className="p-4 space-y-5">
        {/* Format selector */}
        <div>
          <div className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">Format</div>
          <div className="flex gap-2">
            {FORMAT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setFormat(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm ${
                  format === opt.key
                    ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] text-[var(--color-text-primary)]'
                    : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)]'
                }`}
              >
                <opt.icon size={14} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content filter */}
        <div>
          <div className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">Content to include</div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setMode('all')}
              className={`text-xs px-2 py-1 rounded ${mode === 'all' ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)]'}`}
            >
              All items
            </button>
            <button
              onClick={() => setMode('hearted')}
              className={`text-xs px-2 py-1 rounded ${mode === 'hearted' ? 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-secondary)]'}`}
            >
              Hearted only
            </button>
          </div>
          <div className="space-y-1">
            {TAB_OPTIONS.map(opt => (
              <label key={opt.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--color-surface-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={tabs[opt.key] !== false}
                  onChange={() => toggleTab(opt.key)}
                  className="rounded border-[var(--color-border-default)]"
                />
                <span className="text-sm text-[var(--color-text-primary)]">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="text-xs text-[var(--color-text-tertiary)]">
          {totalItems} items from {books.length} book{books.length !== 1 ? 's' : ''}
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={totalItems === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--surface-primary)] text-[var(--color-text-on-primary)] text-sm font-medium disabled:opacity-50"
        >
          <Download size={16} />
          Export as {FORMAT_OPTIONS.find(o => o.key === format)?.label}
        </button>
      </div>
    </ModalV2>
  )
}
