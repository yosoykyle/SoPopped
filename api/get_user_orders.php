<?php

/**
 * =============================================================================
 * File: api/get_user_orders.php
 * Purpose: Retrieve order history for the logged-in user.
 * =============================================================================
 * 
 * Returns a JSON list of past orders including order details and order items.
 * 
 * Inputs (GET):
 *   - limit (optional): Max number of orders to return (default 10, max 100).
 * 
 * Logic:
 *   1. Auth check.
 *   2. Fetch orders from `orders` table (DESC by date).
 *   3. Collect Order IDs.
 *   4. Fetch associated items from `order_items` table.
 *   5. Merge items into order objects.
 *   6. Return combined JSON.
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';
sp_json_header();
sp_ensure_session();

// 1. Auth Check
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    sp_json_response(['success' => false, 'error' => 'Not authenticated'], 401);
}

$userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
if ($limit <= 0) $limit = 10;
if ($limit > 100) $limit = 100;

require_once __DIR__ . '/../db/sopoppedDB.php';

try {
    // 2. Fetch Orders
    $stmt = $pdo->prepare('
        SELECT id, total_amount, status, payment_method, shipping_address, created_at 
        FROM orders 
        WHERE user_id = :uid 
        ORDER BY created_at DESC 
        LIMIT :limit
    ');
    $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Fetch Items for these orders
    $orderIds = array_map(function ($r) {
        return (int)$r['id'];
    }, $orders);
    $itemsMap = [];

    if (count($orderIds) > 0) {
        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
        $itemSql = "
            SELECT oi.order_id, oi.product_id, oi.price_at_purchase, oi.quantity, p.name AS product_name
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id IN ($placeholders)
        ";
        $itemStmt = $pdo->prepare($itemSql);
        $itemStmt->execute($orderIds);

        while ($row = $itemStmt->fetch(PDO::FETCH_ASSOC)) {
            $oid = (int)$row['order_id'];
            if (!isset($itemsMap[$oid])) $itemsMap[$oid] = [];
            $itemsMap[$oid][] = [
                'product_id' => (int)$row['product_id'],
                'product_name' => isset($row['product_name']) ? (string)$row['product_name'] : 'Unknown Product',
                'price_at_purchase' => (float)$row['price_at_purchase'],
                'quantity' => (int)$row['quantity']
            ];
        }
    }

    // 4. Assemble Response
    foreach ($orders as &$o) {
        $o['id'] = (int)$o['id'];
        $o['total_amount'] = (float)$o['total_amount'];
        $o['shipping_address'] = $o['shipping_address'] ? json_decode($o['shipping_address'], true) : null;
        $o['items'] = isset($itemsMap[$o['id']]) ? $itemsMap[$o['id']] : [];
    }

    sp_json_response(['success' => true, 'orders' => $orders], 200);
} catch (PDOException $e) {
    error_log("get_user_orders error: " . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'Database error'], 500);
}
