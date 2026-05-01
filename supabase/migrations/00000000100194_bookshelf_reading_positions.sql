-- Add reading_positions JSONB to bookshelf_member_settings
-- Stores per-book reading position: { [bookLibraryId]: { sectionTitle, scrollY, activeTab, updatedAt } }
ALTER TABLE bookshelf_member_settings
  ADD COLUMN IF NOT EXISTS reading_positions JSONB DEFAULT '{}'::jsonb;
