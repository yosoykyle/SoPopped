// fetchHelper.js
// Lightweight wrapper around window.fetch to standardize JSON/form POSTs and
// reduce repeated boilerplate across the codebase. This file intentionally
// provides very small helpers that mirror the original fetch behavior so we
// don't change APIs or server interaction semantics.

(function ($) {
  if (typeof window === 'undefined') return;
  if (window.sopoppedFetch) return; // don't overwrite

  // Helper: normalize an object into application/x-www-form-urlencoded body
  function toUrlEncoded(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (data instanceof URLSearchParams) return data.toString();
    try {
      return new URLSearchParams(data).toString();
    } catch (e) {
      return '';
    }
  }

  window.sopoppedFetch = {
    // Perform a fetch and parse JSON response. options are passed to fetch.
    // Sets Accept: application/json and includes credentials by default.
    json: async function (url, options = {}) {
      const opts = Object.assign({}, options);
      opts.headers = Object.assign({ 
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }, opts.headers || {});
      // Default to including credentials so session cookies are sent.
      opts.credentials = opts.credentials || 'include';
      const res = await fetch(url, opts);
      return await res.json();
    },

    // POST JSON body and parse JSON response
    postJSON: async function (url, data, options = {}) {
      const opts = Object.assign({}, options, {
        method: 'POST',
        headers: Object.assign({ 
          'Content-Type': 'application/json', 
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }, (options && options.headers) || {}),
        credentials: (options && options.credentials) || 'include',
        body: JSON.stringify(data || {}),
      });
      const res = await fetch(url, opts);
      return await res.json();
    },

    // POST application/x-www-form-urlencoded body. Accepts object, URLSearchParams or string.
    postForm: async function (url, data, options = {}) {
      const body = toUrlEncoded(data);
      const opts = Object.assign({}, options, {
        method: 'POST',
        headers: Object.assign({ 
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', 
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }, (options && options.headers) || {}),
        credentials: (options && options.credentials) || 'include',
        body: body,
      });
      const res = await fetch(url, opts);
      return await res.json();
    },

    // POST FormData (multipart). Useful when sending files or when callers already have FormData.
    postFormData: async function (url, formData, options = {}) {
      const opts = Object.assign({}, options, {
        method: 'POST',
        // Let browser set Content-Type for FormData (including boundary)
        headers: Object.assign({ 
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }, (options && options.headers) || {}),
        credentials: (options && options.credentials) || 'include',
        body: formData,
      });
      const res = await fetch(url, opts);
      return await res.json();
    }
    ,
    // Lower-level request that returns both the raw Response and parsed JSON.
    // Useful when callers need to inspect response.ok/status in addition to body.
    request: async function (url, options = {}) {
      const opts = Object.assign({}, options);
      opts.headers = Object.assign({ 
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }, opts.headers || {});
      opts.credentials = opts.credentials || 'include';
      const res = await fetch(url, opts);
      let json = null;
      try { json = await res.json(); } catch (e) { /* ignore parse errors */ }
      return { response: res, ok: res.ok, status: res.status, json: json };
    }
  };
})(jQuery);