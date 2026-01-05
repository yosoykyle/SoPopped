<?php

/**
 * Admin Security Middleware
 * 
 * Purpose: Validates that the current session belongs to an admin user.
 * Included by: All admin API endpoints (get_*, save_*, delete_*, update_*)
 * Action: Blocks non-admin requests with 403 or redirect to home.php
 */
// API: Admin Security Middleware
// Consumer: Global (Included in all Admin APIs)
require_once __DIR__ . '/../_helpers.php';
sp_ensure_session();

if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
    if (sp_is_ajax_request()) {
        sp_json_response(['success' => false, 'error' => 'Unauthorized'], 403);
    }
    header('Location: ../../home.php');
    exit;
}
