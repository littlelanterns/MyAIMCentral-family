/**
 * useRecipePhotoUpload — PRD-42 KitchenCompass
 * Uploads recipe photos to the `recipe-photos` bucket (family-scoped path
 * prefix, matches the storage RLS policies in migration 100291).
 */

import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

const BUCKET = 'recipe-photos'
const MAX_FILE_SIZE = 10 * 1024 * 1024

export function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function useRecipePhotoUpload(familyId: string | undefined) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadPhoto = useCallback(
    async (file: File): Promise<string | null> => {
      if (!familyId) { setError('No family context'); return null }
      if (!file.type.startsWith('image/')) { setError('File must be an image'); return null }
      if (file.size > MAX_FILE_SIZE) { setError('Image must be under 10MB'); return null }

      setUploading(true)
      setError(null)
      try {
        const path = `${familyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false, contentType: file.type })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
        return data.publicUrl
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
        return null
      } finally {
        setUploading(false)
      }
    },
    [familyId],
  )

  return { uploadPhoto, uploading, error }
}
