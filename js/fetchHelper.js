/**
 * =============================================================================
 * File: js/fetchHelper.js
 * Purpose: Lightweight wrapper around window.fetch for standardized API calls.
 * =============================================================================
 *
 * This utility provides consistent HTTP request methods for the SoPopped
 * application. It standardizes headers, credentials handling, and response
 * parsing across all AJAX calls.
 *
 * Exports (window.sopoppedFetch):
 *   - json(url, options)        - GET request, parse JSON response
 *   - postJSON(url, data)       - POST JSON body, parse JSON response
 *   - postForm(url, data)       - POST form-urlencoded, parse JSON response
 *   - postFormData(url, formData) - POST multipart/form-data (for files)
 *   - request(url, options)     - Lower-level, returns {response, ok, status, json}
 *
 * Standard Headers Applied:
 *   - Accept: application/json
 *   - X-Requested-With: XMLHttpRequest (for AJAX detection server-side)
 *   - credentials: include (sends cookies for session)
 *
 * Dependencies:
 *   - Native fetch API (modern browsers)
 *   - jQuery (passed but not used)
 * =============================================================================
 */

(function ($) {
  if (typeof window === "undefined") return;
  if (window.sopoppedFetch) return; // Don't overwrite if already defined

  // ---------------------------------------------------------------------------
  // 1. UTILITY FUNCTIONS
  // ---------------------------------------------------------------------------

  /**
   * Convert data to URL-encoded string format.
   * Accepts objects, URLSearchParams, or strings.
   * @param {Object|URLSearchParams|string} data - Data to encode
   * @returns {string} URL-encoded string
   * @private
   */
  function toUrlEncoded(data) {
    if (!data) return "";
    if (typeof data === "string") return data;
    if (data instanceof URLSearchParams) return data.toString();
    try {
      return new URLSearchParams(data).toString();
    } catch (e) {
      return "";
    }
  }

  // ---------------------------------------------------------------------------
  // 2. API METHODS
  // ---------------------------------------------------------------------------

  window.sopoppedFetch = {
    /**
     * Perform a GET request and parse JSON response.
     * @param {string} url - URL to fetch
     * @param {Object} options - Additional fetch options
     * @returns {Promise<Object>} Parsed JSON response
     *
     * @example
     * const products = await window.sopoppedFetch.json('./api/products.php');
     */
    json: async function (url, options = {}) {
      const opts = Object.assign({}, options);
      opts.headers = Object.assign(
        {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        opts.headers || {},
      );
      // Include credentials so session cookies are sent
      opts.credentials = opts.credentials || "include";
      const res = await fetch(url, opts);
      return await res.json();
    },

    /**
     * POST JSON body and parse JSON response.
     * @param {string} url - URL to post to
     * @param {Object} data - Data to send as JSON
     * @param {Object} options - Additional fetch options
     * @returns {Promise<Object>} Parsed JSON response
     *
     * @example
     * const result = await window.sopoppedFetch.postJSON('./api/save.php', { id: 1, qty: 2 });
     */
    postJSON: async function (url, data, options = {}) {
      const opts = Object.assign({}, options, {
        method: "POST",
        headers: Object.assign(
          {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          (options && options.headers) || {},
        ),
        credentials: (options && options.credentials) || "include",
        body: JSON.stringify(data || {}),
      });
      const res = await fetch(url, opts);
      return await res.json();
    },

    /**
     * POST form-urlencoded body and parse JSON response.
     * Accepts object, URLSearchParams, or string.
     * @param {string} url - URL to post to
     * @param {Object|URLSearchParams|string} data - Form data to send
     * @param {Object} options - Additional fetch options
     * @returns {Promise<Object>} Parsed JSON response
     *
     * @example
     * const result = await window.sopoppedFetch.postForm('./api/login.php', { email, password });
     */
    postForm: async function (url, data, options = {}) {
      const body = toUrlEncoded(data);
      const opts = Object.assign({}, options, {
        method: "POST",
        headers: Object.assign(
          {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          (options && options.headers) || {},
        ),
        credentials: (options && options.credentials) || "include",
        body: body,
      });
      const res = await fetch(url, opts);
      return await res.json();
    },

    /**
     * POST FormData (multipart). Useful for file uploads.
     * Browser automatically sets Content-Type with boundary.
     * @param {string} url - URL to post to
     * @param {FormData} formData - FormData object with fields/files
     * @param {Object} options - Additional fetch options
     * @returns {Promise<Object>} Parsed JSON response
     *
     * @example
     * const fd = new FormData(document.getElementById('uploadForm'));
     * const result = await window.sopoppedFetch.postFormData('./api/upload.php', fd);
     */
    postFormData: async function (url, formData, options = {}) {
      const opts = Object.assign({}, options, {
        method: "POST",
        // Don't set Content-Type - browser sets it with boundary for FormData
        headers: Object.assign(
          {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          (options && options.headers) || {},
        ),
        credentials: (options && options.credentials) || "include",
        body: formData,
      });
      const res = await fetch(url, opts);
      return await res.json();
    },

    /**
     * Lower-level request that returns both Response and parsed JSON.
     * Useful when you need to inspect response.ok/status in addition to body.
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options (method, headers, body, etc.)
     * @returns {Promise<Object>} Object with { response, ok, status, json }
     *
     * @example
     * const { ok, status, json } = await window.sopoppedFetch.request('./api/login.php', {
     *   method: 'POST',
     *   body: formData
     * });
     * if (!ok) console.error('Failed with status:', status);
     */
    request: async function (url, options = {}) {
      const opts = Object.assign({}, options);
      opts.headers = Object.assign(
        {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        opts.headers || {},
      );
      opts.credentials = opts.credentials || "include";
      const res = await fetch(url, opts);
      let json = null;
      try {
        json = await res.json();
      } catch (e) {
        // Ignore parse errors - response may not be JSON
      }
      return { response: res, ok: res.ok, status: res.status, json: json };
    },
  };
})(jQuery);
