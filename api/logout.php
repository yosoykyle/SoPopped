<?php
// Start session
session_start();

// Destroy all session data
session_destroy();

// Redirect to home page with logout message
header('Location: ../home.php?logout_result=success&logout_message=' . urlencode('You have been logged out successfully.'));
exit;
?>
