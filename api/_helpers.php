<?php
// api/_helpers.php
// Small, minimal helpers to keep API files DRY and more readable.
// These helpers are intentionally tiny and only consolidate repeated
// patterns (session start, JSON header, JSON response) without
// changing behavior.

/** Ensure a PHP session is started. Safe to call multiple times. */
function sp_ensure_session(): void
{
    if (session_status() === PHP_SESSION_NONE) session_start();
}

/** Send a JSON Content-Type header if headers not already sent. */
function sp_json_header(): void
{
    if (!headers_sent()) header('Content-Type: application/json; charset=utf-8');
}

/** Send JSON response and exit. Mirrors existing inline patterns. */
function sp_json_response($data, int $status = 200): void
{
    http_response_code($status);
    sp_json_header();
    echo json_encode($data);
    exit;
}

/** Detect whether the request likely expects JSON (AJAX/fetch). */
function sp_is_ajax_request(): bool
{
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        return true;
    }
    if (!empty($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
        return true;
    }
    if (!empty($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
        return true;
    }
    return false;
}

?>
