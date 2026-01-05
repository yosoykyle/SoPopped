// js/userOrders.js
(function () {
  if (typeof window === 'undefined') return;

  function statusClassFor(status) {
    if (!status) return 'badge bg-secondary';
    switch (status.toLowerCase()) {
      case 'pending': return 'badge bg-warning';
      case 'paid': return 'badge bg-success';
      case 'shipped': return 'badge bg-info';
      case 'cancelled': return 'badge bg-secondary';
      default: return 'badge bg-secondary';
    }
  }

  function esc(str) {
    return String(str || '').replace(/[&<>"]+/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m] || m;
    });
  }

  async function fetchOrders(limit) {
    try {
      return await window.sopoppedFetch.json('./api/get_user_orders.php?limit=' + encodeURIComponent(limit || 10));
    } catch (e) {
      return null;
    }
  }

  // Preview dropdown removed; keep only full-page rendering

  async function renderFull(limit, targetId) {
    const res = await fetchOrders(limit);
    const el = document.getElementById(targetId);
    if (!el) return;
    if (!res || !res.success) {
      el.innerHTML = '<div class="text-muted">Failed to load orders.</div>';
      return;
    }
    const orders = res.orders || [];
    if (orders.length === 0) {
      el.innerHTML = '<div class="col-12 text-center text-muted">You have no orders yet.</div>';
      return;
    }

    let html = '';
    orders.forEach(o => {
      const when = new Date(o.created_at).toLocaleString();
      const items = (o.items || []).slice(0, 4).map(it => {
        return '<li class="list-group-item d-flex justify-content-between align-items-center py-2 fs-6">'
          + '<div class="text-truncate me-2 fw-semibold">' + esc(it.product_name || 'Product') + '</div>'
          + '<span class="badge bg-light text-dark">' + esc((it.quantity || 0) + ' × $' + Number(it.price_at_purchase || 0).toFixed(2)) + '</span>'
          + '</li>';
      }).join('');

      html += '<div class="col-12">'
        + '<div class="card position-relative">'
        + '<div class="card-body py-1">'
        + '<div class="d-flex justify-content-between mb-2">'
        + '<div>'
        + '<a href="order_success.php?order_id=' + o.id + '" class="h5 fw-bold text-warning stretched-link text-decoration-none">Order #' + o.id + ' <i class="bi bi-box-arrow-up-right ms-1"></i></a>'
        + '<div class="small text-muted mt-1">' + esc(when) + '</div>'
        + '</div>'
        + '<div class="text-end">'
        + '<div>' + '<span class="' + statusClassFor(o.status) + ' text-white rounded-pill px-2 py-1">' + esc(o.status) + '</span>' + '</div>'
        + '<div class="mt-2 fw-bold fs-5">$' + Number(o.total_amount || 0).toFixed(2) + '</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<ul class="list-group list-group-flush">' + items + '</ul>'
        + '</div>'
        + '</div>';
    });

    el.innerHTML = html;
  }

  document.addEventListener('DOMContentLoaded', function () {
    // No dropdown preview; render only the full page list
    // Full page list (10 items)
    if (document.getElementById('user-orders-list')) {
      renderFull(10, 'user-orders-list').catch(() => {
        const el = document.getElementById('user-orders-list');
        if (el) el.innerHTML = '<div class="text-danger">Failed to load orders.</div>';
      });
    }
  });

})();
