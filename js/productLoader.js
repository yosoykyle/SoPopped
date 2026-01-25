/**
 * =============================================================================
 * File: js/productLoader.js
 * Status: DEAD CODE / DEPRECATED
 * =============================================================================
 *
 * NOTE:
 * This file is NO LONGER USED.
 * Logic has been moved to Server-Side PHP (`products.php`) for better performance.
 *
 * We are keeping this file here just for reference (or as a backup), but it
 * is NOT loaded by the website.
 *
 * =============================================================================
 */

/* 
// -----------------------------------------------------------------------------
// OLD CODE BELOW - DO NOT USE
// -----------------------------------------------------------------------------

$(document).ready(function () {
  const ITEMS_PER_PAGE = 6;
  let products = [];
  let currentPage = 1;

  function loadProducts() {
    const url = `./api/db_products.php?t=${Date.now()}`;

    window.sopoppedFetch
      .json(url)
      .then(function (data) {
        const rows = Array.isArray(data?.products) ? data.products : [];
        products = rows.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          price: parseFloat(p.price) || 0,
          quantity: Number(p.quantity) || 0,
          image: p.image_path || p.image || "images/default.png",
          is_active: p.is_active || 1,
        }));

        generatePagination();
        displayProducts(currentPage);
        updatePagination();
        window.__sopopped_products = products;
      })
      .catch((err) => console.error("Loader failed", err));
  }

  function displayProducts(page) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const pageProducts = products.slice(start, start + ITEMS_PER_PAGE);
    const $container = $(".row.row-cols-2");
    
    $container.empty();

    pageProducts.forEach((product) => {
      const outOfStock = product.quantity <= 0;
      const safeName = (product.name || "Product").replace(/</g, "&lt;");
      const cardHtml = `
        <div class="col">
          <div class="card product-card mx-auto mt-2 rounded-4 ${outOfStock ? "out-of-stock" : ""}" 
               data-product-id="${String(product.id)}" 
               style="cursor:pointer; position:relative;">
            <img class="mx-auto card-img rounded-4"
              src="${product.image}"
              alt="${safeName}"
              width="auto" height="auto"
              onerror="this.src='images/default.png'" />
            <div class="card-body text-center mx-auto">
              <h5 class="card-title display-7">${safeName}</h5>
            </div>
            ${outOfStock ? `<div class="position-absolute top-0 start-0 m-2"><span class="badge bg-danger">Out of stock</span></div>` : ""}
          </div>
        </div>`;
      $container.append(cardHtml);
    });
  }

  function generatePagination() {
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const $pagination = $(".pagination");
    $pagination.find(".page-number").remove();
    for (let i = 1; i <= totalPages; i++) {
      $("#next-btn").before(
        `<li class="page-item page-number"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`
      );
    }
  }

  function updatePagination() {
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    $(".page-item").removeClass("active disabled");
    $(`.page-item a[data-page="${currentPage}"]`).parent().addClass("active");
    if (currentPage === 1) $("#prev-btn").addClass("disabled");
    if (currentPage === totalPages) $("#next-btn").addClass("disabled");
  }

  $(document).on("click", ".page-link", function (e) {
    e.preventDefault();
    if ($(this).parent().hasClass("disabled")) return;
    const pageRaw = $(this).data("page");
    let newPage = currentPage;
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

    if (pageRaw === "prev") newPage = Math.max(1, currentPage - 1);
    else if (pageRaw === "next") newPage = Math.min(totalPages, currentPage + 1);
    else newPage = parseInt(pageRaw);

    if (newPage !== currentPage) {
      currentPage = newPage;
      displayProducts(currentPage);
      updatePagination();
    }
  });

  loadProducts();
});
*/
