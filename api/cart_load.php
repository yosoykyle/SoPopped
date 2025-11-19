<?php
// api/cart_load.php - returns saved cart JSON for logged-in user
// Use small helper to standardize JSON header & session start (no behavior change).
require_once __DIR__ . '/_helpers.php';
sp_json_header();
sp_ensure_session();
if (!isset($_SESSION['user_id']) || !$_SESSION['user_id']) {
    sp_json_response(['success' => false, 'error' => 'Not authenticated'], 401);
}
require_once __DIR__ . '/../db/sopoppedDB.php';
try {
    $stmt = $pdo->prepare('SELECT cart_json FROM user_carts WHERE user_id = :uid LIMIT 1');
    $stmt->execute([':uid' => $_SESSION['user_id']]);
    $row = $stmt->fetch();
    $cart = [];
    if ($row && isset($row['cart_json']) && $row['cart_json'] !== null) {
        $cart = json_decode($row['cart_json'], true) ?: [];
    }
    sp_json_response(['success' => true, 'cart' => $cart]);
} catch (Exception $e) {
    http_response_code(500);
    sp_json_response(['success' => false, 'error' => 'Server error'], 500);
}


































