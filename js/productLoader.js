$(document).ready(function() {
    const ITEMS_PER_PAGE = 6;
    let products = [];
    let currentPage = 1;
    
    // Load products from JSON (cache-busted)
    function loadProducts() {
        // Append a timestamp to avoid stale cached responses in the browser
        const url = './js/products.json?t=' + Date.now();
        $.getJSON(url, function(data) {
            products = Array.isArray(data.products) ? data.products : [];
            // Detect duplicate ids to help debugging
            const ids = products.map(p => p.id).filter(id => typeof id !== 'undefined');
            const dupes = ids.filter((id, idx) => ids.indexOf(id) !== idx);
            if (dupes.length) {
                console.warn('[productLoader] duplicate product id(s) found:', Array.from(new Set(dupes)));
            }
            const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
            console.log('[productLoader] loaded', products.length, 'products —', totalPages, 'pages');

            if ($('.pagination').length === 0) {
                console.warn('[productLoader] pagination container not found (.pagination). Check that components/pagination.php is included on the page.');
            }

            generatePagination(); // Generate pagination first
            displayProducts(currentPage);
            updatePagination(); // Then update active states
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Failed to load products:", textStatus, errorThrown);
        });
    }
    
    // Display products for current page
    function displayProducts(page) {
        const start = (page - 1) * ITEMS_PER_PAGE;
        const pageProducts = products.slice(start, start + ITEMS_PER_PAGE);
        
        const productContainer = $('.row.row-cols-2');
        productContainer.empty();
        
        pageProducts.forEach(product => {
            // Resolve image path relative to the current page so it works whether
            // the app is served from the server root or a subfolder (/webappp)
            const rawImage = (product.image || '').toString().trim();

            // If no image provided, use an inline SVG placeholder to avoid
            // broken images in the UI and log a warning so the JSON can be fixed.
            let resolvedSrc;
            if (!rawImage) {
                console.warn('[productLoader] product missing image:', product);
                const placeholderSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280">' +
                    '<rect width="100%" height="100%" fill="#f6f6f6"/>' +
                    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9a9a9a" font-size="18">No image</text>' +
                    '</svg>'
                )}`;
                resolvedSrc = placeholderSvg;
            } else {
                const trimmed = rawImage.replace(/^\/+/, '');
                // Use the page URL as base so `new URL()` will produce the correct absolute URL
                resolvedSrc = new URL(trimmed, window.location.href).href;
            }

            // ensure price and description fields exist to avoid undefined
            const safePrice = typeof product.price !== 'undefined' ? product.price : 0;
            const safeDesc = product.description ? product.description : '';

            const productCard = `
                <div class="col">
                    <div class="card product-card mx-auto mt-2 rounded-4" data-product-id="${product.id}" data-price="${safePrice}" data-description="${safeDesc}" style="cursor: pointer;">
                        <img class="mx-auto card-img rounded-4"
                            src="${resolvedSrc}"
                            width="auto"
                            height="auto"
                            alt="${product.name}"
                        />
                        <div class="card-body text-center mx-auto">
                            <h5 class="card-title display-7">${product.name}</h5>
                        </div>
                    </div>
                </div>
            `;
            productContainer.append(productCard);
        });

        // Expose products to global scope for productModal to use
        window.__sopopped_products = products;

        // Scroll to top of products section
        $('.container-fluid.bg-body').get(0)?.scrollIntoView({ behavior: 'smooth' });
    }

    // Generate dynamic pagination based on number of products
    function generatePagination() {
        const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
        const $pagination = $('.pagination');
        
        // Clear existing page number items (keep prev/next)
        $pagination.find('.page-number').remove();
        
        // Add page number items
        for (let i = 1; i <= totalPages; i++) {
            const $pageItem = $(`
                <li class="page-item page-number" data-page="${i}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
            
            // Insert before next button
            $('#next-btn').before($pageItem);
        }
    }

    // Update pagination state (active/disabled classes)
    function updatePagination() {
        const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
        
        // Remove active/disabled classes
        $('.page-item').removeClass('active disabled');
        
        // Add active class to current page
        $(`.page-item[data-page="${currentPage}"]`).addClass('active');
        
        // Disable prev button on first page
        if (currentPage === 1) {
            $('#prev-btn').addClass('disabled');
        }
        
        // Disable next button on last page
        if (currentPage === totalPages) {
            $('#next-btn').addClass('disabled');
        }
    }

    // Handle pagination clicks
    $(document).on('click', '.page-link', function(e) {
        e.preventDefault();
        const $this = $(this);
        const pageItem = $this.parent();
        
        if (pageItem.hasClass('disabled')) return;
        
        let newPage = currentPage;
        const clickedPage = $this.data('page');
        const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
        
        if (clickedPage === 'prev') {
            newPage = Math.max(1, currentPage - 1);
        } else if (clickedPage === 'next') {
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
});