<?php

/**
 * =============================================================================
 * File: api/login_submit.php
 * Purpose: Handle user login requests.
 * =============================================================================
 * 
 * Supports both AJAX (JSON response) and classic form submission (Redirect).
 * 
 * Logic:
 *   1. Validate inputs (email/password).
 *   2. Fetch user from DB.
 *   3. Check if account is archived.
 *   4. Verify password hash.
 *   5. Set session variables.
 *   6. Return JSON or Redirect based on request type.
 * 
 * Response (AJAX):
 *   { "success": true, "user": {...}, "redirect": "..." }
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
    header('Location: ../home.php?login_result=error&login_message=Method not allowed');
    exit;
}

// 2. Input Gathering
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$errors = [];

// 3. Validation
if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address';
}
if (empty($password)) {
    $errors[] = 'Password is required';
}

if (!empty($errors)) {
    $errorMessage = implode(', ', $errors);
    if ($isAjax) sp_json_response(['success' => false, 'error' => $errorMessage, 'errors' => $errors], 400);
    header('Location: ../home.php?login_result=error&login_message=' . urlencode($errorMessage));
    exit;
}

try {
    // 4. User Lookup
    $stmt = $pdo->prepare("SELECT id, email, password_hash, first_name, last_name, phone, role, is_archived FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        $msg = 'Invalid email or password';
        if ($isAjax) sp_json_response(['success' => false, 'error' => $msg], 401);
        header('Location: ../home.php?login_result=error&login_message=' . urlencode($msg));
        exit;
    }

    // 5. Status Check (Archived)
    $isArchived = isset($user['is_archived']) ? (int)$user['is_archived'] : 0;
    if ($isArchived) {
        $msg = 'This account has been deactivated. Please contact support to reactivate your account.';
        if ($isAjax) sp_json_response(['success' => false, 'error' => $msg], 403);
        header('Location: ../home.php?login_result=error&login_message=' . urlencode($msg));
        exit;
    }

    // 6. Password Verification
    if (!password_verify($password, $user['password_hash'])) {
        $msg = 'Invalid email or password';
        if ($isAjax) sp_json_response(['success' => false, 'error' => $msg], 401);
        header('Location: ../home.php?login_result=error&login_message=' . urlencode($msg));
        exit;
    }

    // 7. Session Setup (Success)
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['logged_in'] = true;

    // 8. Response
    $userInfo = [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'name' => trim($user['first_name'] . ' ' . $user['last_name']),
        'role' => $user['role'] ?? 'customer'
    ];

    // Determine target URL
    // JSON redirect path is relative to frontend root
    $jsonRedirectUrl = ($user['role'] === 'admin') ? 'admin/dashboard.php' : 'home.php';
    // Header redirect path is relative to current file (api/)
    $headerRedirectUrl = ($user['role'] === 'admin') ? '../admin/dashboard.php' : '../home.php';

    $successMsg = 'Welcome back, ' . $user['first_name'] . '!';
    $headerRedirectUrl .= '?login_result=success&login_message=' . urlencode($successMsg);

    if ($isAjax) {
        sp_json_response([
            'success' => true,
            'user' => $userInfo,
            'redirect' => $jsonRedirectUrl,
            'message' => $successMsg
        ], 200);
    }

    header('Location: ' . $headerRedirectUrl);
    exit;
} catch (PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    $msg = 'An error occurred during login. Please try again.';
    if ($isAjax) sp_json_response(['success' => false, 'error' => $msg], 500);
    header('Location: ../home.php?login_result=error&login_message=' . urlencode($msg));
    exit;
}
