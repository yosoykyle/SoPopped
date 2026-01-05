-- ==============================================================================
-- MIGRATION #1: Add User Carts Table
-- ==============================================================================
-- 
-- PURPOSE:
-- --------
-- Creates the `user_carts` table to store shopping cart data for logged-in users.
-- This enables cart persistence across sessions (when a user logs out and back in,
-- their cart items are preserved).
-- 
-- WHEN TO RUN:
-- ------------
-- Run this ONLY if you are upgrading from an older database that doesn't have
-- the `user_carts` table. If you used `USE THIS SCHEMA.sql` for a fresh install,
-- this table already exists — skip this file.
-- 
-- PREREQUISITE:
-- -------------
-- The `users` table must exist before running this (foreign key dependency).
-- 
-- HOW TO RUN:
-- -----------
-- Execute this file AS A WHOLE in MySQL Workbench, phpMyAdmin, or CLI.
-- Make sure you are connected to the `sopopped` database first.
-- 
-- SAFE TO RE-RUN:
-- ---------------
-- Yes. Uses "IF NOT EXISTS" so it won't fail or duplicate the table.
-- 
-- ==============================================================================

USE sopopped;

-- User carts table: store per-user cart JSON. Use user_id as unique key so ON DUPLICATE KEY UPDATE works.
CREATE TABLE IF NOT EXISTS `user_carts` (
  `user_id` INT UNSIGNED NOT NULL,
  `cart_json` JSON NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
