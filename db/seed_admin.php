<?php

/**
 * db/seed_admin.php
 *
 * Seeds the admin account into the database.
 * Usage: php db/seed_admin.php
 */

require_once __DIR__ . '/sopoppedDB.php';

try {
    $db = new Database();
    $pdo = $db->getConnection();

    $email = 'admin@admin.com';
    $password = 'admin123';

    // Check if admin user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $existingUser = $stmt->fetch();

    if ($existingUser) {
        echo "Admin account already exists.\n";
    } else {
        // Generate hash using the current environment's default algorithm
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (email, password_hash, first_name, last_name, role, is_archived) 
                VALUES (:email, :hash, 'System', 'Admin', 'admin', 0)";

        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':email' => $email,
            ':hash' => $passwordHash
        ]);

        echo "Admin account created successfully.\n";
        echo "Email: $email\n";
        echo "Password: $password\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
