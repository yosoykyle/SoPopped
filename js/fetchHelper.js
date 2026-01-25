/**
 * =============================================================================
 * File: js/fetchHelper.js
 * Purpose: The "Waiter" for the application.
 * =============================================================================
 *
 * NOTE:
 * In our Restaurant Analogy:
 * - This file is the "Waiter Training Manual".
 * - It teaches the JavaScript how to politely ask the PHP Kitchen for data.
 *
 * Why do we need this?
 * 1. Simplicity: Instead of writing 20 lines of code every time we want data, we write 1 line.
 * 2. Consistency: It guarantees every request wears the correct "Uniform" (Headers like 'application/json').
 * 3. Security: It ensures every request carries the User's ID Badge (Credentials/Cookies).
 * =============================================================================
 */

(function ($) {
  if (typeof window === "undefined") return;
  if (window.sopoppedFetch) return; // Prevention: Don't hire the same waiter twice.

  // ---------------------------------------------------------------------------
  // STEP 1: UTILITIES
  // ---------------------------------------------------------------------------
  // Helper to package data into a format helpful for form submissions.
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
  // STEP 2: THE MENU EXPORTS
  // ---------------------------------------------------------------------------

  window.sopoppedFetch = {
    /**
     * METHOD: json (GET)
     * Purpose: "Go get me the list of specials."
     * Use when: You want to READ data (Products, Orders) without changing anything.
     */
    json: async function (url, options = {}) {
      const opts = Object.assign({}, options);
      // "Wear the uniform" (Set Headers)
      opts.headers = Object.assign(
        {
          Accept: "application/json", // "I speak JSON"
          "X-Requested-With": "XMLHttpRequest", // "I am an App request"
        },
        opts.headers || {},
      );
      // "Bring ID Badge" (Cookies)
      opts.credentials = opts.credentials || "include";

      const res = await fetch(url, opts);
      return await res.json(); // "Translate the kitchen's response"
    },

    /**
     * METHOD: postJSON (POST)
     * Purpose: "Take this order to the kitchen."
     * Use when: You are SENDING data (Cart items, Logout) that changes the server state.
     */
    postJSON: async function (url, data, options = {}) {
      const opts = Object.assign({}, options, {
        method: "POST",
        headers: Object.assign(
          {
            "Content-Type": "application/json", // "This package is JSON"
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          (options && options.headers) || {},
        ),
        credentials: (options && options.credentials) || "include",
        body: JSON.stringify(data || {}), // "Pack the box"
      });
      const res = await fetch(url, opts);
      return await res.json();
    },

    /**
     * METHOD: postForm (POST)
     * Purpose: "Submit this paper form."
     * Use when: You are sending classic form data (Login, Signup) but via AJAX.
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
     * METHOD: postFormData (POST Multipart)
     * Purpose: "Upload this heavy package."
     * Use when: Sending Files (Images, etc.)
     */
    postFormData: async function (url, formData, options = {}) {
      const opts = Object.assign({}, options, {
        method: "POST",
        // Note: We DO NOT set Content-Type here. The browser does it automatically for files.
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
     * METHOD: request (Low Level)
     * Purpose: "Manual Control."
     * Use when: You need to check specific HTTP codes (e.g. 401 vs 403) manually.
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
        // Sometimes the kitchen is silent (Empty response), and that's okay.
      }
      return { response: res, ok: res.ok, status: res.status, json: json };
    },
  };
})(jQuery);
