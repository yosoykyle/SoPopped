<?php
require_once __DIR__ . '/_helpers.php';
// Start session (safe to call)
sp_ensure_session();

// Detect AJAX/JSON request
$isAjax = sp_is_ajax_request();

// Destroy all session data
session_destroy();

if ($isAjax) {
	sp_json_response(['success' => true, 'message' => 'You have been logged out successfully.'], 200);
}

// Redirect to home page with logout message for non-AJAX
header('Location: ../home.php?logout_result=success&logout_message=' . urlencode('You have been logged out successfully.'));
exit;
?>
