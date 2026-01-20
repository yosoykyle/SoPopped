/**
 * =============================================================================
 * File: js/productLoader.js
 * Purpose: Load and display products with pagination on the products page.
 * =============================================================================
 *
 * This module handles:
 *   - Fetching products from the database API
 *   - Rendering product cards in a responsive grid
 *   - Managing pagination (6 items per page)
 *   - Handling image load errors with fallback
 *   - Exposing products globally for the product modal
 *
 * Target Elements:
 *   - .row.row-cols-2: Product card grid container
 *   - .pagination: Pagination controls container
 *   - #prev-btn, #next-btn: Navigation buttons
 *
 * Global Variables Set:
 *   - window.__sopopped_products: Array of all loaded products
 *
 * Dependencies:
 *   - jQuery
 *   - fetchHelper.js (sopoppedFetch.json)
 *   - Bootstrap (for grid layout)
 *
 * API Endpoint:
 *   - GET ./api/db_products.php
 * =============================================================================
 */

$(document).ready(function () {
  // ---------------------------------------------------------------------------
  // 1. CONFIGURATION
  // ---------------------------------------------------------------------------

  const ITEMS_PER_PAGE = 6;
  let products = [];
  let currentPage = 1;

  // ---------------------------------------------------------------------------
  // 2. DATA LOADING
  // ---------------------------------------------------------------------------

  /**
   * Load products from the database API.
   * Normalizes API response and triggers initial render.
   */
  function loadProducts() {
    // Cache-bust URL
    const url = `./api/db_products.php?t=${Date.now()}`;
    const _prodReq = window.sopoppedFetch.json(url);

    Promise.resolve(_prodReq)
      .then(function (data) {
        // Normalize API response (handles { success, products, count } format)
        const rows = Array.isArray(data?.products) ? data.products : [];

        products = rows.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price:
            typeof p.price !== "undefined" && p.price !== null
              ? parseFloat(p.price)
              : 0,
          quantity:
            typeof p.quantity !== "undefined" && p.quantity !== null
              ? Number(p.quantity)
              : 0,
          image: p.image_path || p.image || "images/default.png",
          is_active: p.is_active || 1,
        }));

        // Warn about duplicate product IDs
        const ids = products.map((p) => p.id).filter((id) => id != null);
        const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
        if (duplicates.length) {
          console.warn("[productLoader] Duplicate product ID(s):", [
            ...new Set(duplicates),
          ]);
        }

        const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
        console.log(
          `[productLoader] Loaded ${products.length} products — ${totalPages} pages`,
        );

        if ($(".pagination").length === 0) {
          console.warn(
            "[productLoader] Pagination container (.pagination) not found.",
          );
        }

        // Initial render
        generatePagination();
        displayProducts(currentPage);
        updatePagination();

        // Expose for product modal
        window.__sopopped_products = products;
      })
      .catch(function (err) {
        console.error("Failed to load products from API:", err);
      });
  }

  // ---------------------------------------------------------------------------
  // 3. PRODUCT CARD RENDERING
  // ---------------------------------------------------------------------------

  /**
   * Display products for the specified page.
   * @param {number} page - Page number to display (1-indexed)
   */
  function displayProducts(page) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const pageProducts = products.slice(start, start + ITEMS_PER_PAGE);
    const $container = $(".row.row-cols-2");
    $container.empty();

    pageProducts.forEach((product) => {
      const imgSrc = product.image || "images/default.png";
      const safePrice =
        typeof product.price !== "undefined" ? product.price : 0;
      const safeDesc = (product.description || "").replace(/"/g, "&quot;");
      const safeName = (product.name || "Product").replace(/"/g, "&quot;");
      const quantity = product.quantity || 0;
      const outOfStock = quantity <= 0;

      const cardClasses = `card product-card mx-auto mt-2 rounded-4 ${
        outOfStock ? "out-of-stock" : ""
      }`;

      const $card = $(`
        <div class="col">
          <div class="${cardClasses}" 
               data-product-id="${String(product.id)}" 
               data-price="${safePrice}" 
               data-description="${safeDesc}" 
               data-quantity="${quantity}" 
               style="cursor:pointer; position:relative;">
            <img class="mx-auto card-img rounded-4"
              src="${imgSrc}"
              alt="${safeName}"
              width="auto"
              height="auto"
              data-product-name="${safeName}" />
            <div class="card-body text-center mx-auto">
              <h5 class="card-title display-7">${product.name}</h5>
            </div>
            ${
              outOfStock
                ? `
              <div class="position-absolute top-0 start-0 m-2">
                <span class="badge bg-danger">Out of stock</span>
              </div>`
                : ""
            }
          </div>
        </div>
      `);

      // Handle broken images
      $card.find("img").on("error", function () {
        if (!this.hasAttribute("data-error-handled")) {
          console.warn(
            "[productLoader] Image failed to load, using placeholder:",
            this.src,
          );
          this.setAttribute("data-error-handled", "true");
          this.src = "images/default.png";
        }
      });

      $container.append($card);
    });
  }

  // ---------------------------------------------------------------------------
  // 4. PAGINATION
  // ---------------------------------------------------------------------------

  /**
   * Generate pagination buttons based on total pages.
   */
  function generatePagination() {
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const $pagination = $(".pagination");
    $pagination.find(".page-number").remove();

    for (let i = 1; i <= totalPages; i++) {
      const $item = $(`
        <li class="page-item page-number" data-page="${i}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `);
      $("#next-btn").before($item);
    }
  }

  /**
   * Update active/disabled states of pagination buttons.
   */
  function updatePagination() {
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    $(".page-item").removeClass("active disabled");

    $(`.page-item[data-page="${currentPage}"]`).addClass("active");

    if (currentPage === 1) $("#prev-btn").addClass("disabled");
    if (currentPage === totalPages) $("#next-btn").addClass("disabled");
  }

  // ---------------------------------------------------------------------------
  // 5. EVENT HANDLERS
  // ---------------------------------------------------------------------------

  /**
   * Handle pagination link clicks.
   */
  $(document).on("click", ".page-link", function (e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.parent().hasClass("disabled")) return;

    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    let newPage = currentPage;
    const page = $btn.data("page");

    if (page === "prev") newPage = Math.max(1, currentPage - 1);
    else if (page === "next") newPage = Math.min(totalPages, currentPage + 1);
    else newPage = parseInt(page, 10);

    if (newPage !== currentPage) {
      currentPage = newPage;
      displayProducts(currentPage);
      updatePagination();
    }
  });

  /**
   * Global error handler for product images.
   * Catches errors in delegated manner for dynamically added images.
   */
  document.addEventListener(
    "error",
    function (e) {
      const img = e.target;
      if (img.tagName !== "IMG") return;
      if (!img.closest(".product-card") && !img.closest("#productModal"))
        return;
      img.classList.add("image-broken");
      if (!img.alt) img.alt = "Image not available";
    },
    true,
  );

  // ---------------------------------------------------------------------------
  // 6. INITIALIZATION
  // ---------------------------------------------------------------------------

  loadProducts();
});
