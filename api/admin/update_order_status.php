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
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $orderId = isset($input['order_id']) ? (int)$input['order_id'] : 0;
    $status = trim($input['status'] ?? '');

    $allowed = ['pending', 'paid', 'shipped', 'cancelled'];
    if (!$orderId || !in_array($status, $allowed, true)) {
        sp_json_response(['success' => false, 'error' => 'Invalid input'], 400);
    }

    try {
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $orderId]);
        sp_json_response(['success' => true]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => 'Failed to update order'], 500);
    }
    
} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
