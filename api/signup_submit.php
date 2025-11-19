<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../db/sopoppedDB.php';

// Standardized helpers for session / JSON detection and responses
sp_ensure_session();
$isAjax = sp_is_ajax_request();

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    if ($isAjax) sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
    header('Location: ../home.php?signup_result=error&signup_message=Method not allowed');
    exit;
}

// Get form data
$name = trim($_POST['name'] ?? '');
$middle = trim($_POST['middle'] ?? '');
$last = trim($_POST['last'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$password = $_POST['password'] ?? '';
$password2 = $_POST['password2'] ?? '';

// Normalize email
$email = strtolower($email);

// Validation
$errors = [];

if (empty($name)) {
    $errors[] = 'First name is required';
}
if (empty($last)) {
    $errors[] = 'Last name is required';
}
if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address';
}
if (empty($phone)) {
    $errors[] = 'Phone number is required';
}
if (empty($password)) {
    $errors[] = 'Password is required';
} elseif (strlen($password) < 6) {
    $errors[] = 'Password must be at least 6 characters long';
}
if (empty($password2)) {
    $errors[] = 'Please confirm your password';
} elseif ($password !== $password2) {
    $errors[] = 'Passwords do not match';
}

// If there are validation errors, respond appropriately
if (!empty($errors)) {
    $errorMessage = implode(', ', $errors);
    if ($isAjax) {
        sp_json_response(['success' => false, 'error' => $errorMessage, 'errors' => $errors], 400);
    } else {
        header('Location: ../home.php?signup_result=error&signup_message=' . urlencode($errorMessage));
        exit;
    }
}

try {
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id, is_archived FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($existing) {
        if (!empty($existing['is_archived'])) {
            $msg = 'An archived account already exists with this email. Creating a new account with the same email is not allowed.';
        } else {
            $msg = 'An account with this email already exists';
        }
        if ($isAjax) {
            sp_json_response(['success' => false, 'error' => $msg], 409);
        } else {
            header('Location: ../home.php?signup_result=error&signup_message=' . urlencode($msg));
        }
        exit;
    }

    // Hash the password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user — keep first, middle, and last names separate
    $stmt = $pdo->prepare("
        INSERT INTO users (email, password_hash, first_name, middle_name, last_name, phone, role) 
        VALUES (?, ?, ?, ?, ?, ?, 'customer')
    ");

    // Pass values in correct order: first_name, middle_name (nullable), last_name
    $stmt->execute([
        $email,
        $passwordHash,
        $name,
        !empty($middle) ? $middle : null, // Store NULL if empty
        $last,
        $phone
    ]);

    // Get the new user ID
    $userId = $pdo->lastInsertId();

    // Build full name for response (optional)
    $fullName = trim($name . ' ' . ($middle ?? '') . ' ' . $last);

    $userInfo = [
        'id' => (int)$userId,
        'email' => $email,
        'name' => $fullName
    ];

    if ($isAjax) {
        sp_json_response(['success' => true, 'user' => $userInfo, 'message' => 'Account created successfully! You can now log in.'], 201);
    } else {
        header('Location: ../home.php?signup_result=success&signup_message=' . urlencode('Account created successfully! You can now log in.'));
    }
    exit;

} catch (PDOException $e) {
    error_log("Signup error: " . $e->getMessage());
    if ($isAjax) {
        sp_json_response(['success' => false, 'error' => 'An error occurred while creating your account. Please try again.'], 500);
    } else {
        header('Location: ../home.php?signup_result=error&signup_message=' . urlencode('An error occurred while creating your account. Please try again.'));
    }
    exit;
}
?>