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

    <!-- Placeholder for Data Table -->
    <!-- <div class="text-center py-5 text-muted">
      <i class="bi bi-receipt display-1 opacity-25"></i>
      <p class="mt-3">Order Data Table will be implemented here.</p>
    </div> -->
    <!-- 
            📋 SNIPPET LOCATION: MARKDOWNS/REPORTS/admin_task_delegation.md
            📦 Package C: Order Management → 1. Frontend: `admin/orders.php`
            ► Step 1: Paste TABLE here (replace placeholder above)
        -->
  
  </div>
</div>
<!-- ► Step 2: Paste SCRIPT below (before footer include) -->

<?php require_once 'components/footer.php'; ?>