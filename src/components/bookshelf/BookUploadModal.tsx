/**
 * BookUploadModal (PRD-23)
 * File upload flow with drag-and-drop, duplicate detection, queue management,
 * text note creation, and progress tracking.
 */
import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, BookOpen, FileCode, Image, Mic, X, Check, Loader2, AlertTriangle, StickyNote } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useBookUpload } from '@/hooks/useBookUpload'
import type { BookShelfItem } from '@/types/bookshelf'

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(file: File) {
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (file.type.includes('pdf') || ext === 'pdf') return FileText
  if (file.type === 'application/epub+zip' || ext === 'epub') return BookOpen
  if (ext === 'docx') return FileText
  if (ext === 'md') return FileCode
  if (ext === 'txt' || file.type === 'text/plain') return FileText
  if (file.type.startsWith('audio/')) return Mic
  if (file.type.startsWith('image/')) return Image
  return FileText
}

type QueueStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'skipped'

interface QueuedFile {
  file: File
  status: QueueStatus
  error?: string
  duplicate?: BookShelfItem | null
  result?: BookShelfItem | null
}

interface BookUploadModalProps {
  isOpen: boolean
  onClose: () => void
  existingBooks: BookShelfItem[]
  onUploadComplete: () => void
}

export function BookUploadModal({ isOpen, onClose, existingBooks, onUploadComplete }: BookUploadModalProps) {
  const { uploadFile, createTextNote, checkDuplicate, acceptedExtensions, reset: resetUpload } = useBookUpload()
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [processing, setProcessing] = useState(false)
  const [showTextNote, setShowTextNote] = useState(false)
  const [textNoteTitle, setTextNoteTitle] = useState('')
  const [textNoteContent, setTextNoteContent] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((files: FileList | File[]) => {
    const newEntries: QueuedFile[] = Array.from(files).map(file => ({
      file,
      status: 'pending' as const,
      duplicate: checkDuplicate(file.name, existingBooks),
    }))
    setQueue(prev => [...prev, ...newEntries])
  }, [checkDuplicate, existingBooks])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFileSelect(e.target.files)
    e.target.value = ''
  }, [handleFileSelect])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index))
  }, [])

  const processQueue = useCallback(async () => {
    setProcessing(true)
    const pendingIndices = queue
      .map((q, i) => q.status === 'pending' ? i : -1)
      .filter(i => i >= 0)

    for (const idx of pendingIndices) {
      const item = queue[idx]

      // Skip duplicates by default
      if (item.duplicate) {
        setQueue(prev => prev.map((q, i) => i === idx ? { ...q, status: 'skipped' } : q))
        continue
      }

      setQueue(prev => prev.map((q, i) => i === idx ? { ...q, status: 'uploading' } : q))

      const result = await uploadFile(item.file)

      if (result) {
        setQueue(prev => prev.map((q, i) => i === idx ? { ...q, status: 'completed', result } : q))
      } else {
        setQueue(prev => prev.map((q, i) => i === idx ? { ...q, status: 'failed', error: 'Upload failed' } : q))
      }

      resetUpload()
    }

    setProcessing(false)
    onUploadComplete()
  }, [queue, uploadFile, resetUpload, onUploadComplete])

  const handleTextNoteSave = useCallback(async () => {
    if (!textNoteTitle.trim() || !textNoteContent.trim()) return
    setProcessing(true)
    await createTextNote(textNoteTitle.trim(), textNoteContent.trim())
    setShowTextNote(false)
    setTextNoteTitle('')
    setTextNoteContent('')
    setProcessing(false)
    onUploadComplete()
  }, [textNoteTitle, textNoteContent, createTextNote, onUploadComplete])

  const handleClose = useCallback(() => {
    if (!processing) {
      setQueue([])
      setShowTextNote(false)
      setTextNoteTitle('')
      setTextNoteContent('')
      onClose()
    }
  }, [processing, onClose])

  const pendingCount = queue.filter(q => q.status === 'pending' && !q.duplicate).length
  const completedCount = queue.filter(q => q.status === 'completed').length
  const failedCount = queue.filter(q => q.status === 'failed').length

  return (
    <ModalV2
      id="book-upload-modal"
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload to BookShelf"
      type="transient"
      size="lg"
    >
      <div className="p-4 space-y-4">
        {/* Drag-and-drop zone */}
        {!showTextNote && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver
                ? 'border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)]'
                : 'border-[var(--color-border-default)] hover:border-[var(--color-accent)]'
            }`}
          >
            <Upload size={32} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-1">
              Drag files here or click to browse
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              PDF, EPUB, DOCX, TXT, MD, images, audio — up to 75 MB
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-[var(--surface-primary)] text-[var(--color-text-on-primary)] text-sm font-medium"
              >
                Choose Files
              </button>
              <button
                type="button"
                onClick={() => setShowTextNote(true)}
                className="px-4 py-2 rounded-lg border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-sm hover:bg-[var(--color-surface-secondary)]"
              >
                <StickyNote size={14} className="inline mr-1.5" />
                Text Note
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedExtensions}
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Text Note form */}
        {showTextNote && (
          <div className="space-y-3">
            <input
              autoFocus
              value={textNoteTitle}
              onChange={e => setTextNoteTitle(e.target.value)}
              placeholder="Title"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
            />
            <textarea
              value={textNoteContent}
              onChange={e => setTextNoteContent(e.target.value)}
              placeholder="Paste or type your content..."
              rows={8}
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTextNote(false)}
                className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTextNoteSave}
                disabled={!textNoteTitle.trim() || !textNoteContent.trim() || processing}
                className="px-4 py-1.5 rounded-lg bg-[var(--surface-primary)] text-[var(--color-text-on-primary)] text-sm font-medium disabled:opacity-50"
              >
                Save & Process
              </button>
            </div>
          </div>
        )}

        {/* Queue */}
        {queue.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                {queue.length} file{queue.length !== 1 ? 's' : ''} queued
              </span>
              {completedCount > 0 && (
                <span className="text-xs text-[var(--color-success)]">
                  {completedCount} completed
                </span>
              )}
            </div>

            {queue.map((item, idx) => {
              const Icon = getFileIcon(item.file)
              return (
                <div
                  key={`${item.file.name}-${idx}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-surface-secondary)]"
                >
                  <Icon size={16} className="text-[var(--color-text-tertiary)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--color-text-primary)] truncate">{item.file.name}</div>
                    <div className="text-[10px] text-[var(--color-text-tertiary)]">
                      {formatFileSize(item.file.size)}
                      {item.duplicate && <span className="ml-1 text-[var(--color-warning)]">Duplicate — will skip</span>}
                      {item.error && <span className="ml-1 text-[var(--color-error)]">{item.error}</span>}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {item.status === 'pending' && !processing && (
                      <button onClick={() => removeFromQueue(idx)} className="p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]">
                        <X size={14} />
                      </button>
                    )}
                    {item.status === 'uploading' && <Loader2 size={14} className="animate-spin text-[var(--color-accent)]" />}
                    {item.status === 'completed' && <Check size={14} className="text-[var(--color-success)]" />}
                    {item.status === 'failed' && <AlertTriangle size={14} className="text-[var(--color-error)]" />}
                    {item.status === 'skipped' && <span className="text-[10px] text-[var(--color-text-tertiary)]">Skipped</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Actions */}
        {queue.length > 0 && pendingCount > 0 && !processing && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={processQueue}
              className="px-5 py-2 rounded-lg bg-[var(--surface-primary)] text-[var(--color-text-on-primary)] text-sm font-medium"
            >
              Upload {pendingCount} file{pendingCount !== 1 ? 's' : ''}
            </button>
          </div>
        )}

        {/* Summary after processing */}
        {queue.length > 0 && pendingCount === 0 && !processing && (completedCount > 0 || failedCount > 0) && (
          <div className="text-center py-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {completedCount > 0 && `${completedCount} uploaded successfully. `}
              {failedCount > 0 && `${failedCount} failed. `}
              Processing will continue in the background.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-2 px-4 py-1.5 rounded-lg bg-[var(--surface-primary)] text-[var(--color-text-on-primary)] text-sm"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </ModalV2>
  )
}
