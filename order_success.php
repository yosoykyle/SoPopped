<?php

/**
 * File: order_success.php
 * Description: Order confirmation / Receipt page.
 * Flow:
 * 1. Checks for a valid `order_id` in the URL query string.
 * 2. Fetches order details from the database (`orders` and `order_items` tables).
 * 3. SECURITY: Verifies that the logged-in user owns the order (or is Admin).
 *    - If unauthorized, hides details and shows error.
 * 4. Helper function `statusClassFor` maps order status (e.g., 'paid', 'pending') to Bootstrap colors.
 * 5. Renders the receipt view.
 */
// order_success.php
require_once __DIR__ . '/db/sopoppedDB.php';
session_start();

$orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
$order = null;
$items = [];
$forbidden = false;
if ($orderId > 0) {
    // DB FETCH: Get primary order info
    $stmt = $pdo->prepare('SELECT id, user_id, total_amount, status, payment_method, shipping_address, created_at FROM orders WHERE id = :id');
    $stmt->execute([':id' => $orderId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($order) {
        // AUTH CHECK: Enforce that only the owning user (or admin) can view this order
        $currentUserId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
        $isAdmin = isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin';
        if (!$isAdmin && $order['user_id'] !== $currentUserId) {
            // hide details from unauthorized users
            $order = null;
            $items = [];
            $forbidden = true;
        } else {
            // DB FETCH: Get purchased items for this order
            $it = $pdo->prepare('SELECT oi.product_id, oi.price_at_purchase, oi.quantity, p.name, p.image_path FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = :order_id');
            $it->execute([':order_id' => $orderId]);
            $items = $it->fetchAll(PDO::FETCH_ASSOC);
        }
    }
}

// Helper: Returns Bootstrap class (e.g., 'bg-success') based on status string
function statusClassFor($status)
{
    if (!$status) return 'bg-secondary';
    switch (strtolower($status)) {
        case 'pending':
            return 'bg-warning';
        case 'paid':
            return 'bg-success';
        case 'shipped':
            return 'bg-info';
        case 'cancelled':
            return 'bg-secondary';
        default:
            return 'bg-secondary';
    }
}
?>
<!doctype html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Receipts</title>
    <link rel="stylesheet" href="./styles.css" />
    <link rel="stylesheet" href="./node_modules/bootstrap-icons/font/bootstrap-icons.css">
    <link rel="shortcut icon" href="images/So Popped Logo.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="images/So Popped Logo.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="images/So Popped Logo.png" />
    <link rel="apple-touch-icon" href="images/So Popped Logo.png" />
    <meta name="theme-color" content="#0d6dfd" />
</head>

<body>
    <?php include_once __DIR__ . '/components/navbar.php'; ?>
    <main>
        <div class="container mt-5 pt-5">
            <div class="row justify-content-center">
                <div class="col-12 col-lg-10">
                    <div class="p-3 p-md-4 text-center border border-secondary-subtle rounded-3">
                        <h1 class="display-4 text-primary mb-3">Thank you for your order!</h1>

                        <?php if (!$orderId): ?>
                            <p class="text-muted mb-0">
                                No order specified. If you just placed an order, it may take a moment to appear.
                            </p>
                        <?php elseif (!$order): ?>
                            <p class="text-danger mb-0">
                                Order not found. Please contact support with details.
                            </p>
                        <?php else: ?>
                            <p class="text-muted mb-3">
                                We received your order. Below are the details.
                            </p>

                            <div class="text-start mb-3">
                                <!-- Order Header -->
                                <div class="d-flex justify-content-between mb-2">
                                    <div>
                                        <div class="h5 fw-bold text-warning">Order #<?php echo htmlspecialchars($order['id']); ?></div>
                                        <div class="small text-muted mt-1"><?php echo htmlspecialchars($order['created_at']); ?></div>
                                    </div>
                                    <div class="text-end">
                                        <div><span class="badge <?php echo statusClassFor($order['status']); ?> text-white rounded-pill px-2 py-1"><?php echo htmlspecialchars($order['status']); ?></span></div>
                                        <div class="mt-2 fw-bold fs-5">$<?php echo number_format($order['total_amount'], 2); ?></div>
                                    </div>
                                </div>

                                <!-- Order Items -->
                                <ul class="list-group list-group-flush">
                                    <?php foreach ($items as $it): ?>
                                        <li class="list-group-item d-flex justify-content-between align-items-center py-2 fs-6">
                                            <div class="text-truncate me-2 fw-semibold"><?php echo htmlspecialchars($it['name']); ?></div>
                                            <span class="badge bg-light text-dark"><?php echo (int)$it['quantity']; ?> × $<?php echo number_format($it['price_at_purchase'], 2); ?></span>
                                        </li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>
                        <?php endif; ?>

                        <div class="mt-3 d-flex flex-column flex-sm-row gap-2 justify-content-center">
                            <a class="btn btn-sm btn-warning" href="http://localhost/sopopped/orders.php">View all orders</a>
                            <a class="btn btn-sm btn-outline-primary" href="products.php">Continue shopping</a>
                            <a class="btn btn-sm btn-outline-secondary" href="cart.php">View cart</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <?php include_once __DIR__ . '/components/footer.php'; ?>
</body>

</html>