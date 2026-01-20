<?php require_once 'components/header.php'; ?>

<div class="container mt-5 pt-5">
  <div class="p-4 rounded-5 border-0 shadow-sm">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2 class="display-5 fw-bold text-primary" style="font-family: pix;">Order Management</h2>
      <select id="statusFilter" class="form-select rounded-pill shadow-sm w-auto" onchange="loadOrders()">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
        <option value="shipped">Shipped</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Placeholder for Data Table
    <div class="text-center py-5 text-muted">
      <i class="bi bi-receipt display-1 opacity-25"></i>
      <p class="mt-3">Order Data Table will be implemented here.</p>
    </div> -->
    <!-- 
            📋 SNIPPET LOCATION: MARKDOWNS/REPORTS/admin_task_delegation.md
            📦 Package C: Order Management → 1. Frontend: `admin/orders.php`
            ► Step 1: Paste TABLE here (replace placeholder above)
        -->
    <div class="table-responsive">
      <table
        class="table table-hover table-striped-columns table-bordered border-warning align-middle">
        <thead>
          <tr>
            <th>Date Placed</th>
            <th>Order #</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="ordersBody"></tbody>
      </table>
    </div>
  </div>
</div>
<!-- ► Step 2: Paste SCRIPT below (before footer include) -->
<script>
  document.addEventListener("DOMContentLoaded", () => {
    loadOrders();
  });

  async function loadOrders() {
    const status = document.getElementById("statusFilter").value;
    const url = status
      ? `../api/admin/get_orders.php?status=${status}`
      : "../api/admin/get_orders.php";

    const res = await sopoppedFetch.json(url);
    document.getElementById("ordersBody").innerHTML = res.data
      .map(
        (o) => `
        <tr>
            <td>${new Date(
              o.created_at,
            ).toLocaleDateString()} <small class="text-muted">${new Date(
              o.created_at,
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}</small></td>
            <td>
                <strong>#${o.id}</strong><br>
                <div class="text-primary text-break" style="font-size: 0.85rem;">Items: ${
                  o.product_ids || "N/A"
                }</div>
            </td>
            <td>${o.first_name} ${o.last_name}</td>
            <td>$${o.total_amount}</td>
            <td>
                <select class="form-select form-select-sm" onchange="updateStatus(${
                  o.id
                }, this.value)">
                    <option value="pending" ${
                      o.status == "pending" ? "selected" : ""
                    }>Pending</option>
                    <option value="paid" ${
                      o.status == "paid" ? "selected" : ""
                    }>Paid</option>
                    <option value="shipped" ${
                      o.status == "shipped" ? "selected" : ""
                    }>Shipped</option>
                    <option value="cancelled" ${
                      o.status == "cancelled" ? "selected" : ""
                    }>Cancelled</option>
                </select>
            </td>
        </tr>
    `,
      )
      .join("");
  }

  window.updateStatus = async (id, status) => {
    if (
      !confirm(`Are you sure you want to update the status to "${status}"?`)
    ) {
      loadOrders(); // Revert selection
      return;
    }
    try {
      const res = await sopoppedFetch.postJSON(
        "../api/admin/update_order_status.php",
        {
          order_id: id,
          status,
        },
      );
      if (!res.success) {
        alert(res.error || "Failed to update status");
        loadOrders();
      }
    } catch (e) {
      alert("Network error");
      loadOrders();
    }
  };
</script>
<?php require_once 'components/footer.php'; ?>