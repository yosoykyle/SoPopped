// Updates navbar cart badge on load and when cart changes
(function($){
  function updateBadge(count){
    $('.flavorCoutCart').text(String(count || 0));
  }

  // Try to use cart API if present
  function refresh(){
    if (window.sopoppedCart && typeof window.sopoppedCart.getCount === 'function'){
      updateBadge(window.sopoppedCart.getCount());
    } else {
      try{ const items = JSON.parse(localStorage.getItem('sopopped_cart_v1')||'[]'); updateBadge(items.length); }catch(e){ updateBadge(0); }
    }
  }

  $(function(){
    refresh();
    $(document).on('cart-changed', (e)=>{
      const c = (e && e.detail && typeof e.detail.count === 'number') ? e.detail.count : null;
      if (c !== null) updateBadge(c); else refresh();
    });
  });
})(jQuery);