<?php
// api/session_info.php - returns minimal session info for frontend
// Start session before any output so Set-Cookie (session) can be sent if needed
require_once __DIR__ . '/_helpers.php';
sp_ensure_session();
sp_json_header();

$response = ['logged_in' => false];
if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    $response['logged_in'] = true;
    $response['user_id'] = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    // use `username` key for a concise client contract
    $response['username'] = isset($_SESSION['user_name']) ? (string)$_SESSION['user_name'] : '';
    sp_json_response($response, 200);
}

// Not authenticated: return 401 and a simple payload
sp_json_response($response, 401);
// sp_json_response exits
