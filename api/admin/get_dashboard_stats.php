<?php

/**
 * Get Dashboard Statistics
 * 
 * Target: CONSORTE JR., FRANCISCO L.
 * Task: Implement dashboard stats using the snippet from admin_task_delegation.md
 */
require_once __DIR__ . '/../../db/sopoppedDB.php';
require_once __DIR__ . '/check_auth.php';

    try {
        // Fetch summary statistics
        // 1. Total Users & New Users Today
        $userStats = $pdo->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today
            FROM users
            WHERE role != 'admin' AND is_archived = 0
        ")->fetch(PDO::FETCH_ASSOC);

        // 2. Total Products & Low Stock
        $prodStats = $pdo->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN quantity < 10 AND is_active = 1 THEN 1 ELSE 0 END) as low_stock
            FROM products
            WHERE is_active = 1
        ")->fetch(PDO::FETCH_ASSOC);

        // 3. Order Stats
        $orderStats = $pdo->query("
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
            FROM orders
        ")->fetch(PDO::FETCH_ASSOC);

        $data = [
            'total_users' => $userStats['total'],
            'new_users_today' => $userStats['new_today'] ?? 0,
            'total_products' => $prodStats['total'],
            'low_stock' => $prodStats['low_stock'] ?? 0,
            'total_orders' => $orderStats['total'],
            'pending_orders' => $orderStats['pending'] ?? 0
        ];

        sp_json_response(['success' => true, 'data' => $data]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
    }
