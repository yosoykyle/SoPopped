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
<!-- paste here -->

<?php require_once 'components/footer.php'; ?>