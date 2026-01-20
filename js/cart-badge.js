/**
 * =============================================================================
 * File: js/cart-badge.js
 * Purpose: Updates the navbar cart badge count on load and when cart changes.
 * =============================================================================
 *
 * This small utility keeps the cart item count in the navbar in sync with
 * the actual cart contents. It listens for 'cart-changed' events and updates
 * the badge accordingly.
 *
 * Exports: None (self-executing, attaches event listeners)
 *
 * Dependencies:
 *   - jQuery
 *   - cart.js (optional, uses sopoppedCart.getCount if available)
 *
 * Event Listeners:
 *   - DOMContentLoaded: Initial badge update
 *   - cart-changed: Updates badge when cart is modified
 * =============================================================================
 */

(function ($) {
  // ---------------------------------------------------------------------------
  // 1. BADGE UPDATE FUNCTION
  // ---------------------------------------------------------------------------

  /**
   * Update the cart badge text with the item count.
   * @param {number} count - Number of items in cart
   */
  function updateBadge(count) {
    $(".flavorCoutCart").text(String(count || 0));
  }

  // ---------------------------------------------------------------------------
  // 2. CART COUNT REFRESH
  // ---------------------------------------------------------------------------

  /**
   * Refresh the badge by reading current cart count.
   * Uses sopoppedCart API if available, otherwise reads from localStorage.
   */
  function refresh() {
    // Try to use the cart API if it's loaded
    if (
      window.sopoppedCart &&
      typeof window.sopoppedCart.getCount === "function"
    ) {
      updateBadge(window.sopoppedCart.getCount());
    } else {
      // Fallback: read directly from localStorage
      try {
        const items = JSON.parse(
          localStorage.getItem("sopopped_cart_v1") || "[]",
        );
        updateBadge(items.length);
      } catch (e) {
        updateBadge(0);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. EVENT LISTENERS
  // ---------------------------------------------------------------------------

  $(function () {
    // Initial badge update on page load
    refresh();

    // Listen for cart-changed events (dispatched by cart.js)
    $(document).on("cart-changed", (e) => {
      const c =
        e && e.detail && typeof e.detail.count === "number"
          ? e.detail.count
          : null;
      // If event includes count, use it; otherwise refresh from source
      if (c !== null) updateBadge(c);
      else refresh();
    });
  });
})(jQuery);
