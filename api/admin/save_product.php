<?php

/**
 * Save Product (Create/Update)
 * 
 * Purpose: Creates a new product or updates existing product information.
 * Consumed by: admin/products.php (product modal form submission)
 * Action: Handles image uploads, checks for duplicates, INSERT/UPDATE to database
 * Note: Uses FormData (not JSON) due to file upload requirement
 */
// API: Create/Update Product
// Consumer: admin/products.php (Product Modal)
require_once __DIR__ . '/check_auth.php';
require_once __DIR__ . '/../../db/sopoppedDB.php';

// 📋 SNIPPET LOCATION: MARKDOWNS/REPORTS/admin_task_delegation.md
// 📦 Package B: Product Management → 3. Backend: `api/admin/save_product.php`
// ► Replace the first sp_json_response line below with the snippet

try {
    $maxFileSize = 2 * 1024 * 1024;
    $allowedMimes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

    $id = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : null;
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $price = isset($_POST['price']) ? (float)$_POST['price'] : 0.0;
    $quantity = isset($_POST['quantity']) ? (int)$_POST['quantity'] : 0;
    $isActive = isset($_POST['is_active']) ? (int)$_POST['is_active'] : 1;

    if ($name === '') sp_json_response(['success' => false, 'error' => 'Name required'], 400);
    if ($price < 0) sp_json_response(['success' => false, 'error' => 'Invalid price'], 400);

    // Get old image path if updating
    $oldImagePath = null;
    if ($id) {
        $stmt = $pdo->prepare("SELECT image_path FROM products WHERE id = ?");
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if ($product) {
            $oldImagePath = $product['image_path'];
        }
    }

    $imagePath = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
        $file = $_FILES['image'];
        if ($file['error'] !== UPLOAD_ERR_OK) sp_json_response(['success' => false, 'error' => 'Upload error'], 400);
        if ($file['size'] > $maxFileSize) sp_json_response(['success' => false, 'error' => 'File too large'], 400);

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        if (!isset($allowedMimes[$mime])) sp_json_response(['success' => false, 'error' => 'Invalid file type'], 400);

        $ext = $allowedMimes[$mime];
        $filename = 'prod_' . bin2hex(random_bytes(8)) . '.' . $ext;

        $targetDir = __DIR__ . '/../../images';
        $targetDir = realpath($targetDir);

        if (!$targetDir) {
            $targetDir = __DIR__ . '/../../images';
            if (!mkdir($targetDir, 0775, true)) {
                sp_json_response(['success' => false, 'error' => 'Failed to create image directory'], 500);
            }
            $targetDir = realpath($targetDir);
        }

        $targetFile = $targetDir . DIRECTORY_SEPARATOR . $filename;
        if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
            sp_json_response(['success' => false, 'error' => 'Failed to save uploaded file'], 500);
        }

        $imagePath = 'images/' . $filename;

        // Delete old image after successful upload
        if ($oldImagePath && $oldImagePath !== 'images/default.png') {
            $normalizedPath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $oldImagePath);
            $oldImageFile = __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . $normalizedPath;

            if (file_exists($oldImageFile)) {
                @unlink($oldImageFile);
            }
        }
    }

    // Database operations
    if ($id) {
        // UPDATE logic (Only update image if new one uploaded)
        $sql = "UPDATE products SET name=?, description=?, price=?, quantity=?, is_active=?" . ($imagePath ? ", image_path=?" : "") . " WHERE id=?";
        $params = [$name, $description, $price, $quantity, $isActive];
        if ($imagePath) $params[] = $imagePath;
        $params[] = $id;
        $pdo->prepare($sql)->execute($params);
    } else {
        // INSERT logic with Duplicate Check
        $check = $pdo->prepare("SELECT id FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1");
        $check->execute([$name]);
        if ($check->fetch()) {
            sp_json_response(['success' => false, 'error' => 'Product name already exists'], 400);
        }

        $stmt = $pdo->prepare("INSERT INTO products (name, description, price, quantity, is_active, image_path) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $description, $price, $quantity, $isActive, $imagePath ?? 'images/default.png']);
    }

    sp_json_response(['success' => true]);
   
} catch (Exception $e) {
    sp_json_response(['success' => false, 'error' => 'Failed to save product: ' . $e->getMessage()], 500);
}