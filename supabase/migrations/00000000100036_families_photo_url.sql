-- PRD-13B: Add family photo URL column
ALTER TABLE families ADD COLUMN IF NOT EXISTS family_photo_url TEXT;
