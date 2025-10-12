<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>About Us</title>
    <link rel="stylesheet" href="./styles.css" />
  <link rel="shortcut icon" href="images/So Popped Logo.png" />
    <link
      rel="icon"
      type="image/png"
      sizes="32x32"
  href="images/So Popped Logo.png"
    />
    <link
      rel="icon"
      type="image/png"
      sizes="16x16"
  href="images/So Popped Logo.png"
    />
  <link rel="apple-touch-icon" href="images/So Popped Logo.png" />
  </head>
  <body>
  <!-- NAV (server-side include) -->
  <?php include_once __DIR__ . '/components/navbar.php'; ?>
    <main>
      <section class="py-5 border-bottom pb-2">
        <div class="container pt-5 mt-5">
          <div class="row align-items-center g-4">
            <div class="col-md-5 overflow-hidden">
              <div class="ms-md-2 ms-lg-5">
                <img
                  class="img-fluid"
                  src="images/So Popped Logo.png"
                  loading="lazy"
                  style="border-radius: 20%"
                />
              </div>
            </div>
            <div class="col-md-6 offset-md-1">
              <div class="ms-md-2 ms-lg-5">
                <span class="text-warning display-6">Our Story</span>
                <h1 class="display-4 pt-3">About Us</h1>
                <p class="lead">
                  <b>So Popped</b> began with a quiet realization:
                  <em
                    >Most of the world's flavors are still unknown to most of
                    the world.</em
                  >
                  There are flavors, passed down through generations, grown in
                  remote valleys, celebrated in local festivals—that many will
                  never experience.
                </p>
                <p class="lead">
                  Not because they're rare, but because they've never been
                  shared widely enough.
                  <mark
                    >We believe everyone deserves the chance to taste a part of
                    someone else's world. Not as a novelty. Not as a trend. But
                    as a genuine connection—to a place, a culture, a
                    moment.</mark
                  >
                </p>
                <p class="lead mb-0">
                  So we created <strong>So Popped </strong> not to sell soda,
                  but to open a door. A way for people everywhere to encounter
                  flavors that carry stories, memories, and meaning—flavors that
                  might otherwise stay hidden. <br />
                  <strong>So Popped </strong> is our invitation—to taste beyond
                  borders.
                </p>
              </div>
            </div>
            <div class="col"></div>
          </div>
        </div>
      </section>
      <!-- Contact Us -->
      <section class="px-2">
        <div class="container contact-card pt-4 mt-2 pb-4">
          <h2 class="display-4 text-center">Contact Us</h2>
          <form method="POST" action="#" id="contactForm" class="auth-form" novalidate>
            <div class="row">
              <div class="col-lg-6">
                <div class="mb- 2">
                  <label for="contactName" class="form-label"></label>
                  <input
                    id="contactName"
                    name="name"
                    type="text"
                    class="form-control"
                    placeholder="Name"
                    required
                  />
                </div>
                <div class="mb-2">
                  <label for="contactEmail" class="form-label"></label>
                  <input
                    id="contactEmail"
                    name="email"
                    type="email"
                    class="form-control"
                    placeholder="Email"
                    required
                  />
                </div>
              </div>
              <div class="col-lg-6">
                <div class="mb-2">
                  <label for="contactMessage" class="form-label"></label>
                  <textarea
                    id="contactMessage"
                    name="message"
                    class="form-control"
                    rows="4"
                    placeholder="Message"
                    required
                  ></textarea>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-end">
              <button type="submit" class="btn btn-warning">Send</button>
            </div>
            <div id="validate-msg" class="mt-3 alert alert-danger d-none"></div>
          </form>
        </div>
      </section>
    </main>
    <!-- FOOTER  -->
    <?php include_once __DIR__ . '/components/footer.php'; ?>
    <?php include_once __DIR__ . '/components/login.php'; ?>
    <?php include_once __DIR__ . '/components/signup.php'; ?>
    <script src="./node_modules/jquery/dist/jquery.min.js"></script>
    <script src="./node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
    <script src="./js/loadComponents.js"></script>
    <script src="./js/authDialogs.js"></script>
  </body>
</html>
