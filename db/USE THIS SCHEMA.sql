-- ==============================================================================
-- File: db/USE THIS SCHEMA.sql
-- Purpose: The "Blueprint" (Database Structure).
-- ==============================================================================
-- 
-- NOTE:
-- This file defines the "Skeleton" of our application.
-- It creates the database, the tables (drawers), and the columns (folders)
-- where we store all our data.
-- 
-- HOW TO USE:
-- 1. Open this file in MySQL Workbench or phpMyAdmin.
-- 2. Run the whole thing. It is "Idempotent" (Safe to run multiple times).
-- 
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- STEP 1: THE FOUNDATION
-- ------------------------------------------------------------------------------
-- We create the container 'sopopped' first.

CREATE DATABASE IF NOT EXISTS sopopped;
USE sopopped;


-- ------------------------------------------------------------------------------
-- STEP 2: THE IDENTITIES (Users)
-- ------------------------------------------------------------------------------
-- NOTE: This table holds everyone - including Customers and Admins.
-- We use a 'role' column to tell them apart, rather than two separate tables.
-- This makes Logging In much simpler (one check instead of two).

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'We never store plain passwords! Only the encrypted hash.',
  `first_name` VARCHAR(100) NOT NULL DEFAULT '',
  `middle_name` VARCHAR(100) DEFAULT NULL COMMENT '[OPTIONAL] Used in Signup',
  `last_name` VARCHAR(100) NOT NULL DEFAULT '',
  `phone` VARCHAR(30) NOT NULL DEFAULT '',
  `role` ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '[ACTIVE] 1 = Deactivated/Banned User. They cannot log in.',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`) -- No two people can have the same email
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ------------------------------------------------------------------------------
-- STEP 3: THE MEMORY (Shopping Carts)
-- ------------------------------------------------------------------------------
-- NOTE: When a user logs in, we save their cart here.
-- Instead of a complex "cart_items" table, we just dump the JSON here.
-- Why? Because the cart changes 100 times a minute. 
-- JSON is faster and easier for "Temporary" data like this.

CREATE TABLE IF NOT EXISTS `user_carts` (
  `user_id` INT UNSIGNED NOT NULL,
  `cart_json` JSON NULL COMMENT '[ACTIVE] Example: [{"id":1, "qty":2}, {"id":5, "qty":1}]',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ------------------------------------------------------------------------------
-- STEP 4: THE INVENTORY (Products)
-- ------------------------------------------------------------------------------
-- NOTE: This is our Catalog.
-- 'image_path' points to the file on disk. We don't store the actual image blob here.
-- 'quantity' is our inventory. Checkout logic must decrease this number.
-- 'sku' is currently unused by the frontend code but ready for barcode scanners.

CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sku` VARCHAR(64) DEFAULT NULL COMMENT '[FUTURE] Stock Keeping Unit. Not used in website (No UI).',
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `description` TEXT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 0, 
  `image_path` VARCHAR(512) NOT NULL DEFAULT '' COMMENT '[ACTIVE] e.g. "images/popcorn_cheddar.jpg"',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '[ACTIVE] 0 = Hidden from store (Soft Delete)',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_products_name` (`name`),
  UNIQUE KEY `uq_products_sku` (`sku`),
  CONSTRAINT `chk_products_price_nonneg` CHECK (`price` >= 0),
  CONSTRAINT `chk_products_quantity_nonneg` CHECK (`quantity` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ------------------------------------------------------------------------------
-- STEP 5: THE RECEIPTS (Orders)
-- ------------------------------------------------------------------------------
-- NOTE: An Order is a snapshot in time.
-- We copy the user's address into 'shipping_address' (JSON).
-- Why? If the user moves house next week, their old receipt shouldn't change!

CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL COMMENT 'Can be null if user is deleted later',
  `total_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending','paid','shipped','cancelled') NOT NULL DEFAULT 'pending',
  `payment_method` ENUM('cod','other') NOT NULL DEFAULT 'cod',
  `shipping_address` JSON NULL COMMENT '[ACTIVE] Address Snapshot: {line1, city, zip...}',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_user_id` (`user_id`),
  KEY `idx_orders_status` (`status`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_orders_total_nonneg` CHECK (`total_amount` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ------------------------------------------------------------------------------
-- STEP 6: THE LINE ITEMS (Order Details)
-- ------------------------------------------------------------------------------
-- NOTE: Order Items link Orders to Products.
-- We save 'price_at_purchase' to handle price changes over time.

CREATE TABLE IF NOT EXISTS `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `price_at_purchase` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_product_id` (`product_id`),
  CONSTRAINT `chk_order_items_quantity_positive` CHECK (`quantity` >= 1),
  CONSTRAINT `chk_order_items_price_nonneg` CHECK (`price_at_purchase` >= 0),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- ------------------------------------------------------------------------------
-- STEP 7: THE INBOX (Contact Messages)
-- ------------------------------------------------------------------------------
-- NOTE: Simple storage for the "Contact Us" form.
-- 
-- ANALYSIS OF UNUSED COLUMNS:
-- [ACTIVE] name, email, message -> Used by `contact_submit.php`.
-- [NO UI] is_archived, archived_by, archived_at -> These exist in the DB
-- but there is NO Admin Page to view/archive messages yet.

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `email` VARCHAR(255) NOT NULL DEFAULT '',
  `message` TEXT NOT NULL,
  
  -- Unused Features (No Admin UI exists for these yet)
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '[FUTURE] For hiding processed messages',
  `archived_by` INT UNSIGNED NULL COMMENT '[FUTURE] Who archived it',
  `archived_at` DATETIME NULL COMMENT '[FUTURE] When it was archived',
  
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_contact_archived` (`is_archived`),
  CONSTRAINT `fk_contact_archived_by_user` FOREIGN KEY (`archived_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
