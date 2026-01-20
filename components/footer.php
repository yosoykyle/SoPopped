<!-- footer.html fragment -->
<footer class="pt-3">
  <div class="container">
    <ul class="nav justify-content-center border-bottom pb-3 mb-3">
      <li class="nav-item">
        <a href="home.php" class="nav-link px-2 text-body-secondary">Home</a>
      </li>
      <li class="nav-item">
        <a href="products.php" class="nav-link px-2 text-body-secondary">Products</a>
      </li>
      <li class="nav-item">
        <a href="cart.php" class="nav-link px-2 text-body-secondary">Cart</a>
      </li>
      <li class="nav-item">
        <a href="aboutUs.php" class="nav-link px-2 text-body-secondary">About Us</a>
      </li>
    </ul>
    <p class="text-center text-body-secondary">
      &copy; <?= date('Y') ?> So Popped, Inc
      <a href="https://www.seobility.net/en/seocheck/check?url=https%3A%2F%2Fedgar-nonhabitable-inconsiderately.ngrok-free.dev%2Fsopopped%2F"><img src="https://app.seobility.net/widget/widget.png?url=https%3A%2F%2Fedgar-nonhabitable-inconsiderately.ngrok-free.dev%2Fsopopped%2F" 
          alt="Seobility Score for edgar-nonhabitable-inconsiderately.ngrok-free.dev"
          width="50"
          height="50" /></a>
    </p>
  </div>
</footer>

<!-- Common Scripts (loaded via footer.php) -->
<script src="./node_modules/jquery/dist/jquery.min.js"></script>
<script>
  window.jQuery || document.write('<script src="https://code.jquery.com/jquery-3.6.0.min.js"><\/script>');
</script>
<script src="./node_modules/jquery-validation/dist/jquery.validate.min.js"></script>
<script src="./node_modules/jquery-validation/dist/additional-methods.min.js"></script>
<script src="./node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
<script src="./js/loadComponents.js"></script>
<script src="./js/fetchHelper.js"></script>
<script src="./js/sessionHelper.js"></script>
<script src="./js/cart.js"></script>
<script src="./js/cart-badge.js"></script>
<script src="./js/dialogUI.js"></script>
<script src="./js/validation.js"></script>
<!-- Auth Handler Modules (merged from authUserCheck, authLoginHandler, authSignupHandler, authCheckoutHandler) -->
<script src="./js/authHandlers.js"></script>
<script src="./js/authDialogs.js"></script>