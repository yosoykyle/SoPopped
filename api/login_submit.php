<?php
// Use helpers for session/json handling (no behavior change)
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../db/sopoppedDB.php';
sp_ensure_session();
$isAjax = sp_is_ajax_request();

// Use sp_json_response when sending JSON responses

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if ($isAjax) sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
    header('Location: ../home.php?login_result=error&login_message=Method not allowed');
    exit;
}

// Get form data
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

// Validation
$errors = [];

// Validate required fields
if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address';
}

if (empty($password)) {
    $errors[] = 'Password is required';
}

// If there are validation errors, respond appropriately
if (!empty($errors)) {
    $errorMessage = implode(', ', $errors);
    if ($isAjax) sp_json_response(['success' => false, 'error' => $errorMessage, 'errors' => $errors], 400);
    header('Location: ../home.php?login_result=error&login_message=' . urlencode($errorMessage));
    exit;
}

try {
    // Check if user exists and get user data
    // First, attempt to fetch the user regardless of archived status so we can
    // provide a specific message if the account is archived.
    $stmt = $pdo->prepare("SELECT id, email, password_hash, first_name, last_name, phone, role, is_archived FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // No user found at all
        if ($isAjax) sp_json_response(['success' => false, 'error' => 'Invalid email or password'], 401);
        header('Location: ../home.php?login_result=error&login_message=' . urlencode('Invalid email or password'));
        exit;
    }

    // If the account is archived, reject login with a clear message.
    // Keep the message intentionally generic about account status to avoid leaking
    // too much information, but still helpful for legitimate users.
    $isArchived = isset($user['is_archived']) ? (int)$user['is_archived'] : 0;
    if ($isArchived) {
        $msg = 'This account has been deactivated. Please contact support to reactivate your account.';
        if ($isAjax) sp_json_response(['success' => false, 'error' => $msg], 403);
        header('Location: ../home.php?login_result=error&login_message=' . urlencode($msg));
        exit;
    }

    // Verify password for active accounts
    if (!password_verify($password, $user['password_hash'])) {
        if ($isAjax) sp_json_response(['success' => false, 'error' => 'Invalid email or password'], 401);
        header('Location: ../home.php?login_result=error&login_message=' . urlencode('Invalid email or password'));
        exit;
    }

    // Login successful - set session variables
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name'] = $user['first_name'] . ' ' . $user['last_name'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['logged_in'] = true;

    // Optional: Update last login time (you might want to add this column to your users table)
    // $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    // $stmt->execute([$user['id']]);

    // Successful login - respond with JSON for AJAX or redirect for classic form
    $userInfo = [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'name' => trim($user['first_name'] . ' ' . $user['last_name']),
        'role' => $user['role'] ?? 'customer'
    ];

    // Determine redirect URL based on role
    $redirectUrl = ($user['role'] === 'admin') ? '../admin/dashboard.php' : '../home.php';
    $redirectUrlWithParams = $redirectUrl . '?login_result=success&login_message=' . urlencode('Welcome back, ' . $user['first_name'] . '!');

    if ($isAjax) sp_json_response(['success' => true, 'user' => $userInfo, 'redirect' => $redirectUrl, 'message' => 'Welcome back, ' . $user['first_name'] . '!'], 200);
    header('Location: ' . $redirectUrlWithParams);
    exit;
} catch (PDOException $e) {
    // Log the error (in production, you might want to log to a file)
    error_log("Login error: " . $e->getMessage());

    if ($isAjax) sp_json_response(['success' => false, 'error' => 'An error occurred during login. Please try again.'], 500);
    header('Location: ../home.php?login_result=error&login_message=' . urlencode('An error occurred during login. Please try again.'));
    exit;
}
