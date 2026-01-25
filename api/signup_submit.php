<?php

/**
 * =============================================================================
 * File: api/signup_submit.php
 * Purpose: Create a completely new user account.
 * =============================================================================
 * 
 * NOTE:
 * Registration is about "Onboarding".
 * We need to:
 *   1. Clean the input (Sanitize).
 *   2. Ensure the email is unique (Reference data).
 *   3. Protect the password (Hash).
 *   4. Save the new record (Insert).
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../db/sopoppedDB.php';

sp_ensure_session();
$isAjax = sp_is_ajax_request();

// -----------------------------------------------------------------------------
// STEP 1: METHOD CHECK
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if ($isAjax) sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
    header('Location: ../home.php?signup_result=error&signup_message=Method not allowed');
    exit;
}

// -----------------------------------------------------------------------------
// STEP 2: GATHER INFO
// -----------------------------------------------------------------------------
$name = trim($_POST['name'] ?? '');
$middle = trim($_POST['middle'] ?? '');
$last = trim($_POST['last'] ?? '');
$email = strtolower(trim($_POST['email'] ?? '')); // Emails are always lowercase for consistency
$phone = trim($_POST['phone'] ?? '');
$password = $_POST['password'] ?? '';
$password2 = $_POST['password2'] ?? '';

// -----------------------------------------------------------------------------
// STEP 3: VALIDATION
// -----------------------------------------------------------------------------
// Check for empty fields and password strength rules.
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
    // -----------------------------------------------------------------------------
    // STEP 4: DUPLICATE CHECK
    // -----------------------------------------------------------------------------
    // We cannot have two users with the same email.
    $stmt = $pdo->prepare("SELECT id, is_archived FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        $msg = !empty($existing['is_archived'])
            ? 'An archived account already exists with this email.'
            : 'An account with this email already exists';

        if ($isAjax) sp_json_response(['success' => false, 'error' => $msg], 409);
        header('Location: ../home.php?signup_result=error&signup_message=' . urlencode($msg));
        exit;
    }

    // -----------------------------------------------------------------------------
    // STEP 5: SECURE THE PASSWORD
    // -----------------------------------------------------------------------------
    // NEVER save plain text passwords. We turn "password123" into "$2y$10$..."
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // -----------------------------------------------------------------------------
    // STEP 6: CREATE THE USER
    // -----------------------------------------------------------------------------
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

    // -----------------------------------------------------------------------------
    // STEP 7: DONE
    // -----------------------------------------------------------------------------
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
