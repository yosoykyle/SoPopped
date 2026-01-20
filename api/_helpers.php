<?php

/**
 * =============================================================================
 * File: api/_helpers.php
 * Purpose: Shared utility functions for API endpoints.
 * =============================================================================
 * 
 * This file contains lightweight helper functions to standardize response 
 * formatting, session handling, and request detection across the API processing 
 * layer. It is designed to be included by other API scripts.
 * 
 * Functions:
 *   - sp_ensure_session(): Idempotent session starter.
 *   - sp_json_header(): Sends 'Content-Type: application/json'.
 *   - sp_json_response($data, $status): Sends JSON payload and exits.
 *   - sp_is_ajax_request(): Detects if request is XMLHttpRequest/Fetch.
 * 
 * Usage:
 *   require_once __DIR__ . '/_helpers.php';
 *   sp_ensure_session();
 *   sp_json_header();
 * =============================================================================
 */

/** 
 * Ensure a PHP session is started. Safe to call multiple times. 
 * Checks session_status() to avoid "Session already active" notices.
 */
function sp_ensure_session(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/** 
 * Send a JSON Content-Type header if headers not already sent. 
 */
function sp_json_header(): void
{
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
}

/** 
 * Send JSON response and exit script execution.
 * 
 * @param mixed $data - Data to encode as JSON.
 * @param int $status - HTTP status code (default 200).
 */
function sp_json_response($data, int $status = 200): void
{
    http_response_code($status);
    sp_json_header();
    echo json_encode($data);
    exit;
}

/** 
 * Detect whether the request likely expects JSON (AJAX/Fetch).
 * Checks X-Requested-With, Accept, and Content-Type headers.
 * 
 * @return bool - True if looks like an AJAX request.
 */
function sp_is_ajax_request(): bool
{
    // Check standard XHR header
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        return true;
    }
    // Check Accept header
    if (!empty($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
        return true;
    }
    // Check Content-Type header (often sent with POSTs)
    if (!empty($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        return true;
    }
    return false;
}
