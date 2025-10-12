<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cart</title>
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
    <main>
      <div class="container mt-5 pt-5 mt">
        <div class="text-center cart border-bottom pb-5">
            <img
            src="images/cart.png"
            alt="So Popped Logo"
            width="80"
            height="80"
            class="d-inline-block align-text-center"
          />
          <h1 class="display-4 mt-2">Your Cart</h1>
        </div>
        <!-- Cart Content Container -->
        <div class="row g-5 mt-1">
          <!-- Cart Summary Column -->
          <div class="col-lg-6">
            <h2 class="d-flex justify-content-between align-items-center mb-3">
                <span class="text-warning">Flavors</span>
                <span class="flavorCoutCart badge bg-warning rounded-pill">0</span>
              </h2>
              <ul class="list-group mb-3">
                <li class="list-group-item d-flex justify-content-between lh-sm">
                  <div>
                    <h6 class="my-0">Product name</h6>
                    <small class="text-body-secondary">Brief description</small>
                  </div>
                  <span class="text-body-secondary">$12</span>
                </li>
                <li class="list-group-item d-flex justify-content-between">
                  <span>Total (USD)</span>
                  <strong>$20</strong>
                </li>
              </ul>
          </div>
          <!-- Billing Form Column -->
          <div class="col-lg-6">
            <h4 class="mb-3 text-warning">Billing address</h4>
            <!-- Add novalidate attribute -->
            <form method="POST" action="#" id="checkoutForm" class="needs-validation" novalidate>
              <div class="row g-3">
                <div class="col-sm-6">
                  <label for="firstName" class="form-label">First name</label>
                  <input type="text" class="form-control" id="firstName" name="firstName" required/>
                </div>
                <div class="col-sm-6">
                  <label for="lastName" class="form-label">Last name</label>
                  <input type="text" class="form-control" id="lastName" name="lastName" required/>
                </div>
                <div class="col-12">
                  <label for="email" class="form-label"> Email</label>
                  <input type="email" class="form-control" id="email" name="email" placeholder="sopopped@example.com"/>
                </div>
                <div class="col-12">
                  <label for="address" class="form-label">Address</label>
                  <input type="text" class="form-control" id="address" name="address" placeholder="1234 Main St" required/>
                </div>
                <!-- Move validate-msg inside the form where it's relevant -->
                <div id="validate-msg" class="mt-3 alert alert-danger d-none"></div>
                <div class="col-md-5">
                  <label for="province" class="form-label">Province</label>
                  <select class="form-select" id="province" name="province" required>
                    <option value="">Choose...</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label for="city" class="form-label">City / Municipality</label>
                  <select class="form-select" id="city" name="city" required disabled>
                    <option value="">Choose...</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label for="barangay" class="form-label">Barangay</label>
                  <select class="form-select" id="barangay" name="barangay" required disabled>
                    <option value="">Choose...</option>
                  </select>
                </div>
              <h4 class="mb-3">Payment</h4>
              <div class="my-3">
                <div class="form-check">
                  <input id="credit" name="paymentMethod" type="radio" class="form-check-input" checked required/>
                  <label class="form-check-label" for="credit">COD</label>
                </div>
              </div>
              <hr class="my-4"/>
              <button class="w-100 btn btn-primary btn-lg" type="submit">
                Checkout
              </button>
            </form>
          </div>
        </div>

        <!-- Empty Cart Message -->
        <div class="row mt-4">
          <div class="col-12">
            <div class="emptyCart p-4 text-center border-secondary-subtle border rounded-3">
              <h2 class="pt-3 text-primary">Cart's Empty</h2>
              <p class="lead text-body-secondary">
                Looks like you haven't added any flavors to your cart yet.
                Explore our products and find your next favorite flavor!
              </p>
              <div class="d-grid gap-2 col-6 mx-auto">
                <a class="btn btn-warning" href="products.php" role="button">Shop Now</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <!-- FOOTER  -->
    <?php include_once __DIR__ . '/components/footer.php'; ?>
    <?php include_once __DIR__ . '/components/login.php'; ?>
    <?php include_once __DIR__ . '/components/signup.php'; ?>
    <script src="./node_modules/jquery/dist/jquery.min.js"></script>
    <!-- Add jQuery Validation plugin BEFORE authDialogs.js -->
    <script src="./node_modules/jquery-validation/dist/jquery.validate.min.js"></script>
    <script src="./node_modules/jquery-validation/dist/additional-methods.min.js"></script>
    <script src="./node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./js/loadComponents.js"></script>
    <script src="./js/countryState.js"></script>
    <script src="./js/authDialogs.js"></script>
  </body>
</html>