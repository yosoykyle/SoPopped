<?php
$host = 'localhost';
$db   = 'sopopped';
$user = 'root';
$pass = '@59532258968'; //@59532258968
$charset = 'utf8mb4';
$schemaFile = __DIR__ . '/USE THIS SCHEMA.sql';
$dataFile = __DIR__ . '/sample_products.sql';

$pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, $options);
$pdo->exec(file_get_contents($schemaFile));

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$pdo = new PDO($dsn, $user, $pass, $options);

if (file_exists($dataFile)) {
    $pdo->exec(file_get_contents($dataFile));
}
?>