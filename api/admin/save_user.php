<?php

/**
 * Save User (Create/Update)
 * 
 * Purpose: Creates a new user or updates an existing user's information.
 * Consumed by: admin/users.php (user modal form submission)
 * Action: INSERT if no ID provided, UPDATE if ID exists. Hashes passwords.
 */
// API: Create/Update User
// Consumer: admin/users.php (User Modal)
require_once __DIR__ . '/check_auth.php';
require_once __DIR__ . '/../../db/sopoppedDB.php';

$input = json_decode(file_get_contents('php://input'), true);

// 📋 SNIPPET LOCATION: MARKDOWNS/REPORTS/admin_task_delegation.md
// 📦 Package A: User Management → 3. Backend: `api/admin/save_user.php`
// ► Replace the first sp_json_response line below with the snippet

try {
    sp_json_response(['success' => true]); // REMOVE THIS LINE and paste snippet here

} catch (PDOException $e) {
    // Avoid leaking sensitive info
    error_log("User save error: " . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'Database error occurred'], 500);
} catch (Exception $e) {
    error_log("Unexpected error in save_user: " . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'An unexpected error occurred'], 500);
}
