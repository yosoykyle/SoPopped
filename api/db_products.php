<?php

/**
 * =============================================================================
 * File: api/db_products.php
 * Purpose: JSON endpoint to fetch all products for the frontend.
 * =============================================================================
 * 
 * Logic:
 *   1. Fetch active products using `_products_service.php`.
 *   2. Normalize image paths (absolute vs relative).
 *   3. Return JSON payload.
 * 
 * Response:
 *   { 
 *     "success": true, 
 *     "products": [ { "id": 1, "name": "...", "image": "..." } ], 
 *     "count": 10 
 *   }
 * =============================================================================
 */

require_once __DIR__ . '/../db/sopoppedDB.php';
require_once __DIR__ . '/_products_service.php';
require_once __DIR__ . '/_helpers.php';

sp_json_header();

try {
    // 1. Fetch Products
    $products = getProducts($pdo);

    // 2. Normalize Image Paths
    // Determines the project root URL to correctly prefix relative image paths.
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $origin = $scheme . '://' . $_SERVER['HTTP_HOST'];

    // Project base is one level up from /api/
    $projectBase = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/\\');
    if ($projectBase === '' || $projectBase === '/') {
        $projectBase = '/' . basename(dirname(__DIR__));
    }
    $projectBaseUrl = $origin . $projectBase . '/';

    foreach ($products as &$p) {
        $img = isset($p['image_path']) ? trim($p['image_path']) : '';

        if ($img !== '') {
            if (preg_match('#^https?://#i', $img)) {
                // Absolute URL: Use as is
                $p['image'] = $img;
            } elseif (strpos($img, '/') === 0) {
                // Root-relative (e.g., /images/foo.png): Prefix origin + project base
                $p['image'] = $origin . $projectBase . '/' . ltrim($img, '/\\');
            } else {
                // Relative (e.g., images/foo.png): Prefix full project URL
                $p['image'] = $projectBaseUrl . ltrim($img, '/\\');
            }
        } else {
            // Default fallback
            $p['image'] = $projectBaseUrl . 'images/default.png';
        }
    }
    unset($p);

    // 3. Response
    sp_json_response([
        'success' => true,
        'products' => $products,
        'count' => count($products)
    ], 200);
} catch (Exception $e) {
    error_log("db_products error: " . $e->getMessage());
    sp_json_response([
        'success' => false,
        'message' => 'Error fetching products',
        'products' => [],
        'count' => 0
    ], 500);
}
