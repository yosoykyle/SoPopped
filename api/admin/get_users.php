<?php

/**
 * Get Users List (Admin)
 * 
 * Purpose: Fetches all users from the database for display in the admin panel.
 * Consumed by: admin/users.php (populates the users table)
 * Returns: JSON array of user objects with id, name, email, role, is_archived
 */
// API: Read Users List
// Consumer: admin/users.php (Data Table)
require_once __DIR__ . '/check_auth.php'; // 1. Security Gate
require_once __DIR__ . '/../../db/sopoppedDB.php'; // 2. DB Connection



try {
    
    $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 100;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset']) : 0;

    try {
        $stmt = $pdo->prepare("SELECT id, first_name, middle_name, last_name, email, role, is_archived, created_at, updated_at FROM users ORDER BY created_at ASC LIMIT ? OFFSET ?");
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->bindValue(2, $offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sp_json_response(['success' => true, 'data' => $data]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => 'Failed to fetch users'], 500);
    }

} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
