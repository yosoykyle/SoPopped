<?php
require_once '../db/sopoppedDB.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
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

// Validation
$errors = [];

// Validate required fields
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

// If there are validation errors, redirect back with error message
if (!empty($errors)) {
    $errorMessage = implode(', ', $errors);
    header('Location: ../home.php?signup_result=error&signup_message=' . urlencode($errorMessage));
    exit;
}

try {
    // Check if email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->fetch()) {
        header('Location: ../home.php?signup_result=error&signup_message=' . urlencode('An account with this email already exists'));
        exit;
    }
    
    // Hash the password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Combine first name and middle name if middle name is provided
    $firstName = $name;
    if (!empty($middle)) {
        $firstName .= ' ' . $middle;
    }
    
    // Insert new user into database
    $stmt = $pdo->prepare("
        INSERT INTO users (email, password_hash, first_name, last_name, phone, role) 
        VALUES (?, ?, ?, ?, ?, 'customer')
    ");
    
    $stmt->execute([$email, $passwordHash, $firstName, $last, $phone]);
    
    // Get the new user ID
    $userId = $pdo->lastInsertId();
    
    // Redirect to home page with success message
    header('Location: ../home.php?signup_result=success&signup_message=' . urlencode('Account created successfully! You can now log in.'));
    exit;
    
} catch (PDOException $e) {
    // Log the error (in production, you might want to log to a file)
    error_log("Signup error: " . $e->getMessage());
    
    header('Location: ../home.php?signup_result=error&signup_message=' . urlencode('An error occurred while creating your account. Please try again.'));
    exit;
}
?>
