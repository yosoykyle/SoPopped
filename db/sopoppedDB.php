<?php
/**
 * db/sopoppedDB.php
 * Backwards-compatible PDO provider that uses the Database class internally.
 * This file exposes a `$pdo` variable for legacy code while centralizing
 * connection logic in the class below. It reads `config.php` if present.
 */

// Prefer config.php if present
if (file_exists(__DIR__ . '/../config.php')) {
    require_once __DIR__ . '/../config.php';
}

// Database class (moved here to keep a single self-contained provider file)
class Database {
    private $host;
    private $dbname;
    private $username;
    private $password;
    private $charset;
    private $pdo;

    public function __construct($host = null, $dbname = null, $username = null, $password = null, $charset = 'utf8mb4') {
        $this->host = $host ?? (defined('DB_HOST') ? DB_HOST : 'localhost');
        $this->dbname = $dbname ?? (defined('DB_NAME') ? DB_NAME : 'sopopped');
        $this->username = $username ?? (defined('DB_USER') ? DB_USER : 'root');
        $this->password = $password ?? (defined('DB_PASS') ? DB_PASS : '');
        $this->charset = $charset ?? (defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4');

        $dsn = "mysql:host={$this->host};dbname={$this->dbname};charset={$this->charset}";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $this->pdo = new PDO($dsn, $this->username, $this->password, $options);
    }

    public function getConnection() {
        return $this->pdo;
    }

    public function query($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetchAll($sql, $params = []) {
        return $this->query($sql, $params)->fetchAll();
    }

    public function fetchOne($sql, $params = []) {
        return $this->query($sql, $params)->fetch();
    }
}

// Instantiate and expose $pdo for legacy code
try {
    $db = new Database();
    $pdo = $db->getConnection();
} catch (PDOException $e) {
    error_log('DB connection failed: ' . $e->getMessage());
    die('Database connection failed.');
}

?>
