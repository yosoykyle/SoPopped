<?php
// api/cart_save.php - save cart JSON for logged-in user
// Use helpers for JSON headers and session handling (keeps behavior identical)
require_once __DIR__ . '/_helpers.php';
sp_json_header();
sp_ensure_session();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
}
if (!isset($_SESSION['user_id']) || !$_SESSION['user_id']) {
    sp_json_response(['success' => false, 'error' => 'Not authenticated'], 401);
}
require_once __DIR__ . '/../db/sopoppedDB.php';
$raw = file_get_contents('php://input');
$data = [];
// Try to parse JSON body, fall back to form parameter
if ($raw) {
    $maybe = json_decode($raw, true);
    if (is_array($maybe)) $data = $maybe;
}
if (empty($data) && isset($_POST['cart'])) {
    $maybe = json_decode($_POST['cart'], true);
    if (is_array($maybe)) $data = $maybe;
}
if (!is_array($data)) $data = [];
try {
    // Upsert into user_carts
    // Note: some PDO/MySQL drivers require unique named parameters for repeated placeholders,
    // so we use :cj and :cj2 and bind both to the same value.
    $stmt = $pdo->prepare('INSERT INTO user_carts (user_id, cart_json, updated_at) VALUES (:uid, :cj, NOW()) ON DUPLICATE KEY UPDATE cart_json = :cj2, updated_at = NOW()');
    $json = json_encode($data, JSON_UNESCAPED_UNICODE);
    $stmt->execute([':uid' => $_SESSION['user_id'], ':cj' => $json, ':cj2' => $json]);
    // Return saved cart for client confirmation (backwards-compatible: includes success:true)
    sp_json_response(['success' => true, 'cart' => $data]);
} catch (Exception $e) {
    http_response_code(500);
    // Log error for debugging (do not expose full details to client in production)
    error_log('cart_save error: ' . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'Server error'], 500);
}
