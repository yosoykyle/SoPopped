<?php
// Include database connection
require_once __DIR__ . '/db/sopoppedDB.php';

// Function to get products from database
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

// Get products from database
$products = getProducts($pdo);

// Pagination settings
$itemsPerPage = 6;
$currentPage = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$totalProducts = count($products);
$totalPages = ceil($totalProducts / $itemsPerPage);
$offset = ($currentPage - 1) * $itemsPerPage;
$pageProducts = array_slice($products, $offset, $itemsPerPage);
?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Products</title>
    <link rel="stylesheet" href="./styles.css" />
  <link rel="shortcut icon" href="images/So Popped Logo.png" />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
  href="images/So Popped Logo.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
  href="images/So Popped Logo.png"
      />
  <link rel="apple-touch-icon" href="images/So Popped Logo.png" />
  </head>
  <body>
  <script src="./node_modules/jquery/dist/jquery.min.js"></script>
  <script>window.jQuery || document.write('<script src="https://code.jquery.com/jquery-3.6.0.min.js"><\/script>');</script>
  <!-- NAV (server-side include) -->
  <?php include_once __DIR__ . '/components/navbar.php'; ?>
    <!-- FEATURED -->
    <main>
      <section class="py-3 text-center container">
        <div class="row pt-lg-5">
          <div class="col-lg-6 mx-auto">
            <h1 class="display-4 mt-5 pt-4">
              Taste the world, one Flavor at a time.
            </h1>
            <p class="lead text-body-secondary">
              These flavors have been waiting. <br />
              We’re just glad you’re here to meet them.
            </p>
          </div>
        </div>
      </section>

      <div class="container-fluid bg-body">
        <h1 class="display-6 pt-3 border-top fw-bolder text-warning">Products</h1>
        <div class="row row-cols-2 row-cols-md-4 row-cols-lg-4 g-3 py-4">
          <?php foreach ($pageProducts as $product): ?>
            <?php 
              $outOfStock = $product['quantity'] <= 0;
              $cardClasses = "card product-card mx-auto mt-2 rounded-4" . ($outOfStock ? ' out-of-stock' : '');
            ?>
            <div class="col">
              <div class="<?= $cardClasses ?>" 
                   data-product-id="<?= htmlspecialchars($product['id']) ?>" 
                   data-price="<?= htmlspecialchars($product['price']) ?>" 
                   data-description="<?= htmlspecialchars($product['description']) ?>" 
                   data-quantity="<?= htmlspecialchars($product['quantity']) ?>" 
                   style="cursor:pointer; position:relative;">
                <?php
                  $img = $product['image_path'] ?? '';
                  if (preg_match('~^https?://~i', $img)) {
                      $src = $img;
                  } else {
                      // Strip leading slashes so paths like '/images/x.png' become 'images/x.png'
                      $src = ltrim($img, '/\\');
                  }
                ?>
                <img class="mx-auto card-img rounded-4"
                     src="<?= htmlspecialchars($src) ?>"
                     alt="<?= htmlspecialchars($product['name']) ?>"
                     width="auto"
                     height="auto" />
                <div class="card-body text-center mx-auto">
                  <h5 class="card-title display-7"><?= htmlspecialchars($product['name']) ?></h5>
                </div>
                <?php if ($outOfStock): ?>
                  <div class="position-absolute top-0 start-0 m-2">
                    <span class="badge bg-danger">Out of stock</span>
                  </div>
                <?php endif; ?>
              </div>
            </div>
          <?php endforeach; ?>
        </div>
      </div>
    </main>
    <?php include_once __DIR__ . '/components/pagination.php'; ?>
  <!-- Product modal (server-side include) -->
  <?php include_once __DIR__ . '/components/product_modal.php'; ?>
  <!-- FOOTER  -->
    <?php include_once __DIR__ . '/components/footer.php'; ?>

    <!-- Auth dialogs (login/signup) -->
    <?php include_once __DIR__ . '/components/login.php'; ?>
    <?php include_once __DIR__ . '/components/signup.php'; ?>
  <script src="./node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
  <script src="./js/loadComponents.js"></script>
  <script src="./js/authDialogs.js"></script>
  <script src="./js/productModal.js"></script>
    
  <script>
  // Make products available for modal functionality
  window.__sopopped_products = <?= json_encode($products) ?>;
  </script>
  </body>
</html>
