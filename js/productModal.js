// productModal.js
// Opens product modal when a product card is clicked.
document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('productModal');
  if (!modalEl) return;

  const bsModal = new bootstrap.Modal(modalEl);

  // Utility to resolve relative image paths safely
  function resolveImagePath(path) {
    if (!path) return '';
    try {
      return new URL(path.replace(/^\/+/, ''), window.location.href).href;
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
    const img = document.getElementById('pm-image');
    img.src = resolveImagePath(product.image);
    img.alt = product.name || 'Product';

    // Update text content
    document.getElementById('pm-name').textContent = product.name || '';
    document.getElementById('pm-desc').textContent = product.description || '';
    document.getElementById('pm-price').textContent = formatPrice(product.price);

    // Update quantity input
    const qtyInput = document.getElementById('pm-qty');
    qtyInput.value = isAvailable ? 1 : 0;
    qtyInput.min = '1';
    qtyInput.max = String(Math.max(0, stock));
    qtyInput.setAttribute('data-stock', String(stock));

    // Update stock count
    const stockCountEl = document.getElementById('pm-stock-count');
    if (stockCountEl) stockCountEl.textContent = String(stock);

    // Toggle buttons
    const addBtn = document.getElementById('pm-add-cart');
    const buyBtn = document.getElementById('pm-buy-now');
    if (addBtn) addBtn.toggleAttribute('disabled', !isAvailable);
    if (buyBtn) buyBtn.toggleAttribute('disabled', !isAvailable);

    // Store ID for cart handlers
    modalEl.dataset.productId = String(product.id);
    bsModal.show();
  }

  // Quantity controls
  const qtyInput = document.getElementById('pm-qty');
  const increaseBtn = document.getElementById('pm-qty-increase');
  const decreaseBtn = document.getElementById('pm-qty-decrease');

  if (increaseBtn) {
    increaseBtn.addEventListener('click', () => {
      const stock = Number(qtyInput.getAttribute('data-stock') || 0);
      if (stock <= 0) return;
      const current = Number(qtyInput.value) || 0;
      qtyInput.value = Math.min(current + 1, stock);
    });
  }

  if (decreaseBtn) {
    decreaseBtn.addEventListener('click', () => {
      const stock = Number(qtyInput.getAttribute('data-stock') || 0);
      if (stock <= 0) {
        qtyInput.value = 0;
        return;
      }
      const current = Number(qtyInput.value) || 1;
      qtyInput.value = Math.max(1, current - 1);
    });
  }

  if (qtyInput) {
    qtyInput.addEventListener('input', (e) => {
      let val = Number(e.target.value);
      const stock = Number(qtyInput.getAttribute('data-stock') || 0);

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
    const id = modalEl.dataset.productId;
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
      document.dispatchEvent(new CustomEvent('product-add-to-cart', { detail: { id, qty } }));
    }
  }

  const addCartBtn = document.getElementById('pm-add-cart');
  const buyNowBtn = document.getElementById('pm-buy-now');

  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      const qty = Number(qtyInput?.value) || 1;
      addToCart(qty);
      bsModal.hide();
    });
  }

  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const qty = Number(qtyInput?.value) || 1;
      addToCart(qty);
      if (window.sopoppedCart?.add) {
        window.location.href = 'cart.php';
      } else {
        document.dispatchEvent(new CustomEvent('product-buy-now', { detail: { id: modalEl.dataset.productId, qty } }));
        bsModal.hide();
      }
    });
  }

  // Click delegation: only use data-product-id + global array
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;

    const productId = card.dataset.productId;
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