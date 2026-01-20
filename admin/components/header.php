<?php
// admin_navbar.php - Admin panel navbar
session_start();
$current = basename($_SERVER['SCRIPT_NAME']);
$isLoggedIn = isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
$userName = $isLoggedIn ? $_SESSION['user_name'] : '';
$userRole = $isLoggedIn ? $_SESSION['user_role'] : '';

// Redirect if not admin
if (!$isLoggedIn || $userRole !== 'admin') {
  header('Location: ../home.php');
  exit;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>So Popped Admin</title>
  <!-- CSS -->
  <link rel="stylesheet" href="../styles.css">
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="../node_modules/bootstrap-icons/font/bootstrap-icons.css">
  <link rel="shortcut icon" href="../images/So Popped Logo.png">
  <link
    rel="icon"
    type="image/png"
    sizes="32x32"
    href="../images/So Popped Logo.png" />
  <link
    rel="icon"
    type="image/png"
    sizes="16x16"
    href="../images/So Popped Logo.png" />
  <link rel="apple-touch-icon" href="../images/So Popped Logo.png" />
</head>

<body class="bg-light">
  <?php // Navbar begins below 
  ?>
  <nav class="navbar navbar-expand-md fixed-top border-bottom">
    <div class="container">
      <a class="navbar-brand d-flex align-items-center" id="<?= $current === 'dashboard.php' ? 'navHome' : '' ?>" href="dashboard.php">
        <img
          src="../images/So Popped Logo.png"
          alt="So Popped Logo"
          width="50"
          height="50"
          class="d-inline-block align-text-center" />
        <span class="ms-1 fw-bold text-primary" style="font-family: pix;">So Popped Admin</span>
      </a>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNavAltMarkup"
        aria-controls="navbarNavAltMarkup"
        aria-expanded="false"
        aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
        <div class="navbar-nav me-auto mb-2 mb-lg-0">
          <a class="nav-link <?= $current === 'dashboard.php' ? 'active text-warning' : '' ?>" aria-current="page" href="dashboard.php">Dashboard</a>
          <a class="nav-link <?= $current === 'users.php' ? 'active text-warning' : '' ?>" href="users.php">Users</a>
          <a class="nav-link <?= $current === 'products.php' ? 'active text-warning' : '' ?>" href="products.php">Products</a>
          <a class="nav-link <?= $current === 'orders.php' ? 'active text-warning' : '' ?>" href="orders.php">Orders</a>
        </div>
        <div class="d-flex">
          <?php if ($isLoggedIn): ?>
            <div class="dropdown">
              <button
                class="btn btn-warning dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false">
                <i class="bi bi-person-circle me-1"></i><?= htmlspecialchars($userName) ?>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="../home.php">Back to Store</a></li>
                <li>
                  <hr class="dropdown-divider">
                </li>
                <li><a class="dropdown-item" href="#" onclick="logout()">Logout</a></li>
              </ul>
            </div>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </nav>

  <script>
    function logout() {
      if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../api/logout.php';
      }
    }
  </script>