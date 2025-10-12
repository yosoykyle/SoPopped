
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
          <!-- Products will be loaded here dynamically -->
        </div>
      </div>
    </main>
    <?php include_once __DIR__ . '/components/pagination.php'; ?>
    <!-- FOOTER  -->
    <?php include_once __DIR__ . '/components/footer.php'; ?>

    <!-- Auth dialogs (login/signup) -->
    <?php include_once __DIR__ . '/components/login.php'; ?>
    <?php include_once __DIR__ . '/components/signup.php'; ?>
    <script src="./node_modules/jquery/dist/jquery.min.js"></script>
    <script src="./node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./js/loadComponents.js"></script>
    <script src="./js/authDialogs.js"></script>
    <script src="./js/productLoader.js"></script>
  </body>
</html>
