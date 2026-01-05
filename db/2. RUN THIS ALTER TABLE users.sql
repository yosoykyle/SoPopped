-- ==============================================================================
-- MIGRATION #2: Add Middle Name Column to Users
-- ==============================================================================
-- 
-- PURPOSE:
-- --------
-- Adds an optional `middle_name` column to the `users` table.
-- This supports user registration forms that collect middle names.
-- 
-- WHEN TO RUN:
-- ------------
-- Run this ONLY if you are upgrading from an older database that doesn't have
-- the `middle_name` column. If you used `USE THIS SCHEMA.sql` for a fresh install,
-- this column already exists — skip this file.
-- 
-- PREREQUISITE:
-- -------------
-- The `users` table must exist.
-- 
-- HOW TO RUN:
-- -----------
-- Execute this file AS A WHOLE in MySQL Workbench, phpMyAdmin, or CLI.
-- Make sure you are connected to the `sopopped` database first.
-- 
-- SAFE TO RE-RUN:
-- ---------------
-- NO! Running this twice will cause an error: "Duplicate column name 'middle_name'".
-- Only run once. If unsure, check the table structure first:
--   DESCRIBE users;
-- 
-- ==============================================================================

USE sopopped;

-- Add middle_name column to users table (placed after first_name)
ALTER TABLE users
ADD COLUMN middle_name VARCHAR(100)
AFTER first_name;