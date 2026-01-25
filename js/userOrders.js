/**
 * =============================================================================
 * File: js/userOrders.js
 * Purpose: The "History Book" (Order History).
 * =============================================================================
 *
 * NOTE:
 * This script runs on the "My Account" page.
 * It asks the server: "What have I bought before?" and renders the receipts.
 *
 * It converts raw transaction data into human-readable "Order Cards".
 * =============================================================================
 */

(function () {
  if (typeof window === "undefined") return;

  // ---------------------------------------------------------------------------
  // STEP 1: UTILITIES
  // ---------------------------------------------------------------------------

  // Helper: Pick a color for the badge based on status
  function statusClassFor(status) {
    if (!status) return "badge bg-secondary";
    switch (status.toLowerCase()) {
      case "pending":
        return "badge bg-warning"; // Yellow for "Wait"
      case "paid":
        return "badge bg-success"; // Green for "Good"
      case "shipped":
        return "badge bg-info"; // Blue for "Moving"
      case "cancelled":
        return "badge bg-secondary"; // Grey for "Dead"
      default:
        return "badge bg-secondary";
    }
  }

  // Helper: Safety wrapper for text
  function esc(str) {
    return String(str || "").replace(
      /[&<>"]+/g,
      (m) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m] || m,
    );
  }

  // ---------------------------------------------------------------------------
  // STEP 2: FETCHING DATA
  // ---------------------------------------------------------------------------

  async function fetchOrders(limit) {
    try {
      // Ask the API for the last N orders
      return await window.sopoppedFetch.json(
        "./api/get_user_orders.php?limit=" + encodeURIComponent(limit || 10),
      );
    } catch (e) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 3: RENDERING THE CARDS
  // ---------------------------------------------------------------------------

  async function renderFull(limit, targetId) {
    const res = await fetchOrders(limit);
    const el = document.getElementById(targetId);
    if (!el) return;

    // Fail Cases
    if (!res || !res.success) {
      el.innerHTML = '<div class="text-muted">Failed to load orders.</div>';
      return;
    }

    const orders = res.orders || [];

    // Empty State
    if (orders.length === 0) {
      el.innerHTML =
        '<div class="col-12 text-center text-muted">You have no orders yet.</div>';
      return;
    }

    // Loop through each receipt
    let html = "";
    orders.forEach((o) => {
      const when = new Date(o.created_at).toLocaleString(); // Human Time

      // Preview: Show first 4 items
      const items = (o.items || [])
        .slice(0, 4)
        .map((it) => {
          return `<li class="list-group-item d-flex justify-content-between align-items-center py-2 fs-6">
                    <div class="text-truncate me-2 fw-semibold">${esc(it.product_name || "Product")}</div>
                    <span class="badge bg-light text-dark">
                        ${esc((it.quantity || 0) + " × $" + Number(it.price_at_purchase || 0).toFixed(2))}
                    </span>
                  </li>`;
        })
        .join("");

      // Card Template
      html += `
        <div class="col-12">
          <div class="card position-relative">
            <div class="card-body py-1">
              <div class="d-flex justify-content-between mb-2">
                <div>
                  <a href="order_success.php?order_id=${o.id}" class="h5 fw-bold text-warning stretched-link text-decoration-none">
                    Order #${o.id} <i class="bi bi-box-arrow-up-right ms-1"></i>
                  </a>
                  <div class="small text-muted mt-1">${esc(when)}</div>
                </div>
                <div class="text-end">
                  <div>
                    <span class="${statusClassFor(o.status)} text-white rounded-pill px-2 py-1">${esc(o.status)}</span>
                  </div>
                  <div class="mt-2 fw-bold fs-5">$${Number(o.total_amount || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
            <ul class="list-group list-group-flush">
              ${items}
            </ul>
          </div>
        </div>`;
    });

    el.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // STEP 4: RUN ON PAGE LOAD
  // ---------------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", function () {
    // Only run if the <div id="user-orders-list"> exists on the page
    if (document.getElementById("user-orders-list")) {
      renderFull(10, "user-orders-list").catch(() => {
        document.getElementById("user-orders-list").innerHTML =
          '<div class="text-danger">Failed to load orders.</div>';
      });
    }
  });
})();
