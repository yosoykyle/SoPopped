// cartHelpers.js - utilities to merge and persist cart data between localStorage and server
// Simplified, single implementation (removed accidental duplicate definitions).
(function ($) {
  'use strict';

  // Safely fetch the server cart and normalize the result to an array
  async function _fetchServerCart(loadUrl) {
    try {
      const json = await window.sopoppedFetch.json(loadUrl).catch(() => null);
      if (json && json.success && Array.isArray(json.cart)) return json.cart;
      return [];
    } catch (e) {
      return [];
    }
  }

  // Safely save cart array to server; ignore errors (best-effort)
  async function _saveServerCart(saveUrl, cartArray) {
    try {
      await window.sopoppedFetch.postJSON(saveUrl, cartArray).catch(() => null);
    } catch (e) { /* ignore save failures */ }
  }

  // Merge two arrays (server and local). Behavior: sum quantities for same id.
  function _mergeArrays(serverArr, localArr) {
    const map = Object.create(null);
    (serverArr || []).forEach((it) => {
      const id = String(it.id ?? '');
      if (!id) return;
      const qty = Number(it.quantity ?? it.qty ?? 0) || 0;
      map[id] = Object.assign({}, it, { id: Number(id), quantity: qty });
    });
    (localArr || []).forEach((it) => {
      const id = String(it.id ?? '');
      if (!id) return;
      const qty = Number(it.quantity ?? it.qty ?? 0) || 0;
      if (map[id]) {
        map[id].quantity = (Number(map[id].quantity || 0) || 0) + qty;
      } else {
        map[id] = Object.assign({}, it, { id: Number(id), quantity: qty });
      }
    });
    return Object.keys(map).map((k) => map[k]);
  }

  // Public helper: merge localStorage cart with server cart and persist both sides
  async function mergeLocalWithServer(localKey, loadUrl, saveUrl) {
    try {
      const localRaw = localStorage.getItem(localKey) || '[]';
      const local = JSON.parse(localRaw) || [];
      const server = await _fetchServerCart(loadUrl).catch(() => []);
      const merged = _mergeArrays(server, local);
      try { localStorage.setItem(localKey, JSON.stringify(merged)); } catch (e) {}
      await _saveServerCart(saveUrl, merged);
      return merged;
    } catch (e) {
      return [];
    }
  }

  // Export to global namespace in a single place
  if (typeof window !== 'undefined') {
    window.cartHelpers = window.cartHelpers || {};
    window.cartHelpers.mergeLocalWithServer = mergeLocalWithServer;
  }

})(jQuery);