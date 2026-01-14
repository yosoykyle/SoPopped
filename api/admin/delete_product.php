<?php

/**
 * Archive Product (Soft Delete)
 * 
 * Purpose: Marks a product as inactive without permanently deleting it.
 * Consumed by: admin/products.php (delete/archive button)
 * Action: Sets is_active = 0 for the specified product ID
 */
// API: Soft Delete Product
// Consumer: admin/products.php (Archive Button)
require_once __DIR__ . '/check_auth.php';
require_once __DIR__ . '/../../db/sopoppedDB.php';

try {
   $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $id = isset($input['id']) ? (int)$input['id'] : 0;
    if (!$id) sp_json_response(['success' => false, 'error' => 'Invalid id'], 400);

    // Get product image path before archiving
    $stmt = $pdo->prepare("SELECT image_path FROM products WHERE id = ?");
    $stmt->execute([$id]);
    $product = $stmt->fetch();

    if (!$product) {
        sp_json_response(['success' => false, 'error' => 'Product not found'], 404);
    }

    // Archive the product and reset image_path to default so UI won't reference deleted file
    $stmt = $pdo->prepare("UPDATE products SET is_active = 0, image_path = ? WHERE id = ?");
    $stmt->execute(['images/default.png', $id]);

    // Delete associated image (except default.png)
    if ($product['image_path'] && $product['image_path'] !== 'images/default.png') {
        $normalizedPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $product['image_path']);
        $imageFile = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . $normalizedPath;

        if (file_exists($imageFile)) {
            @unlink($imageFile);
        }
    }

    sp_json_response(['success' => true]);
    
} catch (PDOException $e) {
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 500);
}
