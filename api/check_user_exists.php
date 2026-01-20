<?php

/**
 * =============================================================================
 * File: api/check_user_exists.php
 * Purpose: Check availability of a user email address.
 * =============================================================================
 * 
 * Used by:
 *   - Login form (to warn if user does NOT exist)
 *   - Signup form (to warn if user ALREADY exists)
 * 
 * Inputs:
 *   - email (POST preferred, GET accepted)
 * 
 * Logic:
 *   1. Rate limiting check (file-based).
 *   2. Database lookup for email.
 *   3. Returns existence status and archived status.
 * 
 * Response:
 *   { "exists": true, "is_archived": 0/1 }
 *   { "exists": false }
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';
sp_json_header();
require_once __DIR__ . '/../db/sopoppedDB.php';

// 1. Input Processing
$email = '';
if (isset($_POST['email'])) {
    $email = trim((string)$_POST['email']);
} elseif (isset($_GET['email'])) {
    $email = trim((string)$_GET['email']);
}
$email = strtolower($email);

// 2. Rate Limiting Implementation
// Simple temp-file based limiter to prevent enumeration attacks
function client_ip()
{
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function rate_limit_check($limit = 15, $window = 60)
{
    $ip = client_ip();
    $dir = rtrim(sys_get_temp_dir(), "\\/") . DIRECTORY_SEPARATOR . 'sopopped_rate';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $file = $dir . DIRECTORY_SEPARATOR . md5($ip . '_check_user_exists') . '.json';
    $now = time();

    // Read current state
    $data = ['count' => 0, 'start' => $now];
    $fp = @fopen($file, 'c+');
    if (!$fp) return true; // Fail open if FS error

    flock($fp, LOCK_EX);
    $contents = stream_get_contents($fp);
    if ($contents) {
        $decoded = json_decode($contents, true);
        if (isset($decoded['count'])) $data = $decoded;
    }

    // Reset if window expired
    if (($data['start'] + $window) <= $now) {
        $data = ['count' => 0, 'start' => $now];
    }

    $data['count']++;

    // Write back
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data));
    flock($fp, LOCK_UN);
    fclose($fp);

    return $data['count'] <= $limit;
}

// Enforce limit: 15 req / 60 sec
if (!rate_limit_check(15, 60)) {
    sp_json_response(['exists' => false, 'error' => 'rate_limited'], 429);
}

// 3. Validation
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sp_json_response(['exists' => false, 'error' => 'invalid_email'], 400);
}

try {
    // 4. Database Check
    $stmt = $pdo->prepare('SELECT id, is_archived FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $isArchived = isset($row['is_archived']) ? (int)$row['is_archived'] : 0;
        sp_json_response(['exists' => true, 'is_archived' => $isArchived], 200);
    } else {
        sp_json_response(['exists' => false, 'is_archived' => 0], 200);
    }
} catch (Exception $e) {
    sp_json_response(['exists' => false, 'error' => 'server_error'], 500);
}
