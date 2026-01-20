/**
 * =============================================================================
 * File: js/productModal.js
 * Purpose: Handle product detail modal display and add-to-cart functionality.
 * =============================================================================
 *
 * This module manages the product detail modal that opens when a product card
 * is clicked. It handles:
 *   - Displaying product image, name, description, and price
 *   - Quantity input with stock validation
 *   - Add to Cart and Buy Now actions
 *   - Image error handling with placeholder fallback
 *
 * Target Elements:
 *   - #productModal: Bootstrap modal container
 *   - #pm-image, #pm-name, #pm-desc, #pm-price, #pm-qty, #pm-stock-count
 *   - #pm-qty-increase, #pm-qty-decrease
 *   - #pm-add-cart, #pm-buy-now
 *
 * Event Listeners:
 *   - Click on .product-card: Opens modal with product data
 *
 * Dependencies:
 *   - jQuery
 *   - Bootstrap 5 (Modal)
 *   - cart.js (sopoppedCart.add) or custom events
 *
 * Data Source:
 *   - window.__sopopped_products: Array set by productLoader.js or cartPrefetch.js
 * =============================================================================
 */

$(function () {
  // ---------------------------------------------------------------------------
  // 1. INITIALIZATION
  // ---------------------------------------------------------------------------

  const $modalEl = $("#productModal");
  if (!$modalEl.length) return; // Exit if modal doesn't exist on page

  const bsModal = new bootstrap.Modal($modalEl[0]);

  // ---------------------------------------------------------------------------
  // 2. UTILITY FUNCTIONS
  // ---------------------------------------------------------------------------

  /**
   * Resolve relative image paths to absolute URLs.
   * @param {string} path - Image path (relative or absolute)
   * @returns {string} Resolved absolute URL
   */
  function resolveImagePath(path) {
    if (!path) return "";
    try {
      // Already absolute URL
      if (/^https?:\/\//i.test(path)) return path;
      // Root-relative: prefix origin
      if (path.startsWith("/"))
        return new URL(path, window.location.origin).href;
      // Project-relative: resolve against current page URL
      return new URL(path, window.location.href).href;
    } catch (err) {
      console.warn("[productModal] Invalid image path:", path, err);
      return "";
    }
  }

  /**
   * Format price as currency string.
   * @param {number} value - Price value
   * @returns {string} Formatted price (e.g., "$9.99")
   */
  function formatPrice(value) {
    const num = Number(value) || 0;
    return `$${num.toFixed(2)}`;
  }

  // ---------------------------------------------------------------------------
  // 3. MODAL DISPLAY
  // ---------------------------------------------------------------------------

  /**
   * Open the modal and populate with product data.
   * @param {Object} product - Product object with id, name, description, price, quantity, image
   */
  function openProduct(product) {
    const stock =
      typeof product.quantity !== "undefined" ? Number(product.quantity) : 0;
    const isAvailable = stock > 0;

    // --- Update Image ---
    const $img = $("#pm-image");
    const rawPath = product.image_path || product.image || "images/default.png";
    const resolvedSrc = resolveImagePath(rawPath);

    if ($img.length) {
      console.debug("[productModal] openProduct", {
        id: product.id,
        rawPath,
        resolvedSrc,
      });

      // Reset error flag and attach error handler
      $img[0].removeAttribute("data-error-handled");
      $img.off("error").on("error", function () {
        if (!this.hasAttribute("data-error-handled")) {
          const placeholder = resolveImagePath("images/default.png");
          console.warn(
            "[productModal] Image failed to load, using placeholder:",
            resolvedSrc,
          );
          this.setAttribute("data-error-handled", "true");
          this.src = placeholder;
        }
      });

      $img.attr("src", resolvedSrc);
      $img.attr("alt", product.name || "Product");
    }

    // --- Update Text Content ---
    $("#pm-name").text(product.name || "");
    $("#pm-desc").text(product.description || "");
    $("#pm-price").text(formatPrice(product.price));

    // --- Update Quantity Input ---
    const $qtyInput = $("#pm-qty");
    $qtyInput.val(isAvailable ? 1 : 0);
    $qtyInput.attr("min", "1");
    $qtyInput.attr("max", String(Math.max(0, stock)));
    $qtyInput.attr("data-stock", String(stock));

    // --- Update Stock Display ---
    const $stockCountEl = $("#pm-stock-count");
    if ($stockCountEl.length) $stockCountEl.text(String(stock));

    // --- Toggle Buttons Based on Availability ---
    const $addBtn = $("#pm-add-cart");
    const $buyBtn = $("#pm-buy-now");
    if ($addBtn.length) $addBtn.prop("disabled", !isAvailable);
    if ($buyBtn.length) $buyBtn.prop("disabled", !isAvailable);

    // Store product ID for cart actions
    $modalEl.attr("data-product-id", String(product.id));
    bsModal.show();
  }

  // ---------------------------------------------------------------------------
  // 4. QUANTITY CONTROLS
  // ---------------------------------------------------------------------------

  const $qtyInput = $("#pm-qty");
  const $increaseBtn = $("#pm-qty-increase");
  const $decreaseBtn = $("#pm-qty-decrease");

  // Increase quantity (respects stock limit)
  if ($increaseBtn.length) {
    $increaseBtn.on("click", () => {
      const stock = Number($qtyInput.attr("data-stock") || 0);
      if (stock <= 0) return;
      const current = Number($qtyInput.val()) || 0;
      $qtyInput.val(Math.min(current + 1, stock));
    });
  }

  // Decrease quantity (minimum 1)
  if ($decreaseBtn.length) {
    $decreaseBtn.on("click", () => {
      const stock = Number($qtyInput.attr("data-stock") || 0);
      if (stock <= 0) {
        $qtyInput.val(0);
        return;
      }
      const current = Number($qtyInput.val()) || 1;
      $qtyInput.val(Math.max(1, current - 1));
    });
  }

  // Validate input as user types
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
  // 5. CART ACTIONS
  // ---------------------------------------------------------------------------

  /**
   * Add product to cart.
   * @param {number} qty - Quantity to add
   */
  function addToCart(qty) {
    const id = $modalEl.attr("data-product-id");
    if (!id) return;

    const product = { id, qty };

    // Get full product data from global array
    const fullProduct = (window.__sopopped_products || []).find(
      (p) => String(p.id) === id,
    );

    if (fullProduct) {
      product.name = fullProduct.name;
      product.price = Number(fullProduct.price) || 0;
      product.description = fullProduct.description || "";
    }

    // Use sopoppedCart if available, otherwise dispatch event
    if (window.sopoppedCart?.add) {
      window.sopoppedCart.add(product);
    } else {
      $(document).trigger("product-add-to-cart", [{ detail: { id, qty } }]);
    }
  }

  // Add to Cart button handler
  const $addCartBtn = $("#pm-add-cart");
  if ($addCartBtn.length) {
    $addCartBtn.on("click", () => {
      const qty = Number($qtyInput.val()) || 1;
      addToCart(qty);
      bsModal.hide();
    });
  }

  // Buy Now button handler (add to cart and redirect)
  const $buyNowBtn = $("#pm-buy-now");
  if ($buyNowBtn.length) {
    $buyNowBtn.on("click", () => {
      const qty = Number($qtyInput.val()) || 1;
      addToCart(qty);
      if (window.sopoppedCart?.add) {
        window.location.href = "cart.php";
      } else {
        $(document).trigger("product-buy-now", [
          { detail: { id: $modalEl.attr("data-product-id"), qty } },
        ]);
        bsModal.hide();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 6. PRODUCT CARD CLICK HANDLER
  // ---------------------------------------------------------------------------

  /**
   * Handle clicks on product cards to open modal.
   * Uses event delegation for dynamically added cards.
   */
  $(document).on("click", ".product-card", function (e) {
    const $card = $(this);
    const productId = $card.attr("data-product-id");

    if (!productId) {
      console.warn("[productModal] Product card missing data-product-id");
      return;
    }

    // Find product in global array
    const allProducts = window.__sopopped_products || [];
    const product = allProducts.find((p) => String(p.id) === productId);

    if (product) {
      openProduct(product);
    } else {
      console.error(`[productModal] Product not found with ID: ${productId}`);
    }
  });
});
