/**
 * =============================================================================
 * File: js/cart.js
 * Purpose: The Shopping Cart Manager.
 * =============================================================================
 *
 * NOTE:
 * This script runs the Shopping Cart on the user's screen (Client-Side).
 *
 * It has 4 jobs:
 *   1. Store: Keep the list of items safe in `localStorage` (The browser's memory).
 *   2. Render: Draw the cart HTML list on the page.
 *   3. Logic: Add/Remove items, and calculate Totals ($).
 *   4. Sync: If logged in, auto-save changes to the server.
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------------------------------
  // 1. CONFIGURATION & DOM ELEMENTS
  // ---------------------------------------------------------------------------

  const CART_KEY = "sopopped_cart_v1";

  // UI Containers
  const cartList = document.getElementById("cart-items");
  const emptyCard = document.querySelector(".emptyCart");
  const cartSummaryBlock = document.getElementById("cart-summary");
  const cartSummaryCol = document.getElementById("cart-summary-col");
  const billingFormCol = document.getElementById("billing-col");

  // Check if we are on a page that actually has the cart DOM
  const hasCartDom = Boolean(cartList);

  // State for selected items
  let selectedItemIds = new Set();
  const selectAllCheckbox = document.getElementById("selectAllCart");
  const btnDeleteSelected = document.getElementById("btnDeleteSelected");

  // ---------------------------------------------------------------------------
  // 2. DATA UTILITIES (READ/WRITE)
  // ---------------------------------------------------------------------------

  /**
   * Read cart from localStorage.
   * @returns {Array} Cart items array
   */
  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  /**
   * Write cart to localStorage and triggering save to server.
   * @param {Array} items - Cart items array
   */
  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    // Note: The 'writeCart' function is hooked at the bottom of file to also schedule server save
  }

  /**
   * Find item in cart array by ID.
   * @param {Array} items - Cart items
   * @param {string|number} id - Product ID
   * @returns {Object|undefined} Found item or undefined
   */
  function findItem(items, id) {
    return items.find((i) => String(i.id) === String(id));
  }

  /**
   * Escape HTML to prevent XSS.
   * @param {string} s - String to escape
   * @returns {string} Escaped string
   */
  function escapeHtml(s) {
    return String(s || "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }

  // ---------------------------------------------------------------------------
  // 3. RENDER LOGIC
  // ---------------------------------------------------------------------------

  /**
   * Render the cart UI based on current state.
   * Updates list, totals, empty state, and dispatches change events.
   */
  function render() {
    const items = readCart();

    // Clear list if present
    if (hasCartDom) cartList.innerHTML = "";

    // -- Handle Empty Cart --
    if (!items.length) {
      if (emptyCard) emptyCard.classList.remove("d-none");
      if (cartSummaryBlock) cartSummaryBlock.classList.add("d-none");
      if (cartSummaryCol) cartSummaryCol.classList.add("d-none");
      if (billingFormCol) billingFormCol.classList.add("d-none");

      // Hide/Disable select controls
      if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.parentElement.parentElement.classList.add("d-none");
      }

      const countEl = document.querySelector(".flavorCoutCart");
      if (countEl) countEl.textContent = "0";

      // Dispatch event for other UI components (e.g. badge)
      try {
        document.dispatchEvent(
          new CustomEvent("cart-changed", { detail: { count: 0, total: 0 } }),
        );
      } catch (e) {}
      return;
    }

    // -- Handle Populated Cart --
    if (emptyCard) emptyCard.classList.add("d-none");
    if (cartSummaryBlock) cartSummaryBlock.classList.remove("d-none");
    if (cartSummaryCol) cartSummaryCol.classList.remove("d-none");

    if (billingFormCol) billingFormCol.classList.remove("d-none");

    // Show select controls
    if (selectAllCheckbox) {
      selectAllCheckbox.parentElement.parentElement.classList.remove("d-none");
    }

    let total = 0;

    items.forEach((prod) => {
      // Look up live product data for stock check
      const all = window.__sopopped_products || [];
      const prodMeta = all.find((p) => String(p.id) === String(prod.id));
      const available = prodMeta ? Number(prodMeta.quantity || 0) : Infinity;

      const li = document.createElement("li");
      li.className = "list-group-item lh-sm py-3";
      li.dataset.productId = prod.id;
      li.dataset.price = prod.price;

      // Build HTML for cart item
      li.innerHTML = `

      <div class="row align-items-center gx-3">
            <div class="col-1 d-flex justify-content-center">
              <input class="form-check-input cart-item-check" type="checkbox" value="${prod.id}" ${selectedItemIds.has(String(prod.id)) ? "checked" : ""}>
            </div>
            <div class="col-11 col-md-6">
                <h6 class="my-0 cart-prod-name" title="${escapeHtml(prod.name)}">${escapeHtml(prod.name)}</h6>
                <small class="text-body-secondary d-block cart-prod-desc" style="white-space: normal;">${escapeHtml(prod.description || "")}</small>
            </div>
            <div class="col-12 col-md-5">
                <div class="d-flex justify-content-end align-items-center gap-3 mt-2 mt-md-0">
                    <div class="flex-shrink-0">
                        <div class="small text-muted">Subtotal</div>
                        <div class="fw-bold item-subtotal">$${(prod.price * prod.qty).toFixed(2)}</div>
                    </div>
                    <div class="input-group input-group-sm cart-qty-group flex-shrink-0" style="width: fit-content; max-width: 120px;">
                        <button class="btn btn-outline-secondary btn-decrease" type="button">-</button>
                        <input type="number" class="form-control text-center item-qty" value="${prod.qty}" min="1" max="${available}" style="width: 50px;" />
                        <button class="btn btn-outline-secondary btn-increase" type="button" ${prod.qty >= available ? "disabled" : ""}>+</button>
                    </div>
                <button class="btn btn-sm btn-outline-danger btn-remove flex-shrink-0" type="button" aria-label="Remove"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        </div>
      `;
      if (hasCartDom) cartList.appendChild(li);
      total += prod.price * prod.qty;
    });

    // Update Totals
    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;

    const countEl = document.querySelector(".flavorCoutCart");
    if (countEl) countEl.textContent = String(items.length);

    // Dispatch event
    try {
      document.dispatchEvent(
        new CustomEvent("cart-changed", {
          detail: { count: items.length, total },
        }),
      );
    } catch (e) {}

    // Update Select All and Delete Button State
    updateSelectionUI(items);
  }

  function updateSelectionUI(items) {
    if (!hasCartDom) return;

    // Clean up IDs that might no longer exist
    const currentIds = new Set(items.map((i) => String(i.id)));
    // Create a new Set by filtering the existing selectedItemIds
    const validSelectedIds = new Set();
    selectedItemIds.forEach((id) => {
      if (currentIds.has(id)) {
        validSelectedIds.add(id);
      }
    });
    selectedItemIds = validSelectedIds;

    const allSelected =
      items.length > 0 && items.every((i) => selectedItemIds.has(String(i.id)));
    const anySelected = selectedItemIds.size > 0;

    if (selectAllCheckbox) selectAllCheckbox.checked = allSelected;
    if (btnDeleteSelected) btnDeleteSelected.disabled = !anySelected;
  }

  // ---------------------------------------------------------------------------
  // 4. PUBLIC API (window.sopoppedCart)
  // ---------------------------------------------------------------------------

  window.sopoppedCart = {
    /**
     * Add product to cart.
     * Checks stock availability before adding.
     * @param {Object} product - Product to add
     */
    add(product) {
      const all = window.__sopopped_products || [];
      const prodMeta = all.find((p) => String(p.id) === String(product.id));
      const available = prodMeta ? Number(prodMeta.quantity || 0) : Infinity;
      const requested = Math.max(1, Number(product.qty || 1));

      const items = readCart();
      const existing = findItem(items, product.id);

      if (existing) {
        // Update existing item
        const newQty = Math.min(available, existing.qty + requested);
        if (newQty === existing.qty) {
          // Cannot add more - show error
          showError("Cannot add more items than available in stock.");
        } else {
          existing.qty = newQty;
        }
      } else {
        // Add new item
        const initial = Math.min(available, requested);
        if (initial <= 0) {
          showError("This product is out of stock.");
          return;
        }
        items.push({
          id: product.id,
          name: product.name,
          description: product.description || "",
          price: Number(product.price || 0),
          qty: initial,
        });
      }
      writeCart(items);
      render();
    },

    remove(id) {
      let items = readCart();
      items = items.filter((i) => String(i.id) !== String(id));
      writeCart(items);
      render();
    },

    setQty(id, qty) {
      const items = readCart();
      const it = findItem(items, id);
      if (!it) return;

      const desired = Math.max(1, Number(qty) || 1);
      const all = window.__sopopped_products || [];
      const prodMeta = all.find((p) => String(p.id) === String(id));
      const available = prodMeta ? Number(prodMeta.quantity || 0) : Infinity;

      it.qty = Math.min(desired, available);
      writeCart(items);
      render();
    },

    clear() {
      localStorage.removeItem(CART_KEY);
      render();
    },

    getCount() {
      return readCart().length;
    },

    bulkRemove(ids) {
      let items = readCart();
      const idsToRemove = new Set(ids.map(String));
      items = items.filter((i) => !idsToRemove.has(String(i.id)));

      // Also remove from selection
      idsToRemove.forEach((id) => selectedItemIds.delete(id));

      writeCart(items);
      render();
    },

    getSelectedItems() {
      const items = readCart();
      if (selectedItemIds.size === 0) return [];
      return items.filter((i) => selectedItemIds.has(String(i.id)));
    },
  };

  // Helper to show errors
  function showError(msg) {
    if (
      window.sopoppedValidate &&
      typeof window.sopoppedValidate.show === "function"
    ) {
      window.sopoppedValidate.show(null, msg, "danger");
    } else {
      alert(msg);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. EVENT DELEGATION (Cart Actions)
  // ---------------------------------------------------------------------------

  if (hasCartDom) {
    cartList.addEventListener("click", (e) => {
      const inc = e.target.closest(".btn-increase");
      const dec = e.target.closest(".btn-decrease");
      const rem = e.target.closest(".btn-remove");

      // Increase
      if (inc) {
        const li = inc.closest("li");
        const id = li.dataset.productId;
        const items = readCart();
        const it = findItem(items, id);

        if (it) {
          const all = window.__sopopped_products || [];
          const prodMeta = all.find((p) => String(p.id) === String(id));
          const available = prodMeta
            ? Number(prodMeta.quantity || 0)
            : Infinity;

          if (it.qty < available) {
            it.qty++;
            writeCart(items);
            render();
          } else {
            showError("Cannot add more items than available in stock.");
          }
        }
      }
      // Decrease
      if (dec) {
        const li = dec.closest("li");
        const id = li.dataset.productId;
        const items = readCart();
        const it = findItem(items, id);
        if (it) {
          it.qty = Math.max(1, it.qty - 1);
          writeCart(items);
          render();
        }
      }
      // Remove
      if (rem) {
        const li = rem.closest("li");
        const id = li.dataset.productId;
        window.sopoppedCart.remove(id);
      }

      // Checkbox click
      if (e.target.classList.contains("cart-item-check")) {
        const id = e.target.value;
        if (e.target.checked) {
          selectedItemIds.add(id);
        } else {
          selectedItemIds.delete(id);
        }
        updateSelectionUI(readCart());
      }
    });

    // Select All Listener
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", (e) => {
        const isChecked = e.target.checked;
        const items = readCart();
        if (isChecked) {
          items.forEach((i) => selectedItemIds.add(String(i.id)));
        } else {
          selectedItemIds.clear();
        }
        render(); // Re-render to update all item checkboxes
      });
    }

    // Delete Selected Listener
    if (btnDeleteSelected) {
      btnDeleteSelected.addEventListener("click", () => {
        if (selectedItemIds.size === 0) return;
        if (confirm("Are you sure you want to delete selected items?")) {
          window.sopoppedCart.bulkRemove([...selectedItemIds]);
        }
      });
    }

    // Handle manual input change
    cartList.addEventListener("change", (e) => {
      if (e.target.classList.contains("item-qty")) {
        const li = e.target.closest("li");
        const id = li.dataset.productId;
        window.sopoppedCart.setQty(id, e.target.value);
      }
    });

    // Enforce max value on input
    cartList.addEventListener("input", (e) => {
      if (e.target.classList.contains("item-qty")) {
        const input = e.target;
        let val = Number(input.value);
        const max = Number(input.getAttribute("max") || Infinity);
        if (val > max) {
          input.value = max;
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 6. INITIAL DATA LOAD & SYNC
  // ---------------------------------------------------------------------------

  // Initial render
  render();

  // Fetch session info once and store globally for save ops
  (function fetchSession() {
    try {
      const p = window.sopoppedSession.fetchInfo();
      Promise.resolve(p)
        .then((data) => {
          window.__sopopped_session = data || { logged_in: false };
        })
        .catch(() => {
          window.__sopopped_session = { logged_in: false };
        });
    } catch (e) {
      window.__sopopped_session = { logged_in: false };
    }
  })();

  // Listen for products loaded to re-render with fresh stock info
  try {
    document.addEventListener("sopopped-products-loaded", render);
    document.addEventListener("sopopped-server-cart-loaded", render);
  } catch (e) {}

  // ---------------------------------------------------------------------------
  // 7. SERVER SYNC LOGIC
  // ---------------------------------------------------------------------------

  // Debounced save to server
  let saveTimer = null;
  function scheduleSaveToServer() {
    if (!window.__sopopped_session || !window.__sopopped_session.logged_in)
      return;

    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        const items = readCart();
        window.sopoppedFetch
          .postJSON("./api/cart_save.php", items)
          .catch((err) => console.warn("Failed to save cart", err));
      } catch (e) {
        console.warn("Failed scheduling cart save", e);
      }
    }, 800);
  }

  // Hook writeCart to schedule save
  const originalWrite = writeCart;
  writeCart = function (items) {
    originalWrite(items);
    scheduleSaveToServer();
  };
});
