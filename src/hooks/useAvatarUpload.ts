/**
 * useAvatarUpload — PRD-13B
 * Upload member avatars and family photos to Supabase Storage.
 * Bucket: family-avatars
 * Member path: {family_id}/{member_id}
 * Family path: {family_id}/family-overview
 */

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

const BUCKET = 'family-avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface UseAvatarUploadReturn {
  uploadMemberAvatar: (memberId: string, file: File) => Promise<string | null>
  uploadFamilyPhoto: (file: File) => Promise<string | null>
  uploading: boolean
  error: string | null
}

export function useAvatarUpload(familyId: string | undefined): UseAvatarUploadReturn {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const uploadMemberAvatar = useCallback(
    async (memberId: string, file: File): Promise<string | null> => {
      if (!familyId) {
        setError('No family context')
        return null
      }

      if (!file.type.startsWith('image/')) {
        setError('File must be an image')
        return null
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('Image must be under 5MB')
        return null
      }

      setUploading(true)
      setError(null)

      try {
        const path = `${familyId}/${memberId}`
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: true, contentType: file.type })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
        const url = `${urlData.publicUrl}?t=${Date.now()}`

        const { error: updateError } = await supabase
          .from('family_members')
          .update({ avatar_url: url })
          .eq('id', memberId)

        if (updateError) throw updateError

        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['family-members'] })
        queryClient.invalidateQueries({ queryKey: ['archive-members'] })
        queryClient.invalidateQueries({ queryKey: ['archive-member-stats'] })

        return url
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        return null
      } finally {
        setUploading(false)
      }
    },
    [familyId, queryClient],
  )

  const uploadFamilyPhoto = useCallback(
    async (file: File): Promise<string | null> => {
      if (!familyId) {
        setError('No family context')
        return null
      }

      if (!file.type.startsWith('image/')) {
        setError('File must be an image')
        return null
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('Image must be under 5MB')
        return null
      }

      setUploading(true)
      setError(null)

      try {
        const path = `${familyId}/family-overview`
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: true, contentType: file.type })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
        const url = `${urlData.publicUrl}?t=${Date.now()}`

        const { error: updateError } = await supabase
          .from('families')
          .update({ family_photo_url: url })
          .eq('id', familyId)

        if (updateError) throw updateError

        queryClient.invalidateQueries({ queryKey: ['family'] })
        queryClient.invalidateQueries({ queryKey: ['archive-family-overview'] })

        return url
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        return null
      } finally {
        setUploading(false)
      }
    },
    [familyId, queryClient],
  )

  return { uploadMemberAvatar, uploadFamilyPhoto, uploading, error }
}
