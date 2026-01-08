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
   $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 100;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    try {
        $stmt = $pdo->prepare("SELECT id, name, description, price, quantity, is_active, image_path, created_at FROM products ORDER BY id DESC LIMIT ? OFFSET ?");
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sp_json_response(['success' => true, 'data' => $data]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => 'Failed to fetch products'], 500);
    }
    
} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
