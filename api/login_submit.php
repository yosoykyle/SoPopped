<?php
require_once '../db/sopoppedDB.php';

// Start session
session_start();

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

// If there are validation errors, redirect back with error message
if (!empty($errors)) {
    $errorMessage = implode(', ', $errors);
    header('Location: ../home.php?login_result=error&login_message=' . urlencode($errorMessage));
    exit;
}

try {
    // Check if user exists and get user data
    $stmt = $pdo->prepare("SELECT id, email, password_hash, first_name, last_name, phone, role FROM users WHERE email = ? AND is_archived = 0");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        header('Location: ../home.php?login_result=error&login_message=' . urlencode('Invalid email or password'));
        exit;
    }
    
    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
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
    
    // Redirect to home page with success message
    header('Location: ../home.php?login_result=success&login_message=' . urlencode('Welcome back, ' . $user['first_name'] . '!'));
    exit;
    
} catch (PDOException $e) {
    // Log the error (in production, you might want to log to a file)
    error_log("Login error: " . $e->getMessage());
    
    header('Location: ../home.php?login_result=error&login_message=' . urlencode('An error occurred during login. Please try again.'));
    exit;
}
?>
