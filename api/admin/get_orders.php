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
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 100;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    $status = isset($_GET['status']) ? $_GET['status'] : '';

    try {
        $whereClause = "";
        $params = [];

        if (!empty($status) && in_array($status, ['pending', 'paid', 'shipped', 'cancelled'])) {
            $whereClause = "WHERE o.status = ?";
            $params[] = $status;
        }

        $sql = "SELECT o.id, o.user_id, o.total_amount, o.status, o.created_at, u.first_name, u.last_name,
                       GROUP_CONCAT(CONCAT('#', oi.product_id, ' <span class=\'text-dark fw-bold\'>x', oi.quantity, '</span>') SEPARATOR ', ') as product_ids
                FROM orders o
                JOIN users u ON o.user_id = u.id
                LEFT JOIN order_items oi ON o.id = oi.order_id
                $whereClause
                GROUP BY o.id
                ORDER BY o.created_at ASC
                LIMIT ? OFFSET ?";

        $stmt = $pdo->prepare($sql);

        $paramIndex = 1;
        foreach ($params as $param) {
            $stmt->bindValue($paramIndex++, $param);
        }

        $stmt->bindValue($paramIndex++, $limit, PDO::PARAM_INT);
        $stmt->bindValue($paramIndex++, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sp_json_response(['success' => true, 'data' => $data]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => 'Failed to fetch orders'], 500);
    }
} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
