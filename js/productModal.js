/**
 * =============================================================================
 * File: js/productModal.js
 * Purpose: The "Closer Look" (Detail Popup).
 * =============================================================================
 *
 * NOTE:
 * When you click a Product Card on the home page, we don't reload the page.
 * We open a "Modal" (Popup) over the current page.
 *
 * This script controls that Modal. It:
 *   1. Data Injection: Fills the empty modal template with the clicked product's name/image/price.
 *   2. Stock Logic: Checks "Do we have enough?" before letting you add to cart.
 *   3. Fallbacks: If the image is broken, swaps it for a default one.
 * =============================================================================
 */

$(function () {
  // ---------------------------------------------------------------------------
  // STEP 1: INITIALIZATION
  // ---------------------------------------------------------------------------

  const $modalEl = $("#productModal");
  if (!$modalEl.length) return; // Exit if modal code isn't in HTML

  const bsModal = new bootstrap.Modal($modalEl[0]); // Wrap in Bootstrap logic

  // ---------------------------------------------------------------------------
  // STEP 2: FILLING THE TEMPLATE
  // ---------------------------------------------------------------------------
  // This function takes a raw product object and paints it onto the screen.

  function openProduct(product) {
    const stock =
      typeof product.quantity !== "undefined" ? Number(product.quantity) : 0;
    const isAvailable = stock > 0;

    // --- A. Handle Image (Tricky part: Resolving paths) ---
    const $img = $("#pm-image");

    // We assume the path might be relative ("images/popcorn.jpg") or absolute.
    // We try to make it work regardless.
    const rawPath = product.image_path || product.image || "images/default.png";
    let resolvedSrc = rawPath;
    try {
      // If it starts with "/", assume it's root relative. otherwise project relative.
      if (!/^https?:\/\//i.test(rawPath)) {
        resolvedSrc = new URL(
          rawPath,
          window.location.origin +
            (rawPath.startsWith("/") ? "" : window.location.pathname),
        ).href;
      }
    } catch (e) {}

    if ($img.length) {
      // Clean up old error listeners
      $img[0].removeAttribute("data-error-handled");
      $img.off("error").on("error", function () {
        // Fallback: If image fails, show default
        if (!this.hasAttribute("data-error-handled")) {
          this.setAttribute("data-error-handled", "true");
          this.src = "images/default.png";
        }
      });
      $img.attr("src", resolvedSrc);
      $img.attr("alt", product.name || "Product");
    }

    // --- B. Fill Text Data ---
    $("#pm-name").text(product.name || "");
    $("#pm-desc").text(product.description || "");
    $("#pm-price").text(`$${Number(product.price).toFixed(2)}`);

    // --- C. Configure Inputs ---
    const $qtyInput = $("#pm-qty");
    $qtyInput.val(isAvailable ? 1 : 0);
    $qtyInput.attr("max", String(Math.max(0, stock)));
    $qtyInput.attr("data-stock", String(stock)); // Save max stock in hidden attribute

    const $stockCountEl = $("#pm-stock-count");
    if ($stockCountEl.length) $stockCountEl.text(String(stock));

    // Disable buttons if sold out
    const $addBtn = $("#pm-add-cart");
    const $buyBtn = $("#pm-buy-now");
    if ($addBtn.length) $addBtn.prop("disabled", !isAvailable);
    if ($buyBtn.length) $buyBtn.prop("disabled", !isAvailable);

    // Save ID for later use
    $modalEl.attr("data-product-id", String(product.id));

    // Show It!
    bsModal.show();
  }

  // ---------------------------------------------------------------------------
  // STEP 3: QUANTITY BUTTONS (+ / -)
  // ---------------------------------------------------------------------------

  const $qtyInput = $("#pm-qty");

  // Logic: Increase (+1)
  $("#pm-qty-increase").on("click", () => {
    const stock = Number($qtyInput.attr("data-stock") || 0);
    if (stock <= 0) return;
    const current = Number($qtyInput.val()) || 0;
    $qtyInput.val(Math.min(current + 1, stock)); // Cap at Max Stock
  });

  // Logic: Decrease (-1)
  $("#pm-qty-decrease").on("click", () => {
    const stock = Number($qtyInput.attr("data-stock") || 0);
    if (stock <= 0) {
      $qtyInput.val(0);
      return;
    }
    const current = Number($qtyInput.val()) || 1;
    $qtyInput.val(Math.max(1, current - 1)); // Floor at 1
  });

  // Logic: Manual Typing
  if ($qtyInput.length) {
    $qtyInput.on("input", (e) => {
      let val = Number(e.target.value);
      const stock = Number($qtyInput.attr("data-stock") || 0);
      if (stock <= 0) {
        e.target.value = 0;
        return;
      }
      if (isNaN(val) || val < 1) val = 1;
      if (val > stock) val = stock;
      e.target.value = val;
    });
  }

  // ---------------------------------------------------------------------------
  // STEP 4: "ADD TO CART" ACTIONS
  // ---------------------------------------------------------------------------

  function addToCart(qty) {
    const id = $modalEl.attr("data-product-id");
    if (!id) return;

    // Look up full details in our global cache
    const fullProduct = (window.__sopopped_products || []).find(
      (p) => String(p.id) === id,
    );

    // Package it up
    const product = {
      id,
      qty,
      name: fullProduct ? fullProduct.name : "Product",
      price: fullProduct ? Number(fullProduct.price) : 0,
      description: fullProduct ? fullProduct.description : "",
    };

    // Send to Cart Manager
    if (window.sopoppedCart?.add) {
      window.sopoppedCart.add(product);
    } else {
      // Fallback if cart.js is missing
      $(document).trigger("product-add-to-cart", [{ detail: { id, qty } }]);
    }
  }

  $("#pm-add-cart").on("click", () => {
    addToCart(Number($qtyInput.val()) || 1);
    bsModal.hide();
  });

  $("#pm-buy-now").on("click", () => {
    addToCart(Number($qtyInput.val()) || 1);
    // Instant Redirect
    window.location.href = "cart.php";
  });

  // ---------------------------------------------------------------------------
  // STEP 5: LISTENING FOR CLICKS
  // ---------------------------------------------------------------------------

  // Event Delegation: We listen on 'document' because product cards might be loaded dynamically later.
  $(document).on("click", ".product-card", function (e) {
    const productId = $(this).attr("data-product-id");
    if (!productId) return;

    // Retrieve Data from Global Cache
    const allProducts = window.__sopopped_products || [];
    const product = allProducts.find((p) => String(p.id) === productId);

    if (product) openProduct(product);
  });
});
