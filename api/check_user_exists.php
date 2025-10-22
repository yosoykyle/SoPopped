<?php
/**
 * API endpoint: /api/check_user_exists.php
 *
 * Purpose:
 *  - Return whether an active user account exists for a given email.
 *
 * Behavior (short):
 *  - Accepts email via POST (preferred) or GET.
 *  - Normalizes the email (trim + lowercase) before checking.
 *  - Returns JSON: { "exists": true } or { "exists": false }.
 *  - Returns { "exists": false, "error": "invalid_email" } for invalid input.
 *  - Enforces a simple per-IP rate limit and returns HTTP 429 with
 *    { "exists": false, "error": "rate_limited" } when exceeded.
 *  - On unexpected server errors returns HTTP 500 with
 *    { "exists": false, "error": "server_error" }.
 *
 * Notes / recommendations:
 *  - This endpoint is intended for UX checks (signup form validation).
 *    Always enforce uniqueness at the database level (unique index on
 *    users.email) to prevent race conditions and duplicates.
 *  - The built-in rate limiter is file-based for convenience and is
 *    not suitable for multi-server deployments — use Redis/memcached or
 *    WAF rules in production.
 *  - For privacy-sensitive apps, consider returning generic responses
 *    so callers cannot enumerate registered emails.
 *  - Prefer POST over GET to avoid exposing emails in logs/URLs; use TLS.
 */
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db/sopoppedDB.php';

// Prefer POST but accept GET for backward compatibility. Normalize to lowercase.
$email = '';
if (isset($_POST['email'])) {
    $email = trim((string)$_POST['email']);
} elseif (isset($_GET['email'])) {
    $email = trim((string)$_GET['email']);
}
$email = strtolower($email);

// Simple per-IP rate limiting to mitigate enumeration abuse.
// Uses a small file in the system temp directory keyed by client IP.
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

    $data = ['count' => 0, 'start' => $now];
    $fp = @fopen($file, 'c+');
    if (!$fp) return false; // best-effort: if we can't open file, don't block

    flock($fp, LOCK_EX);
    clearstatcache(true, $file);
    $contents = stream_get_contents($fp);
    if ($contents !== false && $contents !== '') {
        $decoded = json_decode($contents, true);
        if (is_array($decoded) && isset($decoded['count']) && isset($decoded['start'])) {
            $data = $decoded;
        }
    }

    // Reset window if expired
    if (($data['start'] + $window) <= $now) {
        $data = ['count' => 0, 'start' => $now];
    }

    $data['count']++;

    // Rewind and truncate then write
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);

    if ($data['count'] > $limit) {
        return false; // rate limited
    }
    return true;
}

// Enforce rate limit (15 requests per minute per IP)
if (!rate_limit_check(15, 60)) {
    http_response_code(429);
    echo json_encode(['exists' => false, 'error' => 'rate_limited']);
    exit;
}

if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['exists' => false, 'error' => 'invalid_email']);
    exit;
}

try {
    // Return whether a user with this email exists and whether it's archived.
    $stmt = $pdo->prepare('SELECT id, is_archived FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        $isArchived = isset($row['is_archived']) ? (int)$row['is_archived'] : 0;
        echo json_encode(['exists' => true, 'is_archived' => $isArchived]);
    } else {
        echo json_encode(['exists' => false, 'is_archived' => 0]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['exists' => false, 'error' => 'server_error']);
}
