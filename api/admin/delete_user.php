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
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $id = isset($input['id']) ? (int)$input['id'] : 0;

    if (!$id) sp_json_response(['success' => false, 'error' => 'Invalid id'], 400);
    if (isset($_SESSION['user_id']) && $_SESSION['user_id'] == $id) {
        sp_json_response(['success' => false, 'error' => 'Cannot archive your own account'], 403);
    }

    try {
        $stmt = $pdo->prepare("UPDATE users SET is_archived = 1 WHERE id = ?");
        $stmt->execute([$id]);

        // Best-effort: invalidate PHP session files that belong to this user so
        // their active sessions are logged out on the next request.
        try {
            $savePath = session_save_path();
            if (empty($savePath)) $savePath = sys_get_temp_dir();
            // session_save_path can contain directives separated by ';', take last path part
            if (strpos($savePath, ';') !== false) {
                $parts = explode(';', $savePath);
                $savePath = trim($parts[count($parts) - 1]);
            }

            if (is_dir($savePath)) {
                $pattern = rtrim($savePath, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'sess_*';
                foreach (glob($pattern) as $sessFile) {
                    // Attempt to read file and look for serialized user_id
                    $contents = @file_get_contents($sessFile);
                    if ($contents === false) continue;

                    // Serialized integer: user_id|i:123;
                    $intPattern = 'user_id|i:' . $id . ';';
                    if (strpos($contents, $intPattern) !== false) {
                        @unlink($sessFile);
                        continue;
                    }

                    // Serialized string: user_id|s:3:"123";
                    if (preg_match('/user_id\\|s:\\d+:"' . preg_quote((string)$id, '/') . '";/', $contents)) {
                        @unlink($sessFile);
                        continue;
                    }
                }
            }
        } catch (Exception $e) {
            // ignore session cleanup errors (best-effort)
        }

        sp_json_response(['success' => true]);
    } catch (Exception $e) {
        sp_json_response(['success' => false, 'error' => 'Failed to archive user'], 500);
    } 
    
} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
