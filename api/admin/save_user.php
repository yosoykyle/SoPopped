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
   $first  = trim($input['first_name'] ?? '');
    $middle = trim($input['middle_name'] ?? '');
    $last   = trim($input['last_name'] ?? '');
    $email  = trim(strtolower($input['email'] ?? ''));
    $role   = trim($input['role'] ?? 'customer');
    $isArchived = isset($input['is_archived']) ? (int)$input['is_archived'] : 0;
    $id     = isset($input['id']) && $input['id'] !== '' ? (int)$input['id'] : null;
    $password = $input['password'] ?? '';

    // === Basic field validation ===
    if (empty($first) || strlen($first) < 2 || strlen($first) > 100) {
        sp_json_response(['success' => false, 'error' => 'First name must be 2-100 characters'], 400);
    }
    if (empty($last) || strlen($last) < 2 || strlen($last) > 100) {
        sp_json_response(['success' => false, 'error' => 'Last name must be 2-100 characters'], 400);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sp_json_response(['success' => false, 'error' => 'Invalid email address'], 400);
    }
    if (!in_array($role, ['customer', 'admin'])) {
        sp_json_response(['success' => false, 'error' => 'Invalid role selected'], 400);
    }

    // === Password validation (required on create, optional on update) ===
    if (!$id && empty($password)) {
        sp_json_response(['success' => false, 'error' => 'Password is required for new users'], 400);
    }

    if (!empty($password)) {
        // Server-side password strength (mirroring frontend rules)
        if (strlen($password) < 8 || strlen($password) > 16) {
            sp_json_response(['success' => false, 'error' => 'Password must be 8-16 characters'], 400);
        }
        if (
            !preg_match('/[A-Z]/', $password) ||
            !preg_match('/[a-z]/', $password) ||
            !preg_match('/[0-9]/', $password) ||
            !preg_match('/[^A-Za-z0-9]/', $password)
        ) {
            sp_json_response(['success' => false, 'error' => 'Password must include uppercase, lowercase, number, and special character'], 400);
        }
    }

    // === Self-protection: Admins can't demote or archive themselves ===
    $currentUserId = $_SESSION['user_id'] ?? null;
    if ($currentUserId && $id == $currentUserId) {
        if ($role !== 'admin') {
            sp_json_response(['success' => false, 'error' => 'You cannot remove your own admin privileges'], 403);
        }
        if ($isArchived == 1) {
            sp_json_response(['success' => false, 'error' => 'You cannot archive your own account'], 403);
        }
    }

    // === Email uniqueness check ===
    $checkSql = "SELECT id FROM users WHERE LOWER(email) = ? AND id != ? LIMIT 1";
    $checkParams = [$email, $id ?? 0];
    if (!$id) {
        $checkSql = "SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1";
        $checkParams = [$email];
    }

    $check = $pdo->prepare($checkSql);
    $check->execute($checkParams);
    if ($check->fetch()) {
        sp_json_response(['success' => false, 'error' => 'This email is already in use'], 400);
    }

    // === Perform update or insert ===
    if ($id) {
        // Update existing user
        if (!empty($password)) {
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $sql = "UPDATE users
                    SET first_name=?, middle_name=?, last_name=?, email=?, role=?, is_archived=?, password_hash=?
                    WHERE id=?";
            $params = [$first, $middle, $last, $email, $role, $isArchived, $hash, $id];
        } else {
            $sql = "UPDATE users
                    SET first_name=?, middle_name=?, last_name=?, email=?, role=?, is_archived=?
                    WHERE id=?";
            $params = [$first, $middle, $last, $email, $role, $isArchived, $id];
        }
    } else {
        // Create new user
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $sql = "INSERT INTO users
                (first_name, middle_name, last_name, email, role, password_hash, is_archived, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())";
        $params = [$first, $middle, $last, $email, $role, $hash, $isArchived];
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sp_json_response(['success' => true, 'message' => 'User saved successfully']); 

} catch (PDOException $e) {
    // Avoid leaking sensitive info
    error_log("User save error: " . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'Database error occurred'], 500);
} catch (Exception $e) {
    error_log("Unexpected error in save_user: " . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'An unexpected error occurred'], 500);
}
