-- ============================================================
-- MMZ Dashboard — Migration 002: Storage & RLS
-- Migrate from Google Drive to Supabase Storage
-- ============================================================

-- ============================================================
-- 1. Modify file_references table for Supabase Storage
-- ============================================================

-- Rename Google Drive columns to generic storage columns
ALTER TABLE file_references RENAME COLUMN google_drive_file_id TO storage_path;
ALTER TABLE file_references RENAME COLUMN google_drive_url TO storage_url;

-- Drop the old index and create a new one with the updated column name
DROP INDEX IF EXISTS idx_file_references_drive;
CREATE INDEX idx_file_references_storage ON file_references(storage_path);

-- ============================================================
-- 2. Remove google_drive_root_folder_id from mmz_settings
-- ============================================================

ALTER TABLE mmz_settings DROP COLUMN IF EXISTS google_drive_root_folder_id;

-- ============================================================
-- 3. Create Supabase Storage bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('mmz-files', 'mmz-files', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. Storage policies for mmz-files bucket
-- ============================================================

CREATE POLICY "Authenticated users can upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'mmz-files');

CREATE POLICY "Authenticated users can read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'mmz-files');

CREATE POLICY "PM users can delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'mmz-files');
