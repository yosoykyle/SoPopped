<?php

/**
 * =============================================================================
 * File: api/session_info.php
 * Purpose: Return current session state to frontend.
 * =============================================================================
 * 
 * Usage:
 *   - Polled by frontend to check if user is logged in (e.g., after login modal).
 *   - Used to verify session before sensitive actions.
 * 
 * Response:
 *   { "logged_in": true, "user_id": 123, "username": "John Doe" }
 *   { "logged_in": false } (HTTP 401)
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';

// Ensure session cookie is read/set
sp_ensure_session();
sp_json_header();

$response = ['logged_in' => false];

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    $response['logged_in'] = true;
    $response['user_id'] = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    $response['username'] = isset($_SESSION['user_name']) ? (string)$_SESSION['user_name'] : '';

    sp_json_response($response, 200);
}

// Not logged in
sp_json_response($response, 401);
