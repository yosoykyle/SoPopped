<?php

/**
 * =============================================================================
 * File: api/db_products.php
 * Purpose: Fetch Product Catalog for the Frontend.
 * =============================================================================
 * 
 * NOTE:
 * This is the API version of our product catalog.
 * It is used for "Lazy Loading" (AJAX) or when we need the product data as raw JSON.
 * 
 * Key Logic:
 *   1. Ask the Database for all active products.
 *   2. "Normalize" the images (fix the URL so it works from anywhere).
 *   3. Send it to the browser.
 * =============================================================================
 */

require_once __DIR__ . '/../db/sopoppedDB.php';
require_once __DIR__ . '/_products_service.php';
require_once __DIR__ . '/_helpers.php';

sp_json_header();

try {
    // -----------------------------------------------------------------------------
    // STEP 1: FETCH RAW DATA
    // -----------------------------------------------------------------------------
    // Uses a helper function to keep the SQL query clean and reusable.
    $products = getProducts($pdo);

    // -----------------------------------------------------------------------------
    // STEP 2: FIX IMAGE PATHS (Normalization)
    // -----------------------------------------------------------------------------
    // The database might store "images/soda.png" or "/sopopped/images/soda.png".
    // We need to make sure the frontend gets a Full, Valid URL like "http://site.com/images/..."

    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $origin = $scheme . '://' . $_SERVER['HTTP_HOST'];

    // Calculate where the "Project Root" is relative to this file.
    $projectBase = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/\\');
    if ($projectBase === '' || $projectBase === '/') {
        $projectBase = '/' . basename(dirname(__DIR__));
    }
    $projectBaseUrl = $origin . $projectBase . '/';

    foreach ($products as &$p) {
        $img = isset($p['image_path']) ? trim($p['image_path']) : '';

        if ($img !== '') {
            if (preg_match('#^https?://#i', $img)) {
                // It's already a full URL (e.g. from S3 or external site).
                $p['image'] = $img;
            } elseif (strpos($img, '/') === 0) {
                // It starts with a slash, so it's absolute from server root.
                $p['image'] = $origin . $projectBase . '/' . ltrim($img, '/\\');
            } else {
                // It's just a filename, so append it to our project Base URL.
                $p['image'] = $projectBaseUrl . ltrim($img, '/\\');
            }
        } else {
            // Safety: If no image, show a placeholder.
            $p['image'] = $projectBaseUrl . 'images/default.png';
        }
    }
    unset($p); // Break the reference

    // -----------------------------------------------------------------------------
    // STEP 3: SEND RESPONSE
    // -----------------------------------------------------------------------------
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
