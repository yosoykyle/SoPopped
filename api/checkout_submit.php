<?php

/**
 * =============================================================================
 * File: api/checkout_submit.php
 * Purpose: Process a new order (Money and Inventory).
 * =============================================================================
 * 
 * NOTE:
 * This is the most critical file in the system. It handles the actual transaction.
 * We must ensure three things happen together, or not at all (ACID):
 *   1. We have enough stock.
 *   2. The order is recorded.
 *   3. The stock is reduced.
 * 
 * If any of these fail, we "Rollback" so we don't take money for items we don't have.
 * =============================================================================
 */

require_once __DIR__ . '/_helpers.php';
sp_json_header();

// -----------------------------------------------------------------------------
// STEP 1: THE BOUNCER (Security)
// -----------------------------------------------------------------------------
// We only accept POST requests because we are CHANGING data. 
// GET requests (just visiting the link) should not create orders.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sp_json_response(['success' => false, 'error' => 'Method not allowed'], 405);
}

require_once __DIR__ . '/../db/sopoppedDB.php';
sp_ensure_session();

// -----------------------------------------------------------------------------
// STEP 2: PREPARE THE DATA (Sanitization)
// -----------------------------------------------------------------------------
// We receive raw text from the user. We must "Trim" it to remove accidental spaces.
$firstName = isset($_POST['firstName']) ? trim((string)$_POST['firstName']) : '';
$lastName = isset($_POST['lastName']) ? trim((string)$_POST['lastName']) : '';
$email = isset($_POST['email']) ? trim((string)$_POST['email']) : '';
$address = isset($_POST['address']) ? trim((string)$_POST['address']) : '';
$province = isset($_POST['province']) ? trim((string)$_POST['province']) : '';
$city = isset($_POST['city']) ? trim((string)$_POST['city']) : '';
$barangay = isset($_POST['barangay']) ? trim((string)$_POST['barangay']) : '';
$paymentMethod = isset($_POST['paymentMethod']) ? trim((string)$_POST['paymentMethod']) : 'cod';
$cartItemsRaw = isset($_POST['cart_items']) ? trim((string)$_POST['cart_items']) : '[]';

// -----------------------------------------------------------------------------
// STEP 3: VALIDATE INPUTS (Rules)
// -----------------------------------------------------------------------------
// Before we talk to the database, let's make sure the data makes sense.
$errors = [];
if ($firstName === '' || mb_strlen($firstName) < 2) $errors['firstName'] = 'Name required (2+ chars)';
if ($lastName === '' || mb_strlen($lastName) < 2) $errors['lastName'] = 'Name required (2+ chars)';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Valid email required';
if ($address === '' || mb_strlen($address) < 3) $errors['address'] = 'Address required';

// Verify the cart isn't empty
$cart = json_decode($cartItemsRaw, true);
if (!is_array($cart) || count($cart) === 0) {
    $errors['cart'] = 'Cart is empty.';
}

if (!empty($errors)) {
    sp_json_response(['success' => false, 'errors' => $errors], 400);
}

// -----------------------------------------------------------------------------
// STEP 4: START THE TRANSACTION (The Safety Lock)
// -----------------------------------------------------------------------------
try {
    // "Freeze Time": We start a transaction. 
    // Anything we do after this line isn't permanent until we say "commit".
    $pdo->beginTransaction();

    // A. CHECK STOCK (The Inventory Lock)
    $total = 0.0;

    // "FOR UPDATE" tells the database: "Lock these rows! Don't let anyone else buy them right now."
    $productStmt = $pdo->prepare('SELECT id, price, quantity FROM products WHERE id = :id FOR UPDATE');
    $updateQtyStmt = $pdo->prepare('UPDATE products SET quantity = quantity - :dec WHERE id = :id');

    $orderItemsData = [];
    foreach ($cart as $item) {
        $pid = isset($item['id']) ? (int)$item['id'] : 0;
        $qty = isset($item['qty']) ? (int)$item['qty'] : (isset($item['quantity']) ? (int)$item['quantity'] : 1);

        if ($pid <= 0 || $qty <= 0) throw new Exception('Invalid cart item');

        $productStmt->execute([':id' => $pid]);
        $prod = $productStmt->fetch(PDO::FETCH_ASSOC);

        // Does product exist?
        if (!$prod) throw new Exception('Product not found: ' . $pid);

        // Do we have enough?
        if ((int)$prod['quantity'] < $qty) throw new Exception('Insufficient stock for product id ' . $pid);

        $price = (float)$prod['price'];
        $total += $price * $qty;

        $orderItemsData[] = [
            'product_id' => $pid,
            'quantity' => $qty,
            'price_at_purchase' => $price,
        ];
    }

    // B. VERIFY USER (Identity)
    // We check this inside the transaction just to be safe, though we could do it earlier.
    $userId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
    if (!$userId) {
        // If they aren't logged in, we must ROLLBACK (Undo) any locks we created.
        if ($pdo->inTransaction()) $pdo->rollBack();
        sp_json_response(['success' => false, 'error' => 'You need an account to proceed with checkout.'], 401);
    }

    // C. CREATE THE RECEIPT (Insert Order)
    $insertOrder = $pdo->prepare('INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address) VALUES (:user_id, :total_amount, :status, :payment_method, :shipping_address)');

    // We save the address exactly as it was today (Snapshot), in case they move house later.
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

    // D. DEDUCT INVENTORY (The Update)
    // Now we physically remove the items from the stock count.
    $insertItem = $pdo->prepare('INSERT INTO order_items (order_id, product_id, price_at_purchase, quantity) VALUES (:order_id, :product_id, :price_at_purchase, :quantity)');
    foreach ($orderItemsData as $it) {
        // 1. Link item to Order
        $insertItem->execute([
            ':order_id' => $orderId,
            ':product_id' => $it['product_id'],
            ':price_at_purchase' => $it['price_at_purchase'],
            ':quantity' => $it['quantity'],
        ]);
        // 2. Reduce Stock
        $updateQtyStmt->execute([':dec' => $it['quantity'], ':id' => $it['product_id']]);
    }

    // E. CLEAN UP (Clear Cart)
    // The user has bought these items. We should remove them from their saved cart.
    $purchasedIds = array_map('intval', array_column($orderItemsData, 'product_id'));
    if ($userId) {
        try {
            $cartSelect = $pdo->prepare('SELECT cart_json FROM user_carts WHERE user_id = :uid FOR UPDATE');
            $cartSelect->execute([':uid' => $userId]);
            $cartRow = $cartSelect->fetch(PDO::FETCH_ASSOC);

            if ($cartRow && !empty($cartRow['cart_json'])) {
                $saved = json_decode($cartRow['cart_json'], true) ?: [];
                // Keep only items that were NOT part of this order
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
        } catch (Exception $e) {
            /* If clearing the cart fails, it's not fatal. The order is strict, the cart is just convenience. */
        }
    }

    // -----------------------------------------------------------------------------
    // STEP 5: COMMIT (Save Forever)
    // -----------------------------------------------------------------------------
    $pdo->commit();

    sp_json_response(['success' => true, 'order_id' => $orderId, 'purchased_ids' => $purchasedIds], 200);
} catch (Exception $e) {
    // -----------------------------------------------------------------------------
    // ROLLBACK (Undo Button)
    // -----------------------------------------------------------------------------
    // If anything above failed (e.g., Error: "Insufficient Stock"), we undo everything.
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log("Checkout error: " . $e->getMessage());
    sp_json_response(['success' => false, 'error' => $e->getMessage()], 400);
}
