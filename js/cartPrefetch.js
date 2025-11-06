// cartPrefetch.js
// Prefetch product metadata (id, name, price, quantity) for pages that need inventory info
$(document).ready(function () {
  const url = './api/db_products.php?t=' + Date.now();

  // Centralized fetch via sopoppedFetch
  const _productsRequest = window.sopoppedFetch.json(url);

  Promise.resolve(_productsRequest).then(function (data) {
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

      // After loading products metadata, check session and load saved cart if logged in
      const _sessionReq = window.sopoppedFetch.json('./api/session_info.php');

      Promise.resolve(_sessionReq).then(function (sess) {
          if (sess && sess.logged_in) {
            const _cartLoad = window.sopoppedFetch.json('./api/cart_load.php');

            Promise.resolve(_cartLoad).then(function (resp) {
                if (resp && resp.success && Array.isArray(resp.cart)) {
                    try {
                      // Merge strategy: sum quantities for duplicate product ids so guest items are preserved
                      const localJson = localStorage.getItem('sopopped_cart_v1') || '[]';
                      const local = JSON.parse(localJson) || [];
                      const server = resp.cart || [];
                      const map = new Map();
                      server.forEach(it => {
                        const id = String(it.id);
                        const qty = Number(it.quantity ?? it.qty ?? it.qty ?? 0) || 0;
                        map.set(id, Object.assign({}, it, { id: Number(id), quantity: qty }));
                      });
                      local.forEach(it => {
                        const idRaw = it.id ?? it.product_id ?? it.productId;
                        if (idRaw === undefined || idRaw === null) return;
                        const id = String(idRaw);
                        const qty = Number(it.quantity ?? it.qty ?? it.qty ?? 0) || 0;
                        if (map.has(id)) {
                          const existing = map.get(id);
                          existing.quantity = (Number(existing.quantity || 0) || 0) + qty;
                          map.set(id, existing);
                        } else {
                          map.set(id, Object.assign({}, it, { id: Number(id), quantity: qty }));
                        }
                      });
                      const merged = Array.from(map.values());
                      localStorage.setItem('sopopped_cart_v1', JSON.stringify(merged));
                      // Notify cart renderer to refresh if available
                      try { document.dispatchEvent(new CustomEvent('sopopped-server-cart-loaded', { detail: { count: merged.length } })); } catch(e){}
                    } catch (e) {
                      console.warn('Failed to merge carts', e);
                    }
                }
            }).catch(function(err){ console.warn('[cartPrefetch] Failed to load saved cart', err); });
          }
      }).catch(function(err){ console.warn('[cartPrefetch] Failed to fetch session info', err); });
  }).catch(function(err){ console.warn('[cartPrefetch] Failed to load product metadata', err); });
});