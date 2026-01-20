/**
 * =============================================================================
 * File: js/loadComponents.js
 * Purpose: Dynamic loading of optional UI dependencies (jQuery UI).
 * =============================================================================
 *
 * This utility handles the lazy loading of heavy libraries like jQuery UI and
 * jQuery Validate. It ensures they are only loaded when needed, improving
 * initial page load performance.
 *
 * Features:
 *   - Checks if defined checkVar exists before loading
 *   - Returns Promise that resolves when loaded
 *   - Dispatches 'jquery-ui-loaded' event
 *   - Includes CSS loading helper
 *
 * Exports:
 *   - loadScript(url, checkVar)
 *   - loadStyle(url)
 *   - loadJqueryUI() - Main entry point
 * =============================================================================
 */

function loadScript(url, checkVar) {
  return new Promise((resolve, reject) => {
    if (checkVar && window[checkVar]) return resolve(); // Already loaded

    // Check if script tag already exists
    if (document.querySelector(`script[src="${url}"]`)) return resolve();

    const script = document.createElement("script");
    script.src = url;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadStyle(url) {
  if (document.querySelector(`link[href="${url}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

// Main loader function
function loadJqueryUI() {
  loadStyle("./node_modules/jquery-ui/dist/themes/base/jquery-ui.css");

  // Helper to check deep existence
  const hasUI = window.jQuery && window.jQuery.ui;
  const hasValidate =
    window.jQuery && window.jQuery.fn && window.jQuery.fn.validate;

  // Chain: Load UI -> Load Validate -> Dispatch

  // 1. Load UI (if missing)
  let uiPromise = Promise.resolve();
  if (!hasUI) {
    uiPromise = loadScript(
      "./node_modules/jquery-ui/dist/jquery-ui.min.js",
      "jQuery.ui",
    );
  }

  return uiPromise
    .then(() => {
      // 2. Load Validate (if missing)
      if (!hasValidate && (!window.jQuery || !window.jQuery.fn.validate)) {
        return loadScript(
          "./node_modules/jquery-validation/dist/jquery.validate.min.js",
          "jQuery.validator",
        );
      }
      return Promise.resolve();
    })
    .then(() => {
      // 3. Dispatch ready event
      document.dispatchEvent(new Event("jquery-ui-loaded"));
    })
    .catch((err) => console.error("Failed to load components", err));
}

// Auto-load on page load (can be deferred if strictly needed)
document.addEventListener("DOMContentLoaded", loadJqueryUI);
