<?php
// api/contact_submit.php
// Accepts POST from contact form and inserts into contact_messages.
require_once __DIR__ . '/_helpers.php';
sp_json_header();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
}

require_once __DIR__ . '/../db/sopoppedDB.php';

$name = isset($_POST['name']) ? trim((string)$_POST['name']) : '';
$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
$message = isset($_POST['message']) ? trim((string)$_POST['message']) : '';

$errors = [];
if ($name === '' || mb_strlen($name) < 2) {
    $errors['name'] = 'Please enter your name (2+ characters).';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email address.';
}
if ($message === '' || mb_strlen($message) < 10) {
    $errors['message'] = 'Message must be at least 10 characters long.';
}

if (!empty($errors)) {
    sp_json_response(['success' => false, 'errors' => $errors], 400);
}

try {
    $stmt = $pdo->prepare('INSERT INTO contact_messages (name, email, message) VALUES (:name, :email, :message)');
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':message' => $message,
    ]);
    $id = (int)$pdo->lastInsertId();
    sp_json_response(['success' => true, 'id' => $id], 201);
} catch (PDOException $e) {
    http_response_code(500);
    // Log error in real app instead of exposing details
    sp_json_response(['success' => false, 'error' => 'Database error'], 500);
}
