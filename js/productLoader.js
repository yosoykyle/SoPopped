$(document).ready(function () {
  const ITEMS_PER_PAGE = 6;
  let products = [];
  let currentPage = 1;

  // Load products from JSON (cache-busted)
  function loadProducts() {
    // Append a timestamp to avoid stale cached responses in the browser
    const url = "./js/products.json?t=" + Date.now();
    $.getJSON(url, function (data) {
      products = Array.isArray(data.products) ? data.products : [];
      // Detect duplicate ids to help debugging
      const ids = products
        .map((p) => p.id)
        .filter((id) => typeof id !== "undefined");
      const dupes = ids.filter((id, idx) => ids.indexOf(id) !== idx);
      if (dupes.length) {
        console.warn(
          "[productLoader] duplicate product id(s) found:",
          Array.from(new Set(dupes))
        );
      }
      const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
      console.log(
        "[productLoader] loaded",
        products.length,
        "products —",
        totalPages,
        "pages"
      );

      if ($(".pagination").length === 0) {
        console.warn(
          "[productLoader] pagination container not found (.pagination). Check that components/pagination.php is included on the page."
        );
      }

      generatePagination(); // Generate pagination first
      displayProducts(currentPage);
      updatePagination(); // Then update active states
    }).fail(function (jqXHR, textStatus, errorThrown) {
      console.error("Failed to load products:", textStatus, errorThrown);
    });
  }

  // Display products for current page
  function displayProducts(page) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const pageProducts = products.slice(start, start + ITEMS_PER_PAGE);

    const productContainer = $(".row.row-cols-2");
    productContainer.empty();

    pageProducts.forEach((product) => {
      // Resolve image path relative to the current page so it works whether
      // the app is served from the server root or a subfolder (/webappp)
      const rawImage = (product.image || "").toString().trim();

      // Resolve image path relative to the current page so it works whether
      // the app is served from the server root or a subfolder (/webappp)
      let resolvedSrc = "";
      if (!rawImage) {
        // no image specified for this product
        // Note: intentionally leave resolvedSrc empty so the DOM <img> will
        // behave like a normal image element when no src is provided.
      } else {
        const trimmed = rawImage.replace(/^\/+/, "");
        try {
          resolvedSrc = new URL(trimmed, window.location.href).href;
        } catch (err) {
          // If URL construction fails, log a warning and leave src empty
          console.warn("[productLoader] invalid image URL for product:", product, err);
          resolvedSrc = "";
        }
      }

      // ensure price and description fields exist to avoid undefined
      const safePrice =
        typeof product.price !== "undefined" ? product.price : 0;
      const safeDesc = product.description ? product.description : "";

      const outOfStock = Number(product.quantity || 0) <= 0;
      const cardClasses = `card product-card mx-auto mt-2 rounded-4 ${
        outOfStock ? "out-of-stock" : ""
      }`;
      const productCard = `
                <div class="col">
                    <div class="${cardClasses}" data-product-id="${
        product.id
      }" data-price="${safePrice}" data-description="${safeDesc}" data-quantity="${
        product.quantity || 0
      }" style="cursor: pointer; position:relative;">
            <img class="mx-auto card-img rounded-4"
              src="${resolvedSrc}"
              width="auto"
              height="auto"
              alt="${product.name}"
            />
                                                <div class="card-body text-center mx-auto">
                                                        <h5 class="card-title display-7">${
                                                          product.name
                                                        }</h5>
                                                </div>
                                                ${
                                                  outOfStock
                                                    ? `
                                                <div class="position-absolute top-0 start-0 m-2">
                                                    <span class="badge bg-danger">Out of stock</span>
                                                </div>
                                                `
                                                    : ""
                                                }
                    </div>
                </div>
            `;
      productContainer.append(productCard);
    });

    // Expose products to global scope for productModal to use
    window.__sopopped_products = products;

    // Scroll to top of products section
    $(".container-fluid.bg-body")
      .get(0)
      ?.scrollIntoView({ behavior: "smooth" });
  }

  // Generate dynamic pagination based on number of products
  function generatePagination() {
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const $pagination = $(".pagination");

    // Clear existing page number items (keep prev/next)
    $pagination.find(".page-number").remove();

    // Add page number items
    for (let i = 1; i <= totalPages; i++) {
      const $pageItem = $(`
                <li class="page-item page-number" data-page="${i}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);

      // Insert before next button
      $("#next-btn").before($pageItem);
    }
  }

  // Update pagination state (active/disabled classes)
  function updatePagination() {
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

    // Remove active/disabled classes
    $(".page-item").removeClass("active disabled");

    // Add active class to current page
    $(`.page-item[data-page="${currentPage}"]`).addClass("active");

    // Disable prev button on first page
    if (currentPage === 1) {
      $("#prev-btn").addClass("disabled");
    }

    // Disable next button on last page
    if (currentPage === totalPages) {
      $("#next-btn").addClass("disabled");
    }
  }

  // Handle pagination clicks
  $(document).on("click", ".page-link", function (e) {
    e.preventDefault();
    const $this = $(this);
    const pageItem = $this.parent();

    if (pageItem.hasClass("disabled")) return;

    let newPage = currentPage;
    const clickedPage = $this.data("page");
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

    if (clickedPage === "prev") {
      newPage = Math.max(1, currentPage - 1);
    } else if (clickedPage === "next") {
      newPage = Math.min(totalPages, currentPage + 1);
    } else {
      // For numbered pages
      newPage = parseInt(clickedPage);
    }

    if (newPage !== currentPage) {
      currentPage = newPage;
      displayProducts(currentPage);
      updatePagination();
    }
  });

  // Start loading products
  loadProducts();

  // Delegated image error handler: handle broken images for product cards and modal
  // This replaces inline `onerror` handlers and centralizes behavior.
  document.addEventListener(
    "error",
    function (e) {
      const tgt = e.target || e.srcElement;
      if (!tgt || tgt.tagName !== "IMG") return;
      // Only handle images inside product cards or the product modal
      if (!tgt.closest(".product-card") && !tgt.closest("#productModal")) return;
      // Mark the image as broken so CSS can target it, and ensure accessible alt text
      tgt.classList.add("image-broken");
      if (!tgt.alt) tgt.alt = "Image not available";
    },
    true // use capture to catch resource loading errors
  );
});
