<?php

/**
 * =============================================================================
 * File: api/_products_service.php
 * Purpose: Shared logic for fetching products from the database.
 * =============================================================================
 * 
 * This service file abstracts the database query for products so it can be 
 * reused by both the main synchronous page loads (SSR) and the asynchronous 
 * API endpoints (`db_products.php`).
 * 
 * Functions:
 *   - getProducts($pdo): Returns array of active products.
 * 
 * Dependencies:
 *   - Expects a valid PDO connection object `$pdo` to be passed.
 * =============================================================================
 */

/**
 * Fetch all active products from the database.
 * 
 * @param PDO $pdo - Active database connection.
 * @return array - Array of associative arrays representing products.
 */
function getProducts($pdo)
{
    try {
        // Prepare query to select only active products, ordered by ID
        $stmt = $pdo->prepare("
            SELECT id, name, description, price, quantity, image_path, is_active 
            FROM products 
            WHERE is_active = 1 
            ORDER BY id DESC
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        // Log error and return empty array to prevent page crash
        error_log("Error fetching products: " . $e->getMessage());
        return [];
    }
}
