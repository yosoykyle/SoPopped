<?php

/**
 * Update Order Status
 * 
 * Purpose: Changes the status of an order (pending, paid, shipped, cancelled).
 * Consumed by: admin/orders.php (status dropdown onchange event)
 * Action: Updates the status field for the specified order ID
 */
// API: Update Order Status
// Consumer: admin/orders.php (Status Dropdown)
require_once __DIR__ . '/check_auth.php';
require_once __DIR__ . '/../../db/sopoppedDB.php';

try {
    sp_json_response(['success' => true]); // REMOVE THIS LINE and paste snippet here
    
} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
