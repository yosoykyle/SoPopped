/*
    Migration: Add archiving support to contact_messages table
    This adds columns for archiving contact messages with user tracking
*/

-- Add archiving columns to contact_messages
ALTER TABLE contact_messages
ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0 AFTER message,
ADD COLUMN archived_by INT UNSIGNED NULL AFTER is_archived,
ADD COLUMN archived_at DATETIME NULL AFTER archived_by;

-- Add index for archived status
ALTER TABLE contact_messages
ADD INDEX idx_contact_archived (is_archived);

-- Add foreign key constraint for archived_by user tracking
ALTER TABLE contact_messages
ADD CONSTRAINT fk_contact_archived_by_user 
  FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL;
