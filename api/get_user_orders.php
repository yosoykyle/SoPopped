<?php

/**
 * =============================================================================
 * File: api/get_user_orders.php
 * Purpose: Fetch Order History with Details.
 * =============================================================================
 * 
 * NOTE:
 * Retrieving orders is tricky because the data is split across two tables:
 *   1. `orders`: The main receipt (Total, Date, Status).
 *   2. `order_items`: The specific products in that receipt.
 * 
 * We have to fetch the Orders first, collecting their IDs, 
 * and then run a second query to get the Items for those IDs.
 * Then we "Stitch" them together in PHP.
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';
sp_json_header();
sp_ensure_session();

// -----------------------------------------------------------------------------
// STEP 1: WHO ARE YOU?
// -----------------------------------------------------------------------------
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    sp_json_response(['success' => false, 'error' => 'Not authenticated'], 401);
}

$userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : 0;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
if ($limit <= 0) $limit = 10;
if ($limit > 100) $limit = 100; // Safety cap

require_once __DIR__ . '/../db/sopoppedDB.php';

try {
    // -----------------------------------------------------------------------------
    // STEP 2: GET THE RECEIPTS (Orders Table)
    // -----------------------------------------------------------------------------
    // First, we find the main order records for this user.
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

    // -----------------------------------------------------------------------------
    // STEP 3: GET THE ITEMS (Items Table)
    // -----------------------------------------------------------------------------
    // We need to know specific Order IDs to find the matching items.
    $orderIds = array_map(function ($r) {
        return (int)$r['id'];
    }, $orders);

    $itemsMap = [];

    if (count($orderIds) > 0) {
        // Create a list of placeholders like "?, ?, ?" based on how many orders we found.
        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));

        // This query joins `order_items` with `products` so we can get the Product Name too.
        $itemSql = "
            SELECT oi.order_id, oi.product_id, oi.price_at_purchase, oi.quantity, p.name AS product_name
            FROM order_items oi
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id IN ($placeholders)
        ";
        $itemStmt = $pdo->prepare($itemSql);
        $itemStmt->execute($orderIds);

        // Group items by their Order ID so we can attach them later.
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

    // -----------------------------------------------------------------------------
    // STEP 4: STITCH IT TOGETHER (Assemble)
    // -----------------------------------------------------------------------------
    // Loop through the main orders and attach the 'items' list we found.
    foreach ($orders as &$o) {
        $o['id'] = (int)$o['id'];
        $o['total_amount'] = (float)$o['total_amount'];
        $o['shipping_address'] = $o['shipping_address'] ? json_decode($o['shipping_address'], true) : null;
        // Attach the items here!
        $o['items'] = isset($itemsMap[$o['id']]) ? $itemsMap[$o['id']] : [];
    }

    // -----------------------------------------------------------------------------
    // STEP 5: SERVE
    // -----------------------------------------------------------------------------
    sp_json_response(['success' => true, 'orders' => $orders], 200);
} catch (PDOException $e) {
    error_log("get_user_orders error: " . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'Database error'], 500);
}
