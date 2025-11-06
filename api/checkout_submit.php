<?php
// api/checkout_submit.php
// Accepts POST from checkout form (including hidden cart_items JSON) and creates an order + order_items.
require_once __DIR__ . '/_helpers.php';
sp_json_header();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
}

require_once __DIR__ . '/../db/sopoppedDB.php';
// Start session to identify logged-in user
sp_ensure_session();

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
    sp_json_response(['success' => false, 'errors' => $errors], 400);
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

    // If user not logged in, disallow checkout through this API
    $userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    if (!$userId) {
        // rollback any locks
    if ($pdo->inTransaction()) $pdo->rollBack();
    sp_json_response(['success' => false, 'error' => 'You need an account to proceed with checkout.'], 401);
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
        ':user_id' => $userId,
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

    // Prepare purchased IDs list
    $purchasedIds = array_map('intval', array_column($orderItemsData, 'product_id'));

    // Remove purchased items from the user's saved cart (if any) while still in transaction
    if ($userId) {
        try {
            // Lock the user's cart row for update
            $cartSelect = $pdo->prepare('SELECT cart_json FROM user_carts WHERE user_id = :uid FOR UPDATE');
            $cartSelect->execute([':uid' => $userId]);
            $cartRow = $cartSelect->fetch(PDO::FETCH_ASSOC);
            if ($cartRow && isset($cartRow['cart_json']) && $cartRow['cart_json'] !== null) {
                $saved = json_decode($cartRow['cart_json'], true) ?: [];
                $purchasedIds = array_map('intval', array_column($orderItemsData, 'product_id'));
                // Filter out purchased items
                $remaining = array_values(array_filter($saved, function($it) use ($purchasedIds) {
                    $id = isset($it['id']) ? (int)$it['id'] : null;
                    return $id === null ? true : !in_array($id, $purchasedIds, true);
                }));

                if (count($remaining) > 0) {
                    $updateCart = $pdo->prepare('UPDATE user_carts SET cart_json = :cj, updated_at = NOW() WHERE user_id = :uid');
                    $updateCart->execute([':cj' => json_encode($remaining, JSON_UNESCAPED_UNICODE), ':uid' => $userId]);
                } else {
                    // No remaining items - delete the cart row
                    $deleteCart = $pdo->prepare('DELETE FROM user_carts WHERE user_id = :uid');
                    $deleteCart->execute([':uid' => $userId]);
                }
            }
        } catch (Exception $e) {
            // If this fails, rollback will handle it below; rethrow to be caught by outer catch
            throw $e;
        }
    }

    $pdo->commit();

    // Return purchased IDs to the client so it can reconcile localStorage
    sp_json_response(['success' => true, 'order_id' => $orderId, 'purchased_ids' => $purchasedIds], 200);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 400);
}
