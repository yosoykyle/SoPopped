<?php

/**
 * =============================================================================
 * File: api/checkout_submit.php
 * Purpose: Process a new order (checkout).
 * =============================================================================
 * 
 * Logic overview:
 *   1. Validate inputs (User, Shipping, Cart).
 *   2. Start DB Transaction.
 *   3. Lock and Verify Product Stock.
 *   4. Create Order and Order Items.
 *   5. Deduct Stock.
 *   6. Update/Clear User's Saved Cart.
 *   7. Commit Transaction.
 * 
 * Inputs (POST):
 *   - firstName, lastName, email, address, province, city, barangay
 *   - paymentMethod
 *   - cart_items (JSON string of items to purchase)
 * 
 * Response:
 *   { "success": true, "order_id": 123, "purchased_ids": [1, 2] }
 *   { "success": false, "error": "..." }
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';
sp_json_header();

// 1. Method & Auth Check
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
}

require_once __DIR__ . '/../db/sopoppedDB.php';
sp_ensure_session();

// 2. Data Sanitization
$firstName = isset($_POST['firstName']) ? trim((string)$_POST['firstName']) : '';
$lastName = isset($_POST['lastName']) ? trim((string)$_POST['lastName']) : '';
$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
$address = isset($_POST['address']) ? trim((string)$_POST['address']) : '';
$province = isset($_POST['province']) ? trim((string)$_POST['province']) : '';
$city = isset($_POST['city']) ? trim((string)$_POST['city']) : '';
$barangay = isset($_POST['barangay']) ? trim((string)$_POST['barangay']) : '';
$paymentMethod = isset($_POST['paymentMethod']) ? trim((string)$_POST['paymentMethod']) : 'cod';
$cartItemsRaw = isset($_POST['cart_items']) ? trim((string)$_POST['cart_items']) : '[]';

// 3. Validation
$errors = [];
if ($firstName === '' || mb_strlen($firstName) < 2) $errors['firstName'] = 'Name required (2+ chars)';
if ($lastName === '' || mb_strlen($lastName) < 2) $errors['lastName'] = 'Name required (2+ chars)';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Valid email required';
if ($address === '' || mb_strlen($address) < 3) $errors['address'] = 'Address required';

$cart = json_decode($cartItemsRaw, true);
if (!is_array($cart) || count($cart) === 0) {
    $errors['cart'] = 'Cart is empty.';
}

if (!empty($errors)) {
    sp_json_response(['success' => false, 'errors' => $errors], 400);
}

// 4. Order Processing (Transaction)
try {
    $pdo->beginTransaction();

    // A. Verify Stock & Calc Total
    $total = 0.0;
    $productStmt = $pdo->prepare('SELECT id, price, quantity FROM products WHERE id = :id FOR UPDATE');
    $updateQtyStmt = $pdo->prepare('UPDATE products SET quantity = quantity - :dec WHERE id = :id');

    $orderItemsData = [];
    foreach ($cart as $item) {
        $pid = isset($item['id']) ? (int)$item['id'] : 0;
        $qty = isset($item['qty']) ? (int)$item['qty'] : (isset($item['quantity']) ? (int)$item['quantity'] : 1);

        if ($pid <= 0 || $qty <= 0) throw new Exception('Invalid cart item');

        $productStmt->execute([':id' => $pid]);
        $prod = $productStmt->fetch(PDO::FETCH_ASSOC);

        if (!$prod) throw new Exception('Product not found: ' . $pid);
        if ((int)$prod['quantity'] < $qty) throw new Exception('Insufficient stock for product id ' . $pid);

        $price = (float)$prod['price'];
        $total += $price * $qty;

        $orderItemsData[] = [
            'product_id' => $pid,
            'quantity' => $qty,
            'price_at_purchase' => $price,
        ];
    }

    // B. Check Auth (Requirement)
    $userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    if (!$userId) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        sp_json_response(['success' => false, 'error' => 'You need an account to proceed with checkout.'], 401);
    }

    // C. Insert Order
    $insertOrder = $pdo->prepare('INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address) VALUES (:user_id, :total_amount, :status, :payment_method, :shipping_address)');
    $shipping = json_encode([
        'first_name' => $firstName,
        'last_name' => $lastName,
        'email' => $email,
        'address' => $address,
        'province' => $province,
        'city' => $city,
        'barangay' => $barangay
    ]);

    $insertOrder->execute([
        ':user_id' => $userId,
        ':total_amount' => number_format($total, 2, '.', ''),
        ':status' => 'pending',
        ':payment_method' => $paymentMethod,
        ':shipping_address' => $shipping,
    ]);
    $orderId = (int)$pdo->lastInsertId();

    // D. Insert Items & Decrement Stock
    $insertItem = $pdo->prepare('INSERT INTO order_items (order_id, product_id, price_at_purchase, quantity) VALUES (:order_id, :product_id, :price_at_purchase, :quantity)');
    foreach ($orderItemsData as $it) {
        $insertItem->execute([
            ':order_id' => $orderId,
            ':product_id' => $it['product_id'],
            ':price_at_purchase' => $it['price_at_purchase'],
            ':quantity' => $it['quantity'],
        ]);
        $updateQtyStmt->execute([':dec' => $it['quantity'], ':id' => $it['product_id']]);
    }

    // E. Clear Purchased Items from Saved Cart
    $purchasedIds = array_map('intval', array_column($orderItemsData, 'product_id'));
    if ($userId) {
        try {
            $cartSelect = $pdo->prepare('SELECT cart_json FROM user_carts WHERE user_id = :uid FOR UPDATE');
            $cartSelect->execute([':uid' => $userId]);
            $cartRow = $cartSelect->fetch(PDO::FETCH_ASSOC);

            if ($cartRow && !empty($cartRow['cart_json'])) {
                $saved = json_decode($cartRow['cart_json'], true) ?: [];
                $remaining = array_values(array_filter($saved, function ($it) use ($purchasedIds) {
                    $id = isset($it['id']) ? (int)$it['id'] : null;
                    return $id === null ? true : !in_array($id, $purchasedIds, true);
                }));

                if (count($remaining) > 0) {
                    $update = $pdo->prepare('UPDATE user_carts SET cart_json = :cj, updated_at = NOW() WHERE user_id = :uid');
                    $update->execute([':cj' => json_encode($remaining, JSON_UNESCAPED_UNICODE), ':uid' => $userId]);
                } else {
                    $del = $pdo->prepare('DELETE FROM user_carts WHERE user_id = :uid');
                    $del->execute([':uid' => $userId]);
                }
            }
        } catch (Exception $e) { /* Allow order to proceed even if cart clear fails */
        }
    }

    $pdo->commit();

    sp_json_response(['success' => true, 'order_id' => $orderId, 'purchased_ids' => $purchasedIds], 200);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("Checkout error: " . $e->getMessage());
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 400);
}
