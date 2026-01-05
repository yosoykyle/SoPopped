// Cart manager using localStorage
document.addEventListener("DOMContentLoaded", () => {
  const CART_KEY = "sopopped_cart_v1";
  const cartList = document.getElementById("cart-items");
  const emptyCard = document.querySelector(".emptyCart");
  const cartSummaryBlock = document.getElementById("cart-summary");
  const cartSummaryCol = document.getElementById("cart-summary-col");
  const billingFormCol = document.getElementById("billing-col");
  const hasCartDom = Boolean(cartList);

  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  function findItem(items, id) {
    return items.find((i) => String(i.id) === String(id));
  }

  function render() {
    const items = readCart();
    if (hasCartDom) cartList.innerHTML = "";
    if (!items.length) {
      // show empty message
      if (emptyCard) emptyCard.classList.remove("d-none");
      if (cartSummaryBlock) cartSummaryBlock.classList.add("d-none");
      if (cartSummaryCol) cartSummaryCol.classList.add("d-none");
      if (billingFormCol) billingFormCol.classList.add("d-none");
      const countEl = document.querySelector(".flavorCoutCart");
      if (countEl) countEl.textContent = "0";
      // dispatch event so other UI can react
      try {
        document.dispatchEvent(
          new CustomEvent("cart-changed", { detail: { count: 0, total: 0 } })
        );
      } catch (e) {}
      return;
    }

    if (emptyCard) emptyCard.classList.add("d-none");
    if (cartSummaryBlock) cartSummaryBlock.classList.remove("d-none");
    if (cartSummaryCol) cartSummaryCol.classList.remove("d-none");
    if (billingFormCol) billingFormCol.classList.remove("d-none");

    let total = 0;
    items.forEach((prod) => {
      const all = window.__sopopped_products || [];
      const prodMeta = all.find((p) => String(p.id) === String(prod.id));
      const available = prodMeta ? Number(prodMeta.quantity || 0) : Infinity;

      const li = document.createElement("li");
      // Use grid inside the list item; avoid making the li a flex container to prevent overlap
      li.className = "list-group-item lh-sm py-3";
      li.dataset.productId = prod.id;
      li.dataset.price = prod.price;
      li.innerHTML = `
      <div class="row align-items-center gx-3">
            <div class="col-12 col-md-7">
                <h6 class="my-0 cart-prod-name" title="${escapeHtml(
                  prod.name
                )}">${escapeHtml(prod.name)}</h6>
                <small class="text-body-secondary d-block cart-prod-desc" style="white-space: normal;">${escapeHtml(
                  prod.description || ""
                )}</small>
            </div>
            <div class="col-12 col-md-5">
                <div class="d-flex justify-content-end align-items-center gap-3 mt-2 mt-md-0">
                    <div class="flex-shrink-0">
                        <div class="small text-muted">Subtotal</div>
                        <div class="fw-bold item-subtotal">$${(
                          prod.price * prod.qty
                        ).toFixed(2)}</div>
                    </div>
                    <div class="input-group input-group-sm cart-qty-group flex-shrink-0" style="width: fit-content; max-width: 120px;">
                        <button class="btn btn-outline-secondary btn-decrease" type="button">-</button>
                        <input type="number" class="form-control text-center item-qty" value="${
                          prod.qty
                        }" min="1" max="${available}" style="width: 50px;" />
                        <button class="btn btn-outline-secondary btn-increase" type="button" ${
                          prod.qty >= available ? "disabled" : ""
                        }>+</button>
                    </div>
                <button class="btn btn-sm btn-outline-danger btn-remove flex-shrink-0" type="button" aria-label="Remove"><i class="bi bi-trash"></i></button>
                </div>
            </div>
        </div>
      `;
      if (hasCartDom) cartList.appendChild(li);
      total += prod.price * prod.qty;
    });

    const totalEl = document.getElementById("cart-total");
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    const countEl = document.querySelector(".flavorCoutCart");
    if (countEl) countEl.textContent = String(items.length);
    // Dispatch a cart-changed event so other UI can react (badge in navbar, etc)
    try {
      document.dispatchEvent(
        new CustomEvent("cart-changed", {
          detail: { count: items.length, total },
        })
      );
    } catch (e) {}
  }

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
        }[c])
    );
  }

  // Public api: add product
  window.sopoppedCart = {
    add(product) {
      // Enforce UI-level stock sanity: consult loaded products if available
      const all = window.__sopopped_products || [];
      const prodMeta = all.find((p) => String(p.id) === String(product.id));
      const requested = Math.max(1, Number(product.qty || 1));
      const items = readCart();
      const existing = findItem(items, product.id);

      const available = prodMeta ? Number(prodMeta.quantity || 0) : Infinity;

      if (existing) {
        const newQty = Math.min(available, existing.qty + requested);
        if (newQty === existing.qty) {
          // nothing changed — show message
          if (
            window.sopoppedValidate &&
            typeof window.sopoppedValidate.show === "function"
          ) {
            window.sopoppedValidate.show(
              null,
              "Cannot add more items than available in stock.",
              "danger"
            );
          } else {
            try {
              console.error(
                "sopoppedValidate adapter not available: ensure authDialogs.js registers the adapter before using cart"
              );
            } catch (e) {}
            // As a last resort, show an alert for visibility in dev; keep minimal to avoid DOM coupling
            alert("Cannot add more items than available in stock.");
          }
        } else {
          existing.qty = newQty;
        }
      } else {
        const initial = Math.min(available, requested);
        if (initial <= 0) {
          if (
            window.sopoppedValidate &&
            typeof window.sopoppedValidate.show === "function"
          ) {
            window.sopoppedValidate.show(
              null,
              "This product is out of stock.",
              "danger"
            );
          } else {
            try {
              console.error(
                "sopoppedValidate adapter not available: ensure authDialogs.js registers the adapter before using cart"
              );
            } catch (e) {}
            alert("This product is out of stock.");
          }
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
  };

  // Delegate clicks on cart list (only attach if cart DOM exists)
  if (hasCartDom) {
    cartList.addEventListener("click", (e) => {
      // Use closest to catch clicks on inner <i> icons or the button itself
      const inc = e.target.closest(".btn-increase");
      const dec = e.target.closest(".btn-decrease");
      const rem = e.target.closest(".btn-remove");
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
            if (
              window.sopoppedValidate &&
              typeof window.sopoppedValidate.show === "function"
            ) {
              window.sopoppedValidate.show(
                null,
                "Cannot add more items than available in stock.",
                "danger"
              );
            }
          }
        }
      }
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
      if (rem) {
        const li = rem.closest("li");
        const id = li.dataset.productId;
        window.sopoppedCart.remove(id);
      }
    });

    // manual qty change (committed)
    cartList.addEventListener("change", (e) => {
      if (e.target.classList.contains("item-qty")) {
        const li = e.target.closest("li");
        const id = li.dataset.productId;
        window.sopoppedCart.setQty(id, e.target.value);
      }
    });

    // Real-time input enforcement (like product modal)
    cartList.addEventListener("input", (e) => {
      if (e.target.classList.contains("item-qty")) {
        const input = e.target;
        let val = Number(input.value);
        const max = Number(input.getAttribute("max") || Infinity);
        if (val > max) {
          input.value = max;
          // optional: show tooltip or simple visual feedback?
        }
      }
    });
  }

  // initialize
  render();

  // Fetch session info once and store globally for save ops
  (function fetchSession() {
    try {
      // Use centralized session helper directly
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

  // Listen for products loaded event (from cartPrefetch.js) so availability is known
  try {
    document.addEventListener("sopopped-products-loaded", function () {
      render();
    });
    document.addEventListener("sopopped-server-cart-loaded", function () {
      render();
    });
  } catch (e) {}

  // Debounced save to server when cart changes and user is logged in
  let saveTimer = null;
  function scheduleSaveToServer() {
    if (!window.__sopopped_session || !window.__sopopped_session.logged_in)
      return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        const items = readCart();
        // Use centralized helper for saving cart
        const _saveCartPromise = window.sopoppedFetch.postJSON(
          "./api/cart_save.php",
          items
        );

        _saveCartPromise
          .then((resp) => {
            /* optional handling */
          })
          .catch((err) => {
            console.warn("Failed to save cart", err);
          });
      } catch (e) {
        console.warn("Failed scheduling cart save", e);
      }
    }, 800);
  }

  // Hook writes to schedule save
  const originalWrite = writeCart;
  writeCart = function (items) {
    originalWrite(items);
    scheduleSaveToServer();
  };
});
