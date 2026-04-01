/**
 * useBookUpload (PRD-23)
 * Handles file upload to Supabase Storage → bookshelf_items record creation →
 * triggers bookshelf-process Edge Function for text extraction + chunking.
 * Supports: PDF, EPUB, DOCX, TXT, MD, images, text notes.
 */
import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from './useFamilyMember'
import type { BookFileType, BookShelfItem } from '@/types/bookshelf'

export type UploadStage =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'classifying'
  | 'chunking'
  | 'completed'
  | 'failed'

export interface UploadProgress {
  stage: UploadStage
  detail: string
  percent: number
}

const MIME_OVERRIDES: Record<string, string> = {
  md: 'text/markdown',
  txt: 'text/plain',
  epub: 'application/epub+zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

const ACCEPTED_EXTENSIONS = '.pdf,.epub,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.mp3,.m4a,.wav,.ogg,.webm'

function detectFileType(file: File): BookFileType {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (file.type.includes('pdf') || ext === 'pdf') return 'pdf'
  if (file.type === 'application/epub+zip' || ext === 'epub') return 'epub'
  if (ext === 'docx') return 'docx'
  if (ext === 'md') return 'md'
  if (file.type === 'text/plain' || ext === 'txt') return 'txt'
  if (file.type.startsWith('image/')) return 'image'
  return 'txt'
}

export function useBookUpload() {
  const { data: member } = useFamilyMember()
  const [progress, setProgress] = useState<UploadProgress>({ stage: 'idle', detail: '', percent: 0 })
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef(false)

  const reset = useCallback(() => {
    setProgress({ stage: 'idle', detail: '', percent: 0 })
    setError(null)
    abortRef.current = false
  }, [])

  const abort = useCallback(() => {
    abortRef.current = true
  }, [])

  // Upload a single file
  const uploadFile = useCallback(async (file: File): Promise<BookShelfItem | null> => {
    if (!member) return null
    setError(null)
    abortRef.current = false

    try {
      // Stage 1: Upload to storage
      setProgress({ stage: 'uploading', detail: `Uploading ${file.name}...`, percent: 10 })

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const storagePath = `${member.family_id}/${Date.now()}_${safeName}`
      const ext = file.name.split('.').pop()?.toLowerCase() || ''
      const contentType = MIME_OVERRIDES[ext] || undefined

      let uploadErr: { message: string } | null = null

      if (file.size > 20_000_000) {
        // Signed URL upload for large files
        const { data: signedData, error: signErr } = await supabase.storage
          .from('bookshelf-files')
          .createSignedUploadUrl(storagePath)

        if (signErr || !signedData) {
          uploadErr = signErr || { message: 'Failed to create signed upload URL' }
        } else {
          const { error: putErr } = await supabase.storage
            .from('bookshelf-files')
            .uploadToSignedUrl(storagePath, signedData.token, file, {
              ...(contentType ? { contentType } : {}),
            })
          uploadErr = putErr
        }
      } else {
        const { error: stdErr } = await supabase.storage
          .from('bookshelf-files')
          .upload(storagePath, file, contentType ? { contentType } : undefined)
        uploadErr = stdErr
      }

      if (uploadErr) {
        setError(uploadErr.message)
        setProgress({ stage: 'failed', detail: uploadErr.message, percent: 0 })
        return null
      }

      if (abortRef.current) return null

      // Stage 2: Create bookshelf_items record
      setProgress({ stage: 'uploading', detail: 'Creating record...', percent: 30 })

      const fileType = detectFileType(file)
      const title = file.name.replace(/\.[^.]+$/, '')

      const { data: item, error: insertErr } = await supabase
        .from('bookshelf_items')
        .insert({
          family_id: member.family_id,
          uploaded_by_member_id: member.id,
          title,
          file_type: fileType,
          file_name: file.name,
          storage_path: storagePath,
          file_size_bytes: file.size,
          processing_status: 'pending',
          genres: [],
          tags: [],
        })
        .select('*')
        .single()

      if (insertErr || !item) {
        setError(insertErr?.message || 'Failed to create record')
        setProgress({ stage: 'failed', detail: insertErr?.message || 'Insert failed', percent: 0 })
        return null
      }

      if (abortRef.current) return null

      // Stage 3: Trigger processing
      setProgress({ stage: 'extracting', detail: 'Processing file...', percent: 50 })

      // Fire-and-forget: processing runs async on the server
      supabase.functions.invoke('bookshelf-process', {
        body: {
          bookshelf_item_id: item.id,
          family_id: member.family_id,
          member_id: member.id,
        },
      }).then(({ error: procErr }) => {
        if (procErr) {
          console.error('bookshelf-process error:', procErr)
        }
      })

      setProgress({ stage: 'completed', detail: 'Upload complete — processing in background', percent: 100 })
      return item as BookShelfItem
    } catch (err) {
      const message = (err as Error).message
      setError(message)
      setProgress({ stage: 'failed', detail: message, percent: 0 })
      return null
    }
  }, [member])

  // Create a text note (no file)
  const createTextNote = useCallback(async (title: string, content: string): Promise<BookShelfItem | null> => {
    if (!member) return null
    setError(null)

    setProgress({ stage: 'uploading', detail: 'Saving text note...', percent: 30 })

    const { data: item, error: insertErr } = await supabase
      .from('bookshelf_items')
      .insert({
        family_id: member.family_id,
        uploaded_by_member_id: member.id,
        title,
        file_type: 'text_note' as BookFileType,
        text_content: content,
        processing_status: 'pending',
        genres: [],
        tags: [],
      })
      .select('*')
      .single()

    if (insertErr || !item) {
      setError(insertErr?.message || 'Failed to create text note')
      setProgress({ stage: 'failed', detail: insertErr?.message || 'Insert failed', percent: 0 })
      return null
    }

    // Trigger processing
    supabase.functions.invoke('bookshelf-process', {
      body: {
        bookshelf_item_id: item.id,
        family_id: member.family_id,
        member_id: member.id,
      },
    }).then(() => {})

    setProgress({ stage: 'completed', detail: 'Text note saved — processing in background', percent: 100 })
    return item as BookShelfItem
  }, [member])

  // Check for duplicate by filename
  const checkDuplicate = useCallback((fileName: string, existingBooks: BookShelfItem[]): BookShelfItem | null => {
    return existingBooks.find(b => b.file_name === fileName && !b.archived_at) || null
  }, [])

  return {
    progress,
    error,
    uploadFile,
    createTextNote,
    checkDuplicate,
    reset,
    abort,
    acceptedExtensions: ACCEPTED_EXTENSIONS,
  }
}
