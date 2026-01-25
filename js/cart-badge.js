/**
 * =============================================================================
 * File: js/cart-badge.js
 * Purpose: The "Messenger" (UI Updates).
 * =============================================================================
 *
 * NOTE:
 * When you add an item to the cart, the little number in the corner (Badge)
 * needs to change immediately. It feels broken if it doesn't.
 *
 * This script blindly listens for the "cart-changed" event.
 * It doesn't care *how* the cart changed, or *what* is in it.
 * It just asks: "What is the new number?" and paints it.
 * =============================================================================
 */

(function ($) {
  // ---------------------------------------------------------------------------
  // STEP 1: PAINTING THE BADGE
  // ---------------------------------------------------------------------------

  function updateBadge(count) {
    // Find the element with class .flavorCoutCart (The Badge)
    $(".flavorCoutCart").text(String(count || 0));
  }

  // ---------------------------------------------------------------------------
  // STEP 2: ASKING "HOW MANY?"
  // ---------------------------------------------------------------------------

  function refresh() {
    // Option A: Ask the Cart Manager directly (Preferred)
    if (
      window.sopoppedCart &&
      typeof window.sopoppedCart.getCount === "function"
    ) {
      updateBadge(window.sopoppedCart.getCount());
    }
    // Option B: Peek into the browser's storage (Fallback)
    else {
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
  // STEP 3: LISTENING FOR SIGNALS
  // ---------------------------------------------------------------------------

  $(function () {
    // 1. On Load: Paint the initial number
    refresh();

    // 2. On Change: Listen for the shout "cart-changed"!
    $(document).on("cart-changed", (e) => {
      // Did the shouter tell us the new number?
      const c =
        e && e.detail && typeof e.detail.count === "number"
          ? e.detail.count
          : null;

      if (c !== null) {
        updateBadge(c); // Yes, use it.
      } else {
        refresh(); // No, go check manually.
      }
    });
  });
})(jQuery);
