// Cart manager using localStorage
document.addEventListener('DOMContentLoaded', () => {
  const CART_KEY = 'sopopped_cart_v1';
  const cartList = document.getElementById('cart-items');
  const emptyCard = document.querySelector('.emptyCart');
  const cartSummaryBlock = document.getElementById('cart-summary');
  const cartSummaryCol = document.getElementById('cart-summary-col');
  const billingFormCol = document.getElementById('billing-col');
  const hasCartDom = Boolean(cartList);

  function readCart(){
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch(e){ return []; }
  }

  function writeCart(items){
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  function findItem(items, id){
    return items.find(i => String(i.id) === String(id));
  }

  function render(){
    const items = readCart();
    if (hasCartDom) cartList.innerHTML = '';
    if (!items.length){
      // show empty message
      if (emptyCard) emptyCard.classList.remove('d-none');
      if (cartSummaryBlock) cartSummaryBlock.classList.add('d-none');
      if (cartSummaryCol) cartSummaryCol.classList.add('d-none');
      if (billingFormCol) billingFormCol.classList.add('d-none');
      const countEl = document.querySelector('.flavorCoutCart'); if (countEl) countEl.textContent = '0';
      // dispatch event so other UI can react
      try{ document.dispatchEvent(new CustomEvent('cart-changed', { detail: { count: 0, total: 0 } })); }catch(e){}
      return;
    }

  if (emptyCard) emptyCard.classList.add('d-none');
  if (cartSummaryBlock) cartSummaryBlock.classList.remove('d-none');
  if (cartSummaryCol) cartSummaryCol.classList.remove('d-none');
  if (billingFormCol) billingFormCol.classList.remove('d-none');

    let total = 0;
    items.forEach(prod => {
      const li = document.createElement('li');
  // Use grid inside the list item; avoid making the li a flex container to prevent overlap
  li.className = 'list-group-item lh-sm py-3';
      li.dataset.productId = prod.id;
      li.dataset.price = prod.price;
      li.innerHTML = `<div class="row align-items-center gx-3">
  <div class="col-12 col-md-7">
    <h6 class="my-0 cart-prod-name" title="${escapeHtml(prod.name)}">${escapeHtml(prod.name)}</h6>
    <small class="text-body-secondary d-block cart-prod-desc text-truncate" style="max-width: 100%; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(prod.description || '')}</small>
  </div>
  <div class="col-12 col-md-5">
    <div class="d-flex justify-content-md-end align-items-center gap-3 mt-2 mt-md-0">
      <div class="input-group input-group-sm cart-qty-group flex-shrink-0" style="width: fit-content; max-width: 120px;">
        <button class="btn btn-outline-secondary btn-decrease" type="button">-</button>
        <input type="number" class="form-control text-center item-qty" value="${prod.qty}" min="1" style="width: 50px;" />
        <button class="btn btn-outline-secondary btn-increase" type="button">+</button>
      </div>
      <div class="text-end flex-shrink-0">
        <div class="small text-muted">Subtotal</div>
        <div class="fw-bold item-subtotal">$${(prod.price * prod.qty).toFixed(2)}</div>
      </div>
      <button class="btn btn-sm btn-link text-danger btn-remove flex-shrink-0" type="button">Remove</button>
    </div>
  </div>
</div>
      `;
      if (hasCartDom) cartList.appendChild(li);
      total += prod.price * prod.qty;
    });

    const totalEl = document.getElementById('cart-total');
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    const countEl = document.querySelector('.flavorCoutCart'); if (countEl) countEl.textContent = String(items.length);
    // Dispatch a cart-changed event so other UI can react (badge in navbar, etc)
    try{ document.dispatchEvent(new CustomEvent('cart-changed', { detail: { count: items.length, total } })); }catch(e){}
  }

  function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // Public api: add product
  window.sopoppedCart = {
    add(product){
      const items = readCart();
      const existing = findItem(items, product.id);
      if (existing){ existing.qty = Math.max(1, existing.qty + (product.qty || 1)); }
      else items.push({ id: product.id, name: product.name, description: product.description||'', price: Number(product.price||0), qty: product.qty || 1 });
      writeCart(items); render();
    },
    remove(id){
      let items = readCart(); items = items.filter(i => String(i.id) !== String(id)); writeCart(items); render();
    },
    setQty(id, qty){
      const items = readCart(); const it = findItem(items, id); if (it){ it.qty = Math.max(1, Number(qty)||1); writeCart(items); render(); }
    },
    clear(){ localStorage.removeItem(CART_KEY); render(); },
    getCount(){ return readCart().length; }
  };

  // Delegate clicks on cart list (only attach if cart DOM exists)
  if (hasCartDom) {
    cartList.addEventListener('click', (e)=>{
      const inc = e.target.closest('.btn-increase');
      const dec = e.target.closest('.btn-decrease');
      const rem = e.target.closest('.btn-remove');
      if (inc){ const li = inc.closest('li'); const id = li.dataset.productId; const items = readCart(); const it = findItem(items,id); if (it){ it.qty++; writeCart(items); render(); } }
      if (dec){ const li = dec.closest('li'); const id = li.dataset.productId; const items = readCart(); const it = findItem(items,id); if (it){ it.qty = Math.max(1,it.qty-1); writeCart(items); render(); } }
      if (rem){ const li = rem.closest('li'); const id = li.dataset.productId; window.sopoppedCart.remove(id); }
    });

    // manual qty change
    cartList.addEventListener('change', (e)=>{
      if (e.target.classList.contains('item-qty')){
        const li = e.target.closest('li'); const id = li.dataset.productId; window.sopoppedCart.setQty(id, e.target.value);
      }
    });
  }

  // initialize
  render();
});
