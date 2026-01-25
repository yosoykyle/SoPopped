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
        // Start a transaction so status change + optional stock restore are atomic
        $pdo->beginTransaction();

        // Lock the order row and read current status
        $cur = $pdo->prepare("SELECT status FROM orders WHERE id = ? FOR UPDATE");
        $cur->execute([$orderId]);
        $row = $cur->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            sp_json_response(['success' => false, 'error' => 'Order not found'], 404);
        }

        $currentStatus = (string)$row['status'];

        // No-op if the status is unchanged
        if ($currentStatus === $status) {
            if ($pdo->inTransaction()) $pdo->commit();
            sp_json_response(['success' => true, 'no_change' => true]);
        }

        // If we're transitioning into 'cancelled' from a non-cancelled state,
        // restore product quantities from the order items.
        if ($status === 'cancelled' && $currentStatus !== 'cancelled') {
            $itemsStmt = $pdo->prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?');
            $itemsStmt->execute([$orderId]);
            $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

            $incStmt = $pdo->prepare('UPDATE products SET quantity = quantity + :inc WHERE id = :id');
            foreach ($items as $it) {
                $pid = (int)$it['product_id'];
                $inc = (int)$it['quantity'];
                if ($pid <= 0 || $inc <= 0) continue;
                $incStmt->execute([':inc' => $inc, ':id' => $pid]);
            }
        }

        // Persist the new status
        $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
        $stmt->execute([$status, $orderId]);

        $pdo->commit();
        sp_json_response(['success' => true]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        sp_json_response(['success' => false, 'error' => 'Failed to update order: ' . $e->getMessage()], 500);
    }
    
} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
