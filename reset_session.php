<?php

/**
 * Session Reset Utility (Development Tool)
 * 
 * Purpose: Completely destroys the current PHP session and all associated cookies.
 * Use Case: Debugging authentication issues, testing fresh login flows, clearing stuck sessions
 * Action: 
 *   1. Unsets all session variables
 *   2. Expires the session cookie
 *   3. Destroys the session on the server
 *   4. Clears PHPSESSID cookie
 * 
 * WARNING: This is a development/debugging tool.
 * Access: Direct URL visit (e.g., http://localhost/SoPopped/reset_session.php)
 */
// Aggressive Session Reset
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 1. Unset all session variables
$_SESSION = [];

// 2. Expire the session cookie if it exists
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// 3. Destroy the session
session_destroy();

// 4. Clear any other potential auth cookies (just in case)
setcookie('PHPSESSID', '', time() - 3600, '/');

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Destroyed</title>
    <link rel="stylesheet" href="./styles.css">
    <link href="./node_modules/bootstrap/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="shortcut icon" href="./images/So Popped Logo.png">
</head>

<body class="bg-white text-black d-flex align-items-center justify-content-center vh-100">
    <div class="text-center">
        <h1 class="display-4 text-danger">BOOM!</h1>
        <p class="lead mb-4">Your session has been completely popped.</p>
        <a href="home.php" class="btn btn-warning btn-md">Return to Home</a>
    </div>
    <script src="./node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>