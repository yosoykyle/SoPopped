<?php

/**
 * =============================================================================
 * File: api/cart_save.php
 * Purpose: Persist the user's cart state to the database.
 * =============================================================================
 * 
 * This endpoint accepts a JSON cart payload and saves it to the `user_carts`
 * table for the currently logged-in user using an UPSERT strategy.
 * 
 * Input:
 *   - Raw JSON body OR `cart` POST parameter containing cart array.
 * 
 * Logic:
 *   1. Validates POST method and Authentication.
 *   2. Parses input data (JSON body or POST param).
 *   3. Executes INSERT ... ON DUPLICATE KEY UPDATE.
 *   4. Returns saved cart for confirmation.
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';

// Initialize
sp_json_header();
sp_ensure_session();

// 1. Validation
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
}

if (!isset($_SESSION['user_id']) || !$_SESSION['user_id']) {
    sp_json_response(['success' => false, 'error' => 'Not authenticated'], 401);
}

require_once __DIR__ . '/../db/sopoppedDB.php';

// 2. Payload Parsing
$raw = file_get_contents('php://input');
$data = [];

// Try to parse raw JSON body first
if ($raw) {
    $maybe = json_decode($raw, true);
    if (is_array($maybe)) $data = $maybe;
}

// Fallback to form parameter if raw body failed or was empty
if (empty($data) && isset($_POST['cart'])) {
    $maybe = json_decode($_POST['cart'], true);
    if (is_array($maybe)) $data = $maybe;
}

// Ensure data is array
if (!is_array($data)) $data = [];

try {
    // 3. Database Upsert
    // We use parameters for both INSERT and UPDATE clauses.
    // user_id is unique key.
    $stmt = $pdo->prepare('
        INSERT INTO user_carts (user_id, cart_json, updated_at) 
        VALUES (:uid, :cj, NOW()) 
        ON DUPLICATE KEY UPDATE cart_json = :cj2, updated_at = NOW()
    ');

    $json = json_encode($data, JSON_UNESCAPED_UNICODE);

    // Bind parameters
    $stmt->execute([
        ':uid' => $_SESSION['user_id'],
        ':cj' => $json,
        ':cj2' => $json
    ]);

    // 4. Response
    sp_json_response(['success' => true, 'cart' => $data]);
} catch (Exception $e) {
    // 5. Error Handling
    error_log('cart_save error: ' . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'Server error'], 500);
}
