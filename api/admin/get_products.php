<?php

/**
 * Get Products List (Admin)
 * 
 * Purpose: Fetches all products (active and archived) for admin management.
 * Consumed by: admin/products.php (populates the products table)
 * Returns: JSON array of product objects with id, name, price, quantity, is_active, image_path
 */
// API: Read Product List
// Consumer: admin/products.php (Data Table)
require_once __DIR__ . '/check_auth.php';
require_once __DIR__ . '/../../db/sopoppedDB.php';

// 📋 SNIPPET LOCATION: MARKDOWNS/REPORTS/admin_task_delegation.md
// 📦 Package B: Product Management → 2. Backend: `api/admin/get_products.php`
// ► Replace the first sp_json_response line below with the snippet

try {
    // REMOVE THIS LINE and paste snippet here
    sp_json_response(['success' => true, 'data' => []]);
    
} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
