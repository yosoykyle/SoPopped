<?php

/**
 * =============================================================================
 * File: api/signup_submit.php
 * Purpose: Handle new user registration.
 * =============================================================================
 * 
 * Supports both AJAX (JSON) and Form (Redirect) responses.
 * 
 * Logic:
 *   1. Validate inputs (required fields, password match, etc).
 *   2. Check if email already exists (including archived checks).
 *   3. Hash password.
 *   4. Insert new user into database.
 *   5. Return success message.
 * 
 * Response (AJAX):
 *   { "success": true, "user": {...}, "message": "..." }
 *   { "success": false, "error": "..." }
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../db/sopoppedDB.php';

sp_ensure_session();
$isAjax = sp_is_ajax_request();

// 1. Method Check
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if ($isAjax) sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
    header('Location: ../home.php?signup_result=error&signup_message=Method not allowed');
    exit;
}

// 2. Input Retrieval
$name = trim($_POST['name'] ?? '');
$middle = trim($_POST['middle'] ?? '');
$last = trim($_POST['last'] ?? '');
$email = strtolower(trim($_POST['email'] ?? ''));
$phone = trim($_POST['phone'] ?? '');
$password = $_POST['password'] ?? '';
$password2 = $_POST['password2'] ?? '';

// 3. Validation
$errors = [];
if (empty($name)) $errors[] = 'First name is required';
if (empty($last)) $errors[] = 'Last name is required';
if (empty($email)) $errors[] = 'Email is required';
elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Please enter a valid email address';

if (empty($phone)) $errors[] = 'Phone number is required';
if (empty($password)) $errors[] = 'Password is required';
elseif (strlen($password) < 8 || strlen($password) > 16) {
    $errors[] = 'Password must be 8-16 characters long';
} elseif (
    !preg_match('/[A-Z]/', $password) ||
    !preg_match('/[a-z]/', $password) ||
    !preg_match('/[0-9]/', $password) ||
    !preg_match('/[^A-Za-z0-9]/', $password)
) {
    $errors[] = 'Password must include uppercase, lowercase, number, and special character';
}

if (empty($password2)) $errors[] = 'Please confirm your password';
elseif ($password !== $password2) $errors[] = 'Passwords do not match';

if (!empty($errors)) {
    $msg = implode(', ', $errors);
    if ($isAjax) sp_json_response(['success' => false, 'error' => $msg, 'errors' => $errors], 400);
    header('Location: ../home.php?signup_result=error&signup_message=' . urlencode($msg));
    exit;
}

try {
    // 4. Duplicate Check
    $stmt = $pdo->prepare("SELECT id, is_archived FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $msg = !empty($existing['is_archived'])
            ? 'An archived account already exists with this email. Creating a new account with the same email is not allowed.'
            : 'An account with this email already exists';

        if ($isAjax) sp_json_response(['success' => false, 'error' => $msg], 409);
        header('Location: ../home.php?signup_result=error&signup_message=' . urlencode($msg));
        exit;
    }

    // 5. Create User
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("
        INSERT INTO users (email, password_hash, first_name, middle_name, last_name, phone, role) 
        VALUES (?, ?, ?, ?, ?, ?, 'customer')
    ");

    $stmt->execute([
        $email,
        $passwordHash,
        $name,
        !empty($middle) ? $middle : null,
        $last,
        $phone
    ]);

    $userId = $pdo->lastInsertId();
    $fullName = trim($name . ' ' . ($middle ?? '') . ' ' . $last);

    // 6. Response
    $successMsg = 'Account created successfully! You can now log in.';
    if ($isAjax) {
        sp_json_response([
            'success' => true,
            'user' => ['id' => (int)$userId, 'email' => $email, 'name' => $fullName],
            'message' => $successMsg
        ], 201);
    }
    header('Location: ../home.php?signup_result=success&signup_message=' . urlencode($successMsg));
    exit;
} catch (PDOException $e) {
    error_log("Signup error: " . $e->getMessage());
    $msg = 'An error occurred while creating your account. Please try again.';
    if ($isAjax) sp_json_response(['success' => false, 'error' => $msg], 500);
    header('Location: ../home.php?signup_result=error&signup_message=' . urlencode($msg));
    exit;
}
