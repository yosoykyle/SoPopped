/**
 * =============================================================================
 * File: js/cartPrefetch.js
 * Purpose: Prefetch product metadata and synchronize cart data on page load.
 * =============================================================================
 *
 * This module runs on page load to:
 *   1. Fetch all product metadata (id, name, price, quantity) for inventory checks
 *   2. Check if user is logged in
 *   3. If logged in, merge server cart with localStorage cart
 *
 * This enables:
 *   - Real-time stock validation before adding to cart
 *   - Cart synchronization between devices for logged-in users
 *   - Guest cart → logged-in cart merge on login
 *
 * Global Variables Set:
 *   - window.__sopopped_products: Array of product metadata
 *
 * Events Dispatched:
 *   - 'sopopped-products-loaded': When products are fetched
 *   - 'sopopped-server-cart-loaded': When cart is merged from server
 *
 * Dependencies:
 *   - jQuery
 *   - fetchHelper.js (sopoppedFetch.json)
 *
 * API Endpoints Used:
 *   - GET ./api/db_products.php - Fetch all products
 *   - GET ./api/session_info.php - Check login status
 *   - GET ./api/cart_load.php - Load server cart
 * =============================================================================
 */

$(document).ready(function () {
  // ---------------------------------------------------------------------------
  // 1. FETCH PRODUCT METADATA
  // ---------------------------------------------------------------------------

  // Cache-bust URL to ensure fresh data
  const url = "./api/db_products.php?t=" + Date.now();

  const _productsRequest = window.sopoppedFetch.json(url);

  Promise.resolve(_productsRequest)
    .then(function (data) {
      // Normalize API response to consistent product format
      const rows = Array.isArray(data?.products) ? data.products : [];
      const mapped = rows.map((p) => ({
        id: p.id,
        name: p.name,
        price: typeof p.price !== "undefined" ? Number(p.price) : 0,
        quantity: typeof p.quantity !== "undefined" ? Number(p.quantity) : 0,
        image: p.image || p.image_path || "",
      }));

      // Store globally for access by other scripts
      window.__sopopped_products = mapped;

      // Notify other scripts that products are loaded
      $(document).trigger("sopopped-products-loaded", { count: mapped.length });

      // -----------------------------------------------------------------------
      // 2. CHECK SESSION AND MERGE CART IF LOGGED IN
      // -----------------------------------------------------------------------

      const _sessionReq = window.sopoppedFetch.json("./api/session_info.php");

      Promise.resolve(_sessionReq)
        .then(function (sess) {
          if (sess && sess.logged_in) {
            // User is logged in - load and merge server cart
            const _cartLoad = window.sopoppedFetch.json("./api/cart_load.php");

            Promise.resolve(_cartLoad)
              .then(function (resp) {
                if (resp && resp.success && Array.isArray(resp.cart)) {
                  try {
                    // -----------------------------------------------------------
                    // 3. MERGE STRATEGY: Combine local and server carts
                    // - Server items take priority for metadata
                    // - Local-only items are added to preserve guest cart
                    // - Duplicate IDs are NOT summed (server wins)
                    // -----------------------------------------------------------

                    const localJson =
                      localStorage.getItem("sopopped_cart_v1") || "[]";
                    const local = JSON.parse(localJson) || [];
                    const server = resp.cart || [];

                    // Use Map for O(1) lookups by ID
                    const map = new Map();

                    // Add all server items first
                    server.forEach((it) => {
                      const id = String(it.id);
                      const qty =
                        Number(it.quantity ?? it.qty ?? it.qty ?? 0) || 0;
                      map.set(
                        id,
                        Object.assign({}, it, {
                          id: Number(id),
                          quantity: qty,
                        }),
                      );
                    });

                    // Add local-only items (don't overwrite server items)
                    local.forEach((it) => {
                      const idRaw = it.id ?? it.product_id ?? it.productId;
                      if (idRaw === undefined || idRaw === null) return;
                      const id = String(idRaw);
                      const qty = Number(it.quantity ?? it.qty ?? 0) || 0;
                      if (!map.has(id)) {
                        // Only add if not already in server cart
                        map.set(
                          id,
                          Object.assign({}, it, {
                            id: Number(id),
                            quantity: qty,
                          }),
                        );
                      }
                    });

                    // Convert map to array and save
                    const merged = Array.from(map.values());
                    localStorage.setItem(
                      "sopopped_cart_v1",
                      JSON.stringify(merged),
                    );

                    // Notify cart UI to refresh
                    try {
                      document.dispatchEvent(
                        new CustomEvent("sopopped-server-cart-loaded", {
                          detail: { count: merged.length },
                        }),
                      );
                    } catch (e) {}
                  } catch (e) {
                    console.warn("Failed to merge carts", e);
                  }
                }
              })
              .catch(function (err) {
                console.warn("[cartPrefetch] Failed to load saved cart", err);
              });
          }
        })
        .catch(function (err) {
          console.warn("[cartPrefetch] Failed to fetch session info", err);
        });
    })
    .catch(function (err) {
      console.warn("[cartPrefetch] Failed to load product metadata", err);
    });
});
