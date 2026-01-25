/**
 * =============================================================================
 * File: js/cartPrefetch.js
 * Purpose: The "Initializer" (Startup Sync).
 * =============================================================================
 *
 * NOTE:
 * When the page first loads, we have two urgent tasks:
 *   1. Get Product Data: We need to know prices and stock levels immediately.
 *   2. Check User: Are they logged in? If yes, we need to fetch their saved cart.
 *
 * This script runs immediately on page load to handle these "Setup" tasks.
 * It ensures the Cart and Product Modals work correctly from the very first second.
 * =============================================================================
 */

$(document).ready(function () {
  // ---------------------------------------------------------------------------
  // STEP 1: FETCH PRODUCTS (Stock & Price)
  // ---------------------------------------------------------------------------
  // We need this data globally to validate any "Add to Cart" actions.

  const url = "./api/db_products.php?t=" + Date.now(); // Add timestamp to prevent stale cache

  const _productsRequest = window.sopoppedFetch.json(url);

  Promise.resolve(_productsRequest)
    .then(function (data) {
      // 1. Process Data
      const rows = Array.isArray(data?.products) ? data.products : [];

      // Simplify the data structure for easier use
      const mapped = rows.map((p) => ({
        id: p.id,
        name: p.name,
        price: typeof p.price !== "undefined" ? Number(p.price) : 0,
        quantity: typeof p.quantity !== "undefined" ? Number(p.quantity) : 0, // Stock Level
        image: p.image || p.image_path || "",
      }));

      // 2. Store Globally
      window.__sopopped_products = mapped;

      // 3. Announce "Ready"
      $(document).trigger("sopopped-products-loaded", { count: mapped.length });

      // -----------------------------------------------------------------------
      // STEP 2: CHECK SESSION & SYNC CART
      // -----------------------------------------------------------------------

      const _sessionReq = window.sopoppedFetch.json("./api/session_info.php");

      Promise.resolve(_sessionReq)
        .then(function (sess) {
          if (sess && sess.logged_in) {
            // User IS logged in. We must fetch their saved cart.
            const _cartLoad = window.sopoppedFetch.json("./api/cart_load.php");

            Promise.resolve(_cartLoad)
              .then(function (resp) {
                if (resp && resp.success && Array.isArray(resp.cart)) {
                  try {
                    // ---------------------------------------------------------
                    // STEP 3: SYNC STRATEGY
                    // ---------------------------------------------------------
                    // Goal: Combine Local items with Server items appropriately.

                    const localJson =
                      localStorage.getItem("sopopped_cart_v1") || "[]";
                    const local = JSON.parse(localJson) || [];
                    const server = resp.cart || [];

                    const map = new Map();

                    // A. Prioritize Server Items (Trusted Source)
                    server.forEach((it) => {
                      const id = String(it.id);
                      map.set(id, {
                        ...it,
                        id: Number(id),
                        quantity: Number(it.quantity || it.qty || 0),
                      });
                    });

                    // B. Add Local Items (Only if they are new)
                    // Note: Here we DO NOT sum duplicates. In startup sync, we assume server is master.
                    // Summing usually happens during "Login Event", not "Page Load".
                    local.forEach((it) => {
                      const id = String(it.id ?? it.product_id ?? it.productId);
                      if (!id || id === "undefined") return;

                      if (!map.has(id)) {
                        map.set(id, {
                          ...it,
                          id: Number(id),
                          quantity: Number(it.quantity || it.qty || 0),
                        });
                      }
                    });

                    // C. Save Merged Result Locally
                    const merged = Array.from(map.values());
                    localStorage.setItem(
                      "sopopped_cart_v1",
                      JSON.stringify(merged),
                    );

                    // D. Update UI
                    document.dispatchEvent(
                      new CustomEvent("sopopped-server-cart-loaded", {
                        detail: { count: merged.length },
                      }),
                    );
                  } catch (e) {
                    console.warn("Sync logic failed", e);
                  }
                }
              })
              .catch(function (err) {
                console.warn("Failed to load saved cart", err);
              });
          }
        })
        .catch(function (err) {
          /* Not logged in or network error, ignore */
        });
    })
    .catch(function (err) {
      console.warn("Failed to load products", err);
    });
});
