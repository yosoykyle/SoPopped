<?php

/**
 * =============================================================================
 * File: api/contact_submit.php
 * Purpose: Handle 'Contact Us' form submissions.
 * =============================================================================
 * 
 * NOTE:
 * A simple "Fire and Forget" endpoint.
 * The user sends a message, we validte it, and save it to the database table 
 * `contact_messages`.
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';
sp_json_header();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
}

require_once __DIR__ . '/../db/sopoppedDB.php';

// -----------------------------------------------------------------------------
// STEP 1: SANITIZE INPUTS
// -----------------------------------------------------------------------------
$name = isset($_POST['name']) ? trim((string)$_POST['name']) : '';
$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
$message = isset($_POST['message']) ? trim((string)$_POST['message']) : '';

// -----------------------------------------------------------------------------
// STEP 2: VALIDATE
// -----------------------------------------------------------------------------
$errors = [];
if ($name === '' || mb_strlen($name) < 2) $errors['name'] = 'Please enter your name (2+ characters).';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Please enter a valid email address.';
if ($message === '' || mb_strlen($message) < 10) $errors['message'] = 'Message must be at least 10 characters long.';

if (!empty($errors)) {
    sp_json_response(['success' => false, 'errors' => $errors], 400);
}

try {
    // -----------------------------------------------------------------------------
    // STEP 3: SAVE MESSAGE
    // -----------------------------------------------------------------------------
    $stmt = $pdo->prepare('INSERT INTO contact_messages (name, email, message) VALUES (:name, :email, :message)');
    $stmt->execute([
        ':name' => $name,
        ':email' => $email,
        ':message' => $message,
    ]);

    sp_json_response(['success' => true, 'id' => (int)$pdo->lastInsertId()], 201);
} catch (PDOException $e) {
    error_log("Contact submit error: " . $e->getMessage());
    sp_json_response(['success' => false, 'error' => 'Database error'], 500);
}
