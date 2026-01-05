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

// 📋 SNIPPET LOCATION: MARKDOWNS/REPORTS/admin_task_delegation.md
// 📦 Package A: User Management → 2. Backend: `api/admin/get_users.php`
// ► Replace the first sp_json_response line below with the snippet

try {
    // Mock response for scaffolding - REMOVE THIS LINE and paste snippet here
    sp_json_response(['success' => true, 'data' => []]);

} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
