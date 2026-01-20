<?php

/**
 * =============================================================================
 * File: api/cart_load.php
 * Purpose: Retrieve the saved cart state for a logged-in user.
 * =============================================================================
 * 
 * This endpoint allows the frontend to sync the user's persisted cart from the 
 * database upon login or page load.
 * 
 * Logic:
 *   1. Checks if user is logged in. Returns 401 if not.
 *   2. Queries `user_carts` table for the JSON string.
 *   3. Decodes and returns the cart array.
 * 
 * Response Format:
 *   { "success": true, "cart": [ ...items... ] }
 *   { "success": false, "error": "Not authenticated" }
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';

// Initialize response environment
sp_json_header();
sp_ensure_session();

// 1. Authentication Check
if (!isset($_SESSION['user_id']) || !$_SESSION['user_id']) {
    sp_json_response(['success' => false, 'error' => 'Not authenticated'], 401);
}

// 2. Database Connection
require_once __DIR__ . '/../db/sopoppedDB.php';

try {
    // 3. Fetch Cart Data
    $stmt = $pdo->prepare('SELECT cart_json FROM user_carts WHERE user_id = :uid LIMIT 1');
    $stmt->execute([':uid' => $_SESSION['user_id']]);
    $row = $stmt->fetch();

    // 4. Parse & Return
    $cart = [];
    if ($row && isset($row['cart_json']) && $row['cart_json'] !== null) {
        $cart = json_decode($row['cart_json'], true) ?: [];
    }

    sp_json_response(['success' => true, 'cart' => $cart]);
} catch (Exception $e) {
    // 5. Error Handling
    error_log("cart_load error: " . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'Server error'], 500);
}
