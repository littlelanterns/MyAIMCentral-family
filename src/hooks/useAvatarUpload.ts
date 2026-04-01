/**
 * useAvatarUpload — PRD-13B
 * Upload member avatars and family photos to Supabase Storage.
 * Bucket: family-avatars
 * Member avatar path: {family_id}/{member_id}
 * Member reference photos: {family_id}/{member_id}/ref-{index}
 * Family path: {family_id}/family-overview
 *
 * Reference photos (up to 7) stored in archive_member_settings.reference_photos[].
 * First reference photo also sets family_members.avatar_url.
 */

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

const BUCKET = 'family-avatars'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_REFERENCE_PHOTOS = 7

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'File must be an image'
  if (file.size > MAX_FILE_SIZE) return 'Image must be under 5MB'
  return null
}

interface UseAvatarUploadReturn {
  uploadMemberAvatar: (memberId: string, file: File) => Promise<string | null>
  uploadFamilyPhoto: (file: File) => Promise<string | null>
  uploadReferencePhoto: (memberId: string, file: File, existingPhotos: string[]) => Promise<string | null>
  deleteReferencePhoto: (memberId: string, photoUrl: string, existingPhotos: string[]) => Promise<boolean>
  setProfilePhoto: (memberId: string, photoUrl: string, existingPhotos: string[]) => Promise<boolean>
  uploading: boolean
  error: string | null
}

export function useAvatarUpload(familyId: string | undefined): UseAvatarUploadReturn {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const invalidateMemberQueries = useCallback(
    (memberId?: string) => {
      queryClient.invalidateQueries({ queryKey: ['family-members'] })
      queryClient.invalidateQueries({ queryKey: ['archive-members'] })
      queryClient.invalidateQueries({ queryKey: ['archive-member-stats'] })
      if (memberId && familyId) {
        queryClient.invalidateQueries({ queryKey: ['archive-member-settings', familyId, memberId] })
      }
    },
    [familyId, queryClient],
  )

  const uploadMemberAvatar = useCallback(
    async (memberId: string, file: File): Promise<string | null> => {
      if (!familyId) { setError('No family context'); return null }
      const validationError = validateImageFile(file)
      if (validationError) { setError(validationError); return null }

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

        invalidateMemberQueries(memberId)
        return url
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        return null
      } finally {
        setUploading(false)
      }
    },
    [familyId, invalidateMemberQueries],
  )

  const uploadFamilyPhoto = useCallback(
    async (file: File): Promise<string | null> => {
      if (!familyId) { setError('No family context'); return null }
      const validationError = validateImageFile(file)
      if (validationError) { setError(validationError); return null }

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

  /**
   * Upload a reference photo for a member. Appends to the reference_photos array.
   * If this is the first photo, also sets it as the member's avatar.
   */
  const uploadReferencePhoto = useCallback(
    async (memberId: string, file: File, existingPhotos: string[]): Promise<string | null> => {
      if (!familyId) { setError('No family context'); return null }
      if (existingPhotos.length >= MAX_REFERENCE_PHOTOS) {
        setError(`Maximum ${MAX_REFERENCE_PHOTOS} reference photos allowed`)
        return null
      }
      const validationError = validateImageFile(file)
      if (validationError) { setError(validationError); return null }

      setUploading(true)
      setError(null)

      try {
        // Find next available index
        const nextIndex = existingPhotos.length
        const path = `${familyId}/${memberId}/ref-${nextIndex}-${Date.now()}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: true, contentType: file.type })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
        const url = `${urlData.publicUrl}?t=${Date.now()}`

        const newPhotos = [...existingPhotos, url]

        // Upsert archive_member_settings with new reference_photos
        const { error: settingsError } = await supabase
          .from('archive_member_settings')
          .upsert(
            {
              family_id: familyId,
              member_id: memberId,
              reference_photos: newPhotos,
            },
            { onConflict: 'family_id,member_id' },
          )

        if (settingsError) throw settingsError

        // If first photo, also set as avatar
        if (existingPhotos.length === 0) {
          await supabase
            .from('family_members')
            .update({ avatar_url: url })
            .eq('id', memberId)
        }

        invalidateMemberQueries(memberId)
        return url
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        return null
      } finally {
        setUploading(false)
      }
    },
    [familyId, invalidateMemberQueries],
  )

  /**
   * Delete a reference photo. Removes from storage and updates the array.
   * If deleting the first photo, promotes the next one to avatar (or clears avatar).
   */
  const deleteReferencePhoto = useCallback(
    async (memberId: string, photoUrl: string, existingPhotos: string[]): Promise<boolean> => {
      if (!familyId) { setError('No family context'); return false }

      setUploading(true)
      setError(null)

      try {
        // Extract storage path from URL
        const bucketUrl = supabase.storage.from(BUCKET).getPublicUrl('').data.publicUrl
        const storagePath = photoUrl.split('?')[0].replace(bucketUrl, '').replace(/^\//, '')

        if (storagePath) {
          await supabase.storage.from(BUCKET).remove([storagePath])
        }

        const newPhotos = existingPhotos.filter((p) => p !== photoUrl)
        const deletingIndex = existingPhotos.indexOf(photoUrl)

        // Update reference_photos array
        const { error: settingsError } = await supabase
          .from('archive_member_settings')
          .upsert(
            {
              family_id: familyId,
              member_id: memberId,
              reference_photos: newPhotos,
            },
            { onConflict: 'family_id,member_id' },
          )

        if (settingsError) throw settingsError

        // If deleted the first photo (avatar), update avatar to next photo or clear
        if (deletingIndex === 0) {
          const newAvatarUrl = newPhotos.length > 0 ? newPhotos[0] : null
          await supabase
            .from('family_members')
            .update({ avatar_url: newAvatarUrl })
            .eq('id', memberId)
        }

        invalidateMemberQueries(memberId)
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed'
        setError(message)
        return false
      } finally {
        setUploading(false)
      }
    },
    [familyId, invalidateMemberQueries],
  )

  /**
   * Move a photo to index 0 and set it as the member's profile avatar.
   */
  const setProfilePhoto = useCallback(
    async (memberId: string, photoUrl: string, existingPhotos: string[]): Promise<boolean> => {
      if (!familyId) { setError('No family context'); return false }

      const index = existingPhotos.indexOf(photoUrl)
      if (index <= 0) return true // already first

      setUploading(true)
      setError(null)

      try {
        // Move the selected photo to position 0
        const reordered = [photoUrl, ...existingPhotos.filter((p) => p !== photoUrl)]

        const { error: settingsError } = await supabase
          .from('archive_member_settings')
          .upsert(
            {
              family_id: familyId,
              member_id: memberId,
              reference_photos: reordered,
            },
            { onConflict: 'family_id,member_id' },
          )

        if (settingsError) throw settingsError

        // Update avatar to the new first photo
        const { error: avatarError } = await supabase
          .from('family_members')
          .update({ avatar_url: photoUrl })
          .eq('id', memberId)

        if (avatarError) throw avatarError

        invalidateMemberQueries(memberId)
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to set profile photo'
        setError(message)
        return false
      } finally {
        setUploading(false)
      }
    },
    [familyId, invalidateMemberQueries],
  )

  return { uploadMemberAvatar, uploadFamilyPhoto, uploadReferencePhoto, deleteReferencePhoto, setProfilePhoto, uploading, error }
}
