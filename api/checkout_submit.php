<?php
// api/contact_submit.php
// Accepts POST from contact form and inserts into contact_messages.
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . './db/sopoppedDB.php';

$firstName = isset($_POST['firstName']) ? trim((string)$_POST['firstName']) : '';
$lastName = isset($_POST['lastName']) ? trim((string)$_POST['lastName']) : '';
$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
$address = isset($_POST['address']) ? trim((string)$_POST['address']) : '';

$errors = [];
if ($firstName === '' || mb_strlen($firstName) < 2) {
    $errors['firstName'] = 'Please enter your name (2+ characters).';
}

if ($lastName === '' || mb_strlen($lastName) < 2) {
    $errors['lastName'] = 'Please enter your name (2+ characters).';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email address.';
}


if (!empty($errors)) {
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

try {
    $stmt = $pdo->prepare('INSERT INTO checkout_info (firstname, lastname, email, address, province, city, barangay, paymentMethod) VALUES (:firstname, :lastname, :email, :address, :province, :city, :barangay, :paymentMethod)');
    $stmt->execute([
        ':firstName' => $firstName,
        ':lastName' => $lastName,
        ':email' => $email,
        ':address' => $address,
        ':province' => $province,
        ':city' => $city,
        ':barangay' => $barangay,
        ':paymentMethod' => $paymentMethod,
    ]);
    $id = (int)$pdo->lastInsertId();
    echo json_encode(['success' => true, 'id' => $id]);
} catch (PDOException $e) {
    http_response_code(500);
    // Log error in real app instead of exposing details
    echo json_encode(['success' => false, 'error' => 'Database error']);
}


//database niya if ever?  di pa complete

/* CREATE TABLE IF NOT EXISTS `checkout_info` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NULL,
  `order_id` INT UNSIGNED NULL,
  `firstname` VARCHAR(100) NOT NULL,
  `lastname` VARCHAR(50) NULL,
  `email` VARCHAR(100) NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_actor` (`order_id`),
  CONSTRAINT `fk_audit_actor_user` FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
