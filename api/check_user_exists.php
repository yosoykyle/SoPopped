<?php

/**
 * =============================================================================
 * File: api/check_user_exists.php
 * Purpose: Check if an email is already taken.
 * =============================================================================
 * 
 * NOTE:
 * This script answers a simple yes/no question: "Does this user exist?"
 * 
 * It is used for:
 *   a) Signup: "Sorry, that email is taken."
 *   b) Login: "We don't recognize that email."
 * 
 * SPECIAL FEATURE: Rate Limiting
 * We don't want hackers guessing thousands of emails. 
 * So we limit how many checks can be done from one IP address.
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';
sp_json_header();
require_once __DIR__ . '/../db/sopoppedDB.php';

// -----------------------------------------------------------------------------
// STEP 1: INPUT
// -----------------------------------------------------------------------------
$email = '';
if (isset($_POST['email'])) {
    $email = trim((string)$_POST['email']);
} elseif (isset($_GET['email'])) {
    $email = trim((string)$_GET['email']);
}
$email = strtolower($email);

// -----------------------------------------------------------------------------
// STEP 2: PROTECT THE SERVER (Rate Limiting)
// -----------------------------------------------------------------------------
// This complex-looking block is just a "Turnstile".
// It counts how many times this IP address has asked this question.
// Rate: 15 checks per 60 seconds.

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
    // Save a temp file to count requests
    $dir = rtrim(sys_get_temp_dir(), "\\/") . DIRECTORY_SEPARATOR . 'sopopped_rate';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    $file = $dir . DIRECTORY_SEPARATOR . md5($ip . '_check_user_exists') . '.json';
    $now = time();

    // Read counter
    $data = ['count' => 0, 'start' => $now];
    $fp = @fopen($file, 'c+');
    if (!$fp) return true; // Fail safetly open if file system error

    flock($fp, LOCK_EX);
    $contents = stream_get_contents($fp);
    if ($contents) {
        $decoded = json_decode($contents, true);
        if (isset($decoded['count'])) $data = $decoded;
    }

    // Reset counter if time window passed
    if (($data['start'] + $window) <= $now) {
        $data = ['count' => 0, 'start' => $now];
    }

    $data['count']++;

    // Save
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data));
    flock($fp, LOCK_UN);
    fclose($fp);

    return $data['count'] <= $limit;
}

// Enforce limit
if (!rate_limit_check(15, 60)) {
    sp_json_response(['exists' => false, 'error' => 'rate_limited'], 429);
}

// -----------------------------------------------------------------------------
// STEP 3: DATABASE CHECK
// -----------------------------------------------------------------------------
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sp_json_response(['exists' => false, 'error' => 'invalid_email'], 400);
}

try {
    $stmt = $pdo->prepare('SELECT id, is_archived FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    // Return the answer
    if ($row) {
        $isArchived = isset($row['is_archived']) ? (int)$row['is_archived'] : 0;
        sp_json_response(['exists' => true, 'is_archived' => $isArchived], 200);
    } else {
        sp_json_response(['exists' => false, 'is_archived' => 0], 200);
    }
} catch (Exception $e) {
    sp_json_response(['exists' => false, 'error' => 'server_error'], 500);
}
