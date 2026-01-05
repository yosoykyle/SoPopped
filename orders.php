<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Orders</title>
  <link rel="stylesheet" href="./styles.css" />
  <link rel="stylesheet" href="./node_modules/bootstrap-icons/font/bootstrap-icons.css">
  <link rel="shortcut icon" href="images/So Popped Logo.png" />
</head>

<body>
  <?php include_once __DIR__ . '/components/navbar.php'; ?>
  <main>
    <div class="container mt-5 pt-5">
      <div class="text-center border-bottom pb-4 mb-4">
        <img src="images/So Popped Logo.png" alt="So Popped" width="80" height="80" />
        <h1 class="display-4 mt-2">Your Orders</h1>
        <p class="lead text-body-secondary">Recent orders</p>
      </div>

      <div id="user-orders-list" class="row g-3">
        <!-- Orders will be rendered here by js/userOrders.js -->
        <div class="col-12 text-center text-muted">Loading orders…</div>
      </div>
    </div>
  </main>

  <?php include_once __DIR__ . '/components/footer.php'; ?>
  <?php include_once __DIR__ . '/components/login.php'; ?>
  <?php include_once __DIR__ . '/components/signup.php'; ?>
  <!-- Page-specific scripts -->
  <script src="./js/userOrders.js"></script>
</body>

</html>