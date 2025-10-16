<?php
require_once __DIR__ . '/../db/sopoppedDB.php';

// Function to get all active products from database
function getProducts($pdo) {
    try {
        $stmt = $pdo->prepare("
            SELECT id, name, description, price, quantity, image_path, is_active 
            FROM products 
            WHERE is_active = 1 
            ORDER BY id ASC
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Error fetching products: " . $e->getMessage());
        return [];
    }
}

// Function to populate database with sample products if empty
// Seeder removed: sample data should be loaded via `db/sample_products.sql` or migrations.

// Main execution
try {
    // Get products from database
    $products = getProducts($pdo);

    // Normalize image paths and provide `image` alias for frontend compatibility.
    // We'll handle three cases:
    // 1) absolute URLs (keep as-is)
    // 2) root-relative paths (start with '/') -> prefix origin (scheme + host)
    // 3) project-relative paths (like 'images/foo.png') -> prefix project base URL
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $origin = $scheme . '://' . $_SERVER['HTTP_HOST'];
    // Project base is one level up from /api
    $projectBase = rtrim(dirname(dirname($_SERVER['SCRIPT_NAME'])), '/\\');
    // If projectBase is empty (site served from root), fall back to the project's folder name
    if ($projectBase === '' || $projectBase === '/' ) {
        $projectBase = '/' . basename(dirname(__DIR__));
    }
    $projectBaseUrl = $origin . $projectBase . '/';

    foreach ($products as &$p) {
        $img = isset($p['image_path']) ? trim($p['image_path']) : '';

        if ($img !== '') {
            // Absolute URL
            if (preg_match('#^https?://#i', $img)) {
                $p['image'] = $img;
            }
            // Root-relative (/images/foo.png) - map into project base so subfolder deployments work
            elseif (strpos($img, '/') === 0) {
                // Ensure single slash between projectBase and img
                $p['image'] = $origin . $projectBase . '/' . ltrim($img, '/\\');
            }
            // Project-relative (images/foo.png)
            else {
                $p['image'] = $projectBaseUrl . ltrim($img, '/\\');
            }
        } else {
            $p['image'] = $projectBaseUrl . 'images/image.png';
        }
    }
    unset($p);
    
    // Return products as JSON
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'products' => $products,
        'count' => count($products)
    ]);
    
} catch (Exception $e) {
    error_log("Error in db_products.php: " . $e->getMessage());
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error fetching products',
        'products' => [],
        'count' => 0
    ]);
}
?>
