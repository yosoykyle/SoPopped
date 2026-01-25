<?php

/**
 * =============================================================================
 * File: api/cart_save.php
 * Purpose: Save the User's Cart to the Database.
 * =============================================================================
 * 
 * NOTE:
 * When a user logs in, we want their cart to be "Persistent".
 * If they add an item on their phone, it should appear on their laptop.
 * 
 * To do this, we verify who they are, then take the entire cart (as JSON),
 * and save it into the `user_carts` table.
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';

// Initialize
sp_json_header();
sp_ensure_session();

// -----------------------------------------------------------------------------
// STEP 1: ARE YOU ALLOWED? (Auth Check)
// -----------------------------------------------------------------------------
// We only save carts for LOGGED IN users.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
}

if (!isset($_SESSION['user_id']) || !$_SESSION['user_id']) {
    sp_json_response(['success' => false, 'error' => 'Not authenticated'], 401);
}

require_once __DIR__ . '/../db/sopoppedDB.php';

// -----------------------------------------------------------------------------
// STEP 2: GET THE PACKAGE (Input)
// -----------------------------------------------------------------------------
// We expect the cart data to be sent as a JSON string.
$raw = file_get_contents('php://input');
$data = [];

// Try to parse raw JSON body first
if ($raw) {
    $maybe = json_decode($raw, true);
    if (is_array($maybe)) $data = $maybe;
}

// Fallback to form parameter if raw body failed
if (empty($data) && isset($_POST['cart'])) {
    $maybe = json_decode($_POST['cart'], true);
    if (is_array($maybe)) $data = $maybe;
}

// Ensure data is array
if (!is_array($data)) $data = [];

try {
    // -----------------------------------------------------------------------------
    // STEP 3: SAVE TO DATABASE (Upsert)
    // -----------------------------------------------------------------------------
    // We use "ON DUPLICATE KEY UPDATE". 
    // This is a fancy SQL trick that means:
    // "If this user already has a saved cart, UPDATE it. If not, CREATE a new one."

    $stmt = $pdo->prepare('
        INSERT INTO user_carts (user_id, cart_json, updated_at) 
        VALUES (:uid, :cj, NOW()) 
        ON DUPLICATE KEY UPDATE cart_json = :cj2, updated_at = NOW()
    ');

    $json = json_encode($data, JSON_UNESCAPED_UNICODE);

    $stmt->execute([
        ':uid' => $_SESSION['user_id'],
        ':cj' => $json,
        ':cj2' => $json
    ]);

    // -----------------------------------------------------------------------------
    // STEP 4: CONFIRMATION
    // -----------------------------------------------------------------------------
    sp_json_response(['success' => true, 'cart' => $data]);
} catch (Exception $e) {
    error_log('cart_save error: ' . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'Server error'], 500);
}
