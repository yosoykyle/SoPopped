<?php

/**
 * Save Product (Create/Update)
 * 
 * Purpose: Creates a new product or updates existing product information.
 * Consumed by: admin/products.php (product modal form submission)
 * Action: Handles image uploads, checks for duplicates, INSERT/UPDATE to database
 * Note: Uses FormData (not JSON) due to file upload requirement
 */
// API: Create/Update Product
// Consumer: admin/products.php (Product Modal)
require_once __DIR__ . '/check_auth.php';
require_once __DIR__ . '/../../db/sopoppedDB.php';

// 📋 SNIPPET LOCATION: MARKDOWNS/REPORTS/admin_task_delegation.md
// 📦 Package B: Product Management → 3. Backend: `api/admin/save_product.php`
// ► Replace the first sp_json_response line below with the snippet

try {
    sp_json_response(['success' => true, 'message' => 'Product saved.']); // Replace this line with the snippet
   
} catch (Exception $e) {
    sp_json_response(['success' => false, 'error' => 'Failed to save product: ' . $e->getMessage()], 500);
}