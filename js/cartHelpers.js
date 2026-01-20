/**
 * =============================================================================
 * File: js/cartHelpers.js
 * Purpose: Utilities to merge and persist cart data between localStorage and server.
 * =============================================================================
 *
 * This module provides helper functions for synchronizing cart data between
 * the client-side localStorage and the server database. It implements a
 * merge strategy that sums quantities for items with the same product ID.
 *
 * Exports (window.cartHelpers):
 *   - mergeLocalWithServer(localKey, loadUrl, saveUrl): Merge and sync cart data
 *
 * Merge Strategy:
 *   When merging local and server carts:
 *   - Items with same ID: quantities are summed
 *   - Items only in local: added to merged result
 *   - Items only in server: preserved as-is
 *
 * Dependencies:
 *   - fetchHelper.js (sopoppedFetch.json, sopoppedFetch.postJSON)
 *   - jQuery (passed but not heavily used)
 * =============================================================================
 */

(function ($) {
  "use strict";

  // ---------------------------------------------------------------------------
  // 1. SERVER COMMUNICATION HELPERS (Private)
  // ---------------------------------------------------------------------------

  /**
   * Fetch cart array from server.
   * @param {string} loadUrl - API endpoint URL to fetch cart from
   * @returns {Promise<Array>} Cart items array or empty array on error
   * @private
   */
  async function _fetchServerCart(loadUrl) {
    try {
      const json = await window.sopoppedFetch.json(loadUrl).catch(() => null);
      // Handle both { success: true, cart: [...] } and direct array responses
      if (json && json.success && Array.isArray(json.cart)) return json.cart;
      return [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Save cart array to server (best-effort, ignores errors).
   * @param {string} saveUrl - API endpoint URL to save cart to
   * @param {Array} cartArray - Array of cart items to save
   * @private
   */
  async function _saveServerCart(saveUrl, cartArray) {
    try {
      await window.sopoppedFetch.postJSON(saveUrl, cartArray).catch(() => null);
    } catch (e) {
      // Ignore save failures - best effort only
    }
  }

  // ---------------------------------------------------------------------------
  // 2. MERGE LOGIC (Private)
  // ---------------------------------------------------------------------------

  /**
   * Merge two cart arrays, summing quantities for duplicate product IDs.
   * @param {Array} serverArr - Cart items from server
   * @param {Array} localArr - Cart items from localStorage
   * @returns {Array} Merged cart items with summed quantities
   * @private
   */
  function _mergeArrays(serverArr, localArr) {
    // Use object map for O(1) ID lookups
    const map = Object.create(null);

    // Process server items first (they take priority for metadata)
    (serverArr || []).forEach((it) => {
      const id = String(it.id ?? "");
      if (!id) return;
      const qty = Number(it.quantity ?? it.qty ?? 0) || 0;
      map[id] = Object.assign({}, it, { id: Number(id), quantity: qty });
    });

    // Merge local items (sum quantities for existing, add new)
    (localArr || []).forEach((it) => {
      const id = String(it.id ?? "");
      if (!id) return;
      const qty = Number(it.quantity ?? it.qty ?? 0) || 0;
      if (map[id]) {
        // Sum quantities for duplicate IDs
        map[id].quantity = (Number(map[id].quantity || 0) || 0) + qty;
      } else {
        map[id] = Object.assign({}, it, { id: Number(id), quantity: qty });
      }
    });

    // Convert map back to array
    return Object.keys(map).map((k) => map[k]);
  }

  // ---------------------------------------------------------------------------
  // 3. PUBLIC API
  // ---------------------------------------------------------------------------

  /**
   * Merge localStorage cart with server cart and persist to both sides.
   *
   * @param {string} localKey - localStorage key for cart data
   * @param {string} loadUrl - API URL to fetch server cart
   * @param {string} saveUrl - API URL to save merged cart
   * @returns {Promise<Array>} Merged cart items array
   *
   * @example
   * const merged = await window.cartHelpers.mergeLocalWithServer(
   *   'sopopped_cart_v1',
   *   './api/cart_load.php',
   *   './api/cart_save.php'
   * );
   */
  async function mergeLocalWithServer(localKey, loadUrl, saveUrl) {
    try {
      // Read local cart
      const localRaw = localStorage.getItem(localKey) || "[]";
      const local = JSON.parse(localRaw) || [];

      // Fetch server cart
      const server = await _fetchServerCart(loadUrl).catch(() => []);

      // Merge both carts
      const merged = _mergeArrays(server, local);

      // Save merged result to both localStorage and server
      try {
        localStorage.setItem(localKey, JSON.stringify(merged));
      } catch (e) {}
      await _saveServerCart(saveUrl, merged);

      return merged;
    } catch (e) {
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // 4. EXPORT TO GLOBAL NAMESPACE
  // ---------------------------------------------------------------------------

  if (typeof window !== "undefined") {
    window.cartHelpers = window.cartHelpers || {};
    window.cartHelpers.mergeLocalWithServer = mergeLocalWithServer;
  }
})(jQuery);
