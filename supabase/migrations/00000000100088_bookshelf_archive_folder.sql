-- PRD-23 Session D: Add folder_id FK to bookshelf_items for Archive routing
-- Allows books to be organized into Archive folders

ALTER TABLE bookshelf_items
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES archive_folders(id);

CREATE INDEX IF NOT EXISTS idx_bsi_folder ON bookshelf_items(folder_id) WHERE folder_id IS NOT NULL;

COMMENT ON COLUMN bookshelf_items.folder_id IS 'FK to archive_folders — organizes books into Archive categories';
