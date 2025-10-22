<?php
// order_success.php
require_once __DIR__ . '/db/sopoppedDB.php';

$orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
$order = null;
$items = [];
if ($orderId > 0) {
    // Fetch order and items
    $stmt = $pdo->prepare('SELECT id, user_id, total_amount, status, payment_method, shipping_address, created_at FROM orders WHERE id = :id');
    $stmt->execute([':id' => $orderId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($order) {
        $it = $pdo->prepare('SELECT oi.product_id, oi.price_at_purchase, oi.quantity, p.name, p.image_path FROM order_items oi JOIN products p ON p.id = oi.product_id WHERE oi.order_id = :order_id');
        $it->execute([':order_id' => $orderId]);
        $items = $it->fetchAll(PDO::FETCH_ASSOC);
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
    <link rel="shortcut icon" href="images/So Popped Logo.png" />
    <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="images/So Popped Logo.png" />
    <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="images/So Popped Logo.png" />
    <link rel="apple-touch-icon" href="images/So Popped Logo.png" />
</head>

<body>
    <?php include_once __DIR__ . '/components/navbar.php'; ?>
    <main>
        <div class="container mt-5 pt-5">
            <div class="row justify-content-center">
                <div class="col-12">
                    <div class="p-4 text-center border border-secondary-subtle rounded-3">
                        <h1 class="display-4 text-primary mb-3">Thank you for your order!</h1>

                        <?php if (!$orderId): ?>
                            <p class="lead text-body-secondary">
                                No order specified. If you just placed an order, it may take a moment to appear.
                            </p>
                        <?php elseif (!$order): ?>
                            <p class="lead text-danger">
                                Order not found. Please contact support with details.
                            </p>
                        <?php else: ?>
                            <p class="lead text-body-secondary mb-4">
                                We received your order. Below are the details.
                            </p>

                            <div class="text-start mb-4">
                                <p><strong>Order ID:</strong> <?php echo htmlspecialchars($order['id']); ?></p>
                                <p><strong>Placed:</strong> <?php echo htmlspecialchars($order['created_at']); ?></p>
                                <p><strong>Status:</strong> <?php echo htmlspecialchars($order['status']); ?></p>

                                <h2 class="h5 mt-4 mb-3">Items</h2>
                                <div class="d-flex flex-column gap-3">
                                    <?php foreach ($items as $it): ?>
                                        <div class="d-flex justify-content-between align-items-start pb-2">
                                            <div class="text-start">
                                                <div class="fw-bold"><?php echo htmlspecialchars($it['name']); ?></div>
                                                <small class="text-muted">
                                                    Qty: <?php echo (int)$it['quantity']; ?> &middot; Unit: $<?php echo number_format($it['price_at_purchase'], 2); ?>
                                                </small>
                                            </div>
                                            <div class="fw-bold">$<?php echo number_format($it['price_at_purchase'] * $it['quantity'], 2); ?></div>
                                        </div>
                                    <?php endforeach; ?>
                                </div>

                                <div class="d-flex justify-content-end mt-3 pt-2 border-top">
                                    <div class="text-end">
                                        <small class="text-muted d-block">Total</small>
                                        <div class="fw-bold fs-4">$<?php echo number_format($order['total_amount'], 2); ?></div>
                                    </div>
                                </div>
                            </div>
                        <?php endif; ?>

                        <div class="mt-4">
                            <a class="btn btn-warning" href="products.php">Continue shopping</a>
                            <a class="btn btn-outline-secondary" href="cart.php">View cart</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </main>
    <?php include_once __DIR__ . '/components/footer.php'; ?>
</body>

</html>