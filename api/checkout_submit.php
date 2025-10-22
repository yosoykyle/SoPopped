<?php
// api/checkout_submit.php
// Accepts POST from checkout form (including hidden cart_items JSON) and creates an order + order_items.
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../db/sopoppedDB.php';

$firstName = isset($_POST['firstName']) ? trim((string)$_POST['firstName']) : '';
$lastName = isset($_POST['lastName']) ? trim((string)$_POST['lastName']) : '';
$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
$address = isset($_POST['address']) ? trim((string)$_POST['address']) : '';
$province = isset($_POST['province']) ? trim((string)$_POST['province']) : '';
$city = isset($_POST['city']) ? trim((string)$_POST['city']) : '';
$barangay = isset($_POST['barangay']) ? trim((string)$_POST['barangay']) : '';
$paymentMethod = isset($_POST['paymentMethod']) ? trim((string)$_POST['paymentMethod']) : 'cod';
$cartItemsRaw = isset($_POST['cart_items']) ? trim((string)$_POST['cart_items']) : '[]';

$errors = [];
if ($firstName === '' || mb_strlen($firstName) < 2) {
    $errors['firstName'] = 'Please enter your name (2+ characters).';
}
if ($lastName === '' || mb_strlen($lastName) < 2) {
    $errors['lastName'] = 'Please enter your name (2+ characters).';
}
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email address.';
}
if ($address === '' || mb_strlen($address) < 3) {
    $errors['address'] = 'Please enter a shipping address.';
}

// parse cart
$cart = json_decode($cartItemsRaw, true);
if (!is_array($cart) || count($cart) === 0) {
    $errors['cart'] = 'Cart is empty.';
}

if (!empty($errors)) {
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

try {
    // Start transaction
    $pdo->beginTransaction();

    // Validate products and compute total
    $total = 0.0;
    $productStmt = $pdo->prepare('SELECT id, price, quantity FROM products WHERE id = :id FOR UPDATE');
    $updateQtyStmt = $pdo->prepare('UPDATE products SET quantity = quantity - :dec WHERE id = :id');

    $orderItemsData = [];
    foreach ($cart as $item) {
        $pid = isset($item['id']) ? (int)$item['id'] : 0;
        $qty = isset($item['qty']) ? (int)$item['qty'] : (isset($item['quantity']) ? (int)$item['quantity'] : 1);
        if ($pid <= 0 || $qty <= 0) {
            throw new Exception('Invalid cart item');
        }
        $productStmt->execute([':id' => $pid]);
        $prod = $productStmt->fetch(PDO::FETCH_ASSOC);
        if (!$prod) {
            throw new Exception('Product not found: ' . $pid);
        }
        if ((int)$prod['quantity'] < $qty) {
            throw new Exception('Insufficient stock for product id ' . $pid);
        }
        $price = (float)$prod['price'];
        $subtotal = $price * $qty;
        $total += $subtotal;
        $orderItemsData[] = [
            'product_id' => $pid,
            'quantity' => $qty,
            'price_at_purchase' => $price,
        ];
    }

    // Insert order
    $insertOrder = $pdo->prepare('INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address) VALUES (:user_id, :total_amount, :status, :payment_method, :shipping_address)');
    $shipping = json_encode([
        'first_name' => $firstName,
        'last_name' => $lastName,
        'email' => $email,
        'address' => $address,
        'province' => $province,
        'city' => $city,
        'barangay' => $barangay,
    ]);
    $insertOrder->execute([
        ':user_id' => null,
        ':total_amount' => number_format($total, 2, '.', ''),
        ':status' => 'pending',
        ':payment_method' => $paymentMethod,
        ':shipping_address' => $shipping,
    ]);
    $orderId = (int)$pdo->lastInsertId();

    // Insert order items and decrement stock
    $insertItem = $pdo->prepare('INSERT INTO order_items (order_id, product_id, price_at_purchase, quantity) VALUES (:order_id, :product_id, :price_at_purchase, :quantity)');
    foreach ($orderItemsData as $it) {
        $insertItem->execute([
            ':order_id' => $orderId,
            ':product_id' => $it['product_id'],
            ':price_at_purchase' => $it['price_at_purchase'],
            ':quantity' => $it['quantity'],
        ]);
        // decrement stock
        $updateQtyStmt->execute([':dec' => $it['quantity'], ':id' => $it['product_id']]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'order_id' => $orderId]);
    exit;

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    // Do not expose detailed error in production
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}
