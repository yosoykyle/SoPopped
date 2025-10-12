// Simple cart interactions: increase/decrease qty, remove item, update totals
document.addEventListener('DOMContentLoaded', () => {
  const cart = document.getElementById('cart-items');
  if (!cart) return;

  function parsePrice(v){
    return Number(String(v).replace(/[^0-9.-]+/g, '')) || 0;
  }

  function updateSubtotalForItem(li){
    const price = parseFloat(li.dataset.price || 0);
    const qtyInput = li.querySelector('.item-qty');
    const qty = Math.max(1, Number(qtyInput.value) || 1);
    const subtotalEl = li.querySelector('.item-subtotal');
    const subtotal = price * qty;
    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    updateTotal();
  }

  function updateTotal(){
    const items = cart.querySelectorAll('li.list-group-item[data-product-id]');
    let total = 0;
    items.forEach(li => {
      const subtotalText = li.querySelector('.item-subtotal')?.textContent || '';
      total += parsePrice(subtotalText);
    });
    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    const countEl = document.querySelector('.flavorCoutCart');
    if (countEl) countEl.textContent = items.length;
  }

  // Delegate clicks: increase/decrease/remove
  cart.addEventListener('click', (e) => {
    const inc = e.target.closest('.btn-increase');
    const dec = e.target.closest('.btn-decrease');
    const rem = e.target.closest('.btn-remove');
    if (inc) {
      const li = inc.closest('li.list-group-item');
      const input = li.querySelector('.item-qty');
      input.value = Math.max(1, Number(input.value || 0) + 1);
      updateSubtotalForItem(li);
    } else if (dec) {
      const li = dec.closest('li.list-group-item');
      const input = li.querySelector('.item-qty');
      input.value = Math.max(1, Number(input.value || 0) - 1);
      updateSubtotalForItem(li);
    } else if (rem) {
      const li = rem.closest('li.list-group-item');
      li.remove();
      updateTotal();
    }
  });

  // Listen for manual qty changes
  cart.addEventListener('change', (e) => {
    if (e.target.classList.contains('item-qty')){
      const li = e.target.closest('li.list-group-item');
      if (!li) return;
      // sanitize
      e.target.value = Math.max(1, Number(e.target.value) || 1);
      updateSubtotalForItem(li);
    }
  });

  // Initialize totals
  document.querySelectorAll('#cart-items li.list-group-item[data-product-id]').forEach(li => updateSubtotalForItem(li));
});
