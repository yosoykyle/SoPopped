<?php
/**
 * Seeder script to populate the `products` table with sample products.
 *
 * Usage (run manually from project root):
 *   php db/seed_sample_products.php
 *
 * PowerShell (from project root):
 *   php db/seed_sample_products.php
 *
 * Windows CMD (from project root):
 *   php db\seed_sample_products.php
 *
 * If you're using XAMPP on Windows and want to use the bundled PHP, run (example path):
 *   "C:\\xampp\\php\\php.exe" db\\seed_sample_products.php
 *
 * If you want to run via WSL, from your WSL shell run (from project root):
 *   php db/seed_sample_products.php
 *
 * Notes:
 * - This script is intended for local/dev use only. It will insert rows into
 *   your `products` table. Do NOT run in production unless you explicitly want
 *   these sample rows.
 * - The script will first check if the products table is empty and only insert
 *   samples when the table contains zero rows.
 */

// Load DB connection
require_once __DIR__ . '/sopoppedDB.php';

try {
    // Check CLI execution
    if (php_sapi_name() !== 'cli') {
        echo "This seeder should be run from the command line: php db/seed_sample_products.php\n";
        exit(1);
    }

    // Check if products table is empty
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM products");
    $stmt->execute();
    $result = $stmt->fetch();

    if ($result && $result['count'] > 0) {
        echo "Products table already contains data (count={$result['count']}). Seeder aborted.\n";
        exit(0);
    }

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

    $insert = $pdo->prepare("INSERT INTO products (name, description, price, quantity, image_path, is_active) VALUES (?, ?, ?, ?, ?, 1)");

    $count = 0;
    foreach ($sampleProducts as $p) {
        $insert->execute($p);
        $count++;
    }

    echo "Inserted {$count} sample products.\n";
    exit(0);

} catch (PDOException $e) {
    fwrite(STDERR, "Database error: " . $e->getMessage() . "\n");
    exit(2);
}
