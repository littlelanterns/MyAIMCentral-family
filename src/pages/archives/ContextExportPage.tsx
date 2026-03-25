/**
 * ContextExportPage — PRD-13
 * Screen 6: /archives/export
 * Generates Markdown exports of family context.
 * Supports exporting everything, specific members, or specific folders.
 */

import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Copy,
  FileText,
  Check,
  Users,
  FolderOpen,
} from 'lucide-react'
import {
  Card,
  Badge,
  LoadingSpinner,
  EmptyState,
} from '@/components/shared'
import { PermissionGate } from '@/lib/permissions/PermissionGate'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useContextExport, useArchiveFolders } from '@/hooks/useArchives'
import { useRoutingToast } from '@/components/shared'

// ---------------------------------------------------------------------------
// Scope types
// ---------------------------------------------------------------------------

type ExportScope = 'everything' | 'people' | 'folders'

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function ContextExportPage() {
  const navigate = useNavigate()
  const { data: member, isLoading: memberLoading } = useFamilyMember()
  const { data: family, isLoading: familyLoading } = useFamily()
  const familyId = family?.id

  const { data: allMembers = [], isLoading: membersLoading } = useFamilyMembers(familyId)
  const { data: folderData, isLoading: foldersLoading } = useArchiveFolders(familyId)
  const { exportAll, exportByMember, exportByFolder } = useContextExport(familyId)
  const toast = useRoutingToast()

  const [scope, setScope] = useState<ExportScope>('everything')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [preview, setPreview] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const activeMembers = useMemo(
    () => allMembers.filter((m) => m.is_active),
    [allMembers],
  )

  const folders = folderData?.folders ?? []

  const isLoading = memberLoading || familyLoading || membersLoading || foldersLoading

  // Toggle helpers
  function toggleMember(memberId: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }
      return next
    })
  }

  function toggleFolder(folderId: string) {
    setSelectedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  // Generate preview
  const generatePreview = useCallback(async () => {
    setIsGenerating(true)
    setPreview('')

    try {
      let md = ''

      if (scope === 'everything') {
        md = await exportAll()
      } else if (scope === 'people') {
        for (const memberId of selectedMembers) {
          const memberMd = await exportByMember(memberId)
          md += memberMd + '\n---\n\n'
        }
      } else if (scope === 'folders') {
        for (const folderId of selectedFolders) {
          const folderMd = await exportByFolder(folderId)
          md += folderMd + '\n'
        }
      }

      setPreview(md || '(No context items found for the selected scope.)')
    } catch (err) {
      setPreview('Error generating export. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [scope, selectedMembers, selectedFolders, exportAll, exportByMember, exportByFolder])

  // Copy to clipboard
  async function handleCopy() {
    if (!preview) return
    try {
      await navigator.clipboard.writeText(preview)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = preview
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Download as file
  function handleDownload() {
    if (!preview) return
    const blob = new Blob([preview], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `family-context-export-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Open in Notepad — STUB
  function handleOpenInNotepad() {
    toast.show({
      message: 'Smart Notepad integration coming soon',
      onUndo: () => {},
    })
  }

  // Determine if generate button should be enabled
  const canGenerate =
    scope === 'everything' ||
    (scope === 'people' && selectedMembers.size > 0) ||
    (scope === 'folders' && selectedFolders.size > 0)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <PermissionGate featureKey="archives_context_export">
      <div className="max-w-3xl mx-auto space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/archives')}
            className="p-2 rounded-lg transition-colors hidden md:flex"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Back to Archives"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1">
            <h1
              className="text-2xl font-bold"
              style={{
                color: 'var(--color-text-heading)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Export Family Context
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              Generate a Markdown export of your family's context data.
            </p>
          </div>
        </div>

        {/* Scope Selector */}
        <Card padding="lg">
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Export Scope
          </h2>

          <div className="space-y-3">
            {/* Everything */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="everything"
                checked={scope === 'everything'}
                onChange={() => setScope('everything')}
                className="w-4 h-4"
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <div className="flex items-center gap-2">
                <Users size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  Export everything
                </span>
              </div>
            </label>

            {/* Specific people */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="people"
                checked={scope === 'people'}
                onChange={() => setScope('people')}
                className="w-4 h-4"
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                Select specific people
              </span>
            </label>

            {scope === 'people' && (
              <div className="ml-7 space-y-2">
                {activeMembers.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(m.id)}
                      onChange={() => toggleMember(m.id)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {m.display_name}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {/* Specific folders */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="folders"
                checked={scope === 'folders'}
                onChange={() => setScope('folders')}
                className="w-4 h-4"
                style={{ accentColor: 'var(--color-btn-primary-bg)' }}
              />
              <div className="flex items-center gap-2">
                <FolderOpen size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  Select specific folders
                </span>
              </div>
            </label>

            {scope === 'folders' && (
              <div className="ml-7 space-y-2 max-h-48 overflow-y-auto">
                {folders.map((f) => (
                  <label
                    key={f.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFolders.has(f.id)}
                      onChange={() => toggleFolder(f.id)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {f.folder_name}
                    </span>
                  </label>
                ))}
                {folders.length === 0 && (
                  <p
                    className="text-xs italic"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    No folders found.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Generate button */}
          <div className="mt-4">
            <button
              onClick={generatePreview}
              disabled={!canGenerate || isGenerating}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {isGenerating ? 'Generating...' : 'Generate Preview'}
            </button>
          </div>
        </Card>

        {/* Preview Pane */}
        {(preview || isGenerating) && (
          <Card padding="lg">
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-heading)' }}
              >
                Preview
              </h2>
              {preview && (
                <Badge variant="default" size="sm">
                  {preview.split('\n').length} lines
                </Badge>
              )}
            </div>

            {isGenerating ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div
                className="max-h-96 overflow-y-auto rounded-lg p-4"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <pre
                  className="text-xs leading-relaxed whitespace-pre-wrap break-words"
                  style={{
                    color: 'var(--color-text-primary)',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  }}
                >
                  {preview}
                </pre>
              </div>
            )}

            {/* Action buttons */}
            {preview && !isGenerating && (
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                    color: 'var(--color-btn-primary-text)',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy to Clipboard'}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-btn-primary-bg)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <Download size={14} />
                  Download as File
                </button>

                <button
                  onClick={handleOpenInNotepad}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <FileText size={14} />
                  Open in Notepad
                </button>
              </div>
            )}
          </Card>
        )}
      </div>
    </PermissionGate>
  )
}
