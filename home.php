<!-- 
  File: home.php
  Description: The main landing page of the So Popped application.
  Flow:
  1. Includes global styles and fonts.
  2. Renders the Navigation Bar (server-side include).
  3. Displays a Hero Section with brand messaging.
  4. Shows a "Featured Flavors" grid to attract users.
  5. Includes the Footer and Auth Modals.
-->
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>So Popped</title>
  <link rel="stylesheet" href="./styles.css" />
  <link rel="stylesheet" href="./node_modules/bootstrap-icons/font/bootstrap-icons.css">
  <link rel="shortcut icon" href="images/So Popped Logo.png" />
  <link
    rel="icon"
    type="image/png"
    sizes="32x32"
    href="images/So Popped Logo.png" />
  <link
    rel="icon"
    type="image/png"
    sizes="16x16"
    href="images/So Popped Logo.png" />
  <link rel="apple-touch-icon" href="images/So Popped Logo.png" />
  <meta name="theme-color" content="#0d6dfd" />
</head>

<body>
  <!-- 
    COMPONENT: Navigation Bar 
    - Handles dynamic link highlighting based on current page.
    - Displays User Dropdown if logged in, otherwise Login button.
  -->
  <?php include_once __DIR__ . '/components/navbar.php'; ?>

  <!-- 
    SECTION: Hero 
    - Main visual entry point.
    - Contains "Shop now" and "About Us" Call-to-Actions (CTAs).
  -->
  <header>
    <div
      class="container px-4 pt-5 mt-5 text-center border-bottom bg-body">
      <h1 class="display-4">
        Flavor Has No Borders
      </h1>
      <div class="col-lg-6 mx-auto">
        <p class="lead mb-4">
          Behind every spice, fruit, flower, or root is a place. <br />
          A people. A story. We don’t invent flavors. <br />
          We listen to the world—and let it speak through every can.
        </p>
        <div class="d-grid gap-2 d-sm-flex justify-content-sm-center mb-5">
          <a href="products.php" class="btn btn-warning btn-lg px-4 me-sm-3">
            Shop now
          </a>
          <a href="aboutUs.php" class="btn btn-outline-primary btn-lg px-4">
            About Us
          </a>
        </div>
      </div>
      <div class="overflow-hidden" style="max-height: 50vh">
        <div class="container py-20">
          <img
            src="images/hero.png"
            class="img-fluid rounded-3 mb-4"
            alt="Example image"
            width="800"
            height="500"
            loading="lazy" />
        </div>
      </div>
    </div>
  </header>
  <!-- 
    SECTION: Featured Flavors
    - Static showcase of key products to entice users.
    - Uses a responsive grid layout.
  -->
  <main>
    <div class="container bg-body" id="custom-cards">
      <h1 class="display-6 pt-5 pb-1 text-center border-bottom fw-bolder text-warning">
        Featured Flavors
      </h1>
      <div class="row row-cols-2 row-cols-lg-4 g-3 py-4">
        <div class="col">
          <div
            class="card featured-flavor rounded-3 aspect-ratio-1x1 overflow-hidden">
            <img
              src="images/fc1.png"
              class="card-img"
              alt="Flavor Image"
              style="object-fit: cover" />
            <div
              class="card-img-overlay d-flex flex-column justify-content-top p-4">
              <h5 class="card-title display-7 fw-semibold text-white">
                Hawthorn
              </h5>
            </div>
          </div>
        </div>

        <div class="col">
          <div
            class="card featured-flavor rounded-3 aspect-ratio-1x1 overflow-hidden">
            <img
              src="images/pc12.png"
              class="card-img"
              alt="Flavor Image"
              style="object-fit: cover" />
            <div
              class="card-img-overlay d-flex fw-semibold justify-content-top p-4">
              <h5 class="card-title display-7 fw-bold text-white">
                Lavander
              </h5>
            </div>
          </div>
        </div>

        <div class="col">
          <div
            class="card featured-flavor rounded-3 aspect-ratio-1x1 overflow-hidden">
            <img
              src="images/pc14.png"
              class="card-img"
              alt="Flavor Image"
              style="object-fit: cover" />
            <div
              class="card-img-overlay d-flex flex-column justify-content-top p-4">
              <h5 class="card-title display-7 fw-semibold text-white">
                Chamomile
              </h5>
            </div>
          </div>
        </div>

        <div class="col">
          <div
            class="card featured-flavor rounded-3 aspect-ratio-1x1 overflow-hidden">
            <img
              src="images/fc4.png"
              class="card-img"
              alt="Flavor Image"
              style="object-fit: cover" />
            <div
              class="card-img-overlay d-flex flex-column justify-content-top p-4">
              <h5 class="card-title display-7 fw-semibold text-white">
                Star Fruit
              </h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
  <?php include_once __DIR__ . '/components/footer.php'; ?>
  <?php include_once __DIR__ . '/components/login.php'; ?>
  <?php include_once __DIR__ . '/components/signup.php'; ?>
</body>

</html>