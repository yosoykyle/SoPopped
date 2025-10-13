<?php
// api/contact_submit.php
// Accepts POST from contact form and inserts into contact_messages.
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../sopoppedDB/sopoppedDB.php';

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
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

try {
    $stmt = $pdo->prepare('INSERT INTO contact_messages (name, email, message) VALUES (:name, :email, :message)');
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':message' => $message,
    ]);
    $id = (int)$pdo->lastInsertId();
    echo json_encode(['success' => true, 'id' => $id]);
} catch (PDOException $e) {
    http_response_code(500);
    // Log error in real app instead of exposing details
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
