-- ==============================================================================
-- MIGRATION #3: Add Archiving Support to Contact Messages
-- ==============================================================================
-- 
-- PURPOSE:
-- --------
-- Adds archiving capability to the `contact_messages` table. This allows admins
-- to mark messages as archived (soft delete) while tracking who archived them
-- and when.
-- 
-- COLUMNS ADDED:
-- --------------
-- - `is_archived`  : 0 = visible, 1 = archived
-- - `archived_by`  : User ID of the admin who archived the message
-- - `archived_at`  : Timestamp when the message was archived
-- 
-- WHEN TO RUN:
-- ------------
-- Run this ONLY if you are upgrading from an older database that doesn't have
-- these archiving columns. If you used `USE THIS SCHEMA.sql` for a fresh install,
-- these columns already exist — skip this file.
-- 
-- PREREQUISITE:
-- -------------
-- The `contact_messages` and `users` tables must exist.
-- 
-- HOW TO RUN:
-- -----------
-- Execute this file AS A WHOLE in MySQL Workbench, phpMyAdmin, or CLI.
-- Make sure you are connected to the `sopopped` database first.
-- 
-- SAFE TO RE-RUN:
-- ---------------
-- NO! Running this twice will cause errors like "Duplicate column name" or
-- "Duplicate key name". Only run once. If unsure, check the table structure first:
--   DESCRIBE contact_messages;
-- 
-- ==============================================================================

USE sopopped;

-- Add archiving columns to contact_messages
ALTER TABLE contact_messages
ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0 AFTER message,
ADD COLUMN archived_by INT UNSIGNED NULL AFTER is_archived,
ADD COLUMN archived_at DATETIME NULL AFTER archived_by;

-- Add index for archived status (improves query performance when filtering)
ALTER TABLE contact_messages
ADD INDEX idx_contact_archived (is_archived);

-- Add foreign key constraint for archived_by user tracking
ALTER TABLE contact_messages
ADD CONSTRAINT fk_contact_archived_by_user 
  FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL;
