<?php
// Include database connection
require_once __DIR__ . '/db/sopoppedDB.php';

// Function to get products from database
function getProducts($pdo)
{
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

// (Seeder moved to db/seed_sample_products.php)

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
  <link rel="stylesheet" href="./node_modules/bootstrap-icons/font/bootstrap-icons.css">
  <link rel="shortcut icon" href="images/So Popped Logo.png" />
  <link
    rel="icon"
    type="image/png"
    sizes="32x32"
    href="images/So Popped Logo.png" />
  <link
    rel="icon"
    type="image/png"
    sizes="16x16"
    href="images/So Popped Logo.png" />
  <link rel="apple-touch-icon" href="images/So Popped Logo.png" />
</head>

<body>
  <script src="./node_modules/jquery/dist/jquery.min.js"></script>
  <script>
    window.jQuery || document.write('<script src="https://code.jquery.com/jquery-3.6.0.min.js"><\/script>');
  </script>
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
      <div class="row row-cols-2 row-cols-md-4 row-cols-lg-12 g-3 py-4">
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

      <?php if (empty($products)): ?>
        <div class="row mt-4">
          <div class="col-12 d-flex justify-content-center">
            <div class="emptyCart p-4 text-center border-secondary-subtle border rounded-3 col-12 col-md-8 col-lg-6">
              <h2 class="pt-3 text-primary">We're curating flavors right now</h2>
              <p class="lead text-body-secondary">
                In the meantime, learn more about our story and the flavors we're bringing to you.
              </p>
              <div class="d-grid gap-2 col-6 mx-auto">
                <a class="btn btn-warning" href="aboutUs.php" role="button">Learn about us</a>
              </div>
            </div>
          </div>
        </div>
      <?php endif; ?>
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
  <!-- Add jQuery Validation plugin BEFORE authDialogs.js -->
  <script src="./node_modules/jquery-validation/dist/jquery.validate.min.js"></script>
  <script src="./node_modules/jquery-validation/dist/additional-methods.min.js"></script>
  <script src="./js/loadComponents.js"></script>
  <script src="./js/fetchHelper.js"></script>
  <script src="./js/sessionHelper.js"></script>
  <script src="./js/uiHelper.js"></script>
  <script src="./js/validateHelper.js"></script>
  <script src="./js/authDialogs.js"></script>
  <script src="./js/productModal.js"></script>

  <script>
    // Make products available for modal functionality
    window.__sopopped_products = <?= json_encode($products) ?>;
  </script>
</body>

</html>