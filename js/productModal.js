// productModal.js
// Listens for clicks on product cards, opens the Bootstrap modal and populates it.
document.addEventListener('DOMContentLoaded', () => {
  const modalEl = document.getElementById('productModal');
  if (!modalEl) return;

  const bsModal = new bootstrap.Modal(modalEl);

  function formatPrice(v){
    // ensure number
    const n = Number(v) || 0;
    return `$${n.toFixed(2)}`;
  }

  // Populate fields
  function openProduct(product){
    const img = document.getElementById('pm-image');
    const name = document.getElementById('pm-name');
    const desc = document.getElementById('pm-desc');
    const price = document.getElementById('pm-price');
    const qty = document.getElementById('pm-qty');

    img.src = product.image ? new URL(product.image.replace(/^\/+/, ''), window.location.href).href : '';
    img.alt = product.name || 'Product';
    name.textContent = product.name || '';
    desc.textContent = product.description || '';
    price.textContent = formatPrice(product.price || 0);
    qty.value = 1;

    // store current product id on modal for handlers
    modalEl.dataset.productId = product.id;
    bsModal.show();
  }

  // Increase/decrease buttons
  document.getElementById('pm-qty-increase').addEventListener('click', ()=>{
    const n = document.getElementById('pm-qty');
    n.value = Math.max(1, Number(n.value || 0) + 1);
  });
  document.getElementById('pm-qty-decrease').addEventListener('click', ()=>{
    const n = document.getElementById('pm-qty');
    n.value = Math.max(1, Number(n.value || 0) - 1);
  });

  // Wire Add to cart / Buy now with simple events (user can replace with real handlers)
  document.getElementById('pm-add-cart').addEventListener('click', ()=>{
    const id = modalEl.dataset.productId;
    const qty = Number(document.getElementById('pm-qty').value) || 1;
    // Dispatch a custom event so site code can listen for it
    document.dispatchEvent(new CustomEvent('product-add-to-cart', { detail: { id, qty } }));
    // Close modal
    bsModal.hide();
  });

  document.getElementById('pm-buy-now').addEventListener('click', ()=>{
    const id = modalEl.dataset.productId;
    const qty = Number(document.getElementById('pm-qty').value) || 1;
    document.dispatchEvent(new CustomEvent('product-buy-now', { detail: { id, qty } }));
    // Example: redirect to cart/checkout could be implemented by listening for this event
    bsModal.hide();
  });

  // Delegate clicks on product cards created by productLoader
  document.addEventListener('click', (e)=>{
    // Only respond when a product-card (explicit class) or a card with data-product-id is clicked
    const card = e.target.closest('.product-card, .card[data-product-id]');
    if (!card) return;

    // If product id attribute exists, prefer using it
    const pid = card.dataset.productId;
    if (pid && window.__sopopped_products && Array.isArray(window.__sopopped_products)){
      const foundById = window.__sopopped_products.find(p => String(p.id) === String(pid));
      if (foundById) { openProduct(foundById); return; }
    }

    // Fallback: try to match by name or image
    const img = card.querySelector('img');
    const name = card.querySelector('.card-title')?.textContent?.trim();
    if (window.__sopopped_products && Array.isArray(window.__sopopped_products)){
      const found = window.__sopopped_products.find(p => p.name === name || (img && p.image && (new URL(p.image.replace(/^\/+/, ''), window.location.href).href === img.src)));
      if (found) { openProduct(found); return; }
    }

    // Final fallback: read fields from DOM attributes and construct product object
    const product = {
      id: card.dataset.productId || null,
      name: name || img?.alt || '',
      image: img?.src || '',
      price: card.dataset.price ? Number(card.dataset.price) : 0,
      description: card.dataset.description || ''
    };
    openProduct(product);
  });
});
