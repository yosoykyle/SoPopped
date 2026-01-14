<?php
/**
 * config.php
 * Project configuration file. Contains database credentials used by
 * `db/sopoppedDB.php` and `classes/Database.php`.
 *
 * WARNING: This file contains secrets. Add it to .gitignore in your repo
 * and do NOT commit credentials to a public repository. A sample is provided
 * as `config.php.example` if you prefer to keep an example in version control.
 */

// Database settings
define('DB_HOST', 'localhost');
define('DB_NAME', 'sopopped');
define('DB_USER', 'root');
define('DB_PASS', 'P@ssword#123'); // Change this to your actual password
define('DB_CHARSET', 'utf8mb4');

// You can override these with environment variables or a local-only file
// e.g., create `config.local.php` and include it here instead.

?>
