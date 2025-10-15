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
function populateSampleProducts($pdo) {
    try {
        // Check if products table is empty
        $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM products");
        $stmt->execute();
        $result = $stmt->fetch();
        
        if ($result['count'] == 0) {
            // Sample products data from the JSON file
            $sampleProducts = [
                ['Star Fruit', 'Fresh star fruit — crisp, slightly tart and perfect for snacks or garnishes.', 4.50, 100, 'images/f4.png'],
                ['Strawberry', 'Sweet ripe strawberries sourced locally for bright flavor.', 3.25, 100, 'images/p1.png'],
                ['Rose', 'Aromatic rose petals ideal for teas and infusions.', 6.00, 0, 'images/p2.png'],
                ['Dried Tangerine Peel', 'Savory-sweet dried peel with citrus aromatics used in blends and cooking.', 2.75, 100, 'images/p3.png'],
                ['Tomato', 'Juicy tomatoes for sauces, salads, and more.', 2.00, 100, 'images/p4.png'],
                ['Papaya', 'Sweet tropical papaya, rich and soft when ripe.', 3.75, 100, 'images/p5.png'],
                ['Sampaguita', 'Fragrant sampaguita flowers used in perfumery and ceremonial blends.', 5.50, 100, 'images/f2.png'],
                ['Clove', 'Warm, earthy clove buds for baking and spice mixes.', 4.00, 100, 'images/f3.png'],
                ['Hawthorn', 'Hawthorn berries, tart and tangy — great for teas and preserves.', 4.25, 100, 'images/f1.png'],
                ['Peach', 'Juicy peaches with sweet summer flavor.', 3.50, 100, 'images/p6.png'],
                ['Elderflower', 'Delicate elderflower aroma for cordials and desserts.', 6.50, 100, 'images/p7.png'],
                ['Coconut', 'Creamy coconut for culinary and beverage uses.', 3.00, 100, 'images/p8.png'],
                ['Calamansi', 'Tart calamansi citrus — bright and zesty.', 2.50, 100, 'images/p9.png'],
                ['Passionfruit', 'Intensely aromatic passionfruit for juices and desserts.', 4.75, 100, 'images/p10.png'],
                ['Rambutan', 'Exotic rambutan — sweet, juicy flesh with floral notes.', 3.95, 100, 'images/p11.png'],
                ['Sumac', 'Tangy sumac powder for vibrant, lemony flavor.', 4.10, 100, 'images/p13.png'],
                ['Lavender', 'Culinary lavender for sweets, syrups, and fragrant blends.', 5.25, 100, 'images/p12.png'],
                ['Chamomile', 'Soothing chamomile flowers perfect for calming teas.', 4.60, 100, 'images/p14.png']
            ];
            
            $stmt = $pdo->prepare("
                INSERT INTO products (name, description, price, quantity, image_path, is_active) 
                VALUES (?, ?, ?, ?, ?, 1)
            ");
            
            foreach ($sampleProducts as $product) {
                $stmt->execute($product);
            }
            
            return true;
        }
        return false;
    } catch (PDOException $e) {
        error_log("Error populating sample products: " . $e->getMessage());
        return false;
    }
}

// Main execution
try {
    // Populate database with sample products if empty
    populateSampleProducts($pdo);
    
    // Get products from database
    $products = getProducts($pdo);
    
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
