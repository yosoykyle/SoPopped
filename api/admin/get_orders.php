<?php

/**
 * Get Orders List (Admin)
 * 
 * Purpose: Fetches all orders with customer information for admin management.
 * Consumed by: admin/orders.php (populates the orders table)
 * Returns: JSON array of orders with id, user name, total_amount, status
 * Note: Joins with users table to get customer first_name and last_name
 */
// API: Read Order List
// Consumer: admin/orders.php (Data Table)
require_once __DIR__ . '/check_auth.php';
require_once __DIR__ . '/../../db/sopoppedDB.php';
// 📋 SNIPPET LOCATION: MARKDOWNS/REPORTS/admin_task_delegation.md
// 📦 Package C: Order Management → 2. Backend: `api/admin/get_orders.php`
// ► Replace the sp_json_response line below with the snippet

try {
    sp_json_response(['success' => true, 'data' => []]); // REMOVE THIS LINE and paste snippet here
    
} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
