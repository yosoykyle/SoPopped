// cartPrefetch.js
// Prefetch product metadata (id, name, price, quantity) for pages that need inventory info
$(document).ready(function () {
  const url = './api/db_products.php?t=' + Date.now();

  $.ajax({
    url: url,
    method: 'GET',
    dataType: 'json',
    xhrFields: {
      withCredentials: true
    },
    success: function (data) {
      const rows = Array.isArray(data?.products) ? data.products : [];
      const mapped = rows.map(p => ({
        id: p.id,
        name: p.name,
        price: typeof p.price !== 'undefined' ? Number(p.price) : 0,
        quantity: typeof p.quantity !== 'undefined' ? Number(p.quantity) : 0,
        image: p.image || p.image_path || ''
      }));

      window.__sopopped_products = mapped;

      // Trigger custom event (jQuery style)
      $(document).trigger('sopopped-products-loaded', { count: mapped.length });
    },
    error: function (xhr, status, err) {
      console.warn('[cartPrefetch] Failed to load product metadata', err);
    }
  });
});