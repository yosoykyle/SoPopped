<?php

/**
 * =============================================================================
 * File: db/sopoppedDB.php
 * Purpose: The "Gatekeeper" (Connection Provider).
 * =============================================================================
 *
 * NOTE:
 * Every time a PHP page wants to talk to the database, it needs a "Connection".
 * Creating a connection is like dialing a phone number - it takes time.
 * 
 * This file does two things:
 *   1. It reads the phone number from `config.php`.
 *   2. It dials the number and hands the open line (`$pdo`) to your code.
 * 
 * It wraps this in a Class so we can easily reuse it everywhere.
 * =============================================================================
 */

// 1. Get the Credentials
if (file_exists(__DIR__ . '/../config.php')) {
    require_once __DIR__ . '/../config.php';
}

// 2. The Connection Class
class Database
{
    private $host;
    private $dbname;
    private $username;
    private $password;
    private $charset;
    private $pdo; // This will hold the active connection "Handle"

    public function __construct($host = null, $dbname = null, $username = null, $password = null, $charset = 'utf8mb4')
    {
        // Use arguments if provided, otherwise fallback to Config constants
        $this->host = $host ?? (defined('DB_HOST') ? DB_HOST : 'localhost');
        $this->dbname = $dbname ?? (defined('DB_NAME') ? DB_NAME : 'sopopped');
        $this->username = $username ?? (defined('DB_USER') ? DB_USER : 'root');
        $this->password = $password ?? (defined('DB_PASS') ? DB_PASS : '');
        $this->charset = $charset ?? (defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4');

        // The DSN (Data Source Name) is the "Phone Number" string
        $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset={$this->charset}";

        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // Throw errors (Don't stay silent)
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Return results as Arrays (Key => Value)
            PDO::ATTR_EMULATE_PREPARES => false, // Use real SQL security, not fake simulation
        ];

        // Dial the number!
        $this->pdo = new PDO($dsn, $this->username, $this->password, $options);
    }

    // Give the open line to whoever asks
    public function getConnection()
    {
        return $this->pdo;
    }

    // Helper: Prepare -> Execute (Safe Query)
    public function query($sql, $params = [])
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    // Helper: Get multiple rows
    public function fetchAll($sql, $params = [])
    {
        return $this->query($sql, $params)->fetchAll();
    }

    // Helper: Get single row
    public function fetchOne($sql, $params = [])
    {
        return $this->query($sql, $params)->fetch();
    }
}

// 3. Auto-Connect (For Legacy/Simple usage)
// When you include this file, `$pdo` becomes available immediately.
try {
    $db = new Database();
    $pdo = $db->getConnection();
} catch (PDOException $e) {
    // If we can't connect, stop everything.
    error_log('DB connection failed: ' . $e->getMessage());
    die('Database connection failed.');
}
