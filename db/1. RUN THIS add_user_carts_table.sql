-- Migration: create user_carts table
-- INSERT THIS ON YOUR DB need for storing user shopping carts

-- User carts table: store per-user cart JSON. Use user_id as unique key so ON DUPLICATE KEY UPDATE works.
CREATE TABLE IF NOT EXISTS `user_carts` (
  `user_id` INT UNSIGNED NOT NULL,
  `cart_json` JSON NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_user_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
