<?php

/**
 * =============================================================================
 * File: api/cart_load.php
 * Purpose: Retrieve the User's Saved Cart.
 * =============================================================================
 * 
 * NOTE:
 * When a user logs in, we need to restore their previous session.
 * This script looks up their ID in the database and returns the JSON cart
 * we saved earlier. The frontend then "Merges" this with anything 
 * currently in their browser.
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';

// Initialize response environment
sp_json_header();
sp_ensure_session();

// -----------------------------------------------------------------------------
// STEP 1: AUTH CHECK
// -----------------------------------------------------------------------------
// Can't load "My" cart if I don't know who "Me" is.
if (!isset($_SESSION['user_id']) || !$_SESSION['user_id']) {
    sp_json_response(['success' => false, 'error' => 'Not authenticated'], 401);
}

require_once __DIR__ . '/../db/sopoppedDB.php';

try {
    // -----------------------------------------------------------------------------
    // STEP 2: FETCH THE DATA
    // -----------------------------------------------------------------------------
    $stmt = $pdo->prepare('SELECT cart_json FROM user_carts WHERE user_id = :uid LIMIT 1');
    $stmt->execute([':uid' => $_SESSION['user_id']]);
    $row = $stmt->fetch();

    // -----------------------------------------------------------------------------
    // STEP 3: UNPACK AND SERVE
    // -----------------------------------------------------------------------------
    // The data comes out as a String. We decode it back into a List (Array).
    $cart = [];
    if ($row && isset($row['cart_json']) && $row['cart_json'] !== null) {
        $cart = json_decode($row['cart_json'], true) ?: [];
    }

    // Serve it to the frontend waiter
    sp_json_response(['success' => true, 'cart' => $cart]);
} catch (Exception $e) {
    error_log("cart_load error: " . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'Server error'], 500);
}
