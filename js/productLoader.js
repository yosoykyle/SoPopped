$(document).ready(function () {
  const ITEMS_PER_PAGE = 6;
  let products = [];
  let currentPage = 1;

  // Utility to resolve relative image paths safely
  function resolveImagePath(path) {
    if (!path) return '';
    try {
      // Use origin so '/images/x.png' resolves to 'http(s)://host/images/x.png'
      return new URL(path, window.location.origin).href;
    } catch (err) {
      console.warn('[productLoader] Invalid image path:', path, err);
      return '';
    }
  }

  // Load products from DB API (cache-busted)
  function loadProducts() {
    const url = `./api/db_products.php?t=${Date.now()}`;
    $.getJSON(url)
      .done(function (data) {
        // db_products.php returns { success: true, products: [...], count: N }
        const rows = Array.isArray(data?.products) ? data.products : [];

        // Normalize API rows to the shape expected by the loader
        products = rows.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          // ensure price is a number
          price: (typeof p.price !== 'undefined' && p.price !== null) ? parseFloat(p.price) : 0,
          quantity: (typeof p.quantity !== 'undefined' && p.quantity !== null) ? Number(p.quantity) : 0,
          // Prefer absolute `image` provided by API; fall back to `image_path` or `image` from JSON
          image: p.image || p.image_path || p.image || '',
          is_active: p.is_active || 1
        }));

        // Warn on duplicate IDs
        const ids = products.map(p => p.id).filter(id => id != null);
        const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
        if (duplicates.length) {
          console.warn('[productLoader] Duplicate product ID(s):', [...new Set(duplicates)]);
        }

        const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
        console.log(`[productLoader] Loaded ${products.length} products — ${totalPages} pages`);

        if ($('.pagination').length === 0) {
          console.warn('[productLoader] Pagination container (.pagination) not found.');
        }

        generatePagination();
        displayProducts(currentPage);
        updatePagination();

        // Expose for modal (temporary bridge)
        window.__sopopped_products = products;
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Failed to load products from API:', textStatus, errorThrown);
      });
  }

  function displayProducts(page) {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const pageProducts = products.slice(start, start + ITEMS_PER_PAGE);
    const $container = $('.row.row-cols-2');
    $container.empty();

    pageProducts.forEach(product => {
      const resolvedSrc = resolveImagePath(product.image);
      const safePrice = typeof product.price !== 'undefined' ? product.price : 0;
      const safeDesc = product.description || '';
      const quantity = product.quantity || 0;
      const outOfStock = quantity <= 0;

      const cardClasses = `card product-card mx-auto mt-2 rounded-4 ${outOfStock ? 'out-of-stock' : ''}`;

      const card = `
        <div class="col">
          <div class="${cardClasses}" 
               data-product-id="${String(product.id)}" 
               data-price="${safePrice}" 
               data-description="${safeDesc}" 
               data-quantity="${quantity}" 
               style="cursor:pointer; position:relative;">
      <img class="mx-auto card-img rounded-4"
        src="${resolvedSrc}"
        alt="${product.name || 'Product'}"
        width="auto"
        height="auto" onerror="this.onerror=null;this.src='/images/image.png'" />
            <div class="card-body text-center mx-auto">
              <h5 class="card-title display-7">${product.name}</h5>
            </div>
            ${outOfStock ? `
              <div class="position-absolute top-0 start-0 m-2">
                <span class="badge bg-danger">Out of stock</span>
              </div>` : ''}
          </div>
        </div>
      `;
      $container.append(card);
    });
  }

  function generatePagination() {
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const $pagination = $('.pagination');
    $pagination.find('.page-number').remove();

    for (let i = 1; i <= totalPages; i++) {
      const $item = $(`
        <li class="page-item page-number" data-page="${i}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `);
      $('#next-btn').before($item);
    }
  }

  function updatePagination() {
    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    $('.page-item').removeClass('active disabled');

    $(`.page-item[data-page="${currentPage}"]`).addClass('active');

    if (currentPage === 1) $('#prev-btn').addClass('disabled');
    if (currentPage === totalPages) $('#next-btn').addClass('disabled');
  }

  // Pagination click handler
  $(document).on('click', '.page-link', function (e) {
    e.preventDefault();
    const $btn = $(this);
    if ($btn.parent().hasClass('disabled')) return;

    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    let newPage = currentPage;
    const page = $btn.data('page');

    if (page === 'prev') newPage = Math.max(1, currentPage - 1);
    else if (page === 'next') newPage = Math.min(totalPages, currentPage + 1);
    else newPage = parseInt(page, 10);

    if (newPage !== currentPage) {
      currentPage = newPage;
      displayProducts(currentPage);
      updatePagination();
    }
  });

  // Global image error handler
  document.addEventListener('error', function (e) {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    if (!img.closest('.product-card') && !img.closest('#productModal')) return;
    img.classList.add('image-broken');
    if (!img.alt) img.alt = 'Image not available';
  }, true);

  // Start
  loadProducts();
});