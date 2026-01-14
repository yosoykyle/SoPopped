<?php
// admin/dashboard.php
require_once 'components/header.php';
?>
<!-- 
            📋 SNIPPET LOCATION: MARKDOWNS/REPORTS/admin_task_delegation.md
            📦 Package D: Dashboard Intelligence → 1. Frontend: `admin/dashboard.php`
            
            Instruction:
            1. Copy the <script> snippet from "Package D" in admin_task_delegation.md
            2. Paste it at the bottom of this file (before footer include)
        -->

<div class="container mt-5 pt-5">
    <div class="row pt-4">
        <div class="col-12">
            <div class="p-4 rounded-5 border-0 shadow-sm">
                <div class="card-body text-center">
                    <h1 class="display-4">Welcome, Admin!</h1>
                    <p class="lead text-muted">Manage your users, products, and orders from here.</p>
                    <hr class="my-4">

                    <div class="row g-4 justify-content-center dashboard-card">
                        <div class="col-md-4">
                            <div class="p-4 border rounded-4 bg-light dash">
                                <i class="bi bi-people fs-1 text-primary mb-3"></i>
                                <h3>Users</h3>
                                <a href="users.php" class="btn btn-primary w-100 rounded-pill">Manage Users</a>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="p-4 border rounded-4 bg-light">
                                <i class="bi bi-box-seam fs-1 text-success mb-3"></i>
                                <h3>Products</h3>
                                <a href="products.php" class="btn btn-success w-100 rounded-pill">Manage Products</a>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="p-4 border rounded-4 bg-light">
                                <i class="bi bi-cart fs-1 text-warning mb-3"></i>
                                <h3>Orders</h3>
                                <a href="orders.php" class="btn btn-warning w-100 rounded-pill text-white">Manage Orders</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
  document.addEventListener("DOMContentLoaded", async () => {
    // Select all the actual card divs (the ones with .p-4.border)
    const cards = document.querySelectorAll(".dashboard-card > div > div");
    if (cards.length < 3) {
      console.warn("Dashboard cards not found");
      return;
    }

    try {
      const res = await sopoppedFetch.json(
        "../api/admin/get_dashboard_stats.php"
      );
      if (res.success) {
        const stats = res.data;

        // Update Users Card (first card)
        const usersCard = cards[0];
        const usersH3 = usersCard.querySelector("h3");
        usersH3.innerHTML = `${stats.total_users} Active Customers`;
        usersCard.querySelector("small.stat-info")?.remove();
        usersH3.insertAdjacentHTML(
          "afterend",
          `<small class='stat-info text-muted d-block mb-3'>${stats.new_users_today} new today</small>`
        );

        // Update Products Card (second card)
        const productsCard = cards[1];
        const productsH3 = productsCard.querySelector("h3");
        productsH3.innerHTML = `${stats.total_products} Products`;
        productsCard.querySelector("small.stat-info")?.remove();
        if (stats.low_stock > 0) {
          productsH3.insertAdjacentHTML(
            "afterend",
            `<small class='stat-info text-danger d-block mb-3'>${stats.low_stock} low stock</small>`
          );
        } else {
          productsH3.insertAdjacentHTML(
            "afterend",
            `<small class='stat-info text-muted d-block mb-3'>Stock Healthy</small>`
          );
        }

        // Update Orders Card (third card)
        const ordersCard = cards[2];
        const ordersH3 = ordersCard.querySelector("h3");
        ordersH3.innerHTML = `${stats.total_orders} Orders`;
        ordersCard.querySelector("small.stat-info")?.remove();
        ordersH3.insertAdjacentHTML(
          "afterend",
          `<small class='stat-info text-muted d-block mb-3'>Pending: ${stats.pending_orders}</small>`
        );
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    }
  });
</script>

<?php require_once 'components/footer.php'; ?>