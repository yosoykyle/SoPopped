<?php
/**
 * Archive User (Soft Delete)
 * 
 * Purpose: Marks a user as archived without permanently deleting their data.
 * Consumed by: admin/users.php (archive/delete button)
 * Action: Sets is_archived = 1 for the specified user ID
 */
// API: Soft Delete User
// Consumer: admin/users.php (Archive Button)
require_once __DIR__ . '/check_auth.php';
require_once __DIR__ . '/../../db/sopoppedDB.php';

try {
    sp_json_response(['success' => true]); // REMOVE THIS LINE and paste snippet here
    
} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
