/**
 * =============================================================================
 * File: js/userOrders.js
 * Purpose: Fetch and display user order history on the account page.
 * =============================================================================
 *
 * This module handles loading and rendering the user's past orders from the
 * server. It displays order cards with status badges, item previews, and
 * links to order details.
 *
 * Features:
 *   - Fetches orders from API with configurable limit
 *   - Renders responsive order cards with Bootstrap styling
 *   - Shows order status with color-coded badges
 *   - Displays up to 4 items per order as preview
 *   - Links to full order details page
 *
 * Target Element:
 *   - #user-orders-list: Container for rendered order cards
 *
 * Dependencies:
 *   - fetchHelper.js (sopoppedFetch.json)
 *
 * API Endpoint:
 *   - GET ./api/get_user_orders.php?limit=N
 * =============================================================================
 */

(function () {
  if (typeof window === "undefined") return;

  // ---------------------------------------------------------------------------
  // 1. UTILITY FUNCTIONS
  // ---------------------------------------------------------------------------

  /**
   * Get Bootstrap badge class for order status.
   * @param {string} status - Order status ('pending', 'paid', 'shipped', 'cancelled')
   * @returns {string} Bootstrap badge class string
   */
  function statusClassFor(status) {
    if (!status) return "badge bg-secondary";
    switch (status.toLowerCase()) {
      case "pending":
        return "badge bg-warning";
      case "paid":
        return "badge bg-success";
      case "shipped":
        return "badge bg-info";
      case "cancelled":
        return "badge bg-secondary";
      default:
        return "badge bg-secondary";
    }
  }

  /**
   * Escape HTML special characters to prevent XSS.
   * @param {string} str - String to escape
   * @returns {string} Escaped string safe for HTML insertion
   */
  function esc(str) {
    return String(str || "").replace(/[&<>"]+/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m] || m;
    });
  }

  // ---------------------------------------------------------------------------
  // 2. DATA FETCHING
  // ---------------------------------------------------------------------------

  /**
   * Fetch user orders from the server.
   * @param {number} limit - Maximum number of orders to fetch (default: 10)
   * @returns {Promise<Object|null>} Response object or null on error
   *   - success: boolean
   *   - orders: Array of order objects
   */
  async function fetchOrders(limit) {
    try {
      return await window.sopoppedFetch.json(
        "./api/get_user_orders.php?limit=" + encodeURIComponent(limit || 10),
      );
    } catch (e) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. RENDERING
  // ---------------------------------------------------------------------------

  /**
   * Render order cards into the target container.
   * @param {number} limit - Number of orders to display
   * @param {string} targetId - ID of container element
   */
  async function renderFull(limit, targetId) {
    const res = await fetchOrders(limit);
    const el = document.getElementById(targetId);
    if (!el) return;

    // Handle error state
    if (!res || !res.success) {
      el.innerHTML = '<div class="text-muted">Failed to load orders.</div>';
      return;
    }

    const orders = res.orders || [];

    // Handle empty state
    if (orders.length === 0) {
      el.innerHTML =
        '<div class="col-12 text-center text-muted">You have no orders yet.</div>';
      return;
    }

    // Build order cards HTML
    let html = "";
    orders.forEach((o) => {
      // Format date
      const when = new Date(o.created_at).toLocaleString();

      // Build item list (max 4 items shown)
      const items = (o.items || [])
        .slice(0, 4)
        .map((it) => {
          return (
            '<li class="list-group-item d-flex justify-content-between align-items-center py-2 fs-6">' +
            '<div class="text-truncate me-2 fw-semibold">' +
            esc(it.product_name || "Product") +
            "</div>" +
            '<span class="badge bg-light text-dark">' +
            esc(
              (it.quantity || 0) +
                " × $" +
                Number(it.price_at_purchase || 0).toFixed(2),
            ) +
            "</span>" +
            "</li>"
          );
        })
        .join("");

      // Build order card
      html +=
        '<div class="col-12">' +
        '<div class="card position-relative">' +
        '<div class="card-body py-1">' +
        '<div class="d-flex justify-content-between mb-2">' +
        "<div>" +
        '<a href="order_success.php?order_id=' +
        o.id +
        '" class="h5 fw-bold text-warning stretched-link text-decoration-none">Order #' +
        o.id +
        ' <i class="bi bi-box-arrow-up-right ms-1"></i></a>' +
        '<div class="small text-muted mt-1">' +
        esc(when) +
        "</div>" +
        "</div>" +
        '<div class="text-end">' +
        "<div>" +
        '<span class="' +
        statusClassFor(o.status) +
        ' text-white rounded-pill px-2 py-1">' +
        esc(o.status) +
        "</span>" +
        "</div>" +
        '<div class="mt-2 fw-bold fs-5">$' +
        Number(o.total_amount || 0).toFixed(2) +
        "</div>" +
        "</div>" +
        "</div>" +
        "</div>" +
        '<ul class="list-group list-group-flush">' +
        items +
        "</ul>" +
        "</div>" +
        "</div>";
    });

    el.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // 4. INITIALIZATION
  // ---------------------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", function () {
    // Render full page list with 10 orders
    if (document.getElementById("user-orders-list")) {
      renderFull(10, "user-orders-list").catch(() => {
        const el = document.getElementById("user-orders-list");
        if (el)
          el.innerHTML =
            '<div class="text-danger">Failed to load orders.</div>';
      });
    }
  });
})();
