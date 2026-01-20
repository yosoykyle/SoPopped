<?php

/**
 * =============================================================================
 * File: api/logout.php
 * Purpose: Handle user logout.
 * =============================================================================
 * 
 * Destroys the server-side session.
 * 
 * Logic:
 *   1. Resume and then Destroy session.
 *   2. Return JSON success OR Redirect home.
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';
sp_ensure_session();

$isAjax = sp_is_ajax_request();

// Destroy session data
session_destroy();

if ($isAjax) {
	sp_json_response(['success' => true, 'message' => 'You have been logged out successfully.'], 200);
}

// Fallback redirect
header('Location: ../home.php?logout_result=success&logout_message=' . urlencode('You have been logged out successfully.'));
exit;
