-- frontend_reference_tables.sql
-- Reference subset of the full schema containing only tables needed
-- by the currently implemented front-end forms/components in the
-- So Popped workspace (login, signup, contact, products, cart, checkout).
--
-- NOTE: This file is a reference scaffold. Table definitions are
-- intended to match the application's quick frontend needs and
-- MUST be reviewed/verified before running in production.
--
-- Created: 2025-10-13

SET FOREIGN_KEY_CHECKS = 0;

-- Users table (for signup/login)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  -- front-end includes a middle name input (signup). Keep this column to store it.
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  -- role: not provided by current front-end signup flow; comment out for now
  -- role ENUM('user','admin') NOT NULL DEFAULT 'user', -- future use
  -- created_at / updated_at: metadata timestamps not used by current front-end
  -- created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact messages (About Us / Contact Us page)
CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  -- ip_address / user_agent / status / timestamps: not collected by current contact form
  -- ip_address VARCHAR(45) NULL, -- future: store sender IP
  -- user_agent VARCHAR(512) NULL, -- future: store UA
  -- status ENUM('new','read','archived') NOT NULL DEFAULT 'new', -- future workflow
  -- created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products (frontend currently uses static JSON; optional to populate from DB)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- The frontend `js/products.json` uses fields `id`, `name`, `image`, `price`, `description`.
  -- To match the front-end shape, use `name` and `image` here. Image values are stored as
  -- relative URLs (e.g. "images/p1.png") and `productLoader.js` resolves them against
  -- the current page URL when rendering.
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  -- inventory_count / is_active / timestamps are not used by current front-end
  -- inventory_count INT NOT NULL DEFAULT 0, -- future
  image VARCHAR(512), -- stores relative or absolute image URL (maps to product.image)
  -- is_active TINYINT(1) NOT NULL DEFAULT 1, -- future
  -- created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Addresses (used by checkout/billing form)
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- The checkout form captures first and last name separately and an email.
  -- Keep only the fields currently collected by the frontend (first/last/email/address/province/city/barangay).
  -- user_id / type / phone / postal_code / timestamps are commented out for now.
  -- user_id INT NULL, -- optional: link address to a logged-in user
  -- type ENUM('billing','shipping','both') DEFAULT 'billing', -- future
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  address_line VARCHAR(512),
  province VARCHAR(255),
  city VARCHAR(255),
  barangay VARCHAR(255)
  -- phone VARCHAR(50), -- not collected by current checkout form
  -- postal_code VARCHAR(50), -- not collected by current checkout form
  -- created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carts and cart_items (frontend currently stores cart in localStorage;
-- server-side persistence is optional but provided here for reference)
CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- Minimal cart table for server-side cart persistence if adopted.
  -- user_id / status / timestamps are commented out because the frontend uses localStorage cart.
  -- user_id INT NULL, -- optional: associate cart with a logged-in user
  -- status ENUM('active','ordered','abandoned') NOT NULL DEFAULT 'active', -- future
  -- created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cart_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  -- created_at / updated_at are not required for current frontend flows
  -- created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- End of frontend reference tables
