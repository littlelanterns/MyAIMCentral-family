-- Create the family-avatars storage bucket
-- Migration 100037 created RLS policies but never created the bucket itself.
-- This fixes photo uploads for Archives member photos and family overview photos.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'family-avatars', 'family-avatars', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;
