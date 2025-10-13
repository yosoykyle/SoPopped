-- sopopped.sql
-- revisions needed for sopopped.sql first draft meant to be a 
-- reference schema for So Popped webapp
-- GENERATED WITH HELP OF CHATGPT
-- 
-- Schema for So Popped webapp
-- Generated: 2025-10-12
-- NOTE: Review types, lengths and engine settings before running in production.

-- -----------------------------------------------------------------
-- NOTE: This is the full schema reference. A trimmed subset that
-- includes only tables required by the currently implemented
-- front-end forms/components has been created at:
--   sopoppedDB/frontend_reference_tables.sql
-- That trimmed file is intended as a reference scaffold for quickly
-- connecting front-end forms (login, signup, contact, products, cart)
-- to MySQL. It MUST be reviewed and verified before use in any env.
-- -----------------------------------------------------------------

-- Disable FK checks for safe recreation
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist (drop dependents first)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products_categories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS product_reviews;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS barangays;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS provinces;
DROP TABLE IF EXISTS carts;
DROP TABLE IF EXISTS users;

-- Re-enable FK checks after drops (will be enabled after creation too)
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Core tables
-- =====================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) UNIQUE NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  inventory_count INT NOT NULL DEFAULT 0,
  image_path VARCHAR(512),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories (optional)
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Join table: products <-> categories (many-to-many)
CREATE TABLE IF NOT EXISTS products_categories (
  product_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY (product_id, category_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product images (optional multiple images per product)
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_path VARCHAR(512) NOT NULL,
  alt_text VARCHAR(255),
  sort_order INT DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product reviews (optional)
CREATE TABLE IF NOT EXISTS product_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NULL,
  rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  body TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- Location/geodata tables (provinces -> cities -> barangays)
-- These are optional if you load geodata from JSON on client-side.
-- =====================================================

CREATE TABLE IF NOT EXISTS provinces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  province_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS barangays (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Addresses (billing/shipping)
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  type ENUM('billing','shipping','both') DEFAULT 'billing',
  full_name VARCHAR(255),
  phone VARCHAR(50),
  province VARCHAR(255),
  city VARCHAR(255),
  barangay VARCHAR(255),
  address_line VARCHAR(512),
  postal_code VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Contact messages (for About Us / Contact Us page)
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  status ENUM('new','read','archived') NOT NULL DEFAULT 'new',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- =====================================================
-- Cart and cart_items (active carts + items)
-- =====================================================

CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  status ENUM('active','ordered','abandoned') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- Orders and order_items
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INT NULL,
  cart_id INT NULL,
  status ENUM('pending','processing','shipped','completed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_method VARCHAR(50),
  payment_status ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  billing_address_snapshot TEXT,
  shipping_address_snapshot TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- Helpful indexes
-- =====================================================
ALTER TABLE users ADD INDEX idx_users_email (email);
-- index on role for admin queries
ALTER TABLE users ADD INDEX idx_users_role (role);
ALTER TABLE products ADD INDEX idx_products_title (title(100));
ALTER TABLE carts ADD INDEX idx_carts_user (user_id);
ALTER TABLE cart_items ADD INDEX idx_cart_items_cart (cart_id);
ALTER TABLE cart_items ADD INDEX idx_cart_items_product (product_id);
ALTER TABLE orders ADD INDEX idx_orders_user (user_id);
ALTER TABLE order_items ADD INDEX idx_order_items_order (order_id);

-- index for contact messages lookup
ALTER TABLE contact_messages ADD INDEX idx_contact_messages_email (email(100));

-- Password reset tokens (for user password recovery)
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User sessions (optional server-side session store)
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Site settings (small key/value store for admin tweaks)
CREATE TABLE IF NOT EXISTS site_settings (
  `key` VARCHAR(191) PRIMARY KEY,
  `value` TEXT NULL,
  description VARCHAR(512) NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================================================================
-- End of schema
-- ==================================================================
