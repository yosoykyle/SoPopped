<?php

/**
 * Archive Product (Soft Delete)
 * 
 * Purpose: Marks a product as inactive without permanently deleting it.
 * Consumed by: admin/products.php (delete/archive button)
 * Action: Sets is_active = 0 for the specified product ID
 */
// API: Soft Delete Product
// Consumer: admin/products.php (Archive Button)
require_once __DIR__ . '/check_auth.php';
require_once __DIR__ . '/../../db/sopoppedDB.php';

try {
    // REMOVE THIS LINE and paste snippet here
    sp_json_response(['success' => true]);
    
} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
