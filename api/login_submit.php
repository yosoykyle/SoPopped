<?php

/**
 * =============================================================================
 * File: api/login_submit.php
 * Purpose: Authenticate a user and start a session.
 * =============================================================================
 * 
 * NOTE:
 * This script is the "Doorway" to the site.
 * It has one job: Prove the user is who they say they are.
 * 
 * Process:
 *   1. Check if the email exists.
 *   2. Check if the password matches the "Hash" (encrypted version).
 *   3. If yes, give them a "Session Badge" (Cookie) so they stay logged in.
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
    header('Location: ../home.php?login_result=error&login_message=Method not allowed');
    exit;
}

// -----------------------------------------------------------------------------
// STEP 2: GATHER INPUTS
// -----------------------------------------------------------------------------
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$errors = [];

// -----------------------------------------------------------------------------
// STEP 3: BASIC VALIDATION
// -----------------------------------------------------------------------------
// Ensure fields aren't empty before bothering the database.
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
    // -----------------------------------------------------------------------------
    // STEP 4: FIND THE USER
    // -----------------------------------------------------------------------------
    // ask the database: "Do you have anyone with this email?"
    $stmt = $pdo->prepare("SELECT id, email, password_hash, first_name, last_name, phone, role, is_archived FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        $msg = 'Invalid email or password';
        if ($isAjax) sp_json_response(['success' => false, 'error' => $msg], 200);
        header('Location: ../home.php?login_result=error&login_message=' . urlencode($msg));
        exit;
    }

    // -----------------------------------------------------------------------------
    // STEP 5: CHECK STATUS
    // -----------------------------------------------------------------------------
    // Even if they exist, are they allowed in? (e.g. Banned or Deleted accounts)
    $isArchived = isset($user['is_archived']) ? (int)$user['is_archived'] : 0;
    if ($isArchived) {
        $msg = 'This account has been deactivated. Please contact support to reactivate your account.';
        if ($isAjax) sp_json_response(['success' => false, 'error' => $msg], 403);
        header('Location: ../home.php?login_result=error&login_message=' . urlencode($msg));
        exit;
    }

    // -----------------------------------------------------------------------------
    // STEP 6: VERIFY PASSWORD
    // -----------------------------------------------------------------------------
    // Compare the typed password with the "Hash" stored in the database.
    // We use password_verify() because it handles the specialized encryption rules.
    if (!password_verify($password, $user['password_hash'])) {
        $msg = 'Invalid email or password';
        if ($isAjax) sp_json_response(['success' => false, 'error' => $msg], 200);
        header('Location: ../home.php?login_result=error&login_message=' . urlencode($msg));
        exit;
    }

    // -----------------------------------------------------------------------------
    // STEP 7: START SESSION (The Badge)
    // -----------------------------------------------------------------------------
    // Success! Store their info in the server's memory ($_SESSION).
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['logged_in'] = true;

    // -----------------------------------------------------------------------------
    // STEP 8: RESPOND
    // -----------------------------------------------------------------------------
    // Tell the frontend where to go next (Admin Dashboard or Home).

    $userInfo = [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'name' => trim($user['first_name'] . ' ' . $user['last_name']),
        'role' => $user['role'] ?? 'customer'
    ];

    $jsonRedirectUrl = ($user['role'] === 'admin') ? 'admin/dashboard.php' : 'home.php';
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
