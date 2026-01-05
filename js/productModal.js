// productModal.js
// Opens product modal when a product card is clicked.
$(function() {
  const $modalEl = $('#productModal');
  if (!$modalEl.length) return;

  const bsModal = new bootstrap.Modal($modalEl[0]);

  // Utility to resolve relative image paths safely
  function resolveImagePath(path) {
    if (!path) return '';
    try {
      // If path is already absolute, return it
      if (/^https?:\/\//i.test(path)) return path;
      // Root-relative: prefix origin
      if (path.startsWith('/')) return new URL(path, window.location.origin).href;
      // Project-relative: resolve against current page URL so '/SoPopped/images/..' is preserved
      return new URL(path, window.location.href).href;
    } catch (err) {
      console.warn('[productModal] Invalid image path:', path, err);
      return '';
    }
  }

  function formatPrice(value) {
    const num = Number(value) || 0;
    return `$${num.toFixed(2)}`;
  }

  function openProduct(product) {
    const stock = typeof product.quantity !== 'undefined' ? Number(product.quantity) : 0;
    const isAvailable = stock > 0;

    // Update image
    const $img = $('#pm-image');
    // Use image_path from product, fallback to default.png
    const rawPath = product.image_path || product.image || 'images/default.png';
    const resolvedSrc = resolveImagePath(rawPath);
    if ($img.length) {
      // Log for debugging
      console.debug('[productModal] openProduct', { id: product.id, rawPath, resolvedSrc });
      
      // Remove any previous error flag before setting new image
      $img[0].removeAttribute('data-error-handled');
      
      // Attach error handler BEFORE setting src so it catches load failures
      $img.off('error').on('error', function() {
        if (!this.hasAttribute('data-error-handled')) {
          const placeholder = resolveImagePath('images/default.png');
          console.warn('[productModal] Image failed to load, using placeholder:', resolvedSrc);
          this.setAttribute('data-error-handled', 'true');
          this.src = placeholder;
        }
      });
      
      // Now set the source
      $img.attr('src', resolvedSrc);
      $img.attr('alt', product.name || 'Product');
    }

    // Update text content
    $('#pm-name').text(product.name || '');
    $('#pm-desc').text(product.description || '');
    $('#pm-price').text(formatPrice(product.price));

    // Update quantity input
    const $qtyInput = $('#pm-qty');
    $qtyInput.val(isAvailable ? 1 : 0);
    $qtyInput.attr('min', '1');
    $qtyInput.attr('max', String(Math.max(0, stock)));
    $qtyInput.attr('data-stock', String(stock));

    // Update stock count
    const $stockCountEl = $('#pm-stock-count');
    if ($stockCountEl.length) $stockCountEl.text(String(stock));

    // Toggle buttons
    const $addBtn = $('#pm-add-cart');
    const $buyBtn = $('#pm-buy-now');
    if ($addBtn.length) $addBtn.prop('disabled', !isAvailable);
    if ($buyBtn.length) $buyBtn.prop('disabled', !isAvailable);

    // Store ID for cart handlers
    $modalEl.attr('data-product-id', String(product.id));
    bsModal.show();
  }

  // Quantity controls
  const $qtyInput = $('#pm-qty');
  const $increaseBtn = $('#pm-qty-increase');
  const $decreaseBtn = $('#pm-qty-decrease');

  if ($increaseBtn.length) {
    $increaseBtn.on('click', () => {
      const stock = Number($qtyInput.attr('data-stock') || 0);
      if (stock <= 0) return;
      const current = Number($qtyInput.val()) || 0;
      $qtyInput.val(Math.min(current + 1, stock));
    });
  }

  if ($decreaseBtn.length) {
    $decreaseBtn.on('click', () => {
      const stock = Number($qtyInput.attr('data-stock') || 0);
      if (stock <= 0) {
        $qtyInput.val(0);
        return;
      }
      const current = Number($qtyInput.val()) || 1;
      $qtyInput.val(Math.max(1, current - 1));
    });
  }

  if ($qtyInput.length) {
    $qtyInput.on('input', (e) => {
      let val = Number(e.target.value);
      const stock = Number($qtyInput.attr('data-stock') || 0);

      if (stock <= 0) {
        e.target.value = 0;
        return;
      }

      if (isNaN(val) || val < 1) val = 1;
      if (val > stock) val = stock;
      e.target.value = val;
    });
  }

  // Cart actions
  function addToCart(qty) {
    const id = $modalEl.attr('data-product-id');
    if (!id) return;

    const product = { id, qty };
    const fullProduct = (window.__sopopped_products || [])
      .find(p => String(p.id) === id);

    if (fullProduct) {
      product.name = fullProduct.name;
      product.price = Number(fullProduct.price) || 0;
      product.description = fullProduct.description || '';
    }

    if (window.sopoppedCart?.add) {
      window.sopoppedCart.add(product);
    } else {
      $(document).trigger('product-add-to-cart', [{ detail: { id, qty } }]);
    }
  }

  const $addCartBtn = $('#pm-add-cart');
  const $buyNowBtn = $('#pm-buy-now');

  if ($addCartBtn.length) {
    $addCartBtn.on('click', () => {
      const qty = Number($qtyInput.val()) || 1;
      addToCart(qty);
      bsModal.hide();
    });
  }

  if ($buyNowBtn.length) {
    $buyNowBtn.on('click', () => {
      const qty = Number($qtyInput.val()) || 1;
      addToCart(qty);
      if (window.sopoppedCart?.add) {
        window.location.href = 'cart.php';
      } else {
        $(document).trigger('product-buy-now', [{ detail: { id: $modalEl.attr('data-product-id'), qty } }]);
        bsModal.hide();
      }
    });
  }

  // Click delegation: only use data-product-id + global array
  $(document).on('click', '.product-card', function(e) {
    const $card = $(this);
    const productId = $card.attr('data-product-id');
    if (!productId) {
      console.warn('[productModal] Product card missing data-product-id');
      return;
    }

    const allProducts = window.__sopopped_products || [];
    const product = allProducts.find(p => String(p.id) === productId);

    if (product) {
      openProduct(product);
    } else {
      console.error(`[productModal] Product not found with ID: ${productId}`);
    }
  });
});